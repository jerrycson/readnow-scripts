// tLOSTCX — 정범님 11/10
//  ① '등록의 검색 기능이 안 돼' — 📥 등록 🔎 넣고 조회 검색창이 실제 키보드로 되는지(상품명 Enter · 바코드 스캐너 · Alt+S · 넣기 단추 · 한글 붙여 넣기 · 늘 포커스)
//  ② 🚚 출고 검색창: 덜 친 낱말('수수')은 정확 맞춤 그대로 '없음' 대신 '정확히 맞는 것 없음 — 낱말 앞부분으로 맞는 n개 보기' · 누르면 앞부분 맞춤 · '정확히 ›'로 돌아감 · 글을 바꾸면 다시 정확
//  ③ 🔎 소재불명(수색중) 상품을 ✖ 이 상품 주문 취소 — 사건은 그대로 · '주문 취소 맡김/취소됨' 표시 · 품절 취소면 소재불명 판매 처리가 알라딘 판매 상태를 다시 바꾸지 않음
//     · 취소된 주문 줄은 '이미 팔려 나갔을 수 있음' 근거가 아님 · 고객 취소(사유 1)는 막지 않음
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tLOSTCX.js (pw/ 안 — harness.js 옆)
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); if (!c) bad++; };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  // ── ① 등록 검색창
  await p.evaluate(async () => { S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true; S.regT = 'q'; openRegister(); });
  await p.waitForTimeout(1500);
  const rq = () => p.evaluate(() => ({ act: document.activeElement && document.activeElement.id, q: [...S.regItems.values()].filter((x) => x.stage === 'q').map((x) => x.q || x.isbn), v: (document.getElementById('rg_in') || {}).value }));
  await p.click('#rg_in'); await p.keyboard.type('수수께끼', { delay: 60 }); await p.keyboard.press('Enter'); await p.waitForTimeout(700); const r1 = await rq();
  ok(r1.q.includes('수수께끼') && r1.v === '' && r1.act === 'rg_in', '등록 검색창: 상품명 + Enter → 조회 대기 · 칸 비움 · 커서 그대로', r1);
  await p.keyboard.type('9788936434120', { delay: 8 }); await p.waitForTimeout(700); const r2 = await rq();
  ok(r2.q.includes('9788936434120') && r2.v === '', '바코드 스캐너(빠른 글자) → Enter 없이 조회 대기', r2);
  await p.mouse.click(700, 880); await p.keyboard.press('Alt+s'); await p.waitForTimeout(300); const r3 = await rq(); ok(r3.act === 'rg_in', 'Alt+S → 검색창에 커서', r3);
  await p.keyboard.type('톨레 지금', { delay: 40 }); await p.click('#rg_add'); await p.waitForTimeout(700); await p.focus('#rg_in'); await p.keyboard.insertText('어린왕자'); await p.keyboard.press('Enter'); await p.waitForTimeout(700); const r4 = await rq();
  ok(r4.q.includes('톨레 지금') && r4.q.includes('어린왕자'), '넣기 단추 · 한글 한 번에 넣기(입력기) + Enter', r4);
  await p.evaluate(() => regSaveCfg({ focus: true }).then(regRerender)); await p.waitForTimeout(700); await p.mouse.click(700, 880); await p.waitForTimeout(200); await p.keyboard.type('9791190000001', { delay: 8 }); await p.waitForTimeout(800); const r5 = await rq();
  ok(r5.q.includes('9791190000001'), '늘 포커스: 빈 곳을 누른 뒤 바코드도 검색창으로', r5);
  // 알라딘 창(📥 등록 카드에서 연 것) 안을 누른 뒤 마우스가 밖으로 나오면 커서가 창 틀로 옮겨 감(1.78.454 Esc 되돌림) → 예전엔 거기 멈춰 바코드가 사라짐
  await p.evaluate(() => { const d = document.createElement('div'); d.className = 'alpv'; d.id = 'tAlpv'; d.innerHTML = '<iframe src="about:blank" style="width:300px;height:200px"></iframe><input id="tAlpvIn">'; d.style.cssText = 'position:fixed;right:0;top:100px;z-index:99999;background:#fff'; document.body.appendChild(d); d.querySelector('iframe').focus(); });
  await p.waitForTimeout(150); await p.mouse.move(300, 500); await p.mouse.move(310, 520); await p.waitForTimeout(200); const a0 = await p.evaluate(() => document.activeElement.className);
  await p.keyboard.type('9791190000002', { delay: 8 }); await p.waitForTimeout(800); const r6 = await rq();
  ok(a0 === 'alpv' && r6.q.includes('9791190000002') && r6.act === 'rg_in', '알라딘 창 안을 누른 뒤(커서가 창 틀로) 바코드 → 검색창으로 · 조회 대기', { a0, r6 });
  await p.evaluate(() => { document.getElementById('tAlpv').focus(); regRerender(); }); await p.waitForTimeout(700); const r7 = await rq(); ok(r7.act === 'rg_in', '다시 그림: 알라딘 창 틀에 있던 커서를 검색창으로 되돌림', r7);
  await p.focus('#tAlpvIn'); await p.keyboard.type('abc', { delay: 20 }); await p.evaluate(() => regRerender()); await p.waitForTimeout(700); const r8 = await p.evaluate(() => ({ act: document.activeElement.id, v: document.getElementById('tAlpvIn').value }));
  ok(r8.act === 'tAlpvIn' && r8.v === 'abc', '알라딘 창 안 글 칸에서 치는 글은 그대로(커서 안 빼앗음 — 11/10 판 고침 유지)', r8);
  await p.evaluate(() => document.getElementById('tAlpv').remove());
  await p.evaluate(() => regSaveCfg({ focus: false })); await p.waitForTimeout(200);

  // ── ②③ 출고
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const FS = window.__FS; window.ask = async () => true; S.prodLoaded = true; const sh = () => document.getElementById('sheet');
    const A = [...S.plist.values()]; const now = new Date().toISOString(); const twice = async (sel, w) => { const b1 = sh().querySelector(sel); if (!b1) return false; b1.click(); await W(500); const b2 = sh().querySelector(sel); if (b2) b2.click(); await W(w || 900); return true; }; const pe = () => Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit').length; const LO = () => ((FS.prd_system || {}).lost || {});
    const T = ['수수께끼 동물원', '해리 포터와 마법사의 돌', '수학 수수료 계산', '다람쥐 숲'];
    T.forEach((t, i) => { A[i].title = t; A[i].status = '판매중'; A[i].active = true; A[i].qty = 1; });
    const it = (l, sku) => ({ listingId: l.listingId, title: l.title, price: l.price, qty: 1, sku: sku || l.sku, grade: '상', isbn13: l.isbn13 });
    S.shipC = { orders: [], at: now, enrich: {} }; S.shipCFromCache = false;
    S.ship = { orders: [{ orderNo: 'D-1', buyer: '손님A', orderedAt: '2026-11-10 09:00', recipient: { name: '손님A' }, items: [it(A[0], 'PNKAAA_ms')] }, { orderNo: 'D-2', buyer: '손님B', orderedAt: '2026-11-10 09:10', recipient: { name: '손님B' }, items: [it(A[1], 'BLKBBB_ms')] }, { orderNo: 'D-3', buyer: '손님C', orderedAt: '2026-11-10 09:20', recipient: { name: '손님C' }, items: [it(A[2], 'YLWCCC_ms'), it(A[3], 'YLWCCC_ms')] }], tabCounts: {}, at: now }; S._shipLive = 1; window.__tShip = JSON.parse(JSON.stringify(S.ship));
    await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship))); await W(300);
    try { localStorage.setItem('rn-ship-view', 'order'); } catch (e) {} S.shipView = 'order'; S.shipSrc = 'all'; S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(600);
    const q = () => sh().querySelector('#shp_q'); const qn = () => sh().querySelector('#shp_qn'); const typeQ = async (v) => { const i = q(); i.focus(); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); await W(350); };
    const vis = () => [...sh().querySelectorAll('.shp-it')].filter((x) => !x.classList.contains('shq-hide') && !x.closest('.shq-hide')).map((x) => (x.querySelector('.shp-t') || {}).textContent || '');
    await typeQ('수수'); const pb = qn().querySelector('[data-shqpre="1"]'); o.s1 = { v: vis(), n: qn().textContent, btn: !!pb };
    if (pb) { pb.click(); await W(400); } o.s2 = { v: vis(), n: qn().textContent, pre: S._shqPre, hl: (() => { try { return CSS.highlights.get('shpq').size; } catch (e) { return -1; } })() };
    S._shipTouch = 0; await openShip(); await W(400); o.s2b = { v: vis(), n: qn().textContent }; /* 다시 그려도 앞부분 맞춤 그대로 */
    const back = qn().querySelector('[data-shqpre="0"]'); if (back) { back.click(); await W(300); } o.s3 = { v: vis(), n: qn().textContent, pre: S._shqPre };
    const pb2 = qn().querySelector('[data-shqpre="1"]'); if (pb2) { pb2.click(); await W(300); } await typeQ('수수께'); o.s4 = { v: vis(), n: qn().textContent, pre: S._shqPre }; /* 글을 바꾸면 다시 정확 */
    await typeQ('없는낱말'); o.s5 = { n: qn().textContent, btn: !!qn().querySelector('[data-shqpre]') };
    await typeQ('수수께끼'); o.s6 = { v: vis(), n: qn().textContent, btn: !!qn().querySelector('[data-shqpre]') };
    await typeQ(''); await W(200);

    // ── ③ 소재불명 + 주문 취소 (품절 취소)
    const L0 = A[0]; S.lost && (S.lost.cfg = { ...(S.lost.cfg || {}), pause: false });
    const ra = await lostAdd({ key: L0.usedCode || L0.id, kind: 'al', title: L0.title, isbn13: L0.isbn13, sku: L0.sku, skus: [], from: 'ship', at: lostNow(), by: S.user.email }); await W(300); const cid = ra.cid;
    o.c0 = { st: S.lost.cases[cid].st, stop: (S.lost.cases[cid].stop || {}).how, of: (lostOfLid(L0.listingId) || {}).cid === cid };
    cxOpen('D-1', String(L0.listingId), 'deliv'); await W(200); o.cxLost = !!document.querySelector('.cxw .tag.cau') && /수색중/.test(document.querySelector('.cxw').textContent); S.cxw.reason = 2; await cxSend(); await W(500); cxClose();
    o.c1 = { cx: S.lost.cases[cid].cx, srv: (LO().cases || {})[cid] && (LO().cases[cid].cx || {}).st, st: S.lost.cases[cid].st };
    // 맡긴 일이 끝남(수집기) — 명령 허브가 받은 것처럼
    S.cmdAll = S.cmdAll || new Map(); const cxDoc = { ...(FS.shp_cmds['cx_D-1'] || {}), id: 'cx_D-1', status: 'done', doneAt: new Date(Date.now() + 1000).toISOString(), result: { state: 'done', sent: [String(L0.listingId)] } }; S.cmdAll.set('cx_D-1', cxDoc); lostCxSync(); await W(500);
    const acts = () => (((FS.prd_system || {})['lost_c_' + cid] || {}).acts || []).filter((a) => a.act === 'cx').map((a) => a.m);
    o.c2 = { st: (S.lost.cases[cid].cx || {}).st, acts: acts(), case: S.lost.cases[cid].st, noSell: !!lostNoSell({ ...S.lost.cases[cid], cid }) }; lostCxSync(); await W(300); o.c2n = acts().length; /* 두 번 적지 않음 */
    o.band = lostBand(L0); o.btns = lostPauseBtn({ ...S.lost.cases[cid], cid });
    const p0 = pe(); const rp = await lostPauseSet(cid, 'pause'); await W(200); o.pause = { how: rp.how, pe: pe() - p0, stop: (S.lost.cases[cid].stop || {}).how };
    // 사건 화면: '✖ 주문 취소됨' 칸 · 판매 처리 단추 없음
    openLostCase(cid); await W(900); const cv = sh().querySelector('.lo-cx'); o.page = { cx: !!cv && /주문 취소됨/.test(cv.textContent) && /판매불가/.test(cv.textContent), pauseBtn: !!sh().querySelector('[data-lopause]') };
    // 취소된 주문 줄은 '팔려 나갔을 수 있음'(다음 할 일 맨 위)으로 안 셈
    S.orders = S.orders || new Map(); S.orders.set('ORD-X', { orderNo: 'D-1', kind: 'sale', orderedAt: new Date().toISOString(), items: [{ listingKey: L0.id, lineStatus: 'cancelledInOrder', qty: 1 }] }); S._loMemo = new Map();
    o.next = lostNext(cid).map((x) => x.where); o.soldWhy = lostHypWhy('sold', { ...S.lost.cases[cid], cid }, L0, S.lostD[cid] || {});
    S.orders.set('ORD-Y', { orderNo: 'D-9', kind: 'sale', orderedAt: new Date().toISOString(), items: [{ listingKey: L0.id, lineStatus: 'normal', qty: 1 }] }); S._loMemo = new Map(); o.next2 = lostNext(cid).map((x) => x.where); S.orders.delete('ORD-Y'); S._loMemo = new Map();
    // 종결(못 찾음) — 판매중 그대로였어도 품절 취소로 판매불가 → 판매중지 맡기지 않음
    const p1 = pe(); window.askText = async () => '시험'; await twice('[data-loclose]'); o.close = { st: S.lost.cases[cid].st, pe: pe() - p1, ns: !!((S.lost.cases[cid].closed || {}).noSell) };
    // 종결 되돌림 → 다시 수색(판매 상태 안 바꿈)
    const p2 = pe(); await twice('[data-loundo="closed"]'); o.undo = { st: S.lost.cases[cid].st, pe: pe() - p2 };

    // ── ⏸ 옵션을 켠 사건(일시판매중지 맡김) → 품절 취소 → 발견 → 💰 판매중 복구 = 맡기지 않음
    const L2 = A[2]; S.lost.cfg = { ...(S.lost.cfg || {}), pause: true }; const rb = await lostAdd({ key: L2.usedCode || L2.id, kind: 'al', title: L2.title, skus: [], from: 'ship', at: lostNow(), by: S.user.email }); await W(300); const cid2 = rb.cid; S.lost.cfg.pause = false;
    o.d0 = (S.lost.cases[cid2].stop || {}).how;
    cxOpen('D-3', String(L2.listingId), 'deliv'); await W(150); S.cxw.reason = 2; S.cxw.sel = new Set([String(L2.listingId)]); await cxSend(); await W(400); cxClose();
    S.cmdAll.set('cx_D-3', { ...(FS.shp_cmds['cx_D-3'] || {}), id: 'cx_D-3', status: 'done', doneAt: new Date().toISOString() }); lostCxSync(); await W(400);
    openLostCase(cid2); await W(700); await twice('[data-lofound]');
    const sb = sh().querySelector('[data-lonext="sell"]'); o.sellLbl = sb ? sb.textContent : null; const p3 = pe(); if (sb) await twice('[data-lonext="sell"]'); o.sell = { pe: pe() - p3, next: (S.lost.cases[cid2].found || {}).next, note: (S.lost.cases[cid2].found || {}).note, undone: !!(S.lost.cases[cid2].stop || {}).undone };

    // ── 🙋 고객 취소(사유 1)는 막지 않음
    const L3 = A[1]; const rc = await lostAdd({ key: L3.usedCode || L3.id, kind: 'al', title: L3.title, skus: [], from: 'ship', at: lostNow(), by: S.user.email }); await W(300); const cid3 = rc.cid;
    cxOpen('D-2', String(L3.listingId), 'deliv'); await W(150); S.cxw.reason = 1; await cxSend(); await W(400); cxClose(); S.cmdAll.set('cx_D-2', { ...(FS.shp_cmds['cx_D-2'] || {}), id: 'cx_D-2', status: 'done', doneAt: new Date().toISOString() }); lostCxSync(); await W(400);
    o.r1 = { ns: lostNoSell({ ...S.lost.cases[cid3], cid: cid3 }), btn: !!lostPauseBtn({ ...S.lost.cases[cid3], cid: cid3 }), tag: lostCxHtml({ ...S.lost.cases[cid3], cid: cid3 }, 1) };
    const p4 = pe(); const rr = await lostPauseSet(cid3, 'pause'); await W(300); o.r1p = { how: rr.how, pe: pe() - p4 };
    // 목록 줄 표시
    S.detail.lcid = null; S.lostP = { f: 'all', q: '' }; lostRender(); await W(400); o.list = [...sh().querySelectorAll('.lo-cxt')].map((x) => x.textContent);
    return o; });
  ok(R.s1.btn && !R.s1.v.length && /정확히 맞는 것 없음/.test(R.s1.n) && /2개/.test(R.s1.n), "출고 검색 '수수' → 정확히 맞는 것 없음 · '낱말 앞부분으로 맞는 2개 보기'(수수께끼·수수료) · 카드는 숨김 그대로", R.s1);
  ok(R.s2.v.length === 2 && R.s2.v.some((t) => /수수께끼/.test(t)) && R.s2.v.some((t) => /수수료/.test(t)) && /앞부분 맞춤/.test(R.s2.n) && R.s2.hl >= 2, '누르면 앞부분 맞춤 — 맞는 카드만 · 칠함 · 안내에 「낱말 앞부분 맞춤 · 정확히 ›」', R.s2);
  ok(R.s2b.v.length === 2 && /앞부분 맞춤/.test(R.s2b.n), '다시 그려도 앞부분 맞춤 그대로', R.s2b);
  ok(!R.s3.v.length && !R.s3.pre && /정확히 맞는 것 없음/.test(R.s3.n), "'정확히 ›' → 정확한 낱말로 돌아감", R.s3);
  ok(!R.s4.pre && !R.s4.v.length, '검색어를 바꾸면 다시 정확한 낱말(앞부분 맞춤은 그 검색어에만)', R.s4);
  ok(/없음/.test(R.s5.n) && !R.s5.btn, '앞부분으로도 없으면 그냥 「없음」', R.s5);
  ok(R.s6.v.length === 1 && !R.s6.btn, '정확히 맞으면 안내 없이 그대로(정범님 규칙 — 기본 정확 맞춤)', R.s6);
  ok(R.c0.st === 'open' && R.c0.stop === 'keep' && R.c0.of, '출고 상품 → 소재불명 사건(수색중 · 판매중 그대로) · 상품 번호로 사건을 찾음', R.c0);
  ok(R.cxLost, '취소 창: 수색중 상품에 「🔎 수색중」 표시');
  ok(R.c1.cx && R.c1.cx.st === 'queued' && R.c1.cx.reason === 2 && R.c1.srv === 'queued' && R.c1.st === 'open', '취소를 맡기면 사건에 「주문 취소 맡김」(지우지 않음 · 수색중 그대로)', R.c1);
  ok(R.c2.st === 'done' && R.c2.case === 'open' && R.c2.noSell && R.c2.acts.length === 2 && R.c2n === 2, '취소가 끝나면 「주문 취소됨」 · 사건 기록 한 줄씩(두 번 안 적음) · 품절 취소 = 판매 상태 안 바꿈', R.c2);
  ok(/주문 취소됨/.test(R.band) && R.btns === '', '수색중 띠에 「✖ 주문 취소됨(품절 취소 — 판매불가)」 · 판매 처리 단추 없음', { band: R.band.replace(/<[^>]+>/g, ''), btns: R.btns });
  ok(R.pause.how === 'cx' && R.pause.pe === 0 && R.pause.stop === 'keep', '⏸ 일시판매중지로 바꾸기 = 맡기지 않음(판매불가 상품을 다시 바꾸지 않음)', R.pause);
  ok(R.page.cx && !R.page.pauseBtn, '사건 화면: 「✖ 주문 취소됨 · 판매불가」 칸 · ⏸/💰 단추 없음', R.page);
  ok(!R.next.some((w) => /주문/.test(w)) && /취소된 주문 1건/.test(R.soldWhy), "취소된 주문 줄은 '이미 팔려 나갔을 수 있음'으로 안 셈(가설 근거에 '취소된 주문 n건뿐')", { next: R.next, why: R.soldWhy });
  ok(R.next2.some((w) => /주문 D-9/.test(w)), '정상 주문 줄은 예전처럼 맨 위 할 일', R.next2);
  ok(R.close.st === 'closed' && R.close.pe === 0 && R.close.ns, '종결(못 찾음): 판매중지 맡기지 않음 · 까닭 기록', R.close);
  ok(R.undo.st === 'open' && R.undo.pe === 0, '종결 되돌림: 판매 상태 안 바꿈 · 다시 수색', R.undo);
  ok(R.d0 === 'pause' && R.sell.pe === 0 && R.sell.next === 'sell' && /판매불가/.test(R.sell.note || '') && !R.sell.undone && /판매불가/.test(R.sellLbl || ''), '⏸ 옵션 사건 → 품절 취소 → 발견 → 💰 판매중 복구 = 맡기지 않음(단추에 「판매불가 — 기록만」)', { d0: R.d0, sell: R.sell, lbl: R.sellLbl });
  ok(!R.r1.ns && R.r1.btn && /주문 취소됨/.test(R.r1.tag) && R.r1p.how === 'pause' && R.r1p.pe === 1, '🙋 고객 취소(알라딘이 판매중으로)는 막지 않음 — ⏸ 단추 그대로 · 맡김', { r1: R.r1, r1p: R.r1p });
  ok(R.list.length >= 3 && R.list.every((t) => /주문 취소됨/.test(t)), '소재불명 목록 줄에도 「✖ 주문 취소됨」', R.list);
  // 360px: 안내 줄이 화면 안
  await p.setViewportSize({ width: 360, height: 800 }); await p.evaluate(async () => { ['cx_D-1', 'cx_D-2', 'cx_D-3'].forEach((k) => { if (S.cmdAll) S.cmdAll.delete(k); delete (window.__FS.shp_cmds || {})[k]; }); S.ship = JSON.parse(JSON.stringify(window.__tShip)); /* 취소된 주문은 출고 목록에서 빠짐(맞는 동작) — 검색 칸 시험용으로 되돌림 */ S.detail = null; S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); }); await p.waitForTimeout(600);
  const N = await p.evaluate(async () => { const i = document.getElementById('shp_q'); i.focus(); i.value = '수수'; i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => setTimeout(r, 1200)); const b = document.querySelector('#shp_qn [data-shqpre="1"]'); const r = b ? b.getBoundingClientRect() : null; const ir = document.getElementById('shp_q').getBoundingClientRect(); return { qn: (document.getElementById('shp_qn') || {}).textContent, b: !!b, right: r && Math.round(r.right), iw: Math.round(ir.width), sw: document.getElementById('sheet').scrollWidth, cw: document.getElementById('sheet').clientWidth }; });
  ok(N.b && N.right <= 360 && N.iw >= 120 && N.sw <= N.cw + 1, '360px: 안내 단추가 화면 안 · 검색칸 폭 지킴 · 가로 넘침 없음', N);
});
process.on('exit', () => console.log(bad ? `❌ tLOSTCX ${bad}개 실패` : '✅ tLOSTCX 모두 통과'));
