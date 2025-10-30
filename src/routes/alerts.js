const express = require('express');
const router = express.Router();
const { 
  getMetricsAsJSON,
  recordError,
  recordBusinessEvent 
} = require('../middleware/metricsMiddleware');
const logger = require('../config/logger');

// Alert configuration
const alertThresholds = {
  responseTime: 5000, // 5 seconds
  errorRate: 10, // 10 errors per minute
  memoryUsage: 0.9, // 90% memory usage
  cpuUsage: 80, // 80% CPU usage
  activeConnections: 1000 // 1000 active connections
};

// Alert history storage (in production, use database)
let alertHistory = [];

// Check for alerts based on current metrics
const checkAlerts = async () => {
  try {
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
      const rssMemory = memoryUsage.values.find(v => v.labels.type === 'rss')?.value || 0;
      const heapUsed = memoryUsage.values.find(v => v.labels.type === 'heapUsed')?.value || 0;
      const heapTotal = memoryUsage.values.find(v => v.labels.type === 'heapTotal')?.value || 0;
      
      if (heapTotal > 0 && (heapUsed / heapTotal) > alertThresholds.memoryUsage) {
        alerts.push({
          type: 'memory_usage',
          severity: 'warning',
          message: `High memory usage: ${((heapUsed / heapTotal) * 100).toFixed(2)}%`,
          threshold: alertThresholds.memoryUsage,
          value: heapUsed / heapTotal,
          timestamp: new Date().toISOString()
        });
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
    
    // Store alerts in history
    alerts.forEach(alert => {
      alertHistory.push(alert);
      
      // Log alert
      logger.warn('Performance Alert', alert);
      
      // Record as business event
      recordBusinessEvent('alert_triggered', 'monitoring');
    });
    
    return alerts;
  } catch (error) {
    logger.error('Error checking alerts:', error);
    return [];
  }
};

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

// Update alert thresholds
router.post('/alerts/thresholds', (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({ error: 'Invalid thresholds object' });
    }
    
    // Update thresholds
    Object.keys(thresholds).forEach(key => {
      if (alertThresholds.hasOwnProperty(key)) {
        alertThresholds[key] = thresholds[key];
      }
    });
    
    logger.info('Alert thresholds updated', { thresholds });
    
    res.json({
      message: 'Alert thresholds updated successfully',
      thresholds: alertThresholds
    });
  } catch (error) {
    logger.error('Error updating alert thresholds:', error);
    res.status(500).json({ error: 'Failed to update alert thresholds' });
  }
});

// Get current alert thresholds
router.get('/alerts/thresholds', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    thresholds: alertThresholds
  });
});

// Manual alert trigger (for testing)
router.post('/alerts/trigger', (req, res) => {
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
router.delete('/alerts/history', (req, res) => {
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

const startAlertMonitoring = () => {
  if (alertMonitoringInterval) {
    clearInterval(alertMonitoringInterval);
  }
  
  alertMonitoringInterval = setInterval(async () => {
    try {
      await checkAlerts();
    } catch (error) {
      logger.error('Error in alert monitoring:', error);
    }
  }, 60000); // Check every minute
};

const stopAlertMonitoring = () => {
  if (alertMonitoringInterval) {
    clearInterval(alertMonitoringInterval);
    alertMonitoringInterval = null;
  }
};

// Start monitoring when module loads (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  startAlertMonitoring();
}

module.exports = {
  router,
  startAlertMonitoring,
  stopAlertMonitoring,
  checkAlerts
};
