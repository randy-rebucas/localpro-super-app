const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createCheckout,
  getCheckout,
  createPayment,
  getPayment,
  createInvoice,
  getInvoice,
  handlePayMayaWebhook,
  getWebhookEvents,
  validateConfig
} = require('../controllers/paymayaController');

const router = express.Router();

// Validation middleware
const checkoutValidation = [
  body('totalAmount')
    .isNumeric()
    .withMessage('Total amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Total amount must be greater than 0'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  body('referenceId')
    .notEmpty()
    .withMessage('Reference ID is required')
    .isLength({ max: 50 })
    .withMessage('Reference ID must be less than 50 characters'),
  body('buyer.firstName')
    .notEmpty()
    .withMessage('Buyer first name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('buyer.lastName')
    .notEmpty()
    .withMessage('Buyer last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('buyer.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('buyer.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('currency')
    .optional()
    .isIn(['PHP'])
    .withMessage('Currency must be PHP'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('redirectUrl.success')
    .optional()
    .isURL()
    .withMessage('Success redirect URL must be valid'),
  body('redirectUrl.failure')
    .optional()
    .isURL()
    .withMessage('Failure redirect URL must be valid'),
  body('redirectUrl.cancel')
    .optional()
    .isURL()
    .withMessage('Cancel redirect URL must be valid')
];

const paymentValidation = [
  body('vaultId')
    .notEmpty()
    .withMessage('Vault ID is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('referenceId')
    .notEmpty()
    .withMessage('Reference ID is required')
    .isLength({ max: 50 })
    .withMessage('Reference ID must be less than 50 characters'),
  body('buyer.firstName')
    .notEmpty()
    .withMessage('Buyer first name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('buyer.lastName')
    .notEmpty()
    .withMessage('Buyer last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('buyer.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('buyer.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('currency')
    .optional()
    .isIn(['PHP'])
    .withMessage('Currency must be PHP'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters')
];

const invoiceValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  body('referenceId')
    .notEmpty()
    .withMessage('Reference ID is required')
    .isLength({ max: 50 })
    .withMessage('Reference ID must be less than 50 characters'),
  body('buyer.firstName')
    .notEmpty()
    .withMessage('Buyer first name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('buyer.lastName')
    .notEmpty()
    .withMessage('Buyer last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('buyer.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('buyer.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('currency')
    .optional()
    .isIn(['PHP'])
    .withMessage('Currency must be PHP'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('redirectUrl.success')
    .optional()
    .isURL()
    .withMessage('Success redirect URL must be valid'),
  body('redirectUrl.failure')
    .optional()
    .isURL()
    .withMessage('Failure redirect URL must be valid'),
  body('redirectUrl.cancel')
    .optional()
    .isURL()
    .withMessage('Cancel redirect URL must be valid')
];

// Webhook route (no auth required - PayMaya calls this directly)
router.post('/webhook', handlePayMayaWebhook);

// All other routes require authentication
router.use(auth);

// Checkout routes
router.post('/checkout', checkoutValidation, createCheckout);
router.get('/checkout/:checkoutId', getCheckout);

// Payment routes
router.post('/payment', paymentValidation, createPayment);
router.get('/payment/:paymentId', getPayment);

// Invoice routes
router.post('/invoice', invoiceValidation, createInvoice);
router.get('/invoice/:invoiceId', getInvoice);

// Admin routes
router.use(authorize('admin'));

// Configuration validation
router.get('/config/validate', validateConfig);

// Webhook events (for debugging/admin purposes)
router.get('/webhook/events', getWebhookEvents);

module.exports = router;
