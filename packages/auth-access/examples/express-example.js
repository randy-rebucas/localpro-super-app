/**
 * Express.js Example
 * Demonstrates how to use @localpro/auth-access with Express
 */

const express = require('express');
const { initAuth, authMiddleware, requireScopes, requireRole } = require('@localpro/auth-access');

const app = express();
app.use(express.json());

// Initialize auth access
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER || 'localpro',
  publicKey: process.env.AUTH_PUBLIC_KEY, // For validating tokens
  defaultExpiresIn: '1h'
});

// Attach to app for middleware access
app.locals.authAccess = authAccess;

// Public route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected route - requires valid token and active subscription
app.get('/api/profile', authMiddleware(), (req, res) => {
  res.json({
    partnerId: req.partnerId,
    role: req.role,
    scopes: req.scopes,
    user: req.user
  });
});

// Premium role required
app.get('/api/premium/data', requireRole('partner:premium'), (req, res) => {
  res.json({
    data: 'This is premium content',
    partnerId: req.partnerId
  });
});

// Specific scopes required
app.get('/api/analytics', requireScopes(['read:analytics']), (req, res) => {
  res.json({
    analytics: {
      views: 1000,
      conversions: 50
    }
  });
});

// Admin role required
app.get('/api/admin/users', requireRole('admin'), (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ]
  });
});

// Custom middleware with multiple requirements
app.get('/api/premium/analytics', 
  authMiddleware({
    requiredRole: 'partner:premium',
    requiredScopes: ['read:analytics']
  }),
  (req, res) => {
    res.json({
      premiumAnalytics: {
        revenue: 10000,
        growth: '15%'
      }
    });
  }
);

// Error handling
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Auth access initialized');
});
