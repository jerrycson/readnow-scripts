/* 시험용 가짜 알라딘 공개 상품 화면 — 운영 parseProductPage가 읽는 자리(제목·지은이·출판사·날짜·기본 정보·분류·가격)를 갖춤
 * 실제 책·손님 정보 없음(지어낸 값) */
const BOOKS = {
  '100001': { title: '시험 책 하나', sub: '부제 하나', series: '시험 총서', authors: [{ name: '지은이가', role: '지은이', id: '501' }, { name: '옮긴이나', role: '옮긴이', id: '502' }], publisher: '시험출판', pubId: '9001', date: '2024-03-15', pages: 312, weight: 480, size: '148*210*20mm', isbn: '9790000000011', cats: [{ path: ['국내도서', '소설/시/희곡', '한국소설'], cids: ['1', '50993', '50994'] }], priceList: 16800, priceSales: 15120 },
  '100002': { title: '시험 책 둘', sub: null, series: null, authors: [{ name: '글쓴이다', role: '지은이', id: '503' }], publisher: '둘출판', pubId: '9002', date: '2021-11-02', pages: 128, weight: 210, size: '128*188mm', isbn: '9790000000028', cats: [{ path: ['국내도서', '어린이'], cids: ['1', '1108'] }], priceList: 12000, priceSales: 10800 },
  '100003': { title: '시험 책 셋', sub: '셋째', series: null, authors: [{ name: '세번째', role: '지은이', id: '504' }], publisher: '셋출판', pubId: '9003', date: '2019-05-20', pages: 256, weight: 390, size: '152*225mm', isbn: '9790000000035', cats: [{ path: ['국내도서', '인문학'], cids: ['1', '656'] }], priceList: 18000, priceSales: 16200 },
  '100004': { title: '시험 책 넷', sub: null, series: null, authors: [{ name: '네번째', role: '지은이', id: '505' }], publisher: '넷출판', pubId: '9004', date: '2020-01-10', pages: 200, weight: 300, size: '140*200mm', isbn: '9790000000042', cats: [{ path: ['국내도서', '에세이'], cids: ['1', '55889'] }], priceList: 14000, priceSales: 12600 },
};
function productHtml(id) { const b = BOOKS[id]; if (!b) return null;
  const au = b.authors.map((a) => `<a href="/Search/wSearchResult.aspx?AuthorSearch=@${a.id}">${a.name}</a> (${a.role})`).join(', ');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${b.title} | 알라딘</title><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}">
<meta property="og:image" content="https://image.aladin.co.kr/product/${id}/cover.jpg"><meta property="books:isbn" content="${b.isbn}"></head><body>
<script>document.title = document.title; window.__pageScriptRan = 1;</script>
<div class="Ere_prod_titlewrap"><ul><li class="tlist"><span class="Ere_bo_title">${b.title}</span>${b.sub ? `<span class="Ere_sub1_title"> - ${b.sub}</span>` : ''}${b.series ? ` <a href="/shop/common/wseriesitem.aspx?SRID=1">${b.series}</a>` : ''}</li>
<li class="Ere_sub2_title">${au} | <a href="/search/wsearchresult.aspx?PublisherSearch=${encodeURIComponent(b.publisher)}@${b.pubId}">${b.publisher}</a> | ${b.date}</li></ul></div>
<div class="Ere_prod_Binfowrap"><ul class="info_list"><li><div class="Litem">정가</div><div class="Ritem"><del>${b.priceList.toLocaleString('en-US')}원</del></div></li><li><div class="Litem">판매가</div><div class="Ritem"><em itemprop="price">${b.priceSales.toLocaleString('en-US')}</em>원</div></li></ul></div>
<div class="conts_info_list1"><ul><li>${b.pages}쪽</li><li>${b.size}</li><li>${b.weight}g</li><li>ISBN : ${b.isbn}</li></ul></div>
<ul id="ulCategory">${b.cats.map((c) => `<li>${c.path.map((p, i) => `<a href="/shop/wbrowse.aspx?CID=${c.cids[i]}">${p}</a>`).join(' &gt; ')}</li>`).join('')}</ul>
<img id="CoverMainImage" src="https://image.aladin.co.kr/product/${id}/cover500.jpg">
</body></html>`; }
module.exports = { BOOKS, productHtml };
