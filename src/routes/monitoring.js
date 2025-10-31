const express = require('express');
const router = express.Router();
const { 
  getMetrics, 
  getMetricsAsJSON, 
  startSystemMetricsCollection,
  stopSystemMetricsCollection,
  register 
} = require('../middleware/metricsMiddleware');
const logger = require('../config/logger');

// Start metrics collection when the module is loaded
startSystemMetricsCollection();

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// JSON metrics endpoint
router.get('/metrics/json', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics JSON:', error);
    res.status(500).json({ error: 'Failed to get metrics JSON' });
  }
});

// Health check with metrics
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const metrics = await getMetricsAsJSON();
    
    // Extract key metrics
    const httpRequests = metrics.find(m => m.name === 'http_requests_total');
    const activeConnections = metrics.find(m => m.name === 'active_connections');
    const memoryUsage = metrics.find(m => m.name === 'memory_usage_bytes');
    const cpuUsage = metrics.find(m => m.name === 'cpu_usage_percent');
    
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        state: mongoose.connection.readyState
      },
      metrics: {
        httpRequests: httpRequests?.values?.length || 0,
        activeConnections: activeConnections?.values?.[0]?.value || 0,
        memoryUsage: memoryUsage?.values || [],
        cpuUsage: cpuUsage?.values?.[0]?.value || 0
      }
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Error getting health status:', error);
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

// System information endpoint
router.get('/system', async (req, res) => {
  try {
    const systeminformation = require('systeminformation');
    
    const [cpu, memory, disk, network] = await Promise.all([
      systeminformation.cpu(),
      systeminformation.mem(),
      systeminformation.fsSize(),
      systeminformation.networkInterfaces()
    ]);
    
    res.json({
      timestamp: new Date().toISOString(),
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed
      },
      memory: {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        available: memory.available
      },
      disk: disk.map(d => ({
        fs: d.fs,
        type: d.type,
        size: d.size,
        used: d.used,
        available: d.available,
        use: d.use
      })),
      network: network.map(n => ({
        iface: n.iface,
        type: n.type,
        ip4: n.ip4,
        ip6: n.ip6
      }))
    });
  } catch (error) {
    logger.error('Error getting system information:', error);
    res.status(500).json({ error: 'Failed to get system information' });
  }
});

// Performance summary endpoint
router.get('/performance', async (req, res) => {
  try {
    const metrics = await getMetricsAsJSON();
    
    // Calculate performance summary
    const httpRequests = metrics.find(m => m.name === 'http_requests_total');
    const responseTimes = metrics.find(m => m.name === 'response_time_seconds');
    const errors = metrics.find(m => m.name === 'errors_total');
    const memoryUsage = metrics.find(m => m.name === 'memory_usage_bytes');
    
    const performance = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: httpRequests?.values?.reduce((sum, v) => sum + v.value, 0) || 0,
        averageResponseTime: responseTimes?.values?.[0]?.value || 0,
        totalErrors: errors?.values?.reduce((sum, v) => sum + v.value, 0) || 0,
        memoryUsage: {
          rss: memoryUsage?.values?.find(v => v.labels.type === 'rss')?.value || 0,
          heapUsed: memoryUsage?.values?.find(v => v.labels.type === 'heapUsed')?.value || 0,
          heapTotal: memoryUsage?.values?.find(v => v.labels.type === 'heapTotal')?.value || 0
        }
      },
      metrics: metrics
    };
    
    res.json(performance);
  } catch (error) {
    logger.error('Error getting performance summary:', error);
    res.status(500).json({ error: 'Failed to get performance summary' });
  }
});

module.exports = router;
