const AvailabilityService = require('../services/availabilityService');
const CalendarAvailability = require('../models/CalendarAvailability');
const JobSchedule = require('../models/JobSchedule');
const RescheduleRequest = require('../models/RescheduleRequest');
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

// @desc    Create availability block
// @route   POST /api/availability
// @access  Private
const createAvailability = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { startTime, endTime, title, isRecurring, recurrencePattern, type, notes } = req.body;

    if (!startTime || !endTime) {
      return sendValidationError(res, ['startTime and endTime are required']);
    }

    const availability = await AvailabilityService.createAvailability(providerId, {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      title,
      isRecurring,
      recurrencePattern,
      type: type || 'available',
      notes
    });

    return sendSuccess(res, availability, 'Availability created successfully', 201);
  } catch (error) {
    logger.error('Error creating availability:', error);
    if (error.message.includes('conflicts')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to create availability');
  }
};

// @desc    Get availability for a provider
// @route   GET /api/availability
// @access  Private
const getAvailability = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const availability = await AvailabilityService.getAvailability(providerId, start, end);

    return sendSuccess(res, availability);
  } catch (error) {
    logger.error('Error getting availability:', error);
    return sendServerError(res, 'Failed to get availability');
  }
};

// @desc    Get calendar view (day/week)
// @route   GET /api/availability/calendar
// @access  Private
const getCalendarView = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { viewType = 'week', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : (() => {
      const e = new Date(start);
      e.setDate(e.getDate() + (viewType === 'day' ? 1 : 7));
      return e;
    })();

    const calendarView = await AvailabilityService.getCalendarView(providerId, viewType, start, end);

    return sendSuccess(res, calendarView);
  } catch (error) {
    logger.error('Error getting calendar view:', error);
    return sendServerError(res, 'Failed to get calendar view');
  }
};

// @desc    Update availability
// @route   PUT /api/availability/:id
// @access  Private
const updateAvailability = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid availability ID']);
    }

    const availability = await CalendarAvailability.findById(id);
    if (!availability) {
      return sendNotFoundError(res, 'Availability not found');
    }

    if (availability.provider.toString() !== providerId) {
      return sendValidationError(res, ['Not authorized to update this availability']);
    }

    Object.assign(availability, req.body);
    await availability.save();

    return sendSuccess(res, availability, 'Availability updated successfully');
  } catch (error) {
    logger.error('Error updating availability:', error);
    return sendServerError(res, 'Failed to update availability');
  }
};

// @desc    Delete availability
// @route   DELETE /api/availability/:id
// @access  Private
const deleteAvailability = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid availability ID']);
    }

    const availability = await CalendarAvailability.findById(id);
    if (!availability) {
      return sendNotFoundError(res, 'Availability not found');
    }

    if (availability.provider.toString() !== providerId) {
      return sendValidationError(res, ['Not authorized to delete this availability']);
    }

    await availability.deleteOne();

    return sendSuccess(res, null, 'Availability deleted successfully');
  } catch (error) {
    logger.error('Error deleting availability:', error);
    return sendServerError(res, 'Failed to delete availability');
  }
};

// @desc    Get job schedules
// @route   GET /api/availability/schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const schedules = await JobSchedule.findSchedules(providerId, start, end, status || null);

    return sendSuccess(res, schedules);
  } catch (error) {
    logger.error('Error getting schedules:', error);
    return sendServerError(res, 'Failed to get schedules');
  }
};

// @desc    Create reschedule request
// @route   POST /api/availability/reschedule
// @access  Private
const createRescheduleRequest = async (req, res) => {
  try {
    const requestedBy = req.user.id;
    const { jobSchedule, requestedStartTime, requestedEndTime, reason } = req.body;

    if (!jobSchedule || !requestedStartTime || !requestedEndTime || !reason) {
      return sendValidationError(res, ['jobSchedule, requestedStartTime, requestedEndTime, and reason are required']);
    }

    const schedule = await JobSchedule.findById(jobSchedule).populate('job');
    if (!schedule) {
      return sendNotFoundError(res, 'Job schedule not found');
    }

    const requestedFor = schedule.provider.toString();
    if (requestedBy === requestedFor) {
      return sendValidationError(res, ['Cannot request reschedule for your own schedule']);
    }

    const rescheduleRequest = await AvailabilityService.createRescheduleRequest({
      jobSchedule,
      job: schedule.job._id,
      requestedBy,
      requestedFor,
      requestedStartTime: new Date(requestedStartTime),
      requestedEndTime: new Date(requestedEndTime),
      reason
    });

    return sendSuccess(res, rescheduleRequest, 'Reschedule request created successfully', 201);
  } catch (error) {
    logger.error('Error creating reschedule request:', error);
    return sendServerError(res, 'Failed to create reschedule request');
  }
};

// @desc    Approve reschedule request
// @route   PUT /api/availability/reschedule/:id/approve
// @access  Private
const approveRescheduleRequest = async (req, res) => {
  try {
    const approvedBy = req.user.id;
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid reschedule request ID']);
    }

    const request = await RescheduleRequest.findById(id);
    if (!request) {
      return sendNotFoundError(res, 'Reschedule request not found');
    }

    if (request.requestedFor.toString() !== approvedBy) {
      return sendValidationError(res, ['Not authorized to approve this reschedule request']);
    }

    const approvedRequest = await AvailabilityService.approveRescheduleRequest(id, approvedBy);

    return sendSuccess(res, approvedRequest, 'Reschedule request approved successfully');
  } catch (error) {
    logger.error('Error approving reschedule request:', error);
    return sendServerError(res, 'Failed to approve reschedule request');
  }
};

// @desc    Reject reschedule request
// @route   PUT /api/availability/reschedule/:id/reject
// @access  Private
const rejectRescheduleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid reschedule request ID']);
    }

    const request = await RescheduleRequest.findById(id);
    if (!request) {
      return sendNotFoundError(res, 'Reschedule request not found');
    }

    const rejectedRequest = await AvailabilityService.rejectRescheduleRequest(id, rejectionReason);

    return sendSuccess(res, rejectedRequest, 'Reschedule request rejected');
  } catch (error) {
    logger.error('Error rejecting reschedule request:', error);
    return sendServerError(res, 'Failed to reject reschedule request');
  }
};

// @desc    Get reschedule requests
// @route   GET /api/availability/reschedule
// @access  Private
const getRescheduleRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let requests;
    if (status) {
      requests = await RescheduleRequest.findByStatus(status).find({
        $or: [
          { requestedBy: userId },
          { requestedFor: userId }
        ]
      });
    } else {
      requests = await RescheduleRequest.find({
        $or: [
          { requestedBy: userId },
          { requestedFor: userId }
        ]
      }).sort({ createdAt: -1 });
    }

    return sendSuccess(res, requests);
  } catch (error) {
    logger.error('Error getting reschedule requests:', error);
    return sendServerError(res, 'Failed to get reschedule requests');
  }
};

module.exports = {
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
};
