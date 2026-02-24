/**
 * AI API methods for LocalPro SDK
 *
 * Covers three route groups:
 *   /api/ai/marketplace/*   — AI-powered marketplace tools
 *   /api/ai/users/*         — AI-powered user tools
 *   /api/ai-bot/*           — AI Bot event processing & escalation management
 */
class AIAPI {
  constructor(client) {
    this.client = client;
  }

  // ═══════════════════════════════════════════════════════════════════
  // AI Marketplace
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Natural language search for marketplace services.
   * @param {Object} data
   * @param {string} data.query - Free-text search query
   * @param {Object} [data.context] - Optional context (location, preferences, etc.)
   * @returns {Promise<Object>} Matched services + AI analysis
   */
  async naturalLanguageSearch(data) {
    if (!data?.query) throw new Error('query is required');
    return this.client.post('/api/ai/marketplace/recommendations', data);
  }

  /**
   * Estimate price for a service based on type, location, and complexity.
   * @param {Object} data
   * @param {string} [data.serviceType] - Service type (required if category not set)
   * @param {string} [data.category] - Category (required if serviceType not set)
   * @param {string} [data.subcategory]
   * @param {string} [data.location]
   * @param {number} [data.duration]
   * @param {string} [data.complexity]
   * @returns {Promise<Object>} Price estimate with confidence and market data
   */
  async estimatePrice(data) {
    if (!data?.serviceType && !data?.category) throw new Error('serviceType or category is required');
    return this.client.post('/api/ai/marketplace/price-estimator', data);
  }

  /**
   * Match services against user requirements using AI scoring.
   * @param {Object} data
   * @param {Object} data.requirements - User requirements description
   * @param {Object} [data.filters] - Pre-filter options (category, location)
   * @returns {Promise<Object>} Top matched services with scores and reasoning
   */
  async matchService(data) {
    if (!data?.requirements) throw new Error('requirements is required');
    return this.client.post('/api/ai/marketplace/service-matcher', data);
  }

  /**
   * Analyse sentiment of a review text.
   * @param {Object} data
   * @param {string} [data.reviewText] - Raw review text
   * @param {string} [data.reviewId] - Booking ID to fetch review from (alternative)
   * @returns {Promise<Object>} Sentiment, score, themes, actionable insights
   */
  async analyzeReviewSentiment(data) {
    if (!data?.reviewText && !data?.reviewId) throw new Error('reviewText or reviewId is required');
    return this.client.post('/api/ai/marketplace/review-sentiment', data);
  }

  /**
   * Get AI-powered booking assistance.
   * @param {Object} data
   * @param {string} data.query - Booking-related question
   * @param {string} [data.serviceId] - Enrich context with service data
   * @param {string} [data.bookingId] - Enrich context with booking data
   * @param {Object} [data.context]
   * @returns {Promise<Object>} Suggestions, next steps, and direct answer
   */
  async assistBooking(data) {
    if (!data?.query) throw new Error('query is required');
    return this.client.post('/api/ai/marketplace/booking-assistant', data);
  }

  /**
   * Generate a service description from structured data. Provider/Admin only.
   * @param {Object} data
   * @param {string} data.title
   * @param {string} data.category
   * @param {string} [data.subcategory]
   * @param {Array}  [data.features]
   * @param {Object} [data.pricing]
   * @returns {Promise<Object>} Generated description, tags, and highlights
   */
  async generateDescription(data) {
    if (!data?.title || !data?.category) throw new Error('title and category are required');
    return this.client.post('/api/ai/marketplace/description-generator', data);
  }

  /**
   * Generate a service description from title only.
   * @param {Object} data
   * @param {string} data.title - Service title
   * @param {Object} [data.options]
   * @param {'short'|'medium'|'long'} [data.options.length]
   * @param {'professional'|'friendly'|'casual'} [data.options.tone]
   * @param {boolean} [data.options.includeFeatures]
   * @param {boolean} [data.options.includeBenefits]
   * @returns {Promise<Object>} description, keyFeatures, benefits, tags, wordCount
   */
  async generateDescriptionFromTitle(data) {
    if (!data?.title) throw new Error('title is required');
    return this.client.post('/api/ai/marketplace/description-from-title', data);
  }

  /**
   * Get AI pricing optimisation suggestions for an existing service. Provider/Admin only.
   * @param {Object} data
   * @param {string} [data.serviceId] - Service ID (or pass currentPrice + category)
   * @param {number} [data.currentPrice]
   * @param {string} [data.category]
   * @param {string} [data.subcategory]
   * @returns {Promise<Object>} Optimisation suggestions with market data
   */
  async optimizePricing(data) {
    if (!data?.serviceId && !data?.currentPrice) throw new Error('serviceId or currentPrice is required');
    return this.client.post('/api/ai/marketplace/pricing-optimizer', data);
  }

  /**
   * Generate demand forecast for a service or category. Provider/Admin only.
   * @param {Object} data
   * @param {string} [data.serviceId]
   * @param {string} [data.category]
   * @param {string} [data.period] - e.g. '30 days'
   * @returns {Promise<Object>} Forecast with historical data summary
   */
  async forecastDemand(data) {
    if (!data?.serviceId && !data?.category) throw new Error('serviceId or category is required');
    return this.client.post('/api/ai/marketplace/demand-forecast', data);
  }

  /**
   * Get AI-generated insights across a service's or provider's reviews. Provider/Admin only.
   * @param {Object} data
   * @param {string} [data.serviceId]
   * @param {string} [data.providerId]
   * @param {number} [data.limit] - Max reviews to analyse (server-side cap: 50)
   * @returns {Promise<Object>} Aggregated insights and themes
   */
  async getReviewInsights(data) {
    if (!data?.serviceId && !data?.providerId) throw new Error('serviceId or providerId is required');
    return this.client.post('/api/ai/marketplace/review-insights', data);
  }

  /**
   * Get AI-assisted response drafts for reviews or messages. Provider/Admin only.
   * @param {Object} data
   * @param {string} [data.reviewId] - Booking ID containing the review
   * @param {string} [data.messageId]
   * @param {'review'|'message'} [data.messageType]
   * @param {Object} [data.context]
   * @returns {Promise<Object>} Suggested response drafts
   */
  async assistResponse(data) {
    if (!data?.reviewId && !data?.messageId && !data?.context) {
      throw new Error('reviewId, messageId, or context is required');
    }
    return this.client.post('/api/ai/marketplace/response-assistant', data);
  }

  /**
   * Get AI recommendations to improve a service listing. Provider/Admin only.
   * @param {Object} data
   * @param {string} [data.serviceId]
   * @param {Object} [data.listingData] - Raw listing data (alternative to serviceId)
   * @returns {Promise<Object>} Optimisation suggestions with before/after recommendations
   */
  async optimizeListing(data) {
    if (!data?.serviceId && !data?.listingData) throw new Error('serviceId or listingData is required');
    return this.client.post('/api/ai/marketplace/listing-optimizer', data);
  }

  /**
   * Get AI-powered scheduling assistance.
   * @param {Object} data
   * @param {string} data.query - Scheduling question
   * @param {string} [data.serviceId]
   * @param {string} [data.providerId]
   * @param {Object} [data.dateRange] - { start, end }
   * @param {Object} [data.availability]
   * @returns {Promise<Object>} Scheduling suggestions and recommended slots
   */
  async assistScheduling(data) {
    if (!data?.query) throw new Error('query is required');
    return this.client.post('/api/ai/marketplace/scheduling-assistant', data);
  }

  /**
   * Pre-fill marketplace service form fields using AI inference from a text description.
   * @param {Object} data
   * @param {string} data.input - Free-text description to infer form fields from
   * @param {Object} [data.context]
   * @returns {Promise<Object>} Suggested field values
   */
  async prefillForm(data) {
    if (!data?.input) throw new Error('input is required');
    return this.client.post('/api/ai/marketplace/form-prefiller', data);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AI Users
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Generate an AI-written professional bio for a user.
   * @param {Object} data
   * @param {string} [data.userId] - Generate for another user (admin only)
   * @param {Object} [data.preferences]
   * @param {'professional'|'friendly'|'casual'|'formal'} [data.preferences.tone]
   * @param {'short'|'medium'|'long'} [data.preferences.length]
   * @param {'general'|'skills'|'experience'|'business'|'achievements'} [data.preferences.focus]
   * @returns {Promise<Object>} bio, highlights, suggestedTags, wordCount
   */
  async generateUserBio(data = {}) {
    return this.client.post('/api/ai/users/bio-generator', data);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AI Bot — Events
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Process a generic event through the AI Bot.
   * @param {Object} data
   * @param {string} data.type - Event type
   * @param {string} data.source - Event source
   * @param {Object} [data.data]
   * @param {Object} [data.context]
   * @returns {Promise<Object>}
   */
  async processEvent(data) {
    if (!data?.type) throw new Error('type is required');
    if (!data?.source) throw new Error('source is required');
    return this.client.post('/api/ai-bot/events', data);
  }

  /**
   * Emit an application-level event for AI processing.
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async emitAppEvent(eventData) {
    return this.client.post('/api/ai-bot/events/app', eventData);
  }

  /**
   * Emit a POS event for AI processing.
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async emitPOSEvent(eventData) {
    return this.client.post('/api/ai-bot/events/pos', eventData);
  }

  /**
   * Emit a payment event for AI processing.
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async emitPaymentEvent(eventData) {
    return this.client.post('/api/ai-bot/events/payment', eventData);
  }

  /**
   * Emit a GPS event for AI processing.
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async emitGPSEvent(eventData) {
    return this.client.post('/api/ai-bot/events/gps', eventData);
  }

  /**
   * Emit a CRM event for AI processing.
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async emitCRMEvent(eventData) {
    return this.client.post('/api/ai-bot/events/crm', eventData);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AI Bot — Interactions
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get AI Bot interaction history with optional filters.
   * @param {Object} [params]
   * @param {string} [params.userId]
   * @param {string} [params.bookingId]
   * @param {string} [params.status]
   * @param {string} [params.intent]
   * @param {string} [params.subAgent]
   * @param {boolean} [params.escalated]
   * @param {string} [params.eventType]
   * @param {string} [params.dateFrom]
   * @param {string} [params.dateTo]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<Object>} Paginated interaction history
   */
  async getInteractions(params = {}) {
    return this.client.get('/api/ai-bot/interactions', params);
  }

  /**
   * Get a single AI Bot interaction by event ID.
   * @param {string} eventId
   * @returns {Promise<Object>}
   */
  async getInteractionById(eventId) {
    if (!eventId) throw new Error('eventId is required');
    return this.client.get(`/api/ai-bot/interactions/${eventId}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AI Bot — Analytics & Escalations (Admin)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get AI Bot analytics. Admin only.
   * @param {Object} [params]
   * @param {string} [params.timeRange] - '1h' | '24h' | '7d' | '30d'
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    return this.client.get('/api/ai-bot/analytics', params);
  }

  /**
   * Get escalated interactions. Admin only.
   * @param {Object} [params]
   * @param {string} [params.adminId]
   * @param {boolean} [params.resolved]
   * @param {string} [params.priority]
   * @param {string} [params.dateFrom]
   * @param {string} [params.dateTo]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<Object>}
   */
  async getEscalatedInteractions(params = {}) {
    return this.client.get('/api/ai-bot/escalations', params);
  }

  /**
   * Assign an escalated interaction to an admin. Admin only.
   * @param {string} eventId
   * @param {string} adminId
   * @returns {Promise<Object>}
   */
  async assignEscalation(eventId, adminId) {
    if (!eventId) throw new Error('eventId is required');
    if (!adminId) throw new Error('adminId is required');
    return this.client.post(`/api/ai-bot/interactions/${eventId}/assign`, { adminId });
  }

  /**
   * Resolve an escalated interaction. Admin only.
   * @param {string} eventId
   * @param {string} resolution - Resolution notes
   * @returns {Promise<Object>}
   */
  async resolveEscalation(eventId, resolution) {
    if (!eventId) throw new Error('eventId is required');
    if (!resolution) throw new Error('resolution is required');
    return this.client.post(`/api/ai-bot/interactions/${eventId}/resolve`, { resolution });
  }
}

module.exports = AIAPI;
