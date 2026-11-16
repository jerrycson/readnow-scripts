/* ⟦jbn write guard 시작⟧ — 웹앱·아티팩트·클라우드가 같은 부분 수정 계약을 사용 */
(function (G) {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const TEXT = ['body', 'text', 'draft'];
  const value = (v) => v == null ? '' : String(v);
  function fail(code, id, field) {
    const e = new Error(code === 'note-conflict' ? '다른 기기에서 글이 바뀌었습니다 — 현재 글을 확인해 주세요' : '노트 저장 형식을 확인해 주세요');
    e.code = code; e.id = id; if (field) e.field = field; throw e;
  }
  function validate(ops) {
    if (!Array.isArray(ops) || !ops.length || ops.length > 60) fail('note-format');
    for (const o of ops) {
      if (!o || !['set', 'merge'].includes(o.op) || !/^[A-Za-z0-9_.:@+-]{1,120}$/.test(o.id || '') || /^\.\.?$/.test(o.id) || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) fail('note-format', o && o.id);
      if (o.base != null && (typeof o.base !== 'object' || Array.isArray(o.base))) fail('note-format', o.id);
      if (o.data._noBody) fail('note-incomplete', o.id, 'body');
    }
    return ops;
  }
  function plan(old, op, at, by) {
    validate([op]); const data = { ...op.data }; delete data._noBody;
    if (!old && op.op === 'set' && op.id !== '_meta' && !data.kind) data.kind = 'card';
    for (const k of TEXT) {
      if (!own(data, k)) continue;
      if (data[k] != null && typeof data[k] !== 'string') fail('note-format', op.id, k);
      // 같은 값의 재전송은 허용. 다른 값은 편집 시작 때 읽은 글이 지금도 같을 때만.
      if (old && value(old[k]) !== value(data[k]) && (!own(op.base, k) || value(op.base[k]) !== value(old[k]))) fail('note-conflict', op.id, k);
    }
    // set에서도 기존 문서에서 생략한 칸을 지우지 않고 최초 생성 시각을 보존.
    if (old && old.createdAt) data.createdAt = old.createdAt;
    else if (op.op === 'set' && !data.createdAt) data.createdAt = at;
    data.updatedAt = at; data.lastBy = by;
    data.rev = Math.max(0, Number.isSafeInteger(old && old.rev) ? old.rev : 0) + 1;
    return data;
  }
  function withBase(ops, docs) {
    return validate(ops).map(o => {
      const base = { ...(o.base || {}) }, old = docs.get(o.id) || {};
      if (old._noBody && own(o.data, 'body')) fail('note-incomplete', o.id, 'body');
      for (const k of TEXT) if (own(o.data, k) && !own(base, k)) base[k] = value(old[k]);
      return { ...o, data: { ...o.data }, base };
    });
  }
  async function write(db, refOf, ops, at, by) {
    validate(ops); if (!db || typeof db.runTransaction !== 'function') fail('note-transaction-unavailable');
    return db.runTransaction(async tx => {
      const refs = new Map(), state = new Map();
      for (const o of ops) if (!refs.has(o.id)) refs.set(o.id, refOf(o.id));
      // Firestore 읽기를 모두 먼저 수행. 충돌하면 묶음 전체를 쓰지 않음.
      for (const [id, ref] of refs) { const snap = await tx.get(ref); state.set(id, snap.exists ? snap.data() : null); }
      const pending = [];
      for (const o of ops) { const d = plan(state.get(o.id), o, at, by); state.set(o.id, { ...(state.get(o.id) || {}), ...d }); pending.push([refs.get(o.id), d]); }
      for (const [ref, d] of pending) tx.set(ref, d, { merge: true });
      return { n: ops.length, ids: ops.map(o => o.id), bad: [] };
    });
  }
  function serial(fn) {
    let tail = Promise.resolve();
    return (...args) => { const result = tail.then(() => fn(...args)); tail = result.catch(() => {}); return result; };
  }
  function client(store) {
    const chains = new Map();
    const send = serial(async ops => {
      const sent = ops.map(o => {
        const base = { ...o.base };
        for (const k of TEXT) {
          const prev = o.chain && chains.get(o.chain + ':' + o.id + ':' + k);
          if (prev && own(base, k) && (value(base[k]) === prev.from || prev.recent.includes(value(base[k])))) base[k] = prev.to;
        }
        const copy = { ...o, base }; delete copy.chain; return copy;
      });
      const result = await store.write(sent);
      if (!result || result.n !== sent.length || (result.bad && result.bad.length)) {
        const e = new Error('저장 결과를 확인하지 못했습니다 — 미저장 글에서 확인해 주세요');
        e.code = result && (result.bad || []).some(x => /note-conflict/.test(x)) ? 'note-conflict' : 'note-unconfirmed'; throw e;
      }
      ops.forEach((o, i) => { if (o.chain) for (const k of TEXT) if (own(o.data, k)) {
        const key = o.chain + ':' + o.id + ':' + k, prev = chains.get(key);
        chains.set(key, { from: prev ? prev.from : value(o.base[k]), to: value(sent[i].data[k]), recent: [...(prev ? prev.recent : []), value(o.base[k]), value(sent[i].data[k])].slice(-8) });
        if (chains.size > 32) chains.delete(chains.keys().next().value);
      } });
      return result;
    });
    return ops => send(withBase(ops, store.docs()));
  }
  function recovery(storage, key) {
    let entries = []; let durable = true;
    try { const raw = storage && storage.getItem(key); if (raw) { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) throw Error('format'); parsed.forEach(x => validate(x.ops)); entries = parsed; } }
    catch (e) { durable = false; }
    const persist = () => { try { if (!storage || !durable) throw Error('storage'); storage.setItem(key, JSON.stringify(entries)); return true; } catch (e) { durable = false; return false; } };
    return {
      list: () => entries,
      durable: () => durable && !!storage,
      put(id, ops) { validate(ops); const saved = JSON.parse(JSON.stringify(ops)); saved.forEach(o => { delete o.chain; }); entries = entries.filter(x => x.id !== id).concat({ id, ops: saved }); return persist(); },
      remove(id) { entries = entries.filter(x => x.id !== id); return persist(); }
    };
  }
  const api = { TEXT, value, validate, plan, withBase, write, serial, client, recovery };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else G.JBNWrite = api;
})(typeof window !== 'undefined' ? window : globalThis);
/* ⟦jbn write guard 끝⟧ */
