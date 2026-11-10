// tSHIP1110 — 정범님 11/10: 🚚 오늘 출고
//  ① 상품 카드 「🔎 소재불명」 두 번 누르기(0.4초 안 두 번째는 무시 · 무장된 단추 글에 대상 · 다시 그려도 무장 그대로) → 🔎 소재불명 페이지(lostAdd 그대로 · 출처 ship) · 출고 단계는 그대로 · 수색중 띠
//  ② 소재불명 페이지 '＋ 직접 넣기'가 판매완료 상품도 찾음(✅ 판매완료 표시)
//  ③ 정렬 「📚 상품명 순」(가나다 · 한 번 더 = 거꾸로 · '그다음' 고르기에도)
//  ④ 검색창: 낱말 그대로·순서대로(부분 낱말·순서 바뀜 안 맞음 · 빈칸 여러 칸 = 하나 · 영문 대소문자 무시) · 숨은 ISBN·저자·SKU도 · 맞는 카드만 · 칠함 · Enter 다음 · Shift+Enter 앞 · Esc 지움
//     · 출고 단축키·스캐너와 안 겹침(칸 밖 글자는 칸에 안 들어감 · 칸 안 Enter는 다른 처리로 안 넘김 · '?' 도움말 안 뜸) · 다시 그려도 글·커서 그대로
// 시험 자료 손님은 '손님A'·'손님B'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIP1110.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const FS = window.__FS; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
    const A = [...S.plist.values()]; const now = new Date().toISOString(); const sh = () => document.getElementById('sheet');
    const T = ['다람쥐 숲 이야기', '해리 포터와 마법사의 돌', '포터 해리 거꾸로 이름', '해리포터 사전', 'Harry Potter and the Stone', '가나다 첫 책'];
    T.forEach((t, i) => { A[i].title = t; A[i].status = '판매중'; A[i].active = true; A[i].qty = 1; }); A[0].isbn13 = '9788900011111'; A[1].bookId = 'bkH'; S.pbooks.set('bkH', { id: 'bkH', author: '조앤 롤링', publisher: '문학수첩' });
    A[3].status = '판매중'; A[6].status = '판매완료'; A[6].active = false; A[6].title = '이미 팔린 책 하나';
    const it = (l, sku) => ({ listingId: l.listingId, title: l.title, price: l.price, qty: 1, sku: sku || l.sku, grade: '상', isbn13: l.isbn13 });
    S.shipC = { orders: [], at: now, enrich: {} }; S.shipCFromCache = false;
    S.ship = { orders: [{ orderNo: 'D-1', buyer: '손님A', orderedAt: '2026-11-10 09:00', recipient: { name: '손님A' }, items: [it(A[0], 'PNKAAA_ms')] }, { orderNo: 'D-2', buyer: '손님B', orderedAt: '2026-11-10 09:10', recipient: { name: '손님B' }, items: [it(A[1], 'BLKBBB_ms')] },
      { orderNo: 'D-3', buyer: '손님C', orderedAt: '2026-11-10 09:20', recipient: { name: '손님C' }, items: [it(A[2], 'YLWCCC_ms'), it(A[3], 'YLWCCC_ms')] }, { orderNo: 'D-4', buyer: '손님D', orderedAt: '2026-11-10 09:30', recipient: { name: '손님D' }, items: [it(A[4], 'PNKDDD_ms')] }, { orderNo: 'D-5', buyer: '손님E', orderedAt: '2026-11-10 09:40', recipient: { name: '손님E' }, items: [it(A[5], 'BLKEEE_ms')] }], tabCounts: {}, at: now }; S._shipLive = 1;
    await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(400);
    try { localStorage.removeItem('rn-ship-sort'); localStorage.removeItem('rn-ship-sort2'); localStorage.setItem('rn-ship-view', 'order'); localStorage.setItem('rn-ship-warntop', '0'); } catch (e) {} S.shipSort = null; S.shipSortL = null; S.shipWarnTop = null; S.shipView = 'order';
    S.shipSrc = 'all'; S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(600);
    const ords = () => [...sh().querySelectorAll('section.shp-o[data-anc^="o:D-"]')].filter((s) => !s.classList.contains('shq-hide')).map((s) => s.dataset.anc.slice(2));
    const vis = () => [...sh().querySelectorAll('.shp-it')].filter((x) => !x.classList.contains('shq-hide') && !x.closest('.shq-hide')).map((x) => (x.querySelector('.shp-t') || {}).textContent || '');
    o.base = ords();
    // ── ③ 정렬: 📚 상품명 순
    const nb = sh().querySelector('[data-ss="name"]'); o.nameBtn = !!nb; if (nb) { nb.click(); await W(500); } o.byName = ords(); o.nameOn = !!sh().querySelector('[data-ss="name"].on');
    const nb2 = sh().querySelector('[data-ss="name"]'); if (nb2) { nb2.click(); await W(500); } o.byNameRev = ords();
    o.sk2 = [...(sh().querySelector('[data-ss2="0"]') || { options: [] }).options].some((x) => x.value === 'name'); o.ss4 = typeof SS4_K === 'object' && !!SS4_K.title;
    try { localStorage.removeItem('rn-ship-sort'); } catch (e) {} if (typeof SRT === 'object' && SRT.r) SRT.r.ship = false; S.shipSort = 'shelf'; await openShip(); await W(400);
    // ── ④ 검색창
    const q = () => sh().querySelector('#shp_q'); o.qBar = !!q() && !!q().closest('.shp-head'); o.qNoFocus = document.activeElement !== q();
    const typeQ = async (v) => { const i = q(); i.focus(); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); await W(350); };
    const hlN = () => { try { const h = CSS.highlights.get('shpq'); return h ? h.size : 0; } catch (e) { return -1; } };
    await typeQ('해리 포터'); o.q1 = { v: vis(), o: ords(), hl: hlN(), n: (sh().querySelector('#shp_qn') || {}).textContent };
    await typeQ('  해리    포터 '); o.q2 = vis();
    await typeQ('harry POTTER'); o.q3 = vis();
    await typeQ('해리 포'); o.q4 = { v: vis(), n: (sh().querySelector('#shp_qn') || {}).textContent };
    await typeQ('포터 해리'); o.q5 = vis();
    await typeQ('9788900011111'); o.q6 = { v: vis(), o: ords() }; /* ISBN은 카드에 안 보임 — 숨은 찾기 글 */
    await typeQ('조앤 롤링'); o.q7 = vis(); await typeQ('문학수첩'); o.q7b = vis();
    await typeQ('손님C'); o.q8 = { o: ords(), v: vis() }; /* 주문 머리가 맞으면 그 주문 통째(두 상품) */
    await typeQ('D-4'); o.q9 = ords();
    await typeQ('PNKAAA'); o.q10 = ords(); /* 관리코드 앞 여섯 글자(서가) — 띠에 크게 보이는 글 */
    // Enter 다음 · Shift+Enter 앞
    await typeQ('해리'); const T0 = (S._shqT || []).length; const key = (k, sft) => q().dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey: !!sft, bubbles: true, cancelable: true }));
    const i0 = S._shqI;  key('Enter'); await W(80); const i1 = S._shqI; o.dbg = { i0 }; key('Enter'); await W(80); const i2 = S._shqI; key('Enter', true); await W(80); const i3 = S._shqI; key('Enter', true); await W(80); const i4 = S._shqI;
    o.nav = { T0, i1, i2, i3, i4, cur: sh().querySelectorAll('.shq-cur').length, curHl: (() => { try { return CSS.highlights.get('shpqc').size; } catch (e) { return -1; } })(), n: (sh().querySelector('#shp_qn') || {}).textContent };
    // 다시 그려도 글·커서·거르기 그대로
    q().setSelectionRange(1, 1); S._shqAt = 0; await openShip(); await W(400); o.redraw = { v: q().value, foc: document.activeElement === q(), sel: q().selectionStart, vis: vis().length };
    // 쓰는 동안(1.5초)엔 늦은 자료 다시 그리기를 미룸
    S._shqAt = Date.now(); const d0 = S._shipDrawAt; S._shipTouch = 0; shipRedrawKeep(); await W(200); o.defer = S._shipDrawAt === d0;
    // 칸 안 키는 다른 처리로 안 넘김: '?'(도움말) · Enter(한 단추) — 칸 안에서 '?'를 쳐도 도움말 안 뜸
    window.__one = 0; const so = window.shipOneShot; window.shipOneShot = () => { window.__one++; };
    o.keys = {}; return o; });
  // 진짜 키보드로: 칸 안 '?' · Enter / 칸 밖 스캐너 흉내(숫자 + Enter)
  await p.focus('#shp_q'); await p.keyboard.press('Control+A'); await p.keyboard.type('해리 포터?'); await p.waitForTimeout(400); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const K1 = await p.evaluate(() => ({ help: !!document.querySelector('.rn-help'), v: document.getElementById('shp_q').value, one: window.__one, sheet: document.getElementById('sheet').classList.contains('on') }));
  await p.evaluate(() => { document.getElementById('shp_q').blur(); }); await p.keyboard.type('9788900011111'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const K2 = await p.evaluate(() => ({ v: document.getElementById('shp_q').value, sheet: document.getElementById('sheet').classList.contains('on'), one: window.__one }));
  // Esc = 검색어 지움(웹앱 공통) → 모든 카드 다시
  await p.focus('#shp_q'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const K3 = await p.evaluate(() => ({ v: document.getElementById('shp_q').value, hid: document.querySelectorAll('#sheet .shq-hide').length, sheet: document.getElementById('sheet').classList.contains('on') }));
  R.keys = { K1, K2, K3 };
  // ── ① 🔎 소재불명 단추
  const L1 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const FS = window.__FS; const sh = () => document.getElementById('sheet'); const LO = () => ((FS.prd_system || {}).lost || {}); const cmds = () => Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit');
    const A = [...S.plist.values()]; const lid = A[0].listingId; const btn = () => sh().querySelector(`[data-shlost="${lid}"]`); o.btn = !!btn(); o.n0 = Object.keys(LO().cases || {}).length; const pe0 = cmds().length; const stg0 = (shipRows().find((r) => r.id === 'D-1') || {}).stage;
    btn().click(); await W(60); o.armTxt = btn() ? btn().textContent : ''; btn().click(); await W(300); o.nQuick = Object.keys(LO().cases || {}).length; /* 0.4초 안 두 번째 = 무시 */
    S._shipTouch = 0; await openShip(); await W(200); o.armKeep = btn() ? btn().textContent : ''; /* 다시 그려도 무장 그대로 */
    await W(200); btn().click(); await W(1500); const C = Object.entries(LO().cases || {}); o.n1 = C.length; const c = C.find(([, x]) => x.key === A[0].usedCode); o.cs = c ? { st: c[1].st, from: Object.values(c[1].src || {}).map((s) => s.from).join(','), stop: (c[1].stop || {}).how, title: c[1].title } : null;
    o.pe = cmds().length - pe0; o.stg = [stg0, (shipRows().find((r) => r.id === 'D-1') || {}).stage]; S._shipTouch = 0; S._shqAt = 0; await openShip(); await W(500);
    const card = [...sh().querySelectorAll('.shp-it')].find((x) => (x.querySelector('.shp-t') || {}).textContent === A[0].title); o.after = card ? { on: !!card.querySelector('.shp-lost.on[data-locase]'), band: !!card.querySelector('.lo-band'), sds: true } : null;
    o.lostIdx = !!(lostIdx() || new Map()).get(A[0].id);
    // 한 번 누르고 4초 지나면 풀림
    const lid2 = A[1].listingId; const b2 = () => sh().querySelector(`[data-shlost="${lid2}"]`); b2().click(); await W(80); o.arm2 = b2().classList.contains('arm'); await W(4300); o.unarm = b2() && !b2().classList.contains('arm') && /소재불명/.test(b2().textContent) && !/한 번 더/.test(b2().textContent); o.n2 = Object.keys(LO().cases || {}).length;
    // ② 직접 넣기 — 판매완료도
    S.lostP = { f: 'open', q: '', add: '이미 팔린' }; openLost(); await W(600); const hit = sh().querySelector(`[data-loaddl="${A[6].id}"]`); o.add = { hit: !!hit, sold: hit ? /판매완료/.test(hit.parentElement.textContent) : false, txt: hit ? hit.parentElement.textContent.slice(0, 120) : '' };
    S.lostP.add = '해리 포터'; lostRenderForce(); await W(300); o.addSell = !!sh().querySelector(`[data-loaddl="${A[1].id}"]`);
    S.lostP.add = '이미 팔린'; lostRenderForce(); await W(300); const hb6 = () => document.querySelector(`[data-loaddl="${A[6].id}"]`); if (hb6()) { hb6().click(); await W(120); if (hb6()) hb6().click(); await W(1200); }
    const C2 = Object.values(LO().cases || {}); o.soldCase = C2.find((x) => x.key === A[6].usedCode) || null; o.soldCase = o.soldCase ? { st: o.soldCase.st, stop: (o.soldCase.stop || {}).how } : null;
    o.feat = FEAT.filter((f) => /오늘 출고 검색창|오늘 출고 카드에서 소재불명/.test(f.t)).length;
    return o; });
  // 휴대폰 폭: 검색칸이 머리 안에서 넘치지 않음
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(300); await p.setViewportSize({ width: 360, height: 760 }); await p.evaluate(async () => { S._shqAt = 0; S.shipQ = ''; S.detail = null; await openShip(); }); await p.waitForTimeout(600);
  const M = await p.evaluate(() => { const b = document.querySelector('#sheet .shp-qbar'); const r = b ? b.getBoundingClientRect() : null; return { w: r ? Math.round(r.right) : -1, sw: document.documentElement.scrollWidth, sh: document.getElementById('sheet').scrollWidth }; });
  console.log(JSON.stringify({ ...R, L1, M }).slice(0, 3500));
  const tt = (L) => (L || []).map((x) => x.slice(0, 6)).join('|');
  ok(R.nameBtn && R.nameOn && R.byName.join() === 'D-5,D-1,D-3,D-2,D-4' && R.byNameRev.join() === 'D-4,D-2,D-3,D-1,D-5', '📚 상품명 순 = 가나다(한국어 → 영문 뒤) · 한 번 더 = 거꾸로: ' + R.byName.join() + ' / ' + R.byNameRev.join());
  ok(R.sk2 && R.ss4, "'그다음' 고르기·④ 출고 탭 정렬에도 상품명 가나다");
  ok(R.qBar && R.qNoFocus, '검색칸은 머리 칸 안 · 열 때 포커스를 가져가지 않음(스캐너·단축키 그대로)');
  ok(R.q1.v.length === 1 && /^해리 포터와/.test(R.q1.v[0]) && R.q1.o.join() === 'D-2' && R.q1.hl >= 1 && /1곳|곳/.test(R.q1.n || ''), "'해리 포터' = 그 순서로 이어진 글만(순서 바뀜·붙여 쓴 것 안 맞음) · 칠함 · 수: " + JSON.stringify(R.q1));
  ok(tt(R.q2) === tt(R.q1.v), '빈칸 여러 칸·앞뒤 빈칸 = 하나로: ' + tt(R.q2));
  ok(R.q3.length === 1 && /^Harry/.test(R.q3[0]), '영문 대소문자 무시: ' + tt(R.q3));
  ok(!R.q4.v.length && /없음/.test(R.q4.n || ''), "부분 낱말('해리 포') 안 맞음 → 없음: " + JSON.stringify(R.q4));
  ok(R.q5.length === 1 && /^포터 해리/.test(R.q5[0]), "'포터 해리'는 그 순서 글만: " + tt(R.q5));
  ok(R.q6.o.join() === 'D-1' && R.q6.v.length === 1, '카드에 안 보이는 ISBN으로도 찾음: ' + JSON.stringify(R.q6));
  ok(R.q7.length === 1 && R.q7b.length === 1, '저자·출판사로 찾음');
  ok(R.q8.o.join() === 'D-3' && R.q8.v.length === 2, '주문자(주문 머리)가 맞으면 그 주문 통째: ' + JSON.stringify(R.q8));
  ok(R.q9.join() === 'D-4' && R.q10.join() === 'D-1', '주문 번호·관리코드로 찾음: ' + R.q9.join() + ' / ' + R.q10.join());
  ok(R.nav.T0 >= 2 && R.nav.i1 === 0 && R.nav.i2 === 1 && R.nav.i3 === 0 && R.nav.i4 === R.nav.T0 - 1 && R.nav.cur === 1 && R.nav.curHl === 1, 'Enter 다음 · Shift+Enter 앞(처음에서 앞 = 맨 끝) · 지금 자리 칠함: ' + JSON.stringify(R.nav));
  ok(R.redraw.v === '해리' && R.redraw.foc && R.redraw.sel === 1 && R.redraw.vis === 2, '다시 그려도 검색어·커서 자리·거르기 그대로: ' + JSON.stringify(R.redraw));
  ok(R.defer, '검색칸에 쓰는 동안은 출고 화면 다시 그리기를 미룸');
  ok(!R.keys.K1.help && R.keys.K1.v === '해리 포터?' && R.keys.K1.one === 0 && R.keys.K1.sheet, "칸 안 '?'는 글자로(도움말 안 뜸) · Enter는 다음 찾기만(다른 단추·한 단추 안 누름): " + JSON.stringify(R.keys.K1));
  ok(R.keys.K2.v === '해리 포터?' && R.keys.K2.sheet && R.keys.K2.one === 0, '칸 밖 스캐너 입력(숫자 + Enter)은 검색칸에 안 들어감 · 출고 화면 그대로: ' + JSON.stringify(R.keys.K2));
  ok(R.keys.K3.v === '' && R.keys.K3.hid === 0 && R.keys.K3.sheet, 'Esc = 검색어 지움 → 모든 카드 다시(화면은 그대로): ' + JSON.stringify(R.keys.K3));
  ok(L1.btn && /한 번 더/.test(L1.armTxt) && /PNKAAA/.test(L1.armTxt) && /다람쥐/.test(L1.armTxt), '🔎 소재불명 첫 누름 = 무장(대상 관리코드·제목 표시): ' + L1.armTxt);
  ok(L1.nQuick === L1.n0, '0.4초 안 두 번째 누름은 무시(사건 안 생김)');
  ok(/한 번 더/.test(L1.armKeep), '다시 그려도 무장 그대로: ' + L1.armKeep);
  ok(L1.n1 === L1.n0 + 1 && L1.cs && L1.cs.st === 'open' && L1.cs.from === 'ship' && L1.cs.stop === 'keep' && L1.pe === 0, '두 번째 누름 → 🔎 소재불명 사건(출처 ship · 기본 판매중 그대로 · 알라딘 수정 맡김 없음): ' + JSON.stringify(L1.cs) + ' pe ' + L1.pe);
  ok(L1.stg[0] === L1.stg[1] && L1.stg[0] === 'deliv', '출고 단계는 그대로(소재불명은 출고를 막거나 진행하지 않음): ' + L1.stg.join('→'));
  ok(L1.after && L1.after.on && L1.after.band && L1.lostIdx, '그 뒤 카드: 🔎 수색중 띠 + 「소재불명 수색중 — 사건 ›」 단추: ' + JSON.stringify(L1.after));
  ok(L1.arm2 && L1.unarm && L1.n2 === L1.n1, '한 번만 누르고 4초 지나면 풀림(아무것도 안 함)');
  ok(L1.add.hit && L1.add.sold, '직접 넣기: 판매완료 상품도 찾음 · ✅ 판매완료 표시: ' + L1.add.txt);
  ok(L1.addSell, '직접 넣기: 판매 중 상품도 그대로(낱말)');
  ok(L1.soldCase && L1.soldCase.st === 'open' && L1.soldCase.stop === 'already', '판매완료 상품을 넣으면 사건만(판매 상태는 이미 판매 끝 — 안 바꿈): ' + JSON.stringify(L1.soldCase));
  ok(L1.feat === 2, '🔍 기능 찾기에 두 줄');
  ok(M.w > 0 && M.w <= 360 && M.sw <= 361, '360px 폭: 검색칸이 화면 안 · 가로 넘침 없음: ' + JSON.stringify(M));
  console.log(bad ? `❌ tSHIP1110 실패 ${bad}` : '✓ tSHIP1110 통과'); process.exitCode = bad ? 1 : 0; });
