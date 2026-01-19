# Partner API Documentation

## 1. Partner Onboarding (Public)
**Endpoint:**  
POST `/api/partners/onboarding/start`

**Request Payload:**
```json
{
  "name": "Acme Corp",
  "email": "partner@acme.com",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Onboarding started",
  "partner": {
    "id": "partner_id",
    "name": "Acme Corp",
    "email": "partner@acme.com",
    "phoneNumber": "+1234567890",
    "slug": "acme-corp",
    "status": "pending"
  }
}
```

---

## 2. Partner Login (General Auth)
**Endpoint:**  
POST `/api/auth/login`

**Request Payload:**
```json
{
  "email": "partner@acme.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "user": {
    "id": "user_id",
    "email": "partner@acme.com",
    "roles": ["partner"],
    "isVerified": true
  }
}
```

---

## 3. Get Partner by Slug (Public, for third-party login)
**Endpoint:**  
GET `/api/partners/slug/:slug`

**Response (200 OK):**
```json
{
  "success": true,
  "partner": {
    "id": "partner_id",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "status": "active"
  }
}
```

---

## 4. Phone-based Login (OTP)
**Step 1:**  
POST `/api/auth/send-code`
```json
{
  "phoneNumber": "+1234567890"
}
```
**Step 2:**  
POST `/api/auth/verify-code`
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered and logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "user": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "roles": ["partner"],
    "isVerified": true
  }
}
```

---

If you need more details about any specific endpoint, validation, or error responses, see the source code or contact the development team.
