# Activity Usage Examples

## Overview

This document provides practical examples of how to use the Activity API in various scenarios. These examples demonstrate common patterns and best practices for implementing activity tracking, social engagement, and analytics functionality in your application.

## Frontend Integration

### React Hook for Activity Management

```javascript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useActivity = () => {
  const [activities, setActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStoredToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  };

  // Get activity feed
  const getActivityFeed = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      const queryParams = new URLSearchParams(filters);
      
      const response = await fetch(`https://api.localpro.com/api/activities/feed?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }
      
      const data = await response.json();
      setActivities(data.data.activities);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get my activities
  const getMyActivities = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      const queryParams = new URLSearchParams(filters);
      
      const response = await fetch(`https://api.localpro.com/api/activities/my?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch my activities');
      }
      
      const data = await response.json();
      setMyActivities(data.data.activities);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create activity
  const createActivity = useCallback(async (activityData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create activity');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add interaction
  const addInteraction = useCallback(async (activityId, type, metadata = {}) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/activities/${activityId}/interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, metadata })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add interaction');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove interaction
  const removeInteraction = useCallback(async (activityId, type) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/activities/${activityId}/interactions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove interaction');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get activity statistics
  const getActivityStats = useCallback(async (timeframe = '30d') => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/activities/stats/my?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity statistics');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activities,
    myActivities,
    loading,
    error,
    getActivityFeed,
    getMyActivities,
    createActivity,
    addInteraction,
    removeInteraction,
    getActivityStats
  };
};

export default useActivity;
```

### Activity Feed Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import useActivity from '../hooks/useActivity';

const ActivityFeed = () => {
  const { activities, loading, error, getActivityFeed } = useActivity();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    timeframe: '7d',
    categories: '',
    types: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadActivities = async () => {
    try {
      await getActivityFeed(filters);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadActivities();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleInteraction = async (activityId, type) => {
    try {
      // Toggle interaction (like/unlike, etc.)
      const isLiked = activities.find(a => a._id === activityId)?.interactions?.some(
        i => i.type === type && i.user._id === currentUserId
      );
      
      if (isLiked) {
        await removeInteraction(activityId, type);
      } else {
        await addInteraction(activityId, type);
      }
      
      // Reload activities to update UI
      await loadActivities();
    } catch (err) {
      console.error('Failed to handle interaction:', err);
    }
  };

  const renderActivity = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.user.avatar?.url }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={styles.activityTime}>{item.age}</Text>
          </View>
        </View>
        <View style={styles.activityType}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>

      <Text style={styles.activityDescription}>{item.description}</Text>

      {item.targetEntity && (
        <View style={styles.targetEntity}>
          <Text style={styles.entityName}>{item.targetEntity.name}</Text>
          <Text style={styles.entityType}>{item.targetEntity.type}</Text>
        </View>
      )}

      <View style={styles.activityFooter}>
        <View style={styles.interactions}>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction(item._id, 'like')}
          >
            <Text style={styles.interactionText}>👍 {item.analytics.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction(item._id, 'share')}
          >
            <Text style={styles.interactionText}>🔄 {item.analytics.shares}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction(item._id, 'comment')}
          >
            <Text style={styles.interactionText}>💬 {item.analytics.comments}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityMeta}>
          <Text style={styles.pointsText}>{item.points} pts</Text>
          <Text style={styles.impactText}>{item.impact}</Text>
        </View>
      </View>
    </View>
  );

  if (loading && activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Feed</Text>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filters.timeframe === '1d' && styles.activeFilter]}
          onPress={() => handleFilterChange('timeframe', '1d')}
        >
          <Text style={styles.filterText}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.timeframe === '7d' && styles.activeFilter]}
          onPress={() => handleFilterChange('timeframe', '7d')}
        >
          <Text style={styles.filterText}>Week</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.timeframe === '30d' && styles.activeFilter]}
          onPress={() => handleFilterChange('timeframe', '30d')}
        >
          <Text style={styles.filterText}>Month</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (!loading) {
            setFilters(prev => ({ ...prev, page: prev.page + 1 }));
          }
        }}
        onEndReachedThreshold={0.1}
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
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0'
  },
  activeFilter: {
    backgroundColor: '#007AFF'
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500'
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  activityTime: {
    fontSize: 12,
    color: '#666'
  },
  activityType: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  typeText: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'capitalize'
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#333'
  },
  targetEntity: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  entityName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  entityType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize'
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  interactions: {
    flexDirection: 'row',
    gap: 16
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  interactionText: {
    fontSize: 14,
    color: '#666'
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  pointsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold'
  },
  impactText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  }
});

export default ActivityFeed;
```

### Activity Statistics Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import useActivity from '../hooks/useActivity';

const ActivityStatistics = () => {
  const { getActivityStats } = useActivity();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    loadStats();
  }, [selectedTimeframe]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getActivityStats(selectedTimeframe);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const timeframes = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: 'Week' },
    { value: '30d', label: 'Month' },
    { value: '90d', label: 'Quarter' }
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Activity Statistics</Text>
      
      {/* Timeframe Selector */}
      <View style={styles.timeframeSelector}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe.value}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe.value && styles.activeTimeframe
            ]}
            onPress={() => setSelectedTimeframe(timeframe.value)}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe.value && styles.activeTimeframeText
            ]}>
              {timeframe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalActivities || 0}</Text>
          <Text style={styles.statLabel}>Total Activities</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities by Category</Text>
        {stats?.categoryBreakdown && Object.entries(stats.categoryBreakdown).map(([category, count]) => (
          <View key={category} style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{category}</Text>
            <Text style={styles.breakdownValue}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Type Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities by Type</Text>
        {stats?.typeBreakdown && Object.entries(stats.typeBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([type, count]) => (
            <View key={type} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>{type.replace(/_/g, ' ')}</Text>
              <Text style={styles.breakdownValue}>{count}</Text>
            </View>
          ))}
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
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0'
  },
  activeTimeframe: {
    backgroundColor: '#007AFF'
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500'
  },
  activeTimeframeText: {
    color: 'white'
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize'
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF'
  }
});

export default ActivityStatistics;
```

## Backend Integration

### Activity Service Class

```javascript
class ActivityService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Activity Feed Methods
  async getActivityFeed(filters = {}) {
    const response = await this.apiClient.get('/api/activities/feed', { params: filters });
    return response.data;
  }

  async getMyActivities(filters = {}) {
    const response = await this.apiClient.get('/api/activities/my', { params: filters });
    return response.data;
  }

  async getUserActivities(userId, filters = {}) {
    const response = await this.apiClient.get(`/api/activities/user/${userId}`, { params: filters });
    return response.data;
  }

  // Activity Management Methods
  async getActivity(activityId) {
    const response = await this.apiClient.get(`/api/activities/${activityId}`);
    return response.data;
  }

  async createActivity(activityData) {
    const response = await this.apiClient.post('/api/activities', activityData);
    return response.data;
  }

  async updateActivity(activityId, activityData) {
    const response = await this.apiClient.put(`/api/activities/${activityId}`, activityData);
    return response.data;
  }

  async deleteActivity(activityId) {
    const response = await this.apiClient.delete(`/api/activities/${activityId}`);
    return response.data;
  }

  // Interaction Methods
  async addInteraction(activityId, type, metadata = {}) {
    const response = await this.apiClient.post(`/api/activities/${activityId}/interactions`, {
      type,
      metadata
    });
    return response.data;
  }

  async removeInteraction(activityId, type) {
    const response = await this.apiClient.delete(`/api/activities/${activityId}/interactions`, {
      data: { type }
    });
    return response.data;
  }

  // Analytics Methods
  async getActivityStats(timeframe = '30d') {
    const response = await this.apiClient.get('/api/activities/stats/my', { 
      params: { timeframe } 
    });
    return response.data;
  }

  async getGlobalActivityStats(timeframe = '30d') {
    const response = await this.apiClient.get('/api/activities/stats/global', { 
      params: { timeframe } 
    });
    return response.data;
  }

  // Metadata Methods
  async getActivityMetadata() {
    const response = await this.apiClient.get('/api/activities/metadata');
    return response.data;
  }
}

export default ActivityService;
```

### Activity Controller Implementation

```javascript
import ActivityService from '../services/ActivityService';
import { validationResult } from 'express-validator';

class ActivityController {
  constructor() {
    this.activityService = new ActivityService();
  }

  // Activity Feed Controllers
  async getActivityFeed(req, res) {
    try {
      const filters = req.query;
      const result = await this.activityService.getActivityFeed(filters);
      res.json(result);
    } catch (error) {
      console.error('Get activity feed error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity feed'
      });
    }
  }

  async getMyActivities(req, res) {
    try {
      const filters = req.query;
      const result = await this.activityService.getMyActivities(filters);
      res.json(result);
    } catch (error) {
      console.error('Get my activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my activities'
      });
    }
  }

  async getUserActivities(req, res) {
    try {
      const { userId } = req.params;
      const filters = req.query;
      const result = await this.activityService.getUserActivities(userId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get user activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activities'
      });
    }
  }

  // Activity Management Controllers
  async getActivity(req, res) {
    try {
      const { id } = req.params;
      const result = await this.activityService.getActivity(id);
      res.json(result);
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity'
      });
    }
  }

  async createActivity(req, res) {
    try {
      const activityData = req.body;
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const result = await this.activityService.createActivity(activityData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create activity'
      });
    }
  }

  async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const activityData = req.body;
      
      const result = await this.activityService.updateActivity(id, activityData);
      res.json(result);
    } catch (error) {
      console.error('Update activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update activity'
      });
    }
  }

  async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const result = await this.activityService.deleteActivity(id);
      res.json(result);
    } catch (error) {
      console.error('Delete activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete activity'
      });
    }
  }

  // Interaction Controllers
  async addInteraction(req, res) {
    try {
      const { id } = req.params;
      const { type, metadata } = req.body;
      
      const result = await this.activityService.addInteraction(id, type, metadata);
      res.json(result);
    } catch (error) {
      console.error('Add interaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add interaction'
      });
    }
  }

  async removeInteraction(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body;
      
      const result = await this.activityService.removeInteraction(id, type);
      res.json(result);
    } catch (error) {
      console.error('Remove interaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove interaction'
      });
    }
  }

  // Analytics Controllers
  async getActivityStats(req, res) {
    try {
      const { timeframe } = req.query;
      const result = await this.activityService.getActivityStats(timeframe);
      res.json(result);
    } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity statistics'
      });
    }
  }

  async getGlobalActivityStats(req, res) {
    try {
      const { timeframe } = req.query;
      const result = await this.activityService.getGlobalActivityStats(timeframe);
      res.json(result);
    } catch (error) {
      console.error('Get global activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get global activity statistics'
      });
    }
  }

  // Metadata Controllers
  async getActivityMetadata(req, res) {
    try {
      const result = await this.activityService.getActivityMetadata();
      res.json(result);
    } catch (error) {
      console.error('Get activity metadata error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity metadata'
      });
    }
  }
}

export default ActivityController;
```

## Testing Examples

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityFeed from '../ActivityFeed';
import useActivity from '../hooks/useActivity';

// Mock the hook
jest.mock('../hooks/useActivity');

describe('ActivityFeed', () => {
  const mockActivities = [
    {
      _id: '1',
      type: 'service_created',
      category: 'marketplace',
      action: 'Created new service',
      description: 'John Doe created a new cleaning service',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: { url: 'https://example.com/avatar.jpg' }
      },
      analytics: { views: 25, likes: 8, shares: 3, comments: 2 },
      age: '2h ago',
      points: 15,
      impact: 'medium'
    }
  ];

  beforeEach(() => {
    useActivity.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      getActivityFeed: jest.fn(),
      addInteraction: jest.fn(),
      removeInteraction: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders activity feed', () => {
    render(<ActivityFeed />);
    
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('John Doe created a new cleaning service')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('handles timeframe filter changes', async () => {
    const mockGetActivityFeed = jest.fn();
    useActivity.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      getActivityFeed: mockGetActivityFeed,
      addInteraction: jest.fn(),
      removeInteraction: jest.fn()
    });

    render(<ActivityFeed />);
    
    const weekButton = screen.getByText('Week');
    fireEvent.press(weekButton);
    
    await waitFor(() => {
      expect(mockGetActivityFeed).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        timeframe: '7d',
        categories: '',
        types: ''
      });
    });
  });

  it('handles interaction clicks', async () => {
    const mockAddInteraction = jest.fn();
    useActivity.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      getActivityFeed: jest.fn(),
      addInteraction: mockAddInteraction,
      removeInteraction: jest.fn()
    });

    render(<ActivityFeed />);
    
    const likeButton = screen.getByText('👍 8');
    fireEvent.press(likeButton);
    
    await waitFor(() => {
      expect(mockAddInteraction).toHaveBeenCalledWith('1', 'like');
    });
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../app';
import { Activity } from '../models/Activity';
import User from '../models/User';

describe('Activity API Integration', () => {
  let testUser;
  let testActivity;

  beforeAll(async () => {
    // Setup test user
    testUser = await User.create({
      phoneNumber: '+1234567890',
      firstName: 'Test',
      lastName: 'User',
      role: 'provider'
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await Activity.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/activities', () => {
    it('should create a new activity', async () => {
      const activityData = {
        type: 'service_created',
        action: 'Created new service',
        description: 'Test user created a new cleaning service',
        targetEntity: {
          type: 'service',
          id: '60f7b3b3b3b3b3b3b3b3b3b3',
          name: 'Test Cleaning Service'
        },
        visibility: 'public',
        impact: 'medium'
      };

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${userToken}`)
        .send(activityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('service_created');
      expect(response.body.data.user).toBe(testUser._id.toString());
    });
  });

  describe('POST /api/activities/:id/interactions', () => {
    beforeEach(async () => {
      testActivity = await Activity.create({
        user: testUser._id,
        type: 'service_created',
        category: 'marketplace',
        action: 'Created new service',
        description: 'Test user created a new cleaning service',
        visibility: 'public',
        impact: 'medium'
      });
    });

    it('should add interaction to activity', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity._id}/interactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'like', metadata: { source: 'mobile_app' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.interactionType).toBe('like');
      expect(response.body.data.analytics.likes).toBe(1);
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useActivityWithCache = () => {
  const queryClient = useQueryClient();

  const { data: activities, isLoading, error } = useQuery(
    'activities',
    async () => {
      const response = await fetch('/api/activities/feed');
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: 1000
    }
  );

  const addInteractionMutation = useMutation(
    async ({ activityId, type, metadata }) => {
      const response = await fetch(`/api/activities/${activityId}/interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, metadata })
      });
      if (!response.ok) throw new Error('Failed to add interaction');
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update cache with new interaction
        queryClient.setQueryData('activities', (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            activities: oldData.data.activities.map(activity => 
              activity._id === variables.activityId 
                ? { 
                    ...activity, 
                    analytics: { 
                      ...activity.analytics, 
                      [variables.type]: activity.analytics[variables.type] + 1 
                    }
                  }
                : activity
            )
          }
        }));
      }
    }
  );

  const createActivityMutation = useMutation(
    async (activityData) => {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      if (!response.ok) throw new Error('Failed to create activity');
      return response.json();
    },
    {
      onSuccess: (data) => {
        // Add new activity to cache
        queryClient.setQueryData('activities', (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            activities: [data.data, ...oldData.data.activities]
          }
        }));
      }
    }
  );

  return {
    activities: activities?.data?.activities,
    loading: isLoading,
    error,
    addInteraction: addInteractionMutation.mutate,
    createActivity: createActivityMutation.mutate,
    isAddingInteraction: addInteractionMutation.isLoading,
    isCreatingActivity: createActivityMutation.isLoading
  };
};

export default useActivityWithCache;
```

These examples demonstrate comprehensive usage patterns for the Activity API across different platforms and scenarios. They show how to implement activity tracking, social engagement, and analytics functionality with proper error handling, validation, and performance optimization.
