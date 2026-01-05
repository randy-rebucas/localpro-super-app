const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const { auth } = require('../middleware/auth');
const {
  createGPSLog,
  batchCreateGPSLogs,
  getGPSLogsByTimeEntry,
  getGPSLogs
} = require('../controllers/gpsLogController');

// Validation middleware
const validateTimeEntryId = [
  param('timeEntryId').isMongoId().withMessage('Invalid time entry ID')
];

const validateCreateGPSLog = [
  body('timeEntryId').optional().isMongoId().withMessage('Invalid time entry ID'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
  body('altitude').optional().isFloat().withMessage('Altitude must be a number'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be a positive number'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  body('timestamp').optional().isISO8601().withMessage('timestamp must be a valid ISO 8601 date')
];

const validateBatchCreateGPSLogs = [
  body('logs').isArray({ min: 1, max: 100 }).withMessage('Logs must be an array with 1-100 items'),
  body('logs.*.timeEntryId').optional().isMongoId().withMessage('Invalid time entry ID'),
  body('logs.*.latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('logs.*.longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('logs.*.accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
  body('logs.*.altitude').optional().isFloat().withMessage('Altitude must be a number'),
  body('logs.*.speed').optional().isFloat({ min: 0 }).withMessage('Speed must be a positive number'),
  body('logs.*.heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  body('logs.*.timestamp').optional().isISO8601().withMessage('timestamp must be a valid ISO 8601 date')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  query('timeEntryId').optional().isMongoId().withMessage('Invalid time entry ID')
];

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/gps-logs:
 *   post:
 *     summary: Create a new GPS log
 *     tags: [GPS Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               timeEntryId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               altitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: GPS log created
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get GPS logs (with filters)
 *     tags: [GPS Logs]
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
 *         name: timeEntryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of GPS logs
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateCreateGPSLog, createGPSLog);
router.get('/', validateQueryParams, getGPSLogs);

/**
 * @swagger
 * /api/gps-logs/batch:
 *   post:
 *     summary: Batch create GPS logs
 *     tags: [GPS Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - latitude
 *                     - longitude
 *                   properties:
 *                     timeEntryId:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     accuracy:
 *                       type: number
 *                     altitude:
 *                       type: number
 *                     speed:
 *                       type: number
 *                     heading:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: GPS logs created
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/batch', validateBatchCreateGPSLogs, batchCreateGPSLogs);

/**
 * @swagger
 * /api/gps-logs/time-entry/{timeEntryId}:
 *   get:
 *     summary: Get GPS logs for a time entry
 *     tags: [GPS Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timeEntryId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: List of GPS logs
 *       404:
 *         description: Time entry not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/time-entry/:timeEntryId', validateTimeEntryId, validateQueryParams, getGPSLogsByTimeEntry);

module.exports = router;
