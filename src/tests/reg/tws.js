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
    col('reg_items').b2.ws = 'wsB';
    openRegister(); await wait(600); S.regT = 'pick'; S.regSub = { pick: 'bulk' }; regRerender(); await wait(800); const sh = document.querySelector('#sheet');
    OUT.bar = (sh.querySelector('.rgws') || {}).innerText; OUT.bulkMain = sh.querySelectorAll('[data-rgg]').length;
    window.prompt = () => '직원A'; sh.querySelector('#rg_wsadd').click(); await wait(800); OUT.cur = regWsCur(); OUT.list = JSON.stringify(regWsList().map((w) => w.name)); OUT.empty = sh.querySelectorAll('.rgc2').length;
    await regAdd('9791167030580', regCfg()); await wait(500); OUT.newWs = Object.values(window.__store.reg_items).filter((x) => x.isbn === '9791167030580').map((x) => x.ws === regWsCur());
    sh.querySelector('[data-rgws="main"]').click(); await wait(600); OUT.backMain = regWsCur() + ' q=' + document.querySelectorAll('[data-rgt="q"] b')[0].textContent;
    col('app_settings').reg_presence = { main: { by: 'other@x', name: '직원B', at: new Date().toISOString() } }; S.regPres = col('app_settings').reg_presence; regRerender(); await wait(400); OUT.pres = (document.querySelector('.rgws') || {}).innerText;
    /* 매입처 */ S.entStateLoaded = true; S.entState = new Map(); S.pur.loaded = true; S.pur.fresh = true; S.pur.entries = [{ id: 'a', sheet: 's', amt: 1000, date: '2026-10-01', plat: '당근마켓', who: '효린', txt: '책 1권' }, { id: 'b', sheet: 's', amt: 2000, date: '2026-10-02', plat: '번개', who: 'x', txt: '책' }, { id: 'c', sheet: 's', amt: 3000, date: '2026-10-03', plat: 'DVD프라임', who: 'y', txt: 'dvd' }, { id: 'd', sheet: 's', amt: 3000, date: '2026-10-03', plat: '중고나라', who: 'y', txt: 'z' }]; bump();
    openPurAll({ f: 'all' }); await wait(600); OUT.chips = [...document.querySelectorAll('.platchips button')].map((b) => b.textContent.trim()).join(' | '); OUT.badges = document.querySelectorAll('.platb img').length;
    document.querySelector('[data-paplat="daangn"]').click(); await wait(500); OUT.rowsDaangn = document.querySelectorAll('[data-paid]').length;
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rws.png' }); await br.close(); })();`);
