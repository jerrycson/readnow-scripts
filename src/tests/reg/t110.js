// 1.10.0: 하위 탭 · 시험 · 블록 지우기 · 벤치 상세 · 전체 보기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = (m) => { OUT.conf = (OUT.conf || []).concat([String(m).slice(0, 160)]); return true; }; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    firebase.firestore.FieldPath = firebase.firestore.FieldPath || { documentId: () => '__id' };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: 'x', registeredAt: '2026-09-01' }); S.prodLoaded = true; bump('p');
    const inf = { ...INFO['9788977396005'], at: new Date().toISOString() }; const inf2 = { ...INFO['9780000000002'], at: new Date().toISOString() };
    const base = { isbn: '9788977396005', branch: 1, grade: 2, qty: 1, saleState: 1, price: 6000, descMode: 'none', desc: '', info: inf };
    col('reg_items').b1 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:01:00Z' }; col('reg_items').b2 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:02:00Z' };
    col('reg_items').o1 = { ...base, stage: 'pick', method: 'one', createdAt: '2026-10-09T00:03:00Z', photos: { main: { name: 'a.jpg', path: 'reg_photos/o1/main.jpg', url: 'x' }, z: [], desc: [] } };
    col('reg_items').o2 = { ...base, isbn: '9780000000002', info: inf2, stage: 'pick', createdAt: '2026-10-09T00:04:00Z' };
    col('reg_items').n1 = { stage: 'pick', method: 'new', branch: 1, grade: 2, qty: 1, saleState: 1, price: 5000, descMode: 'none', new: { title: '세트' }, createdAt: '2026-10-09T00:05:00Z' };
    col('reg_items').d1 = { stage: 'done', day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 6500, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'x' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('reg_items').d2 = { stage: 'done', test: true, day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 9000, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'y' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('shp_cmds').c9 = { type: 'regBulk', status: 'done', step: 6, createdAt: new Date().toISOString(), results: { d1: { state: 'live', usedCode: 'U9' } } };
    liveReset('cmdhub'); S.cmdAll = null; cmdHub();
    openRegister(); await wait(600); S.regT = 'pick'; regRerender(); await wait(900); const sh = document.querySelector('#sheet'); const txt = (sel) => [...sh.querySelectorAll(sel)].map((x) => x.textContent.trim().split(String.fromCharCode(10)).join(' ')).join(' | ');
    OUT.sub = txt('.rgsub button'); OUT.cardsBulk = sh.querySelectorAll('.rgc2').length; OUT.btnBulk = txt('#rg_confirm'); OUT.allgo = txt('#rg_allgo');
    sh.querySelector('[data-rgmf="one"]').click(); await wait(700); OUT.cardsOne = [...sh.querySelectorAll('[data-rgg]')].map((x) => x.dataset.rgg).filter((v, k, a) => a.indexOf(v) === k).join(','); OUT.btnOne = txt('#rg_autoall');
    /* 고른 상품 방식 바꾸기: o2(분류 없음) → 대량 불가 */
    S.regChk = new Set(['o2']); regRerender(); await wait(500); OUT.chkm = txt('.rgchkm'); sh.querySelector('[data-rgchkm="bulk"]').click(); await wait(800); OUT.alertsM = (OUT.alerts || []).slice(-1)[0];
    S.regChk = new Set(['o1']); regRerender(); await wait(500); sh.querySelector('[data-rgchkm="new"]').click(); await wait(800); OUT.o1method = window.__store.reg_items.o1.method; S.regSub.pick = 'new'; S.regChk = new Set(['o1']); regRerender(); await wait(400); sh.querySelector('[data-rgchkm="one"]').click(); await wait(800); OUT.o1method2 = window.__store.reg_items.o1.method;
    /* 자동 일괄: 개별 */
    regPlanFull = async (it) => ({ plan: { method: regMethodOf(it), title: (it.info || {}).title || 'n', price: 6000, qty: 1, images: {} }, bad: [] });
    S.regSub.pick = 'one'; regRerender(); await wait(500); sh.querySelector('#rg_autoall').click(); await wait(1500); OUT.cmds = Object.entries(window.__store.shp_cmds).filter(([k]) => k.startsWith('ra_')).map(([k, v]) => [v.itemId, v.batch ? 'batch' : '-', v.status]);
    S.regSub.pick = 'new'; regRerender(); await wait(500); sh.querySelector('#rg_autoall').click(); await wait(1000); OUT.newAlert = String((OUT.alerts || []).slice(-1)[0]).slice(0, 120);
    S.regSub.pick = 'one'; regRerender(); await wait(500); OUT.prog = (sh.querySelector('.rgprog') || {}).innerText;
    /* 시험 모드 */
    const tm = sh.querySelector('#rg_testmode'); tm.checked = true; tm.onchange(); await wait(300); await regAdd('9791167030580', regCfg()); await wait(500); OUT.newTest = Object.values(window.__store.reg_items).filter((x) => x.isbn === '9791167030580').map((x) => x.test);
    /* 확정 탭: 시험 빼고 합계 · 블록 지우기 */
    S.regT = 'done'; S._regDoneOpen = {}; regRerender(); await wait(800); OUT.doneSum = (sh.querySelector('.rgdays') || {}).innerText; OUT.subDone = txt('.rgsub button');
    const tb = sh.querySelector('[data-rgpurgeday][data-t="1"]'); OUT.tbtn = tb && tb.textContent; tb.click(); await wait(150); OUT.armed = tb.textContent; tb.click(); await wait(900); OUT.d2 = window.__store.reg_items.d2.stage; OUT.d1 = window.__store.reg_items.d1.stage;
    const bb = sh.querySelector('[data-rgpurgeday]:not([data-t])'); bb.click(); await wait(150); bb.click(); await wait(900); OUT.d1b = window.__store.reg_items.d1.stage;
    /* 벤치 상세 */
    col('app_settings').bench = { seed190: 'x', targets: [{ sc: '11', name: '가', on: true }, { sc: '22', name: '나', on: true }, { sc: '33', name: '다', on: false }] }; S._benchUn = undefined; S.bench = null; benchCfg(); await wait(400);
    col('bench_days')['11_2026-10-09'] = { sc: '11', day: '2026-10-09', base: false, total: 1000, add: 10, gone: 30, lowNow: 50, addBand: {}, goneBand: {}, totalBand: {}, addList: [], goneList: [] }; col('bench_state')['11'] = { day: '2026-10-09', pages: 21, lastPage: 21, secPerPage: 2, total: 1000 };
    S.sellers = new Map([['sc_11', { id: 'sc_11', sc: '11', name: '가' }], ['sc_44', { id: 'sc_44', sc: '44', name: '라책방' }]]); S.benchD = {};
    closeDetail && closeDetail(); S.tab = 'biz'; renderMain(); await wait(1200); OUT.benchMain = (benchHtml().replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ')).slice(0, 400);
    openBenchHub('cards'); await wait(800); const s2 = document.querySelector('#sheet'); OUT.hubCards = [...s2.querySelectorAll('.bh-card b')].map((x) => x.textContent).join(','); OUT.hubOff = s2.innerText.includes('제외한 판매자');
    s2.querySelector('[data-bhmv="22|-1"]').click(); await wait(600); OUT.order = col('app_settings').bench.targets.map((t) => t.sc).join(',');
    const qi = s2.querySelector('#bh_q'); qi.value = '라책'; qi.oninput(); await wait(600); const ad = document.querySelector('[data-bhadd="44"]'); OUT.found = !!ad; ad.click(); await wait(700); OUT.after = col('app_settings').bench.targets.filter((t) => t.on !== false).map((t) => t.sc).join(',');
    openBenchHub('cmp', true); await wait(400); OUT.cmp = (document.querySelector('.bh-tb') || {}).innerText; openBenchHub('order', true); await wait(400); OUT.ord = document.querySelector('#sheet').innerText.slice(0, 300);
    /* 전체 보기 */
    S.pmatchLoaded = true; S.ordersLoaded = true; S.orders.set('o1', { id: 'o1', kind: 'sale', orderNo: 'N1', orderedAt: '2026-10-01T10:00', customerId: 'c1', items: [{ aladinUsedCode: 'U9', lineStatus: 'normal', price: 7000, qty: 1, title: 'x' }, { aladinUsedCode: 'Z', lineStatus: 'returned', price: 3000, qty: 1, title: 'z' }] }); S.orders.set('o2', { id: 'o2', kind: 'cancelledBeforeSale', orderNo: 'N2', orderedAt: '2026-10-02T10:00', items: [{ price: 1000, qty: 1, title: 'w', lineStatus: 'cancelled' }] }); bump('o');
    openProdAll(); await wait(700); OUT.pall = document.querySelector('.bt-sum').innerText + ' | rows ' + document.querySelectorAll('.bt-tb tr').length + ' | sorts ' + document.querySelectorAll('#bt_sort option').length;
    const so = document.querySelector('#bt_sort'); so.value = 'price_a'; so.onchange({ target: so }); await wait(300); OUT.pallSorted = !!document.querySelector('.bt-tb');
    openOrdAll(); await wait(700); OUT.oall = document.querySelector('.bt-sum').innerText + ' | ' + [...document.querySelectorAll('.bt-f button')].map((b) => b.textContent).join(',');
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
