/**
 * Migration script: jobs src/ → features/jobs/
 * Run once from repo root: node scripts/migrate-jobs-feature.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const FEAT = path.join(ROOT, 'features', 'jobs');

// ── 1. Create directories ─────────────────────────────────────────────────────
['models','controllers','routes','services','__tests__'].forEach(d =>
  fs.mkdirSync(path.join(FEAT, d), { recursive: true }));
console.log('✓ directories created');

function read(p)           { return fs.readFileSync(p, 'utf8'); }
function write(p, content) { fs.writeFileSync(p, content, 'utf8'); }

function applyReplacements(src, replacements) {
  return replacements.reduce((text, [from, to]) => {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'g'), to);
  }, src);
}

// ── 2. Models — pure Mongoose, copy verbatim ─────────────────────────────────
['Job','JobCategory','JobIssue','JobProgress','JobProof','JobRankingScore','JobSchedule'].forEach(m => {
  write(path.join(FEAT, 'models', `${m}.js`), read(path.join(SRC, 'models', `${m}.js`)));
  console.log(`  model: ${m}.js`);
});
console.log('✓ models copied');

// ── 3. Replacement tables ─────────────────────────────────────────────────────
// Own job models — require('../models/X') paths stay as-is inside features/jobs/controllers|routes|services
// Shared src/ models that need →  ../../../src/models/X
const SHARED_MODELS = ['User','TaskChecklist','Communication','UserSettings','Provider','Marketplace'];

// Shared src/ services referenced as ../services/X
const SHARED_SERVICES_REL = [
  'cloudinaryService','emailService','googleMapsService','notificationService',
  'availabilityService','paymongoService','twilioService',
];

// Shared src/ services referenced as ./X (from inside src/services/)
const SHARED_SERVICES_DOT = [...SHARED_SERVICES_REL];

function ctrlRouteRepls() {
  const r = [];
  SHARED_MODELS.forEach(m => r.push([`require('../models/${m}')`, `require('../../../src/models/${m}')`]));
  SHARED_SERVICES_REL.forEach(s => r.push([`require('../services/${s}')`, `require('../../../src/services/${s}')`]));
  r.push([`require('../middleware/auth')`,          `require('../../../src/middleware/auth')`]);
  r.push([`require('../middleware/rateLimiter')`,   `require('../../../src/middleware/rateLimiter')`]);
  r.push([`require('../middleware/routeValidation')`, `require('../../../src/middleware/routeValidation')`]);
  r.push([`require('../config/logger')`,            `require('../../../src/config/logger')`]);
  r.push([`require('../config/cloudinary')`,        `require('../../../src/config/cloudinary')`]);
  r.push([`require('../utils/controllerValidation')`, `require('../../../src/utils/controllerValidation')`]);
  r.push([`require('../utils/responseHelper')`,     `require('../../../src/utils/responseHelper')`]);
  r.push([`require('../utils/objectIdUtils')`,      `require('../../../src/utils/objectIdUtils')`]);
  r.push([`require('../utils/logger')`,             `require('../../../src/utils/logger')`]);
  return r;
}

function serviceRepls() {
  const r = [];
  SHARED_MODELS.forEach(m => r.push([`require('../models/${m}')`, `require('../../../src/models/${m}')`]));
  SHARED_SERVICES_DOT.forEach(s => r.push([`require('./${s}')`, `require('../../../src/services/${s}')`]));
  SHARED_SERVICES_REL.forEach(s => r.push([`require('../services/${s}')`, `require('../../../src/services/${s}')`]));
  r.push([`require('../config/logger')`,  `require('../../../src/config/logger')`]);
  r.push([`require('../utils/logger')`,   `require('../../../src/utils/logger')`]);
  r.push([`require('../utils/responseHelper')`, `require('../../../src/utils/responseHelper')`]);
  // cross-feature provider refs that used full features/ prefix
  r.push([`require('../../features/provider/`, `require('../../provider/`]);
  return r;
}

// ── 4. Controllers ────────────────────────────────────────────────────────────
const ctrlR = ctrlRouteRepls();
['jobController','jobCategoryController','jobWorkflowController'].forEach(c => {
  write(path.join(FEAT,'controllers',`${c}.js`), applyReplacements(read(path.join(SRC,'controllers',`${c}.js`)), ctrlR));
  console.log(`  controller: ${c}.js`);
});
console.log('✓ controllers done');

// ── 5. Routes ─────────────────────────────────────────────────────────────────
['jobs','jobCategories','jobWorkflow'].forEach(r => {
  write(path.join(FEAT,'routes',`${r}.js`), applyReplacements(read(path.join(SRC,'routes',`${r}.js`)), ctrlR));
  console.log(`  route: ${r}.js`);
});
console.log('✓ routes done');

// ── 6. Services ───────────────────────────────────────────────────────────────
const svcR = serviceRepls();
['jobWorkflowService','automatedJobApplicationFollowUpService','automatedJobBoardDigestService'].forEach(s => {
  write(path.join(FEAT,'services',`${s}.js`), applyReplacements(read(path.join(SRC,'services',`${s}.js`)), svcR));
  console.log(`  service: ${s}.js`);
});
console.log('✓ services done');

// ── 7. Update index.js ───────────────────────────────────────────────────────
const indexContent = `/**
 * Jobs Feature Module
 *
 * Public API for the Jobs domain.
 * All external code must import from this index -- not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/middleware/routeValidation
 * - src/models/User, TaskChecklist, Communication, UserSettings
 * - src/services/notificationService, emailService, cloudinaryService, googleMapsService
 * - src/config/cloudinary, logger
 * - src/utils/responseHelper, controllerValidation
 */

// -- Routes -------------------------------------------------------------------
const routes         = require('./routes/jobs');
const categoryRoutes = require('./routes/jobCategories');
const workflowRoutes = require('./routes/jobWorkflow');

// -- Models -------------------------------------------------------------------
const Job             = require('./models/Job');
const JobCategory     = require('./models/JobCategory');
const JobIssue        = require('./models/JobIssue');
const JobProgress     = require('./models/JobProgress');
const JobProof        = require('./models/JobProof');
const JobRankingScore = require('./models/JobRankingScore');
const JobSchedule     = require('./models/JobSchedule');

// -- Services -----------------------------------------------------------------
const jobWorkflowService             = require('./services/jobWorkflowService');
const automatedJobFollowUpService    = require('./services/automatedJobApplicationFollowUpService');
const automatedJobBoardDigestService = require('./services/automatedJobBoardDigestService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  categoryRoutes,
  workflowRoutes,

  // Models
  Job,
  JobCategory,
  JobIssue,
  JobProgress,
  JobProof,
  JobRankingScore,
  JobSchedule,

  // Services
  jobWorkflowService,
  automatedJobFollowUpService,
  automatedJobBoardDigestService,
};
`;
write(path.join(FEAT, 'index.js'), indexContent);
console.log('✓ index.js updated');

// ── 8. Stub src/ originals ────────────────────────────────────────────────────
function stub(srcRelPath, featRelPath) {
  const absFrom = path.join(ROOT, srcRelPath);
  const relTarget = path.relative(path.dirname(absFrom), path.join(ROOT, featRelPath)).replace(/\\/g, '/');
  write(absFrom, `// -- Stub: re-exports from the jobs feature module -----------------------------------\n// Source of truth has moved to ${featRelPath}\nmodule.exports = require('${relTarget}');\n`);
  console.log(`  stub: ${srcRelPath}`);
}

['Job','JobCategory','JobIssue','JobProgress','JobProof','JobRankingScore','JobSchedule'].forEach(m =>
  stub(`src/models/${m}.js`, `features/jobs/models/${m}.js`));
['jobController','jobCategoryController','jobWorkflowController'].forEach(c =>
  stub(`src/controllers/${c}.js`, `features/jobs/controllers/${c}.js`));
['jobs','jobCategories','jobWorkflow'].forEach(r =>
  stub(`src/routes/${r}.js`, `features/jobs/routes/${r}.js`));
['jobWorkflowService','automatedJobApplicationFollowUpService','automatedJobBoardDigestService'].forEach(s =>
  stub(`src/services/${s}.js`, `features/jobs/services/${s}.js`));
console.log('✓ stubs created');

console.log('\n✅ Jobs migration complete');
