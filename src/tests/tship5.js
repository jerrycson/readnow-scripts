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
  const out = await p.evaluate(async () => { const R = {}; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const tx = []; db.runTransaction = async (fn) => { await fn({ get: async () => ({ exists: false, data: () => null }), set: (ref, x) => tx.push(x.type + ':' + x.listingIds), update: () => {} }); };
    S.shipC = { at: new Date().toISOString(), orders: [{ orderNo: 'A1', orderedAt: '2026-10-07 13:39', recipient: { name: '김동빈' }, items: [{ listingId: 'L1', title: '구원의 파노라마', grade: '상', sku: 'YLWNOT_ms', price: 2000, qty: 1 }] }, { orderNo: 'A2', orderedAt: '2026-10-07 12:30', recipient: { name: '박세령' }, items: [{ listingId: 'L2', title: '회복탄력성', grade: '중', sku: 'BLKCMN', price: 4600, qty: 1 }] }],
      enrich: { L1: { grade: '상', note: '상', uiAt: 'x', mkt: { at: new Date().toISOString(), rows: [] } }, L2: { grade: '중', note: '중', uiAt: 'x', mkt: { at: new Date().toISOString(), rows: [] } } } };
    S.ship = { orders: [], tabCounts: {}, at: null }; S.shipStart = [{ type: 'startDelivery', orderNos: ['A1'], status: 'running', claim: { at: new Date(Date.now() - 300000).toISOString() }, createdAt: new Date(Date.now() - 300000).toISOString() }];
    S.shipUinfo = new Map([['L1', { note: null }], ['L2', { note: null }]]); S.shipUinfoAt = new Map([['L1', Date.now()], ['L2', Date.now()]]);
    S.shipTab = 'confirm'; S.shipView = 'shelf'; await openShip(); await wait(500);
    const sh = document.querySelector('#sheet'); const txt = () => sh.innerText;
    R.shelf_go = [...sh.querySelectorAll('[data-sds]')].map((b) => b.dataset.sds + ':' + b.textContent.trim()).join(' | ');
    R.shelf_sortrow = (sh.querySelector('.shp-sort') || {}).innerText; R.notes = [...sh.querySelectorAll('.shp-note')].map((x) => x.innerText.replace(/\n/g, ' ')).join(' || ');
    R.tags = [...sh.querySelectorAll('.tag')].map((x) => x.textContent).join(' | '); R.tx = tx.join(',');
    sh.querySelector('[data-sv="order"]').click(); await wait(500);
    R.order_go = [...sh.querySelectorAll('[data-sds]')].map((b) => b.dataset.sds + ':' + b.textContent.trim()).join(' | '); R.order_sortrow = (sh.querySelector('.shp-sort') || {}).innerText.replace(/\n/g, ' ');
    R.all = (sh.querySelector('#sds_all') || {}).textContent; R.ver = (document.getElementById('appver') || {}).textContent; return R; });
  console.log(JSON.stringify(out, null, 1));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
