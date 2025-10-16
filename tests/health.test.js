const request = require('supertest');
const app = require('../src/server');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('LocalPro Super App API');
      expect(response.body.version).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.company).toBeDefined();
      expect(response.body.contact).toBeDefined();
    });
  });
});
