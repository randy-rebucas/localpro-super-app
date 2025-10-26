#!/usr/bin/env node

/**
 * JWT Secret Generation Script
 * 
 * This script generates cryptographically secure JWT secrets for development and production.
 * Run this script to generate new secrets when setting up the application.
 * 
 * Usage:
 *   node scripts/generate-jwt-secrets.js
 *   node scripts/generate-jwt-secrets.js --env production
 *   node scripts/generate-jwt-secrets.js --env development
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const SECRET_LENGTH = 64; // 64 bytes = 128 hex characters
const ENV_FILES = {
  development: 'env.example',
  production: 'env.production'
};

/**
 * Generate a cryptographically secure random secret
 * @param {number} length - Length in bytes
 * @returns {string} Hex-encoded secret
 */
function generateSecret(length = SECRET_LENGTH) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate JWT secrets for the specified environment
 * @param {string} environment - Environment name (development/production)
 */
function generateJWTSecrets(environment = 'development') {
  console.log(`🔐 Generating JWT secrets for ${environment} environment...\n`);
  
  // Generate secrets
  const accessTokenSecret = generateSecret();
  const refreshTokenSecret = generateSecret();
  
  console.log('Generated Secrets:');
  console.log('==================');
  console.log(`Access Token Secret: ${accessTokenSecret}`);
  console.log(`Refresh Token Secret: ${refreshTokenSecret}`);
  console.log('');
  
  // Get environment file path
  const envFile = ENV_FILES[environment];
  if (!envFile) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments: development, production');
    process.exit(1);
  }
  
  const envFilePath = path.join(process.cwd(), envFile);
  
  // Check if file exists
  if (!fs.existsSync(envFilePath)) {
    console.error(`❌ Environment file not found: ${envFile}`);
    console.log('Make sure you are running this script from the project root directory.');
    process.exit(1);
  }
  
  // Read current file content
  let fileContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Update JWT secrets in the file
  const jwtSecretRegex = /^JWT_SECRET=.*$/m;
  const jwtRefreshSecretRegex = /^JWT_REFRESH_SECRET=.*$/m;
  
  // Update or add JWT_SECRET
  if (jwtSecretRegex.test(fileContent)) {
    fileContent = fileContent.replace(jwtSecretRegex, `JWT_SECRET=${accessTokenSecret}`);
  } else {
    // Add JWT_SECRET if it doesn't exist
    const jwtSection = `# JWT Configuration\nJWT_SECRET=${accessTokenSecret}`;
    fileContent = fileContent.replace(/(# JWT.*?\n)/, `$1${jwtSection}\n`);
  }
  
  // Update or add JWT_REFRESH_SECRET
  if (jwtRefreshSecretRegex.test(fileContent)) {
    fileContent = fileContent.replace(jwtRefreshSecretRegex, `JWT_REFRESH_SECRET=${refreshTokenSecret}`);
  } else {
    // Add JWT_REFRESH_SECRET after JWT_SECRET
    const refreshSecretLine = `JWT_REFRESH_SECRET=${refreshTokenSecret}`;
    fileContent = fileContent.replace(/(JWT_SECRET=.*\n)/, `$1${refreshSecretLine}\n`);
  }
  
  // Write updated content back to file
  fs.writeFileSync(envFilePath, fileContent, 'utf8');
  
  console.log(`✅ Updated ${envFile} with new JWT secrets`);
  console.log('');
  console.log('Security Recommendations:');
  console.log('========================');
  console.log('1. Keep these secrets secure and never commit them to version control');
  console.log('2. Use different secrets for development and production');
  console.log('3. Rotate secrets regularly (every 90 days recommended)');
  console.log('4. Store production secrets in a secure environment variable service');
  console.log('5. Never share secrets in plain text or logs');
  console.log('');
  console.log('Next Steps:');
  console.log('===========');
  console.log('1. Copy the environment file to .env: cp env.example .env');
  console.log('2. Update other environment variables as needed');
  console.log('3. Start your application: npm start');
}

/**
 * Validate JWT secrets in environment file
 * @param {string} environment - Environment name
 */
function validateJWTSecrets(environment = 'development') {
  console.log(`🔍 Validating JWT secrets in ${environment} environment...\n`);
  
  const envFile = ENV_FILES[environment];
  const envFilePath = path.join(process.cwd(), envFile);
  
  if (!fs.existsSync(envFilePath)) {
    console.error(`❌ Environment file not found: ${envFile}`);
    return false;
  }
  
  const fileContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Extract JWT secrets
  const jwtSecretMatch = fileContent.match(/^JWT_SECRET=(.+)$/m);
  const jwtRefreshSecretMatch = fileContent.match(/^JWT_REFRESH_SECRET=(.+)$/m);
  
  const jwtSecret = jwtSecretMatch ? jwtSecretMatch[1] : null;
  const jwtRefreshSecret = jwtRefreshSecretMatch ? jwtRefreshSecretMatch[1] : null;
  
  console.log('Current JWT Configuration:');
  console.log('==========================');
  console.log(`JWT_SECRET: ${jwtSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`JWT_REFRESH_SECRET: ${jwtRefreshSecret ? '✅ Set' : '❌ Missing'}`);
  
  if (jwtSecret) {
    console.log(`Secret length: ${jwtSecret.length} characters`);
    console.log(`Secret strength: ${jwtSecret.length >= 64 ? '✅ Strong' : '⚠️  Weak (should be at least 64 characters)'}`);
  }
  
  if (jwtRefreshSecret) {
    console.log(`Refresh secret length: ${jwtRefreshSecret.length} characters`);
    console.log(`Refresh secret strength: ${jwtRefreshSecret.length >= 64 ? '✅ Strong' : '⚠️  Weak (should be at least 64 characters)'}`);
  }
  
  // Check for default/example values
  const defaultValues = [
    'your-super-secret-jwt-key-here',
    'your-super-secure-production-jwt-secret-key-here',
    'test-secret',
    'secret',
    'jwt-secret'
  ];
  
  if (jwtSecret && defaultValues.includes(jwtSecret)) {
    console.log('⚠️  WARNING: JWT_SECRET is using a default/example value!');
  }
  
  if (jwtRefreshSecret && defaultValues.includes(jwtRefreshSecret)) {
    console.log('⚠️  WARNING: JWT_REFRESH_SECRET is using a default/example value!');
  }
  
  const isValid = jwtSecret && jwtRefreshSecret && 
                  jwtSecret.length >= 64 && jwtRefreshSecret.length >= 64 &&
                  !defaultValues.includes(jwtSecret) && !defaultValues.includes(jwtRefreshSecret);
  
  console.log('');
  console.log(`Overall status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  return isValid;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  
  console.log('🔐 JWT Secret Management Tool');
  console.log('=============================\n');
  
  switch (command) {
    case '--env':
    case 'generate':
      generateJWTSecrets(environment);
      break;
    case 'validate':
      validateJWTSecrets(environment);
      break;
    case '--help':
    case 'help':
      console.log('Usage:');
      console.log('  node scripts/generate-jwt-secrets.js [command] [environment]');
      console.log('');
      console.log('Commands:');
      console.log('  generate, --env    Generate new JWT secrets (default)');
      console.log('  validate          Validate existing JWT secrets');
      console.log('  help, --help      Show this help message');
      console.log('');
      console.log('Environments:');
      console.log('  development       Update env.example (default)');
      console.log('  production        Update env.production');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/generate-jwt-secrets.js');
      console.log('  node scripts/generate-jwt-secrets.js generate development');
      console.log('  node scripts/generate-jwt-secrets.js validate production');
      break;
    default:
      // Default action is to generate secrets
      generateJWTSecrets(environment);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateSecret,
  generateJWTSecrets,
  validateJWTSecrets
};
