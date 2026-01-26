const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const { StartupValidator, createDefaultChecks } = require('./utils/startupValidation');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const { requestCorrelation } = require('./middleware/requestCorrelation');
const { auditGeneralOperations } = require('./middleware/auditLogger');
const { activityTracker } = require('./middleware/activityTracker');
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
const jobCategoriesRoutes = require('./routes/jobCategories');
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
const broadcasterRoutes = require('./routes/broadcaster');
const favoritesRoutes = require('./routes/favorites');
const monitoringRoutes = require('./routes/monitoring');
const alertsRoutes = require('./routes/alerts');
const databaseMonitoringRoutes = require('./routes/databaseMonitoring');
const databaseOptimizationRoutes = require('./routes/databaseOptimization');
const metricsStreamRoutes = require('./routes/metricsStream');
const aiMarketplaceRoutes = require('./routes/aiMarketplace');
const aiUsersRoutes = require('./routes/aiUsers');
const aiBotRoutes = require('./routes/aiBot');
const escrowRoutes = require('./routes/escrows');
const escrowWebhookRoutes = require('./routes/escrowWebhooks');
const liveChatRoutes = require('./routes/liveChat');
const adminLiveChatRoutes = require('./routes/adminLiveChat');
const notificationsRoutes = require('./routes/notifications');
const webhookRoutes = require('./routes/webhookRoutes');
const emailMarketingRoutes = require('./routes/emailMarketing');
const partnersRoutes = require('./routes/partners');
const staffRoutes = require('./routes/staff');
const permissionsRoutes = require('./routes/permissions');
const apiKeysRoutes = require('./routes/apiKeys');
const oauthRoutes = require('./routes/oauth');
const availabilityRoutes = require('./routes/availability');
const schedulingRoutes = require('./routes/scheduling');
const jobWorkflowRoutes = require('./routes/jobWorkflow');
const quotesInvoicesRoutes = require('./routes/quotesInvoices');
const maskedCallsRoutes = require('./routes/maskedCalls');
const timeEntriesRoutes = require('./routes/timeEntries');
const gpsLogsRoutes = require('./routes/gpsLogs');
const geofenceEventsRoutes = require('./routes/geofenceEvents');
const { metricsMiddleware } = require('./middleware/metricsMiddleware');
const { generalLimiter, marketplaceLimiter } = require('./middleware/rateLimiter');
const liveChatWebSocketService = require('./services/liveChatWebSocketService');
const AllowedOrigin = require('./models/AllowedOrigin');
const supportRoutes = require('./routes/support');
const app = express();

// Trust proxy - necessary when behind reverse proxy/load balancer (e.g., Render, nginx)
app.set('trust proxy', 1);

// Initialize startup validator with comprehensive checks
const startupValidator = new StartupValidator();
createDefaultChecks(startupValidator);

// Helper to cache allowed origins in memory
let allowedOriginsCache = null;
let allowedOriginsCacheTime = 0;
const ALLOWED_ORIGINS_CACHE_TTL = 60 * 1000; // 1 minute

async function getAllowedOrigins() {
  // Use cache if not expired
  if (allowedOriginsCache && Date.now() - allowedOriginsCacheTime < ALLOWED_ORIGINS_CACHE_TTL) {
    return allowedOriginsCache;
  }
  try {
    const docs = await AllowedOrigin.find({}, 'origin').lean();
    allowedOriginsCache = docs.map(doc => doc.origin);
    allowedOriginsCacheTime = Date.now();
    // Always allow localhost/dev for safety
    if (process.env.NODE_ENV === 'development') {
      allowedOriginsCache.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001');
    }
    return allowedOriginsCache;
  } catch (e) {
    // Fallback to default if DB fails
    return [process.env.FRONTEND_URL || 'http://localhost:3000'];
  }
}

// Run startup validation
async function initializeApplication() {
  try {
    logger.info('🚀 Initializing LocalPro Super App...');

    // Run all startup checks
    await startupValidator.runValidation();
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

    // Initialize automated services (tracks services for graceful shutdown)
    await initializeAutomatedServices();

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

  // Enhanced CORS configuration
  const corsOptions = {
    origin: async function (origin, callback) {
      if (!origin) return callback(null, true);
      try {
        const allowedOrigins = await getAllowedOrigins();
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        logger.warn('CORS blocked origin', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      } catch (e) {
        logger.error('CORS DB error', e);
        callback(new Error('CORS check failed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-API-Secret'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit']
  };

  app.use(cors(corsOptions));

  // Handle preflight requests explicitly
  app.options('*', cors(corsOptions));


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
  // Only parse JSON for requests with JSON content-type
  app.use((req, res, next) => {
    const contentType = req.get('content-type') || '';

    // Skip JSON parsing for multipart/form-data (handled by multer)
    if (contentType.includes('multipart/form-data')) {
      return next();
    }

    // Only parse JSON if content-type indicates JSON
    if (contentType.includes('application/json') || contentType.includes('text/json')) {
      express.json({ limit: '10mb' })(req, res, (err) => {
        if (err) {
          // Handle JSON parsing errors gracefully
          logger.warn('JSON parsing error', {
            error: err.message,
            contentType: req.get('content-type'),
            path: req.path,
            method: req.method
          });

          // If it's a JSON parsing error, return a helpful error
          if (err instanceof SyntaxError && err.message.includes('JSON')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid JSON in request body',
              code: 'INVALID_JSON',
              details: 'This endpoint expects JSON format. Please ensure your request body is valid JSON.'
            });
          }

          return next(err);
        }
        next();
      });
    } else {
      // For other content types, continue without JSON parsing
      next();
    }
  });

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware (add unique ID to each request)
  app.use(requestIdMiddleware);

  // Request correlation middleware (for distributed tracing)
  app.use(requestCorrelation);

  // Rate limiting middleware (apply early to protect all routes)
  // More lenient rate limiting for public marketplace endpoints (mobile app friendly)
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    app.use('/api/marketplace', marketplaceLimiter);
    // General rate limiting for all other API routes
    app.use('/api', generalLimiter);
  }

  // Logging middleware
  app.use(morgan('combined', { stream: logger.stream }));
  app.use(requestLogger);

  // Enhanced request logging with performance tracking is available in src/middleware/requestLogger.js
  // To enable: const { requestLogger: enhancedRequestLogger } = require('./middleware/requestLogger');
  // Then: app.use(enhancedRequestLogger({ logBody: false, logHeaders: false }));

  // Metrics collection middleware
  app.use(metricsMiddleware);

  // Audit logging middleware
  if (process.env.AUDIT_LOGGING_ENABLED !== 'false') {
    app.use(auditGeneralOperations);
  }

  // Activity tracking middleware (tracks user activities automatically)
  app.use(activityTracker({
    excludePaths: ['/api/activities', '/api/logs', '/api/audit-logs', '/health', '/api/monitoring'],
    onlySuccessful: true
  }));

  // Index API info endpoint
  /**
   * @swagger
   * /:
   *   get:
   *     summary: API information and status
   *     tags: [General]
   *     security: []
   *     responses:
   *       200:
   *         description: API information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 message:
   *                   type: string
   *                 version:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
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
        rateLimit: 'Enabled (100 req/15min)'
      },

      // Company Info
      company: {
        name: 'LocalPro Super App',
        tagline: 'Connecting Local Professionals with Opportunities',
        mission: 'Empowering local service providers and creating opportunities for growth and success',
        founded: '2024',
        location: ''
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
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [General]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: integer
   *                 services:
   *                   type: object
   *       503:
   *         description: Service is degraded
   */
  app.get('/health', async (req, res) => {
    const databaseHealth = await checkDatabaseHealth();
    const externalApis = await checkExternalAPIs();

    // Determine overall health status
    const isHealthy =
      databaseHealth.status === 'healthy' &&
      process.uptime() > 0;

    const health = {
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealth,
        external_apis: externalApis
      },
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      requestId: req.id // Include request ID for tracking
    };

    // Return 503 if critical services are down
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Helper function to format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

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

  // Swagger API Documentation
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LocalPro Super App API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/api-keys', apiKeysRoutes);
  app.use('/api/oauth', oauthRoutes);
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
  app.use('/api/job-categories', jobCategoriesRoutes);
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
  app.use('/api/broadcaster', broadcasterRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/scheduling', schedulingRoutes);
  app.use('/api/job-workflow', jobWorkflowRoutes);
  app.use('/api/quotes', quotesInvoicesRoutes);
  app.use('/api/invoices', quotesInvoicesRoutes);
  app.use('/api/masked-calls', maskedCallsRoutes);

  // GPS & Time Tracking Routes
  app.use('/api/time-entries', timeEntriesRoutes);
  app.use('/api/gps-logs', gpsLogsRoutes);
  app.use('/api/geofence-events', geofenceEventsRoutes);

  // AI Marketplace Routes
  app.use('/api/ai/marketplace', aiMarketplaceRoutes);

  // AI Users Routes
  app.use('/api/ai/users', aiUsersRoutes);

  // AI Bot Routes (AI Operating System)
  app.use('/api/ai-bot', aiBotRoutes);

  // Escrow and Payment Routes
  app.use('/api/escrows', escrowRoutes);
  app.use('/webhooks', escrowWebhookRoutes);

  // Monitoring and Performance Routes
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/monitoring/alerts', alertsRoutes.router);
  app.use('/api/monitoring/database', databaseMonitoringRoutes);
  app.use('/api/monitoring/stream', metricsStreamRoutes.router);

  // Database Optimization Routes
  app.use('/api/database/optimization', databaseOptimizationRoutes);

  // Live Chat Routes (Public - No Auth Required)
  app.use('/api/live-chat', liveChatRoutes);

  // Live Chat Admin Routes (Requires Auth)
  app.use('/api/admin/live-chat', adminLiveChatRoutes);

  // Notification Routes
  app.use('/api/notifications', notificationsRoutes);

  // Webhook Routes
  app.use('/api/webhooks', webhookRoutes);

  // Email Marketing Routes
  app.use('/api/email-marketing', emailMarketingRoutes);

  // Partner Routes
  app.use('/api/partners', partnersRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/permissions', permissionsRoutes);
  // Register support routes after app is initialized
  app.use('/api/support', supportRoutes);
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Register CORS admin routes (after errorHandler, before 404)
  const corsOriginsRoutes = require('./routes/corsOrigins');
  const { auth } = require('./middleware/auth');
  app.use('/api/admin/cors-origins', auth, corsOriginsRoutes);

  // Start the server (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    const http = require('http');
    const { WebSocketServer } = require('ws');

    // Create HTTP server
    httpServer = http.createServer(app);

    // Create WebSocket server for live chat
    const wss = new WebSocketServer({
      server: httpServer,
      path: '/ws/live-chat'
    });

    // Initialize live chat WebSocket service
    liveChatWebSocketService.initialize(wss);

    httpServer.listen(PORT, () => {
      logger.info('LocalPro Super App API Started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });

      logger.info(`🚀 LocalPro Super App API running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Logging enabled with Winston`);
      logger.info(`🔍 Error monitoring active`);
      logger.info(`💬 Live Chat WebSocket available at ws://localhost:${PORT}/ws/live-chat`);
    });
  }
}

// Store references to services for graceful shutdown (module-level)
let httpServer = null;
let automatedServices = [];

// Initialize automated services (tracks services for graceful shutdown)
async function initializeAutomatedServices() {
  automatedServices = []; // Reset list

  try {
    // Automated Backup Service
    if (process.env.ENABLE_AUTOMATED_BACKUPS === 'true' || process.env.NODE_ENV === 'production') {
      const automatedBackupService = require('./services/automatedBackupService');
      automatedBackupService.start();
      automatedServices.push(automatedBackupService);
      logger.info('✅ Automated backup service started');
    }

    // Automated Booking Service (reminders, status transitions, review requests)
    if (process.env.ENABLE_AUTOMATED_BOOKINGS !== 'false') {
      const automatedBookingService = require('./services/automatedBookingService');
      automatedBookingService.start();
      automatedServices.push(automatedBookingService);
      logger.info('✅ Automated booking service started');
    }

    // Automated Email Campaign Processor
    if (process.env.ENABLE_AUTOMATED_CAMPAIGNS !== 'false') {
      const automatedCampaignProcessor = require('./services/automatedCampaignProcessor');
      automatedCampaignProcessor.start();
      automatedServices.push(automatedCampaignProcessor);
      logger.info('✅ Automated campaign processor started');
    }

    // Automated Subscription Renewal Service
    if (process.env.ENABLE_AUTOMATED_SUBSCRIPTIONS !== 'false') {
      const automatedSubscriptionService = require('./services/automatedSubscriptionService');
      automatedSubscriptionService.start();
      automatedServices.push(automatedSubscriptionService);
      logger.info('✅ Automated subscription service started');
    }

    // Automated Escrow Status Management Service
    if (process.env.ENABLE_AUTOMATED_ESCROWS !== 'false') {
      const automatedEscrowService = require('./services/automatedEscrowService');
      automatedEscrowService.start();
      automatedServices.push(automatedEscrowService);
      logger.info('✅ Automated escrow service started');
    }

    // Automated Payment Status Synchronization (PayPal, PayMongo, etc.)
    if (process.env.ENABLE_AUTOMATED_PAYMENT_SYNC === 'true') {
      const { automatedPaymentSyncService } = require('./services/automatedPaymentSyncService');
      automatedPaymentSyncService.start();
      logger.info('✅ Automated payment sync service started');
    }

    // Automated Lifecycle Marketing (opt-in marketing automations)
    if (process.env.ENABLE_AUTOMATED_MARKETING === 'true') {
      const automatedLifecycleMarketingService = require('./services/automatedLifecycleMarketingService');
      automatedLifecycleMarketingService.start();
      logger.info('✅ Automated lifecycle marketing service started');
    }

    // Automated Messaging Nudges (unread message reminders)
    if (process.env.ENABLE_AUTOMATED_MESSAGE_NUDGES === 'true') {
      const automatedMessagingNudgeService = require('./services/automatedMessagingNudgeService');
      automatedMessagingNudgeService.start();
      logger.info('✅ Automated messaging nudge service started');
    }

    // Automated Orders Automations (supplies)
    if (process.env.ENABLE_AUTOMATED_ORDERS_AUTOMATIONS === 'true') {
      const automatedOrdersAutomationService = require('./services/automatedOrdersAutomationService');
      automatedOrdersAutomationService.start();
      logger.info('✅ Automated orders automation service started');
    }

    // Automated Finance Reminders (loans / salary advances)
    if (process.env.ENABLE_AUTOMATED_FINANCE_REMINDERS === 'true') {
      const automatedFinanceReminderService = require('./services/automatedFinanceReminderService');
      automatedFinanceReminderService.start();
      logger.info('✅ Automated finance reminder service started');
    }

    // Automated Rental Reminders (due soon / overdue)
    if (process.env.ENABLE_AUTOMATED_RENTAL_REMINDERS === 'true') {
      const automatedRentalReminderService = require('./services/automatedRentalReminderService');
      automatedRentalReminderService.start();
      logger.info('✅ Automated rental reminder service started');
    }

    // Automated Job Board Digest
    if (process.env.ENABLE_AUTOMATED_JOB_DIGEST === 'true') {
      const automatedJobBoardDigestService = require('./services/automatedJobBoardDigestService');
      automatedJobBoardDigestService.start();
      logger.info('✅ Automated job digest service started');
    }

    // Automated Academy Engagement
    if (process.env.ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT === 'true') {
      const automatedAcademyEngagementService = require('./services/automatedAcademyEngagementService');
      automatedAcademyEngagementService.start();
      logger.info('✅ Automated academy engagement service started');
    }

    // Automated Live Chat SLA Alerts
    if (process.env.ENABLE_AUTOMATED_LIVECHAT_SLA === 'true') {
      const automatedLiveChatSlaService = require('./services/automatedLiveChatSlaService');
      automatedLiveChatSlaService.start();
      logger.info('✅ Automated live chat SLA service started');
    }

    // Marketplace booking follow-ups (extra nudges, no state changes)
    if (process.env.ENABLE_AUTOMATED_BOOKING_FOLLOWUPS === 'true') {
      const automatedMarketplaceBookingFollowUpService = require('./services/automatedMarketplaceBookingFollowUpService');
      automatedMarketplaceBookingFollowUpService.start();
      logger.info('✅ Automated marketplace booking follow-up service started');
    }

    // Supplies fulfillment / delivery confirmation reminders
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT === 'true') {
      const automatedSuppliesFulfillmentService = require('./services/automatedSuppliesFulfillmentService');
      automatedSuppliesFulfillmentService.start();
      logger.info('✅ Automated supplies fulfillment service started');
    }

    // Academy certificates pending alerts (admin)
    if (process.env.ENABLE_AUTOMATED_ACADEMY_CERTIFICATES === 'true') {
      const automatedAcademyCertificateService = require('./services/automatedAcademyCertificateService');
      automatedAcademyCertificateService.start();
      logger.info('✅ Automated academy certificate service started');
    }

    // Job application follow-ups (employer reminders)
    if (process.env.ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS === 'true') {
      const automatedJobApplicationFollowUpService = require('./services/automatedJobApplicationFollowUpService');
      automatedJobApplicationFollowUpService.start();
      logger.info('✅ Automated job application follow-up service started');
    }

    // Automated Availability Service (job start reminders, lateness alerts)
    if (process.env.ENABLE_AUTOMATED_AVAILABILITY !== 'false') {
      const automatedAvailabilityService = require('./services/automatedAvailabilityService');
      automatedAvailabilityService.start();
      logger.info('✅ Automated availability service started');
    }

    // Automated Scheduling Service (cleanup expired rankings and suggestions)
    if (process.env.ENABLE_AUTOMATED_SCHEDULING !== 'false') {
      const automatedSchedulingService = require('./services/automatedSchedulingService');
      automatedSchedulingService.start();
      logger.info('✅ Automated scheduling service started');
    }

    // Escrow dispute escalation (admin + party nudges)
    if (process.env.ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS === 'true') {
      const automatedEscrowDisputeEscalationService = require('./services/automatedEscrowDisputeEscalationService');
      automatedEscrowDisputeEscalationService.start();
      logger.info('✅ Automated escrow dispute escalation service started');
    }

    // Referral tier milestones
    if (process.env.ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES === 'true') {
      const automatedReferralTierMilestoneService = require('./services/automatedReferralTierMilestoneService');
      automatedReferralTierMilestoneService.start();
      logger.info('✅ Automated referral tier milestone service started');
    }

    // Marketplace booking no-show / overdue detection
    if (process.env.ENABLE_AUTOMATED_BOOKING_NO_SHOW === 'true') {
      const automatedMarketplaceNoShowService = require('./services/automatedMarketplaceNoShowService');
      automatedMarketplaceNoShowService.start();
      logger.info('✅ Automated marketplace booking no-show service started');
    }

    // Supplies reorder reminders
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS === 'true') {
      const automatedSuppliesReorderReminderService = require('./services/automatedSuppliesReorderReminderService');
      automatedSuppliesReorderReminderService.start();
      logger.info('✅ Automated supplies reorder reminder service started');
    }

    // Messaging moderation (flag contact leakage)
    if (process.env.ENABLE_AUTOMATED_MESSAGE_MODERATION === 'true') {
      const automatedMessagingModerationService = require('./services/automatedMessagingModerationService');
      automatedMessagingModerationService.start();
      logger.info('✅ Automated messaging moderation service started');
    }

    // LocalPro Plus subscription dunning reminders
    if (process.env.ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING === 'true') {
      const automatedLocalProPlusDunningService = require('./services/automatedLocalProPlusDunningService');
      automatedLocalProPlusDunningService.start();
      logger.info('✅ Automated LocalPro Plus dunning service started');
    }

    // Mobile-first lifecycle notifications (Option A)
    if (process.env.ENABLE_AUTOMATED_MOBILE_LIFECYCLE === 'true') {
      const automatedLifecycleMobileNotificationsService = require('./services/automatedLifecycleMobileNotificationsService');
      automatedLifecycleMobileNotificationsService.start();
      logger.info('✅ Automated lifecycle mobile notifications service started');
    }

    // Automated Log & Audit Cleanup Service
    if (process.env.ENABLE_AUTOMATED_CLEANUP !== 'false') {
      const automatedLogCleanupService = require('./services/automatedLogCleanupService');
      automatedLogCleanupService.start();
      logger.info('✅ Automated log cleanup service started');
    }

    // Automated Index Management Service (runs scripts; optional on startup + scheduled)
    if (process.env.VALIDATE_INDEXES_ON_STARTUP === 'true' || process.env.ENABLE_AUTOMATED_INDEXES === 'true') {
      const automatedIndexManagementService = require('./services/automatedIndexManagementService');
      automatedIndexManagementService.start();
      logger.info('✅ Automated index management service started');
    }

    // AI Bot Service (AI Operating System)
    if (process.env.ENABLE_AI_BOT !== 'false') {
      const aiBotService = require('./services/aiBotService');
      const aiBotEventListener = require('./services/aiBotEventListener');

      // Initialize AI Bot
      await aiBotService.initialize();

      // Start event listener
      aiBotEventListener.start();

      logger.info('✅ AI Bot service (AI Operating System) started');
    }

    // Add other automated services here as they are implemented
  } catch (error) {
    logger.error('❌ Failed to initialize automated services:', error);
    // Don't exit - allow server to start even if automation fails
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close HTTP server (stop accepting new connections)
    if (httpServer) {
      return new Promise((resolve) => {
        httpServer.close(() => {
          logger.info('HTTP server closed');

          // Use async IIFE to handle async operations in the callback
          (async () => {
            try {
              // Stop all automated services
              for (const service of automatedServices) {
                if (service && typeof service.stop === 'function') {
                  try {
                    service.stop();
                    logger.info(`Stopped service: ${service.constructor?.name || 'unknown'}`);
                  } catch (error) {
                    logger.error(`Error stopping service: ${error.message}`);
                  }
                }
              }

              // Stop database performance monitor
              const dbMonitor = require('./services/databasePerformanceMonitor');
              if (dbMonitor && typeof dbMonitor.stopMonitoring === 'function') {
                dbMonitor.stopMonitoring();
              }

              // Cleanup metrics stream
              const { cleanup: cleanupMetricsStream } = require('./routes/metricsStream');
              if (cleanupMetricsStream) {
                cleanupMetricsStream();
              }

              // Close MongoDB connection
              const mongoose = require('mongoose');
              if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');
              }

              logger.info('Graceful shutdown completed');
              resolve();
              process.exit(0);
            } catch (error) {
              logger.error('Error during graceful shutdown:', error);
              process.exit(1);
            }
          })();
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      });
    } else {
      // If no HTTP server, just clean up services and exit
      for (const service of automatedServices) {
        if (service && typeof service.stop === 'function') {
          try {
            service.stop();
          } catch (error) {
            logger.error(`Error stopping service: ${error.message}`);
          }
        }
      }

      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }

      process.exit(0);
    }
  } catch (error) {
    logger.error('Error in graceful shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers (only once)
if (!process.shutdownHandlersRegistered) {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.shutdownHandlersRegistered = true;
}

// Initialize application when run directly
if (require.main === module) {
  initializeApplication();
} else {
  // In test environment, register routes immediately without full initialization
  // This allows tests to use the app without calling initializeApplication
  if (process.env.NODE_ENV === 'test') {
    startServer();
  }
}

module.exports = app;
