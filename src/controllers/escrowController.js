const escrowService = require('../services/escrowService');
const Escrow = require('../models/Escrow');
const Payout = require('../models/Payout');
const EscrowTransaction = require('../models/EscrowTransaction');
const logger = require('../config/logger');

/**
 * @desc    Create a new escrow and initiate payment hold
 * @route   POST /api/escrows/create
 * @access  Private
 */
const createEscrow = async (req, res) => {
  try {
    const { bookingId, providerId, amount, currency, holdProvider } = req.body;
    const clientId = req.user.id;

    // Validate required fields
    if (!bookingId || !providerId || !amount || !currency || !holdProvider) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, providerId, amount, currency, holdProvider'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const result = await escrowService.createEscrow({
      bookingId,
      clientId,
      providerId,
      amount,
      currency,
      holdProvider
    });

    res.status(201).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Create escrow error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating escrow'
    });
  }
};

/**
 * @desc    Capture held payment after client approval
 * @route   POST /api/escrows/:id/capture
 * @access  Private (Client only)
 */
const capturePayment = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const clientId = req.user.id;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }

    const result = await escrowService.capturePayment(escrowId, clientId);

    res.status(200).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Capture payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error capturing payment'
    });
  }
};

/**
 * @desc    Refund held payment (before capture)
 * @route   POST /api/escrows/:id/refund
 * @access  Private
 */
const refundPayment = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!escrowId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and reason are required'
      });
    }

    const result = await escrowService.refundPayment(escrowId, reason, userId);

    res.status(200).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error refunding payment'
    });
  }
};

/**
 * @desc    Process payout to provider
 * @route   POST /api/escrows/:id/payout
 * @access  Private (Provider only)
 */
const processPayout = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const providerId = req.user.id;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }

    const result = await escrowService.processPayout(escrowId, providerId);

    res.status(200).json({
      success: true,
      data: {
        escrow: result.escrow,
        payout: result.payout
      },
      message: result.message
    });
  } catch (error) {
    logger.error('Process payout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing payout'
    });
  }
};

/**
 * @desc    Upload proof of work
 * @route   POST /api/escrows/:id/proof-of-work
 * @access  Private (Provider only)
 */
const uploadProofOfWork = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const providerId = req.user.id;
    const { documents, notes } = req.body;

    if (!escrowId || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and documents array are required'
      });
    }

    const result = await escrowService.uploadProofOfWork(escrowId, providerId, documents, notes);

    res.status(200).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Upload proof error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error uploading proof'
    });
  }
};

/**
 * @desc    Initiate dispute
 * @route   POST /api/escrows/:id/dispute
 * @access  Private (Client or Provider)
 */
const initiateDispute = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const raisedBy = req.user.id;
    const { reason, evidence } = req.body;

    if (!escrowId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and reason are required'
      });
    }

    const result = await escrowService.initiateDispute(escrowId, raisedBy, reason, evidence);

    res.status(201).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Initiate dispute error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error initiating dispute'
    });
  }
};

/**
 * @desc    Resolve dispute
 * @route   POST /api/escrows/:id/dispute/resolve
 * @access  Private (Admin only)
 */
const resolveDispute = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const adminId = req.user.id;
    const { decision, notes } = req.body;

    if (!escrowId || !decision) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID and decision are required'
      });
    }

    const result = await escrowService.resolveDispute(escrowId, decision, notes, adminId);

    res.status(200).json({
      success: true,
      data: result.escrow,
      message: result.message
    });
  } catch (error) {
    logger.error('Resolve dispute error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error resolving dispute'
    });
  }
};

/**
 * @desc    Get escrow details
 * @route   GET /api/escrows/:id
 * @access  Private
 */
const getEscrowDetails = async (req, res) => {
  try {
    const escrowId = req.params.id;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }

    const result = await escrowService.getEscrowDetails(escrowId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get escrow details error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Escrow not found'
    });
  }
};

/**
 * @desc    Get user's escrows
 * @route   GET /api/escrows
 * @access  Private
 */
const getEscrows = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Build filters based on user type
    const filters = {};
    const userRole = req.user.role;

    if (userRole === 'provider') {
      filters.providerId = userId;
    } else {
      filters.clientId = userId;
    }

    if (status) {
      filters.status = status;
    }

    const result = await escrowService.getEscrows(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result.escrows,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get escrows error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching escrows'
    });
  }
};

/**
 * @desc    Get all escrows (Admin only)
 * @route   GET /api/escrows/admin/all
 * @access  Private (Admin only)
 */
const getAllEscrows = async (req, res) => {
  try {
    const { status, clientId, providerId, page = 1, limit = 20 } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (clientId) filters.clientId = clientId;
    if (providerId) filters.providerId = providerId;

    const result = await escrowService.getEscrows(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result.escrows,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get all escrows error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching escrows'
    });
  }
};

/**
 * @desc    Get escrow transactions (audit log)
 * @route   GET /api/escrows/:id/transactions
 * @access  Private
 */
const getEscrowTransactions = async (req, res) => {
  try {
    const escrowId = req.params.id;
    const { page = 1, limit = 50 } = req.query;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      EscrowTransaction.find({ escrowId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EscrowTransaction.countDocuments({ escrowId })
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get escrow transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transactions'
    });
  }
};

/**
 * @desc    Get payout details
 * @route   GET /api/escrows/:id/payout
 * @access  Private
 */
const getPayoutDetails = async (req, res) => {
  try {
    const escrowId = req.params.id;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }

    const payout = await Payout.findOne({ escrowId })
      .populate('providerId', 'name email')
      .lean();

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found for this escrow'
      });
    }

    res.status(200).json({
      success: true,
      data: payout
    });
  } catch (error) {
    logger.error('Get payout details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payout'
    });
  }
};

/**
 * @desc    Get escrow statistics (Admin only)
 * @route   GET /api/escrows/stats
 * @access  Private (Admin only)
 */
const getEscrowStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await Escrow.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
          ],
          totalVolume: [
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          byProvider: [
            { $group: { _id: '$providerId', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    logger.error('Get escrow stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics'
    });
  }
};

module.exports = {
  createEscrow,
  capturePayment,
  refundPayment,
  processPayout,
  uploadProofOfWork,
  initiateDispute,
  resolveDispute,
  getEscrowDetails,
  getEscrows,
  getAllEscrows,
  getEscrowTransactions,
  getPayoutDetails,
  getEscrowStats
};
