/**
 * API Integration Tests
 */

// Use real mongoose in this suite (mongodb-memory-server handles DB)

const request = require('supertest');
const app = require('../../src/server');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.database).toBeDefined();
    });
  });
  
  describe('API Info Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('LocalPro Super App API');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.summary).toBeDefined();
      expect(response.body.company).toBeDefined();
    });
  });
  
  describe('Rate Limiting', () => {
    it('should handle bursts without rate limiting in current config', async () => {
      const requests = Array(50).fill().map(() => 
        request(app).get('/api/marketplace/services')
      );
      const responses = await Promise.all(requests);
      // No 429 expected with current middleware set
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBe(0);
    });
  });
  
  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/marketplace/services')
        .expect(204);
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
  
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      // Check for Helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });
  
  describe('404 Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
  
  describe('Response Compression', () => {
    it('should compress large responses', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Encoding', 'gzip')
        .expect(200);
      
      // Check if response is compressed
      expect(response.headers['content-encoding']).toBe('gzip');
    });
  });
});
