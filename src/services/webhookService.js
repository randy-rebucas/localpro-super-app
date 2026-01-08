const WebhookEvent = require('../models/WebhookEvent');
const WebhookSubscription = require('../models/WebhookSubscription');
const logger = require('../config/logger');
const axios = require('axios');

/**
 * Webhook Service
 * Handles creation and delivery of webhook events
 */
class WebhookService {
  /**
   * Create and store a webhook event
   * @param {String} eventType - Type of event
   * @param {String} userId - User ID who should receive the event
   * @param {Object} data - Event payload data
   * @param {Object} relatedEntities - Related entity IDs
   * @param {Object} metadata - Additional metadata
   */
  async createEvent(eventType, userId, data, relatedEntities = {}, metadata = {}) {
    try {
      // Validate event type
      const validEventTypes = [
        'booking.confirmed',
        'booking.completed',
        'booking.cancelled',
        'message.received',
        'payment.successful',
        'payment.failed',
        'application.status_changed',
        'referral.completed',
        'subscription.renewed',
        'subscription.cancelled'
      ];

      if (!validEventTypes.includes(eventType)) {
        throw new Error(`Invalid event type: ${eventType}`);
      }

      // Create webhook event
      const webhookEvent = await WebhookEvent.create({
        eventType,
        userId,
        data,
        relatedEntities,
        metadata,
        status: 'pending'
      });

      logger.info('Webhook event created', {
        eventId: webhookEvent._id,
        eventType,
        userId
      });

      // Attempt to deliver to webhook URL if user has subscriptions
      await this.deliverToSubscriptions(webhookEvent);

      return webhookEvent;
    } catch (error) {
      logger.error('Error creating webhook event', {
        error: error.message,
        eventType,
        userId
      });
      throw error;
    }
  }

  /**
   * Deliver webhook event to subscribed URLs
   * @param {Object} webhookEvent - Webhook event document
   */
  async deliverToSubscriptions(webhookEvent) {
    try {
      // Find active subscriptions for this user and event type
      const subscriptions = await WebhookSubscription.find({
        userId: webhookEvent.userId,
        eventTypes: webhookEvent.eventType,
        isActive: true
      });

      if (subscriptions.length === 0) {
        return;
      }

      // Deliver to each subscription URL
      const deliveryPromises = subscriptions.map(subscription =>
        this.deliverToUrl(webhookEvent, subscription)
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      logger.error('Error delivering webhook to subscriptions', {
        error: error.message,
        eventId: webhookEvent._id
      });
    }
  }

  /**
   * Deliver webhook to a specific URL
   * @param {Object} webhookEvent - Webhook event document
   * @param {Object} subscription - Webhook subscription document
   */
  async deliverToUrl(webhookEvent, subscription) {
    try {
      const payload = {
        eventId: webhookEvent._id,
        eventType: webhookEvent.eventType,
        timestamp: webhookEvent.createdAt,
        data: webhookEvent.data
      };

      // Add signature for security
      const signature = this.generateSignature(payload, subscription.secret);

      const response = await axios.post(subscription.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': webhookEvent.eventType,
          'X-Webhook-Id': webhookEvent._id.toString()
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status >= 200 && response.status < 300) {
        await webhookEvent.markAsDelivered();
        await subscription.recordSuccess();
        
        logger.info('Webhook delivered successfully', {
          eventId: webhookEvent._id,
          url: subscription.url,
          status: response.status
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      await webhookEvent.recordDeliveryFailure(error.message);
      await subscription.recordFailure(error.message);
      
      logger.error('Webhook delivery failed', {
        eventId: webhookEvent._id,
        url: subscription.url,
        error: error.message
      });

      // Retry logic for failed deliveries
      if (webhookEvent.deliveryAttempts < 3) {
        setTimeout(() => {
          this.deliverToUrl(webhookEvent, subscription);
        }, Math.pow(2, webhookEvent.deliveryAttempts) * 1000); // Exponential backoff
      }
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   * @param {Object} payload - Webhook payload
   * @param {String} secret - Webhook secret
   */
  generateSignature(payload, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Booking Events
   */
  async triggerBookingConfirmed(booking, userId) {
    return this.createEvent(
      'booking.confirmed',
      userId,
      {
        bookingId: booking._id,
        serviceTitle: booking.service?.title || 'Service',
        providerName: booking.provider?.profile?.businessName || 
                      `${booking.provider?.firstName} ${booking.provider?.lastName}`,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.pricing?.total,
        currency: booking.pricing?.currency || 'PHP'
      },
      { bookingId: booking._id }
    );
  }

  async triggerBookingCompleted(booking, userId) {
    return this.createEvent(
      'booking.completed',
      userId,
      {
        bookingId: booking._id,
        serviceTitle: booking.service?.title || 'Service',
        completedDate: booking.completedDate || new Date(),
        totalAmount: booking.pricing?.total,
        currency: booking.pricing?.currency || 'PHP'
      },
      { bookingId: booking._id }
    );
  }

  async triggerBookingCancelled(booking, userId, cancelledBy, reason) {
    return this.createEvent(
      'booking.cancelled',
      userId,
      {
        bookingId: booking._id,
        serviceTitle: booking.service?.title || 'Service',
        cancelledBy,
        reason,
        cancelledDate: new Date()
      },
      { bookingId: booking._id }
    );
  }

  /**
   * Message Events
   */
  async triggerMessageReceived(message, recipientId) {
    return this.createEvent(
      'message.received',
      recipientId,
      {
        messageId: message._id,
        senderId: message.sender,
        senderName: message.senderName || 'User',
        content: message.content?.substring(0, 100), // First 100 chars
        conversationId: message.conversation,
        sentAt: message.createdAt
      },
      { messageId: message._id }
    );
  }

  /**
   * Payment Events
   */
  async triggerPaymentSuccessful(payment, userId) {
    return this.createEvent(
      'payment.successful',
      userId,
      {
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency || 'PHP',
        method: payment.method,
        transactionId: payment.transactionId,
        processedAt: payment.processedAt || new Date()
      },
      { paymentId: payment._id }
    );
  }

  async triggerPaymentFailed(payment, userId, reason) {
    return this.createEvent(
      'payment.failed',
      userId,
      {
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency || 'PHP',
        method: payment.method,
        reason,
        failedAt: new Date()
      },
      { paymentId: payment._id }
    );
  }

  /**
   * Job Application Events
   */
  async triggerApplicationStatusChanged(application, userId) {
    return this.createEvent(
      'application.status_changed',
      userId,
      {
        applicationId: application._id,
        jobTitle: application.job?.title || 'Job',
        status: application.status,
        updatedAt: new Date()
      },
      { applicationId: application._id }
    );
  }

  /**
   * Referral Events
   */
  async triggerReferralCompleted(referral, userId) {
    return this.createEvent(
      'referral.completed',
      userId,
      {
        referralId: referral._id,
        referredUserName: referral.referredUser?.firstName || 'User',
        rewardAmount: referral.reward?.amount,
        currency: referral.reward?.currency || 'PHP',
        completedAt: new Date()
      },
      { referralId: referral._id }
    );
  }

  /**
   * Subscription Events
   */
  async triggerSubscriptionRenewed(subscription, userId) {
    return this.createEvent(
      'subscription.renewed',
      userId,
      {
        subscriptionId: subscription._id,
        planName: subscription.plan?.name || 'Plan',
        amount: subscription.pricing?.amount,
        currency: subscription.pricing?.currency || 'PHP',
        renewedAt: new Date(),
        nextBillingDate: subscription.currentPeriodEnd
      },
      { subscriptionId: subscription._id }
    );
  }

  async triggerSubscriptionCancelled(subscription, userId, reason) {
    return this.createEvent(
      'subscription.cancelled',
      userId,
      {
        subscriptionId: subscription._id,
        planName: subscription.plan?.name || 'Plan',
        reason,
        cancelledAt: new Date(),
        validUntil: subscription.currentPeriodEnd
      },
      { subscriptionId: subscription._id }
    );
  }

  /**
   * Get webhook events for a user
   */
  async getUserEvents(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        eventType = null,
        status = null
      } = options;

      const skip = (page - 1) * limit;

      const events = await WebhookEvent.getRecentEvents(userId, {
        limit,
        skip,
        eventType,
        status
      });

      const total = await WebhookEvent.countDocuments({
        userId,
        ...(eventType && { eventType }),
        ...(status && { status })
      });

      return {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user events', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Mark events as read
   */
  async markEventsAsRead(eventIds, userId) {
    try {
      await WebhookEvent.markMultipleAsRead(eventIds, userId);
      
      logger.info('Events marked as read', {
        count: eventIds.length,
        userId
      });
    } catch (error) {
      logger.error('Error marking events as read', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get unread event count
   */
  async getUnreadCount(userId) {
    try {
      return await WebhookEvent.getUnreadCount(userId);
    } catch (error) {
      logger.error('Error getting unread count', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

module.exports = new WebhookService();
