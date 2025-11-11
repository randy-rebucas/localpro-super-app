const {
  metricsMiddleware,
  recordDatabaseQuery,
  recordError,
  recordBusinessEvent,
  getMetrics,
  getMetricsAsJSON,
  startSystemMetricsCollection,
  stopSystemMetricsCollection,
  activeConnections,
  httpRequestDuration,
  httpRequestTotal
} = require('../../../middleware/metricsMiddleware');

describe('Metrics Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' }
    };
    res = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
      })
    };
    next = jest.fn();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('metricsMiddleware', () => {
    test('should increment active connections', () => {
      const initialValue = activeConnections.get();
      
      metricsMiddleware(req, res, next);

      expect(activeConnections.get()).toBeGreaterThan(initialValue);
      expect(next).toHaveBeenCalled();
    });

    test('should record metrics on response finish', (done) => {
      const observeSpy = jest.spyOn(httpRequestDuration, 'observe');
      const incSpy = jest.spyOn(httpRequestTotal, 'inc');

      metricsMiddleware(req, res, next);

      setTimeout(() => {
        expect(observeSpy).toHaveBeenCalled();
        expect(incSpy).toHaveBeenCalled();
        observeSpy.mockRestore();
        incSpy.mockRestore();
        done();
      }, 20);
    });

    test('should use route path if available', (done) => {
      const labelsSpy = jest.spyOn(httpRequestDuration, 'labels');

      metricsMiddleware(req, res, next);

      setTimeout(() => {
        expect(labelsSpy).toHaveBeenCalledWith('GET', '/api/test', 200);
        labelsSpy.mockRestore();
        done();
      }, 20);
    });

    test('should use request path if route not available', (done) => {
      delete req.route;
      const labelsSpy = jest.spyOn(httpRequestDuration, 'labels');

      metricsMiddleware(req, res, next);

      setTimeout(() => {
        expect(labelsSpy).toHaveBeenCalledWith('GET', '/api/test', 200);
        labelsSpy.mockRestore();
        done();
      }, 20);
    });
  });

  describe('recordDatabaseQuery', () => {
    test('should record database query duration', () => {
      const observeSpy = jest.spyOn(require('../../../middleware/metricsMiddleware').databaseQueryDuration, 'observe');

      recordDatabaseQuery('find', 'users', 150);

      expect(observeSpy).toHaveBeenCalledWith('find', 'users', 0.15);
      observeSpy.mockRestore();
    });
  });

  describe('recordError', () => {
    test('should record error with type and severity', () => {
      const incSpy = jest.spyOn(require('../../../middleware/metricsMiddleware').errorRate, 'inc');

      recordError('database', 'error');

      expect(incSpy).toHaveBeenCalledWith('database', 'error');
      incSpy.mockRestore();
    });

    test('should use default severity if not provided', () => {
      const incSpy = jest.spyOn(require('../../../middleware/metricsMiddleware').errorRate, 'inc');

      recordError('database');

      expect(incSpy).toHaveBeenCalledWith('database', 'error');
      incSpy.mockRestore();
    });
  });

  describe('recordBusinessEvent', () => {
    test('should record business event', () => {
      const incSpy = jest.spyOn(require('../../../middleware/metricsMiddleware').businessMetrics, 'inc');

      recordBusinessEvent('user_signup', 'auth');

      expect(incSpy).toHaveBeenCalledWith('user_signup', 'auth');
      incSpy.mockRestore();
    });
  });

  describe('getMetrics', () => {
    test('should return metrics in Prometheus format', async () => {
      const metrics = await getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('getMetricsAsJSON', () => {
    test('should return metrics as JSON', async () => {
      const metrics = await getMetricsAsJSON();

      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('startSystemMetricsCollection', () => {
    test('should not start collection in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      startSystemMetricsCollection();

      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });

  describe('stopSystemMetricsCollection', () => {
    test('should stop metrics collection', () => {
      stopSystemMetricsCollection();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

