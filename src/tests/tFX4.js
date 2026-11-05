// tFX4 — 정범님 11/05 15시 '출고별 매출이 확정되었는데도 축하/응원이 나오지 않고 원스탑 처리 단추 때도 나오지 않아 · 출고별 매출 칸에 관련 정보가 나열되지 않아 · 출고별 매출을 누를 때도'
//  + '출고별 매출 섹션 일별 줄에서 매출 금액을 누르면 축하·응원이 여러 개일 때 차례대로 보여주는 방식을 그대로 재연'
//  실제와 같은 조건으로 돌림 — 자동 시험 브라우저 우회를 끔(window.__rkfxAuto = 1 · __rkfxCapTest = 1 · __rkfxNoCap 없음) · 축하 설정은 저장된 것 없음(기본값)
//    · 발송 요청에 송장 전 주문 3건 + 주문확인요청에 오후 새 주문 1건(실제 확정 순간 모습) · 하루 상한(기본 2)은 하루 첫 열기 등으로 이미 다 씀
//    · 확정은 shp_days 문서를 실제로 써서(Firestore 스냅숏 → loadShipDays) 들어오게 함
//  ① 확정 순간(저절로 · 상한 남음) ② 상한이 다 찼을 때 저절로는 안 뜨되 '띄운 기록'을 쓰지 않음 ③ ✅ 출고 확정 단추 뒤(사람이 누름 · 상한 밖)
//  ④ ▶ 끝까지 누름(상한 밖) · 끝까지 끝(shp_runs 진행 → 끝) ⑤ 출고별 매출 머리 누름(펼쳐 둔 채 기억된 기기 — 누르면 접힘) · 기록 갱신 뒤 첫 누름 · 오늘 출고 › 💰 출고별 매출 탭
//  ⑥ 오늘 출고로 들어갈 때(출고 카드 · 홈 바로가기 같은 openShipHome) ⑦ 출고별 매출 표 🏆 칸 — 줄마다 순위·아이콘(오늘 줄 포함)
//  ⑧ 매출 금액 누르기 → 그날 하루·주간·월간 카드 여러 장 이어 보이기(상한·띄운 기록과 상관없음 · 날짜 줄 화면은 안 열림)
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tFX4.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
const shownSrc = () => { const L = []; const P = S._rkfxP; const st = S._rkfx; const one = (it) => it && L.push({ occ: it.occ, kind: it.kind, per: it.per || rkfxPerOf(it), id: it.id }); if (P) { one(P.cur); P.q.forEach(one); P.dock.forEach((d) => one(d.it)); } else if (st && st.item) one(st.item); else if (st && st.el) L.push({ occ: st.el.dataset.occ || '', kind: st.el.dataset.kind, per: 'day' }); return L; };
(async () => {
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(800);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const shown = (0, eval)('(' + src + ')'); const o = {}; try {
      const td = dstr(new Date()); const bk = (n) => rkBack(td, n); const kd = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
      ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-sd-cols', 'rn-rkfx-day'].forEach((x) => { try { localStorage.removeItem(x); } catch (e) {} });
      /* 실제와 같은 조건 — 시험 우회 끔 · 설정 기본값(저장된 rankFx 없음) */ window.__rkfxAuto = 1; window.__rkfxCapTest = 1; window.__rkfxNoCap = 0; S.app = { ...(S.app || {}) }; delete S.app.rankFx; S._rkfxMg = 1;
      /* 지난 70일 주문(알라딘 발송일 · 주문 기록) — 실제 수집기 시각 모양 'YYYY-MM-DDTHH:MM' */
      S.orders = new Map(); let k = 0; const sale = (d, price, at) => { k++; const id = 'aladin_Q' + k; S.orders.set(id, { id, orderNo: 'Q' + k, kind: 'sale', platform: 'aladin', orderedAt: d + 'T' + (at || '10:20'), shippedAt: d + 'T16:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
      for (let i = 1; i <= 70; i++) sale(bk(i), 20000 + ((i * 7919) % 31) * 1000);
      /* 오늘 주문 3건 — 아직 송장 전(발송 요청) · 주문 기록은 있음(발송일 없음) */ const T = [['T1', 300000], ['T2', 150000], ['T3', 90000]]; T.forEach(([no, pr]) => S.orders.set('aladin_' + no, { id: 'aladin_' + no, orderNo: no, kind: 'sale', platform: 'aladin', orderedAt: td + 'T09:30', buyer: { name: '손님A' }, items: [{ title: '오늘 책 ' + no, price: pr, qty: 1, lineStatus: 'normal' }] }));
      S.ship = { orders: T.map(([no, pr]) => ({ orderNo: no, buyer: '손님A', orderedAt: td + ' 09:30', recipient: { name: '손님A' }, items: [{ listingId: '9' + no.slice(1), title: '오늘 책 ' + no, price: pr, qty: 1, grade: '상' }] })), tabCounts: {}, at: new Date().toISOString() };
      S.shipC = { orders: [{ orderNo: 'N1', buyer: '손님A', orderedAt: td + ' 15:10', recipient: { name: '손님A' }, items: [{ listingId: '9100', title: '오후 새 주문', price: 12000, qty: 1, grade: '상' }] }], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S._shipRowsC = null;
      /* 출고 목록은 실제처럼 Firestore(shp_state)에도 — 다른 쓰기로 스냅숏이 다시 와도 그대로 */ await db.collection('shp_state').doc('current').set(S.ship); await db.collection('shp_state').doc('confirm').set(S.shipC); await W(400); S._shipRowsC = null;
      S.ordersLoaded = true; S._allLoaded = true; S.shipDayN = 80; S.ver = (S.ver || 0) + 1; S._sdm = null;
      loadShipDays(); for (let i = 0; i < 20 && !S.shpDaysV; i++) await W(100);
      const close = () => { try { rkfxPClose(); } catch (e) {} try { rankFxClose(1); } catch (e) {} };
      const waitFx = async (ms) => { for (let i = 0; i < ms / 100; i++) { if (shown().length) return shown(); await W(100); } return shown(); };
      /* 확정 전 */ const t0 = rankToday(); o.before = { conf: t0.conf, done: t0.done, left: t0.left };
      /* ② 상한이 다 참(하루 첫 열기 + 다른 것으로 2번) — 확정이 들어와도 저절로는 안 뜨고, 띄운 기록도 그대로 비어 있어야 함 */
      localStorage.setItem('rn-rkfx-day', JSON.stringify({ d: kd, n: 2 }));
      const ents = T.map(([no]) => ({ id: 'aladin_' + no, orderNo: no, ex: [] }));
      await db.collection('shp_days').doc(td).set({ day: td, entries: ents, source: 'confirm', confirmedAt: new Date().toISOString(), by: 'tester@x', orderCount: 3 }, { merge: true }); await W(1500);
      const t1 = rankToday(); o.after = { conf: t1.conf, done: t1.done, left: t1.left, kind: t1.kind, rank: t1.rank }; o.capFull = { fx: shown().length, seen: localStorage.getItem('rn-rkfx-seen') };
      /* ③ ✅ 출고 확정 단추 뒤 — 사람이 누름(상한 밖) */ rkfxConfSoon(); const c1 = await waitFx(3000); o.btn = { L: c1, txt: (document.getElementById('rkfx') || {}).innerText || '' }; o.btnSeen = !!localStorage.getItem('rn-rkfx-seen'); close(); await W(200);
      /* ① 저절로(상한 남음) — 띄운 기록을 지우고 다시 확정 기록이 들어옴 */ localStorage.removeItem('rn-rkfx-seen'); localStorage.setItem('rn-rkfx-day', JSON.stringify({ d: kd, n: 1 }));
      await db.collection('shp_days').doc(td).set({ readAt: new Date().toISOString() }, { merge: true }); const c2 = await waitFx(2500); o.auto = { L: c2, day: JSON.parse(localStorage.getItem('rn-rkfx-day') || '{}').n }; close(); await W(200);
      /* ⑦ 출고별 매출 표 🏆 칸 */ S.sec.o_shipday = true; try { localStorage.setItem('rn-sec', JSON.stringify(S.sec)); } catch (e) {} if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await W(150); await W(300);
      { const rows = [...document.querySelectorAll('#sd_tbl tbody tr[data-sday]')]; const ci = [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).indexOf('rk');
        const R = rows.map((tr) => { const c = tr.children[ci]; return { d: tr.dataset.sday, ic: c ? c.querySelectorAll('.rkic').length : 0, t: c ? c.innerText.trim() : '' }; }); const past = R.filter((x) => x.d <= td);
        o.tbl = { n: past.length, withIc: past.filter((x) => x.ic > 0).length, today: past.find((x) => x.d === td), sample: past.slice(0, 3) }; }
      /* ⑧ 매출 금액 누르기 — 상한 다 참 · 그날 하루·주간·월간 여러 장 */ localStorage.setItem('rn-rkfx-day', JSON.stringify({ d: kd, n: 9 })); const seen0 = localStorage.getItem('rn-rkfx-seen-o');
      { const d8 = bk(3); const b = document.querySelector(`#sd_tbl [data-sdfx="${d8}"]`); o.rp0 = { has: !!b, det: null }; if (b) { b.click(); await W(400); const P = S._rkfxP; o.rp = { seq: !!P, L: shown(), det: S.detail ? Object.keys(S.detail).join() : '', seenSame: localStorage.getItem('rn-rkfx-seen-o') === seen0, want: rkfxReplayItems(d8).map((x) => x.per + ':' + x.kind) }; await W(9000); o.rp.dock = S._rkfxP ? S._rkfxP.dock.length : -1; o.rp.row = !!document.getElementById('rkfx_row'); close(); await W(300); } }
      { const b = document.querySelector(`#sd_tbl [data-sdfx="${td}"]`); if (b) { b.click(); await W(300); o.rpT = shown(); close(); await W(200); } }
      /* ⑤ 출고별 매출 머리 — 펼쳐 둔 채 기억(누르면 접힘)인데도 뜸 · 같은 날 두 번째는 안 뜸 · 기록 갱신 뒤 첫 누름 */
      { const head = async () => { close(); document.getElementById('sdbar').click(); const L = await waitFx(1800); close(); await W(200); return L; };
        o.h1 = { open0: !!S.sec.o_shipday, L: await head() }; o.h2 = await head();
        const hd = JSON.parse(localStorage.getItem('rn-rkfx-hd') || '{}'); if (hd.h && hd.h.day) { hd.h.day.top = bk(60); localStorage.setItem('rn-rkfx-hd', JSON.stringify(hd)); } o.h3 = await head(); o.h4 = await head(); }
      /* 💰 오늘 출고 › 출고별 매출 탭 — 오늘 처음(머리와 같은 기록 · 지움) */ { const a = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete a.tab; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(a)); S.shipTab = 'sales'; S._rkSsIn = 0; await openShip(); const L = await waitFx(2000); o.salesTab = L; close(); if (document.getElementById('sheet').classList.contains('on')) { history.back(); await W(400); } }
      /* ⑥ 오늘 출고로 들어갈 때 — openShipHome(출고 카드·홈 바로가기·기능 찾기 공통) · 두 번째는 안 뜸 */
      { const go = async () => { close(); openShipHome(); const L = await waitFx(2200); close(); if (document.getElementById('sheet').classList.contains('on')) { history.back(); await W(400); } return L; }; o.s1 = await go(); o.s2 = await go(); }
      /* ④ ▶ 끝까지 누름 — 상한이 다 차도(사람이 누름) · 끝까지 끝(진행 → 끝 · 그 실행에 한 번) */
      { const a = JSON.parse(localStorage.getItem('rn-rkfx-seen-o') || '{}'); delete a.go; localStorage.setItem('rn-rkfx-seen-o', JSON.stringify(a)); close(); rkfxOccSoon('go', 0, { manual: 1 }); o.go1 = await waitFx(1500); close(); await W(200); o.goAuto = rkfxOcc('go'); }
      { const id = td.replace(/-/g, '') + '_9'; await db.collection('shp_runs').doc(id).set({ day: td, n: 9, status: 'run', ph: 'END', createdAt: new Date().toISOString() }); osWatch(id); await W(700); close();
        await db.collection('shp_runs').doc(id).set({ status: 'done', doneAt: new Date().toISOString() }, { merge: true }); o.end1 = await waitFx(3500); close(); await W(200);
        await db.collection('shp_runs').doc(id).set({ status: 'run' }, { merge: true }); await W(500); await db.collection('shp_runs').doc(id).set({ status: 'done' }, { merge: true }); o.end2 = await waitFx(2500); close(); }
      /* 연결 확인 — 단추·끝까지 누름 자리의 코드 */ { const js = await (await fetch('readnow-webapp.js')).text(); o.wire = { ok: /await b2\.commit\(\); toast\(`출고 확정[^\n]*rkfxConfSoon\(\)/.test(js), go: /rkfxOccSoon\('go', 900, \{ manual: 1 \}\)/.test(js), home: /function openShipHome\(\)[^\n]*rkfxShipOpen\(\)/.test(js) }; }
      const js0 = await (await fetch('readnow-webapp.js')).text(); o.feat = featFind('매출 금액 눌러 다시 보기').length > 0; o.guide = !!(PAGE_GUIDES.salesRank.chapters.find((c) => c.id === 'fx') || { items: [] }).items.find((x) => x.id === 'replay'); o.man = /매출 금액 눌러 다시 보기 · 실제로 뜨는 때/.test(js0);
      window.__rkfxAuto = 0; window.__rkfxCapTest = 0; return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 400); return o; } }, shownSrc.toString());
    console.log('  자료:', JSON.stringify(r).slice(0, 2500));
    const occ = (L, x) => (L || []).some((y) => y.occ === x);
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.before && !r.before.conf && !r.before.done && r.before.left >= 4, `확정 전 — 오늘 할 일(발송 요청 송장 전 3 + 주문확인요청 오후 새 주문 1 = ${r.before && r.before.left}건)이 있는 실제 모습`);
    ok(r.after && r.after.conf && r.after.done && r.after.left >= 4 && r.after.kind, `출고 확정(shp_days source confirm)이 들어오면 할 일이 남아 있어도 확정(예전엔 left 0이어야 해서 실제로는 안 됨): ` + JSON.stringify(r.after));
    ok(r.capFull && r.capFull.fx === 0 && !r.capFull.seen, '하루 상한이 다 차면 저절로는 안 뜨되 띄운 기록(rn-rkfx-seen)을 쓰지 않음 — 그날 기회가 사라지지 않음: ' + JSON.stringify(r.capFull));
    ok(occ(r.btn.L, 'conf') && /오늘 출고 확정되는 순간/.test(r.btn.txt) && r.btnSeen, '✅ 출고 확정 단추 뒤 — 상한이 다 차도 뜸(사람이 누름): ' + r.btn.txt.replace(/\s+/g, ' ').slice(0, 90));
    ok(occ(r.auto.L, 'conf') && r.auto.day === 2, '확정 기록이 들어온 순간 저절로(어느 화면이든 · 상한 남음) — 상한 한 번 셈: ' + JSON.stringify(r.auto));
    ok(r.tbl && r.tbl.n >= 60 && r.tbl.withIc === r.tbl.n && r.tbl.today && r.tbl.today.ic > 0 && !/…/.test(r.tbl.today.t), `출고별 매출 표 🏆 칸 — 지난날·오늘 모든 줄(${r.tbl && r.tbl.withIc}/${r.tbl && r.tbl.n})에 순위·아이콘 · 오늘 줄도 확정되어 보임: ` + JSON.stringify(r.tbl && [r.tbl.today, r.tbl.sample]));
    ok(r.rp0.has && r.rp && r.rp.seq && r.rp.L.length >= 3 && r.rp.L[0].per === 'day' && r.rp.L.some((x) => x.per === 'week') && r.rp.L.some((x) => x.per === 'month') && r.rp.det === '' && r.rp.seenSame, '매출 금액 누름 → 그날 하루·주간·월간 카드 여러 장 이어 보이기(상한 다 차도 · 띄운 기록 그대로 · 날짜 줄 화면은 안 열림): ' + JSON.stringify(r.rp && [r.rp.L.map((x) => x.per + ':' + x.kind), r.rp.want, r.rp.det]));
    ok(r.rp && r.rp.dock >= 2 && r.rp.row, '차례대로 크게 → 위쪽 한 줄 자리로 앉음(이어 보이기 그대로): dock ' + (r.rp && r.rp.dock));
    ok((r.rpT || []).length >= 1 && r.rpT[0].per === 'day', '오늘 줄 매출 금액도 다시 보기: ' + JSON.stringify(r.rpT));
    ok(r.h1.open0 && occ(r.h1.L, 'tab') && !(r.h2 || []).length, '출고별 매출 머리 — 펼쳐 둔 채 기억된 기기에서 눌러도(접힘) 오늘 처음이면 뜸 · 두 번째는 안 뜸: ' + JSON.stringify([r.h1, r.h2]));
    ok(occ(r.h3, 'rec') && !(r.h4 || []).length, '🔁 기록 갱신(1위 주인이 바뀜) 뒤 첫 누름에 뜸 · 그다음은 안 뜸: ' + JSON.stringify([r.h3, r.h4]));
    ok(occ(r.salesTab, 'tab'), '오늘 출고 › 💰 출고별 매출 탭으로 들어갈 때도(오늘 처음): ' + JSON.stringify(r.salesTab));
    ok(occ(r.s1, 'ship') && !(r.s2 || []).length, '오늘 출고로 들어갈 때(openShipHome — 출고 카드·홈 바로가기 공통) 오늘 처음 뜸 · 두 번째는 안 뜸: ' + JSON.stringify([r.s1, r.s2]));
    ok(occ(r.go1, 'go') && r.goAuto === false, '▶ 끝까지 누름 — 하루 상한이 다 차도 뜸(사람이 누름 · 저절로 부른 것은 상한에 막힘): ' + JSON.stringify([r.go1, r.goAuto]));
    ok(occ(r.end1, 'go') && !(r.end2 || []).length, '▶ 끝까지가 끝난 순간(진행 → 끝) 뜸 · 같은 실행은 한 번: ' + JSON.stringify([r.end1, r.end2]));
    ok(r.wire && r.wire.ok && r.wire.go && r.wire.home, '연결 — 출고 확정 단추 뒤 · 끝까지 누름(사람) · openShipHome: ' + JSON.stringify(r.wire));
    ok(r.feat && r.guide && r.man, '🔍 기능 찾기 · 📖 화면 설명서(replay) · ❓ 설명서 글: ' + JSON.stringify([r.feat, r.guide, r.man]));
  });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tFX4 모두 통과'); process.exit(bad ? 1 : 0);
})();
