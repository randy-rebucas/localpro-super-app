# Bookings API "Failed to Fetch" Error - Diagnostic & Fix Guide

## Error Analysis

**Error:** `TypeError: Failed to fetch`  
**Location:** Frontend hook `useBookings.ts:42`  
**Endpoint:** `GET /api/marketplace/bookings`

## Root Causes

The "Failed to fetch" error typically indicates one of these issues:

1. **CORS (Cross-Origin Resource Sharing) blocked**
2. **Backend server not running**
3. **Missing or invalid authentication token**
4. **Wrong API URL/endpoint**
5. **Network connectivity issue**

---

## Diagnostic Steps

### 1. Check Backend Server Status

Verify the backend server is running:

```bash
# Check if server is running
curl http://localhost:4000/health

# Or check the port configured in your .env
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "services": {
    "database": { "status": "healthy" }
  }
}
```

### 2. Check CORS Configuration

**Current CORS Config** (`src/server.js:128-131`):
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**Verify:**
- `FRONTEND_URL` in `.env` matches your Next.js app URL
- If Next.js runs on different port, update the env variable
- Check browser console for CORS error messages

### 3. Check Authentication Token

The `/api/marketplace/bookings` endpoint **requires authentication** (line 79 in `marketplace.js` applies `auth` middleware).

**Verify Frontend:**
- Is sending `Authorization: Bearer <token>` header
- Token is valid and not expired
- Token is being sent in the request

**Test with curl:**
```bash
curl -X GET http://localhost:4000/api/marketplace/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Check API Endpoint URL

Verify the frontend is calling the correct endpoint:

**Backend Route:** `GET /api/marketplace/bookings`  
**Full URL:** `http://localhost:4000/api/marketplace/bookings` (or your backend URL)

**Check Frontend Code:**
- Verify the API base URL is correct
- Check if environment variables are set properly
- Ensure the endpoint path matches

---

## Quick Fixes

### Fix 1: Update CORS Configuration

If your Next.js app runs on a different port or domain, update CORS:

**Option A: Update .env file**
```env
FRONTEND_URL=http://localhost:3001  # Your Next.js port
```

**Option B: Allow multiple origins**
```javascript
// src/server.js
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',  // Add your Next.js port
  'http://localhost:3002'   // If needed
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

### Fix 2: Add Error Handling for CORS

Add better error logging:

```javascript
// src/server.js - After CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  logger.debug('Request origin', { origin, allowed: process.env.FRONTEND_URL });
  next();
});
```

### Fix 3: Verify Authentication Middleware

The route requires auth. Ensure frontend sends token:

**Frontend should include:**
```typescript
const response = await fetch(`${API_URL}/api/marketplace/bookings`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Fix 4: Add Preflight Request Handling

Ensure OPTIONS requests are handled:

```javascript
// src/server.js - Add before routes
app.options('*', cors()); // Enable preflight for all routes
```

---

## Testing the Endpoint

### Test 1: Health Check
```bash
curl http://localhost:4000/health
```

### Test 2: Bookings Endpoint (No Auth - Should Fail)
```bash
curl http://localhost:4000/api/marketplace/bookings
# Expected: 401 Unauthorized
```

### Test 3: Bookings Endpoint (With Auth)
```bash
# First, get a token (from login endpoint)
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:4000/api/marketplace/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test 4: Check CORS Headers
```bash
curl -X OPTIONS http://localhost:4000/api/marketplace/bookings \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Expected Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## Common Issues & Solutions

### Issue 1: "Failed to fetch" in Browser Console

**Cause:** CORS blocking or server not reachable

**Solution:**
1. Check backend server is running
2. Verify CORS origin matches frontend URL
3. Check browser console for specific CORS error
4. Verify network tab shows the request

### Issue 2: 401 Unauthorized

**Cause:** Missing or invalid token

**Solution:**
1. Verify token is being sent in Authorization header
2. Check token is not expired
3. Verify JWT_SECRET matches between frontend and backend
4. Test token with `/api/auth/me` endpoint first

### Issue 3: Network Error

**Cause:** Backend server not running or wrong URL

**Solution:**
1. Verify backend server is running: `npm run dev` or `npm start`
2. Check the port (default: 4000 or 5000)
3. Verify API_URL in frontend matches backend URL
4. Check firewall/network settings

### Issue 4: CORS Preflight Fails

**Cause:** OPTIONS request not handled properly

**Solution:**
```javascript
// Ensure OPTIONS is handled
app.options('*', cors());
```

---

## Enhanced CORS Configuration (Recommended)

Update `src/server.js` with more permissive CORS for development:

```javascript
// Enhanced CORS for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit']
};

app.use(cors(corsOptions));
```

---

## Debug Checklist

- [ ] Backend server is running (`npm run dev`)
- [ ] Backend health check works (`/health` endpoint)
- [ ] CORS origin matches frontend URL
- [ ] Authentication token is being sent
- [ ] Token is valid (test with `/api/auth/me`)
- [ ] API URL in frontend is correct
- [ ] Network tab shows the request attempt
- [ ] No firewall blocking the connection
- [ ] Ports are not conflicting

---

## Next Steps

1. **Check browser Network tab** - See the actual request/response
2. **Check backend logs** - Look for incoming requests
3. **Test with Postman/curl** - Isolate frontend vs backend issue
4. **Verify environment variables** - Both frontend and backend
5. **Check authentication flow** - Ensure token is obtained correctly

---

## Additional Resources

- Backend route: `src/routes/marketplace.js:115`
- Controller: `src/controllers/marketplaceController.js:1882`
- Auth middleware: `src/middleware/auth.js:4`

