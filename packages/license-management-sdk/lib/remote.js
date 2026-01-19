// Remote license validation utility
const https = require('https');
const http = require('http');

/**
 * Validate license key via remote API.
 * @param {string} licenseKey
 * @param {object} options { endpoint: string, method?: string, headers?: object, ... }
 * @returns {Promise<object>} Resolves to { isValid, reason, meta }
 */
function validateLicenseRemote(licenseKey, options = {}) {
  return new Promise((resolve) => {
    if (!options.endpoint) {
      return resolve({ isValid: false, reason: 'No remote endpoint specified', meta: null });
    }
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
          resolve(result);
        } catch (e) {
          resolve({ isValid: false, reason: 'Invalid response from remote', meta: { error: e.message } });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ isValid: false, reason: 'Remote validation error', meta: { error: err.message } });
    });
    req.write(JSON.stringify({ licenseKey }));
    req.end();
  });
}

module.exports = { validateLicenseRemote };
