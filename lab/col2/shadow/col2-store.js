/* col2-store.js — 번외 시험 환경의 저장 막이
 * Firestore: 읽기는 어느 칸이든(운영 결과와 견주려고 prd_books·prd_ids를 읽기만) · 쓰기는 col2_* 칸만 — 그 밖은 막고 막은 것을 셈(운영 자료를 절대 바꾸지 않음)
 * 기기 저장: 열쇠 머리 rn3- 만(운영 rn-·리드나우2 rn2-와 안 겹침)
 * (0.1.1) relayDb — 비교 화면은 Firebase에 로그인하지 않고, 그 PC에 열린 운영 웹앱이 번외 도우미를 거쳐 대신 읽고 씀 */
(function (root) {
  'use strict';
  const PFX = 'col2_', LSP = 'rn3-';
  const clean = (v) => JSON.parse(JSON.stringify(v, (k, x) => (x === undefined ? null : x)));
  function make(db) { const blocked = [];
    const guard = (col) => { if (!String(col || '').startsWith(PFX) || String(col).includes('/')) { blocked.push({ col: String(col), at: Date.now() }); const e = new Error(`번외 시험 환경은 ${PFX}* 칸에만 씁니다 — '${col}' 쓰기를 막음`); e.blocked = true; throw e; } };
    return {
      get: async (col, id) => { const s = await db.collection(col).doc(String(id)).get(); return s.exists ? s.data() : null; },
      sample: async (col, n) => { const q = await db.collection(col).limit(n).get(); return q.docs.map((d) => ({ id: d.id, ...d.data() })); },
      set: async (col, id, v, merge) => { guard(col); await db.collection(col).doc(String(id)).set(clean(v), merge ? { merge: true } : undefined); },
      add: async (col, v) => { guard(col); const r = await db.collection(col).add(clean(v)); return r.id; },
      blocked,
    }; }
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(LSP + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(LSP + k, JSON.stringify(v)); } catch (e) {} },
  };
  /* (0.1.1 정범님 11/05 밤 '구글로 로그인이 실패') 웹앱 대신 기록 — Firestore 모양(compat의 이 화면이 쓰는 만큼)을 흉내 내는 db
   * 읽기: 번외 도우미에 부탁(/relay/get · /relay/sample) → 그 PC에 열린 운영 웹앱(이미 로그인)이 읽어 넘김 → 받을 때까지 기다림
   * 쓰기: 번외 도우미에 맡김(/relay/put · col2_* 만) → 웹앱이 대신 씀. 막이(make)는 이 db 위에 그대로 씌움(col2_* 밖은 여기 오기 전에 막힘)
   * call(path, body) = 도우미 POST · waitMs = 웹앱 답을 기다릴 최대 시간 */
  function relayDb(call, o) { o = o || {}; const waitMs = o.waitMs || 90e3, step = o.stepMs || 1000; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const late = () => { const e = new Error('웹앱이 대신 읽어 주지 않음 — 이 PC에서 리드나우 웹앱(로그인된 것)을 열어 두세요 (relay-timeout)'); e.code = 'relay-timeout'; return e; };
    const bad = (j) => { const e = new Error((j && j.err) || '도우미 응답이 이상함'); e.code = (j && j._code) || 'relay-bad'; return e; };
    async function ask(pathName, body) { const t0 = Date.now(); for (let k = 0; ; k++) { const j = await call(pathName, k ? { ...body, ask: false } : body); if (!j || !j.ok) throw bad(j); if (j.have) return j; if (Date.now() - t0 > waitMs) throw late(); await sleep(step); } }
    const docRef = (c, id) => ({ id, get: async () => { const j = await ask('/relay/get', { c, id }); return { id, exists: j.v != null, data: () => (j.v == null ? undefined : j.v) }; },
      set: async (v, opt) => { const j = await call('/relay/put', { c, id, v, merge: !!(opt && opt.merge) }); if (!j || !j.ok) throw bad(j); } });
    return { collection(c) { return { doc: (id) => docRef(c, String(id)), add: async (v) => { const id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await docRef(c, id).set(v); return { id }; },
      limit: (n) => ({ get: async () => { const j = await ask('/relay/sample', { n, ask: true }); return { docs: (j.list || []).map((b) => ({ id: b.id, data: () => b })) }; } }) }; } }; }
  const api = { make, ls, PFX, LSP, clean, relayDb };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Store = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
