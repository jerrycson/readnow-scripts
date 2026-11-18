// tBQSTOCK1118 — (11/18 정범님 I-1118-1947-22.2) 같은 책을 여러 매물로 가질 때 카드마다 '이 카드 = 이 매물(등급·관리코드·수량)'과 '같은 책 전체 m권 · k매물'을 나눠 보임
//  · 📥 등록 화면도 구성(등급·상태·관리코드·SKU·수량)별 몇 개씩 — 세세한 목록은 📦 단추를 누르면 떠 있는 칸(공용 ipop · 아무 데나 누르면·Esc로 닫힘)
// 실행: node tBQSTOCK1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const blk = cut('/* ◆bqstock 시작', '/* ◆bqstock 끝 */');
console.log('① 순수 셈');
{ const ISBN = '9788900000001';
  const stock = [{ id: 'p1', usedCode: 'U1', grade: '상', sku: 'AAA', qty: 3, price: 9000, status: '판매중', at: '2026-11-01' }, { id: 'p2', usedCode: 'U2', grade: '최상', sku: 'BBB', qty: 1, price: 12000, status: '판매중', at: '2026-11-02' }, { id: 'p3', usedCode: 'U3', grade: '상', sku: 'CCC', qty: 2, price: 8000, status: '일시판매중지', at: '2026-11-03' }];
  const one = [{ id: 'q1', usedCode: 'V1', grade: '중', sku: 'DDD', qty: 2, price: 5000, status: '판매중' }];
  const SAME = { [ISBN]: { stock, nStock: 6 }, '9788900000002': { stock: one, nStock: 2 } };
  const PL = new Map([...stock, ...one].map((x) => [x.id, { ...x, isbn13: x.grade ? (one.includes(x) ? '9788900000002' : ISBN) : '' }]));
  const S = { plist: PL }; const IPOP = {}; const LS = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; } }; const H = []; const TL = [];
  const doc = { addEventListener: (t, fn) => H.push(fn) };
  const F = new Function('S', 'regSameOf', 'uqL', 'esc', 'num', 'won', 'IPOP', 'regCopyNote', 'skuOfL', 'document', 'localStorage', 'toast', 'regRerender', blk + '\nreturn { stkSumOf, stkCurOf, stkBtn, bqStkChip, stkInline };')(S, (i) => SAME[i] || null, (n) => n + '권', (s) => String(s == null ? '' : s), (n) => String(n), (n) => n + '원', IPOP, (x) => ({ note: x.id === 'p1' ? '밑줄 조금' : '', src: '시험' }), (l) => [l.sku + '-1'], doc, LS, (m) => TL.push(m), () => TL.push('다시 그림'));
  const s = F.stkSumOf(stock); ok(s.n === 6 && s.k === 3 && s.txt === '최상 1 · 상 5', '합계·매물 수·등급별(등급 차례)', s);
  ok(F.stkCurOf(stock, PL.get('p3')).id === 'p3' && F.stkCurOf(stock, { usedCode: 'U2' }).id === 'p2' && F.stkCurOf(stock, { id: 'x', usedCode: 'Z' }) === null, '이 카드 매물 찾기 — 상품 열쇠 · 알라딘 중고 상품 코드');
  const b1 = F.stkBtn(ISBN, { cur: PL.get('p1') }); ok(/📦 이 카드 3권/.test(b1) && /stkg">상</.test(b1) && /같은 책 전체 6권 · 3매물/.test(b1) && /data-ipop="stk"/.test(b1) && /data-stkl="p1"/.test(b1) && /multi/.test(b1), '여러 매물 — 「이 카드 3권 상 / 같은 책 전체 6권 · 3매물」(총합 6만 보이지 않음)', b1);
  const b2 = F.stkBtn('9788900000002', { cur: PL.get('q1') }); ok(/📦 보유재고 2권/.test(b2) && !/같은 책 전체/.test(b2), '매물이 하나뿐이면 「보유재고 n권」', b2);
  const b3 = F.stkBtn(ISBN, {}); ok(/📦 보유재고 6권/.test(b3) && /3매물 ▾/.test(b3) && !/data-stkl/.test(b3), '등록 화면(이 카드 매물 없음) — 「보유재고 6권 · 3매물 ▾」', b3);
  ok(F.bqStkChip(PL.get('p1')) !== '' && F.bqStkChip(PL.get('q1')) === '', '수동 일괄 📋 한눈에 줄 — 다른 매물이 있을 때만 칩');
  const btn = (d) => ({ dataset: d }); const h1 = IPOP.stk(btn({ stki: ISBN, stkl: 'p3' }));
  ok(/모두 6권 · 3매물/.test(h1) && /◀ 이 카드/.test(h1) && (h1.match(/<tr /g) || []).length === 3 && /관리코드 <code>CCC/.test(h1) && /CCC-1/.test(h1) && /밑줄 조금/.test(h1) && !/늘 펼쳐 두기/.test(h1), '떠 있는 칸 — 구성별 표(등급·상태·관리코드·SKU·수량·유의 사항) · 이 카드 줄 표시', h1.slice(0, 400));
  ok(h1.indexOf('BBB') < h1.indexOf('AAA'), '표는 등급 차례(최상 먼저)');
  const h2 = IPOP.stk(btn({ stki: ISBN, stkm: 'p1' })); ok(/✓ 이번 코드/.test(h2) && /늘 펼쳐 두기/.test(h2) && /data-stkinl="1"/.test(h2), '등록 화면 — 이번 코드와 같은 구성 ✓ · 「늘 펼쳐 두기」 설정 단추(이 기기 기억)');
  ok(!F.stkInline(), '기본 = 접음');
  const ev = { target: { closest: () => ({ dataset: { stkinl: '1' } }) }, preventDefault() {} }; H.forEach((fn) => fn(ev)); ok(F.stkInline() && TL.includes('다시 그림'), '설정 단추 → 늘 펼쳐 두기 켜짐 · 다시 그림'); }
console.log('· 코드 확인');
{ ok(!/\b(alert|confirm|prompt)\s*\(/.test(blk) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(blk), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  ok(/g\(l\.isbn13\)\.stock\.push\(\{ id: l\.id \|\|/.test(T), '같은 책 재고 줄에 상품 열쇠(이 카드가 어느 매물인지 앎)');
  ok(/P\.push\(regSameIcons\(l\.isbn13, l\)\)/.test(T), '수동 일괄 🔎 자세히 카드 — 이 매물을 넘김');
  ok(/\$\{bqStkChip\(l\)\}\$\{plkChip/.test(T), '수동 일괄 📋 한눈에 줄 — 📦 칩');
  ok(/regSameIcons\(isbnK, it\._y24v && S\.plist/.test(T) && /regSameHtml\(isbnK, f, it\._y24v/.test(T), '등록 카드 — 예스24 이전 카드면 이 매물을 넘김');
  ok(/ipop="stk"\|ipop-w=\|stki=\|stkl=\|stkm=/.test(T), '수동 일괄 카드 속성 거르개가 📦 단추를 살림');
  ok(/function regSameHtml\(isbn, f, cur\)[\s\S]{0,6000}stkInline\(\)/.test(T), '등록 화면 구성 목록은 기본 접음(설정으로 늘 펼침)');
  const ip = cut('function ipop(', '\n}'); ok(/closest\('\.ipop'\)|ipopClose|remove\(/.test(ip) || /ipop/.test(T.slice(T.indexOf("key === 'Escape'"), T.indexOf("key === 'Escape'") + 600)), '공용 떠 있는 칸 — 닫는 길 있음'); }
console.log(bad ? `❌ tBQSTOCK1118 ${bad}개 실패` : '✓ tBQSTOCK1118 통과');
process.exit(bad ? 1 : 0);
