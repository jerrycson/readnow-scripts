// tSHOPFIX1_1117 — (11/17 shopfix1 · 정범님 11/14 20:00 「세트는 그 분야에도」 남은 흠 셋)
//   ① 목록 응답(cloud/shop.js listItems)에 세트 길 cs — 손님 화면 카드 「세트」 표(shop/shop.js .cset)가 이것을 봄
//   ② 책 페이지 /b/(cloud/shop.js bookPage)에 분야 길(cp) + 세트 길(cs) 둘 다
//   ③ 손님에게 보이는 칸 이름에서 알라딘 기획·전집 칸의 앞 밑줄을 걷음('_나라별 그림책' → '나라별 그림책') · 자료(도서 정보 경로)는 그대로 · 옛 주소도 찾음
// 실행: node src/tests/tSHOPFIX1_1117.js — 시험 자료는 모두 지어낸 상품(실제 손님·상품 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const SH = require(path.join(ROOT, 'cloud/shop.js')); const SC = require(path.join(ROOT, 'cloud/shop-cat.js'));
const B = (p) => ({ categories: [{ path: p }] });

console.log('① 목록 응답에 세트 길');
{ const pub = SH.pubItem('s1', { status: '판매중', price: 9900, title: '[세트] 시험 소설 1~2 - 전2권' }, B('국내도서>소설/시/희곡>영미소설'));
  const one = SH.pubItem('n1', { status: '판매중', price: 3000, title: '시험 낱권' }, B('국내도서>소설/시/희곡>영미소설'));
  const L = [{ ...pub, at: '2026-11-14' }, { ...one, at: '2026-11-13' }];
  const r = SH.listItems(L, { cp: '국내도서>소설·시·희곡>영미소설' }); const s1 = r.items.find((x) => x.id === 's1'); const n1 = r.items.find((x) => x.id === 'n1');
  ok(r.total === 2 && s1 && s1.cs === '세트>소설·시·희곡' && n1 && !('cs' in n1), `분야 목록: 세트도 나오고 세트에만 cs(${s1 && s1.cs}) · 낱권엔 cs 칸 없음`);
  const r2 = SH.listItems(L, { xs: '1' }); ok(r2.total === 1 && r2.items[0].cs === '세트>소설·시·희곡', '「세트만」 목록에도 cs');
  const J = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/\$\{x\.cs \? '<span class="cset"/.test(J), '손님 화면 카드는 x.cs로 「세트」 표를 띄움(그 칸이 이제 목록 응답에 옴)'); }

console.log('② 책 페이지 /b/ 분야 길 + 세트 길');
{ const pub = SH.pubItem('s1', { status: '판매중', price: 9900, title: '[세트] 시험 소설 1~2 - 전2권' }, B('국내도서>소설/시/희곡>영미소설'));
  const h = SH.bookPage({ ...pub, ph: [] }, { st: 's' });
  const navs = [...h.matchAll(/<nav class="hint[^"]*">([\s\S]*?)<\/nav>/g)].map((m) => m[1]);
  ok(navs.length >= 2 && /첫 화면/.test(navs[0]) && />소설·시·희곡</.test(navs[0]) && />영미소설</.test(navs[0]), '분야 길: 첫 화면 › 국내도서 › 소설·시·희곡 › 영미소설');
  ok(/href="\/#\/list\?cp=%EC%84%B8%ED%8A%B8"/.test(navs[1]) && /href="\/#\/list\?cp=%EC%84%B8%ED%8A%B8%3E%EC%86%8C%EC%84%A4%C2%B7%EC%8B%9C%C2%B7%ED%9D%AC%EA%B3%A1"/.test(navs[1]) && />세트</.test(navs[1]), '세트 길: 세트 › 소설·시·희곡(칸마다 그 칸 목록으로)');
  const one = SH.pubItem('n1', { status: '판매중', price: 3000, title: '시험 낱권' }, B('국내도서>에세이>한국 에세이')); const h1 = SH.bookPage({ ...one, ph: [] }, { st: 's' });
  ok(!/cset-path/.test(h1) && /cp=%EA%B5%AD%EB%82%B4%EB%8F%84%EC%84%9C%3E%EC%97%90%EC%84%B8%EC%9D%B4"/.test(h1), '낱권은 분야 길만(세트 길 없음)');
  const old = SH.bookPage({ id: 'o1', t: '옛 요약', c: '소설·시·희곡', p: 1000, ph: [] }, { st: 'x' }); ok(/list\?c=%EC%86%8C%EC%84%A4/.test(old), '경로 없는 옛 요약(품절 기억)은 예전처럼 분야 이름 하나');
  const x = SH.crumbH({ cp: '국내도서>"x<script', cs: '세트>&y' }); ok(!/<script/.test(x) && /&quot;x&lt;script/.test(x) && /&amp;y/.test(x), '칸 이름은 글자로만(태그로 읽히지 않음)'); }

console.log('③ 앞 밑줄 걷기 — 보여 줄 때만');
{ const P = B('국내도서>유아>그림책>_나라별 그림책>유럽'); const r = SH.shopPath(P, ''); const path0 = P.categories[0].path;
  ok([r.k, ...r.rest].join('>') === '국내도서>유아>그림책>나라별 그림책>유럽' && path0 === '국내도서>유아>그림책>_나라별 그림책>유럽', `분야 길 ${[r.k, ...r.rest].join('>')} · 도서 정보 경로는 그대로`);
  const z = SH.setPathOf(B('국내도서>전집/중고전집>_초등(1-3)저학년>문학/논술/고전'), '', '시험 전집', 'z1'); ok(z && [z.k, ...z.rest].join('>') === '세트>초등(1-3)저학년', '세트 아래 칸: 세트>초등(1-3)저학년(전엔 _초등…)');
  const q = SH.shopPath(B('국내도서>전집/중고전집>_초등(1-3)저학년>문학/논술/고전'), ''); ok([q.k, ...q.rest].join('>') === '국내도서>어린이>전집>초등(1-3)저학년>문학/논술/고전', '전집 분야 길도 밑줄 없이');
  const pub = SH.pubItem('k1', { status: '판매중', price: 1000, title: '시험 그림책' }, B('국내도서>유아>그림책>_나라별 그림책>유럽')); ok(pub.cp === '국내도서>유아>그림책>나라별 그림책>유럽' && !/_/.test(pub.cp), '공개 요약 cp에 밑줄 없음');
  ok(SC.legacyCp('국내도서>유아>그림책>_나라별 그림책') === '국내도서>유아>그림책>나라별 그림책' && SC.legacyCp('세트>_초등(1-3)저학년') === '세트>초등(1-3)저학년' && SC.legacyCp('국내도서>소설/시/희곡>한국소설') === '국내도서>소설·시·희곡>한국소설', '옛 주소(밑줄 칸)도 새 이름으로 읽음');
  const L = [{ ...pub, at: '2026-11-01' }]; ok(SH.listItems(L, { cp: '국내도서>유아>그림책>_나라별 그림책' }).total === 1 && SH.listItems(L, { cp: '국내도서>유아>그림책>나라별 그림책' }).total === 1, '목록 거르기: 옛 밑줄 주소·새 주소 모두 찾음');
  const T = new Map(SH.catTree(L).tree); ok(T.get('국내도서>유아>그림책>나라별 그림책') === 1 && ![...T.keys()].some((k) => /(^|>)_/.test(k)), '분류 나무에 밑줄 칸 없음');
  ok(SC.nice('_나라별 그림책') === '나라별 그림책' && SC.nice('__ x') === 'x' && SC.nice('_') === '_' && SC.nice('청소년 추천') === '청소년 추천' && SC.nice('a_b') === 'a_b', '이름 다듬기: 앞 밑줄만 · 밑줄뿐이면 그대로 · 가운데 밑줄은 그대로');
  ok(SH.shopPath(B('국내도서>청소년_추천도서>x'), '').rest.join('>') === '청소년>추천도서>x' && SH.shopPath(B('국내도서>모르는_분류>x'), '').rest.join('>') === '모르는_분류>x', '예전 바꿈(청소년_추천도서 → 청소년 › 추천도서 · 모르는 이름 그대로)은 같음'); }

console.log(bad ? `❌ tSHOPFIX1_1117 ${bad}개 실패` : '✓ tSHOPFIX1_1117 통과');
process.exit(bad ? 1 : 0);
