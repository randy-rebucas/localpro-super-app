const { Product: Supplies } = require('../models/Supplies');
const User = require('../models/User');
const mongoose = require('mongoose');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const EmailService = require('../services/emailService');
const aiService = require('../services/aiService');
const logger = require('../config/logger');
const { sendServerError } = require('../utils/responseHelper');

// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Public
const getSupplies = async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['pricing.retailPrice'] = {};
      if (minPrice) filter['pricing.retailPrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.retailPrice'].$lte = Number(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const supplies = await Supplies.find(filter)
      .populate('supplier', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Supplies.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: supplies.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: supplies
    });
  } catch (error) {
    console.error('Get supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get detailed information about a supply item
// @route   GET /api/supplies/:id
// @access  Public
const getSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      includeOrders = 'false',
      includeReviews = 'true',
      includeRelated = 'true',
      includeStatistics = 'true'
    } = req.query;

    // Validate and convert ObjectId
    const trimmedId = id.trim();
    
    if (!trimmedId || trimmedId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply ID format',
        error: 'ID must be exactly 24 characters (MongoDB ObjectId format)',
        receivedId: trimmedId,
        receivedLength: trimmedId?.length || 0,
        expectedLength: 24
      });
    }

    let supplyId;
    try {
      if (!mongoose.isValidObjectId(trimmedId)) {
        throw new Error('Invalid ObjectId format');
      }
      supplyId = new mongoose.Types.ObjectId(trimmedId);
    } catch (e) {
      logger.warn('Invalid supply ID format', {
        id: trimmedId,
        error: e.message
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid supply ID format',
        error: e.message || 'ID must be a valid MongoDB ObjectId',
        receivedId: trimmedId
      });
    }

    // Find supply with basic population
    const supply = await Supplies.findById(supplyId)
      .populate('supplier', 'firstName lastName email phone profile.avatar profile.bio profile.rating')
      .lean();

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if supply is active
    if (!supply.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Supply item is not active',
        hint: 'This supply item is currently inactive and cannot be viewed'
      });
    }

    // Initialize response data
    const supplyDetails = {
      supply: {
        id: supply._id,
        name: supply.name,
        title: supply.title,
        description: supply.description,
        category: supply.category,
        subcategory: supply.subcategory,
        brand: supply.brand,
        sku: supply.sku,
        pricing: supply.pricing,
        inventory: supply.inventory,
        specifications: supply.specifications,
        location: supply.location,
        images: supply.images,
        tags: supply.tags,
        isFeatured: supply.isFeatured,
        isSubscriptionEligible: supply.isSubscriptionEligible,
        averageRating: supply.averageRating,
        views: supply.views,
        supplier: supply.supplier,
        createdAt: supply.createdAt,
        updatedAt: supply.updatedAt
      }
    };

    // Get reviews if requested
    if (includeReviews === 'true' || includeReviews === true) {
      const reviews = await Supplies.findById(supplyId)
        .select('reviews')
        .populate('reviews.user', 'firstName lastName profile.avatar')
        .lean();

      supplyDetails.reviews = reviews?.reviews?.map(review => ({
        id: review._id,
        user: review.user,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })) || [];
      
      supplyDetails.reviewCount = supplyDetails.reviews.length;
    }

    // Get orders if requested (for supplier view)
    if (includeOrders === 'true' || includeOrders === true) {
      const orders = await Supplies.findById(supplyId)
        .select('orders')
        .populate('orders.user', 'firstName lastName profile.avatar email phone')
        .lean();

      supplyDetails.orders = orders?.orders?.map(order => ({
        id: order._id,
        user: order.user,
        quantity: order.quantity,
        totalCost: order.totalCost,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        contactInfo: order.contactInfo,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })) || [];
      
      supplyDetails.orderCount = supplyDetails.orders.length;
    }

    // Get statistics if requested
    if (includeStatistics === 'true' || includeStatistics === true) {
      // Get review count from supply directly if reviews not loaded
      let reviewCount = supplyDetails.reviews?.length;
      if (reviewCount === undefined) {
        const reviewData = await Supplies.findById(supplyId).select('reviews').lean();
        reviewCount = reviewData?.reviews?.length || 0;
      }

      const stats = {
        views: supply.views || 0,
        averageRating: supply.averageRating || 0,
        reviewCount: reviewCount,
        orderCount: supplyDetails.orders?.length || 0,
        inventory: {
          quantity: supply.inventory?.quantity || 0,
          minStock: supply.inventory?.minStock || 0,
          maxStock: supply.inventory?.maxStock || null,
          inStock: (supply.inventory?.quantity || 0) > 0,
          lowStock: (supply.inventory?.quantity || 0) <= (supply.inventory?.minStock || 10)
        }
      };

      // Calculate order statistics if orders are included
      if (supplyDetails.orders && supplyDetails.orders.length > 0) {
        const orderStats = {
          total: supplyDetails.orders.length,
          pending: supplyDetails.orders.filter(o => o.status === 'pending').length,
          confirmed: supplyDetails.orders.filter(o => o.status === 'confirmed').length,
          processing: supplyDetails.orders.filter(o => o.status === 'processing').length,
          shipped: supplyDetails.orders.filter(o => o.status === 'shipped').length,
          delivered: supplyDetails.orders.filter(o => o.status === 'delivered').length,
          cancelled: supplyDetails.orders.filter(o => o.status === 'cancelled').length,
          totalRevenue: supplyDetails.orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + (o.totalCost || 0), 0)
        };
        stats.orders = orderStats;
      }

      supplyDetails.statistics = stats;
    }

    // Get related supplies if requested
    if (includeRelated === 'true' || includeRelated === true) {
      const relatedSupplies = await Supplies.find({
        category: supply.category,
        subcategory: supply.subcategory,
        isActive: true,
        _id: { $ne: supplyId }
      })
        .populate('supplier', 'firstName lastName profile.avatar')
        .select('name title description category subcategory pricing retailPrice images averageRating views')
        .sort({ averageRating: -1, views: -1 })
        .limit(6)
        .lean();

      supplyDetails.relatedSupplies = relatedSupplies;
    }

    // Increment view count
    await Supplies.findByIdAndUpdate(supplyId, {
      $inc: { views: 1 }
    });

    logger.info('Supply details retrieved', {
      supplyId: id,
      supplyName: supply.name,
      category: supply.category,
      includeOrders,
      includeReviews,
      includeRelated,
      includeStatistics
    });

    return res.status(200).json({
      success: true,
      message: 'Supply details retrieved successfully',
      data: supplyDetails
    });
  } catch (error) {
    logger.error('Failed to get supply details', error, {
      supplyId: req.params.id
    });
    return sendServerError(res, error, 'Failed to retrieve supply details', 'SUPPLY_DETAILS_ERROR');
  }
};

// @desc    Create new supply item
// @route   POST /api/supplies
// @access  Private (Supplier/Admin)
const createSupply = async (req, res) => {
  try {
    const supplyData = {
      ...req.body,
      supplier: req.user.id
    };

    // Geocode location if provided
    if (supplyData.location?.street) {
      try {
        const address = `${supplyData.location.street}, ${supplyData.location.city}, ${supplyData.location.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          supplyData.location.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    const supply = await Supplies.create(supplyData);

    await supply.populate('supplier', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Supply item created successfully',
      data: supply
    });
  } catch (error) {
    console.error('Create supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update supply item
// @route   PUT /api/supplies/:id
// @access  Private (Supplier/Admin)
const updateSupply = async (req, res) => {
  try {
    let supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isSupplier = supply.supplier.toString() === req.user.id;

    if (!isSupplier && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this supply item'
      });
    }

    // Geocode location if changed
    if (req.body.location?.street && 
        req.body.location.street !== supply.location.street) {
      try {
        const address = `${req.body.location.street}, ${req.body.location.city}, ${req.body.location.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          req.body.location.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    supply = await Supplies.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Supply item updated successfully',
      data: supply
    });
  } catch (error) {
    console.error('Update supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Patch supply item (partial update)
// @route   PATCH /api/supplies/:id
// @access  Private (Supplier/Admin)
const patchSupply = async (req, res) => {
  try {
    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isSupplier = supply.supplier.toString() === req.user.id;

    if (!isSupplier && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this supply item'
      });
    }

    const updateData = { ...req.body };
    const updatedFields = [];

    // Helper function to deep merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date) && source[key].constructor === Object) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    // Fields that should not be directly updated
    const restrictedFields = ['_id', 'supplier', 'createdAt', 'updatedAt', 'orders', 'reviews', 'averageRating'];
    const allowedTopLevelFields = ['name', 'title', 'description', 'category', 'subcategory', 'brand', 'sku', 'pricing', 'inventory', 'specifications', 'location', 'images', 'tags', 'isActive', 'isFeatured', 'views', 'isSubscriptionEligible'];

    // Update top-level fields
    for (const field of allowedTopLevelFields) {
      if (updateData[field] !== undefined) {
        if (field === 'pricing' || field === 'inventory' || field === 'specifications' || field === 'location') {
          // Deep merge for nested objects
          if (!supply[field]) supply[field] = {};
          deepMerge(supply[field], updateData[field]);
        } else if (field === 'images' || field === 'tags') {
          // Replace arrays
          supply[field] = updateData[field];
        } else {
          supply[field] = updateData[field];
        }
        updatedFields.push(field);
        delete updateData[field];
      }
    }

    // Remove restricted fields
    restrictedFields.forEach(field => delete updateData[field]);

    // Geocode location if changed
    if (updatedFields.includes('location') && req.body.location?.street) {
      try {
        const address = `${req.body.location.street}, ${req.body.location.city}, ${req.body.location.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          supply.location.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    // Save supply if there are updates
    if (updatedFields.length > 0) {
      await supply.save();
    }

    // Populate related documents for response
    await supply.populate('supplier', 'firstName lastName profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Supply item updated successfully',
      data: {
        supply,
        updatedFields
      }
    });
  } catch (error) {
    console.error('Patch supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supply item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete supply item
// @route   DELETE /api/supplies/:id
// @access  Private (Supplier/Admin)
const deleteSupply = async (req, res) => {
  try {
    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isSupplier = supply.supplier.toString() === req.user.id;

    if (!isSupplier && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this supply item'
      });
    }

    // Soft delete
    supply.isActive = false;
    await supply.save();

    res.status(200).json({
      success: true,
      message: 'Supply item deleted successfully'
    });
  } catch (error) {
    console.error('Delete supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload supply images
// @route   POST /api/supplies/:id/images
// @access  Private (Supplier/Admin)
const uploadSupplyImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier or admin
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isSupplier = supply.supplier.toString() === req.user.id;

    if (!isSupplier && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this supply item'
      });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadFile(file, 'localpro/supplies')
    );

    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults
      .filter(result => result.success)
      .map(result => ({
        url: result.data.secure_url,
        publicId: result.data.public_id
      }));

    if (successfulUploads.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    // Add new images to supply
    supply.images = [...supply.images, ...successfulUploads];
    await supply.save();

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} image(s) uploaded successfully`,
      data: successfulUploads
    });
  } catch (error) {
    console.error('Upload supply images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete supply image
// @route   DELETE /api/supplies/:id/images/:imageId
// @access  Private
const deleteSupplyImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier
    if (supply.supplier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete images for this supply item'
      });
    }

    const image = supply.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(image.publicId);

    // Remove from supply
    image.remove();
    await supply.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete supply image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Order supply item
// @route   POST /api/supplies/:id/order
// @access  Private
const orderSupply = async (req, res) => {
  try {
    const { 
      quantity,
      deliveryAddress,
      specialInstructions,
      contactInfo
    } = req.body;

    if (!quantity || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and delivery address are required'
      });
    }

    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if supply is available
    if (!supply.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Supply item is not available'
      });
    }

    // Check if quantity is available
    if (supply.inventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity available'
      });
    }

    // Calculate total cost
    const totalCost = supply.pricing.retailPrice * quantity;

    const order = {
      user: req.user.id,
      quantity,
      totalCost,
      deliveryAddress,
      specialInstructions,
      contactInfo,
      status: 'pending',
      createdAt: new Date()
    };

    supply.orders.push(order);
    await supply.save();

    // Send notification email to supplier
    await EmailService.sendEmail({
      to: supply.supplier.email,
      subject: 'New Supply Order',
      template: 'order-confirmation',
      data: {
        supplyTitle: supply.title,
        clientName: `${req.user.firstName} ${req.user.lastName}`,
        quantity,
        totalCost,
        deliveryAddress,
        specialInstructions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Supply item ordered successfully',
      data: order
    });
  } catch (error) {
    console.error('Order supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/supplies/:id/orders/:orderId/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user is the supplier
    if (supply.supplier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update order status'
      });
    }

    const order = supply.orders.id(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    order.updatedAt = new Date();

    // Update inventory if order is completed
    if (status === 'completed') {
      supply.inventory.quantity -= order.quantity;
    }

    await supply.save();

    // Send notification email to client
    const client = await User.findById(order.user);
    await EmailService.sendEmail({
      to: client.email,
      subject: 'Supply Order Status Update',
      template: 'application-status-update',
      data: {
        supplyTitle: supply.title,
        status,
        quantity: order.quantity,
        totalCost: order.totalCost
      }
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add supply review
// @route   POST /api/supplies/:id/reviews
// @access  Private
const addSupplyReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const supply = await Supplies.findById(req.params.id);

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Check if user has ordered this supply
    const hasOrdered = supply.orders.some(order => 
      order.user.toString() === req.user.id && 
      order.status === 'completed'
    );

    if (!hasOrdered) {
      return res.status(403).json({
        success: false,
        message: 'You can only review supply items you have ordered and completed'
      });
    }

    // Check if user has already reviewed
    const existingReview = supply.reviews.find(review => 
      review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this supply item'
      });
    }

    const review = {
      user: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    };

    supply.reviews.push(review);

    // Update average rating
    const totalRating = supply.reviews.reduce((sum, review) => sum + review.rating, 0);
    supply.averageRating = totalRating / supply.reviews.length;

    await supply.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add supply review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's supply items
// @route   GET /api/supplies/my-supplies
// @access  Private
const getMySupplies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const supplies = await Supplies.find({ supplier: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Supplies.countDocuments({ supplier: req.user.id });

    res.status(200).json({
      success: true,
      count: supplies.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: supplies
    });
  } catch (error) {
    console.error('Get my supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's supply orders
// @route   GET /api/supplies/my-orders
// @access  Private
const getMySupplyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const supplies = await Supplies.find({
      'orders.user': req.user.id
    })
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ 'orders.createdAt': -1 })
    .skip(skip)
    .limit(Number(limit));

    // Extract orders for the user
    const userOrders = [];
    supplies.forEach(supply => {
      supply.orders.forEach(order => {
        if (order.user.toString() === req.user.id) {
          userOrders.push({
            ...order.toObject(),
            supply: {
              _id: supply._id,
              title: supply.title,
              supplier: supply.supplier
            }
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: userOrders.length,
      data: userOrders
    });
  } catch (error) {
    console.error('Get my supply orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get nearby supply items
// @route   GET /api/supplies/nearby
// @access  Public
const getNearbySupplies = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const skip = (page - 1) * limit;

    const supplies = await Supplies.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('supplier', 'firstName lastName profile.avatar profile.rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Supplies.countDocuments({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      }
    });

    res.status(200).json({
      success: true,
      count: supplies.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: supplies
    });
  } catch (error) {
    console.error('Get nearby supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get supply categories
// @route   GET /api/supplies/categories
// @access  Public
const getSupplyCategories = async (req, res) => {
  try {
    const categories = await Supplies.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get supply categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured supply items
// @route   GET /api/supplies/featured
// @access  Public
const getFeaturedSupplies = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const supplies = await Supplies.find({
      isActive: true,
      isFeatured: true
    })
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: supplies.length,
      data: supplies
    });
  } catch (error) {
    console.error('Get featured supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get supply statistics
// @route   GET /api/supplies/statistics
// @access  Private (Admin only)
const getSupplyStatistics = async (req, res) => {
  try {
    // Get total supplies
    const totalSupplies = await Supplies.countDocuments();

    // Get supplies by category
    const suppliesByCategory = await Supplies.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total orders
    const totalOrders = await Supplies.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: { $size: '$orders' } }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Supplies.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSupplies,
        suppliesByCategory,
        totalOrders: totalOrders[0]?.totalOrders || 0,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get supply statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Generate supply description using AI
// @route   POST /api/supplies/generate-description
// @access  Private (Supplier/Admin)
const generateSupplyDescription = async (req, res) => {
  try {
    const { name, category, subcategory, options } = req.body;

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supply name is required'
      });
    }

    // Validate category if provided
    const validCategories = ['cleaning_supplies', 'tools', 'materials', 'equipment'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate options if provided
    const validOptions = {};
    if (options) {
      if (options.length && ['short', 'medium', 'long'].includes(options.length)) {
        validOptions.length = options.length;
      }
      if (options.tone && ['professional', 'friendly', 'casual'].includes(options.tone)) {
        validOptions.tone = options.tone;
      }
      if (typeof options.includeFeatures === 'boolean') {
        validOptions.includeFeatures = options.includeFeatures;
      }
      if (typeof options.includeBenefits === 'boolean') {
        validOptions.includeBenefits = options.includeBenefits;
      }
    }

    // Add category and subcategory to options
    if (category) {
      validOptions.category = category;
    }
    if (subcategory) {
      validOptions.subcategory = subcategory;
    }

    // Generate description using AI
    logger.info('Generating supply description from name', {
      name: name.trim(),
      category,
      subcategory,
      options: validOptions,
      userId: req.user.id
    });
    
    const aiResponse = await aiService.generateSupplyDescriptionFromName(name.trim(), validOptions);
    
    // Check if AI service returned an error
    if (!aiResponse.success) {
      logger.warn('AI service returned error for supply description', {
        error: aiResponse.error,
        code: aiResponse.code,
        userId: req.user.id
      });

      const statusCode = aiResponse.code === 'AI_NOT_CONFIGURED' ? 503 
        : aiResponse.code === 'AI_AUTH_FAILED' ? 503
        : aiResponse.code === 'AI_RATE_LIMITED' ? 429
        : aiResponse.code === 'AI_SERVICE_ERROR' ? 503
        : 500;

      return res.status(statusCode).json({
        success: false,
        message: aiResponse.error || 'Failed to generate description',
        code: aiResponse.code || 'AI_ERROR'
      });
    }
    
    // Debug: Log AI response structure
    logger.info('AI Response received for supply description', {
      hasParsed: !!aiResponse.parsed,
      hasContent: !!aiResponse.content,
      hasUsage: !!aiResponse.usage,
      hasDebug: !!aiResponse.debug,
      success: aiResponse.success,
      parsedKeys: aiResponse.parsed ? Object.keys(aiResponse.parsed) : [],
      debugInfo: aiResponse.debug || {}
    });
    
    // Extract result from parsed response
    const result = {
      description: aiResponse.parsed.description || '',
      keyFeatures: Array.isArray(aiResponse.parsed.keyFeatures) ? aiResponse.parsed.keyFeatures : [],
      benefits: Array.isArray(aiResponse.parsed.benefits) ? aiResponse.parsed.benefits : [],
      useCases: Array.isArray(aiResponse.parsed.useCases) ? aiResponse.parsed.useCases : [],
      suggestedTags: Array.isArray(aiResponse.parsed.suggestedTags) ? aiResponse.parsed.suggestedTags : [],
      suggestedTitle: aiResponse.parsed.suggestedTitle || name.trim(),
      wordCount: typeof aiResponse.parsed.wordCount === 'number' ? aiResponse.parsed.wordCount : 0
    };

    res.status(200).json({
      success: true,
      message: 'Supply description generated successfully',
      data: result,
      usage: aiResponse.usage || null
    });
  } catch (error) {
    logger.error('Generate supply description error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate supply description'
    });
  }
};

module.exports = {
  getSupplies,
  getSupply,
  createSupply,
  updateSupply,
  patchSupply,
  deleteSupply,
  uploadSupplyImages,
  deleteSupplyImage,
  orderSupply,
  updateOrderStatus,
  addSupplyReview,
  getMySupplies,
  getMySupplyOrders,
  getNearbySupplies,
  getSupplyCategories,
  getFeaturedSupplies,
  getSupplyStatistics,
  generateSupplyDescription
};
