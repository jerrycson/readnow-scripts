// tRANK — 정범님 11/04 '최고 매출 날짜별 순위 · 오늘 출고 확정되면 전체 중 몇 위 · 1위 갱신 축하 · 꼴찌 갱신 응원 · 어제보다 잘하면 응원 · 못하면 위로 · 설정에서 여러 그림 고르기·샘플'
//  ① 순위 계산(출고별 매출과 같은 값 · 현금 포함 · 같은 매출은 같은 순위) ② 오늘 출고 화면 '전체 N일 중 k위'(확정됐을 때만)
//  ③ 1위·꼴찌·지난 출고일보다 많음·적음 — 그 화면이 뜨고 하루 한 번만 ④ 샘플 보기(경우마다 4가지) ⑤ 끄기 ⑥ 순위 화면(상위·하위·기간·날짜 누르기) ⑦ 360px 넘침 없음 · 움직임 줄이기
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tRANK.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
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
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + seedSrc + ')')(); o.D = D; try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); } catch (e) {}
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
      localStorage.setItem('rn-rkfx', JSON.stringify({ k: { top: { off: true } } })); try { localStorage.removeItem('rn-rkfx-seen'); } catch (e) {} __today(70000); openShip(); await Wt(900); o.offTop = fx(); o.offDbg = JSON.stringify([rkfxPrefs(), rankToday() && rankToday().kind, localStorage.getItem('rn-rkfx-seen')]); o.offLine = !!document.getElementById('rk_today'); close(); await Wt(300);
      localStorage.setItem('rn-rkfx', JSON.stringify({ off: true })); openShip(); await Wt(900); o.offAll = fx(); close(); await Wt(300); localStorage.removeItem('rn-rkfx');
      // ④ 설정 — 샘플 보기 (경우마다 4가지 · 고르기 · 무작위)
      S.sec.set_rankfx = true; S.tab = 'settings'; renderTabs(); renderMain(); await Wt(400); const box = document.getElementById('rkfx_box'); o.setBox = !!box; o.chips = {}; o.samples = {};
      for (const k of ['top', 'low', 'up', 'down']) { const cs = [...document.querySelectorAll(`[data-rkfxs="${k}"][data-i]`)]; o.chips[k] = cs.length; const seen = new Set(); for (const c of cs) { c.click(); await Wt(120); const f = fx(); if (f && f.kind === k) seen.add(f.v + '|' + f.cv); rankFxClose(); } o.samples[k] = seen.size; }
      { const sel = document.querySelector('select[data-rkfx="v"][data-k="down"]'); sel.value = '2'; sel.dispatchEvent(new Event('change', { bubbles: true })); await Wt(50); document.querySelector('[data-rkfxs="down"]:not([data-i])').click(); await Wt(120); o.pickV = (fx() || {}).v; o.sampleTxt = (fx() || {}).txt; rankFxClose(); o.saved = JSON.parse(localStorage.getItem('rn-rkfx') || '{}'); }
      { const cb = document.querySelector('input[data-rkfx="on"][data-k="low"]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); o.lowOff = (JSON.parse(localStorage.getItem('rn-rkfx') || '{}').k || {}).low; localStorage.removeItem('rn-rkfx'); }
      o.memGone = !document.getElementById('rkfx') && !S._rkfx && !document.querySelector('canvas.rkfx-cv');
      // ⑥ 순위 화면 — 주문·매출 탭 띠 → 화면 · 상위/하위 · 기간 · 날짜 누르기
      if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); await Wt(2500); const bar = document.getElementById('rkbar'); o.barDbg = [!!bar, (document.getElementById('main') || {}).innerText ? document.getElementById('main').innerText.slice(0, 200) : '']; o.bar = bar ? bar.innerText.replace(/\s+/g, ' ') : ''; bar && bar.click(); await Wt(300);
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
    ok(r.up.kind === 'up' && r.up.f && r.up.f.kind === 'up' && r.up.rank === 4, '지난 출고일(4만 원)보다 많음(4.2만 원) → 응원 화면 · 4위');
    ok(r.down.kind === 'down' && r.down.f && r.down.f.kind === 'down' && r.down.rank === 5, '지난 출고일보다 적음(3.5만 원) → 위로 화면 · 5위');
    ok(!r.pend.done && r.pend.left > 0 && !r.pendLine && !r.pendFx && !r.pendSeen, `오늘 할 일이 남으면(${r.pend.left}건) 한 줄·화면 없음 ` + JSON.stringify([r.pend, r.pendLine, r.pendFx, r.pendDbg]));
    ok(!r.offTop && r.offLine, '1위 화면만 끄면 안 뜸(한 줄은 그대로) ' + JSON.stringify([r.offTop, r.offLine, r.offDbg])); ok(!r.offAll, '모두 끄면 안 뜸');
    ok(r.setBox, '⚙ 설정 › 🏆 매출 축하·응원 칸'); for (const k of ['top', 'low', 'up', 'down']) ok(r.chips[k] >= 4 && r.samples[k] >= 4, `${k}: 그림 ${r.chips[k]}가지 · 샘플 보기로 ${r.samples[k]}가지 모두 뜸`);
    ok(r.pickV === '2' && /샘플/.test(r.sampleTxt || '') && r.saved.k && r.saved.k.down && r.saved.k.down.v === 2, '그림 고르기 저장(이 기기) → 샘플 보기가 고른 그림으로: ' + (r.sampleTxt || ''));
    ok(r.lowOff && r.lowOff.off === true, '경우마다 끄기 저장'); ok(r.memGone, '닫은 뒤 겹침·캔버스 남지 않음');
    ok(/매출 순위/.test(r.bar) && /1위/.test(r.bar), '주문·매출 탭 🏆 매출 순위 띠: ' + r.bar);
    ok(r.scr === 'salesRank', '순위 화면을 설명서 화면 salesRank로 알아봄'); ok(r.rowsTop.length === 6 && /^🥇1위/.test(r.rowsTop[0]) && /70,000원/.test(r.rowsTop[0]), '상위부터: ' + r.rowsTop[0]);
    ok(/6위/.test(r.rowsLow[0]) && /30,000원/.test(r.rowsLow[0]), '하위부터: ' + r.rowsLow[0]);
    ok(r.rowsCus.length === 4 && r.cusAllCol, `기간(날짜 고르기 ${r.D.bk3}~) → ${r.rowsCus.length}일 · 그 안에서 다시 순위 + 전체 순위 칸`);
    ok(r.dayOpen === r.D.bk2 && r.backRank, '날짜 줄 누르면 그날 출고별 매출(하루 출고) · 뒤로 가면 순위 화면');
    ok(/^salesRank\|/.test(r.guide), '📖 화면 설명서: ' + r.guide); ok(r.feat, '🔍 기능 찾기에 매출 순위·축하');
  });
  // ⑦ 휴대폰 360px — 순위 화면·오늘 출고·축하 화면 가로 넘침 없음 · 움직임 줄이기면 그림만
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400); await p.emulateMedia({ reducedMotion: 'reduce' });
    const r = await p.evaluate(async (seedSrc) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + seedSrc + ')')(); try { localStorage.removeItem('rn-rkfx'); localStorage.removeItem('rn-rkfx-seen'); } catch (e) {}
      const wide = () => { const sh = document.getElementById('sheet'); const vw = document.documentElement.clientWidth; let w = 0; (sh.classList.contains('on') ? sh : document.getElementById('main') || document.body).querySelectorAll('*').forEach((x) => { const b = x.getBoundingClientRect(); if (!b.width || b.right <= vw + 1) return; for (let y = x.parentElement; y; y = y.parentElement) { const ox = getComputedStyle(y).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return; } w++; (o.wl = o.wl || []).push(x.className || x.tagName); }); return { doc: document.documentElement.scrollWidth - vw, sh: sh.scrollWidth - sh.clientWidth, w }; };
      __today(70000); S.shipTab = 'confirm'; openShip(); for (let i = 0; i < 30 && !document.getElementById('rkfx'); i++) await Wt(150); o.ship = wide(); o.line = !!document.getElementById('rk_today'); const f = document.getElementById('rkfx'); o.fx = !!f; o.still = f && f.classList.contains('still'); o.noParts = S._rkfx && !S._rkfx.parts; if (f) { const c = f.querySelector('.rkfx-c').getBoundingClientRect(); o.card = [Math.round(c.left), Math.round(c.right), innerWidth]; f.click(); }
      await Wt(100); history.back(); await Wt(300); openSalesRank(); await Wt(300); o.rank = wide(); history.back(); await Wt(300);
      const box = document.createElement('div'); box.className = 'card'; box.innerHTML = rankFxSetHtml(); (document.getElementById('main') || document.body).appendChild(box); await Wt(100); let w = 0; box.querySelectorAll('*').forEach((x) => { if (x.getBoundingClientRect().right > document.documentElement.clientWidth + 1) w++; }); o.set = w; box.remove();
      if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); await Wt(2500); const bar = document.getElementById('rkbar'); o.barDbg = [!!bar, (document.getElementById('main') || {}).innerText ? document.getElementById('main').innerText.slice(0, 200) : '']; o.bar = bar ? Math.round(bar.getBoundingClientRect().right) - document.documentElement.clientWidth : 99; return o; }, seedRank.toString());
    ok(r.line && r.ship.doc <= 0 && r.ship.w === 0, '360px 오늘 출고: 한 줄 있고 가로 넘침 없음 ' + JSON.stringify(r.ship) + JSON.stringify((r.wl || []).slice(0, 8)));
    ok(r.fx && r.still && r.noParts, '움직임 줄이기 → 축하 화면은 그림만(움직임·입자 없음)'); ok(r.card && r.card[0] >= 0 && r.card[1] <= r.card[2], '360px 축하 카드가 화면 안 ' + JSON.stringify(r.card));
    ok(r.rank.doc <= 0 && r.rank.sh <= 0 && r.rank.w === 0, '360px 순위 화면 가로 넘침 없음(표는 칸 안에서만 밀림) ' + JSON.stringify(r.rank)); ok(r.set === 0, '360px 설정 칸 넘침 없음'); ok(r.bar <= 0, '360px 주문·매출 탭 순위 띠 넘침 없음 ' + JSON.stringify(r.barDbg));
  }, { vp: { width: 360, height: 760 }, touch: true });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tRANK 모두 통과'); process.exit(bad ? 1 : 0);
})();
