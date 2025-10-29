const TestUtils = require('./utils/testUtils');
const { testUsers } = require('./fixtures/testData');

describe('Example Test Suite', () => {
  let testUser;

  beforeEach(async () => {
    await TestUtils.cleanupTestData();
    testUser = await TestUtils.createTestUser(testUsers.client);
  });

  afterAll(async () => {
    await TestUtils.cleanupTestData();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      expect(testUser).toBeDefined();
      expect(testUser.firstName).toBe('John');
      expect(testUser.email).toBe('client@test.com');
      expect(testUser.phoneNumber).toBe('+1234567890');
      expect(testUser.role).toBe('client');
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const token = TestUtils.generateToken(testUser._id);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Test Utilities', () => {
    it('should create test provider successfully', async () => {
      const provider = await TestUtils.createTestProvider(testUsers.provider);
      expect(provider).toBeDefined();
      expect(provider.role).toBe('provider');
    });
  });
});
