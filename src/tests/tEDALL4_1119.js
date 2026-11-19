// tEDALL4_1119 — (edall3 · 판본 판 ④) 시장 보조 신호 — edSplit(값 두 무리) · split·add 근거 줄(그림자) · 웹앱 「이 시장은 값이 두 무리」 줄
// 판매자 글(남의 매물)은 지금 수집기가 저장하지 않아 이 판에 없음(남은 일) · 책 이름·값은 모두 지어낸 것 · 읽기 0
// 쓰는 법: node tEDALL4_1119.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const mk = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = mk('readnow-products-core.js');
const k = (e, key) => (e || []).filter((x) => x.k === key);
const rows = (g, L) => L.map((p) => ({ price: p, grade: g }));
const same = (a, b) => ['use', 'hold', 'why', 'kw', 'br', 'pick', 'ids'].every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));

console.log('① edSplit — 두 무리');
let S = P.edSplit(rows('최상', [6000, 6200, 6500, 6800, 7000, 7200, 28000, 29000, 30000]));
ok(S.on && S.lo.n === 6 && S.hi.n === 3 && S.lo.min === 6000 && S.hi.min === 28000, '6,000원대 여섯 · 28,000원대 셋 → 두 무리');
ok(S.msg === '이 시장은 값이 두 무리(6,000원대 6 · 28,000원대 3)', '안내 글: ' + S.msg);
ok(S.ratio > 1.8 && S.grade === '최상', '틈 배수·등급을 돌려줌');
S = P.edSplit(rows('상', [6000, 6200, 6500, 6800, 7000, 7200, 7500, 8000]));
ok(!S.on && S.msg === '', '한 무리(틈 1.8배 미만) → 두 무리 아님');
S = P.edSplit(rows('상', [6000, 6200, 28000, 29000, 30000]));
ok(!S.on, '아래 무리가 2개뿐(양쪽 3개 미달) → 아님');
S = P.edSplit(rows('상', [6000, 6100, 6200, 28000, 29000]));
ok(!S.on, '위 무리가 2개뿐 → 아님');
S = P.edSplit([...rows('최상', [6000, 6500, 7000]), ...rows('중', [28000, 29000, 30000])]);
ok(!S.on, '등급이 섞이면 등급별로만 셈 — 등급마다 3개뿐이라 아님');
S = P.edSplit([...rows('최상', [6000, 6500, 7000]), ...rows('중', [28000, 29000, 30000]), ...rows('최상', [28500, 29500, 31000])]);
ok(S.on && S.grade === '최상' && S.lo.n === 3 && S.hi.n === 3, '같은 등급 안에서 두 무리가 나뉘면 그 등급으로 잡음');
ok(!P.edSplit(rows('상', [5000])).on && !P.edSplit([]).on && !P.edSplit(null).on && !P.edSplit(undefined).on, '값 하나뿐 · 빈 것 · 없음 → 아님(깨지지 않음)');
S = P.edSplit([...rows('상', [6000, 6200, 6500, 28000, 29000, 30000]), { price: 0, grade: '상' }, { price: -5, grade: '상' }, { price: 100000, grade: '상', soldOut: true }, { grade: '상' }]);
ok(S.on && S.hi.n === 3 && S.hi.max === 30000, '값 없는 줄·판매중지 줄은 뺌');
S = P.edSplit(rows('상', [6000, 6200, 6500, 9000, 9500, 10000]), { ratio: 1.3 });
ok(S.on, '문턱(ratio)을 낮추면 잡힘 — 설정 가능');
S = P.edSplit(rows('', [6000, 6200, 6500, 28000, 29000, 30000]));
ok(S.on && S.grade === null, '등급 칸이 비어도 한 묶음으로 셈');

console.log('② edDecide — split 줄(그림자)');
const our = { title: '지어낸 책 (리커버 한정판)', bookId: 'bk_1', bookTitle: '지어낸 책 (리커버 한정판)', price: 29000 };
const rw = rows('최상', [6000, 6200, 6500, 6800, 7000, 7200, 28000, 29000, 30000]);
const doc0 = { src: 'usedSearch', cands: [], at: 'x' };
const d0 = P.edDecide(our, doc0, {});
const d1 = P.edDecide(our, { ...doc0, rows: rw }, {});
ok(same(d0, d1), '줄을 줘도 판정(use·hold·why·kw·pick)은 그대로');
ok(k(d1.ev, 'split').length === 1 && k(d1.ev, 'split')[0].v === -1 && k(d1.ev, 'split')[0].w === 0.2 && k(d1.ev, 'split')[0].d.length <= 60, '우리 값이 위 무리 + 판본 낱말 → split 줄(−1 · 0.2)');
ok(d1.split && d1.split.msg === '이 시장은 값이 두 무리(6,000원대 6 · 28,000원대 3)', '결과에 split 안내 글');
const dLow = P.edDecide({ ...our, price: 6500 }, { ...doc0, rows: rw }, {});
ok(k(dLow.ev, 'split').length === 1 && k(dLow.ev, 'split')[0].v === 0, '우리 값이 아래 무리 → 알림(0)');
const dNoKw = P.edDecide({ title: '평범한 책', bookId: 'bk_2', price: 29000 }, { ...doc0, rows: rw }, {});
ok(k(dNoKw.ev, 'split').every((x) => x.v === 0), '판본 낱말 없으면 −1을 안 함');
ok(k(P.edDecide(our, { ...doc0, rows: rows('상', [6000, 6500, 7000, 7100]) }, {}).ev, 'split').length === 0, '한 무리면 줄 없음');
const dOff = P.edDecide(our, { ...doc0, rows: rw }, { sig: { split: 'off' } });
ok(same(d0, dOff) && k(dOff.ev, 'split').length === 0 && !dOff.split, 'split을 off로 하면 줄도 안내도 없음');
ok(k(P.edDecide(our, { ...doc0, rows: rw }, { sig: false }).ev, 'split').length === 0, '신호 전체 끄면 없음');
ok(P.ED_SIG_DEF.split === 'shadow' && P.ED_SIG_DEF.add === 'shadow', '기본 단계: split·add 모두 그림자');
const dCk = P.edDecide(our, { ...doc0, rows: rw }, { sig: { split: 'check' } });
ok(dCk.use === d0.use, '혼자서는 판정을 안 바꿈(split을 check로 해도 idsig 대상 아님 — 이 판은 그림자만)');
ok(P.edDecide(our, { ...doc0, split: P.edSplit(rw) }, {}).split.on !== false && k(P.edDecide(our, { ...doc0, split: P.edSplit(rw) }, {}).ev, 'split').length === 1, '미리 셈한 split을 줘도 같음');

console.log('③ add — 부가기호 둘째 자리(값이 넘어올 때만)');
let e = P.edAddEv({ addCode: '03810' }, { addCode: '03810' });
ok(e.length === 1 && e[0].v === 1 && e[0].w === 0.2, '둘째 자리 같음 → 약한 같은 판 쪽(+1)');
e = P.edAddEv({ addCode: '03810' }, { addCode: '07810' });
ok(e.length === 1 && e[0].v === -1 && /3 ↔ 7/.test(e[0].d), '둘째 자리 다름 → 다른 판 쪽(−1)');
ok(P.edAddEv({ addCode: '03810' }, {}).length === 0 && P.edAddEv({}, { addCode: '03810' }).length === 0 && P.edAddEv(null, null).length === 0, '한쪽이라도 값이 없으면 줄 없음');
ok(P.edAddEv({ addCode: '123' }, { addCode: '03810' }).length === 0, '5자리가 아니면 줄 없음');
const dA = P.edDecide({ ...our, addCode: '03810' }, { ...doc0, book: { isbn13: null, addCode: '07810' } }, {});
ok(k(dA.ev, 'add').length === 1 && same(d0, dA), 'edDecide가 add 줄을 적음 · 판정 그대로');
ok(k(P.edDecide(our, { ...doc0, book: { isbn13: null } }, {}).ev, 'add').length === 0, '값이 안 넘어오면 add 줄 없음');
ok(k(P.edDecide({ ...our, addCode: '03810' }, { ...doc0, book: { addCode: '07810' } }, { sig: { add: 'off' } }).ev, 'add').length === 0, 'add를 off로 하면 없음');

console.log('④ 판매자 글(snote) — 이 판에 넣지 않음');
const Pt = rd('readnow-products-core.js');
ok(!/snote/.test(Pt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), '남의 매물 판매자 글은 저장하지 않아 snote 줄 코드가 없음(남은 일)');
const used = Pt.slice(Pt.indexOf('const listings = []'), Pt.indexOf('const pages = [...doc.querySelectorAll'));
ok(!/note|memo|comment|desc/i.test(used.replace(/sellerBadge/g, '')), '중고 매물 줄(parseUsedPage listings)에 판매자 글 칸이 없음 — 근거');

console.log('⑤ 웹앱 연결(원문 검사)');
const A = rd('src/app.html');
ok(/function edRowsOf\(l\)/.test(A) && /function edSplitTxt\(l\)/.test(A), '붙은 지표 책 중고 첫 쪽에서 줄을 모음(읽기 0)');
ok(/const rws = edRowsOf\(l\);/.test(A) && /\.\.\.\(rws \? \{ rows: rws \} : \{\}\)/.test(A), 'edJudge가 줄을 edDecide에 넘김(판정 길 하나)');
ok(/\.\.\.\(d\.split \? \{ split: d\.split \} : \{\}\)/.test(A), '판정 기록(ed)에 split 안내를 남김');
ok((A.match(/edSplitTxt\(l\)/g) || []).length >= 2, '확인 목록 줄과 판본 카드 패널에 「이 시장은 값이 두 무리」 줄');
const fn = A.slice(A.indexOf('function edRowsOf'), A.indexOf('function edJudge'));
ok(!/alert\(|confirm\(|prompt\(|db\.collection/.test(fn), '새 함수에 팝업·Firestore 읽기 없음');

console.log(bad ? `❌ ${bad}/${n} 실패` : `✓ ${n}/${n} 통과`);
process.exit(bad ? 1 : 0);
