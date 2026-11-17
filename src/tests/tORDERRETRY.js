'use strict';
require('./standalone/order-attempt.test.cjs').run().then(results => {
  for (const r of results) console.log((r.ok ? '✓ ' : '❌ ') + r.name + (r.error ? '\n' + r.error : ''));
  const bad = results.filter(r => !r.ok).length; console.log(bad ? '❌ tORDERRETRY ' + bad + '개 실패' : '✓ tORDERRETRY ' + results.length + '/' + results.length + ' 통과'); if (bad) process.exitCode = 1;
}).catch(e => { console.error(e); process.exitCode = 1; });
