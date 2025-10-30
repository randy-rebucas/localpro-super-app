# Agencies Usage Examples

## Overview

This document provides practical examples of how to use the Agencies API in various scenarios. These examples demonstrate common patterns and best practices for implementing agency management, provider management, and administrative controls in your application.

## Frontend Integration

### React Hook for Agency Management

```javascript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAgency = () => {
  const [agencies, setAgencies] = useState([]);
  const [myAgencies, setMyAgencies] = useState([]);
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

  // Get all agencies
  const getAgencies = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      const queryParams = new URLSearchParams(filters);
      
      const response = await fetch(`https://api.localpro.com/api/agencies?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      
      const data = await response.json();
      setAgencies(data.data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single agency
  const getAgency = useCallback(async (agencyId) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/agencies/${agencyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agency');
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

  // Create agency
  const createAgency = useCallback(async (agencyData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/agencies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agencyData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create agency');
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

  // Update agency
  const updateAgency = useCallback(async (agencyId, agencyData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/agencies/${agencyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agencyData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update agency');
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

  // Add provider
  const addProvider = useCallback(async (agencyId, userId, commissionRate = 10) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/agencies/${agencyId}/providers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, commissionRate })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add provider');
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

  // Get my agencies
  const getMyAgencies = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/agencies/my/agencies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch my agencies');
      }
      
      const data = await response.json();
      setMyAgencies(data.data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get agency analytics
  const getAgencyAnalytics = useCallback(async (agencyId) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/agencies/${agencyId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agency analytics');
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
    agencies,
    myAgencies,
    loading,
    error,
    getAgencies,
    getAgency,
    createAgency,
    updateAgency,
    addProvider,
    getMyAgencies,
    getAgencyAnalytics
  };
};

export default useAgency;
```

### Agency List Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import useAgency from '../hooks/useAgency';

const AgencyList = () => {
  const { agencies, loading, error, getAgencies } = useAgency();
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    serviceType: '',
    page: 1,
    limit: 20
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAgencies();
  }, [filters]);

  const loadAgencies = async () => {
    try {
      await getAgencies(filters);
    } catch (err) {
      console.error('Failed to load agencies:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAgencies();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const renderAgency = ({ item }) => (
    <TouchableOpacity style={styles.agencyCard}>
      <View style={styles.agencyHeader}>
        <View style={styles.agencyInfo}>
          <Text style={styles.agencyName}>{item.name}</Text>
          <Text style={styles.agencyDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.agencyStatus}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.agencyDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Owner:</Text>
          <Text style={styles.detailValue}>
            {item.owner.firstName} {item.owner.lastName}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Providers:</Text>
          <Text style={styles.detailValue}>
            {item.providers.length} total, {item.providers.filter(p => p.status === 'active').length} active
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>
            {item.contact.address.city}, {item.contact.address.state}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Services:</Text>
          <Text style={styles.detailValue}>
            {item.services.map(s => s.category).join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.agencyFooter}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {item.analytics.averageRating.toFixed(1)}</Text>
          <Text style={styles.reviewsText}>({item.analytics.totalReviews} reviews)</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {item.analytics.totalBookings} bookings
          </Text>
          <Text style={styles.statsText}>
            ${item.analytics.totalRevenue.toLocaleString()} revenue
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && agencies.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading agencies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agencies</Text>
      
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search agencies..."
          value={filters.search}
          onChangeText={(value) => handleFilterChange('search', value)}
        />
        
        <TextInput
          style={styles.filterInput}
          placeholder="Location"
          value={filters.location}
          onChangeText={(value) => handleFilterChange('location', value)}
        />
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Open service type picker
          }}
        >
          <Text style={styles.filterButtonText}>
            {filters.serviceType || 'Service Type'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      <FlatList
        data={agencies}
        renderItem={renderAgency}
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
  searchInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white'
  },
  filterInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white'
  },
  filterButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center'
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666'
  },
  agencyCard: {
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
  agencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  agencyInfo: {
    flex: 1
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  agencyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  agencyStatus: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  agencyDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
    color: '#333'
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  agencyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFA500',
    marginRight: 4
  },
  reviewsText: {
    fontSize: 12,
    color: '#666'
  },
  statsContainer: {
    alignItems: 'flex-end'
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  }
});

export default AgencyList;
```

### Agency Details Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import useAgency from '../hooks/useAgency';

const AgencyDetails = ({ route }) => {
  const { agencyId } = route.params;
  const { getAgency, getAgencyAnalytics } = useAgency();
  const [agency, setAgency] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgencyData();
  }, [agencyId]);

  const loadAgencyData = async () => {
    try {
      setLoading(true);
      const [agencyData, analyticsData] = await Promise.all([
        getAgency(agencyId),
        getAgencyAnalytics(agencyId)
      ]);
      
      setAgency(agencyData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load agency data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading agency details...</Text>
      </View>
    );
  }

  if (!agency) {
    return (
      <View style={styles.container}>
        <Text>Agency not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.agencyName}>{agency.name}</Text>
        <Text style={styles.agencyDescription}>{agency.description}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: agency.isActive ? '#4CAF50' : '#F44336' }
          ]}>
            {agency.isActive ? 'Active' : 'Inactive'}
          </Text>
          {agency.verification.isVerified && (
            <Text style={styles.verifiedText}>✓ Verified</Text>
          )}
        </View>
      </View>

      {/* Owner Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Owner</Text>
        <View style={styles.ownerInfo}>
          <Image
            source={{ uri: agency.owner.profile.avatar?.url }}
            style={styles.ownerAvatar}
          />
          <View style={styles.ownerDetails}>
            <Text style={styles.ownerName}>
              {agency.owner.firstName} {agency.owner.lastName}
            </Text>
            <Text style={styles.ownerBio}>
              {agency.owner.profile.bio}
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactItem}>📧 {agency.contact.email}</Text>
          <Text style={styles.contactItem}>📞 {agency.contact.phone}</Text>
          {agency.contact.website && (
            <Text style={styles.contactItem}>🌐 {agency.contact.website}</Text>
          )}
          <Text style={styles.contactItem}>
            📍 {agency.contact.address.street}, {agency.contact.address.city}, {agency.contact.address.state} {agency.contact.address.zipCode}
          </Text>
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Offered</Text>
        {agency.services.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <Text style={styles.serviceCategory}>
              {service.category.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.serviceSubcategories}>
              {service.subcategories.join(', ')}
            </Text>
            <Text style={styles.servicePricing}>
              Starting at ${service.pricing.baseRate}/{service.pricing.currency}
            </Text>
          </View>
        ))}
      </View>

      {/* Service Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Areas</Text>
        {agency.serviceAreas.map((area, index) => (
          <View key={index} style={styles.serviceAreaItem}>
            <Text style={styles.areaName}>{area.name}</Text>
            <Text style={styles.areaRadius}>
              {area.radius}km radius
            </Text>
            <Text style={styles.areaZipCodes}>
              Zip codes: {area.zipCodes.join(', ')}
            </Text>
          </View>
        ))}
      </View>

      {/* Providers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Providers ({analytics?.totalProviders || 0})
        </Text>
        {agency.providers.map((provider, index) => (
          <View key={index} style={styles.providerItem}>
            <Image
              source={{ uri: provider.user.profile.avatar?.url }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {provider.user.firstName} {provider.user.lastName}
              </Text>
              <Text style={styles.providerStatus}>
                Status: {provider.status}
              </Text>
              <Text style={styles.providerCommission}>
                Commission: {provider.commissionRate}%
              </Text>
              <Text style={styles.providerRating}>
                Rating: {provider.performance.rating}/5 ({provider.performance.totalJobs} jobs)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Analytics */}
      {analytics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.totalBookings}</Text>
              <Text style={styles.analyticsLabel}>Total Bookings</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>${analytics.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.analyticsLabel}>Total Revenue</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.averageRating.toFixed(1)}</Text>
              <Text style={styles.analyticsLabel}>Average Rating</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.totalReviews}</Text>
              <Text style={styles.analyticsLabel}>Total Reviews</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16
  },
  agencyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  agencyDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  verifiedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  ownerDetails: {
    flex: 1
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  ownerBio: {
    fontSize: 14,
    color: '#666'
  },
  contactInfo: {
    gap: 8
  },
  contactItem: {
    fontSize: 14,
    color: '#333'
  },
  serviceItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  serviceCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  serviceSubcategories: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  servicePricing: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold'
  },
  serviceAreaItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  areaName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  areaRadius: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  areaZipCodes: {
    fontSize: 14,
    color: '#666'
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  providerInfo: {
    flex: 1
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  providerStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  providerCommission: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  providerRating: {
    fontSize: 14,
    color: '#666'
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  }
});

export default AgencyDetails;
```

## Backend Integration

### Agency Service Class

```javascript
class AgencyService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Agency Management Methods
  async getAgencies(filters = {}) {
    const response = await this.apiClient.get('/api/agencies', { params: filters });
    return response.data;
  }

  async getAgency(agencyId) {
    const response = await this.apiClient.get(`/api/agencies/${agencyId}`);
    return response.data;
  }

  async createAgency(agencyData) {
    const response = await this.apiClient.post('/api/agencies', agencyData);
    return response.data;
  }

  async updateAgency(agencyId, agencyData) {
    const response = await this.apiClient.put(`/api/agencies/${agencyId}`, agencyData);
    return response.data;
  }

  async deleteAgency(agencyId) {
    const response = await this.apiClient.delete(`/api/agencies/${agencyId}`);
    return response.data;
  }

  // Provider Management Methods
  async addProvider(agencyId, userId, commissionRate = 10) {
    const response = await this.apiClient.post(`/api/agencies/${agencyId}/providers`, {
      userId,
      commissionRate
    });
    return response.data;
  }

  async removeProvider(agencyId, providerId) {
    const response = await this.apiClient.delete(`/api/agencies/${agencyId}/providers/${providerId}`);
    return response.data;
  }

  async updateProviderStatus(agencyId, providerId, status) {
    const response = await this.apiClient.put(`/api/agencies/${agencyId}/providers/${providerId}/status`, {
      status
    });
    return response.data;
  }

  // Admin Management Methods
  async addAdmin(agencyId, userId, role = 'admin', permissions = []) {
    const response = await this.apiClient.post(`/api/agencies/${agencyId}/admins`, {
      userId,
      role,
      permissions
    });
    return response.data;
  }

  async removeAdmin(agencyId, adminId) {
    const response = await this.apiClient.delete(`/api/agencies/${agencyId}/admins/${adminId}`);
    return response.data;
  }

  // Analytics Methods
  async getAgencyAnalytics(agencyId) {
    const response = await this.apiClient.get(`/api/agencies/${agencyId}/analytics`);
    return response.data;
  }

  // User-Specific Methods
  async getMyAgencies() {
    const response = await this.apiClient.get('/api/agencies/my/agencies');
    return response.data;
  }

  async joinAgency(agencyId) {
    const response = await this.apiClient.post('/api/agencies/join', { agencyId });
    return response.data;
  }

  async leaveAgency(agencyId) {
    const response = await this.apiClient.post('/api/agencies/leave', { agencyId });
    return response.data;
  }

  // File Upload Methods
  async uploadAgencyLogo(agencyId, logoFile) {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await this.apiClient.post(`/api/agencies/${agencyId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

export default AgencyService;
```

### Agency Controller Implementation

```javascript
import AgencyService from '../services/AgencyService';
import { validationResult } from 'express-validator';

class AgencyController {
  constructor() {
    this.agencyService = new AgencyService();
  }

  // Agency Management Controllers
  async getAgencies(req, res) {
    try {
      const filters = req.query;
      const result = await this.agencyService.getAgencies(filters);
      res.json(result);
    } catch (error) {
      console.error('Get agencies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get agencies'
      });
    }
  }

  async getAgency(req, res) {
    try {
      const { id } = req.params;
      const result = await this.agencyService.getAgency(id);
      res.json(result);
    } catch (error) {
      console.error('Get agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get agency'
      });
    }
  }

  async createAgency(req, res) {
    try {
      const agencyData = req.body;
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const result = await this.agencyService.createAgency(agencyData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create agency'
      });
    }
  }

  async updateAgency(req, res) {
    try {
      const { id } = req.params;
      const agencyData = req.body;
      
      const result = await this.agencyService.updateAgency(id, agencyData);
      res.json(result);
    } catch (error) {
      console.error('Update agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update agency'
      });
    }
  }

  async deleteAgency(req, res) {
    try {
      const { id } = req.params;
      const result = await this.agencyService.deleteAgency(id);
      res.json(result);
    } catch (error) {
      console.error('Delete agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete agency'
      });
    }
  }

  // Provider Management Controllers
  async addProvider(req, res) {
    try {
      const { id } = req.params;
      const { userId, commissionRate } = req.body;
      
      const result = await this.agencyService.addProvider(id, userId, commissionRate);
      res.json(result);
    } catch (error) {
      console.error('Add provider error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add provider'
      });
    }
  }

  async removeProvider(req, res) {
    try {
      const { id, providerId } = req.params;
      const result = await this.agencyService.removeProvider(id, providerId);
      res.json(result);
    } catch (error) {
      console.error('Remove provider error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove provider'
      });
    }
  }

  async updateProviderStatus(req, res) {
    try {
      const { id, providerId } = req.params;
      const { status } = req.body;
      
      const result = await this.agencyService.updateProviderStatus(id, providerId, status);
      res.json(result);
    } catch (error) {
      console.error('Update provider status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update provider status'
      });
    }
  }

  // Analytics Controllers
  async getAgencyAnalytics(req, res) {
    try {
      const { id } = req.params;
      const result = await this.agencyService.getAgencyAnalytics(id);
      res.json(result);
    } catch (error) {
      console.error('Get agency analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get agency analytics'
      });
    }
  }

  // User-Specific Controllers
  async getMyAgencies(req, res) {
    try {
      const result = await this.agencyService.getMyAgencies();
      res.json(result);
    } catch (error) {
      console.error('Get my agencies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my agencies'
      });
    }
  }

  async joinAgency(req, res) {
    try {
      const { agencyId } = req.body;
      const result = await this.agencyService.joinAgency(agencyId);
      res.json(result);
    } catch (error) {
      console.error('Join agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join agency'
      });
    }
  }

  async leaveAgency(req, res) {
    try {
      const { agencyId } = req.body;
      const result = await this.agencyService.leaveAgency(agencyId);
      res.json(result);
    } catch (error) {
      console.error('Leave agency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave agency'
      });
    }
  }
}

export default AgencyController;
```

## Testing Examples

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgencyList from '../AgencyList';
import useAgency from '../hooks/useAgency';

// Mock the hook
jest.mock('../hooks/useAgency');

describe('AgencyList', () => {
  const mockAgencies = [
    {
      _id: '1',
      name: 'Elite Cleaning Services',
      description: 'Professional cleaning services',
      owner: {
        firstName: 'John',
        lastName: 'Doe',
        profile: { avatar: { url: 'https://example.com/avatar.jpg' } }
      },
      providers: [
        {
          user: { firstName: 'Jane', lastName: 'Smith' },
          status: 'active',
          commissionRate: 15
        }
      ],
      contact: {
        address: { city: 'San Francisco', state: 'CA' }
      },
      services: [{ category: 'cleaning' }],
      analytics: {
        averageRating: 4.7,
        totalReviews: 45,
        totalBookings: 150,
        totalRevenue: 7500
      },
      isActive: true
    }
  ];

  beforeEach(() => {
    useAgency.mockReturnValue({
      agencies: mockAgencies,
      loading: false,
      error: null,
      getAgencies: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders agency list', () => {
    render(<AgencyList />);
    
    expect(screen.getByText('Agencies')).toBeInTheDocument();
    expect(screen.getByText('Elite Cleaning Services')).toBeInTheDocument();
    expect(screen.getByText('Professional cleaning services')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const mockGetAgencies = jest.fn();
    useAgency.mockReturnValue({
      agencies: mockAgencies,
      loading: false,
      error: null,
      getAgencies: mockGetAgencies
    });

    render(<AgencyList />);
    
    const searchInput = screen.getByPlaceholderText('Search agencies...');
    fireEvent.change(searchInput, { target: { value: 'cleaning' } });
    
    await waitFor(() => {
      expect(mockGetAgencies).toHaveBeenCalledWith({
        search: 'cleaning',
        location: '',
        serviceType: '',
        page: 1,
        limit: 20
      });
    });
  });

  it('displays agency statistics', () => {
    render(<AgencyList />);
    
    expect(screen.getByText('⭐ 4.7')).toBeInTheDocument();
    expect(screen.getByText('(45 reviews)')).toBeInTheDocument();
    expect(screen.getByText('150 bookings')).toBeInTheDocument();
    expect(screen.getByText('$7,500 revenue')).toBeInTheDocument();
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../app';
import { Agency } from '../models/Agency';
import User from '../models/User';

describe('Agency API Integration', () => {
  let testUser;
  let testAgency;

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
    await Agency.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/agencies', () => {
    it('should create a new agency', async () => {
      const agencyData = {
        name: 'Test Cleaning Agency',
        description: 'Test agency for cleaning services',
        contact: {
          email: 'test@cleaning.com',
          phone: '+1-555-0123',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
          }
        },
        business: {
          type: 'llc',
          registrationNumber: 'TEST123456789'
        },
        services: [{
          category: 'cleaning',
          subcategories: ['residential'],
          pricing: { baseRate: 50, currency: 'USD' }
        }]
      };

      const response = await request(app)
        .post('/api/agencies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(agencyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Cleaning Agency');
      expect(response.body.data.owner).toBe(testUser._id.toString());
    });
  });

  describe('POST /api/agencies/:id/providers', () => {
    beforeEach(async () => {
      testAgency = await Agency.create({
        name: 'Test Agency',
        description: 'Test agency',
        owner: testUser._id,
        contact: {
          email: 'test@agency.com',
          phone: '+1-555-0123'
        }
      });
    });

    it('should add provider to agency', async () => {
      const response = await request(app)
        .post(`/api/agencies/${testAgency._id}/providers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: testUser._id, commissionRate: 15 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Provider added successfully');
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useAgencyWithCache = () => {
  const queryClient = useQueryClient();

  const { data: agencies, isLoading, error } = useQuery(
    'agencies',
    async () => {
      const response = await fetch('/api/agencies');
      if (!response.ok) throw new Error('Failed to fetch agencies');
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000
    }
  );

  const createAgencyMutation = useMutation(
    async (agencyData) => {
      const response = await fetch('/api/agencies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agencyData)
      });
      if (!response.ok) throw new Error('Failed to create agency');
      return response.json();
    },
    {
      onSuccess: (data) => {
        // Add new agency to cache
        queryClient.setQueryData('agencies', (oldData) => ({
          ...oldData,
          data: [data.data, ...oldData.data]
        }));
      }
    }
  );

  const addProviderMutation = useMutation(
    async ({ agencyId, userId, commissionRate }) => {
      const response = await fetch(`/api/agencies/${agencyId}/providers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, commissionRate })
      });
      if (!response.ok) throw new Error('Failed to add provider');
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update agency cache with new provider
        queryClient.setQueryData('agencies', (oldData) => ({
          ...oldData,
          data: oldData.data.map(agency => 
            agency._id === variables.agencyId 
              ? { ...agency, providers: [...agency.providers, data.provider] }
              : agency
          )
        }));
      }
    }
  );

  return {
    agencies: agencies?.data,
    loading: isLoading,
    error,
    createAgency: createAgencyMutation.mutate,
    addProvider: addProviderMutation.mutate,
    isCreatingAgency: createAgencyMutation.isLoading,
    isAddingProvider: addProviderMutation.isLoading
  };
};

export default useAgencyWithCache;
```

These examples demonstrate comprehensive usage patterns for the Agencies API across different platforms and scenarios. They show how to implement agency management, provider management, and administrative controls with proper error handling, validation, and performance optimization.
