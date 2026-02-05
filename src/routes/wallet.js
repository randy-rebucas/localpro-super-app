const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Finance } = require('../models/Finance');

// GET /api/wallet - returns the authenticated user's wallet balance
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const finance = await Finance.findOne({ user: userId });
    if (!finance || !finance.wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    res.json({ success: true, balance: finance.wallet.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
