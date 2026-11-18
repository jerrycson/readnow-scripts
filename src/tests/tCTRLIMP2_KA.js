// tCTRLIMP2_KA — (ctrlimp2 · 설계 CTRLDES2 1.3·4 「카」 · 정범님 I-1118-2344-32 감시 셋 ③) 🗼 묶음 관제창 판 카 — 추격자 전략 층 다섯 겹
//  ① 옛 입력(item·fold 없음) 답이 그대로(고정 사례 · 옛 판 엔진 STRAT_OLD가 있으면 무작위 400개 바이트 비교)
//  ② 새 층: 📌 상품 개별(끔 = 지금 값 유지) > 그룹 > 조건 묶음 > 📁 묶음 기본 > 전체 · 같은 묶음 안 겹침 = 주인 그룹(묶음 차례 맨 앞) · 다른 묶음이면 예전처럼 전체
//  ③ 웹앱 wgStratExt·wgStratOf(진짜 엔진) · ⚙ 이 상품만 따로 창이 STRATS_ALL(객체)로 안 깨짐 · ④ 가격 감시기 stratPick가 item·fold를 넘김
// 실행: node tCTRLIMP2_KA.js · 시험 자료에 손님·판매자 실명 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const DIR = path.dirname(APP);
const find = (n) => [path.join(DIR, n), path.join(DIR, 'pw', n), path.resolve(__dirname, '..', n), path.resolve(__dirname, '..', '..', n), path.resolve(__dirname, '..', '..', 'src', n)].find((x) => fs.existsSync(x));
const PR = require(find('readnow-pricing-core.js')); const CH = PR.Chase; const SF = CH.stratFor;
const fnSrc = (src, name) => { const i = src.indexOf(`function ${name}(`); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; } return src.slice(i, j + 1); };

console.log('① 옛 입력 그대로');
const gl = { name: 'shadow', every: 30 };
const C1 = [
  [{}, 'global', 'yield', null],
  [{ global: gl, groups: [] }, 'global', 'shadow', null],
  [{ global: gl, groups: [{ id: 'a', name: '가', chase: { name: 'match' } }] }, 'group', 'match', 'a'],
  [{ global: gl, groups: [{ id: 'a', name: '가', chase: null, preset: { name: '묶음1', chase: { name: 'second' } } }] }, 'preset', 'second', 'a'],
  [{ global: gl, groups: [{ id: 'a', name: '가' }] }, 'global', 'shadow', 'a'],
  [{ global: gl, groups: [{ id: 'a', name: '가', chase: { name: 'match' } }, { id: 'b', name: '나' }] }, 'global', 'shadow', null],
  [{ global: gl, groups: [{ id: 'a', chase: { name: 'match' } }, { id: 'a' }] }, 'group', 'match', 'a'],
];
C1.forEach(([o, src, nm, gid], i) => { const r = SF(o); ok(r.src === src && r.strat.name === nm && r.gid === gid, `옛 사례 ${i + 1}: ${src}·${nm}`, r); });
{ const OP = process.env.STRAT_OLD && fs.existsSync(process.env.STRAT_OLD) ? process.env.STRAT_OLD : null;
  if (OP) { const OLD = require(OP).Chase.stratFor; let diff = 0, n = 0; let s = 7; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const pick = (a) => a[Math.floor(rnd() * a.length)]; const ST = [null, { name: 'yield' }, { name: 'match', every: 20 }, { name: 'nope' }, { name: 'hold' }, { name: 'second' }];
    for (; n < 400; n++) { const gs = Array.from({ length: Math.floor(rnd() * 4) }, () => ({ id: pick(['a', 'b', 'c', 1]), name: pick([undefined, '가', '나']), chase: pick(ST), preset: rnd() < 0.4 ? { name: pick([undefined, 'P']), chase: pick(ST) } : null }));
      const o = { global: pick(ST), groups: gs }; if (JSON.stringify(OLD(JSON.parse(JSON.stringify(o)))) !== JSON.stringify(SF(JSON.parse(JSON.stringify(o))))) diff++; }
    ok(diff === 0, `옛 판 엔진과 무작위 ${n}개 답이 한 글자도 같음`, diff); }
  else console.log('  · (옛 판 엔진 STRAT_OLD 없음 — 고정 사례만)'); }

console.log('② 새 층');
const g1 = { id: 'g1', name: '그룹1' }, g2 = { id: 'g2', name: '그룹2' }, g3 = { id: 'g3', name: '그룹3', chase: { name: 'second' } };
const F = { id: 'f1', name: '묶음1', gids: ['g2', 'g1', 'g3'], chase: { name: 'match' } };
{ const r = SF({ global: gl, groups: [g3], item: 'off', fold: F }); ok(r.src === 'item' && r.strat.name === 'hold' && r.strat.every === 30 && /지금 값 유지/.test(r.text), '📌 상품 개별 끔 = 지금 값 유지(그룹 개별보다 앞)', r); }
{ const r = SF({ global: gl, groups: [g3], item: { name: 'shadow', every: 5 } }); ok(r.src === 'item' && r.strat.name === 'shadow' && r.strat.every === 5, '📌 상품 개별 전략이 그룹보다 앞', r); }
{ const r = SF({ global: gl, groups: [g3], item: { name: 'nope' }, fold: F }); ok(r.src === 'group' && r.strat.name === 'second', '모르는 상품 개별 전략은 건너뜀 → 그룹 개별', r); }
{ const r = SF({ global: gl, groups: [g1], fold: F }); ok(r.src === 'fold' && r.strat.name === 'match' && r.strat.every === 30 && /묶음 '묶음1' 기본 전략/.test(r.text), '그룹·조건 묶음 없으면 📁 묶음 기본', r); }
{ const r = SF({ global: gl, groups: [{ ...g1, preset: { name: 'P', chase: { name: 'yield' } } }], fold: F }); ok(r.src === 'preset', '조건 묶음이 묶음 기본보다 앞', r); }
{ const r = SF({ global: gl, groups: [g1], fold: { ...F, chase: null } }); ok(r.src === 'global' && r.gid === 'g1', '묶음 기본 전략 없으면 전체', r); }
{ const r = SF({ global: gl, groups: [{ id: 'gx', name: '밖' }], fold: F }); ok(r.src === 'global', '묶음 밖 그룹에는 묶음 기본을 안 씀', r); }
{ const r = SF({ global: gl, groups: [g3, g1], fold: F }); ok(r.gid === 'g1' && r.src === 'fold' && /주인 그룹 '그룹1'/.test(r.text), '같은 묶음 안 겹침 → 묶음 차례 맨 앞 그룹(g2 없음 → g1)', r); }
{ const r = SF({ global: gl, groups: [g3, g2], fold: F }); ok(r.gid === 'g2' && r.src === 'fold', '겹침 주인 = 차례 맨 앞(g2)', r); }
{ const r = SF({ global: gl, groups: [g1, { id: 'gx' }], fold: F }); ok(r.src === 'global' && r.gid === null && /애매/.test(r.text), '다른 묶음과 겹치면 예전처럼 애매 → 전체', r); }
{ const r = SF({ global: gl, groups: [g3, g1], item: 'off', fold: F }); ok(r.src === 'item' && r.gid === 'g1', '상품 개별 + 겹침도 주인 그룹을 적음', r); }

console.log('③ 웹앱');
const E = fnSrc(T, 'wgStratExt'), O = fnSrc(T, 'wgStratOf');
ok(!!E && !!O, 'wgStratExt·wgStratOf 있음');
ok(/wgStratOf\(g0, null, \{ k: x\.key \}\)/.test(T) && /wgStratOf\(g, null, \{ k: it\.k \}\)/.test(T), '결정 카드·관제창 미리 보기가 상품 열쇠를 넘김');
ok(!/\b(alert|confirm|prompt)\s*\(/.test(E + O), '브라우저 창 없음');
{ const ctx = { window: { ReadnowChase: CH }, CH, S: { bkfold: { order: ['f2', 'f1'], folds: { f1: { name: '묶음1', gids: ['g2', 'g1'], ctrl: { def: { chase: 'match' } } }, f2: { name: '묶음2', gids: ['g1'], archived: true } } }, prCfg: { autoChase: gl } },
    ctrlPerMap: () => ({ k1: { chase: 'off' }, k2: { chase: 'shadow' } }), presetsOf: () => ({}), Object, String, Array, JSON };
  vm.createContext(ctx); vm.runInContext(E + '\n' + O + '\n;this.__E = wgStratExt; this.__O = wgStratOf;', ctx);
  const x1 = ctx.__E('k1', ['g1']); ok(x1.item === 'off' && x1.fold && x1.fold.id === 'f1' && x1.fold.chase.name === 'match', '보관된 묶음은 건너뛰고 묶음1·상품 끔', x1);
  const x2 = ctx.__E('k2', ['g9']); ok(x2.item && x2.item.name === 'shadow' && !x2.fold, '묶음 밖 상품은 상품 개별만', x2);
  const r0 = ctx.__O([{ id: 'g1', name: '그룹1', watch: {} }]); const r1 = ctx.__O([{ id: 'g1', name: '그룹1', watch: {} }], null, { k: 'k9' });
  ok(r0 && r1 && r1.src === 'fold' && r0.src === 'global', '상품 열쇠를 주면 📁 묶음 기본까지 봄', [r0 && r0.src, r1 && r1.src]);
  const r2 = ctx.__O([{ id: 'g1', name: '그룹1', watch: {} }], null, { k: 'k1' }); ok(r2 && r2.src === 'item' && r2.strat.name === 'hold', '📌 끔이면 지금 값 유지', r2 && r2.src); }
{ const P = fnSrc(T, 'ctrlPerPanel'); ok(/Array\.isArray\(ST0\) \? ST0\.map/.test(P) && /Object\.entries\(ST0\)/.test(P) && !/STRATS_ALL \|\| \[\]\)\.map/.test(P), '⚙ 이 상품만 따로 창: STRATS_ALL 객체여도 안 깨짐(판 마 고침)'); }
{ const L = (T.match(/const wgSrcTag = [^\n]*/) || [''])[0]; ok(/r\.src === 'item'/.test(L) && /📌 상품 개별/.test(L) && /r\.src === 'fold'/.test(L) && /📁 묶음 기본/.test(L), '꼬리표 📌 상품 개별·📁 묶음 기본'); }
ok(/🧭 전략 층 다섯 겹 \(판 카\)/.test(T), '설명서 문단');

console.log('④ 가격 감시기');
{ const W = fs.readFileSync(find('readnow-price-watch.user.js'), 'utf8'); const SP = fnSrc(W, 'stratPick'); const WL = fnSrc(W, 'wgLoad');
  ok(/stratPick\(wg, pre, prevD, WGm, key\)/.test(W), '판정 자리에서 상품 열쇠를 넘김');
  ok(/doc\('_bkfold'\)/.test(WL) && /doc\('_bkfc'\)/.test(WL) && /5 \* 60000/.test(WL), '묶음·상품 개별 문서를 같은 5분 묶음 안에서 읽음');
  const ver = (W.match(/readnow-pricing-core\.js\?v=([\d.]+)/) || [])[1]; ok(ver === PR.VERSION, '감시기가 새 판정 엔진 판을 부름', [ver, PR.VERSION]);
  const ctx = { PR: { Chase: CH }, SET: { autoChase: gl, presets: {} }, BKF: { order: ['f1'], folds: { f1: { name: '묶음1', gids: ['g1', 'g2'], ctrl: { def: { chase: 'match' } } } } }, BKC: { per: { k1: { chase: 'off' } } }, String, Array, Object };
  vm.createContext(ctx); vm.runInContext(`const presetOf = () => null; const stratOf = () => ({ name: 'yield' });\n${SP}\n;this.__P = stratPick;`, ctx);
  const wg = { id: 'g1', name: '그룹1', watch: {} };
  const a = ctx.__P(wg, null, {}, new Map(), 'k1'); ok(a && a.src === 'item' && a.strat.name === 'hold', '감시기: 📌 끔 → 지금 값 유지', a);
  const b = ctx.__P(wg, null, {}, new Map(), 'k2'); ok(b && b.src === 'fold' && b.strat.name === 'match', '감시기: 📁 묶음 기본', b);
  const m = new Map([['g2', { id: 'g2', name: '그룹2', watch: {} }]]); const c = ctx.__P(wg, null, { approval: { batchId: 'g2' }, approvalState: 'pending' }, m, 'k2'); ok(c && c.gid === 'g1' && c.src === 'fold', '감시기: 같은 묶음 겹침 → 주인 그룹', c);
  ctx.BKF = null; ctx.BKC = null; const d = ctx.__P(wg, null, {}, new Map(), 'k1'); ok(d && d.src === 'global', '감시기: 묶음 문서 못 읽으면 예전처럼', d); }

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
