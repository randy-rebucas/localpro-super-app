const express = require('express');
const { auth } = require('../middleware/auth');
const {
  calculateJobRanking,
  getRankedJobs,
  generateDailySuggestion,
  generateWeeklySuggestion,
  detectIdleTimeAndSuggest,
  getSuggestions,
  acceptSuggestedJob,
  rejectSuggestedJob,
  learnFromOutcome
} = require('../controllers/schedulingController');

const router = express.Router();

/**
 * @swagger
 * /api/scheduling/rank-job/{jobId}:
 *   post:
 *     summary: Calculate job ranking for a provider
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rank-job/:jobId', auth, calculateJobRanking);

/**
 * @swagger
 * /api/scheduling/ranked-jobs:
 *   get:
 *     summary: Get ranked jobs for a provider
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.get('/ranked-jobs', auth, getRankedJobs);

/**
 * @swagger
 * /api/scheduling/suggestions/daily:
 *   post:
 *     summary: Generate daily schedule suggestion
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post('/suggestions/daily', auth, generateDailySuggestion);

/**
 * @swagger
 * /api/scheduling/suggestions/weekly:
 *   post:
 *     summary: Generate weekly schedule suggestion
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post('/suggestions/weekly', auth, generateWeeklySuggestion);

/**
 * @swagger
 * /api/scheduling/suggestions/idle-time:
 *   post:
 *     summary: Detect idle time and suggest fill-in jobs
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post('/suggestions/idle-time', auth, detectIdleTimeAndSuggest);

/**
 * @swagger
 * /api/scheduling/suggestions:
 *   get:
 *     summary: Get scheduling suggestions
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.get('/suggestions', auth, getSuggestions);

/**
 * @swagger
 * /api/scheduling/suggestions/{id}/accept-job/{jobId}:
 *   put:
 *     summary: Accept a job from suggestion
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.put('/suggestions/:id/accept-job/:jobId', auth, acceptSuggestedJob);

/**
 * @swagger
 * /api/scheduling/suggestions/{id}/reject-job/{jobId}:
 *   put:
 *     summary: Reject a job from suggestion
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.put('/suggestions/:id/reject-job/:jobId', auth, rejectSuggestedJob);

/**
 * @swagger
 * /api/scheduling/learn-outcome:
 *   post:
 *     summary: Learn from job outcome (for continuous learning)
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post('/learn-outcome', auth, learnFromOutcome);

module.exports = router;
