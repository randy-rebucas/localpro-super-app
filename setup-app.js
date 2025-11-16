#!/usr/bin/env node

/**
 * LocalPro Super App Setup Script
 * This script initializes the application with all required data seeds
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import all models
const User = require('./src/models/User');
const AppSettings = require('./src/models/AppSettings');
const UserSettings = require('./src/models/UserSettings');
const UserWallet = require('./src/models/UserWallet');
const WalletTransaction = require('./src/models/WalletTransaction');
const Agency = require('./src/models/Agency');
const { Service, Booking } = require('./src/models/Marketplace');
const { Course, Enrollment, Certification } = require('./src/models/Academy');
const Job = require('./src/models/Job');
const { Product, SubscriptionKit, Order } = require('./src/models/Supplies');
const { RentalItem, Rental } = require('./src/models/Rentals');
const { Loan, SalaryAdvance, Transaction } = require('./src/models/Finance');
const Referral = require('./src/models/Referral');
const TrustVerification = require('./src/models/TrustVerification');
const Communication = require('./src/models/Communication');
const Analytics = require('./src/models/Analytics');
const Ads = require('./src/models/Ads');
const FacilityCare = require('./src/models/FacilityCare');
const LocalProPlus = require('./src/models/LocalProPlus');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class AppSetup {
  constructor() {
    this.setupResults = {
      database: false,
      appSettings: false,
      adminUsers: false,
      seedData: false,
      validation: false
    };
    this.createdData = {
      users: [],
      agencies: [],
      services: [],
      courses: [],
      jobs: [],
      products: [],
      rentalItems: [],
      certifications: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logStep(step, message) {
    this.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
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

  async connectDatabase() {
    this.logStep('DATABASE', 'Connecting to MongoDB...');
    
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      await mongoose.connect(mongoUri);
      this.logSuccess('Database connected successfully');
      this.setupResults.database = true;
      return true;
    } catch (error) {
      this.logError(`Database connection failed: ${error.message}`);
      return false;
    }
  }

  async createAppSettings() {
    this.logStep('SETTINGS', 'Creating default app settings...');
    
    try {
      // Check if settings already exist
      const existingSettings = await AppSettings.findOne();
      if (existingSettings) {
        this.logWarning('App settings already exist, skipping...');
        this.setupResults.appSettings = true;
        return true;
      }

      const defaultSettings = new AppSettings({
        general: {
          appName: 'LocalPro Super App',
          appVersion: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: {
            enabled: false,
            message: 'The app is currently under maintenance. Please try again later.'
          },
          forceUpdate: {
            enabled: false,
            minVersion: '1.0.0',
            message: 'Please update to the latest version to continue using the app.'
          }
        },
        business: {
          companyName: 'LocalPro Super App',
          companyEmail: 'support@localpro.com',
          companyPhone: '+63-XXX-XXX-XXXX',
          companyAddress: {
            street: '123 Business Street',
            city: 'Manila',
            state: 'Metro Manila',
            zipCode: '1000',
            country: 'Philippines'
          },
          businessHours: {
            timezone: 'Asia/Manila',
            schedule: [
              { day: 'monday', startTime: '09:00', endTime: '18:00', isOpen: true },
              { day: 'tuesday', startTime: '09:00', endTime: '18:00', isOpen: true },
              { day: 'wednesday', startTime: '09:00', endTime: '18:00', isOpen: true },
              { day: 'thursday', startTime: '09:00', endTime: '18:00', isOpen: true },
              { day: 'friday', startTime: '09:00', endTime: '18:00', isOpen: true },
              { day: 'saturday', startTime: '10:00', endTime: '16:00', isOpen: true },
              { day: 'sunday', startTime: '10:00', endTime: '16:00', isOpen: false }
            ]
          },
          supportChannels: {
            email: { enabled: true, address: 'support@localpro.com' },
            phone: { enabled: true, number: '+63-XXX-XXX-XXXX' },
            chat: { enabled: true, hours: { start: '09:00', end: '18:00' } }
          }
        },
        features: {
          marketplace: { enabled: true, allowNewProviders: true, requireVerification: true },
          academy: { enabled: true, allowNewCourses: true, requireInstructorVerification: true },
          jobBoard: { enabled: true, allowNewJobs: true, requireCompanyVerification: true },
          referrals: { enabled: true, rewardAmount: 100, maxReferralsPerUser: 50 },
          payments: {
            paypal: { enabled: true },
            paymaya: { enabled: true },
            gcash: { enabled: true },
            bankTransfer: { enabled: true }
          },
          analytics: { enabled: true, trackUserBehavior: true, trackPerformance: true }
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxLoginAttempts: 5,
            lockoutDuration: 15
          },
          sessionSettings: {
            maxSessionDuration: 24,
            allowMultipleSessions: true,
            maxConcurrentSessions: 3
          },
          dataProtection: {
            encryptSensitiveData: true,
            dataRetentionPeriod: 365,
            allowDataExport: true,
            allowDataDeletion: true
          }
        },
        rateLimiting: {
          api: { windowMs: 900000, maxRequests: 100 },
          auth: { windowMs: 900000, maxRequests: 5 },
          upload: { windowMs: 3600000, maxRequests: 10 }
        },
        uploads: {
          maxFileSize: 10485760,
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          maxImagesPerUpload: 10,
          imageCompression: { enabled: true, quality: 80 }
        },
        notifications: {
          email: { enabled: true, provider: 'nodemailer', fromEmail: 'noreply@localpro.com', fromName: 'LocalPro Super App' },
          sms: { enabled: true, provider: 'twilio', fromNumber: '+1234567890' },
          push: { enabled: true, provider: 'firebase' }
        },
        payments: {
          defaultCurrency: 'PHP',
          supportedCurrencies: ['PHP', 'USD', 'EUR', 'GBP'],
          transactionFees: { percentage: 2.9, fixed: 0.30 },
          minimumPayout: 100,
          payoutSchedule: { frequency: 'weekly', dayOfWeek: 1, dayOfMonth: 1 }
        },
        analytics: {
          googleAnalytics: { enabled: false },
          mixpanel: { enabled: false },
          customAnalytics: { enabled: true, retentionPeriod: 365 }
        },
        integrations: {
          googleMaps: { enabled: true, defaultZoom: 13 },
          cloudinary: { enabled: true },
          socialLogin: {
            google: { enabled: false },
            facebook: { enabled: false }
          }
        }
      });

      await defaultSettings.save();
      this.logSuccess('Default app settings created');
      this.setupResults.appSettings = true;
      return true;
    } catch (error) {
      this.logError(`Failed to create app settings: ${error.message}`);
      return false;
    }
  }

  async createAllUsers() {
    this.logStep('USERS', 'Creating all user roles...');
    
    try {
      // Check if users already exist
      const existingUsers = await User.find({});
      if (existingUsers.length > 0) {
        this.logWarning('Users already exist, using existing users...');
        this.createdData.users.push(...existingUsers);
        this.setupResults.allUsers = true;
        return true;
      }

      // Create super admin
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const superAdmin = new User({
        phoneNumber: '+639179157515',
        email: 'admin@localpro.asia',
        firstName: 'Super',
        lastName: 'Admin',
        roles: ['client', 'admin'], // Multi-role support
        isVerified: true,
        profile: {
          bio: 'System Administrator for LocalPro Super App',
          address: {
            street: '123 Admin Street',
            city: 'Manila',
            state: 'Metro Manila',
            zipCode: '1000',
            country: 'Philippines',
            coordinates: { lat: 14.5995, lng: 120.9842 }
          },
          businessName: 'LocalPro Super App',
          businessType: 'enterprise',
          yearsInBusiness: 1,
          serviceAreas: ['Metro Manila', 'Philippines'],
          specialties: ['Platform Management', 'System Administration'],
          availability: {
            schedule: [
              { day: 'monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'friday', startTime: '09:00', endTime: '18:00', isAvailable: true }
            ],
            timezone: 'Asia/Manila',
            emergencyService: true
          }
        }
      });

      // Save user first to trigger post-save hook for related documents
      await superAdmin.save();

      // Set up verification status (all verified for admin)
      await superAdmin.verify('phone');
      await superAdmin.verify('email');
      await superAdmin.verify('identity');
      await superAdmin.verify('business');
      await superAdmin.verify('address');
      await superAdmin.verify('bankAccount');

      // Add badges
      await superAdmin.addBadge('verified_provider', 'System Administrator');
      await superAdmin.addBadge('expert', 'Platform Expert');

      // Update login info and status
      await superAdmin.updateLoginInfo('127.0.0.1', 'LocalPro-Setup-Script');
      await superAdmin.updateStatus('active', null, null);

      // Generate referral code
      await superAdmin.generateReferralCode();

      // Create user settings for admin
      const adminSettings = new UserSettings({
        userId: superAdmin._id,
        ...UserSettings.getDefaultSettings()
      });
      await adminSettings.save();

      // Link settings to user
      superAdmin.settings = adminSettings._id;
      await superAdmin.save();

      this.createdData.users.push(superAdmin);
      this.logSuccess(`Super admin created: ${superAdmin.email}`);

      // Create client user
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const client = new User({
        phoneNumber: '+639171234569',
        email: 'client@localpro.com',
        firstName: 'John',
        lastName: 'Client',
        roles: ['client'],
        isVerified: true,
        profile: {
          bio: 'Regular client looking for quality services',
          address: {
            street: '123 Client Street',
            city: 'Manila',
            state: 'Metro Manila',
            zipCode: '1000',
            country: 'Philippines',
            coordinates: { lat: 14.5995, lng: 120.9842 }
          }
        }
      });

      await client.save();
      
      // Set up verification status
      await client.verify('phone');
      await client.verify('email');
      
      // Update login info and status
      await client.updateLoginInfo('127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');
      await client.updateStatus('active', null, null);
      
      // Add initial wallet balance (if needed, use wallet methods)
      const wallet = await client.ensureWallet();
      if (wallet.balance === 0) {
        await wallet.addCredit({
          category: 'initial_deposit',
          amount: 5000,
          currency: 'PHP',
          description: 'Initial wallet balance'
        });
      }
      const clientSettings = new UserSettings({
        userId: client._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: true, push: true } }
      });
      await clientSettings.save();
      client.settings = clientSettings._id;
      await client.save();
      this.createdData.users.push(client);
      this.logSuccess(`Client created: ${client.email}`);

      // Create provider user
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const provider = new User({
        phoneNumber: '+639171234570',
        email: 'provider@localpro.com',
        firstName: 'Maria',
        lastName: 'Provider',
        roles: ['client', 'provider'],
        isVerified: true,
        profile: {
          bio: 'Professional cleaning service provider with 5 years experience',
          address: {
            street: '456 Provider Avenue',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
            country: 'Philippines',
            coordinates: { lat: 14.6760, lng: 121.0437 }
          },
          businessName: 'Maria\'s Cleaning Services',
          businessType: 'individual',
          yearsInBusiness: 5,
          serviceAreas: ['Quezon City', 'Manila'],
          specialties: ['Residential Cleaning', 'Office Cleaning', 'Deep Cleaning'],
          availability: {
            schedule: [
              { day: 'monday', startTime: '08:00', endTime: '17:00', isAvailable: true },
              { day: 'tuesday', startTime: '08:00', endTime: '17:00', isAvailable: true },
              { day: 'wednesday', startTime: '08:00', endTime: '17:00', isAvailable: true },
              { day: 'thursday', startTime: '08:00', endTime: '17:00', isAvailable: true },
              { day: 'friday', startTime: '08:00', endTime: '17:00', isAvailable: true },
              { day: 'saturday', startTime: '09:00', endTime: '15:00', isAvailable: true }
            ],
            timezone: 'Asia/Manila',
            emergencyService: true
          }
        }
      });

      await provider.save();
      
      // Set up verification status
      await provider.verify('phone');
      await provider.verify('email');
      await provider.verify('identity');
      
      // Add badges
      await provider.addBadge('verified_provider', 'Verified Service Provider');
      await provider.addBadge('top_rated', 'Top Rated Provider');
      
      // Update trust metrics
      const trust = await provider.ensureTrust();
      trust.updateResponseTime(10);
      trust.updateCompletionRate(98, 100);
      trust.updateCancellationRate(2, 100);
      await trust.save();
      
      // Update login info and status
      await provider.updateLoginInfo('127.0.0.1', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0');
      await provider.updateStatus('active', null, null);
      
      // Add initial wallet balance
      const providerWallet = await provider.ensureWallet();
      if (providerWallet.balance === 0) {
        await providerWallet.addCredit({
          category: 'initial_deposit',
          amount: 15000,
          currency: 'PHP',
          description: 'Initial wallet balance'
        });
      }
      const providerSettings = new UserSettings({
        userId: provider._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: true, push: true } }
      });
      await providerSettings.save();
      provider.settings = providerSettings._id;
      await provider.save();
      this.createdData.users.push(provider);
      this.logSuccess(`Provider created: ${provider.email}`);

      // Create supplier user
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const supplier = new User({
        phoneNumber: '+639171234571',
        email: 'supplier@localpro.com',
        firstName: 'Carlos',
        lastName: 'Supplier',
        roles: ['client', 'supplier'],
        isVerified: true,
        profile: {
          bio: 'Wholesale supplier of cleaning supplies and equipment',
          address: {
            street: '789 Supplier Boulevard',
            city: 'Makati',
            state: 'Metro Manila',
            zipCode: '1200',
            country: 'Philippines',
            coordinates: { lat: 14.5547, lng: 121.0244 }
          },
          businessName: 'Carlos Supply Co.',
          businessType: 'enterprise',
          yearsInBusiness: 10,
          serviceAreas: ['Metro Manila', 'Philippines'],
          specialties: ['Cleaning Supplies', 'Equipment', 'Wholesale Distribution']
        }
      });

      await supplier.save();
      
      // Set up verification status
      await supplier.verify('phone');
      await supplier.verify('email');
      await supplier.verify('business');
      
      // Update login info and status
      await supplier.updateLoginInfo('127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await supplier.updateStatus('active', null, null);
      
      // Add initial wallet balance
      const supplierWallet = await supplier.ensureWallet();
      if (supplierWallet.balance === 0) {
        await supplierWallet.addCredit({
          category: 'initial_deposit',
          amount: 50000,
          currency: 'PHP',
          description: 'Initial wallet balance'
        });
      }
      const supplierSettings = new UserSettings({
        userId: supplier._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: false, push: true } }
      });
      await supplierSettings.save();
      supplier.settings = supplierSettings._id;
      await supplier.save();
      this.createdData.users.push(supplier);
      this.logSuccess(`Supplier created: ${supplier.email}`);

      // Create instructor user
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const instructor = new User({
        phoneNumber: '+639171234572',
        email: 'instructor@localpro.com',
        firstName: 'Dr. Sarah',
        lastName: 'Instructor',
        roles: ['client', 'instructor'],
        isVerified: true,
        profile: {
          bio: 'Professional instructor specializing in cleaning techniques and safety protocols',
          address: {
            street: '321 Education Street',
            city: 'Taguig',
            state: 'Metro Manila',
            zipCode: '1630',
            country: 'Philippines',
            coordinates: { lat: 14.5176, lng: 121.0509 }
          },
          businessName: 'Sarah\'s Training Academy',
          businessType: 'small_business',
          yearsInBusiness: 8,
          serviceAreas: ['Metro Manila', 'Philippines'],
          specialties: ['Cleaning Techniques', 'Safety Training', 'Professional Development'],
          availability: {
            schedule: [
              { day: 'monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'friday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'saturday', startTime: '10:00', endTime: '16:00', isAvailable: true }
            ],
            timezone: 'Asia/Manila',
            emergencyService: false
          }
        }
      });

      await instructor.save();
      
      // Set up verification status
      await instructor.verify('phone');
      await instructor.verify('email');
      await instructor.verify('identity');
      
      // Add badges
      await instructor.addBadge('verified_provider', 'Certified Instructor');
      await instructor.addBadge('expert', 'Training Expert');
      
      // Update login info and status
      await instructor.updateLoginInfo('127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      await instructor.updateStatus('active', null, null);
      
      // Add initial wallet balance
      const instructorWallet = await instructor.ensureWallet();
      if (instructorWallet.balance === 0) {
        await instructorWallet.addCredit({
          category: 'initial_deposit',
          amount: 25000,
          currency: 'PHP',
          description: 'Initial wallet balance'
        });
      }
      const instructorSettings = new UserSettings({
        userId: instructor._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: false, push: true } }
      });
      await instructorSettings.save();
      instructor.settings = instructorSettings._id;
      await instructor.save();
      this.createdData.users.push(instructor);
      this.logSuccess(`Instructor created: ${instructor.email}`);

      // Create agency owner user
      // Note: Related documents (Trust, Activity, Management, Wallet, Referral) will be created automatically via post-save hook
      const agencyOwner = new User({
        phoneNumber: '+639171234567',
        email: 'owner@devcom.com',
        firstName: 'John',
        lastName: 'Smith',
        roles: ['client', 'agency_owner'],
        isVerified: true,
        profile: {
          bio: 'Owner of Devcom Digital Marketing Services',
          address: {
            street: '456 Business Avenue',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
            country: 'Philippines',
            coordinates: { lat: 14.6760, lng: 121.0437 }
          },
          businessName: 'Devcom Digital Marketing Services',
          businessType: 'enterprise',
          yearsInBusiness: 5,
          serviceAreas: ['Quezon City', 'Manila'],
          specialties: ['Digital Marketing', 'SEO', 'Social Media Management'],
          availability: {
            schedule: [
              { day: 'monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'friday', startTime: '09:00', endTime: '18:00', isAvailable: true },
              { day: 'saturday', startTime: '10:00', endTime: '16:00', isAvailable: true },
              { day: 'sunday', startTime: '10:00', endTime: '16:00', isAvailable: false }
            ],
            timezone: 'Asia/Manila',
            emergencyService: true
          }
        }
      });

      await agencyOwner.save();
      
      // Set up verification status (all verified for agency owner)
      await agencyOwner.verify('phone');
      await agencyOwner.verify('email');
      await agencyOwner.verify('identity');
      await agencyOwner.verify('business');
      await agencyOwner.verify('address');
      await agencyOwner.verify('bankAccount');
      
      // Add badges
      await agencyOwner.addBadge('verified_provider', 'Verified business owner');
      await agencyOwner.addBadge('expert', 'Digital marketing expert');
      
      // Update trust metrics
      const agencyOwnerTrust = await agencyOwner.ensureTrust();
      agencyOwnerTrust.updateResponseTime(15);
      agencyOwnerTrust.updateCompletionRate(98, 100);
      agencyOwnerTrust.updateCancellationRate(2, 100);
      await agencyOwnerTrust.save();
      
      // Set up referral data
      const referral = await agencyOwner.ensureReferral();
      referral.referralCode = 'DEVCOM001';
      referral.referralStats.totalReferrals = 25;
      referral.referralStats.successfulReferrals = 20;
      referral.referralStats.totalRewardsEarned = 5000;
      referral.referralStats.totalRewardsPaid = 4500;
      referral.referralStats.lastReferralAt = new Date();
      referral.referralStats.referralTier = 'gold';
      referral.referralPreferences.autoShare = true;
      referral.referralPreferences.shareOnSocial = true;
      referral.referralPreferences.emailNotifications = true;
      referral.referralPreferences.smsNotifications = false;
      await referral.save();
      
      // Update login info and status
      await agencyOwner.updateLoginInfo('127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await agencyOwner.updateStatus('active', null, null);
      
      // Add initial wallet balance
      const agencyOwnerWallet = await agencyOwner.ensureWallet();
      if (agencyOwnerWallet.balance === 0) {
        await agencyOwnerWallet.addCredit({
          category: 'initial_deposit',
          amount: 50000,
          currency: 'PHP',
          description: 'Initial wallet balance'
        });
      }
      const agencyOwnerSettings = new UserSettings({
        userId: agencyOwner._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: false, push: true } }
      });
      await agencyOwnerSettings.save();
      agencyOwner.settings = agencyOwnerSettings._id;
      await agencyOwner.save();
      this.createdData.users.push(agencyOwner);
      this.logSuccess(`Agency owner created: ${agencyOwner.email}`);

      // Create agency admin user
      const agencyAdmin = new User({
        phoneNumber: '+639171234573',
        email: 'admin@devcom.com',
        firstName: 'Lisa',
        lastName: 'Admin',
        role: 'agency_admin',
        isVerified: true,
        verification: {
          phoneVerified: true,
          emailVerified: true,
          identityVerified: true,
          verifiedAt: new Date()
        },
        profile: {
          bio: 'Agency administrator managing daily operations',
          address: {
            street: '456 Business Avenue',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
            country: 'Philippines',
            coordinates: { lat: 14.6760, lng: 121.0437 }
          },
          businessName: 'Devcom Digital Marketing Services',
          businessType: 'enterprise',
          yearsInBusiness: 5,
          serviceAreas: ['Quezon City', 'Manila'],
          specialties: ['Administration', 'Operations Management', 'Team Coordination']
        },
        wallet: {
          balance: 20000,
          currency: 'PHP'
        },
        trustScore: 90,
        badges: [
          { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Administrator' }
        ],
        lastLoginAt: new Date(),
        loginCount: 1,
        status: 'active',
        activity: {
          lastActiveAt: new Date(),
          totalSessions: 1,
          deviceInfo: [{
            deviceType: 'desktop',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            lastUsed: new Date()
          }]
        }
      });

      await agencyAdmin.save();
      const agencyAdminSettings = new UserSettings({
        userId: agencyAdmin._id,
        preferences: { theme: 'light', language: 'en', notifications: { email: true, sms: true, push: true } }
      });
      await agencyAdminSettings.save();
      agencyAdmin.settings = agencyAdminSettings._id;
      await agencyAdmin.save();
      this.createdData.users.push(agencyAdmin);
      this.logSuccess(`Agency admin created: ${agencyAdmin.email}`);

      this.setupResults.allUsers = true;
      return true;
    } catch (error) {
      this.logError(`Failed to create all users: ${error.message}`);
      return false;
    }
  }

  async createAgencies() {
    this.logStep('AGENCIES', 'Creating sample agencies...');
    
    try {
      // Get agency owner from created users
      const agencyOwner = this.createdData.users.find(u => u.roles && u.roles.includes('agency_owner'));
      
      if (!agencyOwner) {
        this.logWarning('No agency owner found, skipping agency creation');
        return true;
      }

      const agency = new Agency({
        name: 'Devcom Digital Marketing Services',
        description: 'Professional digital marketing services for businesses. We provide reliable, high-quality digital marketing solutions with trained and verified staff.',
        owner: agencyOwner._id,
        contact: {
          email: 'info@devcom.com',
          phone: '+639171234568',
          website: 'https://devcom.com',
          address: {
            street: '456 Business Avenue',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
            country: 'Philippines',
            coordinates: { lat: 14.6760, lng: 121.0437 }
          }
        },
        business: {
          type: 'corporation',
          registrationNumber: 'REG-2024-001',
          taxId: 'TAX-2024-001',
          licenseNumber: 'LIC-2024-001',
          insurance: {
            provider: 'Philippine Insurance Corp',
            policyNumber: 'POL-2024-001',
            coverageAmount: 1000000,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        },
        serviceAreas: [
          {
            name: 'Quezon City',
            radius: 25,
            zipCodes: ['1100', '1101', '1102', '1103', '1104']
          },
          {
            name: 'Manila',
            radius: 20,
            zipCodes: ['1000', '1001', '1002', '1003', '1004']
          }
        ],
        services: [
          {
            category: 'cleaning',
            subcategories: ['residential_cleaning', 'office_cleaning', 'deep_cleaning'],
            pricing: { baseRate: 500, currency: 'PHP' }
          }
        ],
        subscription: {
          plan: 'professional',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          features: ['unlimited_providers', 'analytics', 'priority_support']
        },
        verification: {
          isVerified: true,
          verifiedAt: new Date(),
          documents: [
            {
              type: 'business_license',
              url: 'https://example.com/business-license.pdf',
              publicId: 'business-license-001',
              filename: 'business-license.pdf'
            }
          ]
        },
        analytics: {
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalReviews: 0
        },
        settings: {
          autoApproveProviders: false,
          requireProviderVerification: true,
          defaultCommissionRate: 15,
          notificationPreferences: {
            email: {
              newBookings: true,
              providerUpdates: true,
              paymentUpdates: true
            },
            sms: {
              newBookings: false,
              urgentUpdates: true
            }
          }
        }
      });

      await agency.save();
      this.createdData.agencies.push(agency);
      this.logSuccess(`Agency created: ${agency.name}`);

      return true;
    } catch (error) {
      this.logError(`Failed to create agencies: ${error.message}`);
      return false;
    }
  }

  async createSeedData() {
    this.logStep('SEED DATA', 'Creating sample data for all modules...');
    
    try {
      const admin = this.createdData.users.find(u => u.roles && u.roles.includes('admin'));
      const agencyOwner = this.createdData.users.find(u => u.roles && u.roles.includes('agency_owner'));
      const agency = this.createdData.agencies[0];

      console.log('Debug - createdData.users:', this.createdData.users.map(u => ({ roles: u.roles, email: u.email })));
      console.log('Debug - admin:', admin ? 'found' : 'not found');
      console.log('Debug - agencyOwner:', agencyOwner ? 'found' : 'not found');
      console.log('Debug - agency:', agency ? 'found' : 'not found');

      // Check if required users exist
      if (!admin) {
        this.logWarning('Admin user not found, skipping seed data creation');
        return true;
      }
      
      if (!agencyOwner) {
        this.logWarning('Agency owner user not found, skipping seed data creation');
        return true;
      }

      // Create sample services
      const services = [
        {
          title: 'Residential Deep Cleaning',
          description: 'Comprehensive deep cleaning service for homes including all rooms, appliances, and hard-to-reach areas.',
          category: 'cleaning',
          subcategory: 'deep_cleaning',
          provider: agencyOwner._id,
          pricing: { type: 'fixed', basePrice: 2500, currency: 'PHP' },
          serviceArea: ['1100', '1101', '1102', '1000', '1001'],
          features: ['All rooms cleaning', 'Appliance cleaning', 'Window cleaning', 'Floor polishing'],
          requirements: ['Access to all areas', 'Water supply', 'Electrical outlets'],
          serviceType: 'one_time',
          estimatedDuration: { min: 4, max: 8 },
          teamSize: 2,
          equipmentProvided: true,
          materialsIncluded: true,
          warranty: { hasWarranty: true, duration: 7, description: '7-day satisfaction guarantee' },
          insurance: { covered: true, coverageAmount: 100000 },
          emergencyService: { available: true, surcharge: 500, responseTime: 'within 2 hours' }
        },
        {
          title: 'Office Cleaning Service',
          description: 'Regular office cleaning service to maintain a clean and professional work environment.',
          category: 'cleaning',
          subcategory: 'office_cleaning',
          provider: agencyOwner._id,
          pricing: { type: 'hourly', basePrice: 300, currency: 'PHP' },
          serviceArea: ['1100', '1101', '1102', '1000', '1001'],
          features: ['Desk cleaning', 'Floor mopping', 'Trash removal', 'Restroom cleaning'],
          requirements: ['Office access', 'Cleaning supplies storage'],
          serviceType: 'recurring',
          estimatedDuration: { min: 2, max: 4 },
          teamSize: 1,
          equipmentProvided: true,
          materialsIncluded: true,
          warranty: { hasWarranty: true, duration: 1, description: '1-day re-clean guarantee' },
          insurance: { covered: true, coverageAmount: 50000 },
          emergencyService: { available: false }
        }
      ];

      for (const serviceData of services) {
        const service = new Service(serviceData);
        await service.save();
        this.createdData.services.push(service);
      }
      this.logSuccess(`${services.length} sample services created`);

      // Create sample courses
      const courses = [
        {
          title: 'Professional Cleaning Techniques',
          description: 'Learn professional cleaning methods, safety protocols, and customer service skills for the cleaning industry.',
          category: 'cleaning',
          instructor: admin._id,
          partner: {
            name: 'TES (Technical Education Services)',
            logo: 'https://example.com/tes-logo.png',
            website: 'https://tes.com'
          },
          level: 'beginner',
          duration: { hours: 40, weeks: 4 },
          pricing: { regularPrice: 5000, discountedPrice: 4000, currency: 'PHP' },
          curriculum: [
            {
              module: 'Introduction to Professional Cleaning',
              lessons: [
                { title: 'Cleaning Industry Overview', description: 'Understanding the cleaning industry', duration: 60, type: 'video', isFree: true },
                { title: 'Safety First', description: 'Safety protocols and equipment', duration: 90, type: 'video' },
                { title: 'Cleaning Products and Tools', description: 'Understanding cleaning products and tools', duration: 120, type: 'practical' }
              ]
            },
            {
              module: 'Cleaning Techniques',
              lessons: [
                { title: 'Surface Cleaning Methods', description: 'Different cleaning methods for various surfaces', duration: 90, type: 'video' },
                { title: 'Deep Cleaning Techniques', description: 'Advanced cleaning techniques', duration: 120, type: 'practical' },
                { title: 'Time Management', description: 'Efficient cleaning schedules', duration: 60, type: 'text' }
              ]
            }
          ],
          prerequisites: ['Basic literacy', 'Physical fitness for cleaning work'],
          learningOutcomes: [
            'Master professional cleaning techniques',
            'Understand safety protocols',
            'Learn customer service skills',
            'Develop time management skills'
          ],
          certification: {
            isAvailable: true,
            name: 'Professional Cleaning Certificate',
            issuer: 'TES',
            validity: 24,
            requirements: ['Complete all modules', 'Pass final exam', 'Complete practical assessment']
          },
          enrollment: { current: 0, maxCapacity: 50, isOpen: true },
          schedule: {
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 5 weeks from now
            sessions: [
              { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '17:00', type: 'live' },
              { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '17:00', type: 'live' },
              { date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '17:00', type: 'live' },
              { date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '17:00', type: 'practical' }
            ]
          },
          tags: ['cleaning', 'professional', 'certification', 'beginner']
        }
      ];

      for (const courseData of courses) {
        const course = new Course(courseData);
        await course.save();
        this.createdData.courses.push(course);
      }
      this.logSuccess(`${courses.length} sample courses created`);

      // Create sample jobs
      const jobs = [
        {
          title: 'Cleaning Service Manager',
          description: 'We are looking for an experienced Cleaning Service Manager to oversee our cleaning operations and manage a team of cleaning professionals.',
          company: {
            name: 'CleanPro Services',
            logo: { url: 'https://example.com/cleanpro-logo.png', publicId: 'cleanpro-logo' },
            website: 'https://cleanpro.com',
            size: 'small',
            industry: 'Cleaning Services',
            location: {
              address: '456 Business Avenue, Quezon City',
              city: 'Quezon City',
              state: 'Metro Manila',
              country: 'Philippines',
              coordinates: { lat: 14.6760, lng: 121.0437 },
              isRemote: false,
              remoteType: 'on_site'
            }
          },
          employer: agencyOwner._id,
          category: 'operations',
          subcategory: 'cleaning_management',
          jobType: 'full_time',
          experienceLevel: 'mid',
          salary: {
            min: 25000,
            max: 35000,
            currency: 'PHP',
            period: 'monthly',
            isNegotiable: true,
            isConfidential: false
          },
          benefits: ['health_insurance', 'paid_time_off', 'professional_development', 'bonus'],
          requirements: {
            skills: ['Team Management', 'Cleaning Operations', 'Customer Service', 'Quality Control'],
            education: { level: 'bachelor', field: 'Business Administration', isRequired: true },
            experience: { years: 3, description: 'Minimum 3 years in cleaning services or related field' },
            certifications: ['Cleaning Management Certificate'],
            languages: [{ language: 'English', proficiency: 'advanced' }, { language: 'Filipino', proficiency: 'native' }],
            other: ['Valid driver\'s license', 'Background check clearance']
          },
          responsibilities: [
            'Manage and supervise cleaning staff',
            'Ensure quality standards are met',
            'Handle customer complaints and feedback',
            'Schedule and coordinate cleaning services',
            'Maintain inventory of cleaning supplies',
            'Train new cleaning staff'
          ],
          qualifications: [
            'Bachelor\'s degree in Business Administration or related field',
            'Minimum 3 years experience in cleaning services',
            'Strong leadership and communication skills',
            'Knowledge of cleaning techniques and equipment',
            'Customer service orientation'
          ],
          applicationProcess: {
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
            applicationMethod: 'platform',
            contactEmail: 'hr@cleanpro.com',
            instructions: 'Please submit your resume and cover letter through our platform. Include your relevant experience in cleaning services management.'
          },
          status: 'active',
          visibility: 'public',
          tags: ['management', 'cleaning', 'full-time', 'quezon-city']
        }
      ];

      for (const jobData of jobs) {
        const job = new Job(jobData);
        await job.save();
        this.createdData.jobs.push(job);
      }
      this.logSuccess(`${jobs.length} sample jobs created`);

      // Create sample products
      const products = [
        {
          name: 'Professional All-Purpose Cleaner',
          description: 'Heavy-duty all-purpose cleaner suitable for all surfaces. Professional grade formula that removes tough stains and grime.',
          category: 'cleaning_supplies',
          subcategory: 'cleaners',
          brand: 'CleanPro',
          sku: 'CP-APC-001',
          pricing: { retailPrice: 250, wholesalePrice: 200, currency: 'PHP' },
          inventory: { quantity: 100, minStock: 20, maxStock: 200, location: 'Warehouse A' },
          specifications: {
            weight: '1 Liter',
            dimensions: '25cm x 8cm x 8cm',
            material: 'Plastic bottle with spray nozzle',
            color: 'Blue',
            warranty: '1 year'
          },
          tags: ['all-purpose', 'professional', 'concentrated'],
          isSubscriptionEligible: true,
          supplier: agencyOwner._id
        },
        {
          name: 'Microfiber Cleaning Cloths (Pack of 12)',
          description: 'High-quality microfiber cleaning cloths that effectively trap dirt and bacteria. Reusable and machine washable.',
          category: 'cleaning_supplies',
          subcategory: 'cloths',
          brand: 'CleanPro',
          sku: 'CP-MFC-012',
          pricing: { retailPrice: 180, wholesalePrice: 150, currency: 'PHP' },
          inventory: { quantity: 50, minStock: 10, maxStock: 100, location: 'Warehouse A' },
          specifications: {
            weight: '200g',
            dimensions: '30cm x 30cm each',
            material: 'Microfiber',
            color: 'Assorted colors',
            warranty: '6 months'
          },
          tags: ['microfiber', 'reusable', 'washable'],
          isSubscriptionEligible: true,
          supplier: agencyOwner._id
        }
      ];

      for (const productData of products) {
        // Check if product already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          this.logWarning(`Product with SKU ${productData.sku} already exists, skipping...`);
          this.createdData.products.push(existingProduct);
          continue;
        }
        
        const product = new Product(productData);
        await product.save();
        this.createdData.products.push(product);
      }
      this.logSuccess(`${products.length} sample products created`);

      // Create sample rental items
      const rentalItems = [
        {
          name: 'Professional Vacuum Cleaner',
          description: 'Heavy-duty commercial vacuum cleaner perfect for deep cleaning carpets and upholstery. Professional grade with HEPA filtration.',
          category: 'equipment',
          subcategory: 'vacuum_cleaners',
          owner: agencyOwner._id,
          pricing: { hourly: 100, daily: 800, weekly: 5000, monthly: 15000, currency: 'PHP' },
          availability: { isAvailable: true, schedule: [] },
          location: {
            address: {
              street: '456 Business Avenue',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
              country: 'Philippines'
            },
            pickupRequired: true,
            deliveryAvailable: true,
            deliveryFee: 200
          },
          specifications: {
            brand: 'CleanPro',
            model: 'CP-VAC-2000',
            year: 2024,
            condition: 'excellent',
            features: ['HEPA Filtration', 'Adjustable Suction', 'Long Cord', 'Washable Filters'],
            dimensions: { length: 50, width: 30, height: 25, unit: 'cm' },
            weight: { value: 8, unit: 'kg' }
          },
          requirements: {
            minAge: 18,
            licenseRequired: false,
            deposit: 2000,
            insuranceRequired: false
          },
          maintenance: {
            lastService: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            nextService: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            serviceHistory: [
              {
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                type: 'Regular Maintenance',
                description: 'Filter replacement and general cleaning',
                cost: 500
              }
            ]
          }
        }
      ];

      for (const rentalItemData of rentalItems) {
        // Check if rental item already exists
        const existingRentalItem = await RentalItem.findOne({ name: rentalItemData.name });
        if (existingRentalItem) {
          this.logWarning(`Rental item "${rentalItemData.name}" already exists, skipping...`);
          this.createdData.rentalItems.push(existingRentalItem);
          continue;
        }
        
        // Create rental item without maintenance field first
        const rentalItemDataCopy = { ...rentalItemData };
        const maintenanceData = rentalItemDataCopy.maintenance;
        
        // Remove maintenance field completely
        delete rentalItemDataCopy.maintenance;
        
        const rentalItem = new RentalItem(rentalItemDataCopy);
        await rentalItem.save();
        
        // Add maintenance data after saving
        if (maintenanceData) {
          rentalItem.maintenance = maintenanceData;
          await rentalItem.save();
        }
        this.createdData.rentalItems.push(rentalItem);
      }
      this.logSuccess(`${rentalItems.length} sample rental items created`);

      // Create sample certifications
      const certifications = [
        {
          name: 'Professional Cleaning Certificate',
          description: 'Certification for professional cleaning services covering safety, techniques, and customer service.',
          issuer: 'TES (Technical Education Services)',
          category: 'cleaning',
          requirements: [
            { type: 'course_completion', description: 'Complete Professional Cleaning Techniques course', value: '100%' },
            { type: 'exam', description: 'Pass written examination', value: '80%' },
            { type: 'practical', description: 'Complete practical assessment', value: 'Pass' },
            { type: 'experience', description: 'Minimum work experience', value: '6 months' }
          ],
          validity: { duration: 24, renewable: true },
          exam: {
            isRequired: true,
            duration: 120,
            passingScore: 80,
            questions: [
              {
                question: 'What is the proper way to handle cleaning chemicals?',
                options: ['Wear protective equipment', 'Mix different chemicals', 'Use without ventilation', 'Store in food containers'],
                correctAnswer: 0,
                explanation: 'Always wear protective equipment when handling cleaning chemicals to ensure safety.'
              },
              {
                question: 'Which cleaning method is most effective for removing bacteria?',
                options: ['Dry dusting', 'Wet cleaning with disinfectant', 'Air freshener', 'Vacuum only'],
                correctAnswer: 1,
                explanation: 'Wet cleaning with disinfectant is most effective for removing bacteria and ensuring hygiene.'
              }
            ]
          }
        }
      ];

      for (const certificationData of certifications) {
        const certification = new Certification(certificationData);
        await certification.save();
        this.createdData.certifications.push(certification);
      }
      this.logSuccess(`${certifications.length} sample certifications created`);

      this.setupResults.seedData = true;
      return true;
    } catch (error) {
      this.logError(`Failed to create seed data: ${error.message}`);
      return false;
    }
  }

  async validateSetup() {
    this.logStep('VALIDATION', 'Validating setup...');
    
    try {
      const validationResults = {
        database: false,
        appSettings: false,
        adminUsers: false,
        seedData: false,
        totalRecords: 0
      };

      // Check database connection
      if (mongoose.connection.readyState === 1) {
        validationResults.database = true;
        this.logSuccess('Database connection is active');
      } else {
        this.logError('Database connection is not active');
      }

      // Check app settings
      const appSettings = await AppSettings.findOne();
      if (appSettings) {
        validationResults.appSettings = true;
        this.logSuccess('App settings are configured');
      } else {
        this.logError('App settings not found');
      }

      // Check all user roles
      const allUsers = await User.find({});
      const userRoles = {};
      allUsers.forEach(user => {
        userRoles[user.role] = (userRoles[user.role] || 0) + 1;
      });
      
      const requiredRoles = ['admin', 'client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin'];
      let allRolesPresent = true;
      
      requiredRoles.forEach(role => {
        if (userRoles[role] && userRoles[role] > 0) {
          this.logSuccess(`${userRoles[role]} ${role} user(s) found`);
      } else {
          this.logError(`No ${role} users found`);
          allRolesPresent = false;
        }
      });
      
      if (allRolesPresent) {
        validationResults.allUsers = true;
        this.logSuccess('All required user roles are present');
      } else {
        this.logError('Some required user roles are missing');
      }

      // Check seed data
      const totalServices = await Service.countDocuments();
      const totalCourses = await Course.countDocuments();
      const totalJobs = await Job.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalRentalItems = await RentalItem.countDocuments();
      const totalCertifications = await Certification.countDocuments();

      validationResults.totalRecords = totalServices + totalCourses + totalJobs + totalProducts + totalRentalItems + totalCertifications;

      if (validationResults.totalRecords > 0) {
        validationResults.seedData = true;
        this.logSuccess(`Seed data created: ${validationResults.totalRecords} records`);
        this.log(`   - Services: ${totalServices}`, 'cyan');
        this.log(`   - Courses: ${totalCourses}`, 'cyan');
        this.log(`   - Jobs: ${totalJobs}`, 'cyan');
        this.log(`   - Products: ${totalProducts}`, 'cyan');
        this.log(`   - Rental Items: ${totalRentalItems}`, 'cyan');
        this.log(`   - Certifications: ${totalCertifications}`, 'cyan');
      } else {
        this.logError('No seed data found');
      }

      this.setupResults.validation = true;
      return validationResults;
    } catch (error) {
      this.logError(`Validation failed: ${error.message}`);
      return false;
    }
  }

  async generateSetupReport() {
    this.logStep('REPORT', 'Generating setup report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app',
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      setupResults: this.setupResults,
      createdData: {
        users: this.createdData.users.length,
        agencies: this.createdData.agencies.length,
        services: this.createdData.services.length,
        courses: this.createdData.courses.length,
        jobs: this.createdData.jobs.length,
        products: this.createdData.products.length,
        rentalItems: this.createdData.rentalItems.length,
        certifications: this.createdData.certifications.length
      },
      adminCredentials: {
        superAdmin: {
          email: 'admin@localpro.com',
          phone: '+639171234567',
          role: 'admin'
        },
        agencyOwner: {
          email: 'agency@localpro.com',
          phone: '+639171234568',
          role: 'agency_owner'
        }
      },
      nextSteps: [
        'Start the server: npm run dev',
        'Test API endpoints using the Postman collection',
        'Access admin panel with admin credentials',
        'Configure external services (PayPal, PayMaya, etc.)',
        'Set up email and SMS services',
        'Configure Cloudinary for file uploads',
        'Set up Google Maps API for location services'
      ]
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'setup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logSuccess(`Setup report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🚀 LocalPro Super App Setup${colors.reset}`, 'blue');
    this.log(`${colors.blue}================================${colors.reset}`, 'blue');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');
    this.log(`Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app'}`, 'cyan');

    try {
      // Step 1: Connect to database
      const dbConnected = await this.connectDatabase();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Step 2: Create app settings
      const settingsCreated = await this.createAppSettings();
      if (!settingsCreated) {
        throw new Error('Failed to create app settings');
      }

      // Step 3: Create all users
      const usersCreated = await this.createAllUsers();
      if (!usersCreated) {
        throw new Error('Failed to create all users');
      }

      // Step 4: Create agencies
      await this.createAgencies();

      // Step 5: Create seed data
      const seedCreated = await this.createSeedData();
      if (!seedCreated) {
        throw new Error('Failed to create seed data');
      }

      // Step 6: Validate setup
      const validation = await this.validateSetup();
      if (!validation) {
        throw new Error('Setup validation failed');
      }

      // Step 7: Generate report
      const report = await this.generateSetupReport();

      // Final success message
      this.log(`\n${colors.bright}${colors.green}🎉 Setup Completed Successfully!${colors.reset}`, 'green');
      this.log(`${colors.green}================================${colors.reset}`, 'green');
      
      this.log(`\n${colors.bright}User Credentials:${colors.reset}`, 'yellow');
      this.log(`Super Admin: admin@localpro.asia`, 'cyan');
      this.log(`Client: client@localpro.com`, 'cyan');
      this.log(`Provider: provider@localpro.com`, 'cyan');
      this.log(`Supplier: supplier@localpro.com`, 'cyan');
      this.log(`Instructor: instructor@localpro.com`, 'cyan');
      this.log(`Agency Owner: owner@devcom.com`, 'cyan');
      this.log(`Agency Admin: admin@devcom.com`, 'cyan');
      
      this.log(`\n${colors.bright}Created Data:${colors.reset}`, 'yellow');
      this.log(`Users: ${report.createdData.users}`, 'cyan');
      this.log(`Agencies: ${report.createdData.agencies}`, 'cyan');
      this.log(`Services: ${report.createdData.services}`, 'cyan');
      this.log(`Courses: ${report.createdData.courses}`, 'cyan');
      this.log(`Jobs: ${report.createdData.jobs}`, 'cyan');
      this.log(`Products: ${report.createdData.products}`, 'cyan');
      this.log(`Rental Items: ${report.createdData.rentalItems}`, 'cyan');
      this.log(`Certifications: ${report.createdData.certifications}`, 'cyan');
      
      this.log(`\n${colors.bright}Next Steps:${colors.reset}`, 'yellow');
      report.nextSteps.forEach((step, index) => {
        this.log(`${index + 1}. ${step}`, 'cyan');
      });

      this.log(`\n${colors.bright}Setup Report:${colors.reset} setup-report.json`, 'yellow');
      
      return true;
    } catch (error) {
      this.logError(`Setup failed: ${error.message}`);
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

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new AppSetup();
  setup.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup error:', error);
      process.exit(1);
    });
}

module.exports = AppSetup;
