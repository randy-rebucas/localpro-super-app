const cron = require('node-cron');
const { UserSubscription, Payment } = require('../models/LocalProPlus');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');
const PayPalService = require('./paypalService');
const PayMayaService = require('./paymayaService');
const logger = require('../config/logger');

/**
 * Automated Subscription Renewal Service
 * Handles subscription renewal reminders, auto-renewals, and expiration management
 */
class AutomatedSubscriptionService {
  constructor() {
    this.isRunning = false;
    this.reminderSent = new Set(); // Track sent reminders
    this.processingRenewals = new Set(); // Track renewals in progress
  }

  /**
   * Start the automated subscription service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated subscription service is already running');
      return;
    }

    // Check for subscriptions needing renewal reminders (daily at 10 AM)
    cron.schedule('0 10 * * *', async () => {
      await this.sendRenewalReminders();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Process automatic renewals (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      await this.processAutomaticRenewals();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Handle expired subscriptions (daily at 3 AM)
    cron.schedule('0 3 * * *', async () => {
      await this.handleExpiredSubscriptions();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Send reactivation offers (daily at 11 AM)
    cron.schedule('0 11 * * *', async () => {
      await this.sendReactivationOffers();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Clean up tracking sets daily
    cron.schedule('0 0 * * *', () => {
      this.reminderSent.clear();
      this.processingRenewals.clear();
      logger.info('Cleared subscription reminder tracking sets');
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.isRunning = true;
    logger.info('✅ Automated subscription service started');
  }

  /**
   * Stop the automated subscription service
   */
  stop() {
    this.isRunning = false;
    logger.info('Automated subscription service stopped');
  }

  /**
   * Send renewal reminders (7 days and 1 day before expiration)
   */
  async sendRenewalReminders() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find subscriptions expiring in 7 days
      const subscriptions7Days = await UserSubscription.find({
        status: 'active',
        endDate: {
          $gte: new Date(sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000), // 1 day window
          $lte: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('user plan');

      // Find subscriptions expiring in 1 day
      const subscriptions1Day = await UserSubscription.find({
        status: 'active',
        endDate: {
          $gte: new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000), // 12 hour window
          $lte: new Date(oneDayFromNow.getTime() + 12 * 60 * 60 * 1000)
        }
      }).populate('user plan');

      let reminders7DaysSent = 0;
      let reminders1DaySent = 0;

      // Send 7-day reminders
      for (const subscription of subscriptions7Days) {
        try {
          const reminderKey = `7d-${subscription._id}`;
          if (this.reminderSent.has(reminderKey)) continue;

          await this.sendRenewalReminder(subscription, '7d');
          this.reminderSent.add(reminderKey);
          reminders7DaysSent++;
        } catch (error) {
          logger.error('Error sending 7-day renewal reminder', {
            subscriptionId: subscription._id,
            error: error.message
          });
        }
      }

      // Send 1-day reminders
      for (const subscription of subscriptions1Day) {
        try {
          const reminderKey = `1d-${subscription._id}`;
          if (this.reminderSent.has(reminderKey)) continue;

          await this.sendRenewalReminder(subscription, '1d');
          this.reminderSent.add(reminderKey);
          reminders1DaySent++;
        } catch (error) {
          logger.error('Error sending 1-day renewal reminder', {
            subscriptionId: subscription._id,
            error: error.message
          });
        }
      }

      if (reminders7DaysSent > 0 || reminders1DaySent > 0) {
        logger.info('Subscription renewal reminders sent', {
          '7d': reminders7DaysSent,
          '1d': reminders1DaySent
        });
      }
    } catch (error) {
      logger.error('Error in sendRenewalReminders', error);
    }
  }

  /**
   * Send a renewal reminder to a user
   */
  async sendRenewalReminder(subscription, days) {
    const daysText = days === '7d' ? '7 days' : '1 day';
    const endDate = new Date(subscription.endDate);
    const formattedDate = endDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const price = subscription.billingCycle === 'yearly' 
      ? subscription.plan?.price?.yearly 
      : subscription.plan?.price?.monthly;
    const currency = subscription.plan?.price?.currency || 'USD';

    if (subscription.user) {
      // Send in-app notification
      await NotificationService.sendNotification({
        userId: subscription.user._id,
        type: 'subscription_renewal',
        title: `Your subscription expires in ${daysText}`,
        message: `Your LocalPro Plus ${subscription.plan?.name || 'subscription'} expires on ${formattedDate}. Renew now to continue enjoying all features!`,
        data: {
          subscriptionId: subscription._id,
          endDate: subscription.endDate,
          daysUntilExpiration: days
        },
        priority: 'high'
      });

      // Send email
      if (subscription.user.email) {
        try {
          await EmailService.sendEmail({
            to: subscription.user.email,
            subject: `Action Required: Your LocalPro Plus subscription expires in ${daysText}`,
            template: 'subscription-renewal-reminder',
            data: {
              userName: `${subscription.user.firstName} ${subscription.user.lastName}`,
              planName: subscription.plan?.name || 'LocalPro Plus',
              endDate: formattedDate,
              daysUntilExpiration: daysText,
              price: price,
              currency: currency,
              billingCycle: subscription.billingCycle,
              renewalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/renew`
            }
          });
        } catch (emailError) {
          logger.warn('Failed to send renewal reminder email', {
            subscriptionId: subscription._id,
            error: emailError.message
          });
        }
      }
    }
  }

  /**
   * Process automatic renewals for subscriptions with payment methods on file
   */
  async processAutomaticRenewals() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find active subscriptions due for renewal (expiring today or tomorrow)
      const subscriptionsDue = await UserSubscription.find({
        status: 'active',
        endDate: {
          $lte: tomorrow,
          $gte: now
        },
        // Only auto-renew if payment method is on file (not manual)
        isManual: false,
        paymentMethod: { $in: ['paypal', 'paymaya', 'paymongo'] }
      }).populate('user plan');

      logger.info(`Found ${subscriptionsDue.length} subscription(s) due for automatic renewal`);

      for (const subscription of subscriptionsDue) {
        // Skip if already processing
        if (this.processingRenewals.has(subscription._id.toString())) {
          continue;
        }

        try {
          this.processingRenewals.add(subscription._id.toString());

          // Check if user has opted in for auto-renewal (you may want to add this field)
          // For now, we'll attempt auto-renewal if payment method exists
          const renewalResult = await this.processRenewal(subscription);

          if (renewalResult.success) {
            logger.info(`Subscription auto-renewed successfully: ${subscription._id}`, {
              userId: subscription.user?._id,
              planName: subscription.plan?.name
            });
          } else {
            logger.warn(`Failed to auto-renew subscription: ${subscription._id}`, {
              error: renewalResult.error,
              userId: subscription.user?._id
            });

            // Send notification about failed renewal
            if (subscription.user) {
              await NotificationService.sendNotification({
                userId: subscription.user._id,
                type: 'payment_failed',
                title: 'Subscription Renewal Failed',
                message: `We couldn't process your subscription renewal. Please update your payment method to continue service.`,
                data: {
                  subscriptionId: subscription._id,
                  error: renewalResult.error
                },
                priority: 'urgent'
              });
            }
          }
        } catch (error) {
          logger.error(`Error processing renewal for subscription ${subscription._id}:`, error);
        } finally {
          // Remove from processing set after delay
          setTimeout(() => {
            this.processingRenewals.delete(subscription._id.toString());
          }, 60000);
        }
      }
    } catch (error) {
      logger.error('Error in processAutomaticRenewals', error);
    }
  }

  /**
   * Process a single subscription renewal
   */
  async processRenewal(subscription) {
    try {
      const plan = subscription.plan;
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const price = subscription.billingCycle === 'yearly' 
        ? plan.price.yearly 
        : plan.price.monthly;
      const currency = plan.price.currency || 'USD';

      let paymentResult;

      // Process payment based on method
      if (subscription.paymentMethod === 'paypal') {
        // Check if PayPal subscription ID exists (for recurring payments)
        if (subscription.paymentDetails?.paypalSubscriptionId) {
          // PayPal handles recurring payments automatically via webhooks
          // This is just a fallback for manual renewal
          paymentResult = await PayPalService.createOrder({
            amount: price,
            currency: currency,
            description: `LocalPro Plus ${plan.name} subscription renewal (${subscription.billingCycle})`
          });
        } else {
          paymentResult = await PayPalService.createOrder({
            amount: price,
            currency: currency,
            description: `LocalPro Plus ${plan.name} subscription renewal (${subscription.billingCycle})`
          });
        }
      } else if (subscription.paymentMethod === 'paymaya') {
        paymentResult = await PayMayaService.createPayment({
          amount: price,
          currency: currency === 'USD' ? 'PHP' : currency,
          description: `LocalPro Plus ${plan.name} subscription renewal (${subscription.billingCycle})`
        });
      } else {
        return { success: false, error: 'Unsupported payment method for auto-renewal' };
      }

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error || 'Payment processing failed' };
      }

      // Renew subscription
      await subscription.renew();

      // Create payment record
      const payment = new Payment({
        user: subscription.user._id,
        subscription: subscription._id,
        amount: price,
        currency: currency,
        status: 'completed',
        paymentMethod: subscription.paymentMethod,
        paymentDetails: {
          paypalOrderId: paymentResult.data?.id,
          paymayaCheckoutId: paymentResult.data?.checkoutId,
          transactionId: paymentResult.data?.id
        },
        description: `LocalPro Plus subscription auto-renewal`,
        processedAt: new Date()
      });

      await payment.save();

      // Send confirmation notification
      if (subscription.user) {
        await NotificationService.sendNotification({
          userId: subscription.user._id,
          type: 'payment_received',
          title: 'Subscription Renewed Successfully',
          message: `Your LocalPro Plus ${plan.name} subscription has been renewed automatically.`,
          data: {
            subscriptionId: subscription._id,
            nextBillingDate: subscription.nextBillingDate
          },
          priority: 'medium'
        });
      }

      return { success: true, paymentId: payment._id };
    } catch (error) {
      logger.error('Error in processRenewal', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle expired subscriptions
   */
  async handleExpiredSubscriptions() {
    try {
      const now = new Date();

      // Find expired active subscriptions
      const expiredSubscriptions = await UserSubscription.find({
        status: 'active',
        endDate: { $lt: now }
      }).populate('user plan');

      logger.info(`Found ${expiredSubscriptions.length} expired subscription(s)`);

      for (const subscription of expiredSubscriptions) {
        try {
          // Suspend the subscription
          subscription.status = 'expired';
          subscription.history.push({
            action: 'suspended',
            timestamp: new Date(),
            reason: 'Subscription expired'
          });
          await subscription.save();

          // Notify user
          if (subscription.user) {
            await NotificationService.sendNotification({
              userId: subscription.user._id,
              type: 'subscription_cancelled',
              title: 'Your subscription has expired',
              message: `Your LocalPro Plus ${subscription.plan?.name || 'subscription'} has expired. Renew now to restore access to all features.`,
              data: {
                subscriptionId: subscription._id
              },
              priority: 'high'
            });

            // Send email
            if (subscription.user.email) {
              try {
                await EmailService.sendEmail({
                  to: subscription.user.email,
                  subject: 'Your LocalPro Plus subscription has expired',
                  template: 'subscription-expired',
                  data: {
                    userName: `${subscription.user.firstName} ${subscription.user.lastName}`,
                    planName: subscription.plan?.name || 'LocalPro Plus',
                    renewalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/renew`
                  }
                });
              } catch (emailError) {
                logger.warn('Failed to send expiration email', {
                  subscriptionId: subscription._id,
                  error: emailError.message
                });
              }
            }
          }

          logger.info(`Subscription expired and suspended: ${subscription._id}`);
        } catch (error) {
          logger.error(`Error handling expired subscription ${subscription._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in handleExpiredSubscriptions', error);
    }
  }

  /**
   * Send reactivation offers to expired subscriptions
   */
  async sendReactivationOffers() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneHundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

      // Find subscriptions expired 30-120 days ago (win-back campaign)
      const expiredSubscriptions = await UserSubscription.find({
        status: 'expired',
        endDate: {
          $gte: oneHundredTwentyDaysAgo,
          $lte: thirtyDaysAgo
        },
        'history': {
          $not: {
            $elemMatch: {
              action: 'reactivated',
              timestamp: { $gte: thirtyDaysAgo }
            }
          }
        }
      }).populate('user plan');

      logger.info(`Found ${expiredSubscriptions.length} expired subscription(s) for reactivation offer`);

      for (const subscription of expiredSubscriptions) {
        try {
          if (subscription.user && subscription.user.email) {
            // Send reactivation offer email
            await EmailService.sendEmail({
              to: subscription.user.email,
              subject: 'We miss you! Come back to LocalPro Plus',
              template: 'subscription-reactivation-offer',
              data: {
                userName: `${subscription.user.firstName} ${subscription.user.lastName}`,
                planName: subscription.plan?.name || 'LocalPro Plus',
                reactivationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/reactivate`,
                discountCode: 'COMEBACK20' // You can generate dynamic codes
              }
            });

            // Mark in history
            subscription.history.push({
              action: 'reactivated',
              timestamp: new Date(),
              reason: 'Reactivation offer sent'
            });
            await subscription.save();

            logger.info(`Reactivation offer sent: ${subscription._id}`);
          }
        } catch (error) {
          logger.error(`Error sending reactivation offer for ${subscription._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in sendReactivationOffers', error);
    }
  }
}

module.exports = new AutomatedSubscriptionService();

