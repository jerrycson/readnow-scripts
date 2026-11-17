// tLFCOUNT1117 — (11/17 일꾼 lfcount1 · 🚨 자료) 수집기 서버 건수 세기
//  까닭: 수집기 Firebase는 compat 10.12.2 — compat Query에 count()가 없어 `C(x).count().get()`이 늘 TypeError → 삼켜 0·null
//   → 저절로 되돌리기(prd_system/listfix_auto)가 「서버 건수를 못 셈」으로 매번 멈추고 시도 6번을 다 씀
//  ① 공용 srvCount: count()가 함수면 그것 · 없으면 REST 집계(runAggregationQuery · 로그인 토큰) · fetch가 막히면 GM 요청 · 둘 다 안 되면 까닭을 담은 오류(0·null로 삼키지 않음)
//  ② lfSrvCount: 못 세면 0 + 까닭(lfSrvCount.err) · 되돌리기 오류 글에 「서버 건수를 못 셈: <까닭>」
//  ③ 시도 한도 되살림: 「서버 건수를 못 셈」으로 쓴 시도는 한 번만 0으로(cntfix 표시) · done·held·error-apply·stop은 그대로 막음
//  ④ 예전 count() 부르는 곳이 남지 않음 · 수집기 머리(@ 줄)가 그대로
// 실행: node src/tests/tLFCOUNT1117.js (네트워크 없음 · 시험 자료는 모두 지어낸 값)
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const SRCF = path.join(R, 'src/readnow-collector.src.js'); const SRC = fs.readFileSync(SRCF, 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌ ' + m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓ ' + m); };

/* ── ① 공용 srvCount ── */
const a = SRC.indexOf('(function rnSrvCountInit()'), b = SRC.indexOf('\n})();\n', a) + 6; const INIT = SRC.slice(a, b);
function mk(opt) { opt = opt || {}; const calls = { fetch: [], gm: [], count: 0, diag: [] };
  const user = opt.noUser ? null : { getIdToken: async () => 'TOKEN-지어낸' };
  const coll = (name) => { const q = { doc: (id) => ({ set: async (v, o) => { calls.diag.push({ name, id, v, o }); } }), where() { return q; }, get: async () => { throw new Error('통째로 받으면 안 됨'); } }; if (opt.hasCount) q.count = () => ({ get: async () => { calls.count++; if (opt.countErr) throw Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }); return { data: () => ({ count: 4321 }) }; } }); return q; };
  const firebase = { apps: [1], auth: () => ({ currentUser: user }), app: () => ({ options: { projectId: 'proj-x' } }), firestore: () => ({ collection: coll }) };
  const ctx = { console, JSON, Math, Date, Promise, Error, Array, String, Number, Object, Map, Set, Number, firebase, globalThis: null, __rnPcName: { get: () => 'LOGGER' },
    fetch: async (url, o) => { calls.fetch.push({ url, o }); if (opt.fetchThrow) throw new TypeError('Failed to fetch'); return { status: opt.st || 200, text: async () => opt.body != null ? opt.body : JSON.stringify([{ result: { aggregateFields: { n: { integerValue: String(opt.n == null ? 26710 : opt.n) } } }, readTime: 'x' }]) }; } };
  if (!opt.noGm) ctx.GM_xmlhttpRequest = (o) => { calls.gm.push(o); if (opt.gmFail) return o.onerror(); o.onload({ status: 200, responseText: JSON.stringify([{ result: { aggregateFields: { n: { integerValue: '777' } } } }]) }); };
  vm.createContext(ctx); ctx.globalThis = ctx; vm.runInContext(INIT, ctx); return { ctx, calls, srv: ctx.__rnSrvCount }; }
const err = async (p) => { try { await p; return null; } catch (e) { return e; } };

(async () => {
  try {
    ok(a > 0 && /G\.__rnSrvCount = srvCount/.test(INIT), '① 바탕 구역에 공용 건수 세기(globalThis.__rnSrvCount)');
    { const W = mk(); const n = await W.srv('prd_listings'); ok(n === 26710, '① count() 없는(compat) db → REST 집계로 건수', n);
      const f = W.calls.fetch[0] || {}; const bd = JSON.parse((f.o && f.o.body) || '{}');
      ok(f.url === 'https://firestore.googleapis.com/v1/projects/proj-x/databases/(default)/documents:runAggregationQuery', '① REST 주소 = projectId의 runAggregationQuery', f.url);
      ok(f.o && f.o.method === 'POST' && f.o.headers.Authorization === 'Bearer TOKEN-지어낸', '① POST · 로그인 토큰(Bearer)', f.o && f.o.headers);
      ok(bd.structuredAggregationQuery && bd.structuredAggregationQuery.structuredQuery.from[0].collectionId === 'prd_listings' && bd.structuredAggregationQuery.aggregations[0].count, '① 몸 = 그 모음 전체 count 집계', bd);
      ok(W.calls.gm.length === 0, '① fetch가 되면 GM 요청 안 함'); }
    /* (리드 11/18 · h4 소견) 진짜 compat SDK 꼴 — @firebase/firestore-compat 0.3.32 dist/src/api/database.d.ts의 Query·CollectionReference 메서드 목록 그대로(count 없음) */
    { const QM = ['where', 'orderBy', 'limit', 'limitToLast', 'startAt', 'startAfter', 'endBefore', 'endAt', 'isEqual', 'get', 'onSnapshot', 'withConverter'];
      const CM = ['doc', 'add', 'isEqual', 'withConverter'];
      class Query { constructor(fs) { this.firestore = fs; } } for (const m of QM) Query.prototype[m] = function () { if (m === 'get') return Promise.reject(new Error('통째로 받으면 안 됨')); return this; };
      class CollectionReference extends Query { constructor(fs, id) { super(fs); this._id = id; } get id() { return this._id; } get path() { return this._id; } get parent() { return null; } }
      for (const m of CM) if (m !== 'doc') CollectionReference.prototype[m] = Query.prototype[m] || function () { return this; };
      CollectionReference.prototype.doc = function (id) { return { id, set: async () => {} }; };
      const W = mk(); const fsObj = { collection: (c) => new CollectionReference(fsObj, c) }; W.ctx.firebase.firestore = () => fsObj;
      const probe = fsObj.collection('prd_listings'); ok(typeof probe.count === 'undefined' && QM.every((m) => typeof probe[m] === 'function'), '① 가짜 compat Query = 0.3.32 메서드 목록 그대로(count 없음)');
      const n = await W.srv('prd_listings'); ok(n === 26710 && W.calls.fetch.length === 1, '① 진짜 compat 꼴(Query 클래스·CollectionReference 상속)에서도 REST 길로 건수', { n, f: W.calls.fetch.length }); }
    { const W = mk({ hasCount: true }); const n = await W.srv('crm_orders'); ok(n === 4321 && W.calls.count === 1 && W.calls.fetch.length === 0, '① count()가 함수면 그것을 씀(REST 안 부름)', { n, c: W.calls }); }
    { const W = mk({ n: 0 }); const n = await W.srv('x'); ok(n === 0, '① 빈 모음은 0(오류 아님)', n); }
    { const W = mk({ fetchThrow: true }); const n = await W.srv('prd_listings'); ok(n === 777 && W.calls.gm.length === 1 && W.calls.gm[0].anonymous === true, '① fetch가 막히면 GM 요청(@connect googleapis.com · 쿠키 안 보냄)으로', { n, gm: W.calls.gm.length }); }
    { const W = mk({ fetchThrow: true, gmFail: true }); const e = await err(W.srv('prd_listings')); ok(e && /count\(\) 없음\(compat\)/.test(e.message) && /REST 집계 fetch 실패\(Failed to fetch\) · GM 요청 실패\(연결 실패\)/.test(e.message), '① 둘 다 실패 → 0이 아니라 까닭을 담은 오류', e && e.message); }
    { const W = mk({ noUser: true }); const e = await err(W.srv('prd_listings')); ok(e && /로그인 전/.test(e.message) && W.calls.fetch.length === 0, '① 로그인한 사용자가 없으면 그 까닭(요청 안 보냄)', e && e.message); }
    { const W = mk({ st: 403, body: JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } }) }); const e = await err(W.srv('prd_listings')); ok(e && /HTTP 403 PERMISSION_DENIED Missing or insufficient permissions\. \(fetch\)/.test(e.message), '① HTTP 오류는 상태·서버 글을 그대로', e && e.message);
      ok(e && !/TOKEN/.test(e.message), '① 오류 글에 토큰이 안 들어감'); }
    { const W = mk({ body: '[{}]' }); const e = await err(W.srv('prd_listings')); ok(e && /답에 건수가 없음/.test(e.message), '① 답에 건수가 없으면 오류(-1·0으로 안 삼킴)', e && e.message); }

    { const W = mk({ fetchThrow: true, gmFail: true }); await err(W.srv('prd_listings')); await err(W.srv('prd_listings')); const D = W.calls.diag;
      const e0 = D[0] && D[0].v.LOGGER && D[0].v.LOGGER.prd_listings && D[0].v.LOGGER.prd_listings.err;
      ok(D.length === 1 && D[0].name === 'prd_system' && D[0].id === 'srvcount_diag' && D[0].o && D[0].o.merge === true, '① 첫 실패를 진단 문서 prd_system/srvcount_diag에 한 번만(합쳐 쓰기)', D.map((x) => x.id));
      ok(e0 && e0.cnt.has === false && e0.rest.via === '' && /Failed to fetch/.test(e0.rest.msg) && /count\(\) 없음/.test(e0.why), '① 진단: count() 있었는지·REST 까닭·합친 까닭', e0); }
    { const W = mk({ hasCount: true, countErr: true, st: 403, body: JSON.stringify([{ error: { code: 403, status: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } }]) }); const e = await err(W.srv('prd_listings')); const e0 = W.calls.diag[0].v.LOGGER.prd_listings.err;
      ok(e && /count\(\) 실패\(permission-denied\)/.test(e.message) && e0.cnt.has === true && e0.cnt.code === 'permission-denied' && e0.rest.st === 403 && e0.rest.code === 'PERMISSION_DENIED' && e0.rest.via === 'fetch', '① 규칙 거절이면 count()의 e.code·REST 상태(403 PERMISSION_DENIED)를 그대로 남김(h4 소견 확인용)', e0); }
    { const W = mk(); await W.srv('prd_listings'); const o = W.calls.diag[0] && W.calls.diag[0].v.LOGGER.prd_listings.ok; ok(o && o.via === 'rest' && o.n === 26710 && o.cnt.has === false, '① 첫 성공도 어느 길로 셌는지 한 번 남김', o); }

    /* ── ② lfSrvCount · 오류 글 ── */
    const la = SRC.indexOf('  const srvCount = (c) =>'), lb = SRC.indexOf("const lfSrvWhy = () => ", la); const lbe = SRC.indexOf('\n', lb); const LFS = SRC.slice(la, lbe);
    ok(la > 0 && lb > la, '② lfSrvCount가 공용 srvCount를 씀');
    { let mode = 'fail', nCall = 0; const ctx = { console, Date, String, Promise, Error, LF_SRVN: 0, LF_SRVN_AT: 0, globalThis: null }; ctx.globalThis = ctx; ctx.__rnSrvCount = async () => { nCall++; if (mode === 'fail') throw new Error('count() 없음(compat) · REST 집계 HTTP 403 PERMISSION_DENIED (fetch)'); return 26710; };
      vm.createContext(ctx); vm.runInContext(LFS.replace(/^  const /gm, 'var ').replace(/^  async function /gm, 'async function ') + '\n;globalThis.__L = { lfSrvCount, lfSrvWhy };', ctx); const L = ctx.__L;
      const n0 = await L.lfSrvCount(); ok(n0 === 0 && /HTTP 403/.test(L.lfSrvCount.err), '② 못 세면 0 + 까닭(lfSrvCount.err)', L.lfSrvCount.err);
      ok(L.lfSrvWhy() === '서버 건수를 못 셈: count() 없음(compat) · REST 집계 HTTP 403 PERMISSION_DENIED (fetch)', '② 오류 글 = 「서버 건수를 못 셈: <원래 오류>」', L.lfSrvWhy());
      await L.lfSrvCount(); ok(nCall === 1, '② 실패 뒤 5분 안 보통 부름은 다시 묻지 않음(읽기마다 REST 안 부름)', nCall);
      mode = 'ok'; const n1 = await L.lfSrvCount(true); ok(n1 === 26710 && nCall === 2 && L.lfSrvCount.err === '' && ctx.LF_SRVN === 26710, '② fresh면 늘 다시 묻고 · 되면 까닭을 지움 · LF_SRVN 갱신', { n1, nCall, err: L.lfSrvCount.err, S: ctx.LF_SRVN }); }
    ok(/const srv = await lfSrvCount\(true\); const why = srv \? lfShort\(m\.size, srv, 0\) : '서버 건수를 못 셈' \+ \(lfSrvCount\.err \? ': ' \+ lfSrvCount\.err : ''\)/.test(SRC), '② 되돌리기의 지금 값 읽기(lfrReadCur) 오류 글에 까닭을 붙임 · 늘 새로 셈');
    ok(/let srv = await lfSrvCount\(true\); if \(!srv\) \{ const k = lfKnownN\(c\); if \(!k\) throw new Error\(lfSrvWhy\(\)\)/.test(SRC), '② 보관본 대조: 늘 새로 셈 · 못 세면 서버가 센 적 있는 기준 · 그것도 없으면 까닭을 붙여 실패');
    { const RB = SRC.slice(SRC.indexOf('async function lfrReadCur'), SRC.indexOf('async function lfrReadCur') + 3000); ok(RB.length > 100 && !/lfKnownN/.test(RB), '② 되돌리기(쓰기)는 아는 기준을 쓰지 않음(못 세면 멈춤)'); }

    /* ── ③ 시도 한도 되살림 ── */
    const ca = SRC.indexOf('  const lfaRef = () =>'), cb = SRC.indexOf('  async function lfrAuto()', ca); const CLAIM = SRC.slice(ca, cb).split('\n').filter((l) => /^  (const lfaRef|async function lfaClaim)|^    /.test(l)).join('\n');
    const claimWorld = (doc) => { const st = { doc: doc ? JSON.parse(JSON.stringify(doc)) : undefined };
      const ctx = { console, Date, String, Promise, Error, JSON, LFA: { TRY: 6, DOC: 'listfix_auto' }, PC_NAME: 'LOGGER', VER: '1.89.999', nowIso: () => '2026-11-17T12:00:00.000Z', C: () => ({ doc: (id) => ({ _id: id }) }),
        db: { runTransaction: async (fn) => fn({ get: async () => ({ data: () => st.doc }), set: (ref, v, o) => { st.doc = o && o.merge ? { ...(st.doc || {}), ...v } : v; } }) } };
      vm.createContext(ctx); vm.runInContext(CLAIM.replace(/^  const lfaRef/m, 'var lfaRef') + '\n;this.__C = lfaClaim;', ctx); return { st, claim: ctx.__C }; };
    const ERR = '지금 상품 기록을 다 받지 못함(서버 건수를 못 셈) — 아무것도 쓰지 않음';
    { const W = claimWorld({ state: 'wait', stage: '지금 값 읽기', err: ERR, tries: 6 }); const x = await W.claim();
      ok(x && W.st.doc.state === 'run' && W.st.doc.tries === 1 && W.st.doc.cntfix === 'lfcount1 1.89.999' && W.st.doc.cntfixTries === 6, '③ 「서버 건수를 못 셈」으로 6번을 다 쓴 것 → 한 번 0으로 되살려 맡음 · cntfix 표시', W.st.doc);
      ok(W.st.doc.prevErr === ERR && W.st.doc.err === '', '③ 지난 까닭은 prevErr로 옮김(지우지 않음)', W.st.doc);
      W.st.doc.state = 'wait'; W.st.doc.err = ERR; W.st.doc.tries = 6; const y = await W.claim(); ok(y === null && W.st.doc.tries === 6, '③ cntfix가 있으면 다시 되살리지 않음(한 번만)', W.st.doc); }
    { const W = claimWorld({ state: 'wait', err: ERR, tries: 3 }); await W.claim(); ok(W.st.doc.tries === 1 && W.st.doc.cntfixTries === 3, '③ 3번 쓴 경우도 0부터 다시(셈 1)', W.st.doc); }
    for (const s of ['done', 'held', 'error-apply']) { const W = claimWorld({ state: s, err: ERR, tries: 2 }); const x = await W.claim(); ok(x === null && W.st.doc.state === s && !W.st.doc.cntfix, `③ ${s}는 그대로 다시 안 함`, W.st.doc); }
    { const W = claimWorld({ state: 'wait', err: ERR, tries: 6, stop: true }); const x = await W.claim(); ok(x === null && !W.st.doc.cntfix && W.st.doc.tries === 6, '③ stop === true는 그대로 지킴', W.st.doc); }
    { const W = claimWorld({ state: 'wait', err: '도우미 폴더에 통째 백업이 없음', tries: 6 }); const x = await W.claim(); ok(x === null && !W.st.doc.cntfix, '③ 다른 까닭의 wait는 한도 그대로(되살리지 않음)', W.st.doc); }
    { const W = claimWorld(undefined); const x = await W.claim(); ok(x && W.st.doc.tries === 1 && !W.st.doc.cntfix && !('prevErr' in W.st.doc), '③ 처음 시도는 예전과 같음', W.st.doc); }

    /* ── ④ 남은 count() 없음 · 머리 그대로 ── */
    const rest = SRC.slice(0, a) + SRC.slice(b); const left = (rest.match(/[^\n]*\.count\(\)\.get\(\)[^\n]*/g) || []).filter((l) => !/^\s*(\/\/|\/?\*)/.test(l.trim()) && !/^ \*/.test(l));
    ok(left.length === 0, '④ 공용 함수 밖에 .count().get() 부르는 곳이 남지 않음', left.map((l) => l.slice(0, 100)));
    let base = null; try { base = cp.execFileSync('git', ['show', 'origin/main:src/readnow-collector.src.js'], { cwd: R, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
    if (base) { const hd = (t) => t.slice(0, t.indexOf('// ==/UserScript==')).split('\n').filter((l) => /^\/\/ @/.test(l) && !/^\/\/ @(version|require\s+https:\/\/readnow\.kr\/)/.test(l)).join('\n'); ok(hd(SRC) === hd(base), '④ 수집기 머리(@match·@grant·@connect·바깥 @require)가 origin/main과 같음'); }
    else console.log('  · origin/main을 못 읽어 머리 비교는 건너뜀(git 없음)');
  } catch (e) { bad++; console.log('  ❌ 시험이 멈춤: ' + (e.stack || e)); }
  console.log(bad ? `❌ tLFCOUNT1117 실패 ${bad}` : '✅ tLFCOUNT1117 모두 통과'); process.exit(bad ? 1 : 0);
})();
