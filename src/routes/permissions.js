const express = require('express');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { checkPermission } = require('../middleware/checkPermission');
const {
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
} = require('../controllers/permissionController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Admin or Staff with staff.permissions permission
router.get('/',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getAllPermissions
);

// @desc    Get permission modules
// @route   GET /api/permissions/modules
// @access  Admin or Staff with staff.permissions permission
router.get('/modules',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getModules
);

// @desc    Get available actions
// @route   GET /api/permissions/actions
// @access  Admin or Staff with staff.permissions permission
router.get('/actions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getActions
);

// @desc    Get permission statistics
// @route   GET /api/permissions/stats
// @access  Admin or Staff with staff.permissions permission
router.get('/stats',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionStats
);

// @desc    Get permissions by module
// @route   GET /api/permissions/module/:module
// @access  Admin or Staff with staff.permissions permission
router.get('/module/:module',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionsByModule
);

// @desc    Get single permission
// @route   GET /api/permissions/:id
// @access  Admin or Staff with staff.permissions permission
router.get('/:id',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionById
);

// @desc    Create permission
// @route   POST /api/permissions
// @access  Admin only
router.post('/',
  authorize(['admin']),
  createPermission
);

// @desc    Initialize system permissions
// @route   POST /api/permissions/initialize
// @access  Admin only
router.post('/initialize',
  authorize(['admin']),
  initializePermissions
);

// @desc    Bulk create permissions
// @route   POST /api/permissions/bulk
// @access  Admin only
router.post('/bulk',
  authorize(['admin']),
  bulkCreatePermissions
);

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Admin only
router.put('/:id',
  authorize(['admin']),
  updatePermission
);

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Admin only
router.delete('/:id',
  authorize(['admin']),
  deletePermission
);

module.exports = router;

