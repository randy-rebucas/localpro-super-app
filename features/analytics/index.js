/**
 * Analytics Feature Module
 * Public API — only file external code may require
 */

const routes = require('./routes/analytics');
const { AnalyticsEvent, UserAnalytics, ServiceAnalytics, PlatformAnalytics } = require('./models/Analytics');
const { EmailEvent, EmailDailyStats } = require('./models/EmailAnalytics');
const analyticsService = require('./services/analyticsService');

module.exports = {
  routes,
  AnalyticsEvent,
  UserAnalytics,
  ServiceAnalytics,
  PlatformAnalytics,
  EmailEvent,
  EmailDailyStats,
  analyticsService
};
