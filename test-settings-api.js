const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token
const ADMIN_TOKEN = 'your-admin-jwt-token-here'; // Replace with actual admin token

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testUserSettings = async () => {
  console.log('\n=== Testing User Settings API ===\n');

  // 1. Get user settings
  console.log('1. Getting user settings...');
  const getSettings = await makeRequest('GET', '/settings/user', null, TEST_USER_TOKEN);
  console.log('User settings:', JSON.stringify(getSettings, null, 2));

  // 2. Update user settings
  console.log('\n2. Updating user settings...');
  const updateData = {
    privacy: {
      profileVisibility: 'contacts_only',
      showPhoneNumber: false,
      showEmail: true
    },
    notifications: {
      push: {
        enabled: true,
        newMessages: true,
        marketing: false
      },
      email: {
        enabled: true,
        weeklyDigest: true
      }
    },
    communication: {
      preferredLanguage: 'en',
      timezone: 'Asia/Manila',
      currency: 'PHP'
    },
    app: {
      theme: 'dark',
      fontSize: 'large'
    }
  };
  const updateSettings = await makeRequest('PUT', '/settings/user', updateData, TEST_USER_TOKEN);
  console.log('Updated settings:', JSON.stringify(updateSettings, null, 2));

  // 3. Update specific category
  console.log('\n3. Updating privacy category...');
  const privacyUpdate = {
    profileVisibility: 'private',
    allowDirectMessages: false
  };
  const updateCategory = await makeRequest('PUT', '/settings/user/privacy', privacyUpdate, TEST_USER_TOKEN);
  console.log('Updated privacy:', JSON.stringify(updateCategory, null, 2));

  // 4. Reset to defaults
  console.log('\n4. Resetting settings to defaults...');
  const resetSettings = await makeRequest('POST', '/settings/user/reset', null, TEST_USER_TOKEN);
  console.log('Reset settings:', JSON.stringify(resetSettings, null, 2));
};

const testAppSettings = async () => {
  console.log('\n=== Testing App Settings API (Admin) ===\n');

  // 1. Get app settings
  console.log('1. Getting app settings...');
  const getAppSettings = await makeRequest('GET', '/settings/app', null, ADMIN_TOKEN);
  console.log('App settings:', JSON.stringify(getAppSettings, null, 2));

  // 2. Update app settings
  console.log('\n2. Updating app settings...');
  const appUpdateData = {
    general: {
      maintenanceMode: {
        enabled: false,
        message: 'System is running normally'
      }
    },
    features: {
      marketplace: {
        enabled: true,
        allowNewProviders: true
      },
      referrals: {
        enabled: true,
        rewardAmount: 150
      }
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true
      }
    }
  };
  const updateAppSettings = await makeRequest('PUT', '/settings/app', appUpdateData, ADMIN_TOKEN);
  console.log('Updated app settings:', JSON.stringify(updateAppSettings, null, 2));

  // 3. Toggle feature flag
  console.log('\n3. Toggling feature flag...');
  const toggleFeature = await makeRequest('POST', '/settings/app/features/toggle', {
    feature: 'marketplace',
    enabled: false
  }, ADMIN_TOKEN);
  console.log('Feature toggle result:', JSON.stringify(toggleFeature, null, 2));
};

const testPublicEndpoints = async () => {
  console.log('\n=== Testing Public App Settings API ===\n');

  // 1. Get public app settings
  console.log('1. Getting public app settings...');
  const publicSettings = await makeRequest('GET', '/settings/app/public');
  console.log('Public settings:', JSON.stringify(publicSettings, null, 2));

  // 2. Get app health
  console.log('\n2. Getting app health...');
  const appHealth = await makeRequest('GET', '/settings/app/health');
  console.log('App health:', JSON.stringify(appHealth, null, 2));
};

const testErrorCases = async () => {
  console.log('\n=== Testing Error Cases ===\n');

  // 1. Access app settings without admin token
  console.log('1. Accessing app settings without admin token...');
  const unauthorizedAccess = await makeRequest('GET', '/settings/app', null, TEST_USER_TOKEN);
  console.log('Unauthorized access result:', JSON.stringify(unauthorizedAccess, null, 2));

  // 2. Invalid category update
  console.log('\n2. Updating invalid category...');
  const invalidCategory = await makeRequest('PUT', '/settings/user/invalid_category', {
    someField: 'value'
  }, TEST_USER_TOKEN);
  console.log('Invalid category result:', JSON.stringify(invalidCategory, null, 2));

  // 3. Invalid validation data
  console.log('\n3. Sending invalid validation data...');
  const invalidData = await makeRequest('PUT', '/settings/user', {
    privacy: {
      profileVisibility: 'invalid_value'
    },
    notifications: {
      push: {
        enabled: 'not_a_boolean'
      }
    }
  }, TEST_USER_TOKEN);
  console.log('Invalid data result:', JSON.stringify(invalidData, null, 2));
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Settings API Tests...\n');
  console.log('Note: Make sure to replace TEST_USER_TOKEN and ADMIN_TOKEN with actual JWT tokens');
  console.log('Also ensure the server is running on http://localhost:5000\n');

  try {
    await testUserSettings();
    await testAppSettings();
    await testPublicEndpoints();
    await testErrorCases();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
};

// Example usage scenarios
const exampleUsageScenarios = () => {
  console.log('\n=== Example Usage Scenarios ===\n');
  
  console.log('1. User wants to change notification preferences:');
  console.log(`
    PUT /api/settings/user/notifications
    {
      "push": {
        "enabled": true,
        "newMessages": true,
        "marketing": false
      },
      "email": {
        "enabled": true,
        "weeklyDigest": true
      }
    }
  `);

  console.log('2. Admin wants to enable maintenance mode:');
  console.log(`
    PUT /api/settings/app/general
    {
      "maintenanceMode": {
        "enabled": true,
        "message": "Scheduled maintenance in progress",
        "estimatedEndTime": "2024-01-15T10:00:00Z"
      }
    }
  `);

  console.log('3. User wants to update privacy settings:');
  console.log(`
    PUT /api/settings/user/privacy
    {
      "profileVisibility": "private",
      "showPhoneNumber": false,
      "allowDirectMessages": false
    }
  `);

  console.log('4. Admin wants to toggle a feature:');
  console.log(`
    POST /api/settings/app/features/toggle
    {
      "feature": "referrals",
      "enabled": false
    }
  `);

  console.log('5. Get public app information (no auth required):');
  console.log(`
    GET /api/settings/app/public
  `);
};

// Run the tests
if (require.main === module) {
  runTests();
  exampleUsageScenarios();
}

module.exports = {
  testUserSettings,
  testAppSettings,
  testPublicEndpoints,
  testErrorCases,
  runTests
};
