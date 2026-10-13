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
  const P0 = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {};
    S.orders = new Map(); const mk = (id, items) => ({ id, _id: id, platform: 'cash', kind: 'sale', orderNo: '현금-' + id, orderedAt: '2026-10-08T10:00', items, noShip: true });
    [mk('c1', [{ lineNo: 1, title: '책A', aladinUsedCode: 'UA', listingKey: 'aladin_UA', price: 5000, qty: 1, lineStatus: 'normal', aladinStop: { status: 'todo' } }, { lineNo: 2, title: '책B', aladinUsedCode: 'UB', price: 3000, qty: 1, lineStatus: 'normal', aladinStop: { status: 'todo' } }]), mk('c2', [{ lineNo: 1, title: '책C', aladinUsedCode: 'UC', price: 3000, qty: 1, lineStatus: 'normal', aladinStop: { status: 'done' } }])].forEach((o) => S.orders.set(o.id, o));
    S.ordersLoaded = true; S.ver = (S.ver || 0) + 1; S._csUn = () => {}; S.csCmds = new Map([['cs_c1_1', { id: 'cs_c1_1', status: 'running', tries: 1, claim: { pc: 'cloud' } }], ['cs_c1_2', { id: 'cs_c1_2', status: 'done', tries: 3, result: { state: 'check', msg: '변경됨' }, doneAt: '2026-10-08T00:00:00Z' }]]);
    S.sec.o_cash = true; S.tab = 'orders'; renderMain(); await wait(400); const m = document.getElementById('main'); { const d = document.createElement("div"); d.innerHTML = cashSection(); document.body.appendChild(d); OUT.cash = d.innerText.replace(/\s+/g, " ").slice(0, 700); }
    const A = bizAlerts({ late: [], bad7: [], underBuy: [], cheapV: [], old365: [], G: {}, regToday: 0, checked: 1 }); OUT.alerts = A.filter((x) => x.key === 'cash').map((x) => x.lv + ':' + x.t);
    return JSON.stringify(OUT, null, 1); });
  console.log(P0);
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
