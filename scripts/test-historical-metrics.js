/**
 * Test Historical Metrics Collection
 * 
 * Usage:
 * node scripts/test-historical-metrics.js [providerId] [date]
 * 
 * Examples:
 * node scripts/test-historical-metrics.js 507f1f77bcf86cd799439011
 * node scripts/test-historical-metrics.js 507f1f77bcf86cd799439011 2025-12-14
 */

require('dotenv').config();
const mongoose = require('mongoose');
const historicalMetricsService = require('../src/services/historicalMetricsService');
const HistoricalMetrics = require('../src/models/HistoricalMetrics');
const Provider = require('../src/models/Provider');
const logger = require('../src/config/logger');

async function testHistoricalMetrics() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app');
    logger.info('✅ Connected to database');

    // Get arguments
    const providerId = process.argv[2];
    const dateArg = process.argv[3];

    if (!providerId) {
      console.log('Usage: node scripts/test-historical-metrics.js [providerId] [date]');
      console.log('Examples:');
      console.log('  node scripts/test-historical-metrics.js 507f1f77bcf86cd799439011');
      console.log('  node scripts/test-historical-metrics.js 507f1f77bcf86cd799439011 2025-12-14');
      process.exit(1);
    }

    // Parse date
    let date = null;
    if (dateArg) {
      date = new Date(dateArg);
      if (isNaN(date.getTime())) {
        console.error(`❌ Invalid date format: ${dateArg}. Use YYYY-MM-DD`);
        process.exit(1);
      }
    }

    // Validate provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      console.error(`❌ Provider not found: ${providerId}`);
      process.exit(1);
    }

    console.log(`\n📊 Testing Historical Metrics Collection`);
    console.log(`Provider ID: ${providerId}`);
    console.log(`Date: ${date ? date.toISOString().split('T')[0] : 'Yesterday (default)'}\n`);

    // Test 1: Collect daily metrics
    console.log('Test 1: Collecting daily metrics...');
    const startTime = Date.now();
    const metrics = await historicalMetricsService.collectDailyMetrics(providerId, date);
    const duration = Date.now() - startTime;

    if (metrics) {
      console.log('✅ Metrics collected successfully');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Period: ${metrics.period}`);
      console.log(`   Period Start: ${metrics.periodStart.toISOString()}`);
      console.log(`\n   Metrics Summary:`);
      console.log(`   - Rating: ${metrics.metrics.rating.average} (${metrics.metrics.rating.totalReviews} reviews)`);
      console.log(`   - Jobs: ${metrics.metrics.jobs.total} (${metrics.metrics.jobs.completed} completed, ${metrics.metrics.jobs.completionRate.toFixed(1)}% rate)`);
      console.log(`   - Response Time: ${metrics.metrics.responseTime.average.toFixed(1)} min (avg)`);
      console.log(`   - Earnings: ${metrics.metrics.earnings.total.toFixed(2)}`);
      console.log(`   - Customers: ${metrics.metrics.customers.total} (${metrics.metrics.customers.repeat} repeat, ${metrics.metrics.customers.repeatRate.toFixed(1)}% rate)`);
      console.log(`   - Services: ${metrics.metrics.services.active} active`);
    } else {
      console.log('⚠️  Metrics already exist for this period');
    }

    // Test 2: Get latest metrics
    console.log('\nTest 2: Getting latest metrics...');
    const latestMetrics = await HistoricalMetrics.getLatestMetrics(providerId, 'daily');
    if (latestMetrics) {
      console.log('✅ Latest metrics retrieved');
      console.log(`   Date: ${latestMetrics.periodStart.toISOString().split('T')[0]}`);
      console.log(`   Rating: ${latestMetrics.metrics.rating.average}`);
      console.log(`   Jobs: ${latestMetrics.metrics.jobs.total}`);
    } else {
      console.log('⚠️  No metrics found');
    }

    // Test 3: Get previous period metrics
    console.log('\nTest 3: Getting previous period metrics for comparison...');
    if (latestMetrics) {
      const previousMetrics = await HistoricalMetrics.getPreviousPeriodMetrics(
        providerId,
        latestMetrics.periodStart,
        'daily'
      );

      if (previousMetrics) {
        console.log('✅ Previous period metrics found');
        console.log(`   Date: ${previousMetrics.periodStart.toISOString().split('T')[0]}`);
        
        // Calculate trend
        const ratingTrend = HistoricalMetrics.calculateTrend(
          latestMetrics,
          previousMetrics,
          'rating.average'
        );
        
        console.log(`\n   Rating Trend:`);
        console.log(`   - Current: ${ratingTrend.current}`);
        console.log(`   - Previous: ${ratingTrend.previous}`);
        console.log(`   - Change: ${ratingTrend.change > 0 ? '+' : ''}${ratingTrend.change.toFixed(2)}`);
        console.log(`   - Trend: ${ratingTrend.trend} (${ratingTrend.percentageChange > 0 ? '+' : ''}${ratingTrend.percentageChange}%)`);

        const jobsTrend = HistoricalMetrics.calculateTrend(
          latestMetrics,
          previousMetrics,
          'jobs.total'
        );
        
        console.log(`\n   Jobs Trend:`);
        console.log(`   - Current: ${jobsTrend.current}`);
        console.log(`   - Previous: ${jobsTrend.previous}`);
        console.log(`   - Change: ${jobsTrend.change > 0 ? '+' : ''}${jobsTrend.change}`);
        console.log(`   - Trend: ${jobsTrend.trend} (${jobsTrend.percentageChange > 0 ? '+' : ''}${jobsTrend.percentageChange}%)`);
      } else {
        console.log('⚠️  No previous period metrics found (need at least 2 days of data)');
      }
    }

    // Test 4: Get trend data for chart
    console.log('\nTest 4: Getting trend data (last 7 days)...');
    const trendData = await historicalMetricsService.getTrendData(
      providerId,
      'rating.average',
      'daily',
      7
    );

    if (trendData.length > 0) {
      console.log('✅ Trend data retrieved');
      console.log(`   Data points: ${trendData.length}`);
      console.log(`   Date range: ${trendData[0].date.toISOString().split('T')[0]} to ${trendData[trendData.length - 1].date.toISOString().split('T')[0]}`);
      console.log(`   Values:`, trendData.map(d => d.value.toFixed(2)).join(', '));
    } else {
      console.log('⚠️  No trend data available (need at least 1 day of metrics)');
    }

    // Test 5: Collect metrics for all providers
    console.log('\nTest 5: Testing batch collection for all providers...');
    const batchResult = await historicalMetricsService.collectAllProvidersDailyMetrics(date);
    console.log('✅ Batch collection completed');
    console.log(`   Total Providers: ${batchResult.total}`);
    console.log(`   Successful: ${batchResult.success}`);
    console.log(`   Failed: ${batchResult.failed}`);
    if (batchResult.errors.length > 0) {
      console.log(`   Errors:`, batchResult.errors.slice(0, 5));
    }

    console.log('\n✅ All tests completed!');
    console.log('\nNext Steps:');
    console.log('1. Set up scheduled job to run daily at 2 AM');
    console.log('2. Monitor metrics collection in logs');
    console.log('3. Verify dashboard shows correct trends');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Historical metrics test error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run tests
testHistoricalMetrics();

