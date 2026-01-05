const SchedulingService = require('../services/schedulingService');
const JobRankingScore = require('../models/JobRankingScore');
const SchedulingSuggestion = require('../models/SchedulingSuggestion');
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

// @desc    Calculate job ranking for a provider
// @route   POST /api/scheduling/rank-job/:jobId
// @access  Private
const calculateJobRanking = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const ranking = await SchedulingService.calculateJobRanking(providerId, jobId);

    return sendSuccess(res, ranking, 'Job ranking calculated successfully');
  } catch (error) {
    logger.error('Error calculating job ranking:', error);
    return sendServerError(res, 'Failed to calculate job ranking');
  }
};

// @desc    Get ranked jobs for a provider
// @route   GET /api/scheduling/ranked-jobs
// @access  Private
const getRankedJobs = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { limit = 50, minScore = 0 } = req.query;

    const rankings = await JobRankingScore.findTopJobs(providerId, parseInt(limit), parseInt(minScore));

    return sendSuccess(res, rankings);
  } catch (error) {
    logger.error('Error getting ranked jobs:', error);
    return sendServerError(res, 'Failed to get ranked jobs');
  }
};

// @desc    Generate daily schedule suggestion
// @route   POST /api/scheduling/suggestions/daily
// @access  Private
const generateDailySuggestion = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { date } = req.body;

    const targetDate = date ? new Date(date) : new Date();

    const suggestion = await SchedulingService.generateDailyScheduleSuggestion(providerId, targetDate);

    return sendSuccess(res, suggestion, 'Daily schedule suggestion generated successfully', 201);
  } catch (error) {
    logger.error('Error generating daily suggestion:', error);
    return sendServerError(res, 'Failed to generate daily suggestion');
  }
};

// @desc    Generate weekly schedule suggestion
// @route   POST /api/scheduling/suggestions/weekly
// @access  Private
const generateWeeklySuggestion = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { weekStartDate } = req.body;

    const startDate = weekStartDate ? new Date(weekStartDate) : new Date();

    const suggestion = await SchedulingService.generateWeeklyScheduleSuggestion(providerId, startDate);

    return sendSuccess(res, suggestion, 'Weekly schedule suggestion generated successfully', 201);
  } catch (error) {
    logger.error('Error generating weekly suggestion:', error);
    return sendServerError(res, 'Failed to generate weekly suggestion');
  }
};

// @desc    Detect idle time and suggest fill-in jobs
// @route   POST /api/scheduling/suggestions/idle-time
// @access  Private
const detectIdleTimeAndSuggest = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { startDate, endDate } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    const suggestion = await SchedulingService.detectIdleTimeAndSuggestJobs(providerId, start, end);

    if (!suggestion) {
      return sendSuccess(res, null, 'No idle time detected');
    }

    return sendSuccess(res, suggestion, 'Idle time suggestions generated successfully', 201);
  } catch (error) {
    logger.error('Error detecting idle time:', error);
    return sendServerError(res, 'Failed to detect idle time');
  }
};

// @desc    Get scheduling suggestions
// @route   GET /api/scheduling/suggestions
// @access  Private
const getSuggestions = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { type } = req.query;

    const suggestions = await SchedulingSuggestion.findActiveSuggestions(providerId, type || null);

    return sendSuccess(res, suggestions);
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    return sendServerError(res, 'Failed to get suggestions');
  }
};

// @desc    Accept a job from suggestion
// @route   PUT /api/scheduling/suggestions/:id/accept-job/:jobId
// @access  Private
const acceptSuggestedJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id, jobId } = req.params;

    if (!validateObjectId(id).isValid || !validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid suggestion or job ID']);
    }

    const suggestion = await SchedulingSuggestion.findById(id);
    if (!suggestion) {
      return sendNotFoundError(res, 'Suggestion not found');
    }

    if (suggestion.provider.toString() !== providerId) {
      return sendValidationError(res, ['Not authorized to accept this suggestion']);
    }

    await suggestion.acceptJob(jobId);

    return sendSuccess(res, suggestion, 'Job accepted from suggestion');
  } catch (error) {
    logger.error('Error accepting suggested job:', error);
    return sendServerError(res, 'Failed to accept suggested job');
  }
};

// @desc    Reject a job from suggestion
// @route   PUT /api/scheduling/suggestions/:id/reject-job/:jobId
// @access  Private
const rejectSuggestedJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id, jobId } = req.params;

    if (!validateObjectId(id).isValid || !validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid suggestion or job ID']);
    }

    const suggestion = await SchedulingSuggestion.findById(id);
    if (!suggestion) {
      return sendNotFoundError(res, 'Suggestion not found');
    }

    if (suggestion.provider.toString() !== providerId) {
      return sendValidationError(res, ['Not authorized to reject this suggestion']);
    }

    await suggestion.rejectJob(jobId);

    return sendSuccess(res, suggestion, 'Job rejected from suggestion');
  } catch (error) {
    logger.error('Error rejecting suggested job:', error);
    return sendServerError(res, 'Failed to reject suggested job');
  }
};

// @desc    Learn from job outcome
// @route   POST /api/scheduling/learn-outcome
// @access  Private
const learnFromOutcome = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId, outcome } = req.body;

    if (!jobId || !outcome) {
      return sendValidationError(res, ['jobId and outcome are required']);
    }

    await SchedulingService.learnFromJobOutcome(providerId, jobId, outcome);

    return sendSuccess(res, null, 'Learning from job outcome completed');
  } catch (error) {
    logger.error('Error learning from outcome:', error);
    return sendServerError(res, 'Failed to learn from outcome');
  }
};

module.exports = {
  calculateJobRanking,
  getRankedJobs,
  generateDailySuggestion,
  generateWeeklySuggestion,
  detectIdleTimeAndSuggest,
  getSuggestions,
  acceptSuggestedJob,
  rejectSuggestedJob,
  learnFromOutcome
};
