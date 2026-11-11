// tADAPT1111 — 11/11 adapt1: 🧬 수집 적응 엔진(readnow-adapt-core.js · 약속 55 · 연구 N10) + 클라우드 매일 점검·TTB 대체 견줌·벤치마킹 목록 종류·SP 묶음 + 네이버 '확인 필요'
//   ① 여러 길 추출·합의·신뢰도(알라딘 상품·전체중고·예스24 상품) ② 화면이 바뀌어도(선택자 깨짐) 남은 길로 같은 값 · 지문이 바뀜을 앎 · 칸 건강 판정(죽은 길)
//   ③ 새 길 스스로 찾기·견본 3권 검증·채택 → 그 길로 다시 읽음 ④ 목록 화면(상자 길 여럿 · 상자 class가 바뀌어도 상품 링크로 묶음) · SP 묶음 계획·맞추기
//   ⑤ 운영 파서(readnow-products-core) 견줌 ⑥ TTB 대체 견줌 ⑦ 네이버 '종료 확인 필요'·probeLive·revive ⑧ 클라우드: alPubItem 빈 칸을 적응 엔진으로 채움 · 목록 화면 주소 후보 · 매일 일·진단 길 ⑨ 웹앱 경보 줄
// 실행: cd src/tests && node tADAPT1111.js (jsdom 필요 — 없으면 JSDOM=<jsdom 경로> node tADAPT1111.js) · 지어낸 값만
const fs = require('fs'); const path = require('path');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js'])); const P = require(find(['readnow-products-core.js'])); const X = require(find(['readnow-ext-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8'); const APP = fs.readFileSync(find(['src/app.html', 'app.html']), 'utf8');
const D = (h) => new JSDOM(h).window.document;
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
/* 지어낸 알라딘 상품 화면 — v: 'ok' 지금 모양 · 'moved' 제목 class·SP 상자 id·가격 줄이 바뀐 모양(알라딘 개편 흉내) */
function alProd(o, v) { const t = o.title, sp = o.sp, pl = o.pl, ps = o.ps, id = o.id, isbn = o.isbn; const fmt = (n) => n.toLocaleString('en-US');
  const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Book","name":"${t}","isbn":"${isbn}","author":{"@type":"Person","name":"가나다"},"publisher":{"@type":"Organization","name":"시험출판"},"offers":{"@type":"Offer","price":${ps},"availability":"https://schema.org/${o.av || 'InStock'}"}}</script>`;
  const head = `<head><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}"><meta property="og:title" content="${t}"><meta property="books:isbn" content="${isbn}">${ld}</head>`;
  if (v === 'moved') return `<html>${head}<body><div class="Ere_prod_newtitle"><h1 class="prod_ttl">${t}</h1><div class="by"><a href="/Search/wSearchResult.aspx?AuthorSearch=@1">가나다</a> (지은이) | <a href="/Search/wSearchResult.aspx?PublisherSearch=@2">시험출판</a> | 2024-03-05</div></div>
    <section class="price_box"><dl><dt>정가</dt><dd><del>${fmt(pl)}원</del></dd><dt>판매가</dt><dd><strong class="sale">${fmt(ps)}원</strong></dd></dl></section>
    <div class="rank_new"><span class="sp_lbl">Sales Point</span> <span class="sp_val">${fmt(sp)}</span></div><ul class="info_basic"><li>${o.pages || 300}쪽</li><li>ISBN : ${isbn}</li></ul><nav class="cat_path"><a href="/shop/wbrowse.aspx?CID=1">국내도서</a> <a href="/shop/wbrowse.aspx?CID=50993">소설</a></nav></body></html>`;
  return `<html>${head}<body><div class="Ere_prod_titlewrap"><ul><li class="tlist"><span class="Ere_bo_title">${t}</span></li><li class="Ere_sub2_title"><a href="/Search/wSearchResult.aspx?AuthorSearch=@1">가나다</a> (지은이) | <a href="/Search/wSearchResult.aspx?PublisherSearch=@2">시험출판</a> | 2024-03-05</li></ul></div>
    <div class="Ere_prod_Binfowrap"><ul class="info_list"><li><div class="Litem">정가</div><div class="Ritem"><del>${fmt(pl)}원</del></div></li><li><div class="Litem">판매가</div><div class="Ritem"><em itemprop="price">${fmt(ps)}</em>원</div></li></ul></div>
    ${o.av === 'OutOfStock' ? '<div class="Ere_soldout_info">품절되었습니다</div>' : ''}
    <div id="wa_product_top1_wa_Top_Ranking_pnlRanking"><div class="Ere_fs15 Ere_ht18">주간 소설 12위 <div>Sales Point : <strong>${fmt(sp)}</strong></div></div></div>
    <ul id="ulCategory"><li><a href="/shop/wbrowse.aspx?CID=1">국내도서</a> > <a href="/shop/wbrowse.aspx?CID=50993">소설</a></li></ul>
    <div class="conts_info_list1"><ul><li>${o.pages || 300}쪽</li><li>ISBN : ${isbn}</li></ul></div></body></html>`; }
const BOOKS = [{ id: '1000001', isbn: '9790000000011', title: '시험책 하나', sp: 4210, pl: 15000, ps: 13500 }, { id: '1000002', isbn: '9790000000028', title: '시험책 둘', sp: 88, pl: 12000, ps: 10800, av: 'OutOfStock' }, { id: '1000003', isbn: '9790000000035', title: '시험책 셋', sp: 120345, pl: 22000, ps: 19800 }, { id: '1000004', isbn: '9790000000042', title: '시험책 넷', sp: 7, pl: 9000, ps: 8100 }];
const searchPage = (L, boxCls) => `<html><body>${L.map((b) => `<div class="${boxCls || 'ss_book_box'}" ${boxCls ? '' : `itemid="${b.id}"`}><table><tr><td><img class="front_cover" src="//image.aladin.co.kr/product/1/2/cover/${b.isbn}_1.jpg"></td><td><div class="${boxCls ? 'renamed_list' : 'ss_book_list'}"><ul>
  <li><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b.id}" class="bo3"><b>${b.title}</b></a></li><li><a href="/Search/wSearchResult.aspx?AuthorSearch=@1">가나다</a> (지은이) | <a href="/Search/wSearchResult.aspx?PublisherSearch=@2">시험출판</a> | 2024년 3월</li>
  <li><span class="ss_p">${b.pl.toLocaleString('en-US')}원</span> → <span class="ss_p2"><b>${b.ps.toLocaleString('en-US')}원</b></span> (10%할인)</li><li>${b.av === 'OutOfStock' ? '<b>품절</b> ' : ''}Sales Point : <b>${b.sp.toLocaleString('en-US')}</b></li></ul></div></td><td><a href="#">장바구니</a></td></tr></table></div>`).join('')}</body></html>`;

(async () => {
  console.log('① 여러 길 추출·합의');
  const d0 = D(alProd(BOOKS[0])); const e0 = A.extract('al_product', d0, { url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1000001' });
  ok(e0.values.itemId === '1000001' && e0.values.title === '시험책 하나' && e0.values.isbn13 === '9790000000011' && e0.values.priceList === 15000 && e0.values.priceSales === 13500 && e0.values.salesPoint === 4210 && e0.values.availability === 'onSale' && e0.values.pubDate === '2024-03-05' && e0.fields.pubDate.hows.length === 2 && e0.values.publisher === '시험출판' && e0.values.cid === '50993', '알라딘 상품 화면 — 칸마다 합의값', e0.values);
  ok(e0.fields.salesPoint.conf === 1 && e0.fields.salesPoint.hows.length === 3 && e0.fields.title.hows.length === 3, '여러 길이 같은 값 = 신뢰도 1(SP 길 3개·제목 길 3개)', e0.fields.salesPoint);
  const d1 = D(alProd(BOOKS[1])); ok(A.extract('al_product', d1).values.availability === '품절', '품절(선택자·JSON-LD·문맥 글 셋 다)');
  const odd = A.vote('int', [{ how: 'sel', w: 1, v: 100 }, { how: 'ctx', w: 0.8, v: 999 }], 2); ok(odd.v === 100 && odd.conf < 0.6 && odd.alt[0].v === 999, '길끼리 다르면 무게 큰 쪽 · 신뢰도 낮음 · 다른 값도 남김', odd);
  const u0 = D(`<html><body><div class="Ere_usedsell_list2"><a>전체 중고 (37)</a><a>판매자 중고 (35)</a></div><table class="Ere_usedsell_table"><tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=9">x</a></td><td class="price"><span class="Ere_fs20">3,100</span>원<input name="chkCart.11"></td></tr><tr><td class="sell_tableCF2"><a href="/shop/wproduct.aspx?ItemId=8">x</a></td><td class="price"><span class="Ere_fs20">2,500</span>원<input name="chkCart.12"></td></tr></table></body></html>`);
  const eu = A.extract('al_used', u0); ok(eu.values.usedTotal === 37 && eu.values.rows === 2 && eu.values.lowest === 2500 && eu.fields.usedTotal.conf === 1, '전체 중고 화면 — 중고 수·첫 쪽 줄 수·최저가', eu.values);
  const yh = `<html><head><meta property="og:title" content="시험 예스책 | 가나다 | 시험출판 - 예스24"><meta property="og:url" content="https://www.yes24.com/product/goods/555"><script type="application/ld+json">{"@type":["Book","Product"],"name":"시험 예스책","isbn":"9790000000011","sku":"555","offers":{"price":7200,"availability":"https://schema.org/InStock"}}</script></head><body><div class="gd_infoTop"><h2 class="gd_name">시험 예스책</h2><span class="gd_pub">시험출판</span><span class="gd_date">2024년 03월 05일</span><span class="gd_sellNum">판매지수 25,226</span></div><table><tr><th>정가</th><td><em class="yes_m">8,000원</em></td></tr><tr><th>ISBN13</th><td>9790000000011</td></tr></table><span class="nor_price"><em class="yes_m">7,200</em>원</span><a>바로구매</a></body></html>`;
  const ey = A.extract('y24_product', D(yh)); ok(ey.values.goodsNo === '555' && ey.values.title === '시험 예스책' && ey.values.isbn13 === '9790000000011' && ey.values.priceList === 8000 && ey.values.priceSales === 7200 && ey.values.salesIndex === 25226 && ey.values.availability === 'onSale' && ey.values.pubDate === '2024-03-05' && ey.values.publisher === '시험출판', '예스24 상품 화면 — 같은 틀(판매지수·정가·판매가·ISBN·재고)', ey.values);

  console.log('② 화면이 바뀌어도 남은 길로 · 지문·건강');
  const M = BOOKS.map((b) => D(alProd(b, 'moved'))); const em = A.extract('al_product', M[0]);
  ok(em.values.title === '시험책 하나' && em.values.salesPoint === 4210 && em.values.priceSales === 13500 && em.values.isbn13 === '9790000000011' && em.values.priceList === 15000 && em.values.pubDate === '2024-03-05' && em.values.cid === '50993', '선택자가 깨진 화면에서도 같은 값(JSON-LD·meta·문맥 글)', em.values);
  ok(em.paths.salesPoint.find((p) => p.how === 'sel').v === null && em.paths.title.find((p) => p.how === 'sel').v === null, '깨진 길(선택자)은 비었다고 따로 남김');
  const fpA = A.fingerprint(d0, 'al_product'), fpB = A.fingerprint(M[0], 'al_product'); const fc = A.fpCompare(fpA, fpB);
  ok(fc.changed && fc.lost.includes('#wa_product_top1_wa_Top_Ranking_pnlRanking') && fc.lost.includes('.Ere_prod_titlewrap .Ere_bo_title'), '화면 구조 지문 — 바뀜과 사라진 조각을 앎', fc);
  ok(A.fpCompare(fpA, A.fingerprint(D(alProd(BOOKS[2])), 'al_product')).changed === false, '같은 모양 다른 책은 바뀜 아님');
  const hY = A.healthOf(BOOKS.map((b) => A.extract('al_product', D(alProd(b)))), 'al_product'); const hT = A.healthOf(M.map((d) => A.extract('al_product', d)), 'al_product'); const J = A.healthJudge(hT, hY);
  ok(hY.fields.salesPoint.fill === 1 && hY.fields.salesPoint.paths.sel.fill === 1 && hT.fields.salesPoint.fill === 1 && hT.fields.salesPoint.paths.sel.fill === 0, '칸 건강 — 채움률은 그대로 · 선택자 길 채움률 100% → 0%', hT.fields.salesPoint);
  ok(J.st === 'warn' && J.deadPaths.some((x) => x.field === 'salesPoint' && x.how === 'sel') && J.fields.salesPoint.st === 'path' && !J.broken.length, "판정 — 깨짐 아님 · '길이 죽음'(새 길 찾기 시작)", J);
  const allGone = A.healthOf(M.map((d) => ({ fields: { salesPoint: { v: null, conf: 0 } }, paths: {} })), 'al_product'); ok(A.healthJudge(allGone, hY).broken.includes('salesPoint'), '모든 길이 죽으면 깨짐(빨강)');

  console.log('③ 새 길 스스로 찾기·검증·채택');
  const S = M.map((d, i) => ({ doc: d, known: BOOKS[i].sp })); const H = A.heal('al_product', 'salesPoint', S);
  ok(H.cands.length && H.adopt && (H.adopt.sel === 'div.rank_new > span.sp_val' || /sp_val/.test(H.adopt.sel || '') || /Sales/.test(H.adopt.re || '')), '값을 아는 견본 4권 → 새 선택자 후보 · 모두 맞아 스스로 채택', H);
  const learned = { al_product: { salesPoint: [{ sel: H.adopt.sel, re: H.adopt.re, st: 'auto' }] } }; const el = A.extract('al_product', M[1], { learned });
  ok(el.values.salesPoint === 88 && el.paths.salesPoint.some((p) => p.how === 'learned' && p.v === 88), '채택한 길로 다른 책도 읽음(learned)', el.paths.salesPoint);
  const vc = A.verifyCand('al_product', 'salesPoint', { sel: 'div.rank_new > span.sp_val' }, [{ doc: M[0], known: 999 }]); ok(!vc.pass && vc.miss[0] === '4,210', '틀린 값으로는 통과 못 함(채택 안 함)', vc);
  const pr = A.discover(M[2], 'al_product', 'priceSales', 19800); ok(pr.some((c) => /sale/.test(c.sel || '')), '판매가 새 선택자 후보도', pr);

  console.log('④ 목록 화면 · SP 묶음');
  const L1 = A.extractList(D(searchPage(BOOKS)));
  ok(L1.rows.length === 4 && L1.boxes.use === '.ss_book_box' && L1.rows[0].salesPoint === 4210 && L1.rows[0].priceSales === 13500 && L1.rows[0].priceList === 15000 && L1.rows[0].isbn13 === '9790000000011' && L1.rows[1].stock === '품절' && L1.rows[0].publisher === '시험출판', '검색 결과 한 쪽 = 여러 권의 SP·판매가·정가·재고·ISBN', L1.rows.slice(0, 2));
  const L2 = A.extractList(D(searchPage(BOOKS, 'renamed_box')));
  ok(L2.rows.length === 4 && L2.boxes.use === '(상품 링크로 묶음)' && L2.rows[2].salesPoint === 120345, "상자 class가 바뀌어도 상품 링크로 상자를 스스로 묶어 같은 값", L2.boxes);
  const LH = A.healthOfList([L1, L2]); ok(LH.fields.salesPoint.fill === 1 && LH.rows === 8, '목록 칸 건강', LH.fields.salesPoint);
  const plan = A.spBatchPlan([{ id: 'a', publisher: '시험출판', title: '시험책 하나' }, { id: 'b', publisher: '시험출판', title: '시험책 둘' }, { id: 'c', publisher: '다른출판', isbn: '9790000000035' }, { id: 'd' }]);
  ok(plan.length === 2 && plan[0].field === 'Publisher' && plan[0].ids.length === 2 && plan[1].field === 'ISBN', '출판사 묶음 → 검색 한 쪽에 두 권 · 혼자면 ISBN 검색', plan);
  const mt = A.spBatchMatch(L1.rows, [{ id: 'a', title: '시험책 하나', publisher: '시험출판' }, { id: 'c', isbn: '9790000000035' }, { id: 'z', title: '없는 책' }]);
  ok(mt.get('a').sp === 4210 && mt.get('a').how === 'title' && mt.get('c').sp === 120345 && mt.get('c').how === 'isbn' && !mt.has('z'), '목록 줄 → 상품 맞추기(ISBN·제목 앞부분+출판사)', [...mt]);
  ok(A.listUrls('Bestseller', { page: 2 })[0] === '/shop/common/wbest.aspx?BestType=Bestseller&BranchType=1&CID=0&page=2&cnt=50' && A.listUrls('ItemEditorChoice').length === 2 && (A.LISTS.ItemEditorChoice.hubs || []).length >= 1 && A.listUrls('Bestseller', { known: '/x?p={p}' })[0] === '/x?p=1', '목록 종류 주소 후보(기억한 주소 먼저)');
  ok(Object.keys(A.LISTS).sort().join() === 'Bestseller,BlogBest,ItemEditorChoice,ItemNewAll,ItemNewSpecial', '목록 종류 다섯 가지 모두');

  console.log('⑤ 운영 파서 견줌');
  const g0 = A.guardCompare('al_product', P.parseProductPage(d0, ''), e0); ok(!g0.bad.length && g0.fields.salesPoint.st === 'same' && g0.fields.priceSales.st === 'same', '지금 화면 — 운영 파서(products-core)와 합의값이 같음', g0);
  const g1 = A.guardCompare('al_product', P.parseProductPage(M[0], ''), em); ok(g1.bad.includes('salesPoint') && g1.bad.includes('title') && g1.fields.salesPoint.st === 'op_miss', '바뀐 화면 — 운영 파서가 못 읽는 칸을 알림(수집기도 같은 파서)', g1.bad);

  console.log('⑥ TTB 대체 견줌');
  const pairs = [{ ttb: { title: '시험책 하나', authors: '가나다 (지은이)', publisher: '시험출판', pubDate: '2024-03-05', priceList: 15000, priceSales: 13500, salesPoint: 4000, stock: '', rating: 9 }, now: { title: '시험책 하나', author: '가나다', publisher: '시험출판', pubDate: '2024-03-05', priceList: 15000, priceSales: 13500, salesPoint: 4210, availability: 'onSale', rating: 9 } },
    { ttb: { title: '시험책 둘', publisher: '시험출판', priceList: 12000, salesPoint: 90 }, now: { title: '시험책 둘', publisher: '시험출판', priceList: 12000, salesPoint: null } }];
  const tc = A.ttbCompare(pairs); ok(tc.n === 2 && tc.fields.title.agree === 1 && tc.fields.priceList.ok && tc.fields.salesPoint.ttbFill === 1 && tc.fields.salesPoint.nowFill === 0.5 && !tc.fields.salesPoint.ok && tc.worse.includes('salesPoint'), 'TTB가 주던 칸을 같은 품질로 주는지 — SP 채움 50%면 나쁨으로', tc.fields.salesPoint);

  console.log('⑦ 네이버 책 검색 — (adapt2 11/11) 11/11 실제 물음도 SE05 → 종료 확정');
  const NV = X.SOURCES.naver; ok(NV.endedSure === true && /종료됨/.test(NV.label) && /SE05/.test(NV.endedWhy || '') && /11\/11/.test(NV.endedWhy || ''), "'종료 확인 필요' → '종료됨' 확정(10/13·11/11 두 번 SE05)", NV.label);
  let nh = 0; const http = async () => { nh++; return { status: 200, text: '{"items":[{"title":"시험","isbn":"9790000000011"}]}' }; };
  const r0 = await X.run('naver', { isbn: '9790000000011', keys: { naverId: 'a', naverSecret: 'b' }, http, cache: {}, cfg: X.cfgOf({}) }); ok(nh === 0 && /종료됨/.test(r0.skip || '') && !/확인 필요/.test(r0.skip || ''), '정기 수집은 묻지 않음(헛호출 0) · 표시 종료됨', r0);
  const rp = await X.probeLive('naver', { isbn: '9790000000011', keys: { naverId: 'a', naverSecret: 'b' }, http, cache: {}, cfg: X.cfgOf({}) }); ok(nh === 1 && rp && rp.ok !== undefined, '사실 확인(probeLive · 진단 naverchk)은 그대로 한 번 물을 수 있음', rp);
  const cr = X.cfgOf({ revive: { naver: { at: 'x' }, ttb: { at: 'x' } } }); ok(cr.src.naver.on !== true && cr.src.ttb.on === false && !cr.revive.naver && X.eligible('naver', { isbn: '9790000000011', title: 't' }, cr) === false, '종료 확정 뒤엔 revive가 남아 있어도 다시 켜지 않음 · TTB도');
  nh = 0; await X.run('naver', { isbn: '9790000000011', keys: { naverId: 'a', naverSecret: 'b' }, http, cache: {}, cfg: cr }); ok(nh === 0, 'revive가 남아도 정기 수집은 안 물음');

  console.log('⑧ 클라우드');
  ok(/'readnow-adapt-core\.js'\];/.test(CSRC) && /CORES_OPTIONAL = new Set\(\['readnow-register-core\.js', 'readnow-adapt-core\.js'\]\)/.test(CSRC), '적응 엔진을 화면에 함께 실음(없어도 다른 일은 그대로)');
  const fx = { '/search/wsearchresult.aspx': searchPage([BOOKS[0]]), '/shop/wproduct.aspx': alProd(BOOKS[0], 'moved'), '/shop/UsedShop/wuseditemall.aspx': '<html><body></body></html>' };
  const jd = new JSDOM('<html></html>'); global.DOMParser = jd.window.DOMParser; global.window = { ReadnowProducts: P, ReadnowAdapt: A };
  global.fetch = async (u) => { const k = Object.keys(fx).find((x) => String(u).startsWith(x)); return { ok: !!k, status: k ? 200 : 404, url: 'https://www.aladin.co.kr' + u, text: async () => (k ? fx[k] : '') }; };
  const alPubItem = new Function(cut(CSRC, 'async function alPubItem(p, o)', '\n/* 벤치마킹 그룹이 중고 요약') .replace(/\/\* ◆adapt[\s\S]*$/, '') + '\nreturn alPubItem;')();
  const fakeP = { evaluate: async (fn, ...a) => fn(...a) }; const it = await alPubItem(fakeP, { isbn: '9790000000011' });
  ok(it && it.salesPoint === 4210 && it.priceSales === 13500 && it.title === '시험책 하나' && (it.adapt || []).includes('salesPoint') && (it.adapt || []).includes('title'), '바뀐 화면 — 운영 파서가 비운 SP·제목·판매가를 적응 엔진이 채움(남은 길로 계속)', it);
  fx['/shop/wproduct.aspx'] = alProd(BOOKS[0]); const it2 = await alPubItem(fakeP, { isbn: '9790000000011' }); ok(it2.salesPoint === 4210 && it2.adapt === null, '지금 화면 — 운영 파서 값 그대로(채운 칸 없음)', it2.adapt);
  const block = cut(CSRC, '/* ◆adapt 🧬', '/* ◆adapt 끝 */'); ok(/credentials: 'omit'/.test(block) && !/credentials: 'include'/.test(block) && !/\/scm\//.test(block) && !/wshop|UsedShop\/wshopitem|SC=/.test(block), "약속 0 — 공개 화면만(로그인 정보 없이) · 샵매니저·판매자 숍 화면을 열지 않음");
  const mkRead = new Function('adaptMod', 'A', cut(CSRC, 'async function adaptListRead(p, type, o)', '\n/* ② TTB 대체 견줌') + '\nreturn adaptListRead;'); const adaptListRead = mkRead(async () => A, A);
  fx['/shop/common/wbest.aspx'] = searchPage(BOOKS.concat(BOOKS.map((b) => ({ ...b, id: b.id + '9' })))); const LR = await adaptListRead(fakeP, 'Bestseller', { page: 1 });
  ok(LR.rows && LR.rows.length === 8 && /^\/shop\/common\/wbest\.aspx\?BestType=Bestseller/.test(LR.url) && LR.tpl === A.LISTS.Bestseller.urls[0], '베스트셀러 공개 목록 화면 한 쪽 → 8권(SP 함께) · 맞은 주소 틀 기억', { url: LR.url, n: LR.rows && LR.rows.length });
  delete fx['/shop/common/wbest.aspx']; const LM = await adaptListRead(fakeP, 'BlogBest', {}); ok(LM.miss && LM.tried.length === 2, '모든 주소가 안 맞으면 멈추고 시도한 주소를 남김', LM);
  const cand = cut(CSRC, "if (g.phase === 'cand') {", "\n  const L = (await BLI()"); ok(/adaptListRead\(p, q\.list/.test(cand) && /lists: \{ \[q\.list\]: \{ url: R\.tpl/.test(cand) && /from: 'list', listSp/.test(cand) && /phase: 'look'/.test(cand) && !/공식 API로만 받던 것이라 지금은 못 읽음/.test(cand), "벤치마킹 '목록 종류' 되살림 — 공개 목록 화면 → look 단계(공개 상품 화면)");
  const dj = cut(CSRC, 'async function dailyJobs()', '\n/* (정범님 11/02'); ok(/adaptDaily\(\)/.test(dj) && /ttbCmpRun\(8\)/.test(dj) && /spBatchTick\(\)/.test(dj), '매일 일 — 적응 점검·TTB 대체 견줌·벤치마킹 SP 채우기');
  ok(/if \(q\.adapt\)/.test(CSRC) && /if \(q\.ttbcmp\)/.test(CSRC) && /if \(q\.blist\)/.test(CSRC) && /if \(q\.naverchk\)/.test(CSRC) && /if \(q\.spbatch\)/.test(CSRC) && /X\.probeLive\('naver'/.test(CSRC), '진단 길 adapt·ttbcmp·blist·naverchk·spbatch');
  ok(/if \(cfg\.on !== false && left\.length\)/.test(block) && /spSrc: h\.src/.test(block), 'SP 채우기 — 우리 기록 맞대기(새 요청 0) 먼저 · 묶음 공개 검색은 기본 켬(adapt_cfg.spBatch.on=false로 끔)');

  ok(L1.rows[0].pubYm === '2024-03' && L1.rows[0].author === '가나다', '목록 줄에 출간 연월·저자도');
  const mAll = A.spBatchMatch(L1.rows, [{ id: 'q', isbn: '9790000000028' }], { all: true }); ok(mAll.get('q').row.publisher === '시험출판' && mAll.get('q').row.pubYm === '2024-03' && mAll.get('q').row.priceList === 12000, '빈 칸 메우기 — 맞춘 줄 전체(ISBN·출판사·저자·출간 연월·정가·SP)');
  const alListItem = new Function(cut(CSRC, 'async function alListItem(p, isbn)', '\n/* ◆adapt 끝 */') + '\nreturn alListItem;')(); fx['/search/wsearchresult.aspx'] = searchPage(BOOKS);
  const li = await alListItem(fakeP, '9790000000035'); ok(li && li.salesPoint === 120345 && li.priceSales === 19800 && li.src === 'list', 'ISBN 한 권 SP = 검색 목록 한 쪽(상품 화면 안 엶)', li);
  ok((await alListItem(fakeP, '9790000000099')) === null, '목록에 같은 ISBN이 없으면 null → 상품 화면 길로');
  const spp = cut(CSRC, 'async function spPanelTick()', '\nsetInterval(() => spPanelTick()'); ok(/await alListItem\(p, isbn\)/.test(spp) && /else x = await alPubItem\(p, \{ isbn \}\)/.test(spp), 'SP 매일 표본도 목록 한 쪽 먼저 · 못 맞추면 상품 화면');
  const spb = cut(CSRC, 'async function spBatchTick(o)', '\n/* (정범님 11/11 밤 ②'); ok(/cfg = \{ on: true, maxQ: 24/.test(spb) && /listTryAt: at/.test(spb) && /fillSrc: 'list'/.test(spb) && /it\.miss\.isbn && r\.isbn13/.test(spb) && /it\.miss\.pubYm && r\.pubYm/.test(spb) && !/wproduct\.aspx/.test(spb), '벤치마킹 상품 빈 칸 메우기 — 기본 켬 · 회차 상한 · 빈 칸만 · 못 맞춘 것 7일 쉼 · 상품 화면 안 엶');

  console.log('⑨ 웹앱');
  const alertOf = new Function(cut(APP, 'const ADAPT_KN = ', '\nfunction adaptAlerts(add)') + '\nreturn adaptAlertOf;')(); const now = Date.parse('2026-11-12T00:00:00Z');
  const a1 = alertOf({ day: '2026-11-12', at: '2026-11-11T23:00:00Z', broken: ['al_product.salesPoint'], warn: [], line: 'x', n: { gold: 6 }, cands: { salesPoint: [] }, adopted: [] }, now); ok(a1 && a1.lv === 'red' && /알라딘 상품 화면 salesPoint/.test(a1.t), '깨진 칸 = 빨강(어느 화면·칸)', a1);
  ok(alertOf({ day: 'd', at: '2026-11-11T23:00:00Z', broken: [], warn: ['y24_product(화면 구조 바뀜)'] }, now).lv === 'amber' && alertOf({ day: 'd', at: '2026-11-09T00:00:00Z', broken: [], warn: [] }, now).k === 'adaptstale' && alertOf({ day: 'd', at: '2026-11-11T23:00:00Z', broken: [], warn: [] }, now) === null, '주의 = 노랑 · 점검 멈춤 = 노랑 · 문제없으면 없음');
  ok(/try \{ adaptAlerts\(add\); \} catch/.test(APP) && /\['Bestseller', '베스트셀러 \(공개 목록 화면\)'\]/.test(APP), "홈 '오늘 확인할 것'에 걸림 · 목록 종류 선택지 되살림");

  { /* (rel4 진단 11/12) 베스트셀러 목록: 첫 span.ss_p가 '(10%할인)'이면 정가를 10으로 읽던 것 */
    const h = '<html><body>' + [1, 2, 3].map((i) => `<div class="ss_book_box"><a href="/shop/wproduct.aspx?ItemId=40${i}"><b class="bo3">책${i}</b></a><ul><li><span class="ss_p">(10%할인)</span> <span class="ss_p">17,000원</span> → <span class="ss_p2"><b>15,300원</b></span></li></ul></div>`).join('') + '</body></html>';
    const LX = A.extractList(D(h)); const r0 = LX.rows[0] || {}; ok(r0.priceList === 17000 && r0.priceSales === 15300, "목록 정가 = '원' 붙은 값(할인율 10을 정가로 안 읽음)", r0); }

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exit(1); });
