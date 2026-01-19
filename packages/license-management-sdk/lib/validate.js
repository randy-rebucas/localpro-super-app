// License validation logic


/**
 * Validates a license key.
 * @param {string} licenseKey - The license key to validate.
 * @param {object} [options] - Optional validation options (e.g., expiry, issuer, type, scope).
 * @returns {object} Result with isValid, reason, and meta.
 */
async function validateLicense(licenseKey, options = {}) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { isValid: false, reason: 'License key missing or invalid', meta: null };
  }
  // Revocation check (remote)
  if (options.revocation && options.revocation.endpoint) {
    const { isLicenseRevokedRemote } = require('./revocation');
    const revoked = await isLicenseRevokedRemote(licenseKey, options.revocation);
    if (revoked) {
      return { isValid: false, reason: 'License revoked', meta: { revoked: true } };
    }
  }
  // Simulate expiry check
  if (options.expiry && Date.now() > new Date(options.expiry).getTime()) {
    return { isValid: false, reason: 'License expired', meta: { expired: true } };
  }
  // Simulate issuer check
  if (options.issuer && options.issuer !== 'LocalPro') {
    return { isValid: false, reason: 'Invalid issuer', meta: { issuer: options.issuer } };
  }
  // License type check
  if (options.type && !['trial', 'full', 'subscription'].includes(options.type)) {
    return { isValid: false, reason: 'Unsupported license type', meta: { type: options.type } };
  }
  if (options.type && options.expectedType && options.type !== options.expectedType) {
    return { isValid: false, reason: 'License type mismatch', meta: { type: options.type, expected: options.expectedType } };
  }
  // Scope check (user, device, org)
  if (options.scope && options.expectedScope && options.scope !== options.expectedScope) {
    return { isValid: false, reason: 'License scope mismatch', meta: { scope: options.scope, expected: options.expectedScope } };
  }
  // Add more checks as needed
  return {
    isValid: true,
    reason: 'Valid license',
    meta: {
      licenseKey,
      type: options.type || 'full',
      scope: options.scope || 'user',
    }
  };
}

module.exports = { validateLicense };
