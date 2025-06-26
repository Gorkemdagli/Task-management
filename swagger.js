const swaggerJsDoc = require('swagger-jsdoc');

// Swagger tanımlaması
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Görev Yönetim API',
      version: '1.0.0',
      description: 'Görev yönetim sistemi API dokümantasyonu\n\n**Not:** Bu dokümantasyona sadece admin yetkisine sahip kullanıcılar erişebilir.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js'],
};

// Swagger dokümantasyonu oluştur
const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerDocs, swaggerOptions }; 