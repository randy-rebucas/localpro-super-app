const Broadcaster = require('../models/Broadcaster');

// @desc    Get all broadcasters
// @route   GET /api/broadcaster
// @access  Public
const getBroadcasters = async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      status,
      targetAudience,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {
      'metadata.isDeleted': false
    };

    // Status filter
    if (status) {
      filter.status = status;
    } else {
      // Default: show active and inactive, but not archived
      filter.status = { $in: ['draft', 'active', 'inactive'] };
    }

    // Text search
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') }
      ];
    }

    // Type filter
    if (type) {
      filter.type = type;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Target audience filter
    if (targetAudience) {
      filter.targetAudience = targetAudience;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const broadcasters = await Broadcaster.find(filter)
      .populate('author', 'firstName lastName profile.avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Broadcaster.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: broadcasters.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: broadcasters
    });
  } catch (error) {
    console.error('Get broadcasters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get broadcaster by ID
// @route   GET /api/broadcaster/:id
// @access  Public
const getBroadcasterById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broadcaster ID format'
      });
    }

    const broadcaster = await Broadcaster.findById(req.params.id)
      .populate('author', 'firstName lastName profile.avatar profile.bio');

    if (!broadcaster || broadcaster.metadata.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Broadcaster not found'
      });
    }

    res.status(200).json({
      success: true,
      data: broadcaster
    });
  } catch (error) {
    console.error('Get broadcaster by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get active broadcasters
// @route   GET /api/broadcaster/active
// @access  Public
const getActiveBroadcasters = async (req, res) => {
  try {
    const {
      targetAudience,
      type,
      category,
      limit = 20
    } = req.query;

    const now = new Date();
    const filter = {
      status: 'active',
      isActive: true,
      'metadata.isDeleted': false,
      $and: [
        {
          $or: [
            { 'schedule.startDate': { $lte: now } },
            { 'schedule.startDate': null }
          ]
        },
        {
          $or: [
            { 'schedule.endDate': { $gt: now } },
            { 'schedule.endDate': null }
          ]
        }
      ]
    };

    // Type filter
    if (type) {
      filter.type = type;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Target audience filter
    if (targetAudience && targetAudience !== 'all') {
      filter.$and.push({
        $or: [
          { targetAudience: targetAudience },
          { targetAudience: 'all' }
        ]
      });
    }

    const broadcasters = await Broadcaster.find(filter)
      .populate('author', 'firstName lastName profile.avatar')
      .sort({ isSticky: -1, isFeatured: -1, priority: -1, createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: broadcasters.length,
      data: broadcasters
    });
  } catch (error) {
    console.error('Get active broadcasters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get broadcaster statistics
// @route   GET /api/broadcaster/stats
// @access  Public
const getBroadcasterStats = async (req, res) => {
  try {
    // Get total broadcasters
    const totalBroadcasters = await Broadcaster.countDocuments({
      'metadata.isDeleted': false
    });

    // Get broadcasters by status
    const broadcastersByStatus = await Broadcaster.aggregate([
      {
        $match: { 'metadata.isDeleted': false }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get broadcasters by type
    const broadcastersByType = await Broadcaster.aggregate([
      {
        $match: { 'metadata.isDeleted': false }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get broadcasters by category
    const broadcastersByCategory = await Broadcaster.aggregate([
      {
        $match: { 'metadata.isDeleted': false }
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

    // Get total views and clicks
    const totalViewsAndClicks = await Broadcaster.aggregate([
      {
        $match: { 'metadata.isDeleted': false }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalClicks: { $sum: '$clicks' },
          totalImpressions: { $sum: '$impressions' }
        }
      }
    ]);

    // Get active broadcasters count
    const now = new Date();
    const activeCount = await Broadcaster.countDocuments({
      status: 'active',
      isActive: true,
      'metadata.isDeleted': false,
      $and: [
        {
          $or: [
            { 'schedule.startDate': { $lte: now } },
            { 'schedule.startDate': null }
          ]
        },
        {
          $or: [
            { 'schedule.endDate': { $gt: now } },
            { 'schedule.endDate': null }
          ]
        }
      ]
    });

    // Get top broadcasters by views
    const topByViews = await Broadcaster.find({
      'metadata.isDeleted': false
    })
      .sort({ views: -1 })
      .limit(5)
      .select('title views clicks')
      .lean();

    // Get top broadcasters by clicks
    const topByClicks = await Broadcaster.find({
      'metadata.isDeleted': false
    })
      .sort({ clicks: -1 })
      .limit(5)
      .select('title views clicks')
      .lean();

    // Calculate average CTR
    const avgCTR = await Broadcaster.aggregate([
      {
        $match: {
          'metadata.isDeleted': false,
          views: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgCTR: {
            $avg: {
              $multiply: [
                { $divide: ['$clicks', '$views'] },
                100
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBroadcasters,
        activeCount,
        broadcastersByStatus,
        broadcastersByType,
        broadcastersByCategory,
        totalViewsAndClicks: totalViewsAndClicks[0] || {
          totalViews: 0,
          totalClicks: 0,
          totalImpressions: 0
        },
        topByViews,
        topByClicks,
        averageCTR: avgCTR[0]?.avgCTR || 0
      }
    });
  } catch (error) {
    console.error('Get broadcaster stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track broadcaster view
// @route   POST /api/broadcaster or POST /api/broadcaster/:id/view
// @access  Public
const trackBroadcasterView = async (req, res) => {
  try {
    const { broadcasterId, id } = req.body;
    
    // Support broadcasterId/id in body, route param, or query param
    const idToUse = req.params.id || broadcasterId || id || req.query.id;

    if (!idToUse) {
      return res.status(400).json({
        success: false,
        message: 'Broadcaster ID is required'
      });
    }

    // Validate ObjectId format
    if (!idToUse.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broadcaster ID format'
      });
    }

    const broadcaster = await Broadcaster.findById(idToUse);

    if (!broadcaster || broadcaster.metadata.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Broadcaster not found'
      });
    }

    // Increment view count
    await broadcaster.incrementViews();

    res.status(200).json({
      success: true,
      message: 'View tracked successfully',
      data: {
        broadcasterId: broadcaster._id,
        views: broadcaster.views
      }
    });
  } catch (error) {
    console.error('Track broadcaster view error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track broadcaster click
// @route   POST /api/broadcaster or POST /api/broadcaster/:id/click
// @access  Public
const trackBroadcasterClick = async (req, res) => {
  try {
    const { broadcasterId, id } = req.body;
    
    // Support broadcasterId/id in body, route param, or query param
    const idToUse = req.params.id || broadcasterId || id || req.query.id;

    if (!idToUse) {
      return res.status(400).json({
        success: false,
        message: 'Broadcaster ID is required'
      });
    }

    // Validate ObjectId format
    if (!idToUse.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broadcaster ID format'
      });
    }

    const broadcaster = await Broadcaster.findById(idToUse);

    if (!broadcaster || broadcaster.metadata.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Broadcaster not found'
      });
    }

    // Increment click count
    await broadcaster.incrementClicks();

    res.status(200).json({
      success: true,
      message: 'Click tracked successfully',
      data: {
        broadcasterId: broadcaster._id,
        clicks: broadcaster.clicks,
        clickThroughRate: broadcaster.analytics.clickThroughRate
      }
    });
  } catch (error) {
    console.error('Track broadcaster click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new broadcaster
// @route   POST /api/broadcaster
// @access  Private
const createBroadcaster = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      message, // Frontend sends 'message' instead of description/content
      type,
      category,
      status,
      priority,
      targetAudience,
      targetRoles,
      images,
      video,
      link,
      schedule,
      location,
      isFeatured,
      isSticky,
      // Frontend-specific fields
      startDate,
      endDate,
      actionUrl,
      actionText
    } = req.body;

    // Handle frontend field mapping: 'message' can be used for both description and content
    const finalDescription = description || message || '';
    const finalContent = content || message || '';

    // Validate required fields - title is required, description/content can come from message
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!finalDescription && !finalContent) {
      return res.status(400).json({
        success: false,
        message: 'Description, content, or message is required'
      });
    }

    // Validate enum values
    const validTypes = ['announcement', 'promotion', 'news', 'update', 'event', 'general', 'info', 'success', 'warning', 'error'];
    const validCategories = ['system', 'marketing', 'feature', 'maintenance', 'security', 'other'];
    const validStatuses = ['draft', 'active', 'inactive', 'archived'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validTargetAudiences = ['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'];

    // Map frontend type 'info' to 'announcement'
    let mappedType = type;
    if (type === 'info') {
      mappedType = 'announcement';
    } else if (type === 'success') {
      mappedType = 'promotion';
    } else if (type === 'warning') {
      mappedType = 'update';
    } else if (type === 'error') {
      mappedType = 'announcement';
    }

    if (mappedType && !validTypes.includes(mappedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    if (targetAudience && !validTargetAudiences.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target audience. Must be one of: ${validTargetAudiences.join(', ')}`
      });
    }

    // Helper function to check if a value is actually undefined/null/empty
    const isValidValue = (value) => {
      return value && 
             value !== '[undefined]' && 
             value !== 'undefined' && 
             value !== 'null' && 
             value !== '[null]' &&
             value !== '';
    };

    // Handle schedule - frontend sends startDate/endDate directly, or in schedule object
    let finalSchedule = schedule || { startDate: null, endDate: null, timeSlots: [] };
    
    // If startDate/endDate are provided directly, use them
    if (startDate || endDate) {
      finalSchedule = {
        startDate: isValidValue(startDate) ? new Date(startDate) : null,
        endDate: isValidValue(endDate) ? new Date(endDate) : null,
        timeSlots: schedule?.timeSlots || []
      };
    }

    // Validate schedule dates if provided
    if (finalSchedule.startDate && finalSchedule.endDate) {
      const startDateObj = new Date(finalSchedule.startDate);
      const endDateObj = new Date(finalSchedule.endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for schedule dates'
        });
      }

      if (startDateObj >= endDateObj) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    }

    // Handle link - frontend sends actionUrl/actionText
    let finalLink = link || null;
    if (actionUrl || actionText) {
      const isValidValue = (value) => {
        return value && 
               value !== '[undefined]' && 
               value !== 'undefined' && 
               value !== 'null' && 
               value !== '[null]' &&
               value !== '';
      };
      
      finalLink = {
        url: isValidValue(actionUrl) ? actionUrl : null,
        text: isValidValue(actionText) ? actionText : null,
        openInNewTab: true
      };
    }

    const broadcasterData = {
      title,
      description: finalDescription,
      content: finalContent,
      type: mappedType || 'general',
      category: category || 'other',
      status: status || 'draft',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      targetRoles: targetRoles || [],
      images: images || [],
      video: video || null,
      link: finalLink,
      schedule: finalSchedule,
      location: location || null,
      isFeatured: isFeatured || false,
      isSticky: isSticky || false,
      author: req.user.id,
      'metadata.lastModifiedBy': req.user.id
    };

    const broadcaster = await Broadcaster.create(broadcasterData);

    await broadcaster.populate('author', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Broadcaster created successfully',
      data: broadcaster
    });
  } catch (error) {
    console.error('Create broadcaster error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update broadcaster
// @route   PUT /api/broadcaster/:id
// @access  Private
const updateBroadcaster = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broadcaster ID format'
      });
    }

    let broadcaster = await Broadcaster.findById(req.params.id);

    if (!broadcaster || broadcaster.metadata.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Broadcaster not found'
      });
    }

    // Check if user is the author or admin
    const isAuthor = broadcaster.author.toString() === req.user.id;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this broadcaster'
      });
    }

    // Handle frontend field mapping
    const updateData = { ...req.body };
    
    // Map 'message' to description/content if provided
    if (updateData.message && !updateData.description && !updateData.content) {
      updateData.description = updateData.message;
      updateData.content = updateData.message;
    } else if (updateData.message && !updateData.description) {
      updateData.description = updateData.message;
    } else if (updateData.message && !updateData.content) {
      updateData.content = updateData.message;
    }

    // Map frontend type values
    if (updateData.type === 'info') {
      updateData.type = 'announcement';
    } else if (updateData.type === 'success') {
      updateData.type = 'promotion';
    } else if (updateData.type === 'warning') {
      updateData.type = 'update';
    } else if (updateData.type === 'error') {
      updateData.type = 'announcement';
    }

    // Helper function to check if a value is actually undefined/null/empty
    const isValidValue = (value) => {
      return value && 
             value !== '[undefined]' && 
             value !== 'undefined' && 
             value !== 'null' && 
             value !== '[null]' &&
             value !== '';
    };

    // Handle startDate/endDate if provided directly
    if (updateData.startDate || updateData.endDate) {
      if (!updateData.schedule) {
        updateData.schedule = broadcaster.schedule || { startDate: null, endDate: null, timeSlots: [] };
      }
      if (isValidValue(updateData.startDate)) {
        updateData.schedule.startDate = new Date(updateData.startDate);
      }
      if (isValidValue(updateData.endDate)) {
        updateData.schedule.endDate = new Date(updateData.endDate);
      }
      // Remove startDate/endDate from updateData as they're now in schedule
      delete updateData.startDate;
      delete updateData.endDate;
    }

    // Handle actionUrl/actionText
    if (updateData.actionUrl || updateData.actionText) {
      updateData.link = {
        url: isValidValue(updateData.actionUrl) 
          ? updateData.actionUrl 
          : (broadcaster.link?.url || null),
        text: isValidValue(updateData.actionText)
          ? updateData.actionText
          : (broadcaster.link?.text || null),
        openInNewTab: broadcaster.link?.openInNewTab !== undefined ? broadcaster.link.openInNewTab : true
      };
      delete updateData.actionUrl;
      delete updateData.actionText;
    }

    // Remove message from updateData as it's been mapped
    delete updateData.message;

    // Validate enum values if provided
    const validTypes = ['announcement', 'promotion', 'news', 'update', 'event', 'general', 'info', 'success', 'warning', 'error'];
    const validCategories = ['system', 'marketing', 'feature', 'maintenance', 'security', 'other'];
    const validStatuses = ['draft', 'active', 'inactive', 'archived'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validTargetAudiences = ['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'];

    if (updateData.type && !validTypes.includes(updateData.type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (updateData.category && !validCategories.includes(updateData.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    if (updateData.status && !validStatuses.includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (updateData.priority && !validPriorities.includes(updateData.priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    if (updateData.targetAudience && !validTargetAudiences.includes(updateData.targetAudience)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target audience. Must be one of: ${validTargetAudiences.join(', ')}`
      });
    }

    // Validate schedule dates if provided
    if (updateData.schedule) {
      if (updateData.schedule.startDate && updateData.schedule.endDate) {
        const startDate = new Date(updateData.schedule.startDate);
        const endDate = new Date(updateData.schedule.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format for schedule dates'
          });
        }

        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: 'Start date must be before end date'
          });
        }
      }
    }

    // Update metadata
    updateData['metadata.lastModifiedBy'] = req.user.id;
    updateData['metadata.lastModifiedAt'] = new Date();

    broadcaster = await Broadcaster.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    await broadcaster.populate('author', 'firstName lastName profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Broadcaster updated successfully',
      data: broadcaster
    });
  } catch (error) {
    console.error('Update broadcaster error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete broadcaster
// @route   DELETE /api/broadcaster/:id
// @access  Private
const deleteBroadcaster = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid broadcaster ID format'
      });
    }

    const broadcaster = await Broadcaster.findById(req.params.id);

    if (!broadcaster || broadcaster.metadata.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Broadcaster not found'
      });
    }

    // Check if user is the author or admin
    const isAuthor = broadcaster.author.toString() === req.user.id;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this broadcaster'
      });
    }

    // Soft delete
    await broadcaster.softDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Broadcaster deleted successfully'
    });
  } catch (error) {
    console.error('Delete broadcaster error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getBroadcasters,
  getBroadcasterById,
  getActiveBroadcasters,
  getBroadcasterStats,
  trackBroadcasterView,
  trackBroadcasterClick,
  createBroadcaster,
  updateBroadcaster,
  deleteBroadcaster
};

