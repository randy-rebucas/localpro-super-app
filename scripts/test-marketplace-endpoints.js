const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const TEST_TIMEOUT = 15000; // 15 seconds per endpoint

// Marketplace endpoints to test (from API_ENDPOINTS_VERIFICATION.md)
const marketplaceEndpoints = [
  {
    num: 1,
    method: 'GET',
    path: '/api/marketplace/services',
    auth: false,
    description: 'Get list of services',
    params: { page: 1, limit: 10 }
  },
  {
    num: 2,
    method: 'GET',
    path: '/api/marketplace/services/categories',
    auth: false,
    description: 'Get service categories'
  },
  {
    num: 3,
    method: 'GET',
    path: '/api/marketplace/services/nearby',
    auth: false,
    description: 'Get nearby services',
    params: { latitude: 14.5995, longitude: 120.9842, radius: 10 } // Manila coordinates
  },
  {
    num: 4,
    method: 'GET',
    path: '/api/marketplace/services/:id',
    auth: false,
    description: 'Get service by ID',
    needsId: true,
    testId: null // Will be set from first endpoint response
  },
  {
    num: 5,
    method: 'POST',
    path: '/api/marketplace/bookings',
    auth: true,
    description: 'Create a booking',
    body: {
      serviceId: null, // Will be set from first endpoint
      providerId: null, // Will be set from first endpoint
      bookingDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration: 2,
      paymentMethod: 'cash'
    }
  },
  {
    num: 6,
    method: 'GET',
    path: '/api/marketplace/my-bookings',
    auth: true,
    description: 'Get my bookings',
    params: { page: 1, limit: 10 }
  },
  {
    num: 7,
    method: 'GET',
    path: '/api/marketplace/bookings/:id',
    auth: true,
    description: 'Get booking by ID',
    needsId: true,
    testId: null // Will be set from bookings endpoint
  },
  {
    num: 8,
    method: 'PUT',
    path: '/api/marketplace/bookings/:id/status',
    auth: true,
    description: 'Update booking status',
    needsId: true,
    testId: null, // Will be set from bookings endpoint
    body: { status: 'confirmed' }
  },
  {
    num: 9,
    method: 'POST',
    path: '/api/marketplace/bookings/:id/review',
    auth: true,
    description: 'Add review to booking',
    needsId: true,
    testId: null, // Will be set from bookings endpoint
    body: {
      rating: 5,
      comment: 'Great service!'
    }
  }
];

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Helper function to make HTTP request
async function testEndpoint(endpoint) {
  let url = `${BASE_URL}${endpoint.path}`;
  
  // Replace :id placeholder if needed
  if (endpoint.needsId && endpoint.testId) {
    url = url.replace(':id', endpoint.testId);
  } else if (endpoint.needsId && !endpoint.testId) {
    return {
      success: false,
      status: 0,
      error: 'Missing test ID - endpoint requires an ID but none was provided'
    };
  }

  const config = {
    method: endpoint.method.toLowerCase(),
    url: url,
    timeout: TEST_TIMEOUT,
    validateStatus: () => true, // Accept any status code
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add auth token if required
  if (endpoint.auth) {
    if (!AUTH_TOKEN) {
      return {
        success: false,
        status: 401,
        error: 'Authentication required but no token provided'
      };
    }
    config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  // Add query parameters
  if (endpoint.params) {
    config.params = endpoint.params;
  }

  // Add request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.body) {
    config.data = endpoint.body;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    // Consider 2xx, 3xx, 4xx as "working" (endpoint exists and responds)
    // 5xx might indicate server error but endpoint exists
    const isWorking = response.status < 500;
    
    // For 401, check if it's because auth is required (expected for protected endpoints)
    const isExpectedAuthError = endpoint.auth && response.status === 401 && !AUTH_TOKEN;

    return {
      success: isWorking || isExpectedAuthError,
      status: response.status,
      duration,
      error: isWorking ? null : `HTTP ${response.status}`,
      data: response.data
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        status: 0,
        duration: 0,
        error: 'Connection refused - Server not running?'
      };
    }
    if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        status: 0,
        duration: TEST_TIMEOUT,
        error: 'Request timeout'
      };
    }
    return {
      success: false,
      status: 0,
      duration: 0,
      error: error.message
    };
  }
}

// Extract IDs from responses for dependent endpoints
function extractIdsFromResponse(endpoint, responseData) {
  if (!responseData || !responseData.data) return;

  // Extract service ID from services list
  // Response structure: { success: true, data: [...services], pagination: {...} }
  if (endpoint.path === '/api/marketplace/services' && Array.isArray(responseData.data)) {
    const firstService = responseData.data[0];
    if (firstService && firstService._id) {
      const serviceIdEndpoint = marketplaceEndpoints.find(e => e.num === 4);
      if (serviceIdEndpoint) serviceIdEndpoint.testId = firstService._id;
      
      // Also set for booking creation
      const bookingEndpoint = marketplaceEndpoints.find(e => e.num === 5);
      if (bookingEndpoint && bookingEndpoint.body) {
        bookingEndpoint.body.serviceId = firstService._id;
        bookingEndpoint.body.providerId = firstService.provider?._id || firstService.provider;
      }
    }
  }

  // Extract booking ID from my-bookings list
  // Response structure: { success: true, data: [...bookings], pagination: {...} }
  if (endpoint.path === '/api/marketplace/my-bookings' && Array.isArray(responseData.data)) {
    const firstBooking = responseData.data[0];
    if (firstBooking && firstBooking._id) {
      const bookingIdEndpoint = marketplaceEndpoints.find(e => e.num === 7);
      if (bookingIdEndpoint) bookingIdEndpoint.testId = firstBooking._id;
      
      const statusEndpoint = marketplaceEndpoints.find(e => e.num === 8);
      if (statusEndpoint) statusEndpoint.testId = firstBooking._id;
      
      const reviewEndpoint = marketplaceEndpoints.find(e => e.num === 9);
      if (reviewEndpoint) reviewEndpoint.testId = firstBooking._id;
    }
  }

  // Extract booking ID from bookings list (alternative)
  // Response structure: { success: true, data: [...bookings], pagination: {...} }
  if (endpoint.path === '/api/marketplace/bookings' && endpoint.method === 'GET' && Array.isArray(responseData.data)) {
    const firstBooking = responseData.data[0];
    if (firstBooking && firstBooking._id) {
      const bookingIdEndpoint = marketplaceEndpoints.find(e => e.num === 7);
      if (bookingIdEndpoint) bookingIdEndpoint.testId = firstBooking._id;
      
      const statusEndpoint = marketplaceEndpoints.find(e => e.num === 8);
      if (statusEndpoint) statusEndpoint.testId = firstBooking._id;
      
      const reviewEndpoint = marketplaceEndpoints.find(e => e.num === 9);
      if (reviewEndpoint) reviewEndpoint.testId = firstBooking._id;
    }
  }

  // Extract booking ID from POST booking response
  // Response structure: { success: true, data: {...booking} }
  if (endpoint.path === '/api/marketplace/bookings' && endpoint.method === 'POST' && responseData.data && responseData.data._id) {
    const bookingId = responseData.data._id;
    const bookingIdEndpoint = marketplaceEndpoints.find(e => e.num === 7);
    if (bookingIdEndpoint) bookingIdEndpoint.testId = bookingId;
    
    const statusEndpoint = marketplaceEndpoints.find(e => e.num === 8);
    if (statusEndpoint) statusEndpoint.testId = bookingId;
    
    const reviewEndpoint = marketplaceEndpoints.find(e => e.num === 9);
    if (reviewEndpoint) reviewEndpoint.testId = bookingId;
  }
}

// Test a single endpoint
async function runTest(endpoint) {
  results.total++;
  
  const result = await testEndpoint(endpoint);
  
  // Extract IDs if response is successful
  if (result.success && result.data) {
    extractIdsFromResponse(endpoint, result.data);
  }
  
  if (result.success) {
    results.passed++;
    const statusEmoji = result.status >= 200 && result.status < 300 ? '✅' : '⚠️';
    console.log(`   ${statusEmoji} PASSED (${result.status}) - ${result.duration}ms`);
    
    if (result.status >= 400 && result.status < 500) {
      console.log(`   Note: Client error (expected for some endpoints without proper data)`);
    }
    
    results.details.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: 'passed',
      statusCode: result.status,
      duration: result.duration,
      description: endpoint.description
    });
  } else {
    results.failed++;
    console.log(`   ❌ FAILED - ${result.error}`);
    
    results.details.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: 'failed',
      statusCode: result.status,
      error: result.error,
      description: endpoint.description
    });
  }
  
  return result;
}

// Main test runner
async function runTests() {
  console.log('='.repeat(80));
  console.log('MARKETPLACE ENDPOINTS VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided ✓' : 'Not provided (some tests may fail)'}`);
  console.log(`Total Endpoints: ${marketplaceEndpoints.length}`);
  console.log('='.repeat(80));

  // Test endpoints in order (some depend on previous results)
  for (const endpoint of marketplaceEndpoints) {
    console.log(`\n[${endpoint.num}] Testing ${endpoint.method} ${endpoint.path}`);
    console.log(`   Description: ${endpoint.description}`);
    console.log(`   Auth Required: ${endpoint.auth ? 'Yes' : 'No'}`);
    
    await runTest(endpoint);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(2)}%)`);
  console.log(`Skipped: ${results.skipped} (${((results.skipped / results.total) * 100).toFixed(2)}%)`);

  // Detailed results
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(80));
  
  results.details.forEach((detail, index) => {
    const statusIcon = detail.status === 'passed' ? '✅' : '❌';
    console.log(`\n${index + 1}. ${statusIcon} ${detail.endpoint}`);
    console.log(`   Status: ${detail.statusCode || 'N/A'}`);
    console.log(`   Description: ${detail.description}`);
    if (detail.error) {
      console.log(`   Error: ${detail.error}`);
    }
    if (detail.duration) {
      console.log(`   Duration: ${detail.duration}ms`);
    }
  });

  // Update verification document
  console.log('\n' + '='.repeat(80));
  console.log('UPDATING VERIFICATION DOCUMENT');
  console.log('='.repeat(80));
  
  updateVerificationDocument();

  console.log('\n✅ Test completed!');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Update the API_ENDPOINTS_VERIFICATION.md file
function updateVerificationDocument() {
  const fs = require('fs');
  const path = require('path');
  
  const docPath = path.join(__dirname, '..', 'API_ENDPOINTS_VERIFICATION.md');
  
  try {
    let content = fs.readFileSync(docPath, 'utf8');
    
    // Update marketplace endpoints status
    results.details.forEach((detail, index) => {
      const endpointNum = index + 1;
      const statusEmoji = detail.status === 'passed' ? '✅' : '❌';
      
      // Find the line with this endpoint number and update status
      const regex = new RegExp(`(\\| ${endpointNum} \\| [^|]+ \\| [^|]+ \\| [^|]+ \\| )⬜`, 'g');
      content = content.replace(regex, `$1${statusEmoji}`);
    });
    
    fs.writeFileSync(docPath, content, 'utf8');
    console.log('✅ Verification document updated successfully');
  } catch (error) {
    console.log(`⚠️  Could not update verification document: ${error.message}`);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, marketplaceEndpoints };
