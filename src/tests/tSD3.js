// tSD3 — 정범님 11/05 밤 출고별 매출 표·축하 여러 장 (휴대폰 사진 근거)
//  ① '더 보기 · 100일 더' 뒤 위아래로 밀어도 머리(머리 띠·칸 이름)가 흔들리지 않음 · 다시 그리기·주소창(resize) 뒤에도 표 안 스크롤 자리 그대로 · 옆으로 끝까지 밀림
//  ② 칸을 끌어 옮기면 그 칸 값 폭에 맞게(자리 기준 규칙·휴대폰 칸 최소 폭이 자리에 남지 않음)
//  ③ 축하·응원 여러 장 — 출고일 기준은 일요일·달 마지막 날(일)에 출고 줄이 없어 주간·월간 카드가 안 붙던 것 → 그 기간 마지막 매출 날 줄에 하루+주+달(+해) · 🔁×N · 다시 보기 여러 장
//  ④ 금액 누름 = 그날 모두 재생('🔁 다시 보기 — 지난 기록') · 날짜·줄 다른 곳 = 그날 출고 화면 · 🔁 단추 그대로
//  ⑤ 순위 셈 — 출고일 기준과 일별 주문 매출 기준의 합계가 같음(줄 셈 같음 · 날 나누기만 다름) · 순위의 그날 금액·건수 = 표의 그날 줄
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSD3.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
/* 오늘(2026-11-05 목) 앞 340일 — 평일만 출고(주말 출고 없음 · 일요일·토요일 달 마지막 날에 줄 없음) */
const prep = async (p) => p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const td = dstr(new Date()); const bk = (n) => rkBack(td, n); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-rkfx-day', 'rn-rkfx-pl', 'rn-rkfx-conf', 'rn-sd-cols'].forEach((x) => { try { localStorage.removeItem(x); } catch (e) {} });
  localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S._sdColMg = 1; S._rkfxMg = 1; S.app = { ...(S.app || {}) }; delete S.app.rankFx; delete S.app.sdCols; window.rkfxHeadSoon = () => {};
  S._sdL = true; S.orders = new Map(); let k = 0; const sale = (od, sd, price, qty) => { k++; const id = 'aladin_Q' + k; S.orders.set(id, { id, orderNo: 'Q' + k, kind: 'sale', platform: 'aladin', orderedAt: od, shippedAt: sd, buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: qty || 1, lineStatus: 'normal' }] }); };
  for (let i = 1; i <= 800; i++) { const d = bk(i); const wd = new Date(d + 'T12:00:00Z').getUTCDay(); if (wd === 0 || wd === 6) continue; sale(d + 'T10:20', d + 'T16:00', 20000 + ((i * 7919) % 37) * 1000, 1 + (i % 3)); if (i % 4 === 0) sale(rkBack(d, 1) + 'T15:30', d + 'T16:10', 12000 + (i % 9) * 1000, 1); if (wd === 1 && i % 3 === 0) sale(rkBack(d, 2) + 'T10:00', d + 'T16:20', 15000, 1); /* 토요일 주문 → 월요일 출고(일별 주문 매출은 토요일 날) */ }
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S._shipRowsC = null;
  S.ordersLoaded = true; S._allLoaded = true; S.shipDayN = 20; S._sdFit = null; S._sdScr = null; S.ver = (S.ver || 0) + 1; S._sdm = null;
  loadShipDays(); for (let i = 0; i < 20 && !S.shpDaysV; i++) await W(100);
  window.__shown = () => { const L = []; const P = S._rkfxP; const st = S._rkfx; const one = (it) => it && L.push({ occ: it.occ, kind: it.kind, per: it.per || rkfxPerOf(it), d: it.I && (it.I.key || it.I.d) }); if (P) { one(P.cur); P.q.forEach(one); P.dock.forEach((d) => one(d.it)); } else if (st && st.item) one(st.item); else if (st && st.el) L.push({ occ: st.el.dataset.occ || '', kind: st.el.dataset.kind, per: 'day' }); return L; };
  window.__close = () => { try { rkfxPClose(); } catch (e) {} try { rankFxClose(1); } catch (e) {} };
  S.sec.o_shipday = true; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(600); window.__close(); return td; });
(async () => {
  // ━━ A. 휴대폰 390 — ① 흔들림 · ② 칸 폭
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-05T16:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await prep(p);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try {
      const tw = () => document.getElementById('sd_tw'); const thTop = () => Math.round(document.querySelector('#sd_tbl th').getBoundingClientRect().top - tw().getBoundingClientRect().top); const stkTop = () => Math.round(document.getElementById('sd_stk').getBoundingClientRect().top);
      o.rows0 = document.querySelectorAll('#sd_tbl tbody tr').length; document.querySelector('[data-shipday-more]').click(); await W(500);
      o.rows1 = document.querySelectorAll('#sd_tbl tbody tr').length; o.xs = tw().classList.contains('xs'); o.mh = tw().style.maxHeight;
      /* 표 칸을 화면 위쪽으로 · 칸 안에서 위아래로 밀며 머리 위치를 적음 — 사이사이 실시간 다시 그리기·주소창 resize */
      tw().scrollIntoView({ block: 'start' }); await W(900); const s0 = stkTop(); /* 머리 칸 접힘(미끄러짐 0.26초)이 끝난 뒤 */ const L = []; const lost = [];
      for (let i = 1; i <= 12; i++) { const want = i * 180; tw().scrollTop = want; await W(60); const got = tw().scrollTop; if (i % 3 === 0) { renderMainNow(); await W(120); } if (i % 4 === 0) { window.dispatchEvent(new Event('resize')); await W(250); } L.push({ st: tw().scrollTop, th: thTop(), stk: stkTop() }); if (Math.abs(tw().scrollTop - got) > 2) lost.push([got, tw().scrollTop]); }
      o.L = L; o.lost = lost; o.s0 = s0; o.mh2 = tw().style.maxHeight;
      /* 옆으로 끝까지 — 다시 그리기 뒤에도 그대로 */ const mx = tw().scrollWidth - tw().clientWidth; tw().scrollLeft = mx; await W(80); renderMainNow(); await W(200); o.side = { mx, sl: tw().scrollLeft, xs: tw().classList.contains('xs') };
      o.trans = getComputedStyle(document.getElementById('sd_stk')).transitionProperty;
      /* ② 칸 폭 — 처음 자리 폭 → 주문(n) 칸을 맨 뒤로 옮김 → 그 칸 폭이 그대로(값 폭) · 그 자리에 온 권수 칸도 자기 폭 */
      const wid = () => Object.fromEntries([...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => [x.dataset.sdcol, Math.round(x.getBoundingClientRect().width)]));
      const pos = () => [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol);
      o.w0 = wid(); o.p0 = pos(); sdColSave(['d', 'src', 'cut', 'q', 'amt', 'rk', 'sh', 'cash', 'out', 'n']); renderMainNow(); await W(300); o.w1 = wid(); o.p1 = pos();
      sdColSave(['amt', 'd', 'n', 'src']); renderMainNow(); await W(300); o.w2 = wid(); o.p2 = pos();
      /* 숫자 칸 td 오른쪽 맞춤이 자리와 상관없음(2번째 자리 규칙이 남지 않음) */ o.al = [...document.querySelectorAll('#sd_tbl tbody tr:first-child td')].slice(0, 3).map((x) => getComputedStyle(x).textAlign + ':' + x.className);
      sdColSave(null); renderMainNow(); await W(200);
      return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } });
    console.log('  휴대폰:', JSON.stringify(r).slice(0, 2400));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.rows0 === 20 && r.rows1 > 100 && r.xs && /px$/.test(r.mh), `더 보기 뒤에도 표 칸 안에서 밀기(xs) 그대로 · 줄 ${r.rows0} → ${r.rows1}: ` + r.mh);
    ok(r.L.every((x) => Math.abs(x.th) <= 1) && r.L.every((x) => x.stk === r.s0) && r.L[r.L.length - 1].st > 1500, '휴대폰 390: 100일 더 본 뒤 위아래로 밀어도 칸 이름 줄(표 칸 맨 위)·머리 띠 자리 그대로: ' + JSON.stringify(r.L.map((x) => [x.st, x.th, x.stk])));
    ok(!r.lost.length && r.mh2 === r.mh, '다시 그리기·주소창 resize 뒤에도 표 안 스크롤 자리·높이 그대로(예전엔 0으로 돌아가 머리가 순간이동): ' + JSON.stringify([r.lost, r.mh, r.mh2]));
    ok(r.side.mx > 200 && r.side.sl >= r.side.mx - 1 && r.side.xs, '옆으로 끝까지 밀림 · 다시 그린 뒤에도 그 자리: ' + JSON.stringify(r.side));
    ok(/top/.test(r.trans), '머리 칸 접힘·펴짐 때 머리 띠는 미끄러짐(순간이동 아님): ' + r.trans);
    const w0 = r.w0, w1 = r.w1, w2 = r.w2;
    ok(w0.n < 60 && w0.q < 60 && Math.abs(w1.n - w0.n) <= 2 && Math.abs(w1.q - w0.q) <= 2 && r.p1[r.p1.length - 1] === 'n' && Math.abs(w2.n - w0.n) <= 2 && Math.abs(w2.amt - w0.amt) <= 2 && Math.abs(w2.d - w0.d) <= 2, '칸을 옮겨도 그 칸 값 폭 그대로(주문·권수 좁은 칸 · 자리에 남는 폭 없음): ' + JSON.stringify({ w0, w1, w2 }));
    ok(r.al.every((x) => /sd-c-(amt|n)/.test(x) ? /^right/.test(x) : true) && r.al.some((x) => /sd-c-n/.test(x)), '숫자 칸은 어느 자리에 와도 오른쪽 맞춤: ' + JSON.stringify(r.al)); ran++;
  }, { vp: { width: 390, height: 800 }, touch: true });
  // ━━ B. PC — ③ 여러 장 · ④ 금액 누름 · ⑤ 순위 셈
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-05T16:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await prep(p);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = window.__shown, close = window.__close; try {
      S.shipDayN = 700; renderMainNow(); await W(500); const R = rankModel(); o.base = R.base;
      /* 일요일이면서 달 마지막 날(2026-05-31) → 그 주·그 달 마지막 매출 날 = 5/29(금) · 12/31(수) → 하루+달+해 · 평범한 금요일 → 하루+주 · 평일 → 하루 */
      const per = (d) => rkfxReplayItems(d).map((x) => x.per + (RKX[x.kind] ? ':' + x.kind : '')).join();
      o.c = { m531: per('2026-05-29'), y1231: per('2025-12-31'), fri: per('2026-10-23'), wed: per('2026-10-28'), sun: R.by.has('2026-05-31'), today: rkfxPerItems(R.td, true).map((x) => x.per).join() };
      const ic = (d) => { const b = document.querySelector(`#sd_tbl [data-sdfx="${d}"]`); return b ? { p: [...b.querySelectorAll('[data-sdfxp]')].map((x) => x.dataset.sdfxp).join(), n: +((b.querySelector('[data-sdfxn]') || {}).dataset || {}).sdfxn || 1 } : null; };
      o.ic = { m531: ic('2026-05-29'), y1231: ic('2025-12-31'), fri: ic('2026-10-23'), wed: ic('2026-10-28') };
      /* 여러 장이 붙은 날이 표에 여럿 */ o.multi = [...document.querySelectorAll('#sd_tbl [data-sdfxn]')].length;
      /* ④ 금액 누름 → 그날 모두 재생 */ const amt = (d) => document.querySelector(`#sd_tbl tr[data-sday="${d}"] td[data-sdamt]`);
      close(); const a = amt('2026-05-29'); o.amtHas = !!a; a.click(); await W(500); o.amtShown = sh().map((x) => x.per); o.amtDet = !!(S.detail && S.detail.sdv); await W(400); const el = document.getElementById('rkfx'); o.amtTxt = el ? el.innerText.replace(/\s+/g, ' ').slice(0, 200) : (document.querySelector('.rkfx-row') || {}).innerText || ''; o.replayTag = !!document.querySelector('.rkfx-row, #rkfx') && /다시 보기/.test(document.body.innerText); close(); await W(300);
      /* 날짜 칸 누름 → 그날 출고 화면(카드 안 뜸) */ document.querySelector('#sd_tbl tr[data-sday="2026-05-29"] td.sd-c-d').click(); await W(700); o.dayClick = { sdv: S.detail && S.detail.sdv, fx: sh().length }; for (let i = 0; i < 4 && S.detail; i++) { history.back(); await W(400); } close();
      /* 🔁 단추 그대로 */ { const b = document.querySelector('#sd_tbl [data-sdfx="2025-12-31"]'); o.rpBtn = !!b; if (b) { b.click(); await W(500); o.rpShown = sh().map((x) => x.per); close(); await W(200); } }
      /* ⑤ 순위 셈 — 두 기준 합계 같음 · 순위 그날 = 표 그날 */ { const M = shipDayModel(); const td = R.td; const sum = (L) => L.reduce((a, x) => a + x.amt, 0); const S1 = rkRows(rkShipModel(M), td), S2 = rkRows(rkOrdModel(M), td); o.sum = { ship: sum(S1), order: sum(S2), nShip: S1.reduce((a, x) => a + x.n, 0), nOrder: S2.reduce((a, x) => a + x.n, 0), days: [S1.length, S2.length] };
        const top = [...S1].sort((a, b) => b.amt - a.amt)[0]; const row = M.days.get(top.d); o.top = { d: top.d, amt: top.amt, n: top.n, rowAmt: row.amt, rowN: row.n, rank: R.by.get(top.d).rank }; }
      return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } });
    console.log('  PC:', JSON.stringify(r).slice(0, 2400));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.base === 'ship' && !r.c.sun && /^day/.test(r.c.m531) && /week/.test(r.c.m531) && /month/.test(r.c.m531), '2026-05-31(일·달 마지막 날 · 출고 줄 없음) → 마지막 매출 날 5/29(금) 줄에 하루+주+달 카드: ' + r.c.m531);
    ok(/^day/.test(r.c.y1231) && /month/.test(r.c.y1231) && /year/.test(r.c.y1231), '12/31(수) 줄에 하루+달+해 카드: ' + r.c.y1231);
    ok(/^day/.test(r.c.fri) && /week/.test(r.c.fri) && !/month/.test(r.c.fri) && !/week|month|year/.test(r.c.wed) && r.c.today === '', '평범한 금요일 = 하루+주 · 수요일 = 하루만 · 오늘(목)은 기간 카드 없음: ' + JSON.stringify([r.c.fri, r.c.wed, r.c.today]));
    ok(r.ic.m531 && /week/.test(r.ic.m531.p) && /month/.test(r.ic.m531.p) && r.ic.m531.n >= 3 && r.ic.y1231.n >= 3 && /year/.test(r.ic.y1231.p) && r.ic.fri.n >= 2 && r.ic.wed.n === 1 && r.multi >= 10, '표 🏆 칸 🔁에 기간 아이콘·장 수(×N) — 여러 장인 날이 표에 여럿(' + r.multi + '): ' + JSON.stringify(r.ic));
    ok(r.amtHas && r.amtShown.length >= 3 && r.amtShown[0] === 'day' && r.amtShown.includes('week') && r.amtShown.includes('month') && !r.amtDet && r.replayTag, '금액 누름 = 그날 모두 재생(하루·주·달 여러 장 · 🔁 다시 보기 표시 · 출고 화면 안 열림): ' + JSON.stringify([r.amtShown, r.amtDet, r.amtTxt]));
    ok(r.dayClick.sdv === '2026-05-29' && r.dayClick.fx === 0, '날짜 칸 누름 = 그날 출고 화면(카드 안 뜸): ' + JSON.stringify(r.dayClick));
    ok(r.rpBtn && r.rpShown.length >= 3 && r.rpShown.includes('year'), '🏆 칸 🔁 단추도 그대로(12/31 하루·달·해): ' + JSON.stringify(r.rpShown));
    ok(r.sum.ship === r.sum.order && r.sum.nShip === r.sum.nOrder && r.sum.days[1] > r.sum.days[0], '순위 셈 — 출고일 기준 합계 = 일별 주문 매출 합계(같은 줄 셈 · 날 나누기만 다름 · 주문 날 수가 더 많음): ' + JSON.stringify(r.sum));
    ok(r.top.amt === r.top.rowAmt && r.top.n === r.top.rowN && r.top.rank === 1, '순위 1위 금액·건수 = 출고별 매출 표 그날 줄: ' + JSON.stringify(r.top)); ran++;
  });
  ok(ran === 2, `시험 칸 둘이 끝까지 돎(${ran}/2)`);
  console.log(bad ? `❌ tSD3 실패 ${bad}` : '✓ tSD3 모두 통과'); process.exit(bad ? 1 : 0);
})();
