/**
 * Migration script: finance src/ → features/finance/
 * Run once from repo root: node scripts/migrate-finance-feature.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SRC  = path.join(ROOT, 'src');
const FEAT = path.join(ROOT, 'features', 'finance');

// ── 1. Create directories ─────────────────────────────────────────────────────
const dirs = ['models','controllers','routes','services','__tests__'];
dirs.forEach(d => fs.mkdirSync(path.join(FEAT, d), { recursive: true }));
console.log('✓ directories created');

// ── helpers ───────────────────────────────────────────────────────────────────
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, content) { fs.writeFileSync(p, content, 'utf8'); }

/**
 * Apply a list of [from, to] string replacements to source text.
 * Each pair does a global replace.
 */
function applyReplacements(src, replacements) {
  return replacements.reduce((text, [from, to]) => {
    // escape regex special chars in `from`
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'g'), to);
  }, src);
}

// ── 2. Models — pure Mongoose, copy verbatim ─────────────────────────────────
const models = [
  'Finance','Payout','Invoice','Quote','QuoteTemplate',
  'Escrow','EscrowTransaction','UserWallet','WalletTransaction',
  'Referral','UserReferral',
];
models.forEach(m => {
  write(
    path.join(FEAT, 'models', `${m}.js`),
    read(path.join(SRC, 'models', `${m}.js`))
  );
  console.log(`  model: ${m}.js`);
});
console.log('✓ models copied');

// ── 3. Shared-path replacement tables ────────────────────────────────────────
//
// From any file inside features/finance/<subdir>/ the depth to src/ is ../../../
// The finance-owned models stay as ../models/X
// All shared src/ models/services get the full ../../../src/ prefix

// Models that live in features/finance/models/ (no path change needed for
// require('../../models/X') since ../models from the subdir IS the right location)
const OWNED_MODELS = new Set(models);

// Shared src/models that callers reference as require('../../models/X')
const SHARED_MODELS = ['User','Marketplace','LocalProPlus','Communication','Job','Activity'];

// Shared src/services that callers reference as require('../../services/X') or require('./X')
const SHARED_SERVICES = [
  'emailService','notificationService','cloudinaryService','webhookService',
  'paymongoService','paymayaService','paypalService','paypalSubscriptionService',
  'aiService','googleMapsService','twilioService',
];

// Build standard replacement lists for controllers and routes (require('../../X'))
function ctrlRouteReplacements() {
  const r = [];
  // shared models: ../models/X  →  ../../../src/models/X
  SHARED_MODELS.forEach(m => r.push([`require('../../models/${m}')`, `require('../../../../src/models/${m}')`]));
  // shared services: ../services/X  →  ../../../src/services/X
  SHARED_SERVICES.forEach(s => r.push([`require('../../services/${s}')`, `require('../../../../src/services/${s}')`]));
  // infra
  r.push([`require('../../middleware/auth')`,       `require('../../../../src/middleware/auth')`]);
  r.push([`require('../../middleware/rateLimiter')`, `require('../../../../src/middleware/rateLimiter')`]);
  r.push([`require('../../config/logger')`,          `require('../../../../src/config/logger')`]);
  r.push([`require('../../utils/logger')`,           `require('../../../../src/utils/logger')`]);
  r.push([`require('../../utils/controllerValidation')`, `require('../../../../src/utils/controllerValidation')`]);
  r.push([`require('../../utils/responseHelper')`,   `require('../../../../src/utils/responseHelper')`]);
  r.push([`require('../../utils/objectIdUtils')`,    `require('../../../../src/utils/objectIdUtils')`]);
  // cross-feature
  r.push([`require('../../../features/supplies')`, `require('../../../supplies')`]);
  return r;
}

// For services (same logic but `./X` style instead of `../services/X`)
function serviceReplacements() {
  const r = [];
  // shared models
  SHARED_MODELS.forEach(m => r.push([`require('../../models/${m}')`, `require('../../../../src/models/${m}')`]));
  // shared services referenced as ./X
  SHARED_SERVICES.forEach(s => r.push([`require('./${s}')`, `require('../../../../src/services/${s}')`]));
  // also handle ../services/X style (some services use it)
  SHARED_SERVICES.forEach(s => r.push([`require('../../services/${s}')`, `require('../../../../src/services/${s}')`]));
  // infra
  r.push([`require('../../config/logger')`,   `require('../../../../src/config/logger')`]);
  r.push([`require('../../utils/logger')`,    `require('../../../../src/utils/logger')`]);
  r.push([`require('../../utils/responseHelper')`, `require('../../../../src/utils/responseHelper')`]);
  r.push([`require('../../../features/supplies')`, `require('../../../supplies')`]);
  return r;
}

// ── 4. Controllers ────────────────────────────────────────────────────────────
const controllers = [
  'escrowController','financeController','paymayaController',
  'paypalController','quoteInvoiceController','referralController',
];
const ctrlRepls = ctrlRouteReplacements();
controllers.forEach(c => {
  const src = read(path.join(SRC, 'controllers', `${c}.js`));
  write(path.join(FEAT, 'controllers', `${c}.js`), applyReplacements(src, ctrlRepls));
  console.log(`  controller: ${c}.js`);
});
console.log('✓ controllers done');

// ── 5. Routes ─────────────────────────────────────────────────────────────────
const routes = [
  'finance','wallet','escrows','escrowWebhooks',
  'quotesInvoices','referrals','paymongo','paymaya','paypal',
];
// escrowWebhooks and paymongo need escrowService from same feature dir
// The ctrlRouteReplacements table already handles shared services; 
// finance-owned services referenced as ../services/X stay unchanged.
const routeRepls = ctrlRouteReplacements();
routes.forEach(r => {
  const src = read(path.join(SRC, 'routes', `${r}.js`));
  write(path.join(FEAT, 'routes', `${r}.js`), applyReplacements(src, routeRepls));
  console.log(`  route: ${r}.js`);
});
console.log('✓ routes done');

// ── 6. Services ───────────────────────────────────────────────────────────────
const services = [
  'escrowService','referralService','quoteInvoiceService',
  'automatedEscrowService','automatedEscrowDisputeEscalationService',
  'automatedFinanceReminderService','automatedReferralTierMilestoneService',
  'automatedPaymentSyncService','automatedSubscriptionService',
];
const svcRepls = serviceReplacements();
services.forEach(s => {
  const srcFile = path.join(SRC, 'services', `${s}.js`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`  SKIP (not found): ${s}.js`);
    return;
  }
  write(path.join(FEAT, 'services', `${s}.js`), applyReplacements(read(srcFile), svcRepls));
  console.log(`  service: ${s}.js`);
});
console.log('✓ services done');

// ── 7. Middleware — referralProcessor ────────────────────────────────────────
// referralProcessor lives in src/middleware/ but belongs to finance domain;
// copy it to features/finance/services/ for colocation.
const rpSrc = path.join(SRC, 'middleware', 'referralProcessor.js');
if (fs.existsSync(rpSrc)) {
  let content = read(rpSrc);
  // same replacements as services
  content = applyReplacements(content, svcRepls);
  write(path.join(FEAT, 'services', 'referralProcessor.js'), content);
  console.log('  service: referralProcessor.js (from middleware)');
}

console.log('\n✅ Migration complete — files written to features/finance/');
console.log('Next steps:');
console.log('  1. Update features/finance/index.js to point to ./models, ./routes, ./services');
console.log('  2. Stub or delete src/ originals');
console.log('  3. Run: node -e "require(\'./features/finance\')"');
