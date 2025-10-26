#!/usr/bin/env node

/**
 * Cloudinary File Storage Configuration Script
 * 
 * This script helps configure Cloudinary file storage for the LocalPro Super App.
 * It sets up image and file upload capabilities.
 * 
 * Usage:
 *   node scripts/setup-cloudinary.js
 *   node scripts/setup-cloudinary.js --test
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function getEnvFilePath() {
  return path.join(process.cwd(), '.env');
}

function getEnvExamplePath() {
  return path.join(process.cwd(), 'env.example');
}

function readEnvFile() {
  const envPath = getEnvFilePath();
  if (!fs.existsSync(envPath)) {
    const examplePath = getEnvExamplePath();
    if (fs.existsSync(examplePath)) {
      log('Creating .env file from env.example...', 'info');
      fs.copyFileSync(examplePath, envPath);
    } else {
      log('No .env or env.example file found!', 'error');
      process.exit(1);
    }
  }
  return fs.readFileSync(envPath, 'utf8');
}

function writeEnvFile(content) {
  fs.writeFileSync(getEnvFilePath(), content);
}

function updateEnvVariable(key, value, content) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  
  if (regex.test(content)) {
    return content.replace(regex, newLine);
  } else {
    return content + `\n${newLine}`;
  }
}

async function configureCloudinary() {
  log('☁️ Cloudinary File Storage Configuration', 'info');
  log('========================================', 'info');
  
  console.log('\nCloudinary provides image and file upload capabilities for the LocalPro Super App.');
  console.log('You\'ll need a Cloudinary account and the following credentials:');
  console.log('• Cloud Name');
  console.log('• API Key');
  console.log('• API Secret');
  
  console.log('\n📋 Setup Steps:');
  console.log('1. Sign up at https://cloudinary.com/');
  console.log('2. Get your credentials from the Dashboard');
  console.log('3. Configure upload presets (optional)');
  console.log('4. Set up transformations (optional)');
  
  const cloudName = await question('\nEnter your Cloudinary Cloud Name: ');
  const apiKey = await question('Enter your Cloudinary API Key: ');
  const apiSecret = await question('Enter your Cloudinary API Secret: ');
  
  // Update environment file
  let envContent = readEnvFile();
  envContent = updateEnvVariable('CLOUDINARY_CLOUD_NAME', cloudName, envContent);
  envContent = updateEnvVariable('CLOUDINARY_API_KEY', apiKey, envContent);
  envContent = updateEnvVariable('CLOUDINARY_API_SECRET', apiSecret, envContent);
  
  writeEnvFile(envContent);
  
  log('Cloudinary configuration saved successfully!', 'success');
  
  return {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret
  };
}

async function testCloudinaryConnection(config) {
  try {
    const cloudinary = require('cloudinary').v2;
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET
    });
    
    // Test by checking configuration
    log('Cloudinary connection successful!', 'success');
    log(`Cloud Name: ${config.CLOUDINARY_CLOUD_NAME}`, 'info');
    log(`API Key: ${config.CLOUDINARY_API_KEY.substring(0, 8)}...`, 'info');
    
    // Test with a simple API call
    try {
      const result = await cloudinary.api.ping();
      log('Cloudinary API ping successful!', 'success');
    } catch (error) {
      log(`Cloudinary API test failed: ${error.message}`, 'warning');
    }
    
    return true;
  } catch (error) {
    log(`Cloudinary connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === '--test') {
      // Test existing configuration
      log('🧪 Testing Cloudinary Connection...', 'info');
      
      const envContent = readEnvFile();
      const config = {
        CLOUDINARY_CLOUD_NAME: envContent.match(/^CLOUDINARY_CLOUD_NAME=(.+)$/m)?.[1],
        CLOUDINARY_API_KEY: envContent.match(/^CLOUDINARY_API_KEY=(.+)$/m)?.[1],
        CLOUDINARY_API_SECRET: envContent.match(/^CLOUDINARY_API_SECRET=(.+)$/m)?.[1]
      };
      
      if (!config.CLOUDINARY_CLOUD_NAME) {
        log('Cloudinary not configured. Run without --test to configure.', 'error');
        process.exit(1);
      }
      
      await testCloudinaryConnection(config);
    } else {
      // Configure Cloudinary
      const config = await configureCloudinary();
      
      if (config) {
        const testConnection = await question('\nTest Cloudinary connection? (y/n) [y]: ') || 'y';
        if (testConnection.toLowerCase() === 'y') {
          await testCloudinaryConnection(config);
        }
        
        log('\n🎉 Cloudinary setup complete!', 'success');
        log('Next steps:', 'info');
        log('1. Restart your server: npm run dev', 'info');
        log('2. Test file uploads in your app', 'info');
        log('3. Configure upload presets in Cloudinary dashboard', 'info');
        
        log('\n☁️ Cloudinary Tips:', 'info');
        log('• Set up upload presets for different file types', 'info');
        log('• Configure transformations for image optimization', 'info');
        log('• Set up webhooks for upload notifications', 'info');
        log('• Monitor usage and billing in the dashboard', 'info');
      }
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { configureCloudinary, testCloudinaryConnection };
