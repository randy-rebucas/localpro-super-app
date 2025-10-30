# Ads Usage Examples

This document provides practical examples and implementation patterns for working with the ads feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Creating Advertisers](#creating-advertisers)
- [Managing Ad Campaigns](#managing-ad-campaigns)
- [Tracking Impressions](#tracking-impressions)
- [Querying and Filtering](#querying-and-filtering)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)

## Overview

This guide demonstrates how to effectively use the ads feature in your application, including common patterns, optimization techniques, and best practices.

## Creating Advertisers

### Basic Advertiser Creation

```javascript
const { Advertiser } = require('../models/Ads');

// Create a new advertiser
const createAdvertiser = async (userData) => {
  try {
    const advertiser = new Advertiser({
      user: userData.userId,
      businessName: userData.businessName,
      businessType: userData.businessType,
      description: userData.description,
      contact: {
        email: userData.email,
        phone: userData.phone,
        website: userData.website,
        address: {
          street: userData.street,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zipCode,
          country: userData.country
        }
      },
      subscription: {
        plan: 'basic',
        isActive: false
      }
    });

    await advertiser.save();
    return advertiser;
  } catch (error) {
    throw new Error(`Failed to create advertiser: ${error.message}`);
  }
};
```

### Advertiser with Verification

```javascript
const createVerifiedAdvertiser = async (userData, documents) => {
  try {
    const advertiser = new Advertiser({
      user: userData.userId,
      businessName: userData.businessName,
      businessType: userData.businessType,
      description: userData.description,
      contact: userData.contact,
      verification: {
        isVerified: false,
        documents: documents.map(doc => ({
          type: doc.type,
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: new Date()
        }))
      }
    });

    await advertiser.save();
    return advertiser;
  } catch (error) {
    throw new Error(`Failed to create verified advertiser: ${error.message}`);
  }
};
```

## Managing Ad Campaigns

### Creating a Basic Ad Campaign

```javascript
const { AdCampaign } = require('../models/Ads');

const createAdCampaign = async (campaignData) => {
  try {
    const campaign = new AdCampaign({
      advertiser: campaignData.advertiserId,
      title: campaignData.title,
      description: campaignData.description,
      type: campaignData.type,
      category: campaignData.category,
      budget: {
        total: campaignData.budget.total,
        daily: campaignData.budget.daily,
        currency: campaignData.budget.currency || 'USD'
      },
      schedule: {
        startDate: new Date(campaignData.schedule.startDate),
        endDate: new Date(campaignData.schedule.endDate),
        timeSlots: campaignData.schedule.timeSlots || []
      },
      targetAudience: campaignData.targetAudience || {},
      content: campaignData.content || {},
      status: 'draft'
    });

    await campaign.save();
    return campaign;
  } catch (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }
};
```

### Creating a Featured Campaign

```javascript
const createFeaturedCampaign = async (campaignData, promotionData) => {
  try {
    const campaign = new AdCampaign({
      advertiser: campaignData.advertiserId,
      title: campaignData.title,
      description: campaignData.description,
      type: campaignData.type,
      category: campaignData.category,
      budget: campaignData.budget,
      schedule: campaignData.schedule,
      targetAudience: campaignData.targetAudience,
      content: campaignData.content,
      status: 'draft',
      isFeatured: true,
      promotion: {
        type: promotionData.type,
        duration: promotionData.duration,
        budget: promotionData.budget,
        startDate: new Date(),
        endDate: new Date(Date.now() + (promotionData.duration * 24 * 60 * 60 * 1000)),
        status: 'active'
      }
    });

    await campaign.save();
    return campaign;
  } catch (error) {
    throw new Error(`Failed to create featured campaign: ${error.message}`);
  }
};
```

### Updating Campaign Performance

```javascript
const updateCampaignPerformance = async (campaignId, performanceData) => {
  try {
    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Update performance metrics
    campaign.performance.impressions += performanceData.impressions || 0;
    campaign.performance.clicks += performanceData.clicks || 0;
    campaign.performance.conversions += performanceData.conversions || 0;
    campaign.performance.spend += performanceData.spend || 0;

    // Recalculate derived metrics
    campaign.performance.ctr = campaign.performance.impressions > 0 
      ? (campaign.performance.clicks / campaign.performance.impressions) * 100 
      : 0;
    
    campaign.performance.cpc = campaign.performance.clicks > 0 
      ? campaign.performance.spend / campaign.performance.clicks 
      : 0;
    
    campaign.performance.cpm = campaign.performance.impressions > 0 
      ? (campaign.performance.spend / campaign.performance.impressions) * 1000 
      : 0;

    // Update top-level metrics
    campaign.views += performanceData.views || 0;
    campaign.clicks += performanceData.clicks || 0;
    campaign.impressions += performanceData.impressions || 0;

    await campaign.save();
    return campaign;
  } catch (error) {
    throw new Error(`Failed to update campaign performance: ${error.message}`);
  }
};
```

## Tracking Impressions

### Recording Ad Impressions

```javascript
const { AdImpression } = require('../models/Ads');

const recordImpression = async (impressionData) => {
  try {
    const impression = new AdImpression({
      campaign: impressionData.campaignId,
      user: impressionData.userId, // Optional if user is logged in
      type: 'impression',
      context: {
        page: impressionData.page,
        section: impressionData.section,
        position: impressionData.position
      },
      device: impressionData.device,
      location: {
        ip: impressionData.ip,
        country: impressionData.country,
        city: impressionData.city
      }
    });

    await impression.save();
    return impression;
  } catch (error) {
    throw new Error(`Failed to record impression: ${error.message}`);
  }
};
```

### Recording Ad Clicks

```javascript
const recordClick = async (clickData) => {
  try {
    const click = new AdImpression({
      campaign: clickData.campaignId,
      user: clickData.userId,
      type: 'click',
      context: clickData.context,
      device: clickData.device,
      location: clickData.location
    });

    await click.save();
    
    // Update campaign click count
    await AdCampaign.findByIdAndUpdate(clickData.campaignId, {
      $inc: { clicks: 1 }
    });

    return click;
  } catch (error) {
    throw new Error(`Failed to record click: ${error.message}`);
  }
};
```

### Recording Conversions

```javascript
const recordConversion = async (conversionData) => {
  try {
    const conversion = new AdImpression({
      campaign: conversionData.campaignId,
      user: conversionData.userId,
      type: 'conversion',
      context: conversionData.context,
      device: conversionData.device,
      location: conversionData.location
    });

    await conversion.save();
    
    // Update campaign conversion count
    await AdCampaign.findByIdAndUpdate(conversionData.campaignId, {
      $inc: { 'performance.conversions': 1 }
    });

    return conversion;
  } catch (error) {
    throw new Error(`Failed to record conversion: ${error.message}`);
  }
};
```

## Querying and Filtering

### Basic Ad Queries

```javascript
// Get all active ads
const getActiveAds = async () => {
  return await AdCampaign.find({ isActive: true })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 });
};

// Get ads by category
const getAdsByCategory = async (category) => {
  return await AdCampaign.find({ 
    category: category,
    isActive: true 
  })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 });
};

// Get featured ads
const getFeaturedAds = async (limit = 10) => {
  return await AdCampaign.find({ 
    isFeatured: true,
    isActive: true 
  })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};
```

### Advanced Filtering

```javascript
const searchAds = async (filters) => {
  const query = { isActive: true };

  // Text search
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') }
    ];
  }

  // Category filter
  if (filters.category) {
    query.category = filters.category;
  }

  // Location filter
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }

  // Date range filter
  if (filters.startDate && filters.endDate) {
    query['schedule.startDate'] = { $gte: new Date(filters.startDate) };
    query['schedule.endDate'] = { $lte: new Date(filters.endDate) };
  }

  // Budget range filter
  if (filters.minBudget || filters.maxBudget) {
    query['budget.total'] = {};
    if (filters.minBudget) query['budget.total'].$gte = filters.minBudget;
    if (filters.maxBudget) query['budget.total'].$lte = filters.maxBudget;
  }

  return await AdCampaign.find(query)
    .populate('advertiser', 'firstName lastName profile.avatar businessName')
    .sort({ [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' });
};
```

### Paginated Queries

```javascript
const getPaginatedAds = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = buildQuery(filters);

  const [ads, total] = await Promise.all([
    AdCampaign.find(query)
      .populate('advertiser', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdCampaign.countDocuments(query)
  ]);

  return {
    ads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

### Analytics Queries

```javascript
// Get campaign performance analytics
const getCampaignAnalytics = async (campaignId, dateRange) => {
  const matchStage = { campaign: campaignId };
  
  if (dateRange.startDate && dateRange.endDate) {
    matchStage.timestamp = {
      $gte: new Date(dateRange.startDate),
      $lte: new Date(dateRange.endDate)
    };
  }

  const analytics = await AdImpression.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    }
  ]);

  return analytics;
};

// Get advertiser performance summary
const getAdvertiserPerformance = async (advertiserId) => {
  const campaigns = await AdCampaign.find({ advertiser: advertiserId });
  const campaignIds = campaigns.map(c => c._id);

  const performance = await AdImpression.aggregate([
    { $match: { campaign: { $in: campaignIds } } },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: { $cond: [{ $eq: ['$type', 'impression'] }, 1, 0] } },
        totalClicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } },
        totalConversions: { $sum: { $cond: [{ $eq: ['$type', 'conversion'] }, 1, 0] } }
      }
    }
  ]);

  return performance[0] || { totalImpressions: 0, totalClicks: 0, totalConversions: 0 };
};
```

## Performance Optimization

### Efficient Queries

```javascript
// Use select to limit fields
const getAdsSummary = async () => {
  return await AdCampaign.find({ isActive: true })
    .select('title type category status createdAt')
    .populate('advertiser', 'businessName')
    .sort({ createdAt: -1 });
};

// Use lean() for read-only operations
const getAdsForDisplay = async () => {
  return await AdCampaign.find({ isActive: true })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .lean()
    .sort({ createdAt: -1 });
};

// Use aggregation for complex queries
const getTopPerformingAds = async (limit = 10) => {
  return await AdCampaign.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        ctr: {
          $cond: [
            { $gt: ['$impressions', 0] },
            { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { ctr: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'advertisers',
        localField: 'advertiser',
        foreignField: '_id',
        as: 'advertiser',
        pipeline: [
          { $project: { firstName: 1, lastName: 1, 'profile.avatar': 1 } }
        ]
      }
    }
  ]);
};
```

### Caching Strategies

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache featured ads
const getCachedFeaturedAds = async () => {
  const cacheKey = 'featured_ads';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const ads = await AdCampaign.find({ isFeatured: true, isActive: true })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .lean();

  await client.setex(cacheKey, 300, JSON.stringify(ads)); // 5 minute cache
  return ads;
};

// Cache ad categories
const getCachedCategories = async () => {
  const cacheKey = 'ad_categories';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const categories = await AdCampaign.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  await client.setex(cacheKey, 600, JSON.stringify(categories)); // 10 minute cache
  return categories;
};
```

## Error Handling

### Validation Error Handling

```javascript
const createAdWithValidation = async (adData) => {
  try {
    const ad = new AdCampaign(adData);
    await ad.validate();
    await ad.save();
    return ad;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
    }
    throw error;
  }
};
```

### Database Error Handling

```javascript
const safeAdOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Duplicate entry found');
    }
    if (error.name === 'CastError') {
      throw new Error('Invalid ID format');
    }
    if (error.name === 'ValidationError') {
      throw new Error('Data validation failed');
    }
    throw new Error(`Database operation failed: ${error.message}`);
  }
};
```

## Best Practices

### 1. Data Validation

```javascript
// Always validate data before saving
const validateAdData = (adData) => {
  const errors = [];
  
  if (!adData.title || adData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!adData.budget || !adData.budget.total || adData.budget.total <= 0) {
    errors.push('Valid budget total is required');
  }
  
  if (!adData.schedule || !adData.schedule.startDate || !adData.schedule.endDate) {
    errors.push('Valid schedule dates are required');
  }
  
  if (new Date(adData.schedule.startDate) >= new Date(adData.schedule.endDate)) {
    errors.push('Start date must be before end date');
  }
  
  return errors;
};
```

### 2. Transaction Management

```javascript
const mongoose = require('mongoose');

const createAdWithTransaction = async (adData, impressionData) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const ad = new AdCampaign(adData);
      await ad.save({ session });
      
      const impression = new AdImpression(impressionData);
      await impression.save({ session });
    });
  } finally {
    await session.endSession();
  }
};
```

### 3. Soft Deletes

```javascript
// Use soft deletes instead of hard deletes
const softDeleteAd = async (adId) => {
  return await AdCampaign.findByIdAndUpdate(
    adId,
    { isActive: false },
    { new: true }
  );
};

// Filter out soft-deleted records
const getActiveAds = async () => {
  return await AdCampaign.find({ isActive: true });
};
```

### 4. Indexing Strategy

```javascript
// Ensure proper indexing for common queries
const createAdIndexes = async () => {
  await AdCampaign.collection.createIndex({ advertiser: 1 });
  await AdCampaign.collection.createIndex({ category: 1 });
  await AdCampaign.collection.createIndex({ status: 1 });
  await AdCampaign.collection.createIndex({ isActive: 1 });
  await AdCampaign.collection.createIndex({ isFeatured: 1 });
  await AdCampaign.collection.createIndex({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
  await AdCampaign.collection.createIndex({ title: 'text', description: 'text' });
};
```

### 5. Monitoring and Logging

```javascript
const logger = require('../utils/logger');

const logAdOperation = async (operation, adId, userId) => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.info('Ad operation completed', {
      operation,
      adId,
      userId,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Ad operation failed', {
      operation,
      adId,
      userId,
      duration,
      error: error.message,
      success: false
    });
    
    throw error;
  }
};
```

This comprehensive guide provides practical examples and best practices for working with the ads feature effectively and efficiently.
