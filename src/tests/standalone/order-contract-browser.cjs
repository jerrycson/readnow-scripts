'use strict';
// 의존 서버 PR까지 합친 작업본에서 실제 주문 함수·HTTP·고객 화면을 잇는다. 합성 저장소만 사용한다.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.RN_REVIEW_ROOT||path.join(__dirname,'../../..'));
const {chromium}=require(process.env.RN_PLAYWRIGHT||'playwright');
function factory() {
  const tests=fs.existsSync(path.join(__dirname,'order-attempt.test.cjs'))?__dirname:path.join(ROOT,'src/tests/standalone');
  const file=path.join(tests,'order-attempt.test.cjs');
  if(!fs.existsSync(file))throw Error('서버 요청 계약 PR까지 합친 작업본에서 실행해야 합니다');
  const source=fs.readFileSync(file,'utf8'),start=source.indexOf('  function fixture(options = {})'),end=source.indexOf("  await test('같은 결정",start);
  if(start<0||end<0)throw Error('서버 합성 저장소 준비 함수를 찾지 못했습니다');
  const {mockDb,between}=require(path.join(tests,'stability.test.cjs'));
  const scope={vm,crypto,Buffer,URL,mockDb,between,orderSeq:0,shop:fs.readFileSync(path.join(ROOT,'cloud/shop.js'),'utf8'),SH:require(path.join(ROOT,'cloud/shop.js')),STOCK:require(path.join(ROOT,'cloud/shop-stock.js')),ATTEMPT:require(path.join(ROOT,'cloud/shop-order-attempt.js'))};
  vm.createContext(scope);vm.runInContext(source.slice(start,end),scope);return scope.fixture;
}
async function run() {
  const make=factory(),book={id:'L',t:'가상 시험 책',p:100,lp:100,g:'상',st:'s',q:3},results=[];
  const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
  let f,mode='normal',writes=[],attempts=[],delayed=null;
  const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');
    try {
      if(u.pathname.startsWith('/s/')){const file=path.resolve(ROOT,'shop',u.pathname.slice(3));if(!file.startsWith(path.join(ROOT,'shop')+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('{}');}res.setHeader('Content-Type',MIME[path.extname(file)]||'text/plain');return fs.createReadStream(file).pipe(res);}
      if(['/shop/order-attempt','/shop/order-status','/shop/order-close'].includes(u.pathname)) {
        if(u.pathname==='/shop/order-attempt'){
          writes.push(u.pathname);
          if(mode==='delay-before'){mode='normal';let text='';for await(const part of req)text+=part;delayed=JSON.parse(text);res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:false,err:'가상 앞단 응답 유실'}));}
          if(mode==='lose-after'){mode='normal';res.end=()=>res.destroy();}
          if(mode==='hold-after'){mode='normal';res.end=()=>{};}
        }
        return await f.ctx.handle(req,res,u.pathname);
      }
      let body={ok:true,items:[],tree:[],kinds:[],total:0};
      if(u.pathname==='/shop/cfg')body={...body,orderProtocol:1,open:1,name:'가상 책방',biz:{},pay:{how:'wait'},maxItems:20,shipFee:0,freeOver:0,shelf:{fontsOn:false},look:{rows:['new']}};
      if(u.pathname==='/shop/check')body={ok:true,st:{L:'s'},p:{L:100}};
      if(u.pathname==='/shop/quote')body={ok:true,items:[book],bad:[],n:1,sum0:100,sum:100,fee:0,total:100};
      if(u.pathname==='/shop/order'){const doc=f.db.data.get('shop_orders/'+u.searchParams.get('no'));if(!doc||doc.tokH!==f.ctx.hashTok(u.searchParams.get('t'))){res.writeHead(404);return res.end(JSON.stringify({ok:false,err:'가상 조회 거절'}));}body={ok:true,...doc,st:'new',stTxt:'가상 접수',items:[book]};}
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));
    }catch(e){if(!res.destroyed){res.writeHead(500);res.end(JSON.stringify({ok:false,err:'가상 저장 오류'}));}}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  let browser;
  const count=()=>[...f.db.data.keys()].filter(k=>k.startsWith('shop_orders/')).length;
  const until=async fn=>{const deadline=Date.now()+5000;while(!fn()){if(Date.now()>deadline)throw Error('가상 처리 대기 시간 초과');await new Promise(r=>setTimeout(r,20));}};
  const fill=async p=>p.evaluate(()=>{for(const[k,v]of Object.entries({name:'가상 주문자',phone:'01000000000',zip:'00000',addr1:'가상 시험 주소',addr2:'가상 상세'}))document.querySelector('#f_'+k).value=v;for(const k of['agreeP','agreeT'])document.querySelector('#f_'+k).checked=true;document.querySelector('#f_name').dispatchEvent(new Event('input',{bubbles:true}));});
  const submit=p=>p.evaluate(()=>document.querySelector('#of').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  try {
    browser=await chromium.launch({...(process.env.RN_BROWSER?{executablePath:process.env.RN_BROWSER}:{}),headless:true});
    async function test(name,fn){f=make();mode='normal';writes=[];attempts=[];delayed=null;const originalOrder=f.ctx.order;f.ctx.order=async(req,body)=>{attempts.push(body.attempt);return originalOrder(req,body);};const ctx=await browser.newContext();let external=0;const errors=[];
      await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():(external++,r.abort()));
      await ctx.addInitScript(({base,book})=>{window.BQ_API=base;if(location.origin===base&&!localStorage.getItem('bq-cart'))localStorage.setItem('bq-cart',JSON.stringify([book]));},{base,book});
      ctx.on('page',p=>{p.setDefaultTimeout(18000);p.on('pageerror',e=>errors.push(e.message));});const p=await ctx.newPage();let timer;
      try{await p.goto(base+'/s/index.html#/order');await p.locator('#f_name').waitFor();await p.waitForTimeout(100);await fill(p);await Promise.race([fn(p,ctx),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('통합 검사 시간 초과')),25000);})]);assert.deepEqual(errors,[]);assert.equal(external,0);results.push({name,ok:true});}catch(e){console.error(name+': '+e.message);results.push({name,ok:false,error:e.stack,errors,diagnostic:{main:await p.locator('#main').textContent(),writes:writes.length,orders:count()}});}finally{clearTimeout(timer);await ctx.close();console.log((results.at(-1).ok?'✓ ':'❌ ')+name);}
    }
    await test('실제 서버 커밋 뒤 응답 유실은 같은 주문·토큰으로 복구',async p=>{mode='lose-after';await submit(p);await p.waitForFunction(()=>document.querySelector('#orenext')||document.querySelector('.done'));const r=await p.evaluate(()=>BQOrderJournal.create().read());assert.equal(r.active.state,'completed');assert.equal(count(),1);assert(writes.length>=1&&writes.length<=2);assert.equal(new Set(attempts.map(a=>a.id)).size,1);assert(attempts.every(a=>a.id===r.active.id&&a.secret===r.active.secret));assert.equal(f.db.data.get('shop_holds/L').reservedQty,1);const receipt=r.active.result.receipt;assert.equal(f.db.data.get('shop_orders/'+receipt.no).tokH,f.ctx.hashTok(receipt.t));});
    await test('미접수 닫기 뒤 늦은 실제 접수는 막고 새 구매는 별도 처리',async p=>{mode='delay-before';await submit(p);await p.locator('#oreclose').click();await p.locator('#orenext').waitFor();const old=delayed,late=await f.order(old);assert.equal(late[0],409);assert.equal(count(),0);await p.locator('#orenext').click();await p.locator('#f_name').waitFor();await fill(p);await p.locator('#f_addr1').fill('새 가상 주소');await submit(p);await p.locator('.done').waitFor();assert.equal(count(),1);assert.equal(writes.length,2);const r=await p.evaluate(()=>BQOrderJournal.create().read());assert.notEqual(r.active.id,old.attempt.id);assert.equal(f.db.data.get('shop_holds/L').reservedQty,1);});
    await test('실제 접수 응답 전 새로고침은 조회만 하며 예약을 늘리지 않음',async p=>{mode='hold-after';await submit(p);await until(()=>count()===1);await p.reload();await p.locator('#orenext').waitFor();assert.equal(writes.length,1);assert.equal(count(),1);assert.equal(f.db.data.get('shop_holds/L').reservedQty,1);});
    await test('두 실제 주문서와 서버 거래를 연결해도 주문·예약 한 건',async(p,ctx)=>{const p2=await ctx.newPage();await p2.goto(base+'/s/index.html#/order');await p2.locator('#f_name').waitFor();await fill(p2);await p2.waitForTimeout(100);await Promise.all([submit(p),submit(p2)]);await until(()=>count()===1);await p.waitForTimeout(300);assert.equal(writes.length,1);assert.equal(count(),1);assert.equal(f.db.data.get('shop_holds/L').reservedQty,1);});
    await test('실제 거래 저장 실패 뒤 복구 재전송도 원래 요청 번호 사용',async p=>{f.db.setFail(true);await submit(p);await p.locator('#orecheck').waitFor();const id=(await p.evaluate(()=>BQOrderJournal.create().read())).active.id;assert.equal(count(),0);f.db.setFail(false);await p.locator('#orecheck').click();await p.locator('#oreretry').click();await p.locator('#f_name').waitFor();await fill(p);await p.waitForTimeout(100);await submit(p);await p.locator('.done').waitFor();assert.equal(count(),1);assert.equal(writes.length,2);assert.equal((await p.evaluate(()=>BQOrderJournal.create().read())).active.id,id);});
  }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
  return results;
}
module.exports={run};
if(require.main===module)run().then(r=>{for(const x of r)if(!x.ok)console.error(x.error,JSON.stringify(x.errors),JSON.stringify(x.diagnostic));console.log(`주문 서버·화면 통합 ${r.filter(x=>x.ok).length}/${r.length}`);if(r.some(x=>!x.ok))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
