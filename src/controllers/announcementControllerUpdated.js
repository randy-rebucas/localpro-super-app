const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { auditGeneralOperations } = require('../middleware/auditLogger');
const { paginationMiddleware, sendPaginatedResponse } = require('../middleware/paginationMiddleware');
const { paginationService } = require('../services/paginationService');
const { sendServerError } = require('../utils/responseHelper');

/**
 * Updated Announcement Controller with Standardized Pagination
 * Demonstrates the new pagination system implementation
 */

// Get all announcements (public and filtered) with standardized pagination
const getAnnouncements = async (req, res) => {
  try {
    const {
      type,
      priority,
      status = 'published',
      targetAudience,
      search,
      tags,
      isSticky,
      author
    } = req.query;

    // Build base query
    const query = { isDeleted: false };

    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isSticky !== undefined) query.isSticky = isSticky === 'true';
    if (author) query.author = author;

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // For published announcements, filter by date
    if (status === 'published') {
      const now = new Date();
      query.$and = [
        {
          $or: [
            { scheduledAt: { $lte: now } },
            { scheduledAt: null }
          ]
        },
        {
          $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null }
          ]
        }
      ];
    }

    // Use the new pagination service
    const result = await paginationService.executeHybridPagination(
      Announcement,
      query,
      req.pagination,
      {
        useCursor: req.query.useCursor === 'true',
        cursorThreshold: 5000,
        queryOptions: {
          populate: [
            { path: 'author', select: 'firstName lastName email avatar role' },
            { path: 'metadata.lastModifiedBy', select: 'firstName lastName email' }
          ]
        }
      }
    );

    // Log the request
    logger.info('Announcements retrieved with new pagination', {
      userId: req.user?.id,
      query: req.query,
      resultCount: result.results.length,
      totalCount: result.pagination.total,
      paginationType: req.query.useCursor === 'true' ? 'cursor' : 'offset',
      performance: result.performance
    });

    // Send standardized response
    return sendPaginatedResponse(
      res,
      result.results,
      result.pagination,
      'Announcements retrieved successfully',
      {
        filters: {
          type,
          priority,
          status,
          targetAudience,
          search,
          tags,
          isSticky,
          author
        },
        performance: result.performance
      }
    );

  } catch (error) {
    logger.error('Failed to get announcements', error, {
      userId: req.user?.id,
      query: req.query
    });
    
    return sendServerError(res, error, 'Failed to retrieve announcements');
  }
};

// Get announcements for current user (personalized) with cursor pagination
const getMyAnnouncements = async (req, res) => {
  try {
    const {
      type,
      priority,
      status = 'published',
      search,
      tags,
      isSticky
    } = req.query;

    // Build personalized query
    const query = { 
      isDeleted: false,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: req.user.role },
        { targetAudience: { $in: req.user.interests || [] } }
      ]
    };

    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (isSticky !== undefined) query.isSticky = isSticky === 'true';

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // For published announcements, filter by date
    if (status === 'published') {
      const now = new Date();
      query.$and = query.$and || [];
      query.$and.push(
        {
          $or: [
            { scheduledAt: { $lte: now } },
            { scheduledAt: null }
          ]
        },
        {
          $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null }
          ]
        }
      );
    }

    // Use cursor pagination for personalized results (better for real-time feeds)
    const result = await paginationService.executeCursorPagination(
      Announcement,
      query,
      req.pagination,
      {
        queryOptions: {
          populate: [
            { path: 'author', select: 'firstName lastName email avatar role' },
            { path: 'metadata.lastModifiedBy', select: 'firstName lastName email' }
          ]
        }
      }
    );

    // Log the request
    logger.info('Personalized announcements retrieved with cursor pagination', {
      userId: req.user?.id,
      query: req.query,
      resultCount: result.results.length,
      paginationType: 'cursor',
      performance: result.performance
    });

    // Send standardized response
    return sendPaginatedResponse(
      res,
      result.results,
      result.pagination,
      'Personalized announcements retrieved successfully',
      {
        filters: {
          type,
          priority,
          status,
          search,
          tags,
          isSticky
        },
        performance: result.performance,
        personalized: true
      }
    );

  } catch (error) {
    logger.error('Failed to get personalized announcements', error, {
      userId: req.user?.id,
      query: req.query
    });
    
    return sendServerError(res, error, 'Failed to retrieve personalized announcements');
  }
};

// Get announcement by ID (unchanged)
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'firstName lastName email avatar role')
      .populate('metadata.lastModifiedBy', 'firstName lastName email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if announcement is published and not expired
    if (announcement.status === 'published') {
      const now = new Date();
      if (announcement.scheduledAt && announcement.scheduledAt > now) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not yet published'
        });
      }
      if (announcement.expiresAt && announcement.expiresAt < now) {
        return res.status(404).json({
          success: false,
          message: 'Announcement has expired'
        });
      }
    }

    res.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    logger.error('Failed to get announcement', error, {
      userId: req.user?.id,
      announcementId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcement'
    });
  }
};

// Create announcement (unchanged)
const createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      author: req.user.id,
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        createdAt: new Date(),
        lastModifiedAt: new Date()
      }
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();

    await announcement.populate('author', 'firstName lastName email avatar role');

    // Audit log
    await auditGeneralOperations('announcement_created', req, announcement._id, announcement.title);

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    logger.error('Failed to create announcement', error, {
      userId: req.user?.id,
      announcementData: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

// Update announcement (unchanged)
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions
    if (announcement.author.toString() !== req.user.id && !req.user.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }

    const updateData = {
      ...req.body,
      'metadata.lastModifiedBy': req.user.id,
      'metadata.lastModifiedAt': new Date()
    };

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email avatar role')
     .populate('metadata.lastModifiedBy', 'firstName lastName email');

    // Audit log
    await auditGeneralOperations('announcement_updated', req, announcement._id, announcement.title);

    res.json({
      success: true,
      data: updatedAnnouncement,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update announcement', error, {
      userId: req.user?.id,
      announcementId: req.params.id,
      updateData: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
};

// Delete announcement (unchanged)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions
    if (announcement.author.toString() !== req.user.id && !req.user.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }

    // Soft delete
    announcement.isDeleted = true;
    announcement['metadata.lastModifiedBy'] = req.user.id;
    announcement['metadata.lastModifiedAt'] = new Date();
    await announcement.save();

    // Audit log
    await auditGeneralOperations('announcement_deleted', req, announcement._id, announcement.title);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete announcement', error, {
      userId: req.user?.id,
      announcementId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
};

module.exports = {
  getAnnouncements,
  getMyAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
