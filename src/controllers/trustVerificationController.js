const TrustVerification = require('../models/TrustVerification');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');

// @desc    Get all trust verification requests
// @route   GET /api/trust-verification
// @access  Private (Admin only)
const getTrustVerificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await TrustVerification.find(filter)
      .populate('user', 'firstName lastName profile.avatar profile.rating')
      .populate('reviewedBy', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await TrustVerification.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    console.error('Get trust verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single trust verification request
// @route   GET /api/trust-verification/:id
// @access  Private
const getTrustVerificationRequest = async (req, res) => {
  try {
    const request = await TrustVerification.findById(req.params.id)
      .populate('user', 'firstName lastName profile.avatar profile.rating profile.bio')
      .populate('reviewedBy', 'firstName lastName profile.avatar');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user has access to view this request
    if (request.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get trust verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create trust verification request
// @route   POST /api/trust-verification
// @access  Private
const createTrustVerificationRequest = async (req, res) => {
  try {
    const { type, documents, additionalInfo } = req.body;

    if (!type || !documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Type and documents are required'
      });
    }

    // Check if user already has a pending request of this type
    const existingRequest = await TrustVerification.findOne({
      user: req.user.id,
      type,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request of this type'
      });
    }

    const request = await TrustVerification.create({
      user: req.user.id,
      type,
      documents,
      additionalInfo,
      status: 'pending'
    });

    await request.populate('user', 'firstName lastName profile.avatar');

    // Send notification email to admin
    await EmailService.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Trust Verification Request',
      template: 'verification-request',
      data: {
        userName: `${req.user.firstName} ${req.user.lastName}`,
        type,
        requestId: request._id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Trust verification request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Create trust verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update trust verification request
// @route   PUT /api/trust-verification/:id
// @access  Private
const updateTrustVerificationRequest = async (req, res) => {
  try {
    const { documents, additionalInfo } = req.body;

    const request = await TrustVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user is the owner of the request
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Check if request can be updated
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request cannot be updated as it is not pending'
      });
    }

    // Update request
    if (documents) request.documents = documents;
    if (additionalInfo) request.additionalInfo = additionalInfo;

    request.updatedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Trust verification request updated successfully',
      data: request
    });
  } catch (error) {
    console.error('Update trust verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Review trust verification request
// @route   PUT /api/trust-verification/:id/review
// @access  Private (Admin only)
const reviewTrustVerificationRequest = async (req, res) => {
  try {
    const { status, adminNotes, trustScore } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['approved', 'rejected', 'needs_more_info'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const request = await TrustVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    // Update request
    request.status = status;
    request.adminNotes = adminNotes;
    request.trustScore = trustScore;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    // Update user's trust score if approved
    if (status === 'approved') {
      const user = await User.findById(request.user);
      if (user) {
        user.trustScore = trustScore || user.trustScore + 10;
        user.verificationStatus = 'verified';
        await user.save();
      }
    }

    // Send notification email to user
    const user = await User.findById(request.user);
    await EmailService.sendEmail({
      to: user.email,
      subject: 'Trust Verification Request Update',
      template: 'verification-status-update',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        status,
        adminNotes,
        trustScore
      }
    });

    res.status(200).json({
      success: true,
      message: 'Trust verification request reviewed successfully',
      data: request
    });
  } catch (error) {
    console.error('Review trust verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete trust verification request
// @route   DELETE /api/trust-verification/:id
// @access  Private
const deleteTrustVerificationRequest = async (req, res) => {
  try {
    const request = await TrustVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user is the owner of the request or admin
    if (request.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    // Check if request can be deleted
    if (request.status === 'approved' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Approved requests cannot be deleted'
      });
    }

    await TrustVerification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trust verification request deleted successfully'
    });
  } catch (error) {
    console.error('Delete trust verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload verification documents
// @route   POST /api/trust-verification/:id/documents
// @access  Private
const uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const request = await TrustVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user is the owner of the request
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload documents for this request'
      });
    }

    // Check if request can be updated
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request cannot be updated as it is not pending'
      });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadFile(file, 'localpro/verification-documents')
    );

    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults
      .filter(result => result.success)
      .map(result => ({
        url: result.data.secure_url,
        publicId: result.data.public_id,
        filename: result.data.original_filename
      }));

    if (successfulUploads.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any documents'
      });
    }

    // Add new documents to request
    request.documents = [...request.documents, ...successfulUploads];
    await request.save();

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} document(s) uploaded successfully`,
      data: successfulUploads
    });
  } catch (error) {
    console.error('Upload verification documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete verification document
// @route   DELETE /api/trust-verification/:id/documents/:documentId
// @access  Private
const deleteVerificationDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const request = await TrustVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user is the owner of the request
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete documents for this request'
      });
    }

    // Check if request can be updated
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request cannot be updated as it is not pending'
      });
    }

    const document = request.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(document.publicId);

    // Remove from request
    document.remove();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete verification document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's trust verification requests
// @route   GET /api/trust-verification/my-requests
// @access  Private
const getMyTrustVerificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await TrustVerification.find(filter)
      .populate('reviewedBy', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await TrustVerification.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    console.error('Get my trust verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get trust verification statistics
// @route   GET /api/trust-verification/statistics
// @access  Private (Admin only)
const getTrustVerificationStatistics = async (req, res) => {
  try {
    // Get total requests
    const totalRequests = await TrustVerification.countDocuments();

    // Get requests by status
    const requestsByStatus = await TrustVerification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get requests by type
    const requestsByType = await TrustVerification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await TrustVerification.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get average processing time
    const processingTime = await TrustVerification.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] },
          reviewedAt: { $exists: true }
        }
      },
      {
        $project: {
          processingTime: {
            $subtract: ['$reviewedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        requestsByStatus,
        requestsByType,
        monthlyTrends,
        averageProcessingTime: processingTime[0]?.averageProcessingTime || 0
      }
    });
  } catch (error) {
    console.error('Get trust verification statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get verified users
// @route   GET /api/trust-verification/verified-users
// @access  Public
const getVerifiedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, minTrustScore } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { verificationStatus: 'verified' };
    if (minTrustScore) filter.trustScore = { $gte: Number(minTrustScore) };

    const users = await User.find(filter)
      .select('firstName lastName profile.avatar profile.rating trustScore verificationStatus')
      .sort({ trustScore: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    console.error('Get verified users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTrustVerificationRequests,
  getTrustVerificationRequest,
  createTrustVerificationRequest,
  updateTrustVerificationRequest,
  reviewTrustVerificationRequest,
  deleteTrustVerificationRequest,
  uploadVerificationDocuments,
  deleteVerificationDocument,
  getMyTrustVerificationRequests,
  getTrustVerificationStatistics,
  getVerifiedUsers
};