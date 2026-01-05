const MaskedCallService = require('../services/maskedCallService');
const MaskedCall = require('../models/MaskedCall');
const logger = require('../config/logger');
const { 
  validateObjectId
} = require('../utils/controllerValidation');
const { 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError
} = require('../utils/responseHelper');

// @desc    Create masked call session
// @route   POST /api/masked-calls
// @access  Private
const createMaskedCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientId, jobId, conversationId } = req.body;

    if (!clientId || !validateObjectId(clientId).isValid) {
      return sendValidationError(res, ['Valid clientId is required']);
    }

    const jobIdValid = jobId ? validateObjectId(jobId).isValid : true;
    const conversationIdValid = conversationId ? validateObjectId(conversationId).isValid : true;

    if (!jobIdValid || !conversationIdValid) {
      return sendValidationError(res, ['Invalid jobId or conversationId']);
    }

    // Determine provider/client based on user role
    // For simplicity, assuming the requester is the provider
    const maskedCall = await MaskedCallService.createMaskedCall(userId, clientId, jobId, conversationId);

    return sendSuccess(res, maskedCall, 'Masked call session created successfully', 201);
  } catch (error) {
    logger.error('Error creating masked call:', error);
    if (error.message.includes('not found') || error.message.includes('not available')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to create masked call session');
  }
};

// @desc    Initiate call
// @route   POST /api/masked-calls/:id/initiate
// @access  Private
const initiateCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { toUserId } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid masked call ID']);
    }

    if (!toUserId || !validateObjectId(toUserId).isValid) {
      return sendValidationError(res, ['Valid toUserId is required']);
    }

    const call = await MaskedCallService.initiateCall(id, userId, toUserId);

    return sendSuccess(res, call, 'Call initiated successfully');
  } catch (error) {
    logger.error('Error initiating call:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to initiate call');
  }
};

// @desc    End call
// @route   POST /api/masked-calls/:id/calls/:callId/end
// @access  Private
const endCall = async (req, res) => {
  try {
    const { id, callId } = req.params;
    const { duration } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid masked call ID']);
    }

    if (!duration || isNaN(duration)) {
      return sendValidationError(res, ['Valid duration is required']);
    }

    const call = await MaskedCallService.endCall(id, callId, duration);

    return sendSuccess(res, call, 'Call ended successfully');
  } catch (error) {
    logger.error('Error ending call:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to end call');
  }
};

// @desc    Get masked call session
// @route   GET /api/masked-calls/:id
// @access  Private
const getMaskedCall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid masked call ID']);
    }

    const maskedCall = await MaskedCall.findById(id);

    if (!maskedCall) {
      return sendNotFoundError(res, 'Masked call session not found');
    }

    return sendSuccess(res, maskedCall);
  } catch (error) {
    logger.error('Error getting masked call:', error);
    return sendServerError(res, 'Failed to get masked call session');
  }
};

module.exports = {
  createMaskedCall,
  initiateCall,
  endCall,
  getMaskedCall
};
