/* tSPINE2_1113 — 📚 알라딘 밖 책등 그림(cloud/bookinfo.js 0.1.8 · spine2 11/13): 예스24 상품 화면의 책등 그림(SIDE/XL) 주소 꺼내기 · 책등 빈 도서 정보에만 채움
 * 돌리기: node src/tests/tSPINE2_1113.js (node만 · 인터넷 없음 · 가짜 Firestore)
 * 화면 조각은 2026-11-13 실제 예스24 상품 화면(입체 책이 있는 책 · 없는 책)의 꼴을 줄여 옮김 */
'use strict';
const path = require('path'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const B = require(path.join(REPO, 'cloud/bookinfo.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const ISBN = '9788900000101'; const GID = '13137546';
const page = (side) => `<html><head><meta property="og:title" content="시험 책 | 시험 저자 | 시험사 - 예스24"><meta property="og:image" content="https://image.yes24.com/goods/${GID}/XL"></head><body>
<span class="gd_img"><img src="https://image.yes24.com/goods/${GID}/XL"></span>
${side ? `<div class="gd_3dGrp"><div class="bookL" ><img src="https://image.yes24.com/goods/${GID}/SIDE/XL" border="0" alt=""></div></div>
<span class="gd_imgLft"><img src="https://image.yes24.com/goods/${GID}/SIDE/XL"></span><span class="gd_imgBack"><img src="https://image.yes24.com/goods/${GID}/BACK/XL"></span>` : ''}
<img src="https://image.yes24.com/goods/72127217/L">
<div id="infoset_introduce"><h4 class="tit_txt">책소개</h4><div class="infoWrap_txt">시험 책소개 글입니다. 충분히 긴 글.</div></div>
<div id="infoset_specific"><table><tr><th>ISBN13</th><td>${ISBN}</td></tr></table></div></body></html>`;

console.log('① 예스24 책등 주소 꺼내기');
ok(B.y24Side(page(true)) === `https://image.yes24.com/goods/${GID}/SIDE/XL`, '입체 책 있는 화면 → SIDE/XL 주소');
ok(B.y24Side(page(false)) === null, '입체 책 없는 화면 → 없음(다른 상품 그림을 잡지 않음)');
ok(B.y24Side(`<img src="https://image.yes24.com/goods/${GID}/XL"><div class="bookL"><img src="//image.yes24.com/goods/${GID}/SIDE/XL"></div>`) === `https://image.yes24.com/goods/${GID}/SIDE/XL`, 'gd_imgLft 칸이 없어도 bookL 칸(주소 앞 https 없음)으로');
ok(B.y24Side(`<img src="https://image.yes24.com/goods/${GID}/XL"><span class="gd_imgLft"><img src="https://image.yes24.com/goods/99999/SIDE/XL"></span>`) === null, '다른 상품 번호의 책등은 받지 않음');
ok(B.y24Side('') === null && B.y24Side(null) === null, '빈 글 → 없음');

console.log('② 화면 읽기·합치기에 책등이 따라감');
{ const r = B.parseYes24(page(true), ISBN, {}); ok(r.ok && r.side === `https://image.yes24.com/goods/${GID}/SIDE/XL`, '예스24 읽기 결과에 side');
  const r2 = B.parseYes24(page(false), ISBN, {}); ok(r2.ok && !r2.side, '입체 책 없으면 side 없음');
  const m = B.merge(null, r); ok(m.side === r.side, '합친 책 문서에 side'); const m2 = B.merge(m, { src: 'kyobo', t: {}, b: {} }); ok(m2.side === r.side, '다음 출처가 와도 지킴');
  ok(!B.parseYes24(page(true), '9788900000999', {}).ok, 'ISBN이 다른 화면은 그대로 받지 않음'); }

console.log('③ 도서 정보에 채우기 — 책등 빈 책만');
(async () => {
  const docs = new Map([['b1', { images: { front: { src: 'x', stored: 'img/b1/front.jpg' } } }], ['b2', { images: { spine: { src: 'https://image.aladin.co.kr/product/1/2/spineflip/K_d.jpg', stored: null } } }], ['b3', { images: { spine: { src: 'a', stored: 'img/b3/spine.jpg' } } }]]);
  const writes = []; const C = (col) => ({ doc: (id) => ({ _id: id, _col: col, set: async (v, o) => { writes.push([col, id, v, o]); } }) });
  const db = { getAll: async (ref) => [{ exists: docs.has(ref._id), data: () => docs.get(ref._id) }] };
  const BI = B.makeBookInfo({ db, C, FV: { serverTimestamp: () => 'TS' }, log: () => {}, W: () => ({ writer: 'cloud' }) });
  const U = `https://image.yes24.com/goods/${GID}/SIDE/XL`;
  ok(await BI.sideFill({ isbn: ISBN, bookId: 'b1' }, U) === 1, '책등 빈 책 → 채움');
  const w = writes[0]; ok(w && w[0] === 'prd_books' && w[1] === 'b1' && w[2].images.spine.src === U && w[2].images.spine.stored === null && w[2].images.spine.by === 'cloud-y24' && w[2].imgStatus === 'pending' && w[3] && w[3].merge, '규칙 주소 책등과 같은 꼴(src·stored null·imgStatus pending · merge)');
  ok(!('front' in w[2].images), '앞표지 칸은 건드리지 않음');
  ok(await BI.sideFill({ isbn: ISBN, bookId: 'b2' }, U) === 0 && await BI.sideFill({ isbn: ISBN, bookId: 'b3' }, U) === 0, '이미 책등(알라딘 규칙 주소·저장본) 있는 책은 그대로');
  ok(await BI.sideFill({ isbn: ISBN, bookId: 'nope' }, U) === 0 && await BI.sideFill({ isbn: ISBN }, U) === 0, '도서 정보 없음·도서 번호 없음 → 안 씀');
  ok(await BI.sideFill({ isbn: ISBN, bookId: 'b1' }, 'https://evil.example/x.jpg') === 0, '예스24 SIDE/XL 꼴이 아닌 주소는 안 씀');
  ok(writes.length === 1, `쓰기 ${writes.length}번(채운 책 하나만)`);
  const S = BI.state.side; ok(S && S.seen === 6 && S.fill === 1 && S.had === 2 && S.noBook === 3 && BI.state.done.side === 1, `셈 seen ${S && S.seen} · fill ${S && S.fill} · had ${S && S.had} · noBook ${S && S.noBook}`);
  console.log(`\n${fail ? '❌' : '✅'} 통과 ${pass} · 실패 ${fail}`); process.exit(fail ? 1 : 0);
})();
