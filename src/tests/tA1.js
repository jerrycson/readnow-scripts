// 🤖 자동 발송요청 판단(readnow-shipping-core autoShipDecide) 단위 시험 — 노드만 (화면 없음)
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
const ev = ML.evalSale; let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const row = (c, g, p, extra) => ({ c, g, p, s: 0, so: 0, ...(extra || {}) });
const E = (rows, extra) => ({ mkt: { at: '2026-10-26T01:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true }, via: 'ours', ...(extra || {}) });
const ord = (items) => ({ orderNo: 'O1', buyer: '홍길동', items });
const it = (lid, price, qty, g) => ({ listingId: lid, title: '책' + lid, price, qty: qty || 1, grade: g || '상' });
const base = { evalSale: ev, now: 1000, firstAt: 1000 };
// 1) 모두 통과
let D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 10000), row('dkgreen', '상', 11000)]) } });
ok(D.state === 'pass' && D.total === 9000 && D.top.title === '책1', '유효 최저가보다 10% 쌈 → 통과 · 총액·대표 상품');
// 2) 25% 경계: 정확히 25% 쌈 → 통과, 26% → 검토
D = SH.autoShipDecide({ ...base, order: ord([it('1', 7500)]), enrich: { 1: E([row('green', '상', 10000)]) } }); ok(D.state === 'pass', '정확히 25% 쌈(7,500 vs 10,000) → 통과 (\'넘게\'가 아님)');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 7400)]), enrich: { 1: E([row('green', '상', 10000)]) } }); ok(D.state === 'review' && D.kinds.includes('cheap') && /26%/.test(D.reasons[0]), '26% 쌈 → 검토: ' + D.reasons[0]);
// 유효가 아닌(빨강) 판매자만 더 비쌈 → 25% 규칙에 안 걸림
D = SH.autoShipDecide({ ...base, order: ord([it('1', 5000)]), enrich: { 1: E([row('red', '상', 10000), row('green', '상', 5200)]) } }); ok(D.state === 'pass', '빨강 판매자 값은 유효 최저가가 아님 → 통과');
// 3) ① 권수·묶음 평균 (정범님 10/29 — 20권까지 권수로 검토 안 함 · 넘으면 20권 묶음(올림)당 평균 6만 원 미만이면 검토)
const G = (p) => E([row('green', '상', p)]); const mk = (n, price) => ({ order: ord([it('1', price, n)]), enrich: { 1: G(price + 500) } });
D = SH.autoShipDecide({ ...base, ...mk(5, 9000) }); ok(D.state === 'pass' && D.qty === 5 && D.bundle === null, '5권 주문 → 이제 통과(예전 5권 검토 없앰) · 묶음 정보 없음');
D = SH.autoShipDecide({ ...base, ...mk(20, 9000) }); ok(D.state === 'pass' && D.bundle === null, '20권 → 권수로 검토 안 함(20권까지)');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 3000, 20), it('2', 60000, 1)]), enrich: { 1: G(3500), 2: G(65000) } }); ok(D.state === 'pass' && D.bundle && D.bundle.n === 2 && D.bundle.avg === 60000 && D.bundle.ok, '21권 12만 → 2묶음 평균 6만 = 기준 → 통과(정확히 6만도 통과): ' + D.bundle.why);
D = SH.autoShipDecide({ ...base, ...mk(21, 2762) }); ok(D.state === 'review' && D.kinds.includes('qty') && D.bundle.n === 2 && !D.bundle.ok && /2\.9만|29,0/.test(D.reasons[0].replace('29,002','29,0')), '21권 5.8만 → 2묶음 2.9만 → 검토: ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, ...mk(38, 3158) }); ok(D.state === 'pass' && D.bundle.n === 2 && D.bundle.avg === 60002, '38권 12만 → 2묶음 6만 → 통과');
D = SH.autoShipDecide({ ...base, ...mk(30, 4000) }); ok(D.state === 'pass' && D.bundle.n === 2 && D.bundle.avg === 60000, '30권 12만 → 2묶음 6만 → 통과');
D = SH.autoShipDecide({ ...base, ...mk(42, 4048) }); ok(D.state === 'review' && D.bundle.n === 3 && D.bundle.avg === 56672, '42권 17만 → 3묶음 5.67만 → 검토');
D = SH.autoShipDecide({ ...base, ...mk(72, 3334) }); ok(D.state === 'pass' && D.bundle.n === 4 && D.bundle.avg === 60012, '72권 24만 → 4묶음 6만 → 통과');
D = SH.autoShipDecide({ ...base, cfg: { bundleRound: 'floor' }, ...mk(21, 2762) }); ok(D.state === 'review' && D.bundle.n === 1 && D.bundle.avg === 58002, '내림이면 21권 = 1묶음 5.8만 → 검토');
D = SH.autoShipDecide({ ...base, cfg: { bundleOn: false }, ...mk(21, 9000) }); ok(D.state === 'review' && D.kinds.includes('qty') && D.bundle === null, '묶음 기준 끄면 20권 넘는 주문은 무조건 검토: ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cfg: { qtyMax: 3 }, ...mk(4, 90000) }); ok(D.state === 'pass' && D.bundle && D.bundle.n === 1, '권수 상한 3이면 4권 → 묶음 1개 평균 36만 → 통과');
D = SH.autoShipDecide({ ...base, cfg: { minQty: 3 }, ...mk(5, 9000) }); ok(D.state === 'pass' && D.cfg.qtyMax === 20, '옛 설정 minQty만 있으면 무시(기본 20)');
D = SH.autoShipDecide({ ...base, cfg: { cheapPct: 40 }, order: ord([it('1', 7000)]), enrich: { 1: E([row('green', '상', 10000)]) } }); ok(D.state === 'pass', '설정 40% → 30% 싼 것 통과');
// 3b) ⑧ 금액 상한(선택 · 기본 0 = 안 씀)
D = SH.autoShipDecide({ ...base, order: ord([it('1', 150000)]), enrich: { 1: G(160000) } }); ok(D.state === 'pass', '15만 원 책 — 상한 0이면 통과');
D = SH.autoShipDecide({ ...base, cfg: { maxItemWon: 100000 }, order: ord([it('1', 150000)]), enrich: { 1: G(160000) } }); ok(D.state === 'review' && D.kinds.includes('big'), '한 상품 10만 상한 → 15만 원 책 검토: ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cfg: { maxTotalWon: 100000 }, order: ord([it('1', 30000, 4)]), enrich: { 1: G(32000) } }); ok(D.state === 'review' && D.kinds.includes('big'), '총액 10만 상한 → 12만 주문 검토: ' + D.reasons[0]);
// 4) 시장 없음: 기다림 → 시간이 지나면 검토
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: {} }); ok(D.state === 'wait' && D.waitLeftMs === 600000, '시장 아직 없음 → 기다림(10분)');
D = SH.autoShipDecide({ ...base, now: 1000 + 600001, order: ord([it('1', 9000)]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('nomkt'), '10분 지나도 없음 → 검토(시장 자료 없음): ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: { mktErr: '알라딘 상품번호를 못 찾음', mkt: null } } }); ok(D.state === 'review' && D.kinds.includes('nomkt'), '못 읽는다고 확정(mktErr) → 바로 검토');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: { ...E([row('green', '상', 9500)]), via: 'search', mkt: { rows: [row('green', '상', 9500)], isbnOk: null } } } }); ok(D.state === 'wait', '이름으로 찾은 시장은 쓰지 않음 → 기다림');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 1000, 21)]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('qty'), '다른 검토 이유(21권 2묶음 평균 1만)가 있으면 시장을 기다리지 않고 바로 검토');
// 5) 유효 판매자 없음
D = SH.autoShipDecide({ ...base, order: ord([it('1', 5000)]), enrich: { 1: E([row('yellow', '상', 10000), row('red', '상', 9000)]) } }); ok(D.state === 'pass' && D.items[0].flag === 'novalid', '유효 매물 없음 → 기본은 통과(기록에 남김)');
D = SH.autoShipDecide({ ...base, cfg: { noValid: true, aloneOn: false }, order: ord([it('1', 5000)]), enrich: { 1: E([]) } }); ok(D.state === 'review' && D.kinds.includes('novalid'), '설정 켜면 유효 매물 없음 → 검토(단독 매물 조건 끈 채)');
/* (정범님 11/05 밤) 저가·관리코드 상품은 퍼센트를 따지지 않음 — 알라딘 매입가를 모르면(매입가 후보 아님) 통과 · 매입가보다 쌀 때만 검토 */
D = SH.autoShipDecide({ ...base, order: ord([it('1', 1100)]), enrich: { 1: E([row('green', '상', 2000), row('green', '상', 2500)]) } }); ok(D.state === 'pass' && D.items[0].rule === 'bbNone' && !D.kinds.includes('cheap'), '저가 1,100원 · 유효 최저가 2,000원(45% 쌈) · 매입가 없음 → 퍼센트 안 따지고 통과 ' + JSON.stringify({ st: D.state, k: D.kinds, r: D.items[0].rule, w: D.items[0].why }));
D = SH.autoShipDecide({ ...base, cfg: { noValid: true, aloneOn: false }, order: ord([it('1', 1100)]), enrich: { 1: E([]) } }); ok(D.state === 'pass', '저가 상품은 유효 매물 없음 검토 설정이 켜져도 매입가 후보가 아니면 통과 ' + JSON.stringify({ st: D.state, k: D.kinds }));
D = SH.autoShipDecide({ ...base, cfg: { noValid: true }, order: ord([it('1', 3000)]), enrich: { 1: E([]) } }); ok(D.state === 'review' && D.kinds.includes('alone') && !D.kinds.includes('novalid'), '첫 페이지 비면 단독 매물(⑦)이 먼저 — kind alone');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 3000)]), enrich: { 1: E([row('ours', '상', 3000, { lid: '1' })]) } }); ok(D.state === 'review' && D.kinds.includes('alone'), '우리 줄만(단독 매물) → ⑦ 검토(기본 켬 · 10/28)');
D = SH.autoShipDecide({ ...base, cfg: { aloneOn: false }, order: ord([it('1', 3000)]), enrich: { 1: E([row('ours', '상', 3000, { lid: '1' })]) } }); ok(D.state === 'pass', '단독 매물 조건 끄면 우리 줄만 → 통과(유효 매물 없음은 기본 통과)');
// 6) 고객
const cr = SH.custRisk({ flags: { blacklist: { on: true, reason: '허위 반품' } } }); ok(cr.bl && !cr.seller, 'custRisk 블랙리스트(수동)'); ok(!SH.custRisk({ flags: { blacklist: { on: false } }, sheetFlags: { blacklist: {} } }).bl, '수동으로 끈 블랙리스트는 시트 표시보다 먼저');
ok(SH.custRisk({ sellerLinks: [{ name: 'X서점', strong: true }] }).seller && !SH.custRisk({ sellerLinks: [{ name: 'X', strong: false }] }).seller, 'custRisk 판매자 연관(강한 연결만)');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 9500)]) }, cust: { hits: [{ who: '수령인', name: '김받음', seller: true, sellers: ['X서점'], weak: true }] } }); ok(D.state === 'pass' && !D.reasons.length && /수령인 김받음: 🕵 허위매물 판매자/.test(D.notes[0] || ''), '(정범님 11/11) 수령인 쪽 허위매물 판매자만 → 검토 아님(블랙리스트와 다름 · 풀이 notes): ' + D.notes[0]);
D = SH.autoShipDecide({ ...base, cfg: { sellerReview: true }, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 9500)]) }, cust: { hits: [{ who: '수령인', name: '김받음', seller: true, sellers: ['X서점'], weak: true }] } }); ok(D.state === 'review' && D.kinds.includes('seller') && !D.kinds.includes('cust'), '⚙ 허위매물 판매자도 검토 켬 → 검토(kind seller): ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cfg: { custBlock: false }, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 9500)]) }, cust: { hits: [{ who: '주문인', name: 'A', bl: true }] } }); ok(D.state === 'pass', '고객 조건 끄면 통과');
// 7) 읽기 이상
D = SH.autoShipDecide({ ...base, order: ord([]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('read'), '상품 0개 → 검토');
D = SH.autoShipDecide({ ...base, order: ord([it('1', null)]), enrich: { 1: E([row('green', '상', 9500)]) } }); ok(D.state === 'review' && D.kinds.includes('read'), '판매가 못 읽음 → 검토');
console.log(bad ? `❌ tA1 실패 ${bad}` : '✓ tA1 통과');
