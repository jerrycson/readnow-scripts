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
  await p.evaluate(() => { const E = { docs: [], forEach() {}, size: 0, empty: true, docChanges: () => [] }; window.__W = []; const Q = (name) => { const q = { where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, get: async () => E, onSnapshot: (cb) => { setTimeout(() => cb(E), 0); return () => {}; }, doc: (id) => ({ id: id || 'x', get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__W.push([name, id, v]); }, update: async () => {}, delete: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false, data: () => undefined }), 0); return () => {}; }, collection: (n) => Q(n) }), add: async () => ({ id: 'n' }) }; return q; };
    db.collection = Q; db.batch = () => { const ops = []; return { set(ref, v) { ops.push([ref.id, v]); }, update() {}, delete() {}, commit: async () => { window.__W.push(['batch', ops.length, ops.map((o) => o[1] && o[1].ctx).filter(Boolean).join(',')]); } }; }; window.fsRestGet = async () => null; window.confirm = () => true; window.alert = (m) => { window.__alert = String(m).slice(0, 120); }; });
  await p.evaluate(() => window.__mkData(3000, { orders: 4000 }));
  const T = {}; const w = (ms) => p.waitForTimeout(ms);
  // ① 재고 = 판매중 × 수량
  T.st0 = await p.evaluate(() => { const st = {}; [...S.plist.values()].forEach((l) => { const k = (l.active ? 'A:' : 'X:') + (l.status || '-'); st[k] = (st[k] || 0) + 1; }); const SS = ['판매중', '판매중', '판매중', '판매대기', '일시판매중지', '판매중지']; let i = 0; [...S.plist.values()].forEach((l) => { if (l.active) { l.status = SS[i++ % SS.length]; if (i % 17 === 0) l.qty = 3; } }); S._pinv = null; return st; });
  T.inv = await p.evaluate(() => { const L = [...S.plist.values()]; const st = {}; L.forEach((l) => { const k = (l.active ? 'A:' : 'X:') + (l.status || '-'); st[k] = (st[k] || 0) + 1; }); const I = prodInv(); const want = L.filter((l) => l.active && l.status === '판매중' && l.qty !== 0); return { st, n: I.n, want: want.length, qty: I.qty, wantQ: want.reduce((a, l) => a + (l.qty || 1), 0), val: I.value, wantV: want.reduce((a, l) => a + (l.price || 0) * (l.qty || 1), 0) }; });
  // 상태를 섞어 다시: 일시판매중지로 바꾸면 빠지고 판매중으로 되돌리면 들어감
  console.log("PRE", JSON.stringify(await p.evaluate(() => [S.plist.size, S.prodLoaded, [...S.plist.values()].filter((l) => l.active).length])), JSON.stringify(T.st0));
  T.flip = await p.evaluate(() => { const l = [...S.plist.values()].find((x) => x.active && x.status === '판매중'); const a = (S._pinv = null, prodInv().n); l.status = '일시판매중지'; const b = (S._pinv = null, prodInv().n); l.status = '판매중'; const c = (S._pinv = null, prodInv().n); return [a, b, c]; });
  await p.evaluate(() => { S.tab = 'products'; renderTabs(); renderMainNow(); }); await w(800);
  T.prodCards = await p.evaluate(() => [...document.querySelectorAll('.mgrid > div')].map((m) => m.innerText.replace(/\s+/g, ' ')).filter((t) => /재고 품목|재고 권수|재고 금액/.test(t)).slice(0, 3).map((t) => t.slice(0, 260)));
  await p.evaluate(() => { S.tab = 'purchase'; renderTabs(); renderMainNow(); }); await w(1000);
  T.pur = await p.evaluate(() => { const t = [...document.querySelectorAll('th')].map((x) => x.textContent); return [t.includes('재고 (판매중)'), [...document.querySelectorAll('.mgrid > div')].map((m) => m.innerText.replace(/\s+/g, ' ')).filter((x) => /재고 원가/.test(x))[0] || null]; });
  await p.evaluate(() => { S.tab = 'biz'; renderTabs(); renderMainNow(); }); await w(1200);
  // ② 설정 맨 위 막대
  await p.evaluate(() => { localStorage.removeItem('rn-setui'); S.tab = 'settings'; renderTabs(); renderMainNow(); }); await w(900);
  const secs = () => p.evaluate(() => { const ids = setSecIds($('#main')); return [ids.length, ids.filter((id) => document.querySelector(`#main details[data-sec="${id}"]`).open).length, !!document.querySelector('.setbar'), document.querySelector('.setbar-n') && document.querySelector('.setbar-n').textContent]; });
  T.s0 = await secs();
  await p.click('#su_all1'); await w(900); T.s1 = await secs(); T.t1 = await p.evaluate(() => document.getElementById('toast').textContent);
  await p.click('label.setbar-sw'); await w(900); T.s2 = await secs();
  await p.evaluate(() => { const d = [...document.querySelectorAll('#main details[data-sec]')].filter((x) => !x.open)[2]; d.querySelector('summary').click(); }); await w(900); T.s3 = await secs();
  await p.click('#su_sv_c'); await w(500); await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); }); await w(500); await p.evaluate(() => { S.tab = 'settings'; renderTabs(); renderMainNow(); }); await w(900); T.s4 = await secs();
  await p.click('#su_sv_k'); await w(300); await p.click('label.setbar-sw'); await w(500); await p.click('#su_all1'); await w(700); await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); }); await w(300); await p.evaluate(() => { S.tab = 'settings'; renderTabs(); renderMainNow(); }); await w(800); T.s5 = await secs();
  await p.screenshot({ path: __dirname + '/../shots120/setbar.png', clip: { x: 0, y: 0, width: 1300, height: 300 } });
  // ③ 벤치 그룹 읽는 날 · 종합 비교 줄 강조
  await p.evaluate(() => { S._benchUn = () => {}; S.bench = { seed190: 1, targets: [{ sc: '11', name: '가나다', on: true }, { sc: '22', name: 'B', on: true }, { sc: '33', name: 'C', on: true }], groups: [{ id: 'g1', name: '주말 그룹', scs: ['11', '22'], sched: { mode: 'w', w: [0, 6] } }] };
    window.__BP = []; benchPatch = async (fn, msg) => { const r = fn(S.bench); window.__BP.push(r); Object.assign(S.bench, r); if (msg) toast(msg); }; window.__OB = []; openBench = (sc) => window.__OB.push(sc); });
  await p.evaluate(() => openBenchHub('board')); await w(1200);
  T.b0 = await p.evaluate(() => [...document.querySelectorAll('[data-bgsch]')].map((b) => b.textContent.trim()));
  await p.evaluate(() => document.querySelector('[data-bgsch="g1"]').click()); await w(500);
  T.b1 = await p.evaluate(() => { const e = document.querySelector('.bg-sch'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 160) : null; });
  await p.evaluate(() => document.querySelector('[data-bgwd="1"]').click()); await w(150); await p.evaluate(() => document.querySelector('[data-bgwd="3"]').click()); await w(1100);
  T.b2 = await p.evaluate(() => [window.__BP.length, JSON.stringify((window.__BP.at(-1).groups || [])[0]), document.getElementById('toast').textContent]);
  await p.evaluate(() => document.querySelector('[data-bgsm="m"]').click()); await w(150);
  await p.evaluate(() => { document.querySelector('[data-bgmd="5"]').click(); }); await w(100); await p.evaluate(() => document.querySelector('[data-bgmd="9"]').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))); await w(100);
  await p.fill('[data-bgmtx]', '20~22, 말일'); await p.evaluate(() => document.querySelector('[data-bgmtxok]').click()); await w(1100);
  T.b3 = await p.evaluate(() => [JSON.stringify((window.__BP.at(-1).groups || [])[0].sched), document.querySelector('.bg-schs').textContent, document.getElementById('toast').textContent]);
  await p.screenshot({ path: __dirname + '/../shots120/bgsched.png' });
  T.parse = await p.evaluate(() => [bgSchParse('1, 3~5 10-11 말일 40 x'), bgSchParse('15일~13일')]);
  await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.insertAdjacentHTML('beforeend', `<table class="bhc" id="tcmp"><tbody>${['11', '22', '33'].map((sc) => `<tr data-bhpick="${sc}" data-bhrow="${sc}"><td class="bhc-nm"><span class="bhc-rh">⋮⋮</span><b>${sc}</b></td><td>1</td><td>2</td></tr>`).join('')}</tbody></table>`); }); await w(200);
  const rows = await p.evaluate(() => [...document.querySelectorAll('tr[data-bhpick]')].map((t) => t.dataset.bhpick));
  T.rows = rows;
  if (rows.length) { await p.evaluate((sc) => document.querySelector(`tr[data-bhpick="${sc}"] td:nth-child(3)`).click(), rows[0]); await w(200);
    T.c1 = await p.evaluate(() => [document.querySelectorAll('tr.bhc-sel').length, window.__OB.length, S._bhSel]);
    await p.evaluate((sc) => document.querySelector(`tr[data-bhpick="${sc}"] td:nth-child(2)`).click(), rows[0]); await w(200);
    T.c2 = await p.evaluate(() => [window.__OB.slice()]);
    if (rows[1]) { await p.evaluate((sc) => document.querySelector(`tr[data-bhpick="${sc}"] td:nth-child(2)`).click(), rows[1]); await w(200); T.c3 = await p.evaluate(() => [[...document.querySelectorAll('tr.bhc-sel')].map((t) => t.dataset.bhpick), window.__OB.slice()]); }
    await p.keyboard.press('Escape'); await w(100); T.c4 = await p.evaluate(() => document.querySelectorAll('tr.bhc-sel').length);
    T.hdr = await p.evaluate(() => [...document.querySelectorAll('.bhc th')].map((t) => t.innerText.replace(/\s+/g, ' ')).slice(0, 5));
    await p.screenshot({ path: __dirname + '/../shots120/cmpsel.png' }); }
  console.log(JSON.stringify(T, null, 1)); console.log(errs.filter((e) => !/ERR_FAILED|favicon/.test(e)).slice(0, 10).join('\n') || 'no errors'); await br.close(); })();
