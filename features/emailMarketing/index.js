const EmailCampaign = require('./models/EmailCampaign');
const EmailSubscriber = require('./models/EmailSubscriber');
const routes = require('./routes/emailMarketing');

module.exports = { routes, EmailCampaign, EmailSubscriber };
