const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { auditGeneralOperations } = require('./middleware/auditLogger');
const { monitorRequests, monitorErrors } = require('./middleware/monitoringMiddleware');
const SanitizationService = require('./services/sanitizationService');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');
const authRoutes = require('./routes/auth');
const marketplaceRoutes = require('./routes/marketplace');
const suppliesRoutes = require('./routes/supplies');
const academyRoutes = require('./routes/academy');
const financeRoutes = require('./routes/finance');
const rentalsRoutes = require('./routes/rentals');
const adsRoutes = require('./routes/ads');
const facilityCareRoutes = require('./routes/facilityCare');
const localproPlusRoutes = require('./routes/localproPlus');
const trustVerificationRoutes = require('./routes/trustVerification');
const communicationRoutes = require('./routes/communication');
const analyticsRoutes = require('./routes/analytics');
const mapsRoutes = require('./routes/maps');
const paypalRoutes = require('./routes/paypal');
const paymayaRoutes = require('./routes/paymaya');
const databaseRoutes = require('./routes/database');
const jobsRoutes = require('./routes/jobs');
const referralsRoutes = require('./routes/referrals');
const agenciesRoutes = require('./routes/agencies');
const settingsRoutes = require('./routes/settings');
const errorMonitoringRoutes = require('./routes/errorMonitoring');
const auditLogsRoutes = require('./routes/auditLogs');
const providersRoutes = require('./routes/providers');
const logsRoutes = require('./routes/logs');
const userManagementRoutes = require('./routes/userManagement');
const searchRoutes = require('./routes/search');
const announcementsRoutes = require('./routes/announcements');
const activitiesRoutes = require('./routes/activities');
const monitoringRoutes = require('./routes/monitoring');

const app = express();

// Trust proxy - necessary when behind reverse proxy/load balancer (e.g., Render, nginx)
app.set('trust proxy', 1);

// Connect to MongoDB
// Connect to database (skipped in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware
app.use(SanitizationService.sanitizeRequest());

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));
app.use(requestLogger);

// Monitoring middleware
app.use(monitorRequests);

// Rate limiting middleware

// Audit logging middleware
app.use(auditGeneralOperations);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Index API info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LocalPro Super App API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: `${req.protocol}://${req.get('host')}`,

    // Summarized Info
    summary: {
      description: 'LocalPro Super App - A comprehensive platform connecting local service providers with customers',
      features: [
        'Service Marketplace & Bookings',
        'Learning Academy & Certifications',
        'Equipment & Supplies Management',
        'Financial Management & Payments',
        'Job Board & Employment',
        'Trust & Verification System',
        'Real-time Communication',
        'Analytics & Insights',
        'Referral System & Rewards',
        'Agency Management',
        'User & App Settings',
        'User Management System',
        'Global Search System',
        'Announcements & Notifications',
        'User Activities & Feed'
      ],
      totalEndpoints: 20,
      authentication: 'Bearer Token',
      rateLimit: 'Disabled'
    },

    // Company Info
    company: {
      name: 'LocalPro Super App',
      tagline: 'Connecting Local Professionals with Opportunities',
      mission: 'Empowering local service providers and creating opportunities for growth and success',
      founded: '2024',
      location: 'Philippines'
    },

    // Contact Info
    contact: {
      support: 'api-support@localpro.com',
      technical: 'tech@localpro.com',
      business: 'business@localpro.com',
      documentation: 'Contact API support for detailed documentation'
    },

    // Postman Collection Link
    postmanCollection: {
      name: 'LocalPro-Super-App-API',
      description: 'Complete API collection with all endpoints and examples',
      link: `${req.protocol}://${req.get('host')}/LocalPro-Super-App-API.postman_collection.json`,
      openInNewTab: true
    }
  });
});

// Health check functions
const checkDatabaseHealth = async() => {
  try {
    const mongoose = require('mongoose');

    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

const checkExternalAPIs = async() => {
  const apis = {
    twilio: { status: 'unknown', response_time: null },
    paypal: { status: 'unknown', response_time: null },
    paymaya: { status: 'unknown', response_time: null },
    cloudinary: { status: 'unknown', response_time: null }
  };

  // For now, just return basic status
  // In production, you might want to actually ping these services
  return apis;
};

// Enhanced health check endpoint
app.get('/health', async(req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      services: {
        database: await checkDatabaseHealth(),
        external_apis: await checkExternalAPIs()
      }
    };


    // Check external services configuration
    health.services.twilio = {
      status: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not_configured'
    };

    health.services.paypal = {
      status: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not_configured'
    };

    health.services.cloudinary = {
      status: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not_configured'
    };

    // Determine overall health
    const allServicesHealthy = Object.values(health.services).every(
      service => service.status === 'healthy' || service.status === 'configured'
    );

    const statusCode = allServicesHealthy ? 200 : 503;
    health.status = allServicesHealthy ? 'OK' : 'DEGRADED';

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Serve Postman collection
app.get('/LocalPro-Super-App-API.postman_collection.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="LocalPro-Super-App-API.postman_collection.json"');
  res.sendFile('LocalPro-Super-App-API.postman_collection.json', { root: '.' });
});

// API Routes with specific rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/supplies', suppliesRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/facility-care', facilityCareRoutes);
app.use('/api/localpro-plus', localproPlusRoutes);
app.use('/api/trust-verification', trustVerificationRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/paymaya', paymayaRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/error-monitoring', errorMonitoringRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/monitoring', monitoringRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error monitoring middleware
app.use(monitorErrors);

// Error handling middleware
app.use(errorHandler);

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    logger.info('LocalPro Super App API Started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });

    logger.info(`🚀 LocalPro Super App API running on port ${PORT}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('📊 Logging enabled with Winston');
    logger.info('🔍 Error monitoring active');
  });
}

module.exports = app;
