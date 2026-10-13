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
  console.log('UNDO', await p.evaluate(async () => { const out = []; let D = {}, A = [];
    db.collection = (c) => ({ doc: () => ({ get: async () => ({ exists: true, data: () => D }) }), where: () => ({ get: async () => ({ forEach: (f) => A.forEach((a) => f({ data: () => a })) }) }) });
    prDecide = async (x, d, o) => `${d}:${o.price ?? ''}:${o.sku ?? ''}`;
    const run = async () => { try { return await prUndo({ key: 'k1' }); } catch (e) { return 'ERR ' + e.message.slice(0, 30); } };
    D = { approvalState: 'done', approval: { decision: 'unhold', at: '2026-10-07T01:00:00Z' } }; out.push(await run());
    D = { approvalState: 'done', approval: { decision: 'approve', at: '2026-10-07T01:00:00Z' } }; A = [{ from: 5000, at: '2026-09-01T00:00:00Z' }]; out.push(await run());
    A.push({ from: 7000, at: '2026-10-07T02:00:00Z' }); out.push(await run());
    D = { approvalState: 'done', approval: { decision: 'hold', at: 'x' }, holdInfo: { origSku: 'ABC' } }; out.push(await run());
    D = { approvalState: 'approved' }; out.push(await run());
    return out.join(' | '); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
