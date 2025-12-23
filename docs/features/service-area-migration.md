# Service Area Migration Guide

## Overview

The `serviceArea` field in the Service model has been enhanced to support a more flexible and powerful structure that enables:

- **Geospatial queries** using coordinates and radius
- **Better location matching** with separate fields for zip codes and cities
- **Backward compatibility** with the old format (array of strings)

## Old Format vs New Format

### Old Format (Still Supported)
```json
{
  "serviceArea": ["10001", "New York", "Brooklyn", "11201"]
}
```

### New Format (Recommended)
```json
{
  "serviceArea": [
    {
      "name": "Manhattan",
      "zipCodes": ["10001", "10002", "10003"],
      "cities": ["New York"],
      "coordinates": {
        "lat": 40.7831,
        "lng": -73.9712
      },
      "radius": 50
    },
    {
      "name": "Brooklyn",
      "zipCodes": ["11201", "11202"],
      "cities": ["Brooklyn"],
      "coordinates": {
        "lat": 40.6782,
        "lng": -73.9442
      },
      "radius": 30
    }
  ]
}
```

## Field Descriptions

### New Format Fields

- **`name`** (String, optional): Human-readable name for the service area (e.g., "Manhattan", "Downtown LA")
- **`zipCodes`** (Array of Strings): Array of zip codes in this service area
- **`cities`** (Array of Strings): Array of city names in this service area
- **`coordinates`** (Object, optional): Geographic coordinates
  - `lat` (Number): Latitude
  - `lng` (Number): Longitude
- **`radius`** (Number, optional): Service radius in kilometers (used for geospatial queries)

## Benefits of New Format

1. **Geospatial Queries**: Find services within a specific radius of coordinates
2. **Better Matching**: Separate zip codes and cities for more accurate matching
3. **Flexibility**: Support multiple service areas with different radii
4. **Future-Proof**: Easy to extend with additional location data

## API Usage

### Creating a Service with New Format

```javascript
// POST /api/marketplace/services
{
  "title": "House Cleaning Service",
  "category": "cleaning",
  "subcategory": "residential",
  "serviceArea": [
    {
      "name": "Manhattan",
      "zipCodes": ["10001", "10002", "10003"],
      "cities": ["New York"],
      "radius": 50
    }
  ],
  "pricing": {
    "type": "hourly",
    "basePrice": 50
  }
}
```

### Creating a Service with Old Format (Still Works)

```javascript
// POST /api/marketplace/services
{
  "title": "House Cleaning Service",
  "category": "cleaning",
  "subcategory": "residential",
  "serviceArea": ["10001", "New York", "Brooklyn"],
  "pricing": {
    "type": "hourly",
    "basePrice": 50
  }
}
```

The old format will be automatically converted to the new format when the service is saved.

### Automatic Geocoding

If you provide a `name` in the new format but no `coordinates`, the system will attempt to geocode the location automatically:

```javascript
{
  "serviceArea": [
    {
      "name": "Manhattan, NY",
      "zipCodes": ["10001"],
      "radius": 50
      // coordinates will be automatically geocoded
    }
  ]
}
```

## Searching Services by Location

### Text-Based Search (Works with Both Formats)

```javascript
// GET /api/marketplace/services?location=New York
// Matches services with "New York" in their serviceArea
```

### Geospatial Search (New Format Only)

```javascript
// GET /api/marketplace/services?location=New York&coordinates={"lat":40.7128,"lng":-74.0060}&maxDistance=25
// Finds services within 25km of the specified coordinates
```

## Migration

### Automatic Migration

The system automatically converts old format to new format when:
- A service is saved (pre-save hook)
- A service is updated

### Manual Migration Script

To migrate all existing services at once:

```bash
# Dry run (see what would be changed)
node scripts/migrate-service-area.js --dry-run

# Migrate without geocoding
node scripts/migrate-service-area.js

# Migrate with geocoding (adds coordinates to service areas)
node scripts/migrate-service-area.js --geocode
```

## Validation

The model validates that `serviceArea` is either:
1. An array of strings (old format)
2. An array of objects with at least one of: `name`, `coordinates`, `zipCodes`, or `cities`

## Helper Functions

The `serviceAreaHelper` utility provides several useful functions:

```javascript
const {
  normalizeServiceArea,
  buildServiceAreaQuery,
  isLocationInServiceArea,
  extractZipCodes,
  extractCities
} = require('../utils/serviceAreaHelper');

// Normalize to new format
const normalized = normalizeServiceArea(["10001", "New York"]);

// Build MongoDB query
const query = buildServiceAreaQuery({
  location: "New York",
  coordinates: { lat: 40.7128, lng: -74.0060 },
  maxDistance: 25
});

// Check if location is in service area
const isInArea = isLocationInServiceArea(serviceArea, {
  city: "New York",
  zipCode: "10001"
});

// Extract all zip codes
const zipCodes = extractZipCodes(serviceArea);

// Extract all cities
const cities = extractCities(serviceArea);
```

## Best Practices

1. **Use the new format** for new services
2. **Include coordinates** when possible for better geospatial queries
3. **Set appropriate radius** based on your service coverage
4. **Use both zipCodes and cities** for better matching
5. **Keep names descriptive** for better user experience

## Backward Compatibility

- Old format services continue to work
- Old format is automatically converted on save
- Search and filtering work with both formats
- No breaking changes to existing APIs

