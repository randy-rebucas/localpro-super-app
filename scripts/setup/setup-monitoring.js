#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 LocalPro Super App - Performance Monitoring Setup');
console.log('====================================================\n');

// Check if required dependencies are installed
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['prom-client', 'express-prometheus-middleware', 'systeminformation'];

console.log('📦 Checking dependencies...');
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  console.log('Run: npm install ' + missingDeps.join(' '));
  process.exit(1);
}

console.log('✅ All required dependencies are installed\n');

// Check if monitoring files exist
const monitoringFiles = [
  'src/middleware/metricsMiddleware.js',
  'src/routes/monitoring.js',
  'src/routes/alerts.js',
  'src/services/databasePerformanceMonitor.js',
  'src/routes/databaseMonitoring.js',
  'src/routes/metricsStream.js',
  'src/templates/monitoring-dashboard.html',
  'docs/PERFORMANCE_MONITORING_DASHBOARD.md'
];

console.log('📁 Checking monitoring files...');
const missingFiles = monitoringFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.log(`❌ Missing files: ${missingFiles.join(', ')}`);
  console.log('Please ensure all monitoring files are properly created.');
  process.exit(1);
}

console.log('✅ All monitoring files are present\n');

// Check server.js integration
console.log('🔧 Checking server integration...');
const serverContent = fs.readFileSync('src/server.js', 'utf8');

const requiredImports = [
  'monitoringRoutes',
  'alertsRoutes',
  'databaseMonitoringRoutes',
  'metricsStreamRoutes',
  'metricsMiddleware'
];

const missingImports = requiredImports.filter(importName => 
  !serverContent.includes(importName)
);

if (missingImports.length > 0) {
  console.log(`❌ Missing server imports: ${missingImports.join(', ')}`);
  console.log('Please ensure server.js is properly updated with monitoring routes.');
  process.exit(1);
}

console.log('✅ Server integration is complete\n');

// Create environment configuration
console.log('⚙️  Setting up environment configuration...');
const envExample = fs.readFileSync('env.example', 'utf8');

const monitoringConfig = `
# Performance Monitoring Configuration
MONITORING_ENABLED=true
METRICS_COLLECTION_INTERVAL=30000
ALERT_CHECK_INTERVAL=60000
SLOW_QUERY_THRESHOLD=1000
PROMETHEUS_METRICS_ENABLED=true
`;

if (!envExample.includes('MONITORING_ENABLED')) {
  fs.appendFileSync('env.example', monitoringConfig);
  console.log('✅ Added monitoring configuration to env.example');
} else {
  console.log('✅ Monitoring configuration already exists in env.example');
}

console.log('\n🎉 Performance Monitoring Setup Complete!');
console.log('==========================================\n');

console.log('📋 Next Steps:');
console.log('1. Copy env.example to .env and update monitoring settings');
console.log('2. Start your application: npm start');
console.log('3. Access the dashboard: http://localhost:5000/monitoring');
console.log('4. Check metrics API: http://localhost:5000/api/monitoring/metrics/json');
console.log('5. View alerts: http://localhost:5000/api/monitoring/alerts\n');

console.log('📚 Documentation:');
console.log('- Dashboard Guide: docs/PERFORMANCE_MONITORING_DASHBOARD.md');
console.log('- API Endpoints: http://localhost:5000/api/monitoring/health\n');

console.log('🔍 Available Endpoints:');
console.log('- Dashboard: GET /monitoring');
console.log('- Metrics: GET /api/monitoring/metrics');
console.log('- Health: GET /api/monitoring/health');
console.log('- Alerts: GET /api/monitoring/alerts');
console.log('- Database: GET /api/monitoring/database/stats');
console.log('- Stream: GET /api/monitoring/stream/stream\n');

console.log('🚨 Alert Thresholds (configurable):');
console.log('- Response Time: 5000ms');
console.log('- Error Rate: 10 errors/minute');
console.log('- Memory Usage: 90%');
console.log('- CPU Usage: 80%');
console.log('- Active Connections: 1000\n');

console.log('✨ Your performance monitoring system is ready!');
