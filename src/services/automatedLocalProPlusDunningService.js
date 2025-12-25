const cron = require('node-cron');
const logger = require('../config/logger');
const { UserSubscription } = require('../models/LocalProPlus');
const NotificationService = require('./notificationService');
const { Notification } = require('../models/Communication');

/**
 * Automated LocalPro Plus Dunning (lightweight)
 *
 * Sends follow-up reminders for subscriptions that expired recently (best-effort).
 * This complements automatedSubscriptionService which already notifies on failed renewal/expiry.
 */
class AutomatedLocalProPlusDunningService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;
    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.SUBSCRIPTION_DUNNING_SCHEDULE || '0 11 * * *'; // daily 11:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated LocalPro Plus dunning service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING !== 'true') return;

    const lookbackDays = parseInt(process.env.SUBSCRIPTION_DUNNING_LOOKBACK_DAYS || '14');
    const remindDays = (process.env.SUBSCRIPTION_DUNNING_REMIND_DAYS || '1,3,7')
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0);
    const dedupHours = parseInt(process.env.SUBSCRIPTION_DUNNING_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.SUBSCRIPTION_DUNNING_LIMIT || '300');

    const now = new Date();
    const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    const subs = await UserSubscription.find({
      status: { $in: ['expired', 'cancelled', 'suspended'] },
      updatedAt: { $gte: since }
    })
      .select('_id user status updatedAt plan')
      .limit(limit)
      .lean();

    if (subs.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const s of subs) {
      const daysSince = Math.floor((now.getTime() - new Date(s.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
      if (!remindDays.includes(daysSince)) continue;

      const existing = await Notification.findOne({
        user: s.user,
        type: 'subscription_dunning_reminder',
        'data.subscriptionId': s._id,
        'data.day': daysSince,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: s.user,
        type: 'subscription_dunning_reminder',
        title: 'Restore your subscription',
        message: 'Your LocalPro Plus subscription is inactive. Update your payment method or renew to restore benefits.',
        data: { subscriptionId: s._id, day: daysSince, status: s.status },
        priority: 'medium'
      });
      sent += 1;
    }

    logger.info('Subscription dunning completed', { checked: subs.length, sent, skipped });
  }
}

module.exports = new AutomatedLocalProPlusDunningService();


