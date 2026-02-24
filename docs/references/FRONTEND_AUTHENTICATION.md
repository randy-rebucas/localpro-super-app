# Frontend Authentication Documentation

This document describes the authentication flows and integration points for frontend applications connecting to the LocalPro Super App API.

## Overview
- The backend API uses JWT-based authentication for user sessions.
- Authentication endpoints are documented in [docs/API_REFERENCE.md](API_REFERENCE.md).
- Frontend clients must handle login, registration, token storage, and session renewal.

## Authentication Flows

### 1. User Registration
- Endpoint: `POST /api/auth/register`
- Required fields: email, password, name, role, etc.
- On success, returns a JWT token and user profile.
- Store the JWT securely (e.g., HttpOnly cookie or secure storage).

### 2. User Login
- Endpoint: `POST /api/auth/login`
- Required fields: email, password
- On success, returns a JWT token and user profile.
- Store the JWT securely.

### 3. Token Validation
- JWT tokens must be sent in the `Authorization: Bearer <token>` header for all protected API requests.
- The backend will reject requests with missing or invalid tokens (HTTP 401).

### 4. Logout
- Frontend should clear the stored JWT token on logout.
- There is no server-side session to invalidate (stateless JWT).

### 5. Token Expiry & Refresh
- JWT tokens have an expiry (see backend config).
- If a token expires, prompt the user to log in again.
- (If refresh tokens are implemented, see API docs for refresh flow.)

## Best Practices
- Never store JWT tokens in localStorage if possible; prefer HttpOnly cookies.
- Always use HTTPS in production.
- Handle 401/403 errors globally to redirect users to login.
- Use role-based UI logic as per the `role` field in the user profile.

## Example: Login Request
```js
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
  .then(res => res.json())
  .then(data => {
    // Store JWT token securely
    // Redirect or update UI
  });
```

## References

For any changes to authentication endpoints or payloads, always consult and update the API documentation in `docs/`.

---

## Error Handling
- Handle authentication errors (401, 403) globally in your frontend app.
- Display user-friendly messages for invalid credentials, expired tokens, or access denied.
- Example:
```js
if (response.status === 401 || response.status === 403) {
  // Redirect to login or show error
}
```

## Role-Based Access
- The user profile returned after login includes a `role` field (e.g., client, provider, admin).
- Use this field to control access to routes and UI components.
- Example:
```js
if (user.role === 'admin') {
  // Show admin dashboard
}
```

## UI Integration Tips
- Use protected routes/components for authenticated users only.
- Store authentication state in a global context or state manager (e.g., Redux, Context API).
- On app load, check for a valid JWT and fetch user profile if present.
- Example:
```js
// Pseudocode
if (token) {
  fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.json())
    .then(user => setUser(user));
}
```

## Troubleshooting
- If login fails, check API endpoint, payload format, and network errors.
- If JWT is not accepted, verify token storage and header format.
- For CORS issues, ensure backend allows frontend origin.
- For role-based issues, confirm the role field in the user profile and backend permissions.

## FAQ
- **Where should I store the JWT?**
  - Prefer HttpOnly cookies for security. If not possible, use secure storage and clear on logout.
- **How do I handle token expiry?**
  - Prompt user to log in again or implement refresh token flow if available.
- **How do I test authentication?**
  - Use Postman collections in `postman/` for endpoint testing.

---

For further details, see API and schema docs in `docs/` and consult backend developers for integration questions.
