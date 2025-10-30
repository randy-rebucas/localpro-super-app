const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const { StartupValidator, createDefaultChecks } = require('./utils/startupValidation');
const { errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { auditGeneralOperations } = require('./middleware/auditLogger');
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
const registrationRoutes = require('./routes/registration');
const monitoringRoutes = require('./routes/monitoring');
const alertsRoutes = require('./routes/alerts');
const databaseMonitoringRoutes = require('./routes/databaseMonitoring');
const databaseOptimizationRoutes = require('./routes/databaseOptimization');
const metricsStreamRoutes = require('./routes/metricsStream');
const { metricsMiddleware } = require('./middleware/metricsMiddleware');

const app = express();

// Trust proxy - necessary when behind reverse proxy/load balancer (e.g., Render, nginx)
app.set('trust proxy', 1);

// Initialize startup validator with comprehensive checks
const startupValidator = new StartupValidator();
createDefaultChecks(startupValidator);

// Run startup validation
async function initializeApplication() {
  try {
    logger.info('🚀 Initializing LocalPro Super App...');
    
    // Run all startup checks
    const validationResults = await startupValidator.runValidation();
    const summary = startupValidator.getSummary();
    
    if (!summary.canProceed) {
      logger.error('❌ Critical startup validation failures detected:', {
        criticalFailures: summary.criticalFailures,
        totalChecks: summary.totalChecks
      });
      process.exit(1);
    }
    
    if (summary.warnings.length > 0) {
      logger.warn('⚠️  Startup validation warnings:', {
        warnings: summary.warnings,
        totalChecks: summary.totalChecks
      });
    }
    
    logger.info('✅ Application startup validation completed successfully');
    
    // Connect to MongoDB after validation
    await connectDB();
    
    // Verify database connection after connecting
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      logger.error('❌ Database connection failed after connection attempt');
      process.exit(1);
    }
    
    logger.info('✅ Database connection verified successfully');
    
    // Start the server
    startServer();
    
  } catch (error) {
    logger.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
}

// Start the server
function startServer() {
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));


  // Response compression middleware
  app.use(compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Compression level (1-9, where 9 is best compression but slowest)
    level: 6,
    // Filter function to determine what to compress
    filter: (req, res) => {
      // Don't compress if the request includes a no-transform directive
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }
      // Use the default compression filter
      return compression.filter(req, res);
    }
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(morgan('combined', { stream: logger.stream }));
  app.use(requestLogger);

  // Metrics collection middleware
  app.use(metricsMiddleware);

  // Audit logging middleware
  app.use(auditGeneralOperations);

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
  const checkDatabaseHealth = async () => {
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

  const checkExternalAPIs = async () => {
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

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await checkDatabaseHealth(),
      external_apis: await checkExternalAPIs(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    };
    res.status(200).json(health);
  });

  // Serve Postman collection
  app.get('/LocalPro-Super-App-API.postman_collection.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="LocalPro-Super-App-API.postman_collection.json"');
    res.sendFile('LocalPro-Super-App-API.postman_collection.json', { root: '.' });
  });

  // Serve monitoring dashboard
  app.get('/monitoring', (req, res) => {
    res.sendFile('monitoring-dashboard.html', { root: './src/templates' });
  });

  // API Routes
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
  app.use('/api/registration', registrationRoutes);
  
  // Monitoring and Performance Routes
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/monitoring/alerts', alertsRoutes.router);
  app.use('/api/monitoring/database', databaseMonitoringRoutes);
  app.use('/api/monitoring/stream', metricsStreamRoutes.router);
  
  // Database Optimization Routes
  app.use('/api/database/optimization', databaseOptimizationRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Start the server unless running in tests
  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info('LocalPro Super App API Started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
      
      logger.info(`🚀 LocalPro Super App API running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Logging enabled with Winston`);
      logger.info(`🔍 Error monitoring active`);
    });
  }
}

// Only initialize if this file is run directly (not imported for testing)
if (process.env.NODE_ENV === 'test') {
  // In test, configure app without DB connection and without starting listener
  startServer();
} else if (require.main === module) {
  initializeApplication();
}

module.exports = app;
