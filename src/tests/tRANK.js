// tRANK — 정범님 11/04 '최고 매출 날짜별 순위 · 오늘 출고 확정되면 전체 중 몇 위 · 1위 갱신 축하 · 꼴찌 갱신 응원 · 어제보다 잘하면 응원 · 못하면 위로 · 설정에서 여러 그림 고르기·샘플'
//  ① 순위 계산(출고별 매출과 같은 값 · 현금 포함 · 같은 매출은 같은 순위) ② 오늘 출고 화면 '전체 N일 중 k위'(확정됐을 때만)
//  ③ 1위·꼴찌·지난 출고일보다 많음·적음 — 그 화면이 뜨고 하루 한 번만 ④ 샘플 보기(경우마다 4가지) ⑤ 끄기 ⑥ 순위 화면(상위·하위·기간·날짜 누르기) ⑦ 360px 넘침 없음 · 움직임 줄이기
//  (정범님 11/04 두 번째) ⑧ 견줄 날 셋(달력의 어제·지난주 같은 요일·작년 같은 날 · 출고 없는 날은 건너뜀) ⑨ 더 높은 등급이 되면 한 번 더(꼴찌는 따로)
//  ⑩ 설정은 공용 app_settings/main.rankFx(관리자 기기 · 예전 기기 값 처음 한 번 옮김 · 관리자 아닌 기기는 못 바꿈) ⑪ 출고별 매출 표 🏆 아이콘 → 그 경우 그림(날짜 누르기와 안 겹침) ⑫ 같은 경우 안에서만 무작위
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tRANK.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; /* ran = 끝까지 돈 칸 수(브라우저 안에서 멈추면 harness가 삼키므로 따로 셈) */ const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
const seedRank = () => { const td = dstr(new Date()); const bk = (n) => dstr(new Date(Date.now() - n * 864e5)); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  S._sdL = true; S.shpDays = new Map(); S.orders = new Map(); let k = 0;
  const sale = (d, price, cash) => { k++; const id = (cash ? 'cash_' : 'aladin_') + 'R' + k; S.orders.set(id, { id, orderNo: 'R' + k, kind: 'sale', platform: cash ? 'cash' : 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
  sale(bk(5), 30000); sale(bk(4), 50000); sale(bk(4), 10000, true); /* 현금 1만 원 → 그날 6만 원 */ sale(bk(3), 45000); sale(bk(2), 20000); sale(bk(2), 25000); /* 4.5만 원 같음 */ sale(bk(1), 40000);
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false;
  window.__today = (amt) => { S.shpDays.set(td, { day: td, source: 'tab', readAt: new Date().toISOString(), entries: [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 시험 책', price: amt, qty: 1 }] }] }); S.shpDaysV++; S._sdm = null; S.ver = (S.ver || 0) + 1; };
  return { td, bk1: bk(1), bk2: bk(2), bk3: bk(3), bk4: bk(4) }; };
(async () => {
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + seedSrc + ')')(); o.D = D; try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true; S._rkfxMg = 1; /* 이 칸은 예전 기기 값 옮기기를 시험하지 않음(⑩에서) */
      const close = () => { if (document.getElementById('sheet').classList.contains('on')) history.back(); };
      const fx = () => { const e = document.getElementById('rkfx'); return e ? { kind: e.dataset.kind, v: e.dataset.v, txt: e.innerText.replace(/\s+/g, ' ').slice(0, 160), cv: !!e.querySelector('canvas') } : null; };
      // ① 순위 계산
      __today(70000); const R = rankModel(); o.L = R.L.map((x) => [x.d, x.amt, x.rank]); const t = rankToday(); o.t = { amt: t.amt, rank: t.rank, N: t.N, done: t.done, kind: t.kind, conf: t.conf, left: t.left };
      o.same = shipDayModel().days.get(D.bk4).amt; o.cashDay = (R.by.get(D.bk4) || {}).cash;
      // ② + ③ 1위 갱신 — 오늘 출고 화면 열면 한 줄 + 축하 화면
      S.shipTab = 'confirm'; openShip(); await Wt(900); o.line = ((document.getElementById('rk_today') || {}).innerText || '').replace(/\s+/g, ' '); o.lineIn = !!document.querySelector('#shp_one #rk_today'); o.top = fx(); o.topParts = S._rkfx && S._rkfx.parts ? 1 : 0;
      document.getElementById('rkfx') && document.getElementById('rkfx').click(); await Wt(100); o.closed = !document.getElementById('rkfx') && !S._rkfx;
      close(); await Wt(300); openShip(); await Wt(900); o.again = fx(); close(); await Wt(300);
      // 꼴찌 갱신 · 많음 · 적음 — 날마다 한 번이므로 '오늘 봄'을 지우고 금액을 바꿔 봄
      const run = async (amt) => { try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} __today(amt); openShip(); await Wt(900); const f = fx(); const tt = rankToday(); if (document.getElementById('rkfx')) document.getElementById('rkfx').click(); await Wt(80); close(); await Wt(300); return { f, kind: tt.kind, rank: tt.rank }; };
      o.low = await run(20000); o.up = await run(42000); o.down = await run(35000);
      // 확정 전(오늘 할 일 남음) — 한 줄·화면 없음 (출고 화면은 열 때 목록을 새로 받으므로 함수로 직접)
      try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} __today(70000); const ship0 = S.ship; S.ship = { orders: [{ orderNo: 'D-9', buyer: '손님A', orderedAt: D.td + ' 10:00', recipient: { name: '손님A' }, items: [{ listingId: '404935009', title: '아직 보낼 책', price: 7000, qty: 1, sku: 'PNK_ms', grade: '상' }] }], tabCounts: {}, at: new Date().toISOString() }; S._shipRowsC = null;
      const t2 = rankToday(); o.pend = { done: t2.done, left: t2.left }; o.pendLine = !!rankTodayHtml(); rankFxCheck(); await Wt(600); o.pendFx = fx(); o.pendSeen = localStorage.getItem('rn-rkfx-seen');
      S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S._shipRowsC = null;
      // ⑤ 끄기 — 1위만 끔
      S.app.rankFx = { k: { top: { off: true } } }; try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} __today(70000); openShip(); await Wt(900); o.offTop = fx(); o.offDbg = JSON.stringify([rkfxPrefs(), rankToday() && rankToday().kind, localStorage.getItem('rn-rkfx-seen')]); o.offLine = !!document.getElementById('rk_today'); close(); await Wt(300);
      S.app.rankFx = { off: true }; openShip(); await Wt(900); o.offAll = fx(); close(); await Wt(300); S.app.rankFx = { k: {} };
      // ④ 설정 — 샘플 보기 (경우마다 4가지 · 고르기 · 무작위)
      S.sec.set_rankfx = true; S.tab = 'settings'; renderTabs(); renderMain(); await Wt(400); const box = document.getElementById('rkfx_box'); o.setBox = !!box; o.chips = {}; o.samples = {};
      for (const k of ['top', 'low', 'up', 'down']) { const cs = [...document.querySelectorAll(`[data-rkfxs="${k}"][data-i]`)]; o.chips[k] = cs.length; const seen = new Set(); for (const c of cs) { c.click(); await Wt(120); const f = fx(); if (f && f.kind === k) seen.add(f.v + '|' + f.cv); rankFxClose(); } o.samples[k] = seen.size; }
      { const sel = document.querySelector('select[data-rkfx="v"][data-k="down"]'); sel.value = '2'; sel.dispatchEvent(new Event('change', { bubbles: true })); await Wt(50); document.querySelector('[data-rkfxs="down"]:not([data-i])').click(); await Wt(120); o.pickV = (fx() || {}).v; o.sampleTxt = (fx() || {}).txt; rankFxClose(); await Wt(100); o.saved = ((window.__FS.app_settings || {}).main || {}).rankFx || {}; o.savedLocal = localStorage.getItem('rn-rkfx'); }
      { const cb = document.querySelector('input[data-rkfx="on"][data-k="low"]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await Wt(100); o.lowOff = ((((window.__FS.app_settings || {}).main || {}).rankFx || {}).k || {}).low; }
      o.memGone = !document.getElementById('rkfx') && !S._rkfx && !document.querySelector('canvas.rkfx-cv');
      // ⑥ 순위 화면 — 주문·매출 탭 띠 → 화면 · 상위/하위 · 기간 · 날짜 누르기
      if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('rkbar'); i++) await Wt(150); await Wt(300); const bar = document.getElementById('rkbar'); o.barDbg = [!!bar, (document.getElementById('main') || {}).innerText ? document.getElementById('main').innerText.slice(0, 200) : '']; o.bar = bar ? bar.innerText.replace(/\s+/g, ' ') : ''; bar && bar.click(); for (let i = 0; i < 30 && !document.querySelector('[data-rkord="low"]'); i++) await Wt(100);
      o.scr = pgdCur(); const rows = () => [...document.querySelectorAll('#sheet [data-rkday]')].map((x) => x.innerText.replace(/\s+/g, ' ').slice(0, 40)); o.rowsTop = rows();
      document.querySelector('[data-rkord="low"]').click(); await Wt(200); o.rowsLow = rows();
      const per = document.getElementById('rk_per'); per.value = 'cus'; per.dispatchEvent(new Event('change', { bubbles: true })); await Wt(200); const f1 = document.getElementById('rk_from'); f1.value = D.bk3; f1.dispatchEvent(new Event('change', { bubbles: true })); await Wt(200); o.rowsCus = rows(); o.cusAllCol = /전체 순위/.test(document.querySelector('#sheet .rk-tbl').innerText);
      document.querySelector(`#sheet [data-rkday="${D.bk2}"]`).click(); await Wt(400); o.dayOpen = S.detail && S.detail.sday; history.back(); await Wt(400); o.backRank = !!(S.detail && S.detail.srank) && !!document.getElementById('rk_per');
      pgdOpen(); await Wt(150); o.guide = PGD.id + '|' + (PGD.el && PGD.el.querySelector('.rgen-ttl').textContent); pgdClose(); close(); await Wt(300); S._rkSt = null;
      o.feat = featFind('매출 순위').some((f) => /매출 순위/.test(f.t)) && featFind('축하').some((f) => /축하/.test(f.t));
      return o; }, seedRank.toString());
    console.log('  순위:', JSON.stringify(r.L));
    const L = r.L; const by = Object.fromEntries(L.map(([d, a, k]) => [d, [a, k]]));
    ok(L.length === 6 && L[0][1] === 70000 && L[0][2] === 1, '순위 1위 = 오늘 7만 원 · 전체 6일');
    ok(by[r.D.bk4][0] === 60000 && r.cashDay === 10000 && r.same === 60000, `현금 판매 포함 — 그날 6만 원(현금 ${r.cashDay}) = 출고별 매출과 같은 값(${r.same})`);
    ok(by[r.D.bk3][1] === 3 && by[r.D.bk2][1] === 3 && by[r.D.bk1][1] === 5, '같은 매출(4.5만 원 두 날)은 같은 3위 · 다음은 5위로 건너뜀');
    ok(r.t.done && r.t.conf && r.t.left === 0 && r.t.kind === 'top', '오늘 확정(근거 배송&구매확정전 · 할 일 0건) · 1위 갱신으로 봄 ' + JSON.stringify(r.t));
    ok(r.lineIn && /오늘 매출 70,000원/.test(r.line) && /전체 6일 중 1위/.test(r.line), '오늘 출고 위 카드 안에 「오늘 매출 70,000원 · 전체 6일 중 1위」: ' + r.line);
    ok(r.top && r.top.kind === 'top' && r.top.cv && /1위/.test(r.top.txt) && r.topParts, '1위 갱신 → 축하 화면(캔버스 그림): ' + (r.top && r.top.txt));
    ok(r.closed, '누르면 닫히고 그림(캔버스·입자)을 모두 지움'); ok(!r.again, '같은 날 다시 열어도 다시 안 뜸(이 기기 하루 한 번)');
    ok(r.low.kind === 'low' && r.low.f && r.low.f.kind === 'low' && r.low.rank === 6, '꼴찌 갱신 → 응원 화면 (6위/6일)');
    ok(r.up.kind === 'up' && r.up.f && r.up.f.kind === 'up' && r.up.rank === 4, '어제(4만 원)보다 많음(4.2만 원) → 응원 화면 · 4위');
    ok(r.down.kind === 'down' && r.down.f && r.down.f.kind === 'down' && r.down.rank === 5, '어제보다 적음(3.5만 원) → 위로 화면 · 5위');
    ok(!r.pend.done && r.pend.left > 0 && !r.pendLine && !r.pendFx && !r.pendSeen, `오늘 할 일이 남으면(${r.pend.left}건) 한 줄·화면 없음 ` + JSON.stringify([r.pend, r.pendLine, r.pendFx, r.pendDbg]));
    ok(!r.offTop && r.offLine, '1위 화면만 끄면 안 뜸(한 줄은 그대로) ' + JSON.stringify([r.offTop, r.offLine, r.offDbg])); ok(!r.offAll, '모두 끄면 안 뜸');
    ok(r.setBox, '⚙ 설정 › 🏆 매출 축하·응원 칸'); for (const k of ['top', 'low', 'up', 'down']) ok(r.chips[k] >= 4 && r.samples[k] >= 4, `${k}: 그림 ${r.chips[k]}가지 · 샘플 보기로 ${r.samples[k]}가지 모두 뜸`);
    ok(r.pickV === '2' && /샘플/.test(r.sampleTxt || '') && r.saved.k && r.saved.k.down && r.saved.k.down.v === 2 && !r.savedLocal, '그림 고르기 저장(공용 app_settings/main.rankFx · 이 기기 rn-rkfx 아님) → 샘플 보기가 고른 그림으로: ' + (r.sampleTxt || ''));
    ok(r.lowOff && r.lowOff.off === true, '경우마다 끄기 저장'); ok(r.memGone, '닫은 뒤 겹침·캔버스 남지 않음');
    ok(/매출 순위/.test(r.bar) && /1위/.test(r.bar), '주문·매출 탭 🏆 매출 순위 띠: ' + r.bar);
    ok(r.scr === 'salesRank', '순위 화면을 설명서 화면 salesRank로 알아봄'); ok(r.rowsTop.length === 6 && /^🥇1위/.test(r.rowsTop[0]) && /70,000원/.test(r.rowsTop[0]), '상위부터: ' + r.rowsTop[0]);
    ok(/6위/.test(r.rowsLow[0]) && /30,000원/.test(r.rowsLow[0]), '하위부터: ' + r.rowsLow[0]);
    ok(r.rowsCus.length === 4 && r.cusAllCol, `기간(날짜 고르기 ${r.D.bk3}~) → ${r.rowsCus.length}일 · 그 안에서 다시 순위 + 전체 순위 칸`);
    ok(r.dayOpen === r.D.bk2 && r.backRank, '날짜 줄 누르면 그날 출고별 매출(하루 출고) · 뒤로 가면 순위 화면');
    ok(/^salesRank\|/.test(r.guide), '📖 화면 설명서: ' + r.guide); ok(r.feat, '🔍 기능 찾기에 매출 순위·축하'); ran++;
  });
  // ⑧~⑫ 견줄 날 셋 · 높은 등급 한 번 더 · 공용 설정 · 표 아이콘 · 같은 경우 안 무작위
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + seedSrc + ')')(); o.D = D;
      try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true; S._rkfxMg = 1;
      const fx = () => { const e = document.getElementById('rkfx'); return e ? { kind: e.dataset.kind, v: e.dataset.v, txt: e.innerText.replace(/\s+/g, ' ').slice(0, 260) } : null; };
      const close = () => { if (document.getElementById('sheet').classList.contains('on')) history.back(); };
      // 날 다시 깔기 — 어제 출고 없음 · 그제 8만(앞선 1위) · 사흘 전 2만(앞선 꼴찌) · 7일 전 3만 · 작년 오늘 5만
      const td = D.td; const bk = (n) => rkBack(td, n); const ya = rkYAgo(td); let k = 0; S.orders = new Map(); const sale = (d, price) => { k++; const id = 'aladin_Q' + k; S.orders.set(id, { id, orderNo: 'Q' + k, kind: 'sale', platform: 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
      sale(bk(2), 80000); sale(bk(3), 20000); sale(bk(7), 30000); sale(ya, 50000); o.dd = { b7: bk(7), ya };
      const run = async (amt, clr) => { if (clr) { try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} } __today(amt); rankFxClose(); rankFxCheck(); await Wt(150); const f = fx(); const t = rankToday(); rankFxClose(); return { f, kinds: t.kinds, kind: t.kind, cmps: t.cmps.map((c) => [c.k, c.none ? 'none' : c.pct]), seen: JSON.parse(localStorage.getItem('rn-rkfx-seen') || '{}') }; };
      // ⑧ 4만: 어제 없음(건너뜀 — 그제 8만과 견주지 않음) · 지난주 3만보다 많음 · 작년 5만보다 적음 → 응원(🚀) 하나 + 작은 줄
      o.a = await run(40000, 1);
      o.line = (rankTodayHtml() || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      // ⑨ 같은 등급(응원)으로 바뀜 → 안 뜸 · 9만(1위) → 한 번 더 · 다시 4.5만 → 안 뜸 · 1만(꼴찌) → 따로 한 번 · 또 1만 → 안 뜸
      o.b = await run(45000); o.c = await run(90000); o.d = await run(45000); o.e = await run(10000); o.f = await run(10000);
      // 위로에서 시작 → 응원이 되면 한 번 더
      o.g = await run(25000, 1); o.h = await run(42000);
      // ⑫ 같은 경우 안에서만 무작위 — 경우마다 30번
      o.rnd = {}; for (const kk of Object.keys(RKFX)) { const vs = new Set(); let bad = 0; for (let i = 0; i < 30; i++) { rankIcShow(td, kk); const f = fx(); if (!f || f.kind !== kk || !(+f.v >= 0 && +f.v < RKFX[kk].v.length)) bad++; else vs.add(f.v); rankFxClose(); } o.rnd[kk] = { n: RKFX[kk].v.length, seen: vs.size, bad }; }
      S.app.rankFx = { k: { wup: { v: 1 } } }; o.fix = []; for (let i = 0; i < 8; i++) { rankIcShow(td, 'wup'); o.fix.push((fx() || {}).v); rankFxClose(); } S.app.rankFx = { k: {} };
      // ⑪ 출고별 매출 표 🏆 칸 — 오늘(확정) 줄 아이콘 누르면 그 경우 그림 · 날짜 화면은 안 열림 · 줄 나머지 누르면 하루 출고 보기
      try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} __today(40000); localStorage.setItem('rn-rkfx-seen', JSON.stringify({ d: td, k: 'wup', g: 2 })); S.sec.o_shipday = true; if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.querySelector(`#main tr[data-sday="${td}"]`); i++) await Wt(150); await Wt(200); rankFxClose();
      const row = document.querySelector(`#main tr[data-sday="${td}"]`); o.rowIc = row ? [...row.querySelectorAll('[data-rkic]')].map((b) => (b.dataset.k || '-') + ':' + b.textContent.trim()) : null;
      const r7 = document.querySelector(`#main tr[data-sday="${bk(2)}"]`); o.row2 = r7 ? [...r7.querySelectorAll('[data-rkic]')].map((b) => (b.dataset.k || '-') + ':' + b.textContent.trim()) : null;
      const yb = row && row.querySelector('[data-rkic][data-k="ydown"]'); if (yb) { yb.click(); await Wt(150); } o.icFx = fx(); o.icNoDay = !(S.detail && S.detail.sdv) && !document.getElementById('sheet').classList.contains('on'); rankFxClose();
      const bg = row && row.querySelector('.rkic-c > [data-rkic]'); if (bg) { bg.click(); await Wt(150); } o.badgeFx = fx(); rankFxClose();
      if (row) { row.querySelector('td').click(); await Wt(500); } o.dayOpen = !!(S.detail && S.detail.sdv); close(); await Wt(300);
      // ⑩ 공용 설정 — 예전 기기 값 처음 한 번 옮김 · 관리자 아닌 기기는 못 바꿈
      delete (window.__FS.app_settings || {}).main; S.app.rankFx = undefined; localStorage.setItem('rn-rkfx', JSON.stringify({ k: { up: { v: 1 }, low: { off: true } } })); S._rkfxMg = 0; o.setV = S._setV; rankFxSetHtml(); await Wt(200);
      o.mig = ((window.__FS.app_settings || {}).main || {}).rankFx || null; o.migLocalKept = !!localStorage.getItem('rn-rkfx'); o.migPick = rkfxPick('up');
      localStorage.setItem('rn-device', 'ZZ-OTHER'); const box = document.createElement('div'); box.innerHTML = rankFxSetHtml(); o.otherDis = !!box.querySelector('select[data-rkfx="v"][disabled]') && !!box.querySelector('#rkfx_all[disabled]'); o.otherSave = await rkfxPrefsSet({ off: true, k: {} }); o.otherKept = !(((window.__FS.app_settings || {}).main || {}).rankFx || {}).off; localStorage.setItem('rn-device', 'JS-MAIN');
      o.otherSeen = (() => { localStorage.setItem('rn-rkfx-seen', JSON.stringify({ d: td, k: 'up' })); const x = rkfxSeen(); return [x.g, !!localStorage.getItem('rn-rkfx-seen')]; })();
      o.chipsNew = ['wup', 'wdown', 'yup', 'ydown'].map((kk) => RKFX[kk].v.length);
      o.leap = [rkYAgo('2028-02-29'), rkYAgo('2026-11-04'), rkBack('2026-03-01', 1), rkBack('2026-11-04', 7)];
      return o; }, seedRank.toString());
    console.log('  견줌:', JSON.stringify([r.a.kinds, r.a.cmps]));
    ok(r.a.kind === 'wup' && r.a.kinds.join() === 'wup,ydown' && r.a.cmps[0][1] === 'none' && r.a.cmps[1][1] === 33 && r.a.cmps[2][1] === -20, '어제 출고 없음 → 건너뜀(그제와 견주지 않음) · 지난주 같은 요일 +33% → 🚀 · 작년 오늘 −20% → 🕰 · 화면은 응원(🚀) 하나');
    ok(r.a.f && r.a.f.kind === 'wup' && /어제 견줄 날 없음/.test(r.a.f.txt) && /지난주 .요일보다 \+33%/.test(r.a.f.txt) && /작년 오늘보다 −20%/.test(r.a.f.txt), '화면 안 작은 줄에 나머지 견줌: ' + (r.a.f && r.a.f.txt));
    ok(/작년 오늘보다 −20%/.test(r.line), '오늘 출고 한 줄에도 견줌 작은 줄: ' + r.line);
    ok(r.a.seen.g === 2 && !r.b.f, '같은 등급(응원)이 다시 맞으면 안 뜸');
    ok(r.c.kind === 'top' && r.c.f && r.c.f.kind === 'top' && r.c.seen.g === 3, '더 높은 등급(1위)이 되면 한 번 더 ' + JSON.stringify(r.c.seen));
    ok(!r.d.f, '다시 낮아지면(응원) 안 뜸'); ok(r.e.kind === 'low' && r.e.f && r.e.f.kind === 'low' && r.e.seen.low === 1 && r.e.seen.g === 3, '꼴찌는 따로 한 번 ' + JSON.stringify(r.e.seen)); ok(!r.f.f, '꼴찌 두 번째는 안 뜸');
    ok(r.g.f && r.g.f.kind === 'wdown' && r.h.f && r.h.f.kind === 'wup', `위로(${r.g.kind})로 띄운 뒤 응원(${r.h.kind})이 되면 한 번 더`);
    for (const [kk, x] of Object.entries(r.rnd)) ok(!x.bad && x.n >= 3 && x.seen >= 2, `${kk}: 무작위는 그 경우 그림 ${x.n}가지 안에서만(30번 중 다른 경우·범위 밖 0 · ${x.seen}가지 나옴)`);
    ok(r.fix.every((v) => v === '1'), '그림 고정이면 늘 그 그림: ' + r.fix.join(''));
    ok(r.chipsNew.every((n) => n >= 3), '새 경우(지난주·작년 많음·적음) 그림 각각 3가지 이상: ' + r.chipsNew.join(','));
    ok(r.rowIc && r.rowIc.some((x) => /^wup:/.test(x)) && r.rowIc.some((x) => /^ydown:/.test(x)) && /^wup:/.test(r.rowIc[0]), '표 오늘 줄 🏆 칸 — 순위 배지 + 🚀·🕰: ' + JSON.stringify(r.rowIc));
    ok(r.row2 && r.row2[0] === 'top:👑' && r.row2.includes('top:🏆'), '그제 줄(8만 · 그때 1위 갱신 · 지금 전체 1위) — 👑 배지 + 🏆: ' + JSON.stringify(r.row2));
    ok(r.icFx && r.icFx.kind === 'ydown' && r.icNoDay, '아이콘 누르면 그 경우(🕰 작년보다 적음) 그림 · 날짜 화면은 안 열림 ' + JSON.stringify([r.icFx && r.icFx.kind, r.icNoDay]));
    ok(r.badgeFx && r.badgeFx.kind === 'wup', '순위 배지 누르면 그날 대표 경우 그림: ' + (r.badgeFx && r.badgeFx.kind)); ok(r.dayOpen, '줄의 날짜를 누르면 그대로 하루 출고 보기');
    ok(r.mig && r.mig.k && r.mig.k.up && r.mig.k.up.v === 1 && r.mig.k.low.off === true && r.mig.from === 'JS-MAIN' && r.migLocalKept && r.migPick === 1, '예전 기기 값(rn-rkfx)을 공용 app_settings/main.rankFx로 처음 한 번 옮김(기기 값은 지우지 않음) ' + JSON.stringify([r.setV, r.mig]));
    ok(r.otherDis && r.otherSave === false && r.otherKept, '관리자 아닌 기기: 설정 칸 잠김 · 저장 안 됨(공용 값 그대로)');
    ok(r.otherSeen[0] === 2 && r.otherSeen[1], "'오늘 띄움' 기록은 기기마다(rn-rkfx-seen) · 예전 꼴의 기록도 읽음");
    ok(r.leap[0] === null && r.leap[1] === '2025-11-04' && r.leap[2] === '2026-02-28' && r.leap[3] === '2026-10-28', '달력 계산: 2/29의 작년 없음 · 작년 같은 날 · 달력의 어제(달 넘김) · 7일 전 ' + JSON.stringify(r.leap)); ran++;
  });
  // ⑦ 휴대폰 360px — 순위 화면·오늘 출고·축하 화면 가로 넘침 없음 · 움직임 줄이기면 그림만
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400); await p.emulateMedia({ reducedMotion: 'reduce' });
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + seedSrc + ')')(); try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); } catch (e) {}
      const wide = () => { const sh = document.getElementById('sheet'); const vw = document.documentElement.clientWidth; let w = 0; (sh.classList.contains('on') ? sh : document.getElementById('main') || document.body).querySelectorAll('*').forEach((x) => { const b = x.getBoundingClientRect(); if (!b.width || b.right <= vw + 1) return; for (let y = x.parentElement; y; y = y.parentElement) { const ox = getComputedStyle(y).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return; } w++; (o.wl = o.wl || []).push(x.className || x.tagName); }); return { doc: document.documentElement.scrollWidth - vw, sh: sh.scrollWidth - sh.clientWidth, w }; };
      __today(70000); S.shipTab = 'confirm'; openShip(); for (let i = 0; i < 30 && !document.getElementById('rkfx'); i++) await Wt(150); o.ship = wide(); o.line = !!document.getElementById('rk_today'); const f = document.getElementById('rkfx'); o.fx = !!f; o.still = f && f.classList.contains('still'); o.noParts = S._rkfx && !S._rkfx.parts; if (f) { const c = f.querySelector('.rkfx-c').getBoundingClientRect(); o.card = [Math.round(c.left), Math.round(c.right), innerWidth]; f.click(); }
      await Wt(100); history.back(); await Wt(300); openSalesRank(); await Wt(300); o.rank = wide(); history.back(); await Wt(300);
      const box = document.createElement('div'); box.className = 'card'; box.innerHTML = rankFxSetHtml(); (document.getElementById('main') || document.body).appendChild(box); await Wt(100); let w = 0; box.querySelectorAll('*').forEach((x) => { if (x.getBoundingClientRect().right > document.documentElement.clientWidth + 1) w++; }); o.set = w; box.remove();
      if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('rkbar'); i++) await Wt(150); const bar = document.getElementById('rkbar'); o.barDbg = [!!bar, (document.getElementById('main') || {}).innerText ? document.getElementById('main').innerText.slice(0, 200) : '']; o.bar = bar ? Math.round(bar.getBoundingClientRect().right) - document.documentElement.clientWidth : 99; return o; }, seedRank.toString());
    ok(r.line && r.ship.doc <= 0 && r.ship.w === 0, '360px 오늘 출고: 한 줄 있고 가로 넘침 없음 ' + JSON.stringify(r.ship) + JSON.stringify((r.wl || []).slice(0, 8)));
    ok(r.fx && r.still && r.noParts, '움직임 줄이기 → 축하 화면은 그림만(움직임·입자 없음)'); ok(r.card && r.card[0] >= 0 && r.card[1] <= r.card[2], '360px 축하 카드가 화면 안 ' + JSON.stringify(r.card));
    ok(r.rank.doc <= 0 && r.rank.sh <= 0 && r.rank.w === 0, '360px 순위 화면 가로 넘침 없음(표는 칸 안에서만 밀림) ' + JSON.stringify(r.rank)); ok(r.set === 0, '360px 설정 칸 넘침 없음'); ok(r.bar <= 0, '360px 주문·매출 탭 순위 띠 넘침 없음 ' + JSON.stringify(r.barDbg)); ran++;
  }, { vp: { width: 360, height: 760 }, touch: true });
  ok(ran === 3, `시험 칸 셋이 끝까지 돎(${ran}/3)`); console.log(bad ? `❌ 실패 ${bad}` : '✓ tRANK 모두 통과'); process.exit(bad ? 1 : 0);
})();
