const {
  validateAndGeocodeAddress,
  validateCoordinates,
  enhanceLocationData
} = require('../../../middleware/locationValidation');
const GoogleMapsService = require('../../../services/googleMapsService');

jest.mock('../../../services/googleMapsService');

describe('Location Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndGeocodeAddress', () => {
    test('should return 400 if address is missing', async () => {
      req.body = {};
      const middleware = validateAndGeocodeAddress('address');

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'address is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should geocode string address', async () => {
      const geocodeResult = {
        success: true,
        addressComponents: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        coordinates: { lat: 40.7128, lng: -74.0060 },
        formattedAddress: '123 Main St, New York, NY 10001, USA',
        placeId: 'place123'
      };
      GoogleMapsService.geocodeAddress = jest.fn().mockResolvedValue(geocodeResult);
      req.body.address = '123 Main St, New York, NY';

      const middleware = validateAndGeocodeAddress('address');
      await middleware(req, res, next);

      expect(GoogleMapsService.geocodeAddress).toHaveBeenCalledWith('123 Main St, New York, NY');
      expect(req.body.address).toEqual({
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        formattedAddress: '123 Main St, New York, NY 10001, USA',
        placeId: 'place123'
      });
      expect(next).toHaveBeenCalled();
    });

    test('should return 400 if geocoding fails', async () => {
      const geocodeResult = {
        success: false,
        error: 'Invalid address'
      };
      GoogleMapsService.geocodeAddress = jest.fn().mockResolvedValue(geocodeResult);
      req.body.address = 'Invalid Address';

      const middleware = validateAndGeocodeAddress('address');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid address provided',
        error: 'Invalid address'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should geocode object address if coordinates missing', async () => {
      const geocodeResult = {
        success: true,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        formattedAddress: '123 Main St, New York, NY 10001, USA',
        placeId: 'place123'
      };
      GoogleMapsService.geocodeAddress = jest.fn().mockResolvedValue(geocodeResult);
      req.body.address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY'
      };

      const middleware = validateAndGeocodeAddress('address');
      await middleware(req, res, next);

      expect(req.body.address.coordinates).toEqual({ lat: 40.7128, lng: -74.0060 });
      expect(next).toHaveBeenCalled();
    });

    test('should return 400 if coordinates required but missing', async () => {
      req.body.address = {
        street: '123 Main St',
        city: 'New York'
      };
      GoogleMapsService.geocodeAddress = jest.fn().mockResolvedValue({ success: false });

      const middleware = validateAndGeocodeAddress('address', true);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid coordinates are required for this address'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      GoogleMapsService.geocodeAddress = jest.fn().mockRejectedValue(new Error('Service error'));
      req.body.address = '123 Main St';

      const originalError = console.error;
      console.error = jest.fn();

      const middleware = validateAndGeocodeAddress('address');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Address validation failed'
      });

      console.error = originalError;
    });
  });

  describe('validateCoordinates', () => {
    test('should return 400 if coordinates missing', () => {
      req.body = {};
      const middleware = validateCoordinates('coordinates');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Coordinates are required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 if coordinates format invalid', () => {
      req.body.coordinates = { lat: 'invalid', lng: -74.0060 };
      const middleware = validateCoordinates('coordinates');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid coordinates format. Expected {lat: number, lng: number}'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 if latitude out of range', () => {
      req.body.coordinates = { lat: 100, lng: -74.0060 };
      const middleware = validateCoordinates('coordinates');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid latitude. Must be between -90 and 90'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 if longitude out of range', () => {
      req.body.coordinates = { lat: 40.7128, lng: 200 };
      const middleware = validateCoordinates('coordinates');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid longitude. Must be between -180 and 180'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow valid coordinates', () => {
      req.body.coordinates = { lat: 40.7128, lng: -74.0060 };
      const middleware = validateCoordinates('coordinates');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('enhanceLocationData', () => {
    test('should reverse geocode if coordinates exist but no address', async () => {
      const reverseGeocodeResult = {
        success: true,
        formattedAddress: '123 Main St, New York, NY',
        addressComponents: {
          street: '123 Main St',
          city: 'New York'
        },
        placeId: 'place123'
      };
      GoogleMapsService.reverseGeocode = jest.fn().mockResolvedValue(reverseGeocodeResult);
      req.body.location = {
        coordinates: { lat: 40.7128, lng: -74.0060 }
      };

      const middleware = enhanceLocationData('location');
      await middleware(req, res, next);

      expect(GoogleMapsService.reverseGeocode).toHaveBeenCalledWith(40.7128, -74.0060);
      expect(req.body.location.formattedAddress).toBe('123 Main St, New York, NY');
      expect(next).toHaveBeenCalled();
    });

    test('should not reverse geocode if address already exists', async () => {
      req.body.location = {
        coordinates: { lat: 40.7128, lng: -74.0060 },
        formattedAddress: 'Existing Address'
      };

      const middleware = enhanceLocationData('location');
      await middleware(req, res, next);

      expect(GoogleMapsService.reverseGeocode).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should continue if location is missing', async () => {
      req.body = {};

      const middleware = enhanceLocationData('location');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      GoogleMapsService.reverseGeocode = jest.fn().mockRejectedValue(new Error('Service error'));
      req.body.location = {
        coordinates: { lat: 40.7128, lng: -74.0060 }
      };

      const originalError = console.error;
      const originalWarn = console.warn;
      console.error = jest.fn();
      console.warn = jest.fn();

      const middleware = enhanceLocationData('location');
      await middleware(req, res, next);

      expect(console.warn).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      console.error = originalError;
      console.warn = originalWarn;
    });
  });
});

