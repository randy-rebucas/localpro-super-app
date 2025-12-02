const UserSettings = require('../models/UserSettings');
const AppSettings = require('../models/AppSettings');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Simple in-memory cache for public app settings
const publicSettingsCache = {
  data: null,
  timestamp: null,
  TTL: 60000 // 60 seconds cache
};

// Helper function to check if cache is valid
const isCacheValid = () => {
  if (!publicSettingsCache.data || !publicSettingsCache.timestamp) {
    return false;
  }
  return Date.now() - publicSettingsCache.timestamp < publicSettingsCache.TTL;
};

// Helper function to invalidate cache
const invalidatePublicSettingsCache = () => {
  publicSettingsCache.data = null;
  publicSettingsCache.timestamp = null;
  logger.debug('Public app settings cache invalidated');
};

// User Settings Controllers

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let userSettings = await UserSettings.findOne({ userId }).populate('userId', 'firstName lastName email phoneNumber role');
    
    if (!userSettings) {
      // Create default settings if none exist
      userSettings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings()
      });
      await userSettings.save();
    }
    
    res.status(200).json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings',
      error: error.message
    });
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updates = req.body;
    
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    // Helper function to recursively update nested objects
    const deepUpdate = (obj, updates) => {
      Object.keys(updates).forEach(key => {
        const updateValue = updates[key];
        
        if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue) && updateValue.constructor === Object) {
          // If it's a nested object, recursively update
          if (!obj[key] || typeof obj[key] !== 'object' || Array.isArray(obj[key])) {
            obj[key] = {};
          }
          deepUpdate(obj[key], updateValue);
        } else {
          // For primitive values or arrays, set directly
          obj[key] = updateValue;
        }
      });
    };
    
    // Update settings with deep merge
    deepUpdate(userSettings, updates);
    
    // Mark all updated paths as modified for Mongoose
    Object.keys(updates).forEach(key => {
      userSettings.markModified(key);
    });
    
    await userSettings.save();
    
    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      data: userSettings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
};

// Update specific setting category
const updateUserSettingsCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { category } = req.params;
    const updates = req.body;
    
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    // Validate category exists
    if (!userSettings[category]) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}`
      });
    }
    
    await userSettings.updateCategory(category, updates);
    
    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: userSettings[category]
    });
  } catch (error) {
    console.error('Error updating user settings category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings category',
      error: error.message
    });
  }
};

// Reset user settings to defaults
const resetUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings()
      });
    } else {
      await userSettings.resetToDefaults();
    }
    
    await userSettings.save();
    
    res.status(200).json({
      success: true,
      message: 'User settings reset to defaults successfully',
      data: userSettings
    });
  } catch (error) {
    console.error('Error resetting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user settings',
      error: error.message
    });
  }
};

// Delete user settings
const deleteUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userSettings = await UserSettings.findOneAndDelete({ userId });
    
    if (!userSettings) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User settings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user settings',
      error: error.message
    });
  }
};

// App Settings Controllers

// Get app settings (admin only)
const getAppSettings = async (req, res) => {
  try {
    // Check if user is admin
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const appSettings = await AppSettings.getCurrentSettings();
    
    res.status(200).json({
      success: true,
      data: appSettings
    });
  } catch (error) {
    console.error('Error getting app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get app settings',
      error: error.message
    });
  }
};

// Update app settings (admin only)
const updateAppSettings = async (req, res) => {
  try {
    // Check if user is admin
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updates = req.body;
    const appSettings = await AppSettings.updateAppSettings(updates);
    
    // Invalidate cache when settings are updated
    invalidatePublicSettingsCache();
    
    res.status(200).json({
      success: true,
      message: 'App settings updated successfully',
      data: appSettings
    });
  } catch (error) {
    console.error('Error updating app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app settings',
      error: error.message
    });
  }
};

// Update specific app setting category (admin only)
const updateAppSettingsCategory = async (req, res) => {
  try {
    // Check if user is admin
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { category } = req.params;
    const updates = req.body;
    
    const appSettings = await AppSettings.getCurrentSettings();
    
    // Validate category exists
    if (!appSettings[category]) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}`
      });
    }
    
    await appSettings.updateCategory(category, updates);
    
    // Invalidate cache when settings are updated
    invalidatePublicSettingsCache();
    
    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: appSettings[category]
    });
  } catch (error) {
    console.error('Error updating app settings category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app settings category',
      error: error.message
    });
  }
};

// Helper function to create a timeout promise
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

// Helper function to get default public settings
const getDefaultPublicSettings = () => ({
  general: {
    appName: process.env.APP_NAME || 'LocalPro',
    appVersion: process.env.APP_VERSION || '1.0.0',
    maintenanceMode: false
  },
  business: {
    companyName: process.env.COMPANY_NAME || 'LocalPro',
    supportChannels: {
      email: process.env.SUPPORT_EMAIL || 'support@localpro.com',
      phone: process.env.SUPPORT_PHONE || null
    }
  },
  features: {
    marketplace: { enabled: true },
    academy: { enabled: true },
    jobBoard: { enabled: true },
    referrals: { enabled: true },
    payments: { enabled: true },
    analytics: { enabled: true }
  },
  uploads: {
    maxFileSize: 5242880, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword'],
    maxImagesPerUpload: 5
  },
  payments: {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'PHP'],
    minimumPayout: 10
  }
});

// Get public app settings (no auth required)
const getPublicAppSettings = async (req, res) => {
  const startTime = Date.now();
  const TIMEOUT_MS = 5000; // 5 second timeout
  
  try {
    // Check cache first
    if (isCacheValid()) {
      const duration = Date.now() - startTime;
      logger.debug('Public app settings served from cache', {
        duration,
        endpoint: '/api/settings/app/public'
      });
      return res.status(200).json({
        success: true,
        data: publicSettingsCache.data,
        cached: true,
        fallback: false
      });
    }

    // Check database connection first
    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      logger.warn('Database not connected, returning default settings', {
        readyState: mongoose.connection?.readyState
      });
      const defaultSettings = getDefaultPublicSettings();
      // Cache the defaults
      publicSettingsCache.data = defaultSettings;
      publicSettingsCache.timestamp = Date.now();
      
      return res.status(200).json({
        success: true,
        data: defaultSettings,
        cached: false,
        fallback: true
      });
    }

    // Race between the database query and timeout
    const appSettings = await Promise.race([
      AppSettings.getCurrentSettings(),
      createTimeout(TIMEOUT_MS)
    ]);
    
    // Only return public settings
    const publicSettings = {
      general: {
        appName: appSettings.general?.appName || process.env.APP_NAME || 'LocalPro',
        appVersion: appSettings.general?.appVersion || process.env.APP_VERSION || '1.0.0',
        maintenanceMode: appSettings.general?.maintenanceMode || false
      },
      business: {
        companyName: appSettings.business?.companyName || process.env.COMPANY_NAME || 'LocalPro',
        supportChannels: appSettings.business?.supportChannels || {
          email: process.env.SUPPORT_EMAIL || 'support@localpro.com',
          phone: process.env.SUPPORT_PHONE || null
        }
      },
      features: appSettings.features || getDefaultPublicSettings().features,
      uploads: {
        maxFileSize: appSettings.uploads?.maxFileSize || 5242880,
        allowedImageTypes: appSettings.uploads?.allowedImageTypes || ['image/jpeg', 'image/png', 'image/webp'],
        allowedDocumentTypes: appSettings.uploads?.allowedDocumentTypes || ['application/pdf', 'application/msword'],
        maxImagesPerUpload: appSettings.uploads?.maxImagesPerUpload || 5
      },
      payments: {
        defaultCurrency: appSettings.payments?.defaultCurrency || 'USD',
        supportedCurrencies: appSettings.payments?.supportedCurrencies || ['USD', 'PHP'],
        minimumPayout: appSettings.payments?.minimumPayout || 10
      }
    };
    
    const duration = Date.now() - startTime;
    logger.info('Public app settings retrieved successfully', {
      duration,
      endpoint: '/api/settings/app/public'
    });
    
    // Update cache
    publicSettingsCache.data = publicSettings;
    publicSettingsCache.timestamp = Date.now();
    
    res.status(200).json({
      success: true,
      data: publicSettings,
      cached: false,
      fallback: false
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Check if it's a timeout error
    if (error.message === 'Request timeout' || error.name === 'MongoServerSelectionError') {
      logger.warn('Public app settings request timed out or database unavailable, returning defaults', {
        error: error.message,
        duration,
        endpoint: '/api/settings/app/public'
      });
      
      // Try to use cached data if available, otherwise use defaults
      const fallbackData = publicSettingsCache.data || getDefaultPublicSettings();
      
      return res.status(200).json({
        success: true,
        data: fallbackData,
        cached: !!publicSettingsCache.data,
        fallback: true,
        warning: 'Using cached/default settings due to database timeout'
      });
    }
    
    logger.error('Error getting public app settings', {
      error: error.message,
      stack: error.stack,
      duration,
      endpoint: '/api/settings/app/public'
    });
    
    // On any other error, try cached data first, then defaults
    const fallbackData = publicSettingsCache.data || getDefaultPublicSettings();
    
    res.status(200).json({
      success: true,
      data: fallbackData,
      cached: !!publicSettingsCache.data,
      fallback: true,
      warning: 'Using cached/default settings due to error'
    });
  }
};

// Toggle feature flag (admin only)
const toggleFeatureFlag = async (req, res) => {
  try {
    // Check if user is admin
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { feature, enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled must be a boolean value'
      });
    }
    
    const appSettings = await AppSettings.getCurrentSettings();
    
    // Find and update the feature flag
    const featurePath = `features.${feature}.enabled`;
    await appSettings.setSetting(featurePath, enabled);
    
    // Invalidate cache when settings are updated
    invalidatePublicSettingsCache();
    
    res.status(200).json({
      success: true,
      message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        feature,
        enabled
      }
    });
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle feature flag',
      error: error.message
    });
  }
};

// Get app health status
const getAppHealth = async (req, res) => {
  try {
    const appSettings = await AppSettings.getCurrentSettings();
    
    const health = {
      status: appSettings.general.maintenanceMode.enabled ? 'maintenance' : 'healthy',
      version: appSettings.general.appVersion,
      environment: appSettings.general.environment,
      maintenanceMode: appSettings.general.maintenanceMode,
      features: Object.keys(appSettings.features).reduce((acc, key) => {
        acc[key] = appSettings.features[key].enabled;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting app health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get app health',
      error: error.message
    });
  }
};

module.exports = {
  // User Settings
  getUserSettings,
  updateUserSettings,
  updateUserSettingsCategory,
  resetUserSettings,
  deleteUserSettings,
  
  // App Settings
  getAppSettings,
  updateAppSettings,
  updateAppSettingsCategory,
  getPublicAppSettings,
  toggleFeatureFlag,
  getAppHealth
};
