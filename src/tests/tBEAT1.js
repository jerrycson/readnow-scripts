// tBEAT1 — 📦 발송 요청 읽기(⏰ 간격 칸 prd:shipRead) 사람다운 박자 모의 실행 (11/16 · 카드 n1115beat · coord/MONDAY_1116.md §3)
//  일정표 공용(readnow-autosched-core.js due())과 수집기의 실제 박자 함수(readnow-collector.src.js 'SHIP_BEAT 시작'~'SHIP_BEAT 끝')를 그대로 꺼내
//  PC 셋(JS-MAIN 담당 · HOME · MJ-MAIN 등록 PC)이 24시간을 지나는 것을 흉내 — 수집기 schedTick처럼 PC마다 1분에 한 번(PC마다 다른 초).
//  두 방식: Ⓐ 공유 회차(실제와 같음 — 같은 회차 열쇠는 먼저 잡은 PC 하나 · schedStart 트랜잭션) Ⓑ PC마다 따로(옛 모의 tLR_sat_human2와 같은 셈 — 가장 나쁜 경우)
//  앞(박자 없음 = 고치기 전 수집기와 같음)과 뒤(박자 있음)를 같은 틀로 재서 표로 냄.
//  쓰는 법: node src/tests/tBEAT1.js [일정표.json]   (일정표가 없으면 11/14 사본 모양의 발송 요청 칸 하나로 — 창·요일 없음 · 15분)
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const AS = (() => { const m = require(path.join(ROOT, 'readnow-autosched-core.js')); return m.AS || m; })();
const SRC = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
const i0 = SRC.indexOf('  const SHIP_BEAT = '), i1 = SRC.indexOf('/* SHIP_BEAT 끝 */');
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log(c ? '  ✓' : '  ❌', m); };
if (i0 < 0 || i1 < 0) { console.log('❌ 수집기에서 SHIP_BEAT 묶음을 못 찾음'); process.exit(1); }
const { SHIP_BEAT, shipBeatGate } = new Function(SRC.slice(i0, i1) + '\nreturn { SHIP_BEAT, shipBeatGate };')();
const DOCf = process.argv[2] || ['/home/user/readnow-chats/tools/session-kit/pw/fixtures/autosched_1114.json'].find((p) => fs.existsSync(p));
let doc; if (DOCf) { const d0 = JSON.parse(fs.readFileSync(DOCf, 'utf8')); doc = { ...d0, on: true, slots: (d0.slots || []).filter((s) => s.job === 'prd:shipRead') }; }
if (!doc || !doc.slots.length) doc = { on: true, slots: [{ id: 'shipRead', job: 'prd:shipRead', on: true, name: '📦 발송 요청 읽기', trig: { t: 'every', min: 15 }, win: null, days: null }] };
const S0 = doc.slots[0]; console.log('tBEAT1 — 일정 공용', AS.VERSION || '-', '· 칸', JSON.stringify({ id: S0.id, trig: S0.trig, win: S0.win || null, days: S0.days || null }), '· 문서', DOCf ? path.basename(DOCf) : '(기본 칸)');
const REG_KEEP = new Set(['prd:scanNew', 'prd:shipRead', 'prd:deposit', 'prd:buyback', 'prd:buybackWait', 'prd:aladinBuy']); /* 수집기 REG_KEEP_DEF와 같게 */
const PCS = [{ pc: 'JS-MAIN', sec: 7 }, { pc: 'HOME', sec: 23 }, { pc: 'MJ-MAIN', sec: 41, reg: true }]; const own = { pc: 'JS-MAIN' };
const NIGHT = (m) => m < 360; /* 밤 00~06시(한국 시각) */
/* (박자 2차) 수집기처럼: 박자 뒤 남은 'run' 아닌 칸만 schedMark(회차 기록 '건너뜀') · 시작한 회차에는 bt(미룬 시각)를 schedStart처럼 적음 */
function sim(day0, beat, shared, D) { D = D || doc; const runsP = Object.fromEntries(PCS.map((p) => [p.pc, {}])); const runsS = {}; const ev = []; /* {t, pc} */ const skips = new Set(); const hid = new Set(); let marks = 0;
  for (let m = 0; m < 1440; m++) for (const P of [...PCS].sort((a, b) => a.sec - b.sec)) { const now = day0 + m * 60e3 + P.sec * 1e3; const R = shared ? runsS : runsP[P.pc];
    const ctx = { now, pc: P.pc, own: P.reg ? null : own, crmOk: true, idleMs: 0, bootAt: day0 - 3600e3, stats: {} };
    let dues = AS.due(D, R, ctx); if (P.reg) dues = dues.filter((d) => REG_KEEP.has(d.slot.job)); if (beat) { const d0 = dues; dues = shipBeatGate(now, P.pc, dues); d0.filter((d) => !dues.includes(d)).forEach((d) => { const b = SHIP_BEAT(d.key, P.pc, d.slot.trig.min, d.slot.win); if (b && b.skip) hid.add(d.key); }); }
    for (const d of dues) { if (R[d.key]) continue; if (d.mark !== 'run') { marks++; R[d.key] = { state: d.mark, at: new Date(now).toISOString() }; skips.add(d.key); continue; }
      R[d.key] = { state: 'done', at: new Date(now).toISOString(), st: new Date(now).toISOString(), job: d.slot.job, ...(d.bt ? { bt: new Date(d.bt).toISOString() } : {}) }; ev.push({ t: now, m, pc: P.pc, pt: d.pt, bt: d.bt, key: d.key }); } }
  return { ev, skips: skips.size, hid: hid.size, marks, R: shared ? runsS : runsP }; }
function measure(r, day0) { const ev = r.ev; const byPc = {}; ev.forEach((e) => (byPc[e.pc] = (byPc[e.pc] || 0) + 1));
  const fixed = ev.filter((e) => e.m % 15 === 0).length; const mins = {}; ev.forEach((e) => (mins[e.m] = mins[e.m] || new Set()).add(e.pc)); const overlap = Object.values(mins).filter((s) => s.size > 1).length;
  /* 간격 — 공유는 모든 PC를 합친 한 줄(알라딘이 보는 이 가게의 읽기 사이), PC마다 따로는 PC별 줄 */
  const gaps = { day: [], night: [], tr: [] }; const lanes = {}; ev.forEach((e) => (lanes[r.shared ? 'all' : e.pc] = lanes[r.shared ? 'all' : e.pc] || []).push(e.t));
  for (const L of Object.values(lanes)) { L.sort((a, b) => a - b); for (let i = 1; i < L.length; i++) { const g = (L[i] - L[i - 1]) / 60e3; const mm = Math.floor((L[i] - day0) / 60e3); (NIGHT(mm) ? gaps.night : mm < 390 ? gaps.tr : gaps.day).push(g); } }
  const st = (a) => (a.length ? { n: a.length, min: +Math.min(...a).toFixed(1), max: +Math.max(...a).toFixed(1), avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) } : { n: 0 });
  return { n: ev.length, byPc, fixedPct: ev.length ? Math.round((100 * fixed) / ev.length) : 0, overlap, day: st(gaps.day), night: st(gaps.night), tr: st(gaps.tr), nightN: ev.filter((e) => NIGHT(e.m)).length, skips: r.skips, hid: r.hid, marks: r.marks, R: r.R, ev }; }
const DAYS = ['2026-11-14', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'];
const T = {}; for (const shared of [true, false]) for (const beat of [false, true]) { const k = `${shared ? 'A' : 'B'}${beat ? '뒤' : '앞'}`; T[k] = DAYS.map((d) => { const day0 = Date.parse(d + 'T00:00:00+09:00'); const r = sim(day0, beat, shared); r.shared = shared; const x = measure(r, day0); x.day0 = day0; return x; }); }
const fmtG = (g) => (g.n ? `${g.min}~${g.max}분(평균 ${g.avg})` : '-');
console.log('── 11/14(토) 하루 표 — Ⓐ 공유 회차(실제) · Ⓑ PC마다 따로(옛 모의와 같은 셈)');
console.log('   방식      | 하루 읽기(PC별)                         | 정각 몫 | 같은 분 겹침 | 낮 간격(06:30~24시)    | 밤 간격(00~06시)       | 밤→낮(06:00~06:30) | 밤 읽기');
for (const k of ['A앞', 'A뒤', 'B앞', 'B뒤']) { const x = T[k][0]; console.log(`   ${k.padEnd(9)} | ${String(x.n).padStart(3)} ${JSON.stringify(x.byPc).padEnd(36)} | ${String(x.fixedPct).padStart(4)}% | ${String(x.overlap).padStart(6)}분     | ${fmtG(x.day).padEnd(21)} | ${fmtG(x.night).padEnd(21)} | ${fmtG(x.tr).padEnd(18)} | ${x.nightN}`); }
console.log('── 7일(11/14·11/16~11/21) 모아 본 범위');
for (const k of ['A뒤', 'B뒤']) { const L = T[k]; const all = (f) => L.map(f); console.log(`   ${k}: 하루 읽기 ${Math.min(...all((x) => x.n))}~${Math.max(...all((x) => x.n))} · 정각 몫 최대 ${Math.max(...all((x) => x.fixedPct))}% · 같은 분 겹침 ${Math.min(...all((x) => x.overlap))}~${Math.max(...all((x) => x.overlap))}분 · 낮 간격 ${Math.min(...all((x) => x.day.min))}~${Math.max(...all((x) => x.day.max))}분(평균 ${(L.reduce((a, x) => a + x.day.avg, 0) / L.length).toFixed(1)}) · 밤 간격 ${Math.min(...all((x) => x.night.min))}~${Math.max(...all((x) => x.night.max))}분(평균 ${(L.reduce((a, x) => a + x.night.avg, 0) / L.length).toFixed(1)}) · 밤 쉰 칸 ${L[0].hid}(기록 없이 숨김) · 회차 기록 '건너뜀' ${L[0].skips}`); }
console.log('── 판정');
const A0 = T['A앞'][0], A = T['A뒤'], B = T['B뒤'];
ok(A0.fixedPct === 100 && A0.day.min === 15 && A0.day.max === 15, `앞(고치기 전): 정각 몫 ${A0.fixedPct}% · 간격 늘 15분 — 옛 모의(tLR_sat_human2 ③ 100%)와 같음`);
ok(A.every((x) => x.fixedPct === 0) && B.every((x) => x.fixedPct === 0), '④ 뒤: 정각(:00·:15·:30·:45) 분에 읽은 회차 0 (7일 · 두 방식)');
ok(A.every((x) => x.overlap === 0), 'Ⓐ 뒤: 두 PC가 같은 분에 읽음 0분(같은 회차는 PC 하나)');
ok(B.every((x) => x.overlap <= 24), `③ Ⓑ 뒤: PC마다 따로 세어도 같은 분 겹침 ${B.map((x) => x.overlap).join('·')}분(앞 ${T['B앞'][0].overlap}분 · 선 24분)`);
ok(A.every((x) => x.day.min >= 11 && x.day.max <= 19.5) && B.every((x) => x.day.min >= 11 && x.day.max <= 19.5), '① 낮 간격이 늘 11~19분 안(06:30~24:00)');
ok([...A, ...B].every((x) => !x.tr.n || (x.tr.min >= 11 && x.tr.max <= 30)), `밤→낮 바뀌는 06:00~06:30 간격 ${A.map((x) => fmtG(x.tr)).join(' | ')} — 11~30분 안`);
ok(A.every((x) => Math.abs(x.day.avg - 15) <= 0.6), `① 낮 평균 간격 15분 그대로(성기게 만들지 않음) — ${A.map((x) => x.day.avg).join('·')}`);
ok(A.every((x) => x.night.min >= 12 && x.night.max <= 30 && x.night.avg >= 20 && x.night.avg <= 26), `⑤ 밤 간격 ${A.map((x) => fmtG(x.night)).join(' | ')} — 20~30분(30~60분까지 벌리지 않음 · 낮→밤 바뀌는 00:00 첫 간격은 12분부터)`);
ok(A.every((x) => x.hid === 10 && x.marks === 0 && x.skips === 0) && B.every((x) => x.marks === 0), `⑤ 밤 쉬는 칸 ${A[0].hid}개는 기록 없이 숨김 — schedMark('건너뜀') 부름 ${A.reduce((a, x) => a + x.marks, 0)}번(7일 · 앞 판은 하루 10번)`);
ok(A.every((x) => x.n >= 80 && x.n <= 86), `하루 읽기 ${A.map((x) => x.n).join('·')}번(앞 ${A0.n}번 — 밤만 줄어 낮 그대로)`);
/* 다른 간격(예: 10분) 칸도 칸 밖으로 넘어가지 않음 · 다시 하기(~r) 회차·사람/웹앱 읽기는 건드리지 않음 */
{ const mk = (key, min, mark = 'run') => ({ slot: { job: 'prd:shipRead', trig: { t: 'every', min } }, key, mark, why: 'w', pt: Date.parse('2026-11-16T10:00:00+09:00') });
  let worst = 0; for (const pc of ['JS-MAIN', 'HOME', 'MJ-MAIN', 'PC']) for (let k = 0; k < 200; k++) { const L = [10, 15, 20, 30][k % 4]; const d = mk(`shipRead@2026-11-16@e1000x${k}`.replace(/x\d+$/, ''), L); const p0 = d.pt; const r = shipBeatGate(Date.parse('2026-11-17T00:00:00+09:00'), pc + k, [d]); const off = (r[0].bt - p0) / 60e3; if (!(off >= 0) || off >= L || r[0].pt !== p0) worst = Math.max(worst, off || 99); }
  ok(worst === 0, '간격 10·15·20·30분 칸 모두 시작 늦춤이 칸 길이보다 짧음(다음 칸 열쇠로 넘어가지 않음)');
  const rt = mk('shipRead@2026-11-16@e1000~r1', 15); const o = shipBeatGate(Date.parse('2026-11-16T10:00:10+09:00'), 'JS-MAIN', [rt]); ok(o.length === 1 && o[0].pt === rt.pt && o[0].bt === undefined, '멈춘 회차 다시 하기(~r1)는 박자를 붙이지 않음(그대로)');
  const other = { slot: { job: 'prd:scanDaily', trig: { t: 'every', min: 15 } }, key: 'scanDaily@2026-11-16@e1000', mark: 'run', why: 'w', pt: rt.pt }; ok(shipBeatGate(rt.pt, 'JS-MAIN', [other]).length === 1 && other.bt === undefined, '다른 칸(prd:scanDaily 등)은 그대로'); }
/* ── (박자 2차 · 11/16 검토) ── */
const iso = (t) => new Date(t).toISOString(); const KST = (t) => new Date(t + 9 * 3600e3).toISOString().slice(11, 19);
const dr = (R, day0, D) => AS.delayReport(D || doc, R, { now: day0 + 1440 * 60e3 - 1000, days: 1 }); const strip = (R) => Object.fromEntries(Object.entries(R).map(([k, r]) => { const { bt, ...o } = r; return [k, o]; }));
{ /* ② 일정 공용의 진짜 delayReport — 고친 뒤 '늦게 시작' 0 · 박자 전 셈(bt 없음)이었다면 몇 건이었는지 */
  const aft = A.map((x) => dr(x.R, x.day0)); const bef = A.map((x) => dr(strip(x.R), x.day0));
  const sk = (R) => R.slots.reduce((a, P) => a + P.skipped, 0); const rc = (R) => R.rec.filter((x) => /늦게 시작|건너뜀/.test(x.txt)).length;
  console.log(`── ② 📊 실제 밀림 분석(delayReport · 하루) — bt를 안 보던 셈: 늦게 시작 ${bef.map((R) => R.delays.length).join('·')}건 · 합 ${bef.map((R) => R.sumLate).join('·')}분 → 고친 뒤: ${aft.map((R) => R.delays.length).join('·')}건 · 합 ${aft.map((R) => R.sumLate).join('·')}분 · 건너뜀 ${aft.map(sk).join('·')}`);
  ok(aft.every((R) => R.delays.length === 0 && R.sumLate === 0 && sk(R) === 0 && rc(R) === 0), `② 고친 뒤 '늦게 시작' 0건·0분 · 건너뜀 0 · 추천(늦게 시작·건너뜀) 0줄 (7일 · 박자 미룸을 늦음으로 안 봄)`);
  ok(bef.every((R) => R.delays.length >= 60), `   (비교) bt를 안 보면 하루 ${Math.min(...bef.map((R) => R.delays.length))}~${Math.max(...bef.map((R) => R.delays.length))}건을 늦음으로 잘못 봄 — 검토에서 본 빨간 경고`);
  const x = A[0]; const R = JSON.parse(JSON.stringify(x.R)); const e = x.ev.find((v) => v.m > 600); R[e.key].st = iso(e.bt + 5 * 60e3); R[e.key].at = R[e.key].st; const D5 = dr(R, x.day0);
  ok(D5.delays.length === 1 && D5.delays[0].k === e.key && D5.delays[0].dm === 5, `② 미룬 시각(bt ${KST(e.bt)})보다 5분 늦게 시작한 회차는 그대로 잡음 — ${D5.delays.map((d) => d.k + ' ' + d.dm + '분').join(', ')}`);
  ok(AS.planOf(e.key, R[e.key]) === e.bt && AS.planOf(e.key, { st: R[e.key].st }) === AS.planOf(e.key) && AS.planOf(e.key) !== e.bt && AS.planOf(e.key + '~r1', { bt: iso(e.bt) }) === null, 'planOf(열쇠, 기록): bt 있으면 bt · 없으면(옛 기록) 칸 시작 그대로 · 다시 하기(~r)는 예전처럼 없음');
  /* 옛 기록(bt 없음) — 고치기 전 일정 공용과 결과가 똑같음 */
  let old = null; try { const cp = require('child_process'); const t = path.join(require('os').tmpdir(), `as_old_${process.pid}.js`); fs.writeFileSync(t, cp.execSync('git show f8e9334:readnow-autosched-core.js', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })); const m = require(t); old = m.AS || m; fs.unlinkSync(t); } catch (_) {}
  if (!old) console.log('  … 옛 일정 공용(f8e9334)을 git에서 못 꺼내 같음 비교는 건너뜀');
  else { const cases = [...T['A앞'].map((y) => [y.R, y.day0]), ...T['B앞'].flatMap((y) => Object.values(y.R).map((R1) => [R1, y.day0]))]; const late = JSON.parse(JSON.stringify(T['A앞'][0].R)); Object.entries(late).forEach(([k, r], i) => { if (r.st && i % 3 === 0) { r.st = iso(Date.parse(r.st) + (4 + (i % 9)) * 60e3); r.at = r.st; } }); cases.push([late, T['A앞'][0].day0]); cases.push([strip(A[0].R), A[0].day0]);
    const same = cases.every(([R1, d0]) => JSON.stringify(old.delayReport(doc, R1, { now: d0 + 864e5 - 1000, days: 1 })) === JSON.stringify(AS.delayReport(doc, R1, { now: d0 + 864e5 - 1000, days: 1 })) && Object.keys(R1).every((k) => old.planOf(k) === AS.planOf(k) && old.planOf(k) === AS.planOf(k, R1[k])));
    ok(same, `옛 기록(bt 없음) ${cases.length}묶음: delayReport·planOf 결과가 고치기 전(f8e9334)과 글자 하나까지 같음 — 웹앱 ⏰ 화면도 옛 기록엔 그대로 (늦음 낀 묶음 ${old.delayReport(doc, late, { now: T['A앞'][0].day0 + 864e5 - 1000, days: 1 }).delays.length}건 포함)`); } }
{ /* ③ 같은 박동에 다른 정한 시각 일이 있어도 발송 요청 읽기의 pt는 칸 시작 → 수집기 schedTick 차례 정렬에서 앞 */
  const P0 = Date.parse('2026-11-16T10:00:00+09:00'); const ship = { slot: { job: 'prd:shipRead', trig: { t: 'every', min: 15 } }, key: 'shipRead@2026-11-16@e1000', mark: 'run', why: 'w', cls: 0, pt: P0 };
  const b = SHIP_BEAT(ship.key, 'JS-MAIN', 15); const oth = { slot: { job: 'prd:scanDaily', trig: { t: 'time' } }, key: 'scanDaily@2026-11-16@10:05', mark: 'run', why: 'w', cls: 0, pt: P0 + 5 * 60e3 }; const now = P0 + b.off + 20e3;
  const ok2 = shipBeatGate(now, 'JS-MAIN', [oth, ship]); const A2 = ok2.filter((d) => d.cls === 0).map((d) => ({ d, pt: d.pt || 0 })).sort((a, c) => a.pt - c.pt); /* schedTick 목록 A와 같은 셈 */
  ok(ok2.length === 2 && ship.pt === P0 && ship.bt === Math.round(P0 + b.off) && A2[0].d === ship, `③ 같은 박동(${KST(now)})에 10:05 일과 함께 — 발송 요청 읽기 pt=칸 시작 10:00(미룬 시각 ${KST(ship.bt)}은 bt) → 차례 맨 앞`);
  const cur = { st: P0 + 3 * 60e3, rank: 2 }; ok(((ship.bt || ship.pt) > cur.st) && !(ship.pt > cur.st), `   끼어들기 확인은 bt 기준(${KST(ship.bt)} > 다른 일 시작 10:03) — pt(10:00)로만 보면 미루는 사이 시작한 일 뒤로 밀려 늦어짐`); }
{ /* ④ 시간 창 칸 — 그날 창이 열리는 첫 칸은 1~3분 · ⑥ 미룬 시각이 창 끝을 넘지 않음(창 끝 1분 전까지) */
  const W = (from, to) => ({ ...doc, slots: [{ ...doc.slots[0], win: { from, to } }] }); const firsts = []; let lostN = 0, outN = 0, lateN = 0, fixN = 0, gapMin = 99, gapMax = 0; const rows = [];
  for (const [from, to] of [['09:00', '18:00'], ['09:00', '17:50'], ['08:30', '21:05'], ['22:00', '02:00']]) { const D = W(from, to); const fm = +from.slice(0, 2) * 60 + +from.slice(3); const tm = +to.slice(0, 2) * 60 + +to.slice(3); const wl = (tm - fm + 1440) % 1440 || 1440; const nSlot = Math.ceil(wl / 15);
    for (const d of DAYS) { const day0 = Date.parse(d + 'T00:00:00+09:00'); const base = fm > tm ? day0 - 864e5 : day0; /* 자정 넘는 창은 전날 창부터 */ const r1 = sim(base, true, true, D); const r2 = fm > tm ? sim(day0, true, true, D) : null; const ev = [...r1.ev, ...(r2 ? r2.ev : [])].filter((e) => e.key.includes('@' + AS.keyParts(`x@${new Date(base + 9 * 3600e3).toISOString().slice(0, 10)}@e0000`).day + '@'));
      const f = ev.filter((e) => e.pt === base + fm * 60e3)[0]; if (f) firsts.push((f.bt - f.pt) / 60e3); if (f && f.t - f.bt > 61e3) outN++;
      ev.forEach((e) => { const endAt = base + (fm + wl) * 60e3; if (e.bt > endAt - 60e3 || e.t >= endAt) outN++; if (Math.floor((e.t - base) / 60e3) % 15 === 0) fixN++; }); const nSkip = Array.from({ length: nSlot }, (_, i) => (fm + i * 15) % 1440).filter((sm) => { const b = SHIP_BEAT(`shipRead@x@e${String(Math.floor(sm / 60)).padStart(2, '0')}${String(sm % 60).padStart(2, '0')}`, 'PC', 15, { from, to }); return b && b.skip; }).length; lostN += Math.abs(nSlot - nSkip - ev.length);
      const ts = ev.map((e) => e.t).sort((a, c) => a - c); for (let i = 1; i < ts.length; i++) { const g = (ts[i] - ts[i - 1]) / 60e3; gapMin = Math.min(gapMin, g); gapMax = Math.max(gapMax, g); }
      lateN += dr(r1.R, base, D).delays.length + (r2 ? AS.delayReport(D, r2.R, { now: day0 + 864e5 - 1000, days: 2 }).delays.length : 0) /* 자정 뒤 칸은 열쇠가 전날 */; if (d === DAYS[0]) rows.push(`${from}~${to}: ${ev.length}/${nSlot - nSkip}칸(🌙 쉼 ${nSkip}) · 첫 ${f ? KST(f.t) : '-'} · 끝 ${ev.length ? KST(ts[ts.length - 1]) : '-'}`); } }
  console.log('── ④⑥ 시간 창 칸(11/14) — ' + rows.join(' | '));
  ok(firsts.length === 28 && firsts.every((x) => x >= 1 && x <= 3), `④ 그날 창이 열리는 첫 칸은 1~3분 안에 시작 (${firsts.length}일·창 · ${Math.min(...firsts).toFixed(1)}~${Math.max(...firsts).toFixed(1)}분)`);
  ok(outN === 0 && lostN === 0, `⑥ 미룬 시각이 창 끝 1분 전을 넘은 회차 ${outN} · 창 밖으로 밀려 잃은 칸 ${lostN} (17:50·21:05처럼 15분에 안 맞는 창 끝 포함)`);
  ok(lateN === 0 && fixN === 0 && gapMin >= 5, `   시간 창 칸도 delayReport '늦게 시작' ${lateN}건 · 정각 분 ${fixN}번 · 회차 사이 ${gapMin.toFixed(1)}~${gapMax.toFixed(1)}분(창 끝 짧은 칸 앞은 좁아질 수 있음 · 5분 밑 없음)`);
  const bE = SHIP_BEAT('shipRead@2026-11-16@e1745', 'PC', 15, { from: '09:00', to: '17:50' }); const bF = SHIP_BEAT('shipRead@2026-11-16@e2100', 'PC', 15, { from: '08:30', to: '21:05' });
  ok(bE.off <= 4 * 60e3 && bF.off <= 4 * 60e3, `⑥ 짧은 끝 칸: 17:45(창 끝 17:50) +${(bE.off / 60e3).toFixed(1)}분 · 21:00(창 끝 21:05) +${(bF.off / 60e3).toFixed(1)}분 — 4분 넘지 않음`); }
console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
