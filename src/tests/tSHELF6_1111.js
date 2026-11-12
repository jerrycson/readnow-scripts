// tSHELF6_1111 — (11/12 shelf6) 📚 서가 6차: 서가 자료 받기가 막히지 않게 · 책등 규칙 주소 저절로 줄이기 · 표지 띠 책등 · 여러 줄 글자 겹침 · PNG·GIF 표지 대표색
//   배포 뒤 확인: ① /shop/shelf 가 클라우드 429('Rate exceeded.' — 클라우드 한 대·동시 4개가 꽉 참)에 걸리면 그 응답엔 출처(CORS) 머리가 없어 브라우저가 '연결 실패'로만 봄 → 손님 화면 '⚠ 나머지 책을 못 받음'
//     ② 책등 규칙 주소 40권 중 1권(2.5%)만 있음 ③ 휴대폰 사진에 여러 줄 제목 두 줄이 겹친 책등 ④ 표지 대표색 6권 'SOI not found'(JPEG 아님)
//   ① 순수 셈·클라우드(가짜 Firestore): 묶음 범위(k=1-) · ETag/304 · 같은 주소면 Vary에 Origin 없음 · 서가·글꼴 제한 따로 · 429에 Retry-After·CORS · 맞춤률 → 천천히·멈춤·다시 맛봄 · PNG·GIF 풀기 · WebP는 원래 주소를 다시 받음 · Hosting /shop/**
//   ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 책): 서가 요청 2번(첫 묶음 + 나머지 한꺼번에) · 첫 '나머지' 429여도 기다렸다 다시 받아 모두 꽂음 · 읽기에 Content-Type 머리 없음
//      표지 띠 책등(그림을 받은 뒤에만 · 띠 너비 = 책등 폭 × 100 / 띠%) · 여러 줄이 겹치게 만들면(시험용 CSS) 한 줄로 바꿔 글자 겹침 0
// 실행: node src/tests/tSHELF6_1111.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELF6_1111.js · 손님 정보 없음
const fs = require('fs'); const path = require('path'); const http = require('http'); const zlib = require('zlib');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
const SP = require(path.join(ROOT, 'cloud/shop-spine.js')); const CV = require(path.join(ROOT, 'cloud/shop-cover.js')); const IMG = require(path.join(ROOT, 'cloud/shop-img.js'));
/* 작은 PNG 만들기(시험용 · RGBA 8비트 · 필터 0) */
const crc = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
const chunk = (t, d) => { const L = Buffer.alloc(4); L.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, 'latin1'), d]); const C = Buffer.alloc(4); C.writeUInt32BE(crc(td)); return Buffer.concat([L, td, C]); };
function png(W, H, px) { const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6; const raw = Buffer.alloc(H * (W * 4 + 1)); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = px(x, y); c.forEach((v, i) => { raw[y * (W * 4 + 1) + 1 + x * 4 + i] = v; }); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); }
/* 3×2 GIF(빨·파·흰 / 초·빨·검) — 그림 도구로 미리 만든 바이트 */
const GIF = Buffer.from('47494638376103000200820000000000ff000000ff000000ffffffff0000000000000000002c000000000300020000080900030c202020008080003b', 'hex');
(async () => {
console.log('① 순수 셈·클라우드');
{ ok(JSON.stringify([SH.shelfK('0', 5), SH.shelfK('1-', 5), SH.shelfK('3', 5), SH.shelfK('9', 5), SH.shelfK('1-2', 5), SH.shelfK('zz', 5), SH.shelfK('1-', 1)]) === '[[0,0],[1,4],[3,3],[4,4],[1,2],[0,0],[0,0]]', '묶음 범위: k=0 · k=1-(1번부터 끝까지 한꺼번에) · 범위 밖은 안으로 · 이상하면 0');
  ok(SH.SHELF_RL[0] >= 120 && SH.SHELF_RL[1] === 60e3, `서가 창구 제한 = IP당 1분 ${SH.SHELF_RL[0]}번(나머지 창구 240번과 따로)`); }
{ const P = png(40, 60, (x, y) => (x < 20 ? [200, 30, 40, 255] : [20, 40, 200, 255])); ok(IMG.sniff(P) === 'png' && IMG.sniff(GIF) === 'gif' && IMG.sniff(Buffer.from('RIFF0000WEBPVP8 ', 'latin1')) === 'webp' && IMG.sniff(Buffer.from([0xff, 0xd8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])) === 'jpeg', '꼴 보기: PNG·GIF·WebP·JPEG');
  const im = IMG.decode(P); ok(im.width === 40 && im.height === 60 && im.data[0] === 200 && im.data[(10 * 40 + 30) * 4 + 2] === 200, 'PNG 풀기(RGBA · 필터) — 화소 값 그대로');
  const g = IMG.decode(GIF); const gp = Array.from({ length: 6 }, (_, i) => [...g.data.slice(i * 4, i * 4 + 3)].join(',')).join(' '); ok(g.width === 3 && g.height === 2 && gp === '255,0,0 0,0,255 255,255,255 0,255,0 255,0,0 0,0,0', 'GIF 첫 장면 풀기(LZW) — ' + gp);
  let er = ''; try { IMG.decode(Buffer.from('RIFF0000WEBPVP8 xxxxxxxx', 'latin1')); } catch (e) { er = e.message; } ok(er === 'fmt:webp', 'WebP는 풀지 않고 꼴을 알림(fmt:webp)');
  const v = CV.analyze(im.data, im.width, im.height); ok(/^[0-9a-f]{6}/.test(v), 'PNG 표지 → 대표색 셈 ' + v); }
{ /* 표지 셈: 저장소 그림이 WebP면 알라딘 원래 주소를 JPEG·PNG만 받겠다고 다시 받음 · 실제 저장 길(front.png)을 씀 */
  const P = png(80, 120, (x, y) => [30, 120 + (y % 3), 60, 255]); const got = []; const B = { file: (p) => ({ download: async () => { got.push(p); if (p.endsWith('front.png')) return [P]; if (p.includes('bk_w')) return [Buffer.from('RIFF0000WEBPVP8 xxxxxxxx', 'latin1')]; throw new Error('No such object: ' + p); } }) };
  const asked = []; const fx = async (u, o) => { asked.push([u, o && o.headers && o.headers.Accept]); return { ok: true, status: 200, arrayBuffer: async () => P }; };
  const a = await CV.loadCover('bk_p', { B, pathOf: () => 'img/bk_p/front.png', srcOf: () => null, fx }); ok(got[0] === 'img/bk_p/front.png' && a.how === 'png' && a.im.width === 80, '도서 정보의 실제 저장 길(front.png)을 받아 PNG로 풂');
  const b = await CV.loadCover('bk_w', { B, pathOf: () => null, srcOf: () => 'https://image.aladin.co.kr/product/1/2/cover500/x_1.jpg', fx }); ok(/webp→원래 png/.test(b.how) && asked[0][0].includes('aladin') && !/webp/.test(asked[0][1]), `WebP → 알라딘 원래 주소를 다시(Accept에 webp 없음) · ${b.how}`);
  let er = ''; try { await CV.loadCover('bk_w', { B, pathOf: () => null, srcOf: () => 'https://evil.example/x.jpg', fx }); } catch (e) { er = e.message; } ok(/^fmt:webp/.test(er) && asked.length === 1, '알라딘 밖 주소는 다시 받지 않음'); }
{ const now = Date.parse('2026-11-12T00:00:00Z'); const r = (h, n) => '1'.repeat(h) + '0'.repeat(n - h);
  const p0 = SP.autoPlan({ rec: '' }, {}, now), p1 = SP.autoPlan({ rec: r(1, 40) }, {}, now), p2 = SP.autoPlan({ rec: r(4, 200) }, {}, now), p3 = SP.autoPlan({ rec: r(3, 40) }, {}, now);
  ok(p0.mode === 'on' && p0.n === 40 && p1.mode === 'slow' && p1.n === 10 && p1.every === 3600e3 && p2.mode === 'stop' && p2.stopNow && p3.mode === 'on', `맞춤률: 처음 40권/10분 · 2.5%(40권 중 1) → 천천히 1시간 10권 · 200권 중 2% → 멈춤 · 7.5% → 그대로`);
  const p4 = SP.autoPlan({ rec: r(1, 40) }, { spineRuleAuto: false }, now), p5 = SP.autoPlan({ rec: '' }, { spineRule: false }, now), p6 = SP.autoPlan({ rec: r(1, 40) }, { spineRuleMin: 2 }, now), p7 = SP.autoPlan({ rec: '', stops: 1 }, {}, now);
  ok(p4.mode === 'on' && p5.mode === 'off' && !p5.n && p6.mode === 'on' && p7.mode === 'slow', '설정: 저절로 줄이기 끔 → 그대로 · 끔 → 안 물음 · 바라는 비율 2% → 2.5%면 그대로 · 멈춤 뒤엔 천천히 다시 맛봄');
  const DB = {}; const C = (n) => ({ get: async () => ({ forEach: (f) => Object.entries(DB[n] || {}).forEach(([id, v]) => f({ id, data: () => v })) }), doc: (id) => ({ set: async (v) => { DB[n] = DB[n] || {}; DB[n][id] = { ...(DB[n][id] || {}), ...v }; } }) });
  const X = SP.makeSpine({ C, log: () => {}, fetch: async () => ({ status: 404, headers: { get: () => '' } }) }); const books = new Map(); const cand = [];
  for (let i = 0; i < 260; i++) { books.set('b' + i, { images: { front: { src: `https://image.aladin.co.kr/product/1/${i}/cover500/k${String(i).padStart(6, '0')}_1.jpg` } } }); cand.push({ id: 'b' + i, at: '2026-11-0' + (i % 9) }); }
  let pl = await X.plan({}); ok(pl.mode === 'on', '처음엔 그대로(10분 40권)'); await X.tick(cand, books, { n: pl.n, gapMs: 0 }); pl = await X.plan({}); ok(pl.mode === 'slow' && pl.n === 10, `40권 모두 없음 → ${pl.why}`);
  for (let k = 0; k < 16; k++) { await X.tick(cand, books, { n: 10, gapMs: 0 }); } pl = await X.plan({}, Date.now());
  ok(pl.mode === 'stop' && DB.shop_spinetry._auto && DB.shop_spinetry._auto.until && DB.shop_spinetry._auto.stops === 1 && DB.shop_spinetry._auto.rec.length === 200, `200권 물어 0% → 멈춤 · 상태를 shop_spinetry/_auto에 남김(until ${String(DB.shop_spinetry._auto.until).slice(0, 10)})`);
  const later = Date.parse(DB.shop_spinetry._auto.until) + 1000; const pl2 = await X.plan({}, later); ok(pl2.mode === 'slow' && DB.shop_spinetry._auto.rec === '' && X.state().auto.mode === 'slow', '멈춤이 끝나면 기록을 비우고 천천히 다시 맛봄 · 진단 shelfjobs.spine.auto에 보임'); }
{ /* 클라우드 창구: 범위·ETag·304·Vary·제한·Retry-After·CORS */
  const snap = (n, id) => { const v = (DB[n] || {})[id]; return { id, exists: !!v, data: () => v }; }; const DB = {}; const col = (n) => (DB[n] = DB[n] || {});
  const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => (op === '==' ? col(n)[id][f] === v : true))).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f) }; } }); return { ...q([]), doc: (id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v) => { col(n)[id] = { ...(col(n)[id] || {}), ...v }; } }) }; };
  const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)) }; const FV = { serverTimestamp: () => new Date(), arrayUnion: (...a) => a };
  for (let i = 0; i < 9100; i++) { col('prd_listings')['L' + i] = { status: '판매중', active: true, qty: 1, price: 3000, grade: '상', sku: 'A01', title: '시험 책 ' + i, bookId: 'b' + i, registeredAt: new Date(Date.parse('2026-10-01') + i * 6e4).toISOString() }; col('prd_books')['b' + i] = { author: '지은이', images: {} }; }
  col('app_settings').shop = { open: 1, shelf: { spineRule: false } };
  const SHOP = SH.makeShop({ db, C, FV, log: () => {} }); const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; if (await SHOP.handle(req, res, p0)) return; res.writeHead(404); res.end(); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; let n = 0;
  const get = (p, h) => new Promise((ok2) => http.get(base + p, { headers: { 'Accept-Encoding': 'gzip', 'X-Forwarded-For': '10.0.0.' + (h && h.ip || 1), ...((h && h.hd) || {}) } }, (r) => { n++; const ch = []; r.on('data', (d) => ch.push(d)); r.on('end', () => { let b = Buffer.concat(ch); if (r.headers['content-encoding'] === 'gzip') b = zlib.gunzipSync(b); let j = null; try { j = JSON.parse(b.toString('utf8') || 'null'); } catch (e) {} ok2({ s: r.statusCode, h: r.headers, j }); }); }));
  const a = await get('/shop/shelf?k=0'), b = await get('/shop/shelf?k=1-');
  ok(a.s === 200 && a.j.kn === 3 && b.j.k === 1 && b.j.k2 === 2 && a.j.rows.length + b.j.rows.length === 9100, `나머지 묶음 한꺼번에(k=1-): ${a.j.rows.length} + ${b.j.rows.length} = 9,100권 · 요청 2번`);
  ok(/^"[0-9a-f]{20}"$/.test(a.h.etag) && a.h.etag !== b.h.etag && /s-maxage=60/.test(a.h['cache-control']) && a.h.vary === 'Accept-Encoding', `ETag 붙음 · CDN 캐시 s-maxage · 같은 주소(Origin 없음)면 Vary에 Origin 없음(CDN이 손님마다 나누지 않음)`);
  const c = await get('/shop/shelf?k=0', { hd: { 'If-None-Match': a.h.etag } }); ok(c.s === 304 && c.h.etag === a.h.etag, '같은 자료면 304(본문 안 보냄)');
  const o = await get('/shop/shelf?k=0', { hd: { Origin: 'https://booksqueen.com' } }); ok(o.h['access-control-allow-origin'] === 'https://booksqueen.com' && /Retry-After/.test(o.h['access-control-expose-headers'] || '') && /Origin/.test(o.h.vary), '다른 주소(클라우드 주소)로 부르면 CORS·Retry-After 읽기 허락·Vary Origin');
  for (let i = 0; i < 250; i++) await get('/shop/font?f=nope&t=a', { ip: 7 }); const lr = await get('/shop/list', { ip: 7 }); ok(lr.s === 200, '글꼴 250번 불러도 다른 창구 제한(1분 240번)에 안 셈');
  for (let i = 0; i < SH.SHELF_RL[0]; i++) await get('/shop/shelf?k=0', { ip: 9 }); const lim = await get('/shop/shelf?k=0', { ip: 9, hd: { Origin: 'https://booksqueen.com' } }); const lst = await get('/shop/cfg', { ip: 9 });
  ok(lim.s === 429 && +lim.h['retry-after'] >= 1 && +lim.h['retry-after'] <= 60 && lim.h['access-control-allow-origin'] === 'https://booksqueen.com' && lim.j && lim.j.retry >= 1 && lst.s === 200, `서가 ${SH.SHELF_RL[0]}번 넘으면 429 + Retry-After ${lim.h['retry-after']}초 + CORS 머리(브라우저가 읽고 기다림) · 다른 창구는 그대로`);
  srv.close(); }
{ const RC = require(path.join(ROOT, 'hosting/deploy.js')).restConfig(JSON.parse(fs.readFileSync(path.join(ROOT, 'hosting/shop.json'), 'utf8'))); ok(RC.rewrites.some((r) => r.glob === '/shop/**' && ['readnow-cloud', 'readnow-shop'].includes(r.run.serviceId)), 'Hosting: booksqueen.com/shop/** → 클라우드(같은 주소 · CDN)');
  const T = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf\?k=1-/.test(T) && !/Promise\.all\(Array\.from\(\{ length: Math\.max\(0, J0\.kn - 1\)/.test(T) && /Retry-After/.test(T), '손님 화면: 나머지를 한 번에(나란히 4번 아님) · Retry-After 따라 다시');
  const c = BQS.cfgOf({}); ok(c.edgeSpine === true && c.edgePct === 8 && c.spineRule === true && c.spineRuleAuto === true && c.spineRuleMin === 5 && BQS.cfgOf({ edgePct: 99 }).edgePct === 25, '설정 틀: 표지 띠 책등(켬 · 8%) · 책등 규칙 주소 저절로 줄이기(켬 · 5%)'); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELF6_1111 ${bad}개 실패` : '✓ tSHELF6_1111 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || require('os').tmpdir(); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const D = BQS.demoItems(60, 7); const COVER = png(120, 180, (x, y) => (x < 14 ? [40 + (y % 40), 90, 160, 255] : [230, 220, 200, 255]));
const items = Array.from({ length: 5000 }, (_, i) => ({ ...D[i % 60], id: 'E' + i, t: ['어린 가정부 조앤', '20세기 한국시와 비평정신', '바다', '너의 기억을 지워줄게'][i % 4] + ' ' + i, c: '소설/시/희곡', c2: '한국소설', at: '2026-10-01' }));
const rows = items.map((x, i) => [x.id, x.t, x.a, x.c, x.p, x.lp, x.g, x.at, i % 3 ? '/cover/' + i + '.png' : null, null, null, 's', null, x.pg, x.pb, x.sz, null, x.c2 || null, null, null, i % 3 ? '3a6ea5.my' : null]);
const parts = [rows.slice(0, 4000), rows.slice(4000)]; const LOG = []; let rest429 = 0;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o, s, h) => { res.writeHead(s || 200, { 'Content-Type': 'application/json', ...(h || {}) }); res.end(JSON.stringify(o)); };
  if (u.pathname.startsWith('/shop/')) LOG.push([req.method, u.pathname + u.search, req.headers['content-type'] || '']);
  if (u.pathname === '/shop/cfg') return J({ ok: true, open: 1, name: '북스퀸', n: rows.length, cats: [], pay: { how: 'wait' }, biz: {}, shelf: { cap: 200, sort0: 'cat', orient: 'v' } });
  if (u.pathname === '/shop/shelf') { const k = u.searchParams.get('k'); if (k === '1-' && !rest429++) return J({ ok: false, err: '잠시 뒤', retry: 1 }, 429, { 'Retry-After': '1' });
    if (k === '0') return J({ ok: true, n: rows.length, k: 0, kn: 2, cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows: parts[0] }); return J({ ok: true, n: rows.length, k: 1, k2: 1, kn: 2, cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows: parts[1] }); }
  if (u.pathname.startsWith('/cover/')) { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(COVER); }
  if (u.pathname === '/shop/font') { res.writeHead(404); return res.end(); }
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 200초 넘음'); process.exit(1); }, 200000);
const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
/* 글자 상자끼리 30% 넘게 겹친 책등 수(지금 책장 · 화면 안) */
const overlapN = (p) => p.evaluate(() => { let bad = 0; const rg = document.createRange(); for (const el of document.querySelectorAll('.bqs-case.cur .sp .tt, .bqs-case.cur .sp .au')) { if (el.style.display === 'none') continue; const B = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) for (let i = 0; i < n.data.length; i++) { if (/\s/.test(n.data[i])) continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getBoundingClientRect(); if (r.width && r.height) B.push(r); }
  let hit = false; for (let a = 0; a < B.length && !hit; a++) for (let b = a + 1; b < B.length; b++) { const x = Math.min(B[a].right, B[b].right) - Math.max(B[a].left, B[b].left), y = Math.min(B[a].bottom, B[b].bottom) - Math.max(B[a].top, B[b].top); if (x > 0 && y > 0 && x * y > 0.3 * Math.min(B[a].width * B[a].height, B[b].width * B[b].height)) { hit = true; break; } } if (hit) bad++; } return bad; });
try {
  { const ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.addInitScript((u) => { window.BQ_API = u; }, base); await p.goto(base + '/s/index.html#/shelf?s=cat'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 });
    await p.waitForFunction(() => /5,000/.test((document.querySelector('.bqs-n') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
    const sh = LOG.filter((x) => x[1].startsWith('/shop/shelf')).map((x) => x[1]); const nTxt = await p.textContent('.bqs-n');
    ok(/5,000/.test(nTxt) && sh.filter((x) => x === '/shop/shelf?k=0').length === 1 && sh.filter((x) => x === '/shop/shelf?k=1-').length === 2 && sh.length === 3, `서가 요청: 첫 묶음 1 + 나머지 한꺼번에(첫 번은 429 → Retry-After 1초 뒤 다시) = ${sh.join(' · ')} · 5,000권 모두 (${nTxt.trim()})`);
    ok(LOG.filter((x) => x[0] === 'GET').every((x) => !x[2]) && !LOG.some((x) => x[0] === 'OPTIONS'), '읽기(GET)에 Content-Type 머리 없음(출처 미리 묻기 OPTIONS 0)');
    const E = await p.evaluate(() => { const L = [...document.querySelectorAll('.bqs-case.cur .sp')]; const eg = L.filter((b) => b.querySelector('.eg')); const ok2 = eg.filter((b) => b.classList.contains('eok')); const b = ok2[0]; const im = b && b.querySelector('.eg img');
      const ep = parseFloat(getComputedStyle(document.querySelector('.bqs')).getPropertyValue('--ep')); return { n: L.length, eg: eg.length, eok: ok2.length, ratio: b ? im.getBoundingClientRect().width / b.querySelector('.sk').getBoundingClientRect().width : 0, ep, op: b ? getComputedStyle(b.querySelector('.eg')).opacity : 0, noIm: L.filter((x) => !x.querySelector('.eg')).length }; });
    ok(E.eg > 20 && E.eok >= Math.min(E.eg, 20) && Math.abs(E.ratio - 100 / E.ep) < 0.6 && E.op === '1' && E.noIm > 5, `표지 띠 책등: 표지 있는 책 ${E.eg}권(그림 받은 것 ${E.eok}) · 띠 그림 너비 = 책등 × ${E.ratio.toFixed(1)}(= 100/${E.ep}) · 표지 없는 책 ${E.noIm}권은 지어낸 책등`);
    ok(await overlapN(p) === 0 && !errs.length, `보통 글꼴: 글자 겹친 책등 0 · 화면 오류 0${errs.length ? ' — ' + errs[0] : ''}`);
    await p.screenshot({ path: path.join(SHOT, 'shelf6_pc.png') }); await ctx.close(); }
  for (const W of [1280, 390]) { const ctx = await br.newContext({ viewport: { width: W, height: 844 }, isMobile: W < 600, hasTouch: W < 600 }); const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; }, base);
    /* 여러 줄 줄 간격을 망가뜨려 두 줄이 겹치게(실제 휴대폰에서 본 겹침 흉내) */
    await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.sp .tt.ml,.sp .au.ml{line-height:.15!important}'; document.head.appendChild(s); }); });
    await p.goto(base + '/s/index.html#/shelf?s=cat'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(2500);
    const ov = await p.evaluate(() => +document.querySelector('.bqs').dataset.ovl || 0); const bad2 = await overlapN(p);
    ok(ov > 0 && bad2 === 0, `${W}px 여러 줄이 겹치게 만들어도: 겹침 ${ov}곳을 찾아 한 줄(+…)로 바꿈 → 글자 겹친 책등 ${bad2}`); await p.screenshot({ path: path.join(SHOT, `shelf6_ovl${W}.png`) }); await ctx.close(); }
} finally { clearTimeout(kill); await br.close(); srv.close(); }
console.log(bad ? `❌ tSHELF6_1111 ${bad}개 실패` : '✓ tSHELF6_1111 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌', e && e.stack); process.exit(1); });
