const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploaders } = require('../config/cloudinary');

const {
  createAgency,
  getAgencies,
  getAgency,
  updateAgency,
  deleteAgency,
  uploadAgencyLogo,
  addProvider,
  removeProvider,
  updateProviderStatus,
  addAdmin,
  removeAdmin,
  getAgencyAnalytics,
  getMyAgencies,
  joinAgency,
  leaveAgency,
  updateAgencyVerification
} = require('../controllers/agencyController');

// Validation middleware
const createAgencyValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Agency name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Valid phone number is required'),
  body('businessInfo.industry')
    .isIn(['cleaning', 'maintenance', 'construction', 'logistics', 'healthcare', 'education', 'technology', 'other'])
    .withMessage('Valid industry is required'),
  body('businessInfo.businessType')
    .optional()
    .isIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'non_profit'])
    .withMessage('Valid business type is required')
];

const updateAgencyValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Agency name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Valid phone number is required')
];

// Public routes
router.get('/', getAgencies); // Get all agencies (public)
router.get('/:id', getAgency); // Get single agency (public)

// Protected routes
router.use(auth); // All routes below require authentication

// Agency verification management
router.patch('/:id/verification', updateAgencyVerification); // Update agency verification

// Agency management routes
router.post('/', createAgencyValidation, createAgency); // Create agency
router.put('/:id', updateAgencyValidation, updateAgency); // Update agency
router.delete('/:id', deleteAgency); // Delete agency
router.post('/:id/logo', uploaders.userProfiles.single('logo'), uploadAgencyLogo); // Upload logo

// Provider management routes
router.post('/:id/providers', addProvider); // Add provider
router.delete('/:id/providers/:providerId', removeProvider); // Remove provider
router.put('/:id/providers/:providerId/status', updateProviderStatus); // Update provider status

// Admin management routes
router.post('/:id/admins', addAdmin); // Add admin
router.delete('/:id/admins/:adminId', removeAdmin); // Remove admin

// Analytics routes
router.get('/:id/analytics', getAgencyAnalytics); // Get agency analytics

// User agency routes
router.get('/my/agencies', getMyAgencies); // Get my agencies
router.post('/join', joinAgency); // Join agency
router.post('/leave', leaveAgency); // Leave agency

module.exports = router;
