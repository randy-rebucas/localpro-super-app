/**
 * Request ID Middleware Tests
 */

const requestIdMiddleware = require('../../middleware/requestId');

describe('Request ID Middleware', () => {
  it('should be a function', () => {
    expect(typeof requestIdMiddleware).toBe('function');
  });

  it('should add request ID to request object', () => {
    const req = {
      headers: {},
      id: undefined
    };
    const res = {
      setHeader: jest.fn(),
      locals: {}
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.id).toBeDefined();
    expect(typeof req.id).toBe('string');
    expect(req.id.length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalled();
  });

  it('should use existing x-request-id header if provided', () => {
    const existingId = 'existing-request-id-123';
    const req = {
      headers: {
        'x-request-id': existingId
      },
      id: undefined
    };
    const res = {
      setHeader: jest.fn(),
      locals: {}
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.id).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(next).toHaveBeenCalled();
  });

  it('should generate new UUID if no header provided', () => {
    const req = {
      headers: {},
      id: undefined
    };
    const res = {
      setHeader: jest.fn(),
      locals: {}
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.id).toBeDefined();
    expect(req.id).not.toBe('existing-request-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id);
    expect(res.locals.requestId).toBe(req.id);
  });

  it('should set response header', () => {
    const req = {
      headers: {},
      id: undefined
    };
    const res = {
      setHeader: jest.fn(),
      locals: {}
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
  });

  it('should add request ID to response locals', () => {
    const req = {
      headers: {},
      id: undefined
    };
    const res = {
      setHeader: jest.fn(),
      locals: {}
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(res.locals.requestId).toBe(req.id);
  });
});

