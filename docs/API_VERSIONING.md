# API Versioning Guide

This document outlines the API versioning strategy for LocalPro Super App.

## Current Status

The API currently uses unversioned routes (e.g., `/api/auth`, `/api/marketplace`). 

## Future Versioning Strategy

When implementing versioning, the recommended approach is:

### URL Path Versioning

```
/api/v1/auth          # Version 1
/api/v2/auth          # Version 2 (when needed)
```

### Implementation Pattern

```javascript
// Current routes (unversioned)
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Future versioned routes
app.use('/api/v1/auth', v1AuthRoutes);
app.use('/api/v1/marketplace', v1MarketplaceRoutes);

// Keep v1 as default for backwards compatibility
app.use('/api/auth', v1AuthRoutes); // Redirects to v1
```

## Migration Path

When ready to implement versioning:

1. **Create version folders:**
   ```
   src/
     routes/
       v1/
         auth.js
         marketplace.js
         ...
       v2/
         auth.js
         ...
   ```

2. **Update server.js:**
   ```javascript
   // Version 1 routes
   const v1AuthRoutes = require('./routes/v1/auth');
   const v1MarketplaceRoutes = require('./routes/v1/marketplace');
   
   app.use('/api/v1/auth', v1AuthRoutes);
   app.use('/api/v1/marketplace', v1MarketplaceRoutes);
   
   // Backwards compatibility - redirect /api/* to /api/v1/*
   app.use('/api/auth', v1AuthRoutes);
   app.use('/api/marketplace', v1MarketplaceRoutes);
   ```

3. **Version Header (Alternative):**
   ```javascript
   // Accept header versioning
   app.use((req, res, next) => {
     const apiVersion = req.headers['api-version'] || 'v1';
     req.apiVersion = apiVersion;
     next();
   });
   ```

## When to Create a New Version

- Breaking changes to existing endpoints
- Major feature additions that affect core functionality
- Changes to response formats that aren't backwards compatible
- Security-related changes that require different authentication

## Version Lifecycle

- **v1**: Current production API
- **v2**: Future version (when needed)
- **Deprecation**: Maintain at least 2 versions at a time
- **Sunset**: Remove deprecated versions after 6-12 months notice

## Best Practices

1. **Document changes** in changelog
2. **Maintain backwards compatibility** when possible
3. **Provide migration guides** for breaking changes
4. **Use semantic versioning** principles
5. **Monitor usage** of old versions
6. **Give advance notice** before deprecating versions

---

**Note:** API versioning is prepared but not yet implemented. Current API endpoints remain unversioned for simplicity.

