/**
 * Migration Script: Convert serviceArea from old format to new format
 * 
 * Old format: ["10001", "New York", "Brooklyn"]
 * New format: [
 *   {
 *     name: "10001",
 *     zipCodes: ["10001"],
 *     cities: [],
 *     coordinates: { lat: 40.7505, lng: -73.9934 },
 *     radius: 50
 *   },
 *   {
 *     name: "New York",
 *     zipCodes: [],
 *     cities: ["New York"],
 *     coordinates: { lat: 40.7128, lng: -74.0060 },
 *     radius: 50
 *   }
 * ]
 * 
 * Usage: node scripts/migrate-service-area.js [--dry-run] [--geocode]
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { Service } = require('../src/models/Marketplace');
const GoogleMapsService = require('../src/services/googleMapsService');
const { normalizeServiceArea } = require('../src/utils/serviceAreaHelper');

const DRY_RUN = process.argv.includes('--dry-run');
const GEOCODE = process.argv.includes('--geocode');

async function migrateServiceArea() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Geocoding: ${GEOCODE ? 'ENABLED' : 'DISABLED'}`);
    console.log('---');

    // Find all services with old format serviceArea (array of strings)
    const services = await Service.find({
      serviceArea: { $exists: true, $type: 'array' }
    });

    console.log(`Found ${services.length} services to check`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const service of services) {
      try {
        // Check if already in new format
        if (Array.isArray(service.serviceArea) && 
            service.serviceArea.length > 0 && 
            typeof service.serviceArea[0] === 'object' &&
            service.serviceArea[0] !== null &&
            (service.serviceArea[0].name || service.serviceArea[0].zipCodes || service.serviceArea[0].cities)) {
          skipped++;
          continue;
        }

        // Normalize to new format
        const normalized = normalizeServiceArea(service.serviceArea);

        if (normalized.length === 0) {
          console.log(`⚠️  Service ${service._id}: Empty serviceArea, skipping`);
          skipped++;
          continue;
        }

        // Geocode if enabled
        if (GEOCODE) {
          for (let area of normalized) {
            if (area.name && !area.coordinates) {
              try {
                const geocodeResult = await GoogleMapsService.geocodeAddress(area.name);
                if (geocodeResult.success && geocodeResult.coordinates) {
                  area.coordinates = geocodeResult.coordinates;
                  // Set default radius if not provided
                  if (!area.radius) {
                    area.radius = 50; // 50 kilometers
                  }
                  console.log(`  ✓ Geocoded: ${area.name} -> (${area.coordinates.lat}, ${area.coordinates.lng})`);
                }
              } catch (geocodeError) {
                console.log(`  ⚠️  Failed to geocode ${area.name}: ${geocodeError.message}`);
              }
            }
          }
        }

        if (DRY_RUN) {
          console.log(`[DRY RUN] Would migrate service ${service._id}:`);
          console.log(`  Old: ${JSON.stringify(service.serviceArea)}`);
          console.log(`  New: ${JSON.stringify(normalized, null, 2)}`);
        } else {
          // Update service
          service.serviceArea = normalized;
          await service.save();
          console.log(`✓ Migrated service ${service._id} (${service.title})`);
        }

        migrated++;
      } catch (error) {
        console.error(`✗ Error migrating service ${service._id}:`, error.message);
        errors++;
      }
    }

    console.log('---');
    console.log('Migration Summary:');
    console.log(`  Total services checked: ${services.length}`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped (already in new format): ${skipped}`);
    console.log(`  Errors: ${errors}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('Run without --dry-run to apply changes.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateServiceArea();

