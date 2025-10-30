const express = require('express');
const { earlyRegistrationValidation, createEarlyRegistration } = require('../controllers/registrationController');

const router = express.Router();

// Public: Early registration endpoint
router.post('/early', earlyRegistrationValidation, createEarlyRegistration);

module.exports = router;


