const express = require('express');
const { auth } = require('../middleware/auth');
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
  logout
} = require('../controllers/authController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

// Protected routes
router.use(auth); // Apply authentication to all routes below

// Profile routes
router.get('/me', getMe);
router.get('/profile-completeness', getProfileCompleteness);
router.put('/profile', updateProfile);

// Onboarding route
router.post('/complete-onboarding', completeOnboarding);

// Upload routes with validation
router.post('/upload-avatar', 
  uploaders.userProfiles.single('avatar'),
  validateFileUpload({ maxSize: 2 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] }),
  uploadAvatar
);

router.post('/upload-portfolio', 
  uploaders.userProfiles.array('images', 5),
  validateFileUpload({ maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif'] }),
  uploadPortfolioImages
);

// Logout route
router.post('/logout', logout);

module.exports = router;
