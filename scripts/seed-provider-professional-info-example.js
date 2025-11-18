#!/usr/bin/env node

/**
 * Provider Professional Info Example Seeder
 * This script demonstrates how to create ProviderProfessionalInfo with specialties
 * including the new category and reference fields
 * 
 * Usage: node scripts/seed-provider-professional-info-example.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Provider = require('../src/models/Provider');
const ProviderProfessionalInfo = require('../src/models/ProviderProfessionalInfo');
const ServiceCategory = require('../src/models/ServiceCategory');
const ProviderSkill = require('../src/models/ProviderSkill');

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};

/**
 * Example: Create ProviderProfessionalInfo with specialties
 * This demonstrates the proper structure with category and reference fields
 */
async function createExampleProviderProfessionalInfo() {
  try {
    logger.info('Creating example ProviderProfessionalInfo...');

    // 1. Get a provider (assuming one exists)
    const provider = await Provider.findOne({ status: 'active' });
    if (!provider) {
      logger.warn('No active provider found. Please create a provider first.');
      return;
    }

    // 2. Get service categories and skills for reference
    const cleaningCategory = await ServiceCategory.findOne({ key: 'cleaning' });
    const plumbingCategory = await ServiceCategory.findOne({ key: 'plumbing' });
    
    if (!cleaningCategory || !plumbingCategory) {
      logger.warn('Service categories not found. Please run the service categories seeder first.');
      return;
    }

    // Get some skills
    const cleaningSkills = await ProviderSkill.find({ 
      category: cleaningCategory._id,
      isActive: true 
    }).limit(3);
    
    const plumbingSkills = await ProviderSkill.find({ 
      category: plumbingCategory._id,
      isActive: true 
    }).limit(2);

    // 3. Create or get ProviderProfessionalInfo
    let professionalInfo = await ProviderProfessionalInfo.findOne({ provider: provider._id });
    
    if (!professionalInfo) {
      professionalInfo = new ProviderProfessionalInfo({
        provider: provider._id
      });
    }

    // 4. Add specialties with category and reference fields
    professionalInfo.specialties = [
      {
        category: cleaningCategory._id, // ServiceCategory ObjectId
        reference: 'REF-CLEAN-001', // Optional reference string
        experience: 5,
        hourlyRate: 500,
        skills: cleaningSkills.map(skill => skill._id), // Array of ProviderSkill ObjectIds
        certifications: [
          {
            name: 'Professional Cleaning Certificate',
            issuer: 'TES',
            dateIssued: new Date('2020-01-15'),
            expiryDate: new Date('2025-01-15'),
            certificateNumber: 'CERT-2020-001'
          }
        ],
        serviceAreas: [
          {
            city: 'Manila',
            state: 'Metro Manila',
            radius: 25
          },
          {
            city: 'Quezon City',
            state: 'Metro Manila',
            radius: 20
          }
        ]
      },
      {
        category: plumbingCategory._id, // ServiceCategory ObjectId
        reference: 'REF-PLUMB-001', // Optional reference string
        experience: 3,
        hourlyRate: 600,
        skills: plumbingSkills.map(skill => skill._id), // Array of ProviderSkill ObjectIds
        certifications: [
          {
            name: 'Licensed Plumber',
            issuer: 'State Licensing Board',
            dateIssued: new Date('2021-06-01'),
            expiryDate: new Date('2026-06-01'),
            certificateNumber: 'PLB-2021-001'
          }
        ],
        serviceAreas: [
          {
            city: 'Manila',
            state: 'Metro Manila',
            radius: 30
          }
        ]
      }
    ];

    // 5. Set other professional info fields
    professionalInfo.languages = ['English', 'Filipino', 'Tagalog'];
    professionalInfo.emergencyServices = true;
    professionalInfo.travelDistance = 50;
    professionalInfo.minimumJobValue = 1000;
    professionalInfo.maximumJobValue = 50000;
    
    // Set availability
    professionalInfo.availability = {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: null, end: null, available: false }
    };

    // 6. Save the professional info
    await professionalInfo.save();
    
    // 7. Populate and display
    await professionalInfo.populate('specialties.category', 'name key');
    await professionalInfo.populate('specialties.skills', 'name description');
    
    logger.success('ProviderProfessionalInfo created/updated successfully!');
    logger.info(`Provider: ${provider._id}`);
    logger.info(`Specialties: ${professionalInfo.specialties.length}`);
    
    professionalInfo.specialties.forEach((specialty, index) => {
      logger.info(`\nSpecialty ${index + 1}:`);
      logger.info(`  Category: ${specialty.category?.name || 'N/A'} (${specialty.category?.key || 'N/A'})`);
      logger.info(`  Reference: ${specialty.reference || 'N/A'}`);
      logger.info(`  Experience: ${specialty.experience} years`);
      logger.info(`  Hourly Rate: ${specialty.hourlyRate}`);
      logger.info(`  Skills: ${specialty.skills.length} skills`);
      logger.info(`  Service Areas: ${specialty.serviceAreas.length} areas`);
    });

    return professionalInfo;
  } catch (error) {
    logger.error(`Failed to create ProviderProfessionalInfo: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
    await mongoose.connect(mongoUri);
    logger.info('Connected to database');

    // Create example professional info
    await createExampleProviderProfessionalInfo();

    logger.success('Example seeder completed successfully');
  } catch (error) {
    logger.error(`Seeder failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createExampleProviderProfessionalInfo };

