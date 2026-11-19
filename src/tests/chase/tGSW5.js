// tGSW5 — 🎚 그룹 전략 창 판 ⑤: 📐 한도 · ⏱ 때 · 🧩 조건별 규칙 · 🪜 시간 사다리 · ↩ 되돌림 (정범님 11/19 I-1119-1304-10 · 일꾼 strat6 · 설계 STRAT_DESIGN_1119 2.3~2.11) 시험
// 실행: node src/tests/chase/tGSW5.js [판정 엔진 파일 경로]
//  ① 칸 그림은 엔진 표(RULE_INFO)에서 나옴 ② 화면이 만든 규칙은 ruleNorm을 지나도 그대로 ③ 멈춤 조건마다 「적용」이 꺼짐(매입가 배수 0.9 등) ④ 조건별 규칙 줄 순서 바꾸기·지우기
//  ⑤ 미리 보기의 걸림·값 = 엔진 judgeRule 값 · 「경쟁 2개 이하 → 값 유지」 줄이 상품을 「그대로」로 옮기고 까닭을 보임 ⑥ 사다리 예시·바닥 막대·좁은 화면 카드 ⑦ Firestore 읽기·쓰기 0
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const PR = require(process.argv[2] || firstOf([path.join(__dirname, '../../../readnow-pricing-core.js'), path.join(__dirname, '../../readnow-pricing-core.js')])); const CH = PR.Chase;
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const BLK = cut('/* ◆gsw 시작', '/* ◆gsw 끝 */'); const JIN = cut('function ctrlJudgeIn(', 'function ctrlPeek('); const WGS = cut('function wgStratOf(', 'const wgSrcTag');
const BKFJS = APP.split('\n').find((l) => l.startsWith('const bkfJs = '));
ok(!!BLK && !!JIN && !!WGS && !!BKFJS, '원본에서 시험할 조각을 찾음'); ok(!/\b(alert|confirm|prompt)\(/.test(BLK), '창 블록에 브라우저 팝업 없음');
const FN = ['gswLimHtml', 'gswTimeHtml', 'gswWhenHtml', 'gswWhenRow', 'gswWhenAdd', 'gswWhenMove', 'gswWhenDel', 'gswLadHtml', 'gswBackHtml', 'gswFloorBar', 'gswCheckHtml', 'gswRuleCheck', 'gswRuleEff', 'gswRuleFacts', 'gswLadEx'];
for (const f of FN) ok(new RegExp('function ' + f + '\\(').test(BLK), '함수 ' + f + ' 있음');
ok(!!CH.ruleCheck && !!CH.judgeRule && !!CH.RULE_INFO && !!CH.WHEN_K, '판정 엔진에 규칙 층이 내보내짐(0.17.24+)');

const calls = { db: 0 };
function mk(over) {
  const S = { prBatches: [], prCfg: {}, user: { email: 'x@y.z' }, prDec: new Map(), plist: new Map(), pmatch: new Map(), pmetrics: new Map(), ...(over && over.S) }; const html = { v: '' }; const ov = { querySelector: () => null, set innerHTML(x) { html.v = x; }, get innerHTML() { return html.v; } };
  const db = new Proxy({}, { get: () => { calls.db++; throw new Error('Firestore를 부름'); } });
  const ctx = { console, S, db, setTimeout, clearTimeout, firebase: { firestore: { FieldValue: { delete: () => ({ __del: 1 }), arrayUnion: (x) => ({ __union: x }) } } }, window: { ReadnowChase: CH, ReadnowPricing: PR }, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: (id) => (id === 'gsw_ov' ? ov : null), createElement: () => ({}) },
    presetsOf: () => S.prCfg.presets || {}, wgStratExt: () => ({}), bkcPaint: () => {}, bkfDirty: () => {}, batchIsOn: () => true, bkfSt: (g) => g, bkfCond: (g) => g.cond || {}, bkcOf: () => ({ def: { rule: S._fold || {} } }), esc: (s) => String(s ?? ''), num: (v) => String(v), won: (v) => (v == null ? '-' : v + '원'), kTime: (s) => String(s || '').slice(5, 16), twiceArm: () => 'go', toast: () => {}, errKo: (e) => String(e), TS: () => 0, slObsCfg: () => ({ fastLagMin: 60 }), ...(over && over.ctx) };
  vm.createContext(ctx); const names = [...FN, 'gswPvOne', 'gswPvRow', 'gswPvSum', 'gswPvHtml', 'gswChange', 'gswClick', 'gswPrep', 'gswPaint', 'gswPvRun', 'ctrlJudgeIn'].filter((f) => new RegExp('function ' + f + '\\(').test(BLK + JIN));
  vm.runInContext(`${BKFJS}\n${BLK}\n${JIN}\n${WGS}\nglobalThis.E = { ${names.join(', ')} };`, ctx); return { E: ctx.E, S, html, ctx };
}
const NOOP = { setTimeout: () => 0 };
const g0 = () => ({ id: 'g1', name: '그룹1', watch: { on: true, mode: 'auto', apply: 'approve', since: '2026-11-01T00:00:00Z' } });
function open(over) { const T = mk({ ...over, ctx: { ...NOOP, ...((over && over.ctx) || {}) } }); const g = g0(); T.S.prBatches = [g]; const P = { fid: 'f1', gid: 'g1', base: JSON.parse(JSON.stringify(g.watch)), draft: JSON.parse(JSON.stringify(g.watch)), auto: false, band: null, busy: false }; T.S._gsw = P; return { ...T, P, g }; }
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const ev = (T, attr, v, extra) => T.E.gswChange({ target: { dataset: { [attr]: extra }, value: v, checked: v === true } });
const norm = (o) => JSON.parse(JSON.stringify(o));

/* ① 칸 그림 = 엔진 표 */
{ const T = open(); const D = T.P.draft;
  const lim = T.E.gswLimHtml(D, 'f1', ''), tm = T.E.gswTimeHtml(D, 'f1', ''), bk = T.E.gswBackHtml(D, 'f1', '');
  const want = { lim: ['floor.costMult', 'floor.listPct', 'floor.minProfit', 'floor.minPrice', 'ceil.listPct', 'ceil.newPct', 'step.downPct', 'step.upPct', 'maxDropPct'], tm: ['time.hours', 'time.restH', 'time.dayMax', 'time.minGapPct'], bk: ['back.goneH', 'back.to', 'back.stepPct'] };
  for (const [h, ps] of [[lim, want.lim], [tm, want.tm], [bk, want.bk]]) for (const p of ps) { ok(h.includes('data-gswr="' + p + '"'), '칸이 그려짐 ' + p); ok(h.includes(CH.RULE_INFO[p][0]), '칸 이름이 엔진 표에서 나옴 ' + p); }
  ok(/📐 한도/.test(lim) && /⏱ 때/.test(tm) && /↩/.test(bk), '구역 이름'); ok(/min="1"/.test(lim.slice(lim.indexOf('floor.costMult'), lim.indexOf('floor.costMult') + 400)), '매입가 배수 칸은 1 아래로 못 넣게 min=1');
  T.S._fold = { floor: { minPrice: 1500 } }; const lim2 = T.E.gswLimHtml(D, 'f1', ''); ok(/placeholder="1500"/.test(lim2) && /묶음 기본/.test(lim2), '📁 묶음 기본에서 물려받은 값이 흐리게 보임'); T.S._fold = null; }

/* ② 화면이 만든 규칙은 ruleNorm을 지나도 그대로 · 적용 길도 막힘 없음 */
{ const T = open(); const P = T.P;
  ev(T, 'gswr', '1.2', 'floor.costMult'); ev(T, 'gswr', '500', 'floor.minProfit'); ev(T, 'gswr', '1500', 'floor.minPrice'); ev(T, 'gswr', '130', 'ceil.listPct'); ev(T, 'gswr', '15', 'step.downPct'); ev(T, 'gswr', '25', 'maxDropPct');
  ev(T, 'gswr', '9-22', 'time.hours'); ev(T, 'gswr', '2', 'time.restH'); ev(T, 'gswr', '3', 'time.dayMax'); ev(T, 'gswr', '1', 'time.minGapPct'); ev(T, 'gswr', '24', 'back.goneH'); ev(T, 'gswr', 'base', 'back.to'); ev(T, 'gswr', '10', 'back.stepPct');
  ok(T.E.gswWhenAdd(P) && T.E.gswWhenAdd(P), '규칙 줄 두 개 더함'); ev(T, 'gsww', '30', '1:v'); ev(T, 'gsww', 'days', '1:k'); ev(T, 'gsww', '>=', '1:op'); ev(T, 'gsww', 'strat', '1:act'); ev(T, 'gsww', 'match', '1:strat'); ev(T, 'gsww', '30', '1:v');
  T.E.gswClick({ target: { closest: (s) => (s === 'button' ? { dataset: { gswlad: 'ex' }, disabled: false } : null) } });
  const R = P.draft.rule; ok(!!R && R.when.length === 2 && R.ladder.length === 4, '화면이 만든 규칙: 조건별 규칙 2줄 · 사다리 4단');
  ok(canon(CH.ruleNorm(R)) === canon(R), '화면이 만든 규칙은 ruleNorm을 지나도 그대로'); const rc = CH.ruleCheck(R, { apply: 'approve' }); ok(!rc.stop.length, '엔진 검사에 막히는 것 없음: ' + JSON.stringify(rc.stop));
  ok(R.when[0].k === 'comp' && R.when[0].act === 'hold' && R.when[1].k === 'days' && R.when[1].act === 'strat' && R.when[1].strat === 'match' && R.when[1].v === 30, '줄 0·1 값이 화면 변경대로');
  const pr = T.E.gswPrep(P, T.g); ok(!pr.err && canon(pr.next.rule) === canon(R), '적용 길(gswPrep)이 규칙을 그대로 통과: ' + (pr.err || ''));
  ok(!/disabled>적용|id="gsw_ap"[^>]*disabled/.test((T.E.gswPaint(), T.html.v)) , '막힘 없으면 「적용」 켜짐'); }

/* ③ 멈춤 조건마다 「적용」이 꺼짐 */
{ const mkBad = (label, fn, code) => { const T = open(); fn(T); T.E.gswPaint(); const off = /id="gsw_ap" data-gswact="apply" disabled/.test(T.html.v); const rc = T.E.gswRuleCheck(T.P, T.P.draft, 'yield'); const pr = T.E.gswPrep(T.P, T.g);
    ok(off, `${label}: 「적용」이 꺼짐`); ok(rc.stop.some((s) => s.code === code), `${label}: 멈춤 코드 ${code} — ` + JSON.stringify(rc.stop.map((s) => s.code))); ok(!!pr.err, `${label}: 적용 길도 막음`); ok(new RegExp(String(rc.stop[0] && rc.stop[0].msg).slice(0, 8).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(T.html.v), `${label}: 화면에 까닭이 보임`); };
  mkBad('매입가 배수 0.9', (T) => ev(T, 'gswr', '0.9', 'floor.costMult'), 'costMult'); mkBad('최저 이익 -5', (T) => ev(T, 'gswr', '-5', 'floor.minProfit'), 'minProfit'); mkBad('시간대 25-3', (T) => ev(T, 'gswr', '25-3', 'time.hours'), 'hours');
  mkBad('사다리 날수 순서', (T) => { T.P.draft = { ...T.P.draft, rule: { ladder: [{ afterD: 30, strat: 'yield' }, { afterD: 14, strat: 'follow' }] } }; }, 'ladderOrder'); mkBad('사다리 모르는 전략', (T) => { T.P.draft = { ...T.P.draft, rule: { ladder: [{ afterD: 0, strat: 'zzz' }] } }; }, 'ladderStrat');
  mkBad('규칙 줄 모르는 전략', (T) => { T.P.draft = { ...T.P.draft, rule: { when: [{ id: 'a', k: 'comp', op: '<=', v: 2, act: 'strat', strat: 'zzz' }] } }; }, 'whenBad'); mkBad('바닥 배수 올림 0.5', (T) => { T.P.draft = { ...T.P.draft, rule: { when: [{ id: 'a', k: 'comp', op: '<=', v: 2, act: 'floorUp', mult: 0.5 }] } }; }, 'whenBad');
  mkBad('규칙 9줄', (T) => { T.P.draft = { ...T.P.draft, rule: { when: Array.from({ length: 9 }, (_, i) => ({ id: 'a' + i, k: 'comp', op: '<=', v: 2, act: 'hold' })) } }; }, 'whenMax'); mkBad('사다리 6단', (T) => { T.P.draft = { ...T.P.draft, rule: { ladder: Array.from({ length: 6 }, (_, i) => ({ afterD: i * 10, strat: 'yield' })) } }; }, 'ladderMax');
  mkBad('바로 반영인데 미리 보기 안 돌림', (T) => { T.P.draft = { ...T.P.draft, apply: 'auto', guardPct: 15, rule: { time: { dayMax: 2 } } }; T.P.pv = null; }, 'noPreview');
  const T = open(); ev(T, 'gswr', '1.2', 'floor.costMult'); ev(T, 'gswr', '1', 'time.dayMax'); T.P.draft = { ...T.P.draft, rule: { ...T.P.draft.rule, time: { dayMax: 8 } } }; ok(T.E.gswRuleCheck(T.P, T.P.draft, 'yield').warn.some((w) => w.code === 'dayMax'), '하루 8번은 알림(⚠)만'); T.E.gswPaint(); ok(!/id="gsw_ap" data-gswact="apply" disabled/.test(T.html.v) && /⚠/.test(T.html.v), '알림은 「적용」을 막지 않음');
  const T2 = open(); T2.E.gswPaint(); ok(/id="gsw_ap" data-gswact="apply" disabled/.test(T2.html.v), '바뀐 것 없으면 「적용」 꺼짐(그대로)'); }

/* ④ 조건별 규칙 줄 순서 바꾸기·지우기 */
{ const T = open(); const P = T.P; for (let i = 0; i < 3; i++) T.E.gswWhenAdd(P); const ids = () => P.draft.rule.when.map((x) => x.id); const a = ids(); ok(new Set(a).size === 3, '줄마다 다른 번호표(id)');
  T.E.gswWhenMove(P, 2, -1); ok(JSON.stringify(ids()) === JSON.stringify([a[0], a[2], a[1]]), '아래 줄을 위로'); T.E.gswWhenMove(P, 0, -1); ok(JSON.stringify(ids()) === JSON.stringify([a[0], a[2], a[1]]), '맨 위 줄을 더 위로는 안 움직임');
  T.E.gswWhenMove(P, 0, 1); ok(JSON.stringify(ids()) === JSON.stringify([a[2], a[0], a[1]]), '위 줄을 아래로'); T.E.gswWhenDel(P, 1); ok(JSON.stringify(ids()) === JSON.stringify([a[2], a[1]]), '한 줄 지움'); T.E.gswWhenDel(P, 0); T.E.gswWhenDel(P, 0); ok(P.draft.rule === undefined, '줄을 다 지우면 규칙 칸도 사라짐');
  for (let i = 0; i < 8; i++) T.E.gswWhenAdd(P); ok(P.draft.rule.when.length === 8 && T.E.gswWhenAdd(P) === false && P.draft.rule.when.length === 8, '8줄에서 더 못 더함');
  const row = T.E.gswWhenRow({ id: 'x', k: 'comp', op: '<=', v: 2, act: 'hold' }, 0, 3, ''); ok(/data-gswwm="0:1"/.test(row) && /data-gswwd="0"/.test(row) && /data-gswwm="0:-1"[^>]*disabled/.test(row), '줄 단추(위·아래·지움) — 첫 줄은 위로 꺼짐'); ok(/경쟁 매물 수/.test(row) && /이하/.test(row) && /값 유지/.test(row), '줄이 쉬운 말로 읽힘'); }

/* ⑤ 미리 보기 = 엔진 judgeRule */
{ const ch = (p) => ({ sellerCode: 'SA', name: '판매자A', price: p, grade: 'A', rank: 1 }); const row = (c, g) => ({ r: 1, sc: 'S' + c, g: g || 'A', p: 9000, c: 'unknown' });
  const F = (i, cur, chp, comp, over) => ({ k: 'aladin_' + (2000 + i), l: { id: 'L' + i, usedCode: 2000 + i, bookId: 'B' + i, title: '책' + i, price: cur, grade: 'A', priceList: 20000 }, x: { target: cur, page1: Array.from({ length: comp }, (_, j) => row(j)), tier: null }, dec: { chaser: ch(chp), floor: 0, start: cur }, ...over });
  const FS = [F(1, 10000, 9000, 1), F(2, 10000, 9000, 2), F(3, 10000, 9000, 3), F(4, 10000, 9000, 5)];
  const S = { pmatch: new Map(FS.map((f, i) => [f.l.id, { kind: 'x', cost: 7000 }])) }; const T = open({ S }); const g = T.g; const W = { ...g.watch, chase: { name: 'match' } };
  const o = (draft) => ({ g, saved: W, draft, fid: 'f1', nowIso: '2026-11-19T03:00:00Z', c: {} });
  const base = FS.map((f) => T.E.gswPvRow(f, o(W))); ok(base.every((r) => r.b.to < 10000), '규칙 없을 때 4권 모두 내려감(동가)'); ok(base.every((r) => !r.b.rl.length), '규칙 없으면 걸린 규칙 칸이 비어 있음');
  const D = { ...W, rule: { when: [{ id: 'w1', k: 'comp', op: '<=', v: 2, act: 'hold', note: '경쟁이 적으면 그대로' }] } }; const rows = FS.map((f) => T.E.gswPvRow(f, o(D)));
  ok(rows[0].b.to === 10000 && rows[1].b.to === 10000, '경쟁 2개 이하 상품 둘은 「그대로」(값 유지)'); ok(rows[2].b.to < 10000 && rows[3].b.to < 10000, '경쟁 3개 이상은 그대로 내려감'); ok(rows[0].b.to === 10000 && rows[0].a.to < 10000, '저장된 값이면 내려갔을 것(a)과 다르게 보임');
  ok(/조건별 규칙 1번째 줄/.test(rows[0].b.rl[0] || '') && /값 유지/.test(rows[0].b.rl[0]), '걸린 규칙 까닭: ' + rows[0].b.rl[0]); ok(!rows[2].b.rl.some((s) => /조건별 규칙 1번째/.test(s)), '안 걸린 상품엔 그 줄이 없음');
  const s = T.E.gswPvSum(rows, D); ok(s.same === 2 && s.dn === 2 && s.rule === 2, `요약: 그대로 ${s.same} · 내려감 ${s.dn} · 규칙이 걸린 상품 ${s.rule}`);
  /* 엔진과 같은 값 — 같은 입력으로 judgeRule을 직접 */
  let same = 0; for (let i = 0; i < FS.length; i++) { const f = FS[i]; const gs = CH.stratFor({ global: null, groups: [{ id: 'g1', name: 'g1', chase: W.chase }] }); const In0 = T.E.ctrlJudgeIn(f.x, f.l, f.dec, gs, { nowIso: '2026-11-19T03:00:00Z' }); const In = { ...In0, rule: D.rule, facts: T.E.gswRuleFacts(f, o(D), In0) }; const r = CH.judgeRule(In); const want = r.t != null ? r.t : 10000; if (want === rows[i].b.to) same++; } ok(same === 4, '미리 보기 값 = 엔진 judgeRule 값 4/4: ' + same);
  /* 바닥 — 매입가 배수 */
  const D2 = { ...W, rule: { floor: { costMult: 1.3 } } }; const r2 = FS.map((f) => T.E.gswPvRow(f, o(D2))); ok(r2.every((r) => r.b.to >= 9100), '매입가 7000 × 1.3 = 9100 아래로 안 내려감: ' + r2.map((r) => r.b.to)); ok(r2.every((r) => r.floorHit), '바닥에 걸림(hit)이 엔진 결과와 같음');
  ok(r2.every((r) => /바닥/.test((r.b.rl || []).join(' '))), '걸린 규칙에 바닥 까닭'); const s2 = T.E.gswPvSum(r2, D2); ok(s2.floor === 4, '요약 「바닥에 걸림」 4'); }

/* ⑥ 바닥 막대 · 사다리 · 좁은 화면 */
{ const T = open(); const mkr = (h, tot) => Array.from({ length: tot }, (_, i) => ({ floorHit: i < h })); const lo = T.E.gswFloorBar(mkr(1, 10)), hi = T.E.gswFloorBar(mkr(4, 10));
  ok(/10%/.test(lo) && !/#B0322A/.test(lo), '바닥 막대 10% — 붉지 않음'); ok(/40%/.test(hi) && /#B0322A/.test(hi) && /많음/.test(hi), '바닥 막대 40% — 붉게 + 「바닥에서 멈추는 상품이 많음」'); ok(T.E.gswFloorBar([]) === '', '상품 없으면 막대 없음');
  const L = T.E.gswLadEx(); ok(L.length === 4 && L[0].afterD === 0 && L[0].strat === 'yield' && L[1].afterD === 14 && L[1].strat === 'follow' && L[1].maxFollow === 1 && L[2].afterD === 30 && L[2].strat === 'match' && L[2].downPct === 10 && L[3].afterD === 60 && L[3].downPct === 15 && L[3].approve === true, '예시 사다리 = 설계대로 4단');
  ok(!CH.ruleCheck({ ladder: L }, {}).stop.length && CH.ladderPick(L, 20).strat === 'follow' && CH.ladderPick(L, 13).strat === 'yield', '예시가 엔진 검사를 통과하고 13일·14일 경계가 맞음');
  const h0 = T.E.gswLadHtml(T.P.draft, 'f1', ''); ok(/data-gswlad="ex"/.test(h0) && /예시 넣기/.test(h0), '사다리가 비면 「예시 넣기」 단추'); T.P.draft = { ...T.P.draft, rule: { ladder: L } }; const h1 = T.E.gswLadHtml(T.P.draft, 'f1', ''); ok((h1.match(/data-gswl="\d:afterD"/g) || []).length === 4 && /data-gswld="3"/.test(h1), '네 단이 줄로 그려짐 · 지우기 단추');
  ok(/@media\(max-width:(4\d\d|5\d\d|600)px\)\{[^@]*\.gsw-wr\{display:block/.test(APP), '좁은 화면(390)에서 규칙 줄이 카드로 바뀜(CSS)');
  const html = (T.P.draft = { ...T.P.draft, rule: { when: [{ id: 'a', k: 'comp', op: '<=', v: 2, act: 'hold' }] } }, T.E.gswWhenHtml(T.P.draft, 'f1', '')); ok(/class="gsw-wr/.test(html) && /＋ 규칙 줄 더하기/.test(html), '규칙 구역 그림');
  const cks = T.E.gswCheckHtml({ stop: [{ code: 'a', msg: '막힘글' }], warn: [{ code: 'b', msg: '알림글' }] }); ok(/✖ 막힘글/.test(cks) && /⚠ 알림글/.test(cks), '검사 결과 글'); }

ok(calls.db === 0, 'Firestore를 한 번도 안 부름');
console.log(bad ? `❌ tGSW5 실패 ${bad}/${n}` : `✅ tGSW5 통과 ${n}건`); process.exit(bad ? 1 : 0);
