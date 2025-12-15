# Coding Standards

## Overview

This document outlines the coding standards and best practices for the LocalPro Super App codebase.

## General Principles

1. **Consistency** - Follow established patterns
2. **Readability** - Code should be self-documenting
3. **Maintainability** - Write code that's easy to modify
4. **Performance** - Optimize for performance when needed
5. **Security** - Always consider security implications

## Code Style

### JavaScript/Node.js

- Use **ES6+** features
- Use **async/await** instead of callbacks
- Use **const** and **let**, avoid **var**
- Use **arrow functions** for callbacks
- Use **template literals** for strings

### Naming Conventions

```javascript
// Variables and functions: camelCase
const userName = 'John';
function getUserById(id) { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.localpro.com';

// Classes: PascalCase
class UserController { }

// Files: camelCase
userController.js
marketplaceService.js
```

### File Structure

```javascript
// 1. Imports (external first, then internal)
const express = require('express');
const User = require('../models/User');

// 2. Constants
const MAX_LIMIT = 100;

// 3. Functions/Classes
const getUser = async (id) => { };

// 4. Exports
module.exports = { getUser };
```

## Error Handling

### Always Handle Errors

```javascript
// Good
try {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  logger.error('Error fetching user:', error);
  throw error;
}

// Bad
const user = await User.findById(id);
return user;
```

### Use Custom Error Classes

```javascript
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
```

## Database Queries

### Use Indexes

```javascript
// Good: Uses index
User.find({ phoneNumber: phoneNumber });

// Bad: Full collection scan
User.find({ 'profile.firstName': firstName });
```

### Use Projections

```javascript
// Good: Only select needed fields
User.find({}).select('firstName lastName email');

// Bad: Select all fields
User.find({});
```

### Use Pagination

```javascript
// Good: Always paginate
const users = await User.find({})
  .limit(limit)
  .skip((page - 1) * limit);

// Bad: No pagination
const users = await User.find({});
```

## API Responses

### Standardized Responses

```javascript
// Success
res.status(200).json({
  success: true,
  data: result,
  message: 'Operation successful'
});

// Error
res.status(400).json({
  success: false,
  message: 'Validation failed',
  error: 'Invalid input',
  code: 'VALIDATION_ERROR'
});
```

## Security

### Input Validation

```javascript
// Always validate input
const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    details: error.details
  });
}
```

### Sanitize User Input

```javascript
const DOMPurify = require('isomorphic-dompurify');
const sanitized = DOMPurify.sanitize(userInput);
```

### Never Expose Sensitive Data

```javascript
// Good: Exclude password
User.findById(id).select('-password');

// Bad: Include password
User.findById(id);
```

## Testing

### Write Tests

```javascript
describe('User Controller', () => {
  it('should get user by id', async () => {
    const user = await getUserById('123');
    expect(user).toBeDefined();
    expect(user._id).toBe('123');
  });
});
```

### Test Coverage

- Aim for 80%+ coverage
- Test happy paths
- Test error cases
- Test edge cases

## Documentation

### Code Comments

```javascript
/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<User>} User object
 * @throws {Error} If user not found
 */
const getUserById = async (id) => {
  // Implementation
};
```

### API Documentation

Use JSDoc for API endpoints:

```javascript
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 * @param   {string} id - User ID
 * @returns {User} User object
 */
router.get('/:id', getUserById);
```

## Git Commit Messages

### Format

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Examples

```
feat(marketplace): add service search functionality

fix(auth): handle token expiration properly

docs(api): update authentication documentation
```

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests written and passing
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Environment variables used correctly

## Tools

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

Use Prettier or follow ESLint rules.

## Next Steps

- Review [Testing Guide](./testing.md)
- Check [Contributing Guidelines](./contributing.md)
- Read [Debugging Guide](./debugging.md)

