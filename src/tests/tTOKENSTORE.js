'use strict';
// 두 탭의 거래 일관성은 실제 브라우저에서 확인한다. 도구 누락은 통과로 처리하지 않는다.
(async()=>{
 const r=await require('./standalone/token-store-browser.cjs').run();
 for(const x of r)if(!x.ok)console.log('❌ '+x.name+'\n'+x.error);
 const n=r.filter(x=>!x.ok).length;
 console.log(n?'❌ tTOKENSTORE '+n+'개 실패':'✓ tTOKENSTORE '+r.length+'/'+r.length+' 통과');
 if(n)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
