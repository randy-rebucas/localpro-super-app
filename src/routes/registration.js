const express = require('express');
const { earlyRegistrationValidation, createEarlyRegistration } = require('../controllers/registrationController');

const router = express.Router();

/**
 * @swagger
 * /api/registration/early:
 *   post:
 *     summary: Early registration endpoint
 *     tags: [Registration]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Early registration successful
 */
// Public: Early registration endpoint
router.post('/early', earlyRegistrationValidation, createEarlyRegistration);

module.exports = router;


