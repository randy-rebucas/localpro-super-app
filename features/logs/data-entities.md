# Logs Data Entities

## Log
- logId: string (unique)
- level: ['error','warn','info','http','debug']
- message: string
- category: ['application','http','error','performance','business','security','audit','system']
- source: ['winston','audit','error_monitoring','request_logger','manual']
- request: { method, url, headers, body, params, query, ip, userAgent, userId }
- response: { statusCode, responseTime, success }
- error: { name, message, stack, code, statusCode }
- metadata: Mixed
- environment: string (defaults to NODE_ENV)
- timestamp: Date
- retentionDate: Date (TTL; default days based on level)
- timestamps

### Indexes
- { level, timestamp:-1 }, { category, timestamp:-1 }, { source, timestamp:-1 }
- { request.userId, timestamp:-1 }, { request.url, timestamp:-1 }, { request.method, timestamp:-1 }
- { response.statusCode, timestamp:-1 }, { error.name, timestamp:-1 }, { timestamp:-1 }
- TTL: { retentionDate:1 } with expireAfterSeconds:0

### Virtuals
- formattedTimestamp

### Statics
- getLogStats(timeframe: '1h'|'24h'|'7d'|'30d')
- getErrorStats(timeframe)
- getPerformanceStats(timeframe)
- cleanupExpiredLogs()
