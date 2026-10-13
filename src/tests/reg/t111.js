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
    col('reg_items').d1.test = false;
    openRegister(); await wait(600); S.regT = 'pick'; S.regSub = { pick: 'bulk' }; regRerender(); await wait(900); const sh = document.querySelector('#sheet');
    OUT.modes = !!sh.querySelector('#rg_testmode') + ',' + !!sh.querySelector('#rg_mockmode') + ' trashTab=' + !!sh.querySelector('[data-rgt="trash"]');
    /* ±5% */ const pb = sh.querySelector('[data-rgstep="1"][data-id="b1"]'); pb.click(); await wait(700); OUT.plus = window.__store.reg_items.b1.price;
    /* 끌기: b1 노란 줄 손잡이 */ const box = sh.querySelector('[data-rgpickc="b1"]'); const lv = box && box.querySelector('.mklever'); OUT.lever = !!lv;
    if (lv) { const r = lv.getBoundingClientRect(); const ev = (t, y) => new PointerEvent(t, { bubbles: true, cancelable: true, clientX: r.left + 3, clientY: y, pointerId: 1 }); lv.dispatchEvent(ev('pointerdown', r.top + 3)); const mk = lv.closest('.pblk.mark'); mk.dispatchEvent(ev('pointermove', r.top - 40)); await wait(50); OUT.dragLab = mk.querySelector('em').textContent; mk.dispatchEvent(ev('pointermove', r.top - 200)); await wait(50); OUT.dragLab2 = mk.querySelector('em').textContent; mk.dispatchEvent(ev('pointerup', r.top - 200)); await wait(900); OUT.afterDrag = window.__store.reg_items.b1.price; }
    /* 빼기 → 휴지통 */ sh.querySelector('[data-rgdel="b2"]').click(); await wait(700); OUT.b2 = window.__store.reg_items.b2.stage + '/' + window.__store.reg_items.b2.trashFrom;
    S.regT = 'trash'; regRerender(); await wait(600); OUT.trashCard = (sh.querySelector('.istrash') || {}).innerText; sh.querySelector('[data-rgrestore="b2|pick"]').click(); await wait(700); OUT.b2back = window.__store.reg_items.b2.stage;
    /* 확정 삭제 → 휴지통 (확정으로만) */ S.regT = 'done'; regRerender(); await wait(600); const pg = sh.querySelector('[data-rgpurge="d1"]'); pg.click(); await wait(100); pg.click(); await wait(800); OUT.d1 = window.__store.reg_items.d1.stage + '/' + window.__store.reg_items.d1.trashFrom; S.regT = 'trash'; regRerender(); await wait(500); OUT.d1btn = [...sh.querySelectorAll('[data-rgrestore^="d1|"]')].map((b) => b.textContent).join(',');
    /* 14일 지남 */ S.regItems.get('d1').trashAt = new Date(Date.now() - 15 * 864e5).toISOString(); S._rgSweep = 0; regRerender(); await wait(900); OUT.d1exp = window.__store.reg_items.d1.stage;
    /* 모의: 대량 확정 */ S.regItems.get('b1').mock = true; col('reg_items').b1.mock = true; S.regT = 'pick'; S.regSub.pick = 'bulk'; regRerender(); await wait(500); await regConfirm(['b1', 'b2'], regCfg()); await wait(800); OUT.bulkCmds = Object.values(window.__store.shp_cmds).filter((c) => /regBulk/.test(c.type)).map((c) => c.type + ':' + c.n + ':' + c.status);
    regPlanFull = async (it) => ({ plan: { method: regMethodOf(it), title: 'n', price: 6000, qty: 1, images: {} }, bad: [] }); col('reg_items').o1.mock = true; S.regItems.get('o1').mock = true; await regAutoQueue(['o1', 'o2']); await wait(800); OUT.oneCmds = Object.values(window.__store.shp_cmds).filter((c) => /regOne/.test(c.type)).map((c) => c.type + ':' + c.itemId);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
