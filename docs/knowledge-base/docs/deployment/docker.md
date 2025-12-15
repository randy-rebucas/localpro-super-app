# Docker Deployment

## Overview

This guide covers deploying LocalPro Super App using Docker.

## Dockerfile

### Basic Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
```

### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

## Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/localpro
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    volumes:
      - ./logs:/app/logs

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=localpro

volumes:
  mongo-data:
```

## Building and Running

### Build Image

```bash
docker build -t localpro-api .
```

### Run Container

```bash
docker run -d \
  --name localpro-api \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongo:27017/localpro \
  -e JWT_SECRET=your-secret \
  localpro-api
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

### .env File

```env
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/localpro
JWT_SECRET=your-secret
```

### Docker Compose with .env

```yaml
services:
  api:
    env_file:
      - .env
```

## Production Considerations

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js || exit 1
```

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Logging

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Docker Hub

### Build and Push

```bash
docker build -t yourusername/localpro-api .
docker push yourusername/localpro-api
```

### Pull and Run

```bash
docker pull yourusername/localpro-api
docker run -d yourusername/localpro-api
```

## Kubernetes

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: localpro-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: localpro-api
  template:
    metadata:
      labels:
        app: localpro-api
    spec:
      containers:
      - name: api
        image: yourusername/localpro-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: localpro-secrets
              key: mongodb-uri
```

## Best Practices

1. **Use multi-stage builds** - Smaller images
2. **Don't run as root** - Use non-root user
3. **Use .dockerignore** - Exclude unnecessary files
4. **Health checks** - Monitor container health
5. **Resource limits** - Prevent resource exhaustion

## Troubleshooting

### View Logs

```bash
docker logs localpro-api
docker logs -f localpro-api  # Follow logs
```

### Execute Commands

```bash
docker exec -it localpro-api sh
```

### Inspect Container

```bash
docker inspect localpro-api
```

## Next Steps

- Review [Production Deployment](./production.md)
- Check [Monitoring Guide](./monitoring.md)
- Read [Backup Strategy](./backup.md)

