/**
 * Test Script for Mock Twilio Service
 * 
 * This script tests the mock Twilio implementation to ensure
 * it works correctly for development/testing.
 * 
 * Usage: node test-mock-twilio.js
 */

require('dotenv').config();

// Force test mode
process.env.TWILIO_TEST_MODE = 'true';

const TwilioService = require('./src/services/twilioService');

console.log('\n🧪 ====================================');
console.log('   Mock Twilio Service Test');
console.log('====================================\n');

async function runTests() {
  try {
    // Test 1: Send Verification Code
    console.log('📝 Test 1: Sending verification code...');
    const testPhoneNumber = '+1234567890';
    const sendResult = await TwilioService.sendVerificationCode(testPhoneNumber);
    
    if (sendResult.success) {
      console.log('✅ Send verification code: PASSED');
      console.log('   Mock SID:', sendResult.sid);
      console.log('   Status:', sendResult.status);
      console.log('   Mock mode:', sendResult.mock ? 'Yes' : 'No');
    } else {
      console.log('❌ Send verification code: FAILED');
      console.log('   Error:', sendResult.error);
    }

    console.log('');

    // Test 2: Verify Code (Valid format)
    console.log('📝 Test 2: Verifying code (valid format)...');
    const verifyResult = await TwilioService.verifyCode(testPhoneNumber, '123456');
    
    if (verifyResult.success) {
      console.log('✅ Verify code: PASSED');
      console.log('   Status:', verifyResult.status);
      console.log('   Valid:', verifyResult.valid);
    } else {
      console.log('❌ Verify code: FAILED');
      console.log('   Error:', verifyResult.error);
    }

    console.log('');

    // Test 3: Verify Code (Invalid format)
    console.log('📝 Test 3: Verifying code (invalid format - should fail)...');
    const verifyBadResult = await TwilioService.verifyCode(testPhoneNumber, '12345'); // Only 5 digits
    
    if (!verifyBadResult.success) {
      console.log('✅ Invalid code rejection: PASSED');
      console.log('   Error message:', verifyBadResult.error);
    } else {
      console.log('❌ Invalid code rejection: FAILED (should have rejected invalid code)');
    }

    console.log('');

    // Test 4: Send SMS
    console.log('📝 Test 4: Sending SMS...');
    const smsResult = await TwilioService.sendSMS(testPhoneNumber, 'Test message from mock Twilio');
    
    if (smsResult.success) {
      console.log('✅ Send SMS: PASSED');
      console.log('   Mock SID:', smsResult.sid);
      console.log('   Status:', smsResult.status);
    } else {
      console.log('❌ Send SMS: FAILED');
      console.log('   Error:', smsResult.error);
    }

    console.log('');

    // Test 5: Invalid Phone Number
    console.log('📝 Test 5: Testing invalid phone number (should fail)...');
    const invalidResult = await TwilioService.sendVerificationCode('1234567890'); // Missing +
    
    if (!invalidResult.success) {
      console.log('✅ Invalid phone rejection: PASSED');
      console.log('   Error message:', invalidResult.error);
    } else {
      console.log('❌ Invalid phone rejection: FAILED (should have rejected)');
    }

    console.log('');

    // Test 6: Get Service Status
    console.log('📝 Test 6: Getting service status...');
    if (typeof TwilioService.getStatus === 'function') {
      const status = TwilioService.getStatus();
      console.log('✅ Service status retrieved');
      console.log('   Test Mode:', status.isTestMode);
      console.log('   Mock Service:', status.isMockService);
      console.log('   Sent Codes Count:', status.sentCodesCount);
    } else {
      console.log('⚠️  Status method not available');
    }

    console.log('');

    // Summary
    console.log('====================================');
    console.log('✅ All mock Twilio tests completed!');
    console.log('====================================\n');
    
    console.log('💡 Tips:');
    console.log('  • In test mode, ANY 6-digit code works for verification');
    console.log('  • No real SMS messages are sent');
    console.log('  • No API calls to Twilio are made');
    console.log('  • Perfect for development and CI/CD');
    console.log('');
    console.log('🔧 To use in your app:');
    console.log('  • Set TWILIO_TEST_MODE=true in .env');
    console.log('  • Restart your server');
    console.log('  • Use any 6-digit code to verify\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
