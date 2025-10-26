const UserSettings = require('../models/UserSettings');
const AppSettings = require('../models/AppSettings');
const logger = require('../utils/logger');

const { validationResult } = require('express-validator');

// User Settings Controllers

// Get user settings
const getUserSettings = async(req, res) => {
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
    logger.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings',
      error: error.message
    });
  }
};

// Update user settings
const updateUserSettings = async(req, res) => {
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

    // Update settings
    Object.keys(updates).forEach(key => {
      if (userSettings[key] && typeof userSettings[key] === 'object') {
        Object.assign(userSettings[key], updates[key]);
      } else {
        userSettings[key] = updates[key];
      }
    });

    await userSettings.save();

    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      data: userSettings
    });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
};

// Update specific setting category
const updateUserSettingsCategory = async(req, res) => {
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
    logger.error('Error updating user settings category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings category',
      error: error.message
    });
  }
};

// Reset user settings to defaults
const resetUserSettings = async(req, res) => {
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
    logger.error('Error resetting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user settings',
      error: error.message
    });
  }
};

// Delete user settings
const deleteUserSettings = async(req, res) => {
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
    logger.error('Error deleting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user settings',
      error: error.message
    });
  }
};

// App Settings Controllers

// Get app settings (admin only)
const getAppSettings = async(req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
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
    logger.error('Error getting app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get app settings',
      error: error.message
    });
  }
};

// Update app settings (admin only)
const updateAppSettings = async(req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
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

    res.status(200).json({
      success: true,
      message: 'App settings updated successfully',
      data: appSettings
    });
  } catch (error) {
    logger.error('Error updating app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app settings',
      error: error.message
    });
  }
};

// Update specific app setting category (admin only)
const updateAppSettingsCategory = async(req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
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

    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: appSettings[category]
    });
  } catch (error) {
    logger.error('Error updating app settings category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app settings category',
      error: error.message
    });
  }
};

// Get public app settings (no auth required)
const getPublicAppSettings = async(req, res) => {
  try {
    const appSettings = await AppSettings.getCurrentSettings();

    // Only return public settings
    const publicSettings = {
      general: {
        appName: appSettings.general.appName,
        appVersion: appSettings.general.appVersion,
        maintenanceMode: appSettings.general.maintenanceMode
      },
      business: {
        companyName: appSettings.business.companyName,
        supportChannels: appSettings.business.supportChannels
      },
      features: appSettings.features,
      uploads: {
        maxFileSize: appSettings.uploads.maxFileSize,
        allowedImageTypes: appSettings.uploads.allowedImageTypes,
        allowedDocumentTypes: appSettings.uploads.allowedDocumentTypes,
        maxImagesPerUpload: appSettings.uploads.maxImagesPerUpload
      },
      payments: {
        defaultCurrency: appSettings.payments.defaultCurrency,
        supportedCurrencies: appSettings.payments.supportedCurrencies,
        minimumPayout: appSettings.payments.minimumPayout
      }
    };

    res.status(200).json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    logger.error('Error getting public app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public app settings',
      error: error.message
    });
  }
};

// Toggle feature flag (admin only)
const toggleFeatureFlag = async(req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
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

    res.status(200).json({
      success: true,
      message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        feature,
        enabled
      }
    });
  } catch (error) {
    logger.error('Error toggling feature flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle feature flag',
      error: error.message
    });
  }
};

// Get app health status
const getAppHealth = async(req, res) => {
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
    logger.error('Error getting app health:', error);
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
