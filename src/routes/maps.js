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

/**
 * @swagger
 * /api/maps:
 *   get:
 *     summary: Get maps API information
 *     tags: [Maps]
 *     security: []
 *     responses:
 *       200:
 *         description: Maps API info
 */
// Public routes
router.get('/', getMapsInfo);

/**
 * @swagger
 * /api/maps/geocode:
 *   post:
 *     summary: Geocode an address to coordinates
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Geocoded coordinates
 */
router.post('/geocode', geocodeAddress);

/**
 * @swagger
 * /api/maps/reverse-geocode:
 *   post:
 *     summary: Reverse geocode coordinates to address
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Address information
 */
router.post('/reverse-geocode', reverseGeocode);

/**
 * @swagger
 * /api/maps/places/search:
 *   post:
 *     summary: Search for places
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               location:
 *                 type: object
 *               radius:
 *                 type: number
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/places/search', searchPlaces);

/**
 * @swagger
 * /api/maps/places/{placeId}:
 *   get:
 *     summary: Get place details
 *     tags: [Maps]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Place details
 */
router.get('/places/:placeId', getPlaceDetails);

/**
 * @swagger
 * /api/maps/distance:
 *   post:
 *     summary: Calculate distance between points
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: object
 *               destination:
 *                 type: object
 *     responses:
 *       200:
 *         description: Distance calculation
 */
router.post('/distance', calculateDistance);

/**
 * @swagger
 * /api/maps/nearby:
 *   post:
 *     summary: Find nearby places
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: object
 *               radius:
 *                 type: number
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nearby places
 */
router.post('/nearby', findNearbyPlaces);

/**
 * @swagger
 * /api/maps/validate-service-area:
 *   post:
 *     summary: Validate service area
 *     tags: [Maps]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - serviceArea
 *             properties:
 *               location:
 *                 type: object
 *               serviceArea:
 *                 type: object
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate-service-area', validateServiceArea);

// Protected routes
router.post('/analyze-coverage', auth, analyzeServiceCoverage);

// Admin routes - [ADMIN ONLY]
router.get('/test', auth, authorize('admin'), testConnection);

module.exports = router;
