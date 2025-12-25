const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');

const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const UserActivity = require('../models/UserActivity');
const UserReferral = require('../models/UserReferral');
const Provider = require('../models/Provider');
const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');

const { Booking, Service } = require('../models/Marketplace');
const { UserSubscription } = require('../models/LocalProPlus');
const { Notification } = require('../models/Communication');

/**
 * Automated Lifecycle Mobile Notifications (Option A)
 *
 * Mobile-first version of lifecycle marketing: uses NotificationService so users without email
 * still receive in-app + push notifications (when opted-in).
 *
 * Eligibility:
 * - For marketing: UserSettings.notifications.push.enabled && push.marketing
 * - For system updates: push.systemUpdates
 * - For referral updates: push.referralUpdates
 * - For payment updates: push.paymentUpdates
 */
class AutomatedLifecycleMobileNotificationsService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) return;
    const timezone = process.env.TZ || 'UTC';

    // Re-engagement (marketing)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_REENGAGEMENT_SCHEDULE || '20 10 * * *', async () => {
        await this.runReengagementOnce();
      }, { timezone })
    );

    // Weekly digest (marketing)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_WEEKLY_DIGEST_SCHEDULE || '0 9 * * 1', async () => {
        await this.runWeeklyDigestOnce();
      }, { timezone })
    );

    // Welcome follow-ups (system updates)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_WELCOME_SERIES_SCHEDULE || '40 11 * * *', async () => {
        await this.runWelcomeFollowupsOnce();
      }, { timezone })
    );

    // Referral nudge (referral updates)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_REFERRAL_NUDGE_SCHEDULE || '10 13 * * *', async () => {
        await this.runReferralNudgesOnce();
      }, { timezone })
    );

    // Provider activation (system updates)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_PROVIDER_ACTIVATION_SCHEDULE || '40 13 * * *', async () => {
        await this.runProviderActivationOnce();
      }, { timezone })
    );

    // Subscription expiring soon (payment updates)
    this.jobs.push(
      cron.schedule(process.env.MOBILE_SUBSCRIPTION_EXPIRING_SCHEDULE || '0 14 * * *', async () => {
        await this.runSubscriptionExpiringSoonOnce();
      }, { timezone })
    );

    this.isRunning = true;
    logger.info('Automated lifecycle mobile notifications service started', { timezone });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  async runReengagementOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_REENGAGEMENT !== 'true') return;

    const inactiveDays = parseInt(process.env.MOBILE_INACTIVE_DAYS || '30');
    const cooldownDays = parseInt(process.env.MOBILE_REENGAGEMENT_COOLDOWN_DAYS || '14');
    const limit = parseInt(process.env.MOBILE_REENGAGEMENT_DAILY_LIMIT || '500');

    const now = new Date();
    const inactiveCutoff = new Date(now.getTime() - inactiveDays * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - cooldownDays * 24 * 60 * 60 * 1000);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.marketing': true
    }).select('userId').limit(limit * 3).lean();

    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    const inactive = await UserActivity.find({
      user: { $in: userIds },
      $or: [
        { lastActiveAt: { $lte: inactiveCutoff } },
        { lastActiveAt: null },
        { lastActiveAt: { $exists: false } }
      ]
    })
      .select('user lastActiveAt')
      .limit(limit * 3)
      .lean();

    const inactiveUserIds = inactive.map(a => a.user).filter(Boolean);
    if (inactiveUserIds.length === 0) return;

    const users = await User.find({ _id: { $in: inactiveUserIds }, isActive: true })
      .select('_id')
      .limit(limit)
      .lean();

    let sent = 0;
    let skipped = 0;

    for (const u of users) {
      const existing = await Notification.findOne({
        user: u._id,
        type: 'marketing_reengagement',
        createdAt: { $gte: cooldownCutoff }
      }).select('_id').lean();

      if (existing) { skipped += 1; continue; }

      await NotificationService.sendNotification({
        userId: u._id,
        type: 'marketing_reengagement',
        title: 'We miss you',
        message: 'Come back and see what’s new on LocalPro.',
        data: {},
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Mobile re-engagement completed', { inactiveDays, sent, skipped });
  }

  async runWeeklyDigestOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_WEEKLY_DIGEST !== 'true') return;

    const dedupDays = parseInt(process.env.MOBILE_WEEKLY_DIGEST_DEDUP_DAYS || '6');
    const maxUsers = parseInt(process.env.MOBILE_WEEKLY_DIGEST_MAX_USERS || '2000');

    const now = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const [newBookings, newServices] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: since } }),
      Service.countDocuments({ createdAt: { $gte: since }, isActive: true })
    ]);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.marketing': true
    }).select('userId').limit(maxUsers).lean();

    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    let sent = 0;
    let skipped = 0;
    for (const uid of userIds) {
      const existing = await Notification.findOne({
        user: uid,
        type: 'marketing_weekly_digest',
        createdAt: { $gte: dedupCutoff }
      }).select('_id').lean();
      if (existing) { skipped += 1; continue; }

      await NotificationService.sendNotification({
        userId: uid,
        type: 'marketing_weekly_digest',
        title: 'Weekly Digest',
        message: `${newBookings} new booking(s) and ${newServices} new service(s) this week.`,
        data: { since: since.toISOString(), newBookings, newServices },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Mobile weekly digest completed', { sent, skipped });
  }

  async runWelcomeFollowupsOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_WELCOME_FOLLOWUPS !== 'true') return;

    const limit = parseInt(process.env.MOBILE_WELCOME_FOLLOWUPS_DAILY_LIMIT || '1000');
    const dedupDays = parseInt(process.env.MOBILE_WELCOME_FOLLOWUPS_DEDUP_DAYS || '30');

    const now = new Date();
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.systemUpdates': true
    }).select('userId').limit(limit * 3).lean();
    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    const users = await User.find({ _id: { $in: userIds }, isActive: true })
      .select('_id createdAt')
      .limit(limit * 3)
      .lean();

    const day2Start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const day2End = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const day7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const day7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const day2 = users.filter(u => u.createdAt >= day2Start && u.createdAt < day2End).slice(0, limit);
    const day7 = users.filter(u => u.createdAt >= day7Start && u.createdAt < day7End).slice(0, limit);

    for (const [kind, arr] of [['day2', day2], ['day7', day7]]) {
      for (const u of arr) {
        const type = kind === 'day2' ? 'welcome_followup_day2' : 'welcome_followup_day7';
        const existing = await Notification.findOne({ user: u._id, type, createdAt: { $gte: dedupCutoff } })
          .select('_id').lean();
        if (existing) continue;

        await NotificationService.sendNotification({
          userId: u._id,
          type,
          title: 'Quick tip',
          message: kind === 'day2'
            ? 'Complete your profile to unlock more features.'
            : 'Explore services and try your first booking this week.',
          data: {},
          priority: 'low'
        });
      }
    }
  }

  async runReferralNudgesOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_REFERRAL_NUDGES !== 'true') return;

    const minAccountAgeDays = parseInt(process.env.MOBILE_REFERRAL_MIN_ACCOUNT_AGE_DAYS || '14');
    const dedupDays = parseInt(process.env.MOBILE_REFERRAL_DEDUP_DAYS || '14');
    const limit = parseInt(process.env.MOBILE_REFERRAL_LIMIT || '500');

    const now = new Date();
    const minCreatedAt = new Date(now.getTime() - minAccountAgeDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.referralUpdates': true
    }).select('userId').limit(limit * 3).lean();

    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    const referrals = await UserReferral.find({ user: { $in: userIds } })
      .select('user referralStats.totalReferrals referralCode')
      .lean();
    const refMap = new Map(referrals.map(r => [String(r.user), r]));

    const users = await User.find({ _id: { $in: userIds }, isActive: true, createdAt: { $lte: minCreatedAt } })
      .select('_id')
      .limit(limit)
      .lean();

    let sent = 0;
    for (const u of users) {
      const r = refMap.get(String(u._id));
      if (!r || (r.referralStats?.totalReferrals || 0) > 0) continue;

      const existing = await Notification.findOne({
        user: u._id,
        type: 'referral_nudge',
        createdAt: { $gte: dedupCutoff }
      }).select('_id').lean();
      if (existing) continue;

      await NotificationService.sendNotification({
        userId: u._id,
        type: 'referral_nudge',
        title: 'Invite friends',
        message: 'Share your referral link and earn rewards.',
        data: { referralCode: r.referralCode },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Mobile referral nudges completed', { sent });
  }

  async runProviderActivationOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_PROVIDER_ACTIVATION !== 'true') return;

    const minAccountAgeDays = parseInt(process.env.MOBILE_PROVIDER_MIN_ACCOUNT_AGE_DAYS || '7');
    const dedupDays = parseInt(process.env.MOBILE_PROVIDER_DEDUP_DAYS || '14');
    const limit = parseInt(process.env.MOBILE_PROVIDER_LIMIT || '300');

    const now = new Date();
    const minCreatedAt = new Date(now.getTime() - minAccountAgeDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.systemUpdates': true
    }).select('userId').limit(limit * 3).lean();
    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    const providers = await User.find({
      _id: { $in: userIds },
      roles: { $in: ['provider'] },
      isActive: true,
      createdAt: { $lte: minCreatedAt }
    }).select('_id').limit(limit).lean();

    const providerUserIds = providers.map(p => p._id);
    const providerDocs = await Provider.find({ userId: { $in: providerUserIds }, deleted: false })
      .select('_id userId professionalInfo')
      .lean();
    const providerByUser = new Map(providerDocs.map(p => [String(p.userId), p]));

    for (const u of providers) {
      const p = providerByUser.get(String(u._id));
      if (!p?.professionalInfo) continue;
      const prof = await ProviderProfessionalInfo.findById(p.professionalInfo).select('specialties').lean();
      const hasSpecialty = (prof?.specialties || []).length > 0;
      if (hasSpecialty) continue;

      const existing = await Notification.findOne({
        user: u._id,
        type: 'provider_activation_nudge',
        createdAt: { $gte: dedupCutoff }
      }).select('_id').lean();
      if (existing) continue;

      await NotificationService.sendNotification({
        userId: u._id,
        type: 'provider_activation_nudge',
        title: 'Get discovered',
        message: 'Add your skills and service areas to start getting bookings.',
        data: {},
        priority: 'low'
      });
    }
  }

  async runSubscriptionExpiringSoonOnce() {
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE !== 'true') return;
    if (process.env.ENABLE_MOBILE_SUBSCRIPTION_EXPIRING_SOON !== 'true') return;

    const daysBefore = parseInt(process.env.MOBILE_SUBSCRIPTION_DAYS_BEFORE || '3');
    const dedupDays = parseInt(process.env.MOBILE_SUBSCRIPTION_DEDUP_DAYS || '7');
    const limit = parseInt(process.env.MOBILE_SUBSCRIPTION_LIMIT || '500');

    const now = new Date();
    const start = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const settings = await UserSettings.find({
      'notifications.push.enabled': true,
      'notifications.push.paymentUpdates': true
    }).select('userId').limit(limit * 3).lean();
    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    const subs = await UserSubscription.find({
      user: { $in: userIds },
      status: 'active',
      endDate: { $gte: start, $lt: end }
    }).select('_id user endDate').limit(limit).lean();

    for (const s of subs) {
      const existing = await Notification.findOne({
        user: s.user,
        type: 'subscription_expiring_soon',
        'data.subscriptionId': s._id,
        createdAt: { $gte: dedupCutoff }
      }).select('_id').lean();
      if (existing) continue;

      await NotificationService.sendNotification({
        userId: s.user,
        type: 'subscription_expiring_soon',
        title: 'Subscription ending soon',
        message: 'Your subscription ends soon. Renew now to keep your benefits.',
        data: { subscriptionId: s._id, endDate: s.endDate },
        priority: 'medium'
      });
    }
  }
}

module.exports = new AutomatedLifecycleMobileNotificationsService();


