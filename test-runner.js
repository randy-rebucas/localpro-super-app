#!/usr/bin/env node

/**
 * Comprehensive Test Runner for LocalPro Super App
 * 
 * This script provides various testing utilities and commands
 * for running different types of tests in the application.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configuration
const testConfig = {
  unit: {
    pattern: 'tests/**/*.test.js',
    description: 'Unit tests for individual functions and components'
  },
  integration: {
    pattern: 'tests/integration/**/*.test.js',
    description: 'Integration tests for API endpoints and services'
  },
  e2e: {
    pattern: 'tests/e2e/**/*.test.js',
    description: 'End-to-end tests for complete user workflows'
  },
  auth: {
    pattern: 'tests/middleware/auth.test.js',
    description: 'Authentication and authorization tests'
  },
  payment: {
    pattern: 'tests/services/payment.test.js',
    description: 'Payment processing tests'
  },
  user: {
    pattern: 'tests/controllers/userManagement.test.js',
    description: 'User management tests'
  },
  validation: {
    pattern: 'tests/utils/validation.test.js',
    description: 'Data validation tests'
  }
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test execution functions
function runTests(testType, options = {}) {
  const config = testConfig[testType];
  if (!config) {
    logError(`Unknown test type: ${testType}`);
    return false;
  }

  logHeader(`Running ${testType.toUpperCase()} Tests`);
  logInfo(config.description);

  try {
    const command = buildJestCommand(testType, options);
    logInfo(`Executing: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    logSuccess(`${testType} tests completed successfully`);
    return true;
  } catch (error) {
    logError(`${testType} tests failed`);
    return false;
  }
}

function buildJestCommand(testType, options = {}) {
  const baseCommand = 'npx jest';
  const config = testConfig[testType];
  
  let command = `${baseCommand} --testPathPattern="${config.pattern}"`;
  
  if (options.watch) {
    command += ' --watch';
  }
  
  if (options.coverage) {
    command += ' --coverage';
  }
  
  if (options.verbose) {
    command += ' --verbose';
  }
  
  if (options.silent) {
    command += ' --silent';
  }
  
  if (options.maxWorkers) {
    command += ` --maxWorkers=${options.maxWorkers}`;
  }
  
  return command;
}

function runAllTests(options = {}) {
  logHeader('Running All Tests');
  
  const testTypes = ['auth', 'payment', 'user', 'validation'];
  const results = {};
  
  for (const testType of testTypes) {
    results[testType] = runTests(testType, options);
  }
  
  // Summary
  logHeader('Test Results Summary');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [testType, passed] of Object.entries(results)) {
    if (passed) {
      logSuccess(`${testType} tests: PASSED`);
    } else {
      logError(`${testType} tests: FAILED`);
    }
  }
  
  logInfo(`Overall: ${passed}/${total} test suites passed`);
  
  return passed === total;
}

function generateCoverageReport() {
  logHeader('Generating Coverage Report');
  
  try {
    execSync('npx jest --coverage --coverageReporters=html', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    logSuccess('Coverage report generated in coverage/index.html');
    logInfo('Open coverage/index.html in your browser to view the report');
  } catch (error) {
    logError('Failed to generate coverage report');
  }
}

function validateTestEnvironment() {
  logHeader('Validating Test Environment');
  
  const checks = [
    {
      name: 'Jest installed',
      check: () => {
        try {
          execSync('npx jest --version', { encoding: 'utf8', stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'MongoDB Memory Server available',
      check: () => {
        try {
          require('mongodb-memory-server');
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Test setup file exists',
      check: () => fs.existsSync('tests/setup.js')
    },
    {
      name: 'Jest config exists',
      check: () => fs.existsSync('jest.config.js')
    },
    {
      name: 'Test directories exist',
      check: () => {
        const dirs = ['tests/middleware', 'tests/controllers', 'tests/services', 'tests/utils'];
        return dirs.every(dir => fs.existsSync(dir));
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (check.check()) {
      logSuccess(check.name);
    } else {
      logError(check.name);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    logSuccess('Test environment validation passed');
  } else {
    logError('Test environment validation failed');
    logWarning('Please fix the issues above before running tests');
  }
  
  return allPassed;
}

function showTestHelp() {
  logHeader('Test Runner Help');
  
  log('Available commands:', 'bright');
  log('');
  
  Object.entries(testConfig).forEach(([type, config]) => {
    log(`  ${type.padEnd(12)} - ${config.description}`, 'cyan');
  });
  
  log('');
  log('Usage examples:', 'bright');
  log('');
  log('  node test-runner.js all                    # Run all tests', 'green');
  log('  node test-runner.js auth                    # Run authentication tests', 'green');
  log('  node test-runner.js payment --coverage      # Run payment tests with coverage', 'green');
  log('  node test-runner.js user --watch            # Run user tests in watch mode', 'green');
  log('  node test-runner.js validate                 # Validate test environment', 'green');
  log('  node test-runner.js coverage                 # Generate coverage report', 'green');
  log('  node test-runner.js help                     # Show this help', 'green');
  log('');
  log('Options:', 'bright');
  log('  --watch      Run tests in watch mode', 'yellow');
  log('  --coverage   Generate coverage report', 'yellow');
  log('  --verbose    Show detailed output', 'yellow');
  log('  --silent     Suppress output', 'yellow');
  log('  --maxWorkers Set number of worker processes', 'yellow');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--watch') options.watch = true;
    else if (arg === '--coverage') options.coverage = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--silent') options.silent = true;
    else if (arg === '--maxWorkers' && args[i + 1]) {
      options.maxWorkers = args[i + 1];
      i++;
    }
  }
  
  switch (command) {
    case 'all':
      runAllTests(options);
      break;
      
    case 'auth':
    case 'payment':
    case 'user':
    case 'validation':
    case 'unit':
    case 'integration':
    case 'e2e':
      runTests(command, options);
      break;
      
    case 'validate':
      validateTestEnvironment();
      break;
      
    case 'coverage':
      generateCoverageReport();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showTestHelp();
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      logInfo('Run "node test-runner.js help" for available commands');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  runAllTests,
  generateCoverageReport,
  validateTestEnvironment,
  testConfig
};
