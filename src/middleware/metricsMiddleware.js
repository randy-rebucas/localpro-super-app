const promClient = require('prom-client');
const systeminformation = require('systeminformation');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'localpro-super-app',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state']
});

const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const systemMemoryUsagePercent = new promClient.Gauge({
  name: 'system_memory_usage_percent',
  help: 'System memory usage percentage'
});

const cpuUsage = new promClient.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

const diskUsage = new promClient.Gauge({
  name: 'disk_usage_bytes',
  help: 'Disk usage in bytes',
  labelNames: ['type']
});

const errorRate = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity']
});

const businessMetrics = new promClient.Counter({
  name: 'business_events_total',
  help: 'Total number of business events',
  labelNames: ['event_type', 'module']
});

const responseTime = new promClient.Summary({
  name: 'response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['endpoint']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(databaseConnections);
register.registerMetric(memoryUsage);
register.registerMetric(systemMemoryUsagePercent);
register.registerMetric(cpuUsage);
register.registerMetric(diskUsage);
register.registerMetric(errorRate);
register.registerMetric(businessMetrics);
register.registerMetric(responseTime);

// System metrics collection
let systemMetricsInterval;

const collectSystemMetrics = async () => {
  try {
    // Memory usage
    const memUsage = process.memoryUsage();
    if (memUsage.rss !== undefined) memoryUsage.set({ type: 'rss' }, memUsage.rss);
    if (memUsage.heapTotal !== undefined) memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    if (memUsage.heapUsed !== undefined) memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    if (memUsage.external !== undefined) memoryUsage.set({ type: 'external' }, memUsage.external);

    // System memory usage (host-level)
    try {
      const memInfo = await systeminformation.mem();
      // memInfo.active / memInfo.total is usually the best signal; fall back to used/total
      const used = typeof memInfo.active === 'number' ? memInfo.active : memInfo.used;
      if (memInfo && typeof used === 'number' && typeof memInfo.total === 'number' && memInfo.total > 0) {
        const percent = (used / memInfo.total) * 100;
        if (!isNaN(percent)) {
          systemMemoryUsagePercent.set(percent);
        }
      }
    } catch (memError) {
      console.warn('Error collecting memory metrics:', memError.message);
    }

    // CPU usage
    try {
      const cpuInfo = await systeminformation.currentLoad();
      if (cpuInfo && typeof cpuInfo.currentload === 'number' && !isNaN(cpuInfo.currentload)) {
        cpuUsage.set(cpuInfo.currentload);
      }
    } catch (cpuError) {
      console.warn('Error collecting CPU metrics:', cpuError.message);
    }

    // Disk usage
    try {
      const diskInfo = await systeminformation.fsSize();
      if (diskInfo && Array.isArray(diskInfo) && diskInfo.length > 0) {
        const rootDisk = diskInfo.find(disk => disk.mount === '/') || diskInfo[0];
        if (rootDisk && typeof rootDisk.used === 'number' && !isNaN(rootDisk.used)) {
          diskUsage.set({ type: 'used' }, rootDisk.used);
        }
        if (rootDisk && typeof rootDisk.available === 'number' && !isNaN(rootDisk.available)) {
          diskUsage.set({ type: 'available' }, rootDisk.available);
        }
      }
    } catch (diskError) {
      console.warn('Error collecting disk metrics:', diskError.message);
    }

    // Database connections
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const dbStats = await mongoose.connection.db.stats();
        const connectionCount = dbStats.connections?.current || 0;
        if (typeof connectionCount === 'number' && !isNaN(connectionCount)) {
          databaseConnections.set({ state: 'active' }, connectionCount);
        }
      }
    } catch (dbError) {
      console.warn('Error collecting database metrics:', dbError.message);
    }
  } catch (error) {
    console.error('Error collecting system metrics:', error);
  }
};

// Start system metrics collection
const startSystemMetricsCollection = () => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
  }
  
  // Collect immediately
  collectSystemMetrics();
  
  // Then collect every 30 seconds
  systemMetricsInterval = setInterval(collectSystemMetrics, 30000);
  
  // Unref to allow Node.js to exit if only this timer is running
  if (systemMetricsInterval.unref) {
    systemMetricsInterval.unref();
  }
};

// Stop system metrics collection
const stopSystemMetricsCollection = () => {
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
    systemMetricsInterval = null;
  }
};

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    responseTime
      .labels(route)
      .observe(duration);
    
    // Decrease active connections
    activeConnections.dec();
  });
  
  next();
};

// Helper functions for manual metric recording
const recordDatabaseQuery = (operation, collection, duration) => {
  databaseQueryDuration
    .labels(operation, collection)
    .observe(duration / 1000);
};

const recordError = (type, severity = 'error') => {
  errorRate.labels(type, severity).inc();
};

const recordBusinessEvent = (eventType, module) => {
  businessMetrics.labels(eventType, module).inc();
};

// Get metrics in Prometheus format
const getMetrics = async () => {
  return register.metrics();
};

// Get metrics as JSON
const getMetricsAsJSON = async () => {
  return register.getMetricsAsJSON();
};

module.exports = {
  register,
  metricsMiddleware,
  recordDatabaseQuery,
  recordError,
  recordBusinessEvent,
  getMetrics,
  getMetricsAsJSON,
  startSystemMetricsCollection,
  stopSystemMetricsCollection,
  // Export individual metrics for direct access
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseQueryDuration,
  databaseConnections,
  memoryUsage,
  cpuUsage,
  diskUsage,
  errorRate,
  businessMetrics,
  responseTime
};
