const xss = require('xss');
const validator = require('validator');
const logger = require('../config/logger');

class SanitizationService {
  constructor() {
    // XSS options
    this.xssOptions = {
      whiteList: {
        // Allow certain HTML tags for rich content
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
        ul: [],
        ol: [],
        li: [],
        blockquote: [],
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        div: ['class'],
        span: ['class'],
        code: [],
        pre: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
      css: false,
      allowList: {
        // Allow certain CSS properties
        '*': ['class', 'id', 'style']
      }
    };
  }

  // Sanitize string input
  sanitizeString(input, options = {}) {
    if (!input || typeof input !== 'string') {
      return input;
    }

    try {
      // Trim whitespace
      let sanitized = input.trim();

      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');

      // XSS protection
      if (options.allowHtml) {
        sanitized = xss(sanitized, this.xssOptions);
      } else {
        // Escape HTML if not allowing HTML
        sanitized = xss(sanitized, {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style']
        });
      }

      // Additional validation based on type
      if (options.type === 'email') {
        sanitized = validator.normalizeEmail(sanitized) || sanitized;
      } else if (options.type === 'url') {
        sanitized = validator.escape(sanitized);
      } else if (options.type === 'phone') {
        // Keep only digits, +, -, (, ), and spaces
        sanitized = sanitized.replace(/[^\d+\-() ]/g, '');
      }

      return sanitized;
    } catch (error) {
      logger.error('String sanitization error:', error);
      return input; // Return original if sanitization fails
    }
  }

  // Sanitize object recursively
  sanitizeObject(obj, options = {}) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive fields
      if (options.skipFields && options.skipFields.includes(key)) {
        sanitized[key] = value;
        continue;
      }

      if (typeof value === 'string') {
        // Apply field-specific sanitization
        const fieldOptions = this.getFieldOptions(key, options);
        sanitized[key] = this.sanitizeString(value, fieldOptions);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, options);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Get field-specific sanitization options
  getFieldOptions(fieldName, globalOptions = {}) {
    const fieldMappings = {
      // Email fields
      email: { type: 'email' },
      'contact.email': { type: 'email' },
      'profile.email': { type: 'email' },
      'company.email': { type: 'email' },

      // Phone fields
      phoneNumber: { type: 'phone' },
      phone: { type: 'phone' },
      'contact.phone': { type: 'phone' },
      'profile.phone': { type: 'phone' },
      'company.phone': { type: 'phone' },

      // URL fields
      website: { type: 'url' },
      url: { type: 'url' },
      'company.website': { type: 'url' },
      'profile.website': { type: 'url' },

      // HTML content fields
      description: { allowHtml: true },
      bio: { allowHtml: true },
      content: { allowHtml: true },
      message: { allowHtml: true },
      'profile.bio': { allowHtml: true },
      'company.description': { allowHtml: true },

      // Name fields
      firstName: {},
      lastName: {},
      name: {},
      title: {},
      'profile.firstName': {},
      'profile.lastName': {},
      'company.name': {},

      // Address fields
      address: {},
      street: {},
      city: {},
      state: {},
      country: {},
      zipCode: {},
      'profile.address.street': {},
      'profile.address.city': {},
      'profile.address.state': {},
      'profile.address.country': {},
      'profile.address.zipCode': {},
      'company.location.street': {},
      'company.location.city': {},
      'company.location.state': {},
      'company.location.country': {},
      'company.location.zipCode': {}
    };

    return fieldMappings[fieldName] || globalOptions;
  }

  // Validate and sanitize email
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, sanitized: null };
    }

    const sanitized = this.sanitizeString(email, { type: 'email' });
    const isValid = validator.isEmail(sanitized);

    return { isValid, sanitized: isValid ? sanitized : null };
  }

  // Validate and sanitize phone number
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, sanitized: null };
    }

    const sanitized = this.sanitizeString(phone, { type: 'phone' });
    const isValid = validator.isMobilePhone(sanitized, 'any', { strictMode: false });

    return { isValid, sanitized: isValid ? sanitized : null };
  }

  // Validate and sanitize URL
  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, sanitized: null };
    }

    const sanitized = this.sanitizeString(url, { type: 'url' });
    const isValid = validator.isURL(sanitized, {
      protocols: ['http', 'https'],
      require_protocol: true
    });

    return { isValid, sanitized: isValid ? sanitized : null };
  }

  // Validate MongoDB ObjectId
  validateObjectId(id) {
    if (!id || typeof id !== 'string') {
      return { isValid: false, sanitized: null };
    }

    const sanitized = validator.escape(id.trim());
    const isValid = validator.isMongoId(sanitized);

    return { isValid, sanitized: isValid ? sanitized : null };
  }

  // Sanitize file upload data
  sanitizeFileUpload(file) {
    if (!file || typeof file !== 'object') {
      return null;
    }

    return {
      originalname: this.sanitizeString(file.originalname || ''),
      mimetype: this.sanitizeString(file.mimetype || ''),
      size: typeof file.size === 'number' ? file.size : 0,
      fieldname: this.sanitizeString(file.fieldname || ''),
      encoding: this.sanitizeString(file.encoding || ''),
      destination: this.sanitizeString(file.destination || ''),
      filename: this.sanitizeString(file.filename || ''),
      path: this.sanitizeString(file.path || ''),
      buffer: file.buffer // Don't sanitize binary data
    };
  }

  // Sanitize search query
  sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove special characters that could be used for injection
    let sanitized = query.trim();

    // Remove MongoDB query operators
    sanitized = sanitized.replace(/[$]/g, '');

    // Remove potential regex patterns
    sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '');

    // Limit length
    sanitized = sanitized.substring(0, 100);

    return sanitized;
  }

  // Sanitize pagination parameters
  sanitizePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  // Sanitize sort parameters
  sanitizeSort(sort) {
    if (!sort || typeof sort !== 'string') {
      return { createdAt: -1 }; // Default sort
    }

    const sortObj = {};
    const sortFields = sort.split(',');

    for (const field of sortFields) {
      const trimmed = field.trim();
      if (trimmed.startsWith('-')) {
        const fieldName = this.sanitizeString(trimmed.substring(1));
        if (fieldName) {
          sortObj[fieldName] = -1;
        }
      } else {
        const fieldName = this.sanitizeString(trimmed);
        if (fieldName) {
          sortObj[fieldName] = 1;
        }
      }
    }

    return Object.keys(sortObj).length > 0 ? sortObj : { createdAt: -1 };
  }

  // Sanitize filter parameters
  sanitizeFilters(filters) {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(filters)) {
      const sanitizedKey = this.sanitizeString(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  // Express middleware for request sanitization
  static sanitizeRequest(options = {}) {
    return (req, res, next) => {
      try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
          req.body = new SanitizationService().sanitizeObject(req.body, {
            skipFields: options.skipFields || ['password', 'token', 'secret']
          });
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = new SanitizationService().sanitizeObject(req.query);
        }

        // Sanitize params
        if (req.params && typeof req.params === 'object') {
          req.params = new SanitizationService().sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        logger.error('Request sanitization error:', error);
        next();
      }
    };
  }
}

module.exports = SanitizationService;
