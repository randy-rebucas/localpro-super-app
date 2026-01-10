const cron = require('node-cron');
const Escrow = require('../models/Escrow');
const { Booking } = require('../models/Marketplace');
const EscrowService = require('./escrowService');
const NotificationService = require('./notificationService');
const logger = require('../config/logger');

/**
 * Automated Escrow Status Management Service
 * Handles automatic escrow capture, release, payouts, and monitoring
 */
class AutomatedEscrowService {
  constructor() {
    this.isRunning = false;
    this.processingEscrows = new Set(); // Track escrows being processed
    this.cronJobs = []; // Store cron job references for proper cleanup
  }

  /**
   * Start the automated escrow service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated escrow service is already running');
      return;
    }

    // Clear any existing jobs if restarting
    this.stop();

    // Check for escrows needing auto-capture (every hour)
    const captureJob = cron.schedule('0 * * * *', async () => {
      await this.processAutoCapture();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    this.cronJobs.push(captureJob);

    // Check for escrows needing auto-release (every 6 hours)
    const releaseJob = cron.schedule('0 */6 * * *', async () => {
      await this.processAutoRelease();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    this.cronJobs.push(releaseJob);

    // Check for escrows needing payout (every 12 hours)
    const payoutJob = cron.schedule('0 */12 * * *', async () => {
      await this.processAutoPayout();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    this.cronJobs.push(payoutJob);

    // Flag stuck escrows (daily at 4 AM)
    const stuckJob = cron.schedule('0 4 * * *', async () => {
      await this.flagStuckEscrows();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    this.cronJobs.push(stuckJob);

    // Clean up processing tracking set daily
    const cleanupJob = cron.schedule('0 0 * * *', () => {
      this.processingEscrows.clear();
      logger.info('Cleared escrow processing tracking set');
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    this.cronJobs.push(cleanupJob);

    this.isRunning = true;
    logger.info('✅ Automated escrow service started');
  }

  /**
   * Stop the automated escrow service
   */
  stop() {
    this.isRunning = false;
    // Stop all cron jobs to prevent memory leaks
    this.cronJobs.forEach(job => {
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
    });
    this.cronJobs = [];
    logger.info('Automated escrow service stopped');
  }

  /**
   * Auto-capture escrow 24h after booking completion (if client approved)
   */
  async processAutoCapture() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find escrows in FUNDS_HELD status with completed bookings
      const escrowsToCapture = await Escrow.find({
        status: 'FUNDS_HELD',
        'clientApproval.approved': true,
        'clientApproval.approvedAt': { $lte: twentyFourHoursAgo }
      }).populate('bookingId clientId providerId');

      logger.info(`Found ${escrowsToCapture.length} escrow(s) ready for auto-capture`);

      for (const escrow of escrowsToCapture) {
        // Skip if already processing
        if (this.processingEscrows.has(escrow._id.toString())) {
          continue;
        }

        try {
          // Verify booking is completed
          const booking = await Booking.findById(escrow.bookingId);
          if (!booking || booking.status !== 'completed') {
            continue; // Skip if booking not completed
          }

          this.processingEscrows.add(escrow._id.toString());

          logger.info(`Auto-capturing escrow: ${escrow._id}`, {
            bookingId: escrow.bookingId,
            amount: escrow.amount
          });

          // Capture payment
          const result = await EscrowService.capturePayment(escrow._id, escrow.clientId._id);

          if (result.success) {
            logger.info(`Escrow auto-captured successfully: ${escrow._id}`);
          } else {
            logger.error(`Failed to auto-capture escrow: ${escrow._id}`, {
              error: result.error
            });
          }
        } catch (error) {
          logger.error(`Error auto-capturing escrow ${escrow._id}:`, error);
        } finally {
          setTimeout(() => {
            this.processingEscrows.delete(escrow._id.toString());
          }, 60000);
        }
      }
    } catch (error) {
      logger.error('Error in processAutoCapture', error);
    }
  }

  /**
   * Auto-release escrow after 7 days if no dispute and booking completed
   */
  async processAutoRelease() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Find escrows in IN_PROGRESS status that are 7+ days old
      const escrowsToRelease = await Escrow.find({
        status: 'IN_PROGRESS',
        updatedAt: { $lte: sevenDaysAgo },
        'dispute.raised': false
      }).populate('bookingId clientId providerId');

      logger.info(`Found ${escrowsToRelease.length} escrow(s) ready for auto-release`);

      for (const escrow of escrowsToRelease) {
        // Skip if already processing
        if (this.processingEscrows.has(escrow._id.toString())) {
          continue;
        }

        try {
          // Verify booking is completed
          const booking = await Booking.findById(escrow.bookingId);
          if (!booking || booking.status !== 'completed') {
            continue;
          }

          this.processingEscrows.add(escrow._id.toString());

          logger.info(`Auto-releasing escrow: ${escrow._id}`, {
            bookingId: escrow.bookingId,
            amount: escrow.amount
          });

          // Mark as complete (ready for payout)
          escrow.status = 'COMPLETE';
          escrow.updatedAt = new Date();
          await escrow.save();

          // Log transaction
          await EscrowService.logTransaction({
            escrowId: escrow._id,
            transactionType: 'PAYOUT',
            amount: escrow.amount,
            currency: escrow.currency,
            status: 'SUCCESS',
            initiatedBy: escrow.clientId._id,
            metadata: {
              reason: 'Auto-released after 7 days (no dispute, booking completed)',
              tags: ['auto_release']
            }
          });

          // Notify provider
          if (escrow.providerId) {
            await NotificationService.sendNotification({
              userId: escrow.providerId._id,
              type: 'payment_received',
              title: 'Escrow Released - Payout Ready',
              message: `Your escrow payment of ${escrow.amount / 100} ${escrow.currency} has been released and is ready for payout.`,
              data: {
                escrowId: escrow._id,
                amount: escrow.amount,
                currency: escrow.currency
              },
              priority: 'high'
            });
          }

          logger.info(`Escrow auto-released successfully: ${escrow._id}`);
        } catch (error) {
          logger.error(`Error auto-releasing escrow ${escrow._id}:`, error);
        } finally {
          setTimeout(() => {
            this.processingEscrows.delete(escrow._id.toString());
          }, 60000);
        }
      }
    } catch (error) {
      logger.error('Error in processAutoRelease', error);
    }
  }

  /**
   * Auto-initiate payout 48h after escrow completion
   */
  async processAutoPayout() {
    try {
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find completed escrows that haven't had payout initiated
      // Also check IN_PROGRESS escrows that are ready for payout
      const escrowsForPayout = await Escrow.find({
        status: { $in: ['COMPLETE', 'IN_PROGRESS'] },
        updatedAt: { $lte: fortyEightHoursAgo },
        'clientApproval.approved': true,
        'dispute.raised': false
      }).populate('providerId');

      logger.info(`Found ${escrowsForPayout.length} escrow(s) ready for auto-payout`);

      for (const escrow of escrowsForPayout) {
        // Skip if already processing
        if (this.processingEscrows.has(escrow._id.toString())) {
          continue;
        }

        try {
          this.processingEscrows.add(escrow._id.toString());

          logger.info(`Auto-initiating payout for escrow: ${escrow._id}`, {
            providerId: escrow.providerId?._id,
            amount: escrow.amount
          });

          // Process payout using escrow service
          // Note: Escrow must be IN_PROGRESS status for payout
          // If status is COMPLETE, we may need to change it or handle differently
          if (escrow.status === 'COMPLETE') {
            // For completed escrows, we can still process payout
            // The service will handle the status check
            escrow.status = 'IN_PROGRESS';
            await escrow.save();
          }

          const payoutResult = await EscrowService.processPayout(escrow._id, escrow.providerId._id);

          if (payoutResult && payoutResult.success) {
            logger.info(`Payout auto-initiated successfully: ${escrow._id}`);
          } else {
            logger.warn(`Failed to auto-initiate payout: ${escrow._id}`, {
              error: payoutResult?.error || payoutResult?.message
            });
          }
        } catch (error) {
          logger.error(`Error auto-initiating payout for escrow ${escrow._id}:`, error);
        } finally {
          setTimeout(() => {
            this.processingEscrows.delete(escrow._id.toString());
          }, 60000);
        }
      }
    } catch (error) {
      logger.error('Error in processAutoPayout', error);
    }
  }

  /**
   * Flag escrows stuck in FUNDS_HELD for >30 days
   */
  async flagStuckEscrows() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Find escrows stuck in FUNDS_HELD for 30+ days
      const stuckEscrows = await Escrow.find({
        status: 'FUNDS_HELD',
        createdAt: { $lte: thirtyDaysAgo },
        'metadata.flaggedAsStuck': { $ne: true }
      }).populate('bookingId clientId providerId');

      logger.info(`Found ${stuckEscrows.length} stuck escrow(s)`);

      for (const escrow of stuckEscrows) {
        try {
          // Add metadata flag
          if (!escrow.metadata) {
            escrow.metadata = {};
          }
          escrow.metadata.flaggedAsStuck = true;
          escrow.metadata.stuckSince = new Date();
          await escrow.save();

          // Notify admins (you may want to create an admin notification system)
          logger.warn(`Stuck escrow flagged: ${escrow._id}`, {
            escrowId: escrow._id,
            bookingId: escrow.bookingId?._id,
            daysStuck: Math.floor((now - new Date(escrow.createdAt)) / (24 * 60 * 60 * 1000)),
            amount: escrow.amount,
            currency: escrow.currency
          });

          // Optionally notify client and provider
          if (escrow.clientId) {
            await NotificationService.sendNotification({
              userId: escrow.clientId._id,
              type: 'payment_failed',
              title: 'Escrow Payment Requires Attention',
              message: 'Your escrow payment has been held for over 30 days. Please contact support to resolve this issue.',
              data: {
                escrowId: escrow._id,
                bookingId: escrow.bookingId?._id
              },
              priority: 'high'
            });
          }
        } catch (error) {
          logger.error(`Error flagging stuck escrow ${escrow._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in flagStuckEscrows', error);
    }
  }

  /**
   * Auto-refund escrow if booking cancelled before service
   */
  async processAutoRefund() {
    try {
      // Find escrows with cancelled bookings that haven't been refunded
      const escrowsToRefund = await Escrow.find({
        status: { $in: ['CREATED', 'FUNDS_HELD'] },
        'metadata.autoRefundAttempted': { $ne: true }
      }).populate('bookingId');

      for (const escrow of escrowsToRefund) {
        try {
          const booking = await Booking.findById(escrow.bookingId);
          
          // Check if booking was cancelled before service date
          if (booking && booking.status === 'cancelled') {
            const bookingDate = new Date(booking.bookingDate);
            const cancelledAt = booking.updatedAt || booking.createdAt;
            
            // Only auto-refund if cancelled before service date
            if (cancelledAt < bookingDate) {
              logger.info(`Auto-refunding escrow for cancelled booking: ${escrow._id}`, {
                bookingId: booking._id,
                amount: escrow.amount
              });

              // Mark as attempted
              if (!escrow.metadata) {
                escrow.metadata = {};
              }
              escrow.metadata.autoRefundAttempted = true;
              await escrow.save();

              // Refund payment
              const refundResult = await EscrowService.refundPayment(
                escrow._id,
                'Booking cancelled before service date',
                escrow.clientId
              );

              if (refundResult && refundResult.success) {
                logger.info(`Escrow auto-refunded successfully: ${escrow._id}`);
              }
            }
          }
        } catch (error) {
          logger.error(`Error auto-refunding escrow ${escrow._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in processAutoRefund', error);
    }
  }
}

module.exports = new AutomatedEscrowService();

