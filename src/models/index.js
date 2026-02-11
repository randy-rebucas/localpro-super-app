// ============================================================================
// MODELS INDEX
// ============================================================================
// Central export point for all models in the application

// ============================================================================
// AUTHENTICATION & USER MODELS
// ============================================================================
const User = require('./User');

// ============================================================================
// MARKETPLACE MODELS
// ============================================================================
const Service = require('./Service');
const Booking = require('./Booking');

// ============================================================================
// JOB BOARD MODELS
// ============================================================================
const Job = require('./Job');

// ============================================================================
// SUPPLIES/PRODUCTS MODELS
// ============================================================================
const {
  ProductCategory,
  Product,
  SubscriptionKit,
  Order,
  ProductReview,
  StockHistory,
  CONSTANTS: SUPPLIES_CONSTANTS
} = require('./Supplies');

// ============================================================================
// RENTALS MODELS
// ============================================================================
const {
  RentalCategory,
  RentalItem,
  Rental,
  CONSTANTS: RENTALS_CONSTANTS
} = require('./Rentals');

// ============================================================================
// AGENCY MODELS
// ============================================================================
const Agency = require('./Agency');

// ============================================================================
// REFERRAL MODELS
// ============================================================================
const Referral = require('./Referral');

// ============================================================================
// SETTINGS MODELS
// ============================================================================
const UserSettings = require('./UserSettings');
const AppSettings = require('./AppSettings');

// ============================================================================
// NOTIFICATION MODELS
// ============================================================================
const Notification = require('./Notification');

// ============================================================================
// AUDIT & LOGGING MODELS
// ============================================================================
const AuditLog = require('./AuditLog');

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  // User & Auth
  User,

  // Marketplace
  Service,
  Booking,

  // Job Board
  Job,

  // Supplies/Products
  ProductCategory,
  Product,
  SubscriptionKit,
  Order,
  ProductReview,
  StockHistory,
  SUPPLIES_CONSTANTS,

  // Rentals
  RentalCategory,
  RentalItem,
  Rental,
  RENTALS_CONSTANTS,

  // Agency
  Agency,

  // Referral
  Referral,

  // Settings
  UserSettings,
  AppSettings,

  // Notifications
  Notification,

  // Audit & Logging
  AuditLog,

  // Utility function to get all models
  getAllModels() {
    return {
      User,
      Service,
      Booking,
      Job,
      ProductCategory,
      Product,
      SubscriptionKit,
      Order,
      ProductReview,
      StockHistory,
      RentalCategory,
      RentalItem,
      Rental,
      Agency,
      Referral,
      UserSettings,
      AppSettings,
      Notification,
      AuditLog
    };
  },

  // Utility to get model by name
  getModelByName(name) {
    const models = this.getAllModels();
    return models[name] || null;
  }
};
