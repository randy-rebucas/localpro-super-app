const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Loan, SalaryAdvance } = require('../models/Finance');
const { Notification } = require('../models/Communication');

/**
 * Automated Finance Reminder Service
 *
 * - Loan repayment due reminders (N days before dueDate)
 * - Loan repayment overdue alerts
 * - Salary advance due reminders / overdue alerts
 *
 * Only sends notifications (no auto-debits or state changes).
 */
class AutomatedFinanceReminderService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.FINANCE_REMINDER_SCHEDULE || '0 10 * * *'; // daily 10:00

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated finance reminder service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_FINANCE_REMINDERS !== 'true') return;

    const daysBefore = parseInt(process.env.FINANCE_REMINDER_DAYS_BEFORE || '3');
    const dedupHours = parseInt(process.env.FINANCE_REMINDER_DEDUP_HOURS || '24');
    const loanLimit = parseInt(process.env.FINANCE_REMINDER_LOAN_LIMIT || '300');
    const advanceLimit = parseInt(process.env.FINANCE_REMINDER_ADVANCE_LIMIT || '300');

    const now = new Date();
    const dueStart = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    const dueEnd = new Date(now.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    await Promise.all([
      this._loanDueReminders({ dueStart, dueEnd, dedupCutoff, limit: loanLimit }),
      this._loanOverdueAlerts({ now, dedupCutoff, limit: loanLimit }),
      this._salaryAdvanceDueReminders({ dueStart, dueEnd, dedupCutoff, limit: advanceLimit }),
      this._salaryAdvanceOverdueAlerts({ now, dedupCutoff, limit: advanceLimit })
    ]);
  }

  async _loanDueReminders({ dueStart, dueEnd, dedupCutoff, limit }) {
    const loans = await Loan.find({
      status: { $in: ['active', 'disbursed'] },
      repayment: {
        schedule: {
          $elemMatch: {
            status: 'pending',
            dueDate: { $gte: dueStart, $lt: dueEnd }
          }
        }
      }
    })
      .select('_id borrower repayment.schedule')
      .limit(limit)
      .lean();

    for (const loan of loans) {
      const dueItems = (loan.repayment?.schedule || []).filter(
        s => s?.status === 'pending' && s?.dueDate && new Date(s.dueDate) >= dueStart && new Date(s.dueDate) < dueEnd
      );

      for (const item of dueItems) {
        const dueDateIso = new Date(item.dueDate).toISOString().slice(0, 10);
        const existing = await Notification.findOne({
          user: loan.borrower,
          type: 'loan_repayment_due',
          'data.loanId': loan._id,
          'data.dueDate': dueDateIso,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();
        if (existing) continue;

        await NotificationService.sendNotification({
          userId: loan.borrower,
          type: 'loan_repayment_due',
          title: 'Upcoming repayment',
          message: `Reminder: your loan payment is due on ${dueDateIso}.`,
          data: { loanId: loan._id, dueDate: dueDateIso },
          priority: 'medium'
        });
      }
    }
  }

  async _loanOverdueAlerts({ now, dedupCutoff, limit }) {
    const loans = await Loan.find({
      status: { $in: ['active', 'disbursed'] },
      repayment: {
        schedule: {
          $elemMatch: {
            status: { $in: ['pending', 'overdue'] },
            dueDate: { $lt: now }
          }
        }
      }
    })
      .select('_id borrower repayment.schedule')
      .limit(limit)
      .lean();

    for (const loan of loans) {
      const overdueItems = (loan.repayment?.schedule || []).filter(
        s => s?.dueDate && new Date(s.dueDate) < now && ['pending', 'overdue'].includes(s.status)
      );

      for (const item of overdueItems) {
        const dueDateIso = new Date(item.dueDate).toISOString().slice(0, 10);
        const existing = await Notification.findOne({
          user: loan.borrower,
          type: 'loan_repayment_overdue',
          'data.loanId': loan._id,
          'data.dueDate': dueDateIso,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();
        if (existing) continue;

        await NotificationService.sendNotification({
          userId: loan.borrower,
          type: 'loan_repayment_overdue',
          title: 'Payment overdue',
          message: `Your loan payment due on ${dueDateIso} is overdue. Please settle it as soon as possible.`,
          data: { loanId: loan._id, dueDate: dueDateIso },
          priority: 'high'
        });
      }
    }
  }

  async _salaryAdvanceDueReminders({ dueStart, dueEnd, dedupCutoff, limit }) {
    const advances = await SalaryAdvance.find({
      status: { $in: ['approved', 'disbursed'] },
      'repayment.dueDate': { $gte: dueStart, $lt: dueEnd }
    })
      .select('_id employee repayment.dueDate')
      .limit(limit)
      .lean();

    for (const adv of advances) {
      const dueDateIso = new Date(adv.repayment.dueDate).toISOString().slice(0, 10);
      const existing = await Notification.findOne({
        user: adv.employee,
        type: 'salary_advance_due',
        'data.salaryAdvanceId': adv._id,
        'data.dueDate': dueDateIso,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();
      if (existing) continue;

      await NotificationService.sendNotification({
        userId: adv.employee,
        type: 'salary_advance_due',
        title: 'Upcoming repayment',
        message: `Reminder: your salary advance repayment is due on ${dueDateIso}.`,
        data: { salaryAdvanceId: adv._id, dueDate: dueDateIso },
        priority: 'medium'
      });
    }
  }

  async _salaryAdvanceOverdueAlerts({ now, dedupCutoff, limit }) {
    const advances = await SalaryAdvance.find({
      status: { $in: ['approved', 'disbursed'] },
      'repayment.dueDate': { $lt: now },
      'repayment.repaidAt': { $exists: false }
    })
      .select('_id employee repayment.dueDate')
      .limit(limit)
      .lean();

    for (const adv of advances) {
      const dueDateIso = new Date(adv.repayment.dueDate).toISOString().slice(0, 10);
      const existing = await Notification.findOne({
        user: adv.employee,
        type: 'salary_advance_overdue',
        'data.salaryAdvanceId': adv._id,
        'data.dueDate': dueDateIso,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();
      if (existing) continue;

      await NotificationService.sendNotification({
        userId: adv.employee,
        type: 'salary_advance_overdue',
        title: 'Payment overdue',
        message: `Your salary advance repayment due on ${dueDateIso} is overdue. Please settle it as soon as possible.`,
        data: { salaryAdvanceId: adv._id, dueDate: dueDateIso },
        priority: 'high'
      });
    }
  }
}

module.exports = new AutomatedFinanceReminderService();


