const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const DatabaseTransport = require('./databaseTransport');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Helpers for env-driven config
const getEnvBool = (name, defaultValue = false) => {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') return defaultValue;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return defaultValue;
};

const LOG_FILE_MAX_SIZE = process.env.LOG_FILE_MAX_SIZE || '20m';
const LOG_FILE_MAX_FILES = process.env.LOG_FILE_MAX_FILES || '14d';
const LOG_HTTP_REQUESTS = getEnvBool('LOG_HTTP_REQUESTS', true);
const DEFAULT_LOG_LEVEL =
  process.env.NODE_ENV === 'test'
    ? 'error'
    : (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'warn'));

// Define which transports the logger must use to print out messages
const transports = [
  // Console transport (silent during tests)
  new winston.transports.Console({
    silent: process.env.NODE_ENV === 'test', // Suppress console output during tests
    level: DEFAULT_LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxSize: LOG_FILE_MAX_SIZE,
    maxFiles: LOG_FILE_MAX_FILES,
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxSize: LOG_FILE_MAX_SIZE,
    maxFiles: LOG_FILE_MAX_FILES,
  }),
  
  // HTTP requests log file (optional)
  ...(LOG_HTTP_REQUESTS ? [
    new DailyRotateFile({
      filename: path.join('logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxSize: LOG_FILE_MAX_SIZE,
      // Keep HTTP logs shorter by default unless overridden
      maxFiles: process.env.LOG_HTTP_MAX_FILES || '7d',
    })
  ] : []),

  // Database transport for storing logs in MongoDB (only if enabled)
  ...(process.env.LOG_DATABASE_ENABLED !== 'false' ? [
    new DatabaseTransport({
      level: DEFAULT_LOG_LEVEL,
      batchSize: parseInt(process.env.LOG_BATCH_SIZE) || 100,
      flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL) || 5000
    })
  ] : []),
];

// Create the logger instance
const logger = winston.createLogger({
  // Keep the base logger permissive; transports control what is actually emitted.
  // This avoids unintentionally suppressing HTTP/file transports when production log level is 'warn'.
  level: process.env.NODE_ENV === 'test' ? 'error' : 'debug',
  levels,
  transports: process.env.NODE_ENV === 'test' 
    ? [
        // Silent transport during tests to prevent Winston warnings
        // while suppressing all output
        new winston.transports.Console({
          silent: true,
          level: 'error'
        })
      ]
    : transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => {
    if (!LOG_HTTP_REQUESTS) return;
    logger.http(message.trim());
  },
};

// Add request logging method
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? req.user.id : null,
    timestamp: new Date().toISOString(),
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

// Add error logging method
logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user.id : null,
    };
  }

  logger.error('Application Error', errorData);
};

// Add performance logging method
logger.logPerformance = (operation, duration, metadata = {}) => {
  const perfData = {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (duration > 1000) {
    logger.warn('Slow Operation', perfData);
  } else {
    logger.info('Performance', perfData);
  }
};

// Add business event logging method
logger.logBusinessEvent = (event, data = {}) => {
  const eventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  logger.info('Business Event', eventData);
};

// Add security event logging method
logger.logSecurityEvent = (event, data = {}) => {
  const securityData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  logger.warn('Security Event', securityData);
};

module.exports = logger;
