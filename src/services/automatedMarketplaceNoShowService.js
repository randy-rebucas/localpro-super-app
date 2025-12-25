const cron = require('node-cron');
const logger = require('../config/logger');
const { Booking } = require('../models/Marketplace');
const NotificationService = require('./notificationService');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * Automated Marketplace No-Show / Overdue Booking Detection
 *
 * Detects bookings that should have ended but are still not completed/cancelled.
 * Sends notifications to client/provider and optionally admins.
 *
 * Notifications only (no automatic state changes).
 */
class AutomatedMarketplaceNoShowService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;
    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.BOOKING_NO_SHOW_SCHEDULE || '*/30 * * * *'; // every 30 minutes

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated marketplace no-show service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_BOOKING_NO_SHOW !== 'true') return;

    const graceMinutes = parseInt(process.env.BOOKING_NO_SHOW_GRACE_MINUTES || '120'); // 2h
    const dedupHours = parseInt(process.env.BOOKING_NO_SHOW_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.BOOKING_NO_SHOW_LIMIT || '200');
    const notifyAdmins = process.env.BOOKING_NO_SHOW_NOTIFY_ADMINS === 'true';

    const now = new Date();
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    // Pull recently-started bookings in confirmed/in_progress and evaluate end time in JS
    const lookbackHours = parseInt(process.env.BOOKING_NO_SHOW_LOOKBACK_HOURS || '72');
    const lookback = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

    const candidates = await Booking.find({
      status: { $in: ['confirmed', 'in_progress'] },
      bookingDate: { $gte: lookback, $lte: now }
    })
      .select('_id bookingDate duration status client provider')
      .limit(limit)
      .lean();

    if (candidates.length === 0) return;

    const admins = notifyAdmins
      ? await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean()
      : [];

    let flagged = 0;
    let sent = 0;
    let skipped = 0;

    for (const b of candidates) {
      const durationHours = Number(b.duration || 1);
      const endAt = new Date(new Date(b.bookingDate).getTime() + durationHours * 60 * 60 * 1000);
      const overdueAt = new Date(endAt.getTime() + graceMinutes * 60 * 1000);
      if (now < overdueAt) continue;

      flagged += 1;

      // Notify client + provider (dedup per booking+user)
      const recipients = [b.client, b.provider].filter(Boolean);
      for (const uid of recipients) {
        const exists = await Notification.findOne({
          user: uid,
          type: 'booking_overdue_completion',
          'data.bookingId': b._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();
        if (exists) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendNotification({
          userId: uid,
          type: 'booking_overdue_completion',
          title: 'Booking needs update',
          message: 'This booking appears to be past its scheduled end time. Please update the booking status or contact support.',
          data: { bookingId: b._id },
          priority: 'medium'
        });
        sent += 1;
      }

      if (notifyAdmins && admins.length > 0) {
        for (const a of admins) {
          const exists = await Notification.findOne({
            user: a._id,
            type: 'booking_overdue_admin_alert',
            'data.bookingId': b._id,
            createdAt: { $gte: dedupCutoff }
          })
            .select('_id')
            .lean();
          if (exists) {
            skipped += 1;
            continue;
          }

          await NotificationService.sendNotification({
            userId: a._id,
            type: 'booking_overdue_admin_alert',
            title: 'Overdue booking alert',
            message: 'A booking appears overdue and may require intervention.',
            data: { bookingId: b._id, clientId: b.client, providerId: b.provider, status: b.status },
            priority: 'high'
          });
          sent += 1;
        }
      }
    }

    if (flagged > 0) {
      logger.info('Marketplace no-show/overdue booking check completed', { checked: candidates.length, flagged, sent, skipped });
    }
  }
}

module.exports = new AutomatedMarketplaceNoShowService();


