/* 리드나우 웹앱 서비스 워커 (sw.js · app/ 폴더에 index.html과 함께)
 * (0.98.0) 웹앱 파일(index.html)은 '저장본 먼저 + 뒤에서 새 판 확인': 열면 기기 저장본을 바로 띄우고(1.6MB를 매번 받지 않음 — 다시 열 때 느리던 가장 큰 원인),
 *   같은 때 서버에서 최신 판을 받아 저장. 받은 판의 번호(APP_VER)가 지금 띄운 것과 다르면 화면에 알림 → 화면이 연 지 얼마 안 됐거나 쉬고 있으면 바로 새 판으로 다시 엶(저장본이라 순간).
 *   → 빠르면서도 어떤 기기도 옛 화면에 오래 머물지 않음. 저장본이 없으면(처음) 서버에서 받음.
 * Firebase 프로그램·공용 기준 파일(주소에 판 번호가 붙음)은 저장본을 바로 쓰고 뒤에서 새로 받음.
 * 이 파일이 바뀌어 새 워커가 켜지면, 열려 있던 웹앱 화면을 모두 새로 엶.
 * 자료(Firebase 기록)는 여기서 다루지 않음 — Firebase가 따로 실시간으로 받음.
 * 문제가 생기면: 주소 끝에 ?nosw=1 을 붙여 열면 이 워커를 끄고 저장본을 지움. */
const CACHE = 'rn-app-v5'; /* sw 1.24.5 — 새 워커가 켜져도 화면을 곧바로 다시 열지 않음(알림 → 쉬는 때) · sw 1.24.3 — 판 번호 붙은 파일은 저장본만 ·  웹앱 본문(readnow-webapp.js?v=판)은 새 판을 받으면 옛 판 사본을 지움(1.5MB씩 쌓이지 않게) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const ks = await caches.keys(); const upgraded = ks.some((k) => /^rn-app-/.test(k) && k !== CACHE);
  for (const k of ks) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
  if (upgraded) self.clients.matchAll({ type: 'window' }).then((cs) => cs.forEach((c) => { try { c.postMessage({ type: 'rn-newsw' }); } catch (e) {} })); // (1.24.5 점검 L7) 예전엔 열린 화면을 곧바로 다시 열어 출고·가격 일괄 확정 중에도 끊겼음 → 화면에 알리고, 화면이 쉬는 때(상세를 안 열었을 때)만 다시 엶
})()));
const isShell = (u) => u.origin === self.location.origin && /\/app\/(index\.html)?$/.test(u.pathname) && !u.searchParams.has('vc') && !u.searchParams.has('nosw');
const isLib = (u) => (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) || (u.origin === self.location.origin && /\/readnow-[a-z-]+\.js$/.test(u.pathname)) || u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'cdn.jsdelivr.net';
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; let u; try { u = new URL(req.url); } catch (x) { return; }
  const shell = isShell(u); if (!shell && !isLib(u)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE); const key = shell ? new Request(u.origin + u.pathname.replace(/index\.html$/, '')) : req; // 웹앱 주소는 ?go=… 와 상관없이 하나로
    if (shell) { // (0.98.0) 저장본 먼저 — 뒤에서 새 판을 받아 저장하고, 판 번호가 다르면 화면에 알림
      const hit = await c.match(key); const verOf = (t) => (String(t).match(/const APP_VER = '([\d.]+)'/) || [])[1] || null;
      const net = fetch(u.href, { cache: 'no-store', credentials: 'same-origin' }).then(async (r) => { if (!r || !r.ok) return r; const txt = await r.clone().text(); const nv = verOf(txt); let ov = null; if (hit) { try { ov = verOf(await hit.clone().text()); } catch (x) {} }
          /* (1.12.1) 받은 판이 지금 저장본보다 옛 판이면(깃허브 페이지 배포 직후 옛 판이 잠깐 오는 때) 저장본을 덮지 않음 */
          const vcmp = (x, y) => { const A = String(x).split('.').map(Number), B = String(y).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) - (B[i] || 0); } return 0; };
          if (nv && ov && vcmp(nv, ov) < 0) return r;
          await c.put(key, r.clone()).catch(() => {}); if (nv) await c.put(new Request(u.origin + '/__rn_ver'), new Response(nv)).catch(() => {}); if (hit && nv && ov && nv !== ov) { const cs = await self.clients.matchAll({ type: 'window' }); cs.forEach((cl) => cl.postMessage({ type: 'rn-newver', ver: nv, from: ov })); } return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const r2 = await net; return r2 || new Response('오프라인 — 저장된 웹앱이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const hit = await c.match(key);
    if (hit && u.origin === self.location.origin && u.searchParams.has('v')) return hit; /* (sw 1.24.3 전체 점검) 판 번호가 붙은 파일(웹앱 본문·공용 파일)은 같은 주소면 내용이 같음 → 다시 받지 않음(예전엔 열 때마다 3MB를 다시 받아 덮어 써 브라우저가 저장한 컴파일 결과가 버려졌음) */
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) { c.put(key, r.clone()).then(async () => { if (u.origin !== self.location.origin || !u.search) return; for (const k of await c.keys()) { try { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) await c.delete(k); } catch (x) {} } }).catch(() => {}); } return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // 저장본을 바로 주고, 새 판은 뒤에서 받아 둠
    const r = await net; return r || new Response('오프라인 — 저장된 파일이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
/* (1.29.0) 📦 출고 알림(웹 푸시) — 클라우드가 출고 시각에 보냄 · 웹앱이 닫혀 있어도 휴대폰·PC 기본 알림으로 · 누르면 웹앱 오늘 출고 ② 발송 요청 탭(열린 창이 있으면 그 창을 앞으로) */
self.addEventListener('push', (e) => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: '리드나우', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '리드나우 출고', { body: d.body || '', tag: d.tag || 'rn-ship', renotify: true, requireInteraction: !!d.sticky, data: { url: d.url || './?go=deliv' }, icon: d.icon || undefined })); });
self.addEventListener('notificationclick', (e) => { e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || './?go=deliv', self.registration.scope).href;
  e.waitUntil((async () => { const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); for (const c of cs) { if (/\/app\//.test(c.url)) { try { await c.focus(); c.postMessage({ type: 'rn-go', go: 'deliv' }); return; } catch (x) {} } } await self.clients.openWindow(url); })()); });
