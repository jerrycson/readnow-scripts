// 🧪 (정범님 11/07 ㉮) 그림만 시험 — 클라우드 pxExpRun: 정한 수(bare)를 채우면 남은 후보는 수정 화면을 열지 않음 · 알라딘이 지운 수가 bareFail에 닿아도 멈춤 · 건너뛴 까닭(bw text/full)
//  + 클라우드 pxBareStage 판정(성공 → 전체 그룹 empty 'bare' · 실패 → 'skip' · 모자람 → 그룹 안 만듦) + 공용 AS.pxPlan이 그룹 empty를 맡긴 일에 실음
//  사용: node tPXB.js (저장소 src/tests 안에서 — ../../cloud/index.js · ../../readnow-autosched-core.js를 읽음 · w/pw 안이면 ../cloud)
const fs = require('fs'); const path = require('path');
const pick = (...ps) => ps.find((p) => fs.existsSync(p));
const cloudSrc = fs.readFileSync(pick(path.join(__dirname, '../../cloud/index.js'), path.join(__dirname, '../cloud/index.js')), 'utf8');
const asPath = pick(path.join(__dirname, '../../readnow-autosched-core.js'), path.join(__dirname, '../readnow-autosched-core.js'));
const fnSrc = (name) => { const a = cloudSrc.indexOf('async function ' + name + '('); if (a < 0) throw new Error('없음 ' + name); const b = cloudSrc.indexOf('\nasync function ', a + 10); const c = cloudSrc.indexOf('\nfunction ', a + 10); const d = cloudSrc.indexOf('\n/*', a + 10); const e = cloudSrc.indexOf('\nlet ', a + 10); const end = Math.min(...[b, c, d, e].filter((x) => x > 0)); return cloudSrc.slice(a, end); };
const R = {}; const fails = [];
const ok = (k, cond, info) => { R[k] = !!cond; if (!cond) fails.push(k + (info ? ' ' + JSON.stringify(info) : '')); };
function world(notes, opts) { opts = opts || {}; const store = { px_exp: {}, px_exp_groups: {}, app_settings: { main: { cloudUrl: 'https://cloud.test' } }, shp_cmds: {}, prd_listings: {} }; let clock = 0; const reads = []; const strip = new Set(opts.strip || []);
  const docApi = (n, id) => ({ get: async () => ({ exists: !!(store[n] && store[n][id]), data: () => store[n] && store[n][id] }), set: async (o) => { store[n] = store[n] || {}; store[n][id] = { ...(store[n][id] || {}), ...o }; } });
  const C = (n) => ({ doc: (id) => docApi(n, id), where: (f, op, val) => ({ get: async () => { const L = Object.entries(store[n] || {}).filter(([, x]) => (op === 'in' ? val.includes(x[f]) : x[f] === val)).map(([id, x]) => ({ id, data: () => x, ref: docApi(n, id) })); return { docs: L, forEach: (fn) => L.forEach(fn) }; }, select: function () { return this; } }), select: () => ({ get: async () => { const L = Object.entries(store[n] || {}).map(([id, x]) => ({ id, data: () => x })); return { docs: L, forEach: (fn) => L.forEach(fn) }; } }) });
  const peRead = async (p, lid) => { clock += 3000; reads.push(lid); return { ok: true, uid: lid, noteHtml: notes[lid] == null ? '<p>글 ' + lid + '</p>' : notes[lid], qtk: '상' }; };
  const peFormSubmit = async (lid, w) => { clock += 2000; notes[lid] = strip.has(lid) ? String(w.noteHtml).replace(/<img[^>]*>/g, '') : w.noteHtml; return {}; };
  const curPage = () => ({ evaluate: async () => ({ http: 200, kept: true }) });
  const FV = { arrayUnion: (...x) => x, serverTimestamp: () => 'ts', increment: (n) => n };
  return { store, C, peRead, peFormSubmit, curPage, FV, reads, clock: () => clock, tick: (ms) => { clock += ms; } };
}
const NAMES = ['C', 'peRead', 'peFormSubmit', 'curPage', 'FV', 'sleep', 'nowIso', 'log', 'W', 'login', 'peTxt', 'Date', 'asMod', 'realNote', 'PX_ACT_X', 'jsleep', 'PXON'];
function load(name, Wd) { const code = fnSrc(name); const extra = name === 'pxBareStage' ? "let pxBareTried = 0; const PX_ACT = ['queued', 'running', 'held', 'verify', 'stuck', 'paused'];\n" : '';
  const mk = new Function(...NAMES, extra + code + '\nreturn ' + name + ';'); const FakeDate = { now: () => Wd.clock(), parse: (x) => Date.parse(x) };
  return mk(Wd.C, Wd.peRead, Wd.peFormSubmit, Wd.curPage, Wd.FV, async (ms) => Wd.tick(ms), () => new Date(1.7e12 + Wd.clock()).toISOString(), () => {}, () => ({}), async () => {}, (h) => String(h || '').replace(/<[^>]+>/g, '').trim(), FakeDate, async () => null, () => true, null, async (ms) => Wd.tick(ms), { set: new Set() }); }
(async () => {
  // ① 60 후보 중 빈 것 20개(앞쪽 섞임) · bare 10 → 10개 붙이고 나머지는 화면을 열지 않음
  { const ids = Array.from({ length: 60 }, (_, i) => String(500000100 + i)); const notes = {}; ids.forEach((k, i) => { if (i % 3 === 0) notes[k] = ''; }); const Wd = world(notes); const run = load('pxExpRun', Wd);
    let cmd = { type: 'pxExp', op: 'add', listingIds: ids, gid: 'g_bare1107', bare: 10, bareFail: 2, status: 'running' }; const ref = { set: async (o) => { cmd = { ...cmd, ...o, results: { ...(cmd.results || {}), ...(o.results || {}) } }; } };
    let rounds = 0; do { rounds++; await run(null, ref, { ...cmd }); } while (cmd.status === 'queued' && rounds < 10);
    const res = Object.values(cmd.results || {}); const done = res.filter((r) => r.kind === 'edit' && r.state === 'done').length; const full = res.filter((r) => r.bw === 'full').length; const text = res.filter((r) => r.bw === 'text').length;
    R.a = { done, full, text, reads: Wd.reads.length, n: res.length, st: cmd.status };
    ok('a_붙임10', done === 10, R.a); ok('a_모두결과', res.length === 60, R.a); ok('a_화면안엶', full > 0 && new Set(Wd.reads).size === 60 - full, R.a); ok('a_글있음까닭', text > 0 && res.filter((r) => r.state === 'skip').every((r) => r.bw === 'text' || r.bw === 'full'), R.a); ok('a_끝', cmd.status === 'done', R.a); }
  // ② 알라딘이 지움 — 빈 것 모두 지움 · bareFail 2 → 지움 2개 뒤 멈춤
  { const ids = Array.from({ length: 30 }, (_, i) => String(500000300 + i)); const notes = {}; ids.forEach((k) => { notes[k] = ''; }); const Wd = world(notes, { strip: ids }); const run = load('pxExpRun', Wd);
    let cmd = { type: 'pxExp', op: 'add', listingIds: ids, gid: 'g_bare1107', bare: 10, bareFail: 2, status: 'running' }; const ref = { set: async (o) => { cmd = { ...cmd, ...o, results: { ...(cmd.results || {}), ...(o.results || {}) } }; } };
    let rounds = 0; do { rounds++; await run(null, ref, { ...cmd }); } while (cmd.status === 'queued' && rounds < 10);
    const res = Object.values(cmd.results || {}); const lost = res.filter((r) => r.kind === 'edit' && r.state === 'fail' && r.keptScm === false).length; R.b = { lost, reads: Wd.reads.length, full: res.filter((r) => r.bw === 'full').length, msg: (res.find((r) => r.bw === 'full') || {}).msg };
    ok('b_지움2에서멈춤', lost === 2, R.b); ok('b_나머지안엶', R.b.full === 28, R.b); ok('b_까닭글', /지워 실패/.test(String(R.b.msg || '')), R.b); }
  // ③ pxBareStage 판정·전체 그룹
  const stage = async (results, cmdSt, extra) => { const Wd = world({}); const run = load('pxBareStage', Wd); Wd.store.px_exp_groups.g_bare1107 = { bare: 10, lids: Object.keys(results) }; Wd.store.shp_cmds.c1 = { type: 'pxExp', op: 'add', gid: 'g_bare1107', status: cmdSt, createdAt: 'x', results };
    Wd.store.prd_listings = { aladin_1: { listingId: '1', status: '판매중', active: true }, aladin_2: { listingId: '2', status: '일시판매중지', active: true }, aladin_3: { listingId: '3', status: '판매중지', active: false }, yes24_9: { listingId: '9', status: '판매중', active: true }, aladin_4: { listingId: '4', status: '판매중', active: true } }; Wd.store.px_exp = { 4: { on: true } };
    if (extra) extra(Wd); Wd.tick(1e9); const out = await run(); return { out, g: Wd.store.px_exp_groups.g_bare1107, all: Wd.store.px_exp_groups.g_all1107 }; };
  const okR = { kind: 'edit', state: 'done', keptScm: true }, lostR = { kind: 'edit', state: 'fail', keptScm: false, msg: '알라딘이 바깥 그림 주소를 지우거나 바꿈 — 이 방식으로는 셀 수 없음' }, textR = { state: 'skip', kind: 'skip', bw: 'text' };
  { const res = {}; for (let i = 0; i < 10; i++) res['a' + i] = okR; for (let i = 0; i < 5; i++) res['t' + i] = textR; const S1 = await stage(res, 'done'); R.c = { out: S1.out, v: S1.g.verdict && S1.g.verdict.r, all: S1.all && { n: S1.all.lids.length, empty: S1.all.empty, auto: S1.all.auto, lids: S1.all.lids } };
    ok('c_성공', R.c.v === 'ok', R.c); ok('c_전체그룹bare', R.c.all && R.c.all.empty === 'bare' && R.c.all.auto === true, R.c); ok('c_대상', R.c.all && JSON.stringify(R.c.all.lids.sort()) === JSON.stringify(['1', '2']), R.c); }
  { const res = { a0: okR, a1: lostR, a2: lostR }; const S2 = await stage(res, 'running'); R.d = { v: S2.g.verdict && S2.g.verdict.r, empty: S2.all && S2.all.empty }; ok('d_실패skip', R.d.v === 'fail' && R.d.empty === 'skip', R.d); }
  { const res = { a0: okR, a1: okR, t0: textR }; const S3 = await stage(res, 'done'); R.e = { v: S3.g.verdict && S3.g.verdict.r, all: !!S3.all }; ok('e_모자람그룹없음', R.e.v === 'short' && !R.e.all, R.e); }
  { const res = { a0: okR }; const S4 = await stage(res, 'running', (Wd) => { Wd.store.px_exp_groups.g_bare1107.lids.push('w1'); }); R.f = { v: S4.g.verdict, all: !!S4.all }; ok('f_진행중판정없음', !R.f.v && !R.f.all, R.f); }
  { const res = { a0: okR, a1: lostR }; const S5 = await stage(res, 'done', (Wd) => { Wd.store.app_settings.pxDaily = { bareFailN: 1 }; }); ok('g_기준설정', S5.g.verdict && S5.g.verdict.r === 'fail', S5.g.verdict); }
  // ④ 공용 pxPlan이 그룹 empty를 맡긴 일에 실음
  { const m = { exports: {} }; new Function('module', 'exports', 'globalThis', fs.readFileSync(asPath, 'utf8'))(m, m.exports, {}); const AS = (m.exports.AS || m.exports); const P = (AS.pxPlan ? AS : AS.AS);
    const L = new Map([['1', { gr: '상', t: 'a' }], ['2', { gr: '중', t: 'b' }]]); const r1 = P.pxPlan({ now: Date.now(), cfg: {}, groups: [{ id: 'g_all1107', name: '전체', auto: true, on: true, lids: ['1', '2'], empty: 'bare' }, { id: 'old', name: '옛', auto: true, on: true, lids: ['3'] }], listings: new Map([...L, ['3', { gr: '상', t: 'c' }]]), exp: new Map(), busy: new Set() });
    const dAll = r1.docs.find((d) => d.data.gid === 'g_all1107'), dOld = r1.docs.find((d) => d.data.gid === 'old'); R.h = { all: dAll && dAll.data.empty, old: dOld && ('empty' in dOld.data) };
    ok('h_empty실음', R.h.all === 'bare', R.h); ok('h_옛그룹없음', R.h.old === false, R.h); }
  console.log(JSON.stringify(R)); if (fails.length) console.log('실패:', fails.join(' | '));
  console.log(fails.length ? '❌ tPXB 실패' : '✓ tPXB 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
})().catch((e) => { console.log('❌ tPXB 오류', e.stack); });
