// tY24ORD — 정범님 11/04: 🟦 예스24 주문 — 가짜 예스24 주문 응답(crm_y24_raw) → 풀기(crm_y24_orders) → 홈 ❗ 알림(맨 위 · 🟦 표) → 오늘 출고 🟦 예스24 탭 카드 → ⛔ 알라딘 판매중지 맡김(두 번 누름) → 단계·송장 기록 · 모양 모르는 응답 → '응답 모양 확인 필요' · 칸 이름 보기
// 시험 자료의 손님은 '손님A' · 전화 010-0000-0000 (공개 저장소 — 실제 개인 정보 없음)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const L = (id, o) => S.plist.set('aladin_' + id, { id: 'aladin_' + id, usedCode: id, listingId: 'L' + id, status: '판매중', active: true, qty: 1, grade: '상', price: 15000, sku: 'PNKLUX', ...o });
    L('U700000001', { title: '예스24에서 팔린 책', isbn13: '9791100000031', bookId: 'B1' }); L('U700000002', { title: '두 권 있는 책', isbn13: '9791100000048', qty: 2, sku: 'YLWSTD' }); L('U700000003', { title: '이미 판매중지 책', isbn13: '9791100000055', status: '판매중지' });
    S.sku.seqUn = () => {}; S.sku.map.set('aladin_U700000001', { c: ['d5001'] }); S.ver++;
    S.pmetrics = S.pmetrics || new Map(); S.pmetrics.set('B1', { lastCheckedAt: '2026-11-03T00:00:00.000Z', usedTotal: 3, usedFirstPage: [{ price: 12000, grade: '상', seller: '다른가게', sellerCode: '111' }, { price: 15000, grade: '상', seller: '북스킹', sellerCode: '996008', ours: true }, { price: 18000, grade: '최상', seller: '또다른', sellerCode: '222' }] });
    const now = new Date().toISOString(); const Y = (no, o) => S.y24.list.set(no, { id: no, goodsNo: no, state: '02', stock: 1, grade: '상', price: 16000, firstSeenAt: '2026-10-30T00:00:00.000Z', lastSeenAt: now, ...o });
    Y('196000001', { title: '예스24에서 팔린 책', isbn13: '9791100000031' }); S.y24.un = () => {}; S.y24.loaded = true; S.y24.ver = (S.y24.ver || 0) + 1; S.y24.lk = { m: {}, x: {} }; S.y24.lkUn = () => {};
    // ① 가짜 예스24 신규 주문 응답 — 주문 둘(같은 손님 · 하나는 상품 둘) · 칸 이름은 예스24 판매관리 이름 규칙대로 지어 냄
    const body = { RESULT_LIST: [
      { ORD_NO: 'Y2611040001', ORD_DTL_NO: 1, GOODS_NO: 196000001, GOODS_NM: '예스24에서 팔린 책', ORD_QTY: 1, SALE_PRICE: 16000, ORD_STAT_CD: '01', ORD_STAT_NM: '신규주문', ORD_DT: '2026-11-04 10:23:11', ORDR_NM: '손님A', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000', RCVR_ADDR: '어느 시 어느 길 1', DELV_FEE: 2500 },
      { ORD_NO: 'Y2611040002', ORD_DTL_NO: 1, GOODS_NO: 196000099, GOODS_NM: '두 권 있는 책', EAN: '9791100000048', GOODS_LEVEL_GB_NM: '상', ORD_QTY: 1, SALE_PRICE: 9000, ORD_STAT_NM: '신규주문', ORD_DT: '20261104103000', ORDR_NM: '손님A', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000', RCVR_ADDR: '어느 시 어느 길 1' },
      { ORD_NO: 'Y2611040002', ORD_DTL_NO: 2, GOODS_NO: 196000098, GOODS_NM: '이미 판매중지 책', EAN: '9791100000055', GOODS_LEVEL_GB_NM: '상', ORD_QTY: 1, SALE_PRICE: 7000, ORD_STAT_NM: '신규주문', ORD_DT: '20261104103000', ORDR_NM: '손님A', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000', RCVR_ADDR: '어느 시 어느 길 1' }], TOTAL_COUNT: 3, RESULT_CODE: '0000' };
    await db.collection('crm_y24_raw').doc('o1').set({ sig: 'POST /api/Order/NewOrderConfirmList', at: new Date(Date.now() - 60e3).toISOString(), part: 0, parts: 1, body: JSON.stringify(body) });
    await db.collection('crm_y24_raw').doc('o0').set({ sig: 'POST /api/Order/OrderDeliveryListInit', at: new Date(Date.now() - 50e3).toISOString(), part: 0, parts: 1, body: JSON.stringify({ NOT_AVAILABLE_FOR_SALE_CODE_LIST: [{ CD_NO: '1', CD_DTL_NO: '01', CD_DTL_NM: '품절' }], DELIVERY_COMPANY_LIST: [{ ENTR_NO: 1, ENTR_NM: '가짜택배' }] }) });
    y24oWatch(); await W(400); const sc = await y24oScan(true); out.scan = sc; await W(500); out.unk0 = Object.values((S.y24o.st || {}).kinds || {}).reduce((a, x) => a + (x.unknown || 0), 0);
    const o1 = (FS.crm_y24_orders || {}).Y2611040001, o2 = (FS.crm_y24_orders || {}).Y2611040002; out.o1 = o1 && [o1.ystage, o1.items.length, o1.items[0].price, o1.recipient.name, o1.fee, o1.orderedAt].join('|'); out.o2 = o2 && o2.items.length;
    // 같은 응답을 다시 풀어도 쓰지 않음
    const w0 = (window.__FSW || []).filter((x) => x.n === 'crm_y24_orders').length; await y24oScan(true); await W(300); out.rewrite = (window.__FSW || []).filter((x) => x.n === 'crm_y24_orders').length - w0;
    // ② 짝 · 손님 판정
    const m1 = y24oMatch(S.y24o.m.get('Y2611040001').items[0]); out.m1 = m1.how + ':' + m1.L.map((l) => l.id).join(','); const m2 = y24oMatch(S.y24o.m.get('Y2611040002').items[0]); out.m2 = m2.how + ':' + m2.L.map((l) => l.id).join(',');
    out.cust1 = y24oCust(S.y24o.m.get('Y2611040001')).n; out.cust2 = y24oCust(S.y24o.m.get('Y2611040002')).n;
    // ③ 홈 알림 — 맨 위
    const A = []; y24oAlerts((lv, t, key, x) => A.push({ lv, t, key, x })); out.alerts = A.map((a) => a.lv + ':' + a.key + ':' + a.x.n);
    out.alHtml = (() => { try { return alertsHtml(A.map((a) => ({ ...a }))); } catch (e) { return 'ERR ' + e.message; } })().includes('chn-y24');
    // ④ 오늘 출고 🟦 예스24 탭
    S.shipTab = 'y24'; S.ship = S.ship || { orders: [], tabCounts: {}, at: now }; S.shipC = S.shipC || { orders: [], at: now }; openShip(); await W(900); const sh = document.getElementById('sheet'); const t = sh.innerText;
    out.scr = { tab: !!sh.querySelector('[data-stab="y24"].on'), cards: sh.querySelectorAll('section.y24o').length, same: /같은 손님 주문 2건/.test(t), stop: sh.querySelectorAll('[data-y24ostop]').length, notLive: /판매중 아님/.test(t), mkt: !!sh.querySelector('.y24o-blk .shp-mkl'), sku: /PNKd5001EX/.test(t), cust: /예스24 처음 보는 손님|예스24 2번째 주문/.test(t), sep: /알라딘 고객과 따로/.test(t), courier: /가짜택배/.test(sh.innerHTML) };
    // 그때 시장이 주문 기록에 남음
    await W(300); out.snap = !!(((FS.crm_y24_orders || {}).Y2611040001 || {}).mkt || {})['1'];
    // ⑤ ⛔ 알라딘 판매중지 — 두 번 눌러야
    const b = sh.querySelector('[data-y24ostop^="Y2611040001"]'); b.click(); await W(300); const after1 = Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit').length; out.arm = /한 번 더/.test(b.textContent) && after1 === 0;
    b.click(); await W(900); const cmds = Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit'); out.cmd = cmds.map((c) => c.listingKey + ':' + JSON.stringify(c.ch)).join(' / '); out.alStop = ((((FS.crm_y24_orders || {}).Y2611040001 || {}).alStop || {})['1'] || {}).how; out.reason = ((FS.prd_stop_reasons || {}).aladin_U700000001 || {}).reason;
    // 두 권 매물은 수량 −1
    openShip(); await W(600); const b2 = document.querySelector('[data-y24ostop^="Y2611040002"]'); if (b2) { b2.click(); await W(200); b2.click(); await W(900); } out.cmd2 = Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit' && c.listingKey === 'aladin_U700000002').map((c) => JSON.stringify(c.ch)).join(',');
    const A2 = []; y24oAlerts((lv, t, key, x) => A2.push({ lv, t, key, x })); out.alerts2 = A2.map((a) => a.key).join(',');
    // ⑥ 단계 · 송장
    openShip(); await W(500); document.querySelector('[data-y24oman="Y2611040001|ack"]').click(); await W(500); out.ack = !!((((FS.crm_y24_orders || {}).Y2611040001 || {}).man || {}).ack || {}).at;
    openShip(); await W(500); const inp = document.querySelector('[data-y24ono="Y2611040001"]'); inp.value = '1234567890123'; document.querySelector('[data-y24oinv="Y2611040001"]').click(); await W(600); const inv = (((FS.crm_y24_orders || {}).Y2611040001 || {}).man || {}).inv || {}; out.inv = inv.no + ':' + inv.courier; out.step = y24oStep(S.y24o.m.get('Y2611040001'));
    const A3 = []; y24oAlerts((lv, t, key, x) => A3.push({ lv, t, key, x })); out.alerts3 = A3.map((a) => a.key + ':' + a.x.n).join(',');
    // ⑦ 신규 주문 목록에서 빠짐
    await db.collection('crm_y24_raw').doc('o2').set({ sig: 'POST /api/Order/NewOrderConfirmList', at: new Date().toISOString(), part: 0, parts: 1, body: JSON.stringify({ RESULT_LIST: [], TOTAL_COUNT: 0 }) }); await y24oScan(true); await W(300); out.left = !!((S.y24o.m.get('Y2611040002') || {}).left || {}).NewOrderConfirmList;
    // ⑧ 모양 모르는 응답 → 알림 · 칸 이름 보기
    await db.collection('crm_y24_raw').doc('o3').set({ sig: 'POST /api/Order/OrderDeliveryList', at: new Date(Date.now() + 1000).toISOString(), part: 0, parts: 1, body: JSON.stringify({ DELIVERY_LIST: [{ X_ORDER_KEY: 'Z1', ITEM_TITLE: '무엇' }], TOTAL_COUNT: 1 }) });
    await y24oScan(true); await W(300); const A4 = []; y24oAlerts((lv, t, key, x) => A4.push({ lv, t, key, x })); out.shape = A4.filter((a) => a.key === 'y24shape').map((a) => a.lv).join(); out.keysHtml = /X_ORDER_KEY/.test(y24oKeysHtml()) && /주문번호 칸을 못 찾음/.test(y24oKeysHtml()) && !/손님A/.test(y24oKeysHtml());
    openAlert('y24shape'); await W(700); out.kbox = /X_ORDER_KEY/.test((document.getElementById('y24o_kbox') || {}).innerText || '');
    // ⑨ ① 탭 위 파란 띠
    S.shipTab = 'confirm'; openShip(); await W(600); out.banner = !!document.querySelector('.y24o-ban');
    return out; });
  console.log(JSON.stringify(r));
  ok(r.scan && r.scan.raws >= 1 && r.scan.wrote === 2, '가짜 신규 주문 응답 → 주문 기록 2건: ' + JSON.stringify(r.scan));
  ok(r.o1 && /^new\|1\|16000\|손님A\|2500\|2026-11-04T01:23:11/.test(r.o1) && r.o2 === 2, '칸 풀기(단계·상품·값·받는 분·배송비·주문 시각 한국→UTC) · 같은 주문 상품 2개: ' + r.o1);
  ok(r.unk0 === 0, '화면 처음 자료(Init · 택배사 목록)는 주문 줄로 안 셈(모양 경고 없음): ' + r.unk0);
  ok(r.rewrite === 0, '같은 응답을 다시 풀면 쓰지 않음: ' + r.rewrite);
  ok(/^isbn:aladin_U700000001$/.test(r.m1) && /^isbn:aladin_U700000002$/.test(r.m2), '예스24 매물 번호 → 알라딘 짝 · 바코드+등급 → 알라딘 짝: ' + r.m1 + ' / ' + r.m2);
  ok(r.cust1 === 0 && r.cust2 === 1, '손님 판정은 이 주문 전 기준(같은 손님 두 번째 주문): ' + r.cust1 + ',' + r.cust2);
  ok(r.alerts[0] === 'top:y24ord:2' && r.alerts.includes('top:y24ordal:2') && r.alHtml, '홈 ❗ 예스24 주문 2건 · 🔴 알라딘에서 판매중 2권 · 🟦 표: ' + r.alerts.join(' / '));
  ok(r.scr.tab && r.scr.cards === 2 && r.scr.same && r.scr.stop === 2 && r.scr.notLive && r.scr.mkt && r.scr.sku && r.scr.cust && r.scr.sep && r.scr.courier, '오늘 출고 🟦 예스24 탭 카드(같은 손님 묶음·판매중지 단추·판매중 아님·시장 블록·SKU·손님 판정·예스24 택배사 목록): ' + JSON.stringify(r.scr));
  ok(r.snap, '그때 시장을 주문 기록에 남김');
  ok(r.arm && /aladin_U700000001:\{"state":"판매중지"\}/.test(r.cmd) && r.alStop === 'stop' && r.reason === 'elsewhere', '⛔ 두 번 눌러야 판매중지 맡김(상품 정보 수정 길) · 판매중지 이유 다른 판매처: ' + r.cmd);
  ok(r.cmd2 === '{"qty":1}', '두 권 매물은 수량 2 → 1: ' + r.cmd2);
  ok(!/y24ordal/.test(r.alerts2), '판매중지를 맡기면 🔴 알림이 빠짐: ' + r.alerts2);
  ok(r.ack && r.inv === '1234567890123:가짜택배' && r.step === 'inv' && r.alerts3 === 'y24ord:1', '단계 ① 접수확인 · ③ 송장 기록 → 처리할 주문 1건으로: ' + r.inv + ' ' + r.alerts3);
  ok(r.left, '더 새 신규 주문 목록에 없으면 \'목록에서 빠짐\' 표시');
  ok(r.shape === 'amber' && r.keysHtml && r.kbox, '모양 모르는 응답 → ▲ 응답 모양 확인 필요 · 칸 이름 보기(값 없이) · 알림에서 바로 열기');
  ok(r.banner, '① 주문확인요청 탭 위 🟦 예스24 띠');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
