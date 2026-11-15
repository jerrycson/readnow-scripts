/* 주문 요청 장부: 탭 사이에 하나의 진행 요청을 공유한다. 개인정보·동의·주문 본문은 저장하지 않는다. */
(function (root, make) {
  'use strict';
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BQOrderJournal = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const DB = 'bq-order-journal-v1';
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const canonical = v => Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v);
  const safeError = message => Object.assign(new Error(message), { orderJournal: true });
  const fault = () => safeError('주문 확인 정보를 안전하게 저장하지 못했습니다 — 새 주문을 보내지 말고 다시 확인해 주세요');
  const conflict = () => safeError('앞선 주문 상태가 바뀌었습니다 — 처리 결과를 먼저 확인해 주세요');
  const terminal = r => r && (r.state === 'completed' || r.state === 'rejected');
  const receiptOK = r => !!(r && typeof r.no === 'string' && /^BQ\d{8}-[A-Z0-9]{5}$/.test(r.no) && typeof r.t === 'string' && /^[0-9a-f]{32}$/.test(r.t) && Number.isFinite(r.total) && r.total >= 0 && Number.isInteger(r.n) && r.n >= 1 && r.n <= 50);
  function rows(cart) {
    if (!Array.isArray(cart) || !cart.length || cart.length > 50) throw fault();
    const seen = new Set();
    return cart.map(x => {
      if (!x || typeof x.id !== 'string' || !x.id || typeof x._entry !== 'string' || !x._entry || seen.has(x._entry)) throw fault();
      const n = x.n == null ? 1 : x.n; if (!Number.isInteger(n) || n < 1 || n > 50) throw fault(); seen.add(x._entry);
      return { id: x.id, _entry: x._entry, n };
    });
  }
  function valid(r) {
    if (!r || r.schema !== 1 || !/^[0-9a-f]{32}$/.test(r.id || '') || !/^[0-9a-f]{64}$/.test(r.secret || '') || !/^[0-9a-f]{64}$/.test(r.bodyHash || '') || !['pending', 'completed', 'rejected'].includes(r.state)) throw fault();
    rows(r.cart);
    if (terminal(r) && (!r.result || r.result.state !== r.state || (r.state === 'completed' ? !receiptOK(r.result.receipt) : ![400, 403, 409].includes(r.result.status) || typeof r.result.err !== 'string'))) throw fault();
    return r;
  }
  // 서버가 이 요청의 확정 결과라고 확인한 응답만 끝난 일로 기록한다.
  function outcome(r, status, body) {
    if (!body || body.orderProtocol !== 1 || body.requestId !== r.id) return null;
    if (status === 200 && body.ok === true && body.attemptState === 'completed' && Array.isArray(body.items) && receiptOK({ ...body, n: body.items.length })) {
      return { state: 'completed', receipt: { no: body.no, t: body.t, total: body.total, n: body.items.length, at: r.at } };
    }
    if ([400, 403, 409].includes(status) && body.ok === false && body.attemptState === 'rejected' && typeof body.err === 'string') return { state: 'rejected', status, err: body.err.slice(0, 500) };
    return null;
  }
  function create(env) {
    env = env || globalThis;
    const idb = env.indexedDB, crypto = env.crypto;
    const timing = { set: globalThis.setTimeout.bind(globalThis), clear: globalThis.clearTimeout.bind(globalThis) };
    async function hash(body) {
      if (!crypto || !crypto.subtle || !crypto.getRandomValues) throw fault();
      return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(body)))));
    }
    function open() {
      return new Promise((resolve, reject) => {
        if (!idb) return reject(fault());
        let req, ended = false;
        const finish = (err, db) => { if (ended) { if (db) db.close(); return; } ended = true; timing.clear(timer); err ? reject(fault()) : resolve(db); };
        const timer = timing.set(() => finish(fault()), 5000);
        try { req = idb.open(DB, 1); } catch (e) { finish(e); return; }
        req.onupgradeneeded = () => { const db = req.result; db.createObjectStore('meta'); db.createObjectStore('attempts', { keyPath: 'id' }); };
        req.onerror = () => finish(req.error);
        req.onblocked = () => finish(fault());
        req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); finish(null, req.result); };
      });
    }
    async function transaction(write, work) {
      const db = await open();
      try {
        return await new Promise((resolve, reject) => {
          let tx, result, error, ended = false;
          const finish = err => { if (ended) return; ended = true; timing.clear(timer); err ? reject(err) : resolve(result); };
          const fail = err => { error = err && err.orderJournal ? err : fault(); try { tx.abort(); } catch (e) { finish(error); } };
          const timer = timing.set(() => { fail(fault()); finish(fault()); }, 5000);
          try {
            tx = db.transaction(['meta', 'attempts'], write ? 'readwrite' : 'readonly', write ? { durability: 'strict' } : undefined);
            tx.oncomplete = () => finish(); tx.onabort = () => finish(error || fault()); tx.onerror = () => { error = error || fault(); };
            if (write && tx.durability !== 'strict') { fail(fault()); return; }
            const stores = { meta: tx.objectStore('meta'), attempts: tx.objectStore('attempts'), done: v => { result = v; }, fail };
            stores.get = (req, fn) => { req.onsuccess = () => { try { fn(req.result); } catch (e) { fail(e); } }; };
            work(stores);
          } catch (e) { fail(fault()); }
        });
      } finally { db.close(); }
    }
    function snapshot(s, fn) {
      s.get(s.meta.get('current'), value => {
        const m = value === undefined ? { schema: 1, revision: 0, active: null } : value;
        if (!m || m.schema !== 1 || !Number.isSafeInteger(m.revision) || m.revision < 0 || (m.active !== null && !/^[0-9a-f]{32}$/.test(m.active || ''))) throw fault();
        if (m.active === null) return fn(m, null);
        s.get(s.attempts.get(m.active), r => fn(m, valid(r)));
      });
    }
    const read = () => transaction(false, s => snapshot(s, (m, r) => s.done({ revision: m.revision, active: r })));
    async function begin(revision, body, cart) {
      const bodyHash = await hash(body), clean = rows(cart);
      const id = hex(crypto.getRandomValues(new Uint8Array(16))), secret = hex(crypto.getRandomValues(new Uint8Array(32)));
      return transaction(true, s => snapshot(s, (m, r) => {
        if (r) return s.done({ revision: m.revision, active: r, created: false });
        if (m.revision !== revision) throw conflict();
        const active = { schema: 1, id, secret, bodyHash, cart: clean, at: new Date().toISOString(), state: 'pending' };
        s.attempts.add(active); s.meta.put({ ...m, active: id, revision: m.revision + 1 }, 'current');
        s.done({ revision: m.revision + 1, active, created: true });
      }));
    }
    async function matches(r, body) { valid(r); return r.bodyHash === await hash(body); }
    function settle(id, status, body) {
      return transaction(true, s => s.get(s.attempts.get(id), value => {
        const r = valid(value), next = outcome(r, status, body);
        if (!next) throw conflict();
        if (terminal(r)) { if (canonical(r.result) !== canonical(next)) throw conflict(); return s.done(r); }
        const saved = { ...r, state: next.state, result: next }; s.attempts.put(saved); s.done(saved);
      }));
    }
    // 결과를 확인한 화면에서 다음 구매를 연다. 이전 화면의 번호로 새 구매를 시작하지 못한다.
    function acknowledge(id, revision) {
      return transaction(true, s => snapshot(s, (m, r) => {
        if (!r || r.id !== id || m.revision !== revision || !terminal(r)) throw conflict();
        s.attempts.put({ ...r, acknowledged: true }); const next = { ...m, active: null, revision: m.revision + 1 };
        s.meta.put(next, 'current'); s.done({ revision: next.revision, active: null });
      }));
    }
    const receipts = () => transaction(false, s => s.get(s.attempts.getAll(), all => s.done(all.map(valid).filter(r => r.state === 'completed').map(r => r.result.receipt))));
    return { read, begin, matches, settle, acknowledge, receipts };
  }
  return { create, outcome, terminal };
});
