/**
 * Script to help generate Swagger documentation for all routes
 * This is a helper script - actual documentation should be added directly to route files
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'src', 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log(`Found ${routeFiles.length} route files:`);
routeFiles.forEach(file => {
  console.log(`  - ${file}`);
});
