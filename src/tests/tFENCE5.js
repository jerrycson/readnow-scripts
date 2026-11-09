// tFENCE5 — 11/10 fence5 · 정범님 11/10 새벽 '감시와 전략은 곧 사용 — 미리 정밀히 검토해서 문제 원인을 찾고 고쳐줘' (11/09 정밀 점검 ⑤-2)
//  원인: 원장 x[상품].a(내려 둔 값 전체)를 날마다 그대로 이어 받아 '쓴 + 걸린 a 모두'를 한도와 견줌 → 팔리거나 값이 오르기 전엔 날이 바뀌어도 안 풀림(누적 노출)
//  고친 뜻: 그날 엔진이 정범님 확정 값 아래로 실제로 내린 몫(t)만 한도와 견줌 · 새 날 0부터 · 올려도 돌려받지 않음 · 빠진 상품의 그날 몫은 gone에 남김 · 감시·추격자 몫은 따로(기록만)
//  ① 24시간 가짜 시계(20분마다 1,000원 · 이틀) ② 한국 자정 경계 ③ 여러 기기 동시 ④ 예약 남음(탭 닫힘)·취소·다른 값으로 받음 ⑤ 되돌림(올렸다 다시 내림)
//  ⑥ 팔림·빠짐 뒤에도 한도가 다시 안 열림 ⑦ 사람 확정 값으로 기준 다시 놓음 ⑧ 감시·추격자 기록 분리 ⑨ 옛 원장(그날 fence4가 만든 것)은 그날만 예전처럼 엄하게 ⑩ 옛 판 읽기용 done ⑪ 사본 셋 같음
// 시험 자료에 손님 정보 없음(상품 번호만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, o) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || o === undefined ? '' : ' — ' + JSON.stringify(o).slice(0, 300))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SRC = fs.readFileSync(find(['../../cloud/index.js', '../cloud/index.js']), 'utf8');
const MLP = find(['../../readnow-ml-core.js', '../readnow-ml-core.js']); const ML = require(MLP); const MLSRC = fs.readFileSync(MLP, 'utf8');
const PW = fs.readFileSync(find(['../../readnow-price-watch.user.js', '../readnow-price-watch.user.js']), 'utf8');
const MLC = find(['../../cloud/readnow-ml-core.js']);
const T2 = fs.readFileSync(path.join(__dirname, 'tFENCE2.js'), 'utf8'); const fakeDb = new Function(T2.slice(T2.indexOf('function fakeDb()'), T2.indexOf('\n(async () => {')) + '\nreturn fakeDb;')();
const H = 3600e3; const iso = (ms) => new Date(ms).toISOString(); const kd = (ms) => new Date(ms + 9 * H).toISOString().slice(0, 10);
const cA = SRC.indexOf('/* FENCE2-START'), cB = SRC.indexOf('/* FENCE2-END */'); const pA = PW.indexOf('  /* FENCE-PURE-START'), pB = PW.indexOf('  const sameApproval');
const mkCloud = (F) => new Function('db', 'C', 'FV', 'W', SRC.slice(cA, cB) + '\nreturn { fenceTxCloud, fenceReconcile, fenceDay };')(F.db, F.C, F.FV, () => ({ writer: 'cloud' }));
const mkPw = (F) => new Function('db', 'C', 'W', 'kst', PW.slice(pA, pB) + '\nreturn { fenceRun };')(F.db, F.C, () => ({ writer: 'pw' }), (t) => new Date(t + 9 * H).toISOString());
const setNow = async (F, o) => F.C('app_settings').doc('eng_fence_now').set({ at: iso(Date.now() - H), dayLoss: 10000, ...(o || {}) });
const Lget = async (F, day) => (await F.C('eng_fence_ledger').doc(day || kd(Date.now())).get()).data() || {};
const LIM = { ok: true, limit: 10000 };

(async () => { const realNow = Date.now; try {
  console.log('① 24시간 가짜 시계 — 20분마다 상품 하나씩 1,000원 내림 · 이틀');
  { const F = fakeDb(); const CL = mkCloud(F); const T0 = Date.parse('2026-11-10T00:10:00+09:00'); let t = T0; Date.now = () => t; await setNow(F);
    const run = async (n, tag) => { let okN = 0, noN = 0; for (let i = 0; i < n; i++) { t += 20 * 60e3; Date.now = () => t; await setNow(F); const key = `aladin_${tag}${i}`; const r = await CL.fenceTxCloud(ML, 'try', { key, from: 9000, to: 8000, human: 9000, id: key, cmd: key });
      if (r && r.ok) { okN++; await CL.fenceTxCloud(ML, 'settle', { key, id: key, ok: true, price: 8000 }); } else noN++; } return { okN, noN }; };
    const d1 = await run(60, 'a'); const L1 = await Lget(F, '2026-11-10'); ok(d1.okN === 10 && d1.noN === 50 && L1.spent === 10000 && L1.done === 10000, `첫날(11/10): 10번 허락 · 50번 막음 · 오늘 내린 몫 ${L1.spent}원 = 한도(넘은 순간 0)`, { d1, s: L1.spent });
    t = Date.parse('2026-11-11T00:05:00+09:00'); const d2 = await run(60, 'b'); const L2 = await Lget(F, '2026-11-11');
    ok(d2.okN === 10 && L2.v === 2 && L2.spent === 10000 && Object.keys(L2.x).length === 20, `다음 날(11/11): 다시 10번 허락(예전 누적 셈은 0번) · 어제 내린 10권은 기록(a)으로만 이어 받음(원장 상품 ${Object.keys(L2.x).length})`, { d2, s: L2.spent });
    const u = ML.fenceSum(L2); ok(u.expo === 20000 && u.done === 10000, `참고 칸: 내려 둔 값 합 ${u.expo}원(이틀 치) · 한도 셈은 그날 몫 ${u.done}원만`); }

  console.log('② 한국 자정 경계');
  { const F = fakeDb(); const CL = mkCloud(F); let t = Date.parse('2026-11-10T23:58:00+09:00'); Date.now = () => t; await setNow(F);
    const a = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_K', from: 9000, to: 3000, human: 9000, id: 'k1', cmd: 'k1' }); await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_K', id: 'k1', ok: true, price: 3000 });
    ok(a.ok && a.d === 6000, '23:58 6,000원 내림 확정');
    const c = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_K3', from: 9000, to: 5000, human: 9000, id: 'k3', cmd: 'k3' }); ok(c && c.ok && c.need === 10000, `같은 날 6,000 + 4,000 = ${c && c.need}원(한도 딱 · 예약 남김)`);
    t = Date.parse('2026-11-11T00:00:30+09:00'); Date.now = () => t; await setNow(F);
    const d = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_K4', from: 9000, to: 4000, human: 9000, id: 'k4', cmd: 'k4' }); const L = await Lget(F, '2026-11-11');
    ok(d && d.ok && d.need === 4000 + 5000 && L.from === '2026-11-10' && L.x.aladin_K.t === 0 && L.x.aladin_K3.r && L.x.aladin_K3.r.d === 4000, `00:00 새 날: 어제 확정 몫 6,000은 0부터 · 안 끝난 어제 예약 4,000은 오늘 셈에 듦(안전 쪽) → 4,000 + 이번 5,000 = ${d && d.need}원`, d);
    await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_K3', id: 'k3', ok: true, price: 5000 }); const L2 = await Lget(F, '2026-11-11'); const L10 = await Lget(F, '2026-11-10');
    ok(L2.x.aladin_K3.t === 4000 && L2.spent === 4000 && L10.spent === 10000 - 4000, `자정 넘어 끝난 예약은 새 날 몫(${L2.x.aladin_K3.t}원)으로 · 전날 원장은 그대로(${L10.spent}원)`); }

  console.log('③ 여러 기기 동시(클라우드 전략 · 감시기 두 대)');
  { const F = fakeDb(); const CL = mkCloud(F), P1 = mkPw(F), P2 = mkPw(F); Date.now = realNow; await setNow(F);
    const rs = await Promise.all([CL.fenceTxCloud(ML, 'try', { key: 'aladin_C1', from: 9000, to: 5000, human: 9000, id: 'c1', cmd: 'c1' }), P1.fenceRun('try', { key: 'aladin_C2', from: 9000, to: 5000, human: 9000, id: 'c2' }), P2.fenceRun('try', { key: 'aladin_C3', from: 9000, to: 5000, human: 9000, id: 'c3' }), CL.fenceTxCloud(ML, 'try', { key: 'aladin_C4', from: 9000, to: 5000, human: 9000, id: 'c4', cmd: 'c4' })]);
    const L = await Lget(F); const u = ML.fenceSum(L); ok(rs.filter((r) => r && r.ok).length === 2 && u.used === 8000 && u.held === 8000 && L.spent === 0, `4,000원씩 넷이 동시에(한도 1만): 둘만 예약 · 진행 중 ${u.held}원 · 한도를 넘지 않음`);
    const same = await Promise.all([P1.fenceRun('try', { key: 'aladin_S', from: 9000, to: 8000, human: 9000, id: 's1' }), P2.fenceRun('try', { key: 'aladin_S', from: 9000, to: 8000, human: 9000, id: 's2' })]); ok(same.filter((r) => r && r.ok).length === 1, '같은 상품을 두 기기가 동시에 내림 → 하나만(다른 하나는 "아직 끝나지 않음")'); }

  console.log('④ 예약 남음(탭 닫힘)·취소·다른 값으로 받음');
  { const F = fakeDb(); const CL = mkCloud(F), P = mkPw(F); Date.now = realNow; await setNow(F); const day = kd(Date.now());
    const r = await P.fenceRun('try', { key: 'aladin_T', from: 9000, to: 6000, human: 9000, id: 't1' }); ok(r.ok && r.d === 3000, '감시기 예약 3,000원');
    const blk = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_U', from: 9000, to: 1500, human: 9000, id: 'u1', cmd: 'u1' }); ok(!blk.ok && blk.need === 10500, `탭이 닫혀 예약이 남으면 그 몫은 계속 셈(3,000 + 7,500 = ${blk.need} > 한도)`);
    const L0 = await Lget(F); L0.x.aladin_T.r.at = iso(Date.now() - 30 * 60e3); await F.C('eng_fence_ledger').doc(day).set(L0); await F.C('prd_listings').doc('aladin_T').set({ price: 6500, lastSeenAt: iso(Date.now()), status: '판매중', active: true });
    await CL.fenceReconcile(ML, { full: false }); const L1 = await Lget(F); ok(!L1.x.aladin_T.r && L1.x.aladin_T.t === 2500 && L1.spent === 2500, `15분 지나 수집기가 다시 읽은 값(6,500)으로 확정 → 실제로 내린 몫 ${L1.x.aladin_T.t}원만`);
    const c = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_V', from: 9000, to: 7000, human: 9000, id: 'v1', cmd: 'v1' }); await F.C('shp_cmds').doc('v1').set({ status: 'cancel' }); await CL.fenceReconcile(ML, { full: false }); const L2 = await Lget(F);
    ok(c.ok && !L2.x.aladin_V.r && L2.x.aladin_V.t === 0 && L2.spent === 2500, '수정 맡김이 취소되면 예약만 풂(그날 몫 0)');
    const w = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_W', from: 9000, to: 8000, human: 9000, id: 'w1', cmd: 'w1' }); const s = await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_W', id: 'w1', ok: true, price: 7600 }); const L3 = await Lget(F);
    ok(w.ok && s.ok && L3.x.aladin_W.t === 1400, `알라딘이 다른 값(7,600)으로 받으면 실제 몫(${L3.x.aladin_W.t}원)으로 셈`); }

  console.log('⑤ 되돌림 — 올렸다 다시 내림 · 기준보다 위에서 내림');
  { let L = { v: 2, x: {} }; const step = (key, from, to, id, ok0 = true, price) => { const r = ML.fenceTry(L, { key, from, to, human: 9000, id }, LIM); if (r.ok && r.e) { L = { ...L, x: { ...L.x, [key]: r.e } }; L.x[key] = ML.fenceSettle(L, key, id, ok0, price ?? to); } return r; };
    step('aladin_R', 9000, 7000, 'r1'); const up = ML.fenceNote(L, 'aladin_R', null, 9000, null, false); L.x.aladin_R = up; ok(up.t === 2000 && up.a === 0, '엔진이 값을 다시 올려도 그날 몫 2,000원은 돌려받지 않음(안전 쪽)');
    const r2 = step('aladin_R', 9000, 7000, 'r2'); ok(r2.ok && L.x.aladin_R.t === 4000 && ML.fenceSum(L).done === 4000, `올렸다 다시 내리면 또 셈 → 그날 몫 ${L.x.aladin_R.t}원(오르내림 되풀이로 한도를 피하지 못함)`);
    const r3 = ML.fenceTry({ v: 2, x: {} }, { key: 'aladin_Q', from: 12000, to: 8500, human: 9000, id: 'q' }, LIM); ok(r3.ok && r3.d === 500, '정범님 확정 값(9,000)보다 위에서 내린 몫은 손해 아님(12,000 → 8,500 = 500원)');
    const r4 = ML.fenceTry({ v: 2, x: {} }, { key: 'aladin_N', from: 8000, to: 7999, human: 9000, id: 'n' }, { ok: true, limit: 1000 }); ok(r4.ok && r4.d === 1, '새 원장(v2)에서 처음 보는 상품: 이미 확정 값 아래인 몫(어제까지)은 오늘 몫이 아님 — 이번 1원만', r4);
    const r5 = ML.fenceTry({ v: 2, x: { aladin_P: { s: 9000, p: 7000, a: 2000, t: 0 } } }, { key: 'aladin_P', from: 7500, to: 7000, human: 9000, id: 'p' }, LIM); ok(r5.ok && r5.d === 500 && r5.e.r.from === 7500, '부른 쪽이 본 값(7,500)이 원장(7,000)보다 높으면 높은 쪽에서 셈 → 500원(그 사이 다른 길로 내려간 몫도 엔진 몫 · 안전 쪽)', r5); }

  console.log('⑥ 팔림·판매중 아님·실험에서 빠짐 — 한도가 다시 안 열림');
  { const F = fakeDb(); const CL = mkCloud(F); Date.now = realNow; await setNow(F); const day = kd(Date.now()); const t0 = Date.parse(day + 'T00:00:00+09:00'); const join = iso(Date.now() - 3 * 864e5);
    for (const k of ['G1', 'G2', 'G3']) { const r = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_' + k, from: 9000, to: 6000, human: 9000, id: k, cmd: k }); await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_' + k, id: k, ok: true, price: 6000 }); void r; }
    await F.C('prd_listings').doc('aladin_G1').set({ price: 6000, status: '판매완료', active: true }); await F.C('prd_listings').doc('aladin_G2').set({ price: 6000, status: '판매중', active: true }); await F.C('prd_listings').doc('aladin_G3').set({ price: 6000, status: '판매중', active: true });
    const mem = new Map([['st_a1', [{ key: 'aladin_G1', usedCode: 'G1', arm: 'treat', start: 9000, at: join }, { key: 'aladin_G3', usedCode: 'G3', arm: 'treat', start: 9000, at: join }]]]); const sales = new Map([['G1', [{ at: Date.now(), price: 6000 }]]]); void t0;
    const r = await CL.fenceReconcile(ML, { full: true, mem, sales, src: new Map([['st_a1', {}]]) }); const L = await Lget(F);
    ok(!L.x.aladin_G1 && !L.x.aladin_G2 && L.x.aladin_G3 && L.gone === 6000 && L.spent === 9000 && r.spent === 9000 && L.sold === 3000, `팔린 G1·실험에서 빠진 G2는 원장에서 빠져도 그날 몫 6,000원은 gone에 → 오늘 몫 ${L.spent}원 그대로 · 팔린 돈 ${L.sold}원은 참고`, L);
    const nx = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_G4', from: 9000, to: 7999, human: 9000, id: 'g4', cmd: 'g4' }); ok(!nx.ok && nx.need === 10001, '빠진 뒤에도 한도는 그대로 막힘(9,000 + 1,001 > 1만)'); }

  console.log('⑦ 정범님 확정 값으로 기준 다시 놓음');
  { let L = { v: 2, x: {} }; const r = ML.fenceTry(L, { key: 'aladin_H', from: 9000, to: 8000, human: 9000, id: 'h1' }, LIM); L.x.aladin_H = ML.fenceSettle({ ...L, x: { aladin_H: r.e } }, 'aladin_H', 'h1', true, 8000);
    const e = ML.fenceNote(L, 'aladin_H', 6000, 6000, null, false, null, true); L.x.aladin_H = e; ok(e.s === 6000 && e.a === 0 && e.t === 1000 && e.base === 'human', '정범님이 6,000으로 확정 → 기준 6,000 · 사람이 내린 2,000은 손해 아님 · 그 전에 엔진이 내린 1,000은 그날 몫에 그대로');
    const r2 = ML.fenceTry(L, { key: 'aladin_H', from: 6000, to: 5500, human: 6000, id: 'h2' }, LIM); ok(r2.ok && r2.d === 500 && r2.need === 1500, `새 기준 아래로만 셈: 1,000 + 이번 500 = ${r2.need}원`); }

  console.log('⑧ 🛰 감시 자동 반영·🎯 추격자 — 기록 분리(한도 셈 밖)');
  { const F = fakeDb(); const P = mkPw(F); const CL = mkCloud(F); Date.now = realNow; await setNow(F);
    const a = await P.fenceRun('rec', { key: 'aladin_O', from: 9000, to: 2000, human: 9000, src: 'pw:g1', by: 'price-watch:PC', id: 'o1' }); await P.fenceRun('settle', { key: 'aladin_O', id: 'o1', ok: true, price: 2000 });
    const b = await P.fenceRun('rec', { key: 'aladin_O2', from: 9000, to: 4000, human: 9000, src: 'pw:g1', id: 'o2' }); const L = await Lget(F); const u = ML.fenceSum(L);
    ok(a.ok && b.ok && L.x.aladin_O.od === 7000 && L.x.aladin_O.t === 0 && u.ops === 7000 && u.used === 0 && L.ops === 7000, `감시·추격자가 7,000원 내림(+ 진행 중 5,000) → 감시 몫 ${u.ops}원은 기록만 · 연구 한도 셈 ${u.used}원`, L.x);
    const c = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_Z', from: 9000, to: 0 + 1000, human: 9000, id: 'z', cmd: 'z' }); ok(c.ok && c.need === 8000, `감시가 많이 내려도 연구는 자기 몫만(이번 8,000원) — 예전엔 감시 몫과 합쳐 막힘`);
    await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_Z', id: 'z', ok: true, price: 1000 }); const d = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_O', from: 2000, to: 1000, human: 9000, id: 'z2', cmd: 'z2' });
    ok(d.ok && d.need === 9000 && d.d === 1000, `감시가 내린 상품을 연구가 더 내리면 연구 몫(1,000)만 더함 → 8,000 + 1,000 = ${d.need}원(감시 몫 7,000은 안 셈)`, d);
    const L2 = await Lget(F); ok(ML.fenceSum(L2).ops === 7000 && (L2.x.aladin_O.od === 7000), '감시 몫 기록은 연구 셈과 섞이지 않고 그대로');
    const F2 = fakeDb(); const CL2 = mkCloud(F2); await setNow(F2); const day = kd(Date.now()); await F2.C('eng_fence_ledger').doc(day).set({ v: 2, day, gone: 0, opsGone: 0, x: { aladin_O: { s: 9000, p: 2000, a: 7000, t: 0, od: 7000, ops: true, src: 'pw:g1', since: iso(Date.now() - H), r: null } } });
    await F2.C('prd_listings').doc('aladin_O').set({ price: 2000, status: '판매완료', active: true }); await CL2.fenceReconcile(ML, { full: true, mem: new Map(), sales: new Map(), src: new Map() }); const L3 = await Lget(F2, day);
    ok(!L3.x.aladin_O && L3.opsGone === 7000 && L3.spent === 0 && ML.fenceSum(L3).ops === 7000, '감시 상품이 빠져도 그날 감시 몫은 opsGone에 기록(연구 셈 0)'); }

  console.log('⑨ 옛 원장(그날 fence4가 만든 것 · v 없음) — 그날만 예전처럼 엄하게');
  { const L = { day: '2026-11-10', done: 2000, x: { aladin_A: { s: 8000, p: 5000, a: 3000, r: null } } }; const u = ML.fenceSum(L);
    ok(u.done === 5000 && !u.v2, `옛 원장: 팔린 손해 2,000 + 내려 둔 3,000 = ${u.done}원을 그날 몫으로(안전 쪽)`);
    const r = ML.fenceTry(L, { key: 'aladin_B', from: 9000, to: 4000, id: 'b' }, LIM); ok(r.ok && r.need === 10000, `옛 원장의 새 상품은 기준 아래 전체(5,000) — 예전 셈과 같음(${r.need}원)`);
    const R = ML.fenceRoll(L, '2026-11-11', '2026-11-10T15:00:00Z'); ok(R.v === 2 && R.x.aladin_A.t === 0 && R.x.aladin_A.a === 3000 && ML.fenceSum(R).used === 0, '다음 날 새 원장(v2)부터 새 뜻 — 그날 몫 0');
    const Lr = { day: '2026-11-10', done: 0, x: { aladin_P: { s: 9000, p: 9000, a: 0, r: { id: 'x', to: 7000, a: 2000 } } } }; const Rr = ML.fenceRoll(Lr, '2026-11-11'); ok(Rr.x.aladin_P.r.d === 2000 && Rr.x.aladin_P.r.from === 9000 && ML.fenceSum(Rr).held === 2000, '옛 원장의 안 끝난 예약은 새 날에 몫(d)을 채워 이어 받음'); }

  console.log('⑩ 옛 판(아직 안 바뀐 감시기·웹앱)이 읽는 done');
  { const F = fakeDb(); const CL = mkCloud(F); Date.now = realNow; await setNow(F); const r = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_D', from: 9000, to: 6000, human: 9000, id: 'd', cmd: 'd' }); await CL.fenceTxCloud(ML, 'settle', { key: 'aladin_D', id: 'd', ok: true, price: 6000 }); const L = await Lget(F);
    const oldUsed = (+L.done || 0) + Object.values(L.x).reduce((s, e) => s + Math.max(+e.a || 0, (e.r && +e.r.a) || 0), 0); ok(r.ok && L.done === L.spent && oldUsed >= ML.fenceSum(L).used, `v2 원장의 done = 오늘 몫(${L.done}원) → 옛 셈(done + 내려 둔 값)은 새 셈보다 늘 엄함(${oldUsed} ≥ ${ML.fenceSum(L).used})`); }

  console.log('⑪ 사본 셋 같음 · 감시기 머리 그대로');
  { const cut = (s) => { const a = s.indexOf('/* FENCE-PURE-START'), b = s.indexOf('/* FENCE-PURE-END */'); return s.slice(a, b); }; ok(cut(MLSRC) === cut(PW) && (!MLC || fs.readFileSync(MLC, 'utf8') === MLSRC), '학습 공용·감시기·클라우드 사본의 셈이 글자 그대로 같음');
    const orig = (() => { try { return require('child_process').execSync('git show origin/main:readnow-price-watch.user.js', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { return null; } })(); const hd = (s) => s.slice(0, s.indexOf('// ==/UserScript=='));
    if (orig) ok(hd(orig) === hd(PW), '감시기 머리(@version 포함) 그대로'); }
} finally { Date.now = realNow; }
  console.log(bad ? `❌ tFENCE5 실패 ${bad}` : '✓ tFENCE5 모두 통과'); process.exitCode = bad ? 1 : 0;
})().catch((e) => { Date.now = Date.now; console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
