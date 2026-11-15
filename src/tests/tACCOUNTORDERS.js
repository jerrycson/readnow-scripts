'use strict';
(async()=>{
  const results=await require('./standalone/account-orders.test.cjs').run();
  if(process.env.RN_PORT||process.env.RN_ACCOUNT_UI)results.push(...await require('./standalone/account-orders-browser.cjs').run());
  for(const r of results)console.log((r.ok?'✓ ':'❌ ')+r.name+(r.error?'\n'+r.error:''));
  const bad=results.filter(r=>!r.ok).length;console.log(bad?`❌ tACCOUNTORDERS ${bad}개 실패`:`✓ tACCOUNTORDERS ${results.length}/${results.length} 통과`);if(bad)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
