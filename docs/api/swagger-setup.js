/**
 * Swagger/OpenAPI Setup
 * 
 * This file configures Swagger UI for interactive API documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalPro Super App API',
      version: '2.2.0',
      description: 'Complete REST API documentation for LocalPro Super App Backend',
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
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
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
            error: {
              type: 'string',
              example: 'Detailed error description'
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
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Marketplace',
        description: 'Service marketplace operations'
      },
      {
        name: 'Bookings',
        description: 'Booking management'
      },
      {
        name: 'Payments',
        description: 'Payment processing (PayMongo, Stripe, PayPal, etc.)'
      },
      {
        name: 'Notifications',
        description: 'Push notifications, SMS, Email'
      },
      {
        name: 'Referrals',
        description: 'Referral system and rewards'
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for payment providers'
      },
      {
        name: 'Scheduled Jobs',
        description: 'Scheduled job management (Admin only)'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerOptions: {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LocalPro API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }
};

