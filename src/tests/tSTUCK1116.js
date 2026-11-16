// tSTUCK1116 — (🔬 정밀 점검 11/16 stuck1) 🎯 집중 벤치마킹 이어 읽기 자리 찾기: 같은 쪽이 잇달아 3번 못 읽히면 일시 오류가 아님 · 쓰는 법: node tSTUCK1116.js [수집기 파일=/home/claude/w/readnow-collector.user.js]
const fs=require('fs'); const A=fs.readFileSync(process.argv[2] || (process.env.RN_BASE || '/home/claude') + '/w/readnow-collector.user.js','utf8'); const i=A.indexOf('const stuck = (() =>'); const j=A.indexOf('})();',i)+5; const src=A.slice(i,j);
const f=new Function('hit','fails','netBad','prog',src+'; return stuck;');
const R=(fail,o)=>({fail,...(o||{})}); let n=0,bad=0; const ok=(c,m)=>{n++; if(!c)bad++; console.log((c?'  ✓ ':'  ❌ ')+m);};
ok(f(null,[1603],false,{resumes:[R([1603]),R([1603]),R([1603])]})===true,'같은 쪽 3번 잇달아 → 일시 오류 아님');
ok(f(null,[1603],false,{resumes:[R([1603]),R([1603])]})===false,'2번뿐 → 아직 일시 오류(다시 찾음)');
ok(f(null,[1603],true,{resumes:[R([1603]),R([1603]),R([1603])]})===false,'테더링 막힘 → 늘 일시 오류');
ok(f(null,[1603],false,{resumes:[R([1603]),R([1602]),R([1603])]})===false,'다른 쪽이 섞임 → 아님');
ok(f(null,[1603],false,{resumes:[R([1603]),R([1603],{net:'x'}),R([1603])]})===false,'사이에 인터넷 끊김 회차 → 아님');
ok(f({page:3},[1603],false,{resumes:[R([1603]),R([1603]),R([1603])]})===false,'자리를 찾았으면 상관없음');
ok(f(null,[],false,{resumes:[R([1603]),R([1603]),R([1603])]})===false,'못 읽은 쪽 없음 → 아님');
ok(f(null,[1603],false,{})===false,'기록 없음 → 아님');
console.log(bad?`❌ tSTUCK 실패 ${bad}`:`✓ tSTUCK 통과 (${n}항목)`);
