/* tBOOKINFO1112 — 📖 책 정보 모으기(cloud/bookinfo.js · bookinfo1 11/12): 출처별 파서 · 적응(길 바뀜·깨짐) · 속도 조절 · 차례 · 샘플 예산 · 저장 · 우리숍·웹앱 보이기
 * 돌리기: node src/tests/tBOOKINFO1112.js (node만 · 인터넷 없음 · 화면 견본은 실제 화면 꼴을 줄인 가짜 — 실제 예스24 화면(2026-11-12 『사피엔스』)으로 따로 확인함: 8칸 중 7칸 · 출판사 소개는 예스24에 없음) */
'use strict';
const path = require('path'); const fs = require('fs'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const B = require(path.join(REPO, 'cloud/bookinfo.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const ISBN = '9788900000001';

/* ── 예스24 꼴 견본 ── */
const Y24 = `<html><head><meta property="og:title" content="견본 책 | 김작가 | 견본출판 - 예스24"><meta property="og:description" content="짧은 소개"></head><body>
<div id="infoset_specific" class="gd_infoSet"><h4 class="tit_txt">품목정보</h4><table><tr><th>발행일</th><td>2024년 03월 05일</td></tr><tr><th>쪽수, 무게, 크기</th><td>320쪽 | 450g | 140*210*20mm</td></tr><tr><th>ISBN13</th><td>${ISBN}</td></tr><tr><th>ISBN10</th><td>8900000001</td></tr></table></div>
<div id="infoset_goodsCate" class="gd_infoSet"><h4 class="tit_txt">관련분류</h4><dl><dt>카테고리 분류</dt><dd><a>국내도서</a> &gt; <a>소설</a> &gt; <a>한국소설</a></dd></dl></div>
<div id="infoset_introduce" class="gd_infoSet"><h4 class="tit_txt">책소개</h4><div class="infoWrap_txt"><textarea class="txtContentText" style="display:none">&lt;b&gt;첫 문단&lt;/b&gt; 소개 글입니다.&lt;br&gt;둘째 줄</textarea></div><div>책의 일부 내용을 미리 읽어보실 수 있습니다. 미리보기</div></div>
<div id="infoset_toc" class="gd_infoSet"><h4 class="tit_txt">목차</h4><div>1장 시작<br>2장 가운데<br>3장 끝</div><a>펼쳐보기</a><a>접어보기</a></div>
<div id="infoset_chYes" class="gd_infoSet"><h4 class="tit_txt">상세 이미지</h4><img data-original="https://image.yes24.com/momo/x/1.jpg" src="https://image.yes24.com/momo/Noimg_XL.jpg"></div>
<div id="infoset_authorGrp" class="gd_infoSet"><h4 class="tit_txt">저자 소개 <em class="txt_des">(2명)</em></h4>
 <div id="contents_author_grp1" class="authorInfoGrp "><div class="authorTit"><div class="author_name">저 : <a class="lnk_author">김작가</a></div></div><span class="author_info info_crop">서울에서 태어나...</span><span class="author_info info_origin">서울에서 태어나 소설을 쓴다.</span></div>
 <div id="contents_author_grp2" class="authorInfoGrp "><div class="authorTit"><div class="author_name">역 : <a class="lnk_author">이번역</a></div></div><span class="author_info info_origin">영문학을 공부했다.</span></div></div>
<div id="infoset_inBook" class="gd_infoSet"><h4 class="tit_txt">책 속으로</h4><div>본문 한 대목. --- p.12</div></div>
<div id="infoset_pubReivew" class="gd_infoSet"><h4 class="tit_txt">출판사 리뷰</h4><div>출판사가 쓴 홍보 글입니다.</div></div>
<div id="infoset_nomiCmt" class="gd_infoSet"><h4 class="tit_txt">추천평</h4><div>“좋은 책” - 추천인</div></div>
<div id="infoset_deli">배송</div></body></html>`;

console.log('① 예스24 파서');
{ const r = B.parseYes24(Y24, ISBN, {}); ok(r.ok, '읽음');
  ok(r.t.intro && r.t.intro.startsWith('첫 문단 소개 글입니다.') && r.t.intro.includes('둘째 줄') && !/미리보기|책소개/.test(r.t.intro), `책소개(textarea 풀기·제목·미리보기 줄 뺌): ${JSON.stringify(r.t.intro)}`);
  ok(r.t.toc === '1장 시작\n2장 가운데\n3장 끝', `목차(펼쳐보기 뺌): ${JSON.stringify(r.t.toc)}`);
  ok(/김작가 \(저\)\n서울에서 태어나 소설을 쓴다\./.test(r.t.auth || '') && !/\.\.\./.test(r.t.auth), `저자 소개(긴 글): ${JSON.stringify(r.t.auth)}`);
  ok(/이번역 \(역\)\n영문학/.test(r.t.trans || ''), `옮긴이 소개 따로: ${JSON.stringify(r.t.trans)}`);
  ok(r.t.inbook && r.t.pubrev === '출판사가 쓴 홍보 글입니다.' && r.t.rec, '책 속으로·출판사 서평·추천평');
  ok(r.b.pages === 320 && r.b.weightG === 450 && r.b.size === '140*210*20mm' && r.b.pubDate === '2024-03-05' && r.b.isbn10 === '8900000001', `쪽수·무게·크기·출간일: ${JSON.stringify(r.b)}`);
  ok(r.b.cat === '국내도서 > 소설 > 한국소설', `주제 분류: ${r.b.cat}`);
  ok(r.b.title === '견본 책' && r.b.authors === '김작가' && r.b.publisher === '견본출판', '제목·저자·출판사(og:title)');
  ok(JSON.stringify(r.dimg) === JSON.stringify(['https://image.yes24.com/momo/x/1.jpg']), '상세 이미지(빈 그림 뺌)');
  ok(r.from.intro === 'id' && r.paths.intro.id === true, '길 기록: 칸 번호(id) 길');
  ok(r.miss.includes('pubintro'), '없는 칸 = 출판사 소개');
  const bad = B.parseYes24(Y24.replace(new RegExp(ISBN, 'g'), '9788999999999'), ISBN, {}); ok(!bad.ok && bad.mismatch, '다른 책(ISBN 없음)은 받지 않음'); }

console.log('② 🧬 적응 — 예스24가 칸 번호를 바꿔도(id 없앰) 제목 글 길로 채우고 바뀜을 남김');
{ let H = {}; for (let i = 0; i < 12; i++) { const r = B.parseYes24(Y24, ISBN, H); H = B.healthAdd(H, 'yes24', { paths: r.paths, filled: r.filled, miss: r.miss, shifts: r.shifts, at: 't' + i }); }
  const changed = Y24.replace(/id="infoset_(introduce|toc)"/g, 'id="newbox_$1"').replace(/<textarea[^>]*>/, '<div>').replace('</textarea>', '</div>');
  const r2 = B.parseYes24(changed, ISBN, H); ok(r2.t.toc === '1장 시작\n2장 가운데\n3장 끝' && r2.from.toc === 'head', `목차는 제목 글 길로: ${r2.from.toc}`);
  ok(r2.shifts.some((x) => x.f === 'toc' && x.how === 'id→head'), `바뀜 남김: ${JSON.stringify(r2.shifts)}`);
  /* 길 성공률이 바뀌면 고르는 차례도 바뀜(고정과 변화) */ for (let i = 0; i < 40; i++) { const r = B.parseYes24(changed, ISBN, H); H = B.healthAdd(H, 'yes24', { paths: r.paths, filled: r.filled, miss: r.miss, shifts: r.shifts }); }
  const P = H.yes24.p.toc; ok(P.head.ok / P.head.n > P.id.ok / P.id.n, `잘 되는 길이 앞으로(제목 글 ${(P.head.ok / P.head.n).toFixed(2)} > 칸 번호 ${(P.id.ok / P.id.n).toFixed(2)})`);
  const r3 = B.parseYes24(changed, ISBN, H); ok(!r3.shifts.length, '익숙해지면 더는 바뀜으로 보지 않음');
  /* 모든 길이 비는데 예전엔 잘 채우던 칸 → 깨짐 */ let H2 = H; const none = changed.replace(/<h4 class="tit_txt">목차<\/h4><div>1장 시작<br>2장 가운데<br>3장 끝<\/div>/, ''); for (let i = 0; i < 3; i++) { const r = B.parseYes24(none, ISBN, H2); H2 = B.healthAdd(H2, 'yes24', { paths: r.paths, filled: r.filled, miss: r.miss, at: 'x' }); }
  ok(B.isBroken(H2, 'yes24', 'toc'), `깨짐 판정(예전 채움 ${H2.yes24.broken.toc && H2.yes24.broken.toc.was})`); }

console.log('③ 교보·알라딘·그 밖 — 일반 길(제목 글·구조 데이터·표 칸)');
{ const KB = `<html><head><script type="application/ld+json">{"@type":"Book","name":"견본 책","author":[{"name":"김작가"}],"numberOfPages":"320","datePublished":"2024-03-05","publisher":{"name":"견본출판"}}</script></head><body><span>ISBN ${ISBN}</span><table><tr><th>쪽수</th><td>320쪽</td></tr><tr><th>크기</th><td>140*210*20mm</td></tr><tr><th>무게</th><td>450g</td></tr></table>
  <h2 class="title_heading">책 소개</h2><div class="intro_bottom"><div class="info_text">교보 소개 글</div></div><h2 class="title_heading">목차</h2><ul class="book_contents_list"><li>1장</li><li>2장</li></ul>
  <h2 class="title_heading">출판사 서평</h2><p>교보 서평</p><h2 class="title_heading">작가정보</h2><div>김작가는 소설가다.</div><h2>역자 소개</h2><div>이번역은 번역가.</div><h2>출판사 소개</h2><div>견본출판은 작은 출판사.</div>
</body></html>`;
  const r = B.parseGeneric('kyobo', KB, ISBN, {}); ok(r.ok && r.t.intro === '교보 소개 글' && r.t.toc === '1장\n2장' && r.t.pubrev === '교보 서평', `교보: 소개·목차·서평 ${JSON.stringify([r.t.intro, r.t.toc])}`);
  ok(r.t.auth === '김작가는 소설가다.' && r.t.trans === '이번역은 번역가.' && r.t.pubintro === '견본출판은 작은 출판사.', '교보: 저자·옮긴이·출판사 소개');
  ok(r.b.pages === 320 && r.b.size === '140*210*20mm' && r.b.weightG === 450 && r.b.authors === '김작가' && r.b.pubDate === '2024-03-05', `교보: 기본 정보 ${JSON.stringify(r.b)}`);
  const AL = `<html><body><input class="hd_ISBN" value="${ISBN}"><div class="Ere_prod_mconts_box"><div class="Ere_prod_mconts_LS">책소개</div><div class="Ere_prod_mconts_R">알라딘 소개 글<br>둘째 줄</div></div><div class="Ere_line"></div><div class="Ere_prod_mconts_box"><div class="Ere_prod_mconts_LS">목차</div><div class="Ere_prod_mconts_R">가. 하나<br>나. 둘</div></div></body></html>`;
  const a = B.parseGeneric('aladin', AL, ISBN, {}); ok(a.ok && a.t.intro === '알라딘 소개 글\n둘째 줄' && a.t.toc === '가. 하나\n나. 둘', `알라딘: ${JSON.stringify(a.t)}`);
  ok(!B.parseGeneric('kyobo', KB.replace(ISBN, '1'), ISBN, {}).ok, '교보: 다른 책 받지 않음'); }

console.log('④ 출처 합치기 — 먼저 온 출처 값을 지키고 빈 칸만 채움');
{ const y = B.parseYes24(Y24, ISBN, {}); const k = { ok: true, src: 'kyobo', t: { intro: '다른 소개', pubintro: '교보 출판사 소개' }, b: { pages: 999, kdc: '813' } };
  const m = B.merge(B.merge(null, y), k); ok(m.t.intro === y.t.intro && m.t.pubintro === '교보 출판사 소개' && m.from.pubintro === 'kyobo' && m.from.intro === 'yes24', '글 칸');
  ok(m.b.pages === 320 && m.b.kdc === '813', '기본 칸'); ok(B.coreFull(m), '핵심 세 칸(책소개·목차·저자) 다 참'); }

console.log('⑤ ⏱ 속도 스스로 조절');
{ let p = B.paceInit('yes24'); const g0 = p.gap; for (let i = 0; i < 20; i++) p = B.paceStep(p, { ok: true, ms: 800 }, 1e9); ok(p.gap < g0 && p.gap >= p.min, `빠르고 오류 없음 → 간격 줄임 ${g0}→${p.gap}ms (최소 ${p.min})`);
  const g1 = p.gap; p = B.paceStep(p, { ok: true, ms: 9000 }, 1e9); ok(p.gap > g1, `느려지면 늘림 ${g1}→${p.gap}`);
  const g2 = p.gap; p = B.paceStep(p, { ok: false, status: 429, ms: 100 }, 1e9); ok(p.gap === Math.min(p.max, g2 * 2), `429 → 두 배 ${g2}→${p.gap}`);
  p = B.paceStep(p, { ok: false, status: 503, ms: 100 }, 1e9); ok(p.pauseUntil === 1e9 + 15 * 60e3, '막힘 두 번 → 15분 쉼'); ok(B.paceWait(p, 0, 1e9) === 15 * 60e3, '쉬는 동안 기다림');
  let q = B.paceInit('kyobo'); for (let i = 0; i < 4; i++) q = B.paceStep(q, { ok: false, status: 500, ms: 50 }, 5e9); ok(q.pauseUntil > 5e9, '보통 오류 4번 잇달아 → 쉼');
  for (let i = 0; i < 30; i++) q = B.paceStep(q, { ok: false, status: 429, ms: 50 }, 5e9); ok(q.gap <= q.max && q.pauseUntil - 5e9 <= 6 * 3600e3, '간격·쉼 상한(6시간)'); }

console.log('⑥ 🗂 차례 — 새 등록 → 판매 중 → 그 밖 → 다시 볼 책');
{ const now = Date.parse('2026-11-12T12:00:00Z'); const C = [{ isbn: '9788900000002', st: 'other', reg: '2026-01-01T00:00:00Z' }, { isbn: '9788900000003', st: 'act', reg: '2026-10-01T00:00:00Z' }, { isbn: '9788900000004', st: 'act', reg: '2026-11-12T10:00:00Z' }, { isbn: '9788900000005', st: 'act', reg: '2026-11-01T00:00:00Z' }, { isbn: '9788900000006', st: 'act' }, { isbn: 'abc', st: 'act' }, { isbn: '9788900000003', st: 'act' }];
  const have = new Map([['9788900000005', { nx: now - 1 }], ['9788900000006', { nx: now + 864e5 }]]); const r = B.planQ(C, have, now);
  ok(JSON.stringify(r.list.map((x) => x.isbn.slice(-1))) === JSON.stringify(['4', '3', '2', '5']), `차례 ${r.list.map((x) => x.isbn.slice(-1)).join(',')} (새 등록 4 → 판매 중 3 → 그 밖 2 → 다시 볼 5 · 아직 때 아닌 6·잘못된 번호·겹친 번호 뺌)`);
  ok(B.nextAt({ t: { intro: 1, toc: 1, auth: 1 } }, 1, now) === now + 180 * 864e5 && B.nextAt({ t: { intro: 1 } }, 1, now) === now + 14 * 864e5 && B.nextAt({ t: {} }, 5, now) === now + 120 * 864e5, '다시 볼 때: 다 참 180일 · 빈 칸 14일 · 없음 30일×횟수(최대 120일)'); }

console.log('⑦ 🖼 샘플 페이지 예산 — 하루 처음엔 많이, 남은 수가 줄면 적게');
{ const a = B.pvBudget({ hourKst: 3, left: 8000 }), b = B.pvBudget({ hourKst: 15, left: 8000 }), c = B.pvBudget({ hourKst: 21, left: 8000 }); ok(a.n === 80 && b.n === 28 && c.n === 16, `시간 비중 새벽 ${a.n} · 오후 ${b.n} · 밤 ${c.n}`);
  const d = B.pvBudget({ hourKst: 3, left: 100 }); ok(d.n < a.n && d.n > 0, `남은 100권 → ${d.n}권/시간(남은 양 비중 ${d.f})`); ok(B.pvBudget({ hourKst: 3, left: 0 }).n === 0, '다 모으면 0'); ok(B.pvBudget({ hourKst: 3, left: 9000, todayDone: 1190 }).n === 10, '하루 상한 1,200');
  const L = B.pvFromListing([{ stored: 'img/preview/1/2.jpg', thumb: 'img/preview/1/2_t.webp', n: 2 }, { stored: null, n: 1 }, { stored: 'img/preview/1/1.jpg', n: 1 }]); ok(L.length === 2 && L[0].n === 1 && L[1].t, '같은 책 매물 미리보기를 책 단위로(받은 것만 · 쪽 차례)'); }

console.log('⑧ 💾 저장 — 가짜 Firestore·가짜 인터넷으로 한 회차(예스24 번호는 ext_basic에서) · 미리보기 함께 쓰기');
(async () => { const store = new Map(); const files = [];
  const mkDoc = (col, id) => ({ col, id, get: async () => { const v = store.get(col + '/' + id); return { exists: !!v, id, data: () => v }; }, set: async (v, o) => { const k = col + '/' + id; const cur = store.get(k) || {}; const clean = JSON.parse(JSON.stringify(v, (kk, x) => (x && x._fv ? undefined : x))); store.set(k, o && o.merge ? { ...cur, ...clean } : clean); } });
  const qOf = (col, rows) => { const q = { _w: [], where() { return q; }, select() { return q; }, limit() { return q; }, startAfter() { return { get: async () => ({ empty: true, size: 0, docs: [], forEach() {} }) }; }, get: async () => { const docs = rows().map(([id, v]) => ({ id, data: () => v, ref: mkDoc(col, id) })); return { empty: !docs.length, size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } }; return q; };
  const C = (col) => ({ doc: (id) => mkDoc(col, id), ...qOf(col, () => [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => [k.slice(col.length + 1), v])) });
  store.set('prd_listings/L1', { isbn13: ISBN, status: '판매중', active: true, firstSeenAt: '2026-11-12T00:00:00Z', bookId: 'B1', title: '[중고] 견본 책', previewsStatus: 'done', previews: [{ stored: 'img/preview/B1/1.jpg', n: 1 }] });
  store.set('ext_basic/' + ISBN, { src: { yes24: { d: { id: '111' } } } });
  const db = { getAll: async (...a) => Promise.all(a.filter((x) => x && x.get).map((r) => r.get())) };
  const urls = []; const fetchFn = async (u) => { urls.push(u); if (/Goods\/111/.test(u)) return { ok: true, status: 200, url: u, text: async () => Y24, headers: { get: () => 'text/html' } }; return { ok: false, status: 404, url: u, text: async () => '', headers: { get: () => null } }; };
  const M = B.makeBookInfo({ db, C, FV: {}, log: () => {}, W: () => ({ uploadedAt: { _fv: 1 } }), fetchFn, bucket: () => ({ file: (p) => ({ save: async () => files.push(p) }) }) });
  const r = await M.tick(8000); const d = store.get('bk_info/' + ISBN); ok(r.n === 1 && d && d.t && d.t.intro && d.t.toc && d.t.auth && d.full, `한 권 저장(${d && d.f && d.f.join('·')})`);
  ok(urls.length === 1 && /Goods\/111/.test(urls[0]), '받아 둔 예스24 번호로 바로 상품 화면만(검색 요청 0 · 다 차서 교보·알라딘 안 물음)');
  ok(d.b.pages === 320 && d.srcs.yes24.ok && d.srcs.yes24.via === 'ext' && d.nx > Date.now() + 100 * 864e5, '기본 정보 · 출처 기록 · 다시 볼 때(180일)');
  const r2 = await M.tick(3000); ok(r2.n === 0, '다 찬 책은 다시 묻지 않음');
  store.set('prd_listings/L2', { isbn13: '9788900000009', status: '판매중', active: true, firstSeenAt: '2026-11-12T01:00:00Z', bookId: 'B2', title: '번호 모르는 책' }); M.state.cands = null; M.state.q = null; const n0 = urls.length;
  await M.tick(3000); ok(!store.get('bk_info/9788900000009') && M.state.have.get('9788900000009').nx > Date.now() + 5 * 3600e3 && urls.length - n0 <= 1, '예스24 번호를 모르고 그려 읽기도 없으면: 쓰지 않고 6시간 뒤(실패로 세지 않음 · 알라딘으로 넘기지 않음)');
  /* 예스24 번호를 모르는 책 → 교보 검색(표지 칸 ISBN 같은 상품만) → 교보 상품 화면 · 그려 읽기 없이 */
  const ISB3 = '9788900000017'; store.set('prd_listings/L3', { isbn13: ISB3, status: '판매중', active: true, firstSeenAt: '2026-11-12T02:00:00Z', bookId: 'B3', title: '교보 책' }); M.state.cands = null; M.state.q = null;
  const KBP = `<html>${ISB3}<h2 class="title_heading"><span>책 소개</span></h2><div class="intro_bottom"><div class="info_text">교보 소개입니다</div></div><h2 class="title_heading"><span>목차</span></h2><ul><li>1부</li><li>2부</li></ul><h2 class="title_heading"><span>작가정보</span></h2><div class="writer_info_box"><p>작가 소개 글</p></div></html>`;
  const f0 = fetchFn; const urls2 = []; M.state.pace = {}; const M2 = B.makeBookInfo({ db, C, FV: {}, log: () => {}, W: () => ({ uploadedAt: { _fv: 1 } }), bucket: () => ({ file: () => ({ save: async () => {} }) }), fetchFn: async (u) => { urls2.push(u); if (/search\.kyobobook/.test(u)) return { ok: true, status: 200, url: u, text: async () => `<div data-kbbfn-pid="S000111" data-kbbfn-bid="9788999999999"></div><div data-kbbfn-pid="S000222" data-kbbfn-bid="${ISB3}"></div>`, headers: { get: () => 'text/html' } }; if (/detail\/S000222/.test(u)) return { ok: true, status: 200, url: u, text: async () => KBP, headers: { get: () => 'text/html' } }; return f0(u); } });
  await M2.tick(20000); const d3 = store.get('bk_info/' + ISB3); ok(d3 && d3.t.intro === '교보 소개입니다' && d3.t.toc === '1부\n2부' && d3.t.auth === '작가 소개 글' && d3.srcs.kyobo.via === 'search' && d3.srcs.kyobo.id === 'S000222', `예스24 번호 모름 → 교보 검색(같은 ISBN 상품만 · 추천 S000111 안 잡음) → 교보 화면: ${d3 && JSON.stringify(d3.srcs.kyobo)}`);
  ok(!urls2.some((u) => /aladin/.test(u) && u.includes(ISB3)) && d3.full, '교보로 다 차면 알라딘 안 물음(교보에도 없는 책만 알라딘)');
  const pvr = await M.pvTick(); const d2 = store.get('bk_info/' + ISBN); ok(pvr.share === 1 && d2.pv && d2.pv.from === 'listing' && d2.pvN === 1 && !files.length, '미리보기: 같은 책 매물 것을 함께 씀(받기 0)');
  const dg = await M.diag(); ok(dg.cands.act === 3 && dg.haveAct >= 1 && dg.fullAct === 1 && dg.pvAct === 1 && dg.fields.intro === 1, `진단 숫자: ${JSON.stringify({ act: dg.cands.act, have: dg.haveAct, full: dg.fullAct, pv: dg.pvAct })}`);
  const pub = B.pubOf(d2); ok(pub.t.intro && pub.b.pages === 320 && pub.pv.length === 1, '공개 요약(우리숍) 꼴');

  console.log('⑨ 우리숍·웹앱이 같은 칸 이름을 씀');
  const shopJs = fs.readFileSync(path.join(REPO, 'shop/shop.js'), 'utf8'); const shopCl = fs.readFileSync(path.join(REPO, 'cloud/shop.js'), 'utf8'); const app = fs.readFileSync(path.join(REPO, 'src/app.html'), 'utf8');
  ok(/bkInfoOf\(it\.isbn\)/.test(shopCl) && /info \}, 'public, max-age=30'/.test(shopCl), '우리숍 /shop/item 응답에 info');
  for (const [k] of B.FIELDS) { ok(shopJs.includes(`['${k}',`) && app.includes(`['${k}',`), `칸 ${k}: 우리숍·웹앱 둘 다`); }
  /* 웹앱 카드 그리기 — 함수만 떼어 가짜 S로 */
  const a0 = app.indexOf('const BKI_T = '); const a1 = app.indexOf('async function openProduct(pid, opt) {'); const src = app.slice(a0, a1).replace(/document\.addEventListener\([\s\S]*?\}, true\);/, '');
  const S = { _bki: new Map([[ISBN, d2]]) }; const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const num = (n) => String(n); const kTime = (x) => x; const dt16 = (x) => x; const errKo = (e) => String(e); const imgUrl = (im) => 'https://x/' + im.stored;
  const f = new Function('S', 'esc', 'num', 'kTime', 'dt16', 'errKo', 'imgUrl', 'db', src + '; return bkiCardHtml;')(S, esc, num, kTime, dt16, errKo, imgUrl, null);
  const h = f({ isbn13: ISBN }, null); ok(/📖 책 정보/.test(h) && /<dt>쪽수<\/dt><dd>320쪽<\/dd>/.test(h) && /<dt>무게<\/dt><dd>450g<\/dd>/.test(h) && /<dt>주제 분류<\/dt><dd>국내도서 &gt; 소설/.test(h), '웹앱: 기본 정보(분류·쪽수·무게)');
  ok(/data-bki="intro" open/.test(h) && /data-bki="toc">/.test(h) && /출판사 서평\(홍보글\)/.test(h) && /옮긴이 소개/.test(h) && /미리보기/.test(h), '웹앱: 책소개만 펼치고 나머지 접음 · 미리보기');
  ok(f({ isbn13: '123' }, null) === '', 'ISBN 없는 상품은 카드 없음');
  console.log(`\n${fail ? '❌' : '✓'} tBOOKINFO1112: ${pass}개 통과 · ${fail}개 실패`); process.exit(fail ? 1 : 0); })().catch((e) => { console.log('❌ 예외', e); process.exit(1); });
