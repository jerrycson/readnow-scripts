// tFX3 — 정범님 11/05 (세 번째) 매출 순위·출고별 매출·축하·응원
//  ① '일별 주문 매출' → '기간별 주문 매출' · 🗓 주간 · 📆 월간 순위(하루 순위와 같은 셈 · 마감 시각 그대로) · 줄 누르면 그 기간 하루 순위
//  ② 출고별 매출 — 그 칸 안에서만 머리 띠·칸 이름 줄 고정(벗어나면 풀림) · 칸 이름 끌어 순서 바꿈(이 기기 rn-sd-cols) · 휴대폰은 표 칸 안에서 고정
//  ③ 머리 누를 때 — 오늘 오전 5시 뒤 처음 · 1위 탈환·꼴찌 탈환(금액만 바뀐 것은 아님) 뒤 처음 · 켜고 끄기 · 하루 상한과 따로
//  ④ 출고 카드로 오늘 처음 열 때 · 경우 하나하나 켜고 끄기 ⑤ 지연(초)·터치하기 전까지 안 꺼짐 ⑥ 순위·매출 가장 크게
//  ⑦ 여러 장 이어 보이기 — 기간 짧은 순 · 한 줄 자리(뒤 자리는 돌면서) · 후광 · 누르거나 Esc면 모두 닫힘 · 0개·1개·5개 넘게·화면 크기 바뀜·보이는 중 새 카드·같은 카드 · 움직임 줄이기
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tFX3.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
const seedF = () => { const td = dstr(new Date()); const bk = (n) => rkBack(td, n); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  S._sdL = true; S.shpDays = new Map(); S.orders = new Map(); let k = 0;
  const sale = (d, price) => { k++; const id = 'aladin_F' + k; S.orders.set(id, { id, orderNo: 'F' + k, kind: 'sale', platform: 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
  for (let i = 1; i <= 70; i++) sale(bk(i), 10000 + ((i * 7919) % 23) * 1000);
  window.__sale = (d, p) => { sale(d, p); S.ver = (S.ver || 0) + 1; S._sdm = null; };
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S.ordersLoaded = true; S.shipDayN = 80;
  window.__today = (amt) => { S.shpDays.set(td, { day: td, source: 'tab', confirmedAt: new Date().toISOString(), /* (11/05 저녁) 출고 확정 처리 뒤(확정한 날을 클라우드가 탭 기준으로 바꾼 꼴) */ readAt: new Date().toISOString(), entries: [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 시험 책', price: amt, qty: 1 }] }] }); S.shpDaysV++; S._sdm = null; S.ver = (S.ver || 0) + 1; };
  try { ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-sd-cols', 'rn-rkfx-day'].forEach((x) => localStorage.removeItem(x)); localStorage.setItem('rn-device', 'JS-MAIN'); } catch (e) {} S.devOk = true; S._rkfxMg = 1; window.setFx = (v) => { S.app = { ...(S.app || {}), rankFx: v }; return db.collection('app_settings').doc('main').update({ rankFx: v }).catch(() => db.collection('app_settings').doc('main').set({ rankFx: v }, { merge: true })); }; S.app.rankFx = { k: {} };
  return { td, bk1: bk(1) }; };
/* 지금 보이는(떠 있거나 기다리는) 카드 모두 */
const shownSrc = () => { const L = []; const P = S._rkfxP; const st = S._rkfx; const one = (it) => it && L.push({ occ: it.occ, kind: it.kind, per: it.per || rkfxPerOf(it), kt: (it.I && it.I.kt) || '', id: it.id }); if (P) { one(P.cur); P.q.forEach(one); P.dock.forEach((d) => one(d.it)); } else if (st && st.item) one(st.item); else if (st && st.el) L.push({ occ: st.el.dataset.occ || '', kind: st.el.dataset.kind, per: 'day', kt: '' }); return L; };
(async () => {
  // ── 칸 하나: ① 순위 화면 ② 출고별 매출 고정·끌기 ③ 머리 ④ 출고 카드 ⑤ 지연·유지 ⑥ 크기 (PC 1400)
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const D = (0, eval)('(' + src.seed + ')')(); const shown = (0, eval)('(' + src.shown + ')'); o.D = D; window.__today(30000); try {
      const sh = () => document.getElementById('sheet'); const close = () => { if (sh().classList.contains('on')) history.back(); };
      // ① 순위 화면 — 이름 · 주간 · 월간
      openSalesRank(); await W(300); o.title = (sh().querySelector('.sh .t') || {}).textContent || ''; o.views = [...document.querySelectorAll('#rk_view [data-rkview]')].map((b) => b.dataset.rkview).join();
      const R = rankModel(); const mon = (d) => rkBack(d, (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7); const wsum = new Map(), msum = new Map(); R.L.forEach((x) => { wsum.set(mon(x.d), (wsum.get(mon(x.d)) || 0) + x.amt); msum.set(x.d.slice(0, 7), (msum.get(x.d.slice(0, 7)) || 0) + x.amt); });
      document.querySelector('[data-rkview="week"]').click(); await W(300); const rows = () => [...document.querySelectorAll('#rk_gtbl tr[data-rkgrp]')]; const amtOf = (tr) => +tr.children[2].textContent.replace(/[^0-9]/g, '');
      o.wk = { n: rows().length, want: wsum.size, top: amtOf(rows()[0]), max: Math.max(...wsum.values()), desc: rows().every((tr, i, a) => !i || amtOf(a[i - 1]) >= amtOf(tr)), rk1: rows()[0].children[0].textContent, base: !!document.getElementById('rk_gbase'), title: (sh().querySelector('.sh .t') || {}).textContent, cur: !!document.querySelector('#rk_gtbl tr.rk-td'), prog: /진행 중/.test(document.getElementById('rk_gtbl').textContent) };
      const tie = (() => { const A = rows().map(amtOf); const K = rows().map((tr) => +tr.children[0].textContent.replace(/[^0-9]/g, '')); for (let i = 1; i < A.length; i++) if (A[i] === A[i - 1] && K[i] !== K[i - 1]) return false; return true; })(); o.wk.tie = tie;
      document.querySelector('[data-rkord="low"]').click(); await W(200); o.wkLow = { first: amtOf(rows()[0]), min: Math.min(...wsum.values()) };
      document.querySelector('[data-rkord="top"]').click(); await W(200); const tr0 = rows()[0]; o.wkA = tr0.dataset.a; o.wkB = tr0.dataset.b; tr0.click(); await W(300);
      o.wkDay = { view: S._rkSt.view, per: S._rkSt.per, from: S._rkSt.from, n: document.querySelectorAll('#sheet [data-rkday]').length, want: R.L.filter((x) => x.d >= o.wkA && x.d <= o.wkB).length };
      document.querySelector('[data-rkview="month"]').click(); await W(300); o.mo = { n: rows().length, want: msum.size, top: amtOf(rows()[0]), max: Math.max(...msum.values()), title: (sh().querySelector('.sh .t') || {}).textContent };
      { const s = document.getElementById('rk_gper'); s.value = 'd90'; s.dispatchEvent(new Event('change', { bubbles: true })); await W(200); o.moD90 = { n: rows().length, allCol: /전체 순위/.test(document.getElementById('rk_gtbl').innerText) }; }
      document.querySelector('[data-rkview="year"]').click(); await W(300); o.yr = !!document.getElementById('rk_ytbl') && /기간별 주문 매출/.test((sh().querySelector('.sh .t') || {}).textContent); document.querySelector('[data-rkview="day"]').click(); await W(200); o.day = !!document.getElementById('rk_per');
      o.feat = ['주간 순위', '칸 순서', '1위 탈환', '여러 장 이어 보이기'].map((q) => featFind(q).length > 0); o.guide = !!(PAGE_GUIDES.salesRank.chapters.find((c) => c.id === 'fx') || { items: [] }).items.find((x) => x.id === 'multi'); o.man = /여러 장 이어 보이기/.test(document.documentElement.innerHTML); close(); await W(300); S._rkSt = null;
      // ② 출고별 매출 — 고정·끌기
      S.sec.o_shipday = true; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(400);
      const ths = () => [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(); o.cols0 = ths(); o.xs0 = document.getElementById('sd_tw').classList.contains('xs');
      const sp = document.createElement('div'); sp.id = 'tsp'; sp.style.height = '3000px'; document.getElementById('main').appendChild(sp);
      const B = document.body; const wrap = () => document.getElementById('sd_wrap').getBoundingClientRect(); const stk = () => document.getElementById('sd_stk').getBoundingClientRect(); const th = () => document.querySelector('#sd_tbl th').getBoundingClientRect();
      B.scrollTop += wrap().top + 600; await W(700); const top1 = rnTopPx(); o.st1 = { top: top1, var: getComputedStyle(document.documentElement).getPropertyValue('--rnTop').trim(), stk: Math.round(stk().top), stkH: Math.round(stk().height), th: Math.round(th().top), wrapTop: Math.round(wrap().top) };
      B.scrollTop += wrap().bottom - 40; await W(500); o.st2 = { wrapB: Math.round(wrap().bottom), stkB: Math.round(stk().bottom), stkT: Math.round(stk().top), thT: Math.round(th().top), top: rnTopPx() };
      sp.remove(); B.scrollTop = 0; await W(500); return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, { seed: seedF.toString(), shown: shownSrc.toString() });
    console.log('  ①②:', JSON.stringify(r).slice(0, 1800));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(/기간별 주문 매출/.test(r.title) && !/일별 주문 매출/.test(r.title) && r.views === 'day,week,month,year', "순위 화면 이름 '기간별 주문 매출' · 📅 하루 · 🗓 주간 · 📆 월간 · 🎆 연간: " + r.title + ' / ' + r.views);
    ok(r.wk.n === r.wk.want && r.wk.top === r.wk.max && r.wk.desc && /1위/.test(r.wk.rk1) && r.wk.tie && r.wk.base && /주간/.test(r.wk.title) && r.wk.cur && r.wk.prog, `🗓 주간 순위 — 월~일 묶음 ${r.wk.n}주(셈 ${r.wk.want}) · 1위 ${r.wk.top}(=가장 큰 주) · 큰 매출부터 · 같은 매출 같은 순위 · 이번 주 진행 중`);
    ok(r.wkLow.first === r.wkLow.min, '⬇ 하위부터 = 가장 작은 주 먼저');
    ok(r.wkDay.view === 'day' && r.wkDay.per === 'cus' && r.wkDay.from === r.wkA && r.wkDay.n === r.wkDay.want && r.wkDay.n >= 1, '주간 줄 누르면 그 주의 하루 순위(날짜 고르기): ' + JSON.stringify(r.wkDay));
    ok(r.mo.n === r.mo.want && r.mo.top === r.mo.max && /월간/.test(r.mo.title) && r.moD90.n <= r.mo.n && r.moD90.allCol, `📆 월간 순위 — ${r.mo.n}달 · 1위 ${r.mo.top} · 최근 90일로 좁히면 전체 순위 칸`);
    ok(r.yr && r.day, '🎆 연간 · 📅 하루 보기 그대로'); ok(r.feat.every(Boolean) && r.guide && r.man, '🔍 기능 찾기 4가지 · 📖 설명서(여러 장 이어 보이기) · ❓ 설명서 글: ' + JSON.stringify(r.feat));
    ok(r.cols0 === 'd,src,cut,n,q,amt,rk,sh,cash,out' && !r.xs0, '출고별 매출 표 칸 기본 순서 · PC는 화면 스크롤 그대로: ' + r.cols0);
    ok(Math.abs(r.st1.stk - r.st1.top) <= 2 && Math.abs(r.st1.th - (r.st1.top + r.st1.stkH)) <= 2 && r.st1.wrapTop < r.st1.top, `칸 안에서 머리 띠(${r.st1.stk}px = 가린 높이 ${r.st1.top}) · 칸 이름 줄(${r.st1.th}px = 그 바로 아래)이 위에 붙음 ` + JSON.stringify(r.st1));
    ok(r.st2.stkB <= r.st2.wrapB + 1 && r.st2.stkT < r.st2.top && r.st2.thT < r.st2.top, '칸을 벗어나면 머리 띠·칸 이름 줄도 함께 올라감(풀림) ' + JSON.stringify(r.st2));
    // 끌어서 순서 바꾸기 — 매출 칸을 맨 앞(출고일 왼쪽)으로
    const bx = async (k) => p.evaluate((k) => { const r = document.querySelector(`#sd_tbl th[data-sdcol="${k}"]`).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, k);
    await p.evaluate(() => { localStorage.setItem('rn-rkfx-seen', JSON.stringify({ d: dstr(new Date()), k: 'top', g: 3, low: 1 })); rankFxClose(); }); /* 확정 순간 화면(저절로)이 칸을 가리지 않게 */
    await p.evaluate(() => { const t = document.getElementById('sd_tbl'); document.body.scrollTop += t.getBoundingClientRect().top - 260; }); await p.waitForTimeout(500);
    const a = await bx('amt'), d = await bx('d'); const hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const L = []; for (let x = e; x && L.length < 8; x = x.parentElement) L.push(x.tagName + '#' + x.id + '.' + String(x.className && x.className.baseVal != null ? x.className.baseVal : x.className).slice(0, 25)); return L.join(' < '); }, [a.x + a.w / 2, a.y + a.h / 2]); console.log('  누를 자리:', hit); await p.mouse.move(a.x + a.w / 2, a.y + a.h / 2); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(a.x + a.w / 2 + (d.x + 3 - a.x - a.w / 2) * i / 8, a.y + a.h / 2); await p.mouse.up(); await p.waitForTimeout(500);
    const g = await p.evaluate(() => ({ cols: [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(), ls: localStorage.getItem('rn-sd-cols'), c0: (document.querySelector('#sd_tbl tbody tr[data-sday] td') || {}).textContent || '', reset: !!document.querySelector('[data-sdcolreset]') }));
    const c2 = await bx('cash'), q2 = await bx('q'); await p.mouse.move(c2.x + c2.w / 2, c2.y + c2.h / 2); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(c2.x + c2.w / 2 + (q2.x + q2.w - 3 - c2.x - c2.w / 2) * i / 8, c2.y + c2.h / 2); await p.mouse.up(); await p.waitForTimeout(500);
    const g2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const a = [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(); renderMain(); await W(300); const b = [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(); const clickTh = document.querySelector('#sd_tbl th[data-sdcol="n"]'); clickTh.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: 5, clientY: 5 })); clickTh.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9, clientX: 6, clientY: 5 })); await W(200); const c = [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join();
      localStorage.setItem('rn-sd-cols', JSON.stringify(['zz', 'out', 'out'])); S.app.sdCols = { order: ['zz', 'out', 'out'] }; /* (11/05 네 번째) 칸 순서는 모든 기기 같음(app_settings/main.sdCols) — 공유 값이 이상해도 */ renderMain(); await W(300); const bogus = [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(); document.querySelector('[data-sdcolreset]').click(); await W(300); return { a, b, c, bogus, reset: [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(), ls: localStorage.getItem('rn-sd-cols') }; });
    console.log('  끌기:', JSON.stringify([g, g2]));
    ok(g.cols.startsWith('amt,d,') && JSON.parse(g.ls || '[]')[0] === 'amt' && /원/.test(g.c0) && g.reset, '칸 이름(매출)을 끌어 맨 앞으로 → 머리·줄 칸 함께 · 관리자 기기에서 저장(모든 기기 같음 · 이 기기 사본 rn-sd-cols) · ↺ 처음대로 단추: ' + g.cols);
    ok(/q,cash/.test(g2.a) && g2.a === g2.b && g2.c === g2.b, '두 번째 끌기(그중 현금 → 권수 오른쪽) · 다시 그려도 그대로 · 끌지 않고 누르기만 하면 그대로: ' + g2.a);
    ok(g2.bogus === 'out,d,src,cut,n,q,amt,rk,sh,cash' && g2.reset === 'd,src,cut,n,q,amt,rk,sh,cash,out' && g2.ls === null, '저장 값이 이상해도(모르는 칸·겹침) 고쳐 읽음 · ↺ 처음대로: ' + g2.bogus);
    // ③ 머리 · ④ 출고 카드 · ⑤ 지연·유지 · ⑥ 크기
    const r3 = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const shown = (0, eval)('(' + src.shown + ')'); const td = dstr(new Date()); try {
      window.__rkfxAuto = 1; await window.setFx({ k: {}, seq: 1 }); const kd = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
      const seen = (L) => L.map((x) => `${x.occ}:${x.per}:${x.kind}`).join(',');
      const head = async () => { rankFxClose(); document.getElementById('sdbar').click(); await W(1000); const L = shown(); return L; }; /* (11/05 15시) 펼칠 때·접을 때 모두 한 번 누름으로 셈 */
      window.__rkNow = Date.parse(kd + 'T04:59:00+09:00'); o.d5a = rkDay5(); o.h1 = seen(await head()); o.hd1 = !!rkfxHdGet().h;
      o.h1b = seen(await head()); /* 같은 5시 전 — 다시 안 뜸 */
      window.__rkNow = Date.parse(kd + 'T05:01:00+09:00'); o.d5b = rkDay5(); o.h2 = seen(await head()); o.h3 = seen(await head());
      // 1위 탈환 — 오늘이 가장 큼
      window.__today(900000); o.h4 = seen(await head()); o.h4kt = shown().map((x) => x.kt).join('|'); await W(100); rankFxClose();
      window.__today(950000); o.h5 = seen(await head()); /* 금액만 바뀜(주인 그대로) — 안 뜸 */
      // 꼴찌 탈환 — 지난날 아주 작은 날이 생김(끝난 날)
      window.__sale(rkBack(td, 75), 100); o.h6 = seen(await head()); o.h6kt = shown().map((x) => x.kt).join('|'); rankFxClose();
      // 켜고 끄기 — 기록 갱신 끔
      await window.setFx({ k: {}, seq: 1, on: { rec: false } }); window.__sale(rkBack(td, 76), 50); o.h7 = seen(await head()); await window.setFx({ k: {}, seq: 1 }); o.h8 = seen(await head()); /* 끈 동안의 갱신은 지나감 */
      // 하루 상한과 따로 — 상한을 다 썼어도 머리는 뜸 · 저절로는 막힘
      window.__rkfxNoCap = 0; window.__rkfxCapTest = 1; localStorage.setItem('rn-rkfx-day', JSON.stringify({ d: kd, n: 99 })); window.__sale(rkBack(td, 77), 10); o.h9 = seen(await head()); rankFxClose();
      try { const a = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete a.go; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(a)); } catch (e) {} o.autoCap = [rkfxOcc('go'), !!document.getElementById('rkfx')]; rankFxClose(); window.__rkfxNoCap = 1; window.__rkfxCapTest = 0;
      // 덜 받은 때는 기록을 견주지 않음
      S.ordersLoaded = false; window.__sale(rkBack(td, 78), 5); o.h10 = seen(await head()); S.ordersLoaded = true; rankFxClose();
      // ④ 출고 카드 — 오늘 처음 · 다시는 안 뜸 · 끄기
      localStorage.setItem('rn-rkfx-seen', JSON.stringify({ d: td, k: 'top', g: 3, low: 1 })); /* 확정 순간(conf)은 이미 본 것으로 */ rankFxClose(); if (S.sec.o_shipday && document.getElementById('sdbar')) { document.getElementById('sdbar').click(); await W(300); }
      const ship = async () => { rankFxClose(); const b = document.getElementById('shipentry'); if (!b) return 'no-btn'; b.click(); await W(1400); const L = seen(shown()); rankFxClose(); if (sh0()) { history.back(); await W(400); } return L; }; const sh0 = () => document.getElementById('sheet').classList.contains('on');
      if (S.tab !== 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 40 && !document.getElementById('shipentry'); i++) await W(150); o.s1 = await ship(); o.s2 = await ship(); o.sSeen = !!rkfxPlSeen().p.ship;
      window.__rkNow = Date.parse(rkBack(kd, -1) + 'T06:00:00+09:00'); await window.setFx({ k: {}, seq: 1, on: { ship: false } }); o.s3 = await ship(); await window.setFx({ k: {}, seq: 1 }); o.s4 = await ship(); delete window.__rkNow;
      // ⑤ 지연 · 터치하기 전까지
      await window.setFx({ k: {}, delay: 1.5 }); try { const a = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete a.go; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(a)); } catch (e) {} o.dl0 = [rkfxOcc('go'), !!document.getElementById('rkfx'), !!(S._rkfx && S._rkfx.pend)]; o.dlQ = rkfxOcc('open') === false && (S._rkfxQ || []).includes('open'); await W(1000); o.dl1 = !!document.getElementById('rkfx'); await W(900); o.dl2 = { on: !!document.getElementById('rkfx'), occ: (document.getElementById('rkfx') || { dataset: {} }).dataset.occ }; S._rkfxQ = []; rankFxClose();
      rankFxShow('up', 0, null, true); o.smpNow = !!document.getElementById('rkfx'); rankFxClose(); /* 샘플은 바로 */
      await window.setFx({ k: {}, stay: true }); rankFxShow('up', 0, null, true); o.stay = { tm: S._rkfx && S._rkfx.tm }; rankFxClose(); await window.setFx({ k: {} }); rankFxShow('up', 0, null, true); o.stay.tm2 = S._rkfx && S._rkfx.tm; rankFxClose();
      // 설정 칸 — 지연·유지·한 장 시간 (공용 저장)
      S.sec.set_rankfx = true; for (let i = 0; i < 20 && !document.getElementById('rkfx_delay'); i++) { S.tab = 'settings'; renderTabs(); renderMain(); await W(300); }
      o.occ = [...document.querySelectorAll('#rkfx_occ input[data-rkfx="occ"]')].map((x) => x.dataset.o).join();
      const dl = document.getElementById('rkfx_delay'); dl.value = '2.5'; dl.dispatchEvent(new Event('change', { bubbles: true })); await W(200); const sy = document.getElementById('rkfx_stay'); sy.checked = true; sy.dispatchEvent(new Event('change', { bubbles: true })); await W(200); const sq = document.getElementById('rkfx_seq'); sq.value = '99'; sq.dispatchEvent(new Event('change', { bubbles: true })); await W(200);
      const sv = ((window.__FS.app_settings || {}).main || {}).rankFx || {}; o.saved = { delay: sv.delay, stay: sv.stay, seq: sv.seq, p: rkfxPrefs() };
      const cb = document.querySelector('#rkfx_occ input[data-o="go"]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await W(200); o.goOff = (((((window.__FS.app_settings || {}).main || {}).rankFx || {}).on) || {}).go;
      try { const a = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete a.go; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(a)); } catch (e) {} o.goOffR = rkfxOcc('go'); o.btnSmp = !!document.querySelector('[data-rkfxseq]');
      // ⑥ 순위·매출이 가장 크게
      await window.setFx({ k: {} }); o.big = {}; for (const [k, oc] of [['up', null], ['top', null], ['low', null], ['up', 'week'], ['up', 'month'], ['top', 'year'], ['up', 'open']]) { rankFxShow(k, 0, null, true, oc || undefined); await W(80); const e = document.getElementById('rkfx'); const fs = (sel) => { const x = e.querySelector(sel); return x ? parseFloat(getComputedStyle(x).fontSize) : 0; }; const rk = fs('.rkfx-r b'), am = fs('.rkfx-num'); const other = Math.max(...['.rkfx-h', '.rkfx-k', '.rkfx-m', '.rkfx-s', '.rkfx-o', '.rkfx-cmp', '.rkfx-x'].map(fs)); o.big[(oc || '') + k] = [rk, am, other]; rankFxClose(); }
      window.__rkfxAuto = 0; return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, { shown: shownSrc.toString() });
    console.log('  ③~⑥:', JSON.stringify(r3).slice(0, 2500));
    ok(!r3.err, '시험 중 오류 없음(③~⑥) ' + (r3.err || ''));
    ok(/^tab:day:/.test(r3.h1) && r3.hd1 && r3.h1b === '', `머리를 확정 처리 뒤 처음 누르면 그날 카드 · 다시 누르면 안 뜸: ` + [r3.h1, r3.h1b].join(' / '));
    ok(r3.h2 === '' && r3.h3 === '', `(11/05 저녁) 하루는 한국 날짜 — 오전 5시가 지나도(${r3.d5b}) 같은 날이면 다시 안 뜸: ` + [r3.h2, r3.h3].join(' / '));
    ok(/rec:day:top/.test(r3.h4) && /하루 1위 탈환/.test(r3.h4kt) && r3.h5 === '', '1위 탈환(오늘이 가장 큼) → 누르면 🔁 기록 갱신 카드 · 금액만 더 커지면(주인 그대로) 안 뜸: ' + [r3.h4, r3.h4kt, r3.h5].join(' / '));
    ok(/rec:day:low/.test(r3.h6) && /하루 꼴찌 탈환/.test(r3.h6kt), '꼴찌 탈환(끝난 날) → 누르면 카드: ' + r3.h6 + ' ' + r3.h6kt);
    ok(r3.h7 === '' && r3.h8 === '', '🔁 기록 갱신을 끄면 안 뜸 · 끈 동안의 갱신은 다시 켜도 지나감: ' + [r3.h7, r3.h8].join(' / '));
    ok(r3.h9 === '' && r3.autoCap[0] === false && r3.autoCap[1] === false, '(11/05 저녁) 기기 하루 상한을 다 썼으면 머리도 안 뜸(기기마다 N번) · 끝까지 끝도 막힘: ' + JSON.stringify([r3.h9, r3.autoCap]));
    ok(r3.h10 === '', '주문 기록을 다 받기 전에는 기록 갱신을 견주지 않음');
    ok(/^ship:day:/.test(r3.s1) && r3.s2 === '' && r3.sSeen && r3.s3 === '' && /^ship:day:/.test(r3.s4), '🚚 출고 카드로 확정 처리 뒤 처음 열면 그날 카드 · 두 번째는 안 뜸 · 다음 날(한국 날짜) 끄면 안 뜸 · 켜면 뜸: ' + [r3.s1, r3.s2, r3.s3, r3.s4].join(' / '));
    ok(r3.dl0[0] === true && !r3.dl0[1] && r3.dl0[2] && r3.dlQ && !r3.dl1 && r3.dl2.on && r3.dl2.occ === 'go' && r3.smpNow, '⏱ 나타나기까지 1.5초 — 바로 안 뜨고 기다림(그동안 다른 경우는 줄 섬) → 1.5초 뒤 뜸 · 샘플은 바로: ' + JSON.stringify([r3.dl0, r3.dl1, r3.dl2]));
    ok(r3.stay.tm === 0 && r3.stay.tm2 > 0, '📌 터치하기 전까지 안 꺼짐 — 저절로 닫는 시계 없음(끄면 있음) ' + JSON.stringify(r3.stay));
    ok(r3.occ === 'conf,go,tab,rec,ship,open,week,month,year', '🕒 언제 띄울까 — 오늘 출고 끝까지·머리·기록 갱신·출고 카드까지 하나하나: ' + r3.occ);
    ok(r3.saved.delay === 2.5 && r3.saved.stay === true && r3.saved.seq === 15 && r3.saved.p.delay === 2.5 && r3.saved.p.seq === 15 && r3.goOff === false && r3.goOffR === false && r3.btnSmp, '설정 칸 — 지연 2.5초 · 터치 전까지 · 한 장 시간(99 → 15초로 맞춤) 공용 저장 · 오늘 출고 끝까지 끄면 안 뜸 · 🎖 여러 장 샘플 단추: ' + JSON.stringify(r3.saved));
    ok(Object.values(r3.big).every(([rk, am, ot]) => rk > ot && am > ot && rk >= 28 && am >= 26), '카드에서 순위·매출이 가장 큰 글자(모든 연출): ' + JSON.stringify(r3.big)); ran++;
   }, { noFriend: true });
  // ── 칸 둘: ⑦ 여러 장 이어 보이기 (PC 1400 → 화면 크기 바뀜)
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + src.seed + ')')(); window.__today(30000); try { await window.setFx({ k: {}, seq: 1 });
      const row = () => { const P = S._rkfxP; if (!P) return null; return P.dock.slice().sort((a, b) => a.slot - b.slot).map((d) => { const b = d.w.getBoundingClientRect(); return { per: d.it.per, id: d.it.id, l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), rot: d.rot, tf: d.w.style.transform }; }); };
      const waitDock = async (n, ms) => { for (let i = 0; i < (ms || 80) && !(S._rkfxP && S._rkfxP.dock.length >= n && !S._rkfx && !S._rkfxP.q.length); i++) await W(100); await W(1200); };
      o.zero = [rkfxPresent([]), !!document.getElementById('rkfx'), !!document.getElementById('rkfx_row')];
      o.one = [rkfxPresent([{ kind: 'up', vi: 0, I: null, occ: 'tab' }], { sample: 1 }), !!document.getElementById('rkfx'), !!document.getElementById('rkfx_row')]; rankFxClose();
      // 네 장 — 차례를 섞어 넣어도 기간 짧은 순
      rkfxPresent([{ kind: 'top', vi: 0, I: null, occ: 'year', id: 'a4' }, { kind: 'up', vi: 0, I: null, occ: 'month', id: 'a3' }, { kind: 'up', vi: 0, I: null, occ: 'tab', id: 'a1' }, { kind: 'top', vi: 0, I: null, occ: 'week', id: 'a2' }], { sample: 1 });
      const f0 = document.getElementById('rkfx'); o.first = f0 && { occ: f0.dataset.occ, x: (f0.querySelector('.rkfx-x') || {}).textContent };
      o.dup = rkfxPresent([{ kind: 'up', vi: 0, I: null, occ: 'tab', id: 'a1' }]) && S._rkfxP.ids.size === 4; /* 같은 카드는 한 번만 */
      await W(300); document.getElementById('rkfx').click(); await W(150); o.adv = { dock: S._rkfxP.dock.length, cur: S._rkfxP.cur && S._rkfxP.cur.per };
      await waitDock(4); o.r4 = row(); o.big = !!document.getElementById('rkfx'); o.aura = (() => { const c = document.querySelector('.rkfx-mc > .rkfx-c'); return c ? getComputedStyle(c).animationName : ''; })(); o.vw = innerWidth; o.ov = document.documentElement.scrollWidth - innerWidth;
      await W(2500); o.stay = (row() || []).length; /* 다 앉으면 그대로 */
      // 화면 크기 바뀜 → 자리 다시
      return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, { seed: seedF.toString() });
    await p.setViewportSize({ width: 360, height: 740 }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const row = () => { const P = S._rkfxP; if (!P) return null; return P.dock.slice().sort((a, b) => a.slot - b.slot).map((d) => { const b = d.w.getBoundingClientRect(); return { per: d.it.per, l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top) }; }); };
      o.rs = row(); o.vw = innerWidth; o.ov = document.documentElement.scrollWidth - innerWidth;
      // 보이는 중(다 앉은 뒤)에 새 카드 — 하루 카드가 오면 맨 앞 자리로
      rkfxPresent([{ kind: 'down', vi: 0, I: null, occ: 'tab', id: 'b0' }], { sample: 1 }); await W(200); o.newBig = !!document.getElementById('rkfx'); for (let i = 0; i < 60 && !(S._rkfxP && S._rkfxP.dock.length === 5 && !S._rkfx); i++) await W(100); await W(1300); o.r5 = row();
      // 하나를 누르면 모두 닫힘
      document.querySelector('.rkfx-mc').click(); await W(100); o.gone = !document.getElementById('rkfx_row') && !S._rkfxP && !document.getElementById('rkfx') && !document.querySelector('.rkfx-mc');
      return o; });
    // Esc · 한 장 떠 있는 중 새 카드 · 일곱 장(휴대폰 폭)
    const r3 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await window.setFx({ k: {}, seq: 1 });
      const row = () => { const P = S._rkfxP; if (!P) return null; return P.dock.slice().sort((a, b) => a.slot - b.slot).map((d) => { const b = d.w.getBoundingClientRect(); return { per: d.it.per, l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) }; }); };
      rkfxPresent([{ kind: 'up', vi: 0, I: null, occ: 'month', id: 'c1' }], { sample: 1 }); o.single = !!document.getElementById('rkfx') && !S._rkfxP; await W(300);
      rkfxPresent([{ kind: 'top', vi: 0, I: null, occ: 'tab', id: 'c2' }], { sample: 1 }); o.conv = !!S._rkfxP; for (let i = 0; i < 60 && !(S._rkfxP && S._rkfxP.dock.length === 2 && !S._rkfx); i++) await W(100); await W(1200); o.c = (row() || []).map((x) => x.per).join();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(100); o.esc = !S._rkfxP && !document.getElementById('rkfx_row');
      const seven = ['tab', 'tab', 'week', 'week', 'month', 'year', 'year'].map((oc, i) => ({ kind: i % 2 ? 'up' : 'top', vi: 0, I: null, occ: oc, id: 'd' + i })); rkfxPresent(seven, { sample: 1 }); for (let i = 0; i < 160 && !(S._rkfxP && S._rkfxP.dock.length === 7 && !S._rkfx); i++) await W(100); await W(1300); o.r7 = row(); o.vw = innerWidth; o.ov = document.documentElement.scrollWidth - innerWidth; rankFxClose(); o.gone7 = !S._rkfxP && !document.querySelector('.rkfx-mc');
      return o; });
    // 움직임 줄이기 — 바로 자리
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const r4 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; rkfxSeqSample(); o.now = S._rkfxP ? S._rkfxP.dock.length : -1; o.big = !!document.getElementById('rkfx'); o.tr = (document.querySelector('.rkfx-mc') || { style: {} }).style.transition; o.anim = (() => { const c = document.querySelector('.rkfx-mc > .rkfx-c'); return c ? getComputedStyle(c).animationName : ''; })(); o.order = S._rkfxP ? S._rkfxP.dock.slice().sort((a, b) => a.slot - b.slot).map((d) => d.it.per).join() : ''; rankFxClose(); return o; });
    console.log('  ⑦:', JSON.stringify([r, r2, r3, r4]).slice(0, 3500));
    ok(!r.err, '시험 중 오류 없음(⑦) ' + (r.err || ''));
    ok(r.zero[0] === false && !r.zero[1] && !r.zero[2], '카드 0개 — 아무것도 안 뜸'); ok(r.one[0] && r.one[1] && !r.one[2], '카드 하나 — 예전처럼 한 장 화면(줄 없음)');
    ok(r.first && r.first.occ === 'tab' && /누르면 다음/.test(r.first.x) && r.dup, '네 장을 섞어 넣어도 하루 카드부터 크게 · 큰 카드는 누르면 다음 · 같은 카드는 한 번만: ' + JSON.stringify(r.first));
    ok(r.adv.dock >= 1, '큰 카드를 누르면 자리로 가고 다음 장: ' + JSON.stringify(r.adv));
    const R4 = r.r4 || []; ok(R4.length === 4 && R4.map((x) => x.per).join() === 'day,week,month,year' && R4.every((x, i) => !i || x.l > R4[i - 1].r - 1) && R4.every((x) => x.l >= 0 && x.r <= r.vw && x.t < 300) && !r.big && r.ov <= 0, '다 앉음 — 화면 위쪽 한 줄 왼쪽부터 하루·주간·월간·연간 · 겹침·넘침 없음: ' + JSON.stringify(R4.map((x) => [x.per, x.l, x.r, x.t])));
    ok(R4[0] && R4[0].rot === 0 && R4.slice(1).every((x) => x.rot === 360 && /rotate\(360deg\)/.test(x.tf)), '첫 자리 뒤로 갈 때는 돌면서(360°) · 첫 자리는 돌지 않음');
    ok(r.aura === 'rkfxAura' && r.stay === 4, '자기 색 후광(은은히 숨쉼) · 다 앉은 뒤에는 저절로 안 사라짐: ' + r.aura);
    const RS = r2.rs || []; ok(RS.length === 4 && RS.every((x) => x.l >= 0 && x.r <= r2.vw) && RS.every((x, i) => !i || x.t > RS[i - 1].t) && r2.ov <= 0, `화면이 360px로 바뀌면 자리를 다시 셈(11/05 저녁: 글씨가 읽히게 한 줄에 한 장 · 넘침 없음): ` + JSON.stringify(RS.map((x) => [x.l, x.r, x.t])));
    const R5 = r2.r5 || []; ok(r2.newBig && R5.length === 5 && R5.map((x) => x.per).join() === 'day,day,week,month,year' && R5.every((x) => x.l >= 0 && x.r <= r2.vw), '보이는 중 새 하루 카드 → 크게 보인 뒤 하루 자리(앞쪽)로 · 다른 카드는 비켜 앉음: ' + R5.map((x) => x.per).join());
    ok(r2.gone, '하나를 누르면 모두 사라짐(줄·카드·큰 화면)');
    ok(r3.single && r3.conv && r3.c === 'day,month' && r3.esc, '한 장이 떠 있는 중에 새 카드 → 이어 보이기로(하루 먼저) · Esc면 모두 닫힘: ' + r3.c);
    const R7 = r3.r7 || []; ok(R7.length === 7 && R7.every((x) => x.l >= 0 && x.r <= r3.vw) && R7.every((x, i) => !i || x.t >= R7[i - 1].b - 1) && r3.ov <= 0 && R7.map((x) => x.per).join() === 'day,day,week,week,month,year,year' && r3.gone7, '일곱 장도 휴대폰 폭 — (11/05 저녁) 글씨가 읽히게 한 줄에 한 장씩 아래로(겹침·가로 스크롤 없음 · 위아래로 밀어 봄): ' + JSON.stringify(R7.map((x) => [x.per, x.l, x.r, x.t])));
    ok(r4.now === 4 && !r4.big && r4.order === 'day,week,month,year' && r4.anim === 'none', '움직임 줄이기 — 크게 보이기 없이 바로 네 자리 · 후광 숨쉬기 없음: ' + JSON.stringify(r4)); ran++;
  });
  // ── 칸 셋: 휴대폰(360) — 출고별 매출 표가 넓으면 표 칸 안에서 머리 줄·첫 칸 고정 · 가로 넘침 없음 · 카드 크기
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + src.seed + ')')(); window.__today(30000); try {
      S.sec.o_shipday = true; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(500);
      const tw = document.getElementById('sd_tw'); o.xs = tw.classList.contains('xs'); o.mh = parseFloat(tw.style.maxHeight) || 0; tw.scrollTop = 400; tw.scrollLeft = 200; await W(200);
      const twr = tw.getBoundingClientRect(), th = document.querySelector('#sd_tbl th').getBoundingClientRect(), td0 = document.querySelector('#sd_tbl tbody tr td').getBoundingClientRect();
      o.thTop = Math.round(th.top - twr.top); o.firstL = Math.round(th.left - twr.left); o.tdL = Math.round(td0.left - twr.left); o.ov = document.documentElement.scrollWidth - innerWidth; o.bodyOv = document.body.scrollWidth - document.body.clientWidth;
      rankFxShow('top', 0, null, true); await W(100); const c = document.querySelector('#rkfx .rkfx-c').getBoundingClientRect(); o.card = { l: Math.round(c.left), r: Math.round(c.right), vw: innerWidth }; rankFxClose();
      return o; } catch (e) { o.err = e.message; return o; } }, { seed: seedF.toString() });
    console.log('  휴대폰:', JSON.stringify(r));
    ok(!r.err && r.xs && r.mh >= 240 && Math.abs(r.thTop) <= 1 && Math.abs(r.firstL) <= 1 && Math.abs(r.tdL) <= 1 && r.ov <= 0, '휴대폰: 표가 넓으면 표 칸 안에서 밀고 칸 이름 줄·첫 칸(출고일) 고정 · 화면 가로 넘침 없음: ' + JSON.stringify(r));
    ok(r.card.l >= 0 && r.card.r <= r.card.vw, '휴대폰: 큰 숫자로 바꾼 카드도 화면 안'); ran++;
  }, { vp: { width: 360, height: 740 }, touch: true });
  ok(ran === 3, `시험 칸 셋이 끝까지 돎(${ran}/3)`);
  console.log(bad ? `❌ tFX3 실패 ${bad}` : '✓ tFX3 모두 통과'); process.exit(bad ? 1 : 0);
})();
