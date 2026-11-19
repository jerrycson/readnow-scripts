// 🕸 엔진 연결망(cloud/engnet.js · engnet1 11/19) 시험 — node src/tests/tENGNET1119.js
// ① 등록부·지도 선·아래 엔진 ② N1 고르기(하위·재고·최근 손댐·잠금 건너뜀 · 바닥 아래로 안 감) ③ 울타리(무손해=기록만 · 한도) ④ N1 채점(표본 모자람=null)
// ⑤ 진화(3번 통과 → 조언 · 2번 짐 → 그림자 · 도전자 3번 이김 → 챔피언 · 바꾼 뒤 2번 짐 → 되돌림 · 14일 은퇴) ⑥ 실패 3번 → 도전자 태어남
// ⑦ 회차 전체(가짜 Firestore): N3 판정 0 → 아래 엔진 표시 · N2 · N4 충돌 · N1 하루 줄 · 7일 뒤 채점 · 값 문서는 하나도 안 씀 ⑧ 끄기
const N = require('../../cloud/engnet.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const H = 3600e3; let T = Date.parse('2026-11-19T00:00:00Z'); // 한국 9시
const iso = (ms) => new Date(ms).toISOString();
function fakeDb() { const M = new Map(); const C = (c) => ({ doc: (id) => ({ get: async () => { const k = c + '/' + id; return { exists: M.has(k), data: () => (M.has(k) ? JSON.parse(JSON.stringify(M.get(k))) : undefined) }; },
  set: async (v, o) => { const k = c + '/' + id; const deep = (a, b) => { const r = { ...(a || {}) }; for (const [kk, vv] of Object.entries(b)) r[kk] = vv && typeof vv === 'object' && !Array.isArray(vv) && r[kk] && typeof r[kk] === 'object' && !Array.isArray(r[kk]) ? deep(r[kk], vv) : vv; return r; }; M.set(k, o && o.merge ? deep(M.get(k), JSON.parse(JSON.stringify(v))) : JSON.parse(JSON.stringify(v))); } }) }); return { M, C }; }
const P = N.EN_DEF.n1;

(async () => {
  console.log('① 등록부·지도');
  const ids = N.ENGINES.map((e) => e.id); ok(new Set(ids).size === ids.length && ['judge', 'ctrl', 'learn', 'value', 'engself', 'health', 'net', 'jledger'].every((x) => ids.includes(x)), '엔진 id 겹침 없음 · 핵심 엔진 모두 있음');
  ok(N.ENGINES.every((e) => e.needs.every((n) => ids.includes(n)) && e.hb && e.hb.doc && e.can.length && e.out.length), '모든 needs가 등록부 안 · 모두 살아 있음 표시·할 일·내는 것');
  ok(N.RULES.every((r) => (r.score ? r.stage0 !== 'cand' : r.stage0 === 'cand')), '채점 없는 규칙은 후보에서 시작(채점 없는 판단 금지)');
  ok(N.RULES.every((r) => r.watch.every((w) => w === '*' || ids.includes(w)) && ids.includes(r.act)), '규칙이 보는·개입하는 엔진은 등록부 안');
  const dn = N.downstream('learn'); ok(dn.includes('judge') && dn.includes('ctrl') && dn.includes('engself') && !dn.includes('learn'), '팔릴 확률이 묵으면 → 판정·울타리·연구 엔진까지(건너서)');
  ok(N.edges().some((e) => e.kind === 'rule' && e.rule === 'N1' && e.from === 'learn' && e.to === 'judge'), '지도 선: N1 learn → judge');
  ok(!N.STAGES.some((s) => /money|live|apply/.test(s)) && N.STAGES.length === 3, '단계에 돈 바꿈 없음');

  console.log('② N1 고르기');
  const rows = []; const PC = new Map();
  for (let i = 0; i < 100; i++) { const key = 'aladin_' + (1000 + i); rows.push({ key, price: 10000, age: i < 50 ? 120 : 30, sameMin: 9500, bb: i === 1 ? 10000 : i === 4 ? 9750 : 3000, act: i === 2 ? 10 : 500, list: 15000 }); PC.set(key, i / 100); }
  const pk = N.n1Pick(rows, PC, P, { locks: new Set(['1003']) });
  ok(pk.live === 100 && pk.F.every((x) => x.pr <= P.storeQ && x.age >= P.storeAge), '저장한 위 줄은 모두 하위 30% · 재고 60일 넘음');
  ok(!pk.F.some((x) => x.key === 'aladin_1002') && pk.skip.recent === 1, '72시간 안에 손댄 상품 건너뜀');
  ok(!pk.F.some((x) => x.key === 'aladin_1003') && pk.skip.lock === 1, '잠금(usedCode) 상품 건너뜀');
  const x0 = pk.F.find((x) => x.key === 'aladin_1000'); ok(x0 && x0.cand === 9000, '후보 = min(값×0.9, 같은 등급 최저-100) 100원 내림 → 9000');
  const x1 = pk.F.find((x) => x.key === 'aladin_1001'); ok(x1 && x1.cand === null && x1.floor === 10000, '매입가 10000(=값)이면 바닥 아래로 안 감 → 후보 없음'); const x4 = pk.F.find((x) => x.key === 'aladin_1004'); ok(x4 && x4.cand === 9800, '매입가 9750 → 후보를 바닥 9800까지만 내림');
  ok(pk.Ctl.length > 0 && pk.Ctl.every((x) => x.pr > P.storeQ), '대조 줄은 하위 30% 밖');
  const pk2 = N.n1Pick(rows, PC, P, { floorOf: (bb) => bb * 1.1 }); ok(pk2.F.find((x) => x.key === 'aladin_1000').cand === 9000 && pk2.F.find((x) => x.key === 'aladin_1001').cand == null, '바닥 셈(bbFloor)을 넘겨받아 씀');

  console.log('③ 울타리');
  const F3 = [{ price: 10000, cand: 9000 }, { price: 10000, cand: 9000 }, { price: 10000, cand: null }];
  let fz = N.n1Fence(F3.map((x) => ({ ...x })), { noLoss: true, dayLoss: 10000 }); ok(fz.noLoss && fz.noLoss === true && fz.pass === 0 && fz.floor === 1, '무손해 모드 → 모두 기록만 · 통과 0');
  const F4 = F3.map((x) => ({ ...x })); fz = N.n1Fence(F4, { noLoss: false, dayLoss: 1500 }); ok(fz.pass === 1 && fz.over === 1 && F4[1].fence === 'over', '하루 내림 한도 1500원 → 1개 통과 · 1개 한도 넘음');

  console.log('④ N1 채점');
  const dd = { F: Array.from({ length: 40 }, (_, i) => ({ key: 'f' + i, pr: 0.1, age: 120 })), Ctl: Array.from({ length: 40 }, (_, i) => ({ key: 'c' + i, pr: 0.6, age: 120 })) };
  let sc = N.n1Score(dd, { q: 0.2, age: 90 }, P, (k) => (k[0] === 'f' ? +k.slice(1) < 4 : +k.slice(1) < 20)); ok(sc.pass === true && sc.srF === 0.1 && sc.srC === 0.5 && sc.lift === 0.2, '표시 10% vs 대조 50% → 통과 · lift 0.2');
  sc = N.n1Score(dd, { q: 0.2, age: 90 }, P, (k) => +k.slice(1) < 20); ok(sc.pass === false, '표시도 50% 팔리면 → 못 미침');
  sc = N.n1Score({ F: dd.F.slice(0, 10), Ctl: dd.Ctl }, { q: 0.2, age: 90 }, P, () => false); ok(sc.pass === null && sc.enough === false, '표본 30 밑 → 채점 안 함(null)');

  console.log('⑤ 진화');
  const cfg = N.EN_DEF; let S = { stage: 'shadow', passRun: 0, failRun: 0, champ: { q: 0.2, age: 90 } }; let ev = [];
  for (let i = 0; i < 3; i++) { const r = N.evolveStep(S, { pass: true, lift: 0.3 }, null, cfg, '2026-11-1' + i); S = r.S; ev = ev.concat(r.ev); }
  ok(S.stage === 'advice' && ev.some((e) => e.k === 'up'), '3번 이어 통과 → 조언');
  for (let i = 0; i < 2; i++) { const r = N.evolveStep(S, { pass: false, lift: 0.9 }, null, cfg, '2026-11-2' + i); S = r.S; ev = ev.concat(r.ev); }
  ok(S.stage === 'shadow' && ev.some((e) => e.k === 'down'), '2번 이어 못 미침 → 그림자로 내림');
  S = { stage: 'shadow', passRun: 0, failRun: 0, champ: { q: 0.2, age: 90 }, chall: { p: { q: 0.1, age: 150 }, born: '2026-11-10', winRun: 0 } }; ev = [];
  for (let i = 0; i < 3; i++) { const r = N.evolveStep(S, { pass: false, lift: 0.8 }, { pass: true, lift: 0.4 }, cfg, '2026-11-1' + (i + 1)); S = r.S; ev = ev.concat(r.ev); }
  ok(S.champ.q === 0.1 && S.prev.q === 0.2 && !S.chall && ev.some((e) => e.k === 'swap'), '도전자 3번 이어 나음 → 챔피언으로(앞 것은 prev)');
  for (let i = 0; i < 2; i++) { const r = N.evolveStep(S, { pass: false, lift: 0.9 }, null, cfg, '2026-11-1' + (i + 5)); S = r.S; ev = ev.concat(r.ev); }
  ok(S.champ.q === 0.2 && ev.some((e) => e.k === 'rollback'), '바꾼 뒤 2번 이어 짐 → 되돌림');
  S = { stage: 'shadow', champ: { q: 0.2, age: 90 }, chall: { p: { q: 0.1, age: 150 }, born: '2026-11-01', winRun: 0 } }; const r5 = N.evolveStep(S, null, null, cfg, '2026-11-19'); ok(!r5.S.chall && r5.ev.some((e) => e.k === 'retire'), '도전자 14일 넘으면 은퇴');

  console.log('⑥ 실패 → 후보');
  const fl = [0, 1, 2].map((i) => ({ at: iso(T - i * 24 * H), rule: 'N1', kind: 'miss' })).concat([{ at: iso(T - 20 * 24 * H), rule: 'N1', kind: 'small' }]);
  const cs = N.failToCand(fl, cfg, T); ok(cs.length === 1 && cs[0].rule === 'N1' && cs[0].kind === 'miss' && cs[0].n === 3, '7일 안 같은 실패 3번 → 후보 하나(옛 실패는 안 셈)');
  ok(JSON.stringify(N.n1Challenger({ q: 0.2, age: 90 }, 'miss', P)) === '{"q":0.1,"age":150}' && N.n1Challenger({ q: 0.2, age: 90 }, 'small', P).q === 0.25, '지면 더 좁게 · 표본 모자라면 넓게');

  console.log('⑦ 회차 전체');
  { const { M, C } = fakeDb(); const notes = [];
    M.set('app_settings/eng_wires', { at: iso(T - 2 * H), decs: 0 }); // 판정 0건(운영에서 본 그대로)
    M.set('app_settings/ml_health', { lastOkAt: iso(T - 3 * H), rows: 142493, auc: 0.757, fails: 0, alert: false });
    M.set('app_settings/ml_state', { lastDay: '2026-11-19' }); M.set('app_settings/eng_fence', { noLossMode: true, noLossAt: '2026-11-09T00:00:00Z' }); M.set('app_settings/eng_fence_now', { at: iso(T - H), dayLoss: 10000 });
    M.set('app_settings/eng_wire_stage', { w: { W01: { stage: 3, log: [{ d: '2026-11-15', from: 2, to: 3 }] }, W03: { stage: 3, log: [{ d: '2026-11-15', from: 2, to: 3 }] } } });
    for (const d of ['eng_self', 'research_health', 'cons_study', 'bench_obs', 'seller_aud', 'ed_study', 'value_model']) M.set('app_settings/' + d, { at: iso(T - H), trainedAt: iso(T - H), tot: { orders: 5 }, chk: 3, items: 4, pos: 9 });
    M.set('app_settings/strat_run', { lastRun: iso(T - 0.5 * H) });
    // 7일 앞 하루 줄(채점 거리)
    const d7 = '2026-11-12'; M.set('eng_net_day/' + d7, { day: d7, F: Array.from({ length: 40 }, (_, i) => ({ k: 'aladin_f' + i, pr: 0.1, a: 120, p: 10000, c: 9000, f: 'noLoss' })), Ctl: Array.from({ length: 40 }, (_, i) => ({ k: 'aladin_c' + i, pr: 0.6, a: 120 })) }); // 운영 저장 꼴(짧은 이름)
    const sales = new Map(); const t7 = Date.parse(d7 + 'T01:00:00+09:00'); for (let i = 0; i < 2; i++) sales.set('f' + i, [{ at: t7 + 2 * 24 * H }]); for (let i = 0; i < 20; i++) sales.set('c' + i, [{ at: t7 + 3 * 24 * H }]);
    let writes = []; const C2 = (c) => { const o = C(c); return { doc: (id) => { const d = o.doc(id); return { get: d.get, set: async (v, op) => { writes.push(c + '/' + id); return d.set(v, op); } }; } }; };
    const NET = N.makeEngNet({ C: C2, W: () => ({ by: 'test' }), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o) => notes.push(o), jobsOn: async () => true,
      wireDefs: () => [{ id: 'W01', money: true }, { id: 'W03', money: false }], mlDays: async () => ['2026-11-18', '2026-11-19'], mlDay: async () => rows.map((r) => ({ ...r })),
      shadow: async (d) => (d === '2026-11-19' ? { keys: [...PC.keys()], pc: [...PC.values()] } : null), sales: async () => sales, locks: async () => new Set() });
    const r = await NET.run({ force: true }); const S1 = M.get('app_settings/eng_net'); const E1 = M.get('app_settings/eng_net_evo');
    ok(r.ok && S1 && S1.v === N.EN_V && S1.engines.length === N.ENGINES.length && S1.edges.length > 10, '요약 문서: 판·엔진·지도 선');
    ok(S1.engines.find((e) => e.id === 'judge').st === 'zero' && S1.acts.some((a) => a.rule === 'N3' && a.eng === 'judge' && a.down.includes('ctrl')), 'N3: 판정 0건 → 아래 엔진(울타리 등)에 「재료 묵음」');
    ok(S1.engines.find((e) => e.id === 'jledger').st === 'wait' && /아직 없음/.test(S1.rules.find((x) => x.id === 'N5').note) && S1.rules.find((x) => x.id === 'N5').stage === 'cand', 'N5: 판정 장부 없음 → 기다림 · 후보');
    ok(S1.acts.some((a) => a.rule === 'N4' && /W01→3/.test(a.why)) && !S1.acts.some((a) => a.rule === 'N4' && /W03/.test(a.why)), 'N4: 무손해 뒤 돈 배선 W01 3단계 → 충돌(돈 아닌 W03은 아님)');
    ok(!S1.acts.some((a) => a.rule === 'N2'), 'N2: 배우기 멀쩡 → 개입 없음');
    const D19 = M.get('eng_net_day/2026-11-19'); ok(D19 && D19.F.length > 0 && D19.F.every((x) => x.f === 'noLoss' || x.f === 'floor') && D19.fence.noLoss === true, 'N1: 오늘 줄 저장 · 무손해라 모두 기록만');
    ok(S1.acts.some((a) => a.rule === 'N1' && /값은 안 바꿈/.test(a.why)) && S1.today.n === S1.acts.length && S1.today.by.N1 === 1, '오늘 개입 수 · 규칙별');
    const sd = M.get('eng_net_day/' + d7).scored; ok(sd && sd.champ.pass === true && sd.champ.srF === 0.05 && sd.champ.srC === 0.5, 'N1: 7일 앞 줄 채점 → 통과(5% vs 50%)');
    ok(E1.rules.N1.hist.length === 1 && E1.rules.N1.passRun === 1 && E1.rules.N1.stage === 'shadow', '진화 장부: N1 통과 1번 · 아직 그림자');
    ok(writes.every((w) => /^(app_settings\/eng_net(_evo)?|eng_net_day\/)/.test(w)), '쓴 문서는 eng_net·eng_net_evo·eng_net_day뿐(값·등록 안 건드림)');
    const r2 = await NET.run(); ok(r2 === null, '30분 안에는 다시 안 돎');
    T += 31 * 60e3; writes = []; const r3 = await NET.run(); const S2 = M.get('app_settings/eng_net');
    ok(r3.ok && !r3.heavy && S2.today.n === S1.today.n && !writes.some((w) => /eng_net_day/.test(w)), '같은 날 다시: 가벼운 회차만 · 이미 연 N3·N4는 다시 안 셈');
    M.set('app_settings/eng_wires', { at: iso(T), decs: 1200 }); T += 31 * 60e3; await NET.run(); const E3 = M.get('app_settings/eng_net_evo');
    ok(!E3.open['N3:judge'] && E3.rules.N3.hist[0].pass === true, 'N3: 판정이 다시 나옴 → 12시간 안 · 통과 채점');
    M.set('app_settings/ml_health', { lastOkAt: iso(T - 50 * H), rows: 1, auc: 0.6, fails: 2, alert: true }); T += 31 * 60e3; await NET.run(); const S4 = M.get('app_settings/eng_net');
    ok(S4.acts.some((a) => a.rule === 'N2' && /권고/.test(a.why)) && S4.acts.some((a) => a.rule === 'N3' && a.eng === 'learn'), 'N2: 배우기 아픔 → 연구 엔진에 권고 · N3도 팔릴 확률 묵음 표시');
    M.set('app_settings/eng_net_cfg', { on: false }); T += 31 * 60e3; ok((await NET.run({ force: true })).skip === 'off', '⑧ 설정 끄기 → 안 돎');
    M.set('app_settings/eng_net_cfg', { on: true }); const NET2 = N.makeEngNet({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, jobsOn: async () => false, mlDays: async () => [], mlDay: async () => [], shadow: async () => null, sales: async () => new Map() });
    ok((await NET2.run({ force: true })).skip === 'off', '⑧ cloud_jobs.engnet=false → 안 돎');
    const dg = await NET.diag({ engnet: 'day', d: '2026-11-19', n: 3 }); ok(dg && dg.F.length === 3 && typeof dg.Ctl === 'number', '진단 engnet=day → 줄 앞 몇 개만');
    // 무거운 회차 이틀 실패 → 카드
    const NET3 = N.makeEngNet({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o, by) => notes.push([o, by]), jobsOn: async () => true, mlDays: async () => { throw new Error('하루 모습 읽기 실패'); }, mlDay: async () => [], shadow: async () => null, sales: async () => new Map() });
    await NET3.run({ force: true, heavy: true }); T += 31 * 60e3; await NET3.run({ force: true, heavy: true }); const S5 = M.get('app_settings/eng_net');
    ok(S5.errN >= 2 && notes.length === 1 && notes[0][0][0].data.kind === 'card' && notes[0][1] === 'engine:net' && S5.engines.find((e) => e.id === 'net').st === 'late', '무거운 회차 2번 이어 실패 → 노트 카드 한 장(✕ 닫기) · 자기 상태 late');
  }
  console.log(bad ? `✗ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
