// tSHIPGRADE — 정범님 11/09 '설정에서 모든 상태에 대한 세세한 조건을 조정할 수 있게 해줘'
//  🤖 자동 발송요청 ⑥ 저가·관리코드 규칙의 '알라딘 매입 후보' 판정을 상태(등급)별로: ⚙ 상태별 알라딘 매입 조건 표(app_settings/ship_auto.bbGr)
//  줄 = 최상·상·중·하·모름 · 칸 = on(매입 후보로 봄) · margin(기준 차액) · match(near 가장 가까운 등급 | same 같은 등급만) · lowPrice(저가 기준) · rest(pass 통과 | pct 퍼센트 기준) · cheapPct
//  판정 한 곳 = 판정 엔진 bbGrNorm·bbGrRow·bbGradeOut → 출고 공용 autoShipDecide(엔진이 없으면 같은 셈)
//  ① 노드: 기본값은 예전과 같은 답 · 줄을 바꾸면 판정이 바뀜 · 엔진 붙음/없음(클라우드·수집기 옛 핀) 같은 답 ② 화면: 설정 표·출고 카드 칩·판단 풀이에 '상태 ○ 줄'
// 실행: cd pw && RN_PORT=8803 node tSHIPGRADE.js
const path = require('path'); const fs = require('fs'); const vm = require('vm'); const SHP = path.resolve(__dirname, '../readnow-shipping-core.js');
const ML = require('../readnow-ml-core.js'); const PRC = require('../readnow-pricing-core.js');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 });
const E = (rows, bb) => ({ mkt: { at: '2026-11-09T12:00:00Z', rows, usedTotal: rows.length, np: null, isbnOk: true, ...(bb ? { buyback: bb } : {}) }, via: 'ours' });
const it = (lid, price, sku, g) => ({ listingId: lid, title: '책' + lid, price, qty: 1, grade: g, sku: sku || 'YLWCMN_ms' });
const base = { evalSale: ML.evalSale, now: 1000, firstAt: 1000 };
const mk = (SH, cfg, P, buy, g, sku, rows) => SH.autoShipDecide({ ...base, cfg, order: { orderNo: 'O1', buyer: '손님A', items: [it('1', P, sku, g)] }, enrich: { 1: E(rows || [row('green', g || '상', P + 500), row('green', g || '상', P + 900)], buy) } });
// 두 길: 엔진이 곁에 있는 출고 공용(웹앱·클라우드·PC) · 엔진 없는 출고 공용(노드·옛 엔진 핀)
const withPR = (() => { const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(SHP, 'utf8'), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: { ReadnowPricing: PRC } }); return m.exports; })();
const noPR = (() => { const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(SHP, 'utf8'), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: {} }); return m.exports; })();
const oldPR = (() => { const O = { ...PRC }; delete O.bbGrRow; delete O.bbGrNorm; const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(SHP, 'utf8'), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: { ReadnowPricing: O } }); return m.exports; })();
const sortK = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, v[q]])) : v));

// ① 기본 표
const D0 = PRC.bbGrNorm({});
ok(D0.최상.on && D0.상.on && !D0.중.on && !D0.하.on && D0.모름.on && Object.values(D0).every((r) => r.match === 'near' && r.rest === 'pass' && r.margin == null && r.lowPrice == null && r.cheapPct == null), '기본 표 = 최상·상 켬 · 중·하 끔 · 모름 켬 · 가장 가까운 등급 · 그 밖 통과 · 빈 칸(전체 값)', D0);
ok(PRC.bbGrRow('새책', {}).k === '모름' && PRC.bbGrRow('', {}).k === '모름' && PRC.bbGrRow('중', {}).def, "모르는 글자·빈 등급 → '모름' 줄 · 기본 줄은 def");
ok(PRC.bbGradeOut('중', null, {}).why === PRC.bbGradeOut('중').why && PRC.bbGradeOut('상', null, {}) === null && PRC.bbGradeOut('', null, {}) === null, '판정 엔진 bbGradeOut: 표 기본값 = 예전 답(표 없이)');
ok(sortK(withPR.bbGrNorm({ 상: { margin: '300', match: 'same', on: 'x' } })) === sortK(noPR.bbGrNorm({ 상: { margin: '300', match: 'same', on: 'x' } })) && withPR.bbGrNorm({ 상: { margin: 300 } }).상.margin === 300 && withPR.bbGrNorm({ 상: { margin: -5, cheapPct: 500 } }).상.cheapPct === 100, '표 다듬기: 엔진·출고 공용 같은 답 · 범위 밖 값 자름');
ok(sortK(withPR.autoCfg({}).bbGr) === sortK(D0) && sortK(noPR.autoCfg({ bbGr: { 중: { on: true } } }).bbGr.중) === sortK({ ...D0.중, on: true }), 'autoCfg가 문서의 bbGr을 다듬어 cfg.bbGr로 (클라우드·PC·웹앱 모두 autoCfg를 거침)');

const cases = [];
for (const [tag, SH] of [['엔진 붙음', withPR], ['엔진 없음', noPR], ['엔진 옛 판', oldPR]]) {
  const C = (bbGr, o) => ({ ...(o || {}), bbGr });
  // 기본값 = 11/09 전과 같음
  let D = mk(SH, C({}), 8200, { 상: 7000, 중: 7000 }, '상'); ok(D.state === 'review' && D.kinds.includes('bbLow') && D.items[0].bbRow === '상' && /상태 '상' 줄\(기본값\)/.test(D.items[0].why), `${tag}: 기본 · 상 8,200원 · 매입가 7,000원 → 매입 후보 검토 · 까닭에 '상태 상 줄(기본값)'`, D.items[0]);
  D = mk(SH, C({}), 8200, { 상: 7000, 중: 7000 }, '중'); ok(D.state === 'pass' && D.items[0].rule === 'bbGrade' && /알라딘은 '중' 상태를 매입하지 않아/.test(D.items[0].why), `${tag}: 기본 · 중 → 매입 조건 밖 통과(예전 그대로)`, D.items[0]);
  D = mk(SH, C({}), 8200, { 최상: 7000 }, ''); ok(D.state === 'review' && D.items[0].rule === 'bb' && D.items[0].bbRow === '모름', `${tag}: 기본 · 등급 모름 → 가장 가까운(가장 좋은) 등급 매입가로 판정(예전 그대로)`, D.items[0]);
  // 줄을 바꾸면 판정이 바뀜
  D = mk(SH, C({ 중: { on: true } }), 8200, { 상: 7000, 중: 7000 }, '중'); ok(D.state === 'review' && D.kinds.includes('bbLow') && D.items[0].rule === 'bb' && /바꾼 값: 매입 후보/.test(D.items[0].why), `${tag}: 중 줄 켬 → 중도 매입 후보로 검토`, D.items[0]);
  D = mk(SH, C({ 상: { on: false } }), 8200, { 상: 7000 }, '상'); ok(D.state === 'pass' && D.items[0].rule === 'bbGrade' && /'상' 줄을 꺼/.test(D.items[0].why), `${tag}: 상 줄 끔 → 상도 매입 조건 밖 통과`, D.items[0]);
  D = mk(SH, C({ 상: { margin: 0 } }), 8200, { 상: 7000 }, '상'); const g0 = D.items[0].bbGain; ok(D.items[0].bbK === 0 && (g0 < 0 ? D.state === 'review' : D.state === 'pass') && /기준 차액 0원/.test(D.items[0].why), `${tag}: 상 줄 기준 차액 0원 → 그 기준으로 판정(차 ${g0}원 → ${D.state})`, D.items[0]);
  D = mk(SH, C({ 상: { margin: 5000 } }), 8200, { 상: 4000 }, '상'); ok(D.items[0].bbK === 5000 && D.state === 'review', `${tag}: 상 줄 기준 차액 5,000원 → 매입가 4,000원도 후보로 검토`, D.items[0]);
  D = mk(SH, C({}), 8200, { 최상: 7000 }, '상'); ok(D.state === 'review' && D.items[0].bbAlt, `${tag}: 기본 · 상 칸 없음 → 가장 가까운 최상 매입가로 검토`, D.items[0]);
  D = mk(SH, C({ 상: { match: 'same' } }), 8200, { 최상: 7000 }, '상'); ok(D.state === 'pass' && D.items[0].rule === 'bbNone' && D.items[0].bbSameOnly === '최상' && /같은 등급만/.test(D.items[0].why), `${tag}: 상 줄 '같은 등급만' → 최상 매입가는 견주지 않고 매입가 모름 통과`, D.items[0]);
  D = mk(SH, C({ 상: { lowPrice: 9000 } }), 8200, { 상: 7000 }, '상', 'BLKCMN_ms'); ok(D.state === 'review' && D.items[0].rule === 'bb' && /9,000원 이하/.test(D.items[0].low), `${tag}: 상 줄 저가 기준 9,000원 → 관리코드 아닌 8,200원도 ⑥(매입가 판정)`, D.items[0]);
  D = mk(SH, C({}), 8200, { 상: 7000 }, '상', 'BLKCMN_ms'); ok(D.items[0].rule === 'pct', `${tag}: 기본 저가 기준 4,000원 → 8,200원 관리코드 아님은 25% 규칙(예전 그대로)`, D.items[0]);
  // 그 밖 = 퍼센트
  const cheapRows = [row('green', '중', 12000), row('green', '중', 13000)];
  D = mk(SH, C({}), 3000, null, '중', 'YLWCMN_ms', cheapRows); ok(D.state === 'pass', `${tag}: 기본 · 중 · 시장보다 75% 쌈이어도 통과(그 밖 = 통과)`, D.items[0]);
  D = mk(SH, C({ 중: { rest: 'pct' } }), 3000, null, '중', 'YLWCMN_ms', cheapRows); ok(D.state === 'review' && D.kinds.includes('cheap') && D.items[0].pct && D.items[0].rule === 'bbGrade' && /상태 '중' 줄 기준/.test(D.reasons[0]), `${tag}: 중 줄 '그 밖 = 퍼센트' → 25% 기준으로 검토`, D);
  D = mk(SH, C({ 중: { rest: 'pct', cheapPct: 80 } }), 3000, null, '중', 'YLWCMN_ms', cheapRows); ok(D.state === 'pass' && D.items[0].cheapPct === 80, `${tag}: 중 줄 퍼센트 80% → 75% 쌈은 통과`, D.items[0]);
  D = mk(SH, C({ 상: { rest: 'pct' } }), 3000, null, '상', 'YLWCMN_ms', [row('green', '상', 12000), row('green', '상', 13000)]); ok(D.state === 'review' && D.items[0].rule === 'bbNone' && D.items[0].pct, `${tag}: 상 줄 '그 밖 = 퍼센트' · 매입가 모름 → 25% 기준으로 검토`, D.items[0]);
  D = mk(SH, C({ 상: { rest: 'pct' } }), 8200, { 상: 2000 }, '상', 'YLWCMN_ms', [row('green', '상', 8500), row('green', '상', 9000)]); ok(D.state === 'pass' && D.items[0].rule === 'bb' && D.items[0].pct && !D.kinds.includes('bbLow'), `${tag}: 상 줄 '그 밖 = 퍼센트' · 후보 아님 · 시장과 비슷 → 통과`, D.items[0]);
  cases.push(JSON.stringify([mk(SH, C({ 중: { on: true, margin: 800, match: 'same' } }), 3500, { 상: 3000 }, '중'), mk(SH, C({ 하: { on: true } }), 3500, { 중: 3000 }, '하'), mk(SH, C({ 모름: { on: false, rest: 'pct' } }), 3000, { 상: 3000 }, '', 'YLW', cheapRows)].map((d) => ({ s: d.state, k: d.kinds, r: d.reasons, i: d.items.map((x) => ({ ...x })) }))));
}
ok(cases[0] === cases[1] && cases[1] === cases[2], '세 길(엔진 붙음 = 클라우드·웹앱 · 엔진 없음 · 엔진 옛 판 = 수집기 옛 핀) 같은 답', cases.map((c) => c.slice(0, 200)));
ok(withPR.bbGradeOut('최상', { 최상: { on: false } }).why === noPR.bbGradeOut('최상', { 최상: { on: false } }).why && withPR.bbGradeOut('중') && noPR.bbGradeOut('중') && withPR.bbGradeOut('상') === null, '출고 공용 bbGradeOut(등급, 표) — 두 길 같은 답 · 표 없이 부르면 예전 답');
ok(withPR.autoLowOf({ price: 5000, grade: '상' }, { bbGr: { 상: { lowPrice: 6000 } } }) && !withPR.autoLowOf({ price: 5000, grade: '최상' }, { bbGr: { 상: { lowPrice: 6000 } } }), 'autoLowOf가 상태 줄 저가 기준을 씀(상 6,000원 · 최상은 전체 4,000원)');
globalThis.ReadnowPricing = PRC;

// ② 화면
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const SHw = window.ReadnowShipping; const out = {}; const ev = window.ReadnowML && window.ReadnowML.evalSale;
    out.has = !!(SHw && SHw.bbGrRow && window.ReadnowPricing && window.ReadnowPricing.bbGrRow);
    const dec = (g) => SHw.autoShipDecide({ evalSale: ev, now: 1000, firstAt: 1000, bb: bbCtx(), cfg: shipAutoCfgNow(), order: { orderNo: 'O1', items: [{ listingId: '1', title: 't', price: 8200, qty: 1, grade: g, sku: 'YLWCMN_ms' }] }, enrich: { 1: { mkt: { at: '2026-11-09T12:00:00Z', rows: [{ c: 'green', g, p: 8700, s: 0, so: 0 }, { c: 'green', g, p: 9100, s: 0, so: 0 }], isbnOk: true, buyback: { 상: 7000, 중: 7000 } }, via: 'ours' } } });
    const mkt = { buyback: { 상: 7000, 중: 7000 } };
    S.shipAutoCfg = { on: true }; out.d0 = dec('중').state; out.chip0 = shipLowBB({ price: 8200, grade: '중', sku: 'YLWCMN_ms' }, mkt); out.chipHi0 = shipLowBB({ price: 8200, grade: '상', sku: 'YLWCMN_ms' }, mkt);
    out.tbl = shipGrTblHtml(shipAutoCfgNow());
    S.shipAutoCfg = { on: true, bbGr: { 중: { on: true, margin: 700 } } }; const d1 = dec('중'); out.d1 = { state: d1.state, kinds: d1.kinds, rule: d1.items[0].rule, k: d1.items[0].bbK }; out.chip1 = shipLowBB({ price: 8200, grade: '중', sku: 'YLWCMN_ms' }, mkt); out.tip1 = sauItemsTip(d1);
    out.tbl1 = shipGrTblHtml(shipAutoCfgNow());
    S.shipAutoCfg = { on: true, bbGr: { 상: { on: false } } }; out.chip2 = shipLowBB({ price: 8200, grade: '상', sku: 'YLWCMN_ms' }, mkt); out.tip2 = sauItemsTip(dec('상'));
    // 설정 화면 묶기 — 칸을 바꾸면 ship_auto.bbGr에 저장
    S.shipAutoCfg = { on: true }; const box = document.createElement('div'); box.innerHTML = `<details id="sau_set" open>${shipAutoSetHtml()}</details>`; document.body.appendChild(box); out.inSet = !!box.querySelector('.sau-gr [data-sgr="하|on"]');
    out.box = box.querySelectorAll('[data-sgr]').length; return out; });
  ok(r.has, '웹앱이 판정 엔진·출고 공용 bbGrRow를 불러옴');
  ok(r.d0 === 'pass' && /매입 조건 밖\(중\)/.test(r.chip0) && /상태 &#39;중&#39; 줄\(기본값\)|상태 '중' 줄\(기본값\)/.test(r.chip0) && /sev-bb bad/.test(r.chipHi0), '기본: 중 통과 · 칩 매입 조건 밖(중) + 상태 줄 · 상은 ⚠', [r.d0, r.chip0.slice(0, 400)]);
  ok(/<table/.test(r.tbl) && ['최상', '상', '중', '하', '모름'].every((k) => r.tbl.includes(`data-sgrk="${k}"`)) && /근거: /.test(r.tbl) && !/근거: 없음, 설정으로 바꿈<\/small>/.test(r.tbl.replace(/title="[^"]*"/g, '')), '설정 표 5줄 · 기본 줄은 기본 근거 표시', r.tbl.slice(0, 300));
  ok(/바꾼 칸\(매입 후보·기준 차액\) — 근거: 없음, 설정으로 바꿈/.test(r.tbl1) && /data-sgrreset="중"/.test(r.tbl1), "바꾼 줄은 '근거: 없음, 설정으로 바꿈' + 기본값 단추", r.tbl1.slice(0, 200));
  ok(r.d1.state === 'review' && r.d1.rule === 'bb' && r.d1.k === 700 && /sev-bb bad/.test(r.chip1) && /바꾼 값/.test(r.chip1) && /상태 '중' 줄/.test(r.tip1), "중 줄 켬·700원 → 웹앱 판단·칩·풀이 모두 같은 답과 '상태 중 줄'", r);
  ok(/매입 조건 밖\(상\)/.test(r.chip2) && /줄을 꺼/.test(r.chip2) && /'상' 줄을 꺼/.test(r.tip2), '상 줄 끔 → 칩 매입 조건 밖(상) · 풀이에 까닭', [r.chip2.slice(0, 300), r.tip2]);
  ok(r.inSet && r.box >= 30, `⚙ 🤖 자동 발송요청 안에 표가 들어감(칸 ${r.box}개)`, r);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과');
});
