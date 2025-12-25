/**
 * Notification Service
 * 
 * A comprehensive notification service that handles:
 * - In-app notifications (stored in DB)
 * - Email notifications (via EmailService)
 * - SMS notifications (via TwilioService)
 * - Push notifications (via Firebase Cloud Messaging)
 * 
 * All notification channels respect user settings and preferences.
 */

const { Notification } = require('../models/Communication');
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const EmailService = require('./emailService');
const TwilioService = require('./twilioService');
const logger = require('../config/logger');

// Notification type to user settings category mapping
const NOTIFICATION_TYPE_MAP = {
  // Booking notifications
  booking_created: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'high' },
  booking_confirmed: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'high' },
  booking_cancelled: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'high' },
  booking_completed: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'medium' },
  booking_confirmation_needed: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'high' },
  booking_pending_soon: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'high' },
  booking_overdue_completion: { category: 'bookingUpdates', smsCategory: 'bookingReminders', priority: 'medium' },
  booking_overdue_admin_alert: { category: 'systemUpdates', smsCategory: null, priority: 'high' },
  
  // Job notifications
  job_application: { category: 'jobMatches', smsCategory: null, priority: 'high' },
  application_status_update: { category: 'jobMatches', smsCategory: null, priority: 'high' },
  job_posted: { category: 'jobMatches', smsCategory: null, priority: 'medium' },
  job_digest: { category: 'jobMatches', smsCategory: null, priority: 'low' },
  job_application_followup: { category: 'jobMatches', smsCategory: null, priority: 'medium' },
  
  // Message notifications
  message_received: { category: 'newMessages', smsCategory: 'urgentMessages', priority: 'medium' },
  message_moderation_flag: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  message_policy_warning: { category: 'systemUpdates', smsCategory: null, priority: 'low' },
  
  // Payment notifications
  payment_received: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'high' },
  payment_failed: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'urgent' },
  subscription_renewal: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'medium' },
  subscription_cancelled: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'high' },
  subscription_dunning_reminder: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'medium' },
  
  // Referral notifications
  referral_reward: { category: 'referralUpdates', smsCategory: null, priority: 'medium' },
  referral_tier_upgraded: { category: 'referralUpdates', smsCategory: null, priority: 'low' },
  
  // System notifications
  course_enrollment: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  order_confirmation: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  system_announcement: { category: 'systemUpdates', smsCategory: null, priority: 'low' },
  academy_not_started: { category: 'systemUpdates', smsCategory: null, priority: 'low' },
  academy_progress_stalled: { category: 'systemUpdates', smsCategory: null, priority: 'low' },
  academy_certificate_pending: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  livechat_sla_alert: { category: 'systemUpdates', smsCategory: null, priority: 'high' },

  // Supplies / Orders
  order_payment_pending: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'medium' },
  order_sla_alert: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  order_delivery_confirmation: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  order_delivery_late_alert: { category: 'systemUpdates', smsCategory: null, priority: 'high' },
  order_auto_delivered: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  supplies_reorder_reminder: { category: 'systemUpdates', smsCategory: null, priority: 'low' },

  // Escrow dispute escalation
  escrow_dispute_unresolved: { category: 'systemUpdates', smsCategory: null, priority: 'high' },
  escrow_dispute_evidence_needed: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },

  // Rentals
  rental_due_soon: { category: 'systemUpdates', smsCategory: null, priority: 'medium' },
  rental_overdue: { category: 'systemUpdates', smsCategory: null, priority: 'high' },

  // Finance
  loan_repayment_due: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'medium' },
  loan_repayment_overdue: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'high' },
  salary_advance_due: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'medium' },
  salary_advance_overdue: { category: 'paymentUpdates', smsCategory: 'paymentAlerts', priority: 'high' },
  
  // Security notifications (always sent via SMS if enabled)
  security_alert: { category: 'systemUpdates', smsCategory: 'securityAlerts', priority: 'urgent' },
  login_alert: { category: 'systemUpdates', smsCategory: 'securityAlerts', priority: 'high' }
};

// Default notification settings (fallback if user has no settings)
const DEFAULT_NOTIFICATION_SETTINGS = {
  push: {
    enabled: true,
    newMessages: true,
    jobMatches: true,
    bookingUpdates: true,
    paymentUpdates: true,
    referralUpdates: true,
    systemUpdates: true,
    marketing: false
  },
  email: {
    enabled: true,
    newMessages: true,
    jobMatches: true,
    bookingUpdates: true,
    paymentUpdates: true,
    referralUpdates: true,
    systemUpdates: true,
    marketing: false
  },
  sms: {
    enabled: true,
    urgentMessages: true,
    bookingReminders: true,
    paymentAlerts: true,
    securityAlerts: true
  }
};

class NotificationService {
  /**
   * Send a notification to a user
   * Respects user notification settings for each channel
   * 
   * @param {Object} options - Notification options
   * @param {string} options.userId - The user ID to send notification to
   * @param {string} options.type - Notification type (from enum in Communication model)
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message/body
   * @param {Object} options.data - Additional data for the notification
   * @param {string} options.priority - Priority level (low, medium, high, urgent)
   * @param {Object} options.emailOptions - Optional email-specific options
   * @param {Object} options.smsOptions - Optional SMS-specific options
   * @param {boolean} options.forceChannels - Force send through all channels ignoring settings
   * @returns {Promise<Object>} Result with notification and channel statuses
   */
  async sendNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority,
    emailOptions = {},
    smsOptions = {},
    forceChannels = false
  }) {
    try {
      // Get user and their settings
      const [user, userSettings] = await Promise.all([
        User.findById(userId).select('email phoneNumber firstName lastName'),
        UserSettings.findOne({ userId })
      ]);

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get notification settings (use defaults if not set)
      const notificationSettings = userSettings?.notifications || DEFAULT_NOTIFICATION_SETTINGS;

      // Get type configuration
      const typeConfig = NOTIFICATION_TYPE_MAP[type] || { 
        category: 'systemUpdates', 
        smsCategory: null, 
        priority: 'medium' 
      };

      const effectivePriority = priority || typeConfig.priority;

      // Determine which channels to use
      const channels = this._determineChannels(
        notificationSettings,
        typeConfig,
        effectivePriority,
        forceChannels
      );

      // Track results for each channel
      const results = {
        inApp: null,
        email: null,
        sms: null,
        push: null
      };

      // Always create in-app notification
      results.inApp = await this._createInAppNotification({
        userId,
        type,
        title,
        message,
        data,
        priority: effectivePriority,
        channels
      });

      // Send through other channels in parallel
      const channelPromises = [];

      if (channels.email && user.email) {
        channelPromises.push(
          this._sendEmailNotification({
            to: user.email,
            type,
            title,
            message,
            data,
            firstName: user.firstName,
            ...emailOptions
          }).then(result => { results.email = result; })
        );
      }

      if (channels.sms && user.phoneNumber) {
        channelPromises.push(
          this._sendSMSNotification({
            to: user.phoneNumber,
            type,
            title,
            message,
            ...smsOptions
          }).then(result => { results.sms = result; })
        );
      }

      if (channels.push) {
        channelPromises.push(
          this._sendPushNotification({
            userId,
            type,
            title,
            message,
            data,
            priority: effectivePriority
          }).then(result => { results.push = result; })
        );
      }

      // Wait for all channels to complete
      await Promise.allSettled(channelPromises);

      logger.info(`Notification sent to user ${userId}`, {
        type,
        channels: {
          inApp: !!results.inApp?.success,
          email: !!results.email?.success,
          sms: !!results.sms?.success,
          push: !!results.push?.success
        }
      });

      return {
        success: true,
        notification: results.inApp?.data,
        channels: results
      };
    } catch (error) {
      logger.error('NotificationService.sendNotification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to multiple users
   * 
   * @param {Object} options - Notification options
   * @param {string[]} options.userIds - Array of user IDs
   * @param {string} options.type - Notification type
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {Object} options.data - Additional data
   * @returns {Promise<Object>} Results for each user
   */
  async sendBulkNotification({ userIds, type, title, message, data = {}, priority }) {
    const results = await Promise.allSettled(
      userIds.map(userId => 
        this.sendNotification({ userId, type, title, message, data, priority })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedCount = results.length - successCount;

    logger.info(`Bulk notification sent`, {
      type,
      total: userIds.length,
      success: successCount,
      failed: failedCount
    });

    return {
      success: true,
      total: userIds.length,
      successCount,
      failedCount,
      results: results.map((r, i) => ({
        userId: userIds[i],
        success: r.status === 'fulfilled' && r.value.success,
        error: r.status === 'rejected' ? r.reason?.message : r.value?.error
      }))
    };
  }

  /**
   * Send a booking notification
   */
  async sendBookingNotification({ userId, bookingId, status, booking, customMessage }) {
    const typeMap = {
      created: 'booking_created',
      confirmed: 'booking_confirmed',
      cancelled: 'booking_cancelled',
      completed: 'booking_completed'
    };

    const type = typeMap[status] || 'booking_created';
    
    const titleMap = {
      created: 'New Booking Created',
      confirmed: 'Booking Confirmed',
      cancelled: 'Booking Cancelled',
      completed: 'Booking Completed'
    };

    const messageMap = {
      created: `Your booking has been created. Booking ID: ${bookingId}`,
      confirmed: `Your booking has been confirmed. Booking ID: ${bookingId}`,
      cancelled: `Your booking has been cancelled. Booking ID: ${bookingId}`,
      completed: `Your booking has been completed. Thank you for using our service!`
    };

    return this.sendNotification({
      userId,
      type,
      title: titleMap[status] || 'Booking Update',
      message: customMessage || messageMap[status] || 'Your booking status has been updated.',
      data: {
        bookingId,
        status,
        ...(booking && { booking })
      }
    });
  }

  /**
   * Send a job application notification
   */
  async sendJobApplicationNotification({ userId, jobId, applicantId, applicantName, jobTitle, status }) {
    const type = status === 'new' ? 'job_application' : 'application_status_update';
    
    const title = status === 'new' 
      ? 'New Job Application' 
      : 'Application Status Updated';
    
    const message = status === 'new'
      ? `${applicantName} has applied for your job: ${jobTitle}`
      : `Your application for ${jobTitle} has been ${status}`;

    return this.sendNotification({
      userId,
      type,
      title,
      message,
      data: {
        jobId,
        applicantId,
        applicantName,
        jobTitle,
        status
      }
    });
  }

  /**
   * Send a message notification
   */
  async sendMessageNotification({ userId, senderId, senderName, conversationId, messagePreview, isUrgent = false }) {
    return this.sendNotification({
      userId,
      type: 'message_received',
      title: `New message from ${senderName}`,
      message: messagePreview?.substring(0, 100) || 'You have a new message',
      data: {
        senderId,
        senderName,
        conversationId
      },
      priority: isUrgent ? 'high' : 'medium',
      smsOptions: {
        // Only send SMS for urgent messages
        forceEnable: isUrgent
      }
    });
  }

  /**
   * Send a payment notification
   */
  async sendPaymentNotification({ userId, paymentId, amount, status, currency = 'PHP', description }) {
    const typeMap = {
      received: 'payment_received',
      failed: 'payment_failed',
      refunded: 'payment_received'
    };

    const type = typeMap[status] || 'payment_received';
    
    const titleMap = {
      received: 'Payment Received',
      failed: 'Payment Failed',
      refunded: 'Payment Refunded'
    };

    const messageMap = {
      received: `You have received a payment of ${currency} ${amount.toLocaleString()}`,
      failed: `Your payment of ${currency} ${amount.toLocaleString()} has failed. Please try again.`,
      refunded: `Your payment of ${currency} ${amount.toLocaleString()} has been refunded`
    };

    return this.sendNotification({
      userId,
      type,
      title: titleMap[status] || 'Payment Update',
      message: description || messageMap[status] || 'Your payment status has been updated.',
      data: {
        paymentId,
        amount,
        currency,
        status
      },
      priority: status === 'failed' ? 'urgent' : 'high'
    });
  }

  /**
   * Send a referral reward notification
   */
  async sendReferralNotification({ userId, referredUserId, referredUserName, rewardAmount, currency = 'PHP' }) {
    return this.sendNotification({
      userId,
      type: 'referral_reward',
      title: '🎉 Referral Reward Earned!',
      message: `You earned ${currency} ${rewardAmount.toLocaleString()} for referring ${referredUserName}!`,
      data: {
        referredUserId,
        referredUserName,
        rewardAmount,
        currency
      }
    });
  }

  /**
   * Send a security alert notification
   */
  async sendSecurityAlert({ userId, alertType, details, forceAllChannels = true }) {
    const alertMessages = {
      new_device_login: 'A new device has logged into your account',
      password_changed: 'Your password has been changed',
      suspicious_activity: 'Suspicious activity detected on your account',
      two_factor_disabled: 'Two-factor authentication has been disabled',
      email_changed: 'Your email address has been changed'
    };

    return this.sendNotification({
      userId,
      type: 'security_alert',
      title: '🔒 Security Alert',
      message: alertMessages[alertType] || 'A security event occurred on your account',
      data: {
        alertType,
        ...details,
        timestamp: new Date().toISOString()
      },
      priority: 'urgent',
      forceChannels: forceAllChannels
    });
  }

  /**
   * Send a system announcement
   */
  async sendSystemAnnouncement({ userIds, title, message, data = {}, expiresAt }) {
    return this.sendBulkNotification({
      userIds,
      type: 'system_announcement',
      title,
      message,
      data: {
        ...data,
        expiresAt
      },
      priority: 'low'
    });
  }

  /**
   * Determine which channels should receive the notification
   * @private
   */
  _determineChannels(settings, typeConfig, priority, forceChannels) {
    if (forceChannels) {
      return { inApp: true, email: true, sms: true, push: true };
    }

    const category = typeConfig.category;
    const smsCategory = typeConfig.smsCategory;

    return {
      inApp: true, // Always enabled
      email: settings.email?.enabled && settings.email?.[category],
      sms: settings.sms?.enabled && smsCategory && settings.sms?.[smsCategory],
      push: settings.push?.enabled && settings.push?.[category]
    };
  }

  /**
   * Create in-app notification (stored in database)
   * @private
   */
  async _createInAppNotification({ userId, type, title, message, data, priority, channels }) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data,
        priority,
        channels: {
          inApp: true,
          email: channels.email || false,
          sms: channels.sms || false,
          push: channels.push || false
        },
        sentAt: new Date()
      });

      return { success: true, data: notification };
    } catch (error) {
      logger.error('Error creating in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   * @private
   */
  async _sendEmailNotification({ to, type, title, message, data, firstName }) {
    try {
      // Use specific email methods based on notification type
      switch (type) {
        case 'booking_created':
        case 'booking_confirmed':
        case 'booking_completed':
          if (data.booking) {
            return await EmailService.sendBookingConfirmation(to, data.booking);
          }
          break;
        case 'order_confirmation':
          if (data.order) {
            return await EmailService.sendOrderConfirmation(to, data.order);
          }
          break;
        case 'job_application':
          return await EmailService.sendJobApplicationNotification(to, {
            employerName: firstName,
            applicantName: data.applicantName,
            jobTitle: data.jobTitle,
            applicationDate: new Date().toLocaleDateString()
          });
        case 'application_status_update':
          return await EmailService.sendApplicationStatusUpdate(to, {
            applicantName: firstName,
            jobTitle: data.jobTitle,
            status: data.status,
            statusMessage: this._getStatusMessage(data.status)
          });
        case 'referral_reward':
          return await EmailService.sendReferralRewardNotification(to, {
            referrerName: firstName,
            referredName: data.referredUserName,
            rewardAmount: data.rewardAmount
          });
      }

      // Fallback to generic email
      const html = this._generateEmailHTML({ title, message, firstName, data });
      return await EmailService.sendEmail(to, title, html);
    } catch (error) {
      logger.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   * @private
   */
  async _sendSMSNotification({ to, title, message }) {
    try {
      // Format SMS message (keep it concise)
      const smsMessage = `LocalPro: ${title}\n${message}`.substring(0, 160);
      
      return await TwilioService.sendSMS(to, smsMessage);
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification
   * @private
   */
  async _sendPushNotification({ userId, type, title, message, data, priority }) {
    try {
      // Get user's FCM tokens
      const user = await User.findById(userId).select('fcmTokens');
      
      if (!user?.fcmTokens || user.fcmTokens.length === 0) {
        return { success: false, error: 'No FCM tokens registered' };
      }

      // Firebase Admin SDK would be used here
      // For now, return a placeholder indicating push is not yet implemented
      if (!process.env.FIREBASE_PROJECT_ID) {
        logger.warn('Push notifications not configured (FIREBASE_PROJECT_ID not set)');
        return { success: false, error: 'Push notifications not configured' };
      }

      // Import firebase-admin dynamically to avoid errors if not installed
      try {
        const admin = require('firebase-admin');
        
        // Initialize Firebase if not already initialized
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
          });
        }

        const payload = {
          notification: {
            title,
            body: message
          },
          data: {
            type,
            ...Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)])
            )
          },
          android: {
            priority: priority === 'urgent' || priority === 'high' ? 'high' : 'normal',
            notification: {
              sound: 'default',
              channelId: type.includes('message') ? 'messages' : 'notifications'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };

        // Send to all user's devices
        const tokens = user.fcmTokens.map(t => t.token);
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          ...payload
        });

        return {
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount
        };
      } catch (firebaseError) {
        logger.warn('Firebase not available:', firebaseError.message);
        return { success: false, error: 'Push notifications not available' };
      }
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate generic email HTML
   * @private
   */
  _generateEmailHTML({ title, message, firstName, data }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 30px; color: #333333; }
          .content p { line-height: 1.6; margin-bottom: 15px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LocalPro</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <h2>${title}</h2>
            <p>${message}</p>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a>` : ''}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LocalPro Super App. All rights reserved.</p>
            <p>You received this email because you have an account with LocalPro.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get status message for job applications
   * @private
   */
  _getStatusMessage(status) {
    const messages = {
      pending: 'Your application is being reviewed.',
      reviewing: 'The employer is reviewing your application.',
      shortlisted: 'Congratulations! You have been shortlisted.',
      interviewed: 'Thank you for completing the interview.',
      hired: 'Congratulations! You have been hired!',
      rejected: 'Unfortunately, your application was not selected.'
    };
    return messages[status] || 'Your application status has been updated.';
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationSettings(userId) {
    try {
      const userSettings = await UserSettings.findOne({ userId });
      return userSettings?.notifications || DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      logger.error('Error getting user notification settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  /**
   * Check if a specific notification type is enabled for a user
   */
  async isNotificationEnabled(userId, type, channel = 'push') {
    try {
      const settings = await this.getUserNotificationSettings(userId);
      const typeConfig = NOTIFICATION_TYPE_MAP[type];
      
      if (!typeConfig) return true; // Default to enabled for unknown types
      
      const channelSettings = settings[channel];
      if (!channelSettings?.enabled) return false;
      
      const category = channel === 'sms' ? typeConfig.smsCategory : typeConfig.category;
      return category ? channelSettings[category] !== false : true;
    } catch (error) {
      logger.error('Error checking notification enabled:', error);
      return true; // Default to enabled on error
    }
  }
}

module.exports = new NotificationService();

