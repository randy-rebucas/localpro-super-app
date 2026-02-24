const { VerificationRequest } = require('../models/TrustVerification');
const User = require('../../../src/models/User');
const CloudinaryService = require('../../../src/services/cloudinaryService');
const EmailService = require('../../../src/services/emailService');
const logger = require('../../../src/config/logger');
const { sendServerError } = require('../../../src/utils/responseHelper');
const { isValidObjectId } = require('../../../src/utils/objectIdUtils');
const debugLog = process.env.NODE_ENV !== 'production' ? logger.debug.bind(logger) : () => {};

// @desc    Get all trust verification requests
// @route   GET /api/trust-verification
// @access  Private (Admin only)
const getVerificationRequestRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await VerificationRequest.find(filter)
      .populate('user', 'firstName lastName profile.avatar profile.rating')
      .populate('review.reviewedBy', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await VerificationRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    logger.error('Get trust verification requests error:', error);
    return sendServerError(res, error, 'Failed to fetch verification requests', 'GET_REQUESTS_ERROR');
  }
};

// @desc    Get single trust verification request
// @route   GET /api/trust-verification/:id
// @access  Private
const getVerificationRequestRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }
    const request = await VerificationRequest.findById(req.params.id)
      .populate('user', 'firstName lastName profile.avatar profile.rating profile.bio')
      .populate('review.reviewedBy', 'firstName lastName profile.avatar');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user has access to view this request
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (request.user._id.toString() !== req.user.id && !isAdmin) {
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
    logger.error('Get trust verification request error:', error);
    return sendServerError(res, error, 'Failed to fetch verification request', 'GET_REQUEST_ERROR');
  }
};

// @desc    Create trust verification request
// @route   POST /api/trust-verification
// @access  Private
const createVerificationRequestRequest = async (req, res) => {
  try {
    const { type, documents, additionalInfo, personalInfo } = req.body;

    if (!type || !documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Type and documents are required'
      });
    }

    // Validate phone number if provided in personalInfo
    if (personalInfo && personalInfo.phoneNumber) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Normalize phone numbers for comparison
      const normalizedRequestPhone = personalInfo.phoneNumber.trim().replace(/\s+/g, '');
      const normalizedUserPhone = user.phoneNumber.trim().replace(/\s+/g, '');

      if (normalizedRequestPhone !== normalizedUserPhone) {
        return res.status(403).json({
          success: false,
          message: 'Phone number in verification request must match your registered unique phone number',
          code: 'PHONE_NUMBER_MISMATCH'
        });
      }

      // Ensure personalInfo.phoneNumber matches user's unique phoneNumber
      personalInfo.phoneNumber = user.phoneNumber;
    } else if (personalInfo) {
      // If personalInfo is provided but phoneNumber is missing, add user's phoneNumber
      const user = await User.findById(req.user.id);
      if (user) {
        personalInfo.phoneNumber = user.phoneNumber;
      }
    }

    // Check if user already has a pending request of this type
    const existingRequest = await VerificationRequest.findOne({
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

    const request = await VerificationRequest.create({
      user: req.user.id,
      type,
      documents,
      additionalInfo,
      personalInfo,
      status: 'pending'
    });

    await request.populate('user', 'firstName lastName profile.avatar');

    // Send notification email to admin
    if (process.env.ADMIN_EMAIL) {
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
    }

    res.status(201).json({
      success: true,
      message: 'Trust verification request submitted successfully',
      data: request
    });
  } catch (error) {
    logger.error('Create trust verification request error:', error);
    return sendServerError(res, error, 'Failed to create verification request', 'CREATE_REQUEST_ERROR');
  }
};

// @desc    Update trust verification request
// @route   PUT /api/trust-verification/:id
// @access  Private
const updateVerificationRequestRequest = async (req, res) => {
  try {
    const { documents, additionalInfo, personalInfo } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }

    const request = await VerificationRequest.findById(req.params.id);

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

    // Validate and update phone number if provided in personalInfo
    if (personalInfo && personalInfo.phoneNumber) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Normalize phone numbers for comparison
        const normalizedRequestPhone = personalInfo.phoneNumber.trim().replace(/\s+/g, '');
        const normalizedUserPhone = user.phoneNumber.trim().replace(/\s+/g, '');

        if (normalizedRequestPhone !== normalizedUserPhone) {
          return res.status(403).json({
            success: false,
            message: 'Phone number in verification request must match your registered unique phone number',
            code: 'PHONE_NUMBER_MISMATCH'
          });
        }

        // Ensure personalInfo.phoneNumber matches user's unique phoneNumber
        personalInfo.phoneNumber = user.phoneNumber;
      }
    }

    // Update request
    if (documents) request.documents = documents;
    if (additionalInfo) request.additionalInfo = additionalInfo;
    if (personalInfo) {
      request.personalInfo = { ...request.personalInfo, ...personalInfo };
      // Always ensure phoneNumber matches user's unique phoneNumber
      const user = await User.findById(req.user.id);
      if (user) {
        request.personalInfo.phoneNumber = user.phoneNumber;
      }
    }

    request.updatedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Trust verification request updated successfully',
      data: request
    });
  } catch (error) {
    logger.error('Update trust verification request error:', error);
    return sendServerError(res, error, 'Failed to update verification request', 'UPDATE_REQUEST_ERROR');
  }
};

// @desc    Review trust verification request
// @route   PUT /api/trust-verification/:id/review
// @access  Private (Admin only)
const reviewVerificationRequestRequest = async (req, res) => {
  try {
    const { status, adminNotes, trustScore } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }

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

    const request = await VerificationRequest.findById(req.params.id);

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

    // Update request — store review details in the nested review subdocument
    request.status = status;
    request.review.reviewedBy = req.user.id;
    request.review.reviewedAt = new Date();
    request.review.notes = adminNotes;
    if (trustScore) request.review.score = trustScore;
    await request.save();

    // Update user's trust score if approved
    if (status === 'approved') {
      const user = await User.findById(request.user);
      if (user) {
        const currentTrust = await user.ensureTrust();
        if (trustScore) {
          // Admin override — set the overall score directly
          currentTrust.overallScore = trustScore;
        } else {
          // Recalculate from weighted components
          currentTrust.calculateScore();
        }
        await currentTrust.save();
      }
    }

    // Send notification email to user (only if user has an email address)
    const user = await User.findById(request.user);
    if (user && user.email) {
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
    }

    res.status(200).json({
      success: true,
      message: 'Trust verification request reviewed successfully',
      data: request
    });
  } catch (error) {
    logger.error('Review trust verification request error:', error);
    return sendServerError(res, error, 'Failed to review verification request', 'REVIEW_REQUEST_ERROR');
  }
};

// @desc    Delete trust verification request
// @route   DELETE /api/trust-verification/:id
// @access  Private
const deleteVerificationRequestRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }
    const request = await VerificationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trust verification request not found'
      });
    }

    // Check if user is the owner of the request or admin (support multi-role)
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (request.user.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    // Check if request can be deleted (support multi-role)
    // Reuse userRoles and isAdmin from above
    if (request.status === 'approved' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Approved requests cannot be deleted'
      });
    }

    await VerificationRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trust verification request deleted successfully'
    });
  } catch (error) {
    logger.error('Delete trust verification request error:', error);
    return sendServerError(res, error, 'Failed to delete verification request', 'DELETE_REQUEST_ERROR');
  }
};

// @desc    Upload verification documents
// @route   POST /api/trust-verification/:id/documents
// @access  Private
const uploadVerificationDocuments = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const request = await VerificationRequest.findById(req.params.id);

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
      return sendServerError(res, new Error('All Cloudinary uploads failed'), 'Failed to upload any documents', 'UPLOAD_ALL_FAILED');
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
    logger.error('Upload verification documents error:', error);
    return sendServerError(res, error, 'Failed to upload documents', 'UPLOAD_DOCUMENTS_ERROR');
  }
};

// @desc    Delete verification document
// @route   DELETE /api/trust-verification/:id/documents/:documentId
// @access  Private
const deleteVerificationDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request id format.' });
    }
    if (!isValidObjectId(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id format.' });
    }

    const request = await VerificationRequest.findById(req.params.id);

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

    // Remove from request (Mongoose 7+ compatible)
    request.documents.pull(documentId);
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Delete verification document error:', error);
    return sendServerError(res, error, 'Failed to delete document', 'DELETE_DOCUMENT_ERROR');
  }
};

// @desc    Get user's trust verification requests
// @route   GET /api/trust-verification/my-requests
// @access  Private
const getMyVerificationRequestRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await VerificationRequest.find(filter)
      .populate('review.reviewedBy', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await VerificationRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    logger.error('Get my trust verification requests error:', error);
    return sendServerError(res, error, 'Failed to fetch your verification requests', 'GET_MY_REQUESTS_ERROR');
  }
};

// @desc    Get trust verification statistics
// @route   GET /api/trust-verification/statistics
// @access  Private (Admin only)
const getVerificationRequestStatistics = async (req, res) => {
  try {
    // Get total requests
    const totalRequests = await VerificationRequest.countDocuments();

    // Get requests by status
    const requestsByStatus = await VerificationRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get requests by type
    const requestsByType = await VerificationRequest.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await VerificationRequest.aggregate([
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
    const processingTime = await VerificationRequest.aggregate([
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
    logger.error('Get trust verification statistics error:', error);
    return sendServerError(res, error, 'Failed to fetch statistics', 'GET_STATISTICS_ERROR');
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
    logger.error('Get verified users error:', error);
    return sendServerError(res, error, 'Failed to fetch verified users', 'GET_VERIFIED_USERS_ERROR');
  }
};

module.exports = {
  getVerificationRequestRequests,
  getVerificationRequestRequest,
  createVerificationRequestRequest,
  updateVerificationRequestRequest,
  reviewVerificationRequestRequest,
  deleteVerificationRequestRequest,
  uploadVerificationDocuments,
  deleteVerificationDocument,
  getMyVerificationRequestRequests,
  getVerificationRequestStatistics,
  getVerifiedUsers
};
