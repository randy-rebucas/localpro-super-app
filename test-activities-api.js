const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token

// Test data
const testActivity = {
  type: 'service_created',
  action: 'Created a new cleaning service',
  description: 'User created a new professional cleaning service for residential homes.',
  category: 'marketplace',
  impact: 'medium',
  visibility: 'public',
  targetEntity: {
    type: 'service',
    name: 'Professional Home Cleaning',
    url: '/services/123'
  },
  tags: ['cleaning', 'service', 'marketplace']
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
const testGetActivityFeed = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/feed...');
  const result = await makeRequest('GET', '/activities/feed', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved activity feed');
    console.log(`📊 Found ${result.data.data.activities.length} activities`);
  } else {
    console.log('❌ Failed to retrieve activity feed:', result.error);
  }
  
  return result;
};

const testGetUserActivities = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/my...');
  const result = await makeRequest('GET', '/activities/my', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved user activities');
    console.log(`📊 Found ${result.data.data.activities.length} user activities`);
  } else {
    console.log('❌ Failed to retrieve user activities:', result.error);
  }
  
  return result;
};

const testGetSpecificUserActivities = async (userId, token) => {
  console.log(`\n🧪 Testing GET /api/activities/user/${userId}...`);
  const result = await makeRequest('GET', `/activities/user/${userId}`, null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved specific user activities');
    console.log(`📊 Found ${result.data.data.activities.length} activities`);
  } else {
    console.log('❌ Failed to retrieve specific user activities:', result.error);
  }
  
  return result;
};

const testGetActivityById = async (id, token) => {
  console.log(`\n🧪 Testing GET /api/activities/${id}...`);
  const result = await makeRequest('GET', `/activities/${id}`, null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved activity by ID');
    console.log(`📝 Action: ${result.data.data.action}`);
  } else {
    console.log('❌ Failed to retrieve activity by ID:', result.error);
  }
  
  return result;
};

const testCreateActivity = async (token) => {
  console.log('\n🧪 Testing POST /api/activities...');
  const result = await makeRequest('POST', '/activities', testActivity, token);
  
  if (result.success) {
    console.log('✅ Successfully created activity');
    console.log(`🆔 Created activity ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    console.log('❌ Failed to create activity:', result.error);
    return null;
  }
};

const testUpdateActivity = async (id, token) => {
  console.log(`\n🧪 Testing PUT /api/activities/${id}...`);
  const updateData = {
    action: 'Updated cleaning service',
    impact: 'high'
  };
  
  const result = await makeRequest('PUT', `/activities/${id}`, updateData, token);
  
  if (result.success) {
    console.log('✅ Successfully updated activity');
    console.log(`📝 Updated action: ${result.data.data.action}`);
  } else {
    console.log('❌ Failed to update activity:', result.error);
  }
  
  return result;
};

const testAddInteraction = async (id, token) => {
  console.log(`\n🧪 Testing POST /api/activities/${id}/interactions...`);
  const interactionData = {
    type: 'like',
    metadata: { source: 'test' }
  };
  
  const result = await makeRequest('POST', `/activities/${id}/interactions`, interactionData, token);
  
  if (result.success) {
    console.log('✅ Successfully added interaction');
    console.log(`👍 Interaction type: ${result.data.data.interactionType}`);
  } else {
    console.log('❌ Failed to add interaction:', result.error);
  }
  
  return result;
};

const testRemoveInteraction = async (id, token) => {
  console.log(`\n🧪 Testing DELETE /api/activities/${id}/interactions...`);
  const interactionData = {
    type: 'like'
  };
  
  const result = await makeRequest('DELETE', `/activities/${id}/interactions`, interactionData, token);
  
  if (result.success) {
    console.log('✅ Successfully removed interaction');
    console.log(`👍 Removed interaction type: ${result.data.data.interactionType}`);
  } else {
    console.log('❌ Failed to remove interaction:', result.error);
  }
  
  return result;
};

const testGetActivityStats = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/stats/my...');
  const result = await makeRequest('GET', '/activities/stats/my', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved activity statistics');
    console.log(`📊 Total activities: ${result.data.data.stats.totalActivities}`);
    console.log(`🏆 Total points: ${result.data.data.stats.totalPoints}`);
  } else {
    console.log('❌ Failed to retrieve activity statistics:', result.error);
  }
  
  return result;
};

const testGetGlobalActivityStats = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/stats/global...');
  const result = await makeRequest('GET', '/activities/stats/global', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved global activity statistics');
    console.log(`📊 Total activities: ${result.data.data.stats.totalActivities}`);
    console.log(`👥 Unique users: ${result.data.data.stats.uniqueUserCount}`);
  } else {
    console.log('❌ Failed to retrieve global activity statistics:', result.error);
  }
  
  return result;
};

const testGetActivityMetadata = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/metadata...');
  const result = await makeRequest('GET', '/activities/metadata', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved activity metadata');
    console.log(`📋 Activity types: ${result.data.data.types.length}`);
    console.log(`📂 Categories: ${result.data.data.categories.length}`);
  } else {
    console.log('❌ Failed to retrieve activity metadata:', result.error);
  }
  
  return result;
};

const testDeleteActivity = async (id, token) => {
  console.log(`\n🧪 Testing DELETE /api/activities/${id}...`);
  const result = await makeRequest('DELETE', `/activities/${id}`, null, token);
  
  if (result.success) {
    console.log('✅ Successfully deleted activity');
  } else {
    console.log('❌ Failed to delete activity:', result.error);
  }
  
  return result;
};

// Test with query parameters
const testActivityFeedWithFilters = async (token) => {
  console.log('\n🧪 Testing GET /api/activities/feed with filters...');
  const result = await makeRequest('GET', '/activities/feed?types=service_created,booking_created&categories=marketplace&timeframe=7d&limit=10', null, token);
  
  if (result.success) {
    console.log('✅ Successfully retrieved filtered activity feed');
    console.log(`📊 Found ${result.data.data.activities.length} filtered activities`);
  } else {
    console.log('❌ Failed to retrieve filtered activity feed:', result.error);
  }
  
  return result;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Activities API Tests...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Test authenticated endpoints (will fail without valid token)
  if (TEST_TOKEN && TEST_TOKEN !== 'your-test-jwt-token-here') {
    console.log('\n🔐 Testing authenticated endpoints...');
    
    // Test metadata first (no data required)
    await testGetActivityMetadata(TEST_TOKEN);
    
    // Test activity feed
    await testGetActivityFeed(TEST_TOKEN);
    await testActivityFeedWithFilters(TEST_TOKEN);
    
    // Test user activities
    await testGetUserActivities(TEST_TOKEN);
    
    // Test with a sample user ID (this will likely fail if no users exist)
    await testGetSpecificUserActivities('507f1f77bcf86cd799439011', TEST_TOKEN);
    
    // Test activity creation and management
    const activityId = await testCreateActivity(TEST_TOKEN);
    
    if (activityId) {
      await testGetActivityById(activityId, TEST_TOKEN);
      await testUpdateActivity(activityId, TEST_TOKEN);
      await testAddInteraction(activityId, TEST_TOKEN);
      await testRemoveInteraction(activityId, TEST_TOKEN);
      await testGetActivityStats(TEST_TOKEN);
      await testGetGlobalActivityStats(TEST_TOKEN);
      await testDeleteActivity(activityId, TEST_TOKEN);
    }
  } else {
    console.log('\n⚠️  Skipping authenticated tests - no valid token provided');
    console.log('💡 To test authenticated endpoints, update TEST_TOKEN with a valid JWT token');
  }
  
  console.log('\n✨ Activities API tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetActivityFeed,
  testGetUserActivities,
  testGetSpecificUserActivities,
  testGetActivityById,
  testCreateActivity,
  testUpdateActivity,
  testAddInteraction,
  testRemoveInteraction,
  testGetActivityStats,
  testGetGlobalActivityStats,
  testGetActivityMetadata,
  testDeleteActivity,
  testActivityFeedWithFilters,
  runTests
};
