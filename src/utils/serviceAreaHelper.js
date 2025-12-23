/**
 * Service Area Helper Utility
 * 
 * Provides utilities for working with serviceArea in both old format (array of strings)
 * and new format (array of objects with coordinates, radius, zipCodes, cities)
 */

/**
 * Normalize serviceArea to new format
 * @param {Array|Object} serviceArea - Service area in old or new format
 * @returns {Array} Normalized service area array
 */
function normalizeServiceArea(serviceArea) {
  if (!serviceArea) return [];
  
  // If already in new format (array of objects)
  if (Array.isArray(serviceArea) && serviceArea.length > 0 && typeof serviceArea[0] === 'object' && serviceArea[0] !== null) {
    return serviceArea;
  }
  
  // If in old format (array of strings), convert to new format
  if (Array.isArray(serviceArea) && serviceArea.length > 0 && typeof serviceArea[0] === 'string') {
    return serviceArea.map(area => {
      const trimmed = area.trim();
      const isZipCode = /^\d{5}(-\d{4})?$/.test(trimmed);
      
      return {
        name: trimmed,
        zipCodes: isZipCode ? [trimmed] : [],
        cities: isZipCode ? [] : [trimmed],
        coordinates: null,
        radius: null // in kilometers
      };
    });
  }
  
  return [];
}

/**
 * Build MongoDB query for serviceArea filtering
 * Supports both old and new formats, and geospatial queries
 * @param {Object} options - Filter options
 * @param {string} options.location - Location string (city name or zip code)
 * @param {Object} options.coordinates - {lat, lng} coordinates
 * @param {number} options.maxDistance - Maximum distance in kilometers (for geospatial queries)
 * @returns {Object} MongoDB query object
 */
function buildServiceAreaQuery(options = {}) {
  const { location, coordinates, maxDistance } = options;
  
  if (!location && !coordinates) {
    return {};
  }
  
  const query = {
    $or: []
  };
  
  // Text-based search (works with both old and new formats)
  if (location) {
    const locationRegex = new RegExp(location, 'i');
    
    // Match old format (array of strings)
    query.$or.push({
      serviceArea: { $in: [locationRegex] }
    });
    
    // Match new format - search in name, cities, and zipCodes
    query.$or.push({
      'serviceArea.name': locationRegex
    });
    query.$or.push({
      'serviceArea.cities': { $in: [locationRegex] }
    });
    query.$or.push({
      'serviceArea.zipCodes': { $in: [location] }
    });
  }
  
  // Geospatial query (only works with new format that has coordinates)
  if (coordinates && coordinates.lat && coordinates.lng) {
    // Note: This requires a geospatial index on serviceArea.coordinates
    // For now, we'll use a text-based fallback, but this can be enhanced
    // with $geoWithin or $nearSphere queries when coordinates are available
    
    // If maxDistance is provided, we can use geospatial query
    // This would require the serviceArea to have coordinates
    // For now, we'll rely on text-based matching
  }
  
  // If no $or conditions were added, return empty query
  if (query.$or.length === 0) {
    return {};
  }
  
  return query;
}

/**
 * Check if a location is within service area
 * @param {Array|Object} serviceArea - Service area in old or new format
 * @param {Object} location - Location to check {city, zipCode, coordinates}
 * @returns {boolean} True if location is in service area
 */
function isLocationInServiceArea(serviceArea, location) {
  const normalized = normalizeServiceArea(serviceArea);
  
  if (normalized.length === 0) return false;
  
  const { city, zipCode, coordinates } = location;
  
  return normalized.some(area => {
    // Check zip code match
    if (zipCode && area.zipCodes && area.zipCodes.includes(zipCode)) {
      return true;
    }
    
    // Check city name match
    if (city && area.cities && area.cities.some(c => 
      c.toLowerCase().includes(city.toLowerCase()) || 
      city.toLowerCase().includes(c.toLowerCase())
    )) {
      return true;
    }
    
    // Check name match (for backward compatibility)
    if (city && area.name && (
      area.name.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(area.name.toLowerCase())
    )) {
      return true;
    }
    
    // Check geospatial match (if coordinates are available)
    if (coordinates && area.coordinates && area.radius) {
      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        area.coordinates.lat,
        area.coordinates.lng
      );
      return distance <= area.radius;
    }
    
    return false;
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Extract all zip codes from service area
 * @param {Array|Object} serviceArea - Service area in old or new format
 * @returns {Array} Array of zip codes
 */
function extractZipCodes(serviceArea) {
  const normalized = normalizeServiceArea(serviceArea);
  const zipCodes = new Set();
  
  normalized.forEach(area => {
    if (area.zipCodes && Array.isArray(area.zipCodes)) {
      area.zipCodes.forEach(zip => zipCodes.add(zip));
    }
    // Also check if name is a zip code (old format)
    if (area.name && /^\d{5}(-\d{4})?$/.test(area.name.trim())) {
      zipCodes.add(area.name.trim());
    }
  });
  
  return Array.from(zipCodes);
}

/**
 * Extract all city names from service area
 * @param {Array|Object} serviceArea - Service area in old or new format
 * @returns {Array} Array of city names
 */
function extractCities(serviceArea) {
  const normalized = normalizeServiceArea(serviceArea);
  const cities = new Set();
  
  normalized.forEach(area => {
    if (area.cities && Array.isArray(area.cities)) {
      area.cities.forEach(city => cities.add(city));
    }
    // Also check name if it's not a zip code
    if (area.name && !/^\d{5}(-\d{4})?$/.test(area.name.trim())) {
      cities.add(area.name.trim());
    }
  });
  
  return Array.from(cities);
}

module.exports = {
  normalizeServiceArea,
  buildServiceAreaQuery,
  isLocationInServiceArea,
  calculateDistance,
  extractZipCodes,
  extractCities
};

