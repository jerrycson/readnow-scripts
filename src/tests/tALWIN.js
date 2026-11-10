// tALWIN — 정범님 11/10 아침 🪟 알라딘 창 세 가지
//  ① 다른 프로그램·다른 창에 갔다 돌아오면 Esc가 안 됨 → 까닭(초점이 알라딘 안 틀에 머묾) 확인 + 돌아온 순간 초점을 웹앱 🪟 창으로 되돌려 Esc = 닫기 · 창을 떠나지 않은 동안(글 치는 중)은 손대지 않음
//  ② 전체 중고 = 그 상품의 알라딘 '중고 모두보기'(wuseditemall.aspx?ItemId=…&TabType=0 · 전체 중고 탭) — 카드에 상품 번호가 없어도 ISBN으로 웹앱 기록·예전 조회에서 찾음 · 끝내 없으면 예전처럼 중고 검색
//  ③ ↗ 새 탭 = 지정 창 하나(rn_alwin) — 🪟 단추마다 옆에 ↗ · 카드 ↗·창 머리줄 새 탭↗·🗗 작은 창·가운데 단추 모두 같은 창 하나 · 휴대폰은 창 크기 없이(새 탭 하나 재사용)
// 실행: cd pw && node tALWIN.js (PC = RN_PORT 또는 8765 · 휴대폰 흉내 harnessM은 8765 고정)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const H = require('./harness.js'), HM = require('./harnessM.js');
const seed = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(300); await p.addStyleTag({ content: '#seenp,#dlp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const mk = (id, isbn, title, iid) => ({ stage: 'sel', isbn, grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, info: { title, isbn13: isbn, ...(iid ? { itemId: iid } : {}), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t } });
    const R = { w01: mk('w01', '9791100000021', '번호 있는 책', '30001'), w02: mk('w02', '9791100000038', '번호 없는 책(우리 도서에 있음)', null), w03: mk('w03', '9791100000045', '번호 없는 책(예전 조회에 있음)', null), w04: mk('w04', '9791100000052', '번호를 어디에도 모르는 책', null) };
    for (const [k, d] of Object.entries(R)) { await db.collection('reg_items').doc(k).set(d); S.regItems.set(k, { id: k, ...d }); }
    S.pbooks = S.pbooks || new Map(); S.pbooks.set('bkx2', { id: 'bkx2', title: '번호 없는 책(우리 도서에 있음)', isbn13: '9791100000038', aladinItemId: 40002 });
    await db.collection('prd_lookups').add({ key: '9791100000045', itemId: '50003', isbn13: '9791100000045', title: '번호 없는 책(예전 조회에 있음)', at: '2026-09-01T00:00:00Z' });
    try { S.ver++; localStorage.setItem('rn-reg-view', 'compact'); localStorage.setItem('rn-alpv-mode4', 'live'); localStorage.removeItem('rn-refplat'); localStorage.removeItem('rn-alpv-view'); localStorage.removeItem('rn-alpv-rect'); } catch (e) {} ALPV.mode = null; S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1500); };
const RW = (k) => `.rgrow[data-rgexp="${k}"] [data-rgalw]`;
// 바깥 창 흉내 — 창 열기를 적어 두고 가짜 창을 돌려줌(창이 이미 있으면 주소만 바꾸는지 봄)
const fakeOpen = (p) => p.evaluate(() => { window.__OW = []; window.__rnOpenRaw = (u, n, f) => { const w = { closed: false, _u: u, focusN: 0, opener: 'x', focus() { this.focusN++; }, location: {} }; Object.defineProperty(w.location, 'href', { set(v) { w._u = v; window.__OW.push({ nav: v }); }, get() { return w._u; } }); window.__OW.push({ u, n, f: f || null }); window.__LW = w; return w; }; ALPV.newW = null; });
const run = (phone) => async (p) => { console.log(`— ${phone ? '휴대폰(안드로이드 UA · 390px)' : 'PC(1400px)'}`); await seed(p);
  await p.route(/aladin\.co\.kr/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><input id="q"><h1>알라딘 흉내</h1></body></html>' }));
  // ── ③-1 모든 🪟 단추 옆에 ↗ (등록 카드)
  const b1 = await p.evaluate(() => { const A = [...document.querySelectorAll('[data-rgalw],[data-alscr]')]; return { n: A.length, pair: A.filter((a) => { const s = a.nextElementSibling; return s && s.dataset.alnw && (s.dataset.rgalwn === a.dataset.rgalw || (a.dataset.alscr && s.dataset.iid === a.dataset.iid && s.dataset.q === a.dataset.q && s.dataset.mkk === a.dataset.mkk)); }).length, nw: document.querySelectorAll('[data-alnw]').length, bad: document.querySelectorAll('[data-alnw][data-alscr],[data-alnw][data-rgalw]').length }; });
  ok(b1.n >= 4 && b1.pair === b1.n && b1.nw === b1.n && !b1.bad, '등록 카드: 🪟 단추마다 바로 옆에 ↗ 단추(↗에는 🪟 표시가 없음)', b1);
  // ── ③-2 alBtn을 쓰는 모든 자리(상품 카드 등)도 두 단추
  const b2 = await p.evaluate(() => { const L = [alBtn({ iid: '7', q: '9788937460449' }), alBtn({ lk: [...S.plist.keys()][0], cls: 'btn ghost sm' }), alBtn({ q: '책 이름', cls: 'reflk' }), alBtn({})]; const d = document.createElement('div'); d.innerHTML = L.join('|'); const A = [...d.querySelectorAll('[data-alscr]')]; return { n: A.length, pair: A.filter((a) => a.nextElementSibling && a.nextElementSibling.dataset.alnw && a.nextElementSibling.className.includes(a.className.replace('alb ', '').split(' ')[0])).length, empty: L[3] === '' }; });
  ok(b2.n === 3 && b2.pair === 3 && b2.empty, 'alBtn(상품 카드·출고·매입 등 12곳이 씀): 🪟 옆에 같은 꼴 ↗ · 링크가 없으면 둘 다 없음', b2);
  // ── ② 전체 중고 주소
  const u2 = await p.evaluate(() => { const g = (k) => { const c = refCtx(regAlwCtx(S.regItems.get(k))); return { iid: c.iid, used: alUrls(c).used }; }; return { w01: g('w01'), w02: g('w02'), w04: g('w04'), q: alUrls(refCtx({ q: '그냥 제목' })).used }; });
  ok(/\/shop\/UsedShop\/wuseditemall\.aspx\?ItemId=30001&TabType=0/.test(u2.w01.used), '상품 번호가 있으면 전체 중고 = 중고 모두보기(wuseditemall · TabType=0 전체 중고 탭)', u2.w01);
  ok(u2.w02.iid === '40002' && /wuseditemall\.aspx\?ItemId=40002&TabType=0/.test(u2.w02.used), '카드에 번호가 없어도 ISBN으로 우리 도서 기록의 상품 번호를 찾아 중고 모두보기로', u2.w02);
  ok(!u2.w04.iid && /wsearchresult\.aspx\?SearchTarget=Used&SearchWord=9791100000052/.test(u2.w04.used) && /SearchTarget=Used/.test(u2.q), '어디에도 번호가 없으면 예전처럼 중고 검색', u2);
  // 창에서 '중고 검색' → 예전 조회 기록(prd_lookups)에 번호가 있으면 중고 모두보기로 바로 바뀜
  await p.evaluate((s) => document.querySelector(s).click(), RW('w03')); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = document.querySelector('.alpv [data-alpv="pg:used"]'); if (b) b.click(); }); await p.waitForTimeout(800);
  const u3 = await p.evaluate(() => ({ cur: ALPV.cur, src: (document.querySelector('.alpv iframe.alpv-live') || {}).src, seg: [...document.querySelectorAll('.alpv-pg button')].map((b) => b.textContent + (b.classList.contains('on') ? '*' : '')) }));
  ok(/wuseditemall\.aspx\?ItemId=50003&TabType=0/.test(u3.cur || '') && /ItemId=50003/.test(u3.src || ''), '번호 없는 카드: 🪟 창의 중고 단추 → 예전 알라딘 조회의 번호로 중고 모두보기(검색 결과 아님)', u3);
  ok(u3.seg.some((t) => /^전체중고\*$/.test(t)), '창 위 단추 이름도 \'전체중고\'(켜짐)', u3.seg);
  // 같은 🪟 단추를 다시 누르면 닫힘(찾은 번호로 바뀐 뒤에도)
  await p.evaluate((s) => document.querySelector(s).click(), RW('w03')); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('.alpv')), '같은 🪟 단추 다시 누르면 닫힘(번호를 찾아 바뀐 뒤에도)');
  await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
  // ── ① Esc 되돌림
  await p.evaluate((s) => document.querySelector(s).click(), RW('w01')); await p.waitForTimeout(700);
  const fr = await p.$('.alpv iframe.alpv-live'); const cf = fr && (await fr.contentFrame()); if (cf) await cf.click('#q').catch(() => {}); await p.waitForTimeout(200);
  const e0 = await p.evaluate(() => ({ ae: document.activeElement && document.activeElement.tagName, open: !!document.querySelector('.alpv') }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const e1 = await p.evaluate(() => !!document.querySelector('.alpv'));
  ok(e0.ae === 'IFRAME' && e1, '까닭 확인: 알라딘 안을 누르면 초점이 안 틀에 머물러 Esc가 웹앱에 오지 않음(창이 그대로)', { e0, e1 });
  // 창을 떠나지 않은 동안(글 치는 중)은 초점을 빼앗지 않음
  await p.waitForTimeout(800); if (cf) await cf.type('#q', '글').catch(() => {});
  const e2 = await p.evaluate(() => ({ ae: document.activeElement && document.activeElement.tagName, n: ALPV.escBackN || 0 }));
  ok(e2.ae === 'IFRAME' && !e2.n, '알라딘 창 안에서 글 치는 동안은 초점을 그대로 둠', e2);
  // 다른 프로그램으로 갔다가(창이 초점을 잃음) 돌아옴
  await p.evaluate(() => { window.__hf = Document.prototype.hasFocus; document.hasFocus = () => false; }); await p.waitForTimeout(700);
  await p.evaluate(() => { document.hasFocus = () => true; }); await p.waitForTimeout(700);
  const e3 = await p.evaluate(() => ({ ae: document.activeElement && document.activeElement.className, n: ALPV.escBackN || 0 }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  const e4 = await p.evaluate(() => !!document.querySelector('.alpv'));
  ok(/alpv/.test(e3.ae || '') && e3.n === 1 && !e4, '다른 프로그램·창에 갔다 돌아오면 초점이 웹앱 🪟 창으로 → Esc로 닫힘', { e3, e4 });
  // 크롬 다른 탭에 갔다 돌아옴(탭 숨김·보임)
  await p.evaluate(() => { alPvParkDrop(); }); await p.evaluate((s) => document.querySelector(s).click(), RW('w01')); await p.waitForTimeout(700);
  { const f2 = await p.$('.alpv iframe.alpv-live'); const c2 = f2 && (await f2.contentFrame()); if (c2) await c2.click('#q').catch(() => {}); }
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(100);
  const e5 = await p.evaluate(() => ({ ae: document.activeElement && document.activeElement.className })); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(/alpv/.test(e5.ae || '') && (await p.evaluate(() => !document.querySelector('.alpv'))), '크롬 다른 탭에 갔다 돌아와도 Esc로 닫힘', e5);
  await p.evaluate(() => { delete document.visibilityState; document.hasFocus = window.__hf; alPvParkDrop(); });
  ok(await p.evaluate(() => new Promise((r) => setTimeout(() => r(true), 700))), '창을 닫으면 살핌(0.3초)도 멈춤(아래 메모리 확인)');
  // ── ③-3 지정 창 하나
  await fakeOpen(p);
  await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w01')); await p.waitForTimeout(100);
  await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w02')); await p.waitForTimeout(100);
  await p.evaluate((s) => document.querySelector(s).click(), RW('w01')); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.alpv-h a[data-alpvnew]').click()); await p.waitForTimeout(100);
  await p.evaluate(() => document.querySelector('.alpv [data-alwpop]').click()); await p.waitForTimeout(100);
  await p.evaluate((s) => { const t = document.querySelector(s); t.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })); }, RW('w02')); await p.waitForTimeout(100);
  const w1 = await p.evaluate(() => ({ L: window.__OW, opener: window.__LW && window.__LW.opener, focus: window.__LW && window.__LW.focusN, open: !!document.querySelector('.alpv') }));
  const opens = w1.L.filter((x) => x.u), navs = w1.L.filter((x) => x.nav);
  ok(opens.length === 1 && opens[0].n === 'rn_alwin' && navs.length === 4, '↗ 카드·↗ 다른 카드·창 머리줄 새 탭↗·🗗 작은 창·가운데 단추 = 지정 창 하나(처음만 만들고 다음부터 주소만 바꿈)', w1.L);
  ok(/wuseditemall\.aspx\?ItemId=30001&TabType=0/.test(opens[0].u) && /wuseditemall\.aspx\?ItemId=40002&TabType=0/.test(navs[0].nav), '↗ = 그 상품의 전체중고(중고 모두보기 · 정범님 11/10 12시 — 예전엔 🪟 창 처음 화면)', { o: opens[0].u, n: navs[0].nav });
  ok(w1.focus === 5 && w1.open, '누를 때마다 지정 창을 앞으로 · 🪟 창은 그대로', w1);
  ok(phone ? opens[0].f === null : /popup,width=\d+,height=\d+/.test(opens[0].f || ''), phone ? '휴대폰: 창 크기 없이 이름 붙은 새 탭 하나(다시 씀)' : 'PC: 따로 뜨는 지정 창', opens[0]);
  // 지정 창을 닫았으면 다시 만듦(같은 이름)
  await p.evaluate(() => { window.__LW.closed = true; window.__OW = []; }); await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w01')); await p.waitForTimeout(100);
  const w2 = await p.evaluate(() => window.__OW);
  ok(w2.length === 1 && w2[0].n === 'rn_alwin', '지정 창을 닫았으면 같은 이름으로 다시 만듦', w2);
  // ↗를 눌러도 🪟 창이 바깥 누르기로 닫히며 누름이 삼켜지지 않음
  await p.evaluate(() => { window.__OW = []; const d = document.querySelector('.alpv'); Object.assign(d.style, { left: 'auto', right: '0px', top: '0px', width: '440px', height: '320px', bottom: 'auto' }); d.classList.add('geo'); });
  const bx = await p.evaluate(() => { for (const e of document.querySelectorAll('[data-alnw]')) { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const at = document.elementFromPoint(x, y); if (at && e.contains(at)) return { x, y, vis: !!document.querySelector('.alpv') }; } return null; });
  if (!phone) { ok(!!bx && bx.vis, '🪟 창 밖에 보이는 ↗가 있음', bx); if (bx) { await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(150); const w3 = await p.evaluate(() => window.__OW); ok(w3.length === 1, '🪟 창이 열린 채 카드의 ↗를 눌러도 지정 창이 열림(바깥 누르기 닫기에 누름이 삼켜지지 않음)', { bx, w3 }); } }
  await p.evaluate(() => { alPvClose(); alPvParkDrop(); });
  // 브라우저 진짜 창으로 — 두 번 눌러도 새 창은 하나
  const ctx = p.context(); await ctx.route(/aladin\.co\.kr/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>알라딘 흉내</body></html>' }));
  let pages = 0; ctx.on('page', () => pages++);
  await p.evaluate(() => { ALPV.newW = null; window.__rnOpenRaw = window.__rnRealOpen; });
  await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w01')); await p.waitForTimeout(800);
  await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w02')); await p.waitForTimeout(800);
  await p.evaluate(() => { ALPV.newW = null; }); /* 웹앱을 새로 고친 것처럼 손잡이를 잊어도 이름으로 같은 창 */ await p.evaluate((s) => document.querySelector(s).nextElementSibling.click(), RW('w01')); await p.waitForTimeout(800);
  const pg = ctx.pages().filter((x) => x !== p); const last = pg[0] ? pg[0].url() : null;
  ok(pages === 1 && pg.length === 1 && /ItemId=30001/.test(last || ''), '진짜 브라우저: ↗ 세 번(손잡이를 잊은 뒤 포함) → 새 창은 하나 · 마지막 주소로', { pages, n: pg.length, last });
  const mem = await p.evaluate(() => ({ open: !!document.querySelector('.alpv'), toast: (document.getElementById('toast') || {}).textContent || '' }));
  ok(!mem.open && !/막혔/.test(mem.toast), '창 열기가 막히지 않음', mem);
};
(async () => {
  const wrap = (phone) => async (p) => { await p.evaluate(() => { if (!window.__rnRealOpen) window.__rnRealOpen = window.__rnOpenRaw; }); return run(phone)(p); };
  await H(async (p) => { console.log('— 📦 상품 탭(PC)'); await p.evaluate(require('./seedBig.js')); await p.waitForTimeout(800); await p.evaluate(() => { S.tab = 'products'; renderMain(); }); await p.waitForTimeout(3000);
    const b3 = await p.evaluate(() => { const A = [...document.querySelectorAll('[data-alscr]')]; return { n: A.length, pair: A.filter((a) => a.nextElementSibling && a.nextElementSibling.dataset.alnw && a.nextElementSibling.dataset.mkk === a.dataset.mkk).length, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    ok(b3.n > 0 && b3.pair === b3.n && b3.sw <= b3.iw, '📦 상품 탭 카드: 🪟 알라딘마다 옆에 ↗(가로 넘침 없음)', b3); }, { vp: { width: 1400, height: 900 } });
  await H(wrap(false), { vp: { width: 1400, height: 900 } }); await HM(wrap(true), { vp: { width: 390, height: 844 }, touch: true }); console.log(bad ? `❌ tALWIN 실패 ${bad}` : '✓ tALWIN 통과'); })();
