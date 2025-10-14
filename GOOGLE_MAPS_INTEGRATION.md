# Google Maps Integration for LocalPro Super App

## Overview

This document describes the comprehensive Google Maps integration implemented in the LocalPro Super App. The integration provides location-based services including geocoding, places search, distance calculations, and service area validation.

## Features Implemented

### 🗺️ Core Google Maps Services

1. **Geocoding Service** - Convert addresses to coordinates
2. **Reverse Geocoding** - Convert coordinates to addresses
3. **Places Search** - Search for places with autocomplete
4. **Distance Matrix** - Calculate distances and travel times
5. **Nearby Places** - Find places within a radius
6. **Service Area Validation** - Validate if locations are within service areas
7. **Coverage Analysis** - Analyze service coverage for providers

### 🏗️ Architecture

```
src/
├── services/
│   └── googleMapsService.js          # Main Google Maps service
├── middleware/
│   └── locationValidation.js         # Location validation middleware
├── controllers/
│   └── mapsController.js             # Maps API endpoints
└── routes/
    └── maps.js                       # Maps routes
```

## Installation & Setup

### 1. Dependencies

The following package has been installed:
```bash
npm install @googlemaps/google-maps-services-js
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_GEOCODING_API_KEY=your-google-maps-geocoding-api-key
GOOGLE_MAPS_PLACES_API_KEY=your-google-maps-places-api-key
GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your-google-maps-distance-matrix-api-key
```

**Note:** You can use the same API key for all services, or separate keys for different APIs.

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Geocoding API**
   - **Places API**
   - **Distance Matrix API**
   - **Maps JavaScript API** (for frontend)
4. Create API credentials (API Key)
5. Restrict the API key to your domain/IP for security

## API Endpoints

### Public Endpoints

#### Geocode Address
```http
POST /api/maps/geocode
Content-Type: application/json

{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "lat": 37.4220656,
      "lng": -122.0840897
    },
    "formattedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
    "placeId": "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
    "addressComponents": {
      "streetNumber": "1600",
      "route": "Amphitheatre Parkway",
      "city": "Mountain View",
      "state": "CA",
      "postalCode": "94043",
      "country": "United States"
    }
  }
}
```

#### Reverse Geocode
```http
POST /api/maps/reverse-geocode
Content-Type: application/json

{
  "lat": 37.4220656,
  "lng": -122.0840897
}
```

#### Search Places
```http
POST /api/maps/places/search
Content-Type: application/json

{
  "input": "restaurants near Times Square",
  "options": {
    "types": "establishment",
    "location": "40.7580,-73.9855",
    "radius": 1000
  }
}
```

#### Calculate Distance
```http
POST /api/maps/distance
Content-Type: application/json

{
  "origin": {
    "lat": 37.4220656,
    "lng": -122.0840897
  },
  "destination": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "options": {
    "units": "imperial",
    "mode": "driving"
  }
}
```

#### Find Nearby Places
```http
POST /api/maps/nearby
Content-Type: application/json

{
  "location": {
    "lat": 40.7580,
    "lng": -73.9855
  },
  "radius": 1000,
  "type": "restaurant"
}
```

#### Validate Service Area
```http
POST /api/maps/validate-service-area
Content-Type: application/json

{
  "coordinates": {
    "lat": 40.7580,
    "lng": -73.9855
  },
  "serviceAreas": ["New York", "NYC", "Manhattan", "Brooklyn"]
}
```

### Protected Endpoints

#### Analyze Service Coverage
```http
POST /api/maps/analyze-coverage
Authorization: Bearer <token>
Content-Type: application/json

{
  "providerLocation": {
    "lat": 40.7580,
    "lng": -73.9855
  },
  "serviceAreas": ["New York", "Brooklyn", "Queens"],
  "maxDistance": 50000
}
```

#### Test API Connection
```http
GET /api/maps/test
Authorization: Bearer <admin-token>
```

## Integration with Existing Controllers

### Marketplace Controller

The marketplace controller has been enhanced with Google Maps functionality:

#### New Endpoint: Nearby Services
```http
GET /api/marketplace/services/nearby?lat=40.7580&lng=-73.9855&radius=50000
```

This endpoint returns services with distance calculations and filters by radius.

#### Enhanced Booking Creation
The booking creation now includes:
- Service area validation
- Automatic geocoding of addresses
- Distance calculations

### Rentals Controller

Enhanced with location-based filtering and distance calculations.

## Middleware

### Location Validation Middleware

The following middleware functions are available:

```javascript
const {
  validateAndGeocodeAddress,
  validateServiceArea,
  calculateDistance,
  validateCoordinates,
  enhanceLocationData
} = require('../middleware/locationValidation');
```

#### Usage Examples:

```javascript
// Validate and geocode address
router.post('/bookings', 
  validateAndGeocodeAddress('address'),
  createBooking
);

// Validate service area
router.post('/bookings',
  validateServiceArea('serviceId', 'address'),
  createBooking
);

// Calculate distance
router.post('/bookings',
  calculateDistance('origin', 'destination'),
  createBooking
);
```

## Service Usage Examples

### Basic Geocoding
```javascript
const GoogleMapsService = require('../services/googleMapsService');

// Geocode an address
const result = await GoogleMapsService.geocodeAddress('New York, NY');
if (result.success) {
  console.log('Coordinates:', result.coordinates);
  console.log('Formatted Address:', result.formattedAddress);
}
```

### Distance Calculation
```javascript
const distance = await GoogleMapsService.calculateDistance(
  { lat: 40.7580, lng: -73.9855 }, // Origin
  { lat: 40.7128, lng: -74.0060 }, // Destination
  { units: 'imperial', mode: 'driving' }
);

if (distance.success) {
  console.log('Distance:', distance.distance.text);
  console.log('Duration:', distance.duration.text);
}
```

### Service Area Validation
```javascript
const validation = await GoogleMapsService.validateServiceArea(
  { lat: 40.7580, lng: -73.9855 },
  ['New York', 'NYC', 'Manhattan']
);

if (validation.success && validation.isInServiceArea) {
  console.log('Location is within service area');
}
```

## Error Handling

All Google Maps service methods return a consistent response format:

```javascript
{
  success: boolean,
  data?: object,     // Present when success is true
  error?: string     // Present when success is false
}
```

Common error scenarios:
- Invalid API key
- Rate limit exceeded
- Invalid coordinates
- No results found
- Network errors

## Rate Limiting & Best Practices

### Rate Limits
- Google Maps APIs have usage quotas
- Implement caching for frequently requested data
- Use batch requests when possible

### Best Practices
1. **Cache Results**: Cache geocoding results to reduce API calls
2. **Validate Input**: Always validate coordinates and addresses
3. **Handle Errors**: Implement proper error handling for API failures
4. **Security**: Restrict API keys to specific domains/IPs
5. **Monitoring**: Monitor API usage and costs

## Frontend Integration

For frontend integration, you'll need:

1. **Maps JavaScript API**: For displaying maps
2. **Places API**: For autocomplete and place details
3. **Geocoding API**: For address conversion

### Example Frontend Usage:
```javascript
// Initialize map
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 40.7580, lng: -73.9855 },
  zoom: 13
});

// Add markers for services
services.forEach(service => {
  new google.maps.Marker({
    position: service.coordinates,
    map: map,
    title: service.title
  });
});
```

## Testing

The integration includes comprehensive error handling and validation. Test the API endpoints using:

1. **Postman Collection**: Use the provided Postman collection
2. **Unit Tests**: Create tests for the GoogleMapsService
3. **Integration Tests**: Test with real Google Maps API

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check if APIs are enabled in Google Cloud Console
   - Verify API key restrictions
   - Check billing is enabled

2. **Rate Limit Exceeded**
   - Implement caching
   - Reduce API calls
   - Consider upgrading quota

3. **Invalid Coordinates**
   - Validate coordinate ranges (-90 to 90 for lat, -180 to 180 for lng)
   - Check coordinate format

4. **No Results Found**
   - Verify address format
   - Check if location exists
   - Try different search terms

## Cost Optimization

1. **Cache Results**: Implement Redis or database caching
2. **Batch Requests**: Use batch geocoding when possible
3. **Smart Caching**: Cache by location and time
4. **Monitor Usage**: Set up billing alerts

## Security Considerations

1. **API Key Security**: Never expose API keys in frontend code
2. **Input Validation**: Validate all user inputs
3. **Rate Limiting**: Implement server-side rate limiting
4. **HTTPS Only**: Use HTTPS for all API calls

## Future Enhancements

1. **Geospatial Queries**: Implement MongoDB geospatial queries
2. **Real-time Updates**: Add real-time location tracking
3. **Route Optimization**: Implement route optimization for providers
4. **Heat Maps**: Add service demand heat maps
5. **Predictive Analytics**: Use location data for demand prediction

## Support

For issues or questions:
1. Check Google Maps API documentation
2. Review error logs
3. Test with Google Maps API directly
4. Contact development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
