// Example: JWT license validation
const { validateLicenseJWT } = require('../index');

const token = 'YOUR.JWT.LICENSE.TOKEN';
const secret = 'your-secret-or-public-key';

const result = validateLicenseJWT(token, { secretOrPublicKey: secret });
console.log('JWT validation result:', result);
