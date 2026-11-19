// 📏 판 ⓪ 읽기 0 진단 셈(cloud/edall0.js · edall0 11/19) 시험 — node src/tests/tEDALL0_1119.js
// 지어낸 책 이름·번호만 씀(손님 정보 없음) · 셈 함수는 순수 함수라 알라딘·Firestore를 부르지 않음
const A = require('../../cloud/edall0.js');
const P = require('../../readnow-products-core.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };

// 지어낸 자료: 상품 4개 · 도서 2권 · 시장 2개
const LISTINGS = [
  { title: '지어낸 소설 (리커버)', active: true, status: '판매중', mediaType: 'book', bookId: 'b1', isbn13: '9788900000011', isbn10: '8900000019', aladinCode: 'K100000001' },
  { title: '지어낸 소설', active: true, status: '판매중', mediaType: 'book', bookId: 'b1', isbn13: '9788900000028', isbn10: '8900000027', aladinCode: 'K100000002' },
  { title: '지어낸 음악 (리커버)', active: true, status: '판매중', mediaType: 'music', bookId: null, isbn13: '9791100000001', isbn10: null, aladinCode: 'K100000003' },
  { title: '지어낸 동화 (한정판)', active: true, status: '판매중', mediaType: 'book', bookId: 'b2', isbn13: '9791100000018', isbn10: null, aladinCode: 'K100000004' },
];
const BOOKS = { b1: { title: '지어낸 소설 (리커버)', barcode: null }, b2: { title: '지어낸 동화', barcode: '9788900000035' } };
const MARKETS = [
  { cands: [6000, 6100, 6200, 6300, 6500, 6600, 28000, 28500, 29000].map((price) => ({ price })) },
  { cands: [10000, 11000, 12000].map((price) => ({ price })) },
];
const I = { P, listings: LISTINGS, books: BOOKS, ext: { '9788900000011': true }, edBook: ['9791100000018'], markets: MARKETS, truth: 7 };

console.log('① 값 두 무리 묶기');
const g1 = A.twoGroups([6000, 6100, 6200, 6300, 6500, 6600, 28000, 28500, 29000]);
ok(g1 && g1.lo === 6 && g1.hi === 3, '6,000원대 6개 · 28,000원대 3개 → 6 · 3');
ok(A.twoGroups([10000, 10500, 11000, 11500]) === null, '한 무리뿐이면 두 무리 아님(null)');
ok(A.twoGroups([6000, 6100, 28000, 28500]) === null, '양쪽 2개씩이면 두 무리 아님(null)');
ok(A.twoGroups([6000, 6100, 6200, 7200, 7300, 7400]) === null, '틈이 1.2배(3·3)면 두 무리 아님(null)');

console.log('② 기본 셈');
const O = A.count(I);
ok(O.n === 4 && O.act === 4, '상품 4 · 판매 중 4');
ok(O.k978 === 2 && O.k978K === 2 && O.k978KKw === 1 && O.hyp === 0.5, '978 2 · K코드 2 · 그중 판본 낱말 1 → 비율 0.5');
ok(O.hypVerdict.startsWith('가설 맞음'), '비율 30% 넘음 → 가설 맞음 문구');

console.log('③ 도서 제목 낱말 빠짐 · 찍은 번호');
ok(O.bookN === 3 && O.bookKw === 2 && O.lostKw === 1 && O.lostRate === 0.5, '도서 3 · 도서 낱말 2 · 우리 제목에 빠짐 1 → 0.5');
ok(O.scanN === 1 && O.scanDiff === 1 && O.scanDiffRate === 1, '찍은 번호 1 · 우리 ISBN과 다름 1');

console.log('④ 부가기호 · ed_book · 시장');
ok(O.sus === 2 && O.susExt === 1 && O.extRate === 0.5, '의심 2 · 부가기호 있음 1 → 0.5');
ok(O.susEdBook === 1 && O.edBookRate === 0.5, '의심 중 ed_book 있음 1 → 0.5');
const ISB = A.suspectIsbns(I);
ok(ISB.length === 2 && !ISB.includes('9791100000001'), '의심 ISBN 목록 2개 · 음악(매체)은 뺌');
ok(O.mk === 2 && O.two === 1 && O.twoRate === 0.5 && O.truth === 7, '시장 2 · 두 무리 1 · 정답 표본 7');

console.log('⑤ 빈 자료');
const E = A.count({ P, listings: [], books: {}, ext: {}, edBook: [], markets: [], truth: null });
ok(E.n === 0 && E.hyp === null && E.hypVerdict.startsWith('모름') && E.truth === null, '빈 자료 → 0 · 비율 모름(null) · 던지지 않음');

console.log(bad ? `\n✗ ${bad}건 실패` : '\n✓ 모두 통과');
process.exitCode = bad ? 1 : 0;
