const express = require('express');
const { auth } = require('../middleware/auth');
const { uploaders } = require('../config/cloudinary');
const {
  initializeJobProgress,
  getJobProgress,
  startJob,
  pauseJob,
  completeTask,
  completeJob,
  uploadProof,
  getProofs,
  reportIssue,
  getIssues,
  escalateIssue,
  resolveIssue,
  getTaskChecklists
} = require('../controllers/jobWorkflowController');

const router = express.Router();

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}/initialize:
 *   post:
 *     summary: Initialize job progress with checklist
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/progress/:jobId/initialize', auth, initializeJobProgress);

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}:
 *   get:
 *     summary: Get job progress
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/progress/:jobId', auth, getJobProgress);

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}/start:
 *   post:
 *     summary: Start job
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/progress/:jobId/start', auth, startJob);

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}/pause:
 *   post:
 *     summary: Pause job
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/progress/:jobId/pause', auth, pauseJob);

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}/complete:
 *   post:
 *     summary: Complete job
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/progress/:jobId/complete', auth, completeJob);

/**
 * @swagger
 * /api/job-workflow/progress/{jobId}/tasks/{taskIndex}/complete:
 *   post:
 *     summary: Complete a task
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/progress/:jobId/tasks/:taskIndex/complete', 
  auth, 
  uploaders.general.array('proofFiles', 10),
  completeTask
);

/**
 * @swagger
 * /api/job-workflow/proof/{jobId}/upload:
 *   post:
 *     summary: Upload proof of work
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/proof/:jobId/upload', 
  auth,
  uploaders.general.single('file'),
  uploadProof
);

/**
 * @swagger
 * /api/job-workflow/proof/{jobId}:
 *   get:
 *     summary: Get proofs for job
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/proof/:jobId', auth, getProofs);

/**
 * @swagger
 * /api/job-workflow/issues/{jobId}:
 *   post:
 *     summary: Report an issue
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/issues/:jobId', 
  auth,
  uploaders.general.array('attachments', 5),
  reportIssue
);

/**
 * @swagger
 * /api/job-workflow/issues/{jobId}:
 *   get:
 *     summary: Get issues for job
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/issues/:jobId', auth, getIssues);

/**
 * @swagger
 * /api/job-workflow/issues/{issueId}/escalate:
 *   put:
 *     summary: Escalate issue
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.put('/issues/:issueId/escalate', auth, escalateIssue);

/**
 * @swagger
 * /api/job-workflow/issues/{issueId}/resolve:
 *   put:
 *     summary: Resolve issue
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.put('/issues/:issueId/resolve', auth, resolveIssue);

/**
 * @swagger
 * /api/job-workflow/checklists:
 *   get:
 *     summary: Get task checklists
 *     tags: [Job Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/checklists', auth, getTaskChecklists);

module.exports = router;
