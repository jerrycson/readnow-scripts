// tSELDEEP — 11/10: 판매자 깊이 읽기(seller_deep) — 알라딘 가게 판매자 정보·평가 · 예스24 가게·평가·매물 번호·설명 문장 · 공정위 통신판매사업자 조회 · 원문 저장 · 하루 상한 · 막히면 멈춤 · 바뀌면 옛 기록 남김 · 한 표 맞대기(⑥~⑭) · 우리 손님 받는 곳 맞대기
//   ① 공용 파일(readnow-ext-core.js) 순수 함수 ② 클라우드 회차(sellerDeepTick · sellerDeepRun) — 가짜 Firestore · 가짜 응답(진짜 사이트에 요청하지 않음)
// 실행: cd pw && node tSELDEEP.js   (공용 파일·클라우드는 ../readnow-ext-core.js · ../cloud/index.js — 빌드 복사본 자리) · 브라우저 필요 없음
// 시험 자료는 모두 지어낸 값(업체A·대표A·손님A·010-0000-0000·010-1234-5678 · 가게 번호 9000001… · 아이디 shopa01…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 220)); };
const ROOT = path.join(__dirname, '..'); const X = require(path.join(ROOT, 'readnow-ext-core.js'));
// ── 지어낸 화면들 ──
const alShop = (o) => `<html><body><div class="shopname">${o.name}<span class="usedseller_label_pro">전문셀러</span></div>
<div>전체상품 (${o.items || '12,345'})</div><div>배송비 : 6,000원 (30,000원 이상 무료)</div>
<div id="guide_GoodPoint"><table><tr><th>기간</th><th>평점</th><th>평가수</th><th>만족</th><th>보통</th><th>불만족</th></tr>
<tr><td>최근 6개월</td><td>91.5%</td><td>120</td><td>110</td><td>5</td><td>5</td></tr><tr><td>전체 기간</td><td>90.0%</td><td>300</td><td>270</td><td>15</td><td>15</td></tr></table></div>
<div id="guide_OutStockCancelRate">품절 취소율 최근 3개월 21.5%</div>
<div id="sellerInfoLayer" style="display:none"><h3>판매자 정보</h3><ul class="seller_infolayer_list">
<li><span class="left">상호/대표자</span><span class="right">${o.co}, ${o.rep}</span></li>
<li><span class="left">사업자등록번호</span><span class="right">${o.biz}</span></li>
<li><span class="left">통신판매업신고</span><span class="right">제 2026-가나-0000호</span></li>
<li><span class="left">사업장 주소</span><span class="right">${o.hq}</span></li>
<li><span class="left">전화번호</span><span class="right">${o.tel}</span></li>
<li><span class="left">A/S 전화번호</span><span class="right">010-1111-1111</span></li>
<li><span class="left">이메일</span><span class="right">${o.mail}</span></li>
<li><span class="left">반품 주소</span><span class="right">${o.ret}</span></li>
<li><span class="left">택배사</span><span class="right">가나택배</span></li></ul></div>
<p>공지: 반품 배송비는 6,000원입니다. 단순 변심 반품은 불가합니다.</p>
<a href="/shop/wproduct.aspx?ItemId=3000100">책1</a><a href="/shop/wproduct.aspx?ItemId=3000102">책2</a></body></html>`;
const alSurvey = `<table><tr><td class="y_usedsmall">2026-11-01</td><td>만족</td><td>손님**</td><td>빠른 배송 감사합니다</td></tr>
<tr><td class="y_usedsmall">2026-11-01</td><td>만족</td><td>손님**</td><td>빠른 배송 감사합니다</td></tr><tr><td class="y_usedsmall">2026-11-01</td><td><img alt="만족"></td><td>손님**</td><td>빠른 배송 감사합니다!</td></tr>
<tr><td class="y_usedsmall">2026-10-20</td><td>불만족</td><td>손님**</td><td>품절 취소되었어요</td></tr></table><a onclick="Page_Set('3')">3</a>`;
const y24Legal = (o) => `<div id="dPop_forecast" style="display:none;"><table><tbody>
<tr><th>업체명</th><td>${o.co}</td></tr><tr><th>대표자명</th><td>${o.rep}</td></tr><tr><th>사업자 <span>등록번호</span></th><td>${o.biz}</td></tr><tr><th>사업자 종목</th><td>도서</td></tr>
<tr><th>고객 상담 전화번호</th><td>${o.tel}</td></tr><tr><th>고객 상담 이메일</th><td>${o.mail}</td></tr><tr><th>배송 방법</th><td>타사택배(가나택배)</td></tr>
<tr><th>본사 소재지</th><td>${o.hq}</td></tr><tr><th>발송지 주소</th><td>${o.ret}</td></tr><tr><th>반품지 주소</th><td>${o.ret}</td></tr></tbody></table></div>`;
const y24Main = (o) => `${y24Legal(o)}<dd class="shop-satis"><strong class="valid-value5"></strong> (20명 평가)</dd><dd class="send-date">주문완료 후 3일</dd><a href="/Mall/Help/CS/Apply?entrNo=${o.entr}">문의</a>`;
const y24Top = `<h3 class="used-shop-name"><span class="iconC isSeller">사업자</span> 업체A님의 가게</h3><a class="click_noti" >반품 안내</a> <input class="noti_cont" type="hidden" value="반품 배송비는 6,000원입니다. 단순 변심 반품은 불가합니다. 문의 010-1234-5678" /><p><big>배송비 안내:</big> 6,000원 (30,000원 이상 구매 시 무료)</p>`;
const y24Rating = `<h4>평균 평가 : <strong class="valid-value5"></strong> (전체 <em>3</em>명)</h4><table><tbody>
<tr class="row1"><td class="col1">1</td><td class="col2"><strong class="valid-value5"><span>5점</span></strong></td><td class="col3"><a class="click_titile" >좋아요</a><p style="display:none;"> 좋아요</p></td><td class="col4">손님**&nbsp;</td><td class="col5">2026.11.04</td></tr>
<tr class="row1"><td class="col1">2</td><td class="col2"><strong class="valid-value5"><span>5점</span></strong></td><td class="col3"><a class="click_titile" >빠른 배송 감사합니다</a><p style="display:none;"> 빠른 배송 감사합니다</p></td><td class="col4">손님**&nbsp;</td><td class="col5">2026.11.04</td></tr>
<tr class="row1"><td class="col1">3</td><td class="col2"><strong class="valid-value2"><span>2점</span></strong></td><td class="col3"><a class="click_titile" >빠른 배송 감사합니다</a><p style="display:none;"> 빠른 배송 감사합니다</p></td><td class="col4">손님**&nbsp;</td><td class="col5">2026.10.01</td></tr></tbody></table>`;
const y24Left = `<a class="selected clickCate"> 국내도서 (5,000)</a><a class="selected clickCate"> 외국도서 (100)</a>`;
const y24List = `<li class="item-list-cell"><input name="ORD_GOODS_CHKBOX" value="200000101|1|1"></li><li class="item-list-cell"><input name="ORD_GOODS_CHKBOX" value="200000103|1|1"></li><li class="item-list-cell"><input name="ORD_GOODS_CHKBOX" value="200000105|1|1"></li>`;
const y24Goods = `<!-- ##########********** 상태/판매자 영역 시작 **********########## --><table><tbody><tr><th scope="row">상태<a>중고상품 상태안내</a></th><td><span class="iconC ico_used"><em class="txt">상</em></span> 표지 모서리 약간 닳음 · 본문 깨끗</td></tr></tbody></table>`;
const ftcTable = (o) => `<table class="list"><thead><tr><th>번호</th><th>통신판매번호</th><th>신고기관명</th><th>상호</th><th>사업자등록번호</th><th>법인여부</th><th>대표자명</th><th>전화번호</th><th>운영상태</th><th>신고일자</th><th>사업장소재지</th></tr></thead>
<tbody><tr><td>1</td><td>제2026-가나-0000호</td><td>가나구청</td><td>${o.co}</td><td>${o.biz}</td><td>개인</td><td>${o.rep}</td><td>010-0000-0000</td><td>통신판매업 신고</td><td>2024-03-02</td><td>${o.hq}</td></tr></tbody></table><a href="javascript:fn_view('123')" onclick="fn_detailView('2026')">보기</a>`;
const SA = { name: '가게A', co: '업체A', rep: '대표A', biz: '123-45-67890', tel: '010-0000-0000', mail: 'a@example.com', hq: '서울특별시 가나구 다라로 1 (마바빌딩) 101호', ret: '서울특별시 가나구 다라로 1 (마바빌딩) 505호', entr: '9000002' };

(async () => {
  console.log('① 알라딘 가게 첫 화면 · 평가 · 예스24 평가·목록·설명 · 공정위 읽기');
  const I = X.alShopInfoOf(alShop(SA));
  ok(I.grade === '전문셀러' && I.isPro && I.legal && I.legal.co === '업체A' && I.legal.rep === '대표A' && I.legal.bizNo === '123-45-67890' && /2026-가나/.test(I.legal.mo) && I.legal.ret === SA.ret && I.legal.hq === SA.hq && I.legal.tel === '010-0000-0000' && I.legal.asTel === '010-1111-1111' && I.legal.mail === 'a@example.com' && I.legal.carrier === '가나택배', '판매자 정보 칸(상호/대표자 한 줄 나눔·사업자 번호·신고번호·주소·전화·A/S·메일·반품지·택배사) 원문 그대로', I.legal);
  ok(I.legal.retF && I.legal.retK && I.legal.hqF && I.legal.telH && I.legal.repH && I.info['반품 주소'] === SA.ret, '원문과 함께 맞대기 열쇠(예스24와 같은 함수) · 칸 이름 그대로 원문(info)', Object.keys(I.info));
  ok(I.periods['최근 6개월'].count === 120 && I.periods['전체 기간'].rating === 0.9 && I.cancel3m === 0.215 && I.items === 12345 && I.lids.join() === '3000100,3000102' && /6,000원/.test(I.shipTxt), '만족도 표·품절 취소율·상품 수·첫 쪽 매물 번호·배송비 글', { p: I.periods, c: I.cancel3m, items: I.items });
  ok(X.alShopInfoOf('<div id="sellerInfoLayer"><p>최근 7일 내 거래 고객에게만 연락처 제공</p></div>').infoNote && !X.alShopInfoOf('<div id="sellerInfoLayer"><p>최근 7일 내 거래 고객에게만 연락처 제공</p></div>').legal, '개인셀러(연락처 비공개 안내뿐) → 고지 없음·안내 글만');
  const S = X.alSurveyRows(alSurvey); ok(S.rows.length === 4 && S.rows[0].d === '2026-11-01' && S.rows[0].r === 'good' && S.rows[3].r === 'bad' && S.rows[2].r === 'good' && S.last === 3 && S.rows.every((x) => x.u === '손님**'), '알라딘 평가 줄(날짜·만족도·글 원문) · 평가 쓴 아이디도 원문 그대로(11/10 fence3 — 정범님 정보 수집 막지 말 것)', S.rows[3]);
  { const F = X.sfpRevFp(S.rows); ok(F.idN === 1 && F.uRep === 1 && F.ids[0].u === '손님**' && F.ids[0].c === 4, '⑨ 같은 아이디 반복(진짜 손님인지 꾸민 평가인지 가릴 근거)', F); }
  const YR = X.y24RatingRows(y24Rating); ok(YR.length === 3 && YR[0].s === 5 && YR[0].d === '2026-11-04' && YR[1].c === '빠른 배송 감사합니다' && YR.every((x) => x.u === '손님**'), '예스24 평가 줄(점수·글 원문·날짜·평가 쓴 아이디 원문)', YR);
  ok(X.y24ShopIds(y24List).join() === '200000101,200000103,200000105', '예스24 가게 목록 → 매물 번호');
  const GD = X.y24GoodsDesc(y24Goods); ok(GD && GD.g === '상' && /모서리/.test(GD.t) && GD.h, '예스24 낱개 매물 → 상태 설명 문장 + 지문', GD);
  const F = X.ftcParse(ftcTable(SA)); const f0 = F.rows[0] || {};
  ok(F.ok && f0.co === '업체A' && f0.rep === '대표A' && f0.bizNo === '123-45-67890' && f0.date === '2024-03-02' && f0.state === '통신판매업 신고' && f0.addr === SA.hq && /0000호/.test(f0.mo) && f0.org === '가나구청' && f0.raw['사업장소재지'] === SA.hq && F.links.length, '공정위 표(칸 이름으로 맞춤) → 신고번호·기관·상호·대표자·신고일·상태·소재지 + 원문 칸(raw)', f0);
  ok(X.ftcParse('<p>검색된 결과가 없습니다.</p>').none === true && X.ftcParse('<p>자동입력 방지 문자를 입력하세요</p>').blocked === true && X.ftcParse('<p>뭔가 다른 화면</p>').ok === false, '공정위: 결과 없음 · 캡차 → 막힘 · 모르는 화면 → 실패(ok:false)');
  const FA = X.ftcApiParse(JSON.stringify({ response: { body: { items: { item: [{ prmmiMnno: '2026-가나-0000', bzmnNm: '업체A', brno: '1234567890', rprsvNm: '대표A', operSttusCdNm: '정상영업', dclrDate: '20240302' }] } } } })); ok(FA.ok && FA.rows[0].bizNo === '123-45-67890' && FA.rows[0].rep === '대표A' && FA.rows[0].date === '2024-03-02' && FA.rows[0].state === '정상영업', '공공데이터포털 응답(JSON)도 같은 칸으로', FA.rows[0]);
  ok(X.ftcUrl('123-45-67890').includes('searchKrwd=1234567890') && X.ftcApiUrl('1234567890', 'K').includes('brno=1234567890'), '공정위 조회 주소(사업자 번호 숫자만)');

  console.log('② 지문 셈 ⑥⑧⑨⑫⑬ · 한 표 맞대기 · 우리 손님 받는 곳');
  const RP = X.sfpRetPara('반품 배송비는 6,000원입니다. 단순 변심 반품은 불가합니다. 주말 발송 없음'); const RP2 = X.sfpRetPara('반품  배송비는 6,000원 입니다!  단순 변심 반품은 불가합니다 · 문의 010-1234-5678');
  ok(RP && RP.fee === 6000 && RP.n === 2 && RP2 && RP.h === RP2.h, '⑧ 반품 문구 지문(띄어쓰기·문장부호·전화번호 달라도 같음) · 반품 배송비', { RP, RP2 });
  const RV = X.sfpRevFp(S.rows); ok(RV.n === 4 && RV.maxDay.d === '2026-11-01' && RV.maxDay.c === 3 && RV.burst === 0.75 && RV.dupR === 0.75 && RV.texts[0].c === 3, '⑨ 평가가 한 날 몰림(3/4)·같은 글 되풀이(문장부호 무시)', RV);
  const B = X.sfpIdBlocks([{ id: '9000001' }, { id: '9000050' }, { id: '9000120', join: '2024-03-02' }, { id: '5000000' }], 100); ok(B.length === 1 && B[0].ids.length === 3 && B[0].span === 119 && B[0].joinFrom === '2024-03-02', '⑥ 판매자 번호 묶음(간격 100 안) · 가입 시기', B);
  ok(X.sfpIdShape('shopa01').stem === 'shopa' && X.sfpIdShape('ab1') === null && X.sfpCatSim([{ n: '국내', c: 100 }, { n: '외국', c: 2 }], [{ n: '국내', c: 5000 }, { n: '외국', c: 100 }]) > 0.99, '⑬ 아이디 머리글 · 분야 구성 닮음(코사인)');
  const idx = X.sfpCustIdx([{ address: '서울특별시 가나구 다라로 1 (마바빌딩) 505호' }, { address: '부산광역시 다른구 1' }]); const AM = X.sfpAddrMatch(I.legal, idx); ok(AM && AM.retF === 1 && AM.retK === 1 && AM.hqK === 1 && !AM.hqF, '판매자 반품지 = 우리 손님 받는 곳(같은 호수 1 · 같은 건물) — 결과는 수만', AM);
  const yL = X.y24LegalOf(y24Main(SA)); const ents = [
    { key: 'al_9000001', plat: 'al', id: '9000001', legal: I.legal, retPara: RP, rev: RV, seqIds: ['3000100', '3000102', '3000104'] },
    { key: 'al_9000050', plat: 'al', id: '9000050', legal: X.sfpLegalKeys({ co: '업체Z', ret: '서울특별시 가나구 다라로 1 505호', carrier: '가나택배' }), seqIds: ['3000101', '3000103', '3000105'], ftc: { rep: '대표A' } },
    { key: 'y24_shopa01', plat: 'y24', id: 'shopa01', num: '9000002', legal: yL, retPara: RP2, cats: [{ n: '국내', c: 5000 }], items: 5000 },
    { key: 'y24_shopa02', plat: 'y24', id: 'shopa02', num: '9000003', legal: null, cats: [{ n: '국내', c: 900 }], items: 900, descH: [GD.h] },
    { key: 'y24_other', plat: 'y24', id: 'other', descH: [GD.h] }];
  const DP = X.sfpDeep(ents); const pr = (a, b) => DP.pairs.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
  const p1 = pr('al_9000001', 'y24_shopa01'); ok(p1 && p1.strong && p1.cross && ['사업자 등록번호 같음', '반품지 같은 호수', '대표자명 같음', '상호 같음', '반품·교환 문구 같음', '메일 같음'].every((w) => p1.why.includes(w)), '알라딘↔예스24 같은 사업자(번호·반품지 호수·대표자·상호·메일·반품 문구)', p1);
  const p2 = pr('al_9000001', 'al_9000050'); ok(p2 && p2.why.includes('반품지 같은 호수') && p2.why.some((w) => /판매자 번호 붙음/.test(w)) && p2.why.some((w) => /매물 번호 이웃 5번/.test(w)) && p2.why.includes('공정위 대표자 = 가게 고지 대표자') && p2.why.includes('같은 택배사·같은 출고 건물'), '알라딘 두 가게: 괄호 건물 이름 달라도 같은 호수 · 번호 붙음 ⑥ · 매물 번호 번갈아 ⑫ · 공정위 대표자 ⑦택배사', p2);
  const p3 = pr('y24_shopa01', 'y24_shopa02'); ok(p3 && p3.why.includes('아이디 머리글 같음(끝 번호만 다름)') && p3.why.some((w) => /분야 구성 닮음/.test(w)) && p3.why.some((w) => /판매자 번호 붙음/.test(w)), '⑬ 아이디 꼴·분야 구성 · ⑥ 예스24 가게 번호 붙음', p3);
  ok(pr('y24_shopa02', 'y24_other').why.includes('매물 설명 문장 같음'), '⑭ 매물 설명 문장 같음'); ok(DP.blocks.al.length === 1 && DP.seq.al['al_9000001'].n === 3, '번호 묶음·등록 차례 요약', DP.blocks);

  console.log('③ 클라우드 회차 — 가짜 Firestore · 가짜 응답');
  const src = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const i0 = src.indexOf('let sdpAt = 0;'); const i1 = src.indexOf('/* (정범님 11/09) 🟦 예스24 시장 지표 — 알라딘 시장 지표와 따로'); ok(i0 > 0 && i1 > i0, '클라우드에 sellerDeepTick 있음');
  ok(/const sd = await sellerDeepTick\(\); if \(sd\) out\.sellerDeep = sd;/.test(src), '판매자 지문 회차 옆에서 부름');
  const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
  const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); const cp = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v))); let auto = 0;
    const Q = (n, fl, lim) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]], lim), select: () => Q(n, fl, lim), limit: (x) => Q(n, fl, x), orderBy: () => Q(n, fl, lim),
      get: async () => { const L = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => { const a = get(v, k); return a != null && (op === '>=' ? a >= x : op === '>' ? a > x : op === '==' ? a === x : op === 'in' ? x.includes(a) : true); })).slice(0, lim || 1e9); const docs = L.map(([id, v]) => ({ id, exists: true, data: () => cp(v) })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } });
    const C = (n) => ({ ...Q(n, [], 0), add: async (v) => { col(n)['a' + ++auto] = cp(v); }, doc: (id) => ({ get: async () => ({ exists: !!col(n)[id], data: () => cp(col(n)[id]) }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...cp(v) } : cp(v); } }) });
    return { D, C }; };
  const page = (status, text) => ({ ok: status >= 200 && status < 300, status, url: 'https://x/', headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => Buffer.from(text, 'utf8') });
  const SITE = (o) => (u) => { const s = String(u); if (/wshopitem/.test(s)) return page(200, alShop(o.al || SA)); if (/wshopsurvey/.test(s)) return page(200, alSurvey); if (/ftc\.go\.kr/.test(s)) return page(200, ftcTable(SA)); if (/\/main$/.test(s)) return page(200, y24Main(o.y24 || SA)); if (/Main_topnotice/.test(s)) return page(200, y24Top); if (/SellerRating/.test(s)) return page(200, y24Rating); if (/Main_leftmenu/.test(s)) return page(200, y24Left); if (/Main_searchresult/.test(s)) return page(200, y24List); if (/Product\/Goods\//.test(s)) return page(200, y24Goods); return page(404, 'none'); };
  const run = async (FS, site, force = true, deep = false) => { const calls = []; const logs = []; const env = { env: {} };
    const f = new Function('C', 'extMod', 'fetch', 'nowIso', 'log', 'sleep', 'UA', 'VER', 'process', src.slice(i0, i1) + '\nreturn { sellerDeepTick, sellerDeepRun };')(FS.C, async () => X, async (u) => { calls.push(String(u)); return site(u); }, () => new Date().toISOString(), (...m) => logs.push(m.join(' ')), async () => {}, 'UA', 'test', env);
    const out = deep ? await f.sellerDeepRun(X, (FS.D.app_settings || {}).seller_deep_state || {}, FS.C('app_settings').doc('seller_deep_state'), true) : await f.sellerDeepTick(force); return { out, calls, logs }; };
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  // 알라딘 대상 + 같은 사업자 번호의 예스24 카드가 이미 있음
  const F1 = mkFS(); F1.D.app_settings = { seller_deep_state: { runHour: 24, targets: [{ plat: 'al', id: '9000001', why: '무리' }] } }; F1.D.y24_sellers = { shopa01: { legal: X.y24LegalOf(y24Main(SA)) } }; F1.D.sellers = { sc_9000099: { grade: 'fake', sc: '9000099' }, seller_x: { grade: 'fake' } };
  const R1 = await run(F1, SITE({})); const A1 = (F1.D.seller_deep || {}).al_9000001 || {};
  ok(R1.calls.length === 3 && /wshopitem\.aspx\?SC=9000001/.test(R1.calls[0]) && /wshopsurvey/.test(R1.calls[1]) && /ftc\.go\.kr.*searchKrwd=1234567890/.test(R1.calls[2]), '알라딘 대상: 가게 첫 화면 → 평가 1쪽 → 공정위(사업자 번호) 3화면', R1.calls);
  ok(A1.legal && A1.legal.rep === '대표A' && A1.legal.ret === SA.ret && A1.legal.tel === '010-0000-0000' && A1.src.shop && A1.src.ftc && A1.at && A1.day === day && A1.reviews.length === 4 && A1.rev.dupR === 0.75 && A1.retPara.fee === 6000 && /단순 변심/.test(A1.shopTxt) && A1.seqIds.length === 2, 'seller_deep/al_{번호}: 원문 전부(대표자·주소·전화)·받은 시각·출처 주소·평가 글·반품 문구·가게 글', Object.keys(A1));
  ok(A1.ftc && A1.ftc.rows[0].rep === '대표A' && A1.ftcRow.date === '2024-03-02' && A1.join === '2024-03-02' && F1.D.seller_deep_ftc['1234567890'].day === day, '공정위 결과(신고일 = 가입 시기)를 함께 · seller_deep_ftc/{번호}에 오늘 표시', A1.ftcRow);
  const st1 = F1.D.app_settings.seller_deep_state; ok(st1.n === 3 && st1.day === day && st1.auto && st1.auto.some((x) => x.plat === 'y24' && x.id === 'shopa01'), '하루 쓴 화면 수 · 같은 사업자 번호 예스24 가게를 깊이 읽기 목록에 더함(가게 아이디 넓히기)', st1.auto);
  // 둘째 회차: 자동으로 더한 예스24 가게(설정 → 자동 → 시트 차례)
  const R3 = await run(F1, SITE({})); const Y1 = F1.D.seller_deep.y24_shopa01 || {};
  ok(R3.calls.length === 7 && R3.calls.filter((u) => /Product\/Goods/.test(u)).length === 2 && Y1.legal && Y1.legal.rep === '대표A' && Y1.notesRaw[0].b.includes('010-1234-5678') && Y1.reviews.length === 3 && Y1.seqIds.length === 3 && Y1.desc.length === 2 && Y1.entr === '9000002' && Y1.cats.length === 2, '예스24 가게: 첫 화면·공지·평가·분야·목록·낱개 2개(7화면) · 공지 원문(전화 가림 없이)·평가 글·매물 번호·설명 문장', { calls: R3.calls.length, k: Object.keys(Y1) });
  // (11/10 fence3) 시트 허위 매물 표시는 기본으로 대상 고르기에 안 씀(정범님 11/09 밤 — 허위 판단 근거로 쓰지 않음) · 정범님이 fake:true로 켤 때만
  const R2a = await run(F1, SITE({})); ok(R2a.calls.length === 0 && !(F1.D.seller_deep || {}).al_9000099, '시트 허위 매물 표시는 기본으로 깊이 읽기 대상에 안 넣음(판단 근거로 안 씀)', R2a.calls);
  F1.D.app_settings.seller_deep_state.fake = true;
  // 셋째: 시트 허위 매물 번호(정범님이 켰을 때만) — 공정위는 사업자 번호 하나에 하루 한 번
  const R2 = await run(F1, SITE({ al: { ...SA, name: '가게B' } })); ok(R2.calls.length === 2 && !R2.calls.some((u) => /ftc/.test(u)) && F1.D.seller_deep.al_9000099 && F1.D.seller_deep.al_9000099.ftc && F1.D.seller_deep.al_9000099.why === '시트 허위 매물', '시트 허위 매물 표시(번호 있는 것)도 대상 · 같은 사업자 번호 공정위는 오늘 다시 안 물음(저장된 결과 씀)', R2.calls);
  ok(F1.D.app_settings.seller_deep_state.n === 12, '오늘 쓴 화면 수 3+2+7', F1.D.app_settings.seller_deep_state.n);
  // 모두 새로 읽었으면 아무것도 안 읽음
  const R4 = await run(F1, SITE({})); ok(R4.calls.length === 0 && R4.out === null, '모두 refreshDays 안이면 읽지 않음');
  // 바뀜: 오래된 기록 → 다시 읽으니 반품지가 바뀜 → 옛 기록 통째로 남김
  F1.D.seller_deep.al_9000001.at = '2020-01-01T00:00:00Z'; const R5 = await run(F1, SITE({ al: { ...SA, ret: '서울특별시 가나구 다라로 9 202호' } })); const CHG = Object.values(F1.D.seller_deep_changes || {});
  ok(R5.calls.length === 2 && CHG.length === 1 && CHG[0].key === 'al_9000001' && CHG[0].prev.legal.ret === SA.ret && F1.D.seller_deep.al_9000001.legal.ret === '서울특별시 가나구 다라로 9 202호', '바뀌면 seller_deep_changes에 옛 기록 통째로(지우지 않음)', CHG.map((c) => c.key));
  // 하루 상한
  const F2 = mkFS(); F2.D.app_settings = { seller_deep_state: { runHour: 24, cap: 5, day, n: 5, targets: ['al:9000001'] } }; const R6 = await run(F2, SITE({})); ok(R6.calls.length === 0 && !Object.keys(F2.D.seller_deep || {}).length, '하루 상한(cap) 다 쓰면 읽지 않음');
  const F2b = mkFS(); F2b.D.app_settings = { seller_deep_state: { runHour: 24, cap: 5, day, n: 4, targets: ['y24:shopa01'] } }; const R6b = await run(F2b, SITE({})); const P6 = (F2b.D.seller_deep || {}).y24_shopa01 || {};
  ok(R6b.calls.length === 1 && P6.partial === true && F2b.D.app_settings.seller_deep_state.n === 5, '상한 가까우면 읽을 만큼만 · 덜 읽음(partial) 표시 → 다음 날 다시', { calls: R6b.calls.length, partial: P6.partial });
  // 막힘(429·캡차)이면 멈춤
  const F3 = mkFS(); F3.D.app_settings = { seller_deep_state: { runHour: 24, targets: ['al:9000001'] } }; const R7 = await run(F3, () => page(429, 'too many requests')); const st3 = F3.D.app_settings.seller_deep_state;
  ok(R7.calls.length === 1 && Date.parse(st3.stopUntil) > Date.now() + 5 * 3600e3 && /429/.test(st3.stopWhy) && !(F3.D.seller_deep && F3.D.seller_deep.al_9000001 && F3.D.seller_deep.al_9000001.legal), '403/429면 6시간 멈춤 · 아무 기록도 덮지 않음', { stopWhy: st3.stopWhy });
  const R8 = await run(F3, SITE({})); ok(R8.calls.length === 0 && R8.out && /멈춤/.test(R8.out.stop), '멈춘 동안은 읽지 않음', R8.out);
  const F3b = mkFS(); F3b.D.app_settings = { seller_deep_state: { runHour: 24, targets: ['al:9000001'] } }; await run(F3b, (u) => (/ftc/.test(String(u)) ? page(200, '<p>자동입력 방지 문자를 입력하세요</p>') : SITE({})(u))); const st3b = F3b.D.app_settings.seller_deep_state;
  ok(F3b.D.seller_deep.al_9000001.legal && Date.parse(st3b.ftcStopUntil) > Date.now() && !st3b.stopUntil, '공정위만 캡차면 공정위만 멈춤(알라딘 읽기는 그대로 저장)', { ftcStopWhy: st3b.ftcStopWhy });
  const F4 = mkFS(); F4.D.app_settings = { seller_deep_state: { on: false, targets: ['al:9000001'] } }; const R9 = await run(F4, SITE({})); ok(R9.out === null && R9.calls.length === 0, '끄기(on:false)면 아무것도 안 함');

  console.log('④ 하루 한 번 한 표 맞대기(새 화면 0) · 우리 손님 받는 곳 — 결과는 일치 수만');
  F1.D.crm_customers = { c1: { addresses: [{ zip: '47111', address: '서울특별시 가나구 다라로 1 (마바빌딩) 505호', recipientNames: ['손님A'] }] }, c2: { addresses: [{ address: '부산광역시 다른구 1' }] } };
  F1.D.sellers.sc_9000050 = { bizNo: '999-99-99999', company: '업체Z', returnAddress: '서울특별시 가나구 다라로 1 505호' };
  const R10 = await run(F1, SITE({}), true, true); const RUN = (F1.D.seller_fp_runs || {})[day + '_deep'] || {}; const J = JSON.stringify({ r: RUN, fp: F1.D.seller_fp });
  ok(R10.calls.length === 0 && RUN.n >= 4 && RUN.pairs.some((p) => p.cross && p.strong) && RUN.custN === 2, '새로 읽는 화면 0 · 깊이 읽은 판매자 + 예스24 카드 + 알라딘 판매자 사업자 칸을 한 표로', { n: RUN.n, pairs: RUN.pairs && RUN.pairs.length });
  const o99 = (RUN.ourAddr || []).find((x) => x.key === 'al_9000099'); const o50 = (RUN.ourAddr || []).find((x) => x.key === 'al_9000050');
  ok(o99 && o99.m.retF === 1 && o50 && o50.m.retF === 1 && F1.D.seller_fp.al_9000050.deep.ourAddr.retF === 1, '판매자 반품지 = 우리 손님 받는 곳(호수까지 1명) — 판매자 번호와 수만', RUN.ourAddr);
  ok(!/손님A|47111|부산광역시 다른구/.test(J) && (RUN.ourAddr || []).every((x) => Object.keys(x).join() === 'key,m' && Object.values(x.m).every((v) => typeof v === 'number')), '맞대기 결과에 손님 이름·손님 주소·손님 번호 없음(판매자 번호와 일치 수만)');
  ok(F1.D.seller_fp.y24_shopa01.deep.pairs.some((p) => p.o === 'al_9000001' && p.why.includes('사업자 등록번호 같음')) && F1.D.app_settings.seller_deep_state.runDay === day, 'seller_fp/{plat}_{id}.deep에 짝 · 오늘 몫 표시', F1.D.app_settings.seller_deep_state.lastRun);
  console.log(bad ? `❌ tSELDEEP 실패 ${bad}` : '✓ tSELDEEP 통과'); process.exitCode = bad ? 1 : 0; })();
