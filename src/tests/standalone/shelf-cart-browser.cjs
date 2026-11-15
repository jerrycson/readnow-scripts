'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.RN_REVIEW_ROOT||path.join(__dirname,'../../..'));
const {chromium}=require(process.env.RN_PLAYWRIGHT||'playwright');
async function run(){
  const assets=['shop-core.js','cart-store.js','shelf-core.js','shelf.js','shop.css','shelf.css'];
  const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://x').pathname.slice(1);if(assets.includes(name)){res.setHeader('Content-Type',name.endsWith('.css')?'text/css':'text/javascript');return res.end(fs.readFileSync(path.join(ROOT,'shop',name)));}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/shop.css"><link rel="stylesheet" href="/shelf.css"><main id="root"></main>'+assets.filter(x=>x.endsWith('.js')).map(x=>'<script src="/'+x+'"></script>').join(''));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;const results=[];
  try{browser=await chromium.launch({...(process.env.RN_BROWSER?{executablePath:process.env.RN_BROWSER}:{}),headless:true});
    for(const mode of['sheet','popup','book','leave']){
      const ctx=await browser.newContext({viewport:{width:mode==='sheet'?390:1280,height:900},reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
      try{await p.goto(base);await p.evaluate(mode=>{
        const x={...BQS.demoItems(1,7)[0],id:'SYNTHETIC',t:'합성 서가 책',cp:'국내도서',st:'s',p:100,q:3,im:null,bk:null,sp:null,pvs:[]};window.store=BQCartStore.create();window.messages=[];window.addCalls=0;
        window.shelf=BQShelf.mount(document.querySelector('#root'),{cfg:{cap:20,fontsOn:false,coverColor:false,popMode:mode==='popup'?'spine':'open',mobPop:'sheet',remember:false},load:async()=>[x],shop:{open:true},cart:{has:id=>store.read().some(x=>x.id===id),n:()=>store.read().length,add:book=>{window.addCalls++;return new Promise((resolve,reject)=>{window.finishCart=async err=>{if(err)return reject(Error(err));await store.update(list=>({cart:BQ.cartAdd(list,book,20).cart}));resolve(null);};});}},toast:message=>window.messages.push(String(message)),wish:{get:()=>[],set:()=>{}},open:()=>{}});
      },mode);await p.locator('.bqs-case.cur .sp').first().click();const button=p.locator('#root [data-a="cart"]:visible').first();await button.waitFor();await button.click();await p.waitForFunction(()=>window.addCalls===1);assert.equal(await p.evaluate(()=>store.read().length),0);assert.equal(await button.evaluate(a=>a.disabled),true);assert(!(await p.evaluate(()=>window.messages)).some(x=>x.includes('담았습니다')));
        await button.evaluate(a=>a.dispatchEvent(new MouseEvent('click',{bubbles:true})));assert.equal(await p.evaluate(()=>window.addCalls),1);
        if(mode==='leave'){await p.evaluate(()=>{shelf.destroy();document.querySelector('#root').innerHTML='<p>새 합성 화면</p>';});await p.evaluate(()=>window.finishCart());await p.waitForFunction(()=>store.read().length===1);assert.equal(await p.locator('#root').textContent(),'새 합성 화면');assert(!(await p.evaluate(()=>window.messages)).some(x=>x.includes('담았습니다')));}
        else{await p.evaluate(()=>window.finishCart('합성 저장 거절'));await p.waitForFunction(()=>window.messages.includes('합성 저장 거절'));assert.equal(await button.evaluate(a=>a.disabled),false);assert.equal(await p.evaluate(()=>store.read().length),0);await button.click();await p.waitForFunction(()=>window.addCalls===2);await p.evaluate(()=>window.finishCart());await p.waitForFunction(()=>store.read().length===1);await p.waitForFunction(()=>document.querySelector('.bqs-sr').textContent.includes('담았습니다'));}
        assert.deepEqual(errors,[]);results.push({name:'서가 저장: '+({sheet:'휴대폰 아래 창',popup:'책등 팝업',book:'펼친 책',leave:'저장 대기 중 화면 종료'})[mode]+'의 대기·실패·완료 보존',ok:true});
      }catch(e){results.push({name:'서가 저장 '+mode,ok:false,error:e.stack});}finally{await ctx.close();}
    }
  }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
  return results;
}
module.exports={run};
if(require.main===module)run().then(r=>{for(const x of r)console.log((x.ok?'✓ ':'❌ ')+x.name+(x.error?'\n'+x.error:''));console.log(`${r.filter(x=>x.ok).length}/${r.length} 통과`);if(r.some(x=>!x.ok))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
