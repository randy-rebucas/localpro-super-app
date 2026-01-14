const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/routeValidation');
const { smsLimiter, authLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const {
  sendVerificationCode,
  verifyCode,
  registerWithEmail,
  loginWithEmail,
  verifyEmailOTP,
  checkEmail,
  setPassword,
  getMe,
  updateProfile,
  uploadAvatar,
  uploadPortfolioImages,
  refreshToken,
  logout,
  // MPIN functions
  setMpin,
  verifyMpin,
  loginWithMpin,
  disableMpin,
  getMpinStatus
} = require('../controllers/authController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: Password123
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           example: Doe
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: abc123def456...
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: ObjectId
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             roles:
 *               type: array
 *               items:
 *                 type: string
 *             isVerified:
 *               type: boolean
 *         isNewUser:
 *           type: boolean
 *     SendCodeRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *       properties:
 *         phoneNumber:
 *           type: string
 *           pattern: '^\\+[1-9]\\d{1,14}$'
 *           example: +1234567890
 *     VerifyCodeRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - code
 *       properties:
 *         phoneNumber:
 *           type: string
 *           pattern: '^\\+[1-9]\\d{1,14}$'
 *           example: +1234567890
 *         code:
 *           type: string
 *           pattern: '^\\d{6}$'
 *           example: "123456"
 */

// Validation middleware for register and login
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// MPIN validation middleware
const validateSetMpin = [
  body('mpin')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('MPIN must be 4-6 digits')
];

const validateVerifyMpin = [
  body('mpin')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('MPIN must be 4-6 digits')
];

const validateLoginWithMpin = [
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('mpin')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('MPIN must be 4-6 digits')
];

// Public routes with specific rate limiting (skip in test for validation testing)
if (process.env.NODE_ENV === 'test') {
  // In test mode, skip rate limiters for easier validation testing
  router.post('/send-code', sendVerificationCode);
  router.post('/verify-code', verifyCode);
  router.post('/register-email', registerWithEmail);
  router.post('/login-email', loginWithEmail);
  router.post('/verify-email-otp', verifyEmailOTP);
  router.post('/check-email', checkEmail);
  router.post('/set-password', setPassword);
  router.post('/refresh', refreshToken);
} else {
  // Production: apply rate limiters
  router.post('/send-code', smsLimiter, sendVerificationCode);
  router.post('/verify-code', authLimiter, verifyCode);
  router.post('/register-email', authLimiter, registerWithEmail);
  router.post('/login-email', authLimiter, loginWithEmail);
  router.post('/verify-email-otp', authLimiter, verifyEmailOTP);
  router.post('/check-email', authLimiter, checkEmail);
  router.post('/set-password', authLimiter, setPassword);
  router.post('/refresh', authLimiter, refreshToken);
}

// Public route aliases for documented API
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
 */
if (process.env.NODE_ENV === 'test') {
  router.post('/register', validateRegister, registerWithEmail);
} else {
  router.post('/register', authLimiter, validateRegister, registerWithEmail);
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
if (process.env.NODE_ENV === 'test') {
  router.post('/login', validateLogin, loginWithEmail);
} else {
  router.post('/login', authLimiter, validateLogin, loginWithEmail);
}

// Protected routes
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', auth, getMe);

// MPIN routes
/**
 * @swagger
 * /api/auth/mpin/set:
 *   post:
 *     summary: Set MPIN for user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mpin
 *             properties:
 *               mpin:
 *                 type: string
 *                 pattern: '^\d{4,6}$'
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: MPIN set successfully
 *       400:
 *         description: Invalid MPIN format or mismatch
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/mpin/set', auth, validateSetMpin, setMpin);

/**
 * @swagger
 * /api/auth/mpin/verify:
 *   post:
 *     summary: Verify MPIN
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mpin
 *             properties:
 *               mpin:
 *                 type: string
 *                 pattern: '^\d{4,6}$'
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: MPIN verified successfully
 *       400:
 *         description: Invalid MPIN or account locked
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/mpin/verify', auth, validateVerifyMpin, verifyMpin);

/**
 * @swagger
 * /api/auth/mpin/login:
 *   post:
 *     summary: Login with MPIN
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - mpin
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *                 example: "+1234567890"
 *               mpin:
 *                 type: string
 *                 pattern: '^\d{4,6}$'
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                             refreshToken:
 *                               type: string
 *                             refreshTokenExpiresAt:
 *                               type: string
 *                               format: date-time
 *       401:
 *         description: Invalid credentials or MPIN locked
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/mpin/login', validateLoginWithMpin, loginWithMpin);

/**
 * @swagger
 * /api/auth/mpin/status:
 *   get:
 *     summary: Get MPIN status
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MPIN status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         locked:
 *                           type: boolean
 *                         attempts:
 *                           type: number
 *                         lockedUntil:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/mpin/status', auth, getMpinStatus);

/**
 * @swagger
 * /api/auth/mpin:
 *   delete:
 *     summary: Disable MPIN
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MPIN disabled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/mpin', auth, disableMpin);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile (alias for /me)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', auth, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               profile:
 *                 type: object
 *                 properties:
 *                   bio:
 *                     type: string
 *                   location:
 *                     type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/profile', auth, updateProfile);

// Avatar upload routes - support both documented and existing endpoints
const avatarUploadMiddleware = [
  auth, 
  uploadLimiter,
  uploaders.userProfiles.single('avatar'), 
  validateFileUpload({ maxSize: 2 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] }),
  uploadAvatar
];

// POST /api/auth/avatar - documented endpoint
router.post('/avatar', ...avatarUploadMiddleware);

// POST /api/auth/upload-avatar - existing endpoint (keep for backward compatibility)
router.post('/upload-avatar', ...avatarUploadMiddleware);
router.post('/upload-portfolio', 
  auth, 
  uploadLimiter,
  uploaders.userProfiles.array('images', 5), 
  validateFileUpload({ maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif'] }),
  uploadPortfolioImages
);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', auth, logout);

module.exports = router;
