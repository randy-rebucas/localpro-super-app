const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/academyController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.get('/categories', getCourseCategories);
router.get('/featured', getFeaturedCourses);

// Protected routes
router.use(auth);

// Course management routes
router.post('/courses', authorize('instructor', 'admin'), createCourse);
router.put('/courses/:id', authorize('instructor', 'admin'), updateCourse);
router.delete('/courses/:id', authorize('instructor', 'admin'), deleteCourse);

// Course content routes
router.post('/courses/:id/thumbnail', authorize('instructor', 'admin'), uploaders.academy.single('thumbnail'), uploadCourseThumbnail);
router.post('/courses/:id/videos', authorize('instructor', 'admin'), uploaders.academy.single('video'), uploadCourseVideo);
router.delete('/courses/:id/videos/:videoId', authorize('instructor', 'admin'), deleteCourseVideo);

// Enrollment routes
router.post('/courses/:id/enroll', enrollInCourse);
router.put('/courses/:id/progress', updateCourseProgress);

// Review routes
router.post('/courses/:id/reviews', addCourseReview);

// User-specific routes
router.get('/my-courses', getMyCourses);
router.get('/my-created-courses', getMyCreatedCourses);

// Statistics route (Admin only) - [ADMIN ONLY]
router.get('/statistics', authorize('admin'), getCourseStatistics);

module.exports = router;
