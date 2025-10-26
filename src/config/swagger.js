const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalPro Super App API',
      version: '1.0.0',
      description: 'Comprehensive API for LocalPro Super App - A multi-service platform for local professionals',
      contact: {
        name: 'LocalPro Support',
        email: 'support@localpro.com',
        url: 'https://localpro.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.localpro.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: {
              type: 'string',
              enum: ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin'],
              example: 'client'
            },
            isVerified: { type: 'boolean', example: true },
            profile: {
              type: 'object',
              properties: {
                avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                bio: { type: 'string', example: 'Professional service provider' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '123 Main St' },
                    city: { type: 'string', example: 'New York' },
                    state: { type: 'string', example: 'NY' },
                    zipCode: { type: 'string', example: '10001' },
                    country: { type: 'string', example: 'USA' }
                  }
                }
              }
            },
            trustScore: { type: 'number', minimum: 0, maximum: 100, example: 85 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Professional Cleaning Service' },
            description: { type: 'string', example: 'High-quality cleaning services for homes and offices' },
            category: { type: 'string', example: 'cleaning' },
            subcategory: { type: 'string', example: 'residential' },
            provider: { type: 'string', example: '507f1f77bcf86cd799439012' },
            pricing: {
              type: 'object',
              properties: {
                basePrice: { type: 'number', example: 50.00 },
                currency: { type: 'string', example: 'USD' },
                pricingType: { type: 'string', enum: ['hourly', 'fixed', 'per_sqft'], example: 'hourly' }
              }
            },
            isActive: { type: 'boolean', example: true },
            rating: {
              type: 'object',
              properties: {
                average: { type: 'number', example: 4.5 },
                count: { type: 'number', example: 25 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Senior Software Developer' },
            description: { type: 'string', example: 'Looking for an experienced software developer...' },
            company: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Tech Corp' },
                location: {
                  type: 'object',
                  properties: {
                    city: { type: 'string', example: 'San Francisco' },
                    state: { type: 'string', example: 'CA' },
                    isRemote: { type: 'boolean', example: true }
                  }
                }
              }
            },
            category: { type: 'string', example: 'technology' },
            jobType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance'], example: 'full-time' },
            experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'executive'], example: 'senior' },
            salary: {
              type: 'object',
              properties: {
                min: { type: 'number', example: 80000 },
                max: { type: 'number', example: 120000 },
                currency: { type: 'string', example: 'USD' },
                period: { type: 'string', enum: ['hourly', 'monthly', 'yearly'], example: 'yearly' }
              }
            },
            status: { type: 'string', enum: ['active', 'paused', 'closed', 'draft'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
            details: { type: 'object' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied',
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
                details: {
                  field: 'email',
                  message: 'Invalid email format'
                }
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
                message: 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 900
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
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions: {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  }
};
