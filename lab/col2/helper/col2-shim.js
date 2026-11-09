/* col2-shim.js — (0.1.10 정범님 11/10 '아직 안 도는 9가지도 그림자로') 운영 본체에서 '그대로 떼어' 온 함수(col2-lift.js)가 부르는 바깥 이름의 받침
 * 번외 크롬 떨어진 칸(isolated world)에만 넣음 — 알라딘·바깥 화면 코드는 이 이름들을 못 봄 · 운영 본체 글자는 고치지 않음
 *  · 쓰기: C(칸).doc(id).set(…) 은 Firestore가 아니라 메모리(__col2.W)에 담기만 → 도우미가 그 값을 운영 문서와 견줌(운영 칸에는 아무것도 안 씀)
 *  · 읽기: getDoc(주소) = 쿠키 없이 fetch(운영 '공개 화면 쿠키 없이 읽기'와 같은 길) · 정한 꼴(알라딘 중고 검색)만
 *  · 숨은 창: loadInFrame(주소, 다 됐나) = 지금 이 탭(번외 크롬이 쿠키 없는 따로 된 칸에서 그린 화면)을 운영처럼 아래로 내려 보며 '다 됐나'를 400ms마다 봄
 *  · GM_xmlhttpRequest: render = 도우미가 그려 둔 HTML을 운영 '도우미 /render' 답 꼴로 돌려줌 · fetch = 이 탭과 같은 출처(KPIPA)에만 · 그 밖은 거절
 *  · 로그인·계정·우리 숍 일에 쓰이는 이름(우리 매물 목록 등)은 받침이 없음 — 그런 함수는 떼어 오지 않음 */
'use strict';
const SHIM = `(function(){ 'use strict'; const G = globalThis; const X = G.__col2 = G.__col2 || { W: [], gm: null, rendered: null, n: 0 };
  G.PUBONLY = true; G.lockHeld = false; G.laneCount = 1; G.stopFlag = false; G.FORCE_ALL = true; G.SET = G.SET || { pageTimeoutSec: 25 };
  G.sleep = (ms) => new Promise((r) => setTimeout(r, ms)); G.log = () => {}; G.ui = () => {}; G.nowIso = () => new Date().toISOString(); G.W = () => ({}); G.MW = () => ({});
  G.PACE = { wait: async () => {}, ok() {}, fail() {} }; G.P = G.ReadnowProducts; G.looksLoggedOut = (u, d) => !!(G.ReadnowAladin && G.ReadnowAladin.looksLoggedOut(u, d));
  G.acquireLane = async () => ({ ok: true }); G.releaseLane = async () => {}; G.lockMsg = () => ''; G.loadListings = async () => {}; G.loadProgress = async () => null; G.saveProgress = async () => {}; G.finishJob = async () => {};
  G.LISTINGS = G.LISTINGS || new Map(); G.kpTok = null;
  G.firebase = { firestore: { FieldValue: { arrayUnion: (...a) => ({ __union: a }), delete: () => ({ __del: 1 }) }, FieldPath: { documentId: () => '__id__' } } };
  const snap = () => ({ exists: false, id: null, data: () => undefined });
  const col = (p) => { const q = { doc: (id) => ({ id, get: async () => snap(), set: async (v, o) => { X.W.push({ p: p + '/' + id, v: JSON.parse(JSON.stringify(v == null ? null : v)), merge: !!(o && o.merge) }); }, update: async (v) => { X.W.push({ p: p + '/' + id, v: JSON.parse(JSON.stringify(v)), merge: true }); }, collection: (n) => col(p + '/' + id + '/' + n) }),
      get: async () => ({ empty: true, size: 0, docs: [], forEach() {} }), where: () => q, limit: () => q, orderBy: () => q, count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }) }; return q; };
  G.C = (n) => col(String(n)); G.db = { batch: () => ({ set() {}, commit: async () => {} }) };
  const ALOK = /^\\/search\\/wsearchresult\\.aspx\\?SearchTarget=Used&SearchWord=[^&]{1,400}$/;
  G.getDoc = async (url) => { const u = String(url).replace(/^https:\\/\\/www\\.aladin\\.co\\.kr/, location.origin); const p = u.slice(location.origin.length); if (!u.startsWith(location.origin) || !ALOK.test(p)) throw new Error('정한 꼴이 아닌 주소라 안 읽음');
    X.n++; const r = await fetch(u, { credentials: 'omit', cache: 'no-store' }); X.st = r.status; if (!r.ok) throw new Error('서버 응답 ' + r.status); const html = G.ReadnowAladin.decode(await r.arrayBuffer(), r.headers.get('content-type'));
    const doc = new DOMParser().parseFromString(html, 'text/html'); if (G.ReadnowAladin.isMaintenance(doc)) throw new Error('알라딘 점검 중'); return { doc, url: r.url, html }; };
  G.loadInFrame = (url, ready) => new Promise((res) => { const t0 = Date.now(); const lim = (+G.SET.pageTimeoutSec || 25) * 1000; const iv = setInterval(() => { const d = document;
      try { if (d.body) scrollTo(0, (d.body.scrollHeight || 0) * ((Date.now() - t0) % 3000 < 1500 ? 0.6 : 1)); } catch (e) {}
      let ok = false; try { ok = d.readyState !== 'loading' && ready(d); } catch (e) {} if (ok || Date.now() - t0 > lim) { clearInterval(iv); res({ ok, doc: d, href: location.href, ms: Date.now() - t0 }); } }, 400); });
  G.GM_xmlhttpRequest = (o) => { const fail = (w) => setTimeout(() => (o.onerror ? o.onerror(new Error(w)) : null), 0);
    if (X.gm === 'render') { const v = X.rendered || { ok: false, why: '그린 화면 없음' }; setTimeout(() => o.onload({ status: 200, responseText: JSON.stringify(v) }), 0); return; }
    if (X.gm === 'fetch') { let u; try { u = new URL(String(o.url).replace(X.from || '\\u0000', location.origin)); } catch (e) { return fail('주소가 이상함'); } if (u.origin !== location.origin) return fail('같은 출처만');
      const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), +o.timeout || 60000); X.n++;
      fetch(u.href, { method: o.method || 'GET', headers: o.headers || {}, body: o.data, credentials: 'include', cache: 'no-store', signal: ac.signal }).then(async (r) => { clearTimeout(tm); X.st = r.status; o.onload({ status: r.status, responseText: await r.text(), finalUrl: r.url }); }, () => { clearTimeout(tm); ac.signal.aborted && o.ontimeout ? o.ontimeout() : fail('연결 실패'); }); return; }
    fail('번외는 이 요청을 하지 않음'); };
})();`;
module.exports = { SHIM };
