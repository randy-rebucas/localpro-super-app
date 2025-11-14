#!/usr/bin/env node

/**
 * Job Categories and Provider Skills Seeder
 * Seeds the database with default job categories and provider skills
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models to ensure they're registered
require('../src/models/JobCategory');
require('../src/models/ProviderSkill');
require('../src/models/ServiceCategory');

const { seedAll, clearAll } = require('../src/seeders/jobCategoriesAndSkillsSeeder');

const runSeeder = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'clear') {
      await clearAll();
    } else if (command === 'seed') {
      await seedAll();
    } else {
      // Default: clear and seed
      await clearAll();
      await seedAll();
    }

    console.log('✅ Seeder completed successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
runSeeder();

