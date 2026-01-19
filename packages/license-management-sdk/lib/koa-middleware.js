// Koa middleware for license validation
const { validateLicense } = require('./validate');

/**
 * Koa middleware to validate license key from headers or query.
 * @param {object} options - Validation options (e.g., expiry, issuer, type, scope, revocation, etc.)
 */
function koaLicenseMiddleware(options = {}) {
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
  return async function (ctx, next) {
    const licenseKey = ctx.headers['x-license-key'] || ctx.query.licenseKey;
    const result = await validateLicense(licenseKey, options);
    if (!result.isValid) {
      const msg = (messages[locale] && messages[locale].invalid) || messages.en.invalid;
      ctx.status = 403;
      ctx.body = { error: msg, reason: result.reason, meta: result.meta };
      return;
    }
    ctx.state.license = result.meta;
    await next();
  };
}

module.exports = { koaLicenseMiddleware };
