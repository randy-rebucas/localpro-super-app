const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const { generateToken } = require('../../utils/auth');

describe('Authentication Controller', () => {
  let testUser;
  let adminUser;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      phoneNumber: '+1234567890',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['client']
    });

    adminUser = await User.create({
      phoneNumber: '+1234567891',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin']
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({
      phoneNumber: { $in: ['+1234567890', '+1234567891'] }
    });
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '+1234567892',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.phoneNumber).toBe('+1234567892');

      // Clean up
      await User.findOneAndDelete({ phoneNumber: '+1234567892' });
    });

    it('should reject registration with existing phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '+1234567890', // Existing phone
          firstName: 'Duplicate',
          lastName: 'User'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test'
          // Missing phoneNumber
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/verify-code', () => {
    it('should verify user with correct code', async () => {
      // First register a user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '+1234567893',
          firstName: 'Verify',
          lastName: 'Test'
        });

      const user = await User.findById(registerResponse.body.data.user.id);

      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567893',
          code: user.verificationCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isVerified).toBe(true);

      // Clean up
      await User.findOneAndDelete({ phoneNumber: '+1234567893' });
    });

    it('should reject incorrect verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: '000000'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CODE');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Set verification code for test user
      await User.findByIdAndUpdate(testUser._id, {
        verificationCode: '123456',
        isVerified: true
      });
    });

    it('should login user with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+1234567890',
          code: '123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.phoneNumber).toBe('+1234567890');
    });

    it('should reject login with incorrect code', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+1234567890',
          code: '000000'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for unverified user', async () => {
      await User.findByIdAndUpdate(testUser._id, { isVerified: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+1234567890',
          code: '123456'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_NOT_VERIFIED');

      // Restore verification status
      await User.findByIdAndUpdate(testUser._id, { isVerified: true });
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeAll(async () => {
      userToken = generateToken(testUser._id);
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser._id.toString());
      expect(response.body.data.user.phoneNumber).toBe('+1234567890');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let userToken;

    beforeAll(async () => {
      userToken = generateToken(testUser._id);
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
    });

    it('should reject email update to existing email', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'admin@example.com' // Existing email
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/logout', () => {
    let userToken;

    beforeAll(async () => {
      userToken = generateToken(testUser._id);
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset code for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset code sent');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      // Should still return success for security (don't reveal if email exists)
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeAll(async () => {
      // Generate a reset token for testing
      resetToken = generateToken(testUser._id, '1h');
      // In real implementation, this would be stored in the user document
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset');
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('Role-based Access Control', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = generateToken(adminUser._id);
    });

    it('should allow admin to access admin-only endpoints', async () => {
      // This would test admin-specific endpoints
      // For now, just verify the token contains admin role
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.user.roles).toContain('admin');
    });

    it('should restrict regular user from admin endpoints', async () => {
      // This would be tested on actual admin-only endpoints
      const userToken = generateToken(testUser._id);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.user.roles).not.toContain('admin');
    });
  });

  describe('Security Features', () => {
    it('should implement rate limiting', async () => {
      // Test rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              phoneNumber: '+1234567890',
              code: '123456'
            })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate input sanitization', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '+1234567894',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User'
        })
        .expect(201);

      // Should sanitize XSS attempts
      expect(response.body.data.user.firstName).not.toContain('<script>');
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+1234567890',
          code: "'; DROP TABLE users; --"
        })
        .expect(401);

      // Should not execute malicious queries
      expect(response.body.success).toBe(false);
    });
  });
});
