/**
 * Audit Logger Tests
 * Tests for auditLogger.js utility
 */

// Mock dependencies
jest.mock('../../services/auditService', () => ({
  logAuthEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  logUserEvent: jest.fn().mockResolvedValue({ id: 'audit-2' }),
  logFinancialEvent: jest.fn().mockResolvedValue({ id: 'audit-3' }),
  logSecurityEvent: jest.fn().mockResolvedValue({ id: 'audit-4' }),
  logDataEvent: jest.fn().mockResolvedValue({ id: 'audit-5' }),
  logSystemEvent: jest.fn().mockResolvedValue({ id: 'audit-6' }),
  logAuditEvent: jest.fn().mockResolvedValue({ id: 'audit-7' })
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

const { AuditLogger, auditLogger } = require('../../utils/auditLogger');
const auditService = require('../../services/auditService');
const { logger } = require('../../utils/logger');

describe('AuditLogger', () => {
  let auditLog;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();
    
    auditLog = new AuditLogger('TestContext');
    
    mockReq = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      method: 'GET',
      originalUrl: '/api/test',
      params: {},
      query: {}
    };
  });

  describe('Constructor', () => {
    it('should create audit logger with default context', () => {
      const defaultLogger = new AuditLogger();
      expect(defaultLogger.context).toBe('Controller');
    });

    it('should create audit logger with custom context', () => {
      expect(auditLog.context).toBe('TestContext');
    });
  });

  describe('child', () => {
    it('should create child audit logger', () => {
      const child = auditLog.child('Child');
      expect(child.context).toBe('TestContext:Child');
      expect(child).toBeInstanceOf(AuditLogger);
    });
  });

  describe('logAuth', () => {
    it('should log authentication event', async () => {
      await auditLog.logAuth('login', mockReq, { success: true });

      expect(auditService.logAuthEvent).toHaveBeenCalledWith(
        'login',
        'user-123',
        'test@example.com',
        '127.0.0.1',
        'Mozilla/5.0',
        { success: true }
      );
    });

    it('should handle missing user', async () => {
      const reqWithoutUser = { ...mockReq, user: null };
      await auditLog.logAuth('login', reqWithoutUser);

      expect(auditService.logAuthEvent).toHaveBeenCalledWith(
        'login',
        undefined,
        undefined,
        '127.0.0.1',
        'Mozilla/5.0',
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logAuthEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logAuth('login', mockReq);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logUser', () => {
    it('should log user management event', async () => {
      await auditLog.logUser('update', mockReq, { id: 'target-1' }, { name: 'New Name' });

      expect(auditService.logUserEvent).toHaveBeenCalledWith(
        'update',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'user',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0'
        }),
        { id: 'target-1' },
        { name: 'New Name' },
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logUserEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logUser('update', mockReq, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logFinancial', () => {
    it('should log financial event', async () => {
      await auditLog.logFinancial('payment', mockReq, { id: 'payment-1' }, 100, 'USD');

      expect(auditService.logFinancialEvent).toHaveBeenCalledWith(
        'payment',
        expect.objectContaining({
          userId: 'user-123'
        }),
        { id: 'payment-1' },
        100,
        'USD',
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logFinancialEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logFinancial('payment', mockReq, {}, 100, 'USD');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logSecurity', () => {
    it('should log security event', async () => {
      await auditLog.logSecurity('suspicious_activity', mockReq, { type: 'login' });

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        'suspicious_activity',
        expect.objectContaining({
          userId: 'user-123'
        }),
        { type: 'login' },
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logSecurityEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logSecurity('suspicious_activity', mockReq, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logData', () => {
    it('should log data event', async () => {
      await auditLog.logData('export', mockReq, { type: 'user_data' });

      expect(auditService.logDataEvent).toHaveBeenCalledWith(
        'export',
        expect.objectContaining({
          userId: 'user-123'
        }),
        { type: 'user_data' },
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logDataEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logData('export', mockReq, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logSystem', () => {
    it('should log system event', async () => {
      await auditLog.logSystem('maintenance', mockReq, { type: 'scheduled' });

      expect(auditService.logSystemEvent).toHaveBeenCalledWith(
        'maintenance',
        expect.objectContaining({
          userId: 'user-123'
        }),
        { type: 'scheduled' },
        {}
      );
    });

    it('should handle errors gracefully', async () => {
      auditService.logSystemEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logSystem('maintenance', mockReq, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logCustom', () => {
    it('should log custom audit event', async () => {
      await auditLog.logCustom('custom_action', 'custom_category', mockReq, { id: 'target-1' }, { change: 'value' }, { meta: 'data' });

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'custom_action',
        category: 'custom_category',
        actor: expect.objectContaining({
          userId: 'user-123'
        }),
        target: { id: 'target-1' },
        changes: { change: 'value' },
        metadata: { meta: 'data' },
        request: {
          method: 'GET',
          url: '/api/test',
          params: {},
          query: {}
        }
      });
    });

    it('should handle errors gracefully', async () => {
      auditService.logAuditEvent.mockRejectedValueOnce(new Error('Service error'));
      
      await auditLog.logCustom('action', 'category', mockReq, {});

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logMarketplace', () => {
    it('should log marketplace event', async () => {
      await auditLog.logMarketplace('service_created', mockReq, 'service-1', 'Cleaning Service');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'service_created',
        category: 'marketplace',
        actor: expect.any(Object),
        target: { type: 'service', id: 'service-1', name: 'Cleaning Service' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logJobBoard', () => {
    it('should log job board event', async () => {
      await auditLog.logJobBoard('job_posted', mockReq, 'job-1', 'Software Developer');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'job_posted',
        category: 'job_board',
        actor: expect.any(Object),
        target: { type: 'job', id: 'job-1', name: 'Software Developer' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logAgency', () => {
    it('should log agency event', async () => {
      await auditLog.logAgency('agency_created', mockReq, 'agency-1', 'ABC Agency');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'agency_created',
        category: 'agency',
        actor: expect.any(Object),
        target: { type: 'agency', id: 'agency-1', name: 'ABC Agency' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logReferral', () => {
    it('should log referral event', async () => {
      await auditLog.logReferral('referral_created', mockReq, 'ref-1');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'referral_created',
        category: 'referral',
        actor: expect.any(Object),
        target: { type: 'referral', id: 'ref-1', name: 'Referral' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logContent', () => {
    it('should log content event', async () => {
      await auditLog.logContent('course_created', 'course', mockReq, 'course-1', 'Introduction to JS');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'course_created',
        category: 'content',
        actor: expect.any(Object),
        target: { type: 'course', id: 'course-1', name: 'Introduction to JS' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logCommunication', () => {
    it('should log communication event', async () => {
      await auditLog.logCommunication('message_sent', mockReq, 'msg-1', 'message');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'message_sent',
        category: 'communication',
        actor: expect.any(Object),
        target: { type: 'message', id: 'msg-1', name: 'message Communication' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logTrustVerification', () => {
    it('should log trust verification event', async () => {
      await auditLog.logTrustVerification('verification_submitted', mockReq, 'ver-1');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'verification_submitted',
        category: 'trust_verification',
        actor: expect.any(Object),
        target: { type: 'verification', id: 'ver-1', name: 'Trust Verification' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logPayment', () => {
    it('should log payment event', async () => {
      await auditLog.logPayment('payment_processed', mockReq, 'pay-1', 100, 'USD');

      expect(auditService.logFinancialEvent).toHaveBeenCalledWith(
        'payment_processed',
        expect.any(Object),
        { type: 'payment', id: 'pay-1', name: 'Payment' },
        100,
        'USD',
        {}
      );
    });
  });

  describe('logBooking', () => {
    it('should log booking event', async () => {
      await auditLog.logBooking('booking_created', mockReq, 'book-1', 'House Cleaning');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'booking_created',
        category: 'marketplace',
        actor: expect.any(Object),
        target: { type: 'booking', id: 'book-1', name: 'House Cleaning' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logApplication', () => {
    it('should log application event', async () => {
      await auditLog.logApplication('application_submitted', mockReq, 'app-1', 'Software Developer');

      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        action: 'application_submitted',
        category: 'job_board',
        actor: expect.any(Object),
        target: { type: 'application', id: 'app-1', name: 'Software Developer' },
        changes: {},
        metadata: {},
        request: expect.any(Object)
      });
    });
  });

  describe('logSettings', () => {
    it('should log settings event', async () => {
      await auditLog.logSettings('settings_updated', mockReq, 'profile', { name: 'New Name' });

      expect(auditService.logUserEvent).toHaveBeenCalledWith(
        'settings_updated',
        expect.any(Object),
        { type: 'user', id: 'user-123', name: 'User Settings' },
        { name: 'New Name' },
        { category: 'profile' }
      );
    });
  });

  describe('Default Audit Logger Instance', () => {
    it('should export default audit logger instance', () => {
      expect(auditLogger).toBeInstanceOf(AuditLogger);
      expect(auditLogger.context).toBe('Controller');
    });

    it('should provide convenience methods', () => {
      const { logAuth, logUser } = require('../../utils/auditLogger');
      expect(typeof logAuth).toBe('function');
      expect(typeof logUser).toBe('function');
    });

    it('should call logger methods via convenience functions', async () => {
      const { logAuth } = require('../../utils/auditLogger');
      await logAuth('test', mockReq);

      expect(auditService.logAuthEvent).toHaveBeenCalled();
    });
  });
});

