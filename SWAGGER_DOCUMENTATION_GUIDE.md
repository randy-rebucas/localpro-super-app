# Swagger API Documentation Guide

This document explains how to access and use the Swagger API documentation for the LocalPro Super App API.

## Accessing the Documentation

Once the server is running, you can access the Swagger UI at:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **Swagger JSON**: `http://localhost:5000/api-docs.json`

## Current Documentation Status

The Swagger documentation has been set up with:
- ✅ Base OpenAPI 3.0 configuration
- ✅ Authentication schemas (Bearer Token, API Key/Secret)
- ✅ Common response schemas (Success, Error, Paginated)
- ✅ Authentication routes documented
- ✅ Marketplace routes (partially documented)
- ✅ Health check and root endpoint documented

## Adding Documentation to Routes

To add Swagger documentation to a route, use JSDoc comments with the `@swagger` tag:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []  # or [] for public endpoints
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/your-endpoint', handler);
```

## Common Patterns

### Public Endpoint
```javascript
/**
 * @swagger
 * /api/public:
 *   get:
 *     summary: Public endpoint
 *     tags: [Public]
 *     security: []
 *     responses:
 *       200:
 *         description: Success
 */
```

### Authenticated Endpoint
```javascript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Protected endpoint
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### Endpoint with Request Body
```javascript
/**
 * @swagger
 * /api/create:
 *   post:
 *     summary: Create resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
```

## Next Steps

To complete the documentation:
1. Add Swagger JSDoc comments to each route file
2. Document request/response schemas in the swagger.js config
3. Test each endpoint in Swagger UI
4. Verify all endpoints are documented
