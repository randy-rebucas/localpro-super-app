# API Key Integration Guide

This guide explains how to integrate the LocalPro Super App API into your third-party application using API key authentication.

## Overview

API key authentication is designed for server-to-server integrations where you need programmatic access to the LocalPro Super App API. It provides a secure way to authenticate without requiring user login sessions.

## Getting Started

### Step 1: Create an Account

First, you need to create a user account in the LocalPro Super App (via mobile app or web interface).

### Step 2: Generate API Keys

Once logged in, create an API key through the API:

```http
POST /api/api-keys
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "My Integration App",
  "description": "API integration for my service",
  "expiresAt": "2025-12-31T23:59:59Z",
  "rateLimit": 1000,
  "allowedIPs": ["203.0.113.0"],
  "scopes": ["read", "write"]
}
```

**Important:** Save the `secretKey` immediately! It will only be shown once during creation.

### Step 3: Use API Keys for Authentication

Use your `accessKey` and `secretKey` to authenticate API requests.

## Authentication Methods

### Method 1: HTTP Headers (Recommended)

```http
GET /api/marketplace/services
X-API-Key: lp_abc123def456...
X-API-Secret: xyz789uvw012...
```

### Method 2: Query Parameters

```http
GET /api/marketplace/services?apiKey=lp_abc123def456...&apiSecret=xyz789uvw012...
```

**Note:** Query parameters are less secure as they may be logged. Use headers when possible.

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE_URL = 'https://api.localpro.com';
const API_KEY = 'lp_abc123def456...';
const API_SECRET = 'xyz789uvw012...';

async function makeApiRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example: Get services
const services = await makeApiRequest('/api/marketplace/services');
console.log(services);
```

### Python

```python
import requests

API_BASE_URL = 'https://api.localpro.com'
API_KEY = 'lp_abc123def456...'
API_SECRET = 'xyz789uvw012...'

def make_api_request(endpoint, method='GET', data=None):
    url = f'{API_BASE_URL}{endpoint}'
    headers = {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json'
    }
    
    response = requests.request(method, url, headers=headers, json=data)
    response.raise_for_status()
    return response.json()

# Example: Get services
services = make_api_request('/api/marketplace/services')
print(services)
```

### PHP

```php
<?php

$apiBaseUrl = 'https://api.localpro.com';
$apiKey = 'lp_abc123def456...';
$apiSecret = 'xyz789uvw012...';

function makeApiRequest($endpoint, $method = 'GET', $data = null) {
    global $apiBaseUrl, $apiKey, $apiSecret;
    
    $url = $apiBaseUrl . $endpoint;
    $headers = [
        'X-API-Key: ' . $apiKey,
        'X-API-Secret: ' . $apiSecret,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) {
        throw new Exception('API Error: ' . $response);
    }
    
    return json_decode($response, true);
}

// Example: Get services
$services = makeApiRequest('/api/marketplace/services');
print_r($services);
?>
```

### cURL

```bash
curl -X GET "https://api.localpro.com/api/marketplace/services" \
  -H "X-API-Key: lp_abc123def456..." \
  -H "X-API-Secret: xyz789uvw012..."
```

## API Key Management

### List Your API Keys

```http
GET /api/api-keys
Authorization: Bearer <jwt_token>
```

### Get API Key Details

```http
GET /api/api-keys/:id
Authorization: Bearer <jwt_token>
```

### Update API Key

```http
PUT /api/api-keys/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true,
  "rateLimit": 2000
}
```

### Regenerate Secret Key

```http
POST /api/api-keys/:id/regenerate-secret
Authorization: Bearer <jwt_token>
```

**Important:** The old secret will be invalidated immediately. Update your integration with the new secret.

### Revoke API Key

```http
DELETE /api/api-keys/:id
Authorization: Bearer <jwt_token>
```

## Security Features

### IP Restrictions

Limit API key usage to specific IP addresses:

```json
{
  "allowedIPs": ["203.0.113.0", "198.51.100.0"]
}
```

If an IP restriction is set, only requests from those IPs will be accepted.

### Rate Limiting

Set a maximum number of requests per hour:

```json
{
  "rateLimit": 1000
}
```

### Scopes

Control what the API key can do:

- `read`: Read-only access
- `write`: Read and write access
- `admin`: Full administrative access (use with caution)

```json
{
  "scopes": ["read", "write"]
}
```

### Expiration

Set an expiration date for automatic key rotation:

```json
{
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `MISSING_API_CREDENTIALS` | API key or secret not provided | Include both X-API-Key and X-API-Secret headers |
| `INVALID_API_KEY` | API key not found | Check that the access key is correct |
| `INVALID_API_SECRET` | Secret key does not match | Verify the secret key is correct |
| `API_KEY_INACTIVE` | API key has been deactivated | Reactivate the key or create a new one |
| `API_KEY_EXPIRED` | API key has expired | Create a new API key or extend expiration |
| `IP_NOT_ALLOWED` | Request IP is not in allowed list | Add your IP to allowedIPs or remove IP restrictions |
| `USER_INACTIVE` | User account is inactive | Contact support |

### Error Response Format

```json
{
  "success": false,
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

## Best Practices

1. **Store Secrets Securely**
   - Never commit API secrets to version control
   - Use environment variables or secure secret management
   - Rotate secrets regularly

2. **Use IP Restrictions**
   - Limit API keys to your server IPs
   - Reduces risk if a key is compromised

3. **Set Appropriate Rate Limits**
   - Start with conservative limits
   - Increase as needed based on usage

4. **Use Minimal Scopes**
   - Only grant necessary permissions
   - Prefer `read` over `write` when possible

5. **Monitor Usage**
   - Check API key statistics regularly
   - Review last used timestamps
   - Watch for unusual activity

6. **Implement Error Handling**
   - Handle authentication errors gracefully
   - Log errors for debugging
   - Implement retry logic with exponential backoff

7. **Rotate Keys Periodically**
   - Set expiration dates
   - Regenerate secrets regularly
   - Update integrations promptly

## Rate Limiting

API keys are subject to rate limiting based on the `rateLimit` setting. When the limit is exceeded, you'll receive a `429 Too Many Requests` response.

Implement exponential backoff when handling rate limit errors:

```javascript
async function makeApiRequestWithRetry(endpoint, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await makeApiRequest(endpoint);
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## Support

For issues or questions:
- Check the [API Endpoints Documentation](./API_ENDPOINTS.md)
- Review error codes and messages
- Contact support with your API key ID (not the secret)

## Changelog

- **2024-01-01**: Initial API key authentication support
  - Basic API key/secret authentication
  - IP restrictions
  - Rate limiting
  - Scope-based permissions

