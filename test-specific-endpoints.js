const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(name, method, endpoint, data = null) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${name} - Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    
  } catch (error) {
    console.log(`❌ ${name} - Status: ${error.response?.status || 'No response'}`);
    console.log(`   Error:`, error.response?.data || error.message);
    
    if (error.response?.data?.stack) {
      console.log(`   Stack:`, error.response.data.stack.substring(0, 300) + '...');
    }
  }
}

async function runSpecificTests() {
  console.log('🚀 Running specific endpoint tests...\n');
  
  // Test basic endpoints
  await testEndpoint('Health Check', 'GET', '/health');
  await testEndpoint('API Info', 'GET', '/');
  
  // Test problematic endpoints
  await testEndpoint('Academy Courses', 'GET', '/api/academy/courses');
  await testEndpoint('Supplies', 'GET', '/api/supplies');
  await testEndpoint('Ads', 'GET', '/api/ads');
  await testEndpoint('Rentals', 'GET', '/api/rentals');
  await testEndpoint('Facility Care', 'GET', '/api/facility-care');
  
  // Test auth endpoints
  await testEndpoint('Send Code', 'POST', '/api/auth/send-code', {
    phoneNumber: '+1234567890'
  });
  
  // Test marketplace endpoints
  await testEndpoint('Marketplace Services', 'GET', '/api/marketplace/services');
  await testEndpoint('Marketplace Service by ID', 'GET', '/api/marketplace/services/invalid-id');
  
  // Test maps endpoint (should work now)
  await testEndpoint('Maps Info', 'GET', '/api/maps');
  
  console.log('\n✅ Specific endpoint tests completed!');
}

runSpecificTests().catch(console.error);
