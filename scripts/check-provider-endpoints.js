#!/usr/bin/env node

/**
 * Provider Endpoints Verification Script
 * 
 * This script checks which provider endpoints from the documentation
 * are implemented in the codebase.
 */

const fs = require('fs');
const path = require('path');

// Define all endpoints from the documentation
const endpoints = {
  'Provider Registration & Profile': [
    { method: 'POST', path: '/providers/profile', desc: 'Upgrade from client to provider', file: 'providers.js' },
    { method: 'PUT', path: '/providers/onboarding/step', desc: 'Complete onboarding steps', file: 'providers.js' },
    { method: 'POST', path: '/providers/documents/upload', desc: 'Upload verification documents', file: 'providers.js' },
    { method: 'GET', path: '/providers/profile/me', desc: 'Get current provider profile', file: 'providers.js' },
    { method: 'PUT', path: '/providers/profile', desc: 'Update provider profile', file: 'providers.js' },
    { method: 'GET', path: '/providers/dashboard/overview', desc: 'Get dashboard overview', file: 'providers.js' },
    { method: 'GET', path: '/providers/analytics/performance', desc: 'Get performance analytics', file: 'providers.js' },
    { method: 'GET', path: '/providers/dashboard/metrics', desc: 'Get real-time metrics', file: 'providers.js' },
    { method: 'GET', path: '/providers/dashboard/activity', desc: 'Get activity feed', file: 'providers.js' }
  ],
  'Service Management': [
    { method: 'POST', path: '/marketplace/services', desc: 'Create service listing', file: 'marketplace.js' },
    { method: 'GET', path: '/marketplace/my-services', desc: 'Get my services', file: 'marketplace.js' },
    { method: 'PUT', path: '/marketplace/services/:id', desc: 'Update service', file: 'marketplace.js' },
    { method: 'POST', path: '/marketplace/services/:id/images', desc: 'Upload service images', file: 'marketplace.js' },
    { method: 'PATCH', path: '/marketplace/services/:id/activate', desc: 'Activate service', file: 'marketplace.js' },
    { method: 'PATCH', path: '/marketplace/services/:id/deactivate', desc: 'Deactivate service', file: 'marketplace.js' },
    { method: 'DELETE', path: '/marketplace/services/:id', desc: 'Delete service', file: 'marketplace.js' }
  ],
  'Booking Management': [
    { method: 'GET', path: '/marketplace/my-bookings', desc: 'Get my bookings (as provider)', file: 'marketplace.js' },
    { method: 'GET', path: '/marketplace/bookings/:id', desc: 'Get booking details', file: 'marketplace.js' },
    { method: 'PUT', path: '/marketplace/bookings/:id/status', desc: 'Update booking status', file: 'marketplace.js' },
    { method: 'POST', path: '/marketplace/bookings/:id/photos', desc: 'Upload service photos', file: 'marketplace.js' }
  ],
  'Availability & Scheduling': [
    { method: 'GET', path: '/availability', desc: 'Get availability schedule', file: 'availability.js' },
    { method: 'PUT', path: '/availability', desc: 'Update availability', file: 'availability.js' },
    { method: 'POST', path: '/availability/time-off', desc: 'Add time off', file: 'availability.js' },
    { method: 'GET', path: '/scheduling', desc: 'Get schedule with bookings', file: 'scheduling.js' }
  ],
  'Financial Management': [
    { method: 'GET', path: '/finance/earnings', desc: 'Get earnings overview', file: 'finance.js' },
    { method: 'GET', path: '/finance/transactions', desc: 'Get transaction history', file: 'finance.js' },
    { method: 'POST', path: '/finance/withdraw', desc: 'Request payout/withdrawal', file: 'finance.js' },
    { method: 'GET', path: '/finance/withdrawals', desc: 'Get payout history', file: 'finance.js' },
    { method: 'GET', path: '/finance/reports', desc: 'Get financial reports', file: 'finance.js' }
  ],
  'Reviews & Ratings': [
    { method: 'GET', path: '/providers/reviews', desc: 'Get my reviews', file: 'providers.js' },
    { method: 'POST', path: '/providers/reviews/:reviewId/respond', desc: 'Respond to review', file: 'providers.js' }
  ],
  'Agency Features': [
    { method: 'GET', path: '/agencies/my/agencies', desc: 'Get my agencies', file: 'agencies.js' },
    { method: 'POST', path: '/agencies/join', desc: 'Join agency', file: 'agencies.js' },
    { method: 'POST', path: '/agencies/leave', desc: 'Leave agency', file: 'agencies.js' }
  ],
  'Communication': [
    { method: 'GET', path: '/communication/conversations', desc: 'Get client conversations', file: 'communication.js' },
    { method: 'POST', path: '/communication/conversations/:id/messages', desc: 'Send message to client', file: 'communication.js' }
  ],
  'Job Postings': [
    { method: 'POST', path: '/jobs', desc: 'Create job posting', file: 'jobs.js' },
    { method: 'GET', path: '/jobs/my-jobs', desc: 'Get my job postings', file: 'jobs.js' },
    { method: 'GET', path: '/jobs/:id/applications', desc: 'Get job applications', file: 'jobs.js' },
    { method: 'PUT', path: '/jobs/:jobId/applications/:applicationId/status', desc: 'Update application status', file: 'jobs.js' }
  ],
  'Rentals Management': [
    { method: 'POST', path: '/rentals', desc: 'Create rental listing', file: 'rentals.js' },
    { method: 'GET', path: '/rentals/my-rentals', desc: 'Get my rental items', file: 'rentals.js' },
    { method: 'GET', path: '/rentals/my-bookings', desc: 'Get rental bookings', file: 'rentals.js' }
  ],
  'Supplies Management': [
    { method: 'POST', path: '/supplies', desc: 'Create supply listing', file: 'supplies.js' },
    { method: 'GET', path: '/supplies/my-supplies', desc: 'Get my supplies', file: 'supplies.js' },
    { method: 'GET', path: '/supplies/my-orders', desc: 'Get supply orders', file: 'supplies.js' },
    { method: 'PUT', path: '/supplies/:id/orders/:orderId/status', desc: 'Update order status', file: 'supplies.js' }
  ],
  'Academy/Instructor': [
    { method: 'POST', path: '/academy/courses', desc: 'Create course', file: 'academy.js' },
    { method: 'GET', path: '/academy/my-created-courses', desc: 'Get my courses', file: 'academy.js' },
    { method: 'POST', path: '/academy/courses/:id/videos', desc: 'Upload course content', file: 'academy.js' }
  ]
};

// Function to check if a route exists in a file
function checkRoute(filePath, method, path) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, reason: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Clean up path for regex matching
    const pathPattern = path
      .replace(/\//g, '\\/')
      .replace(/:id/g, ':id')
      .replace(/:reviewId/g, ':reviewId')
      .replace(/:jobId/g, ':jobId')
      .replace(/:applicationId/g, ':applicationId')
      .replace(/:orderId/g, ':orderId');
    
    // Create regex patterns for different route styles
    const patterns = [
      new RegExp(`router\\.${method.toLowerCase()}\\(['"\`]${pathPattern}['"\`]`, 'i'),
      new RegExp(`router\\.${method.toLowerCase()}\\(['"\`]${path}['"\`]`, 'i'),
      new RegExp(`\\.${method.toLowerCase()}\\(['"\`]${path.replace(/\//g, '\\/')}['"\`]`, 'i')
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return { exists: true, reason: 'Found' };
      }
    }
    
    return { exists: false, reason: 'Route not found in file' };
  } catch (error) {
    return { exists: false, reason: error.message };
  }
}

// Main verification function
function verifyEndpoints() {
  console.log('\n🔍 Provider Endpoints Verification Report\n');
  console.log('=' .repeat(100));
  
  const routesDir = path.join(__dirname, '../src/routes');
  let totalEndpoints = 0;
  let implementedEndpoints = 0;
  let missingEndpoints = [];
  
  const results = {};
  
  for (const [category, categoryEndpoints] of Object.entries(endpoints)) {
    console.log(`\n📁 ${category} (${categoryEndpoints.length} endpoints)`);
    console.log('-'.repeat(100));
    
    results[category] = {
      total: categoryEndpoints.length,
      implemented: 0,
      missing: []
    };
    
    for (const endpoint of categoryEndpoints) {
      totalEndpoints++;
      const filePath = path.join(routesDir, endpoint.file);
      const check = checkRoute(filePath, endpoint.method, endpoint.path);
      
      const status = check.exists ? '✅' : '❌';
      const statusText = check.exists ? 'IMPLEMENTED' : 'MISSING';
      
      console.log(`  ${status} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(50)} ${statusText}`);
      
      if (check.exists) {
        implementedEndpoints++;
        results[category].implemented++;
      } else {
        results[category].missing.push({
          method: endpoint.method,
          path: endpoint.path,
          desc: endpoint.desc,
          file: endpoint.file,
          reason: check.reason
        });
        missingEndpoints.push({
          category,
          ...endpoint,
          reason: check.reason
        });
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total Endpoints: ${totalEndpoints}`);
  console.log(`✅ Implemented: ${implementedEndpoints} (${Math.round(implementedEndpoints / totalEndpoints * 100)}%)`);
  console.log(`❌ Missing: ${missingEndpoints.length} (${Math.round(missingEndpoints.length / totalEndpoints * 100)}%)`);
  
  // Category breakdown
  console.log('\n📈 Category Breakdown:\n');
  for (const [category, data] of Object.entries(results)) {
    const percentage = Math.round((data.implemented / data.total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log(`${category.padEnd(35)} ${bar} ${percentage}% (${data.implemented}/${data.total})`);
  }
  
  // Missing endpoints details
  if (missingEndpoints.length > 0) {
    console.log('\n⚠️  MISSING ENDPOINTS:\n');
    for (const missing of missingEndpoints) {
      console.log(`  ❌ [${missing.category}]`);
      console.log(`     ${missing.method} ${missing.path}`);
      console.log(`     📝 ${missing.desc}`);
      console.log(`     📄 Should be in: src/routes/${missing.file}`);
      console.log(`     ℹ️  Reason: ${missing.reason}\n`);
    }
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalEndpoints,
      implemented: implementedEndpoints,
      missing: missingEndpoints.length,
      percentage: Math.round((implementedEndpoints / totalEndpoints) * 100)
    },
    categories: results,
    missingEndpoints
  };
  
  const reportPath = path.join(__dirname, '../PROVIDER_ENDPOINTS_STATUS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed JSON report saved to: ${reportPath}\n`);
  
  return report;
}

// Run the verification
if (require.main === module) {
  verifyEndpoints();
}

module.exports = { verifyEndpoints, checkRoute, endpoints };
