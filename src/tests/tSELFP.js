// tSELFP — 11/10: 판매자 지문(seller_fp) — 예스24 가게 문서의 법정 고지(숨은 '판매자 정보' 표) 읽기 · 판매자마다 운영 버릇·시간 행동 · 판매자끼리 겹침 · 예스24↔알라딘 맞대기
//   ① 공용 파일(readnow-ext-core.js) 순수 함수 ② 클라우드 회차(sellerFpTick) — 가짜 Firestore · 새로 읽는 화면 0(fetch를 부르면 실패) · 하루 한 번 · 끄기
// 실행: cd pw && node tSELFP.js   (공용 파일·클라우드는 ../readnow-ext-core.js · ../cloud/index.js — 빌드 복사본 자리) · 브라우저 필요 없음
// (11/10 밤) 법정 고지는 원문 저장으로 바뀜(정범님 11/09 밤) · ⑫ 매물 번호 차례 · ⑬ 아이디 꼴
// 시험 자료는 모두 지어낸 값(업체A·대표A·010-0000-0000 · 가게 아이디 shopA…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 240)); };
const ROOT = path.join(__dirname, '..'); const X = require(path.join(ROOT, 'readnow-ext-core.js'));
// 가게 첫 화면 문서 꼴(실제 화면을 줄여 흉내 — 사업자 판매자만 숨은 팝업 표가 있음)
const legalDoc = (o) => `<div class="shop-info"><a onclick="$.yesPop('dPop_forecast',this)" title="판매자 정보">판매자 정보</a></div>
<div id="dPop_forecast" style="display:none;"><div class="popYUI_tit"><h1>판매자 정보</h1></div><table class="tb_nor tb_vertical"><caption>판매자 정보</caption><tbody class="b_size">
<tr><th scope="row" class="txtNor ac">업체명</th><td class="txtNor lastCol"><a href="#" class="txD_uln">${o.co}</a></td></tr>
<tr><th scope="row" class="txtNor ac">대표자명</th><td class="txtNor lastCol">${o.rep}</td></tr>
<tr><th scope="row" class="txtNor ac">사업자 <span class="ws_n">등록번호</span></th><td class="txtNor lastCol">${o.biz}</td></tr>
<tr><th scope="row" class="txtNor ac">사업자 종목</th><td class="txtNor lastCol">도서</td></tr>
<tr><th scope="row" class="txtNor ac">고객 상담 <span class="ws_n">전화번호</span></th><td class="txtNor lastCol">${o.tel}</td></tr>
<tr><th scope="row" class="txtNor ac">고객 상담 <span class="ws_n">이메일</span></th><td class="txtNor lastCol"><a href="mailto:${o.mail}">${o.mail}</a></td></tr>
<tr><th scope="row" class="txtNor ac">배송 방법</th><td class="txtNor lastCol">타사택배(${o.car || '가나택배'})</td></tr>
<tr><th scope="row" class="txtNor ac">본사 소재지</th><td class="txtNor lastCol">${o.hq}</td></tr>
<tr><th scope="row" class="txtNor ac">발송지 주소</th><td class="txtNor lastCol">${o.from}</td></tr>
<tr><th scope="row" class="txtNor ac">반품지 주소</th><td class="txtNor lastCol">${o.ret}</td></tr></tbody></table></div>
<dd class="shop-satis"><a><strong class="valid-value4"><span>4점</span></strong></a> (<a><span>20</a>명</span> 평가)</dd><dd class="send-date">주문완료 후 2일</dd><a href="/Mall/Help/CS/Apply?entrNo=111">문의</a>
<div class="footer">예스이십사(주) 사업자등록번호 : 000-00-00000 통신판매업신고 : 제 0000-00000호</div>`;
const LA = { co: '업체A', rep: '대표A', biz: '1234567890', tel: '010-0000-0000', mail: 'shopa@example.com', hq: '서울특별시 가나구 다라동 12-3 (마바빌딩) 101호', from: '서울특별시 가나구  다라동 12-3 (마바빌딩) 505호', ret: '서울특별시 가나구 다라동 12-3 (마바빌딩) 505호' };
(async () => {
  console.log('① 법정 고지 — 사업자 판매자 가게 문서의 숨은 판매자 정보 표');
  const L = X.y24LegalOf(legalDoc(LA)); const J = JSON.stringify(L);
  ok(L && L.co === '업체A' && L.repH && L.rep === '대표A' && L.bizNo === '123-45-67890' && L.kind === '도서' && L.carrier === '가나택배' && L.v === 3, '업체명·대표자명·사업자 등록번호(꼴 맞춤)·종목·택배사는 원문 + 대표자 맞대기 열쇠(repH)', L);
  ok(L.telH && L.mailH && L.tel === '010-0000-0000' && L.mail === 'shopa@example.com', '(정범님 11/09 밤) 상담 전화·메일도 원문 그대로 + 맞대기 열쇠', { tel: L.tel, telH: L.telH, mailH: L.mailH });
  ok(L.retF && L.retK && L.retF !== L.retK && L.fromF === L.retF && L.hqK === L.retK && L.retR === '서울특별시 가나구' && L.hqR === L.retR, '주소: 호수까지(F)·건물까지(K) 지문 · 괄호 건물 이름·띄어쓰기 무시 · 지역은 시·도+시·군·구까지만 원문', { retF: L.retF, retK: L.retK, retR: L.retR });
  ok(L.ret === LA.ret && L.hq === LA.hq && /505호/.test(L.from) && L.hqF && L.all && L.all['반품지 주소'] === LA.ret && Object.keys(L.all).length === 10, '본사·발송지·반품지 주소 원문 그대로(같은 판매자 직결·실 수령지 견줌용) · 표의 모든 줄 원문(all)', Object.keys(L));
  ok(!J.includes('000-00-00000'), '화면 아래 예스24 자기 사업자 정보(꼬리말)는 섞이지 않음');
  ok(X.y24LegalOf('<div class="shop-satis">개인 판매자 가게</div>') === null, '개인 판매자(표 없음) → null');
  const card = X.y24SellerCard({ main: legalDoc(LA), top: '<h3 class="used-shop-name"><span class="iconC isSeller">사업자</span> 업체A님의 가게</h3>', rating: '' }, 'shopA', { at: '2026-11-10T00:00:00Z' });
  ok(card.v === 2 && card.legal && card.legal.bizNo === '123-45-67890' && card.entr === '111' && card.biz === true, '판매자 카드(y24_sellers)에 legal이 함께 들어감(이미 읽는 가게 첫 화면 — 새 화면 없음)', { v: card.v, legal: !!card.legal });
  const card2 = X.y24SellerCard({ main: '', top: '', rating: legalDoc({ ...LA, co: '업체B' }) }, 'shopB'); ok(card2.legal && card2.legal.co === '업체B', '첫 화면에 없으면 평가 화면 문서에서도 찾음');
  const AK = X.sfpAddrKey('경기도 가나시 다라로 7, 2층'); ok(AK.K === '경기가나시다라로7' && AK.F === '경기가나시다라로7,2층', '층 빼기 · 경기도→경기', AK);

  console.log('② 운영 버릇 · 시간 행동');
  const H = X.sfpHabits([{ isbn: 'a', p: 12900, g: '상', s: 3000, fo: 30000 }, { isbn: 'b', p: 8900, g: '상', s: 3000, fo: 30000 }, { isbn: 'c', p: 7500, g: '중', s: 3000, fo: 30000, rem: 3, cmt: '빠른 발송 합니다' }, { isbn: 'c', p: 9900, g: '최상', s: 3000, fo: 30000 }]);
  ok(H.n === 4 && H.books === 3 && H.end3.k === '900' && H.end3.c === 3 && H.ship.k === '3000/30000' && H.ship.r === 1 && H.multiR === 0.25 && H.cmtH.c === 1, '값 끝자리 버릇(900 셋)·배송비/무료 기준·여러 권 표기 비율·한마디 지문', H);
  const T0 = Date.parse('2026-10-01T00:00:00Z'); const at = (h) => new Date(T0 + h * 3600e3).toISOString(); const pg = (rows) => rows.map(([id, sid, p], i) => ({ r: i + 1, id, sid, p, g: '상' }));
  const CH = [
    { isbn: '978A', at: at(0), prevSig: null, diff: { first: true, add: ['a1', 'a2'], gone: [], px: [] }, page: pg([['a1', 'shopA', 5000], ['a2', 'shopB', 6000]]) },
    { isbn: '978A', at: at(24), prevSig: 's1', diff: { add: [], gone: [], px: [{ id: 'a1', from: 5000, to: 4500 }] }, page: pg([['a1', 'shopA', 4500], ['a2', 'shopB', 6000]]) },
    { isbn: '978A', at: at(48), prevSig: 's2', diff: { add: [], gone: [], px: [{ id: 'a2', from: 6000, to: 4400 }] }, page: pg([['a2', 'shopB', 4400], ['a1', 'shopA', 4500]]) },
    { isbn: '978A', at: at(72), prevSig: 's3', diff: { add: ['a3'], gone: ['a1'], px: [] }, page: pg([['a2', 'shopB', 4400], ['a3', 'shopC', 7000]]) },
    { isbn: '978A', at: at(72 + 120), prevSig: 's4', diff: { add: [], gone: ['a3'], px: [] }, page: pg([['a2', 'shopB', 4400]]) },
    { isbn: '978B', at: at(10), prevSig: null, diff: { first: true, add: ['b1', 'b2'], gone: [], px: [] }, page: pg([['b1', 'shopA', 9000], ['b2', 'shopB', 9100]]) },
    { isbn: '978B', at: at(30), prevSig: 'x1', diff: { add: [], gone: [], px: [{ id: 'b1', from: 9000, to: 8800 }, { id: 'b2', from: 9100, to: 8800 }] }, page: pg([['b1', 'shopA', 8800], ['b2', 'shopB', 8800]]) },
    { isbn: '978B', at: at(50), prevSig: 'x2', diff: { add: [], gone: [], px: [{ id: 'b1', from: 8800, to: 8700 }, { id: 'b2', from: 8800, to: 8700 }] }, page: pg([['b1', 'shopA', 8700], ['b2', 'shopB', 8700]]) }];
  const TL = X.sfpTimeline(CH); const A = TL.by.shopA, B = TL.by.shopB, Cc = TL.by.shopC;
  ok(A.seen === 2 && A.add === 0 && A.gone === 1 && A.px === 3 && A.pxDown === 3, '처음 본 회차의 줄은 \'새로 올림\'으로 안 셈 · 빠짐·값 바꿈 셈', A);
  ok(B.lagN === 2 && B.lagH === 22, '남(가게A)이 값을 바꾼 뒤 따라 바꾸기까지 시간(관찰 때 기준 24·20시간 → 가운데 22) · 같은 회차의 동시 바꿈은 지연으로 안 셈', B);
  ok(Cc.add === 1 && Cc.gone === 1 && Cc.lifeD === 5 && Cc.goneR === 1, '올린 뒤 첫 쪽에서 빠지기까지 날수(5일)', Cc);
  ok(TL.pairs['shopA|shopB'] && TL.pairs['shopA|shopB'].px === 2, '같은 관찰 회차에 함께 값 바꾼 짝(2번)', TL.pairs);

  console.log('③ 판매자끼리 겹침 · 예스24↔알라딘 맞대기');
  const cards = { shopA: { biz: true, legal: L, notes: [{ t: '안내', b: '주말 발송 없음' }] }, shopB: { biz: true, legal: X.y24LegalOf(legalDoc({ ...LA, co: '업체B', rep: '대표B', tel: '010-1234-5678', mail: 'b@example.com' })), notes: [{ t: '안내', b: '주말 발송 없음' }] },
    shopC: { biz: true, legal: X.y24LegalOf(legalDoc({ ...LA, co: '업체C', biz: '9998887776', tel: '010-1111-1111', mail: 'c@example.com', from: '서울특별시 가나구 다라동 12-3 (마바빌딩) 909호', ret: '서울특별시 가나구 다라동 12-3 (마바빌딩) 909호' })) }, shopD: { biz: false, legal: null } };
  const rows = []; ['9780000000001', '9780000000002', '9780000000003', '9780000000004'].forEach((isbn, i) => { rows.push({ isbn, sid: 'shopA', p: 10000 + i * 100, g: '상', s: 3000, fo: 30000 }); rows.push({ isbn, sid: 'shopB', p: 10500 + i * 100, g: '상', s: 3000, fo: 30000 }); if (i < 1) rows.push({ isbn, sid: 'shopD', p: 9000, g: '중', s: 2500, fo: 20000 }); });
  const alRows = { '9780000000001': [{ sc: '111', p: 10000, g: '상' }, { sc: '222', p: 7000, g: '중' }], '9780000000002': [{ sc: '111', p: 10100, g: '상' }, { sc: '222', p: 7100, g: '중' }], '9780000000003': [{ sc: '111', p: 10200, g: '상' }, { sc: '222', p: 7000, g: '중' }], '9780000000004': [{ sc: '222', p: 9000, g: '하' }] };
  const alSellers = [{ id: 'sc_111', bizNo: '123-45-67890', company: '업체A', phone: '010-0000-0000' }, { id: 'sc_333', bizNo: '5556667778', company: '(주)업체C', returnAddress: '서울특별시 가나구 다라동 12-3 (마바빌딩) 909호' }];
  const R = X.sfpRun({ rows, changes: CH, cards, alRows, alSellers });
  const ab = R.pairs.find((e) => e.a === 'shopA' && e.b === 'shopB'); const ac = R.pairs.find((e) => e.a === 'shopA' && e.b === 'shopC');
  ok(ab && ab.strong && !ab.why.includes('대표자명 같음') && ab.why.includes('사업자 등록번호 같음') && ab.why.includes('반품지 같은 호수') && ab.why.includes('가게 공지 글 같음') && ab.why.some((w) => /같은 책 4권/.test(w)) && ab.why.some((w) => /함께 값 바꿈 2번/.test(w)), '가게A·B: 같은 사업자 번호·같은 반품지 호수·같은 공지·같은 책·함께 값 바꿈 → 강한 짝', ab);
  ok(ac && !ac.strong && ac.why.includes('반품지 같은 건물') && !ac.why.includes('반품지 같은 호수'), '가게A·C: 같은 건물 다른 호수 → 약한 짝(같은 상가일 수 있음)', ac);
  ok(!R.pairs.some((e) => e.a === 'shopD' || e.b === 'shopD'), '겹침 없는 개인 판매자 D는 짝 없음');
  const many = {}; for (let i = 0; i < 40; i++) many['s' + i] = { legal: { retK: '같은상가', retF: '같은상가' + i + '호' } }; ok(X.sfpPairs(many, null, null).length === 0, '흔한 건물(바구니 30곳 넘음)은 약한 신호에서 뺌(짝 폭발 막음)');
  const xl = R.cross.legal; const a111 = xl.find((x) => x.sid === 'shopA' && x.sc === '111'); const c333 = xl.find((x) => x.sid === 'shopC' && x.sc === '333');
  ok(a111 && a111.lv === 'strong' && a111.why.includes('사업자 등록번호 같음') && a111.why.includes('상담 전화 같음') && a111.why.includes('업체명 같음'), '예스24 가게A ↔ 알라딘 111: 사업자 번호(꼴 달라도)·전화·업체명', a111);
  ok(c333 && c333.lv === 'strong' && c333.why.includes('반품지 같은 호수') && c333.why.includes('업체명 같음'), '예스24 가게C ↔ 알라딘 333: 반품지 호수·업체명((주) 무시)', c333);
  const lA = R.cross.list.find((x) => x.sid === 'shopA' && x.sc === '111'); ok(lA && lA.both === 3 && lA.eq === 3 && lA.eqR === 1 && lA.lift > 1 && R.cross.base > 0, '같은 책·같은 등급·같은 값 3/3권 · 전체 평균 대비 배수(lift)', { lA, base: R.cross.base });
  ok(R.fps.shopA.legal && R.fps.shopA.hab.books === 4 && R.fps.shopA.time.px === 3 && R.n.legal === 3, '판매자마다 지문 한 장(법정 고지·버릇·시간 행동)', R.n);
  ok(R.fps.shopA.legal.ret === LA.ret && R.fps.shopA.legal.rep === '대표A', '판매자 지문에 법정 고지 원문이 함께 들어감(비공개 Firestore에만)');
  const sq = X.sfpRun({ rows: [{ isbn: '1', sid: 'abc01', id: '1000', p: 1 }, { isbn: '2', sid: 'abc02', id: '1003', p: 1 }, { isbn: '3', sid: 'abc01', id: '1005', p: 1 }, { isbn: '4', sid: 'abc02', id: '1007', p: 1 }, { isbn: '5', sid: 'abc01', id: '1010', p: 1 }, { isbn: '6', sid: 'abc02', id: '1012', p: 1 }] }); const sqp = sq.pairs.find((e) => e.a === 'abc01' && e.b === 'abc02');
  ok(sqp && sqp.why.some((w) => /매물 번호 이웃 5번/.test(w)) && sqp.why.includes('아이디 머리글 같음(끝 번호만 다름)') && sq.fps.abc01.seq.n === 3 && sq.fps.abc01.idShape.stem === 'abc', '⑫ 매물 번호를 번갈아 차지(이웃 5번) · ⑬ 아이디 머리글 같음', sqp);

  console.log('④ 클라우드 회차 — 가짜 Firestore · 새로 읽는 화면 0');
  const src = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const i0 = src.indexOf('let sfpAt = 0;'); const i1 = src.indexOf('/* (정범님 11/09) 🟦 예스24 시장 지표 — 알라딘 시장 지표와 따로'); ok(i0 > 0 && i1 > i0, '클라우드에 sellerFpTick 있음');
  ok(/const sf = await sellerFpTick\(\); if \(sf\) out\.sellerFp = sf;/.test(src), '시장 지표 회차 옆에서 부름');
  const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); const cp = (v) => JSON.parse(JSON.stringify(v)); const reads = { n: 0 };
    const Q = (n, fl, lim) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]], lim), select: () => Q(n, fl, lim), limit: (x) => Q(n, fl, x), orderBy: () => Q(n, fl, lim),
      get: async () => { const L = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => { const a = v[k]; return a != null && (op === '>=' ? a >= x : op === '>' ? a > x : op === 'in' ? x.includes(a) : op === '==' ? a === x : true); })).slice(0, lim || 1e9); reads.n += L.length; const docs = L.map(([id, v]) => ({ id, data: () => cp(v) })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } });
    const C = (n) => ({ ...Q(n, [], 0), doc: (id) => ({ get: async () => { reads.n++; return { exists: !!col(n)[id], data: () => (col(n)[id] ? cp(col(n)[id]) : undefined) }; }, set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...cp(v) } : cp(v); } }) });
    return { D, C, reads }; };
  const run = async (FS, force) => { let fetched = 0; const logs = []; const f = new Function('C', 'extMod', 'fetch', 'nowIso', 'log', src.slice(i0, i1) + '\nreturn sellerFpTick;')(FS.C, async () => X, async () => { fetched++; throw new Error('새로 읽으면 안 됨'); }, () => new Date().toISOString(), (...m) => logs.push(m.join(' '))); const out = await f(force); return { out, fetched, logs }; };
  const F1 = mkFS(); F1.D.app_settings = { seller_fp_state: { hour: 0 } }; F1.D.y24_mkt = {}; rows.forEach((r) => { const d = (F1.D.y24_mkt[r.isbn] = F1.D.y24_mkt[r.isbn] || { page1: [] }); d.page1.push({ r: d.page1.length + 1, id: r.isbn + r.sid, ...r, isbn: undefined }); });
  F1.D.y24_mkt_changes = {}; CH.forEach((c, i) => { F1.D.y24_mkt_changes['c' + i] = { ...c, at: new Date(Date.now() - (10 - i) * 864e5).toISOString() }; }); F1.D.y24_mkt_changes.old = { ...CH[1], at: '2020-01-01T00:00:00Z' };
  F1.D.y24_sellers = cards; F1.D.prd_books = { bk1: { isbn13: '9780000000001' }, bk2: { isbn13: '9780000000002' }, bk3: { isbn13: '9780000000003' } }; F1.D.prd_book_metrics = {}; ['bk1', 'bk2', 'bk3'].forEach((b, i) => { F1.D.prd_book_metrics[b] = { usedFirstPage: alRows['978000000000' + (i + 1)].map((x) => ({ sellerCode: x.sc, price: x.p, grade: x.g })).concat([{ sellerCode: '996008', price: 1, grade: '상' }]) }; });
  F1.D.sellers = { sc_111: alSellers[0], sc_333: alSellers[1], sc_444: { company: '사업자 번호 없음' } }; const before = JSON.stringify({ m: F1.D.y24_mkt, c: F1.D.y24_mkt_changes, s: F1.D.y24_sellers, p: F1.D.prd_book_metrics, al: F1.D.sellers });
  const R1 = await run(F1); const ALL = JSON.stringify({ fp: F1.D.seller_fp, runs: F1.D.seller_fp_runs }); const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const RUN = (F1.D.seller_fp_runs || {})[day];
  ok(R1.out && R1.fetched === 0 && R1.out.sellers === 4 && R1.out.legal === 3, '하루 한 번 셈 · 예스24·알라딘에 새 요청 0', R1.out);
  ok(F1.D.seller_fp && F1.D.seller_fp.y24_shopA && F1.D.seller_fp.y24_shopA.legal.bizNo === '123-45-67890' && F1.D.seller_fp.y24_shopA.day === day, 'seller_fp/y24_{아이디}에 판매자 지문', Object.keys(F1.D.seller_fp || {}));
  ok(RUN && RUN.pairs.length >= 2 && RUN.cross.legal.length >= 2 && RUN.cross.list.some((x) => x.sid === 'shopA' && x.sc === '111' && x.eq === 3) && RUN.books.al === 3 && RUN.alSellers === 2, 'seller_fp_runs/{날짜}: 판매자 짝·알라딘 맞대기(우리 가게 996008 줄은 뺌 · 사업자 번호 없는 판매자는 안 읽음)', RUN && { pairs: RUN.pairs.length, legal: RUN.cross.legal.length, list: RUN.cross.list.length, al: RUN.books });
  ok(/505호/.test(ALL) && F1.D.seller_fp.y24_shopA.legal.rep === '대표A', '클라우드가 쓴 seller_fp에 법정 고지 원문(비공개 Firestore)'); ok(RUN.n.changes === 8, `최근 60일 바뀜 기록만(오래된 것 뺌)`, RUN.n);
  ok(JSON.stringify({ m: F1.D.y24_mkt, c: F1.D.y24_mkt_changes, s: F1.D.y24_sellers, p: F1.D.prd_book_metrics, al: F1.D.sellers }) === before, '원래 기록(y24_mkt·바뀜·카드·알라딘 첫 쪽·판매자)은 하나도 안 바꿈');
  ok(F1.D.app_settings.seller_fp_state.day === day && F1.D.app_settings.seller_fp_state.lastRun.sellers === 4, '오늘 몫 표시 · 마지막 결과 요약', F1.D.app_settings.seller_fp_state.lastRun);
  const R1b = await run(F1); ok(R1b.out === null, '같은 날 두 번 돌지 않음');
  const F2 = mkFS(); F2.D.app_settings = { seller_fp_state: { on: false } }; ok((await run(F2, true)).out === null, '끄기(on:false)면 아무것도 안 함');
  const F3 = mkFS(); F3.D.app_settings = { seller_fp_state: { hour: 24 } }; const R3 = await run(F3); ok(R3.out === null && !F3.D.seller_fp, '정한 시각(hour) 전에는 안 돎');
  const F4 = mkFS(); F4.D.app_settings = { seller_fp_state: { hour: 0 } }; const R4 = await run(F4); ok(R4.out && R4.out.sellers === 0 && R4.fetched === 0, '기록이 비어도 깨지지 않음', R4.out);
  console.log(bad ? `❌ tSELFP 실패 ${bad}` : '✓ tSELFP 통과'); process.exitCode = bad ? 1 : 0; })();
