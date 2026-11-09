// tENG2 — 11/10 일꾼 eng2 · 정범님 11/09 저녁 답(가격 감시 실험·전략 작은 무리·희귀본 범위·울타리·되살린 16일)
//  ① 공용(ml-core) 순수 함수: 짝 칸(expCell)·짝짓기(expPair)·사람 손댐(humanTouch)·겹침(busyOf)·하루 손해 한도(dayLossLimit·dayLossOf)·채점(expScore)·결정 장부 검사(engDecOk)
//     희귀본 범위(RARE_RANGE·rarePick) · 되살린 날 나누기(mlSplitDays · REBUILT_W) · ⚡ 안전 검사가 사람 손댐·울타리를 막음
//  ② 클라우드 engExpTick(가짜 Firestore): 감시를 켠 그룹·전략 배정 → 실험 문서 저절로 · 같은 수 대조(사람 손댄 상품·비교군 뺌) · 실험 중 사람이 손대면 그 순간 빠지고 다시 안 건드림
//  ③ 클라우드 배우기: 되살린 날 검증에서 뺌·무게 절반 ④ 웹앱 화면 한 줄(harness가 있을 때)
// 시험 자료에 손님 정보 없음(상품 번호·책 번호만 · 사람 메일은 가짜 staff@example.com)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js', '../../src/cloud/index.js']), 'utf8');
const ML = require(find(['../readnow-ml-core.js', '../../readnow-ml-core.js']));
const HUMAN = 'staff@example.com';

function fakeDb() { const S = {}; const col = (n) => (S[n] = S[n] || new Map());
  const AU = (v) => ({ __au: v }); const DEL = { __del: 1 };
  const merge = (a, b, deep) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__del) delete o[k]; else if (v && v.__au) o[k] = [...new Set([...(o[k] || []), ...v.__au])]; else if (deep && v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object') o[k] = merge(o[k], v, true); else o[k] = v; } return o; };
  const snap = (n, id) => { const v = col(n).get(id); return { id, exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))), get: (k) => (v || {})[k], ref: ref(n, id) }; };
  const ref = (n, id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v, o) => { col(n).set(id, o && o.merge ? merge(col(n).get(id), v, true) : merge({}, v)); } });
  const query = (n, F) => { const q = { where: (k, op, v) => query(n, { ...F, w: [...(F.w || []), [k, op, v]] }), orderBy: (k) => query(n, { ...F, ob: k }), select: () => query(n, F), limit: (k) => query(n, { ...F, lim: k }),
    get: async () => { let L = [...col(n).keys()].map((id) => snap(n, id)); const g = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
      for (const [k, op, v] of F.w || []) L = L.filter((d) => { const x = g(d.data(), k); return op === '>' ? x != null && x > v : op === '==' ? x === v : op === 'in' ? v.includes(x) : true; });
      if (F.lim) L = L.slice(0, F.lim); return { empty: !L.length, size: L.length, docs: L, forEach: (fn) => L.forEach(fn) }; } }; return q; };
  const C = (n) => Object.assign(query(n, {}), { doc: (id) => ref(n, id) });
  const db = { S, col, collection: C, getAll: async (...rs) => rs.map((r) => snap(r._n, r.id)) };
  return { db, C, FV: { arrayUnion: (...v) => AU(v), serverTimestamp: () => 'TS', delete: () => DEL } }; }

(async () => {
  const NOW = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kd = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
  /* ── ① 공용 순수 함수 ── */
  { const r = { key: 'a', sp: 120, rank: 2, p1: 5, price: 6000, list: 15000, grade: 1, age: 200 };
    ok(ML.expCell(r, 0) === '1|0|1|1|2' && ML.expCell(r, 1) === '1|0|1|1' && ML.expCell(r, 3) === '1|0', `짝 칸: 수요×자리×정가 대비×등급×재고 기간(${ML.expCell(r, 0)}) → 단계마다 넓힘`);
    ok(ML.expCell({ ...r, p1: 0, rank: null }, 3) === '1|?', '첫 쪽을 못 읽은 줄은 자리 모름(?)끼리만 짝');
    const T = [{ key: 't1', sp: 120, rank: 2, p1: 5, price: 6000, list: 15000, grade: 1, age: 200 }, { key: 't2', sp: 3000, rank: 9, p1: 9, price: 9000, list: 20000, grade: 0, age: 30 }];
    const P = [{ key: 'c1', sp: 150, rank: 1, p1: 4, price: 6100, list: 14000, grade: 1, age: 250 }, { key: 'c2', sp: 160, rank: 3, p1: 4, price: 9900, list: 16000, grade: 1, age: 300 }, { key: 'c3', sp: 2500, rank: 7, p1: 9, price: 8800, list: 21000, grade: 0, age: 120 }, { key: 'c4', sp: 2600, rank: 8, p1: 9, price: 8900, list: 21000, grade: 2, age: 10 }, { key: 't1', ...T[0] }];
    const a = ML.expPair(T, P, { seed: 'x' }); const m = Object.fromEntries(a.pairs.map((p) => [p.t, p]));
    ok(m.t1 && m.t1.c === 'c1' && m.t1.lvl === 0, `t1 → c1(같은 칸 다섯 개 · 값 가장 가까움 · 단계 ${m.t1 && m.t1.lvl})`);
    ok(m.t2 && m.t2.c === 'c3' && m.t2.lvl === 1, `t2 → c3(재고 기간만 다름 → 한 단계 넓힘 · c4는 등급이 달라 뒤로) 단계 ${m.t2 && m.t2.lvl}`);
    ok(!a.pairs.some((p) => p.c === 't1'), '처리 상품은 대조가 될 수 없음');
    const b = ML.expPair(T, P, { seed: 'x', exclude: new Set(['c1']) }); ok(b.pairs.find((p) => p.t === 't1').c === 'c2', '뺀 상품(사람 손댐 등)은 건너뛰고 다음 가까운 것');
    const c2 = ML.expPair([T[0], { ...T[0], key: 't3' }], [P[0]], { seed: 'x' }); ok(c2.pairs.length === 1 && c2.miss.length === 1, '같은 대조를 두 번 쓰지 않음(모자라면 miss)');
    ok(JSON.stringify(ML.expPair(T, P, { seed: 's' })) === JSON.stringify(ML.expPair(T.slice().reverse(), P.slice().reverse(), { seed: 's' })), '같은 실험 id면 늘 같은 짝(차례와 상관없음)'); }
  { const now = NOW; const h1 = ML.humanTouch({ editAt: iso(now - 3600e3), editBy: HUMAN }, null, now, {}); const h2 = ML.humanTouch({ editAt: iso(now - 3600e3), editBy: 'strategy' }, null, now, {});
    const h3 = ML.humanTouch(null, { approval: { by: HUMAN, at: iso(now - 864e5), decision: 'batch', batchId: 'g1', batchName: '그룹' } }, now, { gid: 'g1' }); const h4 = ML.humanTouch(null, { approval: { by: HUMAN, at: iso(now - 864e5), decision: 'batch', batchId: 'g2' } }, now, { gid: 'g1' });
    const h5 = ML.humanTouch({ editAt: iso(now - 20 * 864e5), editBy: HUMAN }, null, now, {}); const h6 = ML.humanTouch({ editAt: iso(now - 3600e3), editBy: HUMAN }, null, now, { since: iso(now - 600e3) });
    ok(h1 && /✏/.test(h1.why) && !h2, '사람(메일) ✏ 수정 = 손댐 · 엔진(strategy) 수정은 아님');
    ok(!h3 && h4 && /수동 일괄/.test(h4.why), '같은 실험 그룹의 다시 확정은 손댐 아님 · 다른 그룹 수동 일괄은 손댐');
    ok(!h5 && !h6, `14일보다 오래된 손댐은 셈 안 함(기본 ${ML.EXP_DEF.humanCoolD}일) · 실험 중 감시는 들어온 뒤(since)만`);
    ok(ML.busyOf({ id: 'k', status: '판매중' }, { ctrlOf: { gid: 'g' } }) === '수동 일괄 비교군' && ML.busyOf({ id: 'k', status: '판매중' }, { watch: { gid: 'g' } }) && ML.busyOf({ id: 'k', status: '판매중', sku: 'KHKDVD1' }, null) && ML.busyOf({ id: 'k', status: '판매중' }, null, { strat: new Set(['k']) }) && !ML.busyOf({ id: 'k', status: '판매중' }, {}), '대조에서 빼는 것: 비교군·감시 그룹·제외 관리코드·전략 배정 · 아무 일 없는 상품은 됨'); }
  { ok(ML.dayLossLimit(206627) === 10000, `하루 손해 한도 = 하루 평균 주문 매출 206,627원 × 5% → ${ML.dayLossLimit(206627).toLocaleString()}원`);
    ok(ML.dayLossLimit(40000) === 5000 && ML.dayLossLimit(2e6) === 30000 && ML.dayLossLimit(206627, { dayLossFix: 20000 }) === 20000, '바닥 5,000원 · 천장 30,000원 · 사람이 고정하면 그 값');
    const sales = new Map([['u1', [{ at: NOW - 3600e3, price: 7000 }]], ['u2', [{ at: NOW - 3600e3, price: 9000 }]], ['u3', [{ at: NOW - 3 * 864e5, price: 5000 }]]]);
    const mem = [{ key: 'k1', usedCode: 'u1', arm: 'treat', start: 9000, at: iso(NOW - 5 * 864e5) }, { key: 'k2', usedCode: 'u2', arm: 'treat', start: 8000, at: iso(NOW - 5 * 864e5) }, { key: 'k3', usedCode: 'u3', arm: 'control', start: 5000, at: iso(NOW - 5 * 864e5) }];
    const L = ML.dayLossOf(mem, sales, NOW - 864e5, NOW); ok(L.loss === 2000 && L.n === 2, `하루 손해 = 처리 상품이 시작 값보다 싸게 팔린 차이 합(2,000원 · 올려 판 것·대조는 셈 안 함) → ${L.loss}`); }
  { const mem = []; const sales = new Map(); for (let i = 0; i < 40; i++) { const arm = i % 2 ? 'control' : 'treat'; const u = 'u' + i; mem.push({ key: 'k' + i, usedCode: u, arm, at: iso(NOW - 35 * 864e5) }); if ((arm === 'treat' && i % 4 !== 2) || (arm === 'control' && i % 10 === 1)) sales.set(u, [{ at: NOW - 30 * 864e5, price: 5000 }]); }
    const s = ML.expScore(mem, sales, NOW); ok(s.arms.treat.n === 20 && s.arms.control.n === 20 && s.eff30 && s.eff30.lo > 0 && /처리 쪽이 더 팔림/.test(s.verdict), `채점: 처리 ${s.arms.treat.r30} vs 대조 ${s.arms.control.r30} → ${s.verdict}(95% 범위 ${s.eff30 && s.eff30.lo.toFixed(2)}~${s.eff30 && s.eff30.hi.toFixed(2)})`);
    const s2 = ML.expScore(mem.slice(0, 6), sales, NOW); ok(/아직 모름/.test(s2.verdict), '무리마다 5권이 안 되면 아직 모름');
    ok(ML.engDecOk({ entity: 'item:k', why: ['x'], undo: { how: 'none' }, act: 'none' }).ok && !ML.engDecOk({ entity: 'item:k', why: [], undo: {} }).ok && !ML.engDecOk({ entity: 'item:k', why: ['x'], undo: {}, act: 'engine' }).ok, '결정 장부: 근거·되돌리는 법 없으면 거절 · 엔진 결정은 확신(conf)도'); }
  { const R = ML.RARE_RANGE; ok(R.minShare[0] === 0.15 && R.minShare[1] === 0.35 && R.minN[0] === 30 && R.minN[1] === 100 && R.precMin === 0.6, `희귀본 범위: 몫 ${R.minShare.join('~')} · 책 수 ${R.minN.join('~')} · 정밀도 ${R.precMin} 이상`);
    const tab = [{ minN: 30, minShare: 0.15, prec: 0.55, n: 900 }, { minN: 30, minShare: 0.25, prec: 0.66, n: 700 }, { minN: 50, minShare: 0.3, prec: 0.7, n: 500 }, { minN: 20, minShare: 0.2, prec: 0.9, n: 2000 }, { minN: 30, minShare: 0.4, prec: 0.95, n: 800 }];
    const p = ML.rarePick(tab, { minN: 30, minShare: 0.2 }); ok(p.best.minShare === 0.25 && p.best.minN === 30 && p.minShare === 0.25 && p.moved, `정밀도 60% 아래(15%)·범위 밖(책 20권·몫 40%)은 버리고 후보 최대(몫 25%) → ${p.why}`);
    const q = ML.rarePick([{ minN: 100, minShare: 0.35, prec: 0.8, n: 300 }], { minN: 30, minShare: 0.2 }); ok(q.minN === 40 && q.minShare === 0.25, `한 번에 한 칸만(30→${q.minN}권 · 20→${Math.round(q.minShare * 100)}%)`);
    const z = ML.rarePick([], { minN: 10, minShare: 0.5 }); ok(!z.moved && z.minN === 30 && z.minShare === 0.35, '고를 줄이 없으면 지금 값(범위 안으로만 당김)'); }
  { const days = (a, b) => { const o = []; for (let t = Date.parse(a); t <= Date.parse(b); t += 864e5) o.push(new Date(t).toISOString().slice(0, 10)); return o; }; const RB = days('2026-10-24', '2026-11-08');
    const x = ML.mlSplitDays(days('2026-10-08', '2026-11-01'), RB); ok(x.mode === 'before' && x.val[0] === '2026-10-17' && x.val[6] === '2026-10-23' && x.train[x.train.length - 1] === '2026-10-16' && !x.val.some((d) => RB.includes(d)) && x.wait.length === 9, `11/09 모습: 검증 = 진짜 날 10/17~10/23 · 배우기 = 그 앞 · 되살린 9일은 기다림(미래로 배우지 않음)`);
    const y = ML.mlSplitDays(days('2026-10-08', '2026-11-11'), RB); ok(y.mode === 'tail' && y.val.join() === '2026-11-09,2026-11-10,2026-11-11' && RB.every((d) => y.train.includes(d)), '진짜 날이 3일 쌓이면(11/19쯤): 검증 = 11/09~11/11 · 되살린 16일 모두 배우기에(무게 절반)');
    ok(ML.REBUILT_W === 0.5, '되살린 날 무게 절반'); }
  { const l = { status: '판매중', qty: 1, listingId: 'L1', price: 10000, registeredAt: '2026-01-01', sku: 'ABCDEF' }; const d = { act: 'price', to: 9500, k: 'drip', M: { ok: true, ageH: 1 } };
    const g0 = ML.stratGuard(d, { l, st: {}, now: NOW }, {}); const g1 = ML.stratGuard(d, { l, st: {}, now: NOW, engOut: { why: '사람이 상품 정보를 고침' } }, {}); const g2 = ML.stratGuard(d, { l, st: {}, now: NOW, fence: '오늘 손해 12,000원이 한도 10,000원을 넘음' }, {});
    ok(!g0.no.some((x) => /실험/.test(x)) && g1.no.some((x) => /다시 건드리지 않음/.test(x)) && g2.no.some((x) => /울타리/.test(x)), '⚡ 안전 검사: 사람이 손대 빠진 상품·하루 손해 울타리면 실행 안 함'); }

  /* ── ② 클라우드 engExpTick (가짜 Firestore) ── */
  { const a = SRC.indexOf('/* ENGX-START'), b = SRC.indexOf('/* ENGX-END */'); ok(a > 0 && b > a, '클라우드에 엔진 실험 장부(ENGX) 칸이 있음');
    const { db, C, FV } = fakeDb(); const today = kd(NOW); const rows = [];
    const mk = (key, o) => ({ key, sp: 120, rank: 2, p1: 5, price: 6000, list: 15000, grade: 1, age: 200, ...o });
    for (let i = 0; i < 6; i++) rows.push(mk('aladin_T' + i, { price: 6000 + i * 100 }));
    for (let i = 0; i < 40; i++) rows.push(mk('aladin_P' + i, { price: 5000 + i * 60, sp: i % 2 ? 120 : 3000 }));
    for (const r of rows) await C('prd_listings').doc(r.key).set({ status: '판매중', usedCode: r.key.slice(7), price: r.price });
    const near = rows.filter((r) => /P/.test(r.key) && r.sp === 120).sort((x, y) => Math.abs(x.price - 6250) - Math.abs(y.price - 6250)).map((r) => r.key);
    await C('prd_listings').doc(near[0]).set({ editAt: iso(NOW - 2 * 864e5), editBy: HUMAN }, { merge: true }); /* 가장 가까운 후보 = 사람이 이틀 전 고침 → 대조 안 됨 */
    await C('prd_price_decisions').doc(near[1]).set({ ctrlOf: { gid: 'bX' } }); /* 다른 그룹 비교군 → 대조 안 됨 */
    await C('prd_price_batches').doc('b1').set({ name: '감시 실험 A', watch: { on: true, since: iso(NOW - 864e5), by: HUMAN } });
    for (let i = 0; i < 6; i++) await C('prd_price_decisions').doc('aladin_T' + i).set({ usedCode: 'T' + i, watch: { gid: 'b1', since: iso(NOW - 864e5), startPrice: 6500, by: HUMAN } });
    await C('app_settings').doc('strat').set({ on: false, as: { a1: { t: 'i', tid: 'aladin_P39', k: 'drip', mode: 'suggest', at: iso(NOW - 864e5), by: HUMAN } } });
    await C('app_settings').doc('stock_groups').set({ g: {} }); await C('app_settings').doc('eng_fence').set({ maxShare: 0.5 }); /* 시험 상품이 46개뿐이라 5%면 2개 — 짝짓기를 보려고 넓힘(5% 막기는 아래 따로) */ await C('app_settings').doc('ml_state').set({ lastDay: today });
    const salesMap = new Map([['T0', [{ at: NOW - 3600e3, price: 5500 }]]]); /* 처리 T0이 시작 값 6,500보다 1,000원 싸게 오늘 팔림 */
    const deps = { db, C, FV, ML, mlMod: async () => ML, mlLoadDay: async () => rows.map((r) => ({ ...r })), mlSales: async () => salesMap, shard: (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }, kday: kd, nowIso: () => new Date().toISOString(), W: () => ({ writer: 'cloud' }), log: () => {}, VER: 'test' };
    const names = Object.keys(deps); const X = new Function(...names, SRC.slice(a, b) + '\nreturn { engExpTick, ENGX };')(...names.map((k) => deps[k]));
    const r1 = await X.engExpTick(true); const e = (await C('eng_exp').doc('pw_b1').get()).data() || {}; const mem = (await C('eng_exp_m').doc('pw_b1_00').get()).data().L;
    ok(r1 && r1.full && !r1.err && e.state === 'run' && e.auto && /감시 그룹/.test(e.hypo), `감시를 켠 그룹 → 실험 문서 저절로(${e.hypo && e.hypo.slice(0, 40)}…)${r1 && r1.err ? ' 오류 ' + r1.err : ''}`);
    ok(e.cnt && e.cnt.treat === 6 && e.cnt.control === 6, `같은 수 대조: 처리 ${e.cnt && e.cnt.treat} · 대조 ${e.cnt && e.cnt.control}`);
    const ctl = mem.filter((m) => m.arm === 'control').map((m) => m.key); ok(!ctl.includes(near[0]) && !ctl.includes(near[1]) && ctl.every((k) => (rows.find((r) => r.key === k) || {}).sp === 120), '대조: 사람이 고친 상품·다른 그룹 비교군은 빼고 같은 칸(수요 단계)에서');
    ok(mem.every((m) => ML.engDecOk(m.d).ok) && mem.filter((m) => m.arm === 'treat').every((m) => m.d.human && m.d.human.by === HUMAN && m.pair), '상품마다 결정 칸(근거·되돌리는 법·사람이 고름·짝)');
    ok(e.fence && e.fence.lossToday === 1000 && e.fence.dayLoss === 5000 && e.score && e.score.arms, `울타리·채점이 붙음(오늘 손해 ${e.fence && e.fence.lossToday}원 · 한도 ${e.fence && e.fence.dayLoss}원 · ${e.score && e.score.verdict})`);
    { const F2 = fakeDb(); const deps2 = { ...deps, db: F2.db, C: F2.C }; for (const k of ['prd_listings', 'prd_price_decisions', 'prd_price_batches', 'app_settings']) for (const [id, v] of db.col(k)) if (!(k === 'app_settings' && id === 'eng_fence')) await F2.C(k).doc(id).set(v);
      const X2 = new Function(...names, SRC.slice(a, b) + '\nreturn { engExpTick };')(...names.map((k) => deps2[k])); const q = await X2.engExpTick(true); const e2 = (await F2.C('eng_exp').doc('pw_b1').get()).data();
      ok(e2.cnt.control === 0 && e2.cnt.treat === 6 && /5%\(2개\)에 닿아 대조 6개/.test((q.fenceShare || {}).pw_b1 || '') && /대조 6개/.test(e2.fence.shareNote || ''), `기본 울타리 5%: 판매중 46개면 실험 상품 2개까지 — 사람이 고른 처리 6개는 그대로 두되 대조는 더 짝짓지 않고 까닭을 남김(${(q.fenceShare || {}).pw_b1})`); }
    ok(!!(await C('eng_exp').doc('st_a1').get()).data() && !!(await C('eng_exp_hist').doc('pw_b1_' + today).get()).data(), '⚡ 전략 배정도 실험 문서 · 날마다 채점 기록(eng_exp_hist)');
    /* 실험 중 사람이 손댐 → 20분 감시가 그 상품을 뺌 */
    X.ENGX.lightAt = 0; X.ENGX.fullDay = today; await C('app_settings').doc('eng_exp_state').set({ guardAt: iso(NOW - 60e3) }, { merge: true });
    await C('prd_listings').doc('aladin_T2').set({ editAt: new Date().toISOString(), editBy: HUMAN, price: 7000 }, { merge: true });
    await C('prd_price_decisions').doc('aladin_T3').set({ approval: { by: HUMAN, at: new Date().toISOString(), decision: 'batch', batchId: 'b1' } }, { merge: true }); /* 같은 그룹 다시 확정은 손댐 아님 */
    const r2 = await X.engExpTick(); const mem2 = (await C('eng_exp_m').doc('pw_b1_00').get()).data().L; const t2 = mem2.find((m) => m.key === 'aladin_T2'), t3 = mem2.find((m) => m.key === 'aladin_T3');
    ok(r2 && r2.light && r2.out === 1 && t2.out === 'human' && /✏/.test(t2.why) && !t3.out, `실험 중 사람이 ✏ 고친 T2만 그 순간 빠짐('사람이 손댐') · 같은 그룹 다시 확정한 T3은 그대로`);
    const ex = (await C('app_settings').doc('eng_excl').get()).data() || {}; const dT2 = (await C('prd_price_decisions').doc('aladin_T2').get()).data();
    ok(ex.m && ex.m.aladin_T2 && ex.m.aladin_T2.exp === 'pw_b1' && !dT2.watch && dT2.watchOut && dT2.watchOut.gid === 'b1', '빠진 상품: eng_excl에 남음(⚡ 전략이 다시 안 건드림) · 감시 그룹에서 빠짐(watch → watchOut — 감시기가 다시 판정하지 않음)');
    ok(/engOut: ENGO\[lid\] \|\| null, fence: ENGF\[a\.id\] \|\| null/.test(SRC) && /doc\('eng_excl'\), C\('app_settings'\)\.doc\('eng_fence_now'\)/.test(SRC) && /tm\('engx', \(\) => engExpTick\(\)\)/.test(SRC), '⚡ 전략 실행이 eng_excl·울타리를 읽어 안전 검사에 넘김 · 회차마다 engExpTick(스스로 20분 간격)'); }

  /* ── ③ 클라우드 배우기: 되살린 날 ── */
  { const L = SRC.slice(SRC.indexOf('async function mlLearn()'), SRC.indexOf('/* ══════════ (0.10.0) 🌐 외부 정보'));
    ok(/ML\.mlSplitDays\(lab, \[\.\.\.RB\]\)/.test(L) && /RB\.has\(d\) \? stride \* rbK : stride/.test(L) && /else if \(!RB\.has\(d\)\) va\.push\(i\)/.test(L) && /split: res\.split/.test(L), '팔릴 확률 배우기: 공용 mlSplitDays로 나눔 · 되살린 날 줄은 둘에 하나(무게 절반) · 검증에서 뺌 · 나눈 모습을 ml_state.learn.split에');
    const V = SRC.slice(SRC.indexOf('async function valueLearn('), SRC.indexOf('/* (0.19.0) 🔭 벤치마킹 조회 엔진'));
    ok(/v\.rebuilt && ML\.REBUILT_W/.test(V) && /\.\.\.\(rw \? \{ w: rw \} : \{\}\)/.test(V), '판매가치 배우기: 되살린 날 줄은 무게·판매 함께 절반');
    const M0 = ML.valueTrain([{ sp: 100, rank: 1, y: 1 }, { sp: 100, rank: 1, y: 0 }]); const M1 = ML.valueTrain([{ sp: 100, rank: 1, y: 0.5, w: 0.5 }, { sp: 100, rank: 1, y: 0, w: 0.5 }]); ok(M0.all === M1.all && M1.n === 1, '무게 절반이어도 판매율은 같고 영향(줄 수)만 절반'); }

  /* ── ④ 웹앱 화면 한 줄 ── */
  const hp = ['/home/user/wb-eng2/pw/harness.js', path.join(__dirname, 'harness.js')].find((x) => fs.existsSync(x));
  if (!hp) { console.log('  (웹앱 화면 시험은 harness가 없어 건너뜀)'); return fin(); }
  require(hp)(async (p) => { const seed = path.join(path.dirname(hp), 'seed.js'); if (fs.existsSync(seed)) await p.evaluate(require(seed)); await p.waitForTimeout(600);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
      o.fn = typeof engExpLine === 'function'; if (!o.fn) return o;
      o.none = engExpLine('pw_zz', true); await W(400); o.none2 = engExpLine('pw_zz', true);
      await db.collection('eng_exp').doc('pw_g9').set({ state: 'run', cnt: { treat: 12, control: 12, outHuman: 1 }, score: { verdict: '아직 모름' }, fence: { dayLoss: 10000 } });
      document.body.insertAdjacentHTML('beforeend', '<div id="tEng">' + engExpLine('pw_g9', true) + '</div>'); await W(500); o.line = document.getElementById('tEng').textContent;
      o.range = !!(window.ReadnowML && window.ReadnowML.RARE_RANGE); o.pops = pops; return o; });
    ok(R.fn, '웹앱 engExpLine 있음');
    ok(/20분 안에/.test(R.none2 || ''), `감시를 켰는데 아직 장부가 없으면: '${(R.none2 || '').replace(/<[^>]+>/g, '').slice(0, 50)}…'`);
    ok(/이 무리는 연구에 반영 중/.test(R.line || '') && /대조 12권/.test(R.line || '') && /하루 손해 한도/.test(R.line || '') /* (11/10 fence2) 한도 문서가 없으면 '못 받음 — 내리지 않음'(빨강) */, `화면 한 줄: '${(R.line || '').slice(0, 90)}'`);
    ok(R.range && R.pops === 0, '희귀본 범위를 웹앱이 읽음 · 브라우저 팝업 없음');
  }).then(fin);
  function fin() { console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exitCode = bad ? 1 : 0; }
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
