#!/usr/bin/env node

/**
 * LocalPro Super App Automated Setup Script
 * This script provides a non-interactive setup for admin users and application settings
 * Usage: node setup-auto.js [admin-email] [admin-phone] [admin-password] [company-name]
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
const Agency = require('./src/models/Agency');
const { Service, Booking } = require('./src/models/Marketplace');
const Job = require('./src/models/Job');
const { Course, Enrollment, Certification } = require('./src/models/Academy');
const { Product, SubscriptionKit, Order } = require('./src/models/Supplies');
const { RentalItem, Rental } = require('./src/models/Rentals');
const { SubscriptionPlan, UserSubscription, Payment, FeatureUsage } = require('./src/models/LocalProPlus');
const Referral = require('./src/models/Referral');
const TrustVerification = require('./src/models/TrustVerification');
const Analytics = require('./src/models/Analytics');
const Activity = require('./src/models/Activity');
const Communication = require('./src/models/Communication');
const Finance = require('./src/models/Finance');
const Log = require('./src/models/Log');
const Announcement = require('./src/models/Announcement');
const Ads = require('./src/models/Ads');
const FacilityCare = require('./src/models/FacilityCare');
const Provider = require('./src/models/Provider');

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

class AutoSetup {
  constructor() {
    this.setupResults = {
      database: false,
      appSettings: false,
      adminUsers: false,
      validation: false
    };
    this.createdData = {
      users: [],
      agencies: [],
      services: [],
      jobs: [],
      courses: [],
      products: [],
      rentalItems: [],
      subscriptions: [],
      referrals: []
    };
    
    // Parse command line arguments
    this.args = {
      adminEmail: process.argv[2] || 'admin@localpro.com',
      adminPhone: process.argv[3] || '+639179157515',
      adminPassword: process.argv[4] || 'Admin123!@#',
      companyName: process.argv[5] || 'LocalPro Super App'
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

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
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

  async resetDatabase() {
    this.logStep('DATABASE RESET', 'Resetting database...');
    
    try {
      // Check if database has existing data
      const userCount = await User.countDocuments();
      const settingsCount = await AppSettings.countDocuments();
      const serviceCount = await Service.countDocuments();
      const jobCount = await Job.countDocuments();
      
      if (userCount > 0 || settingsCount > 0 || serviceCount > 0 || jobCount > 0) {
        this.logWarning(`Found existing data: ${userCount} users, ${settingsCount} settings, ${serviceCount} services, ${jobCount} jobs`);
        this.logInfo('Automatically cleaning database for fresh setup...');
        
        // Drop all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
          await mongoose.connection.db.collection(collection.name).drop();
          this.logInfo(`Dropped collection: ${collection.name}`);
        }
        
        this.logSuccess('Database cleaned successfully');
        return true;
      } else {
        this.logInfo('Database is already clean');
        return true;
      }
    } catch (error) {
      this.logError(`Database reset failed: ${error.message}`);
      return false;
    }
  }

  async createAppSettings() {
    this.logStep('SETTINGS', 'Creating application settings...');
    
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
          appName: this.args.companyName,
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
          companyName: this.args.companyName,
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
          email: { enabled: true, provider: 'nodemailer', fromEmail: 'noreply@localpro.com', fromName: this.args.companyName },
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
      this.logSuccess('Application settings created successfully');
      this.setupResults.appSettings = true;
      return true;
    } catch (error) {
      this.logError(`Failed to create app settings: ${error.message}`);
      return false;
    }
  }

  async createAdminUsers() {
    this.logStep('ADMIN USERS', 'Creating admin users...');
    
    try {
      // Check if admin users already exist
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        this.logWarning('Admin users already exist, skipping...');
        this.setupResults.adminUsers = true;
        return true;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(this.args.adminPassword, saltRounds);

      // Create super admin
      const superAdmin = new User({
        phoneNumber: this.args.adminPhone,
        email: this.args.adminEmail,
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        verification: {
          phoneVerified: true,
          emailVerified: true,
          identityVerified: true,
          businessVerified: true,
          addressVerified: true,
          bankAccountVerified: true,
          verifiedAt: new Date()
        },
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
          businessName: this.args.companyName,
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
        },
        preferences: {
          notifications: {
            sms: true,
            email: true,
            push: true
          },
          language: 'en'
        },
        trustScore: 100,
        badges: [
          { type: 'verified_provider', earnedAt: new Date(), description: 'System Administrator' },
          { type: 'expert', earnedAt: new Date(), description: 'Platform Expert' }
        ],
        responseTime: {
          average: 5,
          totalResponses: 100
        },
        completionRate: 100,
        cancellationRate: 0,
        referral: {
          referralCode: '',
          referredBy: null,
          referralSource: 'direct_link',
          referralStats: {
            totalReferrals: 0,
            successfulReferrals: 0,
            totalRewardsEarned: 0,
            totalRewardsPaid: 0,
            lastReferralAt: null,
            referralTier: 'bronze'
          },
          referralPreferences: {
            autoShare: true,
            shareOnSocial: false,
            emailNotifications: true,
            smsNotifications: false
          }
        },
        wallet: {
          balance: 0,
          currency: 'PHP'
        },
        isActive: true,
        status: 'active',
        lastLoginAt: new Date(),
        lastLoginIP: '127.0.0.1',
        loginCount: 1,
        activity: {
          lastActiveAt: new Date(),
          totalSessions: 1,
          averageSessionDuration: 30,
          preferredLoginTime: '09:00',
          deviceInfo: [{
            deviceType: 'desktop',
            userAgent: 'LocalPro-Setup-Script',
            lastUsed: new Date()
          }]
        }
      });

      // Generate referral code for admin
      superAdmin.generateReferralCode();
      await superAdmin.save();

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

      // Create users for all roles
      await this.createRoleUsers();

      // Create sample data for other collections
      await this.createSampleData();

      this.setupResults.adminUsers = true;
      return true;
    } catch (error) {
      this.logError(`Failed to create admin users: ${error.message}`);
      return false;
    }
  }

  async createRoleUsers() {
    this.logStep('ROLE USERS', 'Creating users for all roles...');
    
    const roles = [
      { role: 'client', name: 'Client', email: 'client@localpro.com', phone: '+639171234569', password: 'Client123!@#' },
      { role: 'provider', name: 'Service Provider', email: 'provider@localpro.com', phone: '+639171234570', password: 'Provider123!@#' },
      { role: 'supplier', name: 'Supplier', email: 'supplier@localpro.com', phone: '+639171234571', password: 'Supplier123!@#' },
      { role: 'instructor', name: 'Instructor', email: 'instructor@localpro.com', phone: '+639171234572', password: 'Instructor123!@#' },
      { role: 'agency_owner', name: 'Agency Owner', email: 'agency@localpro.com', phone: '+639171234568', password: 'Agency123!@#' },
      { role: 'agency_admin', name: 'Agency Admin', email: 'agencyadmin@localpro.com', phone: '+639171234573', password: 'AgencyAdmin123!@#' }
    ];

    for (const roleData of roles) {
      try {
        this.logInfo(`Creating ${roleData.name} user...`);
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(roleData.password, saltRounds);

        // Create user based on role
        const userData = this.getUserDataByRole(roleData, hashedPassword);
        const user = new User(userData);

        // Generate referral code
        user.generateReferralCode();
        await user.save();

        // Create user settings
        const userSettings = new UserSettings({
          userId: user._id,
          ...UserSettings.getDefaultSettings()
        });
        await userSettings.save();

        // Link settings to user
        user.settings = userSettings._id;
        await user.save();

        this.createdData.users.push(user);
        this.logSuccess(`${roleData.name} created: ${user.email}`);
        
      } catch (error) {
        this.logError(`Failed to create ${roleData.name}: ${error.message}`);
      }
    }
  }

  getUserDataByRole(roleData, hashedPassword) {
    const baseData = {
      phoneNumber: roleData.phone,
      email: roleData.email,
      password: hashedPassword,
      role: roleData.role,
      isVerified: true,
      verification: {
        phoneVerified: true,
        emailVerified: true,
        identityVerified: true,
        businessVerified: true,
        addressVerified: true,
        bankAccountVerified: true,
        verifiedAt: new Date()
      },
      preferences: {
        notifications: {
          sms: true,
          email: true,
          push: true
        },
        language: 'en'
      },
      trustScore: 85,
      responseTime: {
        average: 15,
        totalResponses: 10
      },
      completionRate: 95,
      cancellationRate: 2,
      referral: {
        referralCode: '',
        referredBy: null,
        referralSource: 'direct_link',
        referralStats: {
          totalReferrals: 0,
          successfulReferrals: 0,
          totalRewardsEarned: 0,
          totalRewardsPaid: 0,
          lastReferralAt: null,
          referralTier: 'bronze'
        },
        referralPreferences: {
          autoShare: true,
          shareOnSocial: false,
          emailNotifications: true,
          smsNotifications: false
        }
      },
      wallet: {
        balance: 0,
        currency: 'PHP'
      },
      isActive: true,
      status: 'active',
      lastLoginAt: new Date(),
      lastLoginIP: '127.0.0.1',
      loginCount: 1,
      activity: {
        lastActiveAt: new Date(),
        totalSessions: 1,
        averageSessionDuration: 25,
        preferredLoginTime: '09:00',
        deviceInfo: [{
          deviceType: 'mobile',
          userAgent: 'LocalPro-Setup-Script',
          lastUsed: new Date()
        }]
      }
    };

    switch (roleData.role) {
      case 'client':
        return {
          ...baseData,
          firstName: 'John',
          lastName: 'Client',
          profile: {
            bio: 'Regular client looking for quality services',
            address: {
              street: '123 Client Street',
              city: 'Manila',
              state: 'Metro Manila',
              zipCode: '1000',
              country: 'Philippines',
              coordinates: { lat: 14.5995, lng: 120.9842 }
            },
            businessName: '',
            businessType: 'individual',
            yearsInBusiness: 0,
            serviceAreas: [],
            specialties: [],
            availability: {
              schedule: [],
              timezone: 'Asia/Manila',
              emergencyService: false
            }
          },
          badges: [
            { type: 'newcomer', earnedAt: new Date(), description: 'New Client' }
          ]
        };

      case 'provider':
        return {
          ...baseData,
          firstName: 'Maria',
          lastName: 'Provider',
          profile: {
            bio: 'Professional service provider with expertise in cleaning and maintenance',
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
            yearsInBusiness: 2,
            serviceAreas: ['Quezon City', 'Manila'],
            specialties: ['House Cleaning', 'Office Cleaning', 'Deep Cleaning'],
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
          },
          badges: [
            { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Service Provider' },
            { type: 'top_rated', earnedAt: new Date(), description: 'Top Rated Provider' }
          ]
        };

      case 'supplier':
        return {
          ...baseData,
          firstName: 'Carlos',
          lastName: 'Supplier',
          profile: {
            bio: 'Professional supplier of cleaning equipment and supplies',
            address: {
              street: '789 Supplier Boulevard',
              city: 'Makati',
              state: 'Metro Manila',
              zipCode: '1200',
              country: 'Philippines',
              coordinates: { lat: 14.5547, lng: 121.0244 }
            },
            businessName: 'Carlos Supply Co.',
            businessType: 'small_business',
            yearsInBusiness: 5,
            serviceAreas: ['Metro Manila', 'Cavite', 'Laguna'],
            specialties: ['Cleaning Equipment', 'Cleaning Supplies', 'Maintenance Tools'],
            availability: {
              schedule: [
                { day: 'monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'friday', startTime: '09:00', endTime: '18:00', isAvailable: true }
              ],
              timezone: 'Asia/Manila',
              emergencyService: false
            }
          },
          badges: [
            { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Supplier' },
            { type: 'reliable', earnedAt: new Date(), description: 'Reliable Supplier' }
          ]
        };

      case 'instructor':
        return {
          ...baseData,
          firstName: 'Dr. Sarah',
          lastName: 'Instructor',
          profile: {
            bio: 'Professional instructor with expertise in cleaning techniques and safety protocols',
            address: {
              street: '321 Education Street',
              city: 'Taguig',
              state: 'Metro Manila',
              zipCode: '1630',
              country: 'Philippines',
              coordinates: { lat: 14.5176, lng: 121.0509 }
            },
            businessName: 'Sarah\'s Training Institute',
            businessType: 'small_business',
            yearsInBusiness: 8,
            serviceAreas: ['Metro Manila', 'Rizal', 'Bulacan'],
            specialties: ['Professional Cleaning', 'Safety Training', 'Quality Management'],
            availability: {
              schedule: [
                { day: 'monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'friday', startTime: '09:00', endTime: '17:00', isAvailable: true }
              ],
              timezone: 'Asia/Manila',
              emergencyService: false
            }
          },
          badges: [
            { type: 'expert', earnedAt: new Date(), description: 'Training Expert' },
            { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Instructor' }
          ]
        };

      case 'agency_owner':
        return {
          ...baseData,
          firstName: 'Roberto',
          lastName: 'AgencyOwner',
          profile: {
            bio: 'Professional cleaning services agency owner with extensive experience',
            address: {
              street: '654 Agency Plaza',
              city: 'Quezon City',
              state: 'Metro Manila',
              zipCode: '1100',
              country: 'Philippines',
              coordinates: { lat: 14.6760, lng: 121.0437 }
            },
            businessName: 'Roberto\'s Cleaning Agency',
            businessType: 'small_business',
            yearsInBusiness: 7,
            serviceAreas: ['Quezon City', 'Manila', 'Makati', 'Taguig'],
            specialties: ['Commercial Cleaning', 'Residential Cleaning', 'Industrial Cleaning'],
            availability: {
              schedule: [
                { day: 'monday', startTime: '08:00', endTime: '18:00', isAvailable: true },
                { day: 'tuesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
                { day: 'wednesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
                { day: 'thursday', startTime: '08:00', endTime: '18:00', isAvailable: true },
                { day: 'friday', startTime: '08:00', endTime: '18:00', isAvailable: true },
                { day: 'saturday', startTime: '09:00', endTime: '15:00', isAvailable: true }
              ],
              timezone: 'Asia/Manila',
              emergencyService: true
            }
          },
          badges: [
            { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Agency Owner' },
            { type: 'top_rated', earnedAt: new Date(), description: 'Top Rated Agency' }
          ]
        };

      case 'agency_admin':
        return {
          ...baseData,
          firstName: 'Lisa',
          lastName: 'AgencyAdmin',
          profile: {
            bio: 'Agency administrator managing daily operations and staff coordination',
            address: {
              street: '987 Admin Center',
              city: 'Makati',
              state: 'Metro Manila',
              zipCode: '1200',
              country: 'Philippines',
              coordinates: { lat: 14.5547, lng: 121.0244 }
            },
            businessName: 'Lisa\'s Management Services',
            businessType: 'small_business',
            yearsInBusiness: 4,
            serviceAreas: ['Makati', 'Taguig', 'Pasig'],
            specialties: ['Operations Management', 'Staff Coordination', 'Quality Control'],
            availability: {
              schedule: [
                { day: 'monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
                { day: 'friday', startTime: '09:00', endTime: '18:00', isAvailable: true }
              ],
              timezone: 'Asia/Manila',
              emergencyService: false
            }
          },
          badges: [
            { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Agency Admin' },
            { type: 'reliable', earnedAt: new Date(), description: 'Reliable Administrator' }
          ]
        };

      default:
        return baseData;
    }
  }

  async createSampleData() {
    this.logStep('SAMPLE DATA', 'Creating sample data for all collections...');
    
    try {
      // Get created users for references
      const provider = this.createdData.users.find(u => u.role === 'provider');
      const client = this.createdData.users.find(u => u.role === 'client');
      const supplier = this.createdData.users.find(u => u.role === 'supplier');
      const instructor = this.createdData.users.find(u => u.role === 'instructor');
      const agencyOwner = this.createdData.users.find(u => u.role === 'agency_owner');

      if (!provider || !client || !supplier || !instructor || !agencyOwner) {
        this.logWarning('Required users not found, skipping sample data creation');
        return true;
      }

      // Create sample services
      await this.createSampleServices(provider);
      
      // Create sample jobs
      await this.createSampleJobs(provider);
      
      // Create sample courses
      await this.createSampleCourses(instructor);
      
      // Create sample products
      await this.createSampleProducts(supplier);
      
      // Create sample rental items
      await this.createSampleRentalItems(provider);
      
      // Create sample agencies
      await this.createSampleAgencies(agencyOwner);
      
      // Create subscription plans
      await this.createSubscriptionPlans();
      
      this.logSuccess('Sample data created successfully');
      return true;
    } catch (error) {
      this.logError(`Failed to create sample data: ${error.message}`);
      return false;
    }
  }

  async createSampleServices(provider) {
    try {
      const services = [
        {
          title: 'Professional House Cleaning',
          description: 'Complete house cleaning service including all rooms, bathrooms, and kitchen.',
          category: 'cleaning',
          subcategory: 'house_cleaning',
          provider: provider._id,
          pricing: {
            type: 'hourly',
            basePrice: 25,
            currency: 'USD'
          },
          serviceArea: ['1000', '1100', '1200'],
          features: ['Eco-friendly products', 'Insured service', 'Same-day booking'],
          requirements: ['Access to all areas', 'Water supply'],
          serviceType: 'one_time',
          estimatedDuration: { min: 2, max: 4 },
          teamSize: 2,
          equipmentProvided: true,
          materialsIncluded: true,
          warranty: {
            hasWarranty: true,
            duration: 7,
            description: '7-day satisfaction guarantee'
          },
          emergencyService: {
            available: true,
            surcharge: 50,
            responseTime: 'within 2 hours'
          }
        },
        {
          title: 'Office Deep Cleaning',
          description: 'Comprehensive office cleaning including desks, floors, and common areas.',
          category: 'cleaning',
          subcategory: 'office_cleaning',
          provider: provider._id,
          pricing: {
            type: 'fixed',
            basePrice: 200,
            currency: 'USD'
          },
          serviceArea: ['1000', '1100'],
          features: ['After-hours service', 'Green cleaning', 'Detailed reporting'],
          requirements: ['Office access', 'Parking space'],
          serviceType: 'recurring',
          estimatedDuration: { min: 4, max: 6 },
          teamSize: 3,
          equipmentProvided: true,
          materialsIncluded: true
        }
      ];

      for (const serviceData of services) {
        const service = new Service(serviceData);
        await service.save();
        this.createdData.services.push(service);
      }

      this.logSuccess(`Created ${services.length} sample services`);
    } catch (error) {
      this.logError(`Failed to create sample services: ${error.message}`);
    }
  }

  async createSampleJobs(employer) {
    try {
      const jobs = [
        {
          title: 'Senior Cleaning Specialist',
          description: 'We are looking for an experienced cleaning specialist to join our team.',
          company: {
            name: 'CleanPro Services',
            size: 'medium',
            industry: 'Cleaning Services',
            location: {
              address: '123 Business Ave, Manila',
              city: 'Manila',
              state: 'Metro Manila',
              country: 'Philippines',
              coordinates: { lat: 14.5995, lng: 120.9842 },
              isRemote: false,
              remoteType: 'on_site'
            }
          },
          employer: employer._id,
          category: 'cleaning',
          subcategory: 'residential_cleaning',
          jobType: 'full_time',
          experienceLevel: 'senior',
          salary: {
            min: 25000,
            max: 35000,
            currency: 'PHP',
            period: 'monthly',
            isNegotiable: true
          },
          benefits: ['health_insurance', 'paid_time_off', 'professional_development'],
          requirements: {
            skills: ['Cleaning techniques', 'Customer service', 'Time management'],
            education: {
              level: 'high_school',
              field: 'Any',
              isRequired: false
            },
            experience: {
              years: 3,
              description: 'Minimum 3 years in cleaning services'
            },
            certifications: ['Cleaning certification preferred'],
            languages: [{
              language: 'English',
              proficiency: 'intermediate'
            }]
          },
          responsibilities: [
            'Perform deep cleaning of residential properties',
            'Maintain cleaning equipment and supplies',
            'Follow safety protocols and procedures',
            'Communicate with clients about service requirements'
          ],
          qualifications: [
            'Physical ability to lift up to 25kg',
            'Reliable transportation',
            'Flexible schedule including weekends'
          ],
          applicationProcess: {
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            applicationMethod: 'platform',
            instructions: 'Please submit your resume and cover letter'
          },
          status: 'active',
          visibility: 'public'
        }
      ];

      for (const jobData of jobs) {
        const job = new Job(jobData);
        await job.save();
        this.createdData.jobs.push(job);
      }

      this.logSuccess(`Created ${jobs.length} sample jobs`);
    } catch (error) {
      this.logError(`Failed to create sample jobs: ${error.message}`);
    }
  }

  async createSampleCourses(instructor) {
    try {
      const courses = [
        {
          title: 'Professional Cleaning Techniques',
          description: 'Learn advanced cleaning techniques and best practices for professional cleaning services.',
          category: 'cleaning',
          instructor: instructor._id,
          partner: {
            name: 'TES',
            logo: 'https://example.com/tes-logo.png',
            website: 'https://tes.com'
          },
          level: 'intermediate',
          duration: {
            hours: 40,
            weeks: 4
          },
          pricing: {
            regularPrice: 299,
            discountedPrice: 199,
            currency: 'USD'
          },
          curriculum: [
            {
              module: 'Introduction to Professional Cleaning',
              lessons: [
                {
                  title: 'Cleaning Fundamentals',
                  description: 'Basic principles of effective cleaning',
                  duration: 60,
                  type: 'video',
                  // content: {
                  //   url: 'https://example.com/video1',
                  //   publicId: 'video1_public_id'
                  // },
                  isFree: true
                },
                {
                  title: 'Safety Protocols',
                  description: 'Important safety measures in cleaning',
                  duration: 45,
                  type: 'video',
                  // content: {
                  //   url: 'https://example.com/video2',
                  //   publicId: 'video2_public_id'
                  // },
                  isFree: false
                }
              ]
            }
          ],
          prerequisites: ['Basic cleaning knowledge'],
          learningOutcomes: [
            'Master professional cleaning techniques',
            'Understand safety protocols',
            'Learn customer service skills'
          ],
          certification: {
            isAvailable: true,
            name: 'Professional Cleaning Certificate',
            issuer: 'TES',
            validity: 24,
            requirements: ['Complete all modules', 'Pass final exam']
          },
          enrollment: {
            current: 0,
            maxCapacity: 50,
            isOpen: true
          },
          schedule: {
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
            sessions: [
              {
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                startTime: '09:00',
                endTime: '17:00',
                type: 'live'
              }
            ]
          },
          tags: ['cleaning', 'professional', 'certification']
        }
      ];

      for (const courseData of courses) {
        const course = new Course(courseData);
        await course.save();
        this.createdData.courses.push(course);
      }

      this.logSuccess(`Created ${courses.length} sample courses`);
    } catch (error) {
      this.logError(`Failed to create sample courses: ${error.message}`);
    }
  }

  async createSampleProducts(supplier) {
    try {
      const products = [
        {
          name: 'Professional All-Purpose Cleaner',
          description: 'Heavy-duty all-purpose cleaner suitable for all surfaces.',
          category: 'cleaning_supplies',
          subcategory: 'cleaners',
          brand: 'CleanPro',
          sku: 'CP-APC-001',
          pricing: {
            retailPrice: 15.99,
            wholesalePrice: 12.99,
            currency: 'USD'
          },
          inventory: {
            quantity: 100,
            minStock: 20,
            maxStock: 200,
            location: 'Warehouse A'
          },
          specifications: {
            weight: '1 gallon',
            dimensions: '8x6x12 inches',
            material: 'Concentrated formula',
            color: 'Clear',
            warranty: '1 year'
          },
          tags: ['all-purpose', 'professional', 'concentrated'],
          isActive: true,
          isSubscriptionEligible: true,
          supplier: supplier._id
        },
        {
          name: 'Microfiber Cleaning Cloths',
          description: 'High-quality microfiber cloths for streak-free cleaning.',
          category: 'cleaning_supplies',
          subcategory: 'cloths',
          brand: 'MicroClean',
          sku: 'MC-MFC-001',
          pricing: {
            retailPrice: 8.99,
            wholesalePrice: 6.99,
            currency: 'USD'
          },
          inventory: {
            quantity: 200,
            minStock: 50,
            maxStock: 500,
            location: 'Warehouse A'
          },
          specifications: {
            weight: '0.5 lbs',
            dimensions: '16x16 inches',
            material: 'Microfiber',
            color: 'Blue',
            warranty: '6 months'
          },
          tags: ['microfiber', 'streak-free', 'reusable'],
          isActive: true,
          isSubscriptionEligible: true,
          supplier: supplier._id
        }
      ];

      for (const productData of products) {
        const product = new Product(productData);
        await product.save();
        this.createdData.products.push(product);
      }

      this.logSuccess(`Created ${products.length} sample products`);
    } catch (error) {
      this.logError(`Failed to create sample products: ${error.message}`);
    }
  }

  async createSampleRentalItems(owner) {
    try {
      const rentalItems = [
        {
          name: 'Professional Pressure Washer',
          description: 'High-pressure washer for exterior cleaning and maintenance.',
          category: 'equipment',
          subcategory: 'pressure_washers',
          owner: owner._id,
          pricing: {
            hourly: 25,
            daily: 150,
            weekly: 800,
            monthly: 2500,
            currency: 'USD'
          },
          availability: {
            isAvailable: true,
            schedule: []
          },
          location: {
            address: {
              street: '456 Equipment St',
              city: 'Manila',
              state: 'Metro Manila',
              zipCode: '1000',
              country: 'Philippines'
            },
            coordinates: {
              lat: 14.5995,
              lng: 120.9842
            },
            pickupRequired: true,
            deliveryAvailable: true,
            deliveryFee: 50
          },
          specifications: {
            brand: 'PowerClean',
            model: 'PC-3000',
            year: 2023,
            condition: 'excellent',
            features: ['Adjustable pressure', 'Hot water capability', 'Long hose'],
            dimensions: {
              length: 24,
              width: 18,
              height: 36,
              unit: 'inches'
            },
            weight: {
              value: 85,
              unit: 'lbs'
            }
          },
          requirements: {
            minAge: 18,
            licenseRequired: false,
            deposit: 200,
            insuranceRequired: true
          },
          isActive: true
        }
      ];

      for (const rentalItemData of rentalItems) {
        const rentalItem = new RentalItem(rentalItemData);
        await rentalItem.save();
        this.createdData.rentalItems.push(rentalItem);
      }

      this.logSuccess(`Created ${rentalItems.length} sample rental items`);
    } catch (error) {
      this.logError(`Failed to create sample rental items: ${error.message}`);
    }
  }

  async createSampleAgencies(owner) {
    try {
      const agencyData = {
        name: 'Metro Manila Cleaning Agency',
        description: 'Professional cleaning services agency serving Metro Manila area.',
        owner: owner._id,
        contact: {
          email: 'info@metromanilacleaning.com',
          phone: '+639171234567',
          website: 'https://metromanilacleaning.com',
          address: {
            street: '789 Agency Plaza',
            city: 'Quezon City',
            state: 'Metro Manila',
            zipCode: '1100',
            country: 'Philippines',
            coordinates: {
              lat: 14.6760,
              lng: 121.0437
            }
          }
        },
        business: {
          type: 'corporation',
          registrationNumber: 'REG-2023-001',
          taxId: 'TAX-2023-001',
          licenseNumber: 'LIC-2023-001',
          insurance: {
            provider: 'Insurance Corp',
            policyNumber: 'POL-2023-001',
            coverageAmount: 1000000,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        },
        serviceAreas: [
          {
            name: 'Quezon City',
            coordinates: { lat: 14.6760, lng: 121.0437 },
            radius: 25,
            zipCodes: ['1100', '1101', '1102']
          },
          {
            name: 'Manila',
            coordinates: { lat: 14.5995, lng: 120.9842 },
            radius: 20,
            zipCodes: ['1000', '1001', '1002']
          }
        ],
        services: [
          {
            category: 'cleaning',
            subcategories: ['house_cleaning', 'office_cleaning', 'deep_cleaning'],
            pricing: {
              baseRate: 25,
              currency: 'USD'
            }
          }
        ],
        subscription: {
          plan: 'professional',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          features: ['advanced_analytics', 'priority_support', 'custom_branding']
        },
        verification: {
          isVerified: true,
          verifiedAt: new Date(),
          documents: [
            {
              type: 'business_license',
              url: 'https://example.com/license.pdf',
              filename: 'business_license.pdf',
              uploadedAt: new Date()
            }
          ]
        },
        analytics: {
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalReviews: 0,
          monthlyStats: []
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
        },
        isActive: true
      };

      const agency = new Agency(agencyData);
      await agency.save();
      this.createdData.agencies.push(agency);

      this.logSuccess('Created sample agency');
    } catch (error) {
      this.logError(`Failed to create sample agency: ${error.message}`);
    }
  }

  async createSubscriptionPlans() {
    try {
      const plans = [
        {
          name: 'Basic',
          description: 'Perfect for individual service providers',
          price: {
            monthly: 29,
            yearly: 290,
            currency: 'USD'
          },
          features: [
            { name: 'Service Listings', description: 'Up to 5 service listings', included: true, limit: 5, unit: 'per_month' },
            { name: 'Booking Management', description: 'Basic booking management', included: true, limit: 50, unit: 'per_month' },
            { name: 'Customer Support', description: 'Email support', included: true },
            { name: 'Analytics', description: 'Basic analytics', included: true }
          ],
          limits: {
            maxServices: 5,
            maxBookings: 50,
            maxProviders: 1,
            maxStorage: 1000,
            maxApiCalls: 1000
          },
          benefits: ['Basic support', 'Standard features'],
          isActive: true,
          isPopular: false,
          sortOrder: 1
        },
        {
          name: 'Professional',
          description: 'Ideal for growing businesses',
          price: {
            monthly: 79,
            yearly: 790,
            currency: 'USD'
          },
          features: [
            { name: 'Service Listings', description: 'Up to 25 service listings', included: true, limit: 25, unit: 'per_month' },
            { name: 'Booking Management', description: 'Advanced booking management', included: true, limit: 200, unit: 'per_month' },
            { name: 'Priority Support', description: 'Priority email and phone support', included: true },
            { name: 'Advanced Analytics', description: 'Detailed analytics and reporting', included: true },
            { name: 'Custom Branding', description: 'Custom branding options', included: true }
          ],
          limits: {
            maxServices: 25,
            maxBookings: 200,
            maxProviders: 5,
            maxStorage: 5000,
            maxApiCalls: 5000
          },
          benefits: ['Priority support', 'Advanced features', 'Custom branding'],
          isActive: true,
          isPopular: true,
          sortOrder: 2
        },
        {
          name: 'Enterprise',
          description: 'For large organizations and agencies',
          price: {
            monthly: 199,
            yearly: 1990,
            currency: 'USD'
          },
          features: [
            { name: 'Service Listings', description: 'Unlimited service listings', included: true },
            { name: 'Booking Management', description: 'Unlimited booking management', included: true },
            { name: 'Dedicated Support', description: 'Dedicated account manager', included: true },
            { name: 'Advanced Analytics', description: 'Enterprise analytics and reporting', included: true },
            { name: 'White Label', description: 'Complete white label solution', included: true },
            { name: 'API Access', description: 'Full API access', included: true }
          ],
          limits: {
            maxServices: null,
            maxBookings: null,
            maxProviders: null,
            maxStorage: 50000,
            maxApiCalls: null
          },
          benefits: ['Dedicated support', 'White label', 'Unlimited features', 'API access'],
          isActive: true,
          isPopular: false,
          sortOrder: 3
        }
      ];

      for (const planData of plans) {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        this.createdData.subscriptions.push(plan);
      }

      this.logSuccess(`Created ${plans.length} subscription plans`);
    } catch (error) {
      this.logError(`Failed to create subscription plans: ${error.message}`);
    }
  }

  async validateSetup() {
    this.logStep('VALIDATION', 'Validating setup...');
    
    try {
      const validationResults = {
        database: false,
        appSettings: false,
        adminUsers: false,
        sampleData: false,
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

      // Check admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      if (adminUsers.length > 0) {
        validationResults.adminUsers = true;
        this.logSuccess(`${adminUsers.length} admin user(s) found`);
        adminUsers.forEach(admin => {
          this.logInfo(`Admin: ${admin.email} (${admin.phoneNumber})`);
        });
      } else {
        this.logError('No admin users found');
      }

      // Check sample data
      const serviceCount = await Service.countDocuments();
      const jobCount = await Job.countDocuments();
      const courseCount = await Course.countDocuments();
      const productCount = await Product.countDocuments();
      const rentalItemCount = await RentalItem.countDocuments();
      const agencyCount = await Agency.countDocuments();
      const subscriptionPlanCount = await SubscriptionPlan.countDocuments();

      if (serviceCount > 0 || jobCount > 0 || courseCount > 0 || productCount > 0 || rentalItemCount > 0 || agencyCount > 0 || subscriptionPlanCount > 0) {
        validationResults.sampleData = true;
        this.logSuccess('Sample data is available');
        this.logInfo(`Services: ${serviceCount}, Jobs: ${jobCount}, Courses: ${courseCount}, Products: ${productCount}, Rental Items: ${rentalItemCount}, Agencies: ${agencyCount}, Subscription Plans: ${subscriptionPlanCount}`);
      } else {
        this.logWarning('No sample data found');
      }

      validationResults.totalRecords = adminUsers.length + serviceCount + jobCount + courseCount + productCount + rentalItemCount + agencyCount + subscriptionPlanCount;

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
        jobs: this.createdData.jobs.length,
        courses: this.createdData.courses.length,
        products: this.createdData.products.length,
        rentalItems: this.createdData.rentalItems.length,
        subscriptions: this.createdData.subscriptions.length,
        referrals: this.createdData.referrals.length
      },
      adminCredentials: this.createdData.users.map(user => ({
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
      })),
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
    const reportPath = path.join(__dirname, 'setup-auto-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logSuccess(`Setup report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🚀 LocalPro Super App Automated Setup${colors.reset}`, 'blue');
    this.log(`${colors.blue}==========================================${colors.reset}`, 'blue');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');
    this.log(`Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app'}`, 'cyan');
    this.log(`Admin Email: ${this.args.adminEmail}`, 'cyan');
    this.log(`Admin Phone: ${this.args.adminPhone}`, 'cyan');
    this.log(`Company: ${this.args.companyName}`, 'cyan');

    try {
      // Step 1: Connect to database
      const dbConnected = await this.connectDatabase();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Step 2: Reset database (if needed)
      const dbReset = await this.resetDatabase();
      if (!dbReset) {
        throw new Error('Database reset failed');
      }

      // Step 3: Create app settings
      const settingsCreated = await this.createAppSettings();
      if (!settingsCreated) {
        throw new Error('Failed to create app settings');
      }

      // Step 4: Create admin users
      const adminCreated = await this.createAdminUsers();
      if (!adminCreated) {
        throw new Error('Failed to create admin users');
      }

      // Step 5: Validate setup
      const validation = await this.validateSetup();
      if (!validation) {
        throw new Error('Setup validation failed');
      }

      // Step 6: Generate report
      const report = await this.generateSetupReport();

      // Final success message
      this.log(`\n${colors.bright}${colors.green}🎉 Automated Setup Completed Successfully!${colors.reset}`, 'green');
      this.log(`${colors.green}==========================================${colors.reset}`, 'green');
      
      this.log(`\n${colors.bright}Admin Credentials:${colors.reset}`, 'yellow');
      report.adminCredentials.forEach(cred => {
        this.log(`${cred.role}: ${cred.email} (${cred.phone}) - ${cred.name}`, 'cyan');
      });
      
      this.log(`\n${colors.bright}Created Data:${colors.reset}`, 'yellow');
      this.log(`Users: ${report.createdData.users}`, 'cyan');
      this.log(`Agencies: ${report.createdData.agencies}`, 'cyan');
      this.log(`Services: ${report.createdData.services}`, 'cyan');
      this.log(`Jobs: ${report.createdData.jobs}`, 'cyan');
      this.log(`Courses: ${report.createdData.courses}`, 'cyan');
      this.log(`Products: ${report.createdData.products}`, 'cyan');
      this.log(`Rental Items: ${report.createdData.rentalItems}`, 'cyan');
      this.log(`Subscription Plans: ${report.createdData.subscriptions}`, 'cyan');
      
      this.log(`\n${colors.bright}Next Steps:${colors.reset}`, 'yellow');
      report.nextSteps.forEach((step, index) => {
        this.log(`${index + 1}. ${step}`, 'cyan');
      });

      this.log(`\n${colors.bright}Setup Report:${colors.reset} setup-auto-report.json`, 'yellow');
      
      return true;
    } catch (error) {
      this.logError(`Automated setup failed: ${error.message}`);
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
  const autoSetup = new AutoSetup();
  autoSetup.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Automated setup error:', error);
      process.exit(1);
    });
}

module.exports = AutoSetup;
