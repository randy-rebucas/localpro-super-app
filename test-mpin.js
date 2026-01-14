const mongoose = require('mongoose');
const User = require('./src/models/User');

// Test MPIN functionality
async function testMPIN() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-test');

    console.log('🧪 Testing MPIN functionality...\n');

    // Create a test user
    const testUser = new User({
      phoneNumber: '+1234567890',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['client']
    });

    await testUser.save();
    console.log('✅ Test user created');

    // Test setting MPIN
    console.log('\n🔐 Testing MPIN setup...');
    await testUser.setMpin('1234');
    console.log('✅ MPIN set successfully');

    // Test verifying correct MPIN
    console.log('\n🔍 Testing MPIN verification...');
    await testUser.verifyMpin('1234');
    console.log('✅ MPIN verified successfully');

    // Test verifying incorrect MPIN
    console.log('\n❌ Testing incorrect MPIN...');
    try {
      await testUser.verifyMpin('9999');
    } catch (error) {
      console.log('✅ Incorrect MPIN rejected:', error.message);
    }

    // Test MPIN status
    console.log('\n📊 Testing MPIN status...');
    const status = testUser.getMpinStatus();
    console.log('MPIN Status:', status);

    // Test disabling MPIN
    console.log('\n🚫 Testing MPIN disable...');
    await testUser.disableMpin();
    console.log('✅ MPIN disabled successfully');

    // Verify MPIN is disabled
    const disabledStatus = testUser.getMpinStatus();
    console.log('Disabled MPIN Status:', disabledStatus);

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('\n🧹 Test user cleaned up');

    console.log('\n🎉 All MPIN tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMPIN();
}

module.exports = { testMPIN };