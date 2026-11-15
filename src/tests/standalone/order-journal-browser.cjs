'use strict';
// 실제 브라우저 IndexedDB의 거래·두 탭·새로고침을 검사한다. 가짜 자료와 로컬 서버만 사용한다.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const ROOT = path.resolve(process.env.RN_REVIEW_ROOT || path.join(__dirname, '../../..'));
const { chromium } = require(process.env.RN_PLAYWRIGHT || 'playwright');
async function run() {
  const script = fs.readFileSync(path.join(ROOT, 'shop/order-journal.js'), 'utf8');
  const server = http.createServer((req, res) => { res.setHeader('Content-Type', req.url === '/journal.js' ? 'text/javascript' : 'text/html'); res.end(req.url === '/journal.js' ? script : '<!doctype html><meta charset="utf-8"><script src="/journal.js"></script>'); });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port;
  let browser; const results = [];
  try {
    browser = await chromium.launch({ ...(process.env.RN_BROWSER ? { executablePath: process.env.RN_BROWSER } : {}), headless: true });
    async function test(name, fn) {
      const ctx = await browser.newContext(); let external = 0; const errors = [];
      await ctx.route('**/*', r => new URL(r.request().url()).origin === base ? r.continue() : (external++, r.abort()));
      await ctx.addInitScript(() => { window.addEventListener('load', () => {
        window.J = BQOrderJournal.create();
        window.CART = [{ id: 'TEST-A', _entry: 'synthetic-entry-a', n: 1, t: '가짜 책' }];
        window.BODY = { items: ['TEST-A'], buyer: { name: '합성입력만', phone: '가상연락처' }, rcv: { addr1: '합성주소만' }, agree: { privacy: true, terms: true }, expect: 2000 };
        window.begin = async () => J.begin((await J.read()).revision, BODY, CART);
        window.ok = r => ({ ok: true, orderProtocol: 1, requestId: r.id, attemptState: 'completed', no: 'BQ20261116-AAAAA', t: 'a'.repeat(32), total: 2000, items: [{ id: 'TEST-A' }] });
        window.no = r => ({ ok: false, orderProtocol: 1, requestId: r.id, attemptState: 'rejected', err: '가상 거절' });
        window.raw = async fn => { const req = indexedDB.open('bq-order-journal-v1', 1); const db = await new Promise((y, n) => { req.onsuccess = () => y(req.result); req.onerror = n; }); try { return await new Promise((y,n) => { const tx=db.transaction(['meta','attempts'],'readwrite'); let result; tx.oncomplete=()=>y(result);tx.onabort=()=>n(tx.error);fn(tx, v=>{result=v;}); }); } finally {db.close();} };
      }); });
      const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(base);
      try { let timer; try { await Promise.race([fn(p, ctx), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('검사 제한 시간 초과')), 10000); })]); } finally { clearTimeout(timer); } assert.equal(external, 0); assert.deepEqual(errors, []); results.push({ name, ok: true }); }
      catch (e) { results.push({ name, ok: false, error: e.stack }); }
      finally { await ctx.close(); console.log((results.at(-1).ok ? '✓ ' : '✗ ') + name); }
    }
    await test('처음 기록은 원자적으로 저장되고 비밀 난수 꼴을 지킴', async p => {
      const r = await p.evaluate(async () => { const x=await begin(); return {x,again:await J.read()}; });
      assert.equal(r.x.created,true);assert.match(r.x.active.id,/^[a-f0-9]{32}$/);assert.match(r.x.active.secret,/^[a-f0-9]{64}$/);assert.equal(r.again.active.id,r.x.active.id);
    });
    await test('두 탭 동시 시작은 요청 하나만 만들고 나머지는 기존 요청을 받음', async (p,ctx) => {
      const p2=await ctx.newPage();await p2.goto(base); const all=await Promise.all([p.evaluate(()=>begin()),p2.evaluate(()=>begin())]);
      assert.equal(all.filter(x=>x.created).length,1);assert.equal(all[0].active.id,all[1].active.id);assert.equal(all[0].active.secret,all[1].active.secret);
    });
    await test('새로고침 뒤에도 결과 불명 요청과 비밀값 보존', async p => { const first=await p.evaluate(()=>begin());await p.reload();const r=await p.evaluate(()=>J.read());assert.equal(r.active.id,first.active.id);assert.equal(r.active.secret,first.active.secret);assert.equal(r.active.state,'pending'); });
    await test('내용을 바꿔도 미확정 요청을 새 요청으로 바꾸지 않음', async p => { const r=await p.evaluate(async()=>{const a=await begin();BODY.expect=4000;const b=await begin();return{a,b,same:await J.matches(b.active,BODY)};});assert.equal(r.a.active.id,r.b.active.id);assert.equal(r.b.created,false);assert.equal(r.same,false); });
    await test('정렬된 객체 내용은 같고 수량·주소 변경은 다름', async p => {const r=await p.evaluate(async()=>{const a=await begin();const reorder=Object.fromEntries(Object.entries(BODY).reverse());return[await J.matches(a.active,reorder),await J.matches(a.active,{...BODY,qty:{'TEST-A':2}}),await J.matches(a.active,{...BODY,rcv:{addr1:'다른 합성주소'}})];});assert.deepEqual(r,[true,false,false]);});
    await test('주문 본문·주소·이름·동의는 새 장부에 저장하지 않음', async p => {const r=await p.evaluate(async()=>{await begin();return raw((tx,done)=>{const q=tx.objectStore('attempts').getAll();q.onsuccess=()=>done(JSON.stringify(q.result));});});assert.doesNotMatch(r,/합성입력만|가상연락처|합성주소만|buyer|agree|rcv|가짜 책/);});
    await test('난수·해시 도구가 없으면 기록을 만들지 않음', async p => {assert.equal(await p.evaluate(async()=>{try{await BQOrderJournal.create({indexedDB,crypto:null}).begin(0,BODY,CART);return false;}catch(e){return (await J.read()).active===null;}}),true);});
    await test('저장소 접근 거절은 성공으로 넘기지 않음', async p => {assert.equal(await p.evaluate(async()=>{try{await BQOrderJournal.create({indexedDB:{open(){throw Error('시험 차단');}},crypto}).begin(0,BODY,CART);return false;}catch(e){return true;}}),true);});
    await test('거래 중 쓰기 오류는 활성 번호와 요청 모두 되돌림', async p => {assert.equal(await p.evaluate(async()=>{const old=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(){throw Error('시험 용량 부족');};let failed=false;try{await begin();}catch(e){failed=true;}finally{IDBObjectStore.prototype.add=old;}return failed&&(await J.read()).active===null;}),true);});
    await test('엄격한 저장 완료를 지원하지 않으면 접수 준비를 보류', async p => {assert.equal(await p.evaluate(async()=>{const old=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){const tx=old.apply(this,args);Object.defineProperty(tx,'durability',{value:'relaxed'});return tx;};let failed=false;try{await begin();}catch(e){failed=true;}finally{IDBDatabase.prototype.transaction=old;}return failed&&(await J.read()).active===null;}),true);});
    await test('지원 표시 없는 성공·다른 요청 결과는 끝난 일로 기록하지 않음', async p => {assert.deepEqual(await p.evaluate(async()=>{const {active:a}=await begin();const b=ok(a);delete b.orderProtocol;const v=[];for(const body of [b,{...ok(a),requestId:'b'.repeat(32)}]){try{await J.settle(a.id,200,body);v.push(false);}catch(e){v.push((await J.read()).active.state==='pending');}}return v;}),[true,true]);});
    await test('결과 부재·일반 오류·형식이 틀린 성공은 미확정 유지', async p => {assert.equal(await p.evaluate(async()=>{const {active:a}=await begin();for(const body of [{ok:true,state:'absent',orderProtocol:1,requestId:a.id},{ok:false,err:'오류'},{...ok(a),t:'잘못된 값'}]){try{await J.settle(a.id,200,body);return false;}catch(e){}}return(await J.read()).active.state==='pending';}),true);});
    await test('완료 결과를 저장하고 같은 완료 응답은 반복 반영하지 않음', async p => {const r=await p.evaluate(async()=>{const {active:a}=await begin();await J.settle(a.id,200,ok(a));await J.settle(a.id,200,ok(a));return{active:(await J.read()).active,history:await J.receipts()};});assert.equal(r.active.state,'completed');assert.equal(r.history.length,1);});
    await test('확정 거절만 해제 대상으로 인정하고 본문은 저장하지 않음', async p => {const r=await p.evaluate(async()=>{const a=await begin();await J.settle(a.active.id,409,{...no(a.active),buyer:BODY.buyer});const r=await J.read();await J.acknowledge(a.active.id,r.revision);return{r,now:await J.read()};});assert.equal(r.r.active.state,'rejected');assert.doesNotMatch(JSON.stringify(r.r.active),/합성입력만|buyer/);assert.equal(r.now.active,null);});
    await test('미확정 요청은 확인 버튼으로도 지울 수 없음', async p => {assert.equal(await p.evaluate(async()=>{const a=await begin();try{await J.acknowledge(a.active.id,a.revision);return false;}catch(e){return(await J.read()).active.id===a.active.id;}}),true);});
    await test('완료를 확인한 뒤 오래된 화면 번호는 새 구매를 만들지 못함', async p => {assert.equal(await p.evaluate(async()=>{const start=await J.read();const a=await begin();await J.settle(a.active.id,200,ok(a.active));await J.acknowledge(a.active.id,a.revision);try{await J.begin(start.revision,BODY,CART);return false;}catch(e){return(await J.read()).active===null;}}),true);});
    await test('명시적 완료 확인 뒤 최신 화면에서는 별도 구매 가능', async p => {const r=await p.evaluate(async()=>{const a=await begin();await J.settle(a.active.id,200,ok(a.active));const next=await J.acknowledge(a.active.id,a.revision);const b=await J.begin(next.revision,BODY,[{...CART[0],_entry:'synthetic-next'}]);return{a,b,history:await J.receipts()};});assert.notEqual(r.a.active.id,r.b.active.id);assert.equal(r.b.created,true);assert.equal(r.history.length,1);});
    await test('두 탭 완료 확인 경합은 한 번만 다음 구매를 열음', async (p,ctx) => {const a=await p.evaluate(async()=>{const x=await begin();await J.settle(x.active.id,200,ok(x.active));return x;});const p2=await ctx.newPage();await p2.goto(base);const all=await Promise.all([p,p2].map(page=>page.evaluate(async x=>{try{await J.acknowledge(x.active.id,x.revision);return true;}catch(e){return false;}},a)));assert.equal(all.filter(Boolean).length,1);});
    await test('이전 응답이 늦게 와도 다음 구매의 활성 번호를 덮지 않음', async p => {assert.equal(await p.evaluate(async()=>{const a=await begin();await J.settle(a.active.id,200,ok(a.active));await J.acknowledge(a.active.id,a.revision);const b=await begin();await J.settle(a.active.id,200,ok(a.active));return(await J.read()).active.id===b.active.id;}),true);});
    await test('모순된 완료·거절 응답은 첫 확정 결과를 덮지 않음', async p => {assert.equal(await p.evaluate(async()=>{const a=await begin();await J.settle(a.active.id,200,ok(a.active));try{await J.settle(a.active.id,409,no(a.active));return false;}catch(e){return(await J.read()).active.state==='completed';}}),true);});
    await test('손상된 활성 기록은 새 요청으로 초기화하지 않음', async p => {assert.equal(await p.evaluate(async()=>{const a=await begin();await raw(tx=>tx.objectStore('attempts').put({...a.active,bodyHash:'손상'}));try{await begin();return false;}catch(e){return true;}}),true);});
    await test('손상된 완료 영수증은 확인 없이 다음 구매로 넘기지 않음', async p => {assert.equal(await p.evaluate(async()=>{const a=await begin();await raw(tx=>tx.objectStore('attempts').put({...a.active,state:'completed',result:{state:'completed',receipt:{}}}));try{await J.acknowledge(a.active.id,a.revision);return false;}catch(e){return true;}}),true);});
    await test('저장소 열림이 막히면 제한 시간 뒤 보류', async p => {assert.equal(await p.evaluate(async()=>{try{await BQOrderJournal.create({indexedDB:{open(){return{};}},crypto,setTimeout(fn){return setTimeout(fn,10);},clearTimeout}).read();return false;}catch(e){return true;}}),true);});
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
  return results;
}
module.exports={run};
if(require.main===module)run().then(results=>{for(const r of results)console.log((r.ok?'✓ ':'✗ ')+r.name+(r.error?'\n'+r.error:''));console.log(`주문 장부 브라우저 ${results.filter(x=>x.ok).length}/${results.length}`);if(results.some(x=>!x.ok))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
