/**
 * Mock Twilio Service for Testing/Development
 * 
 * This mock service simulates Twilio's Verify API without making real API calls.
 * Perfect for development, testing, and CI/CD environments.
 * 
 * Features:
 * - Simulates sending verification codes
 * - Accepts any 6-digit code for verification
 * - Logs all operations for debugging
 * - No external API calls or costs
 */

const logger = require('../config/logger');

class TwilioServiceMock {
  constructor() {
    this.sentCodes = new Map(); // Store sent codes for validation
    this.isTestMode = true;
    logger.info('🧪 Mock Twilio Service initialized (TEST MODE)');
  }

  /**
   * Mock: Send verification code
   * Simulates sending SMS but doesn't actually send anything
   */
  async sendVerificationCode(phoneNumber) {
    try {
      // Validate phone number format
      if (!this._isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Generate a random 6-digit code for logging purposes
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code (in test mode, any code will work, but we store for reference)
      this.sentCodes.set(phoneNumber, {
        code: mockCode,
        timestamp: Date.now(),
        status: 'pending'
      });

      // Clean up old codes (older than 10 minutes)
      this._cleanupOldCodes();

      logger.info('🧪 [MOCK] Verification code sent', {
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        mockCode: mockCode, // In real mode, never log the actual code!
        note: 'In test mode, ANY 6-digit code will work for verification'
      });

      // Simulate Twilio's response
      return {
        success: true,
        sid: `SM${this._generateMockSid()}`,
        status: 'pending',
        mock: true
      };
    } catch (error) {
      logger.error('🧪 [MOCK] Verification error:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code || 'MOCK_ERROR',
        mock: true
      };
    }
  }

  /**
   * Mock: Verify code
   * In test mode, accepts ANY valid 6-digit code
   */
  async verifyCode(phoneNumber, code) {
    try {
      // Validate phone number format
      if (!this._isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Validate code format (6 digits)
      if (!code || !/^\d{6}$/.test(code)) {
        return {
          success: false,
          status: 'failed',
          error: 'Invalid code format. Must be 6 digits.',
          mock: true
        };
      }

      // Check if a code was sent to this number
      const sentCode = this.sentCodes.get(phoneNumber);
      
      if (!sentCode) {
        logger.warn('🧪 [MOCK] No code was sent to this number, but accepting anyway (test mode)');
      } else {
        // Mark as approved
        sentCode.status = 'approved';
        this.sentCodes.set(phoneNumber, sentCode);
      }

      logger.info('🧪 [MOCK] Code verified successfully', {
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        providedCode: code,
        note: 'In test mode, all valid 6-digit codes are accepted'
      });

      // Simulate Twilio's successful verification response
      return {
        success: true,
        status: 'approved',
        valid: true,
        mock: true
      };
    } catch (error) {
      logger.error('🧪 [MOCK] Verification error:', error.message);
      return {
        success: false,
        status: 'failed',
        error: error.message,
        code: error.code || 'MOCK_ERROR',
        mock: true
      };
    }
  }

  /**
   * Mock: Send SMS
   * Simulates sending SMS messages
   */
  async sendSMS(to, message) {
    try {
      // Validate phone number
      if (!this._isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Validate message
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      logger.info('🧪 [MOCK] SMS sent', {
        to: to.substring(0, 5) + '***',
        messageLength: message.length,
        messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        note: 'This is a mock SMS - no actual message was sent'
      });

      // Simulate Twilio's SMS response
      return {
        success: true,
        sid: `SM${this._generateMockSid()}`,
        status: 'queued',
        mock: true
      };
    } catch (error) {
      logger.error('🧪 [MOCK] SMS error:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code || 'MOCK_ERROR',
        mock: true
      };
    }
  }

  /**
   * Get status of mock service
   */
  getStatus() {
    return {
      isTestMode: true,
      isMockService: true,
      sentCodesCount: this.sentCodes.size,
      message: 'Mock Twilio service is active. All verification codes are accepted.'
    };
  }

  /**
   * Get sent codes (for debugging only - never expose in production!)
   */
  getSentCodes() {
    const codes = {};
    this.sentCodes.forEach((value, key) => {
      codes[key.substring(0, 5) + '***'] = {
        code: value.code,
        status: value.status,
        timestamp: new Date(value.timestamp).toISOString()
      };
    });
    return codes;
  }

  /**
   * Clear all stored codes
   */
  clearCodes() {
    this.sentCodes.clear();
    logger.info('🧪 [MOCK] All stored verification codes cleared');
  }

  // Private helper methods

  /**
   * Validate phone number format (E.164)
   */
  _isValidPhoneNumber(phoneNumber) {
    // Basic phone number validation: +[country code][number]
    // E.164 format: +[1-9]\d{1,14}
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Generate a mock SID (similar to Twilio's format)
   */
  _generateMockSid() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let sid = '';
    for (let i = 0; i < 32; i++) {
      sid += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return sid;
  }

  /**
   * Clean up verification codes older than 10 minutes
   */
  _cleanupOldCodes() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [phoneNumber, data] of this.sentCodes.entries()) {
      if (now - data.timestamp > maxAge) {
        this.sentCodes.delete(phoneNumber);
      }
    }
  }
}

// Export singleton instance
module.exports = new TwilioServiceMock();
