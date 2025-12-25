const cron = require('node-cron');
const logger = require('../config/logger');
const templateEngine = require('../utils/templateEngine');

const EmailMarketingService = require('./emailMarketingService');
const EmailCampaign = require('../models/EmailCampaign');
const EmailSubscriber = require('../models/EmailSubscriber');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const UserActivity = require('../models/UserActivity');
const { Booking } = require('../models/Marketplace');
const { Order } = require('../models/Supplies');
const UserReferral = require('../models/UserReferral');
const { Service } = require('../models/Marketplace');
const { UserSubscription } = require('../models/LocalProPlus');

/**
 * Automated Lifecycle Marketing Service
 *
 * Goal: add "always-on" marketing automations that are:
 * - opt-in (respects user settings and email subscriber status)
 * - idempotent / rate-limited (avoid spamming)
 * - uses existing EmailMarketingService so tracking + unsub links work
 *
 * Current automation implemented:
 * - Inactive user re-engagement email (daily)
 */
class AutomatedLifecycleMarketingService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) {
      logger.warn('Automated lifecycle marketing service is already running');
      return;
    }

    const timezone = process.env.TZ || 'UTC';
    const reengagementSchedule = process.env.MARKETING_REENGAGEMENT_SCHEDULE || '15 10 * * *'; // daily 10:15
    const weeklyDigestSchedule = process.env.MARKETING_WEEKLY_DIGEST_SCHEDULE || '0 9 * * 1'; // Monday 09:00
    const welcomeSeriesSchedule = process.env.MARKETING_WELCOME_SERIES_SCHEDULE || '30 11 * * *'; // daily 11:30
    const abandonedBookingSchedule = process.env.MARKETING_ABANDONED_BOOKING_SCHEDULE || '0 */2 * * *'; // every 2 hours
    const referralNudgeSchedule = process.env.MARKETING_REFERRAL_NUDGE_SCHEDULE || '0 13 * * *'; // daily 13:00
    const providerActivationSchedule = process.env.MARKETING_PROVIDER_ACTIVATION_SCHEDULE || '30 13 * * *'; // daily 13:30
    const churnPreventionSchedule = process.env.MARKETING_CHURN_PREVENTION_SCHEDULE || '0 14 * * *'; // daily 14:00

    // Re-engagement job
    this.jobs.push(
      cron.schedule(
        reengagementSchedule,
        async () => {
          await this.runReengagementOnce();
        },
        { timezone }
      )
    );

    // Weekly digest job
    this.jobs.push(
      cron.schedule(
        weeklyDigestSchedule,
        async () => {
          await this.runWeeklyDigestOnce();
        },
        { timezone }
      )
    );

    // Welcome series follow-ups (D2/D7)
    this.jobs.push(
      cron.schedule(
        welcomeSeriesSchedule,
        async () => {
          await this.runWelcomeSeriesOnce();
        },
        { timezone }
      )
    );

    // Abandoned booking/payment nudges
    this.jobs.push(
      cron.schedule(
        abandonedBookingSchedule,
        async () => {
          await this.runAbandonedBookingNudgesOnce();
        },
        { timezone }
      )
    );

    // Referral nudges
    this.jobs.push(
      cron.schedule(
        referralNudgeSchedule,
        async () => {
          await this.runReferralNudgesOnce();
        },
        { timezone }
      )
    );

    // Provider activation nudges
    this.jobs.push(
      cron.schedule(
        providerActivationSchedule,
        async () => {
          await this.runProviderActivationNudgesOnce();
        },
        { timezone }
      )
    );

    // Subscription churn prevention nudges
    this.jobs.push(
      cron.schedule(
        churnPreventionSchedule,
        async () => {
          await this.runChurnPreventionOnce();
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated lifecycle marketing service started', {
      timezone,
      reengagementSchedule,
      weeklyDigestSchedule,
      welcomeSeriesSchedule,
      abandonedBookingSchedule,
      referralNudgeSchedule,
      providerActivationSchedule,
      churnPreventionSchedule
    });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Automated lifecycle marketing service stopped');
  }

  async runReengagementOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_REENGAGEMENT !== 'true') {
      return;
    }

    const inactiveDays = parseInt(process.env.MARKETING_INACTIVE_DAYS || '30');
    const cooldownDays = parseInt(process.env.MARKETING_REENGAGEMENT_COOLDOWN_DAYS || '14');
    const dailyLimit = parseInt(process.env.MARKETING_REENGAGEMENT_DAILY_LIMIT || '200');

    const now = new Date();
    const inactiveCutoff = new Date(now.getTime() - inactiveDays * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    // Only target users that explicitly opted into marketing emails via UserSettings
    const optedInSettings = await UserSettings.find({
      'notifications.email.marketing': true,
      'notifications.email.enabled': true
    })
      .select('userId')
      .lean();

    const optedInUserIds = optedInSettings.map(s => s.userId).filter(Boolean);
    if (optedInUserIds.length === 0) {
      return;
    }

    // Inactive users among opt-in set
    const inactiveActivities = await UserActivity.find({
      user: { $in: optedInUserIds },
      $or: [
        { lastActiveAt: { $lte: inactiveCutoff } },
        { lastActiveAt: null },
        { lastActiveAt: { $exists: false } }
      ]
    })
      .select('user lastActiveAt')
      .limit(dailyLimit * 3) // fetch extra; we will filter further
      .lean();

    const inactiveUserIds = inactiveActivities.map(a => a.user).filter(Boolean);
    if (inactiveUserIds.length === 0) {
      return;
    }

    const users = await User.find({ _id: { $in: inactiveUserIds }, isActive: true })
      .select('_id email firstName lastName')
      .limit(dailyLimit * 3)
      .lean();

    // Build subscriber list (ensure subscribed + cooldown)
    const subscriberIds = [];
    let createdSubscribers = 0;
    let skipped = 0;

    for (const u of users) {
      if (subscriberIds.length >= dailyLimit) break;
      if (!u.email) continue;

      let subscriber = await EmailSubscriber.findOne({ $or: [{ user: u._id }, { email: u.email.toLowerCase() }] });

      if (!subscriber) {
        // Create a subscribed subscriber record (opt-in already confirmed via UserSettings)
        subscriber = await EmailSubscriber.create({
          user: u._id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          status: 'subscribed',
          source: 'app',
          preferences: {
            promotional: true,
            newsletter: true,
            announcements: true,
            tips: true
          },
          gdpr: {
            marketingConsent: true,
            consentDate: new Date(),
            lastUpdated: new Date()
          },
          doubleOptIn: {
            required: false,
            confirmed: true
          }
        });
        createdSubscribers += 1;
      }

      // Respect unsubscribe/bounce status
      if (subscriber.isDeleted || subscriber.status !== 'subscribed') {
        skipped += 1;
        continue;
      }

      // Cooldown (custom field)
      const lastSent = subscriber.customFields?.get?.('lastReengagementSentAt');
      if (lastSent) {
        const lastSentDate = new Date(lastSent);
        if (!isNaN(lastSentDate.getTime()) && lastSentDate >= cooldownCutoff) {
          skipped += 1;
          continue;
        }
      }

      // Stamp before sending to reduce duplicate sends if job reruns
      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set('lastReengagementSentAt', now.toISOString());
      await subscriber.save();

      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Re-engagement: no eligible subscribers found', { inactiveDays, cooldownDays, createdSubscribers, skipped });
      return;
    }

    const subject = process.env.MARKETING_REENGAGEMENT_SUBJECT || 'We miss you — new opportunities on LocalPro';
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Render campaign HTML using existing template, but keep personalization placeholders (firstName, unsubscribeUrl, etc.)
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'RE-ENGAGEMENT',
      headline: 'Come back and see what’s new',
      discountAmount: '',
      subtitle: 'New providers, new services, and new features are waiting for you.',
      promoText: 'Open the app to check your latest updates, messages, and offers.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink: `${frontend}/marketplace`,
      ctaButtonText: 'Explore Marketplace',
      termsText: 'You can update your email preferences anytime.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`,
      // leave {{firstName}}, {{unsubscribeUrl}}, {{preferencesUrl}} unresolved for EmailMarketingService.personalizeContent()
    });

    const campaignName = `Automated Re-engagement (${inactiveDays}d) - ${now.toISOString().slice(0, 10)}`;

    const campaign = await EmailCampaign.create({
      name: campaignName,
      subject,
      type: 're_engagement',
      content: {
        html,
        template: 'promotional'
      },
      audience: {
        type: 'manual',
        subscriberIds
      },
      schedule: {
        type: 'immediate',
        timezone: process.env.TZ || 'UTC'
      },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Re-engagement campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      createdSubscribers,
      skipped,
      sendSuccess: !!sendRes?.success
    });
  }

  async runWeeklyDigestOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_WEEKLY_DIGEST !== 'true') {
      return;
    }

    const dailyLimit = parseInt(process.env.MARKETING_WEEKLY_DIGEST_DAILY_LIMIT || '500');
    const cooldownDays = parseInt(process.env.MARKETING_WEEKLY_DIGEST_COOLDOWN_DAYS || '6'); // prevent rerun spam

    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Opt-in for digests: email enabled + weeklyDigest enabled
    const optedInSettings = await UserSettings.find({
      'notifications.email.weeklyDigest': true,
      'notifications.email.enabled': true
    })
      .select('userId')
      .lean();

    const userIds = optedInSettings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    // Load subscribers for those users
    const subscribers = await EmailSubscriber.find({
      user: { $in: userIds },
      status: 'subscribed',
      isDeleted: false,
      'preferences.weeklyDigest': true
    })
      .limit(dailyLimit * 2);

    const subscriberIds = [];
    let skipped = 0;

    for (const sub of subscribers) {
      if (subscriberIds.length >= dailyLimit) break;

      const lastSent = sub.customFields?.get?.('lastWeeklyDigestSentAt');
      if (lastSent) {
        const lastSentDate = new Date(lastSent);
        if (!isNaN(lastSentDate.getTime()) && lastSentDate >= cooldownCutoff) {
          skipped += 1;
          continue;
        }
      }

      // stamp before sending (idempotency-ish)
      sub.customFields = sub.customFields || new Map();
      sub.customFields.set('lastWeeklyDigestSentAt', now.toISOString());
      await sub.save();

      subscriberIds.push(sub._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Weekly digest: no eligible subscribers found', { skipped });
      return;
    }

    // Global platform stats (simple + safe)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [totalBookings7d, completedBookings7d, totalOrders7d] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo }, status: 'completed' }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    const subject = process.env.MARKETING_WEEKLY_DIGEST_SUBJECT || 'Your Weekly Digest — LocalPro';

    // Render digest template, but keep personalization placeholders (firstName/unsubscribeUrl/preferencesUrl)
    const html = templateEngine.render('digest', {
      subject,
      digestType: 'Weekly',
      dateRange: `${sevenDaysAgo.toDateString()} – ${now.toDateString()}`,
      totalBookings: String(totalBookings7d),
      totalEarnings: '-', // placeholder (not currently computed globally)
      avgRating: '-', // placeholder
      bookingsChange: '',
      bookingsChangeType: '',
      earningsChange: '',
      earningsChangeType: '',
      insight: `There were ${completedBookings7d} completed bookings and ${totalOrders7d} store orders in the last 7 days.`,
      ctaText: 'Open the app to see what’s new and manage your activity.',
      ctaLink: `${frontend}/`,
      ctaButtonText: 'Open LocalPro',
      activityUrl: `${frontend}/activity`,
      calendarUrl: `${frontend}/calendar`,
      websiteUrl: `${frontend}/`,
      helpUrl: `${frontend}/help`
      // leave {{firstName}}, {{unsubscribeUrl}}, {{preferencesUrl}} unresolved
    });

    const campaignName = `Automated Weekly Digest - ${now.toISOString().slice(0, 10)}`;

    const campaign = await EmailCampaign.create({
      name: campaignName,
      subject,
      type: 'digest',
      content: {
        html,
        template: 'digest'
      },
      audience: {
        type: 'manual',
        subscriberIds
      },
      schedule: {
        type: 'immediate',
        timezone: process.env.TZ || 'UTC'
      },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Weekly digest campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      skipped,
      sendSuccess: !!sendRes?.success
    });
  }

  // ==================== Helpers ====================

  async ensureSubscriberForUser(user, { source = 'app', preferences = {}, marketingConsent = false } = {}) {
    const email = (user.email || '').toLowerCase();
    if (!email) return null;

    let subscriber = await EmailSubscriber.findOne({ $or: [{ user: user._id }, { email }] });
    if (!subscriber) {
      subscriber = await EmailSubscriber.create({
        user: user._id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: 'subscribed',
        source,
        preferences: {
          newsletter: true,
          promotional: true,
          announcements: true,
          weeklyDigest: true,
          tips: true,
          ...preferences
        },
        gdpr: {
          marketingConsent: !!marketingConsent,
          consentDate: marketingConsent ? new Date() : undefined,
          lastUpdated: new Date()
        },
        doubleOptIn: {
          required: false,
          confirmed: true
        }
      });
      return subscriber;
    }

    // Respect unsubscribe/bounce status
    if (subscriber.isDeleted || subscriber.status !== 'subscribed') return null;
    return subscriber;
  }

  async getOptedInUserIds(settingKey) {
    const query = { 'notifications.email.enabled': true };
    query[`notifications.email.${settingKey}`] = true;
    const settings = await UserSettings.find(query).select('userId').lean();
    return settings.map(s => s.userId).filter(Boolean);
  }

  // ==================== New Automations ====================

  async runWelcomeSeriesOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_WELCOME_SERIES !== 'true') return;

    const dailyLimit = parseInt(process.env.MARKETING_WELCOME_SERIES_DAILY_LIMIT || '300');
    const now = new Date();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Use systemUpdates opt-in for onboarding follow-ups (safer than marketing-only).
    const userIds = await this.getOptedInUserIds('systemUpdates');
    if (userIds.length === 0) return;

    // Day 2 window: created 2-3 days ago
    const d2Start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const d2End = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    // Day 7 window: created 7-8 days ago
    const d7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const d7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const users = await User.find({ _id: { $in: userIds }, isActive: true })
      .select('_id email firstName lastName createdAt')
      .lean();

    const day2Users = users.filter(u => u.createdAt >= d2Start && u.createdAt < d2End).slice(0, dailyLimit);
    const day7Users = users.filter(u => u.createdAt >= d7Start && u.createdAt < d7End).slice(0, dailyLimit);

    await this.sendWelcomeFollowupCampaign({
      users: day2Users,
      kind: 'day2',
      subject: process.env.MARKETING_WELCOME_DAY2_SUBJECT || 'Quick tips to get the most from LocalPro',
      ctaLink: `${frontend}/profile`,
      ctaButtonText: 'Complete my profile'
    });

    await this.sendWelcomeFollowupCampaign({
      users: day7Users,
      kind: 'day7',
      subject: process.env.MARKETING_WELCOME_DAY7_SUBJECT || 'Your first week on LocalPro — what to try next',
      ctaLink: `${frontend}/marketplace`,
      ctaButtonText: 'Explore services'
    });
  }

  async sendWelcomeFollowupCampaign({ users, kind, subject, ctaLink, ctaButtonText }) {
    if (!users || users.length === 0) return;

    const now = new Date();
    const cooldownDays = parseInt(process.env.MARKETING_WELCOME_SERIES_COOLDOWN_DAYS || '30');
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    const subscriberIds = [];
    let skipped = 0;

    for (const u of users) {
      const subscriber = await this.ensureSubscriberForUser(u, { source: 'registration', marketingConsent: false });
      if (!subscriber) { skipped += 1; continue; }

      const key = kind === 'day2' ? 'lastWelcomeDay2SentAt' : 'lastWelcomeDay7SentAt';
      const lastSent = subscriber.customFields?.get?.(key);
      if (lastSent) {
        const d = new Date(lastSent);
        if (!isNaN(d.getTime()) && d >= cooldownCutoff) { skipped += 1; continue; }
      }

      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set(key, now.toISOString());
      await subscriber.save();
      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Welcome follow-up: no eligible subscribers', { kind, skipped });
      return;
    }

    // Use promotional template for follow-ups; keep personalization placeholders for EmailMarketingService
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'GET STARTED',
      headline: kind === 'day2' ? 'A few quick tips' : 'Keep going — you’re almost set',
      discountAmount: '',
      subtitle: 'Take 2 minutes to unlock more value from LocalPro.',
      promoText: kind === 'day2'
        ? 'Complete your profile and explore services near you.'
        : 'Try your first booking, check messages, and explore new opportunities.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink,
      ctaButtonText,
      termsText: 'You can manage email preferences anytime.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`
    });

    const campaign = await EmailCampaign.create({
      name: `Automated Welcome Follow-up (${kind}) - ${now.toISOString().slice(0, 10)}`,
      subject,
      type: 'welcome_series',
      content: { html, template: 'promotional' },
      audience: { type: 'manual', subscriberIds },
      schedule: { type: 'immediate', timezone: process.env.TZ || 'UTC' },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Welcome follow-up campaign triggered', {
      kind,
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      sendSuccess: !!sendRes?.success
    });
  }

  async runAbandonedBookingNudgesOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_ABANDONED_BOOKING !== 'true') return;

    const minAgeMinutes = parseInt(process.env.MARKETING_ABANDONED_BOOKING_MIN_AGE_MINUTES || '60');
    const maxAgeDays = parseInt(process.env.MARKETING_ABANDONED_BOOKING_MAX_AGE_DAYS || '7');
    const dailyLimit = parseInt(process.env.MARKETING_ABANDONED_BOOKING_LIMIT || '200');
    const cooldownDays = parseInt(process.env.MARKETING_ABANDONED_BOOKING_COOLDOWN_DAYS || '3');

    const now = new Date();
    const minAge = new Date(now.getTime() - minAgeMinutes * 60 * 1000);
    const maxAge = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    // Booking updates opt-in
    const userIds = await this.getOptedInUserIds('bookingUpdates');
    if (userIds.length === 0) return;

    const bookings = await Booking.find({
      client: { $in: userIds },
      createdAt: { $lte: minAge, $gte: maxAge },
      status: 'pending',
      'payment.status': 'pending',
      'payment.method': { $in: ['paypal', 'paymongo'] }
    })
      .select('_id client createdAt payment.method')
      .limit(dailyLimit)
      .lean();

    if (bookings.length === 0) return;

    const clients = await User.find({ _id: { $in: bookings.map(b => b.client) } })
      .select('_id email firstName lastName')
      .lean();
    const clientMap = new Map(clients.map(u => [String(u._id), u]));

    const subscriberIds = [];
    let skipped = 0;

    for (const b of bookings) {
      const u = clientMap.get(String(b.client));
      if (!u) continue;
      const subscriber = await this.ensureSubscriberForUser(u, { source: 'booking', marketingConsent: false });
      if (!subscriber) { skipped += 1; continue; }

      const lastSent = subscriber.customFields?.get?.('lastAbandonedBookingNudgeAt');
      if (lastSent) {
        const d = new Date(lastSent);
        if (!isNaN(d.getTime()) && d >= cooldownCutoff) { skipped += 1; continue; }
      }

      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set('lastAbandonedBookingNudgeAt', now.toISOString());
      await subscriber.save();
      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Abandoned booking: no eligible subscribers', { skipped });
      return;
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = process.env.MARKETING_ABANDONED_BOOKING_SUBJECT || 'Complete your booking — it only takes a minute';
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'BOOKING',
      headline: 'Finish your booking',
      discountAmount: '',
      subtitle: 'Your booking is still pending.',
      promoText: 'Complete payment/confirmation to lock in your schedule.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink: `${frontend}/marketplace/bookings`,
      ctaButtonText: 'View my booking',
      termsText: 'If you already completed this, you can ignore this email.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`
    });

    const campaign = await EmailCampaign.create({
      name: `Automated Abandoned Booking Nudge - ${now.toISOString().slice(0, 10)}`,
      subject,
      type: 'transactional',
      content: { html, template: 'promotional' },
      audience: { type: 'manual', subscriberIds },
      schedule: { type: 'immediate', timezone: process.env.TZ || 'UTC' },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Abandoned booking nudge campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      sendSuccess: !!sendRes?.success
    });
  }

  async runReferralNudgesOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_REFERRAL_NUDGE !== 'true') return;

    const dailyLimit = parseInt(process.env.MARKETING_REFERRAL_NUDGE_DAILY_LIMIT || '200');
    const minAccountAgeDays = parseInt(process.env.MARKETING_REFERRAL_MIN_ACCOUNT_AGE_DAYS || '14');
    const cooldownDays = parseInt(process.env.MARKETING_REFERRAL_NUDGE_COOLDOWN_DAYS || '14');
    const now = new Date();
    const minCreatedAt = new Date(now.getTime() - minAccountAgeDays * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    const userIds = await this.getOptedInUserIds('referralUpdates');
    if (userIds.length === 0) return;

    const referrals = await UserReferral.find({ user: { $in: userIds } })
      .select('user referralCode referralStats.totalReferrals')
      .lean();

    const referralMap = new Map(referrals.map(r => [String(r.user), r]));

    const users = await User.find({ _id: { $in: userIds }, isActive: true, createdAt: { $lte: minCreatedAt } })
      .select('_id email firstName lastName')
      .limit(dailyLimit * 3)
      .lean();

    const subscriberIds = [];
    let skipped = 0;

    for (const u of users) {
      if (subscriberIds.length >= dailyLimit) break;
      const r = referralMap.get(String(u._id));
      if (!r || (r.referralStats?.totalReferrals || 0) > 0) continue;

      // Ensure referral code exists
      let referralCode = r.referralCode;
      if (!referralCode) {
        const doc = await UserReferral.findOrCreateForUser(u._id);
        const initials = `${(u.firstName || '').slice(0, 1)}${(u.lastName || '').slice(0, 1)}`.toUpperCase();
        doc.generateReferralCode(initials || undefined);
        await doc.save();
        referralCode = doc.referralCode;
      }

      const subscriber = await this.ensureSubscriberForUser(u, { source: 'referral', marketingConsent: false });
      if (!subscriber) { skipped += 1; continue; }

      const lastSent = subscriber.customFields?.get?.('lastReferralNudgeSentAt');
      if (lastSent) {
        const d = new Date(lastSent);
        if (!isNaN(d.getTime()) && d >= cooldownCutoff) { skipped += 1; continue; }
      }

      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const referralLink = `${frontend}/signup?ref=${referralCode}`;

      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set('lastReferralNudgeSentAt', now.toISOString());
      subscriber.customFields.set('referralLink', referralLink);
      await subscriber.save();

      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Referral nudge: no eligible subscribers', { skipped });
      return;
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = process.env.MARKETING_REFERRAL_NUDGE_SUBJECT || 'Invite friends & earn rewards on LocalPro';
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'REFERRALS',
      headline: 'Share LocalPro and earn rewards',
      discountAmount: '',
      subtitle: 'Invite friends with your personal link.',
      promoText: 'Each successful referral helps you unlock more rewards and perks.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink: '{{referralLink}}',
      ctaButtonText: 'Copy my referral link',
      termsText: 'Rewards and eligibility may vary by region.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`
    });

    const campaign = await EmailCampaign.create({
      name: `Automated Referral Nudge - ${now.toISOString().slice(0, 10)}`,
      subject,
      type: 'promotional',
      content: { html, template: 'promotional' },
      audience: { type: 'manual', subscriberIds },
      schedule: { type: 'immediate', timezone: process.env.TZ || 'UTC' },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Referral nudge campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      sendSuccess: !!sendRes?.success
    });
  }

  async runProviderActivationNudgesOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_PROVIDER_ACTIVATION !== 'true') return;

    const dailyLimit = parseInt(process.env.MARKETING_PROVIDER_ACTIVATION_DAILY_LIMIT || '200');
    const minAccountAgeDays = parseInt(process.env.MARKETING_PROVIDER_ACTIVATION_MIN_ACCOUNT_AGE_DAYS || '7');
    const cooldownDays = parseInt(process.env.MARKETING_PROVIDER_ACTIVATION_COOLDOWN_DAYS || '14');
    const now = new Date();
    const minCreatedAt = new Date(now.getTime() - minAccountAgeDays * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    // System updates opt-in (product onboarding)
    const userIds = await this.getOptedInUserIds('systemUpdates');
    if (userIds.length === 0) return;

    const providers = await User.find({
      _id: { $in: userIds },
      roles: { $in: ['provider'] },
      isActive: true,
      createdAt: { $lte: minCreatedAt }
    })
      .select('_id email firstName lastName createdAt')
      .limit(dailyLimit * 3)
      .lean();

    if (providers.length === 0) return;

    const providerIds = providers.map(p => p._id);
    const existing = await Service.aggregate([
      { $match: { provider: { $in: providerIds } } },
      { $group: { _id: '$provider', count: { $sum: 1 } } }
    ]);
    const hasService = new Set(existing.map(x => String(x._id)));

    const subscriberIds = [];
    let skipped = 0;

    for (const p of providers) {
      if (subscriberIds.length >= dailyLimit) break;
      if (hasService.has(String(p._id))) continue;

      const subscriber = await this.ensureSubscriberForUser(p, { source: 'app', marketingConsent: false });
      if (!subscriber) { skipped += 1; continue; }

      const lastSent = subscriber.customFields?.get?.('lastProviderActivationSentAt');
      if (lastSent) {
        const d = new Date(lastSent);
        if (!isNaN(d.getTime()) && d >= cooldownCutoff) { skipped += 1; continue; }
      }

      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set('lastProviderActivationSentAt', now.toISOString());
      await subscriber.save();
      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Provider activation: no eligible subscribers', { skipped });
      return;
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = process.env.MARKETING_PROVIDER_ACTIVATION_SUBJECT || 'Publish your first service on LocalPro';
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'PROVIDERS',
      headline: 'Get discovered by clients',
      discountAmount: '',
      subtitle: 'Publishing your first service takes just a few minutes.',
      promoText: 'Add your service, set your pricing, and start receiving booking requests.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink: `${frontend}/provider/services/new`,
      ctaButtonText: 'Create my first service',
      termsText: 'Tip: add photos and clear pricing to boost bookings.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`
    });

    const campaign = await EmailCampaign.create({
      name: `Automated Provider Activation - ${now.toISOString().slice(0, 10)}`,
      subject,
      type: 'transactional',
      content: { html, template: 'promotional' },
      audience: { type: 'manual', subscriberIds },
      schedule: { type: 'immediate', timezone: process.env.TZ || 'UTC' },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Provider activation campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      sendSuccess: !!sendRes?.success
    });
  }

  async runChurnPreventionOnce() {
    if (process.env.ENABLE_AUTOMATED_MARKETING_CHURN_PREVENTION !== 'true') return;

    const daysBefore = parseInt(process.env.MARKETING_CHURN_DAYS_BEFORE || '3');
    const dailyLimit = parseInt(process.env.MARKETING_CHURN_DAILY_LIMIT || '200');
    const cooldownDays = parseInt(process.env.MARKETING_CHURN_COOLDOWN_DAYS || '7');

    const now = new Date();
    const start = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    // Payment updates opt-in (billing related)
    const userIds = await this.getOptedInUserIds('paymentUpdates');
    if (userIds.length === 0) return;

    const subs = await UserSubscription.find({
      user: { $in: userIds },
      status: 'active',
      endDate: { $gte: start, $lt: end }
    })
      .select('user endDate billingCycle')
      .limit(dailyLimit * 2)
      .lean();

    if (subs.length === 0) return;

    const users = await User.find({ _id: { $in: subs.map(s => s.user) }, isActive: true })
      .select('_id email firstName lastName')
      .lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const subscriberIds = [];
    let skipped = 0;

    for (const s of subs) {
      if (subscriberIds.length >= dailyLimit) break;
      const u = userMap.get(String(s.user));
      if (!u) continue;

      const subscriber = await this.ensureSubscriberForUser(u, { source: 'checkout', marketingConsent: false });
      if (!subscriber) { skipped += 1; continue; }

      const lastSent = subscriber.customFields?.get?.('lastChurnPreventionSentAt');
      if (lastSent) {
        const d = new Date(lastSent);
        if (!isNaN(d.getTime()) && d >= cooldownCutoff) { skipped += 1; continue; }
      }

      subscriber.customFields = subscriber.customFields || new Map();
      subscriber.customFields.set('lastChurnPreventionSentAt', now.toISOString());
      await subscriber.save();
      subscriberIds.push(subscriber._id);
    }

    if (subscriberIds.length === 0) {
      logger.info('Churn prevention: no eligible subscribers', { skipped });
      return;
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = process.env.MARKETING_CHURN_SUBJECT || 'Your subscription is ending soon — keep your benefits';
    const html = templateEngine.render('promotional', {
      subject,
      badgeText: 'SUBSCRIPTION',
      headline: 'Stay active and keep your benefits',
      discountAmount: '',
      subtitle: `Your plan is ending in about ${daysBefore} day(s).`,
      promoText: 'Renew now to avoid interruptions and keep premium features enabled.',
      promoCode: '',
      promoCodeNote: '',
      ctaLink: `${frontend}/localpro-plus`,
      ctaButtonText: 'Manage subscription',
      termsText: 'If you already renewed, you can ignore this email.',
      countdownDays: '',
      countdownHours: '',
      countdownMinutes: '',
      facebookUrl: frontend,
      twitterUrl: frontend,
      instagramUrl: frontend,
      websiteUrl: frontend,
      helpUrl: `${frontend}/help`
    });

    const campaign = await EmailCampaign.create({
      name: `Automated Churn Prevention - ${now.toISOString().slice(0, 10)}`,
      subject,
      type: 'transactional',
      content: { html, template: 'promotional' },
      audience: { type: 'manual', subscriberIds },
      schedule: { type: 'immediate', timezone: process.env.TZ || 'UTC' },
      status: 'draft'
    });

    const sendRes = await EmailMarketingService.sendCampaign(campaign._id);
    logger.info('Churn prevention campaign triggered', {
      campaignId: campaign._id,
      recipients: subscriberIds.length,
      sendSuccess: !!sendRes?.success
    });
  }
}

module.exports = new AutomatedLifecycleMarketingService();


