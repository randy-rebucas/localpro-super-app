/**
 * Token Issuance Example
 * Demonstrates how to issue tokens for partners
 */

const { initAuth, issueToken, validateToken, refreshToken } = require('@localpro/auth-access');

// Initialize with private key for signing tokens
initAuth({
  issuer: 'localpro',
  privateKey: process.env.AUTH_PRIVATE_KEY, // Required for issuing tokens
  publicKey: process.env.AUTH_PUBLIC_KEY,   // Required for validating tokens
  defaultExpiresIn: '1h'
});

/**
 * Issue token for a partner
 */
async function createPartnerToken(partnerId, role, scopes = []) {
  try {
    const token = await issueToken({
      partnerId,
      role,
      scopes
    }, {
      expiresIn: '24h'
    });

    console.log('Token issued:', token);
    return token;
  } catch (error) {
    console.error('Error issuing token:', error);
    throw error;
  }
}

/**
 * Validate a token
 */
async function verifyToken(token) {
  try {
    const decoded = await validateToken(token);
    console.log('Token valid:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    throw error;
  }
}

/**
 * Refresh a token
 */
async function renewToken(oldToken) {
  try {
    const newToken = await refreshToken(oldToken, {
      expiresIn: '1h'
    });
    console.log('Token refreshed:', newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

// Example usage
async function main() {
  // Issue token for premium partner
  const token = await createPartnerToken(
    'partner-123',
    'partner:premium',
    ['read:analytics', 'write:services']
  );

  // Validate token
  const decoded = await verifyToken(token);
  console.log('Decoded:', decoded);

  // Refresh token
  const newToken = await renewToken(token);
  console.log('New token:', newToken);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createPartnerToken,
  verifyToken,
  renewToken
};
