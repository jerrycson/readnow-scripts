// tSUP2 — 정범님 11/03 2차: 🏪 매입처 — 매입 탭 카드 · 새 매입처 두 길(같은 srcX · 등록 화면에 미리 들어감 · 중복 막음) · 매입 방식 세 가지(📦 뭉치·🏷 개별·🧮 인수)
//   뭉치: 회차 경계(등록 시각 → 상품 번호) · 수동 종결 · 자동 종결 알림(홈·화면 위)과 시점 바꾸기 · 되돌리기 · 대기 · 계산에서 빼기 · 무게 × 권/kg · 상품별 매입가(runMatching)
//   개별: 표 입력 · 같은 값 · 붙여 넣기 · 저장 · 되돌리기 · 등록 화면 카드 칸 → 가져오기 · 인수: 실사 · 종료 확정 · 김미소·헌옷도라이 숫자 그대로 · 설명서 · 휴대폰
//  쓰는 법: RN_PORT=<포트> node tSUP2.js
let bad = 0, ran = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  await p.evaluate(() => { window.prompt = (() => { const Q = []; window.__PQ = Q; return () => Q.shift() ?? null; })(); window.confirm = () => true; });
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; S.user = S.user || { email: 'tester@x' }; const sh = document.getElementById('sheet');
    const dbl = async (el, ms) => { el.click(); await W(60); el.click(); await W(ms || 500); };
    const reg = () => (((FS.app_settings || {}).main || {}).reg || {});
    // ── 가짜 자료
    S.plist.clear(); const mk = (i, sku, reg0, st, extra) => { const uc = 'U8' + String(100000 + i); const l = { id: 'aladin_' + uc, usedCode: uc, listingId: String(700000 + i), title: '매입처시험 ' + i, isbn13: '97912' + String(10000000 + i), price: 6000 + i, qty: 1, grade: '상', status: st || '판매중', active: (st || '판매중') !== '판매완료', sku, registeredAt: reg0, bookId: 'b' + i, ...(extra || {}) }; S.plist.set(l.id, l); return l; };
    for (let i = 0; i < 3; i++) mk(i, 'YLWNOT_ms', '2026-10-0' + (i + 1) + 'T10:00', i ? '판매중' : '판매완료'); for (let i = 3; i < 5; i++) mk(i, 'PNKLUX_hd', '2026-10-0' + i + 'T10:00'); for (let i = 5; i < 8; i++) mk(i, 'BLKCMN', '2026-10-1' + i + 'T10:00');
    mk(90, 'BLKCMN_qq', '2026-10-20T10:00'); /* 이미 _qq 토막이 붙은 상품 */
    S.prodLoaded = true; S.pmatchLoaded = true; S.pmatch.clear(); S.orders.clear(); S.orders.set('o1', { id: 'o1', orderNo: '1', kind: 'sale', orderedAt: dstr(new Date()) + 'T09:00:00', customerId: 'c1', items: [{ lineStatus: 'normal', title: '매입처시험 0', sku: 'YLWNOT_ms', aladinUsedCode: 'U8100000', qty: 1, price: 6000 }] }); S.ordersLoaded = true;
    S.pur = S.pur || {}; Object.assign(S.pur, { loaded: true, fresh: true, loading: false, heonot: [{ id: 'h1', date: '2026-09-01', amt: 800000 }], aOrders: [], existing: [], entries: [{ id: 'e1', sheet: '매입2603', row: 5, amt: 100000, date: '2026-09-02', txt: '번개장터 책 10권', plat: '번개장터', who: '정범', cat: 'book', raw: [] }], set: { ...PSET_DEFAULT, msTotalCost: 16000000 } });
    const setReg = async (rg) => { await db.collection('app_settings').doc('main').set({ reg: rg }, { merge: true }); S.app = { ...S.app, reg: { ...((S.app || {}).reg || {}), ...rg } }; supSettingsChanged(); await W(30); };
    MEMO.clear(); await setReg({ srcX: [], hide: { src: [], add: [] }, srcMode: {}, srcCost: {} });
    const X0 = purStats(); const pick = (X) => JSON.stringify({ ms: X.G.ms, hd: X.G.hd, msAmt: X.msAmt, hdAmt: X.hdAmt, uMs: X.unitMsNow, uHd: X.unitHd }); out.kms0 = pick(X0); out.msv0 = JSON.stringify(msValid());
    // ① 매입 탭 첫 화면 🏪 매입처 카드
    S.tab = 'purchase'; S.detail = null; renderMainNow(); await W(500); const m = document.getElementById('main'); const pc = m.querySelector('[data-pusup]'); out.puCard = !!pc && /매입처 — 2곳/.test(pc.textContent) && /이번 달 매입처별 매출/.test(pc.textContent) && !!pc.querySelector('[data-gopage="suppliers"].btn') && !!pc.querySelector('[data-supnew]');
    out.puCardTop = (() => { const c = m.querySelector('[data-pusup]'); const s0 = m.querySelector('details.sec'); return !!c && !!s0 && !!(c.compareDocumentPosition(s0) & Node.DOCUMENT_POSITION_FOLLOWING); })();
    out.grpBtn = !!m.querySelector('[data-sec="pu_grp"] button.btn[data-gopage="suppliers"]');
    // ② 새 매입처 — 🏪 화면 「＋ 새 매입처」(카드 단추로 열기)
    pc.querySelector('[data-supnew]').click(); await W(400); out.nfOpen = !!sh.querySelector('#sup_nf');
    const typ = async (sel, v) => { const i = sh.querySelector(sel); i.value = v; i.dispatchEvent(new Event('input')); await W(450); };
    await typ('#sup_nf_n', '서울북스'); await typ('#sup_nf_s', 'new'); out.nfBadNew = /다른 뜻으로/.test(sh.querySelector('#sup_nf_msg').textContent) && sh.querySelector('#sup_nf_go').disabled;
    await typ('#sup_nf_s', '261103'); out.nfBadNum = /날짜/.test(sh.querySelector('#sup_nf_msg').textContent);
    await typ('#sup_nf_s', 'sb'); out.nfEx = /BLKCMN_sb/.test(sh.querySelector('#sup_nf_msg').innerHTML); sh.querySelector('#sup_nf_go').click(); await W(700);
    const SB = (reg().srcX || []).find((x) => x.suffix === '_sb'); out.sbMade = !!SB && SB.name === '서울북스' && reg().srcMode[SB.id].m === 'lot'; out.sbOpened = S.detail && S.detail.sup === (SB && SB.id);
    history.back(); await W(300);
    // 이미 붙은 토막(_qq) — 개수를 보이고 한 번 더 눌러야
    openSuppliers(); await W(300); sh.querySelector('#sup_nfo').click(); await W(300); await typ('#sup_nf_n', '큐큐상회'); await typ('#sup_nf_s', 'qq'); out.qqWarn = /이미 이 토막이 붙은 상품 1개/.test(sh.querySelector('#sup_nf_msg').textContent); sh.querySelector('#sup_nf_go').click(); await W(300); out.qqArm = /한 번 더/.test(sh.querySelector('#sup_nf_go').textContent) && !(reg().srcX || []).some((x) => x.suffix === '_qq');
    sh.querySelector('#sup_nf_x').click(); await W(200);
    // 중복 막음(이름 · 부가 코드 · 지운 매입처)
    out.dup = [supCreateCheck('서울북스', 'zz').err, supCreateCheck('다른곳', 'SB').err, supCreateCheck('김미소', 'ms').err].map((e) => !!e); history.back(); await W(200);
    // 등록 화면 — 🏪에서 만든 매입처가 단추에 이미 · 「＋ 매입처」 → 같은 srcX · 그 카드에 바로 골라짐
    S.regItems = S.regItems || new Map(); const t = new Date().toISOString(); const mkR = (id, extra) => ({ id, stage: 'sel', method: 'bulk', isbn: '9790000000' + id.length + '88', info: { title: '등록시험 ' + id, isbn13: '9790000000888', itemId: '8' + id.length, categories: [{ path: ['국내도서', '소설'] }], page1: [{ price: 7000, grade: '상', sellerCode: '1' }], priceList: 10000, at: t }, grade: 2, qty: 1, price: 8000, by: S.user.email, ws: regWsCur(), createdAt: t, ...(extra || {}) });
    for (const d of [mkR('r1'), mkR('r2'), mkR('r3')]) { await db.collection('reg_items').doc(d.id).set(d); S.regItems.set(d.id, d); }
    S.regT = 'sel'; openRegister(); await W(1500); out.regHasSb = !!sh.querySelector(`[data-rgsrc="r1"][data-v="${SB.id}"]`);
    window.__PQ.push('개별상점', 'gy'); sh.querySelector('[data-rgsrcadd="r1"]').click(); await W(900); const GY = (reg().srcX || []).find((x) => x.suffix === '_gy'); out.gyMade = !!GY && (reg().srcX || []).length === 2 && reg().srcMode[GY.id].m === 'lot' && (S.regItems.get('r1') || {}).source === GY.id;
    window.__PQ.push('또서울', 'SB'); sh.querySelector('[data-rgsrcadd="r2"]').click(); await W(600); out.regDup = (reg().srcX || []).length === 2;
    // ③ 뭉치 회차 — 서울북스 상품 6개(등록 시각 순 · 같은 분은 상품 번호 순)
    const D1 = '2026-10-25'; const sbL = []; ['2026-10-24T09:00', '2026-10-25T09:00', '2026-10-25T09:00', '2026-10-26T11:30', '2026-10-27T08:00', '2026-10-28T10:00', '2026-10-29T10:00'].forEach((d0, j) => sbL.push(mk(10 + j, 'BLKCMN_sb' + (j === 2 ? '_NEW' : ''), d0)));
    sbL[1].listingId = '700099'; /* 같은 분 — 상품 번호가 더 큰 것이 뒤 */ bump('p'); S.regItems.clear(); history.back(); await W(300);
    const addLot = async (k, v) => { await supCostSave(SB.id, (L) => [...L, { k, at: new Date().toISOString(), by: 'tester@x', ...v }], 'x'); await W(30); };
    await addLot('L1', { date: D1, amt: 400000, qty: 4 }); let T = supLotsOf(SB.id); const L1 = () => supLotsOf(SB.id).lots.find((x) => x.k === 'L1');
    out.before = T.before.map((it) => it.l.id); out.l1 = { st: L1().state, n: L1().n, ids: L1().items.map((it) => it.l.id), unit: Math.round(L1().unit), ack: L1().ack };
    out.order = L1().items.slice(0, 2).map((it) => it.l.id); /* 같은 분: 상품 번호 작은 sbL[2](700012)가 먼저, sbL[1](700099) 뒤 */
    out.after = T.after.map((it) => it.l.id);
    // 상품별 매입가: 회차 안 = 100,000 · 회차 밖 = 매입처 평균
    S.pmatch.clear(); let RM = runMatching(); const cm = (l) => (RM.find((x) => x.id === l.id) || {}); out.mt = { in: [sbL[1], sbL[2], sbL[3], sbL[4]].map((l) => [cm(l).kind, cm(l).cost, cm(l).lot]), out: [cm(sbL[0]).cost, cm(sbL[5]).cost], avg: Math.round(purStats().SUP.by[SB.id].unit) };
    await saveMatches(RM);
    // 자동 종결 알림 — 홈 오늘 확인할 것 · 🏪 화면 위
    const AL = bizAlerts(bizCalc()); const a0 = AL.find((a) => (a.x || {}).k === 'supauto'); out.homeAl = !!a0 && a0.lv === 'red' && a0.key === 'suppliers' && /자동 종결 1건/.test(a0.t);
    openSuppliers(); await W(400); out.banner = !!sh.querySelector('[data-supautoban="1"]') && /4권째/.test(sh.querySelector('.supauto').textContent);
    // 다른 시점으로 — 5권째(sbL[5])까지
    sh.querySelector('[data-suppick]').click(); await W(400); const pk = [...sh.querySelectorAll('[data-suppk]')]; out.pickN = pk.length; const p5 = pk.find((b) => b.dataset.suppk === supLKey(sbL[5])); await dbl(p5, 700); await W(400);
    out.l1b = { st: L1().state, how: L1().how, n: L1().n, unit: Math.round(L1().unit) }; out.closeRec = (supCostRecs(SB.id).find((x) => x.k === 'L1').close || {}).how;
    await W(500); RM = runMatching(); await saveMatches(RM); out.mt2 = [sbL[5], sbL[1], sbL[2], sbL[3], sbL[4]].map((l) => [(S.pmatch.get(l.id) || {}).cost, (S.pmatch.get(l.id) || {}).lot]); out.pmSaved = (S.pmatch.get(sbL[5].id) || {}).cost; /* 시점을 고르면 matchNow가 저절로 돎 */
    out.alGone = !bizAlerts(bizCalc()).some((a) => (a.x || {}).k === 'supauto');
    // 상세 화면 — 방식 칩 · 회차 카드 · 경계 · 되돌리기 · 수동 종결
    openSupplier(SB.id); await W(500); out.modeChips = sh.querySelectorAll('[data-supmode]').length === 3 && !!sh.querySelector('[data-supmode="lot"].on'); const cardL1 = sh.querySelector('[data-supr="L1"]'); out.card = !!cardL1 && cardL1.dataset.suplst === 'closed' && +cardL1.dataset.supln === 5 && /경계/.test(cardL1.textContent) && /시점 고름/.test(cardL1.textContent);
    await dbl(cardL1.querySelector('[data-suplact="reopen"]'), 700); out.reopen = { st: L1().state, n: L1().n, ack: L1().ack, hist: (supCostRecs(SB.id).find((x) => x.k === 'L1').hist || []).length };
    // 확인(이 시점 맞음) — 상세 위 알림 단추
    await dbl(sh.querySelector('[data-supack]'), 700); out.ack = { st: L1().state, how: L1().how, ack: L1().ack, n: L1().n }; out.alGone2 = !supAutoList().length;
    // 다음 회차(수량 없음 · 진행) → 수동 종결 · 대기 회차 · 계산에서 빼기
    await addLot('L2', { date: D1, amt: 90000 }); await addLot('L3', { date: '2026-10-28', amt: 50000, kg: 10 }); const L2 = () => supLotsOf(SB.id).lots.find((x) => x.k === 'L2'), L3 = () => supLotsOf(SB.id).lots.find((x) => x.k === 'L3');
    out.l2 = { st: L2().state, n: L2().n, unit: L2().unit }; out.l3 = { st: L3().state };
    openSupplier(SB.id); await W(400); await dbl(sh.querySelector('[data-supr="L2"] [data-suplact="close"]'), 700); out.l2b = { st: L2().state, how: L2().how, n: L2().n, unit: Math.round(L2().unit) }; out.l3b = { st: L3().state, n: L3().n, tgt: L3().tgt && L3().tgt.src };
    await supLotEdit({ id: SB.id, name: '서울북스' }, 'L3', { perKg: 0.5 }, 'x'); out.l3c = { tgt: L3().tgt.n, st: L3().state, unit: L3().unit };
    // 화면에서 새 회차: 무게 × kg당으로 총액
    openSupplier(SB.id); await W(400); sh.querySelector('#sup_new_d').value = '2026-10-30'; sh.querySelector('#sup_new_kg').value = '800'; sh.querySelector('#sup_new_wk').value = '500'; sh.querySelector('#sup_add').click(); await W(600); const L4r = supCostRecs(SB.id).slice(-1)[0]; out.l4 = { amt: L4r.amt, kg: L4r.kg, wk: L4r.wonKg, st: supLotsOf(SB.id).lots.find((x) => x.k === L4r.k).state };
    const offB = sh.querySelector(`[data-supr="${L4r.k}"] [data-supoff]`); await dbl(offB, 700); out.l4off = { off: supCostRecs(SB.id).find((x) => x.k === L4r.k).off, inLots: supLotsOf(SB.id).lots.some((x) => x.k === L4r.k), kept: supCostRecs(SB.id).length };
    out.oldFold = !!sh.querySelector('details.supold') && !sh.querySelector('details.supold').open;
    out.sbAmt = purStats().SUP.by[SB.id].amt; history.back(); await W(200);
    // ④ 🏷 개별 매입가 — 개별상점(_gy): 방식 바꾸기 → 표 · 같은 값 · 붙여 넣기 · 저장 · 되돌리기
    const gyL = [0, 1, 2, 3].map((j) => mk(30 + j, 'BLKCMN_gy', '2026-10-2' + (5 + j) + 'T10:00')); bump('p');
    openSupplier(GY.id); await W(400); await dbl(sh.querySelector('[data-supmode="each"]'), 800); out.gyMode = { m: reg().srcMode[GY.id].m, hist: reg().srcMode[GY.id].hist.length, from: reg().srcMode[GY.id].hist[0].m };
    const ea = (id) => sh.querySelector(`[data-supea="${id}"]`); out.eaRows = sh.querySelectorAll('#sup_ea [data-supear]').length;
    ea(gyL[0].id).value = '3000'; ea(gyL[0].id).dispatchEvent(new Event('input')); sh.querySelector(`[data-supeac="${gyL[1].id}"]`).checked = true; sh.querySelector('#sup_ea_v').value = '2500'; sh.querySelector('#sup_ea_fillc').click(); await W(300);
    sh.querySelector('#sup_ea_paste').value = '1800\n' + gyL[3].isbn13 + '\t4,500원\n없는것 100'; sh.querySelector('#sup_ea_parse').click(); await W(300); out.draft = { ...S._supD.ea }; out.pres = (sh.querySelector('#sup_ea_pres') || {}).textContent;
    await dbl(sh.querySelector('#sup_ea_save'), 900); out.eaSaved = gyL.map((l) => { const m0 = S.pmatch.get(l.id); return m0 && m0.each ? m0.cost : null; }); out.eaFs = !!(((FS.pur_matches || {})[gyL[0].id] || {}).each);
    const XG = purStats().SUP.by[GY.id]; out.gyAmt = { amt: XG.amt, src: XG.src, unit: XG.unit };
    RM = runMatching(); out.eaNoTouch = !RM.some((x) => gyL.some((l) => l.id === x.id));
    sh.querySelector('[data-supeaf="has"]').click(); await W(300); await dbl(sh.querySelector(`[data-supeax="${gyL[0].id}"]`), 900); out.eaUndo1 = !(S.pmatch.get(gyL[0].id) || {}).each && (S.pmatch.get(gyL[0].id) || {}).kind !== 'manual'; out.eaHist = ((((FS.pur_matches || {})[gyL[0].id] || {}).hist) || []).length;
    await dbl(sh.querySelector('#sup_ea_undo'), 900); out.eaUndoAll = gyL.slice(1).map((l) => !(S.pmatch.get(l.id) || {}).each);
    // 등록 화면 카드 칸 → 가져오기
    S.regItems.clear(); for (const d of [mkR('g1', { source: GY.id }), mkR('g2', { source: GY.id }), mkR('g3', { source: SB.id })]) { await db.collection('reg_items').doc(d.id).set(d); S.regItems.set(d.id, d); }
    history.back(); await W(200); openRegister(); await W(1500); const ci = sh.querySelector('[data-rgsupc="g1"]'); out.regField = !!ci && !sh.querySelector('[data-rgsupc="g3"]') && /회차로 셈/.test((sh.querySelector('[data-rgsrc="g3"]').closest('.rgf') || {}).textContent || '');
    ci.value = '2200'; ci.dispatchEvent(new Event('change')); await W(400); out.regSaved = [(S.regItems.get('g1') || {}).supCost, (S.regItems.get('g1') || {}).supId === GY.id];
    const fa = sh.querySelector('[data-rgsupcall="g1"]') || document.querySelector('[data-rgsupcall="g1"]'); await dbl(fa, 900); out.regAll = [(S.regItems.get('g2') || {}).supCost, (S.regItems.get('g3') || {}).supCost ?? null];
    await db.collection('reg_items').doc('g1').set({ stage: 'done', confirmedAt: '2026-10-24T10:00:00Z', result: { usedCode: gyL[1].usedCode } }, { merge: true }); await db.collection('reg_items').doc('g2').set({ stage: 'done', confirmedAt: '2026-10-24T10:00:00Z', final: { isbn: gyL[2].isbn13 } }, { merge: true });
    history.back(); await W(200); openSupplier(GY.id); await W(500); sh.querySelector('#sup_ea_reg').click(); await W(800); out.fromReg = (sh.querySelector('[data-supeareg]') || {}).dataset ? +sh.querySelector('[data-supeareg]').dataset.supeareg : null;
    sh.querySelector('#sup_ea_regok').click(); await W(300); out.fromRegDraft = { ...S._supD.ea }; await dbl(sh.querySelector('#sup_ea_save'), 900); out.fromRegSaved = [gyL[1], gyL[2]].map((l) => (supEachOf(l.id) || {}).cost);
    history.back(); await W(200);
    // ⑤ 🧮 인수 방식 — 실사 · 종료 확정
    const today = dstr(new Date()); const ydy = dstr(new Date(Date.now() - 864e5)); const R0 = await supCreate('인수상점', 'is', 'ms', true, 'sup'); const IS = R0.x; const isL = [mk(40, 'BLKCMN_is', ydy + 'T09:00'), mk(41, 'BLKCMN_is', ydy + 'T10:00'), mk(42, 'BLKCMN_is', today + 'T00:01')]; bump('p');
    await supCostSave(IS.id, (L) => [...L, { k: 'M1', date: '2026-10-01', amt: 1000000, at: new Date().toISOString(), by: 'x' }], 'x'); const M1 = () => supLotsOf(IS.id).lots[0];
    out.ms0 = { st: M1().state, n: M1().n, unit: M1().unit }; openSupplier(IS.id); await W(400); out.msNoAuto = !sh.querySelector('[data-suplact="ack"]') && !!sh.querySelector('[data-supmode="ms"].on');
    sh.querySelector('#sup_sv_n_M1').value = '8'; sh.querySelector('#sup_sv_d_M1').value = today; sh.querySelector('[data-supsv="M1"]').click(); await W(600); out.ms1 = { valid: M1().valid.valid, rem: M1().valid.rem, unit: Math.round(M1().unit), est: M1().est };
    await W(500); RM = runMatching(); await saveMatches(RM); out.msCost = isL.map((l) => (S.pmatch.get(l.id) || {}).cost);
    await dbl(sh.querySelector('[data-supr="M1"] [data-suplact="close"]'), 700); out.ms2 = { st: M1().state, n: M1().n, unit: Math.round(M1().unit), est: M1().est };
    history.back(); await W(200);
    // ⑥ 김미소·헌옷도라이 숫자 그대로
    const X9 = purStats(); out.kms9 = pick(X9); out.msv9 = JSON.stringify(msValid());
    // ⑦ 설명서 · 기능 찾기 · 휴대폰 항목
    const G = (window.PAGE_GUIDES || {}).suppliers; out.guide = !!G && G.walk.length >= 5 && G.walk.every((w) => w.t && w.d && w.sel) && G.chapters.length >= 4 && G.chapters.every((c) => c.id && c.t && c.items.every((it) => it.id && it.t && it.d)); out.guideSel = G.walk.every((w) => { try { document.querySelector(w.sel); return true; } catch (e) { return false; } });
    out.feat = ['새 매입처', '매입 회차', '개별 매입가', '인수 방식'].every((w) => FEAT.some((f) => f.t.includes(w))); out.thin = THIN_SEC.purchase.secs.some((x) => x[0] === 'pu_sup') && PU_LIGHT.has('pu_sup');
    out.rgen = /＋ 새 매입처/.test(JSON.stringify(rgenData())); return out; });
  ran = 1; console.log(JSON.stringify(r).slice(0, 4000));
  ok(r.puCard && r.puCardTop, '① 매입 탭 첫 화면 🏪 매입처 카드(다른 큰 카드와 같은 자리 · 매입처 수 · 이번 달 매입처별 매출 · 열기·＋ 새 매입처)'); ok(r.grpBtn, '① 매입처별 표 아래도 뚜렷한 단추');
  ok(r.nfOpen, '② 카드 「＋ 새 매입처」 → 🏪 화면 새 매입처 칸'); ok(r.nfBadNew && r.nfBadNum, '② _new(밀봉)·숫자만(날짜 코드) 막음'); ok(r.nfEx, '② 관리 코드 예 BLKCMN_sb 보임');
  ok(r.sbMade && r.sbOpened, '② 「만들기」 → srcX에 서울북스 _sb · 방식 뭉치(기본) · 그 매입처 상세 열림'); ok(r.qqWarn && r.qqArm, '② 이미 _qq가 붙은 상품 1개 — 알리고 한 번 더 눌러야 만듦');
  ok(r.dup.every(Boolean), '② 같은 이름·같은 부가 코드(대소문자)·김미소 코드 막음');
  ok(r.regHasSb, '② 🏪에서 만든 매입처가 등록 화면 매입처 단추에 이미 있음(같은 srcX)'); ok(r.gyMade, '② 등록 화면 「＋ 매입처」 → 같은 srcX에 더함 · 그 카드에 바로 골라짐'); ok(r.regDup, '② 등록 화면에서도 같은 부가 코드(SB) 막음');
  ok(JSON.stringify(r.before) === JSON.stringify(['aladin_U8100010']), '③ 매입일 앞 등록 상품은 회차 밖'); ok(r.l1.st === 'auto' && r.l1.n === 4 && r.l1.unit === 100000 && r.l1.ack === false, '③ 수량 4권에 닿은 상품에서 자동 종결 · 권당 100,000 ' + JSON.stringify(r.l1));
  ok(JSON.stringify(r.order) === JSON.stringify(['aladin_U8100012', 'aladin_U8100011']), '③ 같은 등록 분은 알라딘 상품 번호 순'); ok(r.after.length === 2, '③ 자동 종결 뒤 상품은 회차 밖(다음 회차 기다림)');
  ok(r.mt.in.every(([k, c, lot]) => k === 'sx' && c === 100000 && lot === 'L1') && r.mt.out.every((c) => c === r.mt.avg), '③ 상품별 매입가: 회차 안 = 회차 권당 · 회차 밖 = 매입처 평균 ' + JSON.stringify(r.mt));
  ok(r.homeAl, '③ 자동 종결 → 홈 오늘 확인할 것 빨간 알림'); ok(r.banner, '③ 🏪 화면 위 알림(4권째 · 확정/다른 시점 단추)');
  ok(r.pickN === 6 && r.l1b.st === 'closed' && r.l1b.how === 'pick' && r.l1b.n === 5 && r.l1b.unit === 80000 && r.closeRec === 'pick', '③ 다른 시점(5권째) 고름 → 5권 · 권당 80,000 ' + JSON.stringify(r.l1b));
  ok(r.mt2.every(([c, lot]) => c === 80000 && lot === 'L1') && r.pmSaved === 80000, '③ 고른 시점으로 그 회차 모든 상품 매입가 다시 셈·저장'); ok(r.alGone, '③ 시점을 정하면 알림 사라짐');
  ok(r.modeChips && r.card, '③ 상세: 방식 칩 3개 · 회차 카드(종결 · 시점 고름 · 경계)'); ok(r.reopen.st === 'auto' && r.reopen.n === 4 && r.reopen.hist >= 1, '③ 종결 되돌리기 → 다시 자동 종결 상태(이전 값 남음) ' + JSON.stringify(r.reopen));
  ok(r.ack.st === 'closed' && r.ack.how === 'auto' && r.ack.ack && r.ack.n === 4 && r.alGone2, '③ 「이 시점 맞음」 두 번 → 자동 시점 확정 · 알림 사라짐');
  ok(r.l2.st === 'open' && r.l2.n === 2 && r.l2.unit === null && r.l3.st === 'wait', '③ 수량 없는 다음 회차 진행(권당 \'-\') · 그다음 회차는 대기 ' + JSON.stringify([r.l2, r.l3]));
  ok(r.l2b.st === 'closed' && r.l2b.how === 'manual' && r.l2b.n === 2 && r.l2b.unit === 45000 && r.l3b.st === 'open', '③ 「이 회차 종결」 → 2권 · 권당 45,000 · 대기 회차가 진행으로 ' + JSON.stringify([r.l2b, r.l3b]));
  ok(['none', 'avgw', 'learn'].includes(r.l3b.tgt) && r.l3c.tgt === 5 && Math.round(r.l3c.unit) === 10000, '③ 무게만: 권/kg 근거(없음 → 칸) · 0.5권/kg → 목표 5권 · 추정 권당 10,000 ' + JSON.stringify([r.l3b, r.l3c]));
  ok(r.l4.amt === 400000 && r.l4.kg === 800 && r.l4.wk === 500, '③ 화면 새 회차: 800kg × 500원 = 400,000원'); ok(r.l4off.off === true && !r.l4off.inLots && r.l4off.kept === 4, '③ 계산에서 빼기(두 번) — 기록은 남음'); ok(r.oldFold, '③ 예전 매입 기록 줄 대조는 맨 아래 접힘');
  ok(r.sbAmt === 540000, '③ 매입처 매입액 = 회차 합(뺀 회차 제외) ' + r.sbAmt);
  ok(r.gyMode.m === 'each' && r.gyMode.hist === 1 && r.gyMode.from === 'lot', '④ 방식 두 번 눌러 개별로 · 바꾼 기록'); ok(r.eaRows === 4, '④ 개별 표 4개(매입가 없음)');
  ok(JSON.stringify(r.draft) === JSON.stringify({ [`aladin_U8100030`]: 3000, [`aladin_U8100031`]: 2500, [`aladin_U8100032`]: 1800, [`aladin_U8100033`]: 4500 }) && /못 읽은 줄/.test(r.pres || ''), '④ 직접·☑ 같은 값·붙여 넣기(금액만 → 빈 칸 순서 · ISBN 금액 · 못 찾은 줄 알림) ' + JSON.stringify(r.draft));
  ok(JSON.stringify(r.eaSaved) === '[3000,2500,1800,4500]' && r.eaFs, '④ 저장(두 번) → 상품별 매입가(pur_matches each)'); ok(r.gyAmt.src === 'each' && r.gyAmt.amt === 11800 && r.gyAmt.unit === 2950, '④ 매입 기록 없으면 매입액 = 개별 합 ' + JSON.stringify(r.gyAmt)); ok(r.eaNoTouch, '④ 자동 연결은 개별 매입가를 건드리지 않음');
  ok(r.eaUndo1 && r.eaHist >= 1, '④ 상품 하나 되돌리기 → 자동 연결로 · 예전 값 기록'); ok(r.eaUndoAll.every(Boolean), '④ 마지막 저장 묶음 되돌리기');
  ok(r.regField, '④ 등록 카드: 개별 매입처면 「매입가(개별 · 권당)」 칸 · 뭉치 매입처는 안내만'); ok(r.regSaved[0] === 2200 && r.regSaved[1], '④ 카드 칸 → reg_items.supCost·supId'); ok(r.regAll[0] === 2200 && r.regAll[1] === null, '④ ↧ 같은 매입처 빈 카드에만 같은 값');
  ok(r.fromReg === 2 && JSON.stringify(r.fromRegSaved) === '[2200,2200]', '④ 등록 화면에서 적은 매입가 찾기(U코드·ISBN+확정한 날) → 표 → 저장 ' + JSON.stringify([r.fromReg, r.fromRegDraft, r.fromRegSaved]));
  ok(r.ms0.st === 'open' && r.ms0.n === 3 && r.ms0.unit === null && r.msNoAuto, '⑤ 인수 방식: 실사 없으면 권당 \'-\' · 자동 종결 없음');
  ok(r.ms1.valid === 10 && r.ms1.rem === 7 && r.ms1.unit === 100000 && r.ms1.est, '⑤ 실사 남은 8 − 실사 뒤 등록 1 = 7 → 유효 10 · 권당 100,000(추정) ' + JSON.stringify(r.ms1)); ok(r.msCost.every((c) => c === 100000), '⑤ 상품별 매입가 = 추정 권당');
  ok(r.ms2.st === 'closed' && r.ms2.n === 3 && r.ms2.unit === 333333 && !r.ms2.est, '⑤ 종료 확정 → 등록 3권으로 확정 333,333');
  ok(r.kms0 === r.kms9 && r.msv0 === r.msv9, '⑥ 김미소책방·헌옷도라이 숫자(권수·매입액·권당·유효 권수) 그대로');
  ok(r.guide && r.guideSel, '⑦ PAGE_GUIDES.suppliers(따라 하기·장·항목)'); ok(r.feat && r.thin && r.rgen, '⑦ 기능 찾기 · 휴대폰 고르기(pu_sup) · 등록 백과');
}).then(async () => { ok(ran, '시험이 끝까지 돎(중간 오류 없음)'); // 📱 휴대폰: 매입 탭 🏪 매입처 카드만 골라도 큰 자료 없이 바로 · 새 매입처 칸 폭
  const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8'); await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' })); await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500);
  const q = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { thin: PHONE_THIN }; localStorage.setItem('rn-thin-sec', JSON.stringify({ purchase: ['pu_sup'] })); S.ordersLoaded = true; S.tab = 'purchase'; S.detail = null; renderTabs(); renderMainNow(); await W(600);
    const c = document.querySelector('#main [data-pusup]'); o.card = !!c; o.noBig = !S.prodLoaded; o.cardW = c ? c.getBoundingClientRect().right <= 392 : false;
    S.prodLoaded = true; S.pur = S.pur || {}; Object.assign(S.pur, { loaded: true, fresh: true, heonot: [], aOrders: [], existing: [], entries: [], set: { ...PSET_DEFAULT } }); S._supNF = { n: '폰상점', s: 'ph', m: 'lot' }; S.detail = null; openSuppliers(); await W(500); const f = document.querySelector('#sup_nf'); o.form = !!f && f.getBoundingClientRect().right <= 392 && document.documentElement.scrollWidth <= 392; return o; });
  console.log('📱', JSON.stringify(q), errs.slice(0, 3)); ok(q.thin && q.card && q.noBig && q.cardW, '📱 매입 탭 🏪 매입처 카드만 골라도 바로(상품 자료 안 받음) · 폭 안'); ok(q.form && !errs.length, '📱 새 매입처 칸 휴대폰 폭 안 · 오류 없음');
  await b.close(); console.log(bad ? `❌ ${bad}개 실패` : '✅ tSUP2 모두 통과'); process.exitCode = bad ? 1 : 0; });
