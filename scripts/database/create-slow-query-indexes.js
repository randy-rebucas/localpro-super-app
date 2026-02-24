#!/usr/bin/env node

/**
 * Script to create critical indexes for slow query optimization
 * These indexes address identified performance bottlenecks
 * 
 * Run with: node scripts/create-slow-query-indexes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const logger = require('../../src/config/logger');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connected for index creation');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Create critical indexes for performance optimization
 */
async function createCriticalIndexes() {
  const db = mongoose.connection.db;
  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  try {
    // BOOKING COLLECTION INDEXES
    const bookingIndexes = [
      {
        name: 'booking_provider_status_createdAt',
        fields: { provider: 1, status: 1, createdAt: 1 },
        collection: 'bookings'
      },
      {
        name: 'booking_provider_payment_status',
        fields: { provider: 1, 'payment.status': 1 },
        collection: 'bookings'
      },
      {
        name: 'booking_client_status_bookingDate',
        fields: { client: 1, status: 1, bookingDate: 1 },
        collection: 'bookings'
      },
      {
        name: 'booking_service_status_createdAt',
        fields: { service: 1, status: 1, createdAt: 1 },
        collection: 'bookings'
      },
      {
        name: 'booking_status_createdAt_desc',
        fields: { status: 1, createdAt: -1 },
        collection: 'bookings'
      }
    ];

    // FEATUREUSAGE COLLECTION INDEXES
    const featureUsageIndexes = [
      {
        name: 'featureusage_user_timestamp',
        fields: { user: 1, timestamp: -1 },
        collection: 'featureusages'
      },
      {
        name: 'featureusage_subscription_feature',
        fields: { subscription: 1, feature: 1 },
        collection: 'featureusages'
      },
      {
        name: 'featureusage_feature_timestamp',
        fields: { feature: 1, timestamp: -1 },
        collection: 'featureusages'
      },
      {
        name: 'featureusage_user_feature',
        fields: { user: 1, feature: 1 },
        collection: 'featureusages'
      }
    ];

    // REFERRAL COLLECTION INDEXES
    const referralIndexes = [
      {
        name: 'referral_referrer_status',
        fields: { referrer: 1, status: 1 },
        collection: 'referrals'
      },
      {
        name: 'referral_status_createdAt_desc',
        fields: { status: 1, createdAt: -1 },
        collection: 'referrals'
      },
      {
        name: 'referral_referrer_createdAt_desc',
        fields: { referrer: 1, createdAt: -1 },
        collection: 'referrals'
      }
    ];

    // MARKETPLACE/SERVICE COLLECTION INDEXES
    const serviceIndexes = [
      {
        name: 'service_provider_category_isActive',
        fields: { provider: 1, category: 1, isActive: 1 },
        collection: 'marketplaces'
      },
      {
        name: 'service_category_subcategory_isActive',
        fields: { category: 1, subcategory: 1, isActive: 1 },
        collection: 'marketplaces'
      }
    ];

    // VERIFICATIONREQUEST COLLECTION INDEXES
    const verificationIndexes = [
      {
        name: 'verification_status_createdAt',
        fields: { status: 1, createdAt: -1 },
        collection: 'verificationrequests'
      },
      {
        name: 'verification_type_status',
        fields: { type: 1, status: 1 },
        collection: 'verificationrequests'
      },
      {
        name: 'verification_user_status',
        fields: { user: 1, status: 1 },
        collection: 'verificationrequests'
      }
    ];

    // Combine all indexes
    const allIndexes = [
      ...bookingIndexes,
      ...featureUsageIndexes,
      ...referralIndexes,
      ...serviceIndexes,
      ...verificationIndexes
    ];

    logger.info(`Creating ${allIndexes.length} critical indexes...`);
    console.log(`\n📊 Creating ${allIndexes.length} critical indexes for performance optimization\n`);

    // Create each index
    for (const index of allIndexes) {
      try {
        const collection = db.collection(index.collection);
        
        // Check if index already exists
        const existingIndexes = await collection.getIndexes();
        const indexExists = Object.values(existingIndexes).some(idx => 
          JSON.stringify(idx.key) === JSON.stringify(index.fields)
        );

        if (indexExists) {
          logger.info(`Index already exists: ${index.name} on ${index.collection}`);
          results.skipped.push({
            name: index.name,
            collection: index.collection,
            reason: 'Index already exists'
          });
          console.log(`⏭️  SKIPPED: ${index.name}`);
        } else {
          await collection.createIndex(index.fields, {
            name: index.name,
            background: true
          });

          logger.info(`Created index: ${index.name} on ${index.collection}`);
          results.success.push({
            name: index.name,
            collection: index.collection,
            fields: index.fields
          });
          console.log(`✅ CREATED: ${index.name}`);
        }
      } catch (error) {
        logger.error(`Failed to create index ${index.name}:`, error);
        results.failed.push({
          name: index.name,
          collection: index.collection,
          error: error.message
        });
        console.log(`❌ FAILED: ${index.name} - ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error in index creation process:', error);
    throw error;
  }
}

/**
 * Verify index creation
 */
async function verifyIndexes() {
  const db = mongoose.connection.db;
  const collections = ['bookings', 'featureusages', 'referrals', 'marketplaces', 'verificationrequests'];
  
  console.log('\n📋 Verifying created indexes...\n');

  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName);
      const indexes = await collection.getIndexes();
      
      console.log(`\n${collectionName} (${Object.keys(indexes).length} indexes):`);
      Object.entries(indexes).forEach(([name, index]) => {
        if (name !== '_id_') {
          console.log(`  - ${name}: ${JSON.stringify(index.key)}`);
        }
      });
    } catch (error) {
      console.log(`⚠️  Could not verify ${collectionName}: ${error.message}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting slow query optimization - Index Creation Script\n');
    
    await connectDB();
    const results = await createCriticalIndexes();
    await verifyIndexes();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INDEX CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${results.success.length}`);
    console.log(`⏭️  Already existed: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log('='.repeat(60) + '\n');

    if (results.failed.length > 0) {
      console.log('Failed indexes:');
      results.failed.forEach(f => {
        console.log(`  - ${f.name}: ${f.error}`);
      });
      console.log();
    }

    logger.info('Index creation process completed', {
      success: results.success.length,
      skipped: results.skipped.length,
      failed: results.failed.length
    });

    console.log('🎉 Index creation process completed!');
    console.log('\n💡 Performance Improvement Tips:');
    console.log('   1. Monitor queries with MongoDB profiler');
    console.log('   2. Check query execution plans regularly');
    console.log('   3. Review SLOW_QUERY_ANALYSIS.md for more optimizations');
    console.log('   4. Implement query refactoring from Phase 2\n');

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error in index creation:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
