# Users Usage Examples

## Overview

This document provides practical examples of how to use the Users API in various scenarios. These examples demonstrate common patterns and best practices for implementing user management functionality in your application.

## Frontend Integration

### React Hook for User Authentication

```javascript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStoredToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  };

  const storeToken = async (token) => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  // Send verification code
  const sendVerificationCode = useCallback(async (phoneNumber) => {
    try {
      setLoading(true);
      const response = await fetch('https://api.localpro.com/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }
      
      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify code and login/register
  const verifyCode = useCallback(async (phoneNumber, code) => {
    try {
      setLoading(true);
      const response = await fetch('https://api.localpro.com/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code })
      });
      
      if (!response.ok) {
        throw new Error('Invalid verification code');
      }
      
      const data = await response.json();
      const { user, token } = data.data;
      
      await storeToken(token);
      setUser(user);
      setError(null);
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async (onboardingData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(onboardingData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      const data = await response.json();
      setUser(data.data.user);
      setError(null);
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      if (!token) {
        setUser(null);
        return null;
      }
      
      const response = await fetch('https://api.localpro.com/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          await removeToken();
          setUser(null);
          return null;
        }
        throw new Error('Failed to get user');
      }
      
      const data = await response.json();
      setUser(data.data);
      setError(null);
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      setUser(data.data);
      setError(null);
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = await getStoredToken();
      
      if (token) {
        await fetch('https://api.localpro.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      await removeToken();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state even if API call fails
      await removeToken();
      setUser(null);
    }
  }, []);

  // Check if user is logged in
  const isLoggedIn = useCallback(() => {
    return !!user;
  }, [user]);

  // Check if onboarding is complete
  const isOnboardingComplete = useCallback(() => {
    return user && user.firstName && user.lastName && user.email;
  }, [user]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return {
    user,
    loading,
    error,
    sendVerificationCode,
    verifyCode,
    completeOnboarding,
    updateProfile,
    logout,
    isLoggedIn,
    isOnboardingComplete,
    refetch: getCurrentUser
  };
};

export default useAuth;
```

### Authentication Screen Component

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import useAuth from '../hooks/useAuth';

const AuthScreen = () => {
  const { sendVerificationCode, verifyCode, loading, error } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'

  const handleSendCode = async () => {
    try {
      await sendVerificationCode(phoneNumber);
      setStep('verify');
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyCode(phoneNumber, verificationCode);
      Alert.alert('Success', 'You are now logged in');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (step === 'phone') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Your Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1234567890"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify Code'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => setStep('phone')}
      >
        <Text style={styles.linkText}>Change Phone Number</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 20
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10
  }
});

export default AuthScreen;
```

### Profile Screen Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import useAuth from '../hooks/useAuth';

const ProfileScreen = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profile: {
      bio: '',
      businessName: '',
      skills: [],
      serviceAreas: []
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profile: {
          bio: user.profile?.bio || '',
          businessName: user.profile?.businessName || '',
          skills: user.profile?.skills || [],
          serviceAreas: user.profile?.serviceAreas || []
        }
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(value) => handleInputChange('firstName', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(value) => handleInputChange('lastName', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={formData.profile.businessName}
          onChangeText={(value) => handleInputChange('profile.businessName', value)}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Bio"
          value={formData.profile.bio}
          onChangeText={(value) => handleInputChange('profile.bio', value)}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: 'white'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10
  }
});

export default ProfileScreen;
```

## Backend Integration

### User Service Class

```javascript
class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Authentication Methods
  async sendVerificationCode(phoneNumber) {
    const response = await this.apiClient.post('/api/auth/send-code', {
      phoneNumber
    });
    return response.data;
  }

  async verifyCode(phoneNumber, code) {
    const response = await this.apiClient.post('/api/auth/verify-code', {
      phoneNumber,
      code
    });
    return response.data;
  }

  async completeOnboarding(onboardingData) {
    const response = await this.apiClient.post('/api/auth/complete-onboarding', onboardingData);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.apiClient.get('/api/auth/me');
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await this.apiClient.put('/api/auth/profile', profileData);
    return response.data;
  }

  async uploadAvatar(imageFile) {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await this.apiClient.post('/api/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async uploadPortfolioImages(imageFiles) {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });
    
    const response = await this.apiClient.post('/api/auth/upload-portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async logout() {
    const response = await this.apiClient.post('/api/auth/logout');
    return response.data;
  }

  // User Management Methods (Admin/Agency)
  async getAllUsers(filters = {}) {
    const response = await this.apiClient.get('/api/users', { params: filters });
    return response.data;
  }

  async getUserById(userId) {
    const response = await this.apiClient.get(`/api/users/${userId}`);
    return response.data;
  }

  async createUser(userData) {
    const response = await this.apiClient.post('/api/users', userData);
    return response.data;
  }

  async updateUser(userId, userData) {
    const response = await this.apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  }

  async updateUserStatus(userId, statusData) {
    const response = await this.apiClient.patch(`/api/users/${userId}/status`, statusData);
    return response.data;
  }

  async updateUserVerification(userId, verificationData) {
    const response = await this.apiClient.patch(`/api/users/${userId}/verification`, verificationData);
    return response.data;
  }

  async addUserBadge(userId, badgeData) {
    const response = await this.apiClient.post(`/api/users/${userId}/badges`, badgeData);
    return response.data;
  }

  async getUserStats(agencyId = null) {
    const params = agencyId ? { agencyId } : {};
    const response = await this.apiClient.get('/api/users/stats', { params });
    return response.data;
  }

  async bulkUpdateUsers(userIds, updateData) {
    const response = await this.apiClient.patch('/api/users/bulk', {
      userIds,
      updateData
    });
    return response.data;
  }

  async deleteUser(userId) {
    const response = await this.apiClient.delete(`/api/users/${userId}`);
    return response.data;
  }
}

export default UserService;
```

### User Controller Implementation

```javascript
import UserService from '../services/UserService';
import { validationResult } from 'express-validator';

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  // Authentication Controllers
  async sendVerificationCode(req, res) {
    try {
      const { phoneNumber } = req.body;
      
      // Validate phone number
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const result = await this.userService.sendVerificationCode(phoneNumber);
      res.json(result);
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
  }

  async verifyCode(req, res) {
    try {
      const { phoneNumber, code } = req.body;
      
      // Validate input
      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and code are required'
        });
      }

      const result = await this.userService.verifyCode(phoneNumber, code);
      res.json(result);
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify code'
      });
    }
  }

  async completeOnboarding(req, res) {
    try {
      const onboardingData = req.body;
      
      // Validate required fields
      if (!onboardingData.firstName || !onboardingData.lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        });
      }

      const result = await this.userService.completeOnboarding(onboardingData);
      res.json(result);
    } catch (error) {
      console.error('Complete onboarding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding'
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const result = await this.userService.getCurrentUser();
      res.json(result);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current user'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const profileData = req.body;
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const result = await this.userService.updateProfile(profileData);
      res.json(result);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // User Management Controllers (Admin/Agency)
  async getAllUsers(req, res) {
    try {
      const filters = req.query;
      const result = await this.userService.getAllUsers(filters);
      res.json(result);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.userService.getUserById(id);
      res.json(result);
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.phoneNumber || !userData.firstName || !userData.lastName) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, first name, and last name are required'
        });
      }

      const result = await this.userService.createUser(userData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const result = await this.userService.updateUser(id, userData);
      res.json(result);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const statusData = req.body;
      
      const result = await this.userService.updateUserStatus(id, statusData);
      res.json(result);
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }

  async updateUserVerification(req, res) {
    try {
      const { id } = req.params;
      const verificationData = req.body;
      
      const result = await this.userService.updateUserVerification(id, verificationData);
      res.json(result);
    } catch (error) {
      console.error('Update user verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user verification'
      });
    }
  }

  async addUserBadge(req, res) {
    try {
      const { id } = req.params;
      const badgeData = req.body;
      
      const result = await this.userService.addUserBadge(id, badgeData);
      res.json(result);
    } catch (error) {
      console.error('Add user badge error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add user badge'
      });
    }
  }

  async getUserStats(req, res) {
    try {
      const { agencyId } = req.query;
      const result = await this.userService.getUserStats(agencyId);
      res.json(result);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics'
      });
    }
  }

  async bulkUpdateUsers(req, res) {
    try {
      const { userIds, updateData } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      const result = await this.userService.bulkUpdateUsers(userIds, updateData);
      res.json(result);
    } catch (error) {
      console.error('Bulk update users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update users'
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(id);
      res.json(result);
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
}

export default UserController;
```

## Mobile App Integration

### React Native User Management

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import useAuth from '../hooks/useAuth';

const UserManagementScreen = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.localpro.com/api/users', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.data.users);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await fetch(`https://api.localpro.com/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      // Refresh users list
      await fetchUsers();
      Alert.alert('Success', `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const addUserBadge = async (userId, badgeType) => {
    try {
      const response = await fetch(`https://api.localpro.com/api/users/${userId}/badges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          type: badgeType,
          description: `${badgeType.replace('_', ' ')} badge`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add badge');
      }
      
      // Refresh users list
      await fetchUsers();
      Alert.alert('Success', 'Badge added successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userStatus}>
          Status: {item.isActive ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.userTrustScore}>
          Trust Score: {item.trustScore}
        </Text>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.isActive ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => updateUserStatus(item._id, !item.isActive)}
        >
          <Text style={styles.actionButtonText}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.badgeButton}
          onPress={() => addUserBadge(item._id, 'verified_provider')}
        >
          <Text style={styles.badgeButtonText}>Add Badge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchUsers}
      />
    </View>
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
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  userInfo: {
    marginBottom: 12
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2
  },
  userStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  userTrustScore: {
    fontSize: 14,
    color: '#666'
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8
  },
  activateButton: {
    backgroundColor: '#4CAF50'
  },
  deactivateButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  badgeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    flex: 1
  },
  badgeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default UserManagementScreen;
```

## Testing Examples

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthScreen from '../AuthScreen';
import useAuth from '../hooks/useAuth';

// Mock the hook
jest.mock('../hooks/useAuth');

describe('AuthScreen', () => {
  const mockSendVerificationCode = jest.fn();
  const mockVerifyCode = jest.fn();

  beforeEach(() => {
    useAuth.mockReturnValue({
      sendVerificationCode: mockSendVerificationCode,
      verifyCode: mockVerifyCode,
      loading: false,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders phone input form initially', () => {
    render(<AuthScreen />);
    
    expect(screen.getByText('Enter Your Phone Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
  });

  it('sends verification code when form is submitted', async () => {
    mockSendVerificationCode.mockResolvedValue({});
    
    render(<AuthScreen />);
    
    const phoneInput = screen.getByPlaceholderText('+1234567890');
    const sendButton = screen.getByText('Send Verification Code');
    
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendVerificationCode).toHaveBeenCalledWith('+1234567890');
    });
  });

  it('shows verification form after sending code', async () => {
    mockSendVerificationCode.mockResolvedValue({});
    
    render(<AuthScreen />);
    
    const phoneInput = screen.getByPlaceholderText('+1234567890');
    const sendButton = screen.getByText('Send Verification Code');
    
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
    });
  });

  it('verifies code when verification form is submitted', async () => {
    mockVerifyCode.mockResolvedValue({});
    
    render(<AuthScreen />);
    
    // Simulate being in verification step
    const authScreen = render(<AuthScreen />);
    // Mock the step state to be 'verify'
    // This would require refactoring the component to accept step as prop
    
    const codeInput = screen.getByPlaceholderText('123456');
    const verifyButton = screen.getByText('Verify Code');
    
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockVerifyCode).toHaveBeenCalledWith('+1234567890', '123456');
    });
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../app';
import User from '../models/User';

describe('User Authentication API', () => {
  let testUser;

  beforeAll(async () => {
    // Setup test user
    testUser = await User.create({
      phoneNumber: '+1234567890',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteOne({ _id: testUser._id });
  });

  describe('POST /api/auth/send-code', () => {
    it('should send verification code for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe('+1234567890');
      expect(response.body.data.isNewUser).toBe(false);
    });

    it('should send verification code for new user', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1987654321' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe('+1987654321');
      expect(response.body.data.isNewUser).toBe(true);
    });

    it('should reject invalid phone number format', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '1234567890' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_PHONE_FORMAT');
    });
  });

  describe('POST /api/auth/verify-code', () => {
    it('should verify code and return user data', async () => {
      // First send code
      await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' });

      // Get the verification code from the user document
      const user = await User.findOne({ phoneNumber: '+1234567890' });
      const verificationCode = user.verificationCode;

      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: verificationCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phoneNumber).toBe('+1234567890');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: '000000'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_VERIFICATION_CODE');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/verify-code')
        .send({
          phoneNumber: '+1234567890',
          code: testUser.verificationCode
        });

      const token = authResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe('+1234567890');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useUserManagement = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery(
    'users',
    async () => {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
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

  const updateUserMutation = useMutation(
    async ({ userId, userData }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update cache with new data
        queryClient.setQueryData('users', (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            users: oldData.data.users.map(user => 
              user._id === variables.userId ? { ...user, ...data.data } : user
            )
          }
        }));
      }
    }
  );

  const updateUserStatusMutation = useMutation(
    async ({ userId, isActive }) => {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update cache
        queryClient.setQueryData('users', (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            users: oldData.data.users.map(user => 
              user._id === variables.userId ? { ...user, isActive: variables.isActive } : user
            )
          }
        }));
      }
    }
  );

  return {
    users: users?.data?.users,
    pagination: users?.data?.pagination,
    loading: isLoading,
    error,
    updateUser: updateUserMutation.mutate,
    updateUserStatus: updateUserStatusMutation.mutate,
    isUpdating: updateUserMutation.isLoading || updateUserStatusMutation.isLoading
  };
};

export default useUserManagement;
```

These examples demonstrate comprehensive usage patterns for the Users API across different platforms and scenarios. They show how to implement user authentication, profile management, and user administration functionality with proper error handling, validation, and performance optimization.
