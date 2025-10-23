# Redis Setup Guide for LocalPro Super App

## Overview

The LocalPro Super App uses Redis for rate limiting to provide better performance and scalability. Redis is optional - the application will gracefully fall back to memory-based rate limiting if Redis is not available.

## Current Status

If you see the message "Redis connection failed, using memory store for rate limiting", it means Redis is not running on your system. The application will continue to work normally with memory-based rate limiting.

## Setup Options

### Option 1: Docker Compose (Recommended)

The easiest way to set up Redis is using Docker Compose, which is already configured in the project.

#### Start Redis with Docker Compose

```bash
# Start all services including Redis
docker-compose up -d

# Or start only Redis
docker-compose up -d redis
```

#### Verify Redis is Running

```bash
# Check if Redis container is running
docker-compose ps

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Option 2: Local Redis Installation

#### Windows

1. **Using Chocolatey (Recommended)**
   ```bash
   # Install Chocolatey if not already installed
   # Then install Redis
   choco install redis-64
   ```

2. **Using Windows Subsystem for Linux (WSL)**
   ```bash
   # In WSL terminal
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

3. **Using Redis for Windows**
   - Download from: https://github.com/microsoftarchive/redis/releases
   - Extract and run `redis-server.exe`

#### macOS

```bash
# Using Homebrew
brew install redis
brew services start redis

# Or start manually
redis-server
```

#### Linux (Ubuntu/Debian)

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Option 3: Cloud Redis Services

For production environments, consider using managed Redis services:

- **Redis Cloud** (Redis Labs)
- **AWS ElastiCache**
- **Google Cloud Memorystore**
- **Azure Cache for Redis**

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local development
```

### Docker Compose Configuration

Redis is already configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Verification

### Test Redis Connection

```bash
# Using redis-cli
redis-cli ping
# Should return: PONG

# Test from Node.js
node -e "
const redis = require('redis');
const client = redis.createClient();
client.connect().then(() => {
  console.log('Redis connected successfully');
  client.quit();
}).catch(err => {
  console.error('Redis connection failed:', err.message);
});
"
```

### Check Application Logs

After starting your application, you should see:
- ✅ "Redis connected successfully" (if Redis is available)
- ⚠️ "Redis connection failed, using memory store for rate limiting" (if Redis is not available)

## Troubleshooting

### Common Issues

#### 1. Redis Connection Refused

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
- Ensure Redis is running: `redis-cli ping`
- Check if port 6379 is available: `netstat -an | grep 6379`
- For Docker: `docker-compose up -d redis`

#### 2. Redis Authentication Failed

**Error**: `NOAUTH Authentication required`

**Solutions**:
- Check if Redis has a password set
- Update `REDIS_PASSWORD` in your `.env` file
- For local development, Redis usually doesn't require a password

#### 3. Docker Redis Not Starting

**Solutions**:
- Check Docker is running
- Check port 6379 is not already in use
- Try: `docker-compose down && docker-compose up -d redis`

#### 4. Windows Redis Issues

**Solutions**:
- Use WSL2 for better compatibility
- Or use Docker Desktop with Redis
- Or use Redis for Windows (older version)

### Performance Considerations

#### Memory vs Redis Rate Limiting

- **Memory Store**: Faster for single-instance applications
- **Redis Store**: Better for multi-instance applications and production

#### When to Use Redis

- ✅ Multiple application instances
- ✅ Production environments
- ✅ High-traffic applications
- ✅ Need persistent rate limiting data

#### When Memory Store is Fine

- ✅ Single application instance
- ✅ Development environments
- ✅ Low to medium traffic
- ✅ Simple deployments

## Production Recommendations

### 1. Use Managed Redis Services

For production, use managed Redis services:
- Better reliability and uptime
- Automatic backups and scaling
- Security and monitoring features

### 2. Configure Redis Security

```env
# Production Redis configuration
REDIS_URL=redis://username:password@your-redis-host:6379
REDIS_PASSWORD=your-secure-password
```

### 3. Monitor Redis Performance

- Set up Redis monitoring
- Monitor memory usage
- Track connection counts
- Set up alerts for failures

## Rate Limiting Configuration

The application uses different rate limiters:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Verification**: 1 request per minute
- **Upload**: 10 requests per minute
- **Search**: 30 requests per minute

These limits are configurable in `src/middleware/rateLimiter.js`.

## Next Steps

1. **Choose your setup method** (Docker recommended)
2. **Start Redis** using your chosen method
3. **Update your `.env` file** with Redis configuration
4. **Restart your application**
5. **Verify** Redis is working by checking logs

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify Redis is running: `redis-cli ping`
3. Check application logs for Redis connection messages
4. Ensure environment variables are correctly set

The application will work fine without Redis, but Redis provides better performance and scalability for production use.
