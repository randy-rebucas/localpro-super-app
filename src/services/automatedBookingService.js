const cron = require('node-cron');
const { Booking } = require('../models/Marketplace');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');
const logger = require('../config/logger');

/**
 * Automated Booking Service
 * Handles automated booking reminders, status transitions, and follow-ups
 */
class AutomatedBookingService {
  constructor() {
    this.isRunning = false;
    this.reminderSent = new Set(); // Track sent reminders to avoid duplicates
  }

  /**
   * Start the automated booking service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated booking service is already running');
      return;
    }

    // Check for bookings needing reminders (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
      await this.sendBookingReminders();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Check for bookings needing status transitions (every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
      await this.processBookingStatusTransitions();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Check for completed bookings needing review requests (daily at 9 AM)
    cron.schedule('0 9 * * *', async () => {
      await this.sendReviewRequests();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Clean up reminder tracking set daily (to prevent memory growth)
    cron.schedule('0 0 * * *', () => {
      this.reminderSent.clear();
      logger.info('Cleared booking reminder tracking set');
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.isRunning = true;
    logger.info('✅ Automated booking service started');
  }

  /**
   * Stop the automated booking service
   */
  stop() {
    this.isRunning = false;
    logger.info('Automated booking service stopped');
  }

  /**
   * Send booking reminders (24h and 2h before appointment)
   */
  async sendBookingReminders() {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      // Find bookings that need 24h reminder
      const bookings24h = await Booking.find({
        status: { $in: ['pending', 'confirmed'] },
        bookingDate: {
          $gte: new Date(twentyFourHoursFromNow.getTime() - 15 * 60 * 1000), // 15 min window
          $lte: new Date(twentyFourHoursFromNow.getTime() + 15 * 60 * 1000)
        },
        'timeline': {
          $not: {
            $elemMatch: {
              note: { $regex: /24.*hour.*reminder/i }
            }
          }
        }
      }).populate('client provider service');

      // Find bookings that need 2h reminder
      const bookings2h = await Booking.find({
        status: { $in: ['pending', 'confirmed'] },
        bookingDate: {
          $gte: new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000),
          $lte: new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000)
        },
        'timeline': {
          $not: {
            $elemMatch: {
              note: { $regex: /2.*hour.*reminder/i }
            }
          }
        }
      }).populate('client provider service');

      let reminders24hSent = 0;
      let reminders2hSent = 0;

      // Send 24h reminders
      for (const booking of bookings24h) {
        try {
          const reminderKey = `24h-${booking._id}`;
          if (this.reminderSent.has(reminderKey)) continue;

          await this.sendReminder(booking, '24h');
          this.reminderSent.add(reminderKey);
          reminders24hSent++;

          // Add to timeline
          booking.timeline.push({
            status: booking.status,
            timestamp: new Date(),
            note: '24-hour reminder sent',
            updatedBy: 'system'
          });
          await booking.save();
        } catch (error) {
          logger.error('Error sending 24h reminder', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }

      // Send 2h reminders
      for (const booking of bookings2h) {
        try {
          const reminderKey = `2h-${booking._id}`;
          if (this.reminderSent.has(reminderKey)) continue;

          await this.sendReminder(booking, '2h');
          this.reminderSent.add(reminderKey);
          reminders2hSent++;

          // Add to timeline
          booking.timeline.push({
            status: booking.status,
            timestamp: new Date(),
            note: '2-hour reminder sent',
            updatedBy: 'system'
          });
          await booking.save();
        } catch (error) {
          logger.error('Error sending 2h reminder', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }

      if (reminders24hSent > 0 || reminders2hSent > 0) {
        logger.info('Booking reminders sent', {
          '24h': reminders24hSent,
          '2h': reminders2hSent
        });
      }
    } catch (error) {
      logger.error('Error in sendBookingReminders', error);
    }
  }

  /**
   * Send a reminder for a booking
   */
  async sendReminder(booking, type) {
    const hours = type === '24h' ? '24 hours' : '2 hours';
    const bookingDate = new Date(booking.bookingDate);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = bookingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send to client
    if (booking.client) {
      await NotificationService.sendNotification({
        userId: booking.client._id,
        type: 'booking_created',
        title: `Reminder: Your booking is in ${hours}`,
        message: `Your booking for "${booking.service?.title || 'Service'}" is scheduled for ${formattedDate} at ${formattedTime}.`,
        data: {
          bookingId: booking._id,
          bookingDate: booking.bookingDate,
          reminderType: type
        },
        priority: 'high'
      });

      // Also send email
      if (booking.client.email) {
        try {
          await EmailService.sendEmail({
            to: booking.client.email,
            subject: `Reminder: Your LocalPro booking is in ${hours}`,
            template: 'booking-reminder',
            data: {
              clientName: `${booking.client.firstName} ${booking.client.lastName}`,
              serviceTitle: booking.service?.title || 'Service',
              bookingDate: formattedDate,
              bookingTime: formattedTime,
              duration: booking.duration,
              address: booking.address,
              hoursUntil: hours
            }
          });
        } catch (emailError) {
          logger.warn('Failed to send reminder email to client', {
            bookingId: booking._id,
            error: emailError.message
          });
        }
      }
    }

    // Send to provider
    if (booking.provider) {
      await NotificationService.sendNotification({
        userId: booking.provider._id,
        type: 'booking_created',
        title: `Reminder: You have a booking in ${hours}`,
        message: `You have a booking for "${booking.service?.title || 'Service'}" scheduled for ${formattedDate} at ${formattedTime}.`,
        data: {
          bookingId: booking._id,
          bookingDate: booking.bookingDate,
          reminderType: type
        },
        priority: 'high'
      });

      // Also send email
      if (booking.provider.email) {
        try {
          await EmailService.sendEmail({
            to: booking.provider.email,
            subject: `Reminder: You have a LocalPro booking in ${hours}`,
            template: 'booking-reminder',
            data: {
              clientName: `${booking.client?.firstName} ${booking.client?.lastName}`,
              serviceTitle: booking.service?.title || 'Service',
              bookingDate: formattedDate,
              bookingTime: formattedTime,
              duration: booking.duration,
              address: booking.address,
              hoursUntil: hours
            }
          });
        } catch (emailError) {
          logger.warn('Failed to send reminder email to provider', {
            bookingId: booking._id,
            error: emailError.message
          });
        }
      }
    }
  }

  /**
   * Process automatic booking status transitions
   */
  async processBookingStatusTransitions() {
    try {
      const now = new Date();
      
      // Auto-confirm bookings after 24h if still pending and provider hasn't responded
      const autoConfirmCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const bookingsToAutoConfirm = await Booking.find({
        status: 'pending',
        createdAt: { $lte: autoConfirmCutoff },
        'timeline': {
          $not: {
            $elemMatch: {
              note: { $regex: /auto.*confirm/i }
            }
          }
        }
      }).populate('client provider service');

      for (const booking of bookingsToAutoConfirm) {
        try {
          booking.status = 'confirmed';
          booking.timeline.push({
            status: 'confirmed',
            timestamp: new Date(),
            note: 'Auto-confirmed after 24 hours (no provider response)',
            updatedBy: 'system'
          });
          await booking.save();

          // Notify both parties
          await NotificationService.sendNotification({
            userId: booking.client._id,
            type: 'booking_confirmed',
            title: 'Booking Auto-Confirmed',
            message: `Your booking for "${booking.service?.title || 'Service'}" has been automatically confirmed.`,
            data: { bookingId: booking._id },
            priority: 'medium'
          });

          if (booking.provider) {
            await NotificationService.sendNotification({
              userId: booking.provider._id,
              type: 'booking_confirmed',
              title: 'Booking Auto-Confirmed',
              message: `A booking for "${booking.service?.title || 'Service'}" has been automatically confirmed.`,
              data: { bookingId: booking._id },
              priority: 'medium'
            });
          }

          logger.info('Booking auto-confirmed', { bookingId: booking._id });
        } catch (error) {
          logger.error('Error auto-confirming booking', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }

      // Auto-complete bookings 2 hours after scheduled end time
      const bookingsToComplete = await Booking.find({
        status: 'in_progress',
        bookingDate: { $lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
      }).populate('client provider service');

      for (const booking of bookingsToComplete) {
        try {
          const endTime = new Date(booking.bookingDate.getTime() + booking.duration * 60 * 60 * 1000);
          if (endTime <= now) {
            booking.status = 'completed';
            booking.timeline.push({
              status: 'completed',
              timestamp: new Date(),
              note: 'Auto-completed after scheduled end time',
              updatedBy: 'system'
            });
            await booking.save();

            logger.info('Booking auto-completed', { bookingId: booking._id });
          }
        } catch (error) {
          logger.error('Error auto-completing booking', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }

      // Auto-cancel pending bookings after 48h if not confirmed
      const autoCancelCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const bookingsToCancel = await Booking.find({
        status: 'pending',
        createdAt: { $lte: autoCancelCutoff }
      }).populate('client provider service');

      for (const booking of bookingsToCancel) {
        try {
          booking.status = 'cancelled';
          booking.timeline.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: 'Auto-cancelled after 48 hours (not confirmed)',
            updatedBy: 'system'
          });
          await booking.save();

          // Notify client
          if (booking.client) {
            await NotificationService.sendNotification({
              userId: booking.client._id,
              type: 'booking_cancelled',
              title: 'Booking Auto-Cancelled',
              message: `Your booking for "${booking.service?.title || 'Service'}" has been automatically cancelled due to no confirmation.`,
              data: { bookingId: booking._id },
              priority: 'medium'
            });
          }

          logger.info('Booking auto-cancelled', { bookingId: booking._id });
        } catch (error) {
          logger.error('Error auto-cancelling booking', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      logger.error('Error in processBookingStatusTransitions', error);
    }
  }

  /**
   * Send review requests for completed bookings
   */
  async sendReviewRequests() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Find completed bookings without reviews (3 days old)
      // Use updatedAt or timeline to determine completion date
      const bookingsNeedingReview = await Booking.find({
        status: 'completed',
        updatedAt: { $gte: sevenDaysAgo, $lte: threeDaysAgo },
        'review.rating': { $exists: false },
        'timeline': {
          $not: {
            $elemMatch: {
              note: { $regex: /review.*request/i }
            }
          }
        }
      }).populate('client provider service');

      for (const booking of bookingsNeedingReview) {
        try {
          if (booking.client) {
            await NotificationService.sendNotification({
              userId: booking.client._id,
              type: 'booking_completed',
              title: 'How was your service?',
              message: `Please share your experience with "${booking.service?.title || 'Service'}". Your feedback helps us improve!`,
              data: {
                bookingId: booking._id,
                serviceId: booking.service?._id
              },
              priority: 'medium'
            });

            // Add to timeline
            booking.timeline.push({
              status: booking.status,
              timestamp: new Date(),
              note: 'Review request sent',
              updatedBy: 'system'
            });
            await booking.save();

            logger.info('Review request sent', { bookingId: booking._id });
          }
        } catch (error) {
          logger.error('Error sending review request', {
            bookingId: booking._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      logger.error('Error in sendReviewRequests', error);
    }
  }
}

module.exports = new AutomatedBookingService();

