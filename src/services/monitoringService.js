const logger = require('../config/logger');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {}
      },
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        responseTimes: []
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {},
        recent: []
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionPool: {
          active: 0,
          idle: 0,
          total: 0
        }
      }
    };

    this.startTime = Date.now();
  }

  // Track request metrics
  trackRequest(req, res, responseTime) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const status = res.statusCode;
    const isSuccess = status >= 200 && status < 400;

    // Update counters
    this.metrics.requests.total++;
    if (isSuccess) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, successful: 0, failed: 0 };
    }
    this.metrics.requests.byEndpoint[endpoint].total++;
    if (isSuccess) {
      this.metrics.requests.byEndpoint[endpoint].successful++;
    } else {
      this.metrics.requests.byEndpoint[endpoint].failed++;
    }

    // Track by method
    if (!this.metrics.requests.byMethod[req.method]) {
      this.metrics.requests.byMethod[req.method] = { total: 0, successful: 0, failed: 0 };
    }
    this.metrics.requests.byMethod[req.method].total++;
    if (isSuccess) {
      this.metrics.requests.byMethod[req.method].successful++;
    } else {
      this.metrics.requests.byMethod[req.method].failed++;
    }

    // Track by status
    if (!this.metrics.requests.byStatus[status]) {
      this.metrics.requests.byStatus[status] = 0;
    }
    this.metrics.requests.byStatus[status]++;

    // Track response times
    this.metrics.performance.responseTimes.push(responseTime);

    // Keep only last 1000 response times for performance
    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes = this.metrics.performance.responseTimes.slice(-1000);
    }

    // Calculate performance metrics
    this.calculatePerformanceMetrics();

    // Log slow requests
    if (responseTime > 1000) { // 1 second
      logger.warn('Slow request detected', {
        endpoint,
        method: req.method,
        responseTime,
        status,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  }

  // Track error metrics
  trackError(error, req, additionalData = {}) {
    this.metrics.errors.total++;

    const errorType = error.name || 'UnknownError';
    const endpoint = req ? `${req.method} ${req.route?.path || req.path}` : 'Unknown';

    // Track by error type
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;

    // Track by endpoint
    if (!this.metrics.errors.byEndpoint[endpoint]) {
      this.metrics.errors.byEndpoint[endpoint] = 0;
    }
    this.metrics.errors.byEndpoint[endpoint]++;

    // Store recent errors (last 100)
    this.metrics.errors.recent.unshift({
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      endpoint,
      stack: error.stack,
      ...additionalData
    });

    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 100);
    }

    // Log error
    logger.error('Error tracked by monitoring service', {
      errorType,
      endpoint,
      message: error.message,
      stack: error.stack,
      ...additionalData
    });
  }


  // Track database metrics
  trackDatabaseQuery(query, executionTime) {
    this.metrics.database.queries++;

    if (executionTime > 100) { // 100ms threshold for slow queries
      this.metrics.database.slowQueries++;
      logger.warn('Slow database query detected', {
        query: query.substring(0, 200), // Truncate for logging
        executionTime
      });
    }
  }

  // Calculate performance metrics
  calculatePerformanceMetrics() {
    const responseTimes = this.metrics.performance.responseTimes;
    if (responseTimes.length === 0) return;

    // Sort response times
    const sorted = [...responseTimes].sort((a, b) => a - b);

    // Calculate average
    this.metrics.performance.averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    // Calculate percentiles
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    this.metrics.performance.p95ResponseTime = sorted[p95Index] || 0;
    this.metrics.performance.p99ResponseTime = sorted[p99Index] || 0;
  }


  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;

    return {
      ...this.metrics,
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Get health status
  getHealthStatus() {
    const metrics = this.getMetrics();
    const errorRate = metrics.requests.total > 0
      ? (metrics.requests.failed / metrics.requests.total) * 100
      : 0;

    const avgResponseTime = metrics.performance.averageResponseTime;

    let status = 'healthy';
    let issues = [];

    // Check error rate
    if (errorRate > 10) {
      status = 'unhealthy';
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    // Check response time
    if (avgResponseTime > 2000) { // 2 seconds
      status = 'unhealthy';
      issues.push(`High average response time: ${avgResponseTime.toFixed(2)}ms`);
    }

    return {
      status,
      issues,
      metrics: {
        errorRate: parseFloat(errorRate.toFixed(2)),
        averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        totalRequests: metrics.requests.total,
        uptime: metrics.uptime
      }
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {}
      },
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        responseTimes: []
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {},
        recent: []
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionPool: {
          active: 0,
          idle: 0,
          total: 0
        }
      }
    };
    this.startTime = Date.now();
  }

  // Export metrics to external monitoring service
  async exportMetrics() {
    try {
      const metrics = this.getMetrics();


      // Here you could send to external monitoring services like:
      // - DataDog
      // - New Relic
      // - Prometheus
      // - Custom monitoring endpoint

      logger.info('Metrics exported successfully', {
        totalRequests: metrics.requests.total,
        errorRate: ((metrics.requests.failed / metrics.requests.total) * 100).toFixed(2) + '%',
        averageResponseTime: metrics.performance.averageResponseTime.toFixed(2) + 'ms'
      });

      return true;
    } catch (error) {
      logger.error('Failed to export metrics:', error);
      return false;
    }
  }

  // Get endpoint performance report
  getEndpointPerformanceReport() {
    const endpointMetrics = this.metrics.requests.byEndpoint;
    const performanceReport = [];

    for (const [endpoint, metrics] of Object.entries(endpointMetrics)) {
      const successRate = metrics.total > 0
        ? ((metrics.successful / metrics.total) * 100).toFixed(2)
        : '0.00';

      performanceReport.push({
        endpoint,
        totalRequests: metrics.total,
        successfulRequests: metrics.successful,
        failedRequests: metrics.failed,
        successRate: parseFloat(successRate),
        errorRate: parseFloat((100 - successRate).toFixed(2))
      });
    }

    // Sort by total requests (most used endpoints first)
    return performanceReport.sort((a, b) => b.totalRequests - a.totalRequests);
  }
}

module.exports = new MonitoringService();
