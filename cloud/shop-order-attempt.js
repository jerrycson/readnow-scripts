'use strict';
// 비회원 주문의 재시도 계약. 원본 비밀값·조회 토큰·주문자 정보는 요청 장부에 저장하지 않는다.
const crypto = require('node:crypto');
const digest = v => crypto.createHash('sha256').update(v).digest('hex');
const hashToken = t => digest('bq|' + String(t || ''));
const canonical = v => Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v);
function parse(value) { if (value === undefined) return null; if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.id !== 'string' || typeof value.secret !== 'string' || !/^[0-9a-f]{32}$/.test(value.id || '') || !/^[0-9a-f]{64}$/.test(value.secret || '')) return { error: true }; return { id: value.id, secret: value.secret }; }
const requestHash = (value, uid) => digest(canonical({ value, uid: uid || null }));
const secretHash = attempt => digest(Buffer.from(attempt.secret, 'hex'));
const token = (attempt, no) => crypto.createHmac('sha256', Buffer.from(attempt.secret, 'hex')).update('readnow-shop-order:v1:' + attempt.id + ':' + no).digest('hex').slice(0, 32);
const sameHash = (a, b) => typeof a === 'string' && /^[0-9a-f]{64}$/.test(a) && crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const missing = () => [404, { ok: false, err: '주문 요청을 확인할 수 없습니다' }];
const review = () => [503, { ok: false, attemptReview: 1, err: '주문 요청 기록을 확인해야 합니다 — 새 주문을 보내지 말고 가게로 연락해 주세요' }];
function record(attempt, hash, out, at) { const [status, body] = out; if (![200, 400, 403, 409].includes(status)) throw new Error('기록할 수 없는 주문 결과'); const result = JSON.parse(JSON.stringify(body)); delete result.t;
  return { schema: 1, requestHash: hash, secretHash: secretHash(attempt), state: status === 200 ? 'completed' : 'rejected', result: { status, body: result }, at }; }
function reply(saved, attempt, hash) { if (!saved || !sameHash(saved.secretHash, secretHash(attempt))) return missing(); if (hash && saved.requestHash !== hash) return [409, { ok: false, attemptConflict: 1, err: '같은 주문 요청의 내용이 달라졌습니다 — 이전 처리 결과를 먼저 확인해 주세요' }];
  if (saved.schema !== 1 || !/^[0-9a-f]{64}$/.test(saved.requestHash || '') || !saved.result || !saved.result.body || !['completed', 'rejected'].includes(saved.state)) return review();
  const { status, body } = saved.result; if (saved.state === 'completed' ? status !== 200 || body.ok !== true || typeof body.no !== 'string' || !/^[A-Z0-9-]{1,30}$/.test(body.no) || !Array.isArray(body.items) : ![400, 403, 409].includes(status) || body.ok !== false) return review();
  return [status, { ...JSON.parse(JSON.stringify(body)), ...(saved.state === 'completed' ? { t: token(attempt, body.no) } : {}), orderProtocol: 1, requestId: attempt.id, attemptState: saved.state }]; }
async function read(C, attempt, hash, tx) { const get = ref => tx ? tx.get(ref) : ref.get(); const snap = await get(C('shop_order_attempts').doc(attempt.id)); if (!snap.exists) return null; const out = reply(snap.data(), attempt, hash); if (out[0] !== 200) return out;
  const order = await get(C('shop_orders').doc(out[1].no)); if (!order.exists || !sameHash(order.data().tokH, hashToken(out[1].t))) return review(); return out; }
module.exports = { hashToken, parse, requestHash, token, record, reply, read };
