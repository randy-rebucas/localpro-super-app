/**
 * Manual Historical Metrics Collection Script
 * 
 * Collects historical metrics for all providers or a specific provider
 * 
 * Usage:
 *   node scripts/collect-historical-metrics.js                    # All providers, yesterday
 *   node scripts/collect-historical-metrics.js [providerId]        # Specific provider, yesterday
 *   node scripts/collect-historical-metrics.js [providerId] [date] # Specific provider, specific date
 * 
 * Examples:
 *   node scripts/collect-historical-metrics.js
 *   node scripts/collect-historical-metrics.js 507f1f77bcf86cd799439011
 *   node scripts/collect-historical-metrics.js 507f1f77bcf86cd799439011 2025-12-14
 */

require('dotenv').config();
const mongoose = require('mongoose');
const historicalMetricsService = require('../src/services/historicalMetricsService');
const Provider = require('../src/models/Provider');
const logger = require('../src/config/logger');

async function collectMetrics() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app');
    logger.info('✅ Connected to database');

    const providerId = process.argv[2];
    const dateArg = process.argv[3];

    // Parse date
    let date = null;
    if (dateArg) {
      date = new Date(dateArg);
      if (isNaN(date.getTime())) {
        console.error(`❌ Invalid date format: ${dateArg}. Use YYYY-MM-DD`);
        process.exit(1);
      }
    } else {
      // Default to yesterday
      date = new Date();
      date.setDate(date.getDate() - 1);
    }

    console.log(`\n📊 Historical Metrics Collection`);
    console.log(`Date: ${date.toISOString().split('T')[0]}\n`);

    if (providerId) {
      // Collect for specific provider
      const provider = await Provider.findById(providerId);
      if (!provider) {
        console.error(`❌ Provider not found: ${providerId}`);
        process.exit(1);
      }

      console.log(`Collecting metrics for provider: ${providerId}`);
      const startTime = Date.now();
      
      const metrics = await historicalMetricsService.collectDailyMetrics(providerId, date);
      
      const duration = Date.now() - startTime;
      
      if (metrics) {
        console.log(`✅ Metrics collected successfully in ${duration}ms`);
        console.log(`   Period: ${metrics.period}`);
        console.log(`   Jobs: ${metrics.metrics.jobs.total}`);
        console.log(`   Earnings: ${metrics.metrics.earnings.total}`);
        console.log(`   Rating: ${metrics.metrics.rating.average}`);
      } else {
        console.log(`⚠️  Metrics already exist for this period`);
      }
    } else {
      // Collect for all providers
      console.log('Collecting metrics for all active providers...');
      const startTime = Date.now();
      
      const result = await historicalMetricsService.collectAllProvidersDailyMetrics(date);
      
      const duration = Date.now() - startTime;
      
      console.log(`\n✅ Collection completed in ${duration}ms`);
      console.log(`   Total Providers: ${result.total}`);
      console.log(`   Successful: ${result.success}`);
      console.log(`   Failed: ${result.failed}`);
      
      if (result.failed > 0 && result.errors.length > 0) {
        console.log(`\n   Errors (first 10):`);
        result.errors.slice(0, 10).forEach(err => {
          console.log(`   - Provider ${err.providerId}: ${err.error}`);
        });
      }
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Collection failed:', error);
    logger.error('Historical metrics collection error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run collection
collectMetrics();

