# Testing Guide

This guide provides instructions for running and understanding the test suite.

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests Without Infrastructure
```bash
npm run test:no-infra
```

### Check Test Environment Setup
```bash
npm run test:setup
```

---

## 📋 Test Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Watch mode for development |
| `npm run test:utils` | Run only utility tests |
| `npm run test:middleware` | Run only middleware tests |
| `npm run test:no-infra` | Run tests that don't need infrastructure |
| `npm run test:quick` | Quick test run (utils + middleware) |
| `npm run test:setup` | Check test environment setup |

---

## 📊 Test Structure

### Test Directories
```
src/__tests__/
├── config/          # Configuration tests
├── middleware/      # Middleware tests
├── routes/          # Route integration tests
├── services/        # Service layer tests
├── setup/           # Jest setup/teardown
└── utils/           # Utility function tests
```

### Test Files
- **Input Validation:** `utils/inputValidation.test.js` (26 tests)
- **Request ID:** `middleware/requestId.test.js` (6 tests)
- **Rate Limiter:** `middleware/rateLimiter.test.js` (5 tests)
- **Error Handler:** `middleware/errorHandler.test.js` (4 tests)
- **Auth Routes:** `routes/auth.test.js` (11 tests)
- **Cache Service:** `services/cacheService.test.js` (13 tests)
- **Logger:** `config/logger.test.js` (3 tests)
- **Helpers:** `utils/helpers.test.js` (5 tests)
- **Response Helper:** `utils/responseHelper.test.js` (2 tests)

**Total: 75 tests across 9 test suites**

---

## 🔧 Test Configuration

### Environment Variables
Tests automatically detect `NODE_ENV=test` and adjust behavior:
- Rate limiting disabled
- Database logging disabled
- Redis uses mock client
- Timers disabled

### Coverage Thresholds
- **Global:** 18% statements, 2% branches, 5% functions, 18% lines
- **Input Validation:** 75% (maintained ✅)
- **Rate Limiter:** 0% (tested via integration)

### Test Timeout
- Default: 30 seconds
- Can be adjusted per test: `jest.setTimeout(60000)`

---

## 🏃 Running Tests

### Full Test Suite
```bash
npm test
# Runs all 75 tests with coverage report
```

### Specific Test Files
```bash
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=utils
```

### Watch Mode
```bash
npm run test:watch
# Watches for file changes and re-runs tests
```

### Without Coverage
```bash
npm test -- --no-coverage
```

### With Verbose Output
```bash
npm test -- --verbose
```

---

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm test -- src/__tests__/utils/inputValidation.test.js
```

### Run Single Test Case
```bash
npm test -- -t "should validate correct ObjectId"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 📈 Coverage Reports

### View Coverage
After running `npm test`, coverage reports are generated:
- **Text:** Displayed in terminal
- **HTML:** `coverage/lcov-report/index.html`
- **LCOV:** `coverage/lcov.info`

### Open HTML Report
```bash
# On macOS
open coverage/lcov-report/index.html

# On Windows
start coverage/lcov-report/index.html

# On Linux
xdg-open coverage/lcov-report/index.html
```

---

## ⚙️ Test Environment Setup

### Required Services (Optional)
Tests handle missing services gracefully:

**MongoDB:**
- Used for integration tests
- Falls back gracefully if unavailable
- Check status: `npm run test:setup`

**Redis:**
- Disabled by default in tests
- Uses mock client when needed
- No connection required

### Environment Variables
Tests use default test values, but you can override:
```bash
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27017/localpro-test
REDIS_ENABLED=false  # Default in test mode
```

---

## ✅ Expected Test Results

### Successful Run
```
Test Suites: 9 passed, 9 total
Tests:       75 passed, 75 total
Snapshots:   0 total
Time:        ~14s
```

### Coverage Summary
```
All files | 18.87 | 3.58 | 5.63 | 19.4
```

---

## 🎯 Best Practices

### Writing Tests
1. **Use descriptive test names:** "should validate correct ObjectId"
2. **Test one thing per test:** Keep tests focused
3. **Use setup/teardown:** Clean up resources
4. **Mock external services:** Don't depend on real APIs
5. **Test edge cases:** Invalid inputs, errors, boundaries

### Test Organization
1. Group related tests in `describe` blocks
2. Use `beforeEach`/`afterEach` for setup
3. Use `beforeAll`/`afterAll` for expensive operations
4. Keep tests independent (no shared state)

### Performance
1. Use `test:no-infra` for fast feedback during development
2. Run full suite before committing
3. Use watch mode during active development
4. Parallel execution is enabled by default

---

## 🔍 Troubleshooting

### Tests Hang
- Check for open handles: `npm test -- --detectOpenHandles`
- Ensure `forceExit` is enabled (default in test mode)
- Check for unclosed timers or connections

### Connection Errors
- MongoDB/Redis errors are expected if services aren't running
- Tests handle this gracefully
- Use `test:no-infra` to skip infrastructure-dependent tests

### Coverage Issues
- Coverage thresholds are set to realistic values
- Increase gradually as tests are added
- Focus on critical paths first

### Import Errors
- Ensure `NODE_ENV=test` is set
- Check Jest configuration in `jest.config.js`
- Verify module paths in test files

---

## 📚 Additional Resources

- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Supertest Documentation:** https://github.com/visionmedia/supertest
- **Test Improvement Summary:** See `TEST_IMPROVEMENTS_COMPLETE.md`

---

**Last Updated:** January 2025  
**Test Suite Version:** 1.0.0

