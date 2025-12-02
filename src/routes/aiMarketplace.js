const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  aiNaturalLanguageSearch,
  priceEstimator,
  serviceMatcher,
  reviewSentiment,
  bookingAssistant,
  descriptionGenerator,
  generateDescriptionFromTitle,
  pricingOptimizer,
  demandForecast,
  reviewInsights,
  responseAssistant,
  listingOptimizer,
  schedulingAssistant,
  formPrefiller
} = require('../controllers/aiMarketplaceController');

const router = express.Router();

// All AI routes require authentication
router.use(auth);

// @route   POST /api/ai/marketplace/recommendations
// @desc    Natural language search for marketplace
// @access  AUTHENTICATED
router.post('/recommendations', aiNaturalLanguageSearch);

// @route   POST /api/ai/marketplace/price-estimator
// @desc    AI price estimation
// @access  AUTHENTICATED
router.post('/price-estimator', priceEstimator);

// @route   POST /api/ai/marketplace/service-matcher
// @desc    AI service matching
// @access  AUTHENTICATED
router.post('/service-matcher', serviceMatcher);

// @route   POST /api/ai/marketplace/review-sentiment
// @desc    Review sentiment analysis
// @access  AUTHENTICATED
router.post('/review-sentiment', reviewSentiment);

// @route   POST /api/ai/marketplace/booking-assistant
// @desc    Booking assistant
// @access  AUTHENTICATED
router.post('/booking-assistant', bookingAssistant);

// @route   POST /api/ai/marketplace/description-generator
// @desc    Generate service description
// @access  AUTHENTICATED (Provider)
router.post('/description-generator', authorize('provider', 'admin'), descriptionGenerator);

// @route   POST /api/ai/marketplace/description-from-title
// @desc    Generate service description from title only
// @access  AUTHENTICATED
router.post('/description-from-title', generateDescriptionFromTitle);

// @route   POST /api/ai/marketplace/pricing-optimizer
// @desc    Pricing optimization
// @access  AUTHENTICATED (Provider)
router.post('/pricing-optimizer', authorize('provider', 'admin'), pricingOptimizer);

// @route   POST /api/ai/marketplace/demand-forecast
// @desc    Demand forecasting
// @access  AUTHENTICATED (Provider)
router.post('/demand-forecast', authorize('provider', 'admin'), demandForecast);

// @route   POST /api/ai/marketplace/review-insights
// @desc    Review insights analysis
// @access  AUTHENTICATED (Provider)
router.post('/review-insights', authorize('provider', 'admin'), reviewInsights);

// @route   POST /api/ai/marketplace/response-assistant
// @desc    Response assistant for reviews/messages
// @access  AUTHENTICATED (Provider)
router.post('/response-assistant', authorize('provider', 'admin'), responseAssistant);

// @route   POST /api/ai/marketplace/listing-optimizer
// @desc    Listing optimization
// @access  AUTHENTICATED (Provider)
router.post('/listing-optimizer', authorize('provider', 'admin'), listingOptimizer);

// @route   POST /api/ai/marketplace/scheduling-assistant
// @desc    Scheduling assistant
// @access  AUTHENTICATED
router.post('/scheduling-assistant', schedulingAssistant);

// @route   POST /api/ai/marketplace/form-prefiller
// @desc    Pre-fill marketplace service form fields using AI
// @access  AUTHENTICATED
router.post('/form-prefiller', formPrefiller);

module.exports = router;

