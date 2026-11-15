'use strict';
(async()=>[...await require('./standalone/cart-store-browser.cjs').run(),...await require('./standalone/shelf-cart-browser.cjs').run()])().then(results=>{
  for(const r of results)console.log((r.ok?'✓ ':'❌ ')+r.name+(r.error?'\n'+r.error:''));
  const bad=results.filter(r=>!r.ok).length;
  console.log(bad?`❌ tCARTSTORE ${bad}개 실패`:`✓ tCARTSTORE ${results.length}/${results.length} 통과`);
  if(bad)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
