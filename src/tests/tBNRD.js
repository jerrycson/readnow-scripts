// tBNRD — 11/06: 🎯 집중 벤치마킹 '그날 읽을 판매자는 그날 다'
//  ① 끝나지 않은 어제 바퀴가 남아 있어도 오늘 0시 회차는 오늘 바퀴를 새로 — 어제 바퀴에서 숍 전체를 읽은 🆕 새 것만 차례 판매자를 건너뛰지 않음
//     ⏭ '최근 n시간 건너뛰기'는 숍 전체 차례 판매자에만
//  ② 이어 읽기는 오늘 바퀴에서 아직 안 읽은 판매자도 집음 · ③ 오늘 끝낸 판매자는 다시 안 읽음 · ④ 오늘 바퀴가 없으면 0시 회차 몫을 가로채지 않음
// 쓰는 법: cd <빌드 복사본>/pw && node tBNRD.js [수집기 파일 — 기본 ../readnow-collector.user.js]
// 다른 판매자 공개 숍 목록 흉내만 — 손님 정보 없음
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const COL = process.argv[2] || path.join(__dirname, '..', 'readnow-collector.user.js'); const REG = fs.readFileSync(path.join(__dirname, '..', 'readnow-registry.js'), 'utf8');
const src = fs.readFileSync(COL, 'utf8'); const code = src.slice(src.indexOf('  const kDayB = '), src.indexOf('  async function runChain('));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (r) => r.abort()); await p.setContent('<html><body></body></html>'); await p.addScriptTag({ content: REG });
  const R = await p.evaluate(async ({ code }) => { const store = {}; const col = (n) => (store[n] = store[n] || {}); const LOG = []; const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
    const DEL = { __del: 1 }; const mergeIn = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v === DEL || v === undefined) delete o[k]; else if (v && v.__inc) o[k] = (+o[k] || 0) + v.__inc; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = mergeIn(o[k], v); else o[k] = clone(v); } return o; };
    const WR = []; const ref = (c, id) => ({ get: async () => ({ exists: !!col(c)[id], data: () => clone(col(c)[id]) }), set: async (v, o) => { if (c === 'bench_days') WR.push([id, v.runAt, Date.now()]); col(c)[id] = o && o.merge ? mergeIn(col(c)[id], v) : mergeIn({}, v); }, update: async (v) => { col(c)[id] = mergeIn(col(c)[id], v); }, delete: async () => { delete col(c)[id]; }, onSnapshot: () => () => {}, collection: (n) => ({ doc: (i2) => ref(c + '/' + id + '/' + n, i2) }) });
    const C = (n) => ({ doc: (id) => ref(n, id) });
    const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), update: (r, v) => ops.push(() => r.update(v)), delete: (r) => ops.push(() => r.delete()), commit: async () => { for (const f of ops) await f(); } }; }, runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
    const firebase = { firestore: { FieldValue: { arrayUnion: (...a) => a, delete: () => DEL, increment: (n) => ({ __inc: n }) } } };
    const W = () => ({}); const nowIso = () => new Date().toISOString(); const log = (m) => LOG.push(String(m)); const PC_NAME = 'LOGGER'; const PC_ID = 'pc1'; const TAB_ID = 't1'; const ui = () => {}; let stopFlag = false; let FORCE_ALL = false; const PUBONLY = false; let BENCH_DAYRUN = false; const benchDoneToday = () => false;
    const saveProgress = async (n, prog) => { col('prd_jobs')[n] = mergeIn(col('prd_jobs')[n], clone(prog)); }; const loadProgress = async (n) => { const d = col('prd_jobs')[n]; return d && !d.done ? clone(d) : null; }; const finishJob = async (n, summary) => { col('prd_jobs')[n] = { ...(col('prd_jobs')[n] || {}), done: true, summary }; };
    const acquireLane = async () => ({ ok: true }); const releaseLane = async () => {}; const lockMsg = () => ''; const PACE = { cooling: () => 0 };
    /* 숍 흉내 — 등록순(새 상품이 앞) · 한 쪽 10개 */
    const SHOP = {}; const ROWS = 10; const READS = {}; const cell = (id) => `<td valign="top"><input type="checkbox" name="chkCart.U${id}"><a class="bo" href="/shop/wproduct.aspx?ItemId=${id}">[중고-상] 책 ${id}</a> <span class="p1_bold">3,000</span></td>`;
    const pageHtml = (sc, pg) => { const L = SHOP[sc]; const last = Math.ceil(L.length / ROWS); const part = L.slice((pg - 1) * ROWS, pg * ROWS); return `<html><body><table><tr>${part.map(cell).join('')}</tr></table><a href="javascript:Page_Set('${last}')">끝</a></body></html>`; };
    const docOf = (url) => { const sc = url.match(/SC=(\d+)/)[1]; const pg = +url.match(/page=(\d+)/)[1]; READS[sc] = (READS[sc] || 0) + 1; const h = pageHtml(sc, pg); return { doc: new DOMParser().parseFromString(h, 'text/html'), html: h }; };
    const PUB = { st: { shop: { mode: 'anon', last: null } }, read: async (k, url, fn) => { const g = docOf(url); return { ...g, ...fn(g) }; } }; const getDoc = async (url) => docOf(url);
    window.__rnStatus = {};
    eval(code + '; window.__b = { benchOne, benchJob, benchFinish, kDayB };');
    const B = window.__b; const day = B.kDayB(); const H = 3600e3; const iso = (ms) => new Date(ms).toISOString(); const D0 = Date.parse(day + 'T00:00:00+09:00'); const NOW = Date.now();
    /* 판매자 A(111) = 🆕 새 것만 그룹(숍 전체 7일마다) — 어제 밤(0시 1~2시간 전) 숍 전체를 끝냄 → 오늘은 새 것만 차례 · lightAt·lastLight 없음 */
    const OLD = Array.from({ length: 40 }, (_, i) => String(500 + i)); SHOP['111'] = Array.from({ length: 6 }, (_, i) => String(900 + i)).concat(OLD);
    const known = () => ({ s: JSON.stringify(Object.fromEntries(OLD.map((id) => [id, [3000, '20261101', '상', 1, '책', 0, 0, null, null, null, 0]]))), fmt: 'json' });
    /* 판매자 B(222) = 숍 전체 그룹 — 어제 바퀴(어제 0시 회차)에서 어제 03시에 읽음 */
    SHOP['222'] = Array.from({ length: 15 }, (_, i) => String(300 + i));
    /* 판매자 C(333) = 숍 전체 그룹 — 어제 밤 늦게 숍 전체를 끝냄 → ⏭ 최근 n시간 건너뛰기에 걸림(숍 전체 차례라 건너뛰는 게 맞음) */
    SHOP['333'] = Array.from({ length: 12 }, (_, i) => String(700 + i));
    const stFull = (st, en) => ({ day: iso(st).slice(0, 10), runAt: iso(st), endAt: iso(en), completeEndAt: iso(en), okEndAt: iso(en), okRunAt: iso(st), readEndAt: iso(en), chunks: 0, lastPage: 2, rows: { size: ROWS, at: nowIso() } });
    const skH = Math.ceil((NOW - D0) / H) + 3; /* A·C(어제 밤)는 걸리고 B(어제 03시)는 안 걸리는 시간 */
    const setup = () => { col('bench_state')['111'] = { ...stFull(D0 - 2 * H, D0 - H), chunks: 1, lastPage: 5 }; col('bench_state/111/c')['0'] = known(); col('bench_state')['222'] = stFull(D0 - 21 * H, D0 - 20 * H); col('bench_state')['333'] = stFull(D0 - 3 * H, D0 - 1.5 * H);
      for (const k of Object.keys(col('bench_days'))) delete col('bench_days')[k]; for (const k of Object.keys(col('bench_state/111/lt'))) delete col('bench_state/111/lt')[k]; for (const k of ['111', '222', '333']) { READS[k] = 0; delete col('prd_jobs')['bench_' + k]; } };
    col('app_settings')['bench'] = { targets: [{ sc: '111', name: '판매자A', on: true }, { sc: '222', name: '판매자B', on: true }, { sc: '333', name: '판매자C', on: true }], forceSkip: { on: true, h: skH }, groups: [{ id: 'g1', name: '그룹 1-가', unit: 'd', n: 1, light: { on: true, by: 'd', fullDays: 7 }, scs: ['111'] }, { id: 'g2', name: '그룹 2', unit: 'd', n: 1, scs: ['222', '333'] }] };
    const out = { skH }; const daysOf = (sc) => Object.values(col('bench_days')).filter((d) => d.sc === sc); const rd = () => ({ A: READS['111'] || 0, B: READS['222'] || 0, C: READS['333'] || 0, dA: daysOf('111').length, lightA: daysOf('111').map((d) => !!d.light) });
    /* ① 오늘 0시 회차 — 어제 0시에 시작한 바퀴가 done:false로 남아 있음(A·B는 어제 바퀴에서 끝냄 표시 fin) */
    setup(); const yS = D0 - 24 * H + 5 * 60e3; col('prd_jobs')['benchForce'] = { startedAt: iso(yS), list: ['111', '222', '333'], done: false, by: 'LOGGER', fin: { '111': iso(D0 - H), '222': iso(D0 - 20 * H) }, failed: [] };
    LOG.length = 0; await B.benchJob({ force: true }); out.r0 = { ...rd(), bf: { done: col('prd_jobs')['benchForce'].done, startedAt: col('prd_jobs')['benchForce'].startedAt }, log: LOG.filter((l) => /어제|건너|강제 실행 시작|강제 실행 끝/.test(l)).slice(0, 6) };
    /* ② 오늘 0시 회차가 A를 건너뛰고 '끝'(done · failed 없음)으로 닫힌 뒤의 이어 읽기 — A를 꼭 읽음 · 오늘 끝낸 B · ⏭ 걸린 C는 안 읽음 */
    setup(); col('bench_state')['222'] = stFull(D0 + 5 * 60e3, Math.min(NOW - 60e3, D0 + 30 * 60e3)); const tS = D0 + 5 * 60e3; col('prd_jobs')['benchForce'] = { startedAt: iso(tS), list: ['111', '222', '333'], done: true, doneAt: iso(Math.min(NOW - 30e3, D0 + 2 * H)), by: 'LOGGER', fin: { '222': iso(D0 + 30 * 60e3) }, failed: [] };
    LOG.length = 0; const r1 = await B.benchJob({ force: true, resume: true }); out.r1 = { ret: r1 === undefined ? 'done' : r1, ...rd(), log: LOG.filter((l) => /이어 읽기|못 끝낸/.test(l)).slice(0, 4) };
    /* ③ 그다음 이어 읽기 — A는 오늘 새 것만을 끝냈으니 다시 읽지 않음 */
    col('prd_jobs')['benchForce'] = { ...col('prd_jobs')['benchForce'], done: true, failed: [] }; for (const k of ['111', '222', '333']) READS[k] = 0; const nA = daysOf('111').length;
    LOG.length = 0; const r2 = await B.benchJob({ force: true, resume: true }); out.r2 = { ret: r2, ...rd(), dAadd: daysOf('111').length - nA };
    /* ④ 오늘 바퀴가 아직 없을 때(어제 바퀴가 끝남)의 이어 읽기 — 0시 회차 몫을 가로채지 않음(바로 끝) */
    setup(); col('bench_state')['222'] = stFull(D0 - 5 * H, D0 - 4 * H); /* 🩺 30시간에 걸리지 않게 */ col('prd_jobs')['benchForce'] = { startedAt: iso(yS), list: ['111', '222', '333'], done: true, doneAt: iso(yS + 3 * H), by: 'LOGGER', fin: {}, failed: [] };
    const r3 = await B.benchJob({ force: true, resume: true }); out.r3 = { ret: r3, ...rd() };
    return out; }, { code });
  console.log(JSON.stringify(R, null, 1).slice(0, 4000));
  ok(R.r0.A >= 1 && R.r0.lightA.length === 1 && R.r0.lightA[0], `① 0시 회차: 어제 바퀴가 안 닫혀 있어도 새 것만 차례 A를 오늘 읽음(${R.r0.A}쪽 · 새 것만 ${R.r0.lightA.join(',')}) — 예전엔 '어제 바퀴에서 끝냄'으로 건너뜀`);
  ok(R.r0.B >= 2, `① 0시 회차: 어제 바퀴에서 읽은 숍 전체 B도 오늘 바퀴에서 읽음(${R.r0.B}쪽)`);
  ok(R.r0.C === 0, `① 0시 회차: ⏭ 최근 ${R.skH}시간 건너뛰기는 숍 전체 차례 C에만(${R.r0.C}쪽)`);
  ok(R.r0.bf.done === true && Date.parse(R.r0.bf.startedAt) >= Date.now() - 3600e3, `① 오늘 바퀴를 새로 열고 끝을 적음(done ${R.r0.bf.done})`);
  ok(R.r1.A >= 1 && R.r1.dA === 1, `② 이어 읽기: 0시 회차가 건너뛴 새 것만 차례 A를 집어 읽음(${R.r1.A}쪽 · 기록 ${R.r1.dA}개)`);
  ok(R.r1.B === 0 && R.r1.C === 0, `② 이어 읽기: 오늘 끝낸 B·⏭ 걸린 C는 읽지 않음(B ${R.r1.B} · C ${R.r1.C})`);
  ok(R.r2.ret === 'skip' && R.r2.A === 0 && R.r2.dAadd === 0, `③ 다음 이어 읽기: 오늘 새 것만을 끝낸 A는 다시 안 읽음(${R.r2.ret} · A ${R.r2.A}쪽)`);
  ok(R.r3.ret === 'skip' && R.r3.A + R.r3.B + R.r3.C === 0, `④ 오늘 바퀴가 아직 없으면 이어 읽기는 0시 회차 몫을 가로채지 않음(${R.r3.ret})`);
  await br.close(); console.log(bad ? `❌ tBNRD 실패 ${bad}` : '✓ tBNRD 통과'); process.exit(bad ? 1 : 0); })();
