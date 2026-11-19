// tEDALL2_1119 — (edall3 · 판본 판 ②) 읽기 0 정체 신호 — edIdSig(찍은 번호·표지 코드·978+K코드·지표에만 있는 낱말) · edDecide가 our.scan·doc.book을 받음
// 처음엔 네 신호 모두 그림자(근거 줄에만) · 단 「찍은 번호 다름」+우리 제목 판본 낱말은 사람 확인(값은 안 움직임) · 설정 끄면 지금과 같음 — 책 이름·번호는 모두 지어낸 것
// 쓰는 법: node tEDALL2_1119.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const mk = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = mk('readnow-products-core.js');
const i13 = (b12) => { let t = 0; for (let i = 0; i < 12; i++) t += (i % 2 ? 3 : 1) * +b12[i]; return b12 + String((10 - (t % 10)) % 10); };
const A = i13('978895467715'), B = i13('978893387168'), C979 = i13('979119999999');
const k = (e, key) => (e || []).filter((x) => x.k === key);
const same = (a, b) => ['use', 'hold', 'why', 'kw', 'br', 'pick', 'ids'].every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
const our = { title: '지어낸 책 (리커버 한정판)', bookId: 'bk_1', bookTitle: '지어낸 책 (리커버 한정판)', scan: A };
const KU = 'https://x/product/1/cover500/K612731543_1.jpg', TU = 'https://x/product/1/cover500/8954677150_1.jpg';
const doc0 = { src: 'usedSearch', cands: [], at: 'x' };

console.log('① 찍은 번호(scan)');
let e = P.edIdSig(our, { isbn13: B });
ok(k(e, 'scan').length === 1 && k(e, 'scan')[0].v === -1 && k(e, 'scan')[0].w === 0.9 && k(e, 'scan')[0].d.length <= 60, '찍은 번호 ≠ 지표 번호 → 다른 판 쪽 줄(−1 · 0.9)');
e = P.edIdSig(our, { isbn13: A });
ok(k(e, 'scan').length === 1 && k(e, 'scan')[0].v === 1 && k(e, 'scan')[0].w === 0.2, '같음 → 약한 같은 판 쪽 줄(+1 · 0.2)');
ok(P.edIdSig({ ...our, scan: null }, { isbn13: B }).length === 0, '찍은 번호 없음 → 신호 없음');
ok(P.edIdSig({ ...our, scan: '123' }, { isbn13: B }).length === 0, '찍은 번호가 번호 꼴이 아님 → 신호 없음');
ok(P.edIdSig(our, null).length === 0 && P.edIdSig(our, {}).length === 0, '지표 책 정보 없음 → 신호 없음');

console.log('② 978 + K코드 · 979 + K코드');
ok(k(P.edIdSig({ title: '책' }, { isbn13: A, img: KU }), 'kcode').length === 1 && k(P.edIdSig({ title: '책' }, { isbn13: A, img: KU }), 'kcode')[0].v === -1, '978 책 + K코드 → kcode 줄(−1)');
ok(k(P.edIdSig({ title: '책' }, { isbn13: A, img: TU }), 'kcode').length === 0, '978 책 + ISBN-10 코드 → 조용');
ok(k(P.edIdSig({ title: '책' }, { isbn13: C979, img: KU }), 'kcode').length === 0, '979 책 + K코드 → 조용');

console.log('③ 표지 코드(code)');
ok(k(P.edIdSig({ title: '책', code: 'K111111111' }, { isbn13: A, img: KU }), 'code')[0].v === -1, '우리 코드 ≠ 지표 코드 → −1');
ok(k(P.edIdSig({ title: '책', code: 'K612731543' }, { isbn13: A, img: KU }), 'code')[0].v === 1, '같음 → +1');

console.log('④ 거꾸로 견주기(rev)');
e = P.edIdSig({ title: '평범한 책' }, { title: '평범한 책 (한정판)' });
ok(k(e, 'rev').length === 1 && k(e, 'rev')[0].v === -1, '지표에만 「한정판」 → rev 줄');
ok(k(P.edIdSig({ title: '평범한 책 (한정판)' }, { title: '평범한 책 (한정판)' }), 'rev').length === 0, '우리 제목에도 있으면 rev 아님');
ok(k(P.edIdSig({ title: '평범한 책', note: '저자 사인본입니다' }, { title: '평범한 책 (사인본)' }), 'rev').length === 0, '우리 유의 사항에 있으면 rev 아님');

console.log('⑤ edDecide — 처음 상태');
const base = P.edDecide(our, doc0);
const dSame = P.edDecide(our, { ...doc0, book: { isbn13: A } });
ok(same(dSame, base) && k(dSame.ev, 'scan')[0].v === 1, '찍은 번호 같음 → 판정 그대로 · 근거 줄만 더해짐');
const dDiff = P.edDecide(our, { ...doc0, book: { isbn13: B } });
ok(dDiff.use === 'check' && dDiff.hold === true && dDiff.idsig === 'scan' && /찍은 번호/.test(dDiff.why), '찍은 번호 다름 + 판본 낱말 → 사람 확인(hold)');
ok(dDiff.ev.some((x) => x.k === 'scan' && x.v === -1) && dDiff.evV === 1 && dDiff.ev.length <= 12, '근거 줄에 적힘');
const dK = P.edDecide({ ...our, scan: null }, { ...doc0, book: { isbn13: A, img: KU } });
ok(same(dK, P.edDecide({ ...our, scan: null }, doc0)) && k(dK.ev, 'kcode').length === 1, '978+K코드는 그림자 — 줄만 적히고 판정은 그대로');
const nonSus = P.edDecide({ title: '평범한 책', scan: A }, { ...doc0, book: { isbn13: B } });
ok(nonSus.on === false && nonSus.use !== 'check' && k(nonSus.ev, 'scan').length === 1, '판본 낱말 없는 책은 사람 확인으로 올리지 않음(줄만)');
ok(P.edDecide({ title: '평범한 책' }, doc0).ev === undefined, '의심 아님 + 책 정보 없음 → 지금과 똑같이 ev 없음');

console.log('⑥ 단계 설정');
const dOff = P.edDecide(our, { ...doc0, book: { isbn13: B } }, { sig: false });
ok(same(dOff, base) && !('idsig' in dOff) && k(dOff.ev, 'scan').length === 0, '설정 끄면(sig:false) 지금과 같음 · 줄도 없음');
const dSh = P.edDecide(our, { ...doc0, book: { isbn13: B } }, { sig: { scan: 'shadow' } });
ok(same(dSh, base) && k(dSh.ev, 'scan').length === 1, 'scan을 shadow로 내리면 줄만 · 판정 그대로');
const dOffOne = P.edDecide(our, { ...doc0, book: { isbn13: B } }, { sig: { scan: 'off' } });
ok(same(dOffOne, base) && k(dOffOne.ev, 'scan').length === 0, 'scan을 off로 하면 그 줄 안 만듦');
const dUp = P.edDecide({ ...our, scan: null }, { ...doc0, book: { isbn13: A, img: KU } }, { sig: { kcode: 'check' } });
ok(dUp.use === 'check' && dUp.idsig === 'kcode', '다른 신호도 check로 올리면 사람 확인');
ok(P.ED_SIG_DEF && P.ED_SIG_DEF.scan === 'check' && P.ED_SIG_DEF.kcode === 'shadow', '기본 단계: scan만 check');

console.log(bad ? `❌ ${bad}/${n} 실패` : `✓ ${n}/${n} 통과`);
process.exit(bad ? 1 : 0);
