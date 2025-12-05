/**
 * Activity Tracker Middleware
 * 
 * This middleware automatically tracks user activities based on request patterns.
 * It intercepts successful API calls and creates activity records accordingly.
 */

const activityService = require('../services/activityService');
const { logger } = require('../utils/logger');

/**
 * Map of routes to activity types
 * This defines which routes should trigger activity tracking
 */
const activityRouteMap = {
  // Authentication routes
  'POST /api/auth/login': { type: 'user_login', method: 'trackLogin' },
  'POST /api/auth/logout': { type: 'user_logout', method: 'trackLogout' },
  'POST /api/auth/register': { type: 'user_register', method: 'trackRegistration' },
  
  // Profile routes
  'PUT /api/auth/profile': { type: 'profile_update', method: 'trackProfileUpdate' },
  'PUT /api/auth/avatar': { type: 'avatar_upload', action: 'Uploaded avatar' },
  
  // Marketplace routes
  'POST /api/marketplace/services': { type: 'service_created', method: 'trackServiceCreated' },
  'PUT /api/marketplace/services/:id': { type: 'service_updated', action: 'Updated service' },
  'DELETE /api/marketplace/services/:id': { type: 'service_deleted', action: 'Deleted service' },
  'POST /api/marketplace/bookings': { type: 'booking_created', method: 'trackBookingCreated' },
  'PUT /api/marketplace/bookings/:id/complete': { type: 'booking_completed', method: 'trackBookingCompleted' },
  'PUT /api/marketplace/bookings/:id/cancel': { type: 'booking_cancelled', action: 'Cancelled booking' },
  'POST /api/marketplace/reviews': { type: 'review_created', method: 'trackReviewCreated' },
  
  // Job board routes
  'POST /api/jobs': { type: 'job_created', method: 'trackJobCreated' },
  'PUT /api/jobs/:id': { type: 'job_updated', action: 'Updated job posting' },
  'DELETE /api/jobs/:id': { type: 'job_deleted', action: 'Deleted job posting' },
  'POST /api/jobs/:id/apply': { type: 'job_applied', method: 'trackJobApplication' },
  
  // Academy routes
  'POST /api/academy/courses/:id/enroll': { type: 'course_enrolled', method: 'trackCourseEnrolled' },
  'POST /api/academy/courses/:id/complete': { type: 'course_completed', method: 'trackCourseCompleted' },
  
  // Financial routes
  'POST /api/finance/payments': { type: 'payment_made', method: 'trackPayment' },
  'POST /api/finance/withdrawals': { type: 'withdrawal_requested', action: 'Requested withdrawal' },
  
  // Referral routes
  'POST /api/referrals': { type: 'referral_sent', method: 'trackReferralSent' },
  'POST /api/referrals/:code/complete': { type: 'referral_completed', method: 'trackReferralCompleted' },
  
  // Agency routes
  'POST /api/agencies': { type: 'agency_created', method: 'trackAgencyActivity' },
  'POST /api/agencies/:id/join': { type: 'agency_joined', method: 'trackAgencyActivity' },
  'POST /api/agencies/:id/leave': { type: 'agency_left', action: 'Left agency' },
  
  // Communication routes
  'POST /api/communication/messages': { type: 'message_sent', method: 'trackMessageActivity' },
  'POST /api/communication/conversations': { type: 'conversation_started', method: 'trackMessageActivity' },
  
  // Verification routes
  'POST /api/trust-verification/request': { type: 'verification_requested', method: 'trackVerification' },
  'POST /api/trust-verification/documents': { type: 'document_uploaded', action: 'Uploaded verification document' },
  
  // Settings routes
  'PUT /api/settings': { type: 'settings_updated', action: 'Updated settings' },
  'PUT /api/settings/preferences': { type: 'preferences_changed', action: 'Changed preferences' },
  
  // Favorites routes
  'POST /api/favorites': { type: 'service_favorited', action: 'Added to favorites' },
  
  // Ad routes
  'POST /api/ads': { type: 'ad_created', action: 'Created advertisement' },
  'PUT /api/ads/:id': { type: 'ad_updated', action: 'Updated advertisement' }
};

/**
 * Normalize a route path by replacing IDs with :id placeholder
 * @param {string} path - Original path
 * @returns {string} - Normalized path
 */
const normalizePath = (path) => {
  // Replace MongoDB ObjectIds (24 hex chars) and numeric IDs with :id
  return path
    .replace(/\/[a-f0-9]{24}($|\/)/gi, '/:id$1')
    .replace(/\/\d+($|\/)/g, '/:id$1')
    .replace(/\?.*$/, ''); // Remove query strings
};

/**
 * Extract metadata from request
 * @param {Object} req - Express request object
 * @returns {Object} - Request metadata
 */
const extractMetadata = (req) => {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    device: getDeviceType(req.get('user-agent')),
    sessionId: req.sessionID,
    requestId: req.id
  };
};

/**
 * Determine device type from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} - Device type
 */
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

/**
 * Activity tracking middleware
 * 
 * This middleware runs AFTER the response is sent and tracks
 * successful activities based on the route map.
 */
const activityTracker = (options = {}) => {
  const {
    excludePaths = ['/api/activities', '/api/logs', '/api/audit-logs', '/health'],
    onlySuccessful = true,
    minStatusCode = 200,
    maxStatusCode = 299
  } = options;

  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    const originalJson = res.json;
    let responseBody = null;

    // Override res.json to capture response body
    res.json = function(body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override res.end to track activity after response is sent
    res.end = function(...args) {
      // Call original end
      const result = originalEnd.apply(this, args);

      // Track activity asynchronously (don't block response)
      setImmediate(async () => {
        try {
          // Skip if user not authenticated
          if (!req.user?.id) return;

          // Skip excluded paths
          if (excludePaths.some(path => req.originalUrl.startsWith(path))) return;

          // Check status code if configured
          if (onlySuccessful && (res.statusCode < minStatusCode || res.statusCode > maxStatusCode)) return;

          // Build route key
          const normalizedPath = normalizePath(req.originalUrl.split('?')[0]);
          const routeKey = `${req.method} ${normalizedPath}`;

          // Check if this route should be tracked
          const activityConfig = activityRouteMap[routeKey];
          if (!activityConfig) return;

          const metadata = extractMetadata(req);

          // Use specific tracking method if available
          if (activityConfig.method && activityService[activityConfig.method]) {
            await handleSpecificTracking(activityConfig.method, req, responseBody, metadata);
          } else {
            // Use generic activity creation
            await activityService.createActivity({
              userId: req.user.id,
              type: activityConfig.type,
              action: activityConfig.action || activityConfig.type.replace(/_/g, ' '),
              description: generateDescription(activityConfig.type, req, responseBody),
              metadata,
              visibility: activityConfig.visibility || 'private'
            });
          }

          logger.debug('Activity tracked', {
            userId: req.user.id,
            routeKey,
            type: activityConfig.type
          });
        } catch (error) {
          // Don't fail the request if activity tracking fails
          logger.error('Activity tracking failed', error, {
            path: req.originalUrl,
            method: req.method,
            userId: req.user?.id
          });
        }
      });

      return result;
    };

    next();
  };
};

/**
 * Handle specific tracking methods
 * @param {string} method - Tracking method name
 * @param {Object} req - Express request
 * @param {Object} responseBody - Response body
 * @param {Object} metadata - Request metadata
 */
const handleSpecificTracking = async (method, req, responseBody, metadata) => {
  const userId = req.user.id;
  const data = responseBody?.data;

  switch (method) {
    case 'trackLogin':
      await activityService.trackLogin(userId, metadata);
      break;
    case 'trackLogout':
      await activityService.trackLogout(userId, metadata);
      break;
    case 'trackRegistration':
      await activityService.trackRegistration(userId, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        method: 'email'
      });
      break;
    case 'trackProfileUpdate':
      await activityService.trackProfileUpdate(userId, req.body);
      break;
    case 'trackServiceCreated':
      if (data) await activityService.trackServiceCreated(userId, data);
      break;
    case 'trackBookingCreated':
      if (data?.booking && data?.service) {
        await activityService.trackBookingCreated(userId, data.booking, data.service);
      }
      break;
    case 'trackBookingCompleted':
      if (data) await activityService.trackBookingCompleted(userId, data, req.user.role || 'client');
      break;
    case 'trackReviewCreated':
      if (data) {
        await activityService.trackReviewCreated(userId, data, {
          type: 'service',
          _id: data.service || data.serviceId,
          title: data.serviceName
        });
      }
      break;
    case 'trackJobCreated':
      if (data) await activityService.trackJobCreated(userId, data);
      break;
    case 'trackJobApplication':
      if (data) {
        await activityService.trackJobApplication(userId, data, {
          _id: data.job || data.jobId,
          title: data.jobTitle || 'Job'
        });
      }
      break;
    case 'trackCourseEnrolled':
      if (data) await activityService.trackCourseEnrolled(userId, data);
      break;
    case 'trackCourseCompleted':
      if (data) await activityService.trackCourseCompleted(userId, data.course, data.certificate);
      break;
    case 'trackPayment':
      if (data) await activityService.trackPayment(userId, data, 'made');
      break;
    case 'trackReferralSent':
      if (data) await activityService.trackReferralSent(userId, data);
      break;
    case 'trackReferralCompleted':
      if (data) await activityService.trackReferralCompleted(userId, data.referral, data.reward);
      break;
    case 'trackAgencyActivity':
      if (data) {
        const action = req.method === 'POST' && req.path.includes('/join') ? 'joined' : 'created';
        await activityService.trackAgencyActivity(userId, data, action);
      }
      break;
    case 'trackMessageActivity':
      if (data) {
        const isNew = req.path.includes('/conversations');
        await activityService.trackMessageActivity(userId, data, isNew);
      }
      break;
    case 'trackVerification':
      if (data) {
        await activityService.trackVerification(userId, data.type, 'requested', {
          verificationId: data._id
        });
      }
      break;
    default:
      logger.warn('Unknown tracking method', { method });
  }
};

/**
 * Generate a human-readable description for an activity
 * @param {string} type - Activity type
 * @param {Object} req - Express request
 * @param {Object} responseBody - Response body
 * @returns {string} - Activity description
 */
const generateDescription = (type, req, responseBody) => {
  const data = responseBody?.data;
  
  const descriptions = {
    'user_login': 'Logged into account',
    'user_logout': 'Logged out of account',
    'user_register': `${req.body?.firstName || 'User'} joined LocalPro`,
    'profile_update': 'Updated profile information',
    'avatar_upload': 'Uploaded a new avatar',
    'password_change': 'Changed account password',
    'service_created': `Created new service: ${data?.title || 'Untitled'}`,
    'service_updated': `Updated service: ${data?.title || 'Service'}`,
    'service_deleted': 'Deleted a service',
    'service_published': `Published service: ${data?.title || 'Service'}`,
    'booking_created': `Booked service: ${data?.serviceName || 'Service'}`,
    'booking_completed': 'Completed a booking',
    'booking_cancelled': 'Cancelled a booking',
    'review_created': `Left a ${data?.rating || 5}-star review`,
    'job_created': `Posted job: ${data?.title || 'Job'}`,
    'job_updated': `Updated job: ${data?.title || 'Job'}`,
    'job_applied': `Applied for job: ${data?.jobTitle || 'Job'}`,
    'course_enrolled': `Enrolled in: ${data?.title || 'Course'}`,
    'course_completed': `Completed course: ${data?.title || 'Course'}`,
    'payment_made': `Made payment of ${data?.currency || 'PHP'} ${data?.amount || 0}`,
    'withdrawal_requested': 'Requested a withdrawal',
    'referral_sent': 'Sent a referral invitation',
    'agency_created': `Created agency: ${data?.name || 'Agency'}`,
    'agency_joined': `Joined agency: ${data?.name || 'Agency'}`,
    'message_sent': 'Sent a message',
    'conversation_started': 'Started a new conversation',
    'verification_requested': 'Requested verification',
    'document_uploaded': 'Uploaded verification document',
    'settings_updated': 'Updated account settings',
    'preferences_changed': 'Changed preferences',
    'service_favorited': 'Added service to favorites',
    'ad_created': 'Created an advertisement',
    'ad_updated': 'Updated an advertisement'
  };

  return descriptions[type] || type.replace(/_/g, ' ');
};

/**
 * Manual activity tracking helper
 * Use this in controllers where automatic tracking isn't sufficient
 */
const trackActivity = async (userId, type, options = {}) => {
  try {
    await activityService.createActivity({
      userId,
      type,
      action: options.action || type.replace(/_/g, ' '),
      description: options.description || type.replace(/_/g, ' '),
      targetEntity: options.targetEntity,
      relatedEntities: options.relatedEntities,
      metadata: options.metadata,
      visibility: options.visibility || 'private',
      tags: options.tags || []
    });
  } catch (error) {
    logger.error('Manual activity tracking failed', error, { userId, type });
  }
};

module.exports = {
  activityTracker,
  trackActivity,
  activityRouteMap,
  extractMetadata
};

