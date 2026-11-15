'use strict';
require('./standalone/lifecycle.test.cjs').run().then(results => {
  for (const r of results) console.log((r.ok ? '✓ ' : '❌ ') + r.name + (r.error ? '\n' + r.error : ''));
  if (results.some(r => !r.ok)) process.exitCode = 1;
}).catch(e => { console.error(e); process.exitCode = 1; });
