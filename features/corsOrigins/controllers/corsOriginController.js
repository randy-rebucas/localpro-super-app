const AllowedOrigin = require('../models/AllowedOrigin');

// List all allowed origins
exports.listOrigins = async (req, res) => {
  try {
    const origins = await AllowedOrigin.find().sort({ createdAt: -1 });
    res.json({ success: true, origins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch origins', error: err.message });
  }
};

// Add a new allowed origin
exports.addOrigin = async (req, res) => {
  try {
    const { origin } = req.body;
    if (!origin) return res.status(400).json({ success: false, message: 'Origin is required' });
    const exists = await AllowedOrigin.findOne({ origin });
    if (exists) return res.status(409).json({ success: false, message: 'Origin already exists' });
    const newOrigin = await AllowedOrigin.create({ origin });
    res.status(201).json({ success: true, origin: newOrigin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add origin', error: err.message });
  }
};

// Remove an allowed origin
exports.removeOrigin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AllowedOrigin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Origin not found' });
    res.json({ success: true, message: 'Origin removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove origin', error: err.message });
  }
};
