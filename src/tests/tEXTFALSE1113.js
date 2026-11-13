// tEXTFALSE1113 — 외부 정보 거짓 '바뀜' 둘째 묶음(rv1b 11/13 · 진단 exth 7일 옛 값 3,763건 견줌)
//  ① 받아 둔 값이 없던 칸(앞서 '못 읽음'·'다른 책'만 · at·sig 없음)에 처음 값이 들어오면 '새로'(예전 '바뀜' — 로거 교보 바뀜 100%인데 교보 옛 값 보관 0건)
//  ② 국립중앙도서관 지은이 끝 ';'만 다르면 같음 · 쪽수·정가처럼 실제 값이 다르면 그대로 '바뀜'
const fs = require('fs'), path = require('path');
const pick = (...ps) => ps.find((p) => fs.existsSync(p));
const X = require(pick(path.join(__dirname, '../../readnow-ext-core.js'), path.join(__dirname, '../readnow-ext-core.js')));
const col = fs.readFileSync(pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')), 'utf8');
const cl = fs.readFileSync(pick(path.join(__dirname, '../../cloud/index.js'), path.join(__dirname, '../cloud/index.js')), 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
ok(/return prev && \(prev\.at \|\| prev\.sig\) \? \(X\.fmtShift/.test(col), '① 수집기: 받아 둔 값이 없던 칸은 새로');
ok(/return prev && \(prev\.at \|\| prev\.sig\) \? \(X\.fmtShift/.test(cl), '① 클라우드도 같은 규칙');
ok(/let dk = null; if \(prev && \(prev\.at \|\| prev\.sig\)\)/.test(col), '① 바뀐 칸 이름도 받아 둔 값이 있을 때만');
const A = { none: false, d: { authors: '저자 : 가;역자 : 나;', pages: 300, priceList: 20000 } }, B = { none: false, d: { authors: '저자 : 가;역자 : 나', pages: 300, priceList: 20000 } };
ok(X.sig(A, 'nl') === X.sig(B, 'nl'), "② 국중 지은이 끝 ';'만 다르면 같은 지문");
ok(X.sameSig('nl', { sig: 'oldsig', d: A.d }, X.sig(B, 'nl')) === 'resign', '② 옛 방식 지문이어도 저장된 값으로 다시 만들어 같음(resign) — 고친 날부터 바로');
ok(X.sig({ none: false, d: { ...B.d, priceList: 22000 } }, 'nl') !== X.sig(B, 'nl') && X.sig({ none: false, d: { ...B.d, pages: 301 } }, 'nl') !== X.sig(B, 'nl'), '② 정가·쪽수가 실제로 다르면 그대로 바뀜');
ok(JSON.stringify(X.sigDiff(A, { none: false, d: { ...B.d, priceList: 22000 } }, 'nl')) === '["d.priceList"]', '② 바뀐 칸은 정가 하나만(지은이 끝 ; 은 안 셈)');
ok(X.sig({ d: { title: 'a;' } }, 'kyobo') !== X.sig({ d: { title: 'a' } }, 'kyobo'), '② 다른 출처(교보)는 그대로');
// ③ eBay 옛 원화 꼴 → 원래 돈 꼴: 무리마다 매물 수가 같으면 '꼴만 바뀜' · 수가 다르면 그대로 바뀜 · 새 꼴끼리는 예전처럼
{ const it = (g, p, cur, p0, cur0) => ({ p, cur, ...(p0 != null ? { p0, cur0 } : {}), g, st: 'sell', sim: 1 });
  const OLD = { none: false, d: { items: [it('new', 32000, 'KRW'), it('상', 21000, 'KRW'), it('상', 25000, 'KRW')] } };
  const NEW = { none: false, d: { items: [it('new', 23.5, 'USD'), it('상', 15.2, 'USD', 12, 'GBP'), it('상', 18, 'USD')] } };
  const NEW2 = { none: false, d: { items: [it('new', 23.5, 'USD'), it('상', 18, 'USD')] } };
  ok(X.fmtShift(OLD, NEW, 'ebay') === true, '③ 옛 꼴(돈 단위 없는 무리) → 새 꼴, 무리마다 매물 수 같음 → 꼴만 바뀜');
  ok(X.fmtShift(OLD, NEW2, 'ebay') === false, '③ 매물 수가 다르면(상 2 → 1) 그대로 바뀜');
  ok(X.fmtShift(NEW, NEW2, 'ebay') === false && X.fmtShift(NEW, { none: false, d: { items: [it('new', 30, 'USD'), it('상', 15.2, 'USD', 12, 'GBP'), it('상', 18, 'USD')] } }, 'ebay') === false, '③ 새 꼴끼리는 값이 다르면 그냥 바뀜(꼴만 바뀜 아님)');
  ok(/fmt: '꼴만 바뀜/.test(col) && /\['new', 'changed', 'same', 'fmt'\]\.includes\(st\)/.test(col), '③ 기록 줄·셈에 꼴만 바뀜'); }
console.log(bad ? `❌ tEXTFALSE1113 실패 ${bad}개` : '✓ tEXTFALSE1113 모두 통과'); process.exit(bad ? 1 : 0);
