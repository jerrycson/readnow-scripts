// tRANK — 정범님 11/04 '최고 매출 날짜별 순위 · 오늘 출고 확정되면 전체 중 몇 위 · 1위 갱신 축하 · 꼴찌 갱신 응원 · 어제보다 잘하면 응원 · 못하면 위로 · 설정에서 여러 그림 고르기·샘플'
//  ① 순위 계산(출고별 매출과 같은 값 · 현금 포함 · 같은 매출은 같은 순위) ② 오늘 출고 화면 '전체 N일 중 k위'(확정됐을 때만)
//  ③ 1위·꼴찌·지난 출고일보다 많음·적음 — 그 화면이 뜨고 하루 한 번만 ④ 샘플 보기(경우마다 4가지) ⑤ 끄기 ⑥ 순위 화면(상위·하위·기간·날짜 누르기) ⑦ 360px 넘침 없음 · 움직임 줄이기
//  (정범님 11/04 두 번째) ⑧ 견줄 날 셋(달력의 어제·지난주 같은 요일·작년 같은 날 · 출고 없는 날은 건너뜀) ⑨ 더 높은 등급이 되면 한 번 더(꼴찌는 따로)
//  (정범님 11/05) ⑬ 일별 주문 매출(전날 14:01~그날 14:00 · 주말 묶음 나눔 · sales_daily 기록) ⑭ 그림 6가지씩 더함 · 1위 화려/꼴찌 초라 · 뜨는 경우·경우마다 끄기
//  (정범님 11/05 두 번째) ⑮ 하루 첫 열기·주간·월간·연간 그림 10가지씩 · 기간이 길수록 더 화려 · 연간 순위·연간 보기 · 문구 위트
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
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + seedSrc + ')')(); try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} window.__rkfxNoCap = 1;
      const wide = () => { const sh = document.getElementById('sheet'); const vw = document.documentElement.clientWidth; let w = 0; (sh.classList.contains('on') ? sh : document.getElementById('main') || document.body).querySelectorAll('*').forEach((x) => { const b = x.getBoundingClientRect(); if (!b.width || b.right <= vw + 1) return; for (let y = x.parentElement; y; y = y.parentElement) { const ox = getComputedStyle(y).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return; } w++; (o.wl = o.wl || []).push(x.className || x.tagName); }); return { doc: document.documentElement.scrollWidth - vw, sh: sh.scrollWidth - sh.clientWidth, w }; };
      __today(70000); S.shipTab = 'confirm'; openShip(); for (let i = 0; i < 30 && !document.getElementById('rkfx'); i++) await Wt(150); o.ship = wide(); o.line = !!document.getElementById('rk_today'); const f = document.getElementById('rkfx'); o.fx = !!f; o.still = f && f.classList.contains('still'); o.noParts = S._rkfx && !S._rkfx.parts; if (f) { const c = f.querySelector('.rkfx-c').getBoundingClientRect(); o.card = [Math.round(c.left), Math.round(c.right), innerWidth]; f.click(); }
      await Wt(100); history.back(); await Wt(300); openSalesRank(); await Wt(300); o.rank = wide(); history.back(); await Wt(300);
      const box = document.createElement('div'); box.className = 'card'; box.innerHTML = rankFxSetHtml(); (document.getElementById('main') || document.body).appendChild(box); await Wt(100); let w = 0; box.querySelectorAll('*').forEach((x) => { if (x.getBoundingClientRect().right > document.documentElement.clientWidth + 1) w++; }); o.set = w; box.remove();
      if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('rkbar'); i++) await Wt(150); const bar = document.getElementById('rkbar'); o.barDbg = [!!bar, (document.getElementById('main') || {}).innerText ? document.getElementById('main').innerText.slice(0, 200) : '']; o.bar = bar ? Math.round(bar.getBoundingClientRect().right) - document.documentElement.clientWidth : 99; return o; }, seedRank.toString());
    ok(r.line && r.ship.doc <= 0 && r.ship.w === 0, '360px 오늘 출고: 한 줄 있고 가로 넘침 없음 ' + JSON.stringify(r.ship) + JSON.stringify((r.wl || []).slice(0, 8)));
    ok(r.fx && r.still && r.noParts, '움직임 줄이기 → 축하 화면은 그림만(움직임·입자 없음)'); ok(r.card && r.card[0] >= 0 && r.card[1] <= r.card[2], '360px 축하 카드가 화면 안 ' + JSON.stringify(r.card));
    ok(r.rank.doc <= 0 && r.rank.sh <= 0 && r.rank.w === 0, '360px 순위 화면 가로 넘침 없음(표는 칸 안에서만 밀림) ' + JSON.stringify(r.rank)); ok(r.set === 0, '360px 설정 칸 넘침 없음'); ok(r.bar <= 0, '360px 주문·매출 탭 순위 띠 넘침 없음 ' + JSON.stringify(r.barDbg)); ran++;
  }, { vp: { width: 360, height: 760 }, touch: true });
  // (정범님 11/05) ⑬ 일별 주문 매출 — 주말 묶음이 날마다 나뉨 · 하루=하루인 날은 같음 · 14:00/14:01 경계 · 현금·취소 규칙 같음 · 기록 문서 split · 바뀐 날만 씀
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + seedSrc + ')')(); try { localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true;
      S.orders = new Map(); let k = 0; const put = (at, sh, items, cash) => { k++; const id = (cash ? 'cash_' : 'aladin_') + 'W' + k; S.orders.set(id, { id, orderNo: 'W' + k, kind: 'sale', platform: cash ? 'cash' : 'aladin', orderedAt: at, shippedAt: sh, buyer: { name: '손님A' }, items }); return id; };
      const it = (price, st) => [{ title: '시험 책 ' + (k + 1), price, qty: 1, lineStatus: st || 'normal' }]; const MON = '2026-10-19T15:00:00';
      put('2026-10-16T15:00:00', MON, it(11000)); put('2026-10-17T10:00:00', MON, it(12000)); /* 금 15:00 → 토 · 토 */
      put('2026-10-18T13:00:00', MON, it(13000)); put('2026-10-18T14:00:00', MON, it(14000)); /* 일 13:00 · 일 14:00 → 일 */
      put('2026-10-18T14:01:00', MON, it(15000)); put('2026-10-19T09:00:00', MON, it(16000)); /* 일 14:01 → 월 · 월 */
      put('2026-10-14T09:00:00', '2026-10-14T15:00:00', [{ title: '수 책', price: 10000, qty: 1, lineStatus: 'normal' }, { title: '취소 책', price: 5000, qty: 1, lineStatus: 'cancelled' }]); put('2026-10-14T11:00:00', '2026-10-14T11:00:00', it(3000), true); /* 하루=하루 · 취소 줄 · 현금 */
      S.shpDays = new Map(); S.shpDaysV = 1; S.ver = (S.ver || 0) + 1; S._sdm = null;
      const M = shipDayModel(); o.bundle = M.days.get('2026-10-19') && M.days.get('2026-10-19').amt; o.wedShip = M.days.get('2026-10-14') && [M.days.get('2026-10-14').amt, M.days.get('2026-10-14').cash];
      const R = rankModel(); const g = (d) => { const x = R.by.get(d); return x ? { amt: x.amt, n: x.n, cash: x.cash, split: x.split, sf: x.splitFrom, main: x.main } : null; }; o.d = { sat: g('2026-10-17'), sun: g('2026-10-18'), mon: g('2026-10-19'), wed: g('2026-10-14'), fri: g('2026-10-16') };
      o.edge = [rkOrdDay('2026-10-18T14:00:00'), rkOrdDay('2026-10-18T14:00:59'), rkOrdDay('2026-10-18T14:01:00'), rkOrdDay('2026-12-31 14:30'), rkOrdDay('2026-10-18T05:00:00Z'), rkOrdDay('2026-10-18T05:01:00Z'), rkOrdDay('2026-10-18')];
      { const b = document.createElement('div'); b.innerHTML = rankBundleIcHtml('2026-10-19'); o.bIc = [...b.querySelectorAll('[data-rkic]')].map((x) => x.dataset.rkic + ':' + x.textContent.trim()); b.innerHTML = rankBundleIcHtml('2026-10-14'); o.wIc = [...b.querySelectorAll('[data-rkic]')].map((x) => x.dataset.rkic); }
      openSalesRank(); await Wt(300); o.base = (document.getElementById('rk_base') || {}).textContent || ''; const sat = document.querySelector('#sheet [data-rkday="2026-10-17"]'); o.satRow = sat ? [sat.dataset.rkb, sat.innerText.replace(/\s+/g, ' ')] : null; o.head = document.querySelector('#sheet .rk-tbl th:nth-child(2)').textContent;
      sat && sat.click(); await Wt(400); o.satOpen = S.detail && S.detail.sday; history.back(); await Wt(300); history.back(); await Wt(300);
      // 기록 — 관리자 기기 · 다 받았을 때만 · 바뀐 날만
      window.__FS.sales_daily = { 2026: { year: '2026', days: { '2026-01-01': { amt: 1, n: 1, qty: 1, cash: 0, from: [], split: false, splitFrom: [] } } } }; S._sdly = null; const nW = () => (window.__FSW || []).filter((w) => w.n === 'sales_daily');
      S.ordersLoaded = true; S._allLoaded = false; o.w0 = await sdlySync(); S._allLoaded = true; localStorage.setItem('rn-device', 'ZZ-OTHER'); o.wOther = await sdlySync(); localStorage.setItem('rn-device', 'JS-MAIN');
      const before = nW().length; o.w1 = await sdlySync(); o.docs1 = nW().length - before; const doc = window.__FS.sales_daily['2026'] || {}; const dd = doc.days || {}; o.rec = { sat: dd['2026-10-17'], wed: dd['2026-10-14'], keep: !!dd['2026-01-01'], cut: doc.cut, base: doc.base };
      const b2 = nW().length; o.w2 = await sdlySync(); o.docs2 = nW().length - b2;
      S.orders.get('aladin_W7').items[0].price = 20000; S.ver++; S._sdm = null; const b3 = nW().length; o.w3 = await sdlySync(); const last = nW().slice(-1)[0]; o.w3days = nW().length > b3 && last ? Object.keys(last.v.days) : []; o.wed2 = (window.__FS.sales_daily['2026'].days['2026-10-14'] || {}).amt;
      return o; }, seedRank.toString());
    console.log('  일별:', JSON.stringify(r.d));
    ok(r.d.fri === null && r.d.sat && r.d.sat.amt === 23000 && r.d.sat.n === 2, '금 15:00 주문은 토요일 몫 · 토 = 2.3만 원(금 15:00 + 토 10:00) ' + JSON.stringify(r.d.sat));
    ok(r.d.sun && r.d.sun.amt === 27000 && r.d.mon && r.d.mon.amt === 31000, '일 = 13:00 + 14:00(2.7만) · 월 = 일 14:01 + 월 09:00(3.1만) — 14:00/14:01 경계');
    ok(r.bundle === 81000 && r.d.sat.amt + r.d.sun.amt + r.d.mon.amt === 81000, `월요일 출고 묶음 ${r.bundle}원 = 토+일+월 합 (나눠도 모자람·겹침 없음)`);
    ok(['sat', 'sun', 'mon'].every((k) => r.d[k].split && r.d[k].sf.join() === '2026-10-19' && r.d[k].main === '2026-10-19'), '토·일·월 모두 split · 2026-10-19 묶음에서 나눔');
    ok(r.d.wed && r.wedShip && r.d.wed.amt === r.wedShip[0] && r.d.wed.amt === 13000 && r.d.wed.cash === 3000 && r.wedShip[1] === 3000 && !r.d.wed.split, `하루=하루인 날(수)은 출고별 매출과 같은 값 ${JSON.stringify([r.d.wed, r.wedShip])} — 취소 줄 뺌 · 현금 포함 · split 아님`);
    ok(JSON.stringify(r.edge) === JSON.stringify(['2026-10-18', '2026-10-18', '2026-10-19', '2027-01-01', '2026-10-18', '2026-10-19', '2026-10-18']), '주문 시각 → 날: 14:00(초 포함)까지 그날 · 14:01부터 다음 날 · 해 넘김 · UTC 시각은 한국 시각으로 ' + JSON.stringify(r.edge));
    ok(r.bIc.length === 3 && /^2026-10-17:토/.test(r.bIc[0]) && /^2026-10-18:일/.test(r.bIc[1]) && /^2026-10-19:월/.test(r.bIc[2]) && r.bIc.every((x) => /위$/.test(x)), '출고별 매출 표 월요일 묶음 줄 🏆 = 「토 k위 · 일 k위 · 월 k위」 ' + JSON.stringify(r.bIc));
    ok(r.wIc.length >= 1 && r.wIc.every((d) => d === '2026-10-14'), '하루=하루 묶음 줄은 예전처럼 그날 하나');
    ok(/기준: 일별 주문 매출\(전날 14:01~그날 14:00\)/.test(r.base) && r.head === '주문일', '순위 화면 머리 기준 한 줄 · 칸 이름 주문일: ' + r.base);
    ok(r.satRow && r.satRow[0] === '2026-10-19' && /출고 묶음에서 나눔/.test(r.satRow[1]) && r.satOpen === '2026-10-19', '토요일 줄 — ↤ 묶음에서 나눔 · 누르면 그 묶음(10/19) 출고별 매출 ' + JSON.stringify([r.satRow, r.satOpen]));
    ok(r.w0 === 0 && r.wOther === 0, '기록은 다 받았을 때만 · 관리자 기기에서만 (덜 받음 0 · 다른 기기 0)');
    ok(r.w1 === 4 && r.docs1 === 1 && r.rec.sat && r.rec.sat.split === true && r.rec.sat.splitFrom.join() === '2026-10-19' && r.rec.sat.from[0].d === '2026-10-19' && r.rec.sat.amt === 23000, `sales_daily/2026에 날마다 기록(${r.w1}일 · 문서 쓰기 ${r.docs1}번) · 토 split from 2026-10-19 ` + JSON.stringify(r.rec.sat));
    ok(r.rec.wed && r.rec.wed.split === false && r.rec.wed.amt === 13000 && r.rec.keep && r.rec.cut === '14:00', '하루=하루인 날 split false · 모델에 없는 예전 기록은 지우지 않음 · 마감 14:00 ' + JSON.stringify([r.rec.wed, r.rec.keep, r.rec.cut]));
    ok(r.w2 === 0 && r.docs2 === 0, '바뀐 것 없으면 쓰지 않음');
    ok(r.w3 === 1 && r.w3days.join() === '2026-10-14' && r.wed2 === 23000, '한 날만 바뀌면 그날만 씀 ' + JSON.stringify([r.w3, r.w3days, r.wed2])); ran++;
  });
  // (정범님 11/05) ⑭ 축하·응원 늘리기 · 1위 화려함 / 꼴찌 초라함 · 뜨는 경우(끝까지 누를 때·출고별 매출 열 때·하루 첫 열기·주간·월간) · 경우마다 끄기·하루 한 번
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + seedSrc + ')')(); try { ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o'].forEach((k) => localStorage.removeItem(k)); localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true; S._rkfxMg = 1; S.app.rankFx = { k: {} };
      const fx = () => { const e = document.getElementById('rkfx'); return e ? { kind: e.dataset.kind, occ: e.dataset.occ || '', tier: e.dataset.tier, dur: +e.dataset.dur, txt: e.innerText.replace(/\s+/g, ' ').slice(0, 300) } : null; };
      o.n = Object.fromEntries(Object.entries(RKFX).map(([k, K]) => [k, K.v.length]));
      let bad = 0, cv = 0; for (const [k, K] of Object.entries(RKFX)) for (let i = 0; i < K.v.length; i++) { try { rankFxShow(k, i, null, true); await Wt(30); const e = document.getElementById('rkfx'); if (!e || !e.querySelector('.rkfx-ic svg') || e.dataset.v !== String(i)) bad++; if (S._rkfx && S._rkfx.parts) cv++; } catch (er) { bad++; } rankFxClose(); } o.allBad = bad; o.allCv = cv;
      const look = async (k) => { rankFxShow(k, 0, null, true); await Wt(300); const e = document.getElementById('rkfx'); const c = e.querySelector('.rkfx-c').getBoundingClientRect(); const ic = e.querySelector('.rkfx-ic svg').getBoundingClientRect(); const num0 = e.querySelector('.rkfx-num').textContent; const st = S._rkfx; const x = { tier: e.dataset.tier, dur: +e.dataset.dur, card: Math.round(c.width), ic: Math.round(ic.width), filt: getComputedStyle(e).filter, layers: st.layers, cap: st.cap, beam: !!e.querySelector('.rkfx-beam'), num0 }; await Wt(1900); x.num1 = e.querySelector('.rkfx-num') && e.querySelector('.rkfx-num').textContent; rankFxClose(); return x; };
      o.top = await look('top'); o.up = await look('up'); o.low = await look('low'); o.gone = !document.getElementById('rkfx') && !S._rkfx && !document.querySelector('canvas.rkfx-cv');
      // 뜨는 경우 — 시험 브라우저는 저절로 띄우지 않는 것이 기본 → 켬
      o.autoOff = rkfxOcc('go') === false && !fx(); window.__rkfxAuto = 1;
      const td = D.td; let q = 0; const sale = (d, price) => { q++; const id = 'aladin_P' + q; S.orders.set(id, { id, orderNo: 'P' + q, kind: 'sale', platform: 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + q, price, qty: 1, lineStatus: 'normal' }] }); };
      for (let i = 9; i <= 30; i++) sale(rkBack(td, i), 1000); for (let i = 40; i <= 70; i += 3) sale(rkBack(td, i), 500); /* 예전 주·달은 작게 → 가장 최근 끝난 주·달이 1위 */ S.ver++; S._sdm = null;
      // ▶ 오늘 출고 끝까지 — 확정 전이면 '오늘 지금까지' · 더 높은 등급이 되면 한 번 더 · 같은 경우는 하루 한 번
      __today(42000); const ship0 = S.ship; S.ship = { orders: [{ orderNo: 'D-9', buyer: '손님A', orderedAt: td + ' 10:00', recipient: { name: '손님A' }, items: [{ listingId: '404935009', title: '아직 보낼 책', price: 7000, qty: 1, sku: 'PNK_ms', grade: '상' }] }], tabCounts: {}, at: new Date().toISOString() }; S._shipRowsC = null;
      o.go1r = rkfxOcc('go'); o.go1 = fx(); rankFxClose(); o.go2r = rkfxOcc('go'); S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S._shipRowsC = null; __today(90000); o.go3r = rkfxOcc('go'); o.go3 = fx(); rankFxClose(); o.go4r = rkfxOcc('go');
      // 출고별 매출 열 때 — 따로 셈(끝까지에서 띄웠어도 뜸) · 출고별 매출 칸을 펼치면 뜸 (확정 순간 경우는 이미 본 것으로 둠 — 그 기록은 끝까지 그대로여야 함)
      const confSeen = JSON.stringify({ d: td, k: 'top', g: 3, low: 0 }); localStorage.setItem('rn-rkfx-seen', confSeen); o.confSeen = confSeen;
      S.sec.o_shipday = false; if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sdbar'); i++) await Wt(150); rankFxClose(); const sdb = document.getElementById('sdbar'); if (sdb) sdb.click(); o.tabDbg0 = [!!sdb, S.sec.o_shipday, S.tab]; for (let i = 0; i < 20 && !fx(); i++) await Wt(150); o.tab = fx(); o.tabDbg = [...o.tabDbg0, (S._rkfxQ || []).join(), JSON.stringify(rkfxSeenO('tab')), !!S._rkfx, (() => { try { const x = rkfxOccInfo('tab'); return x && [x.key, x.I.kind]; } catch (e) { return 'err ' + e.message; } })()]; rankFxClose(); o.tab2r = rkfxOcc('tab');
      // 「오늘 출고 끝까지」 단추 고리(shipOneShotGo) — 지운 뒤 누르면 뜸
      try { const all = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete all.go; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(all)); } catch (e) {} window.shipOneShot = () => {}; shipOneShotGo(); shipOneShotGo(); for (let i = 0; i < 20 && !fx(); i++) await Wt(150); o.btn = fx(); rankFxClose(); delete window.shipOneShot; if (document.getElementById('sheet').classList.contains('on')) { history.back(); await Wt(300); }
      // 하루 첫 열기(어제 결과) · 주간 · 월간
      o.ydMd = rkMd(D.bk1); o.openR = rkfxOcc('open'); o.open = fx(); rankFxClose(); o.wk = rkPerInfo('week'); o.mo = rkPerInfo('month'); o.wkR = rkfxOcc('week'); o.wkFx = fx(); rankFxClose(); o.wkAgain = rkfxOcc('week'); o.moR = rkfxOcc('month'); o.moFx = fx(); rankFxClose();
      o.wk = o.wk && { d: o.wk.d, unit: o.wk.unit, N: o.wk.N, kind: o.wk.kind, wd: new Date(o.wk.d + 'T12:00:00Z').getUTCDay(), key: o.wk.key }; o.mo = o.mo && { d: o.mo.d, N: o.mo.N, kind: o.mo.kind };
      // 겹치면 줄 섬 — 하나가 떠 있는 동안 부른 경우는 닫힌 뒤 뜸
      try { localStorage.removeItem('rn-rkfx-seen-o'); } catch (e) {} rkfxOcc('open'); const f1 = fx(); rkfxOcc('week'); o.qd = [f1 && f1.occ, (S._rkfxQ || []).join()]; document.getElementById('rkfx').click(); for (let i = 0; i < 20 && !(fx() && fx().occ === 'week'); i++) await Wt(150); o.q2 = fx(); rankFxClose();
      // 설정 — 경우마다 끄기(공용 저장) · 끄면 안 뜸 · 샘플은 경우마다
      S.sec.set_rankfx = true; for (let i = 0; i < 20 && !document.querySelector('#rkfx_occ input[data-o="week"]'); i++) { S.tab = 'settings'; renderTabs(); renderMain(); await Wt(300); } o.occN = document.querySelectorAll('#rkfx_occ input[data-rkfx="occ"]').length; o.occOn = [...document.querySelectorAll('#rkfx_occ input[data-rkfx="occ"]')].every((x) => x.checked);
      const cb = document.querySelector('#rkfx_occ input[data-o="week"]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await Wt(150); o.saved = ((((window.__FS.app_settings || {}).main || {}).rankFx || {}).on || {});
      try { localStorage.removeItem('rn-rkfx-seen-o'); } catch (e) {} o.offR = rkfxOcc('week'); o.offFx = fx(); o.onOther = rkfxOcc('month'); rankFxClose();
      document.querySelector('[data-rkfxo="week"]').click(); await Wt(100); o.smp = fx(); rankFxClose(); o.conf = localStorage.getItem('rn-rkfx-seen') === o.confSeen; window.__rkfxAuto = 0; S.ship = ship0;
      return o; }, seedRank.toString());
    console.log('  화면:', JSON.stringify({ top: r.top, up: r.up, low: r.low }));
    ok(['top', 'low', 'up', 'down'].every((k) => r.n[k] === 10) && ['wup', 'wdown', 'yup', 'ydown'].every((k) => r.n[k] === 9), '그림 경우마다 6가지씩 더함: ' + JSON.stringify(r.n));
    ok(r.allBad === 0 && r.allCv >= 70, `그림 ${Object.values(r.n).reduce((a, b) => a + b, 0)}가지 모두 뜸(그림·움직임 · 잘못 ${r.allBad})`);
    ok(r.top.tier === 'grand' && r.up.tier === 'daily' && r.low.tier === 'humble', '1위 = 화려(grand) · 매일 견줌 = 보통 · 꼴찌 = 초라(humble)');
    ok(r.top.dur >= 2 * r.up.dur && r.top.card > r.up.card && r.top.ic >= 1.5 * r.up.ic && r.top.layers >= 3 && r.up.layers === 1 && r.top.cap > r.up.cap * 1.8 && r.top.beam, `1위는 훨씬 화려: ${r.top.dur / 1000}초(매일 ${r.up.dur / 1000}초) · 카드 ${r.top.card}px(${r.up.card}) · 트로피 ${r.top.ic}px(${r.up.ic}) · 겹 ${r.top.layers}(1) · 입자 ${r.top.cap}(${r.up.cap}) · 빛줄기`);
    ok(r.top.num0 !== r.top.num1 && /원/.test(r.top.num1) && r.up.num0 === r.up.num1, `1위는 숫자가 올라감(${r.top.num0} → ${r.top.num1}) · 매일 견줌은 바로 ${r.up.num1}`);
    ok(/grayscale\(1\)/.test(r.low.filt) && r.low.card < r.up.card * 0.7 && r.low.ic < r.up.ic && r.low.cap < r.up.cap && r.low.layers === 2 && r.low.dur > r.up.dur, `꼴찌는 훨씬 초라: 흑백(${r.low.filt}) · 작은 카드 ${r.low.card}px · 작은 그림 ${r.low.ic}px · 회색 비 겹 · 입자 ${r.low.cap} · 느린 페이드(${r.low.dur / 1000}초)`);
    ok(r.gone, '닫으면 겹침·캔버스 모두 지움'); ok(r.autoOff, '자동 시험 브라우저에서는 새 경우를 저절로 띄우지 않음(다른 시험 보호)');
    ok(r.go1r && r.go1 && r.go1.occ === 'go' && r.go1.kind === 'up' && /오늘 지금까지/.test(r.go1.txt) && /오늘 출고 끝까지/.test(r.go1.txt), '▶ 오늘 출고 끝까지 — 확정 전이면 「오늘 지금까지」로 견줌: ' + (r.go1 && r.go1.txt.slice(0, 120)));
    ok(r.go2r === false, '같은 경우·같은 등급은 하루 한 번'); ok(r.go3r && r.go3 && r.go3.kind === 'top' && r.go3.tier === 'grand' && r.go4r === false, '더 높은 등급(1위)이 되면 한 번 더 → 다시는 안 뜸');
    ok(r.tab && r.tab.occ === 'tab' && r.tab2r === false, '출고별 매출 칸을 펼치면 뜸(경우마다 따로 셈 · 다시는 안 뜸) ' + JSON.stringify([r.tab && [r.tab.occ, r.tab.kind], r.tabDbg]));
    ok(r.btn && r.btn.occ === 'go', '「▶ 오늘 출고 끝까지」(shipOneShotGo)를 누르면 뜸');
    ok(r.openR && r.open && r.open.occ === 'open' && r.open.txt.includes(r.ydMd), '하루 첫 열기 — 어제 결과: ' + (r.open && r.open.txt.slice(0, 100)));
    ok(r.wk && r.wk.unit === '주' && r.wk.wd === 1 && r.wk.N >= 3 && r.wk.kind === 'top' && r.wkR && r.wkFx && r.wkFx.occ === 'week' && /주 중/.test(r.wkFx.txt) && r.wkAgain === false, '주간 마감 — 끝난 주(월~일) 순위 · 1위 · 그 주에 한 번 ' + JSON.stringify(r.wk));
    ok(r.mo && r.mo.N >= 2 && r.moR && r.moFx && r.moFx.occ === 'month' && /달 중/.test(r.moFx.txt), '달 마감 — 끝난 달 순위 ' + JSON.stringify([r.mo, r.moFx && r.moFx.txt.slice(0, 80)]));
    ok(r.qd[0] === 'open' && r.qd[1] === 'week' && r.q2 && r.q2.occ === 'week', '겹치면 줄 섬 — 닫힌 뒤 다음 경우 ' + JSON.stringify(r.qd));
    ok(r.occN === 7 && r.occOn, '⚙ 설정 🕒 언제 띄울까 — 경우 7가지 · 기본 모두 켬'); ok(r.saved.week === false && Object.keys(r.saved).length === 1, '경우 끄기 저장(공용 app_settings/main.rankFx.on) ' + JSON.stringify(r.saved));
    ok(r.offR === false && !r.offFx && r.onOther === true, '끈 경우(주간)는 안 뜨고 다른 경우(월간)는 뜸');
    ok(r.smp && r.smp.occ === 'week' && /샘플/.test(r.smp.txt) && /주 중/.test(r.smp.txt), '경우마다 샘플(주간 모양): ' + (r.smp && r.smp.txt.slice(0, 100)));
    ok(r.conf, "새 경우들은 확정 순간(rn-rkfx-seen) 기록을 건드리지 않음"); ran++;
  });
  // (정범님 11/05 두 번째) ⑮ 하루 첫 열기·주간·월간·연간 그림 10가지씩 · 기간이 길수록 더 화려(지속·크기·겹·연출 종류) · 1위 갱신과 다른 연출 · 연간 순위·견줌 · 연간 보기 · 설정
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + seedSrc + ')')(); try { ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o'].forEach((k) => localStorage.removeItem(k)); localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true; S._rkfxMg = 1; S.app.rankFx = { k: {} };
      const fx = () => { const e = document.getElementById('rkfx'); return e ? { kind: e.dataset.kind, occ: e.dataset.occ || '', set: e.dataset.set, tier: e.dataset.tier, v: e.dataset.v, txt: e.innerText.replace(/\s+/g, ' ').slice(0, 300) } : null; };
      o.n = Object.fromEntries(Object.entries(RKFX_OCCV).map(([k, K]) => [k, K.v.length])); o.total = Object.values(RKFX).reduce((a, K) => a + K.v.length, 0) + Object.values(RKFX_OCCV).reduce((a, K) => a + K.v.length, 0);
      let bad = 0; for (const [oc, K] of Object.entries(RKFX_OCCV)) for (let i = 0; i < K.v.length; i++) { rankFxShow('up', i, null, true, oc); await Wt(25); const f = fx(); if (!f || f.set !== oc || f.v !== String(i) || f.tier !== K.tier || !document.querySelector('#rkfx .rkfx-ic svg')) bad++; rankFxClose(); } o.bad = bad;
      const look = async (k, oc) => { rankFxShow(k, 0, null, true, oc); await Wt(400); const e = document.getElementById('rkfx'); const c = e.querySelector('.rkfx-c').getBoundingClientRect(); const ic = e.querySelector('.rkfx-ic svg').getBoundingClientRect(); const st = S._rkfx; const x = { tier: e.dataset.tier, dur: +e.dataset.dur, card: Math.round(c.width), ic: Math.round(ic.width), layers: st.layers, modes: (st.modes || []).join(), cap: st.cap, txt: e.innerText.replace(/\s+/g, ' ').slice(0, 160) }; rankFxClose(); return x; };
      o.morning = await look('up', 'open'); o.week = await look('up', 'week'); o.month = await look('up', 'month'); o.year = await look('top', 'year'); o.grand = await look('top'); o.daily = await look('up');
      o.yearUnit = /해 중/.test(o.year.txt); o.gone = !document.getElementById('rkfx') && !S._rkfx;
      // 무작위는 그 경우 10가지 안에서만 · 고정이면 그 그림
      o.rnd = {}; for (const oc of Object.keys(RKFX_OCCV)) { const vs = new Set(); let out = 0; for (let i = 0; i < 30; i++) { const v = rkfxPickO(oc); if (!(v >= 0 && v < RKFX_OCCV[oc].v.length)) out++; vs.add(v); } o.rnd[oc] = [vs.size, out]; }
      // 연간 순위 — 그 전전해·그 전해·지난해 자료 · 올해는 진행 중
      const td = D.td; const Y = +td.slice(0, 4); let q = 0; const sale = (d, price) => { q++; const id = 'aladin_Y' + q; S.orders.set(id, { id, orderNo: 'Y' + q, kind: 'sale', platform: 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + q, price, qty: 1, lineStatus: 'normal' }] }); };
      sale(`${Y - 3}-05-10`, 30000); sale(`${Y - 2}-03-03`, 40000); sale(`${Y - 2}-11-11`, 20000); sale(`${Y - 1}-01-15`, 50000); sale(`${Y - 1}-06-20`, 70000); sale(`${Y - 1}-12-31`, 9000); S.ver++; S._sdm = null;
      const I = rkPerInfo('year'); o.yi = I && { d: I.d, amt: I.amt, N: I.N, rank: I.rank, kind: I.kind, cmps: I.cmps.map((c) => [c.k, c.lab, c.none ? 'none' : c.amt]), bars: I.bars, key: I.key, unit: I.unit };
      window.__rkfxAuto = 1; o.y1 = rkfxOcc('year'); o.yfx = fx(); await Wt(300); o.ybars = !!(S._rkfx && S._rkfx.bars && S._rkfx.bars.length === 12); rankFxClose(); o.y2 = rkfxOcc('year');
      S.app.rankFx = { k: { top: { off: true } }, on: {} }; try { localStorage.removeItem('rn-rkfx-seen-o'); } catch (e) {} o.yKindOff = rkfxOcc('year'); rankFxClose(); /* 기간 경우는 1위 끄기와 상관없이 그 경우 켜기를 봄 */
      S.app.rankFx = { k: {}, on: { year: false } }; try { localStorage.removeItem('rn-rkfx-seen-o'); } catch (e) {} o.yOff = rkfxOcc('year'); o.yOffFx = fx(); rankFxClose(); S.app.rankFx = { k: {} };
      // 하루 첫 열기 — 어제 결과 한 줄 + 아침 그림
      o.op = rkfxOcc('open'); o.opfx = fx(); rankFxClose(); o.ydMd = rkMd(D.bk1);
      // 순위 화면 🎆 연간 보기
      openSalesRank(); await Wt(300); document.querySelector('[data-rkview="year"]').click(); await Wt(300); o.yrows = [...document.querySelectorAll('#rk_ytbl tr[data-rkyear]')].map((x) => x.innerText.replace(/\s+/g, ' ').slice(0, 60)); o.ybase = !!document.getElementById('rk_ybase'); o.scr = pgdCur();
      document.querySelector('[data-rkview="day"]').click(); await Wt(300); o.backDay = !!document.getElementById('rk_per'); history.back(); await Wt(300); S._rkSt = null;
      // 설정 — 🎆 연간 경우 · 기간 경우 그림 고르기(공용 저장) · 경우별 칩 샘플
      S.sec.set_rankfx = true; for (let i = 0; i < 20 && !document.querySelector('#rkfx_occ select[data-o="year"]'); i++) { S.tab = 'settings'; renderTabs(); renderMain(); await Wt(300); }
      o.occN = document.querySelectorAll('#rkfx_occ input[data-rkfx="occ"]').length; o.yOn = !!(document.querySelector('#rkfx_occ input[data-o="year"]') || {}).checked; o.selN = ['open', 'week', 'month', 'year'].map((x) => document.querySelectorAll(`#rkfx_occ select[data-o="${x}"] option`).length);
      const sel = document.querySelector('#rkfx_occ select[data-o="year"]'); sel.value = '4'; sel.dispatchEvent(new Event('change', { bubbles: true })); await Wt(150); o.savedO = ((((window.__FS.app_settings || {}).main || {}).rankFx || {}).o || {}); o.pickFix = [rkfxPickO('year'), rkfxPickO('year'), rkfxPickO('year')];
      const chip = document.querySelector('#rkfx_occ [data-rkfxo="month"][data-i="7"]'); chip && chip.click(); await Wt(100); o.chip = fx(); rankFxClose(); window.__rkfxAuto = 0;
      return o; }, seedRank.toString());
    console.log('  기간:', JSON.stringify({ morning: r.morning, week: r.week, month: r.month, year: r.year, grand: r.grand }));
    ok(['open', 'week', 'month', 'year'].every((k) => r.n[k] === 10) && r.bad === 0, `하루 첫 열기·주간·월간·연간 그림 10가지씩 모두 뜸(잘못 ${r.bad}) · 모든 그림 ${r.total}가지`);
    ok(r.morning.tier === 'morning' && r.week.tier === 'week' && r.month.tier === 'month' && r.year.tier === 'year', '경우마다 연출: 아침 · 주간 · 월간 · 연간');
    ok(r.week.dur < r.month.dur && r.month.dur < r.year.dur && r.week.card < r.month.card && r.month.card < r.year.card && r.week.ic < r.month.ic && r.month.ic < r.year.ic && r.week.layers < r.month.layers && r.month.layers < r.year.layers && r.week.cap < r.month.cap && r.month.cap < r.year.cap, `기간이 길수록 더 화려: 지속 ${r.week.dur}<${r.month.dur}<${r.year.dur} · 카드 ${r.week.card}<${r.month.card}<${r.year.card} · 그림 ${r.week.ic}<${r.month.ic}<${r.year.ic} · 겹 ${r.week.layers}<${r.month.layers}<${r.year.layers}`);
    ok(r.year.dur > r.grand.dur && r.year.layers > r.grand.layers && /festival/.test(r.year.modes) && /review/.test(r.year.modes) && /finish|cover/.test(r.week.modes) && /moonsky/.test(r.month.modes) && /awards/.test(r.month.modes) && !/festival|review|moonsky|awards|finish|cover/.test(r.grand.modes), `1위 갱신과 다른 연출 — 주간 ${r.week.modes} · 월간 ${r.month.modes} · 연간 ${r.year.modes} · 1위 ${r.grand.modes}`);
    ok(r.morning.dur > r.daily.dur && /sunrise/.test(r.morning.modes) && r.yearUnit, '아침은 해돋이 연출 · 연간 카드는 「전체 N해 중」');
    ok(Object.values(r.rnd).every(([n, out]) => n >= 3 && out === 0), '기간 경우 무작위는 그 경우 10가지 안에서만 ' + JSON.stringify(r.rnd)); ok(r.gone, '닫으면 모두 지움');
    ok(r.yi && r.yi.unit === '해' && r.yi.amt === 129000 && r.yi.N === 3 && r.yi.rank === 1 && r.yi.kind === 'top' && r.yi.cmps[0][1] === '지난해' && r.yi.cmps[0][2] === 60000 && r.yi.cmps[1][1] === '그 전해' && r.yi.cmps[1][2] === 30000 && r.yi.bars.length === 12 && r.yi.bars[0] === 50000 && r.yi.bars[5] === 70000 && r.yi.bars[11] === 9000, '연간 순위 — 지난해 12.9만 원 · 끝난 해 3개 중 1위 · 지난해(6만)·그 전해(3만)와 견줌 · 달별 막대 ' + JSON.stringify(r.yi));
    ok(r.y1 && r.yfx && r.yfx.occ === 'year' && r.yfx.tier === 'year' && r.ybars && r.y2 === false, '🎆 연말 마감 화면(한 해 돌아보기 막대 12달) · 그해에 한 번');
    ok(r.yKindOff === true && r.yOff === false && !r.yOffFx, '연간은 그 경우 끄기만 봄(1위 끄기와 상관없음) · 끄면 안 뜸');
    ok(r.op && r.opfx && r.opfx.set === 'open' && r.opfx.tier === 'morning' && r.opfx.txt.includes('어제 결과') && r.opfx.txt.includes(r.ydMd), '🌅 하루 첫 열기 — 아침 그림 + 어제 결과: ' + (r.opfx && r.opfx.txt.slice(0, 120)));
    ok(r.yrows.length === 4 && /^🥇1위/.test(r.yrows[0]) && r.ybase && r.scr === 'salesRank' && r.backDay, '순위 화면 🎆 연간 보기(올해 진행 중 포함 4해) · 하루 보기로 돌아감 ' + JSON.stringify(r.yrows));
    ok(r.occN === 7 && r.yOn && r.selN.every((n) => n === 11), '⚙ 🕒 언제 띄울까 — 🎆 연간 더해 7가지(기본 켬) · 기간 경우마다 그림 고르기(무작위 + 10가지)');
    ok(r.savedO.year && r.savedO.year.v === 4 && r.pickFix.every((v) => v === 4), '연간 그림 고정 저장(공용 app_settings/main.rankFx.o) → 늘 그 그림');
    ok(r.chip && r.chip.occ === 'month' && r.chip.set === 'month' && r.chip.v === '7' && /샘플/.test(r.chip.txt), '경우별 그림 칩 샘플(월간 8번째): ' + (r.chip && r.chip.txt.slice(0, 80))); ran++;
  });
  ok(ran === 6, `시험 칸 여섯이 끝까지 돎(${ran}/6)`);   { const c = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); window.__rkfxNoCap = 0; try { localStorage.removeItem('rn-rkfx-day'); } catch (e) {} S.app = { ...S.app, rankFx: { ...((S.app && S.app.rankFx) || {}), cap: 2 } }; const n = []; for (let i = 0; i < 3; i++) { rankFxShow('up', 0, { d: '2026-11-05', amt: 1, N: 3, kind: 'up' }, false); await Wt(50); n.push(!!document.getElementById('rkfx')); rankFxClose(); await Wt(30); } rankFxShow('up', 0, null, true); await Wt(50); const smp = !!document.getElementById('rkfx'); rankFxClose(); const el = document.getElementById('rkfx_cap'); window.__rkfxNoCap = 1; return { n, smp }; }); ok(c.n[0] && c.n[1] && !c.n[2] && c.smp, '저절로 뜨는 화면은 하루 최대 2번(세 번째는 안 뜸) · 샘플은 셈 밖 ' + JSON.stringify(c)); }
console.log(bad ? `❌ 실패 ${bad}` : '✓ tRANK 모두 통과'); process.exit(bad ? 1 : 0);
})();
