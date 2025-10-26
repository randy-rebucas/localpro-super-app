const logger = require('../config/logger');
const monitoringService = require('./monitoringService');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.isConnected = true; // Always connected for in-memory cache
    logger.info('In-memory cache initialized successfully');
  }

  async get(key) {
    if (!this.isConnected) {
      monitoringService.trackCacheMiss(key);
      return null;
    }

    try {
      if (this.cache.has(key)) {
        monitoringService.trackCacheHit(key);
        return this.cache.get(key);
      } else {
        monitoringService.trackCacheMiss(key);
        return null;
      }
    } catch (error) {
      logger.error('Cache GET error:', error);
      monitoringService.trackCacheMiss(key);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Clear existing timer if any
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Store the value
      this.cache.set(key, value);

      // Set expiration timer
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);

      this.timers.set(key, timer);
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Clear timer if exists
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // Remove from cache
      const deleted = this.cache.delete(key);
      return deleted;
    } catch (error) {
      logger.error('Cache DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error('Cache EXISTS error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();

      // Clear all cache entries
      this.cache.clear();
      return true;
    } catch (error) {
      logger.error('Cache FLUSH error:', error);
      return false;
    }
  }

  async getStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      return {
        connected: this.isConnected,
        cacheSize: this.cache.size,
        activeTimers: this.timers.size,
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      logger.error('Cache STATS error:', error);
      return null;
    }
  }

  // Cache key generators
  static generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  // Common cache keys
  static get KEYS() {
    return {
      USER: (id) => `user:${id}`,
      SERVICE: (id) => `service:${id}`,
      SERVICES_LIST: (filters) => `services:list:${JSON.stringify(filters)}`,
      JOB: (id) => `job:${id}`,
      JOBS_LIST: (filters) => `jobs:list:${JSON.stringify(filters)}`,
      USER_SETTINGS: (id) => `user_settings:${id}`,
      APP_SETTINGS: 'app_settings',
      SEARCH_RESULTS: (query) => `search:${Buffer.from(query).toString('base64')}`,
      REFERRAL_STATS: (id) => `referral_stats:${id}`,
      ANALYTICS: (type, timeframe) => `analytics:${type}:${timeframe}`
    };
  }

  // Cache middleware for Express routes
  static cacheMiddleware(ttl = 300, keyGenerator = null) {
    return async(req, res, next) => {
      const cacheService = new CacheService();

      if (!cacheService.isConnected) {
        return next();
      }

      try {
        // Generate cache key
        const cacheKey = keyGenerator
          ? keyGenerator(req)
          : CacheService.generateKey('api', req.method, req.originalUrl, JSON.stringify(req.query));

        // Try to get from cache
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
          logger.info(`Cache HIT: ${cacheKey}`);
          return res.json(cachedData);
        }

        // Cache miss - intercept response
        logger.info(`Cache MISS: ${cacheKey}`);

        const originalJson = res.json;
        res.json = function(data) {
          // Store in cache
          cacheService.set(cacheKey, data, ttl).catch(err =>
            logger.error('Cache SET error:', err)
          );

          // Send response
          originalJson.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Invalidate cache patterns
  async invalidatePattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete = [];

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        await this.del(key);
      }

      logger.info(`Invalidated ${keysToDelete.length} cache keys matching pattern: ${pattern}`);
      return true;
    } catch (error) {
      logger.error('Cache INVALIDATE error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        message: 'Cache not connected'
      };
    }

    try {
      return {
        status: 'healthy',
        message: 'In-memory cache is responding',
        cacheSize: this.cache.size,
        activeTimers: this.timers.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Cache health check failed: ${error.message}`
      };
    }
  }
}

module.exports = CacheService;
