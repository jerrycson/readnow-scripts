// tCTRLIMP2_TA — (ctrlimp2 · 설계 CTRLDES2 1.3·1.4(라)·1.6·3.1-1·2·5·6·8 · 정범님 I-1118-2344-32) 🗼 묶음 관제창 판 타 — 📁 묶음 감시·전략 띠
//  ① 모두 켜기(기본 keep): 이미 감시 중·그룹 개별 칸은 안 바뀜 · 빈 칸만 묶음 기본 · 보기 전용·보관 그룹은 건드리지 않음 · 실험 한도 · 반자동 조건 묶음 없으면 안 켬
//  ② 덮기(over)는 그룹 칸도 묶음 기본으로 · 그룹 개별 추격자를 비움(📁 묶음 기본을 따름)
//  ③ 되돌리기 뒤 그룹 감시 칸 = 켜기 전과 같음(없던 칸은 지움) · 그 뒤 다른 곳에서 바뀐 그룹은 그대로
//  ④ 저장 자리 _bkfold ctl[fid] — 옛 판 bkfNorm이 folds를 다시 써도 안 지워짐 · 웹앱 wgStratExt·가격 감시기 stratPick가 ctl을 먼저 읽음
//  ⑤ 화면: 띠 자리·두 번 누르기·설명서 문단
// 실행: node tCTRLIMP2_TA.js · 시험 자료에 손님·판매자 실명 없음 · 실제 가격 바꾸기·확정 실행·Firestore 쓰기 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const DIR = path.dirname(APP);
const find = (n) => [path.join(DIR, n), path.join(DIR, 'pw', n), path.resolve(__dirname, '..', n), path.resolve(__dirname, '..', '..', n), path.resolve(__dirname, '..', '..', 'src', n)].find((x) => fs.existsSync(x));
const fnSrc = (src, name) => { const i = src.indexOf(`function ${name}(`); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; } return src.slice(i, j + 1); };
const line = (re) => { const m = T.split('\n').find((l) => re.test(l)); return m || ''; };
const ctx = { S: {}, console, JSON, Math, Object, Array, String, Number, Set, Map, Date, Infinity };
vm.createContext(ctx);
const code = [line(/^const BKF_MAXF = /), line(/^const BKC_LOG = /), line(/^const bkfJs = /), 'bkcNorm', 'bkcOf', 'bkcPlan', 'bkcUndoPlan', 'bkfNorm', 'wgStratExt'].map((n) => (/^(const|function)/.test(n) ? n : fnSrc(T, n))).join('\n');
ok(['bkcNorm', 'bkcOf', 'bkcPlan', 'bkcUndoPlan', 'bkcHtml', 'bkcPaint', 'bkcSave'].every((n) => fnSrc(T, n)), '판 타 함수 일곱 모두 있음');
vm.runInContext(code + '\nthis.F = { bkcNorm, bkcOf, bkcPlan, bkcUndoPlan, bkfNorm, wgStratExt, bkfJs };', ctx);
const { bkcNorm, bkcPlan, bkcUndoPlan, bkfNorm, wgStratExt, bkfJs } = ctx.F;
const clone = (o) => JSON.parse(JSON.stringify(o));

console.log('① 모두 켜기 — 기본(개별 설정 없는 그룹에만)');
const def = bkcNorm({ def: { chase: 'match', watch: { mode: 'auto', apply: 'auto', guardPct: 12 } } }).def;
ok(def.chase.name === 'match' && def.watch.apply === 'auto' && def.watch.guardPct === 12 && def.watch.mode === 'auto', '묶음 기본 정리(글자 추격자 → {name})', def);
ok(bkcNorm({ def: { watch: { guardPct: 99, mode: 'semi' } } }).def.watch.guardPct === 15 && bkcNorm({ def: { watch: { mode: 'semi' } } }).def.watch.mode === 'auto', '한도 1~50 밖 = 15 · 조건 묶음 없는 반자동 = 자동');
const mk = () => [
  { id: 'gOn', name: '켜진 그룹', watch: { on: true, mode: 'semi', presetId: 'p1', apply: 'approve', guardPct: 20, chase: { name: 'second' }, since: '2026-11-01T00:00:00Z', by: 'a@x' }, decided: { a: 1, b: 1 } },
  { id: 'gOff', name: '꺼진 그룹', watch: { on: false, mode: 'auto', apply: 'approve', guardPct: 25, chase: { name: 'yield' }, since: '2026-11-02T00:00:00Z', by: 'a@x' }, decided: { c: 1 } },
  { id: 'gNew', name: '새 그룹', decided: { d: 1, e: 1, f: 1 } },
  { id: 'gView', name: '보기 전용', viewOnly: true, decided: { g: 1 } },
  { id: 'gArch', name: '보관', archived: true, watch: { on: false, apply: 'approve' }, decided: {} },
];
const O = { presets: { p1: { name: '조건1' } }, act: 1000, xm: 20, others: 0, now: '2026-11-19T00:00:00Z', by: 'b@x' };
const G0 = mk(); const P = bkcPlan(G0, def, 'keep', O); const at = (id) => P.find((x) => x.id === id);
ok(at('gOn').act === 'keep' && !at('gOn').next, '이미 감시 중인 그룹은 그대로', at('gOn'));
ok(at('gView').act === 'skip' && at('gArch').act === 'skip', '보기 전용·보관 그룹은 건드리지 않음', [at('gView'), at('gArch')]);
{ const n = at('gOff').next; ok(at('gOff').act === 'on' && n.on && n.apply === 'approve' && n.guardPct === 25 && n.chase.name === 'yield' && n.since === '2026-11-02T00:00:00Z' && n.mode === 'auto', '꺼진 그룹은 그 그룹이 가진 칸(반영·한도·추격자·시작 시각)을 지키고 켬', n); ok(at('gOff').enroll === true && at('gOff').fresh === false, '꺼진 그룹: 붙이기는 그룹 카드와 같게 · 되돌릴 때 빼지는 않음(전에 감시함)'); }
{ const n = at('gNew').next; ok(at('gNew').act === 'on' && n.apply === 'auto' && n.guardPct === 12 && n.chase === null && n.mode === 'auto' && n.since === O.now && n.by === 'b@x', '감시 칸 없는 그룹은 묶음 기본 · 그룹 추격자는 비움(📁 묶음 기본을 씀)', n); ok(at('gNew').enroll && at('gNew').fresh, '새 그룹은 붙이고 되돌릴 때 뺌'); }
ok(bkfJs(G0) === bkfJs(mk()), '계획만으로는 그룹 자료가 안 바뀜(쓰기 없음)');
{ const P2 = bkcPlan(mk(), def, 'keep', { ...O, act: 20, xm: 20 }); /* 한도 4개 · 켜진 그룹 2 + 꺼진 1 = 3 · 새 3 → 넘음 */ ok(P2.find((x) => x.id === 'gOff').act === 'on' && P2.find((x) => x.id === 'gNew').act === 'skip' && /실험 한도/.test(P2.find((x) => x.id === 'gNew').why), '실험 한도를 넘는 그룹은 켜지 않음', P2); }
{ const d2 = bkcNorm({ def: { watch: { mode: 'semi', presetId: 'none' } } }).def; const P3 = bkcPlan([{ id: 'gNew', decided: {} }], d2, 'keep', O); ok(P3[0].act === 'skip' && /조건 묶음/.test(P3[0].why), '반자동 조건 묶음이 없으면 켜지 않음', P3); }

console.log('② 덮기');
{ const P4 = bkcPlan(mk(), def, 'over', O); const a = (id) => P4.find((x) => x.id === id);
  ok(a('gOn').act === 'on' && a('gOn').next.mode === 'auto' && a('gOn').next.presetId === null && a('gOn').next.apply === 'auto' && a('gOn').next.guardPct === 12 && a('gOn').next.chase === null && a('gOn').next.since === '2026-11-01T00:00:00Z' && a('gOn').enroll === false, '덮기: 켜진 그룹도 묶음 기본으로 · 시작 시각 그대로 · 다시 붙이지 않음', a('gOn'));
  ok(a('gOff').next.apply === 'auto' && a('gOff').next.chase === null, '덮기: 꺼진 그룹 칸도 묶음 기본', a('gOff').next);
  ok(a('gView').act === 'skip' && a('gArch').act === 'skip', '덮기도 보기 전용·보관은 건드리지 않음'); }

console.log('③ 되돌리기');
const applyOn = (gs, plan) => { const last = { at: O.now, by: 'b@x', how: 'keep', gs: [] }; for (const x of plan.filter((y) => y.act === 'on')) { const g = gs.find((y) => y.id === x.id); g.watch = clone(x.next); last.gs.push({ id: x.id, before: x.before, after: x.next, enrolled: !!(x.enroll && x.fresh) }); } return bkcNorm({ last }).last; };
const applyUndo = (gs, plan) => { for (const x of plan.filter((y) => y.act === 'undo')) { const g = gs.find((y) => y.id === x.id); if (x.to) g.watch = clone(x.to); else delete g.watch; } };
for (const how of ['keep', 'over']) { const G = mk(); const before = clone(G); const L = applyOn(G, bkcPlan(G, def, how, O)); ok(bkfJs(G) !== bkfJs(before), `${how}: 켜면 그룹 자료가 바뀜`); const U = bkcUndoPlan(L, G); applyUndo(G, U);
  ok(bkfJs(G) === bkfJs(before), `${how}: 되돌리기 뒤 그룹 자료가 켜기 전과 한 글자도 같음(없던 감시 칸은 지움)`, { G, before });
  ok(U.filter((x) => x.unenroll).map((x) => x.id).join() === 'gNew', `${how}: 감시에서 빼는 것은 처음 켠 그룹만`, U); }
{ const G = mk(); const L = applyOn(G, bkcPlan(G, def, 'keep', O)); G.find((g) => g.id === 'gOff').watch.guardPct = 9; /* 켠 뒤 그룹 카드에서 바꿈 */ const U = bkcUndoPlan(L, G); applyUndo(G, U);
  ok(U.find((x) => x.id === 'gOff').act === 'skip' && G.find((g) => g.id === 'gOff').watch.guardPct === 9 && U.find((x) => x.id === 'gNew').act === 'undo' && !G.find((g) => g.id === 'gNew').watch, '켠 뒤 다른 곳에서 바뀐 그룹은 되돌리지 않음 · 나머지는 되돌림', U); }
{ const G = mk(); const L = applyOn(G, bkcPlan(G, def, 'keep', O)); const rev = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.keys(o).reverse().map((k) => [k, rev(o[k])])) : o); const G2 = G.map((g) => ({ ...g, watch: rev(g.watch) })); ok(bkcUndoPlan(L, G2).filter((x) => x.act === 'undo').length === 2, '서버가 칸 차례를 바꿔 돌려줘도 같은 값으로 봄'); }

console.log('④ 저장 자리와 읽기');
{ const doc = { order: ['f:f1'], folds: { f1: { name: '묶음1', gids: ['gA', 'gB'] } }, ctl: { f1: { def: { chase: { name: 'match' } } } } };
  const N = bkfNorm(doc, null); ok(!N.folds.f1.ctrl && doc.ctl.f1, 'bkfNorm(옛 판 포함)은 folds만 다시 씀 — ctl은 맨 위 칸이라 손대지 않음');
  ok(/tx\.update\(ref, \{ \['ctl\.' \+ fid\]: nx/.test(fnSrc(T, 'bkcSave')), '묶음 기본은 ctl.<묶음> 칸만 고침(거래 안)');
  ctx.S.bkfold = doc; ctx.ctrlPerMap = () => ({}); let o = wgStratExt(null, ['gB']); ok(o.fold && o.fold.chase && o.fold.chase.name === 'match' && o.fold.id === 'f1', '웹앱 wgStratExt가 ctl의 묶음 기본을 읽음', o);
  ctx.S.bkfold = { order: ['f:f1'], folds: { f1: { name: '묶음1', gids: ['gA'], ctrl: { def: { chase: 'second' } } } } }; o = wgStratExt(null, ['gA']); ok(o.fold && o.fold.chase.name === 'second', '옛 자리 folds[].ctrl도 읽음', o); }
{ const vN = (t) => ((t.match(/@version\s+([\d.]+)/) || [])[1] || '0').split('.').map(Number).reduce((a, x) => a * 1000 + x, 0); const n = 'readnow-price-watch.user.js'; /* 시험 문지기 자리(pw)엔 옛 감시기 사본이 있을 수 있어 — 찾은 것 중 가장 새 판 */ const PW = [path.join(DIR, n), path.join(DIR, 'pw', n), path.resolve(__dirname, '..', n), path.resolve(__dirname, '..', '..', n), path.resolve(__dirname, n), path.resolve(process.cwd(), n), path.resolve(process.cwd(), '..', n)].filter((x) => fs.existsSync(x)).map((x) => fs.readFileSync(x, 'utf8')).sort((a, b) => vN(b) - vN(a))[0] || ''; ok(/\(BKF\.ctl \|\| \{\}\)\[fid\] \|\| f\.ctrl/.test(PW), '가격 감시기 stratPick도 ctl을 먼저 읽음'); const v = (PW.match(/@version\s+([\d.]+)/) || [])[1]; ok(v && v.split('.').map(Number).reduce((a, x) => a * 1000 + x, 0) >= 10061, '가격 감시기 0.10.61 이상', v); }
ok(/ext && \(ext\.k \|\| ext\.fold\)/.test(fnSrc(T, 'wgStratOf')), 'wgStratOf가 상품 없이 📁 묶음 기본·주인 그룹을 셈(ext.fold)');

console.log('⑤ 화면');
{ const P = fnSrc(T, 'bkfPaint'); ok(/<div id="bkf_ctl"><\/div>/.test(P) && /bkcPaint\(fid\)/.test(P), '묶음 화면에 🛰 감시 · 🎯 전략 띠 자리'); const B = fnSrc(T, 'bkcPaint');
  ok((B.match(/twiceArm\(/g) || []).length >= 4, '덮기 미리 보기·묶음 기본 바꾸기·켜기·되돌리기 모두 두 번 누르기', (B.match(/twiceArm\(/g) || []).length);
  ok(!/\b(alert|confirm|prompt)\(/.test(B + fnSrc(T, 'bkcHtml')), '브라우저 팝업 없음');
  ok(/bkcPlan\(bkcGs\(fid\), bkcOf\(fid\)\.def, pv\.how, ctx\(\)\)/.test(B) && /그사이 그룹 설정이 바뀌어/.test(B), '켜기 직전에 계획을 다시 세어 미리 보기와 다르면 멈춤');
  ok(/watchEnroll\(x\.id, bkfSt\(g\)\)/.test(B) && /watchUnenroll\(x\.id\)/.test(B) && /FV\.delete\(\)/.test(B), '켤 때 붙이기 · 되돌릴 때 빼기·칸 지우기(그룹 카드와 같은 함수)');
  ok(/이미 바뀐 값은/.test(B), '되돌리기 = 설정만이라고 알림');
  ok(/\(판 타\)<\/b>/.test(T) && /모두 켜기/.test(T.slice(T.indexOf('(판 타)</b>') - 200, T.indexOf('(판 타)</b>') + 2000)), '설명서 🗼 묶음 관제창에 판 타 문단'); }

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
