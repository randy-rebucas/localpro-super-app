const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
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

/**
 * @swagger
 * /api/academy/courses:
 *   get:
 *     summary: Get list of courses
 *     tags: [Academy]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
 */
// Public routes
router.get('/courses', getCourses);

/**
 * @swagger
 * /api/academy/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Academy]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/courses/:id', getCourse);

/**
 * @swagger
 * /api/academy/categories:
 *   get:
 *     summary: Get course categories
 *     tags: [Academy]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', listCategories); // replaced with model-backed categories

/**
 * @swagger
 * /api/academy/featured:
 *   get:
 *     summary: Get featured courses
 *     tags: [Academy]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured courses
 */
router.get('/featured', getFeaturedCourses);

/**
 * @swagger
 * /api/academy/certifications:
 *   get:
 *     summary: Get certifications
 *     tags: [Academy]
 *     security: []
 *     responses:
 *       200:
 *         description: List of certifications
 */
router.get('/certifications', listCertifications);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/academy/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Course created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Course management routes
router.post('/courses', authorize('instructor', 'admin'), createCourse);

/**
 * @swagger
 * /api/academy/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Course updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete course
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Course deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/courses/:id', authorize('instructor', 'admin'), updateCourse);
/**
 * @swagger
 * /api/academy/courses/{id}:
 *   patch:
 *     summary: Partially update course
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *               pricing:
 *                 type: object
 *               enrollment:
 *                 type: object
 *     responses:
 *       200:
 *         description: Course partially updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/courses/:id', authorize('instructor', 'admin'), patchCourse);
router.delete('/courses/:id', authorize('instructor', 'admin'), deleteCourse);

// Course content routes
// Accept any file field to tolerate varying client field names
router.post('/courses/:id/thumbnail', authorize('instructor', 'admin'), uploaders.academy.any(), uploadCourseThumbnail);
router.post('/courses/:id/videos', authorize('instructor', 'admin'), uploaders.academyVideos.single('video'), uploadCourseVideo);
router.delete('/courses/:id/videos/:videoId', authorize('instructor', 'admin'), deleteCourseVideo);

/**
 * @swagger
 * /api/academy/courses/{id}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       201:
 *         description: Enrollment successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Enrollment routes
router.post('/courses/:id/enroll', authorize('client'), enrollInCourse);

/**
 * @swagger
 * /api/academy/courses/{id}/progress:
 *   put:
 *     summary: Update course progress
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.put('/courses/:id/progress', authorize('client'), updateCourseProgress);

// Review routes
router.post('/courses/:id/reviews', authorize('client'), addCourseReview);
router.post('/courses/:id/favorite', authorize('client'), favoriteCourse);
router.delete('/courses/:id/favorite', authorize('client'), unfavoriteCourse);

// User-specific routes
router.get('/my-courses', authorize('client'), getMyCourses);
router.get('/my-created-courses', authorize('instructor', 'admin'), getMyCreatedCourses);
router.get('/my-favorite-courses', authorize('client'), getMyFavoriteCourses);

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
