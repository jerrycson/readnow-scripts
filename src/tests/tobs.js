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
  const P0 = p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {};
    RNC.classifySellerDoc = (sd) => ({ cls: sd.id === 'sc_9' ? 'red' : 'green' }); S.sellers = new Map([['sc_1', { id: 'sc_1' }], ['sc_2', { id: 'sc_2' }], ['sc_9', { id: 'sc_9' }]]); S.sellersLoaded = true;
    const iso = (d) => new Date(Date.now() - d * 864e5).toISOString(); let n = 0;
    const mk = (u, price, grade, rows, total, extra) => { const l = { id: 'aladin_' + u, usedCode: u, title: '책' + u, price, grade, active: true, status: '판매중', listingId: 'L' + u, sku: 'KHKA0101', registeredAt: (extra && extra.reg) || '2026-09-01', bookId: 'B' + u }; S.plist.set(l.id, l); S.pmetrics.set('B' + u, { usedFirstPage: rows.map((r) => (r === 'ME' ? { sellerCode: '996008', listingId: 'L' + u, grade, price, ship: 2500 } : r)), usedTotal: total, lastCheckedAt: iso((extra && extra.age) || 1), priceSales: (extra && extra.ps) || 15000, priceList: 17000, salesPoint: (extra && extra.sp) || 100 }); };
    const R = (sc, p, g, s) => ({ sellerCode: sc, listingId: 'x' + (++n), grade: g || '상', price: p, ship: s ?? 2500 });
    mk('A', 5000, '상', ['ME', R(1, 7000), R(2, 8000)], 3);            // top, leave(40%), vmin, c3
    mk('B', 5100, '상', [R(1, 5000), 'ME', R(2, 9000)], 3);            // near (100원)
    mk('C', 9000, '상', [R(9, 3000), R(1, 4000), 'ME'], 3);            // max, high
    mk('D', 6000, '상', ['ME'], 1);                                     // solo
    mk('E', 6000, '상', [R(9, 3000), 'ME'], 2);                         // soloV
    mk('F', 10200, '최상', ['ME', R(1, 10300, '상', 0)], 2, { ps: 11000, sp: 900 });   // charm, nearNew, shipLose(10200+2500 > 10300+0)
    mk('G', 20000, '상', Array.from({ length: 20 }, (_, i) => R(1, 1000 + i * 100)), 60, { sp: 5000, reg: '2026-01-01', age: 30 });  // not on p1: popOff, oldOff, stale, high
    S.pmLoaded = true; S.prodLoaded = true; S.ordersLoaded = true;
    const O = obsCompute(); OUT.counts = Object.fromEntries(OBS_SLOTS.map(([k]) => [k, O.slots[k].map((x) => x.l.usedCode).join('')]));
    const sh = document.querySelector('#sheet'); sh.classList.add('on'); sh.innerHTML = '<div class="card">' + obsHtml() + '</div>'; await wait(200); OUT.tiles = [...sh.querySelectorAll('[data-obs]')].length;
    sh.querySelector('[data-obs="near"]').click(); await wait(400); OUT.list = sh.innerText.replace(/\s+/g, ' ').slice(0, 400);
    sh.querySelector('.obs-h').click(); await wait(400); OUT.open = (sh.querySelector('.obs-b') || {}).innerText ? sh.querySelector('.obs-b').innerText.replace(/\s+/g, ' ').slice(0, 500) : 'none';
    window.__shot = 1; await new Promise((r) => { window.__go = r; });
    return JSON.stringify(OUT, null, 1); });
  await p.waitForFunction(() => window.__shot === 1, null, { timeout: 30000 }); await p.evaluate(() => { document.querySelector('.verbar') && document.querySelector('.verbar').remove(); }); await p.screenshot({ path: 'obs.png', fullPage: false }); await p.evaluate(() => window.__go()); console.log('T', await P0);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
