const Permission = require('../models/Permission');
const { auditLogger } = require('../utils/auditLogger');

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Admin
const getAllPermissions = async (req, res) => {
  try {
    const {
      module,
      action,
      isActive,
      search,
      page = 1,
      limit = 50,
      sortBy = 'module',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive.toLowerCase() === 'true';
    }

    if (module) {
      filter.module = module;
    }

    if (action) {
      filter.action = action;
    }

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [total, permissions] = await Promise.all([
      Permission.countDocuments(filter),
      Permission.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    res.status(200).json({
      success: true,
      data: {
        permissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions'
    });
  }
};

// @desc    Get permission by ID
// @route   GET /api/permissions/:id
// @access  Admin
const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Get permission by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission'
    });
  }
};

// @desc    Get permissions by module
// @route   GET /api/permissions/module/:module
// @access  Admin
const getPermissionsByModule = async (req, res) => {
  try {
    const { module } = req.params;

    const permissions = await Permission.getByModule(module);

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Get permissions by module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions by module'
    });
  }
};

// @desc    Create permission
// @route   POST /api/permissions
// @access  Admin
const createPermission = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      module,
      action,
      feature,
      metadata
    } = req.body;

    // Validate required fields
    if (!code || !name || !module || !action) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, module, and action are required'
      });
    }

    // Check if permission already exists
    const existing = await Permission.findOne({ code });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Permission with this code already exists'
      });
    }

    // Create permission
    const permission = await Permission.create({
      code: code.toLowerCase().trim(),
      name,
      description,
      module,
      action,
      feature,
      metadata,
      isSystem: false
    });

    // Audit log
    await auditLogger.log({
      action: 'permission.created',
      userId: req.user._id,
      resourceType: 'permission',
      resourceId: permission._id,
      metadata: {
        code: permission.code,
        module: permission.module,
        action: permission.action
      }
    });

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permission',
      error: error.message
    });
  }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Admin
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, feature, metadata } = req.body;

    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Don't allow updating system permissions
    if (permission.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update system permissions'
      });
    }

    // Update fields
    if (name) permission.name = name;
    if (description !== undefined) permission.description = description;
    if (isActive !== undefined) permission.isActive = isActive;
    if (feature !== undefined) permission.feature = feature;
    if (metadata) permission.metadata = metadata;

    await permission.save();

    // Audit log
    await auditLogger.log({
      action: 'permission.updated',
      userId: req.user._id,
      resourceType: 'permission',
      resourceId: permission._id,
      metadata: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Permission updated successfully',
      data: permission
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permission',
      error: error.message
    });
  }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Admin
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Don't allow deleting system permissions
    if (permission.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system permissions'
      });
    }

    // Soft delete by setting isActive to false
    permission.isActive = false;
    await permission.save();

    // Audit log
    await auditLogger.log({
      action: 'permission.deleted',
      userId: req.user._id,
      resourceType: 'permission',
      resourceId: permission._id
    });

    res.status(200).json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting permission',
      error: error.message
    });
  }
};

// @desc    Initialize system permissions
// @route   POST /api/permissions/initialize
// @access  Admin
const initializePermissions = async (req, res) => {
  try {
    const permissions = await Permission.initializeSystemPermissions();

    // Audit log
    await auditLogger.log({
      action: 'permissions.initialized',
      userId: req.user._id,
      resourceType: 'permission',
      metadata: {
        count: permissions.length
      }
    });

    res.status(200).json({
      success: true,
      message: 'System permissions initialized successfully',
      data: {
        count: permissions.length,
        permissions
      }
    });
  } catch (error) {
    console.error('Initialize permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing permissions',
      error: error.message
    });
  }
};

// @desc    Get permission modules
// @route   GET /api/permissions/modules
// @access  Admin
const getModules = async (req, res) => {
  try {
    const modules = await Permission.distinct('module', { isActive: true });

    res.status(200).json({
      success: true,
      data: modules.sort()
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching modules'
    });
  }
};

// @desc    Get permission statistics
// @route   GET /api/permissions/stats
// @access  Admin
const getPermissionStats = async (req, res) => {
  try {
    const StaffPermission = require('../models/StaffPermission');

    const totalPermissions = await Permission.countDocuments();
    const activePermissions = await Permission.countDocuments({ isActive: true });
    const systemPermissions = await Permission.countDocuments({ isSystem: true });
    const customPermissions = totalPermissions - systemPermissions;

    // Get permissions by module
    const permissionsByModule = await Permission.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get permissions by action
    const permissionsByAction = await Permission.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get most assigned permissions
    const mostAssignedPermissions = await StaffPermission.aggregate([
      {
        $match: {
          isActive: true,
          granted: true
        }
      },
      {
        $group: {
          _id: '$permission',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'permissions',
          localField: '_id',
          foreignField: '_id',
          as: 'permissionData'
        }
      },
      {
        $unwind: '$permissionData'
      },
      {
        $project: {
          permission: {
            code: '$permissionData.code',
            name: '$permissionData.name',
            module: '$permissionData.module',
            action: '$permissionData.action'
          },
          assignedCount: '$count'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalPermissions,
        active: activePermissions,
        inactive: totalPermissions - activePermissions,
        system: systemPermissions,
        custom: customPermissions,
        byModule: permissionsByModule.map(item => ({
          module: item._id,
          count: item.count
        })),
        byAction: permissionsByAction.map(item => ({
          action: item._id,
          count: item.count
        })),
        mostAssigned: mostAssignedPermissions
      }
    });
  } catch (error) {
    console.error('Get permission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk create permissions
// @route   POST /api/permissions/bulk
// @access  Admin
const bulkCreatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required',
        code: 'PERMISSIONS_ARRAY_REQUIRED'
      });
    }

    const results = [];
    const errors = [];

    for (const perm of permissions) {
      try {
        const { code, name, description, module, action, feature, metadata } = perm;

        // Validate required fields
        if (!code || !name || !module || !action) {
          errors.push({
            permission: perm,
            error: 'Code, name, module, and action are required'
          });
          continue;
        }

        // Check if permission already exists
        const existing = await Permission.findOne({ code: code.toLowerCase().trim() });
        if (existing) {
          errors.push({
            permission: perm,
            error: 'Permission with this code already exists'
          });
          continue;
        }

        // Create permission
        const created = await Permission.create({
          code: code.toLowerCase().trim(),
          name,
          description,
          module,
          action,
          feature,
          metadata,
          isSystem: false
        });

        results.push(created);
      } catch (error) {
        errors.push({
          permission: perm,
          error: error.message
        });
      }
    }

    // Audit log
    await auditLogger.log({
      action: 'permissions.bulk_created',
      userId: req.user._id,
      resourceType: 'permission',
      metadata: {
        total: permissions.length,
        created: results.length,
        failed: errors.length
      }
    });

    res.status(201).json({
      success: true,
      message: 'Permissions created',
      data: {
        created: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get available actions
// @route   GET /api/permissions/actions
// @access  Admin
const getActions = async (req, res) => {
  try {
    const actions = await Permission.distinct('action', { isActive: true });

    res.status(200).json({
      success: true,
      data: actions.sort()
    });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching actions'
    });
  }
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  getPermissionsByModule,
  createPermission,
  updatePermission,
  deletePermission,
  initializePermissions,
  getModules,
  getPermissionStats,
  bulkCreatePermissions,
  getActions
};

