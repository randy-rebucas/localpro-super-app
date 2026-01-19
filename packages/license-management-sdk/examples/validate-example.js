// Example usage of validateLicense utility
const { validateLicense } = require('../index');

const result = validateLicense('SAMPLE-KEY-123', { expiry: '2099-12-31', issuer: 'LocalPro' });
console.log(result);
