// Mock all services
const mockService = {
  sendEmail: jest.fn(),
  sendSMS: jest.fn(),
  uploadImage: jest.fn(),
  verifyWebhookSignature: jest.fn(),
  processWebhookEvent: jest.fn(),
  processSubscriptionWebhook: jest.fn(),
  sendViaResend: jest.fn(),
  sendViaSMTP: jest.fn(),
  testConnection: jest.fn()
};

// Email Service
const EmailService = jest.fn().mockImplementation(() => mockService);

// Twilio Service
const TwilioService = jest.fn().mockImplementation(() => mockService);

// Cloudinary Service
const CloudinaryService = {
  uploadImage: jest.fn()
};

// PayPal Service
const PayPalService = {
  verifyWebhookSignature: jest.fn(),
  processWebhookEvent: jest.fn()
};

// PayPal Subscription Service
const PayPalSubscriptionService = {
  processSubscriptionWebhook: jest.fn()
};

module.exports = {
  EmailService,
  TwilioService,
  CloudinaryService,
  PayPalService,
  PayPalSubscriptionService
};
