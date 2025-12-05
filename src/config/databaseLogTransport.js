/**
 * Custom Winston Transport for logging to MongoDB
 * 
 * This transport allows Winston logs to be stored in the MongoDB database
 * for centralized log management and analysis.
 */

const Transport = require('winston-transport');
const { v4: uuidv4 } = require('uuid');

class MongoDBTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    
    this.name = 'mongodb';
    this.level = opts.level || 'info';
    this.collection = opts.collection || 'logs';
    this.leaveConnectionOpen = opts.leaveConnectionOpen !== false;
    this.capped = opts.capped || false;
    this.cappedMax = opts.cappedMax || 100000;
    this.storeHost = opts.storeHost !== false;
    this.decolorize = opts.decolorize !== false;
    this.metaKey = opts.metaKey || 'metadata';
    this.expireAfterSeconds = opts.expireAfterSeconds || null;
    
    // Queue for logs before DB is ready
    this.logQueue = [];
    this.isReady = false;
    this.Log = null;
    
    // Initialize connection
    this.initializeConnection();
  }

  /**
   * Initialize MongoDB connection and model
   */
  async initializeConnection() {
    try {
      // Wait for mongoose connection to be ready
      const mongoose = require('mongoose');
      
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        this.setupModel();
      } else {
        // Wait for connection
        mongoose.connection.once('connected', () => {
          this.setupModel();
        });
      }
    } catch (error) {
      console.error('Failed to initialize MongoDB transport:', error);
    }
  }

  /**
   * Setup the Log model
   */
  setupModel() {
    try {
      const Log = require('../models/Log');
      this.Log = Log;
      this.isReady = true;
      
      // Process queued logs
      this.processQueue();
    } catch (error) {
      console.error('Failed to setup Log model:', error);
    }
  }

  /**
   * Process queued logs
   */
  async processQueue() {
    if (this.logQueue.length > 0) {
      const queue = [...this.logQueue];
      this.logQueue = [];
      
      for (const logEntry of queue) {
        await this.saveLog(logEntry);
      }
    }
  }

  /**
   * Parse and extract metadata from log info
   * @param {Object} info - Log info object
   * @returns {Object} - Parsed log data
   */
  parseLogInfo(info) {
    const {
      level,
      message,
      timestamp,
      ...metadata
    } = info;

    // Extract request/response data if present
    let request = null;
    let response = null;
    let error = null;

    if (metadata.request || metadata.req) {
      const req = metadata.request || metadata.req;
      request = {
        method: req.method,
        url: req.url || req.originalUrl,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
        userId: req.userId || req.user?.id
      };
      delete metadata.request;
      delete metadata.req;
    }

    if (metadata.response || metadata.res) {
      const res = metadata.response || metadata.res;
      response = {
        statusCode: res.statusCode,
        responseTime: res.responseTime,
        success: res.statusCode >= 200 && res.statusCode < 300
      };
      delete metadata.response;
      delete metadata.res;
    }

    if (metadata.error || metadata.err) {
      const err = metadata.error || metadata.err;
      error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode
      };
      delete metadata.error;
      delete metadata.err;
    }

    // Determine category
    let category = 'application';
    if (error) {
      category = 'error';
    } else if (request) {
      category = 'http';
    } else if (metadata.category) {
      category = metadata.category;
      delete metadata.category;
    }

    // Determine source
    let source = 'winston';
    if (metadata.source) {
      source = metadata.source;
      delete metadata.source;
    }

    return {
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      category,
      source,
      request,
      response,
      error,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };
  }

  /**
   * Sanitize headers to remove sensitive data
   * @param {Object} headers - Request headers
   * @returns {Object} - Sanitized headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return null;
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize body to remove sensitive data
   * @param {Object} body - Request body
   * @returns {Object} - Sanitized body
   */
  sanitizeBody(body) {
    if (!body) return null;
    
    const sanitized = JSON.parse(JSON.stringify(body));
    const sensitiveFields = ['password', 'confirmPassword', 'token', 'secret', 'creditCard', 'cvv'];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Calculate retention date based on log level
   * @param {string} level - Log level
   * @returns {Date} - Retention date
   */
  calculateRetentionDate(level) {
    const retentionDays = {
      error: 90,
      warn: 30,
      info: 14,
      http: 7,
      debug: 3
    };
    
    const days = retentionDays[level] || 14;
    return new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  }

  /**
   * Save log to database
   * @param {Object} logData - Log data to save
   */
  async saveLog(logData) {
    try {
      if (!this.Log) return;
      
      const log = new this.Log({
        logId: uuidv4(),
        ...logData,
        environment: process.env.NODE_ENV || 'development',
        retentionDate: this.calculateRetentionDate(logData.level)
      });
      
      await log.save();
    } catch (error) {
      // Don't throw - just log to console
      console.error('Failed to save log to database:', error.message);
    }
  }

  /**
   * Main log method - called by Winston
   * @param {Object} info - Log info
   * @param {Function} callback - Callback function
   */
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const logData = this.parseLogInfo(info);
    
    if (!this.isReady) {
      // Queue log for later processing
      this.logQueue.push(logData);
    } else {
      // Save immediately
      this.saveLog(logData).catch(err => {
        console.error('Error saving log:', err.message);
      });
    }

    callback();
  }

  /**
   * Query logs from database
   * @param {Object} options - Query options
   * @param {Function} callback - Callback function
   */
  async query(options, callback) {
    try {
      if (!this.Log) {
        return callback(new Error('Database not ready'));
      }

      const {
        from = new Date() - (24 * 60 * 60 * 1000),
        until = new Date(),
        limit = 100,
        start = 0,
        order = 'desc',
        level,
        fields
      } = options;

      const query = {
        timestamp: {
          $gte: new Date(from),
          $lte: new Date(until)
        }
      };

      if (level) {
        query.level = level;
      }

      const sortOrder = order === 'asc' ? 1 : -1;
      let projection = null;
      
      if (fields && fields.length > 0) {
        projection = fields.reduce((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {});
      }

      const logs = await this.Log.find(query, projection)
        .sort({ timestamp: sortOrder })
        .skip(start)
        .limit(limit)
        .lean();

      callback(null, logs);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Stream logs from database
   * @param {Object} options - Stream options
   * @returns {Stream} - Log stream
   */
  stream(options = {}) {
    if (!this.Log) {
      const { Readable } = require('stream');
      const readable = new Readable({
        objectMode: true,
        read() {
          this.push(null);
        }
      });
      return readable;
    }

    const query = options.query || {};
    return this.Log.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 100)
      .cursor();
  }

  /**
   * Close the transport
   */
  close() {
    this.isReady = false;
    this.Log = null;
    this.emit('closed');
  }
}

module.exports = MongoDBTransport;

