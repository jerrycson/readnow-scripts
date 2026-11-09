// bALW — 🪟 알라딘 창 속도 재기(가짜 알라딘 서버) · 고치기 전/뒤 · PC·휴대폰 흉내 · 크롬에서 직접 열기와 견줌
// 쓰는 법: RN_PORT=8791 node bALW.js [pc|phone] [live|page|default]
// 가짜 알라딘: 요청마다 지연(RTT + 크기/대역폭) · 데스크톱 화면 HTML 300KB + 그림 60 + 스크립트 10(각 30ms 계산) · 휴대폰(UA)은 m. 화면 HTML 90KB + 그림 25 + 스크립트 5
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const dev = process.argv[2] || 'pc', mode = process.argv[3] || 'default', N = +(process.env.N || 5);
const NET = dev === 'phone' ? { rtt: 120, bw: 10e6 / 8 } : { rtt: 30, bw: 50e6 / 8 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROBE = `<script>(function(){var P=function(k){var m={rnb:k,t:performance.timeOrigin+performance.now()};try{if(parent!==window)parent.postMessage(m,'*');else (window.__b=window.__b||[]).push(m);}catch(e){}};new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.name==='first-contentful-paint'){var m={rnb:'fcp',t:performance.timeOrigin+e.startTime};try{if(parent!==window)parent.postMessage(m,'*');else (window.__b=window.__b||[]).push(m);}catch(x){}}})}).observe({type:'paint',buffered:true});addEventListener('DOMContentLoaded',function(){P('dcl')});addEventListener('load',function(){P('load')});})();</script>`;
function fakePage(mob) { const nI = mob ? 25 : 60, nS = mob ? 5 : 10, pad = 'x'.repeat(mob ? 90000 : 300000); let h = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">${PROBE}<title>가짜 알라딘</title>`;
  for (let i = 0; i < nS; i++) h += `<script src="/js/s${i}.js"></script>`; h += `</head><body><h1>알라딘 상품 화면(가짜)</h1><div style="display:none">${pad}</div>`;
  for (let i = 0; i < nI; i++) h += `<img src="//image.aladin.co.kr/img/i${i}.jpg" width="80" height="110">`; return h + '</body></html>'; }
const JS = 'var t=performance.now();while(performance.now()-t<30){};';
async function aladinRoute(ctx, stat) { await ctx.route(/^https:\/\/(www|m|image)\.aladin\.co\.kr\//, async (r) => { const u = r.request().url(); stat.n++; if (/\.aspx/i.test(u) && !stat.t1) stat.t1 = Date.now(); const mob = /Mobile|iPhone|Android/.test(r.request().headers()['user-agent'] || '');
    if (/\/(shop|m)\/.*\.aspx/i.test(u) && /^https:\/\/www\./.test(u) && mob) { await sleep(NET.rtt * 2); stat.n++; stat.b += 200; } /* 휴대폰 UA → m. 으로 넘김(알라딘처럼) — 넘김 한 번 = 왕복 2번 늘림으로 흉내 */
    let body, ct; if (/\.aspx/i.test(u)) { body = fakePage(mob); ct = 'text/html; charset=utf-8'; } else if (/\.js/.test(u)) { body = JS + '/*' + 'j'.repeat(50000) + '*/'; ct = 'application/javascript'; } else { body = Buffer.alloc(15000, 1); ct = 'image/jpeg'; }
    const sz = Buffer.byteLength(body); stat.b += sz; await sleep(NET.rtt + (sz / NET.bw) * 1000); return r.fulfill({ status: 200, body, contentType: ct }); }); }
function rss(pid) { try { const out = execSync(`ps -o pid=,ppid=,rss= -A`).toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number)); const kids = new Set([pid]); let ch = true; while (ch) { ch = false; for (const [p, pp] of out) if (kids.has(pp) && !kids.has(p)) { kids.add(p); ch = true; } } return Math.round(out.filter(([p]) => kids.has(p)).reduce((a, [, , r]) => a + r, 0) / 1024); } catch (e) { return -1; } }
const UA_PH = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async () => {
  const args = dev === 'phone' ? ['--disable-site-isolation-trials'] /* 안드로이드 크롬처럼 알라딘 틀을 웹앱과 같은 프로세스에 */ : [];
  const b = await chromium.launch({ args }); const bpid = process.pid; /* 이 node의 자손 프로세스(크로미움 모두) RSS 합 */
  const copt = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: UA_PH, deviceScaleFactor: 3 } : { viewport: { width: 1400, height: 900 } };
  // ① 크롬에서 직접 열기 — 새 탭에 알라딘 주소
  const D = []; for (let k = 0; k < N; k++) { const ctx = await b.newContext(copt); const st = { n: 0, b: 0 }; await aladinRoute(ctx, st); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); if (dev === 'phone') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now(); await p.goto('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=30001', { waitUntil: 'load' }); await sleep(300); const ev = await p.evaluate(() => window.__b || []); const g = (k) => { const e = ev.find((x) => x.rnb === k); return e ? Math.round(e.t - t0) : null; }; D.push({ fcp: g('fcp'), load: g('load'), req: st.n, kb: Math.round(st.b / 1024) }); await ctx.close(); }
  // ② 웹앱 🪟 알라딘 창
  const W = []; const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
  for (let k = 0; k < N; k++) { const ctx = await b.newContext(copt); const st = { n: 0, b: 0 }; const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
    await aladinRoute(p, st);
    if (mode !== 'default') await p.addInitScript((m) => { try { localStorage.setItem('rn-alpv-mode3', m); localStorage.setItem('rn-alpv-mode4', m); } catch (e) {} }, mode);
    await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(300); await p.addStyleTag({ content: '#seenp,#dlp,.verbar{display:none!important}' });
    await p.evaluate(async () => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true;
      const d = { stage: 'sel', isbn: '9791100000021', grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, info: { title: '알라딘 창 책', isbn13: '9791100000021', itemId: '30001', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t } };
      await db.collection('reg_items').doc('w01').set(d); S.regItems.set('w01', { id: 'w01', ...d }); try { localStorage.setItem('rn-reg-view', 'compact'); } catch (e) {} S.regT = 'sel'; openRegister(); });
    await p.waitForTimeout(1500); if (dev === 'phone') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.evaluate(() => { window.__b = []; addEventListener('message', (e) => { if (e.data && e.data.rnb) window.__b.push(e.data); }); });
    const m0 = rss(bpid); st.n = 0; st.b = 0; st.t1 = 0; const sel = '.rgrow[data-rgexp="w01"] [data-rgalw]';
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await sleep(200); const t0 = await p.evaluate(() => Date.now()); if (dev === 'phone') { const bx = await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: ((x) => x ? x.tagName + '#' + x.id + '.' + x.className : '')(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }; }, sel); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bx.x, y: bx.y }] }); await sleep(+(process.env.HOLD || 100)); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); /* 손가락 누름 약 0.1초(사람) */ if (k === 0) console.log('tap', JSON.stringify(bx)); } else { const r = await p.locator(sel).boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await sleep(+(process.env.HOVER || 0)); await p.mouse.down(); await sleep(+(process.env.HOLD || 80)); await p.mouse.up(); } /* 마우스: 올림(HOVER ms) → 누름 약 0.08초 → 뗌 */
    const tc = await p.evaluate(() => Date.now()); const t0c = tc; // 누른 뒤
    let ev = []; const lim = Date.now() + 40000; while (Date.now() < lim) { ev = await p.evaluate(() => window.__b); if (ev.find((x) => x.rnb === 'load')) break; await sleep(100); }
    await sleep(300); ev = await p.evaluate(() => window.__b); const g = (kk) => { const e = ev.find((x) => x.rnb === kk); return e ? Math.round(e.t - t0) : null; };
    const info = await p.evaluate(() => { const d = document.querySelector('.alpv'); return { md: typeof alPvMode === 'function' ? alPvMode() : '?', live: !!(d && d.querySelector('iframe.alpv-live')), ld: !!(d && d.querySelector('.alpv-ld')), txt: d ? d.innerText.slice(0, 120).replace(/\s+/g, ' ') : '' }; });
    const heap = await cdp.send('Performance.enable').then(() => cdp.send('Performance.getMetrics')).then((r) => Math.round((r.metrics.find((x) => x.name === 'JSHeapUsedSize') || {}).value / 1048576)).catch(() => -1);
    W.push({ req0: st.t1 ? st.t1 - t0 : null, fcp: g('fcp'), load: g('load'), req: st.n, kb: Math.round(st.b / 1024), md: info.md, live: info.live, stuck: !g('fcp') ? JSON.stringify(info) : '', rssUp: rss(bpid) - m0, heapMB: heap }); await ctx.close(); }
  const med = (A, k) => { const v = A.map((x) => x[k]).filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
  console.log(JSON.stringify({ dev, mode, net: NET, direct: { fcp: med(D, 'fcp'), load: med(D, 'load'), req: D[0].req, kb: D[0].kb }, webapp: { req0: med(W, 'req0'), fcp: med(W, 'fcp'), load: med(W, 'load'), req: W[0].req, kb: W[0].kb, md: W[0].md, rssUpMB: med(W, 'rssUp'), heapMB: med(W, 'heapMB'), fcpOk: W.filter((x) => x.fcp).length + '/' + W.length, stuck: W[0].stuck } }));
  await b.close(); })();
