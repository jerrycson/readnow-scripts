// 1.20.0 새 기능 시험 — node tnew3.js <index.html>
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url(); if (/jszip\.min\.js/.test(u)) return rt.fulfill({ body: fs.readFileSync('/opt/npm-tools/node_modules/jszip/dist/jszip.min.js', 'utf8'), contentType: 'text/javascript' });
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove());
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/data.js', 'utf8') });
  const r = await p.evaluate(async () => { const d = document.createElement('div'); d.innerHTML = '<input id="pp" type="password" value="secret">'; document.body.appendChild(d); await new Promise((r) => setTimeout(r, 400)); const b = d.querySelector('.rn-pweye'); const i = d.querySelector('#pp'); const o = { btn: !!b };
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); o.down = i.type; b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); o.up = i.type; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true })); o.leave = i.type; await new Promise((r) => setTimeout(r, 400)); o.dupe = d.querySelectorAll('.rn-pweye').length; return o; });
  await p.setViewportSize({ width: 1300, height: 800 }); await p.evaluate(() => { S.shipTab = 'confirm'; openShip(); }); await p.waitForTimeout(1500);
  await p.screenshot({ path: __dirname + '/../shots120/shiptabs.png', clip: { x: 0, y: 0, width: 1300, height: 260 } });
  r.tabs = await p.evaluate(() => [...document.querySelectorAll('.shp-tabs button')].map((b) => [b.innerText.replace(/\s+/g, ' '), Math.round(b.getBoundingClientRect().height)]));
  console.log(JSON.stringify(r)); console.log('ERRS', errs.slice(0, 5)); await br.close(); })();
