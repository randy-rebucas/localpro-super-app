/* eslint-disable no-console */
/**
 * Notification audit script
 *
 * Scans the repository for notification "type" usage and compares it with:
 * - Communication Notification enum (src/models/Communication.js)
 * - NotificationService NOTIFICATION_TYPE_MAP keys (src/services/notificationService.js)
 *
 * Usage:
 *   node scripts/audit-notifications.js
 */

const fs = require('fs');
const path = require('path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, results);
    else results.push(p);
  }
  return results;
}

function extractTypeLiteralsFromSource(source) {
  const types = new Set();
  // Only consider NotificationService.sendNotification({ type: '...' }) usage to avoid
  // collecting unrelated "type" fields (mime types, model enums, etc.).
  const callRe = /sendNotification\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  let callMatch;
  while ((callMatch = callRe.exec(source))) {
    const body = callMatch[1];
    const typeRe = /\btype\s*:\s*'([^']+)'/g;
    let m;
    while ((m = typeRe.exec(body))) types.add(m[1]);
  }
  return types;
}

function extractNotificationEnumTypes(communicationSource) {
  // Narrow to notificationSchema enum block by finding "notificationSchema" then "enum: ["
  const idx = communicationSource.indexOf('const notificationSchema');
  if (idx === -1) return new Set();
  const tail = communicationSource.slice(idx);
  const enumIdx = tail.indexOf('enum: [');
  if (enumIdx === -1) return new Set();
  const after = tail.slice(enumIdx);
  // Take up to the closing bracket of enum array (first occurrence of "]" that ends enum list)
  const endIdx = after.indexOf('],');
  const block = endIdx === -1 ? after : after.slice(0, endIdx);
  const types = new Set();
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(block))) types.add(m[1]);
  return types;
}

function extractNotificationTypeMapKeys(notificationServiceSource) {
  const idx = notificationServiceSource.indexOf('const NOTIFICATION_TYPE_MAP');
  if (idx === -1) return new Set();
  const tail = notificationServiceSource.slice(idx);
  const startIdx = tail.indexOf('{');
  const endIdx = tail.indexOf('};');
  const block = startIdx === -1 || endIdx === -1 ? tail : tail.slice(startIdx, endIdx);
  const keys = new Set();
  const re = /^\s*([a-zA-Z0-9_]+)\s*:\s*\{/gm;
  let m;
  while ((m = re.exec(block))) keys.add(m[1]);
  return keys;
}

function main() {
  const repoRoot = process.cwd();
  const srcDir = path.join(repoRoot, 'src');
  const communicationPath = path.join(srcDir, 'models', 'Communication.js');
  const notificationServicePath = path.join(srcDir, 'services', 'notificationService.js');

  const jsFiles = walk(srcDir).filter(p => p.endsWith('.js'));
  const usedTypes = new Set();

  for (const f of jsFiles) {
    const content = read(f);
    for (const t of extractTypeLiteralsFromSource(content)) usedTypes.add(t);
  }

  const communicationSource = read(communicationPath);
  const enumTypes = extractNotificationEnumTypes(communicationSource);

  const notificationServiceSource = read(notificationServicePath);
  const mapKeys = extractNotificationTypeMapKeys(notificationServiceSource);

  // Compute diffs
  const usedNotInEnum = [...usedTypes].filter(t => !enumTypes.has(t)).sort();
  const usedNotInMap = [...usedTypes].filter(t => !mapKeys.has(t)).sort();
  const enumNotInMap = [...enumTypes].filter(t => !mapKeys.has(t)).sort();

  console.log('=== Notification Audit ===');
  console.log(`Used types found in src/: ${usedTypes.size}`);
  console.log(`Enum types in Communication.Notification: ${enumTypes.size}`);
  console.log(`Keys in NOTIFICATION_TYPE_MAP: ${mapKeys.size}`);
  console.log('');

  if (usedNotInEnum.length) {
    console.log('!! Types used in code but missing from Communication.Notification enum:');
    usedNotInEnum.forEach(t => console.log(`- ${t}`));
    console.log('');
  } else {
    console.log('OK: All used types exist in Communication.Notification enum.');
    console.log('');
  }

  if (usedNotInMap.length) {
    console.log('!! Types used in code but missing from NOTIFICATION_TYPE_MAP (will default to systemUpdates):');
    usedNotInMap.forEach(t => console.log(`- ${t}`));
    console.log('');
  } else {
    console.log('OK: All used types are mapped in NOTIFICATION_TYPE_MAP.');
    console.log('');
  }

  if (enumNotInMap.length) {
    console.log('Note: Enum types not mapped in NOTIFICATION_TYPE_MAP:');
    enumNotInMap.forEach(t => console.log(`- ${t}`));
    console.log('');
  }

  // Exit code: fail if missing enum or mapping for used types
  if (usedNotInEnum.length || usedNotInMap.length) {
    process.exitCode = 1;
  }
}

main();


