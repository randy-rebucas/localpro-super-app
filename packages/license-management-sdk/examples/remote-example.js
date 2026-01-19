// Example: Remote license validation
const { validateLicenseRemote } = require('../index');

const endpoint = 'https://your-license-server.com/validate';

validateLicenseRemote('SAMPLE-KEY-123', { endpoint })
  .then(result => console.log('Remote validation result:', result))
  .catch(err => console.error('Remote validation error:', err));
