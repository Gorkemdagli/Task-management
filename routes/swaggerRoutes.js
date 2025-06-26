const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const { auth, swaggerAdminOnly } = require('../middleware/auth');
const { swaggerDocs } = require('../swagger');

// Swagger UI - Sadece admin rolüne sahip kullanıcılar erişebilir
router.use('/', auth, swaggerAdminOnly, swaggerUi.serve);
router.get('/', auth, swaggerAdminOnly, swaggerUi.setup(swaggerDocs));

module.exports = router; 