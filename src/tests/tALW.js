// tALW — 정범님 11/06 '📥 등록 상품 카드(자세히·한눈에)에 그 상품 알라딘 화면을 웹앱 안 창으로 여는 「🪟 알라딘 창」 · 외국 도서는 외국 사이트 링크도' + '🔭 벤치마킹 조회 → 매입 상품 조회 이름 바꿈'
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const run = (vw) => async (p) => { console.log(`— 화면 폭 ${vw}px`); await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}' });
  await p.evaluate(async () => { const t = new Date().toISOString(); S.user = S.user || { email: 'tester@x' }; S.regItems = S.regItems || new Map(); window.ask = async () => true; window.__pops = []; window.__rnOpenRaw = (u, n, f) => { window.__pops.push([u, n, f]); return {}; };
    const mk = (id, o) => ({ stage: 'sel', isbn: '97911000002' + id.slice(-1), grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, ...o, info: { title: '알라딘 창 책 ' + id, isbn13: '97911000002' + id.slice(-1), itemId: '3000' + id.slice(-1), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, priceSales: 13500, at: t, ...((o && o.info) || {}) } });
    const L = { w01: mk('w01', {}), w02: mk('w02', { branch: 7, isbn: '0141439513', info: { title: 'Pride and Prejudice', isbn13: '', itemId: '', categories: [{ path: ['외국도서', 'Fiction'] }] } }), w03: mk('w03', { stage: 'done', result: { state: 'live', usedCode: 'UC9' }, final: { price: 9000, qty: 1, code: 'BLKCMN' } }) };
    S.plist = S.plist || new Map(); S.plist.set('aladin_UC9', { id: 'aladin_UC9', usedCode: 'UC9', listingId: '77777', title: '알라딘 창 책 w03', active: true });
    for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    try { localStorage.setItem('rn-reg-view', 'compact'); localStorage.setItem('rn-alpv-mode3', 'live'); } catch (e) {}
    S.regT = 'sel'; openRegister(); });
  await p.waitForTimeout(1600);
  // 1) 한눈에 줄 — 제목 옆 🪟 (외국 도서는 🌍 표시) · 누르면 줄이 펼쳐지지 않음
  const r1 = await p.evaluate(() => { const a = document.querySelector('.rgrow[data-rgexp="w01"] [data-rgalw]'), b = document.querySelector('.rgrow[data-rgexp="w02"] [data-rgalw]'); return { a: a && a.textContent, b: b && b.textContent, al: a && a.getAttribute('aria-label'), sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  ok(r1.a === '🪟' && /🌍/.test(r1.b || '') && r1.al === '🪟 알라딘 창', '한눈에 줄 제목 옆 🪟 · 외국 도서는 🌍', r1);
  ok(r1.sw <= r1.iw + 1, '화면이 옆으로 넘치지 않음', r1);
  await p.click('.rgrow[data-rgexp="w01"] [data-rgalw]'); await p.waitForTimeout(500);
  const r2 = await p.evaluate(() => { const d = document.querySelector('.alpv'); const f = d && d.querySelector('iframe.alpv-live'); const r = d && d.getBoundingClientRect(); return { open: !!d, src: f && f.getAttribute('src'), bar: d && (d.querySelector('.alpv-x') || {}).innerText, seg: d ? [...d.querySelectorAll('[data-alpv^="pg:"]')].map((b) => b.textContent) : [], frn: !!(d && d.querySelector('.alpv-frn')), exp: !!document.querySelector('[data-rgfold="w01"]'), inV: r ? r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 : false }; });
  ok(r2.open && /wproduct\.aspx\?ItemId=30001$/.test(r2.src || ''), '누르면 웹앱 안 창에 그 상품 알라딘 상품 페이지(ItemId)', r2);
  ok(/🪟 알라딘 창/.test(r2.bar || '') && /🗗 작은 창/.test(r2.bar || '') && /X-Frame-Options/.test(r2.bar || ''), '창 위 띠: 🪟 알라딘 창 이름 · 🗗 작은 창 · 막힐 때 까닭 한 줄', r2.bar);
  ok(r2.seg.includes('상품 페이지') && r2.seg.includes('전체중고') && !r2.frn && !r2.exp && r2.inV, '국내 도서: 상품 페이지·전체중고 · 외국 링크 없음 · 줄은 그대로 · 창은 화면 안', r2);
  // 2) 🗗 작은 창 — 따로 뜨는 창(브라우저 창)으로
  await p.click('.alpv [data-alwpop]'); await p.waitForTimeout(200);
  const pop = await p.evaluate(() => window.__pops.slice(-1)[0]);
  ok(pop && /ItemId=30001/.test(pop[0]) && /popup/.test(pop[2] || ''), '🗗 작은 창 = 작은 브라우저 창으로 같은 주소', pop);
  // 3) Esc로 닫힘 → 등록 화면 그대로
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('.alpv') && !!document.querySelector('.rgrow[data-rgexp="w01"]')), 'Esc로 닫으면 등록 화면 그대로');
  // 4) 외국 도서 — 외국 사이트 ISBN 검색 링크(새 탭) · 상품 번호 없으면 ISBN 상품 검색
  await p.click('.rgrow[data-rgexp="w02"] [data-rgalw]'); await p.waitForTimeout(500);
  const r4 = await p.evaluate(() => { const d = document.querySelector('.alpv'); const A = d ? [...d.querySelectorAll('.alpv-frn a')].map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('target')]) : []; const f = d && d.querySelector('iframe.alpv-live'); return { A, src: f && f.getAttribute('src'), seg: d ? [...d.querySelectorAll('[data-alpv^="pg:"]')].map((b) => b.textContent) : [] }; });
  const nm = r4.A.map((a) => a[0]).join(' ');
  ok(['AbeBooks', 'BookFinder', 'Amazon', 'eBay', 'Biblio'].every((n) => nm.includes(n)) && r4.A.every((a) => a[1].includes('0141439513') && a[2] === '_blank'), '외국 도서: AbeBooks·BookFinder·Amazon·eBay·Biblio ISBN 검색 링크(새 탭)', r4.A);
  ok(/SearchWord=0141439513/.test(r4.src || '') && r4.seg.includes('상품 검색'), '상품 번호가 없으면 ISBN으로 알라딘 상품 검색', r4);
  // 5) ✕로 닫기
  await p.click('.alpv [data-alpv="x"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('.alpv')), '✕로 닫힘');
  // 6) 자세히 카드 — 제목 옆 「🪟 알라딘 창」 · 확정 상품은 우리 판매 페이지(판매 코드 → 우리 상품 목록 listingId)
  await p.evaluate(() => { try { localStorage.setItem('rn-reg-view', 'full'); } catch (e) {} S.regT = 'done'; regRerender(); }); await p.waitForTimeout(1200);
  const r6 = await p.evaluate(() => { const b = document.querySelector('[data-rgalw="w03"]'); return { t: b && b.textContent, inTtl: !!(b && b.closest('.rgttl')) }; });
  ok(r6.t === '🪟 알라딘 창' && r6.inTtl, '자세히 카드 제목 옆 「🪟 알라딘 창」', r6);
  if (r6.t) { await p.click('[data-rgalw="w03"]'); await p.waitForTimeout(500);
    const r7 = await p.evaluate(() => { const b = [...document.querySelectorAll('.alpv [data-alpv^="pg:"]')].find((x) => x.textContent === '우리 판매 페이지'); if (!b) return { no: 1 }; b.click(); return new Promise((r) => setTimeout(() => { const f = document.querySelector('.alpv iframe.alpv-live'); r({ src: f && f.getAttribute('src') }); }, 400)); });
    ok(/ItemId=77777$/.test(r7.src || ''), '우리 판매 페이지 = 우리 상품 화면(listingId)', r7);
    // 같은 단추를 한 번 더 → 닫힘
    await p.evaluate(() => { const b = document.querySelector('[data-rgalw="w03"]'); b && b.click(); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.querySelector('.alpv')), '같은 🪟 한 번 더 누르면 닫힘'); }
  // 7) 이름 바꿈 — 매입 상품 조회 (집중 벤치마킹은 그대로)
  const r8 = await p.evaluate(() => { openBenchLookup(); return new Promise((r) => setTimeout(() => { const t = (document.querySelector('#sheet .sh .t') || {}).textContent || ''; r({ t, fe: featIndex().filter((f) => /매입 상품 조회/.test(f.t)).length, old: featIndex().filter((f) => /벤치마킹 조회|벤치조회/.test(f.t)).length, hub: (PG_SCR.find((x) => x[0] === 'benchHub') || [])[1] }); }, 600)); });
  ok(/🔭 매입 상품 조회/.test(r8.t) && r8.fe >= 2 && r8.old === 0 && /집중 벤치마킹/.test(r8.hub || ''), '🔭 매입 상품 조회 이름(화면 머리·🔍) · 🎯 집중 벤치마킹은 그대로', r8);
};
(async () => { await H(run(1400), { vp: { width: 1400, height: 900 } }); await H(run(390), { vp: { width: 390, height: 800 } }); console.log(bad ? `❌ tALW 실패 ${bad}` : '✓ tALW 통과'); })();
