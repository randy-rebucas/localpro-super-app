const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TwilioService = require('../services/twilioService');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const { uploaders } = require('../config/cloudinary');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Send verification code
// @route   POST /api/auth/send-code
// @access  Public
const sendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use international format (e.g., +1234567890)'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    
    // Send verification code via Twilio
    const result = await TwilioService.sendVerificationCode(phoneNumber);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to send verification code',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      isNewUser: !existingUser
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify code and register/login user
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    const { phoneNumber, code, firstName, lastName, email } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    // Verify code with Twilio
    const verificationResult = await TwilioService.verifyCode(phoneNumber, code);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (user) {
      // Update verification status
      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();
    } else {
      // Create new user
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required for new users'
        });
      }

      user = await User.create({
        phoneNumber,
        firstName,
        lastName,
        email,
        isVerified: true
      });

      // Send welcome email to new user if email is provided
      if (email) {
        try {
          await EmailService.sendWelcomeEmail(email, firstName);
          console.log(`Welcome email sent to: ${email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the registration if email fails
        }
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Verification successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
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
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
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
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. However, we can implement token blacklisting
    // or other server-side logout mechanisms here if needed.
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  getMe,
  updateProfile,
  uploadAvatar,
  uploadPortfolioImages,
  logout
};
