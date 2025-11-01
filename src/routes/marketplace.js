const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  validateObjectIdParam, 
  validatePaginationParams, 
  validateSearchParams
} = require('../middleware/routeValidation');
const {
  getServices,
  getService,
  getNearbyServices,
  getServiceCategories,
  getCategoryDetails,
  createService,
  updateService,
  deleteService,
  uploadServiceImages,
  createBooking,
  getBookings,
  updateBookingStatus,
  uploadBookingPhotos,
  addReview,
  approvePayPalBooking,
  getPayPalOrderDetails,
  getMyServices,
  getMyBookings,
  getProvidersForService,
  getProviderDetails
} = require('../controllers/marketplaceController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/services', 
  validatePaginationParams,
  validateSearchParams,
  getServices
);
// Category routes - specific routes must come before parameterized routes
router.get('/services/categories', getServiceCategories);
router.get('/services/categories/:category', getCategoryDetails);
router.get('/services/nearby', 
  validateSearchParams,
  getNearbyServices
);
router.get('/services/:id', 
  validateObjectIdParam('id'),
  getService
);
router.get('/services/:id/providers',
  validateObjectIdParam('id'),
  validatePaginationParams,
  getProvidersForService
);

// Provider details route
router.get('/providers/:id',
  validateObjectIdParam('id'),
  getProviderDetails
);

// Protected routes
router.use(auth);

// My services route
router.get('/my-services', getMyServices);

// My bookings route
router.get('/my-bookings', getMyBookings);

// Service routes
router.post('/services', authorize('provider', 'admin'), createService);
router.put('/services/:id', authorize('provider', 'admin'), updateService);
router.delete('/services/:id', authorize('provider', 'admin'), deleteService);
router.post('/services/:id/images', authorize('provider', 'admin'), uploaders.marketplace.array('images', 5), uploadServiceImages);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/photos', uploaders.marketplace.array('photos', 5), uploadBookingPhotos);
router.post('/bookings/:id/review', uploaders.marketplace.array('photos', 3), addReview);

// PayPal routes
router.post('/bookings/paypal/approve', approvePayPalBooking);
router.get('/bookings/paypal/order/:orderId', getPayPalOrderDetails);

module.exports = router;
