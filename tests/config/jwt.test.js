const { 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  isOnboardingComplete,
  validateJWTSecrets
} = require('../../src/config/jwt');

describe('JWT Configuration', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    phoneNumber: '+1234567890',
    role: 'client',
    isVerified: true,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in token payload', () => {
      const token = generateAccessToken(mockUser);
      const { decodeToken } = require('../../src/config/jwt');
      const decoded = decodeToken(token);
      
      expect(decoded.payload.id).toBe(mockUser._id);
      expect(decoded.payload.phoneNumber).toBe(mockUser.phoneNumber);
      expect(decoded.payload.role).toBe(mockUser.role);
      expect(decoded.payload.isVerified).toBe(mockUser.isVerified);
      expect(decoded.payload.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user ID and token type in payload', () => {
      const token = generateRefreshToken(mockUser);
      const { decodeToken } = require('../../src/config/jwt');
      const decoded = decodeToken(token);
      
      expect(decoded.payload.id).toBe(mockUser._id);
      expect(decoded.payload.type).toBe('refresh');
      expect(decoded.payload.tokenVersion).toBeDefined();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = generateTokenPair(mockUser);
      
      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for refresh token when expecting access token', () => {
      const refreshToken = generateRefreshToken(mockUser);
      
      expect(() => {
        verifyAccessToken(refreshToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for access token when expecting refresh token', () => {
      const accessToken = generateAccessToken(mockUser);
      
      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow();
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true for complete user', () => {
      const completeUser = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        isVerified: true
      };
      
      expect(isOnboardingComplete(completeUser)).toBe(true);
    });

    it('should return false for incomplete user', () => {
      const incompleteUser = {
        firstName: 'John',
        phoneNumber: '+1234567890',
        isVerified: true
        // Missing lastName
      };
      
      expect(isOnboardingComplete(incompleteUser)).toBe(false);
    });

    it('should return false for provider without business info', () => {
      const providerUser = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        isVerified: true,
        role: 'provider'
        // Missing businessName and businessAddress
      };
      
      expect(isOnboardingComplete(providerUser)).toBe(false);
    });

    it('should return true for provider with business info', () => {
      const completeProvider = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        isVerified: true,
        role: 'provider',
        businessName: 'Test Business',
        businessAddress: '123 Test St'
      };
      
      expect(isOnboardingComplete(completeProvider)).toBe(true);
    });
  });

  describe('validateJWTSecrets', () => {
    it('should validate JWT secrets successfully', () => {
      // This should not throw an error with test environment
      expect(() => {
        validateJWTSecrets();
      }).not.toThrow();
    });
  });
});
