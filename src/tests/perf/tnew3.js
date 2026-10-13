// 1.20.0 새 기능 시험 — node tnew3.js <index.html>
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/';
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += `;(function(){var _i=firebase.initializeApp;firebase.initializeApp=function(){var r=_i.apply(this,arguments);var _a=firebase.auth;var o=_a();var fake={email:'jerrycson@gmail.com',uid:'u1',displayName:'테스트',getIdToken:async()=>'x'};o.onAuthStateChanged=function(cb){setTimeout(function(){cb(fake)},10);return function(){}};Object.defineProperty(o,'currentUser',{get:function(){return fake}});try{firebase.auth=function(){return o};Object.assign(firebase.auth,_a)}catch(e){console.error('patch fail',e)}return r}})();`; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ body: fs.readFileSync('/home/claude/w/sw.js'), contentType: 'text/javascript' }); if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html; charset=utf-8' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelector('.verbar') && document.querySelector('.verbar').remove());
  await p.addScriptTag({ content: fs.readFileSync(__dirname + '/data.js', 'utf8') });
  await p.evaluate(() => { const E = { docs: [], forEach() {}, size: 0, empty: true, docChanges: () => [] }; window.__W = []; const Q = (name) => { const q = { where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, get: async () => E, onSnapshot: (cb) => { setTimeout(() => cb(E), 0); return () => {}; }, doc: (id) => ({ id: id || 'x', get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__W.push([name, id, v]); }, update: async () => {}, delete: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; }, collection: (n) => Q(n) }), add: async () => ({ id: 'n' }) }; return q; };
    db.collection = Q; db.batch = () => { const ops = []; return { set(ref, v) { ops.push([ref.id, v]); }, update() {}, delete() {}, commit: async () => { window.__W.push(['batch', ops.length, ops.map((o) => o[1] && o[1].ctx).filter(Boolean).join(',')]); } }; }; window.fsRestGet = async () => null; window.confirm = () => true; window.alert = (m) => { window.__alert = String(m).slice(0, 120); }; });
  await p.evaluate(() => window.__mkData(3000, { orders: 4000 }));
  await p.evaluate(() => { window.confirm = window.__nc || window.confirm; });
  const T = {};
  // ① askText: 기본값 · 확인 · 고르기 단추 · Esc
  T.askText = await p.evaluate(async () => { const r = {}; const w = (ms) => new Promise((x) => setTimeout(x, ms));
    let pr = askText('이름', '기본'); await w(30); const box = document.querySelector('.asktxt'); r.box = !!box; r.val = box && box.querySelector('.askin').value; box.querySelector('.ask-ok').click(); r.ok = await pr;
    pr = askText('고르기', '', { choices: ['가', '나', '다'] }); await w(30); document.querySelectorAll('.asktxt .askch button')[1].click(); r.choice = await pr;
    openProdList && openDrill('pd:act:new'); await w(200); const on0 = document.querySelector('#sheet').classList.contains('on');
    pr = askText('Esc 시험', 'x'); await w(30); document.querySelector('.asktxt .askin').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); r.esc = await pr; await w(100); r.sheetStill = on0 && document.querySelector('#sheet').classList.contains('on');
    window.confirm = _nativeConfirm; pr = ask('확인 Esc 시험'); await w(30); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); r.askEsc = await pr; await w(100); r.sheetStill2 = document.querySelector('#sheet').classList.contains('on'); r.on0 = on0; if (r.sheetStill2) history.back(); await w(200);
    return r; });
  // ② 제자리 고치기: 사람이 적은 값 지키기 · 서버 값이 바뀌면 바꿈 · 단추 누르면 표시 지움 · _lsn은 새것으로
  T.morph = await p.evaluate(async () => { const r = {}; const host = document.createElement('div'); document.body.appendChild(host); const H = (v, c) => `<div class="card"><input id="t_a" value="${v}"><input type="checkbox" id="t_c" ${c ? 'checked' : ''}><details id="t_d"><summary>s</summary>x</details><button class="btn" id="t_b">b</button></div><div id="t_l">l</div>`;
    host.innerHTML = H('1', false); const a = host.querySelector('#t_a'); a.value = '5'; a.dispatchEvent(new Event('input', { bubbles: true })); const c = host.querySelector('#t_c'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true }));
    host.querySelector('#t_d summary').click(); await new Promise((x) => setTimeout(x, 10)); r.dOpen0 = host.querySelector('#t_d').open;
    morphHTML(host, H('1', false)); r.keepVal = host.querySelector('#t_a').value; r.keepChk = host.querySelector('#t_c').checked; r.keepOpen = host.querySelector('#t_d').open; r.sameEl = host.querySelector('#t_a') === a;
    morphHTML(host, H('2', false)); r.srvVal = host.querySelector('#t_a').value;
    host.querySelector('#t_a').value = '7'; host.querySelector('#t_a').dispatchEvent(new Event('input', { bubbles: true })); host.querySelector('#t_b').click(); morphHTML(host, H('2', false)); r.afterBtn = host.querySelector('#t_a').value;
    const l = host.querySelector('#t_l'); l._lsn = 1; morphHTML(host, H('2', false)); r.lsnFresh = host.querySelector('#t_l') !== l; const a2 = host.querySelector('#t_a'); a2._t = 123; morphHTML(host, H('2', false)); r.tKept = host.querySelector('#t_a') === a2; host.remove(); return r; });
  // ③ 탭 순서 '기본 순서로' — 그 탭 칸만 지움(merge)
  T.tabOrder = await p.evaluate(async () => { const W = []; const o = db.collection; db.collection = (n) => { const q = o(n); return q; }; S.app.tabOrder = { biz: ['a'], products: ['b'] }; S.tab = 'biz'; renderTabs(); renderMain(); await new Promise((x) => setTimeout(x, 200)); if (typeof openOrderEditor !== 'function') return 'no fn'; return 'skip'; });
  // ④ DVDPrime 줄
  T.ext = await p.evaluate(() => { const X = window.ReadnowExt; return { ver: X.VERSION, order: X.ORDER.includes('dvdprime'), elig: [X.eligible('dvdprime', { isbn: 'B1', title: 'x', media: 'video' }), X.eligible('dvdprime', { isbn: '9788937460449', title: 'x', media: 'book' })] }; });
  // ⑤ 경영 탭: 자료 바뀜(p) 다시 그리기 시간 · 지난 값 먼저
  await p.evaluate(() => window.__mkData(8000, { orders: 9000 }));
  T.biz = await p.evaluate(async () => { S.tab = 'biz'; renderTabs(); let t0 = performance.now(); renderMainNow(); const first = Math.round(performance.now() - t0); await new Promise((x) => setTimeout(x, 2500)); bump('p'); t0 = performance.now(); renderMainNow(); const again = Math.round(performance.now() - t0); await new Promise((x) => setTimeout(x, 4000)); const swr = [...SWR.keys()]; return { first, again, swr, err: (document.querySelector('#main').textContent.match(/오류가 났습니다[^\n]{0,80}/) || [''])[0] }; });
  console.log(JSON.stringify(T, null, 1));
  console.log(errs.filter((e) => !/net::ERR|Failed to load resource|googleapis|identitytoolkit|Could not reach Cloud Firestore/.test(e)).slice(0, 10).join('\n')); await br.close(); })();
