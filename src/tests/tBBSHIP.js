// tBBSHIP — 정범님 11/05 밤 '해당 코드 혹은 금액 이하면 퍼센트 따지지 않고 매입가 후보 안에 들지 않는 한 무조건 자동 결정'
//  🤖 자동 발송요청 저가·관리코드 규칙 = 웹앱 🏷 '매입 후보'와 같은 판정 하나(readnow-shipping-core bbNear — 순이익 − 알라딘 매입가 < 기준 차액)
//  ① 노드: 점검 S1-1(판매가 10,000/8,200 · 매입가 7,000) · 저가 1,100원 매입가 모름 → 통과 · 매입가보다 비싸도 매입 후보면 검토 · 기준 차액·배송비 정책 반영 · 판정 엔진 sellNet과 같은 순이익
//  ② 화면: 웹앱 bbNearJ와 자동 발송 판단이 같은 답 · 출고 카드 '매입가 ○원 ✓/⚠' 칩
// 실행: cd pw && RN_PORT=8792 node tBBSHIP.js
const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js'); const PRC = require('../readnow-pricing-core.js');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const row = (c, g, p, extra) => ({ c, g, p, s: 0, so: 0, ...(extra || {}) });
const E = (rows, bb) => ({ mkt: { at: '2026-11-05T12:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true, ...(bb ? { buyback: bb } : {}) }, via: 'ours' });
const ord = (items) => ({ orderNo: 'O1', buyer: '손님A', items });
const it = (lid, price, sku, g) => ({ listingId: lid, title: '책' + lid, price, qty: 1, grade: g || '상', sku: sku || 'BLKCMN_ms' });
const base = { evalSale: ML.evalSale, now: 1000, firstAt: 1000 };
const mk = (P, buy, sku, bbx) => SH.autoShipDecide({ ...base, bb: bbx, order: ord([it('1', P, sku)]), enrich: { 1: E([row('green', '상', P + 500), row('green', '상', P + 900)], buy ? { 상: buy } : null) } });
// ① 노드
let D = mk(8200, 7000, 'YLWCMN_ms'); let P0 = D.items[0];
ok(D.state === 'review' && D.kinds.includes('bbLow') && P0.bbNet === 4486 && P0.bbGain === -2514 && /순이익 4,486원 − 알라딘 매입가 7,000원 = 차 −2,514원 < 기준 500원/.test(D.reasons[0]), '점검 S1-1 · YLW 8,200원 · 매입가 7,000원 → 매입 후보라 검토(예전: 8,200 ≥ 7,000이라 통과) · 근거에 셈 식: ' + D.reasons[0], D);
D = mk(10000, 7000, 'YLWCMN_ms'); ok(D.state === 'review' && D.items[0].bbGain === -894, 'S1-1 · YLW 10,000원 · 매입가 7,000원 → 순이익 6,106원이라 매입 후보 → 검토', D.items[0]);
D = mk(1100, null); ok(D.state === 'pass' && D.items[0].rule === 'bbNone', '저가 1,100원 · 매입가 모름 → 통과(그대로)', D.items[0]);
D = mk(3500, 3000); ok(D.state === 'review' && D.kinds.includes('bbLow') && D.items[0].bbGain === 3500 - 350 - 2894 - 3000, '저가 3,500원 · 매입가 3,000원(판매가가 더 비쌈) → 순이익 256원 − 3,000원 = 매입 후보 → 검토', D.items[0]);
D = mk(9000, 3000, 'YLWCMN_ms'); ok(D.state === 'pass' && D.items[0].bbGain === 2206 && /매입 후보 아님/.test(D.items[0].why), 'YLW 9,000원 · 매입가 3,000원 → 차 2,206원 ≥ 500원 → 통과: ' + D.items[0].why, D.items[0]);
D = mk(9000, 3000, 'YLWCMN_ms', { margin: 3000 }); ok(D.state === 'review' && /기준 3,000원/.test(D.reasons[0]), '기준 차액 3,000원(app_settings/main.bbMargin)이면 같은 책도 매입 후보 → 검토', D.reasons);
const pol = { fee: 2500, freeOver: 20000 };
D = mk(8200, 7000, 'YLWCMN_ms', { policy: pol }); ok(D.state === 'review' && D.items[0].bbNet === 6986 && D.items[0].bbGain === -14, '배송비 정책(손님 배송비 2,500원)도 셈 — 8,200원 순이익 6,986원 · 차 −14원 → 검토', D.items[0]);
D = mk(10000, 7000, 'YLWCMN_ms', { policy: pol }); ok(D.state === 'pass' && D.items[0].bbGain === 1606, '배송비 정책 넣으면 10,000원은 차 1,606원 → 통과', D.items[0]);
D = mk(8200, 7000); ok(D.state === 'pass' && D.items[0].rule === 'pct', '저가·관리코드가 아닌 책(8,200원 · BLK)은 매입 판정 안 씀 — 25% 규칙(그대로)', D.items[0]);
const same = [1500, 3333, 4000, 8200, 10000, 19999, 20000, 31234].every((P) => [{}, { fee: 2500, freeOver: 20000 }, { fee: 3000, freeOver: null }].every((po) => { const x = SH.bbNetParts(P, { policy: po, D: PRC.DEFAULTS }); return x.net === Math.round(PRC.sellNet(P, { policy: { fee: po.fee ?? null, freeOver: po.freeOver ?? null } }, null) + Math.max(0, x.cust - x.cr)); })); /* (정범님 11/12 밤) 매입 후보 순이익 = 하한 셈(sellNet) + 택배비 마진(손님 배송비 > 택배비일 때만 다름) */
ok(same && SH.bbNetParts(5000, {}).net === SH.bbNetParts(5000, { D: PRC.DEFAULTS }).net, '공용 순이익(bbNetParts) = 판정 엔진 sellNet + 택배비 마진(손님 배송비 3,000원 > 택배비 2,500원이면 500원 더) · D 없어도 같은 기본값');
ok(SH.bbMarginOf(undefined) === 500 && SH.bbMarginOf('') === 500 && SH.bbMarginOf(-1) === 500 && SH.bbMarginOf(1200) === 1200, '기준 차액 기본 500원 · 이상한 값이면 500원');
// ② 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const SHw = window.ReadnowShipping; const out = {}; const ev = window.ReadnowML && window.ReadnowML.evalSale;
    const dec = (P, buy) => SHw.autoShipDecide({ evalSale: ev, now: 1000, firstAt: 1000, bb: bbCtx(), order: { orderNo: 'O1', items: [{ listingId: '1', title: 't', price: P, qty: 1, grade: '상', sku: 'YLWCMN_ms' }] }, enrich: { 1: { mkt: { at: '2026-11-05T12:00:00Z', rows: [{ c: 'green', g: '상', p: P + 500, s: 0, so: 0 }, { c: 'green', g: '상', p: P + 900, s: 0, so: 0 }], isbnOk: true, buyback: { 상: buy } }, via: 'ours' } } });
    const cases = [[10000, 7000], [8200, 7000], [3500, 3000], [9000, 3000], [3394, 2000], [3395, 2000], [6000, 3800]];
    const cmp = (tag) => cases.map(([P, buy]) => { const J = bbNearJ(P, buy, '상'); const D = dec(P, buy); return { tag, P, buy, web: J.in, auto: D.kinds.includes('bbLow'), gainW: J.gain, gainA: D.items[0].bbGain }; });
    S.policy = null; S.app = { ...S.app, bbMargin: 500 }; out.a = cmp('정책 없음 · 500');
    S.policy = { current: { fee: 2500, freeOver: 20000 } }; out.b = cmp('배송비 2,500 · 500');
    S.app = { ...S.app, bbMargin: 1500 }; out.c = cmp('배송비 2,500 · 1,500');
    S.policy = null; S.app = { ...S.app, bbMargin: 500 };
    S.shipAutoCfg = { on: true }; out.chipBad = shipLowBB({ price: 3500, grade: '상', sku: 'YLWCMN_ms' }, { buyback: { 상: 3000 } }); out.chipOk = shipLowBB({ price: 9000, grade: '상', sku: 'YLWCMN_ms' }, { buyback: { 상: 3000 } }); out.chipNa = shipLowBB({ price: 1100, grade: '상', sku: 'BLK' }, { buyback: {} });
    out.tip = sauItemsTip(dec(8200, 7000)); out.f = bbNearJ(8200, 7000, '상'); return out; });
  const all = [...r.a, ...r.b, ...r.c]; const diff = all.filter((x) => x.web !== x.auto || x.gainW !== x.gainA);
  ok(!diff.length && all.some((x) => x.web) && all.some((x) => !x.web), `웹앱 '매입 후보'(bbNearJ)와 자동 발송 판단이 ${all.length}가지 모두 같은 답(정책·기준 차액 바꿔도)`, diff.length ? diff : all);
  ok(r.a[0].web && r.a[1].web && r.a[0].gainW === -894 && r.a[1].gainW === -2514, '점검 S1-1 — 10,000원·8,200원 · 매입가 7,000원: 웹앱·자동 발송 모두 매입 후보', r.a.slice(0, 2));
  ok(/sev-bb bad/.test(r.chipBad) && /3,000<\/b>원 ⚠/.test(r.chipBad) && /매입 후보: 순이익 256원 − 알라딘 매입가 3,000원 = 차 −2,744원 &lt; 기준 500원/.test(r.chipBad), "출고 카드 칩 — 매입가보다 비싸도 매입 후보면 '매입가 3,000원 ⚠' · 풀이에 셈 식", r.chipBad);
  ok(/sev-bb ok/.test(r.chipOk) && /✓/.test(r.chipOk) && /매입 후보 아님/.test(r.chipOk), "매입 후보 아니면 '매입가 ○원 ✓'", r.chipOk);
  ok(/sev-bb na/.test(r.chipNa) && /매입가 모름/.test(r.chipNa) && /퍼센트 따지지 않고 통과/.test(r.chipNa), "매입가 모름 칩 — 퍼센트 따지지 않고 통과(예전 글 '25% 기준으로 봄' 바로잡음)", r.chipNa);
  ok(/알라딘 매입 후보\(순이익 4,486원 − 알라딘 매입가 7,000원 = 차 −2,514원 < 기준 500원\) → 검토/.test(r.tip), '판단 기록 풀이에도 셈 식', r.tip);
  ok(r.f && r.f.calc && /순이익 4,486원/.test(r.f.calc) && /남는 돈 4,486원/.test(r.f.formula), '웹앱 판정 결과에 공용 셈 식(calc)도 함께 · 예전 셈 글(formula) 그대로', r.f);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
