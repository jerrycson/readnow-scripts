'use strict';
// 실제 IndexedDB 거래와 Web Locks를 사용한다. 가짜 열쇠만 쓰며 외부 통신은 차단한다.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.RN_REVIEW_ROOT||path.join(__dirname,'../../..'));
const {chromium}=require(process.env.RN_PLAYWRIGHT||'playwright');
async function run(){
 const script=fs.readFileSync(path.join(ROOT,'shop/token-store.js'),'utf8'),results=[];
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type',q.url==='/token.js'?'text/javascript':'text/html');r.end(q.url==='/token.js'?script:'<!doctype html><meta charset="utf-8"><script src="/token.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.RN_BROWSER?{executablePath:process.env.RN_BROWSER}:{})});
  async function test(name,fn){
   const ctx=await browser.newContext(),errors=[];let external=0;
   await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():(external++,r.abort()));
   await ctx.addInitScript(()=>{window.addEventListener('load',()=>{
    window.S=BQTokenStore.create();window.sent=0;
    window.start=async(owner,action='login')=>{const p=await S.prepare(owner,action);if(action!=='expired')await S.withOwner(owner,()=>{sent++;},p);return p;};
    window.change=async(next,owner=S.read())=>S.replace(next,owner,await start(owner));
    window.raw=async fn=>{const q=indexedDB.open(BQTokenStore.DB,1),db=await new Promise((y,n)=>{q.onsuccess=()=>y(q.result);q.onerror=()=>n(q.error);});try{return await new Promise((y,n)=>{const tx=db.transaction(['meta','intents'],'readwrite');let v;tx.oncomplete=()=>y(v);tx.onabort=()=>n(tx.error);fn(tx,x=>{v=x;});});}finally{db.close();}};
   });});
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
   let timer;
   try{await Promise.race([fn(p,ctx,base),new Promise((_,n)=>{timer=setTimeout(()=>n(Error('검사 12초 제한')),12000);})]);assert.equal(external,0);assert.deepEqual(errors,[]);results.push({name,ok:true});}
   catch(e){results.push({name,ok:false,error:e.stack});}
   finally{clearTimeout(timer);await ctx.close();console.log((results.at(-1).ok?'✓ ':'✗ ')+name);}
  }
  await test('처음 저장값은 한 번 이관하고 이후 변경은 거래 장부로 확인',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-old');const r=await S.check('synthetic-old');await change('synthetic-next');const m=await raw((tx,done)=>{const q=tx.objectStore('meta').get('current');q.onsuccess=()=>done(q.result);});return[r,m.token,m.revision,S.read()];}),[0,'synthetic-next',1,'synthetic-next']);
  });
  await test('작업표 없는 옛 호출은 로그인 저장을 우회하지 못함',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-old');try{await S.replace('synthetic-new','synthetic-old');return[];}catch(e){return[e.code,S.read(),sent];}}),['storage','synthetic-old',0]);
  });
  await test('보내기 전 준비 기록 쓰기가 실패하면 외부 호출 0회',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{await S.check('');const old=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(){throw Error('합성 용량 거절');};try{await start('');return[];}catch(e){return[e.code,sent];}finally{IDBObjectStore.prototype.add=old;}}),['storage',0]);
  });
  await test('보내기 기록 쓰기가 실패해도 외부 호출 0회',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await S.prepare('','login'),old=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw Error('합성 용량 거절');};try{await S.withOwner('',()=>sent++,a);return[];}catch(e){return[e.code,sent];}finally{IDBObjectStore.prototype.put=old;}}),['storage',0]);
  });
  await test('같은 작업표로 인증 요청을 두 번 보내지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await start('');try{await S.withOwner('',()=>sent++,a);return[];}catch(e){return[e.code,sent];}}),['changed',1]);
  });
  await test('서버에 보내지 않은 준비표로 성공을 저장하지 않음',async p=>{
   assert.equal(await p.evaluate(async()=>{const a=await S.prepare('','login');try{await S.replace('synthetic-new','',a);return false;}catch(e){return e.code==='changed'&&S.read()==='';}}),true);
  });
  await test('같은 결과의 기기 재시도는 변경 번호를 다시 올리지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await start('');await S.replace('synthetic-new','',a);await S.replace('synthetic-new','',a);return[S.read(),await S.check('synthetic-new'),sent];}),['synthetic-new',1,1]);
  });
  for(const kind of ['write','silent','readback'])await test('사본 '+kind+' 실패 뒤 같은 작업표로만 확정 결과 복구',async p=>{
   assert.deepEqual(await p.evaluate(async kind=>{const a=await start(''),set=Storage.prototype.setItem,get=Storage.prototype.getItem;let saved=false;Storage.prototype.setItem=function(k,v){if(k==='bq-tok'){if(kind==='write')throw Error('합성 쓰기 거절');if(kind==='silent')return;saved=true;}return set.call(this,k,v);};Storage.prototype.getItem=function(k){if(k==='bq-tok'&&saved&&kind==='readback')throw Error('합성 확인 거절');return get.call(this,k);};let code;try{await S.replace('synthetic-new','',a);}catch(e){code=e.code;}finally{Storage.prototype.setItem=set;Storage.prototype.getItem=get;}await S.replace('synthetic-new','',a);return[code,S.read(),await S.check('synthetic-new'),sent];},kind),['storage','synthetic-new',1,1]);
  });
  await test('사본 저장 실패 후 새로고침도 확정된 열쇠를 복원하며 옛 요청은 거절',async p=>{
   await p.evaluate(async()=>{const a=await start(''),old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='bq-tok')throw Error('합성 저장 거절');return old.call(this,k,v);};try{await S.replace('synthetic-new','',a);}catch(e){}finally{Storage.prototype.setItem=old;}});
   await p.reload();
   assert.deepEqual(await p.evaluate(async()=>{let code;try{await S.withOwner('',()=>sent++);}catch(e){code=e.code;}return[code,S.read(),sent,await S.check('synthetic-new')];}),['changed','synthetic-new',0,1]);
  });
  await test('삭제 실패 뒤에도 만료된 열쇠로 요청을 보내지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-old');const a=await start('synthetic-old','expired'),old=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='bq-tok')throw Error('합성 삭제 거절');return old.call(this,k);};let first,second;try{await S.replace('','synthetic-old',a);}catch(e){first=e.code;}try{await S.withOwner('synthetic-old',()=>sent++);}catch(e){second=e.code;}Storage.prototype.removeItem=old;await S.replace('','synthetic-old',a);return[first,second,sent,S.read()];}),['storage','storage',0,'']);
  });
  await test('확정 거래 중 오류는 소유권과 작업표를 함께 되돌림',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await start(''),old=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(v,...args){if(this.name==='intents')throw Error('합성 완료 기록 거절');return old.call(this,v,...args);};let code;try{await S.replace('synthetic-new','',a);}catch(e){code=e.code;}finally{IDBObjectStore.prototype.put=old;}const before=await S.check('');await S.replace('synthetic-new','',a);return[code,before,S.read(),sent];}),['storage',0,'synthetic-new',1]);
  });
  await test('재시도 결과가 다르면 첫 확정 열쇠를 덮지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await start('');await S.replace('synthetic-first','',a);try{await S.replace('synthetic-second','',a);return[];}catch(e){return[e.code,S.read()];}}),['changed','synthetic-first']);
  });
  await test('비회원으로 돌아온 뒤 늦은 옛 로그인 응답은 저장하지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const old=await start('');await change('synthetic-first','');await change('','synthetic-first');try{await S.replace('synthetic-late','',old);return[];}catch(e){return[e.code,S.read(),await S.check('')];}}),['changed','',2]);
  });
  await test('같은 문자열로 돌아와도 옛 완료표 재시도는 다음 로그인을 덮지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await start('');await S.replace('synthetic-first','',a);await change('synthetic-second');await change('synthetic-first');try{await S.replace('synthetic-first','',a);return[];}catch(e){return[e.code,S.read(),await S.check('synthetic-first')];}}),['changed','synthetic-first',3]);
  });
  await test('사본이 이전 값으로 멈춰 있어도 새 소유권을 덮지 않음',async(p,ctx,base)=>{
   await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-old');window.a=await start('synthetic-old');});
   const p2=await ctx.newPage();await p2.goto(base);await p2.evaluate(async()=>{window.b=await start('synthetic-old');});
   await p.evaluate(()=>S.replace('synthetic-first','synthetic-old',a));
   assert.deepEqual(await p2.evaluate(async()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return k==='bq-tok'?'synthetic-old':get.call(this,k);};try{await S.replace('synthetic-second','synthetic-old',b);return[];}catch(e){return[e.code];}finally{Storage.prototype.getItem=get;}}),['changed']);
   assert.equal(await p.evaluate(()=>S.read()),'synthetic-first');
  });
  await test('사본이 오래된 인증 요청은 fetch 0회이며 새 열쇠로 대신 보내지 않음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{await change('synthetic-new','');localStorage.setItem('bq-tok','synthetic-old');let code;sent=0;try{await S.withOwner('synthetic-old',()=>sent++);}catch(e){code=e.code;}return[code,sent,S.read()];}),['changed',0,'synthetic-new']);
  });
  await test('같은 소유자 두 탭의 완료 경합은 한 작성자만 성공',async(p,ctx,base)=>{
   await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-old');window.a=await start('synthetic-old');});
   const p2=await ctx.newPage();await p2.goto(base);await p2.evaluate(async()=>{window.a=await start('synthetic-old');});
   const change=(page,next)=>page.evaluate(next=>S.replace(next,'synthetic-old',a).then(()=>({ok:true}),e=>({ok:false,code:e.code})),next);
   const r=await Promise.all([change(p,'synthetic-first'),change(p2,'synthetic-second')]);
   assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).code,'changed');
  });
  await test('두 탭 첫 이관도 먼저 만든 장부를 뒤 사본으로 되돌리지 않음',async(p,ctx,base)=>{
   const p2=await ctx.newPage();await p2.goto(base);
   await p.evaluate(()=>localStorage.setItem('bq-tok','synthetic-first'));
   const r=await Promise.all([p.evaluate(()=>S.check('synthetic-first').then(()=>true,e=>false)),p2.evaluate(async()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return k==='bq-tok'?'synthetic-old':get.call(this,k);};try{await S.check('synthetic-old');return true;}catch(e){return false;}finally{Storage.prototype.getItem=get;}})]);
   assert.equal(r.filter(Boolean).length,1);
  });
  await test('응답 대기 중에는 다른 탭이 잠금을 받아 로그인 변경 가능',async(p,ctx,base)=>{
   await p.evaluate(async()=>{window.dispatched=await S.withOwner('',()=>new Promise(r=>window.releaseResponse=r));});
   const p2=await ctx.newPage();await p2.goto(base);await p2.evaluate(()=>change('synthetic-next',''));
   assert.equal(await p.evaluate(async()=>{releaseResponse('synthetic-response');await dispatched.value;try{await S.check('',dispatched.revision);return false;}catch(e){return e.code==='changed';}}),true);
  });
  await test('응답 확인은 소유권 변경 번호도 검사하여 비회원 왕복을 구분',async p=>{
   assert.equal(await p.evaluate(async()=>{const r=await S.withOwner('',()=>Promise.resolve({ok:true}));await change('synthetic-next','');await change('','synthetic-next');try{await S.check('',r.revision);return false;}catch(e){return e.code==='changed';}}),true);
  });
  for(const kind of ['missing','denied','durability'])await test('저장소 '+kind+' 상태에서는 외부 요청 0회',async p=>{
   assert.deepEqual(await p.evaluate(async kind=>{const env={navigator,AbortController,localStorage,crypto,indexedDB};if(kind==='missing')env.indexedDB=null;if(kind==='denied')env.indexedDB={open(){throw Error('합성 접근 거절');}};const old=IDBDatabase.prototype.transaction;if(kind==='durability')IDBDatabase.prototype.transaction=function(...a){const tx=old.apply(this,a);Object.defineProperty(tx,'durability',{value:'relaxed'});return tx;};try{await BQTokenStore.create(env).withOwner('',()=>sent++);return[];}catch(e){return[e.code,sent];}finally{IDBDatabase.prototype.transaction=old;}},kind),['storage',0]);
  });
  await test('장부 손상은 사본으로 초기화하지 않고 요청을 막음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{await S.check('');await raw(tx=>tx.objectStore('meta').put({schema:2,revision:'broken',token:'',last:null},'current'));try{await S.withOwner('',()=>sent++);return[];}catch(e){return[e.code,sent];}}),['storage',0]);
  });
  await test('이미 만든 장부의 소유권 행이 사라져도 사본으로 초기화하지 않음',async p=>{assert.deepEqual(await p.evaluate(async()=>{await S.check('');await raw(tx=>tx.objectStore('meta').delete('current'));try{await S.withOwner('',()=>sent++);return[];}catch(e){return[e.code,sent];}}),['storage',0]);});
  await test('작업표 손상과 다른 작업표 사용도 외부 호출을 막음',async p=>{
   assert.deepEqual(await p.evaluate(async()=>{const a=await S.prepare('','login');await raw(tx=>tx.objectStore('intents').put({...a,state:'broken'}));try{await S.withOwner('',()=>sent++,a);return[];}catch(e){return[e.code,sent];}}),['storage',0]);
  });
  await test('보관된 작업표에는 열쇠 원문 대신 해시와 변경 번호만 있음',async p=>{
   const value=await p.evaluate(async()=>{localStorage.setItem('bq-tok','synthetic-private-old');const a=await start('synthetic-private-old');await S.replace('synthetic-private-new','synthetic-private-old',a);return raw((tx,done)=>{const q=tx.objectStore('intents').getAll();q.onsuccess=()=>done(q.result);});});
   assert.equal(value.length,1);assert.doesNotMatch(JSON.stringify(value),/synthetic-private/);assert.match(value[0].hash,/^[0-9a-f]{64}$/);assert.equal(value[0].state,'committed');
  });
  await test('구형 계정 화면은 새 저장소의 사본 읽기로 인증 준비를 우회하지 못함',async p=>{assert.deepEqual(await p.evaluate(async()=>{window.BQA={tok:()=>''};try{await S.withOwner('',()=>sent++);return[];}catch(e){return[e.code,sent];}finally{delete window.BQA;}}),['storage',0]);});
  await test('직접 전송 함수의 화면 오류는 저장 오류로 바꾸지 않음',async p=>{
   assert.equal(await p.evaluate(async()=>{try{await S.withOwner('',()=>{throw Error('합성 화면 이동');});return'';}catch(e){return e.message;}}),'합성 화면 이동');
  });
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
 return results;
}
module.exports={run};
if(require.main===module)run().then(r=>{r.filter(x=>!x.ok).forEach(x=>console.error(x));console.log(r.filter(x=>x.ok).length+'/'+r.length+' 통과');if(r.some(x=>!x.ok))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
