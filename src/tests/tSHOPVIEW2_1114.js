// tSHOPVIEW2_1114 — (11/14 shopview2 · 작업판 v11 정범님 「손님 화면을 내가 직접 볼 수 있게 해줘」) 👀 손님 화면으로 보기
//   ① 클라우드 창구(가짜 Firestore): 관리자 asView(🧪 시험 계정 1회 열쇠 5분) → 손님 화면 asIn(로그인 열쇠) · 진짜 손님 계정 거절(두 겹) · 한 번만 · 시간 지나면 끝 · 주문 403 · 기록 남음
//   ② 화면(RN_UI=1 · RN_PORT = 웹앱 시험 서버): 웹앱 🛍 우리숍 주문 맨 위 「👀 손님 화면으로 보기」 → 새 탭 booksqueen.com(가짜로 이 시험 숍 서버) → 🧪 시험 계정으로 로그인된 채 · 주소에서 열쇠 지움 · 담기 → 주문서 마지막 단추 「결제는 하지 않습니다」 · 설정 저장 · 휴대폰 390·PC 1280 사진(RN_SHOT)
//   실행: node src/tests/tSHOPVIEW2_1114.js · 화면까지: cd <pw> && RN_UI=1 RN_PORT=<포트> RN_SHOT=<폴더/> node tSHOPVIEW2_1114.js
//   시험 자료에 실제 손님 정보 없음(손님A · .invalid·example.com 메일)
const fs = require('fs'); const path = require('path'); const http = require('http'); const { Readable } = require('stream');
process.env.BQ_PW_IT = '2000'; /* 시험만 빠르게(실제 12만 번) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = [process.env.RN_ROOT, path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].filter(Boolean).find((d) => fs.existsSync(path.join(d, 'cloud', 'shop.js'))); const SH = require(path.join(ROOT, 'cloud/shop.js')); const AC = require(path.join(ROOT, 'cloud/shop-acct.js'));
(async () => {
console.log('① 클라우드 창구(가짜 Firestore)');
const store = {}; const col = (n) => (store[n] = store[n] || {}); const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x) && !x.__au;
const deep = (a, b) => { const o = isObj(a) ? { ...a } : {}; for (const [k, v] of Object.entries(b)) o[k] = v && v.__au ? [...((o[k]) || []), ...v.__au] : isObj(v) && isObj(o[k]) ? deep(o[k], v) : clone(v); return o; }; /* Firestore merge처럼 겹친 칸은 안쪽까지 */
const FV = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...a) => ({ __au: a }) };
const snap = (n, id) => { const d = col(n)[id]; return { id, exists: d != null, data: () => clone(d), ref: ref(n, id) }; };
function ref(n, id) { return { _n: n, id, get: async () => snap(n, id), set: async (v, o) => { col(n)[id] = o && o.merge ? deep(col(n)[id], v) : deep({}, v); } }; }
const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => { const x = col(n)[id][f]; return op === '==' ? x === v : op === 'array-contains' ? Array.isArray(x) && x.includes(v) : op === 'in' ? v.includes(x) : op === '>' ? x != null && String(x) > String(v) : true; })).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f), docs }; } }); return { ...q([]), doc: (id) => ref(n, id) }; };
const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)), runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), getAll: async (...r) => r.map((x) => snap(x._n, x.id)), set: (r, v, o) => W.push(() => r.set(v, o)) }); for (const w of W) await w(); } };
const files = {}; const bucket = () => ({ file: (n) => ({ save: async (b, o) => { files[n] = { b, o }; }, download: async () => { if (!files[n]) throw new Error('없음'); return [files[n].b]; } }) });
const L0 = (o) => ({ status: '판매중', active: true, qty: 1, price: 8000, grade: '상', sku: 'A01BC123PK', title: '시험 책', isbn13: '9788900000001', bookId: 'bk1', registeredAt: '2026-11-10T01:00:00Z', photos: [{ stored: 'p/1.jpg', thumb: 'p/1_t.jpg' }], ...o });
const B0 = { author: '지은이A', publisher: '출판사A', pubDate: '2020-05-01', categories: [{ path: '국내도서>소설/시/희곡>한국소설' }], priceList: 15000 };
for (let i = 1; i <= 5; i++) col('prd_listings')['aladin_U' + i] = L0({ title: '시험 책 ' + i, sku: 'A01BC12' + i + 'PK', bookId: 'bk' + i, isbn13: '978890000000' + i, price: 4000 + i * 1000 });
for (let i = 1; i <= 5; i++) col('prd_books')['bk' + i] = { ...B0, title: '시험 책 ' + i };
col('app_settings').shop = { open: 1, shipFee: 3500, payDays: 2, bank: { name: '시험은행', acct: '000-000', holder: '가게' }, biz: { name: '가게' } };
process.env.SHOP_ORIGINS = 'http://localhost:1';
const SHOP = SH.makeShop({ db, C, FV, log: () => {}, bucket }); const SHOPDIR = path.join(ROOT, 'shop');
const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; try { if (await SHOP.handle(req, res, p0)) return; } catch (e) { res.writeHead(500); res.end(String(e)); return; }
  if (p0 === '/__admin' && req.method === 'POST') { const ch = []; for await (const c of req) ch.push(c); const r = await SHOP.acctAdmin(JSON.parse(Buffer.concat(ch).toString() || '{}'), { email: 'admin@example.com' }); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r)); return; }
  const f = path.join(SHOPDIR, decodeURIComponent(p0 === '/' ? '/index.html' : p0)); if (f.startsWith(SHOPDIR) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript' : /\.css$/.test(f) ? 'text/css' : 'text/html; charset=utf-8' }); res.end(fs.readFileSync(f)); return; } res.writeHead(404); res.end(); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
let ip = 10; const J = async (m, u, b, tok, raw) => { const r = await fetch(base + u, { method: m, headers: { ...(b && !raw ? { 'Content-Type': 'application/json' } : {}), ...(tok ? { Authorization: 'Bearer ' + tok } : {}), 'X-Forwarded-For': '9.9.9.' + (ip % 250) }, body: raw || (b ? JSON.stringify(b) : undefined) }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j, h: r.headers }; };
const A = (b, tok) => { if (b.op === 'join') ip++; return J('POST', '/shop/a', b, tok); }; /* 가입은 IP당 시간 5번 — 시험은 IP를 바꿔 가며 */ const ADM = (b) => J('POST', '/__admin', b).then((r) => r.j);
const AG = { privacy: true, terms: true };
const j1 = await A({ op: 'join', em: 'guest1@example.com', pw: 'abcd1234', nick: '책읽는손님', agree: AG }); const U1 = j1.j.me.uid; ok(j1.s === 200, '진짜(가짜 이름) 손님 가입');
/* 1) 진짜 손님 계정으로는 열쇠를 주지 않음 — 시험 표시만 억지로 붙여도(메일이 시험 메일이 아님) 거절 */
const r1 = await ADM({ op: 'asView', uid: U1 }); col('shop_users')[U1].test = 1; const r1b = await ADM({ op: 'asView', uid: U1 }); col('shop_users')[U1].test = 0;
ok(r1.err && !r1.c && r1b.err && !r1b.c && !col('shop_users')[U1].asv, '진짜 손님 계정 → 거절(시험 표시만 붙여도 거절 · 열쇠 없음)', [r1, r1b]);
/* 2) 고른 계정 없음 → 보기용 🧪 시험 계정을 한 번 만들고 다음엔 같은 계정 */
const v1 = await ADM({ op: 'asView', hrs: 6 }); const VU = v1.uid; const vd = col('shop_users')[VU];
ok(v1.c && /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(v1.c) && v1.made === 1 && /^🧪보기용/.test(v1.nick) && /@test\.booksqueen\.invalid$/.test(vd.em) && vd.test === 1 && vd.pvBy === 'admin@example.com', '보기용 🧪 시험 계정을 처음 만듦(시험 표시·시험 메일·관리자 표)', v1);
ok(vd.asv && vd.asv.h && !JSON.stringify(vd).includes(v1.c.split('.')[1]) && Date.parse(vd.asv.exp) - Date.now() <= 5 * 60e3 + 2000 && Date.parse(vd.asv.exp) - Date.now() > 4 * 60e3, '문서엔 열쇠 해시만 · 5분');
const v2 = await ADM({ op: 'asView', hrs: 6 }); ok(v2.uid === VU && v2.made === 0 && v2.c !== v1.c, '다시 누르면 같은 보기용 계정 · 새 열쇠(옛 열쇠는 못 씀)');
ok((await A({ op: 'asIn', c: v1.c })).s === 401, '옛 열쇠(새 열쇠가 나온 뒤) → 401');
ok((await A({ op: 'asIn', c: VU + '.' + '0'.repeat(32) })).s === 401 && (await A({ op: 'asIn', c: 'x' })).s === 400, '틀린 열쇠 401 · 꼴이 틀리면 400');
/* 3) 열쇠로 들어감 → 로그인 열쇠 · 한 번만 */
const in1 = await A({ op: 'asIn', c: v2.c }); const TT = in1.j.tok;
ok(in1.s === 200 && /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(TT) && in1.j.me.test === 1 && in1.j.me.uid === VU, '열쇠 → 🧪 시험 계정 로그인 열쇠', in1.j);
const me1 = await A({ op: 'me' }, TT); ok(me1.s === 200 && me1.j.me.test === 1, '받은 열쇠로 내 정보(시험 계정)');
const ss = col('shop_users')[VU].sess.find((x) => x.asv); ok(ss && Math.abs(Date.parse(ss.exp) - Date.now() - 6 * 3600e3) < 60e3, '로그인 유지 = 설정한 6시간');
ok((await A({ op: 'asIn', c: v2.c })).s === 401, '같은 열쇠 두 번째 → 401(한 번만)');
/* 4) 시간 지난 열쇠 */
const v3 = await ADM({ op: 'asView' }); col('shop_users')[VU].asv.exp = new Date(Date.now() - 1000).toISOString(); ok((await A({ op: 'asIn', c: v3.c })).s === 401, '5분 지난 열쇠 → 401');
/* 5) 진짜 계정 문서에 열쇠를 억지로 심어도 들어가지 않음 */
{ const code = 'ab'.repeat(16); col('shop_users')[U1].asv = { h: require('crypto').createHash('sha256').update(code).digest('hex'), exp: new Date(Date.now() + 60e3).toISOString(), hrs: 1 }; ok((await A({ op: 'asIn', c: U1 + '.' + code })).s === 401, '진짜 손님 문서에 열쇠를 심어도 → 401(시험 계정 두 겹 확인)'); delete col('shop_users')[U1].asv; }
/* 6) 고른 시험 계정 · 보관된 계정 거절 · 주문은 403 · 기록 */
const mk = (await ADM({ op: 'mkTest', n: 1 })).L[0]; const v4 = await ADM({ op: 'asView', uid: mk.uid }); ok(v4.uid === mk.uid && v4.made === 0 && v4.c, '고른 🧪 시험 계정으로 열쇠');
await ADM({ op: 'arch', uid: mk.uid, on: 1 }); ok((await ADM({ op: 'asView', uid: mk.uid })).err && (await A({ op: 'asIn', c: v4.c })).s === 401, '보관된 시험 계정 → 열쇠 거절 · 이미 받은 열쇠도 못 씀');
const od = await J('POST', '/shop/order', { items: ['aladin_U1'], buyer: { name: '손님A', phone: '01000000000' }, rcv: { zip: '06000', addr1: '서울 어딘가 1길 1' }, agree: { privacy: true, terms: true } }, TT); ok(od.s === 403 && /시험 계정/.test(od.j.err || ''), '받은 열쇠로 주문 → 403(결제 막힘 · 매출·재고 0)', od);
const LG = Object.values(col('shop_asv_log') || {}); ok(LG.length >= 4 && LG.every((x) => x.by === 'admin@example.com' && x.uid && x.at), '누가 언제 들어갔는지 shop_asv_log에 남음(' + LG.length + ')');
ok(!('asView' in (await J('GET', '/shop/cfg')).j), '공개 설정(/shop/cfg)엔 보기 설정이 나가지 않음');
if (!process.env.RN_UI) { srv.close(); console.log(bad ? `❌ tSHOPVIEW2_1114 ${bad}개 실패` : '✓ tSHOPVIEW2_1114 클라우드 창구 통과 (화면 시험은 RN_UI=1 RN_PORT=…)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const { chromium } = require('playwright'); const SHOT = process.env.RN_SHOT || null; if (SHOT) fs.mkdirSync(SHOT, { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
const run = async (vp, mob, fn) => { const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, ...(mob ? { isMobile: true, hasTouch: true } : {}) });
  ctx.on('page', (pg) => pg.on('pageerror', (e) => errs.push('SHOPERR ' + e.message)));
  await ctx.addInitScript((u) => { if (location.hostname === 'booksqueen.com') window.BQ_API = 'https://booksqueen.com'; try { if (localStorage.getItem('rn-msc-inapp') == null) localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} }, base);
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, async (r) => { const u = new URL(r.request().url()); if (/^booksqueen\.com$/.test(u.hostname)) { const q = r.request(); const hd = { ...q.headers() }; delete hd.host; const rr = await fetch(base + (u.pathname === '/' ? '/index.html' : u.pathname) + u.search, { method: q.method(), headers: hd, body: ['GET', 'HEAD'].includes(q.method()) ? undefined : q.postDataBuffer() }); return r.fulfill({ status: rr.status, body: Buffer.from(await rr.arrayBuffer()), headers: { 'content-type': rr.headers.get('content-type') || 'text/html', 'access-control-allow-origin': '*' } }); } /* 손님 화면·창구 모두 이 시험 숍 서버로(같은 출처 — 진짜와 같이 booksqueen.com/shop/*) */
    if (/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/.test(u.href)) return r.fulfill({ body: stub, contentType: 'application/javascript' }); if (/gstatic\.com\/firebasejs\//.test(u.href)) return r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' }); return r.fulfill({ status: 404, body: '' }); });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('APPERR ' + e.message));
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500); await p.addStyleTag({ content: '.verbar{display:none!important}' }); await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.exposeFunction('__adm', (bd) => ADM(bd)); await p.evaluate((cf) => { window.__saves = []; window.cloudCall = async (pth, bd) => (pth === '/shop-admin' ? window.__adm(bd) : { ok: true }); window.shopBoSave = async (v) => { window.__saves.push(v); S.app = S.app || {}; S.app.bqCfg = { ...(S.app.bqCfg || {}), ...v }; }; }, null);
  try { await fn(p, ctx); } catch (e) { errs.push('TEST ' + e.message); } await ctx.close(); };
const pre = (tag) => (SHOT ? (pg, n) => pg.screenshot({ path: path.join(SHOT, tag + '_' + n + '.png') }) : async () => {});
for (const [tag, vp, mob] of [['m390', { width: 390, height: 844 }, 1], ['pc1280', { width: 1280, height: 900 }, 0]]) { const shot = pre(tag);
  await run(vp, mob, async (p, ctx) => {
    await p.evaluate(() => openShopAdm()); await p.waitForSelector('#bq_asvgo', { timeout: 8000 }); const top = await p.evaluate(() => { const a = document.getElementById('bq_asvgo').getBoundingClientRect(); const c = document.querySelector('#sheet .card'); return { y: a.top, vis: a.width > 0 && a.bottom <= window.innerHeight, inFirst: c && c.contains(document.getElementById('bq_asvgo')) }; });
    ok(top.vis && top.inFirst, `${tag}: 🛍 우리숍 주문 맨 위 카드에 「👀 손님 화면으로 보기」(첫 화면에 보임)`, top); await shot(p, 'admin_button');
    const ow = await p.evaluate(() => document.getElementById('sheet').scrollWidth - document.getElementById('sheet').clientWidth); ok(ow <= 2, `${tag}: 가로 넘침 없음(${ow})`);
    const [np] = await Promise.all([ctx.waitForEvent('page'), p.click('#bq_asvgo')]); await np.waitForFunction(() => !!localStorage.getItem('bq-tok'), null, { timeout: 15000 }); await np.waitForTimeout(800); const u = np.url(); await shot(np, 'shop_home');
    ok(/^https:\/\/booksqueen\.com\/#\/$/.test(u) && !/bqas/.test(u), `${tag}: 새 탭 booksqueen.com 첫 화면(기본) · 주소에서 열쇠 지움(${u})`); ok(/🧪/.test(await np.textContent('body')), `${tag}: 첫 화면에 🧪 시험 계정 들어옴 알림`);
    await np.goto('https://booksqueen.com/#/me'); await np.waitForSelector('.bqa-me', { timeout: 15000 }); await np.waitForTimeout(300); const tx = await np.textContent('.bqa-me'); ok(/🧪/.test(tx) && /보기용/.test(tx), `${tag}: 🧪 보기용 시험 계정으로 로그인된 채 내 정보`); await shot(np, 'shop_me');
    await np.goto('https://booksqueen.com/#/b/aladin_U2'); await np.waitForSelector('#add', { timeout: 15000 }); await np.click('#add'); await np.waitForTimeout(400); await np.goto('https://booksqueen.com/#/order'); await np.waitForSelector('#goTest', { timeout: 15000 });
    ok(/시험 계정 — 결제는 하지 않습니다/.test(await np.textContent('#goTest')) && !(await np.locator('#go').isVisible()), `${tag}: 담기 → 주문서 · 마지막 단추 「🧪 시험 계정 — 결제는 하지 않습니다」(진짜 단추 숨김)`); await shot(np, 'shop_order');
    await np.close(); await p.waitForTimeout(400); ok(/마지막: 🧪보기용/.test(await p.textContent('#bq_asv')), `${tag}: 웹앱 카드에 「마지막: 🧪보기용…」`);
    if (tag === 'm390') { /* 설정: 처음 화면 장바구니 · PC 화면으로 · 저장 두 번 */
      await p.click('#bq_asvcfg summary'); await p.waitForSelector('#bqv_page'); await p.selectOption('#bqv_page', '#/cart'); await p.selectOption('#bqv_pc', '1'); await p.fill('#bqv_hrs', '3'); await shot(p, 'admin_settings'); ok(await p.evaluate(() => [...document.querySelectorAll('#bq_asvcfg select, #bq_asvcfg input, #bq_asvcfg button')].every((e) => e.getBoundingClientRect().right <= document.getElementById('bq_asv').getBoundingClientRect().right + 1)), 'm390: 설정 칸이 카드 밖으로 안 넘침');
      await p.click('#bqv_save'); await p.waitForTimeout(150); const s1 = await p.evaluate(() => window.__saves.length); await p.click('#bqv_save'); await p.waitForTimeout(400); const sv = await p.evaluate(() => window.__saves);
      ok(s1 === 0 && sv.length === 1 && sv[0].asView.page === '#/cart' && sv[0].asView.pc === 1 && sv[0].asView.hrs === 3, 'm390: ⚙ 설정 저장은 두 번 눌러야 · 장바구니·PC 화면·3시간', sv);
      const [n2] = await Promise.all([ctx.waitForEvent('page'), p.click('#bq_asvgo')]); await n2.waitForLoadState('domcontentloaded'); await n2.waitForTimeout(2500);
      const vw = await n2.evaluate(() => ({ h: location.hash, vp: document.querySelector('meta[name=viewport]').getAttribute('content'), pc: localStorage.getItem('bq-pcview') }));
      ok(vw.h === '#/cart' && /width=1280/.test(vw.vp) && vw.pc === '1', 'm390: 설정대로 장바구니 · 휴대폰에서 PC 화면(폭 1280)', vw); await shot(n2, 'shop_cart_pc');
      const se = Object.values(col('shop_users')).find((x) => x.uid === VU).sess.filter((x) => x.asv).map((x) => Date.parse(x.exp) - Date.now()).sort((a, c) => a - c)[0]; ok(se > 2.9 * 3600e3 && se < 3.1 * 3600e3, 'm390: 로그인 유지 3시간이 클라우드에 감');
      await n2.close(); }
  }); }
await b.close(); ok(!errs.length, '화면 오류 0', errs);
srv.close(); console.log(bad ? `❌ tSHOPVIEW2_1114 ${bad}개 실패` : '✓ tSHOPVIEW2_1114 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
