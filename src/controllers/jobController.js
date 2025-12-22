const Job = require('../models/Job');
const JobCategory = require('../models/JobCategory');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const GoogleMapsService = require('../services/googleMapsService');
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
      message: 'Application submitted successfully'
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
    const { jobId, applicationId } = req.params;

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

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  getMyJobs,
  uploadCompanyLogo,
  getJobStats,
  searchJobs,
  getJobCategories
};
