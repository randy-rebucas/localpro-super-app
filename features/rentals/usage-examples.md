# Rentals Usage Examples

This document provides practical examples and implementation patterns for working with the rentals feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Creating Rental Items](#creating-rental-items)
- [Managing Bookings](#managing-bookings)
- [Handling Reviews](#handling-reviews)
- [Search and Filtering](#search-and-filtering)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)

## Overview

This guide demonstrates how to effectively use the rentals feature in your application, including common patterns, optimization techniques, and best practices.

## Creating Rental Items

### Basic Rental Item Creation

```javascript
const { RentalItem } = require('../models/Rentals');

// Create a new rental item
const createRentalItem = async (itemData) => {
  try {
    const rentalItem = new RentalItem({
      name: itemData.name,
      title: itemData.title,
      description: itemData.description,
      category: itemData.category,
      subcategory: itemData.subcategory,
      owner: itemData.ownerId,
      pricing: {
        hourly: itemData.pricing.hourly,
        daily: itemData.pricing.daily,
        weekly: itemData.pricing.weekly,
        monthly: itemData.pricing.monthly,
        currency: itemData.pricing.currency || 'USD'
      },
      location: {
        address: itemData.location.address,
        coordinates: itemData.location.coordinates,
        pickupRequired: itemData.location.pickupRequired || true,
        deliveryAvailable: itemData.location.deliveryAvailable || false,
        deliveryFee: itemData.location.deliveryFee
      },
      specifications: {
        brand: itemData.specifications.brand,
        model: itemData.specifications.model,
        year: itemData.specifications.year,
        condition: itemData.specifications.condition || 'good',
        features: itemData.specifications.features || [],
        dimensions: itemData.specifications.dimensions,
        weight: itemData.specifications.weight
      },
      requirements: {
        minAge: itemData.requirements.minAge,
        licenseRequired: itemData.requirements.licenseRequired || false,
        licenseType: itemData.requirements.licenseType,
        deposit: itemData.requirements.deposit,
        insuranceRequired: itemData.requirements.insuranceRequired || false
      },
      tags: itemData.tags || []
    });

    await rentalItem.save();
    return rentalItem;
  } catch (error) {
    throw new Error(`Failed to create rental item: ${error.message}`);
  }
};
```

### Rental Item with Geocoding

```javascript
const GoogleMapsService = require('../services/googleMapsService');

const createRentalItemWithGeocoding = async (itemData) => {
  try {
    // Geocode location if address is provided
    if (itemData.location?.address?.street) {
      const address = `${itemData.location.address.street}, ${itemData.location.address.city}, ${itemData.location.address.state}`;
      const geocodeResult = await GoogleMapsService.geocodeAddress(address);
      
      if (geocodeResult.success && geocodeResult.data.length > 0) {
        const location = geocodeResult.data[0];
        itemData.location.coordinates = {
          lat: location.geometry.location.lat,
          lng: location.geometry.location.lng
        };
      }
    }

    const rentalItem = new RentalItem(itemData);
    await rentalItem.save();
    return rentalItem;
  } catch (error) {
    throw new Error(`Failed to create rental item with geocoding: ${error.message}`);
  }
};
```

### Rental Item with Images

```javascript
const CloudinaryService = require('../services/cloudinaryService');

const createRentalItemWithImages = async (itemData, imageFiles) => {
  try {
    const rentalItem = new RentalItem(itemData);
    await rentalItem.save();

    // Upload images
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(file => 
        CloudinaryService.uploadFile(file, 'localpro/rentals')
      );

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults
        .filter(result => result.success)
        .map(result => ({
          url: result.data.secure_url,
          publicId: result.data.public_id,
          thumbnail: result.data.thumbnail_url
        }));

      rentalItem.images = successfulUploads;
      await rentalItem.save();
    }

    return rentalItem;
  } catch (error) {
    throw new Error(`Failed to create rental item with images: ${error.message}`);
  }
};
```

## Managing Bookings

### Creating a Booking

```javascript
const createBooking = async (rentalItemId, bookingData, userId) => {
  try {
    const rentalItem = await RentalItem.findById(rentalItemId);
    if (!rentalItem) {
      throw new Error('Rental item not found');
    }

    // Check availability
    const isAvailable = checkAvailability(rentalItem, bookingData.startDate, bookingData.endDate);
    if (!isAvailable) {
      throw new Error('Rental item is not available for the selected dates');
    }

    // Calculate total cost
    const days = Math.ceil((new Date(bookingData.endDate) - new Date(bookingData.startDate)) / (1000 * 60 * 60 * 24));
    const totalCost = rentalItem.pricing.daily * days * (bookingData.quantity || 1);

    const booking = {
      user: userId,
      startDate: new Date(bookingData.startDate),
      endDate: new Date(bookingData.endDate),
      quantity: bookingData.quantity || 1,
      totalCost,
      specialRequests: bookingData.specialRequests,
      contactInfo: bookingData.contactInfo,
      status: 'pending'
    };

    rentalItem.bookings.push(booking);
    await rentalItem.save();

    return booking;
  } catch (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};
```

### Checking Availability

```javascript
const checkAvailability = (rentalItem, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if item is active and available
  if (!rentalItem.isActive || !rentalItem.availability.isAvailable) {
    return false;
  }

  // Check against existing bookings
  const conflictingBookings = rentalItem.bookings.filter(booking => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    return booking.status === 'confirmed' || booking.status === 'active' &&
           (start < bookingEnd && end > bookingStart);
  });

  return conflictingBookings.length === 0;
};
```

### Updating Booking Status

```javascript
const updateBookingStatus = async (rentalItemId, bookingId, newStatus, userId) => {
  try {
    const rentalItem = await RentalItem.findById(rentalItemId);
    if (!rentalItem) {
      throw new Error('Rental item not found');
    }

    // Check if user is the owner
    if (rentalItem.owner.toString() !== userId) {
      throw new Error('Not authorized to update booking status');
    }

    const booking = rentalItem.bookings.id(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.status = newStatus;
    booking.updatedAt = new Date();
    await rentalItem.save();

    return booking;
  } catch (error) {
    throw new Error(`Failed to update booking status: ${error.message}`);
  }
};
```

## Handling Reviews

### Adding a Review

```javascript
const addReview = async (rentalItemId, reviewData, userId) => {
  try {
    const rentalItem = await RentalItem.findById(rentalItemId);
    if (!rentalItem) {
      throw new Error('Rental item not found');
    }

    // Check if user has completed a booking
    const hasCompletedBooking = rentalItem.bookings.some(booking => 
      booking.user.toString() === userId && 
      booking.status === 'completed'
    );

    if (!hasCompletedBooking) {
      throw new Error('You can only review items you have rented and completed');
    }

    // Check if user has already reviewed
    const existingReview = rentalItem.reviews.find(review => 
      review.user.toString() === userId
    );

    if (existingReview) {
      throw new Error('You have already reviewed this item');
    }

    const review = {
      user: userId,
      rating: reviewData.rating,
      comment: reviewData.comment
    };

    rentalItem.reviews.push(review);

    // Update average rating
    const totalRating = rentalItem.reviews.reduce((sum, review) => sum + review.rating, 0);
    rentalItem.averageRating = totalRating / rentalItem.reviews.length;
    rentalItem.rating.average = rentalItem.averageRating;
    rentalItem.rating.count = rentalItem.reviews.length;

    await rentalItem.save();
    return review;
  } catch (error) {
    throw new Error(`Failed to add review: ${error.message}`);
  }
};
```

### Getting Reviews with User Details

```javascript
const getRentalItemReviews = async (rentalItemId) => {
  try {
    const rentalItem = await RentalItem.findById(rentalItemId)
      .populate('reviews.user', 'firstName lastName profile.avatar')
      .select('reviews averageRating rating');

    if (!rentalItem) {
      throw new Error('Rental item not found');
    }

    return {
      reviews: rentalItem.reviews,
      averageRating: rentalItem.averageRating,
      totalReviews: rentalItem.rating.count
    };
  } catch (error) {
    throw new Error(`Failed to get reviews: ${error.message}`);
  }
};
```

## Search and Filtering

### Basic Search

```javascript
const searchRentalItems = async (searchParams) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = searchParams;

    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter['location.address.city'] = new RegExp(location, 'i');
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['pricing.daily'] = {};
      if (minPrice) filter['pricing.daily'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.daily'].$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const rentalItems = await RentalItem.find(filter)
      .populate('owner', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await RentalItem.countDocuments(filter);

    return {
      rentalItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to search rental items: ${error.message}`);
  }
};
```

### Geospatial Search

```javascript
const findNearbyRentalItems = async (lat, lng, radius = 10, filters = {}) => {
  try {
    const query = {
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    };

    // Apply additional filters
    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.minPrice || filters.maxPrice) {
      query['pricing.daily'] = {};
      if (filters.minPrice) query['pricing.daily'].$gte = Number(filters.minPrice);
      if (filters.maxPrice) query['pricing.daily'].$lte = Number(filters.maxPrice);
    }

    const rentalItems = await RentalItem.find(query)
      .populate('owner', 'firstName lastName profile.avatar')
      .limit(filters.limit || 20);

    return rentalItems;
  } catch (error) {
    throw new Error(`Failed to find nearby rental items: ${error.message}`);
  }
};
```

### Advanced Filtering

```javascript
const advancedSearch = async (filters) => {
  try {
    const query = { isActive: true };

    // Text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Category and subcategory
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.subcategory) {
      query.subcategory = filters.subcategory;
    }

    // Price range
    if (filters.minPrice || filters.maxPrice) {
      query['pricing.daily'] = {};
      if (filters.minPrice) query['pricing.daily'].$gte = Number(filters.minPrice);
      if (filters.maxPrice) query['pricing.daily'].$lte = Number(filters.maxPrice);
    }

    // Condition filter
    if (filters.condition) {
      query['specifications.condition'] = filters.condition;
    }

    // Brand filter
    if (filters.brand) {
      query['specifications.brand'] = new RegExp(filters.brand, 'i');
    }

    // Features filter
    if (filters.features && filters.features.length > 0) {
      query['specifications.features'] = { $in: filters.features };
    }

    // Rating filter
    if (filters.minRating) {
      query.averageRating = { $gte: Number(filters.minRating) };
    }

    // Availability filter
    if (filters.availableOnly) {
      query['availability.isAvailable'] = true;
    }

    // Featured filter
    if (filters.featuredOnly) {
      query.isFeatured = true;
    }

    const rentalItems = await RentalItem.find(query)
      .populate('owner', 'firstName lastName profile.avatar profile.rating')
      .sort({ [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' })
      .skip((filters.page - 1) * (filters.limit || 10))
      .limit(filters.limit || 10);

    return rentalItems;
  } catch (error) {
    throw new Error(`Failed to perform advanced search: ${error.message}`);
  }
};
```

## Performance Optimization

### Efficient Queries

```javascript
// Use select to limit fields
const getRentalItemsSummary = async () => {
  return await RentalItem.find({ isActive: true })
    .select('name title category pricing rating averageRating isFeatured')
    .populate('owner', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 });
};

// Use lean() for read-only operations
const getRentalItemsForDisplay = async () => {
  return await RentalItem.find({ isActive: true })
    .populate('owner', 'firstName lastName profile.avatar')
    .lean()
    .sort({ createdAt: -1 });
};

// Use aggregation for complex queries
const getTopRatedRentalItems = async (limit = 10) => {
  return await RentalItem.aggregate([
    { $match: { isActive: true, averageRating: { $gte: 4.0 } } },
    { $sort: { averageRating: -1, 'rating.count': -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
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

// Cache featured rental items
const getCachedFeaturedRentals = async () => {
  const cacheKey = 'featured_rentals';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const rentals = await RentalItem.find({ isFeatured: true, isActive: true })
    .populate('owner', 'firstName lastName profile.avatar')
    .lean();

  await client.setex(cacheKey, 300, JSON.stringify(rentals)); // 5 minute cache
  return rentals;
};

// Cache rental categories
const getCachedCategories = async () => {
  const cacheKey = 'rental_categories';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const categories = await RentalItem.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  await client.setex(cacheKey, 600, JSON.stringify(categories)); // 10 minute cache
  return categories;
};
```

### Pagination Optimization

```javascript
const getPaginatedRentalItems = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = buildQuery(filters);

  const [rentalItems, total] = await Promise.all([
    RentalItem.find(query)
      .populate('owner', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RentalItem.countDocuments(query)
  ]);

  return {
    rentalItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## Error Handling

### Validation Error Handling

```javascript
const createRentalItemWithValidation = async (itemData) => {
  try {
    const rentalItem = new RentalItem(itemData);
    await rentalItem.validate();
    await rentalItem.save();
    return rentalItem;
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
const safeRentalOperation = async (operation) => {
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
const validateRentalItemData = (itemData) => {
  const errors = [];
  
  if (!itemData.name || itemData.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!itemData.category || !['tools', 'vehicles', 'equipment', 'machinery'].includes(itemData.category)) {
    errors.push('Valid category is required');
  }
  
  if (!itemData.pricing || !itemData.pricing.daily || itemData.pricing.daily <= 0) {
    errors.push('Valid daily pricing is required');
  }
  
  if (itemData.requirements?.minAge && itemData.requirements.minAge < 18) {
    errors.push('Minimum age must be at least 18');
  }
  
  return errors;
};
```

### 2. Transaction Management

```javascript
const mongoose = require('mongoose');

const createRentalWithBooking = async (rentalData, bookingData) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const rentalItem = new RentalItem(rentalData);
      await rentalItem.save({ session });
      
      const booking = {
        user: bookingData.userId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalCost: bookingData.totalCost,
        status: 'pending'
      };
      
      rentalItem.bookings.push(booking);
      await rentalItem.save({ session });
    });
  } finally {
    await session.endSession();
  }
};
```

### 3. Soft Deletes

```javascript
// Use soft deletes instead of hard deletes
const softDeleteRentalItem = async (rentalItemId) => {
  return await RentalItem.findByIdAndUpdate(
    rentalItemId,
    { isActive: false },
    { new: true }
  );
};

// Filter out soft-deleted records
const getActiveRentalItems = async () => {
  return await RentalItem.find({ isActive: true });
};
```

### 4. Monitoring and Logging

```javascript
const logger = require('../utils/logger');

const logRentalOperation = async (operation, rentalItemId, userId) => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.info('Rental operation completed', {
      operation,
      rentalItemId,
      userId,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Rental operation failed', {
      operation,
      rentalItemId,
      userId,
      duration,
      error: error.message,
      success: false
    });
    
    throw error;
  }
};
```

This comprehensive guide provides practical examples and best practices for working with the rentals feature effectively and efficiently.
