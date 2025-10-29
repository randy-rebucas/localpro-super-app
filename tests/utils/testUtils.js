const request = require('supertest');
const mongoose = require('mongoose');

/**
 * Test utilities for API testing
 */
class TestUtils {
  /**
   * Create a test app instance
   */
  static createTestApp() {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    // Import app after setting environment
    const app = require('../../src/server');
    return app;
  }

  /**
   * Make authenticated request
   */
  static async makeAuthenticatedRequest(app, method, endpoint, token, data = null) {
    const req = request(app)[method](endpoint)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    if (data) {
      return req.send(data);
    }
    return req;
  }

  /**
   * Create test user with default data
   */
  static async createTestUser(userData = {}) {
    const User = require('../../src/models/User');
    const bcrypt = require('bcryptjs');
    
    const defaultUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      phoneNumber: '+1234567890',
      role: 'client',
      isVerified: true,
      ...userData
    };
    
    return await User.create(defaultUser);
  }

  /**
   * Create test provider user
   */
  static async createTestProvider(providerData = {}) {
    const User = require('../../src/models/User');
    const bcrypt = require('bcryptjs');
    
    const defaultProvider = {
      firstName: 'Test',
      lastName: 'Provider',
      email: 'provider@example.com',
      password: await bcrypt.hash('password123', 10),
      phoneNumber: '+1234567890',
      role: 'provider',
      isVerified: true,
      businessName: 'Test Business',
      businessAddress: '123 Test Street',
      ...providerData
    };
    
    return await User.create(defaultProvider);
  }

  /**
   * Create test service
   */
  static async createTestService(serviceData = {}) {
    const Service = require('../../src/models/Service');
    
    const defaultService = {
      title: 'Test Service',
      description: 'Test service description',
      category: 'cleaning',
      subcategory: 'house-cleaning',
      price: 100,
      duration: 60,
      provider: new mongoose.Types.ObjectId(),
      location: {
        address: '123 Test Street',
        coordinates: { lat: 14.5995, lng: 120.9842 }
      },
      isActive: true,
      ...serviceData
    };
    
    return await Service.create(defaultService);
  }

  /**
   * Create test booking
   */
  static async createTestBooking(bookingData = {}) {
    const Booking = require('../../src/models/Booking');
    
    const defaultBooking = {
      client: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      provider: new mongoose.Types.ObjectId(),
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'pending',
      totalAmount: 100,
      location: {
        address: '123 Client Street',
        coordinates: { lat: 14.5995, lng: 120.9842 }
      },
      ...bookingData
    };
    
    return await Booking.create(defaultBooking);
  }

  /**
   * Generate JWT token for testing
   */
  static generateToken(userId, expiresIn = '1h') {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  }

  /**
   * Create test subscription plan
   */
  static async createTestSubscriptionPlan(planData = {}) {
    const SubscriptionPlan = require('../../src/models/SubscriptionPlan');
    
    const defaultPlan = {
      name: 'Test Plan',
      description: 'Test subscription plan',
      price: 29.99,
      duration: 30, // days
      features: ['feature1', 'feature2'],
      isActive: true,
      ...planData
    };
    
    return await SubscriptionPlan.create(defaultPlan);
  }

  /**
   * Create test job posting
   */
  static async createTestJob(jobData = {}) {
    const Job = require('../../src/models/Job');
    
    const defaultJob = {
      title: 'Test Job',
      description: 'Test job description',
      company: 'Test Company',
      location: 'Test City',
      salary: '50000-70000',
      type: 'full-time',
      category: 'technology',
      requirements: ['requirement1', 'requirement2'],
      isActive: true,
      ...jobData
    };
    
    return await Job.create(defaultJob);
  }

  /**
   * Wait for database operations to complete
   */
  static async waitForDB() {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  /**
   * Mock external service responses
   */
  static mockExternalServices() {
    // Mock Twilio
    jest.mock('../../src/services/twilioService', () => ({
      sendSMS: jest.fn().mockResolvedValue({ success: true }),
      sendWhatsApp: jest.fn().mockResolvedValue({ success: true })
    }));

    // Mock Email Service
    jest.mock('../../src/services/emailService', () => ({
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
    }));

    // Mock PayPal Service
    jest.mock('../../src/services/paypalService', () => ({
      createPayment: jest.fn().mockResolvedValue({ id: 'test-payment-id' }),
      executePayment: jest.fn().mockResolvedValue({ success: true })
    }));

    // Mock PayMaya Service
    jest.mock('../../src/services/paymayaService', () => ({
      createPayment: jest.fn().mockResolvedValue({ id: 'test-payment-id' }),
      processPayment: jest.fn().mockResolvedValue({ success: true })
    }));
  }
}

module.exports = TestUtils;
