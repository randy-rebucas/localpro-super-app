const cron = require('node-cron');
const logger = require('../config/logger');
const UserReferral = require('../models/UserReferral');
const NotificationService = require('./notificationService');
const { Notification } = require('../models/Communication');

/**
 * Automated Referral Tier Milestones
 *
 * Notifies users when their referral tier is upgraded (silver/gold/platinum).
 * Uses UserReferral.referralStats.referralTier and dedupes notifications.
 */
class AutomatedReferralTierMilestoneService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.REFERRAL_TIER_SCHEDULE || '0 12 * * *'; // daily 12:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated referral tier milestone service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES !== 'true') return;

    const lookbackDays = parseInt(process.env.REFERRAL_TIER_LOOKBACK_DAYS || '2');
    const dedupDays = parseInt(process.env.REFERRAL_TIER_DEDUP_DAYS || '30');
    const limit = parseInt(process.env.REFERRAL_TIER_LIMIT || '500');

    const now = new Date();
    const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    // Only scan recently updated referrals to avoid heavy queries
    const referrals = await UserReferral.find({
      updatedAt: { $gte: since },
      'referralStats.referralTier': { $in: ['silver', 'gold', 'platinum'] }
    })
      .select('user referralStats.referralTier')
      .limit(limit)
      .lean();

    if (referrals.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const r of referrals) {
      const tier = r.referralStats?.referralTier;
      if (!tier) continue;

      const existing = await Notification.findOne({
        user: r.user,
        type: 'referral_tier_upgraded',
        'data.tier': tier,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: r.user,
        type: 'referral_tier_upgraded',
        title: 'Referral tier upgraded',
        message: `Congrats! You’ve reached the ${tier.toUpperCase()} referral tier.`,
        data: { tier },
        priority: 'low'
      });

      sent += 1;
    }

    logger.info('Referral tier milestone notifications completed', { checked: referrals.length, sent, skipped });
  }
}

module.exports = new AutomatedReferralTierMilestoneService();


