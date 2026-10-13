const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const FB = __dirname + '/fb/package/'; const R = __dirname + '/repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const O = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {};
    const now = new Date().toISOString(); const old = new Date(Date.now() - 10 * 60e3).toISOString();
    S.shipC = { at: old, pc: 'cloud', orders: [{ orderNo: 'O1', buyer: '김', orderedAt: '2026-10-08 10:00', items: [{ listingId: '111', title: '책가', price: 5000 }] }], tabCounts: { '주문확인요청': 1, '발송 요청': 0 } };
    S.shipFast = { pc: 'OFFICE1', at: now, n: 1 }; S.cloud = { ok: true, lastConfirmAt: old };
    S.shipTab = 'confirm'; openShip(); await wait(800); const sh = document.querySelector('#sheet');
    OUT.rt = (document.getElementById('shp_rt') || {}).textContent; OUT.rb = (document.getElementById('shp_rb') || {}).textContent; OUT.staleShown = (document.getElementById('shp_stale') || {}).style && document.getElementById('shp_stale').style.display;
    OUT.readBy1 = shipReadBy(); OUT.stale1 = Math.round(shipStale() / 1000);
    // PC가 멈추고 클라우드도 10분 전 → 빨간 띠
    S.shipFast = { pc: 'OFFICE1', at: old }; S.shipC.at = old; shipFreshPaint(); const bn = document.getElementById('shp_stale'); OUT.banner = bn ? bn.style.display + '|' + bn.innerText.slice(0, 120) : 'none';
    // 클라우드가 방금 읽음
    S.cloud = { ok: true, lastConfirmAt: new Date().toISOString() }; shipFreshPaint(); OUT.readBy2 = shipReadBy(); OUT.banner2 = bn ? bn.style.display : 'none';
    // PC가 쓴 목록 문서
    S.shipC = { ...S.shipC, at: new Date(Date.now() + 1000).toISOString(), pc: 'HOME' }; OUT.readBy3 = shipReadBy();
    OUT.live = Object.entries(S.subs || {}).map(([k, L]) => k + (L.un ? '✓' : '✗') + (L.err ? '!' + L.err : '')).join(','); OUT.syncFlag = typeof S.live;
    S.tab = 'settings'; renderMain(); await wait(400); S.sec = S.sec || {}; S.sec.set_shipfast = true; renderMain(); await wait(400); const st = document.querySelector('[data-sec="set_shipfast"]'); OUT.set = st ? st.innerText.replace(/\s+/g, ' ').slice(0, 900) : 'none';
    return OUT; });
  console.log(JSON.stringify(O, null, 1)); console.log('ERR', errs.filter((e) => !/Could not reach|offline|ERR_FAILED|net::/.test(e))); await br.close(); })();
