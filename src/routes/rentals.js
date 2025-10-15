const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  uploadRentalImages,
  deleteRentalImage,
  bookRental,
  updateBookingStatus,
  addRentalReview,
  getMyRentals,
  getMyRentalBookings,
  getNearbyRentals,
  getRentalCategories,
  getFeaturedRentals,
  getRentalStatistics
} = require('../controllers/rentalsController');

const router = express.Router();

// Public routes
router.get('/', getRentals);
router.get('/categories', getRentalCategories);
router.get('/featured', getFeaturedRentals);
router.get('/nearby', getNearbyRentals);
router.get('/:id', getRental);

// Protected routes
router.use(auth);

// Rental management routes
router.post('/', authorize('provider', 'admin'), createRental);
router.put('/:id', authorize('provider', 'admin'), updateRental);
router.delete('/:id', authorize('provider', 'admin'), deleteRental);

// Image management routes
router.post('/:id/images', authorize('provider', 'admin'), uploadRentalImages);
router.delete('/:id/images/:imageId', authorize('provider', 'admin'), deleteRentalImage);

// Booking routes
router.post('/:id/book', bookRental);
router.put('/:id/bookings/:bookingId/status', updateBookingStatus);

// Review routes
router.post('/:id/reviews', addRentalReview);

// User-specific routes
router.get('/my-rentals', getMyRentals);
router.get('/my-bookings', getMyRentalBookings);

// Statistics route (Admin only)
router.get('/statistics', authorize('admin'), getRentalStatistics);

module.exports = router;