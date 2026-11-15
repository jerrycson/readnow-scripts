/* Shared pure reservation transitions. No network, credentials or customer fields. */
(function (root, make) { const api = make(); if (typeof module === 'object' && module.exports) module.exports = api; else root.ReadnowStock = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const integer = (v) => Number.isSafeInteger(v) && v >= 0;
  const live = (h, now) => !!(h && h.on && !(h.until && Date.parse(h.until) < (now || Date.now())));
  const id = (lid, no) => encodeURIComponent(String(lid)) + '__' + encodeURIComponent(String(no));
  function valid(h) { return !!(h && h.schema === 2 && h.basis && h.basis.kind === 'physical-total' && h.basis.evidence && integer(h.basis.qty) && integer(h.basis.observedQty) && integer(h.reservedQty) && integer(h.committedQty) && h.reservedQty + h.committedQty <= h.basis.qty && !h.review); }
  function available(h, observed, enabled, now) {
    const q = integer(observed) ? observed : 0;
    if (!h || h.schema !== 2) return live(h, now) ? 0 : q;
    if (!valid(h) || observed !== h.basis.observedQty || live({ ...h, on: h.sold ? 1 : 0 }, now)) return 0;
    if (!enabled && (h.reservedQty || h.committedQty)) return 0;
    // A source quantity change needs a new verified basis (own sync or another sale).
    // Do not guess which reservations the source has already deducted.
    return Math.max(0, Math.min(q, h.basis.qty - h.reservedQty - h.committedQty));
  }
  const aggregate = (h, patch) => { const next = { ...h, ...patch }; next.on = 1; return next; };
  function reserve(h, entry, no, qty, observed, enabled, at) {
    if (!enabled || !valid(h)) throw new Error('재고 기준 확인 필요');
    if (entry) { if (entry.no === no && entry.qty === qty && entry.state === 'reserved') return { hold: h, entry, duplicate: true }; throw new Error('이미 사용한 예약 번호'); }
    if (!integer(qty) || qty < 1 || qty > available(h, observed, true)) throw new Error('예약 가능 수량 부족');
    return { hold: aggregate(h, { reservedQty: h.reservedQty + qty }), entry: { schema: 2, no, qty, state: 'reserved', at, basis: h.basis.evidence } };
  }
  function transition(h, entry, no, state, at) {
    if (!entry || entry.no !== no) throw new Error('해당 주문 예약 없음');
    if (entry.state === state) return { hold: h, entry, duplicate: true };
    if (!['released', 'committed'].includes(state) || entry.state !== 'reserved' || !integer(entry.qty) || entry.qty < 1 || !integer(h.reservedQty) || h.reservedQty < entry.qty) throw new Error('예약 상태 확인 필요');
    return { hold: aggregate(h, { reservedQty: h.reservedQty - entry.qty, committedQty: (h.committedQty || 0) + (state === 'committed' ? entry.qty : 0) }), entry: { ...entry, state, changedAt: at } };
  }
  function legacyRelease(h, no, at, why) { if (!h || h.schema === 2 || h.sold || String(h.no || '') !== String(no)) return null; return { on: 0, freeAt: at, freeWhy: why }; }
  function migrate(h, order, basis, at) {
    if (h && h.schema === 2) return { hold: h, entry: null };
    const qty = order && order.qty;
    if (!basis || basis.kind !== 'physical-total' || !basis.evidence || !integer(basis.qty) || !integer(basis.observedQty) || (live(h) && (!order || order.no !== h.no || !integer(qty) || qty < 1 || qty > basis.qty))) return { hold: { ...(h || {}), on: 1, review: '기준 수량·대응 주문 확인 필요' }, entry: null };
    const active = live(h) && !h.sold;
    return { hold: { ...(h || {}), schema: 2, basis, reservedQty: active ? qty : 0, committedQty: 0, review: null, on: 1 }, entry: active ? { schema: 2, no: order.no, qty, state: 'reserved', at, basis: basis.evidence, migrated: true } : null };
  }
  function reconcile(h, basis) {
    if (!h || h.schema !== 2 || !basis || basis.kind !== 'physical-total' || !basis.evidence || basis.evidence === (h.basis || {}).evidence || !integer(basis.qty) || !integer(basis.observedQty) || basis.qty < h.reservedQty) throw new Error('새 실물 재고 확인 근거 필요');
    // Caller must verify all external sales/returns and retained reservations.
    return aggregate(h, { basis, committedQty: 0, sold: 0, until: null, review: null });
  }
  return { id, valid, available, reserve, transition, legacyRelease, migrate, reconcile };
});
