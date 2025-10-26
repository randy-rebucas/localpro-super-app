const Announcement = require('../models/Announcement');
const { logger } = require('../utils/logger');

// Get all announcements (public and filtered)
const getAnnouncements = async(req, res) => {
  try {
    const {
      type,
      priority,
      status = 'published',
      targetAudience,
      page = 1,
      limit = 20,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      search,
      tags,
      isSticky,
      author
    } = req.query;

    const query = { isDeleted: false };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by target audience
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }

    // Filter by sticky
    if (isSticky !== undefined) {
      query.isSticky = isSticky === 'true';
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by tags
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

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName email avatar role')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    // Log the request
    logger.info('Announcements retrieved', {
      userId: req.user?.id,
      query: req.query,
      resultCount: announcements.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get announcements', error, {
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements'
    });
  }
};

// Get announcements for current user (personalized)
const getMyAnnouncements = async(req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      includeAcknowledged = false
    } = req.query;

    let query = {
      isDeleted: false,
      status: 'published',
      $and: [
        {
          $or: [
            { scheduledAt: { $lte: new Date() } },
            { scheduledAt: null }
          ]
        },
        {
          $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
          ]
        }
      ]
    };

    // Filter by target audience and user role
    query.$or = [
      { targetAudience: 'all' },
      { targetAudience: user.role },
      { targetRoles: { $in: [user.role] } }
    ];

    // If not including acknowledged announcements, filter them out
    if (!includeAcknowledged) {
      query['acknowledgments.user'] = { $ne: user.id };
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName email avatar role')
      .sort({ isSticky: -1, priority: -1, publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    // Add acknowledgment status for each announcement
    const announcementsWithStatus = announcements.map(announcement => {
      const isAcknowledged = announcement.acknowledgments.some(
        ack => ack.user.toString() === user.id
      );

      return {
        ...announcement,
        isAcknowledged,
        acknowledgmentCount: announcement.acknowledgments.length
      };
    });

    logger.info('User announcements retrieved', {
      userId: user.id,
      resultCount: announcementsWithStatus.length,
      includeAcknowledged
    });

    res.json({
      success: true,
      data: {
        announcements: announcementsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get user announcements', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user announcements'
    });
  }
};

// Get single announcement
const getAnnouncement = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID format'
      });
    }

    const announcement = await Announcement.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('author', 'firstName lastName email avatar role')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('acknowledgments.user', 'firstName lastName email avatar')
      .populate('comments.user', 'firstName lastName email avatar')
      .populate('comments.replies.user', 'firstName lastName email avatar');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can view this announcement
    const canView = checkAnnouncementAccess(announcement, user);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this announcement'
      });
    }

    // Increment views if user is authenticated
    if (user) {
      await announcement.incrementViews(user.id);
    }

    // Add user-specific data
    const isAcknowledged = user ? announcement.acknowledgments.some(
      ack => ack.user.toString() === user.id
    ) : false;

    const announcementWithStatus = {
      ...announcement.toObject(),
      isAcknowledged,
      canComment: announcement.allowComments,
      canAcknowledge: announcement.requireAcknowledgment && !isAcknowledged
    };

    logger.info('Announcement retrieved', {
      userId: user?.id,
      announcementId: id,
      announcementTitle: announcement.title
    });

    res.json({
      success: true,
      data: announcementWithStatus
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

// Create announcement
const createAnnouncement = async(req, res) => {
  try {
    const user = req.user;
    const announcementData = {
      ...req.body,
      author: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorRole: user.role
    };

    // Validate required fields
    if (!announcementData.title || !announcementData.content || !announcementData.summary) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and summary are required'
      });
    }

    const announcement = new Announcement(announcementData);
    await announcement.save();

    await announcement.populate('author', 'firstName lastName email avatar role');

    logger.info('Announcement created', {
      userId: user.id,
      announcementId: announcement._id,
      announcementTitle: announcement.title,
      announcementType: announcement.type
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
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

// Update announcement
const updateAnnouncement = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    const announcement = await Announcement.findOne({
      _id: id,
      isDeleted: false
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can update this announcement
    if (announcement.author.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own announcements'
      });
    }

    // Update metadata
    updateData.metadata = {
      ...announcement.metadata,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date()
    };

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email avatar role')
      .populate('metadata.lastModifiedBy', 'firstName lastName email');

    logger.info('Announcement updated', {
      userId: user.id,
      announcementId: id,
      announcementTitle: updatedAnnouncement.title,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
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

// Delete announcement (soft delete)
const deleteAnnouncement = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const announcement = await Announcement.findOne({
      _id: id,
      isDeleted: false
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can delete this announcement
    if (announcement.author.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own announcements'
      });
    }

    await announcement.softDelete(user.id);

    logger.info('Announcement deleted', {
      userId: user.id,
      announcementId: id,
      announcementTitle: announcement.title
    });

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

// Acknowledge announcement
const acknowledgeAnnouncement = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const announcement = await Announcement.findOne({
      _id: id,
      isDeleted: false,
      status: 'published'
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can acknowledge this announcement
    const canView = checkAnnouncementAccess(announcement, user);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this announcement'
      });
    }

    await announcement.acknowledge(user.id);

    logger.info('Announcement acknowledged', {
      userId: user.id,
      announcementId: id,
      announcementTitle: announcement.title
    });

    res.json({
      success: true,
      message: 'Announcement acknowledged successfully',
      data: {
        acknowledgmentCount: announcement.acknowledgments.length
      }
    });
  } catch (error) {
    logger.error('Failed to acknowledge announcement', error, {
      userId: req.user?.id,
      announcementId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge announcement'
    });
  }
};

// Add comment to announcement
const addComment = async(req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const announcement = await Announcement.findOne({
      _id: id,
      isDeleted: false,
      status: 'published'
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can comment on this announcement
    const canView = checkAnnouncementAccess(announcement, user);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this announcement'
      });
    }

    await announcement.addComment(user.id, `${user.firstName} ${user.lastName}`, content);

    // Get updated announcement with comments
    const updatedAnnouncement = await Announcement.findById(id)
      .populate('comments.user', 'firstName lastName email avatar')
      .populate('comments.replies.user', 'firstName lastName email avatar');

    logger.info('Comment added to announcement', {
      userId: user.id,
      announcementId: id,
      commentLength: content.length
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: updatedAnnouncement.comments[updatedAnnouncement.comments.length - 1],
        totalComments: updatedAnnouncement.comments.length
      }
    });
  } catch (error) {
    logger.error('Failed to add comment', error, {
      userId: req.user?.id,
      announcementId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// Get announcement statistics
const getAnnouncementStats = async(req, res) => {
  try {
    const user = req.user;

    // Only admins can view statistics
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    const stats = await Announcement.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalAnnouncements: { $sum: 1 },
          publishedAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          scheduledAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          totalViews: { $sum: '$views' },
          totalAcknowledged: { $sum: '$analytics.totalAcknowledged' },
          totalComments: { $sum: '$analytics.totalComments' }
        }
      }
    ]);

    const typeStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const priorityStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    logger.info('Announcement statistics retrieved', {
      userId: user.id
    });

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAnnouncements: 0,
          publishedAnnouncements: 0,
          draftAnnouncements: 0,
          scheduledAnnouncements: 0,
          totalViews: 0,
          totalAcknowledged: 0,
          totalComments: 0
        },
        typeBreakdown: typeStats,
        priorityBreakdown: priorityStats
      }
    });
  } catch (error) {
    logger.error('Failed to get announcement statistics', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcement statistics'
    });
  }
};

// Helper function to check announcement access
const checkAnnouncementAccess = (announcement, user) => {
  if (!user) {
    // Public announcements only for non-authenticated users
    return announcement.targetAudience === 'all';
  }

  // Admin can access all announcements
  if (user.role === 'admin') {
    return true;
  }

  // Check target audience
  if (announcement.targetAudience === 'all') {
    return true;
  }

  if (announcement.targetAudience === user.role) {
    return true;
  }

  if (announcement.targetRoles && announcement.targetRoles.includes(user.role)) {
    return true;
  }

  return false;
};

module.exports = {
  getAnnouncements,
  getMyAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  acknowledgeAnnouncement,
  addComment,
  getAnnouncementStats
};
