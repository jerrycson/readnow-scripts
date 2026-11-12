// tSOLDFILL1112 — 11/12 soldfill: 🏷 팔린(사라진) 상품도 빈 정보 채우기 · 두 번 팔림 이력(goneHist) · 첫 회차 뒤 '새로 올라옴' 표시(firstMiss)
//   ① 클라우드 빈 정보 메우기(spBatchTick)가 최근 90일 안에 팔린 상품도 넣음 — ISBN·출판사·지은이·출간 연월·정가·분류만(SP·새 책 값·재고는 안 씀) · 검색 차례는 판매 중 상품 뒤 · 한 쪽씩(커서)
//   ② 수집기 사라짐 기록에 goneHist(arrayUnion) · goneDay 그대로
//   ③ 숍 첫 회차 뒤 2일 안 '새로 올라옴'에 firstMiss(bench_items·bench_days)
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tSOLDFILL1112.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const COL = fs.readFileSync(find(['src/readnow-collector.src.js', 'readnow-collector.src.js']), 'utf8');
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
const i10 = (b9) => { let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +b9[i]; const c = (11 - (s % 11)) % 11; return b9 + (c === 10 ? 'X' : String(c)); };
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[국내도서]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a></li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au}@1">${b.au}</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2">${b.pub}</a> | 2020년 10월</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인)</li><li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div></td>
  <td><div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.cov}">장바구니</a></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><body><form>${L.map(box).join('')}</form></body></html>`;
const dAgo = (n) => new Date(Date.now() + 9 * 3600e3 - n * 864e5).toISOString().slice(0, 10);

async function run(cfgX, seedX) {
  const covs = Array.from({ length: 12 }, (_, i) => i10('89' + String(2000000 + i * 41).padStart(7, '0')));
  const store = {}; const sets = []; const mkDoc = (id, v) => ({ id, ref: { id }, data: () => v, exists: true });
  const BI = [
    ...[0, 1, 2].map((i) => mkDoc('s_' + i, { sc: '1', coverKey: covs[i], title: '판매 중 책 ' + i })),
    mkDoc('s_full', { sc: '1', coverKey: covs[5], title: '다 아는 책', isbn: covs[5], publisher: '형제출판', author: '형제', pubYm: '2019-01', priceList: 12000, cat: '국내도서>소설', sp: 50, spAt: new Date().toISOString() }),
    ...[3, 4].map((i) => mkDoc('g_' + i, { sc: '1', coverKey: covs[i], title: '팔린 책 ' + i, goneDay: dAgo(10 + i) })),
    mkDoc('g_old', { sc: '1', coverKey: covs[6], title: '오래전 팔린 책', goneDay: dAgo(200) }),
    mkDoc('g_cat', { sc: '1', coverKey: covs[7], title: '분류만 빈 책', goneDay: dAgo(5), isbn: covs[7], publisher: 'p', author: 'a', pubYm: '2020-10', priceList: 9000, newId: '777' }),
    mkDoc('g_sib', { sc: '1', coverKey: covs[5], title: '형제와 같은 팔린 책', goneDay: dAgo(3) }),
    mkDoc('g_other', { sc: '9', coverKey: covs[8], title: '대상 아닌 판매자', goneDay: dAgo(3) }),
    ...(seedX || []).map(([id, v]) => mkDoc(id, v)),
  ];
  const byId = new Map(BI.map((d) => [d.id, d]));
  const qObj = (filt, sorted) => { const o = { _f: filt, _after: null, _lim: 1e9 }; o.orderBy = () => o; o.startAfter = (snap) => { o._after = snap.id; return o; }; o.select = () => o; o.limit = (n) => { o._lim = n; return o; };
    o.get = async () => { let L = BI.filter(o._f); if (sorted) L = L.slice().sort((a, b) => String(a.data().goneDay).localeCompare(String(b.data().goneDay)) || a.id.localeCompare(b.id)); if (o._after) { const k = L.findIndex((d) => d.id === o._after); L = L.slice(k + 1); } L = L.slice(0, o._lim); return { docs: L, empty: !L.length }; }; return o; };
  const C2 = (name) => ({ doc: (id) => ({ id, get: async () => (name === 'bench_items' && byId.has(id) ? byId.get(id) : { id, exists: !!store[name + '/' + id], data: () => store[name + '/' + id] }), set: async (v) => { store[name + '/' + id] = { ...(store[name + '/' + id] || {}), ...v }; } }),
    where: (k, op, v) => name !== 'bench_items' ? { select: () => ({ limit: () => ({ get: async () => ({ docs: [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }) }
      : k === 'goneDay' ? qObj((d) => d.data().goneDay && d.data().goneDay >= v, true) : qObj((d) => d.data()[k] === v, false) });
  store['app_settings/bench'] = { targets: [{ sc: '1' }] }; store['app_settings/adapt_cfg'] = { spBatchHist: [{ day: 'x', list: 40, noMatch: 2 }], spBatchLearn: { k: 12, cap: 25, y: {} }, ...(cfgX || {}) };
  store['bench_books/777'] = { cat: '국내도서>인문', isbn: covs[7], pubYm: '2020-10' };
  const db = { batch: () => ({ set: (ref, v) => sets.push([ref.id, v]), commit: async () => {} }), getAll: async (...refs) => refs.filter((r) => r && r.get).map((r) => ({ exists: !!store['bench_books/' + r.id], data: () => store['bench_books/' + r.id] })) };
  const byKey = new Map(covs.map((c, i) => [A.coverIsbn(c), { id: String(4000000 + i), cov: c, title: (i >= 3 && i <= 4 ? '팔린 책 ' : '판매 중 책 ') + i, pl: 10000, ps: 9000, sp: 100 + i, pub: '시험출판', au: '가가' }]));
  const urls = []; const pg = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async (u) => { urls.push(u); const w = decodeURIComponent((u.match(/SearchWord=([^&]*)/) || [])[1] || ''); const L = w.split(' ').map((k) => byKey.get(k)).filter(Boolean); return { ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => listPage(L) }; }; try { return await fn(...a); } finally { global.fetch = sv; } } };
  global.window = { ReadnowAdapt: A }; global.DOMParser = new JSDOM('<html></html>').window.DOMParser;
  const mk = new Function('A', 'C', 'db', 'getPage', 'jsleep', 'nowIso', 'kDay', 'W', 'ADC', 'adaptMod', cut(CSRC, 'let spBatchNextAt = 0;', '\n/* (정범님 11/11 밤 ②') + '\nreturn spBatchTick;');
  const tick = mk(A, C2, db, async () => pg, async () => {}, () => '2026-11-12T10:00:00Z', () => '2026-11-12', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A);
  const r = await tick({ force: true }); const w = {}; for (const [id, v] of sets) w[id] = { ...(w[id] || {}), ...v };
  return { r, w, urls, store, covs };
}

(async () => {
  console.log('① 클라우드 빈 정보 메우기 — 최근 90일 안 팔린 상품');
  const { r, w, urls, store, covs } = await run();
  ok(r.gone === 4 && !r.goneErr, '팔린 상품 후보 4개(90일 안 · 대상 판매자 · 빈 칸 있음) — 200일 전·다른 판매자는 뺌', { gone: r.gone, err: r.goneErr });
  ok(w.g_3 && w.g_3.isbn && w.g_3.publisher === '시험출판' && w.g_3.author && w.g_3.pubYm && w.g_3.priceList === 10000 && w.g_4 && w.g_4.isbn, '팔린 상품에 ISBN·출판사·지은이·출간 연월·정가가 채워짐', { g3: w.g_3, g4: w.g_4 });
  ok(['g_3', 'g_4', 'g_sib', 'g_cat'].every((k) => !w[k] || (w[k].sp == null && w[k].spAt == null && w[k].newPs == null && w[k].newStock == null && w[k].ebookPs == null)), '팔린 상품엔 시세(SP·새 책 값·재고·전자책 값)를 쓰지 않음', { g3: w.g_3 });
  ok(w.s_0 && w.s_0.sp === 100 && w.s_0.newPs === 9000, '판매 중 상품은 예전 그대로(SP·새 책 값 채움)', w.s_0);
  ok(!w.g_old && !w.g_other, '90일 넘은 팔린 상품·대상 아닌 판매자 상품은 건드리지 않음');
  ok(w.g_sib && w.g_sib.publisher === '형제출판' && w.g_sib.cat === '국내도서>소설' && w.g_sib.catSrc === 'sib' && w.g_sib.sp == null, '같은 표지 형제(판매 중 상품)의 정보·분류를 새 요청 없이 맞댐(SP는 빼고)', w.g_sib);
  ok(w.g_cat && w.g_cat.cat === '국내도서>인문' && w.g_cat.catSrc === 'bb' && !urls.some((u) => decodeURIComponent(u).includes(A.coverIsbn(covs[7]))), '분류만 빈 팔린 상품은 수집기가 읽어 둔 상품 페이지 정보(bench_books)에서 분류 · 검색하지 않음', w.g_cat);
  const has = (u, i) => decodeURIComponent(u).includes(A.coverIsbn(covs[i]));
  { const sIdx = urls.findIndex((u) => [0, 1, 2].some((i) => has(u, i))), gIdx = urls.findIndex((u) => [3, 4].some((i) => has(u, i)));
    ok(gIdx === 0 && sIdx > gIdx && r.goneShare === 0.2 && r.goneQ0 === 1 && r.qGone >= 1 && store['app_settings/adapt_cfg'].spBatchHist.slice(-1)[0].qGone === r.qGone, '팔린 상품 몫(기본 20% · 올림 · 최소 1쪽)이 먼저 — 후보 계획이 1쪽뿐이라 남는 몫은 판매 중 상품이 씀', { sIdx, gIdx, share: r.goneShare, q0: r.goneQ0, qGone: r.qGone, maxQ: r.maxQ, q: r.q }); }
  { const R0 = await run({ spBatch: { goneShare: 0 } }); const sIdx = R0.urls.findIndex((u) => [0, 1, 2].some((i) => has(u, i))), gIdx = R0.urls.findIndex((u) => [3, 4].some((i) => has(u, i)));
    ok(sIdx >= 0 && gIdx >= 0 && sIdx < gIdx && R0.r.goneQ0 === 0, 'goneShare 0 = 예전 동작(판매 중 상품 쪽이 먼저, 팔린 상품은 뒤)', { sIdx, gIdx, q0: R0.r.goneQ0 }); }
  { const R1 = await run({ spBatch: { maxQ: 1 } }); ok(R1.r.q === 1 && R1.r.qGone === 1 && R1.w.g_3 && R1.w.g_3.isbn && !(R1.w.s_0 && R1.w.s_0.sp != null), '쪽 수 1이어도 팔린 상품 몫 최소 1쪽(올림)', { q: R1.r.q, qGone: R1.r.qGone }); }
  ok(r.goneFill >= 3 && r.goneCat === 2 && store['app_settings/adapt_cfg'].spBatchHist.slice(-1)[0].goneFill === r.goneFill, '셈: 팔린 상품 채움 수(goneFill)·분류 채움(goneCat)이 회차 결과와 하루 합에 남음', { goneFill: r.goneFill, goneCat: r.goneCat });
  const cur = store['app_settings/adapt_cfg'].spBatchGone; ok(cur && cur.lastId === null && cur.scan === 5 && cur.rounds === 1, '한 쪽 다 읽으면 다음은 처음부터(커서 비움 · 한 바퀴 셈)', cur);
  { const R2 = await run({ spBatch: { goneMax: 2 } }); const c2 = R2.store['app_settings/adapt_cfg'].spBatchGone; ok(R2.r.goneScan === 2 && c2.lastId && c2.rounds === 0, '메모리 가볍게: 회차마다 goneMax(여기선 2)개만 읽고 다음 자리를 남김', c2);
    const R3 = await run({ spBatch: { goneMax: 2 }, spBatchGone: { lastId: c2.lastId } }); ok(R3.r.goneScan === 2 && R3.store['app_settings/adapt_cfg'].spBatchGone.lastId !== c2.lastId, '다음 회차는 남긴 자리 뒤부터', R3.store['app_settings/adapt_cfg'].spBatchGone); }
  { const T5 = Array.from({ length: 3 }, (_, i) => ['g_t' + i, { sc: '1', title: '제목만 팔린 책 ' + i, goneDay: dAgo(20 + i) }]);
    const R6 = await run({ spBatch: { maxQ: 1, goneHold: 0 }, spBatchGone: { lastId: null, rounds: 2 } }, T5); const c6 = R6.store['app_settings/adapt_cfg'].spBatchGone;
    ok(R6.r.qGone === 1 && c6.stay === true && c6.rem >= 1 && c6.lastId === null && c6.stayN === 1 && c6.rounds === 2, '쪽에 못 찾은 팔린 상품이 남으면(goneHold 넘음) 다음 회차도 같은 쪽 — 쪽마다 몫만큼만 찾고 넘어가던 것', c6);
    const R7 = await run({ spBatch: { maxQ: 1, goneHold: 0, goneStayMax: 3 }, spBatchGone: { lastId: null, stayN: 3 } }, T5); ok(R7.store['app_settings/adapt_cfg'].spBatchGone.stay === false, '같은 쪽에 goneStayMax 회차 넘게 머물면 그래도 넘김(못 찾는 상품에 묶이지 않게)', R7.store['app_settings/adapt_cfg'].spBatchGone);
    const R8 = await run({ spBatch: { maxQ: 1, goneShare: 0, goneHold: 0 } }, T5); ok(R8.store['app_settings/adapt_cfg'].spBatchGone.stay === false, '팔린 상품 검색을 한 쪽도 못 한 회차(몫 0)는 머물지 않고 넘김', R8.store['app_settings/adapt_cfg'].spBatchGone); }
  { const R4 = await run({ spBatch: { gone: false } }); ok(R4.r.gone === 0 && !R4.w.g_3 && R4.w.s_0 && R4.w.s_0.sp === 100, '끄기 adapt_cfg.spBatch.gone = false → 팔린 상품 넣지 않음(판매 중은 그대로)', R4.r.gone); }
  { const R5 = await run(null, [['g_tried', { sc: '1', coverKey: 'K000000001', title: '7일 쉬는 팔린 책', goneDay: dAgo(4), listTryAt: new Date(Date.now() - 864e5).toISOString(), listTryV: 5 }]]); ok(!R5.urls.some((u) => /K000000001/.test(u)), '팔린 상품도 못 찾은 것은 7일 쉼(listTryAt) — 날마다 같은 검색 되풀이 없음'); }

  ok(/if \(q\.soldfill\) \{/.test(CSRC) && /out\.soldfill = \{ sc, days/.test(CSRC), '진단 soldfill=<판매자 번호> — 팔린 상품 칸마다 채운 수(값은 안 보냄)');
  ok(/if \(q\.reset === 'gone'\) \{[\s\S]{0,200}spBatchGone: \{ lastId: null, resetAt: nowIso\(\), resetFrom:/.test(CSRC), '진단 reset=gone — 팔린 상품 읽는 자리만 비움(옛 자리는 resetFrom에)');
  console.log('② 두 번 팔린 상품 — goneHist');
  const gl = cut(COL, 'for (const x of gone) { B.set(C(\'bench_items\')', '\n');
  ok(/goneDay: ymd\(x\.missDay\)/.test(gl) && /goneHist: AU\(\{ d: ymd\(x\.missDay\), c: day/.test(gl), '사라질 때마다 goneHist에 쌓음(arrayUnion) · goneDay는 예전처럼 마지막 날');
  ok(/const AU = firebase\.firestore\.FieldValue\.arrayUnion;[\s\S]{0,4000}goneHist: AU/.test(COL), 'AU를 정한 뒤에 씀');

  console.log("③ 첫 회차 뒤 2일 안 '새로 올라옴' — firstMiss");
  const fm = cut(COL, 'const FM = ', ';\n').slice('const FM = '.length); const FMf = (base, startDay, day) => new Function('base', 'st', 'day', 'return ' + fm)(base, { startDay }, day);
  ok(FMf(false, '2026-11-10', '2026-11-12') === true && FMf(false, '2026-11-10', '2026-11-11') === true && FMf(false, '2026-11-10', '2026-11-13') === false && FMf(true, '2026-11-12', '2026-11-12') === false && FMf(false, undefined, '2026-11-12') === false, '첫 회차 날(startDay) 뒤 2일 안만 표시 · 첫 회차 자체·startDay 없는 옛 숍은 표시 안 함');
  ok(/base, \.\.\.\(FM \? \{ firstMiss: true \} : \{\}\)/.test(COL) && /\.\.\.\(FM \? \{ firstMiss: true, addFirstMiss: add\.length \} : \{\}\)/.test(COL), '새로 올라온 상품 기록(bench_items)·회차 요약(bench_days)에 firstMiss · 지우지 않음');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
