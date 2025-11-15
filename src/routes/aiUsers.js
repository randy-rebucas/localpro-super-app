const express = require('express');
const { auth } = require('../middleware/auth');
const { generateUserBio } = require('../controllers/aiUserController');

const router = express.Router();

// All AI user routes require authentication
router.use(auth);

// @route   POST /api/ai/users/bio-generator
// @desc    Generate user bio using AI
// @access  AUTHENTICATED
router.post('/bio-generator', generateUserBio);

module.exports = router;

