/* 리드나우 2 서비스 워커 — 저장본 이름표 rn2-ui-v<n>
 * 규칙: rn2- 로 시작하지 않는 저장본은 절대 지우지 않음(지금 웹앱 저장본 rn-app-* 은 그대로)
 * 새 웹앱 파일: 저장본 먼저 보이고 뒤에서 새로 받음 · 지금 웹앱 본문·공용 파일(?v= 판 붙은 주소): 판이 바뀌면 주소가 바뀌므로 저장본 먼저
 * 지금 웹앱 틀(index.html): 늘 새로 받고, 못 받으면 저장본 */
const CACHE = 'rn2-ui-v15';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => { for (const k of await caches.keys()) if (/^rn2-ui-v/.test(k) && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; /* Firebase·글꼴 등 바깥은 손대지 않음 */
  const mine = u.pathname.indexOf(new URL('./', self.registration.scope).pathname) === 0;
  const legacyVer = /readnow-[\w-]+\.js$/.test(u.pathname) && u.searchParams.has('v');
  const legacyTpl = /\/app\/index\.html$/.test(u.pathname) && !mine;
  if (!mine && !legacyVer && !legacyTpl) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (legacyTpl) { try { const n = await fetch(r); if (n.ok) c.put(r, n.clone()); return n; } catch (x) { return (await c.match(r)) || Response.error(); } }
    const hit = await c.match(r);
    const net = fetch(r).then((n) => { if (n.ok) c.put(r, n.clone()); return n; }).catch(() => null);
    if (hit) { if (!legacyVer) e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
