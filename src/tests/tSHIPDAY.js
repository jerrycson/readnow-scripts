// tSHIPDAY — 정범님 11/04
//  ① '주문매출 탭의 출고별 매출 부분에서 해당 날짜를 누르면 이전의 출고탭 형식을 이곳에 똑같이 · 상품 카드마다 상품 이미지 · 경고 표시를 최상단으로'
//  ② '출고 페이지에서는 PC의 에러 관련 메시지를 기본으로는 끄고 원하면 자기 기기에서만 켤 수 있게'
//  ③ '⏸ 보류한 주문: 켤 수 있게 하고, 기본으로는 빼'
// 시험 자료 손님은 '손님A'… · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const seedAll = async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
  try { ['rn-ship-holdx', 'rn-ship-pcnote', 'rn-ship-warntop', 'rn-ship-first', 'rn-ship-src'].forEach((k) => localStorage.removeItem(k)); } catch (e) {} S.shipWarnTop = null;
  S.pbooks = S.pbooks || new Map(); S.pbooks.set('bk0', { id: 'bk0', images: { front: { src: 'https://example.invalid/cover0.jpg' } } }); S.pbooks.set('bk2', { id: 'bk2', images: { front: { src: 'https://example.invalid/cover2.jpg' } } });
  S.app.platforms = { ...(S.app.platforms || {}), y24: { ...((S.app.platforms || {}).y24 || {}), off: false } };
  await db.collection('app_settings').doc('ship_auto').set({ on: false, holds: { 'A-1': { at: now(), by: 'tester@x', why: '시험 보류' } } }); S.shipAutoCfg = { on: false, holds: { 'A-1': { at: now(), by: 'tester@x', why: '시험 보류' } } };
  const it = (t, p, lid) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNK_ms', grade: '상' });
  S.shipC = { orders: [{ orderNo: 'A-1', buyer: '손님A', orderedAt: '2026-11-04 09:00', items: [it('알라딘 확인 책 하나', 5000, '404935000')] }, { orderNo: 'A-2', buyer: '손님B', orderedAt: '2026-11-04 09:10', items: [it('알라딘 확인 책 둘', 6000, '404935001')] }], at: now(), enrich: {} }; S.shipCFromCache = false;
  S.ship = { orders: [{ orderNo: 'D-3', buyer: '손님C', orderedAt: '2026-11-03 09:00', recipient: { name: '손님C' }, items: [it('알라딘 인쇄 책', 7000, '404935002')] }, { orderNo: 'D-2', buyer: '손님D', orderedAt: '2026-11-03 11:00', recipient: { name: '손님D' }, items: [it('알라딘 송장 책', 8000, '404935005')] }], tabCounts: {}, at: now() }; S._shipLive = 1;
  await db.collection('shp_invoices').doc('invD').set({ createdAt: now(), status: 'done', limit: 0, items: [{ orderNo: 'D-3', invoice: '240000000098', state: 'todo' }, { orderNo: 'D-2', invoice: '240000000099', state: 'fail', err: '송장번호 칸을 못 찾음' }], log: [], stepNow: { at: now(), lv: 'err', m: '송장번호 칸을 못 찾음' } });
  const y = (id, o) => db.collection('crm_y24_orders').doc(id).set({ orderNo: id, lastSeenAt: now(), firstSeenAt: now(), orderedAt: now(), buyer: '손님E', recipient: { name: '손님E', phone: '010-0000-0000', address: '어느 시 어느 길 1' }, items: [{ k: '1', title: '테스트 책 0 — 아주 긴 제목이 붙은 상품 이름', ean: '9788910000000', price: 9000, qty: 1, grade: '최상' }], ...o });
  await y('Y-NEW1', { ystage: 'new' });
  /* 지난 출고일(11/02) — 알라딘 발송일로 묶인 주문 둘 · B-2는 경고 주문(고객 위험 표시) */
  const ao = (no, at, uc, t, p) => putOrder('aladin_' + no, { id: 'aladin_' + no, platform: 'aladin', kind: 'sale', orderNo: no, orderedAt: at, shippedAt: '2026-11-02', buyer: { name: no === 'B-2' ? '손님F' : '손님G' }, recipient: { name: no === 'B-2' ? '손님F' : '손님G' }, items: [{ title: t, qty: 1, price: p, lineStatus: 'normal', aladinUsedCode: uc }] });
  ao('B-1', '2026-11-01 10:00', 'U215983410', '테스트 책 0 — 아주 긴 제목이 붙은 상품 이름', 5000); ao('B-2', '2026-11-01 09:00', 'U215983412', '테스트 책 2 — 아주 긴 제목이 붙은 상품 이름', 6400);
  window.__riskNo = new Set(['B-2', 'D-3x']); const r0 = shipRiskOf; window.__r0 = r0; shipRiskOf = (o) => (o && window.__riskNo.has(String(o.orderNo)) ? 3 : r0(o)); /* 고객 위험 표시는 고객 기록에서 오는 것 — 시험은 그 결과만 흉내 */
  S._saleIdx = null; S._sdm = null; S.ver++; bump('o');
  await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship)));
  y24oWatch(); await W(900); S._shipRowsC = null; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1500); await eval('(' + seedSrc + ')')(); const sh = () => document.getElementById('sheet'); try {
    // ① 주문·매출 탭 출고별 매출 표 → 날짜 누르기 → 옛 ④ 출고 탭 모양
    S.sec.o_shipday = true; uxTabGo('orders'); await W(800); renderMainNow(); await W(400); const tr = document.querySelector('#main tr[data-sday="2026-11-02"]'); o.tr = !!tr; if (tr) tr.click(); await W(600);
    o.view = { sdv: S.detail && S.detail.sdv, t: (sh().querySelector('.sh .t') || {}).textContent || '', hero: !!sh().querySelector('.ss-hero'), big: (sh().querySelector('.ss-big') || {}).textContent || '', bars: sh().querySelectorAll('.ss-bars [data-sdv]').length, td: (sh().querySelector('.ss-bar.td') || { dataset: {} }).dataset.sdv, ss4: !!sh().querySelector('.ss4bar [data-ss4top]'), edit: !!sh().querySelector('[data-sdedit="2026-11-02"]'), nav: sh().querySelectorAll('.ss-nav button').length, pk: (sh().querySelector('.ss-pk') || {}).textContent || '', pcq: !!sh().querySelector('.shp-head[data-pcq]') };
    const cards = [...sh().querySelectorAll('#ss_list .ss-o')]; o.cards = cards.map((c) => c.dataset.ssono + (c.classList.contains('warn') ? '!' : '')).join(','); o.wb = cards[0] ? !!cards[0].querySelector('.ss-wb') : false; o.wn = (sh().querySelector('.ss-wn') || {}).textContent || '';
    o.imgs = [...sh().querySelectorAll('#ss_list .ss-it')].map((x) => { const im = x.querySelector('img.ss-ph'); return im ? im.getAttribute('src') : 'none'; }).join(' | '); o.lazy = [...sh().querySelectorAll('#ss_list img.ss-ph')].every((im) => im.loading === 'lazy');
    o.pg = typeof pgdCur === 'function' ? pgdCur() : ''; o.guide = !!(pgdDefs().shipDayView);
    // 경고 맨 위 끄기(이 기기) → 정렬 조건대로(주문시간 최신 먼저 → B-1 먼저) · 다시 켬
    sh().querySelector('[data-ss4top]').click(); await W(400); o.offOrder = [...sh().querySelectorAll('#ss_list .ss-o')].map((c) => c.dataset.ssono).join(','); o.offLs = localStorage.getItem('rn-ship-warntop'); sh().querySelector('[data-ss4top]').click(); await W(400); o.onOrder = [...sh().querySelectorAll('#ss_list .ss-o')].map((c) => c.dataset.ssono).join(',');
    // 막대 → 다른 날 · 고치기·확정 → 예전 하루 출고 고치기 화면 · 뒤로
    const b2 = sh().querySelector('[data-sdedit]'); b2.click(); await W(400); o.edit2 = { sday: S.detail && S.detail.sday, save: !!sh().querySelector('#sd_save') }; history.back(); await W(500); o.backTo = S.detail && S.detail.sdv;
    history.back(); await W(500);
    // ①-2 오늘 출고 화면 카드: 📌 경고 맨 위 기본 켬 · ⚠ 예외 주문이 먼저 · 예스24 카드에도 상품 이미지 · 알라딘 카드 사진 칸
    S.shipSrc = 'all'; S.shipTab = 'printed'; await openShip(); await W(700); const pr = [...sh().querySelectorAll('section.shp-o[data-anc^="o:D-"]')]; o.printed = pr.map((s) => s.dataset.anc + (s.classList.contains('shp-warnc') ? '!' : '')).join(','); o.warnTopDef = shipSortPrefs().top;
    S.shipTab = 'confirm'; openShip(); await W(700); const yc = sh().querySelector('section.y24o[data-anc="y24:Y-NEW1"]'); o.y24img = yc ? (yc.querySelector('.y24o-img img.ph') || { getAttribute: () => 'none' }).getAttribute('src') : 'nocard'; o.y24slot = yc ? yc.querySelectorAll('.y24o-it > .shp-img').length : -1; o.alImg = sh().querySelectorAll('section.shp-o[data-anc^="o:A-"] .shp-img').length;
    // ③ ⏸ 보류 — 기본 뺌: ⚠ 수·홈 수에 안 셈 · 켜면 셈(이 기기)
    S._shipRowsC = null; o.holdRow = shipRows().some((r) => r.id === 'A-1' && r.exc && r.exc.k === 'hold'); o.x0 = shipExcN(); o.x0why = shipExcRows().map((x) => x.why.slice(0, 12)).join(' / '); let A = []; try { A = bizAlerts(bizCalc()); } catch (e) { o.alErr = e.message; } let al = A.find((a) => a.key === 'shipexc'); o.home0 = al ? +((al.t.match(/사람이 볼 것 (\d+)건/) || [])[1] || -1) : 0;
    S.shipSetOpen = true; openShip(); await W(500); const hx = sh().querySelector('#shp_holdx'); o.hxBox = !!hx && !hx.checked; hx.checked = true; hx.dispatchEvent(new Event('change')); await W(800); o.hxLs = localStorage.getItem('rn-ship-holdx'); o.x1 = shipExcN(); try { A = bizAlerts(bizCalc()); } catch (e) {} al = A.find((a) => a.key === 'shipexc'); o.home1 = al ? +((al.t.match(/사람이 볼 것 (\d+)건/) || [])[1] || -1) : 0;
    { const b = sh().querySelector('#shp_holdx'); b.checked = false; b.dispatchEvent(new Event('change')); await W(600); o.x2 = shipExcN(); }
    // ② 출고 화면 PC 알림 — 기본 숨김 · 켜면 보임(이 기기만) · 다른 화면에서는 그대로
    S.shipTab = 'confirm'; openShip(); await W(500); const vis = (id) => { const e = document.getElementById(id); return e ? getComputedStyle(e).display !== 'none' : null; };
    DLP.start('t_prd', DLP_NM.prd_listings, 100); DLP.draw(); await W(300); let lg = document.getElementById('lgwarn'); if (!lg) { lg = document.createElement('div'); lg.id = 'lgwarn'; lg.textContent = '🖥 시험 PC 멈춤'; document.body.appendChild(lg); } let dg = document.getElementById('rn-dlg-chip'); if (!dg) { dg = document.createElement('div'); dg.id = 'rn-dlg-chip'; dg.textContent = '⚠ 알라딘 팝업 확인 필요'; document.body.appendChild(dg); }
    const st = sh().querySelector('#shp_stale'); if (st) { st.style.display = ''; st.innerHTML = '<b>⚠ 9분째 새로 못 읽음</b>'; }
    o.pc0 = { pcq: !!sh().querySelector('.shp-head[data-pcq]'), dlp: vis('dlp'), lg: vis('lgwarn'), dg: vis('rn-dlg-chip'), stale: st ? getComputedStyle(st).display !== 'none' : null };
    await W(3200); const T = document.getElementById('toast'); T.textContent = ''; toast('🖥 PC 수집기 멈춤 — 연결 없음', 1); o.toastMuted = T.textContent === ''; toast('복사함: 시험'); o.toastOther = T.textContent === '복사함: 시험';
    const pb = sh().querySelector('#shp_pcnote'); o.pcBox = !!pb && !pb.checked; pb.checked = true; pb.dispatchEvent(new Event('change')); await W(900); if (sh().querySelector('#shp_stale')) { sh().querySelector('#shp_stale').style.display = ''; sh().querySelector('#shp_stale').innerHTML = '<b>⚠ 9분째 새로 못 읽음</b>'; }
    o.pc1 = { ls: localStorage.getItem('rn-ship-pcnote'), pcq: !!sh().querySelector('.shp-head[data-pcq]'), dlp: vis('dlp'), lg: vis('lgwarn'), dg: vis('rn-dlg-chip'), stale: vis('shp_stale') };
    await W(3200); T.textContent = ''; toast('🖥 PC 수집기 멈춤 — 연결 없음', 1); o.toastOn = T.textContent !== '';
    { let l2 = document.getElementById('lgwarn'); if (!l2) { l2 = document.createElement('div'); l2.id = 'lgwarn'; l2.textContent = '🖥 시험 PC 멈춤'; document.body.appendChild(l2); } const b = sh().querySelector('#shp_pcnote'); b.checked = false; b.dispatchEvent(new Event('change')); await W(700); } { let l2 = document.getElementById('lgwarn'); if (!l2) { l2 = document.createElement('div'); l2.id = 'lgwarn'; l2.textContent = '🖥 시험 PC 멈춤'; document.body.appendChild(l2); } } o.pc2 = { dlp: vis('dlp'), lg: vis('lgwarn') }; /* 띠 그리는 함수(lwBand)가 지울 수 있어 시험 띠를 다시 둠 */
    history.back(); await W(600); { let l2 = document.getElementById('lgwarn'); if (!l2) { l2 = document.createElement('div'); l2.id = 'lgwarn'; l2.textContent = '🖥 시험 PC 멈춤'; document.body.appendChild(l2); } } o.pc3 = { sheetOn: sh().classList.contains('on'), dlp: vis('dlp'), lg: vis('lgwarn') }; await W(3200); T.textContent = ''; toast('🖥 PC 수집기 멈춤 — 연결 없음', 1); o.toastOut = T.textContent !== '';
    o.guideTxt = JSON.stringify(pgdDefs().ship || ''); o.feat = featIndex().filter((f) => /하루 출고 보기|PC 오류 알림|보류한 주문 세기/.test(f.t)).length;
    } catch (e) { o.err = e.message + ' @ ' + String(e.stack || '').split('\n')[1]; } DLP.close('t_prd'); shipRiskOf = window.__r0; return o; }, seedAll.toString());
  console.log(JSON.stringify(R).slice(0, 3000));
  ok(!R.err, '시험 중 오류 없음 ' + (R.err || '')); const V = R.view || {};
  ok(R.tr && V.sdv === '2026-11-02' && /11월 02일/.test(V.t) && V.hero && V.bars >= 1 && V.td === '2026-11-02' && V.ss4 && V.edit && V.nav === 4, '출고별 매출 날짜 → 옛 ④ 출고 탭 모양(매출 칸·막대·정렬 줄·고치기): ' + JSON.stringify(V));
  ok(/11,400|11400/.test(V.big.replace(/[^\d,]/g, '')) && /이날 수거|이날 택배|이날 수거 없음/.test(V.pk), '그날 매출·택배 묶음: ' + V.big + ' · ' + V.pk);
  ok(R.cards === 'B-2!,B-1' && R.wb && /경고 1/.test(R.wn), '경고 주문이 맨 위 · 빨간 테두리 · ⚠ 경고 표시: ' + R.cards + ' ' + R.wn);
  ok(/cover0\.jpg/.test(R.imgs) && /cover2\.jpg/.test(R.imgs) && R.lazy, '상품 카드마다 상품 이미지(우리 상품 기록 앞표지 · lazy): ' + R.imgs);
  ok(R.offOrder === 'B-1,B-2' && R.offLs === '0' && R.onOrder === 'B-2,B-1', '📌 경고 맨 위 끄기(이 기기) → 정렬 조건대로 · 다시 켜면 맨 위: ' + [R.offOrder, R.offLs, R.onOrder].join(' / '));
  ok(R.edit2.sday === '2026-11-02' && R.edit2.save && R.backTo === '2026-11-02', '「✏ 고치기·확정」 → 하루 출고 고치기 · 뒤로 → 하루 출고 보기: ' + JSON.stringify(R.edit2) + ' ' + R.backTo);
  ok(R.pg === 'shipDayView' && R.guide && R.feat >= 3, '화면 설명서(shipDayView)·기능 찾기: ' + R.pg + ' feat ' + R.feat);
  ok(R.warnTopDef === true && /^o:D-2!/.test(R.printed) && /o:D-3(?!!)/.test(R.printed), '오늘 출고 카드도 📌 경고 맨 위 기본 켬 — ⚠ 예외(송장 입력 실패) 주문이 먼저 · 빨간 띠: ' + R.printed);
  ok(/cover0\.jpg/.test(R.y24img) && R.y24slot === 1 && R.alImg >= 2, '예스24 카드 상품 칸에도 상품 이미지 · 알라딘 카드 사진 칸: ' + [R.y24img, R.y24slot, R.alImg].join(' · '));
  ok(R.holdRow && R.x0 === 1 && !/보류/.test(R.x0why) && R.home0 === 1, `⏸ 보류 기본 뺌 — ⚠ 수 ${R.x0} · 홈 ${R.home0} (${R.x0why}) ${R.alErr || ''}`);
  ok(R.hxBox && R.hxLs === '1' && R.x1 === 2 && R.home1 === 2 && R.x2 === 1, `⚙ '보류한 주문도 세기' 켜면 ⚠·홈 수에 셈(이 기기) — ${R.x1}·${R.home1} · 끄면 ${R.x2}`);
  ok(R.pc0.pcq && R.pc0.dlp === false && R.pc0.lg === false && R.pc0.dg === false && R.pc0.stale === false && R.toastMuted && R.toastOther, '출고 화면: PC 알림(⬇ 받기 띠·PC 멈춤 띠·알라딘 팝업 띠·못 읽음 카드·PC 오류 토스트) 기본 숨김 · 다른 토스트는 그대로: ' + JSON.stringify(R.pc0) + ' ' + R.toastMuted + '/' + R.toastOther);
  ok(R.pcBox && R.pc1.ls === '1' && !R.pc1.pcq && R.pc1.dlp && R.pc1.lg && R.pc1.dg && R.pc1.stale && R.toastOn, '⚙ 이 기기에서 PC 오류 알림 보기 켜면 보임(localStorage · 이 기기만): ' + JSON.stringify(R.pc1));
  ok(R.pc2.dlp === false && R.pc2.lg === false && !R.pc3.sheetOn && R.pc3.dlp && R.pc3.lg && R.toastOut, '다시 끄면 숨김 · 출고 화면을 닫으면 다른 화면에서는 그대로 보임: ' + JSON.stringify([R.pc2, R.pc3, R.toastOut]));
  ok(/원스톱이 막아 둔 일/.test(R.guideTxt) && /오늘 출고하지 않을 상품/.test(R.guideTxt) && /무슨 일:/.test(R.guideTxt) && /정범님이 할 일:/.test(R.guideTxt) && /이 상품 오늘 출고에서 빼기/.test(R.guideTxt) && !/손님[A-Z]/.test(R.guideTxt), '출고 설명서: 🛡 원스톱이 막아 둔 일 · ⏸ 오늘 출고하지 않을 상품 장(손님 이름 없음)');
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await W(1500); await eval('(' + seedSrc + ')')(); const sh = document.getElementById('sheet'); openShipDayView('2026-11-02'); await W(700);
    const out = { doc: document.documentElement.scrollWidth - innerWidth, sheet: sh.scrollWidth - sh.clientWidth, cards: sh.querySelectorAll('.ss-o').length, imgW: Math.round((sh.querySelector('img.ss-ph') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width) }; shipRiskOf = window.__r0; return out; }, seedAll.toString());
  console.log(JSON.stringify(R));
  ok(R.doc <= 0 && R.sheet <= 0 && R.cards === 2 && R.imgW > 20, '360px: 하루 출고 보기 가로 넘침 없음 · 사진 보임: ' + JSON.stringify(R));
  console.log(bad ? `❌ tSHIPDAY 실패 ${bad}` : '✓ tSHIPDAY 통과');
}, { vp: { width: 360, height: 760 }, touch: true }));
