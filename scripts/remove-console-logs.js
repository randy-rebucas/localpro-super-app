const fs = require('fs');
const path = require('path');
const base = process.cwd();
const files = [
  'features/communication/controllers/communicationController.js',
  'features/jobs/controllers/jobController.js',
  'features/localproPlus/controllers/localproPlusController.js',
];
const consolePat = /^\s*console\.(log|warn|error)\s*\(/;
for (const rel of files) {
  const f = path.join(base, rel);
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const filtered = [];
  for (const line of lines) {
    if (!consolePat.test(line)) filtered.push(line);
  }
  if (filtered.length < lines.length) {
    fs.writeFileSync(f, filtered.join('\n'), 'utf8');
    console.log('FIXED ' + rel + ' (-' + (lines.length - filtered.length) + ' lines)');
  } else {
    console.log('SKIP ' + rel);
  }
}
