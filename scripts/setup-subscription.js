#!/usr/bin/env node

/**
 * LocalPro Plus Subscription System Setup
 * This script initializes the subscription system with default plans
 */

const mongoose = require('mongoose');
const { seedSubscriptionPlans } = require('../src/seeders/subscriptionPlansSeeder');
require('dotenv').config();

const setupSubscriptionSystem = async () => {
  try {
    console.log('🚀 Setting up LocalPro Plus Subscription System...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Seed subscription plans
    console.log('🌱 Seeding subscription plans...');
    const plans = await seedSubscriptionPlans();
    console.log(`✅ Created ${plans.length} subscription plans\n`);

    // Display created plans
    console.log('📋 Subscription Plans Created:');
    console.log('================================');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   💰 $${plan.price.monthly}/month, $${plan.price.yearly}/year`);
      console.log(`   📝 ${plan.description}`);
      console.log(`   🎯 Features: ${plan.features.length} included`);
      console.log(`   📊 Limits: ${plan.limits.maxServices || 'unlimited'} services, ${plan.limits.maxBookings || 'unlimited'} bookings`);
      console.log(`   ${plan.isPopular ? '⭐ Popular Plan' : ''}`);
      console.log('');
    });

    console.log('🎉 LocalPro Plus Subscription System setup complete!');
    console.log('\n📚 Next Steps:');
    console.log('1. Configure PayPal webhook endpoint: /api/paypal/webhook');
    console.log('2. Set up PayPal subscription products in your PayPal dashboard');
    console.log('3. Configure environment variables for PayPal integration');
    console.log('4. Test subscription flow with sandbox accounts');
    console.log('\n🔗 API Endpoints:');
    console.log('• GET /api/localpro-plus/plans - View available plans');
    console.log('• POST /api/localpro-plus/subscribe - Subscribe to a plan');
    console.log('• GET /api/localpro-plus/my-subscription - View user subscription');
    console.log('• POST /api/localpro-plus/cancel - Cancel subscription');
    console.log('• GET /api/localpro-plus/usage - View usage statistics');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupSubscriptionSystem();
}

module.exports = setupSubscriptionSystem;
