// tMAP — 정범님 11/03(11/04 카드 크기·책 자리 정보·색 더함): 🗺 서가 지도 편집 도구(심시티처럼) + 🔎 소재불명 지도 위 수색 + ⏸ 일시판매중지 옵션 + 수집기 샵매니저 🔎 수색중 띠
//   격자 크기 · 카드 만들기/코드 부여 · 끌어 놓기 · 꾹 눌러 끌어 복사 · 여러 개 고르기·지우기 · 되돌리기/다시 · 저장(바뀐 줄만·판 기록)/불러오기 · 다른 기기 저장 위에 얹기
//   · 판 되돌리기 · 저장 안 한 바뀜 이어서 · 책장 그림 짚기 색 · 휴대폰 터치(꾹 눌러 복사·두 손가락 확대·카드 끌어 놓기) · 링크 위치(상품 탭 카드·기능 찾기·휴대폰 고르기·바로 가기·설명서)
// 쓰는 법: RN_PORT=<포트> node tMAP.js
let bad = 0, ran = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const H = require('./harness.js'); const fs = require('fs'); const path = require('path');
const IN = () => { window.__W = (ms) => new Promise((r) => setTimeout(r, ms)); window.__cell = (x, y) => { const V = S.detail && S.detail.lost ? S.lostMVV : S.smV; const r = V.cv.getBoundingClientRect(); return { x: r.left + V.view.ox + (x + 0.5) * V.view.s, y: r.top + V.view.oy + (y + 0.5) * V.view.s }; }; };
const mouseDrag = async (p, pts, holdMs) => { await p.mouse.move(pts[0].x, pts[0].y); await p.mouse.down(); if (holdMs) await p.waitForTimeout(holdMs); for (const q of pts.slice(1)) { await p.mouse.move(q.x, q.y, { steps: 4 }); } await p.mouse.up(); await p.waitForTimeout(150); };
const cellOf = (p, x, y) => p.evaluate(([x, y]) => window.__cell(x, y), [x, y]);
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); await p.evaluate(IN);
  const r = {}; const ev = (f, a) => p.evaluate(f, a);
  try {
  // ① 링크 위치
  Object.assign(r, await ev(async () => { const W = window.__W; S.detail = null; document.getElementById('sheet').classList.remove('on'); S.tab = 'products'; S.q = ''; renderTabs(); renderMainNow(); await W(500); const b = document.getElementById('smapbtn');
    const G = window.PAGE_GUIDES || {}; const okG = (g) => !!(g && g.title && g.walk && g.walk.length >= 5 && g.walk.every((w) => w.t && w.d && w.sel) && g.chapters && g.chapters.every((c) => c.id && c.t && c.items && c.items.every((i) => i.id && i.t && i.k && i.d))); const fi = FEAT.findIndex((f) => /서가 지도/.test(f.t));
    return { card: !!b && b.dataset.gopage === 'shelfmap', feat: fi >= 0 && /소재불명/.test((FEAT[fi + 1] || {}).t || ''), pt: PT_SECS.some((x) => x[0] === 'pt_map'), go: GO_PAGES.some((x) => x[0] === 'shelfmap'), guides: okG(G.shelfmap) && okG(G.lost) }; }));
  // ② 새 지도 50×50
  await ev(async () => { window.ask = async () => true; S.detail = null; openShelfMap(); await window.__W(500); }); await p.click('[data-smsz="50"]'); await p.fill('#sm_nm', '1층 서고'); await p.click('[data-smmake]'); await p.waitForTimeout(800);
  Object.assign(r, await ev(() => { const id = S.detail && S.detail.ed; const M = S.sm.maps[id]; window.__mid = id; return { mapId: id, mapWH: M ? M.w + 'x' + M.h : null, def: S.sm.def === id, cv: !!document.getElementById('sm_cv') }; }));
  // ③ 카드 만들기 — 책장 5칸 × 25권 · 관리코드 BLKCMN·YLWNOT
  await p.click('[data-smnew]'); await p.waitForTimeout(150); await p.click('[data-smck="shelf"]'); await p.fill('[data-smcf="rows"]', '5'); await p.fill('[data-smcf="per"]', '25'); await p.click('[data-smcc="BLKCMN"]'); await p.waitForTimeout(100); await p.click('[data-smcc="YLWNOT"]'); await p.waitForTimeout(100); await p.fill('[data-smcf="name"]', '일반 책장'); await p.click('[data-smcsave]'); await p.waitForTimeout(500);
  Object.assign(r, await ev(() => { const C = ((window.__FS.prd_system || {}).shelfmap || {}).cards || {}; const [id, c] = Object.entries(C)[0] || []; window.__cid = id; return { card1: c ? { codes: (c.codes || []).join(','), rows: c.rows, per: c.per, kind: c.kind, name: c.name } : null, brush: S.smE && S.smE.brush === id, palN: document.querySelectorAll('[data-smcard]').length }; }));
  // 박스 카드도 하나(코드 둘 이상 부여)
  await p.click('[data-smnew]'); await p.waitForTimeout(150); await p.click('[data-smck="box"]'); await p.waitForTimeout(100); await p.fill('[data-smcf="per"]', '40'); await p.fill('[data-smcf="boxN"]', '3'); await p.fill('[data-smcf="more"]', 'DUPES, bluwkb'); await p.click('[data-smcsave]'); await p.waitForTimeout(500);
  Object.assign(r, await ev(() => { const C = ((window.__FS.prd_system || {}).shelfmap || {}).cards || {}; const b = Object.entries(C).find(([, c]) => c.kind === 'box'); window.__bid = b && b[0]; return { box: b ? { codes: (b[1].codes || []).join(','), boxN: b[1].boxN, per: b[1].per } : null }; }));
  // ④ 카드 끌어 놓기(마우스) — 책장 카드를 (2,2)로
  await ev(() => { S.smE.brush = null; S.smE.mode = 'pan'; smEdPanels(); }); await p.waitForTimeout(150);
  { const bx = await p.locator(`[data-smcard="${await ev(() => window.__cid)}"]`).boundingBox(); const t = await cellOf(p, 2, 2); await mouseDrag(p, [{ x: bx.x + 30, y: bx.y + 20 }, { x: t.x, y: t.y }]); }
  Object.assign(r, await ev(() => ({ placed: S.smE.cells.get(smK(2, 2)) === window.__cid, n1: S.smE.cells.size })));
  // 꾹 눌러 끌어 복사 → (3..7, 2) · 이미 놓인 칸은 건너뜀
  { const a = await cellOf(p, 2, 2), b = await cellOf(p, 7, 2); await mouseDrag(p, [a, b], 650); }
  Object.assign(r, await ev(() => ({ copyN: S.smE.cells.size, row2: [2, 3, 4, 5, 6, 7].every((x) => S.smE.cells.get(smK(x, 2)) === window.__cid), undoTop: (S.smE.undo[S.smE.undo.length - 1] || {}).t })));
  // 짧게 누르고 끌면(꾹 아님) 지도 이동 — 칸은 그대로
  { const v0 = await ev(() => ({ ...S.smV.view })); const a = await cellOf(p, 5, 2); await mouseDrag(p, [a, { x: a.x + 60, y: a.y + 40 }]); Object.assign(r, await ev((v0) => ({ panMoved: Math.abs(S.smV.view.ox - v0.ox - 60) < 3, panSame: S.smE.cells.size === 6 }), v0)); await ev(() => smFit(S.smV)); await p.waitForTimeout(150); }
  // 박스 붓으로 (10,10) 누르기
  await ev(() => { S.smE.brush = window.__bid; S.smE.mode = 'place'; smEdPanels(); }); { const t = await cellOf(p, 10, 10); await p.mouse.click(t.x, t.y); await p.waitForTimeout(150); }
  Object.assign(r, await ev(() => ({ boxPlaced: S.smE.cells.get(smK(10, 10)) === window.__bid })));
  // ⑤ 여러 개 고르기(네모) → 지우기 → 되돌리기/다시
  await p.click('[data-smmode="select"]'); await p.waitForTimeout(100); { const a = await cellOf(p, 3, 2), b = await cellOf(p, 5, 2); await mouseDrag(p, [a, b]); }
  Object.assign(r, await ev(() => ({ selN: S.smE.sel.size }))); await p.click('#sm_del'); await p.waitForTimeout(150);
  Object.assign(r, await ev(() => ({ afterDel: S.smE.cells.size }))); await p.click('#sm_undo'); await p.waitForTimeout(100); Object.assign(r, await ev(() => ({ afterUndo: S.smE.cells.size }))); await p.click('#sm_redo'); await p.waitForTimeout(100); Object.assign(r, await ev(() => ({ afterRedo: S.smE.cells.size }))); await p.keyboard.press('Control+z'); await p.waitForTimeout(100); Object.assign(r, await ev(() => ({ afterKeyUndo: S.smE.cells.size })));
  // ⑥ 책장 그림 짚기 — (4,2)를 눌러 고르고 3번 칸 5번째 책을 짚음
  await p.click('[data-smmode="pan"]'); { const t = await cellOf(p, 4, 2); await p.mouse.click(t.x, t.y); await p.waitForTimeout(200); }
  Object.assign(r, await ev(async () => { const sh = document.getElementById('sheet'); const rows = sh.querySelectorAll('#sm_info .sm-row').length; const sp = sh.querySelectorAll('#sm_info .sm-row:nth-child(3) .sm-bks i').length; const pk0 = sh.querySelectorAll('#sm_info .sm-bks i.pk').length; const k = smK(4, 2); sh.querySelector(`[data-smb="${k}|3|5"]`).click(); await window.__W(150); const el = sh.querySelector(`[data-smb="${k}|3|5"]`); return { shelfRows: rows, spines: sp, pk0, pk: el && el.classList.contains('pk') && !!el.style.background, pickTxt: /3번 칸 5번째 책/.test(sh.querySelector('#sm_info').textContent) }; }));
  // ⑦ 저장 → 바뀐 줄만 · 판 기록 · 다시 불러오기
  await p.click('#sm_save'); await p.waitForTimeout(700);
  Object.assign(r, await ev(() => { const P = window.__FS.prd_system; const id = window.__mid; const pg = P['shelfmap_m_' + id] || {}; const h = P['shelfmap_h_' + id] || {}; const M = P.shelfmap.maps[id]; return { rows: JSON.stringify(pg.rows), ver: M.ver, n: M.n, hist: (h.vers || []).length, histD: !!((h.vers || [])[0] || {}).d, dirty0: S.smE.dirty }; }));
  // 다른 기기가 저장(10번 줄에 박스 하나 더) → 이 기기에서 다른 칸을 바꿔 저장 → 둘 다 남음
  await ev(async () => { const id = window.__mid; await db.collection('prd_system').doc('shelfmap_m_' + id).set({ rows: { 10: `10.1.${window.__bid};12.1.${window.__bid}` }, ver: 2 }, { merge: true }); await db.collection('prd_system').doc('shelfmap').set({ maps: { [id]: { ver: 2, n: 8 } } }, { merge: true }); await window.__W(300); S.smE.cells.delete(smK(7, 2)); smOp(S.smE, [[smK(7, 2), window.__cid, undefined]], '지우기'); smEdPanels(); });
  await p.click('#sm_save'); await p.waitForTimeout(800);
  Object.assign(r, await ev(() => { const P = window.__FS.prd_system; const id = window.__mid; const pg = P['shelfmap_m_' + id] || {}; return { merged: JSON.stringify(pg.rows), ver2: P.shelfmap.maps[id].ver, eCells: S.smE.cells.size }; }));
  // 저장 안 한 바뀜 — 닫았다 다시 열면 이어서
  await ev(async () => { S.smE.cells.set(smK(20, 20), window.__cid); smOp(S.smE, [[smK(20, 20), undefined, window.__cid]], '놓기'); history.back(); await window.__W(500); });
  Object.assign(r, await ev(async () => { const back = !!(S.detail && S.detail.shelfmap && !S.detail.ed); const draftMark = /저장 안 한 바뀜 있음/.test(document.getElementById('sheet').textContent); S.smRows = {}; document.querySelector(`[data-smopen="${window.__mid}"]`).click(); await window.__W(900); return { back, draftMark, draftKept: !!(S.smE && S.smE.cells.get(smK(20, 20)) === window.__cid && S.smE.dirty), loaded: S.smE && S.smE.cells.has(smK(12, 10)) }; }));
  await ev(async () => { smUndo(S.smE); await window.__W(100); });
  // ⑧ 판 기록 → 판 1로 되돌리기(새 판으로 · 기록)
  await ev(async () => { history.back(); await window.__W(500); document.querySelector(`[data-smvers="${window.__mid}"]`).click(); await window.__W(600); });
  { const sel = await ev(() => `[data-smrest="${window.__mid}|1"]`); await p.click(sel); await p.waitForTimeout(150); await p.click(sel); await p.waitForTimeout(900); }
  Object.assign(r, await ev(() => { const P = window.__FS.prd_system; const id = window.__mid; const M = P.shelfmap.maps[id]; const pg = P['shelfmap_m_' + id] || {}; const h = P['shelfmap_h_' + id] || {}; return { restVer: M.ver, restRows: JSON.stringify(pg.rows), restNote: ((h.vers || []).slice(-1)[0] || {}).note, verList: document.querySelectorAll('.sm-vers .lo-evr').length }; }));
  // 크기 바꾸기 — 밖으로 나가는 칸이 있으면 막음
  Object.assign(r, await ev(async () => { const sh = document.getElementById('sheet'); document.querySelector(`[data-smopen="${window.__mid}"]`).click(); await window.__W(800); sh.querySelector('[data-smsize]').click(); await window.__W(100); sh.querySelector('#sm_rw').value = '8'; sh.querySelector('#sm_rh').value = '8'; sh.querySelector('[data-smsizeok]').click(); await window.__W(100); const blocked = S.smE.w === 50; sh.querySelector('#sm_rw').value = '60'; sh.querySelector('#sm_rh').value = '55'; sh.querySelector('[data-smsizeok]').click(); await window.__W(100); sh.querySelector('#sm_save').click(); await window.__W(700); const M = window.__FS.prd_system.shelfmap.maps[window.__mid]; return { sizeBlocked: blocked, sized: M.w + 'x' + M.h }; }));
  // ⑨ 🔎 소재불명 — 지도 위 수색
  Object.assign(r, await ev(async () => { const W = window.__W; const sh = document.getElementById('sheet'); const A = [...S.plist.values()]; const l = A[0]; l.sku = 'BLKCMN'; l.status = '판매중'; l.active = true; l.qty = 1; history.back(); await W(300); history.back(); await W(300);
    const x = await lostAdd({ key: l.usedCode, kind: 'al', title: l.title, skus: [], from: 'bbuy' }); await W(300); window.__lcid = x.cid; openLostCase(x.cid); await W(1200); lostRenderForce(); await W(700);
    const V = S.lostMVV; return { lmap: !!sh.querySelector('.lo-smap canvas'), hl: V && V.ov ? V.ov.hl.size : -1, nextMap: [...sh.querySelectorAll('.lo-nx')].map((n) => n.innerText.replace(/\s+/g, ' ')).filter((t) => /🗺/.test(t)).length, nextNum: V && V.ov ? V.ov.next.size : -1, alid: !!(S.lost.cases[x.cid] || {}).alid }; }));
  await ev(async () => { document.getElementById('lo_mcv').scrollIntoView({ block: 'center' }); await window.__W(300); }); { const t = await cellOf(p, 4, 2); await p.mouse.click(t.x, t.y); await p.waitForTimeout(600); }
  Object.assign(r, await ev(async () => { const W = window.__W; const sh = document.getElementById('sheet'); const cid = window.__lcid; const F = S.lostF[cid]; const o = { tapF: [F.mp === window.__mid, F.x, F.y, F.whole].join('|'), panel: sh.querySelectorAll('.lo-shp .sm-row').length };
    const k = smK(4, 2); sh.querySelector(`.lo-shp [data-smb="${k}|2|3"]`).click(); await W(300); o.pickF = [S.lostF[cid].row, S.lostF[cid].pos, S.lostF[cid].whole].join('|'); o.mpk = (sh.querySelector('.lo-mpk') || {}).textContent || '';
    sh.querySelector('[data-lores="none"]').click(); await W(150); sh.querySelector('[data-losave]').click(); await W(700); const L = (((window.__FS.prd_system || {})['lost_c_' + cid] || {}).logs || []); const z = L[L.length - 1] || {}; o.log = { mp: z.mp === window.__mid, x: z.x, y: z.y, row: z.row, pos: z.pos, shelf: z.shelf, cn: z.cn };
    lostRenderForce(); await W(600); const V = S.lostMVV; o.seen = V && V.ov && V.ov.seen.has(k); const sp = sh.querySelector(`.lo-shp [data-smb="${k}|2|3"]`); o.spineCol = !!(sp && sp.classList.contains('mk')); o.logTxt = /🗺/.test((sh.querySelector('.lo-log') || {}).textContent || ''); return o; }));
  // ⑩ ⏸ 일시판매중지 옵션
  Object.assign(r, await ev(async () => { const W = window.__W; const sh = document.getElementById('sheet'); const FS = window.__FS; const cmds = () => Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit' && c.op !== 'read'); const lc = (cid) => (FS.prd_system.lost.cases || {})[cid] || {};
    openLost(); await W(500); const pm = sh.querySelector('[data-lopmode="pause"]'); pm.click(); await W(400); const o = { cfgPause: (FS.prd_system.lost.cfg || {}).pause === true };
    const l = [...S.plist.values()].slice(-1)[0]; l.status = '판매중'; l.active = true; l.qty = 1; l.sku = 'GRNSTD'; const n0 = cmds().length; const x = await lostAdd({ key: l.usedCode, kind: 'al', title: l.title, skus: [], from: 'prod' }); await W(300); o.pauseCmd = cmds().slice(n0).map((c) => c.ch.state).join(','); o.how = (lc(x.cid).stop || {}).how;
    o.band = lostBand(l); l.status = '일시판매중지'; history.back(); await W(300); openStopList({ st: '일시판매중지', g: 'all' }); await W(500); o.pauseList = [...sh.querySelectorAll('.lo-band')].some((b) => b.dataset.locase === x.cid);
    // 상품 카드·상품 상세에도
    o.card = /lo-band/.test(prodCard2(l)); history.back(); await W(300); await openProduct(l.id); await W(600); o.pd = !!sh.querySelector('.lo-band.big') && !!sh.querySelector('.lo-pdon');
    // 사건마다 끄기(판매중지로) → 다시 일시판매중지
    openLostCase(x.cid); await W(800); S.peFld && S.peFld.delete(l.id + ':state'); const n1 = cmds().length; const b1 = () => sh.querySelector('[data-lopause]'); b1().click(); await W(100); b1().click(); await W(700); o.off = [cmds().slice(n1).map((c) => c.ch.state).join(','), (lc(x.cid).stop || {}).how].join('|');
    S.peFld && S.peFld.delete(l.id + ':state'); const n2 = cmds().length; b1().click(); await W(100); b1().click(); await W(700); o.on = [cmds().slice(n2).map((c) => c.ch.state).join(','), (lc(x.cid).stop || {}).how].join('|');
    // 종결 → 판매중지(분실) · 되돌리기 → 다시 일시판매중지
    window.prompt = () => '없음'; S.peFld && S.peFld.delete(l.id + ':state'); const n3 = cmds().length; const dbl = async (s) => { sh.querySelector(s).click(); await W(100); sh.querySelector(s).click(); await W(900); }; await dbl('[data-loclose]'); o.close = [cmds().slice(n3).map((c) => c.ch.state).join(','), lc(x.cid).st, !!(lc(x.cid).closed || {}).st8].join('|');
    S.peFld && S.peFld.delete(l.id + ':state'); const n4 = cmds().length; await dbl('[data-loundo="closed"]'); o.reopen = [cmds().slice(n4).map((c) => c.ch.state).join(','), lc(x.cid).st].join('|');
    // 발견 → 판매중 복구(소재불명 전 = 판매중)
    S.peFld && S.peFld.delete(l.id + ':state'); await dbl('[data-lofound]'); const n5 = cmds().length; await dbl('[data-lonext="sell"]'); o.sell = cmds().slice(n5).map((c) => c.ch.state).join(','); o.noBand = !lostBand(l);
    // 이미 일시판매중지였던 매물 → 맡기지 않고 표시만 · 발견해도 일시판매중지 그대로
    const l2 = [...S.plist.values()].slice(-2)[0]; l2.status = '일시판매중지'; l2.active = true; l2.qty = 1; const n6 = cmds().length; const y = await lostAdd({ key: l2.usedCode, kind: 'al', title: l2.title, skus: [], from: 'prod' }); await W(300); o.pre = [cmds().length - n6, (lc(y.cid).stop || {}).how, (lc(y.cid).stop || {}).pre].join('|');
    // 옵션 끄면 새 사건은 다시 판매중지
    history.back(); await W(400); history.back(); await W(400); openLost(); await W(500); sh.querySelector('[data-lopmode="stop"]').click(); await W(400); const l3 = [...S.plist.values()].slice(-3)[0]; l3.status = '판매중'; l3.active = true; l3.qty = 1; const n7 = cmds().length; await lostAdd({ key: l3.usedCode, kind: 'al', title: l3.title, skus: [], from: 'prod' }); await W(300); o.defStop = cmds().slice(n7).map((c) => c.ch.state).join(','); return o; }));
  } finally { if (!r.defStop) console.log('부분 결과', JSON.stringify(r).slice(0, 3000)); }
  ran++; console.log(JSON.stringify(r).slice(0, 6000));
  ok(r.card && r.feat && r.pt && r.go, '링크: 상품 탭 첫 화면 🗺 서가 지도 카드 · 🔍 기능 찾기(소재불명 바로 위) · 📱 휴대폰 고르기 pt_map · 🚪 바로 가기');
  ok(r.guides, '📖 화면 설명서 PAGE_GUIDES shelfmap·lost (따라 하기 sel · 장·항목 모양)');
  ok(r.mapWH === '50x50' && r.def && r.cv, `새 지도 ${r.mapWH} · ⭐ 기본 · 편집 캔버스`);
  ok(r.card1 && r.card1.codes === 'BLKCMN,YLWNOT' && r.card1.rows === 5 && r.card1.per === 25 && r.card1.kind === 'shelf' && r.brush, `카드 만들기·코드 여럿 부여 ${JSON.stringify(r.card1)} · 만든 카드가 붓`);
  ok(r.box && r.box.codes === 'DUPES,BLUWKB' && r.box.boxN === 3 && r.box.per === 40, `박스 카드(박스당 책·박스 수·그 밖 코드) ${JSON.stringify(r.box)}`);
  ok(r.placed && r.n1 === 1, '카드를 끌어 빈칸에 놓기(마우스)');
  ok(r.copyN === 6 && r.row2 && r.undoTop === '복사 끌기', `꾹 눌러 끌어 복사 → ${r.copyN}칸 (${r.undoTop})`);
  ok(r.panMoved && r.panSame, '짧게 끌면 지도 이동(칸 그대로)');
  ok(r.boxPlaced, '붓으로 빈칸 누르기 → 박스 놓기');
  ok(r.selN === 3 && r.afterDel === 4 && r.afterUndo === 7 && r.afterRedo === 4 && r.afterKeyUndo === 7, `네모 고르기 ${r.selN} → 지우기 ${r.afterDel} → ↶ ${r.afterUndo} → ↷ ${r.afterRedo} → Ctrl+Z ${r.afterKeyUndo}`);
  ok(r.shelfRows === 5 && r.spines === 25 && r.pk0 === 0 && r.pk && r.pickTxt, `책장 그림 ${r.shelfRows}칸 × 책등 ${r.spines} · 평소 색 없음 · 짚으면 색·'3번 칸 5번째 책'`);
  ok(/"2":"2\.6\.c/.test(r.rows) && /"10":"10\.1\./.test(r.rows) && r.ver === 1 && r.n === 7 && r.hist === 1 && r.histD && !r.dirty0, `저장 = 놓인 칸만 줄 부호 ${r.rows} · 판 ${r.ver} · 기록 ${r.hist}`);
  ok(/"2":"2\.5\.c/.test(r.merged) && /"10":"10\.1\.c[^"]*;12\.1\./.test(r.merged) && r.ver2 === 3 && r.eCells === 7, `다른 기기 저장 위에 내 바뀐 칸만 얹음 ${r.merged} · 판 ${r.ver2}`);
  ok(r.back && r.draftMark && r.draftKept && r.loaded, '저장 안 한 바뀜 — 닫았다 열어도 이어서 · 다시 불러오기');
  ok(r.restVer === 4 && /"2":"2\.6\./.test(r.restRows) && /판 1로 되돌림/.test(r.restNote || ''), `📜 판 1로 되돌림 → 새 판 ${r.restVer} ${r.restRows}`);
  ok(r.sizeBlocked && r.sized === '60x55', `크기: 밖으로 나가는 칸 있으면 막음 · 넓히기 ${r.sized}`);
  ok(r.lmap && r.hl === 6 && r.nextMap >= 1 && r.nextNum >= 1 && r.alid, `🔎 소재불명 지도: 이 책 서가(BLKCMN) 책장 ${r.hl}곳 강조 · 다음에 볼 곳 지도 ${r.nextMap} · 빨간 번호 ${r.nextNum} · 알라딘 상품번호 남김`);
  ok(/^true\|4\|2\|true$/.test(r.tapF) && r.panel === 5 && r.pickF === '2|3|false' && /2번 칸/.test(r.mpk), `지도 책장 누름 → 기록지 ${r.tapF} · 책등 짚음 → ${r.pickF} · ${r.mpk.trim().slice(0, 60)}`);
  ok(r.log.mp && r.log.x === 4 && r.log.y === 2 && r.log.row === 2 && r.log.pos === 3 && r.log.shelf === 'BLKCMN' && r.log.cn === '일반 책장' && r.seen && r.spineCol && r.logTxt, `기록 줄에 지도 자리 ${JSON.stringify(r.log)} · 지도 색 · 그 책등 색`);
  ok(r.cfgPause && r.pauseCmd === '일시판매중지' && r.how === 'pause' && /수색중/.test(r.band) && /일시판매중지/.test(r.band), `⏸ 옵션 → 일시판매중지 맡김(${r.pauseCmd}) · 띠 '${(r.band || '').replace(/<[^>]+>/g, '').trim().slice(0, 40)}'`);
  ok(r.pauseList && r.card && r.pd, '🔎 수색중 띠: ⏸ 판매일시중지 목록 · 상품 카드 · 상품 상세(크게)');
  ok(r.off === '판매중지|stop' && r.on === '일시판매중지|pause', `사건마다 옵션 끄기 → ${r.off} · 다시 → ${r.on}`);
  ok(r.close === '판매중지|closed|true' && r.reopen === '일시판매중지|open', `종결 → ${r.close} · 되돌리기 → ${r.reopen}`);
  ok(r.sell === '판매중' && r.noBand, `발견 → 판매중 복구 ${r.sell} · 띠 사라짐`);
  ok(r.pre === '0|pause|1', `이미 일시판매중지 → 맡기지 않고 표시만 ${r.pre}`);
  ok(r.defStop === '판매중지', `옵션 끄면 새 사건은 다시 판매중지(${r.defStop})`);
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.evaluate(IN);
  // 🏷 (11/04) 카드에 상품코드(U…) 하나·여럿 부여 → 소재불명 다음에 볼 곳 맨 앞 · 상품 상세 '🗺 서가 지도 자리' · 사건 화면 설명서
  const r = await p.evaluate(async () => { const W = window.__W; const sh = document.getElementById('sheet'); window.ask = async () => true; const FS = window.__FS; const o = {};
    const A = [...S.plist.values()].filter((l) => l.usedCode); const l1 = A[1], l2 = A[2]; l1.sku = 'PNKLUX'; l1.status = '판매중'; l1.active = true; l1.qty = 1;
    await db.collection('prd_system').doc('shelfmap').set({ maps: { mI: { name: '2층 창고', kind: 'store', w: 30, h: 30, ver: 0, n: 0, hpg: 1, hb: 0 } }, cards: {}, def: 'mI' }, { merge: true }); await W(300);
    openShelfMap(); await W(400); sh.querySelector('[data-smopen="mI"]').click(); await W(900);
    sh.querySelector('[data-smnew]').click(); await W(150); sh.querySelector('[data-smck="box"]').click(); await W(150); sh.querySelector('[data-smcf="name"]').value = '박스 A';
    const q = sh.querySelector('#sm_itq'); q.value = `${l1.usedCode}, ZZZ999`; q.dispatchEvent(new Event('input', { bubbles: true })); sh.querySelector('[data-smitadd]').click(); await W(200);
    o.add1 = (S.smCF.items || []).join(','); o.badKept = (sh.querySelector('#sm_itq') || {}).value;
    const t2 = String(l2.title || '').replace(/^\[중고[^\]]*\]\s*/, '').slice(0, 6); const q2 = sh.querySelector('#sm_itq'); q2.value = l2.usedCode.slice(0, 7) === t2 ? t2 : (t2.length >= 2 ? t2 : l2.usedCode); q2.dispatchEvent(new Event('input', { bubbles: true })); await W(400); const hit = sh.querySelector(`#sm_itr [data-smita="${l2.usedCode}"]`); o.find = !!hit; if (hit) hit.click(); await W(200);
    o.chips = sh.querySelectorAll('#sm_its .sm-it').length; sh.querySelector('[data-smcsave]').click(); await W(600);
    const C = FS.prd_system.shelfmap.cards || {}; const [cid, cd] = Object.entries(C).find(([, c]) => c.name === '박스 A') || []; o.saved = cd ? (cd.items || []).join(',') : null; window.__icid = cid;
    // 고치기: 하나 빼기 → 이전 값은 prev
    sh.querySelector(`[data-smcedit="${cid}"]`).click(); await W(200); o.editLoad = (S.smCF.items || []).length; sh.querySelector(`[data-smitx="${l2.usedCode}"]`).click(); await W(150); sh.querySelector('[data-smcsave]').click(); await W(600); const cd2 = FS.prd_system.shelfmap.cards[cid]; o.edited = (cd2.items || []).join(','); o.prev = ((cd2.prev || [])[0] || { v: {} }).v.items.length;
    o.pal = /상품 1/.test((sh.querySelector(`[data-smcard="${cid}"]`) || {}).textContent || '');
    // 놓고 저장
    S.smE.brush = cid; S.smE.mode = 'place'; smEdPanels(); await W(100); const t = window.__cell(3, 3); const cv = sh.querySelector('#sm_cv'); const pe = (type) => cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 3, pointerType: 'mouse', isPrimary: true, clientX: t.x, clientY: t.y, button: 0, buttons: type === 'pointerup' ? 0 : 1 })); pe('pointerdown'); pe('pointerup'); await W(200); o.placed = S.smE.cells.get(smK(3, 3)) === cid;
    S.smE.focus = smK(3, 3); smEdPanels(); await W(100); o.info = /부여한 상품코드 1/.test((sh.querySelector('#sm_info') || {}).textContent || ''); sh.querySelector('#sm_save').click(); await W(800);
    history.back(); await W(300); history.back(); await W(300);
    // 소재불명: 이 책 상품코드 카드가 다음에 볼 곳 맨 앞
    const x = await lostAdd({ key: l1.usedCode, kind: 'al', title: l1.title, skus: [], from: 'prod' }); await W(300); openLostCase(x.cid); await W(1200); lostRenderForce(); await W(700);
    const N = lostNext(x.cid); o.next0 = N[0] ? String(N[0].why || '') + ' | ' + String(N[0].where || '') : ''; const V = S.lostMVV; o.own = V && V.ov && V.ov.own ? V.ov.own.size : -1;
    S.lostMP = { cid: x.cid, mp: 'mI', k: smK(3, 3) }; lostRenderForce(); await W(500); o.panel = /이 책 상품코드를 부여한 카드/.test((sh.querySelector('.lo-shp') || {}).textContent || '');
    o.guide = !!(window.PAGE_GUIDES.lostCase && !window.PAGE_GUIDES.lostCase.pending && window.PAGE_GUIDES.lostCase.walk.length >= 5 && window.PAGE_GUIDES.lostCase.title.includes('사건'));
    // 상품 상세: 🗺 서가 지도 자리
    await openProduct(l1.id); await W(600); o.pd = ((sh.querySelector('.sm-pl') || {}).textContent || '').replace(/\s+/g, ' ');
    return o; });
  ran++; console.log(JSON.stringify(r));
  ok(/^U\d+$/.test(r.add1) && r.badKept === 'ZZZ999', `🏷 상품코드 넣기: U코드 → ${r.add1} · 못 찾은 글은 칸에 남김(${r.badKept})`);
  ok(r.find && r.chips === 2 && r.saved && r.saved.split(',').length === 2, `🏷 제목으로 찾아 ＋ → 카드에 상품코드 ${r.chips}개 저장 (${r.saved})`);
  ok(r.editLoad === 2 && r.edited.split(',').length === 1 && r.prev === 2 && r.pal, `🏷 카드 고치기: 하나 빼기 → ${r.edited} · 이전 값 남음(${r.prev}) · 카드 목록에 '상품 1'`);
  ok(r.placed && r.info, '🏷 놓은 칸 정보에 부여한 상품코드');
  ok(/상품코드/.test(r.next0) && /박스 A/.test(r.next0) && r.own === 1 && r.panel, `🔎 소재불명: 상품코드 카드가 다음에 볼 곳 맨 앞 '${r.next0.slice(0, 70)}' · 지도 강조 ${r.own}`);
  ok(/서가 지도 자리/.test(r.pd) && /박스 A/.test(r.pd) && /\(4,4\)/.test(r.pd), `상품 상세: '${r.pd.slice(0, 60)}'`);
  ok(r.guide, '📖 소재불명 사건 화면 설명서(lostCase — 작성 중 아님)');
})).then(() => H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.evaluate(IN);
  // 📐 (11/04) 카드 크기(가로×세로 칸) — 크기 놓기·겹침 막기·돌리기·옮기기·복사·되돌리기·예전 1×1 자료 · 📝 책 자리 정보 · 🎨 색 · 범례
  const r = {}; const ev = (f, a) => p.evaluate(f, a);
  await ev(async () => { const W = window.__W; window.ask = async () => true; const now = new Date().toISOString();
    await db.collection('prd_system').doc('shelfmap_m_mB').set({ rows: { 5: '5.2.cO' }, ver: 1 }, { merge: true });
    await db.collection('prd_system').doc('shelfmap').set({ maps: { mB: { name: '3층 서고', kind: 'floor', w: 30, h: 30, ver: 1, n: 2, hpg: 1, hb: 0 } }, cards: { cO: { kind: 'shelf', name: '옛 책장', rows: 3, per: 10, codes: [], at: now } }, def: 'mB' }, { merge: true }); await W(300);
    openShelfMap(); await W(400); document.querySelector('[data-smopen="mB"]').click(); await W(900); });
  // 예전 1×1 자료 그대로
  Object.assign(r, await ev(() => { const E = S.smE; const a = smObjAt(E.cells, smK(5, 5)), b = smObjAt(E.cells, smK(6, 5)); return { old: [a.w, a.h, b.w, b.h, smK(a.x, a.y) !== smK(b.x, b.y)].join('|'), oldPal: /놓임 2/.test((document.querySelector('[data-smcard="cO"]') || {}).textContent || '') }; }));
  // 카드 만들기 — 3×2 (크기 단추) · 관리코드 BLKCMN
  await p.click('[data-smnew]'); await p.waitForTimeout(150); await p.fill('[data-smcf="name"]', '큰 책장'); await p.fill('[data-smcf="rows"]', '4'); await p.fill('[data-smcf="per"]', '20'); await p.click('[data-smcsz="3x2"]'); await p.waitForTimeout(100); await p.click('[data-smcc="BLKCMN"]'); await p.waitForTimeout(100); await p.click('[data-smcsave]'); await p.waitForTimeout(500);
  Object.assign(r, await ev(() => { const C = window.__FS.prd_system.shelfmap.cards; const [id, c] = Object.entries(C).find(([, x]) => x.name === '큰 책장') || []; window.__bg = id; S.smE.brush = null; S.smE.mode = 'pan'; smEdPanels(); return { bigCard: c ? [c.sw, c.sh, c.rows, (c.codes || []).join(',')].join('|') : null, palTxt: /3×2칸 차지/.test((document.querySelector(`[data-smcard="${id}"]`) || {}).textContent || '') }; }));
  // 끌어 놓기 — 끄는 동안 3×2 그림자(초록) · 놓으면 6칸 한 물건
  const bg = await ev(() => window.__bg); const cardBox = async () => p.locator(`[data-smcard="${bg}"]`).boundingBox();
  const dragCard = async (cx, cy, probe) => { const bx = await cardBox(); const t = await cellOf(p, cx, cy); await p.mouse.move(bx.x + 30, bx.y + 20); await p.mouse.down(); await p.mouse.move(t.x, t.y, { steps: 6 }); const g = probe ? await ev(() => JSON.stringify(S.smV.ghost)) : null; await p.mouse.up(); await p.waitForTimeout(200); return g; };
  r.ghost1 = await dragCard(10, 10, true);
  Object.assign(r, await ev(() => { const E = S.smE; const v = E.cells.get(smK(10, 10)); const keys = [...E.cells.entries()].filter(([, x]) => x === v).map(([k]) => k); return { put: v, putN: keys.length, putSel: E.sel.has(smK(10, 10)) && E.sel.size === 1, ghostClear: !S.smV.ghost }; }));
  // 겹치는 자리·지도 밖 — 빨간 그림자 · 놓지 않음
  r.ghostBad = await dragCard(11, 11, true); r.ghostOut = await dragCard(28, 28, true);
  Object.assign(r, await ev(() => ({ afterBad: S.smE.cells.size })));
  // 꾹 눌러 끌어 복사 — 3칸 간격(겹치지 않게)
  { const a = await cellOf(p, 10, 10), b = await cellOf(p, 17, 10); await mouseDrag(p, [a, b], 650); }
  Object.assign(r, await ev(() => { const E = S.smE; const heads = [...E.cells.entries()].filter(([k, v]) => smIsHead(v, k) && smCid(v) === window.__bg).map(([k]) => `${smX(k)},${smY(k)}`); return { copyHeads: heads.sort().join(' '), copyCells: E.cells.size, copyTop: (E.undo[E.undo.length - 1] || {}).t }; }));
  // 붓으로 옛 1×1 카드를 (10,12)에 → (10,10) 물건 돌리면 겹침 → 그대로
  await ev(() => { S.smE.brush = 'cO'; S.smE.mode = 'place'; smEdPanels(); }); { const t = await cellOf(p, 10, 12); await p.mouse.click(t.x, t.y); await p.waitForTimeout(150); }
  await ev(() => { S.smE.brush = null; S.smE.mode = 'pan'; smEdPanels(); }); { const t = await cellOf(p, 11, 11); await p.mouse.click(t.x, t.y); await p.waitForTimeout(150); }
  Object.assign(r, await ev(() => ({ tapHead: S.smE.focus === smK(10, 10) && S.smE.sel.has(smK(10, 10)), infoLoc: /\(11,11\)~\(13,12\) 3×2/.test(document.getElementById('sm_info').textContent) })));
  await p.keyboard.press('r'); await p.waitForTimeout(150);
  Object.assign(r, await ev(() => ({ rotBlocked: S.smE.cells.get(smK(10, 10)) === smVal(window.__bg, 10, 10, 3, 2) })));
  // (16,10) 물건 돌리기 → 2×3
  { const t = await cellOf(p, 17, 11); await p.mouse.click(t.x, t.y); await p.waitForTimeout(150); } await p.click('#sm_rot'); await p.waitForTimeout(150);
  Object.assign(r, await ev(() => { const E = S.smE; const o = smObjAt(E.cells, smK(16, 12)); return { rot: o ? [o.x, o.y, o.w, o.h].join(',') : null, rotFree: !E.cells.has(smK(18, 10)) }; }));
  // 옮기기 — (13,10) 물건을 골라 끌어 (13,20)으로 · 겹치는 곳으로는 안 옮김
  { const t = await cellOf(p, 13, 10); await p.mouse.click(t.x, t.y); await p.waitForTimeout(150); const a = await cellOf(p, 13, 10), b = await cellOf(p, 13, 20); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(b.x, b.y, { steps: 6 }); r.moveGhost = await ev(() => JSON.stringify(S.smV.ghost)); await p.mouse.up(); await p.waitForTimeout(200); }
  Object.assign(r, await ev(() => { const E = S.smE; return { moved: E.cells.get(smK(14, 21)) === smVal(window.__bg, 13, 20, 3, 2) && !E.cells.has(smK(13, 10)), moveTop: (E.undo[E.undo.length - 1] || {}).t, movedSel: E.sel.has(smK(13, 20)) }; }));
  { const a = await cellOf(p, 13, 20), b = await cellOf(p, 9, 10); await mouseDrag(p, [a, b]); }
  Object.assign(r, await ev(() => ({ moveBlocked: S.smE.cells.get(smK(13, 20)) === smVal(window.__bg, 13, 20, 3, 2) })));
  await ev(() => smUndo(S.smE)); Object.assign(r, await ev(() => ({ mvUndo: S.smE.cells.get(smK(13, 10)) === smVal(window.__bg, 13, 10, 3, 2) && !S.smE.cells.has(smK(13, 20)) })));
  await ev(() => smRedo(S.smE)); Object.assign(r, await ev(() => ({ mvRedo: S.smE.cells.get(smK(13, 20)) === smVal(window.__bg, 13, 20, 3, 2) && !S.smE.cells.has(smK(13, 10)) })));
  await ev(() => smUndo(S.smE));
  // 여러 개 고르기(네모) → 물건 3개 → 지우기 → ↶
  await p.click('[data-smmode="select"]'); { const a = await cellOf(p, 9, 9), b = await cellOf(p, 16, 11); await mouseDrag(p, [a, b]); }
  Object.assign(r, await ev(() => ({ boxSel: [...S.smE.sel].map((k) => `${smX(k)},${smY(k)}`).sort().join(' '), nBefore: S.smE.cells.size })));
  await p.click('#sm_del'); await p.waitForTimeout(150); Object.assign(r, await ev(() => ({ nDel: S.smE.cells.size }))); await p.click('#sm_undo'); await p.waitForTimeout(150); Object.assign(r, await ev(() => ({ nUndo: S.smE.cells.size })));
  // 📝 책 자리 정보 — (10,10) 물건 → 2번 칸 3번째 책 짚기 → 상품·표시 글·메모
  await p.click('[data-smmode="pan"]'); { const t = await cellOf(p, 12, 11); await p.mouse.click(t.x, t.y); await p.waitForTimeout(200); }
  const k0 = await ev(() => smK(10, 10)); await p.click(`#sm_info [data-smb="${k0}|2|3"]`); await p.waitForTimeout(200);
  r.nfOpen = await ev(() => !!document.getElementById('sm_nf')); const uc0 = await ev(() => [...S.plist.values()][0].usedCode);
  await p.fill('[data-smnf="tag"]', '예약'); await p.fill('[data-smnf="uc"]', uc0); await p.fill('[data-smnf="memo"]', '첫 줄\n둘째 줄'); await p.click('[data-smnok]'); await p.waitForTimeout(200);
  Object.assign(r, await ev(() => { const E = S.smE; const n = E.notes.get('10_10_2_3'); const sp = document.querySelector(`#sm_info [data-smb="${smK(10, 10)}|2|3"]`); return { note: n ? [n.tag, n.uc, n.memo].join('|') : null, spineNt: !!(sp && sp.classList.contains('nt')) && /둘째 줄/.test(sp.title), nl: /자리 정보 1/.test((document.querySelector('#sm_info .sm-nl') || {}).textContent || ''), vNotes: S.smV.notes && S.smV.notes.size, dirtyN: /저장 안 함/.test(document.getElementById('sm_dirty').textContent) }; }));
  // 마우스 올리기 → 메모
  r.tip = await ev(async () => { const cv = S.smV.cv; const t = window.__cell(11, 10); cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 41, pointerType: 'mouse', clientX: t.x, clientY: t.y })); await window.__W(100); return document.getElementById('sm_tip').textContent; });
  await ev(() => smUndo(S.smE)); Object.assign(r, await ev(() => ({ ntUndo: !S.smE.notes.has('10_10_2_3') }))); await ev(() => smRedo(S.smE)); Object.assign(r, await ev(() => ({ ntRedo: !!S.smE.notes.get('10_10_2_3') })));
  // 자리 정보가 붙은 물건 옮기기 → 자리 정보도 따라감 · ↶
  await ev(() => { S.smE.sel = new Set([smK(10, 10)]); smMoveObjs(S.smE, [smObjAt(S.smE.cells, smK(10, 10))], 0, 5); }); Object.assign(r, await ev(() => ({ ntMove: !!S.smE.notes.get('10_15_2_3') && !S.smE.notes.has('10_10_2_3') }))); await ev(() => smUndo(S.smE)); Object.assign(r, await ev(() => ({ ntMoveUndo: !!S.smE.notes.get('10_10_2_3') && !S.smE.notes.has('10_15_2_3') })));
  // 저장 → 줄 부호(큰 물건 = 한 덩이) · 자리 정보 문서 · 판 기록 nd
  await p.click('#sm_save'); await p.waitForTimeout(800);
  Object.assign(r, await ev(() => { const P = window.__FS.prd_system; const M = P.shelfmap.maps.mB; const h = (P.shelfmap_h_mB || {}).vers || []; const n = ((P.shelfmap_n_mB || {}).n || {})['10_10_2_3'] || {}; window.__v1 = M.ver; return { sRows: JSON.stringify((P.shelfmap_m_mB || {}).rows), sVer: M.ver, sNote: [n.tag, n.memo, !!n.at].join('|'), sNd: !!(h[h.length - 1] || {}).nd, sDirty: S.smE.dirty }; }));
  // 고치기 → 이력 · 빼기 → gone(지우지 않음) · 판 되돌리기 → 자리 정보도
  await ev(async () => { const W = window.__W; S.smE.sel = new Set([smK(10, 10)]); S.smE.focus = smK(10, 10); S.smE.pick = { k: smK(10, 10), r: 2, p: 3 }; S.smNF = null; smEdPanels(); await W(100); document.querySelector('[data-smnf="memo"]').value = '고친 메모'; document.querySelector('[data-smnok]').click(); await W(150); document.getElementById('sm_save').click(); await W(800); });
  Object.assign(r, await ev(async () => { const W = window.__W; const n = window.__FS.prd_system.shelfmap_n_mB.n['10_10_2_3']; const o = { ed: n.memo, edPrev: (n.prev || []).length, hist: /고친 이력 1/.test(document.getElementById('sm_nf').textContent) }; document.querySelector('[data-smnx]').click(); await W(150); document.getElementById('sm_save').click(); await W(800); const n2 = window.__FS.prd_system.shelfmap_n_mB.n['10_10_2_3']; o.gone = !!n2.gone && (n2.prev || []).length === 2 && n2.prev[1].memo === '고친 메모'; o.goneE = !S.smE.notes.has('10_10_2_3');
    const ok = await smRestore('mB', window.__v1); await W(300); const n3 = window.__FS.prd_system.shelfmap_n_mB.n['10_10_2_3']; o.rest = ok && !n3.gone && n3.memo === '첫 줄\n둘째 줄' && n3.tag === '예약'; o.restRows = JSON.stringify(window.__FS.prd_system.shelfmap_m_mB.rows); return o; }));
  // 🎨 색 — 바꾸기(모든 기기 저장) · 기본으로 · 범례
  Object.assign(r, await ev(async () => { const W = window.__W; history.back(); await W(400); document.querySelector('[data-smopen="mB"]').click(); await W(900); const o = { leg: /자리 정보/.test((document.getElementById('sm_leg') || {}).textContent || '') && /못 놓음/.test(document.getElementById('sm_leg').textContent), reNote: !!S.smE.notes.get('10_10_2_3') };
    document.querySelector('[data-smcolon]').click(); await W(150); const inp = document.querySelector('[data-smcol="note"]'); inp.value = '#00ff00'; inp.dispatchEvent(new Event('change', { bubbles: true })); await W(400); o.col = (((window.__FS.prd_system.shelfmap.cfg || {}).col) || {}).note; o.colC = smC('note'); o.colLog = (window.__FS.prd_system.shelfmap.log || []).some((x) => x.act === 'col');
    document.querySelector('[data-smcolrst="*"]').click(); await W(400); o.colRst = [(((window.__FS.prd_system.shelfmap.cfg || {}).col) || {}).note, smC('note')].join('|'); o.oldRow = /"5":"5\.2\.cO"/.test(JSON.stringify(window.__FS.prd_system.shelfmap_m_mB.rows)); return o; }));
  // 🔎 소재불명 — 큰 물건은 한 곳으로 · 물건 안 칸을 눌러도 그 물건 자리
  Object.assign(r, await ev(async () => { const W = window.__W; const sh = document.getElementById('sheet'); const l = [...S.plist.values()][5]; l.sku = 'BLKCMN'; l.status = '판매중'; l.active = true; l.qty = 1; history.back(); await W(300); history.back(); await W(300);
    const x = await lostAdd({ key: l.usedCode, kind: 'al', title: l.title, skus: [], from: 'bbuy' }); await W(300); window.__lc2 = x.cid; openLostCase(x.cid); await W(1200); lostRenderForce(); await W(700); const V = S.lostMVV; const N = lostNext(x.cid).filter((n) => /🗺/.test(n.where || '')); return { lHl: V && V.ov ? [...V.ov.hl].map((k) => `${smX(k)},${smY(k)}`).sort().join(' ') : null, lNext: N.map((n) => n.where).join(' / '), lLeg: /자리 정보/.test((sh.querySelector('.lo-mleg') || {}).textContent || '') }; }));
  await ev(async () => { document.getElementById('lo_mcv').scrollIntoView({ block: 'center' }); await window.__W(300); }); { const t = await cellOf(p, 12, 11); await p.mouse.click(t.x, t.y); await p.waitForTimeout(600); }
  Object.assign(r, await ev(() => { const sh = document.getElementById('sheet'); const F = S.lostF[window.__lc2]; const sp = sh.querySelector(`.lo-shp [data-smb="${smK(10, 10)}|2|3"]`); return { lTap: [F.x, F.y, S.lostMP.k === smK(10, 10)].join('|'), lPanel: /3×2/.test((sh.querySelector('.lo-shp') || {}).textContent || ''), lNote: !!(sp && sp.classList.contains('nt')) }; }));
  // 상품 상세 '🗺 서가 지도 자리' — 큰 물건은 차지한 칸까지
  Object.assign(r, await ev(async () => { const W = window.__W; const l = [...S.plist.values()][6]; await db.collection('prd_system').doc('shelfmap').set({ cards: { [window.__bg]: { items: [l.usedCode] } } }, { merge: true }); await W(400); await openProduct(l.id); await W(600); return { pdBig: ((document.querySelector('.sm-pl') || {}).textContent || '').replace(/\s+/g, ' ') }; }));
  ran++; console.log(JSON.stringify(r).slice(0, 6000));
  ok(r.old === '1|1|1|1|true' && r.oldPal, `예전 1×1 자료 그대로 읽힘(칸마다 한 물건) ${r.old}`);
  ok(r.bigCard === '3|2|4|BLKCMN' && r.palTxt, `카드 크기 3×2 저장 ${r.bigCard} · 카드 목록에 '3×2칸 차지'`);
  ok(/"w":3,"h":2,"ok":true/.test(r.ghost1 || '') && r.putN === 6 && /~3x2@10,10$/.test(r.put || '') && r.putSel && r.ghostClear, `끌 때 3×2 초록 그림자 → 놓으면 6칸 한 물건 ${r.put}`);
  ok(/"ok":false/.test(r.ghostBad || '') && /"ok":false/.test(r.ghostOut || '') && r.afterBad === 8, `겹치는 자리·지도 밖 = 빨간 그림자 · 놓지 않음 (칸 ${r.afterBad})`);
  ok(r.copyHeads === '10,10 13,10 16,10' && r.copyCells === 20 && r.copyTop === '복사 끌기', `꾹 눌러 복사 = 3칸 간격 ${r.copyHeads} (${r.copyCells}칸)`);
  ok(r.tapHead && r.infoLoc, '큰 물건 안 아무 칸을 눌러도 그 물건 — 정보 (11,11)~(13,12) 3×2');
  ok(r.rotBlocked && r.rot === '16,10,2,3' && r.rotFree, `⟳ 돌리기: 겹치면 그대로 · 3×2 → ${r.rot}`);
  ok(/"ok":true/.test(r.moveGhost || '') && r.moved && r.moveTop === '옮기기' && r.movedSel && r.moveBlocked, '✥ 고른 물건 끌어 옮기기(그림자) · 겹치는 곳으로는 안 옮김');
  ok(r.mvUndo && r.mvRedo, '옮기기 ↶ 되돌리기 · ↷ 다시');
  ok(r.boxSel === '10,10 13,10 16,10' && r.nDel === r.nBefore - 18 && r.nUndo === r.nBefore, `네모 고르기 = 물건 ${r.boxSel} → 지우기 ${r.nBefore}→${r.nDel} → ↶ ${r.nUndo}`);
  ok(r.nfOpen && /^예약\|U\d+\|첫 줄\n둘째 줄$/.test(r.note || '') && r.spineNt && r.nl && r.vNotes === 1 && r.dirtyN, `📝 책 짚기 → 자리 정보(상품·표시 글·메모) ${JSON.stringify(r.note)} · 책등 표시 · 지도 점`);
  ok(/📝 1/.test(r.tip || '') && /둘째 줄|첫 줄/.test(r.tip || ''), `마우스 올리기 → 메모 '${(r.tip || '').slice(0, 60)}'`);
  ok(r.ntUndo && r.ntRedo && r.ntMove && r.ntMoveUndo, '자리 정보 ↶·↷ · 물건 옮기면 따라감 · ↶');
  ok(/"10":"10\.3\.[^"]*~3x2@10,10;13\.3\.[^"]*~3x2@13,10;16\.2\.[^"]*~2x3@16,10"/.test(r.sRows || '') && /"5":"5\.2\.cO"/.test(r.sRows) && r.sNote === '예약|첫 줄\n둘째 줄|true' && r.sNd && !r.sDirty, `저장: 큰 물건 줄 부호 한 덩이 · 예전 1×1 그대로 ${(r.sRows || '').slice(0, 160)} · 자리 정보 문서 · 판 기록 nd`);
  ok(r.ed === '고친 메모' && r.edPrev === 1 && r.hist && r.gone && r.goneE, '자리 정보 고치기 → 이력 1 · 빼기 → gone(이전 값 prev에 남음)');
  ok(r.rest, `📜 판 되돌리기 → 자리 정보도 그 판으로 (${(r.restRows || '').slice(0, 80)})`);
  ok(r.leg && r.reNote, '범례(고른·짚은·📝 자리 정보·놓을 수 있음/없음) · 다시 열어도 자리 정보');
  ok(r.col === '#00ff00' && r.colC === '#00ff00' && r.colLog && /^\|#F9A825$/.test(r.colRst || '') && r.oldRow, `🎨 색 바꾸기(모든 기기 ${r.col}) · ↺ 모두 기본으로 → ${r.colRst}`);
  ok(r.lHl && r.lHl.split(' ').length >= 3 && r.lHl.split(' ').every((x) => ['10,10', '13,10', '16,10'].includes(x)) && /3×2|2×3/.test(r.lNext) && r.lLeg, `🔎 소재불명: 큰 물건은 한 곳씩 강조 ${r.lHl} · 다음에 볼 곳 '${(r.lNext || '').slice(0, 70)}' · 범례에 📝`);
  ok(/\(11,11\)~\(13,12\) 3×2/.test(r.pdBig || ''), `상품 상세 서가 지도 자리 '${(r.pdBig || '').slice(0, 90)}'`);
  ok(r.lTap === '10|10|true' && r.lPanel && r.lNote, `🔎 큰 물건 안 칸을 눌러도 그 물건 자리 ${r.lTap} · 책장 그림 3×2 · 📝 표시`);
})).then(() => H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.evaluate(IN);
  // 📱 휴대폰 — 터치(손가락 포인터)로 카드 끌어 놓기 · 꾹 눌러 복사 · 두 손가락 확대
  const r = await p.evaluate(async () => { const W = window.__W; const sh = document.getElementById('sheet'); window.ask = async () => true; const now = new Date().toISOString();
    await db.collection('prd_system').doc('shelfmap').set({ maps: { mT: { name: '창고', kind: 'store', w: 30, h: 30, ver: 0, n: 0, hpg: 1, hb: 0 } }, cards: { cT: { kind: 'trolley', name: '트롤리', rows: 3, per: 20, codes: ['BLKCMN'], at: now }, cW: { kind: 'shelf', name: '긴 책장', rows: 3, per: 10, sw: 2, sh: 1, codes: [], at: now } }, def: 'mT' }, { merge: true }); await W(300);
    openShelfMap(); await W(400); sh.querySelector('[data-smopen="mT"]').click(); await W(900); const o = {}; const cv = sh.querySelector('#sm_cv'); const pal = sh.querySelector('#sm_pal'); o.layout = cv.getBoundingClientRect().bottom <= pal.getBoundingClientRect().top + 2; o.overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
    const pe = (el, type, x, y, id) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id || 1, pointerType: 'touch', isPrimary: (id || 1) === 1, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    const card = sh.querySelector('[data-smcard="cT"]'); const cb = card.getBoundingClientRect(); const t = window.__cell(5, 5); pe(card, 'pointerdown', cb.left + 20, cb.top + 15); for (let i = 1; i <= 6; i++) { pe(card, 'pointermove', cb.left + 20 + (t.x - cb.left - 20) * i / 6, cb.top + 15 + (t.y - cb.top - 15) * i / 6); await W(20); } pe(card, 'pointerup', t.x, t.y); await W(200); o.drop = S.smE.cells.get(smK(5, 5)) === 'cT';
    const a = window.__cell(5, 5), b = window.__cell(5, 9); pe(cv, 'pointerdown', a.x, a.y, 7); await W(650); for (let i = 1; i <= 8; i++) { pe(cv, 'pointermove', a.x, a.y + (b.y - a.y) * i / 8, 7); await W(20); } pe(cv, 'pointerup', b.x, b.y, 7); await W(200); o.copy = [5, 6, 7, 8, 9].every((y) => S.smE.cells.get(smK(5, y)) === 'cT');
    const s0 = S.smV.view.s; const r0 = cv.getBoundingClientRect(); const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2; pe(cv, 'pointerdown', cx - 30, cy, 11); pe(cv, 'pointerdown', cx + 30, cy, 12); for (let i = 1; i <= 5; i++) { pe(cv, 'pointermove', cx - 30 - i * 12, cy, 11); pe(cv, 'pointermove', cx + 30 + i * 12, cy, 12); await W(20); } pe(cv, 'pointerup', cx - 90, cy, 11); pe(cv, 'pointerup', cx + 90, cy, 12); await W(200); o.pinch = S.smV.view.s > s0 * 1.8 && S.smE.cells.size === 5;
    const bs = [...sh.querySelectorAll('.sm-bar .sm-b')].map((x) => x.getBoundingClientRect().height); o.btnH = Math.min(...bs); const c2 = window.__cell(5, 7); pe(cv, 'pointerdown', c2.x, c2.y, 21); pe(cv, 'pointerup', c2.x, c2.y, 21); await W(250); o.shelf = sh.querySelectorAll('#sm_info .sm-row').length; o.wheels = /●/.test((sh.querySelector('#sm_info .sm-wh') || {}).textContent || '');
    // 📐 (11/04) 손가락: 2×1 카드 끌어 놓기(그림자) · 꾹 눌러 2칸 간격 복사 · 골라 끌어 옮기기 · 책 짚어 📝 자리 정보
    smFit(S.smV); await W(150); const cw = sh.querySelector('[data-smcard="cW"]'); cw.scrollIntoView({ inline: 'center', block: 'nearest' }); await W(100); const wb = cw.getBoundingClientRect(); const t2 = window.__cell(10, 12); pe(cw, 'pointerdown', wb.left + 20, wb.top + 15, 31); for (let i = 1; i <= 6; i++) { pe(cw, 'pointermove', wb.left + 20 + (t2.x - wb.left - 20) * i / 6, wb.top + 15 + (t2.y - wb.top - 15) * i / 6, 31); await W(20); } o.tGhost = JSON.stringify(S.smV.ghost); pe(cw, 'pointerup', t2.x, t2.y, 31); await W(200); o.tDrop = S.smE.cells.get(smK(11, 12)) === smVal('cW', 10, 12, 2, 1);
    const a2 = window.__cell(10, 12), b2 = window.__cell(15, 12); pe(cv, 'pointerdown', a2.x, a2.y, 32); await W(650); for (let i = 1; i <= 8; i++) { pe(cv, 'pointermove', a2.x + (b2.x - a2.x) * i / 8, a2.y, 32); await W(20); } pe(cv, 'pointerup', b2.x, b2.y, 32); await W(200); o.tCopy = [10, 12, 14].every((x) => S.smE.cells.get(smK(x, 12)) === smVal('cW', x, 12, 2, 1));
    const c3 = window.__cell(13, 12); pe(cv, 'pointerdown', c3.x, c3.y, 33); pe(cv, 'pointerup', c3.x, c3.y, 33); await W(200); o.tSel = S.smE.sel.has(smK(12, 12)); const d3 = window.__cell(13, 16); pe(cv, 'pointerdown', c3.x, c3.y, 34); for (let i = 1; i <= 6; i++) { pe(cv, 'pointermove', c3.x, c3.y + (d3.y - c3.y) * i / 6, 34); await W(20); } pe(cv, 'pointerup', d3.x, d3.y, 34); await W(200); o.tMove = S.smE.cells.get(smK(12, 16)) === smVal('cW', 12, 16, 2, 1) && !S.smE.cells.has(smK(12, 12));
    const sp = sh.querySelector(`#sm_info [data-smb="${smK(12, 16)}|1|1"]`); if (sp) sp.click(); await W(200); o.tNf = !!sh.querySelector('#sm_nf'); return o; });
  ran++; console.log(JSON.stringify(r));
  ok(r.layout && !r.overflow && r.btnH >= 40, `📱 휴대폰: 지도 위 · 카드 띠 아래 · 가로 넘침 없음 · 단추 ${Math.round(r.btnH)}px`);
  ok(r.drop && r.copy && r.pinch, `📱 손가락: 카드 끌어 놓기 ${r.drop} · 꾹 눌러 복사 ${r.copy} · 두 손가락 확대 ${r.pinch}`);
  ok(r.shelf === 3 && r.wheels, '📱 트롤리 그림(3칸 · 바퀴)');
  ok(/"w":2,"h":1,"ok":true/.test(r.tGhost || '') && r.tDrop && r.tCopy && r.tSel && r.tMove && r.tNf, `📱 손가락 큰 물건: 2×1 그림자·놓기 ${r.tDrop} · 2칸 간격 복사 ${r.tCopy} · 골라 끌어 옮기기 ${r.tMove} · 책 짚어 📝 ${r.tNf}`);
}, { vp: { width: 390, height: 844 }, touch: true })).then(async () => {
  // 수집기: 샵매니저 상품 조회/수정 목록·상품 수정 화면에 🔎 수색중 띠(머리 그대로 · 본체만)
  const { chromium } = require('playwright'); const src = fs.readFileSync(fs.existsSync(path.join(__dirname, '../readnow-collector.src.js')) ? path.join(__dirname, '../readnow-collector.src.js') : path.join(__dirname, '../readnow-collector.user.js'), 'utf8');
  const a = src.indexOf('(function rnLostScm()'); const b = src.indexOf('})();', a) + 5; const code = src.slice(a, b); const out = {}; const br = await chromium.launch();
  for (const [url, html] of [['https://www.aladin.co.kr/scm/wrecord_edit.aspx?x=1', '<table><tr><td><input class="batchChkBox" value="555"></td><td>U900001 책</td><td>판매중</td></tr><tr><td><input class="batchChkBox" value="777"></td><td>9788900000000</td><td>판매중</td></tr><tr><td><input class="batchChkBox" value="888"></td><td>U900009</td><td>판매중</td></tr></table>'], ['https://www.aladin.co.kr/scm/wrecord.aspx?action=2&bookid=0&UpdateItemId=777', '<form>수정 화면</form>']]) {
    const pg = await br.newPage(); await pg.route(/aladin\.co\.kr/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: `<html><body>${html}</body></html>` }));
    await pg.addInitScript(() => { const st = {}; window.GM_getValue = (k, d) => (k in st ? st[k] : d); window.GM_setValue = (k, v) => { st[k] = v; }; const cases = { a: { st: 'open', kind: 'al', key: 'U900001', title: '책 하나', at: new Date(Date.now() - 3 * 864e5).toISOString(), stop: { how: 'pause' }, nS: 2 }, b: { st: 'open', kind: 'al', key: 'U900002', alid: '777', title: '책 둘', at: new Date().toISOString(), stop: { how: 'stop' } }, c: { st: 'found', kind: 'al', key: 'U900009' } }; window.firebase = { apps: [1], auth: () => ({ currentUser: { email: 'x@y' }, onAuthStateChanged: (f) => { f({}); return () => {}; } }), firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({ cases }) }) }) }) }) }; });
    await pg.goto(url); await pg.evaluate(code); await pg.waitForTimeout(2600); out[/UpdateItemId/.test(url) ? 'ed' : 'list'] = await pg.evaluate(() => ({ rows: [...document.querySelectorAll('tr')].map((tr) => (tr.querySelector('.rn-lostb') || {}).textContent || ''), ed: (document.getElementById('rn-lostb-ed') || {}).textContent || '' })); await pg.close(); }
  await br.close(); ran++; console.log(JSON.stringify(out));
  ok(/수색중/.test(out.list.rows[0]) && /일시판매중지/.test(out.list.rows[0]) && /3일째/.test(out.list.rows[0]) && /수색중/.test(out.list.rows[1]) && !out.list.rows[2], '수집기: 샵매니저 상품 조회/수정 목록 — U코드·상품번호로 🔎 수색중 띠(발견한 사건은 없음)');
  ok(/수색중/.test(out.ed.ed) && /책 둘/.test(out.ed.ed), '수집기: 상품 수정 화면 맨 위 🔎 수색중 띠');
  const head = src.slice(0, src.indexOf('==/UserScript==')); ok(!/rnLost/.test(head), '수집기 머리(@match·@grant·@connect·@require)에 손대지 않음');
}).then(() => { if (ran < 5) { bad++; console.log('  ❌ 시험 도중 멈춤(위 ERRORS의 TEST 줄)'); } console.log(bad ? `❌ tMAP 실패 ${bad}` : '✅ tMAP 모두 통과'); });
