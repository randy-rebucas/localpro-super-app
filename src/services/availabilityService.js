/**
 * Availability Service
 * 
 * Manages provider calendar availability, job scheduling, and reschedule requests
 * References: CalendarAvailability, JobSchedule, RescheduleRequest, Job, TimeEntry
 */

const CalendarAvailability = require('../models/CalendarAvailability');
const JobSchedule = require('../models/JobSchedule');
const RescheduleRequest = require('../models/RescheduleRequest');
const NotificationService = require('./notificationService');
const logger = require('../config/logger');

class AvailabilityService {
  /**
   * Create an availability block for a provider
   */
  async createAvailability(providerId, availabilityData) {
    try {
      // Check for conflicts with existing availability
      const conflicts = await CalendarAvailability.findConflicts(
        providerId,
        availabilityData.startTime,
        availabilityData.endTime
      );

      if (conflicts.length > 0) {
        throw new Error('Availability conflicts with existing blocks');
      }

      const availability = new CalendarAvailability({
        provider: providerId,
        ...availabilityData
      });

      await availability.save();
      return availability;
    } catch (error) {
      logger.error('Error creating availability:', error);
      throw error;
    }
  }

  /**
   * Get availability for a provider in a date range
   */
  async getAvailability(providerId, startDate, endDate) {
    try {
      return await CalendarAvailability.findAvailability(providerId, startDate, endDate);
    } catch (error) {
      logger.error('Error getting availability:', error);
      throw error;
    }
  }

  /**
   * Auto-block time when a job is accepted
   */
  async autoBlockTimeForJob(providerId, jobId, applicationId, startTime, endTime, location = null) {
    try {
      // Create job schedule
      const jobSchedule = new JobSchedule({
        provider: providerId,
        job: jobId,
        applicationId: applicationId,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        location: location,
        status: 'scheduled'
      });

      // Check if we should create a blocking availability
      const conflicts = await CalendarAvailability.findConflicts(
        providerId,
        startTime,
        endTime
      );

      // Create blocking availability if no conflicts (or override if needed)
      if (conflicts.length === 0) {
        const blockingAvailability = new CalendarAvailability({
          provider: providerId,
          title: 'Job Scheduled',
          startTime: startTime,
          endTime: endTime,
          isRecurring: false,
          isAvailable: false,
          type: 'busy'
        });

        await blockingAvailability.save();
        jobSchedule.calendarAvailability = blockingAvailability._id;
      }

      await jobSchedule.save();

      // Send notification
      await NotificationService.sendNotification({
        userId: providerId,
        type: 'job_scheduled',
        title: 'Job Scheduled',
        message: `A job has been scheduled for ${new Date(startTime).toLocaleDateString()}`,
        data: { jobId, jobScheduleId: jobSchedule._id },
        priority: 'high'
      });

      return jobSchedule;
    } catch (error) {
      logger.error('Error auto-blocking time for job:', error);
      throw error;
    }
  }

  /**
   * Get calendar view (day/week) for a provider
   */
  async getCalendarView(providerId, viewType, startDate, endDate) {
    try {
      const availability = await CalendarAvailability.findAvailability(providerId, startDate, endDate);
      const schedules = await JobSchedule.findSchedules(providerId, startDate, endDate);
      
      return {
        availability: availability,
        schedules: schedules,
        viewType: viewType,
        startDate: startDate,
        endDate: endDate
      };
    } catch (error) {
      logger.error('Error getting calendar view:', error);
      throw error;
    }
  }

  /**
   * Create a reschedule request
   */
  async createRescheduleRequest(rescheduleData) {
    try {
      const jobSchedule = await JobSchedule.findById(rescheduleData.jobSchedule);
      if (!jobSchedule) {
        throw new Error('Job schedule not found');
      }

      const rescheduleRequest = new RescheduleRequest({
        ...rescheduleData,
        originalStartTime: jobSchedule.scheduledStartTime,
        originalEndTime: jobSchedule.scheduledEndTime
      });

      await rescheduleRequest.save();

      // Notify the other party
      await NotificationService.sendNotification({
        userId: rescheduleRequest.requestedFor,
        type: 'reschedule_request',
        title: 'Reschedule Request',
        message: `A reschedule request has been submitted for a job`,
        data: { rescheduleRequestId: rescheduleRequest._id, jobScheduleId: jobSchedule._id },
        priority: 'high'
      });

      return rescheduleRequest;
    } catch (error) {
      logger.error('Error creating reschedule request:', error);
      throw error;
    }
  }

  /**
   * Approve a reschedule request
   */
  async approveRescheduleRequest(requestId, approvedBy) {
    try {
      const request = await RescheduleRequest.findById(requestId);
      if (!request) {
        throw new Error('Reschedule request not found');
      }

      await request.approve(approvedBy);

      // Update the job schedule
      const jobSchedule = await JobSchedule.findById(request.jobSchedule);
      if (jobSchedule) {
        jobSchedule.scheduledStartTime = request.requestedStartTime;
        jobSchedule.scheduledEndTime = request.requestedEndTime;
        jobSchedule.status = 'rescheduled';
        await jobSchedule.save();

        // Update or create blocking availability
        if (jobSchedule.calendarAvailability) {
          const availability = await CalendarAvailability.findById(jobSchedule.calendarAvailability);
          if (availability) {
            availability.startTime = request.requestedStartTime;
            availability.endTime = request.requestedEndTime;
            await availability.save();
          }
        }
      }

      // Notify both parties
      await NotificationService.sendNotification({
        userId: request.requestedBy,
        type: 'reschedule_approved',
        title: 'Reschedule Approved',
        message: 'Your reschedule request has been approved',
        data: { rescheduleRequestId: request._id },
        priority: 'high'
      });

      return request;
    } catch (error) {
      logger.error('Error approving reschedule request:', error);
      throw error;
    }
  }

  /**
   * Reject a reschedule request
   */
  async rejectRescheduleRequest(requestId, rejectionReason) {
    try {
      const request = await RescheduleRequest.findById(requestId);
      if (!request) {
        throw new Error('Reschedule request not found');
      }

      await request.reject(rejectionReason);

      // Notify the requester
      await NotificationService.sendNotification({
        userId: request.requestedBy,
        type: 'reschedule_rejected',
        title: 'Reschedule Rejected',
        message: 'Your reschedule request has been rejected',
        data: { rescheduleRequestId: request._id, reason: rejectionReason },
        priority: 'medium'
      });

      return request;
    } catch (error) {
      logger.error('Error rejecting reschedule request:', error);
      throw error;
    }
  }

  /**
   * Send job start reminders
   */
  async sendJobStartReminders(minutesBefore = 60) {
    try {
      const schedules = await JobSchedule.findRemindersNeeded(minutesBefore);
      
      for (const schedule of schedules) {
        if (!schedule.reminderSent) {
          await NotificationService.sendNotification({
            userId: schedule.provider,
            type: 'job_start_reminder',
            title: 'Job Starting Soon',
            message: `Your job starts in ${minutesBefore} minutes`,
            data: { jobScheduleId: schedule._id, jobId: schedule.job },
            priority: 'high',
            channels: {
              inApp: true,
              push: true,
              sms: true
            }
          });

          schedule.reminderSent = true;
          schedule.reminderSentAt = new Date();
          await schedule.save();
        }
      }

      return schedules.length;
    } catch (error) {
      logger.error('Error sending job start reminders:', error);
      throw error;
    }
  }

  /**
   * Send lateness alerts
   */
  async sendLatenessAlerts() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const lateSchedules = await JobSchedule.find({
        status: 'scheduled',
        scheduledStartTime: { $lt: fiveMinutesAgo, $gt: new Date(now.getTime() - 60 * 60 * 1000) }, // Between 5 minutes and 1 hour ago
        latenessAlertSent: { $ne: true }
      });

      for (const schedule of lateSchedules) {
        await NotificationService.sendNotification({
          userId: schedule.provider,
          type: 'job_lateness_alert',
          title: 'Job Started - Running Late',
          message: 'You were scheduled to start a job. Please update your status.',
          data: { jobScheduleId: schedule._id, jobId: schedule.job },
          priority: 'urgent',
          channels: {
            inApp: true,
            push: true,
            sms: true
          }
        });

        schedule.latenessAlertSent = true;
        await schedule.save();
      }

      return lateSchedules.length;
    } catch (error) {
      logger.error('Error sending lateness alerts:', error);
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
