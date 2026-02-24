/**
 * SecurityAuditLog – immutable record of sensitive account events.
 *
 * Records events such as password changes, 2FA toggles, session revocations,
 * and account deletions so they can be surfaced in the security overview and
 * used for anomaly detection.
 *
 * Documents are automatically purged after 90 days via the TTL index.
 */
const mongoose = require('mongoose');

const SECURITY_EVENTS = [
  // Auth
  'login_success',
  'login_failed',
  'login_locked',
  'logout',
  'magic_link_sent',
  'magic_link_used',
  // Password
  'password_changed',
  'password_reset_requested',
  'password_reset_completed',
  // 2FA
  '2fa_enabled',
  '2fa_disabled',
  '2fa_backup_codes_regenerated',
  // Sessions
  'session_revoked',
  'all_sessions_revoked',
  // Devices
  'trusted_device_added',
  'trusted_device_removed',
  // OAuth
  'oauth_connected',
  'oauth_disconnected',
  // Privacy / GDPR
  'gdpr_consent_given',
  'gdpr_consent_withdrawn',
  'data_export_requested',
  // Account lifecycle
  'account_deletion_requested',
  'account_deletion_cancelled',
  'account_locked',
  'account_unlocked',
  // Marketplace admin actions
  'booking_admin_reviewed',
  'service_approved',
  'service_rejected',
  'service_featured',
  'dispute_resolved'
];

const securityAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    event: {
      type: String,
      required: true,
      enum: SECURITY_EVENTS,
      index: true
    },
    /** Arbitrary event-specific data (e.g. deviceType, provider, reason). */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    /** TTL – MongoDB removes this document 90 days after creation. */
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

// TTL: remove after 90 days
securityAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─────────────────────────────────────────────────────────────────────────────
// Static helper – fire-and-forget friendly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log a security event.  Errors are swallowed so a logging failure never
 * breaks the request flow.
 * @param {string|ObjectId} userId
 * @param {string} event  - One of SECURITY_EVENTS
 * @param {Object} [opts]
 * @param {string} [opts.ipAddress]
 * @param {string} [opts.userAgent]
 * @param {Object} [opts.metadata]
 */
securityAuditLogSchema.statics.log = async function (userId, event, opts = {}) {
  try {
    await this.create({
      userId,
      event,
      ipAddress: opts.ipAddress || null,
      userAgent: opts.userAgent || null,
      metadata: opts.metadata || {}
    });
  } catch (err) {
    // Non-fatal – log to console but don't throw
    console.error('[SecurityAuditLog] Failed to write audit entry:', err.message);
  }
};

module.exports = mongoose.model('SecurityAuditLog', securityAuditLogSchema);
module.exports.SECURITY_EVENTS = SECURITY_EVENTS;
