const { validateAllServices, testAllServices } = require('../../scripts/validate-services');

describe('External Services Configuration', () => {
  describe('Service Validation', () => {
    it('should validate all service configurations', async () => {
      const result = await validateAllServices();
      expect(typeof result).toBe('boolean');
    });

    it('should test all service connections', async () => {
      const results = await testAllServices();
      expect(typeof results).toBe('object');
    });
  });

  describe('Service Mocks', () => {
    it('should have Twilio service mocked', () => {
      const twilioService = require('../../src/services/twilioService');
      expect(twilioService.sendVerificationCode).toBeDefined();
      expect(twilioService.verifyCode).toBeDefined();
    });

    it('should have Email service mocked', () => {
      const emailService = require('../../src/services/emailService');
      expect(emailService.sendWelcomeEmail).toBeDefined();
      expect(emailService.sendNotificationEmail).toBeDefined();
    });

    it('should have Cloudinary service mocked', () => {
      const cloudinaryService = require('../../src/services/cloudinaryService');
      expect(cloudinaryService.uploadFile).toBeDefined();
      expect(cloudinaryService.uploadMultipleFiles).toBeDefined();
      expect(cloudinaryService.deleteFile).toBeDefined();
    });

    it('should have PayPal service mocked', () => {
      const paypalService = require('../../src/services/paypalService');
      expect(paypalService.createPayment).toBeDefined();
      expect(paypalService.executePayment).toBeDefined();
      expect(paypalService.createSubscription).toBeDefined();
    });

    it('should have PayMaya service mocked', () => {
      const paymayaService = require('../../src/services/paymayaService');
      expect(paymayaService.createPayment).toBeDefined();
      expect(paymayaService.processPayment).toBeDefined();
    });
  });

  describe('Mock Functionality', () => {
    it('should mock Twilio sendVerificationCode successfully', async () => {
      const { TwilioService } = require('../../src/services/twilioService');
      const result = await TwilioService.sendVerificationCode('+1234567890');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Verification code sent');
    });

    it('should mock Twilio verifyCode successfully', async () => {
      const { TwilioService } = require('../../src/services/twilioService');
      const result = await TwilioService.verifyCode('+1234567890', '123456');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Code verified');
    });

    it('should mock Email sendWelcomeEmail successfully', async () => {
      const emailService = require('../../src/services/emailService');
      const result = await emailService.sendWelcomeEmail('test@example.com', 'John');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Welcome email sent');
    });

    it('should mock Cloudinary uploadFile successfully', async () => {
      const cloudinaryService = require('../../src/services/cloudinaryService');
      const mockFile = { path: 'test.jpg', originalname: 'test.jpg' };
      const result = await cloudinaryService.uploadFile(mockFile, 'test-folder');
      
      expect(result.success).toBe(true);
      expect(result.data.secure_url).toContain('cloudinary.com');
      expect(result.data.public_id).toBeDefined();
    });

    it('should mock PayPal createPayment successfully', async () => {
      const paypalService = require('../../src/services/paypalService');
      const result = await paypalService.createPayment({
        amount: 100,
        currency: 'USD',
        description: 'Test payment'
      });
      
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.approvalUrl).toContain('paypal.com');
    });

    it('should mock PayMaya createPayment successfully', async () => {
      const paymayaService = require('../../src/services/paymayaService');
      const result = await paymayaService.createPayment({
        amount: 100,
        currency: 'PHP',
        description: 'Test payment'
      });
      
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
    });
  });
});
