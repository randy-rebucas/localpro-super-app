# `/api/auth/verify-code` Endpoint Response

## Endpoint Details

**Method:** `POST`  
**Path:** `/api/auth/verify-code`  
**Access:** Public  
**Description:** Verify SMS code and register/login user

---

## Request Body

```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Required Fields:**
- `phoneNumber` (string) - Phone number in international format (e.g., +1234567890)
- `code` (string) - 6-digit verification code

---

## Success Responses

### 1. Existing User Login (200 OK)

When the user already exists in the system:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "roles": ["client", "provider"],
    "isVerified": true,
    "subscription": null,
    "trustScore": 85,
    "profile": {
      "avatar": {
        "url": "https://res.cloudinary.com/...",
        "publicId": "localpro/users/profiles/avatar-123",
        "thumbnail": "https://res.cloudinary.com/..."
      },
      "bio": "Professional service provider"
    }
  },
  "isNewUser": false
}
```

**Response Fields:**
- `success` (boolean) - Always `true` for success
- `message` (string) - "Login successful"
- `token` (string) - JWT authentication token
- `user` (object) - User object with:
  - `id` (string) - User ID
  - `phoneNumber` (string) - User's phone number
  - `firstName` (string) - User's first name (or "User" if not set)
  - `lastName` (string) - User's last name (or "User" if not set)
  - `email` (string|null) - User's email address
  - `roles` (array) - User roles (default: ["client"])
  - `isVerified` (boolean) - Phone verification status
  - `subscription` (string|null) - LocalPro Plus subscription ID
  - `trustScore` (number) - User trust score (0-100)
  - `profile` (object) - User profile:
    - `avatar` (object|null) - Avatar image data
    - `bio` (string|null) - User bio
- `isNewUser` (boolean) - Always `false` for existing users

---

### 2. New User Registration (201 Created or 200 OK)

When the user is newly registered:

**If profile data provided in request (200 OK):**
```json
{
  "success": true,
  "message": "User registered and logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "phoneNumber": "+1234567890",
    "firstName": null,
    "lastName": null,
    "email": null,
    "roles": ["client"],
    "isVerified": true,
    "subscription": null,
    "trustScore": 0
  },
  "isNewUser": true
}
```

**If no profile data provided (201 Created):**
```json
{
  "success": true,
  "message": "User registered and logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "phoneNumber": "+1234567890",
    "firstName": null,
    "lastName": null,
    "email": null,
    "roles": ["client"],
    "isVerified": true,
    "subscription": null,
    "trustScore": 0
  },
  "isNewUser": true
}
```

**Response Fields:**
- `success` (boolean) - Always `true` for success
- `message` (string) - "User registered and logged in successfully"
- `token` (string) - JWT authentication token
- `user` (object) - User object with:
  - `id` (string) - User ID
  - `phoneNumber` (string) - User's phone number
  - `firstName` (string|null) - User's first name (null for new users)
  - `lastName` (string|null) - User's last name (null for new users)
  - `email` (string|null) - User's email address (null for new users)
  - `roles` (array) - User roles (default: ["client"])
  - `isVerified` (boolean) - Phone verification status (true after verification)
  - `subscription` (string|null) - LocalPro Plus subscription ID (null for new users)
  - `trustScore` (number) - User trust score (starts at 0 for new users)
- `isNewUser` (boolean) - Always `true` for new users

**Note:** Status code is `201 Created` if no profile data is provided, `200 OK` if profile data is provided.

---

## Error Responses

### 1. Missing Required Fields (400 Bad Request)

```json
{
  "success": false,
  "message": "Phone number and verification code are required",
  "code": "MISSING_REQUIRED_FIELDS"
}
```

---

### 2. Invalid Phone Number Format (400 Bad Request)

```json
{
  "success": false,
  "message": "Invalid phone number format",
  "code": "INVALID_PHONE_FORMAT"
}
```

---

### 3. Invalid Verification Code Format (400 Bad Request)

```json
{
  "success": false,
  "message": "Invalid verification code format. Please enter a 6-digit code",
  "code": "INVALID_CODE_FORMAT"
}
```

---

### 4. Invalid or Expired Verification Code (400 Bad Request)

```json
{
  "success": false,
  "message": "Invalid or expired verification code",
  "code": "INVALID_VERIFICATION_CODE"
}
```

---

### 5. Verification Service Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Verification service error",
  "code": "VERIFICATION_SERVICE_ERROR"
}
```

---

### 6. Database Unavailable (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Database service unavailable",
  "code": "DATABASE_UNAVAILABLE"
}
```

---

### 7. Database Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Database service error",
  "code": "DATABASE_ERROR"
}
```

---

### 8. Internal Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Server error",
  "code": "INTERNAL_SERVER_ERROR",
  "error": "Detailed error message (development only)"
}
```

---

## JWT Token Structure

The `token` field contains a JWT with the following payload:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "phoneNumber": "+1234567890",
  "roles": ["client", "provider"],
  "isVerified": true,
  "iss": "localpro-api",
  "aud": "localpro-mobile"
}
```

**Token Claims:**
- `id` (string) - User ID
- `phoneNumber` (string) - User's phone number
- `roles` (array) - User roles
- `isVerified` (boolean) - Verification status
- `iss` (string) - Issuer: "localpro-api"
- `aud` (string) - Audience: "localpro-mobile"

---

## Response Status Codes

| Status Code | Scenario |
|-------------|----------|
| `200 OK` | Existing user login OR new user registration with profile data |
| `201 Created` | New user registration without profile data |
| `400 Bad Request` | Validation errors, invalid code, etc. |
| `500 Internal Server Error` | Server errors, database errors, etc. |

---

## Additional Notes

1. **User Creation:** New users are automatically created with:
   - Phone number verified
   - Default role: `["client"]`
   - Trust score: `0`
   - Related documents (Trust, Activity, Management, Wallet, Referral) are created automatically via post-save hooks

2. **Login Tracking:** For existing users:
   - Login information is updated (IP, user agent, timestamp)
   - User status is set to 'active'
   - Login activity is tracked asynchronously

3. **Registration Tracking:** For new users:
   - Registration activity is tracked asynchronously
   - User status is set to 'active'

4. **Trust Score:** 
   - New users start with `trustScore: 0`
   - Existing users have their current trust score returned
   - Trust score is calculated from the UserTrust model

5. **Profile Data:**
   - New users typically have `null` values for `firstName`, `lastName`, and `email`
   - These should be completed via the `/api/auth/complete-onboarding` endpoint

6. **Token Usage:**
   - The JWT token should be included in subsequent requests as:
     ```
     Authorization: Bearer <token>
     ```

---

## Example Usage

### cURL Request

```bash
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

### JavaScript/Fetch Example

```javascript
const response = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    code: '123456'
  })
});

const data = await response.json();

if (data.success) {
  // Store token
  localStorage.setItem('token', data.token);
  
  // Handle user data
  console.log('User:', data.user);
  console.log('Is new user:', data.isNewUser);
  
  // Redirect based on onboarding status
  if (data.isNewUser || !data.user.firstName) {
    // Redirect to onboarding
  } else {
    // Redirect to dashboard
  }
}
```

---

## Related Endpoints

- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/complete-onboarding` - Complete user profile
- `GET /api/auth/profile-completion-status` - Check if onboarding is needed
- `GET /api/auth/me` - Get current user information

