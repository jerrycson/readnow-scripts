/* 리드나우 웹앱 서비스 워커 (sw.js · app/ 폴더에 index.html과 함께)
 * 하는 일: 웹앱 파일(index.html)·Firebase 프로그램·공용 기준 파일을 기기에 저장해 두고, 열 때 네트워크를 기다리지 않고 바로 띄움.
 *   동시에 뒤에서 새 판을 받아 저장 → 새 판이 올라오면 웹앱의 '새 버전' 띠 → 새로고침하면 새 판.
 * 자료(Firebase 기록)는 여기서 다루지 않음 — Firebase가 따로 실시간으로 받음.
 * 문제가 생기면: 주소 끝에 ?nosw=1 을 붙여 열면 이 워커를 끄고 저장본을 지움. */
const CACHE = 'rn-app-v2'; // (0.81.0) 판을 올려 모든 기기의 옛 저장본을 한 번 비움
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
const isShell = (u) => u.origin === self.location.origin && /\/app\/(index\.html)?$/.test(u.pathname) && !u.searchParams.has('vc') && !u.searchParams.has('nosw');
const isLib = (u) => (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) || (u.origin === self.location.origin && /\/readnow-[a-z-]+\.js$/.test(u.pathname)) || u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'cdn.jsdelivr.net';
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; let u; try { u = new URL(req.url); } catch (x) { return; }
  const shell = isShell(u); if (!shell && !isLib(u)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE); const key = shell ? new Request(u.origin + u.pathname.replace(/index\.html$/, '')) : req; // 웹앱 주소는 ?go=… 와 상관없이 하나로
    const hit = await c.match(key);
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()).catch(() => {}); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // 저장본을 바로 주고, 새 판은 뒤에서 받아 둠
    const r = await net; return r || new Response('오프라인 — 저장된 웹앱이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
