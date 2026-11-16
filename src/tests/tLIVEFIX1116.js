// tLIVEFIX1116 — (정범님 11/16 23:37 · 1.89.344) Tampermonkey가 본체는 옛 판 그대로 두고 모듈 파일만 새 판으로 받아 온 PC: 판 번호를 모듈 판으로 맞춰 빨간 띠·되풀이 새로고침이 없어야 함 · 쓰는 법: node tLIVEFIX1116.js [boot 파일=저장소 readnow-pc-boot.js]
const fs=require('fs'), vm=require('vm'), path=require('path');
const SRC=fs.readFileSync(process.argv[2] || path.join(__dirname,'..','..','readnow-pc-boot.js'),'utf8');
let n=0,bad=0; const ok=(c,m)=>{n++; if(!c)bad++; console.log((c?'  ✓ ':'  ❌ ')+m);};
function run(o){ const st=Object.assign({},o.store||{}); const logs=[]; const timers=[];
  const ctx={ GM_getValue:(k,d)=>k in st?st[k]:d, GM_setValue:(k,v)=>{st[k]=v;}, setTimeout:(f)=>{timers.push(f);return 0;}, clearTimeout(){}, setInterval(){return 0;}, console:{log(){},warn(){},error(){}}, Date };
  ctx.globalThis=ctx; ctx.window={ __rnLog:(a,lv,m)=>logs.push([lv,m]) }; vm.createContext(ctx);
  ctx.__rnModQ=(o.q||[]).map(v=>['m',v]); try{ vm.runInContext(SRC,ctx); }catch(e){}
  ctx.ReadnowPcMods.boot=o.boot; if(o.err) ctx.__rnLiveErr=o.err;
  try{ ctx.__rnBoot({classic:o.classic, hsig:'8ab2f661d1d8afa8', used:o.used||'classic'}); }catch(e){}
  timers.forEach(f=>{try{f();}catch(e){}}); return {G:ctx,st,logs}; }
let r=run({classic:'1.89.282',q:['1.89.343','1.89.343','1.89.343'],boot:'1.89.343'});
ok(r.G.__rnLiveVer==='1.89.343' && r.G.__RN_FILE_VER==='1.89.343','모듈·시작 코드 모두 343 · 본체 282 → 판 번호 343으로 맞춤');
ok(r.G.__rnLiveFix && r.G.__rnLiveFix.from==='1.89.282','바로잡은 기록(from 282)');
ok(r.logs.some(x=>/모듈 파일을 새 판 1\.89\.343/.test(x[1])),'작업 기록에 한 줄');
const r2=run({classic:'1.89.282',q:['1.89.343'],boot:'1.89.343',store:r.st}); ok(!r2.logs.some(x=>/모듈 파일을 새 판/.test(x[1])),'6시간 안 같은 판은 기록 되풀이 안 함');
r=run({classic:'1.89.282',q:['1.89.343','1.89.342'],boot:'1.89.343'}); ok(r.G.__rnLiveVer===undefined,'모듈 판이 섞임 → 그대로(빨간 띠로 알림)');
r=run({classic:'1.89.343',q:['1.89.343'],boot:'1.89.343'}); ok(r.G.__rnLiveVer===undefined && !r.G.__rnLiveFix,'모두 같은 판 → 손대지 않음');
r=run({classic:'1.89.344',q:['1.89.343'],boot:'1.89.343'}); ok(!r.G.__rnLiveFix,'모듈이 본체보다 옛 판 → 손대지 않음');
r=run({classic:'1.89.282',q:['1.89.344'],boot:'1.89.344',used:'live'}); ok(!r.G.__rnLiveFix,'받아 둔 판으로 뜬 때 → 손대지 않음');
r=run({classic:'1.89.282',q:[],boot:'1.89.343'}); ok(!r.G.__rnLiveFix,'줄에 선 모듈 없음 → 손대지 않음');
r=run({classic:'1.89.282',q:['1.89.343'],boot:'1.89.343',store:{'rn-live':{ver:'1.89.344',code:'x',hsig:'다른것'}}});
ok(r.G.__rnLiveWhy && /머리 서명/.test(r.G.__rnLiveWhy.why),'받아 둔 판을 안 쓴 까닭 = 머리 서명 다름');
ok(r.logs.some(x=>/받아 둔 판 1\.89\.344을 쓰지 않고/.test(x[1]) && x[0]==='warn'),'까닭을 경고로 기록(받은 모듈이 더 옛 판)');
r=run({classic:'1.89.282',q:[],boot:'1.89.282',store:{'rn-live':{ver:'1.89.344',code:'x',hsig:'8ab2f661d1d8afa8'},'rn-live-bad':{ver:'1.89.344',err:'boom'}}});
ok(r.G.__rnLiveWhy && /실패한 판/.test(r.G.__rnLiveWhy.why),'까닭 = 전에 시작에 실패한 판');
r=run({classic:'1.89.282',q:[],boot:'1.89.282',store:{'rn-live':{ver:'1.89.344',code:''}}}); ok(/비어/.test(r.G.__rnLiveWhy.why),'까닭 = 받아 둔 코드 비어 있음');
console.log(bad?`❌ tLIVEFIX 실패 ${bad}`:`✓ tLIVEFIX 통과 (${n}항목)`); process.exit(bad?1:0);
