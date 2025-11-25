// AI Service for marketplace features
// Supports OpenAI and other AI providers

const axios = require('axios');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    // Prioritize OPENAI_API_KEY for OpenAI integration
    this.apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    
    if (!this.apiKey) {
      logger.warn('OPENAI_API_KEY not configured. AI features will use fallback responses. Set OPENAI_API_KEY environment variable to enable AI features.');
    } else {
      logger.info('OpenAI API configured', {
        provider: this.provider,
        model: this.model,
        baseURL: this.baseURL
      });
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

      const requestConfig = {
        model: options.model || this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options
      };

      const requestUrl = `${this.baseURL}/chat/completions`;

      logger.debug('AI API call - Request details', {
        url: requestUrl,
        model: requestConfig.model,
        messagesCount: messages.length,
        maxTokens: requestConfig.max_tokens,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 7)}...` : 'none'
      });

      const response = await axios.post(
        requestUrl,
        requestConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Check if response has expected structure
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        logger.error('AI API call - Invalid response structure', {
          hasData: !!response.data,
          hasChoices: !!response.data?.choices,
          responseKeys: response.data ? Object.keys(response.data) : []
        });
        throw new Error('Invalid response structure from AI API');
      }

      return {
        success: true,
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        errorType: error.name || 'Unknown',
        errorMessage: error.message,
        hasResponse: !!error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: `${this.baseURL}/chat/completions`,
        hasApiKey: !!this.apiKey,
        apiKeyConfigured: !!this.apiKey,
        isNetworkError: error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND',
        isTimeoutError: error.code === 'ETIMEDOUT',
        isAxiosError: error.isAxiosError
      };

      // Log different error types with appropriate detail levels
      if (error.response) {
        // API returned an error response
        logger.error('AI API call failed - API Error Response', {
          ...errorDetails,
          errorCode: error.response.data?.error?.code,
          errorType: error.response.data?.error?.type,
          errorMessage: error.response.data?.error?.message
        });
      } else if (error.request) {
        // Request was made but no response received
        logger.error('AI API call failed - No Response Received', {
          ...errorDetails,
          requestMade: true,
          networkError: true
        });
      } else {
        // Error setting up the request
        logger.error('AI API call failed - Request Setup Error', errorDetails);
      }

      // Log common issues
      if (!this.apiKey) {
        logger.warn('AI API call failed - No API key configured. Using fallback response.');
      } else if (error.response?.status === 401) {
        logger.error('AI API call failed - Authentication Error (401). Check your OPENAI_API_KEY.');
      } else if (error.response?.status === 429) {
        logger.error('AI API call failed - Rate Limit Exceeded (429). Please wait before retrying.');
      } else if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {
        logger.error('AI API call failed - Server Error. OpenAI service may be temporarily unavailable.');
      }
      
      // Return fallback response on error
      return this.getMockResponse(prompt, options);
    }
  }

  /**
   * Get fallback response when AI service is not configured
   */
  getMockResponse(prompt, _options = {}) {
    logger.warn('Using fallback AI response - configure OPENAI_API_KEY environment variable for real AI responses');
    
    // Try to extract service title from prompt for better fallback
    let serviceTitle = 'Service';
    const titleMatch = prompt.match(/Service Title: "([^"]+)"/);
    if (titleMatch && titleMatch[1]) {
      serviceTitle = titleMatch[1];
    }
    
    // Generate a basic fallback description based on the title
    const fallbackDescription = `Professional ${serviceTitle} service. Our experienced team provides high-quality service with attention to detail. We are committed to delivering excellent results and customer satisfaction. Contact us today to learn more about how we can help you.`;
    
    const fallbackResponse = {
      description: fallbackDescription,
      keyFeatures: [
        'Professional service',
        'Experienced team',
        'Quality guaranteed',
        'Customer satisfaction'
      ],
      benefits: [
        'Reliable service',
        'Professional results',
        'Peace of mind'
      ],
      tags: [
        serviceTitle.toLowerCase(),
        'professional',
        'service'
      ],
      wordCount: fallbackDescription.split(/\s+/).length
    };
    
    return {
      success: true,
      content: JSON.stringify(fallbackResponse),
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
   * Generate service description from title only
   */
  async generateDescriptionFromTitle(serviceTitle, options = {}) {
    const systemPrompt = `You are a professional copywriter for service marketplaces.
    Create compelling, accurate service descriptions based solely on the service title.
    Generate descriptions that are professional, engaging, and highlight what customers can expect.`;
    
    const {
      length = 'medium', // short (50-100 words), medium (100-200 words), long (200-300 words)
      tone = 'professional', // professional, friendly, casual
      includeFeatures = true,
      includeBenefits = true
    } = options;

    const lengthMap = {
      short: '50-100 words',
      medium: '100-200 words',
      long: '200-300 words'
    };

    let prompt = `Service Title: "${serviceTitle}"\n\n`;
    prompt += `Generate a ${tone} service description (${lengthMap[length] || '100-200 words'}) that:\n`;
    prompt += `- Accurately describes what the service entails based on the title\n`;
    if (includeFeatures) {
      prompt += `- Highlights key features and what's included\n`;
    }
    if (includeBenefits) {
      prompt += `- Mentions benefits and value proposition\n`;
    }
    prompt += `- Uses relevant keywords for searchability\n`;
    prompt += `- Is engaging and professional\n`;
    prompt += `- Helps potential customers understand what they'll receive\n\n`;
    prompt += `Return JSON with:\n`;
    prompt += `- description: string (the generated description)\n`;
    prompt += `- keyFeatures: array of strings (3-5 key features)\n`;
    prompt += `- benefits: array of strings (2-4 main benefits)\n`;
    prompt += `- tags: array of strings (relevant keywords/tags)\n`;
    prompt += `- wordCount: number`;
    
    const maxTokens = length === 'long' ? 600 : length === 'short' ? 200 : 400;
    
    logger.info('AI Description Generation - Request', {
      serviceTitle,
      options,
      maxTokens,
      promptLength: prompt.length
    });
    
    const response = await this.makeAICall(prompt, systemPrompt, { 
      max_tokens: maxTokens,
      temperature: 0.7 
    });
    
    // Debug: Log raw response
    logger.info('AI Description Generation - Raw Response', {
      hasContent: !!response.content,
      contentLength: response.content?.length || 0,
      contentPreview: response.content?.substring(0, 200) || 'No content',
      hasUsage: !!response.usage,
      success: response.success
    });
    
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      let contentToParse = response.content || '';
      
      // Remove markdown code blocks if present
      if (contentToParse.includes('```json')) {
        contentToParse = contentToParse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (contentToParse.includes('```')) {
        contentToParse = contentToParse.replace(/```\n?/g, '').trim();
      }
      
      const parsed = JSON.parse(contentToParse);
      
      // Debug: Log parsed result
      logger.info('AI Description Generation - Parsed Successfully', {
        hasDescription: !!parsed.description,
        descriptionLength: parsed.description?.length || 0,
        hasKeyFeatures: Array.isArray(parsed.keyFeatures),
        keyFeaturesCount: parsed.keyFeatures?.length || 0,
        hasBenefits: Array.isArray(parsed.benefits),
        benefitsCount: parsed.benefits?.length || 0,
        hasTags: Array.isArray(parsed.tags),
        tagsCount: parsed.tags?.length || 0,
        wordCount: parsed.wordCount
      });
      
      // Ensure parsed object has required fields
      if (!parsed.description) {
        logger.warn('AI Description Generation - Missing description in parsed response', {
          parsedKeys: Object.keys(parsed),
          rawContent: response.content?.substring(0, 500)
        });
        parsed.description = response.content || 'Unable to generate description at this time.';
      }
      
      return {
        ...response,
        parsed: parsed,
        debug: {
          rawContentLength: response.content?.length || 0,
          parsedSuccessfully: true,
          parseMethod: 'json_parse'
        }
      };
    } catch (e) {
      // If JSON parsing fails, return the content as description
      logger.warn('AI Description Generation - JSON Parse Failed', {
        error: e.message,
        contentPreview: response.content?.substring(0, 500) || 'No content',
        contentLength: response.content?.length || 0
      });
      
      const content = response.content || 'Unable to generate description at this time.';
      const wordCount = content && typeof content === 'string' 
        ? content.trim().split(/\s+/).filter(word => word.length > 0).length 
        : 0;
      
      return {
        ...response,
        parsed: {
          description: content,
          keyFeatures: [],
          benefits: [],
          tags: [],
          wordCount: wordCount
        },
        debug: {
          rawContentLength: response.content?.length || 0,
          parsedSuccessfully: false,
          parseError: e.message,
          parseMethod: 'fallback'
        }
      };
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

  /**
   * Generate user bio
   */
  async generateUserBio(userData, preferences = {}) {
    const systemPrompt = `You are a professional bio writer for user profiles.
    Create engaging, authentic, and professional bios that highlight the user's skills, experience, and personality.
    Keep bios concise (100-200 words), professional yet personable, and tailored to the user's role and background.`;
    
    const {
      firstName,
      lastName,
      roles = [],
      profile = {},
      gender,
      birthdate,
      experience,
      skills = [],
      specialties = [],
      businessName,
      businessType,
      yearsInBusiness,
      serviceAreas = [],
      certifications = []
    } = userData;

    const {
      tone = 'professional', // professional, friendly, casual, formal
      length = 'medium', // short (50-100 words), medium (100-200 words), long (200-300 words)
      focus = 'general' // general, skills, experience, business, achievements
    } = preferences;

    const lengthMap = {
      short: '50-100 words',
      medium: '100-200 words',
      long: '200-300 words'
    };

    const age = birthdate ? Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    let prompt = `Create a ${tone} bio (${lengthMap[length] || '100-200 words'}) for a user profile.\n\n`;
    prompt += `User Information:\n`;
    prompt += `- Name: ${firstName} ${lastName}\n`;
    if (gender) prompt += `- Gender: ${gender}\n`;
    if (age) prompt += `- Age: ${age} years old\n`;
    if (roles.length > 0) prompt += `- Roles: ${roles.join(', ')}\n`;
    
    if (profile.bio) {
      prompt += `- Current bio (for reference): ${profile.bio}\n`;
    }
    
    if (experience) {
      prompt += `- Experience: ${experience} years\n`;
    }
    
    if (skills.length > 0) {
      prompt += `- Skills: ${skills.join(', ')}\n`;
    }
    
    if (specialties.length > 0) {
      prompt += `- Specialties: ${specialties.join(', ')}\n`;
    }
    
    if (businessName) {
      prompt += `- Business: ${businessName}\n`;
      if (businessType) prompt += `- Business Type: ${businessType}\n`;
      if (yearsInBusiness) prompt += `- Years in Business: ${yearsInBusiness}\n`;
    }
    
    if (serviceAreas.length > 0) {
      prompt += `- Service Areas: ${serviceAreas.join(', ')}\n`;
    }
    
    if (certifications.length > 0) {
      prompt += `- Certifications: ${certifications.map(c => c.name || c).join(', ')}\n`;
    }
    
    if (profile.rating) {
      prompt += `- Rating: ${profile.rating}/5 (${profile.totalReviews || 0} reviews)\n`;
    }
    
    prompt += `\nFocus: ${focus}\n`;
    prompt += `Tone: ${tone}\n\n`;
    prompt += `Generate a compelling bio that:\n`;
    prompt += `- Highlights key strengths and experience\n`;
    prompt += `- Reflects the user's professional identity\n`;
    prompt += `- Is authentic and engaging\n`;
    prompt += `- Uses appropriate tone (${tone})\n`;
    prompt += `- Is ${lengthMap[length] || '100-200 words'} in length\n`;
    
    if (focus !== 'general') {
      prompt += `- Emphasizes ${focus}\n`;
    }
    
    prompt += `\nReturn JSON with:\n`;
    prompt += `- bio: string (the generated bio text)\n`;
    prompt += `- highlights: array of key highlights mentioned\n`;
    prompt += `- suggestedTags: array of relevant tags/keywords\n`;
    prompt += `- wordCount: number`;
    
    const response = await this.makeAICall(prompt, systemPrompt, { 
      max_tokens: length === 'long' ? 600 : length === 'short' ? 200 : 400,
      temperature: 0.8 
    });
    
    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      // If JSON parsing fails, return the content as bio
      return {
        ...response,
        parsed: {
          bio: response.content,
          highlights: [],
          suggestedTags: [],
          wordCount: response.content.split(/\s+/).length
        }
      };
    }
  }

  /**
   * Pre-fill marketplace form fields
   */
  async prefillForm(userInput, context = {}) {
    const systemPrompt = `You are a form pre-filling assistant for a service marketplace.
    Analyze user input and suggest appropriate values for service listing form fields.
    Extract and suggest values for: title, description, category, subcategory, pricing type, estimated price, 
    service type, features, requirements, and other relevant fields.
    Return suggestions that are practical, accurate, and follow marketplace best practices.`;

    const prompt = `User input: "${userInput}"
    Context: ${JSON.stringify(context)}
    
    Analyze the input and suggest form field values. Return JSON with:
    - title: string (suggested service title)
    - description: string (suggested service description, 100-300 words)
    - category: string (one of: cleaning, plumbing, electrical, moving, landscaping, painting, carpentry, flooring, roofing, hvac, appliance_repair, locksmith, handyman, home_security, pool_maintenance, pest_control, carpet_cleaning, window_cleaning, gutter_cleaning, power_washing, snow_removal, other)
    - subcategory: string (specific subcategory)
    - pricing: {
        type: string (hourly, fixed, per_sqft, per_item),
        basePrice: number (suggested price),
        currency: string (default: USD)
      }
    - serviceType: string (one_time, recurring, emergency, maintenance, installation)
    - estimatedDuration: { min: number, max: number } (in hours)
    - features: array of strings (key features)
    - requirements: array of strings (customer requirements)
    - serviceArea: array of strings (suggested service areas if mentioned)
    - tags: array of strings (relevant tags/keywords)
    - confidence: number (0-1, confidence in suggestions)
    - reasoning: string (brief explanation of suggestions)`;

    const response = await this.makeAICall(prompt, systemPrompt, { 
      max_tokens: 800,
      temperature: 0.5 
    });

    try {
      return {
        ...response,
        parsed: JSON.parse(response.content)
      };
    } catch (e) {
      // If JSON parsing fails, return a basic structure
      return {
        ...response,
        parsed: {
          title: '',
          description: response.content || '',
          category: 'other',
          subcategory: '',
          pricing: {
            type: 'fixed',
            basePrice: 0,
            currency: 'USD'
          },
          serviceType: 'one_time',
          estimatedDuration: { min: 1, max: 2 },
          features: [],
          requirements: [],
          serviceArea: [],
          tags: [],
          confidence: 0.5,
          reasoning: 'Unable to parse AI response'
        }
      };
    }
  }
}

module.exports = new AIService();

