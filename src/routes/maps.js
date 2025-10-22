// Google Maps routes
const express = require('express');
const router = express.Router();
const {
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  getPlaceDetails,
  calculateDistance,
  findNearbyPlaces,
  validateServiceArea,
  analyzeServiceCoverage,
  testConnection,
  getMapsInfo
} = require('../controllers/mapsController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getMapsInfo);
router.post('/geocode', geocodeAddress);
router.post('/reverse-geocode', reverseGeocode);
router.post('/places/search', searchPlaces);
router.get('/places/:placeId', getPlaceDetails);
router.post('/distance', calculateDistance);
router.post('/nearby', findNearbyPlaces);
router.post('/validate-service-area', validateServiceArea);

// Protected routes
router.post('/analyze-coverage', auth, analyzeServiceCoverage);

// Admin routes
router.get('/test', auth, authorize('admin'), testConnection);

module.exports = router;
