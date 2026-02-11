const Feed = require('../models/Feed');
const feedService = require('../services/feedService');
const { logger } = require('../utils/logger');

/**
 * Get personalized feed for current user
 * @route GET /api/feeds
 * @access Private
 */
const getFeed = async (req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      contentTypes,
      categories,
      timeframe = '7d',
      sortBy = 'relevance',
      includeRealtime = 'true'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      contentTypes: contentTypes ? contentTypes.split(',').filter(Boolean) : [],
      categories: categories ? categories.split(',').filter(Boolean) : [],
      timeframe,
      sortBy,
      includeRealtime: includeRealtime === 'true'
    };

    const result = await feedService.getAggregatedFeed(user, options);

    logger.info('Feed retrieved', {
      userId: user.id,
      page,
      itemCount: result.items.length
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get feed', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feed'
    });
  }
};

/**
 * Get trending content
 * @route GET /api/feeds/trending
 * @access Public
 */
const getTrending = async (req, res) => {
  try {
    const { limit = 10, timeframe = '24h' } = req.query;

    const trending = await feedService.getTrending({
      limit: parseInt(limit),
      timeframe
    });

    logger.info('Trending content retrieved', {
      count: trending.length,
      timeframe
    });

    res.json({
      success: true,
      data: {
        items: trending,
        timeframe
      }
    });
  } catch (error) {
    logger.error('Failed to get trending content', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending content'
    });
  }
};

/**
 * Get featured content
 * @route GET /api/feeds/featured
 * @access Public
 */
const getFeatured = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const featured = await feedService.getFeatured(parseInt(limit));

    logger.info('Featured content retrieved', {
      count: featured.length
    });

    res.json({
      success: true,
      data: {
        items: featured
      }
    });
  } catch (error) {
    logger.error('Failed to get featured content', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured content'
    });
  }
};

/**
 * Get single feed item
 * @route GET /api/feeds/:id
 * @access Private
 */
const getFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const feedItem = await Feed.findOne({
      _id: id,
      isDeleted: false
    })
    .populate('author', 'firstName lastName email avatar role verified')
    .populate('contentId');

    if (!feedItem) {
      return res.status(404).json({
        success: false,
        message: 'Feed item not found'
      });
    }

    // Check access
    if (!feedItem.canViewContent(user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this content'
      });
    }

    // Track view
    if (user && user.id !== feedItem.author._id.toString()) {
      await feedService.trackView(id, user.id);
    }

    logger.info('Feed item retrieved', {
      userId: user?.id,
      feedItemId: id
    });

    res.json({
      success: true,
      data: feedItem
    });
  } catch (error) {
    logger.error('Failed to get feed item', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feed item'
    });
  }
};

/**
 * Create feed item
 * @route POST /api/feeds
 * @access Private (Admin/Content Creator)
 */
const createFeedItem = async (req, res) => {
  try {
    const user = req.user;
    const {
      contentType,
      contentId,
      title,
      description,
      summary,
      category,
      media,
      images,
      visibility,
      targetAudience,
      priority,
      isFeatured,
      cta,
      metadata
    } = req.body;

    const feedItem = await feedService.createFeedItem(contentType, contentId, {
      author: user.id,
      title,
      description,
      summary,
      category,
      media,
      images,
      visibility: visibility || 'public',
      targetAudience,
      priority: priority || 0,
      isFeatured: isFeatured || false,
      cta,
      metadata
    });

    logger.info('Feed item created', {
      userId: user.id,
      feedItemId: feedItem._id,
      contentType
    });

    res.status(201).json({
      success: true,
      message: 'Feed item created successfully',
      data: feedItem
    });
  } catch (error) {
    logger.error('Failed to create feed item', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create feed item'
    });
  }
};

/**
 * Update feed item
 * @route PUT /api/feeds/:id
 * @access Private (Author/Admin)
 */
const updateFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    const feedItem = await Feed.findOne({
      _id: id,
      isDeleted: false
    });

    if (!feedItem) {
      return res.status(404).json({
        success: false,
        message: 'Feed item not found'
      });
    }

    // Check permissions
    const isAuthor = feedItem.author.toString() === user.id;
    const isAdmin = user.role.includes('admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'summary', 'category', 'tags',
      'media', 'images', 'visibility', 'targetAudience',
      'priority', 'isFeatured', 'featuredUntil', 'isPromoted',
      'promotionData', 'status', 'scheduledFor', 'expiresAt',
      'cta', 'metadata', 'isVisible'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        feedItem[field] = updates[field];
      }
    });

    await feedItem.save();

    logger.info('Feed item updated', {
      userId: user.id,
      feedItemId: id
    });

    res.json({
      success: true,
      message: 'Feed item updated successfully',
      data: feedItem
    });
  } catch (error) {
    logger.error('Failed to update feed item', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update feed item'
    });
  }
};

/**
 * Delete feed item (soft delete)
 * @route DELETE /api/feeds/:id
 * @access Private (Author/Admin)
 */
const deleteFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const feedItem = await Feed.findOne({
      _id: id,
      isDeleted: false
    });

    if (!feedItem) {
      return res.status(404).json({
        success: false,
        message: 'Feed item not found'
      });
    }

    // Check permissions
    const isAuthor = feedItem.author.toString() === user.id;
    const isAdmin = user.role.includes('admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    feedItem.isDeleted = true;
    feedItem.status = 'archived';
    await feedItem.save();

    logger.info('Feed item deleted', {
      userId: user.id,
      feedItemId: id
    });

    res.json({
      success: true,
      message: 'Feed item deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete feed item', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete feed item'
    });
  }
};

/**
 * Add interaction to feed item
 * @route POST /api/feeds/:id/interactions
 * @access Private
 */
const addInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const user = req.user;

    if (!type || !['like', 'share', 'comment', 'bookmark', 'click'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid interaction type is required (like, share, comment, bookmark, click)'
      });
    }

    const feedItem = await feedService.trackInteraction(id, user.id, type);

    logger.info('Feed interaction added', {
      userId: user.id,
      feedItemId: id,
      interactionType: type
    });

    res.json({
      success: true,
      message: 'Interaction added successfully',
      data: {
        interactionType: type,
        analytics: feedItem.analytics
      }
    });
  } catch (error) {
    logger.error('Failed to add interaction', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to add interaction'
    });
  }
};

/**
 * Remove interaction from feed item
 * @route DELETE /api/feeds/:id/interactions
 * @access Private
 */
const removeInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const user = req.user;

    if (!type || !['like', 'share', 'comment', 'bookmark'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid interaction type is required'
      });
    }

    const feedItem = await Feed.findById(id);

    if (!feedItem) {
      return res.status(404).json({
        success: false,
        message: 'Feed item not found'
      });
    }

    await feedItem.removeInteraction(user.id, type);

    logger.info('Feed interaction removed', {
      userId: user.id,
      feedItemId: id,
      interactionType: type
    });

    res.json({
      success: true,
      message: 'Interaction removed successfully',
      data: {
        interactionType: type,
        analytics: feedItem.analytics
      }
    });
  } catch (error) {
    logger.error('Failed to remove interaction', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to remove interaction'
    });
  }
};

/**
 * Get feed analytics for user
 * @route GET /api/feeds/analytics
 * @access Private
 */
const getFeedAnalytics = async (req, res) => {
  try {
    const user = req.user;
    const { timeframe = '30d' } = req.query;

    const analytics = await feedService.getFeedAnalytics(user.id, timeframe);

    logger.info('Feed analytics retrieved', {
      userId: user.id,
      timeframe
    });

    res.json({
      success: true,
      data: {
        timeframe,
        analytics
      }
    });
  } catch (error) {
    logger.error('Failed to get feed analytics', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feed analytics'
    });
  }
};

/**
 * Get feed by content type
 * @route GET /api/feeds/by-type/:contentType
 * @access Private
 */
const getFeedByType = async (req, res) => {
  try {
    const { contentType } = req.params;
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      timeframe = '30d',
      sortBy = 'recent'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      contentTypes: [contentType],
      timeframe,
      sortBy
    };

    const result = await feedService.getAggregatedFeed(user, options);

    logger.info('Feed by type retrieved', {
      userId: user.id,
      contentType,
      itemCount: result.items.length
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get feed by type', error, {
      userId: req.user?.id,
      contentType: req.params.contentType
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feed by type'
    });
  }
};

/**
 * Get user's own feed items
 * @route GET /api/feeds/my
 * @access Private
 */
const getMyFeedItems = async (req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      status
    } = req.query;

    const query = {
      author: user.id,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const items = await Feed.find(query)
      .populate('contentId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Feed.countDocuments(query);

    logger.info('User feed items retrieved', {
      userId: user.id,
      itemCount: items.length
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get user feed items', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feed items'
    });
  }
};

/**
 * Promote feed item
 * @route POST /api/feeds/:id/promote
 * @access Private (Admin)
 */
const promoteFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { budget, startDate, endDate, targetAudience } = req.body;

    const feedItem = await Feed.findById(id);

    if (!feedItem) {
      return res.status(404).json({
        success: false,
        message: 'Feed item not found'
      });
    }

    feedItem.isPromoted = true;
    feedItem.promotionData = {
      budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      startDate: startDate || new Date(),
      endDate
    };

    if (targetAudience) {
      feedItem.targetAudience = targetAudience;
    }

    await feedItem.save();

    logger.info('Feed item promoted', {
      userId: req.user.id,
      feedItemId: id
    });

    res.json({
      success: true,
      message: 'Feed item promoted successfully',
      data: feedItem
    });
  } catch (error) {
    logger.error('Failed to promote feed item', error, {
      userId: req.user?.id,
      feedItemId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to promote feed item'
    });
  }
};

module.exports = {
  getFeed,
  getTrending,
  getFeatured,
  getFeedItem,
  createFeedItem,
  updateFeedItem,
  deleteFeedItem,
  addInteraction,
  removeInteraction,
  getFeedAnalytics,
  getFeedByType,
  getMyFeedItems,
  promoteFeedItem
};
