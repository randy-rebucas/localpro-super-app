const { Client } = require('@googlemaps/google-maps-services-js');

jest.mock('@googlemaps/google-maps-services-js');
jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const googleMapsService = require('../../../services/googleMapsService');

describe('GoogleMapsService', () => {
  const originalEnv = process.env;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockClient = {
      geocode: jest.fn(),
      placesNearby: jest.fn(),
      distancematrix: jest.fn()
    };
    Client.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('geocodeAddress', () => {
    test('should return error when API key not configured', async () => {
      // Service was initialized without API key, so geocodingApiKey is undefined
      const originalKey = googleMapsService.geocodingApiKey;
      googleMapsService.geocodingApiKey = undefined;
      
      const result = await googleMapsService.geocodeAddress('test address');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
      
      googleMapsService.geocodingApiKey = originalKey;
    });

    test('should geocode address successfully', async () => {
      // Update the service's API key and client
      googleMapsService.geocodingApiKey = 'test-key';
      googleMapsService.client = mockClient;
      
      mockClient.geocode.mockResolvedValue({
        data: {
          results: [{
            geometry: {
              location: { lat: 14.5995, lng: 120.9842 }
            },
            formatted_address: 'Manila, Philippines',
            address_components: [],
            place_id: 'test-place-id',
            types: []
          }]
        }
      });

      const result = await googleMapsService.geocodeAddress('Manila');
      
      expect(result.success).toBe(true);
      expect(result.coordinates).toEqual({ lat: 14.5995, lng: 120.9842 });
    });
  });

  describe('testConnection', () => {
    test('should test API connection', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-key';
      googleMapsService.geocodeAddress = jest.fn().mockResolvedValue({ success: true });
      
      const result = await googleMapsService.testConnection();
      
      expect(result.success).toBeDefined();
    });
  });
});

