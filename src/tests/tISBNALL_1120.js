/* tISBNALL_1120 — (11/20 isbnall1 · 정범님 I-1120-1430-27c) ISBN 판매 짝짓기를 웹앱 전체로
 *  ① saleIdx를 쓰던 곳 → saleIdxX(번호 없이 ISBN·listingKey만 온 주문 줄도): 예스24 알라딘 먼저 팔림 · 상품 카드 판매 기록 · SP 매출 · 판 옮김 주문 수(셋) · 매입가 바꿈 경고 · 피드백 다시 올림 안전
 *  ② 판매됨 표시(soldInfo)는 saleIdx 그대로
 *  ③ ckLineIn: ISBN 줄은 같은 ISBN 우리 상품이 모두 묶음 안일 때만 묶음 판매(묶음 밖 같은 ISBN 상품 판매를 묶음으로 세지 않음)
 *  ④ fbSoldSince·buypSoldOf: 어느 상품인지 모르는 같은 ISBN 판매도 안전 쪽으로 막음·경고
 *  손님 이름·전화 없음 · 팝업 없음 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const H = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const HL = H.split('\n');
let fail = 0; const ok = (c, m) => { if (c) console.log('  ✅ ' + m); else { fail++; console.log('  ❌ ' + m); } };

function grab(name) { const re = new RegExp('^(async )?function ' + name + '\\(|^const ' + name + ' = '); const i = HL.findIndex((l) => re.test(l)); if (i < 0) throw new Error('못 찾음: ' + name);
  let acc = ''; for (let j = i; j < i + 60; j++) { acc += HL[j] + '\n'; try { new vm.Script(acc); return acc; } catch (e) {} } throw new Error('못 뗌: ' + name); }
function ctxWith(names, extra) { const ctx = vm.createContext({ console, Map, Set, WeakMap, Date, JSON, Math, String, Number, isFinite, Array, Object, ...(extra || {}) }); const got = new Set();
  const load = (n) => { if (got.has(n)) return; got.add(n); vm.runInContext(grab(n).replace(/^const /, 'var '), ctx); };
  names.forEach(load); ctx.__load = load; return ctx; }
function run(ctx, code) { for (let t = 0; t < 20; t++) { try { return vm.runInContext(code, ctx); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; ctx.__load(m[1]); } } throw new Error('이름이 너무 많이 빠짐'); }
const body = (name) => grab(name);

console.log('① saleIdx → saleIdxX로 바꾼 곳');
{ const calls = (H.match(/\bsaleIdx\(\)/g) || []).length;
  ok(calls === 3, `saleIdx()는 정의·saleIdxX 안·soldInfo 셋만 남음 (지금 ${calls})`);
  ok(/function soldInfo\([^\n]*\n\s*const sl = saleIdx\(\)\.get\(id\)/.test(H), '판매됨 표시(soldInfo)는 saleIdx 그대로');
  ok(/const sl = \(saleIdxX\(\)\.get\(l\.id\) \|\| \[\]\)\.concat\(l\.soldAt/.test(H), '예스24 「알라딘 먼저 팔림」 = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('prodSalesHtml')), '상품 카드 판매 기록(prodSalesHtml) = saleIdxX');
  ok(/const IX = saleIdxX\(\)/.test(body('spSalesCalc')), 'SP 매출(spSalesCalc) = saleIdxX');
  ok(/sale = \(saleIdxX\(\)\.get\(oK\)/.test(H), '판 옮김 보고 주문 수 = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('edMvOrders')), '판 옮김 막음 주문 수(edMvOrders) = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('edMvStart')), '판 옮김 맡기기 주문 수(edMvStart) = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('buypSoldOf')), '매입가 바꿈 경고(buypSoldOf) = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('fbSoldSince')), '피드백 다시 올림 안전(fbSoldSince) = saleIdxX');
  ok(/saleIdxX\(\)/.test(body('bqSoldOf')), 'bqSoldOf = saleIdxX(ctrlopt1에서 이미)');
  ok(!/\b(alert|confirm|prompt)\(/.test([body('fbSoldSince'), body('buypSoldOf'), body('ckLineIn'), body('ckIsbPl')].join('\n')), '팝업 없음');
}

/* 공통 자료 — ISBN A: 우리 상품 하나(aladin_1) · ISBN B: 둘(aladin_2·aladin_3, 값이 같아 못 좁힘) */
function seed(ctx) {
  ctx.S = { orders: new Map(), plist: new Map(), dv: { o: 1 } };
  const L = (id, isbn, price, grade, reg) => ctx.S.plist.set(id, { id, isbn13: isbn, price, grade, registeredAt: reg || '2026-10-01T00:00:00Z', usedCode: id.slice(7) });
  L('aladin_1', '9780000000001', 5000, '상'); L('aladin_2', '9780000000002', 3000, '상'); L('aladin_3', '9780000000002', 3000, '상');
  const O = (id, at, items) => ctx.S.orders.set(id, { id, kind: 'sale', orderNo: 'N' + id, orderedAt: at, items });
  O('o1', '2026-11-18T12:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000001', qty: 1, price: 5000 }]);
  O('o2', '2026-11-18T13:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000002', qty: 1, price: 3000 }]);
  return ctx;
}

console.log('② 판 옮김·피드백·매입가 — 번호 없는 판매를 봄');
{ const ctx = seed(ctxWith(['kMs', 'lineGrade', 'saleIdx', 'saleIdxX', 'edMvOrders', 'fbSoldSince'], { cashIdx: () => new Map() }));
  ctx.Date = class extends Date { static now() { return Date.parse('2026-11-20T00:00:00Z'); } };
  ok(run(ctx, "edMvOrders(S.plist.get('aladin_1'), 30)") === 1, 'edMvOrders: ISBN만 온 주문도 셈(예전 0)');
  ok(run(ctx, "edMvOrders(S.plist.get('aladin_2'), 30)") === 0, 'edMvOrders: 어느 상품인지 모르면 셈에 안 넣음');
  const f1 = run(ctx, "fbSoldSince({ key: 'aladin_1', at: '2026-11-17T00:00:00Z' })");
  ok(/맡긴 뒤 알라딘 주문이 들어옴/.test(f1 || ''), 'fbSoldSince: ISBN 하나뿐 상품 판매 → 멈춤');
  const f2 = run(ctx, "fbSoldSince({ key: 'aladin_2', at: '2026-11-17T00:00:00Z' })");
  ok(/같은 ISBN 주문/.test(f2 || ''), 'fbSoldSince: 어느 상품인지 모르는 같은 ISBN 주문 → 안전 쪽으로 멈춤');
  ok(run(ctx, "fbSoldSince({ key: 'aladin_2', at: '2026-11-19T00:00:00Z' })") === null, 'fbSoldSince: 맡기기 전 주문이면 막지 않음');
}
{ const ctx = seed(ctxWith(['kMs', 'lineGrade', 'saleIdx', 'saleIdxX', 'buypSoldOf'], { buypListingOf: (it) => it.lid }));
  ok(run(ctx, "buypSoldOf({ lid: 'aladin_1' })") === '판매 1건', 'buypSoldOf: ISBN만 온 판매도 「판매 1건」');
  ok(/같은 ISBN 판매 1건/.test(run(ctx, "buypSoldOf({ lid: 'aladin_3' })") || ''), 'buypSoldOf: 모르는 같은 ISBN 판매는 따로 경고');
  run(ctx, "S.plist.get('aladin_3').registeredAt = '2026-11-19T00:00:00Z'; S._saleIdxX = null");
  ok(run(ctx, "buypSoldOf({ lid: 'aladin_3' })") === null, 'buypSoldOf: 등록 전 판매는 경고 안 함');
}

console.log('③ ckLineIn — 묶음 밖 같은 ISBN 상품 판매를 묶음으로 세지 않음');
{ const ctx = seed(ctxWith(['kMs', 'lineGrade', 'ckIsbPl', 'ckLineIn'], {}));
  ctx.__C = {}; ctx.ckS = () => ctx.__C;
  const ms = Date.parse('2026-11-18T03:00:00Z');
  const isb = new Set(['9780000000001', '9780000000002']);
  const it = (isbn, price) => ({ isbn13: isbn, price, qty: 1, lineStatus: 'normal' });
  ctx.A = it('9780000000001', 5000); ctx.B = it('9780000000002', 3000); ctx.ms = ms; ctx.isb = isb;
  ok(run(ctx, "ckLineIn(A, null, new Set(['aladin_1']), isb, ms)") === true, 'ISBN 하나뿐 · 그 상품이 묶음 안 → 셈');
  ok(run(ctx, "ckLineIn(B, null, new Set(['aladin_2']), isb, ms)") === false, '같은 ISBN 하나는 묶음 밖 · 못 좁힘 → 묶음으로 안 셈(예전엔 셈)');
  ok(run(ctx, "ckLineIn(B, null, new Set(['aladin_2', 'aladin_3']), isb, ms)") === true, '같은 ISBN 상품 모두 묶음 안 → 셈');
  run(ctx, "S.plist.get('aladin_3').price = 4000; __C.ipl = null");
  ok(run(ctx, "ckLineIn(B, null, new Set(['aladin_2']), isb, ms)") === true, '판매가로 묶음 안 하나로 좁혀지면 셈');
  ok(run(ctx, "ckLineIn(B, null, new Set(['aladin_3']), isb, ms)") === false, '판매가로 묶음 밖 상품으로 좁혀지면 안 셈');
  run(ctx, "S.plist.get('aladin_3').price = 3000; S.plist.get('aladin_3').registeredAt = '2026-11-19T00:00:00Z'; __C.ipl = null");
  ok(run(ctx, "ckLineIn(B, null, new Set(['aladin_2']), isb, ms)") === true, '주문 뒤 등록한 묶음 밖 상품은 후보에서 뺌');
  ok(run(ctx, "ckLineIn(A, 'aladin_2', new Set(['aladin_1']), isb, ms)") === false, '번호가 우리 다른 상품을 가리키면 그 상품으로(그대로)');
  ok(run(ctx, "ckLineIn(A, null, null, isb, ms)") === true, '묶음 없음(전체) = 모두 셈(그대로)');
  ok((H.match(/ckLineIn\(it, k, keys, isb, oms\)/g) || []).length === 2, 'ckSoldAgg·ckSoldPer 둘 다 주문 시각(oms)을 넘김');
}

console.log(fail ? `❌ ${fail}개 실패` : '✅ 모두 통과');
process.exit(fail ? 1 : 0);
