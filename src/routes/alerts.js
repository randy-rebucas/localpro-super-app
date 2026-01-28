const express = require('express');
const router = express.Router();
const { 
  getMetricsAsJSON,
  recordBusinessEvent 
} = require('../middleware/metricsMiddleware');
const logger = require('../config/logger');

// Alert configuration
const getAlertThresholds = () => ({
  responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_MS || '5000'), // ms
  errorRate: parseInt(process.env.ALERT_ERROR_RATE_PER_MIN || '10'), // errors
  heapUsageRatio: parseFloat(process.env.ALERT_HEAP_USAGE_RATIO || '0.9'), // heapUsed/heapTotal
  heapMinTotalMb: parseInt(process.env.ALERT_HEAP_MIN_TOTAL_MB || '128'), // only alert if heapTotal >= this MB
  rssMb: parseInt(process.env.ALERT_RSS_MB || '0'), // 0 disables
  systemMemoryPercent: parseFloat(process.env.ALERT_SYSTEM_MEMORY_PERCENT || '0'), // 0 disables
  cpuUsage: parseFloat(process.env.ALERT_CPU_PERCENT || '80'),
  activeConnections: parseInt(process.env.ALERT_ACTIVE_CONNECTIONS || '1000')
});

const ALERT_DEDUP_WINDOW_MS = parseInt(process.env.ALERT_DEDUP_WINDOW_MS || String(10 * 60 * 1000)); // 10 min
// Runtime overrides set via API (useful in dev); env vars remain the baseline.
let alertThresholdOverrides = {};

const getEffectiveAlertThresholds = () => ({
  ...getAlertThresholds(),
  ...alertThresholdOverrides
});

// Alert history storage (in production, use database)
// Maximum number of alerts to keep in memory (prevents unbounded growth)
const MAX_ALERT_HISTORY = 1000;
let alertHistory = [];

// Clean up old alerts to prevent unbounded memory growth
const cleanupAlertHistory = () => {
  if (alertHistory.length > MAX_ALERT_HISTORY) {
    // Keep only the most recent alerts
    alertHistory = alertHistory.slice(-MAX_ALERT_HISTORY);
    logger.debug(`Alert history cleaned up. Kept ${alertHistory.length} most recent alerts.`);
  }
  
  // Also remove alerts older than 24 hours to prevent stale data
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  alertHistory = alertHistory.filter(alert => {
    const alertTime = new Date(alert.timestamp).getTime();
    return alertTime > twentyFourHoursAgo;
  });
};

// Check for alerts based on current metrics
const checkAlerts = async () => {
  try {
    const alertThresholds = getEffectiveAlertThresholds();
    const metrics = await getMetricsAsJSON();
    const alerts = [];
    
    // Check response time
    const responseTime = metrics.find(m => m.name === 'response_time_seconds');
    if (responseTime && responseTime.values[0]?.value > alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `High response time: ${responseTime.values[0].value}ms`,
        threshold: alertThresholds.responseTime,
        value: responseTime.values[0].value,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check error rate
    const errors = metrics.find(m => m.name === 'errors_total');
    if (errors && errors.values.length > 0) {
      const totalErrors = errors.values.reduce((sum, v) => sum + v.value, 0);
      if (totalErrors > alertThresholds.errorRate) {
        alerts.push({
          type: 'error_rate',
          severity: 'critical',
          message: `High error rate: ${totalErrors} errors`,
          threshold: alertThresholds.errorRate,
          value: totalErrors,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check memory usage
    const memoryUsage = metrics.find(m => m.name === 'memory_usage_bytes');
    if (memoryUsage) {
      const heapUsed = memoryUsage.values.find(v => v.labels.type === 'heapUsed')?.value || 0;
      const heapTotal = memoryUsage.values.find(v => v.labels.type === 'heapTotal')?.value || 0;
      const rss = memoryUsage.values.find(v => v.labels.type === 'rss')?.value || 0;
      
      const heapTotalMb = heapTotal / 1024 / 1024;
      const heapUsedMb = heapUsed / 1024 / 1024;

      if (heapTotal > 0 && heapTotalMb >= alertThresholds.heapMinTotalMb && (heapUsed / heapTotal) > alertThresholds.heapUsageRatio) {
        alerts.push({
          type: 'memory_usage',
          severity: 'warning',
          message: `High heap usage: ${((heapUsed / heapTotal) * 100).toFixed(2)}% (${heapUsedMb.toFixed(0)}MB/${heapTotalMb.toFixed(0)}MB)`,
          threshold: alertThresholds.heapUsageRatio,
          value: heapUsed / heapTotal,
          timestamp: new Date().toISOString()
        });
      }

      // Optional: alert on process RSS (more correlated with container OOM)
      if (alertThresholds.rssMb > 0) {
        const rssMb = rss / 1024 / 1024;
        if (rssMb > alertThresholds.rssMb) {
          alerts.push({
            type: 'process_rss',
            severity: 'warning',
            message: `High process RSS: ${rssMb.toFixed(0)}MB`,
            threshold: alertThresholds.rssMb,
            value: rssMb,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Optional: check system memory usage percent (host/container level)
    if (alertThresholds.systemMemoryPercent > 0) {
      const systemMem = metrics.find(m => m.name === 'system_memory_usage_percent');
      const systemMemPercent = systemMem?.values?.[0]?.value;
      if (typeof systemMemPercent === 'number' && !isNaN(systemMemPercent)) {
        if (systemMemPercent > alertThresholds.systemMemoryPercent) {
          alerts.push({
            type: 'system_memory',
            severity: 'warning',
            message: `High system memory usage: ${systemMemPercent.toFixed(2)}%`,
            threshold: alertThresholds.systemMemoryPercent,
            value: systemMemPercent / 100,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Check CPU usage
    const cpuUsage = metrics.find(m => m.name === 'cpu_usage_percent');
    if (cpuUsage && cpuUsage.values[0]?.value > alertThresholds.cpuUsage) {
      alerts.push({
        type: 'cpu_usage',
        severity: 'warning',
        message: `High CPU usage: ${cpuUsage.values[0].value}%`,
        threshold: alertThresholds.cpuUsage,
        value: cpuUsage.values[0].value,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check active connections
    const activeConnections = metrics.find(m => m.name === 'active_connections');
    if (activeConnections && activeConnections.values[0]?.value > alertThresholds.activeConnections) {
      alerts.push({
        type: 'active_connections',
        severity: 'warning',
        message: `High number of active connections: ${activeConnections.values[0].value}`,
        threshold: alertThresholds.activeConnections,
        value: activeConnections.values[0].value,
        timestamp: new Date().toISOString()
      });
    }
    
    // Store alerts in history with size limit
    alerts.forEach(alert => {
      alertHistory.push(alert);
      
      // Log alert (dedupe to avoid spamming the same alert every minute)
      const lastSame = [...alertHistory]
        .reverse()
        .find(a => a.type === alert.type && a.severity === alert.severity && a.message === alert.message && a !== alert);

      const shouldLog = !lastSame || (Date.now() - new Date(lastSame.timestamp).getTime()) > ALERT_DEDUP_WINDOW_MS;
      if (shouldLog) {
        logger.warn('Performance Alert', alert);
      }
      
      // Record as business event
      recordBusinessEvent('alert_triggered', 'monitoring');
    });
    
    // Clean up old alerts after adding new ones
    cleanupAlertHistory();
    
    return alerts;
  } catch (error) {
    logger.error('Error checking alerts:', error);
    return [];
  }
};

/**
 * @swagger
 * /api/alerts/alerts:
 *   get:
 *     summary: Get current alerts
 *     tags: [Monitoring]
 *     security: []
 *     responses:
 *       200:
 *         description: Current alerts
 */
// Get current alerts
router.get('/alerts', async (req, res) => {
  try {
    const currentAlerts = await checkAlerts();
    res.json({
      timestamp: new Date().toISOString(),
      currentAlerts,
      alertHistory: alertHistory.slice(-50) // Last 50 alerts
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * @swagger
 * /api/alerts/alerts/history:
 *   get:
 *     summary: Get alert history
 *     tags: [Monitoring]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *     responses:
 *       200:
 *         description: Alert history
 */
// Get alert history
router.get('/alerts/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const severity = req.query.severity;
    
    let filteredHistory = alertHistory;
    
    if (severity) {
      filteredHistory = alertHistory.filter(alert => alert.severity === severity);
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      alerts: filteredHistory.slice(-limit),
      total: filteredHistory.length
    });
  } catch (error) {
    logger.error('Error getting alert history:', error);
    res.status(500).json({ error: 'Failed to get alert history' });
  }
});

/**
 * @swagger
 * /api/alerts/alerts/thresholds:
 *   post:
 *     summary: Update alert thresholds
 *     tags: [Monitoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               thresholds:
 *                 type: object
 *     responses:
 *       200:
 *         description: Thresholds updated
 *   get:
 *     summary: Get current alert thresholds
 *     tags: [Monitoring]
 *     security: []
 *     responses:
 *       200:
 *         description: Current thresholds
 */
// Update alert thresholds
router.post('/alerts/thresholds', authorize('admin'), (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({ error: 'Invalid thresholds object' });
    }
    
    const base = getAlertThresholds();
    const nextOverrides = { ...alertThresholdOverrides };

    Object.keys(thresholds).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        nextOverrides[key] = thresholds[key];
      }
    });

    alertThresholdOverrides = nextOverrides;
    
    logger.info('Alert thresholds updated', { thresholds });
    
    res.json({
      message: 'Alert thresholds updated successfully',
      thresholds: getEffectiveAlertThresholds()
    });
  } catch (error) {
    logger.error('Error updating alert thresholds:', error);
    res.status(500).json({ error: 'Failed to update alert thresholds' });
  }
});

router.get('/alerts/thresholds', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    thresholds: getEffectiveAlertThresholds()
  });
});

// Manual alert trigger (for testing)
router.post('/alerts/trigger', authorize('admin'), (req, res) => {
  try {
    const { type, severity = 'info', message, value } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }
    
    const alert = {
      type,
      severity,
      message,
      value: value || 0,
      timestamp: new Date().toISOString(),
      manual: true
    };
    
    alertHistory.push(alert);
    logger.info('Manual alert triggered', alert);
    
    res.json({
      message: 'Alert triggered successfully',
      alert
    });
  } catch (error) {
    logger.error('Error triggering manual alert:', error);
    res.status(500).json({ error: 'Failed to trigger alert' });
  }
});

// Clear alert history
router.delete('/alerts/history', authorize('admin'), (req, res) => {
  try {
    const count = alertHistory.length;
    alertHistory = [];
    
    logger.info('Alert history cleared', { clearedCount: count });
    
    res.json({
      message: 'Alert history cleared successfully',
      clearedCount: count
    });
  } catch (error) {
    logger.error('Error clearing alert history:', error);
    res.status(500).json({ error: 'Failed to clear alert history' });
  }
});

// Start alert monitoring (runs every minute)
let alertMonitoringInterval;
let cleanupInterval;

const startAlertMonitoring = () => {
  if (process.env.ENABLE_ALERT_MONITORING === 'false') {
    return;
  }

  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  if (alertMonitoringInterval) {
    clearInterval(alertMonitoringInterval);
  }
  
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  const intervalMs = parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '60000');

  alertMonitoringInterval = setInterval(async () => {
    try {
      await checkAlerts();
    } catch (error) {
      logger.error('Error in alert monitoring:', error);
    }
  }, intervalMs); // Default: every minute
  
  // Clean up alert history every hour to prevent memory leaks
  cleanupInterval = setInterval(() => {
    try {
      cleanupAlertHistory();
    } catch (error) {
      logger.error('Error cleaning up alert history:', error);
    }
  }, 60 * 60 * 1000); // Every hour
  
  // Unref to allow Node.js to exit if only this timer is running
  if (alertMonitoringInterval.unref) {
    alertMonitoringInterval.unref();
  }
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
};

const stopAlertMonitoring = () => {
  if (alertMonitoringInterval) {
    clearInterval(alertMonitoringInterval);
    alertMonitoringInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Start monitoring when module loads
startAlertMonitoring();

module.exports = {
  router,
  startAlertMonitoring,
  stopAlertMonitoring,
  checkAlerts
};
