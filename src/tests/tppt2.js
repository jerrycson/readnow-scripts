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
  console.log('T', await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; const W = []; const CF = []; const CC = [];
    const den = () => { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; };
    const dec = { aladin_J1: { key: 'aladin_J1', approvalState: 'pending' }, aladin_J2: { key: 'aladin_J2', approvalState: 'cleared' }, aladin_J3: { key: 'aladin_J3' }, aladin_K1: { key: 'aladin_K1', approvalState: 'manual', approval: { price: 1 } }, aladin_K2: { key: 'aladin_K2', approvalState: 'pending', approval: { price: 2 } }, aladin_K3: { key: 'aladin_K3', approvalState: 'cleared' } };
    const acts = { a1: { key: 'aladin_K3', at: '2026-10-01', from: 1, to: 2 } };
    const snap = (m) => { const docs = Object.entries(m).map(([id, v]) => ({ id, data: () => v })); return { docs, forEach: (f) => docs.forEach(f), size: docs.length }; };
    db.collection = (name) => ({ get: async () => name === 'prd_price_decisions' ? snap(dec) : name === 'prd_price_actions' ? snap(acts) : snap({}), orderBy: () => ({ limit: () => ({ get: async () => den() }) }),
      doc: (id) => ({ id: id || 'NEWID123456', get: async () => (name === 'ppt_sessions' ? den() : { exists: false }), set: async (v) => { if (name === 'ppt_sessions') den(); W.push([name, id, JSON.stringify(v).slice(0, 120)]); } }), where: () => ({ get: async () => snap({}), onSnapshot: () => () => {} }) });
    db.runTransaction = async (fn) => fn({ get: async (ref) => ({ exists: !!dec[ref.id], data: () => dec[ref.id] }), set: () => {}, delete: (ref) => { W.push(['del', ref.id]); delete dec[ref.id]; } });
    window.confirm = (m) => { CF.push(m.slice(0, 50)); return !/감시 묶음이/.test(m); }; window.alert = () => {};
    S.prCfg = { rollout: { treatPct: 1, controlPct: 0 } };
    openPriceHistory(); await wait(500); const sh = document.querySelector('#sheet'); OUT.card = (sh.querySelector('#prh_clean') || {}).outerHTML ? sh.querySelector('#prh_clean').closest('.card').innerText.slice(0, 60) : 'none';
    sh.querySelector('#prh_clean').click(); await wait(800); OUT.dels = W.filter((x) => x[0] === 'del').map((x) => x[1]).join(','); OUT.left = Object.keys(dec).join(','); OUT.cf = CF.join(' / '); OUT.log = W.filter((x) => x[0] === 'prd_system').map((x) => x[2]).join(';');
    // 사진 가격 조회: 규칙이 막으면 클라우드로
    W.length = 0; localStorage.removeItem('rn-ppt-via-doc'); window.pptCloudUrl = () => 'https://c.test'; window.cloudCall = async (path, body) => { CC.push(path + ':' + body.op + ':' + (body.sid || '') + ':' + (body.photo ? 'photo' : '-') + ':' + (body.doc ? body.doc.n : '')); if (body.op === 'list') return { ok: true, list: [{ id: 'S1', at: '2026-10-07T01:00:00Z', mode: 'bar', n: 3, found: 2, titles: ['책A'], photoFs: true }] }; if (body.op === 'get') return { ok: true, doc: { at: '2026-10-07T01:00:00Z', mode: 'bar', items: [{ n: 1, d: { title: '책A' } }] }, photo: 'data:image/jpeg;base64,QUJD' }; return { ok: true }; };
    S.ppt = { mode: 'bar', sid: 'SID1234567', at: new Date().toISOString(), items: [{ n: 1, isbn: '9788934972464', d: { title: '책A', page1: [] }, rec: { '상': { t: 5000, ref: null } }, st: 'done' }], photoBlob: new Blob(['abc'], { type: 'image/jpeg' }), photoFs: true, photoSent: false };
    await pptSave(); OUT.save1 = CC.join(' ; ') + ' via=' + S.ppt.savedVia + ' note=' + S.ppt.note; OUT.remember = localStorage.getItem('rn-ppt-via-doc') ? 'cloud 기억' : '-';
    CC.length = 0; await pptSave(); OUT.save2 = CC.join(' ; ');
    CC.length = 0; await pptHistory(); await wait(300); OUT.hist = sh.innerText.replace(/\s+/g, ' ').slice(0, 120) + ' | ' + CC.join(';');
    CC.length = 0; await pptOpenSaved('S1'); await wait(300); OUT.open = CC.join(';') + ' img=' + String(S.ppt.img).slice(0, 30);
    return JSON.stringify(OUT, null, 1); }));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
