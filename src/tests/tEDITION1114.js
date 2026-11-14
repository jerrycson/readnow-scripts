// 📚 판본 추적 엔진(cloud/edition.js · edition1 11/14) 시험 — node src/tests/tEDITION1114.js
// ① 판 표시·제목 핵심·권 ② 같은 책 판정(판본·다른 번역·원서·다른 권·세트·다른 책) ③ 링크 고르기·방향 ④ 검색 줄 풀기 ⑤ 차례(옛 판·새 판·가장 새 판) ⑥ 스스로 맞춤·채점·자기 점검 ⑦ 회차 전체(가짜 Firestore·가짜 화면 — 링크 양쪽 끝까지·중복 표시·새 판 알림)
const E = require('../../cloud/edition.js'); const X = E._t;
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };

console.log('① 판 표시·제목 핵심');
ok((X.edLabel('코스모스 (개정판)') || {}).t === '개정판', '(개정판) → 개정판');
ok((X.edLabel('자바의 정석 3판') || {}).n === 3, '3판 → n 3');
ok((X.edLabel('데미안 (리커버 특별판)') || {}).t.startsWith('리커버'), '리커버 특별판');
ok(X.edLabel('데미안') === null, '판 표시 없음 → null');
ok(X.edCore('코스모스 (개정판)') === X.edCore('코스모스'), '판 표시 뗀 제목 핵심 같음');
ok(X.edCore('총 균 쇠 - 무기·병균·금속은 인류의 운명을 어떻게 바꿨는가') === X.edCore('총, 균, 쇠'), '부제·문장부호 뗌');
ok(X.edVol('해리 포터와 마법사의 돌 2') === '2' && X.edVol('토지 3권') === '3' && X.edVol('코스모스') === null, '권 번호');

console.log('② 같은 책 판정');
const A = { iid: '1', isbn: '9788983711892', title: '코스모스', authors: ['칼 세이건'], translators: ['홍승수'], publisher: '사이언스북스', orig: 'Cosmos', pages: 719 };
const B = { iid: '2', isbn: '9788983710154', title: '코스모스 (특별판)', authors: ['칼 세이건'], translators: ['홍승수'], publisher: '사이언스북스', orig: 'Cosmos', pages: 600 };
const r1 = X.edSame(A, B); ok(r1.kind === 'edition' && r1.s >= 0.9, `특별판 = 판본 (${r1.s.toFixed(2)})`);
const Ct = { iid: '3', isbn: '9791100000001', title: '코스모스', authors: ['칼 세이건'], translators: ['서광운'], publisher: '학원사', orig: 'Cosmos', pages: 500 };
ok(X.edSame(A, Ct).kind === 'trans', '옮긴이·출판사 다름 → 다른 번역본');
const D = { iid: '4', isbn: '9780345539434', title: 'Cosmos', authors: ['Carl Sagan'], cat: '외국도서>과학', orig: null };
ok(X.edSame(A, D).kind === 'orig', '외국도서 원제 같음 → 원서');
const E2 = { iid: '5', title: '코스모스', authors: ['김철수'], publisher: '다른출판' };
ok(X.edSame(A, E2).kind === 'diff', '같은 제목 다른 지은이 → 다른 책');
ok(X.edSame({ title: '토지 1권', authors: ['박경리'] }, { title: '토지 2권', authors: ['박경리'] }).kind === 'vol', '다른 권 → vol');
ok(X.edSame({ title: '토지 1권', authors: ['박경리'] }, { title: '토지 세트 (전20권)', authors: ['박경리'] }).kind === 'set', '세트 → set');
ok(X.edSame({ title: '마법천자문 11~20 세트 - 전10권', authors: ['스튜디오 시리얼'], publisher: '아울북' }, { title: '마법천자문 31~40 개정판 세트 - 전10권', authors: ['스튜디오 시리얼'], publisher: '아울북' }, { link: true }).kind === 'vol', '실제 잘못(11/14) — 11~20 세트 ↔ 31~40 세트는 다른 묶음(알라딘 링크라도)');
ok(X.edSame({ title: '마법천자문 11~20 세트 - 전10권', authors: ['스튜디오 시리얼'], publisher: '아울북' }, { title: '마법천자문 11~20 개정판 세트 - 전10권', authors: ['스튜디오 시리얼'], publisher: '아울북' }, { link: true }).kind === 'edition', '같은 11~20 개정판 세트는 판본');
ok(X.edSame(A, { ...B, isbn: A.isbn }).kind === 'self', '같은 ISBN → self');
ok(X.edSame(A, { title: '코스모스 [전자책]', authors: ['칼 세이건'], cat: '전자책>과학' }).kind === 'format', '전자책 → format');
const L1 = X.edSame(A, { iid: '9', title: '코스모스: 가능한 세계들', authors: ['앤 드루얀'], publisher: '사이언스북스' }, { link: true }); ok(L1.kind !== 'diff' || L1.s < 0.72, '알라딘 링크라도 지은이 다르면 근거 가산만(판정은 점수대로) ' + L1.kind);

console.log('③ 링크 고르기');
const pg = { f: { iid: '100' }, segs: { renew: '<a href="/shop/wproduct.aspx?ItemId=200">' }, anchors: [
  { iid: '200', a: '코스모스 (개정판)', ctx: '이 책의 개정판이 출간되었습니다. 코스모스 (개정판) 새 상품 보기' },
  { iid: '300', a: '코스모스 (구판)', ctx: '구판 보기 코스모스 2004' },
  { iid: '400', a: '베스트셀러 1위', ctx: '이 분야 베스트 신간' },
  { iid: '500', a: '[중고] 코스모스', ctx: '중고 상품 구판' },
  { iid: '100', a: '자기 자신', ctx: '개정판' }] };
const lk = X.edLinks(pg); const by = Object.fromEntries(lk.map((x) => [x.iid, x]));
ok(by['200'] && by['200'].dir === 'newer' && by['200'].how === 'sec', '개정판 안내 칸 → 새 판(sec)');
ok(by['300'] && by['300'].dir === 'older', '구판 링크 → 옛 판');
ok(!by['400'] && !by['500'] && !by['100'], '베스트·중고·자기 자신은 뺌');
const real = X.edLinks({ f: { iid: '310909487' }, segs: { oldnew: '<a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=19839787">' }, anchors: [{ iid: '19839787', a: '철학사전 (한정판)', ctx: '<철학사전 (한정판)>의 개정판입니다. 구판 종이책 보기' }, { iid: '19839787', a: '구판 종이책 보기', ctx: '구판 종이책 보기' }] });
ok(real.length === 1 && real[0].dir === 'older' && real[0].how === 'sec', '알라딘 실제 꼴 — 새 판 화면의 「…의 개정판입니다 · 구판 종이책 보기」 → 옛 판');
const real2 = X.edLinks({ f: { iid: '3745371' }, segs: { oldnew: 'ItemId=19839787' }, anchors: [{ iid: '19839787', a: '개정판 보기', ctx: '개정판 보기' }, { iid: '405346906', a: '', ctx: '' }] });
ok(real2.length === 1 && real2[0].dir === 'newer', '알라딘 실제 꼴 — 옛 판 화면의 「개정판이 새로 출간되었습니다 · 개정판 보기」 → 새 판 · 둘레 글 없는 링크는 뺌');

console.log('④ 검색 줄');
const ln = X.edLine('칼 세이건 (지은이), 홍승수 (옮긴이) | 사이언스북스 | 2006년 12월');
ok(ln.authors[0] === '칼 세이건' && ln.translators[0] === '홍승수' && ln.publisher === '사이언스북스' && ln.pubDate === '2006-12-01', JSON.stringify(ln));

console.log('⑤ 차례');
const O = X.edOrder([{ k: 'a', d: '2010-01-01' }, { k: 'b', d: '2004-05-01' }, { k: 'c', d: '2020-03-01' }, { k: 'd', d: null }], ['a']);
ok(O.list.map((x) => x.k).join() === 'b,a,c,d', '출간일 차례(날짜 없음은 끝)');
ok(O.list.find((x) => x.k === 'b').rel === 'older' && O.list.find((x) => x.k === 'c').rel === 'newer' && O.list.find((x) => x.k === 'a').rel === 'ours' && O.list.find((x) => x.k === 'd').rel === 'unk', '옛 판·새 판·우리·모름');
ok(O.latest === 'c' && O.list.find((x) => x.k === 'c').latest === true, '가장 새 판');

console.log('⑥ 스스로 맞춤·채점·자기 점검');
const pos = Array.from({ length: 40 }, (_, i) => 0.7 + (i % 10) * 0.025), neg = Array.from({ length: 40 }, (_, i) => 0.2 + (i % 10) * 0.04);
const tn = X.edTune(pos, neg, 0.72); ok(tn.th >= 0.68 && tn.th <= 0.76 && tn.f1 >= 0.9, `문턱 ${tn.th} · F1 ${tn.f1} · ${tn.why}`);
ok(X.edTune([0.8], [0.2], 0.72).th === 0.72, '표본 모자라면 그대로');
const sc = X.edScore([{ our: 'A', same: ['B', 'C'], diff: ['D'] }], () => ({ eds: [{ isbn: 'A', kind: 'edition' }, { isbn: 'B', kind: 'edition' }, { isbn: 'D', kind: 'edition' }] }));
ok(sc.tp === 1 && sc.fp === 1 && sc.fn === 1 && sc.p === 0.5 && sc.r === 0.5, `정밀도 ${sc.p} 재현율 ${sc.r}`);
const scK = X.edSelfCheck([{ iid: '1', d: '2004-01-01', lk: [{ iid: '2', dir: 'newer' }] }, { iid: '2', d: '2010-01-01', lk: [{ iid: '1', dir: 'older' }] }]);
ok(scK.pairs === 2 && scK.sym === 2 && scK.dirOk === 2, '링크 대칭·방향 맞음');

console.log('⑦ 회차 전체(가짜 Firestore · 가짜 화면)');
(async () => {
  const store = new Map(); const getD = (p) => store.get(p);
  const docRef = (c, id) => ({ id, path: c + '/' + id, get: async () => ({ exists: store.has(c + '/' + id), id, data: () => store.get(c + '/' + id) }), set: async (v, o) => { store.set(c + '/' + id, o && o.merge ? { ...(store.get(c + '/' + id) || {}), ...v } : v); } });
  const coll = (c) => ({ doc: (id) => docRef(c, id), where: (k, op, v) => ({ select: () => ({ get: async () => ({ forEach: (fn) => { for (const [p, d] of store) if (p.startsWith(c + '/') && (op === 'in' ? v.includes(d[k]) : d[k] === v)) fn({ id: p.split('/')[1], data: () => d }); } }) }) }), limit: () => ({ get: async () => ({ docs: [] }) }), orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) });
  const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), commit: async () => { for (const [r, v, o] of ops) await r.set(v, o); } }; }, getAll: async (...refs) => Promise.all(refs.filter((r) => r && r.get).map((r) => r.get())) };
  const C = (c) => coll(c);
  store.set('prd_listings/L1', { active: true, isbn13: '9788900000002', bookId: 'B1', title: '바다의 책', priceList: 15000 });
  store.set('prd_book_metrics/B1', { availability: '구판절판', avHist: ['26111010|J>G'] });
  store.set('prd_books/B1', { isbn13: '9788900000002' });
  /* 가짜 알라딘: 판 셋(2001 → 2010(우리) → 2020) · 서로 링크 · 검색엔 다른 지은이 같은 제목 하나 · 2020년판에서 링크가 이어짐 */
  const P = { '1001': { f: { iid: '1001', isbn: '9788900000001', title: '바다의 책', authors: ['한바다'], translators: [], publisher: '물결', pubDate: '2001-03-01', pages: 300 }, nx: [['1002', '개정판 보기']] },
    '1002': { f: { iid: '1002', isbn: '9788900000002', title: '바다의 책 (개정판)', authors: ['한바다'], translators: [], publisher: '물결', pubDate: '2010-05-01', pages: 320, av: '구판절판' }, nx: [['1001', '구판 보기'], ['1003', '이 책의 개정판이 출간되었습니다']] },
    '1003': { f: { iid: '1003', isbn: '9788900000003', title: '바다의 책 (개정3판)', authors: ['한바다'], translators: [], publisher: '물결', pubDate: '2020-09-01', pages: 340 }, nx: [['1002', '구판 보기']] },
    '2001': { f: { iid: '2001', isbn: '9788911111111', title: '바다의 책', authors: ['김다른'], translators: [], publisher: '딴곳', pubDate: '2015-01-01', pages: 120 }, nx: [] } };
  const byIsbn = Object.fromEntries(Object.values(P).map((x) => [x.f.isbn, x]));
  let pages = 0; const page = { evaluate: async (fn, o) => { pages++; if (fn === X.IN_PAGE_SEARCH) return { L: [{ iid: '2001', title: '바다의 책', line: '김다른 (지은이) | 딴곳 | 2015년 1월' }, { iid: '1003', title: '바다의 책 (개정3판)', line: '한바다 (지은이) | 물결 | 2020년 9월' }] }; const x = o.iid ? P[o.iid] : byIsbn[o.isbn]; if (!x) return { none: 1 }; return { f: x.f, anchors: x.nx.map(([iid, t]) => ({ iid, a: t, ctx: t })), segs: {} }; } };
  const notes = []; const pushes = []; const pulses = [];
  const ED = E.makeEdition({ db, C, FV: {}, W: () => ({}), log: () => {}, getPage: async () => page, notes: async (ops) => notes.push(...ops), push: async (n, p) => { pushes.push(p); return { ok: 1 }; }, pulse: async (p) => pulses.push(p) });
  store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false });
  const R = await ED.tick({ force: true });
  ok(R.books.length === 1 && R.books[0].eds === 3, `한 권 · 판본 3(옛 판 1 · 우리 · 새 판 1) — ${JSON.stringify(R.books[0])}`);
  const w = getD('ed_work/w9788900000002'); ok(w && w.eds.map((e) => e.rel).join() === 'older,ours,newer' && w.latest === '9788900000003', '묶음 차례·가장 새 판');
  ok(!w.eds.some((e) => e.isbn === '9788911111111'), '다른 지은이 같은 제목은 판본 아님');
  ok(getD('ed_book/9788900000003').w === 'w9788900000002' && getD('ed_book/9788900000002').ours === true, '판본마다 묶음 가리킴(상품 상세가 씀)');
  ok(getD('ed_info/9788900000002').dupOf === 'prd_books/B1' && getD('ed_info/9788900000001').dupOf === null && getD('ed_info/9788900000001').f.title, '우리 도서 기록에 있으면 중복 표시 · 없으면 정보 모두');
  ok(notes.length === 0 && pushes.length === 0, '첫 회차는 기준선 — 알림 없음');
  /* 새 판이 새로 나옴(2025) → 다시 보기에서 알림 */
  P['1004'] = { f: { iid: '1004', isbn: '9788900000004', title: '바다의 책 (개정4판)', authors: ['한바다'], translators: [], publisher: '물결', pubDate: '2025-10-01', pages: 350 }, nx: [['1003', '구판 보기']] }; byIsbn['9788900000004'] = P['1004']; P['1003'].nx.push(['1004', '개정판이 출간되었습니다']);
  store.set('ed_book/9788900000002', { ...getD('ed_book/9788900000002'), nextAt: '2000-01-01T00:00:00Z' }); for (const k of [...store.keys()]) if (k.startsWith('ed_info/')) store.set(k, { ...store.get(k), at: '2000-01-01T00:00:00Z' });
  const R2 = await ED.tick({ force: true });
  const w2 = getD('ed_work/w9788900000002'); ok(w2.eds.length === 4 && w2.latest === '9788900000004' && w2.runs === 2, `다시 보기 — 판본 4 · 가장 새 판 2025 · runs ${w2.runs}`);
  ok(notes.length === 1 && /새 판본 1권/.test(notes[0].data.title) && pushes.length === 1, '새 판 알림 — 작업판 카드 1 · 알림 1');
  ok(w2.hist.length === 2 && w2.hist[1].add.includes('9788900000004'), '바뀜 기록(지우지 않음)');
  const L = [...store.keys()].filter((k) => k.startsWith('ed_ledger/')); ok(L.length >= 1, '장부 남김 ' + L.length);
  const st = getD('app_settings/ed_study'); ok(st && st.today && st.today.books >= 2 && st.cfg.accept, '연구 요약(오늘 셈)');
  /* 사슬을 다 못 본 회차(partial) 뒤 이어 본 새 판은 알림 아님 */
  store.set('ed_work/w9788900000002', { ...getD('ed_work/w9788900000002'), partial: 'link' }); P['1005'] = { f: { iid: '1005', isbn: '9788900000005', title: '바다의 책 (개정5판)', authors: ['한바다'], translators: [], publisher: '물결', pubDate: '2026-01-01', pages: 360 }, nx: [['1004', '구판 보기']] }; byIsbn['9788900000005'] = P['1005']; P['1004'].nx.push(['1005', '개정판이 출간되었습니다']);
  store.set('ed_book/9788900000002', { ...getD('ed_book/9788900000002'), nextAt: '2000-01-01T00:00:00Z' }); for (const k of [...store.keys()]) if (k.startsWith('ed_info/')) store.set(k, { ...store.get(k), at: '2000-01-01T00:00:00Z' });
  await ED.tick({ force: true }); ok(getD('ed_work/w9788900000002').eds.length === 5 && notes.length === 1, '이어 본 회차(앞 회차 partial)는 새 판 알림 안 함');
  console.log(bad ? `\n✗ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('✗ 오류', e); process.exit(1); });
