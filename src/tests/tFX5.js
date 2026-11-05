// tFX5 — 정범님 11/05 저녁 축하·응원 띄우는 때 고침
//  ① 축하를 띄우는 때 = 오늘 출고가 (잠정이라도) 확정되는 출고 처리(✅ 출고 확정 단추 · ▶ 끝까지가 끝남 · 고친 날) — 오후 2시 마감은 기준 아님
//     그 전(첫 송장이 배송&구매확정전으로 옮겨져 클라우드가 탭을 읽음 · ▶ 끝까지 누름)은 안 뜸 · 그 뒤 관련 화면에 처음 들어갈 때 각각 한 번
//     횟수는 기기마다(기본 2번 = 기기마다 2번씩) · 기기 저장(localStorage) · 한국 날짜
//  ② 주·월·년은 그 기간 마지막 날(일요일 · 그 달 마지막 날 · 12/31)에만 — 평일에는 기간 카드 없음
//  ③ 매출 금액 다시 보기 — 그날 실제로 끝나는 기간 카드만(진행 중 '지금까지' 없음) · 해당 없는 기간은 아이콘도 없음
//  ④ 여러 장 줄 — 앉은 카드도 글씨가 읽히는 크기(원래의 0.5배 이상) · 휴대폰 폭(360px)도 겹침·가로 넘침 없음
// 실제와 같은 조건 — 자동 시험 우회 끔(window.__rkfxAuto = 1 · __rkfxCapTest = 1 · __rkfxNoCap 없음) · 축하 설정은 기본값
// 날짜는 page.clock으로 정함(브라우저 시간대는 기기 그대로 — UTC여도 한국 날짜로 셈하는지 봄)
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tFX5.js (pw/ 안 — harness.js·seed.js 옆)
const uq = (s) => [...new Set(String(s || '').split(','))].join(); /* (11/05 밤) 📚·🧾 권수·건수 카드도 하루 카드라 기간 종류만 봄 */
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
/* 브라우저 안에서 — 오늘(td) 기준 70일 주문 + 오늘 주문 3건 · 축하 기록 비움 · 시험 우회 끔 */
const prep = async (p) => p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms));
  const td = dstr(new Date()); const bk = (n) => rkBack(td, n); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-rkfx-day', 'rn-rkfx-pl', 'rn-rkfx-conf'].forEach((x) => { try { localStorage.removeItem(x); } catch (e) {} });
  window.__rkfxAuto = 1; window.__rkfxCapTest = 1; window.__rkfxNoCap = 0; S.app = { ...(S.app || {}) }; delete S.app.rankFx; S._rkfxMg = 1;
  S.orders = new Map(); let k = 0; const sale = (d, price) => { k++; const id = 'aladin_Z' + k; S.orders.set(id, { id, orderNo: 'Z' + k, kind: 'sale', platform: 'aladin', orderedAt: d + 'T10:20', shippedAt: d + 'T16:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
  for (let i = 1; i <= 70; i++) sale(bk(i), 20000 + ((i * 7919) % 31) * 1000);
  window.__sale = sale;
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S._shipRowsC = null;
  S.ordersLoaded = true; S._allLoaded = true; S.shipDayN = 80; S.ver = (S.ver || 0) + 1; S._sdm = null;
  loadShipDays(); for (let i = 0; i < 20 && !S.shpDaysV; i++) await W(100);
  window.__ents = [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 책 T1', price: 900000, qty: 1 }] }, { id: 'aladin_T2', orderNo: 'T2', ex: [], items: [{ title: '오늘 책 T2', price: 150000, qty: 1 }] }];
  /* 기기 하나 바꾸기 = 이 기기 저장만 비움(공용 Firestore는 그대로) */ window.__newDevice = () => ['rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-rkfx-day', 'rn-rkfx-pl', 'rn-rkfx-conf'].forEach((x) => { try { localStorage.removeItem(x); } catch (e) {} });
  window.__shown = () => { const L = []; const P = S._rkfxP; const st = S._rkfx; const one = (it) => it && L.push({ occ: it.occ, kind: it.kind, per: it.per || rkfxPerOf(it), id: it.id }); if (P) { one(P.cur); P.q.forEach(one); P.dock.forEach((d) => one(d.it)); } else if (st && st.item) one(st.item); else if (st && st.el) L.push({ occ: st.el.dataset.occ || '', kind: st.el.dataset.kind, per: 'day' }); return L; };
  window.__close = () => { try { rkfxPClose(); } catch (e) {} try { rankFxClose(1); } catch (e) {} };
  window.__wait = async (ms) => { for (let i = 0; i < ms / 100; i++) { if (window.__shown().length) return window.__shown(); await W(100); } return window.__shown(); };
  window.__day = () => { try { const v = JSON.parse(localStorage.getItem('rn-rkfx-day') || '{}'); return v.n || 0; } catch (e) { return -1; } };
  window.__home = async () => { window.__close(); for (let i = 0; i < 8 && (S.detail || document.getElementById('sheet').classList.contains('on')); i++) { history.back(); await W(400); } if (S.tab !== 'home') { uxTabGo('home'); await W(300); } };
  return td; });
(async () => {
  // ━━ A. 평일(2026-11-05 목 · 한국 16:00) — 확정 처리 전/후 · 화면마다 한 번 · 기기마다 2번 · 매출 금액 다시 보기
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-05T16:00:00+09:00')); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); const td = await prep(p);
    const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { const td = dstr(new Date()); const bk = (n) => rkBack(td, n); const sh = window.__shown, close = window.__close, wait = window.__wait;
      const place = async (name) => { await window.__home(); if (name === 'otab') { uxTabGo('orders'); for (let i = 0; i < 40 && !document.getElementById('sdbar'); i++) await W(100); }
        else if (name === 'head') { if (S.tab !== 'orders') { uxTabGo('orders'); for (let i = 0; i < 40 && !document.getElementById('sdbar'); i++) await W(100); await W(900); close(); } document.getElementById('sdbar').click(); }
        else if (name === 'ship') openShipHome(); else if (name === 'shipsales') { S.shipTab = 'sales'; await openShip(); } const L = await wait(2200); close(); return L.map((x) => x.per + ':' + x.occ).join(','); };
      /* 1) 확정 처리 전 — 첫 송장이 배송&구매확정전으로 옮겨져 클라우드가 탭을 읽음(source tab) */
      await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, tabEntries: window.__ents, source: 'tab', readAt: new Date().toISOString(), by: 'cloud (배송&구매확정전)' }); await W(900);
      const t0 = rankToday(); o.pre = { done: t0 && t0.done, kind: t0 && t0.kind, conf: rkConfAt() }; o.preFx = {}; for (const n of ['otab', 'head', 'ship', 'shipsales']) o.preFx[n] = await place(n);
      /* ▶ 끝까지 누름(확정 전) — 누르는 순간은 안 뜸 */ await window.__home(); window.shipOneShot = () => {}; shipOneShotGo(); shipOneShotGo(); o.preGo = (await wait(1800)).length; delete window.shipOneShot; close();
      o.preRec = { day: window.__day(), pl: localStorage.getItem('rn-rkfx-pl'), seen: localStorage.getItem('rn-rkfx-seen') };
      /* 2) ✅ 출고 확정 단추 — shp_days source confirm(실제 단추가 쓰는 꼴) · 그 순간 한 번(이 기기 1번째) */
      await window.__home(); await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, source: 'confirm', confirmedAt: new Date().toISOString(), by: 'tester@x', orderCount: 2 }, { merge: true }); await W(900);
      o.afterHome = sh().length; /* 관련 화면이 아닌 홈에서는 기록이 들어와도 안 뜸 */ rkfxConfSoon(); const c1 = await wait(3000); o.conf = { L: c1.map((x) => x.per + ':' + x.occ).join(), txt: ((document.getElementById('rkfx') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 120), day: window.__day() }; close();
      /* 3) 관련 화면 — 주문·매출 탭(2번째 · 뜸) → 오늘 출고(상한 다 참 · 안 뜸) */ o.a1 = await place('otab'); o.a1n = window.__day(); o.a2 = await place('ship'); o.a2n = window.__day(); o.a3 = await place('otab'); /* 같은 화면 두 번째 */
      o.plA = Object.keys(rkfxPlSeen().p).sort().join();
      /* 4) 다른 기기 — 이 기기 저장만 비움 · 기기마다 다시 2번 */ window.__newDevice(); o.b1 = await place('ship'); o.b2 = await place('shipsales'); o.b3 = await place('head'); o.bn = window.__day();
      /* 5) 상한 3번(관리자 설정) — 세 번째 화면도 */ window.__newDevice(); S.app = { ...S.app, rankFx: { k: {}, cap: 3 } }; o.c = [await place('otab'), await place('head'), await place('ship'), await place('shipsales')]; o.cn = window.__day(); S.app = { ...S.app }; delete S.app.rankFx;
      /* 6) 클라우드가 확정한 날을 탭 기준으로 바꿔도(prevConfirm · confirmedAt 남음) 확정 처리로 봄 */ await db.collection('shp_days').doc(td).set({ source: 'tab', prevConfirm: { entries: window.__ents, confirmedAt: new Date().toISOString() } }, { merge: true }); await W(800); o.keep = !!rkConfAt();
      /* 7) 고친 날(edit) */ await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, source: 'edit' }); await W(800); o.edit = !!rkConfAt();
      /* 8) ▶ 끝까지가 끝남 — 탭만 읽힌 날 + 오늘 실행 문서 끝(진행 → 끝) · 이 기기에 적고 그 순간 한 번 */
      await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, tabEntries: window.__ents, source: 'tab', readAt: new Date().toISOString() }); await W(800); o.tabOnly = !!rkConfAt(); window.__newDevice();
      { const id = td.replace(/-/g, '') + '_7'; await db.collection('shp_runs').doc(id).set({ day: td, n: 7, status: 'run', ph: 'END', createdAt: new Date().toISOString() }); osWatch(id); await W(700); close(); await window.__home();
        await db.collection('shp_runs').doc(id).set({ status: 'done', doneAt: new Date().toISOString() }, { merge: true }); let L = []; for (let i = 0; i < 40 && !L.some((x) => x.occ === 'go'); i++) { await W(100); L = sh(); } o.end = { L: L.map((x) => x.per + ':' + x.occ).join(), conf: !!rkConfAt(), mark: !!localStorage.getItem('rn-rkfx-conf'), cur: rkfxCurPlace(), det: S.detail ? Object.keys(S.detail).join() : '', go: !!rkfxPlSeen().p.go }; close();
        await db.collection('shp_runs').doc(id).set({ status: 'stopped' }, { merge: true }); await W(300); }
      /* 9) 평일 — 오늘 카드에 기간 카드 없음 */ o.todayPer = rkfxTodayItems().map((x) => x.per).join(); o.occW = rkfxOccInfo('week'); o.occM = rkfxOccInfo('month');
      /* 10) 매출 금액 다시 보기 · 기간 아이콘 — 지난 일요일·10/31(토 · 달 마지막 날)·평일 */
      const sun = (() => { for (let i = 1; i <= 7; i++) { const d = bk(i); if (new Date(d + 'T12:00:00Z').getUTCDay() === 0) return d; } })(); o.sun = sun; const wkd = bk(1); /* 수요일 */ const moEnd = '2026-10-31';
      S.sec.o_shipday = true; try { localStorage.setItem('rn-sec', JSON.stringify(S.sec)); } catch (e) {} await window.__home(); uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(1200); close();
      const icOf = (d) => { const b = document.querySelector(`#sd_tbl [data-sdfx="${d}"]`); return b ? [...b.querySelectorAll('[data-sdfxp]')].map((x) => x.dataset.sdfxp).join() : null; };
      o.ic = { sun: icOf(sun), moEnd: icOf(moEnd), wkd: icOf(wkd), today: icOf(td) }; o.allIc = [...document.querySelectorAll('#sd_tbl [data-sdfxp]')].map((x) => x.closest('[data-sdfx]').dataset.sdfx + ':' + x.dataset.sdfxp);
      o.rp = {}; for (const [k, d] of [['sun', sun], ['moEnd', moEnd], ['wkd', wkd]]) o.rp[k] = rkfxReplayItems(d).map((x) => x.per + (x.I && x.I.open ? '(진행 중)' : '')).join();
      { const b = document.querySelector(`#sd_tbl [data-sdfx="${sun}"]`); if (b) { b.click(); await W(400); o.rpClick = sh().map((x) => x.per).join(); o.rpPl = ((S._rkfxP && S._rkfxP.dock[0]) || {}).it ? 1 : 0; await W(300); close(); } }
      o.rpWkTxt = (() => { const it = rkfxReplayItems(sun).find((x) => x.per === 'week'); return it ? it.I.pl : ''; })();
      /* 오늘(확정 처리 전) 다시 보기 — 하루 '지금까지' 안 넣음 */ await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, tabEntries: window.__ents, source: 'tab', readAt: new Date().toISOString() }); localStorage.removeItem('rn-rkfx-conf'); await W(800); o.rpTodayPre = rkfxReplayItems(td).map((x) => x.per).join(); o.rpTodayConf = !!rkConfAt();
      o.kd = rkfxKD(); o.dayKey = JSON.parse(localStorage.getItem('rn-rkfx-day') || '{}').d;
      /* 설명서·설정 */ const js = await (await fetch('readnow-webapp.js')).text(); o.wire = { goPress: !/rkfxOccSoon\('go', 900/.test(js), ship: /function openShipHome\(\)[^\n]*rkfxShipOpen\(\)/.test(js), btn: /await b2\.commit\(\); toast\(`출고 확정[^\n]*rkfxConfSoon\(\)/.test(js) };
      o.guide = !!(PAGE_GUIDES.salesRank.chapters.find((c) => c.id === 'fx') || { items: [] }).items.find((x) => x.id === 'per'); o.man = /축하·응원 띄우는 때 — 11\/05 저녁 고침/.test(js);
      } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); } window.__rkfxAuto = 0; window.__rkfxCapTest = 0; return o; });
    console.log('  A 자료:', JSON.stringify(r).slice(0, 2600));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.pre && r.pre.done && !r.pre.conf && Object.values(r.preFx).every((x) => x === '') && r.preGo === 0 && !r.preRec.pl && r.preRec.day === 0, '확정 처리 전(첫 송장이 배송&구매확정전 · 끝까지 누름) — 주문·매출 탭·머리·오늘 출고·출고별 매출 탭 어디서도 안 뜸 · 셈·기록 없음: ' + JSON.stringify([r.preFx, r.preGo, r.preRec]));
    ok(r.afterHome === 0 && /^day:conf/.test(r.conf.L) && r.conf.day === 1, '✅ 출고 확정 단추 — 그 순간 한 번(기기 1번째) · 관련 화면 아닌 홈에서는 기록만으로 안 뜸: ' + JSON.stringify(r.conf));
    ok(/^day:/.test(r.a1) && r.a1n === 2 && r.a2 === '' && r.a2n === 2 && r.a3 === '', '확정 뒤 주문·매출 탭 처음 = 뜸(2번째) · 오늘 출고 = 기기 상한 2번이 다 차 안 뜸 · 같은 화면 두 번째 안 뜸: ' + JSON.stringify([r.a1, r.a2, r.a3]));
    ok(/^day:/.test(r.b1) && /^day:/.test(r.b2) && r.b3 === '' && r.bn === 2, '다른 기기(이 기기 저장만 다름) — 다시 2번(오늘 출고 · 출고별 매출 탭) · 세 번째(머리)는 안 뜸: ' + JSON.stringify([r.b1, r.b2, r.b3, r.bn]));
    ok(r.c.slice(0, 3).every((x) => /^day:/.test(x)) && r.c[3] === '' && r.cn === 3, '⚙ 상한 3번이면 기기마다 세 화면: ' + JSON.stringify([r.c, r.cn]));
    ok(r.keep && r.edit && !r.tabOnly, '클라우드가 탭 기준으로 바꿔도(prevConfirm) 확정 처리 · 고친 날도 · 탭만 읽힌 날은 아님: ' + JSON.stringify([r.keep, r.edit, r.tabOnly]));
    ok(/^day:/.test(r.end.L) && r.end.go && r.end.conf && r.end.mark, '▶ 끝까지가 끝남(진행 → 끝) = 확정 처리 — 그 순간 뜸(그때 보던 관련 화면과 한 번으로) · 이 기기에 적음: ' + JSON.stringify(r.end));
    ok(uq(r.todayPer) === 'day' && !r.occW && !r.occM, '평일 — 오늘 카드에 주·월·년 카드 없음: ' + JSON.stringify([r.todayPer, r.occW, r.occM]));
    ok(r.ic.sun === 'week' && r.ic.moEnd === 'month' && r.ic.wkd === '' && r.ic.today === '' && r.allIc.every((x) => /:(week|month)$/.test(x)), '매출 금액 아이콘 — 일요일 줄 🗓만 · 10/31 줄 📆만 · 평일·오늘 줄 없음: ' + JSON.stringify([r.ic, r.allIc.slice(0, 8)]));
    ok(r.rp.sun === 'day,week' && /^day(,month)?$/.test(r.rp.moEnd) && r.rp.moEnd.includes('month') === true && r.rp.wkd === 'day' && !/진행 중/.test(JSON.stringify(r.rp)) && /한 주/.test(r.rpWkTxt), '다시 보기 — 일요일 = 하루+주간 · 10/31 = 하루+월간 · 평일 = 하루만 · 진행 중 \'지금까지\' 없음: ' + JSON.stringify([r.rp, r.rpWkTxt]));
    ok(r.rpClick === 'day,week', '일요일 줄 🔁 다시 보기 누름 → 하루·주간 두 장 이어 보이기: ' + r.rpClick);
    ok(r.rpTodayPre === '' && !r.rpTodayConf, '오늘(확정 처리 전) 다시 보기 — 하루 \'지금까지\' 카드 안 넣음: ' + JSON.stringify(r.rpTodayPre));
    ok(r.kd === '2026-11-05' && r.dayKey === '2026-11-05', '기기 횟수는 한국 날짜로 셈: ' + JSON.stringify([r.kd, r.dayKey]));
    ok(r.wire.goPress && r.wire.ship && r.wire.btn, '연결 — 끝까지 누르는 순간 축하 지움 · openShipHome · 출고 확정 단추 뒤: ' + JSON.stringify(r.wire));
    ok(r.guide && r.man, '📖 화면 설명서(주·월·년 마지막 날) · ❓ 설명서 글'); ran++;
  });
  // ━━ B. 일요일(11/08) · 그 달 마지막 날(11/30 월) · 12/31(목 — 달·해) · 토요일(11/07) — 오늘 카드의 기간
  for (const [nm, at, want] of [['일요일 11/08', '2026-11-08T17:00:00+09:00', 'day,week'], ['달 마지막 날 11/30(월)', '2026-11-30T17:00:00+09:00', 'day,month'], ['12/31(목)', '2026-12-31T17:00:00+09:00', 'day,month,year'], ['토요일 11/07', '2026-11-07T17:00:00+09:00', 'day'], ['2/28 평년 달 마지막 날(일)', '2027-02-28T17:00:00+09:00', 'day,week,month']]) {
    await H(async (p) => { await p.clock.setFixedTime(new Date(at)); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await prep(p);
      const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { const td = dstr(new Date()); o.td = td;
        { const Y = +td.slice(0, 4); window.__sale(`${Y - 1}-06-15`, 40000); window.__sale(`${Y - 2}-06-15`, 30000); S.ver = (S.ver || 0) + 1; S._sdm = null; } /* 지난해·그 전해 — 연간 견줌 */
        await db.collection('shp_days').doc(td).set({ day: td, entries: window.__ents, source: 'tab', readAt: new Date().toISOString() }); await W(800); o.pre = rkConfAt() ? 'conf' : ''; o.prePl = rkfxPlace('conf'); o.preRp = rkfxReplayItems(td).map((x) => x.per).join(); o.preOcc = ['week', 'month', 'year'].map((x) => !!rkfxOccInfo(x)).join();
        await db.collection('shp_days').doc(td).set({ source: 'confirm', confirmedAt: new Date().toISOString() }, { merge: true }); await W(800);
        o.post = rkfxTodayItems().map((x) => x.per + (x.I && x.I.open ? '(진행 중)' : '')).join(); o.rp = rkfxReplayItems(td).map((x) => x.per).join(); o.yBars = ((rkfxTodayItems().find((x) => x.per === 'year') || {}).I || {}).bars;
        rkfxConfSoon(); const L = await window.__wait(3000); o.shown = L.map((x) => x.per).join(); o.n = window.__day(); window.__close();
        o.pl = (rkfxTodayItems().find((x) => x.per === 'week') || rkfxTodayItems().find((x) => x.per === 'month') || { I: {} }).I.pl || '';
      } catch (e) { o.err = e.message; } window.__rkfxAuto = 0; window.__rkfxCapTest = 0; return o; });
      ok(!r.err && r.pre === '' && r.prePl === false && r.preRp === '' && r.preOcc === 'false,false,false', `${nm} — 확정 처리 전: 오늘·기간 카드 없음 ` + JSON.stringify([r.td, r.pre, r.preRp, r.err]));
      ok(uq(r.post) === want && uq(r.rp) === want && uq(r.shown) === want && r.n === 1 && !/지금까지/.test(r.pl), `${nm} — 확정 처리 뒤 ${want} (다시 보기도 같음 · 여러 장 한 번으로 셈 · '지금까지' 아님): ` + JSON.stringify([r.td, r.post, r.rp, r.shown, r.n, r.pl]));
      if (want.includes('year')) ok(Array.isArray(r.yBars) && r.yBars.length === 12, '12/31 — 연간 카드(한 해 돌아보기 달별 막대 12)');
      ran++; });
  }
  // ━━ C. 한국 날짜 — 브라우저가 UTC여도 한국 00:30이면 새 날
  await H(async (p) => { await p.clock.setFixedTime(new Date('2026-11-05T15:30:00Z')); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { try { localStorage.setItem('rn-rkfx-day', JSON.stringify({ d: '2026-11-05', n: 2 })); localStorage.setItem('rn-rkfx-pl', JSON.stringify({ d: '2026-11-05', p: { otab: 'x', ship: 'x' } })); } catch (e) {} window.__rkfxCapTest = 1; const o = { kd: rkfxKD(), left: rkfxCapLeft(), pl: Object.keys(rkfxPlSeen().p).length }; window.__rkfxCapTest = 0; return o; });
    ok(r.kd === '2026-11-06' && r.left === true && r.pl === 0, '한국 11/06 00:30(UTC 11/05 15:30) — 어제 셈·화면 기록은 지나가고 새로 2번: ' + JSON.stringify(r)); ran++; });
  // ━━ D. 여러 장 줄 — 앉은 카드 글씨 크기 · 1400px · 360px(휴대폰)
  for (const [nm, vp] of [['넓은 화면 1400px', { width: 1400, height: 900 }], ['휴대폰 360px', { width: 360, height: 740 }]]) {
    await H(async (p) => { await p.waitForTimeout(300);
      const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; S.app = { ...(S.app || {}), rankFx: { k: {}, seq: 1 } }; rkfxSeqSample(); for (let i = 0; i < 250 && !(S._rkfxP && S._rkfxP.dock.length === 4 && !S._rkfx); i++) await W(100); await W(1400);
        const P = S._rkfxP; if (!P) return { err: 'no row' }; const vw = document.documentElement.clientWidth;
        o.cards = P.dock.slice().sort((a, b) => a.slot - b.slot).map((d) => { const b = d.w.getBoundingClientRect(); const fs = (sel) => { const x = d.w.querySelector(sel); return x ? Math.round(parseFloat(getComputedStyle(x).fontSize) * d.s * 10) / 10 : 0; }; return { per: d.it.per, s: Math.round(d.s * 100) / 100, l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), h: fs('.rkfx-h'), amt: fs('.rkfx-amt'), num: fs('.rkfx-num'), m: fs('.rkfx-m'), rk: fs('.rkfx-r') }; });
        o.vw = vw; o.ov = document.documentElement.scrollWidth - vw; o.rows = P.row.dataset.rows; o.cols = P.row.dataset.cols; o.scroll = P.row.classList.contains('scroll'); o.rowOvX = P.row.scrollWidth - P.row.clientWidth;
        const B = o.cards; o.overlap = B.some((a, i) => B.some((b, j) => j > i && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1));
        S._rkfxP.row.scrollTop = 9999; await W(100); o.lastVis = (() => { const d = P.dock.slice().sort((a, b) => b.slot - a.slot)[0]; const b = d.w.getBoundingClientRect(); return b.bottom <= innerHeight + 2; })();
        document.querySelector('.rkfx-mc').click(); await W(100); o.gone = !S._rkfxP && !document.getElementById('rkfx_row'); return o; });
      console.log(`  D ${nm}:`, JSON.stringify(r).slice(0, 900));
      const C = r.cards || [];
      ok(C.length === 4 && C.map((x) => x.per).join() === 'day,week,month,year' && C.every((x) => x.s >= 0.5) && C.every((x) => x.h >= 11.5 && x.num >= 14 && x.m >= 9 && x.rk >= 9), `${nm} — 앉은 카드 원래의 0.5배 이상(${C.map((x) => x.s).join('/')}) · 큰 글 ${C.map((x) => x.h).join('/')}px · 매출 숫자 ${C.map((x) => x.num).join('/')}px · 순위 ${C.map((x) => x.rk).join('/')}px · 말 ${C.map((x) => x.m).join('/')}px (예전 한 줄 180px 칸: 넓은 화면 0.33~0.45배 · 휴대폰 약 0.24배)`);
      ok(!r.overlap && C.every((x) => x.l >= 0 && x.r <= r.vw) && r.ov <= 0 && r.rowOvX <= 0, `${nm} — 겹침·가로 넘침 없음(${r.rows}줄 × ${r.cols}칸${r.scroll ? ' · 위아래로 밀어 봄' : ''}): ` + JSON.stringify(C.map((x) => [x.l, x.r, x.t, x.b])));
      if (vp.width < 500) ok(r.cols === '1' && r.scroll && r.lastVis, '휴대폰 — 한 줄에 한 장 · 화면보다 길면 밀어서 마지막 카드까지 봄');
      ok(r.gone, `${nm} — 하나를 누르면 모두 닫힘`); ran++;
    }, { vp });
  }
  ok(ran === 9, `시험 칸 아홉이 끝까지 돎(${ran}/9)`);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tFX5 모두 통과'); process.exit(bad ? 1 : 0);
})();
