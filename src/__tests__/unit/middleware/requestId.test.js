const requestIdMiddleware = require('../../../middleware/requestId');
const { v4: uuidv4 } = require('uuid');

jest.mock('uuid');

describe('Request ID Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      id: null
    };
    res = {
      setHeader: jest.fn(),
      locals: {}
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should generate new request ID if not in headers', () => {
    const mockUuid = 'test-uuid-123';
    uuidv4.mockReturnValue(mockUuid);
    req.headers = {};

    requestIdMiddleware(req, res, next);

    expect(uuidv4).toHaveBeenCalled();
    expect(req.id).toBe(mockUuid);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', mockUuid);
    expect(res.locals.requestId).toBe(mockUuid);
    expect(next).toHaveBeenCalled();
  });

  test('should use existing request ID from headers', () => {
    const existingId = 'existing-request-id';
    req.headers['x-request-id'] = existingId;

    requestIdMiddleware(req, res, next);

    expect(uuidv4).not.toHaveBeenCalled();
    expect(req.id).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(res.locals.requestId).toBe(existingId);
    expect(next).toHaveBeenCalled();
  });

  test('should set request ID in response header', () => {
    const mockUuid = 'header-uuid-456';
    uuidv4.mockReturnValue(mockUuid);

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', mockUuid);
  });

  test('should add request ID to response locals', () => {
    const mockUuid = 'locals-uuid-789';
    uuidv4.mockReturnValue(mockUuid);

    requestIdMiddleware(req, res, next);

    expect(res.locals.requestId).toBe(mockUuid);
  });

  test('should call next middleware', () => {
    requestIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

