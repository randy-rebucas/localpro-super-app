const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Close any existing connections first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      // Wait a bit for the connection to fully close
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Limit connection pool size
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Test database disconnected');
    }
    
    // Stop the in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ Test MongoDB server stopped');
    }
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const User = require('../src/models/User');
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const defaultUser = {
      phoneNumber: `+1234567${timestamp.toString().slice(-3)}${randomSuffix.toString().padStart(3, '0')}`,
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      isVerified: true,
      status: 'active',
      ...overrides
    };
    return await User.create(defaultUser);
  },

  createTestService: async (overrides = {}) => {
    const { Service } = require('../src/models/Marketplace');
    const User = require('../src/models/User');
    
    // Create a test provider if not provided
    let providerId = overrides.provider;
    if (!providerId) {
      const provider = await global.testUtils.createTestUser({ role: 'provider' });
      providerId = provider._id;
    }
    
    const defaultService = {
      title: 'Test Service',
      description: 'Test service description',
      category: 'cleaning',
      subcategory: 'residential',
      provider: providerId,
      pricing: {
        basePrice: 50,
        currency: 'USD',
        pricingType: 'hourly',
        type: 'hourly'
      },
      serviceArea: ['New York', 'NY'],
      isActive: true,
      ...overrides
    };
    return await Service.create(defaultService);
  },

  createTestJob: async (overrides = {}) => {
    const Job = require('../src/models/Job');
    const User = require('../src/models/User');
    
    // Create a test employer if not provided
    let employerId = overrides.employer;
    if (!employerId) {
      const employer = await global.testUtils.createTestUser({ role: 'client' });
      employerId = employer._id;
    }
    
    const defaultJob = {
      title: 'Test Job',
      description: 'Test job description',
      company: {
        name: 'Test Company',
        location: {
          city: 'New York',
          state: 'NY',
          isRemote: false
        }
      },
      category: 'technology',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: {
        min: 50000,
        max: 70000,
        currency: 'USD',
        period: 'yearly'
      },
      status: 'active',
      employer: employerId,
      ...overrides
    };
    return await Job.create(defaultJob);
  },

  generateAuthToken: (userId) => {
    const { generateAccessToken } = require('../src/config/jwt');
    
    // Create a minimal user object for token generation
    const user = {
      _id: userId,
      phoneNumber: '+1234567890',
      role: 'client',
      isVerified: true
    };
    
    return generateAccessToken(user);
  },

  generateTokenPair: (user) => {
    const { generateTokenPair } = require('../src/config/jwt');
    return generateTokenPair(user);
  },

  expectValidationError: (response, field) => {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/validation|required|invalid/i);
    if (field) {
      expect(response.body.details).toHaveProperty(field);
    }
  },

  expectUnauthorized: (response) => {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/authentication|token|authorization/i);
  },

  expectForbidden: (response) => {
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Access denied');
  },

  expectNotFound: (response) => {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  },

  expectSuccess: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
  }
};
