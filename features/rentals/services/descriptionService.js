const aiService = require('../../../src/services/aiService');
const logger = require('../../../src/config/logger');
const { ValidationError } = require('../errors/RentalsErrors');

const VALID_CATEGORIES = ['tools', 'vehicles', 'equipment', 'machinery'];

const generateDescription = async ({ name, options }, userId) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Rental name is required');
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
    if (options.category && VALID_CATEGORIES.includes(options.category)) {
      validOptions.category = options.category;
    }
  }

  logger.info('Generating rental description from name', {
    name: name.trim(), options: validOptions, userId
  });

  const aiResponse = await aiService.generateRentalDescriptionFromName(name.trim(), validOptions);

  logger.info('AI Response received', {
    hasParsed: !!aiResponse.parsed, hasContent: !!aiResponse.content,
    hasUsage: !!aiResponse.usage, hasDebug: !!aiResponse.debug,
    success: aiResponse.success, parsedKeys: aiResponse.parsed ? Object.keys(aiResponse.parsed) : [],
    debugInfo: aiResponse.debug || {}
  });

  let result = {};
  if (aiResponse.parsed) {
    result = aiResponse.parsed;
  } else if (aiResponse.content) {
    logger.warn('Using content as fallback (parsed not available)', {
      contentLength: aiResponse.content.length
    });
    result = {
      description: aiResponse.content,
      keyFeatures: [],
      benefits: [],
      useCases: [],
      tags: [],
      wordCount: 0
    };
  } else {
    logger.error('No parsed or content available in AI response', {
      aiResponseKeys: Object.keys(aiResponse)
    });
    result = {
      description: 'Unable to generate description at this time.',
      keyFeatures: [],
      benefits: [],
      useCases: [],
      tags: [],
      wordCount: 0
    };
  }

  if (!result.description || typeof result.description !== 'string') {
    result.description = String(result.description || 'Unable to generate description at this time.');
  }

  if (!Array.isArray(result.keyFeatures)) result.keyFeatures = [];
  if (!Array.isArray(result.benefits)) result.benefits = [];
  if (!Array.isArray(result.useCases)) result.useCases = [];
  if (!Array.isArray(result.tags)) result.tags = [];

  return {
    result: {
      description: result.description.trim(),
      keyFeatures: result.keyFeatures,
      benefits: result.benefits,
      useCases: result.useCases,
      tags: result.tags,
      wordCount: result.wordCount || result.description.trim().split(/\s+/).filter(w => w.length > 0).length
    },
    usage: aiResponse.usage || null,
    debug: aiResponse.debug || null
  };
};

module.exports = {
  generateDescription
};
