// tBBDEL — 정범님 11/05 '알라딘 매입 페이지에서 상품 카드 자체를 아예 삭제' · '등록 페이지 알라딘 매입으로 보냄에서도 아예 삭제'
// 두 번 눌러야 지움 · 모든 탭에서 사라짐 · 원래 기록 남음 · 되돌리기 · 장바구니 담긴 것 물음 · 판매완료는 지울 수 없음(숨기기만 · 매출 그대로) · 등록 보냄 탭 · 여러 개 · 다시 보내면 되살림
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const cmds = (t) => Object.entries(FS.shp_cmds || {}).filter(([, v]) => v.type === t).map(([id, v]) => ({ id, ...v }));
    const asked = []; let askAns = true; window.ask = async (m) => { asked.push(String(m)); return askAns; }; S.user = S.user || { email: 'tester@x' };
    const A = [...S.plist.values()].filter((l) => l.active && l.isbn13); const [a0, a1, a2, a3, a4] = A;
    await bhSendL([a0, a1, a2, a3, a4], { k: 'prod' }); await W(300);
    const sh = () => document.getElementById('sheet'); const keysOn = () => [...sh().querySelectorAll('.bbit[data-bbit]')].map((el) => el.dataset.bbit); const allTabs = () => { const T = bhTabs().tabs; return Object.values(T).flat(); };
    // ① 두 번 눌러야 지움
    openAladinSell({ t: 'sent' }); await W(300); o.sent0 = keysOn().length; const b0 = sh().querySelector(`[data-bhrm="${a0.usedCode}"]`); o.btn = b0 && b0.textContent;
    b0.click(); await W(150); o.arm = b0.textContent; o.rm1 = !!(BB().removed || {})[a0.usedCode];
    b0.click(); await W(900); const R0 = (BB().removed || {})[a0.usedCode]; o.rm2 = R0 && { at: !!R0.at, by: R0.by, from: R0.from, hide: R0.hide };
    o.gone = !allTabs().includes(a0.usedCode) && !keysOn().includes(a0.usedCode); o.moved = !!(BB().moved || {})[a0.usedCode]; o.sent1 = keysOn().length;
    const fold = sh().querySelector('#bh_rmf'); o.fold = fold ? fold.innerText.replace(/\s+/g, ' ') : null; o.tabTxt = (sh().querySelector('[data-bbt="sent"]') || {}).textContent;
    o.sendRow = /data-bhsend/.test(bhSendRow(a0, { k: 'batch', n: 'x' })); /* 지운 카드 = 다른 화면에서 다시 보낼 수 있음 */
    // ② 되돌리기
    const u0 = sh().querySelector(`[data-bhrmundo="${a0.usedCode}"]`); u0.click(); await W(150); o.undoArm = u0.textContent; u0.click(); await W(900);
    o.back = allTabs().includes(a0.usedCode); openAladinSell({ t: 'sent' }); await W(300); o.backCard = keysOn().includes(a0.usedCode); o.undone = !!(((BB().removed || {})[a0.usedCode] || {}).undone); o.foldGone = !sh().querySelector('#bh_rmf');
    // ③ 장바구니에 담긴 것 → 물음 · 예 = 장바구니에서 빼기 맡김(PC 수집기 일)
    await db.collection('prd_system').doc('buyback').set({ cart: { [a1.usedCode]: { state: 'added', at: new Date().toISOString(), by: 'PC' } } }, { merge: true }); await W(400);
    openAladinSell({ t: 'cart' }); await W(300); const nDel0 = cmds('c2bDel').length; const b1 = sh().querySelector(`[data-bhrm="${a1.usedCode}"]`); o.cartBtn = !!b1; asked.length = 0; b1.click(); await W(100); b1.click(); await W(1200);
    o.asked = asked.find((m) => /장바구니에서 빼기/.test(m)) || null; o.c2b = cmds('c2bDel').length - nDel0; const R1 = (BB().removed || {})[a1.usedCode] || {}; o.rmC2b = !!(R1.c2b && R1.c2b.cmd); o.cartKept = ((BB().cart || {})[a1.usedCode] || {}).state; o.autoWhy = bhAutoWhy(a1.usedCode);
    // 아니오 = 카드만 지움
    await db.collection('prd_system').doc('buyback').set({ cart: { [a4.usedCode]: { state: 'queued', at: new Date().toISOString(), by: 'PC' } } }, { merge: true }); await W(400); askAns = false; asked.length = 0; const nDel1 = cmds('c2bDel').length;
    await bhRemove([a4.usedCode]); await W(300); o.no = { asked: asked.length, c2b: cmds('c2bDel').length - nDel1, rm: !!bhRmvOf(a4.usedCode) }; askAns = true; await bhRmvUndo([a4.usedCode], { quiet: true }); await W(300);
    // ④ 판매완료 = 지울 수 없음, 숨기기만 · 매출 그대로
    await db.collection('prd_system').doc('buyback').set({ cart: { [a2.usedCode]: { state: 'added', at: '2026-11-01T00:00:00.000Z', by: 'PC' } } }, { merge: true }); await W(300);
    S.bb = { loaded: true, list: [{ id: 'B9', orderNo: 'B9', date: new Date().toISOString().slice(0, 10), items: [{ isbn13: a2.isbn13, title: a2.title, result: 'bought', buyPrice: 2500, req: '상 2,600', buy: '상 2,500' }] }] }; S._bhBM = null; S._bhSR = null; S._bhV++;
    openAladinSell({ t: 'done' }); await W(300); o.doneKeys = keysOn(); const sr0 = bhSaleRows().sum; const b2 = sh().querySelector(`[data-bhrm="${a2.usedCode}"]`); o.hideBtn = b2 && b2.textContent; o.hideAttr = b2 && b2.dataset.hide;
    b2.click(); await W(100); o.hideArm = b2.textContent; b2.click(); await W(900); const R2 = (BB().removed || {})[a2.usedCode] || {}; o.hide = R2.hide; S._bhSR = null; S._bhV++; const sr1 = bhSaleRows().sum; o.sale = [sr0, sr1];
    openAladinSell({ t: 'done' }); await W(300); o.doneAfter = keysOn(); o.doneTab = (sh().querySelector('[data-bbt="done"]') || {}).textContent; o.hidFold = /숨기기만 1개/.test((sh().querySelector('#bh_rmf') || {}).innerText || '');
    // ⑤ 여러 개 — 고른 것 지우기
    openAladinSell({ t: 'sent' }); await W(300); S.bbuySel = new Set([a3.usedCode, a0.usedCode]); openAladinSell(); await W(200); const bm = sh().querySelector('#bb_rm'); o.bulkTxt = bm && bm.textContent; bm.click(); await W(100); o.bulk1 = !!bhRmvOf(a3.usedCode); bm.click(); await W(1000);
    o.bulk = [a3.usedCode, a0.usedCode].every((k) => bhRmvOf(k) && !allTabs().includes(k));
    // ⑥ 다시 보내면 되살림(기록 남김)
    const rs = await bhSendL([a3], { k: 'batch', n: '다시' }); await W(500); o.resend = { ok: rs && rs.ok, back: !bhRmvOf(a3.usedCode) && allTabs().includes(a3.usedCode), why: (((BB().removed || {})[a3.usedCode] || {}).undone || {}).why };
    // ⑦ 📥 등록 '🏷 알라딘 매입으로 보냄' 탭 — 같은 단추 · 양쪽에서 사라짐 · 등록 줄은 그대로(bbRemoved 표시)
    const it = { id: 'rD1', stage: 'sel', grade: 2, price: 6000, q: '지우기 시험', info: { title: '지우기 시험 책', isbn13: '9791100000901', buyback: { 상: 2400 } }, createdAt: new Date().toISOString() }; S.regItems = S.regItems || new Map(); S.regItems.set(it.id, it); FS.reg_items = FS.reg_items || {}; FS.reg_items[it.id] = JSON.parse(JSON.stringify(it));
    await regBbSend(['rD1'], { k: 'reg', n: '선택 대기' }, { quiet: true }); await W(400); o.regSt0 = (S.regItems.get('rD1') || {}).stage; o.regInPage = allTabs().includes('REG_rD1');
    history.back(); await W(300); S.regT = 'bb'; openRegister(); await W(900); const rb = sh().querySelector('[data-bhrm="REG_rD1"]'); o.regBtn = rb && rb.textContent; o.regRow0 = /지우기 시험 책/.test(sh().innerText);
    rb.click(); await W(150); o.regArm = rb.textContent; rb.click(); await W(1200);
    const rIt = S.regItems.get('rD1') || {}; o.reg = { stage: rIt.stage, mark: !!(rIt.bbRemoved && rIt.bbRemoved.at), fsMark: !!((FS.reg_items.rD1 || {}).bbRemoved || {}).at, rm: !!bhRmvOf('REG_rD1'), inPage: allTabs().includes('REG_rD1') };
    regRerender(); await W(700); const rows = [...sh().querySelectorAll('.rgbbrow')].map((x) => x.innerText); o.regRowGone = !rows.some((t) => /지우기 시험 책/.test(t)); const rf = sh().querySelector('#rg_bbrmf'); o.regFold = rf ? rf.innerText.replace(/\s+/g, ' ').slice(0, 120) : null;
    const ru = rf && rf.querySelector('[data-bhrmundo]'); if (ru) { ru.click(); await W(100); ru.click(); await W(1200); } const rIt2 = S.regItems.get('rD1') || {}; o.regUndo = { rm: !!bhRmvOf('REG_rD1'), on: regBbRmOn(rIt2), inPage: allTabs().includes('REG_rD1') };
    regRerender(); await W(700); o.regBack = [...sh().querySelectorAll('.rgbbrow')].some((x) => /지우기 시험 책/.test(x.innerText));
    o.log = (BB().log || []).filter((x) => /^remove/.test(x.act)).map((x) => x.act);
    return o; });
  console.log(JSON.stringify(r).slice(0, 3000));
  ok(/🗑 지우기/.test(r.btn || ''), '카드마다 「🗑 지우기」');
  ok(/한 번 더/.test(r.arm) && !r.rm1, '한 번 누르면 아무 일 없이 「한 번 더 누르면」으로만');
  ok(r.rm2 && r.rm2.at && r.rm2.by && r.rm2.from === 'sent' && !r.rm2.hide, '같은 단추 두 번 → 지운 표시(언제·누가·그때 상태 이관)');
  ok(r.gone && r.sent1 === r.sent0 - 1, `모든 탭에서 사라짐(이관 ${r.sent0} → ${r.sent1})`);
  ok(r.moved, '원래 기록(이관 기록)은 그대로 남음');
  ok(r.fold && /지운 카드 1개/.test(r.fold), "맨 아래 '🗑 지운 카드 1개' 칸: " + (r.fold || '').slice(0, 80));
  ok(r.sendRow, '지운 카드는 다른 화면에서 다시 보낼 수 있음(보내기 단추)');
  ok(/한 번 더/.test(r.undoArm) && r.back && r.backCard && r.undone && r.foldGone, '↩ 되돌리기(두 번) → 그때 탭으로 다시 · 되돌린 기록 남음');
  ok(r.cartBtn && r.asked && r.c2b === 1 && r.rmC2b, "장바구니에 담긴 카드 → '🛒 장바구니에서 빼기를 함께 맡길까요?' · 예 = c2bDel 맡김(PC 수집기)");
  ok(r.cartKept === 'added' && /지운 카드/.test(r.autoWhy || ''), '장바구니 기록은 지우지 않음 · 지운 카드는 자동 판매중지 안 함');
  ok(r.no.asked === 1 && r.no.c2b === 0 && r.no.rm, '담는 중인 카드에서 아니오 → 카드만 지움(빼기 맡기지 않음)');
  ok(/숨기기/.test(r.hideBtn || '') && r.hideAttr === '1' && /지울 수 없음, 숨기기만/.test(r.hideArm || ''), '판매완료 카드 = 「🙈 숨기기」 · 「기록에 남아야 하는 상품 — 지울 수 없음, 숨기기만」');
  ok(r.hide === '판매완료' && r.sale[0] === 2500 && r.sale[1] === 2500, `숨겨도 매출 그대로(${r.sale.join(' → ')})`);
  ok(r.doneAfter.length === r.doneKeys.length - 1 && /숨김 1/.test(r.doneTab || '') && r.hidFold, `판매완료 탭에서 안 보임 · 탭 수에 '+숨김 1'(셈 그대로): ${r.doneTab}`);
  ok(/고른 2개 🗑 지우기/.test(r.bulkTxt || '') && !r.bulk1 && r.bulk, '고른 것 여러 개 지우기(두 번)');
  ok(r.resend.ok && r.resend.back && r.resend.why === '다시 보냄', '지운 카드를 다시 보내면 되살림(되돌린 까닭 「다시 보냄」)');
  ok(r.regSt0 === 'bb' && r.regInPage && /🗑 지우기/.test(r.regBtn || '') && r.regRow0, "📥 등록 '🏷 알라딘 매입으로 보냄' 탭 줄에도 「🗑 지우기」");
  ok(/한 번 더/.test(r.regArm) && r.reg.rm && !r.reg.inPage && r.reg.stage === 'bb' && r.reg.mark && r.reg.fsMark, '등록 탭에서 두 번 → 알라딘 매입 페이지에서도 사라짐 · 등록 줄은 지우지 않고 bbRemoved 표시');
  ok(r.regRowGone && r.regFold && /지운 카드 1개/.test(r.regFold), "등록 보냄 탭에서도 사라지고 '🗑 지운 카드' 칸에: " + r.regFold);
  ok(!r.regUndo.rm && !r.regUndo.on && r.regUndo.inPage && r.regBack, '등록 탭에서 되돌리기 → 양쪽에 다시');
  ok(r.log.includes('remove') && r.log.includes('removeUndo'), '알라딘 매입 기록(log)에 지우기·되돌리기');
  console.log(bad ? `❌ tBBDEL 실패 ${bad}` : '✓ tBBDEL 통과'); });
