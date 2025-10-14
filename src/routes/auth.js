const express = require('express');
const { auth } = require('../middleware/auth');
const {
  sendVerificationCode,
  verifyCode,
  getMe,
  updateProfile,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/logout', auth, logout);

module.exports = router;
