/* tFRIENDMIG1113 — (friendmig 11/13 · 정범님 '책방 친구 앱도 이제 현 주소로') 책방 친구 앱 새 주소 readnow.kr
 *  ① 윈도우 프로그램(Tauri) 0.2.3: 화면·설정·웹앱 주소 readnow.kr · 업데이트 확인은 readnow.kr/dl/friend/latest.json 먼저(없으면 GitHub 판 목록) · 받는 주소 검사 두 곳만 · 원격 권한에 readnow.kr 출처 · 판 번호 세 곳+Cargo.lock 같음
 *  ② 안드로이드 앱: 화면 readnow.kr · 다리 스크립트는 새·옛 출처 둘 다 · 앱 안에서 여는 화면 = 두 주소의 책방 친구 화면만 · 웹앱 열기 readnow.kr
 *  ③ 화면(friend/readnow-friend-boot.js) 로그인 옮기기: 새 주소에 로그인 없음 → 옛 주소 확인 → 옛 주소(?mig=1) → 같은 계정 연결 표 → 새 주소(#pair · 자리 옮김) → 연결
 *     (가짜 창 셋을 vm으로 · 주소마다 따로인 저장소) · 새 판 띠 = readnow.kr/dl/friend/
 * 실행: node src/tests/tFRIENDMIG1113.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
'use strict';
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '../..'); const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

console.log('① 윈도우 프로그램');
{ const s = rd('friend-app/desktop/src-tauri/src/lib.rs');
  ok(/const PAGE: &str = "https:\/\/readnow\.kr\/friend\/index\.html\?host=tauri";/.test(s) && /const PAGE_SET: &str = "https:\/\/readnow\.kr\/friend\/index\.html\?settings=1&win=set";/.test(s) && /const WEBAPP: &str = "https:\/\/readnow\.kr\/app\/";/.test(s), '화면·설정·웹앱 = readnow.kr');
  ok(/const LATEST_JSON: &str = "https:\/\/readnow\.kr\/dl\/friend\/latest\.json";/.test(s) && s.indexOf('.get(LATEST_JSON)') > 0 && s.indexOf('.get(LATEST_JSON)') < s.indexOf('agent.get(RELEASES_API)'), '업데이트 확인: readnow.kr 먼저 · 그다음 GitHub');
  ok(/const DL_OK: \[&str; 2\] = \["https:\/\/readnow\.kr\/dl\/friend\/", "https:\/\/github\.com\/jerrycson\/readnow-scripts\/releases\/download\/"\];/.test(s) && /if !dl_ok\(&url\) \{\s*return;/.test(s) && !/if !url\.starts_with\("https:\/\/github\.com/.test(s), '받는 주소 검사 = 두 곳(readnow.kr/dl/friend/ · GitHub 판)만');
  ok(/f\["kind"\]\.as_str\(\) == Some\("win"\) && n\.ends_with\("-setup\.exe"\) && dl_ok\(u\)/.test(s), 'latest.json에서 윈도우 setup.exe만 · 주소 검사 함께');
  const live = s.split('\n').filter((l) => !/^\s*(\/\/|assert|let old)/.test(l)); ok(!live.some((l) => /jerrycson\.github\.io/.test(l)), '프로그램이 여는 주소에 옛 주소 없음(시험·주석 빼고)');
  const cap = JSON.parse(rd('friend-app/desktop/src-tauri/capabilities/default.json')); const U = cap.remote.urls;
  ok(U.includes('https://readnow.kr') && U.includes('https://readnow.kr/friend/*'), '원격 권한: readnow.kr 출처(Origin 머리) · 책방 친구 화면');
  ok(U.includes('https://jerrycson.github.io') && U.includes('https://jerrycson.github.io/readnow-scripts/*'), '원격 권한: 옛 주소 받침(Pages 끄기 전까지 · 로그인 넘기기 때 들름)');
  ok(!U.some((u) => /readnow\.kr\/\*$|readnow\.kr\/app/.test(u)), '웹앱 등 다른 readnow.kr 화면은 프로그램 다리 못 부름');
  const v1 = JSON.parse(rd('friend-app/desktop/src-tauri/tauri.conf.json')).version, v2 = JSON.parse(rd('friend-app/desktop/package.json')).version;
  const v3 = (rd('friend-app/desktop/src-tauri/Cargo.toml').match(/^version = "(.*)"/m) || [])[1]; const v4 = (rd('friend-app/desktop/src-tauri/Cargo.lock').match(/name = "readnow-friend"\nversion = "(.*)"/) || [])[1];
  ok(v1 === '0.2.3' && v2 === v1 && v3 === v1 && v4 === v1, '판 번호 0.2.3 네 곳 같음', [v1, v2, v3, v4]); }

console.log('② 안드로이드 앱');
{ const s = rd('friend-app/android/app/src/main/java/kr/readnow/friend/FriendService.kt'); const m = rd('friend-app/android/app/src/main/java/kr/readnow/friend/MainActivity.kt');
  ok(/const val PAGE = "https:\/\/readnow\.kr\/friend\/index\.html\?host=android"/.test(s) && /const val ORIGIN = "https:\/\/readnow\.kr"/.test(s) && /const val ORIGIN_OLD = "https:\/\/jerrycson\.github\.io"/.test(s), '화면 readnow.kr · 옛 출처는 받침');
  ok(/setOf\(ORIGIN, ORIGIN_OLD\)/.test(s), '다리 스크립트(__rnFriendHost)는 두 출처 모두');
  ok(/if \(isFriendPage\(u\)\) return false/.test(s) && /u\.host == "readnow\.kr" && u\.path\?\.startsWith\("\/friend\/"\) == true/.test(s) && /u\.host == "jerrycson\.github\.io" && u\.path\?\.startsWith\("\/readnow-scripts\/friend\/"\) == true/.test(s) && /u\.scheme == "https"/.test(s), '앱 안에서 여는 것 = 두 주소의 책방 친구 화면만(나머지는 기본 브라우저)');
  ok(/Uri\.parse\("https:\/\/readnow\.kr\/app\/"\)/.test(m) && !/jerrycson\.github\.io/.test(m), '🌐 웹앱 열기 = readnow.kr/app/');
  const g = rd('.github/workflows/friend-android.yml'); ok(/tauri\.conf\.json'\)\.version/.test(g), '안드로이드 판 번호는 tauri.conf.json(0.2.3)을 따름'); }

console.log('③ 화면 로그인 옮기기');
const BOOT = rd('friend/readnow-friend-boot.js');
ok(/readnow-friend-boot\.js\?v=0\.15\.20-m1/.test(rd('friend/index.html')), '화면이 새 boot를 받음(?v 바꿈)');
ok(/const FR_SHELL_NEW = '0\.2\.3';/.test(BOOT) && /frOpenUrl\(FR_DL\)/.test(BOOT) && /const FR_DL = 'https:\/\/readnow\.kr\/dl\/friend\/';/.test(BOOT) && !/releases\/tag\/friend-v/.test(BOOT), '새 판 띠: 0.2.3 · 받는 곳 readnow.kr/dl/friend/');
ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(BOOT), '브라우저 팝업 없음');
/* 가짜 창: 무엇이든 받아 주는 DOM · 주소마다 따로인 저장소 */
const any = () => { const f = function () { return P; }; const P = new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === 'length' ? 0 : k === 'style' ? new Proxy({}, { get: () => '', set: () => true }) : P), set: () => true, apply: () => P }); return P; };
const STORES = {};
function makeWin(href, opt) {
  const u = new URL(href); const st = STORES[u.origin] || (STORES[u.origin] = new Map());
  const calls = { replace: [], fetch: [], posts: [], cards: [] }; let authCb = null;
  const ls = { getItem: (k) => (st.has(k) ? st.get(k) : null), setItem: (k, v) => st.set(k, String(v)), removeItem: (k) => st.delete(k) };
  const doc = any(); const D = { addEventListener: () => {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => any(), body: any(), documentElement: any(), activeElement: null };
  const loc = { href, origin: u.origin, hostname: u.hostname, pathname: u.pathname, search: u.search, hash: u.hash, replace: (x) => calls.replace.push(x), reload: () => {} };
  const fb = { initializeApp: () => {}, firestore: () => any(), auth: () => ({ onAuthStateChanged: (cb) => { authCb = cb; }, signInWithCustomToken: async () => {}, signOut: async () => {}, currentUser: null }) };
  const W = { console, URL, URLSearchParams, JSON, Date, Math, Promise, Map, Set, Array, Object, String, Number, Boolean, RegExp, Error, encodeURIComponent, decodeURIComponent, escape, unescape, parseInt, parseFloat, isFinite, Symbol, Proxy,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary'), AbortController,
    setTimeout: (f, ms) => (ms <= 1000 ? setImmediate(f) : 0), clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    localStorage: ls, location: loc, document: Object.assign(doc, D), navigator: { userAgent: 'test' }, matchMedia: () => ({ matches: false }), performance: { now: () => 0 }, history: { replaceState: (a, b, x) => { loc.cleaned = x; } },
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, addEventListener: () => {}, firebase: fb,
    fetch: async (url, o) => { calls.fetch.push({ url, o }); return opt.fetch(url, o); } };
  if (opt.host === 'tauri') W.__TAURI_INTERNALS__ = { invoke: (cmd, a) => { calls.posts.push(a && a.kind); return Promise.resolve(); } };
  W.window = W; W.self = W; W.globalThis = W;
  vm.createContext(W); vm.runInContext(BOOT, W, { filename: 'readnow-friend-boot.js' });
  vm.runInContext('frCard = function (k, a) { __cards.push(k); }; window.__frAuth = frAuth; window.__FR = FR;', Object.assign(W, { __cards: calls.cards }));
  return { W, calls, st, auth: (user) => W.__frAuth(user) };
}
const tick = () => new Promise((r) => setTimeout(r, 30));
(async () => {
  const OLDO = 'https://jerrycson.github.io', NEWO = 'https://readnow.kr';
  /* 옛 주소 저장소: 늘 쓰던 로그인·기기 이름·자리 */
  STORES[OLDO] = new Map([['rn-device', 'JS-MAIN'], ['rn-fr-pos', '{"dx":10,"dy":20,"dpr":1}'], ['rn-friend-cloud', 'https://readnow-cloud-63884079760.asia-northeast3.run.app']]);
  const cloudFetch = async (url, o) => {
    if (/jerrycson\.github\.io\/readnow-scripts\/friend\/readnow-friend-boot\.js\?mig=/.test(url)) return { ok: true, status: 200, text: async () => BOOT };
    if (/\/friend-pair$/.test(url)) { const b = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ ok: true, t: 'T'.repeat(32), code: 'ABCDEFGH', dev: b.dev }) }; }
    if (/\/friend-token$/.test(url)) return { ok: true, status: 200, json: async () => ({ ok: true, token: 'tok', dev: 'JS-MAIN', email: 'x@example.com' }) };
    return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
  };
  // 1) 새 주소 · 프로그램 · 로그인 없음 → 옛 주소로 들름
  const A = makeWin(NEWO + '/friend/index.html?host=tauri', { host: 'tauri', fetch: cloudFetch });
  A.auth(null); await tick(); await tick();
  ok(A.calls.fetch.some((f) => /readnow-friend-boot\.js\?mig=/.test(f.url)), '옛 주소가 넘기기 장치를 가졌는지 먼저 봄');
  ok(A.calls.replace.length === 1 && A.calls.replace[0] === OLDO + '/readnow-scripts/friend/index.html?host=tauri&mig=1', '옛 주소 화면(?mig=1)으로 들름', A.calls.replace);
  ok(JSON.parse(A.st.get('rn-fr-mig') || '{}').st === 'go', '들르기 표시(기기마다 한 번)');
  // 2) 옛 주소(?mig=1) · 로그인돼 있음 → 같은 계정 연결 표 → 새 주소
  const B = makeWin(A.calls.replace[0], { host: 'tauri', fetch: cloudFetch });
  B.auth({ getIdToken: async () => 'IDTOKEN' }); await tick(); await tick();
  const fp = B.calls.fetch.find((f) => /\/friend-pair$/.test(f.url));
  ok(fp && fp.o.headers.Authorization === 'Bearer IDTOKEN' && JSON.parse(fp.o.body).dev === 'JS-MAIN' && JSON.parse(fp.o.body).kind === 'desktop', '옛 주소 로그인으로 연결 표 받기(같은 기기 이름)', fp && fp.o);
  const back = B.calls.replace[0] || ''; const bu = new URL(back); const bh = new URLSearchParams(bu.hash.slice(1));
  ok(bu.origin === NEWO && bu.pathname === '/friend/index.html' && bu.searchParams.get('host') === 'tauri' && bu.searchParams.get('mig') === 'back', '새 주소로 돌아감(?mig=back)', back);
  ok(bh.get('pair') === 'T'.repeat(32) && bh.get('k') === 'ABCDEFGH' && bh.get('d') === 'JS-MAIN' && /run\.app$/.test(bh.get('c')), '연결 표·코드·기기·클라우드 주소를 붙임');
  ok(B.calls.cards.length === 0 && !B.calls.fetch.some((f) => /firestore|friend-token/.test(f.url)), '옛 주소는 넘기기만(캐릭터·연결 안 함)');
  // 3) 새 주소(#pair) → 연결 · 자리 옮김
  const C = makeWin(back, { host: 'tauri', fetch: cloudFetch });
  ok(C.st.get('rn-fr-pos') === '{"dx":10,"dy":20,"dpr":1}' && /run\.app$/.test(C.st.get('rn-friend-cloud') || ''), '캐릭터 자리·클라우드 주소를 새 주소 저장소로 옮김');
  C.auth(null); await tick(); await tick();
  ok(C.calls.fetch.some((f) => /\/friend-token$/.test(f.url) && JSON.parse(f.o.body).t === 'T'.repeat(32)), '받은 표로 같은 계정 로그인(연결 다시 안 함)');
  ok(JSON.parse(C.st.get('rn-fr-mig') || '{}').st === 'pair' && C.st.get('rn-device') === 'JS-MAIN', '들르기 끝 표시 · 기기 이름 그대로');
  ok(!C.calls.replace.some((x) => /jerrycson/.test(x)), '다시 옛 주소로 가지 않음(되풀이 없음)');
  // 4) 옛 주소에 넘기기 장치가 없으면(Pages 꺼짐 등) 들르지 않고 연결 카드
  delete STORES[NEWO];
  const D = makeWin(NEWO + '/friend/index.html?host=android', { host: 'android', fetch: async () => ({ ok: false, status: 404, text: async () => '' }) });
  D.W.RnHostAndroid = { post: () => {} }; D.auth(null); await tick(); await tick();
  ok(D.calls.replace.length === 0 && D.calls.cards.includes('pair') && !D.st.get('rn-fr-mig'), '옛 주소가 안 되면 들르지 않고 연결 카드(다음에 다시 봄)', D.calls);
  // 5) 옛 주소에 로그인이 없으면 표 없이 새 주소로 → 연결 카드 · 다시 들르지 않음
  delete STORES[NEWO]; STORES[OLDO] = new Map();
  const E = makeWin(NEWO + '/friend/index.html?host=tauri', { host: 'tauri', fetch: cloudFetch }); E.auth(null); await tick(); await tick();
  const E2 = makeWin(E.calls.replace[0], { host: 'tauri', fetch: cloudFetch }); E2.auth(null); await tick();
  const e3u = E2.calls.replace[0] || ''; ok(/^https:\/\/readnow\.kr\/friend\/index\.html\?host=tauri&mig=back/.test(e3u) && !/pair=/.test(e3u) && !E2.calls.fetch.some((f) => /friend-pair/.test(f.url)), '옛 주소 로그인 없음 → 표 없이 돌아감', e3u);
  const E3 = makeWin(e3u, { host: 'tauri', fetch: cloudFetch }); E3.auth(null); await tick();
  ok(E3.calls.cards.includes('pair') && E3.calls.replace.length === 0 && JSON.parse(E3.st.get('rn-fr-mig') || '{}').st === 'none', '돌아와서 연결 카드 · 다시 들르지 않음');
  // 6) 브라우저 탭(웹앱과 같은 주소)·설정 창은 들르지 않음
  delete STORES[NEWO]; const F = makeWin(NEWO + '/friend/index.html', { fetch: cloudFetch }); F.auth(null); await tick();
  ok(F.calls.replace.length === 0 && F.calls.cards.includes('pair'), '브라우저 탭은 들르지 않음(웹앱 로그인을 그대로 씀)');
  delete STORES[NEWO]; const G = makeWin(NEWO + '/friend/index.html?settings=1&win=set', { host: 'tauri', fetch: cloudFetch }); G.auth(null); await tick();
  ok(G.calls.replace.length === 0, '⚙ 설정 창은 들르지 않음(캐릭터 창이 함)');
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
