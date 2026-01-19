// Revocation list check via remote API
const https = require('https');
const http = require('http');

/**
 * Checks if a license key is revoked via remote API.
 * @param {string} licenseKey
 * @param {object} options { endpoint: string, method?: string, headers?: object }
 * @returns {Promise<boolean>} Resolves to true if revoked, false otherwise
 */
function isLicenseRevokedRemote(licenseKey, options = {}) {
  return new Promise((resolve) => {
    if (!options.endpoint) return resolve(false);
    const url = new URL(options.endpoint);
    const protocol = url.protocol === 'https:' ? https : http;
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

module.exports = { isLicenseRevokedRemote };
