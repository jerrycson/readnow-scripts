/* 로그인 소유권은 IndexedDB 거래로 확인한다. localStorage는 기존 화면을 위한 표시 사본이며 잠금만으로 최신 읽기를 보장하지 않는다. */
(function(root, make) { 'use strict'; const api = make(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BQTokenStore = api; })(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const KEY = 'bq-tok', LOCK = 'bq-shop-token-v1', DB = 'bq-shop-token-v2', VERSION = 2;
  const ACTIONS = ['login', 'join', 'asIn', 'pw', 'out', 'bye', 'expired'];
  const fault = (code, message) => Object.assign(new Error(message), { tokenStore: true, code });
  const storageError = () => fault('storage', '이 기기의 로그인 정보를 저장하거나 정리하지 못했습니다 — 브라우저 저장 설정을 확인한 뒤 다시 해 주세요');
  const changed = () => fault('changed', '다른 화면에서 로그인 상태가 바뀌었습니다 — 새 계정의 정보를 보존했습니다');
  const unavailable = () => fault('unavailable', '로그인 정보 저장 기능을 사용할 수 없습니다 — 지원되는 최신 브라우저에서 다시 확인해 주세요');
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const validRevision = n => Number.isSafeInteger(n) && n >= 0 && n < Number.MAX_SAFE_INTEGER;
  const validId = id => typeof id === 'string' && /^[0-9a-f]{32}$/.test(id);
  const validHash = hash => typeof hash === 'string' && /^[0-9a-f]{64}$/.test(hash);
  function validMeta(m) {
    if (!m || m.schema !== VERSION || typeof m.token !== 'string' || !validRevision(m.revision) || (m.revision === 0 ? m.last !== null : !validId(m.last))) throw storageError();
    return m;
  }
  function validProof(p) {
    if (!p || p.schema !== VERSION || !validId(p.id) || !validRevision(p.revision) || !validHash(p.hash) || !ACTIONS.includes(p.action)) throw storageError();
    return p;
  }
  function create(env) {
    env = env || globalThis;
    const timing = { set: globalThis.setTimeout.bind(globalThis), clear: globalThis.clearTimeout.bind(globalThis) };
    function read() { try { if (env.BQA && env.BQA.SESSION_PROTOCOL !== VERSION) throw unavailable(); const value = env.localStorage.getItem(KEY); if (value !== null && typeof value !== 'string') throw storageError(); return value || ''; } catch (e) { throw storageError(); } }
    function mirror(token) {
      if (read() === token) return;
      try { if (token) env.localStorage.setItem(KEY, token); else env.localStorage.removeItem(KEY); } catch (e) { throw storageError(); }
      if (read() !== token) throw storageError();
    }
    // 사본을 복구해도 앞선 화면의 동작을 새 계정으로 이어서 보내지 않는다.
    function owner(m, expected, revision) {
      if (typeof expected !== 'string') throw storageError();
      if (m.token !== expected || (revision !== undefined && revision !== m.revision) || read() !== m.token) { mirror(m.token); throw changed(); }
      return m;
    }
    async function locked(fn) {
      let timer, entered = false;
      try {
        const locks = env.navigator && env.navigator.locks;
        if (!locks || typeof locks.request !== 'function' || typeof env.AbortController !== 'function') throw unavailable();
        const ctl = new env.AbortController(); timer = timing.set(() => ctl.abort(), 5000);
        return await locks.request(LOCK, { mode: 'exclusive', signal: ctl.signal }, lock => {
          timing.clear(timer); timer = null;
          if (!lock || lock.name !== LOCK || lock.mode !== 'exclusive') throw storageError();
          entered = true; return fn();
        });
      } catch (e) {
        if (entered || (e && e.tokenStore)) throw e;
        if (e && e.name === 'AbortError') throw fault('busy', '다른 화면의 로그인 정보 저장을 기다리고 있습니다 — 잠시 뒤 다시 해 주세요');
        throw storageError();
      } finally { if (timer != null) timing.clear(timer); }
    }
    function open() {
      return new Promise((resolve, reject) => {
        let req, ended = false;
        const finish = (err, db) => { if (ended) { if (db) db.close(); return; } ended = true; timing.clear(timer); err ? reject(storageError()) : resolve(db); };
        const timer = timing.set(() => finish(storageError()), 5000);
        try { if (!env.indexedDB) throw unavailable(); req = env.indexedDB.open(DB, 1); } catch (e) { finish(e); return; }
        req.onupgradeneeded = () => { if (ended) { req.transaction.abort(); return; } const db = req.result; db.createObjectStore('meta'); db.createObjectStore('intents', { keyPath: 'id' }); };
        req.onerror = () => finish(req.error); req.onblocked = () => finish(storageError());
        req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); finish(null, req.result); };
      });
    }
    async function transaction(work) {
      const db = await open();
      try { return await new Promise((resolve, reject) => {
        let tx, result, error, ended = false;
        const finish = err => { if (ended) return; ended = true; timing.clear(timer); err ? reject(err) : resolve(result); };
        const fail = e => { error = e && e.tokenStore ? e : storageError(); try { tx.abort(); } catch (e) { finish(error); } };
        const timer = timing.set(() => { fail(storageError()); finish(storageError()); }, 5000);
        try {
          tx = db.transaction(['meta', 'intents'], 'readwrite', { durability: 'strict' });
          tx.oncomplete = () => finish(); tx.onabort = () => finish(error || storageError()); tx.onerror = () => { error = error || storageError(); };
          if (tx.durability !== 'strict') { fail(storageError()); return; }
          const s = { meta: tx.objectStore('meta'), intents: tx.objectStore('intents'), done: v => { result = v; } };
          s.get = (req, fn) => { req.onsuccess = () => { try { fn(req.result); } catch (e) { fail(e); } }; };
          s.get(s.meta.get('initialized'), initialized => s.get(s.meta.get('current'), value => {
            // 구형 저장값의 이관은 처음 한 번만. 이미 생긴 장부를 사본으로 다시 초기화하지 않는다.
            if ((value === undefined && initialized !== undefined) || (value !== undefined && initialized !== VERSION)) throw storageError();
            const m = value === undefined ? { schema: VERSION, revision: 0, token: read(), last: null } : validMeta(value);
            if (value === undefined) { s.meta.add(m, 'current'); s.meta.add(VERSION, 'initialized'); }
            work(s, m);
          }));
        } catch (e) { fail(e); }
      }); } finally { db.close(); }
    }
    async function hash(token) {
      try { if (!env.crypto || !env.crypto.subtle) throw unavailable(); return hex(new Uint8Array(await env.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))); } catch (e) { throw storageError(); }
    }
    function intent(s, p, fn) {
      validProof(p);
      s.get(s.intents.get(p.id), i => {
        if (!i || i.schema !== VERSION || i.id !== p.id || i.revision !== p.revision || i.hash !== p.hash || i.action !== p.action || !['prepared', 'sent', 'committed'].includes(i.state)) throw storageError();
        fn(i);
      });
    }
    function check(expected, revision) { return locked(async () => {
      const m = await transaction((s, m) => s.done(m)); owner(m, expected, revision); return m.revision;
    }); }
    async function prepare(expected, action) {
      if (typeof expected !== 'string' || !ACTIONS.includes(action)) throw storageError();
      const ownerHash = await hash(expected); let id;
      try { id = hex(env.crypto.getRandomValues(new Uint8Array(16))); } catch (e) { throw storageError(); }
      return locked(async () => {
        const result = await transaction((s, m) => {
          // 사본 수선은 거래 뒤에 하고, 이 화면의 시도는 거절한다.
          if (m.token !== expected || read() !== m.token) return s.done({ mismatch: m });
          const p = { schema: VERSION, id, revision: m.revision, hash: ownerHash, action };
          s.intents.add({ ...p, state: 'prepared' }); s.done({ proof: p });
        });
        if (result.mismatch) { owner(result.mismatch, expected); throw changed(); }
        return Object.freeze(result.proof);
      });
    }
    // 인증 확인과 fetch 호출 사이에는 다른 작성자가 끼지 못한다. 네트워크 응답은 잠금 밖에서 기다린다.
    function withOwner(expected, dispatch, proof) { return locked(async () => {
      if (typeof expected !== 'string' || typeof dispatch !== 'function') throw storageError();
      const result = await transaction((s, m) => {
        if (m.token !== expected || read() !== m.token) return s.done({ mismatch: m });
        if (!proof) return s.done({ meta: m });
        intent(s, proof, i => {
          if (i.revision !== m.revision || i.state !== 'prepared' || i.action === 'expired') throw changed();
          s.intents.put({ ...i, state: 'sent' }); s.done({ meta: m });
        });
      });
      if (result.mismatch) { owner(result.mismatch, expected); throw changed(); }
      owner(result.meta, expected, proof ? proof.revision : undefined);
      const value = dispatch();
      if (value && typeof value.catch === 'function') value.catch(() => {});
      return { value, revision: result.meta.revision };
    }); }
    async function replace(next, expected, proof) {
      if (typeof next !== 'string' || typeof expected !== 'string') throw storageError();
      validProof(proof);
      if (proof.hash !== await hash(expected) || (proof.action === 'expired' && next !== '')) throw storageError();
      const resultHash = await hash(next);
      return locked(async () => {
        const result = await transaction((s, m) => intent(s, proof, i => {
          if (i.state === 'committed') {
            if (i.resultHash !== resultHash || i.resultRevision !== m.revision || m.last !== i.id || m.token !== next) throw changed();
            return s.done(m);
          }
          if ((i.state !== 'sent' && i.action !== 'expired') || i.revision !== m.revision || m.token !== expected) throw changed();
          const n = { schema: VERSION, revision: m.revision + 1, token: next, last: i.id };
          validMeta(n); s.meta.put(n, 'current');
          s.intents.put({ ...i, state: 'committed', resultHash, resultRevision: n.revision }); s.done(n);
        }));
        // 확정 거래 뒤 사본 저장 실패는 같은 작업표로만 복구한다. 이전 열쇠로 새 서버 요청을 보내지 않는다.
        mirror(result.token); return result.token;
      });
    }
    return { version: VERSION, read, check, prepare, withOwner, replace };
  }
  return { create, KEY, LOCK, DB, VERSION };
});
