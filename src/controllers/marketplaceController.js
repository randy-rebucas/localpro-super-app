const { Service, Booking } = require('../models/Marketplace');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const PayPalService = require('../services/paypalService');
const NotificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const { ReadPreference } = require('mongodb');
const logger = require('../config/logger');

const { 
  sendPaginated, 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  createPagination 
} = require('../utils/responseHelper');
const { 
  validatePagination, 
  validateObjectId
} = require('../utils/controllerValidation');
const { bookingSchema } = require('../utils/validation');

// @desc    Get all services
// @route   GET /api/marketplace/services
// @access  Public
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
      // If location is coordinates (lat,lng or lng,lat format)
      if (typeof location === 'string' && location.includes(',')) {
        const coords = location.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          // Assume format is lat,lng (most common)
          const [lat, lng] = coords;
          // Use geospatial query to find services within their service radius
          // Note: This requires a 2dsphere index on serviceArea.coordinates
          // We'll find services where the location is within the service's radius
          const maxDistance = 100000; // 100km max search radius in meters
          filter['serviceArea.coordinates'] = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
              },
              $maxDistance: maxDistance
            }
          };
        }
      } else {
        // Text-based location search - would need geocoding
        // For now, skip text-based location search
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

// @desc    Get single service
// @route   GET /api/marketplace/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id)
      .populate('provider', 'firstName lastName profile.avatar profile.businessName profile.bio profile.rating profile.experience')
      .select('-__v');

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    return sendSuccess(res, service, 'Service retrieved successfully');
  } catch (error) {
    logger.error('Get service error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve service', 'SERVICE_RETRIEVAL_ERROR');
  }
};

// @desc    Get nearby services
// @route   GET /api/marketplace/services/nearby
// @access  Public
const getNearbyServices = async (req, res) => {
  try {
    const { lat, lng, radius = 50, category } = req.query;

    // Validate coordinates
    if (!lat || !lng) {
      return sendValidationError(res, [{
        field: 'lat/lng',
        message: 'Latitude and longitude are required',
        code: 'COORDINATES_REQUIRED'
      }]);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return sendValidationError(res, [{
        field: 'lat',
        message: 'Latitude must be a number between -90 and 90',
        code: 'INVALID_LATITUDE'
      }]);
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return sendValidationError(res, [{
        field: 'lng',
        message: 'Longitude must be a number between -180 and 180',
        code: 'INVALID_LONGITUDE'
      }]);
    }

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filter = {
      isActive: true,
      'serviceArea.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      }
    };

    if (category) {
      filter.category = category;
    }

    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.businessName profile.rating')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    logger.info('Nearby services retrieved', {
      lat: latitude,
      lng: longitude,
      radius: radiusKm,
      total,
      count: services.length
    });

    return sendPaginated(res, services, pagination, 'Nearby services retrieved successfully');
  } catch (error) {
    logger.error('Get nearby services error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve nearby services', 'NEARBY_SERVICES_ERROR');
  }
};

// @desc    Get service categories
// @route   GET /api/marketplace/services/categories
// @access  Public
const getServiceCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.getActiveCategories();
    
    // Transform to include id field
    const formattedCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      key: cat.key,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      subcategories: cat.subcategories,
      displayOrder: cat.displayOrder,
      metadata: cat.metadata
    }));

    return sendSuccess(res, {
      categories: formattedCategories,
      count: formattedCategories.length
    }, 'Service categories retrieved successfully');
  } catch (error) {
    logger.error('Get service categories error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve service categories', 'CATEGORIES_RETRIEVAL_ERROR');
  }
};

// @desc    Get category details
// @route   GET /api/marketplace/services/categories/:category
// @access  Public
const getCategoryDetails = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Try to find by key first (case-insensitive)
    let categoryDoc = await ServiceCategory.getByKey(category);
    
    // If not found by key, try to find by name
    if (!categoryDoc) {
      categoryDoc = await ServiceCategory.findOne({
        name: { $regex: new RegExp(`^${category}$`, 'i') },
        isActive: true
      });
    }

    if (!categoryDoc) {
      return sendNotFoundError(res, 'Category not found', 'CATEGORY_NOT_FOUND');
    }

    const formattedCategory = {
      id: categoryDoc._id.toString(),
      key: categoryDoc.key,
      name: categoryDoc.name,
      description: categoryDoc.description,
      icon: categoryDoc.icon,
      subcategories: categoryDoc.subcategories,
      displayOrder: categoryDoc.displayOrder,
      metadata: categoryDoc.metadata
    };

    return sendSuccess(res, formattedCategory, 'Category details retrieved successfully');
  } catch (error) {
    logger.error('Get category details error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve category details', 'CATEGORY_DETAILS_ERROR');
  }
};

// @desc    List all service categories (Admin)
// @route   GET /api/marketplace/services/categories/manage
// @access  Private (Admin)
const listServiceCategoriesAdmin = async (req, res) => {
  try {
    const { isActive } = req.query;

    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (pageNum - 1) * limitNum;

    const categories = await ServiceCategory.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await ServiceCategory.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, categories, pagination, 'Service categories retrieved successfully');
  } catch (error) {
    logger.error('List service categories admin error', {
      error: error.message,
      stack: error.stack
    });
    return sendServerError(res, error, 'Failed to retrieve service categories', 'CATEGORIES_LIST_ERROR');
  }
};

// @desc    Create service category (Admin)
// @route   POST /api/marketplace/services/categories
// @access  Private (Admin)
const createServiceCategory = async (req, res) => {
  try {
    const { key, name, description, icon, subcategories, displayOrder, metadata } = req.body;

    // Validation
    if (!key || !name) {
      return sendValidationError(res, [{
        field: 'key/name',
        message: 'Key and name are required',
        code: 'REQUIRED_FIELDS_MISSING'
      }]);
    }

    // Check if category with same key exists
    const existingCategory = await ServiceCategory.findOne({ key: key.toLowerCase() });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this key already exists',
        code: 'CATEGORY_EXISTS'
      });
    }

    const category = await ServiceCategory.create({
      key: key.toLowerCase(),
      name,
      description,
      icon,
      subcategories: subcategories || [],
      displayOrder: displayOrder || 0,
      metadata: metadata || {},
      isActive: true
    });

    logger.info('Service category created', {
      categoryId: category._id,
      key: category.key,
      adminId: req.user.id
    });

    return sendSuccess(res, category, 'Service category created successfully', 201);
  } catch (error) {
    logger.error('Create service category error', {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id
    });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Category with this key already exists',
        code: 'CATEGORY_EXISTS'
      });
    }

    return sendServerError(res, error, 'Failed to create service category', 'CATEGORY_CREATE_ERROR');
  }
};

// @desc    Update service category (Admin)
// @route   PUT /api/marketplace/services/categories/:id
// @access  Private (Admin)
const updateServiceCategory = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return sendNotFoundError(res, 'Service category not found', 'CATEGORY_NOT_FOUND');
    }

    const { name, description, icon, subcategories, displayOrder, isActive, metadata } = req.body;

    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (subcategories !== undefined) category.subcategories = subcategories;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;
    if (metadata !== undefined) category.metadata = { ...category.metadata, ...metadata };

    await category.save();

    logger.info('Service category updated', {
      categoryId: category._id,
      adminId: req.user.id
    });

    return sendSuccess(res, category, 'Service category updated successfully');
  } catch (error) {
    logger.error('Update service category error', {
      error: error.message,
      stack: error.stack,
      categoryId: req.params.id,
      adminId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to update service category', 'CATEGORY_UPDATE_ERROR');
  }
};

// @desc    Delete service category (Admin)
// @route   DELETE /api/marketplace/services/categories/:id
// @access  Private (Admin)
const deleteServiceCategory = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return sendNotFoundError(res, 'Service category not found', 'CATEGORY_NOT_FOUND');
    }

    // Check if category is used by any services
    const servicesCount = await Service.countDocuments({ category: category.key });
    if (servicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${servicesCount} service(s)`,
        code: 'CATEGORY_IN_USE'
      });
    }

    await ServiceCategory.findByIdAndDelete(req.params.id);

    logger.info('Service category deleted', {
      categoryId: req.params.id,
      adminId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Service category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete service category error', {
      error: error.message,
      stack: error.stack,
      categoryId: req.params.id,
      adminId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to delete service category', 'CATEGORY_DELETE_ERROR');
  }
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
      // Validate coordinates - support both {lat, lng} and GeoJSON [lng, lat] formats
      if (!serviceArea.coordinates) {
        validationErrors.push({
          field: 'serviceArea.coordinates',
          message: 'Service area coordinates are required',
          code: 'SERVICE_AREA_COORDINATES_REQUIRED'
        });
      } else {
        // Check if it's GeoJSON format [lng, lat] array
        if (Array.isArray(serviceArea.coordinates)) {
          if (serviceArea.coordinates.length !== 2) {
            validationErrors.push({
              field: 'serviceArea.coordinates',
              message: 'Coordinates must be an array of [longitude, latitude]',
              code: 'SERVICE_AREA_COORDINATES_INVALID'
            });
          } else {
            const [lng, lat] = serviceArea.coordinates;
            if (typeof lng !== 'number' || lng < -180 || lng > 180) {
              validationErrors.push({
                field: 'serviceArea.coordinates[0]',
                message: 'Longitude must be a number between -180 and 180',
                code: 'SERVICE_AREA_LNG_INVALID'
              });
            }
            if (typeof lat !== 'number' || lat < -90 || lat > 90) {
              validationErrors.push({
                field: 'serviceArea.coordinates[1]',
                message: 'Latitude must be a number between -90 and 90',
                code: 'SERVICE_AREA_LAT_INVALID'
              });
            }
          }
        } 
        // Check if it's {lat, lng} format (will be converted to GeoJSON)
        else if (typeof serviceArea.coordinates === 'object') {
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
        } else {
          validationErrors.push({
            field: 'serviceArea.coordinates',
            message: 'Coordinates must be an object with lat/lng or an array [lng, lat]',
            code: 'SERVICE_AREA_COORDINATES_INVALID'
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
            // Convert to GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
            serviceArea.coordinates = {
              type: 'Point',
              coordinates: [
                geocodeResult.coordinates.lng,
                geocodeResult.coordinates.lat
              ]
            };
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

    // Convert serviceArea coordinates to GeoJSON format if needed
    if (serviceData.serviceArea && serviceData.serviceArea.coordinates) {
      // If coordinates are in {lat, lng} format, convert to GeoJSON [lng, lat]
      if (serviceData.serviceArea.coordinates.lat !== undefined && 
          serviceData.serviceArea.coordinates.lng !== undefined) {
        const { lat, lng } = serviceData.serviceArea.coordinates;
        serviceData.serviceArea.coordinates = {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
        };
        logger.debug('Create service - Converted coordinates to GeoJSON', {
          original: { lat, lng },
          geojson: serviceData.serviceArea.coordinates
        });
      }
      // If coordinates are already an array, ensure they're in GeoJSON format
      else if (Array.isArray(serviceData.serviceArea.coordinates)) {
        serviceData.serviceArea.coordinates = {
          type: 'Point',
          coordinates: serviceData.serviceArea.coordinates
        };
      }
    }

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

// @desc    Update service
// @route   PUT /api/marketplace/services/:id
// @access  Private (Provider/Admin)
const updateService = async (req, res) => {
  try {
    logger.info('Update service request', {
      serviceId: req.params.id,
      userId: req.user.id,
      contentType: req.get('content-type'),
      bodyKeys: Object.keys(req.body || {})
    });

    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    let service = await Service.findById(req.params.id);

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service',
        code: 'UNAUTHORIZED'
      });
    }

    // Handle both JSON and multipart/form-data
    const contentType = req.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    let updateData;
    if (isMultipart) {
      updateData = { ...req.body };
      const jsonFields = ['pricing', 'availability', 'serviceArea', 'estimatedDuration', 'warranty', 'insurance', 'emergencyService', 'servicePackages', 'addOns'];
      jsonFields.forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string') {
          try {
            updateData[field] = JSON.parse(updateData[field]);
          } catch (e) {
            logger.warn(`Failed to parse ${field} as JSON`, { value: updateData[field] });
          }
        }
      });
    } else {
      updateData = { ...req.body };
    }

    // Remove protected fields
    delete updateData._id;
    delete updateData.provider;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.rating;
    delete updateData.images;
    delete updateData.files;
    delete updateData.file;

    // Handle serviceArea update
    if (updateData.serviceArea !== undefined) {
      if (typeof updateData.serviceArea === 'string') {
        try {
          updateData.serviceArea = JSON.parse(updateData.serviceArea);
        } catch (parseError) {
          logger.warn('Failed to parse serviceArea as JSON', { error: parseError.message });
        }
      }
      
      // If address is provided, geocode it
      if (updateData.serviceArea && updateData.serviceArea.address && !updateData.serviceArea.coordinates) {
        try {
          const geocodeResult = await GoogleMapsService.geocodeAddress(updateData.serviceArea.address);
          if (geocodeResult.success && geocodeResult.coordinates) {
            // Convert to GeoJSON format
            updateData.serviceArea.coordinates = {
              type: 'Point',
              coordinates: [
                geocodeResult.coordinates.lng,
                geocodeResult.coordinates.lat
              ]
            };
            if (!updateData.serviceArea.radius) {
              updateData.serviceArea.radius = 50;
            }
            delete updateData.serviceArea.address;
          }
        } catch (geocodeError) {
          logger.warn('Failed to geocode service area', { error: geocodeError.message });
        }
      }
      
      // Convert coordinates to GeoJSON format if in {lat, lng} format
      if (updateData.serviceArea && updateData.serviceArea.coordinates) {
        if (updateData.serviceArea.coordinates.lat !== undefined && 
            updateData.serviceArea.coordinates.lng !== undefined) {
          const { lat, lng } = updateData.serviceArea.coordinates;
          updateData.serviceArea.coordinates = {
            type: 'Point',
            coordinates: [lng, lat]
          };
        } else if (Array.isArray(updateData.serviceArea.coordinates)) {
          updateData.serviceArea.coordinates = {
            type: 'Point',
            coordinates: updateData.serviceArea.coordinates
          };
        }
      }
      
      if (updateData.serviceArea && updateData.serviceArea.coordinates && !updateData.serviceArea.radius) {
        updateData.serviceArea.radius = 50;
      }
    }

    // Update service
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        service[key] = updateData[key];
      }
    });

    await service.save();

    logger.info('Service updated successfully', {
      serviceId: service._id,
      userId: req.user.id
    });

    return sendSuccess(res, service, 'Service updated successfully');
  } catch (error) {
    logger.error('Update service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id,
      userId: req.user?.id
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return sendValidationError(res, errors);
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid data format for field: ${error.path}`,
        code: 'CAST_ERROR',
        field: error.path
      });
    }

    return sendServerError(res, error, 'Failed to update service', 'UPDATE_SERVICE_ERROR');
  }
};

// @desc    Delete service
// @route   DELETE /api/marketplace/services/:id
// @access  Private (Provider/Admin)
const deleteService = async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service',
        code: 'UNAUTHORIZED'
      });
    }

    // Delete images from Cloudinary if any
    if (service.images && service.images.length > 0) {
      try {
        const publicIds = service.images
          .filter(img => img.publicId)
          .map(img => img.publicId);
        
        if (publicIds.length > 0) {
          await Promise.all(
            publicIds.map(publicId => CloudinaryService.deleteFile(publicId))
          );
        }
      } catch (imageError) {
        logger.warn('Failed to delete service images from Cloudinary', {
          error: imageError.message,
          serviceId: service._id
        });
        // Continue with service deletion even if image deletion fails
      }
    }

    await Service.findByIdAndDelete(req.params.id);

    logger.info('Service deleted successfully', {
      serviceId: req.params.id,
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    logger.error('Delete service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to delete service', 'DELETE_SERVICE_ERROR');
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
        message: 'No files uploaded',
        code: 'NO_FILES'
      });
    }

    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this service',
        code: 'UNAUTHORIZED'
      });
    }

    // Upload files to Cloudinary
    const uploadResult = await CloudinaryService.uploadMultipleFiles(
      req.files, 
      'localpro/marketplace'
    );

    if (!uploadResult.success || !uploadResult.data || uploadResult.data.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload service images',
        code: 'UPLOAD_FAILED',
        error: uploadResult.error || uploadResult.errors
      });
    }

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

    if (newImages.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No valid image data after processing',
        code: 'INVALID_IMAGE_DATA'
      });
    }

    service.images.push(...newImages);
    await service.save();

    logger.info('Service images uploaded successfully', {
      serviceId: service._id,
      imagesCount: newImages.length,
      userId: req.user.id
    });

    return sendSuccess(res, newImages, 'Service images uploaded successfully');
  } catch (error) {
    logger.error('Upload service images error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to upload service images', 'UPLOAD_IMAGES_ERROR');
  }
};

// @desc    Create a booking
// @route   POST /api/marketplace/bookings
// @access  Private
const createBooking = async (req, res) => {
  // Transactions require primary read preference; enforce it explicitly
  const session = await mongoose.connection.startSession();
  const transactionOptions = {
    readPreference: ReadPreference.PRIMARY,
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' }
  };

  try {
    // Extract booking data - handle both direct body and formData structure
    const bookingData = req.body.formData || req.body;
    console.log('Create booking request data:', bookingData);

    // Validate payload using Joi bookingSchema
    const { error, value: validatedBooking } = bookingSchema.validate(bookingData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'BOOKING_VALIDATION_ERROR'
      }));
      return sendValidationError(res, validationErrors);
    }

    // Extract validated fields
    const { serviceId, providerId, bookingDate, bookingTime, duration, paymentMethod, address, specialInstructions } = validatedBooking;

    // Validate payment method if provided (not in Joi schema)
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'paymongo'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return sendValidationError(res, [{
        field: 'paymentMethod',
        message: `Payment method must be one of: ${validPaymentMethods.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      }]);
    }

    let createdBooking;
    let paypalApprovalUrl = null;

    await session.withTransaction(async () => {
      // Find and validate service
      const service = await Service.findById(serviceId).session(session);
      
      if (!service) {
        logger.warn('Service not found for booking', {
          serviceId,
          providerId,
          userId: req.user.id
        });
        throw new Error('Service not found');
      }

      if (!service.isActive) {
        logger.warn('Service is not active', {
          serviceId,
          isActive: service.isActive,
          userId: req.user.id
        });
        throw new Error('Service is not available');
      }

      // Verify provider matches if providerId is provided
      if (providerId) {
        const serviceProviderId = service.provider.toString();
        if (serviceProviderId !== providerId) {
          logger.warn('Service provider mismatch', {
            serviceId,
            expectedProviderId: providerId,
            actualProviderId: serviceProviderId,
            userId: req.user.id
          });
          throw new Error('Service provider does not match');
        }
      }

      // Validate service has pricing
      if (!service.pricing || !service.pricing.basePrice) {
        logger.error('Service missing pricing information', {
          serviceId,
          pricing: service.pricing
        });
        throw new Error('Service pricing information is missing');
      }

      // Parse booking date and time
      let bookingDateTime;
      try {
        if (bookingTime) {
          // Combine date and time - ensure proper format
          let dateStr;
          if (bookingDate.includes('T')) {
            dateStr = bookingDate;
          } else {
            // Format: YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM
            // Ensure time is in 24-hour format
            const timeStr = bookingTime.length === 5 ? bookingTime : bookingTime.padStart(5, '0');
            dateStr = `${bookingDate}T${timeStr}:00`; // Add seconds for proper parsing
          }
          bookingDateTime = new Date(dateStr);
        } else {
          bookingDateTime = new Date(bookingDate);
        }

        // Validate date is valid
        if (isNaN(bookingDateTime.getTime())) {
          throw new Error('Invalid booking date or time format');
        }

        // Validate booking date is in the future (with 5 minute buffer for clock differences)
        const now = new Date();
        const bufferMinutes = 5;
        const minBookingTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);
        
        if (bookingDateTime <= minBookingTime) {
          throw new Error('Booking date must be at least 5 minutes in the future');
        }
      } catch (dateError) {
        logger.error('Date parsing error', {
          bookingDate,
          bookingTime,
          error: dateError.message
        });
        throw new Error(dateError.message || 'Invalid booking date or time format');
      }

      // Check for conflicting bookings
      const existingBooking = await Booking.findOne({
        service: serviceId,
        bookingDate: {
          $gte: new Date(bookingDateTime.getTime() - 60 * 60 * 1000), // 1 hour before
          $lte: new Date(bookingDateTime.getTime() + duration * 60 * 60 * 1000) // duration hours after
        },
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }).session(session);

      if (existingBooking) {
        throw new Error('Service already booked for this time slot');
      }

      // Calculate pricing based on service pricing type
      let totalAmount = 0;
      const basePrice = service.pricing.basePrice;
      const currency = service.pricing.currency || 'USD';

      switch (service.pricing.type) {
        case 'hourly':
          totalAmount = basePrice * duration;
          break;
        case 'fixed':
          totalAmount = basePrice;
          break;
        case 'per_sqft':
          // For per_sqft, we'd need area information - defaulting to base price for now
          totalAmount = basePrice;
          break;
        case 'per_item':
          // For per_item, we'd need quantity - defaulting to base price for now
          totalAmount = basePrice;
          break;
        default:
          totalAmount = basePrice * duration;
      }

      // Create booking
      try {
        const booking = await Booking.create([{
          service: serviceId,
          client: req.user.id,
          provider: service.provider,
          bookingDate: bookingDateTime,
          duration: duration,
          address: address || undefined,
          specialInstructions: specialInstructions || undefined,
          pricing: {
            basePrice: basePrice,
            totalAmount: totalAmount,
            currency: currency
          },
          payment: {
            method: paymentMethod || 'cash',
            status: 'pending'
          },
          status: 'pending',
          timeline: [{
            status: 'pending',
            timestamp: new Date(),
            note: 'Booking created',
            updatedBy: req.user.id
          }]
        }], { session });

        createdBooking = booking[0];
      } catch (createError) {
        // Handle Mongoose validation errors
        if (createError.name === 'ValidationError') {
          const validationErrors = Object.values(createError.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
          }));
          logger.error('Booking validation error', {
            serviceId,
            validationErrors,
            error: createError
          });
          throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }
        throw createError;
      }

      // Update service booking count
      await Service.findByIdAndUpdate(
        serviceId,
        { $inc: { 'rating.count': 1 } },
        { session }
      );
    }, transactionOptions);

    // Handle PayPal payment if payment method is PayPal (outside transaction)
    if (paymentMethod === 'paypal' && createdBooking) {
      try {
        const service = await Service.findById(serviceId);
        const totalAmount = createdBooking.pricing.totalAmount;
        const currency = createdBooking.pricing.currency;

        const paypalOrder = await PayPalService.createOrder({
          amount: totalAmount,
          currency: currency,
          description: `Booking for ${service.title}`,
          referenceId: createdBooking._id.toString(),
          items: [{
            name: service.title,
            unit_amount: {
              currency_code: currency,
              value: totalAmount.toFixed(2)
            },
            quantity: '1'
          }]
        });

        if (paypalOrder.success && paypalOrder.data) {
          // Save PayPal order ID to booking
          createdBooking.payment.paypalOrderId = paypalOrder.data.id;
          await createdBooking.save();

          // Get approval URL from PayPal response
          const approvalLink = paypalOrder.data.links?.find(link => link.rel === 'approve');
          if (approvalLink) {
            paypalApprovalUrl = approvalLink.href;
          }
        } else {
          logger.warn('PayPal order creation failed', {
            bookingId: createdBooking._id,
            error: paypalOrder.error
          });
        }
      } catch (paypalError) {
        logger.error('PayPal order creation error', {
          bookingId: createdBooking._id,
          error: paypalError.message
        });
        // Don't fail the booking creation if PayPal fails - user can pay later
      }
    }

    // Populate booking with service and user details
    if (createdBooking) {
      await createdBooking.populate([
        { path: 'service', select: 'title category pricing' },
        { path: 'client', select: 'firstName lastName email' },
        { path: 'provider', select: 'firstName lastName email profile.businessName' }
      ]);

      // Real-time notifications (mobile-first): new booking
      // Provider gets "new booking request"; client gets confirmation that request was sent.
      try {
        await Promise.allSettled([
          NotificationService.sendNotification({
            userId: createdBooking.provider,
            type: 'booking_created',
            title: 'New booking request',
            message: `You have a new booking request for "${createdBooking.service?.title || 'a service'}".`,
            data: { bookingId: createdBooking._id, serviceId: createdBooking.service?._id },
            priority: 'high'
          }),
          NotificationService.sendNotification({
            userId: createdBooking.client,
            type: 'booking_created',
            title: 'Booking requested',
            message: `Your booking request for "${createdBooking.service?.title || 'a service'}" was sent to the provider.`,
            data: { bookingId: createdBooking._id, serviceId: createdBooking.service?._id },
            priority: 'medium'
          })
        ]);
      } catch (notifyError) {
        logger.warn('Booking created notification failed', {
          bookingId: createdBooking._id,
          error: notifyError.message
        });
      }

      logger.info('Booking created successfully', {
        bookingId: createdBooking._id,
        serviceId: serviceId,
        clientId: req.user.id,
        providerId: createdBooking.provider,
        totalAmount: createdBooking.pricing.totalAmount,
        paymentMethod: paymentMethod || 'cash'
      });

      // Return booking with PayPal URL if applicable
      const responseData = {
        booking: createdBooking,
        paypalApprovalUrl: paypalApprovalUrl
      };

      return sendSuccess(res, responseData, 'Booking created successfully', 201);
    }
  } catch (error) {
    // Enhanced error logging with more context
    logger.error('Error processing booking', {
      serviceId: req.body.serviceId || req.body.formData?.serviceId,
      providerId: req.body.providerId || req.body.formData?.providerId,
      formData: req.body.formData || req.body,
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorCode: error.code,
      userId: req.user?.id,
      error: error
    });

    if (error.message === 'Service not found') {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    if (error.message === 'Service is not available') {
      return res.status(400).json({
        success: false,
        message: 'Service is not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    if (error.message === 'Service provider does not match') {
      return res.status(400).json({
        success: false,
        message: 'Service provider does not match',
        code: 'PROVIDER_MISMATCH'
      });
    }

    if (error.message === 'Booking date must be in the future' || 
        error.message === 'Booking date must be at least 5 minutes in the future') {
      return sendValidationError(res, [{
        field: 'bookingDate',
        message: error.message,
        code: 'BOOKING_DATE_INVALID'
      }]);
    }

    if (error.message === 'Invalid booking date or time format') {
      return sendValidationError(res, [{
        field: 'bookingDate',
        message: 'Invalid booking date or time format. Please use YYYY-MM-DD for date and HH:MM for time.',
        code: 'INVALID_DATE_FORMAT'
      }]);
    }

    if (error.message === 'Service already booked for this time slot') {
      return res.status(409).json({
        success: false,
        message: 'Service already booked for this time slot',
        code: 'BOOKING_CONFLICT'
      });
    }

    if (error.message === 'Service pricing information is missing') {
      return res.status(400).json({
        success: false,
        message: 'Service pricing information is missing',
        code: 'SERVICE_PRICING_MISSING'
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return sendValidationError(res, validationErrors);
    }

    // Handle transaction errors
    if (error.message && error.message.includes('Validation failed')) {
      return sendValidationError(res, [{
        field: 'booking',
        message: error.message,
        code: 'BOOKING_VALIDATION_ERROR'
      }]);
    }

    // Log the full error for debugging
    logger.error('Unexpected booking creation error', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code
    });

    return sendServerError(res, error, 'Failed to create booking', 'BOOKING_CREATION_ERROR');
  } finally {
    await session.endSession();
  }
};

// @desc    Get single booking
// @route   GET /api/marketplace/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID'
      }]);
    }

    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title category subcategory pricing images')
      .populate('client', 'firstName lastName email profile.avatar')
      .populate('provider', 'firstName lastName email profile.avatar profile.businessName')
      .select('-__v');

    if (!booking) {
      return sendNotFoundError(res, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Check authorization - user must be client or provider
    const userId = req.user.id;
    const isClient = booking.client._id.toString() === userId;
    const isProvider = booking.provider._id.toString() === userId;
    const isAdmin = req.user.roles?.includes('admin');

    if (!isClient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
        code: 'UNAUTHORIZED'
      });
    }

    // Add user role
    const bookingData = booking.toObject();
    bookingData.userRole = isClient ? 'client' : 'provider';

    logger.info('Booking retrieved', {
      bookingId: booking._id,
      userId
    });

    return sendSuccess(res, bookingData, 'Booking retrieved successfully');
  } catch (error) {
    logger.error('Get booking error', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to retrieve booking', 'BOOKING_RETRIEVAL_ERROR');
  }
};

// @desc    Get all bookings (Admin or filtered)
// @route   GET /api/marketplace/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const {
      status,
      clientId,
      providerId,
      serviceId,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    const userId = req.user.id;
    const isAdmin = req.user.roles?.includes('admin');

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filter = {};

    // Non-admin users can only see their own bookings
    if (!isAdmin) {
      filter.$or = [
        { client: userId },
        { provider: userId }
      ];
    }

    // Admin filters
    if (isAdmin) {
      if (clientId) {
        if (!validateObjectId(clientId)) {
          return sendValidationError(res, [{
            field: 'clientId',
            message: 'Invalid client ID format',
            code: 'INVALID_CLIENT_ID'
          }]);
        }
        filter.client = clientId;
      }
      if (providerId) {
        if (!validateObjectId(providerId)) {
          return sendValidationError(res, [{
            field: 'providerId',
            message: 'Invalid provider ID format',
            code: 'INVALID_PROVIDER_ID'
          }]);
        }
        filter.provider = providerId;
      }
      if (serviceId) {
        if (!validateObjectId(serviceId)) {
          return sendValidationError(res, [{
            field: 'serviceId',
            message: 'Invalid service ID format',
            code: 'INVALID_SERVICE_ID'
          }]);
        }
        filter.service = serviceId;
      }
    }

    // Status filter
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return sendValidationError(res, [{
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        }]);
      }
      filter.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return sendValidationError(res, [{
          field: 'paymentStatus',
          message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`,
          code: 'INVALID_PAYMENT_STATUS'
        }]);
      }
      filter['payment.status'] = paymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.bookingDate = {};
      if (dateFrom) filter.bookingDate.$gte = new Date(dateFrom);
      if (dateTo) filter.bookingDate.$lte = new Date(dateTo);
    }

    // Build sort
    const sort = {};
    const validSortFields = ['createdAt', 'bookingDate', 'status', 'pricing.totalAmount'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(filter)
      .populate('service', 'title category subcategory pricing')
      .populate('client', 'firstName lastName email')
      .populate('provider', 'firstName lastName email profile.businessName')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Booking.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    logger.info('Bookings retrieved', {
      userId,
      isAdmin,
      total,
      filters: { status, clientId, providerId, serviceId }
    });

    return sendPaginated(res, bookings, pagination, 'Bookings retrieved successfully');
  } catch (error) {
    logger.error('Get bookings error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to retrieve bookings', 'BOOKINGS_RETRIEVAL_ERROR');
  }
};

// @desc    Update booking status
// @route   PUT /api/marketplace/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID'
      }]);
    }

    const { status, note } = req.body;

    if (!status) {
      return sendValidationError(res, [{
        field: 'status',
        message: 'Status is required',
        code: 'STATUS_REQUIRED'
      }]);
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      }]);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendNotFoundError(res, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Check authorization
    const userId = req.user.id;
    const isClient = booking.client.toString() === userId;
    const isProvider = booking.provider.toString() === userId;
    const isAdmin = req.user.roles?.includes('admin');

    if (!isClient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking',
        code: 'UNAUTHORIZED'
      });
    }

    // Validate status transitions
    const currentStatus = booking.status;
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Terminal state
      'cancelled': [] // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    // Update status
    booking.status = status;
    
    // Add to timeline
    if (!booking.timeline) {
      booking.timeline = [];
    }
    booking.timeline.push({
      status: status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`,
      updatedBy: userId
    });

    await booking.save();

    logger.info('Booking status updated', {
      bookingId: booking._id,
      oldStatus: currentStatus,
      newStatus: status,
      userId
    });

    // Real-time notifications for status changes (mobile-first)
    try {
      const typeMap = {
        confirmed: 'booking_confirmed',
        in_progress: 'booking_in_progress',
        completed: 'booking_completed',
        cancelled: 'booking_cancelled'
      };
      const notifType = typeMap[status] || null;

      if (notifType) {
        const recipients = [booking.client, booking.provider].filter(Boolean);
        await Promise.allSettled(
          recipients.map(uid =>
            NotificationService.sendNotification({
              userId: uid,
              type: notifType,
              title: `Booking ${status.replace('_', ' ')}`,
              message: `Booking status updated to ${status.replace('_', ' ')}.`,
              data: { bookingId: booking._id, status },
              priority: status === 'cancelled' ? 'high' : 'medium'
            })
          )
        );
      }
    } catch (notifyError) {
      logger.warn('Booking status notification failed', {
        bookingId: booking._id,
        error: notifyError.message
      });
    }

    // Trigger webhook events for booking status changes
    try {
      const webhookService = require('../services/webhookService');
      const populatedBooking = await Booking.findById(booking._id)
        .populate('service', 'title')
        .populate('provider', 'firstName lastName profile')
        .populate('client', 'firstName lastName');

      if (status === 'confirmed') {
        await webhookService.triggerBookingConfirmed(populatedBooking, booking.client);
        await webhookService.triggerBookingConfirmed(populatedBooking, booking.provider);
      } else if (status === 'completed') {
        await webhookService.triggerBookingCompleted(populatedBooking, booking.client);
        await webhookService.triggerBookingCompleted(populatedBooking, booking.provider);
      } else if (status === 'cancelled') {
        await webhookService.triggerBookingCancelled(populatedBooking, booking.client, isProvider ? 'provider' : 'client', note);
        await webhookService.triggerBookingCancelled(populatedBooking, booking.provider, isProvider ? 'provider' : 'client', note);
      }
    } catch (webhookError) {
      logger.warn('Webhook trigger failed for booking status', {
        bookingId: booking._id,
        error: webhookError.message
      });
    }

    return sendSuccess(res, booking, 'Booking status updated successfully');
  } catch (error) {
    logger.error('Update booking status error', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to update booking status', 'BOOKING_STATUS_UPDATE_ERROR');
  }
};

// @desc    Upload booking photos
// @route   POST /api/marketplace/bookings/:id/photos
// @access  Private
const uploadBookingPhotos = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID'
      }]);
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photos uploaded',
        code: 'NO_PHOTOS'
      });
    }

    const { type } = req.body; // 'before' or 'after'
    if (!type || !['before', 'after'].includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: 'Type is required and must be "before" or "after"',
        code: 'INVALID_PHOTO_TYPE'
      }]);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendNotFoundError(res, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Check authorization
    const userId = req.user.id;
    const isClient = booking.client.toString() === userId;
    const isProvider = booking.provider.toString() === userId;
    const isAdmin = req.user.roles?.includes('admin');

    if (!isClient && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload photos for this booking',
        code: 'UNAUTHORIZED'
      });
    }

    // Upload photos to Cloudinary
    const uploadResult = await CloudinaryService.uploadMultipleFiles(
      req.files,
      `localpro/marketplace/bookings/${booking._id}`
    );

    if (!uploadResult.success || !uploadResult.data || uploadResult.data.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload photos',
        code: 'UPLOAD_FAILED',
        error: uploadResult.error || uploadResult.errors
      });
    }

    // Process uploaded photos
    const photos = uploadResult.data
      .filter(file => file && file.secure_url && file.public_id)
      .map(file => ({
        url: file.secure_url,
        publicId: file.public_id,
        thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail')
      }));

    if (photos.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No valid photos after processing',
        code: 'INVALID_PHOTO_DATA'
      });
    }

    // Add photos to booking
    if (type === 'before') {
      if (!booking.beforePhotos) {
        booking.beforePhotos = [];
      }
      booking.beforePhotos.push(...photos);
    } else {
      if (!booking.afterPhotos) {
        booking.afterPhotos = [];
      }
      booking.afterPhotos.push(...photos);
    }

    await booking.save();

    logger.info('Booking photos uploaded', {
      bookingId: booking._id,
      type,
      photosCount: photos.length,
      userId
    });

    return sendSuccess(res, photos, `${type} photos uploaded successfully`);
  } catch (error) {
    logger.error('Upload booking photos error', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to upload booking photos', 'UPLOAD_PHOTOS_ERROR');
  }
};

// @desc    Add review to booking
// @route   POST /api/marketplace/bookings/:id/review
// @access  Private
const addReview = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID'
      }]);
    }

    const { rating, comment, categories, wouldRecommend } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return sendValidationError(res, [{
        field: 'rating',
        message: 'Rating is required and must be between 1 and 5',
        code: 'INVALID_RATING'
      }]);
    }

    const booking = await Booking.findById(req.params.id)
      .populate('service');
    
    if (!booking) {
      return sendNotFoundError(res, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Check authorization - only client can review
    const userId = req.user.id;
    if (booking.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can add a review',
        code: 'UNAUTHORIZED'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings',
        code: 'BOOKING_NOT_COMPLETED'
      });
    }

    // Check if review already exists
    if (booking.review && booking.review.rating) {
      return res.status(409).json({
        success: false,
        message: 'Review already exists for this booking',
        code: 'REVIEW_EXISTS'
      });
    }

    // Upload review photos if provided
    let reviewPhotos = [];
    if (req.files && req.files.length > 0) {
      const uploadResult = await CloudinaryService.uploadMultipleFiles(
        req.files,
        `localpro/marketplace/reviews/${booking._id}`
      );

      if (uploadResult.success && uploadResult.data) {
        reviewPhotos = uploadResult.data
          .filter(file => file && file.secure_url && file.public_id)
          .map(file => ({
            url: file.secure_url,
            publicId: file.public_id,
            thumbnail: CloudinaryService.getOptimizedUrl(file.public_id, 'thumbnail')
          }));
      }
    }

    // Add review
    booking.review = {
      rating: parseInt(rating),
      comment: comment || undefined,
      categories: categories ? {
        quality: categories.quality,
        timeliness: categories.timeliness,
        communication: categories.communication,
        value: categories.value
      } : undefined,
      wouldRecommend: wouldRecommend === 'true' || wouldRecommend === true,
      photos: reviewPhotos,
      createdAt: new Date()
    };

    await booking.save();

    // Update service rating
    const service = booking.service;
    if (service) {
      // Recalculate average rating
      const allBookings = await Booking.find({
        service: service._id,
        status: 'completed',
        'review.rating': { $exists: true }
      });

      if (allBookings.length > 0) {
        const totalRating = allBookings.reduce((sum, b) => sum + (b.review?.rating || 0), 0);
        service.rating.average = totalRating / allBookings.length;
        service.rating.count = allBookings.length;
        await service.save();
      }
    }

    logger.info('Review added to booking', {
      bookingId: booking._id,
      rating,
      serviceId: service?._id,
      userId
    });

    return sendSuccess(res, booking, 'Review added successfully');
  } catch (error) {
    logger.error('Add review error', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to add review', 'ADD_REVIEW_ERROR');
  }
};

// @desc    Approve PayPal booking payment
// @route   POST /api/marketplace/bookings/paypal/approve
// @access  Private
const approvePayPalBooking = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return sendValidationError(res, [{
        field: 'orderId',
        message: 'PayPal order ID is required',
        code: 'ORDER_ID_REQUIRED'
      }]);
    }

    // Find booking by PayPal order ID
    const booking = await Booking.findOne({ 'payment.paypalOrderId': orderId })
      .populate('service')
      .populate('client')
      .populate('provider');

    if (!booking) {
      return sendNotFoundError(res, 'Booking not found for this PayPal order', 'BOOKING_NOT_FOUND');
    }

    // Check authorization
    const userId = req.user.id;
    if (booking.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this payment',
        code: 'UNAUTHORIZED'
      });
    }

    // Capture PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);

    if (!captureResult.success) {
      logger.error('PayPal capture failed', {
        orderId,
        bookingId: booking._id,
        error: captureResult.error
      });

      // Update payment status to failed
      booking.payment.status = 'failed';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'PayPal payment capture failed',
        code: 'PAYMENT_CAPTURE_FAILED',
        error: captureResult.error
      });
    }

    // Update booking payment status
    const capture = captureResult.data.purchase_units[0]?.payments?.captures?.[0];
    if (capture) {
      booking.payment.status = 'paid';
      booking.payment.paypalTransactionId = capture.id;
      booking.payment.paidAt = new Date(capture.create_time || new Date());

      // Update booking status to confirmed if still pending
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
        if (!booking.timeline) {
          booking.timeline = [];
        }
        booking.timeline.push({
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Payment received via PayPal',
          updatedBy: userId
        });
      }

      await booking.save();

      logger.info('PayPal payment approved', {
        bookingId: booking._id,
        orderId,
        transactionId: capture.id,
        userId
      });

      return sendSuccess(res, {
        booking: booking,
        transactionId: capture.id,
        amount: capture.amount?.value,
        currency: capture.amount?.currency_code
      }, 'PayPal payment approved successfully');
    } else {
      return res.status(500).json({
        success: false,
        message: 'Invalid PayPal capture response',
        code: 'INVALID_CAPTURE_RESPONSE'
      });
    }
  } catch (error) {
    logger.error('Approve PayPal booking error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to approve PayPal payment', 'PAYPAL_APPROVE_ERROR');
  }
};

// @desc    Get PayPal order details
// @route   GET /api/marketplace/bookings/paypal/order/:orderId
// @access  Private
const getPayPalOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return sendValidationError(res, [{
        field: 'orderId',
        message: 'PayPal order ID is required',
        code: 'ORDER_ID_REQUIRED'
      }]);
    }

    // Get order details from PayPal
    const orderResult = await PayPalService.getOrder(orderId);

    if (!orderResult.success) {
      return res.status(404).json({
        success: false,
        message: 'PayPal order not found',
        code: 'ORDER_NOT_FOUND',
        error: orderResult.error
      });
    }

    // Find associated booking
    const booking = await Booking.findOne({ 'payment.paypalOrderId': orderId })
      .populate('service', 'title')
      .populate('client', 'firstName lastName')
      .populate('provider', 'firstName lastName');

    const responseData = {
      order: orderResult.data,
      booking: booking || null
    };

    return sendSuccess(res, responseData, 'PayPal order details retrieved successfully');
  } catch (error) {
    logger.error('Get PayPal order details error', {
      error: error.message,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to retrieve PayPal order details', 'PAYPAL_ORDER_DETAILS_ERROR');
  }
};

// @desc    Get my services
// @route   GET /api/marketplace/my-services
// @access  Private
const getMyServices = async (req, res) => {
  try {
    const { category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    const filter = { provider: userId };
    
    if (category) filter.category = category;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.businessName')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, services, pagination, 'My services retrieved successfully');
  } catch (error) {
    logger.error('Get my services error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to retrieve my services', 'MY_SERVICES_ERROR');
  }
};

// @desc    Get my bookings
// @route   GET /api/marketplace/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const {
      status,
      type = 'all', // 'all', 'client', 'provider'
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    const userId = req.user.id;

    // Input validation
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter - user can be either client or provider
    const filter = {};
    
    if (type === 'client') {
      filter.client = userId;
    } else if (type === 'provider') {
      filter.provider = userId;
    } else {
      // 'all' - user is either client or provider
      filter.$or = [
        { client: userId },
        { provider: userId }
      ];
    }

    // Status filter
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return sendValidationError(res, [{
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        }]);
      }
      filter.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return sendValidationError(res, [{
          field: 'paymentStatus',
          message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`,
          code: 'INVALID_PAYMENT_STATUS'
        }]);
      }
      filter['payment.status'] = paymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.bookingDate = {};
      if (dateFrom) {
        filter.bookingDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.bookingDate.$lte = new Date(dateTo);
      }
    }

    // Build sort object
    const sort = {};
    const validSortFields = ['createdAt', 'bookingDate', 'status', 'pricing.totalAmount'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const skip = (pageNum - 1) * limitNum;

    // Query bookings
    const bookings = await Booking.find(filter)
      .populate('service', 'title category subcategory pricing images')
      .populate('client', 'firstName lastName email profile.avatar')
      .populate('provider', 'firstName lastName email profile.avatar profile.businessName')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Booking.countDocuments(filter);

    // Determine user role for each booking
    const bookingsWithRole = bookings.map(booking => {
      const isClient = booking.client._id.toString() === userId;
      
      return {
        ...booking,
        userRole: isClient ? 'client' : 'provider',
        // Add computed fields
        canCancel: booking.status === 'pending' || booking.status === 'confirmed',
        canReview: booking.status === 'completed' && !booking.review?.rating,
        isUpcoming: new Date(booking.bookingDate) > new Date()
      };
    });

    const pagination = createPagination(pageNum, limitNum, total);

    logger.info('My bookings retrieved successfully', {
      userId,
      type,
      status,
      total,
      page: pageNum,
      limit: limitNum
    });

    return sendPaginated(res, bookingsWithRole, pagination, 'My bookings retrieved successfully');
  } catch (error) {
    logger.error('Get my bookings error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    return sendServerError(res, error, 'Failed to retrieve my bookings', 'MY_BOOKINGS_ERROR');
  }
};

// @desc    Get providers for a service
// @route   GET /api/marketplace/services/:id/providers
// @access  Public
const getProvidersForService = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Get all providers offering this service category

    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    const filter = {
      category: service.category,
      isActive: true,
      provider: { $ne: service.provider } // Exclude the current provider
    };

    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName email profile.avatar profile.businessName profile.bio profile.rating profile.experience')
      .select('title pricing rating provider')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get unique providers
    const providerMap = new Map();
    services.forEach(s => {
      const providerId = s.provider._id.toString();
      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          ...s.provider,
          services: []
        });
      }
      providerMap.get(providerId).services.push({
        _id: s._id,
        title: s.title,
        pricing: s.pricing,
        rating: s.rating
      });
    });

    const providers = Array.from(providerMap.values());
    const total = providerMap.size;

    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, providers, pagination, 'Providers retrieved successfully');
  } catch (error) {
    logger.error('Get providers for service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id
    });
    return sendServerError(res, error, 'Failed to retrieve providers', 'PROVIDERS_RETRIEVAL_ERROR');
  }
};

// @desc    Get provider details
// @route   GET /api/marketplace/providers/:id
// @access  Public
const getProviderDetails = async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid provider ID format',
        code: 'INVALID_PROVIDER_ID'
      }]);
    }

    const provider = await User.findById(req.params.id)
      .select('firstName lastName email profile phoneNumber createdAt')
      .lean();

    if (!provider) {
      return sendNotFoundError(res, 'Provider not found', 'PROVIDER_NOT_FOUND');
    }

    // Get provider's active services count
    const servicesCount = await Service.countDocuments({
      provider: req.params.id,
      isActive: true
    });

    // Get provider's completed bookings count
    const bookingsCount = await Booking.countDocuments({
      provider: req.params.id,
      status: 'completed'
    });

    // Get average rating from completed bookings
    const completedBookings = await Booking.find({
      provider: req.params.id,
      status: 'completed',
      'review.rating': { $exists: true }
    })
      .select('review.rating')
      .lean();

    let averageRating = 0;
    if (completedBookings.length > 0) {
      const totalRating = completedBookings.reduce((sum, b) => sum + (b.review?.rating || 0), 0);
      averageRating = totalRating / completedBookings.length;
    }

    const providerData = {
      ...provider,
      stats: {
        servicesCount,
        bookingsCount,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewsCount: completedBookings.length
      }
    };

    logger.info('Provider details retrieved', {
      providerId: req.params.id
    });

    return sendSuccess(res, providerData, 'Provider details retrieved successfully');
  } catch (error) {
    logger.error('Get provider details error', {
      error: error.message,
      stack: error.stack,
      providerId: req.params.id
    });
    return sendServerError(res, error, 'Failed to retrieve provider details', 'PROVIDER_DETAILS_ERROR');
  }
};

// @desc    Get provider services
// @route   GET /api/marketplace/providers/:providerId/services
// @access  Public
const getProviderServices = async (req, res) => {
  try {
    if (!validateObjectId(req.params.providerId)) {
      return sendValidationError(res, [{
        field: 'providerId',
        message: 'Invalid provider ID format',
        code: 'INVALID_PROVIDER_ID'
      }]);
    }

    // Check if provider exists
    const provider = await User.findById(req.params.providerId);
    if (!provider) {
      return sendNotFoundError(res, 'Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const { category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }
    
    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    const filter = {
      provider: req.params.providerId,
      isActive: true
    };

    if (category) {
      filter.category = category;
    }

    const sort = {};
    const validSortFields = ['createdAt', 'rating.average', 'pricing.basePrice'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.businessName profile.avatar')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    logger.info('Provider services retrieved', {
      providerId: req.params.providerId,
      total,
      category
    });

    return sendPaginated(res, services, pagination, 'Provider services retrieved successfully');
  } catch (error) {
    logger.error('Get provider services error', {
      error: error.message,
      stack: error.stack,
      providerId: req.params.providerId
    });
    return sendServerError(res, error, 'Failed to retrieve provider services', 'PROVIDER_SERVICES_ERROR');
  }
};

// @desc    Deactivate service
// @route   PATCH /api/marketplace/services/:id/deactivate
// @access  Private (Provider/Admin)
const deactivateService = async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to deactivate this service',
        code: 'UNAUTHORIZED'
      });
    }

    service.isActive = false;
    await service.save();

    logger.info('Service deactivated successfully', {
      serviceId: service._id,
      userId: req.user.id
    });

    return sendSuccess(res, service, 'Service deactivated successfully');
  } catch (error) {
    logger.error('Deactivate service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id
    });
    return sendServerError(res, error, 'Failed to deactivate service', 'DEACTIVATE_SERVICE_ERROR');
  }
};

// @desc    Activate service
// @route   PATCH /api/marketplace/services/:id/activate
// @access  Private (Provider/Admin)
const activateService = async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid service ID format',
        code: 'INVALID_SERVICE_ID'
      }]);
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendNotFoundError(res, 'Service not found', 'SERVICE_NOT_FOUND');
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isProvider = service.provider.toString() === req.user.id;

    if (!isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to activate this service',
        code: 'UNAUTHORIZED'
      });
    }

    service.isActive = true;
    await service.save();

    logger.info('Service activated successfully', {
      serviceId: service._id,
      userId: req.user.id
    });

    return sendSuccess(res, service, 'Service activated successfully');
  } catch (error) {
    logger.error('Activate service error', {
      error: error.message,
      stack: error.stack,
      serviceId: req.params.id
    });
    return sendServerError(res, error, 'Failed to activate service', 'ACTIVATE_SERVICE_ERROR');
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

