// tY24AUTO — 정범님 11/04 두 번째: 🟦 예스24 탭 ① 예전 주문 저절로 닫기(기능 켜기 전 · 목록에 없음) · 오늘 주문('발송처리 예정')은 남음 · '알라딘에서 먼저 팔림 → 예스24 취소'(판매종료·이중 판매 사례) · ↩ 다시 열기
//   ② 카드 → 예스24 중고 허브 시장 맡김(hubReq) · 읽은 허브 표시 ③ 📦 ALPS 새 일에 예스24·💵 현금 주문 함께(같은 받는 분 = 한 상자 열쇠) · 한 번만 · 운송장 → 예스24 yInv·현금 invoice · 맞춤 표엔 알라딘만
//   ④ ALPS 뒤 알라딘 송장 입력 저절로(첫 번 1건만 · 한 일에 한 번 · 이미 맡긴 주문 뺌) ⑤ 🤖 예스24 자동 처리 맡김(발송처리 · 첫 건 확인 후 실행 · 한 번만 · 멈춤 → 홈 알림)
// 시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
    const L = (id, o) => S.plist.set('aladin_' + id, { id: 'aladin_' + id, usedCode: id, listingId: 'L' + id, status: '판매중', active: true, qty: 1, grade: '상', price: 15000, sku: 'PNKLUX', ...o });
    L('U800000001', { title: '오늘 책', isbn13: '9791100000031', status: '판매중지', active: false, sku: 'PNKd1' }); L('U800000002', { title: '길 잃은 시간여행자를 위한 문명 건설 가이드', isbn13: '9791100000048', status: '판매완료', active: false }); L('U800000003', { title: '현금 책', isbn13: '9791100000055', status: '판매중지', active: false, sku: 'YLWd3' }); S.ver++;
    putOrder('ord_al1', { id: 'ord_al1', kind: 'sale', platform: 'aladin', orderNo: '001-OLD', orderedAt: '2026-10-10 09:00', items: [{ aladinUsedCode: 'U800000002', title: '길 잃은 시간여행자를 위한 문명 건설 가이드', qty: 1, price: 9000, lineStatus: 'normal' }] });
    putOrder('cash_x', { id: 'cash_x', platform: 'cash', kind: 'sale', cash: true, orderNo: '현금-20261103-abcd', orderedAt: '2026-11-03 11:00', customerId: 'cash_01000000000', buyer: { name: '손님A', phone1: '010-0000-0000' }, recipient: { name: '손님A', phone1: '010-0000-0000', address: '어느 시 어느 길 1' }, shippedAt: null, items: [{ title: '현금 책', qty: 1, price: 5000, lineStatus: 'normal', listingKey: 'aladin_U800000003' }] });
    putOrder('cash_y', { id: 'cash_y', platform: 'cash', kind: 'sale', cash: true, orderNo: '현금-20261103-efgh', orderedAt: '2026-11-03 12:00', buyer: { name: '손님B' }, recipient: { name: '손님B', phone1: '', address: '' }, shippedAt: null, items: [{ title: '주소 없는 책', qty: 1, price: 5000, lineStatus: 'normal' }] }); S._saleIdx = null; bump('o');
    S.y24.un = () => {}; S.y24.loaded = true; S.y24.ver = (S.y24.ver || 0) + 1; S.y24.lk = { m: {}, x: {} }; S.y24.lkUn = () => {};
    const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
    const raw = (id, sig, at, body) => db.collection('crm_y24_raw').doc(id).set({ sig, at: iso(at), part: 0, parts: 1, body: JSON.stringify(body) });
    await raw('r0', 'POST /api/Order/OrderList', now - 120e3, { RESULT_LIST: [{ ORD_NO: 'Y2610150001', ORD_DTL_NO: 1, GOODS_NO: 196000011, GOODS_NM: '어떤 예전 책', ORD_DT: '2026-10-15 10:00:00', RCVR_NM: '손님C', SALE_PRICE: 8000 }, { ORD_NO: 'Y2610120001', ORD_DTL_NO: 1, GOODS_NO: 196000002, GOODS_NM: '길 잃은 시간여행자를 위한 문명 건설 가이드', EAN: '9791100000048', GOODS_LEVEL_GB_NM: '상', ORD_STAT_NM: '주문취소', ORD_DT: '2026-10-12 10:00:00', RCVR_NM: '손님D', SALE_PRICE: 9000 }] });
    await raw('r1', 'POST /api/Order/OrderDeliveryList', now - 30e3, { DELIVERY_LIST: [{ ORD_NO: 'Y2611030001', ORD_DTL_NO: 1, GOODS_NO: 196000001, GOODS_NM: '오늘 책', EAN: '9791100000031', GOODS_LEVEL_GB_NM: '상', ORD_STAT_NM: '발송처리 예정', ORD_DT: '2026-11-03 14:00:00', ORDR_NM: '손님A', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000', RCVR_ADDR: '어느 시 어느 길 1', SALE_PRICE: 12000 }], TOTAL_COUNT: 1 });
    await raw('r2', 'POST /api/Order/NewOrderConfirmList', now - 20e3, { RESULT_LIST: [], TOTAL_COUNT: 0 });
    y24oWatch(); await W(400); await y24oScan(true); await W(500);
    const T = () => S.y24o.m.get('Y2611030001'); out.tStep = y24oStep(T()); out.tStage = T().ystage;
    await y24oAutoOld(true); await W(400); const D = (no) => (FS.crm_y24_orders || {})[no] || {};
    out.o1 = ((D('Y2610150001').man || {}).old || {}).kind; out.o2 = ((D('Y2610120001').man || {}).old || {}).kind; out.tOld = !!(D('Y2611030001').man || {}).old;
    out.alF = ((D('Y2610120001').alFirst || {})['1'] || {}).usedCode; out.lkEnd = (((FS.app_settings || {}).y24_link || {}).m || {})['196000002']; out.cases = Object.keys((((FS.app_settings || {}).y24_link || {}).cases) || {}).length;
    out.act = y24oList().filter(y24oActive).map((o) => o.orderNo);
    // ↩ 다시 열기 → 다시 저절로 닫지 않음
    await y24oReopen('Y2610150001'); await y24oAutoOld(true); await W(300); out.reopen = y24oActive(S.y24o.m.get('Y2610150001')) && !!((D('Y2610150001').man || {}).old || {}).undo;
    await y24oClose('Y2610150001', { kind: 'hand', why: '시험' }, false);
    // 화면
    S.shipTab = 'y24'; S.ship = { at: new Date().toISOString(), tabCounts: {}, orders: [] }; S.shipC = { orders: [], at: new Date().toISOString() }; openShip(); await W(900); const sh = document.getElementById('sheet'); const tx = sh.innerText;
    out.scr = { cards: sh.querySelectorAll('section.y24o').length, next: /발송처리 예정/.test(tx) && /발송관리/.test(tx), olds: /예전 주문 · 처리 끝 2건/.test(tx), alf: /알라딘에서 먼저 팔림 → 예스24 취소/.test(sh.innerHTML), autoT: !!sh.querySelector('#y24o_auto'), rec: !!sh.querySelector('#y24o_selrec'), sel: !!sh.querySelector('[data-y24osel="Y2611030001"]') };
    await W(300); out.hubReq = !!(D('Y2611030001').hubReq || {}).at;
    await db.collection('crm_y24_orders').doc('Y2611030001').set({ y24hub: { 1: { at: new Date().toISOString(), url: 'https://www.yes24.com/Product/UsedShopHub/Hub/3849060', n: 2, nAll: 3, grade: '상', min: 7000, minSame: 9000, nSame: 1, low: [{ p: 7000, g: '중', s: null }, { p: 9000, g: '상', s: 2500 }], mine: [{ p: 12000, g: '상' }] } }, hubAt: new Date(Date.now() + 1000).toISOString() }, { merge: true }); await W(300); openShip(); await W(700);
    out.hubShow = /다른 판매자 2개/.test(document.getElementById('sheet').innerText) && /같은 등급\(상\) 1개 최저 9,000원/.test(document.getElementById('sheet').innerText);
    // ③ ALPS 함께
    try { localStorage.setItem('rn_alps_y24on', '1'); localStorage.removeItem('rn_alps_cashon'); } catch (e) {}
    const SH = window.ReadnowShipping; const Hd = SH.ALADIN_XLS_HEAD; const row = (no, sku, t, rcv) => ({ v: Hd.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345' }[h] || '')) });
    S.ship = { at: new Date().toISOString(), tabCounts: { '발송 요청': 1 }, orders: [{ orderNo: '001-B1', buyer: '나수령', orderedAt: SH.ymd(new Date()) + ' 09:00', recipient: { name: '나수령' }, items: [{ listingId: '91', title: '파란 책', price: 5000, qty: 1, sku: 'BLUAAA' }] }] }; S.shipX = { at: new Date().toISOString(), header: Hd, rows: [row('001-B1', 'BLUAAA', '[중고-최상] 파란 책', '나수령')] }; __FS.shp_state = __FS.shp_state || {}; __FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); __FS.shp_state.excel = S.shipX; const KEEP = JSON.parse(JSON.stringify(S.ship.orders));
    const C = alpsXCand(); out.cand = { ok: C.ok.map((x) => x.key).sort().join(','), no: C.no.map((x) => x.key + ':' + x.why).join(',') }; const keys = alpsY24Pick(); out.pick = keys.slice().sort().join(',');
    const A = alpsBuild(S.ship, KEEP, keys); out.rows = A.rows.map((x) => x.ono + '|' + x.name + '|' + x.sku); out.nAl = A.nAl; out.nX = A.nY24; out.rk = A.rows[1].rk === A.rows[2].rk && A.rows[0].rk !== A.rows[1].rk; out.ask = alpsY24AskTx(A);
    const A0 = alpsBuild(S.ship, KEEP); out.noX = A0.rows.length; /* 고르지 않으면(진행 중 일 다시 만들기 등) 알라딘 줄만 */
    alpsY24Begin(A, 'r1'); await W(300); out.mark = !!(D('Y2611030001').alps || {}).runId && !!(((FS.crm_orders || {}).cash_x || {}).alps || {}).runId; out.after = alpsY24Pick().length;
    out.cur = alpsY24Cur('r1').slice().sort().join(',');
    const Wb = SH.parseAlpsWaybills([['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ['240000000011', '나수령', '[중고-최상] 파란 책', 'BLUAAA', 'M1', '출력', '', ''], ['240000000022', '손님A', '오늘 책', 'PNKd1', 'M2', '출력', '', 'P'], ['240000000022', '손님A', '현금 책', 'YLWd3', 'M3', '출력', '', 'P']]);
    const M = alpsY24Match(KEEP, Wb, alpsY24Cur('r1'), 'r1'); await W(600); out.match = { al: M.byOrder.map((x) => x.orderNo + ':' + x.status + ':' + x.invoice).join(','), extra: M.extra.length, y: (M.y24 || []).map((x) => x.key + ':' + x.invoice).sort().join(',') };
    out.yInv = (D('Y2611030001').yInv || {}).no; out.cashInv = ((((FS.crm_orders || {}).cash_x) || {}).invoice || {}).no;
    // ④ 알라딘 송장 입력 저절로
    S.app.alpsInvAuto = { on: true, ok: 0 }; out.inv1 = await alpsInvAuto(M, 'f.xlsx', 'r1'); out.inv2 = await alpsInvAuto(M, 'f.xlsx', 'r1'); out.inv3 = await alpsInvAuto(M, 'f.xlsx', 'r2'); const B = (FS.shp_invoices || {}).alps_r1 || {}; out.batch = { lim: B.limit, n: (B.items || []).length, no: (B.items || []).map((x) => x.orderNo).join(','), auto: B.auto };
    S.app.alpsInvAuto = { on: false, ok: 0 }; out.inv4 = await alpsInvAuto(M, 'f.xlsx', 'r9');
    // ⑤ 🤖 예스24 자동 처리 — 오늘 주문은 이미 접수확인(발송처리 예정) → 접수확인 건너뛰고 발송처리 · 첫 건 확인 후 실행
    S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), auto: { on: true }, autoOk: {} } };
    const q1 = await y24oAutoOne(T(), false); const q2 = await y24oAutoOne(T(), false); await W(200); const AS = (D('Y2611030001').auto || {}).ship || {}; out.q = [q1, q2, AS.state, AS.confirm, AS.no, AS.courier, D('Y2611030001').autoQ, !(D('Y2611030001').auto || {}).ack].join('|');
    S.shipTab = 'y24'; openShip(); await W(600); /* 발송처리를 맡겨 📤 보내는 중 칸으로 옮겨 감 — 옛 바로가기 'y24'는 예스24 할 일이 있는 가장 앞 단계로 */ out.card = { stg: !!document.querySelector('[data-stab="sending"].on'), big: /예스24 발송처리에 넣을 송장/.test(document.getElementById('sheet').innerText) && /240000000022/.test(document.getElementById('sheet').innerText), auto: /이대로 실행/.test(document.getElementById('sheet').innerText) };
    await db.collection('crm_y24_orders').doc('Y2611030001').set({ auto: { ship: { ...AS, state: 'fail', msg: '발송관리 목록에서 주문을 못 찾음' } } }, { merge: true }); await W(300);
    const A1 = []; y24oAlerts((lv, t, key, x) => A1.push(lv + ':' + key)); out.alert = A1.join(',');
    const q3 = await y24oAutoOne(T(), true); await W(200); out.retry = q3 + ':' + ((D('Y2611030001').auto || {}).ship || {}).seq;
    await db.collection('crm_y24_orders').doc('Y2611030001').set({ auto: { ship: { state: 'done', seq: 2 } } }, { merge: true }); await W(300); out.doneStep = y24oStep(T());
    return out; });
  console.log(JSON.stringify(r));
  ok(r.tStage === 'deliv' && r.tStep === 'ack' && !r.tOld, "오늘 주문: 예스24 '발송처리 예정' = ① 접수확인함 · 닫지 않음");
  ok(r.o1 === 'gone' && r.o2 === 'alFirst' && JSON.stringify(r.act) === '["Y2611030001"]', `예전 주문 둘은 저절로 닫힘(목록에 없음 · 알라딘 먼저 팔림) → 처리할 주문은 오늘 1건: ${r.o1}/${r.o2} ${JSON.stringify(r.act)}`);
  ok(r.alF === 'U800000002' && r.lkEnd && r.lkEnd.ended && r.cases === 1, '알라딘에서 먼저 팔림 → 예스24 취소: 주문 기록·🔗 연결 표 판매종료·이중 판매 사례');
  ok(r.reopen, '↩ 다시 열기 → 처리할 주문으로 · 다시 저절로 닫지 않음');
  ok(r.scr.cards >= 1 && r.scr.next && r.scr.olds && r.scr.alf && r.scr.autoT && r.scr.rec && r.scr.sel, `탭: 다음 할 일(발송처리 예정 → 발송관리) · 예전 주문 묶음 · 한 번에 닫기 · 🤖 켜기: ${JSON.stringify(r.scr)}`);
  ok(r.hubReq && r.hubShow, '카드를 그리면 허브 시장을 맡김 · 읽은 허브 값이 보임');
  ok(r.cand.ok === 'cash:cash_x,y24:Y2611030001' && /cash:cash_y:받는 분 전화 없음/.test(r.cand.no) && r.pick === r.cand.ok, `ALPS 함께 넣을 수 있는 것: 예스24 접수확인함 · 현금 출고 대기 · 받는 분 정보 없으면 까닭: ${JSON.stringify(r.cand)}`);
  ok(r.rows.length === 3 && r.nAl === 1 && r.nX === 2 && /^Y2611030001\|손님A\|PNKd1$/.test(r.rows[1]) && /^현금-20261103-abcd\|손님A\|YLWd3$/.test(r.rows[2]) && r.rk && r.noX === 1, `ALPS 줄: 알라딘 뒤에 예스24·현금 · 같은 받는 분 = 같은 상자 열쇠 · 고르지 않으면 알라딘만: ${r.rows.join(' / ')}`);
  ok(/예스24 주문 1건/.test(r.ask) && /현금 판매 주문 1건/.test(r.ask), '시작 물음에 함께 넣는 주문이 보임');
  ok(r.mark && r.after === 0 && r.cur === 'cash:cash_x,y24:Y2611030001', 'ALPS 일에 넣음 표시 → 다음 일엔 다시 안 넣음 · 이 일의 목록은 기억(빠진 줄 다시 만들기용)');
  ok(r.match.al === '001-B1:ok:240000000011' && r.match.extra === 0 && r.match.y === 'cash:cash_x:240000000022,y24:Y2611030001:240000000022' && r.yInv === '240000000022' && r.cashInv === '240000000022', `운송장: 알라딘 맞춤 그대로 · 예스24 yInv · 현금 invoice · 맞춤 표엔 알라딘만: ${JSON.stringify(r.match)}`);
  ok(r.inv1 === 'made' && r.inv2 !== 'made' && r.inv3 === 'none' && r.inv4 === null && r.batch.lim === 1 && r.batch.n === 1 && r.batch.no === '001-B1' && r.batch.auto, `알라딘 송장 입력 저절로: 알라딘만 · 첫 번 1건 · 한 일에 한 번 · 이미 맡긴 주문 뺌 · 끄면 안 함: ${JSON.stringify([r.inv1, r.inv2, r.inv3, r.inv4, r.batch])}`);
  ok(r.q === 'ship||queued|true|240000000022|롯데택배|true|true', `🤖 발송처리 맡김(접수확인 건너뜀 · 첫 건 확인 후 실행 · 한 번만): ${r.q}`);
  ok(r.card.big && r.card.auto && r.card.stg, '카드(📤 보내는 중 칸): 예스24 발송처리에 넣을 송장(크게) · 첫 건 [▶ 이대로 실행] 안내');
  ok(/top:y24auto/.test(r.alert) && r.retry === 'ship:2' && r.doneStep === 'inv', `멈추면 홈 알림 · 다시(seq 2) · 끝나면 ③ 단계: ${r.alert} ${r.retry} ${r.doneStep}`);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tY24AUTO 모두 통과');
});
