// 고객 정보·운영 연결 없는 서가 화면 전환 회귀 시험. 배포 게이트도 같은 함수를 실행한다.
'use strict';
const path = require('node:path');
require('./standalone/shelf.test.cjs').run({ root: path.resolve(__dirname, '../..') }).then(r => {
  for (const x of r) console.log((x.ok ? '✓ ' : '❌ ') + x.name + (x.error ? '\n' + x.error : ''));
  const n = r.filter(x => !x.ok).length;
  console.log(n ? `❌ tSHELFLIFE ${n}개 실패` : `✓ tSHELFLIFE ${r.length}/${r.length} 통과`);
  if (n) process.exitCode = 1;
}).catch(e => { console.error(e); process.exitCode = 1; });
