const fs = require('fs');
const path = require('path');

// Read the Postman collection
const collectionPath = path.join(__dirname, '..', 'LocalPro-Super-App-API.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Extract all endpoints from the collection
function extractEndpoints(items, basePath = '') {
  const endpoints = [];
  
  for (const item of items) {
    if (item.request) {
      // This is an endpoint
      const method = item.request.method;
      const url = item.request.url;
      let pathParts = [];
      
      if (typeof url === 'string') {
        // Handle string URLs
        const cleanUrl = url.replace('{{baseUrl}}', '').replace(/^\/+|\/+$/g, '');
        pathParts = cleanUrl ? cleanUrl.split('/') : [];
      } else if (url && url.path) {
        // Handle path array
        pathParts = Array.isArray(url.path) ? url.path.filter(p => p) : (url.path ? [url.path] : []);
      } else if (url && url.raw) {
        // Handle raw URL
        const cleanUrl = url.raw.replace('{{baseUrl}}', '').replace(/^\/+|\/+$/g, '');
        pathParts = cleanUrl ? cleanUrl.split('/') : [];
      }
      
      const path = pathParts.join('/');
      const fullPath = '/' + path;
      
      endpoints.push({
        name: item.name,
        method: method,
        path: path,
        fullPath: fullPath,
        description: item.request.description || ''
      });
    } else if (item.item) {
      // This is a folder, recurse
      endpoints.push(...extractEndpoints(item.item, basePath));
    }
  }
  
  return endpoints;
}

const allEndpoints = extractEndpoints(collection.item);

// Read all route files
const routesDir = path.join(__dirname, '..', 'src', 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

// Map route files to their base paths
const routeBasePaths = {
  'auth.js': '/api/auth',
  'apiKeys.js': '/api/api-keys',
  'oauth.js': '/api/oauth',
  'marketplace.js': '/api/marketplace',
  'supplies.js': '/api/supplies',
  'academy.js': '/api/academy',
  'finance.js': '/api/finance',
  'rentals.js': '/api/rentals',
  'ads.js': '/api/ads',
  'facilityCare.js': '/api/facility-care',
  'localproPlus.js': '/api/localpro-plus',
  'trustVerification.js': '/api/trust-verification',
  'communication.js': '/api/communication',
  'analytics.js': '/api/analytics',
  'maps.js': '/api/maps',
  'paypal.js': '/api/paypal',
  'paymaya.js': '/api/paymaya',
  'jobs.js': '/api/jobs',
  'jobCategories.js': '/api/job-categories',
  'referrals.js': '/api/referrals',
  'agencies.js': '/api/agencies',
  'settings.js': '/api/settings',
  'errorMonitoring.js': '/api/error-monitoring',
  'auditLogs.js': '/api/audit-logs',
  'providers.js': '/api/providers',
  'logs.js': '/api/logs',
  'userManagement.js': '/api/users',
  'search.js': '/api/search',
  'announcements.js': '/api/announcements',
  'activities.js': '/api/activities',
  'registration.js': '/api/registration',
  'broadcaster.js': '/api/broadcaster',
  'favorites.js': '/api/favorites',
  'monitoring.js': '/api/monitoring',
  'alerts.js': '/api/monitoring/alerts',
  'databaseMonitoring.js': '/api/monitoring/database',
  'databaseOptimization.js': '/api/database/optimization',
  'metricsStream.js': '/api/monitoring/stream',
  'aiMarketplace.js': '/api/ai/marketplace',
  'aiUsers.js': '/api/ai/users',
  'escrows.js': '/api/escrows',
  'escrowWebhooks.js': '/api/escrow-webhooks',
  'liveChat.js': '/api/live-chat',
  'adminLiveChat.js': '/api/admin/live-chat',
  'notifications.js': '/api/notifications',
  'emailMarketing.js': '/api/email-marketing',
  'partners.js': '/api/partners',
  'staff.js': '/api/staff',
  'permissions.js': '/api/permissions',
  'paymongo.js': '/api/paymongo',
  'escrowWebhooks.js': '/webhooks'
};

// Parse route files to extract defined routes
function parseRouteFile(filePath, basePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  
  // Match router.METHOD('path', ...) patterns - handle both single and multi-line
  // This regex handles: router.get('/path', ...) and router.get('/path',\n  middleware,\n  handler)
  const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = routePattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let routePath = match[2];
    
    // Ensure route path starts with /
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }
    
    // Combine base path with route path
    const fullPath = basePath + routePath;
    
    routes.push({
      method,
      path: routePath,
      fullPath: fullPath,
      file: path.basename(filePath)
    });
  }
  
  return routes;
}

// Collect all implemented routes
const implementedRoutes = [];
for (const file of routeFiles) {
  const basePath = routeBasePaths[file] || '';
  if (basePath) {
    const filePath = path.join(routesDir, file);
    if (fs.existsSync(filePath)) {
      const routes = parseRouteFile(filePath, basePath);
      implementedRoutes.push(...routes);
    }
  }
}

// Also check server.js for root routes
const serverPath = path.join(__dirname, '..', 'src', 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  // Check for app.get('/', ...) or app.get('/health', ...)
  const rootRoutePattern = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = rootRoutePattern.exec(serverContent)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    implementedRoutes.push({
      method,
      path: routePath,
      fullPath: routePath,
      file: 'server.js'
    });
  }
}

// Normalize paths for comparison
function normalizePath(pathStr) {
  // Remove leading/trailing slashes
  pathStr = pathStr.replace(/^\/+|\/+$/g, '');
  // Normalize parameter names (e.g., :id, :userId, etc.)
  pathStr = pathStr.replace(/:[^/]+/g, ':param');
  return pathStr.toLowerCase();
}

// Better path matching that handles route parameters
function pathsMatch(endpointPath, routePath) {
  const endpointNormalized = normalizePath(endpointPath);
  const routeNormalized = normalizePath(routePath);
  
  // Exact match after normalization
  if (endpointNormalized === routeNormalized) {
    return true;
  }
  
  // Split into parts and compare
  const endpointParts = endpointNormalized.split('/').filter(p => p);
  const routeParts = routeNormalized.split('/').filter(p => p);
  
  if (endpointParts.length !== routeParts.length) {
    return false;
  }
  
  // Compare parts - parameters match anything
  for (let i = 0; i < endpointParts.length; i++) {
    const endpointPart = endpointParts[i];
    const routePart = routeParts[i];
    
    // If both are parameters, they match
    if (endpointPart.startsWith(':') && routePart.startsWith(':')) {
      continue;
    }
    // If one is a parameter, it matches
    if (endpointPart.startsWith(':') || routePart.startsWith(':')) {
      continue;
    }
    // Both are literal, must match exactly
    if (endpointPart !== routePart) {
      return false;
    }
  }
  
  return true;
}

// Match endpoints to routes
function matchEndpoint(endpoint, routes) {
  // Try to match by full path first
  for (const route of routes) {
    if (pathsMatch(endpoint.fullPath, route.fullPath) && endpoint.method === route.method) {
      return { matched: true, route };
    }
  }
  
  // Try to match by path only (without base)
  for (const route of routes) {
    if (pathsMatch(endpoint.path, route.path) && endpoint.method === route.method) {
      return { matched: true, route };
    }
  }
  
  return { matched: false, route: null };
}

// Analyze endpoints
const analysis = {
  total: allEndpoints.length,
  implemented: [],
  missing: [],
  partial: []
};

for (const endpoint of allEndpoints) {
  // Skip root and health endpoints as they're in server.js
  if (endpoint.path === '' || endpoint.path === 'health' || endpoint.path === 'monitoring') {
    const match = matchEndpoint(endpoint, implementedRoutes);
    if (match.matched) {
      analysis.implemented.push({
        endpoint,
        route: match.route,
        status: 'implemented'
      });
    } else {
      analysis.missing.push({
        endpoint,
        status: 'missing'
      });
    }
    continue;
  }
  
  const match = matchEndpoint(endpoint, implementedRoutes);
  
  if (match.matched) {
    analysis.implemented.push({
      endpoint,
      route: match.route,
      status: 'implemented'
    });
  } else {
    // Check if path exists but method is different
    const pathMatch = implementedRoutes.find(r => 
      pathsMatch(endpoint.fullPath, r.fullPath) || pathsMatch(endpoint.path, r.path)
    );
    
    if (pathMatch) {
      analysis.partial.push({
        endpoint,
        existingRoute: pathMatch,
        status: 'method_mismatch'
      });
    } else {
      analysis.missing.push({
        endpoint,
        status: 'missing'
      });
    }
  }
}

// Generate report
console.log('='.repeat(80));
console.log('ENDPOINT ANALYSIS REPORT');
console.log('='.repeat(80));
console.log(`\nTotal Endpoints in Postman Collection: ${analysis.total}`);
console.log(`Implemented: ${analysis.implemented.length}`);
console.log(`Missing: ${analysis.missing.length}`);
console.log(`Partial (method mismatch): ${analysis.partial.length}`);
console.log(`\nImplementation Rate: ${((analysis.implemented.length / analysis.total) * 100).toFixed(2)}%`);

// Group by module
const moduleGroups = {};
for (const item of analysis.implemented) {
  const module = item.endpoint.fullPath.split('/')[2] || 'root';
  if (!moduleGroups[module]) {
    moduleGroups[module] = { implemented: 0, total: 0 };
  }
  moduleGroups[module].implemented++;
}
for (const item of analysis.missing) {
  const module = item.endpoint.fullPath.split('/')[2] || 'root';
  if (!moduleGroups[module]) {
    moduleGroups[module] = { implemented: 0, total: 0 };
  }
  moduleGroups[module].total++;
}
for (const item of analysis.partial) {
  const module = item.endpoint.fullPath.split('/')[2] || 'root';
  if (!moduleGroups[module]) {
    moduleGroups[module] = { implemented: 0, total: 0 };
  }
  moduleGroups[module].total++;
}

console.log('\n' + '='.repeat(80));
console.log('MODULE BREAKDOWN');
console.log('='.repeat(80));
for (const [module, stats] of Object.entries(moduleGroups).sort()) {
  const total = stats.implemented + (analysis.missing.length + analysis.partial.length);
  console.log(`${module.padEnd(30)} ${stats.implemented}/${stats.total || stats.implemented} (${((stats.implemented / (stats.total || stats.implemented)) * 100).toFixed(1)}%)`);
}

// Detailed missing endpoints
if (analysis.missing.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('MISSING ENDPOINTS');
  console.log('='.repeat(80));
  for (const item of analysis.missing.slice(0, 50)) { // Show first 50
    console.log(`[${item.endpoint.method}] ${item.endpoint.fullPath}`);
  }
  if (analysis.missing.length > 50) {
    console.log(`\n... and ${analysis.missing.length - 50} more missing endpoints`);
  }
}

// Partial matches
if (analysis.partial.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('PARTIAL MATCHES (Method Mismatch)');
  console.log('='.repeat(80));
  for (const item of analysis.partial.slice(0, 20)) {
    console.log(`[${item.endpoint.method}] ${item.endpoint.fullPath} - Found: [${item.existingRoute.method}] ${item.existingRoute.fullPath}`);
  }
  if (analysis.partial.length > 20) {
    console.log(`\n... and ${analysis.partial.length - 20} more partial matches`);
  }
}

// Save detailed report to file
const reportPath = path.join(__dirname, '..', 'endpoint-analysis-report.json');
const detailedReport = {
  summary: {
    total: analysis.total,
    implemented: analysis.implemented.length,
    missing: analysis.missing.length,
    partial: analysis.partial.length,
    implementationRate: ((analysis.implemented.length / analysis.total) * 100).toFixed(2) + '%'
  },
  implemented: analysis.implemented.map(item => ({
    method: item.endpoint.method,
    path: item.endpoint.fullPath,
    name: item.endpoint.name,
    routeFile: item.route.file
  })),
  missing: analysis.missing.map(item => ({
    method: item.endpoint.method,
    path: item.endpoint.fullPath,
    name: item.endpoint.name
  })),
  partial: analysis.partial.map(item => ({
    method: item.endpoint.method,
    path: item.endpoint.fullPath,
    name: item.endpoint.name,
    existingMethod: item.existingRoute.method,
    existingPath: item.existingRoute.fullPath
  }))
};

fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
console.log(`\n\nDetailed report saved to: ${reportPath}`);

