/**
 * Request Logger Middleware (simple, test-friendly)
 *
 * This middleware matches the unit tests in `src/__tests__/unit/middleware/requestLogger.test.js`.
 * It logs:
 * - debug: request start
 * - warn: slow requests (>= 2000ms)
 * - logRequest: request completion
 */

const logger = require('../config/logger');

const SLOW_THRESHOLD_MS = 2000;

function shouldSkip(req) {
  const url = req.originalUrl || '';
  if (req.method === 'OPTIONS') return true;
  if (url === '/health') return true;
  if (url.startsWith('/static/')) return true;
  return false;
}

function requestLogger(req, res, next) {
  if (shouldSkip(req)) return next();

  const start = Date.now();
  const ip = req.ip || req.connection?.remoteAddress;
  const userId = req.user?.id;

  logger.debug('Request Started', {
    method: req.method,
    url: req.originalUrl,
    ip,
    userId
  });

  // Log slow requests even if the response never ends (best-effort)
  const slowTimer = setTimeout(() => {
    logger.warn('Slow Request Detected', {
      method: req.method,
      url: req.originalUrl,
      ip,
      userId
    });
  }, SLOW_THRESHOLD_MS);

  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    clearTimeout(slowTimer);
    const duration = Date.now() - start;

    // Winston logger has a helper for this shape
    if (typeof logger.logRequest === 'function') {
      logger.logRequest(req, res, duration);
    }

    if (typeof originalEnd === 'function') {
      return originalEnd.call(this, chunk, encoding);
    }
  };

  return next();
}

module.exports = requestLogger;
module.exports.requestLogger = requestLogger;
