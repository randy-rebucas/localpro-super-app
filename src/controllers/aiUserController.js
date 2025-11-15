const aiService = require('../services/aiService');
const User = require('../models/User');
const logger = require('../config/logger');
const { sendSuccess, sendServerError } = require('../utils/responseHelper');

// @desc    Generate user bio using AI (OpenAI)
// @route   POST /api/ai/users/bio-generator
// @access  AUTHENTICATED
// @note    Requires OPENAI_API_KEY environment variable to be set
const generateUserBio = async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    const currentUserId = req.user.id;

    // Determine which user's data to use
    let targetUserId = userId || currentUserId;
    
    // If requesting another user's bio generation, check permissions
    if (userId && userId !== currentUserId) {
      const userRoles = req.user.roles || [];
      const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to generate bio for other users',
          code: 'FORBIDDEN'
        });
      }
    }

    // Fetch user data
    const user = await User.findById(targetUserId)
      .select('firstName lastName roles gender birthdate profile skills experience')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prepare user data for AI
    const userData = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roles: user.roles || [],
      gender: user.gender,
      birthdate: user.birthdate,
      experience: user.profile?.experience || user.experience,
      skills: user.profile?.skills || user.skills || [],
      specialties: user.profile?.specialties || [],
      businessName: user.profile?.businessName,
      businessType: user.profile?.businessType,
      yearsInBusiness: user.profile?.yearsInBusiness,
      serviceAreas: user.profile?.serviceAreas || [],
      certifications: user.profile?.certifications || [],
      profile: {
        bio: user.profile?.bio,
        rating: user.profile?.rating,
        totalReviews: user.profile?.totalReviews
      }
    };

    // Validate preferences if provided
    const validPreferences = {};
    if (preferences) {
      if (preferences.tone && ['professional', 'friendly', 'casual', 'formal'].includes(preferences.tone)) {
        validPreferences.tone = preferences.tone;
      }
      if (preferences.length && ['short', 'medium', 'long'].includes(preferences.length)) {
        validPreferences.length = preferences.length;
      }
      if (preferences.focus && ['general', 'skills', 'experience', 'business', 'achievements'].includes(preferences.focus)) {
        validPreferences.focus = preferences.focus;
      }
    }

    // Generate bio using AI
    const aiResponse = await aiService.generateUserBio(userData, validPreferences);
    
    const result = aiResponse.parsed || {
      bio: aiResponse.content || 'Unable to generate bio at this time.',
      highlights: [],
      suggestedTags: [],
      wordCount: 0
    };

    // Ensure bio is a string
    if (typeof result.bio !== 'string') {
      result.bio = JSON.stringify(result.bio);
    }

    logger.info('User bio generated successfully', {
      userId: targetUserId,
      generatedBy: currentUserId,
      wordCount: result.wordCount || 0
    });

    return sendSuccess(res, {
      bio: result.bio,
      highlights: result.highlights || [],
      suggestedTags: result.suggestedTags || [],
      wordCount: result.wordCount || result.bio.split(/\s+/).length,
      preferences: validPreferences,
      usage: aiResponse.usage
    }, 'Bio generated successfully');
  } catch (error) {
    logger.error('Bio generator error', {
      error: error.message,
      stack: error.stack,
      userId: req.body.userId || req.user.id
    });
    return sendServerError(res, error, 'Failed to generate bio', 'BIO_GENERATOR_ERROR');
  }
};

module.exports = {
  generateUserBio
};

