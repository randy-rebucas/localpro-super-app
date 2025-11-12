const express = require('express');
const router = express.Router();
const { 
  getMetrics, 
  getMetricsAsJSON, 
  startSystemMetricsCollection,
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

// Comprehensive System Health Endpoint
router.get('/system-health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const AppSettings = require('../models/AppSettings');
    
    // Helper function to format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    // Check database health
    const checkDatabaseHealth = async () => {
      try {
        const state = mongoose.connection.readyState;
        const states = {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        };
        
        // Test database connection with a simple query
        let queryTest = false;
        try {
          await mongoose.connection.db.admin().ping();
          queryTest = true;
        } catch (e) {
          queryTest = false;
        }
        
        let collectionsCount = 0;
        try {
          if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            collectionsCount = collections.length;
          }
        } catch (e) {
          // Ignore error, collections count will remain 0
        }
        
        return {
          status: state === 1 && queryTest ? 'healthy' : 'unhealthy',
          state: states[state] || 'unknown',
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          queryTest: queryTest,
          collections: collectionsCount
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    };

    // Check external APIs (basic check)
    const checkExternalAPIs = async () => {
      const apis = {
        cloudinary: { status: 'unknown', response_time: null },
        paypal: { status: 'unknown', response_time: null },
        paymaya: { status: 'unknown', response_time: null }
      };
      
      // Check Cloudinary if configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        apis.cloudinary.status = 'configured';
      }
      
      // Check PayPal if configured
      if (process.env.PAYPAL_CLIENT_ID) {
        apis.paypal.status = 'configured';
      }
      
      // Check PayMaya if configured
      if (process.env.PAYMAYA_SECRET_KEY) {
        apis.paymaya.status = 'configured';
      }
      
      return apis;
    };

    // Get app settings health
    const getAppHealth = async () => {
      try {
        const appSettings = await AppSettings.getCurrentSettings();
        return {
          status: appSettings.general.maintenanceMode.enabled ? 'maintenance' : 'healthy',
          version: appSettings.general.appVersion,
          environment: appSettings.general.environment,
          maintenanceMode: appSettings.general.maintenanceMode.enabled,
          features: Object.keys(appSettings.features || {}).reduce((acc, key) => {
            acc[key] = appSettings.features[key].enabled;
            return acc;
          }, {})
        };
      } catch (error) {
        return {
          status: 'unknown',
          error: error.message
        };
      }
    };

    // Get system metrics
    const getSystemMetrics = async () => {
      try {
        const metrics = await getMetricsAsJSON();
        const httpRequests = metrics.find(m => m.name === 'http_requests_total');
        const activeConnections = metrics.find(m => m.name === 'active_connections');
        const memoryUsage = metrics.find(m => m.name === 'memory_usage_bytes');
        const cpuUsage = metrics.find(m => m.name === 'cpu_usage_percent');
        const errors = metrics.find(m => m.name === 'errors_total');
        
        return {
          httpRequests: httpRequests?.values?.reduce((sum, v) => sum + v.value, 0) || 0,
          activeConnections: activeConnections?.values?.[0]?.value || 0,
          memoryUsage: memoryUsage?.values || [],
          cpuUsage: cpuUsage?.values?.[0]?.value || 0,
          totalErrors: errors?.values?.reduce((sum, v) => sum + v.value, 0) || 0
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    };

    // Run all health checks in parallel
    const [databaseHealth, externalApis, appHealth, systemMetrics] = await Promise.all([
      checkDatabaseHealth(),
      checkExternalAPIs(),
      getAppHealth(),
      getSystemMetrics()
    ]);

    // Determine overall health status
    const isHealthy = 
      databaseHealth.status === 'healthy' &&
      appHealth.status !== 'maintenance' &&
      process.uptime() > 0;

    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const systemHealth = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealth,
        external_apis: externalApis,
        app: appHealth
      },
      system: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          unit: 'MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          unit: 'microseconds'
        },
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        arch: process.arch
      },
      metrics: systemMetrics,
      requestId: req.id
    };

    // Return 503 if critical services are down
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json({
      success: isHealthy,
      data: systemHealth
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health',
      message: error.message
    });
  }
});

module.exports = router;
