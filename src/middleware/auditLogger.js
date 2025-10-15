const auditService = require('../services/auditService');
const { logger } = require('../utils/logger');

// Audit middleware for automatic action tracking
const auditLogger = (options = {}) => {
  const {
    actions = [],
    categories = [],
    excludeActions = [],
    excludePaths = [],
    includeRequestBody = false,
    includeResponseBody = false,
    customActionMapper = null
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Skip audit logging for excluded paths
    if (excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody = null;
    let responseSent = false;

    // Override response methods to capture response data
    res.send = function(data) {
      if (!responseSent && includeResponseBody) {
        responseBody = data;
      }
      responseSent = true;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      if (!responseSent && includeResponseBody) {
        responseBody = data;
      }
      responseSent = true;
      return originalJson.call(this, data);
    };

    res.end = function(data) {
      if (!responseSent && includeResponseBody) {
        responseBody = data;
      }
      responseSent = true;
      return originalEnd.call(this, data);
    };

    // Process after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        
        // Determine if this request should be audited
        const shouldAudit = shouldAuditRequest(req, actions, categories, excludeActions);
        
        if (!shouldAudit) {
          return;
        }

        // Map request to audit action
        const auditAction = customActionMapper 
          ? customActionMapper(req, res)
          : mapRequestToAction(req, res);

        if (!auditAction) {
          return;
        }

        // Prepare audit data
        const auditData = {
          action: auditAction.action,
          category: auditAction.category,
          actor: {
            userId: req.user?.id,
            email: req.user?.email,
            role: req.user?.role,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID
          },
          target: auditAction.target,
          changes: auditAction.changes,
          metadata: {
            ...auditAction.metadata,
            duration: `${duration}ms`,
            responseTime: duration
          },
          request: {
            method: req.method,
            url: req.originalUrl,
            headers: includeRequestBody ? req.headers : undefined,
            body: includeRequestBody ? req.body : undefined,
            params: req.params,
            query: req.query
          },
          response: {
            statusCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 400,
            body: includeResponseBody ? responseBody : undefined
          }
        };

        // Log audit event
        await auditService.logAuditEvent(auditData);

      } catch (error) {
        logger.error('Audit middleware error', error, {
          method: req.method,
          url: req.originalUrl,
          userId: req.user?.id
        });
      }
    });

    next();
  };
};

// Determine if request should be audited
function shouldAuditRequest(req, actions, categories, excludeActions) {
  // Check if action is explicitly excluded
  if (excludeActions.length > 0) {
    const action = mapRequestToAction(req);
    if (action && excludeActions.includes(action.action)) {
      return false;
    }
  }

  // If specific actions are defined, only audit those
  if (actions.length > 0) {
    const action = mapRequestToAction(req);
    return action && actions.includes(action.action);
  }

  // If specific categories are defined, only audit those
  if (categories.length > 0) {
    const action = mapRequestToAction(req);
    return action && categories.includes(action.category);
  }

  // Default: audit all requests (can be configured)
  return true;
}

// Map HTTP request to audit action
function mapRequestToAction(req, res) {
  const method = req.method;
  const path = req.path;
  const statusCode = res?.statusCode;

  // Authentication actions
  if (path.includes('/auth/')) {
    if (path.includes('/send-code')) {
      return {
        action: 'user_verify',
        category: 'authentication',
        target: { type: 'user', id: null, name: 'Phone Verification' },
        metadata: { phoneNumber: req.body?.phoneNumber }
      };
    }
    if (path.includes('/verify-code')) {
      return {
        action: 'user_login',
        category: 'authentication',
        target: { type: 'user', id: req.user?.id, name: 'User Login' },
        metadata: { phoneNumber: req.body?.phoneNumber }
      };
    }
    if (path.includes('/logout')) {
      return {
        action: 'user_logout',
        category: 'authentication',
        target: { type: 'user', id: req.user?.id, name: 'User Logout' }
      };
    }
    if (path.includes('/profile') && method === 'PUT') {
      return {
        action: 'profile_update',
        category: 'user_management',
        target: { type: 'user', id: req.user?.id, name: 'User Profile' },
        changes: { fields: Object.keys(req.body || {}) }
      };
    }
  }

  // Marketplace actions
  if (path.includes('/marketplace/')) {
    if (path.includes('/services')) {
      if (method === 'POST') {
        return {
          action: 'service_create',
          category: 'marketplace',
          target: { type: 'service', id: res?.body?.data?.id, name: req.body?.title }
        };
      }
      if (method === 'PUT') {
        return {
          action: 'service_update',
          category: 'marketplace',
          target: { type: 'service', id: req.params.id, name: req.body?.title }
        };
      }
      if (method === 'DELETE') {
        return {
          action: 'service_delete',
          category: 'marketplace',
          target: { type: 'service', id: req.params.id }
        };
      }
    }
    if (path.includes('/bookings')) {
      if (method === 'POST') {
        return {
          action: 'booking_create',
          category: 'marketplace',
          target: { type: 'booking', id: res?.body?.data?.id, name: 'Service Booking' }
        };
      }
      if (method === 'PUT' && path.includes('/status')) {
        return {
          action: 'booking_update',
          category: 'marketplace',
          target: { type: 'booking', id: req.params.id },
          metadata: { status: req.body?.status }
        };
      }
    }
  }

  // Job board actions
  if (path.includes('/jobs/')) {
    if (method === 'POST' && !path.includes('/apply')) {
      return {
        action: 'job_create',
        category: 'job_board',
        target: { type: 'job', id: res?.body?.data?.id, name: req.body?.title }
      };
    }
    if (method === 'PUT') {
      return {
        action: 'job_update',
        category: 'job_board',
        target: { type: 'job', id: req.params.id, name: req.body?.title }
      };
    }
    if (method === 'DELETE') {
      return {
        action: 'job_delete',
        category: 'job_board',
        target: { type: 'job', id: req.params.id }
      };
    }
    if (path.includes('/apply')) {
      return {
        action: 'application_create',
        category: 'job_board',
        target: { type: 'application', id: res?.body?.data?.id, name: 'Job Application' }
      };
    }
  }

  // Financial actions
  if (path.includes('/finance/')) {
    if (path.includes('/withdraw')) {
      return {
        action: 'withdrawal_request',
        category: 'financial',
        target: { type: 'withdrawal', id: res?.body?.data?.id, name: 'Withdrawal Request' }
      };
    }
    if (path.includes('/loans/') && method === 'POST') {
      return {
        action: 'loan_apply',
        category: 'financial',
        target: { type: 'loan', id: res?.body?.data?.id, name: 'Loan Application' }
      };
    }
  }

  // Payment actions
  if (path.includes('/paypal/') || path.includes('/paymaya/')) {
    if (path.includes('/approve')) {
      return {
        action: 'payment_process',
        category: 'financial',
        target: { type: 'payment', id: req.body?.orderId, name: 'Payment Processing' }
      };
    }
  }

  // Agency actions
  if (path.includes('/agencies/')) {
    if (method === 'POST') {
      return {
        action: 'agency_create',
        category: 'agency',
        target: { type: 'agency', id: res?.body?.data?.id, name: req.body?.name }
      };
    }
    if (method === 'PUT') {
      return {
        action: 'agency_update',
        category: 'agency',
        target: { type: 'agency', id: req.params.id, name: req.body?.name }
      };
    }
    if (method === 'DELETE') {
      return {
        action: 'agency_delete',
        category: 'agency',
        target: { type: 'agency', id: req.params.id }
      };
    }
  }

  // Referral actions
  if (path.includes('/referrals/')) {
    if (path.includes('/invite')) {
      return {
        action: 'referral_invite',
        category: 'referral',
        target: { type: 'referral', id: res?.body?.data?.id, name: 'Referral Invitation' }
      };
    }
    if (path.includes('/validate')) {
      return {
        action: 'referral_validate',
        category: 'referral',
        target: { type: 'referral', id: null, name: 'Referral Validation' }
      };
    }
  }

  // Settings actions
  if (path.includes('/settings/')) {
    if (method === 'PUT') {
      return {
        action: 'settings_update',
        category: 'user_management',
        target: { type: 'user', id: req.user?.id, name: 'User Settings' },
        changes: { fields: Object.keys(req.body || {}) }
      };
    }
  }

  // Trust verification actions
  if (path.includes('/trust-verification/')) {
    if (method === 'POST') {
      return {
        action: 'verification_request',
        category: 'trust_verification',
        target: { type: 'verification', id: res?.body?.data?.id, name: 'Trust Verification' }
      };
    }
    if (path.includes('/review')) {
      return {
        action: 'verification_approve',
        category: 'trust_verification',
        target: { type: 'verification', id: req.params.id },
        metadata: { status: req.body?.status }
      };
    }
  }

  // Communication actions
  if (path.includes('/communication/')) {
    if (path.includes('/messages') && method === 'POST') {
      return {
        action: 'message_send',
        category: 'communication',
        target: { type: 'message', id: res?.body?.data?.id, name: 'Message' }
      };
    }
  }

  // System/Admin actions
  if (path.includes('/admin/') || req.user?.role === 'admin') {
    if (method === 'PUT' || method === 'POST' || method === 'DELETE') {
      return {
        action: 'admin_action',
        category: 'system',
        target: { type: 'system', id: null, name: 'Admin Action' },
        metadata: { path, method }
      };
    }
  }

  // Default: no specific action mapping
  return null;
}

// Specific audit middleware for sensitive operations
const auditSensitiveOperations = auditLogger({
  actions: [
    'user_create', 'user_delete', 'user_update',
    'payment_process', 'payment_refund',
    'loan_approve', 'loan_reject',
    'verification_approve', 'verification_reject',
    'role_assigned', 'role_removed',
    'data_export', 'data_delete'
  ],
  includeRequestBody: true,
  includeResponseBody: true
});

// Audit middleware for financial operations
const auditFinancialOperations = auditLogger({
  categories: ['financial'],
  includeRequestBody: true,
  includeResponseBody: true
});

// Audit middleware for user management
const auditUserManagement = auditLogger({
  categories: ['user_management', 'authentication'],
  includeRequestBody: true
});

// Audit middleware for system operations
const auditSystemOperations = auditLogger({
  categories: ['system', 'security'],
  includeRequestBody: true,
  includeResponseBody: true
});

// Lightweight audit middleware for general operations
const auditGeneralOperations = auditLogger({
  excludeActions: ['data_read', 'user_login', 'user_logout'],
  excludePaths: ['/health', '/api/health', '/favicon.ico']
});

module.exports = {
  auditLogger,
  auditSensitiveOperations,
  auditFinancialOperations,
  auditUserManagement,
  auditSystemOperations,
  auditGeneralOperations
};
