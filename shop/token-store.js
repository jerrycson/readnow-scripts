/* 로그인 열쇠의 작성자는 같은 잠금 안에서 소유자를 확인하고 저장 결과를 다시 읽는다. */
(function(root, make) { 'use strict'; const api = make(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BQTokenStore = api; })(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const KEY = 'bq-tok', LOCK = 'bq-shop-token-v1';
  const fault = (code, message) => Object.assign(new Error(message), { tokenStore: true, code });
  const storageError = () => fault('storage', '이 기기의 로그인 정보를 저장하거나 정리하지 못했습니다 — 브라우저 저장 설정을 확인한 뒤 다시 해 주세요');
  const changed = () => fault('changed', '다른 화면에서 로그인 상태가 바뀌었습니다 — 새 계정의 정보를 보존했습니다');
  function create(env) {
    env = env || globalThis;
    const storage = () => { try { return env.localStorage; } catch (e) { throw storageError(); } };
    function read() { try { const value = storage().getItem(KEY); if (value !== null && typeof value !== 'string') throw storageError(); return value || ''; } catch (e) { throw storageError(); } }
    async function locked(fn) {
      let timer;
      try { const locks = env.navigator && env.navigator.locks; if (!locks || typeof locks.request !== 'function' || typeof env.AbortController !== 'function') throw fault('unavailable', '로그인 정보 저장 기능을 사용할 수 없습니다 — 지원되는 최신 브라우저에서 다시 확인해 주세요');
        const ctl = new env.AbortController(); timer = env.setTimeout(() => ctl.abort(), 5000);
        return await locks.request(LOCK, { mode: 'exclusive', signal: ctl.signal }, lock => { env.clearTimeout(timer); timer = null; if (!lock || lock.name !== LOCK || lock.mode !== 'exclusive') throw storageError(); const result = fn(); if (result && typeof result.then === 'function') throw storageError(); return result; });
      } catch (e) { if (e && e.tokenStore) throw e; if (e && e.name === 'AbortError') throw fault('busy', '다른 화면의 로그인 정보 저장을 기다리고 있습니다 — 잠시 뒤 다시 해 주세요'); throw storageError(); }
      finally { if (timer != null) env.clearTimeout(timer); }
    }
    function check(expected) { return locked(() => { if (typeof expected !== 'string' || read() !== expected) throw changed(); return expected; }); }
    function replace(next, expected) { return locked(() => {
      if (typeof next !== 'string' || typeof expected !== 'string') throw storageError();
      const current = read();
      // 앞선 쓰기는 끝났지만 확인 읽기만 실패한 경우도 같은 결과로 다시 확인한다.
      if (current === next) return next;
      if (current !== expected) throw changed();
      try { const s = storage(); if (next) s.setItem(KEY, next); else s.removeItem(KEY); } catch (e) { throw storageError(); }
      if (read() !== next) throw storageError();
      return next;
    }); }
    return { read, check, replace };
  }
  return { create, KEY, LOCK };
});
