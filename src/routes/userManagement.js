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
  deleteUser,
  restoreUser,
  banUser,
  getUserRoles,
  updateUserRoles,
  getUserBadges,
  deleteUserBadge,
  resetUserPassword,
  sendEmailToUser,
  exportUserData
} = require('../controllers/userManagementController');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.get('/', 
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getAllUsers
);

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.get('/stats',
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getUserStats
);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin/Manager/Owner - [ADMIN/AGENCY/USER ONLY]
router.get('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client']),
  getUserById
);

// @desc    Create new user
// @route   POST /api/users
// @access  Admin - [ADMIN ONLY]
router.post('/',
  authorize(['admin']),
  createUser
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin/Manager/Owner - [ADMIN/AGENCY/USER ONLY]
router.put('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client']),
  updateUser
);

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/users/:id/status
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.patch('/:id/status',
  authorize(['admin', 'agency_admin']),
  updateUserStatus
);

// @desc    Update user verification status
// @route   PATCH /api/users/:id/verification
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.patch('/:id/verification',
  authorize(['admin', 'agency_admin']),
  updateUserVerification
);

// @desc    Add badge to user
// @route   POST /api/users/:id/badges
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.post('/:id/badges',
  authorize(['admin', 'agency_admin']),
  addUserBadge
);

// @desc    Bulk update users
// @route   PATCH /api/users/bulk
// @access  Admin - [ADMIN ONLY]
router.patch('/bulk',
  authorize(['admin']),
  bulkUpdateUsers
);

// @desc    Restore soft-deleted user
// @route   PATCH /api/users/:id/restore
// @access  Admin - [ADMIN ONLY]
router.patch('/:id/restore',
  authorize(['admin']),
  restoreUser
);

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Admin - [ADMIN ONLY]
router.delete('/:id',
  authorize(['admin']),
  deleteUser
);

// @desc    Ban user
// @route   POST /api/users/:id/ban
// @access  Admin - [ADMIN ONLY]
router.post('/:id/ban',
  authorize(['admin']),
  banUser
);

// @desc    Get user roles
// @route   GET /api/users/:id/roles
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.get('/:id/roles',
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getUserRoles
);

// @desc    Update user roles
// @route   PUT /api/users/:id/roles
// @access  Admin - [ADMIN ONLY]
router.put('/:id/roles',
  authorize(['admin']),
  updateUserRoles
);

// @desc    Get user badges
// @route   GET /api/users/:id/badges
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.get('/:id/badges',
  authorize(['admin', 'agency_admin', 'agency_owner']),
  getUserBadges
);

// @desc    Delete user badge
// @route   DELETE /api/users/:id/badges/:badgeId
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.delete('/:id/badges/:badgeId',
  authorize(['admin', 'agency_admin']),
  deleteUserBadge
);

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Admin - [ADMIN ONLY]
router.post('/:id/reset-password',
  authorize(['admin']),
  resetUserPassword
);

// @desc    Send email to user
// @route   POST /api/users/:id/send-email
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.post('/:id/send-email',
  authorize(['admin', 'agency_admin', 'agency_owner']),
  sendEmailToUser
);

// @desc    Export user data
// @route   GET /api/users/:id/export
// @access  Admin - [ADMIN ONLY]
router.get('/:id/export',
  authorize(['admin']),
  exportUserData
);

module.exports = router;
