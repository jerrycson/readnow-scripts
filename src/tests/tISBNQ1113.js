// tISBNQ1113 — (11/13 isbnq · MJ님 'ISBN 9791188915002가 알라딘 홈페이지엔 있는데 웹앱에서는 조회 대기 그대로')
//   까닭: 알라딘이 ISBN 대신 자기 상품 코드(K…)로 올린 책은 샵매니저 등록 검색(ISBN)도 0줄 · 상품 화면(wproduct.aspx?ISBN=)도 빈 화면 → 공개 검색에만 나옴
//         수집기 등록 조회(regLookupCmd)는 공개 검색을 안 해 '못 찾음'으로 끝났고, PC가 답했으므로 클라우드(공개 검색까지 함)는 묻지도 않았음
//   ① 수집기 regLookupCmd: 등록 검색 0줄 · ISBN= 화면 실패 → 번호로 공개 검색 → 앞 3개 중 번호가 맞는 상품을 씀 · 그 상품의 알라딘 상품 코드로 등록 검색해 등록 코드(scmCode)도
//   ② 번호가 안 맞는 검색 결과는 쓰지 않음(오류 글 '…공개 검색 모두 … 못 찾음')
//   ③ 웹앱 regCloudMiss: PC가 '못 찾음'으로 돌려준 ISBN만 클라우드에 한 번 더 · 클라우드가 맡은 답·찾은 것·로그인 오류는 다시 묻지 않음
// 실행: node src/tests/tISBNQ1113.js
const fs = require('fs'); const path = require('path');
const COL = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8'); const APP = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
let bad = 0; const ok = (c, m, i) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(i === undefined ? '' : i).slice(0, 900))); if (!c) bad++; };
const cutFn = (src, mark) => { const a = src.indexOf(mark); if (a < 0) { console.log('❌ 덩어리 없음: ' + mark); process.exit(1); } let i = src.indexOf('{', a), d = 0, q = null; for (; i < src.length; i++) { const ch = src[i]; if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; } if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; } if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; } if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; } if (ch === '{') d++; else if (ch === '}') { d--; if (!d) return src.slice(a, i + 1); } } };
const REGF = cutFn(COL, 'async function regLookupCmd(ref, v)');
const ISBN = '9791188915002', IID = '131196017', KEY = 'K602532199';
const mkCol = (o) => { const calls = { scm: [], look: [], doc: [] };
  const P = { scmSearch: async (q, kind) => { calls.scm.push(q); return { login: true, rows: q === KEY && o.keyHit ? [{ itemId: IID, title: '100명의 세계인', code: KEY }] : [] }; }, nameCoverage: () => 1, aladinQ: (x) => x, parseSearchResults: (d) => d.rows || [], usedSearchRows: null };
  const lookDoc = async (u) => { calls.doc.push(u); return { doc: { rows: /SearchWord=9791188915002/.test(u) ? o.search : [] } }; };
  const lookupBook = async (u, code) => { calls.look.push(u); const m = u.match(/ItemId=(\d+)/); if (!m) throw new Error('알라딘에서 이 책을 못 찾음'); const b = o.books[m[1]]; if (!b) throw new Error('알라딘에서 이 책을 못 찾음'); if (code && b.isbn13 !== code && b.isbnKey !== code) throw Object.assign(new Error(`알라딘이 다른 상품(${b.title})으로 연결함`), { wrong: true }); return { ...b, page1: [{ p: 1 }] }; };
  const C = () => ({ add: async () => {} }); let saved = null; const ref = { id: 'c1', set: async (v) => { saved = v; } };
  const f = new Function('P', 'lookDoc', 'lookupBook', 'C', 'W', 'PC_NAME', 'log', 'sleep', 'nowIso', 'TS', 'RGF', 'window', 'LOOK_PRIO', REGF + '; return regLookupCmd;')(P, lookDoc, lookupBook, C, () => ({}), 'T-PC', () => {}, async () => {}, () => '2026-11-13T00:00:00Z', () => 0, () => null, {}, 0);
  return { calls, run: async () => { await f(ref, { isbns: [ISBN], itemIds: [], queries: [], branch: 1 }); return saved; } }; };
(async () => {
  console.log('① 공개 검색에만 나오는 책');
  { const t = mkCol({ keyHit: true, search: [{ itemId: '999', title: '다른 책' }, { itemId: IID, title: '100명의 세계인' }], books: { 999: { itemId: '999', title: '다른 책', isbn13: '9780000000000' }, [IID]: { itemId: IID, title: '100명의 세계인', isbn13: ISBN, isbnKey: KEY } } }); const r = await t.run();
    ok(r && r.items && r.items[ISBN] && r.items[ISBN].itemId === IID, '번호가 맞는 두 번째 검색 결과(131196017)를 씀', r);
    ok(r && r.items[ISBN] && r.items[ISBN].scmCode === KEY, '알라딘 상품 코드로 등록 검색 → 등록 코드 K602532199', r && r.items[ISBN]);
    ok(!(r.errs || {})[ISBN], '오류 없음', r.errs); ok(t.calls.doc.some((u) => /SearchTarget=Book&SearchWord=9791188915002/.test(u)), '국내도서(Book)로 공개 검색', t.calls.doc); ok(r.status === 'done', '맡긴 일 done'); }
  console.log('② 번호가 안 맞으면 쓰지 않음');
  { const t = mkCol({ search: [{ itemId: '999', title: '다른 책' }], books: { 999: { itemId: '999', title: '다른 책', isbn13: '9780000000000' } } }); const r = await t.run();
    ok(!(r.items || {})[ISBN], '엉뚱한 상품을 쓰지 않음', r.items); ok(/공개 검색 모두 .*못 찾음/.test((r.errs || {})[ISBN] || ''), '오류 글에 공개 검색까지 했다고', r.errs); ok(t.calls.doc.some((u) => /SearchTarget=All/.test(u)), '전체(All)로도 한 번 더', t.calls.doc); }
  console.log('③ 웹앱 regCloudMiss');
  const RCM = cutFn(APP, 'async function regCloudMiss(j, req)'); const mkW = (cloud, url) => { const sent = []; const f = new Function('cloudCall', 'pptCloudUrl', RCM + '; return regCloudMiss;')(async (p, b) => { sent.push([p, b]); return cloud(b); }, () => url); return { f, sent }; };
  { const w = mkW(() => ({ items: { [ISBN]: { title: '100명의 세계인', itemId: IID } } }), 'https://c'); const j = await w.f({ items: {}, cands: {}, errs: { [ISBN]: '샵매니저 등록 검색·상품 페이지 모두 이 번호(ISBN·바코드)의 상품을 못 찾음 — 상품명으로 찾아 보세요 (알라딘에서 이 책을 못 찾음)', '9788900000001': '샵매니저 로그인이 풀림 — 이 PC에서 알라딘 샵매니저에 로그인해 주세요' } }, { branch: 1, isbns: [ISBN, '9788900000001'] });
    ok(w.sent.length === 1 && w.sent[0][0] === '/lookup' && JSON.stringify(w.sent[0][1].isbns) === JSON.stringify([ISBN]), "옛 PC가 '못 찾음'으로 돌려준 ISBN만 클라우드에(로그인 오류는 안 보냄)", w.sent);
    ok(j.items[ISBN] && j.items[ISBN].itemId === IID && !j.errs[ISBN], '클라우드가 찾은 정보로 채움 · 오류 지움', j); }
  { const w = mkW(() => ({}), 'https://c'); await w.f({ via0: 'cloud', items: {}, errs: { [ISBN]: '못 찾음' } }, { isbns: [ISBN] }); await w.f({ items: { [ISBN]: { title: 'x' } }, errs: {} }, { isbns: [ISBN] }); ok(!w.sent.length, '클라우드가 맡은 답·이미 찾은 것은 다시 묻지 않음', w.sent); }
  { const w = mkW(() => { throw new Error('클라우드 꺼짐'); }, 'https://c'); const j0 = { items: {}, errs: { [ISBN]: '못 찾음' } }; const j = await w.f(j0, { isbns: [ISBN] }); ok(j === j0, '클라우드 실패면 PC 답 그대로'); }
  { const w = mkW(() => ({}), null); await w.f({ items: {}, errs: { [ISBN]: '못 찾음' } }, { isbns: [ISBN] }); ok(!w.sent.length, '클라우드 주소가 없으면 묻지 않음'); }
  { ok((APP.match(/regCloudMiss\(j, req\)/g) || []).length === 3, '등록 조회(묶음)·한 상품 조회 둘 다 거침'); }
  console.log(bad ? `❌ tISBNQ1113 실패 ${bad}` : '✅ tISBNQ1113 모두 통과'); process.exit(bad ? 1 : 0); })();
