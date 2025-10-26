const Activity = require('../models/Activity');
// const User = require('../models/User');
const { logger } = require('../utils/logger');

// Get activity feed for user
const getActivityFeed = async(req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      types = [],
      categories = [],
      visibility = 'public',
      includeOwn = true,
      timeframe = '7d'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      types: types ? types.split(',') : [],
      categories: categories ? categories.split(',') : [],
      visibility,
      includeOwn: includeOwn === 'true',
      timeframe
    };

    const activities = await Activity.getActivityFeed(user.id, options);
    const total = await Activity.countDocuments({
      isDeleted: false,
      isVisible: true,
      $or: [
        { user: user.id },
        { visibility: 'public' }
      ]
    });

    logger.info('Activity feed retrieved', {
      userId: user.id,
      options,
      resultCount: activities.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: {
        activities,
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
    logger.error('Failed to get activity feed', error, {
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity feed'
    });
  }
};

// Get user's own activities
const getUserActivities = async(req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 20,
      types = [],
      categories = [],
      timeframe = '30d'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      types: types ? types.split(',') : [],
      categories: categories ? categories.split(',') : [],
      timeframe
    };

    const activities = await Activity.getUserActivities(user.id, options);
    const total = await Activity.countDocuments({
      user: user.id,
      isDeleted: false
    });

    logger.info('User activities retrieved', {
      userId: user.id,
      options,
      resultCount: activities.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: {
        activities,
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
    logger.error('Failed to get user activities', error, {
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activities'
    });
  }
};

// Get specific user's activities (for admins or connections)
const getSpecificUserActivities = async(req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const {
      page = 1,
      limit = 20,
      types = [],
      categories = [],
      timeframe = '30d'
    } = req.query;

    // Check if user can view this user's activities
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      // Check if users are connected (you might want to implement this logic)
      // For now, only allow viewing public activities
      const publicActivities = await Activity.find({
        user: userId,
        isDeleted: false,
        visibility: 'public'
      })
        .populate('user', 'firstName lastName email avatar role')
        .populate('targetEntity.id')
        .populate('relatedEntities.id')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((page - 1) * limit)
        .lean();

      const total = await Activity.countDocuments({
        user: userId,
        isDeleted: false,
        visibility: 'public'
      });

      return res.json({
        success: true,
        data: {
          activities: publicActivities,
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
    }

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      types: types ? types.split(',') : [],
      categories: categories ? categories.split(',') : [],
      timeframe
    };

    const activities = await Activity.getUserActivities(userId, options);
    const total = await Activity.countDocuments({
      user: userId,
      isDeleted: false
    });

    logger.info('Specific user activities retrieved', {
      requestedBy: currentUser.id,
      targetUserId: userId,
      options,
      resultCount: activities.length
    });

    res.json({
      success: true,
      data: {
        activities,
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
    logger.error('Failed to get specific user activities', error, {
      userId: req.user?.id,
      targetUserId: req.params.userId,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activities'
    });
  }
};

// Get single activity
const getActivity = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const activity = await Activity.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('user', 'firstName lastName email avatar role')
      .populate('targetEntity.id')
      .populate('relatedEntities.id')
      .populate('interactions.user', 'firstName lastName email avatar');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can view this activity
    const canView = checkActivityAccess(activity, user);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this activity'
      });
    }

    // Increment view count if user is authenticated and not the owner
    if (user && user.id !== activity.user._id.toString()) {
      await activity.addInteraction(user.id, 'view');
    }

    logger.info('Activity retrieved', {
      userId: user?.id,
      activityId: id,
      activityType: activity.type
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Failed to get activity', error, {
      userId: req.user?.id,
      activityId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity'
    });
  }
};

// Create activity
const createActivity = async(req, res) => {
  try {
    const user = req.user;
    const activityData = {
      ...req.body,
      user: user.id
    };

    // Validate required fields
    if (!activityData.type || !activityData.action || !activityData.description) {
      return res.status(400).json({
        success: false,
        message: 'Type, action, and description are required'
      });
    }

    const activity = new Activity(activityData);
    await activity.save();

    await activity.populate('user', 'firstName lastName email avatar role');
    await activity.populate('targetEntity.id');
    await activity.populate('relatedEntities.id');

    logger.info('Activity created', {
      userId: user.id,
      activityId: activity._id,
      activityType: activity.type,
      activityAction: activity.action
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    logger.error('Failed to create activity', error, {
      userId: req.user?.id,
      activityData: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create activity'
    });
  }
};

// Update activity
const updateActivity = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    const activity = await Activity.findOne({
      _id: id,
      isDeleted: false
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can update this activity
    if (activity.user.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own activities'
      });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'firstName lastName email avatar role')
      .populate('targetEntity.id')
      .populate('relatedEntities.id');

    logger.info('Activity updated', {
      userId: user.id,
      activityId: id,
      activityType: updatedActivity.type,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: updatedActivity
    });
  } catch (error) {
    logger.error('Failed to update activity', error, {
      userId: req.user?.id,
      activityId: req.params.id,
      updateData: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update activity'
    });
  }
};

// Delete activity (soft delete)
const deleteActivity = async(req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const activity = await Activity.findOne({
      _id: id,
      isDeleted: false
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can delete this activity
    if (activity.user.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own activities'
      });
    }

    await activity.softDelete();

    logger.info('Activity deleted', {
      userId: user.id,
      activityId: id,
      activityType: activity.type
    });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete activity', error, {
      userId: req.user?.id,
      activityId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete activity'
    });
  }
};

// Add interaction to activity
const addInteraction = async(req, res) => {
  try {
    const { id } = req.params;
    const { type, metadata = {} } = req.body;
    const user = req.user;

    if (!type || !['view', 'like', 'share', 'comment', 'bookmark'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid interaction type is required'
      });
    }

    const activity = await Activity.findOne({
      _id: id,
      isDeleted: false
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can interact with this activity
    const canView = checkActivityAccess(activity, user);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this activity'
      });
    }

    await activity.addInteraction(user.id, type, metadata);

    logger.info('Activity interaction added', {
      userId: user.id,
      activityId: id,
      interactionType: type
    });

    res.json({
      success: true,
      message: 'Interaction added successfully',
      data: {
        interactionType: type,
        analytics: activity.analytics
      }
    });
  } catch (error) {
    logger.error('Failed to add interaction', error, {
      userId: req.user?.id,
      activityId: req.params.id,
      interactionType: req.body.type
    });

    res.status(500).json({
      success: false,
      message: 'Failed to add interaction'
    });
  }
};

// Remove interaction from activity
const removeInteraction = async(req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const user = req.user;

    if (!type || !['view', 'like', 'share', 'comment', 'bookmark'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid interaction type is required'
      });
    }

    const activity = await Activity.findOne({
      _id: id,
      isDeleted: false
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    await activity.removeInteraction(user.id, type);

    logger.info('Activity interaction removed', {
      userId: user.id,
      activityId: id,
      interactionType: type
    });

    res.json({
      success: true,
      message: 'Interaction removed successfully',
      data: {
        interactionType: type,
        analytics: activity.analytics
      }
    });
  } catch (error) {
    logger.error('Failed to remove interaction', error, {
      userId: req.user?.id,
      activityId: req.params.id,
      interactionType: req.body.type
    });

    res.status(500).json({
      success: false,
      message: 'Failed to remove interaction'
    });
  }
};

// Get activity statistics
const getActivityStats = async(req, res) => {
  try {
    const user = req.user;
    const { timeframe = '30d' } = req.query;

    const stats = await Activity.getActivityStats(user.id, timeframe);

    logger.info('Activity statistics retrieved', {
      userId: user.id,
      timeframe
    });

    res.json({
      success: true,
      data: {
        timeframe,
        stats: stats[0] || {
          totalActivities: 0,
          totalPoints: 0,
          categoryBreakdown: {},
          typeBreakdown: {}
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get activity statistics', error, {
      userId: req.user?.id,
      timeframe: req.query.timeframe
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity statistics'
    });
  }
};

// Get global activity statistics (admin only)
const getGlobalActivityStats = async(req, res) => {
  try {
    const user = req.user;

    // Only admins can view global statistics
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    const { timeframe = '30d' } = req.query;

    const timeframes = {
      '1h': 1 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const cutoff = new Date(Date.now() - timeframes[timeframe]);

    const stats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoff },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          uniqueUsers: { $addToSet: '$user' },
          categories: { $push: '$category' },
          types: { $push: '$type' }
        }
      },
      {
        $project: {
          totalActivities: 1,
          totalPoints: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          categoryBreakdown: {
            $reduce: {
              input: '$categories',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          },
          typeBreakdown: {
            $reduce: {
              input: '$types',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    logger.info('Global activity statistics retrieved', {
      userId: user.id,
      timeframe
    });

    res.json({
      success: true,
      data: {
        timeframe,
        stats: stats[0] || {
          totalActivities: 0,
          totalPoints: 0,
          uniqueUserCount: 0,
          categoryBreakdown: {},
          typeBreakdown: {}
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get global activity statistics', error, {
      userId: req.user?.id,
      timeframe: req.query.timeframe
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve global activity statistics'
    });
  }
};

// Get activity types and categories
const getActivityMetadata = async(req, res) => {
  try {
    const types = [
      'user_login', 'user_logout', 'user_register', 'profile_update', 'avatar_upload',
      'password_change', 'email_verification', 'phone_verification',
      'service_created', 'service_updated', 'service_deleted', 'service_published',
      'service_viewed', 'service_favorited', 'service_shared',
      'booking_created', 'booking_accepted', 'booking_rejected', 'booking_completed',
      'booking_cancelled', 'booking_rescheduled',
      'review_created', 'review_updated', 'review_deleted',
      'job_created', 'job_updated', 'job_deleted', 'job_published', 'job_closed',
      'job_applied', 'job_application_withdrawn', 'job_application_approved',
      'job_application_rejected', 'job_application_shortlisted',
      'course_created', 'course_updated', 'course_deleted', 'course_published',
      'course_enrolled', 'course_completed', 'course_progress_updated',
      'course_review_created', 'certificate_earned',
      'payment_made', 'payment_received', 'payment_failed', 'payment_refunded',
      'withdrawal_requested', 'withdrawal_approved', 'withdrawal_rejected',
      'invoice_created', 'invoice_paid', 'invoice_overdue',
      'message_sent', 'message_received', 'conversation_started',
      'notification_sent', 'notification_read', 'email_sent',
      'agency_joined', 'agency_left', 'agency_created', 'agency_updated',
      'provider_added', 'provider_removed', 'provider_status_updated',
      'referral_sent', 'referral_accepted', 'referral_completed',
      'referral_reward_earned', 'referral_invitation_sent',
      'verification_requested', 'verification_approved', 'verification_rejected',
      'document_uploaded', 'document_verified', 'badge_earned',
      'supply_created', 'supply_ordered', 'supply_delivered', 'supply_reviewed',
      'rental_created', 'rental_booked', 'rental_returned', 'rental_reviewed',
      'ad_created', 'ad_updated', 'ad_published', 'ad_clicked', 'ad_promoted',
      'settings_updated', 'preferences_changed', 'subscription_created',
      'subscription_cancelled', 'subscription_renewed',
      'connection_made', 'connection_removed', 'follow_started', 'follow_stopped',
      'content_liked', 'content_shared', 'content_commented',
      'search_performed', 'filter_applied', 'export_requested', 'report_generated'
    ];

    const categories = [
      'authentication', 'profile', 'marketplace', 'job_board', 'academy',
      'financial', 'communication', 'agency', 'referral', 'verification',
      'supplies', 'rentals', 'advertising', 'system', 'social', 'other'
    ];

    const impactLevels = ['low', 'medium', 'high', 'critical'];
    const visibilityLevels = ['public', 'private', 'connections', 'followers'];

    res.json({
      success: true,
      data: {
        types,
        categories,
        impactLevels,
        visibilityLevels,
        timeframes: ['1h', '1d', '7d', '30d', '90d']
      }
    });
  } catch (error) {
    logger.error('Failed to get activity metadata', error, {
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity metadata'
    });
  }
};

// Helper function to check activity access
const checkActivityAccess = (activity, user) => {
  if (!user) {
    // Public activities only for non-authenticated users
    return activity.visibility === 'public';
  }

  // Admin can access all activities
  if (user.role === 'admin') {
    return true;
  }

  // User can always access their own activities
  if (activity.user._id.toString() === user.id) {
    return true;
  }

  // Check visibility
  if (activity.visibility === 'public') {
    return true;
  }

  if (activity.visibility === 'private') {
    return false;
  }

  // For connections and followers, you might want to implement connection logic
  // For now, we'll allow public access
  return activity.visibility === 'public';
};

module.exports = {
  getActivityFeed,
  getUserActivities,
  getSpecificUserActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addInteraction,
  removeInteraction,
  getActivityStats,
  getGlobalActivityStats,
  getActivityMetadata
};
