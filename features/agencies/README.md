# Agencies Feature

## Overview

The Agencies feature provides comprehensive agency management functionality for the LocalPro Super App. This feature enables businesses to create and manage agencies, onboard service providers, handle administrative tasks, and track performance analytics across their service operations.

## Quick Links

- Data Entities: [data-entities.md](./data-entities.md) - Detailed schema documentation
- API Endpoints: [api-endpoints.md](./api-endpoints.md) - Complete API reference
- Usage Examples: [usage-examples.md](./usage-examples.md) - Practical implementation examples
- Best Practices: [best-practices.md](./best-practices.md) - Development guidelines

## Key Features

- **Agency Management**: Complete CRUD operations for agency profiles and settings
- **Provider Management**: Onboard, manage, and track service providers
- **Administrative Controls**: Multi-level admin roles and permissions
- **Service Area Management**: Geographic service coverage and radius management
- **Business Information**: Legal business details, licensing, and insurance tracking
- **Performance Analytics**: Comprehensive analytics and reporting for agencies
- **Commission Management**: Flexible commission rates and payment tracking
- **Verification System**: Document verification and compliance management
- **Subscription Management**: Agency subscription plans and feature access

## Documentation Structure

This feature documentation is organized into the following sections:

- **[Data Entities](data-entities.md)** - Detailed schema documentation for Agency model
- **[API Endpoints](api-endpoints.md)** - Complete API reference with request/response examples
- **[Usage Examples](usage-examples.md)** - Practical implementation examples and code snippets
- **[Best Practices](best-practices.md)** - Development guidelines and recommended patterns

## Quick Start

### Create Agency
```javascript
// Create a new agency
const response = await fetch('/api/agencies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Elite Cleaning Services',
    description: 'Professional cleaning services for residential and commercial properties',
    contact: {
      email: 'info@elitecleaning.com',
      phone: '+1-555-0123',
      website: 'https://elitecleaning.com',
      address: {
        street: '123 Business Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA'
      }
    },
    business: {
      type: 'llc',
      registrationNumber: 'LLC123456789',
      taxId: '12-3456789',
      licenseNumber: 'LIC789012345'
    },
    services: [{
      category: 'cleaning',
      subcategories: ['residential', 'commercial', 'deep_cleaning'],
      pricing: {
        baseRate: 50,
        currency: 'USD'
      }
    }],
    serviceAreas: [{
      name: 'San Francisco Bay Area',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      radius: 50,
      zipCodes: ['94102', '94103', '94104']
    }]
  })
});
```

### Get Agencies
```javascript
// Get all agencies with filtering
const response = await fetch('/api/agencies?search=cleaning&location=San Francisco&serviceType=cleaning&page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Add Provider
```javascript
// Add a provider to an agency
const response = await fetch('/api/agencies/:agencyId/providers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '60f7b3b3b3b3b3b3b3b3b3b3',
    commissionRate: 15
  })
});
```

## Agency Management

### Agency Creation
- **Business Information**: Name, description, contact details
- **Legal Details**: Business type, registration, tax ID, licenses
- **Service Areas**: Geographic coverage with radius and zip codes
- **Service Categories**: Supported service types and pricing
- **Insurance Information**: Coverage details and policy numbers

### Provider Management
- **Provider Onboarding**: Add providers with commission rates
- **Status Management**: Active, inactive, suspended, pending statuses
- **Performance Tracking**: Ratings, job completion, cancellation rates
- **Commission Management**: Flexible commission rate assignment

### Administrative Controls
- **Multi-level Roles**: Owner, admin, manager, supervisor roles
- **Permission System**: Granular permission control
- **Access Management**: User access control and validation

## Service Management

### Service Categories
- **Cleaning**: Residential, commercial, deep cleaning
- **Maintenance**: HVAC, plumbing, electrical
- **Construction**: Carpentry, flooring, roofing
- **Landscaping**: Lawn care, tree services, snow removal
- **Moving**: Residential, commercial, packing services
- **And More**: 20+ service categories supported

### Service Areas
- **Geographic Coverage**: City, state, zip code coverage
- **Radius Management**: Service radius in kilometers
- **Coordinate Mapping**: GPS coordinates for precise location
- **Multi-location Support**: Multiple service areas per agency

## Business Information

### Business Types
- **Sole Proprietorship**: Individual business ownership
- **Partnership**: Multiple business partners
- **Corporation**: Corporate business structure
- **LLC**: Limited Liability Company
- **Non-profit**: Non-profit organization

### Legal Compliance
- **Registration Numbers**: Business registration tracking
- **Tax Identification**: Tax ID management
- **License Numbers**: Professional license tracking
- **Insurance Coverage**: Policy details and coverage amounts

## Analytics & Reporting

### Performance Metrics
- **Total Bookings**: Complete booking count
- **Total Revenue**: Revenue tracking and reporting
- **Average Rating**: Customer satisfaction metrics
- **Review Count**: Customer feedback volume
- **Provider Performance**: Individual provider analytics

### Monthly Statistics
- **Booking Trends**: Monthly booking patterns
- **Revenue Analysis**: Monthly revenue tracking
- **Provider Growth**: New provider additions
- **Performance Comparison**: Month-over-month analysis

## Subscription Management

### Subscription Plans
- **Basic Plan**: Essential features for small agencies
- **Professional Plan**: Advanced features for growing agencies
- **Enterprise Plan**: Full features for large agencies

### Feature Access
- **Provider Limits**: Maximum provider count per plan
- **Analytics Access**: Advanced analytics features
- **Custom Branding**: Logo and branding customization
- **Priority Support**: Support level based on plan

## Verification System

### Document Verification
- **Business License**: License verification and tracking
- **Insurance Certificate**: Insurance document verification
- **Tax Certificate**: Tax compliance verification
- **Other Documents**: Additional compliance documents

### Verification Status
- **Pending**: Documents submitted, awaiting review
- **Verified**: Documents approved and verified
- **Rejected**: Documents rejected, requires resubmission
- **Expired**: Documents expired, requires renewal

## Key Benefits

1. **Scalable Management**: Handle multiple providers and service areas efficiently
2. **Performance Tracking**: Comprehensive analytics for business optimization
3. **Compliance Management**: Legal and regulatory compliance tracking
4. **Revenue Optimization**: Commission management and revenue tracking
5. **Provider Onboarding**: Streamlined provider recruitment and management
6. **Geographic Expansion**: Multi-location service area management
7. **Business Growth**: Tools and analytics for business expansion
8. **Professional Branding**: Custom branding and professional presence

## Integration Points

- **User Management**: Integration with user profiles and authentication
- **Service Marketplace**: Connection to service booking and management
- **Payment System**: Integration with commission and payment processing
- **Analytics Platform**: Connection to business intelligence and reporting
- **Geographic Services**: Integration with mapping and location services
- **Document Management**: Connection to file storage and verification
- **Notification System**: Integration with communication and alerts
- **Subscription Management**: Connection to billing and plan management

## Getting Started

1. Review the [Data Entities](data-entities.md) documentation to understand the agency data structure
2. Check the [API Endpoints](api-endpoints.md) for available operations
3. Use the [Usage Examples](usage-examples.md) for implementation guidance
4. Follow the [Best Practices](best-practices.md) for optimal implementation

For more detailed information, explore the individual documentation files in this directory.
