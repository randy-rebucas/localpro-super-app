# LocalPro Super App API Documentation Guide

## Overview

This comprehensive guide covers the Swagger/OpenAPI documentation setup for the LocalPro Super App API. The platform provides a unified API for connecting local service providers with customers, featuring marketplace services, learning academy, equipment rentals, job board, and more.

## Accessing the Documentation

### Swagger UI
Once the server is running, access the interactive API documentation at:
- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://localpro-super-app.onrender.com/api-docs`

### Raw OpenAPI Specification
- **JSON Format**: `http://localhost:5000/api-docs.json`
- **YAML Format**: `http://localhost:5000/api-docs.yaml`

## API Architecture

### Base Information
- **Title**: LocalPro Super App API
- **Version**: 1.0.0
- **OpenAPI Version**: 3.0.0
- **Contact**: api-support@localpro.asia
- **License**: Proprietary

### Core Features
The API supports a comprehensive platform with:
- 🔐 **Authentication**: JWT, API Key/Secret, OAuth2
- 🏪 **Marketplace**: Service bookings and provider management
- 🎓 **Academy**: Courses, certifications, and learning
- 🛠️ **Supplies**: Equipment and supplies marketplace
- 💰 **Finance**: Payments, transactions, and financial management
- 💼 **Jobs**: Employment opportunities and job board
- 🏢 **Agencies**: Multi-provider agency management
- 💬 **Communication**: Real-time messaging and notifications
- 📊 **Analytics**: Insights and reporting
- 🛡️ **Trust System**: Verification and reputation management

## Authentication & Security

### Supported Authentication Methods

#### 1. Bearer Token (JWT)
```javascript
// Header format
Authorization: Bearer <jwt_token>
```

#### 2. API Key/Secret
```javascript
// Headers
X-API-Key: your_api_key
X-API-Secret: your_api_secret
```

#### 3. OAuth2 Access Tokens
```javascript
// Header format
Authorization: Bearer <oauth2_token>
```

### Security Schemes Configuration
```javascript
securitySchemes: {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT or OAuth2 access token'
  },
  apiKeyAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key for authentication'
  },
  apiSecretAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Secret',
    description: 'API secret for authentication'
  }
}
```

## Rate Limiting

### Limits by Endpoint Type
- **General API**: 100 requests per 15 minutes
- **Marketplace**: More lenient limits for browsing
- **Authentication**: Stricter limits (1 SMS/email OTP per minute)
- **File Uploads**: Limited by file size and count

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Common Response Schemas

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field validation error"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## User Schema

### Basic User Object
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "roles": ["client", "provider"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### User Roles
- `client` - Base consumer role (always present)
- `provider` - Service provider
- `supplier` - Product supplier
- `instructor` - Course instructor
- `agency_owner` - Agency owner
- `agency_admin` - Agency administrator
- `partner` - Corporate partner
- `staff` - Limited admin access
- `admin` - Full platform access

## Documenting API Endpoints

### Basic JSDoc Swagger Structure

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []  # or [] for public endpoints
 *     parameters:
 *       - in: path|query|header
 *         name: paramName
 *         required: true|false
 *         schema:
 *           type: string|number|boolean
 *         description: Parameter description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.method('/your-endpoint', handler);
```

## Endpoint Documentation Patterns

### 1. Public Endpoints (No Authentication)

```javascript
/**
 * @swagger
 * /api/public/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running and healthy
 *     tags: [Monitoring]
 *     security: []  # No authentication required
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get('/health', healthCheck);
```

### 2. Authenticated Endpoints

```javascript
/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the current user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', auth, getProfile);
```

### 3. Endpoints with Path Parameters

```javascript
/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/users/:userId', auth, getUserById);
```

### 4. Endpoints with Query Parameters

```javascript
/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get services
 *     description: Retrieve a paginated list of services
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by service category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/services', auth, getServices);
```

### 5. Endpoints with Request Body

```javascript
/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create service
 *     description: Create a new service offering
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "House Cleaning Service"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Professional house cleaning service"
 *               category:
 *                 type: string
 *                 example: "cleaning"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 50.00
 *               duration:
 *                 type: integer
 *                 minimum: 30
 *                 example: 120
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           $ref: '#/components/schemas/ObjectId'
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [draft, published, paused]
 *                           example: "draft"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/services', auth, authorize(['provider']), createService);
```

### 6. File Upload Endpoints

```javascript
/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: Upload and update user profile avatar
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG) max 2MB
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         avatarUrl:
 *                           type: string
 *                           example: "https://cloudinary.com/.../avatar.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "users/avatars/abc123"
 *       400:
 *         description: Invalid file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid file type. Only JPEG and PNG are allowed"
 *               code: "INVALID_FILE_TYPE"
 */
router.post('/upload/avatar', auth, upload.single('avatar'), uploadAvatar);
```

## Authentication Endpoints Documentation

### Login/Register Endpoints

```javascript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "abc123def456..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid email or password"
 *               code: "INVALID_CREDENTIALS"
 */
router.post('/login', validateLogin, loginWithEmail);
```

## Advanced Documentation Patterns

### 1. Complex Response Schemas

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         provider:
 *           type: object
 *           properties:
 *             _id:
 *               $ref: '#/components/schemas/ObjectId'
 *             name:
 *               type: string
 *             rating:
 *               type: number
 *               minimum: 0
 *               maximum: 5
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *         availability:
 *           type: object
 *           properties:
 *             monday:
 *               type: array
 *               items:
 *                 type: string
 *                 pattern: '^([01]\\d|2[0-3]):[0-5]\\d-([01]\\d|2[0-3]):[0-5]\\d$'
 */
```

### 2. Enum Values

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     BookingStatus:
 *       type: string
 *       enum: [pending, confirmed, in_progress, completed, cancelled]
 *       example: "confirmed"
 *     PaymentMethod:
 *       type: string
 *       enum: [cash, card, paypal, paymaya, bank_transfer]
 *       example: "paymaya"
 */
```

### 3. Nested Objects

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *           example: "123 Main St"
 *         city:
 *           type: string
 *           example: "Anytown"
 *         state:
 *           type: string
 *           example: "CA"
 *         zipCode:
 *           type: string
 *           example: "12345"
 *         country:
 *           type: string
 *           example: "USA"
 *         coordinates:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *               minimum: -90
 *               maximum: 90
 *             lng:
 *               type: number
 *               minimum: -180
 *               maximum: 180
 */
```

## Best Practices

### 1. Consistent Naming
- Use camelCase for property names
- Use PascalCase for schema names
- Use kebab-case for path parameters
- Use descriptive, action-oriented summary texts

### 2. Security Documentation
- Always specify security requirements
- Use appropriate security schemes
- Document role-based access requirements

### 3. Response Documentation
- Document all possible response codes
- Use consistent response schemas
- Provide meaningful examples

### 4. Parameter Validation
- Document required vs optional parameters
- Specify data types and constraints
- Provide examples for complex parameters

### 5. Error Handling
- Use predefined error response references
- Document custom error codes
- Provide clear error messages

## Testing Documentation

### Using Swagger UI
1. Start the development server
2. Navigate to `http://localhost:5000/api-docs`
3. Expand an endpoint
4. Click "Try it out"
5. Fill in parameters/request body
6. Click "Execute"
7. Review response

### Authentication Testing
1. First authenticate via login/register endpoints
2. Copy the JWT token from response
3. Click "Authorize" button in Swagger UI
4. Enter: `Bearer <your_jwt_token>`
5. Test authenticated endpoints

### File Upload Testing
1. Use the file upload endpoints
2. Select a file using the "Choose File" button
3. Execute the request
4. Verify file URL in response

## Validation and Deployment

### Documentation Validation
```bash
# Check for syntax errors
npm run swagger:validate

# Generate static documentation
npm run swagger:generate
```

### CI/CD Integration
- Validate swagger documentation in CI pipeline
- Generate API documentation automatically
- Deploy documentation with application

## Common Issues and Solutions

### 1. Schema References Not Working
**Problem**: `$ref` not resolving properly
**Solution**: Ensure schema is defined in components section

### 2. Authentication Not Working in Swagger UI
**Problem**: Bearer token not being sent
**Solution**: Use "Authorize" button and format as `Bearer <token>`

### 3. File Upload Not Working
**Problem**: Multipart form data not handled
**Solution**: Ensure `multipart/form-data` content type is specified

### 4. Complex Schema Validation
**Problem**: Nested schemas causing validation errors
**Solution**: Break down into smaller, reusable schemas

## Next Steps

### Immediate Tasks
1. ✅ Complete authentication endpoint documentation
2. 🔄 Document marketplace endpoints
3. ⏳ Add provider management endpoints
4. ⏳ Document academy/course endpoints
5. ⏳ Add finance/payment endpoints

### Advanced Features
1. ⏳ Add webhook documentation
2. ⏳ Document real-time WebSocket endpoints
3. ⏳ Add API versioning documentation
4. ⏳ Create client SDK documentation

### Maintenance
1. Keep documentation in sync with code changes
2. Regularly test all documented endpoints
3. Update examples with real data
4. Add performance benchmarks

---

*This comprehensive guide serves as the foundation for maintaining high-quality API documentation for the LocalPro Super App. Regular updates and testing ensure developers can effectively integrate with the platform.*