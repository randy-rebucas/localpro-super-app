const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const Job = require('../models/Job');
const logger = require('../config/logger');
const { 
  validatePagination, 
  validateObjectId, 
  createPagination 
} = require('../utils/controllerValidation');
const { 
  sendPaginated, 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  sendCreated,
  sendUpdated,
  sendAuthorizationError
} = require('../utils/responseHelper');

/**
 * @desc    Create a new time entry
 * @route   POST /api/time-entries
 * @access  Private
 */
const createTimeEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clockInTime, jobId, location, source = 'mobile' } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendNotFoundError(res, 'User not found');
    }

    // Check if user already has an active time entry
    const activeEntry = await TimeEntry.getActiveEntry(userId);
    if (activeEntry) {
      return sendValidationError(res, [{
        field: 'activeEntry',
        message: 'User already has an active time entry. Please clock out first.',
        code: 'ACTIVE_ENTRY_EXISTS'
      }]);
    }

    // Validate job if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return sendNotFoundError(res, 'Job not found');
      }
    }

    // Validate location if provided
    if (location) {
      if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
        return sendValidationError(res, [{
          field: 'location.latitude',
          message: 'Latitude must be a number between -90 and 90',
          code: 'INVALID_LATITUDE'
        }]);
      }
      if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
        return sendValidationError(res, [{
          field: 'location.longitude',
          message: 'Longitude must be a number between -180 and 180',
          code: 'INVALID_LONGITUDE'
        }]);
      }
    }

    // Create time entry
    const timeEntry = new TimeEntry({
      userId,
      clockInTime: clockInTime ? new Date(clockInTime) : new Date(),
      source,
      jobId: jobId || null,
      location: location || null
    });

    await timeEntry.save();
    await timeEntry.populate('userId', 'firstName lastName');
    if (jobId) {
      await timeEntry.populate('jobId', 'title');
    }

    logger.info(`Time entry created: ${timeEntry._id} for user: ${userId}`);
    return sendCreated(res, timeEntry, 'Time entry created successfully');
  } catch (error) {
    logger.error('Create time entry error:', error);
    return sendServerError(res, 'Failed to create time entry', error.message);
  }
};

/**
 * @desc    Get all time entries (with filters)
 * @route   GET /api/time-entries
 * @access  Private
 */
const getTimeEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      startDate, 
      endDate, 
      jobId, 
      status
    } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filter = { userId };

    // Date range filter
    if (startDate || endDate) {
      filter.clockInTime = {};
      if (startDate) {
        filter.clockInTime.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.clockInTime.$lte = new Date(endDate);
      }
    }

    // Job filter
    if (jobId) {
      if (!validateObjectId(jobId)) {
        return sendValidationError(res, [{
          field: 'jobId',
          message: 'Invalid job ID format',
          code: 'INVALID_JOB_ID'
        }]);
      }
      filter.jobId = jobId;
    }

    // Status filter (active/completed)
    if (status === 'active') {
      filter.clockOutTime = null;
    } else if (status === 'completed') {
      filter.clockOutTime = { $ne: null };
    }

    // Count total
    const total = await TimeEntry.countDocuments(filter);

    // Get time entries
    const timeEntries = await TimeEntry.find(filter)
      .populate('userId', 'firstName lastName')
      .populate('jobId', 'title')
      .sort({ clockInTime: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${timeEntries.length} time entries for user: ${userId}`);
    return sendPaginated(res, timeEntries, pagination, 'Time entries retrieved successfully');
  } catch (error) {
    logger.error('Get time entries error:', error);
    return sendServerError(res, 'Failed to retrieve time entries', error.message);
  }
};

/**
 * @desc    Get specific time entry
 * @route   GET /api/time-entries/:id
 * @access  Private
 */
const getTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid time entry ID format',
        code: 'INVALID_ID'
      }]);
    }

    const timeEntry = await TimeEntry.findById(id)
      .populate('userId', 'firstName lastName')
      .populate('jobId', 'title')
      .populate('manualEdit.requestedBy', 'firstName lastName')
      .populate('manualEdit.approvedBy', 'firstName lastName');

    if (!timeEntry) {
      return sendNotFoundError(res, 'Time entry not found');
    }

    // Check if user owns this time entry or is admin
    if (timeEntry.userId._id.toString() !== userId && !req.user.roles?.includes('admin')) {
      return sendAuthorizationError(res, 'Not authorized to view this time entry');
    }

    return sendSuccess(res, timeEntry, 'Time entry retrieved successfully');
  } catch (error) {
    logger.error('Get time entry error:', error);
    return sendServerError(res, 'Failed to retrieve time entry', error.message);
  }
};

/**
 * @desc    Update time entry
 * @route   PATCH /api/time-entries/:id
 * @access  Private
 */
const updateTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { clockOutTime, breakStartTime, breakEndTime, location } = req.body;

    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid time entry ID format',
        code: 'INVALID_ID'
      }]);
    }

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return sendNotFoundError(res, 'Time entry not found');
    }

    // Check if user owns this time entry or is admin
    if (timeEntry.userId.toString() !== userId && !req.user.roles?.includes('admin')) {
      return sendAuthorizationError(res, 'Not authorized to update this time entry');
    }

    // Update fields
    if (clockOutTime !== undefined) {
      timeEntry.clockOutTime = clockOutTime ? new Date(clockOutTime) : null;
    }
    if (breakStartTime !== undefined) {
      timeEntry.breakStartTime = breakStartTime ? new Date(breakStartTime) : null;
    }
    if (breakEndTime !== undefined) {
      timeEntry.breakEndTime = breakEndTime ? new Date(breakEndTime) : null;
    }
    if (location !== undefined) {
      timeEntry.location = location;
    }

    await timeEntry.save();
    await timeEntry.populate('userId', 'firstName lastName');
    if (timeEntry.jobId) {
      await timeEntry.populate('jobId', 'title');
    }

    logger.info(`Time entry updated: ${id}`);
    return sendUpdated(res, timeEntry, 'Time entry updated successfully');
  } catch (error) {
    logger.error('Update time entry error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        code: 'VALIDATION_ERROR'
      }));
      return sendValidationError(res, errors);
    }
    return sendServerError(res, 'Failed to update time entry', error.message);
  }
};

/**
 * @desc    Get active time entry for user
 * @route   GET /api/time-entries/active/:userId
 * @access  Private
 */
const getActiveTimeEntry = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    if (!validateObjectId(targetUserId)) {
      return sendValidationError(res, [{
        field: 'userId',
        message: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      }]);
    }

    // Check if user is viewing their own entry or is admin
    if (targetUserId !== currentUserId && !req.user.roles?.includes('admin')) {
      return sendAuthorizationError(res, 'Not authorized to view this user\'s active time entry');
    }

    const activeEntry = await TimeEntry.getActiveEntry(targetUserId)
      .populate('userId', 'firstName lastName')
      .populate('jobId', 'title');

    if (!activeEntry) {
      return sendNotFoundError(res, 'No active time entry found');
    }

    return sendSuccess(res, activeEntry, 'Active time entry retrieved successfully');
  } catch (error) {
    logger.error('Get active time entry error:', error);
    return sendServerError(res, 'Failed to retrieve active time entry', error.message);
  }
};

/**
 * @desc    Clock out from active time entry
 * @route   POST /api/time-entries/:id/clock-out
 * @access  Private
 */
const clockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { location } = req.body;

    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid time entry ID format',
        code: 'INVALID_ID'
      }]);
    }

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return sendNotFoundError(res, 'Time entry not found');
    }

    // Check if user owns this time entry
    if (timeEntry.userId.toString() !== userId) {
      return sendAuthorizationError(res, 'Not authorized to clock out this time entry');
    }

    // Check if already clocked out
    if (timeEntry.clockOutTime) {
      return sendValidationError(res, [{
        field: 'clockOutTime',
        message: 'Time entry is already clocked out',
        code: 'ALREADY_CLOCKED_OUT'
      }]);
    }

    // Clock out
    timeEntry.clockOutTime = new Date();
    if (location) {
      timeEntry.location = { ...timeEntry.location, ...location };
    }

    await timeEntry.save();
    await timeEntry.populate('userId', 'firstName lastName');
    if (timeEntry.jobId) {
      await timeEntry.populate('jobId', 'title');
    }

    logger.info(`User ${userId} clocked out from time entry: ${id}`);
    return sendUpdated(res, timeEntry, 'Clocked out successfully');
  } catch (error) {
    logger.error('Clock out error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        code: 'VALIDATION_ERROR'
      }));
      return sendValidationError(res, errors);
    }
    return sendServerError(res, 'Failed to clock out', error.message);
  }
};

/**
 * @desc    Request manual edit for time entry
 * @route   POST /api/time-entries/:id/request-edit
 * @access  Private
 */
const requestManualEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid time entry ID format',
        code: 'INVALID_ID'
      }]);
    }

    if (!reason || reason.trim().length === 0) {
      return sendValidationError(res, [{
        field: 'reason',
        message: 'Reason is required for manual edit request',
        code: 'REASON_REQUIRED'
      }]);
    }

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return sendNotFoundError(res, 'Time entry not found');
    }

    // Check if user owns this time entry
    if (timeEntry.userId.toString() !== userId) {
      return sendAuthorizationError(res, 'Not authorized to request edit for this time entry');
    }

    // Check if edit request already exists
    if (timeEntry.manualEdit && timeEntry.manualEdit.status === 'pending') {
      return sendValidationError(res, [{
        field: 'manualEdit',
        message: 'A pending edit request already exists for this time entry',
        code: 'PENDING_EDIT_EXISTS'
      }]);
    }

    // Create edit request
    timeEntry.manualEdit = {
      requestedBy: userId,
      approvedBy: null,
      reason: reason.trim(),
      status: 'pending'
    };

    await timeEntry.save();
    await timeEntry.populate('userId', 'firstName lastName');
    await timeEntry.populate('manualEdit.requestedBy', 'firstName lastName');

    logger.info(`Manual edit requested for time entry: ${id} by user: ${userId}`);
    return sendUpdated(res, timeEntry, 'Manual edit request submitted successfully');
  } catch (error) {
    logger.error('Request manual edit error:', error);
    return sendServerError(res, 'Failed to submit manual edit request', error.message);
  }
};

module.exports = {
  createTimeEntry,
  getTimeEntries,
  getTimeEntry,
  updateTimeEntry,
  getActiveTimeEntry,
  clockOut,
  requestManualEdit
};
