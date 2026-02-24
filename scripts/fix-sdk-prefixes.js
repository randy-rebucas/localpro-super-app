#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');

// Fix missing /api/ prefix in 5 SDK files
// Fix both single-quoted '/xxx' and backtick-template '/xxx/ paths
const prefixFixes = [
  ['packages/localpro-sdk/lib/academy.js',    '/academy/',   '/api/academy/'],
  ['packages/localpro-sdk/lib/ads.js',         '/ads/',       '/api/ads/'],
  ['packages/localpro-sdk/lib/agencies.js',    '/agencies/',  '/api/agencies/'],
  ['packages/localpro-sdk/lib/feeds.js',       '/feeds/',     '/api/feeds/'],
  ['packages/localpro-sdk/lib/activities.js',  '/activities/','/api/activities/'],
];

for (const [rel, from, to] of prefixFixes) {
  const f = path.join(base, rel);
  let c = fs.readFileSync(f, 'utf8');
  let count = 0;
  // Replace single-quoted paths: '/academy/ -> '/api/academy/
  const sqFrom = "'" + from;
  const sqTo   = "'/api" + from;
  while (c.includes(sqFrom)) { c = c.split(sqFrom).join(sqTo); count++; }
  // Replace backtick-template paths: `/academy/ -> `/api/academy/
  const btFrom = '`' + from;
  const btTo   = '`/api' + from;
  while (c.includes(btFrom)) { c = c.split(btFrom).join(btTo); count++; }
  fs.writeFileSync(f, c, 'utf8');
  console.log(`PREFIX OK: ${rel} (${count} pass runs)`);
}

// Fix analytics.js double-client bug:
// this.client.client.get('/api/...', { params }).then(r => r.data)
// -> this.client.get('/api/...', params)
const analyticsPath = path.join(base, 'packages/localpro-sdk/lib/analytics.js');
let ac = fs.readFileSync(analyticsPath, 'utf8');

let count = 0;
ac = ac.replace(
  /this\.client\.client\.(get|post|put|delete|patch)\(('[^']+'),\s*\{\s*params\s*\}\)\.then\(r\s*=>\s*r\.data\)/g,
  (m, method, urlArg) => {
    count++;
    return `this.client.${method}(${urlArg}, params)`;
  }
);
// Also handle cases without { params }
ac = ac.replace(
  /this\.client\.client\.(get|post|put|delete|patch)\(('[^']+')\)\.then\(r\s*=>\s*r\.data\)/g,
  (m, method, urlArg) => {
    count++;
    return `this.client.${method}(${urlArg})`;
  }
);

fs.writeFileSync(analyticsPath, ac, 'utf8');
console.log(`ANALYTICS OK: double-client fixed (${count} replacements)`);
