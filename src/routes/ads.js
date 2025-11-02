const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  uploadAdImages,
  deleteAdImage,
  getMyAds,
  getAdAnalytics,
  trackAdClick,
  getAdCategories,
  getFeaturedAds,
  promoteAd,
  getAdStatistics,
  getAdEnumValues,
  approveAd,
  rejectAd,
  getPendingAds
} = require('../controllers/adsController');

const router = express.Router();

// Public routes
router.get('/', getAds);
router.get('/categories', getAdCategories);
router.get('/enum-values', getAdEnumValues);
router.get('/featured', getFeaturedAds);
router.get('/:id', getAd);
router.post('/:id/click', trackAdClick);

// Protected routes
router.use(auth);

// Ad management routes - All authenticated users can create ads
router.post('/', createAd);
router.put('/:id', updateAd);
router.delete('/:id', deleteAd);

// Image management routes - All authenticated users can manage images for their own ads
router.post('/:id/images', uploadAdImages);
router.delete('/:id/images/:imageId', deleteAdImage);

// Ad promotion routes - All authenticated users can promote their own ads
router.post('/:id/promote', promoteAd);

// Admin moderation routes
router.get('/pending', authorize('admin'), getPendingAds);
router.put('/:id/approve', authorize('admin'), approveAd);
router.put('/:id/reject', authorize('admin'), rejectAd);

// Analytics routes
router.get('/:id/analytics', getAdAnalytics);

// User-specific routes
router.get('/my-ads', getMyAds);

// Statistics route (Admin only) - [ADMIN ONLY]
router.get('/statistics', authorize('admin'), getAdStatistics);

module.exports = router;