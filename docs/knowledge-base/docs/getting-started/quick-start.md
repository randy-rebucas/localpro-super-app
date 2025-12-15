# Quick Start Guide

Get up and running with LocalPro Super App in 5 minutes.

## Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or pnpm

## Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd localpro-super-app
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your configuration
```

Minimum required:
```env
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
JWT_SECRET=your-secret-key
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 4. Start Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## First API Call

### 1. Send Verification Code

```bash
curl -X POST http://localhost:5000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### 2. Verify Code

```bash
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```

Response includes JWT token.

### 3. Use Token

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## Next Steps

- Read [Installation Guide](./installation.md)
- Review [Configuration](./configuration.md)
- Check [Development Setup](./development-setup.md)
- Explore [API Documentation](../api/overview.md)

