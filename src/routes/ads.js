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
  getAdEnumValues
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

// Ad management routes
router.post('/', authorize('advertiser', 'admin'), createAd);
router.put('/:id', authorize('advertiser', 'admin'), updateAd);
router.delete('/:id', authorize('advertiser', 'admin'), deleteAd);

// Image management routes
router.post('/:id/images', authorize('advertiser', 'admin'), uploadAdImages);
router.delete('/:id/images/:imageId', authorize('advertiser', 'admin'), deleteAdImage);

// Ad promotion routes
router.post('/:id/promote', authorize('advertiser', 'admin'), promoteAd);

// Analytics routes
router.get('/:id/analytics', getAdAnalytics);

// User-specific routes
router.get('/my-ads', getMyAds);

// Statistics route (Admin only)
router.get('/statistics', authorize('admin'), getAdStatistics);

module.exports = router;