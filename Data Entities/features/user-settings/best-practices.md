# User Settings Best Practices

## Overview

This document outlines best practices for implementing and managing user settings in the LocalPro Super App. These practices ensure optimal performance, security, and user experience.

## Data Management

### 1. Settings Initialization

**Always initialize settings with defaults:**
```javascript
// Good: Initialize with defaults
const getUserSettings = async (userId) => {
  let settings = await UserSettings.findOne({ userId });
  
  if (!settings) {
    settings = new UserSettings({
      userId,
      ...UserSettings.getDefaultSettings()
    });
    await settings.save();
  }
  
  return settings;
};

// Bad: Return null if no settings exist
const getUserSettings = async (userId) => {
  return await UserSettings.findOne({ userId });
};
```

**Use category-based updates for better performance:**
```javascript
// Good: Update specific category
await userSettings.updateCategory('privacy', {
  profileVisibility: 'private',
  showPhoneNumber: false
});

// Bad: Update entire settings object
await userSettings.updateSettings({
  privacy: { /* ... */ },
  notifications: { /* ... */ },
  // ... all other categories
});
```

### 2. Validation and Sanitization

**Implement comprehensive validation:**
```javascript
const validateUserSettings = (updates) => {
  const errors = [];
  
  // Privacy validation
  if (updates.privacy) {
    if (updates.privacy.profileVisibility && 
        !['public', 'contacts_only', 'private'].includes(updates.privacy.profileVisibility)) {
      errors.push({
        field: 'privacy.profileVisibility',
        message: 'Invalid profile visibility value'
      });
    }
  }
  
  // Notification validation
  if (updates.notifications) {
    Object.keys(updates.notifications).forEach(channel => {
      if (updates.notifications[channel] && typeof updates.notifications[channel] === 'object') {
        Object.keys(updates.notifications[channel]).forEach(setting => {
          if (typeof updates.notifications[channel][setting] !== 'boolean') {
            errors.push({
              field: `notifications.${channel}.${setting}`,
              message: 'Notification setting must be boolean'
            });
          }
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

**Sanitize input data:**
```javascript
const sanitizeUserSettings = (updates) => {
  const sanitized = {};
  
  // Only allow known categories
  const allowedCategories = ['privacy', 'notifications', 'communication', 'service', 'payment', 'security', 'app', 'analytics'];
  
  Object.keys(updates).forEach(category => {
    if (allowedCategories.includes(category)) {
      sanitized[category] = updates[category];
    }
  });
  
  return sanitized;
};
```

### 3. Error Handling

**Implement comprehensive error handling:**
```javascript
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Validate input
    const validation = validateUserSettings(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validation.errors
      });
    }
    
    // Sanitize input
    const sanitizedUpdates = sanitizeUserSettings(updates);
    
    // Update settings
    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: sanitizedUpdates },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data type',
        field: error.path
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

## Security Best Practices

### 1. Authentication and Authorization

**Always verify user authentication:**
```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};
```

**Implement role-based access control:**
```javascript
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient privileges.'
      });
    }
    
    next();
  };
};

// Usage
router.get('/app', auth, authorize(['admin']), getAppSettings);
```

### 2. Input Validation

**Use express-validator for comprehensive validation:**
```javascript
const { body, validationResult } = require('express-validator');

const validateUserSettings = [
  body('privacy.profileVisibility')
    .optional()
    .isIn(['public', 'contacts_only', 'private'])
    .withMessage('Profile visibility must be one of: public, contacts_only, private'),
  
  body('privacy.showPhoneNumber')
    .optional()
    .isBoolean()
    .withMessage('Show phone number must be a boolean'),
  
  body('notifications.push.enabled')
    .optional()
    .isBoolean()
    .withMessage('Push notifications enabled must be a boolean'),
  
  body('communication.preferredLanguage')
    .optional()
    .isIn(['en', 'fil', 'es', 'zh', 'ja', 'ko'])
    .withMessage('Preferred language must be supported'),
  
  body('service.defaultServiceRadius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Service radius must be between 1 and 100 kilometers'),
  
  body('payment.preferredPaymentMethod')
    .optional()
    .isIn(['paypal', 'paymaya', 'gcash', 'bank_transfer', 'cash'])
    .withMessage('Payment method must be supported'),
  
  body('security.sessionTimeout')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Session timeout must be between 1 and 168 hours')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};
```

### 3. Data Protection

**Encrypt sensitive settings:**
```javascript
const crypto = require('crypto');

const encryptSensitiveData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('user-settings', 'utf8'));
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decryptSensitiveData = (encryptedData) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('user-settings', 'utf8'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};
```

## Performance Optimization

### 1. Caching Strategy

**Implement Redis caching for frequently accessed settings:**
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const getCachedSettings = async (userId) => {
  try {
    const cached = await client.get(`user_settings:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis error:', error);
    return null;
  }
};

const setCachedSettings = async (userId, settings) => {
  try {
    await client.setex(`user_settings:${userId}`, 3600, JSON.stringify(settings)); // 1 hour TTL
  } catch (error) {
    console.error('Redis error:', error);
  }
};

const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Try cache first
    let settings = await getCachedSettings(userId);
    
    if (!settings) {
      // Fallback to database
      settings = await UserSettings.findOne({ userId });
      
      if (!settings) {
        settings = new UserSettings({
          userId,
          ...UserSettings.getDefaultSettings()
        });
        await settings.save();
      }
      
      // Cache the result
      await setCachedSettings(userId, settings);
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings'
    });
  }
};
```

### 2. Database Optimization

**Use proper indexing:**
```javascript
// UserSettings indexes
userSettingsSchema.index({ userId: 1 }, { unique: true });
userSettingsSchema.index({ 'privacy.profileVisibility': 1 });
userSettingsSchema.index({ 'notifications.push.enabled': 1 });
userSettingsSchema.index({ 'communication.preferredLanguage': 1 });

// AppSettings indexes
appSettingsSchema.index({ 'general.environment': 1 });
appSettingsSchema.index({ 'features.marketplace.enabled': 1 });
```

**Use lean queries for read-only operations:**
```javascript
// Good: Use lean() for better performance
const settings = await UserSettings.findOne({ userId })
  .lean()
  .select('privacy notifications communication');

// Bad: Full document with all methods
const settings = await UserSettings.findOne({ userId });
```

### 3. Batch Operations

**Implement batch updates for multiple users:**
```javascript
const updateMultipleUserSettings = async (updates) => {
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { userId: update.userId },
      update: { $set: update.settings },
      upsert: true
    }
  }));
  
  return await UserSettings.bulkWrite(bulkOps);
};
```

## Frontend Best Practices

### 1. State Management

**Use proper state management patterns:**
```javascript
// Good: Use React Query for server state
const useUserSettings = () => {
  return useQuery(
    'userSettings',
    fetchUserSettings,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000
    }
  );
};

// Good: Use optimistic updates
const updateSettings = useMutation(
  updateUserSettings,
  {
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries('userSettings');
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData('userSettings');
      
      // Optimistically update
      queryClient.setQueryData('userSettings', old => ({
        ...old,
        ...newSettings
      }));
      
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      queryClient.setQueryData('userSettings', context.previousSettings);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries('userSettings');
    }
  }
);
```

### 2. Form Handling

**Implement proper form validation:**
```javascript
const useSettingsForm = (initialSettings) => {
  const [formData, setFormData] = useState(initialSettings);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (field, value) => {
    const fieldErrors = [];
    
    switch (field) {
      case 'privacy.profileVisibility':
        if (!['public', 'contacts_only', 'private'].includes(value)) {
          fieldErrors.push('Invalid profile visibility');
        }
        break;
      case 'service.defaultServiceRadius':
        if (value < 1 || value > 100) {
          fieldErrors.push('Service radius must be between 1 and 100');
        }
        break;
      // Add more validation rules
    }
    
    return fieldErrors;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate field
    const fieldErrors = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const isFieldValid = (field) => {
    return !errors[field] || errors[field].length === 0;
  };

  const isFieldTouched = (field) => {
    return touched[field] || false;
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    isFieldValid,
    isFieldTouched,
    setFormData
  };
};
```

### 3. Error Handling

**Implement comprehensive error handling:**
```javascript
const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    console.error('Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          setError({
            type: 'validation',
            message: data.message,
            errors: data.errors
          });
          break;
        case 401:
          setError({
            type: 'authentication',
            message: 'Please log in again'
          });
          break;
        case 403:
          setError({
            type: 'authorization',
            message: 'You do not have permission to perform this action'
          });
          break;
        case 500:
          setError({
            type: 'server',
            message: 'Server error. Please try again later.'
          });
          break;
        default:
          setError({
            type: 'unknown',
            message: 'An unexpected error occurred'
          });
      }
    } else if (error.request) {
      // Network error
      setError({
        type: 'network',
        message: 'Network error. Please check your connection.'
      });
    } else {
      // Other error
      setError({
        type: 'unknown',
        message: 'An unexpected error occurred'
      });
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    clearError
  };
};
```

## Testing Best Practices

### 1. Unit Testing

**Test individual functions:**
```javascript
describe('UserSettings Model', () => {
  describe('getDefaultSettings', () => {
    it('should return complete default settings', () => {
      const defaults = UserSettings.getDefaultSettings();
      
      expect(defaults).toHaveProperty('privacy');
      expect(defaults).toHaveProperty('notifications');
      expect(defaults).toHaveProperty('communication');
      expect(defaults.privacy.profileVisibility).toBe('public');
      expect(defaults.notifications.push.enabled).toBe(true);
    });
  });

  describe('updateCategory', () => {
    it('should update specific category', async () => {
      const settings = new UserSettings({
        userId: 'test-user-id',
        ...UserSettings.getDefaultSettings()
      });
      
      await settings.updateCategory('privacy', {
        profileVisibility: 'private',
        showPhoneNumber: true
      });
      
      expect(settings.privacy.profileVisibility).toBe('private');
      expect(settings.privacy.showPhoneNumber).toBe(true);
    });
  });
});
```

### 2. Integration Testing

**Test API endpoints:**
```javascript
describe('User Settings API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user._id;
    authToken = await getAuthToken(user);
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
});
```

### 3. End-to-End Testing

**Test complete user flows:**
```javascript
describe('User Settings E2E', () => {
  it('should allow user to update privacy settings', async () => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('#login-button');
    
    // Navigate to settings
    await page.goto('/settings');
    
    // Update privacy settings
    await page.selectOption('#profile-visibility', 'private');
    await page.check('#show-phone-number');
    await page.click('#save-privacy-settings');
    
    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Verify settings were saved
    await page.reload();
    await expect(page.locator('#profile-visibility')).toHaveValue('private');
    await expect(page.locator('#show-phone-number')).toBeChecked();
  });
});
```

## Monitoring and Analytics

### 1. Performance Monitoring

**Track settings update performance:**
```javascript
const trackSettingsUpdate = (category, duration, success) => {
  // Track metrics
  metrics.timing('settings.update.duration', duration, {
    category,
    success: success.toString()
  });
  
  // Track errors
  if (!success) {
    metrics.increment('settings.update.errors', {
      category
    });
  }
};

const updateUserSettings = async (req, res) => {
  const startTime = Date.now();
  const category = req.params.category || 'all';
  
  try {
    // ... update logic
    
    trackSettingsUpdate(category, Date.now() - startTime, true);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    trackSettingsUpdate(category, Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};
```

### 2. User Behavior Analytics

**Track user settings patterns:**
```javascript
const trackUserSettingsChange = (userId, category, changes) => {
  analytics.track('User Settings Changed', {
    userId,
    category,
    changes: Object.keys(changes),
    timestamp: new Date().toISOString()
  });
};

const updateUserSettings = async (req, res) => {
  try {
    // ... update logic
    
    // Track user behavior
    trackUserSettingsChange(req.user.id, category, updates);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    // ... error handling
  }
};
```

## Deployment and Maintenance

### 1. Database Migrations

**Handle settings schema changes:**
```javascript
const migrateUserSettings = async () => {
  const settings = await UserSettings.find({});
  
  for (const setting of settings) {
    let needsUpdate = false;
    
    // Add new fields with defaults
    if (!setting.privacy.allowReferralRequests) {
      setting.privacy.allowReferralRequests = true;
      needsUpdate = true;
    }
    
    if (!setting.notifications.email.weeklyDigest) {
      setting.notifications.email.weeklyDigest = true;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await setting.save();
    }
  }
};
```

### 2. Feature Flags

**Use feature flags for settings:**
```javascript
const isFeatureEnabled = async (feature) => {
  const appSettings = await AppSettings.getCurrentSettings();
  return appSettings.features[feature]?.enabled || false;
};

const updateUserSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Check if feature is enabled
    if (updates.analytics && !(await isFeatureEnabled('analytics'))) {
      return res.status(400).json({
        success: false,
        message: 'Analytics feature is not enabled'
      });
    }
    
    // ... update logic
  } catch (error) {
    // ... error handling
  }
};
```

### 3. Backup and Recovery

**Implement settings backup:**
```javascript
const backupUserSettings = async (userId) => {
  const settings = await UserSettings.findOne({ userId });
  
  if (settings) {
    await BackupSettings.create({
      userId,
      settings: settings.toObject(),
      backedUpAt: new Date()
    });
  }
};

const restoreUserSettings = async (userId, backupId) => {
  const backup = await BackupSettings.findById(backupId);
  
  if (backup && backup.userId.toString() === userId) {
    await UserSettings.findOneAndUpdate(
      { userId },
      { $set: backup.settings },
      { upsert: true }
    );
  }
};
```

These best practices ensure that your user settings implementation is secure, performant, and maintainable. They cover everything from data management and security to frontend integration and testing, providing a comprehensive guide for building robust user settings functionality.
