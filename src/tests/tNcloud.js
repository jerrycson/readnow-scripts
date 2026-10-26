// (10/26 wN) 클라우드 📝 출고 시장 블록 다른 판매자 유의 사항 peerNoteTick — 노드에서 함수만 떼어 가짜 Firestore·가짜 화면으로 시험
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const a = src.indexOf('/* ── (정범님 10/26) 📝 출고 시장 블록'); const b = src.indexOf('/* ── ② 발송 요청 읽기'); const code = src.slice(a, b);
const RP = require(path.join(__dirname, '../readnow-products-core.js'));
const store = { prd_used_info: {}, shp_enrich: {}, shp_market: {}, shp_state: {}, prd_system: {}, prd_listings: {} }; const writes = [];
const ref = (c, id) => ({ id, _c: c, get: async () => ({ exists: !!store[c][id], data: () => store[c][id] }), set: async (v, o) => { writes.push([c, id]); store[c][id] = o && o.merge ? { ...(store[c][id] || {}), ...v } : v; }, collection: (s) => ({ doc: (vid) => ref(c + '/' + id + '/' + s, vid) }) });
const C = (c) => { store[c] = store[c] || {}; return { doc: (id) => ref(c, id), where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, get: async () => { const d = Object.entries(store[c]).filter(([, x]) => q._f.every(([k, o, y]) => x[k] === y)).map(([id, x]) => ({ id, data: () => x })); return { empty: !d.length, docs: d }; } }; return q; } }; };
const db = { getAll: async (...rs) => rs.map((r) => { store[r._c] = store[r._c] || {}; return { exists: !!store[r._c][r.id], data: () => store[r._c][r.id] }; }), batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => { store[r._c] = store[r._c] || {}; return r.set(v, o); }), commit: async () => { for (const f of ops) await f(); } }; } };
const reads = []; const PAGES = { m1: { note: '모서리 눌림', hasNote: true, photos: [{ src: 'https://x/a.jpg', where: 'desc', file: 'a.jpg' }], sellerPhotoCount: 1, photoDiff: true, found: true, _box: true }, s2: { note: '', hasNote: false, photos: [], sellerPhotoCount: 0, photoDiff: false, found: true, _box: true }, s3: { gate: true }, m4: { note: '밑줄 조금', hasNote: true, photos: [], found: true, _box: true } };
const p = { evaluate: async (fn, ...args) => { const s = fn.toString(); if (s.includes('peerNoteTargets')) return RP.peerNoteTargets(...args); reads.push(args[0]); const x = PAGES[args[0]]; return x ? JSON.parse(JSON.stringify(x)) : { err: '없음' }; } };
const ctx = { C, db, enrichMem: new Map(), lastConfirm: [], lastConfirmAt: null, lastDelivOrders: [], nowIso: () => new Date().toISOString(), log: () => {}, W: () => ({ writer: 'cloud' }), Date, Math, String, JSON, Number, Promise, Infinity, isFinite, Set, Map, console };
vm.runInNewContext(code + '\nthis.peerNoteTick = peerNoteTick; this._reset = () => { peerItemNext.clear(); };', ctx);
(async () => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
  store.shp_state.confirm = { orders: [{ orderNo: 'O1', items: [{ listingId: 'L1', grade: '중', price: 5000, title: '시험책' }] }] }; // PC가 읽은 주문확인요청(클라우드는 로그인 막힘)
  store.prd_system.settings = { usedInfoDays: 30 };
  store.shp_enrich.L1 = { key: 'aladin_U1', via: 'ours', mkt: { at: iso(now - 60e3), rows: [
    { r: 1, g: '상', p: 3000, lid: 's1', sc: '11', c: 'green' }, { r: 2, g: '중', p: 3500, lid: 'm1', sc: '12', c: 'green' }, { r: 3, g: '상', p: 4800, lid: 's2', sc: '13', c: 'green' },
    { r: 4, g: '중', p: 4900, lid: 'm2', sc: '14', c: 'red' }, { r: 5, g: '상', p: 5200, lid: 's3', sc: '15', c: 'green' }, { r: 6, g: '중', p: 6000, lid: 'm3', sc: '16', c: 'green', so: 1 },
    { r: 7, g: '중', p: 7000, lid: 'm4', sc: '17', c: 'green' }, { r: 8, g: '상', p: 9000, lid: 's4', sc: '18', c: 'green' }, { r: 9, g: '중', p: 5000, lid: 'o1', sc: '996008', c: 'ours' } ] } };
  store.prd_listings.aladin_U1 = { bookId: 'B1' };
  store.prd_used_info.m2 = { note: '이미 읽음', checkedAt: iso(now - 5 * 864e5), found: true, sig: 'x', versions: 1 }; // 30일 안 = 다시 안 읽음
  store.prd_used_info.s2 = { note: '예전 글', photos: [], checkedAt: iso(now - 40 * 864e5), found: true, sig: 'old', versions: 2 }; // 30일 지남 = 다시 읽음 → 빈 글이면 덮지 않음
  const r1 = await ctx.peerNoteTick(p, Date.now() + 20000);
  const R = { r1, reads: [...reads], m1: store.prd_used_info.m1, s2: store.prd_used_info.s2, m4: store.prd_used_info.m4, s3: store.prd_used_info.s3 || null, ver: store['prd_used_info/m1/v'] && Object.keys(store['prd_used_info/m1/v']) };
  reads.length = 0; ctx._reset(); const r2 = await ctx.peerNoteTick(p, Date.now() + 20000); R.r2 = r2; R.reads2 = [...reads];
  console.log(JSON.stringify(R, null, 1));
  const ok = JSON.stringify(R.reads.slice().sort()) === JSON.stringify(['m1', 'm4', 's1', 's2', 's3', 's4']) // 중 전부(m2는 30일 안·m3 판매 끝 제외) + 상 전후(s2 4800·s3 5200) · s1·s4·우리 줄은 안 읽음
    && R.reads[0] === 'm1' && R.m1 && R.m1.note === '모서리 눌림' && R.m1.bookId === 'B1' && R.m1.sellerCode === '12' && R.m1.versions === 1 && R.m1.checkedAt && R.ver && R.ver[0] === '0001'
    && R.s2.note === '예전 글' && R.s2.lastMissAt && R.s2.versions === 2 // 있던 글을 빈 것으로 덮지 않음
    && R.m4 && R.m4.note === '밑줄 조금' && !R.s3 // 로그인 화면은 건너뜀(기록·로그인 없음)
    && JSON.stringify(R.reads2) === '[]'; // 이미 읽은 것(시장 읽은 뒤 읽음)은 다시 안 읽음 · s3는 5분 뒤 다시
  console.log(ok ? '✓ tNcloud 통과' : '❌ tNcloud 실패');
})();
