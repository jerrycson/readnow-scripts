'use strict';
// 서버 요청 계약과 고객 복구 화면을 함께 적용해야 한다. 의존 파일이 없으면 배포 검사를 실패시킨다.
require('./standalone/order-contract-browser.cjs').run().then(results => {
  for (const r of results) if (!r.ok) console.error('❌ ' + r.name + '\n' + r.error);
  const bad=results.filter(r=>!r.ok).length;
  console.log(bad ? `❌ tORDERINTEGRATED ${bad}개 실패` : `✓ tORDERINTEGRATED ${results.length}/${results.length} 통과`);
  if(bad)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
