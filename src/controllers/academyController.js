const { Course, Enrollment, Certification, AcademyCategory } = require('../models/Academy');
const Favorite = require('../models/Favorite');
const Academy = Course; // Alias for backward compatibility
const User = require('../models/User');
const mongoose = require('mongoose');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const logger = require('../config/logger');
const { sendServerError } = require('../utils/responseHelper');

// Resolve category value (ObjectId or name) to ObjectId
const resolveCategoryId = async (value) => {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  const found = await AcademyCategory.findOne({ name: value.toLowerCase().trim() }, { _id: 1 });
  return found ? found._id : null;
};

// Helper to allow ObjectId or name-based lookup for categories
const buildCategoryFilter = (param) => (
  mongoose.isValidObjectId(param)
    ? { _id: param }
    : { name: param.toLowerCase().trim() }
);

// Category CRUD
const listCategories = async (_req, res) => {
  try {
    const categories = await AcademyCategory.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('List categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to list categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, isActive = true } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const exists = await AcademyCategory.findOne({ name: name.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    const category = await AcademyCategory.create({ name, description, isActive });
    res.status(201).json({ success: true, data: category, message: 'Category created' });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const category = await AcademyCategory.findOneAndUpdate(
      buildCategoryFilter(id),
      updates,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category, message: 'Category updated' });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AcademyCategory.findOneAndDelete(buildCategoryFilter(id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

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
      const categoryId = await resolveCategoryId(category);
      if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
      filter.category = categoryId;
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
      .populate('category', 'name description isActive')
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
      .populate('category', 'name description isActive')
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

    if (courseData.category) {
      const categoryId = await resolveCategoryId(courseData.category);
      if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Invalid category', detail: 'Category not found' });
      }
      courseData.category = categoryId;
    }

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

    const updateData = { ...req.body };
    if (updateData.category) {
      const categoryId = await resolveCategoryId(updateData.category);
      if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Invalid category', detail: 'Category not found' });
      }
      updateData.category = categoryId;
    }

    course = await Academy.findByIdAndUpdate(req.params.id, updateData, {
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

// @desc    Patch course (partial update)
// @route   PATCH /api/academy/courses/:id
// @access  Private (Instructor/Admin)
const patchCourse = async (req, res) => {
  try {
    const course = await Academy.findById(req.params.id);

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

    const updateData = { ...req.body };
    const updatedFields = [];

    // Helper function to deep merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date) && source[key].constructor === Object) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    // Fields that should not be directly updated
    const restrictedFields = ['_id', 'instructor', 'createdAt', 'updatedAt'];
    const allowedTopLevelFields = ['title', 'description', 'category', 'level', 'duration', 'pricing', 'curriculum', 'prerequisites', 'learningOutcomes', 'certification', 'enrollment', 'schedule', 'rating', 'favoritedBy', 'favoritesCount', 'isActive', 'thumbnail', 'tags'];

    // Handle category if provided
    if (updateData.category) {
      const categoryId = await resolveCategoryId(updateData.category);
      if (!categoryId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category', 
          detail: 'Category not found' 
        });
      }
      updateData.category = categoryId;
    }

    // Update top-level fields
    for (const field of allowedTopLevelFields) {
      if (updateData[field] !== undefined) {
        if (field === 'pricing' || field === 'duration' || field === 'certification' || field === 'enrollment' || field === 'schedule' || field === 'rating' || field === 'thumbnail') {
          // Deep merge for nested objects
          if (!course[field]) course[field] = {};
          deepMerge(course[field], updateData[field]);
        } else if (field === 'curriculum' || field === 'prerequisites' || field === 'learningOutcomes' || field === 'favoritedBy' || field === 'tags') {
          // Replace arrays
          course[field] = updateData[field];
        } else {
          course[field] = updateData[field];
        }
        updatedFields.push(field);
        delete updateData[field];
      }
    }

    // Remove restricted fields
    restrictedFields.forEach(field => delete updateData[field]);

    // Save course if there are updates
    if (updatedFields.length > 0) {
      await course.save();
    }

    // Populate related documents for response
    await course.populate([
      'category',
      'instructor',
      'partner',
      'favoritedBy'
    ]);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course,
        updatedFields
      }
    });
  } catch (error) {
    console.error('Patch course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const file = req.file || (Array.isArray(req.files) && req.files[0]);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Ensure multer provided buffer/path; otherwise fail gracefully
    if (!file.buffer && !file.path) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty. Please try again.'
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
      file, 
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

    // Check if user is already enrolled (Enrollment collection)
    const existingEnrollment = await Enrollment.findOne({
      course: course._id,
      student: req.user.id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course._id,
      status: 'enrolled',
      enrollmentDate: new Date(),
      payment: req.body?.payment || undefined
    });

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
      .populate('category', 'name description isActive')
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
      .limit(Number(limit))
      .populate('category', 'name description isActive');

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

// @desc    Favorite a course
// @route   POST /api/academy/courses/:id/favorite
// @access  Private
const favoriteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check via Favorite model
    const existing = await Favorite.isFavorited(req.user.id, 'course', id);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Course already favorited' });
    }

    await Favorite.create({
      user: req.user.id,
      itemType: 'course',
      itemId: id
    });

    // Optional: sync counter on course
    const favoritesCount = await Favorite.countDocuments({ itemType: 'course', itemId: id });
    course.favoritesCount = favoritesCount;
    await course.save();

    res.status(200).json({ success: true, message: 'Course favorited', data: { favoritesCount } });
  } catch (error) {
    logger.error('Favorite course error:', error);
    res.status(500).json({ success: false, message: 'Failed to favorite course' });
  }
};

// @desc    Unfavorite a course
// @route   DELETE /api/academy/courses/:id/favorite
// @access  Private
const unfavoriteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const favorite = await Favorite.findOne({
      user: req.user.id,
      itemType: 'course',
      itemId: id
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found for this course' });
    }

    await favorite.deleteOne();

    const favoritesCount = await Favorite.countDocuments({ itemType: 'course', itemId: id });
    course.favoritesCount = favoritesCount;
    await course.save();

    res.status(200).json({ success: true, message: 'Course unfavorited', data: { favoritesCount } });
  } catch (error) {
    logger.error('Unfavorite course error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfavorite course' });
  }
};

// @desc    Get my favorite courses
// @route   GET /api/academy/my-favorite-courses
// @access  Private
const getMyFavoriteCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find({
      user: req.user.id,
      itemType: 'course'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Populate the course for each favorite
    const populated = await Promise.all(
      favorites.map(async (fav) => {
        const course = await Course.findById(fav.itemId)
          .populate('instructor', 'firstName lastName profile.avatar')
          .populate('category', 'name description isActive');
        return {
          favoriteId: fav._id,
          notes: fav.notes,
          tags: fav.tags,
          addedAt: fav.metadata?.addedAt || fav.createdAt,
          course
        };
      })
    );

    const total = await Favorite.countDocuments({ user: req.user.id, itemType: 'course' });

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: populated
    });
  } catch (error) {
    logger.error('Get my favorite courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to get favorite courses' });
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

// ========= Certifications =========

// @desc    List certifications
// @route   GET /api/academy/certifications
// @access  Public
const listCertifications = async (_req, res) => {
  try {
    const certifications = await Certification.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: certifications });
  } catch (error) {
    logger.error('List certifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to list certifications' });
  }
};

// @desc    Create certification
// @route   POST /api/academy/certifications
// @access  Admin/Instructor
const createCertification = async (req, res) => {
  try {
    const cert = await Certification.create(req.body);
    res.status(201).json({ success: true, data: cert, message: 'Certification created' });
  } catch (error) {
    logger.error('Create certification error:', error);
    res.status(500).json({ success: false, message: 'Failed to create certification', error: error.message });
  }
};

// @desc    Update certification
// @route   PUT /api/academy/certifications/:id
// @access  Admin/Instructor
const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certification.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!cert) return res.status(404).json({ success: false, message: 'Certification not found' });
    res.json({ success: true, data: cert, message: 'Certification updated' });
  } catch (error) {
    logger.error('Update certification error:', error);
    res.status(500).json({ success: false, message: 'Failed to update certification', error: error.message });
  }
};

// @desc    Delete certification
// @route   DELETE /api/academy/certifications/:id
// @access  Admin/Instructor
const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Certification.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Certification not found' });
    res.json({ success: true, message: 'Certification deleted' });
  } catch (error) {
    logger.error('Delete certification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certification', error: error.message });
  }
};

// ========= Enrollments =========

// @desc    List enrollments (admin/instructor)
// @route   GET /api/academy/enrollments
// @access  Admin/Instructor
const listEnrollments = async (req, res) => {
  try {
    const { course, student, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (student) filter.student = student;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const enrollments = await Enrollment.find(filter)
      .populate('student', 'firstName lastName email profile.avatar')
      .populate('course', 'title category level')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Enrollment.countDocuments(filter);
    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('List enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to list enrollments' });
  }
};

// @desc    Update enrollment status
// @route   PUT /api/academy/enrollments/:id/status
// @access  Admin/Instructor
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
    const enrollment = await Enrollment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment, message: 'Enrollment status updated' });
  } catch (error) {
    logger.error('Update enrollment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update enrollment status', error: error.message });
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/academy/enrollments/:id
// @access  Admin
const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Enrollment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, message: 'Enrollment deleted' });
  } catch (error) {
    logger.error('Delete enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete enrollment', error: error.message });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  patchCourse,
  deleteCourse,
  uploadCourseThumbnail,
  uploadCourseVideo,
  deleteCourseVideo,
  enrollInCourse,
  updateCourseProgress,
  addCourseReview,
  getMyCourses,
  getMyCreatedCourses,
  favoriteCourse,
  unfavoriteCourse,
  getMyFavoriteCourses,
  getCourseCategories,
  getFeaturedCourses,
  getCourseStatistics,
  // Categories
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Certifications
  listCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  // Enrollments
  listEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment
};