const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const { auth } = require('../middleware/auth');
const {
  createTimeEntry,
  getTimeEntries,
  getTimeEntry,
  updateTimeEntry,
  getActiveTimeEntry,
  clockOut,
  requestManualEdit
} = require('../controllers/timeEntryController');

// Validation middleware
const validateTimeEntryId = [
  param('id').isMongoId().withMessage('Invalid time entry ID')
];

const validateUserId = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

const validateCreateTimeEntry = [
  body('clockInTime').optional().isISO8601().withMessage('clockInTime must be a valid ISO 8601 date'),
  body('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  body('source').optional().isIn(['mobile', 'admin']).withMessage('Source must be either "mobile" or "admin"'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('location.accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be a positive number')
];

const validateUpdateTimeEntry = [
  param('id').isMongoId().withMessage('Invalid time entry ID'),
  body('clockOutTime').optional().isISO8601().withMessage('clockOutTime must be a valid ISO 8601 date'),
  body('breakStartTime').optional().isISO8601().withMessage('breakStartTime must be a valid ISO 8601 date'),
  body('breakEndTime').optional().isISO8601().withMessage('breakEndTime must be a valid ISO 8601 date'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('location.accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be a positive number')
];

const validateClockOut = [
  param('id').isMongoId().withMessage('Invalid time entry ID'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('location.accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be a positive number')
];

const validateRequestManualEdit = [
  param('id').isMongoId().withMessage('Invalid time entry ID'),
  body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('status').optional().isIn(['active', 'completed']).withMessage('Status must be either "active" or "completed"')
];

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/time-entries:
 *   post:
 *     summary: Create a new time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clockInTime:
 *                 type: string
 *                 format: date-time
 *               jobId:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [mobile, admin]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *     responses:
 *       201:
 *         description: Time entry created
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get all time entries (with filters)
 *     tags: [Time Entries]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed]
 *     responses:
 *       200:
 *         description: List of time entries
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateCreateTimeEntry, createTimeEntry);
router.get('/', validateQueryParams, getTimeEntries);

/**
 * @swagger
 * /api/time-entries/active/{userId}:
 *   get:
 *     summary: Get active time entry for user
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active time entry
 *       404:
 *         description: No active time entry found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/active/:userId', validateUserId, getActiveTimeEntry);

/**
 * @swagger
 * /api/time-entries/{id}:
 *   get:
 *     summary: Get specific time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time entry details
 *       404:
 *         description: Time entry not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   patch:
 *     summary: Update time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clockOutTime:
 *                 type: string
 *                 format: date-time
 *               breakStartTime:
 *                 type: string
 *                 format: date-time
 *               breakEndTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *     responses:
 *       200:
 *         description: Time entry updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Time entry not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', validateTimeEntryId, getTimeEntry);
router.patch('/:id', validateUpdateTimeEntry, updateTimeEntry);

/**
 * @swagger
 * /api/time-entries/{id}/clock-out:
 *   post:
 *     summary: Clock out from active time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *     responses:
 *       200:
 *         description: Clocked out successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Time entry not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/clock-out', validateClockOut, clockOut);

/**
 * @swagger
 * /api/time-entries/{id}/request-edit:
 *   post:
 *     summary: Request manual edit for time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Edit request submitted
 *       400:
 *         description: Validation error
 *       404:
 *         description: Time entry not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/request-edit', validateRequestManualEdit, requestManualEdit);

module.exports = router;
