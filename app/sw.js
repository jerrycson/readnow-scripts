/* 리드나우 웹앱 서비스 워커 (sw.js · app/ 폴더에 index.html과 함께)
 * (0.81.1) 웹앱 파일(index.html)은 '서버 먼저': 열 때마다 최신 판을 받아 띄우고, 2.5초 안에 못 받으면(전파가 약하면) 기기 저장본을 띄움.
 *   → 어떤 기기도 옛 화면에 머물지 않음 (예전: 저장본을 먼저 띄워 한 번 더 열어야 새 판이 보였음 — 핸드폰 바로가기가 계속 옛 판).
 * Firebase 프로그램·공용 기준 파일(주소에 판 번호가 붙음)은 저장본을 바로 쓰고 뒤에서 새로 받음.
 * 이 파일이 바뀌어 새 워커가 켜지면, 열려 있던 웹앱 화면을 모두 새로 엶(옛 화면을 붙잡고 있던 기기도 바로 새 판).
 * 자료(Firebase 기록)는 여기서 다루지 않음 — Firebase가 따로 실시간으로 받음.
 * 문제가 생기면: 주소 끝에 ?nosw=1 을 붙여 열면 이 워커를 끄고 저장본을 지움. */
const CACHE = 'rn-app-v3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const ks = await caches.keys(); const upgraded = ks.some((k) => /^rn-app-/.test(k) && k !== CACHE);
  for (const k of ks) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
  if (upgraded) self.clients.matchAll({ type: 'window' }).then((cs) => cs.forEach((c) => c.navigate(c.url).catch(() => {}))); // 옛 판 화면을 새 판으로 — 켜지기를 기다리지 않고 (기다리면 새로 여는 요청이 막힘)
})()));
const isShell = (u) => u.origin === self.location.origin && /\/app\/(index\.html)?$/.test(u.pathname) && !u.searchParams.has('vc') && !u.searchParams.has('nosw');
const isLib = (u) => (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) || (u.origin === self.location.origin && /\/readnow-[a-z-]+\.js$/.test(u.pathname)) || u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'cdn.jsdelivr.net';
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; let u; try { u = new URL(req.url); } catch (x) { return; }
  const shell = isShell(u); if (!shell && !isLib(u)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE); const key = shell ? new Request(u.origin + u.pathname.replace(/index\.html$/, '')) : req; // 웹앱 주소는 ?go=… 와 상관없이 하나로
    if (shell) { // 서버 먼저 (최신 판) — 늦으면 저장본
      const net = fetch(u.href, { cache: 'no-store', credentials: 'same-origin' }).then((r) => { if (r && r.ok) c.put(key, r.clone()).catch(() => {}); return r; }).catch(() => null);
      const r = await Promise.race([net, new Promise((res) => setTimeout(() => res('slow'), 2500))]);
      if (r && r !== 'slow' && r.ok) return r;
      const hit = await c.match(key); if (hit) { e.waitUntil(net); return hit; }
      const r2 = await net; return r2 || new Response('오프라인 — 저장된 웹앱이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const hit = await c.match(key);
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()).catch(() => {}); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // 저장본을 바로 주고, 새 판은 뒤에서 받아 둠
    const r = await net; return r || new Response('오프라인 — 저장된 파일이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
