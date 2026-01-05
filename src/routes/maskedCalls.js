const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createMaskedCall,
  initiateCall,
  endCall,
  getMaskedCall
} = require('../controllers/maskedCallController');

const router = express.Router();

/**
 * @swagger
 * /api/masked-calls:
 *   post:
 *     summary: Create masked call session
 *     tags: [Masked Calls]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, createMaskedCall);

/**
 * @swagger
 * /api/masked-calls/{id}:
 *   get:
 *     summary: Get masked call session
 *     tags: [Masked Calls]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, getMaskedCall);

/**
 * @swagger
 * /api/masked-calls/{id}/initiate:
 *   post:
 *     summary: Initiate call
 *     tags: [Masked Calls]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/initiate', auth, initiateCall);

/**
 * @swagger
 * /api/masked-calls/{id}/calls/{callId}/end:
 *   post:
 *     summary: End call
 *     tags: [Masked Calls]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/calls/:callId/end', auth, endCall);

module.exports = router;
