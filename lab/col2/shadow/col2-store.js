/* col2-store.js — 번외 시험 환경의 저장 막이
 * Firestore: 읽기는 어느 칸이든(운영 결과와 견주려고 prd_books·prd_ids를 읽기만) · 쓰기는 col2_* 칸만 — 그 밖은 막고 막은 것을 셈(운영 자료를 절대 바꾸지 않음)
 * 기기 저장: 열쇠 머리 rn3- 만(운영 rn-·리드나우2 rn2-와 안 겹침) */
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
  const api = { make, ls, PFX, LSP, clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Store = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
