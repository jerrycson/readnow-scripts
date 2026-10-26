const fs = require('fs'); const src = fs.readFileSync('/home/claude/w/cloud/index.js', 'utf8');
const a = src.indexOf("const PVM_RX"); const b = src.indexOf("setInterval(() => pvMigTick()"); const code = src.slice(a, b);
const store = { prd_listings: {}, app_settings: {} };
for (let i = 0; i < 750; i++) { const id = 'aladin_U' + String(i).padStart(4, '0'); const ph = [{ src: 'https://x/cover500/c.jpg', stored: `img/listing/U${i}/1.jpg` }]; if (i % 2 === 0) for (let k = 3; k >= 1; k--) ph.push({ src: `https://image.aladin.co.kr/p/letslook/97_t${k}.jpg`, stored: `img/listing/U${i}/${5 - k}.jpg`, thumb: null, bytes: 10 }); if (i % 10 === 0) ph.splice(0, 1); store.prd_listings[id] = { photos: ph, photosAt: '2026-10-20', ...(i === 4 ? { previews: [{ stored: 'z' }], previewsAt: 'y' } : {}) }; }
const writes = [];
const docRef = (c, id) => ({ id, get: async () => ({ data: () => store[c][id] && JSON.parse(JSON.stringify(store[c][id])) }), set: async (v, o) => { writes.push([c, id]); store[c][id] = o && o.merge ? { ...(store[c][id] || {}), ...v } : v; } });
const C = (c) => ({ doc: (id) => docRef(c, id), orderBy: () => { const q = { _after: null, _lim: 1e9, select() { return q; }, limit(n) { q._lim = n; return q; }, startAfter(x) { q._after = x; return q; }, async get() { const ids = Object.keys(store[c]).sort().filter((x) => q._after == null || x > q._after).slice(0, q._lim); const docs = ids.map((id) => ({ id, ref: docRef(c, id), data: () => store[c][id] })); return { docs, empty: !docs.length, size: docs.length }; } }; return q; } });
const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), commit: async () => { for (const [r, v, o] of ops) await r.set(v, o); } }; } };
const FieldPath = { documentId: () => '__id' }; const nowIso = () => new Date().toISOString(); const W = () => ({ uploadedAt: 'ts' }); const log = (...x) => console.log(...x);
const f = new Function('C', 'db', 'FieldPath', 'nowIso', 'W', 'log', code + '; return pvMigTick;')(C, db, FieldPath, nowIso, W, log);
(async () => { for (let t = 0; t < 8; t++) await f(); const st = store.app_settings.previews_migrate; const L = store.prd_listings;
  const moved = Object.values(L).filter((v) => v.previewsFrom === 'photos').length; const ex = L.aladin_U0002;
  console.log(st.status, st.moved, st.pvOnly, moved, JSON.stringify(ex.previews.map((x) => [x.n, x.stored])), ex.photos.length, L.aladin_U0004.previews.length, L.aladin_U0001.previews);
  console.log(st.status === 'done' && st.moved === 374 && moved === 374 && st.pvOnly === 75 && ex.photos.length === 4 && ex.previews[0].n === 1 && ex.previews[0].stored === 'img/listing/U2/4.jpg' && L.aladin_U0004.previews.length === 1 && !L.aladin_U0001.previews ? '✓ 클라우드 옮기기 통과' : '❌ 실패'); })();
