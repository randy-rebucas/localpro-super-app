#!/usr/bin/env node

/**
 * Email Service Configuration Script
 * 
 * This script helps configure email services for the LocalPro Super App.
 * It supports Resend, SendGrid, and SMTP providers.
 * 
 * Usage:
 *   node scripts/setup-email.js
 *   node scripts/setup-email.js --test
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

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

async function configureEmail() {
  log('📧 Email Service Configuration', 'info');
  log('==============================', 'info');
  
  console.log('\nEmail services provide notifications and communications for the LocalPro Super App.');
  console.log('Choose your preferred email service provider:');
  console.log('• Resend (Recommended) - Modern API-based service');
  console.log('• SendGrid - Popular email service');
  console.log('• SMTP - Generic SMTP server');
  
  const service = await question('\nSelect email service (resend/sendgrid/smtp) [resend]: ') || 'resend';
  const fromEmail = await question('Enter your FROM email address: ');
  
  if (!validateEmail(fromEmail)) {
    log('Invalid email format.', 'error');
    return false;
  }
  
  let config = {
    EMAIL_SERVICE: service,
    FROM_EMAIL: fromEmail
  };
  
  if (service === 'resend') {
    console.log('\n📋 Resend Setup Steps:');
    console.log('1. Sign up at https://resend.com/');
    console.log('2. Get your API key from the dashboard');
    console.log('3. Verify your domain (optional but recommended)');
    
    const apiKey = await question('Enter your Resend API Key: ');
    config.RESEND_API_KEY = apiKey;
    
  } else if (service === 'sendgrid') {
    console.log('\n📋 SendGrid Setup Steps:');
    console.log('1. Sign up at https://sendgrid.com/');
    console.log('2. Create an API key in Settings > API Keys');
    console.log('3. Verify your sender identity');
    
    const apiKey = await question('Enter your SendGrid API Key: ');
    config.SENDGRID_API_KEY = apiKey;
    
  } else if (service === 'smtp') {
    console.log('\n📋 SMTP Setup Steps:');
    console.log('1. Get SMTP credentials from your email provider');
    console.log('2. Common providers: Gmail, Outlook, Hostinger, etc.');
    console.log('3. Enable "Less secure app access" or use App Passwords');
    
    const host = await question('Enter SMTP host (e.g., smtp.gmail.com): ');
    const port = await question('Enter SMTP port [587]: ') || '587';
    const user = await question('Enter SMTP username: ');
    const pass = await question('Enter SMTP password: ');
    const secure = await question('Use SSL/TLS? (y/n) [n]: ') || 'n';
    
    config.SMTP_HOST = host;
    config.SMTP_PORT = port;
    config.SMTP_USER = user;
    config.SMTP_PASS = pass;
    config.SMTP_SECURE = secure.toLowerCase() === 'y';
  } else {
    log('Invalid email service selected.', 'error');
    return false;
  }
  
  // Update environment file
  let envContent = readEnvFile();
  for (const [key, value] of Object.entries(config)) {
    envContent = updateEnvVariable(key, value, envContent);
  }
  writeEnvFile(envContent);
  
  log('Email service configuration saved successfully!', 'success');
  
  return config;
}

async function testEmailService(config) {
  try {
    if (config.EMAIL_SERVICE === 'resend') {
      const { Resend } = require('resend');
      const resend = new Resend(config.RESEND_API_KEY);
      
      // Test by checking API key validity (this would require an actual API call)
      log('Resend email service configured!', 'success');
      log(`From Email: ${config.FROM_EMAIL}`, 'info');
      log('Note: Actual email sending will be tested when the app runs', 'info');
      
    } else if (config.EMAIL_SERVICE === 'sendgrid') {
      log('SendGrid email service configured!', 'success');
      log(`From Email: ${config.FROM_EMAIL}`, 'info');
      log('Note: Actual email sending will be tested when the app runs', 'info');
      
    } else if (config.EMAIL_SERVICE === 'smtp') {
      log('SMTP email service configured!', 'success');
      log(`From Email: ${config.FROM_EMAIL}`, 'info');
      log(`SMTP Host: ${config.SMTP_HOST}:${config.SMTP_PORT}`, 'info');
      log('Note: Actual email sending will be tested when the app runs', 'info');
    }
    
    return true;
  } catch (error) {
    log(`Email service test failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === '--test') {
      // Test existing configuration
      log('🧪 Testing Email Service Configuration...', 'info');
      
      const envContent = readEnvFile();
      const config = {
        EMAIL_SERVICE: envContent.match(/^EMAIL_SERVICE=(.+)$/m)?.[1],
        FROM_EMAIL: envContent.match(/^FROM_EMAIL=(.+)$/m)?.[1],
        RESEND_API_KEY: envContent.match(/^RESEND_API_KEY=(.+)$/m)?.[1],
        SENDGRID_API_KEY: envContent.match(/^SENDGRID_API_KEY=(.+)$/m)?.[1],
        SMTP_HOST: envContent.match(/^SMTP_HOST=(.+)$/m)?.[1],
        SMTP_PORT: envContent.match(/^SMTP_PORT=(.+)$/m)?.[1],
        SMTP_USER: envContent.match(/^SMTP_USER=(.+)$/m)?.[1],
        SMTP_PASS: envContent.match(/^SMTP_PASS=(.+)$/m)?.[1],
        SMTP_SECURE: envContent.match(/^SMTP_SECURE=(.+)$/m)?.[1]
      };
      
      if (!config.EMAIL_SERVICE) {
        log('Email service not configured. Run without --test to configure.', 'error');
        process.exit(1);
      }
      
      await testEmailService(config);
    } else {
      // Configure email service
      const config = await configureEmail();
      
      if (config) {
        const testConnection = await question('\nTest email service configuration? (y/n) [y]: ') || 'y';
        if (testConnection.toLowerCase() === 'y') {
          await testEmailService(config);
        }
        
        log('\n🎉 Email service setup complete!', 'success');
        log('Next steps:', 'info');
        log('1. Restart your server: npm run dev', 'info');
        log('2. Test email sending in your app', 'info');
        log('3. Check email delivery and spam folders', 'info');
        
        if (config.EMAIL_SERVICE === 'resend') {
          log('\n📧 Resend Tips:', 'info');
          log('• Verify your domain for better deliverability', 'info');
          log('• Check Resend dashboard for delivery statistics', 'info');
          log('• Use Resend templates for consistent branding', 'info');
        }
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

module.exports = { configureEmail, testEmailService };
