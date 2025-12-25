const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const User = require('../models/User');
const { Conversation, Notification } = require('../models/Communication');

/**
 * Automated Messaging Nudge Service
 *
 * Goal: Reduce missed/unread messages by sending a gentle reminder when:
 * - a conversation has a new message older than X minutes
 * - a participant hasn't read it (participants.lastReadAt < lastMessage.timestamp)
 * - we haven't already nudged that participant recently for that conversation
 */
class AutomatedMessagingNudgeService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.MESSAGE_NUDGE_SCHEDULE || '*/30 * * * *'; // every 30 minutes

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated messaging nudge service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_MESSAGE_NUDGES !== 'true') return;

    const minAgeMinutes = parseInt(process.env.MESSAGE_NUDGE_MIN_AGE_MINUTES || '60');
    const dedupMinutes = parseInt(process.env.MESSAGE_NUDGE_DEDUP_MINUTES || '360'); // 6h
    const maxConversations = parseInt(process.env.MESSAGE_NUDGE_MAX_CONVERSATIONS || '200');
    const maxNotifies = parseInt(process.env.MESSAGE_NUDGE_MAX_NOTIFICATIONS || '500');

    const now = new Date();
    const minAgeCutoff = new Date(now.getTime() - minAgeMinutes * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupMinutes * 60 * 1000);

    // Conversations with a last message older than cutoff.
    // We only nudge on active conversations with a sender set.
    const conversations = await Conversation.find({
      isActive: true,
      status: 'active',
      'lastMessage.sender': { $exists: true, $ne: null },
      'lastMessage.timestamp': { $lte: minAgeCutoff }
    })
      .select('participants lastMessage')
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(maxConversations)
      .lean();

    if (conversations.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const conv of conversations) {
      if (sent >= maxNotifies) break;
      if (!conv.lastMessage?.timestamp || !conv.lastMessage?.sender) continue;

      // Fetch sender display name once per conversation
      let senderName = 'Someone';
      try {
        const sender = await User.findById(conv.lastMessage.sender).select('firstName lastName').lean();
        if (sender) senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Someone';
      } catch (e) {
        // ignore
      }

      for (const participant of conv.participants || []) {
        if (sent >= maxNotifies) break;
        if (!participant?.user) continue;

        // don't notify the sender about their own message
        if (String(participant.user) === String(conv.lastMessage.sender)) continue;

        const lastReadAt = participant.lastReadAt ? new Date(participant.lastReadAt) : new Date(0);
        const lastMsgAt = new Date(conv.lastMessage.timestamp);
        if (lastReadAt >= lastMsgAt) continue; // already read

        // Deduplicate per user+conversation within window
        const existing = await Notification.findOne({
          user: participant.user,
          type: 'message_received',
          'data.conversationId': conv._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (existing) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendMessageNotification({
          userId: participant.user,
          senderId: conv.lastMessage.sender,
          senderName,
          conversationId: conv._id,
          messagePreview: (conv.lastMessage.content || '').slice(0, 80),
          isUrgent: false
        });

        sent += 1;
      }
    }

    logger.info('Automated messaging nudges completed', {
      conversations: conversations.length,
      sent,
      skipped
    });
  }
}

module.exports = new AutomatedMessagingNudgeService();


