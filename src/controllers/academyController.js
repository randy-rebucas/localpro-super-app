const { Course, Enrollment } = require('../models/Academy');
const Academy = Course; // Alias for backward compatibility
const User = require('../models/User');
const mongoose = require('mongoose');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const logger = require('../config/logger');
const { sendServerError } = require('../utils/responseHelper');

// @desc    Get all academy courses
// @route   GET /api/academy/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const {
      search,
      category,
      level,
      instructor,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Level filter
    if (level) {
      filter.level = level;
    }

    // Instructor filter
    if (instructor) {
      filter.instructor = instructor;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName profile.avatar profile.bio')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get detailed information about a course
// @route   GET /api/academy/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      includeEnrollments = 'false',
      includeReviews = 'false',
      includeStatistics = 'true',
      includeRelated = 'true'
    } = req.query;

    // Validate and convert ObjectId
    const trimmedId = id.trim();
    
    if (!trimmedId || trimmedId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format',
        error: 'ID must be exactly 24 characters (MongoDB ObjectId format)',
        receivedId: trimmedId,
        receivedLength: trimmedId?.length || 0,
        expectedLength: 24
      });
    }

    let courseId;
    try {
      if (!mongoose.isValidObjectId(trimmedId)) {
        throw new Error('Invalid ObjectId format');
      }
      courseId = new mongoose.Types.ObjectId(trimmedId);
    } catch (e) {
      logger.warn('Invalid course ID format', {
        id: trimmedId,
        error: e.message
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format',
        error: e.message || 'ID must be a valid MongoDB ObjectId',
        receivedId: trimmedId
      });
    }

    // Find course with instructor population
    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName email phone profile.avatar profile.bio profile.rating profile.experience')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is active
    if (!course.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Course is not active',
        hint: 'This course is currently inactive and cannot be viewed'
      });
    }

    // Initialize response data
    const courseDetails = {
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        instructor: course.instructor,
        partner: course.partner,
        level: course.level,
        duration: course.duration,
        pricing: course.pricing,
        curriculum: course.curriculum,
        prerequisites: course.prerequisites,
        learningOutcomes: course.learningOutcomes,
        certification: course.certification,
        enrollment: course.enrollment,
        schedule: course.schedule,
        rating: course.rating,
        thumbnail: course.thumbnail,
        tags: course.tags,
        // views: course.views || 0, // Uncomment if views field exists in schema
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    };

    // Get enrollments if requested
    if (includeEnrollments === 'true' || includeEnrollments === true) {
      const enrollments = await Enrollment.find({ course: courseId })
        .populate('student', 'firstName lastName profile.avatar')
        .sort({ enrollmentDate: -1 })
        .limit(50)
        .lean();

      courseDetails.enrollments = enrollments.map(enrollment => ({
        id: enrollment._id,
        student: enrollment.student,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        progress: enrollment.progress,
        payment: enrollment.payment,
        certificate: enrollment.certificate,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt
      }));
      
      courseDetails.enrollmentCount = enrollments.length;
    }

    // Get statistics if requested
    if (includeStatistics === 'true' || includeStatistics === true) {
      // Get enrollment statistics
      const enrollmentStats = await Enrollment.aggregate([
        { $match: { course: courseId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        // views: course.views || 0, // Uncomment if views field exists in schema
        rating: course.rating || { average: 0, count: 0 },
        enrollment: {
          current: course.enrollment?.current || 0,
          maxCapacity: course.enrollment?.maxCapacity || null,
          isOpen: course.enrollment?.isOpen !== false
        }
      };

      // Add enrollment breakdown by status
      if (enrollmentStats.length > 0) {
        stats.enrollmentBreakdown = {
          total: 0,
          enrolled: 0,
          inProgress: 0,
          completed: 0,
          dropped: 0
        };

        enrollmentStats.forEach(stat => {
          stats.enrollmentBreakdown.total += stat.count;
          if (stat._id === 'enrolled') {
            stats.enrollmentBreakdown.enrolled = stat.count;
          } else if (stat._id === 'in_progress') {
            stats.enrollmentBreakdown.inProgress = stat.count;
          } else if (stat._id === 'completed') {
            stats.enrollmentBreakdown.completed = stat.count;
          } else if (stat._id === 'dropped') {
            stats.enrollmentBreakdown.dropped = stat.count;
          }
        });
      }

      // Get total lessons count from curriculum
      const totalLessons = course.curriculum?.reduce((total, module) => {
        return total + (module.lessons?.length || 0);
      }, 0) || 0;

      stats.curriculum = {
        modules: course.curriculum?.length || 0,
        totalLessons: totalLessons,
        estimatedHours: course.duration?.hours || 0,
        estimatedWeeks: course.duration?.weeks || null
      };

      courseDetails.statistics = stats;
    }

    // Get related courses if requested
    if (includeRelated === 'true' || includeRelated === true) {
      const relatedCourses = await Course.find({
        category: course.category,
        isActive: true,
        _id: { $ne: courseId }
      })
        .populate('instructor', 'firstName lastName profile.avatar')
        .select('title description category level pricing rating thumbnail enrollment tags')
        .sort({ 'rating.average': -1, createdAt: -1 })
        .limit(6)
        .lean();

      courseDetails.relatedCourses = relatedCourses;
    }

    // Increment view count (if views field exists in schema)
    try {
      await Course.findByIdAndUpdate(courseId, {
        $inc: { views: 1 }
      });
    } catch (e) {
      // If views field doesn't exist, just log the view without incrementing
      logger.debug('Course viewed', { courseId });
    }

    logger.info('Course details retrieved', {
      courseId: id,
      courseTitle: course.title,
      category: course.category,
      includeEnrollments,
      includeReviews,
      includeRelated,
      includeStatistics
    });

    return res.status(200).json({
      success: true,
      message: 'Course details retrieved successfully',
      data: courseDetails
    });
  } catch (error) {
    logger.error('Failed to get course details', error, {
      courseId: req.params.id
    });
    return sendServerError(res, error, 'Failed to retrieve course details', 'COURSE_DETAILS_ERROR');
  }
};

// @desc    Create new course
// @route   POST /api/academy/courses
// @access  Private (Instructor/Admin)
const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user.id
    };

    const course = await Course.create(courseData);

    await course.populate('instructor', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course
// @route   PUT /api/academy/courses/:id
// @access  Private (Instructor/Admin)
const updateCourse = async (req, res) => {
  try {
    let course = await Academy.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isInstructor = course.instructor.toString() === req.user.id;

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Academy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/academy/courses/:id
// @access  Private (Instructor/Admin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isInstructor = course.instructor.toString() === req.user.id;

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Soft delete
    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course thumbnail
// @route   POST /api/academy/courses/:id/thumbnail
// @access  Private (Instructor/Admin)
const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isInstructor = course.instructor.toString() === req.user.id;

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload thumbnail for this course'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file, 
      'localpro/academy/thumbnails'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: uploadResult.error
      });
    }

    // Delete old thumbnail if exists
    if (course.thumbnail && course.thumbnail.publicId) {
      await CloudinaryService.deleteFile(course.thumbnail.publicId);
    }

    // Update course with new thumbnail
    course.thumbnail = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id
    };

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      data: course.thumbnail
    });
  } catch (error) {
    console.error('Upload course thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course video
// @route   POST /api/academy/courses/:id/videos
// @access  Private (Instructor/Admin)
const uploadCourseVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isInstructor = course.instructor.toString() === req.user.id;

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload videos for this course'
      });
    }

    // CloudinaryStorage automatically uploads to Cloudinary and adds response to req.file
    // The Cloudinary response is merged into req.file object
    let videoUrl, publicId;
    
    // Check if file was already uploaded via CloudinaryStorage
    // CloudinaryStorage adds: path (URL), filename (public_id), and may add other Cloudinary response properties
    const isCloudinaryUploaded = req.file.path && req.file.path.includes('cloudinary.com');
    
    if (isCloudinaryUploaded) {
      // File already uploaded via CloudinaryStorage - extract info from Cloudinary response
      videoUrl = req.file.secure_url || req.file.url || req.file.path;
      
      // Extract public_id - CloudinaryStorage typically uses filename as public_id
      // For videos, the path format is: .../upload/v1234567890/folder/filename.ext
      if (req.file.public_id) {
        publicId = req.file.public_id;
      } else if (req.file.filename) {
        // CloudinaryStorage uses filename as public_id (without extension)
        publicId = req.file.filename;
      } else if (req.file.path) {
        // Extract public_id from Cloudinary URL
        try {
          const pathParts = req.file.path.split('/');
          const uploadIndex = pathParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1 && pathParts.length > uploadIndex + 2) {
            // Get everything after 'upload/v1234567890/' and remove file extension
            publicId = pathParts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
          } else {
            // Fallback: use original filename without extension
            publicId = req.file.originalname?.replace(/\.[^/.]+$/, '') || `video-${Date.now()}`;
          }
        } catch (parseError) {
          console.error('Error parsing public_id from path:', parseError);
          publicId = req.file.originalname?.replace(/\.[^/.]+$/, '') || `video-${Date.now()}`;
        }
      } else {
        publicId = req.file.originalname?.replace(/\.[^/.]+$/, '') || `video-${Date.now()}`;
      }
      
      // Validate we have required values
      if (!videoUrl) {
        throw new Error('Failed to extract video URL from Cloudinary response');
      }
      if (!publicId) {
        throw new Error('Failed to extract public_id from Cloudinary response');
      }
    } else {
      // Fallback: Upload manually if not using CloudinaryStorage (shouldn't happen with our setup)
      const uploadResult = await CloudinaryService.uploadFile(
        req.file, 
        'localpro/academy/videos',
        { resource_type: 'video' }
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload video',
          error: uploadResult.error
        });
      }

      videoUrl = uploadResult.data.secure_url;
      publicId = uploadResult.data.public_id;
    }

    // Ensure videos array exists
    if (!course.videos || !Array.isArray(course.videos)) {
      course.videos = [];
    }

    // Add video to course
    const video = {
      title: req.body.title || '',
      url: videoUrl,
      publicId: publicId,
      duration: req.body.duration ? Number(req.body.duration) : 0,
      order: course.videos.length + 1
    };

    course.videos.push(video);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: video
    });
  } catch (error) {
    console.error('Upload course video error:', error);
    logger.error('Upload course video failed', {
      courseId: req.params.id,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        filename: req.file.filename,
        hasPublicId: !!req.file.public_id,
        hasSecureUrl: !!req.file.secure_url
      } : null
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message, stack: error.stack })
    });
  }
};

// @desc    Delete course video
// @route   DELETE /api/academy/courses/:id/videos/:videoId
// @access  Private (Instructor/Admin)
const deleteCourseVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isInstructor = course.instructor.toString() === req.user.id;

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete videos for this course'
      });
    }

    const video = course.videos.id(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(video.publicId);

    // Remove from course
    video.remove();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete course video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/academy/courses/:id/enroll
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user.id
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Add enrollment
    const enrollment = {
      user: req.user.id,
      enrolledAt: new Date(),
      progress: 0,
      status: 'active'
    };

    course.enrollments.push(enrollment);
    await course.save();

    // Send notification email to instructor
    const instructor = await User.findById(course.instructor);
    await EmailService.sendEmail({
      to: instructor.email,
      subject: 'New Course Enrollment',
      template: 'course-enrollment',
      data: {
        courseTitle: course.title,
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        enrolledAt: enrollment.enrolledAt
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course progress
// @route   PUT /api/academy/courses/:id/progress
// @access  Private
const updateCourseProgress = async (req, res) => {
  try {
    const { progress, completedVideos } = req.body;

    if (progress === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Progress is required'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find user's enrollment
    const enrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user.id
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Update progress
    enrollment.progress = Math.min(100, Math.max(0, progress));
    enrollment.completedVideos = completedVideos || enrollment.completedVideos;
    enrollment.lastAccessed = new Date();

    // Mark as completed if progress is 100%
    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course progress updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add course review
// @route   POST /api/academy/courses/:id/reviews
// @access  Private
const addCourseReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled and has completed the course
    const enrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user.id
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to review it'
      });
    }

    if (enrollment.status !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'You must complete the course before reviewing it'
      });
    }

    // Check if user has already reviewed
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    const review = {
      user: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    };

    course.reviews.push(review);

    // Update average rating
    const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    course.averageRating = totalRating / course.reviews.length;

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add course review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's enrolled courses
// @route   GET /api/academy/my-courses
// @access  Private
const getMyCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { 'enrollments.user': req.user.id };
    if (status) filter['enrollments.status'] = status;

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName profile.avatar')
      .sort({ 'enrollments.enrolledAt': -1 })
      .skip(skip)
      .limit(Number(limit));

    // Extract user's enrollment data
    const userCourses = courses.map(course => {
      const enrollment = course.enrollments.find(
        enrollment => enrollment.user.toString() === req.user.id
      );
      return {
        ...course.toObject(),
        enrollment
      };
    });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: userCourses.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: userCourses
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's created courses
// @route   GET /api/academy/my-created-courses
// @access  Private
const getMyCreatedCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const courses = await Academy.find({ instructor: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Academy.countDocuments({ instructor: req.user.id });

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: courses
    });
  } catch (error) {
    console.error('Get my created courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get course categories
// @route   GET /api/academy/categories
// @access  Public
const getCourseCategories = async (req, res) => {
  try {
    const categories = await Academy.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get course categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured courses
// @route   GET /api/academy/featured
// @access  Public
const getFeaturedCourses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const courses = await Academy.find({
      isActive: true,
      isFeatured: true
    })
    .populate('instructor', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/academy/statistics
// @access  Private (Admin only)
const getCourseStatistics = async (req, res) => {
  try {
    // Get total courses
    const totalCourses = await Academy.countDocuments();

    // Get courses by category
    const coursesByCategory = await Academy.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total enrollments from Enrollment collection
    const totalEnrollments = await Enrollment.countDocuments();

    // Get monthly trends
    const monthlyTrends = await Academy.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        coursesByCategory,
        totalEnrollments,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get course statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseThumbnail,
  uploadCourseVideo,
  deleteCourseVideo,
  enrollInCourse,
  updateCourseProgress,
  addCourseReview,
  getMyCourses,
  getMyCreatedCourses,
  getCourseCategories,
  getFeaturedCourses,
  getCourseStatistics
};