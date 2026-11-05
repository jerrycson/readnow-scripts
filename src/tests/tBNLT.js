// tBNLT — 정범님 11/05: 🎯 집중 벤치마킹 '🆕 새로 올라온 것만'(light) 회차
//  가) 오늘 회차를 이미 끝낸 판매자는 이어 읽기(benchResume)가 다시 읽지 않음 — 정말 못 끝낸 판매자만 이음
//  나) 새 것만 읽기의 '아는 상품'에 오늘 앞 회차에서 읽은 상품도 넣음(같은 새 상품을 되풀이해 새것으로 세지 않음 · 쪽도 덜 읽음)
//  다) 회차 하나에 bench_days 문서 하나(같은 분에 같은 회차를 두 번 쓰던 것)
// 쓰는 법: cd <빌드 복사본>/pw && node tBNLT.js [수집기 파일 — 기본 ../readnow-collector.user.js]
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
    const B = window.__b; const day = B.kDayB(); const H = 3600e3; const iso = (ms) => new Date(ms).toISOString();
    /* 판매자 A(111) = 그룹 1-가(새 것만 · 숍 전체 2일마다) — 숍 전체를 32시간 전에 끝냄 → 오늘은 새 것만 · 🩺 30시간 기준에 걸림 */
    const OLD = Array.from({ length: 40 }, (_, i) => String(500 + i)); const NEW1 = Array.from({ length: 12 }, (_, i) => String(900 + i)); SHOP['111'] = NEW1.concat(OLD);
    /* 판매자 B(222) = 숍 전체 그룹 — 0시 회차에서 못 끝낸 판매자(failed) */
    SHOP['222'] = Array.from({ length: 15 }, (_, i) => String(300 + i));
    const fe = Date.now() - 32 * H; col('bench_state')['111'] = { day: iso(fe - H).slice(0, 10), runAt: iso(fe - H), endAt: iso(fe), completeEndAt: iso(fe), okEndAt: iso(fe), chunks: 1, lastPage: 4, rows: { size: ROWS, at: nowIso() } };
    col('bench_state/111/c')['0'] = { s: JSON.stringify(Object.fromEntries(OLD.map((id) => [id, [3000, '20261101', '상', 1, '책', 0, 0, null, null, null, 0]]))), fmt: 'json' };
    col('bench_state')['222'] = { day: iso(fe - H).slice(0, 10), runAt: iso(fe - H), endAt: iso(fe), completeEndAt: iso(fe), okEndAt: iso(fe), chunks: 0, lastPage: 2, rows: { size: ROWS, at: nowIso() } };
    col('app_settings')['bench'] = { targets: [{ sc: '111', name: '판매자A', on: true }, { sc: '222', name: '판매자B', on: true }], groups: [{ id: 'g1', name: '그룹 1-가', unit: 'd', n: 1, light: { on: true, by: 'd', fullDays: 2 }, scs: ['111'] }, { id: 'g2', name: '그룹 2', unit: 'd', n: 1, scs: ['222'] }] };
    const out = {}; const daysOf = (sc) => Object.values(col('bench_days')).filter((d) => d.sc === sc);
    /* ① 0시 회차(강제 길) — A는 새 것만, B는 숍 전체 */
    await B.benchJob({ force: true }); out.r0 = { readsA: READS['111'] || 0, readsB: READS['222'] || 0, docsA: daysOf('111').length, docIdsA: daysOf('111').map((d) => d.dayId), newN: daysOf('111').map((d) => d.newN), wr: WR.filter((w) => w[0].startsWith('111_')).length };
    /* ② 7시 이어 읽기 — 0시 회차의 failed = B만(B가 못 끝냈다고 침) */
    col('prd_jobs')['benchForce'] = { ...col('prd_jobs')['benchForce'], done: true, failed: ['222'] }; col('bench_state')['222'] = { ...col('bench_state')['222'], runAt: iso(fe - H), endAt: iso(fe), completeEndAt: iso(fe), okEndAt: iso(fe), okRunAt: iso(fe - H) }; /* B는 0시 회차를 못 끝낸 것으로 되돌림 */ READS['111'] = 0; READS['222'] = 0; const nA0 = daysOf('111').length;
    const r1 = await B.benchJob({ force: true, resume: true }); out.r1 = { ret: r1 === undefined ? 'done' : r1, readsA: READS['111'], readsB: READS['222'], docsAadd: daysOf('111').length - nA0, log: LOG.filter((l) => /이어 읽기|못 끝낸/.test(l)).slice(-3) };
    /* ③ 8시 이어 읽기 — 못 끝낸 판매자 없음 → 바로 끝, 아무것도 읽지 않음 */
    col('prd_jobs')['benchForce'] = { ...col('prd_jobs')['benchForce'], done: true, failed: [] }; READS['111'] = 0; READS['222'] = 0;
    const r2 = await B.benchJob({ force: true, resume: true }); out.r2 = { ret: r2, readsA: READS['111'], readsB: READS['222'], docsA: daysOf('111').length };
    /* ④ 그 뒤 새 상품 3개가 올라옴 → 새 것만 회차(다음 차례) — 아는 상품 = 숍 전체 + 앞 새 것만 회차 */
    const NEW2 = ['990', '991', '992']; SHOP['111'] = NEW2.concat(SHOP['111']); READS['111'] = 0; const nA1 = daysOf('111').length;
    await B.benchOne({ sc: '111', name: '판매자A', _mode: 'light', _fullTxt: '2일에 한 번' }); const dl = daysOf('111').sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-1)[0] || {};
    out.r3 = { readsA: READS['111'], newN: dl.newN, lightStop: dl.lightStop, docsAdd: daysOf('111').length - nA1, lt: (col('bench_state/111/lt') || {}).ids ? col('bench_state/111/lt').ids.n : 0 };
    /* ⑤ 같은 회차를 다시 저장(새로고침 뒤 '저장만 다시 함')해도 문서가 늘지 않음 */
    const nA2 = daysOf('111').length; await B.benchFinish({ sc: '111', name: '판매자A' }, { day, light: true, newN: 3, lightStop: 2, items: [['990', 3000]], page: 3, startedAt: dl.runAt, fullRead: false, fullWhy: '시험' }, col('bench_state')['111']); out.r4 = { docsAdd: daysOf('111').length - nA2 };
    out.dupMin = (() => { const m = {}; for (const d of daysOf('111')) { const k = String(d.runAt); m[k] = (m[k] || 0) + 1; } return Math.max(...Object.values(m)); })();
    return out; }, { code });
  console.log(JSON.stringify(R, null, 1).slice(0, 3000));
  ok(R.r0.readsA <= 4 && R.r0.docsA === 1, `가·다) 0시 회차: A는 새 것만 한 번(${R.r0.readsA}쪽 · bench_days ${R.r0.docsA}개 — 예전엔 끝내자마자 '어제 회차 마무리'로 보고 같은 분에 한 번 더 읽어 2개)`);
  ok(R.r0.readsB >= 2, `0시 회차: B는 숍 전체(${R.r0.readsB}쪽)`);
  ok(R.r1.readsA === 0 && R.r1.docsAadd === 0, `가) 7시 이어 읽기: 오늘 새 것만 회차를 끝낸 A는 다시 읽지 않음(A ${R.r1.readsA}쪽)`);
  ok(R.r1.readsB >= 2, `가) 7시 이어 읽기: 정말 못 끝낸 B는 이어 읽음(B ${R.r1.readsB}쪽)`);
  ok(R.r2.ret === 'skip' && R.r2.readsA === 0 && R.r2.readsB === 0, `가) 8시 이어 읽기: 이을 판매자 없음 → 바로 끝(${R.r2.ret} · A ${R.r2.readsA}쪽 · B ${R.r2.readsB}쪽)`);
  ok(R.r3.newN === 3, `나) 다음 새 것만 회차: 새 상품 ${R.r3.newN}개(진짜 새것 3개 — 예전엔 앞 회차 것까지 15개)`);
  ok(R.r3.readsA <= 2 && R.r3.lightStop === 2, `나) 아는 상품만 나오는 2쪽에서 멈춤(${R.r3.readsA}쪽 읽음 · 멈춘 쪽 ${R.r3.lightStop} — 예전엔 3쪽)`);
  ok(R.r3.docsAdd === 1 && R.r4.docsAdd === 0, `다) 회차 하나에 문서 하나 · 같은 회차를 다시 저장해도 늘지 않음(+${R.r3.docsAdd} · +${R.r4.docsAdd})`);
  ok(R.dupMin === 1, `다) 같은 분 같은 시작 시각 문서 겹침 없음(가장 많이 겹친 분 ${R.dupMin}개)`);
  await br.close(); console.log(bad ? `❌ tBNLT 실패 ${bad}` : '✓ tBNLT 통과'); process.exit(bad ? 1 : 0); })();
