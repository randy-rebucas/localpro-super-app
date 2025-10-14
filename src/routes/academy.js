const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  enrollInCourse,
  getEnrollments,
  updateProgress,
  getCertifications,
  uploadCourseThumbnail,
  uploadCourseContent,
  createCourse
} = require('../controllers/academyController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.get('/certifications', getCertifications);

// Protected routes
router.use(auth);

// Course routes
router.post('/courses', authorize('instructor', 'admin'), createCourse);
router.post('/courses/:id/thumbnail', authorize('instructor', 'admin'), uploaders.academy.single('thumbnail'), uploadCourseThumbnail);
router.post('/courses/:id/content', authorize('instructor', 'admin'), uploaders.academy.single('content'), uploadCourseContent);

// Enrollment routes
router.post('/enroll', enrollInCourse);
router.get('/enrollments', getEnrollments);
router.put('/enrollments/:id/progress', updateProgress);

module.exports = router;
