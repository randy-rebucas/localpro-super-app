const express = require('express');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
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
} = require('../controllers/userManagementController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Admin/Manager
router.get('/', 
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getAllUsers
);

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Admin/Manager
router.get('/stats',
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getUserStats
);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin/Manager/Owner
router.get('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client']),
  getUserById
);

// @desc    Create new user
// @route   POST /api/users
// @access  Admin
router.post('/',
  authorize(['admin']),
  createUser
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin/Manager/Owner
router.put('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client']),
  updateUser
);

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/users/:id/status
// @access  Admin/Manager
router.patch('/:id/status',
  authorize(['admin', 'agency_admin']),
  updateUserStatus
);

// @desc    Update user verification status
// @route   PATCH /api/users/:id/verification
// @access  Admin/Manager
router.patch('/:id/verification',
  authorize(['admin', 'agency_admin']),
  updateUserVerification
);

// @desc    Add badge to user
// @route   POST /api/users/:id/badges
// @access  Admin/Manager
router.post('/:id/badges',
  authorize(['admin', 'agency_admin']),
  addUserBadge
);

// @desc    Bulk update users
// @route   PATCH /api/users/bulk
// @access  Admin
router.patch('/bulk',
  authorize(['admin']),
  bulkUpdateUsers
);

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Admin
router.delete('/:id',
  authorize(['admin']),
  deleteUser
);

module.exports = router;
