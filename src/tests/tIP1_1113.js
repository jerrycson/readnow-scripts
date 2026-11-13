// tIP1_1113 — (ip1 11/13) ☁ 클라우드 알라딘 로그인 '한 번만 시험'(cloud/login-once.js · cloud/index.js login() · 웹앱 🧭 관리도구 › 🔑 알라딘 로그인 칸)
//  ① 시험권 없으면(기본) 아이디·비밀번호를 넣지 않음(사실 F25)  ② 시험권 + 9~21시 + 🔒 상시 PC 로그인 중 → 딱 한 번 · 됨이면 세션 저장
//  ③ 한 번 쓴 시험권은 다시 시도 0(42FB·됨 모두)  ④ 밤·PC 로그인 없음·24시간 지남 → 시도 0이고 시험권도 안 씀(지남은 닫음)
//  ⑤ 웹앱: 관리자 기기에서만 · 두 번 누르기(data-arm) · cloud_jobs.loginOnce만 씀 · 브라우저 팝업 없음
// 실행: node src/tests/tIP1_1113.js  (저장소 뿌리에서도, src/tests에서도)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const CLD = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const APP = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const ONCE = require(path.join(ROOT, 'cloud', 'login-once.js'));
const TL = fs.readFileSync(path.join(ROOT, 'src', 'tests', 't_login.js'), 'utf8');
const fakeDb = eval('(' + TL.slice(TL.indexOf('function fakeDb()'), TL.indexOf('const sleepReal')).trim() + ')');
const KST11 = Date.parse('2026-11-14T02:00:00Z'); /* 한국 11:00 */
(async () => {
  console.log('① 순수 함수 gate');
  const live = { 'JS-MAIN': { in: true, at: KST11 - 60e3 } }; const AL = ['JS-MAIN', 'MJ-MAIN', 'HOME'];
  ok(ONCE.gate(null, {}, KST11, AL).kind === 'none', '시험권 없음 → none');
  ok(ONCE.gate({ id: 'x y', at: KST11 }, {}, KST11, AL).kind === 'none', '이상한 id → none');
  ok(ONCE.gate({ id: 'oabc1', at: KST11 }, { dev: live }, KST11, AL).go === true, '9~21시 · 상시 PC 로그인 중 → 감');
  ok(ONCE.gate({ id: 'oabc1', at: KST11 }, { dev: live, once: { id: 'oabc1', result: '42FB' } }, KST11, AL).kind === 'used', '이미 쓴 시험권 → used');
  const ex = ONCE.gate({ id: 'oabc1', at: KST11 - 25 * 3600e3 }, { dev: live }, KST11, AL); ok(ex.kind === 'expired' && ex.close && ex.close.result === 'expired', '24시간 지남 → 닫음');
  ok(ONCE.gate({ id: 'oabc1', at: KST11 }, { dev: live }, KST11 + 12 * 3600e3, AL).kind === 'hour', '한국 23시 → hour');
  ok(ONCE.gate({ id: 'oabc1', at: KST11 }, { dev: { 'JS-MAIN': { in: true, at: KST11 - 40 * 60e3 } } }, KST11, AL).kind === 'pc', '상시 PC 신호 30분 넘음 → pc');
  ok(ONCE.gate({ id: 'oabc1', at: KST11 }, { dev: { cloud: { in: true, at: KST11 } } }, KST11, AL).kind === 'pc', '클라우드 신호만 → pc(상시 PC 아님)');

  console.log('② 클라우드 login() 묶음');
  const cs = CLD.indexOf('let lastDialog = null, probeAt = 0;'), ce = CLD.indexOf('/* ── ① 주문확인요청: 1분마다 이것부터');
  let NOW = KST11; class FD extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }
  const cdb = fakeDb(); const put = (dev) => { cdb.store['app_settings/aladin_login'] = { ...(cdb.store['app_settings/aladin_login'] || {}), cfg: { noticeSec: [0, 0] }, dev }; };
  put({ 'JS-MAIN': { in: true, at: NOW - 60e3 } });
  let api; const cl = { in: false, goto: 0, fill: 'ok', cookies: [{ name: 'AladinUser', value: 'v', domain: '.aladin.co.kr', path: '/' }] };
  const page = { evaluate: async (fn, ...a) => { const s = String(fn); if (/worders\.aspx\?searchType=1/.test(s)) return cl.in; if (a.length === 2) { cl.goto++; if (cl.fill === 'ok') cl.in = true; else api.setDialog({ msg: '로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-7046)', at: NOW }); return 'sent'; } return ''; }, cookies: async () => cl.cookies, setCookie: async () => {}, goto: async () => {}, waitForNavigation: async () => {}, url: () => 'https://www.aladin.co.kr/' };
  let J = { cloudLogin: false, loginOnce: null };
  const deps = { C: (n) => cdb.collection(n), db: cdb, FV: cdb.FV, log: () => {}, sleep: async () => {}, browser: { id: 1 }, ALADIN_ID: 'id', ALADIN_PW: 'pw', AL: 'https://www.aladin.co.kr', ensureCores: async () => {}, VER: 't', fetch: async () => ({ json: async () => ({ ip: '8.230.9.9' }) }), AbortSignal: { timeout: () => undefined }, Date: FD,
    cjobs: async () => J, get cjCache() { return J; }, require: (m) => require(path.join(ROOT, 'cloud', path.basename(m))) };
  api = new Function('deps', 'with (deps) { ' + CLD.slice(cs, ce) + '\n return { login, setDialog: (d) => { lastDialog = d; } }; }')(deps);
  const tryLogin = async () => { try { return { r: await api.login(page) }; } catch (e) { return { e }; } };
  let x = await tryLogin(); ok(x.e && x.e.noCloudLogin && cl.goto === 0, '시험권 없음 → 아이디·비밀번호 안 넣음(F25)', x.e && x.e.message);
  J = { cloudLogin: false, loginOnce: { id: 'oabc1', at: NOW, by: 't' } }; NOW += 6 * 60e3; deps.browser = { id: 2 }; put({ 'JS-MAIN': { in: true, at: NOW - 60e3 } });
  x = await tryLogin(); const A1 = cdb.store['app_settings/aladin_login']; ok(x.r === true && cl.goto === 1, '시험권 → 딱 한 번 로그인', x.e && x.e.message);
  ok(A1.once && A1.once.id === 'oabc1' && A1.once.result === 'ok' && A1.once.ip === '8.230.9.9', '결과 once.result = ok · 나간 주소', A1.once);
  ok(cdb.store['app_secrets/aladin_session'] && cdb.store['app_secrets/aladin_session'].n === 1, '됨 → 세션 저장(이어 씀)');
  cl.in = false; cl.fill = '42fb'; NOW += 6 * 60e3; deps.browser = { id: 3 }; cdb.store['app_secrets/aladin_session'] = null; put({ 'JS-MAIN': { in: true, at: NOW - 60e3 } });
  x = await tryLogin(); ok(x.e && x.e.noCloudLogin && cl.goto === 1, '쓴 시험권 → 세션 풀려도 다시 안 함', x.e && x.e.message);
  J = { cloudLogin: false, loginOnce: { id: 'oabc2', at: NOW, by: 't' } }; NOW += 6 * 60e3;
  x = await tryLogin(); const A2 = cdb.store['app_settings/aladin_login']; ok(x.e && cl.goto === 2 && A2.once.result === '42FB' && /42FB/.test(A2.once.code || ''), '새 시험권 → 한 번 · 42FB 기록', A2.once);
  for (let i = 0; i < 3; i++) { NOW += 11 * 60e3; put({ 'JS-MAIN': { in: true, at: NOW - 60e3 } }); await tryLogin(); } ok(cl.goto === 2, '42FB 뒤 다시 시도 0(세 번 불러도)');
  J = { cloudLogin: false, loginOnce: { id: 'oabc3', at: NOW, by: 't' } }; NOW += 6 * 60e3; put({});
  x = await tryLogin(); ok(x.e && cl.goto === 2 && cdb.store['app_settings/aladin_login'].once.id === 'oabc2', '상시 PC 로그인 없음 → 시도 0 · 시험권 안 씀');
  NOW = KST11 + 12 * 3600e3; J.loginOnce.at = NOW; put({ 'JS-MAIN': { in: true, at: NOW - 60e3 } });
  x = await tryLogin(); ok(x.e && cl.goto === 2 && cdb.store['app_settings/aladin_login'].once.id === 'oabc2', '한국 23시 → 시도 0 · 시험권 안 씀');

  console.log('③ 코드 지킴');
  ok(/J\.loginOnce = d\.loginOnce/.test(CLD) && /J\.cloudLogin = d\.cloudLogin === true;/.test(CLD), 'cjobs: 시험권 읽기 · cloudLogin 기본 끔 그대로');
  ok(/if \(q\.egress\)/.test(CLD) && !/q\.egress[^\n]{0,400}login\(/.test(CLD), '진단 egress = 주소 읽기만(로그인 안 부름)');
  ok(/data-alg-once="1" data-arm=/.test(APP) && /\[data-alg-once\][^\n]*isAdminDevice\(\)[^\n]*armOk\(b\)/.test(APP), '웹앱: 관리자 기기 · 두 번 누르기');
  const fnS = APP.slice(APP.indexOf('function algOnceHtml('), APP.indexOf('async function algHoldSet(')); ok(fnS.length > 100 && !/\b(alert|confirm|prompt)\(/.test(fnS) && /doc\('cloud_jobs'\)\.set\(\{ loginOnce:/.test(fnS), '웹앱: cloud_jobs.loginOnce만 씀 · 팝업 없음');
  ok(/bash -s new/.test(fnS) && !/LOGGER|로거/.test(fnS), '웹앱: 새 주소 한 줄 · 로거 언급 없음(헌장 제5조)');
  { const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const algT = (ms) => (ms ? 'T' + ms : '—');
    const html = new Function('esc', 'algT', fnS.slice(fnS.indexOf('function algOnceHtml('), fnS.indexOf('async function algOnceSet(')) + '; return algOnceHtml;')(esc, algT);
    const h0 = html({ net: { cloud: '8.230' } }, KST11); ok(/지금 클라우드 망 8\.230/.test(h0) && /data-alg-once="1"/.test(h0) && !/마지막 시험/.test(h0), '칸 그림: 시험 전');
    const h1 = html({ net: { cloud: '8.230' }, once: { id: 'o1', result: '42FB', doneAt: 5, ip: '8.230.4.53', code: '42FB6013-7046' } }, KST11); ok(/마지막 시험: <b>🚫 42FB/.test(h1) && /나간 주소 8\.230\.4\.53/.test(h1), '칸 그림: 결과 보임');
    let lt = 0, gt = 0; for (const ch of h1) { if (ch === '<') lt++; if (ch === '>') gt++; } ok(lt === gt, '칸 그림: 꺾쇠 짝 맞음'); }
  console.log(bad ? `❌ tIP1_1113 실패 ${bad}` : '✓ tIP1_1113 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 실패', e); process.exit(1); });
