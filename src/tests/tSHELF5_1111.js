// tSHELF5_1111 — (11/12 shelf5) 📚 서가 5차: 휴대폰 표찰 '(이어서)' 겹침 · 책등 규칙 주소 채우기 · 표지 대표색 셈 속도·차례 · 글자만 자른 글꼴 창구 · 첫 로딩 다시 시도 · 아래 고정 줄 겹침
//   ① 순수 셈(클라우드): 책등 규칙 주소(앞표지 원래 주소 → spineflip) · 물을 차례(책등 없음·새 책 먼저·120일 안 다시 안 물음) · 회차(있음 → 도서 정보 기록 · 없음 → 묻기 기록 · 429 → 그 회차 멈춤·1시간 쉼)
//      표지 대표색 차례(책등 그림 없는 책 → 새 책) · 셋씩 나란히 · 300권 한 회차 · 글꼴 창구(별칭 목록 = 화면 목록 51~68 · 글자 정리 · 캐시 · 없는 글꼴 404)
//   ② 화면(playwright · 가짜 클라우드 · 지어낸 책): 390·430px 휴대폰 — 표찰에 '(이어서)'가 한 번만 · 아래 고정 줄이 알림 토스트·둥근 카트·바닥 글과 안 겹침 · PC에선 아래 줄 없음
//      첫 로딩 때 책장 화면 파일 하나가 한 번 안 와도 다시 받아 책장이 섬
// 실행: node src/tests/tSHELF5_1111.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELF5_1111.js (playwright 필요) · 손님 정보 없음
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
const SP = require(path.join(ROOT, 'cloud/shop-spine.js')); const CV = require(path.join(ROOT, 'cloud/shop-cover.js')); const FT = require(path.join(ROOT, 'cloud/shop-font.js'));
/* 가짜 Firestore 컬렉션(쓰기를 모음) */
const fakeC = (W, pre) => (name) => ({ get: async () => ({ forEach: (f) => (pre[name] || []).forEach((d) => f({ id: d.id, data: () => d.v })) }), doc: (id) => ({ set: async (v, o) => { W.push([name, id, v, o]); } }) });
(async () => {
console.log('① 순수 셈');
{ const A = 'https://image.aladin.co.kr/product/1139/89/cover500/8993195617_1.jpg';
  ok(SP.ruleOf(A) === 'https://image.aladin.co.kr/product/1139/89/spineflip/8993195617_d.jpg' && SP.ruleOf('//image.aladin.co.kr/product/18463/51/covermini/k672534453_2.jpg') === 'https://image.aladin.co.kr/product/18463/51/spineflip/k672534453_d.jpg', '앞표지 원래 주소 → 책등 규칙 주소(product/…/spineflip/<K>_d.jpg)');
  ok(!SP.ruleOf('https://image.aladin.co.kr/product/1/2/cover500/x.jpg') && !SP.ruleOf('https://shopping-phinf.pstatic.net/a/b.jpg') && !SP.ruleOf(null) && !SP.ruleOf('https://image.aladin.co.kr/product/1/2/letslook/8993195617_t1.jpg'), '알라딘 표지 꼴이 아니면 묻지 않음(네이버·미리보기·짧은 이름)');
  ok(SP.srcOf({ src: A, stored: 'img/bk_1/front.jpg' }) === A && SP.srcOf(A) === A && SP.srcOf({ stored: 'x' }) === null, '표지 칸은 { src, stored } 묶음 — 원래 주소를 읽음(배포 뒤 조사가 0이던 까닭)');
  const books = new Map([['b1', { images: { front: { src: A, stored: 's' } } }], ['b2', { images: { front: { src: A.replace('1139', '2018') }, spine: { src: 'x', stored: 'y' } } }], ['b3', { images: { front: { src: A.replace('8993195617', '8959062235') } } }], ['b4', { images: { front: { src: 'https://shopping-phinf.pstatic.net/a.jpg' } } }], ['b5', { cover: A.replace('8993195617', '895093440x') }]]);
  const now = Date.parse('2026-11-12T12:00:00+09:00'); const tried = new Map([['b3', '261101.404']]);
  const L = SP.pick([{ id: 'b1', at: '2026-09-01' }, { id: 'b2', at: '2026-11-01' }, { id: 'b3', at: '2026-11-02' }, { id: 'b4', at: '2026-11-03' }, { id: 'b5', at: '2026-11-04' }, { id: 'b1', at: '2026-11-05' }], books, tried, 10, now);
  ok(L.map((x) => x.id).join(',') === 'b1,b5' || L.map((x) => x.id).join(',') === 'b5,b1', `물을 차례: 책등 있음(b2)·알라딘 아님(b4)·11일 전에 없다 한 것(b3)은 뺌 → ${L.map((x) => x.id).join(',')}`);
  ok(SP.pick([{ id: 'b3', at: 'x' }], books, new Map([['b3', '260601.404']]), 5, now).length === 1, '없다고 한 지 120일 지나면 다시 물음');
  const W = []; const asked = []; const st = { 'https://image.aladin.co.kr/product/1139/89/spineflip/8993195617_d.jpg': [200, 'image/jpeg', 8000], 'https://image.aladin.co.kr/product/1139/89/spineflip/895093440x_d.jpg': [404, 'text/html', 0] };
  const mk = (codes) => SP.makeSpine({ C: fakeC(W, {}), FV: null, fetch: async (u, o) => { asked.push([u, o.method]); const r = codes ? codes.shift() : st[u] || [404, 'text/html', 0]; return { status: r[0], headers: { get: (k) => (k === 'content-type' ? r[1] : String(r[2])) } }; } });
  const S1 = mk(); const n1 = await S1.tick([{ id: 'b1', at: '2026-11-05' }, { id: 'b5', at: '2026-11-04' }], books, { gapMs: 0 });
  const wb = W.find((w) => w[0] === 'prd_books'); const wt = W.filter((w) => w[0] === 'shop_spinetry').reduce((a, w) => ({ m: { ...a.m, ...w[2].m } }), { m: {} });
  ok(n1 === 1 && asked.every((a) => a[1] === 'HEAD') && wb && wb[1] === 'b1' && wb[2].images.spine.src.endsWith('/spineflip/8993195617_d.jpg') && wb[2].images.spine.stored === null && wb[2].images.spine.by === 'cloud-rule' && wb[2].imgStatus === 'pending' && wb[3].merge === true && !('front' in wb[2].images),
    '있으면 도서 정보에 책등 칸만 더함(merge · 앞표지 칸 안 건드림) · imgStatus pending → 수집기 이미지 받기가 우리 저장소로 받음 · HEAD만');
  ok(/\.404$/.test(wt.m.b5 || '') && /\.200$/.test(wt.m.b1 || '') && S1.wait.has('b1'), '없으면 묻기 기록(shop_spinetry · 120일 안 다시 안 물음) · 찾은 도서는 다음 전체 읽기 때 다시 읽음(우리 저장소 길)');
  const asked0 = asked.length; const S2 = mk([[429, 'text/html', 0], [200, 'image/jpeg', 9000]]); const n2 = await S2.tick([{ id: 'b1', at: '1' }, { id: 'b5', at: '2' }], books, { gapMs: 0 });
  ok(n2 === 0 && asked.length - asked0 === 1 && S2.state().pauseUntil > Date.now() + 3500e3 && (await S2.tick([{ id: 'b1', at: '1' }], books, { gapMs: 0 })) === 0 && asked.length - asked0 === 1, '429(많이 물음)이면 그 회차를 멈추고 1시간 쉼 — 알라딘을 괴롭히지 않음'); }
{ const it = [{ id: 'a', im: 'https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_1%2Ffront_t.webp?alt=media', sp: 'x', at: '2026-11-10' }, { id: 'b', im: 'https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_2%2Ffront_t.webp?alt=media', at: '2026-09-01' }, { id: 'c', im: 'https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_3%2Ffront_t.webp?alt=media', at: '2026-11-01' }, { id: 'd', im: 'https://image.aladin.co.kr/x.jpg', at: '2026-11-11' }];
  ok(CV.order(it).map((x) => x.id).join('') === 'cba' && CV.TICK_N >= 300 && CV.TICK_MS <= 300e3 && CV.PAR >= 2, `표지 대표색 차례: 책등 그림 없는 책 → 새 책 먼저(${CV.order(it).map((x) => x.id).join('')}) · 5분마다 ${CV.TICK_N}권 · ${CV.PAR}개씩 나란히(전엔 10분 120권 — 16,000권 22시간 → 약 4시간)`);
  let fly = 0, mx = 0; const W = []; const items = Array.from({ length: 320 }, (_, i) => ({ id: 'x' + i, im: `https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_${i}%2Ffront_t.webp?alt=media`, at: '2026-10-' + String(1 + (i % 28)).padStart(2, '0') }));
  const M = CV.makeCover({ C: fakeC(W, {}), bucket: () => ({ file: () => ({ download: async () => { fly++; mx = Math.max(mx, fly); await new Promise((r) => setTimeout(r, 2)); fly--; throw new Error('No such object'); } }) }) });
  let jpegOk = true; try { require.resolve('jpeg-js', { paths: [path.join(ROOT, 'cloud')] }); } catch (e) { jpegOk = false; }
  if (jpegOk) { await M.tick(CV.order(items), CV.TICK_N); const s = M.state(); ok(s.n === 300 && mx === CV.PAR && W.filter((w) => w[0] === 'shop_cover').length >= 2, `한 회차 300권 · 동시에 ${mx}개 · 150권마다 중간 저장(쓰기 ${W.length}번)`); } else console.log('  (jpeg-js 없음 — 회차 시험은 클라우드 꾸러미 설치 뒤)'); }
{ const ids = BQS.FONTS.slice(50).map((f) => f.id); ok(ids.length === 18 && ids.join() === Object.keys(FT.LIST).join() && BQS.FONTS.slice(50).every((f, i) => f.bq && f.wt === FT.LIST[f.id][2]) && BQS.FONTS.slice(0, 50).every((f) => !f.bq), '글꼴 51~68 = 클라우드 글꼴 창구 목록과 같은 별칭·굵기·차례(뒤에만 덧붙임 · 처음 50은 그대로)');
  ok(BQS.FGEN.length === 68 && BQS.FGEN.slice(50).every((g) => BQS.GENRES[g]) && BQS.fontsOfGenre('rd').length >= 4 && BQS.fontsOfGenre('my').length >= 12, `새 글꼴도 갈래(명조 ${BQS.fontsOfGenre('my').length} · 둥근 ${BQS.fontsOfGenre('rd').length} · 고딕 ${BQS.fontsOfGenre('go').length})`);
  const css = BQS.fontCss('suit-b', '나가나 A', 'bqf-suit-b-cat0', 'http://x/'); ok(/font-family:'bqf-suit-b-cat0'/.test(css) && /url\(http:\/\/x\/shop\/font\?f=suit-b&t=/.test(css) && decodeURIComponent(css.split('&t=')[1].split(')')[0]) === ' A가나' && /font-weight:700/.test(css) && BQS.fontCss('jua', '가') === null, '화면: 우리 글꼴은 @font-face를 바로 만듦(글자 정렬·겹침 뺌 → 같은 책장 같은 주소) · 구글 글꼴은 그대로');
  ok(FT.textOf('다가나가\u0001') === '가나다' && FT.textOf('가'.repeat(5000)).length === 1 && [...FT.textOf(Array.from({ length: 2000 }, (_, i) => String.fromCharCode(0xac00 + i)).join(''))].length === 900, '창구: 글자 정리(겹침·조절 글자 뺌 · 정렬 · 900자까지)');
  let sub = 0, got = 0; const F = FT.makeFont({ fetch: async (u) => { got++; return { ok: true, arrayBuffer: async () => { const b = Buffer.alloc(4000); b.write('wOF2', 0, 'latin1'); return b; } }; }, subset: async (b, t) => { sub++; return Buffer.from('wOF2' + t); } });
  const r1 = await F.get('neodgm', '나가'); const r2 = await F.get('neodgm', '가나'); let e404 = null; try { await F.get('없는것', '가'); } catch (e) { e404 = e.code; }
  ok(String(r1).endsWith('가나') && r1.equals(r2) && sub === 1 && got === 1 && e404 === 404, '창구: 원본은 한 번만 받음 · 같은 글자 묶음은 다시 자르지 않음(캐시) · 없는 글꼴 404');
  const real = (() => { try { return require.resolve('subset-font', { paths: [path.join(ROOT, 'cloud')] }); } catch (e) { return null; } })(); if (!real) console.log('  (subset-font 없음 — 실제 자르기는 클라우드 꾸러미 설치 뒤 · 손으로 18개 모두 확인함)'); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELF5_1111 ${bad}개 실패` : '✓ tSHELF5_1111 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || require('os').tmpdir(); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const D = BQS.demoItems(30, 5); const items = [...Array.from({ length: 80 }, (_, i) => ({ ...D[i % 30], id: 'E' + i, t: '바다 건너 이야기 ' + i, c: '소설/시/희곡', c2: '영미소설', at: '2026-10-01' })), ...D.map((x, i) => ({ ...x, id: 'D' + i }))];
const rows = items.map((x) => [x.id, x.t, x.a, x.c, x.p, x.lp, x.g, x.at, null, null, null, 's', null, x.pg, x.pb, x.sz, null, x.c2 || null, null, null]);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/shop/cfg') return J({ ok: true, open: 1, name: '북스퀸', shipFee: 3500, freeOver: 30000, maxItems: 20, n: rows.length, cats: [], pay: { how: 'wait' }, biz: {}, shelf: { cap: 200, sort0: 'cat' } });
  if (u.pathname === '/shop/shelf') return J({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows });
  if (u.pathname === '/shop/font') { res.writeHead(404); return res.end(); }
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 200초 넘음'); process.exit(1); }, 200000);
const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const over = (a, b) => !!(a && b && a.w && b.w && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
try {
  for (const W of [390, 430]) { const ctx = await br.newContext({ viewport: { width: W, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    let failed = 0; if (W === 390) await p.route(/\/s\/shelf\.js/, (r) => { if (!failed++) return r.abort(); return r.continue(); }); /* 첫 로딩 때 책장 화면 파일이 한 번 안 옴 */
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; }, base);
    await p.goto(base + '/s/index.html#/shelf?s=cat'); await p.waitForSelector('.bqs-case.cur .mrow', { timeout: 20000 }); await p.waitForTimeout(500);
    if (W === 390) ok(failed >= 2, `${W}px 첫 로딩: 책장 화면 파일이 한 번 안 와도 다시 받아 책장이 섬(받기 ${failed}번)`);
    const hs = await p.$$eval('.bqs-case.cur .mrow h3', (L) => L.map((h) => h.childNodes[0].textContent.trim())); const cont = hs.filter((h) => /이어서/.test(h));
    ok(cont.length >= 2 && hs.every((h) => (h.match(/\(이어서\)/g) || []).length <= 1), `${W}px 표찰: 이어진 줄 ${cont.length}개 모두 '(이어서)' 한 번만 — 「${cont[cont.length - 1] || '-'}」`);
    await p.evaluate(() => { const t = document.querySelector('#toast'); t.textContent = '장바구니에 담았습니다'; t.classList.add('on'); }); await p.waitForTimeout(300);
    const R = await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display === 'none' || cs.visibility === 'hidden' ? null : { x: b.left, y: b.top, w: b.width, h: b.height }; }; return { bar: r('.bqs-mbar'), toast: r('#toast'), cart: r('.bqs-cart'), foot: r('#foot'), vh: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    ok(R.bar && R.bar.y + R.bar.h <= R.vh + 1 && R.bar.y > R.vh - 120, `${W}px 아래 고정 줄이 화면 맨 아래(높이 ${Math.round(R.bar && R.bar.h)}px)`);
    ok(R.toast && !over(R.toast, R.bar), `${W}px 알림 토스트가 아래 줄 위로(토스트 아래 ${Math.round(R.toast && R.toast.y + R.toast.h)} ≤ 줄 위 ${Math.round(R.bar && R.bar.y)})`);
    ok(!R.cart && !R.foot && R.sw <= R.iw + 1, `${W}px 둥근 카트·바닥 글은 숨김(아래 줄의 🛒가 대신) · 가로 넘침 없음`);
    await p.screenshot({ path: path.join(SHOT, `shelf5_mob${W}.png`) }); await p.evaluate(() => document.querySelector('#toast').classList.remove('on'));
    await p.evaluate(() => { const s = document.querySelector('.mstrip'); s.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, `shelf5_mob${W}_rows.png`) });
    await p.evaluate(() => { location.hash = '#/list?s=new'; }); await p.waitForTimeout(500); const left = await p.evaluate(() => ({ bar: !!document.querySelector('.bqs-mbar'), mob: document.body.classList.contains('shelf-mob') }));
    ok(!left.bar && !left.mob, `${W}px 서가를 떠나면 아래 줄·표시가 남지 않음(다른 화면과 안 겹침)`); ok(!errs.length, `${W}px 화면 오류 0${errs.length ? ' — ' + errs[0] : ''}`); await ctx.close(); }
  { const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; }, base);
    await p.goto(base + '/s/index.html#/shelf'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({ bar: getComputedStyle(document.querySelector('.bqs-mbar')).display, cart: getComputedStyle(document.querySelector('.bqs-cart')).display }));
    ok(d.bar === 'none' && d.cart !== 'none', `PC: 아래 고정 줄은 정말 숨김(전엔 hidden이어도 display:flex가 이겨 떠 있었음) · 둥근 카트는 그대로`); await p.screenshot({ path: path.join(SHOT, 'shelf5_pc.png') }); await ctx.close(); }
} finally { clearTimeout(kill); await br.close(); srv.close(); }
console.log(bad ? `❌ tSHELF5_1111 ${bad}개 실패` : '✓ tSHELF5_1111 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌', e && e.stack); process.exit(1); });
