// tREGCANDED_1119 — (regcand2 · 정범님 I-1119-1247-09 · REGCAND1 길 ①) 등록 후보 판본 판별: 카드 판본 칩 · 「🔖 판이 여럿 — 확인」 띠 · 자동 고름 막기 · ISBN 1줄 판본 묻기 · 정답 표본 모양
// 쓰는 법: node tREGCANDED_1119.js [저장소 뿌리=../..] — 가짜 상품만 씀
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const load = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = load('readnow-products-core.js');
const APP = rd(fs.existsSync(path.join(R, 'src/app.html')) ? 'src/app.html' : 'app/index.html');
const cut = (a, b) => { const i = APP.indexOf(a); const j = APP.indexOf(b, i); if (i < 0 || j < 0) throw new Error('못 찾음 ' + a); return APP.slice(i, j + b.length); };
const code = cut('/* ◆regcanded 시작', '/* ◆regcanded 끝 */');
const writes = [];
const S = { app: {}, user: { email: 'test@x' } };
const env = { S, PRDF: () => P, edOf: (l) => { if (S.app.edSearch === false) return null; const s = P.edSuspect(l.title, null, { extra: l.subtitle || '' }); return s && s.on ? s : null; },
  esc: (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]),
  db: { collection: (c) => ({ doc: (d) => ({ set: (v, o) => { writes.push({ c, d, v, o }); return Promise.resolve(); } }) }) },
  firebase: { firestore: { FieldValue: { arrayUnion: (...a) => ({ _union: a }) } } } };
const F = new Function(...Object.keys(env), code + '\nreturn { regCandEd, regCandEdTxt, regCandEdMulti, regCandAuto, regIsbnEdHold, regEdHoldPatch, regCandChip, regEdTruth, REG_ED_ASK, _rgEdC };')(...Object.values(env));

console.log('① 판본 낱말 판정 — edOf(products-core) 그대로');
ok(F.regCandEd('가짜 책') === null, '판본 낱말 없는 제목 → 없음');
{ const e = F.regCandEd('가짜 책 (리커버 한정판)'); ok(e && e.kw.includes('리커버') && e.kw.includes('한정'), `리커버 한정판 → 낱말 ${e && e.kw.join('·')}`); }
{ const e = F.regCandEd('가짜 책 (Special Edition)'); ok(e && F.regCandEdTxt(e).length > 0, `Special Edition → ${F.regCandEdTxt(e)}`); }
ok(F.regCandEd('가짜 책 (나의 부제)') === null, '판본 낱말 없는 부제 괄호(tier 2) → 칩·띠 없음');
ok(F.regCandEd('가짜 책', '리커버 에디션') !== null, '부제에 판본 낱말 → 걸림');

console.log('② 자동 고름 — 예전 조건 그대로 · 판본 낱말이 있으면 막음');
const plain = [{ itemId: '1', title: '가짜 책', cov: 0.97 }, { itemId: '2', title: '가짜 책 해설', cov: 0.5 }];
ok(F.regCandAuto(plain, '가짜 책') === true, '판본 낱말 없는 묶음 → 예전처럼 저절로 고름');
const mix = [{ itemId: '1', title: '가짜 책', cov: 0.97 }, { itemId: '2', title: '가짜 책 (리커버 한정판)', cov: 0.6 }];
ok(F.regCandAuto(mix, '가짜 책') === 'ed', '후보 하나에 리커버 한정판 → ed(묻기)');
ok(F.regCandAuto([{ itemId: '1', title: '가짜 책', cov: 0.97 }], '가짜 책 리커버') === 'ed', '우리 검색어에 판본 낱말 → ed');
ok(F.regCandAuto([{ itemId: '1', title: '가짜 책', cov: 0.9 }, { itemId: '2', title: '가짜 책 2', cov: 0.88 }], '가짜 책') === false, '예전에도 못 고르던 것 → false 그대로');
ok(F.regCandAuto([{ itemId: '1', title: '가짜 책 (리커버)', cov: 0.6 }], '가짜 책') === false, '예전에 못 고르던 것은 ed가 아니라 false');
ok(/판이 여럿/.test(F.REG_ED_ASK), '묻는 글');
S.app.edSearch = false; ok(F.regCandAuto(mix, '가짜 책') === true, '⚙ 판본 검색 끔 → 예전 그대로'); S.app.edSearch = undefined;

console.log('③ ISBN 1줄 — 판본 낱말이면 카드 하나로 묻기');
const rEd = { itemId: '9001', title: '가짜 책 (20주년 기념 에디션)', author: '가짜 지은이', publisher: '가짜 출판사', priceList: 15000, cover: 'https://x/c.jpg', scmCode: 'K000000001', by: 'pc' };
ok(F.regIsbnEdHold({ isbn: '9780000000001' }, rEd) === true, 'ISBN 줄 + 판본 낱말 → 막음');
ok(F.regIsbnEdHold({ isbn: '9780000000001', itemId: '9001' }, rEd) === false, '사람이 이미 상품번호를 골랐으면 막지 않음');
ok(F.regIsbnEdHold({ isbn: '9780000000001' }, { ...rEd, title: '가짜 책' }) === false, '판본 낱말 없으면 예전처럼 바로');
ok(F.regIsbnEdHold({ q: '가짜 책' }, rEd) === false, '상품명 줄은 이 길이 아님');
{ const p = F.regEdHoldPatch(rEd, '2026-11-19T00:00:00Z'); ok(p.cands.length === 1 && p.cands[0].itemId === '9001' && p.cands[0].code === 'K000000001' && p.cands[0].priceList === 15000, '후보 카드 하나(상품번호·코드·정가)');
  ok(p.edHold && p.edHold.title === rEd.title && !('by' in p.edHold) && !('stage' in p), '읽은 정보는 edHold에(by 뺌) · 단계는 그대로(조회 대기)');
  ok(/판본 확인/.test(p.lookErr) && /에디션/.test(p.lookErr), '안내 글에 판본 낱말'); }

console.log('④ 카드 칩');
{ const c = F.regCandChip({ title: '가짜 책 (리커버 한정판)' }, true, '가짜 책'); ok(/🔖/.test(c) && /리커버/.test(c), '판본 낱말 칩'); }
{ const c = F.regCandChip({ title: '가짜 책' }, true, '가짜 책'); ok(/판본 낱말 없음/.test(c), '띠가 켜졌는데 낱말 없는 후보 → 흐린 칩'); }
ok(F.regCandChip({ title: '가짜 책' }, false, '가짜 책') === '', '띠 없으면 칩 없음(화면 그대로)');
{ const c = F.regCandChip({ title: '가짜 책 (리커버)' }, true, '가짜 책 리커버'); ok(/✓ 판 맞음/.test(c), '검색어 판과 같은 후보 → ✓ 판 맞음'); }
{ const c = F.regCandChip({ title: '가짜 책' }, true, '가짜 책 리커버'); ok(/✗ 판 다름/.test(c) && /빠진 낱말/.test(c), '검색어 판이 빠진 후보 → ✗ 판 다름(빠진 낱말)'); }

console.log('⑤ 정답 표본(prd_edkw_truth/reg_…)');
writes.length = 0; F.regEdTruth({ id: 'r1', q: '가짜 책', cands: plain }, '1'); ok(writes.length === 0, '판본 낱말 없는 묶음 → 쓰지 않음');
F.regEdTruth({ id: 'r2', q: '가짜 책', cands: mix }, '2');
{ const w = writes[0]; ok(w && w.c === 'prd_edkw_truth' && w.d === 'reg_r2' && w.o && w.o.merge, 'reg_ 앞글자 열쇠 · merge'); const v = (w || {}).v || {};
  ok(v.src === 'reg' && v.pick && v.pick.itemId === '2' && /리커버/.test(v.pick.ed || '') && v.cands.length === 2 && v.cands[1].ed && v.cands[0].ed === null, '{후보 판본 칩들, 고른 것}');
  ok(v.picks && v.picks._union && v.picks._union[0].itemId === '2', '고른 내력은 쌓음(arrayUnion)'); }
writes.length = 0; F.regEdTruth({ id: 'r3', isbn: '9780000000001', edHold: rEd, cands: F.regEdHoldPatch(rEd, 'x').cands }, '9001'); ok(writes[0] && writes[0].v.isbnOne === true && writes[0].v.isbn === '9780000000001', 'ISBN 1줄 판본 확인도 표본(isbnOne)');

console.log('⑥ 조회 경로에 걸렸는지(글자 확인)');
ok((APP.match(/regIsbnEdHold\(it, r\)/g) || []).length >= 3, 'ISBN 1줄 세 곳(Firebase 기록·큰 조회·한 줄 조회)');
ok((APP.match(/const aR = regCandAuto\(C, it\.q\), auto = aR === true;/g) || []).length === 2, '상품명 자동 고름 두 곳');
ok(!/const auto = top && \(\(top\.cov >= 0\.95 && \(!second/.test(APP), '예전 자동 고름 식이 남지 않음');
ok(/rgcand-edband/.test(APP) && /regCandChip\(cd, EDM, it\.q\)/.test(APP), '카드 띠·칩');
ok(/regEdTruth\(it0, b\.dataset\.iid\)/.test(APP) && /edHold: null/.test(APP), '고를 때 정답 표본 · edHold 풀기');

console.log(`\n${bad ? "❌ tREGCANDED_1119 실패" : "✅ tREGCANDED_1119 통과"} ${n - bad}/${n}`); process.exit(bad ? 1 : 0);
