const cron = require('node-cron');
const logger = require('../config/logger');
const templateEngine = require('../utils/templateEngine');

const EmailMarketingService = require('./emailMarketingService');
const EmailCampaign = require('../models/EmailCampaign');
const EmailSubscriber = require('../models/EmailSubscriber');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const UserActivity = require('../models/UserActivity');

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
    const schedule = process.env.MARKETING_REENGAGEMENT_SCHEDULE || '15 10 * * *'; // daily 10:15

    // Re-engagement job
    this.jobs.push(
      cron.schedule(
        schedule,
        async () => {
          await this.runReengagementOnce();
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated lifecycle marketing service started', { timezone, schedule });
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
}

module.exports = new AutomatedLifecycleMarketingService();


