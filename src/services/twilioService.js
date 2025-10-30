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
} else {
  console.warn('⚠️ Twilio credentials not provided or in development mode, using mock mode');
}

class TwilioService {
  static async sendVerificationCode(phoneNumber) {
    try {
      // Check if Twilio is properly configured
      if (!isTwilioConfigured || !client || !serviceSid) {
        return this._useMockVerification(phoneNumber, 'send');
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
      console.error('❌ Twilio verification error:', error.message);
      
      // Fallback to mock if Twilio fails
      if (error.status === 404) {
        console.warn('⚠️ Twilio service not found, falling back to mock mode');
        return this._useMockVerification(phoneNumber, 'send');
      }
      
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
        return this._useMockVerification(phoneNumber, 'verify', code);
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
      console.error('❌ Twilio verification check error:', error.message);
      
      // Fallback to mock if Twilio fails
      if (error.status === 404) {
        console.warn('⚠️ Twilio service not found, falling back to mock mode');
        return this._useMockVerification(phoneNumber, 'verify', code);
      }
      
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
        console.warn('Twilio not configured, logging SMS for development');
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
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mock verification for development/testing
  static _useMockVerification(phoneNumber, action, code = null) {
    console.warn('🔧 Using mock verification mode');
    
    if (action === 'send') {
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      logger.info(`📱 Mock verification code for ${phoneNumber}: ${mockCode}`);
      
      return {
        success: true,
        sid: `mock_${Date.now()}`,
        status: 'pending',
        mockCode: mockCode,
        isMock: true
      };
    } else if (action === 'verify') {
      // Accept any 6-digit code in mock mode
      if (code && code.length === 6 && /^\d{6}$/.test(code)) {
        logger.info(`✅ Mock verification approved for ${phoneNumber}`);
        return {
          success: true,
          status: 'approved',
          isMock: true
        };
      } else {
        logger.info(`❌ Mock verification denied for ${phoneNumber}`);
        return {
          success: false,
          status: 'denied',
          isMock: true
        };
      }
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
