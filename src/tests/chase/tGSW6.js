// tGSW6 — 🎚 그룹 전략 창 판 ⑥: 👤 엮이는 판매자 목록·카드 (정범님 11/19 I-1119-1304-10 · 일꾼 strat6 · 설계 STRAT_DESIGN_1119 4.1·4.2) 시험
// 실행: node src/tests/chase/tGSW6.js
//  ① 첫 쪽 8권 — 겹침·싼 책·최저가 차지가 slObsBook 결과와 같음 ② 우리 가게 줄은 판매자 목록에 없음 ③ 값 버릇(가운데 값·같은 값 비율) 맞음 ④ 표본이 적으면 「아직 모름」
//  ⑤ 펼칠 때만 그 판매자 기록을 읽음 ⑥ 두 값 계단 그림 ⑦ 정렬·거르기 ⑧ 판매자 이름은 「판매자A」 같은 가짜 · Firestore 읽기·쓰기 0
const fs = require('fs'), path = require('path'), vm = require('vm');
const firstOf = (c) => c.find((x) => fs.existsSync(x)) || c[0];
const APP = fs.readFileSync(firstOf([path.join(__dirname, '../../app.html'), path.join(__dirname, '../../../app.html')]), 'utf8');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const cut = (a, b) => { const i = APP.indexOf(a), j = APP.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('원본에서 못 찾음: ' + a); return APP.slice(i, j); };
const BLK6 = cut('/* ◆gsw6 시작', '/* ◆gsw6 끝 */'); const OBS = cut('function slObsBook(', '/* 훑기: 우리 판매 중'); const GR = APP.split('\n').find((l) => l.startsWith('const SLOBS_GR = '));
const SUM = cut('function slFightPerf(', '/* 이 판매자가 걸린 묶음');
ok(!!BLK6 && !!OBS && !!GR, '원본에서 시험할 조각을 찾음'); ok(!/\b(alert|confirm|prompt)\(/.test(BLK6), '👤 블록에 브라우저 팝업 없음');
for (const f of ['gswSlBooks', 'gswSlHabit', 'gswSlScan', 'gswSlRows', 'gswSlHtml', 'gswSlCard', 'gswSlLine', 'gswSlClick', 'gswSlChange', 'gswSlGroupsOf', 'gswSlSellerBtns']) ok(new RegExp('function ' + f + '\\(').test(BLK6), '함수 ' + f + ' 있음');
ok(/data-gswsl="seller"/.test(BLK6) && /🔭 판매자 창 열기/.test(BLK6) && /이 판매자로 묶음 상품 거르기/.test(BLK6) && /🧭 벤치마킹/.test(BLK6), '카드에 판매자 창·벤치마킹·묶음 거르기 길이 있음');
ok(/\$\{gswSlHtml\(P, g\)\}/.test(APP) && /gswSlSellerBtns\(/.test(APP.slice(APP.indexOf('function slFightBody('), APP.indexOf('function slFightBind('))), '창 안 칸·판매자 창 🎚 단추가 이어짐');

const calls = { db: 0, load: [], paint: 0, rel: 0, go: [] };
const OUR = '996008';
// 첫 쪽 8권 — 우리 값 10000 · 판매자A: 1~3권 싸게(9000·8000·7000) · 4권 같은 값 · 5권 비쌈 · 6~8권 없음 / 판매자B: 1·2권만 / 판매자C: 1권만
const our = [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000];
const page = (i) => { const r = [{ sellerCode: OUR, price: 10000, grade: '상', soldOut: false }];
  const A = [9000, 8000, 7000, 10000, 12000][i]; if (A) r.push({ sellerCode: 'A', price: A, grade: '상', soldOut: false });
  if (i < 2) r.push({ sellerCode: 'B', price: 9500, grade: '중', soldOut: false }); if (i === 0) r.push({ sellerCode: 'C', price: 9900, grade: '상', soldOut: false });
  r.push({ sellerCode: 'D', price: 11000 + i, grade: '하', soldOut: i === 7 }); r.push({ sellerCode: 'E', price: 9800, grade: '상', soldOut: false }); r.push({ sellerCode: 'F', price: 9700, grade: '상', soldOut: false }); return r; };
const ctxMk = () => { const S = { plist: new Map(), pmetrics: new Map(), prBatches: [{ id: 'g1', name: '그룹1' }], sellers: new Map([['sc_A', { id: 'sc_A', name: '판매자A', aladinGrade: '전문셀러', outstockRate: 3, totalItems: 120 }]]), prCfg: {}, bkfold: {}, _chRel: null };
  for (let i = 0; i < 8; i++) { S.plist.set('l' + i, { id: 'l' + i, active: true, bookId: 'b' + i, price: our[i], usedCode: 'U' + i, title: '책' + i }); S.pmetrics.set('b' + i, { usedFirstPage: page(i) }); }
  const html = { v: '' }; const ov = { set innerHTML(x) { html.v = x; }, get innerHTML() { return html.v; }, querySelector: () => null };
  const db = new Proxy({}, { get: () => { calls.db++; throw new Error('Firestore를 부름'); } }); const st = {};
  const ctx = { console, S, db, setTimeout, clearTimeout, localStorage: { getItem: () => null, setItem: () => {} }, document: { getElementById: (id) => (id === 'gsw_ov' ? ov : null) }, OUR_SC: OUR, PHONE_THIN: false,
    esc: (s) => String(s ?? ''), num: (v) => String(v), won: (v) => v + '원', errKo: (e) => String(e && e.message), slObsCfg: () => ({ fairBand: 10, dumpBelow: 60, sampleMin: 3, fastLagMin: 60 }), p1Has: (m) => !!(m && m.usedFirstPage),
    p1Scan: (m, fn) => m.usedFirstPage.forEach((r, i) => fn(r.sellerCode, r.price, r.grade, !!r.soldOut, i)), gswFacts: () => [...S.plist.values()].map((l) => ({ k: 'aladin_' + l.usedCode, l })), gswPaint: () => { calls.paint++; ctx.paintHtml = null; try { ctx.paintHtml = ctx.gswSlHtml(S._gsw, S.prBatches[0]); } catch (e) { ctx.paintErr = e; } },
    chRelOf: (sc) => (S._chRel && S._chRel.map ? S._chRel.map.get(sc) || null : null), chRelGet: () => { calls.rel++; S._chRel = { map: new Map([['A', { n: 6, moves: 4, lagN: 4, lagSum: 200, lastAt: '2026-11-10T01:00:00Z' }]]), list: [] }; return Promise.resolve([]); },
    slChLag: (r) => (r && r.lagN ? r.lagSum / r.lagN : null), slChLagTxt: (m) => Math.round(m) + '분', slRateTxt: () => '97.0%', cheEng: () => ({ STRATS_ALL: { follow: '따라가기' } }), bkfJs: (o) => JSON.stringify(o), gswClose: () => {}, openSeller: (id) => calls.go.push('seller:' + id), openBench: (sc) => calls.go.push('bench:' + sc), openChaseEngine: () => calls.go.push('chase'), openBatchGroup: () => calls.go.push('group'), toast: () => {}, history: { pushState: () => {} },
    slFightSt: (sc) => (st[sc] = st[sc] || { logs: null, eps: null, busy: false, err: null }), slFightLoad: (sc) => { calls.load.push(sc); const X = st[sc] = st[sc] || {}; X.logs = [{ at: '2026-11-01T01:00:00Z', usedCode: 'U0', title: '책0', from: 10000, to: 9500, chPrev: 9800, chP: 9400 }, { at: '2026-11-02T01:00:00Z', usedCode: 'U0', title: '책0', from: 9500, to: 9000, chPrev: 9400, chP: 9000 }, { at: '2026-11-03T01:00:00Z', usedCode: 'U9', title: '다른 그룹 책', from: 5000, to: 4800, chP: 4700 }]; X.eps = [{ strat: 'follow', active: false, end: 'gone' }]; return Promise.resolve(X); },
    bkfNorm: () => ({ folds: {} }) };
  vm.createContext(ctx); vm.runInContext(`${GR}\n${OBS}\n${SUM}\n${BLK6}\nglobalThis.E = { gswSlBooks, gswSlHabit, gswSlScan, gswSlRows, gswSlHtml, gswSlCard, gswSlLine, gswSlClick, gswSlChange, gswSlView, slObsBook };`, ctx); return { E: ctx.E, S, ctx, ov, html }; };

(async () => {
  const T = ctxMk(); const P = { fid: 'f1', gid: 'g1', draft: {}, base: {} }; T.S._gsw = P; const g = T.S.prBatches[0];
  await T.E.gswSlScan(P, g); const X = P._sl; ok(X && X.M && !X.err, '훑기가 끝남'); ok(X.total === 8 && X.nodata === 0, '8권을 훑음');
  /* ① slObsBook 결과와 같음 */
  { const ref = new Map(); const cfg = { fairBand: 10, dumpBelow: 60, sampleMin: 3 }; for (let i = 0; i < 8; i++) T.E.slObsBook(page(i).map((r) => ({ sc: r.sellerCode, p: r.price, g: r.grade, so: !!r.soldOut })), our[i], cfg, ref);
    let same = ref.size === X.M.o.size; for (const [sc, o] of ref) same = same && JSON.stringify(o) === JSON.stringify(X.M.o.get(sc)); ok(same, '겹침·싼 책·최저가 차지가 slObsBook 결과와 같음');
    const A = X.M.o.get('A'); ok(A[0] === 5 && A[1] === 3, '판매자A 겹침 5권 · 우리보다 쌈 3권'); const x = X.M.x.get('A'); ok(x.eq === 1 && x.ours === 1 && x.gaps.length === 3, '같음 1 · 우리가 쌈 1 · 싼 책 3'); }
  /* ② 우리 가게 줄은 없음 */
  const R = T.E.gswSlRows(P); ok(!R.all.some((r) => r.sc === OUR), '우리 가게는 판매자 목록에 없음'); ok(R.all.length === 6, '판매자 6명(A~F)'); ok(R.list[0].sc !== OUR && R.list[0].ov >= R.list[1].ov, '겹침 많은 차례가 기본');
  /* ③ 값 버릇 */
  { const h = T.E.gswSlHabit(X.M.x.get('A'), 3); ok(!h.unknown && h.n === 5, '표본 5권'); ok(Math.abs(h.med - 20) < 1e-9, '가운데 값 = 우리보다 20% 낮게 (10·20·30%)'); ok(Math.abs(h.same - 0.2) < 1e-9, '같은 값 비율 20%'); }
  /* ④ 표본 적음 */
  { const h = T.E.gswSlHabit(X.M.x.get('C'), 3); ok(h && h.unknown, '겹침 1권이면 아직 모름'); const row = R.all.find((r) => r.sc === 'C'); ok(!!row && row.hab.unknown, '목록 줄도 모름'); }
  /* ⑧ 이름 */
  { const html = T.E.gswSlHtml(P, g); ok(/판매자A/.test(html) && /겹치는 판매자 6명/.test(html), '목록 글에 판매자A · 6명'); ok(/#C/.test(html), '이름 모르면 번호로'); ok(!/<script/i.test(html), '스크립트 글자 없음'); ok(T.ctx.PHONE_THIN === false && (html.match(/gsw-sl-r"/g) || []).length === 6, '줄 6개(펼침 전 카드 없음)'); ok(!/주고받은 값/.test(html), '펼치기 전엔 카드가 없음'); }
  /* ⑤ 펼칠 때만 읽음 */
  ok(calls.load.length === 0 && calls.db === 0, '펼치기 전 서버 읽기 0');
  T.E.gswSlClick(P, g, {}, { gswsl: 'open', sc: 'A' }); await new Promise((r) => setTimeout(r, 5)); ok(calls.load.length === 1 && calls.load[0] === 'A', '펼친 판매자 것만 읽음(slFightLoad 한 번)'); ok(calls.rel === 1, '추격 관계(chRelGet)도 한 번');
  { const html = T.E.gswSlHtml(P, g); ok(/주고받은 값/.test(html) && /gsw-sl-svg/.test(html), '카드에 계단 그림'); ok(/추격 기록 6번/.test(html) && /우리 값 바꿈 4번/.test(html) && /50분/.test(html), '관계 요약(6번·4번·평균 50분)'); ok(/가운데 20% 낮게/.test(html), '값 버릇이 카드에 보임'); ok(!/다른 그룹 책/.test(html), '이 그룹 책 것만 그림(다른 책 기록은 빠짐)'); ok(/🔭 판매자 창 열기/.test(html) && /평점 97.0%/.test(html), '버튼·판매자 품질 줄');
    T.E.gswSlClick(P, g, {}, { gswsl: 'allbk' }); const h2 = T.E.gswSlHtml(P, g); ok(/다른 그룹 책/.test(h2), '「가게 전체 보기」에서는 다른 책 기록도 보임'); T.E.gswSlClick(P, g, {}, { gswsl: 'allbk' }); }
  ok(calls.db === 0, 'Firestore 직접 부름 0');
  /* 판매자 창·벤치·그룹 거르기 길 */
  T.E.gswSlClick(P, g, {}, { gswsl: 'seller', sc: 'A' }); T.E.gswSlClick(P, g, {}, { gswsl: 'bench', sc: 'A' }); T.E.gswSlClick(P, g, {}, { gswsl: 'filt', sc: 'A' }); ok(T.ctx.calls === undefined && calls.go.join() === 'seller:sc_A,bench:A,group', '🔭·🧭·거르기 길이 맞는 곳으로');
  /* ⑥ 그림 */
  { ok(T.E.gswSlLine([{ at: '2026-11-01T00:00:00Z', to: 100, chP: 90 }]) === '', '한 점이면 그림 없음'); const sv = T.E.gswSlLine([{ at: '2026-11-01T00:00:00Z', to: 100, chP: 90 }, { at: '2026-11-02T00:00:00Z', to: 90, chP: 85 }, { at: '2026-11-03T00:00:00Z', to: 90, chP: 80 }]); ok(/<svg/.test(sv) && (sv.match(/<path/g) || []).length === 2 && /H/.test(sv) && /V/.test(sv), '두 줄 계단 선'); }
  /* ⑦ 정렬·거르기 */
  { const V = T.E.gswSlView(P); V.s = 'cheap'; let L = T.E.gswSlRows(P).list; ok(L[0].cheap === 8 && L.every((r, i) => !i || L[i - 1].cheap >= r.cheap) && L.find((r) => r.sc === 'A').cheap === 3, '싼 책 많은 차례(E·F 8권 → A 3권)'); V.s = 'chase'; L = T.E.gswSlRows(P).list; ok(L[0].sc === 'A', '추격 기록 많은 순 첫째 A(관계를 읽은 뒤)'); V.f = 'chased'; L = T.E.gswSlRows(P).list; ok(L.length === 1 && L[0].sc === 'A', '추격한 판매자만'); V.f = 'cheap'; L = T.E.gswSlRows(P).list; ok(L.every((r) => r.cheap > 0), '우리보다 싼 판매자만'); }
  console.log(bad ? `❌ tGSW6 실패 ${bad}/${n}건` : `✅ tGSW6 통과 ${n}건`); process.exit(bad ? 1 : 0);
})();
