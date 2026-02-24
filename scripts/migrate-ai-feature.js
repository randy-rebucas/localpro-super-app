#!/usr/bin/env node
/**
 * Migrate AI feature files from src/ into features/ai/
 *
 * Files migrated:
 *   models:      AIBot
 *   controllers: aiBotController, aiMarketplaceController, aiUserController
 *   routes:      aiBot, aiMarketplace, aiUsers
 *   services:    aiService, aiBotService, aiBotEventListener
 *   services/subAgents/: baseSubAgent, analyticsAgent, auditAgent, bookingAgent,
 *                         escrowAgent, marketingAgent, operationsAgent,
 *                         paymentAgent, providerAgent, supportAgent
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SRC     = path.join(ROOT, 'src');
const FEATURE = path.join(ROOT, 'features', 'ai');

function read(file)       { return fs.readFileSync(file, 'utf8'); }
function write(file, txt) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, txt, 'utf8'); }

function migrate(src, dest, replacements = []) {
  let code = read(src);
  for (const [from, to] of replacements) code = code.split(from).join(to);
  write(dest, code);
  console.log(`  ✓  ${path.relative(ROOT, dest)}`);
}

function stub(file, target) {
  write(file, `// Deprecated: moved to ${target}\nmodule.exports = require('${target}');\n`);
  console.log(`  stub ${path.relative(ROOT, file)}`);
}

const toSrc = '../../../src';

// ── model (pure Mongoose) ─────────────────────────────────────────────────────
console.log('\n── models');
migrate(
  path.join(SRC, 'models/AIBot.js'),
  path.join(FEATURE, 'models/AIBot.js')
);

// ── controllers ───────────────────────────────────────────────────────────────
console.log('\n── controllers');
migrate(
  path.join(SRC, 'controllers/aiBotController.js'),
  path.join(FEATURE, 'controllers/aiBotController.js'),
  [
    ["require('../services/aiBotService')",       "require('../services/aiBotService')"],
    ["require('../services/aiBotEventListener')", "require('../services/aiBotEventListener')"],
    ["require('../config/logger')",               `require('${toSrc}/config/logger')`],
  ]
);
migrate(
  path.join(SRC, 'controllers/aiMarketplaceController.js'),
  path.join(FEATURE, 'controllers/aiMarketplaceController.js'),
  [
    ["require('../services/aiService')",     "require('../services/aiService')"],
    ["require('../models/Marketplace')",     `require('${toSrc}/models/Marketplace')`],
    ["require('../config/logger')",          `require('${toSrc}/config/logger')`],
    ["require('../utils/responseHelper')",   `require('${toSrc}/utils/responseHelper')`],
    ["require('../models/User')",            `require('${toSrc}/models/User')`],
  ]
);
migrate(
  path.join(SRC, 'controllers/aiUserController.js'),
  path.join(FEATURE, 'controllers/aiUserController.js'),
  [
    ["require('../services/aiService')",    "require('../services/aiService')"],
    ["require('../models/User')",           `require('${toSrc}/models/User')`],
    ["require('../config/logger')",         `require('${toSrc}/config/logger')`],
    ["require('../utils/responseHelper')",  `require('${toSrc}/utils/responseHelper')`],
  ]
);

// ── routes ────────────────────────────────────────────────────────────────────
console.log('\n── routes');
migrate(
  path.join(SRC, 'routes/aiBot.js'),
  path.join(FEATURE, 'routes/aiBot.js'),
  [
    ["require('../controllers/aiBotController')", "require('../controllers/aiBotController')"],
    ["require('../middleware/auth')",             `require('${toSrc}/middleware/auth')`],
  ]
);
migrate(
  path.join(SRC, 'routes/aiMarketplace.js'),
  path.join(FEATURE, 'routes/aiMarketplace.js'),
  [
    ["require('../middleware/auth')",                      `require('${toSrc}/middleware/auth')`],
    ["require('../controllers/aiMarketplaceController')",  "require('../controllers/aiMarketplaceController')"],
  ]
);
migrate(
  path.join(SRC, 'routes/aiUsers.js'),
  path.join(FEATURE, 'routes/aiUsers.js'),
  [
    ["require('../middleware/auth')",             `require('${toSrc}/middleware/auth')`],
    ["require('../controllers/aiUserController')", "require('../controllers/aiUserController')"],
  ]
);

// ── services ──────────────────────────────────────────────────────────────────
console.log('\n── services');
migrate(
  path.join(SRC, 'services/aiService.js'),
  path.join(FEATURE, 'services/aiService.js'),
  [
    ["require('../config/logger')", `require('${toSrc}/config/logger')`],
  ]
);
migrate(
  path.join(SRC, 'services/aiBotService.js'),
  path.join(FEATURE, 'services/aiBotService.js'),
  [
    ["require('./aiService')",                     "require('./aiService')"],
    ["require('../config/logger')",                `require('${toSrc}/config/logger')`],
    ["require('../models/AIBot')",                 "require('../models/AIBot')"],
    ["require('./aiBotSubAgents/providerAgent')",   "require('./subAgents/providerAgent')"],
    ["require('./aiBotSubAgents/bookingAgent')",    "require('./subAgents/bookingAgent')"],
    ["require('./aiBotSubAgents/paymentAgent')",    "require('./subAgents/paymentAgent')"],
    ["require('./aiBotSubAgents/escrowAgent')",     "require('./subAgents/escrowAgent')"],
    ["require('./aiBotSubAgents/supportAgent')",    "require('./subAgents/supportAgent')"],
    ["require('./aiBotSubAgents/operationsAgent')", "require('./subAgents/operationsAgent')"],
    ["require('./aiBotSubAgents/auditAgent')",      "require('./subAgents/auditAgent')"],
    ["require('./aiBotSubAgents/marketingAgent')",  "require('./subAgents/marketingAgent')"],
    ["require('./aiBotSubAgents/analyticsAgent')",  "require('./subAgents/analyticsAgent')"],
    ["require('./n8nService')",                    `require('${toSrc}/services/n8nService')`],
  ]
);
migrate(
  path.join(SRC, 'services/aiBotEventListener.js'),
  path.join(FEATURE, 'services/aiBotEventListener.js'),
  [
    ["require('./aiBotService')",   "require('./aiBotService')"],
    ["require('../config/logger')", `require('${toSrc}/config/logger')`],
  ]
);

// ── subAgents ─────────────────────────────────────────────────────────────────
console.log('\n── services/subAgents');
const subAgentSrc  = path.join(SRC, 'services/aiBotSubAgents');
const subAgentDest = path.join(FEATURE, 'services/subAgents');
const toSrcFromSub = '../../../../src';

// baseSubAgent — only logger fix
migrate(
  path.join(subAgentSrc, 'baseSubAgent.js'),
  path.join(subAgentDest, 'baseSubAgent.js'),
  [
    ["require('../../config/logger')", `require('${toSrcFromSub}/config/logger')`],
  ]
);

// all other agents — logger + baseSubAgent stays same
for (const agent of ['analyticsAgent', 'auditAgent', 'bookingAgent', 'escrowAgent',
                      'marketingAgent', 'operationsAgent', 'paymentAgent', 'supportAgent']) {
  migrate(
    path.join(subAgentSrc, `${agent}.js`),
    path.join(subAgentDest, `${agent}.js`),
    [
      ["require('./baseSubAgent')",     "require('./baseSubAgent')"],
      ["require('../../config/logger')", `require('${toSrcFromSub}/config/logger')`],
    ]
  );
}

// providerAgent — also fix cross-feature Provider path
migrate(
  path.join(subAgentSrc, 'providerAgent.js'),
  path.join(subAgentDest, 'providerAgent.js'),
  [
    ["require('./baseSubAgent')",                              "require('./baseSubAgent')"],
    ["require('../../config/logger')",                        `require('${toSrcFromSub}/config/logger')`],
    ["require('../../../features/provider/models/Provider')",  "require('../../../provider/models/Provider')"],
  ]
);

// ── stubs in src/ ─────────────────────────────────────────────────────────────
console.log('\n── stubs');
const stubList = [
  ['models/AIBot',                          'ai/models/AIBot'],
  ['controllers/aiBotController',           'ai/controllers/aiBotController'],
  ['controllers/aiMarketplaceController',   'ai/controllers/aiMarketplaceController'],
  ['controllers/aiUserController',          'ai/controllers/aiUserController'],
  ['routes/aiBot',                          'ai/routes/aiBot'],
  ['routes/aiMarketplace',                  'ai/routes/aiMarketplace'],
  ['routes/aiUsers',                        'ai/routes/aiUsers'],
  ['services/aiService',                    'ai/services/aiService'],
  ['services/aiBotService',                 'ai/services/aiBotService'],
  ['services/aiBotEventListener',           'ai/services/aiBotEventListener'],
  ['services/aiBotSubAgents/baseSubAgent',  'ai/services/subAgents/baseSubAgent'],
  ['services/aiBotSubAgents/analyticsAgent','ai/services/subAgents/analyticsAgent'],
  ['services/aiBotSubAgents/auditAgent',    'ai/services/subAgents/auditAgent'],
  ['services/aiBotSubAgents/bookingAgent',  'ai/services/subAgents/bookingAgent'],
  ['services/aiBotSubAgents/escrowAgent',   'ai/services/subAgents/escrowAgent'],
  ['services/aiBotSubAgents/marketingAgent','ai/services/subAgents/marketingAgent'],
  ['services/aiBotSubAgents/operationsAgent','ai/services/subAgents/operationsAgent'],
  ['services/aiBotSubAgents/paymentAgent',  'ai/services/subAgents/paymentAgent'],
  ['services/aiBotSubAgents/providerAgent', 'ai/services/subAgents/providerAgent'],
  ['services/aiBotSubAgents/supportAgent',  'ai/services/subAgents/supportAgent'],
];
for (const [rel, feat] of stubList) {
  stub(path.join(SRC, `${rel}.js`), `../../features/${feat}`);
}

// ── index.js ──────────────────────────────────────────────────────────────────
console.log('\n── index.js');
const indexContent = `/**
 * AI Feature Module
 *
 * Public API for the AI Bot, AI Marketplace, AI User, and sub-agent domain.
 *
 * Internal structure:
 *   models/          — AIBot
 *   controllers/     — aiBotController, aiMarketplaceController, aiUserController
 *   routes/          — aiBot, aiMarketplace, aiUsers
 *   services/        — aiService, aiBotService, aiBotEventListener
 *   services/subAgents/ — baseSubAgent + 9 domain agents
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth
 * - src/models/User, Marketplace
 * - src/services/n8nService
 * - src/config/logger, src/utils/responseHelper
 *
 * Cross-feature dependencies:
 * - features/provider → Provider (via providerAgent)
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const aiBotRoutes          = require('./routes/aiBot');
const aiMarketplaceRoutes  = require('./routes/aiMarketplace');
const aiUsersRoutes        = require('./routes/aiUsers');

// ── Models (internal) ────────────────────────────────────────────────────────
const AIBot = require('./models/AIBot');

// ── Services (internal) ──────────────────────────────────────────────────────
const aiService            = require('./services/aiService');
const aiBotService         = require('./services/aiBotService');
const aiBotEventListener   = require('./services/aiBotEventListener');

module.exports = {
  // Routes (mount in server.js)
  aiBotRoutes,
  aiMarketplaceRoutes,
  aiUsersRoutes,

  // Models
  AIBot,

  // Services
  aiService,
  aiBotService,
  aiBotEventListener,
};
`;
write(path.join(FEATURE, 'index.js'), indexContent);
console.log('  ✓  features/ai/index.js');

console.log('\n✅  ai migration complete\n');
