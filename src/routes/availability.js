const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createAvailability,
  getAvailability,
  getCalendarView,
  updateAvailability,
  deleteAvailability,
  getSchedules,
  createRescheduleRequest,
  approveRescheduleRequest,
  rejectRescheduleRequest,
  getRescheduleRequests
} = require('../controllers/availabilityController');

const router = express.Router();

/**
 * @swagger
 * /api/availability:
 *   post:
 *     summary: Create availability block
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, createAvailability);

/**
 * @swagger
 * /api/availability:
 *   get:
 *     summary: Get availability for a provider
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, getAvailability);

/**
 * @swagger
 * /api/availability/calendar:
 *   get:
 *     summary: Get calendar view (day/week)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get('/calendar', auth, getCalendarView);

/**
 * @swagger
 * /api/availability/{id}:
 *   put:
 *     summary: Update availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', auth, updateAvailability);

/**
 * @swagger
 * /api/availability/{id}:
 *   delete:
 *     summary: Delete availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', auth, deleteAvailability);

/**
 * @swagger
 * /api/availability/schedules:
 *   get:
 *     summary: Get job schedules
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get('/schedules', auth, getSchedules);

/**
 * @swagger
 * /api/availability/reschedule:
 *   post:
 *     summary: Create reschedule request
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reschedule', auth, createRescheduleRequest);

/**
 * @swagger
 * /api/availability/reschedule:
 *   get:
 *     summary: Get reschedule requests
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reschedule', auth, getRescheduleRequests);

/**
 * @swagger
 * /api/availability/reschedule/{id}/approve:
 *   put:
 *     summary: Approve reschedule request
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.put('/reschedule/:id/approve', auth, approveRescheduleRequest);

/**
 * @swagger
 * /api/availability/reschedule/{id}/reject:
 *   put:
 *     summary: Reject reschedule request
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.put('/reschedule/:id/reject', auth, rejectRescheduleRequest);

module.exports = router;
