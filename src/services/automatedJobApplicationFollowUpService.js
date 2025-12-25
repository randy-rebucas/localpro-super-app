const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const Job = require('../models/Job');
const { Notification } = require('../models/Communication');

/**
 * Automated Job Application Follow-ups
 *
 * Reminds employers to review pending applications after N days.
 * Notifications only; does not modify application state.
 */
class AutomatedJobApplicationFollowUpService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.JOB_APPLICATION_FOLLOWUP_SCHEDULE || '0 10 * * *'; // daily 10:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated job application follow-up service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS !== 'true') return;

    const pendingDays = parseInt(process.env.JOB_APPLICATION_PENDING_DAYS || '7');
    const dedupHours = parseInt(process.env.JOB_APPLICATION_FOLLOWUP_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.JOB_APPLICATION_FOLLOWUP_LIMIT || '300');

    const now = new Date();
    const cutoff = new Date(now.getTime() - pendingDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    // Aggregate pending applications older than cutoff
    const rows = await Job.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$applications' },
      {
        $match: {
          'applications.status': 'pending',
          'applications.appliedAt': { $lte: cutoff }
        }
      },
      {
        $project: {
          jobId: '$_id',
          employer: '$employer',
          title: '$title',
          applicationId: '$applications._id',
          applicant: '$applications.applicant',
          appliedAt: '$applications.appliedAt'
        }
      },
      { $sort: { appliedAt: 1 } },
      { $limit: limit }
    ]);

    if (!rows || rows.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const r of rows) {
      const existing = await Notification.findOne({
        user: r.employer,
        type: 'job_application_followup',
        'data.jobId': r.jobId,
        'data.applicationId': r.applicationId,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: r.employer,
        type: 'job_application_followup',
        title: 'Pending application to review',
        message: `You have a pending application for "${r.title}". Please review and update the status.`,
        data: {
          jobId: r.jobId,
          applicationId: r.applicationId,
          applicantId: r.applicant,
          appliedAt: r.appliedAt
        },
        priority: 'medium'
      });
      sent += 1;
    }

    logger.info('Job application follow-ups completed', { pendingDays, rows: rows.length, sent, skipped });
  }
}

module.exports = new AutomatedJobApplicationFollowUpService();


