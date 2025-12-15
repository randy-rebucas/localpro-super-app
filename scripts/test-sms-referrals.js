/**
 * Test SMS Referral Invitations
 * 
 * Usage:
 * node scripts/test-sms-referrals.js [userId] [phoneNumber]
 * 
 * Example:
 * node scripts/test-sms-referrals.js 507f1f77bcf86cd799439011 +1234567890
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ReferralService = require('../src/services/referralService');
const User = require('../src/models/User');
const logger = require('../src/config/logger');

async function testSMSReferrals() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app');
    logger.info('✅ Connected to database');

    // Get arguments
    const userId = process.argv[2];
    const phoneNumber = process.argv[3];

    if (!userId || !phoneNumber) {
      console.log('Usage: node scripts/test-sms-referrals.js [userId] [phoneNumber]');
      console.log('Example: node scripts/test-sms-referrals.js 507f1f77bcf86cd799439011 +1234567890');
      process.exit(1);
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`\n📱 Testing SMS Referral Invitations`);
    console.log(`User: ${user.firstName} ${user.lastName} (${user.email || user.phoneNumber})`);
    console.log(`Phone Number: ${phoneNumber}\n`);

    // Test 1: Send single SMS invitation
    console.log('Test 1: Sending single SMS invitation...');
    const result1 = await ReferralService.sendSMSReferralInvitation(
      userId,
      phoneNumber,
      'Hi! Join me on LocalPro and get started with a bonus!'
    );

    console.log('Result:', JSON.stringify(result1, null, 2));

    if (result1.success) {
      console.log('✅ SMS invitation sent successfully');
      console.log(`   Success Count: ${result1.successCount}`);
      console.log(`   Failure Count: ${result1.failureCount}`);
    } else {
      console.log('❌ SMS invitation failed');
      console.log(`   Error: ${result1.error}`);
    }

    // Test 2: Send multiple SMS invitations
    console.log('\nTest 2: Sending multiple SMS invitations...');
    const phoneNumbers = [phoneNumber, phoneNumber]; // Same number twice to test
    const result2 = await ReferralService.sendSMSReferralInvitation(
      userId,
      phoneNumbers,
      'Custom message for multiple recipients'
    );

    console.log('Result:', JSON.stringify(result2, null, 2));

    // Test 3: Test rate limiting
    console.log('\nTest 3: Testing rate limiting (sending 12 SMS in quick succession)...');
    const results = [];
    for (let i = 0; i < 12; i++) {
      try {
        const result = await ReferralService.sendSMSReferralInvitation(
          userId,
          phoneNumber,
          `Test message ${i + 1}`
        );
        results.push(result);
        if (result.rateLimitExceeded) {
          console.log(`⚠️  Rate limit hit at attempt ${i + 1}`);
          break;
        }
        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Error at attempt ${i + 1}:`, error.message);
      }
    }

    const successful = results.filter(r => r.success).length;
    const rateLimited = results.filter(r => r.rateLimitExceeded).length;
    console.log(`\nRate Limit Test Results:`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Rate Limited: ${rateLimited}`);

    // Test 4: Check SMS preferences
    console.log('\nTest 4: Checking SMS preferences...');
    const UserSettings = require('../src/models/UserSettings');
    const userSettings = await UserSettings.findOne({ userId });
    const smsEnabled = userSettings?.notifications?.sms?.enabled ?? true;
    const referralSMSEnabled = userSettings?.notifications?.sms?.referralInvitations ?? true;

    console.log(`   SMS Enabled: ${smsEnabled}`);
    console.log(`   Referral SMS Enabled: ${referralSMSEnabled}`);

    // Test 5: Get referral analytics
    console.log('\nTest 5: Checking referral analytics...');
    const userReferral = await user.ensureReferral();
    const smsInvitations = userReferral.analytics?.smsInvitations || [];
    console.log(`   Total SMS Invitations Sent: ${smsInvitations.length}`);
    console.log(`   Recent SMS Invitations:`, smsInvitations.slice(-5).map(inv => ({
      sentAt: inv.sentAt,
      smsSid: inv.smsSid
    })));

    console.log('\n✅ All tests completed!');
    console.log('\nNote: Make sure Twilio is configured in .env:');
    console.log('   TWILIO_ACCOUNT_SID');
    console.log('   TWILIO_AUTH_TOKEN');
    console.log('   TWILIO_PHONE_NUMBER');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('SMS referral test error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run tests
testSMSReferrals();

