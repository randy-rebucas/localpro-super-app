/**
 * Test Environment Configuration
 * 
 * This file sets up the test environment with proper configuration
 * and mocks for external services.
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/localpro-test';

// Mock external services
jest.mock('../src/services/twilioService', () => ({
  TwilioService: {
    sendVerificationCode: jest.fn().mockResolvedValue({
      success: true,
      message: 'Verification code sent successfully'
    }),
    verifyCode: jest.fn().mockResolvedValue({
      success: true,
      message: 'Code verified successfully'
    })
  }
}));

jest.mock('../src/services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    success: true,
    message: 'Welcome email sent successfully'
  }),
  sendNotificationEmail: jest.fn().mockResolvedValue({
    success: true,
    message: 'Notification email sent successfully'
  })
}));

jest.mock('../src/services/cloudinaryService', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    success: true,
    data: {
      secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
      public_id: 'test_public_id'
    }
  }),
  uploadMultipleFiles: jest.fn().mockResolvedValue({
    success: true,
    data: [{
      secure_url: 'https://res.cloudinary.com/test/image/upload/test1.jpg',
      public_id: 'test_public_id_1'
    }]
  }),
  deleteFile: jest.fn().mockResolvedValue({
    success: true,
    message: 'File deleted successfully'
  }),
  getOptimizedUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/test/image/upload/test_optimized.jpg')
}));

jest.mock('../src/services/paypalService', () => ({
  createPayment: jest.fn().mockResolvedValue({
    success: true,
    paymentId: 'test-payment-id',
    approvalUrl: 'https://paypal.com/test-approval'
  }),
  executePayment: jest.fn().mockResolvedValue({
    success: true,
    transactionId: 'test-transaction-id'
  }),
  createSubscription: jest.fn().mockResolvedValue({
    success: true,
    subscriptionId: 'test-subscription-id'
  })
}));

jest.mock('../src/services/paymayaService', () => ({
  createPayment: jest.fn().mockResolvedValue({
    success: true,
    paymentId: 'test-paymaya-payment-id'
  }),
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    transactionId: 'test-paymaya-transaction-id'
  })
}));

// Mock Google Maps service
jest.mock('@googlemaps/google-maps-services-js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    geocode: jest.fn().mockResolvedValue({
      data: {
        results: [{
          formatted_address: 'Test Address, Test City, Test State',
          geometry: {
            location: {
              lat: 40.7128,
              lng: -74.0060
            }
          }
        }]
      }
    }),
    placesNearby: jest.fn().mockResolvedValue({
      data: {
        results: []
      }
    }),
    distancematrix: jest.fn().mockResolvedValue({
      data: {
        rows: [{
          elements: [{
            distance: { text: '1.0 km', value: 1000 },
            duration: { text: '5 mins', value: 300 }
          }]
        }]
      }
    })
  }))
}));

// Mock Twilio
jest.mock('twilio', () => {
  const mockClient = {
    api: {
      accounts: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue({
          friendlyName: 'Test Account',
          status: 'active'
        })
      })
    },
    verify: {
      v2: {
        services: jest.fn().mockReturnValue({
          fetch: jest.fn().mockResolvedValue({
            friendlyName: 'Test Verify Service'
          })
        })
      }
    }
  };
  
  return jest.fn().mockReturnValue(mockClient);
});

// Mock Resend
jest.mock('resend', () => {
  const mockResend = {
    emails: {
      send: jest.fn().mockResolvedValue({
        id: 'test-email-id',
        to: 'test@example.com',
        from: 'noreply@test.com',
        subject: 'Test Email'
      })
    }
  };
  
  return {
    Resend: jest.fn().mockImplementation(() => mockResend)
  };
});

// Mock Cloudinary
jest.mock('cloudinary', () => {
  const mockCloudinary = {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn().mockResolvedValue({
          secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
          public_id: 'test_public_id'
        }),
        destroy: jest.fn().mockResolvedValue({
          result: 'ok'
        })
      },
      api: {
        ping: jest.fn().mockResolvedValue({
          status: 'ok'
        })
      }
    }
  };
  
  return mockCloudinary;
});

// Mock PayPal
jest.mock('@paypal/paypal-server-sdk', () => ({
  configure: jest.fn(),
  OrdersApi: jest.fn().mockImplementation(() => ({
    ordersCreate: jest.fn().mockResolvedValue({
      result: {
        id: 'test-order-id',
        links: [{
          href: 'https://paypal.com/test-approval',
          rel: 'approve'
        }]
      }
    })
  }))
}));

// Suppress console logs during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

module.exports = {
  // Test utilities can be exported here if needed
};
