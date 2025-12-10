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
  favoriteCourse,
  unfavoriteCourse,
  getMyFavoriteCourses,
  getCourseCategories,
  getFeaturedCourses,
  getCourseStatistics,
  // New handlers
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  listEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment
} = require('../controllers/academyController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.get('/categories', listCategories); // replaced with model-backed categories
router.get('/featured', getFeaturedCourses);
router.get('/certifications', listCertifications);

// Protected routes
router.use(auth);

// Course management routes
router.post('/courses', authorize('instructor', 'admin'), createCourse);
router.put('/courses/:id', authorize('instructor', 'admin'), updateCourse);
router.delete('/courses/:id', authorize('instructor', 'admin'), deleteCourse);

// Course content routes
// Accept any file field to tolerate varying client field names
router.post('/courses/:id/thumbnail', authorize('instructor', 'admin'), uploaders.academy.any(), uploadCourseThumbnail);
router.post('/courses/:id/videos', authorize('instructor', 'admin'), uploaders.academyVideos.single('video'), uploadCourseVideo);
router.delete('/courses/:id/videos/:videoId', authorize('instructor', 'admin'), deleteCourseVideo);

// Enrollment routes
router.post('/courses/:id/enroll', enrollInCourse);
router.put('/courses/:id/progress', updateCourseProgress);

// Review routes
router.post('/courses/:id/reviews', addCourseReview);
router.post('/courses/:id/favorite', favoriteCourse);
router.delete('/courses/:id/favorite', unfavoriteCourse);

// User-specific routes
router.get('/my-courses', getMyCourses);
router.get('/my-created-courses', getMyCreatedCourses);
router.get('/my-favorite-courses', getMyFavoriteCourses);

// Statistics route (Admin only) - [ADMIN ONLY]
router.get('/statistics', authorize('admin'), getCourseStatistics);

// Category management (Admin/Instructor)
router.post('/categories', authorize('admin', 'instructor'), createCategory);
router.put('/categories/:id', authorize('admin', 'instructor'), updateCategory);
router.delete('/categories/:id', authorize('admin', 'instructor'), deleteCategory);

// Certification management (Admin/Instructor)
router.post('/certifications', authorize('admin', 'instructor'), createCertification);
router.put('/certifications/:id', authorize('admin', 'instructor'), updateCertification);
router.delete('/certifications/:id', authorize('admin', 'instructor'), deleteCertification);

// Enrollment management (Admin/Instructor)
router.get('/enrollments', authorize('admin', 'instructor'), listEnrollments);
router.put('/enrollments/:id/status', authorize('admin', 'instructor'), updateEnrollmentStatus);
router.delete('/enrollments/:id', authorize('admin'), deleteEnrollment);

module.exports = router;
