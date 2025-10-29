const express = require('express');
const router = express.Router();
const dbMonitor = require('../services/databasePerformanceMonitor');
const logger = require('../config/logger');

// Get database performance stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await dbMonitor.getDatabaseStats();
    res.json({
      timestamp: new Date().toISOString(),
      ...stats
    });
  } catch (error) {
    logger.error('Error getting database stats:', error);
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// Get collection stats
router.get('/collections', async (req, res) => {
  try {
    const stats = await dbMonitor.getCollectionStats();
    res.json({
      timestamp: new Date().toISOString(),
      collections: stats
    });
  } catch (error) {
    logger.error('Error getting collection stats:', error);
    res.status(500).json({ error: 'Failed to get collection stats' });
  }
});

// Get query performance stats
router.get('/queries', (req, res) => {
  try {
    const queryStats = dbMonitor.getQueryStats();
    const slowQueries = dbMonitor.getSlowQueries(parseInt(req.query.limit) || 20);
    
    res.json({
      timestamp: new Date().toISOString(),
      queryStats,
      slowQueries,
      summary: {
        totalQueries: queryStats.reduce((sum, q) => sum + q.count, 0),
        avgResponseTime: queryStats.reduce((sum, q) => sum + q.avgDuration, 0) / queryStats.length || 0,
        slowQueriesCount: slowQueries.length
      }
    });
  } catch (error) {
    logger.error('Error getting query stats:', error);
    res.status(500).json({ error: 'Failed to get query stats' });
  }
});

// Get connection stats
router.get('/connections', (req, res) => {
  try {
    const connectionStats = dbMonitor.getConnectionStats();
    res.json({
      timestamp: new Date().toISOString(),
      connections: connectionStats
    });
  } catch (error) {
    logger.error('Error getting connection stats:', error);
    res.status(500).json({ error: 'Failed to get connection stats' });
  }
});

// Reset performance stats
router.post('/reset', (req, res) => {
  try {
    dbMonitor.resetStats();
    res.json({
      message: 'Database performance stats reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error resetting stats:', error);
    res.status(500).json({ error: 'Failed to reset stats' });
  }
});

// Get slow queries
router.get('/slow-queries', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const slowQueries = dbMonitor.getSlowQueries(limit);
    
    res.json({
      timestamp: new Date().toISOString(),
      slowQueries,
      count: slowQueries.length
    });
  } catch (error) {
    logger.error('Error getting slow queries:', error);
    res.status(500).json({ error: 'Failed to get slow queries' });
  }
});

// Database health check
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionStats = dbMonitor.getConnectionStats();
    
    const health = {
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      stats: connectionStats,
      uptime: process.uptime()
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Error getting database health:', error);
    res.status(500).json({ error: 'Failed to get database health' });
  }
});

module.exports = router;
