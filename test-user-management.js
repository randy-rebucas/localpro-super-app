const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// Test data
const testUser = {
  phoneNumber: '+1234567890',
  email: 'testuser@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'client'
};

const testAgencyUser = {
  phoneNumber: '+1234567891',
  email: 'agencyuser@example.com',
  firstName: 'Agency',
  lastName: 'User',
  role: 'provider',
  agencyId: '507f1f77bcf86cd799439011', // Replace with actual agency ID
  agencyRole: 'provider'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = ADMIN_TOKEN) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testGetAllUsers = async () => {
  console.log('\n🧪 Testing GET /api/users (Get all users)');
  const result = await makeRequest('GET', '/users?page=1&limit=10');
  
  if (result.success) {
    console.log('✅ Success:', result.data.message || 'Users retrieved successfully');
    console.log(`📊 Found ${result.data.data?.pagination?.total || 0} users`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testGetUserStats = async () => {
  console.log('\n🧪 Testing GET /api/users/stats (Get user statistics)');
  const result = await makeRequest('GET', '/users/stats');
  
  if (result.success) {
    console.log('✅ Success:', 'User statistics retrieved');
    console.log('📊 Stats:', JSON.stringify(result.data.data, null, 2));
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testCreateUser = async () => {
  console.log('\n🧪 Testing POST /api/users (Create user)');
  const result = await makeRequest('POST', '/users', testUser);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('👤 Created user:', result.data.data.firstName, result.data.data.lastName);
    return result.data.data._id;
  } else {
    console.log('❌ Failed:', result.error);
    return null;
  }
};

const testGetUserById = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping GET /api/users/:id (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing GET /api/users/:id (Get user by ID)');
  const result = await makeRequest('GET', `/users/${userId}`);
  
  if (result.success) {
    console.log('✅ Success:', 'User retrieved successfully');
    console.log('👤 User:', result.data.data.firstName, result.data.data.lastName);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testUpdateUser = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping PUT /api/users/:id (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing PUT /api/users/:id (Update user)');
  const updateData = {
    firstName: 'Updated',
    lastName: 'User',
    profile: {
      bio: 'Updated bio for testing'
    }
  };
  
  const result = await makeRequest('PUT', `/users/${userId}`, updateData);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('👤 Updated user:', result.data.data.firstName, result.data.data.lastName);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testUpdateUserStatus = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping PATCH /api/users/:id/status (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing PATCH /api/users/:id/status (Update user status)');
  const statusData = {
    isActive: false,
    reason: 'Testing user management system'
  };
  
  const result = await makeRequest('PATCH', `/users/${userId}/status`, statusData);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('📊 Status updated:', result.data.data.isActive);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testUpdateUserVerification = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping PATCH /api/users/:id/verification (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing PATCH /api/users/:id/verification (Update user verification)');
  const verificationData = {
    verification: {
      phoneVerified: true,
      emailVerified: true,
      identityVerified: true
    }
  };
  
  const result = await makeRequest('PATCH', `/users/${userId}/verification`, verificationData);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('🔐 Verification updated:', result.data.data.verification);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testAddUserBadge = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping POST /api/users/:id/badges (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing POST /api/users/:id/badges (Add user badge)');
  const badgeData = {
    type: 'verified_provider',
    description: 'Test badge for user management system'
  };
  
  const result = await makeRequest('POST', `/users/${userId}/badges`, badgeData);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('🏆 Badge added:', result.data.data.badges);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testBulkUpdateUsers = async () => {
  console.log('\n🧪 Testing PATCH /api/users/bulk (Bulk update users)');
  
  // First, get some user IDs
  const usersResult = await makeRequest('GET', '/users?limit=5');
  if (!usersResult.success || !usersResult.data.data?.users?.length) {
    console.log('⏭️  Skipping bulk update (No users available)');
    return null;
  }
  
  const userIds = usersResult.data.data.users.slice(0, 2).map(user => user._id);
  const bulkData = {
    userIds,
    updateData: {
      tags: ['test_bulk_update']
    }
  };
  
  const result = await makeRequest('PATCH', '/users/bulk', bulkData);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
    console.log('📊 Bulk update result:', result.data.data);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

const testDeleteUser = async (userId) => {
  if (!userId) {
    console.log('\n⏭️  Skipping DELETE /api/users/:id (No user ID available)');
    return null;
  }

  console.log('\n🧪 Testing DELETE /api/users/:id (Delete user)');
  const result = await makeRequest('DELETE', `/users/${userId}`);
  
  if (result.success) {
    console.log('✅ Success:', result.data.message);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting User Management API Tests');
  console.log('=' .repeat(50));
  
  try {
    // Test basic endpoints
    await testGetAllUsers();
    await testGetUserStats();
    
    // Test user creation and management
    const userId = await testCreateUser();
    
    if (userId) {
      await testGetUserById(userId);
      await testUpdateUser(userId);
      await testUpdateUserVerification(userId);
      await testAddUserBadge(userId);
      await testUpdateUserStatus(userId);
      
      // Test bulk operations
      await testBulkUpdateUsers();
      
      // Clean up - delete test user
      await testDeleteUser(userId);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ User Management API Tests Completed');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testGetAllUsers,
  testGetUserStats,
  testCreateUser,
  testGetUserById,
  testUpdateUser,
  testUpdateUserStatus,
  testUpdateUserVerification,
  testAddUserBadge,
  testBulkUpdateUsers,
  testDeleteUser
};
