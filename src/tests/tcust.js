const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const FB = __dirname + '/fb/package/'; const R = __dirname + '/repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const O = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {};
    S.customers = new Map([['c1', { customerId: 'c1', displayName: '김VIP', saleOrderCount: 5, lastOrderAt: '2026-10-01', flags: { vip: { on: true } } }], ['c2', { customerId: 'c2', displayName: '이주의', saleOrderCount: 1, lastOrderAt: '2026-10-02', otherRecipientCount: 3 }]]); S.ver = (S.ver || 0) + 1;
    uxTabGo('search'); await w(500); out.tabs = document.querySelector('#tabs').innerText.replace(/\s+/g, ' '); out.nav = (document.querySelector('.custnav') || {}).innerText;
    document.querySelector('[data-cfl="agent"]').click(); await w(500); out.tab2 = S.tab + '/' + S.flagList; out.nav2 = document.querySelector('.custnav .on').innerText; out.tabOn = document.querySelector('#tabs .on').innerText; out.list2 = document.querySelector('#main .list').innerText.slice(0, 80);
    document.querySelector('[data-cv="list"]').click(); await w(500); out.tab3 = S.tab; out.nav3 = document.querySelector('.custnav .on').innerText;
    return out; });
  console.log(JSON.stringify(O, null, 1)); await p.screenshot({ path: 'cust.png', clip: { x: 0, y: 0, width: 1300, height: 360 } }); console.log('ERR', errs.filter((e) => !/Could not reach|offline|ERR_FAILED|net::/.test(e))); await br.close(); })();
