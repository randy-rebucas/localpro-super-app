// AI Service for marketplace features
// Supports OpenAI and other AI providers

const axios = require('axios');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    
    if (!this.apiKey) {
      logger.warn('AI API key not configured. AI features will use fallback responses.');
    }
  }

  /**
   * Make AI API call
   */
  async makeAICall(prompt, systemPrompt = null, options = {}) {
    if (!this.apiKey) {
      // Return fallback response when API key is not configured
      return this.getMockResponse(prompt, options);
    }

    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('AI API call failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return fallback response on error
      return this.getMockResponse(prompt, options);
    }
  }

  /**
   * Get fallback response when AI service is not configured
   */
  getMockResponse(prompt, _options = {}) {
    logger.warn('Using fallback AI response - configure AI_API_KEY for real responses');
    
    return {
      success: true,
      content: JSON.stringify({}),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  /**
   * Natural language search
   */
  async naturalLanguageSearch(query, context = {}) {
    const systemPrompt = `You are a helpful assistant for a marketplace platform. 
    Analyze user queries and extract search parameters like service type, location, price range, and other filters.
    Return a JSON object with extracted parameters.`;
    
    const prompt = `User query: "${query}"
    Context: ${JSON.stringify(context)}
    Extract search parameters and return as JSON with fields: category, subcategory, location, minPrice, maxPrice, keywords, and other relevant filters.`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.3 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Price estimation
   */
  async estimatePrice(serviceData) {
    const systemPrompt = `You are a pricing expert for service marketplaces.
    Analyze service details and provide accurate price estimates based on market data, location, and service complexity.`;
    
    const prompt = `Service details: ${JSON.stringify(serviceData)}
    Provide a price estimate with:
    - estimatedPrice: number
    - priceRange: { min: number, max: number }
    - confidence: number (0-1)
    - factors: array of strings explaining the estimate
    Return as JSON.`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.2 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Service matching
   */
  async matchService(userRequirements, availableServices) {
    const systemPrompt = `You are a service matching expert.
    Match user requirements with available services and rank them by relevance.`;
    
    const prompt = `User requirements: ${JSON.stringify(userRequirements)}
    Available services: ${JSON.stringify(availableServices)}
    Return a JSON array of matched services with scores (0-1) and reasoning.
    Format: [{ serviceId, score, matchReasons: [] }]`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.3 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Sentiment analysis for reviews
   */
  async analyzeReviewSentiment(reviewText) {
    const systemPrompt = `You are a sentiment analysis expert.
    Analyze review text and determine sentiment, key themes, and actionable insights.`;
    
    const prompt = `Review text: "${reviewText}"
    Analyze and return JSON with:
    - sentiment: "positive" | "negative" | "neutral"
    - score: number (0-1, where 1 is most positive)
    - themes: array of key themes
    - actionableInsights: array of strings
    - summary: string`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.2 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Booking assistant
   */
  async assistBooking(bookingQuery, context = {}) {
    const systemPrompt = `You are a booking assistant for a service marketplace.
    Help users with booking-related questions and provide helpful guidance.`;
    
    const prompt = `User query: "${bookingQuery}"
    Context: ${JSON.stringify(context)}
    Provide helpful booking assistance. Return JSON with:
    - suggestions: array of helpful suggestions
    - nextSteps: array of recommended actions
    - answer: string with direct answer`;
    
    const response = await this.makeAICall(prompt, systemPrompt);
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Generate service description
   */
  async generateDescription(serviceData) {
    const systemPrompt = `You are a professional copywriter for service marketplaces.
    Create compelling, accurate service descriptions that highlight key features and benefits.`;
    
    const prompt = `Service data: ${JSON.stringify(serviceData)}
    Generate a professional service description (150-300 words) that:
    - Highlights key features
    - Mentions benefits
    - Includes relevant keywords
    - Is engaging and professional
    Return JSON with: { description: string, tags: array, highlights: array }`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { max_tokens: 500 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Pricing optimization
   */
  async optimizePricing(serviceData, marketData = {}) {
    const systemPrompt = `You are a pricing optimization expert.
    Analyze service pricing and market conditions to suggest optimal pricing strategies.`;
    
    const prompt = `Service data: ${JSON.stringify(serviceData)}
    Market data: ${JSON.stringify(marketData)}
    Provide pricing optimization recommendations. Return JSON with:
    - recommendedPrice: number
    - currentPrice: number
    - optimization: "increase" | "decrease" | "maintain"
    - reasoning: string
    - expectedImpact: { bookings: number, revenue: number }`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.2 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Demand forecasting
   */
  async forecastDemand(serviceData, historicalData = {}) {
    const systemPrompt = `You are a demand forecasting expert.
    Analyze historical data and market trends to predict future demand.`;
    
    const prompt = `Service data: ${JSON.stringify(serviceData)}
    Historical data: ${JSON.stringify(historicalData)}
    Forecast demand for the next period. Return JSON with:
    - forecast: { period: string, expectedDemand: number, confidence: number }
    - trends: array of trend descriptions
    - recommendations: array of actionable recommendations
    - factors: array of factors influencing the forecast`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { temperature: 0.2 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Review insights
   */
  async getReviewInsights(reviews) {
    const systemPrompt = `You are a review analysis expert.
    Analyze multiple reviews to extract insights, patterns, and recommendations.`;
    
    const prompt = `Reviews: ${JSON.stringify(reviews)}
    Analyze and provide insights. Return JSON with:
    - overallSentiment: string
    - keyThemes: array of { theme: string, frequency: number, sentiment: string }
    - strengths: array of strings
    - improvements: array of strings
    - summary: string
    - recommendations: array of strings`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { max_tokens: 800 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Response assistant for reviews/messages
   */
  async assistResponse(context, messageType = 'review') {
    const systemPrompt = `You are a professional communication assistant.
    Help craft appropriate, professional responses to customer reviews and messages.`;
    
    const prompt = `Context: ${JSON.stringify(context)}
    Message type: ${messageType}
    Generate a professional response. Return JSON with:
    - response: string (the suggested response)
    - tone: string (professional, friendly, apologetic, etc.)
    - keyPoints: array of points to address
    - suggestions: array of alternative approaches`;
    
    const response = await this.makeAICall(prompt, systemPrompt);
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Listing optimization
   */
  async optimizeListing(listingData) {
    const systemPrompt = `You are a listing optimization expert.
    Analyze service listings and provide recommendations to improve visibility and conversion.`;
    
    const prompt = `Listing data: ${JSON.stringify(listingData)}
    Provide optimization recommendations. Return JSON with:
    - titleSuggestions: array of improved titles
    - descriptionImprovements: array of suggestions
    - keywordRecommendations: array of keywords
    - imageSuggestions: array of suggestions
    - seoScore: number (0-100)
    - recommendations: array of actionable recommendations`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { max_tokens: 1000 });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }

  /**
   * Scheduling assistant
   */
  async assistScheduling(schedulingQuery, availability = {}) {
    const systemPrompt = `You are a scheduling assistant.
    Help users find optimal scheduling options and resolve scheduling conflicts.`;
    
    const prompt = `User query: "${schedulingQuery}"
    Availability: ${JSON.stringify(availability)}
    Provide scheduling assistance. Return JSON with:
    - suggestions: array of suggested time slots
    - alternatives: array of alternative options
    - conflicts: array of any conflicts identified
    - recommendations: array of recommendations`;
    
    const response = await this.makeAICall(prompt, systemPrompt);
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      return response;
    }
  }
}

module.exports = new AIService();

