const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  createBooking,
  getBookings,
  updateBookingStatus,
  addReview
} = require('../controllers/marketplaceController');

const router = express.Router();

// Public routes
router.get('/services', getServices);
router.get('/services/:id', getService);

// Protected routes
router.use(auth);

// Service routes
router.post('/services', authorize('provider', 'admin'), createService);
router.put('/services/:id', authorize('provider', 'admin'), updateService);
router.delete('/services/:id', authorize('provider', 'admin'), deleteService);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/review', addReview);

module.exports = router;
