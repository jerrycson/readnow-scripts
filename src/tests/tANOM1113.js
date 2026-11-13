// tANOM1113 — (anom1 11/13) 🧠 자료 이상 판단 엔진(readnow-anom-core.js) · 브라우저 필요 없음
//  ① 공용 틀: 기준선(로그·MAD·모두 쪽으로 당김) · 경쟁 가설 분석(어긋남 1.5배·모름) · 사람 되먹임 배움
//  ② 11/13 실제 회차 숫자(16곳 · 번호는 지어낸 것)로 되돌려 시험 — 보통 회차를 잘못 빼지 않음 · 어린왕자·소득공제 꼴 판정
//  ③ 실제 회차에 사건을 심어 맞히는지(다시 올리기·대량 내림·숍 닫음·읽기 잡음)
//  ④ series 도메인(시장 지표·우리 판매 수 같은 숫자 줄) · ⑤ cloud/benchrep.js 붙임(판정·뺌·다시 올리기 줄 뺌) · ⑥ 웹앱 글
// 실행: node src/tests/tANOM1113.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = path.join(__dirname, '..', '..');
const AN = require(path.join(ROOT, 'readnow-anom-core.js'));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'anom1113_runs.json'), 'utf8'));

console.log('① 공용 틀');
{ const b = AN.baseline([0.004, 0.005, 0.006, 0.005], [0.01, 0.012, 0.009, 0.011, 0.01]); ok(b && b.med > 0.005 && b.med < 0.01, '기준선: 자기 4회차 + 모두 — 자기 쪽으로 기울되 모두 쪽으로 당김', b);
  ok(AN.zOf(0.05, b) > 3 && Math.abs(AN.zOf(0.006, b)) < 2, 'z: 크게 벗어남만 3 넘음');
  const b0 = AN.baseline([], [0.01, 0.01, 0.01]); ok(b0 && b0.s >= 0.35, '흩어짐 바닥(같은 값만 있어도 너무 예민하지 않게)', b0); }
{ const H = [{ id: 'a', name: 'A', act: 'out' }, { id: 'b', name: 'B', act: 'in' }];
  const r = AN.ach(H, [{ k: 'e1', w: 1, c: { a: 2, b: 1 } }, { k: 'e2', w: 1, c: { a: 1, b: -1 } }]); ok(r.pick && r.pick.id === 'a' && r.ranked[1].score === -0.5, 'ACH: 어긋남은 1.5배 · 덜 반박된 가설', r);
  const r2 = AN.ach(H, [{ k: 'e1', w: 1, c: { a: 2, b: 2 } }]); ok(!r2.pick, 'ACH: 1·2등이 비슷하면 모름', r2); }
{ /* (정범님 11/13 12:16) 사람 판단은 배움 재료가 아님 — 판정 뒤 다음 회차 증거로 스스로 채점 */
  const rec = (id, o) => ({ act: id === 'longgap' ? 'in' : id === 'noise' ? 'unk' : 'out', anom: true, pick: { id }, f: { g: 2000, total: 18100, totP: 20000, add: 100 }, z: [['rGone', 0.1, 0.005, 9]], ...o });
  const back = [{ total: 19900, spanDays: 1, gone: 90 }, { total: 20000, spanDays: 1, gone: 100 }]; const stay = [{ total: 18000, spanDays: 1, gone: 90 }, { total: 17950, spanDays: 1, gone: 100 }];
  ok(AN.verify('bench', rec('relist'), back).ok === true && AN.verify('bench', rec('relist'), stay).ok === false, '채점: 다시 올리기 — 상품 수 돌아옴 = 맞음 · 줄어든 채 = 틀림');
  ok(AN.verify('bench', rec('takedown'), stay).ok === true && AN.verify('bench', rec('takedown'), back).ok === false, '채점: 대량 내림 — 줄어든 채 = 맞음 · 돌아옴 = 틀림(다시 올리기였음)');
  ok(AN.verify('bench', rec('noise'), back).ok === true, '채점: 읽기 잡음 — 상품이 그대로 있었음 = 맞음');
  ok(AN.verify('bench', rec('longgap'), [{ total: 20000, spanDays: 1, gone: 100 }]).ok === true && AN.verify('bench', rec('longgap'), [{ total: 20000, spanDays: 1, gone: 2000 }]).ok === false, '채점: 넣었던 판정 — 다음 짧은 회차 사라짐이 평소면 맞음 · 20배면 틀림(놓침)');
  ok(AN.verify('bench', rec('relist'), []).ok === null && AN.verify('bench', rec('takedown'), stay.slice(0, 1)).ok === null, '뒤 회차가 모자라면 아직 모름(채점 안 함)');
  let L = AN.learnInit(); const a = AN.learn(L, [{ id: 'x1', dom: 'bench', key: '9', act: 'out', pickId: 'relist', ok: false, why: '줄어든 채' }]); ok(a.changed === 1 && a.learn.sc['bench:9'] === 0.25 && a.learn.bias.bench.relist === -0.5 && a.learn.n.fp === 1, '배움: 틀린 경보 → 그 판매자 기준 +0.25 · 그 가설 −0.5', a.learn);
  const b = AN.learn(a.learn, [{ id: 'x1', dom: 'bench', key: '9', act: 'out', pickId: 'relist', ok: false }]); ok(b.changed === 0, '같은 판정은 한 번만 채점');
  const c = AN.learn(b.learn, [{ id: 'x2', dom: 'bench', key: '9', act: 'in', pickId: 'longgap', ok: false }, { id: 'x3', dom: 'bench', key: '9', act: 'out', pickId: 'takedown', ok: true }]); ok(c.learn.zCut.bench === 2.75 && c.learn.n.fn === 1 && c.learn.n.ok === 1 && c.learn.bias.bench.takedown === 0.1, '배움: 놓침 → 도메인 기준 −0.25 · 맞음 → 그 가설 +0.1', c.learn);
  ok(!/human/.test(String(AN.learn)), '배움 함수에 사람 판단 칸 없음'); }

/* 실제 회차로 차례대로 판정(그때까지의 회차만 기준선) */
const all = []; for (const S of Object.values(FX.shops)) for (const v of S.runs) all.push({ ...v, _tag: S.tag });
const t = (v) => Date.parse(v.runAt || v.day || 0); all.sort((a, b) => t(a) - t(b));
const usable = (v) => !v.base && !v.light && !v.partial && v.complete !== false;
const extra = {}; const lastBy = {}; for (const v of all) { if (v.light || v.partial || v.complete === false) continue; const L = lastBy[v.sc] || (lastBy[v.sc] = []); extra[v.dayId] = { prev: L[L.length - 1] || null, prev2: L[L.length - 2] || null, relist: v.rl || null }; L.push(v); }
function walk(learn, inject) { const judged = {}; const out = [];
  for (const v0 of all) { if (!usable(v0)) continue; const v = inject && inject[v0.dayId] ? inject[v0.dayId](v0) : v0; const T = t(v); const win = (x) => t(x) < T && T - t(x) <= 35 * 864e5 && usable(x) && (!judged[x.dayId] || judged[x.dayId].act === 'in');
    const ex = inject && inject[v0.dayId] && v._extra ? { ...extra, [v.dayId]: { ...extra[v.dayId], ...v._extra } } : extra;
    const r = AN.judge('bench', v, { hist: all.filter((x) => x.sc === v.sc && win(x)), pool: all.filter((x) => x.sc !== v.sc && win(x)), extra: ex, learn }); judged[v.dayId] = r; out.push({ v, r }); }
  return out; }
console.log('② 11/13 실제 회차로 되돌려 시험');
const W = walk(null); const fixed = (v) => { if (v.full === false) return false; const g = +v.gone || 0; if (g < 500) return false; const n = Math.max(1, (+v.total || 0) - (+v.add || 0) + g); return g / n >= 0.08 && g / n / Math.max(1, +v.spanDays || 1) >= 0.02; };
const normal = W.filter((x) => !/꼴/.test(x.v._tag) || !/2026-11-13/.test(x.v.dayId));
const fp = normal.filter((x) => x.r.act !== 'in'); ok(W.length >= 200, `판정한 회차 ${W.length}개`);
ok(fp.length === 0, `보통 회차를 잘못 뺀 것 ${fp.length}/${normal.length}(0이어야 — 고정 기준이 사건으로 잡은 것 ${W.filter((x) => fixed(x.v)).length}개)`, fp.map((x) => [x.v.dayId, x.r.line]));
for (const tag of ['A_어린왕자꼴', 'B_소득공제꼴']) { const x = W.find((y) => y.v._tag === tag && /2026-11-13/.test(y.v.dayId)); const r = x && x.r;
  ok(r && fixed(x.v), `${tag} 11/13: 고정 기준은 사건으로 잡음`);
  ok(r && r.anom && r.pick && r.pick.id === 'longgap' && r.act === 'in', `${tag} 11/13: 엔진 판정 = 긴 틈에 쌓인 평소 사라짐(통계에 넣음) — 다시 올리기 아님`, r && { pick: r.pick, why: r.why });
  ok(r && r.f && r.f.win > 20 && r.f.twoStep, `${tag}: 실제 사라진 간격 = 앞 회차 간격 ${r && r.f && r.f.win}일(두 번 확인)`);
  ok(r && r.why.some((w) => /다시 올리기 아님/.test(w)), `${tag}: 사라진 제목의 다시 올라옴 몫이 대조군과 같음(넘친 몫 2%)`); }

console.log('③ 사건을 심어 맞히는지');
const last = {}; for (const x of W) if (x.r.act === 'in' && +x.v.total > 3000 && x.v.full !== false) last[x.v.sc] = x.v; const base = Object.values(last);
const mk = (kind) => { const inj = {}; for (const v of base) inj[v.dayId] = (v0) => { const p = extra[v0.dayId].prev || {}; const N = +p.total || +v0.total; const g = Math.round(N * 0.12);
    const o = { ...v0, gone: g, spanDays: 1, cover: 1, notRead: 0, full: true };
    if (kind === 'relist') { o.add = Math.round(g * 0.9); o.total = N - g + o.add; o._extra = { prev: { ...p, missOnce: g, spanDays: 1, add: Math.round(g * 0.95), total: N }, relist: { hit: 0.55, ctrl: 0.02, still: 0.7, n: 3000 } }; }
    if (kind === 'takedown') { o.add = Math.round(g * 0.05); o.total = N - g + o.add; o._extra = { prev: { ...p, missOnce: g, spanDays: 1, add: Math.round(g * 0.05), total: N }, relist: { hit: 0.01, ctrl: 0.01, still: 0.1, n: 3000 } }; }
    if (kind === 'close') { o.gone = Math.round(N * 0.9); o.add = 0; o.total = Math.round(N * 0.1); o._extra = { prev: { ...p, missOnce: o.gone, spanDays: 1, add: 0, total: N }, relist: { hit: 0, ctrl: 0.01, still: 0.02, n: 3000 } }; }
    if (kind === 'noise') { o.add = Math.round(g * 0.1); o.total = N - g; o.cover = 0.97; o.notRead = Math.round(N * 0.03); o._extra = { prev: { ...p, missOnce: g, spanDays: 1, add: 20, total: N }, relist: null }; }
    return o; }; return inj; };
const rate = {}; for (const [kind, want, act] of [['relist', 'relist', 'out'], ['takedown', 'takedown', 'out'], ['close', 'close', 'out'], ['noise', 'noise', 'unk']]) { const Wi = walk(null, mk(kind)); const hits = Wi.filter((x) => base.some((b) => b.dayId === x.v.dayId)); const right = hits.filter((x) => x.r.pick && x.r.pick.id === want).length; /* 대량 내림은 '진짜 대량 판매'와 증거가 거의 같아 둘 다 아닌 '모름'(뺌)도 받아들임 — 아래 safe */ const safe = hits.filter((x) => x.r.act !== 'in').length;
  rate[kind] = `${right}/${hits.length}`; ok(hits.length >= 8 && right / hits.length >= 0.8, `${kind}: 가설 맞힘 ${right}/${hits.length} · 팔림에서 뺌 ${safe}/${hits.length}`, hits.filter((x) => !(x.r.pick && x.r.pick.id === want)).slice(0, 3).map((x) => [x.v.dayId, x.r.line, x.r.ranked && x.r.ranked.slice(0, 3)]));
  ok(safe === hits.length && hits.every((x) => x.r.act === act || x.r.act !== 'in'), `${kind}: 판정 처리 ${act}(빼거나 모름)`); }
console.log('   맞힘률', JSON.stringify(rate));

console.log('④ series 도메인(어떤 숫자 줄이든)');
{ const prev = [100, 104, 98, 101, 99, 103, 97, 100, 102, 99];
  const z0 = AN.judgeSeries({ key: '시장지표', t: 'd11', v: 0, prev, next: [101, 99] }); ok(z0.anom && z0.pick && z0.pick.id === 'noise' && z0.act === 'out', '갑자기 0 · 뒤 값 되돌아옴 → 읽기 잡음(뺌)', z0);
  const lv = AN.judgeSeries({ key: '우리판매', t: 'd11', v: 200, prev, next: [195, 202, 199] }); ok(lv.anom && lv.pick && lv.pick.id === 'level' && lv.act === 'in', '뒤 값도 새 수준 → 진짜 수준 바뀜(넣음)', lv);
  const sp = AN.judgeSeries({ key: '예스24', t: 'd11', v: 190, prev, next: [101, 98, 100] }); ok(sp.anom && sp.pick && sp.pick.id === 'spike', '한 번 튀고 되돌아옴 → 한 번 튐', sp);
  const nm = AN.judgeSeries({ key: '판매자요약', t: 'd11', v: 103, prev }); ok(!nm.anom && nm.act === 'in', '평소 값 → 평소'); }

console.log('⑤ cloud/benchrep.js 붙임');
const BR = require(path.join(ROOT, 'cloud', 'benchrep.js'));
ok(!!BR.AN && BR.AN.VERSION === AN.VERSION, '회차 보고가 공용 엔진을 실음(이미지 안 cores_ 사본 · 없으면 저장소 맨 위)');
{ const day = '2026-11-13'; const mkRun = (sc, d, o) => ({ sc, name: '가게' + sc.slice(-1), day: d, dayId: `${sc}_${d}`, runAt: d + 'T01:00:00.000Z', at: d + 'T01:30:00.000Z', full: true, complete: true, ...o });
  const hist = []; for (const sc of ['9200001', '9200002', '9200003']) for (const d of ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']) hist.push(mkRun(sc, d, { total: 20000, add: 100, gone: 100, missOnce: 100, spanDays: 1 }));
  /* 가게1: 다시 올리기 — 앞 회차에서 2,400개 처음 안 보임 + 2,300개 새로 올림 · 이번에 확정 */
  hist.find((x) => x.dayId === '9200001_2026-11-12').missOnce = 2400; hist.find((x) => x.dayId === '9200001_2026-11-12').add = 2300;
  const G1 = Array.from({ length: 300 }, (_, i) => JSON.stringify([`g${i}`, `다시 올린 책 ${i}`, 3000, '상', i < 60 ? 3 : null, '20261110', 0])); const G2 = Array.from({ length: 100 }, (_, i) => JSON.stringify([`h${i}`, `팔린 책 ${i}`, 5000, '상', 2, '20261111', 0]));
  const runs = [mkRun('9200001', day, { total: 19900, add: 50, gone: 2400, missOnce: 90, spanDays: 1, goneList: G1 }), mkRun('9200002', day, { total: 20000, add: 100, gone: 100, missOnce: 100, spanDays: 1, goneList: G2 }), mkRun('9200003', day, { total: 20000, add: 100, gone: 100, missOnce: 100, spanDays: 1, massGone: true, mass: { on: true }, goneList: G2.map((r) => r.replace(/팔린/, '셋째')) })];
  const acc = BR.makeAcc({ day, runs, hist: [...hist, ...runs], role: {} });
  /* 숍 목록: 가게1은 사라진 제목 300개가 모두 11/12에 새 번호로 다시 올라옴 · 옛 제목 1,000개는 그대로 */
  const M1 = {}; for (let i = 0; i < 300; i++) M1['n' + i] = [3000, '20261112', '상', 0, `다시 올린 책 ${i}`, 0, 0, null, null, null, 0]; for (let i = 0; i < 1000; i++) M1['o' + i] = [3000, '20261001', '상', 0, `옛 책 ${i}`, 0, 0, null, null, null, 0];
  acc.shop('9200001', M1); acc.endShop('9200001'); acc.shop('9200002', { a: [4000, '20261001', '상', 0, '다른 책', 0, 0, null, null, null, 0] }); acc.endShop('9200002'); acc.shop('9200003', { a: [4000, '20261001', '상', 0, '다른 책', 0, 0, null, null, null, 0] }); acc.endShop('9200003'); acc.ours([]);
  const P = acc.done(); const A1 = P.anom.list.find((x) => x.sc === '9200001'); const A3 = P.anom.list.find((x) => x.sc === '9200003');
  ok(P.anom.on && A1 && A1.pick && A1.pick.id === 'relist' && A1.act === 'out', '가게1 → 다시 올리기 · 통계에서 뺌', A1 && { line: A1.line, why: A1.why });
  ok(A1 && A1.relist && A1.relist.hit === 1 && A1.relist.ctrl === 0, '제목 증거: 사라진 제목 다시 올라옴 100% · 대조군 0%', A1 && A1.relist);
  ok(P.sold.n === 200 && !P.sold.byShop.find((x) => x.name === '가게1'), '팔림 셈: 가게1(뺌) 빠지고 가게2·가게3(엔진이 평소로 봄 — 수집기 고정 표시를 엔진이 풂) 200', P.sold);
  ok(A3 && A3.act === 'in' && P.mass.length === 1 && P.mass[0].sc === '9200001' && P.mass[0].pick, '📦 목록 = 엔진이 뺀 가게1만(가설 이름 붙음)', P.mass);
  ok(P.shops.find((s) => s.sc === '9200001').mass === true && /다시 올리기/.test(P.shops.find((s) => s.sc === '9200001').anom), '판매자 표에 판정 글');
  ok(P.problems.some((x) => /📦 가게1/.test(x) && /다시 올리기/.test(x)), '문제 줄에 가설 이름', P.problems);
  /* 사람이 고른 회차는 엔진이 빼기/넣기를 안 바꿈 */
  const runsH = runs.map((r) => (r.sc === '9200001' ? { ...r, excl: false, exclBy: 'x@y', exclAt: '2026-11-13T02:00:00Z' } : r)); const accH = BR.makeAcc({ day, runs: runsH, hist: [...hist, ...runsH], role: {} }); accH.shop('9200001', M1); accH.endShop('9200001'); accH.ours([]); const PH = accH.done();
  const AH = PH.anom.list.find((x) => x.sc === '9200001'); ok(AH && AH.human === 'in' && AH.act === 'in' && PH.sold.byShop.some((x) => x.name === '가게1'), '사람이 ↩ 다시 넣기한 회차 → 엔진 판정은 적되 셈에 넣음', AH);
  /* 짧은 창 다시 올리기 줄 빼기(평소 회차) */
  const runs2 = [mkRun('9200002', day, { total: 20000, add: 100, gone: 100, missOnce: 100, spanDays: 1, goneList: G2 })]; const acc2 = BR.makeAcc({ day, runs: runs2, hist: [...hist, ...runs2], role: {} });
  const M2 = { r0: [5000, '20261112', '상', 0, '팔린 책 0', 0, 0, null, null, null, 0], r1: [5000, '20261112', '상', 0, '팔린 책 1', 0, 0, null, null, null, 0], o: [5000, '20261001', '상', 0, '옛 책', 0, 0, null, null, null, 0] }; acc2.shop('9200002', M2); acc2.endShop('9200002'); acc2.ours([]); const P2 = acc2.done();
  ok(P2.sold.n === 98 && P2.anom.relistCut.n === 2, '평소 회차라도 7일 창 안에 새 번호로 다시 올라온 2권은 팔림에서 뺌', [P2.sold.n, P2.anom.relistCut]); }
{ /* 대조군은 상품 수 무게 — 옛 책 X 3권+창 안 1권 · 옛 책 Y 1권 → 0.75(제목 수로 세면 0.5) */ const day = '2026-11-13'; const mk = (d, o) => ({ sc: '9300001', name: '가게', day: d, dayId: '9300001_' + d, runAt: d + 'T01:00:00Z', full: true, complete: true, total: 1000, add: 10, gone: 10, missOnce: 10, spanDays: 1, ...o });
  const hist = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'].map((d) => mk(d)); const run = mk(day, { goneList: [JSON.stringify(['z', '사라진 책', 1000, '상', null, '20261001', 0])] });
  const acc = BR.makeAcc({ day, runs: [run], hist: [...hist, run], role: {} }); acc.shop('9300001', { a: [1, '20261001', '상', 0, 'X', 0, 0], b: [1, '20261001', '상', 0, 'X', 0, 0], c: [1, '20261001', '상', 0, 'X', 0, 0], d: [1, '20261112', '상', 0, 'X', 0, 0], e: [1, '20261001', '상', 0, 'Y', 0, 0] }); acc.endShop('9300001'); acc.ours([]);
  const P = acc.done(); const a1 = P.anom.list[0]; ok(a1 && a1.relist && a1.relist.ctrl === 0.75, '대조군 = 상품 수 무게 0.75', a1 && a1.relist); }
const SRC = fs.readFileSync(path.join(ROOT, 'cloud', 'benchrep.js'), 'utf8');
ok(/doc\('anom_learn'\)/.test(SRC) && /AN\.verify\('bench', a, later\)/.test(SRC) && /AN\.learn\(learnSt, outs\)/.test(SRC) && !/human: x\.excl/.test(SRC), '클라우드: 뒤 회차 증거로 채점 → app_settings/anom_learn 배움(사람 빼기/넣기는 배움에 안 씀)');
ok(/massGone: mg/.test(SRC) && /if \(same && \(hs \|\| !!v\.massGone === mg\)\) continue;/.test(SRC), '클라우드: 판정이 같으면 안 씀 · 사람 고른 회차는 빼기/넣기 그대로');
ok(/kday\(D0 - 36 \* 864e5\)/.test(SRC), '기준선 35일 재료');
const WF = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'deploy-cloud.yml'), 'utf8'); ok(/for f in \.\.\/readnow-\*-core\.js/.test(WF), '배포가 readnow-*-core.js를 이미지에 넣음(엔진 파일도 함께)');

console.log('⑥ 웹앱 🎯 회차 보고');
const APP = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
ok(/🧠 자료 이상 판단/.test(APP) && /data-anomx=/.test(APP), '회차 보고 6번 칸 = 🧠 자료 이상 판단(판정·근거·가설 점수 · ↩ 다시 넣기/📉 빼기)');
ok(/benchExclSet\(sc, \[id\], out, /.test(APP), '다시 넣기·빼기 단추가 기존 회차 빼기 장치(benchExclSet)를 씀 — 통계 처리만(기록만)');
ok(!/\b(alert|confirm|prompt)\(/.test(APP.slice(APP.indexOf('🧠 자료 이상 판단'), APP.indexOf('🧠 자료 이상 판단') + 6000)), '브라우저 창 없음');

console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
