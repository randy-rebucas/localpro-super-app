const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { LiveChatSession } = require('../models/LiveChat');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * Automated Live Chat SLA Service
 *
 * Alerts admins/support when there are pending live chat sessions
 * waiting longer than X minutes without an agent response.
 */
class AutomatedLiveChatSlaService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.LIVECHAT_SLA_SCHEDULE || '*/5 * * * *'; // every 5 minutes

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated live chat SLA service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_LIVECHAT_SLA !== 'true') return;

    const waitMinutes = parseInt(process.env.LIVECHAT_SLA_WAIT_MINUTES || '10');
    const limit = parseInt(process.env.LIVECHAT_SLA_LIMIT || '50');
    const dedupMinutes = parseInt(process.env.LIVECHAT_SLA_DEDUP_MINUTES || '30');

    const now = new Date();
    const cutoff = new Date(now.getTime() - waitMinutes * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupMinutes * 60 * 1000);

    const sessions = await LiveChatSession.find({
      status: 'pending',
      startedAt: { $lte: cutoff }
    })
      .select('_id sessionId startedAt department priority user.email')
      .sort({ startedAt: 1 })
      .limit(limit)
      .lean();

    if (sessions.length === 0) return;

    const recipients = await User.find({ roles: { $in: ['admin'] }, isActive: true })
      .select('_id')
      .lean();

    if (recipients.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const s of sessions) {
      for (const admin of recipients) {
        const existing = await Notification.findOne({
          user: admin._id,
          type: 'livechat_sla_alert',
          'data.sessionId': s._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (existing) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendNotification({
          userId: admin._id,
          type: 'livechat_sla_alert',
          title: 'Live chat waiting',
          message: `A live chat session has been waiting ${waitMinutes}+ minutes (dept: ${s.department}).`,
          data: { sessionId: s._id, sessionKey: s.sessionId, department: s.department, priority: s.priority },
          priority: 'high'
        });
        sent += 1;
      }
    }

    logger.info('Live chat SLA alerts completed', { sessions: sessions.length, admins: recipients.length, sent, skipped });
  }
}

module.exports = new AutomatedLiveChatSlaService();


