// tREGREPICK_1119 — (regcand2b · 정범님 I-1119-1438-13) 등록 카드: 판본이 정해진 뒤에도 「🔖 판본 낱말 확인 → 후보 다시 고르기」
// 쓰는 법: node tREGREPICK_1119.js [저장소 뿌리=../..] — 가짜 상품만 씀
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
const env = { S, PRDF: () => P, edOf: (l) => { const s = P.edSuspect(l.title, null, { extra: l.subtitle || '' }); return s && s.on ? s : null; },
  esc: (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]),
  won: (v) => String(v) + '원', regCandStock: () => '',
  db: { collection: (c) => ({ doc: (d) => ({ set: (v, o) => { writes.push({ c, d, v, o }); return Promise.resolve(); } }) }) },
  firebase: { firestore: { FieldValue: { arrayUnion: (...a) => ({ _union: a }) } } } };
const F = new Function(...Object.keys(env), code + '\nreturn { regRepickOk, regRepickCands, regRepickHtml, regCandGridHtml, regEdTruth };')(...Object.values(env));

const C = [{ itemId: '11', title: '가짜 책', cov: 0.97 }, { itemId: '12', title: '가짜 책 (리커버 한정판)', cov: 0.6 }, { itemId: '13', title: '가짜 책 해설', cov: 0.3 }];
const it = { id: 'r1', q: '가짜 책', stage: 'sel', itemId: '11', info: { itemId: '11', title: '가짜 책' }, cands: C };
console.log('① 단추가 보이는 때');
ok(F.regRepickOk(it), '선택 대기 · 후보에 판본 낱말 → 단추');
ok(F.regRepickOk({ ...it, stage: 'hold' }), '보류 대기열 → 단추');
ok(!F.regRepickOk({ ...it, stage: 'pick' }), '결정 대기(값 굳음) → 단추 없음');
ok(!F.regRepickOk({ ...it, stage: 'done' }), '확정 → 단추 없음');
ok(!F.regRepickOk({ ...it, info: null }), '아직 안 고름(후보 화면) → 이 단추 없음');
ok(!F.regRepickOk({ ...it, cands: [C[0], C[2]] }), '판본 낱말이 어디에도 없음 → 단추 없음');
ok(F.regRepickOk({ ...it, cands: [], info: { itemId: '12', title: '가짜 책 (리커버 한정판)' }, itemId: '12' }), '후보는 없어도 지금 상품 제목에 판본 낱말 → 단추');
console.log('② 후보 목록');
ok(F.regRepickCands(it).length === 3, '지금 것이 후보에 있으면 그대로 3개');
{ const L = F.regRepickCands({ ...it, itemId: '99', info: { itemId: '99', title: '가짜 책 (특별판)' } }); ok(L.length === 4 && L[0].itemId === '99', '지금 것이 후보에 없으면 맨 앞에 붙임'); }
console.log('③ 카드 그림');
S._rgRepick = new Set();
{ const h = F.regRepickHtml(it); ok(/data-rgrepick="r1"/.test(h) && /후보 다시 고르기/.test(h) && !/data-rgcand=/.test(h), '접힘: 단추만(후보 격자 없음)'); ok(/판본 낱말 없음/.test(h), '지금 것 제목에 낱말 없음 표시'); }
S._rgRepick.add('r1');
{ const h = F.regRepickHtml(it); ok(/접기/.test(h), '펼침: 접기 단추'); ok((h.match(/data-rgcand="r1"/g) || []).length === 3, '후보 3개가 누를 수 있게'); ok(/class="rgcand picked" data-rgcand="r1" data-iid="11"/.test(h), '지금 고른 것에 picked'); ok(/리커버/.test(h), '판본 칩'); }
{ const h = F.regRepickHtml({ ...it, cands: [], itemId: '12', info: { itemId: '12', title: '가짜 책 (리커버 한정판)' } }); ok(/다른 후보가 없음/.test(h) && !/data-rgcand=/.test(h), '후보가 지금 것 하나뿐 → 안내 글'); }
ok(F.regRepickHtml({ ...it, stage: 'pick' }) === '', '결정 대기 → 빈 글');
console.log('④ 후보 격자 함수 = 예전 후보 화면과 같은 글');
{ const h = F.regCandGridHtml('r1', { ...it, info: null }, C); ok(/class="rgcands"/.test(h) && /rgcand-no">1</.test(h), '격자·번호'); ok(!/rgpager/.test(h), '3개면 넘김 없음'); const many = Array.from({ length: 7 }, (_, k) => ({ itemId: String(100 + k), title: '가짜 ' + k, cov: 0.5 })); ok(/rgpager/.test(F.regCandGridHtml('r1', it, many)), '7개면 5개씩 넘김'); }
console.log('⑤ 정답 표본 — 다시 고름 표시');
writes.length = 0; F.regEdTruth(it, '12');
{ const w = writes[0]; ok(w && w.c === 'prd_edkw_truth' && w.d === 'reg_r1', 'prd_edkw_truth/reg_r1'); ok(w && w.v.pick.itemId === '12' && w.v.repickAt, '고른 것 12 · repickAt'); ok(w && w.v.picks._union[0].from === '11', '내력에 바꾸기 전 11'); }
writes.length = 0; F.regEdTruth({ ...it, info: null, itemId: null }, '12'); ok(writes[0] && !writes[0].v.repickAt && !writes[0].v.picks._union[0].from, '처음 고름 → from·repickAt 없음');
console.log('⑥ 화면 연결(원본 글)');
ok(/\$\{warn\}\$\{regRepickHtml\(it\)\}\$\{body\}/.test(APP), '선택 대기 카드에 단추 자리');
ok(/querySelectorAll\('\[data-rgrepick\]'\)/.test(APP), '단추 누름 연결');
ok(/S\._rgRepick\.has\(id\)\) \{ S\._rgRepick\.delete\(id\)/.test(APP), '후보 누르면 펼침 닫음 · 지금 것이면 그대로');
ok(/\$\{regCandGridHtml\(id, it, C\)\}/.test(APP), '후보 화면도 같은 격자 함수');
ok(/\.rgrepick\{/.test(APP), '모양(CSS)');
console.log(bad ? `❌ tREGREPICK_1119 ${bad}/${n} 실패` : `✅ tREGREPICK_1119 통과 ${n}/${n}`); process.exit(bad ? 1 : 0);
