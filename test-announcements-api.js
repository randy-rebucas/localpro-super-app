const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token

// Test data
const testAnnouncement = {
  title: 'Test Announcement',
  content: 'This is a test announcement content that should be at least 10 characters long.',
  summary: 'This is a test announcement summary that should be at least 10 characters long.',
  type: 'general',
  priority: 'medium',
  targetAudience: 'all',
  isSticky: false,
  allowComments: true,
  requireAcknowledgment: false,
  tags: ['test', 'api']
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testGetAnnouncements = async () => {
  console.log('\n🧪 Testing GET /api/announcements...');
  const result = await makeRequest('GET', '/announcements');
  
  if (result.success) {
    console.log('✅ Successfully retrieved announcements');
    console.log(`📊 Found ${result.data.data.announcements.length} announcements`);
  } else {
    console.log('❌ Failed to retrieve announcements:', result.error);
  }
  
  return result;
};

const testGetAnnouncementById = async (id) => {
  console.log(`\n🧪 Testing GET /api/announcements/${id}...`);
  const result = await makeRequest('GET', `/announcements/${id}`);
  
  if (result.success) {
    console.log('✅ Successfully retrieved announcement by ID');
    console.log(`📝 Title: ${result.data.data.title}`);
  } else {
    console.log('❌ Failed to retrieve announcement by ID:', result.error);
  }
  
  return result;
};

const testCreateAnnouncement = async (token) => {
  console.log('\n🧪 Testing POST /api/announcements...');
  const result = await makeRequest('POST', '/announcements', testAnnouncement, token);
  
  if (result.success) {
    console.log('✅ Successfully created announcement');
    console.log(`🆔 Created announcement ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    console.log('❌ Failed to create announcement:', result.error);
    return null;
  }
};

const testUpdateAnnouncement = async (id, token) => {
  console.log(`\n🧪 Testing PUT /api/announcements/${id}...`);
  const updateData = {
    title: 'Updated Test Announcement',
    priority: 'high'
  };
  
  const result = await makeRequest('PUT', `/announcements/${id}`, updateData, token);
  
  if (result.success) {
    console.log('✅ Successfully updated announcement');
    console.log(`📝 Updated title: ${result.data.data.title}`);
  } else {
    console.log('❌ Failed to update announcement:', result.error);
  }
  
  return result;
};

const testAcknowledgeAnnouncement = async (id, token) => {
  console.log(`\n🧪 Testing POST /api/announcements/${id}/acknowledge...`);
  const result = await makeRequest('POST', `/announcements/${id}/acknowledge`, null, token);
  
  if (result.success) {
    console.log('✅ Successfully acknowledged announcement');
    console.log(`👍 Acknowledgment count: ${result.data.data.acknowledgmentCount}`);
  } else {
    console.log('❌ Failed to acknowledge announcement:', result.error);
  }
  
  return result;
};

const testAddComment = async (id, token) => {
  console.log(`\n🧪 Testing POST /api/announcements/${id}/comments...`);
  const commentData = {
    content: 'This is a test comment for the announcement.'
  };
  
  const result = await makeRequest('POST', `/announcements/${id}/comments`, commentData, token);
  
  if (result.success) {
    console.log('✅ Successfully added comment');
    console.log(`💬 Total comments: ${result.data.data.totalComments}`);
  } else {
    console.log('❌ Failed to add comment:', result.error);
  }
  
  return result;
};

const testGetMyAnnouncements = async (token) => {
  console.log('\n🧪 Testing GET /api/announcements/my/list...');
  const result = await makeRequest('GET', '/announcements/my/list', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved user announcements');
    console.log(`📊 Found ${result.data.data.announcements.length} user announcements`);
  } else {
    console.log('❌ Failed to retrieve user announcements:', result.error);
  }
  
  return result;
};

const testGetAnnouncementStats = async (token) => {
  console.log('\n🧪 Testing GET /api/announcements/admin/statistics...');
  const result = await makeRequest('GET', '/announcements/admin/statistics', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved announcement statistics');
    console.log(`📊 Total announcements: ${result.data.data.overview.totalAnnouncements}`);
  } else {
    console.log('❌ Failed to retrieve announcement statistics:', result.error);
  }
  
  return result;
};

const testDeleteAnnouncement = async (id, token) => {
  console.log(`\n🧪 Testing DELETE /api/announcements/${id}...`);
  const result = await makeRequest('DELETE', `/announcements/${id}`, null, token);
  
  if (result.success) {
    console.log('✅ Successfully deleted announcement');
  } else {
    console.log('❌ Failed to delete announcement:', result.error);
  }
  
  return result;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Announcements API Tests...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Test public endpoints (no authentication required)
  await testGetAnnouncements();
  
  // Test with a sample ID (this will likely fail if no announcements exist)
  await testGetAnnouncementById('507f1f77bcf86cd799439011');
  
  // Test authenticated endpoints (will fail without valid token)
  if (TEST_TOKEN && TEST_TOKEN !== 'your-test-jwt-token-here') {
    console.log('\n🔐 Testing authenticated endpoints...');
    
    const announcementId = await testCreateAnnouncement(TEST_TOKEN);
    
    if (announcementId) {
      await testUpdateAnnouncement(announcementId, TEST_TOKEN);
      await testAcknowledgeAnnouncement(announcementId, TEST_TOKEN);
      await testAddComment(announcementId, TEST_TOKEN);
      await testGetMyAnnouncements(TEST_TOKEN);
      await testGetAnnouncementStats(TEST_TOKEN);
      await testDeleteAnnouncement(announcementId, TEST_TOKEN);
    }
  } else {
    console.log('\n⚠️  Skipping authenticated tests - no valid token provided');
    console.log('💡 To test authenticated endpoints, update TEST_TOKEN with a valid JWT token');
  }
  
  console.log('\n✨ Announcements API tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetAnnouncements,
  testGetAnnouncementById,
  testCreateAnnouncement,
  testUpdateAnnouncement,
  testAcknowledgeAnnouncement,
  testAddComment,
  testGetMyAnnouncements,
  testGetAnnouncementStats,
  testDeleteAnnouncement,
  runTests
};
