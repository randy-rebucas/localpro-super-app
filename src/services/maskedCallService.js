/**
 * Masked Call Service
 * 
 * Handles masked calling functionality for privacy protection
 * References: MaskedCall, Conversation, Job, User
 * 
 * Note: This service integrates with Twilio for actual calling functionality
 */

const MaskedCall = require('../models/MaskedCall');
const { Conversation } = require('../models/Communication');
const User = require('../models/User');
const logger = require('../config/logger');

class MaskedCallService {
  /**
   * Create masked call session
   */
  async createMaskedCall(providerId, clientId, jobId = null, conversationId = null) {
    try {
      // Check if active masked call already exists
      const existing = await MaskedCall.findActive(providerId, clientId, jobId);
      if (existing) {
        return existing;
      }

      // Get phone numbers
      const provider = await User.findById(providerId);
      const client = await User.findById(clientId);

      if (!provider || !client) {
        throw new Error('User not found');
      }

      if (!provider.phoneNumber || !client.phoneNumber) {
        throw new Error('Phone numbers not available');
      }

      // Generate masked number (in production, this would use Twilio phone numbers)
      // For now, we'll use a placeholder format
      const maskedNumber = this._generateMaskedNumber();

      // Set expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const maskedCall = new MaskedCall({
        provider: providerId,
        client: clientId,
        job: jobId,
        conversation: conversationId,
        providerPhone: provider.phoneNumber,
        clientPhone: client.phoneNumber,
        maskedNumber: maskedNumber,
        isActive: true,
        expiresAt: expiresAt
      });

      await maskedCall.save();

      // Update conversation if exists
      if (conversationId) {
        await Conversation.findByIdAndUpdate(conversationId, {
          'maskedCall.enabled': true,
          'maskedCall.providerPhone': provider.phoneNumber,
          'maskedCall.clientPhone': client.phoneNumber,
          'maskedCall.maskedNumber': maskedNumber
        });
      }

      return maskedCall;
    } catch (error) {
      logger.error('Error creating masked call:', error);
      throw error;
    }
  }

  /**
   * Initiate call (integration with Twilio)
   */
  async initiateCall(maskedCallId, fromUserId, _toUserId) {
    try {
      const maskedCall = await MaskedCall.findById(maskedCallId);
      if (!maskedCall) {
        throw new Error('Masked call not found');
      }

      // Determine direction
      let fromNumber, toNumber, direction;
      if (maskedCall.provider.toString() === fromUserId.toString()) {
        fromNumber = maskedCall.providerPhone;
        toNumber = maskedCall.clientPhone;
        direction = 'outbound';
      } else {
        fromNumber = maskedCall.clientPhone;
        toNumber = maskedCall.providerPhone;
        direction = 'inbound';
      }

      // In production, use Twilio to initiate call through masked number
      // This is a placeholder - actual implementation would use Twilio API
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      maskedCall.calls.push({
        callId: callId,
        direction: direction,
        from: fromNumber,
        to: toNumber,
        status: 'initiated',
        startedAt: new Date()
      });

      await maskedCall.save();

      logger.info(`Masked call initiated: ${callId} from ${fromNumber} to ${toNumber}`);

      // TODO: Integrate with Twilio to actually place the call
      // const call = await twilioClient.calls.create({
      //   url: `${process.env.APP_URL}/api/masked-calls/connect/${callId}`,
      //   to: toNumber,
      //   from: maskedCall.maskedNumber
      // });

      return maskedCall.calls[maskedCall.calls.length - 1];
    } catch (error) {
      logger.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * End call
   */
  async endCall(maskedCallId, callId, duration) {
    try {
      const maskedCall = await MaskedCall.findById(maskedCallId);
      if (!maskedCall) {
        throw new Error('Masked call not found');
      }

      const call = maskedCall.calls.id(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      call.status = 'completed';
      call.endedAt = new Date();
      call.duration = duration;

      await maskedCall.save();
      return call;
    } catch (error) {
      logger.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Generate masked number (placeholder - in production use Twilio numbers)
   */
  _generateMaskedNumber() {
    // This is a placeholder - in production, you'd allocate a Twilio phone number
    const random = Math.floor(Math.random() * 10000000);
    return `+1${555}${String(random).padStart(7, '0')}`;
  }
}

module.exports = new MaskedCallService();
