'use strict';
// 서버 인증·최신 고객 주문 복구를 합쳐 검사한다. 계정이 바뀐 앞선 주문을 비회원으로 접수하면 배포를 막는다.
require('./standalone/account-auth-browser.cjs').run().then(results=>{
  for(const r of results)if(!r.ok)console.error('❌ '+r.name+'\n'+r.error);
  const bad=results.filter(r=>!r.ok).length;
  console.log(bad?'❌ tACCOUNTAUTHUI '+bad+'개 실패':'✓ tACCOUNTAUTHUI '+results.length+'/'+results.length+' 통과');
  if(bad)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
