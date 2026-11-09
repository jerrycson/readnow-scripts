// tBENCH1109 — 11/09 정범님: 🎯 집중 벤치마킹 딱따구리 회차가 네 번 따로 생기고 뒤 판매자 5곳이 하루 종일 못 감
//  ① 쪽을 '못 받음'(인터넷 끊김·테더링 막힘)은 '자리를 못 찾음'이 아님 → 회차를 끝내지 않고 자리 그대로 · 진짜 '못 찾음'(숍이 크게 바뀜)은 예전처럼 끝냄
//  ② 이어 읽기는 아직 안 읽은 판매자 먼저 · 시작했다 못 끝낸 큰 숍은 뒤에서 저장된 자리부터(1쪽부터 새 회차를 열지 않음)
//  ③ ⚡ 지금 임시 회차 — 한 번만(중복 없음) · 로거 테더링 되면 로거 · 로거 30분 넘게 부재면 사무실 PC · 오늘 못 끝낸 판매자 모두
// 쓰는 법: cd <빌드 복사본>/pw && node tBENCH1109.js [수집기 파일 — 기본 ../readnow-collector.user.js]
// 다른 판매자 공개 숍 목록 흉내만 — 손님 정보 없음
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const COL = process.argv[2] || path.join(__dirname, '..', 'readnow-collector.user.js'); const REG = fs.readFileSync(path.join(__dirname, '..', 'readnow-registry.js'), 'utf8');
const src = fs.readFileSync(COL, 'utf8'); const code = src.slice(src.indexOf('  const kDayB = '), src.indexOf('  async function runChain('));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (r) => r.abort()); await p.setContent('<html><body></body></html>'); await p.addScriptTag({ content: REG });
  const R = await p.evaluate(async ({ code }) => { const store = {}; const col = (n) => (store[n] = store[n] || {}); const LOG = []; const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
    const DEL = { __del: 1 }; const mergeIn = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v === DEL || v === undefined) delete o[k]; else if (v && v.__inc) o[k] = (+o[k] || 0) + v.__inc; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = mergeIn(o[k], v); else o[k] = clone(v); } return o; };
    const ref = (c, id) => ({ get: async () => ({ exists: !!col(c)[id], data: () => clone(col(c)[id]) }), set: async (v, o) => { col(c)[id] = o && o.merge ? mergeIn(col(c)[id], v) : mergeIn({}, v); }, update: async (v) => { col(c)[id] = mergeIn(col(c)[id], v); }, delete: async () => { delete col(c)[id]; }, onSnapshot: () => () => {}, collection: (n) => ({ doc: (i2) => ref(c + '/' + id + '/' + n, i2) }) });
    const C = (n) => ({ doc: (id) => ref(n, id) });
    const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), update: (r, v) => ops.push(() => r.update(v)), delete: (r) => ops.push(() => r.delete()), commit: async () => { for (const f of ops) await f(); } }; }, runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
    const firebase = { firestore: { FieldValue: { arrayUnion: (...a) => a, delete: () => DEL, increment: (n) => ({ __inc: n }) } } };
    const W = () => ({}); const nowIso = () => new Date().toISOString(); const log = (m) => LOG.push(String(m)); const PC_NAME = 'LOGGER'; const PC_ID = 'pc1'; const TAB_ID = 't1'; const ui = () => {}; let stopFlag = false; let FORCE_ALL = false; const PUBONLY = false; let BENCH_DAYRUN = false; const benchDoneToday = () => false;
    let TGATE = { ok: true, why: '' }; /* 로거 테더링 문 흉내 */
    const saveProgress = async (n, prog) => { col('prd_jobs')[n] = mergeIn(col('prd_jobs')[n], clone(prog)); }; const loadProgress = async (n) => { const d = col('prd_jobs')[n]; return d && !d.done ? clone(d) : null; }; const finishJob = async (n, summary) => { col('prd_jobs')[n] = { ...(col('prd_jobs')[n] || {}), done: true, summary }; };
    const acquireLane = async () => ({ ok: true }); const releaseLane = async () => {}; const lockMsg = () => ''; const PACE = { cooling: () => 0 };
    /* 숍 흉내 — 등록순 · 한 쪽 10개 · NET = 이 판매자 쪽 받기 실패(인터넷 끊김) · FAILPG = 이 쪽만 실패 · onRead = 읽을 때마다(테더링 끊김 흉내) */
    const SHOP = {}; const ROWS = 10; const READS = []; const NET = new Set(); const FAILPG = {}; let onRead = null; const cell = (id) => `<td valign="top"><input type="checkbox" name="chkCart.U${id}"><a class="bo" href="/shop/wproduct.aspx?ItemId=${id}">[중고-상] 책 ${id}</a> <span class="p1_bold">3,000</span></td>`;
    const pageHtml = (sc, pg) => { const L = SHOP[sc]; const last = Math.ceil(L.length / ROWS); const part = L.slice((pg - 1) * ROWS, pg * ROWS); return `<html><body><table><tr>${part.map(cell).join('')}</tr></table><a href="javascript:Page_Set('${last}')">끝</a></body></html>`; };
    const docOf = (url) => { const sc = url.match(/SC=(\d+)/)[1]; const pg = +url.match(/page=(\d+)/)[1]; if (onRead) onRead(sc, pg); if (NET.has(sc) || (FAILPG[sc] && FAILPG[sc] === pg)) throw new Error('Failed to fetch(인터넷 끊김 흉내)'); READS.push([sc, pg]); const h = pageHtml(sc, pg); return { doc: new DOMParser().parseFromString(h, 'text/html'), html: h }; };
    const PUB = { st: { shop: { mode: 'anon', last: null } }, read: async (k, url, fn) => { const g = docOf(url); return { ...g, ...fn(g) }; } }; const getDoc = async (url) => docOf(url);
    window.__rnStatus = {};
    eval(code + '; window.__b = { benchOne, benchJob, benchFinish, kDayB, benchXnowClaim, benchXnowEnd, BXN };');
    const B = window.__b; const day = B.kDayB(); const H = 3600e3; const iso = (ms) => new Date(ms).toISOString(); const D0 = Date.parse(day + 'T00:00:00+09:00'); const NOW = Date.now();
    const ids = (base, n) => Array.from({ length: n }, (_, i) => String(base + i));
    const BIG = '100', S1 = '200', S2 = '300';
    const stFull = (st, en, lp) => ({ day: iso(st).slice(0, 10), runAt: iso(st), endAt: iso(en), completeEndAt: iso(en), okEndAt: iso(en), okRunAt: iso(st), readEndAt: iso(en), chunks: 0, lastPage: lp, rows: { size: ROWS, at: nowIso() } });
    const T0big = iso(Math.max(D0 + 60e3, NOW - 2 * H)); /* 오늘 시작한 큰 숍 회차 */
    const reset = () => { for (const k of Object.keys(store)) if (k !== 'app_settings') delete store[k]; READS.length = 0; NET.clear(); for (const k of Object.keys(FAILPG)) delete FAILPG[k]; onRead = null; TGATE.ok = true; LOG.length = 0;
      SHOP[BIG] = ids(10000, 400); SHOP[S1] = ids(20000, 15); SHOP[S2] = ids(30000, 12);
      col('bench_state')[BIG] = { ...stFull(D0 - 30 * H, D0 - 26 * H, 40), prog: { startedAt: T0big, page: 11, at: nowIso() } }; col('bench_state')[S1] = stFull(D0 - 22 * H, D0 - 21 * H, 2); col('bench_state')[S2] = stFull(D0 - 22 * H, D0 - 21 * H, 2);
      /* 큰 숍: 10쪽까지 읽고 멈춘 회차(저장된 자리 11쪽) */ col('prd_jobs')['bench_' + BIG] = { day, page: 11, blocks: 0, items: SHOP[BIG].slice(0, 100).map((id) => [id, 3000, '상', '책', null, null, null, 0, 1, null, null, null]), startedAt: T0big, sc: BIG, name: '큰숍', readDone: false, pagingBroken: false, lastPage: 40, rows: ROWS, readFrom1: true, done: false }; };
    col('app_settings')['bench'] = { targets: [{ sc: BIG, name: '큰숍', on: true }, { sc: S1, name: '작은숍1', on: true }, { sc: S2, name: '작은숍2', on: true }], forceSkip: { on: true, h: 30 }, groups: [{ id: 'g1', name: '그룹 1', unit: 'd', n: 1, scs: [BIG, S1, S2] }] };
    const out = {}; const prog = () => col('prd_jobs')['bench_' + BIG] || {}; const daysOf = (sc) => Object.values(col('bench_days')).filter((d) => d.sc === sc);
    /* ①-1 자리 찾기 중 쪽을 못 받음(인터넷 끊김) */
    reset(); NET.add(BIG); let r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a1 = { r, done: !!prog().done, page: prog().page, days: daysOf(BIG).length, last: (prog().resumes || []).slice(-1)[0] };
    /* ①-2 자리 찾기 중 테더링 길이 막힘 + 받은 쪽이 엉뚱함(m 0) — 예전엔 '못 찾음'으로 회차를 끝냈음 */
    reset(); SHOP[BIG] = ids(50000, 400); onRead = (sc) => { if (sc === BIG) TGATE.ok = false; }; r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a2 = { r, done: !!prog().done, page: prog().page, days: daysOf(BIG).length, last: (prog().resumes || []).slice(-1)[0] };
    /* ①-3 본 읽기 중 15쪽을 못 받음 */
    reset(); FAILPG[BIG] = 15; r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a3 = { r, done: !!prog().done, page: prog().page, days: daysOf(BIG).length };
    /* ①-4 진짜 '못 찾음'(인터넷 멀쩡 · 그사이 숍이 통째로 바뀜) — 예전처럼 끝냄 */
    reset(); SHOP[BIG] = ids(50000, 400); r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a4 = { r, done: !!prog().done, days: daysOf(BIG).map((d) => ({ an: !!d.anchorLost, partial: d.partial })), stProg: (col('bench_state')[BIG] || {}).prog || null };
    /* ② 이어 읽기 — 오늘 바퀴에서 큰 숍만 못 끝냄(failed) · 작은숍 둘은 오늘 아직 안 읽음 */
    reset(); col('prd_jobs')['benchForce'] = { startedAt: iso(D0 + 1000), list: [BIG, S1, S2], done: true, doneAt: iso(Math.min(NOW - 30e3, D0 + 2 * H)), by: 'LOGGER', fin: {}, failed: [BIG] };
    r = await B.benchJob({ force: true, resume: true }); { const first = []; for (const [sc] of READS) if (!first.includes(sc)) first.push(sc); const big = READS.filter(([sc]) => sc === BIG).map(([, pg]) => pg); out.b = { r: r === undefined ? 'done' : r, first, bigFirst: big[0], bigFrom1: big.filter((pg) => pg === 1).length, bigDays: daysOf(BIG).map((d) => ({ runAt: d.runAt, partial: !!d.partial })), t0: T0big, list: col('prd_jobs')['benchForce'].list, log: LOG.filter((l) => /차례|이어 읽기/.test(l)).slice(0, 4) }; }
    /* ③ ⚡ 지금 임시 회차 — 한 번만 */
    reset(); const c1 = await B.benchXnowClaim('logger', { netOk: false }); const c2 = await B.benchXnowClaim('logger', { netOk: true }); const c3 = await B.benchXnowClaim('logger', { netOk: true }); const c3o = await B.benchXnowClaim('office', { away: true }); await B.benchXnowEnd('done'); const c4 = await B.benchXnowClaim('logger', { netOk: true }); const c4o = await B.benchXnowClaim('office', { away: true });
    out.c = { c1, c2, c3, c3o, c4, c4o };
    reset(); const o1 = await B.benchXnowClaim('office', { away: false }); const o2 = await B.benchXnowClaim('office', { away: true }); const as0 = col('prd_jobs')[B.BXN.id].awaySince; const o3 = await B.benchXnowClaim('office', { away: true }); col('prd_jobs')[B.BXN.id].awaySince = Date.now() - 31 * 60e3; const o4 = await B.benchXnowClaim('office', { away: true }); const o5 = await B.benchXnowClaim('logger', { netOk: true });
    /* 오래 신호 없는 '하는 중'(멈춘 탭)은 넘겨받음 — 같은 회차 하나 */ col('prd_jobs')[B.BXN.id].beat = Date.now() - 20 * 60e3; const o6 = await B.benchXnowClaim('logger', { netOk: true });
    out.o = { o1, o2, as0: !!as0, o3, o4, o5, o6, doc: { state: col('prd_jobs')[B.BXN.id].state, by: col('prd_jobs')[B.BXN.id].by, tries: col('prd_jobs')[B.BXN.id].tries, takeOver: col('prd_jobs')[B.BXN.id].takeOver } };
    /* ③ 임시 회차 실행 — 어제 바퀴가 끝나 있어 평소 이어 읽기는 '없음'인데도 오늘 못 읽은 판매자 모두 · ⏭ 최근 읽음 건너뛰기와 상관없이 · 큰 숍은 뒤에서 이어 */
    reset(); col('prd_jobs')['benchForce'] = { startedAt: iso(D0 - 24 * H + 5 * 60e3), list: [BIG, S1, S2], done: true, doneAt: iso(D0 - 20 * H), by: 'LOGGER', fin: {}, failed: [] }; col('bench_state')[S1] = stFull(D0 - 6 * H, D0 - 5 * H, 2); col('bench_state')[S2] = stFull(D0 - 6 * H, D0 - 5 * H, 2); col('bench_state')[BIG] = { ...stFull(D0 - 8 * H, D0 - 4 * H, 40), prog: { startedAt: T0big, page: 11, at: nowIso() } }; /* 🩺 30시간에 안 걸리게 */
    const rn = await B.benchJob({ force: true, resume: true }); const nrd = READS.length; READS.length = 0;
    const rx = await B.benchJob({ force: true, resume: true, xnow: true }); { const first = []; for (const [sc] of READS) if (!first.includes(sc)) first.push(sc); out.x = { rn, nrd, rx: rx === undefined ? 'done' : rx, first, bigFrom1: READS.filter(([sc, pg]) => sc === BIG && pg === 1).length, title: (window.__rnStatus.ms || {}).title || null }; }
    return out; }, { code });
  console.log(JSON.stringify(R, null, 1).slice(0, 5000));
  ok(R.a1.r === 'partial' && !R.a1.done && R.a1.page === 11 && R.a1.days === 0 && R.a1.last && R.a1.last.fail, `①-1 자리 찾기 중 쪽을 못 받으면 회차를 끝내지 않고 11쪽 자리 그대로(${R.a1.r} · ${R.a1.page}쪽 · 회차 기록 ${R.a1.days})`);
  ok(R.a2.r === 'partial' && !R.a2.done && R.a2.page === 11 && R.a2.days === 0 && R.a2.last && R.a2.last.net && !R.a2.last.lost, `①-2 찾는 동안 테더링 길이 막혔으면 '못 찾음'으로 끝내지 않음(${R.a2.r} · ${R.a2.last && R.a2.last.net})`);
  ok(R.a3.r === 'partial' && !R.a3.done && R.a3.page === 15 && R.a3.days === 0, `①-3 본 읽기 중 15쪽을 못 받으면 15쪽 자리를 두고 회차 안 끝냄(${R.a3.r} · ${R.a3.page}쪽)`);
  ok(R.a4.done && R.a4.days.length === 1 && R.a4.days[0].an && R.a4.days[0].partial && !R.a4.stProg, `①-4 인터넷이 멀쩡한데 숍이 통째로 바뀐 진짜 '못 찾음'은 예전처럼 회차를 끝냄(${JSON.stringify(R.a4.days)})`);
  ok(R.b.first.join(',') === '200,300,100', `② 이어 읽기 차례: 아직 안 읽은 판매자 먼저, 못 끝낸 큰 숍은 뒤(${R.b.first.join(' → ')} · 목록 ${R.b.list.join(',')})`);
  ok(R.b.bigFirst >= 9 && R.b.bigFrom1 === 0, `② 큰 숍은 1쪽부터 새 회차가 아니라 저장된 자리(${R.b.bigFirst}쪽)부터 · 1쪽 읽기 ${R.b.bigFrom1}번`);
  ok(R.b.bigDays.length === 1 && R.b.bigDays[0].runAt === R.b.t0 && !R.b.bigDays[0].partial, `② 큰 숍 회차 기록 하나(따로 생기지 않음 · 끝까지 읽음 ${JSON.stringify(R.b.bigDays)})`);
  ok(!R.c.c1.go && R.c.c2.go && !R.c.c3.go && !R.c.c3o.go && !R.c.c4.go && R.c.c4.final && !R.c.c4o.go, `③ 임시 회차: 테더링 안 되면 기다림 · 되면 로거가 한 번 · 하는 중엔 아무도 못 잡음 · 끝난 뒤엔 다시 안 함`);
  ok(!R.o.o1.go && !R.o.o2.go && R.o.as0 && !R.o.o3.go && R.o.o4.go && !R.o.o5.go && R.o.o6.go && R.o.doc.takeOver && R.o.doc.tries === 2, `③ 사무실 PC는 로거 부재 30분 뒤에만 · 그동안 로거도 겹쳐 못 잡음 · 신호 끊긴 회차만 넘겨받음(${JSON.stringify(R.o.doc)})`);
  ok(R.x.rn === 'skip' && R.x.nrd === 0, `③ (비교) 평소 이어 읽기는 어제 바퀴가 끝났으면 바로 끝(${R.x.rn})`);
  ok(R.x.rx === 'done' && R.x.first.join(',') === '200,300,100' && R.x.bigFrom1 === 0, `③ 임시 회차는 오늘 못 읽은 판매자 모두 — 작은숍1 → 작은숍2 → 큰 숍(저장된 자리부터) · ⏭ 건너뛰기 무시(${R.x.first.join(' → ')})`);
  ok(/임시 회차/.test(R.x.title || ''), `③ 수집기 진행 표시 제목: ${R.x.title}`);
  await br.close(); console.log(bad ? `❌ tBENCH1109 실패 ${bad}` : '✓ tBENCH1109 통과'); process.exit(bad ? 1 : 0); })();
