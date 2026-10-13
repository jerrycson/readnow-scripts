/* 가짜 Firestore — 휴대폰 출고 화면 시험용. window.__SEED = { 'col/doc': data, 'col': [{id,data}] } · 서버 지연 window.__LAT(ms) */
(function () { const LAT = () => (window.__LAT || 350); const SEED = window.__SEED || {}; window.__FW = []; window.__FREADS = 0;
  const later = (fn) => setTimeout(fn, LAT());
  const docSnap = (path, data) => ({ id: path.split('/').pop(), exists: data != null, data: () => (data == null ? undefined : JSON.parse(JSON.stringify(data))), metadata: { fromCache: false, hasPendingWrites: false }, ref: mkDoc(path) });
  const colDocs = (name) => { const v = SEED[name]; return Array.isArray(v) ? v : []; };
  const qSnap = (name) => { const L = colDocs(name).map((x) => docSnap(name + '/' + x.id, x.data)); return { docs: L, size: L.length, empty: !L.length, forEach: (f) => L.forEach(f), docChanges: () => L.map((d) => ({ type: 'added', doc: d })), metadata: { fromCache: false } }; };
  const subs = {}; const emit = (path) => { (subs[path] || []).forEach((cb) => cb(docSnap(path, SEED[path]))); };
  function mkDoc(path) { const d = { id: path.split('/').pop(), path,
      collection: (n) => mkCol(path + '/' + n),
      get: () => new Promise((r) => { window.__FREADS++; later(() => r(docSnap(path, SEED[path]))); }),
      onSnapshot: (...a) => { const cb = a.find((x) => typeof x === 'function'); (subs[path] = subs[path] || []).push(cb); window.__FREADS++; later(() => cb(docSnap(path, SEED[path]))); return () => { subs[path] = (subs[path] || []).filter((x) => x !== cb); }; },
      set: (v, o) => { window.__FW.push(['set', path, v]); SEED[path] = o && o.merge ? { ...(SEED[path] || {}), ...v } : v; setTimeout(() => emit(path), 0); return new Promise((r) => later(r)); },
      update: (v) => d.set(v, { merge: true }), delete: () => Promise.resolve() };
    return d; }
  function mkCol(name) { const q = { id: name, where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q, endBefore: () => q, limitToLast: () => q,
      get: () => new Promise((r) => { window.__FREADS++; later(() => r(qSnap(name))); }),
      onSnapshot: (...a) => { const cb = a.find((x) => typeof x === 'function'); window.__FREADS++; later(() => cb(qSnap(name))); return () => {}; },
      doc: (id) => mkDoc(name + '/' + (id || ('auto' + Math.random().toString(36).slice(2, 10)))),
      add: (v) => { const id = 'auto' + Math.random().toString(36).slice(2, 10); window.__FW.push(['add', name, v]); (SEED[name] = SEED[name] || []).push({ id, data: v }); return new Promise((r) => later(() => r(mkDoc(name + '/' + id)))); } };
    return q; }
  const FDB = { collection: mkCol, doc: (p) => mkDoc(p), enablePersistence: () => Promise.resolve(), batch: () => { const ops = []; return { set: (ref, v, o) => ops.push(() => ref.set(v, o)), update: (ref, v) => ops.push(() => ref.update(v)), delete: () => {}, commit: () => Promise.all(ops.map((f) => f())) }; }, runTransaction: async (fn) => fn({ get: (ref) => ref.get(), set: (ref, v, o) => ref.set(v, o), update: (ref, v) => ref.update(v) }), settings: () => {} };
  const real = firebase.firestore; const f = function () { return FDB; }; Object.keys(real).forEach((k) => { try { f[k] = real[k]; } catch (e) {} }); f.FieldValue = real.FieldValue; f.Timestamp = real.Timestamp; firebase.firestore = f;
  window.__emit = emit; })();
