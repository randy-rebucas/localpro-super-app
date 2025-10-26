const request = require('supertest');
const app = require('../../src/server');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const timestamp = Date.now();
      const phoneNumber = `+1234567${timestamp.toString().slice(-3)}`;
      
      // Step 1: Send verification code
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber });

      expect(sendCodeResponse.status).toBe(200);
      expect(sendCodeResponse.body.success).toBe(true);

      // Step 2: Verify code and get tokens
      const verifyResponse = await request(app)
        .post('/api/auth/verify-code')
        .send({ 
          phoneNumber,
          code: '123456'
        });

      expect(verifyResponse.status).toBe(201);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body).toHaveProperty('accessToken');
      expect(verifyResponse.body).toHaveProperty('refreshToken');
      expect(verifyResponse.body).toHaveProperty('user');

      // Step 3: Use access token to get user profile
      const token = verifyResponse.body.accessToken;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.user).toHaveProperty('_id');
    });

    it('should handle token refresh', async () => {
      // Create a test user
      const user = await global.testUtils.createTestUser();
      const tokenPair = global.testUtils.generateTokenPair(user);

      // Test refresh token endpoint
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: tokenPair.refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
    });
  });

  describe('Marketplace Integration', () => {
    let providerToken;
    let clientToken;

    beforeAll(async () => {
      // Create test users
      const provider = await global.testUtils.createTestUser({ role: 'provider' });
      const client = await global.testUtils.createTestUser({ role: 'client' });
      
      providerToken = global.testUtils.generateAuthToken(provider._id);
      clientToken = global.testUtils.generateAuthToken(client._id);
    });

    it('should create and retrieve services', async () => {
      // Create a service
      const serviceData = {
        title: 'Test Cleaning Service',
        description: 'Professional cleaning service',
        category: 'cleaning',
        subcategory: 'residential',
        pricing: {
          basePrice: 50,
          currency: 'USD',
          pricingType: 'hourly'
        },
        serviceArea: ['New York', 'NY']
      };

      const createResponse = await request(app)
        .post('/api/marketplace/services')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(serviceData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe(serviceData.title);

      const serviceId = createResponse.body.data._id;

      // Retrieve the service
      const getResponse = await request(app)
        .get(`/api/marketplace/services/${serviceId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data._id).toBe(serviceId);
    });

    it('should list services with pagination', async () => {
      // Create multiple services
      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestService({
          title: `Service ${i}`,
          category: 'cleaning'
        });
      }

      const response = await request(app)
        .get('/api/marketplace/services?page=1&limit=3');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
    });

    it('should filter services by category', async () => {
      // Create services with different categories
      await global.testUtils.createTestService({ category: 'cleaning' });
      await global.testUtils.createTestService({ category: 'plumbing' });

      const response = await request(app)
        .get('/api/marketplace/services?category=cleaning');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(service => service.category === 'cleaning')).toBe(true);
    });
  });

  describe('Job Board Integration', () => {
    let employerToken;

    beforeAll(async () => {
      const employer = await global.testUtils.createTestUser({ role: 'provider' });
      employerToken = global.testUtils.generateAuthToken(employer._id);
    });

    it('should create and retrieve jobs', async () => {
      // Create a job
      const jobData = {
        title: 'Software Developer',
        description: 'Full-stack developer position',
        company: {
          name: 'Tech Corp',
          location: {
            city: 'New York',
            state: 'NY',
            isRemote: false
          }
        },
        category: 'technology',
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        }
      };

      const createResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe(jobData.title);

      const jobId = createResponse.body.data._id;

      // Retrieve the job
      const getResponse = await request(app)
        .get(`/api/jobs/${jobId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data._id).toBe(jobId);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes', async () => {
      const response = await request(app)
        .get('/api/invalid-route');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid authorization token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
