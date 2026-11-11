// tADAPT2_1111 — 11/11 adapt2: 🧬 수집 적응 엔진 배포 뒤 진단으로 찾은 다섯 가지 고침(약속 55 · 연구 N10)
//   ① 알라딘 화면의 옛 prototype.js가 Array.prototype.reduce를 바꿔 화면 안 신뢰도가 모두 NaN(모든 칸 conf null → 점수 50점) — reduce 안 씀
//   ② 실제 목록 화면 모양: '세일즈포인트 :<span class="sales_point">' · <span class="">정가</span>원 → · chkCart.<ISBN10> · 전자책 '보러 가기' 링크(상품으로 세지 않음)
//   ③ SP 묶음 2판 — 표지 이름 짐작 ISBN · 제목 검색 · 한 쪽 줄을 남은 모든 상품과 견줌 · 셈만(dry)
//   ④ TTB 견줌 — 외국 책 정가는 환율 따라(15%) · 틀린 예 · 공개 상품 화면 정가가 판매가 절반 밑이면 버림
//   ⑤ 편집자 추천 — 분야 첫 화면의 제목 칸('편집장의 선택')에서 · 값 없는 화면을 목록으로 받지 않음 ⑥ 네이버 종료 확정(진단 ended) ⑦ 매일 요약 줄
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tADAPT2_1111.js · 지어낸 값만(실제 화면의 '모양'만 흉내)
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js'])); const P = require(find(['readnow-products-core.js'])); const X = require(find(['readnow-ext-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const D = (h) => new JSDOM(h).window.document;
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const fmt = (n) => n.toLocaleString('en-US');
/* 지어낸 상품 화면(지금 알라딘 모양) */
const prod = (b) => `<html><head><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><meta property="og:title" content="${b.title}"></head><body><div class="Ere_prod_titlewrap"><ul><li><span class="Ere_bo_title">${b.title}</span></li><li class="Ere_sub2_title"><a href="/Search/wSearchResult.aspx?AuthorSearch=가@1">가나다</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=시@2">시험출판</a> | 2024-03-05</li></ul></div>
  <div class="Ere_prod_Binfowrap"><div class="info_list"><ul><li><div class="Litem">정가</div><div class="Ritem"><del>${b.plTxt || fmt(b.pl) + '원'}</del></div></li><li><div class="Litem_P">판매가</div><div class="Ritem"><em itemprop="price">${fmt(b.ps)}</em>원 (10%, 할인)</div></li></ul></div></div>
  <div id="wa_product_top1_wa_Top_Ranking_pnlRanking"><div>주간 12위 | <div style="display:inline-block;">Sales Point : <strong>${fmt(b.sp)}</strong></div></div></div><div class="conts_info_list1"><ul><li>300쪽</li><li>ISBN : ${b.isbn}</li></ul></div></body></html>`;
/* 지어낸 목록 화면 — 2026-11-11 보관 원문과 같은 '모양'(값은 지어냄) */
const box = (b) => `<div class="ss_book_box" itemid="${b.id}"><table><tbody><tr><td><input name="chkCart.${b.cart || b.isbn10}" type="checkbox"></td><td><div class="cover_area"><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}"><img src="https://image.aladin.co.kr/product/1/2/cover200/${b.cov || b.isbn10}_1.jpg" class="front_cover"></a></div></td>
  <td><div class="ss_book_list"><ul><li><span class="tit_category">[${b.kind || '국내도서'}]</span>&nbsp;<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3">${b.title}</a><span class="ss_f_g2"> - 부제</span></li>
  <li><a href="/Search/wSearchResult.aspx?AuthorSearch=${b.au || '가나다'}@1&amp;BranchType=1">${b.au || '가나다'}</a> (지은이) | <a href="/search/wsearchresult.aspx?PublisherSearch=x@2&amp;BranchType=1">${b.pub || '시험출판'}</a> | 2013년 5월</li>
  <li><span class="">${fmt(b.pl)}</span>원 → <span class="ss_p2"><em>${fmt(b.ps)}원</em></span> (<span class="ss_p">10%</span>할인), 마일리지 <span class="ss_p">900</span>원</li><li>세일즈포인트 :<span class="sales_point"> ${fmt(b.sp)}</span></li></ul></div>
  <div class="ss_book_list"><ul>${b.eb ? `<li><span class="ebook_price">이 책의 전자책 : <em>${fmt(b.eb)}</em>원</span> <a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}9" title="보러 가기" class="view_blue_btn">보러 가기</a></li>` : ''}</ul></div></td>
  <td><div class="button_search_cart_new"><a href="/shop/wbasket.aspx?AddBook=${b.isbn10}">장바구니</a></div><div class="Search3_Result_SafeBasketArea" isbn="${b.cart || b.isbn10}"></div></td></tr></tbody></table></div>`;
const listPage = (L) => `<html><head><script src="/js/prototype.js"></script></head><body><form>${L.map(box).join('')}<div class="ss_book_box"></div></form></body></html>`;
const BK = [{ id: '2000001', isbn10: '8998209039', title: '초보 시험 교실', pl: 18000, ps: 16200, sp: 270, eb: 8100, pub: '골프출판', au: '가가' }, { id: '2000002', isbn10: '8937460440', title: '시험의 맛', pl: 12000, ps: 10800, sp: 4210, eb: 6000, pub: '민음시험', au: '나나' },
  { id: '2000003', isbn10: '8993508496', cov: 'K292937992', cart: '8993508496', title: '세 번째 시험', pl: 15000, ps: 13500, sp: 88, pub: '이지시험', au: '다다' }, { id: '2000004', isbn10: '8956251673', title: '맏이 시험', pl: 12000, ps: 10800, sp: 71, eb: 5000, pub: '학고시험', au: '라라' },
  { id: '2000005', isbn10: '8947544922', title: '엘지 시험 웨이', pl: 18000, ps: 16200, sp: 117, pub: '한경시험', au: '마마' }];
const R0 = Array.prototype.reduce; const PROTO = function () { return this.length > 1 ? this : this[0]; }; /* 알라딘 /js/prototype.js 1.6의 Array#reduce */
(async () => {
  console.log('① 화면의 prototype.js가 reduce를 바꿔도 신뢰도가 숫자');
  const pd = D(prod({ id: '1000001', isbn: '9791155551752', title: '지혜의 시험', pl: 18000, ps: 16200, sp: 12 })); const ld = D(listPage(BK));
  Array.prototype.reduce = PROTO; let e, L, H, HL; try { e = A.extract('al_product', pd, { url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1000001' }); L = A.extractList(ld, {}); } finally { Array.prototype.reduce = R0; }
  ok(Number.isFinite(e.conf.title) && e.conf.title >= 0.9 && Number.isFinite(e.conf.priceList) && e.conf.priceList >= 0.9 && e.conf.salesPoint >= 0.9, '상품 화면 칸 신뢰도가 숫자(11/11 진단: 모두 null → 점수 50점이던 것)', e.conf);
  ok(L.rows.every((r) => Number.isFinite(r._conf.title)), '목록 화면 줄 신뢰도도 숫자');
  const eN = A.extract('al_product', pd, { url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1000001' }); Array.prototype.reduce = PROTO; try { H = A.healthOf([e, e], 'al_product'); HL = A.healthOfList([L]); } finally { Array.prototype.reduce = R0; }
  ok(H.score === A.healthOf([eN, eN], 'al_product').score && H.fields.title.conf >= 0.9 && HL.score >= 0.9, '칸 건강 점수가 바뀐 reduce 아래서도 보통 때와 같음 · 목록 90점 넘음(50·32점이던 것)', { p: H.score, l: HL.score });
  ok(!/\.reduce\(/.test(fs.readFileSync(find(['readnow-adapt-core.js']), 'utf8')), '공용 파일에 reduce 없음(화면 안에서 도는 파일)');

  console.log('② 실제 목록 화면 모양');
  ok(L.rows.length === 5 && L.boxes.use === '.ss_book_box', '전자책 \'보러 가기\' 링크를 따로 상품으로 세지 않음(50권 → 74줄이던 것) · 상자 길 .ss_book_box', { n: L.rows.length, use: L.boxes.use });
  const r1 = L.rows[0]; ok(r1.salesPoint === 270 && r1.priceList === 18000 && r1.priceSales === 16200 && r1.isbn13 === '9788998209032' && r1.coverKey === '8998209039' && r1.ebookPrice === 8100 && r1.kind === '국내도서' && r1.used === 'new', "'세일즈포인트' SP · 숫자만 든 정가 span · 표지 ISBN · 전자책 값", r1);
  ok(r1._conf.priceList >= 0.9 && r1._conf.salesPoint >= 0.9, '정가·SP 두 길이 같아 신뢰도 1(정가 하나뿐 0.6이던 것)', r1._conf);
  const r3 = L.rows[2]; ok(r3.isbn13 === A.NORM.isbn('8993508496') && r3.coverKey === 'K292937992', '표지 이름이 K코드여도 장바구니 네모(chkCart)·보관함 isbn으로 ISBN', r3);
  ok(HL.fields.ebookPrice && HL.fields.ebookPrice.opt === true && HL.fields.coverKey.opt === true, '덧붙인 칸(표지 이름·갈래·전자책 값)은 점수에 안 셈(opt)');
  const old = D(listPage(BK).replace(/세일즈포인트 :<span class="sales_point">/g, 'Sales Point : <span class="sp_x">')); const Lo = A.extractList(old, {}); ok(Lo.rows[0].salesPoint === 270, "옛 꼴 'Sales Point'도 그대로 읽음");

  console.log('③ SP 묶음 2판');
  ok(A.isbnOk('8998209039') && A.isbnOk('080442957X') && !A.isbnOk('899350849X') && !A.isbnOk('8998209038') && !A.isbnOk('K292937992') && A.isbnOk('9788998209032') && !A.isbnOk('9788998209033'), 'ISBN 검사 숫자(10·13자리)');
  ok(A.coverIsbn('8998209039') === '9788998209032' && A.coverIsbn('K292937992') === null, '표지 이름 → 짐작 ISBN(검사 숫자가 맞을 때만)');
  ok(A.cleanTitle('[중고] 타임 시험 1~3 세트 - 전3권') === '타임 시험 1 3 세트' && A.cleanTitle('시험 관계론 (합본, 무선)') === '시험 관계론', '판매자 숍 제목 정리', [A.cleanTitle('[중고] 타임 시험 1~3 세트 - 전3권'), A.cleanTitle('시험 관계론 (합본, 무선)')]);
  const items = [{ id: 'a', coverKey: '8998209039', title: '초보 시험 교실' }, { id: 'b', isbn: null, coverKey: 'K292937992', title: '세 번째 시험' }, { id: 'c', title: '맏이 시험', publisher: '학고시험' }, { id: 'd', title: '맏이 시험', publisher: '다른출판' }, { id: 'e', title: '없는 책' }, { id: 'f', title: '엘지 시험 웨이' }];
  const plan = A.spBatchPlan2(items); ok(plan[0].field === 'ISBN' && plan[0].q === '9788998209032' && plan.filter((g) => g.field === 'Title').length === 4 && plan.find((g) => g.q === '맏이 시험').ids.length === 2, 'ISBN(짐작 포함) 먼저 · 같은 제목은 한 쪽으로 묶음', plan);
  const M = A.spBatchMatch2(L.rows, items); ok(M.get('a') && M.get('a').how === 'cover' && M.get('a').sp === 270, '표지 이름 같음 = 같은 책(가장 셈)', M.get('a'));
  ok(M.get('b') && M.get('b').how === 'cover' && M.get('b').row.isbn13 === A.NORM.isbn('8993508496'), 'K코드 표지도 표지 이름으로 맞춤 → ISBN을 얻음');
  ok(M.get('c') && M.get('c').how === 'title' && M.get('c').sp === 71 && !M.get('d') && !M.get('e'), '제목만 같으면 출판사·지은이·정가 중 하나는 같아야 · 다르면 안 맞춤', [M.get('c'), M.get('d')]);
  ok(!M.get('f'), '제목만 같고 다른 단서가 없으면 맞추지 않음(틀린 SP 막음)');
  const eb = A.spBatchMatch2([{ ...L.rows[0], kind: '전자책', used: 'ebook' }], [items[0]]); ok(!eb.get('a'), '전자책 줄은 새책으로 잇지 않음');
  const spb = cut(CSRC, 'async function spBatchTick(o)', '\n/* (정범님 11/11 밤 ②');
  ok(/'coverKey'(, 'spEvery' \/\* \(adapt4\) \*\/)?\)\.limit\(per\)/.test(spb) && /A\.coverIsbn\(v\.coverKey\)/.test(spb) && /x\.isbnG && put\.get/.test(spb), '시장 지표·SP 표본 맞대기에 짐작 ISBN(ISBN 없어 0이던 것)');
  ok(/A\.spBatchMatch2\(rows, pool\)/.test(spb) && /items\.filter\(\(x\) => !matched\.has\(x\.id\)\)/.test(spb), '한 쪽 줄을 남은 모든 상품과 견줌(묶음 덤)');
  ok(/if \(!o\.dry\) B\.set/.test(spb) && /nb && !o\.dry/.test(spb) && /dry: q\.spbatch === 'dry'/.test(CSRC), "셈만(spbatch=dry) — 쓰지 않고 몇 개를 어떻게 맞출지");
  ok(/for \(const id of tried\) if \(!matched\.has\(id\)\)/.test(spb) && /out\.notTried = left\.length - tried\.size/.test(spb), "못 맞춤(noMatch)은 찾아본 것만 · 안 찾아본 것은 notTried(7,510 noMatch가 대부분 '안 찾아봄'이던 것)");
  ok(/spBatchHist/.test(spb) && /maxQ: 24/.test(spb) && /Math\.min\(Math\.max\(\+cfg\.maxQ \|\| 24, 1\), 60\)/.test(spb), '회차 24쪽(60까지) · 하루 합 spBatchHist(매일 요약 줄)');

  console.log('④ TTB 견줌 · 공개 상품 화면 정가');
  const pairs = [{ isbn: '9780316057905', ttb: { priceList: 12740, title: 'a' }, now: { priceList: 13100, title: 'a' } }, { isbn: '9780198739838', ttb: { priceList: 20000, title: 'b' }, now: { priceList: 20900, title: 'b' } }, { isbn: '9788937460449', ttb: { priceList: 8000, title: 'c' }, now: { priceList: 8000, title: 'c' } }, { isbn: '9791155551752', ttb: { priceList: 18000, title: 'd' }, now: { priceList: 16000, title: 'd' } }];
  const tc = A.ttbCompare(pairs); const fp = tc.fields.priceList; ok(fp.both === 4 && fp.agree === 0.75 && fp.agreeKr === 0.5 && fp.nKr === 2, '외국 책 원화 정가는 15% 안이면 같음(환율) · 국내 책은 그대로 엄격 · 국내만 따로 일치율', fp);
  ok(fp.miss.length === 1 && fp.miss[0].isbn === '9791155551752' && fp.miss[0].ttb === 18000 && fp.miss[0].now === 16000 && fp.miss[0].kr === true, '틀린 예(isbn·TTB 값·지금 값)를 남김 — 다음 진단에서 까닭 확정', fp.miss);
  const jd = new JSDOM('<html></html>'); global.DOMParser = jd.window.DOMParser; global.window = { ReadnowProducts: P, ReadnowAdapt: A };
  const fx = {}; global.fetch = async (u) => { const k = Object.keys(fx).sort((a, b) => b.length - a.length).find((x) => String(u).startsWith(x)); return { ok: !!k, status: k ? 200 : 404, url: 'https://www.aladin.co.kr' + u, text: async () => (k ? fx[k] : '') }; };
  const alPubItem = new Function(cut(CSRC, 'async function alPubItem(p, o)', '\n/* 벤치마킹 그룹이 중고 요약').replace(/\/\* ◆adapt[\s\S]*$/, '') + '\nreturn alPubItem;')();
  const fakeP = { evaluate: async (fn, ...a) => fn(...a) };
  fx['/search/wsearchresult.aspx'] = listPage([{ ...BK[0], id: '3000001', isbn10: '0316057908' }]); fx['/shop/UsedShop/wuseditemall.aspx'] = '<html><body></body></html>';
  fx['/shop/wproduct.aspx'] = prod({ id: '3000001', isbn: '9780316057905', title: 'Blink 시험', pl: 0, plTxt: '$18.00', ps: 13100, sp: 1286 }); const it = await alPubItem(fakeP, { isbn: '9780316057905' });
  ok(it && it.priceSales === 13100 && it.priceStandard == null && (it.adapt || []).includes('priceList!'), "정가가 판매가 절반 밑('$18'을 18로 읽는 꼴)이면 버림 · 표시 priceList!", it && { pl: it.priceStandard, ad: it.adapt });
  fx['/shop/wproduct.aspx'] = prod({ id: '3000001', isbn: '9780316057905', title: 'Blink 시험', pl: 14550, ps: 13100, sp: 1286 }); const it2 = await alPubItem(fakeP, { isbn: '9780316057905' }); ok(it2.priceStandard === 14550 && !(it2.adapt || []).includes('priceList!'), '맞는 정가는 그대로', it2.adapt);
  ok(/priceList: x\.now\.priceList \?\? null/.test(CSRC) && /ttbPl: x\.ttb\.priceList/.test(CSRC), 'ttbcmp 표본에 정가(TTB·지금) 함께');

  console.log('⑤ 편집자 추천 · 목록 화면 받기');
  const hub = `<html><body><div class="sec_a"><h3>이 분야 새 책</h3>${[1, 2, 3, 4].map((i) => `<a href="/shop/wproduct.aspx?ItemId=500000${i}">새 책 ${i}</a>`).join('')}</div>
    <div class="sec_b"><div class="tit"><img alt="편집장의 선택"><a href="/shop/common/wedpick_list.aspx?CID=1" title="더보기">더보기</a></div><ul>${[1, 2, 3, 4].map((i) => `<li><a href="/shop/wproduct.aspx?ItemId=600000${i}"><img src="//image.aladin.co.kr/product/1/2/cover150/K10000000${i}_1.jpg"></a><a href="/shop/wproduct.aspx?ItemId=600000${i}" class="bo3">추천 책 ${i}</a> <a href="/Search/wSearchResult.aspx?AuthorSearch=x@1">지은이${i}</a></li>`).join('')}</ul></div></body></html>`;
  const S = A.sectionOf(D(hub), A.LISTS.ItemEditorChoice.sec[0]); ok(S && S.n === 4 && S.more === '/shop/common/wedpick_list.aspx?CID=1', "제목 칸('편집장의 선택' 그림 글자도) 아래 상품만 · 칸 안 '더보기' 주소", S && { n: S.n, more: S.more });
  const mkRead = new Function('adaptMod', 'A', cut(CSRC, 'async function adaptListRead(p, type, o)', '\n/* ② TTB 대체 견줌') + '\nreturn adaptListRead;'); const adaptListRead = mkRead(async () => A, A);
  const nop = `<html><body>${[1, 2, 3, 4, 5, 6, 7].map((i) => `<div class="ss_book_box" itemid="70000${i}"><a href="/shop/wproduct.aspx?ItemId=70000${i}" class="bo3">값 없는 ${i}</a></div>`).join('')}</body></html>`;
  for (const k of Object.keys(fx)) delete fx[k]; fx['/shop/common/wchoice.aspx'] = nop; fx['/shop/wbrowse.aspx'] = hub;
  const E1 = await adaptListRead(fakeP, 'ItemEditorChoice', { page: 1, cid: 1 }); ok(E1.rows && E1.sec && E1.sec.more === false && E1.rows.length === 4 && E1.rows.every((r) => /^600000/.test(r.itemId)) && E1.tpl === null && /값 든 줄 0 · 목록 아님/.test(E1.tried[0]), "값 없는 화면은 목록으로 안 받음 → 분야 첫 화면 '편집장의 선택' 칸 4권(주소 기억 안 함)", E1);
  fx['/shop/common/wedpick_list.aspx'] = listPage(BK); const E2 = await adaptListRead(fakeP, 'ItemEditorChoice', { page: 1, cid: 1 }); ok(E2.rows && E2.rows.length === 5 && E2.sec.more === true && E2.tpl === '/shop/common/wedpick_list.aspx?CID=1', "칸의 '더보기' 화면이 목록이면 그 화면(값·SP 함께) · 주소 기억", E2 && { n: E2.rows && E2.rows.length, tpl: E2.tpl });
  const E3 = await adaptListRead(fakeP, 'ItemEditorChoice', { page: 2, cid: 1 }); ok(E3.miss, '2쪽부터는 칸 찾기 안 함(첫 쪽뿐 — 헛읽기 없음)');
  fx['/shop/common/wbest.aspx'] = listPage(BK); const B1 = await adaptListRead(fakeP, 'Bestseller', { page: 1 }); ok(B1.rows.length === 5 && B1.rows[0].salesPoint === 270, '베스트셀러 목록은 그대로(값 든 줄 100%)');
  ok(/sec: R\.sec \|\| null/.test(CSRC) && /priced: R\.rows\.filter/.test(CSRC), '진단 blist에 칸 찾기·값 든 줄 수');

  console.log('⑥ 네이버 종료 확정');
  ok(X.SOURCES.naver.endedSure === true && /ended: !alive && !!\(keys\.naverId && keys\.naverSecret\) && \/SE05/.test(CSRC), "공용 파일 '종료됨' 확정 · 진단 naverchk가 키 있는데 SE05면 ended 'sure'");

  console.log('⑦ 매일 요약 줄(ADAPT_DAILY) — readnow-chats 엔진 adapt_daily.py가 읽는 칸');
  ok(/spBatchHist/.test(CSRC) && /agreeKr/.test(fs.readFileSync(find(['readnow-adapt-core.js']), 'utf8')), '정가 일치(국내·전체)·묶음 맞춤률 칸이 문서에 남음');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
