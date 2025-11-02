/**
 * Audit Service Tests
 * Tests for auditService.js
 */

// Mock dependencies
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Create a mock AuditLog constructor that can be called with 'new'
const MockAuditLog = jest.fn().mockImplementation((data) => ({
  ...data,
  save: jest.fn().mockResolvedValue({ _id: 'mock-id', auditId: data?.auditId || 'mock-audit-id' }),
  toObject: jest.fn().mockReturnValue({ _id: 'mock-id' })
}));

MockAuditLog.findOne = jest.fn();
MockAuditLog.find = jest.fn();
MockAuditLog.findById = jest.fn();
MockAuditLog.aggregate = jest.fn();

jest.mock('mongoose', () => {
  const mockSchema = {
    index: jest.fn().mockReturnThis(),
    pre: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis()
  };
  
  const Schema = jest.fn(() => mockSchema);
  Schema.Types = {
    ObjectId: String,
    Mixed: Object
  };
  
  return {
    Schema,
    model: jest.fn((name, _schema) => {
      if (name === 'AuditLog') {
        return MockAuditLog;
      }
      return jest.fn();
    }),
    Types: {
      ObjectId: String,
      Mixed: Object
    }
  };
});

const AuditService = require('../../services/auditService');

describe('AuditService', () => {
  // Service is exported as singleton instance
  const auditService = AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    MockAuditLog.mockClear();
    MockAuditLog.mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'mock-id', auditId: data?.auditId || 'mock-audit-id' }),
      toObject: jest.fn().mockReturnValue({ _id: 'mock-id' })
    }));
  });

  describe('Constructor', () => {
    it('should create service with retention policies', () => {
      expect(auditService.retentionPolicies).toBeDefined();
      expect(auditService.retentionPolicies.authentication).toBeGreaterThan(0);
      expect(auditService.retentionPolicies.financial).toBeGreaterThan(0);
      expect(auditService.retentionPolicies.security).toBeGreaterThan(0);
    });
  });

  describe('generateAuditId', () => {
    it('should generate unique audit IDs', () => {
      const id1 = auditService.generateAuditId();
      const id2 = auditService.generateAuditId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });

  describe('determineSeverity', () => {
    it('should return critical for critical actions', () => {
      expect(auditService.determineSeverity('user_delete', 'user_management')).toBe('critical');
      expect(auditService.determineSeverity('system_config_update', 'system')).toBe('critical');
      expect(auditService.determineSeverity('data_delete', 'data')).toBe('critical');
      expect(auditService.determineSeverity('privilege_escalation', 'security')).toBe('critical');
    });

    it('should return high for high severity actions', () => {
      expect(auditService.determineSeverity('user_create', 'user_management')).toBe('high');
      expect(auditService.determineSeverity('payment_process', 'financial')).toBe('high');
      expect(auditService.determineSeverity('loan_approve', 'financial')).toBe('high');
      expect(auditService.determineSeverity('verification_approve', 'trust_verification')).toBe('high');
      expect(auditService.determineSeverity('role_assigned', 'security')).toBe('high');
    });

    it('should return medium for medium severity actions', () => {
      expect(auditService.determineSeverity('user_update', 'user_management')).toBe('medium');
      expect(auditService.determineSeverity('service_create', 'marketplace')).toBe('medium');
      expect(auditService.determineSeverity('booking_create', 'marketplace')).toBe('medium');
      expect(auditService.determineSeverity('application_create', 'job_board')).toBe('medium');
    });

    it('should return low for low severity actions', () => {
      expect(auditService.determineSeverity('user_login', 'authentication')).toBe('low');
      expect(auditService.determineSeverity('data_read', 'data')).toBe('low');
    });
  });

  describe('sanitizeData', () => {
    it('should sanitize sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        creditCard: '1234-5678-9012-3456',
        email: 'john@example.com'
      };

      const sanitized = auditService.sanitizeData(data);

      // sanitizeData creates a new object and returns it
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.username).toBe('john');
      expect(sanitized.email).toBe('john@example.com');
      // Original data should be unchanged
      expect(data.password).toBe('secret123');
    });

    it('should sanitize nested sensitive fields', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret',
          payment: {
            cardNumber: '1234567890',
            cvv: '123'
          }
        }
      };

      const sanitized = auditService.sanitizeData(data);

      // The sanitization creates a new object
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.payment.cardNumber).toBe('[REDACTED]');
      expect(sanitized.user.payment.cvv).toBe('[REDACTED]');
      expect(sanitized.user.name).toBe('John');
      // Original data should be unchanged
      expect(data.user.password).toBe('secret');
    });

    it('should handle non-object data', () => {
      expect(auditService.sanitizeData(null)).toBe(null);
      expect(auditService.sanitizeData(undefined)).toBe(undefined);
      expect(auditService.sanitizeData('string')).toBe('string');
      expect(auditService.sanitizeData(123)).toBe(123);
    });

    it('should handle empty objects', () => {
      const result = auditService.sanitizeData({});
      expect(result).toEqual({});
    });
  });

  describe('logAuditEvent', () => {
    it('should log audit event successfully', async () => {
      const auditData = {
        action: 'user_login',
        category: 'authentication',
        actor: {
          userId: 'user-123',
          email: 'test@example.com'
        },
        target: {
          type: 'user',
          id: 'user-123'
        },
        metadata: {}
      };

      const result = await auditService.logAuditEvent(auditData);

      expect(MockAuditLog).toHaveBeenCalled();
      // Check that save was called on the instance
      const lastCallIndex = MockAuditLog.mock.results.length - 1;
      if (lastCallIndex >= 0 && MockAuditLog.mock.results[lastCallIndex]) {
        const auditLogInstance = MockAuditLog.mock.results[lastCallIndex].value;
        if (auditLogInstance && auditLogInstance.save) {
          expect(auditLogInstance.save).toHaveBeenCalled();
        }
      }
      expect(result).toBeDefined();
    });

    it('should include auditId and severity', async () => {
      const auditData = {
        action: 'user_delete',
        category: 'user_management',
        actor: { userId: 'user-123' },
        target: { type: 'user', id: 'user-456' }
      };

      await auditService.logAuditEvent(auditData);

      expect(MockAuditLog).toHaveBeenCalled();
      const callArgs = MockAuditLog.mock.calls[MockAuditLog.mock.calls.length - 1][0];
      expect(callArgs.auditId).toBeDefined();
      expect(callArgs.severity).toBe('critical');
    });

    it('should sanitize sensitive data in metadata', async () => {
      const auditData = {
        action: 'user_update',
        category: 'user_management',
        actor: { userId: 'user-123' },
        target: { type: 'user', id: 'user-123' },
        metadata: {
          password: 'secret123',
          token: 'abc123'
        }
      };

      await auditService.logAuditEvent(auditData);

      expect(MockAuditLog).toHaveBeenCalled();
      const callArgs = MockAuditLog.mock.calls[MockAuditLog.mock.calls.length - 1][0];
      expect(callArgs.metadata.password).toBe('[REDACTED]');
      expect(callArgs.metadata.token).toBe('[REDACTED]');
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication event', async () => {
      const result = await auditService.logAuthEvent(
        'user_login',
        'user-123',
        'test@example.com',
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
      // Check that save was called on the last instance
      const lastInstance = MockAuditLog.mock.results[MockAuditLog.mock.results.length - 1]?.value;
      if (lastInstance) {
        expect(lastInstance.save).toHaveBeenCalled();
      }
    });
  });

  describe('logUserEvent', () => {
    it('should log user management event', async () => {
      const result = await auditService.logUserEvent(
        'user_create',
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        { type: 'user', id: 'user-456' },
        { name: 'John' },
        {}
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
    });
  });

  describe('logFinancialEvent', () => {
    it('should log financial event', async () => {
      const result = await auditService.logFinancialEvent(
        'payment_process',
        { userId: 'user-123' },
        { type: 'payment', id: 'pay-123' },
        100,
        'USD',
        {}
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event', async () => {
      const result = await auditService.logSecurityEvent(
        'access_denied',
        { userId: 'user-123' },
        { type: 'resource', id: 'res-123' },
        { reason: 'Unauthorized' }
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
    });
  });

  describe('logDataEvent', () => {
    it('should log data event', async () => {
      const result = await auditService.logDataEvent(
        'data_export',
        { userId: 'user-123' },
        { type: 'data', id: 'data-123' },
        {}
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
    });
  });

  describe('logSystemEvent', () => {
    it('should log system event', async () => {
      const result = await auditService.logSystemEvent(
        'system_config_update',
        { userId: 'admin-123' },
        { type: 'config', id: 'config-123' },
        {}
      );

      expect(result).toBeDefined();
      expect(MockAuditLog).toHaveBeenCalled();
    });
  });
});

