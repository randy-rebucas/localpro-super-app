# AI Marketplace Feature Documentation

## Overview
The AI Marketplace feature provides AI-powered tools to help providers optimize their business, pricing, and listings.

## Base Path
`/api/ai/marketplace`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/recommendations` | Natural language search | AUTHENTICATED |
| POST | `/price-estimator` | AI price estimation | AUTHENTICATED |
| POST | `/service-matcher` | AI service matching | AUTHENTICATED |
| POST | `/review-sentiment` | Review sentiment analysis | AUTHENTICATED |
| POST | `/booking-assistant` | Booking assistant | AUTHENTICATED |
| POST | `/scheduling-assistant` | Scheduling assistant | AUTHENTICATED |
| POST | `/description-generator` | Generate service description | **provider, admin** |
| POST | `/pricing-optimizer` | Pricing optimization | **provider, admin** |
| POST | `/demand-forecast` | Demand forecasting | **provider, admin** |
| POST | `/review-insights` | Review insights analysis | **provider, admin** |
| POST | `/response-assistant` | Response assistant for reviews/messages | **provider, admin** |
| POST | `/listing-optimizer` | Listing optimization | **provider, admin** |

## Request/Response Examples

### Price Estimator
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

### Description Generator
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

### Pricing Optimizer
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

## AI Tools Overview

1. **Recommendations**: Natural language service search
2. **Price Estimator**: AI-powered price suggestions
3. **Service Matcher**: Match services to client needs
4. **Review Sentiment**: Analyze review sentiment
5. **Booking Assistant**: Help with booking management
6. **Scheduling Assistant**: Optimize scheduling
7. **Description Generator**: Generate service descriptions
8. **Pricing Optimizer**: Optimize pricing strategy
9. **Demand Forecast**: Predict demand patterns
10. **Review Insights**: Extract insights from reviews
11. **Response Assistant**: Generate responses to reviews/messages
12. **Listing Optimizer**: Optimize service listings

## Related Features
- Marketplace
- Providers
- Analytics

