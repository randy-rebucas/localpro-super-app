# User Settings Usage Examples

## Overview

This document provides practical examples of how to use the User Settings API in various scenarios. These examples demonstrate common patterns and best practices for implementing user settings functionality in your application.

## Frontend Integration

### React Hook for User Settings

```javascript
import { useState, useEffect, useCallback } from 'react';

const useUserSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user settings
  const updateSettings = useCallback(async (updates) => {
    try {
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      const data = await response.json();
      setSettings(data.data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update specific category
  const updateCategory = useCallback(async (category, updates) => {
    try {
      const response = await fetch(`/api/settings/user/${category}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ${category} settings`);
      }
      
      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        [category]: data.data
      }));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/user/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }
      
      const data = await response.json();
      setSettings(data.data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateCategory,
    resetSettings,
    refetch: fetchSettings
  };
};

export default useUserSettings;
```

### Settings Component Example

```javascript
import React, { useState } from 'react';
import useUserSettings from '../hooks/useUserSettings';

const SettingsPage = () => {
  const { settings, loading, error, updateCategory } = useUserSettings();
  const [saving, setSaving] = useState(false);

  const handlePrivacyUpdate = async (privacySettings) => {
    try {
      setSaving(true);
      await updateCategory('privacy', privacySettings);
      // Show success message
    } catch (err) {
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (notificationSettings) => {
    try {
      setSaving(true);
      await updateCategory('notifications', notificationSettings);
      // Show success message
    } catch (err) {
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!settings) return <div>No settings found</div>;

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      {/* Privacy Settings */}
      <section className="settings-section">
        <h2>Privacy Settings</h2>
        <PrivacySettings
          settings={settings.privacy}
          onUpdate={handlePrivacyUpdate}
          saving={saving}
        />
      </section>

      {/* Notification Settings */}
      <section className="settings-section">
        <h2>Notification Settings</h2>
        <NotificationSettings
          settings={settings.notifications}
          onUpdate={handleNotificationUpdate}
          saving={saving}
        />
      </section>

      {/* Other settings sections... */}
    </div>
  );
};

export default SettingsPage;
```

### Privacy Settings Component

```javascript
import React, { useState } from 'react';

const PrivacySettings = ({ settings, onUpdate, saving }) => {
  const [formData, setFormData] = useState(settings);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="privacy-settings">
      <div className="form-group">
        <label>Profile Visibility</label>
        <select
          value={formData.profileVisibility}
          onChange={(e) => handleChange('profileVisibility', e.target.value)}
        >
          <option value="public">Public</option>
          <option value="contacts_only">Contacts Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.showPhoneNumber}
            onChange={(e) => handleChange('showPhoneNumber', e.target.checked)}
          />
          Show Phone Number
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.showEmail}
            onChange={(e) => handleChange('showEmail', e.target.checked)}
          />
          Show Email Address
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.allowDirectMessages}
            onChange={(e) => handleChange('allowDirectMessages', e.target.checked)}
          />
          Allow Direct Messages
        </label>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Privacy Settings'}
      </button>
    </form>
  );
};

export default PrivacySettings;
```

### Notification Settings Component

```javascript
import React, { useState } from 'react';

const NotificationSettings = ({ settings, onUpdate, saving }) => {
  const [formData, setFormData] = useState(settings);

  const handleChange = (channel, field, value) => {
    setFormData(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="notification-settings">
      {/* Push Notifications */}
      <div className="notification-channel">
        <h3>Push Notifications</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.push.enabled}
              onChange={(e) => handleChange('push', 'enabled', e.target.checked)}
            />
            Enable Push Notifications
          </label>
        </div>
        
        {formData.push.enabled && (
          <>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.push.newMessages}
                  onChange={(e) => handleChange('push', 'newMessages', e.target.checked)}
                />
                New Messages
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.push.jobMatches}
                  onChange={(e) => handleChange('push', 'jobMatches', e.target.checked)}
                />
                Job Matches
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.push.marketing}
                  onChange={(e) => handleChange('push', 'marketing', e.target.checked)}
                />
                Marketing Communications
              </label>
            </div>
          </>
        )}
      </div>

      {/* Email Notifications */}
      <div className="notification-channel">
        <h3>Email Notifications</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.email.enabled}
              onChange={(e) => handleChange('email', 'enabled', e.target.checked)}
            />
            Enable Email Notifications
          </label>
        </div>
        
        {formData.email.enabled && (
          <>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.email.weeklyDigest}
                  onChange={(e) => handleChange('email', 'weeklyDigest', e.target.checked)}
                />
                Weekly Digest
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.email.monthlyReport}
                  onChange={(e) => handleChange('email', 'monthlyReport', e.target.checked)}
                />
                Monthly Report
              </label>
            </div>
          </>
        )}
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Notification Settings'}
      </button>
    </form>
  );
};

export default NotificationSettings;
```

## Backend Integration

### Settings Service Class

```javascript
class SettingsService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // User Settings Methods
  async getUserSettings() {
    const response = await this.apiClient.get('/api/settings/user');
    return response.data;
  }

  async updateUserSettings(updates) {
    const response = await this.apiClient.put('/api/settings/user', updates);
    return response.data;
  }

  async updateUserSettingsCategory(category, updates) {
    const response = await this.apiClient.put(`/api/settings/user/${category}`, updates);
    return response.data;
  }

  async resetUserSettings() {
    const response = await this.apiClient.post('/api/settings/user/reset');
    return response.data;
  }

  async deleteUserSettings() {
    const response = await this.apiClient.delete('/api/settings/user');
    return response.data;
  }

  // App Settings Methods (Admin)
  async getAppSettings() {
    const response = await this.apiClient.get('/api/settings/app');
    return response.data;
  }

  async updateAppSettings(updates) {
    const response = await this.apiClient.put('/api/settings/app', updates);
    return response.data;
  }

  async updateAppSettingsCategory(category, updates) {
    const response = await this.apiClient.put(`/api/settings/app/${category}`, updates);
    return response.data;
  }

  async toggleFeatureFlag(feature, enabled) {
    const response = await this.apiClient.post('/api/settings/app/features/toggle', {
      feature,
      enabled
    });
    return response.data;
  }

  // Public Methods
  async getPublicAppSettings() {
    const response = await this.apiClient.get('/api/settings');
    return response.data;
  }

  async getAppHealth() {
    const response = await this.apiClient.get('/api/settings/app/health');
    return response.data;
  }
}

export default SettingsService;
```

### Settings Controller Implementation

```javascript
import SettingsService from '../services/SettingsService';

class SettingsController {
  constructor() {
    this.settingsService = new SettingsService();
  }

  // User Settings Controllers
  async getUserSettings(req, res) {
    try {
      const settings = await this.settingsService.getUserSettings();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user settings',
        error: error.message
      });
    }
  }

  async updateUserSettings(req, res) {
    try {
      const { userId } = req.user;
      const updates = req.body;
      
      // Validate updates
      const validationResult = this.validateUserSettings(updates);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: validationResult.errors
        });
      }

      const settings = await this.settingsService.updateUserSettings(updates);
      res.json({
        success: true,
        message: 'User settings updated successfully',
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user settings',
        error: error.message
      });
    }
  }

  async updateUserSettingsCategory(req, res) {
    try {
      const { category } = req.params;
      const updates = req.body;
      
      // Validate category
      const validCategories = ['privacy', 'notifications', 'communication', 'service', 'payment', 'security', 'app', 'analytics'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category: ${category}`
        });
      }

      const settings = await this.settingsService.updateUserSettingsCategory(category, updates);
      res.json({
        success: true,
        message: `${category} settings updated successfully`,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user settings category',
        error: error.message
      });
    }
  }

  // Validation helper
  validateUserSettings(updates) {
    const errors = [];
    
    // Privacy validation
    if (updates.privacy) {
      if (updates.privacy.profileVisibility && !['public', 'contacts_only', 'private'].includes(updates.privacy.profileVisibility)) {
        errors.push({
          field: 'privacy.profileVisibility',
          message: 'Profile visibility must be one of: public, contacts_only, private'
        });
      }
    }

    // Notification validation
    if (updates.notifications) {
      if (updates.notifications.push && typeof updates.notifications.push.enabled !== 'boolean') {
        errors.push({
          field: 'notifications.push.enabled',
          message: 'Push notifications enabled must be a boolean'
        });
      }
    }

    // Communication validation
    if (updates.communication) {
      if (updates.communication.preferredLanguage && !['en', 'fil', 'es', 'zh', 'ja', 'ko'].includes(updates.communication.preferredLanguage)) {
        errors.push({
          field: 'communication.preferredLanguage',
          message: 'Preferred language must be one of: en, fil, es, zh, ja, ko'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default SettingsController;
```

## Mobile App Integration

### React Native Settings Hook

```javascript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://api.localpro.com/api/settings/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://api.localpro.com/api/settings/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data.data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error updating settings:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
};

export default useUserSettings;
```

### Settings Screen Component

```javascript
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import useUserSettings from '../hooks/useUserSettings';

const SettingsScreen = () => {
  const { settings, loading, error, updateSettings } = useUserSettings();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (category, field, value) => {
    try {
      setSaving(true);
      await updateSettings({
        [category]: {
          ...settings[category],
          [field]: value
        }
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        <Text>No settings found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingRow}>
          <Text>Show Phone Number</Text>
          <Switch
            value={settings.privacy.showPhoneNumber}
            onValueChange={(value) => handleToggle('privacy', 'showPhoneNumber', value)}
            disabled={saving}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text>Show Email</Text>
          <Switch
            value={settings.privacy.showEmail}
            onValueChange={(value) => handleToggle('privacy', 'showEmail', value)}
            disabled={saving}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text>Allow Direct Messages</Text>
          <Switch
            value={settings.privacy.allowDirectMessages}
            onValueChange={(value) => handleToggle('privacy', 'allowDirectMessages', value)}
            disabled={saving}
          />
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <Text>Push Notifications</Text>
          <Switch
            value={settings.notifications.push.enabled}
            onValueChange={(value) => handleToggle('notifications', 'push', { ...settings.notifications.push, enabled: value })}
            disabled={saving}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text>Email Notifications</Text>
          <Switch
            value={settings.notifications.email.enabled}
            onValueChange={(value) => handleToggle('notifications', 'email', { ...settings.notifications.email, enabled: value })}
            disabled={saving}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text>SMS Notifications</Text>
          <Switch
            value={settings.notifications.sms.enabled}
            onValueChange={(value) => handleToggle('notifications', 'sms', { ...settings.notifications.sms, enabled: value })}
            disabled={saving}
          />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        
        <View style={styles.settingRow}>
          <Text>Sound Effects</Text>
          <Switch
            value={settings.app.soundEffects.enabled}
            onValueChange={(value) => handleToggle('app', 'soundEffects', { ...settings.app.soundEffects, enabled: value })}
            disabled={saving}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text>Haptic Feedback</Text>
          <Switch
            value={settings.app.hapticFeedback.enabled}
            onValueChange={(value) => handleToggle('app', 'hapticFeedback', { ...settings.app.hapticFeedback, enabled: value })}
            disabled={saving}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  }
});

export default SettingsScreen;
```

## Admin Panel Integration

### Admin Settings Management

```javascript
import React, { useState, useEffect } from 'react';
import useUserSettings from '../hooks/useUserSettings';

const AdminSettingsPanel = () => {
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppSettings();
  }, []);

  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/app', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch app settings');
      }
      
      const data = await response.json();
      setAppSettings(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppSettings = async (updates) => {
    try {
      const response = await fetch('/api/settings/app', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update app settings');
      }
      
      const data = await response.json();
      setAppSettings(data.data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleFeatureFlag = async (feature, enabled) => {
    try {
      const response = await fetch('/api/settings/app/features/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feature, enabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle feature flag');
      }
      
      const data = await response.json();
      await fetchAppSettings(); // Refresh settings
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  if (loading) return <div>Loading app settings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!appSettings) return <div>No app settings found</div>;

  return (
    <div className="admin-settings-panel">
      <h1>App Settings Management</h1>
      
      {/* General Settings */}
      <section className="settings-section">
        <h2>General Settings</h2>
        <GeneralSettings
          settings={appSettings.general}
          onUpdate={(updates) => updateAppSettings({ general: updates })}
        />
      </section>

      {/* Feature Flags */}
      <section className="settings-section">
        <h2>Feature Flags</h2>
        <FeatureFlags
          features={appSettings.features}
          onToggle={toggleFeatureFlag}
        />
      </section>

      {/* Business Settings */}
      <section className="settings-section">
        <h2>Business Settings</h2>
        <BusinessSettings
          settings={appSettings.business}
          onUpdate={(updates) => updateAppSettings({ business: updates })}
        />
      </section>

      {/* Security Settings */}
      <section className="settings-section">
        <h2>Security Settings</h2>
        <SecuritySettings
          settings={appSettings.security}
          onUpdate={(updates) => updateAppSettings({ security: updates })}
        />
      </section>
    </div>
  );
};

export default AdminSettingsPanel;
```

### Feature Flags Component

```javascript
import React, { useState } from 'react';

const FeatureFlags = ({ features, onToggle }) => {
  const [toggling, setToggling] = useState({});

  const handleToggle = async (feature, enabled) => {
    try {
      setToggling(prev => ({ ...prev, [feature]: true }));
      await onToggle(feature, enabled);
    } catch (error) {
      console.error('Error toggling feature:', error);
    } finally {
      setToggling(prev => ({ ...prev, [feature]: false }));
    }
  };

  const renderFeature = (featureName, feature) => {
    if (typeof feature === 'object' && feature.enabled !== undefined) {
      return (
        <div key={featureName} className="feature-flag">
          <div className="feature-info">
            <h3>{featureName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
            <p>Enable/disable the {featureName} feature</p>
          </div>
          <div className="feature-controls">
            <label className="switch">
              <input
                type="checkbox"
                checked={feature.enabled}
                onChange={(e) => handleToggle(`${featureName}.enabled`, e.target.checked)}
                disabled={toggling[`${featureName}.enabled`]}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      );
    }

    return (
      <div key={featureName} className="feature-group">
        <h3>{featureName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
        {Object.entries(feature).map(([subFeature, subFeatureData]) => (
          <div key={subFeature} className="sub-feature">
            {renderFeature(`${featureName}.${subFeature}`, subFeatureData)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="feature-flags">
      {Object.entries(features).map(([featureName, feature]) => (
        renderFeature(featureName, feature)
      ))}
    </div>
  );
};

export default FeatureFlags;
```

## Testing Examples

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import useUserSettings from '../hooks/useUserSettings';

// Mock the hook
jest.mock('../hooks/useUserSettings');

describe('SettingsPage', () => {
  const mockUpdateCategory = jest.fn();
  const mockSettings = {
    privacy: {
      profileVisibility: 'public',
      showPhoneNumber: false,
      allowDirectMessages: true
    },
    notifications: {
      push: {
        enabled: true,
        marketing: false
      }
    }
  };

  beforeEach(() => {
    useUserSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null,
      updateCategory: mockUpdateCategory
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings page correctly', () => {
    render(<SettingsPage />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  it('updates privacy settings when form is submitted', async () => {
    render(<SettingsPage />);
    
    const profileVisibilitySelect = screen.getByDisplayValue('public');
    fireEvent.change(profileVisibilitySelect, { target: { value: 'private' } });
    
    const saveButton = screen.getByText('Save Privacy Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith('privacy', {
        profileVisibility: 'private',
        showPhoneNumber: false,
        allowDirectMessages: true
      });
    });
  });

  it('handles update errors gracefully', async () => {
    const mockError = new Error('Update failed');
    mockUpdateCategory.mockRejectedValue(mockError);
    
    render(<SettingsPage />);
    
    const saveButton = screen.getByText('Save Privacy Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../app';
import UserSettings from '../models/UserSettings';

describe('User Settings API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Setup test user and get auth token
    const user = await createTestUser();
    userId = user._id;
    authToken = await getAuthToken(user);
  });

  afterAll(async () => {
    // Cleanup test data
    await UserSettings.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
  });

  describe('GET /api/settings/user', () => {
    it('should return user settings', async () => {
      const response = await request(app)
        .get('/api/settings/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('privacy');
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('communication');
    });

    it('should create default settings if none exist', async () => {
      // Delete existing settings
      await UserSettings.deleteOne({ userId });
      
      const response = await request(app)
        .get('/api/settings/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('privacy');
    });
  });

  describe('PUT /api/settings/user', () => {
    it('should update user settings', async () => {
      const updates = {
        privacy: {
          profileVisibility: 'private',
          showPhoneNumber: true
        }
      };

      const response = await request(app)
        .put('/api/settings/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.privacy.profileVisibility).toBe('private');
      expect(response.body.data.privacy.showPhoneNumber).toBe(true);
    });

    it('should validate input data', async () => {
      const invalidUpdates = {
        privacy: {
          profileVisibility: 'invalid_value'
        }
      };

      const response = await request(app)
        .put('/api/settings/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/settings/user/:category', () => {
    it('should update specific category', async () => {
      const updates = {
        profileVisibility: 'public',
        showPhoneNumber: false
      };

      const response = await request(app)
        .put('/api/settings/user/privacy')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileVisibility).toBe('public');
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .put('/api/settings/user/invalid_category')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid category');
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useUserSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery(
    'userSettings',
    async () => {
      const response = await fetch('/api/settings/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000
    }
  );

  const updateSettingsMutation = useMutation(
    async (updates) => {
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return response.json();
    },
    {
      onSuccess: (data) => {
        // Update cache with new data
        queryClient.setQueryData('userSettings', data);
      },
      onError: (error) => {
        console.error('Error updating settings:', error);
      }
    }
  );

  const updateCategoryMutation = useMutation(
    async ({ category, updates }) => {
      const response = await fetch(`/api/settings/user/${category}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ${category} settings`);
      }
      
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update cache with new category data
        queryClient.setQueryData('userSettings', (oldData) => ({
          ...oldData,
          [variables.category]: data.data
        }));
      }
    }
  );

  return {
    settings: settings?.data,
    loading: isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    isUpdating: updateSettingsMutation.isLoading || updateCategoryMutation.isLoading
  };
};

export default useUserSettings;
```

These examples demonstrate comprehensive usage patterns for the User Settings API across different platforms and scenarios. They show how to implement user settings functionality in web applications, mobile apps, and admin panels, with proper error handling, validation, and performance optimization.
