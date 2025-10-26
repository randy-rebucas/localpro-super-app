const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../config/logger');

class RateLimitService {
  constructor() {
    this.memoryStore = new Map();
    this.timers = new Map();
    logger.info('In-memory rate limiting initialized successfully');
  }

  // Store for rate limiting (memory-based)
  getStore() {
    return {
      async increment(key, windowMs) {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up expired entries
        if (this.memoryStore.has(key)) {
          const entry = this.memoryStore.get(key);
          if (entry.timestamp < windowStart) {
            this.memoryStore.delete(key);
            if (this.timers.has(key)) {
              clearTimeout(this.timers.get(key));
              this.timers.delete(key);
            }
          }
        }

        // Get or create entry
        let entry = this.memoryStore.get(key);
        if (!entry || entry.timestamp < windowStart) {
          entry = { count: 0, timestamp: now };
          this.memoryStore.set(key, entry);

          // Set cleanup timer
          const timer = setTimeout(() => {
            this.memoryStore.delete(key);
            this.timers.delete(key);
          }, windowMs);
          this.timers.set(key, timer);
        }

        entry.count++;
        return entry.count;
      },
      async decrement(key) {
        if (this.memoryStore.has(key)) {
          const entry = this.memoryStore.get(key);
          entry.count = Math.max(0, entry.count - 1);
          return entry.count;
        }
        return 0;
      },
      async resetKey(key) {
        if (this.memoryStore.has(key)) {
          this.memoryStore.delete(key);
          if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
          }
          return true;
        }
        return false;
      }
    };
  }

  // Authentication rate limiter
  getAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60 // seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        // Use IP + user agent for more granular limiting
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        return `auth:${ip}:${Buffer.from(userAgent).toString('base64')}`;
      },
      handler: (req, res) => {
        logger.warn('Authentication rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        res.status(429).json({
          success: false,
          message: 'Too many authentication attempts, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 15 * 60
        });
      }
    });
  }

  // Verification rate limiter (stricter)
  getVerificationLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1, // 1 attempt per minute
      message: {
        success: false,
        message: 'Please wait before requesting another verification code',
        code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
        retryAfter: 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        const phoneNumber = req.body.phoneNumber || 'unknown';
        return `verification:${phoneNumber}`;
      },
      handler: (req, res) => {
        logger.warn('Verification rate limit exceeded', {
          phoneNumber: req.body.phoneNumber,
          ip: req.ip
        });
        res.status(429).json({
          success: false,
          message: 'Please wait before requesting another verification code',
          code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        });
      }
    });
  }

  // API rate limiter
  getApiLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: {
        success: false,
        message: 'Too many API requests, please try again later',
        code: 'API_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return `api:${ip}`;
      },
      handler: (req, res) => {
        logger.warn('API rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        res.status(429).json({
          success: false,
          message: 'Too many API requests, please try again later',
          code: 'API_RATE_LIMIT_EXCEEDED',
          retryAfter: 15 * 60
        });
      }
    });
  }

  // Search rate limiter
  getSearchLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      message: {
        success: false,
        message: 'Too many search requests, please slow down',
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        retryAfter: 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return `search:${ip}`;
      },
      handler: (req, res) => {
        logger.warn('Search rate limit exceeded', {
          ip: req.ip,
          query: req.query.q
        });
        res.status(429).json({
          success: false,
          message: 'Too many search requests, please slow down',
          code: 'SEARCH_RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        });
      }
    });
  }

  // Upload rate limiter
  getUploadLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 uploads per hour
      message: {
        success: false,
        message: 'Too many file uploads, please try again later',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: 60 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        const userId = req.user?.id || 'anonymous';
        return `upload:${userId}`;
      },
      handler: (req, res) => {
        logger.warn('Upload rate limit exceeded', {
          userId: req.user?.id,
          ip: req.ip
        });
        res.status(429).json({
          success: false,
          message: 'Too many file uploads, please try again later',
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          retryAfter: 60 * 60
        });
      }
    });
  }

  // Slow down middleware (gradual slowdown) - Fixed configuration
  getSlowDown() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per 15 minutes, then...
      delayMs: (used, req) => {
        const delayAfter = req.slowDown.limit;
        return (used - delayAfter) * 500;
      },
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      store: this.getStore(),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return `slowdown:${ip}`;
      }
    });
  }

  // Admin rate limiter (more lenient)
  getAdminLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // 200 requests per window
      message: {
        success: false,
        message: 'Too many admin requests, please try again later',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: (req) => {
        const userId = req.user?.id || 'anonymous';
        return `admin:${userId}`;
      }
    });
  }

  // Custom rate limiter
  createCustomLimiter(options) {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 100,
      message: options.message || {
        success: false,
        message: 'Rate limit exceeded',
        code: 'CUSTOM_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.getStore(),
      keyGenerator: options.keyGenerator || ((req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return `custom:${ip}`;
      }),
      handler: options.handler || ((req, res) => {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          code: 'CUSTOM_RATE_LIMIT_EXCEEDED'
        });
      })
    });
  }

  // Get rate limit status for a key
  async getRateLimitStatus(key) {
    try {
      const entry = this.memoryStore.get(key);
      if (!entry) {
        return {
          count: 0,
          ttl: -1,
          remaining: 100 // Assuming max 100
        };
      }

      const now = Date.now();
      const ttl = Math.max(0, Math.ceil((entry.timestamp + 900000 - now) / 1000)); // Assuming 15 min window

      return {
        count: entry.count,
        ttl: ttl,
        remaining: Math.max(0, 100 - entry.count) // Assuming max 100
      };
    } catch (error) {
      logger.error('Rate limit status error:', error);
      return null;
    }
  }

  // Reset rate limit for a key
  async resetRateLimit(key) {
    try {
      if (this.memoryStore.has(key)) {
        this.memoryStore.delete(key);
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key));
          this.timers.delete(key);
        }
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Rate limit reset error:', error);
      return false;
    }
  }
}

module.exports = new RateLimitService();
