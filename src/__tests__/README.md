# Test Suite Documentation

This directory contains all test files for the LocalPro Super App.

## Test Structure

```
src/__tests__/
├── setup.js              # Jest setup configuration
├── unit/                 # Unit tests (isolated component tests)
├── integration/          # Integration tests (API endpoints, database)
└── README.md            # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

### Run tests in CI mode
```bash
npm run test:ci
```

## Writing Tests

### Unit Test Example
```javascript
// src/__tests__/unit/services/example.test.js
const exampleService = require('../../../services/exampleService');

describe('ExampleService', () => {
  test('should perform some operation', () => {
    const result = exampleService.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example
```javascript
// src/__tests__/integration/routes/auth.test.js
const request = require('supertest');
const app = require('../../../server');

describe('POST /api/auth/send-code', () => {
  test('should return 400 if phone number is missing', async () => {
    const response = await request(app)
      .post('/api/auth/send-code')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory after running tests.

Coverage thresholds (minimum):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertions
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Use mocks for external dependencies (databases, APIs, etc.)
5. **Coverage**: Aim for high coverage but focus on critical paths first

## Environment Variables for Testing

Set these in your test environment:
- `NODE_ENV=test`
- `MONGODB_URI` (test database)
- `JWT_SECRET` (test secret)

## Notes

- Tests run in the `test` environment by default
- Database connections should use a test database
- External API calls should be mocked
- File uploads should use test storage

