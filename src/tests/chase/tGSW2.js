// tGSW2 — 🎚 그룹 전략 창 판 ②: 🔍 미리 보기 · 📒 기록·되돌리기 (정범님 11/19 I-1119-1304-10 · 일꾼 strat6) 시험
// 실행: node src/tests/chase/tGSW2.js [판정 엔진 파일 경로]
// 웹앱 원본(src/app.html)에서 '◆gsw' 블록·ctrlJudgeIn·wgStratOf만 떼어 가짜 화면 상태로 돌림. 판정 엔진은 진짜. 가짜 상품 12권은 판매자A 같은 이름만.
//  ① 미리 보기 한 줄 = 엔진 judge와 같은 값(관제창 ctrlPeek와 같은 입력 길) ② 양보→동가로 바꾸면 내려감이 늘어남 ③ 요약 숫자 ④ 만약 상대가 더 내리면 — 따를 횟수에서 멈춤
//  ⑤ 되돌리기는 그 줄이 바꾼 칸만 · 나중에 바뀐 칸은 지킴 · 지우지 않음 ⑥ 셈만 기록 ⑦ 미리 보기는 Firestore 읽기·쓰기 0 · 값을 안 바꿈
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const BLK = cut('/* ◆gsw 시작', '/* ◆gsw 끝 */'); const JIN = cut('function ctrlJudgeIn(', 'function ctrlPeek('); const WGS = cut('function wgStratOf(', 'const wgSrcTag');
const BKFJS = APP.split('\n').find((l) => l.startsWith('const bkfJs = '));
ok(!!BLK && !!JIN && !!WGS && !!BKFJS, '원본에서 시험할 조각을 찾음');
ok(!/\b(alert|confirm|prompt)\(/.test(BLK), '창 블록에 브라우저 팝업 없음');
for (const f of ['gswFacts', 'gswPvRun', 'gswPvRow', 'gswPvSum', 'gswPvHtml', 'gswWhatIf', 'gswLogHtml', 'gswUndo']) ok(new RegExp('function ' + f + '\\(').test(BLK), '함수 ' + f + ' 있음');
ok(/function ctrlPeek\([\s\S]{0,6000}ctrlJudgeIn\(/.test(APP), 'ctrlPeek도 같은 ctrlJudgeIn을 부름(둘째 셈 길 없음)');

const calls = { db: 0, upd: [] };
function mk(over) {
  const S = { prBatches: [], prCfg: {}, bkfold: { ctl: {} }, user: { email: 'x@y.z' }, prDec: new Map(), plist: new Map(), ...(over && over.S) };
  const db = new Proxy({}, { get: () => { calls.db++; throw new Error('Firestore를 부름'); } });
  const ctx = { console, S, db, setTimeout, clearTimeout, firebase: { firestore: { FieldValue: { delete: () => ({ __del: 1 }), arrayUnion: (x) => ({ __union: x }) } } }, window: { ReadnowChase: CH, ReadnowPricing: PR }, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: () => null, createElement: () => ({}) },
    presetsOf: () => S.prCfg.presets || {}, wgStratExt: () => ({}), bkcPaint: () => {}, bkfDirty: () => {}, batchIsOn: () => true, bkfSt: (g) => g, bkfCond: (g) => g.cond || {}, esc: (s) => String(s ?? ''), num: (v) => String(v), won: (v) => (v == null ? '-' : v + '원'), kTime: (s) => String(s || '').slice(5, 16), twiceArm: () => 'go', toast: () => {}, errKo: (e) => String(e), TS: () => 0, ...(over && over.ctx) };
  vm.createContext(ctx); vm.runInContext(`${BKFJS}\n${BLK}\n${JIN}\n${WGS}\nglobalThis.E = { ${['gswFacts', 'gswPvRun', 'gswPvRow', 'gswPvSum', 'gswPvHtml', 'gswWhatIf', 'gswLogHtml', 'gswUndo', 'gswDryOf', 'ctrlJudgeIn', 'gswPatch'].filter((f) => new RegExp('function ' + f + '\\(').test(BLK + JIN)).join(', ')} };`, ctx);
  return { E: ctx.E, S };
}

/* 가짜 상품 12권 — 판매자A 같은 이름만 · 추격자 있음/없음·바닥 근처·1위·원가 모름 */
const ch = (p, sc) => ({ sellerCode: sc || 'SA', name: '판매자A', price: p, grade: 'A', rank: 1 });
const F = (i, cur, target, dec) => ({ k: 'aladin_' + (1000 + i), l: { usedCode: 1000 + i, title: '책' + i, price: cur, grade: 'A' }, x: target === undefined ? { page1: [] } : { target, page1: [], tier: null }, dec });
const FACTS = [
  F(1, 10000, 10000, { chaser: ch(9000), floor: 0, start: 10000 }), F(2, 12000, 12000, { chaser: ch(11000), floor: 0, start: 12000 }), F(3, 8000, 8000, { chaser: ch(7000), floor: 0, start: 8000 }),
  F(4, 15000, 15000, { chaser: ch(13000), floor: 0, start: 15000 }), F(5, 10000, 10000, { chaser: ch(9500), floor: 9800, start: 10000 }), F(6, 20000, 20000, { chaser: ch(17000), floor: 19000, start: 20000 }),
  F(7, 10000, 10000, null), F(8, 9000, 9000, { chaser: null, floor: 0, start: 9000 }), F(9, 7000, 7000, { floor: 0, start: 7000 }),
  F(10, 10000, 9500, { chaser: ch(11000), floor: 0, start: 10000 }), F(11, 10000, undefined, { chaser: ch(9000), floor: 0, start: 10000 }), F(12, 5000, 5000, { chaser: ch(4500), floor: 0, start: 5000 }),
];
const T = mk(); const E = T.E; const plain = (o) => JSON.parse(JSON.stringify(o));
const g0 = (chase, over) => ({ id: 'g1', name: '그룹1', watch: { on: true, mode: 'auto', apply: 'approve', chase, ...(over || {}) } });
const O = (S, W, D, extra) => ({ g: { id: 'g1', name: '그룹1' }, saved: W, draft: D, ...extra });

/* ① 한 줄 = 엔진 judge와 같은 값 */
{ const W = { on: true, mode: 'auto', apply: 'approve', chase: { name: 'yield' } }; let same = 0;
  for (const f of FACTS) { const row = E.gswPvRow(f, { g: { id: 'g1' }, saved: W, draft: W, nowIso: '2026-11-19T03:00:00Z' }); const gs = CH.stratFor({ global: null, groups: [{ id: 'g1', name: 'g1', chase: W.chase }] });
    const dec = f.dec; let want = f.l.price; if (dec && dec.chaser) { const In = E.ctrlJudgeIn(f.x, f.l, dec, gs, { nowIso: '2026-11-19T03:00:00Z' }); const r = CH.judge(In); if (r && r.t != null) want = r.t; }
    if (row.b.to === want && row.a.to === want) same++; else console.log('   다름', f.k, row.b.to, want); }
  ok(same === 12, '12권 모두 미리 보기 값 = 엔진 judge 값: ' + same);
  const r7 = E.gswPvRow(FACTS[6], { g: { id: 'g1' }, saved: W, draft: W }); ok(r7.b.to === 10000 && r7.b.why.length, '결정 기록이 없는 상품은 그대로 + 까닭'); }

/* ② 양보 → 동가(match)로 바꾸면 내려감이 늘어남 */
{ const Wy = { on: true, mode: 'auto', apply: 'approve', chase: { name: 'yield' } }, Wm = { ...Wy, chase: { name: 'match' } }; const o = { g: { id: 'g1' }, nowIso: '2026-11-19T03:00:00Z' };
  const ry = FACTS.map((f) => E.gswPvRow(f, { ...o, saved: Wy, draft: Wy })), rm = FACTS.map((f) => E.gswPvRow(f, { ...o, saved: Wy, draft: Wm }));
  const sy = E.gswPvSum(ry, Wy), sm = E.gswPvSum(rm, Wm); ok(sm.dn > sy.dn, `양보 → 동가: 내려감 ${sy.dn} → ${sm.dn}`); ok(sm.diff > 0 && sy.diff === 0, '저장된 값과 다른 상품 수가 셈'); ok(sm.won < 0, '합계 금액이 줄어듦(' + sm.won + ')');
  ok(sm.dn + sm.up + sm.same === 12, '내려감+올라감+그대로 = 12'); ok(sm.floor >= 1, '바닥에 걸린 상품이 셈: ' + sm.floor);
  const sa = E.gswPvSum(rm, { ...Wm, apply: 'auto', guardPct: 15 }); ok(sa.pend < sm.pend || sm.pend === sm.dn + sm.up, '결정 대기 방식이면 움직임이 모두 결정 대기로');
  const sorted = E.gswPvSum(rm, Wm).top; ok(sorted.length && Math.abs(sorted[0].b.to - sorted[0].a.to) >= Math.abs(sorted[sorted.length - 1].b.to - sorted[sorted.length - 1].a.to), '표는 차이가 큰 것부터'); }

/* ③ 만약 상대가 더 내리면 — 따를 횟수 2에서 멈춤 */
{ const W = { on: true, mode: 'auto', apply: 'approve', chase: { name: 'follow', maxFollow: 2, rangePct: 50 } }; const f = FACTS[0]; const o = { g: { id: 'g1' }, saved: W, draft: W, nowIso: '2026-11-19T03:00:00Z' };
  const w = E.gswWhatIf(f, o, 10); ok(w.steps.length >= 1 && w.steps.length <= 10, '최대 10번 안: ' + w.steps.length); const moved = w.steps.filter((s) => s.moved);
  ok(moved.length === 2, '따를 횟수 2 → 2번만 따라 내림: ' + moved.length); ok(w.steps[w.steps.length - 1].stop === true, '더 안 따라 내리는 자리에서 멈춤');
  const w2 = E.gswWhatIf(FACTS[6], o, 10); ok(!w2.steps.length && w2.why, '추격자를 모르면 셈 안 함 + 까닭'); }

/* ④ 되돌리기 — 그 줄이 바꾼 칸만 */
{ const watch = { on: true, apply: 'approve', chase: { name: 'follow', maxFollow: 4, every: 12, rangePct: 20 } };
  const e1 = { at: '2026-11-19T01:00:00Z', by: 'a@b.c', what: '🎚 그룹 전략 창', how: 'gsw', diff: { 'chase/maxFollow': { from: 2, to: 4 }, 'chase/every': { from: null, to: 12 }, 'chase/rangePct': { from: 10, to: 15 } } };
  const R = E.gswUndo(watch, e1); ok(R.rev.length === 2 && R.kept.length === 1, '지금도 그 줄 값인 두 칸만 되돌리고 나중에 바뀐 칸(rangePct 20)은 지킴: ' + R.rev.length + '/' + R.kept.length);
  ok(R.next.chase.maxFollow === 2 && R.next.chase.every === undefined && R.next.chase.rangePct === 20, '값 되돌림 · 없던 칸은 지움 · 나중 값은 그대로');
  ok(watch.chase.maxFollow === 4, '넣어 준 값 자체는 안 바꿈(복사)');
  const e2 = { diff: { on: [false, true], 'chase.name': ['yield', 'follow'] } }; const R2 = E.gswUndo({ on: true, chase: { name: 'follow' } }, e2); ok(R2.next.on === true && R2.skip.length === 1 && R2.next.chase && R2.next.chase.name === 'yield', '켜기·끄기는 되돌리지 않고 알림 · 새 모양 [앞,뒤]도 읽음');
  const R3 = E.gswUndo(watch, { diff: null }); ok(!R3.rev.length && R3.err, 'diff 없는 줄은 되돌릴 것이 없음'); }

/* ⑤ 기록 화면 · 셈만 기록 */
{ const watchLog = [{ at: '2026-11-19T01:00:00Z', by: 'a@b.c', what: '🎚 그룹 전략 창', how: 'gsw', diff: { 'chase/maxFollow': { from: 2, to: 4 } } }, { at: '2026-11-19T02:00:00Z', by: 'a@b.c', what: '🎚 그룹 전략 창', how: 'gsw-undo', diff: { 'chase/maxFollow': { from: 4, to: 2 } } }, { on: true, at: '2026-11-18T00:00:00Z' }];
  const g = { id: 'g1', name: '그룹1', watch: { on: true, chase: { name: 'follow', maxFollow: 4 } }, watchLog }; const P = { gid: 'g1', fid: 'f1', base: g.watch, draft: g.watch };
  const S2 = { prBatches: [g], prDec: new Map([['aladin_1', { dry: { at: '2026-11-19T02:10:00Z', gid: 'g1', since: '2026-11-19', mode: 'dry', from: 10000, want: 9000, to: 9000, delta: -1000, would: 'pending', why: ['🌓 셈만 — 바꿨다면 10,000 → 9,000원 · 결정 대기'] } }], ['aladin_2', { dry: { at: '2026-11-19T02:10:00Z', gid: 'g1', from: 5000, to: 5000, delta: 0, would: 'none', why: [] } }], ['aladin_3', { dry: { at: 'x', gid: 'other', from: 1, to: 1, delta: 0, would: 'auto', why: [] } }]]), plist: new Map(), prCfg: {} };
  const T2 = mk({ S: S2 }); const h = T2.E.gswLogHtml(P, g); ok(/data-gswundo="0"/.test(h) && /data-gswundo="1"/.test(h) && !/data-gswundo="2"/.test(h), '되돌리기 단추는 diff 있는 줄에만');
  ok(h.indexOf('data-gswundo="1"') < h.indexOf('data-gswundo="0"'), '새 기록이 위'); ok(/셈만/.test(h) && /결정 대기/.test(h), '셈만 기록 구역이 보임'); ok(/되돌리기/.test(h), '「이때로 되돌리기」 글');
  const d = T2.E.gswDryOf('g1'); ok(d.n === 2 && d.pending === 1 && d.none === 1 && d.auto === 0, '이 그룹의 셈만 기록만 셈(다른 그룹 것 안 셈): ' + JSON.stringify([d.n, d.pending, d.none, d.auto]));
  const P2 = { ...P, draft: { ...g.watch, apply: 'auto' } }; ok(!/data-gswundo="0"/.test(T2.E.gswLogHtml(P2, g)), '고치던 값이 있으면 되돌리기 단추를 막음'); }

/* ⑥ 미리 보기 전체 돌리기 — 읽기만 · Firestore 0 */
(async () => {
  const members = FACTS.map((f) => f.l); const decs = new Map(FACTS.filter((f) => f.dec).map((f) => [f.k, f.dec])); const xs = new Map(FACTS.map((f) => [f.l.usedCode, f.x]));
  const g = { id: 'g1', name: '그룹1', cond: {}, watch: { on: true, mode: 'auto', apply: 'approve', chase: { name: 'yield' } } };
  const T3 = mk({ S: { prBatches: [g], prDec: decs }, ctx: { bkfMembers: () => ({ rows: members, keys: FACTS.map((f) => f.k), out: new Set() }), batchCompute: (c, rows) => rows.map((l) => ({ l, ...xs.get(l.usedCode) })) } });
  const P = { fid: 'f1', gid: 'g1', base: g.watch, draft: { ...g.watch, chase: { name: 'match' } }, auto: false, band: null, busy: false }; T3.S._gsw = P;
  const before = JSON.stringify(T3.S.prBatches); await T3.E.gswPvRun(P);
  ok(P.pv && P.pv.rows.length === 12 && P.pv.done, '12개 모두 셈'); ok(calls.db === 0, 'Firestore를 한 번도 안 부름'); ok(JSON.stringify(T3.S.prBatches) === before, '그룹·값을 안 바꿈(읽고 셈만)');
  ok(P.pv.sum.dn >= 1, '요약에 내려감이 보임'); const html = T3.E.gswPvHtml(P, g); ok(/셈으로 본 값이며 실제 팔림·실제 판정과 다를 수 있음/.test(html), '「셈으로 본 값」 안내'); ok(/관계 기록 기준/.test(html), '추격자 판정은 관계 기록 기준 안내'); ok(/시장 자료/.test(html), '시장 자료 나이 줄');
  ok(/data-gswwi="5"/.test(html) && /data-gswwi="10"/.test(html) && /data-gswwi="20"/.test(html), '5·10·20% 단추');
  // 큰 그룹은 저절로 다시 셈하지 않고 「다시」 단추
  const big = Array.from({ length: 450 }, (_, i) => F(100 + i, 10000, 10000, { chaser: ch(9000), floor: 0, start: 10000 })); const xs2 = new Map(big.map((f) => [f.l.usedCode, f.x])); const decs2 = new Map(big.map((f) => [f.k, f.dec]));
  const T4 = mk({ S: { prBatches: [g], prDec: decs2 }, ctx: { bkfMembers: () => ({ rows: big.map((f) => f.l), keys: big.map((f) => f.k), out: new Set() }), batchCompute: (c, rows) => rows.map((l) => ({ l, ...xs2.get(l.usedCode) })) } });
  const P4 = { fid: 'f1', gid: 'g1', base: g.watch, draft: { ...g.watch }, band: null }; T4.S._gsw = P4; await T4.E.gswPvRun(P4); ok(P4.pv.rows.length === 450 && P4.pv.total === 450, '450개도 덩어리로 끝까지 셈'); P4.draft = { ...g.watch, chase: { name: 'match' } }; const h4 = T4.E.gswPvHtml(P4, g);
  ok(/data-gswpv="again"/.test(T4.E.gswPvHtml({ ...P4, pv: { ...P4.pv, stale: true } }, g)), '300개 넘는 그룹은 「다시」 단추'); void h4;
  console.log(bad ? `❌ tGSW2 실패 ${bad}/${n}` : `✅ tGSW2 통과 ${n}건`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 예외', e && e.stack); process.exit(1); });
