/* readnow-aladin-core.js — 알라딘 창구 (개편 3단계 · 공용 파일)
 * 알라딘 화면을 읽는 길을 하나로: 속도 조절(makePacer와 함께) · 응답 실패 때 길게 다시 · 점검 안내 화면 알아차리기 · 로그인 풀림 알아차리기 · 글자 인코딩
 * 예전: 수집기 고객 쪽 fetchDoc · 상품 쪽 getDoc · 짧은 조회 lookDoc(속도 조절 없음) · 가격 감시기 aladinDoc(점검 화면을 못 알아봄) — 갈래마다 처리가 달랐음
 * 쓰는 곳: 리드나우 수집기(PC) · 가격 감시기. 브라우저 전용(fetch·DOMParser). 판은 노선표(readnow-registry.js PINS)에 적힘.
 * 이 파일은 알라딘에 아무것도 바꾸지 않음 — 읽기(GET)만. */
(function (root) {
  const VERSION = '0.1.0';
  const RETRY_WAITS = [5, 15, 45, 120, 300]; // 초. 이후로는 5분 간격
  const LOGOUT_LINK = 'a[href*="wC2Cuser_logout"]';
  // 글자 인코딩: 응답 머리(content-type)의 charset → 없으면 화면 안 <meta charset> (euc-kr 화면도 바르게)
  function decode(buf, ctype) { const cs = (String(ctype || '').match(/charset=([\w-]+)/i) || [])[1]; let html = new TextDecoder(cs || 'utf-8').decode(buf);
    if (!cs) { const m = html.match(/<meta[^>]+charset=["']?([\w-]+)/i); if (m && !/utf-?8/i.test(m[1])) { try { html = new TextDecoder(m[1]).decode(buf); } catch (e) {} } } return html; }
  // 점검 안내 화면: 정상 응답(200)으로 오기도 함 → 빈 목록으로 읽으면 '매물 없음·단독'처럼 잘못 판단하므로 오류로 보고 기다렸다 다시
  function isMaintenance(doc) { const t = (doc && doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ');
    return /점검\s*(중|시간|안내|작업)|서비스\s*점검|system\s*maintenance/i.test(t) && t.length < 5000 && !(doc.querySelector && doc.querySelector('link[rel="canonical"], ' + LOGOUT_LINK)); }
  // 로그인 풀림: 로그인 화면 주소 · 비밀번호 칸(제목이 샵매니저 화면이 아닐 때) · (선택) 샵매니저 화면인데 로그아웃 링크가 없음
  function looksLoggedOut(finalUrl, doc, o) { o = o || {};
    if (/\/login\//i.test(finalUrl || '') || /wlogin|wC2CUser_Login/i.test(finalUrl || '')) return true;
    const pw = doc.querySelector('input[type="password"]'); if (pw && !(o.titleOk || /샵매니저|알라딘/).test(doc.title || '')) return true;
    if (o.scmNeedsLogout && o.url && /\/scm\//.test(o.url) && !doc.querySelector(LOGOUT_LINK)) return true;
    return false; }
  /* makeReader(o) → read(url, { expect }) = { doc, html, url, finalUrl }
   *  o.pace: makePacer 결과(wait·ok·fail·kindOf·cooling·state) · o.sleep(ms)
   *  o.wait(): 요청 앞 기다림 (기본 pace.wait(sleep)) · o.beforeEach(): 멈춤 확인(멈췄으면 throw)
   *  o.loggedOut(finalUrl, doc, url, html) → bool · o.onLoggedOut(finalUrl, tries): 다시 로그인(포기하면 throw)
   *  o.fatal(e) → bool: 다시 하지 않고 바로 던질 오류 · o.maxOutageMin(): 이 시간 넘게 안 되면 o.outageError(min)를 던짐
   *  o.on429(status) · o.onRetry(e, waitSec, attempt) · o.onRecover() · o.onOk(ms) · o.timeoutSec(기본 30) · o.maintenance(기본 true) */
  function makeReader(o) {
    const pace = o.pace, sleep = o.sleep; const wait = o.wait || (() => pace.wait(sleep));
    return async function read(url, opt) { opt = opt || {}; let firstFail = null, attempt = 0, loginTries = 0;
      for (;;) {
        if (o.beforeEach) o.beforeEach();
        await wait(); const t0 = Date.now();
        try {
          const ac = new AbortController(); const to = setTimeout(() => ac.abort(), (o.timeoutSec || 30) * 1000);
          let r; try { r = await fetch(url, { credentials: 'include', signal: ac.signal }); } finally { clearTimeout(to); }
          if (!r.ok) { if ((r.status === 429 || r.status === 503) && o.on429) { pace.fail(pace.kindOf ? pace.kindOf(r.status) : '429'); o.on429(r.status); throw Object.assign(new Error('서버 응답 ' + r.status + ' (요청이 너무 많음 — 쉬었다가 느리게)'), { status: r.status, counted: true }); }
            throw Object.assign(new Error('서버 응답 ' + r.status + (r.status === 429 ? ' (요청이 너무 많음 — 쉬었다가 느리게)' : '')), { status: r.status }); }
          const html = decode(await r.arrayBuffer(), r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html');
          if (o.maintenance !== false && isMaintenance(doc)) throw new Error('알라딘 점검 중');
          if (o.loggedOut(r.url, doc, url, html)) { loginTries++; await o.onLoggedOut(r.url, loginTries); continue; }
          if (opt.expect && !opt.expect(doc)) throw new Error('페이지 내용이 예상과 다름 (서버 오류 화면일 수 있음)');
          pace.ok(); if (o.onOk) o.onOk(Date.now() - t0); if (firstFail && o.onRecover) o.onRecover();
          return { doc, html, url: r.url, finalUrl: r.url };
        } catch (e) {
          if (o.fatal && o.fatal(e)) throw e;
          if (!e.counted) pace.fail(e.name === 'AbortError' ? 'timeout' : pace.kindOf ? pace.kindOf(e.status) : 'error'); firstFail = firstFail || Date.now();
          const lim = o.maxOutageMin ? o.maxOutageMin() : 60; if ((Date.now() - firstFail) / 60000 > lim) throw (o.outageError ? o.outageError(lim) : new Error(`알라딘 서버가 ${lim}분 넘게 응답하지 않아 멈췄습니다`));
          const w = RETRY_WAITS[Math.min(attempt, RETRY_WAITS.length - 1)]; attempt++;
          if (o.onRetry) o.onRetry(e, w, attempt); await sleep(w * 1000);
        }
      }
    }; }
  // 짧은 조회(책 몇 권 · 사람이 맡긴 일): 한 번만, 속도 조절은 같이 씀, 점검 화면이면 오류
  async function quick(url, o) { o = o || {}; const u = new URL(url, 'https://www.aladin.co.kr').href; if (o.pace) await o.pace.wait(o.sleep); const r = await fetch(u, { credentials: 'include' });
    if (!r.ok) { if (o.pace) o.pace.fail(o.pace.kindOf ? o.pace.kindOf(r.status) : 'error'); throw Object.assign(new Error('서버 응답 ' + r.status), { status: r.status }); }
    const html = decode(await r.arrayBuffer(), r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html'); if (isMaintenance(doc)) throw new Error('알라딘 점검 중'); if (o.pace) o.pace.ok(); return { doc, html, finalUrl: r.url }; }
  const api = { VERSION, RETRY_WAITS, decode, isMaintenance, looksLoggedOut, makeReader, quick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowAladin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
