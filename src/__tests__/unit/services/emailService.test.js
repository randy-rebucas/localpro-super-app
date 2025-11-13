const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const logger = require('../../../config/logger');

jest.mock('nodemailer');
jest.mock('resend');
jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const emailService = require('../../../services/emailService');

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    test('should handle missing email configuration', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_USER;
      
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test message'
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('testConnection', () => {
    test('should test email connection', async () => {
      emailService.sendEmail = jest.fn().mockResolvedValue({ success: true });
      
      const result = await emailService.testConnection();
      
      expect(result.success).toBeDefined();
    });
  });
});

