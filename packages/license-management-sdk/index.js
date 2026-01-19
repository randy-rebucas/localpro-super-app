// Entry point for License Management SDK
const { validateLicense } = require('./lib/validate');
const { licenseMiddleware } = require('./lib/middleware');
const { validateLicenseRemote } = require('./lib/remote');
const { validateLicenseJWT } = require('./lib/jwt');

const { isLicenseRevokedRemote } = require('./lib/revocation');
const { generateLicense, revokeLicenseRemote, inspectLicense } = require('./lib/admin');
const { koaLicenseMiddleware } = require('./lib/koa-middleware');

module.exports = {
  validateLicense,
  validateLicenseRemote,
  validateLicenseJWT,
  isLicenseRevokedRemote,
  generateLicense,
  revokeLicenseRemote,
  inspectLicense,
  licenseMiddleware,
  koaLicenseMiddleware
};
