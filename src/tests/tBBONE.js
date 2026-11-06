// tBBONE — 정범님 11/06 두 가지
//  가) '매입가를 잘못 읽으면 추천가가 77배까지 올라감' → 알라딘 매입가가 그 책 정가보다 크면 잘못 읽은 값으로 보고 무시(모든 곳) · 정가를 모르면 그대로(noList로 셈)
//  나) '자동 발송도 웹앱 매입 후보 판정을 그대로 쓰면 기준이 하나로 잡히는 게 맞아?' → 같은 질문(손님에게 이 값에 파는 것이 알라딘에 파는 것보다 나은가)은 판정 엔진 bbNear 하나
//      판정 엔진 하한(floors·critTarget)도 같은 순이익 식(bbFloor) · 기준 차액은 설정 floorMargin(웹앱 bbFloorOn)을 켤 때만 — 기본 끔 = 예전 하한(순이익 = 매입가) · 출고 공용 bbNear·bbPick은 엔진 것을 부름(없을 때만 같은 셈) · ml 기대 매입가는 다른 질문(이름 구분)
//  ① 노드: 공용 함수 · 999,000원 → 추천가 안 오름 · 모든 곳 같은 답(엔진·출고 공용(혼자/엔진 부름)·자동 발송) · ml
//  ② 화면: 웹앱 bbNearJ·bbPickW·🏷 후보 계산·📥 등록 하한·출고 카드 칩이 같은 답 · 무시 표시
// 실행: cd pw && RN_PORT=8803 node tBBONE.js
const path = require('path');
const PRC = require('../readnow-pricing-core.js'); const ML = require('../readnow-ml-core.js');
const SHF = require.resolve('../readnow-shipping-core.js'); const SH = require(SHF); /* 노드: root에 ReadnowPricing이 없음 → 출고 공용 안의 같은 셈 */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const sortK = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, v[q]])) : v));
// 출고 공용을 '엔진이 곁에 있는' 상태로 한 벌 더 (웹앱·수집기·클라우드처럼)
const vm = require('vm'); const fs = require('fs'); const SH2 = (() => { const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(SHF, 'utf8'), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: { ReadnowPricing: PRC } }); return m.exports; })();

// ① 가) 매입가 거르기
let V = PRC.bbValid(999000, 13000); ok(V && V.ok === false && /정가 13,000원보다 큼/.test(V.why), '매입가 999,000원 > 정가 13,000원 → 잘못 읽은 값(무시) · 까닭 글', V);
V = PRC.bbValid(5000, 13000); ok(V && V.ok && !V.noList, '매입가 5,000원 ≤ 정가 13,000원 → 씀');
V = PRC.bbValid(13000, 13000); ok(V && V.ok, '매입가 = 정가 → 씀(정가보다 클 때만 무시)');
V = PRC.bbValid(999000, null); ok(V && V.ok && V.noList, '정가 모름 → 그대로 씀(noList — 셀 수 있게 표시)');
let pk = PRC.bbPick({ 상: 999000, 최상: 9000 }, '상', { list: 13000 }); ok(pk && pk.v === 9000 && pk.alt && pk.bad.length === 1 && pk.bad[0].g === '상', '우리 등급(상) 값이 잘못 읽은 값이면 무시하고 가장 가까운 등급(최상 9,000원)으로 — 무시한 값은 bad에', pk);
pk = PRC.bbPick({ 상: 999000 }, '상', { list: 13000 }); ok(pk && pk.v == null && pk.bad.length === 1 && /무시/.test(pk.why), '쓸 매입가가 하나도 없으면 v 없음 + 까닭', pk);
ok(sortK(SH.bbPick({ buyback: { 상: 999000, 최상: 9000 }, np: { pl: 13000 } }, '상')) === sortK(PRC.bbPick({ 상: 999000, 최상: 9000 }, '상', { list: 13000 })), '출고 공용 bbPick(시장 자료 np.pl = 정가) = 엔진 bbPick (혼자 도는 셈도 같은 답)');
ok(ML.bbExpect(999000, '상', '', 13000) === null && ML.bbExpect(5000, '상', '', 13000) > 0 && ML.bbExpect(999000, '상', '') > 0, 'ml 기대 매입가: 정가보다 큰 견적은 null · 정가 모르면 그대로');

// ① 가) 999,000원 잘못 읽음 → 추천가 안 오름 (점검 S1-5)
const L = { grade: '상', price: 10000, priceList: 15000, usedCode: 'U1', registeredAt: '2026-10-01' }; const row = (p, c, g) => ({ c, g: g || '상', p, s: 0, n: c });
const crit = { mode: 'same', bb: true, maxDrop: 40, minPrice: 1000 };
let ct = PRC.critTarget(L, [row(9000, 'green')], {}, crit, { now: Date.now(), policy: {} }, { 상: 999000 });
ok(ct.t === 9000 && !ct.bbHit && ct.bbIgnored && ct.reasons.some((x) => /알라딘 매입가 무시 — 상 알라딘 매입가 999,000원이 정가 15,000원보다 큼/.test(x)), `critTarget: 매입가 999,000원(정가 15,000원) → 추천가 ${ct.t}원 그대로(예전 1,150,000원) · 까닭에 '무시'`, ct);
ct = PRC.critTarget({ ...L, priceList: null }, [row(9000, 'green')], {}, crit, { now: Date.now(), policy: {} }, { 상: 999000 });
ok(ct.t > 1000000 && ct.bbHit, `정가를 모르면 기존대로(하한 ${ct.t}원 — 보고에 '정가 모름' 셈)`, ct.t);
ct = PRC.critTarget({ ...L, priceList: null }, [row(9000, 'green')], {}, crit, { now: Date.now(), policy: {}, priceList: 15000 }, { 상: 999000 });
ok(ct.t === 9000, '정가는 ctx.priceList(웹앱 soloCtx)로 넘겨도 같음');
const mkt = (rows) => ({ at: Date.now() - 48 * 3600e3, rows: rows.map((r, i) => ({ sellerCode: String(100 + i), sellerName: 'S' + i, grade: r.g || '상', price: r.p, ship: 0, rank: i + 1, page: 1, usedCode: 'X' + i })), pagesSeen: 1, lastPage: 1 });
const cls = { core: { classifySellerDoc: () => ({ cls: 'green' }) }, RS: {} };
let d = PRC.decide({ ...L, key: 'k1' }, mkt([{ p: 9000 }, { p: 9500 }]), {}, { now: Date.now(), ...cls, buyback: { 상: 999000 }, policy: {} });
ok(!(d.target > 100000) && d.floors && d.floors.fBuyback == null && d.floors.ignored && d.reasons.some((x) => /알라딘 매입가 무시/.test(x)), `엔진 decide: 999,000원은 하한에 안 씀 → 목표 ${d.target}원 · 판단 기록에 까닭`, { t: d.target, st: d.status, f: d.floors, r: d.reasons });

// ① 나) 모든 곳 같은 답
const pols = [{}, { fee: 2500, freeOver: 20000 }, { fee: 3000, freeOver: null }]; const mgs = [undefined, 0, 500, 1500]; const Ps = [1500, 3394, 3395, 4000, 6000, 8200, 10000, 11550, 12000, 19999, 20000, 31234]; const buys = [500, 2000, 3000, 7000, 12000];
let diff = []; let n = 0;
for (const P of Ps) for (const buy of buys) for (const pol of pols) for (const mg of mgs) for (const list of [null, 15000, 6000]) { n++; const o = { policy: pol, margin: mg, D: PRC.DEFAULTS, list };
  const a = PRC.bbNear(P, buy, o), b = SH.bbNear(P, buy, o), c = SH2.bbNear(P, buy, o); if (sortK(a) !== sortK(b) || sortK(a) !== sortK(c)) diff.push({ P, buy, pol, mg, list, a, b }); }
ok(!diff.length, `bbNear: 엔진 · 출고 공용(혼자) · 출고 공용(엔진 부름) ${n}가지 모두 같은 답(정책·기준 차액·정가 바꿔도)`, diff.slice(0, 2));
diff = [];
for (const buy of buys) for (const pol of pols) for (const mg of mgs) { const o = { policy: pol, margin: mg, D: PRC.DEFAULTS, floorMargin: true }; const F = PRC.bbFloor(buy, o); if (F == null) { diff.push({ buy, F }); continue; } const step = PRC.priceStep(F);
  const atF = PRC.bbNear(F, buy, o); if (atF.in) diff.push({ buy, pol, mg, F, atF }); const dn = PRC.snapDown(F - 1); if (dn > 0 && PRC.bbNear(dn, buy, o).in !== true) diff.push({ buy, pol, mg, F, dn, step, why: '하한 바로 아래 가격 단위가 후보가 아님' }); }
ok(!diff.length, '(하한 기준 차액 켬) 판정 엔진 하한(bbFloor) = 매입 후보가 아니게 되는 가장 낮은 가격 단위 — 하한에선 후보 아님 · 한 단위 아래는 후보(같은 순이익 식·같은 기준 차액)', diff.slice(0, 3));
// 엔진 critTarget 하한 = bbFloor (기준 차액 넘김)
diff = []; for (const buy of [3000, 7000]) for (const mg of [500, 1500]) { const c2 = PRC.critTarget(L, [row(1000, 'green')], {}, crit, { now: Date.now(), policy: {}, bbMargin: mg, floorMargin: true }, { 상: buy }); const F = PRC.bbFloor(buy, { margin: mg, D: PRC.DEFAULTS, floorMargin: true }); if (c2.floor !== Math.max(F, 1000, PRC.snapUp(10000 * 0.6)) && c2.t !== F) diff.push({ buy, mg, t: c2.t, floor: c2.floor, F }); }
ok(!diff.length, '(켬) critTarget 하한 = 공용 bbFloor(기준 차액 500·1,500원)', diff);
const dF = PRC.decide({ ...L, key: 'k2' }, mkt([{ p: 6000 }, { p: 6500 }]), {}, { now: Date.now(), ...cls, buyback: { 상: 7000 }, policy: {}, bbMargin: 500, floorMargin: true });
ok(dF.floors && dF.floors.fBuyback === PRC.bbFloor(7000, { margin: 500, D: PRC.DEFAULTS, floorMargin: true }) && dF.floors.fBuyback === 12000 && dF.status === 'floor' && dF.target === 12000, `엔진 decide 하한 ${dF.floors && dF.floors.fBuyback}원 = 공용 bbFloor(예전 순이익 = 매입가 하한 ${PRC.minPriceFor(7000, {}, null)}원 → 기준 차액 500원 넣음)`, dF.floors);
// 기본(끔) — 예전 하한 그대로 (점검 S1-6 · 11,000원)
const d0 = PRC.decide({ ...L, key: 'k3' }, mkt([{ p: 6000 }, { p: 6500 }]), {}, { now: Date.now(), ...cls, buyback: { 상: 7000 }, policy: {}, bbMargin: 500 });
const c0 = PRC.critTarget(L, [row(10000, 'ours')], {}, crit, { now: Date.now(), policy: {} }, { 상: 7000 });
diff = []; for (const buy of buys) for (const pol of pols) if (PRC.bbFloor(buy, { policy: pol, margin: 1500, D: PRC.DEFAULTS }) !== PRC.minPriceFor(buy, { policy: pol }, null)) diff.push({ buy, pol });
ok(d0.floors.fBuyback === 11000 && !d0.floors.floorMargin && c0.t === 11000 && c0.bbHit && !diff.length, `기본(끔): 엔진 decide·critTarget 하한 ${d0.floors.fBuyback}·${c0.t}원 = 예전 하한(순이익 = 매입가 · minPriceFor) — 기준 차액 바꿔도 하한 그대로`, { d: d0.floors, c: c0.t, diff });
ok(!PRC.bbNear(dF.target, 7000, { margin: 500 }).in && PRC.bbNear(dF.target - 500, 7000, { margin: 500 }).in, '엔진이 하한에 멈춘 값은 매입 후보가 아니고 · 한 단위 아래는 매입 후보 — 엔진·🏷 같은 답');
// 자동 발송 = bbNear (엔진 부르는 출고 공용으로도)
const E = (bb, pl) => ({ mkt: { at: '2026-11-06T01:00:00Z', rows: [{ c: 'green', g: '상', p: 20000, s: 0, so: 0 }, { c: 'green', g: '상', p: 21000, s: 0, so: 0 }], isbnOk: true, np: pl ? { pl } : null, buyback: bb }, via: 'ours' });
const dec = (S0, P, bb, pl, bbx) => S0.autoShipDecide({ evalSale: ML.evalSale, now: 1000, firstAt: 1000, bb: bbx, order: { orderNo: 'O1', items: [{ listingId: '1', title: 't', price: P, qty: 1, grade: '상', sku: 'YLWCMN_ms' }] }, enrich: { 1: E(bb, pl) } });
diff = []; for (const S0 of [SH, SH2]) for (const P of [3000, 8200, 10000, 12000]) for (const buy of [3000, 7000]) for (const bbx of [{}, { margin: 1500, policy: { fee: 2500, freeOver: 20000 } }]) { const D0 = dec(S0, P, { 상: buy }, 15000, bbx); const J = PRC.bbNear(P, buy, { ...bbx, list: 15000 }); if (D0.kinds.includes('bbLow') !== J.in || D0.items[0].bbGain !== J.gain) diff.push({ P, buy, bbx, k: D0.kinds, g: D0.items[0].bbGain, J: J.gain }); }
ok(!diff.length, '🤖 자동 발송요청 저가 규칙 = 엔진 bbNear (출고 공용 혼자·엔진 부름 모두)', diff);
let D1 = dec(SH2, 3000, { 상: 999000 }, 13000); ok(D1.state === 'pass' && D1.items[0].rule === 'bbNone' && D1.items[0].bbBad && /999,000원이 정가 13,000원보다 큼/.test(D1.items[0].why), "자동 발송: 매입가 999,000원(정가 13,000원) → 무시하고 '매입가 모름'으로(통과) · 판단 기록에 까닭: " + D1.items[0].why, D1.items[0]);
D1 = dec(SH2, 3000, { 상: 999000 }, null); ok(D1.state === 'review' && D1.kinds.includes('bbLow') && D1.items[0].bbNoList, '정가를 모르면 기존대로(999,000원과 견줘 매입 후보 → 검토) · bbNoList 표시', D1.items[0]);

// ② 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const out = {}; const SHw = window.ReadnowShipping, PRw = window.ReadnowPricing; S.policy = null; S.app = { ...S.app, bbMargin: 500 };
    out.deleg = SHw.bbNear(8200, 7000, {}) && PRw.bbNear(8200, 7000, {}) && JSON.stringify(SHw.bbNear(8200, 7000, { list: 6000 })) === JSON.stringify(PRw.bbNear(8200, 7000, { list: 6000 }));
    const cases = []; for (const P of [3000, 3394, 3395, 6000, 8200, 10000, 12000]) for (const buy of [2000, 3800, 7000]) for (const list of [null, 15000, 5000]) { const J = bbNearJ(P, buy, '상', null, list); const C = PRw.bbNear(P, buy, { ...bbCtx(), list }); cases.push({ P, buy, list, w: J && J.in, c: C && C.in, wi: !!(J && J.ignored), ci: !!(C && C.ignored), gw: J && J.gain, gc: C && C.gain }); }
    out.cases = cases;
    const J9 = bbNearJ(3000, 999000, '상', null, 13000); out.j9 = J9 && { in: J9.in, tag: J9.tag, why: J9.why, html: bbNearTag(J9) };
    const pkw = bbPickW({ 상: 999000, 최상: 9000 }, '상', 13000); out.pkw = pkw; out.pkTag = bbBadTag(pkw);
    // 상품 상세·경영과 같은 bbJOf · 🏷 후보 계산(bbuyCompute)
    const A = [...S.plist.values()].filter((l) => l.active && l.bookId && l.price > 0).slice(0, 3); out.nA = A.length;
    if (A.length >= 2) { const [a0, a1] = A; a0.grade = '상'; a1.grade = '상'; S.pmetrics.set(a0.bookId, { ...(S.pmetrics.get(a0.bookId) || {}), buyback: { 상: 999000 }, priceList: 13000 }); S.pmetrics.set(a1.bookId, { ...(S.pmetrics.get(a1.bookId) || {}), buyback: { 상: Math.max(100, a1.price - 100) }, priceList: Math.max(30000, a1.price * 2) });
      const b0 = bbJOf(a0, S.pmetrics.get(a0.bookId)), b1 = bbJOf(a1, S.pmetrics.get(a1.bookId)); out.b0 = { v: b0.pk && b0.pk.v, bad: b0.pk && b0.pk.bad.length, J: !!b0.J }; out.b1 = { in: b1.J && b1.J.in, same: b1.J && PRw.bbNear(a1.price, a1.price - 100 > 100 ? a1.price - 100 : 100, { ...bbCtx(), list: Math.max(30000, a1.price * 2) }).in === b1.J.in };
      out.pd0 = pdBhHtml(a0);
      try { await bbuyCompute(true); out.bb = S.bbuyRes ? { bad: S.bbuyRes.bad, noList: S.bbuyRes.noList, hit0: S.bbuyRes.hit.has(a0.usedCode), hit1: S.bbuyRes.hit.has(a1.usedCode) } : null; } catch (e) { out.bbErr = e.message; } }
    // 📥 등록 하한 = 엔진 critTarget 하한(bbFloorPick)
    const it = { id: 'rX', grade: '상', info: { buyback: { 상: 7000 }, priceList: 15000 } }; const cfg = { crit: { bb: true } }; const F0 = regBbFloor(it, cfg); out.rf0 = F0 && F0.floor; out.cfg0 = bbNearCfgHtml('t'); S.app = { ...S.app, bbFloorOn: true }; const F = regBbFloor(it, cfg); out.rf = F && F.floor; out.cfg1 = bbNearCfgHtml('t'); S.app = { ...S.app, bbFloorOn: false }; out.rfE = PRw.bbFloor(7000, { margin: 500, D: PRw.DEFAULTS, floorMargin: true });
    const it9 = { id: 'rY', grade: '상', stage: 'sel', info: { buyback: { 상: 999000 }, priceList: 13000 } }; out.rf9 = regBbFloor(it9, cfg); out.rb9 = regBbBuy(it9); out.chip9 = regBbIn(it9, 3000);
    // 출고 카드 칩
    S.shipAutoCfg = { on: true }; out.chip = shipLowBB({ price: 3000, grade: '상', sku: 'YLWCMN_ms' }, { buyback: { 상: 999000 }, np: { pl: 13000 } }); out.chipOld = shipLowBB({ price: 3000, grade: '상', sku: 'YLWCMN_ms' }, { buyback: { 상: 999000 } });
    return out; });
  ok(r.deleg, '웹앱: 출고 공용 bbNear가 엔진 bbNear를 부름(같은 결과)');
  const df = r.cases.filter((x) => x.w !== x.c || x.wi !== x.ci || x.gw !== x.gc); ok(!df.length && r.cases.some((x) => x.w) && r.cases.some((x) => x.wi), `웹앱 bbNearJ = 엔진 bbNear ${r.cases.length}가지 모두 같은 답(정가 거르기 포함)`, df.slice(0, 3));
  ok(r.j9 && r.j9.in === false && /매입가 무시/.test(r.j9.tag) && /정가 13,000원보다 큼/.test(r.j9.why) && /매입가 무시/.test(r.j9.html), "웹앱 매입 후보: 999,000원(정가 13,000원) → 후보 아님 · 「매입가 무시(정가보다 큼)」 표시와 까닭", r.j9);
  ok(r.pkw && r.pkw.v === 9000 && r.pkw.alt && /⚠ 매입가 무시 상 999,000원\(정가 13,000원보다 큼\)/.test(r.pkTag), '웹앱 bbPickW = 엔진 bbPick(다른 등급으로 · 무시 표시 칩)', { pk: r.pkw, tag: r.pkTag });
  ok(r.nA >= 2 && r.b0.v == null && r.b0.bad === 1 && !r.b0.J && r.b1.in && r.b1.same, '경영·상품 상세(bbJOf): 잘못 읽은 매입가 상품은 후보 아님 · 정상 상품은 엔진과 같은 답', r);
  ok(/매입가 무시/.test(r.pd0 || ''), '상품 상세 🏷 알라딘 매입 줄에 「⚠ 매입가 무시」', r.pd0);
  ok(r.bb && r.bb.bad >= 1 && !r.bb.hit0, `🏷 알라딘 매입 후보 계산: 무시 ${r.bb && r.bb.bad}권 셈 · 잘못 읽은 상품은 후보 아님 · 정가 모름 ${r.bb && r.bb.noList}권 셈`, r.bb || r.bbErr);
  ok(r.rf0 === 11000 && r.rf === r.rfE && r.rf === 12000, `📥 등록 매입가 하한: 기본(끔) ${r.rf0}원(예전 그대로) · 켬 ${r.rf}원 = 엔진 bbFloor(기준 차액 넣음)`, r);
  ok(/data-bbflooron/.test(r.cfg0) && !/data-bbflooron="t" checked/.test(r.cfg0) && /예전 그대로/.test(r.cfg0) && /checked/.test(r.cfg1) && /≥ 500원이 되는 가장 낮은 값/.test(r.cfg1), '⚙ 설정 칸: 「하한에도 매입 후보 기준 차액 넣기」 기본 끔 + 셈 식 한 줄(끔·켬)', { a: r.cfg0.slice(0, 400), b: r.cfg1.slice(0, 400) });
  ok(r.rf9 == null && r.rb9.buy === 0 && r.rb9.pk && r.rb9.pk.bad.length === 1 && /매입가 무시/.test(r.chip9), '📥 등록: 999,000원(정가 13,000원)은 하한·후보에 안 씀 · 매입가 칩에 「⚠ 매입가 무시」', { rf9: r.rf9, rb9: r.rb9, chip: r.chip9 });
  ok(/매입가 모름/.test(r.chip) && /999,000원이 정가 13,000원보다 큼/.test(r.chip) && /sev-bb na/.test(r.chip) && /sev-bb bad/.test(r.chipOld), '출고 카드 칩: 정가 아는 999,000원은 무시(매입가 모름 · 까닭) · 정가 모르면 그대로(⚠ 검토)', { a: r.chip, b: r.chipOld });
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tBBONE 모두 통과');
});
