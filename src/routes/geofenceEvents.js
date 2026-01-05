const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const { auth } = require('../middleware/auth');
const {
  createGeofenceEvent,
  getGeofenceEvents,
  getGeofenceEventsByJob,
  getGeofenceEventsByUser
} = require('../controllers/geofenceEventController');

// Validation middleware
const validateJobId = [
  param('jobId').isMongoId().withMessage('Invalid job ID')
];

const validateUserId = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

const validateCreateGeofenceEvent = [
  body('jobId').isMongoId().withMessage('Invalid job ID'),
  body('eventType').isIn(['entered', 'exited']).withMessage('Event type must be either "entered" or "exited"'),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('timestamp').optional().isISO8601().withMessage('timestamp must be a valid ISO 8601 date')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('eventType').optional().isIn(['entered', 'exited']).withMessage('Event type must be either "entered" or "exited"'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  query('targetUserId').optional().isMongoId().withMessage('Invalid user ID')
];

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/geofence-events:
 *   post:
 *     summary: Create a new geofence event
 *     tags: [Geofence Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - eventType
 *               - location
 *             properties:
 *               jobId:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [entered, exited]
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Geofence event created
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get all geofence events (with filters)
 *     tags: [Geofence Events]
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
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [entered, exited]
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
 *         name: targetUserId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of geofence events
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateCreateGeofenceEvent, createGeofenceEvent);
router.get('/', validateQueryParams, getGeofenceEvents);

/**
 * @swagger
 * /api/geofence-events/job/{jobId}:
 *   get:
 *     summary: Get geofence events for a specific job
 *     tags: [Geofence Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *         description: List of geofence events
 *       404:
 *         description: Job not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/job/:jobId', validateJobId, validateQueryParams, getGeofenceEventsByJob);

/**
 * @swagger
 * /api/geofence-events/user/{userId}:
 *   get:
 *     summary: Get geofence events for a specific user
 *     tags: [Geofence Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *         description: List of geofence events
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user/:userId', validateUserId, validateQueryParams, getGeofenceEventsByUser);

module.exports = router;
