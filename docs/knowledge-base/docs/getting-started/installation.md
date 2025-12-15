# Installation Guide

Complete installation guide for LocalPro Super App Backend.

## Prerequisites

- **Node.js**: v18.x or higher
- **MongoDB**: v6.0 or higher
- **npm**: v9.x or higher
- **Git**: Latest version

## Quick Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/localpro-super-app.git
cd localpro-super-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.example .env
# Edit .env with your settings

# 4. Run setup
npm run setup

# 5. Start development server
npm run dev
```

## Detailed Steps

### 1. Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/).

Verify installation:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### 2. Install MongoDB

#### Option A: Local Installation
Download from [mongodb.com](https://www.mongodb.com/try/download/community).

#### Option B: MongoDB Atlas (Cloud)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string

### 3. Clone Repository

```bash
git clone https://github.com/your-org/localpro-super-app.git
cd localpro-super-app
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
JWT_SECRET=your-super-secret-jwt-key-here

# Optional (for development)
NODE_ENV=development
PORT=5000
```

### 6. Run Setup Script

```bash
npm run setup
```

This will:
- ✅ Connect to MongoDB
- ✅ Create database indexes
- ✅ Create default app settings
- ✅ Create admin users
- ✅ Seed sample data

### 7. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## Verify Installation

1. **Check server status**:
```bash
curl http://localhost:5000/health
```

2. **Test API**:
```bash
curl http://localhost:5000/api/health
```

3. **Access Swagger docs** (if configured):
```
http://localhost:5000/api-docs
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongosh

# Or check service status
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongod
```

### Port Already in Use

```bash
# Change port in .env
PORT=5001
```

### Permission Errors

```bash
# Linux/Mac: Use sudo if needed
sudo npm install

# Or fix permissions
sudo chown -R $USER:$USER .
```

## Next Steps

- [Configuration Guide](configuration.md)
- [Quick Start](quick-start.md)
- [Development Setup](../development/setup.md)

