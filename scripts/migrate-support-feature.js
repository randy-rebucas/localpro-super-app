#!/usr/bin/env node
/**
 * Migrate support feature files from src/ into features/support/
 *
 * Files migrated:
 *   models:      SupportTicket, LiveChat
 *   controllers: supportController, liveChatController
 *   routes:      support, liveChat, adminLiveChat
 *   services:    automatedLiveChatSlaService, liveChatWebSocketService
 *
 * NOT migrated (platform AI infra, stays in src/):
 *   src/services/aiBotSubAgents/supportAgent.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SRC     = path.join(ROOT, 'src');
const FEATURE = path.join(ROOT, 'features', 'support');

// ── helpers ──────────────────────────────────────────────────────────────────
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

// ── models (pure Mongoose, no path fixes needed) ──────────────────────────────
console.log('\n── models');
migrate(
  path.join(SRC, 'models/SupportTicket.js'),
  path.join(FEATURE, 'models/SupportTicket.js')
);
migrate(
  path.join(SRC, 'models/LiveChat.js'),
  path.join(FEATURE, 'models/LiveChat.js')
);

// ── controllers ───────────────────────────────────────────────────────────────
console.log('\n── controllers');
migrate(
  path.join(SRC, 'controllers/supportController.js'),
  path.join(FEATURE, 'controllers/supportController.js')
  // ../models/SupportTicket → same relative depth, no change needed
);
migrate(
  path.join(SRC, 'controllers/liveChatController.js'),
  path.join(FEATURE, 'controllers/liveChatController.js'),
  [
    ["require('../services/cloudinaryService')",       "require('../../../src/services/cloudinaryService')"],
    ["require('../services/liveChatWebSocketService')", "require('../services/liveChatWebSocketService')"],
    ["require('../config/logger')",                    "require('../../../src/config/logger')"],
  ]
);

// ── routes ────────────────────────────────────────────────────────────────────
console.log('\n── routes');
migrate(
  path.join(SRC, 'routes/support.js'),
  path.join(FEATURE, 'routes/support.js'),
  [
    ["require('../middleware/auth')",         "require('../../../src/middleware/auth')"],
    ["require('../controllers/supportController')", "require('../controllers/supportController')"],
  ]
);
migrate(
  path.join(SRC, 'routes/liveChat.js'),
  path.join(FEATURE, 'routes/liveChat.js'),
  [
    ["require('../controllers/liveChatController')", "require('../controllers/liveChatController')"],
  ]
);
migrate(
  path.join(SRC, 'routes/adminLiveChat.js'),
  path.join(FEATURE, 'routes/adminLiveChat.js'),
  [
    ["require('../middleware/auth')",               "require('../../../src/middleware/auth')"],
    ["require('../controllers/liveChatController')", "require('../controllers/liveChatController')"],
  ]
);

// ── services ──────────────────────────────────────────────────────────────────
console.log('\n── services');
migrate(
  path.join(SRC, 'services/automatedLiveChatSlaService.js'),
  path.join(FEATURE, 'services/automatedLiveChatSlaService.js'),
  [
    ["require('../config/logger')",            "require('../../../src/config/logger')"],
    ["require('./notificationService')",       "require('../../../src/services/notificationService')"],
    ["require('../models/LiveChat')",          "require('../models/LiveChat')"],
    ["require('../models/User')",              "require('../../../src/models/User')"],
    ["require('../models/Communication')",     "require('../../../src/models/Communication')"],
  ]
);
migrate(
  path.join(SRC, 'services/liveChatWebSocketService.js'),
  path.join(FEATURE, 'services/liveChatWebSocketService.js'),
  [
    ["require('../config/logger')", "require('../../../src/config/logger')"],
  ]
);

// ── stubs in src/ ─────────────────────────────────────────────────────────────
console.log('\n── stubs');
stub(path.join(SRC, 'models/SupportTicket.js'),                    '../../features/support/models/SupportTicket');
stub(path.join(SRC, 'models/LiveChat.js'),                         '../../features/support/models/LiveChat');
stub(path.join(SRC, 'controllers/supportController.js'),           '../../features/support/controllers/supportController');
stub(path.join(SRC, 'controllers/liveChatController.js'),          '../../features/support/controllers/liveChatController');
stub(path.join(SRC, 'routes/support.js'),                          '../../features/support/routes/support');
stub(path.join(SRC, 'routes/liveChat.js'),                         '../../features/support/routes/liveChat');
stub(path.join(SRC, 'routes/adminLiveChat.js'),                    '../../features/support/routes/adminLiveChat');
stub(path.join(SRC, 'services/automatedLiveChatSlaService.js'),    '../../features/support/services/automatedLiveChatSlaService');
stub(path.join(SRC, 'services/liveChatWebSocketService.js'),       '../../features/support/services/liveChatWebSocketService');

// ── update features/support/index.js ─────────────────────────────────────────
console.log('\n── index.js');
const indexContent = `/**
 * Support Feature Module
 *
 * Public API for the Support & Live-Chat domain.
 * All external code must import from this index — not from internal files directly.
 *
 * Internal structure:
 *   models/      — SupportTicket, LiveChat
 *   controllers/ — supportController, liveChatController
 *   routes/      — support, liveChat, adminLiveChat
 *   services/    — liveChatWebSocketService, automatedLiveChatSlaService
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/models/Communication
 * - src/services/notificationService
 * - src/services/cloudinaryService
 * - src/config/logger
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes          = require('./routes/support');
const liveChatRoutes  = require('./routes/liveChat');
const adminChatRoutes = require('./routes/adminLiveChat');

// ── Models (internal) ────────────────────────────────────────────────────────
const SupportTicket = require('./models/SupportTicket');
const LiveChat      = require('./models/LiveChat');

// ── Services (internal) ──────────────────────────────────────────────────────
const liveChatWebSocketService    = require('./services/liveChatWebSocketService');
const automatedLiveChatSlaService = require('./services/automatedLiveChatSlaService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  liveChatRoutes,
  adminChatRoutes,

  // Models
  SupportTicket,
  LiveChat,

  // Services
  liveChatWebSocketService,
  automatedLiveChatSlaService,
};
`;
write(path.join(FEATURE, 'index.js'), indexContent);
console.log('  ✓  features/support/index.js');

console.log('\n✅  support migration complete\n');
