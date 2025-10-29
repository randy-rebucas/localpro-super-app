// Comprehensive Jest setup for all tests
const mongoose = require('mongoose');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.env
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.TWILIO_ACCOUNT_SID = 'test-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_SERVICE = 'resend';
process.env.EMAIL_API_KEY = 'test-api-key';

// Mock mongoose connection
const mockConnection = {
  readyState: 1,
  host: 'localhost',
  port: 27017,
  name: 'test-db',
  dropDatabase: jest.fn().mockResolvedValue(),
  close: jest.fn().mockResolvedValue()
};

// Mock mongoose
const mockMongoose = {
  connect: jest.fn().mockResolvedValue({ connection: mockConnection }),
  disconnect: jest.fn().mockResolvedValue(),
  connection: mockConnection,
  Schema: jest.fn().mockImplementation(() => ({
    virtual: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    index: jest.fn().mockReturnThis(),
    statics: {},
    methods: {},
    pre: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' })),
      Mixed: 'Mixed',
      String: 'String',
      Number: 'Number',
      Date: 'Date',
      Boolean: 'Boolean',
      Array: 'Array'
    }
  })),
  model: jest.fn().mockImplementation(() => ({
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    deleteMany: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    generateReferralCode: jest.fn().mockReturnValue('REF123'),
    comparePassword: jest.fn().mockResolvedValue(true),
    generateAuthToken: jest.fn().mockReturnValue('mock-token')
  })),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' }))
  }
};

// Add Schema.Types to the main export
mockMongoose.Schema.Types = {
  ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' })),
  Mixed: 'Mixed',
  String: 'String',
  Number: 'Number',
  Date: 'Date',
  Boolean: 'Boolean',
  Array: 'Array'
};

jest.mock('mongoose', () => mockMongoose);

// Mock all services
jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/twilioService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
  sendVerificationSMS: jest.fn().mockResolvedValue({ success: true }),
  sendVerificationCode: jest.fn().mockResolvedValue({ success: true }),
  verifySMS: jest.fn().mockResolvedValue({ success: true }),
  verifyCode: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/cloudinaryService', () => ({
  uploadImage: jest.fn().mockResolvedValue({ 
    public_id: 'test-id', 
    secure_url: 'https://test.com/image.jpg' 
  }),
  deleteImage: jest.fn().mockResolvedValue({ success: true }),
  uploadMultipleImages: jest.fn().mockResolvedValue([])
}));

jest.mock('../src/services/paypalService', () => ({
  createOrder: jest.fn().mockResolvedValue({ id: 'order-id' }),
  captureOrder: jest.fn().mockResolvedValue({ id: 'capture-id' }),
  getOrder: jest.fn().mockResolvedValue({ id: 'order-id' }),
  createSubscription: jest.fn().mockResolvedValue({ id: 'sub-id' }),
  getSubscription: jest.fn().mockResolvedValue({ id: 'sub-id' }),
  cancelSubscription: jest.fn().mockResolvedValue({ success: true }),
  createBillingPlan: jest.fn().mockResolvedValue({ id: 'plan-id' }),
  verifyWebhookSignature: jest.fn().mockResolvedValue(true),
  processWebhookEvent: jest.fn().mockResolvedValue({ success: true }),
  createPayment: jest.fn().mockResolvedValue({ id: 'payment-id' }),
  executePayment: jest.fn().mockResolvedValue({ success: true }),
  handlePaymentCompleted: jest.fn().mockResolvedValue({ success: true }),
  handlePaymentDenied: jest.fn().mockResolvedValue({ success: true }),
  handleSubscriptionActivated: jest.fn().mockResolvedValue({ success: true }),
  handleSubscriptionCancelled: jest.fn().mockResolvedValue({ success: true }),
  handleSubscriptionPaymentCompleted: jest.fn().mockResolvedValue({ success: true }),
  handleSubscriptionPaymentFailed: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/paypalSubscriptionService', () => ({
  processSubscriptionWebhook: jest.fn().mockResolvedValue({ success: true }),
  createSubscription: jest.fn().mockResolvedValue({ id: 'sub-id' }),
  cancelSubscription: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/paymayaService', () => ({
  createCheckout: jest.fn().mockResolvedValue({ success: true, checkoutId: 'checkout-123' }),
  getCheckout: jest.fn().mockResolvedValue({ success: true, data: {} }),
  createPayment: jest.fn().mockResolvedValue({ success: true, paymentId: 'payment-123' }),
  getPayment: jest.fn().mockResolvedValue({ success: true, data: {} }),
  createInvoice: jest.fn().mockResolvedValue({ success: true, invoiceId: 'invoice-123' }),
  getInvoice: jest.fn().mockResolvedValue({ success: true, data: {} }),
  verifyWebhookSignature: jest.fn().mockResolvedValue(true),
  processWebhookEvent: jest.fn().mockResolvedValue({ success: true }),
  handleCheckoutSuccess: jest.fn().mockResolvedValue({ success: true }),
  handleCheckoutFailure: jest.fn().mockResolvedValue({ success: true }),
  handlePaymentSuccess: jest.fn().mockResolvedValue({ success: true }),
  handlePaymentFailure: jest.fn().mockResolvedValue({ success: true }),
  handleInvoicePaid: jest.fn().mockResolvedValue({ success: true }),
  handleInvoiceExpired: jest.fn().mockResolvedValue({ success: true }),
  validateConfig: jest.fn().mockReturnValue(true)
}));

// Mock all models
jest.mock('../src/models/User', () => {
  const createMockQuery = (result) => {
    // Create a thenable object that resolves to the result
    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(result)
    };
    
    // Create a promise that resolves to the result
    const promise = Promise.resolve(result);
    
    // Add all query methods to the promise
    Object.keys(query).forEach(key => {
      promise[key] = query[key];
    });
    
    // Make the promise itself have the query methods by creating a hybrid object
    const hybridQuery = Object.create(promise);
    Object.assign(hybridQuery, query);
    
    // Override the then method to return the promise
    hybridQuery.then = promise.then.bind(promise);
    hybridQuery.catch = promise.catch.bind(promise);
    hybridQuery.finally = promise.finally.bind(promise);
    
    return hybridQuery;
  };

  const mockUser = {
    find: jest.fn().mockReturnValue(createMockQuery([])),
    findById: jest.fn().mockReturnValue(createMockQuery(null)),
    findOne: jest.fn().mockReturnValue(createMockQuery(null)),
    create: jest.fn().mockResolvedValue({}),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    findByIdAndDelete: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    save: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    generateReferralCode: jest.fn().mockReturnValue('REF123'),
    comparePassword: jest.fn().mockResolvedValue(true),
    generateAuthToken: jest.fn().mockReturnValue('mock-token')
  };

  return mockUser;
});

jest.mock('../src/models/Agency', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));

// Mock additional models that exist
jest.mock('../src/models/Finance', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/models/Marketplace', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/models/Supplies', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/models/LocalProPlus', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));

// Note: Payment, Transaction, Booking, and Order models don't exist in src/models
// These will be mocked individually in test files that need them

// Mock config files
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  logBusinessEvent: jest.fn(),
  logSecurityEvent: jest.fn(),
  logPerformance: jest.fn()
}));

jest.mock('../src/config/envValidation', () => ({
  validateEnvironment: jest.fn().mockResolvedValue({ valid: true }),
  getEnvironmentSummary: jest.fn().mockReturnValue({
    environment: 'test',
    port: 3000,
    database: { configured: true },
    email: { service: 'resend', configured: true },
    fileUpload: { configured: true },
    maps: { configured: true },
    payments: { paypal: true, paymaya: true },
    sms: { configured: true },
    cache: { configured: true }
  })
}));

jest.mock('../src/config/databaseTransport', () => {
  return jest.fn().mockImplementation(() => ({}));
});

// Mock auditLogger
jest.mock('../src/utils/auditLogger', () => ({
  auditLogger: {
    logUser: jest.fn().mockResolvedValue({}),
    logAction: jest.fn().mockResolvedValue({}),
    logError: jest.fn().mockResolvedValue({})
  }
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1)
  })
}));

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user-id', role: 'client' },
  ...overrides
});

global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockUser = (overrides = {}) => ({
  _id: 'user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '+1234567890',
  role: 'client',
  isActive: true,
  isVerified: false,
  profile: {
    businessName: 'Test Business',
    avatar: null
  },
  agency: null,
  save: jest.fn().mockResolvedValue(),
  remove: jest.fn().mockResolvedValue(),
  generateReferralCode: jest.fn().mockReturnValue('REF123'),
  comparePassword: jest.fn().mockResolvedValue(true),
  generateAuthToken: jest.fn().mockReturnValue('mock-token'),
  ...overrides
});

global.createMockAgency = (overrides = {}) => ({
  _id: 'agency-id',
  name: 'Test Agency',
  description: 'Test Description',
  isActive: true,
  save: jest.fn().mockResolvedValue(),
  remove: jest.fn().mockResolvedValue(),
  ...overrides
});

// Setup and teardown
beforeAll(async () => {
  // Any global setup
});

afterAll(async () => {
  // Clean up
  jest.clearAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});