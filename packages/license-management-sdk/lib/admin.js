// Admin utilities for license management
const jwt = require('jsonwebtoken');

/**
 * Generate a new license (optionally signed as JWT)
 * @param {object} payload - License data (type, scope, expiry, etc.)
 * @param {object} [options] - { sign: boolean, secretOrPrivateKey, algorithm }
 * @returns {string|object} License string (JWT) or plain object
 */
function generateLicense(payload, options = {}) {
  if (options.sign && options.secretOrPrivateKey) {
    return jwt.sign(payload, options.secretOrPrivateKey, { algorithm: options.algorithm || 'HS256' });
  }
  return payload;
}

/**
 * Revoke a license via remote API
 * @param {string} licenseKey
 * @param {object} options { endpoint: string, method?: string, headers?: object }
 * @returns {Promise<boolean>} Resolves to true if revoked
 */
function revokeLicenseRemote(licenseKey, options = {}) {
  return new Promise((resolve) => {
    if (!options.endpoint) return resolve(false);
    const url = new URL(options.endpoint);
    const protocol = url.protocol === 'https:' ? require('https') : require('http');
    const reqOptions = {
      method: options.method || 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
    };
    const req = protocol.request(options.endpoint, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(!!result.revoked);
        } catch (e) {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.write(JSON.stringify({ licenseKey }));
    req.end();
  });
}

/**
 * Inspect a license (plain or JWT)
 * @param {string|object} license - License string or object
 * @param {object} [options] - { secretOrPublicKey }
 * @returns {object} Decoded license data
 */
function inspectLicense(license, options = {}) {
  if (typeof license === 'string') {
    try {
      return jwt.decode(license) || jwt.verify(license, options.secretOrPublicKey);
    } catch (e) {
      return { error: e.message };
    }
  }
  return license;
}

module.exports = { generateLicense, revokeLicenseRemote, inspectLicense };
