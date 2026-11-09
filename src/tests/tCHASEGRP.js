// tCHASEGRP — 정범님 11/09 '추격자 전략을 그룹마다 따로'
//  규칙: 전체 추격자 전략(prd_system/pricing.autoChase)이 기본 · 그룹 개별 전략(감시 그룹 watch.chase)이 있으면 그 상품엔 개별이 먼저 · 반자동은 개별이 없으면 조건 묶음 전략 · 여러 그룹에 걸려 애매하면 전체
//  판단 한 곳 = 판정 엔진 ReadnowChase.stratFor — ① 노드: 규칙 ② 가격 감시기(stratPick·watchJudge — 감시기 원본에서 떼어 냄) ③ 화면: 웹앱 wgStratOf·한 줄 표시
// 실행: cd pw && RN_PORT=8788 node tCHASEGRP.js
const fs = require('fs'); const path = require('path');
const PR = require('../readnow-pricing-core.js'); const CH = PR.Chase;
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
// ① 규칙
const G = { name: 'match', every: 6, maxRounds: 3 };
let r = CH.stratFor({ global: G, groups: [] }); ok(r.src === 'global' && r.strat.name === 'match' && /전체/.test(r.text), '그룹 없음 → 전체: ' + r.text, r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1' }] }); ok(r.src === 'global' && r.strat.name === 'match' && r.gid === 'g1' && /개별 전략 없음 — 전체/.test(r.why), '개별 없는 자동 그룹 → 전체(예전 그대로): ' + r.text, r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', chase: { name: 'lure' } }] }); ok(r.src === 'group' && r.strat.name === 'lure' && r.strat.every === 6 && r.strat.maxRounds === 3 && /그룹 '감시1' 개별 전략/.test(r.text), '그룹 개별 → 개별이 먼저(세부 값은 전체에서 이어받음): ' + r.text, r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', preset: { name: '묶음A', chase: { name: 'shadow', every: 3 } } }] }); ok(r.src === 'preset' && r.strat.name === 'shadow' && r.strat.every === 3, '반자동 · 개별 없음 → 조건 묶음 전략(예전 그대로): ' + r.text, r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', chase: { name: 'lift' }, preset: { name: '묶음A', chase: { name: 'shadow' } } }] }); ok(r.src === 'group' && r.strat.name === 'lift', '반자동이어도 그룹 개별이 있으면 개별이 먼저', r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', chase: { name: 'lure' } }, { id: 'g2', name: '감시2', chase: { name: 'lift' } }] }); ok(r.src === 'global' && r.strat.name === 'match' && /여러 그룹\('감시1'·'감시2'\)에 걸려 애매/.test(r.text), '여러 그룹에 걸림 → 애매해서 전체: ' + r.text, r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', chase: { name: 'lure' } }, { id: 'g1', name: '감시1', chase: { name: 'lure' } }] }); ok(r.src === 'group' && r.strat.name === 'lure', '같은 그룹이 두 번 들어와도 한 그룹으로', r);
r = CH.stratFor({ global: G, groups: [{ id: 'g1', name: '감시1', chase: { name: '없는전략' } }] }); ok(r.src === 'global', '모르는 전략 이름은 개별 전략 없음으로(전체)', r);
r = CH.stratFor({ global: null, groups: [] }); ok(r.strat.name === 'yield', '전체 설정이 없으면 양보(예전 기본)', r);
// ② 가격 감시기 — 원본에서 떼어 내 가짜 Firestore 없이 판단만
const src = fs.readFileSync(path.join(__dirname, 'readnow-price-watch.user.js'), 'utf8');
const a = src.indexOf('  const presetOf = '); const b = src.indexOf('  async function followUps(');
const load = (SET) => new Function('PR', 'SET', 'C', 'db', 'firebase', 'W', 'log', src.split('\n').find((l) => /^  const engineSettings = /.test(l)) + '\n' + src.slice(a, b) + '\nreturn { stratOf, stratPick, watchJudge, CHE };')(PR, SET, () => ({}), {}, { firestore: { FieldValue: {} } }, () => ({}), () => {});
ok(a > 0 && b > a, '감시기에서 함수를 찾음');
const X = load({ autoChase: { name: 'match' }, presets: { p1: { name: '묶음A', chase: { name: 'shadow' } } } });
const g1 = { id: 'g1', name: '감시1', watch: { mode: 'auto', on: true, chase: { name: 'lure' } } }, g2 = { id: 'g2', name: '감시2', watch: { mode: 'auto', on: true } }, g3 = { id: 'g3', name: '감시3', watch: { mode: 'semi', presetId: 'p1', on: true } };
const WGm = new Map([['g1', g1], ['g2', g2], ['g3', g3]]);
let sp = X.stratPick(g1, null, {}, WGm); ok(sp.src === 'group' && sp.strat.name === 'lure', '감시기: 그룹 개별 → 끌어내린 뒤 빠지기', sp);
sp = X.stratPick(g2, null, {}, WGm); ok(sp.src === 'global' && sp.strat.name === 'match', '감시기: 개별 없는 자동 그룹 → 전체(동가 유지)', sp);
sp = X.stratPick(g3, X.stratOf ? { name: '묶음A', chase: { name: 'shadow' } } : null, {}, WGm); ok(sp.src === 'preset' && sp.strat.name === 'shadow', '감시기: 반자동 → 조건 묶음 전략(예전 그대로)', sp);
sp = X.stratPick(g1, null, { approval: { batchId: 'g2' }, approvalState: 'approved' }, WGm); ok(sp.src === 'global' && sp.strat.name === 'match' && /여러 그룹/.test(sp.why), '감시기: 다른 감시 그룹에 확정 대기 중(두 그룹에 걸림) → 애매해서 전체', sp);
sp = X.stratPick(g1, null, { approval: { batchId: 'g2' }, approvalState: 'done' }, WGm); ok(sp.src === 'group', '감시기: 지난 그룹 확정이 끝난 기록이면 걸린 것으로 보지 않음', sp);
sp = X.stratPick(g1, null, { approval: { batchId: 'zz' } }, WGm); ok(sp.src === 'group', '감시기: 감시가 아닌 그룹은 셈하지 않음', sp);
{ const now = '2026-11-09T03:00:00.000Z'; const listing = { usedCode: 'U1', key: 'aladin_U1', price: 10000, grade: '상', registeredAt: '2026-10-01T00:00:00+09:00', status: '판매중', ship: 2500, title: '시험 책', sku: 'ABC' };
  const rows = [{ sellerCode: '111', sellerName: '갑', price: 9000, grade: '상', ship: 2500, rank: 1, firstSeenAt: '2026-10-01T00:00:00Z' }, { sellerCode: '222', sellerName: '을', price: 9500, grade: '상', ship: 2500, rank: 2, firstSeenAt: '2026-10-01T00:00:00Z' }, { usedCode: 'U1', sellerCode: '996008', price: 10000, grade: '상', ship: 2500, rank: 3 }];
  const P1c = [{ r: 1, sc: '111', n: '갑', g: '상', p: 9000, s: 2500, c: 'green' }, { r: 2, sc: '222', n: '을', g: '상', p: 9500, s: 2500, c: 'green' }, { r: 3, sc: '996008', g: '상', p: 10000, c: 'ours', uc: 'U1' }];
  const ctx = { now, core: { classifySellerDoc: () => ({ cls: 'green' }) }, RS: {}, chase: { 111: { active: true } }, chaseMoves: {}, policy: { fee: 2500 }, settings: {} };
  const run = (wg, prevD) => X.watchJudge(wg, null, listing, { at: now, rows }, { sc_111: { name: '갑' } }, ctx, P1c.map((w) => ({ ...w })), { buyback: null }, prevD || {}, now, X.stratPick(wg, null, prevD || {}, WGm));
  let J = run(g1); ok(J.strat && J.strat.name === 'lure' && /추격자 전략: 끌어내린 뒤 빠지기/.test(J.reasons[0]) && /그룹 '감시1' 개별 전략/.test(J.reasons[0]) && J.chaseSrc && J.chaseSrc.src === 'group', '판정: 그룹 개별 전략으로 한 걸음 · 까닭 한 줄: ' + J.reasons[0], J);
  J = run(g2); ok(J.strat && J.strat.name === 'match' && J.chaseSrc.src === 'global', '판정: 개별 없음 → 전체(동가 유지) · ' + J.reasons[0], J.reasons);
  const J0 = X.watchJudge(g2, null, listing, { at: now, rows }, {}, ctx, P1c.map((w) => ({ ...w })), { buyback: null }, {}, now); ok(J0.strat && J0.strat.name === 'match' && J0.chaseSrc === null, '판정: 옛 부름(전략 고르기 없음)도 예전처럼 전체', J0); }
// ③ 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const o = await p.evaluate(() => { S.prCfg = { ...(S.prCfg || {}), autoChase: { name: 'match', every: 6 }, presets: { p1: { name: '묶음A', chase: { name: 'shadow' } } } };
    const g1 = { id: 'g1', name: '감시1', watch: { on: true, mode: 'auto', chase: { name: 'lure' } } }, g2 = { id: 'g2', name: '감시2', watch: { on: true, mode: 'auto' } }, g3 = { id: 'g3', name: '감시3', watch: { on: true, mode: 'semi', presetId: 'p1' } };
    const R = (x, d) => { const r = wgStratOf(x, d); return r ? { src: r.src, n: r.strat.name, t: r.text } : null; };
    return { a: R(g1), b: R(g2), c: R(g3), d: R([g1, g2]), e: R(g2, { id: 'g2', mode: 'auto', chase: 'lift' }), f: R(g1, { id: 'g1', mode: 'auto', chase: '' }), tag: wgSrcTag(wgStratOf(g1)), has: !!(window.ReadnowChase && window.ReadnowChase.stratFor) }; });
  ok(o.has, '웹앱이 판정 엔진 stratFor를 불러옴');
  ok(o.a.src === 'group' && o.a.n === 'lure' && o.b.src === 'global' && o.b.n === 'match' && o.c.src === 'preset' && o.c.n === 'shadow' && o.d.src === 'global', '웹앱 그룹 칸 판단 = 감시기와 같은 답(개별·전체·조건 묶음·여러 그룹 전체)', o);
  ok(o.e.src === 'group' && o.e.n === 'lift' && o.f.src === 'global', '저장 전 고른 값(초안)으로 미리 보기 — 개별 고르면 개별 · 전체 따름이면 전체', o);
  ok(/🎯 끌어내린 뒤 빠지기 · 그룹 개별/.test(o.tag) && /title="추격자 전략: 끌어내린 뒤 빠지기 — 그룹 &#39;감시1&#39; 개별 전략"|title="추격자 전략: 끌어내린 뒤 빠지기 — 그룹 '감시1' 개별 전략"/.test(o.tag), '한 줄 표시: ' + o.tag, o.tag);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
