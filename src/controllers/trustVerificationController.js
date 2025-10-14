const { VerificationRequest, TrustEvent, Dispute } = require('../models/TrustVerification');
const User = require('../models/User');
const { Booking } = require('../models/Marketplace');

// @desc    Submit verification request
// @route   POST /api/trust-verification/verify
// @access  Private
const submitVerificationRequest = async (req, res) => {
  try {
    const { type, documents } = req.body;
    const userId = req.user.id;

    // Check if user already has a pending request of this type
    const existingRequest = await VerificationRequest.findOne({
      user: userId,
      type: type,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${type} verification request`
      });
    }

    const verificationRequest = await VerificationRequest.create({
      user: userId,
      type: type,
      documents: documents || []
    });

    // Log trust event
    await TrustEvent.create({
      user: userId,
      type: 'verification_completed',
      description: `${type} verification request submitted`,
      points: 5
    });

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      data: verificationRequest
    });
  } catch (error) {
    console.error('Submit verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user verification requests
// @route   GET /api/trust-verification/requests
// @access  Private
const getVerificationRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await VerificationRequest.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Review verification request (Admin only)
// @route   PUT /api/trust-verification/requests/:id/review
// @access  Private (Admin)
const reviewVerificationRequest = async (req, res) => {
  try {
    const { status, notes, rejectionReason } = req.body;
    const requestId = req.params.id;
    const reviewerId = req.user.id;

    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    request.status = status;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;
    request.notes = notes;
    if (status === 'rejected') {
      request.rejectionReason = rejectionReason;
    }

    await request.save();

    // Update user verification status
    const user = await User.findById(request.user);
    if (user) {
      const verificationField = `${request.type}Verified`;
      if (user.verification[verificationField] !== undefined) {
        user.verification[verificationField] = status === 'approved';
        if (status === 'approved') {
          user.verification.verifiedAt = new Date();
        }
        await user.save();

        // Recalculate trust score
        user.calculateTrustScore();
        await user.save();
      }
    }

    // Log trust event
    await TrustEvent.create({
      user: request.user,
      type: status === 'approved' ? 'verification_completed' : 'verification_rejected',
      description: `${request.type} verification ${status}`,
      points: status === 'approved' ? 15 : -5,
      metadata: { requestId: request._id, reviewerId }
    });

    res.status(200).json({
      success: true,
      message: `Verification request ${status} successfully`,
      data: request
    });
  } catch (error) {
    console.error('Review verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user trust score and events
// @route   GET /api/trust-verification/trust-score
// @access  Private
const getTrustScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const trustEvents = await TrustEvent.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const verificationRequests = await VerificationRequest.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        trustScore: user.trustScore,
        verification: user.verification,
        badges: user.badges,
        recentEvents: trustEvents,
        verificationRequests: verificationRequests
      }
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create dispute
// @route   POST /api/trust-verification/disputes
// @access  Private
const createDispute = async (req, res) => {
  try {
    const { bookingId, type, description, evidence } = req.body;
    const complainantId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is involved in the booking
    if (booking.client.toString() !== complainantId && booking.provider.toString() !== complainantId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a dispute for this booking'
      });
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ booking: bookingId });
    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: 'A dispute already exists for this booking'
      });
    }

    const respondentId = booking.client.toString() === complainantId ? booking.provider : booking.client;

    const dispute = await Dispute.create({
      booking: bookingId,
      complainant: complainantId,
      respondent: respondentId,
      type: type,
      description: description,
      evidence: evidence || []
    });

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: dispute
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user disputes
// @route   GET /api/trust-verification/disputes
// @access  Private
const getDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, role } = req.query;

    let filter = {};
    if (role === 'complainant') {
      filter.complainant = userId;
    } else if (role === 'respondent') {
      filter.respondent = userId;
    } else {
      filter.$or = [{ complainant: userId }, { respondent: userId }];
    }

    if (status) filter.status = status;

    const disputes = await Dispute.find(filter)
      .populate('booking', 'service client provider status')
      .populate('complainant', 'firstName lastName')
      .populate('respondent', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Resolve dispute (Admin only)
// @route   PUT /api/trust-verification/disputes/:id/resolve
// @access  Private (Admin)
const resolveDispute = async (req, res) => {
  try {
    const { description, outcome, refundAmount, penaltyPoints } = req.body;
    const disputeId = req.params.id;
    const resolvedBy = req.user.id;

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.status = 'resolved';
    dispute.resolution = {
      description,
      resolvedBy,
      resolvedAt: new Date(),
      outcome,
      refundAmount: refundAmount || 0,
      penaltyPoints: penaltyPoints || 0
    };

    await dispute.save();

    // Apply penalty points if any
    if (penaltyPoints > 0) {
      const user = await User.findById(dispute.respondent);
      if (user) {
        user.trustScore = Math.max(0, user.trustScore - penaltyPoints);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: dispute
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  submitVerificationRequest,
  getVerificationRequests,
  reviewVerificationRequest,
  getTrustScore,
  createDispute,
  getDisputes,
  resolveDispute
};
