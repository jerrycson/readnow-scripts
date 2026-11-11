/* tBKID1111 — (11/11 bkid1) prd_books 문서 번호는 'bk_<도서 번호>'(ISBN 아님) — doc('isbn_'+ISBN)으로 읽던 곳이 늘 '없음'이라 결과 칸이 비었음
 *  ① 클라우드(cloud/index.js BKID-START~BKID-END만 떼어 돌림): bkCatName 분류 꼴 둘 다 · bkCatCount = ISBN 칸 where in 30개씩 · 같은 ISBN 한 번 · ISBN 모양 아닌 것 안 물음 · 실패하면 멈추고 err
 *  ② 클라우드 🚚 무료배송 채우기 분석(freeShipStats) — '채우기 책의 분류'(fillCats)가 bkCatCount(isbn13 where in)로 · fillCatCover 기록 · prd_books를 'isbn_'로 읽는 곳 없음(소비심리 consStudy는 cons2 가지에서 고침)
 *  ③ 웹앱 요인별 판매율(vrFactors) — bookId가 없고 ISBN만 있는 조회 결과도 도서 정보(S.pbooks · 문서 번호 bk_…)를 ISBN 색인으로 찾아 분류·제작 형식·쪽수·출판사 줄을 냄
 *  ④ 수집기·readnow-*.js에 prd_books 'isbn_' 읽기 없음(수집기 고치지 않음 — 머리 그대로)
 *  지어낸 값만(실제 손님·판매 없음)
 * 실행: node src/tests/tBKID1111.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error(rel + ' 못 찾음 — RN_REPO=<readnow-scripts>'); };
const src = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const a = src.indexOf('BKID-START'); const b = src.indexOf('/* BKID-END */'); const code = src.slice(src.indexOf('*/', a) + 2, b);
const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite }; vm.runInNewContext(code + ';this.bkCatName = bkCatName; this.bkCatCount = bkCatCount;', ctx);
(async () => {
  console.log('① 클라우드 ISBN으로 분류 찾기');
  ok(ctx.bkCatName([{ path: ['국내도서', '소설/시/희곡', '한국소설'] }]) === '국내도서 > 소설/시/희곡' && ctx.bkCatName([['국내도서', '어린이']]) === '국내도서 > 어린이' && ctx.bkCatName([{ path: ['국내도서'] }]) === null && ctx.bkCatName(null) === null && ctx.bkCatName([]) === null, '분류 꼴 둘 다({path}·배열) · 1단계뿐이면 null');
  /* 지어낸 도서 정보 — 문서 번호는 bk_…(ISBN 아님) · 한 ISBN에 문서 두 개(옛 연결)도 있음 */
  const BOOKS = {}; for (let i = 0; i < 70; i++) { const isbn = '97911000' + String(i).padStart(5, '0'); BOOKS['bk_' + (5000 + i)] = { isbn13: isbn, categories: i % 7 === 6 ? [{ path: ['국내도서'] }] : [{ path: ['국내도서', i % 2 ? '어린이' : '소설/시/희곡', '더'] }] }; }
  BOOKS.bk_9999 = { isbn13: '9791100000000', categories: [['국내도서', '어린이']] }; /* 같은 ISBN 두 번째 문서 — 한 번만 셈 */
  const parts = []; const lookup = async (part) => { parts.push(part.length); const S = new Set(part); return Object.values(BOOKS).filter((v) => S.has(v.isbn13)); };
  const asked = []; for (let i = 0; i < 75; i++) asked.push('97911000' + String(i % 72).padStart(5, '0')); asked.push('(8936477196)', '', null, 9791100000001);
  const R = await ctx.bkCatCount(asked, lookup);
  ok(parts.length === 3 && parts.every((n) => n <= 30), "where in 한 번에 30개까지(Firestore 'in' 한도)", parts);
  ok(R.asked === 72 && R.got === 60 && R.miss === 12 && !R.err, 'ISBN 72권 물음(겹침·모양 틀린 것 뺌) · 분류 2단계가 있는 60권 찾음 · 1단계뿐/없는 책 12권은 못 찾음', R);
  ok(R.cats['국내도서 > 소설/시/희곡'] === 30 && R.cats['국내도서 > 어린이'] === 30 && Object.keys(R.cats).length === 2, "분류마다 권 수 · 같은 ISBN 두 문서는 처음 것 한 번('isbn_' 문서 번호를 전혀 안 씀)", R.cats);
  const E = await ctx.bkCatCount(['9791100000001', ...Array.from({ length: 40 }, (_, i) => '97912000' + String(i).padStart(5, '0'))], async (part) => { if (part.length > 1) throw new Error('quota'); return []; });
  ok(E.err === 'quota' && E.got === 0 && Object.keys(E.cats).length === 0, '찾다 실패하면 멈추고 까닭(err)을 남김 — 지어내지 않음', E);
  const Z = await ctx.bkCatCount([], lookup); ok(Z.asked === 0 && Z.got === 0 && !Object.keys(Z.cats).length, '빈 묶음이면 묻지 않음');

  console.log('② 클라우드 🚚 무료배송 채우기 분석');
  const fs0 = src.indexOf('async function freeShipStats'); const fs1 = src.indexOf('\n/* (0.20.0)', fs0); const FS = src.slice(fs0, fs1);
  ok(fs0 > 0 && /bkCatCount\(\[\.\.\.new Set\(T\.fillIsbn\)\]/.test(FS) && /C\('prd_books'\)\.where\('isbn13', 'in', part\)\.select\('isbn13', 'categories'\)/.test(FS) && !/isbn_/.test(FS.replace(/\/\*[\s\S]*?\*\//g, '')), "채우기 책의 분류 = prd_books ISBN 칸(isbn13) where in · 'isbn_' 읽기 없음");
  ok(/fillCats: Object\.entries\(cats\)/.test(FS) && /fillCatCover: \{ asked: BC\.asked, got: BC\.got, miss: BC\.miss, err: BC\.err \}/.test(FS), '결과 문서에 fillCats + 몇 권 찾았는지(fillCatCover)');
  const cs0 = src.indexOf('async function consStudy'); const cs1 = cs0 > 0 ? src.indexOf('\n/* ', cs0 + 10) : -1; const noCons = cs0 > 0 ? src.slice(0, cs0) + src.slice(cs1) : src;
  const badRe = /prd_books'\)\.doc\(\s*['"`]isbn_/; ok(!badRe.test(noCons.replace(/\/\*[\s\S]*?\*\//g, '')), "cloud/index.js 어디에도 prd_books를 'isbn_'+ISBN으로 읽는 곳 없음(소비심리 consStudy는 cons2 가지 몫)");
  for (const f of ['cloud/shop.js']) { const t = fs.readFileSync(findUp(f), 'utf8'); ok(!badRe.test(t), f + ' — prd_books isbn_ 읽기 없음'); }

  console.log('③ 웹앱 요인별 판매율(vrFactors) — ISBN만 있는 조회 결과');
  const T = fs.readFileSync(findUp('src/app.html'), 'utf8'); const pick = (sig) => { const i = T.indexOf(sig); if (i < 0) throw new Error(sig + ' 없음'); let j = T.indexOf('\nfunction ', i + 5); const j2 = T.indexOf('\n/* ', i + 5); const j3 = T.indexOf('\nconst ', i + 5); j = Math.min(...[j, j2, j3].filter((x) => x > 0)); return T.slice(i, j); };
  const W = { S: {} }; vm.createContext(W); vm.runInContext([pick('function pbByIsbn('), pick('function vrFactors('), pick('const vrBind = '), 'this.pbByIsbn = pbByIsbn; this.vrFactors = vrFactors;'].join('\n'), W);
  ok(!/pbooks\.get\('isbn_'/.test(T), "웹앱에 S.pbooks.get('isbn_'…) 없음");
  const S = W.S; S.pbooks = new Map([['bk_1', { isbn13: '9791100000001', categories: [{ path: ['국내도서', '소설/시/희곡'] }], basicExtra: ['무선'], pages: 250, publisher: '가나출판' }], ['bk_2', { isbn13: '9791100000002', categories: [['국내도서', '어린이']], basicExtra: ['양장'], pages: 40 }]]);
  S.plist = new Map([['L1', { bookId: 'bk_2', isbn13: '9791100000002', active: 1 }]]); let alN = 0; W.alByIsbn = () => { alN++; const m = new Map(); for (const l of S.plist.values()) (m.get(l.isbn13) || m.set(l.isbn13, []).get(l.isbn13)).push(l); return m; };
  S.vfac = { cohort: { base: 0.3 }, factors: { category: [{ k: '국내도서 > 소설/시/희곡', n: 80, rate: 0.5 }, { k: '국내도서 > 어린이', n: 60, rate: 0.1 }], binding: [{ k: '무선', n: 90, rate: 0.35 }, { k: '양장', n: 40, rate: 0.2 }], pages: [{ k: '200~299쪽', n: 50, rate: 0.4 }], publisher: [{ k: '가나출판', n: 31, rate: 0.6 }] } };
  ok(W.pbByIsbn('9791100000002') === S.pbooks.get('bk_2') && alN === 1, '① 우리 상품 ISBN 색인의 bookId로 찾음');
  ok(W.pbByIsbn('9791100000001') === S.pbooks.get('bk_1') && W.pbByIsbn('9790000000000') === null && W.pbByIsbn('') === null, '② 상품이 없는 책은 도서 정보 ISBN 색인으로 · 없는 ISBN은 null');
  const F1 = W.vrFactors({ isbn13: '9791100000001' }); const ks = F1.map((x) => x.k).sort().join();
  ok(ks === 'binding,category,pages,publisher' && F1.find((x) => x.k === 'category').label === '분류 국내도서 > 소설/시/희곡', "bookId 없이 ISBN만 있어도 분류·제작 형식·쪽수·출판사 줄이 나옴(예전엔 'isbn_' 문서가 없어 빈 칸)", F1);
  const F2 = W.vrFactors({ isbn13: '9791100000002' }); ok(F2.find((x) => x.k === 'category').label === '분류 국내도서 > 어린이' && F2.find((x) => x.k === 'binding').label === '제작 형식 양장', '분류 꼴 배열([[…]])도', F2);
  const F3 = W.vrFactors({ bookId: 'bk_2', isbn13: '9791100000001' }); ok(F3.find((x) => x.k === 'category').label === '분류 국내도서 > 어린이', 'bookId가 있으면 bookId 먼저(그대로)', F3);
  S.pbooks.set('bk_3', { isbn13: '9791100000003', categories: [{ path: ['국내도서', '어린이'] }] }); ok(W.pbByIsbn('9791100000003') === S.pbooks.get('bk_3'), '도서 정보가 늘면 색인을 다시 만듦');
  { const i = T.indexOf('function pbByIsbn('); const blk = T.slice(i, T.indexOf('\n/* 요인별 판매율', i)); ok(!/\balert\(|\bconfirm\(|\bprompt\(|localStorage|\.set\(\{/.test(blk) && !/01[016789]-?\d{3,4}-?\d{4}/.test(blk), '새 덩어리에 브라우저 창·기기 저장·서버 쓰기·전화 번호 꼴 없음'); }

  console.log('④ 수집기·readnow-*.js');
  const dir = path.dirname(findUp('src/app.html')); const root = path.dirname(dir); const files = ['src/readnow-collector.src.js', ...fs.readdirSync(root).filter((f) => /^readnow-.*\.js$/.test(f))];
  const hits = files.filter((f) => { try { return badRe.test(fs.readFileSync(path.join(root, f), 'utf8')) || /pbooks\.get\(\s*['"`]isbn_/.test(fs.readFileSync(path.join(root, f), 'utf8')); } catch (e) { return false; } });
  ok(!hits.length, `수집기·공용 파일 ${files.length}개에 prd_books 'isbn_' 읽기 없음`, hits);
  console.log(bad ? `❌ tBKID1111 ${bad}개 실패` : '✓ tBKID1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
