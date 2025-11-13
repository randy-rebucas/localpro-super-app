const { AuditLogger, auditLogger } = require('../../../utils/auditLogger');
const auditService = require('../../../services/auditService');

// Mock audit service
jest.mock('../../../services/auditService');

describe('Audit Logger Utility', () => {
  let mockReq;

  beforeEach(() => {
    mockReq = {
      user: {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'admin'
      },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      method: 'GET',
      originalUrl: '/api/test',
      params: {},
      query: {}
    };

    jest.clearAllMocks();
  });

  describe('AuditLogger class', () => {
    test('should create instance with default context', () => {
      const logger = new AuditLogger();
      expect(logger.context).toBe('Controller');
    });

    test('should create instance with custom context', () => {
      const logger = new AuditLogger('Custom');
      expect(logger.context).toBe('Custom');
    });

    test('should create child logger', () => {
      const logger = new AuditLogger('Parent');
      const child = logger.child('Child');
      
      expect(child.context).toBe('Parent:Child');
    });
  });

  describe('logAuth', () => {
    test('should log auth event', async () => {
      auditService.logAuthEvent = jest.fn().mockResolvedValue({});

      await auditLogger.logAuth('login', mockReq, { device: 'mobile' });

      expect(auditService.logAuthEvent).toHaveBeenCalledWith(
        'login',
        mockReq.user.id,
        mockReq.user.email,
        '127.0.0.1',
        'Mozilla/5.0',
        { device: 'mobile' }
      );
    });
  });

  describe('logUser', () => {
    test('should log user event', async () => {
      auditService.logUserEvent = jest.fn().mockResolvedValue({});
      const target = { id: 'target-id', name: 'Target User' };
      const changes = { status: 'active' };

      await auditLogger.logUser('update', mockReq, target, changes, {});

      expect(auditService.logUserEvent).toHaveBeenCalled();
    });
  });

  describe('logFinancial', () => {
    test('should log financial event', async () => {
      auditService.logFinancialEvent = jest.fn().mockResolvedValue({});
      const target = { id: 'transaction-id' };

      await auditLogger.logFinancial('payment', mockReq, target, 100, 'USD', {});

      expect(auditService.logFinancialEvent).toHaveBeenCalled();
    });
  });

  describe('logSecurity', () => {
    test('should log security event', async () => {
      auditService.logSecurityEvent = jest.fn().mockResolvedValue({});
      const target = { id: 'security-event-id' };

      await auditLogger.logSecurity('access_denied', mockReq, target, {});

      expect(auditService.logSecurityEvent).toHaveBeenCalled();
    });
  });

  describe('logMarketplace', () => {
    test('should log marketplace event', async () => {
      auditService.logAuditEvent = jest.fn().mockResolvedValue({});

      await auditLogger.logMarketplace('create_service', mockReq, 'service-id', 'Service Name', {});

      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });
  });

  describe('logBooking', () => {
    test('should log booking event', async () => {
      auditService.logAuditEvent = jest.fn().mockResolvedValue({});

      await auditLogger.logBooking('create', mockReq, 'booking-id', 'Service Name', {});

      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });
  });

  describe('logPayment', () => {
    test('should log payment event', async () => {
      auditService.logFinancialEvent = jest.fn().mockResolvedValue({});

      await auditLogger.logPayment('process', mockReq, 'payment-id', 100, 'USD', {});

      expect(auditService.logFinancialEvent).toHaveBeenCalled();
    });
  });

  describe('Convenience methods', () => {
    test('should export convenience methods', () => {
      const { logAuth, logUser, logFinancial } = require('../../../utils/auditLogger');
      
      expect(typeof logAuth).toBe('function');
      expect(typeof logUser).toBe('function');
      expect(typeof logFinancial).toBe('function');
    });
  });

  describe('Error handling', () => {
    test('should handle errors gracefully', async () => {
      auditService.logAuthEvent = jest.fn().mockRejectedValue(new Error('Service error'));

      // Should not throw
      await expect(auditLogger.logAuth('login', mockReq)).resolves.not.toThrow();
    });
  });
});

