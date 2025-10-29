const express = require('express');
const router = express.Router();
const { getMetricsAsJSON } = require('../middleware/metricsMiddleware');
const dbMonitor = require('../services/databasePerformanceMonitor');
const logger = require('../config/logger');

// Store active connections for Server-Sent Events
const activeConnections = new Set();

// Broadcast metrics to all connected clients
const broadcastMetrics = async () => {
  if (activeConnections.size === 0) return;

  try {
    const metrics = await getMetricsAsJSON();
    const dbStats = await dbMonitor.getDatabaseStats();
    const connectionStats = dbMonitor.getConnectionStats();
    
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      database: {
        stats: dbStats,
        connections: connectionStats
      }
    };

    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    // Send to all connected clients
    activeConnections.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        logger.error('Error sending metrics to client:', error);
        activeConnections.delete(client);
      }
    });
  } catch (error) {
    logger.error('Error broadcasting metrics:', error);
  }
};

// Start broadcasting metrics every 5 seconds
let broadcastInterval = setInterval(broadcastMetrics, 5000);

// Metrics streaming endpoint
router.get('/stream', (req, res) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Connected to metrics stream'
  })}\n\n`);

  // Add client to active connections
  activeConnections.add(res);

  // Handle client disconnect
  req.on('close', () => {
    activeConnections.delete(res);
    logger.info('Client disconnected from metrics stream');
  });

  req.on('error', (error) => {
    logger.error('Error in metrics stream:', error);
    activeConnections.delete(res);
  });

  logger.info('Client connected to metrics stream');
});

// Real-time alerts streaming
router.get('/alerts/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Connected to alerts stream'
  })}\n\n`);

  // Store alert client
  const alertClients = new Set();
  alertClients.add(res);

  req.on('close', () => {
    alertClients.delete(res);
  });

  req.on('error', (error) => {
    logger.error('Error in alerts stream:', error);
    alertClients.delete(res);
  });

  // Export function to broadcast alerts
  res.broadcastAlert = (alert) => {
    const message = `data: ${JSON.stringify({
      type: 'alert',
      timestamp: new Date().toISOString(),
      alert
    })}\n\n`;
    
    try {
      res.write(message);
    } catch (error) {
      logger.error('Error sending alert to client:', error);
      alertClients.delete(res);
    }
  };

  logger.info('Client connected to alerts stream');
});

// WebSocket-like endpoint for bidirectional communication
router.get('/ws', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const clientId = Math.random().toString(36).substr(2, 9);
  
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: new Date().toISOString(),
    message: 'Connected to WebSocket-like stream'
  })}\n\n`);

  // Store client with ID
  const wsClients = new Map();
  wsClients.set(clientId, res);

  req.on('close', () => {
    wsClients.delete(clientId);
  });

  req.on('error', (error) => {
    logger.error('Error in WebSocket stream:', error);
    wsClients.delete(clientId);
  });

  logger.info(`Client ${clientId} connected to WebSocket stream`);
});

// Get current active connections count
router.get('/connections/count', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size,
    status: 'streaming'
  });
});

// Manual metrics broadcast (for testing)
router.post('/broadcast', async (req, res) => {
  try {
    await broadcastMetrics();
    res.json({
      message: 'Metrics broadcasted successfully',
      timestamp: new Date().toISOString(),
      activeConnections: activeConnections.size
    });
  } catch (error) {
    logger.error('Error broadcasting metrics:', error);
    res.status(500).json({ error: 'Failed to broadcast metrics' });
  }
});

// Stop broadcasting (for maintenance)
router.post('/stop', (req, res) => {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  
  res.json({
    message: 'Metrics broadcasting stopped',
    timestamp: new Date().toISOString()
  });
});

// Start broadcasting (resume)
router.post('/start', (req, res) => {
  if (!broadcastInterval) {
    broadcastInterval = setInterval(broadcastMetrics, 5000);
  }
  
  res.json({
    message: 'Metrics broadcasting started',
    timestamp: new Date().toISOString()
  });
});

// Cleanup function
const cleanup = () => {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }
  activeConnections.clear();
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  router,
  broadcastMetrics,
  cleanup
};
