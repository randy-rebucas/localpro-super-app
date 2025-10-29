/**
 * Test Utilities for LocalPro Super App
 * 
 * This file provides common utilities and helpers for writing tests
 * across the application.
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock data generators
const mockData = {
  // User data generators
  createUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    phoneNumber: `+123456789${Math.floor(Math.random() * 1000)}`,
    role: 'client',
    isVerified: true,
    isActive: true,
    ...overrides
  }),

  createProvider: (overrides = {}) => ({
    firstName: 'Provider',
    lastName: 'User',
    email: `provider${Date.now()}@example.com`,
    phoneNumber: `+123456789${Math.floor(Math.random() * 1000)}`,
    role: 'provider',
    isVerified: true,
    isActive: true,
    profile: {
      businessName: 'Test Business',
      bio: 'Professional service provider',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      }
    },
    ...overrides
  }),

  createAdmin: (overrides = {}) => ({
    firstName: 'Admin',
    lastName: 'User',
    email: `admin${Date.now()}@example.com`,
    phoneNumber: `+123456789${Math.floor(Math.random() * 1000)}`,
    role: 'admin',
    isVerified: true,
    isActive: true,
    ...overrides
  }),

  // Service data generators
  createService: (overrides = {}) => ({
    title: 'Test Service',
    description: 'This is a test service description that meets the minimum length requirement.',
    category: 'cleaning',
    subcategory: 'residential',
    pricing: {
      type: 'hourly',
      basePrice: 25.00,
      currency: 'USD'
    },
    serviceArea: ['New York', 'Brooklyn'],
    features: ['Eco-friendly', 'Insured'],
    requirements: ['Access to water', 'Parking space'],
    ...overrides
  }),

  // Booking data generators
  createBooking: (overrides = {}) => ({
    serviceId: new mongoose.Types.ObjectId(),
    bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 120,
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    specialInstructions: 'Please ring doorbell twice',
    ...overrides
  }),

  // Product data generators
  createProduct: (overrides = {}) => ({
    name: 'Test Product',
    description: 'This is a test product description that meets the minimum length requirement.',
    category: 'cleaning_supplies',
    subcategory: 'detergents',
    brand: 'Test Brand',
    sku: `TEST-${Date.now()}`,
    pricing: {
      retailPrice: 15.99,
      wholesalePrice: 12.99,
      currency: 'USD'
    },
    inventory: {
      quantity: 100,
      minStock: 10,
      maxStock: 500,
      location: 'Warehouse A'
    },
    specifications: {
      weight: '1.5 lbs',
      dimensions: '8x4x2 inches',
      material: 'Biodegradable',
      color: 'Clear',
      warranty: '1 year'
    },
    tags: ['eco-friendly', 'professional'],
    isSubscriptionEligible: true,
    ...overrides
  }),

  // Payment data generators
  createPayPalOrder: (overrides = {}) => ({
    amount: 100.00,
    currency: 'USD',
    description: 'Test order',
    referenceId: `order-${Date.now()}`,
    items: [{
      name: 'Test Item',
      unit_amount: { currency_code: 'USD', value: '100.00' },
      quantity: '1'
    }],
    ...overrides
  }),

  createPayMayaCheckout: (overrides = {}) => ({
    totalAmount: 1000.00,
    currency: 'PHP',
    description: 'Test checkout',
    referenceId: `checkout-${Date.now()}`,
    buyer: {
      firstName: 'John',
      lastName: 'Doe',
      contact: { phone: '+639123456789' },
      email: 'john@example.com'
    },
    items: [{
      name: 'Test Item',
      quantity: 1,
      totalAmount: { amount: '1000.00', currency: 'PHP' }
    }],
    redirectUrl: {
      success: 'https://example.com/success',
      failure: 'https://example.com/failure',
      cancel: 'https://example.com/cancel'
    },
    ...overrides
  }),

  // Agency data generators
  createAgency: (overrides = {}) => ({
    name: 'Test Agency',
    description: 'A test agency for testing purposes',
    address: {
      street: '456 Agency St',
      city: 'Agency City',
      state: 'AS',
      zipCode: '54321',
      country: 'USA'
    },
    contact: {
      phone: '+1234567890',
      email: 'agency@example.com'
    },
    isActive: true,
    ...overrides
  })
};

// Authentication helpers
const authHelpers = {
  // Generate JWT token for testing
  generateToken: (user, expiresIn = '1h') => {
    const payload = {
      id: user._id || user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
      issuer: 'localpro-api',
      audience: 'localpro-mobile',
      expiresIn
    });
  },

  // Create authenticated request headers
  getAuthHeaders: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),

  // Create mock authenticated user
  createAuthenticatedUser: (role = 'client', overrides = {}) => {
    const user = mockData.createUser({ role, ...overrides });
    const token = authHelpers.generateToken(user);
    return { user, token };
  }
};

// Database helpers
const dbHelpers = {
  // Create and save a user to the database
  createUserInDb: async (userData = {}) => {
    const User = require('../../src/models/User');
    const user = new User(mockData.createUser(userData));
    return await user.save();
  },

  // Create and save a service to the database
  createServiceInDb: async (serviceData = {}) => {
    const Service = require('../../src/models/Service');
    const service = new Service(mockData.createService(serviceData));
    return await service.save();
  },

  // Create and save a booking to the database
  createBookingInDb: async (bookingData = {}) => {
    const Booking = require('../../src/models/Booking');
    const booking = new Booking(mockData.createBooking(bookingData));
    return await booking.save();
  },

  // Clean up database collections
  cleanupDb: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

// Validation helpers
const validationHelpers = {
  // Test phone number validation
  testPhoneNumbers: {
    valid: [
      '+1234567890',
      '+44123456789',
      '+8612345678901',
      '+33123456789'
    ],
    invalid: [
      '1234567890', // Missing +
      '+0123456789', // Starting with 0
      '+123', // Too short
      'invalid', // Not a number
      '+12345678901234567890' // Too long
    ]
  },

  // Test email validation
  testEmails: {
    valid: [
      'user@example.com',
      'test.email@domain.co.uk',
      'user+tag@example.org',
      'user123@test-domain.com'
    ],
    invalid: [
      'invalid-email',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com'
    ]
  },

  // Test ObjectId validation
  testObjectIds: {
    valid: [
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ea',
      '000000000000000000000000'
    ],
    invalid: [
      'invalid-id',
      '507f1f77bcf86cd79943901', // Too short
      '507f1f77bcf86cd799439011a', // Too long
      '507f1f77bcf86cd79943901g', // Invalid character
      '',
      null,
      undefined
    ]
  }
};

// Mock helpers
const mockHelpers = {
  // Create mock Express request
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    user: null,
    file: null,
    files: null,
    headers: {},
    ...overrides
  }),

  // Create mock Express response
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };
    return res;
  },

  // Create mock Express next function
  createMockNext: () => jest.fn(),

  // Create mock error
  createMockError: (message = 'Test error', statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
};

// Test assertion helpers
const assertionHelpers = {
  // Assert successful response
  expectSuccessResponse: (res, statusCode = 200) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  },

  // Assert error response
  expectErrorResponse: (res, statusCode = 400, message = null) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    const expectedResponse = expect.objectContaining({
      success: false
    });
    
    if (message) {
      expectedResponse.message = message;
    }
    
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
  },

  // Assert validation error
  expectValidationError: (res, field = null) => {
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('validation')
      })
    );
  },

  // Assert authentication error
  expectAuthError: (res) => {
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('authorization')
      })
    );
  },

  // Assert authorization error
  expectAuthorizationError: (res) => {
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('permission')
      })
    );
  }
};

// Performance helpers
const performanceHelpers = {
  // Measure execution time
  measureTime: async (fn) => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    return {
      result,
      duration: end - start
    };
  },

  // Assert execution time is within limits
  expectExecutionTime: (duration, maxMs = 1000) => {
    expect(duration).toBeLessThan(maxMs);
  }
};

// Export all helpers
module.exports = {
  mockData,
  authHelpers,
  dbHelpers,
  validationHelpers,
  mockHelpers,
  assertionHelpers,
  performanceHelpers
};
