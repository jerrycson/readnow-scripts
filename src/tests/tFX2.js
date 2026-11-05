// tFX2 — 정범님 11/05 (오늘 출고·출고별 매출)
//  ① '오늘 출고 끝까지 접고 닫기가 불편 — 클릭하는 곳을 넓게' → 카드 맨 위 한 줄 전체(44px 넘게) · 접힌 때·펼친 때 같은 자리 · 접힌 줄 어디를 눌러도 펼침(▶만 예외)
//  ② 🛰 '지금 실행 중 0건'인데 멈춤(확인 대기) 송장 입력 카드가 남음 → 다른 맡김에서 다 입력됐으면 '끝 — 다른 맡김에서 입력됨' + 문서에 superseded 기록(트랜잭션 · 지우지 않음)
//  ③ '발송 요청에 있는 알라딘·예스24·현금 주문을 전부/개별 선택 · 그날 제외' → 📋 이번에 묶을 주문 · 하루 문서(누가·언제) · 다음 날 저절로 풀림 · 원스톱 묶음(P1)·남은 주문이 지킴 · ⏸ 오늘 원스톱에서 뺌 n건
//  ④ '출고별 매출 상품 카드에 사진이 모두 안 나와 · 마우스오버하면 앞면·뒷면·옆면 크게' → 열쇠 짝(같은 주문 출고 기록의 listingId) · 받는 중이면 끝난 뒤 다시 그림 · 큰 보기(화면 안 · 없는 면 '없음') · 휴대폰은 누르면
// 시험 자료 손님은 '손님A'… · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const seedAll = async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = () => new Date().toISOString(); window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true;
  try { ['rn-shp-one-fold', 'rn-ship-first', 'rn-ship-src'].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  S.pbooks = S.pbooks || new Map(); S.pbooks.set('bkF', { id: 'bkF', images: { front: { src: 'https://example.invalid/f-front.jpg' }, back: { src: 'https://example.invalid/f-back.jpg' }, spine: { src: 'https://example.invalid/f-spine.jpg' } } }); S.pbooks.set('bkG', { id: 'bkG', images: { front: { src: 'https://example.invalid/g-front.jpg' } } });
  S.plist.set('aladin_UF1', { id: 'aladin_UF1', usedCode: 'UF1', listingId: '7001', bookId: 'bkF', title: '사진 책 하나', active: true, qty: 1, price: 5000, grade: '상', sku: 'PNKFX2' });
  S.plist.set('aladin_UG1', { id: 'aladin_UG1', usedCode: 'UG1', listingId: '7002', bookId: 'bkG', title: '사진 책 둘', active: true, qty: 1, price: 6000, grade: '상', sku: 'PNKFX3' }); S.ver++;
  const it = (t, p, lid) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNKFX2', grade: '상' });
  S.shipC = { orders: [], at: now(), enrich: {} }; S.shipCFromCache = false;
  S.ship = { orders: [{ orderNo: 'A-01', buyer: '손님A', orderedAt: '2026-11-04 09:00', recipient: { name: '손님A' }, items: [it('사진 책 하나', 5000, '7001')] }, { orderNo: 'A-02', buyer: '손님B', orderedAt: '2026-11-04 09:10', recipient: { name: '손님B' }, items: [it('파란 책', 6000, '7003')] }, { orderNo: 'K-1', buyer: '손님D', orderedAt: '2026-11-04 09:20', recipient: { name: '손님D' }, items: [it('노랑 책', 4000, '7004')] }], tabCounts: { '발송 요청': 3 }, at: now() }; S._shipLive = 1;
  await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship)));
  /* 지난 출고일(11/02) — 주문 기록 상품 줄에 U코드·listingId가 없음(열쇠 짝이 안 맞던 경우) · 하루 출고 기록(배송&구매확정전에서 읽은 줄)에는 listingId가 있음 */
  const ao = (no, t, p) => putOrder('aladin_' + no, { id: 'aladin_' + no, platform: 'aladin', kind: 'sale', orderNo: no, orderedAt: '2026-11-01 10:00', shippedAt: '2026-11-02', buyer: { name: '손님C' }, recipient: { name: '손님C' }, items: [{ title: t, qty: 1, price: p, lineStatus: 'normal' }] });
  ao('P-1', '사진 책 하나', 5000); ao('P-2', '사진 책 둘', 6000);
  await db.collection('shp_days').doc('2026-11-02').set({ day: '2026-11-02', source: 'tab', entries: [{ id: 'aladin_P-1', orderNo: 'P-1', ex: [], items: [{ title: '[중고-상] 사진 책 하나', qty: 1, price: 5000, listingId: '7001' }] }, { id: 'aladin_P-2', orderNo: 'P-2', ex: [], items: [{ title: '사진 책 둘', qty: 1, price: 6000, listingId: '7002' }] }], readAt: now() });
  try { loadShipDays(); } catch (e) {} S._saleIdx = null; S._sdm = null; S.ver++; bump('o'); await W(500); S._shipRowsC = null; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1500); await eval('(' + seedSrc + ')')(); const sh = () => document.getElementById('sheet'); const FS = window.__FS; const ago = (m) => new Date(Date.now() - m * 60e3).toISOString(); try {
    let calls = 0; window.shipOneShot = async () => { calls++; return null; };
    /* ① 접기 줄 */
    S.shipTab = 'deliv'; await openShip(); await W(600);
    const hdOf = () => { const c = document.getElementById('shp_one'); const h = document.getElementById('shp_onefold'); if (!c || !h) return null; const a = c.getBoundingClientRect(), b = h.getBoundingClientRect(); return { first: [...c.children].filter((x) => getComputedStyle(x).display !== 'none')[0] === h, top: Math.round(b.top - a.top), h: Math.round(b.height), wR: Math.round(b.width / a.width * 100), fold: c.classList.contains('fold'), fx: Math.round((h.querySelector('.shp-fx') || h).getBoundingClientRect().right - a.right), txt: h.innerText.replace(/\s+/g, ' ').slice(0, 60) }; };
    o.f0 = hdOf(); const sp = document.querySelector('#shp_onefold .shp-onehs') || document.getElementById('shp_onefold'); sp.click(); await W(400); o.f1 = hdOf();
    document.getElementById('shp_oneshot').click(); await W(100); document.getElementById('shp_oneshot').click(); await W(300); o.f2 = { ...hdOf(), calls };
    document.querySelector('#shp_onefold .shp-onehs').click(); await W(400); o.f3 = hdOf();
    /* ② 멈춘 맡김 끝 처리 */
    const items = (L, st) => L.map((n, i) => ({ orderNo: n, invoice: '24000000' + (100 + i), state: typeof st === 'function' ? st(i) : st }));
    await db.collection('shp_invoices').doc('i6VCpaus01').set({ createdAt: ago(40), status: 'paused', pausedAt: ago(38), pauseWhy: '첫 건 확인 대기', claim: { pc: 'HOME', at: ago(39) }, items: items(['O1', 'O2', 'O3'], (i) => (i ? 'todo' : 'done')), log: [{ at: ago(38), lv: 'warn', m: '첫 건 확인 대기' }] });
    await db.collection('shp_invoices').doc('alps_913b_x').set({ createdAt: ago(39), status: 'queued', items: items(['O1', 'O2', 'O3'], 'todo'), log: [{ at: ago(39), lv: 'info', m: '맡김 만듦' }] });
    await db.collection('shp_invoices').doc('M6HRdone01').set({ createdAt: ago(36), status: 'done', doneAt: ago(30), claim: { pc: 'MJ-MAIN', at: ago(35) }, items: items(['O1', 'O2', 'O3'], 'done') });
    await db.collection('shp_invoices').doc('keepPaus01').set({ createdAt: ago(20), status: 'paused', pausedAt: ago(19), pauseWhy: '첫 건 확인 대기', items: items(['K-1'], 'todo') }); /* 아직 발송 요청에 있고 아무 데서도 안 넣음 — 그대로 멈춤 */
    await db.collection('shp_invoices').doc('movedPau01').set({ createdAt: ago(25), status: 'paused', pausedAt: ago(24), pauseWhy: '첫 건 확인 대기', items: items(['Z-9'], 'todo') }); /* 발송 요청에서 이미 넘어감 */
    S.ship = { ...S.ship, at: new Date().toISOString() }; S._invL = false; loadInvBatch(); await W(1200); shipLivePaint(); await W(1500);
    const rows = shipLiveRows(); const rw = (id) => rows.find((x) => x.id === 'inv:' + id) || {};
    o.sup = ['i6VCpaus01', 'alps_913b_x', 'keepPaus01', 'movedPau01'].map((id) => { const r = rw(id); const d = (FS.shp_invoices || {})[id] || {}; return { id, st: r.st, stl: r.stl, bad: !!r.bad, act: !!r.act, docSt: d.status, by: d.supersededBy || null, at: !!d.supersededAt, prev: d.prevStatus || null, log: (d.log || []).length }; });
    o.supCard = (document.querySelector('[data-shl="inv:i6VCpaus01"]') || {}).innerText || ''; o.supSteps = [...(document.querySelectorAll('[data-shl="inv:i6VCpaus01"] .shl-stp li') || [])].map((x) => x.className).join(','); o.nAct = rows.filter((x) => x.act).length; o.probs = shipLiveProblems().map((x) => x.id);
    /* ③ 고르기·하루 제외 */
    await openShip(); await W(600); const pick = document.getElementById('os_pick'); o.pick0 = pick ? { n: pick.querySelectorAll('[data-osxk]').length, chk: pick.querySelectorAll('[data-osxk]:checked').length, sum: pick.querySelector('summary').innerText, above: !!(pick.closest('#os_pickw') && pick.closest('#os_pickw').nextElementSibling && pick.closest('#os_pickw').nextElementSibling.id === 'os_box'), txt: pick.textContent.replace(/\s+/g, ' ') } : null;
    if (pick) { pick.open = true; const c = pick.querySelector('[data-osxk="al:A-02"]'); if (c) { c.click(); } } await W(700);
    const day = osDay(); const xd = () => ((FS.shp_runs || {})['_osx_' + day] || {}); o.x1 = { k: (xd().keys || {})['al:A-02'] || null, keep: osKeepOs().map((x) => x.orderNo).sort(), keepAll: osKeep().map((x) => x.orderNo), pend: (await osPending(null)).al.map((x) => x.orderNo), sum: (document.querySelector('#os_pick summary') || {}).innerText || '', noDay: !('day' in xd()), me: S.user.email };
    document.querySelector('#os_pick [data-osx="none"]').click(); await W(600); o.x2 = { keep: osKeepOs().length, n: osxSet().size, sum: (document.querySelector('#os_pick summary') || {}).innerText || '' };
    document.querySelector('#os_pick [data-osx="all"]').click(); await W(600); o.x3 = { keep: osKeepOs().length, n: osxSet().size, kept: Object.values(xd().keys || {}).length, offBy: ((xd().keys || {})['al:A-02'] || {}).by, log: (xd().log || []).length };
    /* 원스톱 묶음(P1)이 지킴 — 도우미·엑셀·예스24/현금 후보는 흉내 */
    await osxPut(['al:A-02', 'y24:Y-1'], true, { 'al:A-02': '파란 책', 'y24:Y-1': '예스 책' }); await W(300);
    const keep0 = alpsBuild, f0 = alpsFetch, x0 = alpsXCand, n0 = needXLSX, p0 = osPut; let cap = null, put = null;
    alpsFetch = async () => ({ ok: true, run: null }); needXLSX = async () => {}; alpsXCand = () => { const L = [{ src: 'y24', key: 'y24:Y-1', o: { orderNo: 'Y-1', items: [{ title: '예스 책', price: 9000 }] } }, { src: 'cash', key: 'cash:c1', o: { orderNo: '현금-c1', items: [{ title: '현금 책', price: 3000, qty: 1 }] } }]; return { all: L, ok: L, no: [] }; };
    alpsBuild = (X, keep, xs) => { cap = { keep: keep.map((x) => x.orderNo), xs }; return null; }; osPut = async (id, patch, line) => { put = { patch, line }; };
    try { await OS_FN.P1({ id: 'tst', bt: [], mode: 'local' }); o.pend2 = await osPending(null); o.pick2 = osPickRows().map((r) => r.k + (r.ex ? '!' : '')).join(','); } finally { alpsBuild = keep0; alpsFetch = f0; alpsXCand = x0; needXLSX = n0; osPut = p0; }
    o.p1 = { cap, line: put && put.line }; o.pend2 = { al: o.pend2.al.map((x) => x.orderNo), y24: o.pend2.y24, cash: o.pend2.cash };
    /* ⏸ 오늘 원스톱에서 뺌 — 🆕 다음에 할 것과 따로 */
    await db.collection('shp_runs').doc(day + '_1').set({ id: day + '_1', day, n: 1, status: 'done', ph: 'END', createdAt: ago(60), doneAt: ago(50), bt: [{ n: 1, al: ['A-01'], y24: [] }] }); S.os.runsUn = null; osRunsWatch(); await W(500); S._shipRowsC = null;
    const fl = document.createElement('div'); fl.innerHTML = shipFlowHtml(shipCnt().all, 'all'); o.flow = (fl.querySelector('#shp_osdone') || {}).textContent || ''; /* (정범님 11/05 밤 '업데이트 후 아까 출고건이 또 떴어') 남은 일 없이 끝나고 숨김 시간이 지난 회차는 요약을 다시 안 보임 · 「진행 보기」면 보임 */ { const r0 = osRunsToday, s0 = shipRows; const R1 = { id: 'old1', day, n: 1, status: 'done', ph: 'END', createdAt: new Date(Date.now() - 7.2 * 3600e3).toISOString(), doneAt: new Date(Date.now() - 7 * 3600e3).toISOString(), bt: [{ n: 1, al: ['A-01'], y24: [] }] }; try { osRunsToday = () => [R1]; shipRows = () => [{ key: 'al:A-01', src: 'al', stage: 'done' }, { key: 'al:N-1', src: 'al', stage: 'deliv' }]; const f2 = document.createElement('div'); f2.innerHTML = shipFlowHtml({ deliv: 1, done: 1 }, 'all'); S.osShowDone = 'old1'; const f3 = document.createElement('div'); f3.innerHTML = shipFlowHtml({ deliv: 1, done: 1 }, 'all'); S.osShowDone = null; shipRows = () => [{ key: 'al:A-01', src: 'al', stage: 'deliv' }]; const f4 = document.createElement('div'); f4.innerHTML = shipFlowHtml({ deliv: 1 }, 'all'); o.old = { hid: !f2.querySelector('#shp_osdone'), txt: f2.textContent.replace(/\s+/g, ' ').slice(0, 120), show: !!f3.querySelector('#shp_osdone'), leftKeep: !!f4.querySelector('#shp_osdone') }; } finally { osRunsToday = r0; shipRows = s0; } }
    /* 다음 날 저절로 풀림 — 하루 문서 id가 날짜 · 어제 문서는 안 봄 */
    const yd = String(+day - 1); await db.collection('shp_runs').doc('_osx_' + yd).set({ kday: yd, keys: { 'al:A-01': { on: true, by: 'tester@x', at: ago(1440) } } }); S.os.xDay = yd; S.os.x = { 'al:A-01': { on: true } }; o.next = { set: [...osxSet()].join(','), keep: osKeepOs().map((x) => x.orderNo).sort().join(',') };
    await osxPut(['al:A-02', 'y24:Y-1'], false, {}); await W(300);
    /* ④ 사진 키 짝 · 받는 중이면 끝난 뒤 다시 그림 · 큰 보기 */
    const ent = { id: 'aladin_P-1', orderNo: 'P-1', items: [] }; o.key = { lid: shipItemL({ title: '사진 책 하나' }, 'P-1').lid, img: shipItemImg({ title: '사진 책 하나' }, 'P-1'), direct: shipItemImg({ title: 'x', aladinUsedCode: 'UF1' }), none: shipItemImg({ title: '없는 책' }, 'P-9') }; void ent;
    const pl = S.plist.get('aladin_UF1'); S.plist.delete('aladin_UF1'); S.plistByLid = null; S.prodLoaded = false; S.prodBusy = true;
    history.back(); await W(300); openShipDayView('2026-11-02'); await W(700); o.busy0 = [...sh().querySelectorAll('#ss_list .ss-it')].map((x) => (x.querySelector('img.ss-ph') ? 'img' : 'none')).join(',');
    S.plist.set('aladin_UF1', pl); S.plistByLid = null; S.prodLoaded = true; S.prodBusy = false; await W(1800);
    o.busy1 = [...sh().querySelectorAll('#ss_list .ss-it')].map((x) => { const im = x.querySelector('img.ss-ph'); return im ? im.getAttribute('src').replace(/.*\//, '') + (im.dataset.pz ? '+z' : '') + (im.loading === 'lazy' ? '+lazy' : '') : 'none'; }).join(',');
    return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, seedAll.toString());
  console.log(JSON.stringify(R).slice(0, 4000));
  ok(!R.err, '시험 중 오류 없음 ' + (R.err || ''));
  const F = [R.f0, R.f1, R.f2, R.f3]; ok(F.every((x) => x && x.first && x.h >= 44 && x.wR >= 98), '접기 자리 = 카드 맨 위 한 줄 전체(높이 44px 넘게 · 너비 98% 넘게): ' + F.map((x) => x && `${x.h}px/${x.wR}%`).join(' · '));
  ok(R.f0 && !R.f0.fold && R.f1.fold && R.f2.fold && !R.f3.fold && R.f2.calls === 1, '펼친 때 줄 누르면 접힘 · 접힌 줄 누르면 펼침 · ▶ 단추만 예외(원스톱 시작 · 안 펼침): ' + F.map((x) => x && x.fold).join(',') + ' calls ' + (R.f2 && R.f2.calls));
  ok(F.every((x) => x && x.top === F[0].top && Math.abs(x.fx - F[0].fx) <= 2), '접힌 때·펼친 때 같은 자리(줄 위치·▾/▴ 글자 오른쪽 끝): ' + F.map((x) => x && `${x.top}/${x.fx}`).join(' · '));
  const sp = Object.fromEntries((R.sup || []).map((x) => [x.id, x]));
  ok(sp.i6VCpaus01 && sp.i6VCpaus01.st === 'superseded' && /끝 — 다른 맡김에서 입력됨\(M6HRdone\)/.test(sp.i6VCpaus01.stl) && !sp.i6VCpaus01.bad && sp.i6VCpaus01.docSt === 'superseded' && sp.i6VCpaus01.by === 'M6HRdone01' && sp.i6VCpaus01.at && sp.i6VCpaus01.prev === 'paused' && sp.i6VCpaus01.log >= 2, '멈춤(확인 대기) 맡김 → 끝 — 다른 맡김에서 입력됨(앞 8자) · 문서 superseded·supersededBy·supersededAt·prevStatus · 기록 줄 덧붙임(지우지 않음): ' + JSON.stringify(sp.i6VCpaus01));
  ok(sp.alps_913b_x && sp.alps_913b_x.docSt === 'superseded' && sp.alps_913b_x.by === 'M6HRdone01' && sp.alps_913b_x.prev === 'queued', '맡을 PC 없는 대기 맡김도 같은 주문이 다 들어갔으면 끝: ' + JSON.stringify(sp.alps_913b_x));
  ok(sp.movedPau01 && sp.movedPau01.docSt === 'superseded' && sp.movedPau01.by === null, '주문이 발송 요청에서 이미 넘어간 멈춤 맡김도 끝(다른 맡김 없음): ' + JSON.stringify(sp.movedPau01));
  ok(sp.keepPaus01 && sp.keepPaus01.docSt === 'paused' && sp.keepPaus01.st === 'paused', '아직 발송 요청에 있고 아무 데서도 안 넣은 멈춤은 그대로: ' + JSON.stringify(sp.keepPaus01));
  ok(/끝 — 다른 맡김에서 입력됨\(M6HRdone\)/.test(R.supCard) && R.supSteps.split(',').slice(-1)[0] === 'ok' && !/하는 중/.test(R.supCard.split('\n').slice(0, 3).join(' ')) && !R.probs.some((x) => /i6VC|913b|movedPau/.test(x)) && R.nAct === 0, '카드 단계 표시도 끝 · 하는 중 수 0 · 문제로 세지 않음: ' + R.supSteps + ' · probs ' + R.probs.join(','));
  ok(R.pick0 && R.pick0.n === 2 && R.pick0.chk === 2 && /이번에 묶을 주문 2건/.test(R.pick0.sum) && R.pick0.above && /…A-01|A-01/.test(R.pick0.txt) && /사진 책 하나/.test(R.pick0.txt) && /5,000/.test(R.pick0.txt), '📋 이번에 묶을 주문(원스톱 진행 칸 위 · 판매처·끝 6자리·상품명·금액 · 기본 모두 체크): ' + JSON.stringify(R.pick0));
  ok(R.x1 && R.x1.k && R.x1.k.on === true && R.x1.k.by === R.x1.me && R.x1.k.at && R.x1.keep.join() === 'A-01,K-1' && R.x1.keepAll.length === 3 && R.x1.pend.join() === 'A-01' && /⏸ 오늘 원스톱에서 뺌 1건/.test(R.x1.sum) && R.x1.noDay, '하나 빼기 → 하루 문서(누가·언제) · 원스톱 묶을 주문·남은 주문에서 빠짐 · 오늘 출고 목록은 그대로: ' + JSON.stringify(R.x1));
  ok(R.x2.keep === 1 && R.x2.n === 2 && /⏸ 오늘 원스톱에서 뺌 2건/.test(R.x2.sum) && R.x3.keep === 3 && R.x3.n === 0 && R.x3.kept === 2 && R.x3.log >= 3, '「모두 빼기」·「모두」 — 다시 넣어도 기록은 남김(on:false · 지우지 않음): ' + JSON.stringify([R.x2, R.x3]));
  ok(R.p1.cap && R.p1.cap.keep.join() === 'A-01' && R.p1.cap.xs.join() === 'cash:c1' && R.pend2.al.join() === 'A-01' && R.pend2.y24 === 0 && R.pend2.cash === 1 && /al:A-02!/.test(R.pick2) && /y24:Y-1!/.test(R.pick2), '원스톱 묶음 정하기(P1)·남은 주문이 오늘 뺀 알라딘·예스24 주문을 묶지 않음: ' + JSON.stringify([R.p1, R.pend2, R.pick2]));
  ok(/⏸ 오늘 원스톱에서 뺌 1건/.test(R.flow) && /다음에 할 것 1건/.test(R.flow), "뺀 주문(A-02)은 '🆕 다음에 할 것'(K-1만 1건)에 안 셈 · '🆕 다음에 할 것'이 아니라 '⏸ 오늘 원스톱에서 뺌'으로: " + R.flow);
    ok(R.old && R.old.hid && R.old.show && R.old.leftKeep, '(정범님 11/05 밤) 끝나고 숨김 시간이 지난 원스톱 회차는 다시 안 보임(새로고침·새 판 뒤에도) · 「진행 보기」면 보임 · 남은 일이 있으면 계속 보임 ' + JSON.stringify(R.old));
  ok(R.next.set === '' && R.next.keep === 'A-01,A-02,K-1', '다음 날 저절로 풀림(어제 문서는 안 봄): ' + JSON.stringify(R.next));
  ok(R.key.lid === '7001' && /f-front\.jpg/.test(R.key.img) && /f-front\.jpg/.test(R.key.direct) && R.key.none === '', '사진 키 짝 — 주문 줄에 열쇠가 없어도 같은 주문 출고 기록의 listingId로 · U코드 그대로도: ' + JSON.stringify(R.key));
  ok(/none/.test(R.busy0) && /f-front\.jpg\+z\+lazy/.test(R.busy1) && /g-front\.jpg\+z\+lazy/.test(R.busy1), '우리 상품 기록을 받는 중이면 끝난 뒤 다시 그려 사진이 나옴(lazy · 큰 보기 달림): ' + R.busy0 + ' → ' + R.busy1);
  /* 큰 보기 — 마우스 올리기(PC) */
  const im = await p.$('#ss_list img.ss-ph'); await im.hover(); await p.waitForTimeout(400);
  const Z = await p.evaluate(() => { const z = document.getElementById('pzbox'); if (!z) return null; const r = z.getBoundingClientRect(); return { on: z.style.display === 'block', tap: z.className === 'tap', faces: [...z.querySelectorAll('.pz-f')].map((f) => f.querySelector('figcaption').textContent + ':' + (f.querySelector('img') ? f.querySelector('img').getAttribute('src').replace(/.*\//, '') : '없음')).join(','), inV: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
  await p.mouse.move(5, 5); await p.waitForTimeout(300); const Z2 = await p.evaluate(() => (document.getElementById('pzbox') || {}).style.display);
  const im2 = (await p.$$('#ss_list img.ss-ph'))[1]; await im2.hover(); await p.waitForTimeout(400); const Z3 = await p.evaluate(() => [...document.querySelectorAll('#pzbox .pz-f')].map((f) => f.querySelector('figcaption').textContent + ':' + (f.querySelector('img') ? 'img' : (f.querySelector('.pz-no') || {}).textContent)).join(','));
  ok(Z && Z.on && !Z.tap && Z.faces === '앞면:f-front.jpg,뒷면:f-back.jpg,옆면:f-spine.jpg' && Z.inV, '마우스를 올리면 앞면·뒷면·옆면 크게(화면 안): ' + JSON.stringify(Z));
  ok(Z2 === 'none' && /뒷면:없음/.test(Z3) && /옆면:없음/.test(Z3) && /앞면:img/.test(Z3), "마우스를 떼면 닫힘 · 사진 없는 면은 '없음': " + Z2 + ' · ' + Z3);
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  const C = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); history.back(); await W(300); S.shipTab = 'deliv'; await openShip(); await W(700); const im = document.querySelector('.shp-img img[data-pz]'); return { n: document.querySelectorAll('.shp-img img[data-pz]').length, ok: !!im }; });
  const imc = await p.$('.shp-img img[data-pz]'); if (imc) { await imc.hover(); await p.waitForTimeout(400); }
  const C2 = await p.evaluate(() => { const z = document.getElementById('pzbox'); return z ? { on: z.style.display === 'block', faces: [...z.querySelectorAll('.pz-f img')].length } : null; });
  ok(C.ok && C2 && C2.on && C2.faces === 3, '오늘 출고 상품 카드 사진에도 같은 큰 보기: ' + JSON.stringify([C, C2]));
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js'));
  /* ⑤ (추가 지시) 📦 ALPS 접고 펴기 · 상태 한 줄 · 다시 그려도 유지 · 이 화면 열고 닫기 기기 기억(rn-ship-open) · 출고 마감 시각 저장(ship.cutTime) */
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; try { localStorage.setItem('rn-ship-open', JSON.stringify({ 'd:2000-01-01:shl:old': 1 })); } catch (e) {} S._sho = null; await W(1500); await eval('(' + seedSrc + ')')(); window.shipOneShot = async () => null; const FS = window.__FS; const LS = () => { try { return JSON.parse(localStorage.getItem('rn-ship-open') || '{}'); } catch (e) { return {}; } }; try {
    await db.collection('app_settings').doc('main').set({ ship: { cutTime: '14:00', dayCut: { '2026-11-01': '13:00' } } }, { merge: true }); S.app.ship = { ...(S.app.ship || {}), cutTime: '14:00', dayCut: { '2026-11-01': '13:00' } };
    S.shipTab = 'deliv'; localStorage.setItem('rn-ship-alt', 'alps'); /* (11/05) 📦 ALPS 칸은 ▾ 다른 방법으로 ALPS를 고르면 끝까지 카드 안에 */ await openShip(); await W(700); const box = () => document.getElementById('alps_box'); const hd = () => document.getElementById('alps_fold');
    o.a0 = { has: !!hd(), h: hd() ? Math.round(hd().getBoundingClientRect().height) : 0, fold: box() && box().classList.contains('fold'), body: box() ? box().querySelector('.alps-body').offsetHeight : -1, txt: hd() ? hd().innerText.replace(/\s+/g, ' ') : '' };
    hd().querySelector('.alps-hs').click(); await W(300); o.a1 = { fold: box().classList.contains('fold'), body: box().querySelector('.alps-body').offsetHeight, ls: LS().alps, fx: hd().querySelector('.shp-fx').textContent, oldGone: !('d:2000-01-01:shl:old' in LS()) };
    S.alps.st = { id: 'rX', status: 'run', detail: '운송장 출력 중', steps: [] }; alpsProgPaint(); await W(300); o.a2 = { fold: box().classList.contains('fold'), dot: !!hd().querySelector('.alps-dot'), txt: hd().querySelector('.alps-hs').textContent };
    await openShip(); await W(600); o.a3 = { fold: box().classList.contains('fold'), dot: !!hd().querySelector('.alps-dot'), txt: hd().querySelector('.alps-hs').textContent }; S.alps.st = null;
    /* 다른 열고 닫기 — ⚙ 판매처 설정 · 원스톱 카드 접기 · 🛰 진행 카드 숨기기 */
    const sf = document.getElementById('shp_setf'); sf.open = true; await W(300); document.getElementById('shp_onefold').click(); await W(400); S._sho = null; /* 다시 연 것처럼 기기 저장에서 다시 읽음 */ await openShip(); await W(600);
    o.k = { set: !!(document.getElementById('shp_setf') || {}).open, one: (document.getElementById('shp_one') || { classList: { contains: () => false } }).classList.contains('fold'), alps: box() ? box().classList.contains('fold') : LS().alps === 1, ls: LS() }; /* (11/05) ALPS 칸은 끝까지 카드 안 — 카드를 접으면 함께 숨고 기억(rn-ship-open.alps)은 그대로 */
    document.getElementById('shp_onefold').click(); await W(400);
    /* 출고 마감 시각 */
    const cut = document.getElementById('shp_cut'); o.c0 = cut ? cut.value : null; cut.value = '25:00'; document.getElementById('shp_cut_s').click(); await W(400); o.c1 = ((FS.app_settings || {}).main || {}).ship.cutTime;
    document.getElementById('shp_cut').value = '15:30'; document.getElementById('shp_cut_s').click(); await W(600); const M = (FS.app_settings || {}).main || {}; o.c2 = { cut: (M.ship || {}).cutTime, day: ((M.ship || {}).dayCut || {})['2026-11-01'], opt: shipOpt().cutTime, log: (M.shipCutLog || []).length, guide: /dayCut|출고별 매출/.test((document.getElementById('shp_setf') || {}).textContent || '') };
    return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, seedAll.toString());
  console.log(JSON.stringify(R).slice(0, 3000));
  ok(!R.err, '시험 중 오류 없음(⑤) ' + (R.err || ''));
  ok(R.a0 && R.a0.has && R.a0.h >= 44 && !R.a0.fold && R.a0.body > 0 && /ALPS 자동 처리/.test(R.a0.txt), '📦 ALPS 칸 머리 줄(손가락 크기) · 처음은 펼침: ' + JSON.stringify(R.a0));
  ok(R.a1 && R.a1.fold && R.a1.body === 0 && R.a1.ls === 1 && /펼치기/.test(R.a1.fx) && R.a1.oldGone, '머리 줄 누르면 접힘 · 이 기기에 기억(rn-ship-open.alps) · 지난 날 카드 세부 기억은 버림: ' + JSON.stringify(R.a1));
  ok(R.a2.fold && R.a2.dot && /진행 중 — 운송장 출력 중/.test(R.a2.txt) && R.a3.fold && R.a3.dot && /진행 중/.test(R.a3.txt), '진행 중이면 저절로 펴지 않고 빨간 점 · 접힌 줄에 상태 한 줄 · 다시 그려도 접힌 채: ' + JSON.stringify([R.a2, R.a3]));
  ok(R.k.set && R.k.one && R.k.alps && R.k.ls.set === 1 && R.k.ls.one === 1, '⚙ 판매처 설정·원스톱 카드 접기도 한 키(rn-ship-open)에 — 다시 열어도 그대로: ' + JSON.stringify(R.k));
  ok(R.c0 === '14:00' && R.c1 === '14:00' && R.c2.cut === '15:30' && R.c2.day === '13:00' && R.c2.opt === '15:30' && R.c2.log >= 1 && R.c2.guide, '🕑 출고 마감 시각 — 틀린 값은 안 받음 · ship.cutTime에 저장(날짜별 dayCut 그대로 · 기록 남김) · 날짜별은 출고별 매출 안내: ' + JSON.stringify([R.c0, R.c1, R.c2]));
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async (seedSrc) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await W(1500); await eval('(' + seedSrc + ')')(); window.shipOneShot = async () => null; S.shipTab = 'deliv'; await openShip(); await W(700); const h = document.getElementById('shp_onefold'); const r = h.getBoundingClientRect(); const sh = document.getElementById('sheet');
    const o = { h: Math.round(r.height), doc: document.documentElement.scrollWidth - innerWidth, sheet: sh.scrollWidth - sh.clientWidth }; history.back(); await W(300); openShipDayView('2026-11-02'); await W(800); return o; }, seedAll.toString());
  await p.tap('#ss_list img.ss-ph'); await p.waitForTimeout(400);
  const Z = await p.evaluate(() => { const z = document.getElementById('pzbox'); const r = z ? z.getBoundingClientRect() : null; return z ? { on: z.style.display === 'block', tap: z.className === 'tap', faces: z.querySelectorAll('.pz-f').length, inV: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight } : null; });
  await p.tap('#pzbox [data-pzx]'); await p.waitForTimeout(300); const Z2 = await p.evaluate(() => (document.getElementById('pzbox') || {}).style.display);
  console.log(JSON.stringify([R, Z, Z2]));
  ok(R.h >= 44 && R.doc <= 0 && R.sheet <= 0, '360px: 접기 줄 높이 손가락 크기 · 가로 넘침 없음: ' + JSON.stringify(R));
  ok(Z && Z.on && Z.tap && Z.faces === 3 && Z.inV && Z2 === 'none', '휴대폰: 사진을 누르면 큰 보기(길게 누르기 아님 · 화면 안) · ✕로 닫힘: ' + JSON.stringify([Z, Z2]));
  console.log(bad ? `❌ tFX2 실패 ${bad}` : '✓ tFX2 통과');
}, { vp: { width: 360, height: 760 }, touch: true })));
