const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const mockSchemaInstance = {
    index: jest.fn().mockReturnThis()
  };
  const mockSchema = jest.fn().mockImplementation(() => mockSchemaInstance);
  mockSchema.Types = {
    ObjectId: String,
    Mixed: Object,
    String: String
  };
  
  return {
    Schema: mockSchema,
    model: jest.fn(),
    connection: {
      model: jest.fn()
    }
  };
});

jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const auditService = require('../../../services/auditService');

describe('AuditService', () => {
  let mockAuditLog;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditLog = {
      save: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    };
    mongoose.connection.model = jest.fn().mockReturnValue(mockAuditLog);
  });

  describe('logAuditEvent', () => {
    test('should log audit event', async () => {
      const result = await auditService.logAuditEvent({
        action: 'user_login',
        userId: 'user123',
        metadata: {}
      });

      expect(result).toBeDefined();
    });
  });

  describe('logAuthEvent', () => {
    test('should log authentication event', async () => {
      const result = await auditService.logAuthEvent({
        action: 'user_login',
        userId: 'user123',
        ipAddress: '127.0.0.1'
      });

      expect(result).toBeDefined();
    });
  });

  describe('logUserEvent', () => {
    test('should log user event', async () => {
      const result = await auditService.logUserEvent({
        action: 'user_update',
        userId: 'user123',
        targetUserId: 'user456'
      });

      expect(result).toBeDefined();
    });
  });
});

