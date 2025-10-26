const twilio = require('twilio');
const logger = require('../utils/logger');


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Initialize Twilio client only if credentials are available
let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (error) {
    logger.warn('Twilio client initialization failed:', error.message);
  }
}

class TwilioService {
  static async sendVerificationCode(phoneNumber) {
    try {
      // Use mock in test environment or when Twilio is not properly configured
      if (process.env.NODE_ENV === 'test' || !client || !serviceSid ||
          accountSid === 'test_account_sid' || authToken === 'test_auth_token') {
        logger.warn('Twilio not configured or in test mode, using mock verification code');
        // Generate a mock verification code for development/testing
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        logger.info(`Mock verification code for ${phoneNumber}: ${mockCode}`);

        return {
          success: true,
          sid: `mock_${Date.now()}`,
          status: 'pending',
          mockCode: mockCode // Include mock code for development
        };
      }

      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        });

      return {
        success: true,
        sid: verification.sid,
        status: verification.status
      };
    } catch (error) {
      logger.error('Twilio verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async verifyCode(phoneNumber, code) {
    try {
      // Use mock in test environment or when Twilio is not properly configured
      if (process.env.NODE_ENV === 'test' || !client || !serviceSid ||
          accountSid === 'test_account_sid' || authToken === 'test_auth_token') {
        logger.warn('Twilio not configured or in test mode, accepting any 6-digit code for development/testing');
        // For development/testing, accept any 6-digit code
        if (code && code.length === 6 && /^\d{6}$/.test(code)) {
          return {
            success: true,
            status: 'approved'
          };
        } else {
          return {
            success: false,
            status: 'denied'
          };
        }
      }

      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        });

      return {
        success: verificationCheck.status === 'approved',
        status: verificationCheck.status
      };
    } catch (error) {
      logger.error('Twilio verification check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async sendSMS(to, message) {
    try {
      if (!client || !process.env.TWILIO_PHONE_NUMBER) {
        logger.warn('Twilio not configured, logging SMS for development');
        logger.info(`Mock SMS to ${to}: ${message}`);

        return {
          success: true,
          sid: `mock_sms_${Date.now()}`,
          status: 'sent'
        };
      }

      const sms = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      return {
        success: true,
        sid: sms.sid,
        status: sms.status
      };
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TwilioService;
