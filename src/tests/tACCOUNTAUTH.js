'use strict';
require('./standalone/account-auth.test.cjs').run().then(results=>{
  for(const r of results)if(!r.ok)console.error('❌ '+r.name+'\n'+r.error);
  const bad=results.filter(r=>!r.ok).length;
  console.log(bad?'❌ tACCOUNTAUTH '+bad+'개 실패':'✓ tACCOUNTAUTH '+results.length+'/'+results.length+' 통과');
  if(bad)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
