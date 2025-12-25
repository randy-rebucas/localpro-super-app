const cron = require('node-cron');
const logger = require('../config/logger');
const { Message, Notification } = require('../models/Communication');
const NotificationService = require('./notificationService');
const User = require('../models/User');

/**
 * Automated Messaging Moderation (lightweight)
 *
 * Flags messages that appear to contain phone numbers/emails (contact leakage).
 * - Not blocking messages
 * - Not deleting messages
 * - Sends admin alerts + optional sender warning
 */
class AutomatedMessagingModerationService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;
    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.MESSAGE_MODERATION_SCHEDULE || '*/10 * * * *'; // every 10 minutes

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated messaging moderation service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_MESSAGE_MODERATION !== 'true') return;

    const lookbackMinutes = parseInt(process.env.MESSAGE_MODERATION_LOOKBACK_MINUTES || '15');
    const dedupHours = parseInt(process.env.MESSAGE_MODERATION_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.MESSAGE_MODERATION_LIMIT || '500');
    const warnSender = process.env.MESSAGE_MODERATION_WARN_SENDER === 'true';

    const now = new Date();
    const since = new Date(now.getTime() - lookbackMinutes * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    // Very simple patterns (best-effort)
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /(\+?\d[\d\s().-]{8,}\d)/; // loose

    const messages = await Message.find({
      createdAt: { $gte: since },
      'metadata.isDeleted': { $ne: true }
    })
      .select('_id conversation sender content createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (messages.length === 0) return;

    const admins = await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean();
    if (admins.length === 0) return;

    let flagged = 0;
    let sent = 0;
    let skipped = 0;

    for (const m of messages) {
      const content = m.content || '';
      if (!content) continue;

      const looksLikeLeak = emailRegex.test(content) || phoneRegex.test(content);
      if (!looksLikeLeak) continue;

      flagged += 1;

      for (const a of admins) {
        const existing = await Notification.findOne({
          user: a._id,
          type: 'message_moderation_flag',
          'data.messageId': m._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();
        if (existing) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendNotification({
          userId: a._id,
          type: 'message_moderation_flag',
          title: 'Message flagged',
          message: 'A message may contain contact details (email/phone). Review recommended.',
          data: { messageId: m._id, conversationId: m.conversation, senderId: m.sender, createdAt: m.createdAt },
          priority: 'medium'
        });
        sent += 1;
      }

      if (warnSender) {
        const existingWarn = await Notification.findOne({
          user: m.sender,
          type: 'message_policy_warning',
          'data.messageId': m._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (!existingWarn) {
          await NotificationService.sendNotification({
            userId: m.sender,
            type: 'message_policy_warning',
            title: 'Reminder: keep communication in-app',
            message: 'Please avoid sharing phone numbers/emails in chat. Use in-app messaging for safety and support.',
            data: { messageId: m._id, conversationId: m.conversation },
            priority: 'low'
          });
          sent += 1;
        } else {
          skipped += 1;
        }
      }
    }

    if (flagged > 0) {
      logger.info('Messaging moderation completed', { scanned: messages.length, flagged, sent, skipped });
    }
  }
}

module.exports = new AutomatedMessagingModerationService();


