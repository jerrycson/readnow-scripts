// tADAPT3_1111 — 11/11 adapt3: 🧬 수집 적응 엔진 3회차(약속 0·55 · 연구 N10)
//   ① 중고 화면 86점: 중고 최저가 = 요약 칸 최저(두 길) · 중고 줄 수 두 번째 길(sell_tableCF2)
//   ② 목록 화면 86점: 지은이·출판사·출간 연월·재고·중고 표시 두 번째 길 · 제목 문맥 길(다른 판·전자책 링크 글을 안 집음) · 목록 줄 ISBN 잇기(K… 책)
//   ③ 편집자 추천: 꺾쇠 뗌 · 하위 분야 첫 화면들에서 모음 · 값·저자 채움(enrich)
//   ④ TTB 견줌 기준: 지은이 공저 포함이면 같음 · TTB SP 0은 견줌에서 뺌
//   ⑤ SP 묶음 3판: 같은 ISBN 한 묶음 · 형제 맞대기 · 회차 상한 저절로 · 묶음 덤 · 남은 시간
//   ⑥ 예스24 검색 목록 같은 틀(y24_list) · 🏋 훈련 화면(drill · drillList) — 일부러 바꾼 화면에서 지킴·고침
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tADAPT3_1111.js · 지어낸 값만(실제 화면의 '모양'만 흉내 · 손님 정보 없음)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js'])); const P = require(find(['readnow-products-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8'); const ASRC = fs.readFileSync(find(['readnow-adapt-core.js']), 'utf8');
const D = (h) => new JSDOM(h).window.document;
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
/* 지어낸 전체 중고 화면(지금 알라딘 모양: 탭 · 요약 칸 · 줄 표) */
const usedPage = (o) => `<html><body><div class="Ere_usedsell_list2"><a>전체 중고 (${o.total})</a><a>판매자 중고 (${o.total - 2})</a><a>우주점 (2)</a></div>
  <div class="Ere_prod_Binfowrap_used2"><ul class="info_list"><li><div class="Litem">알라딘 직접배송(0)</div><div class="Ritem">-</div></li><li><div class="Litem">광활한 우주점(2)</div><div class="Ritem">${fmt(o.space)}원</div></li><li><div class="Litem">판매자 중고(${o.total - 2})</div><div class="Ritem">${fmt(o.min)}원</div></li></ul><div>정가 ${fmt(o.pl)}원</div></div>
  <table class="Ere_usedsell_table">${o.rows.map((p, i) => `<tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=9${o.k}${i}">책</a></td><td class="seller"><a href="/shop/usedshop/wshopitem.aspx?SC=1${i}">가게</a></td><td><ul class="price"><li><span class="Ere_fs20">${fmt(p)}</span>원</li><li>배송비 : 3,000원</li></ul></td></tr>`).join('')}</table></body></html>`;
/* 지어낸 목록 화면 — tADAPT2와 같은 실제 '모양' + 다른 판 링크 · 품절 줄 */
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td>${b.cart ? `<input name="chkCart.${b.cart}" type="checkbox">` : ''}</td><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[${b.kind || '국내도서'}]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a><span class="ss_f_g2"> - 부제</span>${b.other ? ` <a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.other}">${b.title} (리커버 한정판 특별 에디션 세트)</a>` : ''}</li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au}@1&amp;BranchType=1">${b.au}</a> (지은이), <a href="/Search/wSearchResult.aspx?AuthorSearch=x@1">옮긴이가</a> (옮긴이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2&amp;BranchType=1">${b.pub}</a> | 2026년 10월</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인), 마일리지 <span class="ss_p">900</span>원</li>${b.soldout ? '<li><span class="ss_p4">품절</span></li>' : ''}<li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div>
  <div class="ss_book_list"><ul>${b.eb ? `<li><span class="ebook_price">이 책의 전자책 : <em>${fmt(b.eb)}</em>원</span> <a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}9" title="보러 가기" class="view_blue_btn">보러 가기</a></li>` : ''}</ul></div></td>
  <td>${b.soldout ? '' : `<div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.cart || b.cov}">장바구니</a></div>`}<div class="Search3_Result_SafeBasketArea" isbn="${b.cart || b.cov}"></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><head><script src="/js/prototype.js"></script></head><body><form>${L.map(box).join('')}<div class="ss_book_box"></div></form></body></html>`;
const BK = [{ id: '4032163', cov: 'k242131684', title: '가나 시험', pl: 18500, ps: 16650, sp: 299715, eb: 11700, pub: '시험동네', au: '가가 하루', other: '4032999' },
  { id: '329596', cov: 's062934786', cart: '8937460580', title: '싯다 시험', pl: 8000, ps: 7200, sp: 371975, eb: 5040, pub: '민음시험', au: '나나 헤세' },
  { id: '4038457', cov: 'k072131701', title: '가짜 시험 진짜', pl: 25000, ps: 22500, sp: 73290, pub: '글시험', au: '다다', soldout: true },
  { id: '4042591', cov: 'k962131208', title: '세네 시험에게', pl: 18000, ps: 16200, sp: 281210, pub: '논시험', au: '라라 세네카' },
  { id: '4009097', cov: 'k962130440', title: '한국 시험 연구원', pl: 22000, ps: 19800, sp: 165440, eb: 15840, pub: '다이시험', au: '마마' }];
/* 지어낸 상품 화면(tADAPT2와 같은 모양 · JSON-LD 더함) */
const prod = (b) => `<html><head><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><meta property="og:title" content="${b.title}"><script type="application/ld+json">{"@type":"Book","name":"${b.title}","isbn":"${b.isbn}","author":{"name":"가나다"},"publisher":{"name":"시험출판"},"datePublished":"2024-03-05","offers":{"price":${b.ps},"availability":"InStock"}}</script></head><body><div class="Ere_prod_titlewrap"><ul><li><span class="Ere_bo_title">${b.title}</span></li><li class="Ere_sub2_title"><a href="/Search/wSearchResult.aspx?AuthorSearch=가@1">가나다</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=시@2">시험출판</a> | 2024-03-05</li></ul></div>
  <div class="Ere_prod_Binfowrap"><div class="info_list"><ul><li><div class="Litem">정가</div><div class="Ritem"><del>${fmt(b.pl)}원</del></div></li><li><div class="Litem_P">판매가</div><div class="Ritem"><em itemprop="price">${fmt(b.ps)}</em>원 (10%, 할인)</div></li></ul></div></div>
  <div id="wa_product_top1_wa_Top_Ranking_pnlRanking"><div>주간 12위 | <div style="display:inline-block;">Sales Point : <strong>${fmt(b.sp)}</strong></div></div></div><div class="conts_info_list1"><ul><li>300쪽</li><li>ISBN : ${b.isbn}</li></ul></div><ul id="ulCategory"><li><a href="/shop/wbrowse.aspx?CID=${b.cid}">분야</a></li></ul><a class="Ere_sub_pink Ere_fs16">9.${b.r}</a></body></html>`;
const PB = [{ id: '1000001', isbn: '9791155551752', title: '지혜의 시험', pl: 18000, ps: 16200, sp: 1234, cid: 336, r: 2 }, { id: '1000002', isbn: '9788937460449', title: '데미 시험', pl: 8000, ps: 7200, sp: 98765, cid: 50993, r: 4 }, { id: '1000003', isbn: '9788998209032', title: '세 번째 시험책', pl: 15000, ps: 13500, sp: 4321, cid: 1196, r: 6 }];
const loadOld = () => { try { const t = require('child_process').execSync('git -C ' + JSON.stringify(path.dirname(find(['readnow-adapt-core.js']))) + ' show 754efc5:readnow-adapt-core.js', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); const m = { exports: {} }; new Function('module', 'exports', t)(m, m.exports); return m.exports; } catch (e) { return null; } };
(async () => {
  const OLD = loadOld(); if (!OLD) console.log('  (옛 판 754efc5를 못 불러 전후 견줌은 건너뜀)');
  console.log('① 전체 중고 화면');
  const UP = [{ k: 1, total: 37, min: 2500, space: 4100, pl: 18000, rows: [3100, 2800, 4500] }, { k: 2, total: 5, min: 6000, space: 5200, pl: 15000, rows: [7000, 6000] }, { k: 3, total: 12, min: 900, space: 1500, pl: 9000, rows: [1200, 2000, 900, 5000] }];
  const ue = UP.map((o) => A.extract('al_used', D(usedPage(o)))); ok(ue.every((e, i) => e.values.lowest === Math.min(UP[i].min, UP[i].space) && e.fields.lowest.conf === 1), '중고 최저가 = 요약 칸 최저(두 길 같음 · 신뢰도 1) — 첫 쪽 줄 최저와 6권 중 1권만 같아 0.44이던 것', ue.map((e) => [e.values.lowest, e.fields.lowest.conf, e.values.pageLowest]));
  ok(ue.every((e, i) => e.values.rows === UP[i].rows.length && e.fields.rows.conf === 1), "중고 줄 수 두 번째 길(sell_tableCF2 상품 번호) — chkCart 길이 0%라 0.6이던 것", ue.map((e) => [e.values.rows, e.fields.rows.conf]));
  ok(ue[0].values.pageLowest === 2800 && A.KINDS.al_used.fields.pageLowest.opt === true, '첫 쪽 줄 최저는 pageLowest(점수 밖)');
  const HU = A.healthOf(ue, 'al_used'); ok(HU.score >= 0.99, '중고 화면 점수 99점 넘음(11/11 진단 84점)', HU.score); if (OLD) { const HO = OLD.healthOf(UP.map((o) => OLD.extract('al_used', D(usedPage(o)))), 'al_used'); console.log(`    전후(같은 지어낸 화면): 옛 판 ${Math.round(HO.score * 100)}점 → 지금 ${Math.round(HU.score * 100)}점`); }
  ok(A.KINDS.al_used.fields.lowest.paths.every((p) => p.how !== 'sel' || /Binfowrap_used2/.test(String(p.f))), '최저가 선택자 길이 운영 파서 parseUsedPage.mins와 같은 칸');
  const pm = P.parseUsedPage(D(usedPage(UP[0]))).mins; ok(Math.min(...Object.values(pm).filter((x) => x.count > 0).map((x) => x.min)) === ue[0].values.lowest, '운영 파서 요약 칸 최저와 같은 값', pm);

  console.log('② 목록 화면');
  const L = A.extractList(D(listPage(BK)), {}); const HL = A.healthOfList([L]);
  ok(L.rows.length === 5 && L.rows[0].title === '가나 시험' && L.rows[0]._conf.title === 1, "제목 문맥 길이 다른 판 링크 글('… 리커버 한정판 특별 에디션 세트')을 안 집음(신뢰도 0.33이던 것)", L.rows[0]);
  for (const f of ['author', 'publisher', 'pubYm', 'stock', 'used']) ok(L.rows.every((r) => r._conf[f] === 1), `${f} 두 길 같음(신뢰도 0.7 → 1)`, L.rows.map((r) => [r[f], r._conf[f]]));
  ok(L.rows[0].author === '가가 하루' && L.rows[0].publisher === '시험동네' && L.rows[0].pubYm === '2026-10', '지은이 줄 글에서 첫 사람·출판사·날짜(옮긴이 빼고)', L.rows[0]);
  ok(L.rows[2].stock === '품절' && L.rows[2]._conf.stock === 1 && L.rows[0].stock === 'onSale', "품절 줄은 두 길 모두 '품절' · 장바구니 있는 줄은 판매 중");
  const nonIsbn = Object.entries(HL.fields).filter(([k, f]) => !f.opt && k !== 'isbn13'); ok(nonIsbn.every(([, f]) => f.fill === 1 && f.conf === 1), 'ISBN 밖 모든 칸 채움 100% · 신뢰도 1', nonIsbn.filter(([, f]) => f.conf !== 1));
  ok(L.rows[1].isbn13 === '9788937460586' && L.rows[0].isbn13 == null, "옛 책(장바구니 ISBN10)만 화면에 ISBN · K… 책은 화면에 ISBN이 없음(11/11 베스트셀러 16%의 까닭)");
  console.log(`    목록 점수(ISBN 잇기 전): ${Math.round(HL.score * 100)}점` + (OLD ? ` · 옛 판 ${Math.round(OLD.healthOfList([OLD.extractList(D(listPage(BK)), {})]).score * 100)}점` : ''));
  /* ISBN 잇기(클라우드 isbnFill) — 우리 책 기록·벤치마킹 새책 번호·읽은 상품 화면 기억 */
  const fake = { books: { 4032163: '9791190000017', 4042591: '9791190000024' }, bench: { 4009097: '9791190000031' } };
  const Cf = (name) => ({ where: (k, op, v) => ({ select: () => ({ limit: () => ({ get: async () => ({ docs: name === 'bench_items' ? v.filter((x) => fake.bench[x]).map((x) => ({ data: () => ({ newId: x, isbn: fake.bench[x] }) })) : [] }) }), get: async () => ({ docs: name === 'prd_books' ? v.filter((x) => typeof x === 'number' && fake.books[x]).map((x) => ({ data: () => ({ aladinItemId: x, isbn13: fake.books[x] }) })) : [] }) }) }), doc: () => ({ get: async () => ({ data: () => ({ m: { 4038457: '9791190000048' } }) }), set: async () => {} }) });
  const mkFill = new Function('C', 'nowIso', cut(CSRC, 'const IDM = { m: new Map()', '/* (adapt3 11/11) 🏋 훈련 화면') + '\nreturn { isbnFill, idmapPut, IDM };');
  const IF = mkFill(Cf, () => '2026-11-11T00:00:00Z'); const rows2 = L.rows.map((r) => ({ ...r })); const fr = await IF.isbnFill(rows2);
  ok(fr.need === 4 && fr.got === 4 && fr.mem === 1 && fr.books === 2 && fr.bench === 1 && rows2.every((r) => r.isbn13) && rows2[0].isbnSrc === 'map', "K… 책 ISBN을 기억·우리 책 기록(숫자 번호도)·벤치마킹 새책 번호로 채움(새 요청 0)", fr);
  IF.idmapPut('777', '9791190000055'); IF.idmapPut('778', 'K123'); ok(IF.IDM.m.get('777') === '9791190000055' && !IF.IDM.m.has('778'), '상품 화면을 읽을 때마다 번호→ISBN 기억(ISBN 꼴만)');
  ok(/if \(typeof idmapPut === 'function'\) idmapPut\(r\.item\.itemId, r\.item\.isbn13\)/.test(CSRC) && /isbnMap = await isbnFill\(best\.rows\)/.test(CSRC) && /LH\.isbnRaw = isbnRaw/.test(CSRC), '매일 점검: 베스트셀러 줄 ISBN 잇기(잇기 전 채움률도 남김) · alPubItem이 기억');

  console.log('③ 편집자 추천');
  ok(A.bareTitle('<빨강의 시험서>') === '빨강의 시험서' && A.bareTitle('「시험」 달콤') === '시험 달콤' && A.bareTitle('그냥 제목') === '그냥 제목', '제목 꺾쇠·낫표 뗌(11/11 진단 <빨강의 자서전>)');
  const sec = (c, n0) => `<div class="sec_b"><h3>편집자 추천 도서</h3><ul>${[1, 2, 3].map((i) => `<li><a href="/shop/wproduct.aspx?ItemId=${n0 + i}">&lt;추천 ${c}-${i}&gt;</a><br>지은이${i} (지은이) | 출판${i} | 2026년 9월</li>`).join('')}</ul></div>`;
  const hub = (c) => `<html><body><ul class="cate">${[11, 12, 13, 14].map((x) => `<li><a href="/shop/wbrowse.aspx?CID=${x}">분야 ${x}</a></li>`).join('')}</ul>${sec(c, c * 100)}</body></html>`;
  const jd = new JSDOM('<html></html>'); global.DOMParser = jd.window.DOMParser; global.window = { ReadnowProducts: P, ReadnowAdapt: A };
  const fx = {}; global.fetch = async (u) => { const k = Object.keys(fx).sort((a, b) => b.length - a.length).find((x) => String(u).startsWith(x)); return { ok: !!k, status: k ? 200 : 404, url: 'https://www.aladin.co.kr' + u, text: async () => (k ? fx[k] : '') }; };
  const fakeP = { evaluate: async (fn, ...a) => fn(...a) }; const _st = global.setTimeout; global.setTimeout = (f) => _st(f, 0);
  const mkRead = new Function('adaptMod', 'A', cut(CSRC, 'async function adaptListRead(p, type, o)', '\n/* ② TTB 대체 견줌') + '\nreturn adaptListRead;'); const adaptListRead = mkRead(async () => A, A);
  fx['/shop/common/wchoice.aspx'] = '<html><body>알라딘</body></html>'; for (const c of [1, 11, 12, 13, 14]) fx['/shop/wbrowse.aspx?CID=' + c] = hub(c); fx['/shop/wproduct.aspx?ItemId=101'] = prod({ ...PB[0], id: '101' });
  const E = await adaptListRead(fakeP, 'ItemEditorChoice', { page: 1, cid: 1, enrich: 1 }); global.setTimeout = _st;
  ok(E.rows && E.rows.length === 15 && E.sec.subs === 4 && E.sec.subHit === 4, '분야 첫 화면 3권 → 하위 분야 첫 화면 4쪽의 같은 칸을 모아 15권(3권뿐이던 것)', E.sec);
  ok(E.rows.every((r) => !/[<>]/.test(r.title)) && E.rows[0].title === '추천 1-1' && E.rows[0].author === '지은이1', '꺾쇠 없는 제목 · 링크 없는 지은이도 지은이 줄 글에서', E.rows.slice(0, 2));
  ok(E.rows[0].enriched === 1 && E.rows[0].priceSales === 16200 && E.rows[0].salesPoint === 1234 && E.rows[0].isbn13 === '9791155551752' && E.sec.enriched === 1, '값·SP·ISBN은 공개 상품 화면으로 채움(enrich권만 · 진단 기본 5 · 벤치마킹은 look 단계)', E.rows[0]);
  ok(/subMax: q\.sub != null \? \+q\.sub : 6, enrich: q\.enrich != null \? \+q\.enrich : 5/.test(CSRC) && /angle: R\.rows\.filter/.test(CSRC), '진단 blist: 하위 분야·값 채움·꺾쇠 남은 수');

  console.log('④ TTB 견줌 기준');
  const T = A.ttbCompare([{ isbn: '9788937460441', ttb: { title: 'a', authors: '잭 시험 (지은이), 누구 (옮긴이)', salesPoint: 0 }, now: { title: 'a', author: '잭 시험, Andrew Sample', salesPoint: 10 } }, { isbn: '9788937460442', ttb: { title: 'b', authors: '가', salesPoint: 100 }, now: { title: 'b', author: '가', salesPoint: 130 } }, { isbn: '9788937460443', ttb: { title: 'c', authors: '나나', salesPoint: 50 }, now: { title: 'c', author: '다다', salesPoint: 300 } }]);
  ok(T.fields.author.agree === 0.667 && T.fields.author.miss.length === 1 && T.fields.author.miss[0].now === '다다', "지은이: TTB 첫 지은이가 지금 목록(공저 포함)에 있으면 같음('잭 런던' vs '잭 런던, Andrew Sinclair'이 틀림으로 셈하던 것)", T.fields.author);
  ok(T.fields.salesPoint.ttbZero === 1 && T.fields.salesPoint.both === 2 && T.fields.salesPoint.agree === 0.5 && T.fields.salesPoint.ttbFill === 1, 'SP: TTB 0은 견줌에서 뺌(채움률엔 셈) · 남은 것만 일치율', T.fields.salesPoint);
  const T2 = A.ttbCompare([{ isbn: '9780374536794', ttb: { title: 'A Rage for Test (Paperback)', authors: 'Culinary Test of America' }, now: { title: '[POD] A Rage for Test (Paperback)', author: 'The Culinary Test of America' } }]); ok(T2.fields.title.agree === 1 && T2.fields.author.agree === 1, "제목 앞 '[POD]' 꼬리표·지은이 앞 'The'는 같은 책(11/11 ttbcmp 20권 제목 85%·저자 84%의 틀린 예가 이 꼴)", T2.fields);
  ok(A.authorSame('Jack Sample', 'jack sample, x') && !A.authorSame('가가', '나나') && A.authorSame('가', '가'), '지은이 같음 판정(대소문자·띄어쓰기·한 글자)');

  console.log('⑤ SP 묶음 3판');
  const plan = A.spBatchPlan2([{ id: 'a', coverKey: '8998209039' }, { id: 'b', isbn: '9788998209032' }, { id: 'c', coverKey: '8937460440' }, { id: 'd', title: '없는 책' }]);
  ok(plan[0].field === 'ISBN' && plan[0].q === '9788998209032' && plan[0].ids.join() === 'a,b' && plan.filter((g) => g.field === 'ISBN').length === 2, '같은 ISBN(짐작 포함)은 한 묶음 · 여러 상품이 같이 쓰는 ISBN 먼저', plan);
  /* spBatchTick을 가짜 저장소·가짜 화면으로 한 회차 */
  const store = {}; const sets = []; const mkDoc = (id, v) => ({ id, ref: { id }, data: () => v });
  const items = [mkDoc('s1_1', { sc: '1', coverKey: 'K111', sp: 500, spAt: new Date().toISOString(), isbn: '9791190000062', publisher: '형제출판', author: '형', pubYm: '2020-01', priceList: 10000 }), mkDoc('s2_1', { sc: '2', coverKey: 'K111', title: '형제 책' }),
    mkDoc('s2_2', { sc: '2', coverKey: '8998209039', title: '초보 시험 교실' }), mkDoc('s2_3', { sc: '2', coverKey: '8937460440', title: '시험의 맛' })];
  const C2 = (name) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[name + '/' + id], data: () => store[name + '/' + id] }), set: async (v) => { store[name + '/' + id] = { ...(store[name + '/' + id] || {}), ...v }; } }), where: (k, op, v) => ({ select: () => ({ limit: () => ({ get: async () => ({ docs: name === 'bench_items' ? items.filter((d) => d.data().sc === v) : [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }) }) });
  store['app_settings/bench'] = { targets: [{ sc: '1' }, { sc: '2' }] }; store['app_settings/adapt_cfg'] = { spBatchHist: [{ day: 'x', list: 40, noMatch: 2 }] };
  const db = { batch: () => ({ set: (ref, v) => sets.push([ref.id, v]), commit: async () => {} }), getAll: async () => [] };
  const page2 = listPage([{ id: '2000001', cov: '8998209039', cart: '8998209039', title: '초보 시험 교실', pl: 18000, ps: 16200, sp: 270, pub: '골프출판', au: '가가' }, { id: '2000002', cov: '8937460440', cart: '8937460440', title: '시험의 맛', pl: 12000, ps: 10800, sp: 4210, pub: '민음시험', au: '나나' }]);
  const pg = { evaluate: async (fn, ...a) => { const sv = global.fetch; global.fetch = async () => ({ ok: true, status: 200, url: 'https://www.aladin.co.kr/search', text: async () => page2 }); try { return await fn(...a); } finally { global.fetch = sv; } } };
  const mk = new Function('A', 'C', 'db', 'getPage', 'jsleep', 'nowIso', 'kDay', 'W', 'ADC', 'adaptMod', cut(CSRC, 'let spBatchNextAt = 0;', '\n/* (정범님 11/11 밤 ②') + '\nreturn spBatchTick;');
  const tick = mk(A, C2, db, async () => pg, async () => {}, () => '2026-11-11T10:00:00Z', () => '2026-11-11', () => ({}), () => C2('app_settings').doc('adapt_cfg'), async () => A);
  const r = await tick({ force: true });
  ok(r.v === 3 && r.sib === 1 && sets.some(([id, v]) => id === 's2_1' && v.sp === 500 && v.spSrc === 'sib' && v.isbn === '9791190000062'), '형제 맞대기: 같은 표지 이름의 다른 판매자 상품 값(SP·ISBN·출판사)을 새 요청 없이', r);
  ok(r.q === 1 && r.list === 2 && r.bonus === 1 && r.perPage === 2, '한 쪽(ISBN 검색)으로 두 상품 — 묶음 밖 덤 1(묶음 덤 숫자)', { q: r.q, list: r.list, bonus: r.bonus, perPage: r.perPage });
  ok(r.maxQ === 24 && r.rate0 === 0.952 && r.restLeft === 0 && r.etaH === 0 && r.keepPerH != null, '회차 상한·어제 맞춤률·남은 수·남은 시간·유지에 드는 수(시간당)', r);
  const spb = cut(CSRC, 'async function spBatchTick(o)', '\n/* (정범님 11/11 밤 ②'); ok(/left\.length > 3000 && rate0 >= 0\.8\) maxQ = Math\.max\(maxQ, 48\)/.test(spb) && /rate0 < 0\.3\) maxQ = Math\.min\(maxQ, 8\)/.test(spb) && /Date\.now\(\) - tStart > 150e3/.test(spb) && /fastMin/.test(spb), '밀린 수·맞춤률 따라 8~48쪽 · 한 회차 150초 · 빠른 간격 30분(끌 수 있음 auto=false)');

  console.log('⑥ 예스24 검색 목록 같은 틀 · 🏋 훈련 화면');
  const yb = (g) => `<li><div class="itemUnit"><div class="item_img"><a href="https://www.yes24.com/product/goods/${g.no}" class="lnk_img"><img class="lazy" data-original="https://image.yes24.com/goods/${g.no}/L" alt="${g.t}"></a></div><div class="item_info"><div class="info_row info_name"><span class="gd_res">[도서]</span> <a class="gd_name" href="https://www.yes24.com/product/goods/${g.no}">${g.t}</a></div>
    <div class="info_row info_pubGrp"><span class="authPub info_auth"><a href="https://www.yes24.com/product/search?domain=ALL&authorNo=1&author=${g.au}">${g.au}</a> 저 </span><span class="authPub info_pub"><a href="https://www.yes24.com/product/search?&domain=ALL&company=x">${g.pub}</a></span><span class="authPub info_date">2024년 03월</span></div>
    <div class="info_row info_price"><span class="txt_sale"><em class="num">10</em>% </span><strong class="txt_num"><em class="yes_b">${fmt(g.ps)}</em>원</strong><span class="txt_num dash"><em class="yes_m">${fmt(g.pl)}</em>원</span></div><div class="info_row info_rating"><span class="saleNum">판매지수 ${fmt(g.si)}</span></div></div></div></li>`;
  const YB = [{ no: 111, t: '예스 시험 하나', au: '가가', pub: '시험사', ps: 16200, pl: 18000, si: 12345 }, { no: 222, t: '예스 시험 둘', au: '나나', pub: '두시험', ps: 9000, pl: 10000, si: 870 }, { no: 333, t: '예스 시험 셋', au: '다다', pub: '세시험', ps: 13500, pl: 15000, si: 45 }, { no: 444, t: '예스 시험 넷', au: '라라', pub: '네시험', ps: 7200, pl: 8000, si: 6 }];
  const ydoc = D(`<html><body><ul id="yesSchList">${YB.map(yb).join('')}</ul></body></html>`); const YL = A.extractList(ydoc, { kind: 'y24_list' }); const YH = A.healthOfList([YL], 'y24_list');
  ok(YL.rows.length === 4 && YL.rows[0].goodsNo === '111' && YL.rows[0].salesIndex === 12345 && YL.rows[0].priceSales === 16200 && YL.rows[0].priceList === 18000 && YL.rows[0].author === '가가' && YL.rows[0].pubYm === '2024-03' && YL.rows[0].used === 'new' && YL.boxes.use === '#yesSchList > li', '예스24 검색 한 쪽 = 여러 권의 판매지수·판매가·정가·지은이·출판사·출간 연월(알라딘 목록과 같은 틀)', YL.rows[0]);
  ok(YH.kind === 'y24_list' && YH.score >= 0.9, '예스24 목록 칸 건강 90점 넘음', YH.score);
  const yreal = '/home/user/readnow-chats/reports/yes24_pub/search_used_goods/03_doc.html'; if (fs.existsSync(yreal)) { const X = A.extractList(D(fs.readFileSync(yreal, 'utf8')), { kind: 'y24_list' }); ok(X.rows.length >= 1 && X.rows.every((r) => r.goodsNo && r.title && r.used === 'used' && r.priceSales), '보관 원문(예스24 중고 검색 · readnow-chats)도 읽힘', X.rows.slice(0, 1)); }
  ok(/kinds\.y24_list = \{ health: LH/.test(CSRC) && /extractList\(d, \{ kind: 'y24_list', learned \}\)/.test(CSRC) && /if \(!d\.querySelector\('#yesSchList, \.itemUnit'\)\) return \{ rows: \[\], boxes: null, main: true \}/.test(CSRC), '매일 점검이 예스24 검색 화면(이미 받은 것)으로 목록 건강 · 첫 화면으로 넘겨지면 엉뚱한 책을 잡지 않음');
  const PD = PB.map((b) => ({ doc: D(prod(b)), url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=' + b.id }));
  const DR = A.drill('al_product', PD); const M = DR.muts;
  ok(Object.keys(M).join() === 'cls,ld,label,wrap,both' && DR.n === 3, '훈련 화면 다섯 가지(클래스 이름·구조 데이터·이름표 글·감싸는 상자·둘 함께)', Object.keys(M));
  ok(M.cls.keep >= 0.9 && M.cls.dead.length >= 5 && M.cls.healed.length === M.cls.need && M.cls.skip.includes('cid'), '클래스 이름이 바뀌어도 남은 길로 값이 거의 그대로 · 죽은 선택자 길을 모두 스스로 새로 찾아 다른 화면으로 검증(주소·속성 칸은 시험 밖)', M.cls);
  ok(M.ld.keep === 1 && M.label.keep >= 0.8 && M.wrap.keep === 1, '구조 데이터 사라짐·감싸는 상자는 값 그대로 · 이름표 글 바뀜도 대부분', { ld: M.ld.keep, label: M.label.keep, wrap: M.wrap.keep });
  const hp = M.both.healed.find((h) => h.f === 'title'); ok(M.both.keep >= 0.6 && hp && hp.sel && /_rn/.test(hp.sel), '클래스+구조 데이터가 함께 바뀌어도 새 선택자(바뀐 이름)로 제목을 고침', M.both);
  ok(DR.score >= 0.85 && DR.heal >= 0.8, `훈련 점수 ${Math.round(DR.score * 100)}점 · 고침 ${Math.round(DR.heal * 100)}%`, DR);
  ok(PD.every((x) => x.doc.querySelector('.Ere_bo_title') && x.doc.querySelector('script[type="application/ld+json"]')), '원래 화면은 그대로(사본만 바꿈)');
  const DL = A.drillList('al_list', D(listPage(BK.concat(BK.map((b, i) => ({ ...b, id: '5' + i + b.id, cov: 'k9' + i + '0000000', cart: null, other: null }))))));
  ok(DL && DL.muts.cls.keep >= 0.85 && DL.muts.ld.keep === 1 && DL.score >= 0.85 && DL.muts.label.healed.length + DL.muts.both.healed.length + DL.muts.cls.healed.length >= 0, '목록 화면 훈련: 클래스 이름이 바뀌어도 다른 상자 길(div[itemid]·상품 링크 묶음)로 값 그대로', DL && { s: DL.score, cls: DL.muts.cls });
  const DY = A.drillList('y24_list', ydoc); ok(DY && DY.score >= 0.85 && DY.muts.cls.keep >= 0.8, '예스24 목록 훈련도 같은 틀', DY && { s: DY.score, cls: DY.muts.cls });
  ok(/adaptDrillRun\(await getPage\(\), ids, best && best\.url \? best\.url : null\)/.test(CSRC) && /golden, drill \};/.test(CSRC) && /drill: drill \? drill\.score : null/.test(CSRC), '매일 점검이 훈련 화면을 돌려 adapt_health.drill · 지난 날 표(hist)에 점수');
  ok(!/\.reduce\(/.test(ASRC), '공용 파일에 reduce 없음(알라딘 화면 prototype.js)');
  ok(/const VERSION = '0\.1\.3'/.test(ASRC), '공용 파일 판 0.1.3');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
