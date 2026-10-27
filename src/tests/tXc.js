// 🔬 (10/27) 클라우드 조회수 실험 넓힘 — 함수 단위 시험
//  ① PXLIB 방문 분류(pxUa·pxRef·pxNet·pxJudge det/ev — 원문 IP·UA 없음 · 우리 기기 이름)
//  ② pxExpRun 그림 규칙(빈 '상' = 상태 양호합니다. + 그림 · 빈 '중' = 건너뜀 · 있으면 확인만 · 빠졌으면 다시 붙임 · 끝낼 때 빈 글로 되돌림 · 매일 조각 'held' · 로그인 풀림 = 새 로그인 안 함 · 그룹 회차 시간)
//  ③ pxSpGroup(SP×등급 4칸 × 500 · 중은 유의 사항 있는 것만 먼저) · pxDailyTick(하루 한 번 계획 · 하루 최대 · 사람이 끝낸 것 뺌 · 차례 하나씩)
const fs = require('fs'); const crypto = require('crypto');
const src = fs.readFileSync(__dirname + '/../cloud/index.js', 'utf8'); const R = {}; const bad = [];
const ok = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
// ── ① PXLIB
const a = src.indexOf('/* PXLIB-START'), b = src.indexOf('/* PXLIB-END */'); const L = new Function(src.slice(a, b) + '\nreturn { pxJudge, pxUa, pxRef, pxNet, pxIncObj, pxK };')(); const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const IPH_KAKAO = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.4.5'; const SAM = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0 Mobile Safari/537.36'; const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'; const TAB = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120 Safari/537.36'; const NAV = 'Mozilla/5.0 (Linux; Android 14; SM-S918N wv) AppleWebKit/537.36 Version/4.0 Chrome/120 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.5.1)';
const u1 = L.pxUa(IPH_KAKAO), u2 = L.pxUa(SAM), u3 = L.pxUa(WIN), u4 = L.pxUa(TAB), u5 = L.pxUa(NAV), u6 = L.pxUa('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), u7 = L.pxUa('');
ok('uaIphone', u1.dv === 'mobile' && u1.os === 'iOS' && u1.app === '카카오톡', u1); ok('uaSam', u2.dv === 'mobile' && u2.os === 'Android' && u2.br === '삼성인터넷' && !u2.app, u2); ok('uaWin', u3.dv === 'pc' && u3.os === 'Windows' && u3.br === '크롬', u3); ok('uaTab', u4.dv === 'tablet', u4); ok('uaNaver', u5.app === '네이버앱', u5); ok('uaBot', u6.dv === 'bot' && /Googlebot/.test(u6.bn), u6); ok('uaEmpty', u7.dv === 'bot' && u7.bn === 'UA 없음', u7);
ok('ref', L.pxRef('https://www.aladin.co.kr/') === 'w_origin' && L.pxRef('https://m.aladin.co.kr/m/mproduct.aspx?ItemId=1') === 'm_etc' && L.pxRef('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1') === 'w_prod' && L.pxRef('https://www.aladin.co.kr/shop/UsedShop/wuseditemall.aspx?ItemId=1') === 'w_used' && L.pxRef('') === 'none' && L.pxRef('https://search.naver.com/x') === 'ext_search' && L.pxRef('https://blog.example.com/') === 'ext' && L.pxRef('https://www.aladin.co.kr/scm/wrecord.aspx') === 'al_scm' && L.pxRef('xx') === 'bad');
const n1 = L.pxNet('211.36.1.5', hash), n2 = L.pxNet('211.36.200.9', hash), n3 = L.pxNet('211.37.1.5', hash), n6 = L.pxNet('2001:2d8:e1a2:1::5', hash); ok('net', n1.nk === n2.nk && n1.nk !== n3.nk && n1.v === 4 && n6.v === 6 && /^n[0-9a-f]{8}$/.test(n6.nk), { n1, n2, n3, n6 });
const SELF = new Map([['c' + hash('rnpx|9.9.9.9|' + WIN).slice(0, 16), '사무실-1']]); let now = Date.parse('2026-10-27T05:30:00Z'); const seen = new Map(); const D = () => ({ now, hash, isSelf: (k) => SELF.has(k), selfDev: (k) => SELF.get(k) || null, seen });
const j1 = L.pxJudge({ lid: '404935000', ua: IPH_KAKAO, ref: 'https://m.aladin.co.kr/', ip: '211.36.1.5', cookie: '' }, D()); ok('detHuman', j1.det.dv.mobile === 1 && j1.det.os.iOS === 1 && j1.det.app['카카오톡'] === 1 && j1.det.rf.m_origin === 1 && j1.det.hr['14'] === 1 && j1.det.ipv.v4 === 1 && j1.det.cks['처음·쿠키 없음'] === 1 && !j1.det.od, j1.det);
ok('evHuman', j1.ev && j1.ev.lid === '404935000' && j1.ev.t === '14:30:00' && j1.ev.k === 'human' && j1.ev.ck === 0 && j1.ev.nk === n1.nk, j1.ev);
const j2 = L.pxJudge({ lid: '404935000', ua: IPH_KAKAO, ref: 'https://m.aladin.co.kr/', ip: '211.36.1.5', cookie: 'rnv=' + j1.key }, D()); ok('detBack', j2.det.cks['다시(쿠키 들고 옴)'] === 1 && j2.ev.ck === 1 && j2.ev.d30 === 1 && j2.key === j1.key, j2.det);
const j3 = L.pxJudge({ lid: '404935000', ua: WIN, ref: 'https://www.aladin.co.kr/', ip: '9.9.9.9', cookie: '' }, D()); ok('detOurs', j3.ours && j3.det.od && j3.det.od['사무실-1'] === 1 && !j3.det.dv && j3.ev.k === 'ours', j3.det);
const j4 = L.pxJudge({ lid: '404935000', ua: 'Mozilla/5.0 (compatible; bingbot/2.0)', ref: '', ip: '1.1.1.1', cookie: '' }, D()); ok('detBot', j4.bot && j4.det.bn && Object.keys(j4.det.bn)[0] === 'bingbot' && j4.ev === null, j4.det);
const raw = JSON.stringify([j1, j2, j3, j4]); ok('noRaw', !raw.includes('211.36.1.5') && !raw.includes('9.9.9.9') && !raw.includes('KAKAOTALK 10.4.5') && !raw.includes('SM-S918N'));
const io = L.pxIncObj(j1.det, (v) => ({ inc: v })); ok('incObj', io.dv.mobile.inc === 1 && io.hr['14'].inc === 1); ok('keySafe', L.pxK('a.b/c$d') === 'a_b_c_d' && L.pxK('카카오톡') === '카카오톡');

// ── ② pxExpRun
const pa = src.indexOf('async function pxExpRun('); const endS = "log('🔬 조회수 실험', v.op || 'add', JSON.stringify(res).slice(0, 300)); }"; const pb = src.indexOf(endS, pa) + endS.length; const code = src.slice(pa, pb);
const mk = new Function('C', 'peRead', 'peFormSubmit', 'curPage', 'FV', 'sleep', 'nowIso', 'log', 'W', 'login', 'peTxt', 'Date', code + '\nreturn pxExpRun;');
const peTxt = (h) => String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
let clock = 0; const FakeDate = class extends Date { static now() { return clock; } };
function env(notes, grades, store0, opt) { opt = opt || {}; const store = store0 || { px_exp: {}, px_exp_groups: {} }; const edits = []; let logins = 0;
  const merge = (o, x) => { for (const [k, v] of Object.entries(x)) { if (v && v.__inc != null) o[k] = (+o[k] || 0) + v.__inc; else if (v && v.__au) o[k] = [...(o[k] || []), v.__au]; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object') merge(o[k], v); else o[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge({}, v) : v; } return o; };
  const C = (n) => ({ doc: (id) => ({ get: async () => ({ data: () => (n === 'app_settings' ? { cloudUrl: 'https://cloud.test' } : store[n] && store[n][id] ? JSON.parse(JSON.stringify(store[n][id])) : undefined) }), set: async (o) => { store[n] = store[n] || {}; store[n][id] = merge(store[n][id] || {}, o); } }) });
  const peRead = async (p, lid) => { clock += 2000; if (opt.loginOff) return { login: false }; return { ok: true, uid: lid, noteHtml: notes[lid] == null ? '' : notes[lid], qtk: grades[lid] || '' }; };
  const peFormSubmit = async (lid, w) => { clock += 3000; edits.push(lid); notes[lid] = w.noteHtml; return {}; };
  const FV = { arrayUnion: (x) => ({ __au: x }), serverTimestamp: () => 'ts', increment: (n) => ({ __inc: n }) };
  const run = mk(C, peRead, peFormSubmit, () => ({ evaluate: async () => ({ http: 200, kept: true }) }), FV, async (ms) => { clock += ms; }, () => new Date(1.8e12 + clock).toISOString(), () => {}, () => ({}), async () => { logins++; }, peTxt, FakeDate);
  return { run, store, edits, notes, logins: () => logins }; }
(async () => {
  const notes = { 1001: '', 1002: '', 1003: '<p>모서리 눌림</p>', 1004: '<p>깨끗함</p><img src="https://cloud.test/px/1004.gif" width="1" height="1" alt="">', 1005: '<p>새 글로 바뀜</p>', 1006: '' };
  const grades = { 1001: '상', 1002: '중', 1003: '중', 1004: '상', 1005: '상', 1006: '최상' };
  const E = env(notes, grades, { px_exp: { 1005: { on: true, addedAt: '2026-10-20T00:00:00Z', before: '<p>옛 글</p>' } }, px_exp_groups: {} });
  let cmd = { type: 'pxExp', op: 'add', listingIds: ['1001', '1002', '1003', '1004', '1005', '1006'], gid: 'g1', createdAt: '2026-10-27T01:00:00Z' }; const ref = { set: async (o) => { cmd = { ...cmd, ...o, results: { ...(cmd.results || {}), ...(o.results || {}) } }; } };
  clock = 0; await E.run(null, ref, cmd);
  const r = cmd.results; R.res = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.state + ':' + v.kind]));
  ok('autoTxt', E.notes['1001'] === '<p>상태 양호합니다.</p><img src="https://cloud.test/px/1001.gif" width="1" height="1" alt="">' && r['1001'].auto === 1 && E.store.px_exp['1001'].autoTxt === '상태 양호합니다.' && E.store.px_exp['1001'].before === '' && E.store.px_exp['1001'].on === true, { n: E.notes['1001'], e: E.store.px_exp['1001'] });
  ok('skipMid', r['1002'].state === 'skip' && E.notes['1002'] === '' && !E.edits.includes('1002') && /중/.test(r['1002'].msg) && E.store.px_exp['1002'].skipAt && !E.store.px_exp['1002'].addedAt, r['1002']);
  ok('skipTop', r['1006'].state === 'skip' && !E.edits.includes('1006'), r['1006']);
  ok('midNote', r['1003'].state === 'done' && E.notes['1003'] === '<p>모서리 눌림</p><img src="https://cloud.test/px/1003.gif" width="1" height="1" alt="">' && r['1003'].txtSame === true, r['1003']);
  ok('checkOnly', r['1004'].kind === 'check' && !E.edits.includes('1004') && E.store.px_exp['1004'].on === true && E.store.px_exp['1004'].chkAt, r['1004']);
  ok('readd', r['1005'].readd === 1 && /다시 붙임/.test(r['1005'].msg) && E.store.px_exp['1005'].before === '<p>옛 글</p>' && E.store.px_exp['1005'].addedAt === '2026-10-20T00:00:00Z' && E.store.px_exp['1005'].readdAt && Array.isArray(E.store.px_exp['1005'].beforeHist), E.store.px_exp['1005']);
  ok('cmdDone', cmd.status === 'done' && cmd.prog.done === 6, cmd.status);
  const run0 = (E.store.px_exp_groups.g1 || {}).runs || {}; const rr = run0['m2026-10-27T01']; ok('grpRun', rr && rr.n === 6 && rr.edit === 3 && rr.check === 1 && rr.skip === 2 && rr.readd === 1 && rr.auto === 1 && rr.ms > 0 && rr.first && rr.last && E.store.px_exp_groups.g1.lastRid === 'm2026-10-27T01', rr);
  // 끝내기 — '상태 양호합니다.'만 남았으면 빈 글로 · 사람이 글을 고쳤으면 그 글은 남김
  let c2 = { type: 'pxExp', op: 'remove', listingIds: ['1001', '1003'] }; const ref2 = { set: async (o) => { c2 = { ...c2, ...o, results: { ...(c2.results || {}), ...(o.results || {}) } }; } }; await E.run(null, ref2, c2);
  ok('removeAuto', E.notes['1001'] === '' && /빈 글/.test(c2.results['1001'].msg) && E.notes['1003'] === '<p>모서리 눌림</p>', { n1: E.notes['1001'], n3: E.notes['1003'], m: c2.results['1001'].msg });
  // 매일 조각 — 수정 3~8개 · 'held' + nextAt · 다음 조각이 이어 함
  const N2 = {}, G2 = {}; const ids = []; for (let i = 0; i < 30; i++) { const k = String(2000 + i); ids.push(k); N2[k] = '<p>글 ' + k + '</p>'; G2[k] = '상'; }
  const E2 = env(N2, G2); let c3 = { type: 'pxExp', op: 'add', daily: true, rid: '2026-10-27', gid: 'g2', listingIds: ids }; const ref3 = { set: async (o) => { c3 = { ...c3, ...o, results: { ...(c3.results || {}), ...(o.results || {}) } }; } };
  clock = 0; await E2.run(null, ref3, c3, 150e3); const e1 = E2.edits.length; ok('dailySlice', c3.status === 'held' && c3.nextAt && e1 >= 3 && e1 <= 8 && c3.claim === null, { st: c3.status, e1 });
  let rounds = 1; while (c3.status === 'held' && rounds < 30) { rounds++; clock = 0; await E2.run(null, ref3, { ...c3 }, 150e3); }
  const tagged = ids.filter((k) => (E2.notes[k] || '').includes('/px/' + k + '.gif')).length; const twice = ids.filter((k) => ((E2.notes[k] || '').match(/\/px\//g) || []).length > 1).length; const g2 = E2.store.px_exp_groups.g2.runs['2026-10-27'];
  ok('dailyAll', c3.status === 'done' && tagged === 30 && twice === 0 && rounds >= 4 && g2.n === 30 && g2.slices === rounds && g2.daily === true, { st: c3.status, tagged, twice, rounds, g2 });
  // 로그인 풀림 — 새 로그인 안 함 · 대기로 · 까닭
  const E3 = env({ 3001: '<p>x</p>' }, { 3001: '상' }, null, { loginOff: true }); let c4 = { type: 'pxExp', op: 'add', listingIds: ['3001'] }; const ref4 = { set: async (o) => { c4 = { ...c4, ...o }; } }; await E3.run(null, ref4, c4, 150e3);
  ok('noLogin', E3.logins() === 0 && c4.status === 'queued' && /로그인/.test(c4.waitMsg || '') && !E3.edits.length, c4);

  // ── ③ pxSpGroup · pxDailyTick
  const da = src.indexOf('const PX_DAILY_DEF'); const de = 'return { gid, n: lids.length, cells: meta }; }'; const db_ = src.indexOf(de, da) + de.length; const dcode = src.slice(da, db_);
  const realNote = new Function(src.slice(src.indexOf('const realNote = '), src.indexOf('\n', src.indexOf('const realNote = '))) + '\nreturn realNote;')();
  const S = { app_settings: {}, prd_listings: {}, prd_book_metrics: {}, prd_used_info: {}, px_exp_groups: {}, px_exp: {}, shp_cmds: {} };
  let rn = 7; const rnd = () => { rn = (rn * 16807) % 2147483647; return rn / 2147483647; }; let li = 0;
  const addL = (n, sp, g, note) => { for (let i = 0; i < n; i++) { li++; const lid = String(500000 + li); S.prd_listings['aladin_U' + li] = { listingId: lid, bookId: 'b' + li, grade: g, status: '판매중', active: true, title: '책 ' + li }; if (sp != null) S.prd_book_metrics['b' + li] = { salesPoint: sp }; if (note !== undefined) S.prd_used_info[lid] = { note }; } };
  addL(300, 8000, '중', '모서리 눌림'); addL(400, 9000, '중', ''); addL(100, 9000, '중'); addL(700, 6000, '상'); addL(600, 100, '중', '밑줄 조금'); addL(600, 300, '상', '깨끗'); addL(50, 2000, '상', 'x'); addL(20, null, '상', 'x'); addL(10, 9000, '하', 'x');
  S.prd_listings.yes24_1 = { listingId: '999', bookId: 'b1', grade: '상', status: '판매중' };
  const mkq = (n, flt) => ({ where: (f, op, v) => mkq(n, [...(flt || []), [f, op, v]]), select: () => mkq(n, flt), get: async () => { const docs = Object.entries(S[n] || {}).filter(([, x]) => (flt || []).every(([f, op, v]) => (op === '==' ? x[f] === v : op === 'in' ? v.includes(x[f]) : true))).map(([id, x]) => ({ id, ref: Cd(n, id), data: () => JSON.parse(JSON.stringify(x)), exists: true })); return { docs, size: docs.length, forEach: (f) => docs.forEach(f) }; }, doc: (id) => Cd(n, id) });
  const mergeD = (o, x) => { for (const [k, v] of Object.entries(x)) { if (v && v.__au) o[k] = [...(o[k] || []), v.__au]; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object') mergeD(o[k], v); else o[k] = v; } return o; };
  const Cd = (n, id) => ({ id, get: async () => ({ id, exists: !!(S[n] || {})[id], data: () => ((S[n] || {})[id] ? JSON.parse(JSON.stringify(S[n][id])) : undefined) }), set: async (o, m) => { S[n] = S[n] || {}; S[n][id] = m && m.merge ? mergeD(S[n][id] || {}, o) : mergeD({}, o); } });
  const Cx = (n) => mkq(n); const dbx = { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, { merge: true }), update: (r, v) => r.set(v, { merge: true }) }), getAll: async (...refs) => { refs = refs.filter((x) => x && x.get); return Promise.all(refs.map((r) => r.get())); } };
  const MathR = Object.create(Math); MathR.random = rnd; const logs = [];
  const mk2 = new Function('C', 'db', 'FV', 'nowIso', 'log', 'realNote', 'Math', dcode + '\nreturn { pxDailyTick, pxSpGroup };'); const F = mk2(Cx, dbx, { arrayUnion: (x) => ({ __au: x }), serverTimestamp: () => 'ts', increment: (n) => ({ __inc: n }) }, () => new Date().toISOString(), (...x) => logs.push(x.join(' ')), realNote, MathR);
  S.app_settings.pxDaily = { at: '00:00' };
  const t1 = await F.pxDailyTick(); const g = S.px_exp_groups.sp_grade_2000;
  const cnt = (c) => g.lids.filter((k) => g.cell[k] === c).length; const findL = (lid) => Object.values(S.prd_listings).find((x) => x.listingId === lid); const noteOf = (lid) => (S.prd_used_info[lid] || {}).note;
  const A = g.lids.filter((k) => g.cell[k] === 'A'); const C0 = g.lids.filter((k) => g.cell[k] === 'C');
  ok('spBuilt', g && g.name === '🔬 SP×등급 2000' && g.auto === true && g.on === true && cnt('A') === 400 && cnt('B') === 500 && cnt('C') === 500 && cnt('D') === 500 && g.lids.length === 1900, { A: cnt('A'), B: cnt('B'), C: cnt('C'), D: cnt('D'), n: g.lids.length });
  ok('spMidRule', A.every((k) => noteOf(k) !== '') && A.filter((k) => noteOf(k) === '모서리 눌림').length === 300 && A.filter((k) => noteOf(k) == null).length === 100 && C0.every((k) => noteOf(k) === '밑줄 조금'), { note: A.filter((k) => noteOf(k)).length, unk: A.filter((k) => noteOf(k) == null).length });
  ok('spSp', g.lids.every((k) => { const sp = g.sp[k]; return (g.cell[k] <= 'B' ? sp >= 5000 : sp <= 500); }) && !g.lids.includes('999') && g.lids.every((k) => ['중', '상'].includes(findL(k).grade)) && g.cells.A.short === 100 && g.cells.A.noteFirst === 300, g.cells);
  ok('spOnce', S.app_settings.pxSpGroup1027.done === true);
  const D1 = Object.values(S.shp_cmds).filter((x) => x.daily); const nPlan = D1.reduce((a, x) => a + x.listingIds.length, 0);
  ok('dailyPlan', D1.length === 3 && nPlan === 300 && D1.every((x) => x.status === 'held' && x.gid === 'sp_grade_2000' && x.rid && x.listingIds.length <= 100 && x.grades) && S.app_settings.pxDaily.lastDay && S.px_exp_groups.sp_grade_2000.runs[S.app_settings.pxDaily.lastDay].plan === 300, { n: D1.length, nPlan, t1 });
  const t2 = await F.pxDailyTick(); const D2 = Object.values(S.shp_cmds).filter((x) => x.daily); ok('dailyOnce', D2.length === 3, D2.length);
  // 차례: 하나도 대기·하는 중이 아니면 nextAt 지난 held 하나만 대기로
  for (const x of D2) x.nextAt = '2000-01-01T00:00:00Z'; await F.pxDailyTick(); const q1 = Object.values(S.shp_cmds).filter((x) => x.status === 'queued').length; await F.pxDailyTick(); const q2 = Object.values(S.shp_cmds).filter((x) => x.status === 'queued').length; ok('promoteOne', q1 === 1 && q2 === 1, { q1, q2 });
  // 다음 날 — 사람이 끝낸 것·이미 실험 중(→ 확인)·판매 끝난 것
  const L0 = g.lids; S.px_exp[L0[0]] = { on: false, addedAt: '2026-10-20T00:00:00Z', removedAt: '2026-10-21T00:00:00Z' }; S.px_exp[L0[1]] = { on: true, addedAt: '2026-10-20T00:00:00Z', chkAt: '2026-10-20T00:00:00Z' }; S.px_exp[L0[2]] = { skipAt: '2026-10-20T00:00:00Z' };
  for (const k of Object.keys(S.shp_cmds)) S.shp_cmds[k].status = 'done'; S.app_settings.pxDaily.lastDay = '2000-01-01'; S.app_settings.pxDaily.cap = 5; S.app_settings.pxDaily.recap = 5; const before = new Set(Object.keys(S.shp_cmds)); await F.pxDailyTick(); const D3 = Object.entries(S.shp_cmds).filter(([k]) => !before.has(k)).map(([, x]) => x); const ids3 = D3.flatMap((x) => x.listingIds);
  ok('day2', ids3.length === 7 && !ids3.includes(L0[0]) && ids3.includes(L0[1]) && ids3.includes(L0[2]), { n: ids3.length, has0: ids3.includes(L0[0]) });
  console.log(JSON.stringify(R));
  console.log(bad.length ? '❌ tXc 실패 — ' + bad.join(', ') : '✓ tXc 통과'); })().catch((e) => { console.log('❌ tXc 실패 — ' + e.stack); });
