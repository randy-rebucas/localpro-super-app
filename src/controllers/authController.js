const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TwilioService = require('../services/twilioService');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const logger = require('../config/logger');
const activityService = require('../services/activityService');
const { validationResult } = require('express-validator');

// Generate JWT Access Token with expiration
const generateToken = (user) => {
  const payload = {
    id: user._id,
    phoneNumber: user.phoneNumber,
    roles: user.roles || ['client'],
    isVerified: user.isVerified,
    type: 'access'
  };

  // Access token expires in 15 minutes
  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';

  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer: 'localpro-api',
    audience: 'localpro-mobile',
    expiresIn
  });
};

// Generate Refresh Token
const generateRefreshToken = () => {
  // Refresh token is a random string, not a JWT
  // It expires in 7 days by default
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
};

// Save refresh token to user
const saveRefreshToken = async (user, refreshToken) => {
  const expiresInDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || '7');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  user.refreshToken = refreshToken;
  user.refreshTokenExpiresAt = expiresAt;
  await user.save({ validateBeforeSave: false });

  return expiresAt;
};

// Clear refresh token from user
const clearRefreshToken = async (user) => {
  user.refreshToken = null;
  user.refreshTokenExpiresAt = null;
  await user.save({ validateBeforeSave: false });
};

// Helper function to check if user has completed onboarding
const isOnboardingComplete = (user) => {
  return !!(user.firstName && user.lastName && user.email);
};

// Helper function to validate phone number format
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

// Helper function to validate verification code format
const validateVerificationCode = (code) => {
  return code && code.length === 6 && /^\d{6}$/.test(code);
};

// Helper function to validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to get client IP and user agent
const getClientInfo = (req) => {
  return {
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    userAgent: (req.get ? req.get('User-Agent') : (req.headers && req.headers['user-agent'])) || 'unknown',
    timestamp: new Date()
  };
};

// Helper function to determine device type from user agent
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

// @desc    Send verification code
// @route   POST /api/auth/send-code
// @access  Public
const sendVerificationCode = async (req, res) => {
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
      try {
        // Set flag to skip related document creation in post-save hook
        existingUser._skipRelatedDocumentsCreation = true;
        await existingUser.save({ validateBeforeSave: false });
        existingUser._skipRelatedDocumentsCreation = false;
      } catch (saveError) {
        existingUser._skipRelatedDocumentsCreation = false;
        logger.error('Failed to update lastVerificationSent', {
          error: saveError.message,
          stack: saveError.stack,
          userId: existingUser._id,
          phoneNumber: phoneNumber.substring(0, 5) + '***',
          clientInfo,
          duration: Date.now() - startTime
        });
        // Continue even if save fails - verification code was already sent
      }
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
      phoneNumber: req.body?.phoneNumber ? req.body.phoneNumber.substring(0, 5) + '***' : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};


// @desc    Verify code and register/login user
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
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
    let verificationResult;
    try {
      verificationResult = await TwilioService.verifyCode(phoneNumber, code);
    } catch (error) {
      logger.error('Twilio verification error', {
        error: error.message,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(500).json({
        success: false,
        message: 'Verification service error',
        code: 'VERIFICATION_SERVICE_ERROR'
      });
    }

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

    // Verify database connection
    try {
      const mongoose = require('mongoose');
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        logger.error('Database connection not available', {
          phoneNumber: phoneNumber.substring(0, 5) + '***',
          clientInfo,
          duration: Date.now() - startTime
        });
        return res.status(500).json({
          success: false,
          message: 'Database service unavailable',
          code: 'DATABASE_UNAVAILABLE'
        });
      }
    } catch (error) {
      logger.error('Database connection check failed', {
        error: error.message,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(500).json({
        success: false,
        message: 'Database service error',
        code: 'DATABASE_ERROR'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (user) {
      // Existing user - update verification status and login info
      user.isVerified = true;
      await user.verify('phone');
      user.verificationCode = undefined;
      // Update login info and status via management
      await user.updateLoginInfo(clientInfo.ip, clientInfo.userAgent);
      await user.updateStatus('active', null, null);

      // Set flag to skip related document creation in post-save hook
      user._skipRelatedDocumentsCreation = true;
      try {
        await user.save({ validateBeforeSave: false });
      } finally {
        user._skipRelatedDocumentsCreation = false;
      }

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken();
      await saveRefreshToken(user, refreshToken);

      logger.info('Existing user login successful', {
        userId: user._id,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });

      // Track login activity (async, don't wait)
      activityService.trackLogin(user._id, {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        device: getDeviceType(clientInfo.userAgent)
      }).catch(err => logger.warn('Failed to track login activity', { error: err.message }));

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName ? user.firstName : 'User',
          lastName: user.lastName ? user.lastName : 'User',
          email: user.email,
          roles: user.roles || ['client'],
          isVerified: user.isVerified,
          subscription: user.localProPlusSubscription || null,
          trustScore: (await user.ensureTrust()).trustScore,
          profile: {
            avatar: user.profile?.avatar,
            bio: user.profile?.bio
          }
        },
        isNewUser: false
      });
    } else {
      // New user - create minimal user record with required fields
      // Note: status, lastLoginAt, lastLoginIP, loginCount are now in UserManagement
      // activity is now a reference to UserActivity (created via post-save hook)
      user = await User.create({
        phoneNumber,
        firstName: null,
        lastName: null,
        isVerified: true
        // Note: Trust, Activity, Management, Wallet, and Referral documents will be created automatically via post-save hook
      });

      // Update login info and status after user is created
      await user.updateLoginInfo(clientInfo.ip, clientInfo.userAgent);
      await user.updateStatus('active', null, null);

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken();
      await saveRefreshToken(user, refreshToken);

      logger.info('New user registration successful', {
        userId: user._id,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        clientInfo,
        duration: Date.now() - startTime
      });

      // Track registration activity (async, don't wait)
      activityService.trackRegistration(user._id, {
        firstName: user.firstName,
        lastName: user.lastName,
        method: 'phone'
      }).catch(err => logger.warn('Failed to track registration activity', { error: err.message }));

      const providedProfile = req.body && req.body.firstName && req.body.lastName && req.body.email;
      res.status(providedProfile ? 200 : 201).json({
        success: true,
        message: 'User registered and logged in successfully',
        token,
        refreshToken,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles || ['client'],
          isVerified: user.isVerified,
          subscription: user.localProPlusSubscription || null,
          trustScore: (await user.ensureTrust()).trustScore
        },
        isNewUser: true
      });
    }
  } catch (error) {
    logger.error('Verify code error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body?.phoneNumber ? req.body.phoneNumber.substring(0, 5) + '***' : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Complete user onboarding
// @route   POST /api/auth/complete-onboarding
// @access  Private
const completeOnboarding = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { firstName, lastName, email, roles, profile, gender, birthdate } = req.body;
    const userId = req.user.id;

    // Input validation - firstName and lastName are required, email is optional
    if (!firstName || !lastName) {
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
        message: 'First name and last name are required',
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

    // Validate email format only if email is provided
    if (email) {
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

    // Handle roles if provided (multi-role support)
    let rolesToSet = currentUser.roles || ['client'];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // Validate roles
      const validRoles = ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));

      if (invalidRoles.length > 0) {
        logger.warn('Complete onboarding failed: Invalid roles provided', {
          userId,
          invalidRoles,
          validRoles,
          clientInfo,
          duration: Date.now() - startTime
        });
        return res.status(400).json({
          success: false,
          message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}`,
          code: 'INVALID_ROLES'
        });
      }

      // Ensure 'client' is always present
      if (!roles.includes('client')) {
        rolesToSet = ['client', ...roles];
      } else {
        rolesToSet = [...new Set(['client', ...roles])]; // Remove duplicates, ensure 'client' is first
      }

      logger.info('Roles updated during onboarding', {
        userId,
        previousRoles: currentUser.roles,
        newRoles: rolesToSet,
        clientInfo,
        duration: Date.now() - startTime
      });
    }

    // Prepare update data
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roles: rolesToSet, // Multi-role support
      status: 'active'
    };

    // Only update email if provided
    if (email) {
      updateData.email = email.toLowerCase().trim();
    }

    // Handle gender if provided
    if (gender !== undefined) {
      // Validate gender enum value
      if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gender value. Must be one of: male, female, other, prefer_not_to_say',
          code: 'INVALID_GENDER'
        });
      }
      updateData.gender = gender || null;
    }

    // Handle birthdate if provided
    if (birthdate !== undefined) {
      // Convert birthdate string to Date if provided
      if (birthdate && typeof birthdate === 'string') {
        updateData.birthdate = new Date(birthdate);
      } else if (birthdate === null || birthdate === '') {
        updateData.birthdate = null;
      } else if (birthdate instanceof Date) {
        updateData.birthdate = birthdate;
      }
    }

    // Handle verification - preserve existing verification data
    if (currentUser.verification) {
      updateData.verification = {
        ...currentUser.verification,
        emailVerified: false // Will need email verification
      };
    } else {
      updateData.verification = {
        emailVerified: false
      };
    }

    // Handle profile data if provided
    if (profile) {
      updateData.profile = {
        ...(currentUser.profile || {}),
        ...(profile.bio && { bio: profile.bio.trim() }),
        ...(profile.address && {
          address: {
            ...(currentUser.profile?.address || {}),
            ...(profile.address.street && { street: profile.address.street.trim() }),
            ...(profile.address.city && { city: profile.address.city.trim() }),
            ...(profile.address.state && { state: profile.address.state.trim() }),
            ...(profile.address.zipCode && { zipCode: profile.address.zipCode.trim() }),
            ...(profile.address.country && { country: profile.address.country.trim() }),
            ...(profile.address.coordinates && { coordinates: profile.address.coordinates })
          }
        })
      };
    }

    // Update user with onboarding information
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate referral code if needed (after user is updated with firstName/lastName)
    // This uses the UserReferral model properly via the user's method
    try {
      await user.generateReferralCode();
    } catch (referralError) {
      logger.warn('Failed to generate referral code during onboarding', {
        userId: user._id,
        error: referralError.message,
        clientInfo,
        duration: Date.now() - startTime
      });
      // Don't fail onboarding if referral code generation fails
    }

    // Send welcome email to new user only if email is provided
    if (email) {
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
    }

    // Get referral code for response (populate referral if needed)
    let referralCode = null;
    try {
      const referral = await user.ensureReferral();
      referralCode = referral?.referralCode || null;
    } catch (referralError) {
      logger.warn('Failed to get referral code for response', {
        userId: user._id,
        error: referralError.message,
        clientInfo
      });
    }

    // Generate new tokens with updated user info
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken);

    logger.info('Onboarding completed successfully', {
      userId: user._id,
      phoneNumber: user.phoneNumber.substring(0, 5) + '***',
      email: user.email ? user.email.substring(0, 3) + '***@' + user.email.split('@')[1] : 'not provided',
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles || ['client'],
        isVerified: user.isVerified,
        subscription: user.localProPlusSubscription || null,
        trustScore: (await user.ensureTrust()).trustScore,
        referral: referralCode ? {
          referralCode: referralCode
        } : null,
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
      errorName: error.name,
      body: {
        firstName: req.body?.firstName,
        lastName: req.body?.lastName,
        email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : undefined,
        hasRoles: !!req.body?.roles,
        rolesCount: req.body?.roles?.length,
        hasProfile: !!req.body?.profile
      },
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Check if user needs to complete profile
// @route   GET /api/auth/profile-completion-status
// @access  Private
const getProfileCompletionStatus = async (req, res) => {
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

    // Check if user has completed basic profile information
    const isProfileComplete = isOnboardingComplete(user);

    logger.info('Profile completion status checked', {
      userId: user._id,
      isProfileComplete,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      data: {
        isProfileComplete,
        needsOnboarding: !isProfileComplete,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles || ['client'],
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    logger.error('Profile completion status check error', {
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
const getProfileCompleteness = async (req, res) => {
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
          roles: user.roles || ['client'],
          isVerified: user.isVerified,
          trustScore: (await user.ensureTrust()).trustScore
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
const getMe = async (req, res) => {
  try {
    const found = await User.findById(req.user.id);
    const user = found && typeof found.select === 'function' ? await found.select('-password') : found;
    if (!user) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, profile } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;

    if (profile !== undefined) {
      // Helper function to remove undefined values from object
      const removeUndefined = (obj) => {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
          return obj;
        }
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              const nested = removeUndefined(obj[key]);
              if (Object.keys(nested).length > 0) {
                cleaned[key] = nested;
              }
            } else {
              cleaned[key] = obj[key];
            }
          }
        });
        return cleaned;
      };

      // Helper function to deep merge objects, skipping undefined values
      const deepMerge = (target, source) => {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
          return source !== undefined ? source : target;
        }

        const result = { ...target };
        Object.keys(source).forEach(key => {
          if (source[key] === undefined) {
            // Skip undefined values - don't overwrite existing
            return;
          }

          if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
          ) {
            // Recursively merge nested objects
            result[key] = deepMerge(target[key], source[key]);
          } else {
            // Replace with new value (or set if doesn't exist)
            result[key] = source[key];
          }
        });
        return result;
      };

      // Clean profile data - remove undefined values
      const cleanedProfile = removeUndefined(profile);

      // Start with existing profile and merge cleaned profile
      const updatedProfile = deepMerge(
        user.profile || {},
        cleanedProfile
      );

      // Handle address coordinates conversion (GeoJSON to {lat, lng} format)
      if (cleanedProfile.address?.coordinates) {
        const coords = cleanedProfile.address.coordinates;

        // Check if coordinates are in GeoJSON format [lng, lat]
        if (Array.isArray(coords) && coords.length === 2) {
          updatedProfile.address = {
            ...updatedProfile.address,
            ...cleanedProfile.address,
            coordinates: {
              lat: parseFloat(coords[1]),  // GeoJSON: [lng, lat] -> {lat, lng}
              lng: parseFloat(coords[0])
            }
          };
        }
        // Check if coordinates are already in {lat, lng} format
        else if (typeof coords === 'object' && coords !== null && coords.lat !== undefined && coords.lng !== undefined) {
          updatedProfile.address = {
            ...updatedProfile.address,
            ...cleanedProfile.address,
            coordinates: {
              lat: parseFloat(coords.lat),
              lng: parseFloat(coords.lng)
            }
          };
        }
        // If format is invalid, remove coordinates to prevent errors
        else {
          console.warn('Invalid coordinates format received, removing coordinates');
          updatedProfile.address = {
            ...updatedProfile.address,
            ...cleanedProfile.address
          };
          delete updatedProfile.address.coordinates;
        }
      } else if (cleanedProfile.address) {
        // Merge address without coordinates
        updatedProfile.address = {
          ...(updatedProfile.address || {}),
          ...cleanedProfile.address
        };
      }

      // Final cleanup: Explicitly remove undefined values from nested objects that cause Mongoose casting errors
      // This must happen before assignment to prevent Mongoose from trying to cast undefined to Object
      const problematicFields = ['avatar', 'insurance', 'backgroundCheck', 'availability'];
      problematicFields.forEach(field => {
        // Remove if undefined or null
        if (updatedProfile[field] === undefined || updatedProfile[field] === null) {
          delete updatedProfile[field];
        }
      });

      // Additional safety: Clean the entire profile object one more time to catch any missed undefined values
      const finalClean = removeUndefined(updatedProfile);

      // Ensure problematic fields are completely removed if they're still undefined after cleaning
      problematicFields.forEach(field => {
        if (finalClean[field] === undefined) {
          delete finalClean[field];
        }
      });

      // Assign the fully cleaned profile
      user.profile = finalClean;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Upload profile avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    // Debug: Log file information
    console.log('=== Avatar Upload Debug ===');
    console.log('File object:', {
      hasFile: !!req.file,
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname,
      encoding: req.file?.encoding,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      hasBuffer: !!req.file?.buffer,
      hasPath: !!req.file?.path,
      path: req.file?.path,
      destination: req.file?.destination,
      filename: req.file?.filename
    });
    console.log('Request body:', req.body);
    console.log('==========================');

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

    // Check if file is already uploaded via CloudinaryStorage
    const isCloudinaryUploaded = req.file.secure_url || req.file.public_id ||
      (req.file.path && req.file.path.includes('cloudinary.com'));

    let avatarData;

    if (isCloudinaryUploaded) {
      // File already uploaded via CloudinaryStorage - extract info directly
      console.log('File already uploaded to Cloudinary via CloudinaryStorage');

      const secureUrl = req.file.secure_url || req.file.url || req.file.path;
      let publicId = req.file.public_id;

      // Extract public_id if not directly available
      if (!publicId && req.file.path) {
        try {
          const pathParts = req.file.path.split('/');
          const uploadIndex = pathParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1 && pathParts.length > uploadIndex + 2) {
            // Get everything after 'upload/v1234567890/' and remove file extension
            publicId = pathParts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
          }
        } catch (parseError) {
          console.error('Error parsing public_id from path:', parseError);
        }
      }

      // Fallback: use filename or generate public_id
      if (!publicId) {
        if (req.file.filename) {
          publicId = req.file.filename.replace(/\.[^/.]+$/, '');
        } else {
          publicId = `localpro/users/profiles/avatar-${Date.now()}`;
        }
      }

      if (!secureUrl) {
        throw new Error('Failed to extract URL from Cloudinary response');
      }

      avatarData = {
        url: secureUrl,
        publicId: publicId,
        thumbnail: CloudinaryService.getOptimizedUrl(publicId, 'thumbnail')
      };

      console.log('Extracted Cloudinary data:', {
        url: avatarData.url,
        publicId: avatarData.publicId
      });
    } else {
      // File needs to be uploaded manually (shouldn't happen with cloudinaryStorage, but handle it)
      console.log('Uploading file to Cloudinary manually...');
      const uploadResult = await CloudinaryService.uploadFile(
        req.file,
        'localpro/users/profiles'
      );

      console.log('Upload result:', {
        success: uploadResult.success,
        error: uploadResult.error,
        hasData: !!uploadResult.data
      });

      if (!uploadResult.success) {
        console.error('Cloudinary upload failed:', uploadResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload avatar',
          error: uploadResult.error,
          code: 'CLOUDINARY_UPLOAD_ERROR'
        });
      }

      avatarData = {
        url: uploadResult.data.secure_url,
        publicId: uploadResult.data.public_id,
        thumbnail: CloudinaryService.getOptimizedUrl(uploadResult.data.public_id, 'thumbnail')
      };
    }

    // Delete old avatar if exists
    if (user.profile.avatar && user.profile.avatar.publicId) {
      await CloudinaryService.deleteFile(user.profile.avatar.publicId);
    }

    // Update user profile with new avatar
    user.profile.avatar = avatarData;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.profile.avatar
      }
    });
  } catch (error) {
    console.error('=== Avatar Upload Exception ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
    }
    console.error('================================');
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while uploading avatar',
      code: 'UPLOAD_ERROR'
    });
  }
};

// @desc    Upload portfolio images
// @route   POST /api/auth/upload-portfolio
// @access  Private
const uploadPortfolioImages = async (req, res) => {
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
    console.error('Upload portfolio images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
      logger.warn('Refresh token failed: Missing refresh token', {
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Find user by refresh token
    const user = await User.findOne({
      refreshToken: providedRefreshToken,
      refreshTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      logger.warn('Refresh token failed: Invalid or expired refresh token', {
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Refresh token failed: User is inactive', {
        userId: user._id,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    // Optionally rotate refresh token (security best practice)
    const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKEN !== 'false';
    let newRefreshToken = providedRefreshToken;

    if (rotateRefreshToken) {
      newRefreshToken = generateRefreshToken();
      await saveRefreshToken(user, newRefreshToken);
    }

    logger.info('Token refreshed successfully', {
      userId: user._id,
      tokenRotated: rotateRefreshToken,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Refresh token error', {
      error: error.message,
      stack: error.stack,
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user) {
      // Clear refresh token
      await clearRefreshToken(user);

      logger.info('User logged out successfully', {
        userId,
        clientInfo,
        duration: Date.now() - startTime
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Register with email and password (sends email OTP)
// @route   POST /api/auth/register-email
// @access  Public
const registerWithEmail = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { email, password, firstName, lastName } = req.body;

    // Input validation
    if (!email || !password) {
      logger.warn('Register with email failed: Missing required fields', {
        hasEmail: !!email,
        hasPassword: !!password,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (existingUser) {
      // Check if user already has password set
      if (existingUser.password) {
        logger.warn('Register with email failed: Email already registered with password', {
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          clientInfo,
          duration: Date.now() - startTime
        });
        return res.status(400).json({
          success: false,
          message: 'Email is already registered. Please use login instead.',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }

      // User exists but no password - allow adding password auth
      // Rate limiting check
      const lastOTPSent = existingUser.lastEmailOTPSent;
      if (lastOTPSent) {
        const now = new Date();
        const timeDiff = now - lastOTPSent;

        // Allow only one OTP per minute
        if (timeDiff < 60000) {
          logger.warn('Register with email failed: Rate limit exceeded', {
            email: email.substring(0, 3) + '***@' + email.split('@')[1],
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

      // Generate OTP
      const otpCode = generateOTP();

      // Update existing user with password
      existingUser.password = password; // Will be hashed by pre-save hook
      existingUser.emailVerificationCode = otpCode;
      existingUser.lastEmailOTPSent = new Date();
      if (firstName) existingUser.firstName = firstName.trim();
      if (lastName) existingUser.lastName = lastName.trim();
      existingUser._skipRelatedDocumentsCreation = true;
      await existingUser.save({ validateBeforeSave: false });
      existingUser._skipRelatedDocumentsCreation = false;

      const user = existingUser;

      // Send OTP email
      const emailResult = await EmailService.sendEmailOTP(
        email.toLowerCase().trim(),
        otpCode,
        user.firstName || 'User'
      );

      if (!emailResult.success) {
        logger.error('Failed to send email OTP', {
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          error: emailResult.error,
          clientInfo,
          duration: Date.now() - startTime
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          code: 'EMAIL_SEND_FAILED'
        });
      }

      logger.info('Email OTP sent for registration (existing user)', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
        email: email.substring(0, 3) + '***@' + email.split('@')[1] // Partially masked email
      });
    }

    // New user - create account
    // Generate OTP
    const otpCode = generateOTP();

    // Generate a unique placeholder phone number for email-only users
    // Format: +email-{hash} where hash is derived from email and timestamp
    const crypto = require('crypto');
    const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim() + Date.now()).digest('hex').substring(0, 10);
    const placeholderPhoneNumber = `+email-${emailHash}`;

    // Create new user
    const user = await User.create({
      phoneNumber: placeholderPhoneNumber, // Placeholder for email-only users
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      emailVerificationCode: otpCode,
      lastEmailOTPSent: new Date(),
      isVerified: false // Will be verified after OTP confirmation
    });

    // Send OTP email
    const emailResult = await EmailService.sendEmailOTP(
      email.toLowerCase().trim(),
      otpCode,
      user.firstName || 'User'
    );

    if (!emailResult.success) {
      logger.error('Failed to send email OTP', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: emailResult.error,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    logger.info('Email OTP sent for registration', {
      userId: user._id,
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: email.substring(0, 3) + '***@' + email.split('@')[1] // Partially masked email
    });
  } catch (error) {
    logger.error('Register with email error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Login with email and password (sends email OTP)
// @route   POST /api/auth/login-email
// @access  Public
const loginWithEmail = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      logger.warn('Login with email failed: Missing required fields', {
        hasEmail: !!email,
        hasPassword: !!password,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      logger.warn('Login with email failed: User not found', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user has password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password not set for this email',
        code: 'PASSWORD_NOT_SET'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn('Login with email failed: Invalid password', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Rate limiting check
    const lastOTPSent = user.lastEmailOTPSent;
    if (lastOTPSent) {
      const now = new Date();
      const timeDiff = now - lastOTPSent;

      // Allow only one OTP per minute
      if (timeDiff < 60000) {
        logger.warn('Login with email failed: Rate limit exceeded', {
          userId: user._id,
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
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

    // Generate OTP
    const otpCode = generateOTP();

    // Update user with OTP
    user.emailVerificationCode = otpCode;
    user.lastEmailOTPSent = new Date();
    user._skipRelatedDocumentsCreation = true;
    await user.save({ validateBeforeSave: false });
    user._skipRelatedDocumentsCreation = false;

    // Send OTP email
    const emailResult = await EmailService.sendEmailOTP(
      email.toLowerCase().trim(),
      otpCode,
      user.firstName || 'User'
    );

    if (!emailResult.success) {
      logger.error('Failed to send email OTP', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: emailResult.error,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    logger.info('Email OTP sent for login', {
      userId: user._id,
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: email.substring(0, 3) + '***@' + email.split('@')[1] // Partially masked email
    });
  } catch (error) {
    logger.error('Login with email error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Verify email OTP and authenticate user
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOTP = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { email, otpCode } = req.body;

    // Input validation
    if (!email || !otpCode) {
      logger.warn('Verify email OTP failed: Missing required fields', {
        hasEmail: !!email,
        hasOTP: !!otpCode,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Validate OTP format
    if (!validateVerificationCode(otpCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. Please enter a 6-digit code',
        code: 'INVALID_OTP_FORMAT'
      });
    }

    // Find user by email and OTP code
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationCode: otpCode
    });

    if (!user) {
      logger.warn('Verify email OTP failed: Invalid OTP', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code',
        code: 'INVALID_OTP'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Clear OTP code
    user.emailVerificationCode = undefined;
    user.isVerified = true;
    await user.verify('email');

    // Update login info
    await user.updateLoginInfo(clientInfo.ip, clientInfo.userAgent);
    await user.updateStatus('active', null, null);

    user._skipRelatedDocumentsCreation = true;
    await user.save({ validateBeforeSave: false });
    user._skipRelatedDocumentsCreation = false;

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken);

    const isNewUser = !user.firstName || !user.lastName;

    logger.info('Email OTP verified successfully', {
      userId: user._id,
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      isNewUser,
      clientInfo,
      duration: Date.now() - startTime
    });

    // Track activity
    if (isNewUser) {
      activityService.trackRegistration(user._id, {
        firstName: user.firstName,
        lastName: user.lastName,
        method: 'email'
      }).catch(err => logger.warn('Failed to track registration activity', { error: err.message }));
    } else {
      activityService.trackLogin(user._id, {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        device: getDeviceType(clientInfo.userAgent)
      }).catch(err => logger.warn('Failed to track login activity', { error: err.message }));
    }

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Registration successful' : 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles || ['client'],
        isVerified: user.isVerified,
        subscription: user.localProPlusSubscription || null,
        trustScore: (await user.ensureTrust()).trustScore,
        profile: {
          avatar: user.profile?.avatar,
          bio: user.profile?.bio
        }
      },
      isNewUser
    });
  } catch (error) {
    logger.error('Verify email OTP error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Check if email exists and if password is set
// @route   POST /api/auth/check-email
// @access  Public
const checkEmail = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      logger.warn('Check email failed: Missing email', {
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      logger.info('Check email: Email not found', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(200).json({
        success: true,
        exists: false,
        hasPassword: false,
        message: 'Email is available for registration'
      });
    }

    // Check if user has password set
    const hasPassword = !!user.password;

    logger.info('Check email: Email found', {
      userId: user._id,
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      hasPassword,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      exists: true,
      hasPassword,
      message: hasPassword
        ? 'Email exists and has password set'
        : 'Email exists but password not set',
      ...(hasPassword && {
        code: 'EMAIL_EXISTS_WITH_PASSWORD'
      }),
      ...(!hasPassword && {
        code: 'EMAIL_EXISTS_NO_PASSWORD'
      })
    });
  } catch (error) {
    logger.error('Check email error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Set password for user (sends email OTP for verification)
// @route   POST /api/auth/set-password
// @access  Public
const setPassword = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      logger.warn('Set password failed: Missing required fields', {
        hasEmail: !!email,
        hasPassword: !!password,
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
        code: 'WEAK_PASSWORD'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      logger.warn('Set password failed: User not found', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Check if user already has a password
    if (user.password) {
      logger.warn('Set password failed: Password already set', {
        userId: user._id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        clientInfo,
        duration: Date.now() - startTime
      });
      return res.status(400).json({
        success: false,
        message: 'Password is already set for this account. Use change password instead.',
        code: 'PASSWORD_ALREADY_SET'
      });
    }

    // Rate limiting check
    const lastOTPSent = user.lastEmailOTPSent;
    if (lastOTPSent) {
      const now = new Date();
      const timeDiff = now - lastOTPSent;

      // Allow only one OTP per minute
      if (timeDiff < 60000) {
        logger.warn('Set password failed: Rate limit exceeded', {
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
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

    // Generate OTP
    const otpCode = generateOTP();

    // Set password (will be hashed by pre-save hook) and OTP
    user.password = password;
    user.emailVerificationCode = otpCode;
    user.lastEmailOTPSent = new Date();
    user._skipRelatedDocumentsCreation = true;
    await user.save({ validateBeforeSave: false });
    user._skipRelatedDocumentsCreation = false;

    // Send OTP email
    const emailResult = await EmailService.sendEmailOTP(
      email.toLowerCase().trim(),
      otpCode,
      user.firstName || 'User'
    );

    if (!emailResult.success) {
      logger.error('Failed to send email OTP for set password', {
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: emailResult.error,
        clientInfo,
        duration: Date.now() - startTime
      });
      // Don't fail the request, password is already set, just log the error
    }

    logger.info('Password set and OTP sent', {
      userId: user._id,
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Password set successfully. Please verify your email with the OTP code sent to your email address.',
      email: email.substring(0, 3) + '***@' + email.split('@')[1] // Partially masked email
    });
  } catch (error) {
    logger.error('Set password error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// MPIN (Mobile Personal Identification Number) Controllers

// @desc    Set MPIN for user
// @route   POST /api/auth/mpin/set
// @access  Private (requires authentication)
const setMpin = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { mpin } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set MPIN
    await user.setMpin(mpin);

    // Log activity
    await activityService.createActivity({
      userId,
      type: 'mpin_set',
      action: 'MPIN Set',
      description: 'User set their MPIN',
      metadata: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp
      },
      visibility: 'private'
    });

    logger.info('MPIN set successfully', {
      userId,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'MPIN set successfully'
    });
  } catch (error) {
    logger.error('Set MPIN error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set MPIN'
    });
  }
};

// @desc    Verify MPIN
// @route   POST /api/auth/mpin/verify
// @access  Private (requires authentication)
const verifyMpin = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { mpin } = req.body;
    const userId = req.user.id;

    // Get user with MPIN field
    const user = await User.findById(userId).select('+mpin');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify MPIN
    await user.verifyMpin(mpin);

    // Log activity
    await activityService.createActivity({
      userId,
      type: 'mpin_verified',
      action: 'MPIN Verified',
      description: 'User verified their MPIN',
      metadata: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp
      },
      visibility: 'private'
    });

    logger.info('MPIN verified successfully', {
      userId,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'MPIN verified successfully'
    });
  } catch (error) {
    logger.error('Verify MPIN error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify MPIN'
    });
  }
};

// @desc    Login with MPIN
// @route   POST /api/auth/mpin/login
// @access  Public
const loginWithMpin = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { phoneNumber, mpin } = req.body;

    // Get user with MPIN field
    const user = await User.findOne({ phoneNumber }).select('+mpin +mpinEnabled +mpinAttempts +mpinLockedUntil');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if MPIN is enabled
    if (!user.mpinEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MPIN not enabled for this account'
      });
    }

    // Verify MPIN
    await user.verifyMpin(mpin);

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();

    // Log activity
    await activityService.createActivity({
      userId: user._id,
      type: 'login_mpin',
      action: 'MPIN Login',
      description: 'User logged in using MPIN',
      metadata: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp,
        deviceType: getDeviceType(clientInfo.userAgent)
      },
      visibility: 'private'
    });

    logger.info('MPIN login successful', {
      userId: user._id,
      phoneNumber: phoneNumber.substring(0, 6) + '****',
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName ? user.firstName : 'User',
        lastName: user.lastName ? user.lastName : 'User',
        email: user.email,
        roles: user.roles || ['client'],
        isVerified: user.isVerified,
        subscription: user.localProPlusSubscription || null,
        trustScore: (await user.ensureTrust()).trustScore,
        profile: {
          avatar: user.profile?.avatar,
          bio: user.profile?.bio
        }
      },
      isNewUser: false
    });

  } catch (error) {
    logger.error('MPIN login error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body?.phoneNumber ? req.body.phoneNumber.substring(0, 6) + '****' : 'unknown',
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// @desc    Disable MPIN
// @route   DELETE /api/auth/mpin
// @access  Private (requires authentication)
const disableMpin = async (req, res) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);

  try {
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Disable MPIN
    await user.disableMpin();

    // Log activity
    await activityService.createActivity({
      userId,
      type: 'mpin_disabled',
      action: 'MPIN Disabled',
      description: 'User disabled their MPIN',
      metadata: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp
      },
      visibility: 'private'
    });

    logger.info('MPIN disabled successfully', {
      userId,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      message: 'MPIN disabled successfully'
    });
  } catch (error) {
    logger.error('Disable MPIN error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      clientInfo,
      duration: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      message: 'Failed to disable MPIN',
      error: error.message
    });
  }
};

// @desc    Get MPIN status
// @route   GET /api/auth/mpin/status
// @access  Private (requires authentication)
const getMpinStatus = async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const mpinStatus = user.getMpinStatus();

    logger.info('MPIN status retrieved', {
      userId,
      enabled: mpinStatus.enabled,
      locked: mpinStatus.locked,
      duration: Date.now() - startTime
    });

    res.status(200).json({
      success: true,
      data: mpinStatus
    });
  } catch (error) {
    logger.error('Get MPIN status error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      duration: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get MPIN status',
      error: error.message
    });
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  registerWithEmail,
  loginWithEmail,
  verifyEmailOTP,
  checkEmail,
  setPassword,
  completeOnboarding,
  getProfileCompletionStatus,
  getProfileCompleteness,
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
};
