# Access Token with Scopes Guide

This guide explains how to use OAuth2-style access tokens with scopes for API authentication.

## Overview

Access tokens provide a more secure and flexible authentication method than API keys. They:
- Support granular scope-based permissions
- Can be revoked independently
- Have configurable expiration times
- Follow OAuth2 standards

## Authentication Flow

### Step 1: Create API Key

First, create an API key (see [API Key Integration Guide](./API_KEY_INTEGRATION_GUIDE.md)):

```http
POST /api/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My App",
  "scopes": ["read", "write", "marketplace.read", "marketplace.write"]
}
```

### Step 2: Exchange API Key for Access Token

Use your API key and secret to get an access token:

```http
POST /api/oauth/token
Content-Type: application/json
X-API-Key: lp_abc123...
X-API-Secret: xyz789...

{
  "grant_type": "client_credentials",
  "scope": "read marketplace.read",
  "expires_in": 3600
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2024-01-01T13:00:00.000Z",
  "refresh_token": "a1b2c3d4e5f6...",
  "scope": "read marketplace.read"
}
```

### Step 3: Use Access Token

Use the access token to authenticate API requests:

```http
GET /api/marketplace/services
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Scopes

Scopes define what permissions an access token has. Available scopes include:

### General Scopes
- `read` - Read-only access
- `write` - Read and write access
- `admin` - Full administrative access (use with caution)
- `*` - All permissions (wildcard)

### Feature-Specific Scopes
- `marketplace.read` - Read marketplace data
- `marketplace.write` - Create/update marketplace data
- `users.read` - Read user data
- `users.write` - Create/update users
- `analytics.read` - Read analytics data
- `finance.read` - Read financial data
- `finance.write` - Manage financial data

### Scope Rules

1. **Requested scopes must be a subset of API key scopes**
   - If your API key has `["read", "write"]`, you can request `["read"]` but not `["admin"]`

2. **Wildcard scopes**
   - `marketplace.*` matches `marketplace.read`, `marketplace.write`, etc.
   - `*` or `admin` grants all permissions

3. **Multiple scopes**
   - Separate scopes with spaces: `"read write marketplace.read"`

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE_URL = 'https://api.localpro.com';
const API_KEY = 'lp_abc123...';
const API_SECRET = 'xyz789...';

let accessToken = null;
let tokenExpiry = null;

// Exchange API key for access token
async function getAccessToken() {
  // Check if token is still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/oauth/token`, {
      grant_type: 'client_credentials',
      scope: 'read marketplace.read',
      expires_in: 3600
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json'
      }
    });

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw error;
  }
}

// Make authenticated API request
async function makeApiRequest(endpoint, method = 'GET', data = null) {
  const token = await getAccessToken();
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired, get new one
      accessToken = null;
      tokenExpiry = null;
      return makeApiRequest(endpoint, method, data);
    }
    throw error;
  }
}

// Example usage
const services = await makeApiRequest('/api/marketplace/services');
console.log(services);
```

### Python

```python
import requests
import time

API_BASE_URL = 'https://api.localpro.com'
API_KEY = 'lp_abc123...'
API_SECRET = 'xyz789...'

access_token = None
token_expiry = 0

def get_access_token():
    global access_token, token_expiry
    
    # Check if token is still valid
    if access_token and time.time() < token_expiry:
        return access_token
    
    response = requests.post(
        f'{API_BASE_URL}/api/oauth/token',
        json={
            'grant_type': 'client_credentials',
            'scope': 'read marketplace.read',
            'expires_in': 3600
        },
        headers={
            'X-API-Key': API_KEY,
            'X-API-Secret': API_SECRET,
            'Content-Type': 'application/json'
        }
    )
    
    response.raise_for_status()
    data = response.json()
    
    access_token = data['access_token']
    token_expiry = time.time() + data['expires_in']
    
    return access_token

def make_api_request(endpoint, method='GET', data=None):
    token = get_access_token()
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.request(
        method,
        f'{API_BASE_URL}{endpoint}',
        headers=headers,
        json=data
    )
    
    if response.status_code == 401:
        # Token expired, get new one
        global access_token, token_expiry
        access_token = None
        token_expiry = 0
        return make_api_request(endpoint, method, data)
    
    response.raise_for_status()
    return response.json()

# Example usage
services = make_api_request('/api/marketplace/services')
print(services)
```

## Token Refresh

Access tokens expire after a set time (default 1 hour). Use the refresh token to get a new access token:

```http
POST /api/oauth/refresh
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4e5f6...",
  "scope": "read marketplace.read",
  "expires_in": 3600
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2024-01-01T14:00:00.000Z",
  "refresh_token": "b2c3d4e5f6g7...",
  "scope": "read marketplace.read"
}
```

## Token Revocation

Revoke an access or refresh token:

```http
POST /api/oauth/revoke
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type_hint": "access_token"
}
```

## Token Information

Get information about your current token:

```http
GET /api/oauth/token-info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scopes": ["read", "marketplace.read"],
    "expiresAt": "2024-01-01T13:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "lastUsedAt": "2024-01-01T12:30:00.000Z"
  }
}
```

## Using Scopes in Routes

You can protect routes with scope requirements:

```javascript
const { accessTokenAuth, requireScope } = require('../middleware/accessTokenAuth');

// Require any of these scopes
router.get('/services', accessTokenAuth, requireScope('read', 'marketplace.read'), getServices);

// Require all of these scopes
router.post('/services', accessTokenAuth, requireAllScopes('write', 'marketplace.write'), createService);
```

## Best Practices

1. **Store tokens securely**
   - Never commit tokens to version control
   - Use environment variables or secure secret management
   - Implement token caching with expiration checks

2. **Request minimal scopes**
   - Only request scopes you actually need
   - Use feature-specific scopes when available

3. **Handle token expiration**
   - Implement automatic token refresh
   - Cache tokens with expiration tracking
   - Retry requests with new tokens on 401 errors

4. **Rotate tokens regularly**
   - Revoke old tokens when creating new ones
   - Set appropriate expiration times
   - Monitor token usage

5. **Use refresh tokens**
   - Store refresh tokens securely
   - Use refresh tokens to get new access tokens
   - Refresh tokens expire after 30 days

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `MISSING_ACCESS_TOKEN` | No Bearer token provided | Include `Authorization: Bearer <token>` header |
| `INVALID_TOKEN` | Token not found or invalid | Exchange API key for new token |
| `TOKEN_EXPIRED` | Token has expired | Use refresh token or exchange for new token |
| `TOKEN_REVOKED` | Token has been revoked | Exchange API key for new token |
| `INSUFFICIENT_SCOPE` | Token lacks required scope | Request token with required scopes |
| `UNSUPPORTED_GRANT_TYPE` | Invalid grant_type | Use `client_credentials` |

## Comparison: API Keys vs Access Tokens

| Feature | API Keys | Access Tokens |
|---------|----------|---------------|
| Authentication | Key + Secret | Bearer Token |
| Scopes | Basic (read/write/admin) | Granular per-feature |
| Revocation | Revoke entire key | Revoke individual tokens |
| Expiration | Optional | Required |
| Refresh | No | Yes (refresh tokens) |
| Best For | Simple integrations | Complex apps with fine-grained permissions |

## Migration from API Keys

If you're currently using API keys, you can migrate to access tokens:

1. Keep your existing API key
2. Exchange it for an access token
3. Update your code to use Bearer token authentication
4. Gradually migrate endpoints to use scope checks

Your API key will continue to work, but access tokens provide better security and flexibility.

