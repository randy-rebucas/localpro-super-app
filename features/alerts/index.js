/**
 * Alerts Feature Module
 *
 * Public API for the Alerts/monitoring domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/metricsMiddleware
 * - src/middleware/auth (authorize)
 * - src/config/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const alertsRoute = require('./routes/alerts');

module.exports = {
  // alertsRoute exports { router, startAlertMonitoring, stopAlertMonitoring, checkAlerts }
  // server.js uses alertsRoutes.router
  router: alertsRoute.router,
  startAlertMonitoring: alertsRoute.startAlertMonitoring,
  stopAlertMonitoring: alertsRoute.stopAlertMonitoring,
  checkAlerts: alertsRoute.checkAlerts,
};
