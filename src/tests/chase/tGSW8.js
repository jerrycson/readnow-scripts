// tGSW8 — 🎚 그룹 전략 창 판 ⑧: 여러 그룹에 복사 · 📁 묶음 기본으로 올리기 · 층 창(묶음 기본·전체) (정범님 11/19 I-1119-1304-10 · 일꾼 strat6 · 설계 STRAT_DESIGN_1119 3.1·3.6·3.7 판 ⑧) 시험
// 실행: node src/tests/chase/tGSW8.js
//  ① 「빈 칸만」은 그룹이 가진 칸을 지킴 ② 「덮음」은 고른 부분만 건드림 ③ 보기 전용·보관은 건너뜀 ④ 복사 → 되돌리기 = 이전 값 · 복사 뒤 바뀐 그룹은 건너뜀
//  ⑤ 묶음 기본으로 올린 뒤 유효 값이 그대로(그룹 칸 비고 묶음 기본이 같은 값) · 영향 받는 그룹 수 ⑥ 한 트랜잭션 · 그 사이 바뀌면 충돌 ⑦ 켜짐·판정·반영은 복사 안 함 ⑧ 층 창이 같은 틀 · Firestore는 가짜 장부만
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const GSW = cut('/* ◆gsw 시작', '/* ◆gsw 끝 */'); const BLK = cut('/* ◆gsw8 시작', '/* ◆gsw8 끝 */');
const BKC = cut('function bkcNorm(', 'async function bkcSave('); const BKL = APP.split('\n').filter((l) => /^const (bkcLog|bkcGs) = /.test(l)).join('\n');
ok(!!BLK && !!GSW && !!BKC && BKL.includes('bkcGs'), '원본에서 시험할 조각을 찾음'); ok(!/\b(alert|confirm|prompt)\(/.test(BLK), '⑧ 블록에 브라우저 팝업 없음');
for (const f of ['gswCopyPlan', 'gswCopyHtml', 'gswCopyRun', 'gswCopyUndoPlan', 'gswCopyUndoRun', 'gswLiftPlan', 'gswLiftRun', 'gswLayerOpen', 'gswLApply']) ok(new RegExp('function ' + f + '\\(').test(BLK), '함수 ' + f + ' 있음');
ok(/data-gswl="fold"/.test(APP) && /🎚 자세히…/.test(APP) && /gswOpen\(fid, null, \{ layer: gl\.dataset\.gswl \}\)/.test(APP), '📁 묶음 기본 줄에 「🎚 자세히…」');

// 가짜 장부 — 문서 하나 = { watch, watchLog } · 트랜잭션은 읽기 → 쓰기 · 읽은 뒤 몰래 바뀌는 시험을 위해 hook
const mk = () => { const docs = new Map(); const writes = []; let hook = null; let txN = 0;
  const FV = { arrayUnion: (x) => ({ __union: x }), delete: () => ({ __del: 1 }), serverTimestamp: () => 'TS' };
  const setPath = (o, p, v) => { const ks = p.split('.'); let c = o; ks.slice(0, -1).forEach((k) => { if (typeof c[k] !== 'object' || c[k] === null) c[k] = {}; c = c[k]; }); if (v && v.__del) delete c[ks[ks.length - 1]]; else c[ks[ks.length - 1]] = v; };
  const apply = (d, up) => { for (const [k, v] of Object.entries(up)) { if (v && v.__union) { const a = k.split('.').reduce((c, q) => (c || {})[q], d); const arr = Array.isArray(a) ? a.slice() : []; arr.push(v.__union); setPath(d, k, arr); } else setPath(d, k, v === undefined ? { __del: 1 } : v); } };
  const ref = (id) => ({ id });
  const tx = { async get(r) { const d = docs.get(r.id); return { exists: !!d, data: () => JSON.parse(JSON.stringify(d || {})) }; }, update(r, up) { writes.push({ id: r.id, up }); const d = docs.get(r.id) || {}; docs.set(r.id, d); apply(d, up); }, set(r, v) { writes.push({ id: r.id, set: v }); docs.set(r.id, JSON.parse(JSON.stringify(v))); } };
  const db = { collection: () => ({ doc: (id) => ref(id) }), runTransaction: async (fn) => { txN++; if (hook) { const h = hook; hook = null; h(docs); } return fn(tx); } };
  return { docs, writes, db, FV, setHook: (f) => { hook = f; }, tx: () => txN }; };

const ctxMk = () => { const F = mk(); const S = { user: { email: 'a@x' }, prBatches: [], bkfold: { folds: { f1: { name: '묶음1', gids: ['g1', 'g2', 'g3', 'g4', 'g5'] } }, ctl: {} }, prCfg: {} };
  const g = (id, watch, x) => ({ id, name: '그룹' + id, watch, ...(x || {}) });
  S.prBatches = [g('g1', { on: true, mode: 'auto', apply: 'approve', chase: { name: 'follow', maxFollow: 2 }, rule: { floor: { costMult: 1.2 }, ceil: { pct: 150 }, time: { hours: '9-18' }, when: [{ id: 'w1', k: 'comp', op: '<=', v: 2, act: 'hold' }] }, pol: { sellers: { A: { mode: 'ignore' } } } }),
    g('g2', { on: false, rule: { floor: { costMult: 1.5 } } }), g('g3', null), g('g4', { on: true, chase: { name: 'yield' } }, { viewOnly: true }), g('g5', { on: false }, { archived: true })];
  for (const x of S.prBatches) F.docs.set(x.id, x.watch ? { watch: JSON.parse(JSON.stringify(x.watch)) } : {});
  F.docs.set('_bkfold', {});
  const calls = { dirty: [], toast: [] };
  const ctx = { console, S, db: F.db, firebase: { firestore: { FieldValue: F.FV } }, TS: () => 'TS', BKF_MAXG: 200, BKC_LOG: 30, setTimeout, clearTimeout, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: () => null, addEventListener() {}, removeEventListener() {} }, window: {}, esc: (s) => String(s ?? ''), num: (v) => String(v), errKo: (e) => String(e && e.message), kTime: () => '', toast: (m) => calls.toast.push(m), bkfDirty: (id) => calls.dirty.push(id), twiceArm: () => 'go',
    bkfJs: (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, v[q]])) : v)), bkfNorm: (d) => ({ folds: JSON.parse(JSON.stringify((d && d.folds) || {})) }), presetsOf: () => ({}), ctrlOptNorm: null, bkcPaint: () => {}, gswPaint: () => {}, GSW_VIEW: () => ({}) };
  ctx.bkfNorm = (d) => { const folds = {}; for (const [k, f] of Object.entries((d && d.folds) || {})) folds[k] = { ...f, gids: f.gids }; return { folds }; };
  vm.createContext(ctx); vm.runInContext(`${GSW}\n${BKC}\n${BKL}\nglobalThis.E = { gswCopyPlan, gswCopyRun, gswCopyUndoPlan, gswCopyUndoRun, gswLiftPlan, gswLiftRun, gswCpApply, gswGet, gswDiff, bkcOf, bkcNorm, gswCopy };`, ctx); return { E: ctx.E, S, F, ctx, calls }; };

(async () => {
  const T = ctxMk(); const E = T.E; const S = T.S; const from = S.prBatches[0]; const FROM = { id: 'g1', watch: from.watch };
  /* ① 빈 칸만 — g2는 한도 바닥(costMult 1.5)을 이미 가짐 → 지킴 · 나머지 한도 칸만 채움 */
  { const p = E.gswCopyPlan(FROM, ['g2'], ['lim'], 'fill'); ok(p.length === 1 && p[0].act === 'copy', 'g2: 복사 계획 있음');
    ok(E.gswGet(p[0].after, 'rule.floor.costMult') === 1.5, '빈 칸만: g2가 가진 바닥 값은 지킴'); ok(E.gswGet(p[0].after, 'rule.ceil.pct') === 150, '빈 칸만: 비어 있던 상한은 채움');
    ok(p[0].after.on === false && p[0].after.chase === undefined, '한도만 골랐으니 켜짐·추격자는 안 건드림'); ok(p[0].n === Object.keys(p[0].diff).length && p[0].n >= 1, '바뀌는 칸 수가 diff와 같음'); }
  /* ② 덮음 — g2 바닥이 원본 값으로 · 부분 밖(때) 안 건드림 */
  { const p = E.gswCopyPlan(FROM, ['g2'], ['lim'], 'over'); ok(E.gswGet(p[0].after, 'rule.floor.costMult') === 1.2, '덮음: g2 바닥이 원본 값(1.2)으로'); ok(E.gswGet(p[0].after, 'rule.time') === undefined, '덮음: 고르지 않은 「때」는 안 건드림');
    const p2 = E.gswCopyPlan(FROM, ['g2'], ['time'], 'over'); ok(E.gswGet(p2[0].after, 'rule.floor.costMult') === 1.5, '때만 덮으면 g2의 한도는 그대로'); ok(E.gswGet(p2[0].after, 'rule.time.hours') === '9-18', '때가 복사됨'); }
  /* ③ 건너뜀 */
  { const p = E.gswCopyPlan(FROM, ['g1', 'g3', 'g4', 'g5', 'zz'], ['lim'], 'fill'); const by = Object.fromEntries(p.map((x) => [x.id, x])); ok(by.g1.act === 'skip' && /원본/.test(by.g1.why), '원본 자신은 건너뜀'); ok(by.g3.act === 'copy', '감시 칸이 없던 g3은 복사 대상');
    ok(by.g4.act === 'skip' && /보기 전용/.test(by.g4.why), '보기 전용은 건너뜀'); ok(by.g5.act === 'skip' && /보관/.test(by.g5.why), '보관은 건너뜀'); ok(by.zz.act === 'skip', '모르는 그룹은 건너뜀');
    ok(E.gswCopyPlan(FROM, ['g3'], [], 'fill')[0].act === 'skip', '고른 부분이 없으면 건너뜀'); }
  /* ⑦ 켜짐·판정·반영은 복사 안 함 + 추격자는 전략 한 벌 */
  { const p = E.gswCopyPlan(FROM, ['g3'], ['chase', 'lim', 'time', 'rule', 'sell'], 'over')[0]; ok(p.after.on === undefined && p.after.mode === undefined && p.after.apply === undefined, '켜짐·판정·반영은 복사하지 않음');
    ok(p.after.chase && p.after.chase.name === 'follow' && p.after.chase.maxFollow === 2, '추격자는 이름·손잡이가 한 벌로 복사'); ok(E.gswGet(p.after, 'pol.sellers.A.mode') === 'ignore', '판매자 예외도 복사');
    const q = E.gswCopyPlan(FROM, ['g2'], ['chase'], 'fill')[0]; ok(q.after.chase && q.after.chase.name === 'follow', '빈 칸만: g2에 추격자가 없었으니 채움'); S.prBatches[1].watch.chase = { name: 'yield' };
    const r = E.gswCopyPlan(FROM, ['g2'], ['chase'], 'fill')[0]; ok(r.act === 'skip', '빈 칸만: g2에 다른 전략이 있으면 섞지 않고 건너뜀(바뀔 칸 없음)'); delete S.prBatches[1].watch.chase; }
  /* ⑥ 복사 실행 = 한 트랜잭션 · 기록 · 되돌릴 자료 */
  const F = T.F; const before2 = JSON.stringify(F.docs.get('g2').watch), before3 = JSON.stringify(F.docs.get('g3'));
  const plan = E.gswCopyPlan(FROM, ['g2', 'g3', 'g4'], ['lim', 'rule'], 'fill'); const r = await E.gswCopyRun('f1', 'g1', plan, ['lim', 'rule'], 'fill');
  ok(F.tx() === 1, '복사는 트랜잭션 한 번'); ok(r.done.length === 2 && r.lost.length === 0, 'g2·g3 두 그룹 복사(보기 전용 g4는 안 씀)'); ok(!F.writes.some((w) => w.id === 'g4'), '보기 전용 g4에 쓰기 0');
  ok(E.gswGet(F.docs.get('g3').watch, 'rule.floor.costMult') === 1.2 && E.gswGet(F.docs.get('g2').watch, 'rule.floor.costMult') === 1.5, '실제 문서: g3 채움 · g2 기존 값 지킴');
  ok(F.docs.get('g2').watch.on === false, 'g2 감시 켜짐은 그대로 꺼짐'); ok(F.docs.get('g3').watchLog && F.docs.get('g3').watchLog[0].how === 'gsw-copy', '그룹 watchLog에 how:gsw-copy');
  const kc = E.bkcOf('f1', F.docs.get('_bkfold')); ok(kc.copy && kc.copy.gs.length === 2 && kc.copy.from === 'g1' && kc.copy.parts.join() === 'lim,rule' && !kc.copy.undoneAt, '📁 묶음 문서 ctl.f1.copy에 되돌릴 자료(from·parts·gs)');
  ok(S.prBatches[2].watch && E.gswGet(S.prBatches[2].watch, 'rule.floor.costMult') === 1.2, '화면 쪽 그룹 값도 바로 바뀜'); ok(T.calls.dirty.includes('g3'), '그룹 화면이 새로 그려지게 알림');
  /* 세 그룹의 미리 보기 요약이 같다 — 그룹마다 같은 부분을 얻음(원본 g1 = g3 한도·규칙) */
  { const a = E.gswCopyPlan(FROM, ['g3'], ['lim', 'rule'], 'fill'); ok(a[0].act === 'skip' && /이미 같음/.test(a[0].why), '복사 뒤 같은 복사를 다시 계획하면 「이미 같음」(미리 보기 요약이 일치)'); }
  /* ④ 되돌리기 — g3 복사 뒤에 몰래 바꾼 g2는 건너뜀, 안 바뀐 g3은 이전(감시 칸 없음)으로 */
  F.docs.get('g2').watch.rule.floor.costMult = 9; S.prBatches[1].watch = JSON.parse(JSON.stringify(F.docs.get('g2').watch));
  { const up = E.gswCopyUndoPlan(E.bkcOf('f1').copy, S.prBatches); const by = Object.fromEntries(up.map((x) => [x.id, x])); ok(by.g2.act === 'skip' && /바뀜/.test(by.g2.why), '되돌리기: 복사 뒤 바뀐 g2는 건너뜀'); ok(by.g3.act === 'undo' && by.g3.to === null, '되돌리기: g3은 복사 전(감시 칸 없음)으로'); }
  S.bkfold = { folds: S.bkfold.folds, ctl: { f1: E.bkcOf('f1', F.docs.get('_bkfold')) } }; S.bkfold.ctl.f1 = E.bkcNorm({ ...S.bkfold.ctl.f1 });
  const u = await E.gswCopyUndoRun('f1'); ok(u.undone === 1 && u.skipped.some((x) => x.id === 'g2'), '되돌리기 실행: g3만 되돌림 · g2는 건너뜀'); ok(F.docs.get('g3').watch === undefined || Object.keys(F.docs.get('g3').watch).length === 0, 'g3 감시 칸이 복사 전처럼 비움');
  ok(F.docs.get('g2').watch.rule.floor.costMult === 9, 'g2의 나중 값은 건드리지 않음'); ok(F.docs.get('g3').watchLog.some((x) => x.how === 'gsw-undo'), '되돌림도 watchLog에 how:gsw-undo'); ok(!!E.bkcOf('f1', F.docs.get('_bkfold')).copy.undoneAt, '묶음 기록에 되돌린 때 찍힘');
  { const u2 = await E.gswCopyUndoRun('f1'); ok(u2.undone === 0, '두 번 되돌리기는 아무것도 안 함'); }
  /* g2를 복사 전 값으로 되돌렸을 때 (안 바뀐 경우) */
  { const T2 = ctxMk(); const e2 = T2.E; const pl = e2.gswCopyPlan({ id: 'g1', watch: T2.S.prBatches[0].watch }, ['g2', 'g3'], ['lim'], 'over'); await e2.gswCopyRun('f1', 'g1', pl, ['lim'], 'over'); T2.S.bkfold.ctl = { f1: e2.bkcOf('f1', T2.F.docs.get('_bkfold')) };
    ok(e2.gswGet(T2.F.docs.get('g2').watch, 'rule.floor.costMult') === 1.2, '(덮음) g2 바닥이 1.2로'); const uu = await e2.gswCopyUndoRun('f1'); ok(uu.undone === 2, '(덮음) 두 그룹 모두 되돌림'); ok(e2.gswGet(T2.F.docs.get('g2').watch, 'rule.floor.costMult') === 1.5 && e2.gswGet(T2.F.docs.get('g2').watch, 'rule.ceil.pct') === undefined, '(덮음) g2가 복사 전 값 그대로'); }
  /* ⑥ 계획 뒤 몰래 바뀌면 그 그룹은 건너뜀 */
  { const T3 = ctxMk(); const e3 = T3.E; const pl = e3.gswCopyPlan({ id: 'g1', watch: T3.S.prBatches[0].watch }, ['g2', 'g3'], ['lim'], 'fill'); T3.F.setHook((docs) => { docs.get('g3').watch = { on: true }; }); const rr = await e3.gswCopyRun('f1', 'g1', pl, ['lim'], 'fill'); ok(rr.done.length === 1 && rr.lost.length === 1 && rr.lost[0].id === 'g3', '계획 뒤 바뀐 g3은 건너뜀(충돌)'); ok(T3.F.docs.get('g3').watch.on === true && !T3.F.docs.get('g3').watchLog, '충돌 난 그룹은 안 씀'); }
  /* ⑤ 묶음 기본으로 올리기 — 유효 값이 그대로 */
  { const T4 = ctxMk(); const e4 = T4.E; const S4 = T4.S; const g1 = S4.prBatches[0]; const eff = (w, def) => { /* 그룹 칸이 있으면 그것 · 없으면 묶음 기본 */ const o = {}; for (const p of ['chase', 'rule.floor.costMult', 'rule.ceil.pct', 'rule.time.hours']) { const v = e4.gswGet(w || {}, p); o[p] = v !== undefined ? v : e4.gswGet(def || {}, p); } return JSON.stringify(o); };
    const def0 = e4.bkcOf('f1').def; const lp = e4.gswLiftPlan(def0, { id: 'g1', name: '그룹1', watch: g1.watch }, ['chase', 'lim', 'time'], S4.prBatches); ok(lp.ok && lp.moved.length >= 3, '올리기 계획: 추격자·한도·때가 올라감');
    ok(eff(lp.afterWatch, lp.foldNext) === eff(g1.watch, def0), '올린 뒤 이 그룹의 유효 값이 그대로(그룹 칸은 비고 묶음 기본이 채움)'); ok(e4.gswGet(lp.afterWatch, 'rule.floor') === undefined && lp.afterWatch.chase === undefined, '그룹 칸이 비워짐'); ok(lp.afterWatch.on === true, '켜짐은 안 건드림');
    const ids = lp.affected.map((x) => x.id); ok(ids.includes('g3') && !ids.includes('g1') && !ids.includes('g5'), '영향 받는 그룹: 칸이 빈 g3 포함 · 자신·보관 제외'); ok(ids.includes('g2'), '바닥만 따로 가진 g2도 나머지 칸(상한·추격자)은 새 묶음 기본을 따라 영향 받음');
    const lr = await e4.gswLiftRun('f1', g1, lp); ok(lr.ok, '올리기 실행 성공'); const kd = e4.bkcOf('f1', T4.F.docs.get('_bkfold')).def; ok(kd.chase && kd.chase.name === 'follow' && e4.gswGet(kd, 'rule.floor.costMult') === 1.2, '📁 묶음 기본에 값이 들어감'); ok(e4.gswGet(T4.F.docs.get('g1').watch, 'rule.floor.costMult') === undefined && T4.F.docs.get('g1').watchLog.some((x) => x.how === 'gsw-lift'), '그룹 칸 비움 · watchLog how:gsw-lift');
    const lp2 = e4.gswLiftPlan(e4.bkcOf('f1', T4.F.docs.get('_bkfold')).def, { id: 'g1', watch: T4.F.docs.get('g1').watch }, ['chase', 'lim', 'time'], S4.prBatches); ok(!lp2.ok, '이미 올렸으면 올릴 값이 없음');
    const lc = await e4.gswLiftRun('f1', { id: 'g1', watch: {} }, lp); ok(lc.conflict === 'group', '그룹이 계획 뒤 바뀌었으면 충돌로 안 씀'); }
  /* 조건 묶음 전략 있는 그룹은 추격자를 올리지 않음 */
  { const T5 = ctxMk(); T5.ctx.presetsOf = () => ({ p1: { chase: { name: 'match' } } }); const w = { on: true, mode: 'semi', presetId: 'p1', chase: { name: 'follow' } }; const lp = T5.E.gswLiftPlan(T5.E.bkcOf('f1').def, { id: 'g1', watch: w }, ['chase'], []); ok(!lp.ok && lp.err.some((e) => /조건 묶음/.test(e)), '조건 묶음 전략이 있으면 추격자는 올리지 않음(유효 전략이 바뀌므로)'); }
  /* ⑧ 층 창 — 묶음 기본·전체 둘 다 같은 틀 */
  ok(/gswLayerOpen\(fid, o\.layer\)/.test(APP) && /layer: 'global'/.test(APP), 'gswOpen(fid, null, {layer})로 층 창이 열림'); ok(/global: \(S\.prCfg \|\| \{\}\)\.watchRule/.test(APP), '전체 층 규칙(watchRule)이 유효 값 계산에 들어감');
  ok(/prd_system'\)\.doc\('pricing'\)\.update\(\{ autoChase/.test(BLK) && /watchRule/.test(BLK), '전체 층은 prd_system/pricing의 autoChase·watchRule에 저장');
  console.log(bad ? `❌ tGSW8 실패 ${bad}건 / ${n}건` : `✅ tGSW8 통과 ${n}건`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tGSW8 예외', e && e.stack || e); process.exit(1); });
