# Integration Tests

This directory contains integration tests that test multiple components working together.

---

## 📁 Test Structure

Integration tests typically test:
- API endpoints with database interactions
- Multi-service workflows
- End-to-end request flows
- Authentication and authorization flows
- Complex business logic

---

## 🧪 Example Integration Test

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

describe('Integration: User Registration Flow', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/localpro-test');
  });

  afterAll(async () => {
    // Clean up
    await mongoose.connection.close();
  });

  it('should complete full user registration flow', async () => {
    // 1. Send verification code
    const sendCodeResponse = await request(app)
      .post('/api/auth/send-code')
      .send({ phoneNumber: '+1234567890' });
    
    expect(sendCodeResponse.status).toBe(200);
    
    // 2. Verify code (with mocked verification)
    // ... continue flow
  });
});
```

---

## 📝 Guidelines

1. **Test Real Flows** - Test complete user journeys
2. **Use Test Database** - Always use test database
3. **Clean Up** - Remove test data after tests
4. **Mock External Services** - Mock Twilio, PayPal, etc.
5. **Test Error Paths** - Test failure scenarios too

---

## 🚀 Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test -- src/__tests__/integration/auth-flow.test.js
```

---

**Note:** Integration tests require MongoDB to be running.

