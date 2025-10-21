#!/usr/bin/env node

/**
 * LocalPro Super App Enhanced Setup Installation Script
 * This script provides an interactive setup for admin users and application settings
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import all models
const User = require('./src/models/User');
const AppSettings = require('./src/models/AppSettings');
const UserSettings = require('./src/models/UserSettings');
const Agency = require('./src/models/Agency');

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

class SetupInstaller {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.setupResults = {
      database: false,
      appSettings: false,
      adminUsers: false,
      validation: false
    };
    this.createdData = {
      users: [],
      agencies: []
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

  // Promisified readline question
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  // Hide password input
  questionHidden(prompt) {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      let password = '';
      process.stdin.on('data', function(char) {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeAllListeners('data');
            console.log('');
            resolve(password);
            break;
          case '\u0003':
            process.exit();
            break;
          case '\u007f': // backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += char;
            process.stdout.write('*');
            break;
        }
      });
    });
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
      this.logInfo('Please ensure MongoDB is running and accessible');
      return false;
    }
  }

  async resetDatabase() {
    this.logStep('DATABASE RESET', 'Resetting database...');
    
    try {
      // Check if database has existing data
      const userCount = await User.countDocuments();
      const settingsCount = await AppSettings.countDocuments();
      
      if (userCount > 0 || settingsCount > 0) {
        this.logWarning(`Found existing data: ${userCount} users, ${settingsCount} settings`);
        
        const confirmReset = await this.question('Do you want to reset/clean the database before setup? (y/N): ');
        if (confirmReset.toLowerCase() === 'y' || confirmReset.toLowerCase() === 'yes') {
          this.logInfo('Cleaning database...');
          
          // Drop all collections
          const collections = await mongoose.connection.db.listCollections().toArray();
          for (const collection of collections) {
            await mongoose.connection.db.collection(collection.name).drop();
            this.logInfo(`Dropped collection: ${collection.name}`);
          }
          
          this.logSuccess('Database cleaned successfully');
          return true;
        } else {
          this.logInfo('Skipping database reset');
          return true;
        }
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
        this.logWarning('App settings already exist');
        const update = await this.question('Do you want to update existing settings? (y/N): ');
        if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
          this.logInfo('Skipping app settings creation');
          this.setupResults.appSettings = true;
          return true;
        }
      }

      this.logInfo('Configuring application settings...');
      
      // Get company information
      const companyName = await this.question('Enter company name (LocalPro Super App): ') || 'LocalPro Super App';
      const companyEmail = await this.question('Enter company email (support@localpro.com): ') || 'support@localpro.com';
      const companyPhone = await this.question('Enter company phone (+63-XXX-XXX-XXXX): ') || '+63-XXX-XXX-XXXX';
      
      // Get business address
      this.logInfo('\nBusiness Address:');
      const street = await this.question('Street address: ') || '123 Business Street';
      const city = await this.question('City (Manila): ') || 'Manila';
      const state = await this.question('State (Metro Manila): ') || 'Metro Manila';
      const zipCode = await this.question('ZIP Code (1000): ') || '1000';
      const country = await this.question('Country (Philippines): ') || 'Philippines';

      const defaultSettings = new AppSettings({
        general: {
          appName: companyName,
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
          companyName: companyName,
          companyEmail: companyEmail,
          companyPhone: companyPhone,
          companyAddress: {
            street: street,
            city: city,
            state: state,
            zipCode: zipCode,
            country: country
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
            email: { enabled: true, address: companyEmail },
            phone: { enabled: true, number: companyPhone },
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
          email: { enabled: true, provider: 'nodemailer', fromEmail: companyEmail, fromName: companyName },
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
        this.logWarning('Admin users already exist');
        const update = await this.question('Do you want to create additional admin users? (y/N): ');
        if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
          this.logInfo('Skipping admin user creation');
          this.setupResults.adminUsers = true;
          return true;
        }
      }

      this.logInfo('Setting up admin user account...');
      
      // Get admin user information
      const firstName = await this.question('Enter admin first name (Super): ') || 'Super';
      const lastName = await this.question('Enter admin last name (Admin): ') || 'Admin';
      const email = await this.question('Enter admin email (admin@localpro.com): ') || 'admin@localpro.com';
      const phoneNumber = await this.question('Enter admin phone number (+639179157515): ') || '+639179157515';
      
      // Get password
      let password = '';
      let confirmPassword = '';
      
      do {
        password = await this.questionHidden('Enter admin password (min 8 characters): ');
        if (password.length < 8) {
          this.logError('Password must be at least 8 characters long');
          continue;
        }
        
        confirmPassword = await this.questionHidden('Confirm admin password: ');
        if (password !== confirmPassword) {
          this.logError('Passwords do not match. Please try again.');
        }
      } while (password !== confirmPassword);

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create super admin
      const superAdmin = new User({
        phoneNumber: phoneNumber,
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword, // Add password field
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
        },
        trustScore: 100,
        badges: [
          { type: 'verified_provider', earnedAt: new Date(), description: 'System Administrator' },
          { type: 'expert', earnedAt: new Date(), description: 'Platform Expert' }
        ],
        subscription: {
          type: 'enterprise',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true
        },
        wallet: {
          balance: 0,
          currency: 'PHP'
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

      // Ask if user wants to create additional role users
      const createRoleUsers = await this.question('\nDo you want to create users for all roles (client, provider, supplier, instructor, agency_owner, agency_admin)? (y/N): ');
      if (createRoleUsers.toLowerCase() === 'y' || createRoleUsers.toLowerCase() === 'yes') {
        await this.createRoleUsers();
      }

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
      trustScore: 85,
      subscription: {
        type: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      wallet: {
        balance: 0,
        currency: 'PHP'
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

  async createAgencyOwner() {
    this.logInfo('\nSetting up agency owner account...');
    
    // Get agency owner information
    const firstName = await this.question('Enter agency owner first name (Agency): ') || 'Agency';
    const lastName = await this.question('Enter agency owner last name (Owner): ') || 'Owner';
    const email = await this.question('Enter agency owner email (agency@localpro.com): ') || 'agency@localpro.com';
    const phoneNumber = await this.question('Enter agency owner phone number (+639171234568): ') || '+639171234568';
    
    // Get password
    let password = '';
    let confirmPassword = '';
    
    do {
      password = await this.questionHidden('Enter agency owner password (min 8 characters): ');
      if (password.length < 8) {
        this.logError('Password must be at least 8 characters long');
        continue;
      }
      
      confirmPassword = await this.questionHidden('Confirm agency owner password: ');
      if (password !== confirmPassword) {
        this.logError('Passwords do not match. Please try again.');
      }
    } while (password !== confirmPassword);

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create agency owner
    const agencyOwner = new User({
      phoneNumber: phoneNumber,
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      role: 'agency_owner',
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
        bio: 'Professional cleaning services agency owner',
        address: {
          street: '456 Business Avenue',
          city: 'Quezon City',
          state: 'Metro Manila',
          zipCode: '1100',
          country: 'Philippines',
          coordinates: { lat: 14.6760, lng: 121.0437 }
        },
        businessName: 'CleanPro Services',
        businessType: 'small_business',
        yearsInBusiness: 3,
        serviceAreas: ['Quezon City', 'Manila', 'Makati'],
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
      },
      trustScore: 95,
      badges: [
        { type: 'verified_provider', earnedAt: new Date(), description: 'Verified Business Owner' },
        { type: 'top_rated', earnedAt: new Date(), description: 'Top Rated Agency' }
      ],
      subscription: {
        type: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      wallet: {
        balance: 0,
        currency: 'PHP'
      }
    });

    agencyOwner.generateReferralCode();
    await agencyOwner.save();

    // Create user settings for agency owner
    const agencyOwnerSettings = new UserSettings({
      userId: agencyOwner._id,
      ...UserSettings.getDefaultSettings()
    });
    await agencyOwnerSettings.save();

    agencyOwner.settings = agencyOwnerSettings._id;
    await agencyOwner.save();

    this.createdData.users.push(agencyOwner);
    this.logSuccess(`Agency owner created: ${agencyOwner.email}`);

    // Create sample agency
    await this.createSampleAgency(agencyOwner);
  }

  async createSampleAgency(agencyOwner) {
    this.logInfo('Creating sample agency...');
    
    const agency = new Agency({
      name: 'Devcom Digital Marketing Services',
      description: 'Professional digital marketing services for businesses. We provide reliable, high-quality digital marketing solutions with trained and verified staff.',
      owner: agencyOwner._id,
      contact: {
        email: 'info@devcom.com',
        phone: agencyOwner.phoneNumber,
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
          coordinates: { lat: 14.6760, lng: 121.0437 },
          radius: 25,
          zipCodes: ['1100', '1101', '1102', '1103', '1104']
        },
        {
          name: 'Manila',
          coordinates: { lat: 14.5995, lng: 120.9842 },
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
    this.logSuccess(`Sample agency created: ${agency.name}`);
  }

  async validateSetup() {
    this.logStep('VALIDATION', 'Validating setup...');
    
    try {
      const validationResults = {
        database: false,
        appSettings: false,
        adminUsers: false,
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
      const agencyOwners = await User.find({ role: 'agency_owner' });
      
      if (adminUsers.length > 0) {
        validationResults.adminUsers = true;
        this.logSuccess(`${adminUsers.length} admin user(s) found`);
        adminUsers.forEach(admin => {
          this.logInfo(`Admin: ${admin.email} (${admin.phoneNumber})`);
        });
      } else {
        this.logError('No admin users found');
      }

      if (agencyOwners.length > 0) {
        this.logSuccess(`${agencyOwners.length} agency owner(s) found`);
        agencyOwners.forEach(owner => {
          this.logInfo(`Agency Owner: ${owner.email} (${owner.phoneNumber})`);
        });
      }

      // Check agencies
      const agencies = await Agency.find();
      if (agencies.length > 0) {
        this.logSuccess(`${agencies.length} agency(ies) found`);
        agencies.forEach(agency => {
          this.logInfo(`Agency: ${agency.name} (${agency.contact.email})`);
        });
      }

      validationResults.totalRecords = adminUsers.length + agencyOwners.length + agencies.length;

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
        agencies: this.createdData.agencies.length
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
    const reportPath = path.join(__dirname, 'setup-install-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logSuccess(`Setup report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🚀 LocalPro Super App Setup Installation${colors.reset}`, 'blue');
    this.log(`${colors.blue}============================================${colors.reset}`, 'blue');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');
    this.log(`Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app'}`, 'cyan');

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
      this.log(`\n${colors.bright}${colors.green}🎉 Setup Installation Completed Successfully!${colors.reset}`, 'green');
      this.log(`${colors.green}==========================================${colors.reset}`, 'green');
      
      this.log(`\n${colors.bright}Admin Credentials:${colors.reset}`, 'yellow');
      report.adminCredentials.forEach(cred => {
        this.log(`${cred.role}: ${cred.email} (${cred.phone}) - ${cred.name}`, 'cyan');
      });
      
      this.log(`\n${colors.bright}Created Data:${colors.reset}`, 'yellow');
      this.log(`Users: ${report.createdData.users}`, 'cyan');
      this.log(`Agencies: ${report.createdData.agencies}`, 'cyan');
      
      this.log(`\n${colors.bright}Next Steps:${colors.reset}`, 'yellow');
      report.nextSteps.forEach((step, index) => {
        this.log(`${index + 1}. ${step}`, 'cyan');
      });

      this.log(`\n${colors.bright}Setup Report:${colors.reset} setup-install-report.json`, 'yellow');
      
      return true;
    } catch (error) {
      this.logError(`Setup installation failed: ${error.message}`);
      return false;
    } finally {
      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        this.log('\nDatabase connection closed', 'cyan');
      }
      
      // Close readline interface
      this.rl.close();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const installer = new SetupInstaller();
  installer.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup installation error:', error);
      process.exit(1);
    });
}

module.exports = SetupInstaller;
