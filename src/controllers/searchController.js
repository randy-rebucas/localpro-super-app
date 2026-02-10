const User = require('../models/User');
const Job = require('../models/Job');
const { Service: Marketplace } = require('../models/Marketplace');
const { Product: Supplies } = require('../../features/supplies');
const { Course } = require('../models/Academy');
const { RentalItem } = require('../models/Rentals');
const Agency = require('../models/Agency');
const logger = require('../config/logger');
const queryOptimizationService = require('../services/queryOptimizationService');

/**
 * Global Search Controller
 * Provides comprehensive search functionality across all entities in the LocalPro Super App
 */

/**
 * @desc    Global search across all entities
 * @route   GET /api/search
 * @access  Public
 */
const globalSearch = async (req, res) => {
  try {
    const { 
      q: query, 
      type, 
      category, 
      location, 
      minPrice, 
      maxPrice, 
      rating, 
      limit = 20, 
      page = 1,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;
    const searchResults = {
      query: searchQuery,
      totalResults: 0,
      results: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        limit: parseInt(limit)
      },
      filters: {
        type,
        category,
        location,
        minPrice,
        maxPrice,
        rating
      }
    };

    // Build search promises for each entity type
    const searchPromises = [];

    // Search Users (Providers)
    if (!type || type === 'users' || type === 'providers') {
      searchPromises.push(searchUsers(searchQuery, { category, location, rating, limit, skip }));
    }

    // Search Jobs
    if (!type || type === 'jobs') {
      searchPromises.push(searchJobs(searchQuery, { category, location, minPrice, maxPrice, limit, skip }));
    }

    // Search Marketplace Services
    if (!type || type === 'services' || type === 'marketplace') {
      searchPromises.push(searchServices(searchQuery, { category, location, minPrice, maxPrice, rating, limit, skip }));
    }

    // Search Supplies
    if (!type || type === 'supplies') {
      searchPromises.push(searchSupplies(searchQuery, { category, minPrice, maxPrice, limit, skip }));
    }

    // Search Academy Courses
    if (!type || type === 'courses' || type === 'academy') {
      searchPromises.push(searchCourses(searchQuery, { category, rating, limit, skip }));
    }

    // Search Rental Items
    if (!type || type === 'rentals') {
      searchPromises.push(searchRentals(searchQuery, { category, location, minPrice, maxPrice, rating, limit, skip }));
    }

    // Search Agencies
    if (!type || type === 'agencies') {
      searchPromises.push(searchAgencies(searchQuery, { category, location, rating, limit, skip }));
    }

    // Execute all searches in parallel
    const results = await Promise.all(searchPromises);

    // Combine and sort results
    let allResults = [];
    results.forEach(result => {
      if (result && result.results) {
        allResults = allResults.concat(result.results);
      }
    });

    // Sort results based on sortBy parameter
    allResults = sortResults(allResults, sortBy, sortOrder);

    // Apply pagination to combined results
    const totalResults = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + limit);

    searchResults.totalResults = totalResults;
    searchResults.results = paginatedResults;
    searchResults.pagination.totalPages = Math.ceil(totalResults / limit);
    searchResults.pagination.hasNext = page < searchResults.pagination.totalPages;
    searchResults.pagination.hasPrev = page > 1;

    logger.info('Global search completed', {
      query: searchQuery,
      totalResults,
      filters: searchResults.filters,
      userId: req.user?.id
    });

    res.status(200).json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    logger.error('Global search error', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Search failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search Users/Providers
 */
const searchUsers = async (query, filters = {}) => {
  try {
    // Create optimized search query using query optimization service
    const searchQuery = queryOptimizationService.createCompoundQuery({
      roles: { $in: ['provider', 'supplier', 'instructor'] },
      isVerified: true,
      search: query,
      textFields: ['firstName', 'lastName', 'profile.bio', 'profile.businessName', 'profile.skills', 'profile.specialties'],
      category: filters.category,
      categoryField: 'profile.specialties',
      location: filters.location,
      locationField: 'profile.address.city',
      minRating: filters.rating,
      ratingField: 'profile.rating'
    });

    // Use optimized query execution with caching
    const users = await queryOptimizationService.executeOptimizedQuery(
      User,
      searchQuery,
      {
        select: 'firstName lastName profile role isVerified',
        limit: filters.limit || 20,
        skip: filters.skip || 0,
        collection: 'users',
        useCache: true
      }
    );

    return {
      type: 'users',
      results: users.map(user => ({
        id: user._id,
        type: 'user',
        title: `${user.firstName} ${user.lastName}`,
        subtitle: user.profile?.businessName || user.profile?.bio || 'Service Provider',
        description: user.profile?.bio,
        category: user.profile?.specialties?.[0] || 'General Services',
        location: user.profile?.address?.city,
        rating: user.profile?.rating || 0,
        isVerified: user.isVerified,
        image: user.profile?.avatar?.url,
        url: `/providers/${user._id}`,
        relevanceScore: calculateRelevanceScore(query, user)
      }))
    };
  } catch (error) {
    logger.error('User search error', { error: error.message, query, filters });
    return { type: 'users', results: [] };
  }
};

/**
 * Search Jobs
 */
const searchJobs = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true,
      status: { $in: ['active', 'featured'] }
    };

    // Text search (only on string fields, not ObjectId references like category)
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'company.name': { $regex: query, $options: 'i' } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.location) {
      searchQuery.$or.push(
        { 'company.location.city': { $regex: filters.location, $options: 'i' } },
        { 'company.location.isRemote': true }
      );
    }

    if (filters.minPrice || filters.maxPrice) {
      searchQuery['salary.min'] = {};
      if (filters.minPrice) searchQuery['salary.min'].$gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) searchQuery['salary.min'].$lte = parseFloat(filters.maxPrice);
    }

    const jobs = await Job.find(searchQuery)
      .populate('employer', 'firstName lastName profile.businessName')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'jobs',
      results: jobs.map(job => ({
        id: job._id,
        type: 'job',
        title: job.title,
        subtitle: job.company.name,
        description: job.description,
        category: job.category,
        location: job.company.location.city,
        isRemote: job.company.location.isRemote,
        salary: job.getSalaryDisplay ? job.getSalaryDisplay() : 'Salary not specified',
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        image: job.company.logo?.url,
        url: `/jobs/${job._id}`,
        relevanceScore: calculateRelevanceScore(query, job)
      }))
    };
  } catch (error) {
    logger.error('Job search error', { error: error.message, query, filters });
    return { type: 'jobs', results: [] };
  }
};

/**
 * Search Marketplace Services
 */
const searchServices = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true
    };

    // Text search (only on string fields, not ObjectId references like category)
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { features: { $in: [new RegExp(query, 'i')] } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.location) {
      // Use serviceAreaHelper for better location filtering
      const { buildServiceAreaQuery } = require('../utils/serviceAreaHelper');
      const serviceAreaQuery = buildServiceAreaQuery({
        location: filters.location,
        coordinates: filters.coordinates || null,
        maxDistance: filters.maxDistance || null
      });
      
      if (Object.keys(serviceAreaQuery).length > 0) {
        Object.assign(searchQuery, serviceAreaQuery);
      }
    }

    if (filters.minPrice || filters.maxPrice) {
      searchQuery['pricing.basePrice'] = {};
      if (filters.minPrice) searchQuery['pricing.basePrice'].$gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) searchQuery['pricing.basePrice'].$lte = parseFloat(filters.maxPrice);
    }

    if (filters.rating) {
      searchQuery['rating.average'] = { $gte: parseFloat(filters.rating) };
    }

    const services = await Marketplace.find(searchQuery)
      .populate('provider', 'firstName lastName profile.businessName profile.rating')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'services',
      results: services.map(service => ({
        id: service._id,
        type: 'service',
        title: service.title,
        subtitle: service.provider?.profile?.businessName || `${service.provider?.firstName} ${service.provider?.lastName}`,
        description: service.description,
        category: service.category,
        location: service.serviceArea?.[0],
        price: `${service.pricing.basePrice} ${service.pricing.currency}/${service.pricing.type}`,
        rating: service.rating?.average || 0,
        image: service.images?.[0]?.url,
        url: `/marketplace/${service._id}`,
        relevanceScore: calculateRelevanceScore(query, service)
      }))
    };
  } catch (error) {
    logger.error('Service search error', { error: error.message, query, filters });
    return { type: 'services', results: [] };
  }
};

/**
 * Search Supplies
 */
const searchSupplies = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true
    };

    // Text search (only on string fields, not ObjectId references like category)
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.minPrice || filters.maxPrice) {
      searchQuery['pricing.retailPrice'] = {};
      if (filters.minPrice) searchQuery['pricing.retailPrice'].$gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) searchQuery['pricing.retailPrice'].$lte = parseFloat(filters.maxPrice);
    }

    const supplies = await Supplies.find(searchQuery)
      .populate('supplier', 'firstName lastName profile.businessName')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'supplies',
      results: supplies.map(supply => ({
        id: supply._id,
        type: 'supply',
        title: supply.name,
        subtitle: supply.brand,
        description: supply.description,
        category: supply.category,
        price: `${supply.pricing.retailPrice} ${supply.pricing.currency}`,
        inStock: supply.inventory.quantity > 0,
        stockQuantity: supply.inventory.quantity,
        image: supply.images?.[0]?.url,
        url: `/supplies/${supply._id}`,
        relevanceScore: calculateRelevanceScore(query, supply)
      }))
    };
  } catch (error) {
    logger.error('Supply search error', { error: error.message, query, filters });
    return { type: 'supplies', results: [] };
  }
};

/**
 * Search Academy Courses
 */
const searchCourses = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true
    };

    // Text search (only on string fields, not ObjectId references like category)
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { learningOutcomes: { $in: [new RegExp(query, 'i')] } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.rating) {
      searchQuery['rating.average'] = { $gte: parseFloat(filters.rating) };
    }

    const courses = await Course.find(searchQuery)
      .populate('instructor', 'firstName lastName profile.businessName')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'courses',
      results: courses.map(course => ({
        id: course._id,
        type: 'course',
        title: course.title,
        subtitle: course.instructor?.profile?.businessName || `${course.instructor?.firstName} ${course.instructor?.lastName}`,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: `${course.duration.hours} hours`,
        price: course.pricing.discountedPrice || course.pricing.regularPrice,
        currency: course.pricing.currency,
        rating: course.rating?.average || 0,
        enrollmentCount: course.enrollment?.current || 0,
        image: course.thumbnail?.url,
        url: `/academy/courses/${course._id}`,
        relevanceScore: calculateRelevanceScore(query, course)
      }))
    };
  } catch (error) {
    logger.error('Course search error', { error: error.message, query, filters });
    return { type: 'courses', results: [] };
  }
};

/**
 * Search Rental Items
 */
const searchRentals = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true,
      'availability.isAvailable': true
    };

    // Text search (only on string fields, not ObjectId references like category)
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'specifications.brand': { $regex: query, $options: 'i' } },
      { 'specifications.model': { $regex: query, $options: 'i' } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.location) {
      searchQuery['location.address.city'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceQuery = {};
      if (filters.minPrice) priceQuery.$gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) priceQuery.$lte = parseFloat(filters.maxPrice);
      
      searchQuery.$or = [
        { 'pricing.hourly': priceQuery },
        { 'pricing.daily': priceQuery },
        { 'pricing.weekly': priceQuery },
        { 'pricing.monthly': priceQuery }
      ];
    }

    if (filters.rating) {
      searchQuery['rating.average'] = { $gte: parseFloat(filters.rating) };
    }

    const rentals = await RentalItem.find(searchQuery)
      .populate('owner', 'firstName lastName profile.businessName')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'rentals',
      results: rentals.map(rental => ({
        id: rental._id,
        type: 'rental',
        title: rental.name,
        subtitle: rental.specifications?.brand || rental.owner?.profile?.businessName,
        description: rental.description,
        category: rental.category,
        location: rental.location?.address?.city,
        price: getRentalPriceRange(rental.pricing),
        rating: rental.rating?.average || 0,
        condition: rental.specifications?.condition,
        image: rental.images?.[0]?.url,
        url: `/rentals/${rental._id}`,
        relevanceScore: calculateRelevanceScore(query, rental)
      }))
    };
  } catch (error) {
    logger.error('Rental search error', { error: error.message, query, filters });
    return { type: 'rentals', results: [] };
  }
};

/**
 * Search Agencies
 */
const searchAgencies = async (query, filters = {}) => {
  try {
    const searchQuery = {
      isActive: true
    };

    // Text search
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'contact.address.city': { $regex: query, $options: 'i' } },
      { 'services.category': { $in: [new RegExp(query, 'i')] } }
    ];

    // Apply filters
    if (filters.category) {
      searchQuery['services.category'] = filters.category;
    }

    if (filters.location) {
      searchQuery.$or.push(
        { 'contact.address.city': { $regex: filters.location, $options: 'i' } },
        { 'serviceAreas.name': { $in: [new RegExp(filters.location, 'i')] } }
      );
    }

    if (filters.rating) {
      searchQuery['analytics.averageRating'] = { $gte: parseFloat(filters.rating) };
    }

    const agencies = await Agency.find(searchQuery)
      .populate('owner', 'firstName lastName profile.businessName')
      .limit(filters.limit || 20)
      .skip(filters.skip || 0)
      .lean();

    return {
      type: 'agencies',
      results: agencies.map(agency => ({
        id: agency._id,
        type: 'agency',
        title: agency.name,
        subtitle: `${agency.providers?.length || 0} providers`,
        description: agency.description,
        category: agency.services?.[0]?.category || 'General Services',
        location: agency.contact?.address?.city,
        rating: agency.analytics?.averageRating || 0,
        providerCount: agency.providers?.length || 0,
        isVerified: agency.verification?.isVerified || false,
        url: `/agencies/${agency._id}`,
        relevanceScore: calculateRelevanceScore(query, agency)
      }))
    };
  } catch (error) {
    logger.error('Agency search error', { error: error.message, query, filters });
    return { type: 'agencies', results: [] };
  }
};

/**
 * Get search suggestions/autocomplete
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    const searchQuery = query.trim();
    const suggestions = [];

    // Get suggestions from different entities
    const [userSuggestions, jobSuggestions, serviceSuggestions, courseSuggestions] = await Promise.all([
      // User suggestions
      User.find({
        roles: { $in: ['provider', 'supplier', 'instructor'] },
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { 'profile.businessName': { $regex: searchQuery, $options: 'i' } },
          { 'profile.specialties': { $in: [new RegExp(searchQuery, 'i')] } }
        ]
      }).select('firstName lastName profile.businessName profile.specialties').limit(5).lean(),

      // Job suggestions (only search string fields, not ObjectId references)
      Job.find({
        isActive: true,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { 'company.name': { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('title category company.name').limit(5).lean(),

      // Service suggestions (only search string fields, not ObjectId references)
      Marketplace.find({
        isActive: true,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('title category').limit(5).lean(),

      // Course suggestions (only search string fields, not ObjectId references)
      Course.find({
        isActive: true,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('title category').limit(5).lean()
    ]);

    // Process suggestions
    userSuggestions.forEach(user => {
      suggestions.push({
        text: user.profile?.businessName || `${user.firstName} ${user.lastName}`,
        type: 'user',
        category: user.profile?.specialties?.[0] || 'Provider'
      });
    });

    jobSuggestions.forEach(job => {
      suggestions.push({
        text: job.title,
        type: 'job',
        category: job.category
      });
    });

    serviceSuggestions.forEach(service => {
      suggestions.push({
        text: service.title,
        type: 'service',
        category: service.category
      });
    });

    courseSuggestions.forEach(course => {
      suggestions.push({
        text: course.title,
        type: 'course',
        category: course.category
      });
    });

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        query: searchQuery,
        suggestions: uniqueSuggestions
      }
    });

  } catch (error) {
    logger.error('Search suggestions error', {
      error: error.message,
      query: req.query,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get popular search terms
 */
const getPopularSearches = async (req, res) => {
  try {
    // In a real application, you might want to track search analytics
    // For now, we'll return some popular terms based on common categories
    const popularSearches = [
      { term: 'cleaning services', count: 1250, category: 'services' },
      { term: 'plumbing', count: 980, category: 'services' },
      { term: 'electrical work', count: 850, category: 'services' },
      { term: 'moving services', count: 720, category: 'services' },
      { term: 'landscaping', count: 650, category: 'services' },
      { term: 'painting', count: 580, category: 'services' },
      { term: 'carpentry', count: 520, category: 'services' },
      { term: 'hvac', count: 480, category: 'services' },
      { term: 'cleaning supplies', count: 420, category: 'supplies' },
      { term: 'tools', count: 380, category: 'rentals' },
      { term: 'certification courses', count: 350, category: 'courses' },
      { term: 'part time jobs', count: 320, category: 'jobs' }
    ];

    res.status(200).json({
      success: true,
      data: {
        popularSearches: popularSearches.slice(0, req.query.limit || 12)
      }
    });

  } catch (error) {
    logger.error('Popular searches error', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to calculate relevance score
 */
const calculateRelevanceScore = (query, item) => {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Title matches get highest score
  if (item.title && item.title.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Name matches get high score
  if (item.name && item.name.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Business name matches
  if (item.profile?.businessName && item.profile.businessName.toLowerCase().includes(queryLower)) {
    score += 8;
  }

  // Category matches
  if (item.category && item.category.toLowerCase().includes(queryLower)) {
    score += 6;
  }

  // Description matches
  if (item.description && item.description.toLowerCase().includes(queryLower)) {
    score += 4;
  }

  // Skills/specialties matches
  if (item.profile?.skills && item.profile.skills.some(skill => skill.toLowerCase().includes(queryLower))) {
    score += 5;
  }

  if (item.profile?.specialties && item.profile.specialties.some(specialty => specialty.toLowerCase().includes(queryLower))) {
    score += 5;
  }

  // Boost for verified users
  if (item.isVerified) {
    score += 2;
  }

  // Boost for high ratings
  if (item.rating && item.rating >= 4) {
    score += 2;
  }

  return score;
};

/**
 * Helper function to sort results
 */
const sortResults = (results, sortBy, sortOrder) => {
  const order = sortOrder === 'desc' ? -1 : 1;

  switch (sortBy) {
    case 'relevance':
      return results.sort((a, b) => (b.relevanceScore - a.relevanceScore) * order);
    case 'rating':
      return results.sort((a, b) => (b.rating - a.rating) * order);
    case 'price_low':
      return results.sort((a, b) => {
        const priceA = extractPrice(a.price) || 0;
        const priceB = extractPrice(b.price) || 0;
        return (priceA - priceB) * order;
      });
    case 'price_high':
      return results.sort((a, b) => {
        const priceA = extractPrice(a.price) || 0;
        const priceB = extractPrice(b.price) || 0;
        return (priceB - priceA) * order;
      });
    case 'newest':
      return results.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * order);
    default:
      return results.sort((a, b) => (b.relevanceScore - a.relevanceScore) * order);
  }
};

/**
 * Helper function to extract price from string
 */
const extractPrice = (priceString) => {
  if (!priceString) return 0;
  const match = priceString.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Helper function to get rental price range
 */
const getRentalPriceRange = (pricing) => {
  const prices = [];
  if (pricing.hourly) prices.push(`${pricing.hourly}/hour`);
  if (pricing.daily) prices.push(`${pricing.daily}/day`);
  if (pricing.weekly) prices.push(`${pricing.weekly}/week`);
  if (pricing.monthly) prices.push(`${pricing.monthly}/month`);
  
  return prices.length > 0 ? prices.join(', ') : 'Price on request';
};

module.exports = {
  globalSearch,
  getSearchSuggestions,
  getPopularSearches
};
