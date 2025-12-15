# Testing Guide

## Overview

This guide covers testing practices and strategies for the LocalPro Super App.

## Test Structure

```
src/__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── setup.js          # Test setup
```

## Testing Framework

- **Framework**: Jest
- **Assertions**: Jest assertions
- **HTTP Testing**: Supertest
- **Mocks**: Jest mocks

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run coverage
```

### Specific Tests

```bash
npm test -- userController.test.js
```

## Unit Tests

### Controller Tests

```javascript
const { getUserById } = require('../../controllers/userController');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('getUserById', () => {
  it('should return user when found', async () => {
    const mockUser = { _id: '123', name: 'John' };
    User.findById.mockResolvedValue(mockUser);

    const result = await getUserById('123');

    expect(result).toEqual(mockUser);
    expect(User.findById).toHaveBeenCalledWith('123');
  });

  it('should throw error when user not found', async () => {
    User.findById.mockResolvedValue(null);

    await expect(getUserById('123')).rejects.toThrow('User not found');
  });
});
```

### Service Tests

```javascript
const paymentService = require('../../services/paymentService');

describe('Payment Service', () => {
  it('should process payment successfully', async () => {
    const result = await paymentService.processPayment({
      amount: 100,
      method: 'paypal'
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });
});
```

## Integration Tests

### API Endpoint Tests

```javascript
const request = require('supertest');
const app = require('../../src/server');

describe('GET /api/users/:id', () => {
  it('should return user when authenticated', async () => {
    const token = 'valid-jwt-token';
    
    const response = await request(app)
      .get('/api/users/123')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    await request(app)
      .get('/api/users/123')
      .expect(401);
  });
});
```

### Database Tests

```javascript
const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create user successfully', async () => {
    const user = await User.create({
      phoneNumber: '+1234567890',
      roles: ['client']
    });

    expect(user._id).toBeDefined();
    expect(user.phoneNumber).toBe('+1234567890');
  });
});
```

## Test Setup

### Setup File

```javascript
// src/__tests__/setup.js
const mongoose = require('mongoose');

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_TEST_URI);
});

afterAll(async () => {
  // Clean up
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean database after each test
  await mongoose.connection.db.dropDatabase();
});
```

## Mocking

### External Services

```javascript
jest.mock('../../services/twilioService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true })
}));
```

### Database Models

```javascript
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn()
}));
```

## Test Coverage

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### View Coverage

```bash
npm run coverage
# Open coverage/lcov-report/index.html
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```javascript
// Good: Clean state
beforeEach(() => {
  jest.clearAllMocks();
});

// Bad: Tests depend on each other
```

### 2. Descriptive Test Names

```javascript
// Good
it('should return 404 when user does not exist', async () => { });

// Bad
it('should work', async () => { });
```

### 3. Test One Thing

```javascript
// Good: One assertion per test
it('should return user with correct id', async () => {
  const user = await getUserById('123');
  expect(user._id).toBe('123');
});

// Bad: Multiple unrelated assertions
it('should get user and update profile', async () => {
  // Too many things
});
```

### 4. Use Test Data

```javascript
const testUser = {
  phoneNumber: '+1234567890',
  roles: ['client']
};
```

## Common Test Patterns

### Testing Async Functions

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```javascript
it('should throw error on invalid input', async () => {
  await expect(functionWithError()).rejects.toThrow('Error message');
});
```

### Testing HTTP Requests

```javascript
it('should return 200 on success', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .expect(200);
  
  expect(response.body.success).toBe(true);
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled runs

## Next Steps

- Review [Coding Standards](./coding-standards.md)
- Check [Contributing Guidelines](./contributing.md)
- Read [Debugging Guide](./debugging.md)

