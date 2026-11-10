// tALWIN3 — 정범님 11/10 12시 (1.78.449 뒤에도) 🪟 알라딘 창 세 가지 — 진짜 창 초점으로 시험
//  ① 다른 창(다른 프로그램·다른 탭)에 갔다 돌아온 뒤 Esc · 알라딘 화면(안 틀)을 누른 뒤 마우스를 웹앱 쪽으로 옮기고 Esc · 등록 화면 '늘 포커스'(검색창에 늘 커서)가 켜져 있어도 Esc 한 번 = 닫기
//  ② 창 설정 기억(기기별 rn-alpv-*): 자리·크기 · 보기 방식 · 맞춤/1:1 · 고른 쪽(전체중고·상품 페이지·우리 판매 페이지) · 플랫폼(알라딘·예스24 …) · 다시 열면 그대로
//  ③ ↗ 새 탭 = 그 상품의 전체중고(중고 모두보기) · 상품 번호를 모르면 ISBN 중고 검색 · 지정 창 하나
// 실행: cd pw && node tALWIN3.js  (화면이 있으면(xvfb-run -a node tALWIN3.js) 진짜 창 초점 시험까지 · 없으면 그 부분만 흉내로)
//  harness.js와 같은 가짜 Firebase(fbstub.js)를 쓰되, 창 초점을 진짜로 움직이려고 브라우저를 직접 띄움(화면이 있으면 headless 끔 + 초점 흉내 끔)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const HEADED = !!process.env.DISPLAY;
async function open(vp) { const b = await chromium.launch({ headless: !HEADED }); const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  const stub = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
  await ctx.route(/aladin\.co\.kr|yes24\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><input id="q"><h1>바깥 화면 흉내</h1><div style="height:2000px"></div></body></html>' }));
  await p.route(/^https?:\/\/(?!localhost|127\.0\.0\.1|[^/]*aladin\.co\.kr|[^/]*yes24\.com)/, (r) => r.fulfill({ status: 404, body: '' }));
  await p.route(/gstatic\.com\/firebasejs\//, (r) => r.fulfill({ body: '/*stub*/', contentType: 'application/javascript' }));
  await p.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, (r) => r.fulfill({ body: stub, contentType: 'application/javascript' }));
  await p.addInitScript(() => { try { if (localStorage.getItem('rn-msc-inapp') == null) localStorage.setItem('rn-msc-inapp', '1'); } catch (e) {} });
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html'); await p.waitForTimeout(2500); await p.addStyleTag({ content: '.verbar{display:none!important}' });
  const cdp = await ctx.newCDPSession(p); if (HEADED) await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => {});
  return { b, ctx, p, errs }; }
const seed = async (p, focusOn) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(300); await p.addStyleTag({ content: '#seenp,#dlp{display:none!important}' });
  await p.evaluate(async (fo) => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const mk = (isbn, title, iid) => ({ stage: 'sel', isbn, grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, info: { title, isbn13: isbn, ...(iid ? { itemId: iid } : {}), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t } });
    const R = { w01: mk('9791100000021', '번호 있는 책', '30001'), w04: mk('9791100000052', '번호를 어디에도 모르는 책', null) };
    for (const [k, d] of Object.entries(R)) { await db.collection('reg_items').doc(k).set(d); S.regItems.set(k, { id: k, ...d }); }
    try { S.ver++; localStorage.setItem('rn-reg-view', 'compact'); ['rn-alpv-mode4', 'rn-alpv-rect', 'rn-alpv-view', 'rn-refplat'].forEach((k) => localStorage.removeItem(k)); const dv = JSON.parse(localStorage.getItem('rn-reg-dev') || '{}'); dv.focus = !!fo; localStorage.setItem('rn-reg-dev', JSON.stringify(dv)); } catch (e) {} ALPV.mode = null; ALPV.fit = undefined; S.regT = 'sel'; openRegister(); }, focusOn);
  await p.waitForTimeout(1500); };
const RW = (k) => `.rgrow[data-rgexp="${k}"] [data-rgalw]`;
const op = async (p, k, ms) => { await p.evaluate(() => { alPvClose(); }); await p.click(RW(k)); await p.waitForTimeout(ms); };
const isOpen = (p) => p.evaluate(() => !!document.querySelector('.alpv'));
const clickIn = async (p) => { const fr = await p.$('.alpv iframe.alpv-live'); const cf = fr && (await fr.contentFrame()); if (cf) await cf.click('#q').catch(() => {}); await p.waitForTimeout(150); return p.evaluate(() => document.activeElement && document.activeElement.tagName); };
/* 다른 창으로 갔다 돌아오기 — 화면이 있으면 진짜 다른 창(새 페이지)을 앞으로 · 없으면 hasFocus를 흉내 */
async function awayBack(o, how) { const { ctx, p } = o; if (HEADED) { if (how === 'win') { const b2 = await o.b.newContext(); const q = await b2.newPage(); await q.goto('about:blank'); await q.bringToFront(); await p.waitForTimeout(500); const hf = await p.evaluate(() => document.hasFocus()); await p.bringToFront(); await p.waitForTimeout(500); await b2.close(); return hf; } const q = await ctx.newPage(); await q.goto('about:blank'); await q.bringToFront(); await p.waitForTimeout(500); const hf = await p.evaluate(() => document.hasFocus()); await p.bringToFront(); await p.waitForTimeout(500); await q.close(); return hf; }
  await p.evaluate(() => { window.__hf = window.__hf || Document.prototype.hasFocus; document.hasFocus = () => false; }); await p.waitForTimeout(700); await p.evaluate(() => { document.hasFocus = window.__hf; }); await p.waitForTimeout(700); return false; }
(async () => {
  console.log(`— 진짜 창 초점 시험: ${HEADED ? '켬(화면 있음 · 초점 흉내 끔)' : '끔(화면 없음 — 흉내로만)'}`);
  for (const vp of [{ width: 1400, height: 900 }]) { const o = await open(vp); const { p } = o;
    try {
      for (const fo of [false, true]) { await seed(p, fo); console.log(`— PC · 등록 화면 늘 포커스 ${fo ? '켬' : '끔'}`);
        await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
        // ① 알라딘 안을 누르고 → 다른 탭 → 돌아와 Esc
        await op(p, 'w01', 700); const ae = await clickIn(p);
        const hf = await awayBack(o, 'tab'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        ok(ae === 'IFRAME' && !(await isOpen(p)), '알라딘 안 누름 → 크롬 다른 탭 → 돌아와 Esc 한 번 = 닫힘', { ae, hf });
        // ① 다른 프로그램(다른 창) → 돌아와 Esc
        await op(p, 'w01', 700); await clickIn(p); await awayBack(o, 'win'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        ok(!(await isOpen(p)), '알라딘 안 누름 → 다른 창 → 돌아와 Esc 한 번 = 닫힘');
        // ① 알라딘 안을 누르지 않고(웹앱 쪽 초점) 다른 창 → 돌아와 Esc
        await op(p, 'w01', 700); await awayBack(o, 'win'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        ok(!(await isOpen(p)), '알라딘 안을 안 누른 채 다른 창 → 돌아와 Esc 한 번 = 닫힘');
        // ① 알라딘 안을 누른 뒤 창을 떠나지 않고 마우스만 웹앱 쪽(창 머리줄)으로 → Esc
        await op(p, 'w01', 700); await clickIn(p);
        const hb = await p.evaluate(() => { const r = document.querySelector('.alpv-h .alpv-t').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await p.mouse.move(hb.x, hb.y, { steps: 4 }); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        ok(!(await isOpen(p)), '알라딘 안을 누른 뒤 마우스를 창 머리줄(웹앱 쪽)로 옮기면 Esc 한 번 = 닫힘');
        // 알라딘 안에서 글 치는 동안(마우스가 안 틀 위)은 초점을 빼앗지 않음
        await op(p, 'w01', 700); await clickIn(p); const fr = await p.$('.alpv iframe.alpv-live'); const cf = await fr.contentFrame();
        const fb = await fr.boundingBox(); await p.mouse.move(fb.x + 40, fb.y + 40, { steps: 3 }); await cf.type('#q', '책').catch(() => {}); await p.waitForTimeout(500);
        const ty = await p.evaluate(() => document.activeElement && document.activeElement.tagName); const dbg = await p.evaluate(() => ({ n: ALPV.escBackN || 0, id: document.activeElement.id })); const v = await cf.$eval('#q', (x) => x.value).catch(() => '');
        ok(ty === 'IFRAME' && v === '책', '알라딘 안에서 글 치는 동안(마우스가 그 화면 위)은 초점을 그대로', { ty, v, dbg });
        await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
        // 늘 포커스가 켜져 있으면 검색창에 커서가 있어도 Esc 한 번 = 창 닫기
        if (fo) { await op(p, 'w01', 700); await p.evaluate(() => { const i = document.getElementById('rg_in'); if (i) i.focus(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
          ok(!(await isOpen(p)), '늘 포커스(검색창 커서)여도 🪟 창이 열려 있으면 Esc 한 번 = 닫힘'); await p.evaluate(() => { alPvClose(); alPvParkDrop(); }); }
      }
      // 창 밖 아무 데나 누르면 닫힘 · 머리줄 ✕ 닫기는 글자와 함께 크게
      await op(p, 'w01', 600);
      const xb = await p.evaluate(() => { const b = document.querySelector('.alpv-h [data-alpv="x"]'); const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), w: r.width, h: r.height }; });
      ok(/닫기/.test(xb.t) && xb.h >= 26, '창 머리줄 ✕ 닫기 단추 — 글자와 함께 크게(눈에 잘 띔)', xb);
      await p.mouse.click(5, 450); await p.waitForTimeout(250); ok(!(await isOpen(p)), '창 밖 아무 데나 누르면 닫힘');
      // ── ② 창 설정 기억
      await p.evaluate(() => { alPvParkDrop(); }); await op(p, 'w01', 600);
      await p.evaluate(() => { const d = document.querySelector('.alpv'); Object.assign(d.style, { left: '120px', top: '60px', width: '700px', height: '600px', right: 'auto', bottom: 'auto' }); d.classList.add('geo'); });
      await p.evaluate(() => document.querySelector('.alpv [data-alpv="pg:used"]').click()); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('.alpv [data-alpv="fit"]').click()); await p.waitForTimeout(200);
      await p.evaluate(() => document.querySelector('.alpv [data-alpv="x"]').click()); await p.waitForTimeout(200);
      const sv = await p.evaluate(() => ({ rect: JSON.parse(localStorage.getItem('rn-alpv-rect') || 'null'), view: JSON.parse(localStorage.getItem('rn-alpv-view') || 'null') }));
      ok(sv.rect && sv.rect.l === 120 && sv.rect.w === 700, '닫을 때 자리·크기 기억(옮긴 뒤 바로 닫아도)', sv.rect);
      ok(sv.view && sv.view.fit === false && sv.view.pg && sv.view.pg.a === 'used', '닫을 때 맞춤/1:1 · 고른 쪽(전체중고) 기억', sv.view);
      await p.evaluate(() => { ALPV.fit = undefined; alPvParkDrop(); }); /* 웹앱을 새로 연 것처럼 */
      await op(p, 'w01', 600);
      const re = await p.evaluate(() => { const d = document.querySelector('.alpv'); const b = d.getBoundingClientRect(); return { l: b.left, w: b.width, fit: ALPV.fit, cur: ALPV.cur, fitT: d.querySelector('[data-alpv="fit"]').textContent }; });
      ok(re.l === 120 && re.w === 700 && re.fit === false && /wuseditemall\.aspx\?ItemId=30001/.test(re.cur), '다시 열면 그 자리·크기 · 1:1 · 전체중고 그대로', re);
      // 상품 페이지를 고르고 닫으면 → 다음엔 상품 페이지로
      await p.evaluate(() => document.querySelector('.alpv [data-alpv="pg:newp"]').click()); await p.waitForTimeout(300); await p.evaluate(() => alPvClose()); await p.evaluate(() => alPvParkDrop());
      await op(p, 'w01', 500); const r2 = await p.evaluate(() => ALPV.cur);
      ok(/wproduct\.aspx\?ItemId=30001/.test(r2), '상품 페이지를 보고 닫으면 다음에도 상품 페이지로', r2);
      // 번호 모르는 카드: 기억한 쪽이 '상품 페이지'여도 있는 쪽으로 안전하게(상품 검색)
      await p.evaluate(() => { alPvClose(); alPvParkDrop(); }); await op(p, 'w04', 500); const r3 = await p.evaluate(() => ALPV.cur);
      ok(/SearchTarget=Book&SearchWord=9791100000052/.test(r3), '번호를 모르는 카드 — 같은 쪽(상품 검색)으로', r3);
      await p.evaluate(() => { document.querySelector('.alpv [data-alpv="pg:used"]').click(); }); await p.waitForTimeout(200); await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
      // 보기 방식(📄 화면 등)은 이미 기억 → 확인만
      await op(p, 'w01', 400); await p.evaluate(() => document.querySelector('.alpv [data-alpv="m:shot"]').click()); await p.waitForTimeout(200); await p.evaluate(() => { alPvClose(); alPvParkDrop(); ALPV.mode = null; });
      ok(await p.evaluate(() => localStorage.getItem('rn-alpv-mode4') === 'shot' && alPvMode() === 'shot'), '보기 방식(🌐 바로·📄 화면·📸 사진)도 이 기기에 기억');
      await p.evaluate(() => { localStorage.setItem('rn-alpv-mode4', 'live'); ALPV.mode = null; });
      // ── ③ ↗ 새 탭 = 전체중고
      await p.evaluate(() => { window.__OW = []; window.__rnOpenRaw = (u, n, f) => { const w = { closed: false, _u: u, focus() {}, location: {} }; Object.defineProperty(w.location, 'href', { set(v) { w._u = v; window.__OW.push({ nav: v }); }, get() { return w._u; } }); window.__OW.push({ u, n }); return w; }; ALPV.newW = null; });
      await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w01')); await p.waitForTimeout(100);
      await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w04')); await p.waitForTimeout(100);
      await p.evaluate(() => { const b = [...document.querySelectorAll('[data-alnw][data-iid]')][0]; if (b) b.click(); }); await p.waitForTimeout(100);
      const nw = await p.evaluate(() => window.__OW);
      ok(nw[0] && nw[0].n === 'rn_alwin' && /wuseditemall\.aspx\?ItemId=30001&TabType=0/.test(nw[0].u), '등록 카드 ↗ = 그 상품 전체중고(중고 모두보기) · 지정 창', nw[0]);
      ok(nw[1] && /wsearchresult\.aspx\?SearchTarget=Used&SearchWord=9791100000052/.test(nw[1].nav || ''), '알라딘 상품 번호를 모르면 ↗ = ISBN 중고 검색(같은 지정 창)', nw[1]);
      const ah = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = alBtn({ iid: '777', q: '9788937460449' }); document.body.appendChild(d); d.querySelector('[data-alnw]').click(); d.remove(); return window.__OW.slice(-1)[0]; });
      ok(/wuseditemall\.aspx\?ItemId=777&TabType=0/.test(ah.nav || ah.u || ''), '상품 카드 등 alBtn ↗ = 전체중고', ah);
      // 창 머리줄 '새 탭↗'은 지금 보는 화면 그대로(전체중고가 아닌 화면을 보고 있으면 그 화면)
      await op(p, 'w01', 400); await p.evaluate(() => document.querySelector('.alpv-h a[data-alpvnew]').click()); await p.waitForTimeout(100);
      ok(/wuseditemall/.test((await p.evaluate(() => window.__OW.slice(-1)[0])).nav || ''), '창 머리줄 새 탭↗ = 지금 보는 화면(지정 창)');
      await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
      // 바깥 링크(상품 페이지)를 ↗ data-alpvnew로 연 곳도 지정 창
    } finally { console.log('ERRORS:', JSON.stringify(o.errs.slice(0, 10))); await o.b.close(); } }
  console.log(bad ? `❌ tALWIN3 실패 ${bad}` : '✓ tALWIN3 통과'); process.exit(bad ? 1 : 0); })();
