const User = require('../models/User');
const Agency = require('../models/Agency');
const EmailService = require('../services/emailService');
const TwilioService = require('../services/twilioService');
const CloudinaryService = require('../services/cloudinaryService');
const { auditLogger } = require('../utils/auditLogger');

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Admin/Manager
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { 'profile.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-verificationCode')
      .populate('agency.agencyId', 'name type')
      .populate('referral.referredBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Audit log
    await auditLogger.logUser('GET_ALL_USERS', req, { type: 'user', id: 'multiple', name: 'Users' }, {}, { filter, pagination: { page, limit } });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin/Manager/Owner
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-verificationCode')
      .populate('agency.agencyId', 'name type address')
      .populate('referral.referredBy', 'firstName lastName email')
      .populate('settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this profile
    const canAccess = req.user.role === 'admin' || 
                     req.user.role === 'agency_admin' || 
                     req.user.id === id ||
                     (req.user.role === 'agency_owner' && user.agency.agencyId?.toString() === req.user.agency?.agencyId?.toString());

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Audit log
    await auditLogger.logUser('GET_USER_BY_ID', req, { type: 'user', id: id, name: 'User' });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
  try {
    const {
      phoneNumber,
      email,
      firstName,
      lastName,
      role = 'client',
      agencyId,
      agencyRole = 'provider'
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, first name, and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number or email already exists'
      });
    }

    // Validate agency if provided
    if (agencyId) {
      const agency = await Agency.findById(agencyId);
      if (!agency) {
        return res.status(400).json({
          success: false,
          message: 'Agency not found'
        });
      }
    }

    // Create user
    const userData = {
      phoneNumber,
      email,
      firstName,
      lastName,
      role,
      isVerified: true, // Admin created users are pre-verified
      verification: {
        phoneVerified: true,
        emailVerified: !!email
      }
    };

    if (agencyId) {
      userData.agency = {
        agencyId,
        role: agencyRole,
        status: 'active',
        joinedAt: new Date()
      };
    }

    const user = await User.create(userData);

    // Generate referral code
    user.generateReferralCode();
    await user.save();

    // Send welcome email if email provided
    if (email) {
      try {
        await EmailService.sendWelcomeEmail(email, firstName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Audit log
    await auditLogger.logUser('CREATE_USER', req, { type: 'user', id: user._id, name: user.email }, {}, { userData });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin/Manager/Owner
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     req.user.id === id ||
                     (req.user.role === 'agency_admin' && user.agency.agencyId?.toString() === req.user.agency?.agencyId?.toString());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.verificationCode;

    // If updating role, only admin can do this
    if (updateData.role && req.user.role !== 'admin') {
      delete updateData.role;
    }

    // If updating agency info, validate agency exists
    if (updateData.agency?.agencyId) {
      const agency = await Agency.findById(updateData.agency.agencyId);
      if (!agency) {
        return res.status(400).json({
          success: false,
          message: 'Agency not found'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-verificationCode');

    // Audit log
    await auditLogger.logUser('UPDATE_USER', req, { type: 'user', id: id, name: 'User' }, updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deactivate/Activate user
// @route   PATCH /api/users/:id/status
// @access  Admin/Manager
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const canUpdateStatus = req.user.role === 'admin' || 
                           (req.user.role === 'agency_admin' && user.agency.agencyId?.toString() === req.user.agency?.agencyId?.toString());

    if (!canUpdateStatus) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    user.isActive = isActive;
    await user.save();

    // Send notification to user
    if (user.email) {
      try {
        if (isActive) {
          await EmailService.sendAccountActivatedEmail(user.email, user.firstName);
        } else {
          await EmailService.sendAccountDeactivatedEmail(user.email, user.firstName, reason);
        }
      } catch (emailError) {
        console.error('Failed to send status notification email:', emailError);
      }
    }

    // Audit log
    await auditLogger.logUser(isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', req, { type: 'user', id: id, name: 'User' }, {}, { isActive, reason });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user verification status
// @route   PATCH /api/users/:id/verification
// @access  Admin/Manager
const updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const canUpdateVerification = req.user.role === 'admin' || 
                                 (req.user.role === 'agency_admin' && user.agency.agencyId?.toString() === req.user.agency?.agencyId?.toString());

    if (!canUpdateVerification) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update verification status
    user.verification = { ...user.verification, ...verification };
    
    // Update overall verification status
    user.isVerified = Object.values(user.verification).some(status => status === true);
    
    // Recalculate trust score
    user.calculateTrustScore();
    
    await user.save();

    // Audit log
    await auditLogger.logUser('UPDATE_USER_VERIFICATION', req, { type: 'user', id: id, name: 'User' }, {}, { verification });

    res.status(200).json({
      success: true,
      message: 'User verification updated successfully',
      data: {
        verification: user.verification,
        isVerified: user.isVerified,
        trustScore: user.trustScore
      }
    });
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add badge to user
// @route   POST /api/users/:id/badges
// @access  Admin/Manager
const addUserBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const canAddBadge = req.user.role === 'admin' || 
                       (req.user.role === 'agency_admin' && user.agency.agencyId?.toString() === req.user.agency?.agencyId?.toString());

    if (!canAddBadge) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add badge
    user.addBadge(type, description);
    
    // Recalculate trust score
    user.calculateTrustScore();
    
    await user.save();

    // Audit log
    await auditLogger.logUser('ADD_USER_BADGE', req, { type: 'user', id: id, name: 'User' }, {}, { type, description });

    res.status(200).json({
      success: true,
      message: 'Badge added successfully',
      data: {
        badges: user.badges,
        trustScore: user.trustScore
      }
    });
  } catch (error) {
    console.error('Add user badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Admin/Manager
const getUserStats = async (req, res) => {
  try {
    const { agencyId } = req.query;

    // Build filter for agency-specific stats
    const filter = {};
    if (agencyId && req.user.role !== 'admin') {
      filter['agency.agencyId'] = agencyId;
    }

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole,
      recentUsers,
      topRatedUsers
    ] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({ ...filter, isActive: true }),
      User.countDocuments({ ...filter, isVerified: true }),
      User.aggregate([
        { $match: filter },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.find(filter)
        .select('firstName lastName email createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({ ...filter, 'profile.rating': { $gte: 4 } })
        .select('firstName lastName profile.rating profile.totalReviews')
        .sort({ 'profile.rating': -1 })
        .limit(5)
    ]);

    // Audit log
    await auditLogger.logUser('GET_USER_STATS', req, { type: 'user', id: 'stats', name: 'User Statistics' }, {}, { filter });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole,
        recentUsers,
        topRatedUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk update users
// @route   PATCH /api/users/bulk
// @access  Admin
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updateData } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    // Remove sensitive fields
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.verificationCode;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    // Audit log
    await auditLogger.logUser('BULK_UPDATE_USERS', req, { type: 'user', id: 'multiple', name: 'Users' }, {}, { userIds, updateData, modifiedCount: result.modifiedCount });

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - mark as inactive and add deletion timestamp
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save();

    // Audit log
    await auditLogger.logUser('DELETE_USER', req, { type: 'user', id: id, name: 'User' });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserVerification,
  addUserBadge,
  getUserStats,
  bulkUpdateUsers,
  deleteUser
};
