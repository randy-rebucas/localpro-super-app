const GoogleMapsService = require('../services/googleMapsService');

// @desc    Get maps service information
// @route   GET /api/maps
// @access  Public
const getMapsInfo = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Google Maps service is available',
      data: {
        service: 'Google Maps API',
        features: [
          'Geocoding',
          'Reverse Geocoding',
          'Places Search',
          'Distance Calculation',
          'Nearby Places',
          'Service Area Validation'
        ],
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Get maps info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Geocode an address to get coordinates
// @route   POST /api/maps/geocode
// @access  Public
const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const result = await GoogleMapsService.geocodeAddress(address);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to geocode address',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coordinates: result.coordinates,
        formattedAddress: result.formattedAddress,
        addressComponents: result.addressComponents,
        placeId: result.placeId,
        types: result.types
      }
    });
  } catch (error) {
    console.error('Geocode address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reverse geocode coordinates to get address
// @route   POST /api/maps/reverse-geocode
// @access  Public
const reverseGeocode = async (req, res) => {
  try {
    // Support both {lat, lng} object and separate lat/lng parameters
    let lat, lng;
    
    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      lat = req.body.lat;
      lng = req.body.lng;
    } else if (req.body.coordinates) {
      // Handle coordinates object or array format
      if (Array.isArray(req.body.coordinates) && req.body.coordinates.length === 2) {
        // GeoJSON format [lng, lat]
        lng = req.body.coordinates[0];
        lat = req.body.coordinates[1];
      } else if (req.body.coordinates.lat !== undefined && req.body.coordinates.lng !== undefined) {
        // Object format {lat, lng}
        lat = req.body.coordinates.lat;
        lng = req.body.coordinates.lng;
      }
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required. Provide either {lat, lng} or {coordinates: {lat, lng}}'
      });
    }

    // Parse and validate coordinates
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude and longitude must be valid numbers'
      });
    }

    if (parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be between -90 and 90'
      });
    }

    if (parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be between -180 and 180'
      });
    }

    // Call service with separate parameters (lat, lng)
    const result = await GoogleMapsService.reverseGeocode(parsedLat, parsedLng);

    if (!result.success) {
      // Return appropriate status code based on error
      const statusCode = result.statusCode === 403 ? 403 : 
                        result.statusCode === 429 ? 429 :
                        result.statusCode === 500 || result.statusCode === 503 ? 503 : 400;
      
      return res.status(statusCode).json({
        success: false,
        message: 'Failed to reverse geocode coordinates',
        error: result.error || 'Unknown error',
        ...(result.details && { details: result.details })
      });
    }

    res.status(200).json({
      success: true,
      data: {
        formattedAddress: result.formattedAddress,
        addressComponents: result.addressComponents,
        placeId: result.placeId,
        types: result.types
      }
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search for places
// @route   POST /api/maps/places/search
// @access  Public
const searchPlaces = async (req, res) => {
  try {
    const { query, location, radius, type } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchOptions = {
      query,
      location,
      radius: radius ? parseInt(radius) : undefined,
      type
    };

    const result = await GoogleMapsService.searchPlaces(searchOptions);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to search places',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get place details
// @route   GET /api/maps/places/:placeId
// @access  Public
const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    const result = await GoogleMapsService.getPlaceDetails(placeId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get place details',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get place details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Calculate distance between two points
// @route   POST /api/maps/distance
// @access  Public
const calculateDistance = async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const result = await GoogleMapsService.calculateDistance(origin, destination, mode);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate distance',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Find nearby places
// @route   POST /api/maps/nearby
// @access  Public
const findNearbyPlaces = async (req, res) => {
  try {
    const { location, radius, type, keyword } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const searchOptions = {
      location,
      radius: radius ? parseInt(radius) : 5000,
      type,
      keyword
    };

    const result = await GoogleMapsService.findNearbyPlaces(searchOptions);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to find nearby places',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Find nearby places error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate service area coverage
// @route   POST /api/maps/validate-service-area
// @access  Public
const validateServiceArea = async (req, res) => {
  try {
    const { coordinates, serviceAreas } = req.body;

    if (!coordinates || !serviceAreas) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates and service areas are required'
      });
    }

    const result = await GoogleMapsService.validateServiceArea(coordinates, serviceAreas);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to validate service area',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Validate service area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Analyze service coverage
// @route   POST /api/maps/analyze-coverage
// @access  Private
const analyzeServiceCoverage = async (req, res) => {
  try {
    const { serviceAreas, analysisType = 'basic' } = req.body;

    if (!serviceAreas) {
      return res.status(400).json({
        success: false,
        message: 'Service areas are required'
      });
    }

    const result = await GoogleMapsService.analyzeServiceCoverage(serviceAreas, analysisType);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to analyze service coverage',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Analyze service coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Test Google Maps API connection
// @route   GET /api/maps/test
// @access  Private (Admin)
const testConnection = async (req, res) => {
  try {
    const result = await GoogleMapsService.testConnection();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Google Maps API connection failed',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Google Maps API connection successful',
      data: result.data
    });
  } catch (error) {
    console.error('Test Google Maps connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMapsInfo,
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  getPlaceDetails,
  calculateDistance,
  findNearbyPlaces,
  validateServiceArea,
  analyzeServiceCoverage,
  testConnection
};