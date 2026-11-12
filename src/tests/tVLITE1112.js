// tVLITE1112 — (vlite 11/12) 🪶 판매가치 배우기(valueLearn) 가볍게 · 브라우저 필요 없음
//  ① 옛 방식(origin/main 0.35.153의 valueLearn — 하루 모습 문서를 한 번에 받아 줄을 다 모음)과 새 방식(조각마다 흘려 셈)이 같은 자료에서 같은 표
//     (우리 표 oursOnly·벤치 표 benchOnly·우리 최저가배지 비율 ours·날짜·판매 수는 똑같이 · 합친 표는 칸마다 상대 오차 1e-9 안 · SP 변화 관찰 sp_obs 같음)
//  ② 되살린 날(무게 절반)·첫 페이지 못 읽은 줄·맨 윗줄 배지·오늘 하루 모습(뺌)·벤치 끔(benchUse false)도 같음
//  ③ 표 더하기가 한 번에 배운 것과 다르면(공용 파일에 더할 수 없는 칸) 예전처럼 한 번에 배움(mode whole) — 결과 같음
//  ④ 같은 때 두 번 돌지 않음(skip busy) · 진단 vlearn 길
//  ⑤ 메모리 — 하루 모습 44일 × 조각 8개 × 2,000줄(약 70만 줄 · 실제와 같은 크기) · 셈이 늘린 살아 있는 힙 최고: 새 방식 < 120MB 그리고 옛 방식의 1/3 아래
// 실행: cd src/tests && node --expose-gc tVLITE1112.js   (../../cloud/index.js · 옛 방식은 git show origin/main 또는 같은 폴더 ../../cloud/index.js의 앞 판이 없으면 ①⑤ 견줌은 건너뜀)
//  시험 자료는 모두 지어낸 값(상품 번호 aladin_7000000…·판매자 9100001…)
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const ML0 = require(path.join(ROOT, 'readnow-ml-core.js'));
const SRC = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const OLD_REF = process.env.VLITE_OLD_REF || 'fe6ddb45'; /* 옛 방식이 든 커밋(0.35.153 · valueLearn을 고치기 전) — 없으면 origin/main~ 에서 찾음 */
function oldSrc() { for (const r of [OLD_REF, 'origin/main', 'HEAD~1', 'HEAD~2', 'HEAD~3']) { try { const s = cp.execSync(`git -C ${JSON.stringify(ROOT)} show ${r}:cloud/index.js`, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); if (s.includes('const dm = await C(\'ml_days\').where(\'day\', \'>=\', since).get()')) return s; } catch (e) {} } return null; }
const cut = (s) => s.slice(s.indexOf('function benchRunUse('), s.indexOf('/* (0.19.0) 🔭 벤치마킹 조회 엔진'));

/* 가짜 Firestore — 문서 이름 차례 · where(>=·==) · select · orderBy(문서 이름)·limit·startAfter · 하위 모음(bench_state/{sc}/c) · data()는 늘 새 사본(실제처럼 받을 때마다 객체) */
const clone = (v) => (Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);
function mkFS(data, hook) { const st = { reads: 0 };
  const snap = (id, v) => ({ id, exists: v !== undefined, data: () => (v === undefined ? undefined : clone(v)) });
  const Q = (n, o) => ({ orderBy: () => Q(n, o), select: (...f) => Q(n, { ...o, sel: f }), where: (k, op, v) => Q(n, { ...o, w: [...(o.w || []), [k, op, v]] }), limit: (x) => Q(n, { ...o, lim: x }), startAfter: (d) => Q(n, { ...o, after: d.id }),
    get: async () => { if (hook) hook(); let L = Object.entries(data[n] || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)); for (const [k, op, v] of o.w || []) L = L.filter(([, x]) => (op === '==' ? x[k] === v : op === '>=' ? x[k] != null && x[k] >= v : true));
      if (o.after != null) L = L.filter(([id]) => id > o.after); if (o.lim) L = L.slice(0, o.lim); st.reads += L.length || 1;
      const docs = L.map(([id, v]) => snap(id, o.sel && o.sel.length ? Object.fromEntries(o.sel.filter((f) => f in v).map((f) => [f, v[f]])) : v)); const r = { size: docs.length, empty: !docs.length, docs, forEach: (f) => docs.forEach(f) }; if (hook) hook(r); return r; } });
  const C = (n) => ({ ...Q(n, {}), doc: (id) => ({ get: async () => { if (hook) hook(); st.reads++; const r = snap(id, (data[n] || {})[id]); if (hook) hook(r); return r; }, set: async (v, opt) => { const cur = (data[n] || {})[id]; (data[n] = data[n] || {})[id] = opt && opt.merge && cur ? { ...cur, ...clone(v) } : clone(v); }, collection: (c2) => C(n + '/' + id + '/' + c2) }) });
  return { C, st, FieldPath: { documentId: () => '__name__' } }; }

/* 지어낸 자료 — D일 × 조각 S개 × 줄 R개 */
function mkData(o) { let seed = o.seed || 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const kst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const now = Date.now(); const N = o.S * o.R; const keys = Array.from({ length: N + 600 }, (_, i) => 'aladin_' + (7000000 + i)); const isb = (i) => '979' + String(1000000000 + i).slice(-10);
  const D = { ml_days: {}, ml_sales: {}, prd_listings: {}, sp_daily: {}, app_settings: { buyback_stats: {}, value_cfg: o.benchOff ? { benchUse: false } : {} }, bench_days: {}, bench_state: {}, bench_items: {}, prd_books: {}, prd_book_metrics: {}, ml_value_models: {}, ml_sp_obs: {} };
  for (let i = 0; i < keys.length; i++) D.prd_listings[keys[i]] = { isbn13: i % 5 ? isb(i) : null, status: i % 40 === 0 ? '판매완료' : '판매중', active: i % 40 !== 0, usedCode: String(i) };
  const sales = {}; for (let d = o.D; d >= 0; d--) { const day = kst(now - d * 864e5); const off = (o.D - d) * 37; D.ml_days[day] = { day, shards: o.S, n: N, colNames: ['key'] };
    for (let s = 0; s < o.S; s++) { const c = { key: [], sp: [], used: [], rank: [], price: [], sameMin: [], list: [], p1: [], top: [], mkt: [], grade: [], age: [], cat: [] };
      for (let r = 0; r < o.R; r++) { const i = (s * o.R + r + off) % keys.length; c.key.push(keys[i]); c.sp.push(rnd() < 0.05 ? null : ri(0, 9000)); c.used.push(ri(0, 140)); c.rank.push(ri(1, 30)); const pr = ri(10, 300) * 100; c.price.push(pr); c.sameMin.push(rnd() < 0.2 ? null : pr + ri(-50, 50) * 100); c.list.push(rnd() < 0.1 ? null : pr * ri(2, 4)); c.p1.push(rnd() < 0.1 ? 0 : ri(1, 20)); c.top.push(d > o.D - 3 ? null : rnd() < 0.3 ? 1 : 0); c.mkt.push(rnd() < 0.15 ? null : Math.floor((now - d * 864e5) / 864e5) - ri(0, 6)); c.grade.push(['상', '중', '최상'][ri(0, 2)]); c.age.push(ri(0, 900)); c.cat.push(ri(1, 99999)); }
      D.ml_days[`${day}_${String(s).padStart(2, '0')}`] = { day, i: s, n: o.R, ver: 1, cols: c, ...(d === 5 ? { rebuilt: true } : {}) }; }
    for (let k = 0; k < o.sold; k++) { const i = ri(0, keys.length - 1); const ym = day.slice(0, 7); (sales[ym] = sales[ym] || []).push([k % 7 ? keys[i].slice(7) : '', isb(i), day + 'T0' + ri(1, 9) + ':00:00', '', '', k % 11 ? 'normal' : 'cancel'].join('\u0001')); }
    const v = {}; for (let k = 0; k < 300; k++) v[isb(ri(0, 2000))] = [ri(0, 3000), 1]; D.sp_daily[day] = { day, v }; }
  for (const [ym, rows] of Object.entries(sales)) D.ml_sales[ym] = { rows }; D.ml_sales._meta = { months: Object.keys(sales) };
  /* 벤치마킹: 판매자 3곳 · 지금 목록 + 사라진 상품 · 시장 지표 첫 페이지 줄의 매물 번호로 잇기 */
  const since = kst(now - 45 * 864e5); for (let s = 0; s < 3; s++) { const sc = String(9100001 + s); D.bench_days[sc + '_1'] = { sc, day: kst(now - 3 * 864e5), spanDays: 20 + s, complete: true, full: true }; D.bench_days[sc + '_0'] = { sc, day: kst(now - 9 * 864e5), spanDays: 5, excl: true, goneList: [JSON.stringify(['b' + s + '_5'])] };
    const M = {}; for (let k = 0; k < o.bench; k++) M['b' + s + '_' + k] = [ri(10, 200) * 100, kst(now - ri(1, 30) * 864e5).replace(/-/g, ''), ['상', '중'][k % 2], 0, 0, 0, 0, k % 4 ? null : isb(k)]; D.bench_state[sc] = { total: o.bench, chunks: 1 }; D['bench_state/' + sc + '/c'] = { 0: k3(s) ? { s: JSON.stringify(M) } : { m: M } };
    for (let k = 0; k < o.bench / 4; k++) D.bench_items[sc + '_g' + s + '_' + k] = { sc, id: 'g' + s + '_' + k, isbn: k % 3 ? null : isb(k + 50), price: ri(10, 200) * 100, grade: '상', firstDay: kst(now - 30 * 864e5), goneDay: kst(now - ri(1, 20) * 864e5), lifeDays: k % 2 ? ri(1, 30) : null }; D.bench_items[sc + '_b' + s + '_5'] = { sc, id: 'b' + s + '_5', price: 5000, goneDay: kst(now - 2 * 864e5), firstDay: kst(now - 9 * 864e5) }; }
  function k3(s) { return s === 1; }
  for (let k = 0; k < 400; k++) { const bid = 'B' + (100000 + k); D.prd_books[bid] = { isbn13: isb(k) }; const fp = []; for (let j = 0; j < 6; j++) fp.push({ price: ri(10, 200) * 100, sellerCode: String(9100001 + (j % 4)), listingId: j < 3 ? `${j % 2 ? 'g' : 'b'}${j % 3}_${(k * 3 + j) % o.bench}` : 'x' + k + j, grade: ['상', '중'][j % 2] }); D.prd_book_metrics[bid] = { salesPoint: ri(0, 5000), usedTotal: ri(0, 80), priceList: ri(100, 400) * 100, usedFirstPage: fp }; }
  void since; return D; }

/* 한 판 돌리기 — kind 'old'|'new' · 결과 문서·SP 관찰·셈이 늘린 살아 있는 힙 최고 */
async function runOnce(kind, o) { const S = kind === 'old' ? oldSrc() : SRC; if (!S) return null; const D = mkData(o); const ML = { ...ML0 }; if (o.nonAdd) { const vt = ML0.valueTrain; ML.valueTrain = (obs, c) => { const m = vt(obs, c); m.mx = obs.reduce((t, x) => Math.max(t, +x.price || 0), 0); return m; }; } /* 더할 수 없는 칸(최댓값) */
  const G = typeof global.gc === 'function' ? global.gc : null; if (G) { G(); G(); } const base = process.memoryUsage().heapUsed; let peak = 0; const meas = o.mem && G; let k = 0;
  const hook = meas ? () => { if (++k % 2) return; G(); const h = process.memoryUsage().heapUsed - base; if (h > peak) peak = h; } : null;
  const F = mkFS(D, hook); const logs = [];
  const X = new Function('C', 'FieldPath', 'mlMod', 'nowIso', 'W', 'log', 'HV', cut(S) + '\n;return { valueLearn, benchObs, vlMerge: typeof vlMerge === "function" ? vlMerge : null, busy: () => (typeof VL_BUSY !== "undefined" ? VL_BUSY : null) };')(F.C, F.FieldPath, async () => ML, () => new Date().toISOString(), () => ({ uploadedAt: 'T' }), (...a) => logs.push(a.join(' ')), null);
  let r2 = null; const p1 = X.valueLearn(true); if (o.twice) r2 = await X.valueLearn(true); const r = await p1; if (meas) { G(); const h = process.memoryUsage().heapUsed - base; if (h > peak) peak = h; }
  const vm = D.app_settings.value_model; const so = D.app_settings.sp_obs; return { r, r2, vm, so, peakMB: Math.round(peak / 1048576), logs, reads: F.st.reads }; }

const strip = (m) => { if (!m) return m; const o = JSON.parse(JSON.stringify(m)); for (const k of ['trainedAt', 'uploadedAt', 'learnMem', 'at']) delete o[k]; if (o.benchSt) { delete o.benchSt.ms; } return o; };
/* 칸마다 수 견줌(상대 오차) */
function near(a, b, tol, p) { p = p || ''; if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)) ? null : p + ` ${a}≠${b}`; if (Array.isArray(a) || (a && typeof a === 'object')) { if (!b || typeof b !== 'object') return p + ' 모양 다름'; const ks = new Set([...Object.keys(a), ...Object.keys(b)]); for (const k of ks) { const e = near(a[k], b[k], tol, p + '.' + k); if (e) return e; } return null; } return a === b ? null : p + ` ${JSON.stringify(a)}≠${JSON.stringify(b)}`; }

(async () => {
  if (process.argv[2] === '--child') { const o = JSON.parse(process.argv[4]); const x = await runOnce(process.argv[3], o); process.stdout.write(JSON.stringify(x ? { peakMB: x.peakMB, n: x.r && x.r.n, lm: x.vm && x.vm.learnMem, docs: x.vm && x.vm.days && x.vm.days.length } : null)); return; }
  console.log('tVLITE1112 — 판매가치 배우기 가볍게');
  const hasOld = !!oldSrc(); if (!hasOld) console.log('  (옛 방식 원문을 git에서 못 찾아 견줌은 건너뜀 — VLITE_OLD_REF=<커밋>)');
  /* ① ② 작은 자료로 옛 방식과 같은지 */
  for (const o of [{ D: 12, S: 3, R: 300, sold: 40, bench: 120, seed: 3 }, { D: 6, S: 2, R: 200, sold: 25, bench: 60, seed: 9, benchOff: true }, { D: 8, S: 2, R: 250, sold: 30, bench: 80, seed: 5, nonAdd: true }]) {
    const tag = o.benchOff ? '벤치 끔' : o.nonAdd ? '더할 수 없는 칸' : '보통'; const N = await runOnce('new', o); if (!hasOld) { ok(N.vm && N.vm.n > 0 && N.vm.oursOnly, `[${tag}] 새 방식이 표를 씀`); continue; } const O = await runOnce('old', o);
    const a = strip(O.vm), b = strip(N.vm); ok(a && b && a.n === b.n && a.pos === b.pos && JSON.stringify(a.days) === JSON.stringify(b.days) && a.salesUsed === b.salesUsed, `[${tag}] 줄 수·판매 수·날짜·판매 기록 수 같음 (n ${b && b.n} · pos ${b && b.pos} · ${b && b.days.length}일)`);
    ok(JSON.stringify(a.oursOnly) === JSON.stringify(b.oursOnly), `[${tag}] 우리 표(oursOnly) 똑같음`, near(a.oursOnly, b.oursOnly, 0));
    ok(JSON.stringify(a.benchOnly) === JSON.stringify(b.benchOnly) && JSON.stringify(a.benchSt) === JSON.stringify(b.benchSt), `[${tag}] 벤치 표·벤치 상태 똑같음`);
    ok(JSON.stringify(a.ours) === JSON.stringify(b.ours), `[${tag}] 우리 최저가배지 비율(ours) 똑같음`, [a.ours, b.ours]);
    const { oursOnly: x1, benchOnly: x2, benchSt: x3, ours: x4, ...ra } = a; const { oursOnly: y1, benchOnly: y2, benchSt: y3, ours: y4, ...rb } = b; const e = near(ra, rb, 1e-9); ok(!e, `[${tag}] 합친 표(src ${b.src}) 칸마다 상대 오차 1e-9 안`, e);
    ok(JSON.stringify(strip(O.so)) === JSON.stringify(strip(N.so)) && N.so && N.so.books > 0, `[${tag}] SP 변화 관찰(sp_obs) 똑같음 (책 ${N.so && N.so.books})`);
    if (o.nonAdd) ok(N.vm.learnMem.mode === 'whole' && N.logs.some((l) => /예전처럼 한 번에/.test(l)), '더할 수 없는 칸이 생기면 예전처럼 한 번에 배움(mode whole)'); else ok(N.vm.learnMem && N.vm.learnMem.mode === 'merge' && N.vm.learnMem.docs === o.D * o.S, `[${tag}] 조각마다 흘려 셈(mode merge · 조각 ${N.vm.learnMem && N.vm.learnMem.docs}개)`); }
  /* ④ 두 번 겹치지 않음 · 진단 길 */
  { const T = await runOnce('new', { D: 3, S: 1, R: 50, sold: 5, bench: 10, twice: true }); ok(T.r2 && T.r2.skip === 'busy' && T.r && T.r.n > 0, '같은 때 두 번 부르면 뒤의 것은 skip busy'); }
  ok(/if \(q\.vlearn\)/.test(SRC) && /HV\('valueLearn', \(\) => valueLearn\(true\)\)/.test(SRC) && /HV\('valueLearn', valueLearn\)/.test(SRC), '진단 vlearn=1(HV로 지금 한 번) · 3시간 사슬은 그대로 HV');
  ok(/v\.rebuilt && ML\.REBUILT_W/.test(SRC) && !/const dm = await C\('ml_days'\)\.where\('day', '>=', since\)\.get\(\)/.test(SRC.slice(SRC.indexOf('async function valueLearn0('), SRC.indexOf('/* (0.19.0) 🔭'))), '하루 모습을 한 번에 받지 않음');
  /* ⑤ 메모리 — 실제 크기(44일 × 8조각 × 2,000줄) · 따로 뜬 노드에서(--expose-gc) */
  const big = { D: 44, S: 8, R: 2000, sold: 120, bench: 6000, seed: 11, mem: true }; const ch = (k) => { try { return JSON.parse(cp.execFileSync(process.execPath, ['--expose-gc', '--max-old-space-size=3000', __filename, '--child', k, JSON.stringify(big)], { encoding: 'utf8', maxBuffer: 16 << 20, timeout: 600e3 })); } catch (e) { return { err: String(e.message).slice(0, 300) }; } };
  const nB = ch('new'); console.log('   새 방식:', JSON.stringify(nB)); ok(nB && nB.peakMB != null && nB.peakMB < 120, `새 방식 셈이 늘린 힙 최고 ${nB && nB.peakMB}MB < 120MB (줄 ${nB && nB.lm && nB.lm.rows})`);
  if (hasOld) { const oB = ch('old'); console.log('   옛 방식:', JSON.stringify(oB)); ok(oB && oB.peakMB > 0 && nB.peakMB * 3 < oB.peakMB, `옛 방식 ${oB && oB.peakMB}MB → 새 방식 ${nB.peakMB}MB (1/3 아래)`); }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exitCode = bad ? 1 : 0;
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
