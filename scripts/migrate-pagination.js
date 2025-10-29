#!/usr/bin/env node

/**
 * Pagination Migration Script
 * Helps migrate existing controllers to use the new standardized pagination system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTROLLERS_DIR = path.join(__dirname, '../src/controllers');
const ROUTES_DIR = path.join(__dirname, '../src/routes');

// Files to migrate (add more as needed)
const CONTROLLERS_TO_MIGRATE = [
  'announcementController.js',
  'providerController.js',
  'userManagementController.js',
  'marketplaceController.js',
  'suppliesController.js',
  'rentalsController.js',
  'searchController.js'
];

const ROUTES_TO_MIGRATE = [
  'announcement.js',
  'provider.js',
  'userManagement.js',
  'marketplace.js',
  'supplies.js',
  'rentals.js',
  'search.js'
];

console.log('🚀 Starting pagination migration...\n');

// Step 1: Create backup
console.log('📦 Creating backup...');
const backupDir = path.join(__dirname, '../backup', new Date().toISOString().replace(/[:.]/g, '-'));
execSync(`mkdir -p "${backupDir}"`);
execSync(`cp -r "${CONTROLLERS_DIR}" "${backupDir}/controllers"`);
execSync(`cp -r "${ROUTES_DIR}" "${backupDir}/routes"`);
console.log(`✅ Backup created at ${backupDir}\n`);

// Step 2: Generate migration report
console.log('📊 Generating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  controllers: [],
  routes: [],
  recommendations: []
};

// Analyze controllers
CONTROLLERS_TO_MIGRATE.forEach(controller => {
  const controllerPath = path.join(CONTROLLERS_DIR, controller);
  if (fs.existsSync(controllerPath)) {
    const content = fs.readFileSync(controllerPath, 'utf8');
    
    const analysis = {
      file: controller,
      hasPagination: content.includes('pagination') || content.includes('page') || content.includes('limit'),
      hasOffsetPagination: content.includes('skip') && content.includes('limit'),
      hasCursorPagination: content.includes('cursor'),
      paginationPatterns: [],
      recommendations: []
    };

    // Detect pagination patterns
    if (content.includes('page = 1') && content.includes('limit = 20')) {
      analysis.paginationPatterns.push('offset-pagination');
    }
    
    if (content.includes('skip = (page - 1) * limit')) {
      analysis.paginationPatterns.push('manual-skip-calculation');
    }
    
    if (content.includes('Math.ceil(total / limit)')) {
      analysis.paginationPatterns.push('manual-page-calculation');
    }

    // Generate recommendations
    if (analysis.hasPagination && !analysis.hasCursorPagination) {
      analysis.recommendations.push('Consider adding cursor pagination for better performance');
    }
    
    if (analysis.paginationPatterns.includes('manual-skip-calculation')) {
      analysis.recommendations.push('Replace manual pagination with paginationMiddleware');
    }
    
    if (analysis.paginationPatterns.includes('manual-page-calculation')) {
      analysis.recommendations.push('Use createComprehensivePagination for metadata');
    }

    report.controllers.push(analysis);
  }
});

// Analyze routes
ROUTES_TO_MIGRATE.forEach(route => {
  const routePath = path.join(ROUTES_DIR, route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    
    const analysis = {
      file: route,
      hasPaginationMiddleware: content.includes('paginationMiddleware'),
      hasOffsetMiddleware: content.includes('offsetPaginationMiddleware'),
      hasCursorMiddleware: content.includes('cursorPaginationMiddleware'),
      recommendations: []
    };

    if (!analysis.hasPaginationMiddleware) {
      analysis.recommendations.push('Add pagination middleware to list endpoints');
    }

    report.routes.push(analysis);
  }
});

// Generate overall recommendations
report.recommendations = [
  'Update all list endpoints to use paginationMiddleware',
  'Implement cursor pagination for feeds and real-time data',
  'Add performance monitoring to identify slow queries',
  'Create database indexes based on common query patterns',
  'Update client code to handle new pagination metadata format'
];

// Save report
const reportPath = path.join(__dirname, '../PAGINATION_MIGRATION_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`✅ Migration report saved to ${reportPath}\n`);

// Step 3: Generate migration templates
console.log('📝 Generating migration templates...');

// Controller template
const controllerTemplate = `// MIGRATION TEMPLATE FOR CONTROLLERS
// Replace your existing pagination logic with this pattern:

const { paginationService } = require('../services/paginationService');
const { sendPaginatedResponse } = require('../middleware/paginationMiddleware');
const { sendServerError } = require('../utils/responseHelper');

const getItems = async (req, res) => {
  try {
    // Build your query
    const query = { /* your base query */ };
    
    // Apply filters from req.query
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Execute paginated query
    const result = await paginationService.executeHybridPagination(
      YourModel,
      query,
      req.pagination,
      {
        useCursor: req.query.useCursor === 'true',
        cursorThreshold: 5000,
        queryOptions: {
          populate: [
            { path: 'author', select: 'firstName lastName email' }
          ]
        }
      }
    );

    // Send standardized response
    return sendPaginatedResponse(
      res,
      result.results,
      result.pagination,
      'Items retrieved successfully',
      {
        filters: req.query,
        performance: result.performance
      }
    );

  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve items');
  }
};
`;

// Route template
const routeTemplate = `// MIGRATION TEMPLATE FOR ROUTES
// Add pagination middleware to your routes:

const { offsetPaginationMiddleware, cursorPaginationMiddleware } = require('../middleware/paginationMiddleware');

// For traditional browsing (offset pagination)
router.get('/', 
  offsetPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 100,
    sortField: 'createdAt',
    sortOrder: 'desc'
  }),
  getItems
);

// For feeds/real-time data (cursor pagination)
router.get('/feed',
  cursorPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 50,
    cursorField: 'createdAt',
    sortField: 'createdAt',
    sortOrder: 'desc'
  }),
  getItemsFeed
);
`;

// Save templates
fs.writeFileSync(path.join(__dirname, '../CONTROLLER_MIGRATION_TEMPLATE.js'), controllerTemplate);
fs.writeFileSync(path.join(__dirname, '../ROUTE_MIGRATION_TEMPLATE.js'), routeTemplate);

console.log('✅ Migration templates generated\n');

// Step 4: Display summary
console.log('📋 MIGRATION SUMMARY');
console.log('==================');
console.log(`Controllers analyzed: ${report.controllers.length}`);
console.log(`Routes analyzed: ${report.routes.length}`);
console.log(`Controllers with pagination: ${report.controllers.filter(c => c.hasPagination).length}`);
console.log(`Routes with pagination middleware: ${report.routes.filter(r => r.hasPaginationMiddleware).length}`);

console.log('\n🎯 NEXT STEPS:');
console.log('1. Review the migration report: PAGINATION_MIGRATION_REPORT.json');
console.log('2. Use the templates to update your controllers and routes');
console.log('3. Test the new pagination system');
console.log('4. Update client code to handle new response format');
console.log('5. Monitor performance and optimize as needed');

console.log('\n📚 DOCUMENTATION:');
console.log('- Implementation Guide: docs/PAGINATION_IMPLEMENTATION_GUIDE.md');
console.log('- API Reference: See the guide for complete API documentation');

console.log('\n✨ Migration preparation complete!');
