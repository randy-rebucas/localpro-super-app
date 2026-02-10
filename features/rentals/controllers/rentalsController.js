const rentalsService = require('../services/rentalsService');
const bookingService = require('../services/bookingService');
const reviewService = require('../services/reviewService');
const descriptionService = require('../services/descriptionService');
const statisticsService = require('../services/statisticsService');
const { AppError } = require('../errors/RentalsErrors');
const logger = require('../../../src/config/logger');
const { validateObjectId } = require('../../../src/utils/controllerValidation');

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details && { details: error.details })
    });
  }
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  logger.error(fallbackMessage, { error: error.message, stack: error.stack });
  return res.status(500).json({ success: false, message: 'Server error' });
};

// @desc    Get all rental items
// @route   GET /api/rentals
const getRentalItem = async (req, res) => {
  try {
    const result = await rentalsService.listRentals(req.query);
    return res.status(200).json({ success: true, ...result, data: result.rentals });
  } catch (error) {
    return handleError(res, error, 'Get rentals error');
  }
};

// @desc    Get single rental item
// @route   GET /api/rentals/:id
const getRental = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const rental = await rentalsService.getRentalDetail(req.params.id);
    return res.status(200).json({ success: true, data: rental });
  } catch (error) {
    return handleError(res, error, 'Get rental error');
  }
};

// @desc    Create new rental item
// @route   POST /api/rentals
const createRental = async (req, res) => {
  try {
    const rental = await rentalsService.createRental(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Rental item created successfully', data: rental });
  } catch (error) {
    return handleError(res, error, 'Create rental error');
  }
};

// @desc    Update rental item
// @route   PUT /api/rentals/:id
const updateRental = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const rental = await rentalsService.updateRental(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Rental item updated successfully', data: rental });
  } catch (error) {
    return handleError(res, error, 'Update rental error');
  }
};

// @desc    Delete rental item
// @route   DELETE /api/rentals/:id
const deleteRental = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    await rentalsService.deleteRental(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'Rental item deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Delete rental error');
  }
};

// @desc    Upload rental images
// @route   POST /api/rentals/:id/images
const uploadRentalImages = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const uploads = await rentalsService.uploadImages(req.params.id, req.files, req.user);
    return res.status(200).json({ success: true, message: `${uploads.length} image(s) uploaded successfully`, data: uploads });
  } catch (error) {
    return handleError(res, error, 'Upload rental images error');
  }
};

// @desc    Delete rental image
// @route   DELETE /api/rentals/:id/images/:imageId
const deleteRentalImage = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    await rentalsService.deleteImage(req.params.id, req.params.imageId, req.user);
    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Delete rental image error');
  }
};

// @desc    Book rental item
// @route   POST /api/rentals/:id/book
const bookRental = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const booking = await bookingService.createBooking(req.params.id, req.body, req.user);
    return res.status(201).json({ success: true, message: 'Rental item booked successfully', data: booking });
  } catch (error) {
    return handleError(res, error, 'Book rental error');
  }
};

// @desc    Update booking status
// @route   PUT /api/rentals/:id/bookings/:bookingId/status
const updateBookingStatus = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const booking = await bookingService.updateBookingStatus(req.params.id, req.params.bookingId, req.body.status, req.user);
    return res.status(200).json({ success: true, message: 'Booking status updated successfully', data: booking });
  } catch (error) {
    return handleError(res, error, 'Update booking status error');
  }
};

// @desc    Add rental review
// @route   POST /api/rentals/:id/reviews
const addRentalReview = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid rental ID format' });
    }
    const review = await reviewService.addReview(req.params.id, req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Review added successfully', data: review });
  } catch (error) {
    return handleError(res, error, 'Add rental review error');
  }
};

// @desc    Get user's rental items
// @route   GET /api/rentals/my-rentals
const getMyRentalItem = async (req, res) => {
  try {
    const result = await rentalsService.getMyRentals(req.user.id, req.query);
    return res.status(200).json({ success: true, ...result, data: result.rentals });
  } catch (error) {
    return handleError(res, error, 'Get my rentals error');
  }
};

// @desc    Get user's rental bookings
// @route   GET /api/rentals/my-bookings
const getMyRentalBookings = async (req, res) => {
  try {
    const result = await bookingService.getMyBookings(req.user.id, req.query);
    return res.status(200).json({ success: true, count: result.count, data: result.bookings });
  } catch (error) {
    return handleError(res, error, 'Get my rental bookings error');
  }
};

// @desc    Get nearby rental items
// @route   GET /api/rentals/nearby
const getNearbyRentalItem = async (req, res) => {
  try {
    const result = await rentalsService.getNearbyRentals(req.query);
    return res.status(200).json({ success: true, ...result, data: result.rentals });
  } catch (error) {
    return handleError(res, error, 'Get nearby rentals error');
  }
};

// @desc    Get rental categories
// @route   GET /api/rentals/categories
const getRentalCategories = async (req, res) => {
  try {
    const categories = await rentalsService.getCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return handleError(res, error, 'Get rental categories error');
  }
};

// @desc    Get featured rental items
// @route   GET /api/rentals/featured
const getFeaturedRentalItem = async (req, res) => {
  try {
    const rentals = await rentalsService.getFeaturedRentals(req.query.limit);
    return res.status(200).json({ success: true, count: rentals.length, data: rentals });
  } catch (error) {
    return handleError(res, error, 'Get featured rentals error');
  }
};

// @desc    Get rental statistics
// @route   GET /api/rentals/statistics
const getRentalStatistics = async (req, res) => {
  try {
    const stats = await statisticsService.getStatistics();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return handleError(res, error, 'Get rental statistics error');
  }
};

// @desc    Generate rental description using AI
// @route   POST /api/rentals/generate-description
const generateRentalDescription = async (req, res) => {
  try {
    const { result, usage, debug } = await descriptionService.generateDescription(req.body, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Rental description generated successfully',
      data: {
        ...result,
        usage,
        debug: process.env.NODE_ENV === 'development' ? debug : undefined
      }
    });
  } catch (error) {
    return handleError(res, error, 'Generate rental description error');
  }
};

module.exports = {
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
  getRentalStatistics,
  generateRentalDescription
};
