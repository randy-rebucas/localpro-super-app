const express = require('express');
const router = express.Router();
const {
  globalSearch,
  getSearchSuggestions,
  getPopularSearches
} = require('../controllers/searchController');
const { auth: authenticate } = require('../../../src/middleware/auth');
const { searchLimiter } = require('../../../src/middleware/rateLimiter');
const { auditGeneralOperations } = require('../../../src/middleware/auditLogger');
const logger = require('../../../src/config/logger');

router.get('/', searchLimiter, globalSearch);
router.get('/suggestions', searchLimiter, getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.get('/advanced', searchLimiter, globalSearch);
router.get('/entities/:type', globalSearch);

router.get('/categories', (req, res) => {
  try {
    const categories = {
      services: [
        'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
        'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
        'appliance_repair', 'locksmith', 'handyman', 'home_security',
        'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
        'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
      ],
      jobs: [
        'technology', 'healthcare', 'education', 'finance', 'marketing',
        'sales', 'customer_service', 'human_resources', 'operations',
        'design', 'engineering', 'construction', 'maintenance', 'cleaning',
        'security', 'transportation', 'food_service', 'retail', 'hospitality', 'other'
      ],
      supplies: [
        'cleaning_supplies', 'tools', 'materials', 'equipment'
      ],
      courses: [
        'cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'
      ],
      rentals: [
        'tools', 'vehicles', 'equipment', 'machinery'
      ],
      agencies: [
        'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
        'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
        'appliance_repair', 'locksmith', 'handyman', 'home_security',
        'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
        'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
      ]
    };

    res.status(200).json({
      success: true,
      data: {
        categories,
        entityTypes: [
          { value: 'users', label: 'Service Providers', description: 'Find verified service providers' },
          { value: 'jobs', label: 'Job Opportunities', description: 'Browse available job positions' },
          { value: 'services', label: 'Services', description: 'Discover marketplace services' },
          { value: 'supplies', label: 'Supplies & Equipment', description: 'Find tools and supplies' },
          { value: 'courses', label: 'Training Courses', description: 'Professional development courses' },
          { value: 'rentals', label: 'Equipment Rentals', description: 'Rent tools and equipment' },
          { value: 'agencies', label: 'Service Agencies', description: 'Connect with service agencies' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/locations', (req, res) => {
  try {
    const { q: query } = req.query;
    const popularLocations = [];
    let filteredLocations = popularLocations;
    
    if (query) {
      const queryLower = query.toLowerCase();
      filteredLocations = popularLocations.filter(location => 
        location.name.toLowerCase().includes(queryLower) ||
        location.country.toLowerCase().includes(queryLower)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        locations: filteredLocations.slice(0, req.query.limit || 20)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/trending', (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const trendingSearches = [
      { term: 'holiday cleaning', count: 250, growth: 45.2, category: 'services' },
      { term: 'emergency plumbing', count: 180, growth: 32.1, category: 'services' },
      { term: 'home renovation', count: 150, growth: 28.5, category: 'services' },
      { term: 'remote jobs', count: 220, growth: 38.7, category: 'jobs' },
      { term: 'cleaning certification', count: 120, growth: 25.3, category: 'courses' },
      { term: 'power tools rental', count: 95, growth: 22.1, category: 'rentals' },
      { term: 'eco-friendly supplies', count: 85, growth: 19.8, category: 'supplies' },
      { term: 'agency partnership', count: 75, growth: 17.2, category: 'agencies' }
    ];

    res.status(200).json({
      success: true,
      data: {
        period,
        trending: trendingSearches.slice(0, req.query.limit || 10)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/analytics', authenticate, auditGeneralOperations, (req, res) => {
  try {
    const { query, results, filters, userId, timestamp } = req.body;

    logger.info('Search Analytics:', {
      query,
      resultsCount: results?.length || 0,
      filters,
      userId,
      timestamp: timestamp || new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Search analytics tracked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track search analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
