// tFX6 — 정범님 11/05 밤 축하·응원 고침
//  ① 출고별 매출에서 들어간 오늘 출고 › 💰 출고별 매출 탭 — 위 '오늘 출고 매출' 카드 테두리에 빛(그림자·테두리 움직임) 없음
//  ② 가) HOME PC 재현 — 오늘(11/05)에 10/18·10/19 카드 3장이 뜨던 일: 출고별 매출 표의 날짜 줄(매출 금액 자리)을 눌러 그날 출고 화면으로 가려다 '다시 보기'가 뜸
//        → (정범님 11/05 밤 두 번째로 바뀜: 금액 = 그날 카드 모두 재생 · 날짜·줄 다른 곳 = 그날 출고 화면) 예전: 금액은 줄 누르기와 같음(그날 출고 화면) · 다시 보기는 🏆 칸 🔁 단추로만 · 🌅 하루 첫 열기 없음 · 지난날·지난 기간 기록 갱신 카드 없음(그날에만)
//     나) 카드 금액·순위 = 출고별 매출 표(출고일)와 같음 · 주말 묶음 줄마다 자기 순위(예전엔 10/18·10/19 두 줄에 '일 k위·월 k위'가 똑같이) · ⚙ 일별 주문 매출로 바꿀 수 있음 · sales_daily 기록은 늘 일별 주문 매출
//  ③ 📚 권수·🧾 건수 최대·최하 — 오늘 카드 · 다시 보기 · 표 아이콘 · 주간(일요일) · ⚙ 기준 날 수
//  ④ 여러 장 뒤로 가기 연출 — 3D 뒤집기(rotateY)·공중제비(rotateX) 등 7가지 · 무작위 · transform·opacity만 · 움직임 줄이기면 바로 자리 · 휴대폰 넘침 없음
// 날짜는 page.clock으로 정함 · 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tFX6.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
/* 브라우저 안 — 오늘(td) 앞 70일(하루 1건) + 10/17~10/19 주말 묶음(주문일과 출고일이 엇갈림) · 축하 기록 비움 · 시험 우회 끔 */
const prep = async (p) => p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const td = dstr(new Date()); const bk = (n) => rkBack(td, n); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-rkfx-day', 'rn-rkfx-pl', 'rn-rkfx-conf'].forEach((x) => { try { localStorage.removeItem(x); } catch (e) {} });
  window.__rkfxAuto = 1; window.__rkfxCapTest = 1; window.__rkfxNoCap = 0; S.app = { ...(S.app || {}) }; delete S.app.rankFx; S._rkfxMg = 1;
  S.orders = new Map(); let k = 0; const sale = (od, sd, price, qty) => { k++; const id = 'aladin_Z' + k; S.orders.set(id, { id, orderNo: 'Z' + k, kind: 'sale', platform: 'aladin', orderedAt: od, shippedAt: sd, buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: qty || 1, lineStatus: 'normal' }] }); };
  const wk = new Set(['2026-10-17', '2026-10-18', '2026-10-19']);
  for (let i = 1; i <= 70; i++) { const d = bk(i); if (wk.has(d)) continue; sale(d + 'T10:20', d + 'T16:00', 20000 + ((i * 7919) % 31) * 1000, 1 + (i % 2)); }
  if (td > '2026-10-19') { /* 토 10/17: 토 10시 주문(토 출고) · 일 10/18 출고: 토 15시 주문(→ 주문일 일) + 일 15시 주문(→ 주문일 월) · 월 10/19 출고: 일 11시 주문(→ 일) + 일 16시 주문(→ 월) + 월 9시 주문(→ 월) */
    sale('2026-10-17T10:00', '2026-10-17T16:00', 41000); sale('2026-10-17T15:00', '2026-10-18T12:00', 52000); sale('2026-10-18T15:00', '2026-10-18T17:00', 33000);
    sale('2026-10-18T11:00', '2026-10-19T12:00', 27000); sale('2026-10-18T16:00', '2026-10-19T12:00', 64000); sale('2026-10-19T09:00', '2026-10-19T13:00', 15000); }
  window.__sale = sale;
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S._shipRowsC = null;
  S.ordersLoaded = true; S._allLoaded = true; S.shipDayN = 80; S.ver = (S.ver || 0) + 1; S._sdm = null;
  loadShipDays(); for (let i = 0; i < 20 && !S.shpDaysV; i++) await W(100);
  /* 오늘 — 큰 주문 1건(9권) + 4건(권수·건수 최대가 되게) */
  window.__ents = [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 책 T1', price: 900000, qty: 9 }] }].concat([2, 3, 4, 5].map((n) => ({ id: 'aladin_T' + n, orderNo: 'T' + n, ex: [], items: [{ title: '오늘 책 T' + n, price: 10000, qty: 1 }] })));
  window.__shown = () => { const L = []; const P = S._rkfxP; const st = S._rkfx; const one = (it) => it && L.push({ occ: it.occ, kind: it.kind, per: it.per || rkfxPerOf(it), id: it.id, d: it.I && (it.I.key || it.I.d) }); if (P) { one(P.cur); P.q.forEach(one); P.dock.forEach((d) => one(d.it)); } else if (st && st.item) one(st.item); else if (st && st.el) L.push({ occ: st.el.dataset.occ || '', kind: st.el.dataset.kind, per: 'day' }); return L; };
  window.__close = () => { try { rkfxPClose(); } catch (e) {} try { rankFxClose(1); } catch (e) {} };
  window.__wait = async (ms) => { for (let i = 0; i < ms / 100; i++) { if (window.__shown().length) return window.__shown(); await W(100); } return window.__shown(); };
  window.__home = async () => { window.__close(); for (let i = 0; i < 8 && (S.detail || document.getElementById('sheet').classList.contains('on')); i++) { history.back(); await W(400); } if (S.tab !== 'home') { uxTabGo('home'); await W(300); } };
  window.__tbl = async () => { await window.__home(); S.sec.o_shipday = true; try { localStorage.setItem('rn-sec', JSON.stringify(S.sec)); } catch (e) {} uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(1200); window.__close(); };
  return td; });
(async () => {
  // ━━ A. 2026-11-05(목) 16:00 — ② 가)·나) · ① · ③ 오늘
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-05T16:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await prep(p);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { const td = dstr(new Date()); const sh = window.__shown, close = window.__close, wait = window.__wait;
      /* ── 가) HOME PC 재현: 이 기기에 남은 예전 기록(10/19의 기록 주인) · 확정 처리 전 */
      localStorage.setItem('rn-rkfx-hd', JSON.stringify({ d: '2026-10-19', h: { day: { top: '2026-09-01', low: '2026-09-02' }, week: { top: '2026-09-07', low: '2026-09-14' }, month: { top: '2026-09', low: '2026-08' }, year: { top: '2025', low: '2025' } }, at: '2026-10-19T09:00:00Z' }));
      await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, tabEntries: window.__ents, source: 'tab', readAt: new Date().toISOString() }); await W(800);
      /* 웹앱을 엶(주문 기록 다 받음) — 🌅 하루 첫 열기 없음 */ S._rkfxBoot = 0; rkfxBootSoon(); o.boot = (await wait(4200)).map((x) => x.occ + ':' + x.d); close();
      o.openOcc = !!RKOCC.open || !!RKFX_OCCV.open; o.openInfo = rkfxOccInfo('open');
      await window.__tbl(); o.tblFx = sh().length;
      const cellOf = (d, cls) => { const tr = document.querySelector(`#sd_tbl tr[data-sday="${d}"]`); return tr ? [...tr.children].find((c) => c.matches(cls)) : null; };
      const amtTd = (d) => { const tr = document.querySelector(`#sd_tbl tr[data-sday="${d}"]`); if (!tr) return null; const ix = sdColOrder().indexOf('amt'); return tr.children[ix]; };
      /* 10/19 줄의 매출 금액 자리를 누름(정범님이 그날 출고 화면으로 가려던 것) */ { const a = amtTd('2026-10-19'); o.amtBtn = !!(a && a.querySelector('button')); a.click(); await W(900); o.amtClick = { fx: sh().map((x) => x.d), sdv: S.detail && S.detail.sdv }; close(); await window.__tbl(); }
      /* (정범님 11/05 밤 두 번째) 날짜 칸을 누르면 그날 출고 화면 · 카드 안 뜸 */ { const c = cellOf('2026-10-19', 'td.sd-c-d'); c.click(); await W(900); o.dayClick = { fx: sh().length, sdv: S.detail && S.detail.sdv }; close(); await window.__tbl(); }
      /* ── 나) 금액·순위 = 표 */ const M = shipDayModel(); const R = rankModel(); o.base = R.base; const L = [...rkOrdModel(M).days.values()].filter((x) => x.d <= td && x.n > 0) /* (1.78.410) 표 줄 = 일별 출고 매출 */.sort((a, b) => b.amt - a.amt || a.d.localeCompare(b.d)); const rk = new Map(); let kk = 0; L.forEach((x, i) => { if (!i || x.amt !== L[i - 1].amt) kk = i + 1; rk.set(x.d, kk); });
      o.days = ['2026-10-17', '2026-10-18', '2026-10-19'].map((d) => { const I = rankDayInfo(d); const a = amtTd(d); const rc = cellOf(d, '.rkic-td'); return { d, tbl: rkOrdModel(M).days.get(d).amt, txt: a ? a.textContent.replace(/[^0-9]/g, '') : '', card: I && I.amt, rank: I && I.rank, want: rk.get(d), N: I && I.N, wantN: L.length, rc: rc ? rc.textContent.replace(/\s+/g, ' ').trim() : '', n: I && I.n, tn: rkOrdModel(M).days.get(d).n, q: I && I.qty, tq: rkOrdModel(M).days.get(d).qty }; });
      /* 🔁 다시 보기(10/19) — 사람이 누른 것만 · 카드 금액은 표 금액 */ { const b = document.querySelector('#sd_tbl [data-sdfx="2026-10-19"]'); o.rpBtn = !!(b && b.closest('.rkic-td')); b.click(); await W(500); o.rp = sh().map((x) => x.per + ':' + x.d); const el = document.getElementById('rkfx'); o.rpTxt = el ? el.innerText.replace(/\s+/g, ' ') : ''; close(); }
      { o.rpIts = rkfxReplayItems('2026-10-18').map((x) => x.per + ':' + x.kind + ':' + (x.I.key || x.I.d) + ':' + x.I.amt); }
      /* ⚙ 일별 주문 매출로 바꾸면 예전 셈 · sales_daily는 늘 주문 매출 */ { const shipOrd = rkOrdRows().find((x) => x.d === '2026-10-19'); S.app = { ...S.app, rankFx: { k: {}, base: 'order' } }; const I2 = rankDayInfo('2026-10-19'); o.ord = { base: rankModel().base, amt: I2 && I2.amt, rec: shipOrd && shipOrd.amt, split: rankModel().bun.get('2026-10-19').size, nm: rkBaseNm() }; S.app = { ...S.app }; delete S.app.rankFx; o.back = rankModel().base; }
      /* 순위 화면 기준 글 */ openSalesRank(); await W(300); o.rkBase = (document.getElementById('rk_base') || {}).textContent || ''; o.rkHead = [...document.querySelectorAll('.rk-tbl th')].map((x) => x.textContent)[1]; history.back(); await W(400);
      /* ── 확정 처리 뒤 — 관련 화면마다 · 뜬 카드는 모두 오늘(또는 오늘 끝나는 기간) */
      await window.__home(); await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, source: 'confirm', confirmedAt: new Date().toISOString(), by: 'tester@x' }, { merge: true }); await W(900);
      const t = rankToday(); o.t = { kind: t && t.kind, xk: t && t.xk, qty: t && t.qty, n: t && t.n, rq: t && t.rq, rnk: t && t.rnk };
      o.places = []; for (const nm of ['otab', 'head', 'ship', 'shipsales']) { await window.__home(); if (nm === 'otab') uxTabGo('orders'); else if (nm === 'head') { uxTabGo('orders'); for (let i = 0; i < 40 && !document.getElementById('sdbar'); i++) await W(100); await W(900); close(); document.getElementById('sdbar').click(); } else if (nm === 'ship') openShipHome(); else { S.shipTab = 'sales'; await openShip(); }
        const Ls = await wait(2600); await W(nm === 'otab' ? 600 : 0); o.places.push({ nm, L: sh().map((x) => x.kind + ':' + x.d) }); if (nm === 'otab') { o.xTxt = ''; const P = S._rkfxP; if (P) { for (let i = 0; i < 200 && !(P.dock.length === 3 && !S._rkfx); i++) await W(100); await W(300); o.xTxt = [...document.querySelectorAll('.rkfx-mc')].map((x) => x.innerText.replace(/\s+/g, ' ')).join(' | '); } } close(); window.__rkfxCapTest = 0; }
      o.past = o.places.flatMap((x) => x.L).filter((s) => { const d = s.split(':').slice(1).join(':'); return d && d !== td && !/^(week|month|year):/.test(d); });
      /* 표 오늘 줄 📚·🧾 아이콘 → 누르면 그 그림 */ await window.__tbl(); { const rc = cellOf(td, '.rkic-td'); o.tdIc = rc ? [...rc.querySelectorAll('[data-rkic]')].map((b) => b.dataset.k || '') : []; const qb = rc && rc.querySelector('[data-k="qtop"]'); if (qb) { qb.click(); await W(2300); const el = document.getElementById('rkfx'); o.qIc = el ? { kind: el.dataset.kind, txt: el.innerText.replace(/\s+/g, ' ').slice(0, 200), cls: el.className } : null; close(); } }
      o.rpToday = rkfxReplayItems(td).map((x) => x.kind).join();
      /* ⚙ 기준 날 수 100이면 권수·건수 카드 없음 */ S.app = { ...S.app, rankFx: { k: {}, xMin: 100 } }; o.x100 = (rankToday().xk || []).join(); S.app = { ...S.app }; delete S.app.rankFx;
      /* ① 오늘 출고 매출 카드 빛 없음 — 출고별 매출 머리 '오늘 매출'을 눌러 들어감 */ await window.__tbl(); { const st = document.getElementById('sd_today'); st.click(); for (let i = 0; i < 30 && !document.querySelector('#sheet .ss-hero'); i++) await W(150); await W(400); close(); const h = document.querySelector('#sheet .ss-hero'); const cs = h && getComputedStyle(h); o.hero = h ? { bs: cs.boxShadow, an: cs.animationName, ol: cs.outlineStyle, fl: h.classList.contains('featflash') || h.classList.contains('kbflash') } : null; }
      /* 설명서·설정 */ o.guide = ['xk', 'back', 'replay'].every((id) => (PAGE_GUIDES.salesRank.chapters.find((c) => c.id === 'fx') || { items: [] }).items.some((x) => x.id === id)); o.set = (() => { const h = rankFxSetHtml(); return ['rkfx_basesel', 'rkfx_xmin', 'rkfx_back', 'data-rkfxs="qtop"', 'data-rkfxs="nlow"'].every((x) => h.includes(x)) && !/하루 첫 웹앱 열기/.test(h); })();
      { const js = await (await fetch('readnow-webapp.js')).text(); o.man = /축하·응원 — 11\/05 밤 고침/.test(js); }
      } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); } window.__rkfxAuto = 0; window.__rkfxCapTest = 0; return o; });
    console.log('  A 자료:', JSON.stringify(r).slice(0, 3000));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.boot.length === 0 && !r.openOcc && !r.openInfo && r.tblFx === 0, '가) 11/05 웹앱을 열고 주문·매출 탭에 가도(확정 처리 전) 아무 카드도 안 뜸 — 🌅 하루 첫 열기(어제 결과) 없음: ' + JSON.stringify([r.boot, r.openOcc]));
    ok(!r.amtBtn && r.amtClick.fx.length >= 1 && r.amtClick.fx.every((d) => d === '2026-10-19') && !r.amtClick.sdv && r.dayClick.fx === 0 && r.dayClick.sdv === '2026-10-19', '가) (정범님 11/05 밤 두 번째) 10/19 줄 매출 금액 누름 = 그날(10/19) 카드 모두 재생(다른 날 카드 없음) · 날짜 칸 누름 = 그날 출고 화면: ' + JSON.stringify([r.amtClick, r.dayClick]));
    ok(r.base === 'ship' && r.days.every((x) => x.card === x.tbl && String(x.tbl) === x.txt && x.rank === x.want && x.N === x.wantN && x.n === x.tn && x.q === x.tq), '나) 카드 금액·건수·권수·순위 = 출고별 매출 표(출고일): ' + JSON.stringify(r.days.map((x) => [x.d, x.tbl, x.card, x.rank, x.want, x.N])));
    ok(r.days[1].rc !== r.days[2].rc && r.days.every((x) => !/·/.test(x.rc.replace(/[^·]/g, '').slice(1)) && (new RegExp(x.want + '위').test(x.rc) || /👑|🥈|🥉|🌱/.test(x.rc))), '나) 10/18·10/19 줄 🏆 칸 — 줄마다 자기 순위 하나(예전엔 두 줄 다 「일 k위·월 k위」): ' + JSON.stringify(r.days.map((x) => x.rc)));
    ok(r.rpBtn && r.rp.length >= 1 && r.rp.every((x) => /:2026-10-19$|week:/.test(x)) && /다시 보기/.test(r.rpTxt) && !/어제보다/.test(r.rpTxt), '가) 🔁 단추(🏆 칸)를 누를 때만 그날 다시 보기 · 그날 하루만 · 카드에 「🔁 다시 보기」 · 지난날 카드에 「어제보다」 아님: ' + JSON.stringify([r.rp, r.rpTxt.slice(0, 140)]));
    ok(r.rpIts.filter((x) => /^day:/.test(x)).every((x) => x.endsWith(':' + r.days[1].tbl)) && r.rpIts.some((x) => /^week:/.test(x)), '나) 10/18(일) 다시 보기 = 하루(표 금액 ' + r.days[1].tbl + ') + 그 주 카드: ' + JSON.stringify(r.rpIts));
    ok(r.ord.base === 'order' && r.ord.amt === 112000 && r.ord.rec === 112000 && r.ord.split === 2 && r.ord.nm === '일별 주문 매출' && r.back === 'ship', '⚙ 매출 기준 = 일별 주문 매출이면 예전 셈(10/19 주문일 = 일 15시 3.3만 + 일 16시 6.4만 + 월 9시 1.5만) · sales_daily 기록은 기준과 상관없이 주문 매출: ' + JSON.stringify(r.ord));
    ok(/출고별 매출\(출고일\)/.test(r.rkBase) && r.rkHead === '출고일', '순위 화면 기준 글 · 칸 이름 출고일: ' + r.rkBase.slice(0, 60));
    ok(r.t.xk && r.t.xk.includes('qtop') && r.t.xk.includes('ntop') && r.t.rq === 1 && r.t.rnk === 1, '③ 오늘 권수 13권·건수 5건 = 최대 → 📚·🧾 (권수·건수 1위): ' + JSON.stringify(r.t));
    ok(r.past.length === 0 && r.places.some((x) => x.L.some((s) => /^qtop:/.test(s))) && r.places.some((x) => x.L.some((s) => /^ntop:/.test(s))), '가) 확정 처리 뒤 관련 화면 — 뜬 카드는 모두 오늘(지난날·예전 기록 주인 카드 없음) · 매출 카드 + 📚·🧾 카드: ' + JSON.stringify(r.places));
    ok(/권수/.test(r.xTxt) && /권수 13권/.test(r.xTxt) && /주문 건수 5건/.test(r.xTxt) && /지난 최대/.test(r.xTxt), '③ 권수·건수 카드 글(권수 13권 · 주문 건수 5건): ' + r.xTxt.slice(0, 300));
    ok(r.tdIc.includes('qtop') && r.tdIc.includes('ntop') && r.qIc && r.qIc.kind === 'qtop' && /권수 13권/.test(r.qIc.txt) && /rkfx-top/.test(r.qIc.cls) && /qtop/.test(r.rpToday) && /ntop/.test(r.rpToday), '③ 표 오늘 줄 📚·🧾 아이콘 → 누르면 그 그림 · 다시 보기에도: ' + JSON.stringify([r.tdIc, r.qIc && r.qIc.txt.slice(0, 80), r.rpToday]));
    ok(r.x100 === '', '③ ⚙ 기준 날 수(100)보다 적게 쌓였으면 권수·건수 카드 없음');
    ok(r.hero && r.hero.bs === 'none' && r.hero.an === 'none' && r.hero.ol === 'none' && !r.hero.fl, '① 출고별 매출 → 오늘 출고 매출 카드 테두리 빛 없음: ' + JSON.stringify(r.hero));
    ok(r.guide && r.set && r.man, '📖 화면 설명서(권수·건수·뒤로 가기·다시 보기) · ⚙ 설정(매출 기준·기준 날 수·뒤로 가기 · 하루 첫 열기 없음) · ❓ 설명서 글'); ran++;
  });
  // ━━ B. 일요일 2026-11-08 — 주간 권수·건수 · 지난 기간 기록 갱신 카드 없음
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-08T17:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await prep(p);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { const td = dstr(new Date());
      await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, source: 'confirm', confirmedAt: new Date().toISOString() }); await W(800);
      S.app = { ...S.app, rankFx: { k: {}, xMin: 5 } }; /* 끝난 주가 10개쯤 — ⚙ 기준 5 */
      o.its = rkfxTodayItems().map((x) => x.per + ':' + x.kind); o.wk = rkPerInfo('week', rkPerK('week', td).keyOf(td), true, true); o.wk = o.wk && { xk: o.wk.xk, rq: o.wk.rq };
      /* 지난 주·지난날 주인 바뀜(예전 기록) → 머리 눌러도 카드 아님 */ const H = rkRecHold(); const old = JSON.parse(JSON.stringify(H)); old.day.low = '2020-01-01'; old.week.low = '2020-01-06'; old.month.low = '2020-01'; old.day.top = '2020-01-01'; old.week.top = '2020-01-06'; o.rec = rkRecItems(old, H, rkfxPrefs()).map((x) => x.per + ':' + x.kind + ':' + (x.I.key || x.I.d));
      } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); } window.__rkfxAuto = 0; window.__rkfxCapTest = 0; return o; });
    console.log('  B 자료:', JSON.stringify(r).slice(0, 1200));
    ok(!r.err && r.its.includes('week:qtop') && r.its.includes('week:ntop') && r.its.some((x) => /^day:qtop/.test(x)) && r.wk && r.wk.rq === 1, '③ 일요일 — 주간 카드에도 📚·🧾(그 주 권수·건수 1위): ' + JSON.stringify([r.its, r.wk, r.err]));
    ok(r.rec.every((x) => /:2026-11-08$|week:(top|low):week:2026-11-02$/.test(x)), '가) 기록 갱신 카드는 오늘·오늘 끝나는 기간만 (지난날·지난 기간 주인 바뀜은 안 띄움): ' + JSON.stringify(r.rec)); ran++; });
  // ━━ C. ④ 뒤로 가기 연출 — 연출마다 브라우저 하나(넓은 화면 · 휴대폰) · 무작위 · 움직임 줄이기
  const runFx = async (fxs, red) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { runs: [] }; S.app = { ...(S.app || {}), rankFx: { k: {}, seq: 1 } };
    for (const fx of fxs) { window.__rkfxBack = fx || undefined; rkfxSeqSample(); const one = { fx, anims: [], ov: 0, vw: document.documentElement.clientWidth };
      for (let i = 0; i < 160 && !(S._rkfxP && S._rkfxP.dock.length === 4 && !S._rkfx); i++) { await W(100); [...document.querySelectorAll('.rkfx-mc')].forEach((el) => (el.getAnimations ? el.getAnimations() : []).forEach((a) => { if (!a.effect || !a.effect.getKeyframes || a._seen) return; a._seen = 1; const K = a.effect.getKeyframes(); const keys = [...new Set(K.flatMap((k) => Object.keys(k).filter((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))))]; const tf = K.map((k) => k.transform || '').join(' '); one.anims.push({ keys: keys.join(), x3: /rotateX\((-?[1-9])/.test(tf), y3: /rotateY\((-?[1-9])/.test(tf), n: K.length }); })); one.ov = Math.max(one.ov, document.documentElement.scrollWidth - one.vw); }
      await W(1300); const P = S._rkfxP; one.fxs = P ? (P.fxs || []).join() : 'none'; one.dock = P ? P.dock.length : 0; const B = P ? P.dock.map((d) => d.w.getBoundingClientRect()) : []; one.inside = B.every((b) => b.left >= -1 && b.right <= one.vw + 1); one.overlap = B.some((a, i) => B.some((b, j) => j > i && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)); rkfxPClose(); await W(300); one.gone = !document.getElementById('rkfx_row'); delete window.__rkfxBack; o.runs.push(one); }
    o.n = Object.keys(RKFX_BACK).length; o.keys = Object.keys(RKFX_BACK); return o; };
  const C = { runs: [] }; let keys = [];
  { await H(async (p) => { await p.waitForTimeout(300); const r = await p.evaluate(`(${runFx.toString()})([null, null, null], false)`); keys = r.keys; C.rand = [...new Set(r.runs.flatMap((x) => x.fxs.split(',').slice(1)))]; C.randOk = r.runs.every((x) => x.dock === 4 && x.gone); ran++; }); }
  for (const [nm, vp] of [['넓은 화면 1400px', { width: 1400, height: 900 }], ['휴대폰 360px', { width: 360, height: 740 }]]) for (const fx of (nm[0] === '넓' ? keys : ['flip', 'tumble', 'plane', 'deal'])) {
    await H(async (p) => { await p.waitForTimeout(300); const r = await p.evaluate(`(${runFx.toString()})([${JSON.stringify(fx)}], false)`); r.runs.forEach((x) => C.runs.push({ nm, ...x })); }, { vp }); }
  console.log('  C 자료:', JSON.stringify(C.runs.map((x) => [x.nm.slice(0, 2), x.fx, x.fxs, x.dock, x.anims.length, x.ov, x.inside, x.overlap, x.gone])));
  for (const nm of ['넓은 화면 1400px', '휴대폰 360px']) { const R = C.runs.filter((x) => x.nm === nm);
    ok(R.length >= 4 && R.every((x) => x.dock === 4 && x.fxs.split(',').length === 4 && x.fxs.split(',').slice(1).every((s) => s === x.fx)), `${nm} — 뒤로 가기 연출 ${R.length}가지 끝까지(뒤 자리 셋이 그 연출): ` + R.map((x) => x.fx + '=' + x.fxs).join(' '));
    ok(R.every((x) => x.anims.length >= 3 && x.anims.every((a) => a.keys.split(',').every((k) => ['transform', 'opacity'].includes(k)))), `${nm} — 움직임은 transform·opacity만(레이아웃 흔들림 없음)`);
    const fl = R.find((x) => x.fx === 'flip'), tu = R.find((x) => x.fx === 'tumble'); ok(fl && fl.anims.some((a) => a.y3) && tu && tu.anims.some((a) => a.x3), `${nm} — 🃏 3D 앞뒤 뒤집기(rotateY) · 🤸 뒤로 공중제비(rotateX) 입체`);
    ok(R.every((x) => x.ov <= 0 && x.inside && !x.overlap && x.gone), `${nm} — 움직이는 동안·앉은 뒤 가로 넘침·겹침 없음 · 누르면 모두 닫힘`); }
  ok(keys.length >= 7 && C.randOk && C.rand.length >= 2, `무작위(세 번 · 뒤 자리 9번)에서 ${C.rand.length}가지 나옴(전체 ${keys.length}가지): ` + C.rand.join());
  await H(async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(300); const r = await p.evaluate(`(${runFx.toString()})(['flip'], true)`); const x = r.runs[0];
    ok(x.anims.length === 0 && x.dock === 4 && x.fxs === '' && x.gone, '움직임 줄이기 — 연출 없이 바로 자리: ' + JSON.stringify(x)); ran++; }, { vp: { width: 1000, height: 800 } });
  ok(ran === 4, `시험 칸 넷(가·나·③ · 주간 · 무작위 · 움직임 줄이기)이 끝까지 돎(${ran}/4)`);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tFX6 모두 통과'); process.exit(bad ? 1 : 0);
})();
