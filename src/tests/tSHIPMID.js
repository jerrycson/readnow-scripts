// tSHIPMID — 정범님 11/09 '출고 자동 발송요청: 알라딘 매입 조건에서 상품 상태가 중이면 그 조건에 해당하지 않으니 빼라'
//  🤖 자동 발송요청 저가·관리코드 규칙(autoShipDecide ⑥)의 '알라딘 매입 후보' 판정에서 우리 상품 상태(등급 칸 grade)가 '중'이면 뺌 → 통과(rule 'bbGrade' · 25% 기준 안 씀)
//  판정 한 곳 = 판정 엔진 bbGradeOut(알라딘이 사는 등급 DEFAULTS.buybackGrades = 최상·상) · 출고 공용 bbGradeOut(판정 엔진이 없을 때 같은 셈) · 웹앱 출고 카드 칩(shipLowBB)·판단 풀이(sauItemsTip)
//  ① 노드: 판정 엔진 붙음/떼어 냄 두 길 모두 같은 답 ② 화면: 출고 카드 칩·판단 풀이·설정 설명
// 실행: cd pw && RN_PORT=8788 node tSHIPMID.js
const path = require('path'); const SHP = path.resolve(__dirname, '../readnow-shipping-core.js');
const ML = require('../readnow-ml-core.js'); const PRC = require('../readnow-pricing-core.js');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 });
const E = (rows, bb) => ({ mkt: { at: '2026-11-09T12:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true, ...(bb ? { buyback: bb } : {}) }, via: 'ours' });
const ord = (items) => ({ orderNo: 'O1', buyer: '손님A', items });
const it = (lid, price, sku, g) => ({ listingId: lid, title: '책' + lid, price, qty: 1, grade: g, sku: sku || 'YLWCMN_ms' });
const base = { evalSale: ML.evalSale, now: 1000, firstAt: 1000 };
const mk = (SH, P, buy, g, sku, rows) => SH.autoShipDecide({ ...base, order: ord([it('1', P, sku, g)]), enrich: { 1: E(rows || [row('green', g || '상', P + 500), row('green', g || '상', P + 900)], buy) } });
// ① 판정 엔진 bbGradeOut
ok(PRC.bbGradeOut('중') && PRC.bbGradeOut('중').g === '중' && /알라딘은 '중' 상태를 매입하지 않아/.test(PRC.bbGradeOut('중').why), "판정 엔진: '중' → 알라딘 매입 조건 밖(근거 DEFAULTS.buybackGrades)", PRC.bbGradeOut('중'));
ok(PRC.bbGradeOut('최상') === null && PRC.bbGradeOut('상') === null && PRC.bbGradeOut('') === null && PRC.bbGradeOut(null) === null && PRC.bbGradeOut('새책') === null, "판정 엔진: 최상·상·모름·모르는 글자 → 빼지 않음(예전 그대로)");
ok(JSON.stringify(PRC.DEFAULTS.buybackGrades) === JSON.stringify(['최상', '상']), '알라딘이 사는 등급 = 최상·상(판정 엔진 DEFAULTS.buybackGrades)');
// 두 길: 판정 엔진이 붙은 출고 공용(웹앱·클라우드·PC) · 떼어 낸 출고 공용(판정 엔진 없음 — 같은 셈)
const withPR = (() => { delete require.cache[SHP]; globalThis.ReadnowPricing = PRC; const m = require(SHP); return m; })();
const noPR = (() => { delete require.cache[SHP]; delete globalThis.ReadnowPricing; const m = require(SHP); return m; })();
for (const [tag, SH] of [['판정 엔진 붙음', withPR], ['판정 엔진 없음', noPR]]) {
  globalThis.ReadnowPricing = tag === '판정 엔진 붙음' ? PRC : undefined;
  let D = mk(SH, 8200, { 상: 7000, 중: 7000 }, '상'); ok(D.state === 'review' && D.kinds.includes('bbLow'), `${tag}: 상 · YLW 8,200원 · 매입가 7,000원 → 매입 후보라 검토(그대로)`, D.items[0]);
  D = mk(SH, 8200, { 상: 7000, 중: 7000 }, '중'); let P = D.items[0];
  ok(D.state === 'pass' && !D.kinds.includes('bbLow') && P.rule === 'bbGrade' && P.bbGradeOut === '중' && /상품 상태 '중'/.test(P.why) && /25% 기준 안 씀/.test(P.why), `${tag}: 중 · 같은 값 → 알라딘 매입 조건에서 빠져 통과: ${P.why}`, D);
  D = mk(SH, 3000, { 중: 6000 }, '중', 'BLKCMN_ms'); ok(D.state === 'pass' && D.items[0].rule === 'bbGrade', `${tag}: 중 · 4,000원 이하(관리코드 아님) · 매입가가 판매가의 두 배여도 → 통과`, D.items[0]);
  D = mk(SH, 3000, null, '중'); ok(D.state === 'pass' && D.items[0].rule === 'bbGrade', `${tag}: 중 · 매입가 모름 → 통과(뺌 표시)`, D.items[0]);
  D = mk(SH, 8200, { 상: 7000 }, '중', 'BLKCMN_ms'); ok(D.items[0].rule === 'pct', `${tag}: 저가·관리코드가 아닌 '중' 책은 예전처럼 25% 규칙(이번 고침과 상관없음)`, D.items[0]);
  D = mk(SH, 3000, { 중: 6000 }, '중', 'YLWCMN_ms', [row('ours', '중', 3000)]); ok(D.state === 'review' && D.kinds.includes('alone') && !D.kinds.includes('bbLow'), `${tag}: 중이어도 단독 매물 검토(⑦)는 그대로`, D);
  D = SH.autoShipDecide({ ...base, order: ord([it('1', 3000, 'YLW1', '중'), it('2', 3000, 'YLW2', '상')]), enrich: { 1: E([row('green', '중', 3500), row('green', '중', 3900)], { 중: 6000, 상: 6000 }), 2: E([row('green', '상', 3500), row('green', '상', 3900)], { 중: 6000, 상: 6000 }) } });
  ok(D.state === 'review' && D.kinds.includes('bbLow') && D.items[0].rule === 'bbGrade' && D.items[1].rule === 'bb' && D.reasons.length === 1 && /책2/.test(D.reasons[0]), `${tag}: 한 주문에 중·상이 섞이면 상 책만 매입 후보로 검토`, D);
}
ok(withPR.bbGradeOut('중').why === noPR.bbGradeOut('중').why && noPR.bbGradeOut('상') === null && noPR.bbGradeOut('하') && withPR.bbGradeOut('하'), '두 길 같은 답(중·하 뺌 · 상 그대로)');
globalThis.ReadnowPricing = PRC;
// ② 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const SHw = window.ReadnowShipping; const out = {}; const ev = window.ReadnowML && window.ReadnowML.evalSale;
    out.has = !!(SHw && SHw.bbGradeOut && window.ReadnowPricing && window.ReadnowPricing.bbGradeOut);
    const dec = (g) => SHw.autoShipDecide({ evalSale: ev, now: 1000, firstAt: 1000, bb: bbCtx(), order: { orderNo: 'O1', items: [{ listingId: '1', title: 't', price: 8200, qty: 1, grade: g, sku: 'YLWCMN_ms' }] }, enrich: { 1: { mkt: { at: '2026-11-09T12:00:00Z', rows: [{ c: 'green', g, p: 8700, s: 0, so: 0 }, { c: 'green', g, p: 9100, s: 0, so: 0 }], isbnOk: true, buyback: { 상: 7000, 중: 7000 } }, via: 'ours' } } });
    S.shipAutoCfg = { on: true }; out.dMid = dec('중'); out.dHi = dec('상');
    out.chipMid = shipLowBB({ price: 8200, grade: '중', sku: 'YLWCMN_ms' }, { buyback: { 상: 7000, 중: 7000 } }); out.chipHi = shipLowBB({ price: 8200, grade: '상', sku: 'YLWCMN_ms' }, { buyback: { 상: 7000, 중: 7000 } });
    out.tip = sauItemsTip(out.dMid); out.dMid = { state: out.dMid.state, kinds: out.dMid.kinds, rule: out.dMid.items[0].rule }; out.dHi = { state: out.dHi.state, kinds: out.dHi.kinds };
    return out; });
  ok(r.has, '웹앱이 판정 엔진·출고 공용 bbGradeOut을 불러옴');
  ok(r.dMid.state === 'pass' && r.dMid.rule === 'bbGrade' && r.dHi.state === 'review' && r.dHi.kinds.includes('bbLow'), '웹앱 안 자동 판단도 같은 답(중 통과 · 상 검토)', r);
  ok(/sev-bb na/.test(r.chipMid) && /매입 조건 밖\(중\)/.test(r.chipMid) && /퍼센트 따지지 않고 통과/.test(r.chipMid) && /sev-bb bad/.test(r.chipHi), "출고 카드 칩 — 중이면 '매입 조건 밖(중)' · 상이면 그대로 ⚠", r);
  ok(/상품 상태 '중'/.test(r.tip) && /통과/.test(r.tip), '판단 풀이에도 까닭: ' + r.tip, r.tip);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
