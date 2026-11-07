// tPRT — (정범님 11/07) 일별 출고 매출 = 그날 송장 출력 회차에 든 주문(시계 14:00로 나누지 않음) · 주·달·해 축하는 그 기간 마지막 날 확정 순간에만
//  ① 마감(14:00) 뒤 주문이라도 그날 출력했으면 그날 줄(금 15:00 · 화 15:30)
//  ② 출력을 쉰 날(토·일)이 끼면 그 회차만 주문 시각으로 나눔 — 토·일도 자기 줄 · 일 15:00 주문은 월
//  ③ 늦게 보낸 주문(목 주문 · 금 출력)은 출력한 날(금) 줄 · 첫 회차는 주문 시각
//  ④ 표·순위 = 새 셈 · ⚙ '일별 주문 매출'(rkOrdModel)은 예전 시계 셈 그대로 · 두 셈 합계 같음
//  ⑤ 화요일 확정 뒤 카드에 지난 주(일요일 끝) 카드가 따라 뜨지 않음(1.78.410 따라잡기 뺌)
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tPRT.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
(async () => {
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-10T16:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
    const r = await p.evaluate(async () => { const o = {}; try {
      window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true;
      ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-pl', 'rn-rkfx-pseen'].forEach((x) => localStorage.removeItem(x));
      S._sdL = true; S.shpDays = new Map(); S.shpDaysV = 1; S.orders = new Map(); let k = 0;
      const sale = (od, sd, price) => { k++; const id = 'aladin_P' + k; S.orders.set(id, { id, orderNo: 'P' + k, kind: 'sale', platform: 'aladin', orderedAt: od, shippedAt: sd, buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
      sale('2026-11-05T10:00', '2026-11-05T16:00', 10000); // 목 — 첫 회차
      sale('2026-11-06T10:00', '2026-11-06T16:00', 20000); // 금
      sale('2026-11-06T15:00', '2026-11-06T16:30', 30000); // 금 15시(마감 뒤) — 금 출력 → 금
      sale('2026-11-04T10:00', '2026-11-06T16:00', 17000); // 수 주문 · 늦게 금 출력 → 금
      sale('2026-11-07T10:00', '2026-11-09T16:00', 11000); // 토 → (토·일 쉼) 토
      sale('2026-11-08T13:00', '2026-11-09T16:00', 12000); // 일 13시 → 일
      sale('2026-11-08T15:00', '2026-11-09T16:00', 13000); // 일 15시(마감 뒤) → 월
      sale('2026-11-09T09:00', '2026-11-09T16:00', 14000); // 월
      sale('2026-11-09T16:00', '2026-11-10T15:50', 15000); // 월 16시 → 화 출력 → 화
      sale('2026-11-10T15:30', '2026-11-10T15:50', 16000); // 화 15시 30분(마감 뒤) — 화 출력 → 화
      S.ordersLoaded = true; S._allLoaded = true; S.ver = (S.ver || 0) + 1; S._sdm = null; S._rkM = null;
      const M = shipDayModel(); const P = rkPrintModel(M), O = rkOrdModel(M);
      o.p = Object.fromEntries([...P.days.values()].sort((a, b) => a.d.localeCompare(b.d)).map((y) => [y.d, y.amt]));
      o.o = Object.fromEntries([...O.days.values()].sort((a, b) => a.d.localeCompare(b.d)).map((y) => [y.d, y.amt]));
      const R = rankModel(); o.base = R.base; o.rk = Object.fromEntries(R.L.map((x) => [x.d, x.amt]));
      o.sec = (() => { const h = shipDaySection(); const m = /data-sday="2026-11-10"[\s\S]*?sd-c-amt[^>]*><b>([^<]*)</.exec(h); return m ? m[1] : null; })();
      o.help = /그날 송장 출력 회차/.test(shipDaySection());
      o.noPast = typeof rkfxPastPerItems === 'undefined';
      localStorage.setItem('rn-rkfx-conf', JSON.stringify({ d: '2026-11-10', at: new Date().toISOString() })); S._rkM = null;
      o.conf = !!rkConfAt(); o.its = rkfxTodayItems('conf').map((x) => x.id);
    } catch (e) { o.err = String(e && e.stack || e).slice(0, 400); } return o; });
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    const want = { '2026-11-05': 10000, '2026-11-06': 67000, '2026-11-07': 11000, '2026-11-08': 12000, '2026-11-09': 27000, '2026-11-10': 31000 };
    ok(JSON.stringify(r.p) === JSON.stringify(want), '①②③ 일별 출고 매출 = 출력 회차(금 15시·화 15시 30분은 그날 · 토·일 쉼은 주문 시각으로 나눔 · 늦게 보낸 수 주문은 금): ' + JSON.stringify(r.p));
    ok(r.o && r.o['2026-11-07'] === 30000 + 11000 && r.o['2026-11-11'] === 16000, '④ ⚙ 일별 주문 매출(시계 셈)은 예전 그대로 — 금 15시는 토 · 화 15시 30분은 수: ' + JSON.stringify(r.o));
    const sum = (m) => Object.values(m || {}).reduce((a, b) => a + b, 0); ok(sum(r.p) === sum(r.o) && sum(r.p) === 158000, '④ 두 셈 합계 같음(158,000원): ' + sum(r.p) + ' / ' + sum(r.o));
    ok(r.base === 'ship' && r.rk['2026-11-10'] === 31000 && r.rk['2026-11-06'] === 67000, '④ 순위의 그날 금액 = 표의 그날 줄(화 31,000 · 금 67,000): ' + JSON.stringify(r.rk));
    ok(/31,000/.test(r.sec || ''), '④ 출고별 매출 표 11/10 줄 매출 칸 31,000원: ' + r.sec);
    ok(r.help, '④ 표 안내 글 = 그날 송장 출력 회차');
    ok(r.noPast && r.conf && !r.its.some((x) => /^(week|month|year):/.test(x)), '⑤ 화요일 확정 뒤 카드에 지난 주 카드가 따라 뜨지 않음: ' + JSON.stringify(r.its)); ran++;
  });
  ok(ran === 1, `시험 칸이 끝까지 돎(${ran}/1)`);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(0);
})();
