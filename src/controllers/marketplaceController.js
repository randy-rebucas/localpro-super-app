const { Service, Booking } = require('../models/Marketplace');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const logger = require('../config/logger');

// Placeholder functions - to be implemented
const getServices = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getNearbyServices = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getServiceCategories = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getCategoryDetails = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const listServiceCategoriesAdmin = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const createServiceCategory = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const updateServiceCategory = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const deleteServiceCategory = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

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

    logger.debug('Create service - Raw request data', {
      userId: req.user.id,
      body: req.body,
      bodyType: typeof req.body,
      bodyStringified: JSON.stringify(req.body, null, 2),
      files: req.files ? req.files.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })) : null
    });

    // Handle both JSON and multipart/form-data
    const contentType = req.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    logger.debug('Create service - Content type detection', {
      contentType,
      isMultipart
    });
    
    // Parse service data from body
    let serviceData;
    if (isMultipart) {
      // For multipart/form-data, parse JSON fields if they're strings
      serviceData = { ...req.body };
      
      logger.debug('Create service - Parsing multipart data', {
        rawBody: req.body,
        parsedFields: Object.keys(serviceData)
      });
      
      // Parse JSON fields that might be sent as strings in form-data
      const jsonFields = ['pricing', 'availability', 'serviceArea', 'estimatedDuration', 'warranty', 'insurance', 'emergencyService', 'servicePackages', 'addOns'];
      jsonFields.forEach(field => {
        if (serviceData[field] && typeof serviceData[field] === 'string') {
          try {
            const originalValue = serviceData[field];
            serviceData[field] = JSON.parse(serviceData[field]);
            logger.debug(`Create service - Parsed ${field} from JSON string`, {
              field,
              original: originalValue,
              parsed: serviceData[field]
            });
          } catch (e) {
            // If parsing fails, keep original value
            logger.warn(`Failed to parse ${field} as JSON`, { 
              field,
              value: serviceData[field],
              error: e.message 
            });
          }
        }
      });
    } else {
      // For JSON requests, use body directly
      serviceData = { ...req.body };
      logger.debug('Create service - Using JSON body directly', {
        serviceDataKeys: Object.keys(serviceData)
      });
    }

    logger.debug('Create service - Parsed service data', {
      serviceData: JSON.stringify(serviceData, null, 2),
      serviceAreaType: typeof serviceData.serviceArea,
      serviceAreaValue: serviceData.serviceArea
    });

    // Validate all required fields before attempting to create
    const { title, description, category, subcategory, pricing, serviceArea } = serviceData;
    const validationErrors = [];

    logger.debug('Create service - Validating required fields', {
      title: title ? `${title.substring(0, 50)}...` : null,
      titleType: typeof title,
      hasDescription: !!description,
      descriptionType: typeof description,
      category,
      categoryType: typeof category,
      hasSubcategory: !!subcategory,
      subcategoryType: typeof subcategory,
      hasPricing: !!pricing,
      pricingType: typeof pricing,
      hasServiceArea: !!serviceArea,
      serviceAreaType: typeof serviceArea
    });

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      validationErrors.push({
        field: 'title',
        message: 'Service title is required and must be a non-empty string',
        code: 'TITLE_REQUIRED'
      });
    }

    // Validate description
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      validationErrors.push({
        field: 'description',
        message: 'Service description is required and must be a non-empty string',
        code: 'DESCRIPTION_REQUIRED'
      });
    }

    // Validate category
    const validCategories = [
      'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
      'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
      'appliance_repair', 'locksmith', 'handyman', 'home_security',
      'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
      'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
    ];
    if (!category || typeof category !== 'string' || !validCategories.includes(category)) {
      validationErrors.push({
        field: 'category',
        message: `Service category is required and must be one of: ${validCategories.join(', ')}`,
        code: 'CATEGORY_REQUIRED'
      });
    }

    // Validate subcategory
    if (!subcategory || typeof subcategory !== 'string' || subcategory.trim().length === 0) {
      validationErrors.push({
        field: 'subcategory',
        message: 'Service subcategory is required and must be a non-empty string',
        code: 'SUBCATEGORY_REQUIRED'
      });
    }

    // Validate pricing
    if (!pricing || typeof pricing !== 'object') {
      validationErrors.push({
        field: 'pricing',
        message: 'Pricing information is required',
        code: 'PRICING_REQUIRED'
      });
    } else {
      if (!pricing.type || !['hourly', 'fixed', 'per_sqft', 'per_item'].includes(pricing.type)) {
        validationErrors.push({
          field: 'pricing.type',
          message: 'Pricing type is required and must be one of: hourly, fixed, per_sqft, per_item',
          code: 'PRICING_TYPE_INVALID'
        });
      }
      if (!pricing.basePrice || typeof pricing.basePrice !== 'number' || pricing.basePrice <= 0) {
        validationErrors.push({
          field: 'pricing.basePrice',
          message: 'Pricing basePrice is required and must be a positive number',
          code: 'PRICING_BASE_PRICE_INVALID'
        });
      }
    }

    // Validate serviceArea - new simplified format with coordinates and radius
    if (!serviceArea) {
      validationErrors.push({
        field: 'serviceArea',
        message: 'Service area is required',
        code: 'SERVICE_AREA_REQUIRED'
      });
    } else if (typeof serviceArea !== 'object' || Array.isArray(serviceArea)) {
      validationErrors.push({
        field: 'serviceArea',
        message: 'Service area must be an object with coordinates and radius',
        code: 'SERVICE_AREA_INVALID'
      });
    } else {
      // Validate coordinates
      if (!serviceArea.coordinates || typeof serviceArea.coordinates !== 'object') {
        validationErrors.push({
          field: 'serviceArea.coordinates',
          message: 'Service area coordinates are required',
          code: 'SERVICE_AREA_COORDINATES_REQUIRED'
        });
      } else {
        if (typeof serviceArea.coordinates.lat !== 'number' || 
            serviceArea.coordinates.lat < -90 || 
            serviceArea.coordinates.lat > 90) {
          validationErrors.push({
            field: 'serviceArea.coordinates.lat',
            message: 'Latitude must be a number between -90 and 90',
            code: 'SERVICE_AREA_LAT_INVALID'
          });
        }
        if (typeof serviceArea.coordinates.lng !== 'number' || 
            serviceArea.coordinates.lng < -180 || 
            serviceArea.coordinates.lng > 180) {
          validationErrors.push({
            field: 'serviceArea.coordinates.lng',
            message: 'Longitude must be a number between -180 and 180',
            code: 'SERVICE_AREA_LNG_INVALID'
          });
        }
      }
      
      // Validate radius
      if (typeof serviceArea.radius !== 'number' || 
          serviceArea.radius < 1 || 
          serviceArea.radius > 1000) {
        validationErrors.push({
          field: 'serviceArea.radius',
          message: 'Service radius must be a number between 1 and 1000 kilometers',
          code: 'SERVICE_AREA_RADIUS_INVALID'
        });
      }
      
      // If address is provided instead of coordinates, geocode it
      if (serviceArea.address && !serviceArea.coordinates) {
        try {
          logger.debug('Create service - Geocoding service area address', {
            address: serviceArea.address
          });
          const geocodeResult = await GoogleMapsService.geocodeAddress(serviceArea.address);
          if (geocodeResult.success && geocodeResult.coordinates) {
            serviceArea.coordinates = geocodeResult.coordinates;
            // Set default radius if not provided (50km default)
            if (!serviceArea.radius) {
              serviceArea.radius = 50;
            }
            // Remove address field as it's not part of the schema
            delete serviceArea.address;
            logger.debug('Create service - Geocoded successfully', {
              coordinates: serviceArea.coordinates,
              radius: serviceArea.radius
            });
          } else {
            validationErrors.push({
              field: 'serviceArea.address',
              message: 'Failed to geocode the provided address. Please provide coordinates directly.',
              code: 'SERVICE_AREA_GEOCODE_FAILED'
            });
          }
        } catch (geocodeError) {
          logger.warn('Failed to geocode service area', {
            address: serviceArea.address,
            error: geocodeError.message
          });
          validationErrors.push({
            field: 'serviceArea.address',
            message: 'Failed to geocode the provided address. Please provide coordinates directly.',
            code: 'SERVICE_AREA_GEOCODE_FAILED'
          });
        }
      }
      
      // Ensure radius has a default if not provided
      if (serviceArea.coordinates && !serviceArea.radius) {
        serviceArea.radius = 50; // Default 50 km radius
        logger.debug('Create service - Set default radius', {
          radius: serviceArea.radius
        });
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      logger.warn('Create service - Validation failed', {
        validationErrors,
        serviceData: JSON.stringify(serviceData, null, 2)
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: validationErrors
      });
    }

    // Set provider
    serviceData.provider = req.user.id;
    logger.debug('Create service - Set provider', {
      provider: serviceData.provider
    });

    // Remove any file-related fields that shouldn't be in the service document
    delete serviceData.images;
    delete serviceData.files;
    delete serviceData.file;
    logger.debug('Create service - Cleaned service data', {
      serviceDataKeys: Object.keys(serviceData),
      hasServiceArea: !!serviceData.serviceArea
    });

    logger.debug('Create service - Final service data before save', {
      serviceData: JSON.stringify(serviceData, null, 2),
      serviceAreaFinal: serviceData.serviceArea
    });

    // Create the service
    logger.debug('Create service - Creating service in database');
    const service = await Service.create(serviceData);
    logger.debug('Create service - Service created', {
      serviceId: service._id,
      serviceTitle: service.title,
      serviceCategory: service.category,
      serviceArea: service.serviceArea
    });

    // Upload images if provided
    if (req.files && req.files.length > 0) {
      logger.debug('Create service - Uploading images', {
        filesCount: req.files.length
      });
      
      try {
        const uploadResult = await CloudinaryService.uploadMultipleFiles(
          req.files, 
          'localpro/marketplace'
        );

        if (uploadResult.success && uploadResult.data && uploadResult.data.length > 0) {
          if (!service.images) {
            service.images = [];
          }

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
              imagesCount: newImages.length
            });
          }
        }
      } catch (imageError) {
        logger.error('Error uploading images during service creation', {
          serviceId: service._id,
          error: imageError.message
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
        message: err.message,
        value: err.value,
        kind: err.kind
      }));

      logger.error('Create service - Mongoose validation error', {
        errors
      });

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

const updateService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const deleteService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const uploadServiceImages = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const createBooking = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getBooking = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getBookings = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const updateBookingStatus = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const uploadBookingPhotos = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const addReview = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const approvePayPalBooking = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getPayPalOrderDetails = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getMyServices = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getMyBookings = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getProvidersForService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getProviderDetails = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getProviderServices = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const deactivateService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const activateService = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
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

