// 🤖 연구 엔진 스스로 돌기(cloud/engself.js · engself1 11/14) 시험 — node src/tests/tENGSELF1114.js
// ① 판매 장부 열어 보기 ② 신선도 ③ 가설 셈(인공 장부로 효과가 있는 날짜 묶음을 찾아냄) ④ 상태 불명→지지→확신·내림(표본·연속·새 자료만 셈)
// ⑤ 배선 단계(멈춤 내림·점수 올림·돈 3단계 R18 울타리·moneyUp 기본 꺼짐) ⑥ 회차 전체(가짜 Firestore · 장부 덧붙이기만 · 판매 장부 다시 받기 · pulse·발견·카드)
const E = require('../../cloud/engself.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const { addD, dowOf } = E._t;
const H = { '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴', '2025-10-03': '개천절', '2025-10-06': '추석', '2025-10-07': '추석', '2025-10-08': '대체', '2025-10-09': '한글날', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석' };
const hol = (k) => H[k] || null;
/* 인공 판매 장부: 날마다 주문 20개(분이 다른 묶음) · 긴 연휴 뒤 3일은 30개(+50%) · 공휴일은 12개 */
function mk(from, to, extra) { const L = []; let i = 0; const post = new Set(); for (const b of E.esBreaks(from, to, hol)) for (const k of [1, 2, 3]) post.add(addD(b.to, k));
  for (let d = from; d <= to; d = addD(d, 1)) { let n = 20 + ((i++ * 7) % 5) - 2; if (post.has(d)) n = 30; if (hol(d)) n = 12; if (extra) n = extra(d, n); for (let j = 0; j < n; j++) { const hh = String(9 + (j % 12)).padStart(2, '0'), mm = String(j).padStart(2, '0'); L.push(['', '', `${d}T${hh}:${mm}:00`, 5000, 1, 'normal', 'aladin'].join('\u0001')); } } return L; }

console.log('① 판매 장부 열어 보기');
const now = Date.parse('2026-11-14T08:00:00Z'); // 한국 17시
const months = [{ ym: '2026-10', rows: mk('2026-10-01', '2026-10-31') }, { ym: '2026-11', rows: mk('2026-11-01', '2026-11-14') }];
const i1 = E.esInspect({ at: '2026-11-14T06:00:00Z' }, months, null, now, {});
ok(i1.st === '✅' && i1.rows > 0 && i1.last.startsWith('2026-11-14') && i1.blank === 0 && !i1.metaStale, `줄 ${i1.rows} · 마지막 ${i1.last} · 빈 칸 0 · 판정 ✅`);
const shr = E.esInspect({ at: '2026-11-14T06:00:00Z' }, [{ ym: '2026-10', rows: months[0].rows.slice(0, 100) }, months[1]], { per: i1.per, rows: i1.rows, last: i1.last }, now, {});
ok(shr.st === '❌' && !shr.use && /줄었음/.test(shr.why[0]), '지난달 줄 수가 줄면 ❌ · 오늘 판정에 안 씀 — ' + shr.why[0]);
const old = E.esInspect({ at: '2026-11-12T00:00:00Z' }, [months[0]], null, now, {});
ok(old.st === '⚠' && old.metaStale && old.use, '마지막 주문 36시간 넘음 ⚠(쓰긴 씀) · 장부 고침 13시간 넘음 → 다시 받기 대상');
const blk = E.esInspect({ at: '2026-11-14T06:00:00Z' }, [{ ym: '2026-11', rows: months[1].rows.map((r, k) => (k % 5 ? r : r.replace('\u00015000\u0001', '\u0001\u0001'))) }], null, now, {});
ok(blk.st === '❌' && /빈 칸/.test(blk.why[0]), '빈 칸 몫 5% 넘으면 ❌ — ' + blk.why[0]);

console.log('② 연구 문서 신선도');
const docs = { 'app_settings/cons_study': { at: '2026-11-14T01:00:00Z' }, 'app_settings/buyback_stats': { at: '2026-11-14T03:00:00Z', a: 1 }, 'ml_buyback_stats/2026-11-13': { at: '2026-11-13T03:00:00Z', a: 1 }, 'app_settings/sp_obs': { at: '2026-11-13T09:00:00Z' }, 'app_settings/voice_study': { at: '2026-11-10T00:00:00Z' } };
const F = Object.fromEntries(E.esFresh(docs, '2026-11-14', now, {}).map((f) => [f.k, f.s]));
ok(F['app_settings/cons_study'] === '✅' && F['app_settings/buyback_stats'] === '🟰' && F['app_settings/sp_obs'] === '⏳' && F['app_settings/voice_study'] === '❌' && F['app_settings/value_model'] === '❓', '✅ 오늘·바뀜 / 🟰 재료 그대로 / ⏳ 셈 전 / ❌ 36시간 / ❓ 없음 — fresh.py와 같음');

console.log('③ 가설 셈');
const L1 = mk('2025-09-26', '2026-11-14');
const J = E.esJudge(L1, hol, {}, {});
const h = Object.fromEntries(J.hyp.map((x) => [x.id, x]));
ok(J.breaks.length === 3 && J.breaks.map((b) => b.from).join() === '2025-10-03,2026-02-14,2026-09-24', '긴 연휴 3개(공휴일 든 4일 넘는 쉼) — ' + J.breaks.map((b) => b.from + '~' + b.to).join(' '));
ok(h.H06.v === '지지' && h.H06.e.eff > 0.3 && h.H06.e.lo > 0 && h.H06.n === 9, `H06 긴 연휴 뒤 3일 지지 · 효과 ${h.H06.e.eff} · 범위 ${h.H06.e.lo}~${h.H06.e.hi} · 표본 ${h.H06.n}`);
ok(h.H04.v === '지지' && h.H04.e.eff < 0, 'H04 공휴일 당일 준다 지지(기대 방향 −)');
ok(h.H10.v === '재료 없음' && h.H13.v !== '반대', '날씨 없으면 재료 없음 · 달 초 효과 없음은 반대 아님');
const J2 = E.esJudge(L1, hol, {}, {}); ok(JSON.stringify(J2.hyp) === JSON.stringify(J.hyp), '씨앗 고정 — 같은 장부면 같은 판정(되풀이해도 같음)');

console.log('④ 상태 바꾸기');
const cfg = { ...E.ES_DEF };
const jS = { id: 'H', kind: 'set', v: '지지', label: '지지', n: 25, e: { eff: 0.2, lo: 0.05, hi: 0.3 }, m: true };
let s = E.esStep(null, { ...jS, n: 5 }, cfg, true, '2026-11-14', '2026-11-13');
ok(s.st === '불명' && s.changed && /표본이 8 아래/.test(s.changed.why), '첫 판정 — 지지 판정이라도 표본 5(기준 8 아래)면 불명');
s = E.esStep(s, jS, cfg, true, '2026-11-15', '2026-11-14'); ok(s.st === '지지' && s.changed.from === '불명', '불명 → 지지(표본 25 · 범위 0 위) · 까닭: ' + s.changed.why);
let k = 0; for (let d = 16; d <= 30; d++) { s = E.esStep(s, jS, cfg, false, `2026-11-${d}`, '2026-11-14'); if (s.st === '확신') k++; }
ok(s.st === '지지' && s.run.k === 2, '새 자료가 없으면 연속 수를 안 늘림(같은 장부로 15번 돌아도 확신 안 됨 · 연속 2)');
for (let d = 1; d <= 5; d++) s = E.esStep(s, jS, cfg, true, `2026-12-0${d}`, `2026-12-0${d}`);
ok(s.st === '확신' && s.changed && s.changed.to === '확신' && /7회 연속/.test(s.changed.why), '새 자료 7회 연속 지지 + 표본 20 넘음 + 범위 여유 → 확신 · ' + s.changed.why);
const sN = E.esStep(E.esStep(null, { ...jS, n: 9, m: false }, cfg, true, 'a', 'a'), { ...jS, n: 9, m: false }, cfg, true, 'b', 'b'); let sx = sN; for (let i = 0; i < 10; i++) sx = E.esStep(sx, { ...jS, n: 9, m: false }, cfg, true, 'c' + i, 'c' + i);
ok(sx.st === '지지' && /표본 9\/20/.test(E.esNext(sx, { ...jS, n: 9, m: false }, cfg)), 'H06처럼 표본 9뿐이면 아무리 이어져도 지지 그대로 — ' + E.esNext(sx, { ...jS, n: 9, m: false }, cfg));
const jU = { ...jS, v: '불명', label: '불명(범위가 0을 걸침)', e: { eff: 0.02, lo: -0.05, hi: 0.08 } };
let t = E.esStep(s, jU, cfg, true, 'x1', 'x1'); t = E.esStep(t, jU, cfg, true, 'x2', 'x2'); ok(t.st === '확신', '확신에서 어긋남 2회는 그대로(3회부터 내림)');
t = E.esStep(t, jU, cfg, true, 'x3', 'x3'); ok(t.st === '지지' && t.changed.from === '확신', '어긋남 3회 연속 → 확신에서 지지로 한 단계만 내림');
for (let i = 4; i <= 6; i++) t = E.esStep(t, jU, cfg, true, 'x' + i, 'x' + i); ok(t.st === '불명', '다시 3회 → 지지에서 불명');
const jO = { ...jS, v: '반대', label: '반대', e: { eff: -0.2, lo: -0.3, hi: -0.1 } }; let u = E.esStep(E.esStep(null, jU, cfg, true, 'a', 'a'), jO, cfg, true, 'b', 'b'); ok(u.st === '반대', '불명 → 반대(표본 넘음)');
{ const m1 = E.esStep(null, { id: 'H7', kind: 'month_rank', v: '지지', label: '지지', n: 1, e: { eff: 0.135, yrs: 1 }, m: false }, cfg, true, 'a', 'a'); ok(m1.st === '지지', '달 순위(표본 = 해 수 1)는 날 수 기준 없이 지지'); let m2 = m1; for (let i = 0; i < 9; i++) m2 = E.esStep(m2, { id: 'H7', kind: 'month_rank', v: '지지', label: '지지', n: 1, e: { eff: 0.135, yrs: 1 }, m: false, mWhy: '달마다 1해뿐' }, cfg, true, 'b' + i, 'b' + i); ok(m2.st === '지지', '한 해뿐이면 확신 안 됨(두 해 넘게)');
  const mF = E.esStep({ st: '불명', run: { v: '지지', k: 1 } }, { id: 'H7', kind: 'month_rank', v: '지지', label: '지지', n: 1, e: {} }, cfg, true, 'c', 'c'); ok(mF.st === '지지' && mF.changed.from === '불명', '0.35.252 첫 회차에 불명으로 남은 H07은 다음 회차에 스스로 지지로 바로잡힘'); }
ok(/0을 걸침/.test(E.esNext({ st: '불명' }, { n: 82, v: '불명', e: { lo: -0.05, hi: 0.06 } }, cfg)), '불명 설명 — 표본이 넉넉하면 범위가 0을 걸친다고(표본 탓으로 적지 않음)');
ok(E.esStep(null, { id: 'H8', kind: 'hour', v: '지지', label: '지지', n: 900, e: { top: '21~23' }, m: false }, cfg, true, 'a', 'a').st === '지지', '시각 가설은 주문 수 표본으로');

console.log('⑤ 배선 단계');
const wd = { id: 'W02', stage: 2, money: true, srcDoc: 'app_settings/cons_study', score: { doc: 'app_settings/x', n: 'n', v: 'v', target: 0, min_n: 30, k_days: 3, down: -0.05 } };
let w = E.esWireStep(wd, null, { fresh: { 'app_settings/cons_study': '❌' }, hyp: {}, score: {} }, cfg, '2026-11-14'); ok(w.st.stage === 1 && w.ch && /멈춤/.test(w.ch.why), '재료 36시간 멈춤 → 1단계(그림자)로');
let ws = { stage: 2, since: '2026-11-01', up: 0, down: 0 }; const gOff = (def, to) => E.esGate(def, to, { noLoss: false, cost: { ok: true, limit: 10000 }, fenceNow: { at: new Date(now).toISOString(), dayLoss: 10000 }, nowMs: now }, cfg);
for (let i = 0; i < 3; i++) { w = E.esWireStep(wd, ws, { fresh: { 'app_settings/cons_study': '✅' }, hyp: {}, score: { W02: { n: 40, v: 0.03 } }, gate: gOff }, cfg, '2026-11-1' + i); ws = w.st; }
ok(ws.stage === 2 && /moneyUp 꺼짐/.test(w.note || ''), '돈 배선 3단계 올림 — 점수가 넘어도 moneyUp 기본 꺼짐이면 막음 · ' + w.note);
const cfgOn = { ...cfg, moneyUp: true }; ws = { stage: 2, since: '2026-11-01', up: 2 };
const gate = (g) => (def, to) => E.esGate(def, to, g, cfgOn);
w = E.esWireStep(wd, ws, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: 0.03 } }, gate: gate({ noLoss: true, nowMs: now }) }, cfgOn, 'd'); ok(w.st.stage === 2 && /무손해/.test(w.note), 'moneyUp 켜도 무손해 모드면 막음');
w = E.esWireStep(wd, { ...ws }, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: 0.03 } }, gate: gate({ noLoss: false, cost: { ok: false, why: '💸 정범님 허락 필요 — 기록 없음' }, nowMs: now }) }, cfgOn, 'd'); ok(w.st.stage === 2 && /허락/.test(w.note), '💸 허락 기록 없으면 막음');
w = E.esWireStep(wd, { ...ws }, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: 0.03 } }, gate: gate({ noLoss: false, cost: { ok: true, limit: 5000 }, fenceNow: { at: '2026-11-01T00:00:00Z', dayLoss: 10000 }, nowMs: now }) }, cfgOn, 'd'); ok(w.st.stage === 2 && /한도/.test(w.note), '하루 손해 한도가 36시간 넘게 낡으면 막음');
w = E.esWireStep(wd, { ...ws }, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: 0.03 } }, gate: gate({ noLoss: false, cost: { ok: true, limit: 5000 }, fenceNow: { at: new Date(now).toISOString(), dayLoss: 10000 }, nowMs: now }) }, cfgOn, 'd'); ok(w.st.stage === 3 && w.ch.from === 2, '모든 울타리 통과일 때만 2 → 3(한 단계만)');
ok(E.esGate(wd, 3, { noLoss: false, cost: { ok: true, limit: 5000 }, fenceNow: { at: new Date(now).toISOString(), dayLoss: 10000 }, nowMs: now }, cfgOn).limit === 5000, '울타리 한도 = 하루 한도와 허락 한도 중 작은 값');
w = E.esWireStep({ ...wd, money: false }, { stage: 3, since: '2026-11-10', up: 2 }, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: 0.03 } } }, cfg, '2026-11-14'); ok(w.st.stage === 3 && /14일/.test(w.note), '4단계는 3단계 14일 뒤');
ws = { stage: 2, since: 'a' }; for (let i = 0; i < 3; i++) { w = E.esWireStep(wd, ws, { fresh: {}, hyp: {}, score: { W02: { n: 40, v: -0.1 } } }, cfg, 'e' + i); ws = w.st; } ok(ws.stage === 1, '대조 손해 3일 연속 → 한 단계 내림');
w = E.esWireStep({ id: 'W03', stage: 2, hyp: ['H06'] }, null, { fresh: {}, hyp: { H06: '불명' } }, cfg, 'f'); ok(w.st.stage === 1 && /근거 가설/.test(w.ch.why), '근거 가설이 지지 아래로 → 한 단계 내림');
w = E.esWireStep({ id: 'W05', stage: 0, srcDoc: 'app_settings/extras_study' }, null, { fresh: { 'app_settings/extras_study': '✅' }, hyp: {} }, cfg, 'g'); ok(w.st.stage === 1, '후보(0)는 재료가 살아 있으면 그림자(1)로 — 판단은 안 바뀜');
{ let q = { stage: 1, since: 'a' }; const dW = { id: 'W08', stage: 1, money: true, score: { min_n: 30, k_days: 2 } }; for (let i = 0; i < 2; i++) { const r = E.esWireStep(dW, q, { fresh: {}, hyp: {}, score: { W08: { kind: 'eff30', n: 40, v: 0.02, hiv: 0.2 } } }, cfg, 'k' + i); q = r.st; } ok(q.stage === 2, 'wire1 대조 점수(eff30 아래 끝 > 0) 2일 연속 → 1 → 2(돈 배선이라도 3 아래는 울타리 없이)');
  let q2 = { stage: 2, since: 'a' }; for (let i = 0; i < 3; i++) q2 = E.esWireStep(dW, q2, { fresh: {}, hyp: {}, score: { W08: { kind: 'eff30', n: 40, v: -0.3, hiv: -0.1 } } }, cfg, 'm' + i).st; ok(q2.stage === 1, 'eff30 위 끝 < 0(대조 손해) 3일 → 한 단계 내림'); }
ws = { stage: 2 }; for (let i = 0; i < 3; i++) { w = E.esWireStep({ id: 'W04', stage: 2, reads: ['web:W04'] }, ws, { fresh: {}, hyp: {}, reads: { W04: 0 } }, cfg, 'h' + i); ws = w.st; } ok(/3일째/.test(w.fix || ''), '읽은 횟수 0이 3일 → 고칠 일 알림');

console.log('⑥ 회차 전체(가짜 Firestore)');
(async () => {
  const DB = new Map(); const key = (c, d) => c + '/' + d;
  const C = (c) => ({ doc: (d) => ({ get: async () => { const v = DB.get(key(c, d)); return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined), id: d }; }, set: async (v, o) => { const und = (x, p) => { if (x === undefined) throw new Error('undefined 값: ' + p); if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) und(y, p + '.' + k); }; und(v, c + '/' + d); /* 진짜 Firestore처럼 undefined를 거절(0.35.250 첫 회차 실패를 시험이 못 잡았음) */ const cur = (o && o.merge && DB.get(key(c, d))) || {}; DB.set(key(c, d), JSON.parse(JSON.stringify({ ...cur, ...v }))); } }),
    get: async () => { const L = [...DB.entries()].filter(([k]) => k.startsWith(c + '/')).map(([k, v]) => ({ id: k.slice(c.length + 1), data: () => v })); return { forEach: (f) => L.forEach(f), size: L.length }; },
    orderBy: () => ({ limit: (n) => ({ get: async () => { const L = [...DB.entries()].filter(([k]) => k.startsWith(c + '/')).sort((a, b) => (a[1].at < b[1].at ? 1 : -1)).slice(0, n).map(([k, v]) => ({ id: k.slice(c.length + 1), data: () => v })); return { forEach: (f) => L.forEach(f) }; } }) }) });
  const byM = {}; for (const r of L1) { const ym = r.split('\u0001')[2].slice(0, 7); (byM[ym] = byM[ym] || []).push(r); } for (const [ym, rows] of Object.entries(byM)) DB.set('ml_sales/' + ym, { ym, rows });
  DB.set('ml_sales/_meta', { at: '2026-11-13T00:00:00Z' }); DB.set('app_settings/cons_study', { at: '2026-11-14T01:00:00Z' });
  DB.set('app_settings/research_pulse', { studies: { N05: { trend: [{ d: '2026-11-13', v: 0.5 }] }, R02: { value: 1 } } });
  let T = now; const calls = { ml: 0, pulse: [], found: [], notes: [] };
  const ES = E.makeEngSelf({ C, FV: {}, W: () => ({}), log: () => {}, nowIso: () => new Date(T).toISOString(), now: () => T, hol,
    mlLedger: async () => { calls.ml++; DB.set('ml_sales/_meta', { at: new Date(T).toISOString() }); return { n: 1 }; },
    pulse: async (P, by) => { calls.pulse.push({ P, by }); const rp = DB.get('app_settings/research_pulse'); rp.studies = { ...rp.studies, ...P.studies }; return { n: 1 }; },
    found: async (r) => calls.found.push(r), notes: async (ops) => calls.notes.push(ops), ml: async () => ({ fenceNoLoss: () => true, fenceCostOk: () => ({ ok: false, why: '💸 정범님 허락 필요' }) }),
    wireDefs: () => [{ id: 'W02', stage: 2, money: true, srcDoc: 'app_settings/cons_study' }, { id: 'W05', stage: 0, srcDoc: 'app_settings/extras_study' }] });
  T = Date.parse('2026-11-14T05:00:00Z'); const r0 = await ES.run(); ok(r0.skip && /16시 전/.test(r0.skip), '16시 전에는 안 돎(하루 한 번 · 소비심리·수요 지수 셈 뒤)');
  T = now; const r1 = await ES.run(); const S1 = DB.get('app_settings/eng_self');
  ok(r1.rid && calls.ml === 1 && S1.saw.ledger.st === '✅', '장부 고침이 13시간 넘게 멈춰 mlLedger를 스스로 다시 부름 → 다시 열어 ✅');
  ok(S1.hs.H06.st === '지지' && S1.hs.H06.next.includes('확신까지'), 'H06 지지 · ' + S1.hs.H06.next);
  ok([...DB.keys()].filter((k) => k.startsWith('eng_ledger/')).length === 1 && DB.get('eng_ledger/' + r1.rid).changes.length >= 14, '장부 eng_ledger에 오늘 줄 하나 · 첫 판정 14개(무엇·왜)');
  const pu = calls.pulse[0]; ok(pu && pu.P.studies.N05 && pu.P.studies.N05.trend.length === 2 && /엔진 스스로/.test(pu.P.studies.N05.note) && pu.by === 'engine:engself', 'research_pulse N05 — 지난 추세에 오늘을 더해 올림 · 다른 연구 칸(R02)은 그대로');
  ok(DB.get('app_settings/research_pulse').studies.R02.value === 1, '다른 연구 진화 기록은 안 건드림');
  ok(DB.get('app_settings/eng_wire_stage').w.W05.stage === 0 && DB.get('app_settings/eng_wire_stage').w.W02.stage === 2, '배선 — 재료 문서 없는 후보는 그대로 · 돈 배선 단계 그대로');
  const r2 = await ES.run(); ok(r2.skip === 1, '같은 날 두 번째는 건너뜀');
  const r3 = await ES.run({ force: true }); ok(r3.rid && [...DB.keys()].filter((k) => k.startsWith('eng_ledger/')).length === 2, '지금 한 번(force)은 장부 새 줄로 덧붙임(앞 줄 덮지 않음)');
  ok(DB.get('app_settings/eng_self').hs.H06.run.k === 1, '같은 장부로 다시 돌면 연속 수를 안 늘림');
  /* 다음 날 — 지난달 줄이 줄어든 장부 → 판정 안 씀 · 이틀째면 카드 */
  DB.set('ml_sales/2026-10', { ym: '2026-10', rows: byM['2026-10'].slice(0, 50) }); T = now + 864e5; await ES.run(); const S3 = DB.get('app_settings/eng_self');
  ok(S3.saw.ledger.st === '❌' && S3.hs.H06.st === '지지' && S3.alerts.some((a) => a.lv === '🚨') && calls.notes.length === 0, '줄어든 장부는 판정에 안 씀(상태 그대로) · 🚨 알림 · 첫날은 카드 안 냄');
  T = now + 2 * 864e5; await ES.run(); ok(calls.notes.length === 1 && calls.notes[0][0].data.kind === 'card', '이틀째 그대로면 📓 카드 한 장');
  { const ES2 = E.makeEngSelf({ C: (c) => ({ doc: () => ({ get: async () => { if (c === 'ml_sales') throw new Error('읽기 실패'); return { exists: false, data: () => undefined }; }, set: async () => {} }), get: async () => { throw new Error('읽기 실패'); } }), W: () => ({}), log: () => {}, nowIso: () => new Date(T).toISOString(), now: () => T });
    let e1 = null; try { await ES2.run({}); } catch (e) { e1 = e; } const r9 = await ES2.run({}); ok(e1 && r9.skip && /1시간 쉼/.test(r9.skip), '회차가 실패하면 1시간 쉼(10분마다 되풀이 안 함) · 지금 한 번(force)은 그대로'); }
  const d = await ES.diag({}); ok(d.self && d.wires && Array.isArray(d.ledger) && d.ledger.length === 4, '진단 engself=1 — 요약·배선·장부 줄');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tENGSELF1114 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e.stack); process.exit(1); });
