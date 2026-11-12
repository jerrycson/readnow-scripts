/* tHANDOFF4_1112 — (11/12 handoff4 · 리드 '📘·📈·🏷 묶음째 · R21') 🔀 번외로 넘기기 — 웹앱 쪽 📦 상품 화면 묶음
 *  ① 넘긴 📦(JS-MAIN): 번외가 읽은 상품 화면·중고 첫 쪽 → 웹앱이 운영 본체 refreshOne0를 글자 그대로 떼어 가짜 Firestore로 부름 → prd_book_metrics·prd_books·prd_metric_changes · 쓴 이 번외 JS-MAIN · 잡기(prd_jobs/pclaim_<책>) 놓음
 *  ② 운영 market 규칙: 시장 지표 확인 시각이 주기(7일) 안이면 쓰지 않음(할 일 없음 = 받음) · ③ 우리 상품 연결이 없는 책 · 운영 설정 구매자 분포 함께 읽기 켬 · 다른 번외 PC가 4분 안에 잡음 → 거절
 *  ④ ⚙ › 🔀 묶음 보기: 📘 묶음의 📦 = '넘길 수 있음'(JS-MAIN 묶음 그림자) · 🟧 R21 추천 판매가 까닭(정가 × 45% × 품질 · 쿠키 없이도 같은 답)
 * 실행: cd pw && RN_PORT=<포트> node tHANDOFF4_1112.js (RN_COLLECTOR=<운영 본체 src 경로> — 없으면 저장소 옆 경로) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 900) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path');
const SRCF = process.env.RN_COLLECTOR || [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../../src/readnow-collector.src.js'), '/home/user/readnow-scripts/src/readnow-collector.src.js'].find((f) => fs.existsSync(f));
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let outNow = []; const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/raw\.githubusercontent\.com\/jerrycson\/readnow-scripts\/main\/src\/readnow-collector\.src\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/plain', body: fs.readFileSync(SRCF, 'utf8') }));
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const o = outNow; outNow = []; return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: o, hot: false, pc: 'JS-MAIN', pcSrc: 'web', ver: '0.1.46', kind: 'office', handBeat: {}, handAt: 0 }); }
    return J({ ok: true }); });
  const tick = async () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); await new Promise((r) => setTimeout(r, 200)); });
  const errsOf = () => Object.assign({}, ...calls.filter((c) => c.p === '/relay/ack' && c.b && c.b.errs).map((c) => c.b.errs)); const keysOf = () => [].concat(...calls.filter((c) => c.p === '/relay/ack' && c.b && c.b.keys).map((c) => c.b.keys));
  const old = new Date(Date.now() - 9 * 864e5).toISOString();
  await p.evaluate(async ({ old }) => { localStorage.setItem('rn-device', 'JS-MAIN'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    await db.collection('prd_system').doc('settings').set({ keyScheme: 'aladinItemId', recheckDays: 7, dynamicParts: false });
    for (const [b, it] of [['b1', '111'], ['b2', '222'], ['b3', '333'], ['b4', '444']]) { await db.collection('prd_books').doc(b).set({ bookId: b, keyScheme: 'aladinItemId', aladinItemId: it, isbn13: '979110000' + it + '7', title: '옛 제목 ' + b, productUrl: 'https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=979110000' + it + '7' });
      await db.collection('prd_book_metrics').doc(b).set({ bookId: b, priceSales: 9000, lastCheckedAt: b === 'b2' ? new Date().toISOString() : old, activeRanks: [] }); }
    for (const b of ['b1', 'b2', 'b4']) await db.collection('prd_listings').doc('aladin_U' + b).set({ bookId: b, usedCode: 'U' + b, active: true, isbn13: '9791100000017', title: '책', mediaType: 'book' });
    await db.collection('prd_jobs').doc('pclaim_b4').set({ pc: 'col2-HOME', name: '번외 HOME', at: Date.now() });
    await db.collection('app_settings').doc('col2_handoff').set({ jobs: { product: { on: true, pc: 'JS-MAIN', at: new Date().toISOString(), by: '시험' } }, log: [] }); await new Promise((r) => setTimeout(r, 400)); }, { old });
  const page = (it) => ({ aladinItemId: it, title: '새 책', isbn13: '979110000' + it + '7', fetchedFrom: 'aladin', priceList: 12000, priceSales: 10800, salesPoint: 345, rating: 9, commentCount: 3, reviewCount: 1, availability: 'onSale', ranks: ['국내도서 > 에세이 3위'], categories: [], contributors: [{ name: '가', role: '지은이' }], images: { front: null } });
  const used = { usedTotal: 4, tabs: { all: 4 }, mins: { all: 3000 }, buyback: null, listings: [{ p: 3000, sc: '9' }], lastPage: 1 };
  const item = (k, id, it) => ({ k, c: 'prd_book_metrics', id, op: true, job: 'product', merge: true, web: true, v: { pub: { itemId: it, page: page(it), used } } });
  await tick(); await p.waitForTimeout(400); /* 넘김 문서 듣기 시작 */
  /* ① 쓰기 */
  outNow = [item('p1', 'b1', '111')]; await tick(); await p.waitForTimeout(600);
  let st = await p.evaluate(() => JSON.parse(JSON.stringify({ m: __FS.prd_book_metrics.b1, b: __FS.prd_books.b1, ch: Object.values(__FS.prd_metric_changes || {}), rp: Object.values(__FS.prd_rank_periods || {}), cl: (__FS.prd_jobs || {}).pclaim_b1 })));
  ok(keysOf().includes('p1') && st.m.priceSales === 10800 && st.m.usedTotal === 4 && st.m.checkedBy === '번외 JS-MAIN' && st.m.writer === '번외 JS-MAIN' && Date.parse(st.m.lastCheckedAt) > Date.parse(old) && Array.isArray(st.m.usedFirstPage),
    '① 운영 refreshOne0 그대로: 시장 지표·중고 첫 쪽·확인 시각 · 확인한 PC = 번외 JS-MAIN', { k: keysOf(), e: errsOf(), m: st.m });
  ok(st.b.title === '옛 제목 b1' && st.b.lastFetchedAt && st.b.productUrl.includes('ISBN=') && st.ch.some((c) => c.changes && c.changes.priceSales) && st.ch.some((c) => c.kind === 'usedListings') && st.rp.some((r) => r.title === '국내도서 > 에세이 3위'), '① 도서 고정 칸은 처음 값 지킴 · 바뀐 값·중고 첫 쪽·새 순위는 운영처럼 기록', st);
  ok(st.cl && st.cl.pc === null && st.cl.doneAt, '① 쓴 뒤 잡기(prd_jobs/pclaim_b1)를 놓음', st.cl);
  /* ② ③ */
  await p.evaluate(() => db.collection('prd_system').doc('settings').set({ keyScheme: 'aladinItemId', recheckDays: 7, dynamicParts: false }));
  const lc2 = await p.evaluate(() => __FS.prd_book_metrics.b2.lastCheckedAt);
  outNow = [item('p2', 'b2', '222'), item('p3', 'b3', '333'), item('p4', 'b4', '444'), item('p5', 'b1', '999')]; await tick(); await tick(); await p.waitForTimeout(400); const E = errsOf();
  ok(keysOf().includes('p2') && (await p.evaluate(() => __FS.prd_book_metrics.b2.lastCheckedAt)) === lc2 && (await p.evaluate(() => __FS.prd_book_metrics.b2.priceSales)) === 9000, '② 확인 시각이 주기(7일) 안인 책은 운영처럼 안 씀(받음 처리 · 할 일 없음)', { E });
  ok(/우리 상품 연결/.test(E.p3 || '') && /다른 번외 PC/.test(E.p4 || '') && /번호가 다름|번호가 번외/.test(E.p5 || ''), '③ 우리 상품 연결 없는 책 · 다른 번외 PC가 잡은 책 · 운영 도서 기록과 상품 번호가 다른 책은 쓰지 않음', E);
  await p.evaluate(() => db.collection('prd_system').doc('settings').set({ dynamicParts: true }, { merge: true })); await p.evaluate(() => db.collection('prd_book_metrics').doc('b1').set({ lastCheckedAt: new Date(Date.now() - 9 * 864e5).toISOString() }, { merge: true }));
  outNow = [item('p6', 'b1', '111')]; await tick(); await p.waitForTimeout(300); ok(/구매자 분포/.test(errsOf().p6 || ''), '③ 운영 설정 「구매자 분포 함께 읽기」가 켜져 있으면 쓰지 않음(번외는 그 길을 안 읽음)', errsOf());
  /* ④ 묶음 보기 */
  await p.evaluate(async () => { const kd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); await db.collection('col2_jday').doc(kd + '_JS-MAIN').set({ d: kd, pc: 'JS-MAIN', kind: 'office', ver: '0.1.46', at: new Date().toISOString(), tasks: { pubset: { name: '📦 묶음', n: 40, same: 40, diff: 0, un: 0, fail: 0, pass: { n: 40, can: true, why: '넘길 수 있음' } } } });
    await db.collection('app_settings').doc('col2_handoff').set({ jobs: { product: { on: false } } }, { merge: true }); });
  const ui = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S.sec.set_c2ho = true; const m = document.createElement('div'); m.id = 'c2hoT4'; document.body.appendChild(m); renderSettings(m); await sl(900); const box = document.getElementById('c2ho_box'); if (!box) return { none: true }; c2HoLoad(true);
    for (let i = 0; i < 30 && !box.querySelector('.c2hobun'); i++) await sl(200); box.querySelectorAll('details.c2hobun').forEach((d) => (d.open = true)); return { t: box.innerText, pub: (box.querySelector('[data-c2hobon="pub"]') || {}).textContent || null }; });
  ok(/상품 화면 묶음/.test(ui.t || '') && /묶음 넘기기 \(1가지\)/.test(ui.pub || '') && /사무실 PC 한 대/.test(ui.t || ''), "④ 📘 묶음: 📦 상품 화면 묶음 = '넘길 수 있음'(JS-MAIN) · 사무실 PC 한 대(약속 0)", { pub: ui.pub, t: (ui.t || '').slice(0, 500) });
  ok(/정가 × 45% × 품질/.test(ui.t || '') && /쿠키 없이도 같은 답/.test(ui.t || '') && !/아직 시험 안 함/.test(ui.t || ''), '④ 🟧 R21 추천 판매가 까닭 = 정가 × 45% × 품질(최상 100 · 상 90 · 중 80) · 쿠키 없이도 같은 답', (ui.t || '').match(/R21[^\n]*/));
  console.log(bad ? `✗ tHANDOFF4_1112 실패 ${bad}` : '✓ tHANDOFF4_1112 모두 통과');
}, {});
