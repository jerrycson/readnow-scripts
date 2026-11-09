// tLINK1 — 정범님 11/09: ① 🪟 알라딘 창이 늦게 뜸 → 빨리 열기(틀 먼저 · 마우스 올림 미리 받기 · 닫은 창 잠깐 보관) ② 예스24·외국 사이트 링크를 알라딘 창 안 칩 하나로(처음 뜨는 곳: 화면의 일 > 최근에 본 곳)
//   ③ 🧮 수동 일괄 카드 정보 줄(사진·종류·SP·새책 상태·등록일·출판사·저자·유의사항)
// 실행: cd pw && RN_PORT=<포트> node tLINK1.js
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); };
const H = require('./harness.js'); const DELAY = 1200; /* 알라딘 응답을 1.2초 늦게 — 실제 알라딘 화면 받는 시간 흉내 */
(async () => {
await H(async (p) => { await p.evaluate(require('./seedBig.js')); await p.waitForTimeout(800); await p.evaluate(() => { S.tab = 'products'; renderMain(); }); await p.waitForTimeout(3000);
  await p.route(/(aladin\.co\.kr|yes24\.com|abebooks\.com|amazon\.com)/, async (r) => { await new Promise((z) => setTimeout(z, DELAY)); r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><h1>참고 화면</h1>' + 'x'.repeat(20000) + '</body></html>' }); });
  await p.evaluate(() => { try { localStorage.setItem('rn-alpv-mode3', 'live'); localStorage.removeItem('rn-refplat'); } catch (e) {} ALPV.mode = null; document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IFRAME') e.target.__ld = performance.now(); }, true); });
  // ── ① 창 여는 시간
  const box = await p.evaluate(async () => { const f0 = [...document.querySelectorAll('[data-alscr]')].find((b) => b.offsetParent); f0.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 400));
    const vis = [...document.querySelectorAll('[data-alscr]')].filter((b) => { const r = b.getBoundingClientRect(); if (!r.width || r.top < 0 || r.bottom > innerHeight) return false; const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && b.contains(e); });
    const seen = new Set(); const two = vis.filter((b) => { const k = JSON.stringify(alCtxOf(b)); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 2);
    const sk = (b) => '[data-alscr]' + ['mkk', 'iid', 'q'].filter((a) => b.dataset[a]).map((a) => `[data-${a}="${CSS.escape(b.dataset[a])}"]`).join(''); const r = two[0].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, s1: sk(two[0]), s2: two[1] && sk(two[1]) }; });
  const meas = (sel) => p.evaluate(async (sel) => { const el = document.querySelector(sel); const t0 = performance.now(); let tf = null, tc = null; el.click();
    await new Promise((res) => { const tick = () => { const d = document.querySelector('.alpv'); const vis = d && d.getBoundingClientRect().width > 0; if (vis && tf == null) tf = performance.now() - t0; const f = d && d.querySelector('iframe.alpv-live'); if (vis && f && f.__ld && tc == null) tc = performance.now() - t0; if ((tf != null && tc != null) || performance.now() - t0 > 6000) return res(); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    return { frame: tf == null ? null : Math.round(tf), content: tc == null ? null : Math.round(tc) }; }, sel);
  const close = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); };
  await p.mouse.move(box.x, box.y); await p.waitForTimeout(600); const a = await meas(box.s1); await close();
  const pk = await p.evaluate(() => { const z = document.querySelector('.alpvz'); return { z: !!z, open: !!document.querySelector('.alpv') }; });
  const b = await meas(box.s1); await close(); await p.mouse.move(5, 5); await p.waitForTimeout(100);
  const c = await meas(box.s2); await close();
  console.log(`  ⏱ 고친 뒤(알라딘 응답 ${DELAY}ms): 마우스 올린 뒤 누름 ${JSON.stringify(a)} · 같은 상품 다시 ${JSON.stringify(b)} · 다른 상품 바로 ${JSON.stringify(c)} (ms — frame 창 틀 · content 내용)`);
  ok(a.frame != null && a.frame < 150 && b.frame < 150 && c.frame < 150, '창 틀은 누르는 즉시(150ms 안)', { a, b, c });
  ok(a.content != null && a.content < DELAY - 100, '마우스를 올려 두면 미리 받아 내용이 더 빨리 뜸', a);
  ok(pk.z && !pk.open && b.content != null && b.content < 150, '닫은 창은 숨겨 보관 → 같은 상품 다시 열면 받지 않고 바로', { pk, b });
  ok(c.content != null && c.content >= DELAY - 50, '다른 상품은 새로 받음(보관 창을 엉뚱하게 쓰지 않음)', c);
  // 창 안에서 다른 화면으로 넘어간 창은 보관하지 않음
  const nav = await p.evaluate(async (s) => { document.querySelector(s).click(); await new Promise((r) => setTimeout(r, 100)); const f = document.querySelector('.alpv iframe.alpv-live'); f.__ldN = 2; alPvClose(); return { z: !!document.querySelector('.alpvz') }; }, box.s1);
  ok(!nav.z, '창 안에서 다른 화면으로 넘어간 창은 보관하지 않음', nav);
  // ── ② 플랫폼 칩 · 처음 뜨는 곳
  const r2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; alPvParkDrop(); try { localStorage.removeItem('rn-refplat'); } catch (e) {}
    const btn = (q, iid) => { const s = document.createElement('div'); s.innerHTML = alBtn({ q, iid }); const el = s.firstElementChild; document.body.appendChild(el); return el; };
    const k1 = btn('9788937460449', '1001'); k1.click(); await W(150); const d = document.querySelector('.alpv'); out.chips = [...d.querySelectorAll('[data-alpv^="p:"]')].map((x) => x.textContent); out.on0 = (d.querySelector('.alpv-plat .on') || {}).textContent; out.why0 = (d.querySelector('.alpv-why') || {}).textContent; out.src0 = (d.querySelector('iframe.alpv-live') || {}).src;
    d.querySelector('[data-alpv="p:yes24"]').click(); await W(150); out.src1 = (document.querySelector('.alpv iframe.alpv-live') || {}).src; out.on1 = (document.querySelector('.alpv .alpv-plat .on') || {}).textContent; out.mode1 = !!document.querySelector('.alpv .alpv-m'); out.seg1 = !!document.querySelector('.alpv .alpv-pg');
    alPvClose(); await W(50); k1.click(); await W(150); out.on2 = (document.querySelector('.alpv .alpv-plat .on') || {}).textContent; out.why2 = (document.querySelector('.alpv .alpv-why') || {}).textContent; out.src2 = (document.querySelector('.alpv iframe.alpv-live') || {}).src; alPvClose();
    // ① 화면의 일이 ② 최근에 본 곳보다 앞섬 — 예스24 화면 / 등록 화면
    const c = refCtx({ q: '9788937460449', iid: '1001' }); const pg0 = window.pgdCur; window.pgdCur = () => 'y24Link'; try { localStorage.setItem('rn-refplat', JSON.stringify({ b9788937460449: 'aladin' })); } catch (e) {} const P1 = refPick(c); window.pgdCur = () => 'register'; try { localStorage.setItem('rn-refplat', JSON.stringify({ b9788937460449: 'yes24' })); } catch (e) {} const P2 = refPick(c); window.pgdCur = () => 'products'; const P3 = refPick(c); window.pgdCur = pg0;
    out.pick = [P1.p.k + ':' + P1.why, P2.p.k + ':' + P2.why, P3.p.k + ':' + P3.why];
    // 🌍 외국 도서 — 외국 사이트 칩 · 띄우기를 막는 곳은 새 탭·작은 창 안내
    const k2 = btn('9780141439518', ''); k2.click(); await W(150); const d2 = document.querySelector('.alpv'); out.fchips = [...d2.querySelectorAll('[data-alpv^="p:"]')].map((x) => x.textContent); d2.querySelector('[data-alpv="p:amazon"]').click(); await W(150); const d3 = document.querySelector('.alpv'); out.amz = { frame: !!d3.querySelector('iframe'), tab: ((d3.querySelector('.alpv-c a[target="_blank"]') || {}).href || ''), pop: !!d3.querySelector('.alpv-c [data-alwpop]') }; alPvClose(); k1.remove(); k2.remove();
    out.tbl = REF_PLAT.map((x) => x.k).join(','); return out; });
  ok(r2.chips.join(',') === '알라딘,예스24' && r2.on0 === '알라딘' && /기본/.test(r2.why0 || '') && /aladin\.co\.kr/.test(r2.src0 || ''), '국내 도서: 칩 알라딘·예스24 · 처음 = 알라딘(기본)', r2);
  ok(/yes24\.com\/Product\/Search\?domain=USED&query=9788937460449/.test(r2.src1 || '') && r2.on1 === '예스24' && !r2.mode1 && !r2.seg1, '예스24 칩 → 같은 창 안에 예스24 중고 검색(ISBN) · 알라딘 전용 단추는 숨김', r2);
  ok(r2.on2 === '예스24' && /최근에 본/.test(r2.why2 || '') && /yes24/.test(r2.src2 || ''), '같은 상품 다시 = 최근에 본 플랫폼(예스24)부터', r2);
  ok(r2.pick[0] === 'yes24:scr' && r2.pick[1] === 'aladin:scr' && r2.pick[2] === 'yes24:seen', '처음 플랫폼 판정: 화면의 일(예스24 화면→예스24 · 등록→알라딘) > 최근에 본 곳', r2.pick);
  ok(['AbeBooks', 'BookFinder', 'Amazon', 'eBay', 'Biblio'].every((n) => r2.fchips.some((t) => t.includes(n))) && !r2.amz.frame && /amazon\.com\/s\?k=9780141439518/.test(r2.amz.tab) && r2.amz.pop, '외국 도서: 🌍 외국 사이트 칩 · 띄우기를 막는 곳은 창 안에 새 탭·작은 창', r2);
  ok(r2.tbl.split(',').length >= 7, '플랫폼 표 한 곳(REF_PLAT)', r2.tbl);
  // 카드엔 🪟 하나 — 따로 떨어진 예스24 링크 없음
  const r3 = await p.evaluate(() => { const t = document.body.innerHTML; return { y: (t.match(/class="ulink y24"|class="reflk y24"|예스24↗|예스24 중고 ↗/g) || []).length, n: document.querySelectorAll('[data-alscr]').length, rl: refLinks('9788937460449', '1', '책'), ub: usedBtn(null, { title: '책', isbn13: '9788937460449' }) }; });
  ok(r3.y === 0 && r3.n > 0 && !/yes24/i.test(r3.rl + r3.ub) && /data-alscr/.test(r3.rl) && /data-alscr/.test(r3.ub), '모든 카드: 🪟 단추 하나만(예스24 링크가 따로 없음)', r3);
}, { vp: { width: 1400, height: 900 } });
// ── ③ 수동 일괄 카드 정보 줄
for (const vw of [1280, 390]) await H(async (p) => { console.log(`— 수동 일괄 카드 · 화면 폭 ${vw}px`); await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); window.ask = async () => true;
    S.prCfg = { ...(S.prCfg || {}), watchVer: '0.9.0', batchOff: {} };
    S.pbooks.set('BKL1', { id: 'BKL1', title: '정보 줄 책', publisher: '시험출판', author: '지은이A (지은이)', categories: [{ path: ['국내도서', '소설/시/희곡'] }], images: { front: { src: 'https://image.aladin.co.kr/product/1/2/cover/x.jpg' } } });
    S.pmetrics.set('BKL1', { id: 'BKL1', salesPoint: 12345, availability: '절판', lastCheckedAt: now }); S.pbooks.set('BKL2', { id: 'BKL2', title: 'Foreign', categories: [{ path: ['외국도서', 'Fiction'] }] });
    S.uinfo = S.uinfo || new Map(); S.uinfo.set('LU81', { note: '모서리 눌림 있음 · 본문 깨끗', photos: [{ src: 'https://image.aladin.co.kr/usedshop/2026/1109/scm12345.jpg', where: 'desc' }, { src: 'https://image.aladin.co.kr/product/1/2/cover/x.jpg' }] });
    const mk = (u, o) => { const l = { id: 'aladin_' + u, usedCode: u, title: '정보 줄 ' + u, price: 9000, listingId: 'L' + u, status: '판매중', active: true, sku: 'BLKCMN', grade: '상', bookId: null, registeredAt: '2026-10-01T10:00:00', isbn13: '9788937460449', lastSeenAt: now, ...o }; return { l, target: 8000, reasons: ['시험'], page1: [], out: false }; };
    S.batchRes = [mk('U81', { bookId: 'BKL1' }), mk('U82', { bookId: 'BKL2', isbn13: '9780141439518', registeredAt: null }), mk('U83', { title: '영화 DVD', mediaType: 'video', isbn13: '' })]; S.batchId = 'bL1'; S.batchSt = { start: {}, picks: {}, decided: {} }; S.batchMeta = {}; S.prBatches = [{ id: 'bL1', name: '정보 줄 시험' }]; S.batchT = 'sel'; S._bFresh = true;
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '정보 줄 시험' }))); await W(1200);
    const card = (u) => document.querySelector(`#b_res .card[data-mk="aladin_${u}"]`); const txt = (u) => ((card(u) || {}).querySelector ? (card(u).querySelector('.bqi') || {}).textContent || '' : '').replace(/\s+/g, ' ');
    const c1 = card('U81'); const img = c1 && c1.querySelector('.bqi-img'); const ph = c1 && [...c1.querySelectorAll('.bqi-ph')];
    const out = { t1: txt('U81'), t2: txt('U82'), t3: txt('U83'), img: img && img.tagName, pz: !!(img && img.dataset.pz), ph: ph ? ph.length : -1, y: (document.querySelector('#b_res').innerHTML.match(/예스24 ↗/g) || []).length, al: c1 ? c1.querySelectorAll('[data-alscr]').length : 0, sw: document.documentElement.scrollWidth, iw: innerWidth };
    if (img) { img.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' })); await W(400); const z = document.getElementById('pzbox'); out.zoom = !!(z && z.style.display === 'block' && z.querySelector('img')); pzHide(); }
    return out; });
  ok(/종류\s*국내도서/.test(r.t1) && /SP\s*12,345/.test(r.t1) && /새책\s*절판/.test(r.t1) && /등록\s*2026-10-01/.test(r.t1) && /출판사\s*시험출판/.test(r.t1) && /저자\s*지은이A/.test(r.t1), '카드 정보: 종류·SP·새책 상태·등록일·출판사·저자', r.t1);
  ok(/유의사항\s*모서리 눌림/.test(r.t1) && r.ph === 1, '유의사항 글 + 판매자 제품 사진(알라딘 표지는 뺌)', { t1: r.t1, ph: r.ph });
  ok(r.img === 'IMG' && r.pz && r.zoom, '상품 사진 — 마우스를 올리면 크게(pzShow)', r);
  ok(/종류\s*외국도서/.test(r.t2) && /SP\s*—/.test(r.t2) && /등록\s*—/.test(r.t2) && /출판사\s*—/.test(r.t2) && /유의사항\s*—/.test(r.t2), '없는 자료는 — (외국도서 판정)', r.t2);
  ok(/종류\s*DVD/.test(r.t3), 'DVD 판정', r.t3);
  ok(r.y === 0 && r.al === 1, '카드엔 🪟 하나(예스24 ↗ 따로 없음)', r);
  ok(r.sw <= r.iw + 1, '화면이 옆으로 넘치지 않음', r);
}, { vp: { width: vw, height: 800 } });
console.log(bad ? `❌ tLINK1 실패 ${bad}` : '✓ tLINK1 통과'); })();
