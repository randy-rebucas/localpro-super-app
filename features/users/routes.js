// Users feature routes (migrated)
const express = require('express');
const { auth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const userController = require('./controller');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ...existing code for user management endpoints...

module.exports = router;
