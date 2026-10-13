// 1.20.0 새 기능 시험 — node tnew3.js <index.html>
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url(); if (/jszip\.min\.js/.test(u)) return rt.fulfill({ body: fs.readFileSync('/opt/npm-tools/node_modules/jszip/dist/jszip.min.js', 'utf8'), contentType: 'text/javascript' });
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove());
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/data.js', 'utf8') });
  await p.evaluate(() => { const E = { docs: [], forEach() {}, size: 0, empty: true, docChanges: () => [] }; window.__W = []; const Q = (name) => { const q = { where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, get: async () => E, onSnapshot: (cb) => { setTimeout(() => cb(E), 0); return () => {}; }, doc: (id) => ({ id: id || 'x', get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__W.push([name, id, v]); }, update: async () => {}, delete: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; }, collection: (n) => Q(n) }), add: async () => ({ id: 'n' }) }; return q; };
    db.collection = Q; db.batch = () => ({ set() {}, update() {}, delete() {}, commit: async () => {} }); window.fsRestGet = async () => null; window.confirm = () => true; window.alert = (m) => { window.__alert = String(m).slice(0, 120); }; });
  await p.evaluate(() => window.__mkData(3000, { orders: 4000 }));
  const T = {}; const w = (ms) => p.waitForTimeout(ms);
  await p.evaluate(() => { const base = db.collection; const now = Date.now();
    window.DOCS = { 'prd_system/autoSched': { on: true, rev: 2, owner: { primary: 'NEWPC', order: ['JS-MAIN', 'HOME'] }, slots: [{ id: 'bench', job: 'prd:bench', on: true, name: '🎯 집중 벤치마킹', trig: { t: 'time', times: ['01:00'] } }] },
      'prd_jobs/autoSched': { runs: {} }, 'prd_system/jobStats': { jobs: {} }, 'prd_jobs/pcBeat': { pcs: { 'JS-MAIN': { atMs: now - 60e3, ok: true, ver: '1.63.7' }, HOME: { atMs: now, ok: true }, NEWPC: { atMs: now - 20 * 60e3 } } },
      'prd_system/autoCatalog': { jobs: [{ job: 'prd:bench', label: '🎯 집중 벤치마킹', g: '판매자', d: '' }] }, 'app_settings/ext': { on: true } };
    window.__SETS = [];
    db.collection = (name) => { const b0 = base(name); return { ...b0, doc: (id) => { const path = name + '/' + id; if (!(path in DOCS)) return b0.doc(id); return { id, path, get: async () => ({ exists: true, data: () => DOCS[path] }), onSnapshot: (cb) => { setTimeout(() => cb({ exists: true, data: () => DOCS[path] }), 0); return () => {}; }, set: async (v, o) => { __SETS.push([path, JSON.stringify(v).slice(0, 300)]); Object.assign(DOCS[path], v); } }; } }; };
    S._benchUn = () => {}; S.bench = { seed190: 1, cmpCols: ['gone', 'add', 'total'], targets: [{ sc: '11', name: '가나다', on: true }, { sc: '22', name: 'B', on: true }], groups: [] };
    S.sellers = S.sellers || new Map(); S.sellers.set('sc_11', { id: 'sc_11', sc: '11', name: '가나다', cancel3m: 0.08 }); S.sellers.set('sc_22', { id: 'sc_22', sc: '22', name: 'B' }); });
  // ① 판매 추정 열
  T.sale = await p.evaluate(() => { const c = BENCH_CMP_COLS.find((x) => x.k === 'sale'); const r1 = { t: { sc: '11' }, st: { n: 5, r30: { gone: 10 }, perDayGone: 12 } }; const r2 = { t: { sc: '22' }, st: { n: 5, r30: { gone: 10 }, perDayGone: 12 } }; return { cols: benchCmpCols().map((x) => x.k).join(','), v1: c.v(r1), cell1: c.cell(r1).replace(/<[^>]+>/g, ''), v2: c.v(r2), cell2: c.cell(r2).replace(/<[^>]+>/g, ''), cx2: benchCxOf('22'), our: benchOurCx(), adm: isAdminDevice() }; });
  T.our2 = await p.evaluate(() => { const d = dstr(new Date()); const o = [...S.orders.values()].filter((x) => x.kind === 'sale'); let n = 0, cx = 0; o.forEach((x) => { if (String(x.orderedAt || '') >= d.slice(0, 8)) (x.items || []).forEach((it) => { n++; if (it.lineStatus === 'cancelledInOrder') cx++; }); }); S._memo && (S._memo = {}); const it = o[0] && o[0].items && o[0].items[0]; return { n, cx, sample: o[0] && { kind: o[0].kind, at: o[0].orderedAt, st: it && it.lineStatus } }; });
  // ② 담당 PC
  await p.evaluate(() => { S.devOk = true; window.__dn = 'JS-MAIN'; try { localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.auto.un = null; autoWatch(); }); await w(300);
  await p.setViewportSize({ width: 1400, height: 950 }); await p.evaluate(() => openAuto()); await w(1800);
  T.own = await p.evaluate(() => { const e = document.querySelector('#rnas .as-own'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : 'none'; });
  await p.screenshot({ path: __dirname + '/../shots120/own.png', clip: { x: 0, y: 0, width: 1400, height: 420 } });
  await p.evaluate(() => { const s = document.querySelector('#as_ownadd'); if (s) { s.value = s.options[1] ? s.options[1].value : ''; s.dispatchEvent(new Event('change')); } }); await w(700);
  T.own2 = await p.evaluate(() => [__SETS.filter((x) => x[0] === 'prd_system/autoSched').map((x) => x[1]).pop(), document.getElementById('toast').textContent]);
  await p.evaluate(() => { const b = document.querySelector('[data-ownmv^="HOME|-1"]'); if (b) b.click(); }); await w(700);
  T.own3 = await p.evaluate(() => [JSON.stringify(DOCS['prd_system/autoSched'].owner), document.getElementById('toast').textContent]);
  await p.fill('#as_ownn', 'NEW-2'); await p.evaluate(() => document.getElementById('as_ownset').click()); await w(700);
  T.own4 = await p.evaluate(() => [JSON.stringify(DOCS['prd_system/autoSched'].owner), (document.querySelector('#rnas .as-own') || {}).innerText.replace(/\s+/g, ' ').slice(0, 200)]);
  await p.evaluate(() => history.back()); await w(500);
  // ③ 비용
  await p.evaluate(() => { const ym = dstr(new Date()).slice(0, 7); S._expUn = () => {}; S.expMan = {}; S.costAuto = new Map([[ym, { ym, days: { [ym + '-05']: { rate: 1400, lines: [{ service: 'Firestore', item: '문서 읽기', qty: 1, unit: '건', krw: 300, usd: 0.2 }], errs: ['fsRead: Permission denied'] } } }]]); S.costBill = new Map([[ym, { ym, mtd: 12345, cur: 'KRW', at: new Date().toISOString() }]]); S.sec.pu_exp = true; S.tab = 'purchase'; renderTabs(); renderMainNow(); }); await w(1200);
  T.exp = await p.evaluate(() => { const e = document.getElementById('exp_box'); return e ? e.textContent.replace(/\s+/g, ' ').slice(0, 900) : 'none'; });
  T.expX = await p.evaluate(() => { const X = otherExpForMonth(dstr(new Date()).slice(0, 7)); return [X.estUsed, X.estFull, X.total]; });
  await p.evaluate(() => { S.costBill = new Map(); expRerender(); }); await w(500);
  T.exp2 = await p.evaluate(() => { const e = document.getElementById('exp_box'); return e ? e.textContent.replace(/\s+/g, ' ').slice(0, 900) : 'none'; });
  // ④ 판매자 탭 TOP10 맨 위
  await p.evaluate(() => { S.tab = 'sellers'; renderTabs(); renderMainNow(); }); await w(1200);
  T.sl = await p.evaluate(async () => { const m = document.getElementById('main'); const b = m.querySelector('#rankbtn2'); const first = m.firstElementChild; const r0 = getComputedStyle(document.getElementById('rank')).display; b && b.click(); await new Promise((r) => setTimeout(r, 600)); const rk = document.getElementById('rank'); return { btnFirst: !!(first && first.querySelector('#rankbtn2')), before: r0, after: getComputedStyle(rk).display, pos: getComputedStyle(rk).position, txt: rk.innerText.slice(0, 60) }; });
  console.log(JSON.stringify(T, null, 1)); console.log('ERRS', errs.slice(0, 8)); await br.close(); })();
