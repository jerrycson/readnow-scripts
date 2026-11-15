'use strict';
// Operator library only: not an HTTP route, no automatic migration or activation.
const stock = require('./shop-stock.js');
const crypto = require('node:crypto');
const stable = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
async function change(db, input) {
  const { listingId, evidence, actor, physicalQty, observedQty } = input;
  if (!listingId || typeof evidence !== 'string' || !evidence.trim() || typeof actor !== 'string' || !actor.trim()) throw new Error('상품·확인 근거·담당 필요');
  if (![physicalQty, observedQty].every(x => Number.isSafeInteger(x) && x >= 0)) throw new Error('확인 수량은 0 이상의 정수');
  const auditId = crypto.createHash('sha256').update(JSON.stringify([listingId, evidence])).digest('hex');
  const C = name => db.collection(name), ref = C('shop_holds').doc(String(listingId));
  let result;
  await db.runTransaction(async tx => {
    result = null;
    const ls = await tx.get(C('prd_listings').doc(String(listingId))), hs = await tx.get(ref);
    const prior = await tx.get(C('shop_stock_audit').doc(auditId));
    if (prior.exists) { const old = prior.data(), b = old.input || {}; if (b.physicalQty !== physicalQty || b.observedQty !== observedQty || old.mode !== (input.mode || 'migrate')) throw new Error('같은 확인 근거의 수량·작업이 달라짐'); result = { duplicate: true, audit: old }; return; }
    if (!ls.exists || ls.data().qty !== observedQty) throw new Error('판매처 수량이 달라짐 — 다시 확인');
    const h = hs.exists ? hs.data() : null, at = new Date().toISOString();
    const basis = { kind: 'physical-total', qty: physicalQty, observedQty, evidence, actor, at };
    let next, entryRef = null, order = null;
    if (h && h.schema === 2) {
      if (input.mode !== 'reconcile') throw new Error('이미 수량 예약 형식 — 재고 재확인 필요');
      next = { hold: stock.reconcile(h, basis), entry: null };
    } else {
      if (h && h.on && h.no && !h.sold) {
        const os = await tx.get(C('shop_orders').doc(String(h.no)));
        const o = os.exists ? os.data() : null;
        entryRef = C('shop_reservations').doc(stock.id(listingId, h.no));
        const old = await tx.get(entryRef); if (old.exists) throw new Error('예약 기록이 이미 있음 — 덮어쓰지 않음');
        if (o && ['new', 'paid'].includes(o.st)) { const items = (o.items || []).filter(x => String(x.lid) === String(listingId)); const qty = items.reduce((s, x) => s + x.qty, 0); if (items.length && items.every(x => Number.isSafeInteger(x.qty) && x.qty > 0) && Number.isSafeInteger(qty) && qty > 0) order = { no: String(h.no), qty }; }
      }
      next = stock.migrate(h, order, basis, at);
    }
    const stateHash = crypto.createHash('sha256').update(stable({ h: h || null, order, observedQty })).digest('hex');
    if (input.apply === true && input.expectedStateHash !== stateHash) throw new Error('미리보기 뒤 예약 상태가 달라졌거나 확인 번호 없음');
    const audit = { input: { physicalQty, observedQty }, stateHash, listingId: String(listingId), evidence, actor, at, mode: input.mode || 'migrate', before: h || null, after: next.hold, entry: next.entry, review: next.hold.review || null };
    result = { preview: input.apply !== true, stateHash, auditId, audit };
    if (input.apply === true) { tx.set(ref, next.hold); if (next.entry && entryRef) tx.set(entryRef, next.entry); tx.set(C('shop_stock_audit').doc(auditId), audit); }
  });
  return result;
}
module.exports = { change };
