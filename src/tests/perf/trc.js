// 1.20.0 새 기능 시험 — node tnew3.js <index.html>
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove());
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/data.js', 'utf8') });
  await p.evaluate(() => { const E = { docs: [], forEach() {}, size: 0, empty: true, docChanges: () => [] }; window.__W = []; const Q = (name) => { const q = { where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, get: async () => E, onSnapshot: (cb) => { setTimeout(() => cb(E), 0); return () => {}; }, doc: (id) => ({ id: id || 'x', get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__W.push([name, id, v]); }, update: async () => {}, delete: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; }, collection: (n) => Q(n) }), add: async () => ({ id: 'n' }) }; return q; };
    db.collection = Q; db.batch = () => { const ops = []; return { set(ref, v) { ops.push([ref.id, v]); }, update() {}, delete() {}, commit: async () => { window.__W.push(['batch', ops.length, ops.map((o) => o[1] && o[1].ctx).filter(Boolean).join(',')]); } }; }; window.fsRestGet = async () => null; window.confirm = () => true; window.alert = (m) => { window.__alert = String(m).slice(0, 120); }; });
  await p.evaluate(() => window.__mkData(3000, { orders: 4000 }));
  const T = {}; const w = (ms) => p.waitForTimeout(ms);
  // 🛰 원격: 가짜 rn_status·pc_ctl
  await p.evaluate(() => { const base = db.collection; const now = Date.now(); window.__CTL = { cmds: {}, acks: {}, log: [] }; window.__ctlCb = null; window.__CW = [];
    const docs = [{ id: 'prd_a_1', d: { tool: '상품 수집기', pcName: 'HOME', ver: '1.57.6', atMs: now - 60000, running: '집중 벤치마킹' } }, { id: 'prd_b_1', d: { tool: '상품 수집기', pcName: 'JS-MAIN', ver: '1.59.2', atMs: now - 30000 } }, { id: 'crm_b', d: { tool: '고객 수집기', pcName: 'JS-MAIN', atMs: now } }];
    const snap = { docs: docs.map((x) => ({ id: x.id, data: () => x.d })), forEach(f) { this.docs.forEach(f); }, size: docs.length, empty: false, docChanges: () => docs.map((x) => ({ type: 'added', doc: { id: x.id, data: () => x.d } })) };
    db.collection = (name) => { if (name === 'rn_status') { const q = { where: () => q, orderBy: () => q, limit: () => q, get: async () => snap, onSnapshot: (cb) => { setTimeout(() => cb(snap), 0); return () => {}; } }; return q; }
      if (name === 'crm_system') { const b0 = base(name); return { ...b0, doc: (id) => id === 'pc_ctl' ? { id, onSnapshot: (cb) => { window.__ctlCb = cb; setTimeout(() => cb({ exists: true, data: () => window.__CTL }), 0); return () => {}; }, set: async (v) => { window.__CW.push(JSON.parse(JSON.stringify(v, (k, x) => (x && x._methodName ? '[FV]' : x)))); Object.assign(window.__CTL.cmds, v.cmds || {}); } } : id === 'collector_version' ? { id, onSnapshot: (cb) => { setTimeout(() => cb({ exists: true, data: () => ({ ver: '1.59.2' }) }), 0); return () => {}; }, get: async () => ({ exists: true, data: () => ({ ver: '1.59.2' }) }) } : b0.doc(id) }; }
      return base(name); }; });
  console.log('LOAD', await p.evaluate(async () => { try { const o = await Promise.race([mgrLoad(), new Promise((r) => setTimeout(() => r('TIMEOUT'), 4000))]); return typeof o === 'string' ? o : JSON.stringify(Object.keys(o)) + ' pcs=' + o.pcs.length; } catch (e) { return 'ERR ' + e.message + e.stack; } }));
  await p.evaluate(() => openMgr()); await w(1500);
  T.ctl0 = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; const i = t.indexOf('PC 원격 조작'); return t.slice(i, i + 500); });
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-pcsel]')].find((x) => /HOME/.test(x.textContent)); b && b.click(); }); await w(300);
  T.home = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; const i = t.indexOf('🖥 HOME'); return t.slice(i, i + 300); });
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-pcsel]')].find((x) => /JS-MAIN/.test(x.textContent)); b && b.click(); }); await w(300);
  console.log('DBG', JSON.stringify(T)); console.log(await p.evaluate(() => document.querySelector('#sheet').innerText.slice(0, 900))); await p.click('[data-pcctl="JS-MAIN|update"]'); await w(200); T.armed = await p.evaluate(() => document.querySelector('[data-pcctl="JS-MAIN|update"]').textContent);
  await p.click('[data-pcctl="JS-MAIN|update"]'); await w(500); T.writes = await p.evaluate(() => window.__CW);
  await p.evaluate(() => { const c = window.__CTL.cmds['JS-MAIN']; window.__ctlCb({ exists: true, data: () => window.__CTL }); }); await w(300);
  T.waiting = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; const i = t.indexOf('보냄'); return t.slice(i - 20, i + 80); });
  await p.evaluate(() => { const c = window.__CTL.cmds['JS-MAIN']; window.__CTL.acks['JS-MAIN'] = { id: c.id, cmd: 'update', state: 'done', msg: '새 판 1.59.3로 바뀜 (전 1.59.2)', ver: '1.59.3', at: new Date().toISOString() }; window.__ctlCb({ exists: true, data: () => window.__CTL }); }); await w(300);
  T.acked = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; const i = t.indexOf('새 판 1.59.3'); return i >= 0 ? t.slice(i - 20, i + 60) : 'NO'; });
  await p.screenshot({ path: __dirname + '/../shots120/ctl.png' });
  await p.evaluate(() => history.back()); await w(500);
  // 홈 알림: 옛 판 PC 줄
  T.alert = await p.evaluate(() => { S.runs = S.runs || {}; S.runs.prd_a_1 = { tool: '상품 수집기', pcName: 'HOME', ver: '1.57.6', atMs: Date.now() }; S.runs.prd_b_1 = { tool: '상품 수집기', pcName: 'JS-MAIN', ver: '1.59.2', atMs: Date.now() }; return bizAlerts(bizCalc()).filter((a) => /옛 수집기/.test(a.t)).map((a) => a.t + ' ' + a.key); });
  // 오늘 확인할 것: 폴더 깜빡임 — 화면에 '자리 안 잡힌' 알림 칸이 한 번이라도 들어가는지
  T.flick = await p.evaluate(async () => { const raw = alertsHtml([{ lv: 'amber', t: '테스트 A 3건', key: 'x' }, { lv: 'info', t: '테스트 B', key: 'y' }]); const aidB = alertAid({ lv: 'info', t: '테스트 B', key: 'y' }); S.alay = { order: [], folders: [{ id: 'f_defer', name: '미루기', aids: [aidB] }] };
    let bad = 0; const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { const els = n.matches && n.matches('.alerts') ? [n] : [...(n.querySelectorAll ? n.querySelectorAll('.alerts') : [])]; els.forEach((e) => { if (!e.dataset.enh) bad++; }); } }))); mo.observe(document.body, { childList: true, subtree: true });
    const host = document.createElement('div'); document.body.appendChild(host); for (let i = 0; i < 4; i++) { host.innerHTML = alertsLaid(raw); await new Promise((r) => setTimeout(r, 40)); }
    mo.disconnect(); const inF = host.querySelector('.alfold .alrow[data-aid]'); const r = { bad, inFolder: inF && inF.dataset.aid === aidB, outside: host.querySelectorAll(':scope .alerts > .alrow').length, cache: localStorage.getItem('rn-alay-cache') }; host.remove(); return r; });
  // 종합 비교 이름 6글자
  T.nm = await p.evaluate(() => bhcName('가나다라마바사아자차카') + ' | ' + bhcName('😀😀😀😀😀😀😀'));
  console.log(JSON.stringify(T, null, 1));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit|Could not reach Cloud Firestore/.test(e)).slice(0, 10).join('\n')); await br.close(); })();
