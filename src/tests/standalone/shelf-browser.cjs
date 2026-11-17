// 공개 가짜 책 1,500권만 쓰는 실제 브라우저 경합 시험. 외부 연결은 모두 막는다.
// node src/tests/standalone/shelf-browser.cjs (playwright 필요). RN_BROWSER로 설치된 Chromium 경로 선택.
// RN_SHELF_PERF=1: 16회 전환 중 첫 준비를 뺀 15회 중앙값/P95·자원 수. RN_RESULT로 결과 저장.
// RN_REVIEW_ROOT: 이전 소스를 그대로 재현할 때만 지정. 경합이 남은 소스는 측정 결과 후 실패로 끝남.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.RN_PLAYWRIGHT || 'playwright');
const ROOT = path.resolve(process.env.RN_REVIEW_ROOT || path.join(__dirname, '../../..'));
const B = require(path.join(ROOT, 'shop/shelf-core.js'));
const SH = require(path.join(ROOT, 'cloud/shop.js'));
const rows = B.demoItems(1500, 7).map(x => SH.SHELF_COLS.map(k => k === 'st' ? 's' : ['im','bk','sp'].includes(k) ? null : x[k] ?? null));
const counts = {};
const race = !process.env.RN_SHELF_PERF; let pendingShelf = null;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((req,res) => {
  const u = new URL(req.url, 'http://x'); counts[u.pathname] = (counts[u.pathname] || 0) + 1;
  const json = value => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (u.pathname === '/shop/cfg') return json({ ok:true, open:1, name:'시험 책방', n:rows.length, cats:[], kinds:[], biz:{}, pay:{how:'wait'}, maxItems:20, shelf:{cap:150, fontsOn:false, coverColor:false} });
  if (u.pathname === '/shop/shelf') return json({ok:true, n:rows.length, k:0, kn:1, cols:SH.SHELF_COLS, pre:[], rows});
  if (u.pathname.startsWith('/shop/')) return json({ok:true, items:[], cats:[], total:0});
  const f = path.resolve(ROOT, 'shop', u.pathname.slice(3));
  if (!u.pathname.startsWith('/s/') || !f.startsWith(path.join(ROOT,'shop')+path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('{}'); }
  let text = fs.readFileSync(f, 'utf8');
  if (u.pathname === '/s/shelf.js') text += `\n;{ const original = BQShelf.mount; window.__mounts = {created:0, destroyed:0}; BQShelf.mount = function(...args) { const h = original.apply(this,args); __mounts.created++; const d = h.destroy; let ended=false; h.destroy = function() { if(!ended) {ended=true; __mounts.destroyed++;} return d.apply(this,arguments); }; return h; }; }`;
  const finish = () => { res.writeHead(200, {'Content-Type':(mime[path.extname(f)] || 'text/plain')+'; charset=utf-8'}); res.end(text); };
  if (u.pathname === '/s/shelf.js' && race) pendingShelf = finish; else finish();
});
const stat = a => {const s=[...a].sort((x,y)=>x-y);return {n:s.length,median:s[Math.floor(s.length/2)],p95:s[Math.min(s.length-1,Math.ceil(s.length*.95)-1)]};};
(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+srv.address().port;
  const br=await chromium.launch({...(process.env.RN_BROWSER ? {executablePath:process.env.RN_BROWSER} : {}), headless:true});
  const result={browser:br.version(),root:ROOT,cases:[]};
  try {
    for (const width of [1440,390]) {
      const ctx=await br.newContext({viewport:{width,height:900},deviceScaleFactor:1,...(width===390?{isMobile:true,hasTouch:true}:{})});
      let external=0; await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():(external++,r.abort()));
      const p=await ctx.newPage(), errs=[]; p.on('pageerror',e=>errs.push(e.message));
      await p.addInitScript(u=>{window.BQ_API=u;},base);
      const cdp=await ctx.newCDPSession(p); await cdp.send('Performance.enable');
      const snapshot=async()=>{await cdp.send('HeapProfiler.collectGarbage'); const dom=await cdp.send('Memory.getDOMCounters'); const pm=(await cdp.send('Performance.getMetrics')).metrics; return {...dom,heap:pm.find(x=>x.name==='JSHeapUsedSize').value, mounts:await p.evaluate(()=>window.__mounts||null), resourceHandlers:await p.evaluate(()=>[...document.querySelectorAll('head script,head link')].reduce((n,e)=>n+Number(typeof e.onload==='function')+Number(typeof e.onerror==='function'),0))};};
      await p.goto(base+'/s/index.html#/wish');
      if (race) {
        await p.locator('h1.pt').waitFor(); const before = await snapshot();
        const request = p.waitForRequest(r=>r.url().includes('/s/shelf.js'));
        await p.evaluate(()=>{location.hash='#/shelf';});
        await request;
        await p.evaluate(()=>{location.hash='#/wish';}); await p.waitForTimeout(30);
        await p.evaluate(()=>{location.hash='#/shelf?s=price';});
        await p.locator('.bqs-wait').waitFor();
        assert(pendingShelf, '서가 파일 응답 대기'); pendingShelf(); pendingShelf = null;
        await p.locator('.bqs-case.cur .sp').first().waitFor(); await p.waitForTimeout(1000);
        const on=await snapshot();
        await p.evaluate(()=>{location.hash='#/wish';}); await p.waitForTimeout(4200);
        const off = await snapshot();
        result.cases.push({width,before,on,off,errs,external});
      } else {
        const start=await snapshot(), ms=[], samples=[];
        for(let i=0;i<16;i++){
          await p.evaluate(()=>{window.__t0=performance.now();location.hash='#/shelf';});
          await p.locator('.bqs-case.cur .sp').first().waitFor();
          const x=await p.evaluate(()=>({first:+document.querySelector('.bqs').dataset.firstMs,route:+document.querySelector('.bqs').dataset.firstAt-window.__t0,cases:document.querySelectorAll('.bqs-case').length}));
          if(i) ms.push(x.route);
          await p.evaluate(()=>{location.hash='#/wish';});
          await p.locator('h1.pt').waitFor(); await p.waitForTimeout(100);
          if([0,7,15].includes(i)) samples.push({i,...await snapshot(),...x});
        }
        await p.waitForTimeout(4200);
        result.cases.push({width,start,routeMs:stat(ms),samples,end:await snapshot(),errs,external});
      }
      await ctx.close();
    }
    result.requests=counts; console.log(JSON.stringify(result,null,2));
    if(process.env.RN_RESULT) fs.writeFileSync(process.env.RN_RESULT,JSON.stringify(result,null,2));
    for (const c of result.cases) { assert.deepEqual(c.errs, [], '브라우저 오류 0'); assert.equal(c.external, 0, '시험에서 외부 요청 없음'); if (race) { assert.equal(c.on.mounts.created, 1, '최신 서가 하나만 생성'); assert.equal(c.off.mounts.created, c.off.mounts.destroyed, '나간 화면 모두 정리'); assert.equal(c.off.jsEventListeners - c.off.resourceHandlers, c.before.jsEventListeners - c.before.resourceHandlers, '한 번 받은 파일 태그의 듣개를 제외하면 화면 듣개가 원래대로 복귀'); } }
    console.log('✓ tSHELFLIFE 브라우저 ' + (race ? '경합' : '반복 전환 측정') + ' 통과');
  } finally {await br.close();await new Promise(r=>srv.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;srv.close();});
