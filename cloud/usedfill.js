/* 🧩 판매 장부 상품 코드 메꾸기 (gateused1 · 2026-11-18 · 리드 장부 OPEN_lead 「판매 장부 usedCode가 10월부터 비어 R08~R17·N01~N03 연구 재료가 안 들어옴」)
 *  까닭(진단 실측 11/18): 주문 기록(crm_orders) 줄의 상품 코드(aladinUsedCode)는 사람이 고객 수집기에 넣는 「판매완료 엑셀」에서만 옴
 *   → 9/26 6줄 중 6 · 9/27 17줄 중 4 · 9/28~11/18 0(10~11월 약 1,330줄) — 엑셀을 9/27 뒤로 안 넣어서(코드가 끊긴 커밋은 없음)
 *  메꾸는 길 둘(주문 기록·상품 기록은 건드리지 않음 — 판매 장부 ml_sales는 12시간마다 다시 만드는 파생 자료라 거기에만 실음):
 *   ① 'shp' 확실 — 클라우드가 알라딘 판매관리에서 읽은 주문(shp_orders · 같은 주문번호)의 줄마다 상품 번호(listingId) → 상품 기록의 상품 코드 · 같은 ISBN 줄에
 *   ② 'isbn' 추정 — 같은 ISBN의 판매완료 상품 중 주문 시각 + 1분 전에 등록된 것(이미 다른 줄이 쓴 코드 뺌) · 값 같음(+0/2)·등급 같음(+0/1) 점수 낮은 것 → 먼저 등록된 것
 *     실측(11/18 · 코드가 있는 1,296줄에 같은 규칙을 돌려 봄): 맞음 1,282 · 틀림 14 = 98.9% · 빈 줄 1,457 중 1,244 메꿈(9월 131·10월 707·11월 406) · 후보 없음 213
 *  줄마다 how = 'x'(주문 기록에 원래 있음) · 'shp' · 'isbn' · ''(못 메꿈) — 확실한 것만 쓰려면 how가 'x'·'shp'인 줄만
 *  순수 셈(파일·Firestore 없음) — 시험 src/tests/tUSEDFILL1118.js */
'use strict';
const UF_V = '0.1.0';
const kst = (s) => { const t = String(s || ''); if (!t) return NaN; if (/Z$|[+-]\d\d:?\d\d$/.test(t)) return Date.parse(t); return Date.parse(t.slice(0, 19).replace(' ', 'T') + '+09:00'); }; /* 주문 시각·등록 시각은 한국 시각 글자('YYYY-MM-DDTHH:MM') */
const isSold = (l) => !!l && !l.active && /판매완료/.test(String(l.status || ''));
const nq = (x) => Math.max(1, parseInt(x, 10) || 1);
/* lines: [{ k, ono, at, isbn, price, grade, qty, code, ok }] — k 줄 열쇠(주문 문서|줄 번호) · ok = 메꿀 줄(판매·정상·알라딘)
 * listings: [{ code, lid, isbn, active, status, reg, price, grade }] · shp: Map(주문번호 → [상품 번호…])
 * 돌려줌 { fill: Map(k → { codes:[…], how }), st: { x, shp, isbn, none, ... } } */
function usedFill(lines, listings, shp) {
  const st = { v: UF_V, x: 0, shp: 0, isbn: 0, none: 0, shpOrders: 0 }; const fill = new Map();
  const byLid = new Map(), byIsbn = new Map(); for (const l of listings || []) { if (!l || !l.code) continue; if (l.lid) byLid.set(String(l.lid), l); if (l.isbn && isSold(l)) { const L = byIsbn.get(l.isbn); if (L) L.push(l); else byIsbn.set(l.isbn, [l]); } }
  const used = new Set(); for (const x of lines || []) if (x.code) { used.add(String(x.code)); st.x++; } /* 주문 기록에 이미 있는 코드는 먼저 맡아 둠 */
  const L = (lines || []).filter((x) => x.ok).map((x, i) => ({ x, i, t: kst(x.at) })).sort((a, b) => (a.t - b.t) || (a.i - b.i)); /* 주문 시각 차례 */
  const put = (x, c, how) => { const f = fill.get(x.k) || fill.set(x.k, { codes: [], how }).get(x.k); f.codes.push(c); used.add(c); };
  /* ① 판매관리 주문 줄(확실) — 같은 주문의 빈 줄과 같은 ISBN · ISBN을 모르면 그 주문에 빈 줄 하나·남은 상품 하나일 때만 */
  const byO = new Map(); for (const e of L) { if (e.x.code || !e.x.ono) continue; const g = byO.get(e.x.ono); if (g) g.push(e); else byO.set(e.x.ono, [e]); }
  for (const [ono, g] of byO) { const lids = shp && shp.get(String(ono)); if (!lids || !lids.length) continue; st.shpOrders++;
    const left = lids.map((id) => byLid.get(String(id))).filter((l) => l && !used.has(l.code));
    for (const e of g) { for (let q = nq(e.x.qty); q > 0; q--) { const j = left.findIndex((l) => l.isbn && e.x.isbn && l.isbn === e.x.isbn); if (j < 0) break; put(e.x, left[j].code, 'shp'); left.splice(j, 1); } }
    const blank = g.filter((e) => !fill.has(e.x.k)); if (blank.length === 1 && left.length === 1 && (!left[0].isbn || !blank[0].x.isbn)) put(blank[0].x, left.splice(0, 1)[0].code, 'shp'); }
  /* ② 같은 ISBN 판매완료 상품으로 추정 */
  for (const e of L) { const x = e.x; if (x.code) continue; if (fill.has(x.k)) { st.shp++; continue; }
    const c = (byIsbn.get(x.isbn) || []).filter((l) => !used.has(l.code) && kst(l.reg) <= e.t + 60e3);
    if (!c.length || !Number.isFinite(e.t)) { st.none++; continue; }
    const sc = (l) => (+l.price === +x.price ? 0 : 2) + ((l.grade || '') === (x.grade || '') ? 0 : 1);
    c.sort((a, b) => (sc(a) - sc(b)) || (kst(a.reg) - kst(b.reg)) || String(a.code).localeCompare(String(b.code)));
    for (let q = 0; q < Math.min(nq(x.qty), c.length); q++) put(x, c[q].code, 'isbn'); st.isbn++; }
  return { fill, st }; }
module.exports = { UF_V, usedFill, _t: { kst, isSold } };
