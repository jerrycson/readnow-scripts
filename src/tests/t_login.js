// node pw/t_login.js — 🔑 알라딘 로그인 '사람처럼' 단위 시험(가짜 Firestore·가짜 로그인 확인) · 수집기 규칙/관리자(__rnLoginRule·__rnLoginGov) + 클라우드 login()
const fs = require('fs'); const path = require('path'); const W = path.join(__dirname, '..');
const COL = fs.readFileSync(path.join(W, 'readnow-collector.user.js'), 'utf8'); const CLD = fs.readFileSync(path.join(W, 'cloud/index.js'), 'utf8');
const AL = require(path.join(W, 'readnow-aladin-core.js'));
let fail = 0, pass = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('❌', m); } };
// ── 0) 규칙 글이 두 곳에서 글자 하나까지 같은가
const RULE_SRC = COL.slice(COL.indexOf('globalThis.__rnLoginRule = ') + 'globalThis.__rnLoginRule = '.length, COL.indexOf(';\n/* ═════════════ (정범님 10/26) 🔑 알라딘 로그인'));
ok(CLD.includes('const RN_LOGIN_RULE = ' + RULE_SRC + ';'), '규칙 글이 수집기·클라우드에서 다름');
const RULE = eval(RULE_SRC);
// ── 가짜 Firestore (트랜잭션 · merge · increment · arrayUnion)
function fakeDb() { const store = {}; const INC = Symbol('inc'), UNI = Symbol('uni');
  const FV = { increment: (n) => ({ [INC]: n }), arrayUnion: (...a) => ({ [UNI]: a }), serverTimestamp: () => Date.now(), delete: () => undefined };
  const apply = (cur, v) => (v && v[INC] != null ? (+cur || 0) + v[INC] : v && v[UNI] ? [...(cur || []), ...v[UNI]] : v);
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object' && !Array.isArray(v) && v[INC] == null && !v[UNI]) o[k] = merge(o[k] && typeof o[k] === 'object' ? o[k] : {}, v); else o[k] = apply(o[k], v); } return o; };
  const ref = (p) => ({ path: p, collection: (c) => ({ doc: (d) => ref(p + '/' + c + '/' + d), orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }), get: async () => ({ exists: !!store[p], data: () => store[p] }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); } });
  const db = { store, FV, collection: (c) => ({ doc: (d) => ref(c + '/' + d) }), runTransaction: async (fn) => { const w = []; const r = await fn({ get: async (rf) => ({ exists: !!store[rf.path], data: () => store[rf.path] }), set: (rf, v, o) => w.push([rf, v, o]), update: (rf, v) => w.push([rf, v, { merge: true }]) }); for (const [rf, v, o] of w) await rf.set(v, o); return r; } };
  return db; }
const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  // ── 1) 규칙 순수 함수
  const now = Date.parse('2026-10-26T22:00:00+09:00');
  ok(RULE.judge('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1', true, false, '알라딘: 책') === false, '공개 상품 화면(로그인 칸 있음)을 의심함');
  ok(RULE.judge('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1', 'https://www.aladin.co.kr/login/wlogin.aspx?x', true, false, '') === 'gate', '공개 화면 → 로그인 주소 = gate 아님');
  ok(RULE.judge('https://www.aladin.co.kr/scm/worders.aspx', 'https://www.aladin.co.kr/login/wlogin.aspx', true, false, '') === 'suspect', '샵매니저 → 로그인 주소 = 의심 아님');
  ok(RULE.judge('https://www.aladin.co.kr/scm/wpopup_order.aspx', 'https://www.aladin.co.kr/scm/wpopup_order.aspx', true, false, '로그인') === 'suspect', '샵매니저에 로그인 칸 = 의심 아님');
  ok(RULE.judge('https://www.aladin.co.kr/scm/wpopup_order.aspx', 'https://www.aladin.co.kr/scm/wpopup_order.aspx', false, false, '주문') === false, '샵매니저 팝업(로그인 칸·로그아웃 링크 없음) = 의심하면 안 됨(고객 모듈)');
  ok(RULE.judge('https://www.aladin.co.kr/account/wmaininfo.aspx', 'https://www.aladin.co.kr/login/wlogin.aspx', true, false, '') === 'suspect', '내 계정 → 로그인 주소 = 의심');
  ok(RULE.judge('https://www.aladin.co.kr/shop/usedshop/wc2b_sales.aspx', 'https://www.aladin.co.kr/login/wlogin.aspx', true, false, '') === 'suspect', '팔기 장바구니 → 로그인 주소 = 의심');
  ok(RULE.isBlock('로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-1A2B)') && RULE.codeOf('로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-1A2B)') === '42FB6013-1A2B', '42FB 글·코드');
  ok(!RULE.isBlock('아이디 또는 비밀번호가 일치하지 않습니다'), '비밀번호 틀림을 42FB로 봄');
  let doc = {};
  ok(RULE.decide(doc, 'JS-MAIN', now, {}).ok, '빈 문서인데 막힘');
  // 실패 → 1~10분 무작위(매번 새로) · 42FB도 같음 · 다음 날 9시 쉼·하루 상한 없음
  const gaps = []; for (let i = 0; i < 30; i++) { const R = RULE.record(doc, 'JS-MAIN', now + i, { ok: false, how: 'naver', why: '알라딘 경고: 로그인 과정에 문제(에러코드:42FB6013)', blocked: true }, Math.random()); gaps.push(R.nextAt - (now + i)); ok(!R.patch.holdUntil, '42FB가 자동으로 계정 쉼을 넣음'); }
  ok(gaps.every((g) => g >= 60e3 && g <= 600e3), '다음 시도 간격이 1~10분 밖'); ok(new Set(gaps.map((g) => Math.round(g / 1000))).size > 20, '간격이 무작위가 아님(같은 값 되풀이)');
  let R = RULE.record(doc, 'JS-MAIN', now, { ok: false, how: 'naver', why: '42FB6013', blocked: true }, 0.5); doc = { ...doc, ...R.patch, next: { ...(doc.next || {}), ...R.patch.next }, blk: { ...(doc.blk || {}), ...R.patch.blk } };
  ok(R.nextAt === now + 330e3, '무작위 0.5 → 5분 30초가 아님'); let d = RULE.decide(doc, 'JS-MAIN', now + 60e3, {}); ok(!d.ok && d.kind === 'retry' && d.until === R.nextAt, '다음 시도 전인데 허락함');
  ok(RULE.decide(doc, 'JS-MAIN', R.nextAt + 1, {}).ok, '다음 시도 때가 지났는데 막음'); ok(RULE.decide(doc, 'JS-PC2', now + 60e3, {}).ok, '다른 기기를 막음(기기마다 각자여야 함 · 계정 전체 차례 없음)');
  ok(RULE.decide(doc, 'JS-MAIN', now + 60e3, { force: true }).ok, '사람이 누른 시험(force)을 막음');
  for (let i = 0; i < 40; i++) { const r2 = RULE.record(doc, 'PC' + (i % 5), now + i * 1000, { ok: false, why: 'x' }, Math.random()); doc = { ...doc, tries: r2.patch.tries }; } ok(RULE.decide(doc, 'PC9', now + 50e3, {}).ok, '하루 상한이 남아 있음');
  ok(doc.tries.length <= 200, 'tries 200개 넘음');
  // 클라우드(데이터센터) ④ — 2시간 안 42FB, 그 뒤 PC 성공 없으면 기다림 → PC가 성공하면 시도
  let cd = { tries: [{ at: now, who: 'JS-MAIN', ok: false, blocked: true }] };
  d = RULE.decide(cd, 'cloud', now + 10 * 60e3, { dc: true }); ok(!d.ok && d.kind === 'dcwait', '42FB 뒤 PC 성공 전인데 클라우드가 시도함');
  ok(RULE.decide(cd, 'cloud', now + 121 * 60e3, { dc: true }).ok, '2시간 지났는데 클라우드를 막음');
  cd.tries.push({ at: now + 20 * 60e3, who: 'HOME', ok: true }); ok(RULE.decide(cd, 'cloud', now + 21 * 60e3, { dc: true }).ok, 'PC가 성공했는데 클라우드를 막음');
  // 막힘 통계: 기기·망별 처음 → 다시 성공
  let bd = { net: { 'JS-MAIN': '211.36' } }; let r1 = RULE.record(bd, 'JS-MAIN', now, { ok: false, why: '에러코드:42FB6013', blocked: true }, 0); bd = { ...bd, ...r1.patch }; let r2 = RULE.record(bd, 'JS-MAIN', now + 3600e3, { ok: true, how: 'naver' }, 0);
  ok(r1.day.key === 'JS-MAIN·211.36·?·blocked·42FB6013', '하루 요약 열쇠: ' + r1.day.key); ok(r2.day.closed && r2.day.closed[0].min === 60 && r2.patch.blk['JS-MAIN·211.36'].okAt === now + 3600e3, '막힘이 다시 성공으로 닫히지 않음');
  ok(RULE.record({}, 'cloud', now, { ok: false, why: '비밀번호가 일치하지 않습니다', credBad: true }, 0).nextAt === now + 360 * 60e3, '아이디·비밀번호 틀림 6시간 안전장치');
  ok(RULE.decide({ holdUntil: now + 1000, holdWhy: '정범님' }, 'X', now, {}).kind === 'hold', '정범님이 켠 계정 쉼을 무시함');

  // ── 2) 수집기 로그인 관리자(__rnLoginGov) — 가짜 GM·Firestore·확인
  const GOV_SRC = COL.slice(COL.indexOf('globalThis.__rnLoginRule = '), COL.indexOf('/* (1.38.0) 일시정지 = 이 PC의 모든 수집기 탭에 한 번에'));
  const mkPc = (name, db) => { const GM = {}; const timers = []; const logs = [];
    const win = { __rnPcName: { get: () => name }, __rnLog: (a, lv, m) => logs.push(lv + ' ' + m), __rnTab: 't1', top: null, firebase: db ? { apps: [1], auth: () => ({ currentUser: {} }), firestore: Object.assign(() => db, { FieldValue: db.FV }) } : null };
    win.top = win; const g = { window: win, GM_getValue: (k, d) => (k in GM ? GM[k] : d), GM_setValue: (k, v) => { GM[k] = v; }, GM_addValueChangeListener: () => {}, location: { hostname: 'www.aladin.co.kr', pathname: '/scm/worders.aspx', origin: 'https://www.aladin.co.kr' }, document: {}, setInterval: (f) => timers.push(f), firebase: win.firebase, globalThis: null };
    const gt = new Proxy(g, { get: (t, k) => (k in t ? t[k] : globalThis[k]), has: () => true, set: (t, k, v) => { t[k] = v; return true; } }); g.globalThis = gt;
    new Function('sc', 'with (sc) { ' + GOV_SRC.replace('globalThis.__rnLoginRule = ', 'globalThis.__rnLoginRule = ') + ' }')(gt);
    return { gov: win.__rnLoginGov, GM, timers, logs, win }; };
  const db = fakeDb(); db.store['app_settings/aladin_login'] = { cfg: { noticeSec: [0, 0] } };
  const A = mkPc('JS-MAIN', db); const G = A.gov; let loggedIn = true, loginCalls = 0, checks = 0; const isLoggedIn = async () => { checks++; return loggedIn; };
  // 2-a) 공개 화면은 로그인 판단 안 함
  const pubDoc = { title: '알라딘: 책', querySelector: (s) => (/password/.test(s) ? {} : null) };
  ok(G.suspect('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=9', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=9', pubDoc) === false, '수집기: 공개 화면을 의심함');
  // 2-b) 의심 → 확인 → 잘못 본 것(로그인 안 함 · 그 요청만 다시 · 3번이면 판단에서 뺌)
  const scmLogin = { title: '로그인', querySelector: (s) => (/password/.test(s) ? {} : null) }; const U = 'https://www.aladin.co.kr/scm/wpopup_order.aspx?ono=1';
  ok(G.suspect(U, U, scmLogin) === 'suspect', '수집기: 샵매니저 로그인 칸을 의심 안 함');
  ok((await G.verify({ url: U, isLoggedIn })) === 'misread' && loginCalls === 0, '잘못 본 것인데 로그인함'); ok(G.suspect(U, U, scmLogin) === false, '방금 잘못 본 같은 요청을 또 의심(되풀이 고리)');
  await G.verify({ url: U + '2', isLoggedIn }); await G.verify({ url: U + '3', isLoggedIn }); ok(G.misreadSkip(U + '9'), '같은 화면 꼴 3번 잘못 봤는데 판단에서 안 뺌');
  // 2-c) 진짜 풀림 → 5~20초(시험은 0) → 한 번 로그인 → 이어 감
  loggedIn = false; ok((await G.verify({ url: 'https://www.aladin.co.kr/scm/worders.aspx', isLoggedIn })) === 'out', '진짜 풀림을 못 봄');
  const o = (okLogin) => ({ isLoggedIn, how: 'naver', doLogin: async () => { loginCalls++; if (okLogin) loggedIn = true; return okLogin; } });
  ok((await G.relogin(o(true))) === true && loginCalls === 1, '진짜 풀렸는데 한 번 로그인해 이어 가지 않음'); ok(G.state().in === true, '로그인 뒤 상태가 로그인됨이 아님');
  ok(db.store['app_settings/aladin_login'].tries.slice(-1)[0].ok === true && db.store['app_settings/aladin_login'].dev['JS-MAIN'].in === true, '계정 문서에 성공·기기 상태가 안 남음');
  // 2-d) 실패(42FB) → 1~10분 무작위 쉼 · 그동안 로그인 필요 일 거절(pcCan) · 다른 기기는 각자
  loggedIn = false; A.GM['rn-login-alert'] = { msg: '로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-77)', at: Date.now() + 1000 };
  let err = null; try { await G.relogin(o(false)); } catch (e) { err = e; } ok(err && err.loginWait, '실패했는데 loginWait 오류가 아님');
  const st = G.state(); ok(st.in === false && st.until - Date.now() >= 59e3 && st.until - Date.now() <= 600e3, '실패 뒤 다음 시도가 1~10분이 아님: ' + (st.until - Date.now()));
  const last = db.store['app_settings/aladin_login'].tries.slice(-1)[0]; ok(last.blocked && last.code === '42FB6013-77' && !db.store['app_settings/aladin_login'].holdUntil, '42FB 기록·코드·자동 쉼 없음 확인');
  ok(!G.ready(), '쉬는 중인데 로그인 필요 일을 받음'); ok(G.needs('startDelivery', { lane: 'scm' }) && G.needs('aladinBuy', null) && !G.needs('lookup', { lane: 'shop' }), '로그인 필요 일 판단');
  const before = loginCalls; err = null; try { await G.relogin(o(true)); } catch (e) { err = e; } ok(err && err.loginWait && loginCalls === before, '쉬는 중인데 또 로그인함(1분마다 되풀이 막기)');
  const B = mkPc('HOME', db); let bIn = false, bCalls = 0; ok((await B.gov.relogin({ isLoggedIn: async () => bIn, how: 'cred', doLogin: async () => { bCalls++; bIn = true; return true; } })) === true && bCalls === 1, '다른 기기(HOME)가 JS-MAIN 쉼 때문에 막힘(기기마다 각자여야 함)');
  // 2-e) 다음 시도 때가 되고 '할 일 남음'이면 스스로 다시 · 할 일이 없으면 시도 안 함
  A.GM['rnu-login-st'] = { ...A.GM['rnu-login-st'], until: Date.now() - 1 }; db.store['app_settings/aladin_login'].next['JS-MAIN'] = Date.now() - 1; /* 시간이 흐른 것처럼 */ let need = false; G.need('cmds', () => need); G.provide(() => o(true)); const lc0 = loginCalls;
  for (const f of A.timers) f(); await sleepReal(50); ok(loginCalls === lc0, '할 일이 없는데 다시 로그인함');
  need = true; for (const f of A.timers) f(); await sleepReal(200); ok(loginCalls === lc0 + 1 && G.state().in === true, '할 일이 남았는데 다시 로그인 안 함');
  // 2-f) 이 PC 탭끼리 한 탭만: 다른 탭이 로그인 중이면 그 결과를 기다림
  loggedIn = false; A.GM['rnu-login-st'] = { in: true }; A.GM['rnu-login-busy'] = { at: Date.now(), tab: 'other' }; setTimeout(() => { loggedIn = true; }, 100); const lc1 = loginCalls;
  ok((await G.relogin(o(true))) === true && loginCalls === lc1, '다른 탭이 로그인 중인데 이 탭도 로그인함'); A.GM['rnu-login-busy'] = null;
  // 2-g) 로거는 로그인 안 함
  const P = mkPc('LOGGER', db); P.win.__rnPubHome = 1; globalThis.__rnPubHome = 1; err = null; try { await P.gov.relogin(o(true)); } catch (e) { err = e; } ok(err && /로거/.test(err.message), '로거가 로그인 시도'); delete globalThis.__rnPubHome;

  // ── 3) 리더 고리(고객 모듈과 같은 모양): 공개 화면 = 그 장만 건너뜀 · 샵매니저 잘못 봄 = 같은 요청만 다시
  const C = mkPc('JS-PC3', fakeDb()); const G3 = C.gov; let pages = [], relog = 0; globalThis.DOMParser = class { parseFromString(h) { const pw = /password/.test(h), lo = /wC2Cuser_logout/.test(h); const t = (h.match(/<title>(.*?)<\/title>/) || [])[1] || ''; return { title: t, body: { textContent: h }, querySelector: (s) => (/password/.test(s) ? (pw ? {} : null) : /logout/.test(s) ? (lo ? {} : null) : null) }; } };
  globalThis.fetch = async (u) => { const p = pages.shift() || { url: u, html: '<title>샵매니저</title>주문번호 wC2Cuser_logout' }; return { ok: true, status: 200, url: p.url || u, headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => Buffer.from(p.html) }; };
  const pace = { wait: async () => {}, ok: () => {}, fail: () => {} }; let LO = null; const iIn = async () => true;
  const rd = AL.makeReader({ pace, sleep: async () => {}, loggedOut: (fu, d0, url) => { const j = G3.suspect(url, fu, d0); if (j === 'gate') throw Object.assign(new Error('gate'), { gate: true }); LO = j ? url : null; return !!j; }, onLoggedOut: async (fu) => { if ((await G3.verify({ url: LO || fu, isLoggedIn: iIn })) === 'misread') return; relog++; }, fatal: (e) => !!e.gate || !!e.loginWait });
  pages = [{ html: '<title>알라딘</title><input type="password">' }]; let r = await rd('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=5'); ok(r && relog === 0, '리더: 공개 화면(로그인 칸)을 로그인 풀림으로 봄');
  pages = [{ url: 'https://www.aladin.co.kr/login/wlogin.aspx', html: 'x' }]; err = null; try { await rd('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=6'); } catch (e) { err = e; } ok(err && err.gate && relog === 0, '리더: 공개 화면이 로그인 주소로 → 그 장만 건너뛰지 않음');
  pages = [{ html: '<title>로그인</title><input type="password">' }, { html: '<title>로그인</title><input type="password"> 주문번호' }]; r = await rd('https://www.aladin.co.kr/scm/wpopup_order.aspx?ono=7'); ok(r && relog === 0 && /주문번호/.test(r.html), '리더: 잘못 본 뒤 같은 요청을 다시 읽어 끝나지 않음(또는 로그인함)');

  // ── 4) 클라우드 login() — 세션 이어 쓰기 · 규칙 · 42FB · 데이터센터 기다림
  const cs = CLD.indexOf('let lastDialog = null, probeAt = 0;'), ce = CLD.indexOf('/* ── ① 주문확인요청: 1분마다 이것부터');
  const cdb = fakeDb(); cdb.store['app_settings/aladin_login'] = { cfg: { noticeSec: [0, 0] } }; const cl = { in: false, cookies: [], setC: [], goto: 0, fill: 'ok', dialog: null };
  const page = { evaluate: async (fn, ...a) => { const s = String(fn); if (/worders\.aspx\?searchType=1/.test(s)) return cl.in; if (a.length === 2) { cl.goto++; if (cl.fill === 'ok') cl.in = true; else if (cl.fill === '42fb') api.setDialog({ msg: '로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-9)', at: Date.now() }); return 'sent'; } return ''; }, cookies: async () => cl.cookies, setCookie: async (...c) => { cl.setC.push(...c); if (c.some((x) => x.name === 'AladinUser')) cl.in = true; }, goto: async () => {}, waitForNavigation: async () => {}, url: () => 'https://www.aladin.co.kr/' };
  const deps = { C: (n) => cdb.collection(n), db: cdb, FV: cdb.FV, log: () => {}, sleep: async () => {}, browser: { id: 1 }, ALADIN_ID: 'id', ALADIN_PW: 'pw', AL: 'https://www.aladin.co.kr', ensureCores: async () => {}, VER: 't', fetch: async () => ({ json: async () => ({ ip: '8.230.4.53' }) }), AbortSignal: { timeout: () => undefined } };
  const api = new Function('deps', 'with (deps) { ' + CLD.slice(cs, ce) + '\n return { login, loggedIn, setDialog: (d) => { lastDialog = d; }, st: () => ({ algWait, loginFailMsg }), resetWait: () => { algWait = { until: 0, why: "" }; } }; }')(deps);
  // 4-a) 로그인 성공 → 세션 저장(aladin.co.kr 쿠키만)
  cl.cookies = [{ name: 'AladinUser', value: 'v', domain: '.aladin.co.kr', path: '/', expires: -1 }, { name: 'x', value: 'y', domain: '.evil.com', path: '/' }];
  ok((await api.login(page)) === true && cl.goto === 1, '클라우드: 풀렸는데 한 번 로그인하지 않음'); const sv = cdb.store['app_secrets/aladin_session']; ok(sv && sv.cookies.length === 1 && sv.cookies[0].name === 'AladinUser' && !('expires' in sv.cookies[0]), '클라우드: 세션 쿠키 저장(aladin.co.kr만)');
  // 4-b) 새 컨테이너(새 브라우저) — 쿠키 넣어 살아 있으면 로그인 안 함
  cl.in = false; deps.browser = { id: 2 }; const g0 = cl.goto; ok((await api.login(page)) === true && cl.goto === g0 && cl.setC.length === 1, '클라우드: 새 브라우저가 저장 세션을 이어 쓰지 않고 다시 로그인함');
  // 4-c) 42FB → 1~10분 무작위 · 그 뒤 데이터센터 기다림(PC 성공 전)
  cl.in = false; deps.browser = { id: 3 }; cdb.store['app_secrets/aladin_session'] = null; cl.fill = '42fb'; err = null; try { await api.login(page); } catch (e) { err = e; }
  const ct = cdb.store['app_settings/aladin_login'].tries.slice(-1)[0]; ok(err && err.loginWait && ct.blocked && ct.who === 'cloud' && ct.net === '8.230', '클라우드: 42FB 기록(망 8.230)');
  const nx = cdb.store['app_settings/aladin_login'].next.cloud - Date.now(); ok(nx >= 59e3 && nx <= 600e3, '클라우드: 42FB 뒤 다음 시도가 1~10분이 아님');
  const days = Object.keys(cdb.store).filter((k) => /aladin_login\/days\//.test(k)); ok(days.length === 1 && Object.keys(cdb.store[days[0]].c).some((k) => /cloud·8\.230·cred·blocked·42FB6013-9/.test(k)), '클라우드: 하루 요약 없음');
  cdb.store['app_settings/aladin_login'].next.cloud = Date.now() - 1; api.resetWait(); cl.fill = 'ok'; const g1 = cl.goto; err = null; try { await api.login(page); } catch (e) { err = e; } ok(err && /PC가 먼저 성공/.test(err.message) && cl.goto === g1, '클라우드: 42FB 뒤 PC 성공 전인데 시도함');
  cdb.store['app_settings/aladin_login'].tries.push({ at: Date.now(), who: 'HOME', ok: true }); api.resetWait(); ok((await api.login(page)) === true && cl.goto === g1 + 1, '클라우드: PC가 성공한 뒤에도 시도 안 함');
  ok(!/hs\.holdOff|cloud_login'\)\.get/.test(CLD.slice(cs, ce)), '클라우드: holdOff 임시 장치가 남음');
  ok(/needLogin = \(t\) => .*lane === 'scm'/.test(CLD) && /if \(!scmOk\) continue;/.test(CLD), '클라우드: 로그인 안 된 동안 로그인 필요 일을 맡지 않는 검사(scmOk)가 없음');
  console.log(`${pass}개 맞음 · ${fail}개 틀림`); console.log(fail ? '❌ 실패' : '✓ 통과'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('❌ 실패', e); process.exit(1); });
