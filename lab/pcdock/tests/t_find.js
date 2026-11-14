/* t_find — (0.1.7 · 정범님 11/14 16:29 「카카오톡은 열리지도 않아 · 목록에 리드나우 PC 배치도 추가해줘」)
 *  ① 실행 파일 스스로 찾기: 떠 있는 프로세스 → 바로 가기 → 레지스트리 → 흔한 자리 → 시작 메뉴 앱 차례 · 어디서 찾았나·찾아본 자리가 진단에
 *     (PowerShell은 이 상자에 없어서 증거 모으기는 글자로 보고, 고르기(apps.js pickExe)와 서버 흐름은 가짜 PowerShell 증거로 돌림)
 *  ② 「리드나우 PC 배치」 자기 창: 목록 한 줄 · 빈 작은 칸에 처음 한 번 · 한 곳만 · ③ 때 자리만(새로 안 띄움 · 먼저 닫기에서 빠짐)
 * 실행: node lab/pcdock/tests/t_find.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 600) : '')); } };
const R = path.join(__dirname, '..'); const A = require('../apps.js'); const G = require('../grid.js'); const SET = require('../settings.js');
const KP = 'D:\\Apps\\Kakao\\KakaoTalk\\KakaoTalk.exe';
const H = A.findHints(SET.defaults().apps).find((h) => h.key === 'KakaoTalk.exe');

console.log('① 고르기 차례(apps.js pickExe)');
{ const ev = { c: [{ s: 'lnk', p: 'C:\\L\\KakaoTalk.exe', ok: true, n: '카카오톡' }, { s: 'proc', p: KP, ok: true, n: '' }, { s: 'reg', p: 'C:\\R\\KakaoTalk.exe', ok: true, n: '카카오톡' }], look: {} };
  const k = A.pickExe(H, ev); ok(k.p === KP && /떠 있는 프로세스/.test(k.from) && !k.tried, '① 떠 있는 프로세스 경로가 가장 먼저', k); }
{ const k = A.pickExe(H, { c: [{ s: 'lnk', p: 'C:\\Old\\KakaoTalk.exe', ok: false, n: '카카오톡 (옛)' }, { s: 'lnk', p: 'C:\\Tools\\Updater.exe', ok: true, n: '카카오톡 업데이트' }, { s: 'lnk', p: KP, ok: true, n: '카카오톡' }, { s: 'common', p: 'C:\\C\\KakaoTalk.exe', ok: true }] });
  ok(k.p === KP && /바로 가기 '카카오톡'/.test(k.from), '② 바로 가기 — 파일 없는 대상·이름이 다른 실행 파일(업데이트 도구)은 건너뛰고 KakaoTalk.exe', k); }
{ const k = A.pickExe(H, { c: [{ s: 'reg', p: 'D:\\Apps\\Kakao\\KakaoTalk\\uninstall.exe', ok: true, n: '카카오톡' }, { s: 'reg', p: KP, ok: true, n: '카카오톡' }, { s: 'common', p: 'C:\\C\\KakaoTalk.exe', ok: true }] });
  ok(k.p === KP && /레지스트리/.test(k.from), '③ 레지스트리 설치 정보(지우기 도구가 아닌 KakaoTalk.exe)가 흔한 자리보다 먼저', k); }
{ const k = A.pickExe(H, { c: [{ s: 'common', p: 'C:\\Program Files (x86)\\Kakao\\KakaoTalk\\KakaoTalk.exe', ok: true }] }); ok(/Program Files \(x86\)/.test(k.p) && /흔한 자리/.test(k.from), '④ 흔한 자리', k); }
{ const k = A.pickExe(H, { c: [{ s: 'start', p: 'shell:AppsFolder\\KakaoCorp.KakaoTalk_abcd!App', ok: true, n: '카카오톡' }] }); ok(/^shell:AppsFolder/.test(k.p) && /시작 메뉴 앱/.test(k.from), '⑤ 시작 메뉴 앱(스토어 앱 → shell:AppsFolder)', k); }
{ const k = A.pickExe(H, { c: [{ s: 'common', p: 'C:\\X\\KakaoTalk.exe', ok: false }, { s: 'lnk', p: 'C:\\Old\\KakaoTalk.exe', ok: false, n: '카카오톡' }], look: { proc: 'KakaoTalk', lnk: 40, reg: 210, common: 7, start: 90 } });
  ok(!k.p && /떠 있는 프로세스: 'KakaoTalk' 안 떠 있음/.test(k.tried) && /바로 가기: 40곳 봄 · 맞지 않음 C:\\Old\\KakaoTalk\.exe\(파일 없음\)/.test(k.tried) && /레지스트리: 210곳/.test(k.tried) && /흔한 자리: 7곳/.test(k.tried) && /시작 메뉴 앱: 90곳/.test(k.tried), '못 찾으면 찾아본 자리 다섯 갈래와 맞지 않은 후보(파일 없음)를 글로', k.tried); }

console.log('② 단서 · 실행 계획');
{ ok(H.start.includes('카카오톡') && H.drv[0] === 'Kakao\\KakaoTalk\\KakaoTalk.exe' && H.uninst.includes('카카오톡') && H.lnk.includes('KakaoTalk'), '카카오톡 단서 — 시작 메뉴 앱 이름 · 드라이브마다 자리 · 설치 정보 · 바로 가기');
  const apps = SET.defaults().apps; apps.find((a) => a.id === 'kakao').exe = 'C:\\Gone\\KakaoTalk.exe'; apps.push({ id: 'exe1', kind: 'exe', name: '도구', icon: '🧩', exe: 'E:\\Tools\\MyTool.exe', file: '' });
  const hs = A.findHints(apps); const hk = hs.find((h) => h.key === 'KakaoTalk.exe'); const hu = hs.find((h) => h.key === 'exe1');
  ok(hk && hk.given === 'C:\\Gone\\KakaoTalk.exe', '설정에 경로가 있어도 단서를 넘김(given — 없어졌으면 다시 찾게)', hk);
  ok(hu && hu.exe === 'MyTool.exe' && hu.lnk[0] === 'MyTool' && hu.start[0] === 'MyTool', '사람이 더한 프로그램도 실행 파일 이름으로 같은 찾기(제41조 — 같은 길을 씀)', hu); }
const MONS = [{ id: 'D1', primary: true, b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1040 }, dpi: 96 }, { id: 'D2', primary: false, b: { x: 1920, y: 0, w: 2560, h: 1440 }, wa: { x: 1920, y: 0, w: 2560, h: 1440 }, dpi: 96 }];
function cfgWith(place, extra) { const c = SET.defaults(); c.selfAdded = true; c.place = place; Object.assign(c, extra || {}); return SET.validate(c, MONS).cfg; }
{ const c = cfgWith([{ id: 'p1', app: 'kakao', o: {}, mon: 'D1', c: 3, r: 2, w: 1, h: 1 }]); c.apps.find((a) => a.id === 'kakao').exe = 'C:\\Gone\\KakaoTalk.exe';
  const miss = (p) => p !== 'C:\\Gone\\KakaoTalk.exe';
  let P = A.buildPlan(c, MONS, { 'KakaoTalk.exe': KP }, G, miss); let s = P.steps[0];
  ok(s && s.launch.file === KP && s.src === 'auto-given-missing' && s.exeKey === 'KakaoTalk.exe' && s.match.procs[0] === 'KakaoTalk' && s.match.slow === 30, '설정 경로에 파일이 없으면 스스로 찾은 경로로 켬(사람이 넣은 값은 그대로) · 늦게 뜨면 30초까지', s);
  ok(c.apps.find((a) => a.id === 'kakao').exe === 'C:\\Gone\\KakaoTalk.exe', '설정 값은 덮지 않음(헌장 제7조)');
  P = A.buildPlan(c, MONS, {}, G, miss); ok(!P.steps.length && P.skipped[0].key === 'KakaoTalk.exe' && /설정 경로 C:\\Gone\\KakaoTalk\.exe 에 파일이 없음/.test(P.skipped[0].why), '찾지도 못하면 건너뜀 — 설정 경로에 파일이 없다는 까닭 + 찾기 열쇠(진단에 찾아본 자리를 붙이게)', P.skipped);
  P = A.buildPlan(c, MONS, { 'KakaoTalk.exe': 'shell:AppsFolder\\KakaoCorp.KakaoTalk_abcd!App' }, G, miss); s = P.steps[0];
  ok(s && s.launch.file === 'explorer.exe' && s.launch.args[0] === 'shell:AppsFolder\\KakaoCorp.KakaoTalk_abcd!App' && s.match.procs[0] === 'KakaoTalk', '시작 메뉴 앱(스토어)은 탐색기로 켜고 KakaoTalk 창을 집음', s); }

console.log('③ 「리드나우 PC 배치」 자기 창');
{ const v = SET.validate(SET.defaults(), MONS); const sp = v.cfg.place.filter((p) => p.app === 'self');
  ok(v.ok && v.cfg.apps.some((a) => a.kind === 'self' && a.name === '리드나우 PC 배치') && sp.length === 1 && v.cfg.selfAdded && v.selfNew, '처음엔 목록에 한 줄 + 빈 칸에 하나', sp);
  const p = sp[0]; const rc = G.cellRect(MONS.find((m) => m.id === p.mon), G.gridOf(MONS.find((m) => m.id === p.mon), 'auto'), p.c, p.r, p.w, p.h);
  ok(p.mon === 'D2' && p.c === 3 && p.r === 0 && p.w === 1 && p.h === 1 && rc.w >= 300 && rc.h >= 380, '기본 칸 = 비어 있는 곳 중 작은 곳(작은 창 340×470이 들어갈 만큼 — 1920×1080은 한 칸이 낮아 1×2(480×693) · 2560×1440 한 칸 640×480이 더 작음 · 오른쪽 위)', [p, rc]); }
{ const c = SET.defaults(); c.place = [{ id: 'p1', app: 'chrome', o: {}, mon: 'D1', c: 3, r: 0, w: 1, h: 3 }]; const v = SET.validate(c, MONS); const p = v.cfg.place.find((q) => q.app === 'self');
  ok(p && !(p.mon === 'D1' && p.c === 3), '이미 찬 칸은 피함', p); }
{ const c = SET.defaults(); const v0 = SET.validate(c, []); ok(!v0.cfg.selfAdded && !v0.cfg.place.length, '모니터를 아직 모르면 칸은 다음에(표시 안 함)'); }
{ const v1 = SET.validate(SET.defaults(), MONS).cfg; v1.place = []; const v2 = SET.validate(v1, MONS); ok(!v2.cfg.place.length && v2.cfg.selfAdded, '사람이 자기 창 자리를 빼고 저장하면 다시 안 넣음');
  v1.place = [{ id: 'a', app: 'self', o: {}, mon: 'D1', c: 0, r: 0, w: 1, h: 1 }, { id: 'b', app: 'self', o: {}, mon: 'D2', c: 0, r: 0, w: 1, h: 1 }]; const v3 = SET.validate(v1, MONS);
  ok(v3.cfg.place.length === 1 && v3.cfg.place[0].id === 'a' && v3.warns.some((w) => /한 곳에만/.test(w)), '자기 창은 한 곳만(두 번째는 빼고 알림)', v3); }
{ const c = cfgWith([{ id: 's', app: 'self', o: {}, mon: 'D2', c: 0, r: 0, w: 1, h: 1 }, { id: 'w', app: 'chrome', o: { urls: ['https://readnow.kr/app/'] }, mon: 'D1', c: 0, r: 0, w: 1, h: 1 }]);
  const P = A.buildPlan(c, MONS, { 'chrome.exe': 'C:\\chrome.exe' }, G); const s = P.steps.find((x) => x.app === 'self');
  ok(s && s.self && s.launch === null && s.reuse && s.match.title === '^리드나우 PC 배치$' && s.match.procs[0] === 'chrome' && s.rect.x === 1920, '③ 때 자기 창은 새로 안 띄우고(launch 없음) 떠 있는 창(제목이 꼭 같음)의 자리만', s);
  ok(A.closeProcs([s]).length === 0 && new RegExp(A.KEEP_TITLE).test('리드나우 PC 배치'), '먼저 닫기 대상에서 빠짐 · 제목도 지키는 창 목록에(C# CloseWhy — t_pick이 실제로 돌려 봄)'); }

console.log('④ PowerShell 글자 검사(이 상자엔 PowerShell이 없음)');
{ const ps = fs.readFileSync(path.join(R, 'pcdock.ps1'), 'utf8'); const ev = (ps.split('function FindEv(')[1] || '').split('\n  return @{ c = @($cl)')[0];
  const order = ['Get-Process -Name $baseN', 'Win32_Process -Filter', 'LnkAll', 'App Paths', 'UnAll', "$h.paths", 'Get-PSDrive', 'StartAll'].map((k) => ev.indexOf(k));
  ok(order.every((i) => i > 0) && order.every((i, j) => !j || i > order[j - 1]), '증거 모으기 차례 — 프로세스(+CIM) → 바로 가기 → App Paths → 설치 정보 → 흔한 자리 → 드라이브 → 시작 메뉴 앱', order);
  ok(/User Pinned\\TaskBar/.test(ps) && /Start Menu\\Programs/.test(ps) && /PUBLIC 'Desktop'/.test(ps), '바로 가기 자리 — 시작 메뉴 둘 · 바탕 화면 둘 · 작업 표시줄 고정');
  ok(/InstallLocation/.test(ps) && /UninstallString/.test(ps) && /DisplayIcon/.test(ps) && /shell:AppsFolder\\\$aid/.test(ps) && /7C5A40EF-A0FB-4BFC-874A-C0F2E0B9FA8E/.test(ps), '설치 정보 세 칸 · 스토어 앱 shell:AppsFolder · 시작 메뉴 앱의 알려진 폴더 번호(Program Files (x86))를 실제 경로로');
  ok(/\$out\.ev = \$ev/.test(ps) && /'find' \{ \$ev = @\{\}/.test(ps), "find는 증거(ev)를 돌려줌 — 고르기는 apps.js");
  ok(/\$sp\.self\) \{ \$st\.done = \$true/.test(ps) && /\$_\.done -and \$_\.h \}/.test(ps), '자기 창이 안 떠 있으면 새로 안 띄우고 자리만 기억(다시 놓기는 잡은 창만)');
  ok(/\[int\]\$sp\.match\.slow -gt \$wait/.test(ps) && /if \(\$In\.rect\)/.test(ps), '늦게 뜨는 창은 더 기다림 · fit은 놓은 칸(rect)으로');
  const vars = new Map(); for (const m of ev.matchAll(/\$([A-Za-z_][A-Za-z0-9_]*)/g)) { const k = m[1].toLowerCase(); if (!vars.has(k)) vars.set(k, new Set()); vars.get(k).add(m[1]); }
  const clash = [...vars.values()].filter((S) => S.size > 1).map((S) => [...S]); ok(!clash.length, 'FindEv 안에 대소문자만 다른 변수 이름 없음(PowerShell은 같은 변수로 봄)', clash); }

/* ── 서버(가짜 PowerShell 증거) ── */
function start(extraEnv, pre) { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockf-')); const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755); if (pre) pre(D);
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), ...(extraEnv || {}) };
  const p = cp.spawn(process.execPath, [path.join(R, 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 10000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1] }); } }); }); }
function req(port, method, p, body, hdr) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', ...(hdr === undefined ? { 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port } : hdr), ...(data ? { 'content-length': data.length } : {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j, b }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); if (data) r.write(data); r.end(); }); }
const fakeLog = (D) => { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); } catch (e) { return []; } };
const stop = (S) => { try { S.p.kill(); } catch (e) {} try { fs.rmSync(S.D, { recursive: true, force: true }); } catch (e) {} };
async function layout(S, P) { const st = (await P('GET', '/api/state')).j; const cfg = JSON.parse(JSON.stringify(st.cfg));
  cfg.place = cfg.place.filter((p) => p.app === 'self').concat([{ id: 'k1', app: 'kakao', o: {}, mon: '\\\\.\\DISPLAY2', c: 4, r: 2, w: 1, h: 1 }]); return (await P('POST', '/api/save', { cfg })).j; }

(async () => { let S;
  try {
    console.log('⑤ 서버 — 떠 있는 카카오톡 경로로 찾음 · 처음 켤 때 자기 창 자리');
    S = await start({ FAKE_FIND: 'proc' }); let P = (m, p, b, h) => req(S.port, m, p, b, h);
    let st = (await P('GET', '/api/state')).j; const sp = st.cfg.place.filter((p) => p.app === 'self'); const saved = JSON.parse(fs.readFileSync(path.join(S.D, 'settings.json'), 'utf8'));
    ok(sp.length === 1 && saved.selfAdded === true && saved.place.some((p) => p.app === 'self'), '설정 파일이 없을 때 — 자기 창을 목록·빈 칸에 넣고 저장', sp);
    let r = await P('POST', '/api/find', {}); ok(r.j && r.j.found['KakaoTalk.exe'] === KP && /떠 있는 프로세스/.test(r.j.from['KakaoTalk.exe']) && r.j.icons['KakaoTalk.exe'] && r.j.found['chrome.exe'], '찾기 — 카카오톡 = 떠 있는 프로세스 경로(D: 드라이브) · 아이콘 · 크롬도', r.j);
    const fj = JSON.parse(fs.readFileSync(path.join(S.D, 'found.json'), 'utf8')); ok(fj.found['KakaoTalk.exe'] === KP && fj.from['KakaoTalk.exe'] && !(KP in fj.icons), '찾은 경로·어디서를 found.json에 저장(후보 경로마다 아이콘을 쌓지 않음)', Object.keys(fj.icons));
    r = await layout(S, P); ok(r && r.ok, '카카오톡을 칸에 놓고 저장', r);
    r = await P('POST', '/api/run', {}); const run = fakeLog(S.D).filter((x) => x.act === 'run').pop(); const kk = run.input.steps.find((s) => s.app === 'kakao'); const me = run.input.steps.find((s) => s.app === 'self');
    ok(kk && kk.launch.file === KP && kk.match.slow === 30 && me && me.launch === null && !run.input.closeFirst.procs.includes('chrome'), '③ — 찾은 경로로 켬 · 30초까지 기다림 · 자기 창은 자리만 · 먼저 닫기에 크롬 없음(자기 창만 있을 때)', run.input);
    r = await P('GET', '/api/diag', undefined, {}); const row = r.j.last.rows.find((x) => /카카오톡/.test(x.n));
    ok(row && /떠 있는 프로세스/.test(row.src) && /떠 있는 프로세스/.test(r.j.find.from['KakaoTalk.exe']), '진단 — 카카오톡 줄에 어디서 찾았나(src) · find.from', [row, r.j.find]); stop(S);

    console.log('⑥ 서버 — 어디에도 없으면 찾아본 자리가 진단에');
    S = await start({ FAKE_FIND: 'none' }); P = (m, p, b, h) => req(S.port, m, p, b, h); await layout(S, P);
    r = await P('POST', '/api/run', {}); r = await P('GET', '/api/diag', undefined, {}); const sk = r.j.last.skip.find((x) => /카카오톡/.test(x.n));
    ok(sk && /실행 파일을 못 찾음/.test(sk.why) && /떠 있는 프로세스: 'KakaoTalk' 안 떠 있음/.test(sk.tried) && /바로 가기: 40곳/.test(sk.tried) && /흔한 자리: 4곳/.test(sk.tried), '진단 skip에 찾아본 자리(프로세스·바로 가기·레지스트리·흔한 자리·시작 메뉴 앱)', sk);
    ok(r.j.find.miss['KakaoTalk.exe'] && !r.j.find.err && r.j.find.at > 0, '진단 find.miss · 마지막 찾은 때', r.j.find);
    ok(!/C:\\Users\\u\\/.test(JSON.stringify(r.j)), '진단에 사용자 폴더 이름은 가림(%USERPROFILE%)'); stop(S);

    console.log('⑦ 서버 — 찾아 둔 경로가 없어지면(카카오톡을 다른 자리에 다시 깖) 다시 찾음');
    const OLD = 'C:\\Program Files (x86)\\Kakao\\KakaoTalk\\KakaoTalk.exe';
    S = await start({ FAKE_FIND: 'reg', RN_PCDOCK_MISSING: OLD }, (D) => fs.writeFileSync(path.join(D, 'found.json'), JSON.stringify({ at: Date.now() - 3600e3, found: { 'KakaoTalk.exe': OLD, 'chrome.exe': 'C:\\chrome.exe' }, icons: {}, from: {}, tried: {} })));
    P = (m, p, b, h) => req(S.port, m, p, b, h); await layout(S, P); const nf = fakeLog(S.D).filter((x) => x.act === 'find').length;
    r = await P('POST', '/api/run', {}); const run2 = fakeLog(S.D).filter((x) => x.act === 'run').pop(); const k2 = run2 && run2.input.steps.find((s) => s.app === 'kakao');
    ok(fakeLog(S.D).filter((x) => x.act === 'find').length === nf + 1 && k2 && k2.launch.file === KP, '③ 전에 다시 찾아 레지스트리 설치 정보의 새 경로로 켬', k2);
    r = await P('GET', '/api/diag', undefined, {}); ok(/레지스트리 '카카오톡'/.test(r.j.last.rows.find((x) => /카카오톡/.test(x.n)).src), '진단 src = 레지스트리', r.j.last.rows); stop(S);

    console.log('⑧ 서버 — 스토어 앱(시작 메뉴 앱)만 있을 때');
    S = await start({ FAKE_FIND: 'start' }); P = (m, p, b, h) => req(S.port, m, p, b, h); await layout(S, P); r = await P('POST', '/api/run', {});
    { const k3 = fakeLog(S.D).filter((x) => x.act === 'run').pop().input.steps.find((s) => s.app === 'kakao'); ok(k3 && k3.launch.file === 'explorer.exe' && /^shell:AppsFolder\\KakaoCorp/.test(k3.launch.args[0]), '탐색기 shell:AppsFolder로 켬', k3); }
    stop(S); S = null;
  } catch (e) { ok(false, '시험이 멈춤', e.stack); } finally { if (S) stop(S); }
  console.log(bad ? `✗ t_find ${bad}/${n} 실패` : `✓ t_find ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
