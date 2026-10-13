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
  await p.evaluate(() => { const base = db.collection; const now = Date.now(); const day = new Date(now + 9 * 3600e3).toISOString().slice(0, 10);
    window.DOCS = { 'prd_system/autoSched': { on: true, rev: 2, slots: [{ id: 'qna', job: 'crm:qna', on: true, trig: { t: 'time', times: ['09:00', '13:00'] } }, { id: 'bench', job: 'prd:bench', on: true, name: '🎯 집중 벤치마킹', trig: { t: 'time', times: ['01:00'] } }, { id: 'kpipa', job: 'prd:kpipa', on: true, trig: { t: 'time', times: ['14:40'] } }] },
      'prd_jobs/autoSched': { runs: { [`qna@${day}@09:00`]: { by: 'HOME', at: new Date(now - 3600e3).toISOString(), st: new Date(now - 3700e3).toISOString(), state: 'running', beat: new Date().toISOString(), job: 'crm:qna' } } },
      'prd_system/jobStats': { jobs: { 'bench:11': { runs: [{ at: new Date().toISOString(), ms: 30 * 60e3, st: 'done' }] } } },
      'prd_system/autoCatalog': { jobs: [{ job: 'crm:qna', label: '묻고 답하기', g: '고객·주문', d: '문의' }, { job: 'prd:bench', label: '🎯 집중 벤치마킹 — 정한 순서대로 모두', g: '판매자', d: '' }, { job: 'prd:kpipa', label: '출판 판매 통계', g: '기타', d: '', par: true }] }, 'app_settings/ext': { on: true } };
    window.__SETS = [];
    db.collection = (name) => { const b0 = base(name); return { ...b0, where: b0.where, orderBy: b0.orderBy, limit: b0.limit, get: b0.get, onSnapshot: b0.onSnapshot, add: b0.add, doc: (id) => { const path = name + '/' + id; if (!(path in DOCS)) return b0.doc(id); return { id, path, get: async () => ({ exists: true, data: () => DOCS[path] }), onSnapshot: (cb) => { setTimeout(() => cb({ exists: true, data: () => DOCS[path] }), 0); return () => {}; }, set: async (v, o) => { __SETS.push([path, JSON.stringify(v).slice(0, 200)]); Object.assign(DOCS[path], v); } }; } }; };
    S._benchUn = () => {}; S.bench = { seed190: 1, targets: [{ sc: '11', name: '가나다라마바사아자차', on: true }, { sc: '22', name: 'B', on: true }], groups: [] }; });
  await p.evaluate(() => { S.auto.un = null; autoWatch(); }); await w(300);
  T.chip = await p.evaluate(() => [document.getElementById('hauto').textContent, document.getElementById('hauto').title.slice(0, 120), !!document.getElementById('hscore'), !!document.getElementById('hmgr')]);
  await p.evaluate(() => { S.sec.set_auto = true; S.tab = 'settings'; renderTabs(); renderMainNow(); }); await w(800);
  T.set = await p.evaluate(() => { const d = document.querySelector('details[data-sec="set_auto"]'); return d ? d.innerText.slice(0, 600) : 'none'; });
  T.ed = await p.evaluate(() => ({ cards: document.querySelectorAll('#rnas .as-card').length, segs: document.querySelectorAll('#rnas .tl-b .sg').length, par: document.querySelectorAll('#rnas .tl-b.par').length, bi: document.querySelectorAll('#rnas .bi').length, inl: document.getElementById('rnas').className }));
  await p.evaluate(() => document.querySelector('details[data-sec="set_auto"]').scrollIntoView()); await w(200); await p.screenshot({ path: __dirname + '/../shots120/set_auto.png' });
  // editor save (admin?)
  T.adm = await p.evaluate(() => isAdminDevice());
  // bench hub cmp
  await p.evaluate(() => openBenchHub('cmp')); await w(800); T.cmp = await p.evaluate(() => { const t = document.querySelector('#sheet table.bhc'); return t ? [...t.querySelectorAll('tr')].slice(0, 3).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 160)) : (document.querySelector('#sheet').innerText.slice(0, 400)); });
  await p.screenshot({ path: __dirname + '/../shots120/cmp.png' });
  await p.evaluate(() => openBenchHub('board', true)); await w(500); T.board = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; const i = t.indexOf('수집 그룹'); return t.slice(i, i + 500); });
  await p.evaluate(() => history.back()); await w(300);
  // manual buttons
  await p.evaluate(() => openManual()); await w(400); T.man = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-mopen]')].map((b) => b.textContent)); await p.evaluate(() => document.querySelector('#sheet [data-mopen="metrics"]').click()); await w(300); T.modal = await p.evaluate(() => document.getElementById('modal').classList.contains('on')); await p.evaluate(() => { closeModal(); history.back(); }); await w(300);
  // undo logic with fake refs
  T.undo = await p.evaluate(async () => { const store = { a: { x: 1, y: 2 } }; const ref = { path: 'app_settings/bench', get: async () => ({ exists: true, data: () => JSON.parse(JSON.stringify(store.a)) }), set: async (v, o) => { for (const [k, val] of Object.entries(v)) { if (val && val.isEqual && val.isEqual(firebase.firestore.FieldValue.delete())) delete store.a[k]; else store.a[k] = val; } } };
    undoRec(ref, ['x', 'z'], true, { x: 1, z: undefined }, { x: 5, z: 7 }); store.a.x = 5; store.a.z = 7; await undoDo(false); const r1 = JSON.stringify(store.a); await undoDo(true); const r2 = JSON.stringify(store.a); store.a.x = 9; await undoDo(false); const r3 = JSON.stringify(store.a); return [r1, r2, r3, UNDO.hist.length, UNDO.fut.length]; });
  console.log(JSON.stringify(T, null, 1)); console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit|Could not reach Cloud Firestore/.test(e)).slice(0, 10).join('\n')); await br.close(); })();
