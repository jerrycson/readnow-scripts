// tSHOP4FIX1111 — (11/12 shelf4 · 원칙 56) 우리숍 한 바퀴 점검에서 고른 불편 다섯 가지 — 성공한 쇼핑몰 기준
//   ① 책 찾기: 끝까지 내리면 저절로 다음 쪽(쿠팡·알라딘 휴대폰 목록) · '더 보기' 단추도 그대로
//   ② 책 찾기: 책을 보고 '뒤로' 오면 불러온 쪽·보던 자리 그대로(쿠팡·아마존) — 전엔 첫 쪽 맨 위로
//   ③ 책 한 권: ♡ 찜 단추(알라딘·교보 상품 화면) — 서가·찜 목록과 같은 저장
//   ④ 주문서: 모두 동의(쿠팡·무신사)
//   ⑤ 주문서: 장바구니를 고치러 갔다 와도 적은 칸 그대로(이 탭에만 · sessionStorage · 탭을 닫으면 지워짐 · 동의는 안 남김)
// 실행: node src/tests/tSHOP4FIX1111.js (playwright 필요 · 가짜 클라우드 · 지어낸 책 · 손님 정보 없음 · 전화는 010-0000-0000)
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..');
(async () => {
  const BOOKS = Array.from({ length: 72 }, (_, i) => ({ id: 'T' + i, t: '시험 책 ' + i, a: '지은이 ' + i, p: 3000 + i * 100, lp: 12000, g: '상', im: null, at: '2026-10-01', st: 's' }));
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (u.pathname === '/shop/cfg') return J({ ok: true, open: 1, name: '북스퀸', shipFee: 3500, freeOver: 30000, payDays: 2, maxItems: 20, n: BOOKS.length, cats: [], pay: { how: 'wait' }, biz: {} });
    if (u.pathname === '/shop/list') { const p = +u.searchParams.get('p') || 0; return J({ ok: true, items: BOOKS.slice(p * 24, p * 24 + 24), total: BOOKS.length, more: (p + 1) * 24 < BOOKS.length }); }
    if (u.pathname === '/shop/item') { const x = BOOKS.find((b) => b.id === u.searchParams.get('id')); return J({ ok: true, item: x, same: [], rel: [] }); }
    if (u.pathname === '/shop/check') return J({ ok: true, st: {}, p: {} });
    if (u.pathname === '/shop/quote') return J({ ok: true, local: 1 });
    if (u.pathname.startsWith('/shop/')) return J({ ok: true });
    const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const { chromium } = require('playwright'); const br = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] }); const kill = setTimeout(() => { console.log('  ❌ 120초 넘음'); process.exit(1); }, 120000);
  try {
    for (const [W, H, mob] of [[1280, 800, false], [390, 844, true]]) { const tag = mob ? '휴대폰' : 'PC';
      const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('창 ' + d.message()); d.dismiss().catch(() => {}); });
      await p.addInitScript((u) => { window.BQ_API = u; }, base); await p.goto(base + '/s/index.html#/list?s=new'); await p.waitForSelector('#lg .grid .card');
      const n0 = await p.$$eval('#lg .card', (L) => L.length); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForFunction(() => document.querySelectorAll('#lg .card').length >= 48, null, { timeout: 8000 }).catch(() => {});
      const n1 = await p.$$eval('#lg .card', (L) => L.length); ok(n0 === 24 && n1 >= 48, `${tag} ① 책 찾기: 끝까지 내리면 저절로 다음 쪽(${n0} → ${n1}권)`);
      await p.evaluate(() => { const c = document.querySelectorAll('#lg .card')[40]; c.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(150); const y0 = await p.evaluate(() => Math.round(scrollY));
      await p.click('#lg .card >> nth=40'); await p.waitForSelector('.det h1'); const t1 = await p.textContent('.det h1');
      await p.goBack(); await p.waitForSelector('#lg .grid .card'); await p.waitForTimeout(250); const back = await p.evaluate(() => ({ n: document.querySelectorAll('#lg .card').length, y: Math.round(scrollY) }));
      ok(back.n >= 48 && Math.abs(back.y - y0) < 40, `${tag} ② 「${t1}」을 보고 뒤로 → 불러온 ${back.n}권·보던 자리(${y0} → ${back.y}px) 그대로`);
      await p.goto(base + '/s/index.html#/b/T3'); await p.waitForSelector('#wsh'); await p.click('#wsh'); await p.waitForTimeout(150);
      const w = await p.evaluate(() => ({ on: document.querySelector('#wsh').getAttribute('aria-pressed'), n: JSON.parse(localStorage.getItem('bq-wish') || '[]').length, badge: document.querySelector('#wishN').textContent }));
      ok(w.on === 'true' && w.n === 1 && w.badge === '1', `${tag} ③ 책 한 권 화면 ♡ → 찜 목록에 넣음(찜 ${w.badge})`); await p.screenshot({ path: path.join(process.env.RN_SHOT || require('os').tmpdir(), `shop_item_wish_${mob ? 'mobile' : 'pc'}.png`) });
      await p.click('#add'); await p.waitForTimeout(200); await p.goto(base + '/s/index.html#/order'); await p.waitForSelector('#f_all');
      await p.check('#f_all'); const ag = await p.evaluate(() => [document.querySelector('#f_agreeP').checked, document.querySelector('#f_agreeT').checked]); await p.uncheck('#f_agreeT'); const ag2 = await p.evaluate(() => document.querySelector('#f_all').checked);
      ok(ag[0] && ag[1] && !ag2, `${tag} ④ 주문서 「모두 동의」 → 필수 둘 다 · 하나 풀면 「모두 동의」도 풀림`);
      await p.fill('#f_name', '손님A'); await p.fill('#f_phone', '010-0000-0000'); await p.fill('#f_addr1', '시험시 시험로 1'); await p.waitForTimeout(400); await p.click('a.edit'); await p.waitForSelector('#toOrder'); await p.click('#toOrder'); await p.waitForSelector('#f_name');
      const kept = await p.evaluate(() => ({ n: document.querySelector('#f_name').value, ph: document.querySelector('#f_phone').value, a: document.querySelector('#f_addr1').value, ag: document.querySelector('#f_agreeP').checked, ss: !!sessionStorage.getItem('bq-odraft'), ls: Object.keys(localStorage).filter((k) => /draft/.test(k)).length }));
      ok(kept.n === '손님A' && kept.ph === '010-0000-0000' && kept.a === '시험시 시험로 1' && !kept.ag && kept.ss && !kept.ls, `${tag} ⑤ 장바구니를 고치러 갔다 와도 적은 칸 그대로(이 탭 sessionStorage에만 · 기기 저장소엔 없음 · 동의는 다시)`);
      ok(!errs.length, `${tag} 오류·브라우저 창 0 ${errs.join(' | ')}`); await ctx.close(); }
  } catch (e) { bad++; console.log('  ❌ 화면 시험 오류', e.message); }
  clearTimeout(kill); await br.close(); srv.close();
  console.log(bad ? `❌ tSHOP4FIX1111 ${bad}개 실패` : '✓ tSHOP4FIX1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
