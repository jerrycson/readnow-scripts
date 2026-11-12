// tSHIPCALC1112 — 정범님 11/12 밤 '출고 자동판정'
//  가) 우리 순이익 = 판매가 − 수수료 − 포장비 ± 택배비 몫 — 택배비는 무조건 빼는 것이 아님: 손님이 낸 배송비가 평균 택배비보다 크면 그 마진을 더하고, 우리 부담(무료배송)이면 평균 택배비를 뺌 · 그 값을 알라딘 매입가와 견줌
//  나) '중' 상태는 알라딘이 매입하지 않음 → 매입 후보 판정에서 뺌(출고 자동 판단·웹앱 모든 곳)
//  다) 「초보 골프 교실」(상 · 판매가 1,600원 · 알라딘 매입가 1,600원 · 배송비 정책 손님 2,800원 / 40,000원 이상 무료) 새 셈
//  라) 실무 경고 짧게: 출고 카드 🔎 관리자 검토 = 앞은 책마다 칩 하나(아이콘·핵심 숫자·이유 낱말) · 전체 설명은 「자세히」 접기(다시 그려도 펼친 채)
// 실행: cd pw && RN_PORT=8871 node tSHIPCALC1112.js
const PRC = require('../readnow-pricing-core.js'); const ML = require('../readnow-ml-core.js');
const SHF = require.resolve('../readnow-shipping-core.js'); const SH = require(SHF); /* 노드: 출고 공용 혼자(판정 엔진 없이) */
const vm = require('vm'); const fs = require('fs'); const SH2 = (() => { const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(SHF, 'utf8'), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: { ReadnowPricing: PRC } }); return m.exports; })();
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const POL = { fee: 2800, freeOver: 40000 }; /* 진단 11/12 밤 app_settings/freeship_stats.policyNow — 지금 배송비 정책 */
// ① 가) 순이익 셈
for (const [nm, S0] of [['판정 엔진', PRC], ['출고 공용(혼자)', SH], ['출고 공용(엔진 곁)', SH2]]) {
  const a = S0.bbNetParts(1600, { policy: POL }); ok(a.net === 1346 && a.ship === 300 && a.pkPer === 394 && a.fee === 160, `${nm}: 1,600원 · 손님 배송비 2,800원 → 1,600 − 160 − 포장 394 + 택배비 마진 300 = 1,346원(예전 1,046원 — 마진을 버렸음)`, a);
  const b = S0.bbNetParts(1600, { policy: { fee: 0 } }); ok(b.net === -1454 && b.ship === -2500, `${nm}: 무료배송(손님 0원) → 1,600 − 160 − 394 − 우리 부담 2,500 = −1,454원`, b);
  const c = S0.bbNetParts(41000, { policy: POL }); ok(c.cust === 0 && c.ship === -2500 && c.net === 41000 - 4100 - 394 - 2500, `${nm}: 무료배송 기준(40,000원) 넘으면 손님 0원 → 우리 부담 2,500원 뺌`, c);
  const d = S0.bbNetParts(1600, { policy: POL, D: { ...PRC.DEFAULTS, booksPerOrder: 2 } }); ok(d.ship === 150 && d.pkPer === 197 && d.net === Math.round(1600 * 0.9 - (394 - 300) / 2), `${nm}: 주문당 2권이면 택배비 마진·포장비를 권수로 나눔(+150 · 포장 197)`, d);
  const e = S0.bbNetParts(1600, { policy: { fee: 2500 } }); ok(e.ship === 0 && e.net === 1046, `${nm}: 손님 배송비 = 평균 택배비(2,500원)면 택배비 몫 0 — 예전과 같은 값`, e); }
// ① 다) 초보 골프 교실 — 매입가 1,600원
const G1 = PRC.bbNear(1600, 1600, { policy: POL }); ok(G1.in && G1.net === 1346 && G1.gain === -254 && /순이익 1,346원 − 알라딘 매입가 1,600원 = 차 −254원 < 기준 500원/.test(G1.calc), '초보 골프 교실(손님 배송비 2,800원): 순이익 1,346 − 매입가 1,600 = −254 < 500 → 여전히 매입 후보(알라딘에 파는 쪽이 254원 더 남음)', { calc: G1.calc });
const G0 = PRC.bbNear(1600, 1600, { policy: { fee: 0 } }); ok(G0.in && G0.net === -1454 && G0.gain === -3054, '초보 골프 교실(무료배송이었다면): 순이익 −1,454 − 1,600 = −3,054 → 매입 후보', { calc: G0.calc });
const GC = PRC.bbNear(5000, 3000, { policy: POL, cost: 1000 }); ok(GC.cost === 1000 && GC.profit === GC.net - 1000 && GC.bbProfit === 2000 && GC.gain === GC.net - 3000, '우리 매입원가(있으면)를 알면 직접 팔 때·알라딘에 팔 때 남는 돈 둘 다(원가는 두 쪽에 같이 들어가 차는 그대로)', GC);
// ① 다) 자동 판단(클라우드·PC가 같이 씀) — 초보 골프 교실
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 }); const E = (rows, bb) => ({ mkt: { at: '2026-11-12T12:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true, ...(bb ? { buyback: bb } : {}) }, via: 'ours' });
const cfg = { lowSku: 'GRY', lowPrice: 3000 }; const dec = (S0, g, P, buy, pol) => S0.autoShipDecide({ evalSale: ML.evalSale, now: 1000, firstAt: 1000, cfg, bb: { policy: pol }, order: { orderNo: 'O1', buyer: '손님A', items: [{ listingId: '1', title: '초보 골프 교실', price: P, qty: 1, grade: g, sku: 'BLKCMN_ms' }] }, enrich: { 1: E([row('green', '상', 2000), row('green', '상', 2400)], { 상: buy, 최상: buy + 200 }) } });
for (const [nm, S0] of [['혼자', SH], ['엔진 곁', SH2]]) { let D = dec(S0, '상', 1600, 1600, POL); const P0 = D.items[0];
  ok(D.state === 'review' && D.kinds.includes('bbLow') && P0.bbNet === 1346 && P0.bbGain === -254 && /순이익 1,346원 − 알라딘 매입가 1,600원 = 차 −254원 < 기준 500원/.test(D.reasons[0]), `자동 판단(${nm}): 초보 골프 교실 상 → 검토 · 근거 '${D.reasons[0]}'`, D.items[0]);
  D = dec(S0, '중', 1600, 1600, POL); ok(D.state === 'pass' && D.items[0].rule === 'bbGrade', `자동 판단(${nm}): 같은 책이 '중'이면 알라딘 매입 조건 밖 → 매입 후보 판정 안 함 · 통과`, D.items[0]);
  D = dec(S0, '상', 2900, 1600, POL); ok(D.state === 'pass' && D.items[0].bbGain === 2900 - 290 - 394 + 300 - 1600, `자동 판단(${nm}): 2,900원이면 순이익 2,516 − 1,600 = 916 ≥ 500 → 통과(예전 셈이면 616)`, D.items[0]); }

// ② 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const w = await p.evaluate(() => { S.policy = { current: { fee: 2800, freeOver: 40000 } }; const J = bbNearJ(1600, 1600, '상'); const Z = bbNearJ(2200, 2000, '중'); const Za = bbNearJ(2200, 2000, '상', null, null, { v: 2000, g: '상', alt: true, warn: '', bad: [] }, '중');
    S.policy = { current: { fee: 0 } }; const F = bbNearJ(1600, 1600, '상'); return { J: [J.in, J.net, J.gain, J.formula], Z: [Z.in, Z.gradeOut, Z.tag], Za: [Za.in, Za.gradeOut], F: [F.net, F.formula] }; });
  ok(w.J[0] && w.J[1] === 1346 && w.J[2] === -254 && /판매가 1,600원 − 수수료 160원\(10%\) − 포장 394원 \+ 택배비 마진 300원\(손님 배송비 2,800원 − 평균 택배비 2,500원\) = 남는 돈 1,346원/.test(w.J[3]), '웹앱 셈 식: + 택배비 마진 300원(손님 배송비 2,800 − 평균 택배비 2,500) = 남는 돈 1,346원', w.J);
  ok(w.F[0] === -1454 && /− 택배비 우리 부담 2,500원\(평균 택배비 2,500원 − 손님 배송비 0원\)/.test(w.F[1]), '웹앱 셈 식(무료배송): − 택배비 우리 부담 2,500원', w.F);
  ok(!w.Z[0] && w.Z[1] === '중' && /매입 조건 밖\(중\)/.test(w.Z[2]) && !w.Za[0] && w.Za[1] === '중', "웹앱 판정: 우리 상태 '중' → 매입 후보 아님(다른 등급 매입가로 견줄 때도)", w);
  // 라) 출고 카드 짧은 경고
  const v = await p.evaluate(() => { S.shipAutoCfg = { on: true }; S._saW = 1; S.shipAuto = new Map();
    const rec = { state: 'review', total: 49100, qty: 8, decidedAt: new Date().toISOString(), by: 'cloud', kinds: ['bbLow', 'cheap', 'alone', 'nomkt'], top: { title: '십자군 이야기 세트 - 전3권', price: 11000, qty: 1 },
      reasons: ['「초보 골프 교실」 1,600원 — 알라딘 매입 후보: 순이익 1,346원 − 알라딘 매입가 1,600원 = 차 −254원 < 기준 500원 (알라딘 매입가 등급 상 · 3,000원 이하 상품: 매입 후보가 아니면 통과 · 상태 \'상\' 줄)', '「십자군 이야기 세트 - 전3권」 11,000원 — 더 높은 등급(상) 유효 최저가 15,000원보다 27% 쌈 (기준 25% 넘게)', '「[세트] 중국신화전집 1~2 - 전2권」 5,500원 — 첫 페이지에 우리 매물뿐(단독 매물)', '「소리 잃은 강」 시장 자료 없음 — 아직 못 읽음'],
      items: [{ title: '초보 골프 교실', price: 1600, grade: '상', mkt: 'ok', rule: 'bb', flag: 'bbLow', bbGain: -254, bbK: 500, bbCalc: '순이익 1,346원 − 알라딘 매입가 1,600원 = 차 −254원 < 기준 500원', why: '알라딘 매입 후보' },
        { title: '십자군 이야기 세트 - 전3권', price: 11000, grade: '상', mkt: 'ok', rule: 'pct', flag: 'cheap', ratio: -0.27, tier: 'valid', ref: 15000, refHow: '더 높은 등급(상) 유효 최저가', verdict: '싸게' },
        { title: '[세트] 중국신화전집 1~2 - 전2권', price: 5500, grade: '중', mkt: 'ok', rule: 'pct', flag: 'alone', alone: true },
        { title: '소리 잃은 강', price: 3000, grade: '상', mkt: 'none', why: '시장을 아직 못 읽음' }, { title: '그냥 책', price: 4000, grade: '상', mkt: 'ok', rule: 'pct' }] };
    S.shipAuto.set('O9', rec); const box = document.createElement('div'); box.innerHTML = shipAutoLine('O9', true, null); document.body.appendChild(box);
    const chips = [...box.querySelectorAll('.wsh-c')].map((x) => x.textContent); const d = box.querySelector('details.wsh-more'); const head = box.querySelector('.wsh-h'); const front = box.querySelector('.wsh').cloneNode(true); front.querySelector('details').remove();
    d.open = true; d.dispatchEvent(new Event('toggle')); const box2 = document.createElement('div'); box2.innerHTML = shipAutoLine('O9', true, null); const reopen = box2.querySelector('details.wsh-more').open;
    const pass = shipAutoLine('O9x', true, null); S.shipAuto.set('O8', { state: 'sent', total: 1000, items: [], reasons: [] }); const sent = shipAutoLine('O8', true, null);
    return { chips, head: head && head.textContent, full: d.querySelector('.wsh-full').textContent, frontLen: front.textContent.length, reopen, sentShort: /wsh/.test(sent), sum: d.querySelector('summary').textContent }; });
  ok(v.head === '🔎 검토' && v.chips.length === 4, `앞 줄 = 🔎 검토 + 책마다 칩 하나(이유 있는 4권 · 이유 없는 책은 칩 없음): ${v.chips.join(' | ')}`, v);
  ok(v.chips[0] === '🏷 「초보 골프 교실」 매입가>순이익 −254 · 상', `매입 후보 칩: '${v.chips[0]}'`, v.chips);
  ok(v.chips[1] === '💸 「십자군 이야기…」 최저가보다 27%↓ · 상' && v.chips[2] === '👤 「중국신화전집 1…」 단독 매물 · 중' && v.chips[3] === '⏳ 「소리 잃은 강」 시장 못 읽음', '싸게·단독·시장 없음 칩(제목은 앞 [세트] 떼고 8자)', v.chips);
  ok(v.sum === '자세히' && /관리자 검토 필요/.test(v.full) && /순이익 1,346원 − 알라딘 매입가 1,600원/.test(v.full) && /단독 매물/.test(v.full) && v.frontLen < 160, `전체 설명은 「자세히」 안(예전 그대로 모든 이유) · 앞 줄 글자 ${v.frontLen}자`, v);
  ok(v.reopen && !v.sentShort, '자세히를 펼치면 다시 그려도 펼친 채 · 검토가 아닌 줄(자동 통과 등)은 예전 모양 그대로', v);
  console.log(bad ? `❌ tSHIPCALC1112 실패 ${bad}` : '✓ tSHIPCALC1112 모두 통과'); });
