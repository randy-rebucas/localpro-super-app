const mongoose = require('mongoose');
// const logger = require('./logger'); // Commented out to avoid circular dependency

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
    
    // Enhanced connection options for production
    const options = {
      // Connection Pool Settings
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10, // Maintain up to 10 socket connections
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,  // Maintain at least 2 socket connections
      
      // Connection Timeouts
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000, // Give up initial connection after 10 seconds
      
      // Buffer Settings (removed deprecated options)
      // bufferMaxEntries and bufferCommands are deprecated in newer MongoDB drivers
      
      // Retry Settings
      retryWrites: true,
      retryReads: true,
      
      // Write Concern
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      },
      
      // Read Preference
      // Default to 'primaryPreferred' for better read availability.
      // Override via env if you need strict 'primary' for specific workloads.
      readPreference: process.env.MONGODB_READ_PREFERENCE || 'primaryPreferred',
      
      // Compression
      compressors: ['zlib'],
      
      // Heartbeat
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      
      // Application Name
      appName: 'LocalPro-Super-App'
    };

    // Add authentication if provided
    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
      options.auth = {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD
      };
    }

    // Add SSL/TLS options for production
    // Note: For MongoDB 6.0+ and Mongoose 8.0+, use 'tls' instead of 'ssl'
    if (process.env.NODE_ENV === 'production') {
      options.tls = true;
      // tlsAllowInvalidCertificates: false is the default (secure)
      // Set to true only if you need to bypass certificate validation (not recommended)
      if (process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === 'true') {
        options.tlsAllowInvalidCertificates = true;
      }
    }
    
    // Support legacy SSL options from connection string or environment
    // These will be handled by the MongoDB driver automatically
    if (process.env.MONGODB_TLS === 'true' || process.env.MONGODB_SSL === 'true') {
      options.tls = true;
    }

    const conn = await mongoose.connect(mongoUri, options);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB Connected Successfully', {
        host: conn.connection.host,
        port: conn.connection.port,
        name: conn.connection.name,
        readyState: conn.connection.readyState
      });
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB Connection Error:', {
        error: error.message,
        stack: error.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB Reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📊 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    console.log('📊 MongoDB Connected Successfully', {
      host: conn.connection.host,
      port: conn.connection.port,
      name: conn.connection.name,
      poolSize: options.maxPoolSize,
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('❌ Database connection error:', {
      error: error.message,
      stack: error.stack,
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'using default',
      code: error.code,
      name: error.name
    });
    
    // Provide helpful error message
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 MongoDB connection refused. Please ensure MongoDB is running:');
      console.error('   - Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
      console.error('   - Or use MongoDB Atlas: https://www.mongodb.com/atlas');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 MongoDB authentication failed. Please check credentials:');
      console.error('   - Check username and password in connection string');
      console.error('   - Verify authSource parameter');
    } else {
      console.error('💡 MongoDB connection failed. Check the error details above.');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
