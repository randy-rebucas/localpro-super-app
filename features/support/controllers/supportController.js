// @desc    Add a reply to a support ticket
// @route   POST /api/support/tickets/:id/replies
// @access  Partner/User
exports.addSupportTicketReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message is required.' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    ticket.responses.push({ message, addedBy: req.user._id });
    await ticket.save();
    res.status(201).json({ success: true, data: ticket.responses[ticket.responses.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    List replies for a support ticket
// @route   GET /api/support/tickets/:id/replies
// @access  Partner/User
exports.listSupportTicketReplies = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    res.status(200).json({ success: true, data: ticket.responses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Partner/User
exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    List support tickets for the authenticated user
// @route   GET /api/support/tickets
// @access  Partner/User
exports.listSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get a specific support ticket
// @route   GET /api/support/tickets/:id
// @access  Partner/User
exports.getSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
