# User Actions Endpoints

Complete list of API endpoints that support the user profile Actions menu.

## Actions Menu Endpoints

### 1. Edit User
**Endpoint:** `PUT /api/users/:id`  
**Method:** PUT  
**Access:** Admin, Agency Admin, Agency Owner, Provider, Client (own profile)  
**Description:** Update user information

**Request:**
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "email": "newemail@example.com",
  "phoneNumber": "+1234567890",
  "profile": {
    "bio": "Updated bio"
  }
}
```

---

### 2. Activate User
**Endpoint:** `PATCH /api/users/:id/status`  
**Method:** PATCH  
**Access:** Admin, Agency Admin  
**Description:** Activate or deactivate user account

**Request:**
```http
PATCH /api/users/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": true,
  "reason": "Account reactivated"
}
```

---

### 3. Ban User
**Endpoint:** `POST /api/users/:id/ban`  
**Method:** POST  
**Access:** Admin  
**Description:** Ban user account

**Request:**
```http
POST /api/users/:id/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User banned successfully",
  "data": {
    "isActive": false,
    "status": "banned"
  }
}
```

---

### 4. Verify Documents
**Endpoint:** `PATCH /api/users/:id/verification`  
**Method:** PATCH  
**Access:** Admin, Agency Admin  
**Description:** Update user verification status

**Request:**
```http
PATCH /api/users/:id/verification
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true,
    "businessVerified": true,
    "addressVerified": true,
    "bankAccountVerified": false
  }
}
```

---

### 5. Manage Roles

#### Get User Roles
**Endpoint:** `GET /api/users/:id/roles`  
**Method:** GET  
**Access:** Admin, Agency Admin, Agency Owner  
**Description:** Get user's current roles

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "roles": ["client", "provider"]
  }
}
```

#### Update User Roles
**Endpoint:** `PUT /api/users/:id/roles`  
**Method:** PUT  
**Access:** Admin  
**Description:** Update user roles

**Request:**
```http
PUT /api/users/:id/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roles": ["client", "provider", "supplier"]
}
```

**Valid Roles:**
- `client`
- `provider`
- `admin`
- `supplier`
- `instructor`
- `agency_owner`
- `agency_admin`
- `partner`
- `staff`

---

### 6. Manage Badges

#### Get User Badges
**Endpoint:** `GET /api/users/:id/badges`  
**Method:** GET  
**Access:** Admin, Agency Admin, Agency Owner  
**Description:** Get user's badges

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "badges": [
      {
        "_id": "badge_id",
        "type": "top_rated",
        "description": "Top rated provider",
        "earnedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Add Badge to User
**Endpoint:** `POST /api/users/:id/badges`  
**Method:** POST  
**Access:** Admin, Agency Admin  
**Description:** Add badge to user

**Request:**
```http
POST /api/users/:id/badges
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "top_rated",
  "description": "Top rated provider with excellent reviews"
}
```

#### Delete User Badge
**Endpoint:** `DELETE /api/users/:id/badges/:badgeId`  
**Method:** DELETE  
**Access:** Admin, Agency Admin  
**Description:** Remove badge from user

**Request:**
```http
DELETE /api/users/:id/badges/badge_id
Authorization: Bearer <admin_token>
```

---

### 7. Reset Password
**Endpoint:** `POST /api/users/:id/reset-password`  
**Method:** POST  
**Access:** Admin  
**Description:** Reset user password (generates temporary password)

**Request:**
```http
POST /api/users/:id/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sendEmail": true
}
```

**Response (if sendEmail is false):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "temporaryPassword": "TempPass123",
    "email": "user@example.com",
    "warning": "Please send this password to the user securely"
  }
}
```

**Response (if sendEmail is true):**
```json
{
  "success": true,
  "message": "Password reset successfully. Email sent to user."
}
```

---

### 8. Send Email
**Endpoint:** `POST /api/users/:id/send-email`  
**Method:** POST  
**Access:** Admin, Agency Admin, Agency Owner  
**Description:** Send custom email to user

**Request (Plain Email):**
```http
POST /api/users/:id/send-email
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subject": "Important Notice",
  "message": "<p>This is a custom email message.</p>"
}
```

**Request (Templated Email):**
```http
POST /api/users/:id/send-email
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subject": "Welcome Email",
  "template": "welcome",
  "templateData": {
    "firstName": "John",
    "customField": "value"
  }
}
```

---

### 9. Export Data
**Endpoint:** `GET /api/users/:id/export`  
**Method:** GET  
**Access:** Admin  
**Description:** Export user data (JSON or CSV format)

**Request:**
```http
GET /api/users/:id/export?format=json
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `format` (optional): `json` (default) or `csv`

**Response:**
The response will be a downloadable file containing:
- User profile data
- User management data
- Recent activities (last 100)
- Wallet information
- Export metadata (exportedAt, exportedBy)

---

### 10. Delete User
**Endpoint:** `DELETE /api/users/:id`  
**Method:** DELETE  
**Access:** Admin  
**Description:** Soft delete user account

**Request:**
```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** This is a soft delete. Use `PATCH /api/users/:id/restore` to restore.

---

## Summary Table

| Action | Method | Endpoint | Access |
|--------|--------|----------|--------|
| Edit User | PUT | `/api/users/:id` | Admin, Agency, User (own) |
| Activate User | PATCH | `/api/users/:id/status` | Admin, Agency Admin |
| Ban User | POST | `/api/users/:id/ban` | Admin |
| Verify Documents | PATCH | `/api/users/:id/verification` | Admin, Agency Admin |
| Get Roles | GET | `/api/users/:id/roles` | Admin, Agency |
| Update Roles | PUT | `/api/users/:id/roles` | Admin |
| Get Badges | GET | `/api/users/:id/badges` | Admin, Agency |
| Add Badge | POST | `/api/users/:id/badges` | Admin, Agency Admin |
| Delete Badge | DELETE | `/api/users/:id/badges/:badgeId` | Admin, Agency Admin |
| Reset Password | POST | `/api/users/:id/reset-password` | Admin |
| Send Email | POST | `/api/users/:id/send-email` | Admin, Agency |
| Export Data | GET | `/api/users/:id/export` | Admin |
| Delete User | DELETE | `/api/users/:id` | Admin |

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `USER_NOT_FOUND` - User doesn't exist
- `ACCESS_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

---

## Authentication

All endpoints require authentication via:
- Bearer token: `Authorization: Bearer <token>`
- API key: `X-API-Key` and `X-API-Secret` headers
- Access token: `Authorization: Bearer <access_token>`

---

**Last Updated:** 2024-01-01  
**All endpoints are now implemented and ready for use.**

