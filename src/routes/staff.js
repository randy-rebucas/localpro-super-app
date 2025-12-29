const express = require('express');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const {
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
} = require('../controllers/staffController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Admin or Staff with staff.view permission
router.get('/',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getAllStaff
);

// @desc    Get staff statistics
// @route   GET /api/staff/stats
// @access  Admin or Staff with staff.view permission
router.get('/stats',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getStaffStats
);

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Admin or Staff with staff.view permission
router.get('/:id',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getStaffById
);

// @desc    Create staff member
// @route   POST /api/staff
// @access  Admin or Staff with staff.create permission
router.post('/',
  checkPermission(['staff.create', 'system.manage'], { requireAll: false }),
  createStaff
);

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Admin or Staff with staff.update permission
router.put('/:id',
  checkPermission(['staff.update', 'system.manage'], { requireAll: false }),
  updateStaff
);

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Admin or Staff with staff.manage permission
router.delete('/:id',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  deleteStaff
);

// @desc    Get staff permissions
// @route   GET /api/staff/:id/permissions
// @access  Admin or Staff with staff.view permission
router.get('/:id/permissions',
  checkPermission(['staff.view', 'staff.permissions', 'system.manage'], { requireAll: false }),
  getStaffPermissions
);

// @desc    Assign permissions to staff
// @route   POST /api/staff/:id/permissions
// @access  Admin or Staff with staff.permissions permission
router.post('/:id/permissions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  assignPermissions
);

// @desc    Revoke permissions from staff
// @route   DELETE /api/staff/:id/permissions
// @access  Admin or Staff with staff.permissions permission
router.delete('/:id/permissions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  revokePermissions
);

// @desc    Bulk update staff status
// @route   PATCH /api/staff/bulk/status
// @access  Admin or Staff with staff.manage permission
router.patch('/bulk/status',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  bulkUpdateStaffStatus
);

// @desc    Remove staff role from user
// @route   PATCH /api/staff/:id/remove-role
// @access  Admin or Staff with staff.manage permission
router.patch('/:id/remove-role',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  removeStaffRole
);

module.exports = router;

