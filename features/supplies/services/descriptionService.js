const aiService = require('../../../src/services/aiService');
const logger = require('../../../src/config/logger');
const { ValidationError, ExternalServiceError } = require('../errors/SuppliesErrors');

const VALID_CATEGORIES = ['cleaning_supplies', 'tools', 'materials', 'equipment'];

const _mapAiErrorCode = (code) => {
  const map = {
    AI_NOT_CONFIGURED: 503,
    AI_AUTH_FAILED: 503,
    AI_RATE_LIMITED: 429,
    AI_SERVICE_ERROR: 503
  };
  return map[code] || 500;
};

const generateDescription = async ({ name, category, subcategory, options }, userId) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Supply name is required');
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  const validOptions = {};
  if (options) {
    if (options.length && ['short', 'medium', 'long'].includes(options.length)) {
      validOptions.length = options.length;
    }
    if (options.tone && ['professional', 'friendly', 'casual'].includes(options.tone)) {
      validOptions.tone = options.tone;
    }
    if (typeof options.includeFeatures === 'boolean') {
      validOptions.includeFeatures = options.includeFeatures;
    }
    if (typeof options.includeBenefits === 'boolean') {
      validOptions.includeBenefits = options.includeBenefits;
    }
  }

  if (category) validOptions.category = category;
  if (subcategory) validOptions.subcategory = subcategory;

  logger.info('Generating supply description from name', {
    name: name.trim(), category, subcategory, options: validOptions, userId
  });

  const aiResponse = await aiService.generateSupplyDescriptionFromName(name.trim(), validOptions);

  if (!aiResponse.success) {
    logger.warn('AI service returned error for supply description', {
      error: aiResponse.error, code: aiResponse.code, userId
    });

    const statusCode = _mapAiErrorCode(aiResponse.code);
    throw new ExternalServiceError(
      'aiService',
      aiResponse.error || 'Failed to generate description',
      statusCode,
      aiResponse.code || 'AI_ERROR'
    );
  }

  logger.info('AI Response received for supply description', {
    hasParsed: !!aiResponse.parsed, hasContent: !!aiResponse.content,
    hasUsage: !!aiResponse.usage, hasDebug: !!aiResponse.debug,
    success: aiResponse.success, parsedKeys: aiResponse.parsed ? Object.keys(aiResponse.parsed) : [],
    debugInfo: aiResponse.debug || {}
  });

  return {
    result: {
      description: aiResponse.parsed.description || '',
      keyFeatures: Array.isArray(aiResponse.parsed.keyFeatures) ? aiResponse.parsed.keyFeatures : [],
      benefits: Array.isArray(aiResponse.parsed.benefits) ? aiResponse.parsed.benefits : [],
      useCases: Array.isArray(aiResponse.parsed.useCases) ? aiResponse.parsed.useCases : [],
      suggestedTags: Array.isArray(aiResponse.parsed.suggestedTags) ? aiResponse.parsed.suggestedTags : [],
      suggestedTitle: aiResponse.parsed.suggestedTitle || name.trim(),
      wordCount: typeof aiResponse.parsed.wordCount === 'number' ? aiResponse.parsed.wordCount : 0
    },
    usage: aiResponse.usage || null
  };
};

module.exports = {
  generateDescription
};
