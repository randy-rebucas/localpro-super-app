const request = require('supertest');
const app = require('../../src/server');

describe('Marketplace Controller', () => {
  describe('GET /api/marketplace/services', () => {
    it('should return services list', async () => {
      // Create test services
      await global.testUtils.createTestService();
      await global.testUtils.createTestService({ 
        title: 'Another Service',
        category: 'plumbing' 
      });

      const response = await request(app)
        .get('/api/marketplace/services');

      global.testUtils.expectSuccess(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter services by category', async () => {
      // Create services with different categories
      await global.testUtils.createTestService({ category: 'cleaning' });
      await global.testUtils.createTestService({ category: 'plumbing' });

      const response = await request(app)
        .get('/api/marketplace/services?category=cleaning');

      global.testUtils.expectSuccess(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('cleaning');
    });

    it('should filter services by price range', async () => {
      // Create services with different prices
      await global.testUtils.createTestService({ 
        pricing: { basePrice: 30, currency: 'USD', pricingType: 'hourly' }
      });
      await global.testUtils.createTestService({ 
        pricing: { basePrice: 80, currency: 'USD', pricingType: 'hourly' }
      });

      const response = await request(app)
        .get('/api/marketplace/services?minPrice=40&maxPrice=100');

      global.testUtils.expectSuccess(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].pricing.basePrice).toBe(80);
    });

    it('should paginate results', async () => {
      // Create multiple services
      for (let i = 0; i < 15; i++) {
        await global.testUtils.createTestService({ 
          title: `Service ${i}`,
          description: `Description ${i}`
        });
      }

      const response = await request(app)
        .get('/api/marketplace/services?page=1&limit=10');

      global.testUtils.expectSuccess(response);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(15);
    });
  });

  describe('GET /api/marketplace/services/:id', () => {
    it('should return single service', async () => {
      const service = await global.testUtils.createTestService();

      const response = await request(app)
        .get(`/api/marketplace/services/${service._id}`);

      global.testUtils.expectSuccess(response);
      expect(response.body.data._id).toBe(service._id.toString());
    });

    it('should return 400 for invalid service ID', async () => {
      const response = await request(app)
        .get('/api/marketplace/services/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid service ID');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .get('/api/marketplace/services/507f1f77bcf86cd799439011');

      global.testUtils.expectNotFound(response);
    });
  });

  describe('POST /api/marketplace/services', () => {
    it('should create service for authenticated provider', async () => {
      const provider = await global.testUtils.createTestUser({ role: 'provider' });
      const token = global.testUtils.generateAuthToken(provider._id);

      const serviceData = {
        title: 'New Service',
        description: 'Service description',
        category: 'cleaning',
        subcategory: 'residential',
        pricing: {
          basePrice: 50,
          currency: 'USD',
          pricingType: 'hourly'
        },
        serviceArea: ['New York', 'NY']
      };

      const response = await request(app)
        .post('/api/marketplace/services')
        .set('Authorization', `Bearer ${token}`)
        .send(serviceData);

      global.testUtils.expectSuccess(response, 201);
      expect(response.body.data.title).toBe(serviceData.title);
      expect(response.body.data.provider).toBe(provider._id.toString());
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/marketplace/services')
        .send({});

      global.testUtils.expectUnauthorized(response);
    });

    it('should return 403 for non-provider user', async () => {
      const user = await global.testUtils.createTestUser({ role: 'client' });
      const token = global.testUtils.generateAuthToken(user._id);

      const response = await request(app)
        .post('/api/marketplace/services')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      global.testUtils.expectForbidden(response);
    });
  });
});
