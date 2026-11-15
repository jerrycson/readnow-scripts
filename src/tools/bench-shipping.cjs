'use strict';
// Synthetic data only. A calculation microbenchmark, not a page-load claim.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
function run() {
  const app = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf8');
  const source = app.slice(app.indexOf('function osMatchCause('), app.indexOf('/* 보류 장부('));
  const before = source.replace('!carrySet.has(o)', '!carry.includes(o)').replace('!holdSet.has(o)', '!hold.includes(o)').replace('const carrySet = new Set(carry); ', '').replace('const holdSet = new Set(hold); ', '');
  const a = { S: { os: { bl: { holds: {} } } } }, b = { S: { os: { bl: { holds: {} } } } };
  vm.runInNewContext(before, a); vm.runInNewContext(source, b);
  const sample = n => ({ M: { byOrder: Array.from({ length: n }, (_, i) => ({ orderNo: 'O' + i, status: 'none' })) }, B: { al: Array.from({ length: n }, (_, i) => 'O' + i), alps: { holdItems: Array.from({ length: Math.floor(n / 2) }, (_, i) => ({ ono: 'O' + i, box: 'B' + i })) } } });
  const stats = (fn, M, B) => { for (let i = 0; i < 5; i++) fn(M, B); const t = []; for (let i = 0; i < 31; i++) { const start = performance.now(); fn(M, B); t.push(performance.now() - start); } t.sort((a, b) => a - b); return { medianMs: t[15], p95Ms: t[29] }; };
  return [100, 1000, 5000].map(n => { const { M, B } = sample(n); assert.equal(JSON.stringify(a.osMatchCause(M, B)), JSON.stringify(b.osMatchCause(M, B))); return { orders: n, runs: 31, before: stats(a.osMatchCause, M, B), after: stats(b.osMatchCause, M, B) }; });
}
module.exports = { run };
if (require.main === module) console.log(JSON.stringify({ node: process.version, results: run() }, null, 2));
