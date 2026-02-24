/**
 * Feeds Feature Module
 *
 * Public API for the Social/Community Feeds domain.
 * All external code must import from this index -- not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/models/Activity
 * - src/models/Job
 * - src/utils/logger
 */

// -- Routes -------------------------------------------------------------------
const routes = require('./routes/feeds');

// -- Models -------------------------------------------------------------------
const Feed = require('./models/Feed');

// -- Services -----------------------------------------------------------------
const feedService = require('./services/feedService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Feed,

  // Services
  feedService,
};
