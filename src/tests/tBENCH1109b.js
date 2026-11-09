// tBENCH1109b — 11/09 오후 정범님: ⚡ 임시 회차가 새 판 새로고침으로 끊기자 '다시 하지 않음'으로 끝남 · 딱따구리 '앞뒤 3쪽(41쪽)' 한 쪽만 · 로거 테더링 막힘 동안 이어 읽기
//  ① 임시 회차: 새로고침·멈춤·인터넷 끊김은 끝이 아님(resume) → 같은 날 다시 잡힘 · 끝·진짜 오류·기한 지남만 끝 · 표시 키 benchXnow_1109b
//  ② 자리 찾기: 앞뒤 쪽을 모두 시도 · 중간 쪽 쪽 번호 줄로 끝 쪽을 잘못 잡아 못 받은 쪽을 버리지 않음 · 테더링 문에 막힌 쪽은 '못 받음'
//  ③ 큰 숍(끝 쪽 bigPages 넘음)은 자리를 못 찾아도 저장된 쪽부터 그대로 이어 읽어 끝까지(겹침은 상품 번호로 거름 · 회차 기록 blindResume) · 작은 숍은 예전처럼 끝냄
//  ④ 로거 부재 30분 셈(benchAwayStep) · 매시 이어 읽기(benchResume)만 사무실 담당 PC가 넘겨받음
// 쓰는 법: cd <빌드 복사본>/pw && node tBENCH1109b.js [수집기 파일 — 기본 ../readnow-collector.user.js]
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
    const pageHtml = (sc, pg) => { const L = SHOP[sc]; const last = Math.ceil(L.length / ROWS); const part = L.slice((pg - 1) * ROWS, pg * ROWS); const pager = MIDPAGER && pg > 1 ? Array.from({ length: 10 }, (_, i) => pg - 9 + i).filter((x) => x >= 1).map((x) => `<a href="javascript:Page_Set('${x}')">${x}</a>`).join(' ') : `<a href="javascript:Page_Set('${last}')">끝</a>`; return `<html><body><table><tr>${part.map(cell).join('')}</tr></table>${pager}</body></html>`; }; /* MIDPAGER = 중간 쪽 쪽 번호 줄이 그 둘레 쪽만 보여 줌(끝 링크 없음) */
    let MIDPAGER = false; let FAILX = null; const docOf = (url) => { const sc = url.match(/SC=(\d+)/)[1]; const pg = +url.match(/page=(\d+)/)[1]; if (onRead) onRead(sc, pg); if (NET.has(sc) || (FAILPG[sc] && FAILPG[sc] === pg)) throw new Error('Failed to fetch(인터넷 끊김 흉내)'); if (FAILX) { const e = FAILX(sc, pg); if (e) throw e; } READS.push([sc, pg]); const h = pageHtml(sc, pg); return { doc: new DOMParser().parseFromString(h, 'text/html'), html: h }; };
    const PUB = { st: { shop: { mode: 'anon', last: null } }, read: async (k, url, fn) => { const g = docOf(url); return { ...g, ...fn(g) }; } }; const getDoc = async (url) => docOf(url);
    window.__rnStatus = {};
    eval(code + '; window.__b = { benchOne, benchJob, benchFinish, kDayB, benchXnowClaim, benchXnowEnd, BXN, benchXnowAfter, benchAwayStep, setCfg: (c) => { BENCH_CFG = c; } };');
    const B = window.__b; const day = B.kDayB(); const H = 3600e3; const iso = (ms) => new Date(ms).toISOString(); const D0 = Date.parse(day + 'T00:00:00+09:00'); const NOW = Date.now();
    const ids = (base, n) => Array.from({ length: n }, (_, i) => String(base + i));
    const BIG = '100', S1 = '200', S2 = '300';
    const stFull = (st, en, lp) => ({ day: iso(st).slice(0, 10), runAt: iso(st), endAt: iso(en), completeEndAt: iso(en), okEndAt: iso(en), okRunAt: iso(st), readEndAt: iso(en), chunks: 0, lastPage: lp, rows: { size: ROWS, at: nowIso() } });
    const T0big = iso(Math.max(D0 + 60e3, NOW - 2 * H)); /* 오늘 시작한 큰 숍 회차 */
    const reset = () => { for (const k of Object.keys(store)) if (k !== 'app_settings') delete store[k]; READS.length = 0; NET.clear(); for (const k of Object.keys(FAILPG)) delete FAILPG[k]; onRead = null; TGATE.ok = true; LOG.length = 0; MIDPAGER = false; FAILX = null; B.setCfg({});
      SHOP[BIG] = ids(10000, 400); SHOP[S1] = ids(20000, 15); SHOP[S2] = ids(30000, 12);
      col('bench_state')[BIG] = { ...stFull(D0 - 30 * H, D0 - 26 * H, 40), prog: { startedAt: T0big, page: 11, at: nowIso() } }; col('bench_state')[S1] = stFull(D0 - 22 * H, D0 - 21 * H, 2); col('bench_state')[S2] = stFull(D0 - 22 * H, D0 - 21 * H, 2);
      /* 큰 숍: 10쪽까지 읽고 멈춘 회차(저장된 자리 11쪽) */ col('prd_jobs')['bench_' + BIG] = { day, page: 11, blocks: 0, items: SHOP[BIG].slice(0, 100).map((id) => [id, 3000, '상', '책', null, null, null, 0, 1, null, null, null]), startedAt: T0big, sc: BIG, name: '큰숍', readDone: false, pagingBroken: false, lastPage: 40, rows: ROWS, readFrom1: true, done: false }; };
    col('app_settings')['bench'] = { targets: [{ sc: BIG, name: '큰숍', on: true }, { sc: S1, name: '작은숍1', on: true }, { sc: S2, name: '작은숍2', on: true }], forceSkip: { on: true, h: 30 }, groups: [{ id: 'g1', name: '그룹 1', unit: 'd', n: 1, scs: [BIG, S1, S2] }] };
    const out = {}; const prog = () => col('prd_jobs')['bench_' + BIG] || {}; const daysOf = (sc) => Object.values(col('bench_days')).filter((d) => d.sc === sc); const lastR = () => (prog().resumes || []).slice(-1)[0] || null;
    /* ① 임시 회차 끝 판정 */
    const X = B.benchXnowAfter; out.x = { id: B.BXN.id, reload: X({ res: undefined, err: null, stopped: true, reloading: true, tries: 1 }), stop: X({ err: '멈춤', stopped: true, tries: 1 }), net: X({ err: '🛡 테더링 확인 안 됨', tries: 2 }), real: X({ err: '숍 목록 모양이 바뀜', tries: 1 }), skip: X({ res: 'skip' }), done: X({ res: undefined }), late: X({ stopped: true, reloading: true, now: B.BXN.until + 1000 }), many: X({ stopped: true, reloading: true, tries: B.BXN.maxTries }) };
    /* 새로고침으로 끊긴 뒤 같은 날 다시 잡힘 */
    reset(); const k1 = await B.benchXnowClaim('logger', { netOk: true }); await B.benchXnowEnd(out.x.reload.state, { resumeWhy: out.x.reload.txt }); col('prd_jobs')[B.BXN.id].beat = Date.now() - 2 * 60e3; const k2 = await B.benchXnowClaim('logger', { netOk: true }); const k2d = { ...col('prd_jobs')[B.BXN.id] };
    await B.benchXnowEnd('done'); const k3 = await B.benchXnowClaim('logger', { netOk: true }); reset(); await B.benchXnowEnd('resume'); const k4o = await B.benchXnowClaim('office', { away: true }); col('prd_jobs')[B.BXN.id].awaySince = Date.now() - 31 * 60e3; const k5o = await B.benchXnowClaim('office', { away: true });
    out.k = { k1: k1.go, k2: k2.go, tries: k2d.tries, k3: k3, k4o: k4o.go, k5o: k5o.go };
    /* ② 딱따구리 재현 — 저장된 끝 쪽 없음 · 중간 쪽 쪽 번호 줄은 둘레만(끝 링크 없음) · 41쪽 둘레 다른 쪽은 테더링 문에 막힘 */
    const prep41 = () => { reset(); delete col('bench_state')[BIG].lastPage; const P = col('prd_jobs')['bench_' + BIG]; P.lastPage = null; P.page = 42; P.items = SHOP[BIG].slice(0, 410).map((id) => [id, 3000, '상', '책', null, null, null, 0, 1, null, null, null]); col('bench_state')[BIG].prog.page = 42; MIDPAGER = true; };
    prep41(); SHOP[BIG] = ids(10000, 400).slice(0); FAILX = (sc, pg) => (sc === BIG && pg !== 41 ? Object.assign(new Error('🛡 테더링 확인 안 됨'), { tgate: true }) : null); /* 41쪽은 받았지만 그사이 앞에 30개가 새로 올라와 41쪽엔 마지막 상품이 없음 */ SHOP[BIG] = ids(90000, 30).concat(ids(10000, 400));
    let r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a1 = { r, done: !!prog().done, page: prog().page, days: daysOf(BIG).length, last: lastR(), log: LOG.filter((l) => /📍/.test(l)) };
    /* ② 같은 상황, 못 받은 쪽이 로그인 없이 다른 모양(장바구니 칸 없음) — 끝 쪽을 모르면 '끝 넘음'으로 버리지 않음 */
    prep41(); SHOP[BIG] = ids(90000, 30).concat(ids(10000, 400)); FAILX = (sc, pg) => (sc === BIG && pg !== 41 ? Object.assign(new Error('로그인 없이 읽은 숍 목록에 장바구니 칸이 없음'), { anonView: true }) : null);
    r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.a2 = { r, done: !!prog().done, days: daysOf(BIG).length, last: lastR() };
    /* ② 정상 — 모두 받을 수 있으면 앞뒤 쪽을 차례로 열어 자리를 찾음(3쪽 뒤로 밀림) */
    prep41(); SHOP[BIG] = ids(90000, 30).concat(ids(10000, 400)); r = await B.benchOne({ sc: BIG, name: '큰숍' }); { const R0 = (prog().resumes || [])[0] || ((daysOf(BIG)[0] || {}).resumes || [])[0] || null; out.a3 = { r, done: !!prog().done, R0, days: daysOf(BIG).map((d) => ({ partial: !!d.partial, an: !!d.anchorLost })), reads41: READS.filter(([sc, pg]) => sc === BIG && pg >= 38 && pg <= 44).map(([, pg]) => pg) }; }
    /* ③ 큰 숍 — 숍이 통째로 바뀌어 자리를 못 찾음 · bigPages 30(시험용) < 끝 쪽 40 → 그대로 이어 읽어 끝까지 */
    reset(); B.setCfg({ resume: { bigPages: 30 } }); SHOP[BIG] = ids(50000, 400); r = await B.benchOne({ sc: BIG, name: '큰숍' }); { const d = daysOf(BIG); const reads = READS.filter(([sc]) => sc === BIG).map(([, pg]) => pg); out.b = { r, done: !!prog().done, days: d.map((x) => ({ partial: !!x.partial, an: !!x.anchorLost, blind: (x.blindResume || []).length, complete: x.complete })), maxPg: Math.max(...reads), log: LOG.filter((l) => /그대로 이어 읽음/.test(l)).length }; }
    /* ③ 작은 숍 기준(기본 300쪽) — 예전처럼 끝냄 */
    reset(); SHOP[BIG] = ids(50000, 400); r = await B.benchOne({ sc: BIG, name: '큰숍' }); out.b2 = { r, days: daysOf(BIG).map((x) => ({ an: !!x.anchorLost, blind: !!x.blindResume })) };
    /* ④ 로거 부재 30분 셈 */
    const S = B.benchAwayStep, M = 30 * 60e3, t0 = 1e12, m = 60e3; const s1 = S({}, false, t0, M), s2 = S(s1, true, t0 + m, M), s3 = S(s2, true, t0 + 9 * m, M), s3b = S(s3, true, t0 + 18 * m, M), s3c = S(s3b, true, t0 + 27 * m, M), s4 = S(s3c, true, t0 + 32 * m, M), s5 = S(s4, true, t0 + 60 * m, M), s6 = S(s4, false, t0 + 33 * m, M), s7 = S(s6, true, t0 + 34 * m, M);
    out.w = { s1: s1.long, s2: s2.long, s3: s3.long, s3c: s3c.long, s4: s4.long, s5: s5.long, s6: s6.long, s7: s7.long, since5: s5.since === t0 + 60 * m };
    return out; }, { code });
  console.log(JSON.stringify(R, null, 1).slice(0, 6000));
  const x = R.x; ok(x.id === 'benchXnow_1109b', `① 표시 키 새 이름 ${x.id}`);
  ok(x.reload.state === 'resume' && !x.reload.final && x.stop.state === 'resume' && !x.stop.final && x.net.state === 'resume', `① 새로고침·멈춤·테더링 끊김은 끝이 아님(resume): ${x.reload.txt}`);
  ok(x.real.final && x.real.state === 'error' && x.skip.final && x.done.final && x.done.state === 'done', `① 진짜 오류·없음·끝은 끝(${x.real.state} · ${x.skip.state} · ${x.done.state})`);
  ok(x.late.final && x.late.state === 'expired' && x.many.final, `① 기한 지남·되풀이 상한은 끝(${x.late.state} · ${x.many.txt})`);
  ok(R.k.k1 && R.k.k2 && R.k.tries === 2 && !R.k.k3.go && R.k.k3.final, `① 새로고침으로 끊긴 뒤 같은 날 다시 잡힘(시도 ${R.k.tries}) · 끝난 뒤엔 다시 안 함`);
  ok(!R.k.k4o && R.k.k5o, `① 끊긴 임시 회차는 로거가 30분 넘게 부재면 사무실 PC가 이어받음`);
  const a1 = R.a1.last || {}; ok(R.a1.r === 'partial' && !R.a1.done && R.a1.days === 0 && !a1.lost && (a1.order || []).length === 7 && (a1.fail || []).length === 6, `② 앞뒤 3쪽 모두 시도(${(a1.order || []).join('·')}) · 테더링에 막힌 6쪽은 '못 받음' → 회차 안 끝냄(${R.a1.r} · 못 받음 ${(a1.fail || []).join('·')})`);
  ok(R.a2.r === 'partial' && R.a2.days === 0 && R.a2.last && !R.a2.last.lost && (R.a2.last.fail || []).length === 6 && !(R.a2.last.past || []).length, `② 끝 쪽을 모를 때 다른 모양 쪽을 '끝 넘음'으로 버리지 않음(못 받음 ${(R.a2.last && R.a2.last.fail || []).join('·')})`);
  ok(R.a3.done && R.a3.R0 && R.a3.R0.to === 43 && R.a3.R0.tried.length >= 4 && R.a3.days.length === 1 && !R.a3.days[0].an, `② 모두 받으면 앞뒤 쪽을 차례로 열어 자리 찾음(시도 ${R.a3.R0 && R.a3.R0.tried.join('·')} → ${R.a3.R0 && R.a3.R0.to}쪽)`);
  ok(R.b.done && R.b.days.length === 1 && !R.b.days[0].an && R.b.days[0].blind === 1 && !R.b.days[0].partial && R.b.maxPg >= 40 && R.b.log === 1, `③ 큰 숍은 자리를 못 찾아도 저장된 쪽부터 끝(${R.b.maxPg}쪽)까지 그대로 이어 읽음 · 회차 기록에 남김(${JSON.stringify(R.b.days)})`);
  ok(R.b2.days.length === 1 && R.b2.days[0].an && !R.b2.days[0].blind, `③ 작은 숍(기본 300쪽 이하)은 예전처럼 '못 찾음'으로 끝냄`);
  const w = R.w; ok(!w.s1 && !w.s2 && !w.s3 && !w.s3c && w.s4 && !w.s5 && w.since5 && !w.s6 && !w.s7, `④ 로거 부재 30분 넘어야 넘겨받음 · 10분 넘게 확인 끊기면 새로 셈 · 돌아오면 0부터`);
  const SRC = fs.readFileSync(COL, 'utf8'); ok(/const lgTakeKey = \(k\) => SET\.loggerTakeOk === true && loggerAway\(\) && \(!isBenchKey\(k\) \|\| benchTakeKey\(k\)\)/.test(SRC) && /const benchTakeKey = \(k\) => SET\.benchOfficeOk === true && /.test(SRC) && /=== 'benchResume' && benchAwayLong\(\)/.test(SRC) && /benchTakeKey\(curKey\) \|\| !isBenchKey\(curStage/.test(SRC), `④ (11/09 최우선 법칙) 사무실 PC 넘겨받기는 설정을 켤 때만 · 켜면 매시 이어 읽기(benchResume)만 · 실행 문도 같은 규칙`);
  await br.close(); console.log(bad ? `❌ tBENCH1109b 실패 ${bad}` : '✓ tBENCH1109b 통과'); process.exit(bad ? 1 : 0); })();
