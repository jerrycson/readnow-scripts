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
  const out = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(2500);
    S.entStateLoaded = true; S.entState = new Map(); S.pur.loaded = true; S.pur.fresh = true;
    S.pur.entries = [{ id: 'a1', source: 'app', status: 'ordered', date: '2026-10-05', plat: '당근', items: [{ title: 'X', qty: 2, price: 1 }] }, { id: 'a2', source: 'app', status: 'received', date: '2026-10-04', plat: '당근', items: [] },
      ...[...Array(60).keys()].map((k) => ({ id: 's' + k, source: 'sheet', sheet: '2026', raw: [false], date: '2026-09-' + String(10 + (k % 20)).padStart(2, '0'), plat: '번개', amt: 1000, txt: '책' + k + ' 2권' }))]; bump();
    const tb = document.querySelector('#tabs button[data-tab="purchase"]') || [...document.querySelectorAll('#tabs button')].find((b) => /매입/.test(b.textContent)); tb.click(); await wait(1500); bump(); renderMain(); await wait(800);
    const m = document.querySelector('main') || document.body; const head = [...document.querySelectorAll('summary')].map((x) => x.innerText).find((t) => /진행중 매입/.test(t)) || '';
    return { head, tabs: [...document.querySelectorAll('[data-pf]')].map((b) => b.textContent).join(' | '), rows: document.querySelectorAll('[data-pend],[data-pur]').length }; });
  console.log(JSON.stringify(out));
  await p.evaluate(() => { S.purFilter = 'open'; renderMain(); });
  await p.waitForTimeout(500);
  const info = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const rows = [...document.querySelectorAll('[data-pend]')]; const r = rows[Math.min(25, rows.length - 1)]; r.scrollIntoView({ block: 'center' }); await wait(200); const y0 = window.scrollY; const id = r.dataset.pend;
    r.click(); await wait(500); const opened = !!document.querySelector('#sheet.on'); return { n: rows.length, y0, id, opened }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  console.log('MAIN', JSON.stringify(info), JSON.stringify(await p.evaluate((id) => ({ y: window.scrollY, sheet: !!document.querySelector('#sheet.on'), flash: !!document.querySelector('.rn-back'), flashId: (document.querySelector('.rn-back') || {}).dataset ? (document.querySelector('.rn-back').dataset.pend || document.querySelector('.rn-back').innerText.slice(0, 30)) : null }), info.id)));
  const i2 = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); openPurAll({ f: 'all' }); await wait(500); const sh = document.querySelector('#sheet'); const cards = [...sh.querySelectorAll('[data-paid]')]; const c = cards[30]; c.scrollIntoView({ block: 'center' }); await wait(200); const y0 = sh.scrollTop; c.click(); await wait(500); return { n: cards.length, y0, id: c.dataset.paid, t: sh.querySelector('.t').textContent }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  console.log('SHEET', JSON.stringify(i2), JSON.stringify(await p.evaluate(() => { const sh = document.querySelector('#sheet'); const f = sh.querySelector('.rn-back'); return { y: sh.scrollTop, t: sh.querySelector('.t').textContent, flash: f ? f.dataset.paid : null }; })));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400); console.log('CLOSED', await p.evaluate(() => !document.querySelector('#sheet.on')));
  await p.keyboard.press('/'); console.log('SLASH', await p.evaluate(() => document.activeElement && document.activeElement.id));

  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
