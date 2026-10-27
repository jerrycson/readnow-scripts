// (10/27 wS) 📊 출고 시장 요약 고정·시장 줄 스크롤·▤ 접기 · 📏 최저가 대비 색 구분 · 🤖 자동 판단 대기 문구 · ✖ 주문 취소 창(전체 취소 막기)·맡긴 일 · 🎨 알라딘 화면 판매자 색
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = {};
  // 1) 최저가 대비 = 사실 수치(남색 · 평가 색 아님) — 세 경우 모두 같은 글자색
  R.col = await p.evaluate(() => { const rows = [{ c: 'g', p: 5000 }, { c: 'g', p: 7000 }, { c: 'g', p: 9000 }]; const d = document.createElement('div'); d.innerHTML = [8500, 5000, 4000].map((x) => shpSumLine(rows, { usedTotal: 3 }, { price: x }, null)).join(''); document.body.appendChild(d);
    const v = [...d.querySelectorAll('.ss-d .ss-v')].map((e) => getComputedStyle(e).color); const lab = [...d.querySelectorAll('.ss-d i')].map((e) => e.textContent); const me = [...d.querySelectorAll('.ss-me')].map((e) => getComputedStyle(e).color); const bd = getComputedStyle(d.querySelector('.ss-d')).borderStyle; d.remove(); return { v, lab, me, bd }; });
  // 2) 출고 ① — 요약 고정·시장 줄 스크롤·▤ 접기 · ✖ 취소 단추
  const ONO = '001-A870000001', ONO2 = '001-A870000002';
  R.ship = await p.evaluate(async ([ONO, ONO2]) => { const l = S.plist.get('aladin_U215983410'), l2 = S.plist.get('aladin_U215983411');
    S.pmetrics = S.pmetrics || new Map(); S.pmetrics.set(l.bookId, { usedTotal: 3, lastCheckedAt: '2026-10-26', page1: [] });
    const mkt = { at: new Date().toISOString(), usedTotal: 3, rows: [{ r: 1, n: 'A', sc: '1', g: '상', p: 5000, s: 2500, lid: '1', c: 'green' }, { r: 2, n: 'B', sc: '2', g: '상', p: 7000, s: 2500, lid: '2', c: 'yellow' }, { r: 3, n: 'C', sc: '3', g: '상', p: 9000, s: 2500, lid: '3', c: 'green' }] };
    S._shipLive = 1; S.shipC = { orders: [{ orderNo: ONO, buyer: '김테스트', orderedAt: '2026-10-27 09:00', items: [{ listingId: l.listingId, title: l.title, price: 8500, qty: 1, sku: 'PNK_ms', grade: '최상', img: 'x.jpg' }, { listingId: l2.listingId, title: l2.title, price: 6000, qty: 1, sku: 'BLK_ms', grade: '상' }] }, { orderNo: ONO2, buyer: '이테스트', orderedAt: '2026-10-27 09:10', items: [{ listingId: '404935005', title: '한 권', price: 4000, qty: 1, sku: 'YLW_ms', grade: '중' }] }], enrich: { [l.listingId]: { mkt }, [l2.listingId]: { mkt } }, at: new Date().toISOString() };
    const C0 = S.shipC; try { localStorage.removeItem('rn-ship-mkfold'); } catch (e) {} S.shipMkFold = null; S.shipTab = 'confirm'; await openShip(); await new Promise((r) => setTimeout(r, 400)); S.shipC = C0; window.__C0 = C0; await openShip(); await new Promise((r) => setTimeout(r, 300)); /* 가짜 Firebase의 빈 목록 신호가 먼저 덮으면 다시 넣음 */ const sh = document.getElementById('sheet');
    const blk = sh.querySelector('.shp-blk2'); const mkh = blk && blk.querySelector(':scope > .shp-mkh'); const mkl = blk && blk.querySelector(':scope > .shp-mkl');
    const out = { blk: !!blk, sumInHead: !!(mkh && mkh.querySelector('.shp-sum')), listInScroll: !!(mkl && mkl.querySelector('.pblk')), ovf: mkl ? getComputedStyle(mkl).overflowY : null, blkOvf: blk ? getComputedStyle(blk).overflowY : null, maxH: mkl ? getComputedStyle(mkl).maxHeight : null };
    const fb = sh.querySelector('.shp-nav [data-snfold]'); out.fold = !!fb; fb.click(); await new Promise((r) => setTimeout(r, 100));
    out.folded = sh.classList.contains('mkfold') && getComputedStyle(sh.querySelector('.shp-mkl')).display === 'none' && getComputedStyle(sh.querySelector('.shp-mkh .shp-sum')).display !== 'none'; out.ls = localStorage.getItem('rn-ship-mkfold'); out.toast = (document.querySelector('#toast') || {}).textContent || '';
    await openShip(); await new Promise((r) => setTimeout(r, 200)); out.keep = sh.classList.contains('mkfold') && sh.querySelector('.shp-nav [data-snfold]').classList.contains('on');
    sh.querySelector('.shp-nav [data-snfold]').click(); await new Promise((r) => setTimeout(r, 100)); out.unfold = !sh.classList.contains('mkfold') && getComputedStyle(sh.querySelector('.shp-mkl')).display !== 'none' && localStorage.getItem('rn-ship-mkfold') === '0';
    out.cxBtn = sh.querySelectorAll('.shp-oh [data-cxo]').length; out.cxItem = sh.querySelectorAll('.shp-cxl [data-cxo]').length; return out; }, [ONO, ONO2]);
  // 3) 🤖 자동 판단 대기 문구 — 클라우드 이름 아님 · 신호 10분 넘으면 빨강
  R.sau = await p.evaluate(() => { S.shipAutoCfg = { on: true, beatAt: new Date(Date.now() - 2 * 60e3).toISOString(), beatBy: 'MJ-MAIN' }; const a = sauWaitLine('x', '2026-10-27 09:00');
    S.shipAutoCfg = { on: true, beatAt: new Date(Date.now() - 30 * 60e3).toISOString(), beatVer: '0.40.0' }; const b = sauWaitLine('x', null); S.shipAutoCfg = {}; const c = sauWaitLine('x', null);
    return { a, b, c, timer: !!S._sauT }; });
  // 4) ✖ 취소 창 — 사유·상품 고르기 · 두 번 눌러 맡김 · 바깥 눌러도 안 닫힘
  R.cx = await p.evaluate(async (ONO) => { S.shipC = window.__C0; const sh = document.getElementById('sheet'); sh.querySelector(`.shp-oh [data-cxo="${ONO}"]`).click(); await new Promise((r) => setTimeout(r, 80));
    const w = document.querySelector('.cxw-bg'); if (!w.querySelector('[data-cxgo]')) return { dbg: w.innerHTML.slice(0, 600), n: (S.shipC.orders || []).length }; const o = { open: !!w, nIt: w.querySelectorAll('.cxw-it').length, allOn: w.querySelectorAll('.cxw-it.on').length, goDis: w.querySelector('[data-cxgo]').disabled, unk: !!w.querySelector('.cxw-opt.unk') };
    w.querySelector('[data-cxr="2"]').click(); await new Promise((r) => setTimeout(r, 30)); const w2 = document.querySelector('.cxw-bg'); w2.querySelectorAll('.cxw-it')[1].click(); await new Promise((r) => setTimeout(r, 30));
    const w3 = document.querySelector('.cxw-bg'); o.selAfter = w3.querySelectorAll('.cxw-it.on').length; o.goEn = !w3.querySelector('[data-cxgo]').disabled; o.sum = w3.querySelector('.cxw-sum').textContent;
    w3.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 30)); o.stillOpen = !!document.querySelector('.cxw-bg');
    document.querySelector('[data-cxgo]').click(); await new Promise((r) => setTimeout(r, 50)); o.armed = /한 번 더/.test(document.querySelector('[data-cxgo]').textContent);
    let d0 = await db.collection('shp_cmds').doc('cx_' + ONO).get(); o.notYet = !d0.exists;
    await new Promise((r) => setTimeout(r, 450)); document.querySelector('[data-cxgo]').click(); await new Promise((r) => setTimeout(r, 300));
    const d = await db.collection('shp_cmds').doc('cx_' + ONO).get(); const v = d.exists ? d.data() : {}; o.cmd = { type: v.type, status: v.status, reason: v.reason, items: v.items, whole: v.whole, orderNo: v.orderNo };
    const K = window.ReadnowRegistry && window.ReadnowRegistry.KINDS && window.ReadnowRegistry.KINDS.cancelOrder; o.kind = K ? { by: K.by, money: K.money, safe: K.safe, lane: K.lane } : null;
    // 처리 중이면 다시 맡기기 막힘
    S.cmdAll = S.cmdAll || new Map(); S.cmdAll.set('cx_' + ONO, { id: 'cx_' + ONO, ...v }); S.shipC = window.__C0; cxDraw(); o.busyTxt = (document.querySelector('.cxw-st') || {}).textContent || ''; o.busyGoDis = document.querySelector('[data-cxgo]').disabled;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise((r) => setTimeout(r, 60)); o.escClosed = !document.querySelector('.cxw-bg');
    // 결과(전체 취소로 확인) → 다음엔 부분 취소 막힘
    S.cmdAll.set('cx_' + ONO, { id: 'cx_' + ONO, ...v, status: 'done', doneAt: new Date().toISOString(), result: { state: 'doneAll', learnedOpt: 'all', sent: [v.items[0]] } }); cxClose(); S.shipC = window.__C0; cxOpen(ONO, S.shipC.orders[0].items[0].listingId); await new Promise((r) => setTimeout(r, 30));
    const w4 = document.querySelector('.cxw-bg'); o.lock = { all: !!w4.querySelector('.cxw-opt.all'), on: w4.querySelectorAll('.cxw-it.on').length, dis: [...w4.querySelectorAll('.cxw-it')].every((b) => b.disabled), st: (w4.querySelector('.cxw-st') || {}).textContent || '' };
    S.shipC = window.__C0; S.cxw.sel = new Set([String(S.shipC.orders[0].items[0].listingId)]); S.cxw.reason = 1; const before = (await db.collection('shp_cmds').doc('cx_' + ONO).get()).data().createdAt; S.cmdAll.get('cx_' + ONO).status = 'done';
    await cxSend(); const after = (await db.collection('shp_cmds').doc('cx_' + ONO).get()).data().createdAt; o.partialBlocked = before === after; cxClose();
    // 한 권 주문: 그 상품 고정
    S.shipC = window.__C0; cxOpen('001-A870000002'); const w5 = document.querySelector('.cxw-bg'); o.single = { n: w5.querySelectorAll('.cxw-it').length, on: w5.querySelectorAll('.cxw-it.on').length, noOpt: !w5.querySelector('.cxw-opt') }; cxClose();
    return o; }, ONO);
  // 5) 🎨 알라딘 화면(📄) 판매자 색
  R.paint = await p.evaluate(() => { S.sellers = S.sellers || new Map(); S.sellersLoaded = true; S.sellers.set('sc_5001', { id: 'sc_5001', sc: '5001', name: '좋은가게', rev6m: 300, reviewCount: 900 });
    const row = (sc, nm, lid, p) => `<tr><td class="sell_tableCF1"><div class="Ere_sub_top"><span>상</span></div></td><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=${lid}">책</a></td><td><ul class="price"><li><span class="Ere_fs20">${p}</span>원</li><li>배송비 : 2,500원</li></ul></td><td class="seller"><a href="/shop/usedshop/wshopitem.aspx?SC=${sc}">${nm}</a></td></tr>`;
    const doc = new DOMParser().parseFromString(`<html><body><table class="Ere_usedsell_table">${row('5001', '좋은가게', '11', '5,000')}${row('5002', '모르는가게', '12', '6,000')}${row('996008', '북스킹', '13', '7,000')}</table></body></html>`, 'text/html');
    const box = document.createElement('div'); box.innerHTML = '<div class="alpv-ft">ft</div>'; alPvPaint(doc, 'https://www.aladin.co.kr/shop/UsedShop/wuseditemall.aspx?ItemId=1&TabType=0', box);
    const trs = [...doc.querySelectorAll('tr')]; return { bg: trs.map((t) => t.querySelector('td').style.backgroundColor), out: trs.map((t) => t.style.outline || ''), tip: trs.map((t) => t.title.split('\n')[0]), ft: box.textContent, q: [...(S._sqDone || [])] }; });
  console.log(JSON.stringify(R, null, 1));
  const ok = R.col.v.every((c) => c === 'rgb(46, 58, 120)') && R.col.me.every((c) => c === 'rgb(46, 58, 120)') && R.col.bd === 'dashed' && /▲/.test(R.col.lab[0]) && /●/.test(R.col.lab[1]) && /▼/.test(R.col.lab[2])
    && R.ship.blk && R.ship.sumInHead && R.ship.listInScroll && R.ship.ovf === 'auto' && R.ship.blkOvf === 'visible' && R.ship.fold && R.ship.folded && R.ship.ls === '1' && /접음/.test(R.ship.toast) && R.ship.keep && R.ship.unfold && R.ship.cxBtn === 2 && R.ship.cxItem >= 1
    && /자동 판단 대기/.test(R.sau.a) && /MJ-MAIN/.test(R.sau.a) && /sau wait/.test(R.sau.a) && /주문 뒤/.test(R.sau.a) && !/클라우드가/.test(R.sau.a) && /sau bad/.test(R.sau.b) && /10분 넘게/.test(R.sau.b) && /저절로 판단/.test(R.sau.b) && /sau bad/.test(R.sau.c) && R.sau.timer
    && R.cx.open && R.cx.nIt === 2 && R.cx.allOn === 2 && R.cx.goDis && R.cx.unk && R.cx.selAfter === 1 && R.cx.goEn && R.cx.stillOpen && R.cx.armed && R.cx.notYet
    && R.cx.cmd.type === 'cancelOrder' && R.cx.cmd.status === 'queued' && R.cx.cmd.reason === 2 && R.cx.cmd.items.length === 1 && R.cx.cmd.whole === false && R.cx.cmd.orderNo === ONO
    && R.cx.kind && R.cx.kind.by.join() === 'pc' && R.cx.kind.money === true && R.cx.kind.safe === false && R.cx.kind.lane === 'scm' && /맡김/.test(R.cx.busyTxt) && R.cx.busyGoDis && R.cx.escClosed
    && R.cx.lock.all && R.cx.lock.on === 2 && R.cx.lock.dis && /전체가 취소/.test(R.cx.lock.st) && R.cx.partialBlocked && R.cx.single.n === 1 && R.cx.single.on === 1 && R.cx.single.noOpt
    && R.paint.bg[0] && !R.paint.bg[1] && /dashed/.test(R.paint.out[1]) && R.paint.bg[2] && /좋은가게/.test(R.paint.tip[0]) && /북스킹/.test(R.paint.tip[2]) && /판매자 색 2줄/.test(R.paint.ft) && R.paint.q.includes('5002') && !errs.length;
  console.log(errs.join(' | ')); console.log(ok ? '✓ tS 통과' : '❌ tS 실패');
});
