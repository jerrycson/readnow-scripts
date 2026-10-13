// 상품 탭·수동 일괄·등록 속도 측정 — node tperf.js <index.html> [N] [profile:1]
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const N = +(process.argv[3] || 20000); const PROF = process.argv[4] === '1';
const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove());
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/data.js', 'utf8') });
  await p.evaluate(() => { const E = { docs: [], forEach() {}, size: 0, empty: true, docChanges: () => [] }; const Q = (name) => { const q = { where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, get: async () => E, onSnapshot: (cb) => { setTimeout(() => cb(E), 0); return () => {}; }, doc: (id) => ({ id: id || 'x', get: async () => ({ exists: false, data: () => undefined }), set: async () => {}, update: async () => {}, delete: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; }, collection: (n) => Q(n) }), add: async () => ({ id: 'n' }) }; return q; };
    db.collection = Q; db.batch = () => ({ set() {}, update() {}, delete() {}, commit: async () => {} }); window.fsRestGet = async () => null; });
  const info = await p.evaluate((N) => window.__mkData(N, { orders: Math.round(N * 1.5) }), N); console.log('DATA', JSON.stringify(info));
  const cdp = await p.context().newCDPSession(p); if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); }
  const prof = async (label, fn) => { if (PROF) await cdp.send('Profiler.start'); const t = await fn(); if (PROF) { const { profile } = await cdp.send('Profiler.stop'); const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map(); profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0))); for (const [id, us] of cnt) { const n = byId.get(id); const k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + us); } const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)}ms`); console.log('  PROF', label, '\n    ' + top.join('\n    ')); } console.log('TIME', label, t); };
  if (process.env.TABS) {
  for (const tab of ['home', 'biz', 'orders', 'sellers', 'purchase', 'products', 'search', 'market']) {
    await prof(tab + ' 첫 그림', () => p.evaluate((tab) => { S.tab = tab; renderTabs && renderTabs(); const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }, tab));
    await p.waitForTimeout(1500);
    await prof(tab + ' 다시 그림(자료 바뀜 p·o)', () => p.evaluate(() => { bump('p'); bump('o'); const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }));
  }
  } else {
  // 1) 상품 탭 첫 그림 (계산 기억 없음)
  await prof('상품 탭 첫 그림', () => p.evaluate(() => { S.tab = 'products'; renderTabs && renderTabs(); const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }));
  await p.waitForTimeout(1500);
  await prof('상품 탭 다시 그림 (자료 그대로)', () => p.evaluate(() => { const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('상품 탭 다시 그림 (상품 하나 바뀜 bump p)', () => p.evaluate(() => { bump('p'); const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('상품 탭 다시 그림 (주문 바뀜 bump o)', () => p.evaluate(() => { bump('o'); const t0 = performance.now(); renderMainNow(); return Math.round(performance.now() - t0) + 'ms'; }));
  // 2) 그룹 열기
  await prof('그룹 열기 (openBatchGroup → 카드 보일 때까지)', () => p.evaluate(async () => { const t0 = performance.now(); const pr = openBatchGroup('b_g1'); const sh = document.querySelector('#sheet'); let tFirst = null; while (performance.now() - t0 < 30000) { await new Promise((r) => setTimeout(r, 5)); if (!tFirst && sh.querySelector('.bform')) tFirst = performance.now() - t0; if (sh.querySelector('#b_res .card.pq')) break; } await pr; return `틀 ${Math.round(tFirst)}ms · 결과 ${Math.round(performance.now() - t0)}ms · 상품 ${S.batchRes ? S.batchRes.length : '?'}개 · 카드 ${sh.querySelectorAll('#b_res .card.pq').length}`; }));
  await p.waitForTimeout(500);
  await prof('그룹 탭 바꾸기 (결정 대기)', () => p.evaluate(() => { const b = document.querySelector('[data-btab="pick"]'); const t0 = performance.now(); b.click(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('그룹 탭 바꾸기 (선택 대기)', () => p.evaluate(() => { const b = document.querySelector('[data-btab="sel"]'); const t0 = performance.now(); b.click(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('결정 대기로 보내기 1개 (→ 버튼)', () => p.evaluate(() => { const b = document.querySelector('[data-bto]'); if (!b) return '버튼 없음'; const t0 = performance.now(); b.click(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('입력칸 −5%', () => p.evaluate(() => { const b = document.querySelector('[data-bstep="-1"]'); if (!b) return '없음'; const t0 = performance.now(); b.click(); return Math.round(performance.now() - t0) + 'ms'; }));
  await prof('조건 바꿈(최소 판매가 입력 → 세기)', () => p.evaluate(async () => { const el = document.querySelector('[data-bf="pmin"]'); const t0 = performance.now(); el.value = '3000'; el.oninput(); await new Promise((r) => setTimeout(r, 150)); return Math.round(performance.now() - t0 - 120) + 'ms (+120 대기 뺌)'; }));
  await p.evaluate(() => history.back()); await p.waitForTimeout(800);
  // 3) 새 그룹
  await prof('새 그룹 열기', () => p.evaluate(() => { const t0 = performance.now(); S.batchC = null; S.batchId = null; S.batchSt = null; S.batchMeta = null; S.batchRes = null; openBatch(JSON.parse(JSON.stringify(BATCH_DEF))); return Math.round(performance.now() - t0) + 'ms'; }));
  await p.evaluate(() => history.back()); await p.waitForTimeout(800);
  // 4) 등록
  await prof('등록 열기', () => p.evaluate(async () => { const t0 = performance.now(); openRegister(); await new Promise((r) => setTimeout(r, 0)); return Math.round(performance.now() - t0) + 'ms'; }));
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  await prof('상품 전체 보기', () => p.evaluate(() => { const t0 = performance.now(); openProdAll(); return Math.round(performance.now() - t0) + 'ms'; }));
  }
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 8).join('\n')); await br.close(); })();
