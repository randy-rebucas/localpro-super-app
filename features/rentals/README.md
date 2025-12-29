# Rentals Feature Documentation

This directory contains comprehensive documentation for the equipment rentals feature in the LocalPro Super App.

## Overview

The rentals system allows users to list, search, and book equipment for short-term or long-term use. It provides a marketplace for equipment owners to monetize their tools and for renters to access equipment they need.

## Quick Links

- Data Entities: [data-entities.md](./data-entities.md) - Complete data model documentation
- API Endpoints: [api-endpoints.md](./api-endpoints.md) - API response structure and endpoints
- Usage Examples: [usage-examples.md](./usage-examples.md) - Practical implementation examples
- Best Practices: [best-practices.md](./best-practices.md) - Development guidelines and patterns

## Documentation Structure

- **[Data Entities](./data-entities.md)** - Complete data model documentation
- **[API Endpoints](./api-endpoints.md)** - API response structure and endpoints
- **[Usage Examples](./usage-examples.md)** - Practical implementation examples
- **[Best Practices](./best-practices.md)** - Development guidelines and patterns

## Feature Components

### Core Entities
- **RentalItem** - Equipment available for rent
- **Rental** - Individual rental transactions
- **Bookings** - Embedded booking system within rental items
- **Reviews** - User feedback and ratings

### Key Features
- Equipment listing and management
- Advanced search and filtering
- Location-based search with geospatial queries
- Booking and availability management
- Image and document management
- Review and rating system
- Payment integration
- Insurance and requirements tracking

### API Endpoints
- `GET /api/rentals` - List all rental items with filtering
- `GET /api/rentals/:id` - Get single rental item details
- `POST /api/rentals` - Create new rental item
- `PUT /api/rentals/:id` - Update rental item
- `DELETE /api/rentals/:id` - Delete rental item
- `POST /api/rentals/:id/images` - Upload rental images
- `POST /api/rentals/:id/book` - Book rental item
- `PUT /api/rentals/:id/bookings/:bookingId/status` - Update booking status
- `POST /api/rentals/:id/reviews` - Add rental review
- `GET /api/rentals/nearby` - Find nearby rental items
- `GET /api/rentals/categories` - Get rental categories
- `GET /api/rentals/featured` - Get featured rental items

## Quick Start

1. Review the [Data Entities](./data-entities.md) to understand the data structure
2. Check [API Endpoints](./api-endpoints.md) for request/response formats
3. Use [Usage Examples](./usage-examples.md) for implementation guidance
4. Follow [Best Practices](./best-practices.md) for optimal development

## Related Features

- **User Management** - Owner and renter accounts
- **Media Management** - Image and document handling
- **Location Services** - Geospatial search and mapping
- **Payments** - Transaction processing and billing
- **Notifications** - Booking confirmations and updates
