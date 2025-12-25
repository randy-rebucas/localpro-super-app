#!/usr/bin/env node

/**
 * CI-friendly environment validation runner.
 *
 * Exits with code 0 if valid, 1 if invalid.
 */

require('dotenv').config();

const { validateEnvironment, getEnvironmentSummary } = require('../src/config/envValidation');

function main() {
  // Print a small summary first (helpful in CI logs)
  const summary = getEnvironmentSummary();
  // Avoid dumping secrets; summary only includes booleans / non-sensitive config.
  console.log('📋 Environment summary:');
  console.log(JSON.stringify(summary, null, 2));

  const result = validateEnvironment();

  if (!result.isValid) {
    console.error(`❌ Environment validation failed with ${result.errors.length} error(s).`);
    process.exit(1);
  }

  console.log('✅ Environment validation passed.');
  process.exit(0);
}

if (require.main === module) {
  main();
}


