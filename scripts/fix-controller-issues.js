#!/usr/bin/env node
'use strict';

/**
 * Fix controller security and logging issues:
 * 1. Add logger import to controllers that lack it
 * 2. Replace console.error|warn|log with logger calls or remove debug logs
 * 3. Fix bare error.message in HTTP 500 responses
 */

const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');
const LOGGER_IMPORT = "const { logger } = require('../../../src/utils/logger');";
const LOGGER_IMPORT_CONFIG = "const logger = require('../../../src/config/logger');";

// All controller dirs + auth/ai (previously hardened but still have issues)
const controllerDirs = [
  { dir: 'features/academy/controllers',      loggerStyle: 'utils' },
  { dir: 'features/ads/controllers',          loggerStyle: 'utils' },
  { dir: 'features/agencies/controllers',     loggerStyle: 'utils' },
  { dir: 'features/feeds/controllers',        loggerStyle: 'utils' },
  { dir: 'features/finance/controllers',      loggerStyle: 'utils' },
  { dir: 'features/jobs/controllers',         loggerStyle: 'utils' },
  { dir: 'features/activities/controllers',   loggerStyle: 'utils' },
  { dir: 'features/communication/controllers',loggerStyle: 'utils' },
  { dir: 'features/analytics/controllers',    loggerStyle: 'utils' },
  { dir: 'features/maps/controllers',         loggerStyle: 'utils' },
  { dir: 'features/support/controllers',      loggerStyle: 'utils' },
  { dir: 'features/localproPlus/controllers', loggerStyle: 'utils' },
  { dir: 'features/favorites/controllers',    loggerStyle: 'utils' },
  { dir: 'features/staff/controllers',        loggerStyle: 'utils' },
  { dir: 'features/permissions/controllers',  loggerStyle: 'utils' },
  { dir: 'features/webhooks/controllers',     loggerStyle: 'utils' },
  { dir: 'features/announcements/controllers',loggerStyle: 'utils' },
  { dir: 'features/apiKeys/controllers',      loggerStyle: 'utils' },
  { dir: 'features/maskedCalls/controllers',  loggerStyle: 'utils' },
  { dir: 'features/geofenceEvents/controllers',loggerStyle: 'utils' },
  { dir: 'features/gpsLogs/controllers',      loggerStyle: 'utils' },
  { dir: 'features/timeEntries/controllers',  loggerStyle: 'utils' },
  { dir: 'features/corsOrigins/controllers',  loggerStyle: 'utils' },
  { dir: 'features/facilityCare/controllers', loggerStyle: 'utils' },
  { dir: 'features/emailMarketing/controllers',loggerStyle: 'utils' },
  // Previously hardened but still have remaining issues
  { dir: 'features/auth/controllers',         loggerStyle: 'config' },
  { dir: 'features/ai/controllers',           loggerStyle: 'config' },
];

let totalFixed = 0;

for (const { dir, loggerStyle } of controllerDirs) {
  const fullDir = path.join(base, dir);
  if (!fs.existsSync(fullDir)) continue;

  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(fullDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const fixes = [];

    // 1. Add logger import if missing
    const hasLogger = /require.*logger.*|const logger\s*=/.test(content);
    if (!hasLogger && (content.includes('console.error') || content.includes('console.log') || content.includes('console.warn'))) {
      const importLine = loggerStyle === 'config' ? LOGGER_IMPORT_CONFIG : LOGGER_IMPORT;
      content = content.replace(/^(const .+ = require\([^)]+\);)/m, (m) => m + '\n' + importLine);
      fixes.push('added logger import');
      changed = true;
    }

    // 2a. Replace console.error('msg', error); single-line in catch blocks
    // Pattern: console.error('string', error);
    const errReplaced = [];
    content = content.replace(
      /console\.error\(('([^']+)'), error\);/g,
      (m, q, msg) => {
        errReplaced.push(msg);
        return `logger.error('${msg}', { error: error.message, stack: error.stack });`;
      }
    );
    if (errReplaced.length) { fixes.push(`console.error→logger.error (${errReplaced.length})`); changed = true; }

    // 2b. Replace console.error with template-literal message
    content = content.replace(
      /console\.error\(`([^`]+)`, error\);/g,
      (m, msg) => {
        changed = true;
        return `logger.error(\`${msg}\`, { error: error.message, stack: error.stack });`;
      }
    );

    // 2c. Replace console.error in .catch(err => console.error(..., err))
    content = content.replace(
      /\.catch\(err => console\.error\('([^']+)', err\)\)/g,
      (m, msg) => {
        changed = true;
        return `.catch(err => logger.error('${msg}', { error: err.message }))`;
      }
    );

    // 2d. Replace console.error with second non-error argument
    content = content.replace(
      /console\.error\('([^']+)', ([^)]+)\);/g,
      (m, msg, arg) => {
        // Don't double-replace already fixed lines
        if (m.includes('logger.')) return m;
        changed = true;
        return `logger.error('${msg}', { details: ${arg} });`;
      }
    );

    // 2e. Replace console.warn with logger.warn
    content = content.replace(
      /console\.warn\('([^']+)', ([^)]+)\);/g,
      (m, msg, arg) => {
        changed = true;
        return `logger.warn('${msg}', { details: ${arg} });`;
      }
    );

    // 2f. Remove console.log lines (debug logging)
    const logLines = [];
    content = content.replace(/^[ \t]*console\.log\([^)]*\);[ \t]*\n/gm, (m) => {
      logLines.push(m.trim().substring(0, 60));
      return '';
    });
    if (logLines.length) { fixes.push(`removed ${logLines.length} console.log`); changed = true; }

    // 3. Fix bare error.message in HTTP 500 responses (no NODE_ENV gating)
    // 3a. Inline: res.json({ ..., error: error.message }) → remove the field
    content = content.replace(/,\s*error:\s*error\.message\s*(?=\})/g, () => { changed = true; return ''; });

    // 3b. Multi-line: standalone "error: error.message," line → remove
    content = content.replace(/^[ \t]+error:\s*error\.message,?\s*\n/gm, () => { changed = true; return ''; });

    // 3c. message: error.message || 'fallback'  →  message: 'fallback'
    content = content.replace(
      /message:\s*error\.message\s*\|\|\s*'([^']+)'/g,
      (m, fallback) => { changed = true; return `message: '${fallback}'`; }
    );

    // 3d. message: error.message (bare, no fallback) → message: 'Server error'
    content = content.replace(
      /([,{]\s*)message:\s*error\.message([,}])/g,
      (m, before, after) => { changed = true; return `${before}message: 'Server error'${after}`; }
    );

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`FIXED: ${path.relative(base, filePath)} [${fixes.join(', ')}]`);
      totalFixed++;
    } else {
      console.log(`SKIP:  ${path.relative(base, filePath)}`);
    }
  }
}

console.log(`\nTotal files modified: ${totalFixed}`);
