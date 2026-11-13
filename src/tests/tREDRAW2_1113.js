// tREDRAW2_1113 — 정범님 11/13 14:57 '휴대폰 출고 화면 30초 6~12번 다시 그리기' · redraw1 보고의 위험 없는 고침 셋 (redraw2)
//  ① (제안 5) 자동 판단 설정 문서(app_settings/ship_auto)에 살아 있음 칸만 바뀌면 출고 화면을 다시 그리지 않음 · 설정이 바뀌면 다시 그림
//  ② (제안 5) 새 신호 문서(app_settings/ship_auto_beat)와 옛 문서를 둘 다 읽고 더 새 신호를 씀(판이 섞여도) · 같은 상태의 신호는 다시 그리지 않음 · 남긴 기기가 바뀌면 다시 그림
//  ③ (제안 4) 휴대폰: 예스24 주문 소식·상품 보강(soft)은 1.5초 묶음(shipRedrawSoon) · 사람이 누른 뒤(hard)는 예전처럼 바로 · PC는 soft도 예전처럼 바로
//  ④ (제안 3) 출고 열기 측정: 받기 함수 감쌈 · 그때 돌던 받기는 longSync·syncBy로 따로 · 겹친 4초 창은 앞 창에 이어 셈(같은 긴 작업을 두 번 세지 않음)
//  ⑤ 출고 화면은 그대로 그려짐(카드 수 같음)
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tREDRAW2_1113.js
const H = require('./harness.js');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const seed = () => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const FS = (window.__FS = window.__FS || {});
  const it = (lid, t, pr) => ({ listingId: lid, title: t, price: pr, qty: 1, grade: '상', sku: 'BLKAAA_ms' });
  FS.shp_state = { confirm: { orders: [{ orderNo: 'C-1', buyer: '손님A', orderedAt: '2026-11-13 09:10', items: [it('L1', '첫 책', 5000)] }, { orderNo: 'C-2', buyer: '손님B', orderedAt: '2026-11-13 09:11', items: [it('L2', '둘째 책', 5100)] }], at: iso(now), sig: 's1' },
    current: { orders: [{ orderNo: 'D-1', buyer: '손님C', orderedAt: '2026-11-12 09:00', items: [it('L9', '셋째 책', 6000)] }], at: iso(now), tabCounts: {}, sig: 'c1' } };
  FS.app_settings = { ...(FS.app_settings || {}), ship_auto: { on: true, cheapPct: 25, since: iso(now - 3600e3), beatAt: iso(now - 30 * 60e3), beatBy: 'JS-MAIN', beats: { 'JS-MAIN': iso(now - 30 * 60e3) } } };
  try { localStorage.setItem('rn-ship-view', 'order'); localStorage.removeItem('rn-shipwhy'); localStorage.removeItem('rn-dperf'); } catch (e) {} };
(async () => {
  await H(async (p) => {
    await p.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }); });
    await p.addInitScript(seed);
    await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html?go=confirm'); await p.waitForTimeout(5000);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = () => document.getElementById('sheet'); const iso = () => new Date().toISOString();
      o.open = !!(S.detail && S.detail.ship); o.phone = IS_PHONE; o.cards0 = sh().querySelectorAll('[data-anc]').length;
      const reN = () => window.__rnShipWhy.ev.filter((x) => /^shipRerender</.test(x[1])).length;
      const delta = async (fn) => { const a = reN(); await fn(); await W(700); return reN() - a; };
      // 견줄 기준: 아무 상관 없는 문서 쓰기(가짜 Firestore는 쓰기마다 모든 듣기를 부름)
      o.base = await delta(() => db.collection('app_settings').doc('zz_none').set({ x: Math.random() }, { merge: true }));
      // ① 옛 판 PC가 설정 문서에 살아 있음 칸만 씀(판이 섞인 동안)
      o.oldBeat = await delta(() => db.collection('app_settings').doc('ship_auto').set({ beatAt: iso(), beatBy: 'JS-MAIN', beats: { 'JS-MAIN': iso() } }, { merge: true }));
      o.oldBeat2 = await delta(() => db.collection('app_settings').doc('ship_auto').set({ beatAt: iso(), beatBy: 'JS-MAIN', beats: { 'JS-MAIN': iso() } }, { merge: true }));
      o.sbOld = sauBeat();
      // 설정이 바뀌면 다시 그림
      o.cfgChg = await delta(() => db.collection('app_settings').doc('ship_auto').set({ cheapPct: 30, editedAt: iso() }, { merge: true }));
      o.cfgVal = (S.shipAutoCfg || {}).cheapPct;
      // ② 새 신호 문서 — 옛 문서보다 새 신호
      await W(30); o.newBy = await delta(() => db.collection('app_settings').doc('ship_auto_beat').set({ beatAt: iso(), beatBy: 'MJ-MAIN', beatVer: '1.89.323', beats: { 'MJ-MAIN': iso() } }, { merge: true }));
      o.sbNew = sauBeat();
      o.newSame = await delta(() => db.collection('app_settings').doc('ship_auto_beat').set({ beatAt: iso(), beatBy: 'MJ-MAIN', beats: { 'MJ-MAIN': iso() } }, { merge: true }));
      // 옛 문서가 더 새면 옛 문서 신호(옛 판 PC가 지금 판단 중)
      await W(30); await db.collection('app_settings').doc('ship_auto').set({ beatAt: iso(), beatBy: 'HOME', beats: { HOME: iso() } }, { merge: true }); await W(400); o.sbMix = sauBeat();
      o.setHtml = /판단 신호/.test(shipAutoSetHtml()) && shipAutoSetHtml().includes(esc(sauWho('HOME')));
      // ③ 예스24 다시 그리기 — 휴대폰
      const oK = window.shipRedrawKeep, oS = window.shipRedrawSoon; const cnt = { k: 0, s: 0 }; window.shipRedrawKeep = function () { cnt.k++; }; window.shipRedrawSoon = function () { cnt.s++; };
      try { y24oRedraw(true); await W(650); o.y24soft = { ...cnt }; cnt.k = 0; cnt.s = 0; y24oRedraw(); await W(650); o.y24hard = { ...cnt }; cnt.k = 0; cnt.s = 0; y24oRedraw(true); y24oRedraw(); await W(650); o.y24mix = { ...cnt }; } finally { window.shipRedrawKeep = oK; window.shipRedrawSoon = oS; }
      // ④ 출고 열기 측정 — 받기 감쌈 · 받기 중 · 이어 세기
      o.bzWrapped = ['syncCustomers', 'syncOrders', 'syncSellersNow', 'syncCollNow'].every((n) => window[n] && window[n].__rnBz);
      const n0 = (window.__rnBZ || []).length; try { await window.syncCollNow('zz_test_coll', null, new Map(), 'zz', 'zz', () => {}); } catch (e) {} o.bzRec = (window.__rnBZ || []).length > n0 && (window.__rnBZ || []).slice(-1)[0][2] != null;
      await W(4500); const P0 = Object.keys((window.__FS || {}).perf_logs || {}).length;
      const fake = ['syncCustomers', Math.round(performance.now()), null]; window.__rnBZ.push(fake);
      openShip(S.shipTab || 'confirm'); await W(300); openShip(S.shipTab || 'confirm'); await W(200);
      { const t = performance.now(); while (performance.now() - t < 1300) {} } fake[2] = Math.round(performance.now()); await W(5500);
      const L = Object.values((window.__FS || {}).perf_logs || {}).slice(P0).filter((x) => x && x.kind === 'detail' && x.fn === 'openShip'); o.recN = L.length; o.rec = L[0] ? { longSum: L[0].longSum, longSync: L[0].longSync, longOwn: L[0].longOwn, syncBy: L[0].syncBy, longBy: L[0].longBy } : null;
      o.cards1 = sh().querySelectorAll('[data-anc]').length; return o; });
    console.log(JSON.stringify(R, null, 1));
    ok(R.open && R.phone, '휴대폰 출고 화면(?go=confirm · 390px)으로 열림');
    ok(R.oldBeat - R.base <= 0 && R.oldBeat2 - R.base <= 0, `① 설정 문서에 살아 있음 칸만 바뀌면 다시 그리지 않음 (기준 ${R.base} · 신호 ${R.oldBeat}·${R.oldBeat2})`);
    ok(R.cfgChg - R.base >= 1 && R.cfgVal === 30, `① 설정(cheapPct)이 바뀌면 다시 그림 (기준 ${R.base} · 설정 ${R.cfgChg})`);
    ok(R.sbOld && R.sbOld.beatBy === 'JS-MAIN' && R.sbOld.src === 'cfg', '② 새 문서가 없으면 옛 문서 신호를 씀');
    ok(R.sbNew && R.sbNew.beatBy === 'MJ-MAIN' && R.sbNew.src === 'beat' && R.newBy - R.base >= 1, `② 새 신호 문서가 더 새면 그것을 씀 · 남긴 기기가 바뀌면 다시 그림 (${R.newBy})`);
    ok(R.newSame - R.base <= 0, `② 같은 상태(10분 안 · 같은 기기)의 새 신호는 다시 그리지 않음 (기준 ${R.base} · ${R.newSame})`);
    ok(R.sbMix && R.sbMix.beatBy === 'HOME' && R.sbMix.src === 'cfg' && R.sbMix.beats && R.sbMix.beats['MJ-MAIN'] && R.sbMix.beats.HOME, '② 판이 섞여 옛 문서가 더 새면 옛 문서 신호 · 기기별 신호는 두 문서를 합침');
    ok(R.setHtml, '② ⚙ 🤖 자동 발송요청 칸의 \'판단 신호\'가 합친 신호(HOME)를 보임');
    ok(R.y24soft.s === 1 && R.y24soft.k === 0, `③ 휴대폰 예스24 소식(soft)은 1.5초 묶음으로 (${JSON.stringify(R.y24soft)})`);
    ok(R.y24hard.k === 1 && R.y24hard.s === 0, `③ 사람이 누른 뒤(hard)는 예전처럼 바로 (${JSON.stringify(R.y24hard)})`);
    ok(R.y24mix.k === 1 && R.y24mix.s === 0, `③ 소식과 누름이 겹치면 바로(누름 우선) (${JSON.stringify(R.y24mix)})`);
    ok(R.bzWrapped && R.bzRec, '④ 받기 함수(고객·주문·판매자·기록 모음) 감쌈 · 시작·끝 시각 남김');
    ok(R.recN === 1, `④ 겹친 두 출고 열기 측정이 같은 긴 작업을 한 번만 셈 (기록 ${R.recN}개 — 예전엔 2개)`);
    ok(R.rec && R.rec.longSync >= 1000 && R.rec.syncBy && R.rec.syncBy.syncCustomers >= 1000 && R.rec.longOwn < R.rec.longSum, `④ 그때 돌던 받기를 따로 적음 (${JSON.stringify(R.rec)})`);
    ok(R.cards0 > 0 && R.cards1 === R.cards0, `⑤ 출고 화면 그대로 (카드 ${R.cards0} → ${R.cards1})`);
  }, { touch: true });
  // PC: 예스24 소식(soft)도 예전처럼 바로
  await H(async (p) => {
    await p.addInitScript(seed);
    await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(3500);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { openShip('confirm'); } catch (e) { o.err = e.message; } await W(1500); o.open = !!(S.detail && S.detail.ship); o.phone = IS_PHONE;
      const oK = window.shipRedrawKeep, oS = window.shipRedrawSoon; const cnt = { k: 0, s: 0 }; window.shipRedrawKeep = function () { cnt.k++; }; window.shipRedrawSoon = function () { cnt.s++; };
      try { y24oRedraw(true); await W(650); o.y24soft = { ...cnt }; } finally { window.shipRedrawKeep = oK; window.shipRedrawSoon = oS; } return o; });
    console.log(JSON.stringify(R));
    ok(R.open && !R.phone && R.y24soft.k === 1 && R.y24soft.s === 0, `③ PC는 예스24 소식도 예전처럼 바로 (${JSON.stringify(R.y24soft)})`);
  });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과');
})();
