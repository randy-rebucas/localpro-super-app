const Favorite = require('../models/Favorite');
const { Service } = require('../models/Marketplace');
const Provider = require('../models/Provider');
const { Course } = require('../models/Academy');
const { Product } = require('../models/Supplies');
const Job = require('../models/Job');

// Helper function to get the model based on itemType
const getModelByType = (itemType) => {
  const modelMap = {
    'service': Service,
    'provider': Provider,
    'course': Course,
    'supply': Product,
    'job': Job
  };
  return modelMap[itemType];
};

// Helper function to validate item exists
const validateItemExists = async (itemType, itemId) => {
  const Model = getModelByType(itemType);
  if (!Model) {
    return { valid: false, message: 'Invalid item type' };
  }

  const item = await Model.findById(itemId);
  if (!item) {
    return { valid: false, message: `${itemType} not found` };
  }

  return { valid: true, item };
};

// Helper function to populate item with proper references
const populateItem = async (itemType, itemId) => {
  const Model = getModelByType(itemType);
  if (!Model) {
    return null;
  }

  let query = Model.findById(itemId);

  // For providers, populate userId to get user object
  if (itemType === 'provider') {
    query = query.populate('userId', 'firstName lastName email phone phoneNumber profile roles isActive verification badges');
  }

  // For services, populate provider to get provider info
  if (itemType === 'service') {
    query = query.populate('provider', 'firstName lastName profile roles');
  }

  // For jobs, populate employer and category
  if (itemType === 'job') {
    query = query.populate('employer', 'firstName lastName profile.avatar')
                  .populate('category', 'name');
  }

  // For courses, populate instructor to get instructor info
  if (itemType === 'course') {
    query = query.populate('instructor', 'firstName lastName email profile roles');
  }

  const item = await query;
  return item;
};

// @desc    Add item to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { itemType, itemId, notes, tags } = req.body;

    // Validate required fields
    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item type and item ID are required'
      });
    }

    // Validate itemType
    const validTypes = ['service', 'provider', 'course', 'supply', 'job'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate ObjectId format
    if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Check if item exists
    const validation = await validateItemExists(itemType, itemId);
    if (!validation.valid) {
      return res.status(404).json({
        success: false,
        message: validation.message
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.isFavorited(req.user.id, itemType, itemId);
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in favorites'
      });
    }

    // Create favorite
    const favorite = await Favorite.create({
      user: req.user.id,
      itemType,
      itemId,
      notes: notes || '',
      tags: tags || []
    });

    // Populate the item with proper references
    const item = await populateItem(itemType, itemId);

    res.status(201).json({
      success: true,
      message: 'Item added to favorites',
      data: {
        favorite,
        item
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in favorites'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove item from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid favorite ID format'
      });
    }

    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this favorite'
      });
    }

    await favorite.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove favorite by item type and ID
// @route   DELETE /api/favorites/:itemType/:itemId
// @access  Private
const removeFavoriteByItem = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    // Validate itemType
    const validTypes = ['service', 'provider', 'course', 'supply', 'job'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate ObjectId format
    if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const favorite = await Favorite.findOne({
      user: req.user.id,
      itemType,
      itemId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    await favorite.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite by item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const {
      itemType,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {
      user: req.user.id
    };

    // Filter by itemType
    if (itemType) {
      const validTypes = ['service', 'provider', 'course', 'supply', 'job'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }
      filter.itemType = itemType;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const favorites = await Favorite.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Populate items with proper references
    const populatedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        const item = await populateItem(favorite.itemType, favorite.itemId);
        return {
          ...favorite.toObject(),
          item
        };
      })
    );

    const total = await Favorite.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: favorites.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: populatedFavorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get favorite by ID
// @route   GET /api/favorites/:id
// @access  Private
const getFavoriteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid favorite ID format'
      });
    }

    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this favorite'
      });
    }

    // Update last viewed
    await favorite.updateLastViewed();

    // Populate item with proper references
    const item = await populateItem(favorite.itemType, favorite.itemId);

    res.status(200).json({
      success: true,
      data: {
        ...favorite.toObject(),
        item
      }
    });
  } catch (error) {
    console.error('Get favorite by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check if item is favorited
// @route   GET /api/favorites/check/:itemType/:itemId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    // Validate itemType
    const validTypes = ['service', 'provider', 'course', 'supply', 'job'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate ObjectId format
    if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const favorite = await Favorite.isFavorited(req.user.id, itemType, itemId);

    res.status(200).json({
      success: true,
      isFavorited: !!favorite,
      data: favorite || null
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update favorite (notes, tags)
// @route   PUT /api/favorites/:id
// @access  Private
const updateFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, tags } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid favorite ID format'
      });
    }

    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this favorite'
      });
    }

    // Update fields
    if (notes !== undefined) {
      favorite.notes = notes;
    }
    if (tags !== undefined) {
      favorite.tags = Array.isArray(tags) ? tags : [tags];
    }

    await favorite.save();

    // Populate item with proper references
    const item = await populateItem(favorite.itemType, favorite.itemId);

    res.status(200).json({
      success: true,
      message: 'Favorite updated successfully',
      data: {
        ...favorite.toObject(),
        item
      }
    });
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get favorites by type
// @route   GET /api/favorites/type/:itemType
// @access  Private
const getFavoritesByType = async (req, res) => {
  try {
    const { itemType } = req.params;
    const {
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate itemType
    const validTypes = ['service', 'provider', 'course', 'supply', 'job'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      sortBy: sort,
      limit: Number(limit),
      skip: (page - 1) * limit
    };

    const favorites = await Favorite.getFavoritesByType(req.user.id, itemType, options);

    // Populate items with proper references
    const populatedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        const item = await populateItem(favorite.itemType, favorite.itemId);
        return {
          ...favorite.toObject(),
          item
        };
      })
    );

    const total = await Favorite.countDocuments({
      user: req.user.id,
      itemType
    });

    res.status(200).json({
      success: true,
      count: favorites.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: populatedFavorites
    });
  } catch (error) {
    console.error('Get favorites by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get favorites statistics
// @route   GET /api/favorites/stats
// @access  Private
const getFavoritesStats = async (req, res) => {
  try {
    const stats = await Favorite.aggregate([
      {
        $match: { user: req.user._id }
      },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalFavorites = await Favorite.countDocuments({ user: req.user.id });

    const statsMap = {
      service: 0,
      provider: 0,
      course: 0,
      supply: 0,
      job: 0
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalFavorites,
        byType: statsMap
      }
    });
  } catch (error) {
    console.error('Get favorites stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  removeFavoriteByItem,
  getFavorites,
  getFavoriteById,
  checkFavorite,
  updateFavorite,
  getFavoritesByType,
  getFavoritesStats
};

