// tRECINH1_1119 — (recinh1 · 헌장 제42조 · 정범님 I-1118-2311-31.4 · I-1118-2344-32) 🔖 판 옮김 물려받기
//  ① 고리 따라 읽기: recChainKeys(⬆ 앞 페이지 올림 고리 + 🔖 판 옮김 고리) · recWhereKey('in'/'==') · 끊은 고리는 안 따라감
//  ② 조회수 합치기: pxVwOf(옛 상품 번호 날별 기록을 더함 · 브라우저 열쇠 합집합 · 마지막 시각) · pxOldOf(옛 합)
//  ③ 물려받기 계획: 새 열쇠에 없을 때만 베낌 · 승인은 안 베낌 · 그룹 칸·시작값(U코드) · 고름·결정은 기록만
//  ④ 물려받기 → 되돌리기(지어낸 Firestore): 베낀 것만 거두고 옛 원본·새 상품이 원래 가진 칸은 그대로 · 고리 「끊음」
//  ⑤ 웹앱에 걸린 곳(같은 실물 카드·가격 내력·변경 기록·메모·판단 메모·조회수) · 브라우저 창 없음 · 이름 한 번만
// 실행: node tRECINH1_1119.js · 상품·책은 모두 지어낸 것 · 손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const a = T.indexOf('/* ══════════ (recinh1 · 헌장 제42조'), b = T.indexOf('/* (recinh1) 끝 */'); const BLK = a > 0 && b > a ? T.slice(a, b) : '';
ok(BLK.length > 5000, '판 옮김 덩이를 찾음', BLK.length);
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BLK), '브라우저 창(alert·confirm·prompt) 없음');
{ const names = ['recEdWatch', 'recEdIdx', 'recChainKeys', 'recWhereKey', 'recPrevLids', 'recVwMerge', 'pxVwOf', 'pxOldOf', 'recInheritRead', 'recInheritPlan', 'recInheritRun', 'recInheritUndo', 'edMvWatch', 'edMvGates', 'edMvNext', 'edMvFindNew', 'edMvStart', 'edMvLink', 'edMvInherit', 'edMvDel', 'edMvStop', 'edMvUndo', 'edMoveCardHtml', 'openEdMoveList', 'edMvSetHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:async )?function ${n}\\s*\\(`, 'g')) || []).length !== 1); ok(!dup.length, '새 함수 이름 한 번만 선언', dup);
  const cn = ['recEd', 'recHasPrev', 'REC_DEC', 'REC_GF', 'EDMV_ON', 'EDMV_ST', 'edMv', 'edMvCfg', 'edMvLive', 'edMvItemOf']; const d2 = cn.filter((n) => (T.match(new RegExp(`const ${n} = `, 'g')) || []).length !== 1); ok(!d2.length, '새 상수 이름 한 번만', d2); }

/* 지어낸 Firestore(메모리) */
const DEL = { __del: 1 }; const store = new Map(); const key = (c, d) => c + '/' + d; let autoId = 0; const ops = [];
const deep = (o) => JSON.parse(JSON.stringify(o));
const mergeIn = (dst, src) => { for (const [k, v] of Object.entries(src)) { if (v === DEL) delete dst[k]; else if (v && typeof v === 'object' && !Array.isArray(v) && !v.__ts && !v.__au) { if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {}; mergeIn(dst[k], v); } else if (v && v.__ts) dst[k] = 'TS'; else if (v && v.__au) dst[k] = [...(dst[k] || []), ...v.__au]; else dst[k] = deep(v); } return dst; };
const docRef = (c, d) => ({ id: d, get: async () => { const v = store.get(key(c, d)); return { id: d, exists: !!v, data: () => (v ? deep(v) : undefined) }; },
  set: async (v, o) => { ops.push(['set', c, d]); const cur = o && o.merge ? store.get(key(c, d)) || {} : {}; store.set(key(c, d), mergeIn(cur, v)); }, delete: async () => { ops.push(['del', c, d]); store.delete(key(c, d)); } });
const coll = (c) => ({ doc: (d) => docRef(c, d === undefined ? 'auto' + ++autoId : d), where: (f, op, v) => ({ get: async () => { const docs = [...store.entries()].filter(([k, x]) => k.startsWith(c + '/') && (op === 'in' ? v.includes(x[f]) : x[f] === v)); return { size: docs.length, docs }; }, limit() { return this; } }), get: async () => ({ docs: [] }) });
const db = { collection: coll };
const firebase = { firestore: { FieldValue: { delete: () => DEL, serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...x) => ({ __au: x }) } } };
const batches = new Map(); const batchSaveItems = async (gid, P) => { const g = batches.get(gid) || {}; mergeIn(g, P); batches.set(gid, g); };
const toasts = [];
const S = { user: { email: 'test@example.invalid' }, px: { vw: new Map(), old: new Map(), vg: 1, v: 1 }, plist: new Map(), app: {}, relink: null };
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite, parseInt, setTimeout: () => 0, clearTimeout: () => 0,
  S, db, firebase, batchSaveItems, document: { addEventListener: () => {} }, localStorage: { getItem: () => null, setItem: () => {} },
  esc: (s) => String(s), won: (n) => n + '원', num: (n) => String(n), errKo: (e) => String(e && e.message || e), toast: (m) => toasts.push(m), TS: () => ({ __ts: 1 }),
  pxZ: () => ({ n: 0, human: 0, bot: 0, uniq: 0, al: 0, oth: 0, mob: 0, ours: 0, ck: 0, noCk: 0, nt: 0 }), sxH: (k) => 'h' + k, saleIdx: () => new Map([['OLD1', [{ ms: 1 }, { ms: 2 }]]]), saleIdxX: () => new Map([['OLD1', [{ ms: 1 }, { ms: 2 }]]]), /* (11/20 isbnall1) */
  batchAssemble: () => [], loadRelinks: async () => {}, fbIdx: () => ctx.__B, kMs: (v) => Date.parse(v) || 0, prodOffKind: (l) => l.__off || null, plkOnL: (l) => !!l.__lock, edPickOf: (l) => l.__pick || null, cashIdx: () => new Map(), fbSoldSince: () => null, isAdminDevice: () => true };
ctx.__B = { to: new Map(), from: new Map() };
vm.createContext(ctx); vm.runInContext(BLK, ctx);
const run = (s) => vm.runInContext(s, ctx); const R = run('recEd()');

console.log('① 고리 따라 읽기');
R.to.set('U200', { kind: 'ed', toKey: 'NEW1', fromKey: 'OLD1', toLid: '200', fromLid: '100' }); R.to.set('U300', { kind: 'ed', toKey: 'NEW2', fromKey: 'X1', toLid: '300', fromLid: '301', rejected: true }); R._ix = null;
ctx.__B.to.set('OLD1', { from: 'OLDER0' });
ok(JSON.stringify(run("recChainKeys('NEW1')")) === '["NEW1","OLD1","OLDER0"]', '판 옮김 고리 + 앞 페이지 올림 고리를 함께 따라감', run("recChainKeys('NEW1')"));
ok(JSON.stringify(run("recChainKeys('NEW2')")) === '["NEW2"]', '끊은(되돌린) 고리는 안 따라감');
ok(JSON.stringify(run("recChainKeys('ZZ')")) === '["ZZ"]', '고리 없는 상품은 자기만');
{ R.to.set('UL1', { kind: 'ed', toKey: 'L1', fromKey: 'L2' }); R.to.set('UL2', { kind: 'ed', toKey: 'L2', fromKey: 'L1' }); R._ix = null; const k = run("recChainKeys('L1')"); ok(k.length === 2, '돌고 도는 고리도 멈춤', k); R.to.delete('UL1'); R.to.delete('UL2'); R._ix = null; }
{ let w = null; const c = { where: (f, op, v) => (w = [f, op, v]) }; ctx.__c = c; run("recWhereKey(__c, 'key', 'NEW1')"); ok(w && w[1] === 'in' && w[2].length === 3, "고리 있으면 'in'으로 옛 열쇠까지", w); run("recWhereKey(__c, 'key', 'ZZ')"); ok(w && w[1] === '==' && w[2] === 'ZZ', "없으면 '=='", w); }

console.log('② 조회수 합치기');
S.px.vw.set('200', new Map([['2026-11-19', { n: 3, human: 2, bs: ['b1'], lastAt: '2026-11-19T10:00' }]]));
S.px.vw.set('100', new Map([['2026-11-19', { n: 5, human: 1, bs: ['b1', 'b2'], lastAt: '2026-11-19T12:00', lk: 'human' }], ['2026-11-10', { n: 7, human: 4, bs: null }]]));
{ const m = run("pxVwOf('200')"); const d = m && m.get('2026-11-19'); ok(m && m.size === 2 && d.n === 8 && d.human === 3 && d.bs.length === 2 && d.lastAt === '2026-11-19T12:00' && d.lk === 'human', '새 상품 번호에 옛 날별 기록을 더함(셈 · 열쇠 합집합 · 늦은 시각)', m && [...m]); }
ok(S.px.vw.get('200').get('2026-11-19').n === 3, '원래 기록(S.px.vw)은 바꾸지 않음');
ok(run("pxVwOf('100')") === S.px.vw.get('100'), '옛 상품 번호는 자기 기록 그대로');
ok(run("pxVwOf('999')") === undefined, '기록 없는 상품은 없음');
S.px.old.set('200', { n: 2, first: '2026-10-05', last: '2026-11-01' }); S.px.old.set('100', { n: 9, first: '2026-09-01', last: '2026-10-20', tag: 'x' });
{ const o = run("pxOldOf('200')"); ok(o && o.n === 11 && o.first === '2026-09-01' && o.last === '2026-11-01', '옛 합도 더함(처음 = 가장 이른 날 · 마지막 = 가장 늦은 날)', o); }
ok(run("recHasPrev('200')") === true && run("recHasPrev('100')") === false, 'recHasPrev — 새 상품만 앞이 있음');

console.log('③ 물려받기 계획 (순수)');
const Rd = { oK: 'OLD1', nK: 'NEW1', oUc: 'U100', nUc: 'U200', sdN: 'cNEW1', at: '2026-11-19T00:00:00Z',
  dO: { watch: true, strat: 'chase', chaser: '9000001', floor: 9000, ctrlOf: 'lead', approval: { ok: 1 } }, dN: { floor: 9500 }, pmO: { cost: 3000 }, pmN: null, tO: { id: 'OLD1', ans: 'same' }, tN: null, sO: { s: 1 }, sN: null,
  grp: [{ id: 'g1', name: '그룹1', hit: { added: 1, held: 1, start: 12000 }, nw: { held: 1 }, rec: ['picks'] }, { id: 'g2', name: '그룹2', hit: {}, nw: {}, rec: ['decided'] }], n: { act: 4 } };
{ const P = run('recInheritPlan')(Rd); const dec = P.W.find((w) => w.c === 'prd_price_decisions');
  ok(dec && JSON.stringify(dec.fields.sort()) === '["chaser","ctrlOf","strat","watch"]' && !('floor' in dec.set) && !('approval' in dec.set) && dec.set.inh.from === 'OLD1', '가격 결정 — 새 쪽에 없는 칸만(바닥값은 새 쪽 것 · 승인 안 베낌)', dec);
  ok(P.W.some((w) => w.c === 'pur_matches' && w.set.edFrom === 'OLD1' && w.set.cost === 3000), '구매 짝 — 새 쪽에 없으면 베끼고 표시(edFrom)');
  ok(P.W.some((w) => w.c === 'prd_edkw_truth' && w.set.id === 'NEW1' && w.set.inhFrom === 'OLD1'), '판본 정답 표본 — 새 열쇠로');
  ok(P.W.some((w) => w.c === 'strat_items' && w.set.m.NEW1.inhFrom === 'OLD1'), '⚡ 전략 칸 — m[새 열쇠]');
  const g = P.W.find((w) => w.grp); ok(g && g.grp.length === 1 && g.grp[0].p.added.NEW1 === 1 && !g.grp[0].p.held && g.grp[0].p.start.U200 === 12000, '그룹 — 더함·시작값(새 U코드)만 · 새 쪽에 있는 쉼은 그대로', g);
  ok(P.recOnly.length === 2 && P.recOnly[0].f[0] === 'picks', '그룹의 고름·결정은 기록만', P.recOnly);
  const P2 = run('recInheritPlan')({ ...Rd, dN: { ...Rd.dO }, pmN: { cost: 1 }, tN: { x: 1 }, sN: { s: 2 }, grp: [] }); ok(!P2.W.length, '새 상품에 이미 다 있으면 아무것도 안 씀', P2.W);
  ok(run('recInheritPlan')({ bad: '못 읽음' }).bad === '못 읽음', '못 읽은 것이 있으면 쓰지 않음'); }

console.log('④ 물려받기 → 되돌리기 (지어낸 Firestore)');
(async () => {
  const put = (c, d, v) => store.set(key(c, d), deep(v));
  put('prd_price_decisions', 'OLD1', Rd.dO); put('prd_price_decisions', 'NEW1', { floor: 9500, approval: { ok: 2 } }); put('pur_matches', 'OLD1', { cost: 3000 }); put('prd_edkw_truth', 'OLD1', { id: 'OLD1', ans: 'same' }); put('strat_items', 'chOLD1', { m: { OLD1: { s: 1 } } }); put('strat_items', 'chNEW1', { m: { OTHER: { s: 5 } } });
  put('prd_price_actions', 'a1', { key: 'OLD1' }); put('prd_price_actions', 'a2', { key: 'OLD1' });
  S.prBatches = [{ id: 'g1', name: '그룹1', added: { OLD1: 1 }, held: { NEW1: 1, OLD1: 1 }, start: { U100: 12000 }, picks: { OLD1: 1 } }]; batches.set('g1', { held: { NEW1: 1 } });
  S.plist.set('OLD1', { id: 'OLD1', usedCode: 'U100', listingId: '100' }); S.plist.set('NEW1', { id: 'NEW1', usedCode: 'U200', listingId: '200' });
  const before = deep([...store.entries()].filter(([k]) => /OLD1/.test(k)));
  const L = await run('recInheritRun')(S.plist.get('OLD1'), S.plist.get('NEW1'), 'OLD1');
  ok(L.ok === true && L.from === 'OLD1' && L.to === 'NEW1' && L.read.act === 2, '물려받기 — 다시 읽어 맞음 · 장부 prd_inherit', L);
  const dN = store.get('prd_price_decisions/NEW1'); ok(dN.watch === true && dN.floor === 9500 && dN.approval.ok === 2 && dN.inh.from === 'OLD1', '새 상품 결정: 감시 베낌 · 바닥값·승인은 새 것 그대로', dN);
  ok(store.get('strat_items/chNEW1').m.NEW1 && store.get('strat_items/chNEW1').m.OTHER, '⚡ 전략 칸: 새 열쇠 더함 · 다른 상품 칸 그대로');
  ok(batches.get('g1').added.NEW1 === 1 && batches.get('g1').start.U200 === 12000, '그룹 g1: 더함·시작값 물려받음');
  ok(JSON.stringify(deep([...store.entries()].filter(([k]) => /OLD1/.test(k)))) === JSON.stringify(before), '옛 상품 기록은 한 글자도 안 바뀜');
  ok(!JSON.stringify(store.get('prd_inherit/NEW1')).includes('undefined'), '장부에 빈 값(undefined) 없음');
  /* 되돌리기 전에 사람이 새 구매 짝을 고쳤다면 그건 지우지 않음 */
  const pmBefore = store.get('pur_matches/NEW1'); ok(pmBefore && pmBefore.edFrom === 'OLD1', '구매 짝 사본에 표시');
  R.to.set('U200', { kind: 'ed', toKey: 'NEW1', fromKey: 'OLD1', toLid: '200', fromLid: '100' }); store.set('prd_relinks/U200', { kind: 'ed', from: 'U100', to: 'U200' });
  store.set('prd_edkw_truth/NEW1', { ...store.get('prd_edkw_truth/NEW1'), inhFrom: 'HUMAN' }); /* 사람이 바꾼 것으로 침 */
  const U = await run('recInheritUndo')('NEW1');
  const dN2 = store.get('prd_price_decisions/NEW1'); ok(U.undone && !('watch' in dN2) && !('inh' in dN2) && dN2.floor === 9500 && dN2.approval.ok === 2, '되돌리기 — 베낀 칸만 지움 · 새 상품 원래 칸 그대로', dN2);
  ok(!store.has('pur_matches/NEW1'), '구매 짝 사본 지움(표시 그대로일 때)'); ok(store.has('prd_edkw_truth/NEW1'), '표시가 바뀐 사본은 안 지움');
  ok(!store.get('strat_items/chNEW1').m.NEW1 && store.get('strat_items/chNEW1').m.OTHER, '⚡ 전략: 새 열쇠 칸만 거둠');
  ok(!('added' in batches.get('g1')) || !batches.get('g1').added.NEW1, '그룹 더함 거둠'); ok(batches.get('g1').held.NEW1 === 1, '새 상품이 원래 가진 그룹 쉼 그대로');
  ok(store.get('prd_relinks/U200').rejected === true && store.get('prd_relinks/U200').rejectWhy === '🔖 판 옮김 되돌리기', '고리는 지우지 않고 「끊음」');
  ok(JSON.stringify(run("recChainKeys('NEW1')")) === '["NEW1"]', '끊은 뒤엔 옛 기록을 함께 안 봄');
  ok(store.get('prd_inherit/NEW1').undone === true, '장부에 되돌림 표시(장부는 남김)');
  ok(JSON.stringify(deep([...store.entries()].filter(([k]) => /OLD1/.test(k)))) === JSON.stringify(before), '되돌린 뒤에도 옛 상품 기록 그대로');
  const U2 = await run('recInheritUndo')('NEW1'); ok(U2.undone, '두 번 되돌려도 탈 없음');

  console.log('⑤ 웹앱에 걸린 곳');
  ok(/ed: '🔖 판 옮김'/.test(T), '같은 실물 고리 종류에 🔖 판 옮김');
  ok(/k0 && k0\.kind === 'ed'/.test(T), '같은 실물 카드에서 판 옮김 고리를 끊지 않음(판 옮김 카드에서 되돌림)');
  ok(/recWhereKey\(db\.collection\('prd_price_actions'\), 'key', pid\)/.test(T) && /recWhereKey\(db\.collection\('prd_price_reviews'\), 'key', pid\)/.test(T), '가격 내력·검토 — 옛 열쇠까지');
  ok(/recWhereKey\(db\.collection\('prd_listing_changes'\), 'listingKey', pid\)/.test(T), '변경 기록 — 옛 열쇠까지');
  ok(/recChainKeys\(pid\) : \[pid\]/.test(T), '메모 — 옛 열쇠까지');
  ok(/const K = recChainKeys\(l\.id\); if \(K\.length < 2\) return r; \/\* \(recinh1\)/.test(T), '판단 메모 — 옛 열쇠까지');
  ok((T.match(/pxVwOf\(lid\)/g) || []).length >= 4, '조회수 셈·막대·작은 그림·더 보기 모두 pxVwOf');
  ok(/SEC\('판 옮김', \(\) => edMoveCardHtml\(l\)\)/.test(T), '상품 화면에 「판 옮김」 칸');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
