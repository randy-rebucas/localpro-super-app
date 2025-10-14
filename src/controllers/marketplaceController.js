const { Service, Booking } = require('../models/Marketplace');
const User = require('../models/User');

// @desc    Get all services
// @route   GET /api/marketplace/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      location,
      minPrice,
      maxPrice,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (location) filter.serviceArea = { $in: [new RegExp(location, 'i')] };
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }
    if (rating) filter['rating.average'] = { $gte: Number(rating) };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single service
// @route   GET /api/marketplace/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience profile.skills');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new service
// @route   POST /api/marketplace/services
// @access  Private (Provider)
const createService = async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      provider: req.user.id
    };

    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update service
// @route   PUT /api/marketplace/services/:id
// @access  Private (Provider)
const updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/marketplace/services/:id
// @access  Private (Provider)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create booking
// @route   POST /api/marketplace/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { serviceId, bookingDate, duration, address, specialInstructions } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Calculate pricing
    let totalAmount = 0;
    if (service.pricing.type === 'hourly') {
      totalAmount = service.pricing.basePrice * duration;
    } else {
      totalAmount = service.pricing.basePrice;
    }

    const bookingData = {
      service: serviceId,
      client: req.user.id,
      provider: service.provider,
      bookingDate: new Date(bookingDate),
      duration,
      address,
      specialInstructions,
      pricing: {
        basePrice: service.pricing.basePrice,
        totalAmount,
        currency: service.pricing.currency
      }
    };

    const booking = await Booking.create(bookingData);

    // Populate the booking with service and user details
    await booking.populate([
      { path: 'service', select: 'title category pricing' },
      { path: 'client', select: 'firstName lastName phoneNumber' },
      { path: 'provider', select: 'firstName lastName phoneNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/marketplace/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;
    const userId = req.user.id;

    let filter = {};
    if (type === 'client') {
      filter.client = userId;
    } else if (type === 'provider') {
      filter.provider = userId;
    } else {
      filter.$or = [{ client: userId }, { provider: userId }];
    }

    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('service', 'title category pricing')
      .populate('client', 'firstName lastName phoneNumber')
      .populate('provider', 'firstName lastName phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/marketplace/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to update this booking
    if (booking.client.toString() !== req.user.id && booking.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add review to booking
// @route   POST /api/marketplace/bookings/:id/review
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the client and booking is completed
    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can add a review'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    if (booking.review) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    booking.review = {
      rating,
      comment,
      createdAt: new Date()
    };

    await booking.save();

    // Update service rating
    const service = await Service.findById(booking.service);
    if (service) {
      const totalRating = service.rating.average * service.rating.count + rating;
      service.rating.count += 1;
      service.rating.average = totalRating / service.rating.count;
      await service.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  createBooking,
  getBookings,
  updateBookingStatus,
  addReview
};
