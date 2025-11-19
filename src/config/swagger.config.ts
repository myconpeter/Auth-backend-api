// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app.config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Auth API Documentation',
    version: '1.0.0',
    description:
      'Comprehensive authentication API with JWT, MFA, and session management',
    contact: {
      name: 'API Support',
      email: 'support@whudey.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}${config.BASE_PATH}`,
      description: 'Development server',
    },
    {
      url: `https://api.whudey.com${config.BASE_PATH}`,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT token stored in HTTP-only cookie',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Error message',
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          verified: {
            type: 'boolean',
            example: false,
          },
          mfaEnabled: {
            type: 'boolean',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints',
    },
    {
      name: 'MFA',
      description: 'Multi-factor authentication endpoints',
    },
    {
      name: 'Session',
      description: 'Session management endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.controller.ts',
    './src/common/validators/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
