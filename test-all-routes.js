const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_RESULTS_FILE = 'test-results.json';

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  results: []
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000 // 10 second timeout
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || error.message,
      error: error.message
    };
  }
}

// Test function
async function testEndpoint(name, method, endpoint, expectedStatus = 200, data = null, headers = {}) {
  console.log(`Testing ${method} ${endpoint}...`);
  
  const result = await makeRequest(method, endpoint, data, headers);
  testResults.totalTests++;
  
  const testResult = {
    name,
    method,
    endpoint,
    expectedStatus,
    actualStatus: result.status,
    success: result.success && (result.status === expectedStatus || result.status < 500),
    response: result.data,
    error: result.error
  };

  if (testResult.success) {
    testResults.passedTests++;
    console.log(`✅ ${name} - PASSED (${result.status})`);
  } else {
    testResults.failedTests++;
    testResults.errors.push({
      name,
      endpoint,
      error: result.error || `Expected ${expectedStatus}, got ${result.status}`,
      response: result.data
    });
    console.log(`❌ ${name} - FAILED (${result.status}) - ${result.error || result.data?.message || 'Unknown error'}`);
  }

  testResults.results.push(testResult);
  return testResult;
}

// Authentication helper
let authToken = null;

async function getAuthToken() {
  if (authToken) return authToken;
  
  // Try to get a test token (this would need to be implemented based on your auth system)
  console.log('Attempting to get authentication token...');
  
  // For now, we'll test without authentication first
  return null;
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting comprehensive API route testing...\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  // Test basic endpoints
  await testEndpoint('Health Check', 'GET', '/health', 200);
  await testEndpoint('API Info', 'GET', '/', 200);
  await testEndpoint('Postman Collection', 'GET', '/LocalPro-Super-App-API.postman_collection.json', 200);

  // Test Auth endpoints
  console.log('\n📱 Testing Authentication Routes...');
  await testEndpoint('Send Verification Code', 'POST', '/api/auth/send-code', 400, {
    phoneNumber: '+15551234567'
  });
  await testEndpoint('Verify Code', 'POST', '/api/auth/verify-code', 400, {
    phoneNumber: '+15551234567',
    code: '123456'
  });

  // Test Marketplace endpoints
  console.log('\n🏪 Testing Marketplace Routes...');
  await testEndpoint('Get Services', 'GET', '/api/marketplace/services', 200);
  await testEndpoint('Get Nearby Services', 'GET', '/api/marketplace/services/nearby', 400); // Requires location
  await testEndpoint('Get Service by ID', 'GET', '/api/marketplace/services/invalid-id', 400);

  // Test Academy endpoints
  console.log('\n🎓 Testing Academy Routes...');
  await testEndpoint('Get Courses', 'GET', '/api/academy/courses', 200);
  await testEndpoint('Get Course by ID', 'GET', '/api/academy/courses/invalid-id', 400);

  // Test Jobs endpoints
  console.log('\n💼 Testing Jobs Routes...');
  await testEndpoint('Get Jobs', 'GET', '/api/jobs', 200);
  await testEndpoint('Search Jobs', 'GET', '/api/jobs/search', 200);
  await testEndpoint('Get Job by ID', 'GET', '/api/jobs/invalid-id', 400);

  // Test Communication endpoints (these require auth)
  console.log('\n💬 Testing Communication Routes...');
  await testEndpoint('Get Conversations (Unauth)', 'GET', '/api/communication/conversations', 401);
  await testEndpoint('Get Notifications (Unauth)', 'GET', '/api/communication/notifications', 401);
  await testEndpoint('Get Unread Count (Unauth)', 'GET', '/api/communication/unread-count', 401);

  // Test Supplies endpoints
  console.log('\n📦 Testing Supplies Routes...');
  await testEndpoint('Get Supplies', 'GET', '/api/supplies', 200);
  await testEndpoint('Get Supply by ID', 'GET', '/api/supplies/invalid-id', 400);

  // Test Finance endpoints
  console.log('\n💰 Testing Finance Routes...');
  await testEndpoint('Get Finance Data (Unauth)', 'GET', '/api/finance', 401);

  // Test Rentals endpoints
  console.log('\n🏠 Testing Rentals Routes...');
  await testEndpoint('Get Rentals', 'GET', '/api/rentals', 200);
  await testEndpoint('Get Rental by ID', 'GET', '/api/rentals/invalid-id', 400);

  // Test Ads endpoints
  console.log('\n📢 Testing Ads Routes...');
  await testEndpoint('Get Ads', 'GET', '/api/ads', 200);
  await testEndpoint('Get Ad by ID', 'GET', '/api/ads/invalid-id', 400);

  // Test Facility Care endpoints
  console.log('\n🏥 Testing Facility Care Routes...');
  await testEndpoint('Get Facility Care', 'GET', '/api/facility-care', 200);
  await testEndpoint('Get Facility Care by ID', 'GET', '/api/facility-care/invalid-id', 400);

  // Test LocalPro Plus endpoints
  console.log('\n⭐ Testing LocalPro Plus Routes...');
  await testEndpoint('Get LocalPro Plus', 'GET', '/api/localpro-plus', 200);
  await testEndpoint('Get LocalPro Plus by ID', 'GET', '/api/localpro-plus/invalid-id', 400);

  // Test Trust Verification endpoints
  console.log('\n🔒 Testing Trust Verification Routes...');
  await testEndpoint('Get Trust Verification', 'GET', '/api/trust-verification', 200);
  await testEndpoint('Get Trust Verification by ID', 'GET', '/api/trust-verification/invalid-id', 400);

  // Test Analytics endpoints
  console.log('\n📊 Testing Analytics Routes...');
  await testEndpoint('Get Analytics (Unauth)', 'GET', '/api/analytics', 401);

  // Test Maps endpoints
  console.log('\n🗺️ Testing Maps Routes...');
  await testEndpoint('Get Maps Data', 'GET', '/api/maps', 200);

  // Test PayPal endpoints
  console.log('\n💳 Testing PayPal Routes...');
  await testEndpoint('Get PayPal Orders', 'GET', '/api/paypal/orders', 200);
  await testEndpoint('Create PayPal Order', 'POST', '/api/paypal/orders', 400); // Requires data

  // Test PayMaya endpoints
  console.log('\n💳 Testing PayMaya Routes...');
  await testEndpoint('Get PayMaya Payments', 'GET', '/api/paymaya/payments', 200);
  await testEndpoint('Create PayMaya Payment', 'POST', '/api/paymaya/payments', 400); // Requires data

  // Test Referrals endpoints
  console.log('\n🤝 Testing Referrals Routes...');
  await testEndpoint('Get Referrals (Unauth)', 'GET', '/api/referrals', 401);

  // Test Agencies endpoints
  console.log('\n🏢 Testing Agencies Routes...');
  await testEndpoint('Get Agencies', 'GET', '/api/agencies', 200);
  await testEndpoint('Get Agency by ID', 'GET', '/api/agencies/invalid-id', 400);

  // Test Settings endpoints
  console.log('\n⚙️ Testing Settings Routes...');
  await testEndpoint('Get Settings (Unauth)', 'GET', '/api/settings', 401);

  // Test Error Monitoring endpoints
  console.log('\n🔍 Testing Error Monitoring Routes...');
  await testEndpoint('Get Error Monitoring (Unauth)', 'GET', '/api/error-monitoring', 401);

  // Test Audit Logs endpoints
  console.log('\n📝 Testing Audit Logs Routes...');
  await testEndpoint('Get Audit Logs (Unauth)', 'GET', '/api/audit-logs', 401);

  // Test Providers endpoints
  console.log('\n👥 Testing Providers Routes...');
  await testEndpoint('Get Providers', 'GET', '/api/providers', 200);
  await testEndpoint('Get Provider by ID', 'GET', '/api/providers/invalid-id', 400);

  // Test Logs endpoints
  console.log('\n📋 Testing Logs Routes...');
  await testEndpoint('Get Logs (Unauth)', 'GET', '/api/logs', 401);

  // Test User Management endpoints
  console.log('\n👤 Testing User Management Routes...');
  await testEndpoint('Get Users (Unauth)', 'GET', '/api/users', 401);

  // Test Search endpoints
  console.log('\n🔍 Testing Search Routes...');
  await testEndpoint('Global Search', 'GET', '/api/search', 200);
  await testEndpoint('Search with Query', 'GET', '/api/search?q=test', 200);

  // Test Announcements endpoints
  console.log('\n📢 Testing Announcements Routes...');
  await testEndpoint('Get Announcements', 'GET', '/api/announcements', 200);
  await testEndpoint('Get Announcement by ID', 'GET', '/api/announcements/invalid-id', 400);

  // Test Activities endpoints
  console.log('\n📱 Testing Activities Routes...');
  await testEndpoint('Get Activities', 'GET', '/api/activities', 200);
  await testEndpoint('Get Activity by ID', 'GET', '/api/activities/invalid-id', 400);

  // Test invalid endpoints
  console.log('\n❌ Testing Invalid Endpoints...');
  await testEndpoint('Invalid Endpoint', 'GET', '/api/invalid-endpoint', 404);
  await testEndpoint('Invalid Method', 'POST', '/api/marketplace/services', 401); // Should require auth

  // Generate report
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests}`);
  console.log(`Failed: ${testResults.failedTests}`);
  console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name} (${error.endpoint})`);
      console.log(`   Error: ${error.error}`);
    });
  }

  // Save results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${TEST_RESULTS_FILE}`);

  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((results) => {
      console.log('\n✅ Testing completed!');
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testEndpoint, makeRequest };
