const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getRentalItem,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  uploadRentalImages,
  deleteRentalImage,
  bookRental,
  updateBookingStatus,
  addRentalReview,
  getMyRentalItem,
  getMyRentalBookings,
  getNearbyRentalItem,
  getRentalCategories,
  getFeaturedRentalItem,
  getRentalStatistics
} = require('../controllers/rentalsController');

const router = express.Router();

// Public routes
router.get('/', getRentalItem);
router.get('/items', getRentalItem); // Alias for /api/rentals/items
router.get('/items/:id', getRental); // Alias for /api/rentals/items/:id
router.get('/categories', getRentalCategories);
router.get('/featured', getFeaturedRentalItem);
router.get('/nearby', getNearbyRentalItem);
router.get('/:id', getRental);

// Protected routes
router.use(auth);

// Rental management routes
router.post('/', authorize('provider', 'admin'), createRental);
router.post('/items', authorize('provider', 'admin'), createRental); // Alias for /api/rentals/items
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
router.get('/my-rentals', getMyRentalItem);
router.get('/my-bookings', getMyRentalBookings);

// Statistics route (Admin only)
router.get('/statistics', authorize('admin'), getRentalStatistics);

module.exports = router;