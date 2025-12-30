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

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
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
 *     responses:
 *       200:
 *         description: List of staff members
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getAllStaff
);

/**
 * @swagger
 * /api/staff/stats:
 *   get:
 *     summary: Get staff statistics
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff statistics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getStaffStats
);

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get single staff member
 *     tags: [Staff]
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
 *         description: Staff member details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
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
 *         description: Staff member updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete staff member
 *     tags: [Staff]
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
 *         description: Staff member deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id',
  checkPermission(['staff.view', 'system.manage'], { requireAll: false }),
  getStaffById
);

router.post('/',
  checkPermission(['staff.create', 'system.manage'], { requireAll: false }),
  createStaff
);

router.put('/:id',
  checkPermission(['staff.update', 'system.manage'], { requireAll: false }),
  updateStaff
);

router.delete('/:id',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  deleteStaff
);

/**
 * @swagger
 * /api/staff/{id}/permissions:
 *   get:
 *     summary: Get staff permissions
 *     tags: [Staff]
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
 *         description: Staff permissions
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Assign permissions to staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
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
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions assigned
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Revoke permissions from staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
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
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions revoked
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/permissions',
  checkPermission(['staff.view', 'staff.permissions', 'system.manage'], { requireAll: false }),
  getStaffPermissions
);

router.post('/:id/permissions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  assignPermissions
);

router.delete('/:id/permissions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  revokePermissions
);

/**
 * @swagger
 * /api/staff/bulk/status:
 *   patch:
 *     summary: Bulk update staff status
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffIds
 *               - status
 *             properties:
 *               staffIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/bulk/status',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  bulkUpdateStaffStatus
);

/**
 * @swagger
 * /api/staff/{id}/remove-role:
 *   patch:
 *     summary: Remove staff role from user
 *     tags: [Staff]
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
 *         description: Staff role removed
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/:id/remove-role',
  checkPermission(['staff.manage', 'system.manage'], { requireAll: false }),
  removeStaffRole
);

module.exports = router;

