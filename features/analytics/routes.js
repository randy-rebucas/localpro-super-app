// Analytics feature routes (migrated)
const express = require('express');
const { query, param } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const analyticsController = require('./controller');

const router = express.Router();

// Validation middleware
const timeframeValidation = [
  query('timeframe')
    .optional()
    .isIn(['1h', '24h', '7d', '30d', '90d', '1y'])
    .withMessage('Invalid timeframe. Must be one of: 1h, 24h, 7d, 30d, 90d, 1y')
];

const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];

// All routes require authentication
router.use(auth);

// ...existing code for analytics endpoints...

module.exports = router;
