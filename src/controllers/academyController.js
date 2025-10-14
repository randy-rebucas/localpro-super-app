const { Course, Enrollment, Certification } = require('../models/Academy');
const CloudinaryService = require('../services/cloudinaryService');
const { uploaders } = require('../config/cloudinary');

// @desc    Get all courses
// @route   GET /api/academy/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const {
      category,
      level,
      partner,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (partner) filter['partner.name'] = new RegExp(partner, 'i');
    if (minPrice || maxPrice) {
      filter['pricing.regularPrice'] = {};
      if (minPrice) filter['pricing.regularPrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.regularPrice'].$lte = Number(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName profile.avatar profile.experience')
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

// @desc    Get single course
// @route   GET /api/academy/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profile.avatar profile.experience profile.skills');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/academy/enroll
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check enrollment capacity
    if (course.enrollment.maxCapacity && course.enrollment.current >= course.enrollment.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Course is full'
      });
    }

    const enrollmentData = {
      student: userId,
      course: courseId,
      payment: {
        amount: course.pricing.regularPrice,
        currency: course.pricing.currency
      }
    };

    const enrollment = await Enrollment.create(enrollmentData);

    // Update course enrollment count
    course.enrollment.current += 1;
    await course.save();

    // Populate enrollment details
    await enrollment.populate([
      { path: 'course', select: 'title category instructor pricing' },
      { path: 'student', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
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

// @desc    Get user enrollments
// @route   GET /api/academy/enrollments
// @access  Private
const getEnrollments = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    const filter = { student: userId };
    if (status) filter.status = status;

    const enrollments = await Enrollment.find(filter)
      .populate('course', 'title category instructor pricing duration')
      .sort({ enrollmentDate: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update lesson progress
// @route   PUT /api/academy/enrollments/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { lessonId } = req.body;
    const enrollmentId = req.params.id;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is the student
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.progress.completedLessons.find(
      lesson => lesson.lessonId === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.progress.completedLessons.push({
        lessonId,
        completedAt: new Date()
      });

      // Calculate overall progress
      const course = await Course.findById(enrollment.course);
      if (course) {
        const totalLessons = course.curriculum.reduce(
          (total, module) => total + module.lessons.length, 0
        );
        const completedCount = enrollment.progress.completedLessons.length;
        enrollment.progress.overallProgress = Math.round((completedCount / totalLessons) * 100);
      }

      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get certifications
// @route   GET /api/academy/certifications
// @access  Public
const getCertifications = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;

    const certifications = await Certification.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications
    });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course thumbnail
// @route   POST /api/academy/courses/:id/thumbnail
// @access  Private (Instructor)
const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const courseId = req.params.id;
    const course = await Course.findById(courseId);

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

    // Update course thumbnail
    course.thumbnail = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id,
      thumbnail: CloudinaryService.getOptimizedUrl(uploadResult.data.public_id, 'thumbnail')
    };

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course thumbnail uploaded successfully',
      data: {
        thumbnail: course.thumbnail
      }
    });
  } catch (error) {
    console.error('Upload course thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload course content
// @route   POST /api/academy/courses/:id/content
// @access  Private (Instructor)
const uploadCourseContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { moduleId, lessonId, contentType } = req.body; // contentType: 'video', 'document', 'image'
    const courseId = req.params.id;

    if (!moduleId || !lessonId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Module ID, lesson ID, and content type are required'
      });
    }

    const course = await Course.findById(courseId);

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
        message: 'Not authorized to upload content for this course'
      });
    }

    // Find the module and lesson
    const module = course.curriculum.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file, 
      `localpro/academy/courses/${courseId}/content`
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload content',
        error: uploadResult.error
      });
    }

    // Delete old content if exists
    if (lesson.content && lesson.content.publicId) {
      await CloudinaryService.deleteFile(lesson.content.publicId);
    }

    // Update lesson content
    lesson.content = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id,
      type: contentType
    };

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course content uploaded successfully',
      data: {
        content: lesson.content
      }
    });
  } catch (error) {
    console.error('Upload course content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create course (Instructor)
// @route   POST /api/academy/courses
// @access  Private (Instructor)
const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user.id
    };

    const course = await Course.create(courseData);

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

module.exports = {
  getCourses,
  getCourse,
  enrollInCourse,
  getEnrollments,
  updateProgress,
  getCertifications,
  uploadCourseThumbnail,
  uploadCourseContent,
  createCourse
};
