const cron = require('node-cron');
const logger = require('../../../src/config/logger');
const { Order } = require('../models/Supplies');
const NotificationService = require('../../../src/services/notificationService');
const { Notification } = require('../../../src/models/Communication');

/**
 * Automated Supplies Reorder Reminders
 *
 * Heuristic:
 * - Find customers with delivered orders
 * - If their last delivered order is older than X days, remind to reorder
 *
 * Notifications only.
 */
class AutomatedSuppliesReorderReminderService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;
    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.SUPPLIES_REORDER_SCHEDULE || '0 9 * * 1'; // weekly Monday 9am

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated supplies reorder reminder service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS !== 'true') return;

    const daysSinceLast = parseInt(process.env.SUPPLIES_REORDER_DAYS_SINCE_LAST || '30');
    const dedupDays = parseInt(process.env.SUPPLIES_REORDER_DEDUP_DAYS || '14');
    const limit = parseInt(process.env.SUPPLIES_REORDER_LIMIT || '500');

    const now = new Date();
    const lastCutoff = new Date(now.getTime() - daysSinceLast * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    // Find last delivered order per customer
    const rows = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: '$customer', lastDeliveredAt: { $max: '$updatedAt' } } },
      { $match: { lastDeliveredAt: { $lte: lastCutoff } } },
      { $sort: { lastDeliveredAt: 1 } },
      { $limit: limit }
    ]);

    if (!rows || rows.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const r of rows) {
      const customerId = r._id;
      const existing = await Notification.findOne({
        user: customerId,
        type: 'supplies_reorder_reminder',
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: customerId,
        type: 'supplies_reorder_reminder',
        title: 'Time to reorder supplies?',
        message: 'It\u2019s been a while since your last supplies order. Reorder now to keep your stock ready.',
        data: { lastDeliveredAt: r.lastDeliveredAt },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Supplies reorder reminders completed', { candidates: rows.length, sent, skipped });
  }
}

module.exports = new AutomatedSuppliesReorderReminderService();
