const { Course } = require('../models/Academy');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

// @desc    Get all academy courses
// @route   GET /api/academy/courses
// @access  Public
const getCourses = async(req, res) => {
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
    logger.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single course
// @route   GET /api/academy/courses/:id
// @access  Public
const getCourse = async(req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profile.avatar profile.bio profile.rating')
      .populate('enrollments.user', 'firstName lastName profile.avatar')
      .populate('reviews.user', 'firstName lastName profile.avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count
    course.views += 1;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new course
// @route   POST /api/academy/courses
// @access  Private
const createCourse = async(req, res) => {
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
    logger.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course
// @route   PUT /api/academy/courses/:id
// @access  Private
const updateCourse = async(req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    logger.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/academy/courses/:id
// @access  Private
const deleteCourse = async(req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user.id) {
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
    logger.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course thumbnail
// @route   POST /api/academy/courses/:id/thumbnail
// @access  Private
const uploadCourseThumbnail = async(req, res) => {
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

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user.id) {
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
    logger.error('Upload course thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course video
// @route   POST /api/academy/courses/:id/videos
// @access  Private
const uploadCourseVideo = async(req, res) => {
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

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload videos for this course'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file,
      'localpro/academy/videos'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload video',
        error: uploadResult.error
      });
    }

    // Add video to course
    const video = {
      title: req.body.title || 'Untitled Video',
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id,
      duration: req.body.duration || 0,
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
    logger.error('Upload course video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete course video
// @route   DELETE /api/academy/courses/:id/videos/:videoId
// @access  Private
const deleteCourseVideo = async(req, res) => {
  try {
    const { videoId } = req.params;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== req.user.id) {
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
    logger.error('Delete course video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/academy/courses/:id/enroll
// @access  Private
const enrollInCourse = async(req, res) => {
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
    logger.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course progress
// @route   PUT /api/academy/courses/:id/progress
// @access  Private
const updateCourseProgress = async(req, res) => {
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
    logger.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add course review
// @route   POST /api/academy/courses/:id/reviews
// @access  Private
const addCourseReview = async(req, res) => {
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
    logger.error('Add course review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's enrolled courses
// @route   GET /api/academy/my-courses
// @access  Private
const getMyCourses = async(req, res) => {
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
    logger.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's created courses
// @route   GET /api/academy/my-created-courses
// @access  Private
const getMyCreatedCourses = async(req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ instructor: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Course.countDocuments({ instructor: req.user.id });

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: courses
    });
  } catch (error) {
    logger.error('Get my created courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get course categories
// @route   GET /api/academy/categories
// @access  Public
const getCourseCategories = async(req, res) => {
  try {
    const categories = await Course.aggregate([
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
    logger.error('Get course categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured courses
// @route   GET /api/academy/featured
// @access  Public
const getFeaturedCourses = async(req, res) => {
  try {
    const { limit = 10 } = req.query;

    const courses = await Course.find({
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
    logger.error('Get featured courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/academy/statistics
// @access  Private (Admin only)
const getCourseStatistics = async(req, res) => {
  try {
    // Get total courses
    const totalCourses = await Course.countDocuments();

    // Get courses by category
    const coursesByCategory = await Course.aggregate([
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

    // Get total enrollments
    const totalEnrollments = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: { $size: '$enrollments' } }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Course.aggregate([
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
        totalEnrollments: totalEnrollments[0]?.totalEnrollments || 0,
        monthlyTrends
      }
    });
  } catch (error) {
    logger.error('Get course statistics error:', error);
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
