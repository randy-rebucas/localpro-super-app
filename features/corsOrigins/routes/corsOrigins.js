const express = require('express');
const { adminLimiter } = require('../../../src/middleware/rateLimiter');

const router = express.Router();
router.use(adminLimiter);
const corsOriginController = require('../controllers/corsOriginController');
const requireAdmin = require('../../../src/middleware/requireAdmin');

// List all allowed origins
router.get('/', requireAdmin, corsOriginController.listOrigins);
// Add a new allowed origin
router.post('/', requireAdmin, corsOriginController.addOrigin);
// Remove an allowed origin
router.delete('/:id', requireAdmin, corsOriginController.removeOrigin);

module.exports = router;
