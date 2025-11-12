# Deployment Guide

## Overview
This guide covers deployment strategies and procedures for the LocalPro Super App.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Environment variables configured
- External service accounts (Twilio, PayPal, etc.)

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] External APIs configured and tested
- [ ] File storage configured (Cloudinary/S3)
- [ ] SSL certificates ready (production)
- [ ] Domain configured
- [ ] Monitoring setup configured

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Run Setup
```bash
npm run setup
```

### 4. Start Development Server
```bash
npm run dev
```

## Production Deployment

### Option 1: Traditional Server (PM2)

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Build Application
```bash
# No build step needed for Node.js, but ensure dependencies are installed
npm install --production
```

#### 3. Start with PM2
```bash
pm2 start src/server.js --name localpro-api
pm2 save
pm2 startup
```

#### 4. Configure PM2
```bash
# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'localpro-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

#### 5. Start with Config
```bash
pm2 start ecosystem.config.js
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

#### Build and Run
```bash
docker-compose up -d
```

### Option 3: Cloud Platform (Render, Heroku, etc.)

#### Render Deployment

1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Set environment variables
4. Deploy

#### Environment Variables Setup
```bash
# Set all required environment variables in platform dashboard
# See CONFIGURATION.md for complete list
```

## Database Setup

### MongoDB Atlas

1. Create cluster
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update `MONGODB_URI` in environment

### Local MongoDB

```bash
# Install MongoDB
# Start MongoDB service
mongod --dbpath /path/to/data

# Connection string:
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
```

### Database Indexes

```bash
# Create indexes after deployment
node scripts/create-database-indexes.js
```

## Reverse Proxy Setup (Nginx)

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.localpro.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Setup (Let's Encrypt)
```bash
sudo certbot --nginx -d api.localpro.com
```

## Monitoring Setup

### Health Checks

The application provides health check endpoints:
- `GET /health` - Basic health check
- `GET /api/monitoring/system-health` - Comprehensive health check

### Monitoring Tools

1. **Prometheus**: Metrics collection
   - Endpoint: `/api/monitoring/metrics`

2. **Error Monitoring**: Built-in error tracking
   - Endpoint: `/api/error-monitoring`

3. **Logs**: Winston logging
   - Files: `logs/combined-*.log`
   - Database: MongoDB `logs` collection

## Backup Strategy

### Database Backups

```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://..." /backup/20250115
```

### Automated Backups

Set up cron job:
```bash
0 2 * * * /path/to/backup-script.sh
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic
2. **Multiple Instances**: Run multiple app instances
3. **Session-less**: JWT tokens (no server-side sessions)
4. **Database**: MongoDB replica set

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Add caching layer (Redis)
4. CDN for static assets

## Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

### Staging
```bash
NODE_ENV=staging
LOG_LEVEL=info
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=warn
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://api.localpro.com/health
```

### 2. API Test
```bash
curl https://api.localpro.com/api/marketplace/services
```

### 3. Database Connection
```bash
# Check logs for database connection status
```

### 4. External Services
- Test SMS sending
- Test payment processing
- Test file uploads
- Test email sending

## Rollback Procedure

### 1. Stop Current Deployment
```bash
pm2 stop localpro-api
# or
docker-compose down
```

### 2. Restore Previous Version
```bash
git checkout previous-version-tag
npm install
pm2 restart localpro-api
```

### 3. Verify Rollback
```bash
curl https://api.localpro.com/health
```

## Maintenance

### Regular Tasks

1. **Database Cleanup**
   ```bash
   # Clean old logs
   node scripts/cleanup-logs.js
   ```

2. **Index Optimization**
   ```bash
   node scripts/create-database-indexes.js
   ```

3. **Monitor Logs**
   ```bash
   pm2 logs localpro-api
   # or
   tail -f logs/combined-*.log
   ```

### Updates

1. Pull latest code
2. Install dependencies: `npm install`
3. Run migrations (if any)
4. Restart application: `pm2 restart localpro-api`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check network/firewall

3. **External API Failures**
   - Verify API keys
   - Check service status
   - Review error logs

## Related Documentation
- [Configuration Guide](CONFIGURATION.md)
- [Architecture](ARCHITECTURE.md)
- [Troubleshooting](TROUBLESHOOTING.md)

