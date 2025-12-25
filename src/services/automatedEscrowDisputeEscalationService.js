const cron = require('node-cron');
const logger = require('../config/logger');
const Escrow = require('../models/Escrow');
const NotificationService = require('./notificationService');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * Automated Escrow Dispute Escalation
 *
 * - Remind admins if disputes remain unresolved after N days
 * - Remind parties to add evidence if dispute has no evidence after X hours
 *
 * Notifications only; no automatic resolution or state changes.
 */
class AutomatedEscrowDisputeEscalationService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const adminSchedule = process.env.ESCROW_DISPUTE_ADMIN_SCHEDULE || '0 */6 * * *'; // every 6 hours
    const partySchedule = process.env.ESCROW_DISPUTE_PARTY_SCHEDULE || '*/30 * * * *'; // every 30 minutes

    this.jobs.push(
      cron.schedule(
        adminSchedule,
        async () => {
          await this.runAdminEscalationsOnce();
        },
        { timezone }
      )
    );

    this.jobs.push(
      cron.schedule(
        partySchedule,
        async () => {
          await this.runPartyEvidenceNudgesOnce();
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated escrow dispute escalation service started', {
      timezone,
      adminSchedule,
      partySchedule
    });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  async runAdminEscalationsOnce() {
    if (process.env.ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS !== 'true') return;

    const unresolvedDays = parseInt(process.env.ESCROW_DISPUTE_ADMIN_UNRESOLVED_DAYS || '3');
    const dedupHours = parseInt(process.env.ESCROW_DISPUTE_ADMIN_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.ESCROW_DISPUTE_ADMIN_LIMIT || '200');

    const now = new Date();
    const cutoff = new Date(now.getTime() - unresolvedDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    const escrows = await Escrow.find({
      status: 'DISPUTE',
      'dispute.raised': true,
      'dispute.raisedAt': { $lte: cutoff },
      'dispute.adminResolution.decidedAt': { $exists: false }
    })
      .select('_id bookingId clientId providerId dispute.raisedAt dispute.reason')
      .limit(limit)
      .lean();

    if (escrows.length === 0) return;

    const admins = await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean();
    if (admins.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const e of escrows) {
      for (const a of admins) {
        const existing = await Notification.findOne({
          user: a._id,
          type: 'escrow_dispute_unresolved',
          'data.escrowId': e._id,
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
          type: 'escrow_dispute_unresolved',
          title: 'Escrow dispute needs review',
          message: `A dispute has been open for ${unresolvedDays}+ day(s). Please review and resolve.`,
          data: { escrowId: e._id, bookingId: e.bookingId, reason: e.dispute?.reason },
          priority: 'high'
        });
        sent += 1;
      }
    }

    logger.info('Escrow admin dispute escalations completed', { escrows: escrows.length, admins: admins.length, sent, skipped });
  }

  async runPartyEvidenceNudgesOnce() {
    if (process.env.ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS !== 'true') return;

    const hoursAfterRaise = parseInt(process.env.ESCROW_DISPUTE_PARTY_EVIDENCE_AFTER_HOURS || '6');
    const dedupHours = parseInt(process.env.ESCROW_DISPUTE_PARTY_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.ESCROW_DISPUTE_PARTY_LIMIT || '200');

    const now = new Date();
    const cutoff = new Date(now.getTime() - hoursAfterRaise * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    // disputes with no evidence yet
    const escrows = await Escrow.find({
      status: 'DISPUTE',
      'dispute.raised': true,
      'dispute.raisedAt': { $lte: cutoff },
      $or: [{ 'dispute.evidence': { $exists: false } }, { 'dispute.evidence.0': { $exists: false } }],
      'dispute.adminResolution.decidedAt': { $exists: false }
    })
      .select('_id bookingId clientId providerId dispute.raisedAt')
      .limit(limit)
      .lean();

    if (escrows.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const e of escrows) {
      const partyIds = [e.clientId, e.providerId].filter(Boolean);
      for (const uid of partyIds) {
        const existing = await Notification.findOne({
          user: uid,
          type: 'escrow_dispute_evidence_needed',
          'data.escrowId': e._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (existing) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendNotification({
          userId: uid,
          type: 'escrow_dispute_evidence_needed',
          title: 'Add dispute evidence',
          message: 'To help resolve the dispute faster, please upload evidence/details in the escrow dispute screen.',
          data: { escrowId: e._id, bookingId: e.bookingId },
          priority: 'medium'
        });
        sent += 1;
      }
    }

    logger.info('Escrow party evidence nudges completed', { escrows: escrows.length, sent, skipped });
  }
}

module.exports = new AutomatedEscrowDisputeEscalationService();


