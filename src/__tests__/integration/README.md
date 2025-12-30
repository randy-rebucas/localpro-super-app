# Integration Tests

This directory contains integration tests that test the interaction between multiple components of the application.

## Test Structure

Integration tests should:
- Test real API endpoints (using supertest or similar)
- Test database interactions
- Test service integrations
- Test middleware chains
- Use a test database (not production)

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run a specific integration test
npm test -- src/__tests__/integration/your-test.test.js
```

## Setup

Integration tests should:
1. Set up test database connections
2. Seed test data if needed
3. Clean up after tests
4. Use environment variables for test configuration

## Example Test Structure

```javascript
const request = require('supertest');
const app = require('../../../server');
const mongoose = require('mongoose');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
  });

  afterAll(async () => {
    // Clean up and disconnect
  });

  beforeEach(async () => {
    // Set up test data
  });

  afterEach(async () => {
    // Clean up test data
  });

  test('should create and retrieve a resource', async () => {
    // Test implementation
  });
});
```

