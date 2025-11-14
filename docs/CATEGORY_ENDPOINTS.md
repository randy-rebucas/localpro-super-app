# Category Endpoints Documentation

This document lists all available API endpoints for managing and retrieving categories across the application.

## Table of Contents
1. [Job Categories](#job-categories)
2. [Provider Skills](#provider-skills)
3. [Service Categories](#service-categories)

---

## Job Categories

**Base Path:** `/api/jobs`

### Endpoints

#### 1. Get Job Categories
**GET** `/api/jobs/categories`

**Access:** Public (No authentication required)

**Description:** Retrieves all active job categories from the database.

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "Construction & Building Trades",
        "description": "Jobs related to construction, building, and infrastructure development",
        "displayOrder": 1,
        "metadata": {
          "icon": "construction",
          "color": "#FF6B35",
          "tags": ["construction", "building", "trades"]
        }
      }
    ],
    "count": 8
  }
}
```

**Controller:** `src/controllers/jobController.js` - `getJobCategories()`

**Model:** `src/models/JobCategory.js`

---

## Provider Skills

**Base Path:** `/api/providers`

### Endpoints

#### 1. Get Provider Skills
**GET** `/api/providers/skills`

**Access:** Public (No authentication required)

**Description:** Retrieves all active provider skills from the database. Can be filtered by category.

**Query Parameters:**
- `category` (optional): Filter skills by category
  - Values: `construction`, `mechanical`, `technology`, `service`, `transportation`, `health_safety`, `beauty`, `cleaning`

**Example Request:**
```
GET /api/providers/skills
GET /api/providers/skills?category=construction
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "string",
        "name": "Carpenter",
        "description": null,
        "category": "construction",
        "displayOrder": 1,
        "metadata": {}
      }
    ],
    "count": 60
  }
}
```

**Controller:** `src/controllers/providerController.js` - `getProviderSkills()`

**Model:** `src/models/ProviderSkill.js`

---

## Service Categories

**Base Path:** `/api/marketplace`

### Endpoints

#### 1. Get Service Categories
**GET** `/api/marketplace/services/categories`

**Access:** Public (No authentication required)

**Description:** Retrieves all active service categories with optional statistics.

**Query Parameters:**
- `includeStats` (optional): Include statistics for each category
  - Values: `true` (default) or `false`
  - When `true`: Returns categories with service counts, pricing stats, ratings, and popular subcategories
  - When `false`: Returns only category definitions

**Example Request:**
```
GET /api/marketplace/services/categories
GET /api/marketplace/services/categories?includeStats=false
```

**Response (with stats):**
```json
{
  "success": true,
  "message": "Service categories retrieved successfully",
  "data": [
    {
      "key": "cleaning",
      "name": "Cleaning Services",
      "description": "Professional cleaning services for homes and businesses",
      "icon": "🧹",
      "subcategories": ["residential_cleaning", "commercial_cleaning", ...],
      "displayOrder": 1,
      "metadata": {},
      "statistics": {
        "totalServices": 150,
        "pricing": {
          "average": 75,
          "min": 25,
          "max": 200
        },
        "rating": {
          "average": 4.5,
          "totalRatings": 1200
        },
        "popularSubcategories": [
          {
            "subcategory": "residential_cleaning",
            "count": 80
          }
        ]
      }
    }
  ],
  "summary": {
    "totalCategories": 22,
    "totalServices": 1500,
    "totalProviders": 300,
    "categoriesWithServices": 20
  }
}
```

**Response (without stats):**
```json
{
  "success": true,
  "message": "Service categories retrieved successfully",
  "data": [
    {
      "key": "cleaning",
      "name": "Cleaning Services",
      "description": "Professional cleaning services for homes and businesses",
      "icon": "🧹",
      "subcategories": ["residential_cleaning", "commercial_cleaning", ...],
      "displayOrder": 1,
      "metadata": {}
    }
  ]
}
```

**Controller:** `src/controllers/marketplaceController.js` - `getServiceCategories()`

**Model:** `src/models/ServiceCategory.js`

---

#### 2. Get Category Details
**GET** `/api/marketplace/services/categories/:category`

**Access:** Public (No authentication required)

**Description:** Retrieves detailed information about a specific service category including statistics and services.

**Path Parameters:**
- `category` (required): Category key (e.g., `cleaning`, `plumbing`, `electrical`)

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of services per page (default: 20)
- `sortBy` (optional): Sort field (default: `createdAt`)
- `sortOrder` (optional): Sort direction - `asc` or `desc` (default: `desc`)
- `includeServices` (optional): Include services in response - `true` or `false` (default: `true`)

**Example Request:**
```
GET /api/marketplace/services/categories/cleaning
GET /api/marketplace/services/categories/plumbing?page=1&limit=10&includeServices=true
```

**Response:**
```json
{
  "success": true,
  "message": "Category details retrieved successfully",
  "data": {
    "category": "cleaning",
    "name": "Cleaning Services",
    "description": "Professional cleaning services for homes and businesses",
    "icon": "🧹",
    "subcategories": ["residential_cleaning", "commercial_cleaning", ...],
    "statistics": {
      "totalServices": 150,
      "providerCount": 45,
      "pricing": {
        "average": 75,
        "min": 25,
        "max": 200,
        "median": 70
      },
      "rating": {
        "average": 4.5,
        "totalRatings": 1200,
        "totalReviews": 1200
      },
      "subcategoryDistribution": [
        {
          "_id": "residential_cleaning",
          "count": 80
        }
      ],
      "pricingTypeDistribution": [
        {
          "_id": "hourly",
          "count": 100
        }
      ]
    },
    "services": [
      {
        "_id": "string",
        "title": "Professional House Cleaning",
        "description": "...",
        "pricing": {
          "type": "hourly",
          "basePrice": 50,
          "currency": "USD"
        },
        "rating": {
          "average": 4.8,
          "count": 150
        },
        "images": [...],
        "category": "cleaning",
        "subcategory": "residential_cleaning",
        "provider": {
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "avatar": {...}
          }
        }
      }
    ],
    "featuredServices": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**Controller:** `src/controllers/marketplaceController.js` - `getCategoryDetails()`

**Model:** `src/models/ServiceCategory.js`

---

## Available Categories

### Job Categories (8 total)
1. Construction & Building Trades
2. Mechanical & Industrial Trades
3. Technology & Electrical Trades
4. Service & Technical Trades
5. Transportation & Logistics
6. Health & Safety Trades
7. Beauty Services
8. Cleaning Services

### Provider Skills (60 total)
Organized by category:
- **Construction** (15 skills): Carpenter, Electrician, Plumber, Welder, etc.
- **Mechanical** (9 skills): Machinist, Millwright, Automotive Technician, etc.
- **Technology** (5 skills): Electronics Technician, IT Technician, Network Technician, etc.
- **Service** (7 skills): Chef/Cook, Baker, Cosmetologist, etc.
- **Transportation** (5 skills): Commercial Driver, Crane Operator, etc.
- **Health & Safety** (6 skills): Paramedic/EMT, Firefighter, etc.
- **Beauty** (7 skills): Hairdresser, Makeup Artist, Massage Therapist, etc.
- **Cleaning** (6 skills): Housekeeper, Janitor, Window Cleaner, etc.

### Service Categories (22 total)
1. Cleaning Services
2. Plumbing Services
3. Electrical Services
4. Moving Services
5. Landscaping Services
6. Painting Services
7. Carpentry Services
8. Flooring Services
9. Roofing Services
10. HVAC Services
11. Appliance Repair
12. Locksmith Services
13. Handyman Services
14. Home Security
15. Pool Maintenance
16. Pest Control
17. Carpet Cleaning
18. Window Cleaning
19. Gutter Cleaning
20. Power Washing
21. Snow Removal
22. Other Services

---

## Seeding Data

To populate the database with default categories, run:

```bash
npm run seed:categories
```

This will seed:
- Job Categories (8)
- Provider Skills (60)
- Service Categories (22)

To clear all category data:

```bash
npm run seed:categories:clear
```

---

## Database Models

All categories are stored in MongoDB with the following models:

- **JobCategory** (`src/models/JobCategory.js`)
- **ProviderSkill** (`src/models/ProviderSkill.js`)
- **ServiceCategory** (`src/models/ServiceCategory.js`)

Each model includes:
- `isActive` - Enable/disable categories
- `displayOrder` - Control display order
- `metadata` - Additional metadata (icons, colors, tags)
- Timestamps (createdAt, updatedAt)

---

## Notes

- All category endpoints are **public** and do not require authentication
- Categories are fetched from the database, making them easily manageable
- Statistics are calculated in real-time from actual service/job data
- Categories can be enabled/disabled via the `isActive` field
- Display order can be customized via the `displayOrder` field

