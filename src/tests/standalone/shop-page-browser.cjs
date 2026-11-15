'use strict';
// 실제 손님 화면을 로컬 가짜 응답으로 검사한다. 주문·고객 자료·바깥 서버 연결 없음.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const ROOT = path.resolve(process.env.RN_REVIEW_ROOT || path.join(__dirname, '../../..'));
const { chromium } = require(process.env.RN_PLAYWRIGHT || 'playwright');
const BOOK = { id: 'TEST-A', t: '가상 시험 책', a: '가상 작가', p: 2000, lp: 4000, g: '상', st: 's', q: 3, n: 1 };
const CFG = { ok: true, open: 1, name: '가상 시험 책방', n: 1, cats: [], kinds: [], biz: {}, maxItems: 20, shipFee: 0, freeOver: 0, pay: { how: 'wait' }, shelf: { fontsOn: false }, look: { rows: ['new'] } };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function run() {
  const server = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const file = path.resolve(ROOT, 'shop', u.pathname.slice(3));
    if (!u.pathname.startsWith('/s/') || !file.startsWith(path.join(ROOT, 'shop') + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('{}'); }
    res.writeHead(200, { 'Content-Type': (MIME[path.extname(file)] || 'text/plain') + '; charset=utf-8' }); fs.createReadStream(file).pipe(res); });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port;
  let browser; try { browser = await chromium.launch({ ...(process.env.RN_BROWSER ? { executablePath: process.env.RN_BROWSER } : {}), headless: true }); } catch (e) { await new Promise(r => server.close(r)); throw e; }
  const results = [];
  const fixture = async (width) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...(width < 500 ? { isMobile: true, hasTouch: true } : {}) });
    const p = await ctx.newPage(); p.setDefaultTimeout(7000); const errors = [], holds = [], pending = new Set(); let external = 0, writes = 0, expectedWrites = 0;
    p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => { errors.push('예상하지 않은 브라우저 창'); d.dismiss(); });
    const data = u => {
      if (u.pathname === '/shop/cfg') return CFG;
      if (u.pathname === '/shop/item') return { ok: true, item: { ...BOOK, id: u.searchParams.get('id') }, rel: [] };
      if (u.pathname === '/shop/cats') return { ok: true, tree: [['가상 분야', 1]], kinds: [['가상 분야', 1]] };
      if (u.pathname === '/shop/list') return { ok: true, items: [BOOK], total: 1, more: false };
      if (u.pathname === '/shop/check') return { ok: true, st: { [BOOK.id]: 's' }, p: { [BOOK.id]: BOOK.p } };
      if (u.pathname === '/shop/quote') return { ok: true, items: [BOOK], bad: [], n: 1, sum0: BOOK.p, bundle: 0, coupon: null, sum: BOOK.p, fee: 0, total: BOOK.p, free: null };
      if (u.pathname === '/shop/order') return { ok: true, no: 'TEST-ORDER', st: 'new', stTxt: '가상 주문', items: [BOOK], sum: BOOK.p, total: BOOK.p, shipFee: 0 };
      return { ok: true, items: [], tree: [], kinds: [], total: 0 };
    };
    await ctx.route('**/*', async r => { const u = new URL(r.request().url()); if (u.origin !== base) { external++; return r.abort(); }
      if (!u.pathname.startsWith('/shop/')) return r.continue();
      if (r.request().method() !== 'GET' && u.pathname !== '/shop/quote') writes++;
      const h = holds.find(x => !x.taken && x.match(u, r.request()));
      if (h) { h.taken = true; pending.add(h); h.seen.resolve(); const response = await h.reply.promise; pending.delete(h); return r.fulfill({ status: response.status, contentType: 'application/json', body: JSON.stringify(response.data) }).catch(() => {}); }
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data(u)) }); });
    await p.addInitScript(({ base, book }) => { window.BQ_API = base; localStorage.setItem('bq-cart', JSON.stringify([book])); }, { base, book: BOOK });
    await p.goto(base + '/s/index.html#/wish'); await p.locator('h1.pt').waitFor(); await p.waitForTimeout(80);
    const hold = match => { const h = { match: typeof match === 'string' ? u => u.pathname === match : match, seen: deferred(), reply: deferred(), taken: false }; holds.push(h); return { seen: h.seen.promise, release: (data, status = 200) => h.reply.resolve({ data, status }) }; };
    const nav = hash => p.evaluate(h => { location.hash = h; }, hash);
    const settle = () => p.waitForTimeout(120);
    const close = async () => { for (const h of pending) h.reply.resolve({ status: 400, data: { ok: false, err: '시험 종료' } }); await ctx.close(); };
    return { p, nav, hold, settle, close, errors, expectWrites: n => { expectedWrites = n; }, blocked: () => external, freshCfg: () => p.evaluate(() => { const now = Date.now.bind(Date); Date.now = () => now() + 120000; }), verify: () => { assert.deepEqual(errors, [], '화면 오류 없음'); /* 공통 이용 기록 등의 외부 시도도 위 route에서 전부 차단한다. */ assert.equal(writes, expectedWrites, '가짜 서버로 보낸 쓰기 요청 수'); } };
  };
  const test = async (name, fn, width = 1280) => { const h = await fixture(width); let timer; try { if (process.env.RN_PROGRESS) console.log('검사 시작: ' + name); await Promise.race([fn(h), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('화면 검사 12초 제한')), 12000); })]); h.verify(); results.push({ name: name + ' (' + width + 'px)', ok: true, blockedExternal: h.blocked() }); } catch (e) { results.push({ name: name + ' (' + width + 'px)', ok: false, error: e.message, pageErrors: h.errors }); } finally { clearTimeout(timer); await h.close(); } };
  try {
    for (const width of [1280, 390]) await test('이전 상품 오류가 작성 중인 주문서를 덮지 않음', async h => {
      const old = h.hold('/shop/item'); await h.nav('#/b/TEST-A'); await old.seen; await h.nav('#/order'); await h.p.locator('#f_name').fill('가상 입력 내용');
      old.release({ ok: false, err: '이전 상품의 가짜 오류' }, 400); await h.settle(); assert.equal(await h.p.locator('#f_name').count(), 1, '현재 주문서 유지'); assert.equal(await h.p.locator('#f_name').inputValue(), '가상 입력 내용');
    }, width);
    await test('같은 상품으로 재진입할 때 이전 응답이 최신 가격을 덮지 않음', async h => {
      const old = h.hold('/shop/item'); await h.nav('#/b/TEST-A'); await old.seen; await h.nav('#/wish'); await h.p.locator('h1.pt').waitFor(); await h.nav('#/b/TEST-A'); await h.p.locator('.info h1').waitFor();
      old.release({ ok: true, item: { ...BOOK, t: '이전 응답 책', p: 1000 }, rel: [] }); await h.settle(); assert.equal(await h.p.locator('.info h1').textContent(), BOOK.t); assert.match(await h.p.locator('.info .price').textContent(), /2,000/);
    });
    await test('홈에 재진입한 뒤 이전 목록이 최신 목록을 덮지 않음', async h => {
      const old = h.hold('/shop/list'); await h.nav('#/'); await old.seen; await h.nav('#/wish'); await h.p.locator('h1.pt').waitFor(); await h.nav('#/'); await h.p.locator('#nwg').waitFor();
      old.release({ ok: true, items: [{ ...BOOK, t: '이전 응답 책' }], total: 1, more: false }); await h.settle(); assert(!((await h.p.locator('#nwg').textContent()).includes('이전 응답 책')), '최신 목록 유지');
    });
    for (const [name, hash, endpoint] of [['분류', '#/cats', '/shop/cats'], ['요약 목록', '#/ai', '/shop/ailist'], ['주문 조회', '#/done/TEST-ORDER?t=synthetic', '/shop/order']]) await test(name + '의 늦은 오류가 이동한 화면을 보존', async h => {
      const old = h.hold(endpoint); await h.nav(hash); await old.seen; await h.nav('#/wish'); await h.p.locator('h1.pt').waitFor(); old.release({ ok: false, err: '이전 화면 가짜 오류' }, 400); await h.settle(); assert.match(await h.p.locator('#main').textContent(), /찜 목록/);
    });
    for (const [name, hash, status] of [['장바구니', '#/cart', 200], ['주문서', '#/order', 400], ['구매 안내', '#/p/terms', 200]]) await test(name + ' 설정 수신 중 이동하면 새 화면 유지', async h => {
      await h.freshCfg(); const old = h.hold('/shop/cfg'); await h.nav(hash); await old.seen; await h.nav('#/wish'); await h.p.locator('h1.pt').waitFor(); old.release(status === 200 ? CFG : { ok: false, err: '옛 설정 가짜 오류' }, status); await h.settle(); assert.match(await h.p.locator('#main').textContent(), /찜 목록/);
    });
    await test('다른 검색으로 이동하면 이전 목록 정상·실패 응답 모두 무시', async h => {
      for (const status of [200, 400]) { const old = h.hold('/shop/list'); await h.nav('#/list?q=old' + status); await old.seen; await h.nav('#/list?q=new' + status); await h.p.locator('#lg .card').first().waitFor(); old.release(status === 200 ? { ok: true, items: [{ ...BOOK, t: '이전 검색 책' }], total: 1, more: false } : { ok: false, err: '이전 검색 오류' }, status); await h.settle(); assert(!((await h.p.locator('#lg').textContent()).includes('이전 검색')), '새 검색 결과 유지'); }
    });
    for (const [name, hash, endpoint, ready] of [['상품', '#/b/TEST-A', '/shop/item', '.info h1'], ['분류', '#/cats', '/shop/cats', '.cats-p'], ['주문 조회', '#/done/TEST-ORDER?t=synthetic', '/shop/order', '.done']]) await test(name + '의 현재 오류 안내와 재시도 유지', async h => {
      const req = h.hold(endpoint); await h.nav(hash); await req.seen; req.release({ ok: false, err: '현재 화면 가짜 오류' }, 400); await h.p.locator('#again').waitFor(); await h.p.locator('#again').click(); await h.p.locator(ready).waitFor();
    });
    await test('주문서의 현재 합계 응답은 입력한 내용을 보존하며 반영', async h => {
      const req = h.hold('/shop/quote'); await h.nav('#/order'); await req.seen; await h.p.locator('#f_name').fill('가상 입력 내용'); req.release({ ok: true, items: [BOOK], bad: [], n: 1, sum0: 2000, bundle: 100, coupon: null, sum: 1900, fee: 0, total: 1900, free: null }); await h.settle(); assert.match(await h.p.locator('#go').textContent(), /1,900/); assert.equal(await h.p.locator('#f_name').inputValue(), '가상 입력 내용');
    });
    await test('옛 주문서 합계 응답이 새 장바구니를 바꾸지 않음', async h => {
      const old = h.hold('/shop/quote'); await h.nav('#/order'); await old.seen; await h.nav('#/cart'); await h.p.locator('#toOrder').waitFor(); await h.settle(); old.release({ ok: true, items: [{ ...BOOK, p: 999 }], bad: [], n: 1, sum0: 999, sum: 999, fee: 0, total: 999, free: null }); await h.settle(); assert.match(await h.p.locator('#toOrder').textContent(), /2,000/); assert.equal(await h.p.evaluate(() => JSON.parse(localStorage.getItem('bq-cart'))[0].p), 2000);
    });
    await test('가짜 취소 완료가 이동한 화면을 다시 주문 조회로 바꾸지 않음', async h => {
      h.expectWrites(1); await h.nav('#/done/TEST-ORDER?t=synthetic'); await h.p.locator('#cx').waitFor(); const old = h.hold('/shop/cancel'); await h.p.locator('#cx').click(); await h.p.locator('#cx').click(); await old.seen; await h.nav('#/wish'); await h.p.locator('h1.pt').waitFor(); old.release({ ok: true }); await h.settle(); assert.match(await h.p.locator('#main').textContent(), /찜 목록/);
    });

    for (const width of [1280, 390]) await test('입력 직후 이동·즉시 재진입해도 주문서 초안 보존', async h => {
      await h.nav('#/order'); await h.p.locator('#f_name').waitFor(); await h.p.evaluate(() => { const el = document.querySelector('#f_name'); el.value = '가상 보존 내용'; el.dispatchEvent(new Event('input', { bubbles: true })); location.hash = '#/wish'; });
      await h.p.waitForFunction(() => document.querySelector('#main').textContent.includes('찜 목록')); await h.nav('#/order'); await h.p.locator('#f_name').waitFor(); assert.equal(await h.p.locator('#f_name').inputValue(), '가상 보존 내용'); await h.p.waitForTimeout(450); assert.equal(await h.p.locator('#f_name').inputValue(), '가상 보존 내용'); assert.equal(await h.p.evaluate(() => JSON.parse(sessionStorage.getItem('bq-odraft')).name), '가상 보존 내용');
    }, width);
    await test('최신 초안은 사라진 주문서의 입력 이벤트로 덮이지 않음', async h => {
      await h.nav('#/order'); await h.p.locator('#f_name').fill('이전 가상 입력'); await h.p.evaluate(() => { window.oldForm = document.querySelector('#of'); }); await h.nav('#/wish'); await h.p.waitForFunction(() => document.querySelector('#main').textContent.includes('찜 목록'));
      await h.nav('#/order'); await h.p.locator('#f_name').fill('최신 가상 입력'); await h.p.evaluate(() => { const old = window.oldForm.querySelector('#f_name'); old.value = '늦은 이전 입력'; old.dispatchEvent(new Event('input', { bubbles: true })); }); await h.p.waitForTimeout(450);
      assert.equal(await h.p.evaluate(() => JSON.parse(sessionStorage.getItem('bq-odraft')).name), '최신 가상 입력'); assert.equal(await h.p.locator('#f_name').inputValue(), '최신 가상 입력');
    });
    await test('빈 칸·받는 분 변경은 저장하고 동의·쿠폰·숨김 칸은 저장하지 않음', async h => {
      const req = h.hold('/shop/cfg'); await h.nav('#/order'); await req.seen; req.release({ ...CFG, promo: { coupon: true } }); await h.p.locator('#f_name').fill('지울 가상 이름');
      await h.p.evaluate(() => { const name = document.querySelector('#f_name'); name.value = ''; name.dispatchEvent(new Event('input', { bubbles: true })); const same = document.querySelector('#f_same'); same.checked = false; same.dispatchEvent(new Event('change', { bubbles: true })); for (const k of ['agreeP', 'agreeT', 'all']) document.querySelector('#f_' + k).checked = true; document.querySelector('#f_cp').value = 'FAKE-COUPON'; document.querySelector('#f_hp').value = 'fake-hidden'; const r = document.querySelector('#f_rname'); r.value = '가상 받는 분'; r.dispatchEvent(new Event('input', { bubbles: true })); location.hash = '#/wish'; });
      await h.p.waitForFunction(() => document.querySelector('#main').textContent.includes('찜 목록')); await h.p.waitForTimeout(450); const saved = await h.p.evaluate(() => JSON.parse(sessionStorage.getItem('bq-odraft'))); assert.deepEqual(saved, { same: false, rname: '가상 받는 분' }); await h.nav('#/order'); await h.p.locator('#f_name').waitFor(); assert.equal(await h.p.locator('#f_name').inputValue(), ''); assert.equal(await h.p.locator('#f_same').isChecked(), false); assert.equal(await h.p.locator('#f_rname').inputValue(), '가상 받는 분'); assert.equal(await h.p.locator('#f_agreeP').isChecked(), false);
    });
    await test('초안 저장 권한 오류가 현재 입력과 화면을 깨뜨리지 않음', async h => {
      await h.nav('#/order'); await h.p.locator('#f_name').waitFor(); await h.p.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (this === sessionStorage && k === 'bq-odraft') throw new DOMException('가짜 저장 거절', 'QuotaExceededError'); return set.call(this, k, v); }; }); await h.p.locator('#f_name').fill('저장 거절 중 가상 입력'); await h.p.waitForTimeout(450); assert.equal(await h.p.locator('#f_name').inputValue(), '저장 거절 중 가상 입력'); assert.equal(await h.p.locator('#go').isEnabled(), true);
    });
    await test('가짜 주문 성공으로 지운 초안이 늦은 저장으로 다시 생기지 않음', async h => {
      h.expectWrites(1); await h.nav('#/order'); await h.p.locator('#f_name').waitFor(); await h.settle(); await h.p.evaluate(() => { const fields = { name: '가상 주문자', phone: '01000000000', zip: '00000', addr1: '가상 시험 주소', addr2: '가상 상세' }; for (const [k, v] of Object.entries(fields)) document.querySelector('#f_' + k).value = v; for (const k of ['agreeP', 'agreeT']) document.querySelector('#f_' + k).checked = true; document.querySelector('#f_name').dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#of').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); await h.p.locator('.done').waitFor(); await h.p.waitForTimeout(450); assert.equal(await h.p.evaluate(() => sessionStorage.getItem('bq-odraft')), null); assert.deepEqual(await h.p.evaluate(() => JSON.parse(localStorage.getItem('bq-cart'))), []);
    });
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
  return results;
}
module.exports = { run };
if (require.main === module) run().then(r => { r.forEach(x => console.log((x.ok ? '✓ ' : '❌ ') + x.name + (x.error ? '\n' + x.error + '\n' + JSON.stringify(x.pageErrors) : ''))); console.log(`${r.filter(x => x.ok).length}/${r.length} 통과`); if (process.env.RN_RESULT) fs.writeFileSync(process.env.RN_RESULT, JSON.stringify(r, null, 2)); if (r.some(x => !x.ok)) process.exitCode = 1; }).catch(e => { console.error(e); process.exitCode = 1; });
