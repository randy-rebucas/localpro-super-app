const Job = require('../models/Job');
const JobCategory = require('../models/JobCategory');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const GoogleMapsService = require('../services/googleMapsService');
const NotificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { 
  validatePagination, 
  validateObjectId, 
  validateNumericRange
} = require('../utils/controllerValidation');
const { 
  sendPaginated, 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  createPagination 
} = require('../utils/responseHelper');

/**
 * Resolve category identifier (name or ObjectId) to ObjectId
 * Supports both category names and old enum format (e.g., "cleaning" -> "Cleaning")
 * @param {string} categoryIdentifier - Category name or ObjectId string
 * @returns {Promise<string|null>} - ObjectId string or null if not found
 */
const resolveCategoryId = async (categoryIdentifier) => {
  if (!categoryIdentifier) return null;
  
  // Check if it's already a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(categoryIdentifier)) {
    return categoryIdentifier;
  }
  
  // Normalize the identifier: convert underscores to spaces and title case
  // e.g., "customer_service" -> "Customer Service", "cleaning" -> "Cleaning"
  const normalizedName = categoryIdentifier
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Try to find category by name (case-insensitive, exact match)
  let category = await JobCategory.findOne({ 
    name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    isActive: true 
  });
  
  // If not found with normalized name, try original identifier (case-insensitive)
  if (!category) {
    category = await JobCategory.findOne({ 
      name: { $regex: new RegExp(`^${categoryIdentifier}$`, 'i') },
      isActive: true 
    });
  }
  
  if (category) {
    return category._id.toString();
  }
  
  // If not found, return null (will cause filter to not match anything)
  return null;
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const {
      search,
      category,
      subcategory,
      jobType,
      experienceLevel,
      location,
      isRemote,
      minSalary,
      maxSalary,
      company,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;
    
    // Validate salary range
    if (minSalary) {
      const minSalaryValidation = validateNumericRange(minSalary, 0, 1000000, 'minSalary');
      if (!minSalaryValidation.isValid) {
        return sendValidationError(res, [minSalaryValidation.error]);
      }
    }
    
    if (maxSalary) {
      const maxSalaryValidation = validateNumericRange(maxSalary, 0, 1000000, 'maxSalary');
      if (!maxSalaryValidation.isValid) {
        return sendValidationError(res, [maxSalaryValidation.error]);
      }
    }
    
    if (minSalary && maxSalary && parseFloat(minSalary) > parseFloat(maxSalary)) {
      return sendValidationError(res, [{
        field: 'salaryRange',
        message: 'Minimum salary cannot be greater than maximum salary',
        code: 'INVALID_SALARY_RANGE'
      }]);
    }

    // Build filter object
    const filter = { isActive: true, status: { $in: ['active', 'featured'] } };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Category filters - resolve category name to ObjectId if needed
    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (categoryId) {
        filter.category = categoryId;
      } else {
        // If category not found, return empty results
        return sendPaginated(res, [], createPagination(pageNum, limitNum, 0), 'Jobs retrieved successfully');
      }
    }
    if (subcategory) filter.subcategory = subcategory;
    if (jobType) filter.jobType = jobType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    // Location filters
    if (location) {
      filter.$or = [
        { 'company.location.city': new RegExp(location, 'i') },
        { 'company.location.state': new RegExp(location, 'i') },
        { 'company.location.country': new RegExp(location, 'i') }
      ];
    }
    if (isRemote === 'true') {
      filter['company.location.isRemote'] = true;
    }

    // Salary filters
    if (minSalary || maxSalary) {
      filter['salary.min'] = {};
      if (minSalary) filter['salary.min'].$gte = Number(minSalary);
      if (maxSalary) filter['salary.min'].$lte = Number(maxSalary);
    }

    // Company filter
    if (company) {
      filter['company.name'] = new RegExp(company, 'i');
    }

    // Featured filter
    if (featured === 'true') {
      filter['featured.isFeatured'] = true;
      filter['featured.featuredUntil'] = { $gt: new Date() };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'relevance' && search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (pageNum - 1) * limitNum;

    // Filter out jobs with invalid category ObjectIds before populating
    // This prevents populate errors when old jobs have string category values
    // Only query jobs where category field is an ObjectId type
    const categoryFilterValue = filter.category;
    if (categoryFilterValue) {
      // If category filter is provided, ensure it's an ObjectId and combine with type check
      filter.$and = filter.$and || [];
      filter.$and.push(
        { category: categoryFilterValue },
        { category: { $type: 'objectId' } }
      );
      delete filter.category;
    } else {
      // If no category filter, just ensure category is an ObjectId type
      filter.category = {
        $exists: true,
        $type: 'objectId'
      };
    }

    let jobs;
    try {
      jobs = await Job.find(filter)
        .populate('employer', 'firstName lastName profile.avatar profile.businessName profile.rating')
        .populate({
          path: 'category',
          select: 'name description displayOrder metadata isActive',
          match: { isActive: true } // Only populate active categories
        })
        .select('-applications -views -featured -promoted -metadata')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(); // Use lean() for better performance on read-only operations
    } catch (populateError) {
      // If populate fails due to invalid category data, retry without category population
      if (populateError.message && populateError.message.includes('Cast to ObjectId')) {
        logger.warn('Category population failed due to invalid data, retrying without category population', {
          error: populateError.message
        });
        
        // Filter to only include jobs with valid ObjectId categories
        const validCategoryFilter = {
          ...filter,
          category: {
            $exists: true,
            $type: 'objectId'
          }
        };
        
        jobs = await Job.find(validCategoryFilter)
          .populate('employer', 'firstName lastName profile.avatar profile.businessName profile.rating')
          .select('-applications -views -featured -promoted -metadata')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean();
        
        // Manually populate categories for valid ObjectIds
        const categoryIds = [...new Set(jobs.map(job => job.category).filter(Boolean))];
        if (categoryIds.length > 0) {
          const categories = await JobCategory.find({ 
            _id: { $in: categoryIds },
            isActive: true 
          }).lean();
          const categoryMap = {};
          categories.forEach(cat => {
            categoryMap[cat._id.toString()] = cat;
          });
          
          jobs = jobs.map(job => {
            if (job.category && categoryMap[job.category.toString()]) {
              job.category = categoryMap[job.category.toString()];
            } else {
              job.category = null;
            }
            return job;
          });
        }
      } else {
        throw populateError;
      }
    }

    const total = await Job.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, jobs, pagination, 'Jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve jobs', 'JOBS_RETRIEVAL_ERROR');
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    console.log('Get job request received for ID:', req.params.id);
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid job ID format',
        code: 'INVALID_JOB_ID'
      }]);
    }

    const job = await Job.findById(req.params.id)
      .populate('employer', 'firstName lastName profile.avatar profile.businessName profile.bio profile.rating profile.experience')
      .populate('category', 'name description displayOrder metadata isActive')
      .populate('applications.applicant', 'firstName lastName profile.avatar profile.rating')
      .select('+views +featured +promoted'); // Include fields needed for this specific view

    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    // Increment view count (track unique views if user is authenticated)
    const isUnique = req.user ? true : false;
    await job.incrementViews(isUnique);

    return sendSuccess(res, job, 'Job retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve job', 'JOB_RETRIEVAL_ERROR');
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer/Admin)
const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      employer: req.user.id
    };
    console.log('Creating job with data:', jobData);
    // Geocode company location if address is provided
    if (jobData.company?.location?.address) {
      try {
        const geocodeResult = await GoogleMapsService.geocodeAddress(
          jobData.company.location.address
        );
        
        if (geocodeResult.success && geocodeResult.coordinates) {
          jobData.company.location.coordinates = {
            lat: geocodeResult.coordinates.lat,
            lng: geocodeResult.coordinates.lng
          };
          
          // Extract city, state, country from parsed address components
          if (geocodeResult.addressComponents) {
            if (geocodeResult.addressComponents.city) {
              jobData.company.location.city = geocodeResult.addressComponents.city;
            }
            if (geocodeResult.addressComponents.state) {
              jobData.company.location.state = geocodeResult.addressComponents.state;
            }
            if (geocodeResult.addressComponents.country) {
              jobData.company.location.country = geocodeResult.addressComponents.country;
            }
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    const job = await Job.create(jobData);

    // Mobile-first: notify employer that job is posted (in-app + push if enabled)
    try {
      await NotificationService.sendNotification({
        userId: req.user.id,
        type: 'job_posted',
        title: 'Job posted',
        message: `Your job "${job.title}" has been posted successfully.`,
        data: { jobId: job._id },
        priority: 'low'
      });
    } catch (notifyError) {
      logger.warn('Job posted notification failed', { jobId: job._id, error: notifyError.message });
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer/Admin)
const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // Geocode company location if address is provided and changed
    if (req.body.company?.location?.address && 
        req.body.company.location.address !== job.company.location.address) {
      try {
        const geocodeResult = await GoogleMapsService.geocodeAddress(
          req.body.company.location.address
        );
        
        if (geocodeResult.success && geocodeResult.coordinates) {
          req.body.company.location.coordinates = {
            lat: geocodeResult.coordinates.lat,
            lng: geocodeResult.coordinates.lng
          };
          
          // Extract city, state, country from parsed address components
          if (geocodeResult.addressComponents) {
            if (geocodeResult.addressComponents.city) {
              req.body.company.location.city = geocodeResult.addressComponents.city;
            }
            if (geocodeResult.addressComponents.state) {
              req.body.company.location.state = geocodeResult.addressComponents.state;
            }
            if (geocodeResult.addressComponents.country) {
              req.body.company.location.country = geocodeResult.addressComponents.country;
            }
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Admin)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private
const applyForJob = async (req, res) => {
  try {
    const { coverLetter, expectedSalary, availability, portfolio } = req.body;
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is still accepting applications
    if (!job.isJobActive()) {
      const reason = job.getInactiveReason();
      return res.status(400).json({
        success: false,
        message: reason || 'This job is no longer accepting applications',
        reason: reason || 'unknown'
      });
    }

    // Check if deadline has passed (informational warning, not blocking)
    const deadlinePassed = job.isDeadlinePassed();
    let warningMessage = null;
    if (deadlinePassed) {
      const deadlineDate = new Date(job.applicationProcess.deadline).toLocaleDateString();
      warningMessage = `Note: The application deadline (${deadlineDate}) has passed, but applications are still being accepted.`;
    }

    // Check if user already applied
    const existingApplication = job.applications.find(
      app => app.applicant.toString() === userId
    );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Handle resume upload if provided
    let resumeData = null;
    if (req.file) {
      // Check if file was already uploaded by CloudinaryStorage
      if (req.file.public_id && req.file.secure_url) {
        // File already uploaded via CloudinaryStorage
        resumeData = {
          url: req.file.secure_url,
          publicId: req.file.public_id,
          filename: req.file.originalname || req.file.filename || 'resume'
        };
      } else {
        // Upload resume to Cloudinary
        const uploadResult = await CloudinaryService.uploadFile(
          req.file,
          'localpro/jobs/resumes'
        );

        if (uploadResult.success) {
          resumeData = {
            url: uploadResult.data.secure_url,
            publicId: uploadResult.data.public_id,
            filename: req.file.originalname || 'resume'
          };
        }
      }
    }

    const applicationData = {
      applicant: userId,
      coverLetter,
      expectedSalary: expectedSalary ? Number(expectedSalary) : null,
      availability: availability ? new Date(availability) : null,
      portfolio,
      resume: resumeData
    };

    await job.addApplication(applicationData);

    // Send notification email to employer
    try {
      const employer = await User.findById(job.employer);
      const applicant = await User.findById(userId);
      
      if (employer.email) {
        await EmailService.sendJobApplicationNotification(
          employer.email,
          {
            jobTitle: job.title,
            companyName: job.company.name,
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
            applicantEmail: applicant.email,
            coverLetter: coverLetter
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send application notification email:', emailError);
      // Don't fail the application if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      ...(warningMessage && { warning: warningMessage })
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer/Admin)
const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applications.applicant', 'firstName lastName email phoneNumber profile.avatar profile.experience profile.skills');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    
    let applications = job.applications;
    
    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Paginate applications
    const skip = (page - 1) * limit;
    const paginatedApplications = applications.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      count: paginatedApplications.length,
      total: applications.length,
      page: Number(page),
      pages: Math.ceil(applications.length / limit),
      data: paginatedApplications
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/jobs/:jobId/applications/:applicationId/status
// @access  Private (Employer/Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const { id: jobId, applicationId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update applications for this job'
      });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    if (feedback) {
      application.feedback = feedback;
    }

    await job.save();

    // Auto-block time when job is accepted (hired)
    if (status === 'hired') {
      try {
        const AvailabilityService = require('../services/availabilityService');
        const jobStartTime = job.applicationProcess?.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
        const jobEndTime = new Date(jobStartTime.getTime() + 8 * 60 * 60 * 1000); // Default 8 hours
        
        await AvailabilityService.autoBlockTimeForJob(
          application.applicant,
          jobId,
          applicationId,
          jobStartTime,
          jobEndTime,
          job.company?.location ? {
            address: job.company.location.address,
            city: job.company.location.city,
            state: job.company.location.state,
            coordinates: job.company.location.coordinates
          } : null
        );
      } catch (blockError) {
        console.warn('Failed to auto-block time for hired job:', blockError);
        // Don't fail the status update if blocking fails
      }
    }

    // Mobile-first: notify applicant about application status update (in-app + push if enabled)
    try {
      await NotificationService.sendNotification({
        userId: application.applicant,
        type: 'application_status_update',
        title: 'Application status updated',
        message: `Your application for "${job.title}" is now: ${status}.`,
        data: { jobId: job._id, applicationId: application._id, status, feedback },
        priority: 'medium'
      });
    } catch (notifyError) {
      logger.warn('Application status notification failed', {
        jobId: job._id,
        applicationId: application._id,
        error: notifyError.message
      });
    }

    // Trigger webhook for application status change
    try {
      const webhookService = require('../services/webhookService');
      const applicationData = {
        _id: application._id,
        job: { title: job.title, _id: job._id },
        status,
        feedback
      };
      await webhookService.triggerApplicationStatusChanged(applicationData, application.applicant);
    } catch (webhookError) {
      logger.warn('Webhook trigger failed for application status', {
        jobId: job._id,
        applicationId: application._id,
        error: webhookError.message
      });
    }

    // Send notification email to applicant
    try {
      const applicant = await User.findById(application.applicant);
      if (applicant.email) {
        await EmailService.sendApplicationStatusUpdate(
          applicant.email,
          {
            jobTitle: job.title,
            companyName: job.company.name,
            status: status,
            feedback: feedback
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's job applications
// @route   GET /api/jobs/my-applications
// @access  Private
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter = { 'applications.applicant': userId };
    if (status) {
      filter['applications.status'] = status;
    }

    const jobs = await Job.find(filter)
      .populate('employer', 'firstName lastName profile.businessName')
      .populate('category', 'name description displayOrder metadata isActive')
      .select('title company applications')
      .sort({ 'applications.appliedAt': -1 });

    // Extract applications for the user
    let applications = [];
    jobs.forEach(job => {
      const userApplication = job.applications.find(
        app => app.applicant.toString() === userId
      );
      if (userApplication) {
        applications.push({
          _id: userApplication._id,
          job: {
            _id: job._id,
            title: job.title,
            company: job.company
          },
          employer: job.employer,
          status: userApplication.status,
          appliedAt: userApplication.appliedAt,
          coverLetter: userApplication.coverLetter,
          expectedSalary: userApplication.expectedSalary,
          availability: userApplication.availability
        });
      }
    });

    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedApplications = applications.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      count: paginatedApplications.length,
      total: applications.length,
      page: Number(page),
      pages: Math.ceil(applications.length / limit),
      data: paginatedApplications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Withdraw job application
// @route   DELETE /api/jobs/:jobId/applications/:applicationId
// @access  Private
const withdrawApplication = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId format
    if (!validateObjectId(jobId)) {
      return sendValidationError(res, [{
        field: 'jobId',
        message: 'Invalid job ID format',
        code: 'INVALID_JOB_ID'
      }]);
    }

    if (!validateObjectId(applicationId)) {
      return sendValidationError(res, [{
        field: 'applicationId',
        message: 'Invalid application ID format',
        code: 'INVALID_APPLICATION_ID'
      }]);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    try {
      await job.removeApplication(applicationId, userId);
      
      // Optionally send notification email to employer
      try {
        const employer = await User.findById(job.employer);
        const applicant = await User.findById(userId);
        
        if (employer && employer.email && EmailService.sendJobApplicationWithdrawalNotification) {
          await EmailService.sendJobApplicationWithdrawalNotification(
            employer.email,
            {
              jobTitle: job.title,
              companyName: job.company.name,
              applicantName: `${applicant.firstName} ${applicant.lastName}`,
              applicantEmail: applicant.email
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send withdrawal notification email:', emailError);
        // Don't fail the withdrawal if email fails
      }

      return sendSuccess(res, null, 'Application withdrawn successfully');
    } catch (applicationError) {
      if (applicationError.message === 'Application not found') {
        return sendNotFoundError(res, 'Application not found', 'APPLICATION_NOT_FOUND');
      }
      if (applicationError.message === 'Not authorized to withdraw this application') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to withdraw this application',
          code: 'UNAUTHORIZED_WITHDRAWAL'
        });
      }
      if (applicationError.message === 'Cannot withdraw an application that has been accepted') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw an application that has been accepted',
          code: 'CANNOT_WITHDRAW_HIRED'
        });
      }
      throw applicationError;
    }
  } catch (error) {
    console.error('Withdraw application error:', error);
    return sendServerError(res, error, 'Failed to withdraw application', 'WITHDRAW_APPLICATION_ERROR');
  }
};

// @desc    Get employer's jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Employer/Admin)
const getMyJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter = { employer: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .populate('category', 'name description displayOrder metadata isActive')
      .populate('applications.applicant', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: jobs
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload company logo
// @route   POST /api/jobs/:id/logo
// @access  Private (Employer/Admin)
const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded'
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload logo for this job'
      });
    }

    // Check if file was already uploaded by CloudinaryStorage
    // CloudinaryStorage adds Cloudinary response directly to req.file
    if (req.file.public_id && req.file.secure_url) {
      // File already uploaded via CloudinaryStorage
      // Delete old logo if exists
      if (job.company.logo && job.company.logo.publicId) {
        await CloudinaryService.deleteFile(job.company.logo.publicId);
      }

      // Update job with logo
      job.company.logo = {
        url: req.file.secure_url,
        publicId: req.file.public_id
      };

      await job.save();

      return res.status(200).json({
        success: true,
        message: 'Company logo uploaded successfully',
        data: job.company.logo
      });
    }

    // Upload logo to Cloudinary (if not already uploaded)
    const uploadResult = await CloudinaryService.uploadFile(
      req.file,
      'localpro/jobs/logos'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload company logo',
        error: uploadResult.error
      });
    }

    // Delete old logo if exists
    if (job.company.logo && job.company.logo.publicId) {
      await CloudinaryService.deleteFile(job.company.logo.publicId);
    }

    // Update job with logo
    job.company.logo = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id
    };

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully',
      data: job.company.logo
    });
  } catch (error) {
    console.error('Upload company logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/:id/stats
// @access  Private (Employer/Admin)
const getJobStats = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the employer or admin (multi-role support)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view stats for this job'
      });
    }

    const stats = {
      totalViews: job.views.count,
      uniqueViews: job.views.unique,
      totalApplications: job.applications.length,
      applicationsByStatus: {
        pending: job.applications.filter(app => app.status === 'pending').length,
        reviewing: job.applications.filter(app => app.status === 'reviewing').length,
        shortlisted: job.applications.filter(app => app.status === 'shortlisted').length,
        interviewed: job.applications.filter(app => app.status === 'interviewed').length,
        rejected: job.applications.filter(app => app.status === 'rejected').length,
        hired: job.applications.filter(app => app.status === 'hired').length
      },
      averageApplicationTime: job.applications.length > 0 ? 
        job.applications.reduce((sum, app) => {
          const daysSincePosted = Math.ceil((app.appliedAt - job.createdAt) / (1000 * 60 * 60 * 24));
          return sum + daysSincePosted;
        }, 0) / job.applications.length : 0,
      daysSincePosted: Math.ceil((new Date() - job.createdAt) / (1000 * 60 * 60 * 24))
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get job categories
// @route   GET /api/jobs/categories
// @access  Public
const getJobCategories = async (req, res) => {
  try {
    const categories = await JobCategory.getActiveCategories();
    
    // Transform to include id field (using _id)
    const formattedCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
      displayOrder: cat.displayOrder,
      metadata: cat.metadata
    }));

    return sendSuccess(res, {
      categories: formattedCategories,
      count: formattedCategories.length
    });
  } catch (error) {
    console.error('Get job categories error:', error);
    return sendServerError(res, 'Failed to retrieve job categories');
  }
};

// @desc    Search jobs with advanced filters
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res) => {
  try {
    const {
      q,
      category,
      subcategory,
      jobType,
      experienceLevel,
      location,
      isRemote,
      minSalary,
      maxSalary,
      company,
      page = 1,
      limit = 10
    } = req.query;

    // Resolve category name to ObjectId if needed
    let categoryId = null;
    if (category) {
      categoryId = await resolveCategoryId(category);
      if (!categoryId) {
        // If category not found, return empty results
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: Number(page),
          pages: 0,
          data: []
        });
      }
    }

    const filters = {
      category: categoryId,
      subcategory,
      jobType,
      experienceLevel,
      location,
      isRemote: isRemote === 'true',
      minSalary: minSalary ? Number(minSalary) : null,
      maxSalary: maxSalary ? Number(maxSalary) : null,
      company
    };

    const jobs = await Job.searchJobs(q, filters)
      .populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name description displayOrder metadata isActive')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments({
      ...Job.searchJobs(q, filters).getQuery(),
      isActive: true,
      status: { $in: ['active', 'featured'] }
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: jobs
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// JOB WORKFLOW MANAGEMENT
// ============================================

// @desc    Publish job
// @route   POST /api/jobs/:id/publish
// @access  Private (Employer/Admin)
const publishJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.publish(req.user.id);

    return sendSuccess(res, job, 'Job published successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to publish job', 'JOB_PUBLISH_ERROR');
  }
};

// @desc    Pause job
// @route   POST /api/jobs/:id/pause
// @access  Private (Employer/Admin)
const pauseJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { reason } = req.body;
    await job.pause(reason);

    return sendSuccess(res, job, 'Job paused successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to pause job', 'JOB_PAUSE_ERROR');
  }
};

// @desc    Close job
// @route   POST /api/jobs/:id/close
// @access  Private (Employer/Admin)
const closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { reason } = req.body;
    await job.close(reason);

    return sendSuccess(res, job, 'Job closed successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to close job', 'JOB_CLOSE_ERROR');
  }
};

// @desc    Mark job as filled
// @route   POST /api/jobs/:id/fill
// @access  Private (Employer/Admin)
const markJobFilled = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.markFilled();

    return sendSuccess(res, job, 'Job marked as filled successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to mark job as filled', 'JOB_FILL_ERROR');
  }
};

// @desc    Reopen job
// @route   POST /api/jobs/:id/reopen
// @access  Private (Employer/Admin)
const reopenJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.reopen();

    return sendSuccess(res, job, 'Job reopened successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to reopen job', 'JOB_REOPEN_ERROR');
  }
};

// @desc    Archive job
// @route   POST /api/jobs/:id/archive
// @access  Private (Employer/Admin)
const archiveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.archive(req.user.id);

    return sendSuccess(res, job, 'Job archived successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to archive job', 'JOB_ARCHIVE_ERROR');
  }
};

// ============================================
// INTERVIEW MANAGEMENT
// ============================================

// @desc    Schedule interview
// @route   POST /api/jobs/:id/applications/:applicationId/interviews
// @access  Private (Employer/Admin)
const scheduleInterview = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { type, scheduledAt, duration, timezone, location, interviewers, round } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const interview = await job.scheduleInterview(applicationId, {
      type,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      timezone: timezone || 'Asia/Manila',
      location,
      interviewers,
      round: round || 1
    });

    // Notify applicant about interview
    const application = job.applications.id(applicationId);
    if (application) {
      try {
        await NotificationService.sendNotification({
          userId: application.applicant,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          message: `Your interview for "${job.title}" has been scheduled for ${new Date(scheduledAt).toLocaleString()}`,
          data: { jobId, applicationId, interviewId: interview.interviewId },
          priority: 'high'
        });
      } catch (notifyError) {
        logger.warn('Interview notification failed', { error: notifyError.message });
      }
    }

    return sendSuccess(res, interview, 'Interview scheduled successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to schedule interview', 'INTERVIEW_SCHEDULE_ERROR');
  }
};

// @desc    Update interview status
// @route   PUT /api/jobs/:id/applications/:applicationId/interviews/:interviewId
// @access  Private (Employer/Admin)
const updateInterviewStatus = async (req, res) => {
  try {
    const { id: jobId, applicationId, interviewId } = req.params;
    const { status, feedback } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const interview = await job.updateInterviewStatus(applicationId, interviewId, status, feedback);

    return sendSuccess(res, interview, 'Interview status updated successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to update interview', 'INTERVIEW_UPDATE_ERROR');
  }
};

// @desc    Reschedule interview
// @route   POST /api/jobs/:id/applications/:applicationId/interviews/:interviewId/reschedule
// @access  Private (Employer/Admin)
const rescheduleInterview = async (req, res) => {
  try {
    const { id: jobId, applicationId, interviewId } = req.params;
    const { newDate, reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const interview = await job.rescheduleInterview(applicationId, interviewId, new Date(newDate), reason, 'company');

    // Notify applicant about reschedule
    const application = job.applications.id(applicationId);
    if (application) {
      try {
        await NotificationService.sendNotification({
          userId: application.applicant,
          type: 'interview_rescheduled',
          title: 'Interview Rescheduled',
          message: `Your interview for "${job.title}" has been rescheduled to ${new Date(newDate).toLocaleString()}`,
          data: { jobId, applicationId, interviewId, reason },
          priority: 'high'
        });
      } catch (notifyError) {
        logger.warn('Interview reschedule notification failed', { error: notifyError.message });
      }
    }

    return sendSuccess(res, interview, 'Interview rescheduled successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to reschedule interview', 'INTERVIEW_RESCHEDULE_ERROR');
  }
};

// @desc    Submit interview feedback
// @route   POST /api/jobs/:id/applications/:applicationId/interviews/:interviewId/feedback
// @access  Private (Employer/Admin/Interviewer)
const submitInterviewFeedback = async (req, res) => {
  try {
    const { id: jobId, applicationId, interviewId } = req.params;
    const { rating, strengths, weaknesses, notes, recommendation } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return sendNotFoundError(res, 'Application not found', 'APPLICATION_NOT_FOUND');
    }

    const interview = application.interviews.find(i => i.interviewId === interviewId);
    if (!interview) {
      return sendNotFoundError(res, 'Interview not found', 'INTERVIEW_NOT_FOUND');
    }

    interview.feedback.push({
      interviewer: req.user.id,
      rating,
      strengths,
      weaknesses,
      notes,
      recommendation,
      submittedAt: new Date()
    });

    await job.save();

    return sendSuccess(res, interview, 'Interview feedback submitted successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to submit feedback', 'FEEDBACK_SUBMIT_ERROR');
  }
};

// ============================================
// OFFER MANAGEMENT
// ============================================

// @desc    Send job offer
// @route   POST /api/jobs/:id/applications/:applicationId/offer
// @access  Private (Employer/Admin)
const sendOffer = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { salary, startDate, signingBonus, equity, benefits, terms, expiresAt } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = await job.sendOffer(applicationId, {
      salary,
      startDate: startDate ? new Date(startDate) : null,
      signingBonus,
      equity,
      benefits,
      terms,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Notify applicant about offer
    try {
      await NotificationService.sendNotification({
        userId: application.applicant,
        type: 'offer_received',
        title: 'Job Offer Received!',
        message: `Congratulations! You have received a job offer for "${job.title}"`,
        data: { jobId, applicationId },
        priority: 'high'
      });

      // Send email notification
      const applicant = await User.findById(application.applicant);
      if (applicant && applicant.email) {
        await EmailService.sendJobOfferNotification(applicant.email, {
          jobTitle: job.title,
          companyName: job.company.name,
          salary,
          startDate,
          expiresAt: application.offer.expiresAt
        });
      }
    } catch (notifyError) {
      logger.warn('Offer notification failed', { error: notifyError.message });
    }

    return sendSuccess(res, application, 'Job offer sent successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to send offer', 'OFFER_SEND_ERROR');
  }
};

// @desc    Respond to job offer (Accept/Decline)
// @route   POST /api/jobs/:id/applications/:applicationId/offer/respond
// @access  Private (Applicant)
const respondToOffer = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { accepted, declineReason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return sendNotFoundError(res, 'Application not found', 'APPLICATION_NOT_FOUND');
    }

    // Verify the applicant is responding to their own offer
    if (application.applicant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedApplication = await job.respondToOffer(applicationId, accepted, declineReason);

    // Notify employer about response
    try {
      const applicant = await User.findById(application.applicant);
      await NotificationService.sendNotification({
        userId: job.employer,
        type: 'offer_response',
        title: accepted ? 'Offer Accepted!' : 'Offer Declined',
        message: `${applicant.firstName} ${applicant.lastName} has ${accepted ? 'accepted' : 'declined'} your offer for "${job.title}"`,
        data: { jobId, applicationId, accepted },
        priority: 'high'
      });
    } catch (notifyError) {
      logger.warn('Offer response notification failed', { error: notifyError.message });
    }

    return sendSuccess(res, updatedApplication, `Offer ${accepted ? 'accepted' : 'declined'} successfully`);
  } catch (error) {
    return sendServerError(res, error, 'Failed to respond to offer', 'OFFER_RESPOND_ERROR');
  }
};

// @desc    Withdraw job offer
// @route   DELETE /api/jobs/:id/applications/:applicationId/offer
// @access  Private (Employer/Admin)
const withdrawOffer = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = job.applications.id(applicationId);
    if (!application || !application.offer) {
      return sendNotFoundError(res, 'Offer not found', 'OFFER_NOT_FOUND');
    }

    application.offer.status = 'withdrawn';
    application.offer.negotiationNotes = reason;
    application.status = 'rejected';

    await job.save();

    // Notify applicant
    try {
      await NotificationService.sendNotification({
        userId: application.applicant,
        type: 'offer_withdrawn',
        title: 'Offer Withdrawn',
        message: `The offer for "${job.title}" has been withdrawn`,
        data: { jobId, applicationId, reason },
        priority: 'medium'
      });
    } catch (notifyError) {
      logger.warn('Offer withdrawal notification failed', { error: notifyError.message });
    }

    return sendSuccess(res, application, 'Offer withdrawn successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to withdraw offer', 'OFFER_WITHDRAW_ERROR');
  }
};

// ============================================
// REFERRAL MANAGEMENT
// ============================================

// @desc    Add referral
// @route   POST /api/jobs/:id/referrals
// @access  Private
const addReferral = async (req, res) => {
  try {
    const { referredEmail, referredName, notes } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    if (!job.referralProgram.enabled) {
      return res.status(400).json({ success: false, message: 'Referral program is not enabled for this job' });
    }

    const referral = await job.addReferral(req.user.id, referredEmail);

    // Send referral invitation email
    try {
      await EmailService.sendReferralInvitation(referredEmail, {
        referrerName: `${req.user.firstName} ${req.user.lastName}`,
        jobTitle: job.title,
        companyName: job.company.name,
        referralBonus: job.referralProgram.bonus.amount,
        jobUrl: `${process.env.APP_URL}/jobs/${job._id}`
      });
    } catch (emailError) {
      logger.warn('Referral invitation email failed', { error: emailError.message });
    }

    return sendSuccess(res, referral, 'Referral added successfully');
  } catch (error) {
    if (error.message === 'This email has already been referred') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return sendServerError(res, error, 'Failed to add referral', 'REFERRAL_ADD_ERROR');
  }
};

// @desc    Get job referrals
// @route   GET /api/jobs/:id/referrals
// @access  Private (Employer/Admin)
const getJobReferrals = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('referralProgram.referrals.referrer', 'firstName lastName email')
      .populate('referralProgram.referrals.referredUser', 'firstName lastName email');

    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return sendSuccess(res, {
      program: {
        enabled: job.referralProgram.enabled,
        bonus: job.referralProgram.bonus
      },
      referrals: job.referralProgram.referrals,
      stats: {
        total: job.referralProgram.referrals.length,
        pending: job.referralProgram.referrals.filter(r => r.status === 'pending').length,
        applied: job.referralProgram.referrals.filter(r => r.status === 'applied').length,
        hired: job.referralProgram.referrals.filter(r => r.status === 'hired').length,
        paid: job.referralProgram.referrals.filter(r => r.status === 'paid').length
      }
    }, 'Referrals retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get referrals', 'REFERRALS_GET_ERROR');
  }
};

// @desc    Get my referrals (as referrer)
// @route   GET /api/jobs/my-referrals
// @access  Private
const getMyReferrals = async (req, res) => {
  try {
    const jobs = await Job.find({
      'referralProgram.referrals.referrer': req.user.id
    }).select('title company referralProgram');

    const referrals = [];
    jobs.forEach(job => {
      job.referralProgram.referrals
        .filter(r => r.referrer.toString() === req.user.id)
        .forEach(r => {
          referrals.push({
            job: { _id: job._id, title: job.title, company: job.company.name },
            referral: r,
            potentialBonus: job.referralProgram.bonus.amount
          });
        });
    });

    return sendSuccess(res, {
      referrals,
      stats: {
        total: referrals.length,
        pending: referrals.filter(r => r.referral.status === 'pending').length,
        hired: referrals.filter(r => r.referral.status === 'hired').length,
        totalEarned: referrals
          .filter(r => r.referral.status === 'paid')
          .reduce((sum, r) => sum + (r.referral.bonusAmount || 0), 0)
      }
    }, 'My referrals retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get referrals', 'MY_REFERRALS_ERROR');
  }
};

// ============================================
// ANALYTICS
// ============================================

// @desc    Get job analytics
// @route   GET /api/jobs/:id/analytics
// @access  Private (Employer/Admin)
const getJobAnalytics = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return sendSuccess(res, {
      views: job.analytics.views,
      applications: job.analytics.applications,
      shares: job.analytics.shares,
      saves: job.analytics.saves,
      clicks: job.analytics.clicks,
      conversionRate: job.analytics.conversionRate,
      avgTimeToApply: job.analytics.avgTimeToApply,
      sourceBreakdown: job.analytics.sourceBreakdown,
      funnel: job.analytics.funnel,
      timeMetrics: job.analytics.timeMetrics,
      lastViewedAt: job.analytics.lastViewedAt,
      lastAppliedAt: job.analytics.lastAppliedAt
    }, 'Job analytics retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get analytics', 'ANALYTICS_GET_ERROR');
  }
};

// @desc    Get hiring funnel
// @route   GET /api/jobs/:id/funnel
// @access  Private (Employer/Admin)
const getHiringFunnel = async (req, res) => {
  try {
    const funnel = await Job.getHiringFunnel(req.params.id);
    if (!funnel) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    return sendSuccess(res, funnel, 'Hiring funnel retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get funnel', 'FUNNEL_GET_ERROR');
  }
};

// @desc    Get employer job stats
// @route   GET /api/jobs/employer-stats
// @access  Private (Employer/Admin)
const getEmployerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Job.getStats(
      req.user.id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    return sendSuccess(res, stats, 'Employer stats retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get stats', 'EMPLOYER_STATS_ERROR');
  }
};

// ============================================
// FEATURING & PROMOTION
// ============================================

// @desc    Feature job
// @route   POST /api/jobs/:id/feature
// @access  Private (Admin)
const featureJob = async (req, res) => {
  try {
    const { until, position } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    await job.feature(new Date(until), position);

    return sendSuccess(res, job, 'Job featured successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to feature job', 'JOB_FEATURE_ERROR');
  }
};

// @desc    Unfeature job
// @route   DELETE /api/jobs/:id/feature
// @access  Private (Admin)
const unfeatureJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    await job.unfeature();

    return sendSuccess(res, job, 'Job unfeatured successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to unfeature job', 'JOB_UNFEATURE_ERROR');
  }
};

// @desc    Promote job
// @route   POST /api/jobs/:id/promote
// @access  Private (Employer/Admin)
const promoteJob = async (req, res) => {
  try {
    const { promotionType, until } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.promote(promotionType, new Date(until));

    return sendSuccess(res, job, 'Job promoted successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to promote job', 'JOB_PROMOTE_ERROR');
  }
};

// ============================================
// APPLICATION SCORING
// ============================================

// @desc    Update application score
// @route   PUT /api/jobs/:id/applications/:applicationId/score
// @access  Private (Employer/Admin)
const updateApplicationScore = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { screening, skills, experience, cultural, manual, overall } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = await job.updateScore(applicationId, {
      screening, skills, experience, cultural, manual, overall
    });

    return sendSuccess(res, application, 'Application score updated successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to update score', 'SCORE_UPDATE_ERROR');
  }
};

// @desc    Reject application
// @route   POST /api/jobs/:id/applications/:applicationId/reject
// @access  Private (Employer/Admin)
const rejectApplication = async (req, res) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { reason, customReason, feedback } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (job.employer.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = await job.rejectApplication(applicationId, req.user.id, reason, customReason, feedback);

    // Notify applicant
    try {
      await NotificationService.sendNotification({
        userId: application.applicant,
        type: 'application_rejected',
        title: 'Application Update',
        message: `Your application for "${job.title}" has been reviewed`,
        data: { jobId, applicationId },
        priority: 'medium'
      });
    } catch (notifyError) {
      logger.warn('Rejection notification failed', { error: notifyError.message });
    }

    return sendSuccess(res, application, 'Application rejected successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to reject application', 'REJECT_APPLICATION_ERROR');
  }
};

// ============================================
// SPECIAL QUERIES
// ============================================

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
const getFeaturedJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const jobs = await Job.findFeatured(Number(limit))
      .populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name');

    return sendSuccess(res, jobs, 'Featured jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get featured jobs', 'FEATURED_JOBS_ERROR');
  }
};

// @desc    Get urgent jobs
// @route   GET /api/jobs/urgent
// @access  Public
const getUrgentJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const jobs = await Job.findUrgent(Number(limit))
      .populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name');

    return sendSuccess(res, jobs, 'Urgent jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get urgent jobs', 'URGENT_JOBS_ERROR');
  }
};

// @desc    Get remote jobs
// @route   GET /api/jobs/remote
// @access  Public
const getRemoteJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const jobs = await Job.findRemote({ page: Number(page), limit: Number(limit) })
      .populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name');

    const total = await Job.countDocuments({
      'location.type': { $in: ['fully_remote', 'hybrid'] },
      isActive: true,
      status: 'active'
    });

    return sendPaginated(res, jobs, createPagination(page, limit, total), 'Remote jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get remote jobs', 'REMOTE_JOBS_ERROR');
  }
};

// @desc    Get nearby jobs
// @route   GET /api/jobs/nearby
// @access  Public
const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return sendValidationError(res, [{ field: 'coordinates', message: 'Latitude and longitude are required' }]);
    }

    const jobs = await Job.findNearby(
      [parseFloat(lng), parseFloat(lat)],
      Number(maxDistance),
      { page: Number(page), limit: Number(limit) }
    ).populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name');

    return sendSuccess(res, jobs, 'Nearby jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get nearby jobs', 'NEARBY_JOBS_ERROR');
  }
};

// @desc    Get job by slug
// @route   GET /api/jobs/slug/:slug
// @access  Public
const getJobBySlug = async (req, res) => {
  try {
    const job = await Job.findBySlug(req.params.slug)
      .populate('employer', 'firstName lastName profile.avatar profile.businessName profile.bio profile.rating')
      .populate('category', 'name description');

    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    // Record view
    await job.recordView(req.user ? true : false);

    return sendSuccess(res, job, 'Job retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get job', 'JOB_GET_ERROR');
  }
};

// @desc    Get job by job number
// @route   GET /api/jobs/number/:jobNumber
// @access  Public
const getJobByNumber = async (req, res) => {
  try {
    const job = await Job.findByJobNumber(req.params.jobNumber)
      .populate('employer', 'firstName lastName profile.avatar profile.businessName')
      .populate('category', 'name description');

    if (!job) {
      return sendNotFoundError(res, 'Job not found', 'JOB_NOT_FOUND');
    }

    return sendSuccess(res, job, 'Job retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get job', 'JOB_GET_ERROR');
  }
};

// @desc    Get expiring jobs
// @route   GET /api/jobs/expiring
// @access  Private (Employer/Admin)
const getExpiringJobs = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const jobs = await Job.getExpiringSoon(Number(days))
      .populate('employer', 'firstName lastName profile.businessName');

    return sendSuccess(res, jobs, 'Expiring jobs retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to get expiring jobs', 'EXPIRING_JOBS_ERROR');
  }
};

module.exports = {
  // Basic CRUD
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  // Application management
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication,
  rejectApplication,
  updateApplicationScore,
  // Job management
  getMyJobs,
  uploadCompanyLogo,
  getJobStats,
  searchJobs,
  getJobCategories,
  // Workflow
  publishJob,
  pauseJob,
  closeJob,
  markJobFilled,
  reopenJob,
  archiveJob,
  // Interviews
  scheduleInterview,
  updateInterviewStatus,
  rescheduleInterview,
  submitInterviewFeedback,
  // Offers
  sendOffer,
  respondToOffer,
  withdrawOffer,
  // Referrals
  addReferral,
  getJobReferrals,
  getMyReferrals,
  // Analytics
  getJobAnalytics,
  getHiringFunnel,
  getEmployerStats,
  // Featuring & Promotion
  featureJob,
  unfeatureJob,
  promoteJob,
  // Special queries
  getFeaturedJobs,
  getUrgentJobs,
  getRemoteJobs,
  getNearbyJobs,
  getJobBySlug,
  getJobByNumber,
  getExpiringJobs
};
