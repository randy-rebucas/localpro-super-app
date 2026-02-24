const express = require('express');
const { auth } = require('../../../src/middleware/auth');
const { aiLimiter } = require('../../../src/middleware/rateLimiter');
const { generateUserBio } = require('../controllers/aiUserController');

const router = express.Router();

// All AI user routes require authentication and are subject to AI rate limiting
router.use(auth);
router.use(aiLimiter);

/**
 * @swagger
 * /api/ai/users/bio-generator:
 *   post:
 *     summary: Generate user bio using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               profession:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated bio
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/bio-generator', generateUserBio);

module.exports = router;

