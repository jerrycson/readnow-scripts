// tMGMT1114 — (mgmt1 11/14 · 정범님 11/14 17:15 「같은 의미의 항목들인데도 서로 달라 · 한곳으로 모아 한눈에 · 대시보드·그래프」 · 헌장 제31조 돈의 말은 하나로)
//  ① 📊 한눈에가 경영 탭 맨 위 칸(bz_dash)으로 그려짐 · 휴대폰 섹션 고르기 목록에도 있음
//  ② 같은 뜻 같은 값: 이번 달 매출 = ② '이번 달 누적' = ③ '매출' = 🧭 전략 monthOp = 판매 실적(주문·매출 탭) 순매출
//  ③ 줄이 모두 취소된 판매 주문은 주문 수·택배비에서 빠짐(취소 권수는 셈) · 경영 ③과 🧭 전략의 수수료·택배 순지출이 같음
//  ④ 이번 달 예상 ≥ 이번 달 누적(🏷 알라딘 매입 매출이 있어도) · 예상 근거 화면의 '이번 달 예상' = 경영 탭 값
//  ⑤ 처분 매출이 알라딘 팔기를 두 번 세지 않음(이미 매출에 든 몫을 뺌)
//  ⑥ 🛒 판매처별 매출 '맞춰 보기' 줄 — 30일 매출 = 표 알라딘·현금 + 알라딘 매입 ✓
//  ⑦ 실적 달(20일~19일) 셈 · 출고별 매출 합
//  ⑧ 🔭 관찰 도구 안내에 분모·셈 시각 · 휴대폰 390px·PC 1400px에서 화면 밖으로 안 넘침
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const seedMoney = () => { const d = (n) => { const t = new Date(Date.now() - n * 864e5); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }; const td = d(0);
  const put = (id, v) => { try { putOrder(id, v); } catch (e) { v.id = id; S.orders.set(id, v); } };
  put('m_a1', { kind: 'sale', platform: 'aladin', orderNo: 'M-1', customerId: 'c1', orderedAt: td + 'T09:00', shippingFee: 0, items: [{ title: '책 하나', price: 12000, qty: 1, lineStatus: 'normal', fee: 1200 }, { title: '책 둘', price: 8000, qty: 2, lineStatus: 'normal', fee: 1600 }] });
  put('m_a2', { kind: 'sale', platform: 'aladin', orderNo: 'M-2', customerId: 'c2', orderedAt: td + 'T10:30', shippingFee: 2500, items: [{ title: '책 셋', price: 5000, qty: 1, lineStatus: 'normal', fee: 500 }] });
  put('m_cx', { kind: 'sale', platform: 'aladin', orderNo: 'M-3', customerId: 'c3', orderedAt: td + 'T11:00', shippingFee: 0, items: [{ title: '취소된 책', price: 9000, qty: 1, lineStatus: 'cancelled' }] });
  put('m_c1', { kind: 'sale', platform: 'cash', orderNo: 'C-1', customerId: 'c4', orderedAt: td + 'T12:00', noShip: true, items: [{ title: '현금 책', price: 7000, qty: 1, lineStatus: 'normal' }] });
  S.ordersLoaded = true; try { bump('o'); } catch (e) { S.ver++; } S._bizAt = 0;
  /* 🏷 알라딘 매입 — 매출에 6,000(책 줄) · 정산 10,000 → 매출에 안 든 몫 4,000 */
  S.bb = S.bb || {}; S.bb.loaded = true; S.bb.list = [{ id: 'bb1', orderNo: 'bb1', date: td, doneDate: td, paidAmount: 10000, items: [] }]; S.bb.v = (S.bb.v || 0) + 1;
  window.__bhOrig = window.__bhOrig || bhSaleRows; const rows = [{ d: td, amt: 6000, q: 1 }]; const byO = new Map([['bb1', 6000]]); bhSaleRows = () => ({ rows, byL: new Map(), byO, sum: 6000, n: 1, noAmt: 0, old: { n: 0, sum: 0, ord: 0 }, sig: 'test' });
  return td; };
require('./harness.js')(async (p) => {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const td = await p.evaluate(seedMoney);
  await p.evaluate(() => { S.sec.bz_dash = true; S.sec.bz_margin = true; S.sec.bz_pace = true; S.q = ''; S.tab = 'biz'; renderTabs(); renderMainNow(); afterRender(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { S._bizAt = 0; renderMainNow(); afterRender(); }); await p.waitForTimeout(500);
  // ①
  const r1 = await p.evaluate(() => { const d = document.querySelector('#main details[data-sec="bz_dash"]'); const secs = [...document.querySelectorAll('#main details[data-sec]')].map((x) => x.dataset.sec); return { has: !!d, open: !!(d && d.open), first: secs[0], groups: d ? d.querySelectorAll('.db-g').length : 0, bars: d ? d.querySelectorAll('svg.db-bars').length : 0, thin: THIN_SEC.biz.secs.some((s) => s[0] === 'bz_dash'), feat: FEAT.some((f) => f.go && f.go.sec === 'bz_dash') }; });
  ok(r1.has && r1.open && r1.first === 'bz_dash' && r1.groups >= 4 && r1.bars === 2 && r1.thin && r1.feat, '① 📊 한눈에 = 경영 탭 맨 위 칸 · 묶음 4개 이상 · 그래프 2개 · 휴대폰 고르기·기능 찾기에 있음', r1);
  // ②③④⑤
  const V = await p.evaluate(() => { const B = bizCalc(); const ym = B.td.slice(0, 7); const OP = monthOp(ym); const OF = opForecast(); const r = rangeOf('month', 0); const A = agg(r); const D = monDisp(ym); const txt = document.querySelector('#main details[data-sec="bz_dash"]').textContent;
    let fcTxt = ''; try { openForecast(); fcTxt = document.querySelector('#sheet').textContent; closeDetail(); } catch (e) { fcTxt = 'ERR ' + e.message; }
    return { M: B.M.amt, bb: B.M.bb, orders: B.M.orders, cx: B.M.cx, cq: B.M.cq, opAmt: OP.amt, perf: A.amt, fee: B.fee, opFee: OP.fee, ship: B.ship, opShip: OP.ship, pack: B.pack, opPack: OP.pack, fc: B.forecast, fcX: B.fcExtra, contrib: B.contrib, opV: OF.C.amt - OF.C.fee - OF.C.cogs - OF.C.ship, D, wonM: won(B.M.amt), wonFc: won(Math.round(B.forecast)), dashHasM: txt.includes(won(B.M.amt)), fcTxt: fcTxt.slice(0, 400) }; });
  ok(V.M === V.opAmt && V.M === V.perf && V.dashHasM, '② 이번 달 매출 = ③ 매출 = 🧭 전략 monthOp = 판매 실적 순매출 = 📊 한눈에', V);
  ok(V.M === 12000 + 16000 + 5000 + 7000 + 6000 && V.bb === 6000, '② 이번 달 매출 = 알라딘 33,000 + 현금 7,000 + 🏷 알라딘 매입 6,000', { M: V.M, bb: V.bb });
  ok(V.orders === 3 && V.cx === 1 && V.cq === 1, '③ 줄이 모두 취소된 판매 주문은 주문 수에서 빠짐(취소 권수 1은 셈)', { orders: V.orders, cx: V.cx, cq: V.cq });
  ok(Math.round(V.fee) === Math.round(V.opFee) && Math.round(V.ship) === Math.round(V.opShip) && Math.round(V.pack) === Math.round(V.opPack), '③ 경영 ③과 🧭 전략의 수수료·택배 순지출·포장재가 같은 함수(monCost)', V);
  ok(V.fc >= V.M && V.fcX === 6000 && V.fcTxt.includes(V.wonFc), '④ 이번 달 예상 ≥ 이번 달 누적 · 예상 근거 화면 값 = 경영 탭 값', { fc: V.fc, M: V.M, fcX: V.fcX, wonFc: V.wonFc, t: V.fcTxt });
  ok(V.D.extra === 4000 && V.D.inSales === 6000 && V.D.total === V.D.disp + 4000, '⑤ 처분 매출 = 폐기 + 알라딘 팔기 중 매출에 안 든 몫(10,000 − 6,000) — 두 번 셈 없음', V.D);
  // ⑥ 판매처별 매출 맞춰 보기
  const r6 = await p.evaluate(() => { S.sec.bz_chsales = true; renderMainNow(); afterRender(); const d = document.querySelector('#main details[data-sec="bz_chsales"]'); return d ? d.textContent : ''; });
  ok(/맞춰 보기/.test(r6) && /✓/.test(r6) && !/차이 /.test(r6), '⑥ 🛒 판매처별 매출 30일 = 경영 30일 매출 − 알라딘 매입 ✓', r6.slice(-300));
  // ⑦ 실적 달
  const r7 = await p.evaluate(() => [monPer('2026-11-14'), monPer('2026-11-20'), monPer('2026-01-05'), monPer('2026-12-25'), monPer('2026-11-14', 1)].map((x) => x.s + '~' + x.e + '|' + x.ym));
  ok(r7.join() === ['2026-10-20~2026-11-19|2026-11', '2026-11-20~2026-12-19|2026-12', '2025-12-20~2026-01-19|2026-01', '2026-12-20~2027-01-19|2027-01', '2026-09-20~2026-10-19|2026-10'].join(), '⑦ 실적 달 = 앞달 20일~그달 19일(정범님 11/07 기준)', r7);
  // ⑨ 웹앱 다른 곳의 '매출'도 같은 값 (매입처별 줄 · 홈 월별 매출 · 매출 추이 · 부가세 대조는 알라딘 주문만)
  const r9 = await p.evaluate(() => { const r = rangeOf('month', 0); const A = agg(r); const ym = r.start.slice(0, 7); const row = supSalesRow(r, A.amt); const ms = monthSales(ym).a; const tr = (() => { S.trend_t9 = 'month'; const h = trendSection('t9'); const m = h.match(/<b>[^<]*<\/b><b>([\d,]+)원/); return m ? +m[1].replace(/,/g, '') : null; })(); return { A: A.amt, warn: /합계 .*다름/.test(row), bbTag: /알라딘 매입/.test(row) || !A.bb, ms, tr }; });
  ok(!r9.warn && r9.bbTag && r9.ms === r9.A && (r9.tr == null || r9.tr === r9.A), '⑨ 매입처별 줄 합계 맞음(알라딘 매입 칸) · 홈 월별 매출 = 매출 추이 = 이번 달 매출', r9);
  // ⑧ 관찰 도구 안내 · 화면 넘침
  const r8 = await p.evaluate(() => { const O = obsCompute(); if (!O) return { skip: true }; return { stock: O.stock != null, at: !!O.at, txt: (obsHtml().match(/분모 = 시장 지표가 있는[^<]*/) || [''])[0] }; });
  ok(r8.skip || (r8.stock && r8.at && r8.txt), '⑧ 🔭 관찰 도구 안내에 분모·재고 화면 판매중·셈 시각', r8);
  const wide = (w) => p.evaluate(() => { const m = document.getElementById('main'); const d = m.querySelector('details[data-sec="bz_dash"]'); const over = [...d.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length; return { over, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  const pc = await wide(1400); ok(pc.over === 0 && pc.sw <= pc.iw + 1, '⑧ PC 1400px — 📊 한눈에가 화면 안', pc);
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { renderMainNow(); afterRender(); }); await p.waitForTimeout(600);
  const ph = await wide(390); ok(ph.over === 0 && ph.sw <= ph.iw + 1, '⑧ 휴대폰 390px — 📊 한눈에가 화면 밖으로 안 넘침', ph);
  if (process.env.MG_SHOT) { await p.screenshot({ path: process.env.MG_SHOT + '/phone.png', fullPage: false }); }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
});
