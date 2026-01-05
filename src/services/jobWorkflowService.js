/**
 * Job Workflow Service
 * 
 * Handles job workflow, task execution, progress tracking, proof of work, and issues
 * References: JobProgress, TaskChecklist, JobProof, JobIssue, Job, JobSchedule
 */

const JobProgress = require('../models/JobProgress');
const TaskChecklist = require('../models/TaskChecklist');
const JobProof = require('../models/JobProof');
const JobIssue = require('../models/JobIssue');
const Job = require('../models/Job');
const JobSchedule = require('../models/JobSchedule');
const NotificationService = require('./notificationService');
const CloudinaryService = require('./cloudinaryService');
const logger = require('../config/logger');

class JobWorkflowService {
  /**
   * Initialize job progress with checklist
   */
  async initializeJobProgress(jobId, providerId, jobScheduleId = null, serviceType = null) {
    try {
      // Check if progress already exists
      let progress = await JobProgress.findByJob(jobId, providerId);
      if (progress) {
        return progress;
      }

      // Find appropriate checklist
      let checklist = null;
      if (serviceType) {
        checklist = await TaskChecklist.findByServiceType(serviceType);
      }

      // Get job to find category
      const job = await Job.findById(jobId).populate('category');
      if (!job) {
        throw new Error('Job not found');
      }

      if (!checklist && job.category) {
        const checklists = await TaskChecklist.findByCategory(job.category._id);
        checklist = checklists.length > 0 ? checklists[0] : null;
      }

      // Create tasks from checklist or empty
      const tasks = checklist ? checklist.tasks.map(task => ({
        taskId: task._id,
        order: task.order,
        title: task.title,
        description: task.description,
        isRequired: task.isRequired,
        status: 'pending'
      })) : [];

      progress = new JobProgress({
        job: jobId,
        jobSchedule: jobScheduleId,
        provider: providerId,
        taskChecklist: checklist ? checklist._id : null,
        tasks: tasks,
        status: 'not_started',
        progressPercentage: 0
      });

      await progress.save();
      return progress;
    } catch (error) {
      logger.error('Error initializing job progress:', error);
      throw error;
    }
  }

  /**
   * Start job
   */
  async startJob(jobId, providerId) {
    try {
      const progress = await JobProgress.findByJob(jobId, providerId);
      if (!progress) {
        throw new Error('Job progress not found. Please initialize first.');
      }

      await progress.start();

      // Update job schedule if exists
      if (progress.jobSchedule) {
        const schedule = await JobSchedule.findById(progress.jobSchedule);
        if (schedule) {
          schedule.status = 'in_progress';
          schedule.actualStartTime = new Date();
          await schedule.save();
        }
      }

      // Send notification
      await NotificationService.sendNotification({
        userId: providerId,
        type: 'job_started',
        title: 'Job Started',
        message: 'You have started working on the job',
        data: { jobId, jobProgressId: progress._id },
        priority: 'medium'
      });

      return progress;
    } catch (error) {
      logger.error('Error starting job:', error);
      throw error;
    }
  }

  /**
   * Pause job
   */
  async pauseJob(jobId, providerId) {
    try {
      const progress = await JobProgress.findByJob(jobId, providerId);
      if (!progress) {
        throw new Error('Job progress not found');
      }

      await progress.pause();
      return progress;
    } catch (error) {
      logger.error('Error pausing job:', error);
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(jobId, providerId, taskIndex, notes = null, proofFiles = []) {
    try {
      const progress = await JobProgress.findByJob(jobId, providerId);
      if (!progress) {
        throw new Error('Job progress not found');
      }

      if (!progress.tasks[taskIndex]) {
        throw new Error('Task not found');
      }

      const task = progress.tasks[taskIndex];
      const proofOfWork = [];

      // Upload proof files if provided
      if (proofFiles && proofFiles.length > 0) {
        for (const file of proofFiles) {
          try {
            // Files from multer CloudinaryStorage already have the upload data
            if (file.secure_url) {
              proofOfWork.push({
                type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
                url: file.secure_url,
                publicId: file.public_id,
                thumbnail: file.thumbnail_url || file.secure_url,
                uploadedAt: new Date()
              });

              // Also create JobProof record
              const jobProof = new JobProof({
                job: jobId,
                jobProgress: progress._id,
                taskId: task.taskId,
                provider: providerId,
                type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
                media: {
                  url: file.secure_url,
                  publicId: file.public_id,
                  thumbnail: file.thumbnail_url || file.secure_url,
                  mimeType: file.mimetype,
                  size: file.size,
                  width: file.width,
                  height: file.height
                }
              });
              await jobProof.save();
            } else {
              // Fallback: use CloudinaryService if file wasn't uploaded yet
              const uploadResult = await CloudinaryService.uploadFile(file, 'job-proofs');
              if (uploadResult.success) {
                proofOfWork.push({
                  type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
                  url: uploadResult.data.secure_url,
                  publicId: uploadResult.data.public_id,
                  thumbnail: uploadResult.data.thumbnail_url,
                  uploadedAt: new Date()
                });

                // Also create JobProof record
                const jobProof = new JobProof({
                  job: jobId,
                  jobProgress: progress._id,
                  taskId: task.taskId,
                  provider: providerId,
                  type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
                  media: {
                    url: uploadResult.data.secure_url,
                    publicId: uploadResult.data.public_id,
                    thumbnail: uploadResult.data.thumbnail_url,
                    mimeType: file.mimetype,
                    size: file.size,
                    width: uploadResult.data.width,
                    height: uploadResult.data.height
                  }
                });
                await jobProof.save();
              }
            }
          } catch (uploadError) {
            logger.error('Error uploading proof file:', uploadError);
          }
        }
      }

      await progress.completeTask(taskIndex, providerId, notes, proofOfWork);
      return progress;
    } catch (error) {
      logger.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Complete job
   */
  async completeJob(jobId, providerId) {
    try {
      const progress = await JobProgress.findByJob(jobId, providerId);
      if (!progress) {
        throw new Error('Job progress not found');
      }

      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.progressPercentage = 100;
      await progress.save();

      // Update job schedule if exists
      if (progress.jobSchedule) {
        const schedule = await JobSchedule.findById(progress.jobSchedule);
        if (schedule) {
          schedule.status = 'completed';
          schedule.actualEndTime = new Date();
          await schedule.save();
        }
      }

      // Send notification
      await NotificationService.sendNotification({
        userId: providerId,
        type: 'job_completed',
        title: 'Job Completed',
        message: 'You have completed the job',
        data: { jobId, jobProgressId: progress._id },
        priority: 'high'
      });

      return progress;
    } catch (error) {
      logger.error('Error completing job:', error);
      throw error;
    }
  }

  /**
   * Upload proof of work
   */
  async uploadProof(jobId, providerId, file, description = null, location = null) {
    try {
      // File from multer CloudinaryStorage already has the upload data
      let mediaData;
      if (file.secure_url) {
        mediaData = {
          url: file.secure_url,
          publicId: file.public_id,
          thumbnail: file.thumbnail_url || file.secure_url,
          mimeType: file.mimetype,
          size: file.size,
          width: file.width,
          height: file.height
        };
      } else {
        // Fallback: use CloudinaryService if file wasn't uploaded yet
        const uploadResult = await CloudinaryService.uploadFile(file, 'job-proofs');
        if (!uploadResult.success) {
          throw new Error('Failed to upload proof');
        }
        mediaData = {
          url: uploadResult.data.secure_url,
          publicId: uploadResult.data.public_id,
          thumbnail: uploadResult.data.thumbnail_url,
          mimeType: file.mimetype,
          size: file.size,
          width: uploadResult.data.width,
          height: uploadResult.data.height
        };
      }

      const jobProof = new JobProof({
        job: jobId,
        provider: providerId,
        type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
        media: mediaData,
        description: description,
        location: location
      });

      await jobProof.save();
      return jobProof;
    } catch (error) {
      logger.error('Error uploading proof:', error);
      throw error;
    }
  }

  /**
   * Report an issue
   */
  async reportIssue(issueData) {
    try {
      const issue = new JobIssue(issueData);
      await issue.save();

      // Send notification to admin/dispatcher
      await NotificationService.sendNotification({
        userId: issue.reportedBy,
        type: 'job_issue_reported',
        title: 'Issue Reported',
        message: `An issue has been reported: ${issue.title}`,
        data: { jobId: issue.job, issueId: issue._id },
        priority: issue.severity === 'critical' ? 'urgent' : 'high'
      });

      return issue;
    } catch (error) {
      logger.error('Error reporting issue:', error);
      throw error;
    }
  }

  /**
   * Escalate issue
   */
  async escalateIssue(issueId, escalatedTo, reason) {
    try {
      const issue = await JobIssue.findById(issueId);
      if (!issue) {
        throw new Error('Issue not found');
      }

      await issue.escalate(escalatedTo, reason);

      // Send notification
      await NotificationService.sendNotification({
        userId: escalatedTo,
        type: 'job_issue_escalated',
        title: 'Issue Escalated',
        message: `An issue has been escalated: ${issue.title}`,
        data: { jobId: issue.job, issueId: issue._id },
        priority: 'urgent'
      });

      return issue;
    } catch (error) {
      logger.error('Error escalating issue:', error);
      throw error;
    }
  }

  /**
   * Resolve issue
   */
  async resolveIssue(issueId, resolvedBy, resolutionNotes, actionTaken) {
    try {
      const issue = await JobIssue.findById(issueId);
      if (!issue) {
        throw new Error('Issue not found');
      }

      await issue.resolve(resolvedBy, resolutionNotes, actionTaken);

      // Send notification to reporter
      await NotificationService.sendNotification({
        userId: issue.reportedBy,
        type: 'job_issue_resolved',
        title: 'Issue Resolved',
        message: `Your reported issue has been resolved: ${issue.title}`,
        data: { jobId: issue.job, issueId: issue._id },
        priority: 'medium'
      });

      return issue;
    } catch (error) {
      logger.error('Error resolving issue:', error);
      throw error;
    }
  }
}

module.exports = new JobWorkflowService();
