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
  console.log('PRC', await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const O = {};
    S.prodLoaded = true; for (let i = 0; i < 6; i++) S.plist.set('p' + i, { id: 'p' + i, usedCode: 'U' + i, sku: i < 2 ? 'KHKDVD' : 'BLKCMN', status: '판매중', active: true, title: '책' + i, price: 5000 });
    S.prCfg = { enabled: false, watchVer: '0.4.2', rollout: { treatPct: 0, controlPct: 0 }, excludeSku: ['KHKDVD'], startedAt: 'x' }; S.prSum = { pend: 0, total: 5, active: 2 }; S.prRun = {}; bump();
    const div = document.createElement('div'); div.innerHTML = priceCard(); document.body.appendChild(div); O.card = div.innerText.replace(/\s+/g, ' ').slice(0, 420);
    const W = []; db.collection = () => ({ doc: () => ({ set: async (v) => W.push(v) }) });
    openExcludeMgr(); await wait(200); const sh = document.querySelector('#sheet'); O.mgr = sh.innerText.replace(/\s+/g, ' ').slice(0, 260);
    sh.querySelector('#ex_sku').value = 'blk'; sh.querySelector('#ex_add').click(); await wait(300); O.saved = JSON.stringify(W[0] && { excludeSku: W[0].excludeSku, excludeUsed: W[0].excludeUsed, n: W[0].excludeRules.length });
    O.groups = [...S.plist.values()].map((l) => window.ReadnowPricing.groupOfListing(l, prSettings())).join(',');
    return JSON.stringify(O, null, 1); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
