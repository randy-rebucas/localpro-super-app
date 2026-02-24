#!/usr/bin/env node
/**
 * Migrate scheduling feature files from src/ into features/scheduling/
 *
 * Files migrated:
 *   models:      CalendarAvailability, RescheduleRequest, SchedulingSuggestion
 *   controllers: schedulingController, availabilityController
 *   routes:      scheduling, availability
 *   services:    schedulingService, availabilityService,
 *                automatedSchedulingService, automatedAvailabilityService,
 *                automatedBookingService, automatedMarketplaceBookingFollowUpService
 *
 * Cross-feature refs:
 *   features/jobs     → JobRankingScore, JobSchedule, Job
 *   features/provider → Provider, ProviderPerformance, ProviderProfessionalInfo, ProviderPreferences
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '../..');
const SRC     = path.join(ROOT, 'src');
const FEATURE = path.join(ROOT, 'features', 'scheduling');

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

// Shared path constants
const toSrc        = '../../../../src';
const toJobs       = '../../../jobs/models';
const toProvider   = '../../../provider/models';

// ── models (pure Mongoose) ────────────────────────────────────────────────────
console.log('\n── models');
['CalendarAvailability', 'RescheduleRequest', 'SchedulingSuggestion'].forEach(m => {
  migrate(
    path.join(SRC, `models/${m}.js`),
    path.join(FEATURE, `models/${m}.js`)
  );
});

// ── controllers ───────────────────────────────────────────────────────────────
console.log('\n── controllers');
migrate(
  path.join(SRC, 'controllers/schedulingController.js'),
  path.join(FEATURE, 'controllers/schedulingController.js'),
  [
    ["require('../../services/schedulingService')",         "require('../../services/schedulingService')"],
    ["require('../../models/JobRankingScore')",              `require('${toJobs}/JobRankingScore')`],
    ["require('../../models/SchedulingSuggestion')",         "require('../../models/SchedulingSuggestion')"],
    ["require('../../config/logger')",                      `require('${toSrc}/config/logger')`],
    ["require('../../utils/controllerValidation')",         `require('${toSrc}/utils/controllerValidation')`],
    ["require('../../utils/responseHelper')",               `require('${toSrc}/utils/responseHelper')`],
  ]
);
migrate(
  path.join(SRC, 'controllers/availabilityController.js'),
  path.join(FEATURE, 'controllers/availabilityController.js'),
  [
    ["require('../../services/availabilityService')",       "require('../../services/availabilityService')"],
    ["require('../../models/CalendarAvailability')",         "require('../../models/CalendarAvailability')"],
    ["require('../../models/JobSchedule')",                  `require('${toJobs}/JobSchedule')`],
    ["require('../../models/RescheduleRequest')",            "require('../../models/RescheduleRequest')"],
    ["require('../../config/logger')",                      `require('${toSrc}/config/logger')`],
    ["require('../../utils/controllerValidation')",         `require('${toSrc}/utils/controllerValidation')`],
    ["require('../../utils/responseHelper')",               `require('${toSrc}/utils/responseHelper')`],
  ]
);

// ── routes ────────────────────────────────────────────────────────────────────
console.log('\n── routes');
migrate(
  path.join(SRC, 'routes/scheduling.js'),
  path.join(FEATURE, 'routes/scheduling.js'),
  [
    ["require('../../middleware/auth')",                    `require('${toSrc}/middleware/auth')`],
    ["require('../../controllers/schedulingController')",   "require('../../controllers/schedulingController')"],
  ]
);
migrate(
  path.join(SRC, 'routes/availability.js'),
  path.join(FEATURE, 'routes/availability.js'),
  [
    ["require('../../middleware/auth')",                    `require('${toSrc}/middleware/auth')`],
    ["require('../../controllers/availabilityController')", "require('../../controllers/availabilityController')"],
  ]
);

// ── services ──────────────────────────────────────────────────────────────────
console.log('\n── services');
migrate(
  path.join(SRC, 'services/schedulingService.js'),
  path.join(FEATURE, 'services/schedulingService.js'),
  [
    ["require('../../models/JobRankingScore')",                        `require('${toJobs}/JobRankingScore')`],
    ["require('../../models/SchedulingSuggestion')",                   "require('../../models/SchedulingSuggestion')"],
    ["require('../../models/Job')",                                    `require('${toJobs}/Job')`],
    ["require('../../../features/provider/models/Provider')",          `require('${toProvider}/Provider')`],
    ["require('../../../features/provider/models/ProviderPerformance')", `require('${toProvider}/ProviderPerformance')`],
    ["require('../../../features/provider/models/ProviderProfessionalInfo')", `require('${toProvider}/ProviderProfessionalInfo')`],
    ["require('../../../features/provider/models/ProviderPreferences')", `require('${toProvider}/ProviderPreferences')`],
    ["require('../../models/JobSchedule')",                            `require('${toJobs}/JobSchedule')`],
    ["require('../../models/CalendarAvailability')",                   "require('../../models/CalendarAvailability')"],
    ["require('./googleMapsService')",                              `require('${toSrc}/services/googleMapsService')`],
    ["require('../../config/logger')",                                 `require('${toSrc}/config/logger')`],
    ["require('../../models/User')",                                   `require('${toSrc}/models/User')`],
  ]
);
migrate(
  path.join(SRC, 'services/availabilityService.js'),
  path.join(FEATURE, 'services/availabilityService.js'),
  [
    ["require('../../models/CalendarAvailability')",  "require('../../models/CalendarAvailability')"],
    ["require('../../models/JobSchedule')",            `require('${toJobs}/JobSchedule')`],
    ["require('../../models/RescheduleRequest')",      "require('../../models/RescheduleRequest')"],
    ["require('./notificationService')",           `require('${toSrc}/services/notificationService')`],
    ["require('../../config/logger')",                `require('${toSrc}/config/logger')`],
  ]
);
migrate(
  path.join(SRC, 'services/automatedSchedulingService.js'),
  path.join(FEATURE, 'services/automatedSchedulingService.js'),
  [
    ["require('../../models/JobRankingScore')",       `require('${toJobs}/JobRankingScore')`],
    ["require('../../models/SchedulingSuggestion')",  "require('../../models/SchedulingSuggestion')"],
    ["require('../../config/logger')",               `require('${toSrc}/config/logger')`],
  ]
);
migrate(
  path.join(SRC, 'services/automatedAvailabilityService.js'),
  path.join(FEATURE, 'services/automatedAvailabilityService.js'),
  [
    ["require('./availabilityService')",  "require('./availabilityService')"],
    ["require('../../config/logger')",      `require('${toSrc}/config/logger')`],
  ]
);
migrate(
  path.join(SRC, 'services/automatedBookingService.js'),
  path.join(FEATURE, 'services/automatedBookingService.js'),
  [
    ["require('../../models/Marketplace')",    `require('${toSrc}/models/Marketplace')`],
    ["require('./notificationService')",   `require('${toSrc}/services/notificationService')`],
    ["require('./emailService')",          `require('${toSrc}/services/emailService')`],
    ["require('../../config/logger')",        `require('${toSrc}/config/logger')`],
    ["require('../../models/User')",          `require('${toSrc}/models/User')`],
  ]
);
migrate(
  path.join(SRC, 'services/automatedMarketplaceBookingFollowUpService.js'),
  path.join(FEATURE, 'services/automatedMarketplaceBookingFollowUpService.js'),
  [
    ["require('../../models/Marketplace')",    `require('${toSrc}/models/Marketplace')`],
    ["require('./notificationService')",   `require('${toSrc}/services/notificationService')`],
    ["require('../../models/Communication')", `require('${toSrc}/models/Communication')`],
    ["require('../../config/logger')",        `require('${toSrc}/config/logger')`],
  ]
);

// ── stubs in src/ ─────────────────────────────────────────────────────────────
console.log('\n── stubs');
const stubs = [
  ['models/CalendarAvailability',                           'scheduling/models/CalendarAvailability'],
  ['models/RescheduleRequest',                              'scheduling/models/RescheduleRequest'],
  ['models/SchedulingSuggestion',                           'scheduling/models/SchedulingSuggestion'],
  ['controllers/schedulingController',                      'scheduling/controllers/schedulingController'],
  ['controllers/availabilityController',                    'scheduling/controllers/availabilityController'],
  ['routes/scheduling',                                     'scheduling/routes/scheduling'],
  ['routes/availability',                                   'scheduling/routes/availability'],
  ['services/schedulingService',                            'scheduling/services/schedulingService'],
  ['services/availabilityService',                          'scheduling/services/availabilityService'],
  ['services/automatedSchedulingService',                   'scheduling/services/automatedSchedulingService'],
  ['services/automatedAvailabilityService',                 'scheduling/services/automatedAvailabilityService'],
  ['services/automatedBookingService',                      'scheduling/services/automatedBookingService'],
  ['services/automatedMarketplaceBookingFollowUpService',   'scheduling/services/automatedMarketplaceBookingFollowUpService'],
];
for (const [rel, feat] of stubs) {
  stub(path.join(SRC, `${rel}.js`), `../../features/${feat}`);
}

// ── update features/scheduling/index.js ──────────────────────────────────────
console.log('\n── index.js');
const indexContent = `/**
 * Scheduling Feature Module
 *
 * Public API for the Scheduling & Availability domain.
 * All external code must import from this index — not from internal files directly.
 *
 * Internal structure:
 *   models/      — CalendarAvailability, RescheduleRequest, SchedulingSuggestion
 *   controllers/ — schedulingController, availabilityController
 *   routes/      — scheduling, availability
 *   services/    — schedulingService, availabilityService,
 *                  automatedSchedulingService, automatedAvailabilityService,
 *                  automatedBookingService, automatedMarketplaceBookingFollowUpService
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth
 * - src/models/User, Marketplace, Communication
 * - src/services/notificationService, emailService, googleMapsService, cloudinaryService
 * - src/config/logger, src/utils/responseHelper, src/utils/controllerValidation
 *
 * Cross-feature dependencies:
 * - features/jobs     → Job, JobRankingScore, JobSchedule
 * - features/provider → Provider, ProviderPerformance, ProviderProfessionalInfo, ProviderPreferences
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes             = require('./routes/scheduling');
const availabilityRoutes = require('./routes/availability');

// ── Models (internal) ────────────────────────────────────────────────────────
const CalendarAvailability = require('./models/CalendarAvailability');
const RescheduleRequest    = require('./models/RescheduleRequest');
const SchedulingSuggestion = require('./models/SchedulingSuggestion');

// ── Services (internal) ──────────────────────────────────────────────────────
const schedulingService                            = require('./services/schedulingService');
const availabilityService                          = require('./services/availabilityService');
const automatedSchedulingService                   = require('./services/automatedSchedulingService');
const automatedAvailabilityService                 = require('./services/automatedAvailabilityService');
const automatedBookingService                      = require('./services/automatedBookingService');
const automatedMarketplaceBookingFollowUpService   = require('./services/automatedMarketplaceBookingFollowUpService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  availabilityRoutes,

  // Models
  CalendarAvailability,
  RescheduleRequest,
  SchedulingSuggestion,

  // Services
  schedulingService,
  availabilityService,
  automatedSchedulingService,
  automatedAvailabilityService,
  automatedBookingService,
  automatedMarketplaceBookingFollowUpService,
};
`;
write(path.join(FEATURE, 'index.js'), indexContent);
console.log('  ✓  features/scheduling/index.js');

console.log('\n✅  scheduling migration complete\n');
