#!/usr/bin/env node

/**
 * Redis Setup Script
 * 
 * This script helps set up Redis for the LocalPro Super App
 * and validates the Redis connection.
 */

const redis = require('redis');
const logger = require('../src/utils/logger');

async function setupRedis() {
  console.log('🔧 Setting up Redis for LocalPro Super App...\n');

  try {
    // Get Redis URL from environment
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`📡 Connecting to Redis: ${redisUrl}`);

    // Create Redis client
    const client = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('❌ Redis server connection refused');
          console.log('💡 Make sure Redis is running on your system');
          console.log('   - Install Redis: https://redis.io/download');
          console.log('   - Start Redis: redis-server');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('❌ Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('❌ Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Connect to Redis
    await client.connect();
    console.log('✅ Redis connected successfully');

    // Test basic operations
    console.log('\n🧪 Testing Redis operations...');
    
    // Test SET/GET
    await client.set('test:key', 'test:value', { EX: 10 });
    const value = await client.get('test:key');
    console.log(`✅ SET/GET test: ${value === 'test:key' ? 'PASSED' : 'FAILED'}`);

    // Test TTL
    const ttl = await client.ttl('test:key');
    console.log(`✅ TTL test: ${ttl > 0 ? 'PASSED' : 'FAILED'} (TTL: ${ttl}s)`);

    // Test DEL
    await client.del('test:key');
    const deletedValue = await client.get('test:key');
    console.log(`✅ DEL test: ${deletedValue === null ? 'PASSED' : 'FAILED'}`);

    // Test Redis info
    const info = await client.info('server');
    console.log('\n📊 Redis Server Info:');
    console.log(`   Version: ${info.match(/redis_version:([^\r\n]+)/)?.[1] || 'Unknown'}`);
    console.log(`   Mode: ${info.match(/redis_mode:([^\r\n]+)/)?.[1] || 'Unknown'}`);
    console.log(`   OS: ${info.match(/os:([^\r\n]+)/)?.[1] || 'Unknown'}`);

    // Test memory info
    const memoryInfo = await client.info('memory');
    const usedMemory = memoryInfo.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'Unknown';
    console.log(`   Memory Used: ${usedMemory}`);

    // Close connection
    await client.quit();
    console.log('\n✅ Redis setup completed successfully!');

    // Provide configuration instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Add Redis URL to your .env file:');
    console.log('   REDIS_URL=redis://localhost:6379');
    console.log('\n2. For production, consider:');
    console.log('   - Using Redis Cluster for high availability');
    console.log('   - Setting up Redis persistence (RDB/AOF)');
    console.log('   - Configuring Redis security (password, ACL)');
    console.log('   - Setting up Redis monitoring');

  } catch (error) {
    console.error('\n❌ Redis setup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure Redis is installed and running');
      console.log('2. Check if Redis is running on the correct port (6379)');
      console.log('3. Verify firewall settings');
      console.log('4. Try starting Redis manually: redis-server');
    }
    
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupRedis();
}

module.exports = setupRedis;
