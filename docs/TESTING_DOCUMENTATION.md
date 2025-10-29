# LocalPro Super App - Unit Testing Documentation

## Overview

This document provides comprehensive documentation for the unit testing suite of the LocalPro Super App. The testing framework covers critical business logic including authentication, authorization, payment processing, user management, and data validation.

## Test Structure

```
tests/
├── setup.js                    # Test environment setup
├── controllers/
│   ├── authController.test.js   # Authentication controller tests
│   └── userManagement.test.js  # User management controller tests
├── middleware/
│   ├── auth.test.js            # Basic authentication middleware tests
│   └── authorize.test.js       # Advanced authorization middleware tests
├── services/
│   └── payment.test.js         # Payment processing service tests
├── utils/
│   └── validation.test.js      # Data validation utility tests
└── fixtures/
    └── testData.js             # Test data fixtures
```

## Test Categories

### 1. Authentication and Authorization Tests

#### Authentication Middleware (`tests/middleware/auth.test.js`)
- **Token Validation**: Tests for JWT token verification
- **User Authentication**: Tests for user lookup and validation
- **Error Handling**: Tests for invalid tokens and missing users
- **Security**: Tests for token format validation

#### Advanced Authorization (`tests/middleware/authorize.test.js`)
- **Role-based Access Control**: Tests for different user roles
- **Permission Management**: Tests for granular permissions
- **Agency Management**: Tests for agency-specific access control
- **Self-access**: Tests for users accessing their own data
- **Cross-agency Restrictions**: Tests for agency boundary enforcement

#### Authentication Controller (`tests/controllers/authController.test.js`)
- **Token Generation**: Tests for JWT and refresh token creation
- **Phone Number Validation**: Tests for international phone format validation
- **Verification Code Handling**: Tests for SMS verification codes
- **User Registration**: Tests for new user creation
- **User Login**: Tests for existing user authentication
- **Refresh Token Management**: Tests for token refresh functionality
- **Logout**: Tests for session termination

### 2. Payment Processing Tests

#### Payment Services (`tests/services/payment.test.js`)
- **PayPal Integration**: Tests for order creation, capture, and refunds
- **PayMaya Integration**: Tests for checkout creation and webhook verification
- **Subscription Management**: Tests for recurring payment subscriptions
- **Payment Validation**: Tests for amount, currency, and reference ID validation
- **Error Handling**: Tests for API failures and network issues
- **Security**: Tests for webhook signature verification

### 3. User Management Tests

#### User Management Controller (`tests/controllers/userManagement.test.js`)
- **User CRUD Operations**: Tests for create, read, update, delete operations
- **User Filtering**: Tests for role-based and search filtering
- **Pagination**: Tests for large dataset handling
- **Role Management**: Tests for role transitions and validations
- **Agency Management**: Tests for agency assignments and restrictions
- **Status Management**: Tests for user activation and verification
- **Avatar Upload**: Tests for profile image management
- **Data Validation**: Tests for user data integrity

### 4. Data Validation Tests

#### Validation Utilities (`tests/utils/validation.test.js`)
- **Phone Number Validation**: Tests for international format compliance
- **Email Validation**: Tests for RFC-compliant email formats
- **Service Validation**: Tests for marketplace service data
- **Booking Validation**: Tests for appointment scheduling data
- **Product Validation**: Tests for inventory management data
- **Loan Application Validation**: Tests for financial application data
- **ObjectId Validation**: Tests for MongoDB ObjectId format
- **Middleware Integration**: Tests for validation middleware

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
```

### Test Setup (`tests/setup.js`)
- **MongoDB Memory Server**: In-memory database for testing
- **Environment Variables**: Test-specific configuration
- **Global Utilities**: Helper functions for test data creation
- **Database Cleanup**: Automatic cleanup between tests

## Running Tests

### Using npm Scripts
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Using the Test Runner
```bash
# Run all tests
node test-runner.js all

# Run specific test categories
node test-runner.js auth
node test-runner.js payment
node test-runner.js user
node test-runner.js validation

# Run with options
node test-runner.js auth --coverage
node test-runner.js payment --watch
node test-runner.js user --verbose

# Validate test environment
node test-runner.js validate

# Generate coverage report
node test-runner.js coverage
```

## Test Coverage

The test suite aims for comprehensive coverage of critical business logic:

- **Authentication & Authorization**: 95%+ coverage
- **Payment Processing**: 90%+ coverage
- **User Management**: 85%+ coverage
- **Data Validation**: 95%+ coverage

### Coverage Reports
- **HTML Report**: `coverage/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **Text Report**: Console output during test runs

## Mocking Strategy

### External Dependencies
- **MongoDB**: In-memory database using mongodb-memory-server
- **JWT**: Mocked for token generation and verification
- **Payment APIs**: Mocked PayPal and PayMaya SDKs
- **Email Service**: Mocked Twilio and email services
- **File Upload**: Mocked Cloudinary service

### Internal Dependencies
- **Models**: Mocked Mongoose models
- **Services**: Mocked service layer functions
- **Middleware**: Mocked Express middleware
- **Utilities**: Mocked helper functions

## Test Data Management

### Test Fixtures (`tests/fixtures/testData.js`)
```javascript
const testData = {
  users: {
    client: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      role: 'client'
    },
    provider: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phoneNumber: '+1234567891',
      role: 'provider'
    }
  },
  services: {
    cleaning: {
      title: 'House Cleaning Service',
      description: 'Professional cleaning service',
      category: 'cleaning',
      pricing: { type: 'hourly', basePrice: 25.00 }
    }
  }
};
```

### Dynamic Test Data
- **Unique Identifiers**: Generated for each test run
- **Realistic Data**: Mimics production data patterns
- **Edge Cases**: Includes boundary conditions and error scenarios

## Best Practices

### Test Organization
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Test names explain the scenario
3. **Single Responsibility**: Each test focuses on one behavior
4. **Independent Tests**: Tests don't depend on each other

### Mocking Guidelines
1. **Mock External Dependencies**: Always mock external services
2. **Verify Interactions**: Assert mock method calls
3. **Reset Mocks**: Clear mocks between tests
4. **Realistic Responses**: Mock responses match real API behavior

### Error Testing
1. **Happy Path**: Test successful operations
2. **Error Cases**: Test failure scenarios
3. **Edge Cases**: Test boundary conditions
4. **Validation Errors**: Test input validation

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v1
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Errors
```bash
# Ensure mongodb-memory-server is installed
npm install --save-dev mongodb-memory-server

# Check test setup configuration
node test-runner.js validate
```

#### Mock Issues
```bash
# Clear Jest cache
npx jest --clearCache

# Reset mocks
jest.clearAllMocks()
```

#### Coverage Issues
```bash
# Generate fresh coverage report
npm run test:coverage

# Check coverage thresholds
node test-runner.js coverage
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=jest* npm test

# Run specific test with verbose output
npx jest tests/auth.test.js --verbose
```

## Performance Considerations

### Test Execution Time
- **Unit Tests**: < 5 seconds total
- **Integration Tests**: < 30 seconds total
- **E2E Tests**: < 2 minutes total

### Memory Usage
- **MongoDB Memory Server**: ~100MB per test suite
- **Mock Objects**: Minimal memory footprint
- **Test Data**: Cleaned up after each test

### Parallel Execution
- **Jest Workers**: Configurable worker count
- **Test Isolation**: Independent test execution
- **Resource Cleanup**: Automatic cleanup between tests

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: UI component testing
2. **Load Testing**: Performance under stress
3. **Security Testing**: Vulnerability scanning
4. **API Contract Testing**: Service integration validation

### Test Automation
1. **Scheduled Runs**: Daily test execution
2. **Performance Monitoring**: Test execution time tracking
3. **Coverage Tracking**: Historical coverage trends
4. **Alert System**: Test failure notifications

## Contributing

### Adding New Tests
1. **Follow Naming Convention**: `*.test.js` suffix
2. **Use Test Utilities**: Leverage global test helpers
3. **Mock Dependencies**: Mock external services
4. **Document Test Cases**: Add JSDoc comments
5. **Update Coverage**: Ensure adequate coverage

### Test Review Process
1. **Code Review**: All tests require review
2. **Coverage Check**: Maintain coverage thresholds
3. **Performance Check**: Ensure tests run efficiently
4. **Documentation Update**: Update this documentation

---

For questions or issues with the testing suite, please refer to the project documentation or contact the development team.
