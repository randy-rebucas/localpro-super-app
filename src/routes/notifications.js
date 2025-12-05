const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * @route   POST /api/notifications/fcm-token
 * @desc    Register or update FCM token for push notifications
 * @access  Private
 */
router.post('/fcm-token', 
  auth,
  [
    body('token').notEmpty().withMessage('FCM token is required'),
    body('deviceId').notEmpty().withMessage('Device ID is required'),
    body('deviceType').optional().isIn(['ios', 'android', 'web'])
  ],
  async (req, res) => {
    try {
      const { token, deviceId, deviceType } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.addFcmToken(token, deviceId, deviceType || 'android');
      await user.save();

      res.status(200).json({
        success: true,
        message: 'FCM token registered successfully',
        data: {
          deviceCount: user.fcmTokens?.length || 0
        }
      });
    } catch (error) {
      console.error('Register FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/notifications/fcm-token/:tokenOrDeviceId
 * @desc    Remove FCM token
 * @access  Private
 */
router.delete('/fcm-token/:tokenOrDeviceId',
  auth,
  async (req, res) => {
    try {
      const { tokenOrDeviceId } = req.params;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.removeFcmToken(tokenOrDeviceId);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'FCM token removed successfully',
        data: {
          deviceCount: user.fcmTokens?.length || 0
        }
      });
    } catch (error) {
      console.error('Remove FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   GET /api/notifications/fcm-tokens
 * @desc    Get user's registered FCM tokens/devices
 * @access  Private
 */
router.get('/fcm-tokens',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('fcmTokens');
      
      res.status(200).json({
        success: true,
        data: {
          devices: (user?.fcmTokens || []).map(t => ({
            deviceId: t.deviceId,
            deviceType: t.deviceType,
            registeredAt: t.createdAt,
            lastUsedAt: t.lastUsedAt
          })),
          count: user?.fcmTokens?.length || 0
        }
      });
    } catch (error) {
      console.error('Get FCM tokens error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   GET /api/notifications/settings
 * @desc    Get user notification settings/preferences
 * @access  Private
 */
router.get('/settings',
  auth,
  async (req, res) => {
    try {
      const settings = await NotificationService.getUserNotificationSettings(req.user.id);
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   GET /api/notifications/check/:type
 * @desc    Check if a specific notification type is enabled for user
 * @access  Private
 */
router.get('/check/:type',
  auth,
  [
    param('type').notEmpty(),
    query('channel').optional().isIn(['push', 'email', 'sms'])
  ],
  async (req, res) => {
    try {
      const { type } = req.params;
      const { channel = 'push' } = req.query;
      
      const isEnabled = await NotificationService.isNotificationEnabled(
        req.user.id, 
        type, 
        channel
      );
      
      res.status(200).json({
        success: true,
        data: {
          type,
          channel,
          enabled: isEnabled
        }
      });
    } catch (error) {
      console.error('Check notification enabled error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   POST /api/notifications/send
 * @desc    Send a notification to a user (admin only)
 * @access  Admin
 */
router.post('/send',
  auth,
  authorize('admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('type').notEmpty().isIn([
      'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed',
      'job_application', 'application_status_update', 'job_posted',
      'message_received', 'payment_received', 'payment_failed',
      'referral_reward', 'course_enrollment', 'order_confirmation',
      'subscription_renewal', 'subscription_cancelled', 'system_announcement'
    ]).withMessage('Invalid notification type'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('data').optional().isObject(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('forceChannels').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { userId, type, title, message, data, priority, forceChannels } = req.body;
      
      const result = await NotificationService.sendNotification({
        userId,
        type,
        title,
        message,
        data,
        priority,
        forceChannels
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to send notification'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   POST /api/notifications/send-bulk
 * @desc    Send notification to multiple users (admin only)
 * @access  Admin
 */
router.post('/send-bulk',
  auth,
  authorize('admin'),
  [
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID format'),
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('data').optional().isObject(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  async (req, res) => {
    try {
      const { userIds, type, title, message, data, priority } = req.body;
      
      const result = await NotificationService.sendBulkNotification({
        userIds,
        type,
        title,
        message,
        data,
        priority
      });

      res.status(200).json({
        success: true,
        message: `Notification sent to ${result.successCount}/${result.total} users`,
        data: result
      });
    } catch (error) {
      console.error('Send bulk notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   POST /api/notifications/announcement
 * @desc    Send system announcement to all users or specific users (admin only)
 * @access  Admin
 */
router.post('/announcement',
  auth,
  authorize('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('userIds').optional().isArray(),
    body('userIds.*').optional().isMongoId(),
    body('targetRoles').optional().isArray(),
    body('targetRoles.*').optional().isIn(['client', 'provider', 'admin', 'supplier', 'instructor']),
    body('expiresAt').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const { title, message, userIds, targetRoles, expiresAt, data } = req.body;
      
      let targetUserIds = userIds;
      
      // If no specific userIds provided, get users by role
      if (!targetUserIds || targetUserIds.length === 0) {
        const query = { isActive: true };
        if (targetRoles && targetRoles.length > 0) {
          query.roles = { $in: targetRoles };
        }
        
        const users = await User.find(query).select('_id').limit(10000);
        targetUserIds = users.map(u => u._id.toString());
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No target users found'
        });
      }

      const result = await NotificationService.sendSystemAnnouncement({
        userIds: targetUserIds,
        title,
        message,
        data: data || {},
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      res.status(200).json({
        success: true,
        message: `Announcement sent to ${result.successCount} users`,
        data: result
      });
    } catch (error) {
      console.error('Send announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification to the current user
 * @access  Private
 */
router.post('/test',
  auth,
  [
    body('type').optional().isIn(['push', 'email', 'sms', 'all']).withMessage('Invalid test type')
  ],
  async (req, res) => {
    try {
      const { type = 'all' } = req.body;
      
      const result = await NotificationService.sendNotification({
        userId: req.user.id,
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification settings are working correctly.',
        data: {
          isTest: true,
          timestamp: new Date().toISOString()
        },
        priority: 'low',
        forceChannels: type === 'all'
      });

      res.status(200).json({
        success: true,
        message: 'Test notification sent',
        data: result
      });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications (uses communication controller)
 * @access  Private
 * @note    This route is also available at /api/communication/notifications
 */
router.get('/',
  auth,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, isRead, type } = req.query;
      const skip = (page - 1) * limit;

      const query = {
        user: req.user.id,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      };

      if (isRead !== undefined) {
        query.isRead = isRead === 'true';
      }

      if (type) {
        query.type = type;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Notification.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        data: notifications
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count',
  auth,
  async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        user: req.user.id,
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read',
  auth,
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all',
  auth,
  async (req, res) => {
    try {
      const result = await Notification.updateMany(
        { user: req.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id',
  auth,
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for user
 * @access  Private
 */
router.delete('/',
  auth,
  [
    query('readOnly').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { readOnly } = req.query;
      
      const query = { user: req.user.id };
      if (readOnly === 'true') {
        query.isRead = true;
      }

      const result = await Notification.deleteMany(query);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} notifications deleted`,
        data: { deletedCount: result.deletedCount }
      });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;

