// tCUST1 — 정범님 11/03 '주문확인요청에선 첫 고객인데 발송요청에선 2번째 고객': 고객 판정은 '이 주문 전' 기준 하나 — 단계가 바뀌어도 같은 값
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const o = {}; const lab = (ono, og) => { const I = shipCustInfo(ono, og); return I ? I.items.map((x) => x.ic + x.label + '|' + x.why).join(' ;; ') : 'null'; };
    const ord = (ono, at, buyer, email, amt) => ({ orderNo: ono, orderedAt: at, buyer, buyerEmail: email, recipient: { sameAsBuyer: true, address: '서울 어딘가 1' }, items: [{ title: '책', price: amt, qty: 1 }] });
    // A: 처음 온 고객 — ① 고객 기록 없음 → ② 이 주문으로 고객 기록이 생김(saleOrderCount 1, orderIds에 이 주문)
    const A = ord('001-A0000001', '2026-11-03 10:00', '김처음', 'first@test.kr', 9000);
    S.shipC = { orders: [A], at: new Date().toISOString() }; S.ship = { orders: [], at: new Date().toISOString() }; S._custIdx = null; S.ver++;
    o.a1 = lab(A.orderNo);
    putCustomer('aladin_A', { displayName: '김처음', names: ['김처음'], emails: ['first@test.kr'], saleOrderCount: 1, salesAmount: 9000, orderIds: ['aladin_001-A0000001'], lastSaleAt: '2026-11-03 10:00', lastOrderAt: '2026-11-03 10:00' }); S.ver++;
    S.shipC = { orders: [], at: new Date().toISOString() }; S.ship = { orders: [A], at: new Date().toISOString() }; o.a2 = lab(A.orderNo);
    // B: 예전에 1번 산 고객 — ① 이 주문 전(saleOrderCount 1) → ② 이 주문까지 들어옴(saleOrderCount 2)
    const B = ord('001-A0000002', '2026-11-03 11:00', '이두번', 'two@test.kr', 7000);
    putCustomer('aladin_B', { displayName: '이두번', names: ['이두번'], emails: ['two@test.kr'], saleOrderCount: 1, salesAmount: 5000, orderIds: ['aladin_001-A0000000'], lastSaleAt: '2026-10-01 09:00', lastOrderAt: '2026-10-01 09:00' }); S.ver++;
    S.shipC = { orders: [B], at: new Date().toISOString() }; S.ship = { orders: [] }; o.b1 = lab(B.orderNo);
    putCustomer('aladin_B', { displayName: '이두번', names: ['이두번'], emails: ['two@test.kr'], saleOrderCount: 2, salesAmount: 12000, orderIds: ['aladin_001-A0000000', 'aladin_001-A0000002'], lastSaleAt: '2026-11-03 11:00', lastOrderAt: '2026-11-03 11:00' }); S.ver++;
    S.shipC = { orders: [] }; S.ship = { orders: [B] }; o.b2 = lab(B.orderNo);
    // C: 처음 온 사람이 같은 날 두 번 주문 — 둘 다 아직 고객 기록에 없음 → 두 번째 주문은 2번째
    const C1 = ord('001-A0000003', '2026-11-03 12:00', '박새로', 'new2@test.kr', 3000), C2 = ord('001-A0000004', '2026-11-03 12:30', '박새로', 'new2@test.kr', 4000);
    S.shipC = { orders: [C1, C2] }; S.ship = { orders: [] }; o.c1 = lab(C1.orderNo); o.c2 = lab(C2.orderNo);
    // D: 이 주문으로 VIP 조건(주문 2회)이 채워지는 고객 — 자동 ⭐은 이 주문 카드에선 두 단계 모두 안 보임
    S.cfg.vip = { ...(S.cfg.vip || {}), minValue: 30, maxRisk: 50, minOrders: 2, excludeSellers: false };
    const D = ord('001-A0000005', '2026-11-03 13:00', '최브이', 'vip@test.kr', 50000);
    const VP = (n, a) => [{ k: 'recency', pts: 25 }, { k: 'frequency', pts: n >= 2 ? 10 : 5 }, { k: 'monetary', pts: a >= 70000 ? 22 : 16 }, { k: 'engagement', pts: 0 }, { k: 'tenure', pts: 0 }];
    putCustomer('aladin_D', { displayName: '최브이', names: ['최브이'], emails: ['vip@test.kr'], saleOrderCount: 1, salesAmount: 30000, orderIds: ['aladin_001-A0000009'], lastSaleAt: '2026-09-01 09:00', scores: { value: 46, risk: 0, valueParts: VP(1, 30000), riskParts: [] } }); S.ver++;
    S.shipC = { orders: [D] }; S.ship = { orders: [] }; o.d1 = lab(D.orderNo);
    putCustomer('aladin_D', { displayName: '최브이', names: ['최브이'], emails: ['vip@test.kr'], saleOrderCount: 2, salesAmount: 80000, orderIds: ['aladin_001-A0000009', 'aladin_001-A0000005'], lastSaleAt: '2026-11-03 13:00', scores: { value: 57, risk: 0, valueParts: VP(2, 80000), riskParts: [] } }); S.ver++;
    S.shipC = { orders: [] }; S.ship = { orders: [D] }; o.d2 = lab(D.orderNo); o.dvipNow = effFlag(S.customers.get('aladin_D'), 'vip').on;
    return o; });
  console.log(JSON.stringify(R, null, 1));
  ok(/처음 보는 고객/.test(R.a1) && !/다시 온/.test(R.a1), '처음 온 고객 — 주문확인요청: 🆕');
  ok(/처음 보는 고객/.test(R.a2) && !/다시 온/.test(R.a2), '처음 온 고객 — 발송요청(이 주문으로 고객 기록이 생긴 뒤)에도 🆕 (예전엔 2번째)');
  ok(/2번째 주문/.test(R.b1) && /2번째 주문/.test(R.b2) && !/3번째/.test(R.b2), '1번 산 고객 — 두 단계 모두 2번째 (예전엔 발송요청에서 3번째)');
  ok(/5,000/.test(R.b1) && /5,000/.test(R.b2), '이 주문 전 금액도 같음(5,000원)');
  ok(/처음 보는 고객/.test(R.c1) && /2번째 주문/.test(R.c2), '같은 날 두 번 주문 — 앞 주문 🆕 · 뒤 주문 2번째');
  ok(R.dvipNow && !/⭐/.test(R.d1) && !/⭐/.test(R.d2) && /2번째/.test(R.d1) && /2번째/.test(R.d2), '이 주문으로 VIP 조건이 채워진 고객 — 두 단계 모두 ⭐ 없음 · 2번째 (고객 기록엔 지금 VIP)');
  console.log(bad ? `❌ tCUST1 실패 ${bad}` : '✓ tCUST1 통과'); });
