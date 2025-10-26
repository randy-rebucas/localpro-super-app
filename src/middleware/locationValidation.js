// Location validation middleware for Google Maps integration
const GoogleMapsService = require('../services/googleMapsService');
const logger = require('../utils/logger');


/**
 * Middleware to validate and geocode addresses
 * @param {string} addressField - Field name containing the address (default: 'address')
 * @param {boolean} requireCoordinates - Whether coordinates are required (default: true)
 * @returns {Function} Express middleware function
 */
const validateAndGeocodeAddress = (addressField = 'address', requireCoordinates = true) => {
  return async(req, res, next) => {
    try {
      const address = req.body[addressField];

      if (!address) {
        return res.status(400).json({
          success: false,
          message: `${addressField} is required`
        });
      }

      // If address is a string, geocode it
      if (typeof address === 'string') {
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);

        if (!geocodeResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid address provided',
            error: geocodeResult.error
          });
        }

        // Add geocoded data to request body
        req.body[addressField] = {
          street: geocodeResult.addressComponents.street || '',
          city: geocodeResult.addressComponents.city || '',
          state: geocodeResult.addressComponents.state || '',
          zipCode: geocodeResult.addressComponents.postalCode || '',
          country: geocodeResult.addressComponents.country || '',
          coordinates: geocodeResult.coordinates,
          formattedAddress: geocodeResult.formattedAddress,
          placeId: geocodeResult.placeId
        };
      }
      // If address is an object, validate and geocode if needed
      else if (typeof address === 'object') {
        // If coordinates are missing but address components exist, geocode
        if (!address.coordinates && (address.street || address.city)) {
          const addressString = [
            address.street,
            address.city,
            address.state,
            address.zipCode,
            address.country
          ].filter(Boolean).join(', ');

          const geocodeResult = await GoogleMapsService.geocodeAddress(addressString);

          if (geocodeResult.success) {
            req.body[addressField].coordinates = geocodeResult.coordinates;
            req.body[addressField].formattedAddress = geocodeResult.formattedAddress;
            req.body[addressField].placeId = geocodeResult.placeId;
          }
        }

        // Validate required fields
        if (requireCoordinates && !req.body[addressField].coordinates) {
          return res.status(400).json({
            success: false,
            message: 'Valid coordinates are required for this address'
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Address validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Address validation failed'
      });
    }
  };
};

/**
 * Middleware to validate service area coverage
 * @param {string} serviceField - Field name containing service data (default: 'serviceId')
 * @param {string} addressField - Field name containing address (default: 'address')
 * @returns {Function} Express middleware function
 */
const validateServiceArea = (serviceField = 'serviceId', addressField = 'address') => {
  return async(req, res, next) => {
    try {
      const { Service } = require('../models/Marketplace');
      const serviceId = req.body[serviceField];
      const address = req.body[addressField];

      if (!serviceId || !address) {
        return res.status(400).json({
          success: false,
          message: 'Service ID and address are required'
        });
      }

      // Get service details
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Validate service area if coordinates are available
      if (address.coordinates) {
        const validationResult = await GoogleMapsService.validateServiceArea(
          address.coordinates,
          service.serviceArea
        );

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Unable to validate service area',
            error: validationResult.error
          });
        }

        if (!validationResult.isInServiceArea) {
          return res.status(400).json({
            success: false,
            message: 'Service is not available in this location',
            locationInfo: validationResult.locationInfo,
            availableAreas: service.serviceArea
          });
        }

        // Add location info to request for potential use
        req.locationInfo = validationResult.locationInfo;
      }

      next();
    } catch (error) {
      logger.error('Service area validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Service area validation failed'
      });
    }
  };
};

/**
 * Middleware to calculate distance and add to request
 * @param {string} originField - Field name containing origin location
 * @param {string} destinationField - Field name containing destination location
 * @param {object} options - Distance calculation options
 * @returns {Function} Express middleware function
 */
const calculateDistance = (originField, destinationField, options = {}) => {
  return async(req, res, next) => {
    try {
      const origin = req.body[originField];
      const destination = req.body[destinationField];

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          message: 'Origin and destination are required'
        });
      }

      // Extract coordinates
      const originCoords = origin.coordinates || origin;
      const destCoords = destination.coordinates || destination;

      if (!originCoords || !destCoords) {
        return res.status(400).json({
          success: false,
          message: 'Valid coordinates are required for both origin and destination'
        });
      }

      const distanceResult = await GoogleMapsService.calculateDistance(
        originCoords,
        destCoords,
        options
      );

      if (!distanceResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Unable to calculate distance',
          error: distanceResult.error
        });
      }

      // Add distance information to request
      req.distanceInfo = distanceResult;

      next();
    } catch (error) {
      logger.error('Distance calculation error:', error);
      res.status(500).json({
        success: false,
        message: 'Distance calculation failed'
      });
    }
  };
};

/**
 * Middleware to validate coordinates format
 * @param {string} coordinatesField - Field name containing coordinates
 * @returns {Function} Express middleware function
 */
const validateCoordinates = (coordinatesField = 'coordinates') => {
  return (req, res, next) => {
    try {
      const coordinates = req.body[coordinatesField];

      if (!coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Coordinates are required'
        });
      }

      // Validate coordinate format
      if (typeof coordinates !== 'object' ||
          typeof coordinates.lat !== 'number' ||
          typeof coordinates.lng !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates format. Expected {lat: number, lng: number}'
        });
      }

      // Validate coordinate ranges
      if (coordinates.lat < -90 || coordinates.lat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude. Must be between -90 and 90'
        });
      }

      if (coordinates.lng < -180 || coordinates.lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid longitude. Must be between -180 and 180'
        });
      }

      next();
    } catch (error) {
      logger.error('Coordinates validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Coordinates validation failed'
      });
    }
  };
};

/**
 * Middleware to enhance location data with Google Maps information
 * @param {string} locationField - Field name containing location data
 * @returns {Function} Express middleware function
 */
const enhanceLocationData = (locationField = 'location') => {
  return async(req, res, next) => {
    try {
      const location = req.body[locationField];

      if (!location) {
        return next();
      }

      // If location has coordinates but no address, reverse geocode
      if (location.coordinates && !location.formattedAddress) {
        const reverseGeocodeResult = await GoogleMapsService.reverseGeocode(
          location.coordinates.lat,
          location.coordinates.lng
        );

        if (reverseGeocodeResult.success) {
          req.body[locationField] = {
            ...location,
            formattedAddress: reverseGeocodeResult.formattedAddress,
            addressComponents: reverseGeocodeResult.addressComponents,
            placeId: reverseGeocodeResult.placeId
          };
        }
      }

      next();
    } catch (error) {
      logger.error('Location enhancement error:', error);
      // Don't fail the request, just log the error
      logger.warn('Location enhancement failed, continuing without enhancement');
      next();
    }
  };
};

module.exports = {
  validateAndGeocodeAddress,
  validateServiceArea,
  calculateDistance,
  validateCoordinates,
  enhanceLocationData
};
