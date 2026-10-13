const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const FB = __dirname + '/fb/package/'; const R = __dirname + '/repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/' + (process.argv[3] || '')); await p.waitForTimeout(7000);
  const P0 = p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; const W = []; window.confirm = () => true; window.alert = (m) => { OUT.alert = m; };
    const dec = { aladin_U1: { usedCode: 'U1', approvalState: 'done', approval: { batchId: 'bX', expectPrice: 10000 } }, aladin_U2: { usedCode: 'U2', approvalState: 'manual', approval: { batchId: 'bX' } } };
    const snapOf = (pairs) => ({ docs: pairs.map(([id, v]) => ({ id, ref: { id, path: 'prd_price_decisions/' + id }, data: () => v })), forEach: (fn) => pairs.forEach(([id, v]) => fn({ id, data: () => v })), size: pairs.length });
    db.collection = (name) => ({ get: async () => snapOf([]), doc: (id) => ({ id, get: async () => ({ exists: true, data: () => (name === 'prd_system' ? { watchVer: '0.8.0' } : {}) }), set: async (v) => W.push(['set', name, id, JSON.stringify(v).slice(0, 140)]), update: async (v) => W.push(['update', name, id, JSON.stringify(v).slice(0, 200)]) }),
      where: (f, op, v) => ({ get: async () => snapOf(name === 'prd_price_decisions' && f === 'approval.batchId' ? Object.entries(dec) : []), onSnapshot: (cb) => { cb(snapOf([])); return () => {}; } }), add: async () => ({}) });
    db.batch = () => ({ set: (ref, v) => W.push(['bset', ref.id, JSON.stringify(v).slice(0, 120)]), commit: async () => {} });
    S.prCfg = { watchVer: '0.8.0', watchTab: 't', presets: {} };
    S.batchRes = [{ l: { usedCode: 'U1', title: '책1', price: 9000, listingId: 'L1', status: '판매중', sku: 'BLK', grade: '상' }, target: 8500, reasons: [], page1: [] }]; S.batchId = 'bX'; S.batchSt = { picks: {}, decided: {}, start: { U1: 10000 } }; S.batchMeta = { watch: null }; S.batchT = 'sel'; S.prBatches = [{ id: 'bX', name: 'G' }];
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G', mode: 'same', pct: -5 }))); await wait(500); let sh = document.querySelector('#sheet');
    OUT.wsec1 = (sh.querySelector('.wsec') || {}).innerText;
    const semi = sh.querySelector('[data-wm="semi"]'); semi.checked = true; semi.onchange(); await wait(200);
    sh.querySelector('#w_pre_new').click(); await wait(300); OUT.ed = sh.querySelector('.t').innerText + ' / mode=' + (sh.querySelector('[data-pm="same"]') || {}).checked + ' / pct=' + sh.querySelector('[data-pn="crit.pct"]').value;
    const lure = sh.querySelector('[data-ps="lure"]'); lure.checked = true; lure.onchange(); await wait(400); sh = document.querySelector('#sheet'); OUT.lureFields = !!sh.querySelector('[data-pn="chase.floorPct"]');
    sh.querySelector('#pre_save').click(); await wait(400); OUT.saveW = W.filter((x) => x[0] === 'update').map((x) => x.join(':')).join(' ; '); OUT.presets = Object.values(S.prCfg.presets).map((p) => p.name + '/' + p.chase.name + '/' + p.crit.mode + '/' + p.crit.pct).join(',');
    W.length = 0; const pid = Object.keys(S.prCfg.presets)[0];
    S.detail = null; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G', mode: 'same', pct: -5 }))); await wait(400); sh = document.querySelector('#sheet');
    const sel = sh.querySelector('#w_pre'); OUT.hasSel = !!sel; if (sel) { sel.value = pid; sel.onchange(); await wait(200); }
    const au = sh.querySelector('[data-wa="auto"]'); au.checked = true; au.onchange(); sh.querySelector('#w_save').click(); await wait(600);
    OUT.startW = W.map((x) => x.join(':')).join('\n'); OUT.wsec2 = (document.querySelector('#sheet .wsec') || {}).innerText;
    window.__shot = 1; await new Promise((r) => { window.__go = r; });
    return JSON.stringify(OUT, null, 1); });
  await p.waitForFunction(() => window.__shot === 1, null, { timeout: 30000 }); await p.evaluate(() => { document.querySelector('.verbar') && document.querySelector('.verbar').remove(); document.querySelector('#sheet .wsec').scrollIntoView(); }); await p.screenshot({ path: 'wsec.png' }); await p.evaluate(() => window.__go());
  console.log('W', await P0);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
