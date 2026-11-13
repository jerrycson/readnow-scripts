// tBFIN1113 — (bfin 11/13) 수집기 benchFinish 📦 대량 사라짐을 '실제 일어난 간격(앞 회차 간격 · 두 번 확인)'으로 나눠 판단 · 브라우저 필요 없음
//  ① 운영 benchFinish를 글자 그대로 떼어 가짜 Firestore로 부름: 앞 간격 25일 뒤 1.4만 사라짐 → 평소(massGone 없음) · 앞 간격 1일 뒤 같은 사라짐 → 📦 대량 사라짐
//  ② 옛 상태(bench_state에 앞 간격 없음) → bench_days에서 앞 회차를 찾아 같은 판정 · 공용 엔진이 없을 때(웹앱이 떼어 부를 때) 같은 셈으로 같은 판정
//  ③ split.js가 공용 readnow-anom-core.js를 readnow-pc-runtime.js 앞에 글자 그대로 넣음 · @require 수 그대로 · 머리 서명 8ab2f661d1d8afa8 그대로
// 실행: node src/tests/tBFIN1113.js · 시험 자료는 모두 지어낸 값(가게 번호 9100001…)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'readnow-anom-core.js')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const ANF = path.join(ROOT, 'readnow-anom-core.js'); const AN = require(ANF);
const BF = (() => { const a = SRC.indexOf('async function benchFinish(t, prog, st) {'); const b = SRC.indexOf('async function runChain(', a); return SRC.slice(a, b); })();
ok(BF.length > 10000 && /const GW = await/.test(BF), '운영 benchFinish 떼어 냄(실제 간격 셈 GW 있음)');

/* 가짜 Firestore — 문서 저장소 · where/select/get · batch · FieldValue */
function mkFS() { const S = {}; const col = (name) => { S[name] = S[name] || {}; const T = S[name];
  const ref = (id) => ({ id, get: async () => ({ exists: id in T, data: () => (T[id] ? JSON.parse(JSON.stringify(T[id])) : undefined) }), set: async (v, o) => { T[id] = o && o.merge && T[id] ? { ...T[id], ...v } : { ...v }; }, collection: (c) => col(`${name}/${id}/${c}`) });
  const q = (fl) => ({ where: (k, op, v) => q([...fl, (d) => d[k] === v]), select: () => q(fl), get: async () => { const L = Object.entries(T).filter(([, d]) => fl.every((f) => f(d))); return { forEach: (fn) => L.forEach(([id, d]) => fn({ id, data: () => JSON.parse(JSON.stringify(d)) })), size: L.length }; } });
  return { doc: ref, ...q([]) }; };
  const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops.splice(0)) await f(); } }; } };
  return { S, col, db }; }
const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (x && typeof x === 'object' && x.__fv ? undefined : x)));
async function runBF({ withAnom, oldN, missN, prevSpan, nowSpanDays, keepLastSpan }) {
  const F = mkFS(); const sc = '9100001'; const day = '2026-11-13'; const startedAt = '2026-11-13T01:00:00.000Z'; const prevAt = new Date(Date.parse(startedAt) - nowSpanDays * 864e5).toISOString(); const prevDay = new Date(Date.parse(prevAt) + 9 * 3600e3).toISOString().slice(0, 10);
  const M = {}; for (let i = 0; i < oldN; i++) M[String(1000000 + i)] = [5000 + (i % 7) * 1000, '20261001', '상', 1, '책' + i, 0, i < missN ? prevDay.replace(/-/g, '') : 0, null, null, null, 0];
  const ids = Object.keys(M); const CH = 2500; const chunks = Math.ceil(ids.length / CH); for (let k = 0; k < chunks; k++) await F.col('bench_state').doc(sc).collection('c').doc(String(k)).set({ s: JSON.stringify(Object.fromEntries(ids.slice(k * CH, (k + 1) * CH).map((id) => [id, M[id]]))), n: CH, fmt: 'json' });
  const st = { sc, name: '가게A', day: prevDay, runAt: prevAt, okRunAt: prevAt, fullRunAt: prevAt, complete: true, total: oldN, missOnce: missN, notRead: 0, chunks, startDay: '2026-10-01', ...(keepLastSpan ? { lastSpanDays: prevSpan, lastAdd: 40 } : {}) };
  await F.col('bench_state').doc(sc).set(st);
  await F.col('bench_days').doc(`${sc}_${prevDay}`).set({ sc, dayId: `${sc}_${prevDay}`, runAt: prevAt, spanDays: prevSpan, full: true, complete: true, add: 40, missOnce: missN, total: oldN });
  /* 이번 회차: 앞 회차가 처음 못 본 missN개는 이번에도 없음(→ 사라짐 확정) · 나머지는 그대로 + 새로 올림 30 */
  const items = []; for (let i = missN; i < oldN; i++) items.push([String(1000000 + i), M[String(1000000 + i)][0], '상', '책' + i, null, null, 9000, 0, 1, null, null, null]); for (let i = 0; i < 30; i++) items.push([String(2000000 + i), 4000, '상', '새책' + i, null, '2026-01', 9000, 0, 1, null, null, null]);
  const logs = []; const sb = { console, JSON, Date, Math, Object, Array, String, Number, Set, Map, Promise, TextEncoder, isFinite, parseInt, setTimeout,
    C: (n) => F.col(n), db: F.db, firebase: { firestore: { FieldValue: { increment: (n) => ({ __fv: 1, inc: n }), arrayUnion: (...x) => ({ __fv: 1, union: x }) } } }, PC_NAME: 'PC 시험', W: () => ({}), nowIso: () => new Date().toISOString(),
    log: (m) => logs.push(String(m)), ui: () => {}, BREG: () => null, BENCH_CFG: {}, BENCH_DEFER_DETAIL: true, sleep: (ms) => new Promise((r) => setTimeout(r, ms)), benchDetail: async (t, now, newIds) => ({ tried: 0, filled: [], newIds }) };
  if (withAnom) sb.ReadnowAnom = AN; sb.globalThis = sb; sb.window = sb; vm.createContext(sb); vm.runInContext(BF + '\n;globalThis.__bf = benchFinish;', sb);
  await sb.__bf({ sc, name: '가게A' }, { day, startedAt, fullRead: true, cover: 1, page: 100, lastPage: 100, items }, JSON.parse(JSON.stringify(st)));
  const dd = Object.values(F.S.bench_days).find((d) => d.runAt === startedAt); return { d: strip(dd || {}), s: strip(F.S.bench_state[sc]), logs };
}

(async () => {
  console.log('① 운영 benchFinish — 앞 간격으로 나눔');
  const A = await runBF({ withAnom: true, oldN: 100000, missN: 14000, prevSpan: 25, nowSpanDays: 4, keepLastSpan: true });
  ok(A.d.gone === 14000 && Math.abs(A.d.spanDays - 4) < 0.01 && !A.d.massGone && A.d.massChk === 1, "25일 간격 뒤 1.4만 사라짐(숍의 14% · 이번 간격 4일로 나누면 하루 3.5% — 옛 고정 기준이면 사건) → 평소(massGone 없음)", { gone: A.d.gone, sp: A.d.spanDays, mg: A.d.massGone, mass: A.d.mass });
  ok(A.logs.some((l) => /실제 간격 25일\(앞 회차가 처음 못 본 것을 이번에 확정\)에 쌓인 것 — 하루 0\.6%라 평소 사라짐으로 통계에 넣음/.test(l)), '작업 기록: 실제 간격 25일 · 하루 0.6% · 평소로 넣음', A.logs.filter((l) => /사라짐/.test(l)));
  ok(A.s.lastSpanDays === 4 && A.s.lastAdd === 30 && A.s.missOnce === 0, 'bench_state에 이번 간격·새로 올림을 적음(다음 회차가 앞 간격을 바로 씀)', { l: A.s.lastSpanDays, a: A.s.lastAdd });
  const B = await runBF({ withAnom: true, oldN: 100000, missN: 14000, prevSpan: 1, nowSpanDays: 1, keepLastSpan: true });
  ok(B.d.massGone === true && B.d.mass && B.d.mass.win === 1 && B.d.mass.twoStep === true && B.d.mass.perDay >= 0.13 && /^anom /.test(B.d.mass.winBy) && B.d.mass.by === 'pc', '하루 간격 1.4만 사라짐 → 📦 대량 사라짐(실제 간격 1일 · 두 번 확인 · 공용 엔진 셈)', B.d.mass);
  ok(B.logs.some((l) => /📦 대량 사라짐 사건 — 사라짐 14,000개\(숍의 14% · 실제 간격 1일/.test(l)), '작업 기록: 📦 대량 사라짐 · 실제 간격 1일');
  console.log('② 옛 상태 · 공용 엔진 없을 때');
  const C1 = await runBF({ withAnom: true, oldN: 100000, missN: 14000, prevSpan: 25, nowSpanDays: 4, keepLastSpan: false });
  ok(!C1.d.massGone && C1.logs.some((l) => /실제 간격 25일/.test(l)), '옛 상태(앞 간격 없음) → bench_days 앞 회차에서 25일을 찾아 평소', C1.logs.filter((l) => /사라짐/.test(l)));
  const D1 = await runBF({ withAnom: false, oldN: 100000, missN: 14000, prevSpan: 25, nowSpanDays: 4, keepLastSpan: true }); const D2 = await runBF({ withAnom: false, oldN: 100000, missN: 14000, prevSpan: 1, nowSpanDays: 1, keepLastSpan: true });
  ok(!D1.d.massGone && D2.d.massGone === true && D2.d.mass.winBy === 'pc' && D2.d.mass.win === 1, '공용 엔진 없음(웹앱이 떼어 부를 때) → 같은 셈으로 같은 판정', { d1: D1.d.mass, d2: D2.d.mass });
  const E = await runBF({ withAnom: true, oldN: 20000, missN: 300, prevSpan: 1, nowSpanDays: 1, keepLastSpan: true });
  ok(!E.d.massGone && E.d.gone === 300, '500개 아래는 판정하지 않음(앞 회차 찾기도 안 함)');
  /* 공용 엔진 feat와 같은 간격 */
  const f = AN.DOMAINS.bench.feat({ sc: '1', dayId: 'x', total: 86030, gone: 14000, add: 30, missOnce: 0, spanDays: 4 }, { extra: { x: { prev: { full: true, missOnce: 14000, spanDays: 25, total: 100000 } } } });
  ok(f.win === 25 && f.twoStep === true, '공용 bench feat도 같은 실제 간격 25일(두 번 확인)', { win: f.win, two: f.twoStep });

  console.log('③ split.js — 공용 엔진을 머리 그대로 수집기에');
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'bfin-')); fs.writeFileSync(path.join(T, 'c.user.js'), SRC);
  const sp = cp.spawnSync('node', [path.join(ROOT, 'src/split.js'), path.join(T, 'c.user.js'), path.join(T, 'out')], { encoding: 'utf8' }); ok(sp.status === 0 && /이으면 원본과 같음/.test(sp.stdout), 'split.js 나눔 · 관문 통과', (sp.stderr || '').slice(0, 400));
  if (sp.status === 0) { const hs = fs.readFileSync(path.join(T, 'out/pc-live-head.txt'), 'utf8').split('\n')[0].trim(); ok(hs === '8ab2f661d1d8afa8', '머리 서명 8ab2f661d1d8afa8 그대로', hs);
    const RT = fs.readFileSync(path.join(T, 'out/readnow-pc-runtime.js'), 'utf8'); ok(RT.includes(fs.readFileSync(ANF, 'utf8')) && RT.indexOf('ReadnowAnom') < RT.indexOf('__rnModQ'), '공용 readnow-anom-core.js를 글자 그대로 · 모듈 줄보다 앞');
    const col = fs.readFileSync(path.join(T, 'out/readnow-collector.user.js'), 'utf8'); ok(!/readnow-anom-core/.test(col) && (col.match(/^\/\/ @require/gm) || []).length === (fs.readFileSync(path.join(ROOT, 'readnow-collector.user.js'), 'utf8').match(/^\/\/ @require/gm) || []).length, '@require 줄 수가 지금 GitHub 본체와 같음');
    const sb0 = { console }; sb0.globalThis = sb0; sb0.window = sb0; vm.createContext(sb0); vm.runInContext(RT, sb0); ok(sb0.ReadnowAnom && sb0.ReadnowAnom.VERSION === AN.VERSION && typeof sb0.ReadnowAnom.DOMAINS.bench.feat === 'function' && sb0.ReadnowAdaptAg, `수집기 안 ReadnowAnom ${sb0.ReadnowAnom && sb0.ReadnowAnom.VERSION} = 공용 ${AN.VERSION} · 적응 틀도 그대로`); }
  fs.rmSync(T, { recursive: true, force: true });
  console.log(bad ? `✗ tBFIN1113 실패 ${bad}` : '✓ tBFIN1113 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e && e.stack); process.exit(1); });
