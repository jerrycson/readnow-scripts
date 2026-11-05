// tBH — 정범님 11/01: 🏷 알라딘 매입 한 페이지(모든 알라딘 매입 업무) · 다른 화면은 '보내기'만 · 한 상품(SKU)은 하나만 · 페이지에서 장바구니 담기 · 판매 처리(두 번 눌러 → 판매중지 맡김·sold 기록)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const BB = () => ((FS.prd_system || {}).buyback || {}); const cmds = (t) => Object.entries(FS.shp_cmds || {}).filter(([, v]) => v.type === t).map(([id, v]) => ({ id, ...v }));
    window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const A = [...S.plist.values()].filter((l) => l.active && l.isbn13); const [a0, a1, a2, a3] = A; // a0 a1 a2 = 매입가 하한 · a3 = 같은 SKU 시험
    S.sku.map.set(a3.id, { c: ['k0001'] }); S.sku.seqUn = S.sku.seqUn || (() => {}); S.sku.at = Date.now();
    // ── ① 수동 일괄 '알라딘 매입가 하한' 탭: 장바구니 단추 없이 보내기만
    const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 };
    S.batchRes = A.map((l, j) => ({ l, target: l.price - 500, reasons: ['시험'], page1: [], at: '2026-11-01', bbHit: j < 3 ? { buy: l.price - 600 + j, floor: l.price + 400 } : null /* (11/05) 알라딘 매입 근삿값 판정(시장 맞춤가 ≤ 매입가×1.15) 안에 들게 */ })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'bb'; S.batchEdit = {};
    const c = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }; drawBatchRes(sh, c, 'g1'); await W(300);
    out.bbCards = sh.querySelectorAll('.card.pq.bq[data-mk]').length; out.cartBtnBatch = sh.querySelectorAll('[data-bbcart],[data-rgbbcart]').length; out.sendBtns = sh.querySelectorAll('[data-bhsend]').length; out.hasAll = !!sh.querySelector('#b_bhall'); out.hasOpen = !!sh.querySelector('#b_tobbuy');
    sh.querySelector(`[data-bhsend="${a0.usedCode}"]`).click(); await W(500);
    out.m1 = Object.keys(BB().moved || {}); out.src1 = Object.values(((BB().moved || {})[a0.usedCode] || {}).src || {}).map((x) => x.k + ':' + x.n);
    drawBatchRes(sh, c, 'g1'); await W(200); const card0 = [...sh.querySelectorAll('.card.pq.bq[data-mk]')].find((el) => el.dataset.mk === 'aladin_' + a0.usedCode); const fold0 = sh.querySelector('.bdfold'); out.in0 = !card0 && !!fold0 && /처리함 1개/.test(fold0.innerText) && !!fold0.querySelector(`[data-bhopen="${a0.usedCode}"]`); /* (11/02) 이 그룹에서 보낸 카드는 ✓ 처리함으로 접힘 */
    const T0 = window.toast; let lastT = ''; window.toast = (m) => { lastT = String(m); return T0 && T0(m); };
    sh.querySelector('#b_bhall').click(); await W(600); out.allToast = lastT; out.m2 = Object.keys(BB().moved || {}).sort();
    // 다른 탭(선택 대기)에 있어도 매입가 하한 카드면 보내기 단추
    S.batchSt.picks['aladin_' + a1.usedCode] = { price: a1.price, at: new Date().toISOString() }; S.batchT = 'pick'; drawBatchRes(sh, c, 'g1'); await W(200); out.pickRow = !!sh.querySelector(`[data-bhopen="${a1.usedCode}"]`);
    // ── ② 같은 상품을 다른 곳(상품 상세)에서 또 보냄 → 하나만 · 출처 둘
    const rP = await bhSendL([a0], { k: 'prod' }); await W(200); out.dupToast = lastT; out.dupPend = rP && rP.pend.length; out.src2a = Object.values(((BB().moved || {})[a0.usedCode] || {}).src || {}).map((x) => x.k); if (rP && rP.pend[0]) await bdDo(rP.pend[0], 'merge'); await W(200); out.src2 = Object.values(((BB().moved || {})[a0.usedCode] || {}).src || {}).map((x) => x.k); /* (11/02) 이미 있으면 그 자리 결정 → 출처만 더함 */
    // 같은 SKU: a3(SKU k0001)를 먼저 보내고, 같은 SKU의 등록 상품을 보냄 → 새로 넣지 않고 a3에 출처만
    await bhSendL([a3], { k: 'prod' }); await W(200);
    S.regItems = S.regItems || new Map(); const mk = (id, extra) => ({ id, stage: 'sel', grade: 2, price: 6000, q: '등록 시험', info: { title: '등록 시험 책 ' + id, isbn13: '9791100000' + String(id.charCodeAt(1)).padStart(3, '0') /* (11/02) 줄마다 다른 ISBN — 같은 ISBN·등급이면 생상품 겹침 결정이 뜸 */, cover: '', buyback: { 상: 3100, 최상: 3500 } }, createdAt: new Date().toISOString(), ...extra });
    const rSku = mk('rS', { rnSkus: ['RNk0001'] }); const rA = mk('rA'); const rB = mk('rB', { info: { title: '등록 시험 책 B', isbn13: '9791100000777', buyback: { 상: 2800 } } }); [rSku, rA, rB].forEach((x) => { S.regItems.set(x.id, x); FS.reg_items = FS.reg_items || {}; FS.reg_items[x.id] = JSON.parse(JSON.stringify(x)); });
    const rs = await regBbSend(['rS'], { k: 'reg', n: '선택 대기' }); await W(300); out.skuRes = rs && { nNew: rs.nNew, nHave: rs.nHave, keys: rs.keys, pend: rs.pend.length, case: rs.pend[0] && rs.pend[0].case, stage: (S.regItems.get('rS') || {}).stage }; if (rs && rs.pend[0]) await bdDo(rs.pend[0], 'merge'); await W(300); out.skuRes.stage2 = (S.regItems.get('rS') || {}).stage; out.regSkuKey = !!(BB().moved || {}).REG_rS; out.src3 = Object.values(((BB().moved || {})[a3.usedCode] || {}).src || {}).map((x) => x.k);
    // ── ③ 등록 카드: 🛒 장바구니 단추 없음 · 보내기 두 번 눌러
    const box = document.createElement('div'); box.id = 'tbhreg'; document.body.appendChild(box); box.innerHTML = regBbSecHtml(rA, 6000, null, 'sel'); /* (11/05) 자세히 카드 '🏷 알라딘 매입' 칸 하나 */ out.regHtmlCart = /data-rgbbcart|팔기 장바구니 추가/.test(box.innerHTML); const sb = box.querySelector('[data-rgbbsend]'); out.regBtn = sb ? sb.textContent : null;
    sb.click(); await W(100); out.regArm = sb.textContent; sb.click(); await W(700); out.regStage = (S.regItems.get('rA') || {}).stage; out.regMoved = !!(BB().moved || {}).REG_rA; out.regCmd = cmds('c2bAdd').length; box.remove();
    // 등록 고른 것·살핀 것 → 일괄 보내기 (regBbSend 여러 개)
    const rm = await regBbSend(['rB', 'rA'], { k: 'reg', n: '고른 상품' }); await W(300); out.regMulti = rm && { nNew: rm.nNew, nHave: rm.nHave, nHere: rm.nHere };
    out.regTab = regBbTabHtml([S.regItems.get('rA'), S.regItems.get('rB')]); out.regTabCart = /data-rgbbcart|팔기 장바구니 추가/.test(out.regTab); out.regTabOpen = /data-bhopen="REG_rA"/.test(out.regTab); out.regTab = out.regTab.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
    // ── ④ 알라딘 매입 페이지 — 보낸 상품 탭에 한 상품씩 (같은 SKU는 하나)
    S.detail = null; openAladinSell({ t: 'sent' }); await W(400); const page = () => document.getElementById('sheet');
    const keysOn = () => [...page().querySelectorAll('.bbit[data-bbit]')].map((el) => el.dataset.bbit); out.sentKeys = keysOn(); out.sentUniq = new Set(out.sentKeys).size === out.sentKeys.length;
    const c0 = page().querySelector(`[data-bbit="${a0.usedCode}"]`); out.chips0 = c0 ? [...c0.querySelectorAll('.bhsrc')].map((x) => x.textContent.trim()) : null; out.mini = page().querySelectorAll('.bbit.bhmini').length;
    out.tabTxt = [...page().querySelectorAll('[data-bbt]')].map((b) => b.textContent.trim());
    // 장바구니 담기 — 전체(알라딘 매물 + 등록 상품) 한 맡긴 일
    const nC0 = cmds('c2bAdd').length; page().querySelector('#bb_cartall').click(); await W(800); const cc = cmds('c2bAdd'); out.cart = { n: cc.length - nC0, items: cc.length ? cc[cc.length - 1].items.map((x) => x.usedCode) : [] }; out.cartSt = Object.entries(BB().cart || {}).map(([k, v]) => k + ':' + v.state);
    openAladinSell({ t: 'wait' }); await W(300); out.waitN = keysOn().length;
    // 수집기가 담았다고 적음
    const cart = {}; for (const k of out.cart.items) cart[k] = { state: 'added', at: new Date().toISOString(), by: 'PC' }; await db.collection('prd_system').doc('buyback').set({ cart }, { merge: true }); await W(500);
    openAladinSell({ t: 'cart' }); await W(300); out.cartKeys = keysOn(); out.sellBtns = page().querySelectorAll('[data-bbsell]').length;
    // ── ⑤ 판매 처리 — 두 번 눌러 · 판매중지 맡김(prdEdit 판매상태 → 판매중지) · sold 기록 · 판매 끝으로 셈
    const sb1 = page().querySelector(`[data-bbsell="${a0.usedCode}"]`); const pe0 = cmds('prdEdit').length; sb1.click(); await W(150); out.sellArm = sb1.textContent; out.pe1 = cmds('prdEdit').length - pe0; sb1.click(); await W(900);
    const pe = cmds('prdEdit'); const peA = pe.slice(pe0).filter((x) => (x.listingKey || x.key) === 'aladin_' + a0.usedCode); /* (11/04) 이 책 맡김만 셈 — 장바구니에 담긴 다른 책은 자동 판매중지(받침)가 따로 맡길 수 있음 */ out.pe2 = peA.length; out.peCh = peA.length ? peA[peA.length - 1].ch : null; out.sold0 = (BB().sold || {})[a0.usedCode]; out.stopR = ((FS.prd_stop_reasons || {})['aladin_' + a0.usedCode] || {}).reason; out.active0 = S.plist.get('aladin_' + a0.usedCode).active;
    // 고른 것 판매 처리(등록 상품 포함) — 두 번 눌러
    openAladinSell({ t: 'cart' }); await W(300); S.bbuySel = new Set(keysOn()); openAladinSell(); await W(200); const bs = page().querySelector('#bb_sell'); out.bulkSellTxt = bs && bs.textContent; bs.click(); await W(150); bs.click(); await W(1200);
    out.soldKeys = Object.entries(BB().sold || {}).filter(([, v]) => !v.undone).map(([k, v]) => k + ':' + v.state).sort(); out.doneCard = !!document.querySelector('.bhdone');
    openAladinSell({ t: 'cart' }); await W(300); out.soldTab = keysOn().length; /* (11/03) '판매 처리함' 탭은 없어짐 — 판매중지 진행한 책은 장바구니 탭에 그대로 */
    // 되돌리기 — 등록 상품(기록만)
    await bhUnsell(['REG_rB']); await W(600); /* (11/03) 판매중지 해제는 유지·복구 단추가 부르는 같은 함수 */ out.unsell = ((BB().sold || {}).REG_rB || {}).undone ? 'undone' : 'no';
    // 등록 상품 되돌리기(페이지에서) → 등록 줄은 보내기 전 단계로 · 매입 불가·되돌림 탭
    openAladinSell({ t: 'cart' }); await W(300); const rb = page().querySelector('[data-bbmv="back"][data-bbu="REG_rB"]'); if (rb) { rb.click(); await W(800); } out.regBack = { stage: (S.regItems.get('rB') || {}).stage, back: !!(((BB().moved || {}).REG_rB || {}).back) }; openAladinSell({ t: 'no' }); await W(300); out.noKeys = keysOn();
    // 자동 후보 → 보낸 상품 (같은 SKU의 후보는 숨김)
    const a6 = A[6], a7 = A[7]; S.sku.map.set(a7.id, { c: ['k0001'] }); S.sku.at = Date.now() + 1; S.bbuyRes = { at: Date.now(), n: S.plist.size, scanned: 2, hit: new Map([[a6.usedCode, { buy: 1900, floor: 2000, target: 1800 }], [a7.usedCode, { buy: 1900, floor: 2000, target: 1800 }]]) };
    openAladinSell({ t: 'cand' }); await W(300); out.candKeys = keysOn(); const mv = page().querySelector(`[data-bbmv="apply"][data-bbu="${a6.usedCode}"]`); if (mv) { mv.click(); await W(700); } out.candSrc = Object.values((((BB().moved || {})[a6.usedCode]) || {}).src || {}).map((x) => x.k); out.candFloor = ((((BB().moved || {})[a6.usedCode]) || {}).from || {}).floor;
    // ── ⑥ 매입 끝 맞추기 (pur_buyback)
    S.bb = { loaded: true, list: [{ id: 'B1', orderNo: 'B1', date: new Date().toISOString().slice(0, 10), items: [{ isbn13: a0.isbn13, title: a0.title, result: 'bought', buyPrice: 2500, req: '상 2,600', buy: '상 2,500' }] }] }; S._bhBM = null; S._bhV++;
    openAladinSell({ t: 'done' }); await W(300); out.doneKeys = keysOn(); out.doneTxt = (page().querySelector('.bbit') || {}).innerText || '';
    // ── ⑦ 상품 탭 단추 · 상품 상세 한 줄
    out.btnSub = bhBtnSub().replace(/<[^>]+>/g, ''); S.detail = null; sh.classList.remove('on'); S.tab = 'products'; try { renderMain(); } catch (e) { out.rmErr = e.message; } await W(500); const bc = document.getElementById('bbuycnt'); out.btnTxt = bc ? bc.textContent : null;
    out.pd = pdBhHtml(a1).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); out.pdNew = /data-bhsend/.test(pdBhHtml(A[5]) || '') || pdBhHtml(A[5]) === '';
    out.span = /role="button"[^>]*data-bhsend/.test(bhSendRow(A[8], { k: 'under' }, { span: true }));
    // 이 페이지 밖에는 장바구니 담기 단추 없음 (앱 코드 전체에서 data-bbcart를 쓰는 곳 = 이 페이지 카드뿐)
    return out; });
  console.log(JSON.stringify(r, null, 0).slice(0, 4000));
  ok(r.bbCards === 3 && r.cartBtnBatch === 0 && r.sendBtns === 3, `수동 일괄 매입가 하한 탭: 카드 ${r.bbCards}개 · 🛒 장바구니 단추 ${r.cartBtnBatch}개 · 보내기 단추 ${r.sendBtns}개`);
  ok(r.hasAll && r.hasOpen, "탭 위 '이 탭 모두 알라딘 매입으로 보내기' · '알라딘 매입 페이지 열기'");
  ok(r.m1.length === 1 && r.src1.join() === 'batch:시험 그룹', '카드 하나 보내기 → 보낸 상품 1개 (출처 수동 일괄 · 그룹 이름)');
  ok(r.in0 === true, "보낸 카드는 ✓ 처리함으로 접힘(페이지 열기 있음)");
  ok(r.m2.length === 3 && /새로 2개/.test(r.allToast), '이 탭 모두 보내기(처리함은 빠짐): ' + r.allToast);
  ok(r.pickRow, '다른 탭(결정 대기)에 있어도 매입가 하한 카드는 알라딘 매입 상태·링크가 보임');
  ok(r.dupPend === 1 && /그 자리에서 정하세요/.test(r.dupToast) && r.src2a.length === 1 && r.src2.length === 2 && r.src2.includes('batch') && r.src2.includes('prod'), `같은 상품을 다른 곳에서 또 보냄 → 하나만 · 출처 ${r.src2.join('+')}`);
  ok(r.skuRes && r.skuRes.pend === 1 && r.skuRes.case === 'sent' && r.skuRes.stage === 'sel' && r.skuRes.stage2 === 'bb' && !r.regSkuKey && r.src3.includes('reg'), `같은 SKU의 등록 상품을 보냄 → 새로 넣지 않고 기존 상품에 출처만(${(r.src3 || []).join('+')})`);
  ok(!r.regHtmlCart && /알라딘 매입으로 보내기/.test(r.regBtn || ''), '등록 카드: 🛒 팔기 장바구니 단추 없음 · 🏷 알라딘 매입으로 보내기');
  ok(/한 번 더/.test(r.regArm) && r.regStage === 'bb' && r.regMoved && r.regCmd === 0, `등록 보내기 두 번 눌러 → 등록 stage 'bb' · 보낸 상품에 REG_ · 장바구니 맡김 없음(${r.regCmd})`);
  ok(r.regMulti && r.regMulti.nNew === 1 && r.regMulti.nHere === 1, `등록 일괄 보내기: 새로 ${r.regMulti && r.regMulti.nNew} · 이미 보냄 ${r.regMulti && r.regMulti.nHere}`);
  ok(!r.regTabCart && r.regTabOpen, "등록 '🏷 알라딘 매입' 탭: 상태만 · 페이지에서 처리 링크");
  ok(r.sentUniq && r.sentKeys.length === 6 && r.mini === 2, `알라딘 매입 페이지 보낸 상품 ${r.sentKeys.length}개(알라딘 매물 4 + 등록 상품 2) · 겹침 없음`);
  ok(r.chips0 && r.chips0.length === 2, '카드에 출처 칩 둘: ' + (r.chips0 || []).join(' / '));
  ok(r.cart.n === 1 && r.cart.items.length === 6 && r.cart.items.includes('REG_rA'), `페이지에서 전체 담기 → c2bAdd 맡긴 일 하나 · ${r.cart.items.length}권(등록 상품 포함)`);
  ok(r.waitN === 6, `장바구니 담는 중 탭 ${r.waitN}개`);
  ok(r.cartKeys.length === 6 && r.sellBtns === 6, `수집기가 담은 뒤 장바구니 담음 탭 ${r.cartKeys.length}개 · 판매 처리 단추 ${r.sellBtns}개`);
  ok(/한 번 더/.test(r.sellArm) && r.pe1 === 0, '판매 처리: 첫 번째 누름은 확인만(맡기지 않음)');
  ok(r.pe2 === 1 && r.peCh && r.peCh.state === '판매중지', '두 번째 누름 → 판매중지 맡김(prdEdit 판매상태 → 판매중지)');
  ok(r.sold0 && r.sold0.state === 'stop' && r.sold0.cmd && r.sold0.by, 'sold 기록(언제·누가·맡긴 일)');
  ok(r.stopR === 'elsewhere' && r.active0 === false, '판매중지 이유 다른 판매처에서 판매 → 웹앱은 판매 끝으로 셈(active false)');
  ok(r.soldKeys.length === 6 && r.soldKeys.includes('REG_rA:record') && r.doneCard, `고른 것 판매 처리(두 번) → ${r.soldKeys.length}개 · 등록 상품은 기록만 · ✓ 요약 카드`);
  ok(r.soldTab === 6 && r.unsell === 'undone', '판매중지 진행한 책은 장바구니 탭에 · 판매중지 해제(등록 상품 기록만)');
  ok(r.regBack.stage === 'sel' && r.regBack.back && r.noKeys.includes('REG_rB'), `등록 상품 ↩ 등록으로 되돌리기 → 등록 ${r.regBack.stage} · 매입 불가·되돌림 탭`);
  ok(r.candKeys.length === 1 && r.candKeys[0] !== undefined && r.candSrc.join() === 'cand' && r.candFloor === 2000, `자동 후보 ${r.candKeys.length}개(같은 SKU 후보는 숨김) → 보낸 상품(출처 자동 후보 · 하한가 기록)`);
  ok(r.doneKeys.length === 1 && r.doneKeys[0] === r.m1[0] && /판매완료/.test(r.doneTxt) && /B1/.test(r.doneTxt), '알라딘 팔기 내역(bought)과 맞춰 판매완료 탭');
  ok(/이관|접수완료/.test(r.btnTxt || '') || /이관/.test(r.btnSub), `상품 탭 단추: ${r.btnTxt || r.btnSub}`);
  ok(/알라딘 매입에 있음/.test(r.pd) && r.pdNew, '상품 상세 한 줄: ' + r.pd.slice(0, 80));
  ok(r.span, '목록 줄 안에서는 단추 대신 span(누를 수 있음)');
  console.log(bad ? `❌ tBH 실패 ${bad}` : '✓ tBH 통과'); });
