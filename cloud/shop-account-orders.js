'use strict';
// 계정의 보조 주문 목록. 새 접수는 주문과 같은 거래에서 쓰고 복구는 원본 소유권·조회 토큰을 확인한다.
const crypto = require('node:crypto');
const { hashToken } = require('./shop-order-attempt.js');
const noOK = no => typeof no === 'string' && /^BQ\d{8}-[A-Z0-9]{5}$/.test(no);
const tokenOK = t => typeof t === 'string' && /^[0-9a-f]{32}$/.test(t);
const active = user => !!(user && !user.gone && !user.arch && !user.test);
function receipt(value) {
  if (!value || !noOK(value.no) || !tokenOK(value.t) || !Number.isFinite(Date.parse(value.at)) || !Number.isFinite(value.total) || value.total < 0 || !Number.isInteger(value.n) || value.n < 1) throw new Error('계정 주문 연결 정보를 확인해야 합니다');
  return { no: value.no, t: value.t, at: value.at, total: value.total, n: value.n };
}
async function read(tx, C, uid) {
  const ref = C('shop_users').doc(uid), d = await tx.get(ref);
  return { ref, user: d.exists ? d.data() : null };
}
function append(tx, link, additions, at) {
  if (!active(link.user)) throw new Error('주문할 수 있는 계정 상태를 확인해야 합니다');
  const old = link.user.ords == null ? [] : link.user.ords;
  if (!Array.isArray(old)) throw new Error('기존 계정 주문 목록을 확인해야 합니다');
  const next = old.slice();
  for (const value of additions) {
    const r = receipt(value), i = next.findIndex(x => x && x.no === r.no);
    if (i < 0) next.push(r); else next[i] = { ...next[i], ...r };
  }
  const time = r => Number.isFinite(Date.parse(r && r.at)) ? Date.parse(r.at) : -Infinity;
  next.sort((a, b) => time(b) - time(a));
  const ords = next.slice(0, 200); // 기존 보조 목록의 200건 한도 유지. 원본 주문은 지우지 않는다.
  if (JSON.stringify(ords) === JSON.stringify(old)) return false;
  tx.set(link.ref, { ords, up: at }, { merge: true }); return true;
}
function matches(order, uid, token) {
  if (!order || order.uid !== uid || !tokenOK(token) || typeof order.tokH !== 'string' || !/^[0-9a-f]{64}$/.test(order.tokH)) return false;
  return crypto.timingSafeEqual(Buffer.from(order.tokH, 'hex'), Buffer.from(hashToken(token), 'hex'));
}
async function repair(db, C, uid, values, at) {
  const candidates = Array.isArray(values) ? values.slice(0, 20).filter(x => x && noOK(x.no) && tokenOK(x.t)) : [];
  if (!candidates.length) return false;
  return db.runTransaction(async tx => {
    const link = await read(tx, C, uid); if (!active(link.user)) return false;
    if (link.user.ords != null && !Array.isArray(link.user.ords)) throw new Error('기존 계정 주문 목록을 확인해야 합니다');
    // 이미 같은 조회 주소로 연결된 줄은 다시 읽거나 쓰지 않는다.
    const wanted = new Map();
    for (const r of candidates) if (!(link.user.ords || []).some(x => x && x.no === r.no && x.t === r.t) && !wanted.has(r.no)) wanted.set(r.no, r);
    const list = [...wanted.values()]; if (!list.length) return false;
    const docs = await tx.getAll(...list.map(x => C('shop_orders').doc(x.no)));
    const accepted = [];
    docs.forEach((d, i) => {
      const o = d.exists ? d.data() : null; if (!matches(o, uid, list[i].t) || o.no !== list[i].no || !Array.isArray(o.items)) return;
      try { accepted.push(receipt({ no: o.no, t: list[i].t, at: o.at, total: o.total, n: o.items.length })); } catch (e) { /* 손상된 원본을 정상 연결로 꾸미지 않는다. */ }
    });
    return accepted.length ? append(tx, link, accepted, at) : false;
  });
}
module.exports = { active, read, append, repair };
