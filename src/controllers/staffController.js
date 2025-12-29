const User = require('../models/User');
const StaffPermission = require('../models/StaffPermission');
const Permission = require('../models/Permission');
const mongoose = require('mongoose');
const { auditLogger } = require('../utils/auditLogger');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Admin/Staff Manager
const getAllStaff = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {
      roles: { $in: ['staff'] }
    };

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive.toLowerCase() === 'true';
    }

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { firstName: { $regex: search.trim(), $options: 'i' } },
        { lastName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phoneNumber: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [total, staff] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-verificationCode')
        .populate('management')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    // Get permissions for each staff member
    const staffWithPermissions = await Promise.all(
      staff.map(async (member) => {
        const permissions = await StaffPermission.getStaffPermissions(member._id);
        return {
          ...member.toObject(),
          permissions: permissions.map(p => ({
            code: p.code,
            name: p.name,
            module: p.module,
            action: p.action
          }))
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        staff: staffWithPermissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff members'
    });
  }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Admin/Staff Manager
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
        code: 'INVALID_ID'
      });
    }

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    })
      .select('-verificationCode')
      .populate('management');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get permissions
    const permissions = await StaffPermission.getStaffPermissions(staff._id);

    res.status(200).json({
      success: true,
      data: {
        ...staff.toObject(),
        permissions: permissions.map(p => ({
          code: p.code,
          name: p.name,
          module: p.module,
          action: p.action,
          description: p.description
        }))
      }
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff member'
    });
  }
};

// @desc    Create staff member
// @route   POST /api/staff
// @access  Admin
const createStaff = async (req, res) => {
  try {
    const {
      phoneNumber,
      email,
      firstName,
      lastName,
      gender,
      birthdate,
      isActive = true
    } = req.body;

    // Validate required fields
    const validationErrors = [];
    
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
      validationErrors.push({
        field: 'phoneNumber',
        message: 'Phone number is required',
        code: 'PHONE_NUMBER_REQUIRED'
      });
    }

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      validationErrors.push({
        field: 'firstName',
        message: 'First name is required',
        code: 'FIRST_NAME_REQUIRED'
      });
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      validationErrors.push({
        field: 'lastName',
        message: 'Last name is required',
        code: 'LAST_NAME_REQUIRED'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push({
          field: 'email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      validationErrors.push({
        field: 'gender',
        message: 'Invalid gender value',
        code: 'INVALID_GENDER'
      });
    }

    // Validate birthdate if provided
    if (birthdate) {
      const birthDate = new Date(birthdate);
      if (isNaN(birthDate.getTime())) {
        validationErrors.push({
          field: 'birthdate',
          message: 'Invalid birthdate format',
          code: 'INVALID_BIRTHDATE'
        });
      } else if (birthDate > new Date()) {
        validationErrors.push({
          field: 'birthdate',
          message: 'Birthdate cannot be in the future',
          code: 'BIRTHDATE_IN_FUTURE'
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: validationErrors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber: phoneNumber.trim() },
        ...(email ? [{ email: email.toLowerCase().trim() }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number or email already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Create staff user
    const staff = await User.create({
      phoneNumber: phoneNumber.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      roles: ['client', 'staff'], // Always include client role
      isActive,
      isVerified: true // Staff are auto-verified
    });

    // Audit log
    await auditLogger.log({
      action: 'staff.created',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: staff._id,
      metadata: {
        staffPhoneNumber: phoneNumber,
        staffEmail: email
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ERROR',
        field
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating staff member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Admin/Staff Manager
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, gender, birthdate, isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
        code: 'INVALID_ID'
      });
    }

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
        code: 'STAFF_NOT_FOUND'
      });
    }

    // Validation errors
    const validationErrors = [];

    // Validate email format if provided
    if (email !== undefined) {
      if (email === null || email === '') {
        staff.email = undefined;
      } else if (typeof email === 'string' && email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          validationErrors.push({
            field: 'email',
            message: 'Invalid email format',
            code: 'INVALID_EMAIL_FORMAT'
          });
        } else {
          // Check if email is already taken by another user
          const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: id }
          });
          if (existingUser) {
            validationErrors.push({
              field: 'email',
              message: 'Email already in use by another user',
              code: 'EMAIL_ALREADY_EXISTS'
            });
          }
        }
      }
    }

    // Validate gender if provided
    if (gender !== undefined && gender !== null) {
      if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        validationErrors.push({
          field: 'gender',
          message: 'Invalid gender value',
          code: 'INVALID_GENDER'
        });
      }
    }

    // Validate birthdate if provided
    if (birthdate !== undefined && birthdate !== null) {
      const birthDate = new Date(birthdate);
      if (isNaN(birthDate.getTime())) {
        validationErrors.push({
          field: 'birthdate',
          message: 'Invalid birthdate format',
          code: 'INVALID_BIRTHDATE'
        });
      } else if (birthDate > new Date()) {
        validationErrors.push({
          field: 'birthdate',
          message: 'Birthdate cannot be in the future',
          code: 'BIRTHDATE_IN_FUTURE'
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: validationErrors
      });
    }

    // Update fields
    if (firstName !== undefined) staff.firstName = firstName.trim();
    if (lastName !== undefined) staff.lastName = lastName.trim();
    if (email !== undefined) {
      staff.email = email ? email.toLowerCase().trim() : undefined;
    }
    if (gender !== undefined) staff.gender = gender;
    if (birthdate !== undefined) {
      staff.birthdate = birthdate ? new Date(birthdate) : undefined;
    }
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    // Audit log
    await auditLogger.log({
      action: 'staff.updated',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: staff._id,
      metadata: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ERROR',
        field
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating staff member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete staff member (soft delete)
// @route   DELETE /api/staff/:id
// @access  Admin
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Soft delete
    await staff.softDelete(req.user._id);

    // Revoke all permissions
    const permissions = await StaffPermission.find({ staff: id, isActive: true });
    for (const perm of permissions) {
      await StaffPermission.revokePermission(id, perm.permission, req.user._id);
    }

    // Audit log
    await auditLogger.log({
      action: 'staff.deleted',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: staff._id
    });

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staff member',
      error: error.message
    });
  }
};

// @desc    Assign permissions to staff
// @route   POST /api/staff/:id/permissions
// @access  Admin
const assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionCodes, expiresAt, notes } = req.body;

    if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permission codes array is required'
      });
    }

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get permission IDs
    const permissions = await Permission.find({
      code: { $in: permissionCodes },
      isActive: true
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      return res.status(400).json({
        success: false,
        message: `Invalid permission codes: ${missingCodes.join(', ')}`
      });
    }

    // Grant permissions
    const results = await StaffPermission.bulkGrant(
      id,
      permissions.map(p => p._id),
      req.user._id,
      {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes
      }
    );

    // Audit log
    await auditLogger.log({
      action: 'staff.permissions.assigned',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: id,
      metadata: {
        permissionCodes,
        results
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permissions assigned successfully',
      data: {
        assigned: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning permissions',
      error: error.message
    });
  }
};

// @desc    Revoke permissions from staff
// @route   DELETE /api/staff/:id/permissions
// @access  Admin
const revokePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionCodes } = req.body;

    if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permission codes array is required'
      });
    }

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get permission IDs
    const permissions = await Permission.find({
      code: { $in: permissionCodes },
      isActive: true
    });

    // Revoke permissions
    const results = await StaffPermission.bulkRevoke(
      id,
      permissions.map(p => p._id),
      req.user._id
    );

    // Audit log
    await auditLogger.log({
      action: 'staff.permissions.revoked',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: id,
      metadata: {
        permissionCodes,
        results
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permissions revoked successfully',
      data: {
        revoked: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    console.error('Revoke permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking permissions',
      error: error.message
    });
  }
};

// @desc    Get staff permissions
// @route   GET /api/staff/:id/permissions
// @access  Admin/Staff Manager
const getStaffPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get permissions
    const permissions = await StaffPermission.getStaffPermissions(id);

    // Get all permission assignments with details
    const permissionAssignments = await StaffPermission.find({
      staff: id
    })
      .populate('permission')
      .populate('grantedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        permissions: permissions.map(p => ({
          code: p.code,
          name: p.name,
          module: p.module,
          action: p.action,
          description: p.description
        })),
        assignments: permissionAssignments
          .filter(pa => pa.isValid())
          .map(pa => ({
            permission: {
              code: pa.permission.code,
              name: pa.permission.name,
              module: pa.permission.module,
              action: pa.permission.action
            },
            grantedBy: pa.grantedBy,
            grantedAt: pa.grantedAt,
            expiresAt: pa.expiresAt,
            notes: pa.notes
          }))
      }
    });
  } catch (error) {
    console.error('Get staff permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff permissions',
      error: error.message
    });
  }
};

// @desc    Get staff statistics
// @route   GET /api/staff/stats
// @access  Admin/Staff Manager
const getStaffStats = async (req, res) => {
  try {
    const totalStaff = await User.countDocuments({ roles: { $in: ['staff'] } });
    const activeStaff = await User.countDocuments({ 
      roles: { $in: ['staff'] },
      isActive: true
    });
    const inactiveStaff = totalStaff - activeStaff;

    // Get staff with permissions count
    const staffWithPermissions = await StaffPermission.distinct('staff');
    const staffWithPermissionsCount = staffWithPermissions.length;

    // Get total permissions assigned
    const totalPermissionsAssigned = await StaffPermission.countDocuments({
      isActive: true,
      granted: true
    });

    // Get permissions by module
    const permissionsByModule = await StaffPermission.aggregate([
      {
        $match: {
          isActive: true,
          granted: true
        }
      },
      {
        $lookup: {
          from: 'permissions',
          localField: 'permission',
          foreignField: '_id',
          as: 'permissionData'
        }
      },
      {
        $unwind: '$permissionData'
      },
      {
        $group: {
          _id: '$permissionData.module',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        withPermissions: staffWithPermissionsCount,
        withoutPermissions: totalStaff - staffWithPermissionsCount,
        totalPermissionsAssigned,
        permissionsByModule: permissionsByModule.map(item => ({
          module: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk update staff status
// @route   PATCH /api/staff/bulk/status
// @access  Admin
const bulkUpdateStaffStatus = async (req, res) => {
  try {
    const { staffIds, isActive } = req.body;

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Staff IDs array is required',
        code: 'STAFF_IDS_REQUIRED'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
        code: 'INVALID_STATUS'
      });
    }

    // Validate all IDs
    const invalidIds = staffIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff IDs',
        code: 'INVALID_IDS',
        invalidIds
      });
    }

    // Update staff status
    const result = await User.updateMany(
      {
        _id: { $in: staffIds },
        roles: { $in: ['staff'] }
      },
      {
        $set: { isActive }
      }
    );

    // Audit log
    await auditLogger.log({
      action: 'staff.bulk_status_updated',
      userId: req.user._id,
      resourceType: 'staff',
      metadata: {
        staffIds,
        isActive,
        updatedCount: result.modifiedCount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Staff status updated successfully',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update staff status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove staff role from user (convert back to regular user)
// @route   PATCH /api/staff/:id/remove-role
// @access  Admin
const removeStaffRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
        code: 'INVALID_ID'
      });
    }

    const staff = await User.findOne({
      _id: id,
      roles: { $in: ['staff'] }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
        code: 'STAFF_NOT_FOUND'
      });
    }

    // Remove staff role (keep client role)
    staff.removeRole('staff');
    await staff.save();

    // Revoke all permissions
    await StaffPermission.updateMany(
      { staff: id },
      { 
        $set: { 
          isActive: false,
          granted: false
        }
      }
    );

    // Audit log
    await auditLogger.log({
      action: 'staff.role_removed',
      userId: req.user._id,
      resourceType: 'staff',
      resourceId: id
    });

    res.status(200).json({
      success: true,
      message: 'Staff role removed successfully',
      data: staff
    });
  } catch (error) {
    console.error('Remove staff role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing staff role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  assignPermissions,
  revokePermissions,
  getStaffPermissions,
  getStaffStats,
  bulkUpdateStaffStatus,
  removeStaffRole
};

