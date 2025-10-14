const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  enrollInCourse,
  getEnrollments,
  updateProgress,
  getCertifications,
  createCourse
} = require('../controllers/academyController');

const router = express.Router();

// Public routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.get('/certifications', getCertifications);

// Protected routes
router.use(auth);

// Course routes
router.post('/courses', authorize('instructor', 'admin'), createCourse);

// Enrollment routes
router.post('/enroll', enrollInCourse);
router.get('/enrollments', getEnrollments);
router.put('/enrollments/:id/progress', updateProgress);

module.exports = router;
