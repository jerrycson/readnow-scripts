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
  const P0p = p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {};
    const mk = (id, at, fee, items, extra) => ({ id: 'aladin_' + id, orderNo: id, kind: 'sale', orderedAt: at, shippingFee: fee, customerId: 'c' + id, items, ...(extra || {}) });
    const it = (t, p, st) => ({ title: t, price: p, qty: 1, lineStatus: st || 'normal', aladinUsedCode: 'U' + t });
    S.orders = new Map(); [mk('A1', '2026-10-02 10:00', 0, [it('가', 12000), it('나', 9000)]), mk('A2', '2026-10-02 11:00', 3000, [it('다', 5000)]), mk('A3', '2026-10-03 09:00', 3000, [it('라', 4000, 'returned')]), mk('A4', '2026-10-03 12:00', 0, [it('마', 15000, 'cancelled')]), mk('A5', '2026-10-04 12:00', null, [it('바', 6000)])].forEach((o) => S.orders.set(o.id, o));
    S.customers = new Map([['cA1', { displayName: '김철수' }]]); S.ordOps = new Map([['aladin_A1', { parcels: 2 }]]); S.ordersLoaded = true; S.ver = (S.ver || 0) + 1; S.pp.ship_o = { kind: 'month', off: 0 }; S.sec.ship_o = true;
    S.tab = 'orders'; renderMain(); await wait(400); const m = document.getElementById('main'); const sec = m.querySelector('[data-sec="ship_o"]'); OUT.sec = sec.innerText.replace(/\s+/g, ' ').slice(0, 700); OUT.nd = sec.querySelectorAll('[data-shipd]').length;
    sec.querySelector('.ar.total').click(); await wait(400); const sh = document.querySelector('#sheet'); OUT.det = sh.innerText.replace(/\s+/g, ' ').slice(0, 900);
    sh.querySelector('[data-shf="none"]').click(); await wait(200); OUT.none = sh.querySelector('.list').innerText.replace(/\s+/g, ' ').slice(0, 200);
    sh.querySelector('[data-shf="ret"]').click(); await wait(200); OUT.ret = sh.querySelector('.list').innerText.replace(/\s+/g, ' ').slice(0, 200);
    sh.querySelector('[data-shf="all"]').click(); await wait(200); sh.querySelector('[data-shs="net"]').click(); await wait(200); OUT.first = sh.querySelector('.list .item').innerText.replace(/\s+/g, ' ').slice(0, 200);
    sh.querySelector('[data-shoo]').click(); await wait(300); OUT.oo = sh.innerText.replace(/\s+/g, ' ').slice(0, 120); history.back(); await wait(500); OUT.back = sh.innerText.replace(/\s+/g, ' ').slice(0, 80);
    history.back(); await wait(400); OUT.closed = !document.querySelector('#sheet.on');
    const row = m.querySelector('.list [data-shipd]'); if (row) { row.click(); await wait(300); OUT.dayDet = sh.querySelector('.sh .t').innerText; }
    OUT.ops = JSON.stringify(opsToDate()); window.__shot = 1; await new Promise((r) => { window.__go = r; }); return JSON.stringify(OUT, null, 1); });
  await p.waitForFunction(() => window.__shot === 1, null, { timeout: 30000 }); await p.evaluate(() => { document.querySelector('.verbar') && document.querySelector('.verbar').remove(); S.detail = null; openShipCost({ kind: 'month', off: 0, f: 'all' }); }); await p.waitForTimeout(400); await p.screenshot({ path: 'shipcost.png' }); await p.evaluate(() => window.__go()); console.log(await P0p);
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
