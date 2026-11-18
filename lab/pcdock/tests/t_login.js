/* t_login — (0.1.10 · 정범님 11/18 I-1118-1208·I-1118-1259 · 리드 결정 F61) 🔐 ③으로 띄운 크롬 창이 알라딘 로그인 페이지면
 *  크롬 비밀번호 관리자가 채운 뒤 「로그인」 단추만 누름 · 안 되면 「크롬 창 로그인 필요」 · 로그인 값은 이 도우미가 전혀 다루지 않음
 * 실행: node lab/pcdock/tests/t_login.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 400) : '')); } };
const DIR = path.join(__dirname, '..'); const rd = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
function start(extraEnv) { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockl-')); const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), RN_PCDOCK_COL2: D, ...(extraEnv || {}) };
  const p = cp.spawn(process.execPath, [path.join(DIR, 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 10000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1], env }); } }); }); }
function req(port, method, p, body, hdr) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', ...(hdr === undefined ? { 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port } : hdr), ...(data ? { 'content-length': data.length } : {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j, b, h: s.headers }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message, h: {} })); if (data) r.write(data); r.end(); }); }
const fakeLog = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); } catch (e) { return []; } };

console.log('① 설정 — 켜고 끄기·단추 누르기·기다리는 초(약속 79) · 비밀값 칸이 아님');
{ const SET = require('../settings.js'); const d = SET.defaults();
  ok(d.login && d.login.on === true && d.login.click === true && d.login.waitSec === 5 && d.login.checkSec === 8, '기본 — 켬 · 단추 누름 · 채우기 5초 기다림 · 누른 뒤 8초에 다시 봄', d.login);
  ok(!Object.keys(d.login).some((k) => SET.SECRET.test(k)) && !SET.SECRET.test('login'), '칸 이름이 비밀값 꼴이 아님(아이디·비밀번호 칸이 없음)');
  const v = SET.validate({ ...d, login: { on: false, click: false, waitSec: 99, checkSec: 0 } }, []); ok(v.cfg.login.on === false && v.cfg.login.click === false && v.cfg.login.waitSec === 30 && v.cfg.login.checkSec === 2, '저장 때 범위 맞춤(기다림 0~30초 · 다시 보기 2~60초)', v.cfg.login);
  const v2 = SET.validate({ ...d, login: undefined }, []); ok(v2.cfg.login.on === true && v2.cfg.login.waitSec === 5, '옛 설정 파일(login 칸 없음)은 기본값으로', v2.cfg.login);
  const v3 = SET.validate({ ...d, login: { on: true, password: 'x' } }, []); ok(!v3.ok && v3.errs.some((e) => /비밀값/.test(e)), '로그인 칸에 비밀값 이름이 오면 저장 거절', v3.errs); }

console.log('② 고르는 창 · 주소 꼴');
{ const LG = require('../login.js');
  ok(['https://www.aladin.co.kr/login/wlogin.aspx?returnurl=x', 'www.aladin.co.kr/login/wlogin_naver.aspx', 'https://www.aladin.co.kr/m/mlogin.aspx'].every(LG.isLoginUrl), '알라딘 로그인 주소(주소창 꼴 · https:// 없이도)');
  ok(!['https://www.aladin.co.kr/scm/wmain.aspx', 'https://readnow.kr/app/', 'https://www.yes24.com/Templates/FTLogin.aspx'].some(LG.isLoginUrl), '로그인 페이지가 아니면 아님(예스24는 이번 일 밖)');
  const A = require('../apps.js'); const G = require('../grid.js'); const SET = require('../settings.js');
  const MONS = [{ id: '\\\\.\\DISPLAY1', b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1040 }, dpi: 96, primary: true }];
  const cfg0 = SET.defaults(); cfg0.place = [{ id: 'a1', app: 'chrome', mon: MONS[0].id, c: 0, r: 0, w: 1, h: 1, name: '크롬', o: { urls: ['https://www.aladin.co.kr/scm/wmain.aspx'] } }, { id: 'a2', app: 'col2', mon: MONS[0].id, c: 1, r: 0, w: 1, h: 1 }, { id: 'a3', app: 'self', mon: MONS[0].id, c: 2, r: 0, w: 1, h: 1 }];
  const cfg = SET.validate(cfg0, MONS).cfg; const plan = A.buildPlan(cfg, MONS, { 'chrome.exe': 'C:\\Chrome\\chrome.exe' }, G, () => true);
  const res = plan.steps.map((s, i) => ({ app: s.app, inst: s.inst, name: s.name, ok: true, h: 7000 + i, title: s.name, helper: s.helper }));
  const W = LG.pickWins(plan.steps, res); ok(plan.steps.length >= 2 && W.length === 1 && W[0].h === 7000 + plan.steps.findIndex((s) => s.app === 'chrome'), '평소 프로필 크롬 창만 — 번외 도우미(자기 프로필)·PC 배치 자신은 뺌', { W, steps: plan.steps.map((s) => [s.app, !!s.self, s.match && s.match.udd]) });
  ok(LG.pickWins(plan.steps, res.map((x) => ({ ...x, ok: false }))).length === 0 && LG.pickWins(plan.steps, res.map((x) => ({ ...x, h: 0 }))).length === 0, '못 띄운 창·창 번호 없는 줄은 안 봄');
  const L = LG.sumUp({ ok: true, rows: [{ h: W[0].h, login: true, clicked: true, still: true, how: '「로그인」 단추를 누름', u: 'www.aladin.co.kr/login/wlogin.aspx?returnurl=abc' }] }, W, '사람');
  ok(L.need.length === 1 && L.done.length === 0 && !/returnurl/.test(JSON.stringify(L)) && /크롬 창 로그인 필요/.test(LG.noticeOf(L)), '누른 뒤에도 로그인 페이지 = 로그인 필요 · 주소는 ? 앞까지', L);
  ok(LG.noticeOf({ ...L, x: Date.now() }) === '', '✕로 닫으면 알림 없음'); }

console.log('③ 안전 — 로그인 값을 읽지도·넣지도 않음(크롬 비밀번호 관리자가 채움)');
{ const ps = rd('pcdock.ps1'); const a = ps.indexOf("'login' {"), b = ps.indexOf('default { Fail'); const LB = ps.slice(a, b);
  ok(a > 0 && b > a && LB.length > 1500, "PowerShell 'login' 갈래가 있음");
  ok(!/SetValue|SendKeys|SendWait|TypeText|Combo|keybd|\[RnDock\]::(?!ClickAt\()|Clipboard|Set-Clipboard/.test(LB), "'login' 갈래는 글자를 치거나 칸에 값을 넣지 않음(쓰는 C#은 ClickAt 하나 — 마우스 누름만)", (LB.match(/SetValue|SendKeys|TypeText|Combo|keybd|\[RnDock\]::\w+|Clipboard/g) || []));
  const fn = (name) => { const i = LB.indexOf('function ' + name + '('); const j = LB.indexOf('\n    function ', i + 1); return LB.slice(i, j > i ? j : undefined); };
  const btn = fn('LgBtn'), url = fn('LgUrl'), val = fn('LgVal');
  ok(btn.length > 200 && !/LgVal|ValuePattern|\.Value\b|TextPattern|GetText/.test(btn), '페이지 안을 도는 LgBtn은 칸의 값을 읽지 않음(종류·단추 이름·자리만)');
  ok(/if \(\$ty -eq \$lgCT::Document\) \{[^}]*\}; continue \}/.test(url) && /LgVal \$el/.test(url), 'LgUrl은 페이지(Document) 안으로 내려가지 않음 — 읽는 값은 페이지 주소·주소창뿐');
  ok(/IsPassword\) \{ return '' \}/.test(val) && (LB.match(/LgVal /g) || []).length === 2, '값 읽기(LgVal)는 비밀번호 칸이면 아예 안 읽고 · 부르는 곳은 주소 두 군데뿐');
  const cs = rd('pcdock-win.cs'); const c0 = cs.indexOf('public static string ClickAt('); const CA = cs.slice(c0, cs.indexOf('\n  static string TitleOf', c0));
  ok(c0 > 0 && /Front\(hv\)/.test(CA) && /GetForegroundWindow\(\) != h/.test(CA) && /x < r\.L/.test(CA) && !/Kb\(|TypeText|Combo/.test(CA), 'C# ClickAt — 창이 맨 앞이고 점이 창 안일 때만 왼쪽 단추 한 번 · 글자 안 침 · 마우스 자리 되돌림');
  const js = rd('login.js') + rd('readnow-pcdock.js'); ok(!/rn-cred|GM_getValue|ProtectedData|\bpw\b|passwd/i.test(js), '도우미(Node)는 로그인 정보를 찾거나 풀지 않음');
  const run = fs.readFileSync(path.join(__dirname, 'run-all.sh'), 'utf8'); ok(/\bt_login\b/.test(run), 'run-all.sh에 t_login');
  const ui = rd('ui.html'); ok(/id="lgCard"[^>]*hidden/.test(ui) && /id="lgX"[^>]*>✕</.test(ui) && /api\('\/api\/loginx'/.test(ui), '이 창 「🔐 크롬 창 로그인 필요」 카드 — 처음엔 숨김 · ✕ 닫기(약속 100)');
  ok(['oLoginOn', 'oLoginClick', 'oLoginWait', 'oLoginCheck', 'oLgGuideX'].every((k) => ui.includes(`id="${k}"`) && ui.includes(`$('#${k}').onchange`)), '설정 — 켜고 끄기·단추 누르기·기다림·다시 보기·안내 접어 둠(약속 79)');
  ok(/chrome:\/\/password-manager\/passwords/.test(ui) && /하나만/.test(ui) && !/localStorage|sessionStorage/.test(ui), '한 번짜리 안내 — 크롬 비밀번호 관리자 · 계정 하나만 · 접어 둠은 설정 칸(브라우저 저장소 안 씀)');
  const bundle = JSON.parse(rd('bundle.json')).files; ok(bundle.includes('login.js'), 'bundle.json에 login.js(새 판 받기가 함께 받음)'); }

(async () => { let S = await start({ FAKE_RUN_H: '1', FAKE_LOGIN: 'need' }); const P = (m, p, b, h) => req(S.port, m, p, b, h);
  try {
    console.log('④ ③ 실행·배치 뒤 — 평소 크롬 창만 PowerShell 로그인 확인에 넘김');
    const st = (await P('GET', '/api/state')).j; const cfg = JSON.parse(JSON.stringify(st.cfg));
    cfg.place = [{ id: 'a1', app: 'chrome', mon: '\\\\.\\DISPLAY1', c: 0, r: 0, w: 2, h: 3, name: '알라딘', o: { urls: ['https://www.aladin.co.kr/scm/wmain.aspx'] } }, { id: 'a2', app: 'kakao', mon: '\\\\.\\DISPLAY2', c: 4, r: 2, w: 1, h: 1 }, { id: 'a3', app: 'col2', mon: '\\\\.\\DISPLAY2', c: 0, r: 0, w: 1, h: 1 }];
    let r = await P('POST', '/api/save', { cfg }); ok(r.j && r.j.ok && r.j.cfg.login.on === true, '저장 — 로그인 칸이 살아남음', r.j && (r.j.errs || r.j.cfg.login));
    r = await P('POST', '/api/run', {}); const L1 = fakeLog(S.D); const runIn = L1.filter((x) => x.act === 'run').pop(); const lg = L1.filter((x) => x.act === 'login').pop();
    const chromeIdx = runIn.input.steps.findIndex((s) => s.app === 'chrome');
    ok(lg && lg.input.wins.length === 1 && lg.input.wins[0].h === 5000 + chromeIdx && Object.keys(lg.input.wins[0]).join() === 'h', '넘긴 창 = 평소 크롬 하나(창 번호만) — 카카오톡·번외 도우미 창은 안 넘김', lg && lg.input);
    ok(lg && lg.input.pat === require('../login.js').PAT && lg.input.waitSec === 5 && lg.input.checkSec === 8 && lg.input.click === true, '주소 꼴·기다림·다시 보기·누르기 설정이 넘어감', lg && lg.input);
    ok(lg && !/pass|비밀번호|cred|\bid"\s*:/i.test(JSON.stringify(lg.input)), 'PowerShell에 넘기는 것에 로그인 값이 없음', lg && lg.input);
    ok(r.j && r.j.login && r.j.login.need === 1, '③ 결과에 「로그인 필요 1」', r.j && r.j.login);

    console.log('⑤ 웹앱이 읽는 GET /api/login — 웹앱 출처에만 CORS·사설망 머리글');
    r = await P('GET', '/api/login', undefined, { origin: 'https://readnow.kr' });
    ok(r.code === 200 && r.h['access-control-allow-origin'] === 'https://readnow.kr' && r.h['access-control-allow-private-network'] === 'true' && /Origin/.test(r.h.vary || ''), 'readnow.kr — 허용 머리글', r.h);
    ok(r.j && r.j.need.length === 1 && r.j.need[0].name === '알라딘' && /로그인/.test(r.j.need[0].how) && /크롬 창 로그인 필요/.test(r.j.note), '「크롬 창 로그인 필요」 — 창 이름·까닭', r.j);
    ok(r.j && Object.keys(r.j.need[0]).sort().join() === 'how,name,t', '돌려주는 칸은 이름·제목·까닭뿐(주소·값 없음)', r.j && r.j.need[0]);
    r = await P('GET', '/api/login', undefined, { origin: 'https://jerrycson.github.io' }); ok(r.code === 200 && r.h['access-control-allow-origin'] === 'https://jerrycson.github.io', 'jerrycson.github.io(웹앱 예비 주소)도');
    r = await P('GET', '/api/login', undefined, { origin: 'https://evil.example' }); ok(r.code === 403 && !r.h['access-control-allow-origin'] && !r.h['access-control-allow-private-network'], '다른 웹 페이지 — 403 · 머리글 없음', [r.code, r.h]);
    r = await P('OPTIONS', '/api/login', undefined, { origin: 'https://readnow.kr', 'access-control-request-method': 'GET', 'access-control-request-private-network': 'true' }); ok(r.code === 204 && r.h['access-control-allow-private-network'] === 'true' && r.h['access-control-allow-origin'] === 'https://readnow.kr', '사전 요청(OPTIONS) — 204 · 사설망 허용', [r.code, r.h]);
    r = await P('OPTIONS', '/api/login', undefined, { origin: 'https://evil.example', 'access-control-request-method': 'GET' }); ok(r.code === 403 && !r.h['access-control-allow-origin'], '다른 출처의 사전 요청 — 403', [r.code, r.h]);
    r = await P('GET', '/api/login', undefined, { origin: 'https://readnow.kr', host: 'evil.example:' + S.port }); ok(r.code === 403, '다른 이름(Host)으로 열면 403');
    r = await P('POST', '/api/login', {}, { origin: 'https://readnow.kr' }); ok(r.code === 405, '웹앱은 읽기만(POST 405)');
    r = await P('GET', '/api/diag', undefined, {}); ok(r.j && r.j.login && r.j.login.need === 1 && r.j.login.seen === 1 && /로그인/.test(r.j.login.how), '진단(dock.login) — 본 창·로그인 필요 수·까닭', r.j && r.j.login);
    r = await P('GET', '/api/state'); ok(r.j && r.j.login && r.j.login.need.length === 1, '이 창(/api/state)에도 login', r.j && r.j.login);

    console.log('⑥ ✕ 닫기(약속 100) · 끄기 · 로그인 됨');
    r = await P('POST', '/api/loginx', {}); r = await P('GET', '/api/login', undefined, { origin: 'https://readnow.kr' }); ok(r.j && r.j.need.length === 0 && r.j.x > 0 && r.j.note === '', '✕ 닫기 뒤 — 알림 없음(다음 ③ 때 다시 봄)', r.j);
    r = await P('POST', '/api/loginx', {}, { origin: 'https://readnow.kr' }); ok(r.code === 403, '다른 출처는 닫기도 못 함');
    cfg.login = { on: false }; r = await P('POST', '/api/save', { cfg }); const nBefore = fakeLog(S.D).filter((x) => x.act === 'login').length; r = await P('POST', '/api/run', {});
    ok(fakeLog(S.D).filter((x) => x.act === 'login').length === nBefore, '설정에서 끄면 로그인 확인을 안 함');
    cfg.login = { on: true, click: false, waitSec: 3, checkSec: 4 }; r = await P('POST', '/api/save', { cfg }); r = await P('POST', '/api/run', {}); const lg2 = fakeLog(S.D).filter((x) => x.act === 'login').pop();
    ok(lg2 && lg2.input.click === false && lg2.input.waitSec === 3 && lg2.input.checkSec === 4, '단추 누르기를 끄면 알림만(누르지 않음) · 초 설정이 넘어감', lg2 && lg2.input);
    S.p.kill(); await new Promise((z) => setTimeout(z, 300)); const D0 = S.D; S = await start({ RN_PCDOCK_HOME: D0, FAKE_RUN_H: '1', FAKE_LOGIN: 'ok' }); S.D = D0;
    r = await P('GET', '/api/login', undefined, { origin: 'https://readnow.kr' }); ok(r.j && r.j.at > 0, '다시 켜도 마지막 로그인 결과가 남음(login.json)', r.j);
    cfg.login = { on: true }; r = await P('POST', '/api/save', { cfg }); r = await P('POST', '/api/run', {});
    r = await P('GET', '/api/login', undefined, { origin: 'https://readnow.kr' }); ok(r.j && r.j.need.length === 0 && r.j.done === 1, '단추를 눌러 넘어가면 — 로그인함 1 · 알림 없음', r.j);
  } finally { S.p.kill(); try { fs.rmSync(S.D, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `✗ t_login ${bad}/${n} 실패` : `✓ t_login ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
