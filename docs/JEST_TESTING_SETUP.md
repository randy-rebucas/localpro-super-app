# Jest Testing Framework Setup - LocalPro Super App

## Overview
This document outlines the Jest testing framework setup for the LocalPro Super App API. The testing infrastructure includes unit tests, integration tests, and comprehensive test utilities.

## Test Structure

```
tests/
├── setup.js                 # Global test setup and teardown
├── utils/
│   └── testUtils.js         # Test utilities and helpers
├── fixtures/
│   └── testData.js          # Test data fixtures
├── controllers/
│   ├── auth.test.js         # Authentication controller tests
│   └── marketplace.test.js  # Marketplace controller tests
├── models/
│   └── models.test.js       # Model validation tests
├── middleware/
│   └── middleware.test.js   # Middleware tests
└── routes/
    └── (route tests)        # Route-specific tests
```

## Configuration Files

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Setup Files**: `tests/setup.js`
- **Coverage**: Enabled with 70% threshold
- **Test Timeout**: 30 seconds
- **Test Patterns**: `tests/**/*.test.js`, `src/**/*.test.js`

### Test Setup (`tests/setup.js`)
- **Database**: In-memory MongoDB using `mongodb-memory-server`
- **Environment**: Test environment variables
- **Cleanup**: Automatic database cleanup between tests
- **Global Utilities**: Test helpers and mock functions

## Test Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --ci --coverage --watchAll=false",
  "test:unit": "jest --testPathPattern=tests/unit",
  "test:integration": "jest --testPathPattern=tests/integration",
  "test:e2e": "jest --testPathPattern=tests/e2e"
}
```

## Test Utilities

### TestUtils Class (`tests/utils/testUtils.js`)
Provides comprehensive testing utilities:

- **App Creation**: `createTestApp()` - Creates test app instance
- **Authentication**: `makeAuthenticatedRequest()` - Makes authenticated requests
- **User Creation**: `createTestUser()`, `createTestProvider()` - Creates test users
- **Service Creation**: `createTestService()` - Creates test services
- **Booking Creation**: `createTestBooking()` - Creates test bookings
- **Token Generation**: `generateToken()` - Generates JWT tokens
- **Data Cleanup**: `cleanupTestData()` - Cleans up test data
- **External Service Mocking**: `mockExternalServices()` - Mocks external APIs

### Test Fixtures (`tests/fixtures/testData.js`)
Contains predefined test data:

- **Users**: Client, provider, admin test users
- **Services**: Different service types (cleaning, plumbing, electrical)
- **Bookings**: Various booking states (pending, confirmed, completed)
- **Jobs**: Full-time and part-time job postings
- **Subscriptions**: Basic and premium subscription plans
- **Payments**: PayPal and PayMaya payment data
- **Reviews**: Positive, negative, and neutral reviews

## Test Categories

### 1. Controller Tests
- **Authentication**: Registration, login, profile management
- **Marketplace**: Service CRUD, booking management
- **Error Handling**: Invalid data, unauthorized access

### 2. Model Tests
- **Validation**: Required fields, data types, constraints
- **Relationships**: User-service-booking relationships
- **Methods**: Password comparison, token generation

### 3. Middleware Tests
- **Authentication**: Token validation, role-based access
- **Validation**: Input sanitization, error handling
- **Rate Limiting**: Request throttling (currently disabled)

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

## Test Coverage

The Jest configuration includes coverage reporting with:
- **Threshold**: 70% for branches, functions, lines, and statements
- **Reporters**: Text, LCOV, HTML
- **Exclusions**: Server.js, database.js, node_modules

## Mocking Strategy

### External Services
The test setup mocks external services to ensure:
- **Isolation**: Tests don't depend on external APIs
- **Speed**: Faster test execution
- **Reliability**: Consistent test results

Mocked services:
- **Twilio**: SMS and WhatsApp services
- **Email Service**: Email sending functionality
- **PayPal**: Payment processing
- **PayMaya**: Payment processing

### Database
- **In-Memory MongoDB**: Fast, isolated test database
- **Automatic Cleanup**: Fresh database state for each test
- **Connection Management**: Proper setup and teardown

## Best Practices

### Test Organization
1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the function/endpoint being tested
3. **Assert**: Verify the expected outcome

### Test Data Management
- Use fixtures for consistent test data
- Clean up data between tests
- Use realistic but minimal test data

### Error Testing
- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

### Performance
- Use in-memory database for speed
- Mock external services
- Keep tests focused and fast

## Example Test Structure

```javascript
describe('Feature Name', () => {
  let app, testUser, token;

  beforeAll(async () => {
    app = TestUtils.createTestApp();
    TestUtils.mockExternalServices();
  });

  beforeEach(async () => {
    await TestUtils.cleanupTestData();
    testUser = await TestUtils.createTestUser();
    token = TestUtils.generateToken(testUser._id);
  });

  afterAll(async () => {
    await TestUtils.cleanupTestData();
  });

  describe('Specific Functionality', () => {
    it('should handle success case', async () => {
      // Test implementation
    });

    it('should handle error case', async () => {
      // Test implementation
    });
  });
});
```

## Continuous Integration

The test setup is configured for CI/CD environments:
- **CI Mode**: `npm run test:ci` for automated testing
- **Coverage Reports**: Generated for code quality metrics
- **Exit Codes**: Proper exit codes for build success/failure

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure MongoDB is running for integration tests
2. **Port Conflicts**: Check for port conflicts in test environment
3. **Memory Issues**: Increase Node.js memory limit for large test suites
4. **Timeout Issues**: Adjust Jest timeout for slow operations

### Debug Commands
```bash
# Run specific test file
npm test -- tests/controllers/auth.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

## Future Enhancements

1. **E2E Testing**: Add end-to-end tests with real browser automation
2. **Performance Testing**: Add performance benchmarks
3. **Load Testing**: Add load testing for critical endpoints
4. **Visual Testing**: Add visual regression testing for UI components
5. **API Contract Testing**: Add contract testing for API changes

## Dependencies

### Testing Dependencies
- **jest**: Testing framework
- **supertest**: HTTP assertion library
- **mongodb-memory-server**: In-memory MongoDB for testing
- **@types/jest**: TypeScript definitions for Jest
- **@types/supertest**: TypeScript definitions for Supertest

### Development Dependencies
- **nodemon**: Development server with auto-restart
- **eslint**: Code linting and formatting

This testing framework provides a solid foundation for maintaining code quality and ensuring the reliability of the LocalPro Super App API.
