const express = require('express');
const { auth } = require('../middleware/auth');
// const { authLimiter, verificationLimiter } = require('../middleware/rateLimiter'); // Rate limiting disabled
const { validateFileUpload } = require('../middleware/routeValidation');
const {
  sendVerificationCode,
  verifyCode,
  completeOnboarding,
  getProfileCompleteness,
  getMe,
  updateProfile,
  uploadAvatar,
  uploadPortfolioImages,
  refreshToken,
  logout
} = require('../controllers/authController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes - rate limiting disabled
router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/complete-onboarding', auth, completeOnboarding);
router.get('/profile-completeness', auth, getProfileCompleteness);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/upload-avatar',
  auth,
  uploaders.userProfiles.single('avatar'),
  validateFileUpload({ maxSize: 2 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] }),
  uploadAvatar
);
router.post('/upload-portfolio',
  auth,
  uploaders.userProfiles.array('images', 5),
  validateFileUpload({ maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif'] }),
  uploadPortfolioImages
);
router.post('/logout', auth, logout);

module.exports = router;
