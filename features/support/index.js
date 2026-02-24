/**
 * Support Feature Module
 *
 * Public API for the Support & Live-Chat domain.
 * All external code must import from this index — not from internal files directly.
 *
 * Internal structure:
 *   models/      — SupportTicket, LiveChat
 *   controllers/ — supportController, liveChatController
 *   routes/      — support, liveChat, adminLiveChat
 *   services/    — liveChatWebSocketService, automatedLiveChatSlaService
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/models/Communication
 * - src/services/notificationService
 * - src/services/cloudinaryService
 * - src/config/logger
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes          = require('./routes/support');
const liveChatRoutes  = require('./routes/liveChat');
const adminChatRoutes = require('./routes/adminLiveChat');

// ── Models (internal) ────────────────────────────────────────────────────────
const SupportTicket = require('./models/SupportTicket');
const LiveChat      = require('./models/LiveChat');

// ── Services (internal) ──────────────────────────────────────────────────────
const liveChatWebSocketService    = require('./services/liveChatWebSocketService');
const automatedLiveChatSlaService = require('./services/automatedLiveChatSlaService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  liveChatRoutes,
  adminChatRoutes,

  // Models
  SupportTicket,
  LiveChat,

  // Services
  liveChatWebSocketService,
  automatedLiveChatSlaService,
};
