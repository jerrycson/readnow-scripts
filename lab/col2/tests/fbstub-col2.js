/* 시험용 가짜 Firebase(compat 모양 · 이 시험에 필요한 만큼) — 실제 Firebase에는 아무것도 쓰지 않음
 * 처음 자료 window.__FS_SEED { 칸: { id: 문서 } } · 쓴 것은 window.__FSW [{ c, id, op }] 에 기록 */
(function () {
  const FS = (window.__FS = JSON.parse(JSON.stringify(window.__FS_SEED || {}))); window.__FSW = [];
  const col = (c) => (FS[c] = FS[c] || {});
  const snap = (c, id) => ({ id, exists: col(c)[id] != null, data: () => (col(c)[id] == null ? undefined : JSON.parse(JSON.stringify(col(c)[id]))) });
  const docRef = (c, id) => ({ id, get: async () => snap(c, id), set: async (v, o) => { col(c)[id] = o && o.merge ? { ...(col(c)[id] || {}), ...v } : JSON.parse(JSON.stringify(v)); window.__FSW.push({ c, id, op: 'set' }); } });
  const colRef = (c) => ({ doc: (id) => docRef(c, id || Math.random().toString(36).slice(2, 10)), add: async (v) => { const id = Math.random().toString(36).slice(2, 10); await docRef(c, id).set(v); return { id }; },
    limit: (n) => ({ get: async () => ({ docs: Object.keys(col(c)).slice(0, n).map((id) => snap(c, id)) }) }) });
  const user = window.__FB_NOUSER ? null : { uid: 'u1', email: 'tester@example.com' }; const subs = [];
  const auth = () => ({ get currentUser() { return user; }, onAuthStateChanged: (f) => { subs.push(f); setTimeout(() => f(user)); return () => {}; }, signInWithPopup: async () => { throw new Error('시험에선 로그인 창 없음'); } });
  auth.GoogleAuthProvider = function () {};
  window.firebase = { apps: [], initializeApp(cfg) { this.apps.push({ cfg }); window.__FB_CFG = cfg; return {}; }, auth, firestore: () => ({ collection: colRef }) };
})();
