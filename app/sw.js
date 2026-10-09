/* 리드나우 웹앱 서비스 워커 (sw.js · app/ 폴더에 index.html과 함께)
 * (0.98.0) 웹앱 파일(index.html)은 '저장본 먼저 + 뒤에서 새 판 확인': 열면 기기 저장본을 바로 띄우고(1.6MB를 매번 받지 않음 — 다시 열 때 느리던 가장 큰 원인),
 *   같은 때 서버에서 최신 판을 받아 저장. 받은 판의 번호(APP_VER)가 지금 띄운 것과 다르면 화면에 알림 → 화면이 연 지 얼마 안 됐거나 쉬고 있으면 바로 새 판으로 다시 엶(저장본이라 순간).
 *   → 빠르면서도 어떤 기기도 옛 화면에 오래 머물지 않음. 저장본이 없으면(처음) 서버에서 받음.
 * Firebase 프로그램·공용 기준 파일(주소에 판 번호가 붙음)은 저장본을 바로 쓰고 뒤에서 새로 받음.
 * 이 파일이 바뀌어 새 워커가 켜지면, 열려 있던 웹앱 화면을 모두 새로 엶.
 * 자료(Firebase 기록)는 여기서 다루지 않음 — Firebase가 따로 실시간으로 받음.
 * 문제가 생기면: 주소 끝에 ?nosw=1 을 붙여 열면 이 워커를 끄고 저장본을 지움. */
const CACHE = 'rn-app-v4'; /* sw 1.12.1 */
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
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()).catch(() => {}); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // 저장본을 바로 주고, 새 판은 뒤에서 받아 둠
    const r = await net; return r || new Response('오프라인 — 저장된 파일이 없습니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
