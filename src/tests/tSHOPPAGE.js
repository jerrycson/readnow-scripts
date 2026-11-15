// 배포 게이트의 공개 화면 시험. RN_PORT가 있는 통합 환경에서는 실제 브라우저 경합도 검사한다.
'use strict';
const path = require('node:path');
(async () => {
  const r = await require('./standalone/shop-page.test.cjs').run({ root: path.resolve(__dirname, '../..') });
  r.push(...await require('./standalone/token-store.test.cjs').run({ root: path.resolve(__dirname, '../..') }));
  if (process.env.RN_PORT || process.env.RN_SHOP_UI) r.push(...await require('./standalone/shop-page-browser.cjs').run());
  for (const x of r) console.log((x.ok ? '✓ ' : '❌ ') + x.name + (x.error ? '\n' + x.error : ''));
  const n = r.filter(x => !x.ok).length; console.log(n ? `❌ tSHOPPAGE ${n}개 실패` : `✓ tSHOPPAGE ${r.length}/${r.length} 통과`); if (n) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
