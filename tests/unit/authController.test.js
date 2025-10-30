/**
 * Authentication Controller Unit Tests
 */

// Use real mongoose in this suite (mongodb-memory-server handles DB)

const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');

describe('Authentication Controller', () => {
  describe('POST /api/auth/send-code', () => {
    it('should send verification code for valid phone number', async () => {
      const phoneNumber = '+1234567890';
      
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification code sent');
    });
    
    it('should reject invalid phone number format', async () => {
      const phoneNumber = '1234567890'; // Missing + prefix
      
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_PHONE_FORMAT');
    });
    
    it('should reject missing phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_PHONE_NUMBER');
    });
  });
  
  describe('POST /api/auth/verify-code', () => {
    let verificationCode;
    beforeEach(async () => {
      verificationCode = '123456';
    });
    
    it('should verify code and return token for valid code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-code')
        .set('x-test-bypass', 'true')
        .send({
          phoneNumber: '+1234567890',
          code: verificationCode
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.message).toContain('User registered');
    });
    
    it('should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-code')
        .set('x-test-bypass', 'true')
        .send({
          phoneNumber: '+1234567890',
          code: '000000'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_VERIFICATION_CODE');
    });
    
    it('should reject expired verification code', async () => {
      // Create user with expired code
      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1987654321',
          code: '123456'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VERIFICATION_CODE_EXPIRED');
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('should reject registration without authentication', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authorization denied');
    });
  });
  
  describe('GET /api/auth/profile', () => {
    it('should reject profile access without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authorization denied');
    });
  });
});
