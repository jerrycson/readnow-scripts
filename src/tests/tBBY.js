// tBBY — 정범님 11/03: 🏷 알라딘 매입 페이지 · 탭 이름·순서(후보·이관·대기·장바구니·접수완료·판매완료·폐기·반려·제외) · 장바구니 담김 확인 때 판매중지 한 번만(두 기기 동시) · 접수완료
//        · 판매완료 금액 매출 포함 + 회수 두 번 셈 없음(전/후 같음) · 폐기 결과 → 폐기 표시 · 유지/폐기/소재불명(판매완료 탭엔 없음) · 담기 취소 → 복구 제안 · 여러 권 보유 · 휴대폰
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const H = require('./harness.js'); let ran = 0;
(async () => {
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  await p.evaluate(() => { for (let i = 0; i < 12; i++) { const uc = 'U3159834' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(504935000 + i), title: '더한 책 ' + i, isbn13: '97911' + String(20000000 + i), price: 6000 + i * 300, qty: 1, grade: ['최상', '상'][i % 2], status: '판매중', active: true, sku: 'BLK_x' + i, registeredAt: '2026-10-20T10:00:00', bookId: 'bx' + i }); } S.ver++; });
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const cmds = (t) => Object.entries(FS.shp_cmds || {}).filter(([, v]) => v.type === t).map(([id, v]) => ({ id, ...v }));
    const stops = (l, to) => cmds('prdEdit').filter((c) => c.listingKey === l.id && c.ch && c.ch.state === (to || '판매중지')).length; const page = () => document.getElementById('sheet'); const keysOn = () => [...page().querySelectorAll('.bbit[data-bbit]')].map((el) => el.dataset.bbit);
    let lastAsk = ''; window.ask = async (m) => { lastAsk = String(m); return true; }; const T0 = window.toast; let lastT = ''; window.toast = (m) => { lastT = String(m); return T0 && T0(m); };
    /* Firestore 트랜잭션은 직렬(같은 문서를 두 기기가 동시에 고치면 한쪽이 다시 돎) — 가짜 저장소에서도 차례로 */ const _rt = db.runTransaction; let q = Promise.resolve(); db.runTransaction = (fn) => { const res = q.then(() => _rt(fn)); q = res.catch(() => {}); return res; };
    const L = [...S.plist.values()].filter((l) => l.status === '판매중' && (+l.qty || 1) === 1 && l.isbn13); const [b0, b1, b2, b3, c0, d0, e0] = L; const X0 = [...S.plist.values()].find((l) => l.status === '판매중' && +l.qty === 2);
    b3.isbn13 = b2.isbn13; /* 같은 책 2권(b2·b3) */ S.bbuyRes = { at: Date.now(), n: S.plist.size, scanned: 0, hit: new Map() }; S.stopRLoaded = true;
    openAladinSell({ t: 'sent' }); await W(1500); out.tabs = [...page().querySelectorAll('[data-bbt]')].map((b) => b.textContent.replace(/\s*\d+$/, '').trim()); out.since = (BB().autoCfg || {}).since || null;
    // ── 자동을 켜기 전에 담긴 책(옛 기록) — 저절로 하지 않음
    await bhSendL([e0], { k: 'prod' }); await W(200); await db.collection('prd_system').doc('buyback').set({ cart: { [e0.usedCode]: { state: 'added', at: new Date(Date.now() - 3600e3).toISOString(), by: 'PC' } } }, { merge: true }); await W(1200);
    out.oldStop = stops(e0); out.oldWhy = bhAutoWhy(e0.usedCode);
    // ── 담기 → 수집기가 담김·이미 있음을 적음 → 저절로 판매중지 (두 기기가 동시에 봐도 한 번만)
    await bhSendL([b0, b1, b2, b3], { k: 'prod' }); await W(300); await bbuyCart([b0, b1, b2, b3].map((l) => l.usedCode)); await W(300); out.cartAsk = lastAsk;
    const now = new Date().toISOString(); await db.collection('prd_system').doc('buyback').set({ cart: { [b0.usedCode]: { state: 'added', at: now, by: 'PC' }, [b1.usedCode]: { state: 'added', at: now, by: 'PC' }, [b2.usedCode]: { state: 'added', at: now, by: 'PC' }, [b3.usedCode]: { state: 'already', at: now, by: 'PC' } } }, { merge: true });
    const two = await Promise.all([bhStopRun([b0.usedCode, b1.usedCode], { auto: true }), bhStopRun([b0.usedCode, b1.usedCode], { auto: true })]); out.twoMine = two.map((x) => x.mine.length); /* 두 기기가 같은 순간 */
    await W(2000); S._bhAutoBusy = 0; S.bbuySt.auto = {}; await bhAutoRun(); await W(800); /* 세 번째 기기(로컬 기록 없음)도 저장소를 보고 건너뜀 */
    out.stopN = [b0, b1, b2, b3].map((l) => stops(l)); out.auto0 = BB().auto && BB().auto[b0.usedCode]; out.sold0 = BB().sold && BB().sold[b0.usedCode]; out.why3 = bhAutoWhy(b3.usedCode); out.stopR0 = ((FS.prd_stop_reasons || {})[b0.id] || {}).reason;
    const man = await bhStopRun([b0.usedCode]); await W(300); out.manualAgain = stops(b0); out.manMine = man.mine.length;
    openAladinSell({ t: 'cart' }); await W(400); out.cartKeys = keysOn(); out.card3txt = (page().querySelector(`[data-bbit="${b3.usedCode}"]`) || {}).innerText || ''; out.stopBtn3 = !!page().querySelector(`[data-bbsell="${b3.usedCode}"]`); out.stopBtn0 = !!page().querySelector(`[data-bbsell="${b0.usedCode}"]`);
    // ── 🔍 검토(정범님 11/03): 자동을 켜기 전 담긴 책 = 장바구니 › 검토 · 아무 탭에서 검토로 · ↩ 흐름으로(기록)
    out.e0st = bhState(e0.usedCode, bhBuyMatch()); openAladinSell({ t: 'cart', cs: 'go' }); await W(300); out.cartTabN = (page().querySelector('[data-bbt="cart"]') || {}).textContent; out.csBtns = [...page().querySelectorAll('[data-bbcs]')].map((b) => b.textContent.trim()); out.goHasE0 = keysOn().includes(e0.usedCode);
    page().querySelector('[data-bbcs="rev"]').click(); await W(400); out.revKeys = keysOn(); out.revTxt = (page().querySelector(`[data-bbit="${e0.usedCode}"]`) || {}).innerText || ''; out.revStopBtn = !!page().querySelector(`[data-bbsell="${e0.usedCode}"]`); out.revX = !!page().querySelector(`[data-bhrevx="${e0.usedCode}"]`);
    page().querySelector(`[data-bhrevx="${e0.usedCode}"]`).click(); await W(900); out.e0after = bhState(e0.usedCode, bhBuyMatch()); out.e0rev = (BB().rev || {})[e0.usedCode]; out.e0auto = stops(e0);
    const r0 = L[11]; await bhSendL([r0], { k: 'prod' }); await W(200); openAladinSell({ t: 'sent' }); await W(300); out.revBtnSent = !!page().querySelector(`[data-bhrev="${r0.usedCode}"]`); page().querySelector(`[data-bhrev="${r0.usedCode}"]`).click(); await W(900);
    out.r0st = bhState(r0.usedCode, bhBuyMatch()); out.r0rec = (BB().rev || {})[r0.usedCode]; openAladinSell({ t: 'cart', cs: 'rev' }); await W(300); out.r0inRev = keysOn().includes(r0.usedCode); out.r0why = bhAutoWhy(r0.usedCode);
    await bhRevOut([r0.usedCode]); await W(500); out.r0back = bhState(r0.usedCode, bhBuyMatch()); out.r0undone = !!(((BB().rev || {})[r0.usedCode]) || {}).undone; out.revLog = (BB().log || []).filter((x) => /^rev/.test(x.act)).map((x) => x.act).join(',');
    // 담은 PC 수집기가 맡는 동안(stopPc) 웹앱은 2분 기다림 · 수집기가 맡았으면(auto pc) 건너뜀
    const p0 = L[12]; await bhSendL([p0], { k: 'prod' }); await W(200); const tp = new Date().toISOString(); await db.collection('prd_system').doc('buyback').set({ cart: { [p0.usedCode]: { state: 'added', at: tp, by: 'JS-MAIN', isbn13: p0.isbn13, stopPc: true } } }, { merge: true }); await W(1500); out.pcWait = bhAutoWhy(p0.usedCode); out.pcWaitStop = stops(p0);
    await db.collection('prd_system').doc('buyback').set({ auto: { [p0.usedCode]: { cartAt: tp, st: 'done', pc: true, dev: 'JS-MAIN', at: tp } } }, { merge: true }); await W(600); S._bhAutoBusy = 0; await bhAutoRun(); await W(400); out.pcDone = bhAutoWhy(p0.usedCode); out.pcDoneStop = stops(p0); openAladinSell({ t: 'cart', cs: 'go' }); await W(300); out.pcCard = (page().querySelector(`[data-bbit="${p0.usedCode}"]`) || {}).innerText || '';
    // ── 접수완료
    const td = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); S.bb = { loaded: true, list: [{ id: 'O1', orderNo: 'O1', date: td, paidAmount: 0, items: [{ isbn13: b0.isbn13, title: b0.title, result: null }, { isbn13: b1.isbn13, title: b1.title, result: null }] }] }; S._bhBM = null; S._bhV++;
    openAladinSell({ t: 'recv' }); await W(400); out.recvKeys = keysOn().sort();
    // ── 회수 '전' (옛 식: 판매 순매출 + 폐기 매출 + 알라딘 팔기 정산 전체) — 같은 자료로 견줌
    const oldRecov = () => { const X = purStats(); const D = dispStats(); const B = buybackStats(); return X.soldAmt - X.fee + D.amt + B.amount; };
    S.bb = { loaded: true, list: [{ id: 'O1', orderNo: 'O1', date: td, doneDate: td.replace(/-/g, '.'), paidAmount: 2500, items: [{ isbn13: b0.isbn13, title: b0.title, result: 'bought', buyPrice: 2500, buy: '상 2,500원' }, { isbn13: b1.isbn13, title: b1.title, result: 'discard', buy: '매입불가(폐기)' }] },
      { id: 'O2', orderNo: 'O2', date: td, paidAmount: 1800, items: [{ isbn13: b2.isbn13, title: b2.title, result: 'bought', buyPrice: null, buy: '상' }] }, { id: 'O3', orderNo: 'O3', date: '2026-09-01', paidAmount: 9000, items: [{ isbn13: '9790000000001', title: '다른 책', result: 'bought', buyPrice: 9000 }] },
      /* (11/03) 예전 접수: 책 줄 금액이 일부만 있음 → 나머지는 접수 한 줄 · 정산 0원(아직)은 금액 모름 · 신청일이 빈 접수는 접수 번호 날짜 */
      { id: 'O4', orderNo: 'O4', date: '2026-09-05', paidAmount: 3000, items: [{ isbn13: '9790000000002', title: '옛 책 A', result: 'bought', buyPrice: 1000 }, { isbn13: '9790000000003', title: '옛 책 B', result: 'bought', buyPrice: null }, { isbn13: '9790000000004', title: '옛 책 C', result: 'bought' }, { isbn13: '9790000000005', result: 'discard' }] },
      { id: 'O5', orderNo: 'O5', date: td, paidAmount: 0, items: [{ isbn13: '9790000000006', title: '옛 책 D', result: 'bought', buyPrice: null }] },
      { id: '20210628001196', orderNo: '20210628001196', date: null, paidAmount: 500, items: [{ isbn13: '9790000000007', title: '아주 옛 책', result: 'bought', buyPrice: 500 }] }] }; S._bhBM = null; S._bhV++; bump();
    const AM0 = agg(rangeOf('month', 0)); out.before = oldRecov(); bhSaleBump(); await W(100); const R = recoveryStats(); out.after = R.total; out.bbSale = R.bbSale; out.netDiff = R.net - (purStats().soldAmt - purStats().fee); out.bbRest = R.bb; { const BS = bhSaleRows(); out.ordRow = BS.rows.find((x) => x.ord && x.ono === 'O4'); out.oldRow = BS.rows.find((x) => x.ono === '20210628001196'); out.old = BS.old; out.noAmt = BS.noAmt; }
    const M = agg(rangeOf('month', 0)); out.mBb = M.bb; out.mNoAmt = M.bbNoAmt; out.mDiff = M.amt - (AM0.amt - (AM0.bb || 0)); out.day = daySales(td).bb;
    out.perf = /🏷 알라딘 매입 매출/.test(perfSection('o')) && /4,300/.test(perfSection('o')); out.perfOld = /11\/03부터 예전 것도/.test(perfSection('o'));
    { const ov = window.openListView; let cap = null; window.openListView = (o) => { cap = o; }; openDrill('recover'); window.openListView = ov; out.monthSum = cap ? Math.round(cap.rows.reduce((a, [, v]) => a + v.net + v.disp + v.bb, 0)) : null; out.recNote = cap ? cap.note : ''; let cap2 = null; window.openListView = (o) => { cap2 = o; }; openDrill('bbsale'); window.openListView = ov; out.saleRows = cap2 ? cap2.rows.map((x) => x.amt) : null; }
    out.bbSec = bbSalesSection().replace(/<[^>]+>/g, ' '); out.aggAll = agg(null).amt - (agg(null).bb || 0);
    overlayAll(); out.label0 = (S.plist.get(b0.id).soldBy || {}).label;
    openAladinSell({ t: 'done' }); await W(400); out.doneKeys = keysOn(); out.doneAct = page().querySelectorAll('.bbcards [data-bhact]').length; out.doneRev = page().querySelectorAll('.bbcards [data-bhrev]').length; out.doneHead = (page().querySelector('.bhsale') || {}).innerText || ''; out.doneTxt = page().querySelector('.bbcards').innerText;
    // ── 폐기 결과 → 폐기 탭 · 판매중지 이유 '폐기'(우리 매물이 판매중지된 뒤 · 기기 하나만)
    b1.status = '판매중지'; S._bhV++; await Promise.all([bhFinRun(), (async () => { S._bhFinBusy = 0; await bhFinRun(); })()]); await W(600); S._bhFinBusy = 0; S.bbuySt.fin = {}; await bhFinRun(); await W(500);
    const sr1 = (FS.prd_stop_reasons || {})[b1.id] || {}; out.disc1 = { st: bhState(b1.usedCode, bhBuyMatch()), reason: sr1.reason, hist: (sr1.history || []).filter((h) => h.to === 'disp').length, grp: stopGroupOf(S.plist.get(b1.id)) };
    // ── 담기 취소 → 판매중지 그대로 두지 않고 '복구' 제안(저절로 복구하지 않음)
    await bhSendL([c0], { k: 'prod' }); await W(200); await db.collection('prd_system').doc('buyback').set({ cart: { [c0.usedCode]: { state: 'added', at: new Date().toISOString(), by: 'PC' } } }, { merge: true }); await W(1500); out.c0stop = stops(c0);
    await db.collection('prd_system').doc('buyback').set({ cart: { [c0.usedCode]: { state: 'cancelled', at: new Date().toISOString(), by: 'PC' } } }, { merge: true }); await W(1200); out.c0st = bhState(c0.usedCode, bhBuyMatch()); out.c0restore = stops(c0, '판매중');
    openAladinSell({ t: 'no' }); await W(400); const cc = page().querySelector(`[data-bbit="${c0.usedCode}"]`); out.c0txt = cc ? cc.innerText : ''; const kb = cc && cc.querySelector('[data-bhact="keep"]'); out.c0keepLbl = kb ? kb.textContent : null;
    // 모든 탭(판매완료 빼고) 카드에 단추 3개
    out.btn3 = {}; for (const t of ['cand', 'sent', 'wait', 'cart', 'recv', 'done', 'disc', 'no', 'skip']) { openAladinSell({ t }); await W(250); const cards = page().querySelectorAll('.bbcards .bbit').length; const n3 = [...page().querySelectorAll('.bbcards .bbit')].filter((el) => el.querySelectorAll('[data-bhact]').length === 3 && el.querySelectorAll('[data-bhrev],[data-bhrevx]').length === 1).length; out.btn3[t] = cards + ':' + n3; }
    // ── 유지: 두 번 눌러 → 판매중으로 복구 · 제외 탭 · 후보로 다시 안 올라옴 · 값이 바뀌면 다시
    for (const c of cmds('prdEdit').filter((c) => c.listingKey === c0.id)) await db.collection('shp_cmds').doc(c.id).set({ status: 'done', f: { state: { st: 'pub', at: new Date().toISOString() } } }, { merge: true }); c0.status = '판매중지'; await W(800); /* 클라우드가 판매중지를 끝냄 */
    openAladinSell({ t: 'no' }); await W(300); { const b = page().querySelector(`[data-bhact="keep"][data-bbu="${c0.usedCode}"]`); b.click(); await W(120); out.keepArm = b.textContent; out.keepArmN = stops(c0, '판매중'); b.click(); await W(1200); }
    out.keep = { restore: stops(c0, '판매중'), rec: !!(BB().keep || {})[c0.usedCode], st: bhState(c0.usedCode, bhBuyMatch()), soldUndone: !!(((BB().sold || {})[c0.usedCode]) || {}).undone, reason: ((FS.prd_stop_reasons || {})[c0.id] || {}).reason };
    S.bbuyRes = { at: Date.now(), n: S.plist.size, scanned: 1, hit: new Map([[c0.usedCode, { buy: 1900, floor: 2000, target: 1800 }]]) }; S._bhV++; const sigBuy = ((BB().keep || {})[c0.usedCode] || {}).sig; out.keepSig = sigBuy;
    out.candWhileKeep = bhTabs().tabs.cand.includes(c0.usedCode); c0.price = (+c0.price || 0) + 300; S._bhV++; out.candAfterChange = bhTabs().tabs.cand.includes(c0.usedCode); c0.price -= 300; S._bhV++;
    // ── 폐기: 판매중지(이유 폐기) · 폐기 탭 · 샵매니저 삭제 확인 창(취소 → 삭제 안 맡김 · 단추 남음 → 확인 → regDel)
    await bhSendL([d0], { k: 'prod' }); await W(200); let sheets = 0; window.askSheet = async () => { sheets++; return false; };
    openAladinSell({ t: 'sent' }); await W(300); { const b = page().querySelector(`[data-bhact="disp"][data-bbu="${d0.usedCode}"]`); b.click(); await W(400); out.dArm = b.textContent; /* 첫 누름 뒤 다시 그리기가 와도 두 번 누르기가 지워지지 않음 */ b.click(); await W(1500); }
    out.disp = { stop: stops(d0), reason: ((FS.prd_stop_reasons || {})[d0.id] || {}).reason, st: bhState(d0.usedCode, bhBuyMatch()), sheets, regDel: cmds('regDel').length, grp: stopGroupOf(S.plist.get(d0.id)) };
    openAladinSell({ t: 'disc' }); await W(300); out.dispKeys = keysOn(); const db0 = page().querySelector(`[data-bhdel="${d0.usedCode}"]`); out.delBtn = !!db0; window.askSheet = async () => true; window.confirm = () => true; if (db0) { db0.click(); await W(900); } const rd = cmds('regDel'); out.regDel = rd.length ? { mode: rd[0].mode, uc: rd[0].items[0].usedCode, why: rd[0].why } : null; out.delRec = !!(((BB().disp || {})[d0.usedCode] || {}).del);
    // ── 소재불명: lostAdd가 있으면 그것으로 · 없으면 기록만 · 판매중지
    const realLostAdd = window.lostAdd; const got = []; window.lostAdd = (e) => { got.push(e); return { ok: true, cid: 'x' }; }; await bhSendL([e0], { k: 'prod' }); S.bbuySel = new Set(); openAladinSell({ t: 'cart', cs: 'go' }); await W(300);
    { const b = page().querySelector(`[data-bhact="lost"][data-bbu="${e0.usedCode}"]`); out.lostBtn = !!b; if (b) { b.click(); await W(120); b.click(); await W(1300); } }
    out.lost = { got: got.length, e: got[0] ? Object.keys(got[0]).sort().join(',') : '', from: got[0] && got[0].from, kind: got[0] && got[0].kind, rec: (BB().lost || {})[e0.usedCode], st: bhState(e0.usedCode, bhBuyMatch()), stop: stops(e0), reason: ((FS.prd_stop_reasons || {})[e0.id] || {}).reason };
    window.lostAdd = undefined; const f0 = L[7]; await bhSendL([f0], { k: 'prod' }); await bhLost([f0.usedCode]); await W(400); out.lost2 = (BB().lost || {})[f0.usedCode]; out.lost2stop = stops(f0); out.lost2r = ((FS.prd_stop_reasons || {})[f0.id] || {}).reason;
    // 진짜 🔎 소재불명 페이지(lostAdd) — 판매중지는 그 페이지가 한 번만 · 발견하면 소재불명 표시를 풂
    window.lostAdd = realLostAdd; const h0 = L[10]; out.realFn = typeof realLostAdd; if (typeof realLostAdd === 'function') { await bhSendL([h0], { k: 'prod' }); await W(200); await bhLost([h0.usedCode]); await W(1200); const rec = (BB().lost || {})[h0.usedCode] || {}; out.real = { sent: rec.sent, cid: rec.cid, stop: stops(h0), st: bhState(h0.usedCode, bhBuyMatch()), of: window.lostOf(h0.usedCode) };
      if (rec.cid && typeof lostSetStatus === 'function') { await lostSetStatus(rec.cid, 'found', { found: { at: new Date().toISOString(), by: 'x', next: null } }, '발견'); await W(800); out.real.after = bhState(h0.usedCode, bhBuyMatch()); out.real.stop2 = stops(h0); } }
    // ── 여러 권 보유 · 매입 한도 · 담기 경고
    const g0 = L[8], g1 = X0 || L[9]; g1.isbn13 = g0.isbn13; S._bhHI = null; await bhSendL([g0], { k: 'prod' }); openAladinSell({ t: 'sent' }); await W(300); out.hold = ((page().querySelector(`[data-bbit="${g0.usedCode}"] .bhhold`) || {}).innerText || ''); out.holdN = 1 + (+g1.qty || 1);
    await bhSendL([g1], { k: 'prod' }); await W(200); lastAsk = ''; await bbuyCart([g0.usedCode, bhPickUnit(g1)]); out.limAsk = lastAsk;
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 0)); ran++;
  ok(JSON.stringify(r.tabs) === JSON.stringify(['후보', '이관', '대기', '장바구니', '접수완료', '판매완료', '폐기', '반려', '제외']), '탭 이름·순서: ' + r.tabs.join(' · '));
  ok(!!r.since && r.oldStop === 0 && /켜기 전에/.test(r.oldWhy || ''), '자동을 켜기 전에 담긴 책은 저절로 판매중지하지 않음(까닭 표시)');
  ok(r.twoMine.reduce((a, b) => a + b, 0) <= 2 && r.stopN[0] === 1 && r.stopN[1] === 1, `두 기기 동시 → 판매중지 맡김 한 번만 (b0 ${r.stopN[0]} · b1 ${r.stopN[1]} · 동시 잡음 ${r.twoMine.join('/')})`);
  ok(r.stopN[2] === 1 && r.stopN[3] === 0 && /같은 ISBN/.test(r.why3 || ''), `같은 ISBN 2권 중 '이미 있음'은 저절로 안 함(${r.why3})`);
  ok(r.auto0 && r.auto0.st === 'done' && r.sold0 && r.sold0.auto && r.sold0.state === 'stop' && r.stopR0 === 'elsewhere', '자동 판매중지 기록(auto · sold.auto · 이유 다른 판매처에서 판매)');
  ok(r.manualAgain === 1 && r.manMine === 0, '이미 판매중지 진행이면 손으로 다시 눌러도 맡기지 않음');
  ok(r.cartKeys.includes(r.cartKeys[0]) && r.stopBtn3 && !r.stopBtn0 && /판매중지 안 함/.test(r.card3txt), "장바구니 탭: 자동이 안 된 책에만 '🛑 판매중지 진행' · 까닭 표시");
  ok(r.e0st === 'rev' && /장바구니\s*\d+/.test(r.cartTabN) && r.csBtns.length === 2 && /^진행/.test(r.csBtns[0]) && /^검토/.test(r.csBtns[1]) && !r.goHasE0 && r.revKeys.includes(r.revKeys.find((k) => k)) && /켜기 전/.test(r.revTxt) && r.revStopBtn && r.revX, `자동을 켜기 전 담긴 책 → 장바구니 › 검토(하위 탭 ${r.csBtns.join(' · ')}) · 「🛑 판매중지 진행」·「↩ 흐름으로」`);
  ok(r.e0after === 'cart' && r.e0rev && r.e0rev.pre && r.e0rev.undone && r.e0auto === 0, '검토 → ↩ 흐름으로 = 장바구니 진행(기록 rev.pre·undone) · 저절로 판매중지 안 함');
  ok(r.revBtnSent && r.r0st === 'rev' && r.r0rec && r.r0rec.from === 'sent' && r.r0inRev && r.r0back === 'sent' && r.r0undone && r.revLog === 'revOut,rev,revOut', `이관 탭에서 🔍 검토로 → 검토 하위 탭 · ↩ 흐름으로 = 이관 탭으로(기록 ${r.revLog})`);
  ok(/PC 수집기가 판매중지를 맡는 중/.test(r.pcWait) && r.pcWaitStop === 0 && /자동 판매중지 맡음/.test(r.pcDone) && r.pcDoneStop === 0 && /수집기가 담은 직후 판매중지 맡김/.test(r.pcCard), `담은 PC 수집기가 맡는 동안 웹앱은 기다림(${r.pcWait}) · 수집기가 맡았으면 건너뜀 · 카드 표시`);
  ok(r.recvKeys.length === 2, '접수완료 탭(접수됐고 결과 없음) ' + r.recvKeys.length);
  ok(r.before === r.after && r.bbSale === 2500 + 1800 + 9000 + 1000 + 2000 + 500 && r.netDiff === r.bbSale && r.bbRest === 0, `회수 합계 전 ${r.before} = 후 ${r.after} · 예전 접수까지 판매 쪽으로 ${r.bbSale} · 알라딘 팔기 나머지 ${r.bbRest}`);
  ok(r.ordRow && r.ordRow.amt === 2000 && r.ordRow.q === 2 && r.ordRow.k === null && /어느 책인지 모름/.test(r.ordRow.title) && r.oldRow && r.oldRow.d === '2021-06-28' && r.old.sum === 1800 + 9000 + 1000 + 2000 + 500 && r.old.ord === 2 && r.noAmt === 1, `예전 접수: 책 줄 금액 없는 2권 = 접수 한 줄 ${r.ordRow && r.ordRow.amt}(정산 3,000 − 책 줄 1,000 · 나누지 않음) · 신청일 빈 접수 날짜 ${r.oldRow && r.oldRow.d} · 정산 0원 접수는 금액 모름 ${r.noAmt}`);
  ok(r.monthSum === Math.round(r.after) && /두 번 셈 없음/.test(r.recNote), `회수 월별 합 ${r.monthSum} = 총 회수`);
  ok(r.mBb === 4300 && r.mNoAmt === 1 && r.mDiff === 4300 && r.day === 4300 && r.perf && r.perfOld, `이번 달 매출에 알라딘 매입 ${r.mBb}(책 줄 2,500 + 금액 없는 접수 한 줄 1,800) 포함 · 금액 모름 ${r.mNoAmt}권은 뺌 · 판매 실적 칸 · '11/03부터 예전 것도'`);
  ok(JSON.stringify(r.saleRows && r.saleRows.slice().sort()) === JSON.stringify([2500, 1800, 9000, 1000, 2000, null, 500].sort()), '알라딘 매입 매출 목록(책마다 · 금액 없는 접수는 한 줄 · 금액 모름 표시): ' + JSON.stringify(r.saleRows));
  ok(r.bbSec.includes('판매 순매출 ' + r.aggAll.toLocaleString('ko-KR')), "주문·매출 탭 '전체 매출'에서 알라딘 매입을 두 번 더하지 않음");
  ok(r.label0 === '🏷 판매완료(알라딘 매입)', '상품 기록 상태: ' + r.label0);
  ok(r.doneKeys.length === 2 && r.doneAct === 0 && r.doneRev === 0 && /16,800/.test(r.doneHead) && /예전 접수/.test(r.doneHead) && /책 줄 금액 없음/.test(r.doneTxt), `판매완료 탭 ${r.doneKeys.length}개 · 유지/폐기/소재불명·검토로 단추 없음 · 머리: ${r.doneHead.slice(0, 80)}`);
  ok(r.disc1.st === 'disc' && r.disc1.reason === 'disp' && r.disc1.hist === 1 && r.disc1.grp === 'disp', `알라딘 폐기 결과 → 폐기 탭 · 판매중지 이유 '폐기' 한 번만(기록 ${r.disc1.hist})`);
  ok(r.c0stop === 1 && r.c0st === 'no' && r.c0restore === 0 && /판매중지 상태/.test(r.c0txt) && /복구/.test(r.c0keepLbl || ''), '담기 취소 → 반려 탭 · 저절로 복구하지 않고 「↩ 복구」 제안');
  ok(Object.entries(r.btn3).every(([t, v]) => { const [c, n] = v.split(':').map(Number); return t === 'done' ? n === 0 : c === n; }), '판매완료 탭을 뺀 모든 탭 카드에 유지·폐기·소재불명 + 🔍 검토로: ' + JSON.stringify(r.btn3));
  ok(/한 번 더/.test(r.keepArm) && r.keepArmN === 0 && r.keep.restore === 1 && r.keep.rec && r.keep.st === 'skip' && r.keep.soldUndone && r.keep.reason === 'check', `유지(두 번) → 판매중 복구 맡김 ${r.keep.restore} · 제외 탭 · 이유 검수·확인 대기`);
  ok(r.candWhileKeep === false && r.candAfterChange === true, '유지한 책은 후보로 안 올라옴 → 값(판매가)이 바뀌면 다시 후보');
  ok(/한 번 더/.test(r.dArm || '') && r.disp.stop === 1 && r.disp.reason === 'disp' && r.disp.st === 'disc' && r.disp.sheets === 1 && r.disp.regDel === 0 && r.disp.grp === 'disp', '폐기(두 번) → 판매중지·이유 폐기·폐기 탭 · 삭제 확인 창(취소하면 삭제 안 맡김)');
  ok(r.dispKeys.includes(r.dispKeys.find((k) => k)) && r.delBtn && r.regDel && r.regDel.mode === 'listing' && r.delRec, `폐기 탭 '🗑 샵매니저 삭제' → 확인 → regDel(listing) 맡김`);
  ok(r.lostBtn && r.lost.got === 1 && r.lost.e === 'at,by,from,grade,isbn13,key,kind,price,sku,skus,title' && r.lost.from === 'buyback' && r.lost.kind === 'al' && r.lost.rec && r.lost.rec.sent && r.lost.st === 'skip' && r.lost.stop === 0, `소재불명 → lostAdd(${r.lost.e}) · 제외 탭 · 이 단추는 판매중지를 따로 맡기지 않음(그 페이지가 맡음)`);
  ok(r.lost2 && r.lost2.sent === false && r.lost2.fn === false && r.lost2stop === 1 && r.lost2r === 'lost', '소재불명 페이지(lostAdd)가 없으면 기록 + 여기서 판매중지(이유 분실)');
  ok(r.realFn === 'function' && r.real && r.real.sent && r.real.cid && r.real.stop === 1 && r.real.st === 'skip' && r.real.of && r.real.of.st === 'open' && r.real.after !== 'skip' && r.real.stop2 === 1, `진짜 소재불명 페이지: 판매중지 한 번(${r.real && r.real.stop}) · 사건 ${r.real && r.real.cid} · 발견 → 소재불명 표시 풂(${r.real && r.real.after})`);
  ok(new RegExp('보유 ' + r.holdN + '권').test(r.hold) && /이 페이지 1/.test(r.hold) && /한도 모름/.test(r.hold) && /매입 한도/.test(r.limAsk), `여러 권 보유 표시: ${r.hold} · 담기 확인 창에 한도 경고`);
});
// ── 📱 휴대폰
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; S.bbuyRes = { at: Date.now(), n: S.plist.size, scanned: 0, hit: new Map() };
    const L = [...S.plist.values()].filter((l) => l.status === '판매중' && l.isbn13); await bhSendL(L.slice(0, 3), { k: 'prod' }); openAladinSell({ t: 'sent' }); await W(800);
    const sh = document.getElementById('sheet'); return { sw: document.documentElement.scrollWidth, shw: sh.scrollWidth, cw: sh.clientWidth, tabs: sh.querySelectorAll('[data-bbt]').length, b3: sh.querySelectorAll('.bbcards [data-bhact]').length, cfg: !!sh.querySelector('#bh_auto') }; });
  console.log(JSON.stringify(r)); ran++;
  ok(r.tabs === 9 && r.b3 === 9 && r.cfg && r.shw <= r.cw + 2, `휴대폰: 탭 9개 · 단추 ${r.b3} · 설정 칸 · 가로 넘침 없음(${r.shw}/${r.cw})`);
}, { vp: { width: 390, height: 844 }, touch: true });
if (ran !== 2) { bad++; console.log('  ❌ 시험 본문이 끝까지 돌지 않음'); } console.log(bad ? `❌ tBBY 실패 ${bad}` : '✓ tBBY 통과'); })();
