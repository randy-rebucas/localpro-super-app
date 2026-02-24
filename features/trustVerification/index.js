const routes = require('./routes/trustVerification');
const { VerificationRequest, Dispute, TrustScore } = require('./models/TrustVerification');

module.exports = { routes, VerificationRequest, Dispute, TrustScore };
