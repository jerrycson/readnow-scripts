// tEDALL3_1119 — (edall3 · 판본 판 ③) 차이 표 edDiff · 근거 줄(그림자) · 검색 상자 글에서 출판사·연월 · edSame 점수 그대로 · 웹앱 줄 안 글 연결
// 책 이름·번호는 모두 지어낸 것 · 읽기 0 · 쓰는 법: node tEDALL3_1119.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const mk = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = mk('readnow-products-core.js');
const k = (e, key) => (e || []).filter((x) => x.k === key);
const row = (D, key) => D.rows.find((x) => x.k === key);
const base = { isbn13: '9788954677158', price: 13800, pages: 320, size: '152x225', bind: '무선', publisher: '가나출판', pubDate: '2024-03', authors: ['가나'], translators: ['다라'] };

console.log('① 칸마다 같음·다름·모름');
let D = P.edDiff(base, { ...base, pages: 322 });
ok(row(D, 'pages').r === 'same', '쪽수 ±2 안 → 같음');
D = P.edDiff(base, { ...base, pages: 323 });
ok(row(D, 'pages').r === 'diff' && D.diff.includes('pages') && /쪽수 320 ↔ 323/.test(D.txt), '쪽수 ±3 → 다름 · 줄 안 글에 「쪽수 320 ↔ 323」');
D = P.edDiff(base, { ...base, bind: '양장본' });
ok(row(D, 'bind').r === 'diff' && /무선 ↔ 양장/.test(D.txt), '제본 다름(무선 ↔ 양장)');
D = P.edDiff(base, { ...base, size: '157x228' });
ok(row(D, 'size').r === 'same', '크기 5mm 안 → 같음');
D = P.edDiff(base, { ...base, size: '160x230' });
ok(row(D, 'size').r === 'diff', '크기 5mm 밖 → 다름');
D = P.edDiff(base, { ...base, price: 16800 });
ok(D.hint === 'price' && D.diff.length === 1 && /같은 번호 값 올림/.test(D.txt), '같은 번호 + 정가만 다름 → 값 올림 힌트');
D = P.edDiff(base, { ...base, isbn13: '9788933871683', price: 16800 });
ok(D.hint === null, '번호가 다르면 값 올림 힌트 없음');
D = P.edDiff(base, { isbn13: base.isbn13, price: 13800 });
ok(row(D, 'pages').r === null && row(D, 'bind').r === null && D.unk.includes('pages') && !D.diff.includes('pages'), '빈 칸 → 모름(다름으로 치지 않음)');
D = P.edDiff(base, { ...base, publisher: '다나출판', pubId: 'p9' });
ok(row(D, 'pub').r === 'diff' && D.pub.same === false, '출판사 이름 다름 → 다름');
D = P.edDiff({ ...base, pubId: 'p1' }, { ...base, publisher: '다나출판', pubId: 'p1' });
ok(row(D, 'pub').r === 'same' && D.pub.same === true, '출판사 번호 같으면 이름이 달라도 같음');
D = P.edDiff(base, { ...base, translators: ['마바'] });
ok(row(D, 'tr').r === 'diff' && /옮긴이 다름/.test(D.txt), '옮긴이 다름');
D = P.edDiff(base, { ...base, pubDate: '2025-01' });
ok(row(D, 'ym').r === 'diff' && /출간 2024-03 ↔ 2025-01/.test(D.txt), '출간 연월 다름');
D = P.edDiff(base, { ...base, st: '구판 절판' });
ok(/구판/.test(D.txt) && /절판/.test(D.txt), '견줄 쪽이 구판·절판이면 글에 표시');
D = P.edDiff(null, undefined);
ok(D.rows.length === 9 && D.diff.length === 0 && D.txt === '', '둘 다 비어도 깨지지 않음');
D = P.edDiff(base, { ...base, pages: 400, bind: '양장', price: 20000, publisher: '다나출판', pubDate: '2020-01', translators: ['마바'], size: '200x300' });
ok(D.txt.length <= 120, '줄 안 글은 120자 안');

console.log('② 근거 줄(그림자) — 판정은 그대로');
const our = { title: '지어낸 책', bookId: 'bk_1', bookTitle: '지어낸 책' };
const doc0 = { src: 'usedSearch', cands: [], at: 'x' };
const same = (a, b) => ['use', 'hold', 'why', 'kw', 'br', 'pick', 'ids'].every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
const dBind = P.edDiff(base, { ...base, bind: '양장', pages: 400 });
const e = P.edDiffEv(dBind);
ok(k(e, 'bind').length === 1 && k(e, 'bind')[0].v === -1 && k(e, 'bind')[0].w === 0.5, '제본 다름 → bind 줄(−1 · 0.5)');
ok(k(e, 'pages').length === 1 && k(e, 'pages')[0].v === -1 && k(e, 'pages')[0].w === 0.2, '쪽수 크게 다름 → 약한 pages 줄');
ok(k(P.edDiffEv(P.edDiff(base, { ...base })), 'pages').some((x) => x.v === 1), '쪽수 같음 → 같은 판 쪽 줄(+1)');
ok(k(P.edDiffEv(P.edDiff(base, { ...base, price: 16800 })), 'price').length === 1, '값 올림 힌트 → price 줄');
ok(P.edDiffEv(null).length === 0, '표 없음 → 줄 없음');
const d0 = P.edDecide(our, doc0, {});
const d1 = P.edDecide(our, { ...doc0, diff: dBind }, {});
ok(same(d0, d1) && k(d1.ev, 'bind').length === 1, '표를 주면 줄만 늘고 판정은 그대로(그림자)');
const d2 = P.edDecide(our, { ...doc0, diff: dBind }, { sig: { tbl: 'off' } });
ok(same(d0, d2) && k(d2.ev, 'bind').length === 0, 'tbl을 off로 하면 줄 안 만듦');
ok(P.ED_SIG_DEF.tbl === 'shadow', '기본 단계: tbl은 그림자');
ok(P.edDecide(our, { ...doc0, diff: dBind }, { sig: false }).ev === undefined || k(P.edDecide(our, { ...doc0, diff: dBind }, { sig: false }).ev, 'bind').length === 0, '신호 전체 끄면 줄 없음');

console.log('③ 검색 상자 글에서 출판사·연월 · 후보로 전달');
let JSDOM = null; try { JSDOM = require(process.env.JSDOM || 'jsdom').JSDOM; } catch (er) { for (const p of ['/home/user/.rn-nm/node_modules/jsdom', '/opt/node22/lib/node_modules/jsdom']) { try { JSDOM = require(p).JSDOM; break; } catch (e2) {} } }
if (JSDOM) {
  const html = '<div class="ss_book_box" itemid="111"><a class="bo3" href="/shop/wproduct.aspx?ItemId=111">지어낸 책 (리커버)</a> 가나다 (지은이) | 시험 출판사 | 2024년 3월 <img class="front_cover" src="//x/cover500/K1_1.jpg"></div>'
    + '<div class="ss_book_box" itemid="222"><a class="bo3" href="/shop/wproduct.aspx?ItemId=222">틀 없는 책</a> 글이 짧음 <img class="front_cover" src="//x/cover500/K2_1.jpg"></div>';
  const d = new JSDOM('<body>' + html + '</body>').window.document;
  const L = P.parseSearchResults(d);
  ok(L.length === 2 && L[0].publisher === '시험 출판사' && L[0].ym === '2024-03' && /가나다/.test(L[0].by || ''), '지은이 | 출판사 | 연월을 뽑음');
  ok(L[1].publisher === undefined && L[1].ym === undefined && L[1].itemId === '222', '그 꼴이 없으면 칸이 없음 · 지금 칸은 그대로');
  ok(L[0].itemId === '111' && L[0].title === '지어낸 책 (리커버)' && L[0].used === false, '지금 칸(itemId·title·used)은 그대로');
} else console.log('  - jsdom 없음 → 검색 상자 시험 건너뜀(이 PC에 jsdom 없음)');
const C = P.edCands({ title: '지어낸 책', bookId: 'bk_1' }, { cands: [{ itemId: '5', title: '지어낸 책 (리커버)', cov: 0.95, publisher: '시험 출판사', ym: '2024-03', by: '가나다' }] }, { loose: true });
ok(C.length === 1 && C[0].publisher === '시험 출판사' && C[0].ym === '2024-03' && C[0].by === '가나다', 'edCands가 후보에 출판사·연월·지은이를 넘김');
const C2 = P.edCands({ title: '지어낸 책', bookId: 'bk_1' }, { cands: [{ itemId: '6', title: '지어낸 책 (리커버)', cov: 0.95 }] }, { loose: true });
ok(C2.length === 1 && !('publisher' in C2[0]) && !('ym' in C2[0]), '없으면 칸 자체가 없음');

console.log('④ edSame 점수 그대로(클라우드 판본 엔진)');
const X = require(path.join(R, 'cloud', 'edition.js'))._t;
const S = [[{ iid: '1', isbn: '9788954677158', title: '지어낸 책', authors: ['가나'], translators: ['다라'], publisher: '가나출판', orig: 'X', pages: 320 }, { iid: '2', isbn: '9788933871683', title: '지어낸 책 (리커버 한정판)', authors: ['가나'], translators: ['다라'], publisher: '가나출판', orig: 'X', pages: 352 }],
  [{ iid: '1', title: '지어낸 책', authors: ['가나'], publisher: '가나출판', pages: 320 }, { iid: '3', title: '지어낸 책', authors: ['가나'], publisher: '다나출판', pages: 321 }],
  [{ iid: '1', title: '지어낸 책', authors: ['가나'], translators: ['다라'], publisher: '가나출판', pages: 320 }, { iid: '4', title: '지어낸 책', authors: ['가나'], translators: ['마바'], publisher: '다나출판', pages: 300 }],
  [{ iid: '1', title: '지어낸 책', authors: ['가나'] }, { iid: '5', title: '지어낸 책 개정판', authors: ['가나'], pages: 100 }],
  [{ iid: '1', title: '지어낸 책', authors: ['가나'], publisher: '가나출판', pages: 200 }, { iid: '6', title: '지어낸 책 3판', authors: ['가나'], publisher: '가나', pages: 300 }]];
const want = [['edition', 1], ['edition', 0.8], ['trans', 0.8], ['edition', 0.75], ['edition', 0.85]];
S.forEach(([a, b], i) => { const r = X.edSame(a, b); ok(r.kind === want[i][0] && Math.abs(r.s - want[i][1]) < 1e-9, `표본 ${i + 1}: ${r.kind} ${r.s.toFixed(2)} = 옛 점수 ${want[i][1]}`); });

console.log('⑤ 웹앱 연결(원문 검사)');
const A = rd('src/app.html');
ok(/function edDfCell\(/.test(A) && /\$\{edDfCell\(l, c\)\}/.test(A), '후보 줄(edCandRow)에 줄 안 작은 글 칸');
ok(/function edDfAsk\(/.test(A) && /N\.get\(l\.id\) \|\| 0; if \(n >= 8\) return/.test(A), '한 상품에 문서 읽기 많아야 8개');
ok(/collection\('ed_info'\)\.doc\('i' \+ id\)\.get\(\)/.test(A) && !/alert\(|confirm\(|prompt\(/.test(A.slice(A.indexOf('function edDfBook'), A.indexOf('function edCandRow'))), 'ed_info 한 문서씩 읽음 · 브라우저 팝업 없음');
ok(/const dfx = edDfPre\(l, cands\)/.test(A) && /\.\.\.\(dfx \? \{ diff: dfx \} : \{\}\)/.test(A), 'edJudge가 차이 표를 edDecide에 넘김(길 하나)');
ok(!/edDf[A-Za-z]*\([^)]*\)[^;\n]*EDW\.el\.innerHTML/.test(A), '창 틀(EDW) 안 건드림 — 줄 안 글 칸만 바꿈')

console.log(bad ? `❌ ${bad}/${n} 실패` : `✓ ${n}/${n} 통과`);
process.exit(bad ? 1 : 0);
