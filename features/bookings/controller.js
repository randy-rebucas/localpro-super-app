// Bookings/Marketplace feature controller (fully migrated)
const { Service, Booking } = require('../../models/Marketplace');
const ServiceCategory = require('../../models/ServiceCategory');
const User = require('../../models/User');
const CloudinaryService = require('../../services/cloudinaryService');
const GoogleMapsService = require('../../services/googleMapsService');
const PayPalService = require('../../services/paypalService');
const NotificationService = require('../../services/notificationService');
const mongoose = require('mongoose');
const { ReadPreference } = require('mongodb');
const logger = require('../../config/logger');
const {
  sendPaginated,
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendServerError,
  createPagination
} = require('../../utils/responseHelper');
const {
  validatePagination,
  validateObjectId
} = require('../../utils/controllerValidation');
const { bookingSchema } = require('../../utils/validation');

// @desc    Get all services
const getServices = async (req, res) => {
  try {
    const {
      search,
      category,
      subcategory,
      location,
      minPrice,
      maxPrice,
      rating,
      serviceType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter object
    const filter = { isActive: true };

    // Text search (only on string fields, not ObjectId references like category)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { features: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Location filter - using geospatial query if coordinates provided
    if (location) {
      if (typeof location === 'string' && location.includes(',')) {
        const coords = location.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          const [lat, lng] = coords;
          const maxDistance = 100000;
          filter['serviceArea.coordinates'] = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: maxDistance
            }
          };
        }
      } else {
        logger.debug('Text-based location search not yet implemented', { location });
      }
    }

    // Price filters
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      filter['rating.average'] = { $gte: Number(rating) };
    }

    // Service type filter
    if (serviceType) {
      filter.serviceType = serviceType;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.businessName profile.rating')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, services, pagination, 'Services retrieved successfully');
  } catch (error) {
    logger.error('Get services error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve services', 'SERVICES_RETRIEVAL_ERROR');
  }
};

// @desc    Create booking
const createBooking = async (req, res) => {
  const { serviceId, userId, startDate, endDate, guestCount } = req.body;

  try {
    const service = await Service.findById(serviceId);
    const user = await User.findById(userId);

    if (!service || !user) {
      return res.status(400).send('Invalid service or user');
    }

    const booking = new Booking({
      serviceId,
      userId,
      startDate,
      endDate,
      guestCount
    });

    await booking.save();

    res.send({
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getServices,
  createBooking
};
