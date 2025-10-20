const express = require('express');
const router = express.Router();
const {
  globalSearch,
  getSearchSuggestions,
  getPopularSearches
} = require('../controllers/searchController');
const { auth: authenticate } = require('../middleware/auth');
const { auditGeneralOperations } = require('../middleware/auditLogger');

/**
 * @route   GET /api/search
 * @desc    Global search across all entities
 * @access  Public
 * @query   q, type, category, location, minPrice, maxPrice, rating, limit, page, sortBy, sortOrder
 * 
 * Query Parameters:
 * - q (required): Search query string (min 2 characters)
 * - type (optional): Filter by entity type (users, jobs, services, supplies, courses, rentals, agencies)
 * - category (optional): Filter by category
 * - location (optional): Filter by location/city
 * - minPrice (optional): Minimum price filter
 * - maxPrice (optional): Maximum price filter
 * - rating (optional): Minimum rating filter
 * - limit (optional): Number of results per page (default: 20, max: 100)
 * - page (optional): Page number (default: 1)
 * - sortBy (optional): Sort field (relevance, rating, price_low, price_high, newest)
 * - sortOrder (optional): Sort order (asc, desc, default: desc)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "query": "search term",
 *     "totalResults": 150,
 *     "results": [...],
 *     "pagination": {
 *       "currentPage": 1,
 *       "totalPages": 8,
 *       "hasNext": true,
 *       "hasPrev": false,
 *       "limit": 20
 *     },
 *     "filters": {...}
 *   }
 * }
 */
router.get('/', globalSearch);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Public
 * @query   q, limit
 * 
 * Query Parameters:
 * - q (required): Search query string (min 2 characters)
 * - limit (optional): Maximum number of suggestions (default: 10, max: 20)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "query": "search term",
 *     "suggestions": [
 *       {
 *         "text": "Cleaning Services",
 *         "type": "service",
 *         "category": "cleaning"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search terms
 * @access  Public
 * @query   limit
 * 
 * Query Parameters:
 * - limit (optional): Number of popular terms to return (default: 12, max: 50)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "popularSearches": [
 *       {
 *         "term": "cleaning services",
 *         "count": 1250,
 *         "category": "services"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/popular', getPopularSearches);

/**
 * @route   GET /api/search/advanced
 * @desc    Advanced search with more filters
 * @access  Public
 * @query   All global search params plus additional filters
 * 
 * Additional Query Parameters:
 * - dateFrom (optional): Filter results from this date
 * - dateTo (optional): Filter results to this date
 * - verified (optional): Filter for verified providers only (true/false)
 * - availability (optional): Filter by availability (available, unavailable)
 * - serviceType (optional): Filter by service type (one_time, recurring, emergency, etc.)
 * - experienceLevel (optional): Filter by experience level (entry, junior, mid, senior, etc.)
 * - jobType (optional): Filter by job type (full_time, part_time, contract, etc.)
 * - isRemote (optional): Filter for remote work (true/false)
 * - certification (optional): Filter by certification requirements
 * - language (optional): Filter by language requirements
 * 
 * Response: Same as global search
 */
router.get('/advanced', globalSearch);

/**
 * @route   GET /api/search/entities/:type
 * @desc    Search within a specific entity type
 * @access  Public
 * @param   type: Entity type (users, jobs, services, supplies, courses, rentals, agencies)
 * @query   All global search params except 'type'
 * 
 * Response: Same as global search but filtered to specific entity type
 */
router.get('/entities/:type', globalSearch);

/**
 * @route   GET /api/search/categories
 * @desc    Get all available search categories
 * @access  Public
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "categories": {
       "services": ["cleaning", "plumbing", "electrical", "moving", "landscaping", ...],
       "jobs": ["technology", "healthcare", "education", "finance", ...],
       "supplies": ["cleaning_supplies", "tools", "materials", "equipment"],
       "courses": ["cleaning", "plumbing", "electrical", "business", "safety", ...],
       "rentals": ["tools", "vehicles", "equipment", "machinery"],
       "agencies": ["cleaning", "plumbing", "electrical", "moving", ...]
     }
   }
 * }
 */
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

/**
 * @route   GET /api/search/locations
 * @desc    Get popular search locations
 * @access  Public
 * @query   q (optional): Filter locations by query
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "locations": [
 *       {
 *         "name": "Manila",
 *         "country": "Philippines",
 *         "count": 1250
 *       }
 *     ]
 *   }
 * }
 */
router.get('/locations', (req, res) => {
  try {
    const { q: query } = req.query;
    
    // In a real application, you might query the database for actual location data
    const popularLocations = [
      { name: 'Manila', country: 'Philippines', count: 1250 },
      { name: 'Quezon City', country: 'Philippines', count: 980 },
      { name: 'Makati', country: 'Philippines', count: 850 },
      { name: 'Taguig', country: 'Philippines', count: 720 },
      { name: 'Pasig', country: 'Philippines', count: 650 },
      { name: 'Mandaluyong', country: 'Philippines', count: 580 },
      { name: 'San Juan', country: 'Philippines', count: 520 },
      { name: 'Marikina', country: 'Philippines', count: 480 },
      { name: 'Pasay', country: 'Philippines', count: 420 },
      { name: 'Parañaque', country: 'Philippines', count: 380 },
      { name: 'Las Piñas', country: 'Philippines', count: 350 },
      { name: 'Muntinlupa', country: 'Philippines', count: 320 }
    ];

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

/**
 * @route   GET /api/search/trending
 * @desc    Get trending search terms
 * @access  Public
 * @query   period (optional): Time period (today, week, month, default: week)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "trending": [
 *       {
 *         "term": "holiday cleaning",
 *         "count": 250,
 *         "growth": 45.2,
 *         "category": "services"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/trending', (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // In a real application, you might analyze search analytics
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

/**
 * @route   POST /api/search/analytics
 * @desc    Track search analytics (for internal use)
 * @access  Private (Admin only)
 * @body    { query, results, filters, userId, timestamp }
 */
router.post('/analytics', authenticate, auditGeneralOperations, (req, res) => {
  try {
    const { query, results, filters, userId, timestamp } = req.body;

    // In a real application, you would save this to an analytics collection
    // For now, we'll just log it
    console.log('Search Analytics:', {
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
