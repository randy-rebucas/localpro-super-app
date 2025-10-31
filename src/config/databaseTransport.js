const winston = require('winston');
const Log = require('../models/Log');

class DatabaseTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
    this.name = 'database';
    this.level = options.level || 'info';
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5 seconds
    this.logBuffer = [];
    this.isFlushing = false;
    this.flushTimer = null;
    
    // Start periodic flush
    this.startFlushTimer();
  }

  // Required winston transport methods
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Add to buffer
    this.logBuffer.push(this.formatLogEntry(info));

    // Flush if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  formatLogEntry(info) {
    const crypto = require('crypto');
    const logId = crypto.randomBytes(16).toString('hex');

    const logEntry = {
      logId,
      level: info.level,
      message: info.message,
      category: this.determineCategory(info),
      source: 'winston',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date(info.timestamp || Date.now()),
      metadata: {}
    };

    // Add request information if available
    if (info.request) {
      logEntry.request = {
        method: info.request.method,
        url: info.request.url,
        headers: this.sanitizeHeaders(info.request.headers),
        body: this.sanitizeBody(info.request.body),
        params: info.request.params,
        query: info.request.query,
        ip: info.request.ip,
        userAgent: info.request.userAgent,
        userId: info.request.userId
      };
    }

    // Add response information if available
    if (info.response) {
      logEntry.response = {
        statusCode: info.response.statusCode,
        responseTime: info.response.responseTime,
        success: info.response.success
      };
    }

    // Add error information if available
    if (info.error || info.stack) {
      logEntry.error = {
        name: info.error?.name || info.name,
        message: info.error?.message || info.message,
        stack: info.error?.stack || info.stack,
        code: info.error?.code,
        statusCode: info.error?.statusCode
      };
    }

    // Add metadata
    if (info.metadata) {
      logEntry.metadata = this.sanitizeData(info.metadata);
    }

    // Add additional fields from info
    const additionalFields = ['userId', 'sessionId', 'operation', 'duration', 'event'];
    additionalFields.forEach(field => {
      if (info[field] !== undefined) {
        logEntry.metadata[field] = info[field];
      }
    });

    return logEntry;
  }

  determineCategory(info) {
    if (info.category) return info.category;
    if (info.level === 'error') return 'error';
    if (info.level === 'warn') return 'security';
    if (info.level === 'http') return 'http';
    if (info.operation) return 'performance';
    if (info.event) return 'business';
    return 'application';
  }

  sanitizeHeaders(headers) {
    if (!headers || typeof headers !== 'object') return headers;
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'pin'];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'pin'];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  async flush() {
    if (this.isFlushing || this.logBuffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await Log.insertMany(logsToFlush, { ordered: false });
    } catch (error) {
      // Log error but don't throw to avoid breaking the application
      console.error('Database transport flush error:', error.message);
      
      // Try to log individual entries if batch insert fails
      for (const logEntry of logsToFlush) {
        try {
          await Log.create(logEntry);
        } catch (individualError) {
          console.error('Individual log insert error:', individualError.message);
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Force flush all remaining logs
  async close() {
    this.stopFlushTimer();
    await this.flush();
  }
}

module.exports = DatabaseTransport;
