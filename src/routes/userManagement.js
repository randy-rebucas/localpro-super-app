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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.get('/', 
  authorize(['admin', 'agency_admin', 'agency_owner', 'partner']),
  getAllUsers
);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats',
  authorize(['admin', 'agency_admin', 'agency_owner', 'partner']),
  getUserStats
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client', 'partner']),
  getUserById
);

router.post('/',
  authorize(['admin', 'partner']),
  createUser
);

router.put('/:id',
  authorize(['admin', 'agency_admin', 'agency_owner', 'provider', 'client']),
  updateUser
);

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/users/:id/status
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.patch('/:id/status',
  authorize(['admin', 'agency_admin', 'partner']),
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
  authorize(['admin', 'agency_admin', 'agency_owner', 'partner']),
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
  authorize(['admin', 'agency_admin', 'agency_owner', 'partner']),
  getUserBadges
);

// @desc    Delete user badge
// @route   DELETE /api/users/:id/badges/:badgeId
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.delete('/:id/badges/:badgeId',
  authorize(['admin', 'agency_admin', 'partner']),
  deleteUserBadge
);

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Admin - [ADMIN ONLY]
router.post('/:id/reset-password',
  authorize(['admin', 'partner']),
  resetUserPassword
);

// @desc    Send email to user
// @route   POST /api/users/:id/send-email
// @access  Admin/Manager - [ADMIN/AGENCY ONLY]
router.post('/:id/send-email',
  authorize(['admin', 'agency_admin', 'agency_owner', 'partner']),
  sendEmailToUser
);

// @desc    Export user data
// @route   GET /api/users/:id/export
// @access  Admin - [ADMIN ONLY]
router.get('/:id/export',
  authorize(['admin', 'partner']),
  exportUserData
);

module.exports = router;
