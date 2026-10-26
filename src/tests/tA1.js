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
// 3) 상품 5개 이상
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000, 3), it('2', 8000, 2)]), enrich: { 1: E([row('green', '상', 9500)]), 2: E([row('green', '상', 8500)]) } });
ok(D.state === 'review' && D.kinds.includes('qty') && D.qty === 5 && D.total === 43000 && D.top.title === '책1', '5권 주문 → 검토 · 총 43,000 · 대표 = 가장 비싼 책1');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000, 4)]), enrich: { 1: E([row('green', '상', 9500)]) } }); ok(D.state === 'pass', '4권 → 통과');
D = SH.autoShipDecide({ ...base, cfg: { minQty: 3 }, order: ord([it('1', 9000, 3)]), enrich: { 1: E([row('green', '상', 9500)]) } }); ok(D.state === 'review', '설정 3권 → 3권 주문 검토');
D = SH.autoShipDecide({ ...base, cfg: { cheapPct: 40 }, order: ord([it('1', 7000)]), enrich: { 1: E([row('green', '상', 10000)]) } }); ok(D.state === 'pass', '설정 40% → 30% 싼 것 통과');
// 4) 시장 없음: 기다림 → 시간이 지나면 검토
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: {} }); ok(D.state === 'wait' && D.waitLeftMs === 600000, '시장 아직 없음 → 기다림(10분)');
D = SH.autoShipDecide({ ...base, now: 1000 + 600001, order: ord([it('1', 9000)]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('nomkt'), '10분 지나도 없음 → 검토(시장 자료 없음): ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: { mktErr: '알라딘 상품번호를 못 찾음', mkt: null } } }); ok(D.state === 'review' && D.kinds.includes('nomkt'), '못 읽는다고 확정(mktErr) → 바로 검토');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: { ...E([row('green', '상', 9500)]), via: 'search', mkt: { rows: [row('green', '상', 9500)], isbnOk: null } } } }); ok(D.state === 'wait', '이름으로 찾은 시장은 쓰지 않음 → 기다림');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000, 5)]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('qty'), '다른 검토 이유(5권)가 있으면 시장을 기다리지 않고 바로 검토');
// 5) 유효 판매자 없음
D = SH.autoShipDecide({ ...base, order: ord([it('1', 3000)]), enrich: { 1: E([row('yellow', '상', 10000), row('red', '상', 9000)]) } }); ok(D.state === 'pass' && D.items[0].flag === 'novalid', '유효 매물 없음 → 기본은 통과(기록에 남김)');
D = SH.autoShipDecide({ ...base, cfg: { noValid: true }, order: ord([it('1', 3000)]), enrich: { 1: E([]) } }); ok(D.state === 'review' && D.kinds.includes('novalid'), '설정 켜면 유효 매물 없음 → 검토');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 3000)]), enrich: { 1: E([row('ours', '상', 3000, { lid: '1' })]) } }); ok(D.state === 'pass', '우리 줄만(단독 매물) → 통과');
// 6) 고객
const cr = SH.custRisk({ flags: { blacklist: { on: true, reason: '허위 반품' } } }); ok(cr.bl && !cr.seller, 'custRisk 블랙리스트(수동)'); ok(!SH.custRisk({ flags: { blacklist: { on: false } }, sheetFlags: { blacklist: {} } }).bl, '수동으로 끈 블랙리스트는 시트 표시보다 먼저');
ok(SH.custRisk({ sellerLinks: [{ name: 'X서점', strong: true }] }).seller && !SH.custRisk({ sellerLinks: [{ name: 'X', strong: false }] }).seller, 'custRisk 판매자 연관(강한 연결만)');
D = SH.autoShipDecide({ ...base, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 9500)]) }, cust: { hits: [{ who: '수령인', name: '김받음', seller: true, sellers: ['X서점'], weak: true }] } }); ok(D.state === 'review' && /수령인 김받음: 🔗 판매자 연관/.test(D.reasons[0]), '수령인 쪽 판매자 연관 → 검토: ' + D.reasons[0]);
D = SH.autoShipDecide({ ...base, cfg: { custBlock: false }, order: ord([it('1', 9000)]), enrich: { 1: E([row('green', '상', 9500)]) }, cust: { hits: [{ who: '주문인', name: 'A', bl: true }] } }); ok(D.state === 'pass', '고객 조건 끄면 통과');
// 7) 읽기 이상
D = SH.autoShipDecide({ ...base, order: ord([]), enrich: {} }); ok(D.state === 'review' && D.kinds.includes('read'), '상품 0개 → 검토');
D = SH.autoShipDecide({ ...base, order: ord([it('1', null)]), enrich: { 1: E([row('green', '상', 9500)]) } }); ok(D.state === 'review' && D.kinds.includes('read'), '판매가 못 읽음 → 검토');
console.log(bad ? `❌ tA1 실패 ${bad}` : '✓ tA1 통과');
