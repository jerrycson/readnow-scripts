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
  console.log('T', await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; const W = [];
    const dec = { aladin_A: { approvalState: 'manual', approval: { batchId: 'bX' } }, aladin_B: { approvalState: 'done', approval: { batchId: 'bX' } }, aladin_C: { approvalState: 'applying', approval: { batchId: 'bY' } }, aladin_D: { approvalState: 'manual', approval: { batchId: 'bY' } } };
    db.collection = (name) => ({ get: async () => ({ docs: [], forEach: () => {}, size: 0 }), doc: (id) => ({ id, get: async () => ({ exists: false, data: () => ({}) }), set: async (v) => W.push(['set', name, id, JSON.stringify(v).slice(0, 80)]), delete: async () => W.push(['delete', name, id]) }),
      where: (f, op, v) => ({ get: async () => { if (f === 'shardOf') return { docs: [], forEach: () => {} }; const docs = Object.entries(dec).filter(([, x]) => x.approval.batchId === v).map(([id, x]) => ({ id, data: () => x })); return { docs, forEach: (fn) => docs.forEach(fn) }; }, onSnapshot: () => () => {} }), add: async () => ({}) });
    db.runTransaction = async (fn) => fn({ get: async (ref) => ({ data: () => dec[ref.id] }), set: (ref, v) => { W.push(['tx', ref.id, v.approvalState]); dec[ref.id].approvalState = v.approvalState; } });
    RNC.classifySellerDoc = () => ({ cls: 'green' }); S.sellers = new Map([['sc_1', { id: 'sc_1' }], ['sc_2', { id: 'sc_2' }], ['sc_4', { id: 'sc_4' }]]);
    const rows = [{ sellerCode: 9, sellerName: '빨강?', grade: '상', price: 4700, ship: 2500, listingId: 'LZ' }, { sellerCode: 1, sellerName: '상판매', grade: '상', price: 5000, ship: 3000, listingId: 'LA' }];
    S.pmetrics.set('B1', { id: 'B1', usedFirstPage: rows, lastCheckedAt: new Date().toISOString() });
    const L1 = { id: 'aladin_U1', usedCode: 'U1', title: '책1', price: 9000, grade: '상', status: '판매중', bookId: 'B1', listingId: 'X1' };
    const run = (o) => { const x = batchCompute({ ...BATCH_DEF, colors: [], coef: { '최상': 1, '상': 0.95, '중': 0.85 }, mode: 'same', ...o }, [L1])[0]; return x.target + ' | ' + x.reasons.slice(-1)[0]; };
    OUT.off = run({}); OUT.on10 = run({ topNearOn: true, topNear: 10 }); OUT.on5 = run({ topNearOn: true, topNear: 5 }); OUT.pctThenTop = run({ topNearOn: true, topNear: 10, pct: -10 }); OUT.minWins = run({ topNearOn: true, topNear: 10, minPrice: 4900 });
    window.confirm = () => true; window.alert = (m) => { OUT.alert = m; };
    await batchDelete([{ id: 'bX', name: 'GX' }, { id: 'bY', name: 'GY' }]); OUT.w = W.map((x) => x.join(':')).join(' ; ');
    return JSON.stringify(OUT, null, 1); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
