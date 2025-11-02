/**
 * Email Service Tests
 * Tests for emailService.js
 */

// Mock dependencies - create mock functions inside the factory
const mockFunctions = {};
jest.mock('nodemailer', () => {
  mockFunctions.sendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
  mockFunctions.verify = jest.fn().mockResolvedValue(true);
  
  const mockTransporter = {
    sendMail: mockFunctions.sendMail,
    verify: mockFunctions.verify
  };
  return {
    createTransport: jest.fn(() => mockTransporter)
  };
});

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'resend-id' })
    }
  }))
}));

jest.mock('../../utils/templateEngine', () => ({
  render: jest.fn().mockReturnValue('<html>Test Template</html>')
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const templateEngine = require('../../utils/templateEngine');

describe('EmailService', () => {
  // Service is exported as singleton instance
  const emailService = require('../../services/emailService');
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default environment
    process.env.EMAIL_SERVICE = 'resend';
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.FROM_EMAIL = 'test@example.com';
    
    // Re-initialize email service for tests
    if (emailService.initializeEmailService) {
      emailService.initializeEmailService();
    }
  });

  describe('Service Instance', () => {
    it('should have fromEmail property', () => {
      expect(emailService.fromEmail).toBeDefined();
    });

    it('should have emailService property', () => {
      expect(emailService.emailService).toBeDefined();
    });
  });

  describe('initializeEmailService', () => {
    it('should initialize SMTP transporter for hostinger', () => {
      process.env.EMAIL_SERVICE = 'hostinger';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';
      
      emailService.emailService = 'hostinger';
      emailService.initializeEmailService();
      
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(emailService.transporter).toBeDefined();
    });

    it('should handle missing SMTP credentials', () => {
      process.env.EMAIL_SERVICE = 'smtp';
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      emailService.emailService = 'smtp';
      emailService.initializeEmailService();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(emailService.transporter).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await emailService.sendWelcomeEmail('user@example.com', 'John');

      expect(templateEngine.render).toHaveBeenCalledWith('welcome', {
        firstName: 'John',
        subject: 'Welcome to LocalPro Super App!'
      });
      expect(result).toBeDefined();
    });

    it('should use fallback HTML on template error', async () => {
      templateEngine.render.mockImplementationOnce(() => {
        throw new Error('Template error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await emailService.sendWelcomeEmail('user@example.com', 'John');

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation email', async () => {
      const booking = {
        _id: 'booking-123',
        serviceName: 'Cleaning Service',
        date: new Date(),
        time: '10:00 AM',
        totalAmount: 100,
        status: 'confirmed'
      };

      const result = await emailService.sendBookingConfirmation('user@example.com', booking);

      expect(templateEngine.render).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const order = {
        _id: 'order-123',
        totalAmount: 150,
        items: [{ name: 'Item 1', quantity: 2 }],
        status: 'confirmed'
      };

      const result = await emailService.sendOrderConfirmation('user@example.com', order);

      expect(templateEngine.render).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('sendLoanApproval', () => {
    it('should send loan approval email', async () => {
      const loan = {
        _id: 'loan-123',
        type: 'Personal Loan',
        amount: { approved: 5000 },
        term: {
          interestRate: 10,
          duration: 12,
          monthlyPayment: 500
        }
      };

      const result = await emailService.sendLoanApproval('user@example.com', loan);

      expect(templateEngine.render).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should send email via Resend', async () => {
      emailService.emailService = 'resend';
      // Create a fresh Resend instance with mocked methods
      const mockResend = new Resend('test-key');
      emailService.resend = mockResend;
      
      // Ensure the mock is set up correctly
      mockResend.emails.send = jest.fn().mockResolvedValue({ 
        data: { id: 'resend-id' },
        error: null 
      });
      
      const result = await emailService.sendEmail('user@example.com', 'Test Subject', '<html>Test</html>');

      expect(mockResend.emails.send).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should send email via SMTP', async () => {
      emailService.emailService = 'smtp';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';
      emailService.initializeEmailService();
      
      const result = await emailService.sendEmail('user@example.com', 'Test Subject', '<html>Test</html>');

      expect(emailService.transporter.sendMail).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle email sending errors', async () => {
      emailService.emailService = 'resend';
      const mockResend = new Resend('test-key');
      emailService.resend = mockResend;
      mockResend.emails.send = jest.fn().mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendEmail('user@example.com', 'Test', '<html>Test</html>');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendViaResend', () => {
    it('should send email via Resend API', async () => {
      const mockResend = new Resend('test-key');
      mockResend.emails.send = jest.fn().mockResolvedValue({ 
        data: { id: 'resend-id' },
        error: null 
      });
      emailService.resend = mockResend;
      
      const result = await emailService.sendViaResend('user@example.com', 'Test Subject', '<html>Test</html>');

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: emailService.fromEmail,
        to: ['user@example.com'],
        subject: 'Test Subject',
        html: '<html>Test</html>'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendViaSMTP', () => {
    it('should send email via SMTP', async () => {
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';
      emailService.emailService = 'smtp';
      emailService.initializeEmailService();

      const result = await emailService.sendViaSMTP('user@example.com', 'Test Subject', '<html>Test</html>');

      expect(emailService.transporter.sendMail).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle SMTP errors', async () => {
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';
      emailService.emailService = 'smtp';
      emailService.initializeEmailService();
      
      // Set up the mock to reject using the mock function from the factory
      mockFunctions.sendMail.mockRejectedValueOnce(new Error('SMTP error'));
      
      // sendViaSMTP doesn't catch errors internally, so we expect it to throw
      await expect(
        emailService.sendViaSMTP('user@example.com', 'Test', '<html>Test</html>')
      ).rejects.toThrow('SMTP error');
      
      // Reset the mock for other tests
      mockFunctions.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
    });
  });

  describe('sendViaSendGrid', () => {
    it('should throw error as SendGrid is not implemented', async () => {
      await expect(
        emailService.sendViaSendGrid('user@example.com', 'Test', '<html>Test</html>')
      ).rejects.toThrow('SendGrid integration not yet implemented');
    });
  });
});

