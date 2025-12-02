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

// Public routes - order matters! More specific routes first
router.get('/active', getActiveBroadcasters);
router.get('/stats', getBroadcasterStats);

// POST /api/broadcaster/:id/view - track view (alternative endpoint)
router.post('/:id/view', trackBroadcasterView);

// POST /api/broadcaster/:id/click - track click (alternative endpoint)
router.post('/:id/click', trackBroadcasterClick);

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

// PUT /api/broadcaster/:id - update broadcaster
router.put('/:id', updateBroadcaster);

// DELETE /api/broadcaster/:id - delete broadcaster
router.delete('/:id', deleteBroadcaster);

// GET /api/broadcaster - list all broadcasters (must be last to avoid conflicts)
router.get('/', getBroadcasters);

module.exports = router;

