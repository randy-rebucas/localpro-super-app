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

/**
 * @swagger
 * /api/ai/marketplace/recommendations:
 *   post:
 *     summary: Natural language search for marketplace
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI-powered recommendations
 */
router.post('/recommendations', aiNaturalLanguageSearch);

/**
 * @swagger
 * /api/ai/marketplace/price-estimator:
 *   post:
 *     summary: AI price estimation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *             properties:
 *               serviceType:
 *                 type: string
 *               location:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Price estimation
 */
router.post('/price-estimator', priceEstimator);

/**
 * @swagger
 * /api/ai/marketplace/service-matcher:
 *   post:
 *     summary: AI service matching
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirements
 *             properties:
 *               requirements:
 *                 type: object
 *     responses:
 *       200:
 *         description: Matched services
 */
router.post('/service-matcher', serviceMatcher);

/**
 * @swagger
 * /api/ai/marketplace/review-sentiment:
 *   post:
 *     summary: Review sentiment analysis
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewText
 *             properties:
 *               reviewText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sentiment analysis result
 */
router.post('/review-sentiment', reviewSentiment);

/**
 * @swagger
 * /api/ai/marketplace/booking-assistant:
 *   post:
 *     summary: Booking assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking assistance
 */
router.post('/booking-assistant', bookingAssistant);

/**
 * @swagger
 * /api/ai/marketplace/description-generator:
 *   post:
 *     summary: Generate service description (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generated description
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/description-generator', authorize('provider', 'admin'), descriptionGenerator);

/**
 * @swagger
 * /api/ai/marketplace/description-from-title:
 *   post:
 *     summary: Generate service description from title only
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated description
 */
router.post('/description-from-title', generateDescriptionFromTitle);

/**
 * @swagger
 * /api/ai/marketplace/pricing-optimizer:
 *   post:
 *     summary: Pricing optimization (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Pricing optimization suggestions
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/pricing-optimizer', authorize('provider', 'admin'), pricingOptimizer);

/**
 * @swagger
 * /api/ai/marketplace/demand-forecast:
 *   post:
 *     summary: Demand forecasting (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *               timeframe:
 *                 type: string
 *                 enum: [7d, 30d, 90d]
 *     responses:
 *       200:
 *         description: Demand forecast
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/demand-forecast', authorize('provider', 'admin'), demandForecast);

/**
 * @swagger
 * /api/ai/marketplace/review-insights:
 *   post:
 *     summary: Review insights analysis (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Review insights
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/review-insights', authorize('provider', 'admin'), reviewInsights);

/**
 * @swagger
 * /api/ai/marketplace/response-assistant:
 *   post:
 *     summary: Response assistant for reviews/messages (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *               - message
 *             properties:
 *               context:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggested response
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/response-assistant', authorize('provider', 'admin'), responseAssistant);

/**
 * @swagger
 * /api/ai/marketplace/listing-optimizer:
 *   post:
 *     summary: Listing optimization (Provider/Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Optimization suggestions
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/listing-optimizer', authorize('provider', 'admin'), listingOptimizer);

/**
 * @swagger
 * /api/ai/marketplace/scheduling-assistant:
 *   post:
 *     summary: Scheduling assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scheduling assistance
 */
router.post('/scheduling-assistant', schedulingAssistant);

/**
 * @swagger
 * /api/ai/marketplace/form-prefiller:
 *   post:
 *     summary: Pre-fill marketplace service form fields using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pre-filled form data
 */
router.post('/form-prefiller', formPrefiller);

module.exports = router;

