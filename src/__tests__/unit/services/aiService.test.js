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
        content: expect.any(String),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });
      expect(logger.warn).toHaveBeenCalled();
      
      // Verify the content is a valid JSON string
      const parsedContent = JSON.parse(result.content);
      expect(parsedContent).toHaveProperty('description');
      expect(parsedContent).toHaveProperty('keyFeatures');
      expect(parsedContent).toHaveProperty('benefits');
      expect(parsedContent).toHaveProperty('tags');
    });
  });

  describe('makeAICall', () => {
    test('should return fallback when no API key', async () => {
      // Service is already initialized without API key
      const result = await aiService.makeAICall('test prompt');
      
      expect(result.success).toBe(true);
      expect(typeof result.content).toBe('string');
      expect(axios.post).not.toHaveBeenCalled();
      
      // Verify the content is a valid JSON string
      const parsedContent = JSON.parse(result.content);
      expect(parsedContent).toHaveProperty('description');
    });

    test('should return fallback response (service initialized without API key)', async () => {
      // Since service is a singleton, it was initialized without API key
      // So it will return fallback response
      const result = await aiService.makeAICall('test prompt');
      
      expect(result.success).toBe(true);
      expect(typeof result.content).toBe('string');
      
      // Verify the content is a valid JSON string
      const parsedContent = JSON.parse(result.content);
      expect(parsedContent).toHaveProperty('description');
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

