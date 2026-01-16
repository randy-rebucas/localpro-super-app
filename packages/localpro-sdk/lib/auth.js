/**
 * Authentication API methods for LocalPro SDK
 */
class AuthAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Register a new user with email
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} [userData.firstName] - First name
   * @param {string} [userData.lastName] - Last name
   * @param {string} [userData.phone] - Phone number
   * @returns {Promise<Object>} Registration result with token
   */
  async register(userData) {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    return await this.client.post('/api/auth/register', userData);
  }

  /**
   * Login with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login result with token
   */
  async login(credentials) {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    return await this.client.post('/api/auth/login', credentials);
  }

  /**
   * Logout user (invalidates token)
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    return await this.client.post('/api/auth/logout');
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    return await this.client.post('/api/auth/refresh', { refreshToken });
  }

  /**
   * Send verification code via SMS
   * @param {Object} phoneData - Phone data
   * @param {string} phoneData.phone - Phone number
   * @returns {Promise<Object>} Verification code sent result
   */
  async sendVerificationCode(phoneData) {
    if (!phoneData.phone) {
      throw new Error('Phone number is required');
    }

    return await this.client.post('/api/auth/send-verification-code', phoneData);
  }

  /**
   * Verify SMS code
   * @param {Object} verificationData - Verification data
   * @param {string} verificationData.phone - Phone number
   * @param {string} verificationData.code - Verification code
   * @returns {Promise<Object>} Verification result
   */
  async verifyCode(verificationData) {
    if (!verificationData.phone || !verificationData.code) {
      throw new Error('Phone number and code are required');
    }

    return await this.client.post('/api/auth/verify-code', verificationData);
  }

  /**
   * Verify email with OTP
   * @param {Object} emailData - Email verification data
   * @param {string} emailData.email - Email address
   * @param {string} emailData.otp - OTP code
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmailOTP(emailData) {
    if (!emailData.email || !emailData.otp) {
      throw new Error('Email and OTP are required');
    }

    return await this.client.post('/api/auth/verify-email-otp', emailData);
  }

  /**
   * Check if email exists
   * @param {string} email - Email address
   * @returns {Promise<Object>} Email check result
   */
  async checkEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    return await this.client.post('/api/auth/check-email', { email });
  }

  /**
   * Set password (for password reset or initial setup)
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.token - Reset token or verification token
   * @param {string} passwordData.password - New password
   * @returns {Promise<Object>} Password set result
   */
  async setPassword(passwordData) {
    if (!passwordData.token || !passwordData.password) {
      throw new Error('Token and password are required');
    }

    return await this.client.post('/api/auth/set-password', passwordData);
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getMe() {
    return await this.client.get('/api/auth/me');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    return await this.client.put('/api/auth/profile', profileData);
  }

  /**
   * Complete onboarding
   * @param {Object} onboardingData - Onboarding data
   * @returns {Promise<Object>} Onboarding completion result
   */
  async completeOnboarding(onboardingData) {
    return await this.client.post('/api/auth/onboarding/complete', onboardingData);
  }

  /**
   * Get profile completion status
   * @returns {Promise<Object>} Profile completion status
   */
  async getProfileCompletionStatus() {
    return await this.client.get('/api/auth/profile/completion-status');
  }

  /**
   * Get profile completeness percentage
   * @returns {Promise<Object>} Profile completeness data
   */
  async getProfileCompleteness() {
    return await this.client.get('/api/auth/profile/completeness');
  }

  /**
   * Upload user avatar
   * @param {FormData|Object} formData - Form data with avatar image
   * @returns {Promise<Object>} Upload result
   */
  async uploadAvatar(formData) {
    return await this.client.upload('/api/auth/avatar', formData);
  }

  /**
   * Upload portfolio images
   * @param {FormData|Object} formData - Form data with portfolio images
   * @returns {Promise<Object>} Upload result
   */
  async uploadPortfolio(formData) {
    return await this.client.upload('/api/auth/upload-portfolio', formData);
  }
}

module.exports = AuthAPI;
