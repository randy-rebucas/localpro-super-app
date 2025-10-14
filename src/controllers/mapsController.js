// Google Maps controller for location-based functionality
const GoogleMapsService = require('../services/googleMapsService');

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

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
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
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const result = await GoogleMapsService.reverseGeocode(lat, lng);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search for places using text input
// @route   POST /api/maps/places/search
// @access  Public
const searchPlaces = async (req, res) => {
  try {
    const { input, options = {} } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Search input is required'
      });
    }

    const result = await GoogleMapsService.searchPlaces(input, options);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get place details by place ID
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

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
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
    const { origin, destination, options = {} } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const result = await GoogleMapsService.calculateDistance(origin, destination, options);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
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
    const { location, radius, type } = req.body;

    if (!location || !radius || !type) {
      return res.status(400).json({
        success: false,
        message: 'Location, radius, and type are required'
      });
    }

    const result = await GoogleMapsService.findNearbyPlaces(location, radius, type);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
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

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Validate service area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Analyze service coverage for a provider
// @route   POST /api/maps/analyze-coverage
// @access  Private
const analyzeServiceCoverage = async (req, res) => {
  try {
    const { providerLocation, serviceAreas, maxDistance } = req.body;

    if (!providerLocation || !serviceAreas) {
      return res.status(400).json({
        success: false,
        message: 'Provider location and service areas are required'
      });
    }

    const result = await GoogleMapsService.analyzeServiceCoverage(
      providerLocation,
      serviceAreas,
      maxDistance
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
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

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
