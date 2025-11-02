/**
 * Redis Cache Service
 * Provides caching functionality for improved performance
 */

const Redis = require('ioredis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    
    // Enable/disable caching based on environment variable
    // Default to disabled in test mode to avoid connection attempts
    this.enabled = isTest 
      ? process.env.REDIS_ENABLED === 'true' 
      : process.env.REDIS_ENABLED !== 'false';
    
    if (this.enabled && !isTest) {
      // Initialize Redis client with connection options (only in non-test mode)
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY error
          }
          return false;
        },
        maxRetriesPerRequest: 3
      };

      // If REDIS_URL is provided, use it (for cloud Redis services)
      if (process.env.REDIS_URL) {
        this.client = new Redis(process.env.REDIS_URL, redisConfig);
      } else {
        this.client = new Redis(redisConfig);
      }

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client ready');
      });

      this.client.on('close', () => {
        logger.warn('⚠️  Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });
    } else if (this.enabled && isTest) {
      // In test mode, create a mock client that doesn't connect
      // This allows tests to run without actual Redis connection
      this.client = {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
        exists: async () => 0,
        quit: async () => 'OK',
        disconnect: () => {},
        on: () => {},
        status: 'ready'
      };
    } else {
      this.client = null;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - Cached value or null
   */
  async get(key) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Cache get error:', { key, error: error.message });
      }
      return null; // Return null on error to allow fallback to database
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = 3600) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Cache set error:', { key, error: error.message });
      }
      return false; // Don't throw, just log the error
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Cache delete error:', { key, error: error.message });
      }
      return false;
    }
  }

  /**
   * Delete multiple keys
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<boolean>} - Success status
   */
  async delMultiple(keys) {
    if (!this.enabled || !keys.length) {
      return false;
    }

    try {
      await this.client.del(...keys);
      return true;
    } catch (error) {
      logger.error('Cache delete multiple error:', { keys, error: error.message });
      return false;
    }
  }

  /**
   * Flush all cache (use with caution)
   * @returns {Promise<boolean>} - Success status
   */
  async flush() {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.client.flushdb();
      logger.warn('⚠️  Redis cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Exists status
   */
  async exists(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Cache exists error:', { key, error: error.message });
      }
      return false;
    }
  }

  /**
   * Get cache key with prefix
   * @param {string} prefix - Key prefix
   * @param {string} identifier - Identifier
   * @returns {string} - Full cache key
   */
  getKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  /**
   * Generate cache keys for common entities
   */
  userKey(userId) {
    return this.getKey('user', userId);
  }

  servicesKey(filters) {
    const filterStr = JSON.stringify(filters || {});
    return this.getKey('services', Buffer.from(filterStr).toString('base64'));
  }

  searchKey(query, filters) {
    const combined = JSON.stringify({ query, filters });
    return this.getKey('search', Buffer.from(combined).toString('base64'));
  }

  courseKey(courseId) {
    return this.getKey('course', courseId);
  }

  jobKey(jobId) {
    return this.getKey('job', jobId);
  }

  /**
   * Invalidate user-related cache
   * @param {string} userId - User ID
   */
  async invalidateUser(userId) {
    const keys = [
      this.userKey(userId),
      this.getKey('user_settings', userId),
      this.getKey('user_provider', userId)
    ];
    await this.delMultiple(keys);
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache stats
   */
  async getStats() {
    if (!this.enabled || !this.client) {
      return { enabled: false };
    }

    try {
      // In test mode with mock client, return mock stats
      if (process.env.NODE_ENV === 'test' && this.client.status === 'ready') {
        return {
          enabled: true,
          connected: true,
          info: 'mock',
          keyspace: 'mock'
        };
      }
      
      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');
      
      return {
        enabled: true,
        connected: this.client.status === 'ready',
        info: info,
        keyspace: keyspace
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Cache stats error:', error);
      }
      return { enabled: true, connected: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (!this.client) {
      return;
    }
    
    try {
      await this.client.quit();
      if (process.env.NODE_ENV !== 'test') {
        logger.info('✅ Redis connection closed');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
}

// Export singleton instance
module.exports = new CacheService();

