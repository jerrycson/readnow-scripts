// tFRONT1112 — ⬆ 앞 페이지 올리기(끌올) · 숍 앞 페이지 연구를 🔬 연구 모음에(front1 · 정범님 11/12 밤 · 꾸민 자료·가짜 Firestore·가짜 수집기만 — 실제 알라딘은 건드리지 않음)
// 실행: cd pw && RN_PORT=<포트> node tFRONT1112.js (harness.js·fbstub.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.waitForTimeout(300);
  /* ① 순수 셈 — 전략·순서 판단·조건식 */
  const a = await p.evaluate(() => { const comp = { shops: 11, rows: 340, tests: 360, sig: 35, sigRep: 29, best: [{ f: 'ageMed', t: '앞 쪽 상품 나이(일)', y: 'r3', yt: '다음 3일 매출/일', st: '지지', score: 0.75, n: 4, r: -0.36, q: 0.014, eff: -0.18 }, { f: 'spMed', t: 'SP 가운데(로그)', y: 'r3', yt: '다음 3일 매출/일', st: '후보', score: 0.5, n: 2, r: 0.21, q: 0.08, eff: 0.09 }, { f: 'k_lit*k_art', t: '조합', st: '지지', score: 0.9, n: 5, r: 0.3, q: 0.01 }, { f: 'covB', t: '표지 밝기', st: '지지', score: 0.8, n: 4, r: 0.2, q: 0.02 }, { f: 'gLow', t: '상태 중·하 몫', st: '기각', score: 0.1, n: 5, r: -0.3, q: 0.5 }],
      top: [{ f: 'genDiv', ft: '장르 고르기', y: 'g3', yt: '다음 3일 사라짐/일', r: 0.25, q: 0.06, eff: 0.11 }, { f: 'k_lit', ft: '문학 몫', y: 'r3', r: 0.19, q: 0.09, eff: 0.07 }, { f: 'sLux', r: 0.3, q: 0.4 }] };
    const ST = fbStrats(comp, { by: { ageMed: { n: 4, rb: 0.5, rc: 0.25 } } }); const ids = ST.map((s) => s.id);
    const g1 = fbGate({ realActive: true }); const x = (p, sp) => ({ t: '책', p, lp: 0, sp, g: '상', age: 200, cat: '', set: false, pub: '' });
    const g2 = fbGate({ bump: [x(20000, 5000), x(19000, 4000)], real: [x(3000, 10), x(2500, 5)], strats: ST, waitedH: 0, waitH: 6 }); const g3 = fbGate({ bump: [x(20000, 5000)], real: [x(3000, 10)], strats: ST, waitedH: 7, waitH: 6 }); const g4 = fbGate({ bump: [x(3000, 10)], real: [x(20000, 5000)], strats: ST });
    const X = x(8000, 120); const c1 = fbCondOk(X, [{ a: 'price', p: { lo: 5000, hi: 10000 } }, { a: 'spGE', p: { n: 100 } }], 'all'); const c2 = fbCondOk(X, [{ a: 'price', p: { lo: 5000, hi: 10000 }, not: true }, { a: 'grade', p: { g: '상' } }], 'any'); const c3 = fbCondOk(X, [{ a: 'price', p: { lo: 5000, hi: 10000 }, not: true }], 'all');
    const E = fbEval([{ state: 'done', newKey: 'a', doneAt: '2026-01-01T00:00:00Z', strat: 'ageMed', ctrl: ['b', 'c'], pred: 0.6 }, { state: 'done', newKey: 'd', doneAt: '2026-01-01T00:00:00Z', strat: 'ageMed', ctrl: ['e'], pred: 0.2 }], (k) => ({ a: 1, b: 0, c: 1, d: 0, e: 0 })[k]);
    return { ids, first: ST[0].id, exp: ST[0].exp, combo: ids.some((i) => i.includes('*')), cov: ids.includes('covB'), rej: ids.includes('gLow'), lux: ids.includes('sLux'), div: (ST.find((s) => s.id === 'genDiv') || {}).div, sp: ST.find((s) => s.id === 'spMed'), g1, g2, g3, g4, c1, c2, c3, E }; });
  ok(a.first === 'ageMed' && a.exp && a.exp.rb === 0.5, '전략 맨 앞 = 신선도(오래 머문 상품) · 우리 숍 실험 결과가 전략 카드에 붙음', a);
  ok(!a.combo && !a.cov && !a.rej && !a.lux && a.div === true && a.ids.includes('k_lit') && a.sp && a.sp.up === true, '조합·표지 수치(상품 값 없음)·기각·유의 아님은 빼고, 고르게(다양성)·문학 몫·SP는 상품 단위 전략으로', a.ids);
  ok(!a.g1.go && /진행 중|올라가는 중/.test(a.g1.why) && !a.g2.go && /뒤/.test(a.g2.why) && a.g3.go && a.g4.go && /먼저/.test(a.g4.why), '실제 등록과 순서: 진행 중이면 기다림 · 올릴 상품 점수가 높으면 실제 등록 뒤로(최대 시간) · 낮으면 먼저', [a.g1, a.g2, a.g3, a.g4]);
  ok(a.c1 && a.c2 && !a.c3, '조건식 묶기 — 모두/하나라도/아님', [a.c1, a.c2, a.c3]);
  ok(a.E.n === 2 && a.E.rb === 0.5 && Math.abs(a.E.rc - 1 / 3) < 1e-9 && a.E.champ != null && a.E.chall != null && a.E.by.ageMed.n === 2, '채점(N12) — 올린 상품 판매율 vs 견줄 무리 · 챔피언(견줄 무리)·도전자(전략 예측) 브라이어', a.E);

  /* ② 끝까지 흐름 — 가짜 수집기가 지움·다시 등록 결과를 적음 */
  const b = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.user = S.user || { email: 'test@x' }; S.leader = true; S.fbTestRun = true; S.devOk = true; S.plist.clear();
    const mk = (i, o) => ({ id: 'aladin_U9' + i, usedCode: 'U9' + i, listingId: String(50000 + i), title: '옛 책 ' + i, isbn13: '978890000000' + i, price: 7000 + i * 100, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_' + i, registeredAt: '2026-06-0' + (i + 1) + 'T10:00:00', firstSeenAt: '2026-06-0' + (i + 1) + 'T10:05:00', bookId: 'bk' + i, publisher: '출판사', ...(o || {}) });
    [mk(1), mk(2), mk(3), mk(4, { photos: [{ stored: 1 }] }), mk(5, { registeredAt: new Date(Date.now() - 10 * 864e5).toISOString() })].forEach((l) => S.plist.set(l.id, l)); S.prodLoaded = true;
    S.sku.map.set('aladin_U91', { c: ['a0001'] }); window.__FS.prd_used_info = { 50001: { note: '모서리 살짝 눌림' }, 50002: { note: '' }, 50003: { note: 'x'.repeat(300) } }; window.__FS.pur_matches = { aladin_U91: { sup: 'SUP1', cost: 1200, buyDay: '2026-05-30' } };
    fbWatch(); await W(50); const P = fbPool(fbCfg()); const ids = P.L.map((r) => r.l.id).sort();
    const R = P.L.filter((r) => ['aladin_U91', 'aladin_U92', 'aladin_U93'].includes(r.l.id)).map((r) => ({ ...r, score: 0.3, pred: 0.12 })); const q = await fbQueue(R, { strat: 'ageMed', stratName: '🕰 신선도', pool: P.L }); await W(400);
    const J0 = Object.entries(window.__FS.prd_bump || {}).map(([id, v]) => ({ id, ...v })); const snap = window.__FS.prd_bump_snap || {};
    S.regCmds = new Map(); await fbTick(); await W(200); const J1 = Object.values(window.__FS.prd_bump || {}); const delCmd = Object.entries(window.__FS.shp_cmds || {}).find(([, v]) => v.type === 'regDel');
    /* 가짜 수집기: 하나는 지움 · 하나는 거절(판매가가 그사이 바뀜) */ const [cid, cv] = delCmd; window.__FS.shp_cmds[cid] = { ...cv, status: 'failed', results: { aladin_U91: { state: 'deleted', listingId: '50001' }, aladin_U92: { state: 'refused', msg: '지우지 않음 — 판매가가 다름' } } };
    await W(80); await fbTick(); await W(200); const J2 = Object.values(window.__FS.prd_bump || {}); const reg = Object.entries(window.__FS.shp_cmds || {}).find(([, v]) => v.type === 'regBulk'); const ri = Object.entries(window.__FS.reg_items || {}).find(([, v]) => v.bump);
    try { regWatch(); } catch (e) {} await W(150); const inReg = S.regItems && [...S.regItems.values()].some((x) => x.bump);
    /* 가짜 수집기: 알라딘에 보임 */ const [rid, rv] = reg; window.__FS.shp_cmds[rid] = { ...rv, status: 'done', results: { [ri[0]]: { state: 'live', usedCode: 'U777', listingId: '77777' } } };
    S.plist.set('aladin_U777', { id: 'aladin_U777', usedCode: 'U777', listingId: '77777', title: '옛 책 1', isbn13: '9788900000001', price: 7100, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_1', registeredAt: new Date().toISOString(), firstSeenAt: new Date().toISOString() });
    await W(80); await fbTick(); await W(300); const J3 = Object.values(window.__FS.prd_bump || {}); const rl = (window.__FS.prd_relinks || {}).U777; const pm = (window.__FS.pur_matches || {}).aladin_U777;
    S._fbOv = null; overlayAll(); const nl = S.plist.get('aladin_U777'); const ol = S.plist.get('aladin_U91');
    return { q, ids, J0: J0.map((j) => [j.key, j.state, j.n, j.desc, (j.cores || []).join(), j.origRegAt]), snapN: Object.keys(snap).length, J1: J1.map((j) => j.state), del: { n: cv.n, bump: cv.bump, mode: cv.mode, items: cv.items.map((x) => [x.listingKey, x.price, x.code]) },
      J2: J2.map((j) => [j.key, j.state, j.open]), reg: reg && { bump: reg[1].bump, type: reg[1].type, rows: reg[1].rows.map((r) => [r.isbn, r.price, r.code, r.grade, r.qty, r.desc]) }, ri: ri && { stage: ri[1].stage, bump: !!ri[1].bump, rn: ri[1].rnSkus, label: ri[1].needLabel, counts: regCounts({ ...ri[1], id: ri[0] }) }, inReg,
      J3: J3.map((j) => [j.key, j.state, j.newKey]), rl, pm, nl: { reg: nl.registeredAt, al: nl._alRegAt, first: nl.firstSeenAt, bump: nl.bump }, ol: ol.bumpedTo, kind: RL_KIND.bump, prod: fbProdHtml(nl) }; });
  ok(b.q.n === 2 && b.q.skip.length === 1 && /255자/.test(b.q.skip[0]), '확정 → 설명 255자 넘는 상품은 지우기 전에 빠짐(같은 정보로 못 올림)', b.q);
  ok(!b.ids.includes('aladin_U94') && !b.ids.includes('aladin_U95') && b.ids.includes('aladin_U91'), '올릴 수 있는 상품: 우리 사진 붙은 것·등록 90일 안 것은 뺌', b.ids);
  ok(b.snapN === 2 && b.J0.some((j) => j[0] === 'aladin_U91' && ['queued', 'del_wait'].includes(j[1]) && j[2] === 1 && j[3] === '모서리 살짝 눌림' && j[4] === 'a0001' && /^2026-06-02/.test(j[5])), '삭제 전 원본 전체 저장(prd_bump_snap) · 일 장부에 설명·SKU·처음 등록일', b.J0);
  ok(b.J1.every((s) => s === 'del_wait') && b.del.bump && b.del.mode === 'listing' && b.del.items.some((x) => x[0] === 'aladin_U91' && x[1] === 7100 && x[2] === 'PNK_1'), '삭제는 기존 길(regDel · 상품 모드 · 수집기가 U코드·관리 코드·판매가 대조)', b.del);
  ok(b.J2.some((j) => j[0] === 'aladin_U92' && j[1] === 'del_fail' && j[2] === false) && b.J2.some((j) => j[0] === 'aladin_U91' && j[1] === 'reg_wait'), '지우지 못한 것(거절)은 다시 올리지 않음 — 원본 그대로 · 지워진 것만 다시 등록', b.J2);
  ok(b.reg && b.reg.bump && b.reg.type === 'regBulk' && b.reg.rows.length === 1 && JSON.stringify(b.reg.rows[0]) === JSON.stringify(['9788900000001', 7100, 'PNK_1', 2, 1, '모서리 살짝 눌림']), '다시 등록 = 같은 ISBN·판매가·관리 코드·상태·수량·설명', b.reg);
  ok(b.ri && b.ri.stage === 'done' && b.ri.bump && JSON.stringify(b.ri.rn) === '["a0001"]' && b.ri.label === false && b.ri.counts === false && b.inReg === false, '다시 등록 줄: 원래 SKU 그대로 · 라벨 안 뽑음 · 등록 수·등록 화면에 안 들어감', b.ri);
  ok(b.J3.some((j) => j[0] === 'aladin_U91' && j[1] === 'done' && j[2] === 'aladin_U777') && b.rl && b.rl.kind === 'bump' && b.rl.from === 'U91' && b.pm && b.pm.cost === 1200 && b.pm.bumpFrom === 'aladin_U91', '알라딘에 보임 → 같은 실물로 이어 붙임(prd_relinks bump) · 매입 연결(매입일·매입가) 복사', [b.J3, b.rl, b.pm]);
  ok(/^2026-06-02/.test(b.nl.reg) && b.nl.al && b.nl.al > '2026-11' && /^2026-06-02/.test(b.nl.first) && b.nl.bump && b.nl.bump.n === 1 && b.ol && b.ol.to === 'aladin_U777', '웹앱엔 새 등록 아님: 등록일 = 처음 등록일(알라딘 새 등록일은 따로) · 옛 상품엔 옮긴 곳', [b.nl, b.ol]);
  ok(b.kind === '⬆ 앞 페이지 올림' && /1회차/.test(b.prod) && /처음 등록 2026-06-02/.test(b.prod), '상품 상세에 ⬆ 앞 페이지 올림 회차·날짜·이전 상품', b.prod);

  /* ③ 다시 등록 실패 → 바로 한 번 더 → 또 실패면 사람 확인 · 진행 중엔 장부가 판매중으로 봄 */
  const c = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const id = 'jobX'; await db.collection('prd_bump').doc(id).set({ key: 'aladin_U93', usedCode: 'U93', listingId: '50003', title: '옛 책 3', isbn: '9788900000003', sku: 'PNK_3', price: 7300, grade: '상', qty: 1, desc: '', cores: [], n: 1, state: 'reg_wait', open: true, tries: 1, regItem: 'riX', regCmd: 'cmdX', regAt: new Date().toISOString(), day: '2026-11-12', at: new Date().toISOString() });
    window.__FS.shp_cmds.cmdX = { type: 'regBulk', bump: true, status: 'fail', notReg: true, results: {} }; await W(80); const hold = fbHoldLive(S.plist.get('aladin_U93')); await fbTick(); await W(200); const j1 = { ...window.__FS.prd_bump[id] };
    window.__FS.shp_cmds[j1.regCmd] = { ...window.__FS.shp_cmds[j1.regCmd], status: 'fail', notReg: true, results: {} }; await W(80); await fbTick(); await W(200); const j2 = window.__FS.prd_bump[id]; return { hold, t1: j1.tries, s1: j1.state, c1: j1.regCmd !== 'cmdX', s2: j2.state, o2: j2.open }; });
  ok(c.hold === true, '올리는 중엔 통합 장부·재고 맞추기가 옛 상품을 판매중으로 봄(예스24·네이버 잘못 내림 없음)', c);
  ok(c.s1 === 'reg_wait' && c.t1 === 2 && c.c1 && c.s2 === 'reg_fail' && c.o2 === false, '다시 등록 실패 → 바로 한 번 더 → 또 실패면 🧯 사람 확인 목록', c);

  /* ④ 하루 상한 · 자동은 기본 꺼짐 · 화면 */
  const d = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const C0 = fbCfg(); S.pmetrics = new Map([['bk2', { salesPoint: 800 }]]); S.fbCfg = { dayCap: 1 }; const P = fbPool(fbCfg()); const q = await fbQueue(P.L.slice(0, 1), {}); S.fbCfg = {};
    S.slL = { open: true, at: Date.now(), doc: { day: '2026-11-12', comp: { shops: 11, rows: 340, tests: 360, sig: 35, sigRep: 29, best: [{ f: 'ageMed', t: '앞 쪽 상품 나이(일)', y: 'r3', yt: '다음 3일 매출/일', st: '지지', score: 0.75, n: 4, r: -0.36, q: 0.014, eff: -0.18 }, { f: 'spMed', t: 'SP 가운데(로그)', y: 'r3', yt: '다음 3일 매출/일', st: '지지', score: 0.7, n: 4, r: 0.2, q: 0.03, eff: 0.1 }] } } };
    openFrontBump(); await W(300); const sh = document.querySelector('#sheet'); const T = sh.textContent; const nSt = sh.querySelectorAll('[data-fbst]').length; sh.querySelector('[data-fbst="spMed"]').click(); await W(200); const on = !!document.querySelector('#sheet .fb-s.on[data-fbst="spMed"]');
    document.querySelector('#fb_top').click(); await W(150); const go = document.querySelector('#fb_go'); const dis = go.disabled; const n0 = Object.keys(window.__FS.prd_bump).length; go.click(); await W(100); const armed = /한 번 더/.test(document.querySelector('#fb_go').textContent); const n1 = Object.keys(window.__FS.prd_bump).length;
    const sec = fbSetHtml(); return { C0auto: C0.auto, qN: q.n, qWhy: q.why || '', T: T.slice(0, 80), parts: /\(가\)/.test(T) && /\(나\)/.test(T) && /\(다\)/.test(T) && /신뢰도/.test(T) && /기대 효과/.test(T) && /근거/.test(T), nSt, on, dis, armed, same: n0 === n1, secAuto: /id="fbc_auto"(?![^>]*checked)/.test(sec) && /처음엔 꺼 둠/.test(sec), err: [] }; });
  ok(d.C0auto === false && d.secAuto, '자동 모드는 처음 배포 때 꺼짐(⚙ 설정에서 켬)', d);
  ok(d.qN === 0 && /하루 상한/.test(d.qWhy), '하루 상한을 넘으면 맡기지 않음', d);
  ok(d.parts && d.nSt >= 2 && d.on && !d.dis && d.armed && d.same, '화면: (가) 전략(근거·기대 효과·신뢰도) · (나) 찾기·조건식 · (다) 후보 → 두 번 눌러야 맡김(한 번은 무장만)', d);

  /* ⑤ 🔬 연구 모음 — 숍 앞 페이지 연구(N09)·끌올 실험(N12)이 목록에 · 목록에 없는 연구도 진화 기록에 있으면 보임 */
  const e = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); history.back(); await W(300); window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.research_pulse = { studies: { N13: { at: new Date().toISOString(), metric: '새 연구', value: 1, trend: [] } }, at: new Date().toISOString() };
    openResearch(); await W(1500); const T = document.querySelector('#sheet').textContent; const btn = !!document.querySelector('#sheet [data-rhopen="frontBump"]') && !!document.querySelector('#sheet [data-rhopen="sellerLearn"]'); return { n09: /N09/.test(T) && /숍 앞 페이지/.test(T), n12: /N12/.test(T), n13: /N13/.test(T), btn, nav: NAV_HUB.research[0][1].includes('frontBump') && NAV_HUB.research[0][1].includes('sellerLearn') }; });
  ok(e.n09 && e.n12 && e.btn, '🔬 연구 모음에 N09 숍 앞 페이지 연구·N12 끌올 실험 · [열기] 단추', e);
  ok(e.n13, '공개 목록에 아직 없는 연구도 진화 기록에 있으면 빠지지 않고 보임(원인 고침)', e);
  ok(e.nav, '🔬 연구 탭 묶음 카드에 🗂 숍 앞 페이지 연구 · ⬆ 앞 페이지 올리기', e);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); });
