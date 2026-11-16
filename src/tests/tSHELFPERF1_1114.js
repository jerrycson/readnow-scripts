// tSHELFPERF1_1114 — (11/14 shelfperf1) 📚 서가: 세트를 열면 한 권만 크게 쌓이던 것 · 서가가 버벅거리던 것(글꼴 하나 붙을 때마다 화면 전체 다시 배치)
//   정범님 11/14 20:08(사진: 「알바 뛰는 마왕님! 0~17」·「수호지 1~7」·「완역판 세계문학 1~60 중 전55권」·「월요일의 타와와 청판 1~12」 — 한 권만 크게)
//   원인 ① 세트를 누를 때 마우스가 그 권 위에 있어 마우스 올림 확대(최대 1.7배 · 휴대폰은 눌러 들기 1.35배·기울임)가 걸린 채로 권 크기를 재어, 그 권만 확대된 크기로 쌓였음
//        → 재기 전에 먼저 '뽑음'(pulled) 표시를 붙이고, 뽑은 자리는 확대·들기·기울임·돌아온 표시를 모두 끔(닫을 때 돌아갈 자리도 같은 크기)
//   원인 ② 서가 글꼴(책장 하나에 약 60가지)을 받는 대로 하나씩 붙여, 붙일 때마다 브라우저가 화면 전체(약 1만 칸)를 다시 배치 — 실제 사이트에서 스크롤 초당 7장(PC)·5장(휴대폰)
//        → 받은 글꼴을 모아 한 번에 붙임(처음 1.2초 · 그다음 4초마다 · 받을 줄이 비면 바로)
//   ① 순수 검사(코드 모양) · ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 상품): PC 1280 마우스 올린 권·다른 권 · 휴대폰 390 눌러 들기 뒤 열기 · 글꼴 모아 붙이기 횟수
// 실행: node src/tests/tSHELFPERF1_1114.js · 화면까지: RN_SHELF_UI=1 node src/tests/tSHELFPERF1_1114.js
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
(async () => {
console.log('① 코드 모양');
{ const js = fs.readFileSync(path.join(ROOT, 'shop/shelf.js'), 'utf8'); const css = fs.readFileSync(path.join(ROOT, 'shop/shelf.css'), 'utf8');
  const blk = js.slice(js.indexOf('function openSet('), js.indexOf('function closeSet('));
  const iPull = blk.indexOf("for (const s of srcs) s.classList.add('pulled')"), iMeas = blk.indexOf('r0 = sk.getBoundingClientRect()');
  ok(iPull > 0 && iMeas > iPull, '세트 열기: 권 크기를 재기 전에 먼저 뽑음 표시(마우스 올림 확대가 풀린 크기로 잼)');
  ok(/\.sp\.pulled \.sk, \.cvb\.pulled \.cvf \{ transform: none !important; transition: none !important; animation: none !important; \}/.test(css), '뽑은 자리는 확대·들기·기울임·움직임 모두 끔(!important — 마우스 올림 규칙보다 앞섬)');
  const fg = js.slice(js.indexOf('function fontGet('), js.indexOf('const fontsDrop'));
  ok(!/document\.fonts\.add/.test(fg) && /fontPut\(al, \[ff\]\)/.test(fg) && /function fontFlush\(\)/.test(js) && /cssFaces\(css, al\)/.test(js), '글꼴: 받는 대로 붙이지 않고 모아 붙임(우리 클라우드 글꼴·구글 글꼴 모두)');
  ok(/if \(!FQ\.length && !fRun && FP\.q\.length\) fontFlush\(\)/.test(js) && /FIN\.has\(al\)/.test(js), '받을 줄이 비면 바로 붙임 · 받는 중인 글꼴은 다시 받지 않음');
  const s = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf\.js\?v=0\.2\.(1[5-9]|[2-9]\d)/.test(s) && /shelf\.css\?v=0\.2\.(1[5-9]|[2-9]\d)/.test(s), '판 번호: 서가 0.2.15 이후(손님 브라우저가 새 파일을 받게)');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(js), '브라우저 창 없음'); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELFPERF1_1114 ${bad}개 실패` : '✓ tSHELFPERF1_1114 순수 검사 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const { chromium } = require('playwright');
const FONT = ['/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find((f) => fs.existsSync(f));
const SVG = (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="430"><rect width="300" height="430" fill="hsl(${h},55%,40%)"/><text x="24" y="90" font-size="34" fill="#fff" font-family="sans-serif">세트 ${h}</text></svg>`;
const D0 = BQS.demoItems(160, 7).map((x, i) => ({ ...x, id: 'D' + i, im: null, bk: null, at: '2026-09-' + String(1 + (i % 28)).padStart(2, '0') }));
const SPEC = [['S1', '[세트] 시험 마왕 만화 0~17 - 전19권', '그린이 가', '국내도서>만화', '128x188x260', 3800], ['S2', '[세트] 시험 대하소설 1~7 - 전7권', '지은이 나', '국내도서>소설/시/희곡>한국소설', '152x225x150', 2400], ['S3', '[세트] 시험 문학 전집 1~12', '지은이 다', '국내도서>소설/시/희곡>세계문학', '128x188x180', 3000]];
const mk = (base) => [...SPEC.map(([id, t, a, cp, sz, pg], i) => ({ id, t, a, cp, c: cp.split('>')[1] || cp, p: 22000 + i * 3000, lp: 60000, at: '2026-11-14', sz, pg, im: base + '/img/c_' + (60 * i + 20) + '.svg', sp: null })), ...D0];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let rows = []; const FN = { n: 0 };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const Jo = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(o)); };
  const m = /^\/img\/c_(\d+)/.exec(u.pathname); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(SVG(+m[1])); }
  if (u.pathname === '/font.ttf' || u.pathname === '/shop/font') { FN.n++; res.writeHead(200, { 'Content-Type': 'font/ttf', 'Access-Control-Allow-Origin': '*' }); return setTimeout(() => res.end(FONT ? fs.readFileSync(FONT) : ''), 40 + Math.round(Math.random() * 200)); }
  if (u.pathname === '/shop/cfg') return Jo({ ok: true, open: 1, name: '북스퀸', n: rows.length, pay: { how: 'wait' }, biz: {}, kinds: [], cats: [], shelf: { cap: 200, sort0: 'reg', fontsOn: !!u.searchParams.get('f') || FN.on, coverColor: false, edgeSpine: false } });
  if (u.pathname === '/shop/shelf') return Jo({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: [], rows });
  if (u.pathname.startsWith('/shop/')) return Jo({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
rows = mk(base).map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : x[k] == null ? null : x[k])));
const kill = setTimeout(() => { console.log('  ❌ 240초 넘음'); process.exit(1); }, 240000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash) => { const ctx = await br.newContext({ deviceScaleFactor: 1, ...ctxO }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  /* 구글 글꼴 CSS는 우리 가짜 서버 글꼴 파일을 가리키게(바깥 연결 없이 모아 붙이기를 시험) */
  await p.route(/fonts\.googleapis\.com\/css2/, (r) => r.fulfill({ status: 200, contentType: 'text/css', headers: { 'Access-Control-Allow-Origin': '*' }, body: `@font-face { font-family: 'X'; font-style: normal; font-weight: 400; font-display: swap; src: url(${base}/font.ttf?${Math.random()}) format('truetype'); }` }));
  await p.route(/fonts\.gstatic\.com/, (r) => r.abort());
  await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); } catch (e) {} }, base);
  await p.goto(base + '/s/index.html' + hash); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(600); return { ctx, p, errs }; };
const phase = (p) => p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '');
const waitPh = async (p, ph, n) => { for (let w = 0; w < (n || 80); w++) { if ((await phase(p)) === ph) return true; await p.waitForTimeout(50); } return false; };
/* 꺼낸 권 크기 — 자리 칸(기울이기 전) 너비·높이 + 화면에 보이는 긴 변 */
const skH = (p, sel) => p.evaluate((s) => document.querySelector(s).querySelector('.sk').getBoundingClientRect().height, sel);
const ghosts = (p) => p.evaluate(() => [...document.querySelectorAll('.ss-stage .ss-v')].map((g) => { const r = g.getBoundingClientRect(); return { v: +g.dataset.v, w: g.offsetWidth, h: g.offsetHeight, long: Math.max(r.width, r.height) }; }));
const same = (G) => { const W = G.map((g) => g.w), H = G.map((g) => g.h), L = G.map((g) => g.long); return { ok: Math.max(...W) - Math.min(...W) <= 1.5 && Math.max(...H) - Math.min(...H) <= 1.5 && Math.max(...L) / Math.min(...L) < 1.04, txt: `두께 ${Math.min(...W)}~${Math.max(...W)}px · 길이 ${Math.min(...H)}~${Math.max(...H)}px` }; };
try {
  { const { ctx, p, errs } = await open({ viewport: { width: 1280, height: 860 } }, '#/shelf?s=reg');
    for (const [id, k] of [['S1', 9], ['S2', 3], ['S3', 6]]) { const sel = `.bqs-case.cur .bqs-set[data-set="${id}"] .sp.sv[data-v="${k}"]`; await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(150);
      await p.mouse.move(2, 2); await p.waitForTimeout(300); const h0 = await skH(p, sel); await p.hover(sel); await p.waitForTimeout(400); const hv = Math.round((await skH(p, sel)) / h0 * 100) / 100;
      await p.click(sel); await waitPh(p, 'open', 120); await p.waitForTimeout(300); const G = await ghosts(p); const S = same(G); const big = G.find((g) => g.v === k);
      ok(G.length >= 7 && S.ok, `PC ${id}: 마우스를 올려 확대된(${hv}배) ${k + 1}번째 권을 눌러도 ${G.length}권 모두 같은 크기로 쌓임(${S.txt} · 누른 권 ${big ? big.w + '×' + big.h : '?'})`);
      await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 160); await p.waitForTimeout(150);
      const left = await p.evaluate(() => ({ ob: !!document.querySelector('.bqs-ob'), pulled: document.querySelectorAll('.bqs-case.cur .sp.pulled').length })); ok(!left.ob && !left.pulled, `PC ${id}: 닫으면 모두 제자리(뽑음 표시 남지 않음)`); }
    /* 한 권 위에 마우스를 두었다가 다른 권을 눌러도 · 두 번 연달아 열어도 */
    const s2 = '.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv'; await p.hover(s2 + '[data-v="0"]'); await p.waitForTimeout(300); await p.click(s2 + '[data-v="5"]'); await waitPh(p, 'open', 120); await p.waitForTimeout(200); const G2 = same(await ghosts(p));
    await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 160); await p.hover(s2 + '[data-v="5"]'); await p.waitForTimeout(300); await p.click(s2 + '[data-v="5"]'); await waitPh(p, 'open', 120); await p.waitForTimeout(200); const G3 = same(await ghosts(p));
    ok(G2.ok && G3.ok, `PC: 다른 권으로 옮겨 누르기 · 닫고 같은 권 다시 열기도 같은 크기(${G2.txt} / ${G3.txt})`); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 160);
    const s5 = s2 + '[data-v="5"]'; await p.mouse.move(2, 2); await p.waitForTimeout(300); const q0 = await skH(p, s5); await p.hover(s5); await p.waitForTimeout(400); const hov = (await skH(p, s5)) / q0; ok(hov > 1.02, `닫은 뒤에는 마우스 올림 확대가 예전처럼 다시 됨(${hov.toFixed(2)}배)`);
    ok(!errs.length, 'PC 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, '#/shelf?s=reg'); const sel = '.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="3"]';
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(200); await p.tap(sel); await p.waitForTimeout(120); if (!(await p.evaluate(() => !!document.querySelector('.bqs-sset')))) { await p.tap(sel); }
    await waitPh(p, 'open', 120); await p.waitForTimeout(300); const G = await ghosts(p); const S = same(G); ok(G.length === 7 && S.ok, `휴대폰: 눌러 든(1.35배) 권을 다시 눌러 열어도 7권 같은 크기(${S.txt})`); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 160); ok(!errs.length, '휴대폰 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 글꼴 모아 붙이기 — 가짜 글꼴 여러 개가 따로따로 와도 붙이는 횟수는 몇 번 */
  if (FONT) { FN.on = true; FN.n = 0; const { ctx, p, errs } = await open({ viewport: { width: 1280, height: 860 } }, '#/shelf?s=reg'); await p.waitForTimeout(9000);
    const R = await p.evaluate(() => ({ fam: new Set([...document.fonts].filter((f) => /^bqf-/.test(f.family) && f.status === 'loaded').map((f) => f.family)).size, flush: +document.querySelector('.bqs').dataset.fontFlush || 0, styles: document.querySelectorAll('style[data-bqf]').length }));
    ok(R.fam >= 5 && R.flush >= 1 && R.flush <= Math.max(3, Math.ceil(R.fam / 4)) && R.styles === 0, `글꼴 ${R.fam}가지(받은 파일 ${FN.n}개)를 ${R.flush}번에 모아 붙임(예전엔 글꼴마다 = ${R.fam}번 화면 전체 다시 배치)`);
    ok(!errs.length, '글꼴 시험 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); FN.on = false; } else console.log('  (시험 글꼴 파일이 없어 글꼴 모아 붙이기 화면 시험은 건너뜀)');
} catch (e) { bad++; console.log('  ❌ 화면 시험 예외', e && e.stack ? e.stack.slice(0, 900) : e); }
await br.close(); srv.close(); clearTimeout(kill);
console.log(bad ? `❌ tSHELFPERF1_1114 ${bad}개 실패` : '✓ tSHELFPERF1_1114 모두 통과'); process.exit(bad ? 1 : 0);
})();
