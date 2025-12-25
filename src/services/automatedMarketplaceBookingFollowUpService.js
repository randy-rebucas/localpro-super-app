const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Booking } = require('../models/Marketplace');
const { Notification } = require('../models/Communication');

/**
 * Automated Marketplace Booking Follow-ups
 *
 * Adds extra, safe nudges (no state changes):
 * - Provider confirmation reminders for pending bookings after X hours
 * - "Booking soon" reminder when pending booking is within Y hours
 *
 * Uses NotificationService to respect user settings.
 */
class AutomatedMarketplaceBookingFollowUpService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.BOOKING_FOLLOWUP_SCHEDULE || '*/30 * * * *'; // every 30 minutes

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated marketplace booking follow-up service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_BOOKING_FOLLOWUPS !== 'true') return;

    const pendingHours = parseInt(process.env.BOOKING_PENDING_CONFIRMATION_HOURS || '2');
    const bookingSoonHours = parseInt(process.env.BOOKING_SOON_HOURS || '24');
    const dedupMinutes = parseInt(process.env.BOOKING_FOLLOWUP_DEDUP_MINUTES || '360'); // 6h
    const limit = parseInt(process.env.BOOKING_FOLLOWUP_LIMIT || '300');

    const now = new Date();
    const pendingCutoff = new Date(now.getTime() - pendingHours * 60 * 60 * 1000);
    const bookingSoonCutoff = new Date(now.getTime() + bookingSoonHours * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupMinutes * 60 * 1000);

    const bookings = await Booking.find({
      status: 'pending',
      createdAt: { $lte: pendingCutoff },
      bookingDate: { $gte: now } // only future bookings
    })
      .select('_id client provider createdAt bookingDate')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    if (bookings.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const b of bookings) {
      // Provider reminder (after X hours pending)
      const existingProvider = await Notification.findOne({
        user: b.provider,
        type: 'booking_confirmation_needed',
        'data.bookingId': b._id,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (!existingProvider) {
        await NotificationService.sendNotification({
          userId: b.provider,
          type: 'booking_confirmation_needed',
          title: 'Booking needs confirmation',
          message: 'You have a pending booking request. Please confirm or decline to avoid auto-cancellation.',
          data: { bookingId: b._id },
          priority: 'high'
        });
        sent += 1;
      } else {
        skipped += 1;
      }

      // "Booking soon" reminder (if within Y hours and still pending)
      if (b.bookingDate && new Date(b.bookingDate) <= bookingSoonCutoff) {
        const existingSoon = await Notification.findOne({
          user: b.provider,
          type: 'booking_pending_soon',
          'data.bookingId': b._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (!existingSoon) {
          await NotificationService.sendNotification({
            userId: b.provider,
            type: 'booking_pending_soon',
            title: 'Booking is coming up',
            message: 'A pending booking is scheduled soon. Please confirm or decline so the client can plan.',
            data: { bookingId: b._id },
            priority: 'high'
          });
          sent += 1;
        } else {
          skipped += 1;
        }
      }
    }

    logger.info('Marketplace booking follow-ups completed', { bookings: bookings.length, sent, skipped });
  }
}

module.exports = new AutomatedMarketplaceBookingFollowUpService();


