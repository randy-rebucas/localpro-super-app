const User = require('../models/User');
const TwilioService = require('../services/twilioService');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenPair,
  isOnboardingComplete 
} = require('../config/jwt');
const logger = require('../config/logger');
// const { authLimiter, verificationLimiter } = require('../middleware/rateLimiter'); // Rate limiting disabled

// Helper function to validate phone number format
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

// Helper function to validate verification code format
const validateVerificationCode = (code) => {
  return code && code.length === 6 && /^\d{6}$/.test(code);
};

// Helper function to get client IP and user agent
const getClientInfo = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date()
  };
};

// @desc    Send verification code
// @route   POST /api/auth/send-code
// @access  Public
const sendVerificationCode = async(req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { phoneNumber } = req.body;

    // Input validation
    if (!phoneNumber) {
      logger.warn('Send verification code failed: Missing phone number', {
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE_NUMBER'
      });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      logger.warn('Send verification code failed: Invalid phone number format', {
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use international format (e.g., +1234567890)',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    const isNewUser = !existingUser;

    // Rate limiting check (prevent spam)
    if (existingUser) {
      const lastVerification = existingUser.lastVerificationSent;
      const now = new Date();
      const timeDiff = now - lastVerification;

      // Allow only one verification per minute
      if (lastVerification && timeDiff < 60000) {
        logger.warn('Send verification code failed: Rate limit exceeded', {
          phoneNumber: phoneNumber.substring(0, 5) + '***',
          clientInfo,
          duration: Date.now() - startTime
        });
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting another verification code',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((60000 - timeDiff) / 1000)
        });
      }
    }

    // Send verification code via Twilio
    const result = await TwilioService.sendVerificationCode(phoneNumber);

    if (!result.success) {
      logger.error('Twilio verification code send failed', {
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        error: result.error,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        code: 'SMS_SEND_FAILED'
      });
    }

    // Update user's last verification sent time
    if (existingUser) {
      existingUser.lastVerificationSent = new Date();
      await existingUser.save();
    }

    logger.info('Verification code sent successfully', {
      phoneNumber: phoneNumber.substring(0, 5) + '***',
      isNewUser,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      isNewUser
    });
  } catch (error) {
    logger.error('Send verification code error', {
      error: error.message,
      stack: error.stack,
      clientInfo
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};


// @desc    Verify code and register/login user
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async(req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { phoneNumber, code } = req.body;

    // Input validation
    if (!phoneNumber || !code) {
      logger.warn('Verify code failed: Missing required fields', {
        hasPhoneNumber: !!phoneNumber,
        hasCode: !!code,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate inputs
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    if (!validateVerificationCode(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code format. Please enter a 6-digit code',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    // Verify code with Twilio
    const verificationResult = await TwilioService.verifyCode(phoneNumber, code);

    if (!verificationResult.success) {
      logger.warn('Verification code verification failed', {
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        code: code.substring(0, 2) + '****',
        status: verificationResult.status,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
        code: 'INVALID_VERIFICATION_CODE'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (user) {
      // Existing user - update verification status and login info
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verification.phoneVerified = true;
      user.lastLoginAt = new Date();
      user.lastLoginIP = clientInfo.ip;
      user.loginCount += 1;
      user.status = 'active';

      // Update activity tracking
      user.activity.lastActiveAt = new Date();
      user.activity.totalSessions += 1;

      // Update device info
      const deviceType = user.getDeviceType(clientInfo.userAgent);
      const existingDevice = user.activity.deviceInfo.find(device =>
        device.deviceType === deviceType && device.userAgent === clientInfo.userAgent
      );

      if (existingDevice) {
        existingDevice.lastUsed = new Date();
      } else {
        user.activity.deviceInfo.push({
          deviceType,
          userAgent: clientInfo.userAgent,
          lastUsed: new Date()
        });
      }

      await user.save();

      // Check if user has completed onboarding
      const onboardingComplete = isOnboardingComplete(user);

      // Generate token pair
      const tokenData = generateTokenPair(user);
      const token = tokenData.accessToken;

      logger.info('Existing user login successful', {
        userId: user._id,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        onboardingComplete,
        clientInfo,
        duration: Date.now() - startTime
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: token,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          subscription: user.subscription,
          trustScore: user.trustScore,
          profile: {
            avatar: user.profile.avatar,
            bio: user.profile.bio
          }
        },
        redirect: {
          destination: onboardingComplete ? 'dashboard' : 'onboarding',
          reason: onboardingComplete
            ? 'User has complete profile information'
            : 'User needs to complete profile setup'
        }
      });
    } else {
      // New user - create minimal user record
      user = await User.create({
        phoneNumber,
        isVerified: true,
        verification: {
          phoneVerified: true
        },
        status: 'pending_verification',
        lastLoginAt: new Date(),
        lastLoginIP: clientInfo.ip,
        loginCount: 1,
        activity: {
          lastActiveAt: new Date(),
          totalSessions: 1,
          deviceInfo: [{
            deviceType: 'mobile', // Default for new users
            userAgent: clientInfo.userAgent,
            lastUsed: new Date()
          }]
        }
      });

      // Generate token pair
      const tokenData = generateTokenPair(user);
      const token = tokenData.accessToken;

      logger.info('New user registration successful', {
        userId: user._id,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please complete your profile.',
        accessToken: token,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          subscription: user.subscription,
          trustScore: user.trustScore
        },
        redirect: {
          destination: 'onboarding',
          reason: 'New user needs to provide personal information'
        }
      });
    }
  } catch (error) {
    logger.error('Verify code error', {
      error: error.message,
      stack: error.stack,
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Complete user onboarding
// @route   POST /api/auth/complete-onboarding
// @access  Private
const completeOnboarding = async(req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!firstName || !lastName || !email) {
      logger.warn('Complete onboarding failed: Missing required fields', {
        userId,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasEmail: !!email,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate input lengths and formats
    if (firstName.length < 2 || firstName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters',
        code: 'INVALID_FIRST_NAME_LENGTH'
      });
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters',
        code: 'INVALID_LAST_NAME_LENGTH'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId }
    });

    if (existingUser) {
      logger.warn('Complete onboarding failed: Email already exists', {
        userId,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email is already registered with another account',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Get current user to preserve existing data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user with onboarding information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        verification: {
          ...currentUser.verification,
          emailVerified: false // Will need email verification
        },
        status: 'active',
        // Generate referral code for new users
        $set: {
          'referral.referralCode': currentUser.referral.referralCode || currentUser.generateReferralCode()
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Send welcome email to new user
    try {
      await EmailService.sendWelcomeEmail(email, firstName);
      logger.info('Welcome email sent successfully', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: emailError.message,
        clientInfo,
        duration: Date.now() - startTime
      });
      // Don't fail the onboarding if email fails
    }

    // Generate new token with updated user info
    const tokenData = generateTokenPair(user);
    const token = tokenData.accessToken;

    logger.info('Onboarding completed successfully', {
      userId: user._id,
      phoneNumber: user.phoneNumber.substring(0, 5) + '***',
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      accessToken: token,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
        trustScore: user.trustScore,
        referral: {
          referralCode: user.referral.referralCode
        },
        profile: {
          avatar: user.profile.avatar,
          bio: user.profile.bio
        }
      },
      redirect: {
        destination: 'dashboard',
        reason: 'User onboarding completed successfully'
      }
    });
  } catch (error) {
    logger.error('Complete onboarding error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Check profile completeness status
// @route   GET /api/auth/profile-completeness
// @access  Private
const getProfileCompleteness = async(req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Define required fields for profile completion
    const requiredFields = {
      basic: ['firstName', 'lastName', 'email'],
      profile: ['profile.bio', 'profile.address.city', 'profile.address.state'],
      verification: ['verification.phoneVerified', 'verification.emailVerified']
    };

    // Check completion status for each category
    const completeness = {
      basic: {
        completed: true,
        missing: [],
        percentage: 0
      },
      profile: {
        completed: false,
        missing: [],
        percentage: 0
      },
      verification: {
        completed: false,
        missing: [],
        percentage: 0
      },
      overall: {
        completed: false,
        percentage: 0,
        missingFields: [],
        nextSteps: []
      }
    };

    // Check basic information
    requiredFields.basic.forEach(field => {
      if (!user[field]) {
        completeness.basic.completed = false;
        completeness.basic.missing.push(field);
      }
    });
    completeness.basic.percentage = Math.round(
      ((requiredFields.basic.length - completeness.basic.missing.length) / requiredFields.basic.length) * 100
    );

    // Check profile information
    requiredFields.profile.forEach(field => {
      const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], user);
      if (!fieldValue) {
        completeness.profile.missing.push(field);
      }
    });
    completeness.profile.completed = completeness.profile.missing.length === 0;
    completeness.profile.percentage = Math.round(
      ((requiredFields.profile.length - completeness.profile.missing.length) / requiredFields.profile.length) * 100
    );

    // Check verification status
    requiredFields.verification.forEach(field => {
      const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], user);
      if (!fieldValue) {
        completeness.verification.missing.push(field);
      }
    });
    completeness.verification.completed = completeness.verification.missing.length === 0;
    completeness.verification.percentage = Math.round(
      ((requiredFields.verification.length - completeness.verification.missing.length) / requiredFields.verification.length) * 100
    );

    // Calculate overall completion
    const totalFields = requiredFields.basic.length + requiredFields.profile.length + requiredFields.verification.length;
    const completedFields = totalFields - [
      ...completeness.basic.missing,
      ...completeness.profile.missing,
      ...completeness.verification.missing
    ].length;

    completeness.overall.percentage = Math.round((completedFields / totalFields) * 100);
    completeness.overall.completed = completeness.overall.percentage === 100;
    completeness.overall.missingFields = [
      ...completeness.basic.missing,
      ...completeness.profile.missing,
      ...completeness.verification.missing
    ];

    // Generate next steps based on missing fields
    const nextSteps = [];
    if (completeness.basic.missing.length > 0) {
      nextSteps.push({
        priority: 'high',
        action: 'complete_basic_info',
        title: 'Complete Basic Information',
        description: 'Add your first name, last name, and email address',
        fields: completeness.basic.missing
      });
    }

    if (completeness.profile.missing.length > 0 && completeness.basic.completed) {
      nextSteps.push({
        priority: 'medium',
        action: 'complete_profile',
        title: 'Complete Your Profile',
        description: 'Add bio and location information',
        fields: completeness.profile.missing
      });
    }

    if (completeness.verification.missing.length > 0 && completeness.basic.completed) {
      nextSteps.push({
        priority: 'medium',
        action: 'verify_account',
        title: 'Verify Your Account',
        description: 'Complete email verification for enhanced security',
        fields: completeness.verification.missing
      });
    }

    completeness.overall.nextSteps = nextSteps;

    // Determine if user can access dashboard
    const canAccessDashboard = completeness.basic.completed;
    const needsOnboarding = !completeness.basic.completed;

    logger.info('Profile completeness checked', {
      userId: user._id,
      overallPercentage: completeness.overall.percentage,
      canAccessDashboard,
      needsOnboarding,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      data: {
        completeness,
        canAccessDashboard,
        needsOnboarding,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          trustScore: user.trustScore
        }
      }
    });
  } catch (error) {
    logger.error('Profile completeness check error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async(req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async(req, res) => {
  try {
    const { firstName, lastName, email, profile } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        profile: { ...req.user.profile, ...profile }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async(req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file,
      'localpro/users/profiles'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: uploadResult.error
      });
    }

    // Delete old avatar if exists
    if (user.profile.avatar && user.profile.avatar.publicId) {
      await CloudinaryService.deleteFile(user.profile.avatar.publicId);
    }

    // Update user profile with new avatar
    user.profile.avatar = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id,
      thumbnail: CloudinaryService.getOptimizedUrl(uploadResult.data.public_id, 'thumbnail')
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.profile.avatar
      }
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload portfolio images
// @route   POST /api/auth/upload-portfolio
// @access  Private
const uploadPortfolioImages = async(req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const userId = req.user.id;
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload multiple files to Cloudinary
    const uploadResult = await CloudinaryService.uploadMultipleFiles(
      req.files,
      'localpro/users/portfolio'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload portfolio images',
        error: uploadResult.error
      });
    }

    // Create portfolio entry
    const portfolioEntry = {
      title,
      description,
      category,
      images: uploadResult.data.map(file => ({
        url: file.secure_url,
        publicId: file.public_id,
        thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail')
      })),
      completedAt: new Date()
    };

    user.profile.portfolio.push(portfolioEntry);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Portfolio images uploaded successfully',
      data: portfolioEntry
    });
  } catch (error) {
    logger.error('Upload portfolio images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async(req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token failed: No refresh token provided', {
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token is a refresh token
    if (decoded.type !== 'refresh') {
      logger.warn('Refresh token failed: Invalid token type', {
        tokenType: decoded.type,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user and check if they still exist and are active
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      logger.warn('Refresh token failed: User not found or inactive', {
        userId: decoded.id,
        userStatus: user?.status,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check token version for invalidation (if implemented)
    if (user.tokenVersion && decoded.tokenVersion !== user.tokenVersion) {
      logger.warn('Refresh token failed: Token version mismatch', {
        userId: user._id,
        expectedVersion: user.tokenVersion,
        tokenVersion: decoded.tokenVersion,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been invalidated',
        code: 'TOKEN_INVALIDATED'
      });
    }

    // Generate new token pair
    const tokenData = generateTokenPair(user);

    logger.info('Token refreshed successfully', {
      userId: user._id,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...tokenData
    });
  } catch (error) {
    logger.error('Refresh token error', {
      error: error.message,
      stack: error.stack,
      clientInfo,
      duration: Date.now() - startTime
    });

    let message = 'Invalid refresh token';
    let code = 'INVALID_REFRESH_TOKEN';

    if (error.name === 'TokenExpiredError') {
      message = 'Refresh token has expired';
      code = 'REFRESH_TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid refresh token';
      code = 'INVALID_REFRESH_TOKEN';
    }

    res.status(401).json({
      success: false,
      message,
      code
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async(req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. However, we can implement token blacklisting
    // or other server-side logout mechanisms here if needed.

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
