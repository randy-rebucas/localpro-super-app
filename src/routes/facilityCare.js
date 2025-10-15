const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getFacilityCareServices,
  getFacilityCareService,
  createFacilityCareService,
  updateFacilityCareService,
  deleteFacilityCareService,
  uploadFacilityCareImages,
  deleteFacilityCareImage,
  bookFacilityCareService,
  updateBookingStatus,
  addFacilityCareReview,
  getMyFacilityCareServices,
  getMyFacilityCareBookings,
  getNearbyFacilityCareServices
} = require('../controllers/facilityCareController');

const router = express.Router();

// Public routes
router.get('/', getFacilityCareServices);
router.get('/nearby', getNearbyFacilityCareServices);
router.get('/:id', getFacilityCareService);

// Protected routes
router.use(auth);

// Service management routes
router.post('/', authorize('provider', 'admin'), createFacilityCareService);
router.put('/:id', authorize('provider', 'admin'), updateFacilityCareService);
router.delete('/:id', authorize('provider', 'admin'), deleteFacilityCareService);

// Image management routes
router.post('/:id/images', authorize('provider', 'admin'), uploadFacilityCareImages);
router.delete('/:id/images/:imageId', authorize('provider', 'admin'), deleteFacilityCareImage);

// Booking routes
router.post('/:id/book', bookFacilityCareService);
router.put('/:id/bookings/:bookingId/status', updateBookingStatus);

// Review routes
router.post('/:id/reviews', addFacilityCareReview);

// User-specific routes
router.get('/my-services', getMyFacilityCareServices);
router.get('/my-bookings', getMyFacilityCareBookings);

module.exports = router;