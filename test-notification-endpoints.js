const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your-test-token-here';

// Test configuration
const config = {
  headers: {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

async function testNotificationEndpoints() {
  console.log('🧪 Testing Notification Endpoints...\n');

  try {
    // Test 1: Get user notifications
    console.log('1. Testing GET /api/communication/notifications');
    try {
      const response = await axios.get(`${BASE_URL}/api/communication/notifications`, config);
      console.log('✅ Success:', response.status, response.data.message || 'Notifications retrieved');
      console.log('   Count:', response.data.count || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Get notification count
    console.log('\n2. Testing GET /api/communication/notifications/count');
    try {
      const response = await axios.get(`${BASE_URL}/api/communication/notifications/count`, config);
      console.log('✅ Success:', response.status, response.data.message || 'Count retrieved');
      console.log('   Total count:', response.data.data?.count || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Get unread notifications only
    console.log('\n3. Testing GET /api/communication/notifications?isRead=false');
    try {
      const response = await axios.get(`${BASE_URL}/api/communication/notifications?isRead=false`, config);
      console.log('✅ Success:', response.status, response.data.message || 'Unread notifications retrieved');
      console.log('   Unread count:', response.data.count || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Mark all notifications as read
    console.log('\n4. Testing PUT /api/communication/notifications/read-all');
    try {
      const response = await axios.put(`${BASE_URL}/api/communication/notifications/read-all`, {}, config);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Modified count:', response.data.data?.modifiedCount || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 5: Test with pagination
    console.log('\n5. Testing GET /api/communication/notifications?page=1&limit=10');
    try {
      const response = await axios.get(`${BASE_URL}/api/communication/notifications?page=1&limit=10`, config);
      console.log('✅ Success:', response.status, response.data.message || 'Paginated notifications retrieved');
      console.log('   Page:', response.data.page, 'of', response.data.pages);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Notification endpoints testing completed!');

  } catch (error) {
    console.error('❌ Test setup error:', error.message);
  }
}

// Helper function to create a test notification (if you have admin access)
async function createTestNotification() {
  console.log('\n📝 Creating test notification...');
  
  // This would require admin access or a notification creation endpoint
  // For now, we'll just test the retrieval endpoints
  console.log('ℹ️  Note: To test notification creation, you would need to trigger notifications through other app actions (bookings, messages, etc.)');
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Notification Endpoints Test');
  console.log('Base URL:', BASE_URL);
  console.log('Token:', TEST_USER_TOKEN ? 'Provided' : 'Not provided (will likely fail)');
  console.log('='.repeat(50));
  
  testNotificationEndpoints()
    .then(() => createTestNotification())
    .catch(console.error);
}

module.exports = { testNotificationEndpoints };
