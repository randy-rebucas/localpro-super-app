/**
 * Authentication API – /api/auth/*  and  /api/registration/*
 *
 * Covers:
 *  - Phone OTP flow    (sendCode / verifyCode)
 *  - Email flow        (registerWithEmail / loginWithEmail / verifyEmailOTP / checkEmail / setPassword)
 *  - Token management  (refresh / logout)
 *  - Magic link        (sendMagicLink / verifyMagicLink)  — passwordless login
 *  - Profile           (getMe / getProfile / updateProfile / uploadAvatar / uploadPortfolio)
 *  - MPIN              (setMpin / verifyMpin / loginWithMpin / getMpinStatus / disableMpin)
 *  - Onboarding        (completeOnboarding / getProfileCompletionStatus / getProfileCompleteness)
 *  - Registration      (earlyRegistration)
 *
 * Security hardening (v2):
 *  - Passwords require uppercase + lowercase + digit + special char
 *  - OTPs generated with crypto.randomInt (CSPRNG)
 *  - JWT tokens carry sub + jti claims; jti is blocklisted on logout
 *  - Each device/session has its own RefreshToken document (multi-device)
 *  - Email login checks account lockout before attempting password verification
 *  - TOTP 2FA uses otplib (replaces unmaintained speakeasy)
 *  - See docs/AUTH_SECURITY.md for the full reference
 */
class AuthAPI {
  constructor(client) {
    this.client = client;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHONE OTP FLOW
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send OTP code via SMS (phone authentication step 1)
   * @param {Object} data
   * @param {string} data.phoneNumber - E.164 formatted phone number e.g. "+63XXXXXXXXXX"
   * @returns {Promise<Object>}
   */
  async sendCode(data) {
    if (!data.phoneNumber) throw new Error('phoneNumber is required');
    return this.client.post('/api/auth/send-code', data);
  }

  /**
   * Verify OTP code and obtain tokens (phone authentication step 2)
   * @param {Object} data
   * @param {string} data.phoneNumber - E.164 formatted phone number
   * @param {string} data.code        - 6-digit OTP received via SMS
   * @returns {Promise<Object>} Tokens + user
   */
  async verifyCode(data) {
    if (!data.phoneNumber || !data.code) throw new Error('phoneNumber and code are required');
    return this.client.post('/api/auth/verify-code', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL FLOW
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a new user with email + password
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} [data.firstName]
   * @param {string} [data.lastName]
   * @param {string} [data.phoneNumber]
   * @returns {Promise<Object>} Registration result with tokens
   */
  async registerWithEmail(data) {
    if (!data.email || !data.password) throw new Error('email and password are required');
    return this.client.post('/api/auth/register-email', data);
  }

  /**
   * Login with email + password
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @returns {Promise<Object>} Tokens + user
   */
  async loginWithEmail(data) {
    if (!data.email || !data.password) throw new Error('email and password are required');
    return this.client.post('/api/auth/login-email', data);
  }

  /**
   * Verify email address with OTP (sent after email registration)
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.otp - One-time code from verification email
   * @returns {Promise<Object>}
   */
  async verifyEmailOTP(data) {
    if (!data.email || !data.otp) throw new Error('email and otp are required');
    return this.client.post('/api/auth/verify-email-otp', data);
  }

  /**
   * Check whether an email address is already registered
   * @param {string} email
   * @returns {Promise<Object>} { exists: boolean }
   */
  async checkEmail(email) {
    if (!email) throw new Error('email is required');
    return this.client.post('/api/auth/check-email', { email });
  }

  /**
   * Set / reset password using a one-time token
   * @param {Object} data
   * @param {string} data.token    - Short-lived reset or verification token
   * @param {string} data.password - New password (min 8 chars)
   * @returns {Promise<Object>}
   */
  async setPassword(data) {
    if (!data.token || !data.password) throw new Error('token and password are required');
    return this.client.post('/api/auth/set-password', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Refresh access token using a valid refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object>} New accessToken + refreshToken pair
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) throw new Error('refreshToken is required');
    return this.client.post('/api/auth/refresh', { refreshToken });
  }

  /**
   * Logout current user.
   * Blocklists the current JWT (via its `jti` claim) and optionally revokes
   * the supplied refresh token from the multi-device RefreshToken store.
   *
   * @param {string} [refreshToken] - If provided, also revokes this refresh token
   * @returns {Promise<Object>}
   */
  async logout(refreshToken) {
    const body = refreshToken ? { refreshToken } : {};
    return this.client.post('/api/auth/logout', body);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAGIC LINK (PASSWORDLESS LOGIN)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a magic link to the given email address for passwordless login.
   *
   * The response is always 200 regardless of whether the email is registered
   * (anti-enumeration measure). The link is valid for 15 minutes and is
   * single-use — the underlying JWT `jti` is blocklisted after first use.
   *
   * @param {Object} data
   * @param {string} data.email - The recipient's email address
   * @returns {Promise<Object>} { success, message }
   */
  async sendMagicLink(data) {
    if (!data.email) throw new Error('email is required');
    return this.client.post('/api/auth/magic-link', data);
  }

  /**
   * Verify a magic link token (received via email) and obtain auth tokens.
   *
   * Call this from your redirect handler after the user clicks the link.
   * The `token` query parameter is the JWT from the magic link URL.
   *
   * @param {string} token - The JWT from the magic link URL (?token=...)
   * @returns {Promise<Object>} { success, accessToken, refreshToken, user }
   */
  async verifyMagicLink(token) {
    if (!token) throw new Error('token is required');
    return this.client.get(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's full profile
   * @returns {Promise<Object>} User object
   */
  async getMe() {
    return this.client.get('/api/auth/me');
  }

  /**
   * Alias for getMe()
   * @returns {Promise<Object>}
   */
  async getProfile() {
    return this.client.get('/api/auth/profile');
  }

  /**
   * Update the authenticated user's profile
   * @param {Object} data - Fields to update (firstName, lastName, phoneNumber, profile.bio, profile.location …)
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(data) {
    return this.client.put('/api/auth/profile', data);
  }

  /**
   * Upload / replace the user's avatar image
   * @param {FormData} formData - multipart/form-data with field "avatar" (≤ 2 MB, JPEG / PNG)
   * @returns {Promise<Object>} { avatarUrl }
   */
  async uploadAvatar(formData) {
    return this.client.upload('/api/auth/avatar', formData);
  }

  /**
   * Upload portfolio images (up to 5)
   * @param {FormData} formData - multipart/form-data with field "images" (≤ 5 MB each, JPEG / PNG / GIF)
   * @returns {Promise<Object>} { portfolioImages: string[] }
   */
  async uploadPortfolio(formData) {
    return this.client.upload('/api/auth/upload-portfolio', formData);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MPIN
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set a 4–6-digit MPIN for quick login (requires active session)
   * @param {Object} data
   * @param {string} data.mpin        - 4–6 digit numeric PIN
   * @param {string} [data.mpinConfirm] - Confirmation PIN (must match)
   * @returns {Promise<Object>}
   */
  async setMpin(data) {
    if (!data.mpin) throw new Error('mpin is required');
    return this.client.post('/api/auth/mpin/set', data);
  }

  /**
   * Verify MPIN during an active session (e.g. before a sensitive action)
   * @param {Object} data
   * @param {string} data.mpin - 4–6 digit numeric PIN
   * @returns {Promise<Object>}
   */
  async verifyMpin(data) {
    if (!data.mpin) throw new Error('mpin is required');
    return this.client.post('/api/auth/mpin/verify', data);
  }

  /**
   * Login using phone number + MPIN (no password required)
   * @param {Object} data
   * @param {string} data.phoneNumber - E.164 formatted phone number
   * @param {string} data.mpin        - 4–6 digit numeric PIN
   * @returns {Promise<Object>} Tokens + user
   */
  async loginWithMpin(data) {
    if (!data.phoneNumber || !data.mpin) throw new Error('phoneNumber and mpin are required');
    return this.client.post('/api/auth/mpin/login', data);
  }

  /**
   * Get MPIN status for the authenticated user
   * @returns {Promise<Object>} { enabled, locked, attempts, lockedUntil }
   */
  async getMpinStatus() {
    return this.client.get('/api/auth/mpin/status');
  }

  /**
   * Disable MPIN for the authenticated user
   * @returns {Promise<Object>}
   */
  async disableMpin() {
    return this.client.delete('/api/auth/mpin');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mark onboarding as complete and store onboarding responses
   * @param {Object} data - Onboarding answers / preferences
   * @returns {Promise<Object>}
   */
  async completeOnboarding(data) {
    return this.client.post('/api/auth/onboarding/complete', data);
  }

  /**
   * Get what percentage of the profile the user has completed
   * @returns {Promise<Object>} { completionPercentage, missingFields }
   */
  async getProfileCompletionStatus() {
    return this.client.get('/api/auth/profile/completion-status');
  }

  /**
   * Get detailed profile completeness breakdown
   * @returns {Promise<Object>}
   */
  async getProfileCompleteness() {
    return this.client.get('/api/auth/profile/completeness');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EARLY REGISTRATION  (/api/registration/*)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Submit an early-access / waitlist registration
   * @param {Object} data
   * @param {string} data.email
   * @param {string} [data.firstName]
   * @param {string} [data.lastName]
   * @param {string} [data.phoneNumber]
   * @returns {Promise<Object>}
   */
  async earlyRegistration(data) {
    if (!data.email) throw new Error('email is required');
    return this.client.post('/api/registration/early', data);
  }
}

module.exports = AuthAPI;
