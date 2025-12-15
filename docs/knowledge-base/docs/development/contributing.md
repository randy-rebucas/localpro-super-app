# Contributing Guidelines

## Overview

Thank you for contributing to LocalPro Super App! This guide will help you get started.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/localpro-super-app.git
cd localpro-super-app
```

### 2. Create Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes

- Follow [Coding Standards](./coding-standards.md)
- Write tests for new features
- Update documentation

### 4. Test Changes

```bash
npm test
npm run lint
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [commit message format](./coding-standards.md#git-commit-messages).

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub.

## Pull Request Process

### Before Submitting

- [ ] Code follows style guide
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Linting passes

### PR Description

Include:
- **What**: What changes were made
- **Why**: Why these changes were needed
- **How**: How the changes work
- **Testing**: How to test the changes

### Review Process

1. Automated checks run
2. Code review by maintainers
3. Address feedback
4. Merge when approved

## Code Style

Follow the [Coding Standards](./coding-standards.md).

## Testing

- Write tests for new features
- Ensure all tests pass
- Maintain or improve test coverage

## Documentation

- Update relevant documentation
- Add JSDoc comments for new functions
- Update API documentation if needed

## Feature Requests

### Before Requesting

1. Check if feature already exists
2. Check open issues
3. Consider if it fits the project scope

### Submitting Request

Create an issue with:
- **Description**: What the feature should do
- **Use Case**: Why it's needed
- **Proposed Solution**: How it could work

## Bug Reports

### Before Reporting

1. Check if bug already reported
2. Try to reproduce
3. Check recent changes

### Submitting Report

Include:
- **Description**: What happened
- **Steps to Reproduce**: How to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happened
- **Environment**: Node version, OS, etc.
- **Screenshots**: If applicable

## Questions?

- Check [Documentation](../index.md)
- Open an issue for discussion
- Contact maintainers

## Code of Conduct

- Be respectful
- Be constructive
- Be patient
- Help others

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Next Steps

- Read [Coding Standards](./coding-standards.md)
- Review [Testing Guide](./testing.md)
- Check [Development Setup](../getting-started/development-setup.md)

