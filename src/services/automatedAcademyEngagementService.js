const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Enrollment } = require('../models/Academy');
const UserSettings = require('../models/UserSettings');
const { Notification } = require('../models/Communication');

/**
 * Automated Academy Engagement Service
 *
 * - Nudges students who enrolled but never started
 * - Nudges students whose progress stalled
 *
 * Uses NotificationService so it respects user preferences.
 */
class AutomatedAcademyEngagementService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.ACADEMY_ENGAGEMENT_SCHEDULE || '30 9 * * *'; // daily 9:30

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated academy engagement service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT !== 'true') return;

    const notStartedDays = parseInt(process.env.ACADEMY_NOT_STARTED_DAYS || '3');
    const stalledDays = parseInt(process.env.ACADEMY_STALLED_DAYS || '5');
    const limit = parseInt(process.env.ACADEMY_ENGAGEMENT_LIMIT || '300');
    const dedupDays = parseInt(process.env.ACADEMY_ENGAGEMENT_DEDUP_DAYS || '3');

    const now = new Date();
    const notStartedCutoff = new Date(now.getTime() - notStartedDays * 24 * 60 * 60 * 1000);
    const stalledCutoff = new Date(now.getTime() - stalledDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    // Only users who opted into system updates via email (product/learning notifications)
    const settings = await UserSettings.find({
      'notifications.email.enabled': true,
      'notifications.email.systemUpdates': true
    })
      .select('userId')
      .lean();

    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    await Promise.all([
      this._nudgeNotStarted({ userIds, notStartedCutoff, dedupCutoff, limit }),
      this._nudgeStalled({ userIds, stalledCutoff, dedupCutoff, limit })
    ]);
  }

  async _nudgeNotStarted({ userIds, notStartedCutoff, dedupCutoff, limit }) {
    const enrollments = await Enrollment.find({
      student: { $in: userIds },
      status: { $in: ['enrolled', 'in_progress'] },
      createdAt: { $lte: notStartedCutoff },
      'progress.overallProgress': { $lte: 0 }
    })
      .select('_id student course createdAt')
      .populate('course', 'title')
      .limit(limit)
      .lean();

    let sent = 0;
    let skipped = 0;

    for (const e of enrollments) {
      const existing = await Notification.findOne({
        user: e.student,
        type: 'academy_not_started',
        'data.enrollmentId': e._id,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();
      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: e.student,
        type: 'academy_not_started',
        title: 'Start your course',
        message: `You enrolled in "${e.course?.title || 'a course'}". Start today and keep your momentum.`,
        data: { enrollmentId: e._id, courseId: e.course?._id },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Academy not-started nudges completed', { enrollments: enrollments.length, sent, skipped });
  }

  async _nudgeStalled({ userIds, stalledCutoff, dedupCutoff, limit }) {
    const enrollments = await Enrollment.find({
      student: { $in: userIds },
      status: 'in_progress',
      updatedAt: { $lte: stalledCutoff },
      'progress.overallProgress': { $gt: 0, $lt: 100 }
    })
      .select('_id student course updatedAt progress.overallProgress')
      .populate('course', 'title')
      .limit(limit)
      .lean();

    let sent = 0;
    let skipped = 0;

    for (const e of enrollments) {
      const existing = await Notification.findOne({
        user: e.student,
        type: 'academy_progress_stalled',
        'data.enrollmentId': e._id,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();
      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: e.student,
        type: 'academy_progress_stalled',
        title: 'Continue your course',
        message: `You’re ${Math.round(e.progress?.overallProgress || 0)}% through "${e.course?.title || 'your course'}". Keep going!`,
        data: { enrollmentId: e._id, courseId: e.course?._id },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Academy stalled nudges completed', { enrollments: enrollments.length, sent, skipped });
  }
}

module.exports = new AutomatedAcademyEngagementService();


