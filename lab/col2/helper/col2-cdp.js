/* col2-cdp.js — 번외 작업 창 크롬(따로 된 프로필 · 로그인 없음 · 확장 없음)을 띄우고 DevTools 프로토콜(CDP)로 조종
 * 운영 ALPS 도우미(readnow-alps.js)와 같은 길: npm 없이 Node 22 기본 WebSocket · --remote-debugging-port=0(127.0.0.1) · DevToolsActivePort 파일로 주소를 받음
 * 읽기는 운영 수집기의 '공개 화면 쿠키 없이 읽기'(lookDoc0 · pubProd 로그인 없음 길)와 똑같이:
 *   알라딘 탭 안에서 fetch(credentials:'omit') → ReadnowAladin.decode → DOMParser → 점검·로그인 화면 확인 → ReadnowProducts.parseProductPage
 *   운영 공용 파일(readnow-aladin-core.js·readnow-products-core.js)을 그대로 넣어 씀 · 넣는 곳은 화면과 떨어진 칸(isolated world) — 알라딘 화면 코드가 우리 변수를 못 봄 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const http = require('http');
const httpJson = (url, ms) => new Promise((res) => { const r = http.get(url, { timeout: ms || 1500 }, (x) => { let b = ''; x.setEncoding('utf8'); x.on('data', (c) => (b += c)); x.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res(null); } }); }); r.on('error', () => res(null)); r.on('timeout', () => { r.destroy(); res(null); }); });
const lastLine = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(-1)[0] || '';
/* 바로 꺼진 까닭을 사람 말로 — 종료 코드 0이 곧바로면 '같은 프로필을 다른 크롬이 쥐고 있어 그쪽에 넘기고 끝남'이 가장 흔함 */
function exitWhy(x, freed) { x = x || {}; const code = x.code == null ? (x.signal || '?') : x.code; const sec = Math.round((x.ms || 0) / 100) / 10;
  const hint = x.code === 0 ? '같은 프로필(col2-work-chrome)을 쥔 다른 크롬에 일을 넘기고 끝난 듯' : x.code === 21 || x.code === 0x15 ? '프로필 잠금(다른 크롬이 쓰는 중)' : /실행 실패/.test(x.tail || '') ? '크롬 실행 파일 문제' : '크롬이 스스로 끝남';
  return `번외 크롬이 바로 꺼짐(${sec}초 · 종료 코드 ${code} · ${hint}${x.tail ? ' · 마지막 줄: ' + String(x.tail).slice(0, 160) : ''}${freed && (freed.closed || freed.killed) ? ` · 옛 번외 크롬 ${freed.closed + freed.killed}개를 먼저 닫았음` : ''})`; }

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cb = new Map(); this.on = []; this.closed = false;
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString()); } catch (e) { return; }
      if (m.id && this.cb.has(m.id)) { const { res, rej, tm } = this.cb.get(m.id); this.cb.delete(m.id); clearTimeout(tm); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else if (m.method) for (const f of this.on.slice()) { try { f(m.method, m.params || {}, m.sessionId || null); } catch (e) {} } };
    ws.onclose = () => { this.closed = true; for (const { rej, tm } of this.cb.values()) { clearTimeout(tm); rej(new Error('크롬 연결이 끊김')); } this.cb.clear(); }; }
  send(method, params, sessionId, timeoutMs) { if (this.closed) return Promise.reject(new Error('크롬 연결이 끊김')); const id = ++this.id; const msg = { id, method, params: params || {} }; if (sessionId) msg.sessionId = sessionId;
    return new Promise((res, rej) => { const tm = setTimeout(() => { this.cb.delete(id); rej(new Error('크롬 응답 없음: ' + method)); }, timeoutMs || 30000); this.cb.set(id, { res, rej, tm }); this.ws.send(JSON.stringify(msg)); }); }
  close() { try { this.ws.close(); } catch (e) {} }
  static connect(url) { if (typeof WebSocket !== 'function') return Promise.reject(new Error(`Node ${process.version}에는 WebSocket이 없음 — Node 22 이상이 필요`)); return new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(new CDP(ws)); ws.onerror = () => rej(new Error('크롬 DevTools 연결 실패')); }); }
}

/* 알라딘 탭 안(떨어진 칸)에서 도는 읽기 — 운영 lookDoc0의 공개 화면 길과 같은 순서 · 결과는 값으로만 돌려줌 */
const READ_FN = `async (url, tmo) => { const AL = globalThis.ReadnowAladin, P = globalThis.ReadnowProducts; if (!AL || !P) return { ok: false, why: '운영 공용 파일이 안 들어감' };
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), tmo); let r, buf; const t0 = Date.now();
  try { r = await fetch(url, { credentials: 'omit', cache: 'no-store', signal: ac.signal }); buf = r.ok ? await r.arrayBuffer() : null; } catch (e) { return { ok: false, why: e.name === 'AbortError' ? '알라딘이 ' + Math.round(tmo / 1000) + '초 안에 답하지 않음' : '읽기 실패: ' + e.message, kind: e.name === 'AbortError' ? 'timeout' : 'error' }; } finally { clearTimeout(to); }
  if (!r.ok) return { ok: false, status: r.status, why: '서버 응답 ' + r.status, kind: r.status === 429 || r.status === 503 ? '429' : 'error' };
  const html = AL.decode(buf, r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html');
  if (AL.isMaintenance(doc)) return { ok: false, why: '알라딘 점검 중', kind: 'error' };
  if (AL.looksLoggedOut(r.url, doc) || /adult/i.test(r.url || '')) return { ok: false, needLogin: true, why: '로그인 없이는 못 보는 화면(19금 등) — 번외 일꾼은 로그인하지 않으므로 건너뜀' };
  if (!/알라딘/.test(doc.title || '') && !doc.querySelector('link[rel="canonical"]')) return { ok: false, why: '알라딘 상품 화면이 아님(제목·canonical 없음)', kind: 'error' };
  const page = P.parseProductPage(doc, r.url); return { ok: true, page, finalUrl: r.url, len: html.length, ms: Date.now() - t0, coreVer: P.VERSION, alVer: AL.VERSION }; }`;

/* (0.1.9) 그림자 일 읽기 — 같은 길(쿠키 없이 fetch → decode → DOMParser → 점검·로그인 화면 확인) 뒤 정한 해석 함수 하나만(P=상품 · S=판매자 · L=운영 본체에서 떼어 온 함수)
 *  해석 함수 이름은 정해 둔 것만(아래 표) — 다른 글자를 실행하지 않음 */
const PARSE_OK = ['P.parseProductPage', 'P.parseUsedPage', 'S.parseShopSummary', 'S.parseSurveyPage', 'L.benchParse', 'L.benchPage', /* (11/12 handoff3) 🎯 끝까지 — 줄 + 끝 쪽 */ /* (11/10) 🗣 판매자 목소리 — 번외 해석(shadow/col2-voice-core.js) */ 'V.findQnaLink', 'V.parseQnaPage'];
const READ_JOB_FN = `async (url, pn, tmo) => { const AL = globalThis.ReadnowAladin, M = { P: globalThis.ReadnowProducts, S: globalThis.ReadnowSellers, L: globalThis.Col2Lift, V: globalThis.Col2Voice };
  const [ns, fn] = String(pn).split('.'); const f = pn === 'L.benchPage' ? (M.L && M.L.benchParse && M.L.benchLastPage ? (d, h) => ({ rows: M.L.benchParse(d), last: M.L.benchLastPage(d, h) }) : null) : M[ns] && M[ns][fn]; if (!AL || typeof f !== 'function') return { ok: false, why: '해석 함수가 안 들어감: ' + pn, kind: 'error' };
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), tmo); let r, buf; const t0 = Date.now();
  try { r = await fetch(url, { credentials: 'omit', cache: 'no-store', signal: ac.signal }); buf = r.ok ? await r.arrayBuffer() : null; } catch (e) { return { ok: false, why: e.name === 'AbortError' ? '알라딘이 ' + Math.round(tmo / 1000) + '초 안에 답하지 않음' : '읽기 실패: ' + e.message, kind: e.name === 'AbortError' ? 'timeout' : 'error' }; } finally { clearTimeout(to); }
  if (!r.ok) return { ok: false, status: r.status, why: '서버 응답 ' + r.status, kind: r.status === 429 || r.status === 503 ? '429' : 'error' };
  const html = AL.decode(buf, r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html');
  if (AL.isMaintenance(doc)) return { ok: false, why: '알라딘 점검 중', kind: 'error' };
  if (AL.looksLoggedOut(r.url, doc) || /adult/i.test(r.url || '')) return { ok: false, needLogin: true, why: '로그인 없이는 못 보는 화면 — 번외 일꾼은 로그인하지 않으므로 건너뜀' };
  let page; try { page = ns === 'P' && fn === 'parseProductPage' ? f(doc, r.url) : pn === 'L.benchPage' ? f(doc, html) : f(doc); } catch (e) { return { ok: false, why: '해석 오류: ' + e.message, kind: 'error' }; }
  return { ok: true, page: JSON.parse(JSON.stringify(page == null ? null : page)), finalUrl: r.url, len: html.length, ms: Date.now() - t0 }; }`;

class Browser {
  constructor(o) { this.o = o; this.proc = null; this.cdp = null; this.sid = null; this.frameId = null; this.ctxId = null; this.dead = true; this.landed = false; this.startedAt = 0; }
  alive() { return !!(!this.dead && (this.adopted || this.proc) && this.ready && this.cdp && !this.cdp.closed); } /* (0.1.2) ready = 띄우기를 끝까지 마침(탭 붙이기까지) */
  args() { const o = this.o; const r = o.rect || {}; const a = [];
    if (o.headless) a.push('--headless=new'); else a.push(`--window-position=${Number.isFinite(r.x) ? r.x : -32000},${Number.isFinite(r.y) ? r.y : 40}`);
    a.push(`--window-size=${r.w || 1280},${r.h || 900}`, '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${o.profile}`,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--mute-audio', '--disable-default-apps', '--hide-crash-restore-bubble',
      /* 가려져도 늦추지 않음(로거 공개 수집 크롬과 같은 세 플래그) — 이 크롬에만 적용(정범님 크롬 바로가기는 그대로) */
      '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
      /* (0.1.40 🔬 정밀 점검 11/12) 로거 공개 수집 크롬(install.ps1)·그려 읽기 크롬(readnow-local.js)과 같게 — WebRTC가 프록시를 돌아 와이파이 주소를 내보내지 않게 · 크롬 자체 배경 통신 끔 */
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp', '--disable-background-networking');
    /* (11/11 col2fix6 · 로거 '알라딘 첫 화면을 못 엶: net::ERR_NAME_NOT_RESOLVED') 로거는 이 크롬도 운영 로거 도우미(127.0.0.1:8899) 길로만 — 그 도우미가 알라딘을 테더링으로만 내보내고(와이파이로 안 샘) 테더링이 안 되면 거절
     *  예전엔 프록시 없이 윈도우 기본 길(와이파이 · 테더링은 9000 뒤로)로 나가려 했고, 로거 hosts가 알라딘 주소를 0.0.0.0으로 막아 둬(local/install.ps1 ②) 이름을 못 찾음 */
    if (o.proxy) a.push(`--proxy-server=${o.proxy}`);
    if (process.env.RN_COL2_NOSANDBOX) a.unshift('--no-sandbox'); a.push('about:blank'); return a; }
  /* (0.1.2 정범님 11/06 '숨은 크롬이 켜자마자 꺼짐') 띄우기 전에 이 프로필을 쥐고 있는 옛 번외 크롬을 치움
   *  크롬은 같은 --user-data-dir를 다른 크롬이 쓰고 있으면 그 크롬에 일을 넘기고 곧바로 끝남(종료 코드 0) → '바로 꺼짐'이 거듭되어 지킴이가 한 시간 4번 상한에 걸림
   *  옛 번외 크롬이 남는 길: Windows는 부모(도우미)가 죽어도 자식 크롬이 살아남음(인쇄 도우미가 새 판으로 바꾸며 도우미를 끝냄 · 도우미가 죽음) · 조종 연결만 끊기고 크롬은 살아 있음
   *  ① DevToolsActivePort가 살아 있으면 그 크롬에 Browser.close(점잖게) ② 그래도 남으면 이 프로필 이름이 명령 줄에 든 크롬만 끝냄(o.stale — 정범님 크롬·운영 작업 창은 이름이 달라 안 건드림) ③ 남은 잠금 파일을 치움 */
  async freeProfile() { const o = this.o; const pf = path.join(o.profile, 'DevToolsActivePort'); const out = { closed: 0, killed: 0, locks: 0 };
    let port = null; try { port = +String(fs.readFileSync(pf, 'utf8')).split('\n')[0].trim() || null; } catch (e) {}
    if (port) { const v = await httpJson(`http://127.0.0.1:${port}/json/version`, 1500); if (v && v.webSocketDebuggerUrl) { try { const c = await CDP.connect(v.webSocketDebuggerUrl); await c.send('Browser.close', {}, null, 4000).catch(() => {}); c.close(); out.closed = 1; } catch (e) {} for (let i = 0; i < 25 && (await httpJson(`http://127.0.0.1:${port}/json/version`, 600)); i++) await sleep(200); } }
    if (o.stale) { try { const r = await o.stale(); out.killed = (r && r.killed) || 0; if (r && r.left) out.left = r.left; if (out.killed) await sleep(800); } catch (e) {} }
    /* 남은 잠금 — 쥔 프로세스가 이미 없을 때만 치움(살아 있는 크롬의 잠금을 지우면 두 크롬이 한 프로필을 써서 망가짐) · Windows lockfile은 쥔 크롬이 있으면 지워지지 않음 */
    let holder = null; try { const t = fs.readlinkSync(path.join(o.profile, 'SingletonLock')); const pid = +(String(t).match(/-(\d+)$/) || [])[1]; if (pid) { try { process.kill(pid, 0); holder = pid; } catch (e) {} } } catch (e) {}
    if (!holder) for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'lockfile']) { try { fs.lstatSync(path.join(o.profile, f)); fs.rmSync(path.join(o.profile, f), { force: true }); out.locks++; } catch (e) {} } else out.holder = holder;
    try { fs.unlinkSync(pf); } catch (e) {} if (!this.retried) this.freed0 = out; this.freed = out; return out; }
  /* (0.1.3 정범님 11/09 '번외 수집기 재개' — HOME 400번 '바로 꺼짐(0.1초 · 종료 코드 0)' · 매번 '옛 번외 크롬 1개를 먼저 닫았음')
   *  매번 1개를 닫았다는 것 = 우리가 띄운 크롬이 0으로 끝난 뒤에도 같은 프로필(col2-work-chrome)을 쥔 크롬이 살아서 조종 주소(DevToolsActivePort)까지 새로 썼다는 뜻
   *  → 크롬이 일을 다른 크롬(스스로 다시 띄운 것 · 프로필을 쥔 것)에 넘기고 끝난 것. 0.1.2는 이걸 '실패'로 보고 다음 바퀴에 그 크롬을 닫고 또 띄워 끝없이 되풀이
   *  고침: ① 띄운 크롬이 0(또는 21)으로 곧바로 끝나면 바로 실패로 보지 않고 handoffMs 동안 이 프로필의 조종 주소가 생기는지 봄 → 생기면 그 크롬을 '넘겨받아' 그대로 씀
   *        ② 조종 주소가 안 생기면(조종 길 없는 크롬이 쥐고 있음) 이 프로필 이름이 명령 줄에 든 크롬만 끝내고 잠금을 치운 뒤 한 번 더 띄움
   *        ③ 그래도 안 되면 그때 실패(종료 코드·마지막 줄은 그대로 남김) — 정범님 크롬은 프로필 이름이 달라 절대 안 건드림 */
  async spawnOnce(pf) { const o = this.o; this.dead = false; this.ready = false; this.landed = false; this.ctxId = null; this.adopted = false; this.startedAt = Date.now(); this.exit = null; const tail = { s: '' };
    /* 종료 코드·마지막 출력 줄을 남김(상태 창·웹앱에 원인으로 보임) — 출력은 끝 2KB만 */
    const keep = (c) => { tail.s = (tail.s + String(c)).slice(-2048); };
    this.proc = cp.spawn(o.exe, this.args(), { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false, detached: false }); const pr = this.proc;
    pr.stdout.on('data', keep); pr.stderr.on('data', keep);
    pr.on('exit', (code, sig) => { if (this.proc !== pr) return; if (!this.adopted) this.dead = true; this.ctxId = this.adopted ? this.ctxId : null; this.exit = { code, signal: sig || null, ms: Date.now() - this.startedAt, tail: lastLine(tail.s), at: Date.now() }; });
    pr.on('error', (e) => { if (this.proc !== pr) return; this.dead = true; this.exit = { code: null, signal: null, ms: Date.now() - this.startedAt, tail: '크롬 실행 실패: ' + e.message, at: Date.now() }; });
    const hoMs = Number.isFinite(+o.handoffMs) ? +o.handoffMs : 10000; let ws = null, goneAt = 0;
    for (let i = 0; i < 150 && !ws; i++) { await sleep(200);
      try { const [port, p2] = fs.readFileSync(pf, 'utf8').split('\n'); if (port && p2) ws = `ws://127.0.0.1:${port.trim()}${p2.trim()}`; } catch (e) {}
      if (ws && this.dead) { /* 띄운 크롬은 끝났는데 이 프로필의 조종 주소가 새로 생김 = 다른 크롬이 넘겨받음 → 살아 있으면 그대로 씀 */
        const v = await httpJson(`http://127.0.0.1:${ws.split(':')[2].split('/')[0]}/json/version`, 1500); if (!v || !v.webSocketDebuggerUrl) { ws = null; try { fs.unlinkSync(pf); } catch (e) {} } else { this.adopted = true; this.dead = false; } }
      if (!ws && this.dead) { if (!goneAt) goneAt = Date.now(); const handoff = this.exit && (this.exit.code === 0 || this.exit.code === 21 || this.exit.code === 0x15);
        if (!handoff || Date.now() - goneAt >= hoMs) return { ws: null, tail }; } }
    return { ws, tail }; }
  async launch() { const o = this.o; if (!o.exe) throw new Error('크롬을 못 찾음'); fs.mkdirSync(o.profile, { recursive: true }); const pf = path.join(o.profile, 'DevToolsActivePort');
    await this.freeProfile(); this.retried = 0;
    let r = await this.spawnOnce(pf);
    if (!r.ws && this.dead && this.exit && (this.exit.code === 0 || this.exit.code === 21 || this.exit.code === 0x15)) { /* ② 조종 길 없는 크롬이 프로필을 쥐고 있음 → 그 크롬만 끝내고 한 번 더 */
      const first = this.exit; this.retried = 1; this.firstExit = first; const f2 = await this.freeProfile(); this.freed = { closed: (this.freed0 ? this.freed0.closed : 0) + f2.closed, killed: (this.freed0 ? this.freed0.killed : 0) + f2.killed, locks: f2.locks };
      r = await this.spawnOnce(pf); }
    const ws = r.ws, tail = r.tail;
    if (!ws && this.dead) { await sleep(150); throw new Error(exitWhy(this.exit, this.freed) + (this.retried ? ' · 프로필을 쥔 크롬을 닫고 한 번 더 띄워도 같음' : '')); }
    if (!ws) { this.kill(); throw new Error('번외 크롬 DevTools 주소를 못 받음(30초)' + (tail.s ? ' · 마지막 줄: ' + lastLine(tail.s) : '')); }
    this.cdp = await CDP.connect(ws); this.cdp.on.push((m, p, sid) => { if (m === 'Page.frameNavigated' && sid === this.sid && !p.frame.parentId) { this.ctxId = null; this.frameUrl = p.frame.url; } if (m === 'Runtime.executionContextDestroyed' && p.executionContextId === this.ctxId) this.ctxId = null; });
    const { targetInfos } = await this.cdp.send('Target.getTargets'); let t = targetInfos.find((x) => x.type === 'page'); if (!t) t = { targetId: (await this.cdp.send('Target.createTarget', { url: 'about:blank' })).targetId };
    const { sessionId } = await this.cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true }); this.sid = sessionId;
    await this.cdp.send('Page.enable', {}, sessionId); await this.cdp.send('Runtime.enable', {}, sessionId).catch(() => {});
    if (o.headless) { /* 화면 없는 크롬은 이름표에 'HeadlessChrome'이 남음 → 보통 크롬 이름표로(보고서 ①안 주의점) */ try { const v = await this.cdp.send('Browser.getVersion'); const ua = String(v.userAgent || '').replace(/HeadlessChrome/g, 'Chrome'); if (ua) await this.cdp.send('Network.setUserAgentOverride', { userAgent: ua }, sessionId); } catch (e) {} }
    this.ready = true; return this; }
  /* 처음 한 번 알라딘 첫 화면에 들어감(사람처럼 들어온 탭 — 이 탭 안에서 같은 출처로 읽음) */
  async land(url, timeoutSec) { if (this.landed) return; const sid = this.sid; const done = new Promise((res) => { const f = (m, p, s) => { if (s === sid && m === 'Page.loadEventFired') { this.cdp.on = this.cdp.on.filter((x) => x !== f); res(true); } }; this.cdp.on.push(f); setTimeout(() => res(false), (timeoutSec || 25) * 1000); });
    const nav = await this.cdp.send('Page.navigate', { url }, sid); if (nav && nav.errorText) throw new Error('알라딘 첫 화면을 못 엶: ' + nav.errorText + (this.o.netHint ? this.o.netHint(nav.errorText) : '')); this.frameId = nav.frameId; await done; this.landed = true; this.ctxId = null; }
  async world(srcs) { if (this.ctxId) return this.ctxId; const ft = await this.cdp.send('Page.getFrameTree', {}, this.sid); this.frameId = ft.frameTree.frame.id;
    const w = await this.cdp.send('Page.createIsolatedWorld', { frameId: this.frameId, worldName: 'rn3-col2', grantUniveralAccess: false }, this.sid); const ctx = w.executionContextId;
    for (const s of srcs) { const r = await this.cdp.send('Runtime.evaluate', { expression: s, contextId: ctx, returnByValue: true }, this.sid); if (r.exceptionDetails) throw new Error('운영 공용 파일 넣기 실패: ' + String(r.exceptionDetails.text || '').slice(0, 120)); }
    this.ctxId = ctx; return ctx; }
  async read(url, srcs, timeoutSec) { const ctx = await this.world(srcs); const r = await this.cdp.send('Runtime.evaluate', { expression: `(${READ_FN})(${JSON.stringify(url)}, ${(timeoutSec || 30) * 1000})`, contextId: ctx, awaitPromise: true, returnByValue: true }, this.sid, ((timeoutSec || 30) + 10) * 1000);
    if (r.exceptionDetails) return { ok: false, why: '읽기 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 200), kind: 'error' }; return r.result.value; }
  async readJob(url, pn, srcs, timeoutSec) { if (!PARSE_OK.includes(pn)) return { ok: false, why: '정하지 않은 해석 함수: ' + pn, kind: 'error' }; const ctx = await this.world(srcs);
    const r = await this.cdp.send('Runtime.evaluate', { expression: `(${READ_JOB_FN})(${JSON.stringify(url)}, ${JSON.stringify(pn)}, ${(timeoutSec || 30) * 1000})`, contextId: ctx, awaitPromise: true, returnByValue: true }, this.sid, ((timeoutSec || 30) + 10) * 1000);
    if (r.exceptionDetails) return { ok: false, why: '읽기 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 200), kind: 'error' }; return r.result.value; }
  /* (0.1.10 정범님 11/10 '아직 안 도는 9가지도 그림자로') 그려 읽기 — 이 번외 크롬 안 쿠키 없는 따로 된 칸(새 브라우저 맥락 · 일 하나 끝나면 버림)의 보이지 않는 탭
   *  운영 숨은 창(credentialless iframe · 알림 창 못 띄움)·도우미 /render(따로 된 프로필 · 화면 없이)와 같은 뜻: 로그인 없음 · 쿠키 없음 · 알림 창은 저절로 닫음 · 작업 창 화면에는 탭이 안 보임 */
  async openTab(url, timeoutSec) { const c = this.cdp; const { browserContextId: bc } = await c.send('Target.createBrowserContext', { disposeOnDetach: true });
    let tid; try { tid = (await c.send('Target.createTarget', { url: 'about:blank', browserContextId: bc, hidden: true, background: true })).targetId; } catch (e) { tid = (await c.send('Target.createTarget', { url: 'about:blank', browserContextId: bc, newWindow: true, background: true, left: -32000, top: 40, width: 1300, height: 2000 })).targetId; }
    const T = { tid, bc, sid: null, ctx: null };
    try { T.sid = (await c.send('Target.attachToTarget', { targetId: tid, flatten: true })).sessionId; await c.send('Page.enable', {}, T.sid); await c.send('Runtime.enable', {}, T.sid).catch(() => {});
      const dlg = (m, p, s) => { if (s === T.sid && m === 'Page.javascriptDialogOpening') c.send('Page.handleJavaScriptDialog', { accept: false }, T.sid).catch(() => {}); }; c.on.push(dlg); T.off = () => { c.on = c.on.filter((x) => x !== dlg); };
      const done = new Promise((res) => { const f = (m, p, s) => { if (s === T.sid && m === 'Page.loadEventFired') { c.on = c.on.filter((x) => x !== f); res(true); } }; c.on.push(f); setTimeout(() => { c.on = c.on.filter((x) => x !== f); res(false); }, (timeoutSec || 25) * 1000); });
      const nav = await c.send('Page.navigate', { url }, T.sid); if (nav && nav.errorText) throw new Error('화면을 못 엶: ' + nav.errorText); T.loaded = await done; return T; }
    catch (e) { await this.closeTab(T); throw e; } }
  async closeTab(T) { if (!T) return; try { T.off && T.off(); } catch (e) {} try { await this.cdp.send('Target.closeTarget', { targetId: T.tid }, null, 5000); } catch (e) {} try { await this.cdp.send('Target.disposeBrowserContext', { browserContextId: T.bc }, null, 5000); } catch (e) {} }
  async tabWorld(T, srcs) { if (T.ctx) return T.ctx; const ft = await this.cdp.send('Page.getFrameTree', {}, T.sid); const w = await this.cdp.send('Page.createIsolatedWorld', { frameId: ft.frameTree.frame.id, worldName: 'rn3-col2', grantUniveralAccess: false }, T.sid);
    for (const s of srcs || []) { const r = await this.cdp.send('Runtime.evaluate', { expression: s, contextId: w.executionContextId, returnByValue: true }, T.sid); if (r.exceptionDetails) throw new Error('운영 공용 파일 넣기 실패: ' + String(r.exceptionDetails.text || '').slice(0, 120)); }
    return (T.ctx = w.executionContextId); }
  async evalIn(sid, ctx, expr, ms) { const r = await this.cdp.send('Runtime.evaluate', { expression: expr, contextId: ctx, awaitPromise: true, returnByValue: true }, sid, ms || 60000);
    if (r.exceptionDetails) return { ok: false, why: '읽기 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 200), kind: 'error' }; return r.result.value; }
  /* 도우미 /render와 같은 꼴 { ok, html, ms } — opt.re(링크 꼴)가 보이거나 wait(ms)가 지나면 그때 화면 HTML */
  async render(url, opt) { const o = opt || {}; const wait = Math.max(3000, Math.min(30000, +o.wait || 12000)); const t0 = Date.now(); let T = null;
    try { T = await this.openTab(url, Math.ceil(wait / 1000) + 10); const ctx = await this.tabWorld(T, []); const re = o.re ? JSON.stringify([o.re, o.reFlags || '']) : 'null';
      /* (11/11 col2rep2 · 외부 정보 '못 읽음 100%' — 예스24 도서·예스24 중고·네이버 도서) 예전엔 링크 꼴(/goods/숫자)이 하나라도 보이면 곧바로 HTML을 떴는데, 예스24·네이버 검색 화면은 머리·광고·추천에 같은 꼴 링크가 먼저 있고
       *  검색 결과 목록(itemUnit 등)은 조금 뒤 따로 불러옴 → 결과 목록이 없는 HTML을 떠 '검색 결과 목록이 화면에 없음'으로 늘 실패
       *  운영 도우미 /render(readnow-local.js)는 화면을 1280×6000으로 크게 열고 wait 동안 다 그린 뒤 뜸(--virtual-time-budget · --dump-dom) → 같은 뜻으로: 화면 크게(지연 로딩 칸이 참) · 최소 minMs 기다림 · 그 뒤 링크 수가 3번(1.2초) 그대로일 때 뜸 · 최대 wait */
      try { await this.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 6000, deviceScaleFactor: 1, mobile: false }, T.sid); } catch (e) {}
      const minMs = Math.min(wait, Math.max(1500, +o.minMs || 5000));
      const html = await this.evalIn(T.sid, ctx, `(async () => { const R = ${re}; const re = R ? new RegExp(R[0], R[1]) : null; const t0 = Date.now(); let last = -1, same = 0; for (;;) { const n = re ? [...document.querySelectorAll('a[href]')].filter((a) => re.test(a.href)).length : 0; same = n === last ? same + 1 : 0; last = n; const el = Date.now() - t0; if ((n > 0 && el >= ${minMs} && same >= 3) || el > ${wait}) break; await new Promise((r) => setTimeout(r, 400)); } await new Promise((r) => setTimeout(r, 300)); return document.documentElement ? document.documentElement.outerHTML : ''; })()`, wait + 15000);
      if (typeof html !== 'string' || !html) return { ok: false, why: '그리기 실패: ' + ((html && html.why) || '빈 화면') }; return { ok: true, html: html.slice(0, 3000000), ms: Date.now() - t0 }; }
    catch (e) { return { ok: false, why: '그리기 실패: ' + e.message }; } finally { await this.closeTab(T); } }
  /* 따로 된 칸 탭에서 화면을 열고(그려) 운영 공용 파일·떼어 온 함수·받침을 넣은 뒤 expr 하나를 부름 — 끝나면 탭·칸을 버림 */
  async tabJob(url, srcs, expr, timeoutSec) { let T = null; try { T = await this.openTab(url, timeoutSec || 25); const ctx = await this.tabWorld(T, srcs); return await this.evalIn(T.sid, ctx, expr, ((timeoutSec || 25) + 40) * 1000); }
    catch (e) { return { ok: false, why: '그려 읽기 실패: ' + e.message, kind: 'error' }; } finally { await this.closeTab(T); } }
  /* 알라딘 탭(이미 들어온 탭)의 떨어진 칸에서 expr 하나 — 떼어 온 함수(검색 시세)·그린 HTML 해석(운영 extRenderHelper) */
  async mainJob(srcs, expr, timeoutSec) { const ctx = await this.world(srcs); return this.evalIn(this.sid, ctx, expr, ((timeoutSec || 30) + 10) * 1000); }
  /* 시험용: 알라딘 화면 쪽(보통 칸)에서 우리 변수가 보이는지 */
  async mainEval(expr) { const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, this.sid); return r.result ? r.result.value : null; }
  /* 넘겨받은 크롬(adopted)은 우리 자식 프로세스가 아니라 proc.kill로 못 닫음 → 조종 길로 Browser.close · 남으면 다음 띄우기의 freeProfile이 이 프로필 크롬만 끝냄 */
  kill() { const c = this.cdp, ad = this.adopted && c && !c.closed; if (ad) { try { c.send('Browser.close', {}, null, 3000).catch(() => {}); } catch (e) {} setTimeout(() => { try { c.close(); } catch (e) {} }, 300); } else { try { if (c) c.close(); } catch (e) {} }
    try { if (this.proc && this.proc.exitCode == null && !this.proc.killed) this.proc.kill(); } catch (e) {} this.dead = true; this.ctxId = null; this.landed = false; }
  /* 조종 연결만 끊기고 크롬은 살아 있는지(그대로 두면 같은 프로필을 쥔 채 남아 다음 띄우기가 바로 꺼짐) */
  orphan() { if (this.adopted) return !!(this.cdp && this.cdp.closed); return !!(this.proc && this.proc.exitCode == null && this.proc.signalCode == null && (!this.cdp || this.cdp.closed)); }
  async close() { try { if (this.cdp && !this.cdp.closed) await this.cdp.send('Browser.close', {}, null, 5000).catch(() => {}); } catch (e) {} await sleep(300); this.kill(); }
}
module.exports = { CDP, Browser, READ_FN, READ_JOB_FN, PARSE_OK, exitWhy };
