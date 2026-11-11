/* 시험용 가짜 Firestore(서버 Admin SDK 모양 · cloud/col2solo.js가 쓰는 만큼) — 실제 Firebase에는 아무것도 쓰지 않음
 * 깊은 merge · FieldValue(serverTimestamp·delete·arrayUnion) · 트랜잭션(get·set·update) · where('==')·orderBy('__name__')·startAfter·limit · 하위 칸(doc.collection) */
'use strict';
const T = (k, v) => ({ __fv: k, v });
const FV = { serverTimestamp: () => T('ts'), delete: () => T('del'), arrayUnion: (...a) => T('au', a), increment: (n) => T('inc', n) };
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x) && !x.__fv;
const cp = (v) => JSON.parse(JSON.stringify(v));
function apply(cur, v, merge) { const out = merge && isObj(cur) ? { ...cur } : {};
  for (const [k, x] of Object.entries(v)) { if (x && x.__fv) { if (x.__fv === 'del') delete out[k]; else if (x.__fv === 'ts') out[k] = new Date().toISOString(); else if (x.__fv === 'au') { const a = Array.isArray(out[k]) ? out[k].slice() : []; for (const e of x.v) if (!a.some((y) => JSON.stringify(y) === JSON.stringify(e))) a.push(cp(e)); out[k] = a; } else if (x.__fv === 'inc') out[k] = (+out[k] || 0) + x.v; continue; }
    out[k] = merge && isObj(x) && isObj(out[k]) ? apply(out[k], x, true) : isObj(x) ? apply({}, x, false) : cp(x); }
  return out; }
function makeDb() { const store = {}; const writes = [];
  const col = (c) => (store[c] = store[c] || {});
  const snap = (c, id) => ({ id, exists: col(c)[id] != null, data: () => (col(c)[id] == null ? undefined : cp(col(c)[id])), ref: docRef(c, id) });
  function docRef(c, id) { return { id, _c: c, get: async () => snap(c, id), set: async (v, o) => { col(c)[id] = apply(col(c)[id], v, !!(o && o.merge)); writes.push({ c, id }); },
    update: async (v) => { if (col(c)[id] == null) throw Object.assign(new Error('없는 문서'), { code: 'not-found' }); col(c)[id] = apply(col(c)[id], v, true); writes.push({ c, id }); }, collection: (s) => colRef(c + '/' + id + '/' + s) }; }
  function query(c, f) { const q = { _f: f || { w: [], after: null, lim: 0 } };
    const nq = (p) => query(c, { ...q._f, ...p, w: p.w || q._f.w });
    q.where = (k, op, v) => nq({ w: q._f.w.concat([[k, op, v]]) }); q.orderBy = () => nq({}); q.startAfter = (a) => nq({ after: a }); q.limit = (n) => nq({ lim: n });
    q.get = async () => { let ids = Object.keys(col(c)).sort(); ids = ids.filter((id) => q._f.w.every(([k, op, v]) => op === '==' && col(c)[id][k] === v)); if (q._f.after != null) ids = ids.filter((id) => id > q._f.after); if (q._f.lim) ids = ids.slice(0, q._f.lim);
      const docs = ids.map((id) => snap(c, id)); return { docs, size: docs.length, forEach: (fn) => docs.forEach(fn) }; };
    return q; }
  function colRef(c) { const q = query(c); return { ...q, doc: (id) => docRef(c, id) }; }
  const db = { collection: colRef, runTransaction: async (fn) => { const ops = []; const tx = { get: async (r) => snap(r._c, r.id), set: (r, v, o) => ops.push(() => r.set(v, o)), update: (r, v) => ops.push(() => r.update(v)) }; const out = await fn(tx); for (const o of ops) await o(); return out; } };
  return { db, C: (c) => db.collection(c), FV, store, writes, col }; }
module.exports = { makeDb, FV };
