/* tURG2_1113 — 11/13 오늘 출고 0건 긴급(일꾼 urg2) 시험
 *  11:23 클라우드가 로그인 풀린 발송 요청 화면을 0건으로 읽어 shp_state/current 주문을 빈 배열로 덮음 → 출고 화면 0건 · 그 뒤 PC가 발송 요청을 다시 읽지 않음
 *  ① 클라우드 🚑 빈 목록 되살리기(shipEmptyRescue): 근거가 있으면 웹앱 sd_fresh와 같은 꼴의 맡긴 일(type 'read' · PC 지정 없음)을 하나만 만듦 · 출고 처리 중·대기 중·30분 안·하루 8번이면 안 만듦
 *  ② 클라우드 새 알라딘 로그인 멈춤(사실 F25): cloud_jobs.cloudLogin이 true가 아니면 아이디·비밀번호를 넣기 전에 멈춤
 *  ③ PC 수집기 빈 화면 보호(delivBad): 주문 0줄 + 탭 숫자 없음/발송 요청 ≥1/로그인 화면이면 쓰지 않음
 *  ④ 근원: PC 발송 요청 칸이 '클라우드가 살아 있음'만 보고 건너뛰던 것 → 클라우드 로그인 'ok' + 발송 요청 20분 안에 읽었을 때만 건너뜀
 * 실행: node src/tests/tURG2_1113.js */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/index.js')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const CL = rd('cloud/index.js'), PC = rd('src/readnow-collector.src.js');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i); return i >= 0 && j > i ? S.slice(i, j) : ''; };

/* ── 가짜 Firestore(필요한 만큼) ── */
function mkDb(init) { const D = new Map(Object.entries(init || {})); let seq = 0;
  const docRef = (col, id) => ({ id, path: col + '/' + id, get: async () => { const v = D.get(col + '/' + id); return { exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; } });
  const colRef = (col) => { const q = { f: [], o: null, l: 0 }; const api = {
      doc: (id) => docRef(col, id || 'auto' + (++seq)),
      where: (k, op, v) => { q.f.push([k, op, v]); return api; }, orderBy: (k, dir) => { q.o = [k, dir]; return api; }, limit: (n) => { q.l = n; return api; }, select: () => api,
      get: async () => { let L = [...D.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => JSON.parse(JSON.stringify(v)), v }));
        for (const [k, op, v] of q.f) L = L.filter((d) => (op === '==' ? d.v[k] === v : op === '>=' ? String(d.v[k] || '') >= v : true));
        if (q.o) L.sort((a, b) => (String(a.v[q.o[0]] || '') < String(b.v[q.o[0]] || '') ? 1 : -1) * (q.o[1] === 'desc' ? 1 : -1)); if (q.l) L = L.slice(0, q.l); return { docs: L, size: L.length, empty: !L.length }; } }; return api; };
  const db = { runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), set: (r, v, o) => W.push([r, v, o]) }); for (const [r, v, o] of W) { const k = r.path; D.set(k, o && o.merge ? { ...(D.get(k) || {}), ...v } : v); } } };
  return { D, C: colRef, db }; }
const src = cut(CL, 'const SRS = { at: 0 };', '/* (0.17.0) 📊 수집 분석 기록');
ok(src.length > 500, '클라우드 shipEmptyRescue 글을 찾음');
const mk = (init, cmdDocs) => { const F = mkDb(init); const logs = []; const fn = new Function('C', 'db', 'cmdDocs', 'FV', 'W', 'log', src + '\nreturn shipEmptyRescue;')(F.C, F.db, cmdDocs || [], { serverTimestamp: () => 'TS' }, () => ({ writer: 'cloud' }), (...a) => logs.push(a.join(' '))); return { F, fn, logs, cmds: () => [...F.D.entries()].filter(([k]) => k.startsWith('shp_cmds/')).map(([, v]) => v) }; };
const NOW = Date.now(); const iso = (ms) => new Date(ms).toISOString();
const base = () => ({ 'shp_state/current': { at: iso(NOW - 80 * 60e3), orders: [], sig: '[]', pc: 'cloud', tabCounts: {} }, 'shp_state/confirm': { at: iso(NOW - 20e3), tabCounts: { '주문확인요청': 0, '발송 요청': 16 }, orders: [] },
  'shp_snapshots/a': { at: iso(NOW - 80 * 60e3), by: 'cloud', tabCounts: {} }, 'shp_snapshots/b': { at: iso(NOW - 4 * 3600e3), tabCounts: { '발송 요청': 16 } } });
(async () => {
  console.log('① 🚑 빈 목록 되살리기');
  { const T = mk(base()); const r = await T.fn(); const c = T.cmds();
    ok(r && r.made && c.length === 1, '지금 0건 + 주문확인요청 탭 발송 요청 16건 → 다시 읽기 하나 만듦', r);
    const x = c[0] || {}; ok(x.type === 'read' && Array.isArray(x.orderNos) && !x.orderNos.length && x.status === 'queued' && x.dev === null && !x.pc && !x.claim, '웹앱 sd_fresh와 같은 꼴(type read · orderNos [] · queued · PC 지정 없음 = 대기열)', x);
    ok(/16건/.test(x.why || '') && T.F.D.get('app_settings/ship_rescue').n === 1, '까닭·하루 센 수를 남김', x.why);
    ok(!JSON.stringify(T.F.D.get('shp_state/current')).includes('16'), '옛 장면으로 shp_state/current를 덮지 않음');
    const r2 = await T.fn(); ok(r2 === null && T.cmds().length === 1, '2분 안에는 다시 보지도 않음'); }
  { const T = mk({ ...base(), 'shp_state/confirm': { at: iso(NOW - 3600e3 * 2), tabCounts: { '발송 요청': 0 } } }); const r = await T.fn(); ok(r && r.made && /마지막 PC 장면/.test(r.why), '주문확인요청 근거가 없어도 마지막 PC 장면(클라우드 장면은 건너뜀)에 16건이면 만듦', r); }
  { const B = base(); B['shp_state/current'].orders = [{ orderNo: '1' }]; const T = mk(B); ok((await T.fn()) === null && !T.cmds().length, '목록에 주문이 있으면 아무것도 안 함'); }
  { const B = base(); B['shp_state/confirm'].tabCounts['발송 요청'] = 0; B['shp_snapshots/b'].tabCounts['발송 요청'] = 0; const T = mk(B); ok((await T.fn()) === null && !T.cmds().length, '근거가 없으면(정말 0건) 만들지 않음'); }
  { const B = base(); B['shp_runs/_guard'] = { holds: { inv_1: { pc: 'MJ-MAIN', t0: NOW - 5 * 60e3, end: null } } }; const T = mk(B); const r = await T.fn(); ok(r && r.wait && !T.cmds().length, '출고 처리 중(출고 표에 살아 있는 칸)이면 만들지 않음 — 끝난 뒤(헌장 제6조)', r); }
  { const B = base(); B['shp_runs/_guard'] = { holds: { inv_1: { pc: 'MJ-MAIN', t0: NOW - 5 * 3600e3, end: null }, shipRead_JS: { t0: NOW, end: null }, x: { t0: NOW - 60e3, end: NOW - 1000 } } }; const T = mk(B); ok((await T.fn()).made, '끝난 칸·1시간 넘은 칸·발송 요청 다시 읽기 칸은 출고 처리로 보지 않음'); }
  { const T = mk(base(), [{ data: () => ({ type: 'read', status: 'queued' }) }]); const r = await T.fn(); ok(r && r.skip && !T.cmds().length, '다시 읽기가 이미 대기 중이면 또 만들지 않음', r); }
  { const B = base(); B['shp_cmds/w1'] = { type: 'read', status: 'done', createdAt: iso(NOW - 10 * 60e3) }; const T = mk(B); const r = await T.fn(); ok(r && r.skip && T.cmds().length === 1, '30분 안에 맡긴 다시 읽기(끝났어도)가 있으면 만들지 않음', r); }
  { const B = base(); B['app_settings/ship_rescue'] = { day: new Date(NOW + 9 * 3600e3).toISOString().slice(0, 10), n: 8, last: iso(NOW - 3 * 3600e3) }; const T = mk(B); const r = await T.fn(); ok(r && r.skip && !T.cmds().length, '하루 8번이면 그만', r); }
  { const B = base(); B['app_settings/ship_rescue'] = { day: new Date(NOW + 9 * 3600e3).toISOString().slice(0, 10), n: 2, last: iso(NOW - 10 * 60e3) }; const T = mk(B); ok(!(await T.fn()).made, '마지막 되살리기 30분 안이면 그만'); }
  ok(/try \{ const rs = await shipEmptyRescue\(\); if \(rs\) out0\.shipRescue = rs; \}/.test(cut(CL, 'async function tick(why) {', 'const ng = await nightGap')), '회차(tick) 맨 앞에서 부름(밤·꺼 둠 길보다 앞)');

  console.log('② 클라우드 새 알라딘 로그인 멈춤(사실 F25)');
  { const L = cut(CL, 'async function login(p, force) {', '/* ── ① 주문확인요청'); const g = L.indexOf("J0.cloudLogin === true"), t = L.indexOf("/login/wlogin.aspx"), sr = L.indexOf('sessRestore(p)');
    ok(g > 0 && t > g && sr > 0 && sr < g, '저장 세션 이어 쓰기 뒤 · 아이디·비밀번호 화면을 열기 전에 막음', { sr, g, t });
    ok(g < L.indexOf('if (!force &&'), "진단 loginnow(force)도 막힘(쉼 무시보다 앞)");
    ok(/noCloudLogin: true/.test(L) && /loginWait: true, until: Date\.now\(\) \+ 30 \* 60e3/.test(L), '막을 때 loginWait 오류(부르는 곳이 기다림으로 처리)');
    const cj = cut(CL, 'async function cjobs() {', 'let fastCfg'); const F = mkDb({}); const run = async (d) => { const F2 = mkDb({ 'app_settings/cloud_jobs': d }); return new Function('C', 'CJ_KEYS', 'let cjCache = null, cjAt = 0;\n' + cj + '\nreturn cjobs;')(F2.C, ['confirm', 'ship'])(); }; void F;
    ok((await run({})).cloudLogin === false && (await run({ cloudLogin: 'yes' })).cloudLogin === false && (await run({ cloudLogin: true })).cloudLogin === true, '기본 끔 · cloud_jobs.cloudLogin === true일 때만 켬'); }

  console.log('③ PC 수집기 빈 화면 보호');
  { const s = cut(PC, 'const delivBad = ', '\n'); ok(!!s, 'delivBad 글을 찾음'); const delivBad = new Function(s + '; return delivBad;')();
    const doc = (pw, title) => ({ title: title || '', querySelector: (q) => (pw && /password/.test(q) ? {} : null) });
    ok(delivBad({ orders: [], tabCounts: { '발송 요청': 16 } }, doc()) && delivBad({ orders: [], tabCounts: {} }, doc()) && delivBad({ orders: [], tabCounts: { '발송 요청': 0 } }, doc(true, '알라딘 로그인')), '주문 0줄 + 탭 16건 · 탭 숫자 없음 · 로그인 화면 → 쓰지 않음');
    ok(!delivBad({ orders: [], tabCounts: { '발송 요청': 0, '주문확인요청': 2 } }, doc()) && !delivBad({ orders: [{}], tabCounts: { '발송 요청': 1 } }, doc()) && !delivBad({ orders: [{}], tabCounts: {} }, doc()), '정말 0건(탭도 0)·주문 있음은 그대로 씀');
    ok(!delivBad({ orders: [], tabCounts: { '발송 요청': 0 } }, doc(true, '샵매니저')), '샵매니저 화면의 비밀번호 칸은 로그인 화면으로 보지 않음');
    ok(/async function saveDelivLite\(r, at\) \{ if \(delivBad\(r, null\)\) return false;/.test(PC), 'saveDelivLite 들머리에서 막음');
    ok(/const bd = delivBad\(r, gd\); if \(bd\) log\(/.test(PC), 'shipLiteRead(맡긴 다시 읽기)에서 화면째 검사');
    const J = cut(PC, 'async function shipReadJob() {', '} finally { await releaseLane'); ok(J.includes('const r = SH.parseDeliveryPage(g.doc); const at = nowIso(); { const bd = delivBad(r, g.doc); if (bd) {') && /빈 목록으로 덮지 않음\(오늘 출고 목록 그대로\)`, 1\); return false; \} \}/.test(J) && J.indexOf('delivBad') < J.indexOf("b.set(C('shp_state').doc('current')"), 'shipReadJob: 저장 전에 막고 자리(lane)는 finally가 놓음'); }

  console.log('④ 근원 — PC 발송 요청 칸이 클라우드 로그아웃 동안 건너뛰던 것');
  { const s = cut(PC, 'const cloudOn = () => ', ';'); const f = (cb) => new Function('cloudBeat', 'return (' + s.replace('const cloudOn = () => ', '') + ');')(cb);
    const b0 = { at: iso(NOW - 60e3), ok: true, jobs: { ship: true }, login: 'ok', lastDelivAt: iso(NOW - 4 * 60e3) };
    ok(f(b0) === true, '클라우드 로그인 ok + 4분 전 발송 요청 읽음 → 클라우드 몫(PC 건너뜀)');
    ok(f({ ...b0, login: 'off' }) === false, "11/13 모습: 살아 있음 + login 'off'(PC 목록으로만) → PC가 맡음");
    ok(f({ ...b0, login: 'fail', ok: false }) === false && f({ ...b0, lastDelivAt: iso(NOW - 70 * 60e3) }) === false && f({ ...b0, lastDelivAt: null }) === false, "로그인 실패·발송 요청 20분 넘게 못 읽음 → PC가 맡음");
    ok(f({ ...b0, at: iso(NOW - 11 * 60e3) }) === false && f({ ...b0, jobs: { ship: false } }) === false, '예전 조건(10분 신호·발송 요청 끔)은 그대로');
    ok((PC.match(/d\.slot\.job === 'prd:shipRead' && cloudOn\(\)|x\.slot\.job === 'prd:shipRead' && cloudOn\(\)/g) || []).length === 2, '⏰ 칸 판단 두 곳 모두 같은 cloudOn'); }
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
