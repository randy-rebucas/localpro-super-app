/**
 * Security Middleware
 * Implements comprehensive security headers and protections
 */

const helmet = require('helmet');
const logger = require('../config/logger');

/**
 * Security headers middleware using Helmet
 * Configured for API security best practices
 */
const securityHeaders = helmet({
  // Content Security Policy - restrict resource loading
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.paymongo.com", "https://api.xendit.co", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // HSTS - enforce HTTPS (only in production)
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,

  // Prevent MIME type sniffing
  noSniff: true,

  // XSS protection
  xssFilter: true,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Permissions policy - restrict browser features
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'self'"],
      payment: ["'self'"]
    }
  }
});

/**
 * Enhanced CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001'
    ].filter(Boolean); // Remove undefined values

    // Allow all localhost origins in development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked request from origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Client-ID',
    'X-Client-Secret',
    'X-API-Key',
    'X-Request-ID',
    'X-Correlation-ID'
  ],

  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
    'X-Correlation-ID'
  ],

  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);

  if (contentLength) {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      logger.warn('Request size limit exceeded:', {
        size: contentLength,
        maxSize,
        ip: req.ip,
        path: req.path
      });

      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE'
      });
    }
  }

  next();
};

/**
 * IP blacklist/whitelist middleware
 */
const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;

  // IP blacklist (block known malicious IPs)
  const blacklist = (process.env.IP_BLACKLIST || '').split(',').filter(ip => ip.trim());
  if (blacklist.includes(clientIP)) {
    logger.warn('Blocked request from blacklisted IP:', clientIP);
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'IP_BLOCKED'
    });
  }

  // IP whitelist for sensitive endpoints
  const whitelist = (process.env.IP_WHITELIST || '').split(',').filter(ip => ip.trim());
  if (whitelist.length > 0 && req.path.startsWith('/api/admin') && !whitelist.includes(clientIP)) {
    logger.warn('Admin access blocked from non-whitelisted IP:', {
      ip: clientIP,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      message: 'Admin access restricted',
      code: 'IP_NOT_WHITELISTED'
    });
  }

  next();
};

/**
 * API key validation for partner endpoints
 */
const validateApiKey = (req, res, next) => {
  // Skip validation for public partner endpoints
  if (req.path.startsWith('/api/partners/onboarding') ||
      req.path.startsWith('/api/partners/slug')) {
    return next();
  }

  const clientId = req.headers['x-client-id'];
  const clientSecret = req.headers['x-client-secret'];

  if (!clientId || !clientSecret) {
    return res.status(401).json({
      success: false,
      message: 'API credentials required',
      code: 'MISSING_API_CREDENTIALS'
    });
  }

  // In a real implementation, you'd validate against your partner database
  // For now, we'll just check format
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(clientId)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API credentials',
      code: 'INVALID_API_CREDENTIALS'
    });
  }

  // Add partner info to request for later use
  req.partner = { clientId };

  next();
};

/**
 * SQL injection detection middleware
 */
const sqlInjectionProtection = (req, res, next) => {
  const checkForSQLInjection = (value, field) => {
    if (typeof value !== 'string') return;

    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(-{2}|\/\*|\*\/)/g, // Comments
      /('|(\\x27)|(\\x2D))/g, // Quotes and dashes
      /(;|(\\x3B))/g, // Semicolons
      /(\\x27|\\x3B|\\x2D|\\x2F|\\x5C)/gi // Hex encoded chars
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(value)) {
        logger.warn('Potential SQL injection detected:', {
          field,
          value: value.substring(0, 100),
          ip: req.ip,
          path: req.path
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid input detected',
          code: 'MALICIOUS_INPUT'
        });
      }
    }
  };

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          checkForSQLInjection(obj[key], `body.${key}`);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key]);
        }
      });
    };
    checkObject(req.body);
  }

  // Check query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      checkForSQLInjection(req.query[key], `query.${key}`);
    });
  }

  next();
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout:', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          timeout: timeoutMs
        });

        res.status(408).json({
          success: false,
          message: 'Request timeout',
          code: 'REQUEST_TIMEOUT'
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Security audit logging middleware
 */
const securityAudit = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log security-relevant events
    if (res.statusCode >= 400) {
      logger.warn('Security event:', {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration,
        userId: req.user?.id
      });
    }

    // Log suspicious patterns
    if (req.path.includes('..') || req.path.includes('\\')) {
      logger.warn('Potential path traversal attempt:', {
        path: req.path,
        ip: req.ip
      });
    }

    // Log large payloads
    const contentLength = parseInt(req.headers['content-length'] || 0);
    if (contentLength > 1024 * 1024) { // 1MB
      logger.info('Large payload received:', {
        size: contentLength,
        path: req.path,
        ip: req.ip
      });
    }
  });

  next();
};

/**
 * Compression middleware for API responses
 */
const compression = require('compression');
const responseCompression = compression({
  level: 6,
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't want it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use default filter
    return compression.filter(req, res);
  }
});

module.exports = {
  securityHeaders,
  corsOptions,
  requestSizeLimit,
  ipFilter,
  validateApiKey,
  sqlInjectionProtection,
  requestTimeout,
  securityAudit,
  responseCompression
};
