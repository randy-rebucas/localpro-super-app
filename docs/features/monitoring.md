# Monitoring Feature Documentation

## Overview
The Monitoring feature provides system health monitoring, metrics, alerts, and performance tracking.

## Base Path
`/api/monitoring`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Get Prometheus metrics |
| GET | `/metrics/json` | Get metrics as JSON |
| GET | `/health` | Health check with metrics |
| GET | `/system` | Get system information |
| GET | `/performance` | Get performance summary |
| GET | `/system-health` | Comprehensive system health |

## Database Monitoring (`/api/monitoring/database`)

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get database stats |
| GET | `/collections` | Get collection stats |
| GET | `/queries` | Get query stats |
| GET | `/connections` | Get connection stats |
| POST | `/reset` | Reset performance stats |
| GET | `/slow-queries` | Get slow queries |
| GET | `/health` | Database health check |

## Metrics Stream (`/api/monitoring/stream`)

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stream` | Metrics streaming (SSE) |
| GET | `/alerts/stream` | Alerts streaming (SSE) |
| GET | `/ws` | WebSocket-like stream |
| GET | `/connections/count` | Get active connections count |
| POST | `/broadcast` | Manual metrics broadcast |
| POST | `/stop` | Stop broadcasting |
| POST | `/start` | Start broadcasting |

## Alerts (`/api/monitoring/alerts`)

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Get current alerts |
| GET | `/alerts/history` | Get alert history |
| POST | `/alerts/thresholds` | Update alert thresholds |
| GET | `/alerts/thresholds` | Get alert thresholds |
| POST | `/alerts/trigger` | Manual alert trigger |
| DELETE | `/alerts/history` | Clear alert history |

## Database Optimization (`/api/database/optimization`)

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/report` | Get optimization report | **admin** |
| GET | `/recommendations` | Get index recommendations | **admin** |
| POST | `/create-indexes` | Create recommended indexes | **admin** |
| GET | `/query-stats` | Get query stats | **admin** |
| GET | `/health` | Get database health | **admin** |
| GET | `/collections` | Get collection stats | **admin** |
| GET | `/slow-queries` | Analyze slow queries | **admin** |
| POST | `/clear-cache` | Clear query cache | **admin** |
| POST | `/reset-stats` | Reset performance stats | **admin** |

## Related Features
- Error Monitoring
- Logs
- Audit Logs

