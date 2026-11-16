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
const { shipBeatGate } = new Function(SRC.slice(i0, i1) + '\nreturn { SHIP_BEAT, shipBeatGate };')();
const DOCf = process.argv[2] || ['/home/user/readnow-chats/tools/session-kit/pw/fixtures/autosched_1114.json'].find((p) => fs.existsSync(p));
let doc; if (DOCf) { const d0 = JSON.parse(fs.readFileSync(DOCf, 'utf8')); doc = { ...d0, on: true, slots: (d0.slots || []).filter((s) => s.job === 'prd:shipRead') }; }
if (!doc || !doc.slots.length) doc = { on: true, slots: [{ id: 'shipRead', job: 'prd:shipRead', on: true, name: '📦 발송 요청 읽기', trig: { t: 'every', min: 15 }, win: null, days: null }] };
const S0 = doc.slots[0]; console.log('tBEAT1 — 일정 공용', AS.VERSION || '-', '· 칸', JSON.stringify({ id: S0.id, trig: S0.trig, win: S0.win || null, days: S0.days || null }), '· 문서', DOCf ? path.basename(DOCf) : '(기본 칸)');
const REG_KEEP = new Set(['prd:scanNew', 'prd:shipRead', 'prd:deposit', 'prd:buyback', 'prd:buybackWait', 'prd:aladinBuy']); /* 수집기 REG_KEEP_DEF와 같게 */
const PCS = [{ pc: 'JS-MAIN', sec: 7 }, { pc: 'HOME', sec: 23 }, { pc: 'MJ-MAIN', sec: 41, reg: true }]; const own = { pc: 'JS-MAIN' };
const NIGHT = (m) => m < 360; /* 밤 00~06시(한국 시각) */
function sim(day0, beat, shared) { const runsP = Object.fromEntries(PCS.map((p) => [p.pc, {}])); const runsS = {}; const ev = []; /* {t, pc} */ const skips = new Set();
  for (let m = 0; m < 1440; m++) for (const P of [...PCS].sort((a, b) => a.sec - b.sec)) { const now = day0 + m * 60e3 + P.sec * 1e3; const R = shared ? runsS : runsP[P.pc];
    const ctx = { now, pc: P.pc, own: P.reg ? null : own, crmOk: true, idleMs: 0, bootAt: day0 - 3600e3, stats: {} };
    let dues = AS.due(doc, R, ctx); if (P.reg) dues = dues.filter((d) => REG_KEEP.has(d.slot.job)); if (beat) dues = shipBeatGate(now, P.pc, dues);
    for (const d of dues) { if (R[d.key]) continue; if (d.mark !== 'run') { R[d.key] = { state: d.mark, at: new Date(now).toISOString() }; skips.add(d.key); continue; }
      R[d.key] = { state: 'done', at: new Date(now).toISOString(), st: new Date(now).toISOString(), job: d.slot.job }; ev.push({ t: now, m, pc: P.pc }); } }
  return { ev, skips: skips.size }; }
function measure(r, day0) { const ev = r.ev; const byPc = {}; ev.forEach((e) => (byPc[e.pc] = (byPc[e.pc] || 0) + 1));
  const fixed = ev.filter((e) => e.m % 15 === 0).length; const mins = {}; ev.forEach((e) => (mins[e.m] = mins[e.m] || new Set()).add(e.pc)); const overlap = Object.values(mins).filter((s) => s.size > 1).length;
  /* 간격 — 공유는 모든 PC를 합친 한 줄(알라딘이 보는 이 가게의 읽기 사이), PC마다 따로는 PC별 줄 */
  const gaps = { day: [], night: [], tr: [] }; const lanes = {}; ev.forEach((e) => (lanes[r.shared ? 'all' : e.pc] = lanes[r.shared ? 'all' : e.pc] || []).push(e.t));
  for (const L of Object.values(lanes)) { L.sort((a, b) => a - b); for (let i = 1; i < L.length; i++) { const g = (L[i] - L[i - 1]) / 60e3; const mm = Math.floor((L[i] - day0) / 60e3); (NIGHT(mm) ? gaps.night : mm < 390 ? gaps.tr : gaps.day).push(g); } }
  const st = (a) => (a.length ? { n: a.length, min: +Math.min(...a).toFixed(1), max: +Math.max(...a).toFixed(1), avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) } : { n: 0 });
  return { n: ev.length, byPc, fixedPct: ev.length ? Math.round((100 * fixed) / ev.length) : 0, overlap, day: st(gaps.day), night: st(gaps.night), tr: st(gaps.tr), nightN: ev.filter((e) => NIGHT(e.m)).length, skips: r.skips }; }
const DAYS = ['2026-11-14', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'];
const T = {}; for (const shared of [true, false]) for (const beat of [false, true]) { const k = `${shared ? 'A' : 'B'}${beat ? '뒤' : '앞'}`; T[k] = DAYS.map((d) => { const day0 = Date.parse(d + 'T00:00:00+09:00'); const r = sim(day0, beat, shared); r.shared = shared; return measure(r, day0); }); }
const fmtG = (g) => (g.n ? `${g.min}~${g.max}분(평균 ${g.avg})` : '-');
console.log('── 11/14(토) 하루 표 — Ⓐ 공유 회차(실제) · Ⓑ PC마다 따로(옛 모의와 같은 셈)');
console.log('   방식      | 하루 읽기(PC별)                         | 정각 몫 | 같은 분 겹침 | 낮 간격(06:30~24시)    | 밤 간격(00~06시)       | 밤→낮(06:00~06:30) | 밤 읽기');
for (const k of ['A앞', 'A뒤', 'B앞', 'B뒤']) { const x = T[k][0]; console.log(`   ${k.padEnd(9)} | ${String(x.n).padStart(3)} ${JSON.stringify(x.byPc).padEnd(36)} | ${String(x.fixedPct).padStart(4)}% | ${String(x.overlap).padStart(6)}분     | ${fmtG(x.day).padEnd(21)} | ${fmtG(x.night).padEnd(21)} | ${fmtG(x.tr).padEnd(18)} | ${x.nightN}`); }
console.log('── 7일(11/14·11/16~11/21) 모아 본 범위');
for (const k of ['A뒤', 'B뒤']) { const L = T[k]; const all = (f) => L.map(f); console.log(`   ${k}: 하루 읽기 ${Math.min(...all((x) => x.n))}~${Math.max(...all((x) => x.n))} · 정각 몫 최대 ${Math.max(...all((x) => x.fixedPct))}% · 같은 분 겹침 ${Math.min(...all((x) => x.overlap))}~${Math.max(...all((x) => x.overlap))}분 · 낮 간격 ${Math.min(...all((x) => x.day.min))}~${Math.max(...all((x) => x.day.max))}분(평균 ${(L.reduce((a, x) => a + x.day.avg, 0) / L.length).toFixed(1)}) · 밤 간격 ${Math.min(...all((x) => x.night.min))}~${Math.max(...all((x) => x.night.max))}분(평균 ${(L.reduce((a, x) => a + x.night.avg, 0) / L.length).toFixed(1)}) · 밤 쉰 칸 ${L[0].skips}`); }
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
ok(A.every((x) => x.n >= 80 && x.n <= 86), `하루 읽기 ${A.map((x) => x.n).join('·')}번(앞 ${A0.n}번 — 밤만 줄어 낮 그대로)`);
/* 다른 간격(예: 10분) 칸도 칸 밖으로 넘어가지 않음 · 다시 하기(~r) 회차·사람/웹앱 읽기는 건드리지 않음 */
{ const mk = (key, min, mark = 'run') => ({ slot: { job: 'prd:shipRead', trig: { t: 'every', min } }, key, mark, why: 'w', pt: Date.parse('2026-11-16T10:00:00+09:00') });
  let worst = 0; for (const pc of ['JS-MAIN', 'HOME', 'MJ-MAIN', 'PC']) for (let k = 0; k < 200; k++) { const L = [10, 15, 20, 30][k % 4]; const d = mk(`shipRead@2026-11-16@e1000x${k}`.replace(/x\d+$/, ''), L); const r = shipBeatGate(Date.parse('2026-11-17T00:00:00+09:00'), pc + k, [d]); const off = (r[0].pt - d.pt) / 60e3; if (off >= L) worst = Math.max(worst, off); }
  ok(worst === 0, '간격 10·15·20·30분 칸 모두 시작 늦춤이 칸 길이보다 짧음(다음 칸 열쇠로 넘어가지 않음)');
  const rt = mk('shipRead@2026-11-16@e1000~r1', 15); const o = shipBeatGate(Date.parse('2026-11-16T10:00:10+09:00'), 'JS-MAIN', [rt]); ok(o.length === 1 && o[0].pt === rt.pt, '멈춘 회차 다시 하기(~r1)는 박자를 붙이지 않음(그대로)');
  const other = { slot: { job: 'prd:scanDaily', trig: { t: 'every', min: 15 } }, key: 'scanDaily@2026-11-16@e1000', mark: 'run', why: 'w', pt: rt.pt }; ok(shipBeatGate(rt.pt, 'JS-MAIN', [other]).length === 1, '다른 칸(prd:scanDaily 등)은 그대로'); }
console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
