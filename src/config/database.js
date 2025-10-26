const mongoose = require('mongoose');
const logger = require('./logger');
const databaseOptimization = require('../services/databaseOptimizationService');
const redisCache = require('../services/redisCacheService');

const connectDB = async() => {
  try {
    // Skip database connection in test environment
    if (process.env.NODE_ENV === 'test') {
      logger.info('📊 Test environment - skipping database connection');
      return;
    }

    // Optimize connection options
    const connectionOptions = databaseOptimization.optimizeConnection({
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app',
      connectionOptions
    );

    // Set up connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info(`📊 MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📊 MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Initialize database optimization
    await initializeDatabaseOptimization();
    
    // Initialize Redis cache
    await redisCache.initialize();

    logger.info(`📊 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ Database connection error:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

/**
 * Initialize database optimization features
 */
async function initializeDatabaseOptimization() {
  try {
    // Create essential indexes
    await createEssentialIndexes();
    
    // Set up query monitoring
    setupQueryMonitoring();
    
    logger.info('✅ Database optimization initialized');
  } catch (error) {
    logger.error('❌ Database optimization initialization failed:', error);
  }
}

/**
 * Create essential database indexes
 */
async function createEssentialIndexes() {
  try {
    // User collection indexes
    await databaseOptimization.createIndexes('users', [
      { keys: { phoneNumber: 1 }, options: { unique: true } },
      { keys: { email: 1 }, options: { unique: true, sparse: true } },
      { keys: { role: 1, status: 1, isActive: 1 } },
      { keys: { 'profile.address.city': 1, 'profile.address.state': 1 } },
      { keys: { trustScore: -1, 'profile.rating': -1 } },
      { keys: { createdAt: -1 } }
    ]);

    // Services collection indexes
    await databaseOptimization.createIndexes('services', [
      { keys: { provider: 1, isActive: 1 } },
      { keys: { category: 1, 'rating.average': -1, isActive: 1 } },
      { keys: { 'pricing.basePrice': 1, category: 1 } },
      { keys: { 'serviceArea': 1, category: 1, isActive: 1 } },
      { keys: { createdAt: -1, isActive: 1 } },
      { keys: { title: 'text', description: 'text', tags: 'text' } }
    ]);

    // Bookings collection indexes
    await databaseOptimization.createIndexes('bookings', [
      { keys: { client: 1, status: 1 } },
      { keys: { provider: 1, status: 1 } },
      { keys: { bookingDate: 1, status: 1 } },
      { keys: { createdAt: -1, client: 1 } },
      { keys: { 'address.city': 1, status: 1 } }
    ]);

    // Jobs collection indexes
    await databaseOptimization.createIndexes('jobs', [
      { keys: { status: 1, isActive: 1 } },
      { keys: { category: 1, jobType: 1, status: 1, isActive: 1 } },
      { keys: { 'company.location.isRemote': 1, status: 1, isActive: 1 } },
      { keys: { 'analytics.applicationsCount': -1, status: 1 } },
      { keys: { title: 'text', description: 'text', 'company.name': 'text' } }
    ]);

    // Logs collection indexes
    await databaseOptimization.createIndexes('logs', [
      { keys: { level: 1, timestamp: -1 } },
      { keys: { category: 1, timestamp: -1 } },
      { keys: { timestamp: -1 } }
    ]);

    logger.info('✅ Essential database indexes created');
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error);
  }
}

/**
 * Set up query monitoring
 */
function setupQueryMonitoring() {
  // Monitor slow operations
  mongoose.set('debug', (collectionName, method, query, doc) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`MongoDB ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: doc ? JSON.stringify(doc) : undefined
      });
    }
  });

  // Set up slow query monitoring
  const originalExec = mongoose.Query.prototype.exec;
  mongoose.Query.prototype.exec = function() {
    const start = Date.now();
    const result = originalExec.apply(this, arguments);
    
    if (result && typeof result.then === 'function') {
      return result.then(
        (res) => {
          const duration = Date.now() - start;
          if (duration > 100) { // Log queries taking more than 100ms
            logger.warn(`Slow query detected: ${duration}ms`, {
              collection: this.model.collection.name,
              operation: this.op,
              duration
            });
          }
          return res;
        },
        (err) => {
          const duration = Date.now() - start;
          logger.error(`Query failed after ${duration}ms:`, err);
          throw err;
        }
      );
    }
    
    return result;
  };
}

module.exports = connectDB;
