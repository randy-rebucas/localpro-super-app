// Basic test for license-management-sdk
const { validateLicense, licenseMiddleware } = require('./index');

// Test validateLicense
console.log('Test: validateLicense');
console.log(validateLicense('VALID-KEY', { expiry: '2099-12-31', issuer: 'LocalPro' }));
console.log(validateLicense('', { expiry: '2099-12-31', issuer: 'LocalPro' }));
console.log(validateLicense('VALID-KEY', { expiry: '2000-01-01', issuer: 'LocalPro' }));
console.log(validateLicense('VALID-KEY', { expiry: '2099-12-31', issuer: 'OtherIssuer' }));

// Test licenseMiddleware (mock req/res/next)
console.log('\nTest: licenseMiddleware');
const req = { headers: { 'x-license-key': 'VALID-KEY' }, query: {} };
const res = { status: code => ({ json: obj => console.log('Response', code, obj) }) };
const next = () => console.log('Next called');

const mw = licenseMiddleware({ expiry: '2099-12-31', issuer: 'LocalPro' });
mw(req, res, next);

const badReq = { headers: {}, query: {} };
mw(badReq, res, next);
