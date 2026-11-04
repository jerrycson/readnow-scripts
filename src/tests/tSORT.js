// tSORT — 정범님 11/05 '출고 준비 탭에서 주문시간순 정렬이 안 돼 · 확인 탭도 검토' — 주문 시각이 빈 주문(발송 요청 화면에서 못 읽음)도 우리 주문 기록·주문확인요청에서 채워 정렬
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('/home/user/w/pw/harness.js')(async (p) => { await p.evaluate(require('/home/user/w/pw/seed.js'));
  const R = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); await w(1500); const now = new Date().toISOString();
    const it = (t) => [{ listingId: 'L' + t, title: '책' + t, price: 5000, qty: 1 }];
    S.ship = { orders: [{ orderNo: 'A-3', buyer: '가', items: it(3) }, { orderNo: 'A-1', buyer: '나', items: it(1) }, { orderNo: 'A-2', buyer: '다', orderedAt: '2026-11-05 09:30', items: it(2) }], tabCounts: {}, at: now };
    S.orders = S.orders || new Map(); S.orders.set('A-1', { orderNo: 'A-1', orderedAt: '2026-11-05T00:10:00Z' }); S.orders.set('A-3', { orderNo: 'A-3', orderedAt: '2026-11-05 11:00' });
    S.shipC = { orders: [{ orderNo: 'C-2', buyer: '라', orderedAt: '2026-11-05 10:00', items: it(5) }, { orderNo: 'C-1', buyer: '마', orderedAt: '2026-11-05 08:00', items: it(4) }], at: now, enrich: {} };
    const ord = (L) => L.map((o) => o.orderNo); const SH = window.ReadnowShipping; S.shipView = 'order'; try { localStorage.setItem('rn-ship-warntop', '0'); } catch (e) {} S.shipWarnTop = false;
    const d = ord(shipSortMulti(SH, S.ship.orders, 'time')); const c = ord(shipSortMulti(SH, S.shipC.orders, 'time'));
    return { d, c, ts: S.ship.orders.map(shipOrdTs) }; });
  console.log(JSON.stringify(R));
  ok(R.d.join() === 'A-1,A-2,A-3', '출고 준비: 주문 시각이 빈 주문도 우리 주문 기록에서 채워 이른 순(A-1 09:10 → A-2 09:30 → A-3 11:00) ' + R.d.join());
  ok(R.ts[1] === '2026-11-05 09:10', 'UTC로 적힌 시각은 한국 시각으로 맞춤 ' + R.ts[1]);
  ok(R.c.join() === 'C-1,C-2', '확인: 주문 시각 이른 순 ' + R.c.join());
  console.log(bad ? `❌ tSORT 실패 ${bad}` : '✓ tSORT 통과'); });
