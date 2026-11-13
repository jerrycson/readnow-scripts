/* 🛍 우리숍 전용 서버 — Cloud Run 서비스 readnow-shop (11/12 shopsrv · 정범님 11/12 밤 결정 '우리숍 전용 서버를 바로 둠')
 *  까닭: 수집·배우기·예약 일을 하는 readnow-cloud(1대)가 메모리로 죽으면 숍도 같이 멎었음(11/12 08시대) → 같은 이미지에서 숍 창구만 따로 띄움
 *  이 파일은 index.js(수집·크롬·배우기·예약)를 전혀 읽지 않음 — 숍 창구(cloud/shop.js)와 Firestore만 · 알라딘 계정·비밀 없음 · 뒷일(표지 셈·책등 묻기)은 끔(bg:false · 원래 서비스가 맡음)
 *  받는 주소: /shop/* · /b/<상품> · /sitemap*.xml (booksqueen.com Hosting이 넘김 · 손님 화면 POST도 이 서비스 주소로) · /healthz(상태 · 손님 정보 없음)
 *  배포: .github/workflows/deploy-cloud.yml '우리숍 전용 서버' 일(readnow-cloud와 같은 이미지 · 명령만 node shop-main.js)
 *  되돌리기: hosting/shop.json의 serviceId를 readnow-cloud로 · 원래 서비스도 숍 주소를 그대로 받음 */
'use strict';
const http = require('http');
const VER = 'shop-main 1'; /* 판 번호는 클라우드 판(index.js VER)과 같은 이미지 — 여기 숫자는 이 진입 파일 모양만 */

function makeServer({ db, C, FV, log, bucket, shopMod }) {
  const SH = shopMod || require('./shop.js');
  const SHOP = SH.makeShop({ db, C, FV, log, bucket, bg: false });
  const M = { since: new Date().toISOString(), n: 0, inf: 0, max: 0, n429: 0, n5xx: 0, n404: 0, day: '', dayN: 0, ver: VER };
  const kday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const state = () => { const mu = process.memoryUsage(); return { ok: true, srv: SHOP.SRV, rev: process.env.K_REVISION || null, ver: VER, code: (process.env.CODE_SHA || '').slice(0, 12) || null, bg: SHOP.BG ? 1 : 0, since: M.since, up: Math.round(process.uptime()), req: { n: M.n, inf: M.inf, max: M.max, n429: M.n429, n5xx: M.n5xx, n404: M.n404, day: M.day, dayN: M.dayN }, mem: { rss: Math.round(mu.rss / 1048576), heap: Math.round(mu.heapUsed / 1048576) }, items: (SHOP._cat && SHOP._cat.items.size) || 0 }; };
  const server = http.createServer(async (req, res) => {
    M.n++; M.inf++; if (M.inf > M.max) M.max = M.inf; { const d = kday(); if (d !== M.day) { M.day = d; M.dayN = 0; } M.dayN++; }
    let dn = false; const done = () => { if (dn) return; dn = true; M.inf--; if (res.statusCode === 429) M.n429++; else if (res.statusCode >= 500) M.n5xx++; }; res.on('finish', done); res.on('close', done);
    const p0 = (req.url || '/').split('?')[0];
    try {
      if (p0 === '/healthz' || p0 === '/status') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-RN-Srv': SHOP.SRV }); res.end(JSON.stringify(state())); return; }
      if (p0.startsWith('/shop/') || p0.startsWith('/b/') || /^\/sitemap(-\d+)?\.xml$/.test(p0)) { if (await SHOP.handle(req, res, p0)) return; }
      M.n404++; res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-RN-Srv': SHOP.SRV }); res.end(JSON.stringify({ ok: false, err: '숍 전용 서버 — 숍 주소만 받습니다' }));
    } catch (e) { log && log('🛍 숍 전용 서버 오류', p0, String(e && e.message || e).slice(0, 200)); if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: false, err: '잠시 뒤 다시 해 주세요' })); } else { try { res.end(); } catch (x) {} } }
  });
  return { server, SHOP, state };
}

if (require.main === module) {
  const { initializeApp } = require('firebase-admin/app'); const { getFirestore, FieldValue } = require('firebase-admin/firestore');
  initializeApp({ projectId: process.env.FB_PROJECT || 'readnow-3a385' });
  const db = getFirestore(); const C = (n) => db.collection(n); const log = (...a) => console.log(new Date().toISOString(), ...a);
  const BUCKET = process.env.FB_BUCKET || 'readnow-3a385.firebasestorage.app';
  process.on('unhandledRejection', (e) => { try { console.error('처리 안 된 오류', e && e.message ? e.message : String(e)); } catch (x) {} });
  process.on('uncaughtException', (e) => { try { console.error('잡히지 않은 오류', e && e.message ? e.message : String(e)); } catch (x) {} });
  const { server, SHOP } = makeServer({ db, C, FV: FieldValue, log, bucket: () => require('firebase-admin/storage').getStorage().bucket(BUCKET) });
  /* 끌 때(Cloud Run이 대수를 줄임 · 10초 줌) — 모아 둔 책등 모양을 먼저 씀 */
  process.on('SIGTERM', () => { log('🛍 숍 전용 서버 끄는 중'); Promise.all([Promise.resolve(SHOP.spinesFlush && SHOP.spinesFlush()), Promise.resolve(SHOP.anlFlush && SHOP.anlFlush()) /* (shopadm1) 📊 모은 방문 수 */]).catch(() => {}).finally(() => { server.close(); setTimeout(() => process.exit(0), 3000).unref(); }); });
  server.listen(process.env.PORT || 8080, () => log(`🛍 숍 전용 서버 ${process.env.K_SERVICE || 'local'} (${VER}) 시작`));
}
module.exports = { makeServer, VER };
