// 💲 판정 엔진 배움(cloud/judge.js · engimp1 11/19 · 정범님 j1118eng3) 시험 — node src/tests/tJUDGE1119.js
// ① 규칙 이름·장부 줄(판매자 칸 없음) ② 결과 붙이기(7·14·30일·닫음·따랐나) ③ 채점(AUC·ECE 아직 모름·규칙 표 같은 칸 짝) ④ 다시 판정(가격 코어 그대로 → 같은 판정)
// ⑤ 창 판정·올림 조건 ⑥ 무손해 동안 제안만 ⑦ 가짜 Firestore로 하루 돌림 — 첫 실행 모두 담음 · 같은 지문은 같음+1 · 지우지 않음 · 카드 부탁(올림·되돌리기) · 울타리
const J = require('../../cloud/judge.js');
const PR = require('../../readnow-pricing-core.js');
const ML = require('../../readnow-ml-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const DAY = 864e5; let T = Date.parse('2026-11-19T03:00:00Z'); // 한국 12시
const iso = (ms) => new Date(ms).toISOString();

function fakeDb() { const M = new Map(); const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const deep = (a, b) => { const r = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) r[k] = v && typeof v === 'object' && !Array.isArray(v) && r[k] && typeof r[k] === 'object' && !Array.isArray(r[k]) ? deep(r[k], v) : clone(v); return r; };
  const snap = (k) => ({ exists: M.has(k), id: k.split('/')[1], data: () => clone(M.get(k)), get: (f) => (M.get(k) || {})[f] });
  const ref = (c, id) => ({ _k: c + '/' + id, get: async () => snap(c + '/' + id), set: async (v, o) => { const k = c + '/' + id; M.set(k, o && o.merge ? deep(M.get(k), v) : clone(v)); } });
  const query = (c, st) => ({ select: () => query(c, st), where: (f, op, v) => query(c, { ...st, w: [f, op, v] }), orderBy: (f) => query(c, { ...st, o: f }), limit: (n) => query(c, { ...st, n }), startAfter: (x) => query(c, { ...st, sa: x }),
    get: async () => { let L = [...M.keys()].filter((k) => k.startsWith(c + '/')).map(snap); if (st.w) L = L.filter((d) => (st.w[1] === '>' ? d.get(st.w[0]) > st.w[2] : true)); const key = st.o === 'at' ? (d) => d.get('at') : (d) => d.id; L.sort((a, b) => (key(a) < key(b) ? -1 : 1));
      if (st.sa != null) { const sv = key(st.sa); L = L.filter((d) => key(d) > sv); } L = L.slice(0, st.n || 1e9); return { docs: L, size: L.length }; } });
  const C = (c) => ({ doc: (id) => ref(c, id), ...query(c, {}) });
  const db = { getAll: async (...a) => { const refs = a.filter((x) => x && x._k); return refs.map((r) => snap(r._k)); } };
  return { M, C, db }; }

// 시장 한 쪽 — 우리 + 유효 판매자 셋
const OURS = PR.DEFAULTS ? PR.DEFAULTS.ourSeller : '996008';
function mkDec(key, ourPrice, others, S, at) { const rows = [{ rank: 1, sellerName: 'A', sellerCode: '11', grade: '상', price: others[0], ship: 2500, listingId: 'l1', usedCode: 'x1', soldOut: false }, { rank: 2, sellerName: 'B', sellerCode: '12', grade: '상', price: others[1], ship: 2500, listingId: 'l2', usedCode: 'x2', soldOut: false },
  { rank: 3, sellerName: '우리', sellerCode: String(OURS), grade: '상', price: ourPrice, ship: 2500, listingId: 'l3', usedCode: key.replace('aladin_', ''), soldOut: false }, { rank: 4, sellerName: 'C', sellerCode: '13', grade: '중', price: others[2], ship: 2500, listingId: 'l4', usedCode: 'x4', soldOut: false }];
  const reg = iso(at - 40 * DAY); const listing = { key, usedCode: key.replace('aladin_', ''), price: ourPrice, ship: 2500, registeredAt: reg, lowest: null, grade: '상', sku: 'A01', title: '책', status: '판매중' };
  const market = { at: iso(at), pagesSeen: 1, lastPage: 1, rows: rows.map((r) => ({ ...r })), recentGone: [] };
  const o = PR.decide(listing, market, {}, { now: at, settings: S, classify: (r) => ({ cls: 'green', why: '시험' }) });
  const c = (r) => (String(r.sellerCode) === String(OURS) ? 'ours' : 'green');
  return { key, usedCode: listing.usedCode, at: iso(at), sig: `${o.status}|${o.action}|${o.target}|x`, status: o.status, action: o.action, current: ourPrice, target: o.target ?? null, ref: o.ref || null, floors: o.floors || null, grade: '상', group: o.group || 'treat', autoBlock: o.autoBlock || [],
    rows: rows.map((r) => ({ rank: r.rank, sc: r.sellerCode, grade: r.grade, price: r.price, ship: r.ship })), counts: { all: rows.length }, tier: o.tier, lowest: null, sku: 'A01', title: '책', page1: rows.map((r) => ({ r: r.rank, sc: r.sellerCode, g: r.grade, p: r.price, s: r.ship, c: c(r), lid: r.listingId, uc: r.usedCode, so: r.soldOut })) }; }

(async () => {
  console.log('① 규칙 이름·장부 줄');
  ok(J.ruleOf({ status: 'skip' }) === 'skip' && J.ruleOf({ status: 'wait', action: 'none' }) === 'w:wait' && J.ruleOf({ status: 'ok', action: 'none' }) === 'keep', 'skip · w:wait · keep');
  ok(J.ruleOf({ status: 'ok', action: 'set', ref: { conv: 1 } }) === 'conv' && J.ruleOf({ status: 'ok', action: 'set', ref: { isFirst: true } }) === 'tieTop' && J.ruleOf({ status: 'ok', action: 'set', ref: {} }) === 'tieTotal' && J.ruleOf({ status: 'floor', action: 'set' }) === 'floor', 'conv · tieTop · tieTotal · floor');
  const r0 = J.rowOf({ key: 'aladin_1', usedCode: '1', at: iso(T), sig: 's', status: 'ok', action: 'set', current: 10000, target: 9000, rows: [{ price: 9000, sc: '11', name: '가게' }, { price: 9500 }], autoBlock: [] }, null, null, null, 0.108);
  ok(r0.low === 9000 && r0.auto === 1 && r0.rule === 'tieTotal' && !('name' in r0) && !('sc' in r0) && J.COLS.every((k) => k in r0), '줄: 최저 9000 · 자동 · 판매자 이름·코드 칸 없음 · 칸 이름 모두');
  const cols = J.toCols([r0, r0]); ok(J.fromCols(cols).length === 2 && cols.k.length === 2, '칸 묶음 ↔ 줄 되돌림');

  console.log('② 결과 붙이기');
  const at0 = T - 20 * DAY; const sales = new Map([['1', [{ at: at0 + 3 * DAY, price: 8800 }]]]);
  let r = { uc: '1', at: iso(at0), act: 'set', tgt: 9000 }; J.outcome(r, sales, T, 9000); ok(r.o7 === 1 && r.o14 === 1 && r.o30 === 1 && r.od === 3 && r.op === 8800 && r.oc === 1 && r.fol === 1, '3일째 팔림 → o7·o14·o30 1 · 닫음 · 따름');
  r = { uc: '2', at: iso(at0), act: 'set', tgt: 9000 }; J.outcome(r, new Map(), T, 9900); ok(r.o7 === 0 && r.o14 === 0 && r.o30 == null && r.oc == null && r.fol === 0, '20일 안 팔림 → o7·o14 0 · o30 아직 · 열림 · 14일 넘게 안 따름');
  r = { uc: '3', at: iso(T - 61 * DAY), act: 'none' }; J.outcome(r, new Map(), T, null); ok(r.o30 === 0 && r.oc === 1, '60일 → 닫음');
  r = { uc: '4', at: iso(T - 95 * DAY) }; J.outcome(r, new Map(), T, null); ok(r.oc === 2 && r.o7 == null, '판매 장부 90일보다 옛 → 모름으로 닫음(2)');

  console.log('③ 채점');
  ok(Math.abs(J.auc([0.1, 0.4, 0.35, 0.8], [0, 0, 1, 1]) - 0.75) < 1e-9, 'AUC 0.75(손 셈과 같음)');
  { const few = Array.from({ length: 40 }, (_, i) => ({ at: iso(T - 10 * DAY), pCur: 0.3, o7: i % 3 ? 0 : 1, rule: 'keep', grp: 'treat', gr: '상' })); const s = J.score(few, T); ok(s.value.unknown && s.value.ece == null && s.value.need.want === 60, '결과 40줄 → 아직 모름 · 필요 60');
    const many = []; for (let i = 0; i < 400; i++) { const p = (i % 10) / 10 + 0.05; many.push({ at: iso(T - 20 * DAY), pCur: p, o7: (i * 7919 % 100) / 100 < p ? 1 : 0, o14: i % 2, rule: i % 4 ? 'keep' : 'tieTop', grp: 'treat', gr: '상' }); }
    const s2 = J.score(many, T); ok(s2.value.ece != null && s2.value.ece < 0.1 && s2.value.auc > 0.7, `ECE ${s2.value.ece} · AUC ${s2.value.auc} — 잘 맞는 예측`);
    const tt = s2.rules.find((x) => x.rule === 'tieTop'), kp = s2.rules.find((x) => x.rule === 'keep'); ok(kp.verdict === '기준(유지)' && tt.pairN >= 20 && ['좋음', '비슷', '나쁨'].includes(tt.verdict) && tt.need, `규칙 표: 유지 = 기준 · tieTop 같은 칸 짝 ${tt.pairN} → ${tt.verdict}`);
    ok(s2.rulers.c.includes('0') && s2.regret.note.includes('추정'), '다 실험 = 0 · 후회 셈은 추정'); }

  console.log('④ 다시 판정');
  const S = {}; const d1 = mkDec('aladin_501', 12000, [10000, 10500, 9000], S, T - DAY);
  const b = J.replay(PR, d1, S); ok(J.sameDec(b, d1), `기록 그대로 다시 판정 → 같은 판정(${d1.status}/${d1.action}/${d1.target})`);
  const S2 = J.setKnob(S, 'gradeCoef.중', 0.95); ok(J.getKnob(S2, 'gradeCoef.중') === 0.95 && J.getKnob(S, 'gradeCoef.중') === 0.85 && S.gradeCoef === undefined, '손잡이 바꾼 설정은 사본(바탕 그대로)');
  ok(J.stepTo('gradeCoef.상', 1.0, 1) === null && J.stepTo('gradeCoef.상', 0.95, -1) === 0.94 && J.stepTo('queueGapMult', 3, 1) === 3.5, '한 칸 · 범위 밖은 없음');

  console.log('⑤ 창 판정·올림 조건');
  const good = { win: [0, 1, 2].map((i) => ({ i, n: 100, m: 12, sold: 4, vB: 100, vC: 104, qB: 10, qC: 10.2, br: 0 })) }; const md = { ece: 0.03, auc: 0.62 };
  ok(J.candEval(good, 3, md).ok, '3창 연속 +4% · 맞춘 36 · 팔림 12 · 예측 믿음 · 넘음 0 → 올릴 만함');
  ok(!J.candEval(good, 2, md).ok, '오늘 창(아직 안 찬 창)은 안 셈');
  ok(!J.candEval(good, 3, { ece: 0.09, auc: 0.62 }).ok && J.candEval(good, 3, { ece: 0.09, auc: 0.62 }).no.some((x) => x.includes('ECE')), '예측을 못 믿으면 안 올림');
  const br = JSON.parse(JSON.stringify(good)); br.win[1].br = 1; ok(!J.candEval(br, 3, md).ok, '울타리 넘음 1 → 안 올림');
  const ql = JSON.parse(JSON.stringify(good)); ql.win.forEach((w) => { w.qC = 9; }); ok(!J.candEval(ql, 3, md).ok, '판매율이 낮아지면 안 올림');

  console.log('⑥ 무손해 동안 제안만');
  ok(!J.autoOk(true, '2026-01-01', '2026-11-19', 'auto').ok, '무손해 모드 → 제안만');
  ok(!J.autoOk(false, '2026-11-01', '2026-11-19', 'auto').ok, '장부 18일째 → 제안만');
  ok(J.autoOk(false, '2026-10-01', '2026-11-19', 'auto').ok && !J.autoOk(false, '2026-10-01', '2026-11-19', 'propose').ok, '30일 넘고 무손해 꺼짐 → 스스로 · 설정 「제안만」이면 제안');
  ok(!J.fenceLocal(10000, 6000, {}).ok && !J.fenceLocal(10000, 16000, {}).ok && J.fenceLocal(10000, 9000, {}).ok && !J.fenceLocal(10000, 9000, {}, { floor: 9500 }).ok && !J.fenceLocal(1000, 1400, {}, { others: [100, 120, 130] }).ok, '울타리: 30% 넘게 내림·50% 넘게 올림·하한 밑·터무니없는 값 막음');
  if (PR.fence) ok(['drop', 'raise', 'floor'].every((w, i) => PR.fence(10000, [6000, 16000, 9000][i], {}, { floor: 9500 }).why === w) && PR.fence(10000, 9800, {}, { floor: 9500 }).ok, '가격 코어 fence = 같은 셈(⑦ 값 주인 하나)');

  console.log('⑦ 가짜 Firestore로 하루 돌림');
  { const { M, C, db } = fakeDb(); const logs = []; const keys = []; for (let i = 0; i < 30; i++) { const k = 'aladin_' + (700 + i); keys.push(k); const d = mkDec(k, 11000 + i * 100, [10000, 10400, 9000], {}, T - (25 - (i % 5)) * DAY); M.set('prd_price_decisions/' + k, d); }
    M.set('prd_system/pricing', { engine: {} }); M.set('app_settings/eng_fence', { noLossMode: true }); M.set('app_settings/ml_eval_sum', { day: '2026-11-18', proxy: { rows: 1234, obs: 900, goneSaleP: 0.42, used: true } });
    const mrows = keys.map((k, i) => ({ key: k, price: 11000 + i * 100, grade: 0, age: 40, list: 20000, sp: 3, used: 4, p1: 4, rank: 3, top: 0, sameMin: 10000, minAll: 9000, mkt: 0.5 }));
    const Mdl = ML.train(mrows.map((r) => ML.feats(r)), mrows.map((_, i) => (i % 3 ? 0 : 1)), { iters: 50 }); M.set('ml_models/m1', Mdl); M.set('app_settings/ml_state', { lastDay: '2026-11-18', model: { champion: 'm1' } });
    const salesM = new Map([[keys[0].replace('aladin_', ''), [{ at: T - 22 * DAY, price: 10000 }]]]);
    const mk = () => J.makeJudge({ C, db, FV: {}, W: () => ({ by: 'cloud:시험' }), log: (...a) => logs.push(a.join(' ')), nowIso: () => iso(T), pr: async () => PR, ml: async () => ML, sales: async () => salesM, now: () => T, mlCols: async () => mrows, decOk: (d) => ML.engDecOk(d) });
    const JG = mk(); const r1 = await JG.run({ by: 'test' }); const s1 = M.get('app_settings/eng_judge');
    ok(!r1.err && s1 && s1.rows === 30 && s1.today.added === 30 && s1.ledgerStart === '2026-11-19', `첫 실행 모두 담음: ${s1 && s1.rows}줄`);
    const sh0 = M.get('eng_judge_days/2026-11-19_00'); ok(sh0 && sh0.n === 30 && sh0.cols.k.length === 30 && !('name' in sh0.cols) && sh0.cols.pCur.every((x) => x != null), '장부 조각 30줄 · 판매확률 칸 채움 · 판매자 이름 칸 없음');
    ok(s1.proxy && s1.proxy.n === 1234 && s1.proxy.goneSaleP === 0.42, '헌장 제43조: 대리 표본 수·사라짐 보정 확률 함께');
    const first = J.fromCols(sh0.cols).find((x) => x.k === keys[0]); ok(first.o7 === 1 && first.oc === 1, '팔린 상품 결과 붙음');
    const shd = M.get('app_settings/eng_judge_shadow'); ok(shd && shd.cands.length === 3 && shd.cands.every((x) => x.state === '도는 중') && shd.fidN === 30, `그림자 도전자 셋 · 다시 판정 ${shd && shd.fidN}개 · 맞음 ${shd && shd.fidelity}`);
    ok(shd.fidelity === 1, '가격 코어 그대로 → 다시 판정이 기록과 모두 같음');
    ok(s1.self && s1.self.mode === '제안만' && /무손해/.test(s1.self.why), '무손해 모드 → 제안만');
    // 다음 날: 같은 지문 다시 판정 → 같음 +1 · 새 줄 없음
    T += DAY; for (const k of keys.slice(0, 5)) { const d = M.get('prd_price_decisions/' + k); d.at = iso(T - 3600e3); M.set('prd_price_decisions/' + k, d); }
    const k9 = keys[9]; { const d = M.get('prd_price_decisions/' + k9); d.at = iso(T - 3600e3); d.sig = 'bad|x'; d.status = 'wait'; d.action = 'none'; M.set('prd_price_decisions/' + k9, d); }
    const JG2 = mk(); const r2 = await JG2.run({ by: 'test' }); const s2 = M.get('app_settings/eng_judge');
    ok(s2.rows === 31 && s2.today.added === 1 && s2.today.same === 5, `다음 날: 새 1줄(지문 바뀜) · 같음 +1 다섯 · 전체 ${s2.rows}`);
    const all0 = J.fromCols(M.get('eng_judge_days/2026-11-19_00').cols); ok(all0.length === 30 && all0.filter((x) => x.same === 1).length === 5, '어제 조각은 지우지 않고 같음만 +1');
    ok(M.has('eng_judge_days/2026-11-20_00') && M.get('eng_judge_days/2026-11-20_00').cols.rule[0] === 'w:wait', '오늘 조각에 바뀐 판정 한 줄');
    // 카드 부탁: 제안 올림 — 제안 하나를 「올릴 만함」으로 만들어 두고
    const sh = M.get('app_settings/eng_judge_shadow'); const x = sh.cands.find((c) => c.knob === 'gradeCoef.중'); x.state = '올릴 만함'; x.propAt = '2026-11-20'; M.set('app_settings/eng_judge_shadow', sh);
    M.set('app_settings/eng_judge_cfg', { ...(M.get('app_settings/eng_judge_cfg') || {}), req: { at: iso(T), op: 'apply', id: x.id } });
    const JG3 = mk(); const r3 = await JG3.tick(); ok(r3 && !r3.err, '카드 부탁은 하루 한 번과 따로 바로 돎');
    const pri = M.get('prd_system/pricing'); ok(pri.engine.gradeCoef && pri.engine.gradeCoef['중'] === x.to, `손잡이 올림: gradeCoef.중 ${x.from} → ${pri.engine.gradeCoef && pri.engine.gradeCoef['중']}`);
    const cf = M.get('app_settings/eng_judge_cfg'); const lg = cf.log.find((e) => e.knob === 'gradeCoef.중' && e.by === 'card'); ok(lg && cf.reqDone === iso(T), '기록 남김 · 부탁 처리 표시');
    ok(M.get('app_settings/eng_judge_shadow').rev.some((v) => v.knob === 'gradeCoef.중' && v.state === '도는 중'), '올린 뒤 14일 거꾸로 그림자 시작');
    // 되돌리기
    T += 60e3; M.set('app_settings/eng_judge_cfg', { ...M.get('app_settings/eng_judge_cfg'), req: { at: iso(T), op: 'undo', id: lg.id } }); await mk().tick();
    ok(M.get('prd_system/pricing').engine.gradeCoef['중'] === x.from && M.get('app_settings/eng_judge_cfg').rest['gradeCoef.중'], `카드 되돌리기 → ${x.from} · 30일 쉼`);
    ok(M.get('app_settings/eng_judge_days') === undefined && [...M.keys()].filter((k) => k.startsWith('eng_judge_days/')).length === 2, '장부 조각 둘 그대로(지우지 않음)');
    // 범위 밖 값은 못 씀
    let thrown = null; try { await J.makeJudge({ C, db, W: () => ({}), log: () => {}, nowIso: () => iso(T) }).run; } catch (e) { thrown = e; } ok(!thrown, '빈 도우미로도 만들어짐');
    const d = await JG3.diag(); ok(d.rows === 31 && Array.isArray(d.rules) && d.shadow.length >= 1, '진단 요약');
    const smp = await JG3.diag('sample'); ok(smp.rows.length && smp.rows.every((x) => x.k.endsWith('…')), '진단 표본은 열쇠 앞 8자만'); }

  // ⑦ 값 주인 하나 — 가격 코어 fence(있으면)가 장부 안 셈과 같은 답
  if (typeof PR.fence === 'function') { let diff = 0, n = 0; let s = 7; const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) { const cur = Math.round(1000 + rnd() * 20000); const v = rnd() < 0.05 ? null : Math.round(cur * (0.4 + rnd() * 1.4)); const others = Array.from({ length: Math.floor(rnd() * 6) }, () => Math.round(rnd() * 15000)); const S0 = rnd() < 0.5 ? {} : { maxAutoDropPct: 0.2, maxAutoRaisePct: 0.3, insaneMult: 2 }; const o = { others, floor: rnd() < 0.3 ? Math.round(cur * 0.8) : null };
      n++; if (JSON.stringify(PR.fence(cur, v, S0, o)) !== JSON.stringify(J.fenceLocal(cur, v, S0, o))) diff++; }
    ok(diff === 0, `⑦ 가격 코어 fence = 장부 안 셈 (${n}개 중 다름 ${diff})`); } else console.log('  · 가격 코어에 fence 없음(옛 판) — 장부 안 셈만 씀');

  console.log(bad ? `❌ 실패 ${bad}` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
