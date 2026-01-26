const express = require('express');
const { auth } = require('../middleware/auth');
const { createSupportTicket, listSupportTickets, getSupportTicket, addSupportTicketReply, listSupportTicketReplies } = require('../controllers/supportController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create a new support ticket
router.post('/tickets', createSupportTicket);

// List support tickets for the authenticated user
router.get('/tickets', listSupportTickets);

// Get a specific support ticket
router.get('/tickets/:id', getSupportTicket);

// Add a reply to a support ticket
router.post('/tickets/:id/replies', addSupportTicketReply);

// List replies for a support ticket
router.get('/tickets/:id/replies', listSupportTicketReplies);

module.exports = router;
