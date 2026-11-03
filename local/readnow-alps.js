/* readnow-alps.js — 리드나우 ALPS(롯데택배) 자동 처리 (정범님 11/02) · readnow-print.js(127.0.0.1:8898)가 불러 씀
 * 하는 일: 웹앱 오늘 출고의 '📦 ALPS 자동 처리'가 보낸 파일(판매완료YYYYMMDD.xlsx)을
 *   ① 로그인 → ② 오늘 목록에서 겹침 검사 → ③ 일괄주문접수(사용자파일 '알라딘')에 올림 → ④ 통합관리 운송장출력에서 이번 주문만 골라 출력
 *   → ⑤ 다시 조회해 운송장번호가 채워졌는지 확인 → ⑥ 운송장 목록을 웹앱에 돌려줌(웹앱이 기존 openInvMatch로 알라딘 송장 입력)
 * 크롬 조종: npm 없이 Node 22 기본 WebSocket으로 DevTools 프로토콜(CDP) · 크롬 프로필은 %USERPROFILE%\ReadNow\alps\chrome(로그인 유지)
 * 인쇄: ALPS 자기 인쇄 길(OZ 웹런처 · 이 PC에 설치된 롯데택배 인쇄 프로그램)을 그대로 쓰고, 미리보기 창의 프린터 이름(printerName)을
 *   설정한 프린터로 미리 넣어 '인쇄 창 없이(silent)' 인쇄 — ALPS가 출력 뒤 스스로 '출력됨' 기록(/pid/pic/invprntafprcss)을 남기므로 실물과 기록이 맞음
 *   (ALPS 미리보기 PIDPIC051U는 크롬 인쇄 창이 아니라 OZ 프로그램(wss://127.0.0.1:36510)이 인쇄함 — 저장 화면 pid-oz-exe.js·ozws.js에서 확인)
 * 로그인 정보: 이 PC 설정 화면(http://127.0.0.1:8898/alps)에서만 받아 Windows DPAPI(이 PC·이 사용자만 풂)로 잠가 cred.dat에만 · 로그·웹앱·GitHub로 보내지 않음
 * 기록: alps.log에는 단계·숫자만(이름·주소·전화·토큰·주소창 값은 쓰지 않음) */
'use strict';
const VERSION = '0.2.6'; // (0.2.6 정범님 11/03) 상자 수는 주문 수가 아니라 받는 사람 수(합포장 기준 01 = 이름·전화·주소)와 견줌 · 다르면 상자마다 줄 수·받는 사람을 보여 주고 물음 · 겹침 검사 단계가 인쇄 프로그램 확인 뒤에도 '완료'로 // (0.2.5 정범님 11/03) ① 인쇄 프로그램(OZ, 이 PC 127.0.0.1:36510) 연결 — 자동 처리용 크롬이 '로컬 네트워크 접근'에 막혀 '설치가 필요합니다'로 멈추던 것: 막는 기능 끄고 허락 · 접수 전에 연결부터 확인(안 되면 아무것도 접수하지 않음) ② ALPS 목록에 이번 주문이 모두 있으면 접수를 건너뛰고 인쇄부터 이어서(일부만 있으면 다시 접수하지 않고 멈춰 물음) · 「이어서 진행」(resume) ③ 인쇄 전 상자 수(합포장) ≠ 주문 수면 멈춰 물음 ④ 처리 기록(성공·실패) hist // (0.2.4 정범님 11/03) 저장한 로그인 정보는 '✓ 저장됨 · 아이디 ab***'로 보이고 다시 묻지 않음(바꿀 때만 「바꾸기」) · 창 위치를 기억(win.txt — 다음에 열 때 그 자리) // (0.2.3 정범님 11/03) 일괄주문접수 '합포장처리'를 늘 켬(체크 · ALPS가 화면을 열 때 해제로 둠 — 손으로 켤 때와 같게 기준 01, 양식이 정한 기준은 그대로) · '타이틀여부'를 늘 '타이틀있음'(Y)으로 맞추고 확인 — 사용자파일 양식을 고르면 ALPS가 '없음'으로 바꿔 제목 줄을 주문으로 읽던 오류(수량(A 타입)에 정수가 아닌 값) · ALPS 업무 오류(BUSINESS_ERROR)는 묻지 않고 그 글로 멈춤
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const ROOT = process.env.RN_ALPS_HOME || path.join(process.env.USERPROFILE || os.homedir(), 'ReadNow', 'alps');
try { fs.mkdirSync(ROOT, { recursive: true }); } catch (e) {}
const F = { cfg: path.join(ROOT, 'config.json'), cred: path.join(ROOT, 'cred.dat'), credMeta: path.join(ROOT, 'cred-meta.json'), win: path.join(ROOT, 'win.txt'), key: path.join(ROOT, 'key.dat'), runs: path.join(ROOT, 'runs.json'), hist: path.join(ROOT, 'hist.json'), lastJob: path.join(ROOT, 'last-job.json'), log: path.join(ROOT, 'alps.log'), up: path.join(ROOT, 'up'), chrome: path.join(ROOT, 'chrome') };
const kst = (d) => new Date((d ? +d : Date.now()) + 9 * 3600e3).toISOString();
const ymdK = () => kst().slice(0, 10).replace(/-/g, '');
const log = (m) => { const line = `${kst().slice(0, 19).replace('T', ' ')} ${m}\n`; try { fs.appendFileSync(F.log, line); } catch (e) {} if (!process.env.RN_ALPS_QUIET) process.stdout.write('[alps] ' + line); };
const rdJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const wrJ = (f, o) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(o, null, 1)); fs.renameSync(t, f); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeUrl = (u) => String(u || '').replace(/[?#].*$/, ''); /* 주소창 값에는 로그인 토큰(token=…)이 붙음 — 기록·화면에는 ?·# 앞만 */

/* ── 설정 (근거 없는 숫자는 모두 설정 · 기본값 근거는 옆 주석) ── */
const CFG_DEF = {
  baseUrl: 'https://partner.alps.llogis.com/', // 정범님이 쓰는 ALPS 주소
  printer: '',                 // 롯데택배 프린터 이름(윈도우 프린터 이름 그대로) — 설정 화면에서 고름
  confirmBeforePrint: false,   // 정범님 지시: 기본 자동(끄면 자동)
  firstOne: true,              // 처음엔 1장만 먼저 인쇄 → 확인 → 나머지 (웹앱에서 매번 고를 수 있음)
  headless: true,              // 화면 없이 · ALPS가 막으면 false(창을 화면 밖에 둔 일반 모드)
  chromePath: '',              // 비우면 Program Files·LOCALAPPDATA에서 찾음
  stepTimeoutSec: 60,          // 근거: 없음(ALPS 화면이 보통 몇 초 안에 뜸) — 설정으로 바꿈
  uploadTimeoutSec: 180,       // 근거: 없음(18건 올림이 수 초) — 설정으로 바꿈
  printTimeoutSec: 600,        // 근거: 없음(ALPS가 10장씩 나눠 인쇄) — 설정으로 바꿈
  humanWaitMin: 15,            // 사람이 번호를 넣거나 '계속'을 누를 때까지 기다리는 시간 · 근거: 없음 — 설정으로 바꿈
  /* (0.2.0) 다른 기기(휴대폰)에서 시작 — 클라우드에 서명한 요청으로 '나에게 맡긴 일' 묻기 */
  cloudUrl: '',                // 웹앱이 이 PC를 허락할 때 넣어 줌(app_settings/main.cloudUrl · 비밀 아님)
  pcName: '',                  // 비우면 윈도우 컴퓨터 이름
  remotePollSec: 45,           // 일이 없을 때 묻는 간격 · 근거: 없음(정범님 '30초~1분') — 설정으로 바꿈
  remoteActiveSec: 3,          // 일하는 동안 진행 보내고 답 받는 간격 · 근거: 없음 — 설정으로 바꿈
};
const cfg = () => ({ ...CFG_DEF, ...rdJ(F.cfg, {}) });
const setCfg = (o) => { if (o && o.win && typeof o.win === 'object') { winSave(o.win); if (Object.keys(o).length === 1) return cfg(); } const c = rdJ(F.cfg, {}); for (const k of Object.keys(CFG_DEF)) if (o && k in o && typeof o[k] === typeof CFG_DEF[k]) c[k] = o[k]; wrJ(F.cfg, c); return cfg(); };

/* ── 로그인 정보 잠금: Windows DPAPI(CurrentUser) · 비밀은 PowerShell 표준 입력으로만(임시 파일·명령줄에 안 씀) ── */
function psStdin(script, input, timeout) { return new Promise((res) => {
  const enc = Buffer.from('[Console]::OutputEncoding=[Text.Encoding]::UTF8\n[Console]::InputEncoding=[Text.Encoding]::UTF8\n' + script, 'utf16le').toString('base64');
  const p = cp.spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], { windowsHide: true });
  let out = '', err = ''; const tm = setTimeout(() => { try { p.kill(); } catch (e) {} }, timeout || 30000);
  p.stdout.on('data', (c) => (out += c)); p.stderr.on('data', (c) => (err += c)); p.on('close', (code) => { clearTimeout(tm); res({ code, out, err }); }); p.on('error', (e) => { clearTimeout(tm); res({ code: -1, out, err: e.message }); });
  p.stdin.end(input || ''); }); }
const TEST_PROTECT = process.platform !== 'win32' && process.env.RN_ALPS_TEST === '1'; /* 리눅스 시험 전용(윈도우에서는 절대 안 씀) */
async function protect(text) { if (TEST_PROTECT) return 'TEST:' + Buffer.from(text).toString('base64');
  const r = await psStdin("Add-Type -AssemblyName System.Security\n$s=[Console]::In.ReadToEnd()\n$b=[Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($s),$null,'CurrentUser')\n[Console]::Out.Write([Convert]::ToBase64String($b))", text);
  if (r.code !== 0 || !r.out.trim()) throw new Error('잠그기 실패(DPAPI): ' + r.err.slice(0, 200)); return r.out.trim(); }
async function unprotect(b64) { if (TEST_PROTECT && /^TEST:/.test(b64)) return Buffer.from(b64.slice(5), 'base64').toString();
  const r = await psStdin("Add-Type -AssemblyName System.Security\n$s=[Console]::In.ReadToEnd().Trim()\n$b=[Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($s),$null,'CurrentUser')\n[Console]::Out.Write([Text.Encoding]::UTF8.GetString($b))", b64);
  if (r.code !== 0) throw new Error('잠금 풀기 실패 — 이 PC·이 윈도우 사용자에서 저장한 것만 풀림'); return r.out; }
async function saveCred(id, pw) { id = String(id || '').trim(); pw = String(pw || ''); if (!id || !pw) throw new Error('아이디·비밀번호를 모두 넣어 주세요');
  const blob = await protect(JSON.stringify({ id, pw })); fs.writeFileSync(F.cred, blob); wrJ(F.credMeta, { idMask: idMask(id), at: kst() }); log('로그인 정보 저장(DPAPI 잠금)'); }
const idMask = (id) => { id = String(id || ''); return id.length <= 2 ? id[0] + '*' : id.slice(0, 2) + '*'.repeat(Math.min(6, id.length - 2)); }; /* 화면 표시용 — 앞 두 글자만(비밀번호는 어디에도 안 보임) */
const winSave = (o) => { const x = Math.round(+o.x), y = Math.round(+o.y); if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 20000 || Math.abs(y) > 20000) return false; fs.writeFileSync(F.win, `${x},${y}`); return true; }; /* 창 위치 — 시작 때 여는 창(open-alps-window.vbs)이 읽음 */
async function loadCred() { if (!fs.existsSync(F.cred)) return null; try { return JSON.parse(await unprotect(fs.readFileSync(F.cred, 'utf8'))); } catch (e) { log('로그인 정보 풀기 실패'); return null; } }
const credInfo = () => ({ saved: fs.existsSync(F.cred), at: fs.existsSync(F.cred) ? kst(fs.statSync(F.cred).mtimeMs).slice(0, 16).replace('T', ' ') : null, idMask: fs.existsSync(F.cred) ? (rdJ(F.credMeta, {}).idMask || null) : null });

/* ── 아주 작은 CDP 손님 (브라우저 하나에 연결 · flatten 세션) ── */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cb = new Map(); this.on = []; ws.onmessage = (ev) => { let m; try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString()); } catch (e) { return; }
    if (m.id && this.cb.has(m.id)) { const { res, rej, tm } = this.cb.get(m.id); this.cb.delete(m.id); clearTimeout(tm); m.error ? rej(new Error(m.error.message + (m.error.data ? ' ' + m.error.data : ''))) : res(m.result); }
    else if (m.method) for (const f of this.on.slice()) { try { f(m.method, m.params || {}, m.sessionId || null); } catch (e) {} } };
    ws.onclose = () => { this.closed = true; for (const { rej, tm } of this.cb.values()) { clearTimeout(tm); rej(new Error('크롬 연결이 끊김')); } this.cb.clear(); }; }
  send(method, params, sessionId, timeoutMs) { if (this.closed) return Promise.reject(new Error('크롬 연결이 끊김')); const id = ++this.id; const msg = { id, method, params: params || {} }; if (sessionId) msg.sessionId = sessionId;
    return new Promise((res, rej) => { const tm = setTimeout(() => { this.cb.delete(id); rej(new Error('크롬 응답 없음: ' + method)); }, timeoutMs || 30000); this.cb.set(id, { res, rej, tm }); this.ws.send(JSON.stringify(msg)); }); }
  static connect(url) { if (typeof WebSocket !== 'function') return Promise.reject(new Error(`Node ${process.version}에는 WebSocket이 없음 — Node 22 이상이 필요(install-print.ps1을 다시 실행하면 올려 줌)`)); return new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(new CDP(ws)); ws.onerror = (e) => rej(new Error('크롬 DevTools 연결 실패')); }); }
}

/* 브라우저: 크롬을 띄우고 모든 탭·창(팝업 포함)·iframe의 실행 맥락을 추적 */
class Browser {
  constructor() { this.sessions = new Map(); /* sid → { targetId, type, url } */ this.frames = new Map(); /* frameId → { url, sid, parentId } */ this.ctx = new Map(); /* `${sid}|${ctxId}` → { sid, id, frameId } */ this.dialogs = []; this.nativeDlg = []; }
  findChrome(c) { if (c.chromePath && fs.existsSync(c.chromePath)) return c.chromePath; const L = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean).map((b) => path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')); return L.find((f) => fs.existsSync(f)) || null; }
  async launch(c) { const exe = this.findChrome(c); if (!exe) throw new Error('크롬을 못 찾음 — 설정의 chromePath에 chrome.exe 위치를 넣어 주세요');
    fs.mkdirSync(F.chrome, { recursive: true }); const portFile = path.join(F.chrome, 'DevToolsActivePort'); try { fs.unlinkSync(portFile); } catch (e) {}
    const args = [c.headless ? '--headless=new' : '--window-position=-32000,-32000', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${F.chrome}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--mute-audio', '--window-size=1600,1000',
      '--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process,LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests', /* (0.2.5) ALPS(공개 사이트)가 이 PC 인쇄 프로그램(OZ · 127.0.0.1:36510)에 붙는 것을 새 크롬이 '로컬 네트워크 접근'으로 막아 '설치가 필요합니다'가 떴음 */ /* ALPS 바깥 틀(partner)과 안쪽 틀(pid:18210)이 출처가 달라 — 한 프로세스에 두어 iframe 맥락을 바로 씀(그래도 따로 뜨면 자동 붙기로 받음) */
      '--disable-popup-blocking', 'about:blank'];
    if (process.env.RN_ALPS_NOSANDBOX) args.unshift('--no-sandbox');
    this.proc = cp.spawn(exe, args, { stdio: 'ignore', windowsHide: true }); this.proc.on('exit', () => { this.dead = true; });
    let ws = null; for (let i = 0; i < 100 && !ws; i++) { await sleep(200); if (this.dead) throw new Error('크롬이 바로 꺼짐(이미 같은 프로필 크롬이 떠 있으면 닫아 주세요)'); try { const [port, p2] = fs.readFileSync(portFile, 'utf8').split('\n'); if (port && p2) ws = `ws://127.0.0.1:${port.trim()}${p2.trim()}`; } catch (e) {} }
    if (!ws) throw new Error('크롬 DevTools 주소를 못 받음'); this.cdp = await CDP.connect(ws); this.cdp.on.push((m, p, sid) => this.onEvent(m, p, sid)); for (const origin of ['https://partner.alps.llogis.com', 'https://pid.alps.llogis.com', 'https://pid.alps.llogis.com:18210', 'https://alps.llogis.com', 'https://rpt.alps.llogis.com:18390']) for (const perm of ['localNetworkAccess', 'localNetwork', 'loopbackNetwork']) { try { await this.cdp.send('Browser.grantPermissions', { origin, permissions: [perm] }); } catch (e) {} } /* (0.2.5) 로컬 네트워크 접근 허락(크롬 판마다 이름이 달라 셋 다 · 없는 이름은 그냥 넘어감) */
    await this.cdp.send('Target.setDiscoverTargets', { discover: true });
    const { targetInfos } = await this.cdp.send('Target.getTargets'); for (const t of targetInfos) if (t.type === 'page') await this.attach(t.targetId);
    return this; }
  async attach(targetId) { if ([...this.sessions.values()].some((s) => s.targetId === targetId)) return; try { const { sessionId } = await this.cdp.send('Target.attachToTarget', { targetId, flatten: true }); await this.prep(sessionId, targetId); } catch (e) {} }
  async prep(sid, targetId, type) { this.sessions.set(sid, { targetId, type: type || 'page' });
    await Promise.all([this.cdp.send('Page.enable', {}, sid).catch(() => {}), this.cdp.send('Runtime.enable', {}, sid).catch(() => {})]);
    await this.cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sid).catch(() => {});
    try { const { frameTree } = await this.cdp.send('Page.getFrameTree', {}, sid); const walk = (n) => { this.frames.set(n.frame.id, { url: n.frame.url, sid, parentId: n.frame.parentId || null }); (n.childFrames || []).forEach(walk); }; walk(frameTree); } catch (e) {} }
  onEvent(m, p, sid) {
    if (m === 'Target.targetCreated' && p.targetInfo.type === 'page') this.attach(p.targetInfo.targetId);
    else if (m === 'Target.attachedToTarget' && sid) this.prep(p.sessionId, p.targetInfo.targetId, p.targetInfo.type); /* iframe이 따로 뜬 경우(OOPIF) */
    else if (m === 'Target.detachedFromTarget') { this.sessions.delete(p.sessionId); for (const [k, c] of this.ctx) if (c.sid === p.sessionId) this.ctx.delete(k); }
    else if (m === 'Page.frameNavigated') this.frames.set(p.frame.id, { url: p.frame.url, sid, parentId: p.frame.parentId || null });
    else if (m === 'Page.frameAttached') { if (!this.frames.has(p.frameId)) this.frames.set(p.frameId, { url: '', sid, parentId: p.parentFrameId }); }
    else if (m === 'Page.frameDetached') this.frames.delete(p.frameId);
    else if (m === 'Runtime.executionContextCreated') { const a = p.context.auxData || {}; if (a.isDefault !== false && a.type !== 'isolated') this.ctx.set(sid + '|' + p.context.id, { sid, id: p.context.id, frameId: a.frameId }); }
    else if (m === 'Runtime.executionContextDestroyed') this.ctx.delete(sid + '|' + p.executionContextId);
    else if (m === 'Runtime.executionContextsCleared') { for (const [k, c] of this.ctx) if (c.sid === sid) this.ctx.delete(k); }
    else if (m === 'Page.javascriptDialogOpening') { /* 브라우저 기본 창(alert/confirm): alert는 확인 · confirm은 '취소'(예: OZ 설치 묻기 → 내려받기를 막음)하고 사람에게 보임 */
      const msg = String(p.message || '').slice(0, 300); this.nativeDlg.push({ type: p.type, msg, at: Date.now() }); log(`브라우저 창(${p.type}) — ${p.type === 'alert' ? '확인' : '취소'}`);
      this.cdp.send('Page.handleJavaScriptDialog', { accept: p.type === 'alert' }, sid).catch(() => {}); } }
  frameBy(re) { const L = [...this.frames.entries()].filter(([, f]) => re.test(f.url)); return L.length ? L[L.length - 1][0] : null; }
  ctxOf(frameId) { for (const c of this.ctx.values()) if (c.frameId === frameId) return c; return null; }
  async eval(frameRe, fnSrc, arg, opt) { const o = opt || {}; const t0 = Date.now(); const lim = o.wait == null ? 0 : o.wait; let lastErr = null;
    for (;;) { const fid = typeof frameRe === 'string' ? frameRe : this.frameBy(frameRe); const c = fid && this.ctxOf(fid);
      if (c) { try { const r = await this.cdp.send('Runtime.evaluate', { expression: `(${fnSrc})(${JSON.stringify(arg === undefined ? null : arg)})`, contextId: c.id, returnByValue: !o.handle, awaitPromise: true, userGesture: true }, c.sid, (o.timeoutMs || 60000) + 5000);
        if (r.exceptionDetails) { const d = r.exceptionDetails; throw new Error('화면 스크립트 오류: ' + ((d.exception && d.exception.description) || d.text || '').split('\n')[0].slice(0, 200)); } return o.handle ? { objectId: r.result.objectId, sid: c.sid } : r.result.value; }
      catch (e) { lastErr = e; if (/화면 스크립트 오류/.test(e.message) && !o.retryErr) throw e; } }
      if (Date.now() - t0 >= lim) throw lastErr || new Error('화면을 못 찾음: ' + String(frameRe)); await sleep(300); } }
  async close() { try { await this.cdp.send('Browser.close'); } catch (e) {} await sleep(500); try { this.proc && !this.dead && this.proc.kill(); } catch (e) {} }
}

/* ── 화면 안에서 돌릴 작은 함수들 (ALPS 저장 화면 PIDCUS014U·PIDPIC002U·PIDPIC051U에서 찾은 이름) ── */
const PG = {
  /* ALPS 안내창: jquery.msgBox — div.msgBox · .msgBoxTitle · .msgBoxContent span · input.msgButton(value 확인/취소) */
  dialogs: `() => [...document.querySelectorAll('div.msgBox')].filter((d) => d.offsetParent !== null || getComputedStyle(d).display !== 'none').map((d) => ({ title: (d.querySelector('.msgBoxTitle') || {}).textContent || '', text: ((d.querySelector('[class^=msgBoxContent] span') || d.querySelector('[class^=msgBoxContent]') || {}).innerText || '').trim(), buttons: [...d.querySelectorAll('input.msgButton')].map((b) => b.value) }))`,
  press: `(v) => { const d = [...document.querySelectorAll('div.msgBox')].filter((d) => d.offsetParent !== null || getComputedStyle(d).display !== 'none').pop(); if (!d) return false; const b = [...d.querySelectorAll('input.msgButton')].find((b) => b.value === v); if (!b) return false; b.click(); return true; }`,
  login: `(a) => { const vis = (e) => e && e.offsetParent !== null && !e.disabled && !e.readOnly; const pw = [...document.querySelectorAll('input[type=password]')].filter(vis); /* (0.2.2) 로그인 화면 주소(/main/pages/sec/authentication)에도 /main/이 있어 '로그인됨'으로 잘못 보던 것 — 메인 틀(/main/pages/layout/)일 때만 로그인됨 */ const onAuth = /\\/sec\\/authentication/.test(location.pathname) || !!document.getElementById('principal'); if (!a) return { page: !onAuth && /\\/main\\/pages\\/layout\\//.test(location.pathname) ? 'main' : onAuth || pw.length ? 'login' : 'other', otp: [...document.querySelectorAll('input')].some((i) => vis(i) && /otp|인증/i.test([i.id, i.name, i.placeholder, i.title].join(' '))), pwchg: /비밀번호[^\\n]{0,12}변경/.test(document.body ? document.body.innerText : '') && pw.length > 1 };
    const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const clickBtn = (re, near) => { const L = [...document.querySelectorAll('button, input[type=button], input[type=submit], a, i-button')].filter((b) => b.offsetParent !== null && re.test((b.value || b.innerText || b.getAttribute('text') || '').trim())); const b = L[0]; if (b) { b.click(); return true; } if (near && near.form) { near.form.requestSubmit ? near.form.requestSubmit() : near.form.submit(); return true; } return false; };
    if (a.otp) { const i = [...document.querySelectorAll('input')].find((i) => vis(i) && /otp|인증/i.test([i.id, i.name, i.placeholder, i.title].join(' '))); if (!i) return { ok: false, why: '인증번호 칸을 못 찾음' }; set(i, a.otp); return { ok: clickBtn(/^(확인|인증|로그인|login)$/i, i) }; }
    { const P = document.getElementById('principal'), C = document.getElementById('credential'); if (P && C) { /* (0.2.2) ALPS 로그인 화면: i-edit(id principal·credential) 값 넣고 ALPS 자기 로그인 함수(onclick_btn_authenticate) */ try { P.value = a.id; } catch (e) {} try { C.value = a.pw; } catch (e) {} const pi = P.querySelector('input'), ci = C.querySelector('input'); if (pi) set(pi, a.id); if (ci) set(ci, a.pw);
        if (typeof window.onclick_btn_authenticate === 'function') { window.onclick_btn_authenticate(); return { ok: true, how: 'alps' }; } const b = document.getElementById('btn-login'); if (b) { b.click(); return { ok: true, how: 'btn' }; } return { ok: false, why: 'ALPS 로그인 단추를 못 찾음' }; } }
    if (!pw.length) return { ok: false, why: '비밀번호 칸이 없음' }; const ins = [...document.querySelectorAll('input')].filter((i) => vis(i) && /^(text|email|tel|)$/i.test(i.type));
    const idEl = ins.find((i) => /id|user|usr|login/i.test(i.id + ' ' + i.name)) || ins.find((i) => i.compareDocumentPosition(pw[0]) & 4) || ins[0];
    if (!idEl) return { ok: false, why: '아이디 칸을 못 찾음' }; if (!idEl.value || idEl.value !== a.id) set(idEl, a.id); if (!pw[0].value || a.pw) set(pw[0], a.pw); return { ok: clickBtn(/^(로그인|login)$/i, pw[0]) }; }`,
  openMenu: `async (o) => { const name = o.name, code = o.code, until = Date.now() + (o.ms || 60000); const N = (t) => String(t || '').replace(/\\s+/g, ''); let tries = 0;
    for (;;) { tries++; if (window.jQuery && jQuery.gfnForm) { const L = [...document.querySelectorAll('a.menuLeaf')].filter((a) => !a.classList.contains('fav'));
        let a = L.find((x) => N(x.textContent) === N(name)); if (!a && code) a = L.find((x) => { const m = jQuery(x).data('menu'); return m && String(m.pgmUrl || m.pgmId || '').indexOf(code) >= 0; });
        if (a) { const m = jQuery(a).data('menu'); if (m) { jQuery.gfnForm.create(m); return { ok: true, tries }; } }
        if (Date.now() > until) return { ok: false, why: '메뉴 없음: ' + name + ' (메뉴 ' + L.length + '개 · ' + tries + '번 찾음 · 화면 ' + location.pathname + ')' }; }
      else if (Date.now() > until) return { ok: false, why: '메뉴 틀이 아직 없음 (화면 ' + location.pathname + ')' };
      await new Promise((r) => setTimeout(r, 500)); } }`,
  /* 일괄주문접수(PIDCUS014U): 사용자파일 '알라딘' 고르기 → fnCheckBeFile(형식 읽기)까지 */
  upPrep: `(a) => new Promise((res) => { try { const it = typeof cboUsrFmat01.getItems === 'function' ? cboUsrFmat01.getItems() : JSON.parse(cboUsrFmat01.items || '[]'); const k = it.findIndex((x) => String(x.label || '').trim() === a.fmt);
      const info = { pick: String(edtPickYmd01.value || ''), ordSct: String(cboOrdSct01.value || ''), dup: String(chkOrdDupCd01.value || ''), dupCd: String(cboOrdDupCd01.value || ''), labels: it.map((x) => x.label) };
      if (k < 0) return res({ ok: false, why: "사용자파일 목록에 '" + a.fmt + "'가 없음", info }); if (info.ordSct !== '01') return res({ ok: false, why: '주문구분이 출고(01)가 아님', info });
      if (info.pick !== a.today) { dsOpt01.setValue(0, 'pickYmd', a.today); info.pickSet = a.today; }
      if (cboShpmFmat01.value) { cboShpmFmat01.index = 0; dsOpt01.setValue(0, 'shpmFmat', ''); }
      if (cboUsrFmat01.index !== k) cboUsrFmat01.index = k; if (dsOpt01.getValue(0, 'usrFmat') !== cboUsrFmat01.value) dsOpt01.setValue(0, 'usrFmat', cboUsrFmat01.value);
      let done = false; const tm = setTimeout(() => { if (!done) { done = true; res({ ok: false, why: '파일 형식 확인이 끝나지 않음', info }); } }, a.ms);
      fnCheckBeFile(() => { if (done) return; done = true; clearTimeout(tm); info.cols = grdList01.getColumns().length; info.title0 = String(dsOpt01.getValue(0, 'titleYn') || ''); info.bdpk0 = String(chkBdpkBaseCd01.value || '') + '/' + String(dsOpt01.getValue(0, 'bdpkBaseCd') || ''); const fixOpt = () => { if (dsOpt01.getValue(0, 'titleYn') !== 'Y') dsOpt01.setValue(0, 'titleYn', 'Y'); try { chkTitleYn01.value = 'Y'; } catch (e) {} if (chkBdpkBaseCd01.value !== 'Y') { chkBdpkBaseCd01.value = 'Y'; } const bc = String(dsOpt01.getValue(0, 'bdpkBaseCd') || ''); if (!bc || bc === '00') dsOpt01.setValue(0, 'bdpkBaseCd', '01'); try { cboBdpkBaseCd01.enable = true; } catch (e) {} return { title: String(dsOpt01.getValue(0, 'titleYn') || ''), bdpk: String(chkBdpkBaseCd01.value || ''), bdpkCd: String(dsOpt01.getValue(0, 'bdpkBaseCd') || '') }; }; const fo = fixOpt(); info.title = fo.title; info.bdpk = fo.bdpk; info.bdpkCd = fo.bdpkCd; res({ ok: true, info }); }, () => { if (done) return; done = true; clearTimeout(tm); res({ ok: false, why: '파일 형식 확인 실패', info }); });
    } catch (e) { res({ ok: false, why: '화면 이름이 예상과 다름: ' + e.message }); } })`,
  fileEl: `() => document.getElementById('files')`,
  upState: `() => ({ path: (window.edtPath && edtPath.value) || '', rows: (window.dsList01 && dsList01.getRowCount) ? dsList01.getRowCount() : 0 })`,
  upRows: `() => (dsList01.getFilteredRows('') || []).map((r, i) => ({ i: i + 1, sent: String(r.trsmYn || ''), err: String(r.errorMsg || '') }))`,
  /* 통합관리 운송장출력(PIDPIC002U) */
  search: `(a) => new Promise((res) => { try { dsSearch.setValue(0, 'srchPickFrYmd', a.today); dsSearch.setValue(0, 'srchPickToYmd', a.today); dsSearch.setValue(0, 'srchPrntSctCd', ''); fnBtnSearch(); } catch (e) { return res({ ok: false, why: '조회 실패: ' + e.message }); }
      const t0 = Date.now(); let last = -1, same = 0; const tick = () => { const n = dsRsrvList.getRowCount(); const tot = +(document.getElementById('spTotCnt') || {}).textContent || 0;
        if (n === last) same++; else { same = 0; last = n; } if (tot > n && same >= 3 && window.objNextBtn && objNextBtn.enable) { same = 0; fnNext(); }
        if (same >= 4 && (tot === 0 ? n === 0 : n >= tot)) return res({ ok: true, n, tot }); if (Date.now() - t0 > a.ms) return res({ ok: n > 0 && n >= tot, n, tot, why: '조회가 끝나지 않음' }); setTimeout(tick, 400); }; setTimeout(tick, 600); })`,
  rows: `() => (dsRsrvList.getFilteredRows('') || []).map((r, i) => ({ i, invNo: String(r.invNo || ''), prnt: String(r.invPrntNm || ''), prntYn: String(r.invPrntYn || ''), name: String(r.acperNm || r.acperNmView || ''), title: String(r.gdsNm || ''), sku: String(r.gdsDtlCont || ''), mgr: String(r.rsrvMgrNo || ''), pick: String(r.pickYmd || ''), pack: String(r.bdpkKey || ''), packSeq: String(r.bdpkRpnSeq || ''), packYn: String(r.bdpkSctCd || ''), ust: String(r.ustRtgSctCd || r.rsrvSctCd || '') }))`,
  check: `(a) => { const n = grdRsrv.rowCount; const all = []; for (let g = 0; g < n; g++) all.push(g); if (all.length) grdRsrv.setRowsCheck(all, false); const want = a.ds.map((d) => grdRsrv.getRowIndex(d)).filter((g) => g >= 0); if (want.length) grdRsrv.setRowsCheck(want, true);
      let c = 0; for (let g = 0; g < n; g++) if (grdRsrv.isCheckedRow(g)) c++; return { ok: c === want.length, checked: c, want: want.length }; }`,
  print: `() => { fnBtnPrint('00'); return true; }`, /* '00' = 미리보기 창(PIDPIC051U)을 거치는 출력 — 정범님이 하던 길 · '02'(바로 출력)는 쓰지 않음 */
  /* 출력 미리보기(PIDPIC051U) */
  popReady: `() => ({ ready: typeof fnPopBtnPrnt === 'function' && window.dsInvList && dsInvList.getRowCount() > 0 && window.dsInvKndList && dsInvKndList.getRowCount() > 0, n: window.dsInvList ? dsInvList.getRowCount() : 0, knd: window.dsInvKndList && dsInvKndList.getRowCount() ? String(dsInvKndList.getValue(dsInvKndList.getRowPosition(), 'dtlCdNm') || dsInvKndList.getValue(dsInvKndList.getRowPosition(), 'dtlCd') || '') : '', mgr: window.dsInvList ? (dsInvList.getRows() || []).map((r) => String(r.rsrvMgrNo || '')) : [] })`,
  popPrint: `(a) => { printerName = a.printer; /* OZ: 프린터 이름이 있으면 print.mode=silent(인쇄 창 없음) — ALPS도 두 번째 묶음부터 같은 값으로 씀 */ window.__rnPrinter = a.printer; fnPopBtnPrnt(); return { ok: true }; }`,
};

/* ── 맞춤 (readnow-shipping-core.js와 같은 기준) ── */
const nTitle = (t) => String(t || '').replace(/^\[중고[^\]]*\]\s*/, '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
const nName = (t) => String(t || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '').toLowerCase();
const tEq = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
/* 이번 파일의 줄(수령인·상품명) ↔ ALPS 목록 줄: 한 번 쓴 ALPS 줄은 다시 안 씀 */
function pairRows(mine, alps) { const used = new Set(); const hit = []; const miss = [];
  for (const m of mine) { const nm = nName(m.name), t = nTitle(m.title); let k = alps.findIndex((r, i) => !used.has(i) && nName(r.name) === nm && nTitle(r.title) === t); if (k < 0) k = alps.findIndex((r, i) => !used.has(i) && nName(r.name) === nm && tEq(nTitle(r.title), t));
    if (k >= 0) { used.add(k); hit.push({ mine: m, row: alps[k] }); } else miss.push(m); }
  return { hit, miss }; }
const rowsSig = (rows) => crypto.createHash('sha256').update(JSON.stringify(rows.map((r) => [nName(r.name), nTitle(r.title)]).sort())).digest('hex').slice(0, 16);
const WB_HEAD = ['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키']; /* readnow-shipping-core parseAlpsWaybills가 읽는 칸 이름 */
const toAoa = (rows) => [WB_HEAD, ...rows.filter((r) => r.invNo).map((r) => [r.invNo, r.name, r.title, r.sku, r.mgr, r.prnt, r.pick, r.pack])];

/* ── 한 번의 실행 ── */
const STEPS = [['login', '로그인'], ['check', '오늘 목록 겹침 검사'], ['upload', '접수(일괄주문접수)'], ['print', '출력(운송장)'], ['verify', '운송장번호 확인'], ['send', '웹앱으로 넘김']];
let RUN = null; let BROWSER = null; let WAITER = null;
const pub = () => RUN && { log: RUN.log || [], t0: RUN.t0 || null, id: RUN.id, at: RUN.at, fileName: RUN.fileName, status: RUN.status, step: RUN.step, steps: RUN.steps, detail: RUN.detail, need: RUN.need, error: RUN.error, summary: RUN.summary, done: RUN.status === 'done', hasResult: !!(RUN.result && RUN.result.aoa) };
function stepSet(k, st, pct, detail) { const s = RUN.steps.find((x) => x.k === k); if (!s) return; /* (0.2.1 정범님 11/02 '훨씬 더 세분화해서 실시간') 단계마다 시작·걸린 시간 · 바뀔 때마다 기록 줄(최근 60) */ const now = Date.now(); if (st === 'run' && !s.t0) s.t0 = now; if (['ok', 'err', 'skip'].includes(st) && s.t0 && !s.ms) s.ms = now - s.t0; if (detail != null && detail !== s.d || st !== s.st) { RUN.log = RUN.log || []; RUN.log.push({ t: kst().slice(11, 19), k, st, d: detail != null ? String(detail).slice(0, 160) : s.d, p: pct != null ? pct : s.pct }); if (RUN.log.length > 60) RUN.log.splice(0, RUN.log.length - 60); } s.st = st; if (pct != null) s.pct = pct; if (detail != null) s.d = detail; RUN.step = k; if (detail != null) RUN.detail = detail; RUN.upd = Date.now(); if (RUN.onChange) try { RUN.onChange(pub()); } catch (e) {} }
/* 사람에게 묻기: need = { type:'otp'|'continue'|'choice', msg, options? } → /alps/input이 답을 넣음 */
function askHuman(need) { RUN.need = need; RUN.status = 'wait'; RUN.upd = Date.now(); if (RUN.onChange) try { RUN.onChange(pub()); } catch (e) {} log('사람 기다림: ' + need.type);
  return new Promise((res, rej) => { const lim = cfg().humanWaitMin * 60e3; const tm = setTimeout(() => { WAITER = null; rej(new Error(`${cfg().humanWaitMin}분 동안 답이 없어 멈춤`)); }, lim);
    WAITER = (ans) => { clearTimeout(tm); WAITER = null; RUN.need = null; RUN.status = 'run'; if (ans && ans.kind === 'stop') rej(new Error('사람이 멈춤')); else if (need.type === 'choice' && !(need.options || []).includes(ans && ans.pick)) rej(new Error('고른 답이 선택지에 없어 멈춤')); else res(ans || {}); }; }); }
function input(ans) { if (!RUN) return { ok: false, err: '실행 중인 일이 없음' }; if (ans && ans.kind === 'stop') { RUN.stopReq = true; if (WAITER) WAITER(ans); return { ok: true }; } if (!WAITER) return { ok: false, err: '지금은 기다리는 질문이 없음' }; WAITER(ans); return { ok: true }; }
const chkStop = () => { if (RUN.stopReq) throw new Error('사람이 멈춤'); };

/* ALPS 안내창 처리: want(글자 RegExp)가 나오면 그것을 돌려줌 · 그 밖의 안내는 사람에게 보여 주고 '확인 누르고 계속'/'멈춤' */
async function waitDialog(B, frameRe, want, ms, okRe) { const t0 = Date.now();
  for (;;) { chkStop(); let D = []; try { D = await B.eval(frameRe, PG.dialogs, null, { wait: 2000 }); } catch (e) {}
    for (const d of D) { if (want && want.test(d.text)) return d;
      if (okRe && okRe.test(d.text)) { await B.eval(frameRe, PG.press, '확인'); continue; }
      const ans = await askHuman({ type: 'choice', msg: `ALPS 안내: ${d.title ? d.title + ' — ' : ''}${d.text.slice(0, 400)}`, options: d.buttons.length > 1 ? ['확인 누르고 계속', '취소 누르고 계속', '멈춤'] : ['확인 누르고 계속', '멈춤'] });
      if (ans.pick === '멈춤') throw new Error('사람이 멈춤'); await B.eval(frameRe, PG.press, ans.pick === '취소 누르고 계속' ? '취소' : '확인'); }
    const nd = B.nativeDlg.shift(); if (nd && nd.type !== 'alert') throw new Error('ALPS가 묻는 창이 떠 멈춤: ' + nd.msg.slice(0, 200));
    if (!want) return null; if (Date.now() - t0 > ms) return null; await sleep(500); } }

async function doLogin(B, c) { stepSet('login', 'run', 10, 'ALPS 여는 중');
  await B.cdp.send('Page.navigate', { url: c.baseUrl }, [...B.sessions.keys()][0]); await sleep(1500);
  const top = /^https?:\/\/[^/]+\/(?!.*PID)/; let tried = 0, otpSent = false;
  for (let i = 0; i < 120; i++) { chkStop(); let s; try { s = await B.eval(B.mainFrame(), PG.login, null, { wait: 5000 }); } catch (e) { await sleep(500); continue; }
    if (s.page === 'main') { stepSet('login', 'ok', 100, '로그인됨'); return; }
    if (s.pwchg) { await askHuman({ type: 'continue', msg: 'ALPS가 비밀번호 변경(90일)을 묻습니다. 평소 크롬에서 ALPS 비밀번호를 바꾼 뒤, 이 PC 설정 화면(http://127.0.0.1:8898/alps)에 새 비밀번호를 넣고 \'계속\'을 누르세요.' }); tried = 0; await B.cdp.send('Page.navigate', { url: c.baseUrl }, [...B.sessions.keys()][0]); await sleep(1500); continue; }
    if (s.otp && tried > 0 && !otpSent) { stepSet('login', 'wait', 50, 'OTP·인증번호를 기다림'); const a = await askHuman({ type: 'otp', msg: 'ALPS가 OTP·인증번호를 묻습니다. 번호를 넣어 주세요.' }); stepSet('login', 'run', 60, '인증번호 넣는 중'); await B.eval(B.mainFrame(), PG.login, { otp: String(a.code || '').trim() }); otpSent = true; await sleep(2500); continue; }
    if (s.page === 'login') { if (tried >= 2) throw new Error('로그인이 되지 않음 — 이 PC 설정 화면에서 아이디·비밀번호를 확인해 주세요');
      const cr = await loadCred(); if (!cr) { await askHuman({ type: 'continue', msg: 'ALPS 로그인 정보가 없습니다. 이 PC에서 http://127.0.0.1:8898/alps 를 열어 아이디·비밀번호를 넣은 뒤 \'계속\'을 누르세요.' }); continue; }
      stepSet('login', 'run', 30, '아이디·비밀번호 넣는 중'); const r = await B.eval(B.mainFrame(), PG.login, cr); tried++; if (!r.ok) throw new Error('로그인 화면이 예상과 다름: ' + (r.why || '단추 없음')); await sleep(3000);
      const D = await B.eval(B.mainFrame(), PG.dialogs, null).catch(() => []); if (D.length) { const t = D[0].text; await B.eval(B.mainFrame(), PG.press, '확인').catch(() => {}); if (!s.otp) throw new Error('로그인 안내: ' + t.slice(0, 200)); } continue; }
    await sleep(1000); }
  throw new Error('로그인 화면이 끝나지 않음'); }

async function openPage(B, menuName, re, c) { if (B.frameBy(re) && B.ctxOf(B.frameBy(re))) return; const r = await B.eval(B.mainFrame(), PG.openMenu, { name: menuName, code: String(re.source).replace(/[^A-Z0-9]/g, ''), ms: c.stepTimeoutSec * 1000 }, { wait: c.stepTimeoutSec * 1000, timeoutMs: c.stepTimeoutSec * 1000 + 5000 }); /* (0.2.1) 로그인 직후 메뉴가 서버에서 늦게 그려져도 다 그려질 때까지 기다림 · 이름이 달라도 화면 코드로 찾음 */ if (!r.ok) throw new Error(r.why);
  const t0 = Date.now(); while (Date.now() - t0 < c.stepTimeoutSec * 1000) { const f = B.frameBy(re); if (f && B.ctxOf(f)) { try { const ok = await B.eval(f, `() => document.readyState === 'complete' && !!window.jQuery`); if (ok) { await sleep(1200); return; } } catch (e) {} } await sleep(400); }
  throw new Error(menuName + ' 화면이 열리지 않음'); }

/* (0.2.5) 인쇄 프로그램(OZ 웹런처) 연결 확인 — ALPS 화면과 같은 주소(wss://127.0.0.1:36510/ozrvservice)로 붙어 봄 · 접수 전에(접수한 뒤 인쇄가 막히면 되돌릴 수 없음) */
async function ozCheck(B) { const r = await B.eval(B.mainFrame(), `() => new Promise((res) => { let done = false; const fin = (v) => { if (!done) { done = true; try { ws.close(); } catch (e) {} res(v); } }; let ws; try { ws = new WebSocket(location.protocol === 'https:' ? 'wss://127.0.0.1:36510/ozrvservice' : 'ws://127.0.0.1:36480/ozrvservice'); } catch (e) { return res({ ok: false, why: e.message }); } ws.onopen = () => fin({ ok: true }); ws.onerror = () => fin({ ok: false, why: '연결 오류' }); setTimeout(() => fin({ ok: false, why: '6초 안에 답 없음' }), 6000); })`, null, { timeoutMs: 9000 }).catch((e) => ({ ok: false, why: e.message }));
  return r || { ok: false, why: '확인 못 함' }; }
const boxCount = (hits) => { const ks = new Set(); let solo = 0; for (const h of hits) { const k = h.row.pack; if (k) ks.add(k); else solo++; } return ks.size + solo; }; /* 합포장 번호(bdpkKey)가 같은 줄 = 한 상자 */
const orderCount = (rows) => new Set(rows.map((r) => r.ono || r.name)).size;
const rcvCount = (rows) => new Set(rows.map((r) => r.rk || r.name)).size; /* 받는 사람(이름·전화·주소 — 웹앱이 rk로 보냄) — ALPS 합포장 기준 01과 같음 */
function histAdd(R) { try { const L = rdJ(F.hist, []); const sm = R.summary || {}; L.unshift({ id: R.id, at: R.at, end: kst(), file: R.fileName, status: R.status, error: R.error || null, resume: !!R.resume, rows: sm.rows || null, orders: sm.orders || null, boxes: sm.boxes || null, upload: sm.upload ? { ok: sm.upload.ok, bad: sm.upload.bad } : sm.uploadSkip || null, printed: sm.printed || 0, waybills: sm.waybills || 0, notFound: sm.notFound || 0, step: (R.steps.find((x) => x.st === 'err') || {}).l || null, secs: Math.round((Date.now() - (R.t0 || Date.now())) / 1000) }); wrJ(F.hist, L.slice(0, 300)); } catch (e) {} }
const history = () => rdJ(F.hist, []);
async function listToday(B, c) { const R = await B.eval(/PIDPIC002U/, PG.search, { today: ymdK(), ms: c.stepTimeoutSec * 1000 }, { timeoutMs: c.stepTimeoutSec * 1000 }); if (!R.ok) throw new Error(R.why || '조회 실패'); await waitDialog(B, /PIDPIC002U/, null, 0); return B.eval(/PIDPIC002U/, PG.rows); }

async function runJob(job) { const c = cfg(); const B = new Browser(); BROWSER = B; B.mainFrame = () => { for (const [id, f] of B.frames) if (!f.parentId && /^https?:/.test(f.url) && !/PIDPIC051U|ozhviewer/.test(f.url)) return id; return null; };
  const mine = job.rows || []; const sig = rowsSig(mine); const runs = rdJ(F.runs, []);
  try { if (!mine.length) throw new Error('보낸 주문 줄이 없음'); if (!c.printer) throw new Error('롯데택배 프린터를 고르지 않음 — 이 PC 설정 화면(http://127.0.0.1:8898/alps)에서 고르세요(아무것도 접수하지 않았습니다)');
    fs.mkdirSync(F.up, { recursive: true }); const fp = path.join(F.up, job.fileName); fs.writeFileSync(fp, Buffer.from(job.b64, 'base64'));
    stepSet('login', 'run', 5, '크롬 켜는 중'); await B.launch(c); await doLogin(B, c);
    /* ② 오늘 목록 겹침 검사 — 이미 같은 수령인·상품이 오늘 ALPS에 있으면 두 번 접수하지 않음 */
    stepSet('check', 'run', 20, '통합관리 운송장출력 여는 중'); await openPage(B, '통합관리 운송장출력', /PIDPIC002U/, c); chkStop();
    stepSet('check', 'run', 60, '오늘 집하일자로 조회'); let rows = await listToday(B, c); let P = pairRows(mine, rows);
    const before = runs.filter((r) => r.day === ymdK() && r.sig === sig && r.uploaded); let doUpload = true; RUN.summary.rows = mine.length; RUN.summary.orders = orderCount(mine);
    /* (0.2.5 정범님 11/03) ALPS 목록에 상품이 들어간 뒤로는 다시 접수하면 중복 — 목록을 기준으로 정함:
     *  · 이번 주문이 모두 목록에 있음 → 접수 건너뛰고 인쇄부터 이어서(묻지 않음) · 일부만 있음 → 다시 접수하지 않고 멈춰 물음
     *  · 목록엔 없는데 이 PC 기록엔 오늘 같은 파일 접수가 있음 → 물음 · 둘 다 없음 → 처음부터(접수) */
    if (P.hit.length === mine.length) { doUpload = false; RUN.summary.uploadSkip = `ALPS 목록에 이미 모두 있음(${P.hit.length}줄)`; log(`ALPS 목록에 이번 주문 ${P.hit.length}줄이 모두 있음 → 접수 건너뛰고 인쇄부터 이어서`); }
    else if (P.hit.length) { const prn = P.hit.filter((h) => h.row.invNo).length;
      const ans = job.dup || (await askHuman({ type: 'choice', msg: `ALPS 오늘 목록에 이번 주문 ${P.hit.length}/${mine.length}줄만 있습니다(운송장 출력 ${prn}줄). 다시 접수하면 이미 있는 줄이 두 번 들어가 상자가 두 번 나갈 수 있어, 접수는 하지 않습니다. 빠진 ${mine.length - P.hit.length}줄: ${P.miss.slice(0, 5).map((m) => m.name + ' ' + String(m.title || '').slice(0, 14)).join(' · ')}`, options: ['있는 줄만 인쇄(빠진 줄은 ALPS에서 손으로)', '멈춤'] })).pick;
      if (ans === '멈춤') throw new Error('사람이 멈춤(일부만 접수된 상태 — 다시 접수하지 않음)'); doUpload = false; RUN.summary.uploadSkip = `일부만 있음(${P.hit.length}/${mine.length}) — 접수 안 함`; }
    else if (before.length) { const ans = job.dup || (await askHuman({ type: 'choice', msg: `이 PC 기록에는 오늘 같은 파일을 ${before.length}번 접수했는데 ALPS 오늘 목록에는 하나도 없습니다(집하일자가 다르거나 접수가 지워졌을 수 있음). 그래도 접수할까요?`, options: ['그래도 접수', '멈춤'] })).pick;
      if (ans === '멈춤') throw new Error('사람이 멈춤'); }
    stepSet('check', 'ok', 100, `오늘 목록 ${rows.length}줄 · 이번 파일과 같은 줄 ${P.hit.length}`);
    { stepSet('check', 'run', 90, '인쇄 프로그램(OZ) 연결 확인'); const oz = await ozCheck(B); if (!oz.ok) throw new Error(`인쇄 프로그램(OZ 웹런처)에 연결이 안 됩니다(${oz.why})${doUpload ? ' — 아무것도 접수하지 않았습니다' : ' — 접수는 이미 돼 있음 · 고친 뒤 「이어서 진행」'}. MJ-MAIN에서 평소 크롬으로 ALPS 송장 출력이 되는지, 작업 표시줄 오른쪽에 OZ 아이콘이 있는지 확인해 주세요`); log('인쇄 프로그램(OZ) 연결 확인됨'); stepSet('check', 'ok', 100, `오늘 목록 ${rows.length}줄 · 이번 파일과 같은 줄 ${P.hit.length} · 인쇄 프로그램 연결됨`); }
    /* ③ 접수 */
    if (doUpload) { stepSet('upload', 'run', 10, '일괄주문접수 여는 중'); await openPage(B, '일괄주문접수', /PIDCUS014U/, c); chkStop();
      stepSet('upload', 'run', 30, "사용자파일 '알라딘' 고르는 중"); const pr = await B.eval(/PIDCUS014U/, PG.upPrep, { fmt: '알라딘', today: ymdK(), ms: c.stepTimeoutSec * 1000 }, { timeoutMs: c.stepTimeoutSec * 1000 });
      await waitDialog(B, /PIDCUS014U/, null, 0); if (!pr.ok) throw new Error(pr.why); RUN.summary.dupCheck = pr.info.dup === 'Y' ? `ALPS 중복점검 켜짐(${pr.info.dupCd})` : 'ALPS 중복점검 꺼짐(사용안함) — 도우미 기록·오늘 목록으로 막음';
      if (pr.info.title !== 'Y') throw new Error(`타이틀여부를 '타이틀있음'으로 못 맞춤(지금 '${pr.info.title || '빈 값'}') — 접수하지 않았습니다. ALPS 일괄주문접수 화면에서 '타이틀있음'을 확인해 주세요`); if (pr.info.bdpk !== 'Y' || !pr.info.bdpkCd || pr.info.bdpkCd === '00') throw new Error(`합포장처리를 켜지 못함(지금 '${pr.info.bdpk}'·기준 '${pr.info.bdpkCd}') — 접수하지 않았습니다. ALPS 일괄주문접수 화면에서 '합포장처리' 체크를 확인해 주세요`); if (!/^Y\//.test(pr.info.bdpk0 || '')) log(`합포장처리 '${pr.info.bdpk0}' → 켬(기준 ${pr.info.bdpkCd})`); if (pr.info.title0 !== 'Y') log(`타이틀여부 '${pr.info.title0 || '빈 값'}' → '타이틀있음'으로 맞춤(알라딘 발송 요청 엑셀은 첫 줄이 제목)`);
      stepSet('upload', 'run', 50, '파일 넣는 중'); const fe = await B.eval(/PIDCUS014U/, PG.fileEl, null, { handle: true }); await B.cdp.send('DOM.setFileInputFiles', { files: [fp], objectId: fe.objectId }, fe.sid);
      const fin = await B.eval(/PIDCUS014U/, `() => { const f = document.getElementById('files').files; return f.length ? f[0].name : ''; }`); if (fin !== job.fileName) throw new Error(`파일을 넣지 못함(크롬이 받은 이름: '${fin}') — 접수하지 않았습니다`);
      { const t2 = await B.eval(/PIDCUS014U/, `() => { const fixOpt = () => { if (dsOpt01.getValue(0, 'titleYn') !== 'Y') dsOpt01.setValue(0, 'titleYn', 'Y'); try { chkTitleYn01.value = 'Y'; } catch (e) {} if (chkBdpkBaseCd01.value !== 'Y') { chkBdpkBaseCd01.value = 'Y'; } const bc = String(dsOpt01.getValue(0, 'bdpkBaseCd') || ''); if (!bc || bc === '00') dsOpt01.setValue(0, 'bdpkBaseCd', '01'); try { cboBdpkBaseCd01.enable = true; } catch (e) {} return { title: String(dsOpt01.getValue(0, 'titleYn') || ''), bdpk: String(chkBdpkBaseCd01.value || ''), bdpkCd: String(dsOpt01.getValue(0, 'bdpkBaseCd') || '') }; }; return fixOpt(); }`).catch(() => ({})); if (t2.title !== 'Y') throw new Error('파일을 넣은 뒤 타이틀여부가 \'타이틀있음\'이 아님 — 접수하지 않았습니다'); if (t2.bdpk !== 'Y' || !t2.bdpkCd || t2.bdpkCd === '00') throw new Error('파일을 넣은 뒤 합포장처리가 꺼져 있음 — 접수하지 않았습니다'); } /* 파일을 넣을 때 ALPS가 다시 바꿀 수 있어 한 번 더 */
      await sleep(2500); const st = await B.eval(/PIDCUS014U/, PG.upState); if (st.path !== job.fileName) log('파일 이름 칸이 바로 안 바뀜 — 업로드 진행을 계속 지켜봄');
      stepSet('upload', 'run', 70, '업로드 결과 기다림'); const d = await waitDialog(B, /PIDCUS014U/, /성공건수|파일업로드에 실패|오류|BUSINESS_ERROR|작업중단/, c.uploadTimeoutSec * 1000); /* (0.2.3) ALPS 업무 오류도 결과로 받아 그 글로 멈춤(사람에게 '확인 누르고 계속'을 묻지 않음 — 눌러도 접수가 되지 않음) */
      if (!d) throw new Error('업로드 결과 안내가 오지 않음(ALPS 결과파일조회에서 확인해 주세요)'); const m = d.text.match(/성공건수\s*:\s*\((\d+)\)[\s\S]*?실패건수\s*:\s*\((\d+)\)/);
      await B.eval(/PIDCUS014U/, PG.press, '확인'); if (!m) throw new Error('업로드 실패: ' + d.text.slice(0, 200));
      const ok = +m[1], bad = +m[2]; runs.push({ day: ymdK(), sig, file: job.fileName, at: kst(), uploaded: true, ok, bad }); wrJ(F.runs, runs.slice(-200)); RUN.summary.upload = { ok, bad, rows: mine.length };
      if (bad) { const er = (await B.eval(/PIDCUS014U/, PG.upRows).catch(() => [])).filter((r) => r.err); RUN.summary.upload.errors = er.slice(0, 50); throw new Error(`접수 오류 ${bad}건 — ALPS 일괄주문접수의 오류내역에서 고친 뒤 '오류수정'을 눌러 주세요: ${er.slice(0, 5).map((r) => r.i + '줄 ' + r.err).join(' · ')}`); }
      if (ok !== mine.length) log(`접수 성공 ${ok}건 ≠ 보낸 줄 ${mine.length}`); stepSet('upload', 'ok', 100, `접수 성공 ${ok}건 · 실패 0`); }
    else stepSet('upload', 'skip', 100, '건너뜀(이미 오늘 접수됨)');
    { stepSet('print', 'run', 5, '상자 수 확인'); await openPage(B, '통합관리 운송장출력', /PIDPIC002U/, c); const r0 = await listToday(B, c); const P0 = pairRows(mine, r0); const bx = boxCount(P0.hit); RUN.summary.boxes = bx; const oc = RUN.summary.orders; const rc = rcvCount(mine); RUN.summary.rcv = rc;
      log(`${mine.length}줄 → ALPS 상자 ${bx}개 · 주문 ${oc}건 · 받는 사람 ${rc}명`); if (bx !== rc && !job.boxOk) { const G = new Map(); P0.hit.forEach((h) => { const k = h.row.pack || ('solo' + h.row.i); const g = G.get(k) || { n: 0, names: new Set() }; g.n++; g.names.add(h.row.name); G.set(k, g); }); const gl = [...G.values()].map((g, i) => `${i + 1}) ${g.n}줄 · ${[...g.names].slice(0, 3).join('·')}`).slice(0, 12).join(' / ');
        const a = await askHuman({ type: 'choice', msg: `ALPS 상자(운송장) ${bx}개 ≠ 받는 사람 ${rc}명(주문 ${oc}건) — ${bx > rc ? '같은 사람인데 상자가 나뉜 줄이 있습니다' : '다른 사람이 한 상자로 묶였습니다'}. 상자마다: ${gl}`, options: ['그대로 인쇄', '멈춤'] }); if (a.pick === '멈춤') throw new Error(`사람이 멈춤 — 상자 ${bx}개 · 받는 사람 ${rc}명 · 주문 ${oc}건 (접수는 돼 있음 · 고친 뒤 「이어서 진행」)`); } }
    /* ④ 출력 */
    let firstOne = job.firstOne != null ? !!job.firstOne : c.firstOne; let round = 0;
    for (;;) { chkStop(); round++; stepSet('print', 'run', 10, '이번 주문 찾는 중'); await openPage(B, '통합관리 운송장출력', /PIDPIC002U/, c); rows = await listToday(B, c); P = pairRows(mine, rows);
      const todo = P.hit.filter((h) => !h.row.invNo && h.row.prnt !== '출력' && h.row.prntYn !== 'Y'); RUN.summary.notFound = P.miss.length;
      if (P.miss.length && round === 1) log(`ALPS 오늘 목록에 없는 줄 ${P.miss.length}`); if (!todo.length) break;
      let pick = todo; if (firstOne) { const k0 = todo[0].row; pick = todo.filter((h) => (k0.pack && h.row.pack === k0.pack) || h === todo[0]); } /* 1장 먼저: 첫 상자(합포장이면 그 묶음 전부) */
      const ck = await B.eval(/PIDPIC002U/, PG.check, { ds: pick.map((h) => h.row.i) }); if (!ck.ok) throw new Error(`체크가 맞지 않음(${ck.checked}/${ck.want})`);
      if (c.confirmBeforePrint) await askHuman({ type: 'continue', msg: `${pick.length}줄을 '${c.printer}'로 인쇄합니다. 계속할까요?` });
      stepSet('print', 'run', 30, `${pick.length}줄 출력 — 미리보기 여는 중`); B.nativeDlg.length = 0; await B.eval(/PIDPIC002U/, PG.print);
      const t0 = Date.now(); let pop = null; while (Date.now() - t0 < c.stepTimeoutSec * 1000 && !pop) { chkStop(); const D = await B.eval(/PIDPIC002U/, PG.dialogs, null).catch(() => []);
        for (const d of D) { if (/편의점 주문 건이 포함/.test(d.text)) { await B.eval(/PIDPIC002U/, PG.press, '확인'); continue; } const ans = await askHuman({ type: 'choice', msg: `ALPS 안내: ${d.title ? d.title + ' — ' : ''}${d.text.slice(0, 400)}`, options: d.buttons.includes('취소') ? ['확인 누르고 계속', '취소하고 멈춤'] : ['확인 누르고 계속', '멈춤'] }); if (ans.pick !== '확인 누르고 계속') { await B.eval(/PIDPIC002U/, PG.press, d.buttons.includes('취소') ? '취소' : '확인').catch(() => {}); throw new Error('사람이 멈춤'); } await B.eval(/PIDPIC002U/, PG.press, '확인'); }
        const f = B.frameBy(/PIDPIC051U/); if (f && B.ctxOf(f)) { const r = await B.eval(f, PG.popReady).catch(() => null); if (r && r.ready) pop = r; } if (!pop) await sleep(500); }
      if (!pop) throw new Error('출력 미리보기 창(PIDPIC051U)이 열리지 않음');
      RUN.summary.invKind = pop.knd; stepSet('print', 'run', 50, `미리보기 ${pop.n}장(${pop.knd}) → '${c.printer}'로 인쇄 중`); await B.eval(/PIDPIC051U/, PG.popPrint, { printer: c.printer }); log(`인쇄 맡김: ${pop.n}장 · 프린터 지정`);
      const d = await waitDialog(B, /PIDPIC051U/, /정상적으로 운송장이 출력|출력이 취소|출력후처리오류|을 제외하고 정상적으로 출력/, c.printTimeoutSec * 1000);
      const nd = B.nativeDlg.find((x) => x.type !== 'alert'); if (nd) throw new Error('인쇄 프로그램(OZ 웹런처)이 없다고 합니다 — 평소 크롬에서 ALPS 출력을 한 번 해 설치를 확인해 주세요: ' + nd.msg.slice(0, 120));
      if (!d) throw new Error('인쇄 끝 안내가 오지 않음 — ALPS 목록에서 출력여부를 확인해 주세요'); await B.eval(/PIDPIC051U/, PG.press, d.buttons.includes('확인') ? '확인' : d.buttons[0]).catch(() => {});
      if (/출력이 취소|출력후처리오류/.test(d.text)) throw new Error('ALPS: ' + d.text.slice(0, 200)); RUN.summary.printed = (RUN.summary.printed || 0) + pop.n;
      stepSet('print', 'run', 80, `${pop.n}장 인쇄 끝`); await sleep(1500);
      if (firstOne) { firstOne = false; await askHuman({ type: 'continue', msg: `1장(첫 상자)을 '${c.printer}'로 인쇄했습니다. 송장이 바르게 나왔으면 '계속' — 나머지 ${todo.length - pick.length}줄을 인쇄합니다.` }); } }
    stepSet('print', 'ok', 100, `인쇄 ${RUN.summary.printed || 0}장`);
    /* ⑤ 확인 */
    stepSet('verify', 'run', 30, '다시 조회해 운송장번호 확인'); rows = await listToday(B, c); P = pairRows(mine, rows); const empty = P.hit.filter((h) => !h.row.invNo); if (!P.hit.length) throw new Error('ALPS 오늘 목록에서 이번 파일의 주문을 하나도 못 찾음 — 접수가 됐는지 ALPS에서 확인해 주세요');
    if (empty.length) throw new Error(`운송장번호가 빈 줄 ${empty.length}개 — ALPS 목록에서 확인해 주세요`); stepSet('verify', 'ok', 100, `이번 주문 ${P.hit.length}줄 모두 운송장번호 있음${P.miss.length ? ` · ALPS에서 못 찾은 줄 ${P.miss.length}` : ''}`);
    /* ⑥ 넘김 — 오늘 목록 전체(운송장 있는 줄) — 웹앱 matchInvoices가 이번 주문과 맞춤('ALPS에만 있음'은 따로 보임) */
    RUN.result = { aoa: toAoa(rows), at: kst() }; RUN.summary.waybills = RUN.result.aoa.length - 1; stepSet('send', 'ok', 100, `운송장 ${RUN.summary.waybills}줄 준비됨`); RUN.status = 'done'; histAdd(RUN); log(`끝: 접수 ${(RUN.summary.upload || {}).ok ?? '건너뜀'} · 인쇄 ${RUN.summary.printed || 0} · 운송장 ${RUN.summary.waybills}`);
  } catch (e) { RUN.status = 'error'; RUN.error = e.message; const s = RUN.steps.find((x) => x.st === 'run' || x.st === 'wait'); if (s) s.st = 'err'; log('✗ ' + e.message); histAdd(RUN); }
  finally { RUN.need = null; RUN.upd = Date.now(); if (RUN.onChange) try { RUN.onChange(pub()); } catch (e) {} await B.close(); BROWSER = null; } }

/* ── (0.2.0) 서명 열쇠: Ed25519 · 개인 열쇠는 DPAPI로 잠가 key.dat에만 · 공개 열쇠는 웹앱이 Firestore(app_settings/alps_helpers)에 올림 ── */
let KEY = null; /* { priv: KeyObject, pub: pem, fp } */
async function ensureKey() { if (KEY) return KEY; let pem = null;
  if (fs.existsSync(F.key)) { try { pem = await unprotect(fs.readFileSync(F.key, 'utf8')); } catch (e) { log('서명 열쇠 풀기 실패 — 새로 만듦(웹앱에서 다시 허락 필요)'); pem = null; } }
  if (!pem) { const { privateKey } = crypto.generateKeyPairSync('ed25519'); pem = privateKey.export({ type: 'pkcs8', format: 'pem' }); fs.writeFileSync(F.key, await protect(pem)); log('서명 열쇠를 새로 만듦'); }
  const priv = crypto.createPrivateKey(pem); const pub = crypto.createPublicKey(priv).export({ type: 'spki', format: 'pem' });
  KEY = { priv, pub, fp: crypto.createHash('sha256').update(pub).digest('hex').slice(0, 12) }; return KEY; }
const pcName = () => (cfg().pcName || process.env.COMPUTERNAME || os.hostname()).trim().toUpperCase();
async function keyInfo() { const k = await ensureKey(); return { pc: pcName(), pub: k.pub, fp: k.fp }; }
async function cloudCall(op, o) { const c = cfg(); if (!c.cloudUrl) throw new Error('클라우드 주소 없음'); const k = await ensureKey();
  const raw = JSON.stringify({ pc: pcName(), ts: Date.now(), nonce: crypto.randomBytes(9).toString('hex'), op, ver: VERSION, ...(o || {}) }); const sig = crypto.sign(null, Buffer.from(raw), k.priv).toString('base64');
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 30000);
  try { const r = await fetch(c.cloudUrl.replace(/\/+$/, '') + '/alps-helper', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RN-Sig': sig }, body: raw, signal: ac.signal }); const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) throw Object.assign(new Error(j.err || 'HTTP ' + r.status), { code: r.status }); return j; } finally { clearTimeout(tm); } }
/* 원격 고리: 일이 없으면 remotePollSec마다 'poll' · 원격 일을 하는 동안 remoteActiveSec마다 'progress'(진행을 보내고 웹앱이 넣은 답을 받음) */
const REM = { id: null, seq: 0, last: '', busy: false, err: null, at: null, t: null, linked: null };
function remoteState() { return { on: !!cfg().cloudUrl, linked: REM.linked, err: REM.err, at: REM.at, job: REM.id }; }
async function remoteTick() { if (REM.busy) return; REM.busy = true; const c = cfg();
  try { if (!c.cloudUrl) return;
    if (REM.id) { const R = pub(); const done = !R || ['done', 'error'].includes(R.status);
      if (done && R && R.status === 'done' && RUN.result && !REM.sentResult) { await cloudCall('result', { id: REM.id, aoa: RUN.result.aoa }); REM.sentResult = true; }
      const j = await cloudCall('progress', { id: REM.id, run: R, ackSeq: REM.seq }); REM.at = kst(); REM.err = null; REM.linked = true;
      const a = j.answer; if (a && a.seq > REM.seq) { REM.seq = a.seq; const r = input(a); log(`원격 답 받음(${a.kind})${r.ok ? '' : ' — ' + r.err}`); }
      if (done) { log('원격 일 끝 — 결과 보냄'); REM.id = null; } return; }
    if (RUN && !['done', 'error'].includes(RUN.status)) return; /* 이 PC 웹앱이 맡긴 일이 도는 중 */
    const j = await cloudCall('poll', {}); REM.at = kst(); REM.err = null; REM.linked = true;
    if (j.job) { const J = j.job; log(`원격 일 받음(${J.id}) · ${(J.rows || []).length}줄`); try { start({ fileName: J.fileName, b64: J.b64, rows: J.rows, firstOne: J.firstOne, remote: J.id }); REM.id = J.id; REM.seq = 0; REM.sentResult = false; await cloudCall('progress', { id: J.id, run: pub(), ackSeq: 0 }); }
      catch (e) { await cloudCall('progress', { id: J.id, run: { status: 'error', error: e.message, steps: [] }, ackSeq: 0 }).catch(() => {}); } } }
  catch (e) { REM.err = e.message; if (e.code === 403) REM.linked = false; if (REM.err !== REM.last) { REM.last = REM.err; log('원격: ' + REM.err.slice(0, 120)); } }
  finally { REM.busy = false; clearTimeout(REM.t); if (!process.env.RN_ALPS_NOREMOTE) REM.t = setTimeout(remoteTick, (REM.id ? c.remoteActiveSec : c.remotePollSec) * 1000); } }
function link(o) { const u = String((o && o.cloudUrl) || '').trim(); if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.run\.app\/?$/i.test(u) && !(TEST_PROTECT && /^http:\/\/127\.0\.0\.1:\d+\/?$/.test(u))) throw new Error('클라우드 주소는 Cloud Run(…run.app)만'); /* 다른 곳이 이 PC에 일을 줄 수 없게 */ setCfg({ cloudUrl: u.replace(/\/+$/, '') }); REM.linked = null; clearTimeout(REM.t); REM.t = setTimeout(remoteTick, 1500); return remoteState(); }
if (!process.env.RN_ALPS_NOREMOTE) setTimeout(() => { ensureKey().catch((e) => log('서명 열쇠: ' + e.message)); remoteTick(); }, 3000);

/* ── 이 PC 설정 화면 (http://127.0.0.1:8898/alps · 이 PC 안에서만 · 다른 사이트 안에 못 넣음) ── */
const pageHtml = () => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ALPS 도우미 설정</title>
<style>:root{--bg:#F3F5F4;--card:#fff;--tx:#1E2B28;--mu:#5C6B67;--ac:#1F6F5C;--bd:#D6DDDA;--er:#B0322A}@media (prefers-color-scheme:dark){:root{--bg:#141A19;--card:#1E2624;--tx:#E6ECEA;--mu:#9AAAA5;--ac:#5FC3A6;--bd:#33403D;--er:#F08A80}}
body{margin:0 auto;max-width:640px;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.6 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;margin:10px 0}
label{display:block;margin:6px 0 2px;color:var(--mu);font-size:13px}input[type=text],input[type=password],select{width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--tx);font:inherit}
button{padding:8px 14px;border:0;border-radius:8px;background:var(--ac);color:#fff;font:inherit;cursor:pointer;margin-top:8px}.mu{color:var(--mu);font-size:13px}.er{color:var(--er)}.bar{height:8px;background:var(--bd);border-radius:4px;overflow:hidden}.bar i{display:block;height:100%;background:var(--ac)}</style></head><body>
<h2>📦 ALPS 도우미 <small class="mu" id="ver"></small></h2>
<div class="card"><b>로그인 정보</b> <span class="mu" id="cst"></span><div class="mu">이 PC·이 윈도우 사용자만 풀 수 있게 잠가(DPAPI) 이 PC 안 파일에만 둡니다. 웹앱·GitHub·Firebase로 보내지 않습니다.</div>
<div id="cok" style="display:none;margin-top:6px"><b>✓ 저장됨</b> <span class="mu" id="cid"></span> — 처리할 때 이것으로 로그인합니다. <button id="cch" style="background:var(--mu)">바꾸기</button></div><div id="cfm"><label>ALPS 아이디</label><input type="text" id="id" autocomplete="off"><label>비밀번호</label><input type="password" id="pw" autocomplete="new-password"><button id="sv">잠가서 저장</button> <button id="cx" style="background:var(--mu);display:none">그대로 두기</button> <span id="svm" class="mu"></span></div></div>
<div class="card"><b>인쇄</b><label>롯데택배 프린터</label><select id="pr"><option value="">(고르기)</option></select>
<label><input type="checkbox" id="cb"> 인쇄 전에 확인(끄면 자동 — 기본)</label><label><input type="checkbox" id="fo"> 처음엔 1장만 먼저 인쇄 → 확인 → 나머지</label><label><input type="checkbox" id="hl"> 화면 없이(headless) — ALPS가 막으면 끄세요(창을 화면 밖에 둔 일반 크롬)</label><button id="cs">설정 저장</button> <span id="csm" class="mu"></span></div>
<div class="card"><b>다른 기기(휴대폰)에서 시작</b><div class="mu" id="rem">…</div><div class="mu">이 PC의 서명 열쇠 지문: <b id="fp">…</b> — 웹앱 오늘 출고의 '이 PC 도우미 허락'에 같은 지문이 보이면 허락하세요. 개인 열쇠는 이 PC 안에만(DPAPI) 있습니다.</div></div>
<div class="card" id="run"><b>지금 일</b><div id="rs" class="mu">없음</div></div>
<script>const H={'X-RN-Print':'1','Content-Type':'application/json'};const $=(i)=>document.getElementById(i);const esc=(s)=>String(s??'').replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function J(u,b){const r=await fetch(u,b?{method:'POST',headers:H,body:JSON.stringify(b)}:{headers:H,cache:'no-store'});return r.json();}
async function load(){const s=await J('/alps/status');$('ver').textContent='판 '+s.ver;$('fp').textContent=s.key?s.key.fp:'-';const r=s.remote||{};$('rem').textContent=!r.on?'아직 연결 안 됨(웹앱에서 이 PC 도우미 허락)':r.linked===false?'⚠ 클라우드가 이 PC를 아직 허락하지 않음':r.err?'⚠ '+r.err:'✓ 연결됨 · 마지막 확인 '+(r.at||'').slice(11,19);$('cst').textContent=s.cred.saved?'('+s.cred.at+' 저장)':'— 아직 없음';if(s.cred.saved&&!window.__credEdit){$('cok').style.display='';$('cfm').style.display='none';$('cid').textContent=s.cred.idMask?'아이디 '+s.cred.idMask:'';}else{$('cok').style.display='none';$('cfm').style.display='';$('cx').style.display=s.cred.saved?'':'none';}$('cb').checked=s.cfg.confirmBeforePrint;$('fo').checked=s.cfg.firstOne;$('hl').checked=s.cfg.headless;
 try{const p=await J('/printers');(p.printers||[]).forEach((x)=>{const o=document.createElement('option');o.value=x.name;o.textContent=x.name+(x.def?' (윈도우 기본)':'');$('pr').appendChild(o);});}catch(e){} $('pr').value=s.cfg.printer||'';}
$('sv').onclick=async()=>{$('svm').textContent='저장 중…';const r=await J('/alps/cred',{id:$('id').value,pw:$('pw').value});$('pw').value='';$('svm').textContent=r.ok?'✓ 저장함':'✗ '+r.err;if(r.ok){window.__credEdit=false;$('id').value='';}load();};$('cch').onclick=()=>{window.__credEdit=true;load();setTimeout(()=>$('id').focus(),50);};$('cx').onclick=()=>{window.__credEdit=false;$('id').value='';$('pw').value='';$('svm').textContent='';load();};
/* (0.2.4) 창 위치 기억 — 움직이면 이 PC 도우미에 저장, 다음에 시작 때 그 자리에 열림 */ let __wp='';setInterval(()=>{const k=window.screenX+','+window.screenY;if(k!==__wp){__wp=k;J('/alps/config',{win:{x:window.screenX,y:window.screenY}}).catch(()=>{});}},2000);
$('cs').onclick=async()=>{const r=await J('/alps/config',{printer:$('pr').value,confirmBeforePrint:$('cb').checked,firstOne:$('fo').checked,headless:$('hl').checked});$('csm').textContent=r.ok?'✓ 저장함':'✗ '+r.err;};
async function tick(){try{if(document.activeElement&&document.activeElement.id==='otp')return;const s=await J('/alps/status');const R=s.run;if(!R){$('rs').textContent='없음';return;}let h='<div>'+esc(R.fileName)+' · '+esc(R.status)+'</div>'+R.steps.map((x)=>'<div>'+({ok:'✓',run:'…',wait:'⏸',err:'✗',skip:'–',todo:'·'}[x.st]||'')+' '+esc(x.l)+' <span class=mu>'+esc(x.d)+'</span><div class=bar><i style="width:'+(x.pct||0)+'%"></i></div></div>').join('');
 if(R.error)h+='<div class=er>'+esc(R.error)+'</div>';if(R.need){h+='<div class=card>'+esc(R.need.msg)+'<br>'+(R.need.type==='otp'?'<input type=text id=otp placeholder="번호"><button data-k=otp>넣기</button>':R.need.type==='choice'?R.need.options.map((o)=>'<button data-p="'+esc(o)+'">'+esc(o)+'</button> ').join(''):'<button data-k=continue>계속</button>')+' <button data-k=stop>멈춤</button></div>';}
 $('rs').innerHTML=h;$('rs').querySelectorAll('button').forEach((b)=>b.onclick=()=>J('/alps/input',b.dataset.p?{kind:'choice',pick:b.dataset.p}:b.dataset.k==='otp'?{kind:'otp',code:$('otp').value}:{kind:b.dataset.k}));}catch(e){}}
load();setInterval(tick,1500);tick();</script></body></html>`;

function start(job, onChange) { if (RUN && !['done', 'error'].includes(RUN.status)) throw new Error('이미 처리 중입니다'); const fn = String(job.fileName || ''); if (!/^판매완료\d{8}\.xlsx$/.test(fn)) throw new Error('파일 이름은 판매완료YYYYMMDD.xlsx');
  if (!job.b64 || job.b64.length > 20 * 1048576) throw new Error('파일이 없거나 너무 큼');
  RUN = { id: crypto.randomBytes(6).toString('hex'), at: kst(), fileName: fn, status: 'run', t0: Date.now(), log: [], steps: STEPS.map(([k, l]) => ({ k, l, st: 'todo', pct: 0, d: '' })), step: 'login', detail: '', need: null, error: null, summary: {}, onChange };
  RUN.resume = !!job.resume; try { wrJ(F.lastJob, { fileName: fn, rows: job.rows || [], firstOne: job.firstOne, at: kst() }); fs.mkdirSync(F.up, { recursive: true }); fs.writeFileSync(path.join(F.up, fn), Buffer.from(job.b64, 'base64')); } catch (e) {}
  log(`${job.resume ? '이어서 ' : '시작 '}${fn} · ${(job.rows || []).length}줄`); runJob(job); return pub(); }
/* (0.2.5) 「이어서 진행」 — 마지막 일(같은 파일·같은 줄)로 다시: ALPS 목록에 이미 있으면 접수 건너뛰고 인쇄되지 않은 상자부터 · 목록에 없으면 처음부터 */
function resume(o) { const L = rdJ(F.lastJob, null); if (!L) throw new Error('이어서 할 마지막 일이 없음'); const fp = path.join(F.up, L.fileName); if (!fs.existsSync(fp)) throw new Error('마지막 파일이 이 PC에 없음 — 웹앱에서 ALPS 자동 처리로 다시'); return start({ ...L, b64: fs.readFileSync(fp).toString('base64'), resume: true, firstOne: o && o.firstOne != null ? !!o.firstOne : L.firstOne, boxOk: !!(o && o.boxOk) }, RUN && RUN.onChange); }
function result(id) { return RUN && RUN.id === id && RUN.result ? RUN.result : null; }
function reset() { if (RUN && !['done', 'error'].includes(RUN.status)) return false; RUN = null; return true; }

module.exports = { VERSION, pageHtml, cfg, setCfg, saveCred, credInfo, start, resume, history, input, status: pub, result, reset, ROOT, keyInfo, link, remoteState, remoteTick, _t: { REM, cloudCall, boxCount, orderCount, histAdd, pairRows, rowsSig, toAoa, PG, Browser, CDP, protect, unprotect } };
