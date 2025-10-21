const { Service, Booking } = require('../models/Marketplace');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const GoogleMapsService = require('../services/googleMapsService');
const PayPalService = require('../services/paypalService');
const { uploaders } = require('../config/cloudinary');

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
    if (location) {
      // Enhanced location filtering with Google Maps
      if (req.query.coordinates) {
        // If coordinates are provided, find services within radius
        const coordinates = JSON.parse(req.query.coordinates);
        const radius = parseInt(req.query.radius) || 50000; // Default 50km radius
        
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
        console.log(`Booking confirmation email sent to: ${booking.client.email}`);
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
        console.log(`Booking confirmation email sent to: ${booking.client.email}`);
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

module.exports = {
  getServices,
  getService,
  getNearbyServices,
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
  getMyBookings
};
