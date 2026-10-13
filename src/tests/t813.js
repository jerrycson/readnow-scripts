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
  const out = await p.evaluate(async () => { const R = {}; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelector('.verbar') && document.querySelector('.verbar').remove();
    // 1) 검색 저장·최근 검색
    const qi = document.querySelector('#q'); qi.value = '테스트책'; qi.dispatchEvent(new Event('input', { bubbles: true })); qi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    R.hist = localStorage.getItem('rn-q-hist'); qi.value=''; qi.dispatchEvent(new Event('focus')); qi.focus(); await wait(100); R.recentShown = getComputedStyle(document.querySelector('#qrecent')).display + ' ' + document.querySelector('#qrecent').innerText.replace(/\n/g, '|');
    // 상세로 들어가면 검색 칸 비움
    history.pushState({ x: 1 }, ''); R.qAfterPush = JSON.stringify(document.querySelector('#q').value);
    // 2) 매입 전체 목록 카드 단추
    const sets = []; db.collection = (c) => ({ doc: (d) => ({ set: async (x, o) => { sets.push(c + '/' + d + ':' + x.status); }, get: async () => ({ exists: false }) }) });
    S.entStateLoaded = true; S.entState = S.entState || new Map(); S.user = S.user || { email: 't@t' };
    await wait(2500); S.pur = S.pur || {}; S.pur.entries = [{ id: 'e1', source: 'app', date: '2026-10-07', plat: '당근', who: '김', items: [{ title: 'A', qty: 2, price: 1000 }], status: 'ordered' }]; S.pur.heonot = []; bump();
    openPurAll({ f: 'all' }); await wait(200); const btn = document.querySelector('[data-qst="e1|received"]'); R.btns = [...document.querySelectorAll('.pa-st button')].map((b) => b.textContent).join(',');
    window.__T=[]; const _ts=window.toast; R.btnDis = btn.disabled; R.ids = purAllRecords().map((r) => r.id + ':' + r.status).join(','); R.hasOn = typeof btn.onclick; btn.click(); await wait(800); R.toastTxt = (document.querySelector('.toast')||{}).textContent; R.sets = sets.join(';'); R.stAfter = (document.querySelector('[data-paid="e1"] .pst') || {}).textContent; R.sheetStill = !!document.querySelector('#sheet.on') && /매입 전체 목록/.test(document.querySelector('#sheet').innerText);
    S.pur.entries[0].aladinOrderNo = 'O1'; S.pur.aOrders = [{ ono: 'O1', lines: [{ title: 'A', itemId: '123' }] }]; S.pbooks = S.pbooks || new Map(); S.pbooks.set('b1', { aladinItemId: '123', images: { front: { stored: 'books/b1/front.jpg', thumb: 'books/b1/t.jpg' } } }); bump();
    openPurRec('e1'); await wait(300); R.img = [...document.querySelectorAll('#sheet img.pr-th')].map((x) => x.getAttribute('src')).join(',') || 'NONE';
    // 3) 설정 ⑬ 끌기
    history.back(); await wait(300); S.qph = { greet: ['가', '나', '다'], body: [], close: [] }; const dv = document.createElement('div'); dv.style.cssText='position:fixed;top:0;left:0;width:380px;background:#fff;z-index:99999'; dv.innerHTML = qnaPhraseCard(); document.body.appendChild(dv); await wait(100);
    const det = [...document.querySelectorAll('details')].find((d) => /⑬/.test(d.innerText)); if (det) det.open = true; await wait(100);
    const L = document.querySelector('.qph-list[data-qk="greet"]'); const rows = [...L.children]; const h = rows[0].querySelector('.dh'); const b2 = rows[2].getBoundingClientRect(); const b0 = h.getBoundingClientRect();
    R.dragBox = [b0.top, b2.top]; return R; });
  console.log(JSON.stringify(out, null, 1));
  // 실제 포인터로 끌기
  const L = await p.$('.qph-list[data-qk="greet"]'); const rows = await L.$$('.qph-row'); const hb = await (await rows[0].$('.dh')).boundingBox(); const rb = await rows[2].boundingBox();
  await p.mouse.move(hb.x + 3, hb.y + 3); await p.mouse.down(); await p.mouse.move(hb.x + 3, rb.y + rb.height - 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(100);
  console.log('ORDER', await p.evaluate(() => [...document.querySelectorAll('.qph-list[data-qk="greet"] input')].map((x) => x.value).join(',')));
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove()); console.log('SHEET', JSON.stringify((await p.evaluate(() => (document.querySelector('#sheet.on') || {}).innerText || '-')).slice(0, 300))); console.log(FILE.split('/').pop(), 'body text:', JSON.stringify((await p.evaluate(() => document.body.innerText)).slice(0, 500)));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit/.test(e)).slice(0, 6).join('\n')); await br.close(); })();
