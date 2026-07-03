const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Reservation Management API',
      version: '1.0.0',
      description: 'Production-ready REST API documentation for the Restaurant Reservation System.',
      contact: {
        name: 'Developer Support'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Main API router'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT Authentication Token stored in HTTP-Only cookie'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authentication Token in header format (Authorization: Bearer <token>)'
        }
      }
    }
  },
  // Path to the API docs. We will scan controllers and routes files.
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
