const { Product: Supplies } = require('../models/Supplies');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');


// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Public
const getSupplies = async(req, res) => {
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
      filter['pricing.price'] = {};
      if (minPrice) filter['pricing.price'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.price'].$lte = Number(maxPrice);
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
    logger.error('Get supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single supply item
// @route   GET /api/supplies/:id
// @access  Public
const getSupply = async(req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply ID format'
      });
    }

    const supply = await Supplies.findById(req.params.id)
      .populate('supplier', 'firstName lastName profile.avatar profile.bio profile.rating')
      .populate('orders.user', 'firstName lastName profile.avatar')
      .populate('reviews.user', 'firstName lastName profile.avatar');

    if (!supply) {
      return res.status(404).json({
        success: false,
        message: 'Supply item not found'
      });
    }

    // Increment view count
    supply.views += 1;
    await supply.save();

    res.status(200).json({
      success: true,
      data: supply
    });
  } catch (error) {
    logger.error('Get supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new supply item
// @route   POST /api/supplies
// @access  Private
const createSupply = async(req, res) => {
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
        logger.error('Geocoding error:', geocodeError);
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
    logger.error('Create supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update supply item
// @route   PUT /api/supplies/:id
// @access  Private
const updateSupply = async(req, res) => {
  try {
    let supply = await Supplies.findById(req.params.id);

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
        logger.error('Geocoding error:', geocodeError);
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
    logger.error('Update supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete supply item
// @route   DELETE /api/supplies/:id
// @access  Private
const deleteSupply = async(req, res) => {
  try {
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
    logger.error('Delete supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload supply images
// @route   POST /api/supplies/:id/images
// @access  Private
const uploadSupplyImages = async(req, res) => {
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

    // Check if user is the supplier
    if (supply.supplier.toString() !== req.user.id) {
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
    logger.error('Upload supply images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete supply image
// @route   DELETE /api/supplies/:id/images/:imageId
// @access  Private
const deleteSupplyImage = async(req, res) => {
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
    logger.error('Delete supply image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Order supply item
// @route   POST /api/supplies/:id/order
// @access  Private
const orderSupply = async(req, res) => {
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
    const totalCost = supply.pricing.price * quantity;

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
    logger.error('Order supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/supplies/:id/orders/:orderId/status
// @access  Private
const updateOrderStatus = async(req, res) => {
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
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add supply review
// @route   POST /api/supplies/:id/reviews
// @access  Private
const addSupplyReview = async(req, res) => {
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
    logger.error('Add supply review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's supply items
// @route   GET /api/supplies/my-supplies
// @access  Private
const getMySupplies = async(req, res) => {
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
    logger.error('Get my supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's supply orders
// @route   GET /api/supplies/my-orders
// @access  Private
const getMySupplyOrders = async(req, res) => {
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
    logger.error('Get my supply orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get nearby supply items
// @route   GET /api/supplies/nearby
// @access  Public
const getNearbySupplies = async(req, res) => {
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
    logger.error('Get nearby supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get supply categories
// @route   GET /api/supplies/categories
// @access  Public
const getSupplyCategories = async(req, res) => {
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
    logger.error('Get supply categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured supply items
// @route   GET /api/supplies/featured
// @access  Public
const getFeaturedSupplies = async(req, res) => {
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
    logger.error('Get featured supplies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get supply statistics
// @route   GET /api/supplies/statistics
// @access  Private (Admin only)
const getSupplyStatistics = async(req, res) => {
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
    logger.error('Get supply statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getSupplies,
  getSupply,
  createSupply,
  updateSupply,
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
  getSupplyStatistics
};
