// tADAPT4_1111 — 11/11 adapt4: 🧬 수집 적응 엔진 4회차(약속 0·55 · 연구 N10)
//   ① SP 묶음 4판: 한 검색어에 여러 책 번호(ISBN·K… 표지 코드 · 띄어쓰기 = '또는' — 11/11 진단 blt로 확인) · 지은이 묶음 · 길마다 쪽당 성적 · 잘린 쪽은 못 맞춤으로 안 셈 · SP 다시 읽기 간격 7~28일
//   ② 목록 줄 ISBN 잇기 재료 넓힘: 같은 표지 이름의 벤치마킹 상품 ISBN · ISBN 검색 한 줄 규칙 · 견본 상품 화면 기억 · 하루 몇 권 상품 화면
//   ③ '중고 화면 구조 바뀜' 헛 경고: 지문 견줌은 양쪽이 모두 시험한 조각만
//   ④ 예스24 견본 0권: 검색이 첫 화면으로 넘겨지면 클라우드 브라우저로 그려 읽기
//   ⑤ 편집자 추천 값·ISBN: 표지 ISBN · 여러 번호 한 검색어로 값 채움
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tADAPT4_1111.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const D = (h) => new JSDOM(h).window.document;
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[국내도서]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a></li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au}@1">${b.au}</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2">${b.pub}</a> | 2020년 10월</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인)</li><li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div></td>
  <td><div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.cov}">장바구니</a></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><body><form>${L.map(box).join('')}</form></body></html>`;

(async () => {
  console.log('① SP 묶음 4판 — 여러 번호 한 검색어');
  const its = []; for (let i = 0; i < 25; i++) its.push({ id: 'i' + i, coverKey: A.isbn10to13 ? null : null });
  const isb = ['9788998209032', '9788937460449', '9791155551752', '9788956251677', '9788947544924', '9791125970491', '9791129335418', '9788937460173', '9788990148063', '9791165343729', '9788960970113', '9788956055367', '9788934961598', '9788937832192'];
  const items = isb.map((x, i) => ({ id: 'a' + i, isbn: i % 2 ? x : null, coverKey: i % 2 ? null : x })).concat([{ id: 'dup', isbn: isb[0] }, { id: 'k1', coverKey: 'k182831159' }, { id: 't1', title: '없는 시험 책', author: '가가' }, { id: 't2', title: '다른 시험 책', author: '가가' }, { id: 't3', title: '혼자 시험 책', author: '나나' }]);
  const P3 = A.spBatchPlan3(items, { k: 12 });
  const M = P3.filter((g) => g.field === 'Multi'); ok(M.length === 2 && M[0].keys.length === 12 && M[1].keys.length === 3 && M[0].q.split(' ').length === 12, 'ISBN·표지 ISBN·K… 코드 15개 → 12개 + 3개 두 쪽(띄어쓰기로 이은 검색어)', M.map((g) => g.keys.length));
  ok(M.flatMap((g) => g.keys).includes('K182831159') && M[0].ids.includes('dup') && M[0].ids.includes('a0'), 'K… 표지 코드도 묶음에(11/11 진단: K 코드 검색으로 그 책이 나옴) · 같은 ISBN 상품 둘은 한 번호', M[0]);
  const au = P3.find((g) => g.field === 'Author'); ok(au && au.q === '가가' && au.ids.join() === 't1,t2' && P3.filter((g) => g.field === 'Title').length === 1 && P3[0].field === 'Multi', '표지 없는 상품: 같은 지은이 2권은 지은이 한 쪽 · 혼자는 제목 · 여러 번호 묶음 먼저', P3.map((g) => [g.field, g.ids.length]));
  const P3b = A.spBatchPlan3(items, { k: 12, yield: { Author: [20, 4], Title: [20, 18], author: [20, 4], title: [20, 18] } }); ok(!P3b.some((g) => g.field === 'Author') && P3b.filter((g) => g.field === 'Title').length === 3, '지은이 묶음 성적(쪽당 0.2)이 제목 검색(0.9)보다 나쁘면 지은이 묶음을 안 씀(배운 성적)', P3b.map((g) => g.field));
  const P3c = A.spBatchPlan3(items, { k: 12, kcode: false }); ok(!P3c.flatMap((g) => g.keys || []).includes('K182831159'), 'K 코드 묶음은 끌 수 있음(adapt_cfg.spBatch.kcode=false)');
  ok(A.spMultiLearn(12, { n: 12, hit: 9, miss: 3, full: true, rows: 50, cap: 50 }) === 10 && A.spMultiLearn(12, { n: 12, hit: 12, miss: 0, full: false, rows: 20, cap: 50, kMax: 24 }) === 14 && A.spMultiLearn(4, { n: 4, hit: 1, miss: 3, full: true, rows: 25, cap: 25 }) === 4 && A.spMultiLearn(24, { n: 24, hit: 24, miss: 0, full: false, rows: 10, cap: 50, kMax: 24 }) === 24 && A.spMultiLearn(24, { n: 24, hit: 10, miss: 14, full: false, rows: 10, cap: 25 }) === 12, '한 쪽 번호 수 k 배움: 꽉 찬 쪽에서 못 찾으면 줄이고(4까지) · 넉넉하면 늘림(kMax까지 · adapt5 기본 12)');
  ok(A.spKeepDays(null, 120, 7) === 7 && A.spKeepDays(120, 125, 7) === 14 && A.spKeepDays(120, 126, 14) === 28 && A.spKeepDays(5, 7, 28) === 28 && A.spKeepDays(100, 125, 14) === 14 && A.spKeepDays(100, 200, 28) === 7 && A.spKeepDays(4000, 4010, 14) === 7, 'SP 다시 읽기 간격: 처음 7일 · 10% 안 그대로면 두 배(28일까지) · 30% 넘게 바뀌면 7일 · 3천 넘는 책은 늘 7일');
  ok(A.spKeepPerH(Array(7 * 24).fill({ every: 7 })) === 1 && A.spKeepPerH(Array(28 * 24).fill({ every: 28 })) === 1, '유지 비용 셈(시간당 다시 읽을 권수)');

  console.log('  spBatchTick 4판 한 회차(가짜 저장소·화면)');
  const store = {}; const sets = []; const mkDoc = (id, v) => ({ id, ref: { id }, data: () => v });
  const BI = [mkDoc('s1_1', { sc: '1', coverKey: '8998209039', title: '초보 시험 교실' }), mkDoc('s1_2', { sc: '1', coverKey: '8937460440', title: '시험의 맛', sp: 4000, spAt: '2026-10-01T00:00:00Z', spEvery: 7 }), mkDoc('s2_1', { sc: '2', coverKey: 'K182831159', title: '케이 시험' }), mkDoc('s2_2', { sc: '2', coverKey: '8937460580', title: '없는 책' }),
    mkDoc('s2_3', { sc: '2', coverKey: '8937460173', title: '오래 그대로', sp: 30, spAt: new Date(Date.now() - 10 * 864e5).toISOString(), spEvery: 14, isbn: '9788937460179', publisher: 'p', author: 'a', pubYm: '2020-01', priceList: 1 })];
  const C2 = (name) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[name + '/' + id], data: () => store[name + '/' + id] }), set: async (v) => { store[name + '/' + id] = { ...(store[name + '/' + id] || {}), ...v }; } }), where: (k, op, v) => ({ select: () => ({ limit: () => ({ get: async () => ({ docs: name === 'bench_items' ? BI.filter((d) => d.data().sc === v) : [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }) }) });
  store['app_settings/bench'] = { targets: [{ sc: '1' }, { sc: '2' }] }; store['app_settings/adapt_cfg'] = { spBatchHist: [{ day: 'x', list: 40, noMatch: 2 }] };
  const db = { batch: () => ({ set: (ref, v) => sets.push([ref.id, v]), commit: async () => {} }), getAll: async () => [] };
  const page = listPage([{ id: '2000001', cov: '8998209039', title: '초보 시험 교실', pl: 18000, ps: 16200, sp: 270, pub: '골프출판', au: '가가' }, { id: '2000002', cov: '8937460440', title: '시험의 맛', pl: 12000, ps: 10800, sp: 4210, pub: '민음시험', au: '나나' }, { id: '2000003', cov: 'k182831159', title: '케이 시험', pl: 9000, ps: 8100, sp: 77, pub: '케이출판', au: '다다' }]);
  const urls = []; const pg = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async (u) => { urls.push(u); return { ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => page }; }; try { return await fn(...a); } finally { global.fetch = sv; } } };
  global.window = { ReadnowAdapt: A }; global.DOMParser = new JSDOM('<html></html>').window.DOMParser;
  const mk = new Function('A', 'C', 'db', 'getPage', 'jsleep', 'nowIso', 'kDay', 'W', 'ADC', 'adaptMod', cut(CSRC, 'let spBatchNextAt = 0;', '\n/* (정범님 11/11 밤 ②') + '\nreturn spBatchTick;');
  const tick = mk(A, C2, db, async () => pg, async () => {}, () => '2026-11-11T10:00:00Z', () => '2026-11-11', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A);
  const r = await tick({ force: true });
  ok(r.v === 4 && r.q === 1 && r.qMulti === 1 && r.list === 3 && r.perPage === 3 && r.noMatch === 1, '번호 4개(ISBN 표지 셋·K 코드 하나)를 한 쪽으로 · 3권 맞춤 · 없는 책 1(쪽이 안 찼으니 못 맞춤)', { v: r.v, q: r.q, list: r.list, noMatch: r.noMatch, how: r.how });
  ok(/SearchWord=9788998209032%209788937460449%20K182831159%209788937460586&/.test(urls[0] || '') && /ViewRowsCount=50/.test(urls[0] || '') && /SearchTarget=All/.test(urls[0] || ''), '검색 주소 = 번호를 띄어쓰기로 이음 · 50줄 쪽 · 모든 갈래', urls[0]);
  const w = Object.fromEntries(sets.map(([id, v]) => [id, v])); ok(w.s1_1.sp === 270 && w.s1_1.spEvery === 7 && w.s1_2.sp === 4210 && w.s1_2.spEvery === 7 && w.s1_2.spPrev === 4000 && w.s2_1.sp === 77 && w.s2_1.newId === '2000003', 'SP·다시 읽기 간격(처음 7일 · 3천 넘는 책 7일)·전 SP를 남김 · K 코드 상품도 맞춤', w);
  ok(!BI[4].data().sp || !sets.some(([id]) => id === 's2_3'), '간격 14일인 책(10일 전 읽음)은 아직 안 읽음(7일마다 모두 읽던 것)', sets.filter(([id]) => id === 's2_3'));
  ok(r.plan && r.plan.multi === 1 && r.learn && r.learn.k >= 12 && r.learn.y.Multi[0] === 1 && r.learn.y.Multi[1] === 3 && r.etaH4 != null && r.keepPerH4 != null && store['app_settings/adapt_cfg'].spBatchLearn.k === r.learn.k, '배운 것(k·쪽 크기·길마다 쪽당 성적) 저장 · 남은 시간(etaH4)·유지 비용(keepPerH4)', { plan: r.plan, learn: r.learn, etaH4: r.etaH4, keep: r.keepPerH4 });
  /* 꽉 찬 쪽: 못 맞춘 번호는 다음 회차로(못 맞춤으로 안 셈) */
  const big = listPage(Array.from({ length: 50 }, (_, i) => ({ id: '30000' + i, cov: 'x' + i + 'zzzzzzz', title: '딴 책 ' + i, pl: 1000, ps: 900, sp: 1, pub: 'p', au: 'a' })));
  const pg2 = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async () => ({ ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => big }); try { return await fn(...a); } finally { global.fetch = sv; } } };
  sets.length = 0; store['app_settings/adapt_cfg'].spBatchLearn = { k: 12, cap: 50, y: {} }; const tick2 = mk(A, C2, db, async () => pg2, async () => {}, () => '2026-11-11T11:00:00Z', () => '2026-11-11', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A);
  const r2 = await tick2({ force: true }); ok(r2.multiFull === 1 && r2.noMatch === 0 && !sets.some(([, v]) => v.listTryAt) && r2.learn.k === 10, '50줄 꽉 찬 쪽에서 못 찾은 번호 = 잘렸을 수 있음 → 7일 쉼 없이 다음 회차 · k 12 → 10', { full: r2.multiFull, noMatch: r2.noMatch, k: r2.learn && r2.learn.k });

  console.log('② 목록 줄 ISBN 잇기 재료');
  const fake = { cover: { K242131684: '9791190000017' } };
  const Cf = (name) => ({ doc: () => ({ get: async () => ({ data: () => ({}) }) }), where: (k, op, v) => ({ select: () => ({ limit: () => ({ get: async () => ({ docs: name === 'bench_items' && k === 'coverKey' ? v.filter((x) => fake.cover[x]).map((x) => ({ data: () => ({ coverKey: x, isbn: fake.cover[x] }) })) : [] }) }), get: async () => ({ docs: [] }) }) }) });
  const IF = new Function('C', 'nowIso', cut(CSRC, 'const IDM = { m: new Map()', '/* (adapt3 11/11) 🏋 훈련 화면') + '\nreturn { isbnFill, idmapPut, IDM, adaptIsbnEnrich };')(Cf, () => 'x');
  const rows = [{ itemId: '1', coverKey: 'k242131684' }, { itemId: '2', coverKey: 'k000000001' }]; const fr = await IF.isbnFill(rows);
  ok(fr.cover === 1 && rows[0].isbn13 === '9791190000017' && IF.IDM.m.get('1') === '9791190000017' && !rows[1].isbn13, '같은 표지 이름(대소문자 무관)의 벤치마킹 상품 ISBN으로 잇기(새 요청 0) · 기억에도 남김', fr);
  const pgE = { evaluate: async (fn, ids) => ({ [ids[0]]: '9791190000024' }) }; const er = await IF.adaptIsbnEnrich(pgE, rows, 8); ok(er.n === 1 && er.got === 1 && rows[1].isbn13 === '9791190000024' && rows[1].isbnSrc === 'page' && IF.IDM.m.get('2') === '9791190000024', '그래도 없는 줄은 하루 몇 권만 공개 상품 화면(다음 날부터 기억으로)', er);
  ok(/const C1 = \(await ADC\(\)\.get\(\)\)\.data\(\) \|\| \{\}; const mx = C1\.isbnEnrich == null \? (12|20) : \+C1\.isbnEnrich/.test(CSRC) && /idmapPut\(r\.prod\.id, r\.prod\.ex\.values\.isbn13\)/.test(CSRC), '매일 점검: 견본 상품 화면 기억 · 하루 12권(adapt_cfg.isbnEnrich · 0이면 끔)');
  const ali = cut(CSRC, 'async function alListItem(p, isbn)', '\n/* ◆adapt 끝 */'); ok(/nw\.length === 1 && !nw\[0\]\.isbn13/.test(ali) && /idmapPut\(x\.itemId, isbn\)/.test(ali), 'ISBN으로 찾은 새책 줄이 딱 하나면 그 책(K… 책도 목록 한 쪽으로 끝 · 번호→ISBN 기억)');

  console.log('③ 지문 견줌 — 엔진 판이 바뀐 날 헛 경고');
  const prev = { sig: 'a', marks: { '.Ere_usedsell_list2': 1, '.Ere_usedsell_table tr': 21, '.Ere_usedsell_table .price': 20 }, cls: ['x', 'y'], ld: 1 }; const cur = { sig: 'b', marks: { '.Ere_usedsell_list2': 1, '.Ere_usedsell_table tr': 21, '.Ere_prod_Binfowrap_used2 .info_list li': 5 }, cls: ['x', 'y'], ld: 1 };
  const fc = A.fpCompare(prev, cur); ok(fc.changed === false && fc.lost.length === 0 && fc.untested.length === 2, "공용 파일이 시험 조각을 바꿨을 뿐(클래스 겹침 1)이면 '바뀜' 아님 — 11/11 al_used 경고의 실체", fc);
  const fc2 = A.fpCompare(prev, { ...cur, marks: { ...cur.marks, '.Ere_usedsell_table tr': 0 } }); ok(fc2.changed === true && fc2.lost.join() === '.Ere_usedsell_table tr', '양쪽이 다 시험한 조각이 사라지면 그대로 경고', fc2);

  console.log('④ 예스24 견본 · ⑤ 편집자 추천');
  const y = cut(CSRC, 'async function adaptY24(p, isbn, learned)', '\n/* 하루 한 번 점검'); ok(/cloudRender\('https:\/\/www\.yes24\.com\/product\/search/.test(y) && /via = 'render'/.test(y) && /why: lst && lst\.main/.test(y) && /errs\.push\('예스24 ' \+ isbn/.test(CSRC), '예스24 검색이 첫 화면으로 넘겨지면 클라우드 브라우저로 그려 읽음 · 그래도 없으면 까닭을 오류 칸에(0권이 조용히 지나가던 것)');
  const ed = cut(CSRC, 'async function adaptListRead(p, type, o)', '\n/* ② TTB 대체 견줌'); ok(/A\.coverIsbn\(r\.coverKey\)\) \{ r\.isbn13 = A\.coverIsbn/.test(ed) && /SearchTarget=All&SearchWord=' \+ encodeURIComponent\(q\) \+ '&ViewRowsCount=50'/.test(ed) && /multiQ, multiHit/.test(ed), '편집자 추천: 표지 ISBN · 여러 번호 한 검색어 한 쪽에 12권 값·SP·지은이 · 남은 것만 상품 화면');
  ok(A.kCode('k182831159') === 'K182831159' && A.kCode('8998209039') === null && A.idKeyOf({ coverKey: '8998209039' }) === '9788998209032', 'K 코드 꼴 · 번호 고르기');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
