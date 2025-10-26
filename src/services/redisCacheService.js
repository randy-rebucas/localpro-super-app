/**
 * Redis Cache Service
 * 
 * This service provides advanced caching capabilities using Redis
 * for improved database query performance and reduced load.
 */

const redis = require('redis');
const logger = require('../utils/logger');

class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      if (process.env.NODE_ENV === 'test') {
        logger.info('Redis cache disabled in test environment');
        return;
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis server connection refused - continuing without cache');
            this.isConnected = false;
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.warn('Redis max retry attempts reached - continuing without cache');
            this.isConnected = false;
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.warn('⚠️ Redis error - continuing without cache:', err.message);
        this.isConnected = false;
      });

      this.client.on('disconnect', () => {
        logger.warn('⚠️ Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Failed to initialize Redis - continuing without cache:', error.message);
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Get value from cache
   * @param {String} key - Cache key
   * @returns {Promise} Cached value or null
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Number} ttl - Time to live in seconds
   * @returns {Promise} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {String} key - Cache key
   * @returns {Promise} Success status
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {String} pattern - Key pattern
   * @returns {Promise} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        logger.debug(`Cache pattern deleted: ${pattern}, ${result} keys`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {String} key - Cache key
   * @returns {Promise} Exists status
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param {Array} keys - Array of cache keys
   * @returns {Promise} Array of values
   */
  async mget(keys) {
    if (!this.isConnected || !this.client || keys.length === 0) {
      return [];
    }

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error(`Error getting multiple cache keys:`, error);
      return [];
    }
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {Number} ttl - Time to live in seconds
   * @returns {Promise} Success status
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      }
      
      await pipeline.exec();
      logger.debug(`Cache mset: ${Object.keys(keyValuePairs).length} keys, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`Error setting multiple cache keys:`, error);
      return false;
    }
  }

  /**
   * Increment a numeric value in cache
   * @param {String} key - Cache key
   * @param {Number} increment - Increment value
   * @returns {Promise} New value
   */
  async incr(key, increment = 1) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const result = await this.client.incrBy(key, increment);
      logger.debug(`Cache incremented: ${key}, value: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set expiration for a key
   * @param {String} key - Cache key
   * @param {Number} ttl - Time to live in seconds
   * @returns {Promise} Success status
   */
  async expire(key, ttl) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      logger.debug(`Cache expiration set: ${key}, TTL: ${ttl}s`);
      return result === 1;
    } catch (error) {
      logger.error(`Error setting expiration for cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise} Cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise} Success status
   */
  async flushAll() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }

  /**
   * Generate cache key with namespace
   * @param {String} namespace - Namespace
   * @param {String} key - Key
   * @returns {String} Full cache key
   */
  static generateKey(namespace, key) {
    return `${namespace}:${key}`;
  }

  /**
   * Generate cache key for database queries
   * @param {String} model - Model name
   * @param {String} operation - Operation name
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {String} Cache key
   */
  static generateQueryKey(model, operation, filter = {}, options = {}) {
    const key = `${model}:${operation}:${JSON.stringify(filter)}:${JSON.stringify(options)}`;
    return Buffer.from(key).toString('base64');
  }
}

module.exports = new RedisCacheService();
