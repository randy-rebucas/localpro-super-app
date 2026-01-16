#!/usr/bin/env node

/**
 * PayMaya Configuration Setup Script
 * This script helps you set up PayMaya configuration for the LocalPro Super App
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 PayMaya Configuration Setup');
console.log('==============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Creating .env file from env.example...\n');
  
  if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created successfully!\n');
  } else {
    console.log('❌ env.example file not found either!');
    process.exit(1);
  }
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// PayMaya Sandbox Test Credentials (for development/testing only)
const paymayaConfig = {
  publicKey: 'pk-Z0OSzLvIcOI2QvUA8yK8hF-5q7SLIOi2RE1A87x7R10',
  secretKey: 'sk-X8qolYjy62kIzEbr0QRK1h4b3KDVHaNcw5k39mRjvR',
  mode: 'sandbox',
  webhookSecret: 'whsec_test_webhook_secret_key_12345'
};

console.log('🔑 Setting up PayMaya Sandbox Configuration...\n');

// Update PayMaya configuration in .env file
const paymayaLines = [
  `PAYMAYA_PUBLIC_KEY=${paymayaConfig.publicKey}`,
  `PAYMAYA_SECRET_KEY=${paymayaConfig.secretKey}`,
  `PAYMAYA_MODE=${paymayaConfig.mode}`,
  `PAYMAYA_WEBHOOK_SECRET=${paymayaConfig.webhookSecret}`
];

// Replace or add PayMaya configuration
paymayaLines.forEach(line => {
  const key = line.split('=')[0];
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(envContent)) {
    // Replace existing line
    envContent = envContent.replace(regex, line);
    console.log(`✅ Updated ${key}`);
  } else {
    // Add new line
    envContent += `\n${line}`;
    console.log(`✅ Added ${key}`);
  }
});

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log('\n🎉 PayMaya configuration setup complete!');
console.log('\n📋 Configuration Summary:');
console.log(`   Public Key: ${paymayaConfig.publicKey}`);
console.log(`   Secret Key: ${paymayaConfig.secretKey}`);
console.log(`   Mode: ${paymayaConfig.mode}`);
console.log(`   Webhook Secret: ${paymayaConfig.webhookSecret}`);

console.log('\n⚠️  Important Notes:');
console.log('   - These are SANDBOX credentials for testing only');
console.log('   - For production, replace with your actual PayMaya credentials');
console.log('   - Get production credentials from: https://business.maya.ph/');
console.log('   - Test cards available in PayMaya documentation');

console.log('\n🧪 Test Cards (Sandbox):');
console.log('   - Visa: 4123 4512 3456 7890');
console.log('   - Mastercard: 5123 4512 3456 7890');
console.log('   - CVV: 123');
console.log('   - Expiry: Any future date');

console.log('\n🚀 Next Steps:');
console.log('   1. Restart your server: npm run dev');
console.log('   2. Test PayMaya config: node test-paymaya.js');
console.log('   3. Run API tests: node test-api.js');

console.log('\n📚 Documentation:');
console.log('   - PayMaya API: https://developers.maya.ph/');
console.log('   - Integration Guide: PAYMAYA_INTEGRATION.md');
