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
  await p.evaluate(() => { window.__mkData && 0; });
  const T = {}; const w = (ms) => p.waitForTimeout(ms);
  await p.evaluate(() => {
    window.FAKE = { colA: { a1: { x: 1 }, a2: { x: 2 }, a3: { x: 3 } }, colB: { b1: { y: 'p' } } };
    const mkSnap = (name, docs) => ({ empty: !docs.length, size: docs.length, docs, forEach: (f) => docs.forEach(f) });
    const docOf = (name, id) => ({ id, ref: { path: name + '/' + id }, data: () => JSON.parse(JSON.stringify(FAKE[name][id])) });
    const Q = (name, after, lim) => ({ orderBy: () => Q(name, after, lim), limit: (n) => Q(name, after, n), startAfter: (a) => Q(name, a, lim), where: () => Q(name, after, lim),
      get: async () => { const ids = Object.keys(FAKE[name] || {}).sort().filter((id) => !after || id > after).slice(0, lim || 500); return mkSnap(name, ids.map((id) => docOf(name, id))); },
      onSnapshot: (cb) => { setTimeout(() => cb(mkSnap(name, [])), 0); return () => {}; }, doc: (id) => ({ id, get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; } }) });
    db.collection = (n) => Q(n); db.collectionGroup = (n) => Q('__none'); window.FB_SUBGROUPS_SAVE = 1;
    window.__zips = []; const ocu = URL.createObjectURL; URL.createObjectURL = (b) => { window.__zips.push(b); return ocu(b); };
    window.ask = async () => true; S.fbInv = { ok: true, cols: [{ id: 'colA', n: 3 }, { id: 'colB', n: 1 }], subs: [] }; fbDataCols = () => ['colA', 'colB']; });
  const runOnce = async (kind) => { await p.evaluate((kind) => { document.body.insertAdjacentHTML('beforeend', `<input type="radio" name="fbx_mode" value="zip" checked><input type="radio" name="fbx_kind" value="${kind}" checked>`); }, kind);
    await p.evaluate(() => exportAllFirebase(null, null)); await w(2500); await p.evaluate(() => { document.querySelectorAll('input[name=fbx_mode],input[name=fbx_kind]').forEach((x) => x.remove()); fbxSaveRun(null); S.fbxLive = null; }); };
  const readZips = () => p.evaluate(async () => { const out = []; for (const b of window.__zips) { const z = await JSZip.loadAsync(b); const files = {}; for (const f of Object.keys(z.files)) if (!z.files[f].dir) files[f] = await z.files[f].async('string'); out.push(files); } window.__zips = []; return out; });
  await runOnce('full'); T.full = await readZips(); T.base = await p.evaluate(() => fbxBase());
  await p.evaluate(() => { FAKE.colA.a2 = { x: 22 }; delete FAKE.colA.a3; FAKE.colA.a4 = { x: 4 }; });
  await runOnce('inc'); T.inc = await readZips();
  await p.evaluate(() => { FAKE.colB.b2 = { y: 'q' }; });
  await runOnce('inc'); T.inc2 = await readZips();
  // 합치기: 모든 파일을 이름 순으로
  const all = {}; [...T.full, ...T.inc, ...T.inc2].forEach((z) => Object.assign(all, z));
  const state = {}; Object.keys(all).sort().forEach((f) => { if (!/\.jsonl$/.test(f)) return; all[f].split('\n').filter(Boolean).forEach((l) => { const o = JSON.parse(l); if (o._deleted) delete state[o._path]; else state[o._path] = o; }); });
  const want = await p.evaluate(() => { const o = {}; for (const [c, M] of Object.entries(FAKE)) for (const [id, v] of Object.entries(M)) o[c + '/' + id] = v; return o; });
  const got = Object.fromEntries(Object.entries(state).map(([k, v]) => { const { _path, _id, ...rest } = v; return [k, rest]; }));
  console.log('FILES', Object.keys(all).sort().join('\n'));
  console.log('MERGE OK?', JSON.stringify(got) === JSON.stringify(Object.fromEntries(Object.keys(want).sort().map((k) => [k, want[k]]))), JSON.stringify(got));
  console.log('BASE', JSON.stringify(T.base)); console.log('ERRS', errs.slice(0, 5)); await br.close(); })();
