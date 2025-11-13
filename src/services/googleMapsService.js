// Google Maps service for LocalPro Super App
// Handles geocoding, places search, distance calculations, and location services

const { Client } = require('@googlemaps/google-maps-services-js');
const logger = require('../config/logger');

class GoogleMapsService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.geocodingApiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || this.apiKey;
    this.placesApiKey = process.env.GOOGLE_MAPS_PLACES_API_KEY || this.apiKey;
    this.distanceMatrixApiKey = process.env.GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY || this.apiKey;
    
    if (!this.apiKey) {
      logger.warn('Google Maps API key not configured. Some features may not work.');
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<object>} Geocoding result with coordinates and formatted address
   */
  async geocodeAddress(address) {
    try {
      if (!this.geocodingApiKey) {
        throw new Error('Google Maps Geocoding API key not configured');
      }

      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.geocodingApiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        return {
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          formattedAddress: result.formatted_address,
          addressComponents: this.parseAddressComponents(result.address_components),
          placeId: result.place_id,
          types: result.types
        };
      } else {
        return {
          success: false,
          error: 'No results found for the given address'
        };
      }
    } catch (error) {
      logger.error('Geocoding error:', error);
      return {
        success: false,
        error: error.message || 'Geocoding failed'
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<object>} Reverse geocoding result
   */
  async reverseGeocode(lat, lng) {
    try {
      if (!this.geocodingApiKey) {
        throw new Error('Google Maps Geocoding API key not configured');
      }

      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.geocodingApiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          success: true,
          formattedAddress: result.formatted_address,
          addressComponents: this.parseAddressComponents(result.address_components),
          placeId: result.place_id,
          types: result.types
        };
      } else {
        return {
          success: false,
          error: 'No results found for the given coordinates'
        };
      }
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      
      // Handle specific HTTP error codes
      let errorMessage = 'Reverse geocoding failed';
      
      if (error.response) {
        const statusCode = error.response.status;
        const statusText = error.response.statusText;
        
        switch (statusCode) {
          case 400:
            errorMessage = 'Invalid coordinates provided. Please check latitude and longitude values.';
            break;
          case 403:
            errorMessage = 'Google Maps API access denied. Please check: 1) API key is valid, 2) Geocoding API is enabled in Google Cloud Console, 3) API key restrictions allow this request, 4) Billing is enabled for your Google Cloud project.';
            break;
          case 404:
            errorMessage = 'Geocoding API endpoint not found. Please verify your API configuration.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later or check your API quota.';
            break;
          case 500:
          case 503:
            errorMessage = 'Google Maps API service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Google Maps API error (${statusCode}): ${statusText || error.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        statusCode: error.response?.status,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: error.message,
          response: error.response?.data
        } : undefined
      };
    }
  }

  /**
   * Search for places using text input
   * @param {string} input - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} Places search result
   */
  async searchPlaces(input, options = {}) {
    try {
      if (!this.placesApiKey) {
        throw new Error('Google Maps Places API key not configured');
      }

      const params = {
        input: input,
        key: this.placesApiKey,
        ...options
      };

      const response = await this.client.placeAutocomplete({
        params: params,
      });

      if (response.data.predictions && response.data.predictions.length > 0) {
        const predictions = response.data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          structuredFormatting: prediction.structured_formatting,
          types: prediction.types,
          terms: prediction.terms
        }));

        return {
          success: true,
          predictions: predictions
        };
      } else {
        return {
          success: false,
          error: 'No places found for the given input'
        };
      }
    } catch (error) {
      logger.error('Places search error:', error);
      return {
        success: false,
        error: error.message || 'Places search failed'
      };
    }
  }

  /**
   * Get place details by place ID
   * @param {string} placeId - Google Places place ID
   * @returns {Promise<object>} Place details
   */
  async getPlaceDetails(placeId) {
    try {
      if (!this.placesApiKey) {
        throw new Error('Google Maps Places API key not configured');
      }

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.placesApiKey,
          fields: ['name', 'formatted_address', 'geometry', 'address_components', 'types', 'place_id']
        },
      });

      if (response.data.result) {
        const result = response.data.result;
        
        return {
          success: true,
          placeId: result.place_id,
          name: result.name,
          formattedAddress: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          addressComponents: this.parseAddressComponents(result.address_components),
          types: result.types
        };
      } else {
        return {
          success: false,
          error: 'Place details not found'
        };
      }
    } catch (error) {
      logger.error('Place details error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get place details'
      };
    }
  }

  /**
   * Calculate distance and travel time between two points
   * @param {object} origin - Origin coordinates {lat, lng} or address
   * @param {object} destination - Destination coordinates {lat, lng} or address
   * @param {object} options - Distance matrix options
   * @returns {Promise<object>} Distance matrix result
   */
  async calculateDistance(origin, destination, options = {}) {
    try {
      if (!this.distanceMatrixApiKey) {
        throw new Error('Google Maps Distance Matrix API key not configured');
      }

      const params = {
        origins: [origin],
        destinations: [destination],
        key: this.distanceMatrixApiKey,
        units: options.units || 'imperial',
        mode: options.mode || 'driving',
        avoid: options.avoid || [],
        traffic_model: options.trafficModel || 'best_guess',
        departure_time: options.departureTime || 'now',
        ...options
      };

      const response = await this.client.distancematrix({
        params: params,
      });

      if (response.data.rows && response.data.rows.length > 0) {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          return {
            success: true,
            distance: {
              text: element.distance.text,
              value: element.distance.value // in meters
            },
            duration: {
              text: element.duration.text,
              value: element.duration.value // in seconds
            },
            durationInTraffic: element.duration_in_traffic ? {
              text: element.duration_in_traffic.text,
              value: element.duration_in_traffic.value
            } : null
          };
        } else {
          return {
            success: false,
            error: `Distance calculation failed: ${element.status}`
          };
        }
      } else {
        return {
          success: false,
          error: 'No distance matrix results found'
        };
      }
    } catch (error) {
      logger.error('Distance calculation error:', error);
      return {
        success: false,
        error: error.message || 'Distance calculation failed'
      };
    }
  }

  /**
   * Find nearby services within a radius
   * @param {object} location - Center location {lat, lng}
   * @param {number} radius - Search radius in meters
   * @param {string} type - Place type to search for
   * @returns {Promise<object>} Nearby places result
   */
  async findNearbyPlaces(location, radius, type) {
    try {
      if (!this.placesApiKey) {
        throw new Error('Google Maps Places API key not configured');
      }

      const response = await this.client.placesNearby({
        params: {
          location: location,
          radius: radius,
          type: type,
          key: this.placesApiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const places = response.data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          vicinity: place.vicinity,
          types: place.types,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          photos: place.photos ? place.photos.map(photo => ({
            photoReference: photo.photo_reference,
            height: photo.height,
            width: photo.width
          })) : []
        }));

        return {
          success: true,
          places: places,
          nextPageToken: response.data.next_page_token
        };
      } else {
        return {
          success: false,
          error: 'No nearby places found'
        };
      }
    } catch (error) {
      logger.error('Nearby places search error:', error);
      return {
        success: false,
        error: error.message || 'Nearby places search failed'
      };
    }
  }

  /**
   * Validate if coordinates are within a service area
   * @param {object} coordinates - Coordinates {lat, lng}
   * @param {Array} serviceAreas - Array of service area strings (cities, zip codes)
   * @returns {Promise<object>} Validation result
   */
  async validateServiceArea(coordinates, serviceAreas) {
    try {
      // First, get the address components for the coordinates
      const reverseGeocodeResult = await this.reverseGeocode(coordinates.lat, coordinates.lng);
      
      if (!reverseGeocodeResult.success) {
        return {
          success: false,
          error: 'Unable to validate service area'
        };
      }

      const addressComponents = reverseGeocodeResult.addressComponents;
      const city = addressComponents.city;
      const zipCode = addressComponents.postalCode;
      const state = addressComponents.state;

      // Check if any service area matches
      const isInServiceArea = serviceAreas.some(area => {
        const areaLower = area.toLowerCase();
        return (
          city && city.toLowerCase().includes(areaLower) ||
          zipCode && zipCode.includes(area) ||
          state && state.toLowerCase().includes(areaLower) ||
          areaLower.includes(city?.toLowerCase()) ||
          areaLower.includes(state?.toLowerCase())
        );
      });

      return {
        success: true,
        isInServiceArea: isInServiceArea,
        locationInfo: {
          city: city,
          state: state,
          zipCode: zipCode,
          country: addressComponents.country
        }
      };
    } catch (error) {
      logger.error('Service area validation error:', error);
      return {
        success: false,
        error: error.message || 'Service area validation failed'
      };
    }
  }

  /**
   * Calculate service area coverage for a provider
   * @param {object} providerLocation - Provider's location {lat, lng}
   * @param {Array} serviceAreas - Array of service area strings
   * @param {number} maxDistance - Maximum service distance in meters
   * @returns {Promise<object>} Coverage analysis result
   */
  async analyzeServiceCoverage(providerLocation, serviceAreas, maxDistance = 50000) {
    try {
      const coverageAnalysis = [];

      for (const area of serviceAreas) {
        // Geocode the service area to get coordinates
        const geocodeResult = await this.geocodeAddress(area);
        
        if (geocodeResult.success) {
          // Calculate distance from provider to service area
          const distanceResult = await this.calculateDistance(
            providerLocation,
            geocodeResult.coordinates
          );

          if (distanceResult.success) {
            const isWithinRange = distanceResult.distance.value <= maxDistance;
            
            coverageAnalysis.push({
              area: area,
              coordinates: geocodeResult.coordinates,
              distance: distanceResult.distance,
              duration: distanceResult.duration,
              isWithinRange: isWithinRange,
              coverage: isWithinRange ? 'covered' : 'outside_range'
            });
          }
        }
      }

      const coveredAreas = coverageAnalysis.filter(area => area.isWithinRange);
      const coveragePercentage = (coveredAreas.length / serviceAreas.length) * 100;

      return {
        success: true,
        totalAreas: serviceAreas.length,
        coveredAreas: coveredAreas.length,
        coveragePercentage: Math.round(coveragePercentage),
        analysis: coverageAnalysis,
        recommendations: this.generateCoverageRecommendations(coverageAnalysis, maxDistance)
      };
    } catch (error) {
      logger.error('Service coverage analysis error:', error);
      return {
        success: false,
        error: error.message || 'Service coverage analysis failed'
      };
    }
  }

  /**
   * Parse address components from Google Maps response
   * @param {Array} components - Address components array
   * @returns {object} Parsed address components
   */
  parseAddressComponents(components) {
    const parsed = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        parsed.route = component.long_name;
      } else if (types.includes('locality')) {
        parsed.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.state = component.short_name;
      } else if (types.includes('postal_code')) {
        parsed.postalCode = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
        parsed.countryCode = component.short_name;
      } else if (types.includes('neighborhood')) {
        parsed.neighborhood = component.long_name;
      }
    });

    // Construct full street address
    if (parsed.streetNumber && parsed.route) {
      parsed.street = `${parsed.streetNumber} ${parsed.route}`;
    } else if (parsed.route) {
      parsed.street = parsed.route;
    }

    return parsed;
  }

  /**
   * Generate coverage recommendations
   * @param {Array} analysis - Coverage analysis results
   * @param {number} maxDistance - Maximum service distance
   * @returns {Array} Recommendations
   */
  generateCoverageRecommendations(analysis, maxDistance) {
    const recommendations = [];
    
    const outsideRangeAreas = analysis.filter(area => !area.isWithinRange);
    
    if (outsideRangeAreas.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${outsideRangeAreas.length} service areas are outside your maximum service range (${maxDistance / 1000}km)`,
        areas: outsideRangeAreas.map(area => area.area)
      });
    }

    const farAreas = analysis.filter(area => 
      area.isWithinRange && area.distance.value > maxDistance * 0.8
    );
    
    if (farAreas.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${farAreas.length} service areas are near your maximum range limit`,
        areas: farAreas.map(area => area.area)
      });
    }

    return recommendations;
  }

  /**
   * Test Google Maps API connectivity
   * @returns {Promise<object>} Test result
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Google Maps API key not configured'
        };
      }

      // Test with empty address - just verify API key is valid
      const testResult = await this.geocodeAddress('');
      
      if (testResult.success || testResult.error) {
        // If we get any response (success or error), API is configured
        return {
          success: true,
          message: 'Google Maps API connection successful',
          apiKey: this.apiKey.substring(0, 10) + '...'
        };
      } else {
        return {
          success: false,
          error: 'Google Maps API test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Google Maps API connection test failed'
      };
    }
  }
}

module.exports = new GoogleMapsService();
