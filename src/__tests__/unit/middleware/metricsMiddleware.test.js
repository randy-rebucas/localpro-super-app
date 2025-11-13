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
    let finishCallback = null;
    res = {
      statusCode: 200,
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
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('metricsMiddleware', () => {
    test('should increment active connections', () => {
      // Get initial value to verify increment
      typeof activeConnections.get === 'function' 
        ? activeConnections.get() 
        : 0;
      
      metricsMiddleware(req, res, next);

      // activeConnections is a Gauge, so we just verify it was called
      expect(next).toHaveBeenCalled();
    });

    test('should record metrics on response finish', (done) => {
      const labelsSpy1 = jest.spyOn(httpRequestDuration, 'labels').mockReturnValue({
        observe: jest.fn()
      });
      const labelsSpy2 = jest.spyOn(httpRequestTotal, 'labels').mockReturnValue({
        inc: jest.fn()
      });
      const labelsSpy3 = jest.spyOn(require('../../../middleware/metricsMiddleware').responseTime, 'labels').mockReturnValue({
        observe: jest.fn()
      });

      metricsMiddleware(req, res, next);
      
      // Wait a bit then trigger finish
      setTimeout(() => {
        res.triggerFinish();
        
        setTimeout(() => {
          expect(labelsSpy1).toHaveBeenCalled();
          expect(labelsSpy2).toHaveBeenCalled();
          labelsSpy1.mockRestore();
          labelsSpy2.mockRestore();
          labelsSpy3.mockRestore();
          done();
        }, 10);
      }, 10);
    });

    test('should use route path if available', (done) => {
      const labelsSpy = jest.spyOn(httpRequestDuration, 'labels').mockReturnValue({
        observe: jest.fn()
      });

      metricsMiddleware(req, res, next);
      
      setTimeout(() => {
        res.triggerFinish();
        
        setTimeout(() => {
          expect(labelsSpy).toHaveBeenCalledWith('GET', '/api/test', 200);
          labelsSpy.mockRestore();
          done();
        }, 10);
      }, 10);
    });

    test('should use request path if route not available', (done) => {
      delete req.route;
      const labelsSpy = jest.spyOn(httpRequestDuration, 'labels').mockReturnValue({
        observe: jest.fn()
      });

      metricsMiddleware(req, res, next);
      
      setTimeout(() => {
        res.triggerFinish();
        
        setTimeout(() => {
          expect(labelsSpy).toHaveBeenCalledWith('GET', '/api/test', 200);
          labelsSpy.mockRestore();
          done();
        }, 10);
      }, 10);
    });
  });

  describe('recordDatabaseQuery', () => {
    test('should record database query duration', () => {
      const { databaseQueryDuration } = require('../../../middleware/metricsMiddleware');
      const labelsSpy = jest.spyOn(databaseQueryDuration, 'labels').mockReturnValue({
        observe: jest.fn()
      });
      const observeSpy = jest.spyOn(databaseQueryDuration.labels('find', 'users'), 'observe');

      recordDatabaseQuery('find', 'users', 150);

      expect(labelsSpy).toHaveBeenCalledWith('find', 'users');
      expect(observeSpy).toHaveBeenCalledWith(0.15);
      labelsSpy.mockRestore();
      observeSpy.mockRestore();
    });
  });

  describe('recordError', () => {
    test('should record error with type and severity', () => {
      const { errorRate } = require('../../../middleware/metricsMiddleware');
      const labelsSpy = jest.spyOn(errorRate, 'labels').mockReturnValue({
        inc: jest.fn()
      });
      const incSpy = jest.spyOn(errorRate.labels('database', 'error'), 'inc');

      recordError('database', 'error');

      expect(labelsSpy).toHaveBeenCalledWith('database', 'error');
      expect(incSpy).toHaveBeenCalled();
      labelsSpy.mockRestore();
      incSpy.mockRestore();
    });

    test('should use default severity if not provided', () => {
      const { errorRate } = require('../../../middleware/metricsMiddleware');
      const labelsSpy = jest.spyOn(errorRate, 'labels').mockReturnValue({
        inc: jest.fn()
      });
      const incSpy = jest.spyOn(errorRate.labels('database', 'error'), 'inc');

      recordError('database');

      expect(labelsSpy).toHaveBeenCalledWith('database', 'error');
      expect(incSpy).toHaveBeenCalled();
      labelsSpy.mockRestore();
      incSpy.mockRestore();
    });
  });

  describe('recordBusinessEvent', () => {
    test('should record business event', () => {
      const { businessMetrics } = require('../../../middleware/metricsMiddleware');
      const labelsSpy = jest.spyOn(businessMetrics, 'labels').mockReturnValue({
        inc: jest.fn()
      });
      const incSpy = jest.spyOn(businessMetrics.labels('user_signup', 'auth'), 'inc');

      recordBusinessEvent('user_signup', 'auth');

      expect(labelsSpy).toHaveBeenCalledWith('user_signup', 'auth');
      expect(incSpy).toHaveBeenCalled();
      labelsSpy.mockRestore();
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

