/* col2-cdp.js — 번외 작업 창 크롬(따로 된 프로필 · 로그인 없음 · 확장 없음)을 띄우고 DevTools 프로토콜(CDP)로 조종
 * 운영 ALPS 도우미(readnow-alps.js)와 같은 길: npm 없이 Node 22 기본 WebSocket · --remote-debugging-port=0(127.0.0.1) · DevToolsActivePort 파일로 주소를 받음
 * 읽기는 운영 수집기의 '공개 화면 쿠키 없이 읽기'(lookDoc0 · pubProd 로그인 없음 길)와 똑같이:
 *   알라딘 탭 안에서 fetch(credentials:'omit') → ReadnowAladin.decode → DOMParser → 점검·로그인 화면 확인 → ReadnowProducts.parseProductPage
 *   운영 공용 파일(readnow-aladin-core.js·readnow-products-core.js)을 그대로 넣어 씀 · 넣는 곳은 화면과 떨어진 칸(isolated world) — 알라딘 화면 코드가 우리 변수를 못 봄 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

class Browser {
  constructor(o) { this.o = o; this.proc = null; this.cdp = null; this.sid = null; this.frameId = null; this.ctxId = null; this.dead = true; this.landed = false; this.startedAt = 0; }
  alive() { return !!(this.proc && !this.dead && this.cdp && !this.cdp.closed); }
  args() { const o = this.o; const r = o.rect || {}; const a = [];
    if (o.headless) a.push('--headless=new'); else a.push(`--window-position=${Number.isFinite(r.x) ? r.x : -32000},${Number.isFinite(r.y) ? r.y : 40}`);
    a.push(`--window-size=${r.w || 1280},${r.h || 900}`, '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${o.profile}`,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--mute-audio', '--disable-default-apps', '--hide-crash-restore-bubble',
      /* 가려져도 늦추지 않음(로거 공개 수집 크롬과 같은 세 플래그) — 이 크롬에만 적용(정범님 크롬 바로가기는 그대로) */
      '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding');
    if (process.env.RN_COL2_NOSANDBOX) a.unshift('--no-sandbox'); a.push('about:blank'); return a; }
  async launch() { const o = this.o; if (!o.exe) throw new Error('크롬을 못 찾음'); fs.mkdirSync(o.profile, { recursive: true }); const pf = path.join(o.profile, 'DevToolsActivePort'); try { fs.unlinkSync(pf); } catch (e) {}
    this.dead = false; this.landed = false; this.ctxId = null; this.startedAt = Date.now();
    this.proc = cp.spawn(o.exe, this.args(), { stdio: 'ignore', windowsHide: false, detached: false }); this.proc.on('exit', () => { this.dead = true; this.ctxId = null; }); this.proc.on('error', () => { this.dead = true; });
    let ws = null; for (let i = 0; i < 150 && !ws; i++) { await sleep(200); if (this.dead) throw new Error('번외 크롬이 바로 꺼짐(같은 프로필 크롬이 이미 떠 있으면 닫아 주세요)'); try { const [port, p2] = fs.readFileSync(pf, 'utf8').split('\n'); if (port && p2) ws = `ws://127.0.0.1:${port.trim()}${p2.trim()}`; } catch (e) {} }
    if (!ws) { this.kill(); throw new Error('번외 크롬 DevTools 주소를 못 받음'); }
    this.cdp = await CDP.connect(ws); this.cdp.on.push((m, p, sid) => { if (m === 'Page.frameNavigated' && sid === this.sid && !p.frame.parentId) { this.ctxId = null; this.frameUrl = p.frame.url; } if (m === 'Runtime.executionContextDestroyed' && p.executionContextId === this.ctxId) this.ctxId = null; });
    const { targetInfos } = await this.cdp.send('Target.getTargets'); let t = targetInfos.find((x) => x.type === 'page'); if (!t) t = { targetId: (await this.cdp.send('Target.createTarget', { url: 'about:blank' })).targetId };
    const { sessionId } = await this.cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true }); this.sid = sessionId;
    await this.cdp.send('Page.enable', {}, sessionId); await this.cdp.send('Runtime.enable', {}, sessionId).catch(() => {});
    if (o.headless) { /* 화면 없는 크롬은 이름표에 'HeadlessChrome'이 남음 → 보통 크롬 이름표로(보고서 ①안 주의점) */ try { const v = await this.cdp.send('Browser.getVersion'); const ua = String(v.userAgent || '').replace(/HeadlessChrome/g, 'Chrome'); if (ua) await this.cdp.send('Network.setUserAgentOverride', { userAgent: ua }, sessionId); } catch (e) {} }
    return this; }
  /* 처음 한 번 알라딘 첫 화면에 들어감(사람처럼 들어온 탭 — 이 탭 안에서 같은 출처로 읽음) */
  async land(url, timeoutSec) { if (this.landed) return; const sid = this.sid; const done = new Promise((res) => { const f = (m, p, s) => { if (s === sid && m === 'Page.loadEventFired') { this.cdp.on = this.cdp.on.filter((x) => x !== f); res(true); } }; this.cdp.on.push(f); setTimeout(() => res(false), (timeoutSec || 25) * 1000); });
    const nav = await this.cdp.send('Page.navigate', { url }, sid); if (nav && nav.errorText) throw new Error('알라딘 첫 화면을 못 엶: ' + nav.errorText); this.frameId = nav.frameId; await done; this.landed = true; this.ctxId = null; }
  async world(srcs) { if (this.ctxId) return this.ctxId; const ft = await this.cdp.send('Page.getFrameTree', {}, this.sid); this.frameId = ft.frameTree.frame.id;
    const w = await this.cdp.send('Page.createIsolatedWorld', { frameId: this.frameId, worldName: 'rn3-col2', grantUniveralAccess: false }, this.sid); const ctx = w.executionContextId;
    for (const s of srcs) { const r = await this.cdp.send('Runtime.evaluate', { expression: s, contextId: ctx, returnByValue: true }, this.sid); if (r.exceptionDetails) throw new Error('운영 공용 파일 넣기 실패: ' + String(r.exceptionDetails.text || '').slice(0, 120)); }
    this.ctxId = ctx; return ctx; }
  async read(url, srcs, timeoutSec) { const ctx = await this.world(srcs); const r = await this.cdp.send('Runtime.evaluate', { expression: `(${READ_FN})(${JSON.stringify(url)}, ${(timeoutSec || 30) * 1000})`, contextId: ctx, awaitPromise: true, returnByValue: true }, this.sid, ((timeoutSec || 30) + 10) * 1000);
    if (r.exceptionDetails) return { ok: false, why: '읽기 코드 오류: ' + String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 200), kind: 'error' }; return r.result.value; }
  /* 시험용: 알라딘 화면 쪽(보통 칸)에서 우리 변수가 보이는지 */
  async mainEval(expr) { const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, this.sid); return r.result ? r.result.value : null; }
  kill() { try { if (this.cdp) this.cdp.close(); } catch (e) {} try { if (this.proc && !this.dead) this.proc.kill(); } catch (e) {} this.dead = true; this.ctxId = null; this.landed = false; }
  async close() { try { if (this.cdp && !this.cdp.closed) await this.cdp.send('Browser.close', {}, null, 5000).catch(() => {}); } catch (e) {} await sleep(300); this.kill(); }
}
module.exports = { CDP, Browser, READ_FN };
