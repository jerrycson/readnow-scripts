'use strict';
/* (edall0 판 ⓪ 11/19 · 설계 reports/EDALL_DESIGN_1119.md 4-4) 📏 읽기 0 진단 셈 — 진단 edkw=1 갈래가 부름 · 읽기만 · 상품 제목·번호만(고객 정보 없음) · 알라딘 읽기 0
 *  셈 칸: ① 978 번호인데 표지 코드(aladinCode)가 K인 상품과 그 판본 낱말 비율(방안 2 가설)
 *         ② 도서 제목엔 판본 낱말이 있는데 우리 제목엔 없는 수(방안 14)
 *         ③ 찍은 번호(도서 기록 barcode)가 남은 상품 비율과 그 번호가 우리 ISBN과 다른 수(방안 13)
 *         ④ 의심 상품 가운데 부가기호(국립중앙도서관 자료 addCode)가 있는 비율(방안 3·16)
 *         ⑤ 의심 상품 가운데 ed_book(판본 묶음)이 있는 비율(방안 6)
 *         ⑥ 판본 확인에 쓴 시장 가운데 값이 두 무리인 수(방안 9 · 6,000원대·28,000원대 같은 꼴)
 *         ⑦ 정답 표본 건수(prd_edkw_truth)
 *  I = { P: 상품 공용 api(edSuspect·edKwOf), listings: [{title, active, status, mediaType, bookId, isbn13, isbn10, aladinCode}],
 *        books: {도서번호: {title, barcode, isbn13, isbn10, aladinCode}}, ext: {ISBN13: true(부가기호 있음)}, edBook: [ISBN13…], markets: [{cands: [{price}]}], truth }
 *  순수 함수 — Firestore·알라딘을 부르지 않음(시험 src/tests/tEDALL0_1119.js 가 가짜 자료로 돌림) */

const GAP = 1.8, MIN_SIDE = 3, HYP = 0.3;

const digits = (s) => String(s == null ? '' : s).replace(/[^0-9Xx]/g, '').toUpperCase();
const isMedia = (t) => /^(video|music)$/.test(String(t || ''));
const ratio = (a, b) => (b ? Math.round((a / b) * 1000) / 1000 : null);

/* 가격 값을 오름차순으로 두고 가장 큰 틈(비율)이 GAP 이상이며 양쪽이 MIN_SIDE 이상이면 두 무리 */
function twoGroups(prices) {
  const ps = prices.filter((p) => p > 0).sort((a, b) => a - b);
  if (ps.length < 2 * MIN_SIDE) return null;
  let best = null;
  for (let i = MIN_SIDE; i <= ps.length - MIN_SIDE; i++) { const r = ps[i] / ps[i - 1]; if (r >= GAP && (!best || r > best.r)) best = { i, r }; }
  if (!best) return null;
  return { lo: best.i, hi: ps.length - best.i, r: Math.round(best.r * 100) / 100, low: ps[best.i - 1], high: ps[best.i] };
}

/* 의심 상품(판본 낱말 · 괄호 있음, 매체 상품 빼고)의 ISBN13 목록 — 부가기호·ed_book을 읽을 번호를 정하는 데 씀 */
function suspectIsbns(I) {
  const out = new Set();
  for (const l of I.listings || []) {
    if (isMedia(l.mediaType)) continue;
    const e = I.P.edSuspect(String(l.title || ''));
    if (!e || !e.on) continue;
    const i13 = digits(l.isbn13);
    if (/^97[89]\d{10}$/.test(i13)) out.add(i13);
  }
  return [...out];
}

function count(I) {
  const P = I.P, B = I.books || {}, X = I.ext || {}, EB = new Set(I.edBook || []);
  const o = { n: 0, act: 0, k978: 0, k978K: 0, k978KKw: 0, bookN: 0, bookKw: 0, lostKw: 0, scanN: 0, scanDiff: 0, sus: 0, susExt: 0, susEdBook: 0, mk: 0, two: 0, twoSamp: [] };
  for (const l of I.listings || []) {
    o.n++;
    if (l.active !== false && l.status !== '삭제') o.act++;
    const t = String(l.title || '');
    const i13 = digits(l.isbn13), i10 = digits(l.isbn10), code = String(l.aladinCode || '').toUpperCase();
    const ourKw = P.edKwOf(t);
    if (/^978\d{10}$/.test(i13)) { o.k978++; if (/^K\d{9}$/.test(code)) { o.k978K++; if (ourKw.length) o.k978KKw++; } }
    const b = l.bookId ? B[String(l.bookId)] : null;
    if (b) {
      o.bookN++;
      if (P.edKwOf(String(b.title || '')).length) { o.bookKw++; if (!ourKw.length) o.lostKw++; }
      const bc = digits(b.barcode);
      if (bc) { o.scanN++; if (bc.length >= 10 && bc !== i13 && bc !== i10) o.scanDiff++; }
    }
    if (isMedia(l.mediaType)) continue;
    const e = P.edSuspect(t);
    if (!e || !e.on) continue;
    o.sus++;
    if (i13 && X[i13]) o.susExt++;
    if (i13 && EB.has(i13)) o.susEdBook++;
  }
  for (const m of I.markets || []) {
    o.mk++;
    const g = twoGroups((m.cands || []).map((c) => +c.price));
    if (g) { o.two++; if (o.twoSamp.length < 10) o.twoSamp.push(g); }
  }
  o.hyp = ratio(o.k978KKw, o.k978K);
  o.hypVerdict = o.hyp == null ? '모름(978+K 상품 없음)' : o.hyp >= HYP ? '가설 맞음(30% 이상) — 판 ②는 그대로' : '가설 약함(30% 아래) — 판 ②에서 이 신호 무게를 0.2로';
  o.scanRate = ratio(o.scanN, o.n); o.scanDiffRate = ratio(o.scanDiff, o.scanN);
  o.extRate = ratio(o.susExt, o.sus); o.edBookRate = ratio(o.susEdBook, o.sus);
  o.twoRate = ratio(o.two, o.mk); o.lostRate = ratio(o.lostKw, o.bookKw);
  o.truth = I.truth == null ? null : I.truth;
  return o;
}

module.exports = { count, suspectIsbns, twoGroups, GAP, MIN_SIDE, HYP };
