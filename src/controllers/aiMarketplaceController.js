const aiService = require('../services/aiService');
const { Service, Booking } = require('../models/Marketplace');
const logger = require('../config/logger');
const { sendServerError } = require('../utils/responseHelper');

// @desc    Natural language search for marketplace
// @route   POST /api/ai/marketplace/recommendations
// @access  AUTHENTICATED
const aiNaturalLanguageSearch = async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const aiResponse = await aiService.naturalLanguageSearch(query, context);
    
    // Use parsed parameters to search services
    const searchParams = aiResponse.parsed || {};
    const filter = { isActive: true };

    if (searchParams.category) filter.category = searchParams.category;
    if (searchParams.subcategory) filter.subcategory = searchParams.subcategory;
    if (searchParams.location) {
      filter.serviceArea = { $in: [new RegExp(searchParams.location, 'i')] };
    }
    if (searchParams.minPrice || searchParams.maxPrice) {
      filter['pricing.basePrice'] = {};
      if (searchParams.minPrice) filter['pricing.basePrice'].$gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) filter['pricing.basePrice'].$lte = Number(searchParams.maxPrice);
    }

    // Text search if keywords provided
    if (searchParams.keywords) {
      filter.$or = [
        { title: new RegExp(searchParams.keywords.join('|'), 'i') },
        { description: new RegExp(searchParams.keywords.join('|'), 'i') }
      ];
    }

    const services = await Service.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .select('-reviews -bookings -metadata')
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        services,
        aiAnalysis: aiResponse.parsed || {},
        query: query,
        count: services.length
      }
    });
  } catch (error) {
    logger.error('AI natural language search error', error);
    return sendServerError(res, error, 'Failed to perform AI search', 'AI_SEARCH_ERROR');
  }
};

// @desc    Price estimator
// @route   POST /api/ai/marketplace/price-estimator
// @access  AUTHENTICATED
const priceEstimator = async (req, res) => {
  try {
    const { serviceType, category, subcategory, location, duration, complexity, additionalInfo } = req.body;

    if (!serviceType && !category) {
      return res.status(400).json({
        success: false,
        message: 'Service type or category is required'
      });
    }

    // Get market data for similar services
    const marketFilter = { isActive: true };
    if (category) marketFilter.category = category;
    if (subcategory) marketFilter.subcategory = subcategory;

    const similarServices = await Service.find(marketFilter)
      .select('pricing category subcategory')
      .limit(50)
      .lean();

    const marketData = {
      averagePrice: similarServices.length > 0
        ? similarServices.reduce((sum, s) => sum + (s.pricing?.basePrice || 0), 0) / similarServices.length
        : null,
      priceRange: similarServices.length > 0
        ? {
            min: Math.min(...similarServices.map(s => s.pricing?.basePrice || 0)),
            max: Math.max(...similarServices.map(s => s.pricing?.basePrice || 0))
          }
        : null,
      sampleSize: similarServices.length
    };

    const serviceData = {
      serviceType: serviceType || category,
      category,
      subcategory,
      location,
      duration,
      complexity,
      additionalInfo,
      marketData
    };

    const aiResponse = await aiService.estimatePrice(serviceData);
    const estimate = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Price estimate generated successfully',
      data: {
        estimate: typeof estimate === 'string' ? JSON.parse(estimate) : estimate,
        marketData,
        aiConfidence: aiResponse.usage ? 'high' : 'medium'
      }
    });
  } catch (error) {
    logger.error('Price estimator error', error);
    return sendServerError(res, error, 'Failed to estimate price', 'PRICE_ESTIMATOR_ERROR');
  }
};

// @desc    Service matcher
// @route   POST /api/ai/marketplace/service-matcher
// @access  AUTHENTICATED
const serviceMatcher = async (req, res) => {
  try {
    const { requirements, filters } = req.body;

    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: 'User requirements are required'
      });
    }

    // Build filter for available services
    const serviceFilter = { isActive: true };
    if (filters?.category) serviceFilter.category = filters.category;
    if (filters?.location) {
      serviceFilter.serviceArea = { $in: [new RegExp(filters.location, 'i')] };
    }

    const availableServices = await Service.find(serviceFilter)
      .populate('provider', 'firstName lastName profile.rating')
      .select('title description category subcategory pricing rating images')
      .limit(100)
      .lean();

    if (availableServices.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No services available for matching',
        data: {
          matches: [],
          count: 0
        }
      });
    }

    const aiResponse = await aiService.matchService(requirements, availableServices);
    const matches = aiResponse.parsed || [];

    // Sort by score and enrich with service data
    const enrichedMatches = matches
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map(match => {
        const service = availableServices.find(s => s._id.toString() === match.serviceId);
        return {
          ...match,
          service: service || null
        };
      })
      .filter(match => match.service !== null)
      .slice(0, 10); // Top 10 matches

    res.status(200).json({
      success: true,
      message: 'Service matching completed',
      data: {
        matches: enrichedMatches,
        count: enrichedMatches.length,
        aiAnalysis: aiResponse
      }
    });
  } catch (error) {
    logger.error('Service matcher error', error);
    return sendServerError(res, error, 'Failed to match services', 'SERVICE_MATCHER_ERROR');
  }
};

// @desc    Review sentiment analysis
// @route   POST /api/ai/marketplace/review-sentiment
// @access  AUTHENTICATED
const reviewSentiment = async (req, res) => {
  try {
    const { reviewText, reviewId } = req.body;

    if (!reviewText && !reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Review text or review ID is required'
      });
    }

    let textToAnalyze = reviewText;

    // If reviewId provided, fetch the review
    if (reviewId && !reviewText) {
      const booking = await Booking.findById(reviewId)
        .select('review')
        .lean();

      if (!booking || !booking.review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      textToAnalyze = booking.review.comment || '';
    }

    if (!textToAnalyze) {
      return res.status(400).json({
        success: false,
        message: 'No review text available for analysis'
      });
    }

    const aiResponse = await aiService.analyzeReviewSentiment(textToAnalyze);
    const analysis = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Sentiment analysis completed',
      data: {
        analysis: typeof analysis === 'string' ? JSON.parse(analysis) : analysis,
        reviewText: textToAnalyze,
        aiConfidence: aiResponse.usage ? 'high' : 'medium'
      }
    });
  } catch (error) {
    logger.error('Review sentiment analysis error', error);
    return sendServerError(res, error, 'Failed to analyze review sentiment', 'SENTIMENT_ANALYSIS_ERROR');
  }
};

// @desc    Booking assistant
// @route   POST /api/ai/marketplace/booking-assistant
// @access  AUTHENTICATED
const bookingAssistant = async (req, res) => {
  try {
    const { query, serviceId, bookingId, context } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    let enrichedContext = { ...context };

    // Enrich context with service data if serviceId provided
    if (serviceId) {
      const service = await Service.findById(serviceId)
        .select('title description category pricing serviceArea')
        .lean();
      if (service) {
        enrichedContext.service = service;
      }
    }

    // Enrich context with booking data if bookingId provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId)
        .populate('service', 'title category')
        .select('status bookingDate duration address')
        .lean();
      if (booking) {
        enrichedContext.booking = booking;
      }
    }

    const aiResponse = await aiService.assistBooking(query, enrichedContext);
    const assistance = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Booking assistance provided',
      data: {
        assistance: typeof assistance === 'string' ? JSON.parse(assistance) : assistance,
        query,
        context: enrichedContext
      }
    });
  } catch (error) {
    logger.error('Booking assistant error', error);
    return sendServerError(res, error, 'Failed to provide booking assistance', 'BOOKING_ASSISTANT_ERROR');
  }
};

// @desc    Description generator
// @route   POST /api/ai/marketplace/description-generator
// @access  AUTHENTICATED (Provider)
const descriptionGenerator = async (req, res) => {
  try {
    const { title, category, subcategory, features, pricing, serviceArea, additionalInfo } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    const serviceData = {
      title,
      category,
      subcategory,
      features: features || [],
      pricing,
      serviceArea,
      additionalInfo
    };

    const aiResponse = await aiService.generateDescription(serviceData);
    const generated = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Description generated successfully',
      data: {
        generated: typeof generated === 'string' ? JSON.parse(generated) : generated,
        input: serviceData
      }
    });
  } catch (error) {
    logger.error('Description generator error', error);
    return sendServerError(res, error, 'Failed to generate description', 'DESCRIPTION_GENERATOR_ERROR');
  }
};

// @desc    Pricing optimizer
// @route   POST /api/ai/marketplace/pricing-optimizer
// @access  AUTHENTICATED (Provider)
const pricingOptimizer = async (req, res) => {
  try {
    const { serviceId, currentPrice, category, subcategory } = req.body;

    if (!serviceId && !currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Service ID or current price is required'
      });
    }

    let serviceData = {};
    if (serviceId) {
      const service = await Service.findById(serviceId)
        .select('title category subcategory pricing rating')
        .lean();
      if (service) {
        serviceData = service;
      }
    } else {
      serviceData = {
        category,
        subcategory,
        pricing: { basePrice: currentPrice }
      };
    }

    // Get market data
    const marketFilter = { isActive: true };
    if (serviceData.category) marketFilter.category = serviceData.category;
    if (serviceData.subcategory) marketFilter.subcategory = serviceData.subcategory;

    const marketServices = await Service.find(marketFilter)
      .select('pricing rating')
      .limit(100)
      .lean();

    const marketData = {
      averagePrice: marketServices.length > 0
        ? marketServices.reduce((sum, s) => sum + (s.pricing?.basePrice || 0), 0) / marketServices.length
        : null,
      priceRange: marketServices.length > 0
        ? {
            min: Math.min(...marketServices.map(s => s.pricing?.basePrice || 0)),
            max: Math.max(...marketServices.map(s => s.pricing?.basePrice || 0))
          }
        : null,
      averageRating: marketServices.length > 0
        ? marketServices.reduce((sum, s) => sum + (s.rating?.average || 0), 0) / marketServices.length
        : null
    };

    const aiResponse = await aiService.optimizePricing(serviceData, marketData);
    const optimization = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Pricing optimization completed',
      data: {
        optimization: typeof optimization === 'string' ? JSON.parse(optimization) : optimization,
        currentPrice: serviceData.pricing?.basePrice || currentPrice,
        marketData
      }
    });
  } catch (error) {
    logger.error('Pricing optimizer error', error);
    return sendServerError(res, error, 'Failed to optimize pricing', 'PRICING_OPTIMIZER_ERROR');
  }
};

// @desc    Demand forecast
// @route   POST /api/ai/marketplace/demand-forecast
// @access  AUTHENTICATED (Provider)
const demandForecast = async (req, res) => {
  try {
    const { serviceId, category, period = '30 days' } = req.body;

    if (!serviceId && !category) {
      return res.status(400).json({
        success: false,
        message: 'Service ID or category is required'
      });
    }

    let serviceData = {};
    if (serviceId) {
      const service = await Service.findById(serviceId)
        .select('title category subcategory pricing serviceArea')
        .lean();
      if (service) {
        serviceData = service;
      }
    } else {
      serviceData = { category };
    }

    // Get historical booking data
    const bookingFilter = {};
    if (serviceId) {
      bookingFilter.service = serviceId;
    } else if (category) {
      bookingFilter['service.category'] = category;
    }

    const historicalBookings = await Booking.find(bookingFilter)
      .select('bookingDate status createdAt')
      .sort({ bookingDate: -1 })
      .limit(100)
      .lean();

    const historicalData = {
      totalBookings: historicalBookings.length,
      completedBookings: historicalBookings.filter(b => b.status === 'completed').length,
      bookingTrends: historicalBookings.map(b => ({
        date: b.bookingDate,
        status: b.status
      }))
    };

    const aiResponse = await aiService.forecastDemand(serviceData, historicalData);
    const forecast = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Demand forecast generated',
      data: {
        forecast: typeof forecast === 'string' ? JSON.parse(forecast) : forecast,
        period,
        historicalData,
        serviceData
      }
    });
  } catch (error) {
    logger.error('Demand forecast error', error);
    return sendServerError(res, error, 'Failed to forecast demand', 'DEMAND_FORECAST_ERROR');
  }
};

// @desc    Review insights
// @route   POST /api/ai/marketplace/review-insights
// @access  AUTHENTICATED (Provider)
const reviewInsights = async (req, res) => {
  try {
    const { serviceId, providerId, limit = 50 } = req.body;

    if (!serviceId && !providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID or provider ID is required'
      });
    }

    const bookingFilter = {
      'review.rating': { $exists: true, $ne: null },
      status: 'completed'
    };

    if (serviceId) {
      bookingFilter.service = serviceId;
    } else if (providerId) {
      bookingFilter.provider = providerId;
    }

    const bookingsWithReviews = await Booking.find(bookingFilter)
      .select('review service createdAt')
      .populate('service', 'title category')
      .sort({ 'review.createdAt': -1 })
      .limit(Number(limit))
      .lean();

    if (bookingsWithReviews.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reviews found',
        data: {
          insights: null,
          reviewCount: 0
        }
      });
    }

    const reviews = bookingsWithReviews.map(booking => ({
      rating: booking.review?.rating,
      comment: booking.review?.comment,
      categories: booking.review?.categories,
      service: booking.service?.title,
      date: booking.review?.createdAt || booking.createdAt
    }));

    const aiResponse = await aiService.getReviewInsights(reviews);
    const insights = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Review insights generated',
      data: {
        insights: typeof insights === 'string' ? JSON.parse(insights) : insights,
        reviewCount: reviews.length,
        reviews: reviews.slice(0, 10) // Include sample reviews
      }
    });
  } catch (error) {
    logger.error('Review insights error', error);
    return sendServerError(res, error, 'Failed to generate review insights', 'REVIEW_INSIGHTS_ERROR');
  }
};

// @desc    Response assistant
// @route   POST /api/ai/marketplace/response-assistant
// @access  AUTHENTICATED (Provider)
const responseAssistant = async (req, res) => {
  try {
    const { reviewId, messageId, messageType = 'review', context } = req.body;

    if (!reviewId && !messageId && !context) {
      return res.status(400).json({
        success: false,
        message: 'Review ID, message ID, or context is required'
      });
    }

    let enrichedContext = { ...context, messageType };

    // Fetch review if reviewId provided
    if (reviewId) {
      const booking = await Booking.findById(reviewId)
        .populate('client', 'firstName lastName')
        .populate('service', 'title')
        .select('review client service')
        .lean();

      if (booking && booking.review) {
        enrichedContext.review = {
          rating: booking.review.rating,
          comment: booking.review.comment,
          client: booking.client,
          service: booking.service
        };
      }
    }

    // TODO: Fetch message if messageId provided (when message system is integrated)

    const aiResponse = await aiService.assistResponse(enrichedContext, messageType);
    const assistance = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Response assistance provided',
      data: {
        assistance: typeof assistance === 'string' ? JSON.parse(assistance) : assistance,
        context: enrichedContext
      }
    });
  } catch (error) {
    logger.error('Response assistant error', error);
    return sendServerError(res, error, 'Failed to provide response assistance', 'RESPONSE_ASSISTANT_ERROR');
  }
};

// @desc    Listing optimizer
// @route   POST /api/ai/marketplace/listing-optimizer
// @access  AUTHENTICATED (Provider)
const listingOptimizer = async (req, res) => {
  try {
    const { serviceId, listingData } = req.body;

    if (!serviceId && !listingData) {
      return res.status(400).json({
        success: false,
        message: 'Service ID or listing data is required'
      });
    }

    let dataToOptimize = listingData || {};

    if (serviceId) {
      const service = await Service.findById(serviceId)
        .select('title description category subcategory pricing images features serviceArea')
        .lean();

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      dataToOptimize = service;
    }

    // Get market data for comparison
    const marketFilter = { isActive: true };
    if (dataToOptimize.category) marketFilter.category = dataToOptimize.category;

    const marketServices = await Service.find(marketFilter)
      .select('title description rating')
      .limit(20)
      .lean();

    dataToOptimize.marketContext = {
      averageRating: marketServices.length > 0
        ? marketServices.reduce((sum, s) => sum + (s.rating?.average || 0), 0) / marketServices.length
        : null,
      sampleSize: marketServices.length
    };

    const aiResponse = await aiService.optimizeListing(dataToOptimize);
    const optimization = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Listing optimization completed',
      data: {
        optimization: typeof optimization === 'string' ? JSON.parse(optimization) : optimization,
        currentListing: dataToOptimize
      }
    });
  } catch (error) {
    logger.error('Listing optimizer error', error);
    return sendServerError(res, error, 'Failed to optimize listing', 'LISTING_OPTIMIZER_ERROR');
  }
};

// @desc    Scheduling assistant
// @route   POST /api/ai/marketplace/scheduling-assistant
// @access  AUTHENTICATED
const schedulingAssistant = async (req, res) => {
  try {
    const { query, serviceId, providerId, dateRange, availability } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling query is required'
      });
    }

    let enrichedAvailability = availability || {};

    // Get existing bookings to determine availability
    if (serviceId || providerId) {
      const bookingFilter = {
        status: { $in: ['pending', 'confirmed'] }
      };

      if (serviceId) {
        bookingFilter.service = serviceId;
      } else if (providerId) {
        bookingFilter.provider = providerId;
      }

      if (dateRange) {
        bookingFilter.bookingDate = {};
        if (dateRange.start) bookingFilter.bookingDate.$gte = new Date(dateRange.start);
        if (dateRange.end) bookingFilter.bookingDate.$lte = new Date(dateRange.end);
      }

      const existingBookings = await Booking.find(bookingFilter)
        .select('bookingDate duration status')
        .lean();

      enrichedAvailability = {
        ...enrichedAvailability,
        existingBookings: existingBookings.map(b => ({
          date: b.bookingDate,
          duration: b.duration,
          status: b.status
        }))
      };
    }

    const aiResponse = await aiService.assistScheduling(query, enrichedAvailability);
    const assistance = aiResponse.parsed || aiResponse.content;

    res.status(200).json({
      success: true,
      message: 'Scheduling assistance provided',
      data: {
        assistance: typeof assistance === 'string' ? JSON.parse(assistance) : assistance,
        query,
        availability: enrichedAvailability
      }
    });
  } catch (error) {
    logger.error('Scheduling assistant error', error);
    return sendServerError(res, error, 'Failed to provide scheduling assistance', 'SCHEDULING_ASSISTANT_ERROR');
  }
};

module.exports = {
  aiNaturalLanguageSearch,
  priceEstimator,
  serviceMatcher,
  reviewSentiment,
  bookingAssistant,
  descriptionGenerator,
  pricingOptimizer,
  demandForecast,
  reviewInsights,
  responseAssistant,
  listingOptimizer,
  schedulingAssistant
};

