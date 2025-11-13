const { auditLogger } = require('../../../middleware/auditLogger');
const auditService = require('../../../services/auditService');
const { logger } = require('../../../utils/logger');

jest.mock('../../../services/auditService');
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('Audit Logger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/users',
      originalUrl: '/api/users',
      body: { name: 'Test User' },
      params: { id: 'user-id' },
      query: {},
      headers: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn(),
      user: { id: 'user-id', email: 'test@example.com', role: 'admin' },
      sessionID: 'session123'
    };
    let finishCallback = null;
    res = {
      statusCode: 200,
      send: jest.fn(function(_data) {
        return this;
      }),
      json: jest.fn(function(_data) {
        return this;
      }),
      end: jest.fn(function(_data) {
        return this;
      }),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      }),
      triggerFinish: () => {
        if (finishCallback) finishCallback();
      }
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('auditLogger middleware', () => {
    test('should skip audit for excluded paths', async () => {
      const middleware = auditLogger({
        excludePaths: ['/health']
      });
      req.path = '/health';

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(auditService.logAuditEvent).not.toHaveBeenCalled();
    });

    test('should audit request after response finishes', (done) => {
      const middleware = auditLogger();
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ success: true });
      res.triggerFinish();

      setTimeout(() => {
        expect(auditService.logAuditEvent).toHaveBeenCalled();
        expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
          action: expect.any(String),
          actor: expect.objectContaining({
            userId: 'user-id',
            email: 'test@example.com',
            ip: '127.0.0.1'
          }),
          request: expect.objectContaining({
            method: 'POST',
            url: '/api/users'
          }),
          response: expect.objectContaining({
            statusCode: 200,
            success: true
          })
        }));
        done();
      }, 50);
    });

    test('should include request body if configured', (done) => {
      const middleware = auditLogger({
        includeRequestBody: true
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ success: true });
      res.triggerFinish();

      setTimeout(() => {
        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.objectContaining({
              body: { name: 'Test User' }
            })
          })
        );
        done();
      }, 50);
    });

    test('should include response body if configured', (done) => {
      const middleware = auditLogger({
        includeResponseBody: true
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ data: 'response data' });
      res.triggerFinish();

      setTimeout(() => {
        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            response: expect.objectContaining({
              body: { data: 'response data' }
            })
          })
        );
        done();
      }, 50);
    });

    test('should use custom action mapper if provided', (done) => {
      const customActionMapper = jest.fn().mockReturnValue({
        action: 'custom_action',
        category: 'custom',
        target: { type: 'user', id: 'user-id' }
      });
      const middleware = auditLogger({
        customActionMapper
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ success: true });
      res.triggerFinish();

      setTimeout(() => {
        expect(customActionMapper).toHaveBeenCalledWith(req, res);
        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'custom_action',
            category: 'custom'
          })
        );
        done();
      }, 50);
    });

    test('should filter by actions if specified', (done) => {
      // Use a path that maps to an action
      req.path = '/api/marketplace/services';
      req.method = 'POST';
      const middleware = auditLogger({
        actions: ['service_create', 'user_update']
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ success: true, data: { id: 'service-id' } });
      res.triggerFinish();

      setTimeout(() => {
        // Should only audit if action matches
        expect(auditService.logAuditEvent).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should exclude specified actions', (done) => {
      const middleware = auditLogger({
        excludeActions: ['user_view']
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.json({ success: true });
      res.triggerFinish();

      setTimeout(() => {
        // Should audit unless action is excluded
        expect(auditService.logAuditEvent).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should handle errors gracefully', (done) => {
      const middleware = auditLogger();
      auditService.logAuditEvent = jest.fn().mockRejectedValue(new Error('Audit error'));

      middleware(req, res, next);
      res.json({ success: true });
      
      // Trigger finish after a short delay to allow middleware to set up
      setTimeout(() => {
        res.triggerFinish();
        
        // Wait for async error handling
        setTimeout(() => {
          // The logger.error is called directly, not logger.logger.error
          expect(logger.error).toHaveBeenCalledWith(
            'Audit middleware error',
            expect.any(Error),
            expect.objectContaining({
              method: 'POST',
              url: '/api/users'
            })
          );
          done();
        }, 100);
      }, 50);
    });

    test('should capture response via res.send', (done) => {
      const middleware = auditLogger({
        includeResponseBody: true
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.send('response text');
      res.triggerFinish();

      setTimeout(() => {
        expect(auditService.logAuditEvent).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should capture response via res.end', (done) => {
      const middleware = auditLogger({
        includeResponseBody: true
      });
      auditService.logAuditEvent = jest.fn().mockResolvedValue();

      middleware(req, res, next);
      res.end('response text');
      res.triggerFinish();

      setTimeout(() => {
        expect(auditService.logAuditEvent).toHaveBeenCalled();
        done();
      }, 50);
    });
  });
});

