const { Service, Booking } = require('../models/Marketplace');
const User = require('../models/User');
const Provider = require('../models/Provider');
const mongoose = require('mongoose');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const GoogleMapsService = require('../services/googleMapsService');
const PayPalService = require('../services/paypalService');
const cacheService = require('../services/cacheService');
const logger = require('../config/logger');
const { 
  sendPaginated, 
  sendServerError,
  createPagination 
} = require('../utils/responseHelper');

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
      sortOrder = 'desc',
      groupByCategory
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (location) {
      // Enhanced location filtering with Google Maps
      if (req.query.coordinates) {
        // If coordinates are provided, find services within radius
        // For now, use text-based filtering, but this could be enhanced with geospatial queries
        filter.serviceArea = { $in: [new RegExp(location, 'i')] };
      } else {
        filter.serviceArea = { $in: [new RegExp(location, 'i')] };
      }
    }
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }
    if (rating) filter['rating.average'] = { $gte: Number(rating) };

    // If groupByCategory is enabled, return services grouped by category
    if (groupByCategory === 'true' || groupByCategory === true) {
      const services = await Service.find(filter)
        .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience')
        .select('-reviews -bookings -metadata -featured -promoted')
        .lean();

      // Group services by category
      const groupedServices = services.reduce((acc, service) => {
        const cat = service.category || 'other';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(service);
        return acc;
      }, {});

      // Convert to array format with category names
      const groupedArray = Object.keys(groupedServices).map(categoryName => ({
        category: categoryName,
        count: groupedServices[categoryName].length,
        services: groupedServices[categoryName]
      }));

      return res.status(200).json({
        success: true,
        message: 'Services retrieved and grouped by category successfully',
        data: groupedArray,
        total: services.length,
        totalCategories: groupedArray.length
      });
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Generate cache key based on query parameters
    const cacheKey = cacheService.servicesKey({ filter, sort, skip, limit });

    // Try to get from cache first
    let cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      logger.info('Cache hit for services query', { cacheKey, page, limit });
      return sendPaginated(res, cachedResult.services, cachedResult.pagination, 'Services retrieved successfully (from cache)');
    }

    // Cache miss - fetch from database
    logger.info('Cache miss for services query', { cacheKey, page, limit });
    
    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience')
      .select('-reviews -bookings -metadata -featured -promoted')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() for better performance on read-only operations

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    // Cache the result for 5 minutes (300 seconds)
    const resultToCache = { services, pagination };
    await cacheService.set(cacheKey, resultToCache, 300);

    return sendPaginated(res, services, pagination, 'Services retrieved successfully');
  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve services', 'SERVICES_RETRIEVAL_ERROR');
  }
};

// @desc    Get single service
// @route   GET /api/marketplace/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

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
    const { serviceId, bookingDate, duration, address, specialInstructions, paymentMethod } = req.body;

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

    // Validate service area if address coordinates are provided
    if (address.coordinates) {
      const serviceAreaValidation = await GoogleMapsService.validateServiceArea(
        address.coordinates,
        service.serviceArea
      );

      if (!serviceAreaValidation.success || !serviceAreaValidation.isInServiceArea) {
        return res.status(400).json({
          success: false,
          message: 'Service is not available in this location',
          locationInfo: serviceAreaValidation.locationInfo,
          availableAreas: service.serviceArea
        });
      }
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
      },
      payment: {
        method: paymentMethod || 'cash',
        status: paymentMethod === 'paypal' ? 'pending' : 'pending'
      }
    };

    const booking = await Booking.create(bookingData);

    // Handle PayPal payment if selected
    if (paymentMethod === 'paypal') {
      try {
        // Get user details for PayPal
        const user = await User.findById(req.user.id).select('firstName lastName email');
        
        // Create PayPal order
        const orderData = {
          amount: totalAmount,
          currency: service.pricing.currency,
          description: `Service booking: ${service.title}`,
          referenceId: booking._id.toString(),
          items: [{
            name: service.title,
            unit_amount: {
              currency_code: service.pricing.currency,
              value: totalAmount.toFixed(2)
            },
            quantity: '1'
          }],
          shipping: address ? {
            name: `${user.firstName} ${user.lastName}`,
            address_line_1: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.zipCode,
            country_code: address.country || 'US'
          } : undefined
        };

        const paypalOrderResult = await PayPalService.createOrder(orderData);
        
        if (!paypalOrderResult.success) {
          throw new Error('Failed to create PayPal order');
        }

        // Update booking with PayPal order ID
        booking.payment.paypalOrderId = paypalOrderResult.data.id;
        await booking.save();

        // Populate the booking with service and user details
        await booking.populate([
          { path: 'service', select: 'title category pricing' },
          { path: 'client', select: 'firstName lastName phoneNumber email' },
          { path: 'provider', select: 'firstName lastName phoneNumber email' }
        ]);

        res.status(201).json({
          success: true,
          message: 'Booking created successfully with PayPal payment',
          data: {
            booking,
            paypalApprovalUrl: paypalOrderResult.data.links.find(link => link.rel === 'approve')?.href
          }
        });
        return;
      } catch (paypalError) {
        console.error('PayPal booking error:', paypalError);
        // Fall back to regular booking creation
        booking.payment.method = 'cash';
        await booking.save();
      }
    }

    // Populate the booking with service and user details
    await booking.populate([
      { path: 'service', select: 'title category pricing' },
      { path: 'client', select: 'firstName lastName phoneNumber email' },
      { path: 'provider', select: 'firstName lastName phoneNumber email' }
    ]);

    // Send booking confirmation email to client if email is available
    if (booking.client.email) {
      try {
        await EmailService.sendBookingConfirmation(booking.client.email, booking);
        logger.info(`Booking confirmation email sent to: ${booking.client.email}`);
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the booking if email fails
      }
    }

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

// @desc    Upload service images
// @route   POST /api/marketplace/services/:id/images
// @access  Private (Provider)
const uploadServiceImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);

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
        message: 'Not authorized to upload images for this service'
      });
    }

    // Upload multiple files to Cloudinary
    const uploadResult = await CloudinaryService.uploadMultipleFiles(
      req.files, 
      'localpro/marketplace'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload service images',
        error: uploadResult.error
      });
    }

    // Add new images to service
    const newImages = uploadResult.data.map(file => ({
      url: file.secure_url,
      publicId: file.public_id,
      thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail'),
      alt: `Service image for ${service.title}`
    }));

    service.images.push(...newImages);
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service images uploaded successfully',
      data: newImages
    });
  } catch (error) {
    console.error('Upload service images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload booking photos
// @route   POST /api/marketplace/bookings/:id/photos
// @access  Private
const uploadBookingPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { type } = req.body; // 'before' or 'after'
    const bookingId = req.params.id;

    if (!type || !['before', 'after'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "before" or "after"'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized
    if (booking.client.toString() !== req.user.id && booking.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload photos for this booking'
      });
    }

    // Upload multiple files to Cloudinary
    const uploadResult = await CloudinaryService.uploadMultipleFiles(
      req.files, 
      `localpro/marketplace/bookings/${bookingId}`
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload booking photos',
        error: uploadResult.error
      });
    }

    // Add photos to appropriate array
    const newPhotos = uploadResult.data.map(file => ({
      url: file.secure_url,
      publicId: file.public_id,
      thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail')
    }));

    if (type === 'before') {
      booking.beforePhotos.push(...newPhotos);
    } else {
      booking.afterPhotos.push(...newPhotos);
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `${type} photos uploaded successfully`,
      data: newPhotos
    });
  } catch (error) {
    console.error('Upload booking photos error:', error);
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
    const { rating, comment, categories } = req.body;
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

    // Handle review photos if uploaded
    let reviewPhotos = [];
    if (req.files && req.files.length > 0) {
      const uploadResult = await CloudinaryService.uploadMultipleFiles(
        req.files, 
        `localpro/marketplace/reviews/${bookingId}`
      );

      if (uploadResult.success) {
        reviewPhotos = uploadResult.data.map(file => ({
          url: file.secure_url,
          publicId: file.public_id,
          thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail')
        }));
      }
    }

    booking.review = {
      rating,
      comment,
      categories,
      photos: reviewPhotos,
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

// @desc    Get services with distance calculation
// @route   GET /api/marketplace/services/nearby
// @access  Public
const getNearbyServices = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50000, // Default 50km radius
      category,
      subcategory,
      minPrice,
      maxPrice,
      rating,
      page = 1,
      limit = 10
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }
    if (rating) filter['rating.average'] = { $gte: Number(rating) };

    const skip = (page - 1) * limit;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate distances for each service
    const servicesWithDistance = await Promise.all(
      services.map(async (service) => {
        const serviceData = service.toObject();
        
        // Get provider's location (assuming they have coordinates in their profile)
        const provider = await User.findById(service.provider._id).select('profile.address.coordinates');
        
        if (provider?.profile?.address?.coordinates) {
          const distanceResult = await GoogleMapsService.calculateDistance(
            coordinates,
            provider.profile.address.coordinates
          );

          if (distanceResult.success) {
            serviceData.distance = distanceResult.distance;
            serviceData.duration = distanceResult.duration;
            serviceData.isWithinRange = distanceResult.distance.value <= parseInt(radius);
          }
        }

        return serviceData;
      })
    );

    // Filter services within radius
    const nearbyServices = servicesWithDistance.filter(service => 
      service.isWithinRange !== false
    );

    const total = nearbyServices.length;

    res.status(200).json({
      success: true,
      count: nearbyServices.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: nearbyServices,
      searchLocation: coordinates,
      searchRadius: parseInt(radius)
    });
  } catch (error) {
    console.error('Get nearby services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle PayPal booking payment approval
// @route   POST /api/marketplace/bookings/paypal/approve
// @access  Private
const approvePayPalBooking = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Capture the PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);
    
    if (!captureResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to capture PayPal payment'
      });
    }

    // Find the booking
    const booking = await Booking.findOne({
      client: userId,
      'payment.paypalOrderId': orderId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking payment status
    booking.payment.status = 'paid';
    booking.payment.paypalTransactionId = captureResult.data.purchase_units[0].payments.captures[0].id;
    booking.payment.paidAt = new Date();
    await booking.save();

    // Send booking confirmation email
    await booking.populate([
      { path: 'service', select: 'title category pricing' },
      { path: 'client', select: 'firstName lastName phoneNumber email' },
      { path: 'provider', select: 'firstName lastName phoneNumber email' }
    ]);

    if (booking.client.email) {
      try {
        await EmailService.sendBookingConfirmation(booking.client.email, booking);
        logger.info(`Booking confirmation email sent to: ${booking.client.email}`);
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'PayPal payment approved successfully',
      data: booking
    });
  } catch (error) {
    console.error('Approve PayPal booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get PayPal order details
// @route   GET /api/marketplace/bookings/paypal/order/:orderId
// @access  Private
const getPayPalOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify the order belongs to the user
    const booking = await Booking.findOne({
      client: userId,
      'payment.paypalOrderId': orderId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get order details from PayPal
    const orderResult = await PayPalService.getOrder(orderId);
    
    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get PayPal order details'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        booking,
        paypalOrder: orderResult.data
      }
    });
  } catch (error) {
    console.error('Get PayPal order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's services (my-services)
// @route   GET /api/marketplace/my-services
// @access  Private
const getMyServices = async (req, res) => {
  try {
    const {
      category,
      status = 'all', // all, active, inactive
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.id;

    // Build filter object
    const filter = { provider: userId };

    if (category) filter.category = category;
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    // If status is 'all', don't add isActive filter

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    // Get additional statistics for the user
    const stats = await Service.aggregate([
      { $match: { provider: userId } },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          activeServices: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveServices: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          },
          averageRating: { $avg: '$rating.average' },
          totalBookings: { $sum: '$rating.count' }
        }
      }
    ]);

    const userStats = stats.length > 0 ? stats[0] : {
      totalServices: 0,
      activeServices: 0,
      inactiveServices: 0,
      averageRating: 0,
      totalBookings: 0
    };

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        stats: userStats
      }
    });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's bookings (my-bookings)
// @route   GET /api/marketplace/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const {
      status,
      type = 'all', // all, client, provider
      paymentStatus,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    const userId = req.user.id;

    // Build filter object
    const filter = {};

    if (type === 'client') {
      filter.client = userId;
    } else if (type === 'provider') {
      filter.provider = userId;
    } else {
      // Get bookings where user is either client or provider
      filter.$or = [{ client: userId }, { provider: userId }];
    }

    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    
    if (dateFrom || dateTo) {
      filter.bookingDate = {};
      if (dateFrom) filter.bookingDate.$gte = new Date(dateFrom);
      if (dateTo) filter.bookingDate.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('service', 'title category subcategory pricing images')
      .populate('client', 'firstName lastName phoneNumber email profile.avatar')
      .populate('provider', 'firstName lastName phoneNumber email profile.avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    // Get additional statistics for the user
    const stats = await Booking.aggregate([
      { $match: { $or: [{ client: userId }, { provider: userId }] } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          clientBookings: {
            $sum: { $cond: [{ $eq: ['$client', userId] }, 1, 0] }
          },
          providerBookings: {
            $sum: { $cond: [{ $eq: ['$provider', userId] }, 1, 0] }
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$provider', userId] },
                '$pricing.totalAmount',
                0
              ]
            }
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$client', userId] },
                '$pricing.totalAmount',
                0
              ]
            }
          },
          averageRating: { $avg: '$review.rating' }
        }
      }
    ]);

    const userStats = stats.length > 0 ? stats[0] : {
      totalBookings: 0,
      clientBookings: 0,
      providerBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalEarnings: 0,
      totalSpent: 0,
      averageRating: 0
    };

    // Add user role information to each booking
    const bookingsWithRole = bookings.map(booking => {
      const bookingObj = booking.toObject();
      bookingObj.userRole = booking.client.toString() === userId ? 'client' : 'provider';
      return bookingObj;
    });

    res.status(200).json({
      success: true,
      data: {
        bookings: bookingsWithRole,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        stats: userStats
      }
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get service categories with details and statistics
// @route   GET /api/marketplace/services/categories
// @access  Public
const getServiceCategories = async (req, res) => {
  try {
    const { includeStats = 'true' } = req.query;

    // Service category definitions
    const categoryDefinitions = {
      cleaning: {
        name: 'Cleaning Services',
        description: 'Professional cleaning services for homes and businesses',
        icon: '🧹',
        subcategories: ['residential_cleaning', 'commercial_cleaning', 'deep_cleaning', 'carpet_cleaning', 'window_cleaning', 'power_washing', 'post_construction_cleaning']
      },
      plumbing: {
        name: 'Plumbing Services',
        description: 'Plumbing repair, installation, and maintenance',
        icon: '🔧',
        subcategories: ['pipe_repair', 'installation', 'leak_repair', 'drain_cleaning', 'water_heater', 'sewer_services', 'emergency_plumbing']
      },
      electrical: {
        name: 'Electrical Services',
        description: 'Electrical work, repairs, and installations',
        icon: '⚡',
        subcategories: ['wiring', 'panel_upgrade', 'outlet_installation', 'lighting', 'electrical_repair', 'safety_inspection']
      },
      moving: {
        name: 'Moving Services',
        description: 'Residential and commercial moving services',
        icon: '📦',
        subcategories: ['local_moving', 'long_distance', 'packing', 'unpacking', 'storage', 'furniture_assembly']
      },
      landscaping: {
        name: 'Landscaping Services',
        description: 'Outdoor landscaping and yard maintenance',
        icon: '🌳',
        subcategories: ['lawn_care', 'garden_design', 'tree_services', 'irrigation', 'hardscaping', 'mulching']
      },
      painting: {
        name: 'Painting Services',
        description: 'Interior and exterior painting',
        icon: '🎨',
        subcategories: ['interior_painting', 'exterior_painting', 'cabinet_painting', 'deck_staining', 'wallpaper', 'texture_painting']
      },
      carpentry: {
        name: 'Carpentry Services',
        description: 'Woodwork and carpentry services',
        icon: '🪵',
        subcategories: ['furniture_repair', 'custom_build', 'cabinet_installation', 'trim_work', 'deck_building', 'shelving']
      },
      flooring: {
        name: 'Flooring Services',
        description: 'Floor installation and repair',
        icon: '🏠',
        subcategories: ['hardwood', 'tile', 'carpet', 'laminate', 'vinyl', 'floor_repair', 'refinishing']
      },
      roofing: {
        name: 'Roofing Services',
        description: 'Roof repair, installation, and maintenance',
        icon: '🏡',
        subcategories: ['roof_repair', 'roof_replacement', 'gutter_repair', 'roof_inspection', 'leak_repair', 'solar_installation']
      },
      hvac: {
        name: 'HVAC Services',
        description: 'Heating, ventilation, and air conditioning',
        icon: '❄️',
        subcategories: ['installation', 'repair', 'maintenance', 'duct_cleaning', 'thermostat_installation', 'air_quality']
      },
      appliance_repair: {
        name: 'Appliance Repair',
        description: 'Home appliance repair and maintenance',
        icon: '🔌',
        subcategories: ['refrigerator', 'washer_dryer', 'dishwasher', 'oven_range', 'microwave', 'garbage_disposal']
      },
      locksmith: {
        name: 'Locksmith Services',
        description: 'Lock installation, repair, and emergency services',
        icon: '🔐',
        subcategories: ['lock_installation', 'key_duplication', 'lockout_service', 'safe_services', 'access_control']
      },
      handyman: {
        name: 'Handyman Services',
        description: 'General repair and maintenance services',
        icon: '🔨',
        subcategories: ['general_repair', 'assembly', 'mounting', 'caulking', 'drywall_repair', 'fence_repair']
      },
      home_security: {
        name: 'Home Security',
        description: 'Security system installation and monitoring',
        icon: '🚨',
        subcategories: ['alarm_installation', 'camera_installation', 'smart_locks', 'motion_sensors', 'security_consultation']
      },
      pool_maintenance: {
        name: 'Pool Maintenance',
        description: 'Swimming pool cleaning and maintenance',
        icon: '🏊',
        subcategories: ['cleaning', 'chemical_balance', 'equipment_repair', 'winterization', 'pool_repair', 'opening_closing']
      },
      pest_control: {
        name: 'Pest Control',
        description: 'Pest elimination and prevention',
        icon: '🐛',
        subcategories: ['general_pest', 'termite_control', 'rodent_control', 'bed_bug', 'wildlife_removal', 'preventive_treatment']
      },
      carpet_cleaning: {
        name: 'Carpet Cleaning',
        description: 'Professional carpet and upholstery cleaning',
        icon: '🧼',
        subcategories: ['steam_cleaning', 'dry_cleaning', 'stain_removal', 'pet_odor', 'upholstery', 'area_rugs']
      },
      window_cleaning: {
        name: 'Window Cleaning',
        description: 'Window and glass cleaning services',
        icon: '🪟',
        subcategories: ['residential', 'commercial', 'interior_exterior', 'screen_cleaning', 'pressure_washing', 'storefront']
      },
      gutter_cleaning: {
        name: 'Gutter Cleaning',
        description: 'Gutter cleaning and maintenance',
        icon: '🌧️',
        subcategories: ['cleaning', 'repair', 'installation', 'leaf_removal', 'downspout_cleaning', 'gutter_guards']
      },
      power_washing: {
        name: 'Power Washing',
        description: 'Exterior surface pressure washing',
        icon: '💦',
        subcategories: ['driveway', 'siding', 'deck_patio', 'fence', 'roof', 'commercial']
      },
      snow_removal: {
        name: 'Snow Removal',
        description: 'Snow clearing and removal services',
        icon: '❄️',
        subcategories: ['driveway', 'sidewalk', 'commercial', 'roof', 'snow_plowing', 'ice_removal']
      },
      other: {
        name: 'Other Services',
        description: 'Other specialized services',
        icon: '📋',
        subcategories: []
      }
    };

    // If stats are not needed, return just category definitions
    if (includeStats !== 'true' && includeStats !== true) {
      return res.status(200).json({
        success: true,
        message: 'Service categories retrieved successfully',
        data: Object.keys(categoryDefinitions).map(key => ({
          key,
          ...categoryDefinitions[key]
        }))
      });
    }

    // Get statistics for each category
    const categoriesWithStats = await Promise.all(
      Object.keys(categoryDefinitions).map(async (categoryKey) => {
        const categoryFilter = { category: categoryKey, isActive: true };
        
        // Get service count
        const serviceCount = await Service.countDocuments(categoryFilter);

        // Get average pricing using aggregation
        const pricingStats = await Service.aggregate([
          { $match: categoryFilter },
          {
            $group: {
              _id: null,
              avgPrice: { $avg: '$pricing.basePrice' },
              minPrice: { $min: '$pricing.basePrice' },
              maxPrice: { $max: '$pricing.basePrice' },
              totalServices: { $sum: 1 }
            }
          }
        ]);

        // Get subcategory distribution
        const subcategoryStats = await Service.aggregate([
          { $match: categoryFilter },
          {
            $group: {
              _id: '$subcategory',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);

        // Get average rating
        const ratingStats = await Service.aggregate([
          { $match: { ...categoryFilter, 'rating.average': { $exists: true, $ne: null } } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating.average' },
              totalRatings: { $sum: '$rating.count' }
            }
          }
        ]);

        return {
          key: categoryKey,
          ...categoryDefinitions[categoryKey],
          statistics: {
            totalServices: serviceCount,
            pricing: pricingStats[0] ? {
              average: Math.round(pricingStats[0].avgPrice || 0),
              min: pricingStats[0].minPrice || 0,
              max: pricingStats[0].maxPrice || 0
            } : null,
            rating: ratingStats[0] ? {
              average: parseFloat((ratingStats[0].avgRating || 0).toFixed(2)),
              totalRatings: ratingStats[0].totalRatings || 0
            } : null,
            popularSubcategories: subcategoryStats.map(item => ({
              subcategory: item._id,
              count: item.count
            }))
          }
        };
      })
    );

    // Sort by total services (most popular first)
    categoriesWithStats.sort((a, b) => 
      (b.statistics.totalServices || 0) - (a.statistics.totalServices || 0)
    );

    // Calculate overall statistics
    const totalServices = await Service.countDocuments({ isActive: true });
    const totalProviders = await Provider.countDocuments({ status: 'active' });

    logger.info('Service categories retrieved', {
      totalCategories: categoriesWithStats.length,
      totalServices
    });

    return res.status(200).json({
      success: true,
      message: 'Service categories retrieved successfully',
      data: categoriesWithStats,
      summary: {
        totalCategories: categoriesWithStats.length,
        totalServices,
        totalProviders,
        categoriesWithServices: categoriesWithStats.filter(cat => cat.statistics.totalServices > 0).length
      }
    });
  } catch (error) {
    logger.error('Failed to get service categories', error);
    return sendServerError(res, error, 'Failed to retrieve service categories', 'CATEGORIES_RETRIEVAL_ERROR');
  }
};

// @desc    Get detailed information about a specific category
// @route   GET /api/marketplace/services/categories/:category
// @access  Public
const getCategoryDetails = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeServices = 'true'
    } = req.query;

    // Valid category enum values
    const validCategories = [
      'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
      'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
      'appliance_repair', 'locksmith', 'handyman', 'home_security',
      'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
      'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories
      });
    }

    // Category definitions (same as in getServiceCategories)
    const categoryDefinitions = {
      cleaning: {
        name: 'Cleaning Services',
        description: 'Professional cleaning services for homes and businesses',
        icon: '🧹',
        subcategories: ['residential_cleaning', 'commercial_cleaning', 'deep_cleaning', 'carpet_cleaning', 'window_cleaning', 'power_washing', 'post_construction_cleaning']
      },
      plumbing: {
        name: 'Plumbing Services',
        description: 'Plumbing repair, installation, and maintenance',
        icon: '🔧',
        subcategories: ['pipe_repair', 'installation', 'leak_repair', 'drain_cleaning', 'water_heater', 'sewer_services', 'emergency_plumbing']
      },
      electrical: {
        name: 'Electrical Services',
        description: 'Electrical work, repairs, and installations',
        icon: '⚡',
        subcategories: ['wiring', 'panel_upgrade', 'outlet_installation', 'lighting', 'electrical_repair', 'safety_inspection']
      },
      moving: {
        name: 'Moving Services',
        description: 'Residential and commercial moving services',
        icon: '📦',
        subcategories: ['local_moving', 'long_distance', 'packing', 'unpacking', 'storage', 'furniture_assembly']
      },
      landscaping: {
        name: 'Landscaping Services',
        description: 'Outdoor landscaping and yard maintenance',
        icon: '🌳',
        subcategories: ['lawn_care', 'garden_design', 'tree_services', 'irrigation', 'hardscaping', 'mulching']
      },
      painting: {
        name: 'Painting Services',
        description: 'Interior and exterior painting',
        icon: '🎨',
        subcategories: ['interior_painting', 'exterior_painting', 'cabinet_painting', 'deck_staining', 'wallpaper', 'texture_painting']
      },
      carpentry: {
        name: 'Carpentry Services',
        description: 'Woodwork and carpentry services',
        icon: '🪵',
        subcategories: ['furniture_repair', 'custom_build', 'cabinet_installation', 'trim_work', 'deck_building', 'shelving']
      },
      flooring: {
        name: 'Flooring Services',
        description: 'Floor installation and repair',
        icon: '🏠',
        subcategories: ['hardwood', 'tile', 'carpet', 'laminate', 'vinyl', 'floor_repair', 'refinishing']
      },
      roofing: {
        name: 'Roofing Services',
        description: 'Roof repair, installation, and maintenance',
        icon: '🏡',
        subcategories: ['roof_repair', 'roof_replacement', 'gutter_repair', 'roof_inspection', 'leak_repair', 'solar_installation']
      },
      hvac: {
        name: 'HVAC Services',
        description: 'Heating, ventilation, and air conditioning',
        icon: '❄️',
        subcategories: ['installation', 'repair', 'maintenance', 'duct_cleaning', 'thermostat_installation', 'air_quality']
      },
      appliance_repair: {
        name: 'Appliance Repair',
        description: 'Home appliance repair and maintenance',
        icon: '🔌',
        subcategories: ['refrigerator', 'washer_dryer', 'dishwasher', 'oven_range', 'microwave', 'garbage_disposal']
      },
      locksmith: {
        name: 'Locksmith Services',
        description: 'Lock installation, repair, and emergency services',
        icon: '🔐',
        subcategories: ['lock_installation', 'key_duplication', 'lockout_service', 'safe_services', 'access_control']
      },
      handyman: {
        name: 'Handyman Services',
        description: 'General repair and maintenance services',
        icon: '🔨',
        subcategories: ['general_repair', 'assembly', 'mounting', 'caulking', 'drywall_repair', 'fence_repair']
      },
      home_security: {
        name: 'Home Security',
        description: 'Security system installation and monitoring',
        icon: '🚨',
        subcategories: ['alarm_installation', 'camera_installation', 'smart_locks', 'motion_sensors', 'security_consultation']
      },
      pool_maintenance: {
        name: 'Pool Maintenance',
        description: 'Swimming pool cleaning and maintenance',
        icon: '🏊',
        subcategories: ['cleaning', 'chemical_balance', 'equipment_repair', 'winterization', 'pool_repair', 'opening_closing']
      },
      pest_control: {
        name: 'Pest Control',
        description: 'Pest elimination and prevention',
        icon: '🐛',
        subcategories: ['general_pest', 'termite_control', 'rodent_control', 'bed_bug', 'wildlife_removal', 'preventive_treatment']
      },
      carpet_cleaning: {
        name: 'Carpet Cleaning',
        description: 'Professional carpet and upholstery cleaning',
        icon: '🧼',
        subcategories: ['steam_cleaning', 'dry_cleaning', 'stain_removal', 'pet_odor', 'upholstery', 'area_rugs']
      },
      window_cleaning: {
        name: 'Window Cleaning',
        description: 'Window and glass cleaning services',
        icon: '🪟',
        subcategories: ['residential', 'commercial', 'interior_exterior', 'screen_cleaning', 'pressure_washing', 'storefront']
      },
      gutter_cleaning: {
        name: 'Gutter Cleaning',
        description: 'Gutter cleaning and maintenance',
        icon: '🌧️',
        subcategories: ['cleaning', 'repair', 'installation', 'leaf_removal', 'downspout_cleaning', 'gutter_guards']
      },
      power_washing: {
        name: 'Power Washing',
        description: 'Exterior surface pressure washing',
        icon: '💦',
        subcategories: ['driveway', 'siding', 'deck_patio', 'fence', 'roof', 'commercial']
      },
      snow_removal: {
        name: 'Snow Removal',
        description: 'Snow clearing and removal services',
        icon: '❄️',
        subcategories: ['driveway', 'sidewalk', 'commercial', 'roof', 'snow_plowing', 'ice_removal']
      },
      other: {
        name: 'Other Services',
        description: 'Other specialized services',
        icon: '📋',
        subcategories: []
      }
    };

    const categoryFilter = { category, isActive: true };

    // Get service count
    const totalServices = await Service.countDocuments(categoryFilter);

    // Get pricing statistics
    const pricingStats = await Service.aggregate([
      { $match: categoryFilter },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$pricing.basePrice' },
          minPrice: { $min: '$pricing.basePrice' },
          maxPrice: { $max: '$pricing.basePrice' },
          medianPrice: { $avg: '$pricing.basePrice' }
        }
      }
    ]);

    // Get rating statistics
    const ratingStats = await Service.aggregate([
      { $match: { ...categoryFilter, 'rating.average': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.average' },
          totalRatings: { $sum: '$rating.count' },
          totalReviews: { $sum: '$rating.count' }
        }
      }
    ]);

    // Get subcategory distribution
    const subcategoryStats = await Service.aggregate([
      { $match: categoryFilter },
      {
        $group: {
          _id: '$subcategory',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get pricing type distribution
    const pricingTypeStats = await Service.aggregate([
      { $match: categoryFilter },
      {
        $group: {
          _id: '$pricing.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get provider count for this category
    const providerCount = await Provider.countDocuments({
      status: 'active',
      'professionalInfo.specialties': {
        $elemMatch: { category }
      }
    });

    // Get services if requested
    let services = null;
    let pagination = null;

    if (includeServices === 'true' || includeServices === true) {
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      services = await Service.find(categoryFilter)
        .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience')
        .select('-reviews -bookings -metadata -featured -promoted')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      pagination = createPagination(parseInt(page), parseInt(limit), totalServices);
    }

    // Get featured/popular services (top rated)
    const featuredServices = await Service.find(categoryFilter)
      .populate('provider', 'firstName lastName profile.avatar')
      .select('title description pricing rating images category subcategory')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(5)
      .lean();

    logger.info('Category details retrieved', {
      category,
      totalServices,
      providerCount
    });

    const categoryInfo = categoryDefinitions[category] || {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      description: `${category} services`,
      icon: '📋',
      subcategories: []
    };

    return res.status(200).json({
      success: true,
      message: 'Category details retrieved successfully',
      data: {
        category: category,
        ...categoryInfo,
        statistics: {
          totalServices,
          providerCount,
          pricing: pricingStats[0] ? {
            average: Math.round(pricingStats[0].avgPrice || 0),
            min: pricingStats[0].minPrice || 0,
            max: pricingStats[0].maxPrice || 0,
            currency: 'USD'
          } : null,
          rating: ratingStats[0] ? {
            average: parseFloat((ratingStats[0].avgRating || 0).toFixed(2)),
            totalRatings: ratingStats[0].totalRatings || 0,
            totalReviews: ratingStats[0].totalReviews || 0
          } : null,
          subcategoryDistribution: subcategoryStats.map(item => ({
            subcategory: item._id,
            count: item.count,
            percentage: totalServices > 0 ? ((item.count / totalServices) * 100).toFixed(2) : 0
          })),
          pricingTypeDistribution: pricingTypeStats.map(item => ({
            type: item._id,
            count: item.count,
            percentage: totalServices > 0 ? ((item.count / totalServices) * 100).toFixed(2) : 0
          }))
        },
        featuredServices: featuredServices.length > 0 ? featuredServices : null,
        services: services,
        pagination: pagination
      }
    });
  } catch (error) {
    logger.error('Failed to get category details', error, {
      category: req.params.category
    });
    return sendServerError(res, error, 'Failed to retrieve category details', 'CATEGORY_DETAILS_ERROR');
  }
};

// @desc    Get all providers for a particular service
// @route   GET /api/marketplace/services/:id/providers
// @access  Public
const getProvidersForService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      minRating,
      maxDistance,
      lat,
      lng,
      sortBy = 'performance.rating',
      sortOrder = 'desc'
    } = req.query;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Find the service to get its category and subcategory
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Build query to find providers who offer this service category/subcategory
    const providerQuery = {
      status: 'active',
      'professionalInfo.specialties': {
        $elemMatch: {
          category: service.category,
          ...(service.subcategory ? { subcategories: service.subcategory } : {})
        }
      }
    };

    // Add rating filter if provided
    if (minRating) {
      providerQuery['performance.rating'] = { $gte: parseFloat(minRating) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find providers matching the service category
    const providers = await Provider.find(providerQuery)
      .populate('userId', 'firstName lastName email phone profile.avatar')
      .select('-financialInfo -verification.backgroundCheck -verification.insurance.documents -onboarding')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter by location if coordinates provided (optional enhancement)
    let filteredProviders = providers;
    if (lat && lng && maxDistance) {
      // You could add geospatial filtering here if needed
      // For now, we'll rely on the serviceArea matching from the service
    }

    // Get total count
    const total = await Provider.countDocuments(providerQuery);

    // Enhance providers with service-specific information
    const enhancedProviders = filteredProviders.map(provider => {
      // Find the matching specialty for this service
      const matchingSpecialty = provider.professionalInfo?.specialties?.find(
        specialty => specialty.category === service.category
      );

      return {
        ...provider,
        matchingSpecialty: {
          category: matchingSpecialty?.category,
          subcategories: matchingSpecialty?.subcategories || [],
          experience: matchingSpecialty?.experience || 0,
          hourlyRate: matchingSpecialty?.hourlyRate || null,
          certifications: matchingSpecialty?.certifications || [],
          skills: matchingSpecialty?.skills || []
        },
        serviceInfo: {
          serviceId: service._id,
          serviceCategory: service.category,
          serviceSubcategory: service.subcategory,
          serviceTitle: service.title
        }
      };
    });

    const pagination = createPagination(parseInt(page), parseInt(limit), total);

    logger.info('Providers retrieved for service', {
      serviceId: id,
      serviceCategory: service.category,
      resultCount: enhancedProviders.length,
      totalCount: total
    });

    return res.status(200).json({
      success: true,
      message: 'Providers retrieved successfully',
      data: enhancedProviders,
      pagination,
      serviceInfo: {
        id: service._id,
        title: service.title,
        category: service.category,
        subcategory: service.subcategory
      }
    });
  } catch (error) {
    logger.error('Failed to get providers for service', error, {
      serviceId: req.params.id,
      query: req.query
    });
    
    return sendServerError(res, error, 'Failed to retrieve providers for service', 'PROVIDERS_FOR_SERVICE_ERROR');
  }
};

// @desc    Get detailed information about a provider
// @route   GET /api/marketplace/providers/:id
// @access  Public
const getProviderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      includeServices = 'true',
      includeReviews = 'true',
      includeStatistics = 'true',
      requireActive = 'true'
    } = req.query;

    // Try to find provider by ID first, then by userId if not found
    // Convert string ID to ObjectId for more reliable lookup
    let providerId;
    let userIdForLookup;
    
    // Validate and convert ObjectId - be flexible with format
    try {
      // Trim whitespace
      const trimmedId = id.trim();
      
      // Validate basic format (24 hex characters)
      if (!trimmedId || trimmedId.length !== 24) {
        logger.warn('Provider ID format check failed', {
          id: trimmedId,
          length: trimmedId?.length,
          type: typeof trimmedId
        });
        
        return res.status(400).json({
          success: false,
          message: 'Invalid provider ID format',
          error: 'ID must be exactly 24 characters (MongoDB ObjectId format)',
          receivedId: trimmedId,
          receivedLength: trimmedId?.length || 0,
          expectedLength: 24,
          hint: 'Ensure you are using the correct provider ID. Example format: 507f1f77bcf86cd799439011'
        });
      }
      
      // Try to convert to ObjectId - this will validate the format
      // Use mongoose.isValidObjectId for validation, then create ObjectId
      if (!mongoose.isValidObjectId(trimmedId)) {
        throw new Error('Invalid ObjectId format');
      }
      providerId = mongoose.Types.ObjectId(trimmedId);
      userIdForLookup = providerId;
      
      logger.info('Provider ID validated and converted', {
        originalId: trimmedId,
        providerId: providerId.toString()
      });
    } catch (e) {
      // If ObjectId conversion fails, the format is invalid
      logger.warn('Invalid provider ID format - conversion failed', {
        id,
        error: e.message,
        idLength: id?.length,
        idType: typeof id
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid provider ID format',
        error: e.message || 'ID must be a valid MongoDB ObjectId',
        receivedId: id,
        receivedLength: id?.length || 0,
        expectedFormat: '24 hex characters (0-9, a-f, A-F)',
        hint: 'Make sure you are using the correct provider ID or userId. Check for any extra characters, spaces, or encoding issues.'
      });
    }

    let provider = await Provider.findById(providerId)
      .populate('userId', 'firstName lastName email phone profile.avatar profile.bio')
      .select('-financialInfo -verification.backgroundCheck -verification.insurance.documents -onboarding')
      .lean();

    logger.info('Provider lookup attempt', {
      requestedId: id,
      foundById: !!provider,
      providerId: provider?._id,
      providerStatus: provider?.status
    });

    // If not found by ID, try finding by userId
    if (!provider) {
      logger.info('Provider not found by ID, trying userId lookup', { userId: id });
      provider = await Provider.findOne({ userId: userIdForLookup })
        .populate('userId', 'firstName lastName email phone profile.avatar profile.bio')
        .select('-financialInfo -verification.backgroundCheck -verification.insurance.documents -onboarding')
        .lean();
      
      if (provider) {
        logger.info('Provider found by userId', {
          userId: id,
          providerId: provider._id,
          providerStatus: provider.status
        });
      }
    }

    if (!provider) {
      // Try to provide more helpful error message
      const byUserId = await Provider.findOne({ userId: userIdForLookup }).select('_id status').lean();
      if (byUserId) {
        logger.warn('Provider found but query failed', {
          requestedId: id,
          foundProviderId: byUserId._id,
          status: byUserId.status
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
        hint: 'Make sure you are using the provider ID or userId. If using userId, ensure a provider profile exists for that user.'
      });
    }

    // Check if provider is active (optional check)
    const isActiveRequired = requireActive === 'true' || requireActive === true;
    if (isActiveRequired && provider.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Provider profile is not active. Current status: ${provider.status}`,
        status: provider.status,
        hint: 'Set requireActive=false in query params to view inactive providers'
      });
    }

    // Initialize response data
    const providerDetails = {
      provider: {
        id: provider._id,
        userId: provider.userId,
        providerType: provider.providerType,
        status: provider.status,
        businessInfo: provider.businessInfo,
        professionalInfo: provider.professionalInfo,
        verification: {
          identityVerified: provider.verification?.identityVerified || false,
          businessVerified: provider.verification?.businessVerified || false,
          backgroundCheck: {
            status: provider.verification?.backgroundCheck?.status || 'pending'
          },
          insurance: {
            hasInsurance: provider.verification?.insurance?.hasInsurance || false,
            coverageAmount: provider.verification?.insurance?.coverageAmount || null
          },
          licenses: provider.verification?.licenses?.map(license => ({
            type: license.type,
            number: license.number,
            issuingAuthority: license.issuingAuthority,
            expiryDate: license.expiryDate
          })) || [],
          portfolio: provider.verification?.portfolio || null
        },
        performance: provider.performance || {},
        preferences: provider.preferences || {},
        settings: provider.settings || {},
        metadata: {
          profileViews: provider.metadata?.profileViews || 0,
          featured: provider.metadata?.featured || false,
          promoted: provider.metadata?.promoted || false,
          lastActive: provider.metadata?.lastActive || null
        },
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }
    };

    // Get the actual userId (handle both populated and non-populated cases)
    const actualUserId = provider.userId?._id || provider.userId;

    // Get provider's services if requested
    if (includeServices === 'true' || includeServices === true) {
      const services = await Service.find({
        provider: actualUserId,
        isActive: true
      })
        .select('title description category subcategory pricing rating images serviceArea createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      providerDetails.services = services;
      providerDetails.serviceCount = services.length;
    }

    // Get statistics if requested
    if (includeStatistics === 'true' || includeStatistics === true) {
      // Total services count
      const totalServices = await Service.countDocuments({
        provider: actualUserId,
        isActive: true
      });

      // Booking statistics
      const bookingStats = await Booking.aggregate([
        {
          $match: {
            provider: actualUserId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$pricing.totalAmount' }
          }
        }
      ]);

      // Calculate booking statistics
      const stats = {
        totalServices,
        bookings: {
          total: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
          totalEarnings: 0
        },
        averageRating: provider.performance?.rating || 0,
        totalReviews: provider.performance?.reviewsCount || 0,
        responseRate: provider.performance?.responseRate || 0,
        averageResponseTime: provider.performance?.averageResponseTime || null
      };

      bookingStats.forEach(stat => {
        stats.bookings.total += stat.count;
        if (stat._id === 'completed') {
          stats.bookings.completed = stat.count;
          stats.bookings.totalEarnings = stat.totalAmount || 0;
        } else if (stat._id === 'pending' || stat._id === 'confirmed') {
          stats.bookings.pending += stat.count;
        } else if (stat._id === 'cancelled') {
          stats.bookings.cancelled = stat.count;
        }
      });

      // Get average service rating
      const serviceRatings = await Service.aggregate([
        {
          $match: {
            provider: actualUserId,
            isActive: true,
            'rating.average': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating.average' },
            totalRatings: { $sum: '$rating.count' }
          }
        }
      ]);

      if (serviceRatings.length > 0) {
        stats.averageServiceRating = parseFloat((serviceRatings[0].avgRating || 0).toFixed(2));
        stats.totalServiceRatings = serviceRatings[0].totalRatings || 0;
      }

      providerDetails.statistics = stats;
    }

    // Get recent reviews if requested
    if (includeReviews === 'true' || includeReviews === true) {
      const recentBookings = await Booking.find({
        provider: actualUserId,
        'review.rating': { $exists: true, $ne: null },
        status: 'completed'
      })
        .populate('client', 'firstName lastName profile.avatar')
        .select('review bookingDate service createdAt')
        .sort({ 'review.createdAt': -1 })
        .limit(10)
        .lean();

      providerDetails.reviews = recentBookings.map(booking => ({
        id: booking._id,
        client: booking.client,
        rating: booking.review?.rating,
        comment: booking.review?.comment,
        categories: booking.review?.categories,
        wouldRecommend: booking.review?.wouldRecommend,
        photos: booking.review?.photos,
        bookingDate: booking.bookingDate,
        createdAt: booking.review?.createdAt || booking.createdAt
      }));
    }

    // Increment profile views
    await Provider.findByIdAndUpdate(id, {
      $inc: { 'metadata.profileViews': 1 }
    });

    logger.info('Provider details retrieved', {
      providerId: id,
      includeServices,
      includeReviews,
      includeStatistics
    });

    return res.status(200).json({
      success: true,
      message: 'Provider details retrieved successfully',
      data: providerDetails
    });
  } catch (error) {
    logger.error('Failed to get provider details', error, {
      providerId: req.params.id
    });
    return sendServerError(res, error, 'Failed to retrieve provider details', 'PROVIDER_DETAILS_ERROR');
  }
};

module.exports = {
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
};
