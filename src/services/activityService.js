const Activity = require('../models/Activity');
const { logger } = require('../utils/logger');

/**
 * ActivityService - Centralized service for tracking user activities across the application
 * 
 * This service provides:
 * - Automatic activity creation with proper categorization
 * - Activity tracking helpers for all modules
 * - Activity aggregation and timeline generation
 * - Points calculation and gamification support
 * - Social feed generation
 */
class ActivityService {
  constructor() {
    // Category mapping from activity types
    this.categoryMap = {
      // Authentication & Profile
      'user_login': 'authentication',
      'user_logout': 'authentication',
      'user_register': 'authentication',
      'profile_update': 'profile',
      'avatar_upload': 'profile',
      'password_change': 'authentication',
      'email_verification': 'authentication',
      'phone_verification': 'authentication',
      
      // Marketplace
      'service_created': 'marketplace',
      'service_updated': 'marketplace',
      'service_deleted': 'marketplace',
      'service_published': 'marketplace',
      'service_viewed': 'marketplace',
      'service_favorited': 'marketplace',
      'service_shared': 'marketplace',
      'booking_created': 'marketplace',
      'booking_accepted': 'marketplace',
      'booking_rejected': 'marketplace',
      'booking_completed': 'marketplace',
      'booking_cancelled': 'marketplace',
      'booking_rescheduled': 'marketplace',
      'review_created': 'marketplace',
      'review_updated': 'marketplace',
      'review_deleted': 'marketplace',
      
      // Job Board
      'job_created': 'job_board',
      'job_updated': 'job_board',
      'job_deleted': 'job_board',
      'job_published': 'job_board',
      'job_closed': 'job_board',
      'job_applied': 'job_board',
      'job_application_withdrawn': 'job_board',
      'job_application_approved': 'job_board',
      'job_application_rejected': 'job_board',
      'job_application_shortlisted': 'job_board',
      
      // Academy
      'course_created': 'academy',
      'course_updated': 'academy',
      'course_deleted': 'academy',
      'course_published': 'academy',
      'course_enrolled': 'academy',
      'course_completed': 'academy',
      'course_progress_updated': 'academy',
      'course_review_created': 'academy',
      'certificate_earned': 'academy',
      
      // Financial
      'payment_made': 'financial',
      'payment_received': 'financial',
      'payment_failed': 'financial',
      'payment_refunded': 'financial',
      'withdrawal_requested': 'financial',
      'withdrawal_approved': 'financial',
      'withdrawal_rejected': 'financial',
      'invoice_created': 'financial',
      'invoice_paid': 'financial',
      'invoice_overdue': 'financial',
      
      // Communication
      'message_sent': 'communication',
      'message_received': 'communication',
      'conversation_started': 'communication',
      'notification_sent': 'communication',
      'notification_read': 'communication',
      'email_sent': 'communication',
      
      // Agency
      'agency_joined': 'agency',
      'agency_left': 'agency',
      'agency_created': 'agency',
      'agency_updated': 'agency',
      'provider_added': 'agency',
      'provider_removed': 'agency',
      'provider_status_updated': 'agency',
      
      // Referral
      'referral_sent': 'referral',
      'referral_accepted': 'referral',
      'referral_completed': 'referral',
      'referral_reward_earned': 'referral',
      'referral_invitation_sent': 'referral',
      
      // Verification
      'verification_requested': 'verification',
      'verification_approved': 'verification',
      'verification_rejected': 'verification',
      'document_uploaded': 'verification',
      'document_verified': 'verification',
      'badge_earned': 'verification',
      
      // Supplies & Rentals
      'supply_created': 'supplies',
      'supply_ordered': 'supplies',
      'supply_delivered': 'supplies',
      'supply_reviewed': 'supplies',
      'rental_created': 'rentals',
      'rental_booked': 'rentals',
      'rental_returned': 'rentals',
      'rental_reviewed': 'rentals',
      
      // Advertising
      'ad_created': 'advertising',
      'ad_updated': 'advertising',
      'ad_published': 'advertising',
      'ad_clicked': 'advertising',
      'ad_promoted': 'advertising',
      
      // System
      'settings_updated': 'system',
      'preferences_changed': 'system',
      'subscription_created': 'system',
      'subscription_cancelled': 'system',
      'subscription_renewed': 'system',
      
      // Social
      'connection_made': 'social',
      'connection_removed': 'social',
      'follow_started': 'social',
      'follow_stopped': 'social',
      'content_liked': 'social',
      'content_shared': 'social',
      'content_commented': 'social',
      
      // Other
      'search_performed': 'other',
      'filter_applied': 'other',
      'export_requested': 'other',
      'report_generated': 'other'
    };

    // Impact levels for different activity types
    this.impactLevels = {
      // Critical impact
      'payment_made': 'critical',
      'payment_received': 'critical',
      'withdrawal_approved': 'critical',
      'verification_approved': 'critical',
      
      // High impact
      'user_register': 'high',
      'service_created': 'high',
      'booking_completed': 'high',
      'course_completed': 'high',
      'certificate_earned': 'high',
      'referral_completed': 'high',
      'agency_created': 'high',
      'job_created': 'high',
      
      // Medium impact (default)
      'service_updated': 'medium',
      'booking_created': 'medium',
      'job_applied': 'medium',
      'course_enrolled': 'medium',
      'review_created': 'medium',
      'message_sent': 'medium',
      
      // Low impact
      'user_login': 'low',
      'user_logout': 'low',
      'service_viewed': 'low',
      'profile_update': 'low',
      'settings_updated': 'low',
      'search_performed': 'low'
    };

    // Points system for gamification
    this.pointsMap = {
      'user_register': 100,
      'email_verification': 50,
      'phone_verification': 50,
      'profile_update': 10,
      'avatar_upload': 20,
      'service_created': 50,
      'service_published': 30,
      'booking_completed': 40,
      'review_created': 25,
      'job_created': 40,
      'job_applied': 15,
      'course_enrolled': 20,
      'course_completed': 100,
      'certificate_earned': 150,
      'referral_sent': 10,
      'referral_completed': 200,
      'verification_approved': 100,
      'badge_earned': 50,
      'connection_made': 5,
      'follow_started': 3
    };
  }

  /**
   * Get category for a given activity type
   * @param {string} type - Activity type
   * @returns {string} - Category name
   */
  getCategoryFromType(type) {
    return this.categoryMap[type] || 'other';
  }

  /**
   * Get impact level for a given activity type
   * @param {string} type - Activity type
   * @returns {string} - Impact level
   */
  getImpactLevel(type) {
    return this.impactLevels[type] || 'medium';
  }

  /**
   * Get points for a given activity type
   * @param {string} type - Activity type
   * @returns {number} - Points value
   */
  getPoints(type) {
    return this.pointsMap[type] || 5;
  }

  /**
   * Create a new activity
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} - Created activity
   */
  async createActivity(activityData) {
    try {
      const {
        userId,
        type,
        action,
        description,
        targetEntity,
        relatedEntities,
        location,
        metadata,
        visibility = 'private',
        tags = [],
        details = {}
      } = activityData;

      // Auto-determine category, impact, and points
      const category = this.getCategoryFromType(type);
      const impact = this.getImpactLevel(type);
      const points = this.getPoints(type);

      const activity = new Activity({
        user: userId,
        type,
        category,
        action,
        description,
        targetEntity,
        relatedEntities,
        location,
        metadata,
        visibility,
        tags,
        details,
        impact,
        points
      });

      await activity.save();
      
      // Populate user details
      await activity.populate('user', 'firstName lastName email avatar role');

      logger.debug('Activity created', {
        activityId: activity._id,
        userId,
        type,
        category,
        impact,
        points
      });

      return activity;
    } catch (error) {
      logger.error('Failed to create activity', error, {
        userId: activityData.userId,
        type: activityData.type
      });
      throw error;
    }
  }

  /**
   * Track user login
   * @param {string} userId - User ID
   * @param {Object} metadata - Login metadata (IP, user agent, etc.)
   * @returns {Promise<Object>} - Created activity
   */
  async trackLogin(userId, metadata = {}) {
    return this.createActivity({
      userId,
      type: 'user_login',
      action: 'Logged in',
      description: 'User logged into their account',
      metadata: {
        ...metadata,
        loginTime: new Date()
      },
      visibility: 'private'
    });
  }

  /**
   * Track user logout
   * @param {string} userId - User ID
   * @param {Object} metadata - Logout metadata
   * @returns {Promise<Object>} - Created activity
   */
  async trackLogout(userId, metadata = {}) {
    return this.createActivity({
      userId,
      type: 'user_logout',
      action: 'Logged out',
      description: 'User logged out of their account',
      metadata: {
        ...metadata,
        logoutTime: new Date()
      },
      visibility: 'private'
    });
  }

  /**
   * Track user registration
   * @param {string} userId - User ID
   * @param {Object} userInfo - User information
   * @returns {Promise<Object>} - Created activity
   */
  async trackRegistration(userId, userInfo = {}) {
    return this.createActivity({
      userId,
      type: 'user_register',
      action: 'Registered',
      description: `${userInfo.firstName || 'User'} joined LocalPro`,
      metadata: {
        registrationTime: new Date(),
        method: userInfo.method || 'email'
      },
      visibility: 'public',
      tags: ['new_user', 'registration']
    });
  }

  /**
   * Track profile update
   * @param {string} userId - User ID
   * @param {Object} changes - What was changed
   * @returns {Promise<Object>} - Created activity
   */
  async trackProfileUpdate(userId, changes = {}) {
    return this.createActivity({
      userId,
      type: 'profile_update',
      action: 'Updated profile',
      description: 'User updated their profile information',
      metadata: {
        changedFields: Object.keys(changes),
        updateTime: new Date()
      },
      visibility: 'private'
    });
  }

  /**
   * Track service creation
   * @param {string} userId - User ID (provider)
   * @param {Object} service - Service details
   * @returns {Promise<Object>} - Created activity
   */
  async trackServiceCreated(userId, service) {
    return this.createActivity({
      userId,
      type: 'service_created',
      action: 'Created a service',
      description: `Created new service: ${service.title || 'Untitled'}`,
      targetEntity: {
        type: 'service',
        id: service._id,
        name: service.title,
        url: `/services/${service._id}`
      },
      metadata: {
        category: service.category,
        price: service.price
      },
      visibility: 'public',
      tags: ['service', 'new', service.category].filter(Boolean)
    });
  }

  /**
   * Track booking creation
   * @param {string} userId - Client user ID
   * @param {Object} booking - Booking details
   * @param {Object} service - Service details
   * @returns {Promise<Object>} - Created activity
   */
  async trackBookingCreated(userId, booking, service) {
    return this.createActivity({
      userId,
      type: 'booking_created',
      action: 'Made a booking',
      description: `Booked service: ${service.title || 'Service'}`,
      targetEntity: {
        type: 'booking',
        id: booking._id,
        name: service.title,
        url: `/bookings/${booking._id}`
      },
      relatedEntities: [
        {
          type: 'service',
          id: service._id,
          name: service.title,
          role: 'service'
        }
      ],
      metadata: {
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount
      },
      visibility: 'private'
    });
  }

  /**
   * Track booking completion
   * @param {string} userId - User ID
   * @param {Object} booking - Booking details
   * @param {string} role - 'client' or 'provider'
   * @returns {Promise<Object>} - Created activity
   */
  async trackBookingCompleted(userId, booking, role) {
    return this.createActivity({
      userId,
      type: 'booking_completed',
      action: role === 'provider' ? 'Completed service' : 'Service completed',
      description: role === 'provider' 
        ? 'Successfully completed a service booking'
        : 'A booked service was completed',
      targetEntity: {
        type: 'booking',
        id: booking._id,
        url: `/bookings/${booking._id}`
      },
      metadata: {
        completedAt: new Date(),
        role
      },
      visibility: role === 'provider' ? 'public' : 'private',
      tags: ['booking', 'completed']
    });
  }

  /**
   * Track review creation
   * @param {string} userId - Reviewer user ID
   * @param {Object} review - Review details
   * @param {Object} target - What was reviewed (service/provider)
   * @returns {Promise<Object>} - Created activity
   */
  async trackReviewCreated(userId, review, target) {
    return this.createActivity({
      userId,
      type: 'review_created',
      action: 'Left a review',
      description: `Left a ${review.rating}-star review`,
      targetEntity: {
        type: 'review',
        id: review._id,
        url: `/reviews/${review._id}`
      },
      relatedEntities: [
        {
          type: target.type || 'service',
          id: target._id,
          name: target.title || target.name,
          role: 'reviewed'
        }
      ],
      metadata: {
        rating: review.rating
      },
      visibility: 'public',
      tags: ['review', `rating-${review.rating}`]
    });
  }

  /**
   * Track job posting
   * @param {string} userId - Employer user ID
   * @param {Object} job - Job details
   * @returns {Promise<Object>} - Created activity
   */
  async trackJobCreated(userId, job) {
    return this.createActivity({
      userId,
      type: 'job_created',
      action: 'Posted a job',
      description: `Posted job: ${job.title}`,
      targetEntity: {
        type: 'job',
        id: job._id,
        name: job.title,
        url: `/jobs/${job._id}`
      },
      metadata: {
        jobType: job.jobType,
        salaryRange: job.salaryRange
      },
      visibility: 'public',
      tags: ['job', 'hiring', job.category].filter(Boolean)
    });
  }

  /**
   * Track job application
   * @param {string} userId - Applicant user ID
   * @param {Object} application - Application details
   * @param {Object} job - Job details
   * @returns {Promise<Object>} - Created activity
   */
  async trackJobApplication(userId, application, job) {
    return this.createActivity({
      userId,
      type: 'job_applied',
      action: 'Applied for a job',
      description: `Applied to: ${job.title}`,
      targetEntity: {
        type: 'application',
        id: application._id,
        url: `/applications/${application._id}`
      },
      relatedEntities: [
        {
          type: 'job',
          id: job._id,
          name: job.title,
          role: 'applied_to'
        }
      ],
      metadata: {
        appliedAt: new Date()
      },
      visibility: 'private'
    });
  }

  /**
   * Track course enrollment
   * @param {string} userId - Student user ID
   * @param {Object} course - Course details
   * @returns {Promise<Object>} - Created activity
   */
  async trackCourseEnrolled(userId, course) {
    return this.createActivity({
      userId,
      type: 'course_enrolled',
      action: 'Enrolled in a course',
      description: `Started learning: ${course.title}`,
      targetEntity: {
        type: 'course',
        id: course._id,
        name: course.title,
        url: `/courses/${course._id}`
      },
      metadata: {
        instructor: course.instructor,
        duration: course.duration
      },
      visibility: 'public',
      tags: ['course', 'learning', course.category].filter(Boolean)
    });
  }

  /**
   * Track course completion
   * @param {string} userId - Student user ID
   * @param {Object} course - Course details
   * @param {Object} certificate - Certificate if earned
   * @returns {Promise<Object>} - Created activity
   */
  async trackCourseCompleted(userId, course, certificate = null) {
    const activity = await this.createActivity({
      userId,
      type: 'course_completed',
      action: 'Completed a course',
      description: `Completed course: ${course.title}`,
      targetEntity: {
        type: 'course',
        id: course._id,
        name: course.title,
        url: `/courses/${course._id}`
      },
      metadata: {
        completedAt: new Date(),
        certificateId: certificate?._id
      },
      visibility: 'public',
      tags: ['course', 'completed', 'achievement']
    });

    // If certificate earned, track that too
    if (certificate) {
      await this.trackCertificateEarned(userId, certificate, course);
    }

    return activity;
  }

  /**
   * Track certificate earned
   * @param {string} userId - User ID
   * @param {Object} certificate - Certificate details
   * @param {Object} course - Related course
   * @returns {Promise<Object>} - Created activity
   */
  async trackCertificateEarned(userId, certificate, course) {
    return this.createActivity({
      userId,
      type: 'certificate_earned',
      action: 'Earned a certificate',
      description: `Earned certificate for: ${course.title}`,
      targetEntity: {
        type: 'course',
        id: course._id,
        name: course.title
      },
      metadata: {
        certificateId: certificate._id,
        earnedAt: new Date()
      },
      visibility: 'public',
      tags: ['certificate', 'achievement', 'milestone']
    });
  }

  /**
   * Track payment
   * @param {string} userId - User ID
   * @param {Object} payment - Payment details
   * @param {string} direction - 'made' or 'received'
   * @returns {Promise<Object>} - Created activity
   */
  async trackPayment(userId, payment, direction = 'made') {
    const type = direction === 'received' ? 'payment_received' : 'payment_made';
    const action = direction === 'received' ? 'Received payment' : 'Made payment';
    
    return this.createActivity({
      userId,
      type,
      action,
      description: `${action} of ${payment.currency || 'PHP'} ${payment.amount}`,
      targetEntity: {
        type: 'payment',
        id: payment._id,
        url: `/payments/${payment._id}`
      },
      metadata: {
        amount: payment.amount,
        currency: payment.currency || 'PHP',
        method: payment.method,
        status: payment.status
      },
      visibility: 'private',
      tags: ['payment', direction]
    });
  }

  /**
   * Track referral sent
   * @param {string} userId - Referrer user ID
   * @param {Object} referral - Referral details
   * @returns {Promise<Object>} - Created activity
   */
  async trackReferralSent(userId, referral) {
    return this.createActivity({
      userId,
      type: 'referral_sent',
      action: 'Sent a referral',
      description: 'Invited someone to join LocalPro',
      targetEntity: {
        type: 'referral',
        id: referral._id
      },
      metadata: {
        referralCode: referral.code,
        sentAt: new Date()
      },
      visibility: 'private',
      tags: ['referral']
    });
  }

  /**
   * Track referral completion
   * @param {string} userId - Referrer user ID
   * @param {Object} referral - Referral details
   * @param {Object} reward - Reward earned
   * @returns {Promise<Object>} - Created activity
   */
  async trackReferralCompleted(userId, referral, reward) {
    return this.createActivity({
      userId,
      type: 'referral_completed',
      action: 'Referral completed',
      description: `Referral reward earned: ${reward.currency || 'PHP'} ${reward.amount}`,
      targetEntity: {
        type: 'referral',
        id: referral._id
      },
      metadata: {
        reward: reward.amount,
        currency: reward.currency || 'PHP'
      },
      visibility: 'public',
      tags: ['referral', 'reward', 'achievement']
    });
  }

  /**
   * Track verification status change
   * @param {string} userId - User ID
   * @param {string} verificationType - Type of verification
   * @param {string} status - 'approved', 'rejected', or 'requested'
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} - Created activity
   */
  async trackVerification(userId, verificationType, status, details = {}) {
    const typeMap = {
      'approved': 'verification_approved',
      'rejected': 'verification_rejected',
      'requested': 'verification_requested'
    };

    const actionMap = {
      'approved': 'Verification approved',
      'rejected': 'Verification rejected',
      'requested': 'Requested verification'
    };

    return this.createActivity({
      userId,
      type: typeMap[status] || 'verification_requested',
      action: actionMap[status] || 'Verification update',
      description: `${verificationType} verification ${status}`,
      targetEntity: {
        type: 'verification',
        id: details.verificationId
      },
      metadata: {
        verificationType,
        status,
        ...details
      },
      visibility: status === 'approved' ? 'public' : 'private',
      tags: ['verification', verificationType, status].filter(Boolean)
    });
  }

  /**
   * Track badge earned
   * @param {string} userId - User ID
   * @param {Object} badge - Badge details
   * @returns {Promise<Object>} - Created activity
   */
  async trackBadgeEarned(userId, badge) {
    return this.createActivity({
      userId,
      type: 'badge_earned',
      action: 'Earned a badge',
      description: `Earned the "${badge.name}" badge`,
      targetEntity: {
        type: 'verification',
        id: badge._id,
        name: badge.name
      },
      metadata: {
        badgeName: badge.name,
        badgeLevel: badge.level
      },
      visibility: 'public',
      tags: ['badge', 'achievement', badge.category].filter(Boolean)
    });
  }

  /**
   * Track agency creation or joining
   * @param {string} userId - User ID
   * @param {Object} agency - Agency details
   * @param {string} action - 'created' or 'joined'
   * @returns {Promise<Object>} - Created activity
   */
  async trackAgencyActivity(userId, agency, action) {
    const type = action === 'created' ? 'agency_created' : 'agency_joined';
    
    return this.createActivity({
      userId,
      type,
      action: action === 'created' ? 'Created an agency' : 'Joined an agency',
      description: `${action === 'created' ? 'Created' : 'Joined'} agency: ${agency.name}`,
      targetEntity: {
        type: 'agency',
        id: agency._id,
        name: agency.name,
        url: `/agencies/${agency._id}`
      },
      metadata: {
        agencyName: agency.name
      },
      visibility: 'public',
      tags: ['agency', action]
    });
  }

  /**
   * Track message sent (for conversation starters)
   * @param {string} userId - Sender user ID
   * @param {Object} conversation - Conversation details
   * @param {boolean} isNew - Is this a new conversation
   * @returns {Promise<Object>} - Created activity
   */
  async trackMessageActivity(userId, conversation, isNew = false) {
    const type = isNew ? 'conversation_started' : 'message_sent';
    
    return this.createActivity({
      userId,
      type,
      action: isNew ? 'Started a conversation' : 'Sent a message',
      description: isNew ? 'Started a new conversation' : 'Sent a message',
      targetEntity: {
        type: 'message',
        id: conversation._id
      },
      metadata: {
        conversationId: conversation._id,
        isNewConversation: isNew
      },
      visibility: 'private'
    });
  }

  /**
   * Get activity feed for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Activity feed with pagination
   */
  async getActivityFeed(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      types = [],
      categories = [],
      includeOwn = true,
      timeframe = '7d'
    } = options;

    try {
      const activities = await Activity.getActivityFeed(userId, {
        page,
        limit,
        types,
        categories,
        includeOwn,
        timeframe,
        visibility: 'public'
      });

      const total = await Activity.countDocuments({
        isDeleted: false,
        isVisible: true,
        $or: [
          { user: userId },
          { visibility: 'public' }
        ]
      });

      return {
        activities,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get activity feed', error, { userId });
      throw error;
    }
  }

  /**
   * Get user's own activities
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - User activities with pagination
   */
  async getUserActivities(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      types = [],
      categories = [],
      timeframe = '30d'
    } = options;

    try {
      const activities = await Activity.getUserActivities(userId, {
        page,
        limit,
        types,
        categories,
        timeframe
      });

      const total = await Activity.countDocuments({
        user: userId,
        isDeleted: false
      });

      return {
        activities,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get user activities', error, { userId });
      throw error;
    }
  }

  /**
   * Get user activity statistics
   * @param {string} userId - User ID
   * @param {string} timeframe - Time range
   * @returns {Promise<Object>} - Activity statistics
   */
  async getActivityStats(userId, timeframe = '30d') {
    try {
      const stats = await Activity.getActivityStats(userId, timeframe);
      return stats[0] || {
        totalActivities: 0,
        totalPoints: 0,
        categoryBreakdown: {},
        typeBreakdown: {}
      };
    } catch (error) {
      logger.error('Failed to get activity stats', error, { userId });
      throw error;
    }
  }

  /**
   * Get activity timeline (grouped by date)
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Activities grouped by date
   */
  async getActivityTimeline(userId, options = {}) {
    const { timeframe = '30d', limit = 100 } = options;

    try {
      const timeframes = {
        '1d': 1 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };

      const cutoff = new Date(Date.now() - timeframes[timeframe]);

      const timeline = await Activity.aggregate([
        {
          $match: {
            user: require('mongoose').Types.ObjectId.createFromHexString(userId),
            isDeleted: false,
            createdAt: { $gte: cutoff }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: limit
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            activities: {
              $push: {
                _id: '$_id',
                type: '$type',
                category: '$category',
                action: '$action',
                description: '$description',
                createdAt: '$createdAt',
                impact: '$impact',
                points: '$points',
                targetEntity: '$targetEntity'
              }
            },
            totalPoints: { $sum: '$points' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      return timeline;
    } catch (error) {
      logger.error('Failed to get activity timeline', error, { userId });
      throw error;
    }
  }

  /**
   * Calculate user's total points
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Total points
   */
  async getTotalPoints(userId) {
    try {
      const result = await Activity.aggregate([
        {
          $match: {
            user: require('mongoose').Types.ObjectId.createFromHexString(userId),
            isDeleted: false
          }
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$points' }
          }
        }
      ]);

      return result[0]?.totalPoints || 0;
    } catch (error) {
      logger.error('Failed to get total points', error, { userId });
      throw error;
    }
  }

  /**
   * Get leaderboard based on points
   * @param {string} timeframe - Time range
   * @param {number} limit - Number of users to return
   * @returns {Promise<Array>} - Leaderboard data
   */
  async getLeaderboard(timeframe = '30d', limit = 10) {
    try {
      const timeframes = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': null
      };

      const matchStage = {
        isDeleted: false,
        visibility: 'public'
      };

      if (timeframes[timeframe]) {
        matchStage.createdAt = { $gte: new Date(Date.now() - timeframes[timeframe]) };
      }

      const leaderboard = await Activity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            totalPoints: { $sum: '$points' },
            activityCount: { $sum: 1 }
          }
        },
        { $sort: { totalPoints: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            totalPoints: 1,
            activityCount: 1,
            'user.firstName': 1,
            'user.lastName': 1,
            'user.avatar': 1
          }
        }
      ]);

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry._id,
        user: entry.user,
        totalPoints: entry.totalPoints,
        activityCount: entry.activityCount
      }));
    } catch (error) {
      logger.error('Failed to get leaderboard', error);
      throw error;
    }
  }
}

module.exports = new ActivityService();

