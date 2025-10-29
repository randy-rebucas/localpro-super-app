#!/usr/bin/env node

/**
 * Database Index Creation Script
 * Creates recommended indexes for better database performance
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models to ensure indexes are registered
require('../src/models/User');
require('../src/models/Job');
require('../src/models/Marketplace');
require('../src/models/Academy');
require('../src/models/Supplies');
require('../src/models/Rentals');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

/**
 * Create indexes for a collection
 */
async function createIndexes(collection, indexes) {
  try {
    logger.info(`Creating indexes for collection: ${collection}`);
    
    for (const index of indexes) {
      try {
        await collection.createIndex(index.key, index.options || {});
        logger.info(`✓ Created index: ${index.name || JSON.stringify(index.key)}`);
      } catch (error) {
        if (error.code === 85) {
          logger.warn(`Index already exists: ${index.name || JSON.stringify(index.key)}`);
        } else {
          logger.error(`Failed to create index: ${index.name || JSON.stringify(index.key)}`, error.message);
        }
      }
    }
  } catch (error) {
    logger.error(`Error creating indexes for ${collection.collectionName}:`, error.message);
  }
}

/**
 * Get recommended indexes for each collection
 */
function getRecommendedIndexes() {
  return {
    users: [
      { key: { role: 1, isActive: 1, status: 1 }, name: 'role_isActive_status' },
      { key: { 'profile.address.city': 1, 'profile.address.state': 1, role: 1 }, name: 'location_role' },
      { key: { 'profile.rating': -1, 'profile.totalReviews': -1, isActive: 1 }, name: 'rating_reviews_active' },
      { key: { 'profile.businessName': 1, role: 1 }, name: 'businessName_role' },
      { key: { 'profile.skills': 1, role: 1, isActive: 1 }, name: 'skills_role_active' },
      { key: { 'profile.specialties': 1, role: 1, isActive: 1 }, name: 'specialties_role_active' },
      { key: { 'profile.serviceAreas': 1, role: 1, isActive: 1 }, name: 'serviceAreas_role_active' },
      { key: { 'profile.certifications.name': 1, role: 1 }, name: 'certifications_role' },
      { key: { 'profile.insurance.hasInsurance': 1, role: 1 }, name: 'insurance_role' },
      { key: { 'profile.backgroundCheck.status': 1, role: 1 }, name: 'backgroundCheck_role' },
      { key: { 'activity.lastActiveAt': -1, isActive: 1 }, name: 'lastActive_active' },
      { key: { createdAt: -1, role: 1 }, name: 'createdAt_role' },
      { key: { updatedAt: -1, isActive: 1 }, name: 'updatedAt_active' },
      { key: { 'profile.experience': -1, role: 1, isActive: 1 }, name: 'experience_role_active' },
      { key: { 'profile.availability.isAvailable': 1, role: 1, isActive: 1 }, name: 'availability_role_active' }
    ],
    jobs: [
      { key: { status: 1, isActive: 1, category: 1 }, name: 'status_active_category' },
      { key: { category: 1, subcategory: 1, jobType: 1 }, name: 'category_subcategory_jobType' },
      { key: { 'company.location.city': 1, 'company.location.state': 1, status: 1 }, name: 'location_status' },
      { key: { jobType: 1, experienceLevel: 1, status: 1 }, name: 'jobType_experience_status' },
      { key: { 'salary.min': 1, 'salary.max': 1, status: 1 }, name: 'salary_status' },
      { key: { 'featured.isFeatured': 1, 'featured.featuredUntil': 1, status: 1 }, name: 'featured_status' },
      { key: { 'promoted.isPromoted': 1, 'promoted.promotedUntil': 1, status: 1 }, name: 'promoted_status' },
      { key: { employer: 1, status: 1, createdAt: -1 }, name: 'employer_status_createdAt' },
      { key: { 'applications.applicant': 1, 'applications.status': 1, 'applications.appliedAt': -1 }, name: 'applications_tracking' },
      { key: { 'company.name': 1, status: 1 }, name: 'companyName_status' },
      { key: { 'company.location.isRemote': 1, status: 1 }, name: 'remote_status' },
      { key: { 'company.location.country': 1, 'company.location.state': 1, status: 1 }, name: 'country_state_status' },
      { key: { 'requirements.skills': 1, status: 1 }, name: 'skills_status' },
      { key: { 'requirements.education.level': 1, status: 1 }, name: 'education_status' },
      { key: { 'requirements.experience.years': 1, status: 1 }, name: 'experienceYears_status' },
      { key: { 'applicationProcess.deadline': 1, status: 1 }, name: 'deadline_status' },
      { key: { 'applicationProcess.startDate': 1, status: 1 }, name: 'startDate_status' },
      { key: { visibility: 1, status: 1, isActive: 1 }, name: 'visibility_status_active' },
      { key: { tags: 1, status: 1, isActive: 1 }, name: 'tags_status_active' },
      { key: { 'analytics.applicationsCount': -1, status: 1 }, name: 'popular_jobs' },
      { key: { 'analytics.viewsCount': -1, status: 1 }, name: 'most_viewed_jobs' },
      { key: { updatedAt: -1, status: 1 }, name: 'updatedAt_status' }
    ],
    services: [
      { key: { category: 1, subcategory: 1, isActive: 1 }, name: 'category_subcategory_active' },
      { key: { provider: 1, isActive: 1, category: 1 }, name: 'provider_active_category' },
      { key: { serviceArea: 1, isActive: 1, category: 1 }, name: 'serviceArea_active_category' },
      { key: { 'rating.average': -1, 'rating.count': -1, isActive: 1 }, name: 'rating_active' },
      { key: { 'pricing.basePrice': 1, category: 1, isActive: 1 }, name: 'price_category_active' },
      { key: { 'pricing.type': 1, category: 1, isActive: 1 }, name: 'pricingType_category_active' },
      { key: { serviceType: 1, category: 1, isActive: 1 }, name: 'serviceType_category_active' },
      { key: { 'estimatedDuration.min': 1, 'estimatedDuration.max': 1, isActive: 1 }, name: 'duration_active' },
      { key: { teamSize: 1, category: 1, isActive: 1 }, name: 'teamSize_category_active' },
      { key: { equipmentProvided: 1, materialsIncluded: 1, isActive: 1 }, name: 'equipment_materials_active' },
      { key: { 'warranty.hasWarranty': 1, category: 1, isActive: 1 }, name: 'warranty_category_active' },
      { key: { 'insurance.covered': 1, category: 1, isActive: 1 }, name: 'insurance_category_active' },
      { key: { 'emergencyService.available': 1, category: 1, isActive: 1 }, name: 'emergency_category_active' },
      { key: { features: 1, isActive: 1 }, name: 'features_active' },
      { key: { requirements: 1, isActive: 1 }, name: 'requirements_active' },
      { key: { createdAt: -1, isActive: 1 }, name: 'createdAt_active' },
      { key: { updatedAt: -1, isActive: 1 }, name: 'updatedAt_active' }
    ],
    bookings: [
      { key: { client: 1, status: 1, bookingDate: 1 }, name: 'client_status_bookingDate' },
      { key: { provider: 1, status: 1, bookingDate: 1 }, name: 'provider_status_bookingDate' },
      { key: { service: 1, status: 1, bookingDate: 1 }, name: 'service_status_bookingDate' },
      { key: { status: 1, bookingDate: 1, createdAt: -1 }, name: 'status_bookingDate_createdAt' },
      { key: { 'payment.status': 1, status: 1 }, name: 'paymentStatus_status' },
      { key: { 'payment.method': 1, status: 1 }, name: 'paymentMethod_status' },
      { key: { 'address.city': 1, 'address.state': 1, status: 1 }, name: 'address_status' },
      { key: { 'review.rating': 1, status: 1 }, name: 'reviewRating_status' },
      { key: { 'review.wouldRecommend': 1, status: 1 }, name: 'recommendation_status' },
      { key: { createdAt: -1, status: 1 }, name: 'createdAt_status' },
      { key: { updatedAt: -1, status: 1 }, name: 'updatedAt_status' }
    ],
    courses: [
      { key: { category: 1, level: 1, isActive: 1 }, name: 'category_level_active' },
      { key: { instructor: 1, isActive: 1, category: 1 }, name: 'instructor_active_category' },
      { key: { 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 }, name: 'enrollment_active' },
      { key: { 'pricing.regularPrice': 1, 'pricing.discountedPrice': 1, isActive: 1 }, name: 'pricing_active' },
      { key: { 'certification.isAvailable': 1, 'certification.issuer': 1, isActive: 1 }, name: 'certification_active' },
      { key: { 'partner.name': 1, isActive: 1 }, name: 'partner_active' },
      { key: { prerequisites: 1, isActive: 1 }, name: 'prerequisites_active' },
      { key: { 'schedule.startDate': 1, 'schedule.endDate': 1, isActive: 1 }, name: 'schedule_active' },
      { key: { tags: 1, isActive: 1 }, name: 'tags_active' }
    ],
    enrollments: [
      { key: { student: 1, status: 1 }, name: 'student_status' },
      { key: { course: 1, status: 1 }, name: 'course_status' },
      { key: { student: 1, course: 1, status: 1 }, name: 'student_course_status' },
      { key: { 'progress.completedModules': 1, status: 1 }, name: 'progress_status' },
      { key: { 'certificate.issuedAt': -1, status: 1 }, name: 'certificate_status' }
    ],
    products: [
      { key: { category: 1, subcategory: 1, isActive: 1 }, name: 'category_subcategory_active' },
      { key: { supplier: 1, isActive: 1, category: 1 }, name: 'supplier_active_category' },
      { key: { 'pricing.retailPrice': 1, 'pricing.wholesalePrice': 1, isActive: 1 }, name: 'pricing_active' },
      { key: { 'inventory.quantity': 1, 'inventory.minStock': 1, isActive: 1 }, name: 'inventory_active' },
      { key: { 'inventory.location': 1, isActive: 1 }, name: 'inventoryLocation_active' },
      { key: { 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 }, name: 'brand_model_active' },
      { key: { 'specifications.material': 1, category: 1, isActive: 1 }, name: 'material_category_active' },
      { key: { 'specifications.color': 1, category: 1, isActive: 1 }, name: 'color_category_active' },
      { key: { isSubscriptionEligible: 1, isActive: 1 }, name: 'subscription_active' },
      { key: { tags: 1, isActive: 1 }, name: 'tags_active' }
    ],
    rentalitems: [
      { key: { category: 1, subcategory: 1, isActive: 1 }, name: 'category_subcategory_active' },
      { key: { owner: 1, isActive: 1, category: 1 }, name: 'owner_active_category' },
      { key: { 'availability.isAvailable': 1, 'availability.schedule.startDate': 1, isActive: 1 }, name: 'availability_active' },
      { key: { 'location.address.city': 1, 'location.address.state': 1, isActive: 1 }, name: 'location_active' },
      { key: { 'location.coordinates.lat': 1, 'location.coordinates.lng': 1, isActive: 1 }, name: 'coordinates_active' },
      { key: { 'pricing.hourly': 1, 'pricing.daily': 1, 'pricing.weekly': 1, 'pricing.monthly': 1 }, name: 'pricing_active' },
      { key: { 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 }, name: 'brand_model_active' },
      { key: { 'specifications.condition': 1, category: 1, isActive: 1 }, name: 'condition_category_active' },
      { key: { 'specifications.features': 1, isActive: 1 }, name: 'features_active' },
      { key: { 'requirements.minAge': 1, 'requirements.licenseRequired': 1, isActive: 1 }, name: 'requirements_active' },
      { key: { 'requirements.deposit': 1, 'requirements.insuranceRequired': 1, isActive: 1 }, name: 'requirements_deposit_active' },
      { key: { tags: 1, isActive: 1 }, name: 'tags_active' }
    ],
    rentals: [
      { key: { client: 1, status: 1, 'rentalPeriod.startDate': 1 }, name: 'client_status_startDate' },
      { key: { item: 1, status: 1, 'rentalPeriod.startDate': 1 }, name: 'item_status_startDate' },
      { key: { 'payment.status': 1, status: 1 }, name: 'paymentStatus_status' },
      { key: { 'payment.method': 1, status: 1 }, name: 'paymentMethod_status' },
      { key: { 'delivery.address.city': 1, 'delivery.address.state': 1, status: 1 }, name: 'deliveryAddress_status' },
      { key: { createdAt: -1, status: 1 }, name: 'createdAt_status' },
      { key: { updatedAt: -1, status: 1 }, name: 'updatedAt_status' }
    ]
  };
}

/**
 * Main function to create all indexes
 */
async function createAllIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    const db = mongoose.connection.db;
    const recommendedIndexes = getRecommendedIndexes();

    // Create indexes for each collection
    for (const [collectionName, indexes] of Object.entries(recommendedIndexes)) {
      try {
        const collection = db.collection(collectionName);
        await createIndexes(collection, indexes);
      } catch (error) {
        logger.error(`Error processing collection ${collectionName}:`, error.message);
      }
    }

    // Create text search indexes
    await createTextSearchIndexes(db);

    logger.info('Database index creation completed successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

/**
 * Create text search indexes
 */
async function createTextSearchIndexes(db) {
  const textIndexes = [
    {
      collection: 'users',
      index: {
        firstName: 'text',
        lastName: 'text',
        'profile.businessName': 'text',
        'profile.skills': 'text',
        'profile.specialties': 'text',
        'profile.bio': 'text'
      }
    },
    {
      collection: 'jobs',
      index: {
        title: 'text',
        description: 'text',
        'company.name': 'text',
        'requirements.skills': 'text',
        tags: 'text'
      }
    },
    {
      collection: 'services',
      index: {
        title: 'text',
        description: 'text',
        features: 'text',
        requirements: 'text'
      }
    },
    {
      collection: 'courses',
      index: {
        title: 'text',
        description: 'text',
        'learningOutcomes': 'text',
        tags: 'text'
      }
    },
    {
      collection: 'products',
      index: {
        name: 'text',
        description: 'text',
        brand: 'text',
        tags: 'text'
      }
    },
    {
      collection: 'rentalitems',
      index: {
        name: 'text',
        description: 'text',
        'specifications.brand': 'text',
        'specifications.model': 'text',
        tags: 'text'
      }
    }
  ];

  for (const { collection, index } of textIndexes) {
    try {
      await db.collection(collection).createIndex(index);
      logger.info(`✓ Created text search index for ${collection}`);
    } catch (error) {
      if (error.code === 85) {
        logger.warn(`Text search index already exists for ${collection}`);
      } else {
        logger.error(`Failed to create text search index for ${collection}:`, error.message);
      }
    }
  }
}

// Run the script
if (require.main === module) {
  createAllIndexes();
}

module.exports = { createAllIndexes, getRecommendedIndexes };
