/* 공용 예약 상태 전이. 네트워크·인증 정보·고객 정보 없이 계산만 수행. */
(function (root, make) { const api = make(); if (typeof module === 'object' && module.exports) module.exports = api; else root.ReadnowStock = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const integer = (v) => Number.isSafeInteger(v) && v >= 0;
  const live = (h, now) => !!(h && h.on && !(h.until && Date.parse(h.until) < (now || Date.now())));
  const id = (lid, no) => encodeURIComponent(String(lid)) + '__' + encodeURIComponent(String(no));
  function consistent(h) { return !!(h && h.schema === 2 && h.basis && h.basis.kind === 'physical-total' && h.basis.evidence && integer(h.basis.qty) && integer(h.basis.observedQty) && integer(h.reservedQty) && integer(h.committedQty) && h.reservedQty + h.committedQty <= h.basis.qty); }
  function valid(h) { return consistent(h) && !h.review; }
  function available(h, observed, enabled, now) {
    const q = integer(observed) ? observed : 0;
    if (!h || h.schema !== 2) return live(h, now) ? 0 : q;
    if (!valid(h) || observed !== h.basis.observedQty || live({ ...h, on: h.sold ? 1 : 0 }, now)) return 0;
    if (!enabled && (h.reservedQty || h.committedQty)) return 0;
    // 판매처 수량이 바뀌면 자체 동기화인지 외부 판매인지 확인한 새 기준이 필요.
    // 판매처가 어느 예약을 이미 차감했는지 추정하지 않음.
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
    if (!consistent(h)) throw new Error('예약 합계 확인 필요');
    if (!entry || entry.no !== no) throw new Error('해당 주문 예약 없음');
    if (entry.state === state) return { hold: h, entry, duplicate: true };
    if (state === 'committed' && h.review) throw new Error('출고 전 재고 확인 필요');
    if (!['released', 'committed'].includes(state) || entry.state !== 'reserved' || !integer(entry.qty) || entry.qty < 1 || !integer(h.reservedQty) || h.reservedQty < entry.qty) throw new Error('예약 상태 확인 필요');
    return { hold: aggregate(h, { reservedQty: h.reservedQty - entry.qty, committedQty: (h.committedQty || 0) + (state === 'committed' ? entry.qty : 0) }), entry: { ...entry, state, changedAt: at } };
  }
  function settle(h, entry, no, at, evidence) {
    if (!consistent(h) || !entry || entry.no !== no || !evidence) throw new Error('출고 정산 근거 확인 필요');
    if (entry.state === 'settled') return { hold: h, entry, duplicate: true };
    if (entry.state !== 'committed' || !integer(entry.qty) || entry.qty < 1 || h.committedQty < entry.qty) throw new Error('출고 정산 수량 확인 필요');
    return { hold: aggregate(h, { committedQty: h.committedQty - entry.qty }), entry: { ...entry, state: 'settled', settledAt: at, settlement: evidence } };
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
    if (!consistent(h) || !basis || basis.kind !== 'physical-total' || !basis.evidence || basis.evidence === (h.basis || {}).evidence || !integer(basis.qty) || !integer(basis.observedQty) || basis.qty < h.reservedQty + h.committedQty) throw new Error('새 실물 재고 확인 근거 필요');
    // 출고 대기 수량은 재확인만으로 풀지 않음. 확인된 출고는 같은 거래 안에서 settle 후 새 기준 반영.
    return aggregate(h, { basis, sold: 0, until: null, review: null });
  }
  return { id, valid, available, reserve, transition, settle, legacyRelease, migrate, reconcile };
});
