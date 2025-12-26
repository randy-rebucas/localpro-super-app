const twilio = require('twilio');
const logger = require('../config/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Initialize Twilio client only if credentials are available
let client = null;
let isTwilioConfigured = false;

if (accountSid && authToken && serviceSid) {
  try {
    client = twilio(accountSid, authToken);
    isTwilioConfigured = true;
    logger.info('✅ Twilio client initialized successfully');
  } catch (error) {
    console.warn('⚠️ Twilio client initialization failed:', error.message);
  }
}

class TwilioService {
  static async sendVerificationCode(phoneNumber) {
    try {
      // Check if Twilio is properly configured
      if (!isTwilioConfigured || !client || !serviceSid) {
        throw new Error('Twilio service not configured. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.');
      }

      // Validate phone number format
      if (!this._isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        });

      logger.info(`✅ Verification code sent to ${phoneNumber.substring(0, 5)}***`);
      
      return {
        success: true,
        sid: verification.sid,
        status: verification.status
      };
    } catch (error) {
      logger.error('❌ Twilio verification error:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  static async verifyCode(phoneNumber, code) {
    try {
      // Check if Twilio is properly configured
      if (!isTwilioConfigured || !client || !serviceSid) {
        throw new Error('Twilio service not configured. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.');
      }

      // Validate code format
      if (!this._isValidCode(code)) {
        throw new Error('Invalid verification code format');
      }

      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        });

      const isApproved = verificationCheck.status === 'approved';
      logger.info(`✅ Verification ${isApproved ? 'approved' : 'denied'} for ${phoneNumber.substring(0, 5)}***`);

      return {
        success: isApproved,
        status: verificationCheck.status
      };
    } catch (error) {
      logger.error('❌ Twilio verification check error:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  static async sendSMS(to, message) {
    try {
      if (!client || !process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio SMS not configured. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
      }

      // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
      const normalizePhone = (phone) => phone ? phone.replace(/[\s\-()]/g, '') : '';
      const fromNumber = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
      const toNumber = normalizePhone(to);

      // Check if 'to' and 'from' numbers are the same
      if (fromNumber === toNumber) {
        logger.warn(`⚠️ Skipping SMS: Cannot send SMS from and to the same number (${fromNumber.substring(0, 5)}***)`);
        return {
          success: false,
          error: 'Cannot send SMS to the same number as the sender',
          code: 'SAME_NUMBER_ERROR',
          skipped: true
        };
      }

      // Validate phone number format
      if (!this._isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      const sms = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      logger.info(`✅ SMS sent to ${toNumber.substring(0, 5)}***`);
      
      return {
        success: true,
        sid: sms.sid,
        status: sms.status
      };
    } catch (error) {
      logger.error('❌ Twilio SMS error:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // Utility methods
  static _isValidPhoneNumber(phoneNumber) {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  static _isValidCode(code) {
    // Validate 6-digit numeric code
    return code && code.length === 6 && /^\d{6}$/.test(code);
  }

  // Check Twilio service status
  static async checkServiceStatus() {
    try {
      if (!isTwilioConfigured || !client || !serviceSid) {
        return {
          configured: false,
          message: 'Twilio not configured',
          isTwilioConfigured,
          hasClient: !!client,
          hasServiceSid: !!serviceSid
        };
      }

      const service = await client.verify.v2.services(serviceSid).fetch();
      
      return {
        configured: true,
        serviceName: service.friendlyName,
        status: 'active',
        message: 'Twilio service is active'
      };
    } catch (error) {
      return {
        configured: false,
        error: error.message,
        message: 'Twilio service not found or inactive',
        isTwilioConfigured,
        hasClient: !!client,
        hasServiceSid: !!serviceSid
      };
    }
  }
}

module.exports = TwilioService;
