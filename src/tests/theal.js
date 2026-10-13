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
  const O = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); let n = 0; const log = [];
    liveSub('tst', (ok, bad) => { n++; const k = n; log.push('start' + k); if (k <= 2) { setTimeout(() => bad({ code: 'unavailable' }), 50); return () => log.push('un' + k); } setTimeout(ok, 50); return () => log.push('un' + k); });
    await wait(400); const a = { n, err: S.subs.tst.err }; await wait(2200); const b = { n, err: S.subs.tst.err }; await wait(4500); const c = { n, err: S.subs.tst.err, un: !!S.subs.tst.un };
    liveSub('tst', () => { n += 100; return () => {}; }); const dup = n; // 이미 붙어 있으면 다시 붙지 않음
    liveReset('tst'); liveSub('tst', (ok) => { n += 1000; setTimeout(ok, 10); return () => {}; }); return { a, b, c, dup, after: n, log }; });
  console.log(JSON.stringify(O)); console.log('ERR', errs.filter((e) => !/Could not reach|offline|ERR_FAILED|net::/.test(e))); await br.close(); })();
