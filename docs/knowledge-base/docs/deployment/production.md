# Production Deployment

## Overview

This guide covers deploying LocalPro Super App to production environments.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Environment variables configured
- Domain name and SSL certificate
- Server/hosting provider account

## Environment Setup

### Required Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/localpro

# JWT
JWT_SECRET=<strong-random-secret>

# External Services
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret
PAYPAL_MODE=live

# CORS
FRONTEND_URL=https://app.localpro.com
ADMIN_URL=https://admin.localpro.com
```

## Deployment Options

### Option 1: Traditional Server (VPS)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (if local)
# Or use MongoDB Atlas
```

#### 2. Application Setup

```bash
# Clone repository
git clone <repository-url>
cd localpro-super-app

# Install dependencies
npm install --production

# Configure environment
cp env.example .env
# Edit .env with production values
```

#### 3. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name localpro-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Nginx Reverse Proxy

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.localpro.com
```

### Option 2: Cloud Platforms

#### Render

1. Connect GitHub repository
2. Configure build command: `npm install`
3. Configure start command: `npm start`
4. Add environment variables
5. Deploy

#### Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create localpro-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=...

# Deploy
git push heroku main
```

#### Railway

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

## Database Setup

### MongoDB Atlas

1. Create cluster
2. Configure network access (IP whitelist)
3. Create database user
4. Get connection string
5. Update `MONGODB_URI`

### Local MongoDB

```bash
# Install MongoDB
# Configure for production
# Enable authentication
# Set up replication (recommended)
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Strong JWT secret
- [ ] Database authentication enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Monitoring set up
- [ ] Error tracking configured

## Monitoring

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs localpro-api
```

### Health Checks

```bash
# Health check endpoint
curl https://api.localpro.com/health
```

## Backup Strategy

### Database Backups

```bash
# Automated backup script
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)
```

### Application Backups

- Code: Git repository
- Files: Cloudinary (automatic)
- Configuration: Environment variables

## Scaling

### Horizontal Scaling

1. Run multiple instances
2. Use load balancer
3. Share session state (if needed)
4. Database connection pooling

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Add caching layer (Redis)
4. CDN for static assets

## Maintenance

### Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart localpro-api
```

### Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting

### Check Logs

```bash
# Application logs
pm2 logs localpro-api

# System logs
journalctl -u localpro-api
```

### Common Issues

- See [Troubleshooting Guide](../troubleshooting/common-issues.md)

## Next Steps

- Review [Docker Deployment](./docker.md)
- Check [Monitoring Setup](./monitoring.md)
- Read [Backup Strategy](./backup.md)

