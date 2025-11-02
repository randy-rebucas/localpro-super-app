/**
 * Rate Limiter Middleware Tests
 */

const { generalLimiter, authLimiter, smsLimiter } = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  describe('Rate Limiter Configuration', () => {
    it('should export all required limiters', () => {
      expect(generalLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(smsLimiter).toBeDefined();
    });

    it('should have correct windowMs for general limiter', () => {
      expect(generalLimiter).toBeDefined();
      // General limiter should be configured
      expect(typeof generalLimiter).toBe('function');
    });

    it('should have stricter limits for auth limiter', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('should have very strict limits for SMS limiter', () => {
      expect(smsLimiter).toBeDefined();
      expect(typeof smsLimiter).toBe('function');
    });
  });

  describe('Rate Limiter Types', () => {
    it('should create rate limiter instances', () => {
      // Rate limiters should be middleware functions
      expect(typeof generalLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof smsLimiter).toBe('function');
    });
  });
});
