const logger = require('./logger');

/**
 * Environment Variable Validation Schema
 * Defines required and optional environment variables with their validation rules
 */
const ENV_SCHEMA = {
  // Core Application Settings
  NODE_ENV: {
    required: true,
    type: 'string',
    validValues: ['development', 'production', 'test'],
    description: 'Application environment (development, production, test)'
  },
  PORT: {
    required: true,
    type: 'number',
    min: 1,
    max: 65535,
    description: 'Server port number'
  },
  FRONTEND_URL: {
    required: true,
    type: 'url',
    description: 'Frontend application URL for CORS'
  },

  // Database Configuration
  MONGODB_URI: {
    required: true,
    type: 'string',
    pattern: /^mongodb(\+srv)?:\/\//,
    description: 'MongoDB connection string'
  },

  // JWT Configuration
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT secret key for token signing'
  },

  // Email Service Configuration
  EMAIL_SERVICE: {
    required: true,
    type: 'string',
    validValues: ['resend', 'sendgrid', 'smtp', 'hostinger'],
    description: 'Email service provider'
  },
  FROM_EMAIL: {
    required: true,
    type: 'email',
    description: 'Default sender email address'
  },

  // File Upload Configuration
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary cloud name'
  },
  CLOUDINARY_API_KEY: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary API key'
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary API secret'
  },

  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Google Maps API key'
  },

  // Optional but recommended configurations
  REDIS_URL: {
    required: false,
    type: 'string',
    pattern: /^redis:\/\//,
    description: 'Redis connection URL for caching and rate limiting'
  },

  // Twilio Configuration (Optional - for SMS/verification)
  TWILIO_ACCOUNT_SID: {
    required: false,
    type: 'string',
    pattern: /^AC[a-f0-9]{32}$/,
    description: 'Twilio Account SID'
  },
  TWILIO_AUTH_TOKEN: {
    required: false,
    type: 'string',
    minLength: 32,
    description: 'Twilio Auth Token'
  },
  TWILIO_VERIFY_SERVICE_SID: {
    required: false,
    type: 'string',
    pattern: /^VA[a-f0-9]{32}$/,
    description: 'Twilio Verify Service SID'
  },

  // PayPal Configuration (Optional - for payments)
  PAYPAL_CLIENT_ID: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayPal Client ID'
  },
  PAYPAL_CLIENT_SECRET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayPal Client Secret'
  },
  PAYPAL_MODE: {
    required: false,
    type: 'string',
    validValues: ['sandbox', 'live'],
    description: 'PayPal mode (sandbox or live)'
  },

  // PayMaya Configuration (Optional - for payments)
  PAYMAYA_PUBLIC_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMaya Public Key'
  },
  PAYMAYA_SECRET_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMaya Secret Key'
  },
  PAYMAYA_MODE: {
    required: false,
    type: 'string',
    validValues: ['sandbox', 'production'],
    description: 'PayMaya mode (sandbox or production)'
  },

  // Email Service Specific Configurations
  RESEND_API_KEY: {
    required: false,
    type: 'string',
    pattern: /^re_[a-zA-Z0-9_]+$/,
    description: 'Resend API key (required if EMAIL_SERVICE=resend)'
  },
  SENDGRID_API_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SendGrid API key (required if EMAIL_SERVICE=sendgrid)'
  },
  SMTP_HOST: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SMTP host (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_PORT: {
    required: false,
    type: 'number',
    min: 1,
    max: 65535,
    description: 'SMTP port (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_USER: {
    required: false,
    type: 'email',
    description: 'SMTP username (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_PASS: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SMTP password (required if EMAIL_SERVICE=smtp or hostinger)'
  }
};

/**
 * Validation functions
 */
const validators = {
  string: (value, rules) => {
    if (typeof value !== 'string') return false;
    if (rules.minLength && value.length < rules.minLength) return false;
    if (rules.maxLength && value.length > rules.maxLength) return false;
    if (rules.pattern && !rules.pattern.test(value)) return false;
    if (rules.validValues && !rules.validValues.includes(value)) return false;
    return true;
  },

  number: (value, rules) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (rules.min !== undefined && num < rules.min) return false;
    if (rules.max !== undefined && num > rules.max) return false;
    return true;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Validate a single environment variable
 */
function validateEnvVar(varName, value, rules) {
  const errors = [];

  // Check if required variable is missing
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`Required environment variable ${varName} is missing`);
    return errors;
  }

  // Skip validation for optional variables that are not set
  if (!rules.required && (!value || value.trim() === '')) {
    return errors;
  }

  // Type validation
  const validator = validators[rules.type];
  if (!validator) {
    errors.push(`Unknown validation type: ${rules.type} for ${varName}`);
    return errors;
  }

  if (!validator(value, rules)) {
    errors.push(`Invalid value for ${varName}: ${value}`);
    
    // Add specific validation hints
    if (rules.type === 'string' && rules.minLength) {
      errors.push(`  - Must be at least ${rules.minLength} characters long`);
    }
    if (rules.type === 'string' && rules.maxLength) {
      errors.push(`  - Must be at most ${rules.maxLength} characters long`);
    }
    if (rules.type === 'string' && rules.pattern) {
      errors.push(`  - Must match required pattern`);
    }
    if (rules.type === 'string' && rules.validValues) {
      errors.push(`  - Must be one of: ${rules.validValues.join(', ')}`);
    }
    if (rules.type === 'number' && rules.min !== undefined) {
      errors.push(`  - Must be at least ${rules.min}`);
    }
    if (rules.type === 'number' && rules.max !== undefined) {
      errors.push(`  - Must be at most ${rules.max}`);
    }
  }

  return errors;
}

/**
 * Validate conditional requirements based on other environment variables
 */
function validateConditionalRequirements() {
  const errors = [];
  const emailService = process.env.EMAIL_SERVICE;

  // Email service specific validations
  if (emailService === 'resend' && !process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required when EMAIL_SERVICE=resend');
  }

  if (emailService === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required when EMAIL_SERVICE=sendgrid');
  }

  if ((emailService === 'smtp' || emailService === 'hostinger')) {
    if (!process.env.SMTP_HOST) errors.push('SMTP_HOST is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_PORT) errors.push('SMTP_PORT is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_USER) errors.push('SMTP_USER is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_PASS) errors.push('SMTP_PASS is required when EMAIL_SERVICE=smtp or hostinger');
  }

  // Payment service validations
  if (process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_SECRET) {
    errors.push('PAYPAL_CLIENT_SECRET is required when PAYPAL_CLIENT_ID is set');
  }

  if (process.env.PAYPAL_CLIENT_SECRET && !process.env.PAYPAL_CLIENT_ID) {
    errors.push('PAYPAL_CLIENT_ID is required when PAYPAL_CLIENT_SECRET is set');
  }

  if (process.env.PAYMAYA_PUBLIC_KEY && !process.env.PAYMAYA_SECRET_KEY) {
    errors.push('PAYMAYA_SECRET_KEY is required when PAYMAYA_PUBLIC_KEY is set');
  }

  if (process.env.PAYMAYA_SECRET_KEY && !process.env.PAYMAYA_PUBLIC_KEY) {
    errors.push('PAYMAYA_PUBLIC_KEY is required when PAYMAYA_SECRET_KEY is set');
  }

  // Twilio validations
  if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_AUTH_TOKEN) {
    errors.push('TWILIO_AUTH_TOKEN is required when TWILIO_ACCOUNT_SID is set');
  }

  if (process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_ACCOUNT_SID) {
    errors.push('TWILIO_ACCOUNT_SID is required when TWILIO_AUTH_TOKEN is set');
  }

  return errors;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  logger.info('🔍 Starting environment variable validation...');

  // Validate each environment variable according to schema
  for (const [varName, rules] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[varName];
    const varErrors = validateEnvVar(varName, value, rules);
    errors.push(...varErrors);
  }

  // Validate conditional requirements
  const conditionalErrors = validateConditionalRequirements();
  errors.push(...conditionalErrors);

  // Check for security warnings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      warnings.push('⚠️  JWT_SECRET should be at least 64 characters long in production');
    }
    
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
      warnings.push('⚠️  Using localhost MongoDB in production is not recommended');
    }
  }

  // Log results
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach(error => logger.error(`  ${error}`));
  }

  if (warnings.length > 0) {
    logger.warn('⚠️  Environment validation warnings:');
    warnings.forEach(warning => logger.warn(`  ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('✅ All environment variables validated successfully');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment configuration summary
 */
function getEnvironmentSummary() {
  const summary = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    database: {
      configured: !!process.env.MONGODB_URI,
      type: 'MongoDB'
    },
    email: {
      service: process.env.EMAIL_SERVICE || 'not configured',
      configured: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_HOST)
    },
    fileUpload: {
      service: 'Cloudinary',
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    },
    maps: {
      service: 'Google Maps',
      configured: !!process.env.GOOGLE_MAPS_API_KEY
    },
    payments: {
      paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      paymaya: !!(process.env.PAYMAYA_PUBLIC_KEY && process.env.PAYMAYA_SECRET_KEY)
    },
    sms: {
      service: 'Twilio',
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    },
    cache: {
      service: 'Redis',
      configured: !!process.env.REDIS_URL
    }
  };

  return summary;
}

module.exports = {
  validateEnvironment,
  getEnvironmentSummary,
  ENV_SCHEMA
};

