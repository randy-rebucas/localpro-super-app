# Frequently Asked Questions

## General

### Q: What is LocalPro Super App?

A: LocalPro is a comprehensive platform connecting local service providers with customers. It includes marketplace, bookings, academy, supplies, rentals, jobs, and more.

### Q: What technologies does it use?

A: Node.js, Express.js, MongoDB, JWT authentication, Cloudinary for file storage, and various payment integrations (PayPal, PayMaya).

## Authentication

### Q: How does authentication work?

A: Phone-based authentication with SMS verification codes. No passwords required. Users receive a 6-digit code via SMS and use it to get a JWT token.

### Q: How long do tokens last?

A: JWT tokens are valid for 24 hours. Users need to re-authenticate after expiration.

### Q: Can I use email/password authentication?

A: Currently, only phone-based authentication is supported. Email/password may be added in the future.

## API

### Q: What is the base URL?

A: 
- Production: `https://api.localpro.com/api`
- Development: `http://localhost:5000/api`

### Q: How do I authenticate API requests?

A: Include JWT token in Authorization header:
```
Authorization: Bearer <your-token>
```

### Q: What is the rate limit?

A: 
- General: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes

## Development

### Q: How do I set up the development environment?

A: See [Development Setup](../development/setup.md) guide.

### Q: How do I run tests?

A: 
```bash
npm test
```

### Q: How do I seed the database?

A:
```bash
npm run seed:categories
npm run seed:job-categories
```

## Database

### Q: What database does it use?

A: MongoDB (version 6.0+)

### Q: Can I use a different database?

A: The application is designed for MongoDB. Switching would require significant changes.

### Q: How do I backup the database?

A: Use MongoDB backup tools:
```bash
mongodump --uri="mongodb://localhost:27017/localpro-super-app"
```

## Payments

### Q: What payment methods are supported?

A: PayPal and PayMaya (for Philippines market)

### Q: How do I test payments?

A: Use sandbox/test credentials for PayPal and PayMaya test mode.

### Q: Are payments secure?

A: Yes, all payment processing is handled through secure payment gateways with proper encryption.

## File Uploads

### Q: What file types are supported?

A: Images: JPEG, PNG, WebP. Maximum 5MB per file.

### Q: Where are files stored?

A: Files are stored on Cloudinary CDN.

### Q: How many files can I upload?

A: Up to 5 files per request for most endpoints.

## Features

### Q: What features are available?

A: Marketplace, Bookings, Academy, Supplies, Rentals, Jobs, Finance, Subscriptions, and more. See [Features](../features/README.md).

### Q: How do I enable/disable features?

A: Use admin settings endpoint:
```
POST /api/settings/app/features/toggle
```

## Deployment

### Q: How do I deploy to production?

A: See [Deployment Guide](../deployment/production.md).

### Q: What environment variables are required?

A: See [Environment Variables Reference](../reference/environment-variables.md).

## Support

### Q: Where can I get help?

A: 
- Check documentation
- Review [Common Issues](./common-issues.md)
- Open an issue on GitHub

### Q: How do I report a bug?

A: Open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details

