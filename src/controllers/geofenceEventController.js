const GeofenceEvent = require('../models/GeofenceEvent');
const Job = require('../models/Job');
const logger = require('../config/logger');
const { 
  validatePagination, 
  validateObjectId, 
  createPagination 
} = require('../utils/controllerValidation');
const { 
  sendPaginated, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  sendCreated
} = require('../utils/responseHelper');

/**
 * @desc    Create a new geofence event
 * @route   POST /api/geofence-events
 * @access  Private
 */
const createGeofenceEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId, eventType, location, timestamp } = req.body;

    // Validate required fields
    if (!jobId) {
      return sendValidationError(res, [{
        field: 'jobId',
        message: 'Job ID is required',
        code: 'JOB_ID_REQUIRED'
      }]);
    }

    if (!validateObjectId(jobId)) {
      return sendValidationError(res, [{
        field: 'jobId',
        message: 'Invalid job ID format',
        code: 'INVALID_JOB_ID'
      }]);
    }

    if (!eventType || !['entered', 'exited'].includes(eventType)) {
      return sendValidationError(res, [{
        field: 'eventType',
        message: 'Event type must be either "entered" or "exited"',
        code: 'INVALID_EVENT_TYPE'
      }]);
    }

    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return sendValidationError(res, [{
        field: 'location',
        message: 'Location with latitude and longitude is required',
        code: 'LOCATION_REQUIRED'
      }]);
    }

    // Validate location coordinates
    if (location.latitude < -90 || location.latitude > 90) {
      return sendValidationError(res, [{
        field: 'location.latitude',
        message: 'Latitude must be between -90 and 90',
        code: 'INVALID_LATITUDE'
      }]);
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return sendValidationError(res, [{
        field: 'location.longitude',
        message: 'Longitude must be between -180 and 180',
        code: 'INVALID_LONGITUDE'
      }]);
    }

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found');
    }

    // Create geofence event
    const geofenceEvent = new GeofenceEvent({
      userId,
      jobId,
      eventType,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await geofenceEvent.save();
    await geofenceEvent.populate('userId', 'firstName lastName');
    await geofenceEvent.populate('jobId', 'title');

    logger.info(`Geofence event created: ${geofenceEvent._id} for user: ${userId}, job: ${jobId}`);
    return sendCreated(res, geofenceEvent, 'Geofence event created successfully');
  } catch (error) {
    logger.error('Create geofence event error:', error);
    return sendServerError(res, 'Failed to create geofence event', error.message);
  }
};

/**
 * @desc    Get all geofence events (with filters)
 * @route   GET /api/geofence-events
 * @access  Private
 */
const getGeofenceEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      jobId, 
      eventType, 
      startDate, 
      endDate,
      targetUserId // For admin to view other users' events
    } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filterUserId = (req.user.roles?.includes('admin') && targetUserId) ? targetUserId : userId;
    const filter = { userId: filterUserId };

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

    // Event type filter
    if (eventType) {
      if (!['entered', 'exited'].includes(eventType)) {
        return sendValidationError(res, [{
          field: 'eventType',
          message: 'Event type must be either "entered" or "exited"',
          code: 'INVALID_EVENT_TYPE'
        }]);
      }
      filter.eventType = eventType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Count total
    const total = await GeofenceEvent.countDocuments(filter);

    // Get geofence events
    const events = await GeofenceEvent.find(filter)
      .populate('userId', 'firstName lastName')
      .populate('jobId', 'title')
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${events.length} geofence events for user: ${filterUserId}`);
    return sendPaginated(res, events, pagination, 'Geofence events retrieved successfully');
  } catch (error) {
    logger.error('Get geofence events error:', error);
    return sendServerError(res, 'Failed to retrieve geofence events', error.message);
  }
};

/**
 * @desc    Get geofence events for a specific job
 * @route   GET /api/geofence-events/job/:jobId
 * @access  Private
 */
const getGeofenceEventsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(jobId)) {
      return sendValidationError(res, [{
        field: 'jobId',
        message: 'Invalid job ID format',
        code: 'INVALID_JOB_ID'
      }]);
    }

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found');
    }

    // Check if user is job employer or admin
    if (job.employer.toString() !== userId && !req.user.roles?.includes('admin')) {
      return sendValidationError(res, [{
        field: 'jobId',
        message: 'Not authorized to view geofence events for this job',
        code: 'UNAUTHORIZED'
      }]);
    }

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Get geofence events
    const events = await GeofenceEvent.getEventsByJob(jobId)
      .populate('userId', 'firstName lastName')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await GeofenceEvent.countDocuments({ jobId });

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${events.length} geofence events for job: ${jobId}`);
    return sendPaginated(res, events, pagination, 'Geofence events retrieved successfully');
  } catch (error) {
    logger.error('Get geofence events by job error:', error);
    return sendServerError(res, 'Failed to retrieve geofence events', error.message);
  }
};

/**
 * @desc    Get geofence events for a specific user
 * @route   GET /api/geofence-events/user/:userId
 * @access  Private
 */
const getGeofenceEventsByUser = async (req, res) => {
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

    // Check if user is viewing their own events or is admin
    if (targetUserId !== currentUserId && !req.user.roles?.includes('admin')) {
      return sendValidationError(res, [{
        field: 'userId',
        message: 'Not authorized to view geofence events for this user',
        code: 'UNAUTHORIZED'
      }]);
    }

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Get geofence events
    const events = await GeofenceEvent.getEventsByUser(targetUserId)
      .populate('jobId', 'title')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await GeofenceEvent.countDocuments({ userId: targetUserId });

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${events.length} geofence events for user: ${targetUserId}`);
    return sendPaginated(res, events, pagination, 'Geofence events retrieved successfully');
  } catch (error) {
    logger.error('Get geofence events by user error:', error);
    return sendServerError(res, 'Failed to retrieve geofence events', error.message);
  }
};

module.exports = {
  createGeofenceEvent,
  getGeofenceEvents,
  getGeofenceEventsByJob,
  getGeofenceEventsByUser
};
