'use strict';
// 실제 IndexedDB 거래가 주문 전제이므로 브라우저가 없으면 검사를 통과한 것으로 처리하지 않는다.
(async () => {
  const r = await require('./standalone/order-journal-browser.cjs').run();
  for (const x of r) if (!x.ok) console.log('❌ ' + x.name + '\n' + x.error);
  const n = r.filter(x => !x.ok).length;
  console.log(n ? `❌ tORDERCLIENT ${n}개 실패` : `✓ tORDERCLIENT ${r.length}/${r.length} 통과`);
  if (n) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
