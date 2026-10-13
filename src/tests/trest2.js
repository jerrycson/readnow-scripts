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
  const st = async (lbl) => console.log(lbl, JSON.stringify(await p.evaluate(() => ({ tab: S.tab, det: S.detail ? Object.keys(S.detail).join() : null, route: S._route && S._route.n, stack: (S.navStack || []).length, sy: ($('#sheet') || {}).scrollTop || 0, y: pgY(), sheetT: (document.querySelector('#sheet .t') || {}).textContent || null }))));
  // ① 설정 탭 + 아래로 스크롤
  await p.evaluate(async () => { uxTabGo('settings'); await new Promise((r) => setTimeout(r, 600)); pgTo(900); await new Promise((r) => setTimeout(r, 600)); });
  await st('before1'); await p.reload(); await p.waitForTimeout(9000); await st('after1');
  // ② 경영 탭 → 전략 화면 → 그 안에서 설명서 (화면 쌓기) + 설명서 스크롤
  await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); uxTabGo('biz'); await w(500); openStrategy(); await w(800); openManual(); await w(800); $('#sheet').scrollTop = 1500; await w(700); });
  await st('before2'); await p.reload(); await p.waitForTimeout(2500); console.log('NOTE', JSON.stringify(await p.evaluate(() => { const n = [...document.querySelectorAll('div')].find((d) => d.textContent === '↺ 하던 화면으로 돌아가는 중…'); if (!n) return null; const r = n.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), pe: getComputedStyle(n).pointerEvents }; }))); await p.screenshot({ path: 'note.png' }); await p.waitForTimeout(7500); await st('after2'); console.log('NOTE gone', await p.evaluate(() => ![...document.querySelectorAll('div')].some((d) => d.textContent === '↺ 하던 화면으로 돌아가는 중…')));
  await p.evaluate(() => history.back()); await p.waitForTimeout(1500); await st('back2');
  await p.evaluate(() => history.back()); await p.waitForTimeout(1500); await st('back2b');
  // ③ 닫고 새로고침 → 시트 없이 그 탭
  await p.reload(); await p.waitForTimeout(8000); await st('after3');
  console.log('ERR', errs.filter((e) => !/Could not reach|offline|ERR_FAILED|net::/.test(e))); await br.close(); })();
