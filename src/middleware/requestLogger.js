const logger = require('../config/logger');

// Custom request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start only for important requests (not health checks, static files, etc.)
  const shouldLog = !req.originalUrl.includes('/health') && 
                   !req.originalUrl.includes('/static') && 
                   !req.originalUrl.includes('/favicon.ico') &&
                   req.method !== 'OPTIONS';
  
  if (shouldLog) {
    logger.debug('Request Started', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString()
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, responseTime);
    
    // Log slow requests
    if (responseTime > 2000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userId: req.user ? req.user.id : null
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
