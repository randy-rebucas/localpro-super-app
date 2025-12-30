const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getBroadcasters,
  getBroadcasterById,
  getActiveBroadcasters,
  getBroadcasterStats,
  trackBroadcasterView,
  trackBroadcasterClick,
  createBroadcaster,
  updateBroadcaster,
  deleteBroadcaster
} = require('../controllers/broadcasterController');

const router = express.Router();

/**
 * @swagger
 * /api/broadcaster/active:
 *   get:
 *     summary: Get active broadcasters
 *     tags: [Broadcaster]
 *     security: []
 *     responses:
 *       200:
 *         description: List of active broadcasters
 */
// Public routes - order matters! More specific routes first
router.get('/active', getActiveBroadcasters);

/**
 * @swagger
 * /api/broadcaster/stats:
 *   get:
 *     summary: Get broadcaster statistics
 *     tags: [Broadcaster]
 *     security: []
 *     responses:
 *       200:
 *         description: Broadcaster statistics
 */
router.get('/stats', getBroadcasterStats);

/**
 * @swagger
 * /api/broadcaster/{id}/view:
 *   post:
 *     summary: Track broadcaster view
 *     tags: [Broadcaster]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: View tracked
 */
// POST /api/broadcaster/:id/view - track view (alternative endpoint)
router.post('/:id/view', trackBroadcasterView);

/**
 * @swagger
 * /api/broadcaster/{id}/click:
 *   post:
 *     summary: Track broadcaster click
 *     tags: [Broadcaster]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Click tracked
 */
// POST /api/broadcaster/:id/click - track click (alternative endpoint)
router.post('/:id/click', trackBroadcasterClick);

/**
 * @swagger
 * /api/broadcaster/{id}:
 *   get:
 *     summary: Get broadcaster by ID
 *     tags: [Broadcaster]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Broadcaster details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update broadcaster
 *     tags: [Broadcaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Broadcaster updated
 *   delete:
 *     summary: Delete broadcaster
 *     tags: [Broadcaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Broadcaster deleted
 */
// GET /api/broadcaster/:id - get broadcaster by ID
router.get('/:id', getBroadcasterById);

// POST /api/broadcaster - create broadcaster OR track view/click based on action in body
// Supports: 
//   - Creating: { title, description, content, ... } (no action, no broadcasterId) - requires auth
//   - Tracking: { action: 'view', broadcasterId: '...' } or { action: 'click', broadcasterId: '...' } - public
router.post('/', async (req, res, next) => {
  const { action, broadcasterId, id } = req.body;
  
  // If action is specified, route to tracking handler (public)
  if (action === 'view') {
    return trackBroadcasterView(req, res, next);
  } else if (action === 'click') {
    return trackBroadcasterClick(req, res, next);
  }
  
  // If broadcasterId/id is present, default to view tracking (public)
  if (broadcasterId || id) {
    return trackBroadcasterView(req, res, next);
  }
  
  // Otherwise, this is a create request - requires authentication
  return auth(req, res, () => createBroadcaster(req, res));
});

// Protected routes - require authentication
router.use(auth);

router.put('/:id', updateBroadcaster);
router.delete('/:id', deleteBroadcaster);

/**
 * @swagger
 * /api/broadcaster:
 *   get:
 *     summary: List all broadcasters
 *     tags: [Broadcaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of broadcasters
 *   post:
 *     summary: Create broadcaster
 *     tags: [Broadcaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Broadcaster created
 */
// GET /api/broadcaster - list all broadcasters (must be last to avoid conflicts)
router.get('/', getBroadcasters);

module.exports = router;

