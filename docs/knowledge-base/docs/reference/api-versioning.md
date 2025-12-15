# API Versioning

## Overview

This guide covers API versioning strategy for the LocalPro Super App.

## Current Version

Currently using **unversioned API** (`/api`). All endpoints are at the latest version.

## Versioning Strategy

### URL Versioning (Recommended)

```
/api/v1/services
/api/v2/services
```

### Header Versioning (Alternative)

```http
Accept: application/vnd.localpro.v1+json
```

## When to Version

Version the API when:
- Breaking changes to existing endpoints
- Removing endpoints
- Changing response formats
- Changing authentication

Don't version for:
- Adding new endpoints
- Adding optional fields
- Bug fixes
- Performance improvements

## Versioning Implementation

### Route Versioning

```javascript
// v1 routes
app.use('/api/v1', v1Routes);

// v2 routes
app.use('/api/v2', v2Routes);

// Latest (defaults to current version)
app.use('/api', currentRoutes);
```

### Backward Compatibility

Maintain backward compatibility:
- Keep old versions active
- Deprecate before removing
- Provide migration guides

## Deprecation Process

### 1. Announce Deprecation

```http
Deprecation: true
Sunset: 2026-12-31
Link: <https://docs.localpro.com/migration>
```

### 2. Deprecation Period

- Minimum 6 months
- Provide migration guide
- Support both versions

### 3. Removal

- Remove after deprecation period
- Notify users in advance
- Provide alternative endpoints

## Migration Guide

When migrating between versions:

1. Review changelog
2. Test in staging
3. Update client code
4. Deploy gradually
5. Monitor for issues

## Best Practices

1. **Version early** - Before breaking changes
2. **Document changes** - Clear changelog
3. **Support multiple versions** - During transition
4. **Deprecate properly** - Give notice
5. **Monitor usage** - Track version adoption

## Future Plans

API versioning will be implemented when:
- Breaking changes are needed
- Major refactoring occurs
- Significant feature additions

## Related Documentation

- [API Design](../architecture/api-design.md)
- [API Overview](../api/overview.md)

