/**
 * Input Sanitization Middleware
 * Protects against XSS, injection attacks, and malicious input
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');
const logger = require('../config/logger');

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') return input;

  let sanitized = input.trim();

  // Remove null bytes and control characters
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127; // Keep printable characters only
  }).join('');

  // Remove potential script tags and dangerous HTML
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: options.allowHtml ? ['p', 'br', 'strong', 'em', 'u'] : [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  });

  // Escape HTML entities if not allowing HTML
  if (!options.allowHtml) {
    sanitized = validator.escape(sanitized);
  }

  // Remove potential SQL injection patterns
  sanitized = sanitized.replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '');

  // Remove potential NoSQL injection patterns
  sanitized = sanitized.replace(/[$][a-zA-Z_][a-zA-Z0-9_]*/g, '');

  // Normalize whitespace
  if (options.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize and validate
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;

  const sanitized = email.trim().toLowerCase();

  // Basic email validation
  if (!validator.isEmail(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
};

/**
 * Sanitize phone number input
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;

  // Remove all non-digit characters except +, -, (, ), space
  let sanitized = phone.replace(/[^\d+\-()\s]/g, '');

  // Normalize format - keep only digits and +
  sanitized = sanitized.replace(/[\s\-()]/g, '');

  // Basic validation for international format
  if (!/^(\+)?[1-9]\d{1,14}$/.test(sanitized.replace(/[\s\-()]/g, ''))) {
    throw new Error('Invalid phone number format');
  }

  return sanitized;
};

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return url;

  const sanitized = url.trim();

  if (!validator.isURL(sanitized, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    throw new Error('Invalid URL format');
  }

  return sanitized;
};

/**
 * Sanitize MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {string} - Validated ObjectId
 */
const sanitizeObjectId = (id) => {
  if (typeof id !== 'string') return id;

  const sanitized = id.trim();

  if (!/^[a-fA-F0-9]{24}$/.test(sanitized)) {
    throw new Error('Invalid ObjectId format');
  }

  return sanitized;
};

/**
 * Deep sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @param {Object} schema - Sanitization schema
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, schema = {}) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  Object.keys(schema).forEach(key => {
    if (sanitized[key] !== undefined) {
      const sanitizer = schema[key];
      try {
        if (typeof sanitizer === 'function') {
          sanitized[key] = sanitizer(sanitized[key]);
        } else if (typeof sanitizer === 'object') {
          sanitized[key] = sanitizeString(sanitized[key], sanitizer);
        }
      } catch (error) {
        logger.warn(`Sanitization failed for field ${key}:`, error.message);
        // Remove invalid field instead of throwing
        delete sanitized[key];
      }
    }
  });

  return sanitized;
};

/**
 * Main input sanitization middleware
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware
 */
const inputSanitization = (options = {}) => {
  return (req, res, next) => {
    try {
      const originalBody = req.body;
      let sanitizedBody = { ...originalBody };

      // Default sanitization schema
      const defaultSchema = {
        // Common string fields
        name: { maxLength: 100 },
        firstName: { maxLength: 50 },
        lastName: { maxLength: 50 },
        description: { maxLength: 1000, allowHtml: false },
        bio: { maxLength: 500, allowHtml: false },
        title: { maxLength: 200 },
        message: { maxLength: 2000, allowHtml: false },
        comment: { maxLength: 1000, allowHtml: false },
        notes: { maxLength: 2000, allowHtml: false },

        // Contact fields
        email: sanitizeEmail,
        phoneNumber: sanitizePhone,
        website: sanitizeUrl,

        // IDs
        userId: sanitizeObjectId,
        providerId: sanitizeObjectId,
        bookingId: sanitizeObjectId,
        escrowId: sanitizeObjectId,

        // Special fields
        password: { maxLength: 128 }, // Don't sanitize passwords, just limit length
        search: { maxLength: 100, normalizeWhitespace: true }
      };

      // Merge with custom schema if provided
      const sanitizationSchema = { ...defaultSchema, ...(options.schema || {}) };

      // Apply sanitization
      sanitizedBody = sanitizeObject(sanitizedBody, sanitizationSchema);

      // Sanitize nested objects
      Object.keys(sanitizedBody).forEach(key => {
        const value = sanitizedBody[key];

        // Sanitize arrays of objects
        if (Array.isArray(value)) {
          sanitizedBody[key] = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              return sanitizeObject(item, sanitizationSchema);
            }
            return typeof item === 'string' ? sanitizeString(item) : item;
          });
        }

        // Sanitize nested objects
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (key === 'businessInfo' || key === 'professionalInfo' || key === 'verification') {
            // Special handling for nested business/professional info
            Object.keys(value).forEach(nestedKey => {
              if (typeof value[nestedKey] === 'string') {
                value[nestedKey] = sanitizeString(value[nestedKey], { maxLength: 500 });
              }
            });
          } else {
            sanitizedBody[key] = sanitizeObject(value, sanitizationSchema);
          }
        }
      });

      // Log sanitization changes in development
      if (process.env.NODE_ENV === 'development') {
        const changes = detectChanges(originalBody, sanitizedBody);
        if (changes.length > 0) {
          logger.debug('Input sanitized:', {
            path: req.path,
            method: req.method,
            changes: changes.slice(0, 5) // Limit log size
          });
        }
      }

      // Replace request body with sanitized version
      req.body = sanitizedBody;

      // Sanitize query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = sanitizeString(req.query[key], { maxLength: 100 });
          }
        });
      }

      // Sanitize route parameters
      if (req.params) {
        Object.keys(req.params).forEach(key => {
          if (typeof req.params[key] === 'string') {
            req.params[key] = sanitizeString(req.params[key], { maxLength: 100 });
          }
        });
      }

      next();

    } catch (error) {
      logger.error('Input sanitization error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        code: 'INVALID_INPUT',
        details: error.message
      });
    }
  };
};

/**
 * Detect changes between original and sanitized objects
 * @param {Object} original - Original object
 * @param {Object} sanitized - Sanitized object
 * @returns {Array} - Array of changes
 */
const detectChanges = (original, sanitized) => {
  const changes = [];

  const compareObjects = (orig, san, path = '') => {
    Object.keys(orig).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in san)) {
        changes.push({ field: currentPath, change: 'removed' });
      } else if (typeof orig[key] !== typeof san[key]) {
        changes.push({ field: currentPath, change: 'type_changed' });
      } else if (typeof orig[key] === 'string' && orig[key] !== san[key]) {
        changes.push({
          field: currentPath,
          change: 'sanitized',
          original: orig[key].substring(0, 50),
          sanitized: san[key].substring(0, 50)
        });
      } else if (typeof orig[key] === 'object' && orig[key] !== null) {
        compareObjects(orig[key], san[key], currentPath);
      }
    });
  };

  compareObjects(original, sanitized);
  return changes;
};

/**
 * Specialized sanitization for file uploads
 */
const sanitizeFileUpload = (req, res, next) => {
  if (!req.file && !req.files) return next();

  const files = req.files || [req.file];

      files.forEach((file) => {
    // Sanitize filename
    if (file.originalname) {
      file.originalname = sanitizeString(file.originalname, {
        maxLength: 100,
        normalizeWhitespace: true
      });
    }

    // Validate file type and size (additional check beyond multer)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File type ${file.mimetype} not allowed`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds limit',
        code: 'FILE_TOO_LARGE'
      });
    }
  });

  next();
};

module.exports = {
  inputSanitization,
  sanitizeFileUpload,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObjectId,
  sanitizeObject
};
