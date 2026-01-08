// Google Maps routes
const express = require('express');
const router = express.Router();
const {
  geocodeAddress,
  reverseGeocode,
  getAddressFromCoordinates,
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
 * /api/maps/address:
 *   get:
 *     summary: Convert coordinates to formatted address
 *     description: Convert latitude and longitude coordinates into a human-readable formatted address
 *     tags: [Maps]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude (-90 to 90)
 *         example: 40.7128
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude (-180 to 180)
 *         example: -74.0060
 *     responses:
 *       200:
 *         description: Formatted address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA"
 *                     formattedAddress:
 *                       type: string
 *                     addressComponents:
 *                       type: object
 *                     placeId:
 *                       type: string
 *                     types:
 *                       type: array
 *                       items:
 *                         type: string
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *       400:
 *         description: Invalid coordinates or missing parameters
 *       500:
 *         description: Server error
 */
router.get('/address', getAddressFromCoordinates);

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
