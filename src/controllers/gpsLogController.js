/**
 * @desc    Delete a GPS log by ID
 * @route   DELETE /api/gps-logs/:id
 * @access  Private
 */
const deleteGPSLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid GPS log ID format',
        code: 'INVALID_GPS_LOG_ID'
      }]);
    }
    const gpsLog = await GPSLog.findByIdAndDelete(id);
    if (!gpsLog) {
      return sendNotFoundError(res, 'GPS log not found');
    }
    logger.info(`GPS log deleted: ${id}`);
    return res.status(204).send();
  } catch (err) {
    logger.error('Error deleting GPS log:', err);
    return sendServerError(res, 'Failed to delete GPS log');
  }
};
/**
 * @desc    Update a GPS log by ID
 * @route   PUT /api/gps-logs/:id
 * @access  Private
 */
const updateGPSLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid GPS log ID format',
        code: 'INVALID_GPS_LOG_ID'
      }]);
    }
    const updateFields = {};
    const allowedFields = ['latitude', 'longitude', 'accuracy', 'altitude', 'speed', 'heading', 'timestamp', 'timeEntryId'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }
    if (Object.keys(updateFields).length === 0) {
      return sendValidationError(res, [{
        message: 'No valid fields provided for update',
        code: 'NO_UPDATE_FIELDS'
      }]);
    }
    // Validate coordinates if present
    if (updateFields.latitude !== undefined && (typeof updateFields.latitude !== 'number' || updateFields.latitude < -90 || updateFields.latitude > 90)) {
      return sendValidationError(res, [{
        field: 'latitude',
        message: 'Latitude must be a number between -90 and 90',
        code: 'INVALID_LATITUDE'
      }]);
    }
    if (updateFields.longitude !== undefined && (typeof updateFields.longitude !== 'number' || updateFields.longitude < -180 || updateFields.longitude > 180)) {
      return sendValidationError(res, [{
        field: 'longitude',
        message: 'Longitude must be a number between -180 and 180',
        code: 'INVALID_LONGITUDE'
      }]);
    }
    if (updateFields.heading !== undefined && (updateFields.heading < 0 || updateFields.heading > 360)) {
      return sendValidationError(res, [{
        field: 'heading',
        message: 'Heading must be a number between 0 and 360',
        code: 'INVALID_HEADING'
      }]);
    }
    if (updateFields.timeEntryId && !validateObjectId(updateFields.timeEntryId)) {
      return sendValidationError(res, [{
        field: 'timeEntryId',
        message: 'Invalid time entry ID format',
        code: 'INVALID_TIME_ENTRY_ID'
      }]);
    }
    const gpsLog = await GPSLog.findByIdAndUpdate(id, updateFields, { new: true });
    if (!gpsLog) {
      return sendNotFoundError(res, 'GPS log not found');
    }
    logger.info(`GPS log updated: ${gpsLog._id}`);
    return res.json({ success: true, data: gpsLog, message: 'GPS log updated successfully' });
  } catch (err) {
    logger.error('Error updating GPS log:', err);
    return sendServerError(res, 'Failed to update GPS log');
  }
};
/**
 * @desc    Get a GPS log by ID
 * @route   GET /api/gps-logs/:id
 * @access  Private
 */
const getGPSLogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid GPS log ID format',
        code: 'INVALID_GPS_LOG_ID'
      }]);
    }
    const gpsLog = await GPSLog.findById(id);
    if (!gpsLog) {
      return sendNotFoundError(res, 'GPS log not found');
    }
    return res.json({ success: true, data: gpsLog });
  } catch (err) {
    logger.error('Error fetching GPS log by ID:', err);
    return sendServerError(res, 'Failed to fetch GPS log');
  }
};
const GPSLog = require('../models/GPSLog');
const TimeEntry = require('../models/TimeEntry');
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
 * @desc    Create a new GPS log
 * @route   POST /api/gps-logs
 * @access  Private
 */
const createGPSLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeEntryId, latitude, longitude, accuracy, altitude, speed, heading, timestamp } = req.body;

    // Validate location coordinates
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return sendValidationError(res, [{
        field: 'latitude',
        message: 'Latitude must be a number between -90 and 90',
        code: 'INVALID_LATITUDE'
      }]);
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return sendValidationError(res, [{
        field: 'longitude',
        message: 'Longitude must be a number between -180 and 180',
        code: 'INVALID_LONGITUDE'
      }]);
    }

    // Validate time entry if provided
    if (timeEntryId) {
      if (!validateObjectId(timeEntryId)) {
        return sendValidationError(res, [{
          field: 'timeEntryId',
          message: 'Invalid time entry ID format',
          code: 'INVALID_TIME_ENTRY_ID'
        }]);
      }

      const timeEntry = await TimeEntry.findById(timeEntryId);
      if (!timeEntry) {
        return sendNotFoundError(res, 'Time entry not found');
      }

      // Verify time entry belongs to user
      if (timeEntry.userId.toString() !== userId) {
        return sendValidationError(res, [{
          field: 'timeEntryId',
          message: 'Time entry does not belong to the current user',
          code: 'INVALID_TIME_ENTRY_OWNER'
        }]);
      }
    }

    // Validate heading if provided
    if (heading !== undefined && (heading < 0 || heading > 360)) {
      return sendValidationError(res, [{
        field: 'heading',
        message: 'Heading must be a number between 0 and 360',
        code: 'INVALID_HEADING'
      }]);
    }

    // Create GPS log
    const gpsLog = new GPSLog({
      userId,
      timeEntryId: timeEntryId || null,
      latitude,
      longitude,
      accuracy: accuracy || null,
      altitude: altitude || null,
      speed: speed || null,
      heading: heading || null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await gpsLog.save();

    logger.info(`GPS log created: ${gpsLog._id} for user: ${userId}`);
    return sendCreated(res, gpsLog, 'GPS log created successfully');
  } catch (error) {
    logger.error('Create GPS log error:', error);
    return sendServerError(res, 'Failed to create GPS log', error.message);
  }
};

/**
 * @desc    Batch create GPS logs
 * @route   POST /api/gps-logs/batch
 * @access  Private
 */
const batchCreateGPSLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return sendValidationError(res, [{
        field: 'logs',
        message: 'Logs must be a non-empty array',
        code: 'INVALID_LOGS_ARRAY'
      }]);
    }

    // Limit batch size
    if (logs.length > 100) {
      return sendValidationError(res, [{
        field: 'logs',
        message: 'Batch size cannot exceed 100 logs',
        code: 'BATCH_SIZE_EXCEEDED'
      }]);
    }

    // Validate all logs
    const validatedLogs = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      // Validate required fields
      if (typeof log.latitude !== 'number' || log.latitude < -90 || log.latitude > 90) {
        return sendValidationError(res, [{
          field: `logs[${i}].latitude`,
          message: 'Latitude must be a number between -90 and 90',
          code: 'INVALID_LATITUDE'
        }]);
      }

      if (typeof log.longitude !== 'number' || log.longitude < -180 || log.longitude > 180) {
        return sendValidationError(res, [{
          field: `logs[${i}].longitude`,
          message: 'Longitude must be a number between -180 and 180',
          code: 'INVALID_LONGITUDE'
        }]);
      }

      // Validate time entry if provided
      if (log.timeEntryId) {
        if (!validateObjectId(log.timeEntryId)) {
          return sendValidationError(res, [{
            field: `logs[${i}].timeEntryId`,
            message: 'Invalid time entry ID format',
            code: 'INVALID_TIME_ENTRY_ID'
          }]);
        }

        const timeEntry = await TimeEntry.findById(log.timeEntryId);
        if (!timeEntry || timeEntry.userId.toString() !== userId) {
          return sendValidationError(res, [{
            field: `logs[${i}].timeEntryId`,
            message: 'Time entry not found or does not belong to user',
            code: 'INVALID_TIME_ENTRY'
          }]);
        }
      }

      // Validate heading if provided
      if (log.heading !== undefined && (log.heading < 0 || log.heading > 360)) {
        return sendValidationError(res, [{
          field: `logs[${i}].heading`,
          message: 'Heading must be a number between 0 and 360',
          code: 'INVALID_HEADING'
        }]);
      }

      validatedLogs.push({
        userId,
        timeEntryId: log.timeEntryId || null,
        latitude: log.latitude,
        longitude: log.longitude,
        accuracy: log.accuracy || null,
        altitude: log.altitude || null,
        speed: log.speed || null,
        heading: log.heading || null,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
      });
    }

    // Batch insert
    const createdLogs = await GPSLog.batchCreate(validatedLogs);

    logger.info(`Batch created ${createdLogs.length} GPS logs for user: ${userId}`);
    return sendCreated(res, {
      count: createdLogs.length,
      logs: createdLogs
    }, `${createdLogs.length} GPS logs created successfully`);
  } catch (error) {
    logger.error('Batch create GPS logs error:', error);
    return sendServerError(res, 'Failed to batch create GPS logs', error.message);
  }
};

/**
 * @desc    Get GPS logs for a time entry
 * @route   GET /api/gps-logs/time-entry/:timeEntryId
 * @access  Private
 */
const getGPSLogsByTimeEntry = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(timeEntryId)) {
      return sendValidationError(res, [{
        field: 'timeEntryId',
        message: 'Invalid time entry ID format',
        code: 'INVALID_TIME_ENTRY_ID'
      }]);
    }

    // Validate time entry exists and belongs to user
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return sendNotFoundError(res, 'Time entry not found');
    }

    if (timeEntry.userId.toString() !== userId && !req.user.roles?.includes('admin')) {
      return sendValidationError(res, [{
        field: 'timeEntryId',
        message: 'Not authorized to view GPS logs for this time entry',
        code: 'UNAUTHORIZED'
      }]);
    }

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Get GPS logs
    const logs = await GPSLog.getLogsByTimeEntry(timeEntryId)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await GPSLog.countDocuments({ timeEntryId });

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${logs.length} GPS logs for time entry: ${timeEntryId}`);
    return sendPaginated(res, logs, pagination, 'GPS logs retrieved successfully');
  } catch (error) {
    logger.error('Get GPS logs by time entry error:', error);
    return sendServerError(res, 'Failed to retrieve GPS logs', error.message);
  }
};

/**
 * @desc    Get GPS logs for user in time range
 * @route   GET /api/gps-logs
 * @access  Private
 */
const getGPSLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, timeEntryId } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filter = { userId };

    // Time entry filter
    if (timeEntryId) {
      if (!validateObjectId(timeEntryId)) {
        return sendValidationError(res, [{
          field: 'timeEntryId',
          message: 'Invalid time entry ID format',
          code: 'INVALID_TIME_ENTRY_ID'
        }]);
      }
      filter.timeEntryId = timeEntryId;
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
    const total = await GPSLog.countDocuments(filter);

    // Get GPS logs
    const logs = await GPSLog.find(filter)
      .sort({ timestamp: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const pagination = createPagination(pageNum, limitNum, total);
    logger.info(`Retrieved ${logs.length} GPS logs for user: ${userId}`);
    return sendPaginated(res, logs, pagination, 'GPS logs retrieved successfully');
  } catch (error) {
    logger.error('Get GPS logs error:', error);
    return sendServerError(res, 'Failed to retrieve GPS logs', error.message);
  }
};

module.exports = {
  createGPSLog,
  batchCreateGPSLogs,
  getGPSLogsByTimeEntry,
  getGPSLogs,
  getGPSLogById,
  updateGPSLog,
  deleteGPSLog
};
