const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
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

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Index API info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LocalPro Super App API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    documentation: {
      healthCheck: '/health',
      apiBase: '/api'
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        description: 'Authentication and user management',
        routes: [
          { method: 'POST', path: '/send-code', description: 'Send verification code', auth: false },
          { method: 'POST', path: '/verify-code', description: 'Verify code and login', auth: false },
          { method: 'GET', path: '/me', description: 'Get current user profile', auth: true },
          { method: 'PUT', path: '/profile', description: 'Update user profile', auth: true },
          { method: 'POST', path: '/logout', description: 'Logout user', auth: true }
        ]
      },
      marketplace: {
        base: '/api/marketplace',
        description: 'Service marketplace and bookings',
        routes: [
          { method: 'GET', path: '/services', description: 'Get all services', auth: false },
          { method: 'GET', path: '/services/:id', description: 'Get service by ID', auth: false },
          { method: 'POST', path: '/services', description: 'Create new service', auth: true, roles: ['provider', 'admin'] },
          { method: 'PUT', path: '/services/:id', description: 'Update service', auth: true, roles: ['provider', 'admin'] },
          { method: 'DELETE', path: '/services/:id', description: 'Delete service', auth: true, roles: ['provider', 'admin'] },
          { method: 'POST', path: '/bookings', description: 'Create booking', auth: true },
          { method: 'GET', path: '/bookings', description: 'Get user bookings', auth: true },
          { method: 'PUT', path: '/bookings/:id/status', description: 'Update booking status', auth: true },
          { method: 'POST', path: '/bookings/:id/review', description: 'Add review to booking', auth: true }
        ]
      },
      academy: {
        base: '/api/academy',
        description: 'Learning academy and courses',
        routes: [
          { method: 'GET', path: '/courses', description: 'Get all courses', auth: false },
          { method: 'GET', path: '/courses/:id', description: 'Get course by ID', auth: false },
          { method: 'GET', path: '/certifications', description: 'Get available certifications', auth: false },
          { method: 'POST', path: '/courses', description: 'Create new course', auth: true, roles: ['instructor', 'admin'] },
          { method: 'POST', path: '/enroll', description: 'Enroll in course', auth: true },
          { method: 'GET', path: '/enrollments', description: 'Get user enrollments', auth: true },
          { method: 'PUT', path: '/enrollments/:id/progress', description: 'Update course progress', auth: true }
        ]
      },
      supplies: {
        base: '/api/supplies',
        description: 'Equipment and supplies management',
        routes: [
          { method: 'GET', path: '/', description: 'Get all supplies', auth: false },
          { method: 'GET', path: '/:id', description: 'Get supply by ID', auth: false },
          { method: 'POST', path: '/', description: 'Create new supply', auth: true, roles: ['admin'] },
          { method: 'PUT', path: '/:id', description: 'Update supply', auth: true, roles: ['admin'] },
          { method: 'DELETE', path: '/:id', description: 'Delete supply', auth: true, roles: ['admin'] }
        ]
      },
      finance: {
        base: '/api/finance',
        description: 'Financial management and transactions',
        routes: [
          { method: 'GET', path: '/transactions', description: 'Get user transactions', auth: true },
          { method: 'POST', path: '/transactions', description: 'Create transaction', auth: true },
          { method: 'GET', path: '/balance', description: 'Get account balance', auth: true },
          { method: 'POST', path: '/payments', description: 'Process payment', auth: true }
        ]
      },
      rentals: {
        base: '/api/rentals',
        description: 'Equipment rental services',
        routes: [
          { method: 'GET', path: '/', description: 'Get available rentals', auth: false },
          { method: 'GET', path: '/:id', description: 'Get rental by ID', auth: false },
          { method: 'POST', path: '/', description: 'Create rental booking', auth: true },
          { method: 'GET', path: '/my-rentals', description: 'Get user rentals', auth: true },
          { method: 'PUT', path: '/:id/status', description: 'Update rental status', auth: true }
        ]
      },
      ads: {
        base: '/api/ads',
        description: 'Advertising and promotions',
        routes: [
          { method: 'GET', path: '/', description: 'Get all ads', auth: false },
          { method: 'GET', path: '/:id', description: 'Get ad by ID', auth: false },
          { method: 'POST', path: '/', description: 'Create new ad', auth: true, roles: ['admin'] },
          { method: 'PUT', path: '/:id', description: 'Update ad', auth: true, roles: ['admin'] },
          { method: 'DELETE', path: '/:id', description: 'Delete ad', auth: true, roles: ['admin'] }
        ]
      },
      facilityCare: {
        base: '/api/facility-care',
        description: 'Facility maintenance and care services',
        routes: [
          { method: 'GET', path: '/services', description: 'Get facility care services', auth: false },
          { method: 'GET', path: '/services/:id', description: 'Get service by ID', auth: false },
          { method: 'POST', path: '/services', description: 'Create service request', auth: true },
          { method: 'GET', path: '/requests', description: 'Get user service requests', auth: true },
          { method: 'PUT', path: '/requests/:id/status', description: 'Update request status', auth: true }
        ]
      },
      localproPlus: {
        base: '/api/localpro-plus',
        description: 'LocalPro Plus premium features',
        routes: [
          { method: 'GET', path: '/features', description: 'Get premium features', auth: true },
          { method: 'POST', path: '/subscribe', description: 'Subscribe to LocalPro Plus', auth: true },
          { method: 'GET', path: '/subscription', description: 'Get subscription status', auth: true },
          { method: 'POST', path: '/cancel', description: 'Cancel subscription', auth: true }
        ]
      },
      trustVerification: {
        base: '/api/trust-verification',
        description: 'Trust and verification system',
        routes: [
          { method: 'POST', path: '/verify', description: 'Submit verification request', auth: true },
          { method: 'GET', path: '/requests', description: 'Get verification requests', auth: true },
          { method: 'PUT', path: '/requests/:id/review', description: 'Review verification request', auth: true, roles: ['admin'] },
          { method: 'GET', path: '/trust-score', description: 'Get user trust score', auth: true },
          { method: 'POST', path: '/disputes', description: 'Create dispute', auth: true },
          { method: 'GET', path: '/disputes', description: 'Get user disputes', auth: true },
          { method: 'PUT', path: '/disputes/:id/resolve', description: 'Resolve dispute', auth: true, roles: ['admin'] }
        ]
      },
      communication: {
        base: '/api/communication',
        description: 'Real-time communication and messaging',
        routes: [
          { method: 'POST', path: '/conversations', description: 'Create or get conversation', auth: true },
          { method: 'GET', path: '/conversations', description: 'Get user conversations', auth: true },
          { method: 'POST', path: '/messages', description: 'Send message', auth: true },
          { method: 'GET', path: '/conversations/:id/messages', description: 'Get conversation messages', auth: true },
          { method: 'GET', path: '/notifications', description: 'Get user notifications', auth: true },
          { method: 'PUT', path: '/notifications/:id/read', description: 'Mark notification as read', auth: true },
          { method: 'PUT', path: '/notifications/read-all', description: 'Mark all notifications as read', auth: true }
        ]
      },
      analytics: {
        base: '/api/analytics',
        description: 'Analytics and insights dashboard',
        routes: [
          { method: 'POST', path: '/track', description: 'Track analytics event', auth: true },
          { method: 'GET', path: '/user', description: 'Get user analytics', auth: true },
          { method: 'GET', path: '/services/:serviceId', description: 'Get service analytics', auth: true },
          { method: 'GET', path: '/platform', description: 'Get platform analytics', auth: true, roles: ['admin'] },
          { method: 'GET', path: '/dashboard', description: 'Get dashboard data', auth: true }
        ]
      },
      maps: {
        base: '/api/maps',
        description: 'Google Maps integration and location services',
        routes: [
          { method: 'POST', path: '/geocode', description: 'Convert address to coordinates', auth: false },
          { method: 'POST', path: '/reverse-geocode', description: 'Convert coordinates to address', auth: false },
          { method: 'POST', path: '/places/search', description: 'Search for places', auth: false },
          { method: 'GET', path: '/places/:placeId', description: 'Get place details', auth: false },
          { method: 'POST', path: '/distance', description: 'Calculate distance between points', auth: false },
          { method: 'POST', path: '/nearby', description: 'Find nearby places', auth: false },
          { method: 'POST', path: '/validate-service-area', description: 'Validate service area coverage', auth: false },
          { method: 'POST', path: '/analyze-coverage', description: 'Analyze service coverage', auth: true },
          { method: 'GET', path: '/test', description: 'Test Google Maps API connection', auth: true, roles: ['admin'] }
        ]
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Some endpoints require specific roles (admin, provider, instructor)'
    },
    rateLimiting: {
      window: '15 minutes',
      limit: '100 requests per IP',
      scope: '/api/*'
    },
    support: {
      documentation: 'Contact API support for detailed documentation',
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LocalPro Super App API is running',
    timestamp: new Date().toISOString()
  });
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 LocalPro Super App API running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});
