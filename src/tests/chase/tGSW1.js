// tGSW1 — 🎚 그룹 전략 창 판 ①(정범님 11/19 I-1119-1342-12 · 일꾼 strat4) 시험
// 실행: node src/tests/chase/tGSW1.js [판정 엔진 파일 경로]
// 웹앱 원본(src/app.html)에서 '◆gsw' 블록·bkcNorm·cheNewLine만 떼어 가짜 화면 상태로 돌림. 판정 엔진은 진짜.
//  ① 손잡이 범위·검사 ② 출처 칸(엔진 stratFor와 같은 차례) ③ 바뀐 칸만 update(겹치는 길 없음 · 지움) ④ 트랜잭션: 같으면 쓰고 다르면 띠
//  ⑤ 기본값 셋(셈만 7일 · 빠른 추격자 줄 · 빨리 따라 내림 기준) + 이미 운영 중인 그룹 값 안 바뀜 ⑥ bkcNorm이 손잡이·규칙·정책을 안 버림
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0]; /* 저장소(src/tests/chase) 안과 시험 문지기 임시 자리(pw/chase) 두 곳에서 모두 돎 */
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const BLK = cut('/* ◆gsw 시작', '/* ◆gsw 끝 */'); const NORM = cut('function bkcNorm(', 'function bkcOf('); const NEWL = cut('function cheNewLine(', 'function openPresetList(');
const BKFJS = APP.split('\n').find((l) => l.startsWith('const bkfJs = '));
ok(!!BLK && !!NORM && !!NEWL && !!BKFJS, '원본에서 시험할 조각을 찾음');
ok(/CTRL_DEF = \{.*tryMode: 'ask'/.test(APP), 'CTRL_DEF.tryMode는 그대로 ask(정범님: 건드리지 않음)');
ok(/\.bigask-ov\{/.test(APP) && /\.gsw-win/.test(APP) && /id = 'gsw_ov'/.test(APP), '안쪽 창 틀·css 이름이 gsw-로 시작');
ok(!/\b(alert|confirm|prompt)\(/.test(BLK), '창 블록에 브라우저 팝업 없음');

function mk(over) {
  const docs = {}; const calls = { upd: [], toast: [], enroll: [], paint: 0 };
  const FV = { delete: () => ({ __del: 1 }), arrayUnion: (x) => ({ __union: x }), serverTimestamp: () => ({ __ts: 1 }) };
  const S = { prBatches: [], prCfg: {}, bkfold: { ctl: {} }, user: { email: 'x@y.z' }, ...(over && over.S) };
  const db = { collection: () => ({ doc: (id) => ({ id }) }), runTransaction: async (fn) => fn({ get: async (ref) => ({ exists: !!docs[ref.id], data: () => docs[ref.id] }), update: (ref, u) => calls.upd.push([ref.id, u]) }) };
  const ctx = { console, S, db, setTimeout: () => 0, clearTimeout: () => {}, firebase: { firestore: { FieldValue: FV } }, window: { ReadnowChase: CH }, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: (id) => (over && over.ov && id === 'gsw_ov' ? over.ov : null), createElement: () => ({}), addEventListener() {}, removeEventListener() {}, body: { appendChild() {} } }, history: {}, TS: () => ({ __ts: 1 }), esc: (x) => String(x), num: (x) => String(x), toast: (m) => calls.toast.push(m), errKo: (e) => String(e && e.message || e), twiceArm: () => 'go',
    presetsOf: () => S.prCfg.presets || {}, bkcOf: (fid) => ({ def: ((S.bkfold.ctl || {})[fid] || {}).def || {} }), bkcPaint: () => { calls.paint++; }, bkfDirty: () => {}, batchIsOn: () => true, bkfSt: (g) => g, watchEnroll: async (id) => { calls.enroll.push(id); return 3; }, slObsCfg: () => ({ fastLagMin: 45 }), batchLoadOne: async () => null, BKF_MAXG: 100, BKC_LOG: 60, kTime: (x) => x };
  vm.createContext(ctx); vm.runInContext(`${BKFJS}\n${BLK}\n${NORM}\n${NEWL}\nglobalThis.E = { gswPaint, gswChaseNorm, gswChaseCheck, gswSrc, gswWin, gswOps, gswPatch, gswDiff, gswPut, gswGet, gswPrep, gswApply, gswFastLag, gswLayers, bkcNorm, cheNewLine, GSW_K, bkfJs };`, ctx);
  return { E: ctx.E, S, docs, calls, FV };
}
const T = mk(); const E = T.E; const plain = (o) => JSON.parse(JSON.stringify(o));

/* ① 손잡이 범위·검사 */
{ const o = E.gswChaseNorm({ name: 'follow', every: 100, maxFollow: -3, rangePct: '12', stopAt: 'zzz', under: 'x', detect: { minEvents: 99, windowHours: 0 }, 이상한칸: 1 });
  ok(o.every === 72 && o.maxFollow === 0 && o.rangePct === 12, '범위 밖은 끝으로 · 문자 숫자는 정수로');
  ok(o.stopAt === undefined && o.under === undefined, '모르는 값(그만둔 뒤 · 숫자 아님)은 지움');
  ok(o.detect.minEvents === 10 && o.detect.windowHours === 1, '추격자 판정 칸도 범위 안으로');
  ok(o.이상한칸 === 1 && o.name === 'follow', '모르는 칸·이름은 지킴(감시기가 쓴 칸을 안 지움)');
  const c1 = E.gswChaseCheck({ name: 'nope', every: 0 }, CH.STRATS_ALL); ok(c1.err.length === 2, '모르는 전략·범위 밖은 막음');
  const c2 = E.gswChaseCheck({ name: 'follow', detect: { minEvents: 1 }, maxRounds: 6 }, CH.STRATS_ALL); ok(!c2.err.length && c2.warn.length === 2 && c2.twice, '사건 수 1은 알림 · 끌어내리기 5번 넘음은 두 번 누름');
  const c3 = E.gswChaseCheck({ name: 'follow', maxFollow: 0, every: 6 }, CH.STRATS_ALL); ok(!c3.err.length && !c3.twice, '따를 횟수 0은 허용'); }

/* ② 출처 — 엔진 stratFor와 같은 차례로 이긴 층 */
{ const gl = { name: 'follow', rangePct: 12 }; const L1 = { group: { name: 'follow', maxFollow: 4 }, preset: null, fold: null, global: gl };
  let a = E.gswSrc('maxFollow', L1, CH), b = E.gswSrc('rangePct', L1, CH), c = E.gswSrc('every', L1, CH);
  ok(a.v === 4 && a.src === 'group', '그룹이 덮은 칸은 이 그룹'); ok(b.v === 12 && b.src === 'global', '그룹이 안 덮은 칸은 전체 값을 물려받음'); ok(c.v === 6 && c.src === 'default', '아무도 안 정한 칸은 엔진 기본');
  const eng = CH.stratFor({ global: gl, groups: [{ id: 'g', name: 'g', chase: L1.group }] }); ok(eng.strat.maxFollow === 4 && eng.strat.rangePct === 12, '엔진 stratFor도 같은 값(그룹 위에 전체를 깔음)');
  const L2 = { group: null, preset: { name: 'follow', maxFollow: 1 }, fold: { name: 'follow', maxFollow: 3 }, global: gl }; const p = E.gswSrc('maxFollow', L2, CH), p2 = E.gswSrc('rangePct', L2, CH);
  ok(p.v === 1 && p.src === 'preset' && p2.src === 'default' && p2.v === 10, '조건 묶음은 통째로 이김(전체 값을 안 섞음)');
  const e2 = CH.stratFor({ global: gl, groups: [{ id: 'g', name: 'g', chase: null, preset: { name: 'p', chase: L2.preset } }] }); ok(e2.strat.maxFollow === 1 && (e2.strat.rangePct == null || e2.strat.rangePct === 10), '엔진도 조건 묶음이 통째');
  const L3 = { group: null, preset: null, fold: { name: 'follow', maxFollow: 3 }, global: gl }; const f = E.gswSrc('maxFollow', L3, CH), f2 = E.gswSrc('rangePct', L3, CH); ok(f.src === 'fold' && f2.src === 'global' && f2.v === 12, '📁 묶음 기본은 전체 위에 덮음');
  const L4 = { group: null, preset: null, fold: null, global: null }; const d = E.gswSrc('name', L4, CH); ok(d.v === 'yield' && d.src === 'default', '아무 층도 없으면 양보(엔진 기본)'); }

/* ③ 바뀐 칸만 update */
{ const FV = T.FV; const before = { on: true, mode: 'auto', apply: 'approve', guardPct: 15, since: 's', chase: { name: 'follow', maxFollow: 2 } };
  const after = JSON.parse(JSON.stringify(before)); after.chase.maxFollow = 4; after.chase.every = 12; const u = E.gswPatch(before, after, { how: 'gsw' }, FV); const ks = Object.keys(u).filter((k) => k.startsWith('watch.')).sort();
  ok(ks.join() === 'watch.chase.every,watch.chase.maxFollow', '바뀐 두 칸만 점 길로 보냄: ' + ks.join()); ok(u['watch.chase.maxFollow'] === 4 && u['watch.chase.every'] === 12, '값이 맞음'); ok(!('watch' in u), 'watch 통째로 안 덮음');
  ok(u.watchLog && u.watchLog.__union.how === 'gsw', 'watchLog arrayUnion · how gsw');
  const after2 = JSON.parse(JSON.stringify(before)); delete after2.chase.maxFollow; const u2 = E.gswPatch(before, after2, null, FV); ok(u2['watch.chase.maxFollow'] && u2['watch.chase.maxFollow'].__del === 1, '↺ 물려받기 = 그 칸만 지움');
  const after3 = JSON.parse(JSON.stringify(before)); after3.chase = null; const u3 = E.gswPatch(before, after3, null, FV); const k3 = Object.keys(u3).filter((k) => k.startsWith('watch.')); ok(k3.length === 1 && k3[0] === 'watch.chase' && u3['watch.chase'] === null, '전략을 통째로 비우면 겹치는 길 없이 chase 하나');
  const ops = E.gswOps(before, { ...before, chase: { name: 'second', under: 2 } }); const paths = ops.map((o) => o[0]); ok(paths.every((p) => !paths.some((q) => q !== p && p.startsWith(q + '.'))), '겹치는 길이 없음: ' + paths.join());
  // 시뮬레이터: update 값을 앞 값에 적용하면 뒤 값과 같아야 함
  const apply = (b, u0) => { let o = JSON.parse(JSON.stringify(b)); for (const [k, v] of Object.entries(u0)) { if (!k.startsWith('watch.')) continue; o = E.gswPut(o, k.slice(6), v && v.__del ? undefined : v); } return o; };
  let all = true; const cases = [[before, after], [before, after2], [before, after3], [before, { ...before, chase: { name: 'second', under: 2 } }], [{}, { on: true, chase: { name: 'follow' } }], [before, { ...before, rule: { detect: { fastLagMin: 30 } } }]];
  for (const [b, a] of cases) { const u4 = E.gswPatch(b, a, null, FV); const got = Object.keys(b).length ? apply(b, u4) : u4.watch; if (E.bkfJs(got) !== E.bkfJs(a)) { all = false; console.log('   어긋남', JSON.stringify(got), JSON.stringify(a)); } }
  ok(all, '여섯 경우 모두 update를 적용하면 뒤 값과 같음'); }

/* ④ 트랜잭션 — 같으면 쓰고 다르면 띠 */
(async () => {
  const mkG = (watch) => { const T2 = mk({ S: {} }); T2.S.prBatches = [{ id: 'g1', name: '시험', watch }]; T2.S._gsw = null; return T2; };
  const w0 = { on: true, mode: 'auto', apply: 'approve', guardPct: 15, since: '2026-11-01T00:00:00.000Z', chase: { name: 'follow', maxFollow: 2 } };
  { const T2 = mkG(w0); T2.docs.g1 = { watch: JSON.parse(JSON.stringify(w0)) }; const next = JSON.parse(JSON.stringify(w0)); next.chase.maxFollow = 5;
    T2.S._gsw = { fid: 'f', gid: 'g1', base: JSON.parse(JSON.stringify(w0)), draft: next, auto: false, band: null, busy: false }; await T2.E.gswApply(null);
    ok(T2.calls.upd.length === 1, '같을 때 update 한 번'); const u = (T2.calls.upd[0] || [])[1] || {}; ok(u['watch.chase.maxFollow'] === 5 && !('watch' in u) && u.watchLog && u.watchLog.__union.how === 'gsw' && u.watchLog.__union.what === '🎚 그룹 전략 창', '바뀐 칸 + watchLog how gsw');
    ok(T2.S.prBatches[0].watch.chase.maxFollow === 5, '화면 쪽 사본도 맞춤'); ok(T2.calls.enroll.length === 0, '이미 켜진 그룹은 감시에 다시 안 붙임'); }
  /* ⑦ 셈만 상태 → 쓰기 0 · 저절로 넘어가는 길 없음 (정범님 11/19 17:17) */
  { const wt = { ...w0, firstTry: { since: '2026-11-01T00:00:00.000Z', mode: 'dry', by: 'x', noAuto: true } }; const T2 = mkG(wt); T2.docs.g1 = { watch: JSON.parse(JSON.stringify(wt)) }; const next = JSON.parse(JSON.stringify(wt)); next.chase.maxFollow = 6;
    T2.S._gsw = { fid: 'f', gid: 'g1', base: JSON.parse(JSON.stringify(wt)), draft: next, auto: false, band: null, busy: false }; await T2.E.gswApply(null);
    const ks = T2.calls.upd.flatMap(([id, u]) => Object.keys(u).map((k) => id + ':' + k)); ok(T2.calls.upd.every(([id]) => id === 'g1') && ks.every((k) => /^g1:(watch\.|watchLog$|uploadedAt$)/.test(k)), '셈만 상태에서 적용해도 쓰는 곳은 그룹 감시 설정뿐(가격·상태 쓰기 0건)');
    ok(!ks.some((k) => /firstTry/.test(k)) && T2.docs.g1.watch.firstTry, '적용만으로 셈만이 끝나지 않음(날짜·횟수 없음)');
    const e = T2.E.gswPrep({ fid: 'f', gid: 'g1', base: wt, draft: { ...wt } }, T2.S.prBatches[0]); ok(e.next.firstTry && !e.next.firstTry.days, '다시 다듬어도 셈만 그대로');
    const dEnd = { ...wt }; delete dEnd.firstTry; const e2 = T2.E.gswPrep({ fid: 'f', gid: 'g1', base: wt, draft: dEnd }, T2.S.prBatches[0]); ok(!e2.next.firstTry && Object.keys(T2.E.gswDiff(wt, e2.next)).every((k) => k.startsWith('firstTry')), '셈만 끝내기는 정범님이 직접 눌러야만(그 칸만 지움)'); }
  { const T2 = mkG(w0); const srv = JSON.parse(JSON.stringify(w0)); srv.apply = 'auto'; T2.docs.g1 = { watch: srv }; const next = JSON.parse(JSON.stringify(w0)); next.chase.maxFollow = 5;
    T2.S._gsw = { fid: 'f', gid: 'g1', base: JSON.parse(JSON.stringify(w0)), draft: next, auto: false, band: null, busy: false }; await T2.E.gswApply(null);
    ok(T2.calls.upd.length === 0, '그 사이 서버가 바뀌었으면 쓰지 않음'); ok(T2.S._gsw.band && T2.S._gsw.band.k === 'conflict', '창 안 띠(conflict)로 알림'); ok(T2.S._gsw.draft.chase.maxFollow === 5, '고치던 값은 그대로 둠'); }

  /* ⑤ 기본값 셋 + 운영 중 값 안 바뀜 */
  { const T2 = mkG({}); const P = { fid: 'f', gid: 'g1', base: {}, draft: { on: true, mode: 'auto', apply: 'approve', guardPct: 15 } }; const R = T2.E.gswPrep(P, T2.S.prBatches[0]);
    ok(!R.err && R.next.firstTry && R.next.firstTry.mode === 'dry' && R.next.firstTry.noAuto === true && R.next.firstTry.days === undefined, '처음 켜는 그룹은 셈만 — 날짜·횟수 없음(저절로 넘어가는 길 없음)'); ok(R.enroll === true && R.first === true, '처음 켬 → 감시에 붙임');
    const T3 = mkG({}); T3.S.prCfg.ctrlCfg = { tryMode: 'live' }; const R3 = T3.E.gswPrep({ fid: 'f', gid: 'g1', base: {}, draft: { on: true, mode: 'auto', apply: 'approve', guardPct: 15 } }, T3.S.prBatches[0]); ok(R3.next.firstTry && R3.next.firstTry.mode === 'dry', '관제창 설정이 「바로 반영」이어도 처음은 셈만(정범님 11/19 17:17)');
    const T4 = mkG({}); T4.S.prCfg.ctrlCfg = { tryMode: 'dry', tryDays: 3 }; const R4 = T4.E.gswPrep({ fid: 'f', gid: 'g1', base: {}, draft: { on: true, mode: 'auto', apply: 'approve', guardPct: 15 } }, T4.S.prBatches[0]); ok(R4.next.firstTry && R4.next.firstTry.days === undefined && R4.next.firstTry.noAuto, '설정에 일수가 있어도 날짜로 넘어가는 길을 안 만듦');
    const R5 = T2.E.gswPrep({ fid: 'f', gid: 'g1', base: w0, draft: JSON.parse(JSON.stringify(w0)) }, T2.S.prBatches[0]); ok(!R5.next.firstTry && !R5.first && !R5.enroll, '이미 운영 중인 그룹은 셈만 7일을 안 붙임');
    const w1 = { ...w0, on: false }; const R6 = T2.E.gswPrep({ fid: 'f', gid: 'g1', base: w1, draft: { ...w1, on: true } }, T2.S.prBatches[0]); ok(!R6.next.firstTry && R6.enroll, '꺼 뒀다 다시 켠 그룹도 셈만 안 붙임(처음이 아님) · 감시엔 붙임');
    const f = T2.E.cheNewLine('판매자A'); ok(f.name === '판매자A' && f.stance === 'flexible' && f.cond.maxFollow === 0 && f.cond.backPct === 15 && f.strat === '' && f.condSet === '', '새 판매자 전략 줄 = 유동 · 2위 간격 15% · 따를 횟수 0');
    const fe = CH.fastChaserEntry(null); ok(fe.cond.maxFollow === f.cond.maxFollow && fe.stance === f.stance, '엔진 fastChaserEntry와 같은 값');
    const fl = (w, fid) => T2.E.gswFastLag(w, fid); ok(fl({}, null).v === 45 && fl({}, null).src === 'default', '빨리 따라 내림 기준: 비우면 🔭 관찰 기준');
    ok(fl({ rule: { detect: { fastLagMin: 30 } } }, null).v === 30 && fl({ rule: { detect: { fastLagMin: 30 } } }, null).src === 'group', '그룹 값이 먼저');
    T2.S.bkfold.ctl.f = { def: { rule: { detect: { fastLagMin: 20 } } } }; ok(fl({}, 'f').v === 20 && fl({}, 'f').src === 'fold', '📁 묶음 기본 규칙 층');
    const bad1 = T2.E.gswPrep({ fid: 'f', gid: 'g1', base: w0, draft: { ...w0, rule: { detect: { fastLagMin: 5000 } } } }, T2.S.prBatches[0]); ok(!!bad1.err, '기준 분은 1~1440만'); }

  /* ⑥ bkcNorm 이 손잡이·규칙·정책을 안 버림 · 옛 값 모양은 그대로 */
  { const c = T.E.bkcNorm({ def: { chase: { name: 'follow', maxFollow: 4, detect: { minEvents: 2 } }, rule: { detect: { fastLagMin: 30 } }, pol: { x: 1 }, watch: { mode: 'auto', apply: 'approve', guardPct: 15 } } });
    ok(c.def.chase.maxFollow === 4 && c.def.chase.detect.minEvents === 2 && c.def.rule.detect.fastLagMin === 30 && c.def.pol.x === 1, '📁 묶음 기본의 손잡이·규칙·정책이 남음');
    const o = T.E.bkcNorm({ def: { chase: 'second', watch: { mode: 'auto' } } }); ok(o.def.chase.name === 'second' && Object.keys(o.def.chase).length === 1 && !('rule' in o.def), '옛 모양(이름만)은 그대로');
    const z = T.E.bkcNorm({}); ok(z.def.chase === null && !('rule' in z.def), '비었으면 비어 있음'); }

  /* ⑦ 그리기 — 값마다 출처 칩·↺·ⓘ · 바로 가기 넷 · 빈 미리 보기 자리 · 휴대폰 폭에서 가로로 안 넘침 틀 */
  { const ov = { innerHTML: '', querySelector: () => null }; const T2 = mk({ ov }); const w = { on: true, mode: 'auto', apply: 'approve', guardPct: 15, since: 's', chase: { name: 'follow', maxFollow: 4 } }; T2.S.prBatches = [{ id: 'g1', name: '시험', watch: w }];
    T2.S.prCfg.autoChase = { name: 'follow', rangePct: 12 }; T2.S._gsw = { fid: 'f', gid: 'g1', base: w, draft: JSON.parse(JSON.stringify(w)), auto: false, band: null, busy: false };
    T2.E.gswPaint(); const h = ov.innerHTML; ok(h.length > 500, '창이 그려짐');
    ok(/data-gswk="maxFollow"/.test(h) && /data-gswi="maxFollow"/.test(h) && !/data-gswi="rangePct"/.test(h), '덮은 칸에만 ↺ 물려받기');
    ok(/gsw-chip gsw-group/.test(h) && /gsw-chip gsw-global/.test(h) && /gsw-chip gsw-default/.test(h), '출처 칩: 이 그룹 · 전체 · 엔진 기본');
    ok((h.match(/class="gsw-i"/g) || []).length >= 14, '칸마다 ⓘ(손잡이 13 + 빨리 따라 내림 기준)');
    ok(['group', 'fold', 'preset', 'global'].every((k) => h.includes(`data-gswgo="${k}"`)), '바로 가기 넷'); ok(/🔍 미리 보기/.test(h) && /📒 기록/.test(h), '🔍 미리 보기 · 📒 기록 구역');
    ok(/data-gswf="fastLag"/.test(h) && /data-gswact="apply"[^>]*disabled/.test(h), '빨리 따라 내림 기준 칸 · 바뀐 것 없으면 적용 막힘');
    ok(/role="dialog"/.test(h) && /bigask-x/.test(h), '닫기 단추·대화 상자 역할'); }

  console.log(`tGSW1 ${bad ? '❌ 실패 ' + bad : '✓ 통과'} (${n}개 확인)`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 중 오류', e && e.stack || e); process.exit(1); });
