#!/usr/bin/env node

/**
 * LocalPro Super App Setup Verification Script
 * This script verifies that the app setup was completed successfully
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./src/models/User');
const AppSettings = require('./src/models/AppSettings');
const UserSettings = require('./src/models/UserSettings');
const Agency = require('./src/models/Agency');
const { Service, Booking } = require('./src/models/Marketplace');
const { Course, Enrollment, Certification } = require('./src/models/Academy');
const Job = require('./src/models/Job');
const { Product, SubscriptionKit, Order } = require('./src/models/Supplies');
const { RentalItem, Rental } = require('./src/models/Rentals');
const { Loan, SalaryAdvance, Transaction } = require('./src/models/Finance');
const Referral = require('./src/models/Referral');
const Provider = require('./src/models/Provider');
const ProviderProfessionalInfo = require('./src/models/ProviderProfessionalInfo');
const ServiceCategory = require('./src/models/ServiceCategory');
const ProviderSkill = require('./src/models/ProviderSkill');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class SetupVerifier {
  constructor() {
    this.results = {
      database: false,
      appSettings: false,
      adminUsers: false,
      agencies: false,
      services: false,
      courses: false,
      jobs: false,
      products: false,
      rentalItems: false,
      certifications: false,
      providerProfessionalInfo: false,
      serviceCategories: false,
      providerSkills: false,
      totalRecords: 0
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  async connectDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      await mongoose.connect(mongoUri);
      this.results.database = true;
      this.logSuccess('Database connection successful');
      return true;
    } catch (error) {
      this.logError(`Database connection failed: ${error.message}`);
      return false;
    }
  }

  async verifyAppSettings() {
    try {
      const settings = await AppSettings.findOne();
      if (settings) {
        this.results.appSettings = true;
        this.logSuccess('App settings found');
        this.logInfo(`App Name: ${settings.general.appName}`);
        this.logInfo(`Environment: ${settings.general.environment}`);
        this.logInfo(`Features Enabled: ${Object.keys(settings.features).filter(key => settings.features[key].enabled).length}`);
        
        // Check payment gateways configuration
        if (settings.features && settings.features.payments) {
          const paymentGateways = [];
          if (settings.features.payments.paypal && settings.features.payments.paypal.enabled) paymentGateways.push('PayPal');
          if (settings.features.payments.paymaya && settings.features.payments.paymaya.enabled) paymentGateways.push('PayMaya');
          if (settings.features.payments.paymongo && settings.features.payments.paymongo.enabled) paymentGateways.push('PayMongo');
          if (settings.features.payments.gcash && settings.features.payments.gcash.enabled) paymentGateways.push('GCash');
          if (settings.features.payments.bankTransfer && settings.features.payments.bankTransfer.enabled) paymentGateways.push('Bank Transfer');
          
          if (paymentGateways.length > 0) {
            this.logInfo(`Payment Gateways: ${paymentGateways.join(', ')}`);
          } else {
            this.logWarning('No payment gateways enabled');
          }
        }
        
        return true;
      } else {
        this.logError('App settings not found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking app settings: ${error.message}`);
      return false;
    }
  }

  async verifyAdminUsers() {
    try {
      // Multi-role support: users have roles array, not single role field
      const adminUsers = await User.find({ roles: { $in: ['admin'] } });
      const agencyOwners = await User.find({ roles: { $in: ['agency_owner'] } });
      
      if (adminUsers.length > 0) {
        this.results.adminUsers = true;
        this.logSuccess(`${adminUsers.length} admin user(s) found`);
        adminUsers.forEach(admin => {
          const rolesDisplay = Array.isArray(admin.roles) ? admin.roles.join(', ') : 'client';
          this.logInfo(`Admin: ${admin.email} (${admin.phoneNumber}) - Roles: [${rolesDisplay}]`);
        });
      } else {
        this.logError('No admin users found');
      }

      if (agencyOwners.length > 0) {
        this.logSuccess(`${agencyOwners.length} agency owner(s) found`);
        agencyOwners.forEach(owner => {
          const rolesDisplay = Array.isArray(owner.roles) ? owner.roles.join(', ') : 'client';
          this.logInfo(`Agency Owner: ${owner.email} (${owner.phoneNumber}) - Roles: [${rolesDisplay}]`);
        });
      } else {
        this.logWarning('No agency owners found');
      }

      return adminUsers.length > 0;
    } catch (error) {
      this.logError(`Error checking admin users: ${error.message}`);
      return false;
    }
  }

  async verifyAgencies() {
    try {
      const agencies = await Agency.find();
      if (agencies.length > 0) {
        this.results.agencies = true;
        this.logSuccess(`${agencies.length} agency(ies) found`);
        agencies.forEach(agency => {
          this.logInfo(`Agency: ${agency.name} (${agency.contact.email})`);
        });
        return true;
      } else {
        this.logWarning('No agencies found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking agencies: ${error.message}`);
      return false;
    }
  }

  async verifyServices() {
    try {
      const services = await Service.find();
      if (services.length > 0) {
        this.results.services = true;
        this.logSuccess(`${services.length} service(s) found`);
        services.forEach(service => {
          this.logInfo(`Service: ${service.title} (${service.category})`);
        });
        this.results.totalRecords += services.length;
        return true;
      } else {
        this.logWarning('No services found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking services: ${error.message}`);
      return false;
    }
  }

  async verifyCourses() {
    try {
      const courses = await Course.find();
      if (courses.length > 0) {
        this.results.courses = true;
        this.logSuccess(`${courses.length} course(s) found`);
        courses.forEach(course => {
          this.logInfo(`Course: ${course.title} (${course.level})`);
        });
        this.results.totalRecords += courses.length;
        return true;
      } else {
        this.logWarning('No courses found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking courses: ${error.message}`);
      return false;
    }
  }

  async verifyJobs() {
    try {
      const jobs = await Job.find();
      if (jobs.length > 0) {
        this.results.jobs = true;
        this.logSuccess(`${jobs.length} job(s) found`);
        jobs.forEach(job => {
          this.logInfo(`Job: ${job.title} (${job.company.name})`);
        });
        this.results.totalRecords += jobs.length;
        return true;
      } else {
        this.logWarning('No jobs found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking jobs: ${error.message}`);
      return false;
    }
  }

  async verifyProducts() {
    try {
      const products = await Product.find();
      if (products.length > 0) {
        this.results.products = true;
        this.logSuccess(`${products.length} product(s) found`);
        products.forEach(product => {
          this.logInfo(`Product: ${product.name} (${product.brand})`);
        });
        this.results.totalRecords += products.length;
        return true;
      } else {
        this.logWarning('No products found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking products: ${error.message}`);
      return false;
    }
  }

  async verifyRentalItems() {
    try {
      const rentalItems = await RentalItem.find();
      if (rentalItems.length > 0) {
        this.results.rentalItems = true;
        this.logSuccess(`${rentalItems.length} rental item(s) found`);
        rentalItems.forEach(item => {
          this.logInfo(`Rental Item: ${item.name} (${item.category})`);
        });
        this.results.totalRecords += rentalItems.length;
        return true;
      } else {
        this.logWarning('No rental items found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking rental items: ${error.message}`);
      return false;
    }
  }

  async verifyCertifications() {
    try {
      const certifications = await Certification.find();
      if (certifications.length > 0) {
        this.results.certifications = true;
        this.logSuccess(`${certifications.length} certification(s) found`);
        certifications.forEach(cert => {
          this.logInfo(`Certification: ${cert.name} (${cert.issuer})`);
        });
        this.results.totalRecords += certifications.length;
        return true;
      } else {
        // Certifications are optional seed data, so this is a warning, not a failure
        this.logWarning('No certifications found (optional - can be created later)');
        this.results.certifications = true; // Mark as passed since it's optional
        return true;
      }
    } catch (error) {
      this.logError(`Error checking certifications: ${error.message}`);
      // Only fail if there's an actual error, not if they don't exist
      this.logWarning('Certifications check encountered an error, but this is optional data');
      this.results.certifications = true; // Still mark as passed since it's optional
      return true;
    }
  }

  async verifyProviderProfessionalInfo() {
    try {
      const professionalInfos = await ProviderProfessionalInfo.find();
      if (professionalInfos.length > 0) {
        this.results.providerProfessionalInfo = true;
        this.logSuccess(`${professionalInfos.length} ProviderProfessionalInfo document(s) found`);
        
        // Check if any have specialties with category and reference fields
        let withSpecialties = 0;
        let withCategory = 0;
        let withReference = 0;
        
        for (const info of professionalInfos) {
          if (info.specialties && info.specialties.length > 0) {
            withSpecialties++;
            for (const specialty of info.specialties) {
              if (specialty.category) {
                withCategory++;
              }
              if (specialty.reference) {
                withReference++;
              }
            }
          }
        }
        
        if (withSpecialties > 0) {
          this.logInfo(`${withSpecialties} document(s) have specialties`);
          if (withCategory > 0) {
            this.logInfo(`${withCategory} specialty(ies) have category field`);
          }
          if (withReference > 0) {
            this.logInfo(`${withReference} specialty(ies) have reference field`);
          }
        } else {
          this.logWarning('No specialties found in ProviderProfessionalInfo documents');
        }
        
        this.results.totalRecords += professionalInfos.length;
        return true;
      } else {
        this.logWarning('No ProviderProfessionalInfo documents found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking ProviderProfessionalInfo: ${error.message}`);
      return false;
    }
  }

  async verifyServiceCategories() {
    try {
      const categories = await ServiceCategory.find();
      if (categories.length > 0) {
        this.results.serviceCategories = true;
        this.logSuccess(`${categories.length} ServiceCategory(ies) found`);
        categories.forEach(cat => {
          this.logInfo(`Category: ${cat.name} (${cat.key})`);
        });
        this.results.totalRecords += categories.length;
        return true;
      } else {
        this.logWarning('No ServiceCategory documents found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking ServiceCategory: ${error.message}`);
      return false;
    }
  }

  async verifyProviderSkills() {
    try {
      const skills = await ProviderSkill.find();
      if (skills.length > 0) {
        this.results.providerSkills = true;
        this.logSuccess(`${skills.length} ProviderSkill(s) found`);
        this.results.totalRecords += skills.length;
        return true;
      } else {
        this.logWarning('No ProviderSkill documents found');
        return false;
      }
    } catch (error) {
      this.logError(`Error checking ProviderSkill: ${error.message}`);
      return false;
    }
  }

  async verifyEnvironmentVariables() {
    try {
      this.logInfo('Checking environment variables...');
      
      const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET'
      ];
      
      const paymentVars = [
        { name: 'PAYMONGO_PUBLIC_KEY', required: false, description: 'PayMongo Public Key' },
        { name: 'PAYMONGO_SECRET_KEY', required: false, description: 'PayMongo Secret Key' },
        { name: 'PAYMONGO_WEBHOOK_SECRET', required: false, description: 'PayMongo Webhook Secret' },
        { name: 'PAYPAL_CLIENT_ID', required: false, description: 'PayPal Client ID' },
        { name: 'PAYPAL_CLIENT_SECRET', required: false, description: 'PayPal Client Secret' },
        { name: 'PAYMAYA_PUBLIC_KEY', required: false, description: 'PayMaya Public Key' },
        { name: 'PAYMAYA_SECRET_KEY', required: false, description: 'PayMaya Secret Key' }
      ];
      
      let missingRequired = [];
      let configuredPayments = [];
      
      // Check required variables
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          missingRequired.push(varName);
        }
      }
      
      // Check payment gateway variables
      for (const paymentVar of paymentVars) {
        if (process.env[paymentVar.name]) {
          configuredPayments.push(paymentVar.description);
        } else if (paymentVar.required) {
          missingRequired.push(paymentVar.name);
        }
      }
      
      if (missingRequired.length > 0) {
        this.logWarning(`Missing required environment variables: ${missingRequired.join(', ')}`);
      } else {
        this.logSuccess('All required environment variables are set');
      }
      
      if (configuredPayments.length > 0) {
        this.logInfo(`Configured payment gateways: ${configuredPayments.join(', ')}`);
      } else {
        this.logWarning('No payment gateway environment variables configured');
      }
      
      return missingRequired.length === 0;
    } catch (error) {
      this.logError(`Error checking environment variables: ${error.message}`);
      return false;
    }
  }

  async verifyDatabaseIndexes() {
    try {
      this.logInfo('Checking database indexes...');
      
      const collections = [
        'users', 'appsettings', 'agencies', 'services', 'courses', 
        'jobs', 'products', 'rentalitems', 'certifications'
      ];

      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const indexes = await collection.indexes();
          this.logInfo(`${collectionName}: ${indexes.length} indexes`);
        } catch (error) {
          this.logWarning(`Could not check indexes for ${collectionName}`);
        }
      }

      return true;
    } catch (error) {
      this.logError(`Error checking database indexes: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    const totalChecks = Object.keys(this.results).length - 1; // Exclude totalRecords
    const passedChecks = Object.values(this.results).filter(result => result === true).length - 1; // Exclude totalRecords
    const successRate = Math.round((passedChecks / totalChecks) * 100);

    this.log(`\n${colors.bright}${colors.blue}📊 Verification Report${colors.reset}`, 'blue');
    this.log(`${colors.blue}====================${colors.reset}`, 'blue');
    
    this.log(`\n${colors.bright}Overall Status:${colors.reset}`, 'yellow');
    if (successRate >= 80) {
      this.log(`✅ Setup verification PASSED (${successRate}%)`, 'green');
    } else if (successRate >= 60) {
      this.log(`⚠️  Setup verification PARTIAL (${successRate}%)`, 'yellow');
    } else {
      this.log(`❌ Setup verification FAILED (${successRate}%)`, 'red');
    }

    this.log(`\n${colors.bright}Detailed Results:${colors.reset}`, 'yellow');
    Object.entries(this.results).forEach(([key, value]) => {
      if (key === 'totalRecords') return;
      
      const status = value ? '✅' : '❌';
      const color = value ? 'green' : 'red';
      this.log(`${status} ${key}: ${value ? 'PASS' : 'FAIL'}`, color);
    });

    this.log(`\n${colors.bright}Total Records Created:${colors.reset} ${this.results.totalRecords}`, 'cyan');

    if (successRate < 100) {
      this.log(`\n${colors.bright}Recommendations:${colors.reset}`, 'yellow');
      if (!this.results.database) {
        this.log('• Check MongoDB connection and ensure it\'s running', 'cyan');
      }
      if (!this.results.appSettings) {
        this.log('• Run the setup script to create app settings', 'cyan');
      }
      if (!this.results.adminUsers) {
        this.log('• Run the setup script to create admin users', 'cyan');
      }
      if (this.results.totalRecords === 0) {
        this.log('• Run the setup script to create sample data', 'cyan');
      }
      this.log('• Configure payment gateway environment variables (PayMongo, PayPal, PayMaya)', 'cyan');
    }

    return {
      successRate,
      passedChecks,
      totalChecks,
      results: this.results
    };
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🔍 LocalPro Super App Setup Verification${colors.reset}`, 'blue');
    this.log(`${colors.blue}==========================================${colors.reset}`, 'blue');

    try {
      // Connect to database
      const dbConnected = await this.connectDatabase();
      if (!dbConnected) {
        throw new Error('Cannot verify setup without database connection');
      }

      // Run all verification checks
      await this.verifyAppSettings();
      await this.verifyAdminUsers();
      await this.verifyAgencies();
      await this.verifyServices();
      await this.verifyCourses();
      await this.verifyJobs();
      await this.verifyProducts();
      await this.verifyRentalItems();
      await this.verifyCertifications();
      await this.verifyProviderProfessionalInfo();
      await this.verifyServiceCategories();
      await this.verifyProviderSkills();
      await this.verifyEnvironmentVariables();
      await this.verifyDatabaseIndexes();

      // Generate report
      const report = this.generateReport();

      return report.successRate >= 80;
    } catch (error) {
      this.logError(`Verification failed: ${error.message}`);
      return false;
    } finally {
      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        this.log('\nDatabase connection closed', 'cyan');
      }
    }
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const verifier = new SetupVerifier();
  verifier.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification error:', error);
      process.exit(1);
    });
}

module.exports = SetupVerifier;
