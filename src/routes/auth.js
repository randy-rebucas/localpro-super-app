const express = require('express');
const { auth } = require('../middleware/auth');
const {
  sendVerificationCode,
  verifyCode,
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
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/upload-avatar', auth, uploaders.userProfiles.single('avatar'), uploadAvatar);
router.post('/upload-portfolio', auth, uploaders.userProfiles.array('images', 5), uploadPortfolioImages);
router.post('/logout', auth, logout);

module.exports = router;
