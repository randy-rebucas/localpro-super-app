const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Enrollment } = require('../models/Academy');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * Automated Academy Certificate Service
 *
 * Alerts admins when completed enrollments have no certificate issued yet.
 * (Notifications only; no automatic certificate generation.)
 */
class AutomatedAcademyCertificateService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.ACADEMY_CERTIFICATE_SCHEDULE || '0 11 * * *'; // daily 11:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated academy certificate service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_ACADEMY_CERTIFICATES !== 'true') return;

    const dedupHours = parseInt(process.env.ACADEMY_CERTIFICATE_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.ACADEMY_CERTIFICATE_LIMIT || '200');
    const minCompletedDays = parseInt(process.env.ACADEMY_CERTIFICATE_MIN_COMPLETED_DAYS || '0');

    const now = new Date();
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);
    const completedCutoff = new Date(now.getTime() - minCompletedDays * 24 * 60 * 60 * 1000);

    const enrollments = await Enrollment.find({
      status: 'completed',
      updatedAt: { $lte: completedCutoff },
      'certificate.issued': { $ne: true },
      // if paid course, prefer paid before notifying
      $or: [{ 'payment.status': { $ne: 'pending' } }, { 'payment.status': { $exists: false } }]
    })
      .select('_id student course updatedAt')
      .populate('course', 'title')
      .limit(limit)
      .lean();

    if (enrollments.length === 0) return;

    const admins = await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean();
    if (admins.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const e of enrollments) {
      for (const a of admins) {
        const existing = await Notification.findOne({
          user: a._id,
          type: 'academy_certificate_pending',
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
          userId: a._id,
          type: 'academy_certificate_pending',
          title: 'Certificate pending',
          message: `A completed course needs a certificate: "${e.course?.title || 'Course'}".`,
          data: { enrollmentId: e._id, studentId: e.student, courseId: e.course?._id },
          priority: 'medium'
        });
        sent += 1;
      }
    }

    logger.info('Academy certificate pending alerts completed', {
      enrollments: enrollments.length,
      admins: admins.length,
      sent,
      skipped
    });
  }
}

module.exports = new AutomatedAcademyCertificateService();


