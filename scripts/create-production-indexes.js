/**
 * Production Database Indexes Creation Script
 * This script creates optimized indexes for production deployment
 *
 * Usage: node scripts/create-production-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const logger = {
  info: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

/**
 * Index definitions with priorities and rationale
 */
const INDEX_DEFINITIONS = {
  // Critical Performance Indexes (Highest Priority)
  critical: [
    // User authentication and lookup
    { collection: 'users', index: { phoneNumber: 1 }, options: { unique: true, background: true } },
    { collection: 'users', index: { email: 1 }, options: { sparse: true, background: true } },
    { collection: 'users', index: { roles: 1 }, options: { background: true } },
    { collection: 'users', index: { isActive: 1 }, options: { background: true } },
    { collection: 'users', index: { 'roles': 1, 'isActive': 1 }, options: { background: true } },

    // Partner system (new feature)
    { collection: 'partners', index: { slug: 1 }, options: { unique: true, background: true } },
    { collection: 'partners', index: { email: 1 }, options: { unique: true, background: true } },
    { collection: 'partners', index: { status: 1 }, options: { background: true } },
    { collection: 'partners', index: { 'onboarding.completed': 1 }, options: { background: true } },
    { collection: 'partners', index: { 'apiCredentials.clientId': 1 }, options: { sparse: true, background: true } },
    { collection: 'partners', index: { 'apiCredentials.apiKey': 1 }, options: { sparse: true, background: true } },

    // Escrow and payments (most critical)
    { collection: 'escrows', index: { bookingId: 1 }, options: { background: true } },
    { collection: 'escrows', index: { clientId: 1 }, options: { background: true } },
    { collection: 'escrows', index: { providerId: 1 }, options: { background: true } },
    { collection: 'escrows', index: { status: 1 }, options: { background: true } },
    { collection: 'escrows', index: { providerHoldId: 1 }, options: { background: true } },
    { collection: 'escrows', index: { 'providerId': 1, 'status': 1 }, options: { background: true } },

    // Escrow transactions (audit trail)
    { collection: 'escrowtransactions', index: { escrowId: 1 }, options: { background: true } },
    { collection: 'escrowtransactions', index: { transactionType: 1 }, options: { background: true } },
    { collection: 'escrowtransactions', index: { status: 1 }, options: { background: true } },
    { collection: 'escrowtransactions', index: { initiatedBy: 1 }, options: { background: true } },
    { collection: 'escrowtransactions', index: { 'escrowId': 1, 'createdAt': -1 }, options: { background: true } },
  ],

  // High Performance Indexes (Frequently Queried)
  high: [
    // Provider search and filtering
    { collection: 'providers', index: { userId: 1 }, options: { unique: true, background: true } },
    { collection: 'providers', index: { status: 1 }, options: { background: true } },
    { collection: 'providers', index: { providerType: 1 }, options: { background: true } },
    { collection: 'providers', index: { 'metadata.featured': 1 }, options: { sparse: true, background: true } },
    { collection: 'providers', index: { 'metadata.promoted': 1 }, options: { sparse: true, background: true } },
    { collection: 'providers', index: { createdAt: -1 }, options: { background: true } },

    // Marketplace and bookings
    { collection: 'marketplaces', index: { title: 'text', description: 'text' }, options: { background: true } },
    { collection: 'marketplaces', index: { category: 1 }, options: { background: true } },
    { collection: 'marketplaces', index: { provider: 1 }, options: { background: true } },
    { collection: 'marketplaces', index: { status: 1 }, options: { background: true } },
    { collection: 'marketplaces', index: { 'pricing.basePrice': 1 }, options: { background: true } },

    // Wallet and finance
    { collection: 'userwallets', index: { user: 1 }, options: { unique: true, background: true } },
    { collection: 'userwallets', index: { status: 1 }, options: { background: true } },
    { collection: 'userwallets', index: { balance: -1 }, options: { background: true } },
    { collection: 'wallettransactions', index: { wallet: 1, createdAt: -1 }, options: { background: true } },
    { collection: 'wallettransactions', index: { type: 1 }, options: { background: true } },

    // Activity and analytics
    { collection: 'useractivities', index: { user: 1 }, options: { unique: true, background: true } },
    { collection: 'useractivities', index: { lastActiveAt: -1 }, options: { background: true } },
    { collection: 'useractivities', index: { 'deviceInfo.lastUsed': -1 }, options: { background: true } },

    // Performance metrics
    { collection: 'providerperformances', index: { provider: 1 }, options: { unique: true, background: true } },
    { collection: 'providerperformances', index: { rating: -1 }, options: { background: true } },
    { collection: 'providerperformances', index: { totalJobs: -1 }, options: { background: true } },
    { collection: 'providerperformances', index: { completionRate: -1 }, options: { background: true } },
  ],

  // Medium Performance Indexes (Moderately Queried)
  medium: [
    // Communication and messaging
    { collection: 'communications', index: { sender: 1, createdAt: -1 }, options: { background: true } },
    { collection: 'communications', index: { receiver: 1, createdAt: -1 }, options: { background: true } },
    { collection: 'communications', index: { conversationId: 1, createdAt: -1 }, options: { background: true } },
    { collection: 'communications', index: { type: 1 }, options: { background: true } },

    // Live chat
    { collection: 'livechats', index: { sessionId: 1, createdAt: -1 }, options: { background: true } },
    { collection: 'livechats', index: { userId: 1 }, options: { background: true } },
    { collection: 'livechats', index: { status: 1 }, options: { background: true } },

    // Announcements and notifications
    { collection: 'announcements', index: { targetRoles: 1 }, options: { background: true } },
    { collection: 'announcements', index: { isActive: 1 }, options: { background: true } },
    { collection: 'announcements', index: { scheduledDate: 1 }, options: { background: true } },

    // Academy and learning
    { collection: 'academies', index: { category: 1 }, options: { background: true } },
    { collection: 'academies', index: { instructor: 1 }, options: { background: true } },
    { collection: 'academies', index: { status: 1 }, options: { background: true } },
    { collection: 'academycategories', index: { name: 1 }, options: { unique: true, background: true } },

    // Trust verification
    { collection: 'trustverifications', index: { userId: 1 }, options: { unique: true, background: true } },
    { collection: 'trustverifications', index: { status: 1 }, options: { background: true } },
    { collection: 'trustverifications', index: { 'documents.verified': 1 }, options: { background: true } },

    // Agencies
    { collection: 'agencies', index: { owner: 1 }, options: { unique: true, background: true } },
    { collection: 'agencies', index: { name: 1 }, options: { background: true } },
    { collection: 'agencies', index: { type: 1 }, options: { background: true } },
    { collection: 'useragencies', index: { userId: 1 }, options: { unique: true, background: true } },
    { collection: 'useragencies', index: { agencyId: 1 }, options: { background: true } },

    // Jobs and employment
    { collection: 'jobs', index: { employer: 1 }, options: { background: true } },
    { collection: 'jobs', index: { status: 1 }, options: { background: true } },
    { collection: 'jobs', index: { category: 1 }, options: { background: true } },
    { collection: 'jobcategories', index: { name: 1 }, options: { background: true } },

    // Referrals
    { collection: 'referrals', index: { referrerId: 1 }, options: { background: true } },
    { collection: 'referrals', index: { refereeId: 1 }, options: { background: true } },
    { collection: 'referrals', index: { status: 1 }, options: { background: true } },
    { collection: 'userreferrals', index: { user: 1 }, options: { unique: true, background: true } },

    // Supplies and rentals
    { collection: 'supplies', index: { category: 1 }, options: { background: true } },
    { collection: 'supplies', index: { provider: 1 }, options: { background: true } },
    { collection: 'supplies', index: { status: 1 }, options: { background: true } },
    { collection: 'rentals', index: { category: 1 }, options: { background: true } },
    { collection: 'rentals', index: { owner: 1 }, options: { background: true } },
    { collection: 'rentals', index: { status: 1 }, options: { background: true } },

    // Ads and promotions
    { collection: 'ads', index: { advertiser: 1 }, options: { background: true } },
    { collection: 'ads', index: { status: 1 }, options: { background: true } },
    { collection: 'ads', index: { category: 1 }, options: { background: true } },
    { collection: 'adcampaigns', index: { advertiser: 1 }, options: { background: true } },
    { collection: 'adcampaigns', index: { status: 1 }, options: { background: true } },

    // Favorites
    { collection: 'favorites', index: { user: 1 }, options: { background: true } },
    { collection: 'favorites', index: { itemType: 1 }, options: { background: true } },
    { collection: 'favorites', index: { 'user': 1, 'itemType': 1, 'itemId': 1 }, options: { unique: true, background: true } },
  ],

  // Low Priority Indexes (Rarely Queried)
  low: [
    // Email and notifications
    { collection: 'emailcampaigns', index: { status: 1 }, options: { background: true } },
    { collection: 'emailcampaigns', index: { scheduledDate: 1 }, options: { background: true } },
    { collection: 'emailsubscribers', index: { email: 1 }, options: { unique: true, background: true } },
    { collection: 'emailsubscribers', index: { status: 1 }, options: { background: true } },
    { collection: 'emailanalytics', index: { campaign: 1 }, options: { background: true } },
    { collection: 'emailanalytics', index: { type: 1 }, options: { background: true } },

    // Logging and audit
    { collection: 'logs', index: { level: 1 }, options: { background: true } },
    { collection: 'logs', index: { timestamp: -1 }, options: { background: true } },
    { collection: 'logs', index: { 'meta.userId': 1 }, options: { sparse: true, background: true } },

    // App settings and configuration
    { collection: 'appsettings', index: { key: 1 }, options: { unique: true, background: true } },
    { collection: 'usertrusts', index: { user: 1 }, options: { unique: true, background: true } },
    { collection: 'usermanagements', index: { user: 1 }, options: { unique: true, background: true } },
    { collection: 'usersettings', index: { user: 1 }, options: { unique: true, background: true } },

    // LocalPro Plus subscriptions
    { collection: 'localproplus', index: { user: 1 }, options: { unique: true, background: true } },
    { collection: 'localproplus', index: { status: 1 }, options: { background: true } },
    { collection: 'localproplus', index: { 'billing.nextBillingDate': 1 }, options: { background: true } },

    // Payouts and finance
    { collection: 'payouts', index: { providerId: 1 }, options: { background: true } },
    { collection: 'payouts', index: { status: 1 }, options: { background: true } },
    { collection: 'payouts', index: { 'gateway.transactionId': 1 }, options: { background: true } },

    // Facility care
    { collection: 'facilitycares', index: { category: 1 }, options: { background: true } },
    { collection: 'facilitycares', index: { provider: 1 }, options: { background: true } },
    { collection: 'facilitycares', index: { status: 1 }, options: { background: true } },

    // Analytics and reporting
    { collection: 'analytics', index: { type: 1 }, options: { background: true } },
    { collection: 'analytics', index: { date: -1 }, options: { background: true } },
    { collection: 'analytics', index: { 'metadata.userId': 1 }, options: { sparse: true, background: true } },

    // Broadcaster and notifications
    { collection: 'broadcasters', index: { type: 1 }, options: { background: true } },
    { collection: 'broadcasters', index: { status: 1 }, options: { background: true } },
    { collection: 'notifications', index: { userId: 1 }, options: { background: true } },
    { collection: 'notifications', index: { type: 1 }, options: { background: true } },
    { collection: 'notifications', index: { read: 1 }, options: { background: true } }
  ]
};

/**
 * Compound indexes for complex queries
 */
const COMPOUND_INDEXES = [
  // User location-based queries
  { collection: 'users', index: { 'profile.address.city': 1, 'profile.address.state': 1, 'roles': 1 }, options: { background: true } },
  { collection: 'users', index: { 'profile.address.coordinates': '2dsphere', 'roles': 1 }, options: { background: true } },

  // Provider search optimization
  { collection: 'providers', index: { status: 1, 'metadata.featured': -1, rating: -1 }, options: { background: true } },
  { collection: 'providers', index: { providerType: 1, status: 1, createdAt: -1 }, options: { background: true } },

  // Marketplace search and filtering
  { collection: 'marketplaces', index: { category: 1, status: 1, 'pricing.basePrice': 1 }, options: { background: true } },
  { collection: 'marketplaces', index: { provider: 1, status: 1, createdAt: -1 }, options: { background: true } },

  // Financial queries
  { collection: 'escrows', index: { status: 1, createdAt: -1, amount: -1 }, options: { background: true } },
  { collection: 'escrowtransactions', index: { status: 1, transactionType: 1, createdAt: -1 }, options: { background: true } },

  // Activity and engagement
  { collection: 'useractivities', index: { lastActiveAt: -1, 'deviceInfo.deviceType': 1 }, options: { background: true } },
  { collection: 'communications', index: { type: 1, createdAt: -1, conversationId: 1 }, options: { background: true } },

  // Time-based analytics
  { collection: 'analytics', index: { type: 1, date: -1, 'metadata.category': 1 }, options: { background: true } },
  { collection: 'emailanalytics', index: { campaign: 1, type: 1, date: -1 }, options: { background: true } }
];

/**
 * Text indexes for search functionality
 */
const TEXT_INDEXES = [
  // User search
  { collection: 'users', index: { firstName: 'text', lastName: 'text', 'profile.bio': 'text' }, options: { background: true } },

  // Provider search
  { collection: 'providers', index: { 'businessInfo.companyName': 'text', 'businessInfo.description': 'text' }, options: { background: true } },

  // Service search
  { collection: 'marketplaces', index: { title: 'text', description: 'text', tags: 'text' }, options: { background: true } },

  // Academy search
  { collection: 'academies', index: { title: 'text', description: 'text', tags: 'text' }, options: { background: true } },

  // Partner search
  { collection: 'partners', index: { name: 'text', 'businessInfo.companyName': 'text', 'businessInfo.description': 'text', 'businessInfo.industry': 'text' }, options: { background: true } }
];

/**
 * Create indexes with error handling and progress tracking
 */
async function createIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    logger.info('Starting production index creation...');

    const stats = {
      created: 0,
      skipped: 0,
      errors: 0,
      total: 0
    };

    // Calculate total indexes
    Object.values(INDEX_DEFINITIONS).forEach(group => {
      stats.total += group.length;
    });
    stats.total += COMPOUND_INDEXES.length + TEXT_INDEXES.length;

    logger.info(`Creating ${stats.total} indexes across ${Object.keys(INDEX_DEFINITIONS).length + 2} categories`);

    // Create indexes by priority
    const priorities = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      if (INDEX_DEFINITIONS[priority]) {
        logger.info(`Creating ${priority} priority indexes...`);

        for (const indexDef of INDEX_DEFINITIONS[priority]) {
          await createIndex(db, indexDef, stats);
        }
      }
    }

    // Create compound indexes
    logger.info('Creating compound indexes...');
    for (const indexDef of COMPOUND_INDEXES) {
      await createIndex(db, indexDef, stats);
    }

    // Create text indexes
    logger.info('Creating text indexes...');
    for (const indexDef of TEXT_INDEXES) {
      await createIndex(db, indexDef, stats);
    }

    logger.info(`Index creation completed!`);
    logger.info(`Created: ${stats.created}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);

    // Generate index report
    await generateIndexReport(db);

  } catch (error) {
    logger.error('Index creation failed:', error);
    process.exit(1);
  }
}

/**
 * Create a single index with error handling
 */
async function createIndex(db, indexDef, stats) {
  try {
    const collection = db.collection(indexDef.collection);

    // Check if index already exists
    const existingIndexes = await collection.listIndexes().toArray();
    const indexKey = Object.keys(indexDef.index)[0];
    const indexExists = existingIndexes.some(idx => {
      return Object.keys(idx.key)[0] === indexKey;
    });

    if (indexExists) {
      logger.info(`Index ${indexDef.collection}.${indexKey} already exists, skipping`);
      stats.skipped++;
      return;
    }

    // Create the index
    await collection.createIndex(indexDef.index, indexDef.options);

    logger.info(`Created index: ${indexDef.collection}.${indexKey}`);
    stats.created++;

  } catch (error) {
    logger.error(`Failed to create index ${indexDef.collection}:`, error.message);
    stats.errors++;
  }
}

/**
 * Generate a report of all indexes in the database
 */
async function generateIndexReport(db) {
  try {
    logger.info('Generating index report...');

    const collections = await db.listCollections().toArray();
    let totalIndexes = 0;

    for (const collection of collections) {
      const indexes = await db.collection(collection.name).listIndexes().toArray();
      totalIndexes += indexes.length;

      if (indexes.length > 1) { // Exclude default _id index
        logger.info(`${collection.name}: ${indexes.length - 1} indexes`);
      }
    }

    logger.info(`Total indexes in database: ${totalIndexes}`);

  } catch (error) {
    logger.warn('Failed to generate index report:', error.message);
  }
}

/**
 * Validate index creation
 */
async function validateIndexes(db) {
  try {
    logger.info('Validating critical indexes...');

    const criticalCollections = [
      'users', 'partners', 'escrows', 'escrowtransactions',
      'providers', 'marketplaces', 'userwallets'
    ];

    for (const collectionName of criticalCollections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();

        if (indexes.length < 2) { // Should have at least _id and one more index
          logger.warn(`Collection ${collectionName} has insufficient indexes: ${indexes.length}`);
        }
      } catch (error) {
        logger.warn(`Could not validate collection ${collectionName}:`, error.message);
      }
    }

  } catch (error) {
    logger.warn('Index validation failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';

    logger.info('Connecting to database...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('Connected to database successfully');

    // Create indexes
    await createIndexes();

    // Validate indexes
    await validateIndexes(mongoose.connection.db);

    logger.info('Production index creation completed successfully!');

  } catch (error) {
    logger.error('Script execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createIndexes, INDEX_DEFINITIONS, COMPOUND_INDEXES, TEXT_INDEXES };
