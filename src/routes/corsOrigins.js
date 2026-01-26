const express = require('express');
const router = express.Router();
const corsOriginController = require('../controllers/corsOriginController');
const requireAdmin = require('../middleware/requireAdmin');

// List all allowed origins
router.get('/', requireAdmin, corsOriginController.listOrigins);
// Add a new allowed origin
router.post('/', requireAdmin, corsOriginController.addOrigin);
// Remove an allowed origin
router.delete('/:id', requireAdmin, corsOriginController.removeOrigin);

module.exports = router;
