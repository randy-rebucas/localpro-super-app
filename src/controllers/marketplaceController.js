const { Service, Booking } = require('../models/Marketplace');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const Provider = require('../models/Provider');
const mongoose = require('mongoose');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');
const GoogleMapsService = require('../services/googleMapsService');
const PayPalService = require('../services/paypalService');
const paymongoService = require('../services/paymongoService');
const logger = require('../config/logger');
const { 
  sendPaginated, 
  sendServerError,
  createPagination 
} = require('../utils/responseHelper');
const { buildServiceAreaQuery } = require('../utils/serviceAreaHelper');

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
    if (location || req.query.coordinates) {
      // Enhanced location filtering - supports both old and new serviceArea formats
      const coordinates = req.query.coordinates 
        ? JSON.parse(req.query.coordinates) 
        : null;
      
      const serviceAreaQuery = buildServiceAreaQuery({
        location,
        coordinates,
        maxDistance: req.query.maxDistance ? Number(req.query.maxDistance) : null
      });
      
      // Merge serviceArea query into filter
      if (Object.keys(serviceAreaQuery).length > 0) {
        Object.assign(filter, serviceAreaQuery);
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

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience')
      .select('-reviews -bookings -metadata -featured -promoted')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() for better performance on read-only operations

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

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
    // Log request details for debugging
    logger.info('Create service request', {
      userId: req.user.id,
      contentType: req.get('content-type'),
      bodyKeys: Object.keys(req.body || {}),
      hasFiles: !!req.files,
      filesCount: req.files?.length || 0
    });

    // Handle both JSON and multipart/form-data
    const contentType = req.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    // Parse service data from body
    let serviceData;
    if (isMultipart) {
      // For multipart/form-data, parse JSON fields if they're strings
      serviceData = { ...req.body };
      
      // Parse JSON fields that might be sent as strings in form-data
      const jsonFields = ['pricing', 'availability', 'serviceArea', 'estimatedDuration', 'warranty', 'insurance', 'emergencyService', 'servicePackages', 'addOns'];
      jsonFields.forEach(field => {
        if (serviceData[field] && typeof serviceData[field] === 'string') {
          try {
            serviceData[field] = JSON.parse(serviceData[field]);
          } catch (e) {
            // If parsing fails, keep original value
            logger.warn(`Failed to parse ${field} as JSON`, { value: serviceData[field] });
          }
        }
      });
    } else {
      // For JSON requests, use body directly
      serviceData = { ...req.body };
    }

    // Only validate basic required fields
    const { title, category } = serviceData;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service title is required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service category is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Set provider
    serviceData.provider = req.user.id;

    // Remove any file-related fields that shouldn't be in the service document
    delete serviceData.images;
    delete serviceData.files;
    delete serviceData.file;

    // Enhance serviceArea with geocoding if coordinates are not provided
    if (serviceData.serviceArea && Array.isArray(serviceData.serviceArea)) {
      // If serviceArea is in new format (array of objects), geocode if needed
      if (serviceData.serviceArea.length > 0 && typeof serviceData.serviceArea[0] === 'object') {
        for (let area of serviceData.serviceArea) {
          // If area has name but no coordinates, try to geocode it
          if (area.name && !area.coordinates) {
            try {
              const geocodeResult = await GoogleMapsService.geocodeAddress(area.name);
              if (geocodeResult.success && geocodeResult.coordinates) {
                area.coordinates = geocodeResult.coordinates;
                // Set default radius if not provided (50km default)
                if (!area.radius) {
                  area.radius = 50; // 50 kilometers default radius
                }
              }
            } catch (geocodeError) {
              logger.warn('Failed to geocode service area', {
                area: area.name,
                error: geocodeError.message
              });
              // Continue without geocoding if it fails
            }
          }
        }
      }
    }

    // Create the service first
    const service = await Service.create(serviceData);

    // Upload images if provided
    if (req.files && req.files.length > 0) {
      try {
        // Upload multiple files to Cloudinary
        const uploadResult = await CloudinaryService.uploadMultipleFiles(
          req.files, 
          'localpro/marketplace'
        );

        if (uploadResult.success && uploadResult.data && uploadResult.data.length > 0) {
          // Ensure images array exists
          if (!service.images) {
            service.images = [];
          }

          // Add new images to service
          const newImages = uploadResult.data
            .filter(file => file && file.secure_url && file.public_id)
            .map(file => ({
              url: file.secure_url,
              publicId: file.public_id,
              thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail'),
              alt: `Service image for ${service.title || 'Service'}`
            }));

          if (newImages.length > 0) {
            service.images.push(...newImages);
            await service.save();

            logger.info('Service images uploaded during creation', {
              serviceId: service._id,
              imagesCount: newImages.length,
              userId: req.user.id
            });
          } else {
            logger.warn('No valid images after processing during service creation', {
              serviceId: service._id,
              uploadResult: uploadResult
            });
          }
        } else {
          logger.warn('Failed to upload images during service creation', {
            serviceId: service._id,
            error: uploadResult.error,
            errors: uploadResult.errors
          });
          // Don't fail the service creation if image upload fails
        }
      } catch (imageError) {
        logger.error('Error uploading images during service creation', {
          serviceId: service._id,
          error: imageError.message,
          stack: imageError.stack
        });
        // Don't fail the service creation if image upload fails
      }
    }

    logger.info('Service created successfully', {
      serviceId: service._id,
      title: service.title,
      category: service.category,
      providerId: req.user.id,
      imagesUploaded: req.files?.length || 0
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    logger.error('Create service error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.user.id,
      bodyKeys: Object.keys(req.body || {})
    });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ERROR',
        field: field
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Normalize serviceArea if provided (to handle both old and new formats)
    const updateData = { ...req.body };
    if (updateData.serviceArea !== undefined) {
      // Import normalizeServiceArea helper
      const { normalizeServiceArea } = require('../utils/serviceAreaHelper');
      
      // Handle stringified JSON if needed
      let serviceAreaData = updateData.serviceArea;
      if (typeof serviceAreaData === 'string') {
        try {
          serviceAreaData = JSON.parse(serviceAreaData);
        } catch (parseError) {
          logger.warn('Failed to parse serviceArea as JSON, treating as string', {
            serviceArea: serviceAreaData,
            error: parseError.message
          });
        }
      }
      
      updateData.serviceArea = normalizeServiceArea(serviceAreaData);
    }

    // Update the service document directly to ensure pre-save hooks run
    // This is better than findByIdAndUpdate for Mixed types
    Object.assign(service, updateData);
    await service.save();

    logger.info('Service updated successfully', {
      serviceId: service._id,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    logger.error('Update service error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      serviceId: req.params.id,
      userId: req.user?.id
    });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errors
      });
    }

    // Handle Cast errors (like the serviceArea casting issue)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid data format for field: ${error.path}`,
        code: 'CAST_ERROR',
        field: error.path,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Deactivate service
// @route   PATCH /api/marketplace/services/:id/deactivate
// @access  Private (Provider)
const deactivateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
        code: 'INVALID_ID'
      });
    }

    // Find the service
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      });
    }

    // Check if user owns the service or is admin
    const isOwner = service.provider.toString() === userId;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to deactivate this service',
        code: 'FORBIDDEN'
      });
    }

    // Check if already inactive
    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is already inactive',
        code: 'ALREADY_INACTIVE',
        data: service
      });
    }

    // Deactivate the service
    service.isActive = false;
    await service.save();

    logger.info('Service deactivated', {
      serviceId: id,
      title: service.title,
      deactivatedBy: userId,
      isAdmin: isAdmin
    });

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully',
      data: service
    });
  } catch (error) {
    logger.error('Deactivate service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate service',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Activate service
// @route   PATCH /api/marketplace/services/:id/activate
// @access  Private (Provider)
const activateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
        code: 'INVALID_ID'
      });
    }

    // Find the service
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      });
    }

    // Check if user owns the service or is admin
    const isOwner = service.provider.toString() === userId;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to activate this service',
        code: 'FORBIDDEN'
      });
    }

    // Check if already active
    if (service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is already active',
        code: 'ALREADY_ACTIVE',
        data: service
      });
    }

    // Activate the service
    service.isActive = true;
    await service.save();

    logger.info('Service activated', {
      serviceId: id,
      title: service.title,
      activatedBy: userId,
      isAdmin: isAdmin
    });

    res.status(200).json({
      success: true,
      message: 'Service activated successfully',
      data: service
    });
  } catch (error) {
    logger.error('Activate service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to activate service',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    // Support both field names for backward compatibility
    // serviceId can be in body, formData, URL params, or query params
    // Frontend may send: { serviceId, providerId, formData: { bookingDate, bookingTime, ... } }
    const { 
      serviceId: bodyServiceId,
      // providerId may be sent but not used (service.provider is used instead)
      bookingDate, 
      bookingTime, // Separate time field (frontend sends date and time separately)
      scheduledDate, // Alternative field name
      duration, 
      address, 
      specialInstructions, 
      notes, // Alternative field name
      paymentMethod,
      formData // Handle nested formData object from frontend
    } = req.body;

    // Extract serviceId from multiple possible locations
    const actualServiceId = bodyServiceId || 
                           formData?.serviceId || 
                           req.params.serviceId || 
                           req.query.serviceId;
    
    // Debug logging to help diagnose issues
    if (!actualServiceId) {
      logger.warn('Service ID extraction failed', {
        bodyServiceId,
        formDataServiceId: formData?.serviceId,
        paramsServiceId: req.params.serviceId,
        queryServiceId: req.query.serviceId,
        bodyKeys: Object.keys(req.body || {}),
        hasFormData: !!formData
      });
    }
    
    // Extract other fields, checking formData first if it exists
    const actualBookingDate = formData?.bookingDate || bookingDate || scheduledDate || formData?.scheduledDate;
    const actualBookingTime = formData?.bookingTime || bookingTime;
    const actualDuration = formData?.duration || duration;
    const actualPaymentMethod = formData?.paymentMethod || paymentMethod;

    // Combine bookingDate and bookingTime if both are provided
    let finalBookingDate = actualBookingDate;
    if (actualBookingDate && actualBookingTime) {
      // Combine date and time: "2025-11-17" + "08:32" = "2025-11-17T08:32:00"
      finalBookingDate = `${actualBookingDate}T${actualBookingTime}:00`;
    } else if (actualBookingDate) {
      // If only date is provided, use it as-is (might already be ISO format)
      finalBookingDate = actualBookingDate;
    }
    
    // Handle duration - can be number (hours) or object {hours, minutes}
    let finalDuration = actualDuration;
    if (typeof finalDuration === 'object' && finalDuration !== null) {
      // Convert {hours: 2, minutes: 30} to decimal hours (e.g., 2.5)
      finalDuration = (finalDuration.hours || 0) + ((finalDuration.minutes || 0) / 60);
    }
    
    // Use specialInstructions or notes (specialInstructions takes precedence)
    // Also check formData for nested values
    const finalSpecialInstructions = specialInstructions || notes || formData?.specialInstructions || formData?.notes;
    const finalAddress = address || formData?.address;
    const finalPaymentMethod = actualPaymentMethod;

    // Validation
    if (!actualServiceId) {
      logger.warn('Create booking failed: Service ID missing', {
        userId: req.user?.id,
        body: req.body,
        params: req.params,
        query: req.query
      });
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
        code: 'MISSING_SERVICE_ID'
      });
    }

    if (!finalBookingDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required (use bookingDate or scheduledDate)'
      });
    }

    if (!finalDuration || finalDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required and must be greater than 0'
      });
    }

    const service = await Service.findById(actualServiceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND'
      });
    }

    // Get provider ID - handle both populated and non-populated service.provider
    const providerId = service.provider?._id || service.provider;
    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service does not have an associated provider',
        code: 'MISSING_PROVIDER'
      });
    }

    // Calculate pricing
    let totalAmount = 0;
    if (service.pricing.type === 'hourly') {
      totalAmount = service.pricing.basePrice * finalDuration;
    } else {
      totalAmount = service.pricing.basePrice;
    }

    // Validate service area if address coordinates are provided
    if (finalAddress?.coordinates) {
      const serviceAreaValidation = await GoogleMapsService.validateServiceArea(
        finalAddress.coordinates,
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
      service: actualServiceId,
      client: req.user.id,
      provider: providerId,
      bookingDate: new Date(finalBookingDate),
      duration: finalDuration,
      address: finalAddress,
      specialInstructions: finalSpecialInstructions,
      pricing: {
        basePrice: service.pricing.basePrice,
        totalAmount,
        currency: service.pricing.currency
      },
      payment: {
        method: finalPaymentMethod || 'cash',
        status: finalPaymentMethod === 'paypal' ? 'pending' : 'pending'
      }
    };

    const booking = await Booking.create(bookingData);

    // Handle PayPal payment if selected
    if (finalPaymentMethod === 'paypal') {
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
          shipping: finalAddress ? {
            name: `${user.firstName} ${user.lastName}`,
            address_line_1: finalAddress.street,
            city: finalAddress.city,
            state: finalAddress.state,
            postal_code: finalAddress.zipCode,
            country_code: finalAddress.country || 'US'
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

    // Handle PayMongo payment if selected
    if (finalPaymentMethod === 'paymongo') {
      try {
        // Create PayMongo payment authorization
        const paymongoResult = await paymongoService.createAuthorization({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: service.pricing.currency,
          description: `Service booking: ${service.title}`,
          clientId: req.user.id,
          bookingId: booking._id.toString()
        });

        if (!paymongoResult.success) {
          throw new Error('Failed to create PayMongo authorization');
        }

        // Update booking with PayMongo details
        booking.payment.method = 'paymongo';
        booking.payment.paymongoIntentId = paymongoResult.holdId;
        await booking.save();

        // Populate the booking with service and user details
        await booking.populate([
          { path: 'service', select: 'title category pricing' },
          { path: 'client', select: 'firstName lastName phoneNumber email' },
          { path: 'provider', select: 'firstName lastName phoneNumber email' }
        ]);

        res.status(201).json({
          success: true,
          message: 'Booking created successfully with PayMongo payment',
          data: {
            booking,
            paymentDetails: {
              clientSecret: paymongoResult.clientSecret,
              publishableKey: paymongoResult.publishableKey,
              intentId: paymongoResult.holdId
            }
          }
        });
        return;
      } catch (paymongoError) {
        console.error('PayMongo booking error:', paymongoError);
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
    logger.error('Create booking failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      body: {
        serviceId: req.body?.serviceId,
        hasBookingDate: !!req.body?.bookingDate,
        hasScheduledDate: !!req.body?.scheduledDate,
        duration: req.body?.duration,
        hasAddress: !!req.body?.address,
        paymentMethod: req.body?.paymentMethod
      }
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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

// @desc    Get single booking by ID
// @route   GET /api/marketplace/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID'
      });
    }

    // Find booking and populate related data
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title category subcategory pricing images description features requirements')
      .populate('client', 'firstName lastName phoneNumber email profile.avatar')
      .populate('provider', 'firstName lastName phoneNumber email profile.avatar');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check authorization: user must be the client, provider, or admin
    const isClient = booking.client._id.toString() === userId || booking.client.toString() === userId;
    const isProvider = booking.provider._id.toString() === userId || booking.provider.toString() === userId;

    if (!isClient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
        code: 'UNAUTHORIZED'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Get booking error', {
      bookingId: req.params.id,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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
// @access  Private (Provider/Admin)
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

    // Check if user is the provider or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
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
      logger.error('Failed to upload service images to Cloudinary', {
        serviceId,
        error: uploadResult.error,
        errors: uploadResult.errors,
        userId: req.user.id
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to upload service images',
        error: uploadResult.error || uploadResult.errors,
        code: 'UPLOAD_FAILED'
      });
    }

    // Validate upload result data
    if (!uploadResult.data || uploadResult.data.length === 0) {
      logger.error('No files were successfully uploaded', {
        serviceId,
        total: uploadResult.total,
        successful: uploadResult.successful,
        failed: uploadResult.failed,
        errors: uploadResult.errors
      });
      return res.status(500).json({
        success: false,
        message: 'No files were successfully uploaded',
        code: 'NO_FILES_UPLOADED',
        errors: uploadResult.errors
      });
    }

    // Ensure images array exists
    if (!service.images) {
      service.images = [];
    }

    // Add new images to service
    const newImages = uploadResult.data
      .filter(file => file && file.secure_url && file.public_id) // Filter out invalid files
      .map(file => ({
        url: file.secure_url,
        publicId: file.public_id,
        thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail'),
        alt: `Service image for ${service.title || 'Service'}`
      }));

    if (newImages.length === 0) {
      logger.error('No valid image data after processing', {
        serviceId,
        uploadedFiles: uploadResult.data
      });
      return res.status(500).json({
        success: false,
        message: 'No valid image data after processing',
        code: 'INVALID_IMAGE_DATA'
      });
    }

    service.images.push(...newImages);
    await service.save();

    logger.info('Service images uploaded successfully', {
      serviceId,
      imagesCount: newImages.length,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Service images uploaded successfully',
      data: newImages
    });
  } catch (error) {
    logger.error('Upload service images error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      serviceId: req.params.id,
      userId: req.user?.id,
      filesCount: req.files?.length || 0
    });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errors
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Failed to upload service images',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

const normalizeCategoryKey = (value = '') => value.toString().trim().toLowerCase().replace(/\s+/g, '-');

const buildServiceCategoryFilter = (identifier) => {
  if (!identifier) return null;
  return mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: identifier }
    : { key: normalizeCategoryKey(identifier) };
};

const sanitizeSubcategories = (subcategories = []) => {
  if (!Array.isArray(subcategories)) return [];
  return subcategories
    .map((item) => (item || '').toString().trim())
    .filter(Boolean);
};

const sanitizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return undefined;

  const result = {};

  if (metadata.color) {
    result.color = metadata.color;
  }

  if (Array.isArray(metadata.tags)) {
    result.tags = metadata.tags
      .map((tag) => (tag || '').toString().trim())
      .filter(Boolean);
  }

  return result;
};

// @desc    Get service categories with details and statistics
// @route   GET /api/marketplace/services/categories
// @access  Public
const getServiceCategories = async (req, res) => {
  try {
    const { includeStats = 'true', includeInactive = 'true' } = req.query;

    const includeInactiveBool = includeInactive === 'true' || includeInactive === true;

    // Get categories from database
    const categories = includeInactiveBool
      ? await ServiceCategory.find({}).sort({ displayOrder: 1, name: 1 })
      : await ServiceCategory.getActiveCategories();
    
    // Convert to object format for compatibility
    const categoryDefinitions = {};
    categories.forEach(cat => {
      categoryDefinitions[cat.key] = {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        subcategories: cat.subcategories || []
      };
    });

    // If stats are not needed, return just category definitions
    if (includeStats !== 'true' && includeStats !== true) {
      return res.status(200).json({
        success: true,
        message: 'Service categories retrieved successfully',
        data: categories.map(cat => ({
          key: cat.key,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          subcategories: cat.subcategories || [],
          displayOrder: cat.displayOrder,
          metadata: cat.metadata
        }))
      });
    }

    // Get statistics for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const categoryKey = category.key;
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
          name: category.name,
          description: category.description,
          icon: category.icon,
          subcategories: category.subcategories || [],
          displayOrder: category.displayOrder,
          metadata: category.metadata,
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

    // Get category from database
    const categoryData = await ServiceCategory.getByKey(category);
    
    if (!categoryData) {
      // Get all valid categories for error message
      const allCategories = await ServiceCategory.getActiveCategories();
      const validCategories = allCategories.map(cat => cat.key);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories
      });
    }

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
    const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
    // Validate category ObjectId
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    const categoryObjectId = new mongoose.Types.ObjectId(category);
    const matchingProfessionalInfos = await ProviderProfessionalInfo.find({
      'specialties': {
        $elemMatch: {
          category: categoryObjectId
        }
      }
    });
    const providerIds = matchingProfessionalInfos.map(pi => pi.provider);
    const providerCount = await Provider.countDocuments({
      _id: { $in: providerIds },
      status: 'active'
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

    const categoryInfo = {
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      subcategories: categoryData.subcategories || []
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

// @desc    Admin list service categories (with inactive support)
// @route   GET /api/marketplace/services/categories/manage
// @access  Private (Admin)
const listServiceCategoriesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      includeInactive = 'true',
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = {};
    if (!(includeInactive === 'true' || includeInactive === true)) {
      filter.isActive = true;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { key: regex },
        { description: regex }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [categories, total] = await Promise.all([
      ServiceCategory.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ServiceCategory.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Service categories retrieved successfully',
      data: categories,
      pagination: createPagination(pageNum, limitNum, total)
    });
  } catch (error) {
    logger.error('Failed to list service categories', error);
    return sendServerError(res, error, 'Failed to retrieve service categories', 'CATEGORIES_LIST_ERROR');
  }
};

// @desc    Create a service category
// @route   POST /api/marketplace/services/categories
// @access  Private (Admin)
const createServiceCategory = async (req, res) => {
  try {
    const {
      key,
      name,
      description,
      icon,
      subcategories = [],
      isActive = true,
      displayOrder = 0,
      metadata = {}
    } = req.body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category key is required'
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const normalizedKey = normalizeCategoryKey(key);
    const existing = await ServiceCategory.findOne({ key: normalizedKey });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Category key already exists'
      });
    }

    const category = await ServiceCategory.create({
      key: normalizedKey,
      name: name.trim(),
      description,
      icon,
      subcategories: sanitizeSubcategories(subcategories),
      isActive: typeof isActive === 'string' ? isActive === 'true' : !!isActive,
      displayOrder: Number(displayOrder) || 0,
      metadata: sanitizeMetadata(metadata) || {}
    });

    return res.status(201).json({
      success: true,
      message: 'Service category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Failed to create service category', error);
    return sendServerError(res, error, 'Failed to create service category', 'CREATE_CATEGORY_ERROR');
  }
};

// @desc    Update a service category
// @route   PUT /api/marketplace/services/categories/:id
// @access  Private (Admin)
const updateServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      key,
      name,
      description,
      icon,
      subcategories,
      isActive,
      displayOrder,
      metadata
    } = req.body;

    const filter = buildServiceCategoryFilter(id);
    if (!filter) {
      return res.status(400).json({
        success: false,
        message: 'Category identifier is required'
      });
    }

    const category = await ServiceCategory.findOne(filter);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (key) {
      if (typeof key !== 'string' || !key.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Category key cannot be empty'
        });
      }
      const normalizedKey = normalizeCategoryKey(key);
      const duplicate = await ServiceCategory.findOne({ 
        key: normalizedKey, 
        _id: { $ne: category._id } 
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another category already uses this key'
        });
      }
      category.key = normalizedKey;
    }

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty'
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (Array.isArray(subcategories)) category.subcategories = sanitizeSubcategories(subcategories);
    if (isActive !== undefined) {
      category.isActive = typeof isActive === 'string' ? isActive === 'true' : !!isActive;
    }
    if (displayOrder !== undefined) {
      const parsedOrder = Number(displayOrder);
      category.displayOrder = Number.isNaN(parsedOrder) ? 0 : parsedOrder;
    }
    if (metadata !== undefined) category.metadata = sanitizeMetadata(metadata) || {};

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Service category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Failed to update service category', error);
    return sendServerError(res, error, 'Failed to update service category', 'UPDATE_CATEGORY_ERROR');
  }
};

// @desc    Delete/deactivate a service category
// @route   DELETE /api/marketplace/services/categories/:id
// @access  Private (Admin)
const deleteServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;

    const filter = buildServiceCategoryFilter(id);
    if (!filter) {
      return res.status(400).json({
        success: false,
        message: 'Category identifier is required'
      });
    }

    const category = await ServiceCategory.findOne(filter);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const shouldHardDelete = hardDelete === 'true' || hardDelete === true;

    if (shouldHardDelete) {
      await category.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Service category permanently deleted'
      });
    }

    if (!category.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Service category already inactive',
        data: category
      });
    }

    category.isActive = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Service category deactivated',
      data: category
    });
  } catch (error) {
    logger.error('Failed to delete service category', error);
    return sendServerError(res, error, 'Failed to delete service category', 'DELETE_CATEGORY_ERROR');
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
    // First, find matching professionalInfo documents
    const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
    const professionalInfoQuery = {};
    
    // Match providers by service category - find providers whose specialties.category matches the service category
    if (service.category) {
      // Validate category ObjectId if it's provided as string
      let categoryObjectId;
      if (typeof service.category === 'string' && mongoose.Types.ObjectId.isValid(service.category)) {
        categoryObjectId = new mongoose.Types.ObjectId(service.category);
      } else if (service.category._id) {
        categoryObjectId = service.category._id;
      } else {
        categoryObjectId = service.category;
      }
      
      professionalInfoQuery.specialties = {
        $elemMatch: {
          category: categoryObjectId
        }
      };
    }
    
    // If no category match, return empty result
    if (!professionalInfoQuery.specialties) {
      return res.json({
        success: true,
        data: [],
        pagination: createPagination(parseInt(page), parseInt(limit), 0)
      });
    }
    
    const matchingProfessionalInfos = await ProviderProfessionalInfo.find(professionalInfoQuery);
    const providerIds = matchingProfessionalInfos.map(pi => pi.provider);
    
    const providerQuery = {
      _id: { $in: providerIds.length > 0 ? providerIds : [] },
      status: 'active'
    };

    // Add rating filter if provided
    if (minRating) {
      const ProviderPerformance = require('../models/ProviderPerformance');
      const matchingPerformances = await ProviderPerformance.find({
        rating: { $gte: parseFloat(minRating) }
      });
      const performanceProviderIds = matchingPerformances.map(p => p.provider);
      if (performanceProviderIds.length > 0) {
        if (providerQuery._id && providerQuery._id.$in) {
          // Combine with existing _id filter
          providerQuery._id.$in = providerQuery._id.$in.filter(id => 
            performanceProviderIds.some(pid => pid.toString() === id.toString())
          );
        } else {
          providerQuery._id = { $in: performanceProviderIds };
        }
      } else {
        providerQuery._id = { $in: [] };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find providers matching the service category
    const providers = await Provider.find(providerQuery)
      .populate('userId', 'firstName lastName email phone profile.avatar')
      .populate('professionalInfo')
      .populate('professionalInfo.specialties.skills', 'name description category metadata')
      .populate('businessInfo')
      .populate('verification', '-backgroundCheck.reportId -insurance.documents')
      .populate('preferences')
      .populate('performance')
      .select('-financialInfo -onboarding')
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
      // Exclude category from specialties in response
      if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
        provider.professionalInfo.specialties = provider.professionalInfo.specialties.map(specialty => {
          // eslint-disable-next-line no-unused-vars
          const { category: _category, ...specialtyWithoutCategory } = specialty;
          return specialtyWithoutCategory;
        });
      }

      // Find the first specialty (or match by skills if needed)
      const matchingSpecialty = provider.professionalInfo?.specialties?.[0];

      return {
        ...provider,
        matchingSpecialty: {
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
          hint: 'Ensure you are using the correct provider ID format'
        });
      }
      
      // Try to convert to ObjectId - this will validate the format
      // Use mongoose.isValidObjectId for validation, then create ObjectId
      if (!mongoose.isValidObjectId(trimmedId)) {
        throw new Error('Invalid ObjectId format');
      }
      providerId = new mongoose.Types.ObjectId(trimmedId);
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

    let provider;
    let user;

    // First, try to find User by ID (query Users collection first)
    user = await User.findById(userIdForLookup)
      .select('firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
      .lean();

    if (user) {
      // User found - now find Provider profile by userId
      logger.info('User found in Users collection, looking up provider profile', {
        userId: user._id,
        userEmail: user.email,
        requestedId: id
      });

      provider = await Provider.findOne({ userId: userIdForLookup })
        .populate('userId', 'firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
        .populate({
          path: 'professionalInfo',
          populate: {
            path: 'specialties.skills',
            select: 'name description category metadata'
          }
        })
        .populate('businessInfo')
        .populate('verification', '-backgroundCheck.reportId -insurance.documents')
        .populate('preferences')
        .populate('performance')
        .select('-financialInfo -onboarding')
        .lean();
      
      if (provider) {
        logger.info('Provider found by userId from Users collection', {
          userId: id,
          providerId: provider._id,
          providerStatus: provider.status
        });
      }
    } else {
      // User not found - try Provider ID directly
      logger.info('User not found, trying provider ID lookup', {
        requestedId: id,
        providerId: providerId.toString()
      });

      provider = await Provider.findById(providerId)
        .populate('userId', 'firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
        .populate({
          path: 'professionalInfo',
          populate: {
            path: 'specialties.skills',
            select: 'name description category metadata'
          }
        })
        .populate('businessInfo')
        .populate('verification', '-backgroundCheck.reportId -insurance.documents')
        .populate('preferences')
        .populate('performance')
        .select('-financialInfo -onboarding')
        .lean();

      if (provider && provider.userId) {
        user = provider.userId;
      }

      logger.info('Provider lookup attempt', {
        requestedId: id,
        foundById: !!provider,
        providerId: provider?._id,
        providerStatus: provider?.status
      });
    }

    if (!provider) {
      // If we already checked for user, use that info
      if (user) {
        logger.warn('User exists but no provider profile found', {
          requestedId: id,
          userId: user._id,
          userEmail: user.email
        });
        
        return res.status(404).json({
          success: false,
          message: 'Provider profile not found',
          error: 'User exists but does not have a provider profile',
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          hint: 'This user ID exists but no provider profile has been created. The user may need to complete provider registration.'
        });
      }
      
      logger.warn('Provider not found - ID does not exist as provider or user', {
        requestedId: id,
        providerId: providerId.toString()
      });
      
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
        hint: 'The ID does not exist as a User ID or Provider ID. Please verify the ID and try again.'
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

    // Get verification, preferences, businessInfo, professionalInfo, and performance data
    // Since provider is fetched with .lean(), populated references are plain objects (not Mongoose documents)
    // We use the populated data directly, or fetch if not populated
    const ProviderVerification = require('../models/ProviderVerification');
    const ProviderPreferences = require('../models/ProviderPreferences');
    const ProviderBusinessInfo = require('../models/ProviderBusinessInfo');
    const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
    const ProviderPerformance = require('../models/ProviderPerformance');

    // Helper function to check if a reference is populated (has expected fields) or is just an ObjectId
    const isPopulated = (ref, expectedField) => {
      return ref && typeof ref === 'object' && ref[expectedField] !== undefined;
    };

    // Get verification - use populated if available, otherwise fetch
    let verification = isPopulated(provider.verification, 'identityVerified') 
      ? provider.verification 
      : await ProviderVerification.findOne({ provider: provider._id }).lean();

    // Get preferences - use populated if available, otherwise fetch
    let preferences = isPopulated(provider.preferences, 'notificationSettings')
      ? provider.preferences
      : await ProviderPreferences.findOne({ provider: provider._id }).lean();

    // Get businessInfo - only for business/agency providers
    let businessInfo = null;
    if (provider.providerType !== 'individual') {
      businessInfo = isPopulated(provider.businessInfo, 'businessName')
        ? provider.businessInfo
        : await ProviderBusinessInfo.findOne({ provider: provider._id }).lean();
    }

    // Get professionalInfo - use populated if available, otherwise fetch
    let professionalInfo = isPopulated(provider.professionalInfo, 'specialties')
      ? provider.professionalInfo
      : await ProviderProfessionalInfo.findOne({ provider: provider._id })
          .populate({
            path: 'specialties.skills',
            select: 'name description category metadata',
            populate: {
              path: 'category',
              select: 'name key description'
            }
          })
          .lean();
    
    // Ensure skills are populated even if professionalInfo was already populated from provider query
    if (professionalInfo && professionalInfo.specialties && Array.isArray(professionalInfo.specialties)) {
      // Check if any specialty has skills that are not populated (ObjectIds instead of objects)
      const hasUnpopulatedSkills = professionalInfo.specialties.some(specialty => {
        if (!specialty.skills || !Array.isArray(specialty.skills) || specialty.skills.length === 0) {
          return false;
        }
        // Check if first skill is an ObjectId (string) or empty object without name
        const firstSkill = specialty.skills[0];
        return typeof firstSkill === 'string' || 
               (typeof firstSkill === 'object' && firstSkill._id && !firstSkill.name);
      });
      
      if (hasUnpopulatedSkills) {
        // Skills are ObjectIds, need to populate them
        const professionalInfoId = professionalInfo._id || (typeof professionalInfo === 'string' ? professionalInfo : null);
        if (professionalInfoId) {
          const professionalInfoDoc = await ProviderProfessionalInfo.findById(professionalInfoId)
            .populate({
              path: 'specialties.skills',
              select: 'name description category metadata',
              populate: {
                path: 'category',
                select: 'name key description'
              }
            })
            .lean();
          if (professionalInfoDoc) {
            professionalInfo = professionalInfoDoc;
          }
        }
      }
      
      // Normalize skills arrays - ensure they're always arrays (never undefined) and populate if needed
      professionalInfo.specialties = await Promise.all(professionalInfo.specialties.map(async (specialty) => {
        let skills = Array.isArray(specialty.skills) ? specialty.skills : [];
        
        // If skills are still ObjectIds, manually populate them
        if (skills.length > 0 && (typeof skills[0] === 'string' || (typeof skills[0] === 'object' && skills[0]._id && !skills[0].name))) {
          const ProviderSkill = require('../models/ProviderSkill');
          const skillIds = skills.map(s => typeof s === 'string' ? s : s._id || s);
          const populatedSkills = await ProviderSkill.find({ _id: { $in: skillIds } })
            .select('name description category metadata')
            .populate('category', 'name key description')
            .lean();
          
          // Map back to original order
          skills = skillIds.map(id => {
            const skill = populatedSkills.find(s => s._id.toString() === id.toString());
            return skill || id;
          });
        }
        
        // Exclude category from response
        // eslint-disable-next-line no-unused-vars
        const { category: _category, ...specialtyWithoutCategory } = specialty;
        return {
          ...specialtyWithoutCategory,
          skills: skills
        };
      }));
    }

    // Get performance - use populated if available, otherwise fetch
    let performance = isPopulated(provider.performance, 'rating')
      ? provider.performance
      : await ProviderPerformance.findOne({ provider: provider._id }).lean();

    // Create summary objects for preferences and businessInfo (since they're plain objects now)
    const preferencesSummary = preferences ? {
      notificationSettings: preferences.notificationSettings || {},
      jobPreferences: preferences.jobPreferences || {},
      communicationPreferences: preferences.communicationPreferences || {}
    } : null;
    
    const businessInfoSummary = businessInfo ? {
      businessName: businessInfo.businessName,
      businessType: businessInfo.businessType,
      businessAddress: businessInfo.businessAddress ? {
        city: businessInfo.businessAddress.city,
        state: businessInfo.businessAddress.state,
        country: businessInfo.businessAddress.country,
        coordinates: businessInfo.businessAddress.coordinates
      } : null,
      businessPhone: businessInfo.businessPhone,
      businessEmail: businessInfo.businessEmail,
      website: businessInfo.website,
      yearEstablished: businessInfo.yearEstablished,
      numberOfEmployees: businessInfo.numberOfEmployees,
      isComplete: !!(businessInfo.businessName && businessInfo.businessAddress && businessInfo.businessAddress.city && businessInfo.businessAddress.state)
    } : null;
    
    // Initialize response data
    const providerDetails = {
      provider: {
        id: provider._id,
        userId: provider.userId,
        user: user || provider.userId, // Include extended user data
        userProfile: user || provider.userId, // Alias for user data
        providerType: provider.providerType,
        status: provider.status,
        businessInfo: businessInfoSummary,
        professionalInfo: professionalInfo || null,
        verification: {
          identityVerified: verification?.identityVerified || false,
          businessVerified: verification?.businessVerified || false,
          backgroundCheck: {
            status: verification?.backgroundCheck?.status || 'pending'
          },
          insurance: {
            hasInsurance: verification?.insurance?.hasInsurance || false,
            coverageAmount: verification?.insurance?.coverageAmount || null
          },
          licenses: verification?.licenses?.map(license => ({
            type: license.type,
            number: license.number,
            issuingAuthority: license.issuingAuthority,
            expiryDate: license.expiryDate
          })) || [],
          portfolio: verification?.portfolio || null
        },
        performance: performance ? {
          rating: performance.rating || 0,
          totalReviews: performance.totalReviews || 0,
          totalJobs: performance.totalJobs || 0,
          completedJobs: performance.completedJobs || 0,
          cancelledJobs: performance.cancelledJobs || 0,
          responseTime: performance.responseTime || 0,
          completionRate: performance.completionRate || 0,
          repeatCustomerRate: performance.repeatCustomerRate || 0,
          earnings: performance.earnings || {
            total: 0,
            thisMonth: 0,
            lastMonth: 0,
            pending: 0
          },
          badges: performance.badges || []
        } : {},
        preferences: preferencesSummary || {},
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

    // Always get provider's services - ensure they are populated
    // Filter by active status by default, but can be controlled via query param
    const serviceFilter = { provider: actualUserId };
    
    // By default, show active services. Set includeServices=false to show all
    if (includeServices !== 'false' && includeServices !== false) {
      serviceFilter.isActive = true;
    }
    
    const services = await Service.find(serviceFilter)
      .select('title description category subcategory pricing serviceType estimatedDuration teamSize equipmentProvided materialsIncluded features requirements availability warranty insurance emergencyService servicePackages addOns rating images serviceArea isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50) // Increased limit to show more services
      .lean();

    // Always include services in response
    providerDetails.services = services || [];
    providerDetails.serviceCount = services.length;
    
    // Also add total service count (including inactive) for reference
    const totalServiceCount = await Service.countDocuments({ provider: actualUserId });
    providerDetails.totalServiceCount = totalServiceCount;

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
        averageRating: performance?.rating || 0,
        totalReviews: performance?.totalReviews || 0,
        responseRate: performance?.completionRate || 0,
        averageResponseTime: performance?.responseTime || null
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
    await Provider.findByIdAndUpdate(provider._id, {
      $inc: { 'metadata.profileViews': 1 }
    });

    logger.info('Provider details retrieved with extended user data', {
      providerId: provider._id,
      userId: actualUserId,
      userFound: !!user,
      includeServices,
      includeReviews,
      includeStatistics,
      requestedId: id
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

// @desc    Get all services of a provider
// @route   GET /api/marketplace/providers/:providerId/services
// @access  Public
const getProviderServices = async (req, res) => {
  try {
    const { providerId } = req.params;
    const {
      category,
      status = 'all', // all, active, inactive
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(providerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider ID format'
      });
    }

    // Convert to ObjectId for consistent querying
    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    // Build filter object
    const filter = { provider: providerObjectId };

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
      .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Service.countDocuments(filter);

    // Get provider info for response
    const provider = await User.findById(providerObjectId)
      .select('firstName lastName profile.avatar profile.rating')
      .lean();

    // Get additional statistics for the provider
    const stats = await Service.aggregate([
      { $match: { provider: providerObjectId } },
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

    const providerStats = stats.length > 0 ? stats[0] : {
      totalServices: 0,
      activeServices: 0,
      inactiveServices: 0,
      averageRating: 0,
      totalBookings: 0
    };

    const pagination = createPagination(parseInt(page), parseInt(limit), total);

    logger.info('Provider services retrieved', {
      providerId,
      totalServices: total,
      returnedServices: services.length
    });

    return res.status(200).json({
      success: true,
      message: 'Provider services retrieved successfully',
      data: {
        services,
        provider: provider || null,
        pagination,
        stats: providerStats
      }
    });
  } catch (error) {
    logger.error('Failed to get provider services', error, {
      providerId: req.params.providerId
    });
    return sendServerError(res, error, 'Failed to retrieve provider services', 'PROVIDER_SERVICES_ERROR');
  }
};

module.exports = {
  getServices,
  getService,
  getNearbyServices,
  getServiceCategories,
  getCategoryDetails,
  listServiceCategoriesAdmin,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  createService,
  updateService,
  deleteService,
  uploadServiceImages,
  createBooking,
  getBooking,
  getBookings,
  updateBookingStatus,
  uploadBookingPhotos,
  addReview,
  approvePayPalBooking,
  getPayPalOrderDetails,
  getMyServices,
  getMyBookings,
  getProvidersForService,
  getProviderDetails,
  getProviderServices,
  deactivateService,
  activateService
};
