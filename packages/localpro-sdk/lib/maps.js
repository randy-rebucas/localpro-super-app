/**
 * Maps API methods for LocalPro SDK
 */
class MapsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get maps API information
   * @returns {Promise<Object>} Maps API info
   */
  async getInfo() {
    return await this.client.get('/api/maps');
  }

  /**
   * Geocode an address to coordinates
   * @param {Object} addressData - Address data
   * @param {string} addressData.address - Address string
   * @returns {Promise<Object>} Geocoded coordinates
   */
  async geocode(addressData) {
    if (!addressData.address) {
      throw new Error('Address is required');
    }

    return await this.client.post('/api/maps/geocode', addressData);
  }

  /**
   * Reverse geocode coordinates to address
   * @param {Object} coordinates - Coordinates
   * @param {number} coordinates.lat - Latitude
   * @param {number} coordinates.lng - Longitude
   * @returns {Promise<Object>} Address information
   */
  async reverseGeocode(coordinates) {
    if (!coordinates.lat || !coordinates.lng) {
      throw new Error('Latitude and longitude are required');
    }

    return await this.client.post('/api/maps/reverse-geocode', coordinates);
  }

  /**
   * Search for places
   * @param {Object} searchData - Search data
   * @param {string} searchData.query - Search query
   * @param {Object} [searchData.location] - Location bias (lat, lng)
   * @param {number} [searchData.radius] - Search radius in meters
   * @param {string} [searchData.type] - Place type filter
   * @returns {Promise<Object>} Search results
   */
  async searchPlaces(searchData) {
    if (!searchData.query) {
      throw new Error('Search query is required');
    }

    return await this.client.post('/api/maps/places/search', searchData);
  }

  /**
   * Get place details by place ID
   * @param {string} placeId - Google Places place ID
   * @returns {Promise<Object>} Place details
   */
  async getPlaceDetails(placeId) {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    return await this.client.get(`/api/maps/places/${placeId}`);
  }

  /**
   * Calculate distance between points
   * @param {Object} distanceData - Distance calculation data
   * @param {Object} distanceData.origin - Origin coordinates {lat, lng}
   * @param {Object} distanceData.destination - Destination coordinates {lat, lng}
   * @param {string} [distanceData.mode] - Travel mode (driving, walking, bicycling, transit)
   * @param {string} [distanceData.units] - Units (metric, imperial)
   * @returns {Promise<Object>} Distance and duration information
   */
  async calculateDistance(distanceData) {
    if (!distanceData.origin || !distanceData.destination) {
      throw new Error('Origin and destination are required');
    }

    if (!distanceData.origin.lat || !distanceData.origin.lng) {
      throw new Error('Origin must have lat and lng');
    }

    if (!distanceData.destination.lat || !distanceData.destination.lng) {
      throw new Error('Destination must have lat and lng');
    }

    return await this.client.post('/api/maps/distance', distanceData);
  }

  /**
   * Find nearby places
   * @param {Object} nearbyData - Nearby search data
   * @param {number} nearbyData.lat - Latitude
   * @param {number} nearbyData.lng - Longitude
   * @param {number} [nearbyData.radius] - Search radius in meters
   * @param {string} [nearbyData.type] - Place type filter
   * @param {string} [nearbyData.keyword] - Keyword filter
   * @returns {Promise<Object>} Nearby places
   */
  async findNearby(nearbyData) {
    if (!nearbyData.lat || !nearbyData.lng) {
      throw new Error('Latitude and longitude are required');
    }

    return await this.client.post('/api/maps/nearby', nearbyData);
  }

  /**
   * Validate service area coverage
   * @param {Object} areaData - Service area data
   * @param {Object} areaData.location - Location to validate {lat, lng}
   * @param {Array<Object>} areaData.serviceAreas - Array of service area polygons
   * @returns {Promise<Object>} Validation result
   */
  async validateServiceArea(areaData) {
    if (!areaData.location || !areaData.serviceAreas) {
      throw new Error('Location and service areas are required');
    }

    return await this.client.post('/api/maps/validate-service-area', areaData);
  }

  /**
   * Analyze service coverage (Protected route)
   * @param {Object} coverageData - Coverage analysis data
   * @param {Array<Object>} coverageData.locations - Array of service locations
   * @param {number} [coverageData.radius] - Service radius in meters
   * @returns {Promise<Object>} Coverage analysis
   */
  async analyzeCoverage(coverageData) {
    if (!coverageData.locations) {
      throw new Error('Locations are required');
    }

    return await this.client.post('/api/maps/analyze-coverage', coverageData);
  }

  /**
   * Test maps API connection (Admin only)
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    return await this.client.get('/api/maps/test');
  }
}

module.exports = MapsAPI;
