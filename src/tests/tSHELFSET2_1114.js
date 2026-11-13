// tSHELFSET2_1114 — (11/14 shelfset2) 📚 세트 권 책등 — 책등 표본이 없으면 앞·뒤표지 색으로 한 벌 디자인
//   정범님 지시 11/14 00:29(I-1114-0029-04) 중 「세트는 각 권의 책등이 표본이 있으면 적용하고, 없으면 최대한 앞뒤 표지를 기준으로 참고해서 각 권의 디자인이 조화롭게 일체감이 살도록」
//   ① 순수 셈: 클라우드 뒤표지 대표색(세트 꼴·관리자 바로잡기만 · 우리 저장소 → 없으면 알라딘 원래 주소 · 'b:<도서>' 열쇠) · 서가 칸 cb · 손님 화면 setDress(앞표지 = 바탕 · 뒤표지 = 곁색·권 번호 띠·머리띠 · 모든 권 같게)
//   ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 상품): PC 1280·휴대폰 390 — 책장·꺼낸 권 모두 뒤표지 색 · 뒤표지 없는 세트·책등 그림 세트는 예전대로 · 설정 끄기
// 실행: node src/tests/tSHELFSET2_1114.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELFSET2_1114.js
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js')); const CV = require(path.join(ROOT, 'cloud/shop-cover.js'));
const FS = 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/';
(async () => {
console.log('① 순수 셈 — 클라우드 뒤표지 대표색');
{ const w = (t, o) => CV.wantBack({ id: 'a', t, bk: FS + 'img%2Fbk_1%2Fback_t.webp?alt=media', ...(o || {}) });
  ok(w('룬의 아이들 - 윈터러 세트 - 전7권') && w('[세트] 신부이야기 1~14 (상급)') && w('거미입니다만, 문제라도? 1~8권 (최상급)') && w('오르다 작은 철학자 : 9권 세트') && w('Pizza Lunch: 6-Book Boxed Set') && !w('낱권 책 2024-2025 개정판') && !w('그냥 소설') && !w('룬의 아이들 세트 - 전7권', { bk: null }) && CV.wantBack({ id: 'Z9', t: '제목에 권 수 없는 큰사전', bk: FS + 'img%2Fbk_2%2Fback.jpg?alt=media' }, new Set(['Z9'])),
    '뒤표지 셈 대상: 세트 꼴 제목(전N권·a~b권·N권 세트·Boxed Set) 또는 관리자 「세트 권 수 바로잡기」 상품 · 뒤표지 그림이 있는 것만 · 세트 아닌 책은 안 셈(손님 화면이 안 씀)');
  ok(CV.bkKey({ bk: FS + 'img%2Fbk_7%2Fback_t.webp?alt=media', im: FS + 'img%2Fbk_8%2Ffront_t.webp' }) === 'bk_7' && CV.bkKey({ bk: 'https://image.aladin.co.kr/product/1/2/letslook/x_b.jpg', im: FS + 'img%2Fbk_8%2Ffront_t.webp' }) === 'bk_8' && CV.order([{ id: 'q', im: 'https://image.aladin.co.kr/x.jpg', bk: FS + 'img%2Fbk_3%2Fback.jpg' }]).length === 1, '뒤표지 열쇠 = 그림 폴더(bk_<도서>) · 뒤표지가 알라딘 주소면 앞표지 폴더 · 앞표지가 알라딘이어도 뒤표지가 우리 저장소면 셈 차례에 들어감');
  const px = (r, g, b) => { const W = 40, H = 60, d = new Uint8ClampedArray(W * H * 4); for (let i = 0; i < W * H; i++) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; } return { d, W, H }; };
  const p1 = px(30, 60, 170); ok(/^[0-9a-f]{6}$/.test(CV.backOf(p1.d, p1.W, p1.H)) && CV.backOf(null, 0, 0) === 'x', `뒤표지 대표색 = 앞표지와 같은 셈(16×16 · 채도 무게) — 파란 뒤표지 → ${CV.backOf(p1.d, p1.W, p1.H)}`);
  let jpeg = null; try { jpeg = require(require.resolve('jpeg-js', { paths: [path.join(ROOT, 'cloud'), ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] })); } catch (e) { jpeg = null; }
  if (!jpeg) console.log('  (jpeg-js 없음 — 회차 시험은 클라우드 꾸러미 설치 뒤 · NODE_PATH로도 됨)');
  else { const enc = (r, g, b) => { const W = 60, H = 90, d = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; } return jpeg.encode({ data: d, width: W, height: H }, 90).data; };
    const STO = { 'img/bk_1/front.jpg': enc(190, 30, 40), 'img/bk_1/back.jpg': enc(20, 60, 180), 'img/bk_2/front.jpg': enc(200, 180, 30), 'img/bk_3/front.jpg': enc(30, 150, 60), 'img/bk_3/back.jpg': enc(220, 220, 30), 'img/bk_4/front.jpg': enc(90, 30, 120) };
    const got = []; const W = []; const fakeC = (name) => ({ get: async () => ({ forEach: () => {} }), doc: (id) => ({ set: async (v) => { W.push([name, id, v]); } }) });
    const M = CV.makeCover({ C: fakeC, bucket: () => ({ file: (p) => ({ download: async () => { got.push(p); if (!STO[p]) throw new Error('No such object: ' + p); return [STO[p]]; } }) }),
      pathOf: (k) => `img/${k}/front.jpg`, srcOf: () => null, backPathOf: (k) => (k === 'bk_2' ? null : `img/${k}/back.jpg`), backSrcOf: (k) => (k === 'bk_2' ? 'https://image.aladin.co.kr/product/1/2/letslook/K2_b.jpg' : null),
      fetch: async (u, o) => { got.push(u); return { ok: true, status: 200, arrayBuffer: async () => { const b = enc(30, 160, 150); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } }; } });
    const I = (id, k, t, bk) => ({ id, t, at: '2026-11-14', im: FS + `img%2F${k}%2Ffront_t.webp?alt=media`, bk });
    const items = [I('S1', 'bk_1', '시험 대하소설 세트 - 전5권', FS + 'img%2Fbk_1%2Fback_t.webp?alt=media'), I('S2', 'bk_2', '[세트] 시험 만화 1~8', 'https://image.aladin.co.kr/product/1/2/letslook/K2_b.jpg'), I('B3', 'bk_3', '낱권 시험 책', FS + 'img%2Fbk_3%2Fback_t.webp?alt=media'), I('S4', 'bk_4', '시험 고전 세트 - 전3권', null)];
    await M.tick(CV.order(items), 300); const st = M.state(); const cb = (x) => M.cbOf(x);
    const hue = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i - 1, i + 1), 16)); return { r, g, b }; };
    const c1 = cb(items[0]), c2 = cb(items[1]);
    ok(c1 && hue(c1).b > 150 && hue(c1).r < 60 && c2 && hue(c2).g > 130 && hue(c2).r < 60 && !cb(items[2]) && !cb(items[3]) && M.cvOf(items[2].im) && st.nb === 2,
      `회차: 세트 S1 뒤표지(우리 저장소) → ${c1} · 세트 S2 뒤표지(우리 저장소에 아직 없음 → 알라딘 원래 주소) → ${c2} · 세트 아닌 B3·뒤표지 없는 S4는 뒤표지 안 셈(앞표지는 그대로 셈) · 뒤표지 ${st.nb}개`);
    ok(!got.includes('img/bk_3/back.jpg') && !got.includes('img/bk_2/back.jpg') && got.includes('https://image.aladin.co.kr/product/1/2/letslook/K2_b.jpg') && W.some((w) => w[0] === 'shop_cover' && Object.keys(w[2].m).some((k) => k === 'b:bk_1')) && W.every((w) => Object.values(w[2].m).every((v) => CV.CV_RE.test(v))),
      `저장: shop_cover 같은 칸에 'b:<도서>' 열쇠(앞표지 열쇠와 안 겹침) · 받은 그림 ${got.length}장 — 세트 아닌 책의 뒤표지는 받지 않음`);
    const n0 = got.length; await M.tick(CV.order(items), 300); ok(got.filter((u, i) => i >= n0 && /back|letslook/.test(u)).length === 0, '다음 회차에 같은 뒤표지를 다시 받지 않음(한 번 셈하면 영구)');
    const R = SH.shelfRows(items.map((x) => ({ ...x, p: 10000 })), null, null, null, null, M.cvOf, null, null, null, M.cbOf); const U = BQS.unpack({ cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows: R }); const g = (id) => U.find((x) => x.id === id);
    ok(SH.SHELF_COLS[SH.SHELF_COLS.length - 1] === 'cb' && g('S1').cb === '#' + c1 && g('S2').cb === '#' + c2 && g('B3').cb === null && g('S4').cb === null && g('S1').cc, `서가 자료 칸 cb(맨 뒤에 덧붙임 — 옛 칸 차례 그대로): S1 ${g('S1').cb} · S2 ${g('S2').cb} · 없는 책은 null`); } }
console.log('① 순수 셈 — 손님 화면 세트 디자인(앞표지 = 바탕 · 뒤표지 = 한 벌 곁색)');
{ const c = BQS.cfgOf({}); const x = { id: 'q1', t: '시험 대하소설 세트 - 전5권', sz: '152x225x110', pg: 1800 }; const St = BQS.setOf(x, c); const A = BQS.assign(x, c, '#a8322a');
  const V0 = BQS.setDress(x, A, c, St); const V = BQS.setDress({ ...x, cb: '#1f4fa8' }, A, c, St);
  ok(c.setBackCol === 'both' && BQS.SCHEMA.some((p) => p.k === 'setBackCol' && p.group === '세트' && p.type === 'select' && Object.keys(p.opts).join() === 'both,accent,off'), '설정 칸 「뒤표지 색이 있으면」(묶음 세트 · 기본 = 바탕 앞표지 색 + 뒤표지 색 권 번호 띠·곁색·머리띠)');
  ok(V.every((v, i) => v.c === V0[i].c) && V.every((v) => v.c2 === '#1f4fa8' && v.bc === '#1f4fa8' && v.cap === 1) && V0.every((v) => !v.bc && !v.cap) && V.every((v) => v.d === V[0].d && v.f === V[0].f && v.p === V[0].p && v.body === V[0].body && v.w === V[0].w),
    `뒤표지 색이 있으면: 바탕은 앞표지 색 그대로(권마다 조금씩 · ${V.map((v) => v.c).join(' ')}) · 곁색·권 번호 띠·머리띠 = 뒤표지 색 ${V[0].c2}(모든 권 같게) · 디자인·글꼴·무늬·모양·두께 같음`);
  ok(V.every((v) => BQS.contrast(v.bc, v.vk) >= 4.5 && BQS.contrast(v.c, v.k) >= 3), `글자 읽힘: 권 번호 띠 글자(${V[0].vk})가 뒤표지 색 위에서 대비 ${BQS.contrast(V[0].bc, V[0].vk).toFixed(1)} · 제목 글자도 바탕 위에서 3 넘음`);
  const Vg = BQS.setDress({ ...x, cb: '#1f4fa8' }, A, BQS.cfgOf({ setColor: 'grad' }), St); ok(BQS.cdist(Vg[4].c, '#1f4fa8') < BQS.cdist(Vg[0].c, '#1f4fa8') && Vg[0].c === BQS.COLORS[A.ci - 1].hex, `「차례로 물듦」: 1권 앞표지 색 ${Vg[0].c} → 5권 뒤표지 색 쪽 ${Vg[4].c}`);
  const Va = BQS.setDress({ ...x, cb: '#1f4fa8' }, A, BQS.cfgOf({ setBackCol: 'accent' }), St); const Vo = BQS.setDress({ ...x, cb: '#1f4fa8' }, A, BQS.cfgOf({ setBackCol: 'off' }), St);
  ok(Va.every((v) => v.c2 === '#1f4fa8' && !v.cap) && JSON.stringify(Vo) === JSON.stringify(BQS.setDress(x, A, BQS.cfgOf({ setBackCol: 'off' }), St)), '설정 「권 번호 띠·곁색에만」 = 머리띠 없음 · 「쓰지 않음」 = 앞표지 색만(예전과 똑같음)');
  const b0 = BQS.COLORS[A.ci - 1].hex; const Vs = BQS.setDress({ ...x, cb: b0 }, A, c, St); ok(Vs.every((v) => v.bc && BQS.cdist(v.bc, b0) >= 22 && v.c2 === v.bc), `뒤표지 색이 바탕과 거의 같으면(${b0}) 곁색을 짙게/옅게 바꿔 띠가 보이게(${Vs[0].bc})`);
  ok(BQS.setDress({ ...x, cb: 'red' }, A, c, St).every((v) => !v.bc) && BQS.setDress({ ...x, cb: null }, A, c, St).every((v) => !v.bc), '뒤표지 색이 없거나 꼴이 틀리면 앞표지 색만(지금처럼)');
  const one = BQS.look({ id: 'n1', t: '세트 아닌 책', cb: '#1f4fa8' }, c, '#a8322a'); const one0 = BQS.look({ id: 'n1', t: '세트 아닌 책' }, c, '#a8322a'); ok(JSON.stringify(one) === JSON.stringify(one0), '세트 아닌 책 모양은 그대로(cb를 안 씀)');
  const s = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf\.js\?v=0\.2\.1[3-9]/.test(s) && /shelf\.css\?v=0\.2\.1[3-9]/.test(s) && /shelf-core\.js\?v=0\.2\.1[3-9]/.test(s) && /shop\.js\?v=0\.2\.([8-9]|1\d)\b/.test(fs.readFileSync(path.join(ROOT, 'shop/index.html'), 'utf8')) && /^0\.3\.([8-9]|[1-9]\d)$/.test(BQS.VER), `판 번호: 서가 0.2.13 이후 · 손님 화면 shop.js 0.2.8 이후 · 설정 틀 ${BQS.VER}`);
  for (const f of ['shop/shelf.js', 'shop/shelf-core.js', 'cloud/shop-cover.js']) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(t), f + ': 브라우저 창 없음'); } }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELFSET2_1114 ${bad}개 실패` : '✓ tSHELFSET2_1114 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shelfset2'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const SVG = { cover: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="430"><rect width="300" height="430" fill="hsl(${h},55%,40%)"/><text x="24" y="90" font-size="34" fill="#fff" font-family="sans-serif">세트 ${h}</text></svg>`,
  spine: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="400"><rect width="40" height="400" fill="hsl(${h},50%,30%)"/><rect y="30" width="40" height="14" fill="#e8c66a"/></svg>` };
const D0 = BQS.demoItems(80, 13).map((x, i) => ({ ...x, id: 'D' + i, im: null, bk: null, at: '2026-09-' + String(1 + (i % 28)).padStart(2, '0') }));
/* [id, 제목, 분류, 판형, 쪽, 앞표지 대표색 cv, 뒤표지 대표색 cb, 책등 그림] — 지어낸 상품 */
const SPEC = [['S1', '시험 대하소설 세트 - 전5권', '국내도서>소설/시/희곡>한국소설', '152x225x110', 1800, 'a8322a', '1f4fa8', null], ['S2', '[세트] 시험 만화 1~8 (상급)', '국내도서>만화', null, null, '2d7a4a', 'e8c33a', null],
  ['S3', '시험 고전 세트 - 전3권', '국내도서>인문학', '148x210x60', 900, '6a3d8f', 'f0e6d2', 'spine'], ['S4', '시험 뒤표지 없는 세트 - 전4권', '국내도서>에세이', '148x210x72', 1000, '1d5c8a', null, null], ['B1', '낱권 시험 책', '국내도서>에세이', '128x188x18', 260, 'c05a2a', '204060', null]];
const mk = (base) => [...SPEC.map(([id, t, cp, sz, pg, cv, cb, sp], i) => ({ id, t, a: '지은이 ' + i, cp, c: cp.split('>')[1] || cp, p: 12000 + i * 3000, lp: 40000, at: '2026-11-14', sz, pg, cv, cb, im: base + '/img/cover_' + (50 * i + 20) + '.svg', sp: sp ? base + '/img/spine_' + (40 * i) + '.svg' : null })), ...D0];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let rows = []; const base0 = { v: '' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const Jo = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const m = /^\/img\/(cover|spine)_(\d+)/.exec(u.pathname); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(SVG[m[1]](+m[2])); }
  if (u.pathname === '/shop/cfg') return Jo({ ok: true, open: 1, name: '북스퀸', n: rows.length, pay: { how: 'wait' }, biz: {}, kinds: [], cats: [], shelf: { cap: 200, sort0: 'reg', fontsOn: false, coverColor: true, edgeSpine: false } });
  if (u.pathname === '/shop/shelf') return Jo({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: [], rows });
  if (u.pathname === '/shop/item') { const x = mk(base0.v).find((y) => y.id === u.searchParams.get('id')); return x ? Jo({ ok: true, item: { ...x, st: 's', info: { intro: '지어낸 세트 소개' }, pvs: [] }, same: [], rel: [] }) : Jo({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return Jo({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; base0.v = base;
rows = mk(base).map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : x[k] == null ? null : x[k])));
const kill = setTimeout(() => { console.log('  ❌ 240초 넘음'); process.exit(1); }, 240000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash) => { const ctx = await br.newContext({ deviceScaleFactor: 2, ...ctxO }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); } catch (e) {} }, base);
  await p.goto(base + '/s/index.html' + hash); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700); return { ctx, p, errs }; };
const cfgQ = (o) => '&cfg=' + BQS.previewArg(BQS.cfgOf(o));
const PC = { viewport: { width: 1280, height: 860 } }; const MO = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const shot = (p, n) => p.screenshot({ path: path.join(SHOT, n + '.jpg'), type: 'jpeg', quality: 72 });
const rgb = (h) => `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')})`;
const look = (p, sel) => p.evaluate((sel) => { const out = {}; for (const id of ['S1', 'S2', 'S3', 'S4']) { const L = [...document.querySelectorAll(sel.replace('$', id))]; out[id] = L.map((b) => ({ c2: b.style.getPropertyValue('--c2').trim(), sb: b.classList.contains('sb'), img: b.classList.contains('img'), cap: b.querySelector('.vc') ? getComputedStyle(b.querySelector('.vc')).backgroundColor : null, vnBg: b.querySelector('.vn') ? getComputedStyle(b.querySelector('.vn')).backgroundColor : null, vnFg: b.querySelector('.vn') ? getComputedStyle(b.querySelector('.vn')).color : null, c: b.style.getPropertyValue('--c').trim() })); } const one = document.querySelector('.bqs-case.cur .sp[data-id="B1"]'); out.B1 = one ? { vc: !!one.querySelector('.vc'), sb: one.classList.contains('sb') } : null; return out; }, sel);
const shelfSel = '.bqs-case.cur .bqs-set[data-set="$"] .sp.sv';
const checkShelf = (G, tag) => {
  ok(G.S1.length === 5 && G.S1.every((v) => v.sb && v.c2 === '#1f4fa8' && v.cap === rgb('#1f4fa8') && v.vnBg === rgb('#1f4fa8')) && G.S2.length === 8 && G.S2.every((v) => v.c2 === '#e8c33a' && v.cap === rgb('#e8c33a')),
    `${tag} 책장: S1 다섯 권 모두 뒤표지 색(#1f4fa8) 머리띠·권 번호 띠 · 바탕은 앞표지 색 쪽(${G.S1.map((v) => v.c).join(' ')}) · S2 여덟 권 뒤표지 색(#e8c33a)`);
  ok(G.S1.every((v) => v.vnFg === G.S1[0].vnFg) && G.S2.every((v) => v.vnFg === rgb('#14110d')), `${tag} 권 번호 글자: 짙은 파랑 띠엔 밝은 글자(${G.S1[0].vnFg}) · 노란 띠엔 짙은 글자(${G.S2[0].vnFg})`);
  ok(G.S3.length === 3 && G.S3.every((v) => v.img && !v.cap && !v.sb) && G.S4.length === 4 && G.S4.every((v) => !v.cap && !v.sb) && G.B1 && !G.B1.vc && !G.B1.sb, `${tag} 책등 그림이 있는 세트(S3)는 그림 그대로 · 뒤표지 없는 세트(S4)는 앞표지 색만(예전대로) · 세트 아닌 책(B1)은 그대로`); };
try {
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg'); const G = await look(p, shelfSel); checkShelf(G, 'PC 1280');
    await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S1"]').scrollIntoView({ block: 'center' })); await shot(p, 'pc1280_shelf_fb');
    await p.click('.bqs-case.cur .bqs-set[data-set="S1"] .sp.sv0'); for (let i = 0; i < 60 && (await p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '')) !== 'open'; i++) await p.waitForTimeout(60); await p.waitForTimeout(500);
    const S = await p.evaluate(() => [...document.querySelectorAll('.ss-stage .ss-v')].map((b) => ({ c2: b.style.getPropertyValue('--c2').trim(), cap: !!b.querySelector('.vc') })));
    ok(S.length === 5 && S.every((v) => v.c2 === '#1f4fa8' && v.cap), `PC 1280 꺼낸 다섯 권도 같은 뒤표지 색 머리띠·띠(${S.length}권)`); await shot(p, 'pc1280_stack_fb_end');
    await p.keyboard.press('Escape'); await p.waitForTimeout(1200); ok(!errs.length, 'PC 화면 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg' + cfgQ({ setBackCol: 'off' })); const G = await look(p, shelfSel); ok(G.S1.every((v) => !v.cap && !v.sb && v.c2 !== '#1f4fa8'), '설정 「쓰지 않음」이면 앞표지 색만(머리띠·뒤표지 띠 없음)');
    await ctx.close(); const r2 = await open(PC, '#/shelf?s=reg' + cfgQ({ setBackCol: 'accent', setColor: 'grad' })); const G2 = await look(r2.p, shelfSel); ok(G2.S1.every((v) => !v.cap && v.c2 === '#1f4fa8') && G2.S1[0].c !== G2.S1[4].c, '설정 「권 번호 띠·곁색에만」 + 「차례로 물듦」: 머리띠 없이 띠만 · 바탕이 앞표지 색 → 뒤표지 색으로');
    await r2.p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S1"]').scrollIntoView({ block: 'center' })); await shot(r2.p, 'pc1280_shelf_fb_grad'); ok(!errs.length && !r2.errs.length, '설정 바꾼 화면 오류 없음'); await r2.ctx.close(); }
  { const { ctx, p, errs } = await open(MO, '#/shelf?s=reg'); const G = await look(p, shelfSel); checkShelf(G, '휴대폰 390');
    await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S1"]').scrollIntoView({ block: 'center' })); await shot(p, 'm390_shelf_fb');
    await p.tap('.bqs-case.cur .bqs-set[data-set="S1"] .sp.sv0'); for (let i = 0; i < 60 && (await p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '')) !== 'open'; i++) await p.waitForTimeout(60); await p.waitForTimeout(500);
    const S = await p.evaluate(() => [...document.querySelectorAll('.ss-stage .ss-v')].map((b) => !!b.querySelector('.vc'))); const wide = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(S.length === 5 && S.every(Boolean) && wide <= 0, `휴대폰 390 꺼낸 다섯 권도 뒤표지 색 머리띠 · 가로 넘침 ${wide}px`); await shot(p, 'm390_stack_fb_end'); ok(!errs.length, '휴대폰 화면 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 멈춤', e.message); }
clearTimeout(kill); await br.close(); srv.close();
console.log(bad ? `❌ tSHELFSET2_1114 ${bad}개 실패` : '✓ tSHELFSET2_1114 통과(화면까지) · 사진 ' + SHOT); process.exit(bad ? 1 : 0);
})();
