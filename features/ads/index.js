/**
 * Ads Feature Module
 *
 * Public API for the Advertisements domain.
 * All files live inside this module — nothing is imported from src/ directly
 * except shared platform infrastructure.
 *
 * Internal structure:
 *   models/      — Advertiser, AdCampaign, AdImpression, Broadcaster
 *   controllers/ — adsController, broadcasterController
 *   routes/      — ads router, broadcaster router
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/services/cloudinaryService
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes = require('./routes/ads');
const broadcasterRoutes = require('./routes/broadcaster');

// ── Models (internal) ────────────────────────────────────────────────────────
const { Advertiser, AdCampaign, AdImpression } = require('./models/Ads');
const Broadcaster = require('./models/Broadcaster');

module.exports = {
  // Routes (mount in server.js)
  routes,
  broadcasterRoutes,

  // Models
  Advertiser,
  AdCampaign,
  AdImpression,
  // Alias kept for existing code that imports Ads directly
  Ads: AdCampaign,
  Broadcaster,
};
