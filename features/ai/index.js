/**
 * AI Feature Module
 *
 * Public API for the AI Bot, AI Marketplace, AI User, and sub-agent domain.
 *
 * Internal structure:
 *   models/          — AIBot
 *   controllers/     — aiBotController, aiMarketplaceController, aiUserController
 *   routes/          — aiBot, aiMarketplace, aiUsers
 *   services/        — aiService, aiBotService, aiBotEventListener
 *   services/subAgents/ — baseSubAgent + 9 domain agents
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth
 * - src/models/User, Marketplace
 * - src/services/n8nService
 * - src/config/logger, src/utils/responseHelper
 *
 * Cross-feature dependencies:
 * - features/provider → Provider (via providerAgent)
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const aiBotRoutes          = require('./routes/aiBot');
const aiMarketplaceRoutes  = require('./routes/aiMarketplace');
const aiUsersRoutes        = require('./routes/aiUsers');

// ── Models (internal) ────────────────────────────────────────────────────────
const AIBot = require('./models/AIBot');

// ── Services (internal) ──────────────────────────────────────────────────────
const aiService            = require('./services/aiService');
const aiBotService         = require('./services/aiBotService');
const aiBotEventListener   = require('./services/aiBotEventListener');

module.exports = {
  // Routes (mount in server.js)
  aiBotRoutes,
  aiMarketplaceRoutes,
  aiUsersRoutes,

  // Models
  AIBot,

  // Services
  aiService,
  aiBotService,
  aiBotEventListener,
};
