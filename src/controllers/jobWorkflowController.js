const JobWorkflowService = require('../services/jobWorkflowService');
const JobProgress = require('../models/JobProgress');
const TaskChecklist = require('../models/TaskChecklist');
const JobProof = require('../models/JobProof');
const JobIssue = require('../models/JobIssue');
const logger = require('../config/logger');
const { 
  validateObjectId
} = require('../utils/controllerValidation');
const { 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError
} = require('../utils/responseHelper');

// @desc    Initialize job progress
// @route   POST /api/job-workflow/progress/:jobId/initialize
// @access  Private
const initializeJobProgress = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;
    const { jobScheduleId, serviceType } = req.body;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const progress = await JobWorkflowService.initializeJobProgress(jobId, providerId, jobScheduleId, serviceType);

    return sendSuccess(res, progress, 'Job progress initialized successfully', 201);
  } catch (error) {
    logger.error('Error initializing job progress:', error);
    return sendServerError(res, 'Failed to initialize job progress');
  }
};

// @desc    Get job progress
// @route   GET /api/job-workflow/progress/:jobId
// @access  Private
const getJobProgress = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const progress = await JobProgress.findByJob(jobId, providerId);

    if (!progress) {
      return sendNotFoundError(res, 'Job progress not found');
    }

    return sendSuccess(res, progress);
  } catch (error) {
    logger.error('Error getting job progress:', error);
    return sendServerError(res, 'Failed to get job progress');
  }
};

// @desc    Start job
// @route   POST /api/job-workflow/progress/:jobId/start
// @access  Private
const startJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const progress = await JobWorkflowService.startJob(jobId, providerId);

    return sendSuccess(res, progress, 'Job started successfully');
  } catch (error) {
    logger.error('Error starting job:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to start job');
  }
};

// @desc    Pause job
// @route   POST /api/job-workflow/progress/:jobId/pause
// @access  Private
const pauseJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const progress = await JobWorkflowService.pauseJob(jobId, providerId);

    return sendSuccess(res, progress, 'Job paused successfully');
  } catch (error) {
    logger.error('Error pausing job:', error);
    return sendServerError(res, 'Failed to pause job');
  }
};

// @desc    Complete task
// @route   POST /api/job-workflow/progress/:jobId/tasks/:taskIndex/complete
// @access  Private
const completeTask = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId, taskIndex } = req.params;
    const { notes } = req.body;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const taskIdx = parseInt(taskIndex);
    if (isNaN(taskIdx)) {
      return sendValidationError(res, ['Invalid task index']);
    }

    const proofFiles = req.files || [];
    const progress = await JobWorkflowService.completeTask(jobId, providerId, taskIdx, notes, proofFiles);

    return sendSuccess(res, progress, 'Task completed successfully');
  } catch (error) {
    logger.error('Error completing task:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to complete task');
  }
};

// @desc    Complete job
// @route   POST /api/job-workflow/progress/:jobId/complete
// @access  Private
const completeJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const progress = await JobWorkflowService.completeJob(jobId, providerId);

    return sendSuccess(res, progress, 'Job completed successfully');
  } catch (error) {
    logger.error('Error completing job:', error);
    return sendServerError(res, 'Failed to complete job');
  }
};

// @desc    Upload proof of work
// @route   POST /api/job-workflow/proof/:jobId/upload
// @access  Private
const uploadProof = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;
    const { description, location } = req.body;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    if (!req.file) {
      return sendValidationError(res, ['Proof file is required']);
    }

    const locationData = location ? JSON.parse(location) : null;
    const proof = await JobWorkflowService.uploadProof(jobId, providerId, req.file, description, locationData);

    return sendSuccess(res, proof, 'Proof uploaded successfully', 201);
  } catch (error) {
    logger.error('Error uploading proof:', error);
    return sendServerError(res, 'Failed to upload proof');
  }
};

// @desc    Get proofs for job
// @route   GET /api/job-workflow/proof/:jobId
// @access  Private
const getProofs = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const proofs = await JobProof.findByJob(jobId);

    return sendSuccess(res, proofs);
  } catch (error) {
    logger.error('Error getting proofs:', error);
    return sendServerError(res, 'Failed to get proofs');
  }
};

// @desc    Report issue
// @route   POST /api/job-workflow/issues/:jobId
// @access  Private
const reportIssue = async (req, res) => {
  try {
    const reportedBy = req.user.id;
    const { jobId } = req.params;
    const { type, severity, title, description, jobProgressId, location } = req.body;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    if (!type || !title || !description) {
      return sendValidationError(res, ['type, title, and description are required']);
    }

    const locationData = location ? JSON.parse(location) : null;
    const issue = await JobWorkflowService.reportIssue({
      job: jobId,
      jobProgress: jobProgressId,
      reportedBy: reportedBy,
      type: type,
      severity: severity || 'medium',
      title: title,
      description: description,
      location: locationData,
      attachments: req.files ? req.files.map(f => ({
        filename: f.originalname,
        url: f.path || f.location,
        mimeType: f.mimetype,
        size: f.size
      })) : []
    });

    return sendSuccess(res, issue, 'Issue reported successfully', 201);
  } catch (error) {
    logger.error('Error reporting issue:', error);
    return sendServerError(res, 'Failed to report issue');
  }
};

// @desc    Get issues for job
// @route   GET /api/job-workflow/issues/:jobId
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const issues = await JobIssue.findByJob(jobId, status || null);

    return sendSuccess(res, issues);
  } catch (error) {
    logger.error('Error getting issues:', error);
    return sendServerError(res, 'Failed to get issues');
  }
};

// @desc    Escalate issue
// @route   PUT /api/job-workflow/issues/:issueId/escalate
// @access  Private (Admin/Dispatcher)
const escalateIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { escalatedTo, reason } = req.body;

    if (!validateObjectId(issueId).isValid) {
      return sendValidationError(res, ['Invalid issue ID']);
    }

    if (!escalatedTo || !reason) {
      return sendValidationError(res, ['escalatedTo and reason are required']);
    }

    const issue = await JobWorkflowService.escalateIssue(issueId, escalatedTo, reason);

    return sendSuccess(res, issue, 'Issue escalated successfully');
  } catch (error) {
    logger.error('Error escalating issue:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to escalate issue');
  }
};

// @desc    Resolve issue
// @route   PUT /api/job-workflow/issues/:issueId/resolve
// @access  Private (Admin/Dispatcher)
const resolveIssue = async (req, res) => {
  try {
    const resolvedBy = req.user.id;
    const { issueId } = req.params;
    const { resolutionNotes, actionTaken } = req.body;

    if (!validateObjectId(issueId).isValid) {
      return sendValidationError(res, ['Invalid issue ID']);
    }

    if (!resolutionNotes || !actionTaken) {
      return sendValidationError(res, ['resolutionNotes and actionTaken are required']);
    }

    const issue = await JobWorkflowService.resolveIssue(issueId, resolvedBy, resolutionNotes, actionTaken);

    return sendSuccess(res, issue, 'Issue resolved successfully');
  } catch (error) {
    logger.error('Error resolving issue:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to resolve issue');
  }
};

// @desc    Get task checklists
// @route   GET /api/job-workflow/checklists
// @access  Private
const getTaskChecklists = async (req, res) => {
  try {
    const { serviceType, categoryId } = req.query;

    let checklists;
    if (serviceType) {
      checklists = await TaskChecklist.find({ serviceType, isActive: true });
    } else if (categoryId) {
      checklists = await TaskChecklist.findByCategory(categoryId);
    } else {
      checklists = await TaskChecklist.find({ isActive: true });
    }

    return sendSuccess(res, checklists);
  } catch (error) {
    logger.error('Error getting task checklists:', error);
    return sendServerError(res, 'Failed to get task checklists');
  }
};

module.exports = {
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
};
