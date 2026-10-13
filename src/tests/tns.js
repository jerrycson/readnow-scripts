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
    const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10); const t = (n) => Date.now() - n * 864e5;
    S.sellers = new Map([
      ['sc_1', { id: 'sc_1', sc: '1', name: '신규A', firstReviewDate: d(200), rev6m: 900, shopPeriods: { '최근 6개월': { rating: 0.99, count: 900 } }, totalItems: 30000 }],
      ['sc_2', { id: 'sc_2', sc: '2', name: '신규B', firstReviewDate: d(100), rev6m: 450, shopPeriods: { '최근 6개월': { rating: 0.98, count: 450 } }, totalItems: 5000 }],
      ['sc_3', { id: 'sc_3', sc: '3', name: '오래됨', firstReviewDate: d(800), rev6m: 2000, shopPeriods: { '최근 6개월': { rating: 0.99 } }, totalItems: 90000 }],
      ['sc_4', { id: 'sc_4', sc: '4', name: '평점낮음', firstReviewDate: d(100), rev6m: 800, shopPeriods: { '최근 6개월': { rating: 0.95 } }, totalItems: 20000 }],
      ['sc_5', { id: 'sc_5', sc: '5', name: '시작모름', rev6m: 600, shopPeriods: { '최근 6개월': { rating: 0.99 } }, totalItems: 20000 }]]);
    S.sellersLoaded = true; S.sec.sl_new = true; S.tab = 'sellers'; renderMain(); await wait(300); const m = document.getElementById('main'); OUT.sec = (m.querySelector('[data-sec="sl_new"]') || {}).innerText;
    S.nsHist = { sc_1: { snapshots: Array.from({ length: 8 }, (_, i) => ({ t: t(200 - i * 30), items: 1000 + i * 4000 })) }, sc_2: { snapshots: [] }, sc_5: { snapshots: [] } }; S.nsHistV = 1; renderMain(); await wait(300);
    OUT.sec2 = m.querySelector('[data-sec="sl_new"]').innerText; return JSON.stringify(OUT, null, 1); });
  console.log(P0);
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
