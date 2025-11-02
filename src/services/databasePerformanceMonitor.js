const mongoose = require('mongoose');
const { recordDatabaseQuery } = require('../middleware/metricsMiddleware');
const logger = require('../config/logger');

class DatabasePerformanceMonitor {
  constructor() {
    this.queryStats = new Map();
    this.slowQueries = [];
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      queuedConnections: 0
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor database connection events
    mongoose.connection.on('connected', () => {
      logger.info('Database connected');
      this.updateConnectionStats();
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
      this.updateConnectionStats();
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Database error:', error);
      this.updateConnectionStats();
    });

    // Monitor query performance
    this.setupQueryMonitoring();
    
    // Update connection stats every 30 seconds (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      this.monitoringInterval = setInterval(() => {
        this.updateConnectionStats();
      }, 30000);
      // Unref to allow Node.js to exit if only this timer is running
      if (this.monitoringInterval.unref) {
        this.monitoringInterval.unref();
      }
    }
  }

  setupQueryMonitoring() {
    // Store reference to monitor instance
    const monitor = this;
    
    // Override mongoose query methods to track performance
    const originalExec = mongoose.Query.prototype.exec;
    // eslint-disable-next-line no-unused-vars
    const _originalFind = mongoose.Query.prototype.find;
    // eslint-disable-next-line no-unused-vars
    const _originalFindOne = mongoose.Query.prototype.findOne;
    // eslint-disable-next-line no-unused-vars
    const _originalFindOneAndUpdate = mongoose.Query.prototype.findOneAndUpdate;
    // eslint-disable-next-line no-unused-vars
    const _originalFindOneAndDelete = mongoose.Query.prototype.findOneAndDelete;
    // eslint-disable-next-line no-unused-vars
    const _originalUpdate = mongoose.Query.prototype.update;
    // eslint-disable-next-line no-unused-vars
    const _originalUpdateOne = mongoose.Query.prototype.updateOne;
    // eslint-disable-next-line no-unused-vars
    const _originalUpdateMany = mongoose.Query.prototype.updateMany;
    // eslint-disable-next-line no-unused-vars
    const _originalDeleteOne = mongoose.Query.prototype.deleteOne;
    // eslint-disable-next-line no-unused-vars
    const _originalDeleteMany = mongoose.Query.prototype.deleteMany;
    // eslint-disable-next-line no-unused-vars
    const _originalCount = mongoose.Query.prototype.count;
    // eslint-disable-next-line no-unused-vars
    const _originalCountDocuments = mongoose.Query.prototype.countDocuments;
    // eslint-disable-next-line no-unused-vars
    const _originalDistinct = mongoose.Query.prototype.distinct;
    const originalAggregate = mongoose.Aggregate.prototype.exec;

    // Wrap exec method to measure query time
    mongoose.Query.prototype.exec = function() {
      const start = Date.now();
      const collection = this.mongooseCollection?.name || 'unknown';
      const operation = this.op || 'unknown';
      
      return originalExec.apply(this, arguments).then((result) => {
        const duration = Date.now() - start;
        
        // Record metrics
        recordDatabaseQuery(operation, collection, duration);
        
        // Track slow queries (> 1 second)
        if (duration > 1000) {
          const slowQuery = {
            operation,
            collection,
            duration,
            query: this.getQuery(),
            timestamp: new Date().toISOString()
          };
          
          // Keep only last 100 slow queries
          if (monitor.slowQueries.length >= 100) {
            monitor.slowQueries.shift();
          }
          monitor.slowQueries.push(slowQuery);
          
          logger.warn('Slow database query detected', slowQuery);
        }
        
        // Update query stats
        const key = `${operation}_${collection}`;
        if (!monitor.queryStats.has(key)) {
          monitor.queryStats.set(key, {
            operation,
            collection,
            count: 0,
            totalDuration: 0,
            avgDuration: 0,
            maxDuration: 0,
            minDuration: Infinity
          });
        }
        
        const stats = monitor.queryStats.get(key);
        stats.count++;
        stats.totalDuration += duration;
        stats.avgDuration = stats.totalDuration / stats.count;
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.minDuration = Math.min(stats.minDuration, duration);
        
        return result;
      }).catch((error) => {
        const duration = Date.now() - start;
        recordDatabaseQuery(`${operation}_error`, collection, duration);
        logger.error('Database query error:', error);
        throw error;
      });
    };

    // Wrap Aggregate exec method
    mongoose.Aggregate.prototype.exec = function() {
      const start = Date.now();
      const collection = this._model?.collection?.name || 'unknown';
      
      return originalAggregate.apply(this, arguments).then((result) => {
        const duration = Date.now() - start;
        recordDatabaseQuery('aggregate', collection, duration);
        
        if (duration > 1000) {
          const slowQuery = {
            operation: 'aggregate',
            collection,
            duration,
            pipeline: this.pipeline(),
            timestamp: new Date().toISOString()
          };
          
          if (this.slowQueries.length >= 100) {
            this.slowQueries.shift();
          }
          this.slowQueries.push(slowQuery);
          
          logger.warn('Slow aggregate query detected', slowQuery);
        }
        
        return result;
      }).catch((error) => {
        const duration = Date.now() - start;
        recordDatabaseQuery('aggregate_error', collection, duration);
        logger.error('Database aggregate error:', error);
        throw error;
      });
    };
  }

  async updateConnectionStats() {
    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const admin = db.admin();
        
        try {
          const serverStatus = await admin.serverStatus();
          this.connectionStats = {
            totalConnections: serverStatus.connections?.current || 0,
            activeConnections: serverStatus.connections?.available || 0,
            queuedConnections: serverStatus.connections?.totalCreated || 0
          };
        } catch (error) {
          // Fallback to basic connection info
          this.connectionStats = {
            totalConnections: mongoose.connection.readyState === 1 ? 1 : 0,
            activeConnections: mongoose.connection.readyState === 1 ? 1 : 0,
            queuedConnections: 0
          };
        }
      } else {
        this.connectionStats = {
          totalConnections: 0,
          activeConnections: 0,
          queuedConnections: 0
        };
      }
    } catch (error) {
      logger.error('Error updating connection stats:', error);
    }
  }

  getQueryStats() {
    return Array.from(this.queryStats.values()).map(stats => ({
      ...stats,
      minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration
    }));
  }

  getSlowQueries(limit = 20) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getConnectionStats() {
    return this.connectionStats;
  }

  async getDatabaseStats() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { error: 'Database not connected' };
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        database: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        fileSize: stats.fileSize,
        connectionStats: this.connectionStats,
        queryStats: this.getQueryStats(),
        slowQueries: this.getSlowQueries(10)
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return { error: error.message };
    }
  }

  async getCollectionStats() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { error: 'Database not connected' };
      }

      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const collectionStats = await Promise.all(
        collections.map(async (collection) => {
          try {
            const stats = await db.collection(collection.name).stats();
            return {
              name: collection.name,
              count: stats.count,
              size: stats.size,
              avgObjSize: stats.avgObjSize,
              storageSize: stats.storageSize,
              totalIndexSize: stats.totalIndexSize,
              indexSizes: stats.indexSizes
            };
          } catch (error) {
            return {
              name: collection.name,
              error: error.message
            };
          }
        })
      );

      return collectionStats;
    } catch (error) {
      logger.error('Error getting collection stats:', error);
      return { error: error.message };
    }
  }

  resetStats() {
    this.queryStats.clear();
    this.slowQueries = [];
    logger.info('Database performance stats reset');
  }
}

// Create singleton instance
const dbMonitor = new DatabasePerformanceMonitor();

module.exports = dbMonitor;
