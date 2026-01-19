// Express middleware for license validation

const { validateLicense } = require('./validate');
const { validateLicenseRemote } = require('./remote');

/**

/**
 * Express middleware to validate license key from headers or query.
 * Supports remote validation if options.remote is set.
 * @param {object} options - Validation options (e.g., expiry, issuer, remote, logger).
 */
function licenseMiddleware(options = {}) {
  const logger = options.logger || ((msg) => {});
  const locale = options.locale || 'en';
  const messages = {
    en: {
      invalid: 'Invalid license',
    },
    es: {
      invalid: 'Licencia inválida',
    },
    fr: {
      invalid: 'Licence invalide',
    },
    // Add more locales as needed
  };
  return async function (req, res, next) {
    const licenseKey = req.headers['x-license-key'] || req.query.licenseKey;
    let result;
    if (options.remote && options.remote.endpoint) {
      try {
        result = await validateLicenseRemote(licenseKey, options.remote);
        logger({ event: 'remote-validation', licenseKey, result });
      } catch (e) {
        logger({ event: 'remote-validation-error', licenseKey, error: e });
        // fallback to local
        result = validateLicense(licenseKey, options);
        logger({ event: 'local-fallback', licenseKey, result });
      }
    } else {
      result = validateLicense(licenseKey, options);
      logger({ event: 'local-validation', licenseKey, result });
    }
    if (!result.isValid) {
      logger({ event: 'validation-failed', licenseKey, result });
      const msg = (messages[locale] && messages[locale].invalid) || messages.en.invalid;
      return res.status(403).json({ error: msg, reason: result.reason, meta: result.meta });
    }
    req.license = result.meta;
    next();
  };
}

module.exports = { licenseMiddleware };
