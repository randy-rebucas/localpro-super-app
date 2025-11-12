# Development Guide

## Overview
This guide helps developers understand the development workflow, coding standards, and best practices for the LocalPro Super App.

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd localpro-super-app

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Configure environment variables
# Edit .env with your settings

# Run setup
npm run setup

# Start development server
npm run dev
```

## Project Structure

```
src/
├── server.js              # Application entry point
├── config/                # Configuration files
├── routes/                # Route definitions
├── controllers/           # Business logic
├── models/                # Database models
├── middleware/            # Custom middleware
├── services/              # External services
├── utils/                 # Utility functions
└── __tests__/             # Test files
```

## Coding Standards

### Naming Conventions

- **Files**: camelCase (e.g., `userController.js`)
- **Variables**: camelCase (e.g., `userName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Routes**: kebab-case (e.g., `/api/user-management`)

### Code Style

- Use ESLint for code formatting
- Follow existing code patterns
- Use async/await for async operations
- Handle errors properly
- Add comments for complex logic

### File Organization

```javascript
// Route file structure
const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const controller = require('../controllers/controller');

const router = express.Router();

// Public routes first
router.get('/', controller.getPublic);

// Protected routes
router.use(auth);
router.get('/protected', controller.getProtected);

// Role-specific routes
router.post('/admin', authorize('admin'), controller.adminAction);

module.exports = router;
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/new-feature
```

### 2. Make Changes
- Follow coding standards
- Write tests
- Update documentation

### 3. Test Changes
```bash
# Run tests
npm test

# Run specific test
npm test -- user.test.js

# Watch mode
npm run test:watch
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and Create PR
```bash
git push origin feature/new-feature
# Create pull request
```

## Adding New Features

### 1. Create Model
```javascript
// src/models/NewFeature.js
const mongoose = require('mongoose');

const newFeatureSchema = new mongoose.Schema({
  // Schema definition
}, {
  timestamps: true
});

module.exports = mongoose.model('NewFeature', newFeatureSchema);
```

### 2. Create Controller
```javascript
// src/controllers/newFeatureController.js
const NewFeature = require('../models/NewFeature');

exports.getFeatures = async (req, res) => {
  try {
    const features = await NewFeature.find();
    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### 3. Create Routes
```javascript
// src/routes/newFeature.js
const express = require('express');
const { auth } = require('../middleware/auth');
const controller = require('../controllers/newFeatureController');

const router = express.Router();
router.use(auth);

router.get('/', controller.getFeatures);

module.exports = router;
```

### 4. Register Routes
```javascript
// src/server.js
const newFeatureRoutes = require('./routes/newFeature');
app.use('/api/new-feature', newFeatureRoutes);
```

### 5. Update Documentation
- Add feature documentation in `docs/features/`
- Update API endpoints summary
- Add use cases if needed

## Testing

### Unit Tests
```javascript
// src/__tests__/unit/controllers/userController.test.js
describe('User Controller', () => {
  test('should get user', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```javascript
// src/__tests__/integration/routes/auth.test.js
describe('Auth Routes', () => {
  test('POST /api/auth/send-code', async () => {
    // Test implementation
  });
});
```

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage
npm test -- --coverage
```

## Database Migrations

### Creating Indexes
```bash
node scripts/create-database-indexes.js
```

### Data Migrations
Create migration scripts in `scripts/` directory:
```javascript
// scripts/migrate-data.js
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  // Migration logic
  await mongoose.disconnect();
}

migrate();
```

## API Development

### Request Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateRequest = [
  body('email').isEmail(),
  body('phoneNumber').isMobilePhone(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Error in operation', { error, context });
  res.status(500).json({
    success: false,
    error: {
      code: 'OPERATION_ERROR',
      message: 'Operation failed',
      details: error.message
    }
  });
}
```

### Response Formatting
```javascript
// Success response
res.json({
  success: true,
  data: result,
  message: 'Operation successful'
});

// Error response
res.status(400).json({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error message'
  }
});
```

## Middleware Development

### Creating Custom Middleware
```javascript
// src/middleware/customMiddleware.js
const customMiddleware = (req, res, next) => {
  // Middleware logic
  next();
};

module.exports = customMiddleware;
```

### Using Middleware
```javascript
// In route file
const customMiddleware = require('../middleware/customMiddleware');
router.use(customMiddleware);
```

## Service Development

### Creating Services
```javascript
// src/services/customService.js
class CustomService {
  async performAction(data) {
    // Service logic
    return result;
  }
}

module.exports = new CustomService();
```

### Using Services
```javascript
// In controller
const customService = require('../services/customService');
const result = await customService.performAction(data);
```

## Logging

### Using Logger
```javascript
const logger = require('../config/logger');

// Info log
logger.info('Operation completed', { userId, action });

// Error log
logger.error('Operation failed', { error, context });

// Debug log
logger.debug('Debug information', { data });
```

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Security considerations addressed
- [ ] Performance optimized
- [ ] No console.log statements
- [ ] Environment variables used (no hardcoded values)

## Git Workflow

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### Branch Naming
- `feature/feature-name`
- `fix/bug-description`
- `docs/documentation-update`
- `refactor/refactoring-description`

## Debugging

### Using Debugger
```bash
# VS Code: Set breakpoints and use debugger
# Or use node --inspect
node --inspect src/server.js
```

### Console Debugging
```javascript
// Use logger instead of console.log
logger.debug('Debug info', { data });
```

### Database Debugging
```javascript
// Enable Mongoose debug
mongoose.set('debug', true);
```

## Performance Optimization

### Database Queries
- Use indexes
- Limit fields returned
- Use pagination
- Avoid N+1 queries

### Caching
- Cache frequently accessed data
- Use Redis for distributed caching
- Implement cache invalidation

### Code Optimization
- Avoid blocking operations
- Use async/await properly
- Optimize loops
- Minimize database calls

## Security Best Practices

- Never commit secrets
- Validate all inputs
- Use parameterized queries (Mongoose handles this)
- Implement rate limiting
- Use HTTPS in production
- Sanitize user inputs
- Implement proper authentication
- Use role-based authorization

## Related Documentation
- [Architecture](ARCHITECTURE.md)
- [Best Practices](BEST_PRACTICES.md)
- [API Response Formats](API_RESPONSE_FORMATS.md)
- [Configuration Guide](CONFIGURATION.md)

