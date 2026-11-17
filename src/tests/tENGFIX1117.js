/* tENGFIX1117 — (일꾼 engfix2 · 매일 견줌 엔진 eng1117이 찾은 멈춘 연구 고침 · 값·비용은 안 바꿈)
 *  ① wireTick(W01) 순서 — 그림자(ml_shadow)는 스스로 배우기 안에서 써짐: 오늘 그림자가 없으면 한국 6시·배우기 끝날 때까지 기다리고, 그 뒤엔 전날 그림자를 읽음(shDay)
 *  ② benchObsTick(N07·W11) — 클라우드가 하루 한 번 견줌 관측을 씀 · 오늘 화면 관측이 있으면 안 씀 · 바꾸기 전 옛 관측을 bench_obs_hist에 남김(덮지 않음) · 그사이 화면이 쓰면 그대로 둠
 *  ③ bobsHas — 웹앱 bcProbe와 같은 뜻(전역 함수만)
 *  지어낸 값만(실제 손님·판매 없음) · 실행: node tENGFIX1117.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error('없음 ' + rel); };
const src = fs.readFileSync(findUp('cloud/index.js'), 'utf8');
const cut = (A, B) => { const a = src.indexOf(A); const b = src.indexOf(B); if (a < 0 || b < 0) throw new Error('구역 없음 ' + A); return src.slice(src.indexOf('*/', a) + 2, b); };
const WIRE = cut('WIRE-START', '/* WIRE-END */'); const BOBS = cut('BOBS-START', '/* BOBS-END */');
const ML = require(findUp('readnow-ml-core.js'));
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
function mkStore() { const store = new Map(); const writes = [];
  const docRef = (col, id) => ({ get: async () => { const v = store.get(col + '/' + id); return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; },
    set: async (v, o) => { writes.push(col + '/' + id); const old = (o && o.merge && store.get(col + '/' + id)) || {}; store.set(col + '/' + id, { ...old, ...JSON.parse(JSON.stringify(v)) }); },
    create: async (v) => { if (store.has(col + '/' + id)) { const e = new Error('6 ALREADY_EXISTS'); e.code = 6; throw e; } writes.push(col + '/' + id); store.set(col + '/' + id, JSON.parse(JSON.stringify(v))); } });
  const colRef = (col) => ({ doc: (id) => docRef(col, id), select: () => colRef(col), get: async () => { const L = [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)) })); return { forEach: (f) => L.forEach(f), docs: L, size: L.length }; } });
  return { store, writes, C: colRef }; }
const fakeDate = (fixed) => { class FD extends Date { constructor(...a) { if (a.length) super(...a); else super(fixed); } static now() { return fixed; } } return FD; };
(async () => {
console.log('① wireTick — 그림자 순서');
const T = Date.parse('2026-11-17T18:00:00Z'); /* 한국 11/18 03:00 — 결과 기록(lastDay)은 오늘, 배우기는 아직 */ const today = kday(T); const yday = kday(T - 864e5);
const run1 = async (learnDay, fixed) => { const S = mkStore(); const iso = (ms) => new Date(ms).toISOString(); const keys = [], pc = [], rows = [];
  for (let i = 0; i < 40; i++) { const key = 'aladin_' + (2000 + i); keys.push(key); pc.push(i / 40); rows.push({ key, price: 4000, grade: 1, age: 120, list: 12000, sp: 300, p1: 10, rank: 2 });
    S.store.set('prd_price_decisions/' + key, { status: 'ok', action: i % 2 ? 'set' : 'none', delta: i % 2 ? -200 : 0, current: 4000, target: i % 2 ? 3800 : null, tier: { days: 120 }, at: iso(fixed - 3600e3), usedCode: String(2000 + i) }); }
  S.store.set('app_settings/ml_state', { lastDay: kday(fixed), days: [kday(fixed - 2 * 864e5), kday(fixed - 864e5), kday(fixed)], learn: { day: learnDay } });
  const asked = []; const ctx = { FV: { increment: (n) => n }, Math, Date: fakeDate(fixed), JSON, Object, Array, Number, String, Set, Map, isFinite, console, Promise,
    C: S.C, W: () => ({ writer: 'cloud' }), nowIso: () => new Date(fixed).toISOString(), kday, shard: (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }, ENGX_MEM_N: 600, VER: 'test', log: () => {},
    mlMod: async () => ML, mlLoadDay: async () => rows, mlShadowLoad: async (d) => { asked.push(d); return d === kday(fixed - 864e5) ? { at: iso(fixed - 20 * 3600e3), keys, pc, ph: pc } : null; }, mlSales: async () => new Map() };
  vm.runInNewContext(WIRE + ';this.wireTick = wireTick;', ctx); const r = await ctx.wireTick(); return { r, S, asked }; };
let o = await run1(yday, T); ok(o.r && /그림자 기다림/.test(o.r.skip || ''), '한국 6시 전 · 배우기 전 · 오늘 그림자 없음 → 기다림(전날 것으로 서두르지 않음)', o.r);
ok(!o.S.store.get('app_settings/eng_wires'), '기다릴 땐 요약을 쓰지 않음(다음 회차가 다시 셈)');
o = await run1(today, T); const sm = o.S.store.get('app_settings/eng_wires'); ok(o.r && o.r.n === 3 && sm && sm.shDay === yday && sm.mlDay === today, '배우기 끝났는데 오늘 그림자 없음 → 전날 그림자(shDay) 읽음', { r: o.r, shDay: sm && sm.shDay });
ok(sm && sm.w.W01 && sm.w.W01.reads === 40, 'W01이 전날 그림자로 읽음(예전엔 0)', sm && sm.w.W01);
const T7 = Date.parse('2026-11-17T22:30:00Z'); /* 한국 07:30 */ o = await run1(kday(T7 - 864e5), T7); const sm7 = o.S.store.get('app_settings/eng_wires'); ok(sm7 && sm7.shDay === kday(T7 - 864e5) && o.asked[0] === kday(T7), '한국 6시 넘으면 배우기를 더 기다리지 않고 전날 그림자', { asked: o.asked, shDay: sm7 && sm7.shDay });
ok(JSON.stringify([...o.S.store.keys()].filter((k) => k.startsWith('prd_price_decisions/')).length) === '40' && !o.S.writes.some((w) => /^prd_|^eng_exp/.test(w)), '판정 기록·실험 장부는 안 고침(무손해)');

console.log('② benchObsTick — 견줌 관측');
const T2 = Date.parse('2026-11-17T03:00:00Z'); /* 한국 12:00 */ const d2 = kday(T2);
const files = { 'facts-docs/bench.json': JSON.stringify({ at: '2026-11-10T00:00:00Z', round: 7, items: [{ probe: 'fxA' }, { probe: 'fxB' }, { probe: 'fxC' }, { probe: 'bad name' }] }),
  'app/index.html': "<script>\nconst APP_VER = '9.9.9';\nfunction fxA(){}\n</script><script src=\"./p.js?v=1\"></script><script src=\"https://cdn.example/x.js\"></script>", 'app/p.js': 'window.fxB = function(){}; const fxC = () => 1;' };
const mkB = (S, extra = {}) => { const fetched = []; const ctx = { Math, Date: fakeDate(T2), JSON, Object, Array, Number, String, Set, Map, RegExp, console, Promise, AbortSignal: { timeout: () => null },
    fetch: async (u) => { const p = u.replace(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/refs\/heads\/main\//, ''); fetched.push(p); const t = (extra.files || files)[p]; return { ok: t != null, status: t != null ? 200 : 404, text: async () => t }; },
    C: S.C, W: () => ({ writer: 'cloud' }), nowIso: () => new Date(T2).toISOString(), kday, log: () => {} };
  vm.runInNewContext(BOBS + ';this.benchObsTick = benchObsTick; this.benchObsCalc = benchObsCalc; this.bobsHas = bobsHas; this.BOBS = BOBS;', ctx); return { ctx, fetched }; };
let S = mkStore(); S.store.set('app_settings/bench_obs', { day: '2026-11-11', at: '2026-11-11T05:00:00Z', ver: '1.78.500', round: 6, chk: { fxA: true } });
let B = mkB(S); let r = await B.ctx.benchObsTick(); const cur = S.store.get('app_settings/bench_obs');
ok(r && r.n === 3 && r.y === 2 && cur.day === d2 && cur.by === 'cloud' && cur.ver === '9.9.9' && cur.round === 7, '오늘 관측 없음 → 클라우드가 같은 꼴로 씀(확인 3개 중 2개)', { r, cur });
ok(cur.chk.fxA === true && cur.chk.fxB === true && cur.chk.fxC === false && !('bad name' in cur.chk), '전역 함수만 참(const는 거짓 · 이름 아닌 것 뺌)', cur.chk);
ok(S.store.get('bench_obs_hist/2026-11-11_web') && S.store.get('bench_obs_hist/2026-11-11_web').ver === '1.78.500' && S.store.get('bench_obs_hist/' + d2 + '_cloud'), '바꾸기 전 옛 화면 관측과 새 클라우드 관측을 장부에 남김(덮지 않음)');
ok(!B.fetched.some((p) => /cdn\.example/.test(p)) && B.fetched.includes('app/p.js'), '같은 출처 스크립트만 받음');
r = await B.ctx.benchObsTick(); ok(r === null, '하루 한 번(다시 부르면 안 셈)');
S = mkStore(); const webObs = { day: d2, at: new Date(T2 - 60e3).toISOString(), ver: '1.78.700', chk: { fxA: true, fxB: false }, by: '정범 PC' }; S.store.set('app_settings/bench_obs', webObs);
B = mkB(S); r = await B.ctx.benchObsTick(true); ok(r && /이미/.test(r.skip || '') && JSON.stringify(S.store.get('app_settings/bench_obs')) === JSON.stringify(webObs) && !S.writes.length && !B.fetched.length, '오늘 화면 관측이 있으면 받지도 쓰지도 않음(두 번 안 씀)', { r, writes: S.writes });
S = mkStore(); S.store.set('app_settings/bench_obs', { day: '2026-11-11', chk: {} }); let n = 0;
const C0 = S.C; S.C = (c) => { const R = C0(c); if (c !== 'app_settings') return R; return { ...R, doc: (id) => { const D = R.doc(id); if (id !== 'bench_obs') return D; return { ...D, get: async () => { n++; if (n === 2) S.store.set('app_settings/bench_obs', webObs); return D.get(); } }; } }; };
B = mkB(S); r = await B.ctx.benchObsTick(true); ok(r && /그사이/.test(r.skip || '') && S.store.get('app_settings/bench_obs').by === '정범 PC', '그사이 화면이 오늘 관측을 쓰면 그대로 둠', { r, cur: S.store.get('app_settings/bench_obs') });
S = mkStore(); B = mkB(S, { files: { ...files, 'app/p.js': undefined } }); let er = null; try { await B.ctx.benchObsTick(true); } catch (e) { er = e.message; } ok(er && /다 못 받음/.test(er) && !S.store.get('app_settings/bench_obs'), '웹앱 파일 하나라도 못 받으면 \'없음\'으로 잘못 적지 않음', er);

console.log('③ bobsHas');
const H = B.ctx.bobsHas; ok(H('function a1(){}', 'a1') && H('async function a1 (x){}', 'a1') && H('var a1 = 1', 'a1') && H('x; globalThis.a1 = f', 'a1') && H('self.a1=f', 'a1'), '전역 함수 꼴 찾음');
ok(!H('const a1 = () => 1', 'a1') && !H('let a1 = 1', 'a1') && !H('o.window.a1 == f', 'a1') && !H('  function a1(){}', 'a1') && !H('function a12(){}', 'a1'), '전역 아님·다른 이름·같음 비교는 거짓');
ok(H('function $x(){}', '$x'), '$ 들어간 이름');

console.log('④ 진단 sevals(R13)');
const sv = src.slice(src.indexOf('if (q.sevals)'), src.indexOf('if (q.benchobs)')); ok(/select\('label', 'model', 'models'\)/.test(sv) && !/title|name|phone|addr|order/i.test(sv.replace(/\/\*[\s\S]*?\*\//g, '')), '판매가 평가 진단은 평가·모델 칸만 읽음(사람·주문 칸 안 냄)');
const dj = src.slice(src.indexOf('async function dailyJobs'), src.indexOf('async function dailyJobs') + 40000); ok(/J\.benchobs !== false[^\n]*benchObsTick\(\)/.test(dj), '10분마다 dailyJobs가 부름 · 끄기 cloud_jobs.benchobs=false');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌', e.stack); process.exit(1); });
