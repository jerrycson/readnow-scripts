/* 장바구니의 모든 작성자는 같은 잠금을 얻은 뒤 최신 목록을 읽는다. 저장 실패를 성공으로 바꾸지 않는다. */
(function (root, make) {
  'use strict';
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BQCartStore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const LOCK = 'bq-shop-cart-v1';
  const fault = (code, message) => Object.assign(new Error(message), { cartStore: true, code });
  const failed = () => fault('storage', '장바구니를 안전하게 저장하지 못했습니다 — 저장 공간과 브라우저 설정을 확인한 뒤 다시 해 주세요');
  const changed = () => fault('changed', '다른 화면에서 장바구니가 바뀌었습니다 — 상품과 합계를 다시 확인해 주세요');
  const stamp = list => JSON.stringify(list);
  function create(env) {
    env = env || globalThis;
    const storage = () => { try { return env.localStorage; } catch (e) { throw failed(); } };
    function array(key) {
      try { const raw = storage().getItem(key), value = raw == null ? [] : JSON.parse(raw); if (!Array.isArray(value)) throw failed(); return value; } catch (e) { throw failed(); }
    }
    function rows(list) {
      const ids = new Set(), entries = new Set();
      if (!Array.isArray(list)) throw failed();
      for (const x of list) {
        if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id || ids.has(x.id) || (x.n != null && (!Number.isInteger(x.n) || x.n < 1))) throw failed();
        ids.add(x.id);
        if (x._entry != null) { if (typeof x._entry !== 'string' || !x._entry || entries.has(x._entry)) throw failed(); entries.add(x._entry); }
      }
      return list;
    }
    const read = () => rows(array('bq-cart'));
    function entries(list) {
      return rows(list).map(x => {
        if (x._entry) return x;
        if (!env.crypto || typeof env.crypto.randomUUID !== 'function') throw failed();
        return { ...x, _entry: env.crypto.randomUUID() };
      });
    }
    function write(key, value) {
      try { const text = JSON.stringify(value), s = storage(); s.setItem(key, text); if (s.getItem(key) !== text) throw failed(); } catch (e) { throw failed(); }
    }
    async function locked(work) {
      let timer;
      try {
        const locks = env.navigator && env.navigator.locks;
        if (!locks || typeof locks.request !== 'function' || typeof env.AbortController !== 'function') throw fault('unavailable', '장바구니 저장 기능을 사용할 수 없습니다 — 브라우저를 새로 고치거나 지원되는 최신 브라우저로 확인해 주세요');
        const ctl = new env.AbortController();
        timer = env.setTimeout(() => ctl.abort(), 5000);
        return await locks.request(LOCK, { mode: 'exclusive', signal: ctl.signal }, lock => {
          env.clearTimeout(timer); timer = null;
          if (!lock || lock.name !== LOCK || lock.mode !== 'exclusive') throw failed();
          // 이 안에서 네트워크·사용자 입력을 기다리지 않는다. 읽기·계산·저장이 한 차례에 끝난다.
          const result = work(); if (result && typeof result.then === 'function') throw failed(); return result;
        });
      } catch (e) {
        if (e && e.cartStore) throw e;
        if (e && e.name === 'AbortError') throw fault('busy', '다른 화면의 장바구니 저장을 기다리고 있습니다 — 잠시 뒤 다시 해 주세요');
        throw failed();
      } finally { if (timer != null) env.clearTimeout(timer); }
    }
    function update(reduce, expected) {
      return locked(() => {
        const current = read(); if (expected !== undefined && stamp(current) !== expected) throw changed();
        const out = reduce(current);
        if (!out || typeof out !== 'object' || typeof out.then === 'function') throw failed();
        if (!Object.prototype.hasOwnProperty.call(out, 'cart')) return { cart: current, value: out.value, changed: false };
        const next = entries(out.cart), isChanged = stamp(current) !== stamp(next);
        if (isChanged) write('bq-cart', next);
        return { cart: next, value: out.value, changed: isChanged };
      });
    }
    const prepare = expected => update(current => ({ cart: current }), expected).then(r => r.cart);
    function finish(saved) {
      return locked(() => {
        const r = saved && saved.state === 'completed' && saved.result && saved.result.receipt;
        if (!r || typeof r.no !== 'string' || typeof r.t !== 'string' || !Array.isArray(saved.cart) || rows(saved.cart).some(x => !x._entry) || !env.BQ || typeof env.BQ.cartAfterOrder !== 'function') throw failed();
        const current = read(), old = array('bq-orders');
        if (old.some(x => !x || typeof x !== 'object' || typeof x.no !== 'string')) throw failed();
        const mine = [r, ...old.filter(x => x.no !== r.no)].slice(0, 20), next = entries(env.BQ.cartAfterOrder(current, saved.cart));
        // 완료 영수증은 주문 장부에도 남아 있다. 둘째 쓰기 실패는 다음 복구 때 같은 결과로 다시 정리한다.
        if (stamp(mine) !== stamp(old)) write('bq-orders', mine);
        if (stamp(next) !== stamp(current)) write('bq-cart', next);
        return { receipt: r, cart: next };
      });
    }
    return { read, update, prepare, finish };
  }
  return { create, stamp, LOCK };
});
