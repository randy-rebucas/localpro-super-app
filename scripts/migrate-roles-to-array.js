/**
 * Migration Script: Convert single role field to roles array
 * 
 * This script migrates existing users from the single 'role' field
 * to the new 'roles' array field, ensuring backward compatibility.
 * 
 * Run with: node scripts/migrate-roles-to-array.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const migrateRoles = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');
    console.log('Starting role migration...\n');

    // Find all users that don't have roles array or have empty roles array
    const users = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    console.log(`Found ${users.length} users to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Get the role from the legacy field
        const legacyRole = user.role || 'client';
        
        // If user already has roles array with values, skip
        if (user.roles && user.roles.length > 0) {
          console.log(`Skipping user ${user._id}: already has roles [${user.roles.join(', ')}]`);
          skipped++;
          continue;
        }

        // Set roles array from legacy role
        user.roles = [legacyRole];
        
        // Ensure 'client' is always present
        if (!user.roles.includes('client')) {
          user.roles.unshift('client');
        }

        await user.save();
        console.log(`✓ Migrated user ${user._id}: ${legacyRole} -> [${user.roles.join(', ')}]`);
        migrated++;
      } catch (error) {
        console.error(`✗ Error migrating user ${user._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Verify migration
    const usersWithoutRoles = await User.countDocuments({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    if (usersWithoutRoles === 0) {
      console.log('\n✓ All users have been migrated successfully!');
    } else {
      console.log(`\n⚠ Warning: ${usersWithoutRoles} users still need migration`);
    }

    // Show role distribution
    const roleDistribution = await User.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n=== Role Distribution ===');
    roleDistribution.forEach(item => {
      console.log(`${item._id}: ${item.count} users`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run migration
migrateRoles();

