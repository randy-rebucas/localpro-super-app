const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Rental } = require('../models/Rentals');
const { Notification } = require('../models/Communication');

/**
 * Automated Rental Reminder Service
 *
 * - Rental due soon reminders (before rentalPeriod.endDate)
 * - Rental overdue reminders (after endDate, not completed)
 *
 * Only sends notifications (no auto-fees or state changes).
 */
class AutomatedRentalReminderService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.RENTAL_REMINDER_SCHEDULE || '0 9 * * *'; // daily 9:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated rental reminder service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_RENTAL_REMINDERS !== 'true') return;

    const daysBefore = parseInt(process.env.RENTAL_DUE_SOON_DAYS_BEFORE || '1');
    const dedupHours = parseInt(process.env.RENTAL_REMINDER_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.RENTAL_REMINDER_LIMIT || '300');

    const now = new Date();
    const dueStart = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    const dueEnd = new Date(now.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    await Promise.all([
      this._dueSoon({ dueStart, dueEnd, dedupCutoff, limit }),
      this._overdue({ now, dedupCutoff, limit })
    ]);
  }

  async _dueSoon({ dueStart, dueEnd, dedupCutoff, limit }) {
    const rentals = await Rental.find({
      status: { $in: ['confirmed', 'active'] },
      'rentalPeriod.endDate': { $gte: dueStart, $lt: dueEnd }
    })
      .select('_id renter owner rentalPeriod.endDate')
      .limit(limit)
      .lean();

    for (const r of rentals) {
      const dueDateIso = new Date(r.rentalPeriod.endDate).toISOString().slice(0, 10);
      // renter reminder
      const existingRenter = await Notification.findOne({
        user: r.renter,
        type: 'rental_due_soon',
        'data.rentalId': r._id,
        'data.dueDate': dueDateIso,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (!existingRenter) {
        await NotificationService.sendNotification({
          userId: r.renter,
          type: 'rental_due_soon',
          title: 'Rental due soon',
          message: `Reminder: your rental is due on ${dueDateIso}. Please prepare for return.`,
          data: { rentalId: r._id, dueDate: dueDateIso },
          priority: 'medium'
        });
      }

      // owner heads-up (optional)
      if (process.env.RENTAL_REMINDER_NOTIFY_OWNER === 'true') {
        const existingOwner = await Notification.findOne({
          user: r.owner,
          type: 'rental_due_soon',
          'data.rentalId': r._id,
          'data.dueDate': dueDateIso,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (!existingOwner) {
          await NotificationService.sendNotification({
            userId: r.owner,
            type: 'rental_due_soon',
            title: 'Rental due soon',
            message: `A rental is due on ${dueDateIso}.`,
            data: { rentalId: r._id, dueDate: dueDateIso },
            priority: 'low'
          });
        }
      }
    }
  }

  async _overdue({ now, dedupCutoff, limit }) {
    const rentals = await Rental.find({
      status: { $in: ['confirmed', 'active'] },
      'rentalPeriod.endDate': { $lt: now }
    })
      .select('_id renter owner rentalPeriod.endDate')
      .limit(limit)
      .lean();

    for (const r of rentals) {
      const dueDateIso = new Date(r.rentalPeriod.endDate).toISOString().slice(0, 10);
      const existing = await Notification.findOne({
        user: r.renter,
        type: 'rental_overdue',
        'data.rentalId': r._id,
        'data.dueDate': dueDateIso,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) continue;

      await NotificationService.sendNotification({
        userId: r.renter,
        type: 'rental_overdue',
        title: 'Rental overdue',
        message: `Your rental due on ${dueDateIso} is overdue. Please return the item as soon as possible.`,
        data: { rentalId: r._id, dueDate: dueDateIso },
        priority: 'high'
      });
    }
  }
}

module.exports = new AutomatedRentalReminderService();


