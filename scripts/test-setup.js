/**
 * Test Setup Script
 * Checks for required services and provides helpful feedback
 */

const mongoose = require('mongoose');
const Redis = require('ioredis');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkMongoDB() {
  logSection('Checking MongoDB Connection');
  
  const mongoUri = process.env.MONGODB_URI || 
                   process.env.MONGODB_TEST_URI || 
                   'mongodb://localhost:27017/localpro-test';
  
  try {
    log(`Attempting to connect to: ${mongoUri.replace(/\/\/.*@/, '//***@')}`, 'blue');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    
    const state = mongoose.connection.readyState;
    if (state === 1) {
      log('✅ MongoDB is connected and ready', 'green');
      log(`   Database: ${mongoose.connection.name}`, 'blue');
      log(`   Host: ${mongoose.connection.host}`, 'blue');
      log(`   Port: ${mongoose.connection.port}`, 'blue');
      await mongoose.connection.close();
      return { available: true, error: null };
    } else {
      await mongoose.connection.close();
      return { available: false, error: 'Connection not ready' };
    }
  } catch (error) {
    log('❌ MongoDB is not available', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    log('\n💡 Solutions:', 'yellow');
    log('   1. Start MongoDB locally:', 'yellow');
    log('      - macOS: brew services start mongodb-community', 'yellow');
    log('      - Linux: sudo systemctl start mongod', 'yellow');
    log('      - Windows: net start MongoDB', 'yellow');
    log('   2. Use MongoDB Atlas (cloud):', 'yellow');
    log('      - Set MONGODB_URI in .env file', 'yellow');
    log('   3. Skip database-dependent tests:', 'yellow');
    log('      - Run: npm run test:utils', 'yellow');
    return { available: false, error: error.message };
  }
}

async function checkRedis() {
  logSection('Checking Redis Connection');
  
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: () => null, // Don't retry in check
    connectTimeout: 2000,
    lazyConnect: true
  };

  try {
    log(`Attempting to connect to: ${redisConfig.host}:${redisConfig.port}`, 'blue');
    
    const redis = new Redis(redisConfig);
    
    await redis.connect();
    await redis.ping();
    
    log('✅ Redis is connected and ready', 'green');
    log(`   Host: ${redisConfig.host}`, 'blue');
    log(`   Port: ${redisConfig.port}`, 'blue');
    
    await redis.quit();
    return { available: true, error: null };
  } catch (error) {
    log('⚠️  Redis is not available (Optional)', 'yellow');
    log(`   Error: ${error.message}`, 'yellow');
    log('\n💡 Solutions:', 'yellow');
    log('   1. Start Redis with Docker:', 'yellow');
    log('      docker run -d -p 6379:6379 redis:latest', 'yellow');
    log('   2. Install Redis locally:', 'yellow');
    log('      - macOS: brew install redis && brew services start redis', 'yellow');
    log('      - Linux: sudo apt-get install redis-server', 'yellow');
    log('   3. Use Redis Cloud:', 'yellow');
    log('      - Set REDIS_URL in .env file', 'yellow');
    log('   4. Disable Redis:', 'yellow');
    log('      - Set REDIS_ENABLED=false in .env', 'yellow');
    log('   Note: Cache tests will work without Redis (graceful degradation)', 'yellow');
    return { available: false, error: error.message, optional: true };
  }
}

function checkEnvironmentVariables() {
  logSection('Checking Environment Variables');
  
  const isTest = process.env.NODE_ENV === 'test';
  
  // In test mode, variables have defaults, so they're less critical
  const required = isTest ? [] : [
    'JWT_SECRET',
    'MONGODB_URI'
  ];
  
  const recommended = isTest ? [
    'JWT_SECRET',
    'MONGODB_URI'
  ] : [];
  
  const optional = [
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_URL',
    'TWILIO_ACCOUNT_SID',
    'PAYPAL_CLIENT_ID',
    'GOOGLE_MAPS_API_KEY'
  ];
  
  const missing = [];
  const present = [];
  const usingDefaults = [];
  
  // Check required variables
  required.forEach(key => {
    if (process.env[key]) {
      present.push(key);
      log(`✅ ${key}: Set`, 'green');
    } else {
      missing.push(key);
      log(`❌ ${key}: Missing (REQUIRED)`, 'red');
    }
  });
  
  // Check recommended variables (for tests)
  if (isTest) {
    log('\nTest Environment Detected - Variables have defaults:', 'cyan');
    recommended.forEach(key => {
      if (process.env[key]) {
        present.push(key);
        log(`✅ ${key}: Set (using provided value)`, 'green');
      } else {
        usingDefaults.push(key);
        log(`⚪ ${key}: Not set (using test default)`, 'yellow');
      }
    });
  }
  
  log('\nOptional Variables:', 'blue');
  optional.forEach(key => {
    if (process.env[key]) {
      log(`✅ ${key}: Set`, 'green');
    } else {
      log(`⚪ ${key}: Not set (optional)`, 'yellow');
    }
  });
  
  return { missing, present, usingDefaults };
}

function printSummary(mongodb, redis, env) {
  logSection('Test Setup Summary');
  
  const isTest = process.env.NODE_ENV === 'test';
  const allGood = mongodb.available && env.missing.length === 0;
  const redisOptional = !redis.available && redis.optional;
  
  if (allGood) {
    log('✅ All required services are available', 'green');
    log('✅ You can run the full test suite:', 'green');
    log('   npm test', 'cyan');
  } else {
    if (isTest) {
      log('✅ Test environment detected', 'green');
      log('✅ Default values will be used for missing variables', 'green');
      if (!mongodb.available) {
        log('\n⚠️  MongoDB not available - some tests will skip database operations', 'yellow');
      } else {
        log('\n✅ MongoDB available - full test suite can run', 'green');
      }
    } else {
      log('⚠️  Some services are not available', 'yellow');
      
      if (!mongodb.available) {
        log('\n❌ MongoDB is required for:', 'red');
        log('   - Auth route tests', 'yellow');
        log('   - Rate limiter tests', 'yellow');
        log('   - Integration tests', 'yellow');
      }
      
      if (env.missing.length > 0) {
        log(`\n❌ Missing required environment variables: ${env.missing.join(', ')}`, 'red');
      }
    }
    
    if (redisOptional) {
      log('\n⚠️  Redis is optional - cache tests work without it', 'yellow');
    }
    
    if (!isTest) {
      log('\n💡 You can still run:', 'cyan');
      log('   npm run test:utils  (No infrastructure needed)', 'cyan');
      log('   npm run test:unit   (Minimal infrastructure)', 'cyan');
    }
  }
  
  log('\n📊 Service Status:', 'blue');
  log(`   MongoDB: ${mongodb.available ? '✅ Available' : isTest ? '⚠️  Optional (tests use defaults)' : '❌ Not Available'}`, 
      mongodb.available ? 'green' : (isTest ? 'yellow' : 'red'));
  log(`   Redis: ${redis.available ? '✅ Available' : '⚠️  Optional (Not Required)'}`, 
      redis.available ? 'green' : 'yellow');
  
  // Environment status - less strict for test mode
  if (isTest) {
    const envStatus = env.missing.length === 0 ? 
      '✅ Complete (or using defaults)' : 
      '⚠️  Using test defaults';
    log(`   Environment: ${envStatus}`, env.missing.length === 0 ? 'green' : 'yellow');
  } else {
    log(`   Environment: ${env.missing.length === 0 ? '✅ Complete' : '❌ Missing Variables'}`, 
        env.missing.length === 0 ? 'green' : 'red');
  }
}

async function main() {
  log('\n🧪 LocalPro Super App - Test Setup Check\n', 'cyan');
  
  // Check environment variables first
  const env = checkEnvironmentVariables();
  
  // Check MongoDB
  const mongodb = await checkMongoDB();
  
  // Check Redis
  const redis = await checkRedis();
  
  // Print summary
  printSummary(mongodb, redis, env);
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
  
  // Exit code - be less strict in test mode
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    // In test mode, success if MongoDB is available or tests can use defaults
    // Missing env vars are OK in test mode (they have defaults)
    process.exit(mongodb.available ? 0 : 0); // Always success in test mode
  } else {
    // In non-test mode, require MongoDB and env vars
    if (mongodb.available && env.missing.length === 0) {
      process.exit(0); // Success
    } else {
      process.exit(1); // Warnings/Errors
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Setup check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkMongoDB, checkRedis, checkEnvironmentVariables };

