#!/usr/bin/env node

/**
 * Twilio Setup and Troubleshooting Script
 * 
 * This script helps diagnose and fix Twilio configuration issues
 * Run with: node setup-twilio.js
 */

require('dotenv').config();
const TwilioService = require('../../src/services/twilioService');

class TwilioSetup {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async run() {
    console.log('🔧 Twilio Configuration Diagnostic Tool');
    console.log('=====================================\n');

    await this.checkEnvironmentVariables();
    await this.checkServiceStatus();
    await this.testVerification();
    
    console.log('\n📋 Next Steps:');
    this.printNextSteps();
  }

  async checkEnvironmentVariables() {
    console.log('1️⃣ Checking Environment Variables...');
    
    const vars = [
      { name: 'TWILIO_ACCOUNT_SID', value: this.accountSid, required: true },
      { name: 'TWILIO_AUTH_TOKEN', value: this.authToken, required: true },
      { name: 'TWILIO_VERIFY_SERVICE_SID', value: this.serviceSid, required: true },
      { name: 'TWILIO_PHONE_NUMBER', value: this.phoneNumber, required: false }
    ];

    let allConfigured = true;

    vars.forEach(variable => {
      if (variable.value) {
        console.log(`   ✅ ${variable.name}: ${variable.value.substring(0, 8)}...`);
      } else {
        console.log(`   ❌ ${variable.name}: Not set`);
        if (variable.required) {
          allConfigured = false;
        }
      }
    });

    if (allConfigured) {
      console.log('   ✅ All required environment variables are set\n');
    } else {
      console.log('   ❌ Missing required environment variables\n');
    }

    return allConfigured;
  }

  async checkServiceStatus() {
    console.log('2️⃣ Checking Twilio Service Status...');
    
    try {
      const status = await TwilioService.checkServiceStatus();
      
      if (status.configured) {
        console.log(`   ✅ Twilio service is active`);
        console.log(`   📝 Service Name: ${status.serviceName}`);
        console.log(`   📝 Status: ${status.status}`);
        console.log(`   📝 Message: ${status.message}\n`);
      } else {
        console.log(`   ❌ Twilio service issue: ${status.message}`);
        if (status.error) {
          console.log(`   📝 Error: ${status.error}\n`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking service status: ${error.message}\n`);
    }
  }

  async testVerification() {
    console.log('3️⃣ Testing Verification System...');
    
    const testPhoneNumber = '+1234567890';
    
    try {
      // Test sending verification code
      console.log(`   📱 Testing verification code send to ${testPhoneNumber}...`);
      const sendResult = await TwilioService.sendVerificationCode(testPhoneNumber);
      
      if (sendResult.success) {
        console.log(`   ✅ Verification code sent successfully`);
        if (sendResult.isMock) {
          console.log(`   🔧 Using mock mode - Code: ${sendResult.mockCode}`);
        }
        
        // Test verification code
        console.log(`   🔍 Testing verification code validation...`);
        const verifyResult = await TwilioService.verifyCode(testPhoneNumber, '123456');
        
        if (verifyResult.success) {
          console.log(`   ✅ Verification code validation works`);
          if (verifyResult.isMock) {
            console.log(`   🔧 Using mock mode for verification`);
          }
        } else {
          console.log(`   ❌ Verification code validation failed: ${verifyResult.error}`);
        }
      } else {
        console.log(`   ❌ Failed to send verification code: ${sendResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
    }
    
    console.log('');
  }

  printNextSteps() {
    console.log('If you see issues above, follow these steps:\n');
    
    console.log('🔧 For Twilio Service Not Found (404 Error):');
    console.log('   1. Go to https://console.twilio.com/');
    console.log('   2. Navigate to Verify → Services');
    console.log('   3. Create a new service or check existing service');
    console.log('   4. Copy the Service SID (starts with VA...)');
    console.log('   5. Update TWILIO_VERIFY_SERVICE_SID in your .env file\n');
    
    console.log('🔧 For Missing Environment Variables:');
    console.log('   1. Copy env.example to .env: cp env.example .env');
    console.log('   2. Edit .env with your actual Twilio credentials');
    console.log('   3. Restart your application\n');
    
    console.log('🔧 For Development/Testing:');
    console.log('   1. The app will automatically use mock mode if Twilio is not configured');
    console.log('   2. Mock codes will be logged to console');
    console.log('   3. Any 6-digit code will work in mock mode\n');
    
    console.log('📞 Twilio Account Setup:');
    console.log('   1. Sign up at https://www.twilio.com/try-twilio');
    console.log('   2. Get your Account SID and Auth Token from Console Dashboard');
    console.log('   3. Create a Verify Service in Console → Verify → Services');
    console.log('   4. Optionally purchase a phone number for SMS\n');
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  const setup = new TwilioSetup();
  setup.run().catch(console.error);
}

module.exports = TwilioSetup;
