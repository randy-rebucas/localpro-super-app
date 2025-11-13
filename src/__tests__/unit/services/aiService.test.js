// Mock axios before requiring the service
const axios = require('axios');
const logger = require('../../../config/logger');

jest.mock('axios');
jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const aiService = require('../../../services/aiService');

describe('AIService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getMockResponse', () => {
    test('should return empty fallback response', () => {
      const result = aiService.getMockResponse('test prompt');
      
      expect(result).toEqual({
        success: true,
        content: JSON.stringify({}),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('makeAICall', () => {
    test('should return fallback when no API key', async () => {
      // Service is already initialized without API key
      const result = await aiService.makeAICall('test prompt');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(JSON.stringify({}));
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should return fallback response (service initialized without API key)', async () => {
      // Since service is a singleton, it was initialized without API key
      // So it will return fallback response
      const result = await aiService.makeAICall('test prompt');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(JSON.stringify({}));
    });
  });

  describe('naturalLanguageSearch', () => {
    test('should parse JSON response', async () => {
      aiService.makeAICall = jest.fn().mockResolvedValue({
        success: true,
        content: JSON.stringify({ category: 'cleaning', location: 'Manila' })
      });

      const result = await aiService.naturalLanguageSearch('cleaning services in Manila');
      
      expect(result.parsed).toEqual({ category: 'cleaning', location: 'Manila' });
    });
  });
});

