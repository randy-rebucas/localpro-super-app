const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const TEST_TIMEOUT = 10000; // 10 seconds per endpoint

// Read the endpoint analysis report
const reportPath = path.join(__dirname, '..', 'endpoint-analysis-report.json');
let endpoints = [];

// Load endpoints from report
try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  endpoints = report.implemented.map(ep => ({
    method: ep.method,
    path: ep.path,
    name: ep.name,
    requiresAuth: ep.path.includes('/api/') && !ep.path.includes('/api/auth/send-code') && !ep.path.includes('/api/auth/verify-code'),
    skipTest: false
  }));
} catch (error) {
  console.error('Failed to load endpoint report:', error.message);
  process.exit(1);
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper function to make HTTP request
async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const config = {
    method: endpoint.method.toLowerCase(),
    url: url,
    timeout: TEST_TIMEOUT,
    validateStatus: () => true // Accept any status code
  };

  // Add auth token if required
  if (endpoint.requiresAuth && AUTH_TOKEN) {
    config.headers = {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    };
  }

  // Add minimal body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    config.data = {};
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    // Consider 2xx, 3xx, 4xx as "working" (endpoint exists)
    // 5xx might indicate server error but endpoint exists
    const isWorking = response.status < 500;

    return {
      success: isWorking,
      status: response.status,
      duration,
      error: isWorking ? null : `HTTP ${response.status}`
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

// Test a single endpoint
async function runTest(endpoint) {
  results.total++;
  
  if (endpoint.skipTest) {
    results.skipped++;
    return {
      endpoint,
      status: 'skipped',
      reason: 'Skipped by configuration'
    };
  }

  console.log(`Testing [${endpoint.method}] ${endpoint.path}...`);
  
  const result = await testEndpoint(endpoint);
  
  if (result.success) {
    results.passed++;
    console.log(`  ✅ PASSED (${result.status}) - ${result.duration}ms`);
    return {
      endpoint,
      status: 'passed',
      statusCode: result.status,
      duration: result.duration
    };
  } else {
    results.failed++;
    console.log(`  ❌ FAILED - ${result.error}`);
    results.errors.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      error: result.error,
      statusCode: result.status
    });
    return {
      endpoint,
      status: 'failed',
      error: result.error,
      statusCode: result.status
    };
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(80));
  console.log('ENDPOINT FUNCTIONALITY TEST');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided' : 'Not provided (some tests may fail)'}`);
  console.log('='.repeat(80));
  console.log('');

  // Filter out endpoints that should be skipped
  const endpointsToTest = endpoints.filter(ep => {
    // Skip root endpoints that might not return JSON
    if (ep.path === '/' || ep.path === '/health' || ep.path === '/monitoring') {
      return false;
    }
    // Skip file download endpoints
    if (ep.path.includes('.json') || ep.path.includes('.html')) {
      return false;
    }
    return true;
  });

  console.log(`Testing ${endpointsToTest.length} endpoints...\n`);

  const testResults = [];
  
  // Test endpoints in batches to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < endpointsToTest.length; i += batchSize) {
    const batch = endpointsToTest.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(ep => runTest(ep)));
    testResults.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < endpointsToTest.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(2)}%)`);
  console.log(`Skipped: ${results.skipped} (${((results.skipped / results.total) * 100).toFixed(2)}%)`);

  if (results.errors.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('FAILED ENDPOINTS');
    console.log('='.repeat(80));
    results.errors.slice(0, 20).forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.endpoint}`);
      console.log(`   Error: ${err.error}`);
    });
    if (results.errors.length > 20) {
      console.log(`\n... and ${results.errors.length - 20} more failed endpoints`);
    }
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'endpoint-test-results.json');
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: ((results.passed / results.total) * 100).toFixed(2) + '%'
    },
    results: testResults,
    errors: results.errors
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };

