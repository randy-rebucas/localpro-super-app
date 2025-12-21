# Marketplace Features Documentation

## Overview

The Marketplace feature enables service discovery, booking, and management for clients and providers in the LocalPro Super App. It provides a comprehensive service marketplace platform that supports a wide range of service categories with advanced filtering, location-based search, payment processing, and review systems.

## Base Path
`/api/marketplace`

---

## Core Features

### 1. Service Management
- **Create Service Listings** - Providers and admins can create detailed service listings
- **Update Services** - Modify service details, pricing, and availability
- **Delete Services** - Remove service listings when no longer available
- **Image Upload** - Upload multiple images for service listings
- **Service Details** - Comprehensive service information including:
  - Title and description
  - Category classification
  - Pricing and duration
  - Service area (cities and radius)
  - Provider information

### 2. Service Discovery
- **Browse Services** - Paginated listing of all available services
- **Advanced Filtering** - Filter by:
  - Category
  - Location
  - Price range
  - Rating
  - Search keywords
- **Location-Based Search** - Find nearby services using coordinates
- **Category Browsing** - Browse services by category
- **Provider Profiles** - View detailed provider information

### 3. Booking System
- **Create Bookings** - Schedule service appointments with specific requirements
- **Booking History** - Track all past and upcoming bookings
- **Status Management** - Update booking status throughout the service lifecycle
- **Photo Upload** - Upload photos during service delivery
- **Review System** - Rate and review completed services
- **Payment Integration** - Secure payment processing via PayPal/PayMaya

### 4. Payment Integration
- **PayPal Integration** - Process payments through PayPal
- **Order Approval** - Approve PayPal bookings
- **Payment Tracking** - Monitor payment status and order details
- **Multiple Payment Methods** - Support for various payment gateways

### 5. Review & Rating System
- **Service Reviews** - Clients can rate and review completed services
- **Review Sentiment Analysis** - AI-powered sentiment analysis of reviews
- **Provider Ratings** - Aggregate ratings for provider profiles
- **Review Insights** - Extract actionable insights from reviews

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/services` | Get all services | `page`, `limit`, `category`, `location`, `search` |
| GET | `/services/categories` | Get service categories | - |
| GET | `/services/categories/:category` | Get category details | - |
| GET | `/services/nearby` | Get nearby services | `lat`, `lng`, `radius`, `category` |
| GET | `/services/:id` | Get service details | - |
| GET | `/services/:id/providers` | Get providers for service | `page`, `limit` |
| GET | `/providers/:id` | Get provider details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/my-services` | Get my services | AUTHENTICATED |
| GET | `/my-bookings` | Get my bookings | AUTHENTICATED |
| POST | `/services` | Create service | **provider, admin** |
| PUT | `/services/:id` | Update service | **provider, admin** |
| DELETE | `/services/:id` | Delete service | **provider, admin** |
| POST | `/services/:id/images` | Upload service images | **provider, admin** |
| POST | `/bookings` | Create booking | AUTHENTICATED |
| GET | `/bookings` | Get bookings | AUTHENTICATED |
| GET | `/bookings/:id` | Get booking details | AUTHENTICATED |
| PUT | `/bookings/:id/status` | Update booking status | AUTHENTICATED |
| POST | `/bookings/:id/photos` | Upload booking photos | AUTHENTICATED |
| POST | `/bookings/:id/review` | Add review | AUTHENTICATED |
| POST | `/bookings/paypal/approve` | Approve PayPal booking | AUTHENTICATED |
| GET | `/bookings/paypal/order/:orderId` | Get PayPal order details | AUTHENTICATED |

---

## Request/Response Examples

### Create Service (Provider)

```http
POST /api/marketplace/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Home Cleaning Service",
  "description": "Professional home cleaning",
  "category": "cleaning",
  "price": 500,
  "duration": 120,
  "serviceArea": {
    "cities": ["Manila", "Quezon City"],
    "radius": 10
  }
}
```

### Create Booking (Client)

```http
POST /api/marketplace/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "service_id_here",
  "providerId": "provider_id_here",
  "scheduledDate": "2025-01-15T10:00:00Z",
  "address": {
    "street": "123 Main St",
    "city": "Manila",
    "coordinates": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  },
  "notes": "Please bring cleaning supplies"
}
```

### Update Booking Status

```http
PUT /api/marketplace/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Booking confirmed"
}
```

---

## Service Booking Flow

### 1. Service Discovery
- Client browses services via `/services` endpoint
- Client applies filters by category, location, price, and rating
- Client views detailed service information and provider profiles
- Client can search for nearby services using location coordinates

### 2. Booking Creation
- Client selects a service and provider
- Client creates booking via `/bookings` endpoint with:
  - Service ID and Provider ID
  - Scheduled date and time
  - Service address with coordinates
  - Additional notes or requirements
- System validates service availability
- Payment processing initiated (PayPal/PayMaya)

### 3. Booking Management
- Provider or Client updates booking status
- Photos can be uploaded during service delivery
- Status progresses through workflow stages
- Review and rating added after service completion

---

## Booking Status Flow

The booking status follows this progression:

```
pending → confirmed → in_progress → completed → reviewed
```

**Status Details:**
- **pending** - Initial booking state, awaiting confirmation
- **confirmed** - Booking confirmed by provider
- **in_progress** - Service is currently being performed
- **completed** - Service has been completed
- **reviewed** - Client has submitted a review

**Cancellation:**
- Bookings can be `cancelled` at any time before reaching `completed` status

---

## AI Marketplace Features

The AI Marketplace feature provides AI-powered tools to help providers optimize their business, pricing, and listings.

**Base Path:** `/api/ai/marketplace`

### AI Tools for All Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations` | Natural language service search |
| POST | `/price-estimator` | AI price estimation |
| POST | `/service-matcher` | AI service matching |
| POST | `/review-sentiment` | Review sentiment analysis |
| POST | `/booking-assistant` | Booking assistant |
| POST | `/scheduling-assistant` | Scheduling assistant |

### AI Tools for Providers & Admins

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/description-generator` | Generate service description |
| POST | `/pricing-optimizer` | Pricing optimization |
| POST | `/demand-forecast` | Demand forecasting |
| POST | `/review-insights` | Review insights analysis |
| POST | `/response-assistant` | Response assistant for reviews/messages |
| POST | `/listing-optimizer` | Listing optimization |

### AI Feature Examples

#### Price Estimator
```http
POST /api/ai/marketplace/price-estimator
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceType": "cleaning",
  "location": "Manila",
  "duration": 120,
  "complexity": "standard"
}
```

#### Description Generator
```http
POST /api/ai/marketplace/description-generator
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceType": "plumbing",
  "keyFeatures": ["24/7 service", "licensed", "insured"],
  "targetAudience": "homeowners"
}
```

#### Pricing Optimizer
```http
POST /api/ai/marketplace/pricing-optimizer
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPrice": 500,
  "serviceType": "cleaning",
  "location": "Manila",
  "competitorPrices": [450, 550, 500]
}
```

---

## Architecture Components

### Core Components
- **Service Management** - Complete service listing and management system
- **Service Discovery** - Advanced search and filtering capabilities
- **Location Services** - Geospatial search and distance calculation
- **Booking System** - Service appointment scheduling and management
- **Payment Integration** - Multiple payment methods including PayPal
- **Review System** - Comprehensive rating and feedback system
- **Communication Tools** - Built-in messaging and photo sharing
- **Analytics Dashboard** - Service performance and booking statistics

### Data Entities
- **Service** - Service listings with detailed specifications and pricing
- **Booking** - Service appointments with payment and review tracking

---

## Key Metrics

- **Service Listings** - Total active service listings
- **Booking Volume** - Number of service bookings
- **Provider Performance** - Service ratings and completion rates
- **Revenue Tracking** - Service earnings and payment processing
- **Geographic Coverage** - Service availability by location

---

## Related Features

The Marketplace feature integrates with several other features in the LocalPro Super App:

- **Providers** - Provider profiles and management
- **Finance** - Payment processing and wallet integration
- **Communication** - Messaging and notification system
- **Reviews & Ratings** - Comprehensive feedback system
- **Maps & Location Services** - Geospatial search and navigation
- **Analytics** - Service performance and booking analytics
- **User Management** - Provider and client profiles

---

## Common Use Cases

1. **Service Discovery** - Clients search and filter available services
2. **Service Listing** - Providers create and manage service offerings
3. **Service Booking** - Clients book services with specific requirements
4. **Service Management** - Providers manage bookings and service delivery
5. **Service Reviews** - Clients rate and review completed services
6. **Location Search** - Find nearby services within specified radius

---

*For detailed implementation guidance, see the individual documentation files in the `features/services/` and `docs/features/` directories.*

