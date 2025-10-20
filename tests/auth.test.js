const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

// Set up test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
  process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
  process.env.TWILIO_VERIFY_SERVICE_SID = 'test_service_sid';
  process.env.JWT_SECRET = 'test_jwt_secret';
  
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear database between tests
afterEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/send-code', () => {
    it('should send verification code for valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification code');
    });

    it('should return 400 for invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-code', () => {
    it('should verify code and create user', async () => {
      // First send code
      await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' });

      // Then verify with mock code (in development mode)
      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: '123456',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 400 for invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: 'invalid',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Send and verify code to get token
      await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: '123456',
          firstName: 'John',
          lastName: 'Doe'
        });

      authToken = verifyResponse.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe('+1234567890');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
