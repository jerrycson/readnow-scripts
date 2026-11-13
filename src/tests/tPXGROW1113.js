// 🔁 (정범님 11/13 16:00 pxgrow) 「🔬 전체 상품」 그룹 새 상품 덧붙임 — 낮(한국 05:00~17:00) 30분 · 밤 6시간 · 설정으로 바꿈 · 지난 덧붙임 뒤 바뀐 상품만 읽음(하루 한 번 통째로)
//  사용: node tPXGROW1113.js (저장소 src/tests 안 — ../../cloud/index.js를 읽음 · w/pw 안이면 ../cloud)
const fs = require('fs'); const path = require('path');
const pick = (...ps) => ps.find((p) => fs.existsSync(p));
const src = fs.readFileSync(pick(path.join(__dirname, '../../cloud/index.js'), path.join(__dirname, '../cloud/index.js')), 'utf8');
const cut = (start, endMark) => { const a = src.indexOf(start); if (a < 0) throw new Error('없음 ' + start); const b = src.indexOf(endMark, a + start.length); return src.slice(a, b < 0 ? undefined : b); };
const helpers = cut('const PX_GROW_DEF', 'let pxBareTried');
const stageSrc = cut('async function pxBareStage(', '\nasync function ');
const fails = []; let n = 0; const ok = (k, c, info) => { n++; if (!c) fails.push(k + (info ? ' ' + JSON.stringify(info) : '')); };
const KST = (h, m) => Date.UTC(2026, 10, 13, h - 9, m || 0); /* 11/13 한국 h:m */
function world(now) { const store = { px_exp: {}, px_exp_groups: {}, app_settings: {}, shp_cmds: {}, prd_listings: {} }; const st = { reads: 0, queries: [] };
  const docApi = (c, id) => ({ get: async () => { st.reads++; return { exists: !!store[c][id], id, data: () => store[c][id] }; }, set: async (o) => { store[c][id] = { ...(store[c][id] || {}), ...o }; }, _c: c, _id: id });
  const q = (c, f, op, v) => ({ select: () => q(c, f, op, v), get: async () => { st.queries.push(c + ':' + f + op); const L = Object.entries(store[c]).filter(([, x]) => op === 'in' ? v.includes(x[f]) : op === '>' ? +new Date(x[f]) > +v : op === '==' ? x[f] === v : false).map(([id, x]) => ({ id, data: () => x })); st.reads += Math.max(1, L.length); return { size: L.length, docs: L, forEach: (fn) => L.forEach(fn) }; } });
  const C = (c) => ({ doc: (id) => docApi(c, id), where: (f, op, v) => q(c, f, op, v) });
  const db = { getAll: async (...refs) => { st.reads += refs.length; return refs.map((r) => ({ exists: !!store[r._c][r._id], id: r._id, data: () => store[r._c][r._id] })); } };
  class FD extends Date { constructor(...a) { a.length ? super(...a) : super(now.t); } static now() { return now.t; } }
  const FV = { arrayUnion: (...x) => ({ __u: x }), serverTimestamp: () => 'ts' };
  const mk = new Function('C', 'db', 'FV', 'nowIso', 'log', 'Date', helpers + "\nlet pxBareTried = 0; const PX_ACT = ['queued', 'running', 'held', 'verify', 'stuck', 'paused'];\n" + stageSrc + '\nreturn { pxBareStage, pxGrowGap, reset: () => { pxBareTried = 0; } };');
  const api = mk(C, db, FV, () => new Date(now.t).toISOString(), () => {}, FD); return { store, st, api };
}
(async () => {
  // ① 간격 셈
  { const now = { t: 0 }; const { api } = world(now); const g = api.pxGrowGap;
    ok('a_낮10시', JSON.stringify(g({}, KST(10))) === '{"day":true,"min":30}', g({}, KST(10)));
    ok('a_5시정각낮', g({}, KST(5)).day === true); ok('a_17시정각밤', g({}, KST(17)).day === false && g({}, KST(17)).min === 360);
    ok('a_밤20시', g({}, KST(20)).min === 360); ok('a_새벽4시59', g({}, KST(4, 59)).day === false);
    ok('a_설정', JSON.stringify(g({ growFrom: '07:00', growTo: '09:00', growDay: 15, growNight: 120 }, KST(8))) === '{"day":true,"min":15}' && g({ growFrom: '07:00', growTo: '09:00', growDay: 15, growNight: 120 }, KST(10)).min === 120);
    ok('a_10분아래막음', g({ growDay: 3 }, KST(10)).min === 10); ok('a_틀린값기본', g({ growDay: 'x', growFrom: '25:00' }, KST(10)).min === 30 && g({ growFrom: '25:00' }, KST(5)).day === true);
    ok('a_밤을넘는구간', g({ growFrom: '22:00', growTo: '02:00' }, KST(23)).day === true && g({ growFrom: '22:00', growTo: '02:00' }, KST(1)).day === true && g({ growFrom: '22:00', growTo: '02:00' }, KST(12)).day === false); }
  const base = (now, o) => { const W = world(now); const S = W.store; S.px_exp_groups.g_bare1107 = { bare: 10 }; S.px_exp_groups.g_all1107 = { on: true, auto: true, lids: ['1', '2'], ...o };
    for (let i = 0; i < 500; i++) S.prd_listings['aladin_o' + i] = { listingId: String(9000 + i), status: '판매중', active: true, uploadedAt: new Date(KST(0)).toISOString() }; /* 오래된 것 500 — 모두 관찰 중 */
    for (let i = 0; i < 500; i++) S.px_exp[String(9000 + i)] = { on: true };
    S.prd_listings.aladin_1 = { listingId: '1', status: '판매중', active: true, uploadedAt: new Date(KST(0)).toISOString() };
    S.prd_listings.aladin_n1 = { listingId: '501', status: '판매중', active: true, uploadedAt: new Date(now.t - 10 * 60e3).toISOString() }; /* 새로 등록 */
    S.prd_listings.aladin_n2 = { listingId: '502', status: '판매완료', active: false, uploadedAt: new Date(now.t - 10 * 60e3).toISOString() }; /* 팔림 — 빼야 */
    S.prd_listings.aladin_n3 = { listingId: '503', status: '판매중', active: true, uploadedAt: new Date(now.t - 10 * 60e3).toISOString() }; S.px_exp['503'] = { on: true }; /* 이미 관찰 중 */
    S.prd_listings.yes24_n4 = { listingId: '504', status: '판매중', active: true, uploadedAt: new Date(now.t - 10 * 60e3).toISOString() }; /* 예스24 — 빼야 */
    S.prd_listings.aladin_n5 = { listingId: '2', status: '판매중', active: true, uploadedAt: new Date(now.t - 10 * 60e3).toISOString() }; /* 이미 그룹 */
    S.prd_listings.aladin_old = { listingId: '777', status: '일시판매중지', active: true, uploadedAt: new Date(KST(0)).toISOString() }; /* 오래전 · 그룹 밖 · 관찰 아님 → 통째로 훑을 때만 */
    return W; };
  // ② 낮 · 40분 전 덧붙임 · 오늘 통째로 훑음 → 바뀐 것만 읽고 새 상품만 더함
  { const now = { t: KST(11) }; const W = base(now, { growAt: new Date(now.t - 40 * 60e3).toISOString(), growFullAt: new Date(now.t - 3 * 3600e3).toISOString() }); const out = await W.api.pxBareStage(); const g = W.store.px_exp_groups.g_all1107;
    const add = (g.lids && g.lids.__u) || null; const R = { out, add, last: g.growLast, reads: W.st.reads, q: W.st.queries };
    ok('b_더함', JSON.stringify(add) === '["501"]', R); ok('b_바뀐것만읽음', W.st.queries.includes('prd_listings:uploadedAt>') && !W.st.queries.includes('prd_listings:statusin') && !W.st.queries.some((x) => x.startsWith('px_exp:')), R);
    ok('b_읽기적음', W.st.reads < 20, R); ok('b_기록', g.growLast && g.growLast.mode === 'inc' && g.growLast.add === 1 && g.growLast.gap === 30 && g.growLast.day === true, R); ok('b_까닭글', /낮 30분마다/.test(JSON.stringify(g.hist)), g.hist); ok('b_통째로안함', g.growFullAt === new Date(now.t - 3 * 3600e3).toISOString(), g.growFullAt); }
  // ③ 낮 · 20분 전 덧붙임 → 아직 아님(쓰기 없음)
  { const now = { t: KST(11) }; const ga = new Date(now.t - 20 * 60e3).toISOString(); const W = base(now, { growAt: ga, growFullAt: ga }); const out = await W.api.pxBareStage(); ok('c_20분은기다림', out === null && W.store.px_exp_groups.g_all1107.growAt === ga && !W.st.queries.length, { out, q: W.st.queries }); }
  // ④ 밤 · 2시간 전 → 기다림 · 7시간 전 → 함
  { const now = { t: KST(22) }; const ga = new Date(now.t - 2 * 3600e3).toISOString(); const W = base(now, { growAt: ga, growFullAt: ga }); const out = await W.api.pxBareStage(); ok('d_밤2시간기다림', out === null && !W.st.queries.length, out);
    const now2 = { t: KST(23) }; const ga2 = new Date(now2.t - 7 * 3600e3).toISOString(); const W2 = base(now2, { growAt: ga2, growFullAt: new Date(now2.t - 8 * 3600e3).toISOString() }); const o2 = await W2.api.pxBareStage(); ok('d_밤7시간함', o2 && o2.grow === 1 && W2.store.px_exp_groups.g_all1107.growLast.gap === 360, { o2, gl: W2.store.px_exp_groups.g_all1107.growLast }); }
  // ⑤ 통째로 훑은 지 하루 넘음(또는 없음) → 통째로 · 오래된 그룹 밖 상품도 받음
  { const now = { t: KST(11) }; const W = base(now, { growAt: new Date(now.t - 40 * 60e3).toISOString() }); const out = await W.api.pxBareStage(); const g = W.store.px_exp_groups.g_all1107; const add = ((g.lids && g.lids.__u) || []).slice().sort();
    ok('e_통째로', g.growLast && g.growLast.mode === 'full' && g.growFullAt === new Date(now.t).toISOString(), g.growLast); ok('e_놓친것받음', JSON.stringify(add) === '["501","777"]', { add, out }); ok('e_관찰중빼기', !add.includes('503') && !add.some((k) => +k >= 9000)); }
  // ⑥ 사람이 끝냄·자동 꺼짐 → 아무것도 안 함
  { const now = { t: KST(11) }; const W = base(now, { auto: false, growAt: new Date(now.t - 9 * 3600e3).toISOString() }); ok('f_자동꺼짐', (await W.api.pxBareStage()) === null && !W.st.queries.length); }
  // ⑦ 설정(app_settings/pxDaily)으로 낮 간격 60분 → 40분 전은 기다림
  { const now = { t: KST(11) }; const W = base(now, { growAt: new Date(now.t - 40 * 60e3).toISOString(), growFullAt: new Date(now.t - 3600e3).toISOString() }); W.store.app_settings.pxDaily = { growDay: 60 }; ok('g_설정60분', (await W.api.pxBareStage()) === null && !W.st.queries.length); }
  if (fails.length) { console.log('❌ tPXGROW1113 실패', fails.length + '/' + n); fails.forEach((f) => console.log('  ✗ ' + f.slice(0, 600))); process.exit(1); }
  console.log('✓ tPXGROW1113 통과 ' + n + '항목');
})().catch((e) => { console.log('❌ tPXGROW1113 실패(예외)', e.stack); process.exit(1); });
