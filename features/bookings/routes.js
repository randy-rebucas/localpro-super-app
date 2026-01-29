// Bookings/Marketplace feature routes (migrated)
const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const {
  validateObjectIdParam,
  validatePaginationParams,
  validateSearchParams
} = require('../../middleware/routeValidation');
const marketplaceController = require('./controller');
const { uploaders } = require('../../config/cloudinary');

const router = express.Router();

// ...existing code for marketplace and booking endpoints...

module.exports = router;
