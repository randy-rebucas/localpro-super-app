const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalPro Super App API',
      version: '1.0.0',
      description: 'Complete API documentation for LocalPro Super App - A comprehensive platform connecting local service providers with customers. Features include Service Marketplace & Bookings, Learning Academy & Certifications, Equipment & Supplies Management, Financial Management & Payments, Job Board & Employment, Trust & Verification System, Real-time Communication, Analytics & Insights, Referral System & Rewards, and Agency Management. The API supports multiple authentication methods: Bearer Token (JWT), API Key/Secret, and OAuth2 Access Tokens. Rate limiting: General API (100 requests per 15 minutes), Marketplace endpoints (more lenient), Authentication endpoints (stricter limits).',
      contact: {
        name: 'API Support',
        email: 'api-support@localpro.asia',
        url: 'https://localpro.asia/support'
      },
      license: {
        name: 'Proprietary',
        url: 'https://localpro.asia/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://localpro-super-app.onrender.com',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and user management endpoints' },
      { name: 'Marketplace', description: 'Service marketplace, bookings, and provider services' },
      { name: 'Providers', description: 'Provider profile management and onboarding' },
      { name: 'Supplies', description: 'Equipment and supplies marketplace' },
      { name: 'Academy', description: 'Learning academy, courses, and certifications' },
      { name: 'Finance', description: 'Financial management, transactions, and payments' },
      { name: 'Rentals', description: 'Equipment rental management' },
      { name: 'Jobs', description: 'Job board and employment opportunities' },
      { name: 'Communication', description: 'Messaging and communication features' },
      { name: 'Analytics', description: 'Analytics and insights endpoints' },
      { name: 'Settings', description: 'User and application settings' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Favorites', description: 'Favorites and bookmarks' },
      { name: 'Search', description: 'Global search functionality' },
      { name: 'Announcements', description: 'Announcements and public messages' },
      { name: 'Activities', description: 'User activity feed' },
      { name: 'Referrals', description: 'Referral system and rewards' },
      { name: 'Agencies', description: 'Agency management' },
      { name: 'Trust Verification', description: 'Trust and verification system' },
      { name: 'LocalPro Plus', description: 'LocalPro Plus subscription management' },
      { name: 'Maps', description: 'Maps and location services' },
      { name: 'PayPal', description: 'PayPal payment integration' },
      { name: 'PayMaya', description: 'PayMaya payment integration' },
      { name: 'Escrows', description: 'Escrow and payment protection' },
      { name: 'Live Chat', description: 'Real-time live chat support' },
      { name: 'Email Marketing', description: 'Email marketing campaigns' },
      { name: 'Partners', description: 'Partner management' },
      { name: 'Staff', description: 'Staff management' },
      { name: 'Permissions', description: 'Permission management' },
      { name: 'API Keys', description: 'API key management' },
      { name: 'OAuth', description: 'OAuth2 endpoints' },
      { name: 'Monitoring', description: 'System monitoring and health checks' },
      { name: 'Admin', description: 'Administrative endpoints' }
    ],
    components: {
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
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  example: 10
                },
                total: {
                  type: 'integer',
                  example: 100
                },
                totalPages: {
                  type: 'integer',
                  example: 10
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['client', 'provider', 'supplier', 'admin', 'instructor', 'agency']
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ObjectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
          example: '507f1f77bcf86cd799439011'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required',
                code: 'MISSING_AUTH'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: [
                  {
                    field: 'email',
                    message: 'Valid email is required'
                  }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
