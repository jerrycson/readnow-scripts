/* tFRIENDLINK1114 — (friendlink1 11/14 · 정범님 「앱을 깔면 PC든 휴대폰이든 책방 친구랑 웹앱을 잇는 것이 매우 불편 · 마지막 잇기를 누르면 먹통이고 코드도 안 나옴」)
 *  ① 원문: 웹앱 연결 단추에 시간 한도 · 실패 상자(까닭 + ↻ 다시 시도) · 안드로이드는 받는 주소로 넘어가지 않음 · 📺 코드로 잇기 칸 · #frlink 승인 창 · 클라우드 세 길
 *  ② 클라우드 실제 코드(cloud/index.js의 friendLink*)를 떼어 가짜 Firestore로: 시작 → 승인 → 묻기(한 번만 열쇠) · 다른 인터넷이면 한 번 더 · 지난 코드 · 틀린 코드 · 잦은 시작 막기
 *  ③ 책방 친구 화면(friend/index.html · 실제 크롬): PC(1400)·휴대폰(390) 로그인 없음 → 코드·QR이 바로 보임 → '🌐 웹앱에서 승인' = readnow.kr/app/#frlink=… → 승인되면 저절로 로그인 · 클라우드가 답하지 않으면 까닭과 ↻ 새 코드
 *  ④ 웹앱(실제 크롬 · 가짜 Firebase): 답 없음 → 15초 뒤 '시간 초과' 상자 + 다시 시도 · 오류 → 상자에 까닭 · 성공 → 코드 · 휴대폰은 자동으로 앱을 열지 않고 '📱 앱에서 열기' · #frlink 승인 창(다른 인터넷 → 한 번 더) · 코드 칸
 * 실행: (pw/ 안 — harness.js·fbstub.js 옆) RN_PORT=<포트> node tFRIENDLINK1114.js · 서버 뿌리 = /app/index.html(웹앱)·/friend/(책방 친구)·/readnow-*.js */
'use strict';
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = [path.join(__dirname, '../..'), process.env.RN_REPO || ''].find((r) => r && fs.existsSync(path.join(r, 'cloud/index.js')));
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const APP = rd('src/app.html'), BOOT = rd('friend/readnow-friend-boot.js'), CLOUD = rd('cloud/index.js');
const PORT = process.env.RN_PORT || 8765, BASE = 'http://localhost:' + PORT;

console.log('① 원문');
ok(/async function cloudCall\(path, body, opt\)/.test(APP) && /시간 초과\(\$\{Math\.round\(ms \/ 1000\)\}초\)/.test(APP), '웹앱 cloudCall에 기다림 한도(opt.ms) — 예전엔 끝없이 기다림');
ok(/cloudCall\('\/friend-pair', \{[^}]*\}, \{ ms: FRW_MS \}\)/.test(APP) && /const FRW_MS = 15e3;/.test(APP), '연결 단추는 15초까지만 기다림');
ok(/function frwPairFail\(/.test(APP) && /↻ 다시 시도/.test(APP), '실패하면 카드에 까닭 + ↻ 다시 시도(사라지는 알림만이 아님)');
ok(!/S\.browser_fallback_url/.test(APP), '안드로이드 연결 링크가 받는 주소로 넘어가지 않음(코드가 화면에서 사라지던 것)');
ok(/data-frwlink="1"/.test(APP) && /function frwLinkAsk\(/.test(APP) && /function frwLinkDeep\(/.test(APP) && /frwLinkDeep\(\); \} catch/.test(APP), '📺 코드로 잇기 칸 · #frlink 승인 창 · 켤 때 주소 확인');
ok(/path === '\/friend-link-start' \|\| path === '\/friend-link-poll'/.test(CLOUD) && /path === '\/friend-link-ok'\) \{ const u = await authUser\(req\)/.test(CLOUD), '클라우드 길: 시작·묻기(로그인 없음) · 승인(로그인 · 허용 계정)');
ok(/async function frPostJ\(/.test(BOOT) && /frPostJ\(c \+ '\/friend-token'/.test(BOOT), '책방 친구 화면의 연결도 12초 한도');
ok(/function frQr\(/.test(BOOT) && /data-frlkweb="1"/.test(BOOT) && /data-frlkre="1"/.test(BOOT), '화면: QR · 웹앱에서 승인 · ↻ 새 코드');
ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(BOOT), '책방 친구 화면에 브라우저 팝업 없음');
{ const a = APP.indexOf('/* (friendlink1 11/14) 📺 승인 창'), b = APP.indexOf('function frwLinkDeep('); ok(a > 0 && b > a && !/\balert\(|\bconfirm\(|\bprompt\(/.test(APP.slice(a, b)), '승인 창에 브라우저 팝업 없음(닫기 ✕·바깥·Esc)'); }

console.log('② 클라우드 friendLink* (실제 코드 · 가짜 Firestore)');
const cloudMk = () => {
  const a = CLOUD.indexOf('const FRP_TTL = '), b = CLOUD.indexOf('\n/* ── HTTP ── */'); const src = CLOUD.slice(a, b);
  const store = {}; const col = (n) => (store[n] = store[n] || {});
  const ref = (n, id) => ({ n, id, get: async () => ({ exists: col(n)[id] != null, data: () => (col(n)[id] ? JSON.parse(JSON.stringify(col(n)[id])) : undefined), ref: ref(n, id) }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...v } : { ...v }; } });
  const C = (n) => ({ doc: (id) => ref(n, id), where: (f, op, v) => ({ limit: () => ({ get: async () => { const ids = Object.keys(col(n)).filter((id) => col(n)[id][f] === v); return { empty: !ids.length, docs: ids.map((id) => ({ ref: ref(n, id) })) }; } }) }), add: async (v) => { const id = 'a' + Math.random(); col(n)[id] = v; return { id }; } });
  const W = { require, process: { env: {} }, Buffer, console, Date, JSON, Math, Map, Set, Promise, Object, String, Number, Array, Error, RegExp, encodeURIComponent,
    C, db: { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }) }, FV: { serverTimestamp: () => 'TS' }, nowIso: () => new Date().toISOString(), ALLOW: ['staff@example.com'], allowDyn: async () => new Set(),
    getAuth: () => ({ createCustomToken: async (uid, cl) => 'TOKEN:' + uid + ':' + cl.rnDev }), log: () => {}, pxIp: (req) => req.ip };
  vm.createContext(W); vm.runInContext(src + '\n;globalThis.__L = { friendLinkStart, friendLinkOk, friendLinkPoll, FRL_HITS };', W); return { L: W.__L, store };
};
const Q = (ip) => ({ ip, headers: { 'user-agent': 'test' } });
const U = { uid: 'u1', email: 'staff@example.com' };
const err = async (p) => { try { await p; return null; } catch (e) { return e; } };
(async () => {
  { const { L, store } = cloudMk();
    const s = await L.friendLinkStart(Q('1.1.1.1'), { kind: 'tauri' }); ok(s.ok && /^[\w-]{30,}$/.test(s.dc) && /^[A-Z2-9]{8}$/.test(s.code) && Date.parse(s.exp) > Date.now() + 9 * 60e3, '시작: 숨은 표 + 8자리 코드 + 10분', s);
    const raw = JSON.stringify(store); ok(!raw.includes(s.dc) && !raw.includes(s.code), '표·코드 원문은 저장하지 않음(해시만)');
    const w = await L.friendLinkPoll(Q('1.1.1.1'), { dc: s.dc }); ok(w.ok && w.wait, '승인 전 묻기 = 기다림');
    const o = await L.friendLinkOk(Q('1.1.1.1'), U, { code: s.code.slice(0, 4) + '-' + s.code.slice(4), dev: 'JS-MAIN' }); ok(o.ok && o.dev === 'JS-MAIN' && !o.far, '같은 인터넷에서 승인 = 한 번에(코드에 - 있어도)', o);
    const t = await L.friendLinkPoll(Q('1.1.1.1'), { dc: s.dc }); ok(t.ok && t.token === 'TOKEN:u1:JS-MAIN' && t.dev === 'JS-MAIN' && t.email === 'staff@example.com', '승인 뒤 묻기 = 같은 계정 로그인 열쇠 · 기기 이름', t);
    const t2 = await err(L.friendLinkPoll(Q('1.1.1.1'), { dc: s.dc })); ok(t2 && t2.code === 410, '열쇠는 한 번만(다시 물으면 410)', t2 && t2.message);
    const o2 = await err(L.friendLinkOk(Q('1.1.1.1'), U, { code: s.code, dev: 'JS-MAIN' })); ok(o2 && o2.code === 410, '이미 승인한 코드는 다시 승인 안 됨');
    const docs = Object.values(store.friend_link || {}); ok(docs.length === 1 && docs[0].used === true && docs[0].st === 'ok', '쓴 표는 지우지 않고 used만 덧붙임');
    const s2 = await L.friendLinkStart(Q('1.1.1.1'), { kind: 'android' }); const f1 = await L.friendLinkOk(Q('9.9.9.9'), U, { code: s2.code, dev: 'JS-PHONE' });
    ok(f1.ok === false && f1.far === true && f1.kind === 'android', '다른 인터넷에서 승인 → 바로 승인하지 않고 far(한 번 더)', f1);
    ok((await L.friendLinkPoll(Q('1.1.1.1'), { dc: s2.dc })).wait, 'far 단계에선 아직 기다림');
    const f2 = await L.friendLinkOk(Q('9.9.9.9'), U, { code: s2.code, dev: 'JS-PHONE', far: true }); ok(f2.ok && f2.far, '한 번 더(far:true) → 승인');
    ok((await L.friendLinkPoll(Q('1.1.1.1'), { dc: s2.dc })).token === 'TOKEN:u1:JS-PHONE', '그 뒤 묻기 = 열쇠');
    const e1 = await err(L.friendLinkOk(Q('1.1.1.1'), U, { code: 'ZZZZZZZZ', dev: 'A' })); ok(e1 && e1.code === 404, '틀린 코드 = 404(까닭 글)', e1 && e1.message);
    const e2 = await err(L.friendLinkOk(Q('1.1.1.1'), U, { code: 'ABC', dev: 'A' })); ok(e2 && e2.code === 400, '8자리가 아니면 400');
    const s3 = await L.friendLinkStart(Q('1.1.1.1'), {}); const d3 = Object.keys(store.friend_link).find((k) => !store.friend_link[k].used && store.friend_link[k].st === 'wait'); store.friend_link[d3].exp = new Date(Date.now() - 1000).toISOString();
    const e3 = await err(L.friendLinkOk(Q('1.1.1.1'), U, { code: s3.code, dev: 'A' })); ok(e3 && e3.code === 410, '10분 지난 코드 승인 = 410'); const e4 = await err(L.friendLinkPoll(Q('1.1.1.1'), { dc: s3.dc })); ok(e4 && e4.code === 410, '10분 지난 표 묻기 = 410(화면이 새 코드)');
    const e5 = await err(L.friendLinkPoll(Q('1.1.1.1'), { dc: 'x'.repeat(32) })); ok(e5 && e5.code === 404, '없는 표 = 404');
    let lim = null; for (let i = 0; i < 31 && !lim; i++) lim = await err(L.friendLinkStart(Q('5.5.5.5'), {})); ok(lim && lim.code === 429, '한 IP에서 10분에 30번 넘게 시작하면 막음'); }

  console.log('③ 책방 친구 화면 (friend/index.html · 실제 크롬)');
  const { chromium } = require('playwright'); const B = await chromium.launch();
  const stub0 = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
  /* 로그인 없는 가짜 Firebase — signInWithCustomToken이 불리면 그때 로그인 */
  const stubOut = stub0.replace("const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; },", "const __cbs = []; const auth = { currentUser: null, signInWithCustomToken: async (t) => { window.__signed = t; auth.currentUser = user; __cbs.forEach((cb) => setTimeout(() => cb(user))); return { user }; }, onAuthStateChanged: (cb) => { __cbs.push(cb); setTimeout(() => cb(auth.currentUser)); return () => {}; },");
  ok(stubOut !== stub0, '(시험 틀) 로그인 없는 가짜 Firebase');
  const fakeCloud = (mode) => { const { L } = cloudMk(); const st = { mode, starts: 0, polls: 0, L }; st.route = async (r) => { const u = r.request().url(); const H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: H }); const b = JSON.parse(r.request().postData() || '{}');
      if (st.mode === 'hang') return; /* 답 없음 */ if (st.mode === 'down') return r.fulfill({ status: 503, headers: H, body: JSON.stringify({ ok: false, err: '클라우드 잠깐 멈춤(시험)' }) });
      try { let j; if (/\/friend-link-start$/.test(u)) { st.starts++; j = await L.friendLinkStart(Q('1.1.1.1'), b); st.last = j; } else if (/\/friend-link-poll$/.test(u)) { st.polls++; j = await L.friendLinkPoll(Q('1.1.1.1'), b); } else return r.fulfill({ status: 404, headers: H, body: '{}' });
        return r.fulfill({ status: 200, headers: H, body: JSON.stringify(j) }); } catch (e) { return r.fulfill({ status: e.code || 500, headers: H, body: JSON.stringify({ ok: false, err: e.message }) }); } }; return st; };
  const friendPage = async (vp, host, C, opt) => { opt = opt || {}; const ctx = await B.newContext({ viewport: vp, ...(vp.width < 500 ? { isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' } : {}) }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 404, body: '' })); await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' }));
    await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stubOut, contentType: 'application/javascript' })); await p.route(/\.run\.app\/friend-/, C.route);
    await p.addInitScript((h) => { window.__posts = []; window.__rnFriendHost = { type: h, ver: '0.2.3', post: (k, d) => window.__posts.push([k, d]) }; try { localStorage.setItem('rn-fr-mig', '{"st":"none"}'); } catch (e) {} }, host); /* 옛 주소 들르기는 tFRIENDMIG1113이 봄 */
    await p.goto(BASE + '/friend/index.html?host=' + host); return { p, ctx, errs }; };
  const cardTxt = (p) => p.evaluate(() => (document.getElementById('fr_card') || {}).innerText || '');
  for (const [nm, vp, host] of [['PC', { width: 1400, height: 900 }, 'tauri'], ['휴대폰', { width: 390, height: 844 }, 'android']]) {
    const C = fakeCloud('ok'); const { p, ctx, errs } = await friendPage(vp, host, C); const t0 = Date.now();
    await p.waitForFunction(() => /[A-Z2-9]{4}-[A-Z2-9]{4}/.test((document.getElementById('fr_card') || {}).innerText || ''), null, { timeout: 8000 }).catch(() => {});
    const txt = await cardTxt(p); const code = C.last && C.last.code; const dt = Date.now() - t0;
    ok(code && txt.includes(code.slice(0, 4) + '-' + code.slice(4)) && dt < 6000, `${nm}: 연결 카드가 뜨자마자 이 화면의 코드가 보임(${dt}ms · 아무것도 안 눌러도)`, txt.slice(0, 200));
    ok(await p.evaluate(() => !!document.querySelector('#fr_card .fr-lk svg path')), `${nm}: QR 그림`);
    const geo = await p.evaluate(() => { const c = document.getElementById('fr_card').getBoundingClientRect(); return { l: c.left, r: c.right, t: c.top, b: c.bottom, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth }; });
    ok(geo.l >= 0 && geo.r <= geo.w && geo.t >= 0 && geo.b <= geo.h && geo.sw <= geo.w, `${nm}: 카드가 화면 안(가로 넘침 없음)`, geo);
    await p.click('[data-frlkweb]'); const op = await p.evaluate(() => window.__posts.filter((x) => x[0] === 'open').map((x) => x[1] && x[1].url));
    ok(op.length === 1 && op[0] === `https://readnow.kr/app/#frlink=${code}&k=${host === 'android' ? 'android' : 'tauri'}`.replace('https://readnow.kr', BASE), `${nm}: 🌐 웹앱에서 승인 = 기본 브라우저로 웹앱 #frlink=코드`, op);
    const pl0 = C.polls; await p.waitForTimeout(2300); ok(C.polls > pl0, `${nm}: 2초마다 승인됐는지 물음`);
    await C.L.friendLinkOk(Q('1.1.1.1'), U, { code, dev: host === 'android' ? 'JS-PHONE' : 'JS-MAIN' }); /* 사람이 웹앱에서 '✓ 잇기' */
    await p.waitForFunction(() => !!window.__signed, null, { timeout: 6000 }).catch(() => {});
    const sg = await p.evaluate(() => ({ t: window.__signed, dev: localStorage.getItem('rn-device'), paired: (window.__posts.find((x) => x[0] === 'paired') || [])[1] }));
    ok(/^TOKEN:u1:/.test(sg.t || '') && sg.dev === (host === 'android' ? 'JS-PHONE' : 'JS-MAIN') && sg.paired, `${nm}: 승인되면 저절로 로그인 · 기기 이름 받음 · 프로그램에 알림`, sg);
    ok(!errs.length, `${nm}: 화면 오류 없음`, errs); await ctx.close(); }
  { const C = fakeCloud('down'); const { p, ctx } = await friendPage({ width: 1400, height: 900 }, 'tauri', C);
    await p.waitForFunction(() => /코드를 못 받음/.test((document.getElementById('fr_card') || {}).innerText || ''), null, { timeout: 8000 }).catch(() => {});
    const txt = await cardTxt(p); ok(/코드를 못 받음/.test(txt) && /클라우드 잠깐 멈춤/.test(txt) && (await p.locator('#fr_card [data-frlkre]').count()) > 0, '클라우드 오류 → 까닭 + ↻ 새 코드(먹통 아님)', txt.slice(0, 200));
    C.mode = 'ok'; await p.click('#fr_card [data-frlkre]'); await p.waitForTimeout(1500); const t2 = await cardTxt(p); ok(C.last && t2.includes(C.last.code.slice(0, 4)), '↻ 새 코드 → 코드가 나옴'); await ctx.close(); }
  { const C = fakeCloud('hang'); const { p, ctx } = await friendPage({ width: 390, height: 844 }, 'android', C); const t0 = Date.now();
    await p.waitForFunction(() => /시간 초과/.test((document.getElementById('fr_card') || {}).innerText || ''), null, { timeout: 20000 }).catch(() => {});
    const txt = await cardTxt(p); ok(/시간 초과\(12초\)/.test(txt) && Date.now() - t0 < 16000, `클라우드가 답하지 않음 → ${Math.round((Date.now() - t0) / 1000)}초 뒤 '시간 초과' + ↻ 새 코드`, txt.slice(0, 200)); await ctx.close(); }
  await B.close();

  console.log('④ 웹앱 (⚙ 설정 › 🐾 책방 친구)');
  const H = require('./harness.js');
  const webRun = async (mode, fn, opt) => H(async (p) => {
    const st = { calls: [] }; await p.route(/cloud\.test/, async (r) => { const H2 = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }; if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: H2 });
      const u = r.request().url(), b = JSON.parse(r.request().postData() || '{}'); st.calls.push({ u, b }); const m = typeof mode === 'function' ? mode(u, b) : mode; if (m === 'hang') return;
      if (m === 'err') return r.fulfill({ status: 500, headers: H2, body: JSON.stringify({ ok: false, err: '서버 오류 시험' }) });
      if (/friend-pair$/.test(u)) return r.fulfill({ status: 200, headers: H2, body: JSON.stringify({ ok: true, t: 'T'.repeat(32), code: 'ABCDEFGH', exp: new Date(Date.now() + 6e5).toISOString(), dev: b.dev }) });
      return r.fulfill({ status: 200, headers: H2, body: JSON.stringify(m) }); });
    await p.evaluate(() => { localStorage.setItem('rn-device', 'TEST-PC'); }); await p.waitForTimeout(1200);
    await p.evaluate(() => { window.pptCloudUrl = () => 'https://cloud.test'; S.devOk = true; S.tab = 'settings'; renderMain(); window.__opened = []; const a0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (/^(readnow-friend|intent):/.test(this.href)) window.__opened.push(this.href); else return a0.call(this); }; }); await p.waitForTimeout(800);
    await fn(p, st); }, opt);
  const setTxt = (p) => p.evaluate(() => ((document.querySelector('#frw_set') || {}).innerText || '').replace(/\s+/g, ' '));
  await webRun('hang', async (p) => { await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(1000); ok(/준비 중…\(15초까지\)/.test(await setTxt(p)), '답 없음: 누르면 바로 "준비 중…(15초까지)"');
    await p.waitForTimeout(15500); const t = await setTxt(p); ok(/연결 준비 실패/.test(t) && /시간 초과\(15초\)/.test(t) && /다시 시도/.test(t) && !/준비 중…/.test(t), '15초 뒤: 상자에 "시간 초과" + ↻ 다시 시도(먹통 없음)', t.slice(0, 300)); });
  await webRun('err', async (p, st) => { await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(1500); const t = await setTxt(p); ok(/연결 준비 실패/.test(t) && /서버 오류 시험/.test(t), '클라우드 오류: 상자에 까닭이 남음', t.slice(0, 300));
    const n0 = st.calls.length; await p.locator('#frw_set [data-frwpair]').last().click(); await p.waitForTimeout(800); ok(st.calls.length === n0 + 1, '↻ 다시 시도 = 다시 부름'); });
  await webRun({}, async (p) => { await p.evaluate(() => { localStorage.removeItem('rn-device'); renderMain(); }); await p.waitForTimeout(300); await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(500); const t = await setTxt(p);
    ok(/이 기기 이름이 없어요/.test(t) && /⚙ 설정 ①/.test(t), '기기 이름 없음: 상자에 까닭과 할 곳', t.slice(0, 200)); });
  await webRun({}, async (p) => { await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(1200); const t = await setTxt(p); const op = await p.evaluate(() => window.__opened);
    ok(/ABCD-EFGH/.test(t) && op.length === 1 && /^readnow-friend:\/\/pair\?t=T{32}&/.test(op[0]), 'PC 성공: 코드가 보이고 프로그램 링크를 엶', [t.slice(0, 120), op]); });
  await webRun({}, async (p) => { await p.evaluate(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile' }); renderMain(); }); await p.waitForTimeout(300); await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(1200); const t = await setTxt(p); let op = await p.evaluate(() => window.__opened);
    ok(/ABCD-EFGH/.test(t) && op.length === 0 && /📱 앱에서 열기/.test(t), '휴대폰: 코드가 보이고 화면이 넘어가지 않음(누를 때만 앱 열기)', [t.slice(0, 160), op]);
    await p.locator('[data-frwopen]').first().click(); op = await p.evaluate(() => window.__opened); ok(op.length === 1 && /^intent:\/\/pair\?/.test(op[0]) && !/fallback/.test(op[0]), '📱 앱에서 열기 = intent(받는 주소로 넘어가지 않음)', op);
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw[0] <= sw[1] + 1, '휴대폰 390: 가로 넘침 없음', sw); }, { vp: { width: 390, height: 844 }, touch: true });
  /* 휴대폰 UA는 harness가 바꾸지 않으므로 navigator.userAgent를 덮어 다시 봄 */
  await webRun({}, async (p) => { await p.evaluate(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile' }); }); await p.locator('[data-frwpair]').first().click(); await p.waitForTimeout(1200);
    const op = await p.evaluate(() => window.__opened); const t = await setTxt(p); ok(op.length === 0 && /📱 앱에서 열기/.test(t), '안드로이드 UA: 자동으로 앱을 열지 않음 · 📱 앱에서 열기 단추', [op, t.slice(0, 160)]); });
  /* #frlink 승인 창 — 다른 인터넷이면 한 번 더 */
  let farN = 0; await webRun((u, b) => (/friend-link-ok$/.test(u) ? (b.far ? { ok: true, dev: b.dev, far: true } : (farN++, { ok: false, far: true, kind: 'tauri' })) : {}), async (p, st) => {
    await p.evaluate(() => { history.replaceState(null, '', location.pathname + '#frlink=WXYZ2345&k=tauri'); frwLinkDeep(); }); await p.waitForTimeout(800);
    const dlg = await p.evaluate(() => { const d = document.getElementById('frw_lk'); return d ? { t: d.innerText.replace(/\s+/g, ' '), hash: location.hash, dev: d.querySelector('#frw_lkdev').value } : null; });
    ok(dlg && /WXYZ-2345/.test(dlg.t) && /PC 프로그램/.test(dlg.t) && dlg.hash === '' && dlg.dev === 'TEST-PC', '#frlink=코드 → 승인 창(코드·종류 · 주소에서 지움 · 이 기기 이름)', dlg);
    await p.click('#frw_lk [data-lkok]'); await p.waitForTimeout(700); const m1 = await p.evaluate(() => document.getElementById('frw_lkmsg').innerText);
    ok(/다른 인터넷/.test(m1) && st.calls.filter((c) => /friend-link-ok$/.test(c.u)).length === 1 && st.calls[st.calls.length - 1].b.code === 'WXYZ2345' && st.calls[st.calls.length - 1].b.dev === 'TEST-PC', '다른 인터넷에서 온 요청 → 한 번 더 누르라는 안내', m1);
    await p.click('#frw_lk [data-lkok]'); await p.waitForTimeout(700); const last = st.calls[st.calls.length - 1]; const t2 = await p.evaluate(() => (document.getElementById('frw_lk') || {}).innerText || '');
    ok(last.b.far === true && /이었어요/.test(t2), '한 번 더 → 승인(far) · "이었어요"', [last.b, t2.slice(0, 80)]);
    await p.click('#frw_lk [data-lkx]'); ok(!(await p.evaluate(() => !!document.getElementById('frw_lk'))), '닫기 ✕');
    await p.evaluate(() => frwLinkAsk('ABCDEFGH', 'android')); await p.waitForTimeout(200); await p.keyboard.press('Escape'); ok(!(await p.evaluate(() => !!document.getElementById('frw_lk'))), 'Esc로 닫힘');
    await p.evaluate(() => frwLinkAsk('ABCDEFGH', 'android')); await p.waitForTimeout(200); await p.mouse.click(5, 5); ok(!(await p.evaluate(() => !!document.getElementById('frw_lk'))), '바깥을 누르면 닫힘'); });
  await webRun((u, b) => (/friend-link-ok$/.test(u) ? { ok: true, dev: b.dev } : {}), async (p, st) => { await p.fill('#frw_lcode', 'qrst-uv23'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => !!document.getElementById('frw_lk') && /QRST-UV23/.test(document.getElementById('frw_lk').innerText)), '📺 코드 칸에 넣고 Enter → 승인 창(소문자·- 정리)');
    await p.click('#frw_lk [data-lkok]'); await p.waitForTimeout(600); ok(st.calls.some((c) => /friend-link-ok$/.test(c.u) && c.b.code === 'QRSTUV23' && !c.b.far) && /이었어요/.test(await p.evaluate(() => document.getElementById('frw_lk').innerText)), '같은 인터넷 = 한 번에 승인'); });
  await webRun('hang', async (p) => { await p.evaluate(() => frwLinkAsk('ABCDEFGH', 'tauri')); await p.waitForTimeout(200); await p.click('#frw_lk [data-lkok]'); await p.waitForTimeout(16000);
    const m = await p.evaluate(() => document.getElementById('frw_lkmsg').innerText); ok(/시간 초과\(15초\)/.test(m) && !(await p.evaluate(() => document.querySelector('#frw_lk [data-lkok]').disabled)), '승인도 답이 없으면 15초 뒤 까닭 · 단추 다시 누를 수 있음', m); });
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 멈춤', e); process.exit(1); });
