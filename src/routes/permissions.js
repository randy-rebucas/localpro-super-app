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

/**
 * @swagger
 * /api/permissions/module/{module}:
 *   get:
 *     summary: Get permissions by module
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permissions for module
 */
router.get('/module/:module',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionsByModule
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     summary: Get single permission
 *     tags: [Permissions]
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
 *         description: Permission details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update permission (Admin only)
 *     tags: [Permissions]
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
 *         description: Permission updated
 *   delete:
 *     summary: Delete permission (Admin only)
 *     tags: [Permissions]
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
 *         description: Permission deleted
 */
router.get('/:id',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionById
);

router.post('/',
  authorize(['admin']),
  createPermission
);

/**
 * @swagger
 * /api/permissions/initialize:
 *   post:
 *     summary: Initialize system permissions (Admin only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions initialized
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/initialize',
  authorize(['admin']),
  initializePermissions
);

/**
 * @swagger
 * /api/permissions/bulk:
 *   post:
 *     summary: Bulk create permissions (Admin only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Permissions created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/bulk',
  authorize(['admin']),
  bulkCreatePermissions
);

router.put('/:id',
  authorize(['admin']),
  updatePermission
);

router.delete('/:id',
  authorize(['admin']),
  deletePermission
);

module.exports = router;

