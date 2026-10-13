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
  console.log('BATCH', await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; const W = []; const CF = [];
    const srv = { 'aladin_U2': { approvalState: 'manual', approval: { batchId: 'bX', at: '2026-10-07T01:00:00.000Z', decision: 'batch', price: 7000 } } };
    let off = { bX: true };
    const fake = (name) => ({ get: async () => ({ docs: [], forEach: () => {}, size: 0 }), doc: (id) => ({ id, get: async () => ({ exists: true, data: () => name === 'prd_system' ? { watchVer: '0.6.0', watchTab: 't', watchPc: 'JS-MAIN', watchBeat: new Date().toISOString(), enabled: false, batchOff: off } : srv['aladin_' + id] }), set: async (v) => { W.push([name, id, JSON.stringify(v).slice(0, 160)]); if (name === 'prd_system' && v.batchOff) { off = {}; } } }),
      where: (f, op, v) => ({ get: async () => { const docs = name === 'prd_price_decisions' && Array.isArray(v) ? v.filter((k) => srv[k]).map((k) => ({ id: k, data: () => srv[k] })) : []; return { docs, forEach: (fn) => docs.forEach(fn), size: docs.length }; }, onSnapshot: (cb) => { cb({ forEach: (fn) => Object.entries(srv).forEach(([k, v]) => fn({ id: k, data: () => v })) }); return () => {}; } }), add: async () => ({}) });
    db.collection = fake; db.batch = () => ({ set: (ref, v) => { if (v.approvalState) W.push(['batch', ref.id, v.approvalState || '', v.approval ? v.approval.price + '/exp' + v.approval.expectPrice + '/start' + v.approval.startPrice : '']); }, commit: async () => {} });
    db.runTransaction = async (fn) => fn({ get: async (ref) => ({ data: () => srv[ref.id] || srv['aladin_' + ref.id] }), set: (ref, v) => W.push(['tx', ref.id, v.approvalState]) });
    S.prCfg = { watchVer: '0.6.0', watchTab: 't', enabled: false, batchOff: off }; window.alert = (m) => { OUT.alert = (OUT.alert || '') + m.slice(0, 70) + ' | '; }; window.confirm = (m) => { CF.push(m); return true; };
    const mk = (u, price, tgt, o) => ({ l: { usedCode: u, title: 'T' + u, price, listingId: 'L' + u, status: (o && o.st) || '판매중', sku: 'BLKCMN', grade: '상', bookId: null, lastSeenAt: '2026-10-07T00:00:00Z' }, target: tgt, reasons: [], page1: [], out: !!(o && o.out) });
    S.batchRes = [mk('U1', 10000, 9000), mk('U2', 8000, 7000), mk('U3', 5000, 4000, { st: '판매완료' }), mk('U4', 3000, 2000), mk('U5', 5000, 4000), mk('U6', 6000, 6500), mk('U7', 4000, 3500, { out: true }), mk('U8', 4500, 4500), mk('U9', 2000, null), mk('U10', 9000, 8000)]; S.batchId = 'bX';
    S.batchSt = { start: { U1: 10000, U4: 3000, U5: 5000, U6: 10000, U7: 4000 }, picks: { aladin_U1: { price: 9000, at: 'x' }, aladin_U3: { price: 4000, at: 'x' }, aladin_U4: { price: 40000, at: 'x' }, aladin_U5: { price: 400, at: 'x' }, aladin_U6: { price: 6500, at: 'x' }, aladin_U7: { price: 3500, at: 'x' } }, decided: { aladin_U2: { price: 7000, at: new Date(Date.now() - 80 * 3600e3).toISOString(), from: 8000 } } };
    srv.aladin_U2.approval.at = S.batchSt.decided.aladin_U2.at;
    S.batchMeta = {}; S.batchT = 'pick'; S.prBatches = [{ id: 'bX', name: 'G' }];
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300); const sh = document.querySelector('#sheet');
    OUT.tabs = [...sh.querySelectorAll('[data-btab]')].map((b) => b.textContent.replace(/\s+/g, ' ')).join(' | ');
    OUT.offShown = /꺼짐/.test(sh.querySelector('#b_res').innerText) && !sh.querySelector('#b_exec');
    // 켜기: 72시간 넘은 확정(U2)은 결정 대기로
    const bo = sh.querySelector('#b_on'); bo.checked = true; bo.onchange(); await wait(600);
    OUT.onWrites = W.map((x) => x.join(':')).join(' ; '); OUT.U2pick = !!S.batchSt.picks.aladin_U2; W.length = 0; CF.length = 0;
    S.batchT = 'pick'; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300);
    delete S.batchSt.picks.aladin_U2;
    S.batchT = 'pick'; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300);
    sh.querySelector('#b_exec').click(); await wait(800); OUT.writes = W.filter((x) => x[0] === 'batch').map((x) => x.slice(1).join(':')).join(' ; ');
    OUT.confirm = CF.join('\n=====\n');
    S.batchT = 'ok'; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300);
    OUT.okTab = [...sh.querySelectorAll('#b_res .card.pq')].map((c) => c.innerText.replace(/\s+/g, ' ').slice(0, 90)).join(' || ');
    S.batchT = 'keep'; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: 'G' }))); await wait(300);
    OUT.keepTab = [...sh.querySelectorAll('#b_res .card.pq')].map((c) => c.innerText.replace(/\s+/g, ' ').slice(0, 90)).join(' || ');
    return JSON.stringify(OUT, null, 1); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
