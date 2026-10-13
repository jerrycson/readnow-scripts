const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const FB = __dirname + '/fb/package/'; const R = __dirname + '/repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 390, height: 800 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/' + (process.argv[3] || '')); await p.waitForTimeout(7000);
  console.log('BIG', await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; let commits = 0, grpSaves = 0, prog = []; const srv = {};
    let srvCb = null; const fire = () => srvCb && srvCb({ forEach: (fn) => Object.entries(srv).forEach(([k, v]) => fn({ id: k, data: () => v })) });
    db.collection = (name) => ({ get: async () => ({ docs: [], forEach: () => {}, size: 0 }), doc: (id) => ({ id, get: async () => ({ exists: true, data: () => (name === 'prd_system' ? { watchVer: '0.6.0', watchTab: 't', watchBeat: new Date().toISOString() } : {}) }), set: async (v) => { if (name === 'prd_price_batches' && v.decided) { grpSaves++; if (grpSaves === 2) throw Object.assign(new Error('too big'), { code: 'invalid-argument' }); } } }),
      where: (f, op, v) => ({ get: async () => ({ docs: [], forEach: () => {}, size: 0 }), onSnapshot: (cb) => { if (f === 'approval.batchId') srvCb = cb; cb({ forEach: () => {} }); return () => {}; } }), add: async () => ({}) });
    db.batch = () => { const ops = []; return { set: (ref, v) => { if (v.approvalState) ops.push([ref.id, v]); }, commit: async () => { await wait(30); commits++; ops.forEach(([k, v]) => (srv[k] = v)); prog.push((document.querySelector('#b_res') || {}).innerText.match(/확정 저장 중 [\d,]+ \/ [\d,]+/)?.[0]); fire(); } }; };
    window.confirm = () => true; window.alert = (m) => { OUT.alert = m.slice(0, 200); };
    S.prCfg = { watchVer: '0.6.0', watchTab: 't' };
    const R = []; const picks = {}; for (let i = 0; i < 450; i++) { const u = 'P' + i; R.push({ l: { usedCode: u, title: 'T' + u, price: 10000, listingId: 'L' + u, status: '판매중', sku: 'BLK', grade: '상' }, target: 9000, reasons: [], page1: [] }); picks['aladin_' + u] = { price: 9000, at: 'x' }; }
    S.batchRes = R; S.batchId = 'bX'; S.batchSt = { picks, decided: {}, start: {} }; S.batchMeta = {}; S.batchT = 'pick'; S.prBatches = [{ id: 'bX', name: 'G' }];
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300); const sh = document.querySelector('#sheet');
    sh.querySelector('#b_exec').click(); await wait(4000);
    OUT.commits = commits; OUT.grpSaves = grpSaves; OUT.prog = prog.join(' | '); OUT.tabs = [...sh.querySelectorAll('[data-btab]')].map((b) => b.textContent.replace(/\s+/g, ' ')).join(' | ');
    // 그룹 기록 없이 서버 확정만 있어도 확정 탭으로
    S.batchSt = { picks: { aladin_P0: { price: 9000, at: '2000-01-01' } }, decided: {}, start: {} }; S.batchT = 'pick'; S.batchSrvId = null; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300); fire(); await wait(300);
    OUT.tabs2 = [...sh.querySelectorAll('[data-btab]')].map((b) => b.textContent.replace(/\s+/g, ' ')).join(' | ');
    return JSON.stringify(OUT, null, 1); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
