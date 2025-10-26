const monitoringService = require('../services/monitoringService');

// Request monitoring middleware
const monitorRequests = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;

    // Track the request
    monitoringService.trackRequest(req, res, responseTime);

    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

// Error monitoring middleware
const monitorErrors = (error, req, res, next) => {
  // Track the error
  monitoringService.trackError(error, req, {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Continue with error handling
  next(error);
};

// Database query monitoring
const monitorDatabaseQueries = (req, res, next) => {
  // This would be integrated with Mongoose middleware
  // For now, we'll just pass through
  next();
};

module.exports = {
  monitorRequests,
  monitorErrors,
  monitorDatabaseQueries
};
