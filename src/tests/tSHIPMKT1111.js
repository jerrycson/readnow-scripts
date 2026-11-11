// tSHIPMKT1111 — 정범님 11/11 '휴대폰에서 출고에 시장 지표가 대부분 뜨질 않아. 거의 멈춰 있다시피 해 — 실시간 수준으로'
//  휴대폰 폭(390px · 출고 가벼운 모드 ?go=confirm)에서
//  ① 주문 때 시장(보강 기록 shp_enrich · 주문 뒤 시장 shp_market)이 카드 오른쪽 시장 칸(📍 시장 속 우리 자리 + 온라인 중고 첫 페이지)에 보임
//  ② 새 시장 기록이 들어오면 그 카드 시장 칸만 바로 바뀜(출고 화면 전체를 다시 그리지 않음)
//  ③ ② 발송 요청 — 실시간 창(7일) 밖 주문의 시장은 보이는 카드만 따로 들어 채움 · 시장 기록이 없으면 예전 시장 지표 한 건 · 그것도 없으면 까닭 글(영영 '받는 중'이 아님)
//  ④ 주문확인요청 상품이 3분 넘게 못 읽히면 클라우드에 시장 다시 읽기를 한 번 맡김(shp_cmds type market) · 카드에 🔄 표시
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIPMKT1111.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('./harness.js')(async (p) => {
  await p.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
    const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const FS = (window.__FS = window.__FS || {});
    const rows = (k, n) => Array.from({ length: n || 8 }, (_, i) => ({ r: i + 1, g: ['상', '중', '최상'][i % 3], p: 3000 + i * 500, lid: k + 's' + i, sc: String(20 + i), n: '판매자' + i, c: 'green' }));
    const pg = (k, n) => rows(k, n).map((w) => ({ grade: w.g, price: w.p, listingId: w.lid, sellerCode: w.sc, sellerName: w.n }));
    const it = (lid, t, pr) => ({ listingId: lid, title: t, price: pr, qty: 1, grade: '상', sku: 'BLKAAA_ms' });
    FS.shp_enrich = { L1: { listingId: 'L1', at: iso(now), grade: '상', itemId: '91', via: 'ours', mkt: { at: iso(now - 60e3), usedTotal: 12, rows: rows('L1'), item: '91', isbnOk: true } } };
    FS.shp_market = { 'C-2__L2__x': { orderNo: 'C-2', listingId: 'L2', at: iso(now - 50e3), via: 'ours', aladinItemId: '92', usedTotal: 11, page1: pg('L2') },
      'D-9__L9__x': { orderNo: 'D-9', listingId: 'L9', at: iso(now - 10 * 864e5), via: 'isbn', aladinItemId: '99', usedTotal: 7, page1: pg('L9', 5) } }; /* 10일 전 — 실시간 창(7일) 밖 */
    FS.prd_listings = { aladin_U8: { listingId: 'L8', usedCode: 'U8', bookId: 'bk8', title: '예전 지표 책' } }; FS.prd_book_metrics = { bk8: { usedFirstPage: pg('L8', 4), lastCheckedAt: '2026-11-01T10:00:00Z', usedTotal: 4 } };
    FS.shp_state = { confirm: { orders: [{ orderNo: 'C-1', buyer: '손님A', orderedAt: '2026-11-11 09:10', items: [it('L1', '보강 기록 책', 5000)] }, { orderNo: 'C-2', buyer: '손님B', orderedAt: '2026-11-11 09:11', items: [it('L2', '주문 뒤 시장 책', 5100)] }, { orderNo: 'C-3', buyer: '손님C', orderedAt: '2026-11-11 09:12', items: [it('L3', '아직 못 읽은 책', 5200)] }], at: iso(now), sig: 's1' },
      current: { orders: [{ orderNo: 'D-9', buyer: '손님D', orderedAt: '2026-11-01 09:00', items: [it('L9', '열흘 전 주문 책', 6000)] }, { orderNo: 'D-8', buyer: '손님E', orderedAt: '2026-11-02 09:00', items: [it('L8', '예전 지표 책', 6100)] }, { orderNo: 'D-7', buyer: '손님F', orderedAt: '2026-11-02 09:30', items: [it('L7', '아무 기록 없는 책', 6200)] }], at: iso(now), tabCounts: {}, sig: 'c1' } };
    try { localStorage.setItem('rn-ship-mkt', '1'); localStorage.setItem('rn-ship-view', 'order'); localStorage.removeItem('rn-ship-mkfold'); } catch (e) {} });
  await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html?go=confirm'); await p.waitForTimeout(4500); await p.addStyleTag({ content: '.verbar{display:none!important}' });
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = () => document.getElementById('sheet');
    const blk = (lid) => sh().querySelector(`.shp-blk2[data-mklid="${lid}"]`); const txt = (lid) => { const b = blk(lid); return b ? b.textContent.replace(/\s+/g, ' ') : null; };
    o.lite = !!S.shipLite; o.thin = typeof PHONE_THIN !== 'undefined' && PHONE_THIN; o.open = sh().classList.contains('on') && S.shipTab === 'confirm';
    o.t1 = txt('L1'); o.t2 = txt('L2'); o.t3 = txt('L3'); o.sum1 = !!(blk('L1') && blk('L1').querySelector('.shp-sum')); o.need3 = !!(blk('L3') && blk('L3').dataset.mkneed);
    o.overflow = document.documentElement.scrollWidth > window.innerWidth + 1 || sh().scrollWidth > sh().clientWidth + 1;
    // ② 새 시장 기록 → 그 카드만 바로
    const d0 = S._shipDrawAt; await db.collection('shp_market').doc('C-3__L3__y').set({ orderNo: 'C-3', listingId: 'L3', at: new Date().toISOString(), via: 'isbn', aladinItemId: '93', usedTotal: 9, page1: Array.from({ length: 6 }, (_, i) => ({ grade: '상', price: 4000 + i * 300, listingId: 'n' + i, sellerCode: String(40 + i), sellerName: '새판매자' + i })) });
    await W(60); o.t3b = txt('L3'); o.noFull = S._shipDrawAt === d0; /* 가짜 Firestore는 쓰기마다 모든 듣기를 불러 다른 듣기가 곧 화면을 다시 그림 — 그 전에(60ms) 이미 바뀌었는지 봄 */ o.need3b = !!(blk('L3') && blk('L3').dataset.mkneed); o.mk3 = !!(S._shipMk && S._shipMk.L3 && S._shipMk.L3.src === 'afterOrder');
    // ④ 3분 넘게 못 읽힘 → 다시 읽기 맡김 (주문확인요청에 시장 없는 상품 하나 더)
    await db.collection('shp_state').doc('confirm').set({ ...JSON.parse(JSON.stringify(S.shipC)), orders: [...S.shipC.orders, { orderNo: 'C-4', buyer: '손님G', orderedAt: '2026-11-11 09:20', items: [{ listingId: 'L4', title: '늦은 책', price: 4500, qty: 1, grade: '상', sku: 'BLKAAA_ms' }] }], sig: 's2' }); await W(2500);
    o.t4 = txt('L4'); S._mkSeen = S._mkSeen || new Map(); S._mkSeen.set('L4', Date.now() - 200e3); shipMkGc(); await W(500);
    o.ask = (window.__FS.shp_cmds || {})['mkw_C-4_L4'] || null; o.t4b = txt('L4');
    // ③ 발송 요청 — 7일 창 밖 · 예전 지표 · 아무것도 없음
    S.shipTab = 'deliv'; S._shipCapN = 0; await openShip(); await W(800); for (const lid of ['L9', 'L8', 'L7']) { const b = blk(lid); if (b) { b.scrollIntoView({ block: 'center' }); await W(900); } } await W(1200);
    o.d9 = txt('L9'); o.d8 = txt('L8'); o.d7 = txt('L7'); o.subs = S._mkSubs ? S._mkSubs.size : 0;
    // 화면을 닫으면 따로 들은 것은 모두 끊음
    history.back(); await W(400); shipMkGc(); o.subsAfter = S._mkSubs ? S._mkSubs.size : -1;
    return o; });
  console.log(JSON.stringify(R, null, 1));
  ok(R.lite && R.thin && R.open, '휴대폰 출고 가벼운 모드(?go=confirm · 390px)로 열림');
  ok(/주문 때 시장/.test(R.t1 || '') && R.sum1, '① 보강 기록(shp_enrich) 시장 — 카드 시장 칸 + 📍 시장 속 우리 자리 요약');
  ok(/주문 때 시장/.test(R.t2 || '') && /전체 중고 11개/.test(R.t2 || ''), '① 주문 뒤 시장(shp_market) — 카드 시장 칸');
  ok(/읽는 중/.test(R.t3 || '') && R.need3, '① 아직 못 읽은 상품은 \'읽는 중\' + 보이는 카드 듣기 표시');
  ok(!R.overflow, '390px에서 가로 넘침 없음');
  ok(/주문 때 시장/.test(R.t3b || '') && /전체 중고 9개/.test(R.t3b || '') && !R.need3b, '② 새 시장 기록이 들어오면 그 카드 시장 칸이 바로 바뀜');
  ok(R.noFull, '② 바뀔 때 출고 화면 전체를 다시 그리지 않음(그 칸만)');
  ok(R.mk3, '② 결정 스냅숏 재료(그때 화면의 시장)도 새 시장으로');
  ok(R.ask && R.ask.type === 'market' && (R.ask.listingIds || []).includes('L4') && R.ask.status === 'queued' && /🔄/.test(R.t4b || ''), '④ 3분 넘게 못 읽힌 주문확인요청 상품 → 클라우드에 시장 다시 읽기 맡김 + 카드 🔄 표시');
  ok(/주문 때 시장/.test(R.d9 || '') && /전체 중고 7개/.test(R.d9 || ''), '③ 발송 요청 — 실시간 창(7일) 밖 주문의 시장도 보이는 카드만 따로 들어 채움');
  ok(/예전 시장 지표 2026-11-01/.test(R.d8 || ''), '③ 시장 기록이 없으면 그 상품의 예전 시장 지표 한 건(가벼운 모드)');
  ok(/주문 때 시장 기록 없음/.test(R.d7 || '') && !/받는 중/.test(R.d7 || ''), '③ 아무 기록도 없으면 까닭 글 — 영영 \'받는 중\'이 아님');
  ok(R.subs > 0 && R.subs <= 24 && R.subsAfter === 0, '보이는 카드 듣기는 24개까지 · 화면을 닫으면 모두 끊음');
  console.log(bad ? `❌ tSHIPMKT1111 실패 ${bad}` : '✓ tSHIPMKT1111 통과');
});
